import { useState, useEffect, useRef, useCallback } from "react";
import PdfPageRenderer from "./PdfPageRenderer";

/**
 * Vertical continuous page stream — stacks all PDF pages vertically.
 * - Lazy-renders only pages near the current viewport (RENDER_BUFFER)
 * - Pre-measures aspect ratios ahead (PREFETCH) to reserve stable slot heights
 * - IntersectionObserver tracks the most-visible page → onCurrentPageChange
 * - Exposes scrollToPage(n) via scrollToPageRef for prev/next / go-to jumps
 * Reading direction is always LTR (English style): scroll down to advance.
 */
const DEFAULT_RATIO = 0.707; // A4 portrait fallback
const RENDER_BUFFER = 2; // render currentPage ± 2
const PREFETCH = 5; // measure aspect ratios within ±5

export default function VerticalPageStream({
  pdf,
  totalPages,
  currentPage,
  zoom,
  darkMode,
  onCurrentPageChange,
  scrollToPageRef,
}) {
  const scrollRef = useRef(null);
  const [aspect, setAspect] = useState({});
  const [width, setWidth] = useState(0);
  const aspectCache = useRef({});
  const pendingAspect = useRef(new Set());
  const ratios = useRef({});

  // ── Expose scrollToPage to parent ──
  useEffect(() => {
    scrollToPageRef.current = (n) => {
      const node = scrollRef.current?.querySelector(`[data-page="${n}"]`);
      node?.scrollIntoView({ behavior: "smooth", block: "start" });
    };
  }, [scrollToPageRef]);

  // ── Measure container width ──
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => setWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Track most-visible page ──
  useEffect(() => {
    const root = scrollRef.current;
    if (!root || !totalPages) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          ratios.current[e.target.dataset.page] = e.intersectionRatio;
        }
        let best = null, bestRatio = 0;
        for (const [pg, r] of Object.entries(ratios.current)) {
          if (r > bestRatio) { bestRatio = r; best = Number(pg); }
        }
        if (best != null && bestRatio > 0.3) onCurrentPageChange(best);
      },
      { root, threshold: [0.3, 0.5, 0.75] }
    );
    const nodes = root.querySelectorAll("[data-page]");
    nodes.forEach((n) => obs.observe(n));
    return () => obs.disconnect();
  }, [totalPages, onCurrentPageChange]);

  // ── Pre-measure aspect ratios near the current page ──
  useEffect(() => {
    if (!pdf || !totalPages) return;
    const lo = Math.max(1, currentPage - PREFETCH);
    const hi = Math.min(totalPages, currentPage + PREFETCH);
    for (let i = lo; i <= hi; i++) {
      if (aspectCache.current[i] || pendingAspect.current.has(i)) continue;
      pendingAspect.current.add(i);
      pdf.getPage(i)
        .then((page) => {
          const vp = page.getViewport({ scale: 1 });
          const r = vp.width / vp.height;
          aspectCache.current[i] = r;
          setAspect((a) => ({ ...a, [i]: r }));
        })
        .catch(() => {})
        .finally(() => pendingAspect.current.delete(i));
    }
  }, [pdf, currentPage, totalPages]);

  const slotWidth = width > 0 ? width - 16 : 0;
  const darkFilter = darkMode ? "invert(0.92) hue-rotate(180deg)" : "none";

  return (
    <div ref={scrollRef} className="flex-1 overflow-auto bg-muted/30" onContextMenu={(e) => e.preventDefault()}>
      <div dir="ltr" className="flex flex-col items-center gap-3 py-3 px-2">
        {Array.from({ length: totalPages }, (_, idx) => {
          const p = idx + 1;
          const r = aspect[p] || DEFAULT_RATIO;
          const h = slotWidth > 0 ? (slotWidth * zoom) / r : 400;
          const shouldRender = Math.abs(p - currentPage) <= RENDER_BUFFER;
          return (
            <div
              key={p}
              data-page={p}
              className="bg-white shadow-lg shrink-0"
              style={{
                width: slotWidth > 0 ? slotWidth * zoom : "100%",
                height: h,
                filter: darkFilter,
              }}
            >
              {shouldRender && pdf ? (
                <PdfPageRenderer
                  pdf={pdf}
                  pageNumber={p}
                  zoom={zoom}
                  containerWidth={slotWidth}
                  containerHeight={h}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 select-none">
                  {p}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}