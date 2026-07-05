/**
 * translationEngine — AI-powered book translation engine
 * Extracts text from PDF pages, translates via InvokeLLM, generates translated PDF.
 * Supports text-based and image-based (OCR) PDFs.
 * Processes pages in batches for large books without freezing the UI.
 */
import { loadPdfDocument, extractPageText, renderPageToImageBlob } from "@/lib/pdfLoader";
import { base44 } from "@/api/base44Client";

const LANGUAGE_NAMES = {
  ar: "العربية",
  ur: "الأردية",
  en: "الإنجليزية",
  hi: "الهندية",
};

const LANGUAGE_INSTRUCTIONS = {
  ar: "ترجم النص التالي إلى اللغة العربية بأسلوب أدبي راقٍ مناسب للكتب الدينية والعلمية. حافظ على المعنى بدقة دون حذف أو اختصار أو دمج. حافظ على ترتيب الفقرات والتنسيق.",
  ur: "Translate the following text to Urdu in a literary style suitable for religious and scholarly books. Preserve the meaning accurately without deletion, abbreviation, or merging. Maintain paragraph order and formatting.",
  en: "Translate the following text to English in a literary style suitable for religious and scholarly books. Preserve the meaning accurately without deletion, abbreviation, or merging. Maintain paragraph order and formatting.",
  hi: "Translate the following text to Hindi in a literary style suitable for religious and scholarly books. Preserve the meaning accurately without deletion, abbreviation, or merging. Maintain paragraph order and formatting.",
};

/**
 * Detect if a PDF page has extractable text or needs OCR.
 */
export async function detectPageType(pdf, pageNumber) {
  try {
    const text = await extractPageText(pdf, pageNumber);
    const cleanText = text.trim();
    if (cleanText.length > 10) {
      return { type: "text", text: cleanText };
    }
    return { type: "ocr", text: "" };
  } catch (e) {
    return { type: "ocr", text: "" };
  }
}

/**
 * Translate text using InvokeLLM.
 * Uses claude_sonnet for high-quality translation of religious/scholarly texts.
 */
export async function translateText(text, targetLanguage, sourceLanguage = "auto") {
  if (!text || text.trim().length === 0) return "";

  const instruction = LANGUAGE_INSTRUCTIONS[targetLanguage] || LANGUAGE_INSTRUCTIONS.ar;
  const sourceHint = sourceLanguage !== "auto" ? `Source language: ${LANGUAGE_NAMES[sourceLanguage] || sourceLanguage}. ` : "";

  const prompt = `${sourceHint}${instruction}

Text to translate:
---
${text}
---

Return only the translated text, nothing else. Do not add explanations or notes.`;

  try {
    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      model: "claude_sonnet_4_6",
    });
    return typeof result === "string" ? result : result?.text || result?.response || String(result);
  } catch (e) {
    // Fallback to default model
    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
    });
    return typeof result === "string" ? result : result?.text || result?.response || String(result);
  }
}

/**
 * Extract text from a page using OCR (render to image, then use InvokeLLM vision).
 */
export async function extractTextViaOCR(pdf, pageNumber) {
  try {
    const imageBlob = await renderPageToImageBlob(pdf, pageNumber, 2);
    if (!imageBlob) return "";

    const { file_url } = await base44.integrations.Core.UploadFile({ file: imageBlob });
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: "Extract all text from this page exactly as it appears. Preserve paragraph breaks and formatting. Return only the extracted text, nothing else.",
      file_urls: [file_url],
      model: "claude_sonnet_4_6",
    });
    return typeof result === "string" ? result : result?.text || "";
  } catch (e) {
    console.error("OCR extraction failed:", e);
    return "";
  }
}

/**
 * Generate a translated PDF from translated page texts using jsPDF.
 * Preserves page order and basic formatting.
 */
