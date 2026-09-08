import React from "react";

/**
 * Vector rebuild of the Dar Al Uloom mark ("D" arch + mihrab + crescent +
 * blue bars + base + floating squares). Every element is its own node so the
 * loader can assemble the logo piece by piece. No box, no card, no background.
 */

const SQUARES = [
  { x: 196, y: 276, s: 44, tone: "cyan" },
  { x: 258, y: 336, s: 42, tone: "blue" },
  { x: 104, y: 348, s: 42, tone: "blue" },
  { x: 186, y: 398, s: 40, tone: "cyan" },
  { x: 306, y: 412, s: 34, tone: "blue" },
  { x: 104, y: 442, s: 42, tone: "blue" },
  { x: 186, y: 470, s: 40, tone: "cyan" },
  { x: 258, y: 470, s: 34, tone: "blue" },
  { x: 104, y: 534, s: 42, tone: "blue" },
  { x: 186, y: 542, s: 40, tone: "cyan" },
  { x: 258, y: 538, s: 34, tone: "blue" },
  { x: 186, y: 616, s: 40, tone: "cyan" },
  { x: 104, y: 626, s: 42, tone: "blue" },
  { x: 104, y: 690, s: 42, tone: "blue" },
  { x: 104, y: 752, s: 42, tone: "blue" },
];

const BARS = [
  "M410,542 L446,522 L446,806 L410,806 Z",
  "M466,522 L502,500 L502,784 L466,784 Z",
  "M556,500 L592,522 L592,784 L556,784 Z",
  "M612,522 L648,542 L648,806 L612,806 Z",
];

const ARCH_PATH =
  "M300,120 L648,120 C846,120 908,318 908,516 C908,742 786,916 586,916";

export default function DarLogoSVG({ className = "" }) {
  return (
    <svg
      className={`dau-logo ${className}`}
      viewBox="0 0 1024 1024"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="dauBlue" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="45%" stopColor="#0891b2" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id="dauBar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a5f3fc" />
          <stop offset="100%" stopColor="#0ea5e9" />
        </linearGradient>
        <linearGradient id="dauBase" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id="dauSilver" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="55%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>
        <linearGradient id="dauCrescent" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fdfde3" />
          <stop offset="100%" stopColor="#d9f99d" />
        </linearGradient>

        {/* Islamic lattice used inside the arch band */}
        <pattern id="dauGeo" width="64" height="64" patternUnits="userSpaceOnUse">
          <rect width="64" height="64" fill="url(#dauBlue)" />
          <g stroke="#a5f3fc" strokeWidth="3" opacity="0.95" fill="none">
            <path d="M0,32 L32,0 L64,32 L32,64 Z" />
            <path d="M-16,16 L16,-16 M48,80 L80,48 M-16,48 L16,80 M48,-16 L80,16" />
            <path d="M32,12 L52,32 L32,52 L12,32 Z" />
          </g>
        </pattern>

        <mask id="dauSweepMask">
          <rect width="1024" height="1024" fill="white" />
        </mask>
      </defs>

      {/* ── Left floating squares ── */}
      <g className="dau-squares">
        {SQUARES.map((sq, i) => (
          <g key={i} className="dau-square" style={{ "--i": i }}>
            <rect
              x={sq.x}
              y={sq.y}
              width={sq.s}
              height={sq.s}
              rx="3"
              fill={sq.tone === "cyan" ? "#22d3ee" : "#1d4ed8"}
              stroke="#0f172a"
              strokeWidth="7"
            />
          </g>
        ))}
      </g>

      {/* ── Outer arch: dark edge, silver frame, then drawn blue band ── */}
      <g className="dau-arch">
        <path
          className="dau-arch-edge"
          d={ARCH_PATH}
          stroke="#0f172a"
          strokeWidth="126"
          strokeLinecap="butt"
        />
        <path
          className="dau-arch-frame"
          d={ARCH_PATH}
          stroke="url(#dauSilver)"
          strokeWidth="112"
          strokeLinecap="butt"
        />
        <path
          className="dau-arch-band"
          d={ARCH_PATH}
          stroke="url(#dauGeo)"
          strokeWidth="84"
          strokeLinecap="butt"
        />
      </g>

      {/* the small step that closes the top-left of the D */}
      <g className="dau-arch-step">
        <path d="M300,120 L300,352" stroke="#0f172a" strokeWidth="126" />
        <path d="M300,120 L300,352" stroke="url(#dauSilver)" strokeWidth="112" />
        <path
          className="dau-step-band"
          d="M300,120 L300,352"
          stroke="url(#dauGeo)"
          strokeWidth="84"
        />
      </g>

      {/* ── Bottom blue base (L shape) ── */}
      <g className="dau-base">
        <path
          d="M250,596 L348,596 L348,864 L536,864 L536,936 L250,936 Z"
          fill="url(#dauBase)"
          stroke="#0f172a"
          strokeWidth="16"
        />
        <path
          d="M272,620 L326,620 L326,886 L514,886 L514,914 L272,914 Z"
          fill="none"
          stroke="#ffffff"
          strokeWidth="9"
          opacity="0.85"
        />
      </g>

      {/* ── Vertical blue elements ── */}
      <g className="dau-bars">
        {BARS.map((d, i) => (
          <path
            key={i}
            className="dau-bar"
            style={{ "--i": i }}
            d={d}
            fill="url(#dauBar)"
            stroke="#0f172a"
            strokeWidth="10"
          />
        ))}
      </g>

      {/* ── Inner mihrab arch ── */}
      <g className="dau-inner">
        <path
          className="dau-inner-stroke"
          d="M368,860 L368,556 C368,438 448,352 512,300 C576,352 656,438 656,556 L656,860"
          stroke="#0f172a"
          strokeWidth="46"
          fill="none"
        />
        <path
          className="dau-inner-stroke"
          d="M368,860 L368,556 C368,438 448,352 512,300 C576,352 656,438 656,556 L656,860"
          stroke="url(#dauSilver)"
          strokeWidth="30"
          fill="none"
        />
      </g>

      {/* ── Crescent ── */}
      <g className="dau-crescent">
        <path
          d="M470,244 C470,300 520,326 566,306 C540,336 486,338 462,306 C442,280 446,252 470,244 Z"
          fill="url(#dauCrescent)"
          stroke="#0f172a"
          strokeWidth="9"
        />
      </g>

      {/* ── Light sweep ── */}
      <g className="dau-sweep" mask="url(#dauSweepMask)">
        <rect x="-260" y="0" width="180" height="1024" fill="url(#dauSweepGrad)" />
      </g>
      <defs>
        <linearGradient id="dauSweepGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#a5f3fc" stopOpacity="0" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#a5f3fc" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}