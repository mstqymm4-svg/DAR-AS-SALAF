import { useState, useEffect, useRef } from "react";
import { Loader2, ChevronRight, ChevronLeft, ZoomIn, ZoomOut } from "lucide-react";

/**
 * Native iframe-based PDF viewer.
 * Uses the browser's built-in PDF engine (HarfBuzz) for correct
 * Arabic/Urdu contextual letter shaping — letters appear joined,
 * not disconnected as in canvas-based rendering.
 *
 * Supports zoom via CSS transform scale on the iframe.
 */
export default function NativePdfViewer({ pdfUrl, title }) {
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const iframeRef = useRef(null);

  useEffect(() => {
    setLoading(true);
  }, [pdfUrl]);

  return (
    <div className="relative w-full h-full flex flex-col bg-gray-100 dark:bg-gray-900">
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">جاري تحميل الكتاب...</p>
        </div>
      )}

      {/* PDF iframe — native browser rendering with correct letter shaping */}
      <div
        className="flex-1 overflow-auto flex items-start justify-center"
        style={{ padding: zoom > 1 ? `${(zoom - 1) * 50}px` : 0 }}
      >
        <iframe
          ref={iframeRef}
          src={pdfUrl}
          title={title || "PDF Viewer"}
          className="border-0 bg-white"
          style={{
            width: "100%",
            height: "100%",
            transform: `scale(${zoom})`,
            transformOrigin: "top center",
            minHeight: "100%",
          }}
          onLoad={() => setLoading(false)}
        />
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-card/95 backdrop-blur-sm border border-border rounded-full shadow-lg px-3 py-1.5 z-10">
        <button
          onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted text-muted-foreground"
          title="تصغير"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="text-xs font-mono w-10 text-center text-foreground">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom((z) => Math.min(2, z + 0.25))}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted text-muted-foreground"
          title="تكبير"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}