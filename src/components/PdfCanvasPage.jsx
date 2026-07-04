import { useRef, useState, useEffect } from "react";
import { renderPageToCanvas } from "@/lib/pdfLoader";

const BASE_SCALE = 1.5;

/**
 * Renders a single PDF page to a canvas element.
 * Handles render cancellation when the page changes.
 */
export default function PdfCanvasPage({ pdf, pageNumber, zoom = 1, darkMode = false }) {
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let renderTask = null;

    const render = async () => {
      if (!pdf || !canvasRef.current) return;
      setLoading(true);
      try {
        const canvas = canvasRef.current;
        const page = await pdf.getPage(pageNumber);
        if (cancelled) return;

        const viewport = page.getViewport({ scale: BASE_SCALE * zoom });
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const ctx = canvas.getContext("2d");
        renderTask = page.render({ canvasContext: ctx, viewport });
        await renderTask.promise;

        if (!cancelled) setLoading(false);
      } catch (e) {
        if (e?.name !== "RenderingCancelledException" && !cancelled) {
          console.error("Render error:", e);
          setLoading(false);
        }
      }
    };

    render();
    return () => {
      cancelled = true;
      if (renderTask) {
        try { renderTask.cancel(); } catch (e) {}
      }
    };
  }, [pdf, pageNumber, zoom]);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      )}
      <canvas
        ref={canvasRef}
        className={`max-w-full max-h-full rounded-lg shadow-2xl transition-opacity duration-200 ${loading ? "opacity-0" : "opacity-100"}`}
        style={{
          maxHeight: "100%",
          filter: darkMode ? "invert(1) hue-rotate(180deg)" : "none",
        }}
      />
    </div>
  );
}