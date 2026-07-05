import { useRef, useState, useEffect, useCallback } from "react";
import { renderPageToCanvas, getCachedPage, cachePage } from "@/lib/pdfLoader";

const BASE_SCALE = 1.2;

/**
 * Renders a single PDF page to a canvas element with devicePixelRatio support.
 * Canvas rendering preserves embedded fonts, Arabic/Urdu shaping, and original layout exactly.
 */
export default function PdfCanvasPage({ pdf, pageNumber, zoom = 1, darkMode = false }) {
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [cacheUrl, setCacheUrl] = useState(null);

  const render = useCallback(async () => {
    if (!pdf || !canvasRef.current) return;
    const pageKey = `${pdf.docId || "doc"}_${pageNumber}_${zoom}_${darkMode}`;
    
    // Try cache first
    const cached = getCachedPage(pageKey);
    if (cached) {
      setCacheUrl(cached);
      setLoading(false);
      return;
    }

    setLoading(true);
    setCacheUrl(null);
    
    let renderTask = null;
    try {
      const canvas = canvasRef.current;
      await renderPageToCanvas(pdf, pageNumber, canvas, BASE_SCALE * zoom);
      
      // Cache the rendered page
      try {
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        cachePage(pageKey, dataUrl);
      } catch(e) {}
      
      setLoading(false);
    } catch (e) {
      if (e?.name !== "RenderingCancelledException") {
        console.error("Render error:", e);
        setLoading(false);
      }
    }
  }, [pdf, pageNumber, zoom]);

  useEffect(() => {
    let cancelled = false;
    let renderTask = null;

    const doRender = async () => {
      if (!pdf) return;
      
      // Try cache first
      const pageKey = `${pdf.docId || "doc"}_${pageNumber}_${zoom}_${darkMode}`;
      const cached = getCachedPage(pageKey);
      if (cached) {
        if (!cancelled) {
          setCacheUrl(cached);
          setLoading(false);
        }
        return;
      }

      if (!cancelled) setLoading(true);
      if (!cancelled) setCacheUrl(null);

      try {
        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;

        const page = await pdf.getPage(pageNumber);
        if (cancelled) return;

        const dpr = window.devicePixelRatio || 1;
        const viewport = page.getViewport({ scale: BASE_SCALE * zoom * dpr });
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const ctx = canvas.getContext("2d", { alpha: false });
        renderTask = page.render({ canvasContext: ctx, viewport });
        await renderTask.promise;

        if (cancelled) return;

        // Cache the rendered page
        try {
          const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
          cachePage(pageKey, dataUrl);
        } catch(e) {}

        setLoading(false);
      } catch (e) {
        if (e?.name !== "RenderingCancelledException" && !cancelled) {
          console.error("Render error:", e);
          setLoading(false);
        }
      }
    };

    doRender();
    return () => {
      cancelled = true;
      if (renderTask) {
        try { renderTask.cancel(); } catch (e) {}
      }
    };
  }, [pdf, pageNumber, zoom, darkMode]);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      )}
      {cacheUrl ? (
        <img
          src={cacheUrl}
          alt={`صفحة ${pageNumber}`}
          className="max-w-full max-h-full rounded-lg shadow-2xl transition-opacity duration-200"
          style={{
            maxHeight: "100%",
            objectFit: "contain",
            filter: darkMode ? "invert(1) hue-rotate(180deg)" : "none",
            opacity: loading ? 0 : 1,
          }}
        />
      ) : (
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-full rounded-lg shadow-2xl transition-opacity duration-200"
          style={{
            maxHeight: "100%",
            objectFit: "contain",
            width: "auto",
            height: "auto",
            filter: darkMode ? "invert(1) hue-rotate(180deg)" : "none",
            opacity: loading ? 0 : 1,
          }}
        />
      )}
    </div>
  );
}