import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Maximize, Minimize, Play, Pause, Volume2, VolumeX, ChevronRight, ChevronLeft, Subtitles } from "lucide-react";
import { extractYoutubeId } from "@/components/dev/DevVideos";
import { toast } from "sonner";

export default function VideoPlayer({ video, onClose }) {
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showInfo, setShowInfo] = useState(true);
  const [containerRef, setContainerRef] = useState(null);
  const iframeRef = useRef(null);

  const videoId = extractYoutubeId(video?.youtube_url);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") {
        if (fullscreen) { setFullscreen(false); }
        else onClose?.();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [fullscreen, onClose]);

  // Toggle fullscreen on container
  useEffect(() => {
    if (!containerRef) return;
    const handler = () => setFullscreen(!!document.fullscreenElement);
    containerRef.addEventListener("fullscreenchange", handler);
    return () => containerRef.removeEventListener("fullscreenchange", handler);
  }, [containerRef]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  // Build YouTube embed URL with controls
  const embedUrl = videoId
    ? `https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0&playsinline=1${muted ? "&mute=1" : ""}`
    : null;

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: video.title, url: video.youtube_url }); } catch (e) {}
    } else {
      try { await navigator.clipboard.writeText(video.youtube_url); toast.success("تم نسخ الرابط"); } catch (e) {}
    }
  };

  if (!videoId) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" dir="rtl">
        <div className="text-center text-white p-8">
          <p className="text-lg font-bold mb-2">رابط الفيديو غير صالح</p>
          <button onClick={onClose} className="text-primary hover:underline">إغلاق</button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setContainerRef}
      className={`fixed inset-0 z-50 bg-black flex flex-col ${fullscreen ? "" : ""}`}
      dir="rtl"
    >
      {/* Video iframe */}
      <div className="flex-1 relative flex items-center justify-center">
        <iframe
          ref={iframeRef}
          src={embedUrl}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          title={video.title}
          frameBorder="0"
        />

        {/* Top bar: info + close */}
        <AnimatePresence>
          {showInfo && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4 flex items-start justify-between gap-4"
            >
              <div className="flex-1 min-w-0 text-white">
                <h2 className="text-base sm:text-lg font-bold truncate">{video.title}</h2>
                {video.channel_name && <p className="text-xs text-white/70">{video.channel_name}</p>}
                {video.description && <p className="text-xs text-white/50 mt-1 line-clamp-2">{video.description}</p>}
              </div>
              <button onClick={onClose} className="shrink-0 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white">
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom controls */}
        <AnimatePresence>
          {showInfo && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2">
                <button onClick={() => setMuted(!muted)} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white">
                  {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <span className="text-xs text-white/70">{muted ? "صامت" : "صوت"}</span>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={handleShare} className="px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-medium">
                  مشاركة
                </button>
                <button onClick={() => setShowInfo(!showInfo)} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white">
                  <Subtitles className="w-5 h-5" />
                </button>
                <button onClick={toggleFullscreen} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white">
                  {fullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tap to toggle info */}
        {!showInfo && (
          <button
            onClick={() => setShowInfo(true)}
            className="absolute inset-0 w-full h-full cursor-pointer"
            aria-label="إظهار المعلومات"
          />
        )}
      </div>
    </div>
  );
}