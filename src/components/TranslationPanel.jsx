import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Globe, X, FileText, BookOpen, Trash2, RefreshCw, Columns2, Eye, StopCircle, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  getActiveLanguages, extractPdfText, getGlossary, translatePage, translateRange,
  translateFullBook, translateChapter, deleteTranslations, retranslatePage,
  getBookTranslations, cancelTranslation,
} from "@/lib/translationEngine";

export default function TranslationPanel({ book, onClose, displayMode, onDisplayModeChange }) {
  const [languages, setLanguages] = useState([]);
  const [selectedLang, setSelectedLang] = useState("");
  const [method, setMethod] = useState("page");
  const [pageNumber, setPageNumber] = useState(1);
  const [fromPage, setFromPage] = useState(1);
  const [toPage, setToPage] = useState(10);
  const [chapters, setChapters] = useState([]);
  const [selectedChapter, setSelectedChapter] = useState("");
  const [translations, setTranslations] = useState([]);
  const [activePageIdx, setActivePageIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState("");

  // Load languages
  useEffect(() => {
    getActiveLanguages().then((langs) => {
      setLanguages(langs);
      if (langs.length > 0 && !selectedLang) setSelectedLang(langs[0].code);
    });
  }, []);

  // Load existing translations when language changes
  const loadTranslations = useCallback(async () => {
    if (!book?.id || !selectedLang) return;
    try {
      const existing = await getBookTranslations(book.id, selectedLang);
      setTranslations(existing);
      if (existing.length > 0) setActivePageIdx(0);
    } catch (e) {
      console.error("loadTranslations:", e);
    }
  }, [book?.id, selectedLang]);

  useEffect(() => {
    loadTranslations();
  }, [loadTranslations]);

  const selectedLangObj = languages.find((l) => l.code === selectedLang);
  const isRTL = selectedLangObj?.rtl ?? true;
  const fontFamily = selectedLangObj?.font_family || "";

  // ─── Translate handlers ─────────────────────────────────────────────────
  const handleTranslate = async () => {
    if (!selectedLang) {
      toast.error("اختر لغة الترجمة أولاً");
      return;
    }

    setLoading(true);
    setError("");
    setProgress(null);

    try {
      setExtracting(true);
      toast.info("جاري استخراج نص الكتاب...");
      const extractedData = await extractPdfText(book.pdf_url, book.id);
      setExtracting(false);

      if (extractedData?.table_of_contents?.length > 0) {
        setChapters(extractedData.table_of_contents);
      }

      const glossary = await getGlossary(selectedLang);

      if (method === "page") {
        toast.info(`جاري ترجمة الصفحة ${pageNumber}...`);
        const result = await translatePage(book, Number(pageNumber), selectedLang, extractedData, glossary, "page");
        await loadTranslations();
        toast.success("تمت الترجمة بنجاح");
      } else if (method === "range") {
        toast.info(`جاري ترجمة الصفحات ${fromPage} إلى ${toPage}...`);
        await translateRange(book, Number(fromPage), Number(toPage), selectedLang, glossary, (p) => {
          setProgress(p);
          if (p.current % 1 === 0) loadTranslations();
        });
        await loadTranslations();
        toast.success("اكتملت ترجمة النطاق المحدد");
      } else if (method === "chapter") {
        if (!selectedChapter) {
          toast.error("اختر فصلاً أولاً");
          setLoading(false);
          return;
        }
        toast.info(`جاري ترجمة الفصل: ${selectedChapter}...`);
        await translateChapter(book, selectedChapter, selectedLang, glossary, (p) => {
          setProgress(p);
          if (p.current % 1 === 0) loadTranslations();
        });
        await loadTranslations();
        toast.success("اكتملت ترجمة الفصل");
      } else if (method === "full") {
        toast.info("جاري ترجمة الكتاب بالكامل. يمكنك متابعة استخدام التطبيق...");
        await translateFullBook(book, selectedLang, glossary, (p) => {
          setProgress(p);
          if (p.current % 3 === 0) loadTranslations();
        });
        await loadTranslations();
        toast.success("اكتملت ترجمة الكتاب بالكامل");
      }
    } catch (e) {
      console.error("Translation error:", e);
      setError(e.message || "حدث خطأ أثناء الترجمة");
      toast.error(e.message || "حدث خطأ أثناء الترجمة");
    } finally {
      setLoading(false);
      setExtracting(false);
      setProgress(null);
    }
  };

  const handleCancel = () => {
    if (book?.id && selectedLang) {
      cancelTranslation(book.id, selectedLang);
      toast.info("جاري إيقاف الترجمة...");
    }
  };

  const handleDeleteTranslation = async () => {
    if (!book?.id || !selectedLang) return;
    if (!confirm("هل تريد حذف جميع الترجمات لهذا الكتاب باللغة المختارة؟")) return;
    try {
      await deleteTranslations(book.id, selectedLang);
      setTranslations([]);
      toast.success("تم حذف الترجمة");
    } catch (e) {
      toast.error("فشل حذف الترجمة");
    }
  };

  const handleRetranslateCurrent = async () => {
    if (translations.length === 0) return;
    const current = translations[activePageIdx];
    if (!current) return;

    setLoading(true);
    try {
      const extractedData = await extractPdfText(book.pdf_url, book.id);
      const glossary = await getGlossary(selectedLang);
      toast.info(`إعادة ترجمة الصفحة ${current.page_number}...`);
      await retranslatePage(book, current.page_number, selectedLang, extractedData, glossary);
      await loadTranslations();
      toast.success("تمت إعادة الترجمة");
    } catch (e) {
      toast.error(e.message || "فشلت إعادة الترجمة");
    } finally {
      setLoading(false);
    }
  };

  const currentTranslation = translations[activePageIdx];
  const progressPct = progress ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div className="h-full flex flex-col bg-card border-r border-border" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-sm">الترجمة الذكية</h2>
        </div>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" className="h-8 w-8"
            onClick={() => onDisplayModeChange?.(displayMode === "side" ? "only" : "side")}>
            {displayMode === "side" ? <Eye className="w-4 h-4" /> : <Columns2 className="w-4 h-4" />}
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="p-3 space-y-3 border-b border-border shrink-0">
        {/* Language selector */}
        <div>
          <Label className="text-xs mb-1 block">لغة الترجمة</Label>
          <Select value={selectedLang} onValueChange={setSelectedLang}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="اختر اللغة" />
            </SelectTrigger>
            <SelectContent>
              {languages.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  {lang.name} {lang.native_name !== lang.name ? `(${lang.native_name})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Method selector */}
        <div>
          <Tabs value={method} onValueChange={setMethod}>
            <TabsList className="grid grid-cols-4 w-full h-auto">
              <TabsTrigger value="page" className="text-[10px] px-1 py-1.5">صفحة</TabsTrigger>
              <TabsTrigger value="range" className="text-[10px] px-1 py-1.5">نطاق</TabsTrigger>
              <TabsTrigger value="chapter" className="text-[10px] px-1 py-1.5">فصل</TabsTrigger>
              <TabsTrigger value="full" className="text-[10px] px-1 py-1.5">كامل</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Method-specific inputs */}
        {method === "page" && (
          <div>
            <Label className="text-xs mb-1 block">رقم الصفحة الحالية</Label>
            <Input type="number" min="1" value={pageNumber} onChange={(e) => setPageNumber(e.target.value)}
              className="h-9 text-sm" />
          </div>
        )}

        {method === "range" && (
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Label className="text-xs mb-1 block">من صفحة</Label>
              <Input type="number" min="1" value={fromPage} onChange={(e) => setFromPage(e.target.value)}
                className="h-9 text-sm" />
            </div>
            <div className="flex-1">
              <Label className="text-xs mb-1 block">إلى صفحة</Label>
              <Input type="number" min="1" value={toPage} onChange={(e) => setToPage(e.target.value)}
                className="h-9 text-sm" />
            </div>
          </div>
        )}

        {method === "chapter" && (
          <div>
            <Label className="text-xs mb-1 block">اختر الفصل</Label>
            {chapters.length > 0 ? (
              <Select value={selectedChapter} onValueChange={setSelectedChapter}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="اختر الفصل" />
                </SelectTrigger>
                <SelectContent>
                  {chapters.map((ch, i) => (
                    <SelectItem key={i} value={ch.chapter_title}>
                      {ch.chapter_title} (ص{ch.start_page})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-xs text-muted-foreground py-2">سيتم استخراج الفهرس عند بدء الترجمة</p>
            )}
          </div>
        )}

        {method === "full" && (
          <div className="bg-muted/50 rounded-lg p-2 text-xs text-muted-foreground">
            سيتم ترجمة الكتاب بالكامل. يمكنك متابعة استخدام التطبيق أثناء الترجمة.
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          {!loading ? (
            <Button onClick={handleTranslate} className="flex-1 h-9 text-sm gap-1.5">
              <Globe className="w-4 h-4" /> ترجمة
            </Button>
          ) : (
            <Button onClick={handleCancel} variant="destructive" className="flex-1 h-9 text-sm gap-1.5">
              <StopCircle className="w-4 h-4" /> إيقاف
            </Button>
          )}
          {translations.length > 0 && (
            <Button onClick={handleDeleteTranslation} variant="outline" size="icon" className="h-9 w-9 shrink-0">
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Progress */}
      <AnimatePresence>
        {(loading || extracting) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-border overflow-hidden shrink-0"
          >
            <div className="p-3 space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <Loader2 className="w-3 h-3 animate-spin text-primary" />
                <span className="text-muted-foreground">
                  {extracting ? "استخراج نص الكتاب..." : progress?.cancelled ? "إيقاف الترجمة..." : "جاري الترجمة..."}
                </span>
                {progress && !progress.cancelled && (
                  <span className="mr-auto font-mono text-primary">
                    {progress.current}/{progress.total} ({progressPct}%)
                  </span>
                )}
              </div>
              {progress && !progress.cancelled && (
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${progressPct}%` }} />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {error && (
        <div className="p-3 border-b border-border shrink-0">
          <div className="flex items-start gap-2 text-xs text-destructive bg-destructive/10 rounded-lg p-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Translation results */}
      <ScrollArea className="flex-1">
        {translations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">لا توجد ترجمات بعد</p>
            <p className="text-xs text-muted-foreground/70 mt-1">اختر لغة وطريقة ترجمة واضغط "ترجمة"</p>
          </div>
        ) : (
          <div className="p-3 space-y-3">
            {/* Page tabs */}
            {translations.length > 1 && (
              <div className="flex items-center gap-1 overflow-x-auto pb-2">
                {translations.map((t, i) => (
                  <button key={t.id} onClick={() => setActivePageIdx(i)}
                    className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      i === activePageIdx
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/70"
                    }`}>
                    {t.page_number}
                  </button>
                ))}
              </div>
            )}

            {/* Current translation */}
            {currentTranslation && (
              <div className="space-y-3">
                {/* Page header */}
                <div className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2 text-xs">
                    <BookOpen className="w-3.5 h-3.5 text-primary" />
                    <span className="font-medium">صفحة {currentTranslation.page_number}</span>
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                  </div>
                  <Button onClick={handleRetranslateCurrent} variant="ghost" size="icon" className="h-7 w-7"
                    disabled={loading}>
                    <RefreshCw className="w-3.5 h-3.5" />
                  </Button>
                </div>

                {/* Original text (if side-by-side) */}
                {displayMode === "side" && currentTranslation.original_text && (
                  <div className="bg-muted/30 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-2 text-[10px] text-muted-foreground font-medium">
                      <FileText className="w-3 h-3" /> النص الأصلي
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap" dir="rtl">
                      {currentTranslation.original_text}
                    </p>
                  </div>
                )}

                {/* Translated text */}
                <div className="bg-primary/5 rounded-xl p-3 border border-primary/10">
                  <div className="flex items-center gap-1.5 mb-2 text-[10px] text-primary font-medium">
                    <Globe className="w-3 h-3" /> الترجمة {selectedLangObj ? `(${selectedLangObj.native_name})` : ""}
                  </div>
                  <p
                    className="text-sm leading-relaxed whitespace-pre-wrap"
                    dir={isRTL ? "rtl" : "ltr"}
                    style={fontFamily ? { fontFamily } : undefined}
                  >
                    {currentTranslation.translated_text}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}