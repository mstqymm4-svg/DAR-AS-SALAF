import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { BookOpen, ArrowLeft, Sparkles, Youtube, ExternalLink } from "lucide-react";
import BookCard from "../components/BookCard";
import CategoryChip, { categories } from "../components/CategoryChip";
import HeroBanner from "../components/HeroBanner";
import SocialChannelsSection from "../components/SocialChannelsSection";
import { motion } from "framer-motion";
import { useT } from "@/lib/i18n";
import { getSetting, subscribeToSettings } from "@/lib/settingsStore";

export default function Home() {
  const t = useT();
  const [featuredBooks, setFeaturedBooks] = useState([]);
  const [recentBooks, setRecentBooks] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const [youtubeUrl, setYoutubeUrl] = useState(() => getSetting("youtube_url") || "");
  const [youtubeLabel, setYoutubeLabel] = useState(() => getSetting("youtube_label") || "قناتنا على يوتيوب");
  const [youtubeSubText, setYoutubeSubText] = useState(() => getSetting("youtube_sub") || "");

  useEffect(() => {
    loadData();
    const unsub = subscribeToSettings((s) => {
      setYoutubeUrl(s.youtube_url || "");
      setYoutubeLabel(s.youtube_label || "قناتنا على يوتيوب");
      setYoutubeSubText(s.youtube_sub || "");
    });
    return unsub;
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
    const existing = await base44.entities.Favorite.filter({ book_id: bookId, user_email: user.email });
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
      {/* Hero */}
      <HeroBanner />

      {/* YouTube Banner */}
      {youtubeUrl &&
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mb-10 -mt-4">
        
          <a
          href={youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-l from-red-600/10 to-red-500/5 border border-red-200/50 hover:border-red-400/50 hover:shadow-md hover:shadow-red-500/10 transition-all group text-[#000000] hidden">
          
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-red-500/30 group-hover:scale-105 transition-transform bg-[#e21246]">
              <Youtube className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-foreground">{youtubeLabel || t.youtubeBtn}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{youtubeSubText || t.youtubeSub}</p>
            </div>
            <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0 group-hover:text-red-500 transition-colors" />
          </a>
        </motion.section>
      }

      {/* Categories */}
      <section className="mb-12">
        
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
              {t.featuredBooks}
            </h2>
            <Link to="/books" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
              {t.viewAll}
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {featuredBooks.map((book, i) =>
          <BookCard key={book.id} book={book} index={i} isFavorite={favorites.includes(book.id)} onToggleFavorite={user ? toggleFavorite : null} />
          )}
          </div>
        </section>
      }

      {/* Recent Books */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            {t.recentBooks}
          </h2>
          <Link to="/books" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
            {t.viewAll}
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {recentBooks.map((book, i) =>
          <BookCard key={book.id} book={book} index={i} isFavorite={favorites.includes(book.id)} onToggleFavorite={user ? toggleFavorite : null} />
          )}
        </div>
      </section>

      {recentBooks.length === 0 && featuredBooks.length === 0 &&
      <div className="text-center py-20">
          <BookOpen className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-2">{t.emptyLib}</h3>
          <p className="text-sm text-muted-foreground">{t.emptyLibSub}</p>
        </div>
      }

      {/* Social Channels */}
      <SocialChannelsSection />
    </div>);

}