import { motion } from "framer-motion";
import { getSetting } from "@/lib/settingsStore";

/**
 * Dar Al-Uloom — 3D Motion Logo Loader
 * The inner book stays static; the D-shaped outer frame detaches
 * and orbits around it in 3D (passing front → side → behind → side),
 * then returns to merge. Loop = world-class app loading feel.
 */
export default function LogoLoader({ size = 90, showName = true }) {
  const appName = getSetting("app_name") || "دار العلوم";

  const dur = 3;
  const times = [0, 0.12, 0.88, 1];
  const ease = [0.45, 0, 0.55, 1];
  const tr = { duration: dur, repeat: Infinity, times, ease };

  return (
    <div className="flex flex-col items-center justify-center gap-6" style={{ perspective: "1000px" }}>
      <div style={{ width: size, height: size, position: "relative", transformStyle: "preserve-3d" }}>

        {/* ── Static inner: open book ── */}
        <svg viewBox="0 0 120 120" className="absolute inset-0 w-full h-full" style={{ transformStyle: "preserve-3d" }}>
          <defs>
            <linearGradient id="dal-book-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--primary) / 0.65)" />
            </linearGradient>
          </defs>
          {/* left page */}
          <path d="M 60 40 L 26 47 L 26 83 L 60 76 Z" fill="url(#dal-book-grad)" />
          {/* right page */}
          <path d="M 60 40 L 94 47 L 94 83 L 60 76 Z" fill="url(#dal-book-grad)" opacity="0.75" />
          {/* text lines */}
          {[54, 61, 68].map((y) => (
            <g key={y}>
              <line x1="34" y1={y - 4} x2="54" y2={y - 8} stroke="hsl(var(--primary-foreground))" strokeWidth="1.2" opacity="0.35" />
              <line x1="66" y1={y - 8} x2="86" y2={y - 4} stroke="hsl(var(--primary-foreground))" strokeWidth="1.2" opacity="0.35" />
            </g>
          ))}
        </svg>

        {/* ── Orbiting D-frame (3 layers: orbit → translate+scale → counter-rotate) ── */}
        <motion.div
          style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d" }}
          animate={{ rotateY: [0, 0, 360, 360] }}
          transition={tr}
        >
          <motion.div
            style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d" }}
            animate={{ z: [0, 28, 28, 0], scale: [1, 0.7, 0.7, 1] }}
            transition={tr}
          >
            <motion.div
              style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d" }}
              animate={{ rotateY: [0, 0, -360, -360] }}
              transition={tr}
            >
              <svg viewBox="0 0 120 120" className="absolute inset-0 w-full h-full">
                <path
                  d="M 20 12 L 20 108 L 66 108 C 98 108 108 87 108 60 C 108 33 98 12 66 12 Z"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="7"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </svg>
            </motion.div>
          </motion.div>
        </motion.div>

      </div>

      {/* App name pulse */}
      {showName && (
        <motion.p
          className="font-bold text-primary text-lg tracking-wide"
          style={{ fontFamily: "var(--font-heading)" }}
          animate={{ opacity: [0.35, 1, 0.35] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          {appName}
        </motion.p>
      )}
    </div>
  );
}