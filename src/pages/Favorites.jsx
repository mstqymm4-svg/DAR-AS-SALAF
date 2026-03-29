import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Heart } from "lucide-react";
import BookCard from "../components/BookCard";

export default function Favorites() {
  const [books, setBooks] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    const u = await base44.auth.me().catch(() => null);
    setUser(u);
    if (!u) {
      setLoading(false);
      return;
    }

    const favs = await base44.entities.Favorite.filter({ user_email: u.email });
    const ids = favs.map((f) => f.book_id);
    setFavoriteIds(ids);

    if (ids.length > 0) {
      const allBooks = await base44.entities.Book.list('-created_date', 200);
      const favBooks = allBooks.filter((b) => ids.includes(b.id));
      setBooks(favBooks);
    }
    setLoading(false);
  };

  const toggleFavorite = async (bookId) => {
    if (!user) return;
    const existing = await base44.entities.Favorite.filter({
      book_id: bookId,
      user_email: user.email,
    });
    if (existing.length > 0) {
      await base44.entities.Favorite.delete(existing[0].id);
      setFavoriteIds((prev) => prev.filter((id) => id !== bookId));
      setBooks((prev) => prev.filter((b) => b.id !== bookId));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
          <Heart className="w-6 h-6 text-red-500 fill-red-500" />
          المفضلة
        </h1>
        <p className="text-sm text-muted-foreground">الكتب التي أضفتها إلى قائمة المفضلة</p>
      </div>

      {books.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {books.map((book, i) => (
            <BookCard
              key={book.id}
              book={book}
              index={i}
              isFavorite={true}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <Heart className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-2">لا توجد كتب مفضلة</h3>
          <p className="text-sm text-muted-foreground">أضف كتباً إلى المفضلة لتظهر هنا</p>
        </div>
      )}
    </div>
  );
}