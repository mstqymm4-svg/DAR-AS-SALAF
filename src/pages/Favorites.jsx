import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Heart, WifiOff } from "lucide-react";
import { motion } from "framer-motion";
import BookCard from "../components/BookCard";
import { useT } from "@/lib/i18n";
import { getBooks, getFavoriteIds, toggleFavorite } from "@/lib/offlineSync";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export default function Favorites() {
  const t = useT();
  const [books, setBooks] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const { isOnline } = useOnlineStatus();

  useEffect(() => { loadFavorites(); }, []);

  const loadFavorites = async () => {
    const u = await base44.auth.me().catch(() => null);
    setUser(u);
    if (!u) { setLoading(false); return; }
    const ids = await getFavoriteIds(u.email);
    setFavoriteIds(ids);
    if (ids.length > 0) {
      const allBooks = await getBooks();
      setBooks(allBooks.filter((b) => ids.includes(b.id)));
    }
    setLoading(false);
  };

  const handleToggleFavorite = async (bookId) => {
    if (!user) return;
    await toggleFavorite(bookId, user.email);
    setFavoriteIds((prev) => prev.filter((id) => id !== bookId));
    setBooks((prev) => prev.filter((b) => b.id !== bookId));
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
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-700 dark:text-orange-400 text-xs font-medium mb-4"
        >
          <WifiOff className="w-4 h-4" />
          تعمل بدون اتصال — المفضلة محفوظة محلياً
        </motion.div>
      )}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
          <Heart className="w-6 h-6 text-red-500" />
          {t.favorites}
        </h1>
        <p className="text-sm text-muted-foreground">{t.favoritesSub}</p>
      </div>

      {books.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {books.map((book, i) => (
            <BookCard key={book.id} book={book} index={i} isFavorite={true} onToggleFavorite={handleToggleFavorite} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <Heart className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-2">{t.noFavorites}</h3>
          <p className="text-sm text-muted-foreground">{t.noFavoritesSub}</p>
        </div>
      )}
    </div>
  );
}