import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Search, WifiOff } from "lucide-react";
import { motion } from "framer-motion";
import AISearch from "../components/AISearch";
import BookCard from "../components/BookCard";
import CategoryChip, { categories } from "../components/CategoryChip";
import { SkeletonGrid } from "../components/Skeleton";
import { Input } from "@/components/ui/input";
import { useT } from "@/lib/i18n";
import { getBooks, getFavoriteIds, toggleFavorite } from "@/lib/offlineSync";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useContentRefresh } from "@/hooks/useContentSync";

export default function Books() {
  const t = useT();
  const [books, setBooks] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("الكل");
  const [user, setUser] = useState(null);
  const [preferredLanguage, setPreferredLanguage] = useState("الكل");
  const [aiResults, setAiResults] = useState(null);
  const [aiLabel, setAiLabel] = useState("");
  const { isOnline } = useOnlineStatus();

  const urlParams = new URLSearchParams(window.location.search);
  const categoryParam = urlParams.get("category");

  useEffect(() => {
    if (categoryParam) setActiveCategory(categoryParam);
  }, [categoryParam]);

  const loadData = async () => {
    const u = await base44.auth.me().catch(() => null);
    setUser(u);
    const allBooks = await getBooks();
    setBooks(allBooks);
    if (u?.preferred_language && u.preferred_language !== 'الكل') {
      setPreferredLanguage(u.preferred_language);
    }
    if (u) {
      const favIds = await getFavoriteIds(u.email);
      setFavorites(favIds);
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  // Auto-refresh when books change in background
  useContentRefresh(["books"], loadData);

  const handleToggleFavorite = async (bookId) => {
    if (!user) return;
    const added = await toggleFavorite(bookId, user.email);
    setFavorites((prev) =>
      added ? [...prev, bookId] : prev.filter((id) => id !== bookId)
    );
  };

  const filteredBooks = aiResults ?? books.filter((book) => {
    const matchesCategory = activeCategory === "الكل" || book.category === activeCategory;
    const matchesSearch =
      !searchQuery ||
      book.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLanguage = preferredLanguage === "الكل" || !book.language || book.language === preferredLanguage;
    return matchesCategory && matchesSearch && matchesLanguage;
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SkeletonGrid count={10} cols="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" />
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
          تعمل بدون اتصال — البيانات محفوظة محلياً
        </motion.div>
      )}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">{t.library}</h1>
        <p className="text-sm text-muted-foreground">{t.librarySub}</p>
      </div>

      <AISearch
        books={books}
        onResults={(results, label) => { setAiResults(results); setAiLabel(label); }}
        onClear={() => { setAiResults(null); setAiLabel(""); }}
      />

      <div className="relative mb-6">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder={t.searchPlaceholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-11 h-12 rounded-xl bg-card border-border text-sm"
        />
      </div>

      <div className="flex gap-2.5 overflow-x-auto pb-4 mb-6 scrollbar-hide">
        {categories.map((cat) => (
          <CategoryChip key={cat.name} category={cat} isActive={activeCategory === cat.name} onClick={setActiveCategory} />
        ))}
      </div>

      {aiResults && (
        <div className="mb-4 px-4 py-2 rounded-xl bg-accent/10 border border-accent/30 text-sm text-foreground flex items-center gap-2">
          <span className="text-accent">✨</span> {aiLabel} — {aiResults.length} {t.booksCount}
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{filteredBooks.length} {t.booksCount}</p>
        {preferredLanguage !== "الكل" && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{t.lang}: {preferredLanguage}</span>
            <button onClick={() => setPreferredLanguage("الكل")} className="text-xs text-primary hover:underline">
              {t.showAll}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredBooks.map((book, i) => (
          <BookCard key={book.id} book={book} index={i} isFavorite={favorites.includes(book.id)} onToggleFavorite={user ? handleToggleFavorite : null} />
        ))}
      </div>

      {filteredBooks.length === 0 && (
        <div className="text-center py-20">
          <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="font-bold text-foreground mb-1">{t.noResults}</h3>
          <p className="text-sm text-muted-foreground">{t.noResultsSub}</p>
        </div>
      )}
    </div>
  );
}