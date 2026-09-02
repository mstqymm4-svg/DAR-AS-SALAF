import { motion, AnimatePresence } from "framer-motion";
import { Languages, X, Loader2 } from "lucide-react";

const LANGS = [
  { code: "ar", name: "العربية", rtl: true },
  { code: "ur", name: "اردو", rtl: true },
  { code: "en", name: "English", rtl: false },
  { code: "hi", name: "हिंदी", rtl: false },
  { code: "fr", name: "Français", rtl: false },
  { code: "tr", name: "Türkçe", rtl: false },
];

/** Side panel: translate the current PDF page text to a chosen language via AI. */
export default function TranslatePanel({ show, isRTL, darkMode, currentPage, targetLang, setTargetLang, translating, translated, onTranslate, onClose }) {
  const isRTLLang = LANGS.find(l => l.code === targetLang)?.rtl;
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-30 flex bg-black/50"
          onClick={onClose}
        >
          <motion.div
            initial={{ x: isRTL ? 300 : -300 }}
            animate={{ x: 0 }}
            exit={{ x: isRTL ? 300 : -300 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`w-96 max-w-[85%] h-full ${darkMode ? "bg-gray-800" : "bg-card"} border-border overflow-y-auto ${isRTL ? "mr-auto border-l" : "ml-auto border-r"}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`p-3 border-b border-border flex items-center justify-between sticky top-0 z-10 ${darkMode ? "bg-gray-800" : "bg-card"}`}>
              <h3 className="text-sm font-bold flex items-center gap-2"><Languages className="w-4 h-4" /> ترجمة الصفحة</h3>
              <button onClick={onClose} className="p-1 rounded hover:bg-muted"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-3 space-y-3" dir="rtl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground shrink-0">ترجمة إلى:</span>
                <div className="flex flex-wrap gap-1.5">
                  {LANGS.map(l => (
                    <button key={l.code} onClick={() => setTargetLang(l.code)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${targetLang === l.code ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"}`}>
                      {l.name}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={onTranslate} disabled={translating}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-60 transition-opacity">
                {translating ? <><Loader2 className="w-4 h-4 animate-spin" /> جاري الترجمة...</> : <><Languages className="w-4 h-4" /> ترجمة الصفحة {currentPage}</>}
              </button>
              {translated && (
                <div className={`text-sm leading-relaxed rounded-xl p-3 ${darkMode ? "bg-gray-900/60" : "bg-muted/60"}`} dir={isRTLLang ? "rtl" : "ltr"}>
                  {translated}
                </div>
              )}
              {!translated && !translating && (
                <p className="text-xs text-muted-foreground text-center py-6">اختر اللغة ثم اضغط زر الترجمة لترجمة نص الصفحة الحالية.</p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}