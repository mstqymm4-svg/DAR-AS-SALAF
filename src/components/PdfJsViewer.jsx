import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2, ChevronRight, ChevronLeft, ZoomIn, ZoomOut } from "lucide-react";
import { loadPdfDocument } from "@/lib/pdfLoader";

/**
 * PDF.js viewer with text-layer rendering.
 * Renders each page to canvas (visual) + an HTML text layer overlay.
 * The text layer uses the browser's native text shaping engine (HarfBuzz)
 * which correctly joins Arabic/Urdu letters — solving the disconnected
 * letter problem seen in pure-canvas rendering.
 */

const RENDER_SCALE = 1.5;

export default function PdfJsViewer({ pdfUrl, title }) {
  const [pdf, setPdf] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [error, setError] = useState("");

  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const textLayerRef = useRef(null);
  const renderTaskRef = useRef(null);

  // Load document
  useEffect(() => {
    if (!pdfUrl) return;
    let cancelled = false;
    setLoading(true);
    setError("");

    loadPdfDocument(pdfUrl)
      .then((doc) => {
        if (cancelled) return;
        setPdf(doc);
        setTotalPages(doc.numPages);

        // Restore last page
        const saved = Number(localStorage.getItem(`lastpage_pdfjs_${title}`));
        if (saved && saved > 0 && saved <= doc.numPages) {
          setCurrentPage(saved);
        }
        setLoading(false);
      })
      .catch((e) => {
        if (!cancelled) {
          setError("فشل تحميل ملف PDF: " + (e.message || ""));
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [pdfUrl, title]);

  // Save last page
  useEffect(() => {
    if (totalPages > 0 && currentPage > 0) {
      localStorage.setItem(`lastpage_pdfjs_${title}`, String(currentPage));
    }
  }, [currentPage, title, totalPages]);

  // Render current page (canvas + text layer)
  useEffect(() => {
    if (!pdf || !canvasRef.current) return;

    let cancelled = false;
    setPageLoading(true);

    const renderPage = async () => {
      try {
        // Cancel previous render
        if (renderTaskRef.current) {
          try { renderTaskRef.current.cancel(); } catch(e) {}
        }

        const page = await pdf.getPage(currentPage);
        if (cancelled) return;

        const dpr = window.devicePixelRatio || 1;
        const scale = RENDER_SCALE * zoom * dpr;
        const viewport = page.getViewport({ scale });
        const cssViewport = page.getViewport({ scale: RENDER_SCALE * zoom });

        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;

        const ctx = canvas.getContext("2d", { alpha: false });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${cssViewport.width}px`;
        canvas.style.height = `${cssViewport.height}px`;

        const renderTask = page.render({ canvasContext: ctx, viewport });
        renderTaskRef.current = renderTask;
        await renderTask.promise;
        if (cancelled) return;

        // Render text layer for correct letter shaping
        if (textLayerRef.current) {
          textLayerRef.current.innerHTML = "";
          textLayerRef.current.style.width = `${cssViewport.width}px`;
          textLayerRef.current.style.height = `${cssViewport.height}px`;

          try {
            const textContent = await page.getTextContent();
            if (cancelled) return;

            // Use PDF.js TextLayer for proper positioning + browser shaping
            const { TextLayer } = await import("pdfjs-dist");
            const textLayer = new TextLayer({
              textContentSource: textContent,
              container: textLayerRef.current,
              viewport: cssViewport,
            });
            await textLayer.render();
          } catch(e) {
            // Text layer is best-effort; canvas still shows the page
          }
        }

        if (!cancelled) setPageLoading(false);
      } catch (e) {
        if (e?.name !== "RenderingCancelledException" && !cancelled) {
          console.error("Render error:", e);
          setPageLoading(false);
        }
      }
    };

    renderPage();

    return () => {
      cancelled = true;
      if (renderTaskRef.current) {
        try { renderTaskRef.current.cancel(); } catch(e) {}
      }
    };
  }, [pdf, currentPage, zoom]);

  const goNext = useCallback(() => {
    setCurrentPage((p) => Math.min(p + 1, totalPages));
  }, [totalPages]);

  const goPrev = useCallback(() => {
    setCurrentPage((p) => Math.max(p - 1, 1));
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === "INPUT") return;
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        // RTL: left = next, right = prev
        if (e.key === "ArrowLeft") goNext();
        else goPrev();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">جاري تحميل الكتاب...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <p className="text-destructive text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex flex-col bg-gray-200 dark:bg-gray-900 overflow-hidden"
      dir="rtl"
    >
      {/* Page area */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4">
        <div className="relative shadow-2xl bg-white">
          <canvas
            ref={canvasRef}
            className="block bg-white"
            style={{ maxWidth: "100%", height: "auto" }}
          />
          {/* Text layer overlay — browser shapes Arabic/Urdu letters correctly */}
          <div
            ref={textLayerRef}
            className="absolute inset-0 overflow-hidden"
            style={{
              opacity: 1,
              mixBlendMode: "multiply",
              lineHeight: 1,
            }}
          />
          {pageLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* Navigation arrows */}
      <button
        onClick={goNext}
        disabled={currentPage >= totalPages}
        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-lg flex items-center justify-center hover:bg-white dark:hover:bg-gray-700 transition-colors disabled:opacity-30 z-10"
        aria-label="التالي"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={goPrev}
        disabled={currentPage <= 1}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-lg flex items-center justify-center hover:bg-white dark:hover:bg-gray-700 transition-colors disabled:opacity-30 z-10"
        aria-label="السابق"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Bottom toolbar */}
      <div className="shrink-0 border-t border-border bg-card flex items-center justify-between px-4 py-2 gap-2">
        <span className="text-xs font-mono font-bold text-foreground">
          {currentPage} <span className="text-muted-foreground">/ {totalPages}</span>
        </span>

        <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-muted mx-2">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${totalPages ? (currentPage / totalPages) * 100 : 0}%` }}
          />
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted text-muted-foreground"
            title="تصغير"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono w-10 text-center text-foreground">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted text-muted-foreground"
            title="تكبير"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}