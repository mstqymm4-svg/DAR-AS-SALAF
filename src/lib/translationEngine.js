/**
 * translationEngine — Core AI translation engine for religious texts
 * Handles PDF text extraction, LLM translation with religious context,
 * caching, and progress tracking for large books.
 */
import { base44 } from "@/api/base44Client";

// Read setting from localStorage directly to avoid circular import with settingsStore
function getSetting(key) {
  try { return localStorage.getItem("devs_" + key) || ""; } catch(e) { return ""; }
}

// ─── Default languages ───────────────────────────────────────────────────────
const DEFAULT_LANGUAGES = [
  { code: "ar", name: "العربية", native_name: "العربية", rtl: true, active: true, font_family: "" },
  { code: "ur", name: "الأردية", native_name: "اردو", rtl: true, active: true, font_family: "var(--font-nastaliq)" },
  { code: "hi", name: "الهندية", native_name: "हिन्दी", rtl: false, active: true, font_family: "var(--font-devanagari)" },
  { code: "en", name: "الإنجليزية", native_name: "English", rtl: false, active: true, font_family: "var(--font-inter)" },
];

const LANGUAGE_NAMES = {
  ar: "العربية", ur: "الأردية", hi: "الهندية", en: "الإنجليزية",
  fr: "الفرنسية", tr: "التركية", fa: "الفارسية", id: "الإندونيسية",
  ru: "الروسية", es: "الإسبانية", de: "الألمانية",
};

// ─── In-memory caches ─────────────────────────────────────────────────────────
const _pdfTextCache = {};   // bookId -> extracted data
const _activeTranslations = {}; // `${bookId}_${targetLang}` -> true if should cancel

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

// ─── PDF text extraction ──────────────────────────────────────────────────────
export async function extractPdfText(pdfUrl, bookId) {
  if (_pdfTextCache[bookId]) return _pdfTextCache[bookId];

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
  let prompt = `أنت مترجم خبير متخصص في النصوص الدينية الإسلامية، تتقن علوم القرآن الكريم والحديث الشريف والفقه الإسلامي والعقيدة والسيرة النبوية والتاريخ الإسلامي.

مهمتك: ترجمة النص التالي بدقة عالية جداً من ${sourceLangName} إلى ${targetLangName}.

## القواعد الصارمة للترجمة:

1. **الحفاظ التام على المعنى**: لا تضف ولا تحذف ولا تغير أي معنى من المعاني الأصلية تحت أي ظرف.

2. **الحفاظ على البنية**: حافظ على العناوين والفقرات وعلامات الترقيم والحواشي والأرقام كما هي تماماً.

3. **الآيات القرآنية**: اترك النص العربي للآية كما هو، ثم ضع ترجمتها بعدها بين قوسين.

4. **الأحاديث النبوية**: حافظ على السند إن وُجد، وترجم المتن بدقة مع الحفاظ على المعنى الشرعي.

5. **المصطلحات الشرعية**: استخدم الترجمة المقبولة في اللغة الهدف:
   - صلاة، زكاة، حج، صوم، وضوء، جهاد، إيمان، تقوى، توحيد، شرك، بدعة، سنة، فرض، واجب، مباح، حرام، مكروه
   - اختر الترجمة الصحيحة حسب السياق الشرعي (فقهي، عقدي، تفسيري)

6. **أسماء العلماء**: اكتبها بالحروف المناسبة للغة الهدف مع الحفاظ على النطق الصحيح (مثال: الإمام الشافعي، ابن تيمية، الإمام مالك).

7. **أسماء الكتب**: احتفظ بالاسم العربي ثم ضع ترجمته بين قوسين.

8. **لا تختصر**: ترجم النص كاملاً كما هو، دون اختصار أو إعادة صياغة أو تلخيص.

9. **الحفاظ على الأرقام والمراجع**: حافظ على جميع أرقام الصفحات والآيات والأحاديث والإحالات والحواشي.

10. **الأسلوب**: استخدم أسلوباً دينياً رصيناً مناسباً للنص الإسلامي، وتجنب العامية.

11. **السياق**: انتبه لاختلاف معاني الكلمات حسب المجال:
    - الفقه: الأحكام العملية
    - العقيدة: المسائل الاعتقادية
    - التفسير: معاني القرآن
    - الحديث: النصوص النبوية
    - السيرة: الأحداث التاريخية`;

  if (bookTitle) prompt += `\n\n## معلومات الكتاب:\nالعنوان: ${bookTitle}`;
  if (author) prompt += `\nالمؤلف: ${author}`;
  if (bookCategory) prompt += `\nالتصنيف: ${bookCategory}`;

  prompt += buildGlossarySection(glossary);

  prompt += `\n\n## النص المطلوب ترجمته:\n---\n${text}\n---\n\nقدّم الترجمة فقط دون أي تعليق أو مقدمة أو خاتمة. الترجمة المباشرة فقط.`;

  return prompt;
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
  if (!page || !page.text || page.text.trim().length === 0) {
    throw new Error(`لم يتم العثور على نص قابل للترجمة في الصفحة ${pageNumber}`);
  }

  // Create pending record
  const record = await base44.entities.Translation.create({
    book_id: book.id,
    book_title: book.title,
    target_language: targetLang,
    source_language: "ar",
    page_number: pageNumber,
    original_text: page.text,
    translated_text: "",
    status: "translating",
    translation_method: method,
    total_pages: extractedData?.total_pages || extractedData?.pages?.length || 0,
  });

  try {
    const translatedText = await translateText(
      page.text, "ar", targetLang, glossary, book.category, book.title, book.author
    );

    const updated = await base44.entities.Translation.update(record.id, {
      translated_text: translatedText,
      status: "completed",
    });

    return updated;
  } catch (e) {
    await base44.entities.Translation.update(record.id, {
      status: "error",
      error_message: e.message || "خطأ في الترجمة",
    });
    throw e;
  }
}

// ─── Range translation ────────────────────────────────────────────────────────
export async function translateRange(book, fromPage, toPage, targetLang, glossary, onProgress) {
  const extractedData = await extractPdfText(book.pdf_url, book.id);
  const key = `${book.id}_${targetLang}`;
  _activeTranslations[key] = false;
  const results = [];

  for (let page = fromPage; page <= toPage; page++) {
    if (_activeTranslations[key]) {
      onProgress?.({ cancelled: true, current: page - fromPage, total: toPage - fromPage + 1 });
      delete _activeTranslations[key];
      return results;
    }

    onProgress?.({ current: page - fromPage + 1, total: toPage - fromPage + 1, currentPage: page });

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
  const extractedData = await extractPdfText(book.pdf_url, book.id);
  const totalPages = extractedData?.total_pages || extractedData?.pages?.length || 0;

  if (totalPages === 0) {
    throw new Error("لم يتم العثور على صفحات قابلة للترجمة في الكتاب");
  }

  const key = `${book.id}_${targetLang}`;
  _activeTranslations[key] = false;
  const results = [];

  for (let page = 1; page <= totalPages; page++) {
    if (_activeTranslations[key]) {
      onProgress?.({ cancelled: true, current: page, total: totalPages });
      delete _activeTranslations[key];
      return results;
    }

    onProgress?.({ current: page, total: totalPages, currentPage: page });

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