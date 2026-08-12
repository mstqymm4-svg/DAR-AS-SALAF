import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Heart, WifiOff } from "lucide-react";
import { motion } from "framer-motion";
import BookCard from "../components/BookCard";
import VideoCard from "@/components/VideoCard";
import { SkeletonGrid } from "../components/Skeleton";
import { useT } from "@/lib/i18n";
import { getBooks, getVideos, getFavoriteIds, toggleFavorite } from "@/lib/offlineSync";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useContentRefresh } from "@/hooks/useContentSync";

export default function Favorites() {
  const t = useT();
  const [books, setBooks] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [videos, setVideos] = useState([]);
  const [videoFavIds, setVideoFavIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem("video_favorites") || "[]"); } catch { return []; }
  });
  const [tab, setTab] = useState("books");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const { isOnline } = useOnlineStatus();

  const loadFavorites = async () => {
    const u = await base44.auth.me().catch(() => null);
    setUser(u);
    setVideoFavIds(JSON.parse(localStorage.getItem("video_favorites") || "[]"));
    setVideos((await getVideos()) || []);
    if (!u) { setLoading(false); return; }
    const ids = await getFavoriteIds(u.email);
    setFavoriteIds(ids);
    if (ids.length > 0) {
      const allBooks = await getBooks();
      setBooks(allBooks.filter((b) => ids.includes(b.id)));
    }
    setLoading(false);
  };

  useEffect(() => { loadFavorites(); }, []);

  // Auto-refresh when books change (e.g., a favorited book gets updated or deleted)
  useContentRefresh(["books"], loadFavorites);

  const handleToggleFavorite = async (bookId) => {
    if (!user) return;
    await toggleFavorite(bookId, user.email);
    setFavoriteIds((prev) => prev.filter((id) => id !== bookId));
    setBooks((prev) => prev.filter((b) => b.id !== bookId));
  };

  const handleToggleVideoFav = (videoId) => {
    const next = videoFavIds.filter((id) => id !== videoId);
    setVideoFavIds(next);
    localStorage.setItem("video_favorites", JSON.stringify(next));
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SkeletonGrid count={6} />
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
          {t.offlineMode}
        </motion.div>
      )}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
          <Heart className="w-6 h-6 text-red-500" />
          {t.favorites}
        </h1>
        <p className="text-sm text-muted-foreground">{t.favoritesSub}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab("books")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === "books" ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}
        >
          {t.navBooks}
        </button>
        <button
          onClick={() => setTab("videos")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === "videos" ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}
        >
          {t.navVideos}
        </button>
      </div>

      {tab === "books" ? (
        books.length > 0 ? (
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
        )
      ) : (
        videoFavIds.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.filter((v) => videoFavIds.includes(v.id)).map((v, i) => (
              <VideoCard
                key={v.id}
                video={v}
                index={i}
                isFavorite={true}
                onToggleFavorite={handleToggleVideoFav}
                onPlay={(vid) => vid.youtube_url && window.open(vid.youtube_url, "_blank")}
                onShare={async (vid) => {
                  if (navigator.share) { try { await navigator.share({ title: vid.title, url: vid.youtube_url }); } catch {} }
                  else { try { await navigator.clipboard.writeText(vid.youtube_url); } catch {} }
                }}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Heart className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-foreground mb-2">{t.noVideoFavorites}</h3>
            <p className="text-sm text-muted-foreground">{t.noVideoFavoritesSub}</p>
          </div>
        )
      )}
    </div>
  );
}