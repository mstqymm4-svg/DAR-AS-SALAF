/**
 * translationEngine — Core AI translation engine for religious texts
 * 
 * Flow:
 *  1. Extract text from PDF (text layer → OCR fallback via LLM vision)
 *  2. Validate quality of extracted text
 *  3. Translate with religious-aware LLM prompt
 *  4. Cache results per page, track errors, support resume
 * 
 * Source language: Urdu (ur) — all source books are in Urdu
 * Target languages: Arabic (ar), English (en), Hindi (hi), + any dev-added language
 */
import { base44 } from "@/api/base44Client";

// Read setting from localStorage directly to avoid circular import with settingsStore
function getSetting(key) {
  try { return localStorage.getItem("devs_" + key) || ""; } catch(e) { return ""; }
}

// ─── Default languages ───────────────────────────────────────────────────────
const DEFAULT_LANGUAGES = [
  { code: "ar", name: "العربية",   native_name: "العربية",   rtl: true,  active: true, font_family: "" },
  { code: "ur", name: "الأردية",   native_name: "اردو",      rtl: true,  active: true, font_family: "var(--font-nastaliq)" },
  { code: "hi", name: "الهندية",   native_name: "हिन्दी",     rtl: false, active: true, font_family: "var(--font-devanagari)" },
  { code: "en", name: "الإنجليزية", native_name: "English",  rtl: false, active: true, font_family: "var(--font-inter)" },
];

const LANGUAGE_NAMES = {
  ar: "العربية", ur: "الأردية", hi: "الهندية", en: "الإنجليزية",
  fr: "الفرنسية", tr: "التركية", fa: "الفارسية", id: "الإندونيسية",
  ru: "الروسية", es: "الإسبانية", de: "الألمانية",
};

// Urdu Unicode range: U+0600–U+06FF (Arabic script covers Urdu too)
const URDU_CHAR_REGEX = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;

// ─── In-memory caches ─────────────────────────────────────────────────────────
const _pdfTextCache = {};       // bookId -> extracted data
const _activeTranslations = {}; // `${bookId}_${targetLang}` -> cancellation flag

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
/**
 * Validates extracted text quality.
 * Returns { valid, reason, score }
 */
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
  // Check for Urdu/Arabic script
  if (!URDU_CHAR_REGEX.test(trimmed)) {
    return { valid: false, reason: "لا يحتوي على حروف عربية/أردية", score: "fail" };
  }
  // Check for garbage (repeated characters, encoding issues)
  const uniqueChars = new Set(trimmed.replace(/\s/g, ""));
  if (uniqueChars.size < 5) {
    return { valid: false, reason: "النص يحتوي على تكرار مشبوه", score: "fail" };
  }
  // Score based on length
  let score = "good";
  if (trimmed.length < 50) score = "low";
  else if (trimmed.length < 200) score = "medium";
  return { valid: true, reason: "", score };
}

// ─── PDF text extraction (with OCR fallback) ──────────────────────────────────

/**
 * Inspect a book's PDF — checks if it has text, needs OCR, and page count.
 */
export async function inspectBook(pdfUrl, bookId) {
  if (!pdfUrl) return { has_pdf: false, has_text: false, needs_ocr: true, total_pages: 0 };

  try {
    const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
      file_url: pdfUrl,
      json_schema: {
        type: "object",
        properties: {
          pages: {
            type: "array",
            items: {
              type: "object",
              properties: {
                page_number: { type: "number" },
                text: { type: "string" },
              },
            },
          },
          total_pages: { type: "number" },
        },
      },
    });

    const pages = result?.output?.pages || result?.pages || [];
    const totalPages = result?.output?.total_pages || result?.total_pages || pages.length;
    const pagesWithText = pages.filter((p) => p.text && p.text.trim().length > 10);
    const pagesWithoutText = pages.filter((p) => !p.text || p.text.trim().length <= 10);

    return {
      has_pdf: true,
      has_text: pagesWithText.length > 0,
      needs_ocr: pagesWithoutText.length > 0,
      total_pages: totalPages,
      pages_with_text: pagesWithText.length,
      pages_without_text: pagesWithoutText.length,
      sample_pages: pages.slice(0, 3),
    };
  } catch (e) {
    return { has_pdf: true, has_text: false, needs_ocr: true, total_pages: 0, error: e.message };
  }
}

/**
 * Extract text from a single PDF page using LLM vision (OCR).
 * Uses gemini_3_flash which supports file_urls (vision) + web search.
 */
