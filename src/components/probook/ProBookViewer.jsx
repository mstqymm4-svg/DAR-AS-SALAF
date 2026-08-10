import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { loadPdfDocument, extractPageText, clearPageCache } from "@/lib/pdfLoader";
import PdfPageRenderer from "./PdfPageRenderer";
import ViewerToolbar from "./ViewerToolbar";
import { TocPanel, SearchPanel, GoToPanel } from "./ViewerPanels";

const BM_PREFIX = "dau_bm_";

export default function ProBookViewer({ pdfUrl, title, bookId, language = "ar" }) {
  const [pdf, setPdf] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

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

  const pageAreaRef = useRef(null);
  const [dims, setDims] = useState({ w: 0, h: 0 });

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

  // ── Measure page area ──
  useEffect(() => {
    const el = pageAreaRef.current;
    if (!el) return;
    const update = () => setDims({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Keep total pages in a ref for synchronous access ──
  useEffect(() => { totalPagesRef.current = totalPages; }, [totalPages]);

  // ── Persist bookmarks ──
  useEffect(() => {
    try { localStorage.setItem(BM_PREFIX + bookId, JSON.stringify(bookmarks)); } catch {}
  }, [bookmarks, bookId]);

  // ── Navigation helpers ──
  const goToPage = useCallback((p) => {
    const tp = totalPagesRef.current || totalPages;
    setCurrentPage(Math.max(1, Math.min(tp, Number(p) || 1)));
  }, [totalPages]);

  const nextPage = useCallback(() => setCurrentPage(p => Math.min(totalPages, p + 1)), [totalPages]);
  const prevPage = useCallback(() => setCurrentPage(p => Math.max(1, p - 1)), []);
  const zoomIn = useCallback(() => setZoom(z => Math.min(3, +(z + 0.2).toFixed(2))), []);
  const zoomOut = useCallback(() => setZoom(z => Math.max(0.5, +(z - 0.2).toFixed(2))), []);

  const toggleBookmark = useCallback(() => {
    setCurrentPage(cp => {
      setBookmarks(b => b.includes(cp) ? b.filter(x => x !== cp) : [...b, cp].sort((a, c) => a - c));
      return cp;
    });
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = pageAreaRef.current?.parentElement;
    if (!document.fullscreenElement) (el || document.documentElement).requestFullscreen?.();
    else document.exitFullscreen?.();
  }, []);

  // ── Keyboard navigation ──
  useEffect(() => {
    const onKey = (e) => {
      if (showToc || showSearch || showGoTo) return;
      if (e.target?.tagName === "INPUT" || e.target?.tagName === "TEXTAREA") return;
      if (e.key === "ArrowLeft") isRTL ? nextPage() : prevPage();
      else if (e.key === "ArrowRight") isRTL ? prevPage() : nextPage();
      else if (e.key === "+" || e.key === "=") zoomIn();
      else if (e.key === "-") zoomOut();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [nextPage, prevPage, zoomIn, zoomOut, isRTL, showToc, showSearch, showGoTo]);

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

  const darkFilter = darkMode ? "invert(0.92) hue-rotate(180deg)" : "none";

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-background">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">جاري تحميل الكتاب...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-background px-4 text-center">
        <AlertCircle className="w-10 h-10 text-destructive" />
        <p className="text-sm text-destructive font-medium">تعذّر تحميل الملف</p>
        <button onClick={() => setReloadKey(k => k + 1)} className="text-xs text-primary hover:underline">
          إعادة المحاولة
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col bg-muted/30 select-none" onContextMenu={(e) => e.preventDefault()}>
      {/* Page area */}
      <div ref={pageAreaRef} className="flex-1 overflow-auto flex items-start justify-center p-2 sm:p-4">
        <div style={{ filter: darkFilter }}>
          <PdfPageRenderer
            pdf={pdf}
            pageNumber={currentPage}
            zoom={zoom}
            containerWidth={Math.max(0, dims.w - 24)}
            containerHeight={Math.max(0, dims.h - 24)}
          />
        </div>
      </div>

      {/* Panels */}
      <TocPanel
        show={showToc}
        isRTL={isRTL}
        darkMode={darkMode}
        outline={outline}
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
      <ViewerToolbar
        currentPage={currentPage}
        totalPages={totalPages}
        zoom={zoom}
        darkMode={darkMode}
        bookmarks={bookmarks}
        hasOutline={outline.length > 0}
        onNext={nextPage}
        onPrev={prevPage}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onToggleDark={() => setDarkMode(d => !d)}
        onToggleBookmark={toggleBookmark}
        onToggleToc={() => setShowToc(s => !s)}
        onToggleSearch={() => setShowSearch(s => !s)}
        onToggleGoTo={openGoTo}
        onToggleFullscreen={toggleFullscreen}
      />
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