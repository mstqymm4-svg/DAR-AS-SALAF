import { useState, useEffect } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowRight, BookOpen, Globe, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import FlipBookViewer from "@/components/FlipBookViewer";
import TranslationPanel from "@/components/TranslationPanel";
import { getBookTranslations } from "@/lib/translationEngine";

export default function ReadBook() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [translateOpen, setTranslateOpen] = useState(searchParams.get("translate") === "true");
  const [viewMode, setViewMode] = useState("original");
  const [translatedLang, setTranslatedLang] = useState("");
  const [translations, setTranslations] = useState([]);

  useEffect(() => {
    base44.entities.Book.filter({ id }).then((books) => {
      if (books.length > 0) setBook(books[0]);
      setLoading(false);
    });
  }, [id]);

  const handleViewTranslated = async (lang) => {
    if (!book?.id) return;
    setTranslatedLang(lang);
    const trans = await getBookTranslations(book.id, lang);
    setTranslations(trans);
    setViewMode("translated");
    setTranslateOpen(false);
  };

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

  const bookLang = book.language === "الإنجليزية" ? "en" : book.language === "الهندية" ? "hi" : "ar";

  return (
    <div className="flex flex-col" style={{ height: "100dvh" }}>
      <div className="bg-card border-b border-border px-4 py-2 flex items-center justify-between gap-3 shrink-0">
        <Link to={`/book/${book.id}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors min-w-0">
          <ArrowRight className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline truncate">{book.title}</span>
          <span className="sm:hidden">رجوع</span>
        </Link>
        <div className="flex items-center gap-2">
          {viewMode === "translated" &&
          <>
              <span className="text-xs text-muted-foreground hidden sm:inline">النسخة المترجمة</span>
              <Button size="sm" variant="outline" onClick={() => setViewMode("original")} className="gap-1.5 h-8">
                <Languages className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">الأصلية</span>
              </Button>
            </>
          }
          







          
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className={`flex-1 h-full overflow-hidden ${translateOpen ? "hidden sm:block sm:w-1/2 sm:border-l sm:border-border" : "w-full"}`}>
          {viewMode === "original" ?
          <FlipBookViewer pdfUrl={book.pdf_url} title={book.title} language={bookLang} /> :

          <FlipBookViewer translations={translations} title={book.title} language={translatedLang} />
          }
        </div>
        {translateOpen &&
        <div className="w-full sm:w-1/2 h-full overflow-hidden">
            <TranslationPanel
            book={book}
            onClose={() => setTranslateOpen(false)}
            onViewTranslated={handleViewTranslated} />
          
          </div>
        }
      </div>
    </div>);

}