import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowRight, BookOpen, Eye } from "lucide-react";
import FlipBookViewer from "@/components/FlipBookViewer";
import NativePdfViewer from "@/components/NativePdfViewer";
import { useT } from "@/lib/i18n";
import { getBook } from "@/lib/offlineSync";

export default function ReadBook() {
  const { id } = useParams();
  const t = useT();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [useNativeViewer, setUseNativeViewer] = useState(false);

  useEffect(() => {
    loadBook();
  }, [id]);

  const loadBook = async () => {
    try {
      const b = await getBook(id);
      if (b) {
        setBook(b);
        // Auto-select native viewer for Urdu books to fix letter shaping
        if (b.language === "الأوردو" || b.language === "Urdu") {
          setUseNativeViewer(true);
        }
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
        <button
          onClick={() => setUseNativeViewer((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          title="تبديل العارض"
        >
          <Eye className="w-3.5 h-3.5" />
          {useNativeViewer ? "عارض متواصل" : "عارض أصلي"}
        </button>
      </div>

      {/* PDF Viewer — toggle between canvas (FlipBook) and native iframe (correct Urdu shaping) */}
      <div className="flex-1 overflow-hidden relative">
        {useNativeViewer ? (
          <NativePdfViewer pdfUrl={book.pdf_url} title={book.title} />
        ) : (
          <FlipBookViewer pdfUrl={book.pdf_url} title={book.title} language={t.langCode || "ar"} />
        )}
      </div>
    </div>
  );
}