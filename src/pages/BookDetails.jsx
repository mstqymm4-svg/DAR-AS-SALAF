import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Heart, Star, BookOpen, ArrowRight, FileText, User, BookMarked } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useT } from "@/lib/i18n";

export default function BookDetails() {
  const { id } = useParams();
  const t = useT();
  const [book, setBook] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {loadBook();}, [id]);

  const loadBook = async () => {
    const u = await base44.auth.me().catch(() => null);
    setUser(u);
    const books = await base44.entities.Book.filter({ id });
    if (books.length > 0) setBook(books[0]);
    if (u) {
      const favs = await base44.entities.Favorite.filter({ book_id: id, user_email: u.email });
      setIsFavorite(favs.length > 0);
    }
    setLoading(false);
  };

  const toggleFavorite = async () => {
    if (!user) return;
    const existing = await base44.entities.Favorite.filter({ book_id: id, user_email: user.email });
    if (existing.length > 0) {
      await base44.entities.Favorite.delete(existing[0].id);
      setIsFavorite(false);
    } else {
      await base44.entities.Favorite.create({ book_id: id, user_email: user.email });
      setIsFavorite(true);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>);

  }

  if (!book) {
    return (
      <div className="text-center py-20 px-4">
        <BookOpen className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
        <h3 className="text-lg font-bold mb-2">الكتاب غير موجود</h3>
        <Link to="/books" className="text-primary text-sm hover:underline">{t.backToLib}</Link>
      </div>);

  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/books" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
        <ArrowRight className="w-4 h-4" />
        {t.backToLib}
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid md:grid-cols-3 gap-8">
        
        {/* Cover */}
        <div className="md:col-span-1">
          <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 border border-border flex items-center justify-center">
            {book.cover_image ?
            <img src={book.cover_image} alt={book.title} className="w-full h-full object-cover" /> :

            <BookOpen className="w-12 h-12 text-primary/30" />
            }
          </div>
        </div>

        {/* Details */}
        <div className="md:col-span-2">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground font-medium mb-3">
                {book.category}
              </span>
              <h1 className="text-2xl md:text-3xl font-black text-foreground leading-tight">{book.title}</h1>
            </div>
            {user &&
            <button
              onClick={toggleFavorite}
              className="shrink-0 w-11 h-11 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors">
              
                <Heart className={`w-5 h-5 ${isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
              </button>
            }
          </div>

          <div className="flex items-center gap-2 text-muted-foreground mb-6">
            <User className="w-4 h-4" />
            <span className="text-sm">{book.author}</span>
          </div>

          {book.rating > 0 &&
          <div className="flex items-center gap-2 mb-6">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) =>
              <Star key={i} className={`w-4 h-4 ${i < Math.round(book.rating) ? "fill-accent text-accent" : "text-border"}`} />
              )}
              </div>
              <span className="text-sm text-muted-foreground">{book.rating} / 5</span>
            </div>
          }

          <div className="grid grid-cols-2 gap-3 mb-6">
            {book.pages_count &&
            <div className="p-4 rounded-xl bg-muted/50 border border-border">
                <FileText className="w-4 h-4 text-muted-foreground mb-1" />
                <p className="text-lg font-bold text-foreground">{book.pages_count}</p>
                <p className="text-xs text-muted-foreground">{t.pages}</p>
              </div>
            }
            {book.language &&
            <div className="p-4 rounded-xl bg-muted/50 border border-border">
                <BookOpen className="w-4 h-4 text-muted-foreground mb-1" />
                <p className="text-lg font-bold text-foreground">{book.language}</p>
                <p className="text-xs text-muted-foreground">{t.language}</p>
              </div>
            }
          </div>

          {book.description &&
          <div className="mb-8">
              <h3 className="text-sm font-bold text-foreground mb-3">{t.aboutBook}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{book.description}</p>
            </div>
          }

          {book.pdf_url &&
          <div className="flex gap-3">
              <a href={`/read/${book.id}`} className="flex-1">
                <Button className="w-full gap-2 h-12 rounded-xl text-sm font-bold">
                  <BookMarked className="w-4 h-4" />
                  {t.readBook}
                </Button>
              </a>
            </div>
          }
        </div>
      </motion.div>
    </div>);

}