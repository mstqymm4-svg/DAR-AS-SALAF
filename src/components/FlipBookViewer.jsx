import { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft, ChevronRight, Bookmark, BookmarkCheck,
  ZoomIn, ZoomOut, Moon, Sun, List, X, Maximize, BookOpen, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { loadPdfDocument, clearPageCache } from "@/lib/pdfLoader";
import PdfCanvasPage from "@/components/PdfCanvasPage";

/**
 * Professional PDF viewer optimized for Arabic/Urdu books.
 * Canvas rendering preserves embedded fonts and original layout exactly.
 * Features: smooth page transitions, zoom, dark mode, bookmarks, TOC,
 * go-to-page, fullscreen, save last page, page caching.
 */
export default function FlipBookViewer({ pdfUrl, title, language = "ar" }) {
  const isRTL = language === "ar" || language === "ur" || language === "fa";

  const containerRef = useRef(null);
  const touchStartX = useRef(0);

  const [pdf, setPdf] = useState(null);
  const [pdfError, setPdfError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [direction, setDirection] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [darkMode, setDarkMode] = useState(false);
  const [showTools, setShowTools] = useState(true);
  const [showGoTo, setShowGoTo] = useState(false);
  const [goToPage, setGoToPage] = useState("");
  const [outline, setOutline] = useState([]);
  const [showToc, setShowToc] = useState(false);
  const [bookmarks, setBookmarks] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`bookmarks_${title}`) || "[]"); } catch(e) { return []; }
  });

  // Restore last page
  useEffect(() => {
    const saved = localStorage.getItem(`lastpage_${title}`);
    if (saved) setCurrentPage(Number(saved));
  }, [title]);

  // Save last page
  useEffect(() => {
    if (totalPages > 0 && currentPage > 0) {
      localStorage.setItem(`lastpage_${title}`, String(currentPage));
    }
  }, [currentPage, title, totalPages]);

  // Load PDF document + outline
  useEffect(() => {
    if (!pdfUrl) return;
    let cancelled = false;
    setPdfError("");
    setPdf(null);
    loadPdfDocument(pdfUrl).then(async (doc) => {
      if (cancelled) return;
      setPdf(doc);
      setTotalPages(doc.numPages);
      // Restore last page after knowing total
      const saved = Number(localStorage.getItem(`lastpage_${title}`));
      if (saved && saved > 0 && saved <= doc.numPages) {
        setCurrentPage(saved);
      }
      try {
        const outlineData = await doc.getOutline();
        if (outlineData && !cancelled) {
          const resolved = await resolveOutline(doc, outlineData);
          if (!cancelled) setOutline(resolved);
        }
      } catch(e) {}
    }).catch((e) => {
      if (!cancelled) setPdfError("فشل تحميل ملف PDF: " + (e.message || "خطأ غير معروف"));
    });
    return () => { cancelled = true; };
  }, [pdfUrl, title]);

  // Prefetch adjacent pages
  useEffect(() => {
    if (!pdf) return;
    if (currentPage < totalPages) pdf.getPage(currentPage + 1).catch(() => {});
    if (currentPage > 1) pdf.getPage(currentPage - 1).catch(() => {});
  }, [pdf, currentPage, totalPages]);

  // Navigation — change page immediately with smooth slide transition
  const goNext = useCallback(() => {
    if (currentPage >= totalPages) return;
    setDirection(isRTL ? -1 : 1);
    setCurrentPage((p) => Math.min(p + 1, totalPages));
  }, [currentPage, totalPages, isRTL]);

  const goPrev = useCallback(() => {
    if (currentPage <= 1) return;
    setDirection(isRTL ? 1 : -1);
    setCurrentPage((p) => Math.max(p - 1, 1));
  }, [currentPage, isRTL]);

  const navigateToPage = useCallback((num) => {
    if (num < 1 || num > totalPages || num === currentPage) return;
    setDirection(num > currentPage ? 1 : -1);
    setCurrentPage(num);
  }, [totalPages, currentPage]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === "INPUT") return;
      if (e.key === "ArrowLeft") isRTL ? goNext() : goPrev();
      else if (e.key === "ArrowRight") isRTL ? goPrev() : goNext();
      else if (e.key === "Escape") { setShowGoTo(false); setShowToc(false); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev, isRTL]);

  const handleGoTo = () => {
    const num = Number(goToPage);
    if (num >= 1 && num <= totalPages) {
      navigateToPage(num);
      setShowGoTo(false);
      setGoToPage("");
    } else {
      toast.error(`أدخل رقم صفحة بين 1 و ${totalPages}`);
    }
  };

  const toggleBookmark = () => {
    const next = bookmarks.includes(currentPage)
      ? bookmarks.filter((p) => p !== currentPage)
      : [...bookmarks, currentPage].sort((a, b) => a - b);
    setBookmarks(next);
    localStorage.setItem(`bookmarks_${title}`, JSON.stringify(next));
    toast.success(bookmarks.includes(currentPage) ? "أُزيل العلامة" : "تم وضع علامة");
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen?.();
    else document.exitFullscreen?.();
  };

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) < 50) return;
    if (diff > 0) isRTL ? goNext() : goPrev();
    else isRTL ? goPrev() : goNext();
  };

  if (pdfError) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <p className="text-destructive text-sm">{pdfError}</p>
      </div>
    );
  }

  if (!pdf) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">جاري تحميل الكتاب...</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full flex flex-col overflow-hidden ${darkMode ? "bg-gray-900" : "bg-gray-100"}`}
      dir={isRTL ? "rtl" : "ltr"}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Page Area */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden px-2 py-2">
        {/* Click zones for page navigation */}
        <button className="absolute left-0 top-0 bottom-0 w-1/5 z-10" onClick={() => isRTL ? goNext() : goPrev()} aria-label="السابق" />
        <button className="absolute right-0 top-0 bottom-0 w-1/5 z-10" onClick={() => isRTL ? goPrev() : goNext()} aria-label="التالي" />

        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={currentPage}
            custom={direction}
            initial={{ opacity: 0, x: direction > 0 ? 40 : -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction > 0 ? -40 : 40 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{ width: "100%", maxWidth: "700px", height: "100%" }}
          >
            <PdfCanvasPage pdf={pdf} pageNumber={currentPage} zoom={zoom} darkMode={darkMode} />
          </motion.div>
        </AnimatePresence>

        {/* Navigation arrows */}
        <button onClick={() => isRTL ? goNext() : goPrev()} disabled={isRTL ? currentPage >= totalPages : currentPage <= 1}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 dark:bg-gray-800/80 shadow-lg flex items-center justify-center hover:bg-white dark:hover:bg-gray-700 transition-colors disabled:opacity-30 z-20">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button onClick={() => isRTL ? goPrev() : goNext()} disabled={isRTL ? currentPage <= 1 : currentPage >= totalPages}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 dark:bg-gray-800/80 shadow-lg flex items-center justify-center hover:bg-white dark:hover:bg-gray-700 transition-colors disabled:opacity-30 z-20">
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Go to page modal */}
        <AnimatePresence>
          {showGoTo && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 flex items-center justify-center bg-black/50" onClick={() => setShowGoTo(false)}>
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                className="bg-card border border-border rounded-2xl p-4 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <Input type="number" autoFocus min="1" max={totalPages} placeholder="رقم الصفحة" value={goToPage}
                  onChange={(e) => setGoToPage(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleGoTo()} className="w-32 text-center" />
                <Button size="sm" onClick={handleGoTo}>انتقال</Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* TOC panel */}
        <AnimatePresence>
          {showToc && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 flex justify-end bg-black/50" onClick={() => setShowToc(false)}>
              <motion.div initial={{ x: 100 }} animate={{ x: 0 }} exit={{ x: 100 }}
                className={`w-80 max-w-[85%] h-full ${darkMode ? "bg-gray-800" : "bg-card"} border-l border-border overflow-y-auto`}
                onClick={(e) => e.stopPropagation()}>
                <div className="p-3 border-b border-border flex items-center justify-between">
                  <h3 className="text-sm font-bold flex items-center gap-2"><BookOpen className="w-4 h-4" /> الفهرس</h3>
                  <button onClick={() => setShowToc(false)} className="p-1 rounded hover:bg-muted"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-2">
                  {outline.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">لا يوجد فهرس في هذا الكتاب</p>
                  ) : (
                    <OutlineTree items={outline} onPageClick={(p) => { navigateToPage(p); setShowToc(false); }} darkMode={darkMode} />
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom toolbar */}
      <AnimatePresence>
        {showTools && (
          <motion.div initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60 }}
            className={`shrink-0 border-t ${darkMode ? "border-gray-700 bg-gray-800" : "border-border bg-card"}`}>
            <div className="flex items-center justify-between px-4 py-2 gap-2">
              <div className="flex items-center gap-2 text-xs min-w-[80px]">
                <span className={`font-mono font-bold ${darkMode ? "text-gray-200" : "text-foreground"}`}>{currentPage}</span>
                <span className={darkMode ? "text-gray-400" : "text-muted-foreground"}>/ {totalPages}</span>
              </div>

              {/* Page progress bar */}
              <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${darkMode ? "bg-gray-700" : "bg-muted"} mx-2`}>
                <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${totalPages ? (currentPage / totalPages) * 100 : 0}%` }} />
              </div>

              <div className="flex items-center gap-1">
                <button onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))} className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${darkMode ? "hover:bg-gray-700 text-gray-300" : "hover:bg-muted text-muted-foreground"}`} title="تصغير">
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className={`text-xs font-mono w-10 text-center ${darkMode ? "text-gray-300" : ""}`}>{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom((z) => Math.min(3, z + 0.25))} className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${darkMode ? "hover:bg-gray-700 text-gray-300" : "hover:bg-muted text-muted-foreground"}`} title="تكبير">
                  <ZoomIn className="w-4 h-4" />
                </button>

                <div className={`w-px h-6 mx-1 ${darkMode ? "bg-gray-600" : "bg-border"}`} />

                {outline.length > 0 && (
                  <button onClick={() => setShowToc(true)} className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${darkMode ? "hover:bg-gray-700 text-gray-300" : "hover:bg-muted text-muted-foreground"}`} title="الفهرس">
                    <BookOpen className="w-4 h-4" />
                  </button>
                )}

                <button onClick={toggleBookmark} className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${darkMode ? "hover:bg-gray-700" : "hover:bg-muted"} ${bookmarks.includes(currentPage) ? "text-primary" : darkMode ? "text-gray-300" : "text-muted-foreground"}`} title="علامة مرجعية">
                  {bookmarks.includes(currentPage) ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                </button>

                <button onClick={() => setShowGoTo(true)} className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${darkMode ? "hover:bg-gray-700 text-gray-300" : "hover:bg-muted text-muted-foreground"}`} title="انتقال لصفحة">
                  <List className="w-4 h-4" />
                </button>

                <button onClick={() => setDarkMode(!darkMode)} className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${darkMode ? "hover:bg-gray-700 text-gray-300" : "hover:bg-muted text-muted-foreground"}`} title={darkMode ? "وضع نهاري" : "وضع ليلي"}>
                  {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>

                <button onClick={toggleFullscreen} className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${darkMode ? "hover:bg-gray-700 text-gray-300" : "hover:bg-muted text-muted-foreground"}`} title="ملء الشاشة">
                  <Maximize className="w-4 h-4" />
                </button>
              </div>

              {bookmarks.length > 0 && (
                <div className="relative group">
                  <button className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${darkMode ? "hover:bg-gray-700 text-gray-300" : "hover:bg-muted text-muted-foreground"}`}>
                    <BookmarkCheck className="w-4 h-4" />
                  </button>
                  <div className={`absolute bottom-full mb-2 ${isRTL ? "left-0" : "right-0"} w-32 rounded-xl border ${darkMode ? "border-gray-700 bg-gray-800" : "border-border bg-card"} shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all max-h-48 overflow-y-auto z-30`}>
                    {bookmarks.map((p) => (
                      <button key={p} onClick={() => navigateToPage(p)} className={`w-full px-3 py-2 text-xs text-right hover:bg-muted ${darkMode ? "text-gray-300 hover:bg-gray-700" : ""}`}>
                        صفحة {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button onClick={() => setShowTools(!showTools)}
        className={`absolute bottom-2 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full ${darkMode ? "bg-gray-700 text-gray-300" : "bg-card border border-border text-muted-foreground"} shadow-lg flex items-center justify-center z-20 ${showTools ? "opacity-0 hover:opacity-100" : "opacity-100"}`}>
        {showTools ? <X className="w-4 h-4" /> : <List className="w-4 h-4" />}
      </button>
    </div>
  );
}

// ─── Helper: Resolve PDF outline to page numbers ─────────────────────────────
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

// ─── Outline Tree Component ───────────────────────────────────────────────────
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