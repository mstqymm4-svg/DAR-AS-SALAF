import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Play, Star, Search, Video, Tv, Clock, WifiOff } from "lucide-react";
import { toast } from "sonner";
import VideoPlayer from "@/components/VideoPlayer";
import VideoCard from "@/components/VideoCard";
import { PageSpinner } from "@/components/Skeleton";
import { getThumbnail } from "@/components/dev/DevVideos";
import { useT } from "@/lib/i18n";
import { getVideos, getVideoChannels } from "@/lib/offlineSync";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useContentRefresh } from "@/hooks/useContentSync";
import SmartImage from "@/components/SmartImage";

export default function Videos() {
  const t = useT();
  const { isOnline } = useOnlineStatus();
  const [videos, setVideos] = useState([]);
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [playingVideo, setPlayingVideo] = useState(null);
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem("video_favorites") || "[]"); } catch(e) { return []; }
  });

  const loadData = () => {
    Promise.all([
      getVideos(),
      getVideoChannels(),
    ]).then(([vData, chData]) => {
      setVideos(vData || []);
      setChannels(chData || []);
      setLoading(false);
    });
  };

  useEffect(() => { loadData(); }, []);

  // Auto-refresh when videos or channels change in background
  useContentRefresh(["videos", "channels"], loadData);

  const categories = ["all", "live", "short"];

  const filtered = useMemo(() => {
  return videos.filter((v) => {

    if (category === "live" && v.video_type !== "live") return false;

    if (category === "short" && v.video_type !== "short") return false;

    if (
      search &&
      !v.title?.includes(search) &&
      !v.channel_name?.includes(search)
    ) {
      return false;
    }

    return true;
  });
}, [videos, search, category]);

  const featured = useMemo(() => videos.filter((v) => v.is_featured), [videos]);
  const recent = useMemo(() => [...filtered].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)), [filtered]);

  const toggleFavorite = (videoId) => {
    const next = favorites.includes(videoId)
      ? favorites.filter((id) => id !== videoId)
      : [...favorites, videoId];
    setFavorites(next);
    localStorage.setItem("video_favorites", JSON.stringify(next));
    toast.success(favorites.includes(videoId) ? t.removeFav : t.addFav);
  };

  const handleShare = async (video) => {
    if (navigator.share) {
      try { await navigator.share({ title: video.title, url: video.youtube_url }); } catch(e) {}
    } else {
      try { await navigator.clipboard.writeText(video.youtube_url); toast.success("تم نسخ الرابط"); } catch(e) {}
    }
  };

  if (loading) return <PageSpinner />;

  return (
    <div className="pb-8" dir="rtl">
      {!isOnline && (
        <div className="flex items-center gap-2 px-4 py-2 mx-4 mt-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-700 dark:text-orange-400 text-xs font-medium">
          <WifiOff className="w-4 h-4" />
          تعمل بدون اتصال — البيانات محفوظة محلياً
        </div>
      )}
      {/* Header */}
      <div className="bg-gradient-to-l from-primary/10 to-transparent py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-black mb-2 flex items-center gap-2">
            <Video className="w-6 h-6 text-primary" /> {t.videosTitle}
          </h1>
          <p className="text-sm text-muted-foreground">{t.videosSub}</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-8">
        {/* Search + Categories */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder={t.searchVideo} value={search} onChange={(e) => setSearch(e.target.value)}
              className="pr-9" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
  onClick={() => setCategory("live")}
  className={`h-11 px-6 rounded-full transition-all duration-300 shadow-lg ${
  category === "live"
    ? "bg-gradient-to-r from-red-500 to-red-700 text-white"
    : "bg-gray-100 text-gray-700 hover:bg-red-100"
}`}
>
🔴 البث المباشر
</button>

<button
  onClick={() => setCategory("short")}
  className={`px-4 py-2 rounded-lg font-bold border-2 ${
    category === "short"
      ? "bg-purple-600 text-white border-purple-600"
      : "bg-white text-purple-600 border-purple-600"
  }`}
>
🟣 الشورت
</button>
          </div>
        </div>

        {/* Featured */}
        {featured.length > 0 && category === "all" && !search && (
          <section>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            className={`h-11 px-6 rounded-full transition-all duration-300 shadow-lg ${
  category === "short"
    ? "bg-gradient-to-r from-violet-500 to-purple-700 text-white"
    : "bg-gray-100 text-gray-700 hover:bg-purple-100"
}`}
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" /> {t.featuredVideos}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featured.slice(0, 3).map((v, i) => (
                <VideoCard key={v.id} video={v} index={i}
                  isFavorite={favorites.includes(v.id)}
                  onToggleFavorite={toggleFavorite}
                  onPlay={setPlayingVideo}
                  onShare={handleShare}
                />
              ))}
            </div>
          </section>
        )}

        {/* Recent */}
        <section>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" /> {t.recentVideos}
          </h2>
          {recent.length === 0 ? (
            <div className="text-center py-12">
              <Video className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">{t.noVideos}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recent.map((v, i) => (
                <VideoCard key={v.id} video={v} index={i}
                  isFavorite={favorites.includes(v.id)}
                  onToggleFavorite={toggleFavorite}
                  onPlay={setPlayingVideo}
                  onShare={handleShare}
                />
              ))}
            </div>
          )}
        </section>

        {/* Channels */}
        {channels.length > 0 && (
          <section>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <Tv className="w-5 h-5 text-primary" /> {t.videoChannels}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {channels.map((ch) => (
                <a key={ch.id} href={ch.youtube_url} target="_blank" rel="noopener noreferrer"
                  className="bg-card border border-border rounded-xl p-4 flex flex-col items-center text-center hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-2 overflow-hidden">
                    {ch.channel_logo
                      ? <SmartImage src={ch.channel_logo} alt={ch.name} className="w-full h-full rounded-xl object-cover" fallback={() => <Tv className="w-6 h-6 text-red-500" />} />
                      : <Tv className="w-6 h-6 text-red-500" />}
                  </div>
                  <p className="text-sm font-bold truncate w-full">{ch.name}</p>
                  {ch.description && <p className="text-[10px] text-muted-foreground line-clamp-2 mt-1">{ch.description}</p>}
                </a>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Player Modal */}
      {playingVideo && <VideoPlayer video={playingVideo} onClose={() => setPlayingVideo(null)} />}
    </div>
  );
}