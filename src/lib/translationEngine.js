/**
 * translationEngine — AI translation engine for religious texts
 *
 * Source language: Urdu (ur)
 * Target languages: Arabic (ar), English (en), Hindi (hi)
 *
 * Flow (full-book translation):
 *   1. Load PDF with pdfjs-dist (lazy — pages loaded on demand)
 *   2. For each page:
 *      a. Extract text via pdfjs text layer (fast, client-side)
 *      b. If no text → render page to image → upload → OCR via LLM vision
 *      c. Translate text via LLM with religious-aware prompt
 *      d. Save to Translation entity (supports resume)
 *   3. Cancel / resume supported
 */
import { base44 } from "@/api/base44Client";
import { loadPdfDocument, extractPageText, renderPageToImageBlob, getPdfPageCount } from "@/lib/pdfLoader";

function getSetting(key) {
  try { return localStorage.getItem("devs_" + key) || ""; } catch(e) { return ""; }
}

// ─── Default languages ───────────────────────────────────────────────────────
const DEFAULT_LANGUAGES = [
  { code: "ar", name: "العربية",   native_name: "العربية",   rtl: true,  active: true,  font_family: "" },
  { code: "ur", name: "الأردية",   native_name: "اردو",      rtl: true,  active: false, font_family: "var(--font-nastaliq)" },
  { code: "hi", name: "الهندية",   native_name: "हिन्दी",     rtl: false, active: true,  font_family: "var(--font-devanagari)" },
  { code: "en", name: "الإنجليزية", native_name: "English",  rtl: false, active: true,  font_family: "var(--font-inter)" },
];

const LANGUAGE_NAMES = {
  ar: "العربية", ur: "الأردية", hi: "الهندية", en: "الإنجليزية",
  fr: "الفرنسية", tr: "التركية", fa: "الفارسية", id: "الإندونيسية",
  ru: "الروسية", es: "الإسبانية", de: "الألمانية",
};

const URDU_CHAR_REGEX = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;

const _pdfTextCache = {};
const _activeTranslations = {};

// ─── Languages ───────────────────────────────────────────────────────────────
export async function ensureDefaultLanguages() {
  try {
    const existing = await base44.entities.TranslationLanguage.list("-created_date", 100);
    for (const lang of DEFAULT_LANGUAGES) {
      if (!existing.find((l) => l.code === lang.code)) {
        await base44.entities.TranslationLanguage.create(lang);
      }
    }
  } catch (e) {
    console.error("ensureDefaultLanguages:", e);
  }
}

export async function getActiveLanguages() {
  try {
    let langs = await base44.entities.TranslationLanguage.filter({ active: true });
    if (!langs || langs.length === 0) {
      await ensureDefaultLanguages();
      langs = await base44.entities.TranslationLanguage.filter({ active: true });
    }
    return (langs || []).sort((a, b) => a.name.localeCompare(b.name, "ar"));
  } catch (e) {
    return DEFAULT_LANGUAGES.filter((l) => l.active);
  }
}

export async function getAllLanguages() {
  try {
    return await base44.entities.TranslationLanguage.list("-created_date", 100);
  } catch (e) {
    return [];
  }
}

// ─── Quality validation ──────────────────────────────────────────────────────
function validateText(text) {
  if (!text || typeof text !== "string") {
    return { valid: false, reason: "النص فارغ", score: "fail" };
  }
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return { valid: false, reason: "النص المستخرج فارغ", score: "fail" };
  }
  if (trimmed.length < 10) {
    return { valid: false, reason: `النص قصير جداً (${trimmed.length} حرف)`, score: "fail" };
  }
  // Check for Arabic/Urdu script OR Latin script (for English books)
  const hasArabicScript = /[\u0600-\u06FF]/.test(trimmed);
  const hasLatin = /[a-zA-Z]/.test(trimmed);
  const hasDevanagari = /[\u0900-\u097F]/.test(trimmed);
  if (!hasArabicScript && !hasLatin && !hasDevanagari) {
    return { valid: false, reason: "لا يحتوي على نص مقروء", score: "fail" };
  }
  const uniqueChars = new Set(trimmed.replace(/\s/g, ""));
  if (uniqueChars.size < 5) {
    return { valid: false, reason: "النص يحتوي على تكرار مشبوه", score: "fail" };
  }
  let score = "good";
  if (trimmed.length < 50) score = "low";
  else if (trimmed.length < 200) score = "medium";
  return { valid: true, reason: "", score };
}

