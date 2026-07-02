import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Play, Heart, Share2, Star, Search, Video, Tv, Clock } from "lucide-react";
import { toast } from "sonner";
import VideoPlayer from "@/components/VideoPlayer";
import { getThumbnail } from "@/components/dev/DevVideos";

export default function Videos() {
  const [videos, setVideos] = useState([]);
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [playingVideo, setPlayingVideo] = useState(null);
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem("video_favorites") || "[]"); } catch(e) { return []; }
  });

  useEffect(() => {
    Promise.all([
      base44.entities.Video.filter({ visible: true }).catch(() => []),
      base44.entities.VideoChannel.filter({ visible: true }).catch(() => []),
    ]).then(([vData, chData]) => {
      setVideos(vData || []);
      setChannels(chData || []);
      setLoading(false);
    });
  }, []);

  const categories = useMemo(() => {
    const set = new Set(videos.map((v) => v.category).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [videos]);

  const filtered = useMemo(() => {
    return videos.filter((v) => {
      if (category !== "all" && v.category !== category) return false;
      if (search && !v.title?.includes(search) && !v.channel_name?.includes(search)) return false;
      return true;
    });
  }, [videos, search, category]);

  const featured = videos.filter((v) => v.is_featured);
  const recent = [...filtered].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  const toggleFavorite = (videoId) => {
    const next = favorites.includes(videoId)
      ? favorites.filter((id) => id !== videoId)
      : [...favorites, videoId];
    setFavorites(next);
    localStorage.setItem("video_favorites", JSON.stringify(next));
    toast.success(favorites.includes(videoId) ? "أُزيل من المفضلة" : "أُضيف للمفضلة");
  };

  const handleShare = async (video) => {
    if (navigator.share) {
      try { await navigator.share({ title: video.title, url: video.youtube_url }); } catch(e) {}
    } else {
      try { await navigator.clipboard.writeText(video.youtube_url); toast.success("تم نسخ الرابط"); } catch(e) {}
    }
  };

  const VideoCard = ({ video }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl overflow-hidden group hover:shadow-lg transition-shadow"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-muted cursor-pointer" onClick={() => setPlayingVideo(video)}>
        {video.thumbnail && <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />}
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center">
            <Play className="w-5 h-5 text-primary-foreground fill-primary-foreground mr-0.5" />
          </div>
        </div>
        {video.duration && (
          <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/80 text-white text-[10px] font-mono flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" /> {video.duration}
          </span>
        )}
        {video.is_featured && (
          <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-amber-500 text-white text-[10px] font-bold flex items-center gap-1">
            <Star className="w-2.5 h-2.5 fill-white" /> مميز
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3" dir="rtl">
        <h3 className="text-sm font-bold line-clamp-2 mb-1">{video.title}</h3>
        {video.channel_name && <p className="text-xs text-muted-foreground mb-1">{video.channel_name}</p>}
        {video.description && <p className="text-[10px] text-muted-foreground line-clamp-2 mb-2">{video.description}</p>}
        <div className="flex items-center gap-1">
          <Button size="sm" className="flex-1 h-8 text-xs gap-1" onClick={() => setPlayingVideo(video)}>
            <Play className="w-3.5 h-3.5" /> تشغيل
          </Button>
          <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => toggleFavorite(video.id)}>
            <Heart className={`w-3.5 h-3.5 ${favorites.includes(video.id) ? "fill-red-500 text-red-500" : ""}`} />
          </Button>
          <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => handleShare(video)}>
            <Share2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-8" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-l from-primary/10 to-transparent py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-black mb-2 flex items-center gap-2">
            <Video className="w-6 h-6 text-primary" /> الفيديوهات
          </h1>
          <p className="text-sm text-muted-foreground">شاهد الفيديوهات داخل التطبيق مباشرة</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-8">
        {/* Search + Categories */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="ابحث عن فيديو..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="pr-9" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap border-2 transition-all shrink-0 ${
                  category === cat ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary/30"
                }`}>
                {cat === "all" ? "الكل" : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Featured */}
        {featured.length > 0 && category === "all" && !search && (
          <section>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" /> فيديوهات مميزة
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featured.slice(0, 3).map((v) => <VideoCard key={v.id} video={v} />)}
            </div>
          </section>
        )}

        {/* Recent */}
        <section>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" /> أحدث الفيديوهات
          </h2>
          {recent.length === 0 ? (
            <div className="text-center py-12">
              <Video className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">لا توجد فيديوهات</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recent.map((v) => <VideoCard key={v.id} video={v} />)}
            </div>
          )}
        </section>

        {/* Channels */}
        {channels.length > 0 && (
          <section>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <Tv className="w-5 h-5 text-primary" /> قنوات الفيديو
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {channels.map((ch) => (
                <div key={ch.id} className="bg-card border border-border rounded-xl p-4 flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-2">
                    {ch.channel_logo
                      ? <img src={ch.channel_logo} alt={ch.name} className="w-full h-full rounded-xl object-cover" />
                      : <Tv className="w-6 h-6 text-red-500" />}
                  </div>
                  <p className="text-sm font-bold truncate w-full">{ch.name}</p>
                  {ch.description && <p className="text-[10px] text-muted-foreground line-clamp-2 mt-1">{ch.description}</p>}
                </div>
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