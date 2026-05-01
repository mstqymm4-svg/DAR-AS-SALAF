import { useState } from "react";
import { RefreshCw, ExternalLink } from "lucide-react";

export default function PdfViewer({ url, title }) {
  const [key, setKey] = useState(0);
  const [loading, setLoading] = useState(true);

  const src = `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(url)}`;

  const reload = () => { setKey(k => k + 1); setLoading(true); };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-3 py-1.5 bg-muted/50 border-b border-border text-xs text-muted-foreground shrink-0">
        <button onClick={reload} className="flex items-center gap-1 hover:text-foreground transition-colors">
          <RefreshCw className="w-3 h-3" /> إعادة تحميل
        </button>
        <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-foreground mr-auto transition-colors">
          <ExternalLink className="w-3 h-3" /> فتح خارجياً
        </a>
      </div>

      {loading && (
        <div className="absolute inset-0 top-8 flex flex-col items-center justify-center bg-background z-10 gap-4">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">جاري تحميل الكتاب...</p>
        </div>
      )}

      <iframe
        key={key}
        src={src}
        className="flex-1 w-full border-0"
        title={title}
        onLoad={() => setLoading(false)}
      />
    </div>
  );
}