// ─── PDF inspection ──────────────────────────────────────────────────────────
export async function inspectBook(pdfUrl, bookId) {
  if (!pdfUrl) return { has_pdf: false, has_text: false, needs_ocr: true, total_pages: 0 };
  try {
    const pdf = await loadPdfDocument(pdfUrl);
    const totalPages = pdf.numPages;
    let hasText = false;
    let needsOcr = false;
    const sampleSize = Math.min(5, totalPages);
    for (let i = 1; i <= sampleSize; i++) {
      const text = await extractPageText(pdf, i);
      const validation = validateText(text);
      if (validation.valid) hasText = true;
      else needsOcr = true;
    }
    return { has_pdf: true, has_text: hasText, needs_ocr: needsOcr, total_pages: totalPages };
  } catch (e) {
    return { has_pdf: true, has_text: false, needs_ocr: true, total_pages: 0, error: e.message };
  }
}

/** Get total page count from a PDF URL. */
export async function getBookPageCount(pdfUrl) {
  try {
    return await getPdfPageCount(pdfUrl);
  } catch (e) {
    return 0;
  }
}

// ─── OCR ─────────────────────────────────────────────────────────────────────
async function ocrPage(pdf, pageNumber) {
  const blob = await renderPageToImageBlob(pdf, pageNumber);
  const file = new File([blob], `page_${pageNumber}.png`, { type: "image/png" });
  const { file_url } = await base44.integrations.Core.UploadFile({ file });

  const prompt = `أنت نظام OCR متخصص في قراءة النصوص الأردية (اردو) والعربية من الصور.

استخرج النص الكامل من الصفحة المرفقة.

## قواعد الاستخراج:
1. اقرأ النص بدقة عالية من اليمين إلى اليسار
2. حافظ على ترتيب الفقرات والأسطر كما في الأصل
3. لا تضف ولا تحذف أي كلمة أو حرف
4. حافظ على علامات الترقيم والأرقام
5. إذا كانت الصفحة تحتوي على آيات قرآنية، احتفظ بالنص كما هو
6. تجاهل أرقام الصفحات والترويسات غير المتعلقة بالمحتوى
7. إذا كانت الصفحة فارغة أو صورة فقط بدون نص، أرجع نصاً فارغاً

أرجع النص المستخرج فقط دون أي تعليق.`;

  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    model: "gemini_3_flash",
    file_urls: [file_url],
    response_json_schema: {
      type: "object",
      properties: {
        text: { type: "string" },
        quality: { type: "string", enum: ["high", "medium", "low", "empty"] },
      },
    },
  });

  return {
    text: result?.text || "",
    quality: result?.quality || "medium",
  };
}

// ─── Glossary ─────────────────────────────────────────────────────────────────
export async function getGlossary(targetLang) {
  try {
    const specific = await base44.entities.TranslationGlossary.filter({ target_language: targetLang });
    const general = await base44.entities.TranslationGlossary.filter({ target_language: "all" });
    return [...(specific || []), ...(general || [])];
  } catch (e) {
    return [];
  }
}

export async function getAllGlossary() {
  try {
    return await base44.entities.TranslationGlossary.list("-updated_date", 500);
  } catch (e) {
    return [];
  }
}

function buildGlossarySection(glossary) {
  if (!glossary || glossary.length === 0) return "";
  const lines = glossary.map(
    (g) => `- "${g.term}" ← "${g.translation}"${g.category ? ` [${g.category}]` : ""}`
  );
  return `\n\n## قاموس المصطلحات (التزم بهذه الترجمات بدقة):\n${lines.join("\n")}\n`;
}

