import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Menu, Loader2 } from "lucide-react";
import { loadPdfDocument } from "@/lib/pdfLoader";
import PdfPageRenderer from "./PdfPageRenderer";
import ViewerToolbar from "./ViewerToolbar";
import { TocPanel, SearchPanel, GoToPanel } from "./ViewerPanels";

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 4;
const ZOOM_STEP = 0.25;

/**
 * ProBookViewer — professional PDF reader with book-like page flipping.
 *
 * Features:
 *  - Canvas rendering: preserves exact PDF layout (embedded fonts, images, tables)
 *  - Page-flip by drag/swipe with smooth spring animation
 *  - Pre-calculated fit scale for perfect screen fitting
 *  - High DPR rendering for crisp text
 *  - Next/prev, go-to-page, page indicator
 *  - TOC (outline), full-text search, bookmarks
 *  - Dark/light reading mode, zoom, fullscreen
 *  - Save/restore last reading position
 *  - RTL support (Arabic/Urdu) and LTR (English)
 *  - Memory-efficient: only one page rendered at a time
 */
export default function ProBookViewer({ pdfUrl, title, language = "ar" }) {
  const isRTL = language === "ar" || language === "ur" || language === "fa";

  // ── Document state ──
  const [pdf, setPdf] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  // ── UI state ──
  const [zoom, setZoom] = useState(1);
  const [darkMode, setDarkMode] = useState(false);
  const [showToolbar, setShowToolbar] = useState(true);
  const [showToc, setShowToc] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showGoTo, setShowGoTo] = useState(false);
  const [goToValue, setGoToValue] = useState("");
  const [outline, setOutline] = useState([]);
  const [direction, setDirection] = useState(0);

  // ── Search state ──
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchIdx, setSearchIdx] = useState(0);
  const [searching, setSearching] = useState(false);

  // ── Bookmarks ──
  const [bookmarks, setBookmarks] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`bm_${title}`) || "[]"); } catch (e) { return []; }
  });

  // ── Refs ──
  const containerRef = useRef(null);
  const pageAreaRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const pinchRef = useRef({ dist: 0, zoom: 1 });

  // ═══════════════════════════════════════════════════════
  //  Document loading
  // ═══════════════════════════════════════════════════════
  useEffect(() => {
    if (!pdfUrl) return;
    let cancelled = false;
    setLoading(true);
    setError("");

    loadPdfDocument(pdfUrl).then(async (doc) => {
      if (cancelled) return;
      setPdf(doc);
      setTotalPages(doc.numPages);

      // Restore last reading position
      const saved = Number(localStorage.getItem(`lastpage_${title}`));
      if (saved && saved > 0 && saved <= doc.numPages) setCurrentPage(saved);

      // Load outline (TOC)
      try {
        const outlineData = await doc.getOutline();
        if (outlineData && !cancelled) {
          const resolved = await resolveOutline(doc, outlineData);
          if (!cancelled) setOutline(resolved);
        }
      } catch (e) {}

      if (!cancelled) setLoading(false);
    }).catch((e) => {
      if (!cancelled) {
        setError("فشل تحميل الكتاب: " + (e.message || ""));
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [pdfUrl, title]);

  // Save last page
  useEffect(() => {
    if (totalPages > 0 && currentPage > 0) {
      localStorage.setItem(`lastpage_${title}`, String(currentPage));
    }
  }, [currentPage, title, totalPages]);

  // ═══════════════════════════════════════════════════════
  //  Track container size for page fitting
  // ═══════════════════════════════════════════════════════
  useEffect(() => {
    if (!pageAreaRef.current) return;
    const update = () => {
      if (pageAreaRef.current) {
        setContainerSize({
          width: pageAreaRef.current.clientWidth,
          height: pageAreaRef.current.clientHeight,
        });
      }
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(pageAreaRef.current);
    return () => observer.disconnect();
  }, []);

  // ═══════════════════════════════════════════════════════
  //  Navigation
  // ═══════════════════════════════════════════════════════
  const goNext = useCallback(() => {
    setDirection(isRTL ? -1 : 1);
    setCurrentPage((p) => Math.min(p + 1, totalPages));
  }, [totalPages, isRTL]);

  const goPrev = useCallback(() => {
    setDirection(isRTL ? 1 : -1);
    setCurrentPage((p) => Math.max(p - 1, 1));
  }, [isRTL]);

  const navigateToPage = useCallback((num) => {
    if (num < 1 || num > totalPages) return;
    setDirection(num > currentPage ? 1 : -1);
    setCurrentPage(num);
  }, [totalPages, currentPage]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === "INPUT") return;
      if (e.key === "ArrowLeft") isRTL ? goNext() : goPrev();
      else if (e.key === "ArrowRight") isRTL ? goPrev() : goNext();
      else if (e.key === "Escape") { setShowToc(false); setShowSearch(false); setShowGoTo(false); }
      else if (e.key === "+" || e.key === "=") setZoom(z => Math.min(ZOOM_MAX, z + ZOOM_STEP));
      else if (e.key === "-") setZoom(z => Math.max(ZOOM_MIN, z - ZOOM_STEP));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev, isRTL]);

  // ═══════════════════════════════════════════════════════
  //  Pinch-to-zoom (touch)
  // ═══════════════════════════════════════════════════════
  const onTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchRef.current.dist = Math.hypot(dx, dy);
      pinchRef.current.zoom = zoom;
    }
  }, [zoom]);

  const onTouchMove = useCallback((e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      if (pinchRef.current.dist > 0) {
        const ratio = dist / pinchRef.current.dist;
        setZoom(Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, pinchRef.current.zoom * ratio)));
      }
    }
  }, []);

  // ═══════════════════════════════════════════════════════
  //  Bookmarks
  // ═══════════════════════════════════════════════════════
  const toggleBookmark = useCallback(() => {
    setBookmarks(prev => {
      const next = prev.includes(currentPage)
        ? prev.filter(p => p !== currentPage)
        : [...prev, currentPage].sort((a, b) => a - b);
      localStorage.setItem(`bm_${title}`, JSON.stringify(next));
      toast.success(prev.includes(currentPage) ? "أُزيلت العلامة" : "تم وضع علامة");
      return next;
    });
  }, [currentPage, title]);

  // ═══════════════════════════════════════════════════════
  //  Fullscreen
  // ═══════════════════════════════════════════════════════
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen?.();
    else document.exitFullscreen?.();
  }, []);

  // ═══════════════════════════════════════════════════════
  //  Go to page
  // ═══════════════════════════════════════════════════════
  const handleGoTo = useCallback(() => {
    const num = Number(goToValue);
    if (num >= 1 && num <= totalPages) {
      navigateToPage(num);
      setShowGoTo(false);
      setGoToValue("");
    } else {
      toast.error(`أدخل رقم صفحة بين 1 و ${totalPages}`);
    }
  }, [goToValue, totalPages, navigateToPage]);

  // ═══════════════════════════════════════════════════════
  //  Text search
  // ═══════════════════════════════════════════════════════
  const handleSearch = useCallback(async () => {
    if (!pdf || !searchQuery.trim()) return;
    setSearching(true);
    setSearchResults([]);
    const q = searchQuery.toLowerCase();
    const results = [];
    for (let i = 1; i <= totalPages; i++) {
      try {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const text = content.items.map(it => it.str).join(" ").toLowerCase();
        if (text.includes(q)) results.push(i);
      } catch (e) {}
    }
    setSearchResults(results);
    setSearchIdx(0);
    setSearching(false);
    if (results.length > 0) {
      navigateToPage(results[0]);
      toast.success(`وُجدت في ${results.length} صفحة`);
    } else {
      toast.error("لا توجد نتائج");
    }
  }, [pdf, searchQuery, totalPages, navigateToPage]);

  const nextSearchResult = useCallback(() => {
    if (searchResults.length === 0) return;
    const idx = (searchIdx + 1) % searchResults.length;
    setSearchIdx(idx);
    navigateToPage(searchResults[idx]);
  }, [searchResults, searchIdx, navigateToPage]);

  // ═══════════════════════════════════════════════════════
  //  Drag-to-flip handler
  // ═══════════════════════════════════════════════════════
  const handleDragEnd = useCallback((e, info) => {
    const threshold = (containerSize.width || 300) * 0.2;
    if (isRTL) {
      if (info.offset.x > threshold) goNext();
      else if (info.offset.x < -threshold) goPrev();
    } else {
      if (info.offset.x < -threshold) goNext();
      else if (info.offset.x > threshold) goPrev();
    }
  }, [containerSize.width, isRTL, goNext, goPrev]);

  // ═══════════════════════════════════════════════════════
  //  Render
  // ═══════════════════════════════════════════════════════
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 bg-gray-100 dark:bg-gray-900">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">جاري تحميل الكتاب...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full p-8 bg-gray-100 dark:bg-gray-900">
        <p className="text-destructive text-sm">{error}</p>
      </div>
    );
  }

  const darkFilter = darkMode ? "invert(0.88) hue-rotate(180deg) brightness(0.95)" : "none";
  const canDrag = zoom <= 1;

  // Page flip animation variants
  const pageVariants = {
    enter: (dir) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? "-30%" : "30%", opacity: 0 }),
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full flex flex-col overflow-hidden ${darkMode ? "bg-gray-900" : "bg-gray-200 dark:bg-gray-900"}`}
      dir={isRTL ? "rtl" : "ltr"}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
    >
      {/* ── Page flip area ── */}
      <div
        ref={pageAreaRef}
        className="flex-1 relative"
        style={{
          overflow: zoom > 1 ? "auto" : "hidden",
          touchAction: zoom > 1 ? "auto" : "none",
        }}
      >
        <div className={canDrag ? "min-h-full h-full flex items-center justify-center" : "min-h-full"}>
          <AnimatePresence mode="popLayout" custom={direction}>
            <motion.div
              key={currentPage}
              custom={direction}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 350, damping: 38 },
                opacity: { duration: 0.25 },
              }}
              drag={canDrag ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.5}
              onDragEnd={handleDragEnd}
              className="cursor-grab active:cursor-grabbing"
              style={{ touchAction: canDrag ? "none" : "auto" }}
            >
              <PdfPageRenderer
                pdf={pdf}
                pageNumber={currentPage}
                zoom={zoom}
                darkFilter={darkFilter}
                containerWidth={containerSize.width}
                containerHeight={containerSize.height}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Page indicator ── */}
        {showToolbar && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-2 left-1/2 -translate-x-1/2 bg-card/95 backdrop-blur-sm border border-border rounded-full shadow-lg px-4 py-1.5 z-20 flex items-center gap-3"
          >
            <button onClick={goPrev} disabled={currentPage <= 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30">
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-bold text-foreground">
              {currentPage}<span className="text-muted-foreground"> / {totalPages}</span>
            </span>
            <button onClick={goNext} disabled={currentPage >= totalPages} className="text-muted-foreground hover:text-foreground disabled:opacity-30">
              <ChevronLeft className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </div>

      {/* ── Panels ── */}
      <TocPanel
        show={showToc}
        isRTL={isRTL}
        darkMode={darkMode}
        outline={outline}
        onClose={() => setShowToc(false)}
        onPageClick={navigateToPage}
      />
      <SearchPanel
        show={showSearch}
        query={searchQuery}
        setQuery={setSearchQuery}
        onSearch={handleSearch}
        searching={searching}
        results={searchResults}
        resultIdx={searchIdx}
        onNextResult={nextSearchResult}
        onClose={() => setShowSearch(false)}
      />
      <GoToPanel
        show={showGoTo}
        value={goToValue}
        setValue={setGoToValue}
        totalPages={totalPages}
        onGo={handleGoTo}
        onClose={() => setShowGoTo(false)}
      />

      {/* ── Toolbar ── */}
      {showToolbar && (
        <ViewerToolbar
          currentPage={currentPage}
          totalPages={totalPages}
          zoom={zoom}
          darkMode={darkMode}
          bookmarks={bookmarks}
          hasOutline={outline.length > 0}
          onNext={goNext}
          onPrev={goPrev}
          onZoomIn={() => setZoom(z => Math.min(ZOOM_MAX, z + ZOOM_STEP))}
          onZoomOut={() => setZoom(z => Math.max(ZOOM_MIN, z - ZOOM_STEP))}
          onToggleDark={() => setDarkMode(d => !d)}
          onToggleBookmark={toggleBookmark}
          onToggleToc={() => setShowToc(true)}
          onToggleSearch={() => setShowSearch(s => !s)}
          onToggleGoTo={() => setShowGoTo(true)}
          onToggleFullscreen={toggleFullscreen}
        />
      )}

      {/* Toggle toolbar */}
      <button
        onClick={() => setShowToolbar(s => !s)}
        className={`absolute bottom-16 left-1/2 -translate-x-1/2 w-9 h-9 rounded-full ${darkMode ? "bg-gray-700 text-gray-300" : "bg-card border border-border text-muted-foreground"} shadow-lg flex items-center justify-center z-20`}
      >
        <Menu className="w-4 h-4" />
      </button>
    </div>
  );
}

// Resolve PDF outline into page numbers
async function resolveOutline(pdf, items) {
  const result = [];
  for (const item of items) {
    let pageNumber = null;
    try {
      let dest = item.dest;
      if (typeof dest === "string") dest = await pdf.getDestination(dest);
      if (dest && dest[0]) {
        const pageIndex = await pdf.getPageIndex(dest[0]);
        pageNumber = pageIndex + 1;
      }
    } catch (e) {}
    result.push({
      title: item.title,
      pageNumber,
      items: item.items?.length ? await resolveOutline(pdf, item.items) : [],
    });
  }
  return result;
}