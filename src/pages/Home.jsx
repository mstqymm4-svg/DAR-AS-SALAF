import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { BookOpen, ArrowLeft, Sparkles, Youtube, ExternalLink, WifiOff } from "lucide-react";
import BookCard from "../components/BookCard";
import HeroBanner from "../components/HeroBanner";
import SocialChannelsSection from "../components/SocialChannelsSection";
import HomeChannels from "../components/HomeChannels";
import { SkeletonGrid } from "../components/Skeleton";
import { motion } from "framer-motion";
import { useT } from "@/lib/i18n";
import { getSetting, subscribeToSettings } from "@/lib/settingsStore";
import { getFeaturedBooks, getRecentBooks, getFavoriteIds, toggleFavorite } from "@/lib/offlineSync";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useContentRefresh } from "@/hooks/useContentSync";

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
  const { isOnline } = useOnlineStatus();

  useEffect(() => {
    loadData();
    const unsub = subscribeToSettings((s) => {
      setYoutubeUrl(s.youtube_url || "");
      setYoutubeLabel(s.youtube_label || "قناتنا على يوتيوب");
      setYoutubeSubText(s.youtube_sub || "");
    });
    return unsub;
  }, []);

  // Auto-refresh when content changes in background
  useContentRefresh(["books", "videos", "channels", "social"], loadData);

  const loadData = async () => {
    const u = await base44.auth.me().catch(() => null);
    setUser(u);
    const [featured, recent] = await Promise.all([
      getFeaturedBooks(),
      getRecentBooks(),
    ]);
    setFeaturedBooks(featured);
    setRecentBooks(recent);
    if (u) {
      const favIds = await getFavoriteIds(u.email);
      setFavorites(favIds);
    }
    setLoading(false);
  };

  const handleToggleFavorite = async (bookId) => {
    if (!user) return;
    const added = await toggleFavorite(bookId, user.email);
    setFavorites((prev) =>
      added ? [...prev, bookId] : prev.filter((id) => id !== bookId)
    );
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SkeletonGrid count={6} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Offline indicator */}
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-700 dark:text-orange-400 text-xs font-medium mb-4 mt-2"
        >
          <WifiOff className="w-4 h-4" />
          تعمل بدون اتصال — البيانات محفوظة محلياً
        </motion.div>
      )}

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
          className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-l from-red-600/10 to-red-500/5 border border-red-200/50 dark:border-red-500/20 hover:border-red-400/50 hover:shadow-md hover:shadow-red-500/10 transition-all group">
          
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
          <BookCard key={book.id} book={book} index={i} isFavorite={favorites.includes(book.id)} onToggleFavorite={user ? handleToggleFavorite : null} />
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
          <BookCard key={book.id} book={book} index={i} isFavorite={favorites.includes(book.id)} onToggleFavorite={user ? handleToggleFavorite : null} />
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

      {/* Video Channels */}
      <HomeChannels />

      {/* Social Channels */}
      <SocialChannelsSection />
    </div>);

}