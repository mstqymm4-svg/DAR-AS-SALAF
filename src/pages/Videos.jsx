import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Sparkles, Search, Video, Tv, Clock, WifiOff } from "lucide-react";
import { toast } from "sonner";
import VideoPlayer from "@/components/VideoPlayer";
import VideoCard from "@/components/VideoCard";
import { PageSpinner } from "@/components/Skeleton";
import { useT } from "@/lib/i18n";
import { base44 } from "@/api/base44Client";
import { getVideos, getVideoChannels } from "@/lib/offlineSync";
import { getAccountEmail, getVideoFavIds, setVideoFavIds } from "@/lib/activeUser";
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
  const [playingVideo, setPlayingVideo] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [user, setUser] = useState(null);

  const loadData = () => {
    base44.auth.me().then((u) => {
      setUser(u);
      setFavorites(getVideoFavIds(getAccountEmail(u)));
    }).catch(() => {});
    Promise.all([
      getVideos(),
      getVideoChannels()]
    ).then(([vData, chData]) => {
      setVideos(vData || []);
      setChannels(chData || []);
      setLoading(false);
    });
  };

  useEffect(() => {loadData();}, []);

  // Auto-refresh when videos or channels change in background
  useContentRefresh(["videos", "channels"], loadData);

  const filtered = useMemo(() => {
    return videos.filter((v) => {
      if (
        search &&
        !v.title?.toLowerCase().includes(search.toLowerCase()) &&
        !v.channel_name?.toLowerCase().includes(search.toLowerCase()))
      {
        return false;
      }
      return true;
    });
  }, [videos, search]);

  const featured = useMemo(() => videos.filter((v) => v.is_featured), [videos]);
  const recent = useMemo(() => [...filtered].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)), [filtered]);

  const toggleFavorite = (videoId) => {
    const next = favorites.includes(videoId) ?
    favorites.filter((id) => id !== videoId) :
    [...favorites, videoId];
    setFavorites(next);
    setVideoFavIds(getAccountEmail(user), next);
    toast.success(favorites.includes(videoId) ? t.removeFav : t.addFav);
  };

  const handleShare = async (video) => {
    if (navigator.share) {
      try {await navigator.share({ title: video.title, url: video.youtube_url });} catch (e) {}
    } else {
      try {await navigator.clipboard.writeText(video.youtube_url);toast.success(t.linkCopied);} catch (e) {}
    }
  };

  if (loading) return <PageSpinner />;

  return (
    <div className="pb-8" dir={t.dir}>
      {!isOnline &&
      <div className="flex items-center gap-2 px-4 py-2 mx-4 mt-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-700 dark:text-orange-400 text-xs font-medium">
          <WifiOff className="w-4 h-4" />
          {t.offlineMode}
        </div>
      }
      {/* Header */}
      <div className="bg-gradient-to-l from-primary/10 to-transparent py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-black mb-2 flex items-center gap-2">
            <Video className="w-6 h-6 text-primary" /> {t.videosTitle}
          </h1>
          <p className="text-sm text-muted-foreground">{t.videosSub}</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-8">
        {/* Channels — top, horizontal */}
        {channels.length > 0 && (
          <section>
            <h2 className="text-sm font-bold mb-2 flex items-center gap-2 text-muted-foreground">
              <Tv className="w-4 h-4 text-primary" /> {t.videoChannels}
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {channels.map((ch) => (
                <a key={ch.id} href={ch.youtube_url} target="_blank" rel="noopener noreferrer"
                  className="shrink-0 w-28 bg-card border border-border rounded-2xl p-3 flex flex-col items-center text-center hover:shadow-lg hover:shadow-primary/10 hover:border-primary/40 hover:-translate-y-1 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-2 overflow-hidden">
                    {ch.channel_logo ? (
                      <SmartImage src={ch.channel_logo} alt={ch.name} className="w-full h-full object-cover" fallback={() => <Tv className="w-6 h-6 text-red-500" />} />
                    ) : (
                      <Tv className="w-6 h-6 text-red-500" />
                    )}
                  </div>
                  <p className="text-xs font-bold truncate w-full">{ch.name}</p>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Search */}
        <div className="relative group">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 group-focus-within:text-primary transition-colors text-muted-foreground" />
          <Input placeholder={t.searchVideo} value={search} onChange={(e) => setSearch(e.target.value)}
            className="pr-11 h-12 rounded-xl bg-card border-border text-sm focus-visible:border-primary focus-visible:ring-primary/20 transition-colors" />
        </div>

        {/* Featured */}
        {featured.length > 0 && !search &&
        <section>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-accent" />
              </span>
              {t.featuredVideos}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featured.slice(0, 3).map((v, i) =>
            <VideoCard key={v.id} video={v} index={i}
            isFavorite={favorites.includes(v.id)}
            onToggleFavorite={toggleFavorite}
            onPlay={setPlayingVideo}
            onShare={handleShare} />

            )}
            </div>
          </section>
        }

        {/* Recent */}
        <section>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <Clock className="w-4 h-4 text-primary" />
            </span>
            {t.recentVideos}
          </h2>
          {recent.length === 0 ?
          <div className="text-center py-12">
              <Video className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">{t.noVideos}</p>
            </div> :

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recent.map((v, i) =>
            <VideoCard key={v.id} video={v} index={i}
            isFavorite={favorites.includes(v.id)}
            onToggleFavorite={toggleFavorite}
            onPlay={setPlayingVideo}
            onShare={handleShare} />

            )}
            </div>
          }
        </section>
      </div>

      {/* Player Modal */}
      {playingVideo && <VideoPlayer video={playingVideo} onClose={() => setPlayingVideo(null)} />}
    </div>);

}