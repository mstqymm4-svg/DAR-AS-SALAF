import { motion, AnimatePresence } from "framer-motion";
import { X, Play } from "lucide-react";
import { useT } from "@/lib/i18n";

/**
 * Slide-in playlist panel for the video player.
 * Highlights the currently playing video; tapping an item switches to it.
 */
export default function PlaylistPanel({ show, videos, currentIndex, onSelect, onClose }) {
  const t = useT();
  return (
    <AnimatePresence>
      {show && videos.length > 0 && (
        <motion.aside
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "tween", duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          dir={t.dir}
          className="absolute inset-y-0 end-0 z-20 w-80 max-w-[85%] bg-black/90 backdrop-blur-md border-s border-white/10 flex flex-col"
        >
          <div className="flex items-center justify-between px-4 h-14 shrink-0 border-b border-white/10">
            <div className="min-w-0">
              <h3 className="text-white text-sm font-bold truncate">{t.playlist}</h3>
              <p className="text-white/50 text-[10px]">{videos.length} {t.videosTitle}</p>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            {videos.map((v, i) => {
              const current = i === currentIndex;
              return (
                <button
                  key={v.id}
                  onClick={() => onSelect(v)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-start transition-colors ${
                    current ? "bg-primary/15" : "hover:bg-white/5"
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold ${
                      current ? "bg-primary text-white" : "bg-white/10 text-white/60"
                    }`}
                  >
                    {current ? <Play className="w-3 h-3 fill-white" /> : i + 1}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className={`block text-xs font-medium truncate ${current ? "text-primary" : "text-white"}`}>
                      {v.title}
                    </span>
                    {v.channel_name && (
                      <span className="block text-[10px] text-white/50 truncate">{v.channel_name}</span>
                    )}
                  </span>
                  {v.duration && (
                    <span className="text-[10px] text-white/50 shrink-0 font-mono">{v.duration}</span>
                  )}
                </button>
              );
            })}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}