// ─── Translation prompt builder ───────────────────────────────────────────────
function buildTranslationPrompt(text, sourceLangName, targetLangName, glossary, bookCategory, bookTitle, author) {
  let prompt = `أنت مترجم خبير متخصص في النصوص الدينية الإسلامية، تتقن علوم القرآن الكريم والحديث الشريف والفقه الإسلامي والعقيدة والسيرة النبوية والتاريخ الإسلامي، وتتقن اللغة الأردية (اردو) واللغة ${targetLangName}.

مهمتك: ترجمة النص التالي بدقة عالية جداً من ${sourceLangName} إلى ${targetLangName}.

## القواعد الصارمة للترجمة:

1. **الحفاظ التام على المعنى**: لا تضف ولا تحذف ولا تغير أي معنى من المعاني الأصلية تحت أي ظرف.

2. **الحفاظ على البنية**: حافظ على العناوين والفقرات وعلامات الترقيم والحواشي والأرقام كما هي تماماً.

3. **الآيات القرآنية**: اترك النص العربي للآية كما هو، ثم ضع ترجمتها بعدها بين قوسين إن كانت اللغة الهدف غير العربية.

4. **الأحاديث النبوية**: حافظ على السند إن وُجد، وترجم المتن بدقة مع الحفاظ على المعنى الشرعي.

5. **المصطلحات الشرعية**: استخدم الترجمة المقبولة في اللغة الهدف:
   - صلاة، زكاة، حج، صوم، وضوء، جهاد، إيمان، تقوى، توحيد، شرك، بدعة، سنة، فرض، واجب، مباح، حرام، مكروه
   - اختر الترجمة الصحيحة حسب السياق الشرعي (فقهي، عقدي، تفسيري)

6. **أسماء العلماء**: اكتبها بالحروف المناسبة للغة الهدف مع الحفاظ على النطق الصحيح.

7. **أسماء الكتب**: احتفظ بالاسم الأصلي ثم ضع ترجمته بين قوسين.

8. **لا تختصر**: ترجم النص كاملاً كما هو، دون اختصار أو إعادة صياغة أو تلخيص.

9. **الحفاظ على الأرقام والمراجع**: حافظ على جميع أرقام الصفحات والآيات والأحاديث والإحالات.

10. **الأسلوب**: استخدم أسلوباً دينياً رصيناً مناسباً للنص الإسلامي، وتجنب العامية.

11. **النص الأردي**: النص المصدر مكتوب باللغة الأردية (اردو). اقرأه بعناية وحافظ على كل كلمة وحرف في الترجمة.`;

  if (bookTitle) prompt += `\n\n## معلومات الكتاب:\nالعنوان: ${bookTitle}`;
  if (author) prompt += `\nالمؤلف: ${author}`;
  if (bookCategory) prompt += `\nالتصنيف: ${bookCategory}`;

  prompt += buildGlossarySection(glossary);
  prompt += `\n\n## النص المطلوب ترجمته:\n---\n${text}\n---\n\nقدّم الترجمة فقط دون أي تعليق أو مقدمة أو خاتمة. الترجمة المباشرة فقط.`;

  return prompt;
}

// ─── Error logging ────────────────────────────────────────────────────────────
async function logError(bookId, bookTitle, pageNumber, errorMessage, errorType, targetLang) {
  try {
    await base44.entities.Translation.create({
      book_id: bookId,
      book_title: bookTitle || "",
      target_language: targetLang || "",
      source_language: "ur",
      page_number: pageNumber || 0,
      original_text: "",
      translated_text: "",
      status: "error",
      error_message: errorMessage,
      error_type: errorType,
    });
  } catch (e) {
    console.error("Failed to log error:", e);
  }
}

export async function getErrorLog(bookId) {
  try {
    const query = bookId
      ? { book_id: bookId, status: "error" }
      : { status: "error" };
    const errors = await base44.entities.Translation.filter(query);
    return (errors || []).sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date));
  } catch (e) {
    return [];
  }
}

export async function retryFailedPage(book, pageNumber, targetLang) {
  const existing = await base44.entities.Translation.filter({
    book_id: book.id, page_number: pageNumber, target_language: targetLang, status: "error",
  });
  for (const rec of existing || []) {
    await base44.entities.Translation.delete(rec.id);
  }
  const pdf = await loadPdfDocument(book.pdf_url);
  const glossary = await getGlossary(targetLang);
  return _translateSinglePage(book, pdf, pageNumber, targetLang, glossary, totalPages => totalPages);
}

// ─── Core translation function ───────────────────────────────────────────────
export async function translateText(text, sourceLang, targetLang, glossary = [], bookCategory = "", bookTitle = "", author = "") {
  const sourceLangName = LANGUAGE_NAMES[sourceLang] || "اللغة الأصلية";
  const targetLangName = LANGUAGE_NAMES[targetLang] || targetLang;
  const prompt = buildTranslationPrompt(text, sourceLangName, targetLangName, glossary, bookCategory, bookTitle, author);
  const model = getSetting("translation_model") || "claude_sonnet_4_6";

  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    model,
    response_json_schema: {
      type: "object",
      properties: {
        translated_text: { type: "string" },
        quality_notes: { type: "string" },
      },
    },
  });

  return result.translated_text || (typeof result === "string" ? result : JSON.stringify(result));
}