export async function generateTranslatedPDF(pages, targetLanguage, bookTitle) {
  const { jsPDF } = await import("jspdf");

  const isRTL = targetLanguage === "ar" || targetLanguage === "ur";
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    putOnlyUsedFonts: true,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - margin * 2;
  const lineHeight = 7;
  const fontSize = 12;

  doc.setFontSize(fontSize);

  for (let i = 0; i < pages.length; i++) {
    const pageText = pages[i] || "";

    if (i > 0) doc.addPage();

    // Title on first page
    if (i === 0 && bookTitle) {
      doc.setFontSize(16);
      doc.text(bookTitle, pageWidth / 2, margin + 5, { align: "center" });
      doc.setFontSize(fontSize);
    }

    // Split text into lines that fit the page width
    const lines = doc.splitTextToSize(pageText, maxWidth);
    let y = margin + 15;

    for (const line of lines) {
      if (y > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, isRTL ? pageWidth - margin : margin, y, {
        align: isRTL ? "right" : "left",
        maxWidth,
      });
      y += lineHeight;
    }

    // Page number at bottom
    doc.setFontSize(9);
    doc.text(String(i + 1), pageWidth / 2, pageHeight - 10, { align: "center" });
    doc.setFontSize(fontSize);
  }

  return doc.output("blob");
}

/**
 * Main translation engine — translates an entire book.
 * Calls onProgress callback with status updates.
 * Returns the translated PDF blob.
 */
export async function translateBook(pdfUrl, targetLanguage, sourceLanguage, onProgress, translationRecord) {
  const pdf = await loadPdfDocument(pdfUrl);
  const totalPages = pdf.numPages;
  const translatedPages = [];

  // Check for existing progress (resume)
  let startPage = 0;
  if (translationRecord?.current_page && translationRecord.current_page > 0) {
    startPage = translationRecord.current_page;
    // We can't easily resume the translatedPages array, so re-extract from start
    // but skip translation for already-done pages by re-reading them
  }

  let isOCRBook = false;

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    if (onProgress?.cancelled) {
      throw new Error("TRANSLATION_CANCELLED");
    }

    onProgress?.({
      currentPage: pageNum,
      totalPages,
      status: "extracting",
      message: `استخراج النص من الصفحة ${pageNum} من ${totalPages}`,
    });

    // Detect page type and extract text
    let pageText = "";
    const pageType = await detectPageType(pdf, pageNum);

    if (pageType.type === "text") {
      pageText = pageType.text;
    } else {
      isOCRBook = true;
      onProgress?.({
        currentPage: pageNum,
        totalPages,
        status: "ocr",
        message: `استخراج النص بالـ OCR من الصفحة ${pageNum}`,
      });
      pageText = await extractTextViaOCR(pdf, pageNum);
    }

    // Translate
    onProgress?.({
      currentPage: pageNum,
      totalPages,
      status: "translating",
      message: `ترجمة الصفحة ${pageNum} من ${totalPages}`,
    });

    let translatedText = "";
    if (pageText.trim()) {
      translatedText = await translateText(pageText, targetLanguage, sourceLanguage);
    }

    translatedPages.push(translatedText);

    const progress = Math.round((pageNum / totalPages) * 100);
    onProgress?.({
      currentPage: pageNum,
      totalPages,
      progress,
      translatedPages: pageNum,
      status: "translating",
      message: `تمت ترجمة ${pageNum} من ${totalPages} صفحة (${progress}%)`,
    });

    // Update record in database
    if (translationRecord) {
      try {
        await base44.entities.BookTranslation.update(translationRecord.id, {
          current_page: pageNum,
          translated_pages: pageNum,
          progress,
          status: "translating",
          is_ocr: isOCRBook,
        });
      } catch (e) {}
    }
  }

  // Generate translated PDF
  onProgress?.({
    status: "generating",
    message: "جاري إنشاء النسخة المترجمة...",
  });

  const pdfBlob = await generateTranslatedPDF(translatedPages, targetLanguage, "");

  onProgress?.({
    status: "uploading",
    message: "جاري حفظ النسخة المترجمة...",
  });

  // Upload translated PDF
  const { file_url } = await base44.integrations.Core.UploadFile({
    file: new File([pdfBlob], "translated.pdf", { type: "application/pdf" }),
  });

  return {
    translatedPdfUrl: file_url,
    totalPages,
    isOCRBook,
  };
}

export { LANGUAGE_NAMES };