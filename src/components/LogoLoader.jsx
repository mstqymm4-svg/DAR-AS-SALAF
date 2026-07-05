import { motion } from "framer-motion";
import { getSetting } from "@/lib/settingsStore";

/**
 * Dar Al-Uloom — Premium 3D Motion Logo Loader
 * Inner book stays fixed; D-frame detaches and orbits in 3D with
 * realistic depth (scale + blur + opacity), subtle tilt per cycle,
 * then merges back. Smooth 60fps loop with ease-in/out.
 */
export default function LogoLoader({ size = 100, showName = true }) {
  const appName = getSetting("app_name") || "دار العلوم";

  // ── Timing: smooth ease-in/out, professional luxury feel ──
  const dur = 4;
  const ease = [0.45, 0, 0.55, 1]; // symmetric ease-in-out
  const tr = { duration: dur, repeat: Infinity, ease };

  // Keyframes: starts at 0, accelerates, peaks at 180°, decelerates, completes 360°
  // times ensure ease-in at start, ease-out at end for natural motion
  const orbit = { duration: dur, repeat: Infinity, ease, times: [0, 0.25, 0.5, 0.75, 1] };

  return (
    <div className="flex flex-col items-center justify-center gap-7" style={{ perspective: "1600px" }}>
      <div style={{ width: size, height: size, position: "relative", transformStyle: "preserve-3d" }}>

        {/* ── Static inner: open book with refined pages ── */}
        <svg viewBox="0 0 120 120" className="absolute inset-0 w-full h-full" style={{ transformStyle: "preserve-3d", willChange: "transform" }}>
          <defs>
            <linearGradient id="dal-page-left" x1="0" y1="0" x2="1" y2="0.5">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--primary) / 0.55)" />
            </linearGradient>
            <linearGradient id="dal-page-right" x1="1" y1="0" x2="0" y2="0.5">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--primary) / 0.55)" />
            </linearGradient>
          </defs>

          {/* left page */}
          <path d="M 60 38 L 24 46 L 24 84 L 60 76 Z" fill="url(#dal-page-left)" />
          {/* right page */}
          <path d="M 60 38 L 96 46 L 96 84 L 60 76 Z" fill="url(#dal-page-right)" />
          {/* spine */}
          <line x1="60" y1="38" x2="60" y2="76" stroke="hsl(var(--primary-foreground))" strokeWidth="1.2" opacity="0.5" />

          {/* refined text lines on pages */}
          {[48, 55, 62, 69].map((y, i) => (
            <g key={i}>
              <line x1="31" y1={y - 3} x2="54" y2={y - 6} stroke="hsl(var(--primary-foreground))" strokeWidth="0.9" opacity={0.28 - i * 0.03} strokeLinecap="round" />
              <line x1="66" y1={y - 6} x2="89" y2={y - 3} stroke="hsl(var(--primary-foreground))" strokeWidth="0.9" opacity={0.28 - i * 0.03} strokeLinecap="round" />
            </g>
          ))}
        </svg>

        {/* ── Orbiting D-frame: 4-layer 3D rig ── */}
        {/* Layer 1: orbital rotation around vertical Y axis */}
        <motion.div
          style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", willChange: "transform" }}
          animate={{ rotateY: [0, 90, 180, 270, 360] }}
          transition={orbit}
        >
          {/* Layer 2: depth — z-translate creates 3D orbit illusion */}
          <motion.div
            style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", willChange: "transform, opacity, filter" }}
            animate={{
              z: [0, 18, 0, -18, 0],
              scale: [1, 0.88, 0.7, 0.88, 1],
              opacity: [1, 0.9, 0.45, 0.9, 1],
              filter: ["blur(0px)", "blur(0.4px)", "blur(1.5px)", "blur(0.4px)", "blur(0px)"],
            }}
            transition={orbit}
          >
            {/* Layer 3: counter-rotate so D-frame always faces viewer */}
            <motion.div
              style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", willChange: "transform" }}
              animate={{ rotateY: [0, -90, -180, -270, -360] }}
              transition={orbit}
            >
              {/* Layer 4: subtle tilt 3° at peak, returns to 0 — gives liveliness */}
              <motion.div
                style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", willChange: "transform" }}
                animate={{ rotateX: [0, 3, 0, -3, 0], rotateZ: [0, 2, 0, -2, 0] }}
                transition={orbit}
              >
                <svg viewBox="0 0 120 120" className="absolute inset-0 w-full h-full">
                  <defs>
                    <linearGradient id="dal-frame-grad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" />
                      <stop offset="50%" stopColor="hsl(var(--primary) / 0.85)" />
                      <stop offset="100%" stopColor="hsl(var(--primary) / 0.6)" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 18 10 L 18 110 L 66 110 C 100 110 110 88 110 60 C 110 32 100 10 66 10 Z"
                    fill="none"
                    stroke="url(#dal-frame-grad)"
                    strokeWidth="6.5"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                </svg>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* ── Subtle ground shadow that pulses with orbit ── */}
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 rounded-full bg-primary/10 blur-md"
          style={{ bottom: -6, width: size * 0.65, height: 7, willChange: "transform, opacity" }}
          animate={{ scale: [1, 0.75, 0.5, 0.75, 1], opacity: [0.25, 0.18, 0.08, 0.18, 0.25] }}
          transition={orbit}
        />
      </div>

      {/* App name with refined letter-spacing */}
      {showName && (
        <div className="flex flex-col items-center gap-1.5">
          <motion.p
            className="font-bold text-primary text-xl tracking-[0.15em]"
            style={{ fontFamily: "var(--font-heading)" }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          >
            {appName}
          </motion.p>
          <motion.div
            className="h-[2px] rounded-full bg-primary/40"
            animate={{ width: ["20%", "60%", "20%"], opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      )}
    </div>
  );
}