async function extractPageWithOCR(pdfUrl, pageNumber) {
  const prompt = `أنت نظام OCR متقدم متخصص في قراءة النصوص الأردية والعربية من ملفات PDF المصورة.

مهمتك: استخراج النص الكامل من الصفحة رقم ${pageNumber} من ملف PDF المرفق.

## قواعد الاستخراج:
1. اقرأ النص الأردي بدقة عالية من اليمين إلى اليسار
2. حافظ على ترتيب الفقرات والأسطر كما في الأصل
3. لا تضف ولا تحذف أي كلمة أو حرف
4. حافظ على علامات الترقيم والأرقام
5. إذا كانت الصفحة تحتوي على آيات قرآنية، احتفظ بالنص كما هو
6. إذا كانت الصفحة تحتوي على عنوان، ضعه في سطر منفصل
7. تجاهل أرقام الصفحات والترويسات غير المتعلقة بالمحتوى
8. إذا كانت الصفحة فارغة أو صورة فقط بدون نص، أرجع نصاً فارغاً

أرجع النص المستخرج فقط دون أي تعليق.`;

  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    model: "gemini_3_flash",
    file_urls: [pdfUrl],
    response_json_schema: {
      type: "object",
      properties: {
        text: { type: "string" },
        quality: { type: "string", enum: ["high", "medium", "low", "empty"] },
        notes: { type: "string" },
      },
    },
  });

  return {
    text: result?.text || "",
    quality: result?.quality || "medium",
    notes: result?.notes || "",
  };
}

/**
 * Smart PDF text extraction with OCR fallback.
 * 1. Try ExtractDataFromUploadedFile (fast, works for text-based PDFs)
 * 2. For pages with no text, use LLM vision OCR
 * 3. Validate quality of all extracted text
 */
export async function extractPdfText(pdfUrl, bookId, onProgress) {
  if (_pdfTextCache[bookId]) return _pdfTextCache[bookId];

  // Step 1: Try standard text extraction
  let pages = [];
  let totalPages = 0;
  let toc = [];

  try {
    const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
      file_url: pdfUrl,
      json_schema: {
        type: "object",
        properties: {
          pages: {
            type: "array",
            items: {
              type: "object",
              properties: {
                page_number: { type: "number" },
                text: { type: "string" },
              },
            },
          },
          total_pages: { type: "number" },
          title: { type: "string" },
          table_of_contents: {
            type: "array",
            items: {
              type: "object",
              properties: {
                chapter_title: { type: "string" },
                start_page: { type: "number" },
              },
            },
          },
        },
      },
    });

    pages = result?.output?.pages || result?.pages || [];
    totalPages = result?.output?.total_pages || result?.total_pages || pages.length;
    toc = result?.output?.table_of_contents || result?.table_of_contents || [];
  } catch (e) {
    console.error("Text extraction failed:", e);
  }

  // Step 2: Identify pages needing OCR
  const pagesNeedingOCR = pages.filter((p) => {
    const validation = validateText(p.text);
    return !validation.valid;
  });

  // Step 3: OCR fallback for pages without text
  let extractionMethod = "text";
  if (pagesNeedingOCR.length > 0) {
    extractionMethod = pagesNeedingOCR.length === pages.length ? "ocr" : "mixed";
    
    onProgress?.({ phase: "ocr", current: 0, total: pagesNeedingOCR.length });

    for (let i = 0; i < pagesNeedingOCR.length; i++) {
      const page = pagesNeedingOCR[i];
      onProgress?.({ phase: "ocr", current: i + 1, total: pagesNeedingOCR.length, currentPage: page.page_number });

      try {
        const ocrResult = await extractPageWithOCR(pdfUrl, page.page_number);
        if (ocrResult.text && ocrResult.text.trim().length > 0) {
          page.text = ocrResult.text;
          page.quality = ocrResult.quality;
          page.extraction_method = "ocr";
        }
      } catch (e) {
        console.error(`OCR failed for page ${page.page_number}:`, e);
        page.ocr_error = e.message;
      }
    }
  }

  // Step 4: Final validation
  const validPages = pages.filter((p) => validateText(p.text).valid);

  const result = {
    pages,
    total_pages: totalPages,
    table_of_contents: toc,
    extraction_method: extractionMethod,
    pages_with_text: validPages.length,
    pages_without_text: pages.length - validPages.length,
  };

  _pdfTextCache[bookId] = result;
  return result;
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

6. **أسماء العلماء**: اكتبها بالحروف المناسبة للغة الهدف مع الحفاظ على النطق الصحيح (مثال: الإمام الشافعي، ابن تيمية، الإمام مالك).