// ─── Translation queries ──────────────────────────────────────────────────────
export async function getTranslatedPage(bookId, pageNumber, targetLang) {
  try {
    const results = await base44.entities.Translation.filter({
      book_id: bookId, page_number: pageNumber, target_language: targetLang, status: "completed",
    });
    return results && results.length > 0 ? results[0] : null;
  } catch (e) {
    return null;
  }
}

export async function getBookTranslations(bookId, targetLang) {
  try {
    const results = await base44.entities.Translation.filter({
      book_id: bookId, target_language: targetLang, status: "completed",
    });
    return (results || []).sort((a, b) => a.page_number - b.page_number);
  } catch (e) {
    return [];
  }
}

// ─── Single page translation (internal) ──────────────────────────────────────
async function _translateSinglePage(book, pdf, pageNumber, targetLang, glossary, onProgress, method = "full") {
  // Check cache
  const existing = await getTranslatedPage(book.id, pageNumber, targetLang);
  if (existing) return existing;

  // Extract text
  let text = "";
  let extractionMethod = "text";

  try {
    text = await extractPageText(pdf, pageNumber);
  } catch (e) {
    console.error(`Text extraction failed for page ${pageNumber}:`, e);
  }

  const validation = validateText(text);

  if (!validation.valid) {
    // OCR fallback
    extractionMethod = "ocr";
    onProgress?.({ phase: "ocr", currentPage: pageNumber });
    try {
      const ocrResult = await ocrPage(pdf, pageNumber);
      text = ocrResult.text;
    } catch (e) {
      console.error(`OCR failed for page ${pageNumber}:`, e);
    }
  }

  // Validate again after OCR
  const finalValidation = validateText(text);
  if (!finalValidation.valid) {
    await logError(book.id, book.title, pageNumber, `نص الصفحة غير صالح: ${finalValidation.reason}`, "empty_text", targetLang);
    throw new Error(`نص الصفحة ${pageNumber} غير صالح: ${finalValidation.reason}`);
  }

  // Create pending record
  const record = await base44.entities.Translation.create({
    book_id: book.id,
    book_title: book.title,
    target_language: targetLang,
    source_language: "ur",
    page_number: pageNumber,
    original_text: text,
    translated_text: "",
    status: "translating",
    translation_method: method,
    extraction_method: extractionMethod,
  });

  try {
    const translatedText = await translateText(
      text, "ur", targetLang, glossary, book.category, book.title, book.author
    );

    if (!translatedText || translatedText.trim().length === 0) {
      throw new Error("الترجمة فارغة");
    }

    const updated = await base44.entities.Translation.update(record.id, {
      translated_text: translatedText,
      status: "completed",
    });

    return updated;
  } catch (e) {
    await base44.entities.Translation.update(record.id, {
      status: "error",
      error_message: e.message || "خطأ في الترجمة",
      error_type: "translation_failed",
    });
    throw e;
  }
}

// ─── Single page translation (public, for retry) ─────────────────────────────
export async function translatePage(book, pageNumber, targetLang, _extractedData, glossary, method = "page") {
  const pdf = await loadPdfDocument(book.pdf_url);
  return _translateSinglePage(book, pdf, pageNumber, targetLang, glossary, () => {}, method);
}

export async function retranslatePage(book, pageNumber, targetLang, _extractedData, glossary) {
  const existing = await getTranslatedPage(book.id, pageNumber, targetLang);
  if (existing) await base44.entities.Translation.delete(existing.id);
  return translatePage(book, pageNumber, targetLang, null, glossary, "page");
}

// ─── Full book translation ────────────────────────────────────────────────────
export async function translateFullBook(book, targetLang, glossary, onProgress) {
  const pdf = await loadPdfDocument(book.pdf_url);
  const totalPages = pdf.numPages;

  if (totalPages === 0) {
    throw new Error("لم يتم العثور على صفحات قابلة للترجمة في الكتاب");
  }

  const key = `${book.id}_${targetLang}`;
  _activeTranslations[key] = false;

  // Get already completed pages for resume
  const existing = await getBookTranslations(book.id, targetLang);
  const completedPages = new Set(existing.map((t) => t.page_number));

  const results = [];

  for (let page = 1; page <= totalPages; page++) {
    if (_activeTranslations[key]) {
      onProgress?.({ cancelled: true, current: page, total: totalPages });
      delete _activeTranslations[key];
      return results;
    }

    // Skip completed pages (resume support)
    if (completedPages.has(page)) {
      onProgress?.({ current: page, total: totalPages, currentPage: page, phase: "translate", skipped: true });
      continue;
    }

    onProgress?.({ current: page, total: totalPages, currentPage: page, phase: "translate" });

    try {
      const result = await _translateSinglePage(book, pdf, page, targetLang, glossary, onProgress, "full");
      results.push(result);
    } catch (e) {
      console.error(`Failed to translate page ${page}:`, e);
    }
  }

  delete _activeTranslations[key];
  return results;
}

