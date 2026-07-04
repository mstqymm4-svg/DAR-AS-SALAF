import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Loader2, Globe, X, BookOpen, Trash2, StopCircle,
  CheckCircle2, AlertCircle, Sparkles, FileText,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  getActiveLanguages, getGlossary, translateFullBook,
  deleteTranslations, getBookTranslations, cancelTranslation, inspectBook,
  getBookPageCount,
} from "@/lib/translationEngine";

const TARGET_LANGS = ["ar", "en", "hi"];

export default function TranslationPanel({ book, onClose, onViewTranslated }) {
  const [languages, setLanguages] = useState([]);
  const [selectedLang, setSelectedLang] = useState("");
  const [translations, setTranslations] = useState([]);
  const [totalPages, setTotalPages] = useState(book.pages_count || 0);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState("");
  const [bookInfo, setBookInfo] = useState(null);
  const [inspecting, setInspecting] = useState(false);

  // Load languages (filtered to target langs only)
  useEffect(() => {
    getActiveLanguages().then((langs) => {
      const filtered = langs.filter((l) => TARGET_LANGS.includes(l.code));
      setLanguages(filtered);
      if (filtered.length > 0) setSelectedLang(filtered[0].code);
    });
  }, []);

  // Load existing translations when language changes
  useEffect(() => {
    if (!book?.id || !selectedLang) return;
    getBookTranslations(book.id, selectedLang).then(setTranslations);
  }, [book?.id, selectedLang]);

  // Get total page count from PDF
  useEffect(() => {
    if (!book?.pdf_url || totalPages > 0) return;
    getBookPageCount(book.pdf_url).then((count) => {
      if (count > 0) setTotalPages(count);
    });
  }, [book?.pdf_url]);

  const isComplete = totalPages > 0 && translations.length >= totalPages;
  const progressPct = progress ? Math.round((progress.current / progress.total) * 100) : 0;

  const selectedLangObj = languages.find((l) => l.code === selectedLang);

  const handleInspect = async () => {
    if (!book?.pdf_url) return;
    setInspecting(true);
    try {
      const info = await inspectBook(book.pdf_url, book.id);
      setBookInfo(info);
      if (info.total_pages > 0) setTotalPages(info.total_pages);
      if (info.needs_ocr) toast.info("الكتاب يحتاج OCR — سيتم استخراج النص بالذكاء الاصطناعي تلقائياً");
      else toast.success(`الكتاب يحتوي على نص — ${info.total_pages} صفحة`);
    } catch (e) {
      toast.error("فشل فحص الكتاب");
    } finally {
      setInspecting(false);
    }
  };

  const handleTranslate = async () => {
    if (!selectedLang) return;
    setLoading(true);
    setError("");
    setProgress(null);

    try {
      const glossary = await getGlossary(selectedLang);
      toast.info("جاري ترجمة الكتاب بالكامل. يمكنك متابعة استخدام التطبيق...");
      await translateFullBook(book, selectedLang, glossary, (p) => {
        setProgress(p);
      });
      const finalTranslations = await getBookTranslations(book.id, selectedLang);
      setTranslations(finalTranslations);
      toast.success("اكتملت ترجمة الكتاب بالكامل");
      onViewTranslated?.(selectedLang);
    } catch (e) {
      setError(e.message || "حدث خطأ أثناء الترجمة");
      toast.error(e.message || "حدث خطأ أثناء الترجمة");
    } finally {
      setLoading(false);
      setProgress(null);
    }
  };

  const handleCancel = () => {
    if (book?.id && selectedLang) {
      cancelTranslation(book.id, selectedLang);
      toast.info("جاري إيقاف الترجمة...");
    }
  };

  const handleDelete = async () => {
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

  return (
    <div className="h-full flex flex-col bg-card border-r border-border" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-sm">الترجمة الذكية</h2>
        </div>
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Source language info */}
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground bg-muted/50 rounded-lg p-2.5">
            <Sparkles className="w-3 h-3 shrink-0" />
            <span>اللغة المصدر: الأردية (اردو) — الترجمة تحافظ على المصطلحات الشرعية وأسماء العلماء</span>
          </div>

          {/* Book inspection */}
          <div className="flex items-center gap-2">
            <Button onClick={handleInspect} variant="outline" size="sm" className="flex-1 h-8 text-xs gap-1.5" disabled={inspecting}>
              {inspecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
              فحص الكتاب
            </Button>
            {bookInfo && (
              <div className="flex items-center gap-1.5 text-[10px]">
                {bookInfo.has_text && (
                  <span className="px-2 py-1 rounded-lg bg-green-500/10 text-green-600 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> نص
                  </span>
                )}
                {bookInfo.needs_ocr && (
                  <span className="px-2 py-1 rounded-lg bg-amber-500/10 text-amber-600 font-medium">
                    OCR
                  </span>
                )}
                {bookInfo.total_pages > 0 && (
                  <span className="px-2 py-1 rounded-lg bg-muted text-muted-foreground font-medium">
                    {bookInfo.total_pages} ص
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Language selector */}
          <div>
            <p className="text-xs font-medium mb-2 text-muted-foreground">ترجمة إلى</p>
            <div className="grid grid-cols-3 gap-2">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setSelectedLang(lang.code)}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${
                    selectedLang === lang.code
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <p className="text-sm font-bold">{lang.native_name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{lang.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          {totalPages > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">الكتاب: {totalPages} صفحة</span>
              {translations.length > 0 && (
                <span className={`font-medium ${isComplete ? "text-green-600" : "text-amber-600"}`}>
                  {translations.length} / {totalPages} مترجمة
                </span>
              )}
            </div>
          )}

          {/* Progress */}
          <AnimatePresence>
            {loading && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-2 bg-muted/30 rounded-xl p-3">
                  <div className="flex items-center gap-2 text-xs">
                    <Loader2 className="w-3 h-3 animate-spin text-primary" />
                    <span className="text-muted-foreground">
                      {progress?.cancelled ? "إيقاف الترجمة..." :
                       progress?.phase === "ocr" ? `جاري OCR للصفحة ${progress.currentPage}...` :
                       progress?.skipped ? `تخطي الصفحة ${progress.currentPage} (مترجمة سابقاً)` :
                       `جاري ترجمة الصفحة ${progress?.currentPage || 0}...`}
                    </span>
                    {progress && !progress.cancelled && (
                      <span className="mr-auto font-mono text-primary">
                        {progress.current}/{progress.total} ({progressPct}%)
                      </span>
                    )}
                  </div>
                  {progress && !progress.cancelled && (
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
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
            <div className="flex items-start gap-2 text-xs text-destructive bg-destructive/10 rounded-lg p-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          {!loading ? (
            <div className="space-y-2">
              {isComplete ? (
                <>
                  <div className="flex items-center gap-2 text-xs text-green-600 bg-green-500/10 rounded-lg p-2.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>الترجمة مكتملة — {translations.length} صفحة</span>
                  </div>
                  <Button
                    onClick={() => onViewTranslated?.(selectedLang)}
                    className="w-full h-10 gap-2"
                  >
                    <BookOpen className="w-4 h-4" />
                    قراءة النسخة المترجمة ({selectedLangObj?.native_name})
                  </Button>
                  <Button
                    onClick={handleTranslate}
                    variant="outline"
                    className="w-full h-9 gap-2 text-xs"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    إعادة الترجمة
                  </Button>
                  <Button
                    onClick={handleDelete}
                    variant="ghost"
                    className="w-full h-9 gap-2 text-xs text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    حذف الترجمة
                  </Button>
                </>
              ) : translations.length > 0 ? (
                <>
                  <Button
                    onClick={() => onViewTranslated?.(selectedLang)}
                    variant="outline"
                    className="w-full h-10 gap-2"
                  >
                    <BookOpen className="w-4 h-4" />
                    قراءة ما تُرجم ({translations.length} صفحة)
                  </Button>
                  <Button
                    onClick={handleTranslate}
                    className="w-full h-10 gap-2"
                  >
                    <Globe className="w-4 h-4" />
                    متابعة الترجمة ({translations.length}/{totalPages})
                  </Button>
                  <Button
                    onClick={handleDelete}
                    variant="ghost"
                    className="w-full h-9 gap-2 text-xs text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    حذف الترجمة
                  </Button>
                </>
              ) : (
                <>
                  <div className="bg-muted/50 rounded-xl p-3 text-xs text-muted-foreground">
                    سيتم ترجمة الكتاب بالكامل ({totalPages || "؟"} صفحة) من الأردية إلى {selectedLangObj?.native_name}.
                    يمكنك متابعة استخدام التطبيق أثناء الترجمة.
                  </div>
                  <Button
                    onClick={handleTranslate}
                    className="w-full h-11 gap-2 text-sm font-bold"
                    disabled={!selectedLang}
                  >
                    <Globe className="w-4 h-4" />
                    ترجمة الكتاب بالكامل
                  </Button>
                </>
              )}
            </div>
          ) : (
            <Button onClick={handleCancel} variant="destructive" className="w-full h-10 gap-2">
              <StopCircle className="w-4 h-4" /> إيقاف الترجمة
            </Button>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}