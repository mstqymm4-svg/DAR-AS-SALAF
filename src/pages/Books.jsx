import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Search, SlidersHorizontal } from "lucide-react";
import BookCard from "../components/BookCard";
import CategoryChip, { categories } from "../components/CategoryChip";
import { Input } from "@/components/ui/input";

export default function Books() {
  const [books, setBooks] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("الكل");
  const [user, setUser] = useState(null);

  const urlParams = new URLSearchParams(window.location.search);
  const categoryParam = urlParams.get("category");

  useEffect(() => {
    if (categoryParam) setActiveCategory(categoryParam);
  }, [categoryParam]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const u = await base44.auth.me().catch(() => null);
    setUser(u);

    const allBooks = await base44.entities.Book.list('-created_date', 200);
    setBooks(allBooks);

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
      user_email: user.email,
    });
    if (existing.length > 0) {
      await base44.entities.Favorite.delete(existing[0].id);
      setFavorites((prev) => prev.filter((id) => id !== bookId));
    } else {
      await base44.entities.Favorite.create({ book_id: bookId, user_email: user.email });
      setFavorites((prev) => [...prev, bookId]);
    }
  };

  const filteredBooks = books.filter((book) => {
    const matchesCategory = activeCategory === "الكل" || book.category === activeCategory;
    const matchesSearch =
      !searchQuery ||
      book.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">المكتبة</h1>
        <p className="text-sm text-muted-foreground">تصفح جميع الكتب الدينية المتاحة</p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="ابحث عن كتاب أو مؤلف..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-11 h-12 rounded-xl bg-card border-border text-sm"
        />
      </div>

      {/* Categories */}
      <div className="flex gap-2.5 overflow-x-auto pb-4 mb-6 scrollbar-hide">
        {categories.map((cat) => (
          <CategoryChip
            key={cat.name}
            category={cat}
            isActive={activeCategory === cat.name}
            onClick={setActiveCategory}
          />
        ))}
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground mb-4">
        {filteredBooks.length} كتاب
      </p>

      {/* Books Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredBooks.map((book, i) => (
          <BookCard
            key={book.id}
            book={book}
            index={i}
            isFavorite={favorites.includes(book.id)}
            onToggleFavorite={user ? toggleFavorite : null}
          />
        ))}
      </div>

      {filteredBooks.length === 0 && (
        <div className="text-center py-20">
          <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="font-bold text-foreground mb-1">لا توجد نتائج</h3>
          <p className="text-sm text-muted-foreground">جرّب البحث بكلمات مختلفة أو تغيير التصنيف</p>
        </div>
      )}
    </div>
  );
}