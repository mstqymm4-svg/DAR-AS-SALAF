import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";

/**
 * Mobile-only header with a large (44px) back button and safe-area-top padding.
 * Hidden on desktop (md:hidden).
 */
export default function MobileHeader({ title, onBack }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) onBack();
    else navigate(-1);
  };

  return (
    <div className="md:hidden safe-area-top -mt-2 mb-2">
      <div className="flex items-center gap-1 h-12">
        <button
          onClick={handleBack}
          className="flex items-center justify-center w-11 h-11 rounded-xl hover:bg-muted active:scale-95 transition-all"
          aria-label="رجوع"
        >
          <ChevronRight className="w-6 h-6 text-foreground" />
        </button>
        {title && (
          <h2 className="text-base font-bold text-foreground truncate flex-1">{title}</h2>
        )}
      </div>
    </div>
  );
}