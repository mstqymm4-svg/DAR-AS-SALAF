import { motion, AnimatePresence } from "framer-motion";
import { Pause, Play, Square, Gauge } from "lucide-react";

/** Floating read-aloud controls: pause/resume, speed, stop + current page. */
export default function ReadingControls({ show, paused, rate, currentPage, totalPages, onTogglePause, onCycleRate, onStop }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-card/95 backdrop-blur border border-border rounded-2xl shadow-xl px-3 py-2 max-w-[92%]"
          dir="rtl"
        >
          <span className="text-xs text-muted-foreground px-1 whitespace-nowrap">يقرأ صفحة {currentPage}/{totalPages}</span>
          <div className="w-px h-6 bg-border" />
          <button onClick={onTogglePause} className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center transition-colors hover:bg-primary/90" title={paused ? "استئناف" : "إيقاف مؤقت"}>
            {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
          <button onClick={onCycleRate} className="h-9 px-2.5 rounded-full bg-muted text-xs font-bold flex items-center gap-1 transition-colors hover:bg-muted/70" title="سرعة القراءة">
            <Gauge className="w-3.5 h-3.5" /> {rate}x
          </button>
          <button onClick={onStop} className="w-9 h-9 rounded-full bg-destructive/10 text-destructive flex items-center justify-center transition-colors hover:bg-destructive/20" title="إيقاف">
            <Square className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}