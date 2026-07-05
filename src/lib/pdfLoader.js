/**
 * pdfLoader — PDF.js setup and helper functions
 * Optimized for Arabic/Urdu PDFs with embedded fonts.
 * Canvas rendering preserves the original layout exactly.
 */
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerPort = new Worker(
  new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url),
  { type: "module" }
);

// Cache loaded PDF documents (url -> pdf proxy)
const _docCache = new Map();

// Rendered page cache (pageKey -> dataURL) for instant re-display
const _pageCache = new Map();
const MAX_PAGE_CACHE = 12;

/**
 * Load a PDF document. Cached per URL.
 * Uses larger range chunks for faster streaming of large files.
 */
export async function loadPdfDocument(url) {
  if (_docCache.has(url)) return _docCache.get(url);
  const loadingTask = pdfjsLib.getDocument({
    url,
    rangeChunkSize: 262144, // 256KB chunks — faster for large PDFs
    disableAutoFetch: false,
    disableStream: false,
    cMapUrl: "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/",
    cMapPacked: true,
    standardFontDataUrl: "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/standard_fonts/",
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
 * Render a PDF page to a canvas with devicePixelRatio for crisp text.
 * Returns the canvas element. Uses cache for re-renders.
 */
export async function renderPageToCanvas(pdf, pageNumber, canvas, scale = 1.5) {
  const page = await pdf.getPage(pageNumber);
  const dpr = window.devicePixelRatio || 1;
  const renderScale = scale * dpr;
  const viewport = page.getViewport({ scale: renderScale });
  const ctx = canvas.getContext("2d", { alpha: false });
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

/** Cache a rendered page dataURL. */
export function cachePage(key, dataUrl) {
  if (_pageCache.size >= MAX_PAGE_CACHE) {
    const firstKey = _pageCache.keys().next().value;
    _pageCache.delete(firstKey);
  }
  _pageCache.set(key, dataUrl);
}

/** Get a cached page dataURL. */
export function getCachedPage(key) {
  return _pageCache.get(key);
}

/** Clear all caches (e.g., on unmount). */
export function clearPageCache() {
  _pageCache.clear();
}