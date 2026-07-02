import { useState, useEffect } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowRight, BookOpen, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import FlipBookViewer from "@/components/FlipBookViewer";
import TranslationPanel from "@/components/TranslationPanel";

export default function ReadBook() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [translateOpen, setTranslateOpen] = useState(searchParams.get("translate") === "true");
  const [displayMode, setDisplayMode] = useState("side");

  useEffect(() => {
    base44.entities.Book.filter({ id }).then((books) => {
      if (books.length > 0) setBook(books[0]);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>);
  }

  if (!book || !book.pdf_url) {
    return (
      <div className="text-center py-20 px-4">
        <BookOpen className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
        <h3 className="text-lg font-bold mb-2">لا يوجد ملف PDF لهذا الكتاب</h3>
        <Link to="/books" className="text-primary text-sm hover:underline">العودة للمكتبة</Link>
      </div>);
  }

  const showPdf = !translateOpen || displayMode === "side";

  return (
    <div className="flex flex-col" style={{ height: "100dvh" }}>
      {/* Top Bar */}
      <div className="bg-card border-b border-border px-4 py-2 flex items-center justify-between gap-3 shrink-0">
        <Link to={`/book/${book.id}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowRight className="w-4 h-4" />
          <span className="hidden sm:inline">{book.title}</span>
          <span className="sm:hidden">رجوع</span>
        </Link>
        <Button
          size="sm"
          variant={translateOpen ? "default" : "outline"}
          onClick={() => setTranslateOpen(!translateOpen)}
          className="gap-1.5"
        >
          <Globe className="w-4 h-4" />
          <span className="hidden sm:inline">ترجمة ذكية</span>
        </Button>
      </div>

      {/* Content: FlipBook + Translation Panel */}
      <div className="flex-1 flex overflow-hidden">
        {showPdf && (
          <div className={`${translateOpen && displayMode === "side" ? "w-1/2 border-l border-border" : "w-full"} h-full overflow-hidden`}>
            <FlipBookViewer pdfUrl={book.pdf_url} title={book.title} language={book.language === "الإنجليزية" ? "en" : "ar"} />
          </div>
        )}
        {translateOpen && (
          <div className={`${displayMode === "only" ? "w-full" : "w-1/2"} h-full overflow-hidden`}>
            <TranslationPanel
              book={book}
              onClose={() => setTranslateOpen(false)}
              displayMode={displayMode}
              onDisplayModeChange={setDisplayMode}
            />
          </div>
        )}
      </div>
    </div>);
}