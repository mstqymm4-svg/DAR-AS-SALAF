import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Languages, Loader2, CheckCircle, X, BookOpen, AlertCircle } from "lucide-react";
import { translateBook } from "@/lib/translationEngine";

const LANGUAGES = [
  { code: "ar", name: "العربية", flag: "🇸🇦" },
  { code: "ur", name: "الأردية", flag: "🇵🇰" },
  { code: "en", name: "الإنجليزية", flag: "🇬🇧" },
  { code: "hi", name: "الهندية", flag: "🇮🇳" },
];

export default function BookTranslate({ book }) {
  const navigate = useNavigate();
  const [showPanel, setShowPanel] = useState(false);
  const [targetLang, setTargetLang] = useState("ar");
  const [sourceLang, setSourceLang] = useState("auto");
  const [translating, setTranslating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState("");
  const [existingTranslation, setExistingTranslation] = useState(null);
  const [cancelled, setCancelled] = useState(false);

  // Check for existing translations
  const checkExisting = useCallback(async () => {
    try {
      const translations = await base44.entities.BookTranslation.filter({ book_id: book.id });
      if (translations.length > 0) {
        setExistingTranslation(translations[0]);
        setTargetLang(translations[0].target_language);
        setProgress(translations[0].progress || 0);
      }
    } catch (e) {}
  }, [book.id]);

  useEffect(() => {
    checkExisting();
  }, [checkExisting]);

  const handleTranslate = async () => {
    setTranslating(true);
    setCancelled(false);
    setProgress(0);

    // Create or update translation record
    let record = existingTranslation;
    try {
      if (!record) {
        record = await base44.entities.BookTranslation.create({
          book_id: book.id,
          book_title: book.title,
          source_language: sourceLang,
          target_language: targetLang,
          status: "extracting",
          progress: 0,
          translated_pages: 0,
          current_page: 0,
          enabled: true,
          translation_engine: "ai_auto",
          started_at: new Date().toISOString(),
        });
        setExistingTranslation(record);
      } else {
        await base44.entities.BookTranslation.update(record.id, {
          status: "extracting",
          progress: 0,
          current_page: 0,
          translated_pages: 0,
          error_message: "",
          started_at: new Date().toISOString(),
        });
      }

      const result = await translateBook(
        book.pdf_url,
        targetLang,
        sourceLang,
        (update) => {
          if (update.progress !== undefined) setProgress(update.progress);
          if (update.message) setStatusMsg(update.message);
        },
        record
      );

      if (cancelled) return;

      // Update record as completed
      await base44.entities.BookTranslation.update(record.id, {
        status: "completed",
        progress: 100,
        translated_pages: result.totalPages,
        total_pages: result.totalPages,
        current_page: result.totalPages,
        translated_pdf_url: result.translatedPdfUrl,
        is_ocr: result.isOCRBook,
        completed_at: new Date().toISOString(),
      });

      setExistingTranslation({ ...record, status: "completed", translated_pdf_url: result.translatedPdfUrl, progress: 100 });
      toast.success("تمت ترجمة الكتاب بنجاح!");
      setTranslating(false);

      // Navigate to read the translated PDF
      navigate(`/read/${book.id}?translated=1`);
    } catch (e) {
      if (e.message === "TRANSLATION_CANCELLED") {
        toast.info("تم إيقاف الترجمة");
        if (record) {
          await base44.entities.BookTranslation.update(record.id, { status: "paused" });
        }
      } else {
        console.error("Translation error:", e);
        toast.error("فشلت الترجمة: " + (e.message || "خطأ غير معروف"));
        if (record) {
          await base44.entities.BookTranslation.update(record.id, {
            status: "error",
            error_message: e.message || "خطأ غير معروف",
          });
        }
      }
      setTranslating(false);
    }
  };

  const handleCancel = () => {
    setCancelled(true);
    setTranslating(false);
  };

  const isCompleted = existingTranslation?.status === "completed" && existingTranslation?.translated_pdf_url;

  return (
    <div className="space-y-3">
      {/* Translate Button */}
      {!showPanel && !translating && (
        <Button
          variant="outline"
          className="w-full gap-2 h-11 rounded-xl text-sm font-bold"
          onClick={() => setShowPanel(true)}
        >
          <Languages className="w-4 h-4" />
          {isCompleted ? "ترجمة جديدة" : "ترجمة الكتاب"}
        </Button>
      )}

      {/* Completed Translation */}
      {isCompleted && !translating && !showPanel && (
        <Button
          className="w-full gap-2 h-11 rounded-xl text-sm font-bold bg-green-600 hover:bg-green-700"
          onClick={() => navigate(`/read/${book.id}?translated=1`)}
        >
          <BookOpen className="w-4 h-4" />
          قراءة النسخة المترجمة
        </Button>
      )}

      {/* Translation Panel */}
      <AnimatePresence>
        {showPanel && !translating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-muted/30 border border-border rounded-xl p-4 space-y-3 overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Languages className="w-4 h-4 text-primary" />
                ترجمة الكتاب بالكامل
              </h3>
              <button onClick={() => setShowPanel(false)} className="p-1 rounded hover:bg-muted">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">اللغة الأصلية</label>
                <Select value={sourceLang} onValueChange={setSourceLang}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">اكتشاف تلقائي</SelectItem>
                    {LANGUAGES.map((l) => <SelectItem key={l.code} value={l.code}>{l.flag} {l.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">لغة الترجمة</label>
                <Select value={targetLang} onValueChange={setTargetLang}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((l) => <SelectItem key={l.code} value={l.code}>{l.flag} {l.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2">
              <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
                ⚠️ الترجمات التي ينتجها الذكاء الاصطناعي للكتب الدينية ينبغي مراجعتها قبل اعتمادها.
              </p>
            </div>

            <Button onClick={handleTranslate} className="w-full gap-2 h-10">
              <Languages className="w-4 h-4" />
              بدء ترجمة الكتاب بالكامل
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Panel */}
      {translating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-card border border-border rounded-xl p-4 space-y-3"
        >
          <div className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
            <div className="flex-1">
              <p className="text-sm font-bold">جاري ترجمة الكتاب</p>
              <p className="text-xs text-muted-foreground">{statusMsg || "بدء المعالجة..."}</p>
            </div>
            <Button size="sm" variant="outline" onClick={handleCancel} className="h-8 text-xs">
              إيقاف
            </Button>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">نسبة الإنجاز</span>
              <span className="font-bold">{progress}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}