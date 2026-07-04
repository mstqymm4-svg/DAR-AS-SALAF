import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronLeft, ChevronRight, Bookmark, BookmarkCheck, Search,
  ZoomIn, ZoomOut, Moon, Sun, List, X, Maximize,
} from "lucide-react";
import { toast } from "sonner";
import { loadPdfDocument } from "@/lib/pdfLoader";
import PdfCanvasPage from "@/components/PdfCanvasPage";
import TranslatedTextPage from "@/components/TranslatedTextPage";

/**
 * Professional PDF / translated-text viewer with realistic page-flip animation.
 * Supports books of any size (lazy page loading via pdfjs — only current page is rendered).
 *
 * Props:
 *   pdfUrl        — URL of the PDF file (for original mode)
 *   title         — book title (used for bookmark/lastpage storage keys)
 *   language      — "ar" | "ur" | "en" | "hi" (determines RTL/LTR)
 *   translations  — array of { page_number, translated_text } (for translated mode; pass null for PDF mode)
 */
export default function FlipBookViewer({ pdfUrl, title, language = "ar", translations = null }) {
  const isTranslatedMode = translations !== null;
  const isRTL = language === "ar" || language === "ur" || language === "fa";

  const containerRef = useRef(null);
  const touchStartX = useRef(0);

  const [pdf, setPdf] = useState(null);
  const [pdfError, setPdfError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);

  const [zoom, setZoom] = useState(1);
  const [darkMode, setDarkMode] = useState(false);
  const [showTools, setShowTools] = useState(true);
  const [showGoTo, setShowGoTo] = useState(false);
  const [goToPage, setGoToPage] = useState("");
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
    localStorage.setItem(`lastpage_${title}`, String(currentPage));
  }, [currentPage, title]);

  // Load PDF document (original mode only)
  useEffect(() => {
    if (isTranslatedMode) {
      setTotalPages(translations.length);
      return;
    }
    if (!pdfUrl) return;
    let cancelled = false;
    setPdfError("");
    loadPdfDocument(pdfUrl).then((doc) => {
      if (!cancelled) {
        setPdf(doc);
        setTotalPages(doc.numPages);
      }
    }).catch((e) => {
      if (!cancelled) setPdfError("فشل تحميل ملف PDF: " + (e.message || "خطأ غير معروف"));
    });
    return () => { cancelled = true; };
  }, [pdfUrl, isTranslatedMode, translations]);

  // Navigation
  const goNext = useCallback(() => {
    if (currentPage >= totalPages || isFlipping) return;
    setDirection(isRTL ? -1 : 1);
    setIsFlipping(true);
    setTimeout(() => {
      setCurrentPage((p) => Math.min(p + 1, totalPages));
      setIsFlipping(false);
    }, 300);
  }, [currentPage, totalPages, isFlipping, isRTL]);

  const goPrev = useCallback(() => {
    if (currentPage <= 1 || isFlipping) return;
    setDirection(isRTL ? 1 : -1);
    setIsFlipping(true);
    setTimeout(() => {
      setCurrentPage((p) => Math.max(p - 1, 1));
      setIsFlipping(false);
    }, 300);
  }, [currentPage, isFlipping, isRTL]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "ArrowLeft") isRTL ? goNext() : goPrev();
      else if (e.key === "ArrowRight") isRTL ? goPrev() : goNext();
      else if (e.key === "Escape") setShowGoTo(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev, isRTL]);

  const handleGoTo = () => {
    const num = Number(goToPage);
    if (num >= 1 && num <= totalPages) {
      setDirection(num > currentPage ? 1 : -1);
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentPage(num);
        setIsFlipping(false);
      }, 300);
    }
    setShowGoTo(false);
    setGoToPage("");
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
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) < 50) return;
    if (diff > 0) isRTL ? goNext() : goPrev();
    else isRTL ? goPrev() : goNext();
  };

  // Loading / error states
  if (pdfError) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <p className="text-destructive text-sm">{pdfError}</p>
        </div>
      </div>
    );
  }

  if (!isTranslatedMode && !pdf) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const showPage = isTranslatedMode
    ? translations.length > 0
    : pdf !== null;

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
        {/* Click zones for navigation */}
        <button
          className="absolute left-0 top-0 bottom-0 w-1/4 z-10"
          onClick={() => isRTL ? goNext() : goPrev()}
          aria-label="السابق"
        />
        <button
          className="absolute right-0 top-0 bottom-0 w-1/4 z-10"
          onClick={() => isRTL ? goPrev() : goNext()}
          aria-label="التالي"
        />

        {/* Page with flip animation */}
        {showPage && (
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentPage}
              custom={direction}
              initial={{ rotateY: direction > 0 ? 80 : -80, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: direction > 0 ? -80 : 80, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              style={{
                width: "100%",
                maxWidth: "700px",
                height: "100%",
                transformStyle: "preserve-3d",
                transformOrigin: isRTL ? "right center" : "left center",
              }}
            >
              {isTranslatedMode ? (
                <TranslatedTextPage
                  translation={translations[currentPage - 1]}
                  darkMode={darkMode}
                  lang={language}
                />
              ) : (
                <PdfCanvasPage
                  pdf={pdf}
                  pageNumber={currentPage}
                  zoom={zoom}
                  darkMode={darkMode}
                />
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Navigation arrows */}
        <button
          onClick={() => isRTL ? goNext() : goPrev()}
          disabled={isRTL ? currentPage >= totalPages : currentPage <= 1}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 dark:bg-gray-800/80 shadow-lg flex items-center justify-center hover:bg-white dark:hover:bg-gray-700 transition-colors disabled:opacity-30 z-20"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => isRTL ? goPrev() : goNext()}
          disabled={isRTL ? currentPage <= 1 : currentPage >= totalPages}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 dark:bg-gray-800/80 shadow-lg flex items-center justify-center hover:bg-white dark:hover:bg-gray-700 transition-colors disabled:opacity-30 z-20"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Go to page modal */}
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
      </div>

      {/* Bottom toolbar */}
      <AnimatePresence>
        {showTools && (
          <motion.div
            initial={{ y: 60 }}
            animate={{ y: 0 }}
            exit={{ y: 60 }}
            className={`shrink-0 border-t ${darkMode ? "border-gray-700 bg-gray-800" : "border-border bg-card"}`}
          >
            <div className="flex items-center justify-between px-4 py-2 gap-2">
              {/* Left: page info */}
              <div className="flex items-center gap-2 text-xs">
                <span className={`font-mono font-bold ${darkMode ? "text-gray-200" : "text-foreground"}`}>
                  {currentPage}
                </span>
                <span className={darkMode ? "text-gray-400" : "text-muted-foreground"}>/ {totalPages}</span>
              </div>

              {/* Center: tools */}
              <div className="flex items-center gap-1">
                <button onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${darkMode ? "hover:bg-gray-700 text-gray-300" : "hover:bg-muted text-muted-foreground"}`}
                  title="تصغير">
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className={`text-xs font-mono w-10 text-center ${darkMode ? "text-gray-300" : ""}`}>{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${darkMode ? "hover:bg-gray-700 text-gray-300" : "hover:bg-muted text-muted-foreground"}`}
                  title="تكبير">
                  <ZoomIn className="w-4 h-4" />
                </button>

                <div className={`w-px h-6 mx-1 ${darkMode ? "bg-gray-600" : "bg-border"}`} />

                <button onClick={toggleBookmark}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${darkMode ? "hover:bg-gray-700" : "hover:bg-muted"} ${bookmarks.includes(currentPage) ? "text-primary" : darkMode ? "text-gray-300" : "text-muted-foreground"}`}
                  title="علامة مرجعية">
                  {bookmarks.includes(currentPage) ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                </button>

                <button onClick={() => setShowGoTo(true)}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${darkMode ? "hover:bg-gray-700 text-gray-300" : "hover:bg-muted text-muted-foreground"}`}
                  title="انتقال لصفحة">
                  <Search className="w-4 h-4" />
                </button>

                <button onClick={() => setDarkMode(!darkMode)}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${darkMode ? "hover:bg-gray-700 text-gray-300" : "hover:bg-muted text-muted-foreground"}`}
                  title={darkMode ? "وضع نهاري" : "وضع ليلي"}>
                  {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>

                <button onClick={toggleFullscreen}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${darkMode ? "hover:bg-gray-700 text-gray-300" : "hover:bg-muted text-muted-foreground"}`}
                  title="ملء الشاشة">
                  <Maximize className="w-4 h-4" />
                </button>
              </div>

              {/* Right: bookmarks list */}
              {bookmarks.length > 0 && (
                <div className="flex items-center gap-1">
                  <div className="relative group">
                    <button className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${darkMode ? "hover:bg-gray-700 text-gray-300" : "hover:bg-muted text-muted-foreground"}`}>
                      <List className="w-4 h-4" />
                    </button>
                    <div className={`absolute bottom-full mb-2 ${isRTL ? "left-0" : "right-0"} w-32 rounded-xl border ${darkMode ? "border-gray-700 bg-gray-800" : "border-border bg-card"} shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all max-h-48 overflow-y-auto z-30`}>
                      {bookmarks.map((p) => (
                        <button key={p} onClick={() => {
                          setDirection(p > currentPage ? 1 : -1);
                          setIsFlipping(true);
                          setTimeout(() => { setCurrentPage(p); setIsFlipping(false); }, 300);
                        }}
                          className={`w-full px-3 py-2 text-xs text-right hover:bg-muted ${darkMode ? "text-gray-300 hover:bg-gray-700" : ""}`}>
                          صفحة {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle toolbar */}
      <button
        onClick={() => setShowTools(!showTools)}
        className={`absolute bottom-2 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full ${darkMode ? "bg-gray-700 text-gray-300" : "bg-card border border-border text-muted-foreground"} shadow-lg flex items-center justify-center z-20 ${showTools ? "opacity-0 hover:opacity-100" : "opacity-100"}`}
      >
        {showTools ? <X className="w-4 h-4" /> : <List className="w-4 h-4" />}
      </button>
    </div>
  );
}