// ─── Range / Chapter (kept for backward compat with DevTranslations) ──────────
export async function translateRange(book, fromPage, toPage, targetLang, glossary, onProgress) {
  const pdf = await loadPdfDocument(book.pdf_url);
  const key = `${book.id}_${targetLang}`;
  _activeTranslations[key] = false;
  const results = [];

  for (let page = fromPage; page <= toPage; page++) {
    if (_activeTranslations[key]) {
      onProgress?.({ cancelled: true, current: page - fromPage, total: toPage - fromPage + 1 });
      delete _activeTranslations[key];
      return results;
    }
    onProgress?.({ current: page - fromPage + 1, total: toPage - fromPage + 1, currentPage: page, phase: "translate" });
    try {
      const result = await _translateSinglePage(book, pdf, page, targetLang, glossary, onProgress, "range");
      results.push(result);
    } catch (e) {
      console.error(`Failed to translate page ${page}:`, e);
    }
  }

  delete _activeTranslations[key];
  return results;
}

export async function translateChapter(book, chapter, targetLang, glossary, onProgress) {
  // Chapter translation without TOC — translate full book as fallback
  return translateFullBook(book, targetLang, glossary, onProgress);
}

// ─── Cancel translation ────────────────────────────────────────────────────────
export function cancelTranslation(bookId, targetLang) {
  _activeTranslations[`${bookId}_${targetLang}`] = true;
}

export function isTranslationInProgress(bookId, targetLang) {
  return _activeTranslations[`${bookId}_${targetLang}`] !== undefined;
}

// ─── Delete ────────────────────────────────────────────────────────────────────
export async function deleteTranslations(bookId, targetLang) {
  await base44.entities.Translation.deleteMany({
    book_id: bookId,
    target_language: targetLang,
  });
}

export async function deletePageTranslation(translationId) {
  await base44.entities.Translation.delete(translationId);
}

// ─── Progress & stats ─────────────────────────────────────────────────────────
export async function getTranslationProgress(bookId, targetLang) {
  const translations = await getBookTranslations(bookId, targetLang);
  return { translatedPages: translations.length, pages: translations };
}

export async function getAllTranslatedBooks() {
  try {
    const all = await base44.entities.Translation.list("-updated_date", 500);
    const bookMap = {};
    (all || []).forEach((t) => {
      if (!bookMap[t.book_id]) {
        bookMap[t.book_id] = {
          book_id: t.book_id, book_title: t.book_title,
          languages: new Set(), total_pages: t.total_pages || 0,
          completed: 0, pending: 0, errors: 0,
        };
      }
      bookMap[t.book_id].languages.add(t.target_language);
      if (t.total_pages) bookMap[t.book_id].total_pages = t.total_pages;
      if (t.status === "completed") bookMap[t.book_id].completed++;
      else if (t.status === "error") bookMap[t.book_id].errors++;
      else bookMap[t.book_id].pending++;
    });
    return Object.values(bookMap).map((b) => ({
      ...b, languages: Array.from(b.languages),
      progress: b.total_pages > 0 ? Math.round((b.completed / b.total_pages) * 100) : 0,
    }));
  } catch (e) {
    return [];
  }
}

export async function getTranslationStats() {
  try {
    const all = await base44.entities.Translation.list("-updated_date", 500);
    const languages = new Set();
    let completed = 0, pending = 0, errors = 0;
    const bookIds = new Set();
    (all || []).forEach((t) => {
      languages.add(t.target_language);
      bookIds.add(t.book_id);
      if (t.status === "completed") completed++;
      else if (t.status === "error") errors++;
      else pending++;
    });
    return {
      totalBooks: bookIds.size, totalTranslations: (all || []).length,
      languagesUsed: Array.from(languages), completed, pending, errors,
    };
  } catch (e) {
    return { totalBooks: 0, totalTranslations: 0, languagesUsed: [], completed: 0, pending: 0, errors: 0 };
  }
}