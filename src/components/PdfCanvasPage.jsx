import { useRef, useState, useEffect } from "react";
import { renderPageToCanvas } from "@/lib/pdfLoader";

const BASE_SCALE = 1.2;

/**
 * Renders a single PDF page to a canvas element with devicePixelRatio support.
 * Canvas rendering preserves embedded fonts, Arabic/Urdu shaping, and original layout exactly.
 */
export default function PdfCanvasPage({ pdf, pageNumber, zoom = 1, darkMode = false }) {
  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pdf || !canvasRef.current) return;

    let cancelled = false;
    setLoading(true);

    const doRender = async () => {
      try {
        // Cancel any previous render
        if (renderTaskRef.current) {
          try { renderTaskRef.current.cancel(); } catch(e) {}
        }

        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;

        const task = await renderPageToCanvas(pdf, pageNumber, canvas, BASE_SCALE * zoom);
        if (cancelled) return;

        renderTaskRef.current = task;
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
      if (renderTaskRef.current) {
        try { renderTaskRef.current.cancel(); } catch(e) {}
      }
    };
  }, [pdf, pageNumber, zoom]);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      )}
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
    </div>
  );
}