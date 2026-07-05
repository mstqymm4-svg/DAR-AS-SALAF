import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowRight, BookOpen, Eye } from "lucide-react";
import FlipBookViewer from "@/components/FlipBookViewer";
import NativePdfViewer from "@/components/NativePdfViewer";
import PdfJsViewer from "@/components/PdfJsViewer";
import UniversalPdfViewer from "@/components/UniversalPdfViewer";
import { useT } from "@/lib/i18n";
import { getBook } from "@/lib/offlineSync";

export default function ReadBook() {
  const { id } = useParams();
  const t = useT();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [useNativeViewer, setUseNativeViewer] = useState(false);
  const [usePdfJsViewer, setUsePdfJsViewer] = useState(false);
  const [useUniversalViewer, setUseUniversalViewer] = useState(true);

  useEffect(() => {
    loadBook();
  }, [id]);

  const loadBook = async () => {
    try {
      const b = await getBook(id);
      if (b) {
        setBook(b);
        // Universal viewer handles Urdu shaping via text layer + canvas
        // No special auto-selection needed — it's the default
      }
    } catch(e) {}
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!book || !book.pdf_url) {
    return (
      <div className="text-center py-20 px-4">
        <BookOpen className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
        <h3 className="text-lg font-bold mb-2">لا يوجد ملف PDF لهذا الكتاب</h3>
        <Link to="/books" className="text-primary text-sm hover:underline">العودة للمكتبة</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ height: "100dvh" }}>
      {/* Top Bar */}
      <div className="bg-card border-b border-border px-4 py-2 flex items-center justify-between gap-3 shrink-0">
        <Link to={`/book/${book.id}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowRight className="w-4 h-4" />
          <span className="hidden sm:inline">{book.title}</span>
          <span className="sm:hidden">رجوع</span>
        </Link>
        <div className="flex items-center gap-1.5">
          {[
            { key: "universal", label: "شامل", active: useUniversalViewer, on: () => { setUseUniversalViewer(true); setUseNativeViewer(false); setUsePdfJsViewer(false); } },
            { key: "flipbook", label: "فليب بوك", active: !useUniversalViewer && !useNativeViewer && !usePdfJsViewer, on: () => { setUseUniversalViewer(false); setUseNativeViewer(false); setUsePdfJsViewer(false); } },
            { key: "pdfjs", label: "PDF.js", active: usePdfJsViewer, on: () => { setUseUniversalViewer(false); setUsePdfJsViewer(true); setUseNativeViewer(false); } },
            { key: "native", label: "أصلي", active: useNativeViewer, on: () => { setUseUniversalViewer(false); setUseNativeViewer(true); setUsePdfJsViewer(false); } },
          ].map((opt) => (
            <button
              key={opt.key}
              onClick={opt.on}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                opt.active
                  ? "bg-primary text-primary-foreground"
                  : "bg-primary/10 text-primary hover:bg-primary/20"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* PDF Viewer — four modes: Universal (default), FlipBook, PDF.js, Native */}
      <div className="flex-1 overflow-hidden relative">
        {useNativeViewer ? (
          <NativePdfViewer pdfUrl={book.pdf_url} title={book.title} />
        ) : usePdfJsViewer ? (
          <PdfJsViewer pdfUrl={book.pdf_url} title={book.title} />
        ) : useUniversalViewer ? (
          <UniversalPdfViewer pdfUrl={book.pdf_url} title={book.title} language={t.langCode || "ar"} />
        ) : (
          <FlipBookViewer pdfUrl={book.pdf_url} title={book.title} language={t.langCode || "ar"} />
        )}
      </div>
    </div>
  );
}