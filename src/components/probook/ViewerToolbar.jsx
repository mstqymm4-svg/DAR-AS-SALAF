import {
  ChevronLeft, ChevronRight, Bookmark, BookmarkCheck,
  ZoomIn, ZoomOut, Moon, Sun, List, Maximize, ChevronDown,
  Search, ListOrdered, Download, Share2, Headphones, Square, Languages,
} from "lucide-react";

/**
 * Bottom toolbar for the ProBookViewer.
 * Contains: zoom, page nav, TOC, search, bookmark, go-to, dark mode, fullscreen.
 */
export default function ViewerToolbar({
  currentPage,
  totalPages,
  zoom,
  darkMode,
  bookmarks,
  hasOutline,
  onNext,
  onPrev,
  onZoomIn,
  onZoomOut,
  onToggleDark,
  onToggleBookmark,
  onToggleToc,
  onToggleSearch,
  onToggleGoTo,
  onToggleFullscreen,
  onDownload,
  onShare,
  reading,
  onToggleRead,
  onToggleTranslate,
  onHide,
}) {
  return (
    <div className={`shrink-0 border-t ${darkMode ? "border-gray-700 bg-gray-800" : "border-border bg-card"}`}>
      <div dir="ltr" className="flex items-center justify-center px-2 py-1.5 gap-0.5 sm:gap-1 overflow-x-auto scrollbar-hide">
        <ToolBtn onClick={onZoomOut} dark={darkMode} title="تصغير">
          <ZoomOut className="w-4 h-4" />
        </ToolBtn>
        <span className={`text-xs font-mono w-12 text-center shrink-0 ${darkMode ? "text-gray-300" : "text-foreground"}`}>
          {Math.round(zoom * 100)}%
        </span>
        <ToolBtn onClick={onZoomIn} dark={darkMode} title="تكبير">
          <ZoomIn className="w-4 h-4" />
        </ToolBtn>

        <Divider dark={darkMode} />

        <ToolBtn onClick={onPrev} dark={darkMode} title="السابقة" disabled={currentPage <= 1}>
          <ChevronLeft className="w-4 h-4" />
        </ToolBtn>
        <span className={`text-xs font-mono font-bold px-2 shrink-0 ${darkMode ? "text-gray-300" : "text-foreground"}`}>
          {currentPage} / {totalPages}
        </span>
        <ToolBtn onClick={onNext} dark={darkMode} title="التالية" disabled={currentPage >= totalPages}>
          <ChevronRight className="w-4 h-4" />
        </ToolBtn>

        <Divider dark={darkMode} />

        {hasOutline && (
          <ToolBtn onClick={onToggleToc} dark={darkMode} title="الفهرس">
            <List className="w-4 h-4" />
          </ToolBtn>
        )}
        <ToolBtn onClick={onToggleSearch} dark={darkMode} title="بحث">
          <Search className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn onClick={onToggleTranslate} dark={darkMode} title="ترجمة الصفحة">
          <Languages className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn onClick={onToggleBookmark} dark={darkMode} title="علامة مرجعية" active={bookmarks.includes(currentPage)}>
          {bookmarks.includes(currentPage) ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
        </ToolBtn>
        <ToolBtn onClick={onToggleGoTo} dark={darkMode} title="انتقال لصفحة">
          <ListOrdered className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn onClick={onToggleRead} dark={darkMode} title={reading ? "إيقاف القراءة الصوتية" : "قراءة صوتية"} active={reading}>
          {reading ? <Square className="w-4 h-4" /> : <Headphones className="w-4 h-4" />}
        </ToolBtn>
        <ToolBtn onClick={onToggleDark} dark={darkMode} title={darkMode ? "نهاري" : "ليلي"}>
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </ToolBtn>
        <ToolBtn onClick={onToggleFullscreen} dark={darkMode} title="ملء الشاشة">
          <Maximize className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn onClick={onDownload} dark={darkMode} title="تحميل">
          <Download className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn onClick={onShare} dark={darkMode} title="مشاركة">
          <Share2 className="w-4 h-4" />
        </ToolBtn>
        <Divider dark={darkMode} />
        <ToolBtn onClick={onHide} dark={darkMode} title="إخفاء الشريط">
          <ChevronDown className="w-4 h-4" />
        </ToolBtn>
      </div>

      {/* Progress bar */}
      <div className={`h-1 ${darkMode ? "bg-gray-700" : "bg-muted"}`}>
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${totalPages ? (currentPage / totalPages) * 100 : 0}%` }}
        />
      </div>
    </div>
  );
}

function ToolBtn({ children, onClick, dark, title, active, disabled }) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors shrink-0 disabled:opacity-30 disabled:cursor-default ${
        active
          ? "bg-primary/15 text-primary"
          : dark
          ? "hover:bg-gray-700 text-gray-300"
          : "hover:bg-muted text-muted-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function Divider({ dark }) {
  return <div className={`w-px h-6 mx-0.5 shrink-0 ${dark ? "bg-gray-600" : "bg-border"}`} />;
}