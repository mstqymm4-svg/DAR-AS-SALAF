import { motion } from "framer-motion";
import { getSetting } from "@/lib/settingsStore";

/**
 * Dar Al-Uloom — Premium 3D Motion Logo Loader
 * 
 * Static center: mosque arch + pillars + crescent + pixel trail
 * Orbiting: outer D-frame detaches, orbits in 3D with depth
 * (passes behind/in front), then merges back. Continuous luxury loop.
 * 
 * Colors match original logo: royal blue, cyan, metallic silver.
 */
export default function LogoLoader({ size = 100, showName = true }) {
  const appName = getSetting("app_name") || "دار العلوم";

  // ── Timing: medium, luxurious, smooth ease-in/out ──
  const dur = 3.6;
  const ease = [0.45, 0, 0.55, 1];
  const orbit = { duration: dur, repeat: Infinity, ease, times: [0, 0.12, 0.5, 0.88, 1] };

  // Logo palette
  const royalBlue = "#0055ff";
  const brightCyan = "#00d4ff";
  const silverLight = "#e0e0e0";
  const silverDark = "#b0b0b0";

  return (
    <div className="flex flex-col items-center justify-center gap-7" style={{ perspective: "1400px" }}>
      <div style={{ width: size, height: size, position: "relative", transformStyle: "preserve-3d" }}>

        {/* ═══════════════ STATIC CENTER: Mosque + Pixel Trail ═══════════════ */}
        <svg viewBox="0 0 120 120" className="absolute inset-0 w-full h-full" style={{ transformStyle: "preserve-3d" }}>
          <defs>
            {/* Silver gradient for mosque silhouette */}
            <linearGradient id="dal-mosque-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={silverLight} />
              <stop offset="60%" stopColor="#c8c8d0" />
              <stop offset="100%" stopColor={silverDark} />
            </linearGradient>
            {/* Blue gradient for arch interior */}
            <linearGradient id="dal-arch-inner" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={royalBlue} stopOpacity="0.9" />
              <stop offset="100%" stopColor="#0033aa" stopOpacity="0.7" />
            </linearGradient>
            {/* Cyan glow for crescent */}
            <radialGradient id="dal-crescent-glow" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor={brightCyan} stopOpacity="0.8" />
              <stop offset="100%" stopColor={brightCyan} stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* ── Pixel trail (left side) ── */}
          {[
            { x: 8, y: 50, s: 2.5 },
            { x: 10, y: 42, s: 2 },
            { x: 7, y: 58, s: 3 },
            { x: 12, y: 34, s: 1.5 },
            { x: 6, y: 66, s: 2 },
            { x: 11, y: 26, s: 1.5 },
            { x: 9, y: 72, s: 1.5 },
            { x: 13, y: 20, s: 1 },
          ].map((p, i) => (
            <rect
              key={i}
              x={p.x}
              y={p.y}
              width={p.s}
              height={p.s}
              rx="0.4"
              fill={brightCyan}
              opacity={0.4 + i * 0.06}
            />
          ))}

          {/* ── Mosque silhouette ── */}
          {/* Base platform */}
          <rect x="34" y="92" width="52" height="5" rx="1" fill="url(#dal-mosque-grad)" />

          {/* Main body */}
          <rect x="40" y="62" width="40" height="30" fill="url(#dal-mosque-grad)" />

          {/* Central pointed arch with interior */}
          <path
            d="M 52 92 L 52 76 Q 52 64 60 64 Q 68 64 68 76 L 68 92 Z"
            fill="url(#dal-arch-inner)"
            stroke="url(#dal-mosque-grad)"
            strokeWidth="1.5"
          />

          {/* Pillars inside arch */}
          <line x1="56" y1="70" x2="56" y2="88" stroke={silverLight} strokeWidth="1.2" opacity="0.7" />
          <line x1="60" y1="68" x2="60" y2="88" stroke={silverLight} strokeWidth="1.2" opacity="0.7" />
          <line x1="64" y1="70" x2="64" y2="88" stroke={silverLight} strokeWidth="1.2" opacity="0.7" />

          {/* Dome base */}
          <rect x="48" y="56" width="24" height="7" rx="1" fill="url(#dal-mosque-grad)" />

          {/* Dome (pointed) */}
          <path
            d="M 48 56 Q 48 40 60 36 Q 72 40 72 56 Z"
            fill="url(#dal-mosque-grad)"
          />

          {/* Crescent moon on top */}
          <circle cx="60" cy="28" r="6" fill="url(#dal-crescent-glow)" />
          <path
            d="M 63 24 A 5 5 0 1 1 57 30 A 4 4 0 1 0 63 24 Z"
            fill={silverLight}
          />

          {/* Side minarets */}
          <rect x="34" y="64" width="4" height="28" rx="1" fill="url(#dal-mosque-grad)" />
          <circle cx="36" cy="62" r="2.5" fill="url(#dal-mosque-grad)" />
          <rect x="82" y="64" width="4" height="28" rx="1" fill="url(#dal-mosque-grad)" />
          <circle cx="84" cy="62" r="2.5" fill="url(#dal-mosque-grad)" />

          {/* Lens flare at crescent apex */}
          <circle cx="60" cy="22" r="1.5" fill={brightCyan} opacity="0.9" />
          <circle cx="60" cy="22" r="3" fill={brightCyan} opacity="0.3" />
        </svg>

        {/* ═══════════════ ORBITING D-FRAME ═══════════════ */}
        {/* Layer 1: Orbital Y-rotation — creates the "around" motion */}
        <motion.div
          style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", willChange: "transform" }}
          animate={{ rotateY: [0, 0, 180, 360, 360] }}
          transition={orbit}
        >
          {/* Layer 2: Z-depth + scale — creates 3D "in front / behind" illusion */}
          <motion.div
            style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", willChange: "transform, opacity, filter" }}
            animate={{
              z: [0, 10, -25, 10, 0],
              scale: [1, 0.92, 0.78, 0.92, 1],
              opacity: [1, 0.95, 0.5, 0.95, 1],
              filter: ["blur(0px)", "blur(0.3px)", "blur(1.2px)", "blur(0.3px)", "blur(0px)"],
            }}
            transition={orbit}
          >
            {/* Layer 3: Counter-rotate so D always faces viewer */}
            <motion.div
              style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", willChange: "transform" }}
              animate={{ rotateY: [0, 0, -180, -360, -360] }}
              transition={orbit}
            >
              {/* Layer 4: Subtle tilt for liveliness */}
              <motion.div
                style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", willChange: "transform" }}
                animate={{
                  rotateX: [0, 2, 0, -2, 0],
                  rotateZ: [0, 1.5, 0, -1.5, 0],
                  y: [0, -2, 0, 2, 0],
                }}
                transition={orbit}
              >
                <svg viewBox="0 0 120 120" className="absolute inset-0 w-full h-full">
                  <defs>
                    {/* Metallic blue gradient for D-frame */}
                    <linearGradient id="dal-dframe-grad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor={brightCyan} />
                      <stop offset="35%" stopColor={royalBlue} />
                      <stop offset="70%" stopColor="#0044cc" />
                      <stop offset="100%" stopColor="#003399" />
                    </linearGradient>
                    {/* Silver bevel highlight */}
                    <linearGradient id="dal-dframe-bevel" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={silverLight} stopOpacity="0.8" />
                      <stop offset="50%" stopColor={silverLight} stopOpacity="0.2" />
                      <stop offset="100%" stopColor={silverDark} stopOpacity="0.6" />
                    </linearGradient>
                    {/* Glow filter */}
                    <filter id="dal-dframe-glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="1.5" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  {/* D-frame: thick metallic arch */}
                  <path
                    d="M 16 8 L 16 112 L 64 112 C 102 112 114 88 114 60 C 114 32 102 8 64 8 Z"
                    fill="none"
                    stroke="url(#dal-dframe-grad)"
                    strokeWidth="7"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    filter="url(#dal-dframe-glow)"
                  />
                  {/* Bevel highlight on inner edge */}
                  <path
                    d="M 22 14 L 22 106 L 63 106 C 95 106 106 86 106 60 C 106 34 95 14 63 14 Z"
                    fill="none"
                    stroke="url(#dal-dframe-bevel)"
                    strokeWidth="1"
                    strokeLinejoin="round"
                    opacity="0.5"
                  />
                  {/* Light bloom on upper-right curve */}
                  <circle cx="105" cy="28" r="4" fill={brightCyan} opacity="0.25" />
                </svg>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* ═══════════════ Ground shadow ═══════════════ */}
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 rounded-full blur-md"
          style={{
            bottom: -8,
            width: size * 0.6,
            height: 6,
            background: `radial-gradient(circle, ${royalBlue}40, transparent)`,
            willChange: "transform, opacity",
          }}
          animate={{
            scale: [1, 0.85, 0.6, 0.85, 1],
            opacity: [0.3, 0.22, 0.1, 0.22, 0.3],
          }}
          transition={orbit}
        />
      </div>

      {/* ═══════════════ App name ═══════════════ */}
      {showName && (
        <div className="flex flex-col items-center gap-1.5">
          <motion.p
            className="font-bold text-xl tracking-[0.18em]"
            style={{
              fontFamily: "var(--font-heading)",
              background: `linear-gradient(135deg, ${royalBlue}, ${brightCyan})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          >
            {appName}
          </motion.p>
          <motion.div
            className="h-[2px] rounded-full"
            style={{ background: `linear-gradient(90deg, transparent, ${royalBlue}, ${brightCyan}, ${royalBlue}, transparent)` }}
            animate={{ width: ["15%", "55%", "15%"], opacity: [0.3, 0.9, 0.3] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      )}
    </div>
  );
}