import { useState, useEffect } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowRight, BookOpen, Languages } from "lucide-react";
import FlipBookViewer from "@/components/FlipBookViewer";
import { useT } from "@/lib/i18n";

export default function ReadBook() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isTranslated = searchParams.get("translated") === "1";
  const t = useT();
  const [book, setBook] = useState(null);
  const [translation, setTranslation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const books = await base44.entities.Book.filter({ id });
      if (books.length > 0) setBook(books[0]);

      if (isTranslated) {
        try {
          const translations = await base44.entities.BookTranslation.filter({ book_id: id, status: "completed" });
          if (translations.length > 0) setTranslation(translations[0]);
        } catch (e) {}
      }
      setLoading(false);
    };
    loadData();
  }, [id, isTranslated]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const pdfUrl = isTranslated && translation?.translated_pdf_url ? translation.translated_pdf_url : book?.pdf_url;

  if (!book || !pdfUrl) {
    return (
      <div className="text-center py-20 px-4">
        <BookOpen className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
        <h3 className="text-lg font-bold mb-2">{isTranslated ? "لا توجد ترجمة متاحة لهذا الكتاب" : "لا يوجد ملف PDF لهذا الكتاب"}</h3>
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
        {isTranslated && translation && (
          <div className="flex items-center gap-2 text-xs">
            <Languages className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">نسخة مترجمة</span>
          </div>
        )}
      </div>

      {/* FlipBook Viewer */}
      <div className="flex-1 overflow-hidden relative">
        <FlipBookViewer pdfUrl={pdfUrl} title={isTranslated ? `${book.title}_translated` : book.title} language={isTranslated ? "ar" : (t.langCode || "ar")} />
      </div>
    </div>
  );
}