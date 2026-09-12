import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2, AlertCircle, ChevronUp } from "lucide-react";
import { loadPdfDocument, extractPageText, clearPageCache } from "@/lib/pdfLoader";
import { useT } from "@/lib/i18n";
import ViewerToolbar from "./ViewerToolbar";
import { TocPanel, SearchPanel, GoToPanel } from "./ViewerPanels";
import VerticalPageStream from "./VerticalPageStream";

const BM_PREFIX = "dau_bm_";

// Unified zoom limits for buttons & pinch
const clampZoom = (z) => Math.max(0.5, Math.min(3, +Number(z).toFixed(2)));

export default function ProBookViewer({ pdfUrl, title, bookId, language = "ar" }) {
  const t = useT();
  const [pdf, setPdf] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [theme, setTheme] = useState(() => {
    try {
      const v = localStorage.getItem("dau_reader_theme");
      return ["light", "dark", "sepia"].includes(v) ? v : "light";
    } catch { return "light"; }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [showToolbar, setShowToolbar] = useState(true);

  // Panels
  const [showToc, setShowToc] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showGoTo, setShowGoTo] = useState(false);
  const [outline, setOutline] = useState([]);

  // Search
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [resultIdx, setResultIdx] = useState(0);

  // Go-to input
  const [goToValue, setGoToValue] = useState("");
  const totalPagesRef = useRef(0);

  // Bookmarks (persisted per book)
  const [bookmarks, setBookmarks] = useState(() => {
    try { return JSON.parse(localStorage.getItem(BM_PREFIX + bookId) || "[]"); } catch { return []; }
  });

  const rootRef = useRef(null);
  const scrollToPageRef = useRef(null);
  const currentPageRef = useRef(1);
  const pinchRef = useRef({ dist: 0, zoom: 1, ratio: 1, last: 0 });
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const didRestoreRef = useRef(false);

  const isRTL = language === "ar" || language === "ur";

  // ── Load PDF document ──
  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(false); setPdf(null); setOutline([]); setCurrentPage(1);
    loadPdfDocument(pdfUrl, { bookId, title })
      .then(async (doc) => {
        if (cancelled) return;
        setPdf(doc);
        setTotalPages(doc.numPages);
        try {
          const out = await doc.getOutline();
          if (!cancelled) setOutline(await normalizeOutline(out, doc));
        } catch { if (!cancelled) setOutline([]); }
        if (!cancelled) setLoading(false);
      })
      .catch(() => { if (!cancelled) { setError(true); setLoading(false); } });
    return () => { cancelled = true; };
  }, [pdfUrl, bookId, title, reloadKey]);

  // ── Keep total pages & current page in refs for synchronous access ──
  useEffect(() => { totalPagesRef.current = totalPages; }, [totalPages]);
  useEffect(() => { currentPageRef.current = currentPage; }, [currentPage]);

  // ── Save & restore last read page ──
  useEffect(() => {
    if (pdf && totalPages > 0 && !didRestoreRef.current) {
      didRestoreRef.current = true;
      const saved = Number(localStorage.getItem(`lastpage_${bookId}`));
      if (saved && saved > 0 && saved <= totalPages) {
        setCurrentPage(saved);
        setTimeout(() => scrollToPageRef.current?.(saved), 120);
      }
    }
  }, [pdf, totalPages, bookId]);

  useEffect(() => {
    if (totalPages > 0 && currentPage > 0) {
      localStorage.setItem(`lastpage_${bookId}`, String(currentPage));
      localStorage.setItem(`lastts_${bookId}`, String(Date.now()));
    }
  }, [currentPage, totalPages, bookId]);

  // ── Persist bookmarks ──
  useEffect(() => {
    try { localStorage.setItem(BM_PREFIX + bookId, JSON.stringify(bookmarks)); } catch {}
  }, [bookmarks, bookId]);

  // ── Persist reading theme ──
  useEffect(() => {
    try { localStorage.setItem("dau_reader_theme", theme); } catch {}
  }, [theme]);

  // ── Navigation helpers ──
  const goToPage = useCallback((p) => {
    const tp = totalPagesRef.current || totalPages;
    const n = Math.max(1, Math.min(tp, Number(p) || 1));
    setCurrentPage(n);
    scrollToPageRef.current?.(n);
  }, [totalPages]);

  const nextPage = useCallback(() => goToPage((currentPageRef.current || 1) + 1), [goToPage]);
  const prevPage = useCallback(() => goToPage((currentPageRef.current || 1) - 1), [goToPage]);

  const onStreamPageChange = useCallback((n) => setCurrentPage(n), []);
  const zoomIn = useCallback(() => setZoom(z => clampZoom(z + 0.2)), []);
  const zoomOut = useCallback(() => setZoom(z => clampZoom(z - 0.2)), []);

  const toggleBookmark = useCallback(() => {
    setCurrentPage(cp => {
      setBookmarks(b => b.includes(cp) ? b.filter(x => x !== cp) : [...b, cp].sort((a, c) => a - c));
      return cp;
    });
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = rootRef.current;
    if (!document.fullscreenElement) (el || document.documentElement).requestFullscreen?.();
    else document.exitFullscreen?.();
  }, []);

  // ── Keyboard navigation ──
  useEffect(() => {
    const onKey = (e) => {
      if (showToc || showSearch || showGoTo) return;
      if (e.target?.tagName === "INPUT" || e.target?.tagName === "TEXTAREA") return;
      if (e.key === "ArrowDown" || e.key === "PageDown") nextPage();
      else if (e.key === "ArrowUp" || e.key === "PageUp") prevPage();
      else if (e.key === "ArrowRight") nextPage();
      else if (e.key === "ArrowLeft") prevPage();
      else if (e.key === "+" || e.key === "=") zoomIn();
      else if (e.key === "-") zoomOut();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [nextPage, prevPage, zoomIn, zoomOut, showToc, showSearch, showGoTo]);

  // ── Pinch-to-zoom (touch) ──
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const onStart = (e) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        pinchRef.current.dist = Math.hypot(dx, dy);
        pinchRef.current.zoom = zoomRef.current;
        pinchRef.current.ratio = 1;
        pinchRef.current.last = 0;
      }
    };
    const onMove = (e) => {
      if (e.touches.length === 2 && pinchRef.current.dist > 0) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const ratio = Math.hypot(dx, dy) / pinchRef.current.dist;
        pinchRef.current.ratio = ratio;
        // Throttle live updates to keep rendering smooth during the gesture
        const now = Date.now();
        if (now - pinchRef.current.last < 100) return;
        pinchRef.current.last = now;
        setZoom(clampZoom(pinchRef.current.zoom * ratio));
      }
    };
    const onEnd = () => {
      if (pinchRef.current.dist > 0 && pinchRef.current.ratio !== 1) {
        setZoom(clampZoom(pinchRef.current.zoom * pinchRef.current.ratio));
      }
      pinchRef.current.dist = 0;
    };
    el.addEventListener("touchstart", onStart, { passive: false });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd);
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
    };
  }, []);

  // ── Search across all pages ──
  const runSearch = useCallback(async () => {
    const q = query.trim();
    if (!q || !pdf) return;
    setSearching(true); setResults([]); setResultIdx(0);
    const lower = q.toLowerCase();
    const found = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      try {
        const text = (await extractPageText(pdf, i)).toLowerCase();
        if (text.includes(lower)) found.push(i);
      } catch {}
      if (i % 10 === 0) setResults([...found]);
    }
    setResults(found); setResultIdx(0); setSearching(false);
    if (found.length > 0) goToPage(found[0]);
  }, [query, pdf, goToPage]);

  const nextResult = useCallback(() => {
    if (results.length === 0) return;
    const ni = (resultIdx + 1) % results.length;
    setResultIdx(ni); goToPage(results[ni]);
  }, [results, resultIdx, goToPage]);

  const openGoTo = useCallback(() => {
    setGoToValue(String(currentPage));
    setShowGoTo(s => !s);
  }, [currentPage]);

  // ── Cleanup caches on unmount ──
  useEffect(() => () => clearPageCache(), []);

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col bg-background">
        <div className="w-full max-w-lg mx-auto px-4 pt-8 animate-pulse">
          <div className="h-4 w-32 bg-muted rounded mb-6" />
          <div className="bg-card border border-border rounded-xl shadow-sm aspect-[3/4] p-6 space-y-3">
            <div className="h-3 w-full bg-muted rounded" />
            <div className="h-3 w-11/12 bg-muted rounded" />
            <div className="h-3 w-full bg-muted rounded" />
            <div className="h-3 w-2/3 bg-muted rounded" />
          </div>
        </div>
        <div className="mt-6 flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <p className="text-sm">{t.readerLoading}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-background px-4 text-center">
        <span className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="w-7 h-7 text-destructive" />
        </span>
        <p className="text-sm text-destructive font-semibold">{t.readerLoadError}</p>
        <button
          onClick={() => setReloadKey(k => k + 1)}
          className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold active:scale-95 transition-transform"
        >
          {t.readerRetry}
        </button>
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className="relative w-full h-full flex flex-col bg-muted/30 select-none"
      style={{ touchAction: "pan-y" }}
      onContextMenu={(e) => e.preventDefault()}
      onClick={(e) => {
        // Toggle the toolbar by tapping the page area
        if (showToc || showSearch || showGoTo) return;
        if (e.target.closest?.("[data-viewer-ui]")) return;
        setShowToolbar(s => !s);
      }}
    >
      {/* Vertical continuous page stream */}
      <VerticalPageStream
        pdf={pdf}
        totalPages={totalPages}
        currentPage={currentPage}
        zoom={zoom}
        theme={theme}
        onCurrentPageChange={onStreamPageChange}
        scrollToPageRef={scrollToPageRef}
      />

      {/* Panels */}
      <TocPanel
        show={showToc}
        isRTL={isRTL}
        darkMode={theme === "dark"}
        outline={outline}
        totalPages={totalPages}
        onClose={() => setShowToc(false)}
        onPageClick={goToPage}
      />
      <SearchPanel
        show={showSearch}
        query={query}
        setQuery={setQuery}
        onSearch={runSearch}
        searching={searching}
        results={results}
        resultIdx={resultIdx}
        onNextResult={nextResult}
        onClose={() => setShowSearch(false)}
      />
      <GoToPanel
        show={showGoTo}
        value={goToValue}
        setValue={setGoToValue}
        totalPages={totalPages}
        onGo={() => { goToPage(goToValue); setShowGoTo(false); }}
        onClose={() => setShowGoTo(false)}
      />

      {/* Toolbar */}
      {showToolbar ? (
        <ViewerToolbar
          currentPage={currentPage}
          totalPages={totalPages}
          zoom={zoom}
          theme={theme}
          bookmarks={bookmarks}
          hasOutline={outline.length > 0}
          onNext={nextPage}
          onPrev={prevPage}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onCycleTheme={() => setTheme(th => (th === "light" ? "dark" : th === "dark" ? "sepia" : "light"))}
          onToggleBookmark={toggleBookmark}
          onToggleToc={() => setShowToc(s => !s)}
          onToggleSearch={() => setShowSearch(s => !s)}
          onToggleGoTo={openGoTo}
          onSeekProgress={(f) => goToPage(Math.max(1, Math.round(f * totalPages)))}
          onToggleFullscreen={toggleFullscreen}
          onHide={() => setShowToolbar(false)}
        />
      ) : (
        <button
          onClick={() => setShowToolbar(true)}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 w-9 h-9 rounded-full bg-card border border-border shadow-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          title={t.tbShow}
        >
          <ChevronUp className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// Normalize PDF.js outline into { title, pageNumber, items[] }
async function normalizeOutline(outline, pdf) {
  if (!outline || !outline.length) return [];
  const walk = async (items) => {
    const res = [];
    for (const it of items) {
      let pageNumber = null;
      try {
        if (it.dest) {
          let dest = it.dest;
          if (typeof dest === "string") dest = await pdf.getDestination(dest);
          if (Array.isArray(dest) && dest[0]) {
            const idx = await pdf.getPageIndex(dest[0]);
            pageNumber = idx + 1;
          }
        }
      } catch {}
      res.push({
        title: it.title || "",
        pageNumber,
        items: it.items && it.items.length ? await walk(it.items) : [],
      });
    }
    return res;
  };
  return walk(outline);
}