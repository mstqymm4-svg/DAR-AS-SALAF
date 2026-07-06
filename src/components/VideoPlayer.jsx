import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Maximize, Minimize, Play, Pause, RotateCcw, Volume2, VolumeX, Share2 } from "lucide-react";
import { extractYoutubeId } from "@/components/dev/DevVideos";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function VideoPlayer({ video, onClose }) {
  const t = useT();
  const containerRef = useRef(null);
  const playerInstanceRef = useRef(null);
  const hideTimerRef = useRef(null);
  const [player, setPlayer] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [ready, setReady] = useState(false);
  const [restoreTime, setRestoreTime] = useState(0);

  const videoId = extractYoutubeId(video?.youtube_url);

  // Restore last position
  useEffect(() => {
    if (!videoId) return;
    const saved = localStorage.getItem(`video_pos_${videoId}`);
    if (saved) setRestoreTime(Number(saved));
  }, [videoId]);

  // Initialize YouTube IFrame API player
  useEffect(() => {
    if (!videoId) return;
    let cancelled = false;

    const initPlayer = () => {
      if (cancelled || !window.YT?.Player) return;
      playerInstanceRef.current = new window.YT.Player("yt-player-container", {
        videoId,
        playerVars: {
          autoplay: 1, controls: 0, modestbranding: 1, rel: 0,
          playsinline: 1, iv_load_policy: 3, fs: 0, disablekb: 1,
          start: restoreTime || 0,
        },
        events: {
          onReady: (e) => {
            if (cancelled) return;
            setPlayer(e.target);
            setDuration(e.target.getDuration());
            setReady(true);
            e.target.playVideo();
          },
          onStateChange: (e) => {
            if (cancelled) return;
            setPlaying(e.data === window.YT.PlayerState.PLAYING);
            if (e.data === window.YT.PlayerState.PLAYING) {
              setDuration(e.target.getDuration());
            }
          },
        },
      });
    };

    if (window.YT?.Player) {
      initPlayer();
    } else {
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(tag);
      }
      const interval = setInterval(() => {
        if (window.YT?.Player) { clearInterval(interval); initPlayer(); }
      }, 100);
      return () => { cancelled = true; clearInterval(interval); };
    }

    return () => {
      cancelled = true;
      if (playerInstanceRef.current) {
        try { playerInstanceRef.current.destroy(); } catch(e) {}
      }
    };
  }, [videoId]);

  // Time update polling + save position
  useEffect(() => {
    if (!player) return;
    const interval = setInterval(() => {
      try {
        const t = player.getCurrentTime() || 0;
        setCurrentTime(t);
        const d = player.getDuration();
        if (d) setDuration(d);
        // Save position every 5 seconds
        if (videoId && t > 0) {
          localStorage.setItem(`video_pos_${videoId}`, String(Math.floor(t)));
        }
      } catch(e) {}
    }, 300);
    return () => clearInterval(interval);
  }, [player, videoId]);

  // Fullscreen handling
  useEffect(() => {
    const handler = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Keyboard
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") {
        if (document.fullscreenElement) document.exitFullscreen();
        else onClose?.();
      } else if (e.key === " " && player) {
        e.preventDefault();
        if (playing) player.pauseVideo();
        else player.playVideo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [player, playing, onClose]);

  const togglePlay = () => {
    if (!player) return;
    if (playing) player.pauseVideo();
    else player.playVideo();
  };

  const handleRestart = () => {
    if (!player) return;
    player.seekTo(0, true);
    player.playVideo();
  };

  const handleSeek = (e) => {
    if (!player) return;
    const time = Number(e.target.value);
    player.seekTo(time, true);
    setCurrentTime(time);
  };

  const toggleMute = () => {
    if (!player) return;
    if (muted) { player.unMute(); setMuted(false); }
    else { player.mute(); setMuted(true); }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen?.();
    else document.exitFullscreen?.();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: video.title, url: video.youtube_url }); } catch(e) {}
    } else {
      try { await navigator.clipboard.writeText(video.youtube_url); toast.success(t.linkCopied); } catch(e) {}
    }
  };

  const showControlsTemp = () => {
    setShowControls(true);
    clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (playing) {
        setShowControls(false);
      }
    }, 3500);
  };

  // Hide bottom nav while video player is open; restore on close
  useEffect(() => {
    const nav = document.getElementById("bottom-nav");
    if (nav) nav.style.transform = "translateY(100%)";
    return () => {
      if (nav) nav.style.transform = "translateY(0)";
      clearTimeout(hideTimerRef.current);
    };
  }, []);



  if (!videoId) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95" dir="rtl">
        <div className="text-center text-white p-8">
          <p className="text-lg font-bold mb-2">{t.invalidVideoUrl}</p>
          <button onClick={onClose} className="text-primary hover:underline">{t.close}</button>
        </div>
      </div>
    );
  }

  const progressPct = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[60] bg-black flex flex-col"
      dir="rtl"
      onMouseMove={showControlsTemp}
      onClick={showControlsTemp}
    >
      <div className="flex-1 relative flex items-center justify-center">
        <div id="yt-player-container" className="w-full h-full pointer-events-none" />

        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        )}

        {/* Top bar */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4 flex items-start justify-between gap-4 pointer-events-none z-10"
            >
              <div className="flex-1 min-w-0 text-white pointer-events-auto">
                <h2 className="text-base sm:text-lg font-bold truncate">{video.title}</h2>
                {video.channel_name && <p className="text-xs text-white/70">{video.channel_name}</p>}
              </div>
              <div className="flex items-center gap-2 pointer-events-auto">
                <button onClick={handleShare} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                  <Share2 className="w-5 h-5" />
                </button>
                <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Center play button when paused */}
        <AnimatePresence>
          {ready && !playing && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={(e) => { e.stopPropagation(); togglePlay(); }}
              className="absolute inset-0 flex items-center justify-center z-10"
            >
              <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center shadow-2xl">
                <Play className="w-7 h-7 text-white fill-white mr-1" />
              </div>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Bottom controls */}
        <AnimatePresence>
          {showControls && ready && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent px-4 pt-12 pb-4 pointer-events-none z-10"
            >
              {/* Progress bar */}
              <div className="flex items-center gap-2 mb-3 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                <span className="text-xs text-white font-mono w-12 text-center">{formatTime(currentTime)}</span>
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleSeek}
                  className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, hsl(var(--primary)) ${progressPct}%, rgba(255,255,255,0.2) ${progressPct}%)`,
                  }}
                />
                <span className="text-xs text-white font-mono w-12 text-center">{formatTime(duration)}</span>
              </div>

              {/* Control buttons */}
              <div className="flex items-center justify-between pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-2">
                  <button onClick={togglePlay} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                    {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                  </button>
                  <button onClick={handleRestart} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors" title={t.restartPlayback}>
                    <RotateCcw className="w-5 h-5" />
                  </button>
                  <button onClick={toggleMute} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                    {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                </div>
                <button onClick={toggleFullscreen} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                  {fullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}