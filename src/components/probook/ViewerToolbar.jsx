import {
  ChevronLeft, ChevronRight, Bookmark, BookmarkCheck,
  ZoomIn, ZoomOut, Moon, Sun, List, Maximize, ChevronDown,
  Search, ListOrdered, Palette,
} from "lucide-react";
import { useT } from "@/lib/i18n";

/**
 * Bottom toolbar for the ProBookViewer.
 * Zoom, page nav, TOC, search, bookmark, go-to, reading theme
 * (light → dark → sepia), fullscreen. The reading-progress bar is
 * tappable to jump anywhere in the book.
 */
export default function ViewerToolbar({
  currentPage,
  totalPages,
  zoom,
  theme,
  bookmarks,
  hasOutline,
  onNext,
  onPrev,
  onZoomIn,
  onZoomOut,
  onCycleTheme,
  onToggleBookmark,
  onToggleToc,
  onToggleSearch,
  onToggleGoTo,
  onSeekProgress,
  onToggleFullscreen,
  onHide,
}) {
  const t = useT();
  const dark = theme === "dark";
  const pct = totalPages ? Math.round((currentPage / totalPages) * 100) : 0;

  const themeIcon =
    theme === "dark" ? <Moon className="w-4 h-4" /> :
    theme === "sepia" ? <Palette className="w-4 h-4" /> :
    <Sun className="w-4 h-4" />;
  const themeName =
    theme === "dark" ? t.tbDark : theme === "sepia" ? t.themeSepia : t.tbLight;

  return (
    <div className={`shrink-0 border-t backdrop-blur-xl shadow-[0_-6px_24px_-12px_rgba(0,0,0,0.25)] ${dark ? "border-gray-700 bg-gray-800/90" : "border-border bg-card/90"}`}>
      <div dir="ltr" className="flex items-center justify-center px-2 py-2 gap-0.5 sm:gap-1 overflow-x-auto scrollbar-hide">
        <ToolBtn onClick={onZoomOut} dark={dark} title={t.tbZoomOut}>
          <ZoomOut className="w-4 h-4" />
        </ToolBtn>
        <span className={`text-xs font-mono w-12 text-center shrink-0 ${dark ? "text-gray-300" : "text-foreground"}`}>
          {Math.round(zoom * 100)}%
        </span>
        <ToolBtn onClick={onZoomIn} dark={dark} title={t.tbZoomIn}>
          <ZoomIn className="w-4 h-4" />
        </ToolBtn>

        <Divider dark={dark} />

        <ToolBtn onClick={onPrev} dark={dark} title={t.tbPrev} disabled={currentPage <= 1}>
          <ChevronLeft className="w-4 h-4" />
        </ToolBtn>
        <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full shrink-0 whitespace-nowrap ${dark ? "text-gray-200 bg-gray-700/70" : "text-foreground bg-muted"}`}>
          {currentPage} / {totalPages} · {pct}%
        </span>
        <ToolBtn onClick={onNext} dark={dark} title={t.tbNext} disabled={currentPage >= totalPages}>
          <ChevronRight className="w-4 h-4" />
        </ToolBtn>

        <Divider dark={dark} />

        {hasOutline && (
          <ToolBtn onClick={onToggleToc} dark={dark} title={t.idxTitle}>
            <List className="w-4 h-4" />
          </ToolBtn>
        )}
        <ToolBtn onClick={onToggleSearch} dark={dark} title={t.tbSearch}>
          <Search className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn onClick={onToggleBookmark} dark={dark} title={t.tbBookmark} active={bookmarks.includes(currentPage)}>
          {bookmarks.includes(currentPage) ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
        </ToolBtn>
        <ToolBtn onClick={onToggleGoTo} dark={dark} title={t.tbGoTo}>
          <ListOrdered className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn onClick={onCycleTheme} dark={dark} title={`${t.tbTheme}: ${themeName}`} active={theme !== "light"}>
          {themeIcon}
        </ToolBtn>
        <ToolBtn onClick={onToggleFullscreen} dark={dark} title={t.tbFullscreen}>
          <Maximize className="w-4 h-4" />
        </ToolBtn>
        <Divider dark={dark} />
        <ToolBtn onClick={onHide} dark={dark} title={t.tbHide}>
          <ChevronDown className="w-4 h-4" />
        </ToolBtn>
      </div>

      {/* Tappable reading-progress bar */}
      <div
        dir="ltr"
        className={`h-1.5 hover:h-2.5 transition-all cursor-pointer group relative ${dark ? "bg-gray-700" : "bg-muted"}`}
        onClick={(e) => {
          if (!onSeekProgress) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
          onSeekProgress(ratio);
        }}
      >
        <div
          className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300 relative"
          style={{ width: `${pct}%` }}
        >
          <div className="absolute -end-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white ring-2 ring-primary shadow opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
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
      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95 shrink-0 disabled:opacity-30 disabled:cursor-default ${
        active
          ? "bg-primary/15 text-primary ring-1 ring-primary/30"
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