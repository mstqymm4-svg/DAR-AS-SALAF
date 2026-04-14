import { useState } from "react";
import { RefreshCw, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const VIEWERS = [
  (url) => `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`,
  (url) => `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(url)}`,
  (url) => url,
];

const VIEWER_NAMES = ["Google Docs", "Mozilla PDF.js", "مباشر"];

export default function PdfViewer({ url, title }) {
  const [viewerIndex, setViewerIndex] = useState(0);
  const [key, setKey] = useState(0);
  const [loading, setLoading] = useState(true);

  const src = VIEWERS[viewerIndex](url);

  const tryNext = () => {
    const next = (viewerIndex + 1) % VIEWERS.length;
    setViewerIndex(next);
    setKey(k => k + 1);
    setLoading(true);
  };

  const reload = () => {
    setKey(k => k + 1);
    setLoading(true);
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Viewer Toolbar */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 border-b border-border text-xs text-muted-foreground shrink-0">
        <span>العارض: <strong>{VIEWER_NAMES[viewerIndex]}</strong></span>
        <button onClick={reload} className="flex items-center gap-1 hover:text-foreground transition-colors">
          <RefreshCw className="w-3 h-3" /> إعادة تحميل
        </button>
        <button onClick={tryNext} className="flex items-center gap-1 hover:text-primary transition-colors text-primary/70">
          تجربة عارض آخر ←
        </button>
        <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-foreground mr-auto">
          <ExternalLink className="w-3 h-3" /> فتح خارجياً
        </a>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 top-8 flex flex-col items-center justify-center bg-background z-10 gap-4">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">جاري تحميل الكتاب...</p>
          <p className="text-xs text-muted-foreground">العارض: {VIEWER_NAMES[viewerIndex]}</p>
        </div>
      )}

      <iframe
        key={key}
        src={src}
        className="flex-1 w-full border-0"
        title={title}
        onLoad={() => setLoading(false)}
        onError={tryNext}
      />
    </div>
  );
}