7. **أسماء الكتب**: احتفظ بالاسم الأصلي ثم ضع ترجمته بين قوسين.

8. **لا تختصر**: ترجم النص كاملاً كما هو، دون اختصار أو إعادة صياغة أو تلخيص.

9. **الحفاظ على الأرقام والمراجع**: حافظ على جميع أرقام الصفحات والآيات والأحاديث والإحالات والحواشي.

10. **الأسلوب**: استخدم أسلوباً دينياً رصيناً مناسباً للنص الإسلامي، وتجنب العامية.

11. **السياق**: انتبه لاختلاف معاني الكلمات حسب المجال:
    - الفقه: الأحكام العملية
    - العقيدة: المسائل الاعتقادية
    - التفسير: معاني القرآن
    - الحديث: النصوص النبوية
    - السيرة: الأحداث التاريخية

12. **النص الأردي**: النص المصدر مكتوب باللغة الأردية (اردو) باستخدام الخط النستعليق. اقرأه بعناية وحافظ على كل كلمة وحرف في الترجمة.`;

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
  // Delete existing error record
  const existing = await base44.entities.Translation.filter({
    book_id: book.id,
    page_number: pageNumber,
    target_language: targetLang,
    status: "error",
  });
  for (const rec of existing || []) {
    await base44.entities.Translation.delete(rec.id);
  }

  const extractedData = await extractPdfText(book.pdf_url, book.id);
  const glossary = await getGlossary(targetLang);
  return translatePage(book, pageNumber, targetLang, extractedData, glossary, "page");
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
      book_id: bookId,
      page_number: pageNumber,
      target_language: targetLang,
      status: "completed",
    });
    return results && results.length > 0 ? results[0] : null;
  } catch (e) {
    return null;
  }
}

export async function getBookTranslations(bookId, targetLang) {
  try {
    const results = await base44.entities.Translation.filter({
      book_id: bookId,
      target_language: targetLang,
      status: "completed",
    });
    return (results || []).sort((a, b) => a.page_number - b.page_number);
  } catch (e) {
    return [];
  }
}

// ─── Single page translation ─────────────────────────────────────────────────
export async function translatePage(book, pageNumber, targetLang, extractedData, glossary, method = "page") {
  // Check cache first
  const existing = await getTranslatedPage(book.id, pageNumber, targetLang);
  if (existing) return existing;

  const page = extractedData?.pages?.find((p) => p.page_number === pageNumber);
  if (!page) {
    await logError(book.id, book.title, pageNumber, `لم يتم العثور على الصفحة ${pageNumber} في البيانات المستخرجة`, "extraction_failed", targetLang);
    throw new Error(`لم يتم العثور على الصفحة ${pageNumber}`);
  }

  // Validate text quality
  const validation = validateText(page.text);
  if (!validation.valid) {
    await logError(book.id, book.title, pageNumber, `نص الصفحة غير صالح: ${validation.reason}`, "quality_check_failed", targetLang);
    throw new Error(`نص الصفحة ${pageNumber} غير صالح: ${validation.reason}`);
  }

  // Create pending record
  const record = await base44.entities.Translation.create({
    book_id: book.id,
    book_title: book.title,
    target_language: targetLang,
    source_language: "ur",
    page_number: pageNumber,
    original_text: page.text,
    translated_text: "",
    status: "translating",
    translation_method: method,
    extraction_method: page.extraction_method || extractedData?.extraction_method || "text",
    total_pages: extractedData?.total_pages || extractedData?.pages?.length || 0,
    quality_score: page.quality || validation.score,
  });

  try {
    const translatedText = await translateText(
      page.text, "ur", targetLang, glossary, book.category, book.title, book.author
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

// ─── Range translation ────────────────────────────────────────────────────────
export async function translateRange(book, fromPage, toPage, targetLang, glossary, onProgress) {
  const extractedData = await extractPdfText(book.pdf_url, book.id, (p) => onProgress?.({ ...p, phase: p.phase || "extract" }));
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
      const result = await translatePage(book, page, targetLang, extractedData, glossary, "range");
      results.push(result);
    } catch (e) {
      console.error(`Failed to translate page ${page}:`, e);
    }
  }

  delete _activeTranslations[key];
  return results;
}

// ─── Full book translation ────────────────────────────────────────────────────
export async function translateFullBook(book, targetLang, glossary, onProgress) {
  const extractedData = await extractPdfText(book.pdf_url, book.id, (p) => onProgress?.({ ...p, phase: p.phase || "extract" }));
  const totalPages = extractedData?.total_pages || extractedData?.pages?.length || 0;

  if (totalPages === 0) {
    throw new Error("لم يتم العثور على صفحات قابلة للترجمة في الكتاب");
  }

  const key = `${book.id}_${targetLang}`;
  _activeTranslations[key] = false;
  const results = [];

  // Find already completed pages to support resume
  const existing = await getBookTranslations(book.id, targetLang);
  const completedPages = new Set(existing.map((t) => t.page_number));

  for (let page = 1; page <= totalPages; page++) {
    if (_activeTranslations[key]) {
      onProgress?.({ cancelled: true, current: page, total: totalPages });
      delete _activeTranslations[key];
      return results;
    }

    // Skip already completed pages (resume support)
    if (completedPages.has(page)) {
      onProgress?.({ current: page, total: totalPages, currentPage: page, phase: "translate", skipped: true });
      continue;
    }

    onProgress?.({ current: page, total: totalPages, currentPage: page, phase: "translate" });

    try {
      const result = await translatePage(book, page, targetLang, extractedData, glossary, "full");
      results.push(result);
    } catch (e) {
      console.error(`Failed to translate page ${page}:`, e);
    }
  }

  delete _activeTranslations[key];
  return results;
}

// ─── Chapter translation ──────────────────────────────────────────────────────
export async function translateChapter(book, chapter, targetLang, glossary, onProgress) {
  const extractedData = await extractPdfText(book.pdf_url, book.id);
  const toc = extractedData?.table_of_contents || [];
  const chapterIdx = toc.findIndex((c) => c.chapter_title === chapter);
  if (chapterIdx === -1) throw new Error("الفصل غير موجود");

  const fromPage = toc[chapterIdx].start_page;
  const toPage = chapterIdx < toc.length - 1 ? toc[chapterIdx + 1].start_page - 1 : extractedData?.total_pages || 999;

  return translateRange(book, fromPage, toPage, targetLang, glossary, onProgress);
}

// ─── Cancel translation ────────────────────────────────────────────────────────
export function cancelTranslation(bookId, targetLang) {
  _activeTranslations[`${bookId}_${targetLang}`] = true;
}

export function isTranslationInProgress(bookId, targetLang) {
  return _activeTranslations[`${bookId}_${targetLang}`] !== undefined;
}

// ─── Delete / re-translate ────────────────────────────────────────────────────
export async function deleteTranslations(bookId, targetLang) {
  await base44.entities.Translation.deleteMany({
    book_id: bookId,
    target_language: targetLang,
  });
}

export async function deletePageTranslation(translationId) {
  await base44.entities.Translation.delete(translationId);
}

export async function retranslatePage(book, pageNumber, targetLang, extractedData, glossary) {
  const existing = await getTranslatedPage(book.id, pageNumber, targetLang);
  if (existing) await base44.entities.Translation.delete(existing.id);
  return translatePage(book, pageNumber, targetLang, extractedData, glossary, "page");
}

// ─── Progress & stats ─────────────────────────────────────────────────────────
export async function getTranslationProgress(bookId, targetLang) {
  const translations = await getBookTranslations(bookId, targetLang);
  return {
    translatedPages: translations.length,
    pages: translations,
  };
}

export async function getAllTranslatedBooks() {
  try {
    const all = await base44.entities.Translation.list("-updated_date", 500);
    const bookMap = {};
    (all || []).forEach((t) => {
      if (!bookMap[t.book_id]) {
        bookMap[t.book_id] = {
          book_id: t.book_id,
          book_title: t.book_title,
          languages: new Set(),
          total_pages: t.total_pages || 0,
          completed: 0,
          pending: 0,
          errors: 0,
        };
      }
      bookMap[t.book_id].languages.add(t.target_language);
      if (t.total_pages) bookMap[t.book_id].total_pages = t.total_pages;
      if (t.status === "completed") bookMap[t.book_id].completed++;
      else if (t.status === "error") bookMap[t.book_id].errors++;
      else bookMap[t.book_id].pending++;
    });

    return Object.values(bookMap).map((b) => ({
      ...b,
      languages: Array.from(b.languages),
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
      totalBooks: bookIds.size,
      totalTranslations: (all || []).length,
      languagesUsed: Array.from(languages),
      completed,
      pending,
      errors,
    };
  } catch (e) {
    return { totalBooks: 0, totalTranslations: 0, languagesUsed: [], completed: 0, pending: 0, errors: 0 };
  }
}