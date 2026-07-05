import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  ChevronLeft, ChevronRight, Menu, Loader2, ZoomIn, ZoomOut,
  Moon, Sun, List, Search, Bookmark, Maximize2, X
} from "lucide-react";
import { loadPdfDocument, extractPageText } from "@/lib/pdfLoader";

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 4;
const ZOOM_STEP = 0.25;

/**
 * ProBookViewer — simple self-contained PDF reader.
 * Canvas rendering preserves exact PDF layout.
 */
export default function ProBookViewer({ pdfUrl, title, bookId, language = "ar" }) {
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
  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [rendering, setRendering] = useState(true);
  const [pageError, setPageError] = useState(false);
  const pinchRef = useRef({ dist: 0, zoom: 1 });

  // ═══════════════════════════════════════════════════════
  //  Document loading
  // ═══════════════════════════════════════════════════════
  useEffect(() => {
    if (!pdfUrl) return;
    let cancelled = false;
    setLoading(true);
    setError("");

    loadPdfDocument(pdfUrl, { bookId, title }).then(async (doc) => {
      if (cancelled) return;
      setPdf(doc);
      setTotalPages(doc.numPages);

      const saved = Number(localStorage.getItem(`lastpage_${title}`));
      if (saved && saved > 0 && saved <= doc.numPages) setCurrentPage(saved);

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
  //  Track container size
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
  //  Page rendering — directly on canvas
  // ═══════════════════════════════════════════════════════
  useEffect(() => {
    if (!pdf || !currentPage) return;
    let cancelled = false;
    setRendering(true);
    setPageError(false);

    const render = async () => {
      try {
        if (renderTaskRef.current) {
          try { renderTaskRef.current.cancel(); } catch (e) {}
        }

        const page = await pdf.getPage(currentPage);
        if (cancelled) return;

        const baseVp = page.getViewport({ scale: 1 });

        let fitScale = 1.2;
        if (containerSize.width > 0 && containerSize.height > 0) {
          fitScale = Math.min(
            containerSize.width / baseVp.width,
            containerSize.height / baseVp.height
          ) * 0.95;
        }

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const renderScale = fitScale * zoom * dpr;
        const cssScale = fitScale * zoom;

        const viewport = page.getViewport({ scale: renderScale });
        const cssViewport = page.getViewport({ scale: cssScale });

        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;

        const ctx = canvas.getContext("2d", { alpha: false });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${cssViewport.width}px`;
        canvas.style.height = `${cssViewport.height}px`;

        const task = page.render({ canvasContext: ctx, viewport });
        renderTaskRef.current = task;
        await task.promise;

        if (!cancelled) setRendering(false);
      } catch (e) {
        if (e?.name !== "RenderingCancelledException" && !cancelled) {
          setPageError(true);
          setRendering(false);
        }
      }
    };

    const timer = setTimeout(render, 30);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (renderTaskRef.current) {
        try { renderTaskRef.current.cancel(); } catch (e) {}
      }
    };
  }, [pdf, currentPage, zoom, containerSize.width, containerSize.height]);

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
        const text = (await extractPageText(pdf, i)).toLowerCase();
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
  //  Drag-to-flip
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
  const loadingH = containerSize.height > 0 ? containerSize.height * 0.85 : 500;

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
      {/* ── Page area ── */}
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
              <div
                className="relative flex items-center justify-center bg-white shadow-2xl"
                style={{ minHeight: loadingH }}
              >
                <canvas
                  ref={canvasRef}
                  className="block bg-white"
                  style={{ filter: darkFilter }}
                />
                {rendering && !pageError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/80">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <span className="text-xs text-muted-foreground">صفحة {currentPage}</span>
                  </div>
                )}
                {pageError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                    <span className="text-sm text-destructive">فشل عرض الصفحة {currentPage}</span>
                  </div>
                )}
              </div>
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

      {/* ── TOC Panel ── */}
      <AnimatePresence>
        {showToc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`absolute top-0 ${isRTL ? "left-0" : "right-0"} bottom-0 w-72 max-w-[80%] bg-card border-l border-border z-30 flex flex-col`}
          >
            <div className="flex items-center justify-between p-3 border-b border-border">
              <h3 className="text-sm font-bold">الفهرس</h3>
              <button onClick={() => setShowToc(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {outline.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">لا يوجد فهرس</p>
              ) : (
                outline.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => { if (item.pageNumber) { navigateToPage(item.pageNumber); setShowToc(false); } }}
                    className="w-full text-right px-3 py-2 text-sm hover:bg-muted rounded-lg transition-colors truncate"
                  >
                    {item.title}
                    {item.pageNumber && <span className="text-xs text-muted-foreground mr-2">— {item.pageNumber}</span>}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Search Panel ── */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`absolute top-0 ${isRTL ? "left-0" : "right-0"} bottom-0 w-72 max-w-[80%] bg-card border-l border-border z-30 flex flex-col`}
          >
            <div className="flex items-center justify-between p-3 border-b border-border">
              <h3 className="text-sm font-bold">بحث</h3>
              <button onClick={() => setShowSearch(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 border-b border-border flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="ابحث..."
                className="flex-1 px-3 py-1.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                autoFocus
              />
              <button onClick={handleSearch} disabled={searching} className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg disabled:opacity-50">
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : "بحث"}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {searchResults.length > 0 && (
                <>
                  <div className="flex items-center justify-between px-2 py-1">
                    <span className="text-xs text-muted-foreground">{searchResults.length} نتيجة</span>
                    <button onClick={nextSearchResult} className="text-xs text-primary font-medium">التالي</button>
                  </div>
                  {searchResults.map((pg, i) => (
                    <button
                      key={i}
                      onClick={() => navigateToPage(pg)}
                      className={`w-full text-right px-3 py-2 text-sm hover:bg-muted rounded-lg transition-colors ${i === searchIdx ? "bg-primary/10 font-bold" : ""}`}
                    >
                      صفحة {pg}
                    </button>
                  ))}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Go to page ── */}
      <AnimatePresence>
        {showGoTo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 z-30 flex items-center justify-center"
            onClick={() => setShowGoTo(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-card border border-border rounded-2xl p-4 w-64"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-sm font-bold mb-3">الذهاب لصفحة</h3>
              <input
                type="number"
                value={goToValue}
                onChange={(e) => setGoToValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGoTo()}
                placeholder={`1 - ${totalPages}`}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-ring mb-3"
                autoFocus
              />
              <button onClick={handleGoTo} className="w-full py-2 text-sm bg-primary text-primary-foreground rounded-lg font-medium">
                ذهاب
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Toolbar ── */}
      {showToolbar && (
        <div className="bg-card border-t border-border px-3 py-2 flex items-center justify-center gap-1 flex-wrap shrink-0">
          <button onClick={goPrev} disabled={currentPage <= 1} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted disabled:opacity-30 transition-colors" title="السابق">
            <ChevronRight className="w-4 h-4" />
          </button>
          <button onClick={goNext} disabled={currentPage >= totalPages} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted disabled:opacity-30 transition-colors" title="التالي">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="w-px h-5 bg-border mx-1" />
          <button onClick={() => setZoom(z => Math.max(ZOOM_MIN, z - ZOOM_STEP))} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors" title="تصغير">
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(ZOOM_MAX, z + ZOOM_STEP))} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors" title="تكبير">
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="w-px h-5 bg-border mx-1" />
          <button onClick={() => setDarkMode(d => !d)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors" title={darkMode ? "الوضع الفاتح" : "الوضع الليلي"}>
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button onClick={toggleBookmark} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors" title="علامة">
            <Bookmark className={`w-4 h-4 ${bookmarks.includes(currentPage) ? "fill-primary text-primary" : ""}`} />
          </button>
          {outline.length > 0 && (
            <button onClick={() => setShowToc(true)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors" title="الفهرس">
              <List className="w-4 h-4" />
            </button>
          )}
          <button onClick={() => setShowSearch(s => !s)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors" title="بحث">
            <Search className="w-4 h-4" />
          </button>
          <button onClick={() => setShowGoTo(true)} className="px-2 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors text-xs font-mono font-bold" title="ذهاب لصفحة">
            {currentPage}/{totalPages}
          </button>
          <button onClick={toggleFullscreen} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors" title="ملء الشاشة">
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
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