/**
 * Renders a single translated page as styled text (book-page layout).
 * Used when viewing a translated version of a book in the FlipBookViewer.
 */
const LANG_STYLES = {
  ar: { dir: "rtl", fontFamily: "'Tajawal', sans-serif" },
  en: { dir: "ltr", fontFamily: "'Inter', sans-serif" },
  hi: { dir: "ltr", fontFamily: "'Noto Sans Devanagari', sans-serif" },
  ur: { dir: "rtl", fontFamily: "'Noto Nastaliq Urdu', serif" },
};

export default function TranslatedTextPage({ translation, darkMode = false, lang = "ar" }) {
  const style = LANG_STYLES[lang] || LANG_STYLES.ar;
  const text = translation?.translated_text || "";

  return (
    <div
      className={`w-full h-full overflow-y-auto rounded-lg shadow-2xl p-6 sm:p-10 ${darkMode ? "bg-gray-800 text-gray-100" : "bg-white text-gray-900"}`}
      dir={style.dir}
      style={{ fontFamily: style.fontFamily }}
    >
      <p className="text-sm sm:text-base leading-loose whitespace-pre-wrap">
        {text || "—"}
      </p>
    </div>
  );
}