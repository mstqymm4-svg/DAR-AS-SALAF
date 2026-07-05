import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft, ChevronRight, Bookmark, BookmarkCheck,
  ZoomIn, ZoomOut, Moon, Sun, List, X, Maximize, Minimize,
  BookOpen, Loader2, Search, Menu, ScrollText, Columns2,
  ChevronUp, ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { loadPdfDocument } from "@/lib/pdfLoader";

/**
 * UniversalPdfViewer — the ultimate PDF reader.
 *
 * Features:
 *  - Canvas rendering with text-layer overlay (selectable text, correct
 *    Arabic/Urdu shaping via the browser's HarfBuzz engine).
 *  - Continuous-scroll mode + single-page mode.
 *  - Pinch-to-zoom on touch devices.
 *  - Dark reading mode (CSS filter invert).
 *  - Bookmarks, TOC (outline), go-to-page, text search.
 *  - Keyboard navigation, swipe gestures, fullscreen.
 *  - Save / restore last reading position.
 */

const BASE_SCALE = 1.3;
const SCALE_MIN = 0.5;
const SCALE_MAX = 4;

export default function UniversalPdfViewer({ pdfUrl, title, language = "ar" }) {
  const isRTL = language === "ar" || language === "ur" || language === "fa";

  // ── State ──
  const [pdf, setPdf] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1);
  const [darkMode, setDarkMode] = useState(false);
  const [continuousMode, setContinuousMode] = useState(true);
  const [showToolbar, setShowToolbar] = useState(true);
  const [showToc, setShowToc] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showGoTo, setShowGoTo] = useState(false);
  const [goToPage, setGoToPage] = useState("");
  const [outline, setOutline] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchIdx, setSearchIdx] = useState(0);
  const [searching, setSearching] = useState(false);
  const [bookmarks, setBookmarks] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`bm_uni_${title}`) || "[]"); } catch(e) { return []; }
  });

  // ── Refs ──
  const containerRef = useRef(null);
  const scrollAreaRef = useRef(null);
  const pageRefs = useRef({});
  const pinchRef = useRef({ dist: 0, scale: 1 });
  const touchStartX = useRef(0);
  const renderTaskRef = useRef(null);

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

      const saved = Number(localStorage.getItem(`lastpage_uni_${title}`));
      if (saved && saved > 0 && saved <= doc.numPages) setCurrentPage(saved);

      try {
        const outlineData = await doc.getOutline();
        if (outlineData && !cancelled) {
          const resolved = await resolveOutline(doc, outlineData);
          if (!cancelled) setOutline(resolved);
        }
      } catch(e) {}
      setLoading(false);
    }).catch((e) => {
      if (!cancelled) { setError("فشل تحميل الملف: " + (e.message || "")); setLoading(false); }
    });

    return () => { cancelled = true; };
  }, [pdfUrl, title]);

  // Save last page
  useEffect(() => {
    if (totalPages > 0 && currentPage > 0) {
      localStorage.setItem(`lastpage_uni_${title}`, String(currentPage));
    }
  }, [currentPage, title, totalPages]);

  // ═══════════════════════════════════════════════════════
  //  Navigation
  // ═══════════════════════════════════════════════════════
  const goNext = useCallback(() => {
    setCurrentPage((p) => Math.min(p + 1, totalPages));
  }, [totalPages]);

  const goPrev = useCallback(() => {
    setCurrentPage((p) => Math.max(p - 1, 1));
  }, []);

  const navigateToPage = useCallback((num) => {
    if (num < 1 || num > totalPages) return;
    setCurrentPage(num);
    // Scroll to page in continuous mode
    if (continuousMode && pageRefs.current[num]) {
      pageRefs.current[num].scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [totalPages, continuousMode]);

  // Keyboard
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === "INPUT") return;
      if (e.key === "ArrowLeft") isRTL ? goNext() : goPrev();
      else if (e.key === "ArrowRight") isRTL ? goPrev() : goNext();
      else if (e.key === "Escape") { setShowToc(false); setShowSearch(false); setShowGoTo(false); }
      else if (e.key === "+" || e.key === "=") setScale(s => Math.min(SCALE_MAX, s + 0.25));
      else if (e.key === "-") setScale(s => Math.max(SCALE_MIN, s - 0.25));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev, isRTL]);

  // Track scroll position → current page (continuous mode)
  useEffect(() => {
    if (!continuousMode || !scrollAreaRef.current) return;
    const handler = () => {
      const area = scrollAreaRef.current;
      if (!area) return;
      const scrollTop = area.scrollTop;
      const viewportH = area.clientHeight;
      // Find page closest to top
      let best = currentPage;
      let bestDist = Infinity;
      for (let i = 1; i <= totalPages; i++) {
        const el = pageRefs.current[i];
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        const dist = Math.abs(rect.top - (area.getBoundingClientRect().top + 20));
        if (dist < bestDist) { bestDist = dist; best = i; }
      }
      if (best !== currentPage && best >= 1 && best <= totalPages) {
        setCurrentPage(best);
      }
    };
    const area = scrollAreaRef.current;
    area.addEventListener("scroll", handler, { passive: true });
    return () => area.removeEventListener("scroll", handler);
  }, [continuousMode, totalPages, currentPage]);

  // ═══════════════════════════════════════════════════════
  //  Pinch-to-zoom (touch)
  // ═══════════════════════════════════════════════════════
  const onTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchRef.current.dist = Math.hypot(dx, dy);
      pinchRef.current.scale = scale;
    } else if (e.touches.length === 1) {
      touchStartX.current = e.touches[0].clientX;
    }
  }, [scale]);

  const onTouchMove = useCallback((e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const ratio = dist / pinchRef.current.dist;
      const newScale = Math.max(SCALE_MIN, Math.min(SCALE_MAX, pinchRef.current.scale * ratio));
      setScale(newScale);
    }
  }, []);

  const onTouchEnd = useCallback((e) => {
    if (e.changedTouches.length === 1 && !continuousMode) {
      const diff = touchStartX.current - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 60) {
        if (diff > 0) isRTL ? goNext() : goPrev();
        else isRTL ? goPrev() : goNext();
      }
    }
  }, [isRTL, goNext, goPrev, continuousMode]);

  // ═══════════════════════════════════════════════════════
  //  Bookmarks
  // ═══════════════════════════════════════════════════════
  const toggleBookmark = useCallback(() => {
    setBookmarks(prev => {
      const next = prev.includes(currentPage)
        ? prev.filter(p => p !== currentPage)
        : [...prev, currentPage].sort((a, b) => a - b);
      localStorage.setItem(`bm_uni_${title}`, JSON.stringify(next));
      toast.success(prev.includes(currentPage) ? "أُزيلت العلامة" : "تم وضع علامة");
      return next;
    });
  }, [currentPage, title]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen?.();
    else document.exitFullscreen?.();
  }, []);

  // ═══════════════════════════════════════════════════════
  //  Go to page
  // ═══════════════════════════════════════════════════════
  const handleGoTo = useCallback(() => {
    const num = Number(goToPage);
    if (num >= 1 && num <= totalPages) {
      navigateToPage(num);
      setShowGoTo(false);
      setGoToPage("");
    } else {
      toast.error(`أدخل رقم صفحة بين 1 و ${totalPages}`);
    }
  }, [goToPage, totalPages, navigateToPage]);

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
      } catch(e) {}
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
  const pageIds = continuousMode ? Array.from({ length: totalPages }, (_, i) => i + 1) : [currentPage];

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full flex flex-col overflow-hidden ${darkMode ? "bg-gray-900" : "bg-gray-200 dark:bg-gray-900"}`}
      dir={isRTL ? "rtl" : "ltr"}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* ── Page Area ── */}
      <div
        ref={scrollAreaRef}
        className="flex-1 overflow-auto"
        style={{ scrollbarWidth: "thin" }}
      >
        <div className="flex flex-col items-center p-2 sm:p-4 gap-3">
          {pageIds.map((pageNum) => (
            <PdfPage
              key={pageNum}
              pdf={pdf}
              pageNumber={pageNum}
              scale={scale}
              darkFilter={darkFilter}
              refCallback={(el) => { pageRefs.current[pageNum] = el; }}
            />
          ))}
          <div className="h-2" />
        </div>
      </div>

      {/* ── Navigation arrows (single page mode) ── */}
      {!continuousMode && (
        <>
          <button
            onClick={() => isRTL ? goNext() : goPrev()}
            disabled={isRTL ? currentPage >= totalPages : currentPage <= 1}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-lg flex items-center justify-center hover:bg-white dark:hover:bg-gray-700 transition-colors disabled:opacity-30 z-10"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => isRTL ? goPrev() : goNext()}
            disabled={isRTL ? currentPage <= 1 : currentPage >= totalPages}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-lg flex items-center justify-center hover:bg-white dark:hover:bg-gray-700 transition-colors disabled:opacity-30 z-10"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* ── Top floating: page indicator ── */}
      <AnimatePresence>
        {showToolbar && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-2 left-1/2 -translate-x-1/2 bg-card/95 backdrop-blur-sm border border-border rounded-full shadow-lg px-4 py-1.5 z-20 flex items-center gap-3"
          >
            <button onClick={goPrev} disabled={currentPage <= 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30">
              <ChevronUp className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-bold text-foreground">
              {currentPage}<span className="text-muted-foreground"> / {totalPages}</span>
            </span>
            <button onClick={goNext} disabled={currentPage >= totalPages} className="text-muted-foreground hover:text-foreground disabled:opacity-30">
              <ChevronDown className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TOC panel ── */}
      <AnimatePresence>
        {showToc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex justify-end bg-black/50"
            onClick={() => setShowToc(false)}
          >
            <motion.div
              initial={{ x: isRTL ? -100 : 100 }}
              animate={{ x: 0 }}
              exit={{ x: isRTL ? -100 : 100 }}
              className={`w-80 max-w-[85%] h-full ${darkMode ? "bg-gray-800" : "bg-card"} border-l border-border overflow-y-auto`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-3 border-b border-border flex items-center justify-between">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <BookOpen className="w-4 h-4" /> الفهرس
                </h3>
                <button onClick={() => setShowToc(false)} className="p-1 rounded hover:bg-muted">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-2">
                {outline.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">لا يوجد فهرس</p>
                ) : (
                  <OutlineTree items={outline} onPageClick={(p) => { navigateToPage(p); setShowToc(false); }} darkMode={darkMode} />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Search panel ── */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-12 left-1/2 -translate-x-1/2 w-80 max-w-[90%] bg-card border border-border rounded-2xl shadow-xl p-3 z-30"
          >
            <div className="flex items-center gap-2">
              <Input
                type="text"
                autoFocus
                placeholder="ابحث في الكتاب..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1 text-sm"
              />
              <Button size="icon" onClick={handleSearch} disabled={searching} className="shrink-0">
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>
            {searchResults.length > 0 && (
              <div className="flex items-center justify-between mt-2 text-xs">
                <span className="text-muted-foreground">
                  {searchIdx + 1} / {searchResults.length}
                </span>
                <button onClick={nextSearchResult} className="text-primary font-medium hover:underline">
                  التالي ←
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Go to page modal ── */}
      <AnimatePresence>
        {showGoTo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex items-center justify-center bg-black/50"
            onClick={() => setShowGoTo(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-card border border-border rounded-2xl p-4 flex items-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <Input
                type="number"
                autoFocus
                min="1"
                max={totalPages}
                placeholder="رقم الصفحة"
                value={goToPage}
                onChange={(e) => setGoToPage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGoTo()}
                className="w-32 text-center"
              />
              <Button size="sm" onClick={handleGoTo}>انتقال</Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Bottom toolbar ── */}
      <AnimatePresence>
        {showToolbar && (
          <motion.div
            initial={{ y: 80 }}
            animate={{ y: 0 }}
            exit={{ y: 80 }}
            className={`shrink-0 border-t ${darkMode ? "border-gray-700 bg-gray-800" : "border-border bg-card"}`}
          >
            <div className="flex items-center justify-center px-2 py-1.5 gap-0.5 sm:gap-1 overflow-x-auto scrollbar-hide">
              <ToolBtn onClick={() => setScale(s => Math.max(SCALE_MIN, s - 0.25))} dark={darkMode} title="تصغير">
                <ZoomOut className="w-4 h-4" />
              </ToolBtn>
              <span className={`text-xs font-mono w-12 text-center ${darkMode ? "text-gray-300" : "text-foreground"}`}>
                {Math.round(scale * 100)}%
              </span>
              <ToolBtn onClick={() => setScale(s => Math.min(SCALE_MAX, s + 0.25))} dark={darkMode} title="تكبير">
                <ZoomIn className="w-4 h-4" />
              </ToolBtn>

              <Divider dark={darkMode} />

              <ToolBtn onClick={() => setContinuousMode(c => !c)} dark={darkMode} title={continuousMode ? "وضع صفحة واحدة" : "تمرير مستمر"} active={continuousMode}>
                {continuousMode ? <ScrollText className="w-4 h-4" /> : <Columns2 className="w-4 h-4" />}
              </ToolBtn>

              {outline.length > 0 && (
                <ToolBtn onClick={() => setShowToc(true)} dark={darkMode} title="الفهرس">
                  <BookOpen className="w-4 h-4" />
                </ToolBtn>
              )}

              <ToolBtn onClick={() => setShowSearch(s => !s)} dark={darkMode} title="بحث" active={showSearch}>
                <Search className="w-4 h-4" />
              </ToolBtn>

              <ToolBtn onClick={toggleBookmark} dark={darkMode} title="علامة مرجعية" active={bookmarks.includes(currentPage)}>
                {bookmarks.includes(currentPage) ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              </ToolBtn>

              <ToolBtn onClick={() => setShowGoTo(true)} dark={darkMode} title="انتقال لصفحة">
                <List className="w-4 h-4" />
              </ToolBtn>

              <ToolBtn onClick={() => setDarkMode(d => !d)} dark={darkMode} title={darkMode ? "وضع نهاري" : "وضع ليلي"}>
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </ToolBtn>

              <ToolBtn onClick={toggleFullscreen} dark={darkMode} title="ملء الشاشة">
                <Maximize className="w-4 h-4" />
              </ToolBtn>
            </div>

            {/* Progress bar */}
            <div className={`h-1 ${darkMode ? "bg-gray-700" : "bg-muted"}`}>
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${totalPages ? (currentPage / totalPages) * 100 : 0}%` }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle toolbar button */}
      <button
        onClick={() => setShowToolbar(s => !s)}
        className={`absolute bottom-16 left-1/2 -translate-x-1/2 w-9 h-9 rounded-full ${darkMode ? "bg-gray-700 text-gray-300" : "bg-card border border-border text-muted-foreground"} shadow-lg flex items-center justify-center z-20 transition-opacity ${showToolbar ? "opacity-0 hover:opacity-100" : "opacity-100"}`}
      >
        {showToolbar ? <ChevronDown className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  Single page renderer (canvas + text layer)
// ═══════════════════════════════════════════════════════
const PdfPage = ({ pdf, pageNumber, scale, darkFilter, refCallback }) => {
  const canvasRef = useRef(null);
  const textLayerRef = useRef(null);
  const renderTaskRef = useRef(null);
  const [rendering, setRendering] = useState(true);

  useEffect(() => {
    if (!pdf || !canvasRef.current) return;
    let cancelled = false;
    setRendering(true);

    const render = async () => {
      try {
        if (renderTaskRef.current) { try { renderTaskRef.current.cancel(); } catch(e) {} }

        const page = await pdf.getPage(pageNumber);
        if (cancelled) return;

        const dpr = window.devicePixelRatio || 1;
        const renderScale = BASE_SCALE * scale * dpr;
        const viewport = page.getViewport({ scale: renderScale });
        const cssViewport = page.getViewport({ scale: BASE_SCALE * scale });

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
        if (cancelled) return;

        // Text layer for selectable text + correct letter shaping
        if (textLayerRef.current) {
          textLayerRef.current.innerHTML = "";
          textLayerRef.current.style.width = `${cssViewport.width}px`;
          textLayerRef.current.style.height = `${cssViewport.height}px`;
          try {
            const textContent = await page.getTextContent();
            if (cancelled) return;
            const { TextLayer } = await import("pdfjs-dist");
            const tl = new TextLayer({
              textContentSource: textContent,
              container: textLayerRef.current,
              viewport: cssViewport,
            });
            await tl.render();
          } catch(e) {}
        }

        if (!cancelled) setRendering(false);
      } catch(e) {
        if (e?.name !== "RenderingCancelledException" && !cancelled) {
          setRendering(false);
        }
      }
    };

    // Debounce render slightly for rapid scroll
    const timer = setTimeout(render, 50);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (renderTaskRef.current) { try { renderTaskRef.current.cancel(); } catch(e) {} }
    };
  }, [pdf, pageNumber, scale]);

  return (
    <div ref={refCallback} className="relative shadow-xl bg-white" style={{ filter: darkFilter }}>
      <canvas ref={canvasRef} className="block bg-white" style={{ maxWidth: "100%", height: "auto" }} />
      <div
        ref={textLayerRef}
        className="absolute inset-0 overflow-hidden text-layer-container"
        style={{ opacity: 1, mixBlendMode: "multiply", lineHeight: 1 }}
      />
      {rendering && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/60">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════
//  Small UI helpers
// ═══════════════════════════════════════════════════════
function ToolBtn({ children, onClick, dark, title, active }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
        active
          ? "bg-primary/15 text-primary"
          : dark ? "hover:bg-gray-700 text-gray-300" : "hover:bg-muted text-muted-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function Divider({ dark }) {
  return <div className={`w-px h-6 mx-0.5 ${dark ? "bg-gray-600" : "bg-border"}`} />;
}

// ─── Outline resolver + tree ─────────────────────────────────────────────────
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
    } catch(e) {}
    result.push({
      title: item.title,
      pageNumber,
      items: item.items?.length ? await resolveOutline(pdf, item.items) : [],
    });
  }
  return result;
}

function OutlineTree({ items, onPageClick, darkMode, depth = 0 }) {
  return (
    <div className="space-y-0.5">
      {items.map((item, i) => (
        <div key={i}>
          <button
            onClick={() => item.pageNumber && onPageClick(item.pageNumber)}
            disabled={!item.pageNumber}
            className={`w-full text-right px-2 py-1.5 rounded-lg text-xs transition-colors ${
              item.pageNumber
                ? darkMode ? "hover:bg-gray-700 text-gray-300" : "hover:bg-muted text-foreground"
                : "text-muted-foreground/50 cursor-default"
            }`}
            style={{ paddingRight: `${depth * 12 + 8}px` }}
          >
            {item.title}
            {item.pageNumber && <span className="text-muted-foreground mr-2">({item.pageNumber})</span>}
          </button>
          {item.items?.length > 0 && (
            <OutlineTree items={item.items} onPageClick={onPageClick} darkMode={darkMode} depth={depth + 1} />
          )}
        </div>
      ))}
    </div>
  );
}