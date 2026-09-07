import React, { useEffect, useState } from "react";

const LOGO_URL =
  "https://media.base44.com/images/public/69c8e483a69a0d215eee4ef7/679b37a0c_C06AC024-1230-4B65-91B9-B30DDE077171.png";

/**
 * Unified page-transition loader — the Dar Al Uloom logo only.
 * No spinner, no circular progress, no rotation.
 * Appears after a short delay so fast pages never flicker.
 */
export default function PageLogoLoader({ overlay = false, size = 104, delay = 120 }) {
  const [show, setShow] = useState(delay === 0);

  useEffect(() => {
    if (delay === 0) return;
    const t = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div
      className={
        overlay
          ? "fixed inset-0 z-[9998] flex items-center justify-center bg-background safe-area-top safe-area-bottom"
          : "flex items-center justify-center min-h-[60vh] w-full bg-background"
      }
      aria-busy="true"
      aria-live="polite"
    >
      <img
        src={LOGO_URL}
        alt="دار العلوم"
        draggable="false"
        style={{ width: size, height: size, opacity: show ? undefined : 0 }}
        className={`object-contain select-none ${show ? "dau-page-logo" : ""}`}
      />
      <style>{`
        .dau-page-logo {
          animation:
            dauLogoIn 420ms cubic-bezier(0.16, 1, 0.3, 1) both,
            dauLogoBreathe 2.4s 420ms ease-in-out infinite;
          filter: drop-shadow(0 12px 26px rgba(15, 23, 42, 0.10));
        }
        @keyframes dauLogoIn {
          from { opacity: 0; transform: scale(0.94); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes dauLogoBreathe {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.78; transform: scale(0.975); }
        }
        @media (prefers-reduced-motion: reduce) {
          .dau-page-logo {
            animation: dauLogoIn 200ms linear both;
          }
        }
      `}</style>
    </div>
  );
}