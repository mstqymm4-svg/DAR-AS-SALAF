/**
 * pdfLoader — PDF.js setup and helper functions
 * Uses pdfjs-dist for client-side PDF rendering and text extraction.
 * Supports books of any size (100 – 5000+ pages) with lazy page loading.
 */
import * as pdfjsLib from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

// Cache loaded PDF documents (url -> pdf proxy)
const _docCache = new Map();

/**
 * Load a PDF document. Cached per URL.
 * pdfjs loads pages lazily — numPages is available immediately,
 * but page data is only fetched when getPage(n) is called.
 */
export async function loadPdfDocument(url) {
  if (_docCache.has(url)) return _docCache.get(url);
  const loadingTask = pdfjsLib.getDocument({
    url,
    rangeChunkSize: 65536,
    disableAutoFetch: false,
    disableStream: false,
  });
  const pdf = await loadingTask.promise;
  _docCache.set(url, pdf);
  return pdf;
}

/** Get total page count without loading all pages. */
export async function getPdfPageCount(url) {
  const pdf = await loadPdfDocument(url);
  return pdf.numPages;
}

/**
 * Extract text from a single PDF page using the text layer.
 * Fast — no API calls, runs entirely client-side.
 */
export async function extractPageText(pdf, pageNumber) {
  const page = await pdf.getPage(pageNumber);
  const content = await page.getTextContent();
  return content.items.map((item) => item.str).join(" ");
}

/**
 * Render a PDF page to a canvas element.
 * Returns the render task so it can be cancelled.
 */
export async function renderPageToCanvas(pdf, pageNumber, canvas, scale = 1.5) {
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  const ctx = canvas.getContext("2d");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const renderTask = page.render({ canvasContext: ctx, viewport });
  await renderTask.promise;
  return renderTask;
}

/**
 * Render a PDF page to an image Blob (for OCR upload).
 */
export async function renderPageToImageBlob(pdf, pageNumber, scale = 2) {
  const canvas = document.createElement("canvas");
  await renderPageToCanvas(pdf, pageNumber, canvas, scale);
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}