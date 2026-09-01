import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Official Dar Al-Uloom logo (reference image — never redesigned).
const LOGO_URL =
  "https://media.base44.com/images/public/69c8e483a69a0d215eee4ef7/679b37a0c_C06AC024-1230-4B65-91B9-B30DDE077171.png";

// Palette pulled from the logo reference.
const C = {
  deep: "#003399",
  cyan: "#0099FF",
  sky: "#66CCFF",
  silver: "#E8EEF5",
  dark: "#212121",
};

// Timing map (seconds) — matches the requested sequence exactly.
const T = {
  dot: 0.0,
  lines: 0.4,
  frame: 0.95,
  mihrab: 1.6,
  crescent: 2.2,
  columns: 2.5,
  base: 3.35,
  squares: 3.6,
  reveal: 4.2, // real logo fades in
  shine: 4.4,
  hold: 4.8,
  end: 5.0,
  fadeOut: 5.0,
  done: 5.25,
};

const easeOut = [0.22, 1, 0.36, 1];

export default function SplashScreen({ onComplete }) {
  const [hidden, setHidden] = useState(false);
  const [imgReady, setImgReady] = useState(false);

  // Preload the real logo so the reveal never flashes empty.
  useEffect(() => {
    const img = new Image();
    img.src = LOGO_URL;
    img.onload = () => setImgReady(true);
    // Fallback in case onload is slow — reveal anyway at schedule.
    const f = setTimeout(() => setImgReady(true), 3000);
    return () => clearTimeout(f);
  }, []);

  // Schedule the final fade-out + completion.
  useEffect(() => {
    const t1 = setTimeout(() => setHidden(true), T.fadeOut * 1000);
    const t2 = setTimeout(() => onComplete && onComplete(), T.done * 1000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onComplete]);

  // Columns: 4 vertical pillars inside the mihrab, rising one by one.
  const columns = [
    { x: 178, w: 7 },
    { x: 196, w: 7 },
    { x: 224, w: 7 },
    { x: 242, w: 7 },
  ];
  // Side squares (pixel/dissolve effect on the far left), staggered in.
  const squares = [
    { x: 8, y: 60, s: 11 },
    { x: 22, y: 96, s: 9 },
    { x: 6, y: 130, s: 10 },
    { x: 26, y: 168, s: 8 },
    { x: 10, y: 206, s: 11 },
    { x: 24, y: 246, s: 9 },
    { x: 8, y: 286, s: 10 },
    { x: 28, y: 326, s: 8 },
    { x: 12, y: 366, s: 11 },
  ];
  // Geometric "girih" lines that emanate from the center dot.
  const rays = Array.from({ length: 8 }, (_, i) => (i * Math.PI) / 4);

  return (
    <AnimatePresence>
      {!hidden && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-white"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          <div
            className="relative"
            style={{ width: "min(85vw, 360px)", aspectRatio: "1 / 1.05" }}
          >
            {/* ---- SVG construction (stylized, GPU-friendly: transform/opacity/pathLength) ---- */}
            <svg
              viewBox="0 0 360 400"
              className="absolute inset-0 h-full w-full"
              style={{ filter: "drop-shadow(0 6px 18px rgba(0,51,153,0.12))" }}
            >
              <defs>
                <linearGradient id="frameGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={C.sky} />
                  <stop offset="55%" stopColor={C.cyan} />
                  <stop offset="100%" stopColor={C.deep} />
                </linearGradient>
                <linearGradient id="metalGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={C.silver} />
                  <stop offset="50%" stopColor="#FFFFFF" />
                  <stop offset="100%" stopColor={C.silver} />
                </linearGradient>
                <linearGradient id="sqGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={C.sky} />
                  <stop offset="100%" stopColor={C.deep} />
                </linearGradient>
              </defs>

              {/* L vertical block (left of the D) */}
              <motion.rect
                x={70}
                y={40}
                width={26}
                height={320}
                rx={6}
                fill="url(#frameGrad)"
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: 1, scaleY: 1 }}
                transition={{ duration: 0.5, delay: T.frame, ease: easeOut }}
                style={{ transformOrigin: "83px 200px" }}
              />

              {/* Outer D frame — drawn bottom → right → top → left (pathLength) */}
              <motion.path
                d="M120,360 L120,60 A150,150 0 0 1 120,360 Z"
                fill="none"
                stroke="url(#frameGrad)"
                strokeWidth={9}
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{
                  duration: 0.65,
                  delay: T.frame,
                  ease: easeOut,
                }}
              />
              {/* Inner pattern lines inside the D curve */}
              <motion.g
                stroke={C.cyan}
                strokeWidth={1.4}
                opacity={0}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                transition={{ duration: 0.5, delay: T.frame + 0.25 }}
              >
                <line x1="150" y1="120" x2="240" y2="120" />
                <line x1="150" y1="200" x2="265" y2="200" />
                <line x1="150" y1="280" x2="240" y2="280" />
                <line x1="180" y1="90" x2="180" y2="310" />
                <line x1="220" y1="80" x2="220" y2="320" />
                <line x1="150" y1="120" x2="220" y2="80" />
                <line x1="150" y1="280" x2="220" y2="320" />
              </motion.g>

              {/* Mihrab (pointed arch niche) — drawn from bottom up */}
              <motion.path
                d="M168,340 L168,250 C168,214 252,214 252,250 L252,340"
                fill="none"
                stroke="url(#metalGrad)"
                strokeWidth={6}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: T.mihrab, ease: easeOut }}
              />

              {/* Crescent moon atop the arch — drawn then settles (scale 70→105→100) */}
              <motion.path
                d="M222,150 a13,13 0 1 1 -10,-2 a10,10 0 1 0 10,2 Z"
                fill={C.silver}
                stroke={C.cyan}
                strokeWidth={1}
                initial={{ pathLength: 0, opacity: 0, scale: 0.7 }}
                animate={{ pathLength: 1, opacity: 1, scale: [0.7, 1.05, 1] }}
                transition={{
                  pathLength: { duration: 0.3, delay: T.crescent, ease: easeOut },
                  opacity: { duration: 0.2, delay: T.crescent },
                  scale: { duration: 0.5, delay: T.crescent + 0.2, times: [0, 0.6, 1], ease: easeOut },
                }}
                style={{ transformOrigin: "210px 150px" }}
              />

              {/* Four columns — rise one by one (translateY + opacity) */}
              {columns.map((c, i) => (
                <motion.rect
                  key={i}
                  x={c.x}
                  y={250}
                  width={c.w}
                  height={70}
                  rx={3}
                  fill="url(#frameGrad)"
                  initial={{ opacity: 0, y: 320 }}
                  animate={{ opacity: 1, y: 250 }}
                  transition={{
                    duration: 0.45,
                    delay: T.columns + i * 0.12,
                    ease: easeOut,
                  }}
                />
              ))}

              {/* Base — settles under the columns */}
              <motion.rect
                x={150}
                y={346}
                width={120}
                height={14}
                rx={4}
                fill="url(#frameGrad)"
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: 1, scaleY: 1 }}
                transition={{ duration: 0.25, delay: T.base, ease: easeOut }}
                style={{ transformOrigin: "210px 353px" }}
              />

              {/* Side squares — dissolve in, staggered */}
              {squares.map((sq, i) => (
                <motion.rect
                  key={i}
                  x={sq.x}
                  y={sq.y}
                  width={sq.s}
                  height={sq.s}
                  rx={2}
                  fill="url(#sqGrad)"
                  initial={{ opacity: 0, x: sq.x - 8, y: sq.y - 6 }}
                  animate={{ opacity: 1, x: sq.x, y: sq.y }}
                  transition={{
                    duration: 0.3,
                    delay: T.squares + i * 0.06,
                    ease: easeOut,
                  }}
                />
              ))}

              {/* Initial blue dot + radiating geometric lines */}
              <motion.circle
                cx={210}
                cy={200}
                r={4}
                fill={C.deep}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
                transition={{
                  duration: 0.8,
                  delay: T.dot,
                  times: [0, 0.3, 1],
                  ease: easeOut,
                }}
                style={{ transformOrigin: "210px 200px" }}
              />
              <motion.g
                stroke={C.cyan}
                strokeWidth={1.1}
                strokeLinecap="round"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.9, 0] }}
                transition={{
                  duration: 0.55,
                  delay: T.lines,
                  times: [0, 0.5, 1],
                  ease: easeOut,
                }}
                style={{ transformOrigin: "210px 200px" }}
              >
                {rays.map((a, i) => {
                  const r = 60;
                  return (
                    <motion.line
                      key={i}
                      x1={210}
                      y1={200}
                      x2={210 + Math.cos(a) * r}
                      y2={200 + Math.sin(a) * r}
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{
                        duration: 0.4,
                        delay: T.lines + i * 0.04,
                        ease: easeOut,
                      }}
                    />
                  );
                })}
              </motion.g>
            </svg>

            {/* ---- Real logo reveal (guarantees exact fidelity to the reference) ---- */}
            <motion.img
              src={LOGO_URL}
              alt="دار العلوم"
              className="absolute inset-0 h-full w-full object-contain"
              draggable={false}
              initial={{ opacity: 0 }}
              animate={{ opacity: imgReady ? 1 : 0 }}
              transition={{ duration: 0.2, delay: T.reveal, ease: easeOut }}
            />

            {/* ---- Thin light reflection (left → right) ---- */}
            <motion.div
              className="pointer-events-none absolute inset-0 overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.01, delay: T.shine }}
            >
              <motion.div
                className="absolute -top-2 bottom-0 w-1/4"
                style={{
                  background:
                    "linear-gradient(105deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.55) 45%, rgba(102,204,255,0.35) 55%, rgba(255,255,255,0) 100%)",
                  filter: "blur(2px)",
                }}
                initial={{ left: "-30%" }}
                animate={{ left: "110%" }}
                transition={{ duration: 0.4, delay: T.shine, ease: "easeInOut" }}
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}