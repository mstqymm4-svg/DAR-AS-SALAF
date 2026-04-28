import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { BookOpen, ArrowLeft, Sparkles } from "lucide-react";
import BookCard from "../components/BookCard";
import CategoryChip, { categories } from "../components/CategoryChip";
import { motion } from "framer-motion";

export default function Home() {
  const [featuredBooks, setFeaturedBooks] = useState([]);
  const [recentBooks, setRecentBooks] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const u = await base44.auth.me().catch(() => null);
    setUser(u);

    const [featured, recent] = await Promise.all([
    base44.entities.Book.filter({ is_featured: true }, '-created_date', 6),
    base44.entities.Book.list('-created_date', 8)]
    );

    setFeaturedBooks(featured);
    setRecentBooks(recent);

    if (u) {
      const favs = await base44.entities.Favorite.filter({ user_email: u.email });
      setFavorites(favs.map((f) => f.book_id));
    }
    setLoading(false);
  };

  const toggleFavorite = async (bookId) => {
    if (!user) return;
    const existing = await base44.entities.Favorite.filter({
      book_id: bookId,
      user_email: user.email
    });
    if (existing.length > 0) {
      await base44.entities.Favorite.delete(existing[0].id);
      setFavorites((prev) => prev.filter((id) => id !== bookId));
    } else {
      await base44.entities.Favorite.create({ book_id: bookId, user_email: user.email });
      setFavorites((prev) => [...prev, bookId]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>);

  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="py-12 md:py-20">
        
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-primary/80 p-8 md:p-14 text-primary-foreground">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 right-10 text-8xl">﷽</div>
            <div className="absolute bottom-5 left-10 text-6xl opacity-50">☪</div>
          </div>
          <div className="relative z-10 max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              
              
            </div>
            <h1 className="mb-4 text-3xl font-black text-center leading-tight md:text-5xl">اقرأ وتعلّم وتدبّر

            </h1>
            <p className="mb-8 text-base text-center normal-case leading-relaxed opacity-90 md:text-lg max-w-lg">اكتشف مجموعة واسعة من الكتب الدينية في مختلف المجالات الإسلامية. و مختلف اللغات 

            </p>
            <Link
              to="/books"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-accent-foreground font-bold text-sm hover:opacity-90 transition-opacity">
              
              تصفح المكتبة
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </motion.section>

      {/* Categories */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-foreground mb-5">تصفح حسب التصنيف</h2>
        <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide">
          {categories.filter((c) => c.name !== "الكل").map((cat) =>
          <Link key={cat.name} to={`/books?category=${encodeURIComponent(cat.name)}`}>
              <CategoryChip category={cat} isActive={false} onClick={() => {}} />
            </Link>
          )}
        </div>
      </section>

      {/* Featured Books */}
      {featuredBooks.length > 0 &&
      <section className="mb-12">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" />
              كتب مميزة
            </h2>
            <Link to="/books" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
              عرض الكل
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {featuredBooks.map((book, i) =>
          <BookCard
            key={book.id}
            book={book}
            index={i}
            isFavorite={favorites.includes(book.id)}
            onToggleFavorite={user ? toggleFavorite : null} />

          )}
          </div>
        </section>
      }

      {/* Recent Books */}
      <section className="mb-12">
        <div className="mb-5 opacity-100 rounded flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            أحدث الإضافات
          </h2>
          <Link to="/books" className="text-primary text-base font-medium hover:underline flex items-center gap-1">عرض الكل


          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {recentBooks.map((book, i) =>
          <BookCard
            key={book.id}
            book={book}
            index={i}
            isFavorite={favorites.includes(book.id)}
            onToggleFavorite={user ? toggleFavorite : null} />

          )}
        </div>
      </section>

      {recentBooks.length === 0 && featuredBooks.length === 0 &&
      <div className="text-center py-20">
          <BookOpen className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-2">المكتبة فارغة حالياً</h3>
          <p className="text-sm text-muted-foreground">لم تتم إضافة كتب بعد</p>
        </div>
      }
    </div>);

}