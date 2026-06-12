import { Link } from "react-router-dom";
import { Heart, Star, BookOpen, BookMarked } from "lucide-react";
import { motion } from "framer-motion";
import { useT } from "@/lib/i18n";

const categoryColors = {
  "القرآن وعلومه": "from-emerald-500/20 to-emerald-600/5",
  "الحديث الشريف": "from-amber-500/20 to-amber-600/5",
  "الفقه الإسلامي": "from-blue-500/20 to-blue-600/5",
  "السيرة النبوية": "from-rose-500/20 to-rose-600/5",
  "العقيدة": "from-violet-500/20 to-violet-600/5",
  "التزكية والرقائق": "from-teal-500/20 to-teal-600/5",
  "التاريخ الإسلامي": "from-orange-500/20 to-orange-600/5",
  "أخرى": "from-gray-500/20 to-gray-600/5"
};

export default function BookCard({ book, isFavorite, onToggleFavorite, index = 0 }) {
  const t = useT();
  const gradient = categoryColors[book.category] || categoryColors["أخرى"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}>
      
      <Link
        to={`/book/${book.id}`}
        className="group block bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1">
        
        {/* Cover Image */}
        <div className={`relative h-48 bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden`}>
          {book.cover_image ?
          <img src={book.cover_image} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> :

          <BookOpen className="w-10 h-10 text-primary/30" />
          }

          {onToggleFavorite &&
          <button
            onClick={(e) => {e.preventDefault();e.stopPropagation();onToggleFavorite(book.id);}}
            className="absolute top-3 left-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:scale-110 transition-transform">
            
              <Heart className={`w-4 h-4 transition-colors ${isFavorite ? "fill-red-500 text-red-500" : "text-gray-400"}`} />
            </button>
          }

          {book.is_featured &&
          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-accent text-accent-foreground text-[10px] font-bold shadow-sm">
              ⭐ مميز
            </div>
          }

          {/* Read Button — overlaid at bottom of cover */}
          <Link
            to={`/read/${book.id}`}
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-1.5 py-2.5 hover:bg-primary backdrop-blur-sm text-primary-foreground text-xs font-bold transition-all duration-300 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 opacity-0 bg-[#010889]/[0.8]">
            
            <BookMarked className="w-3.5 h-3.5" />
            {t.readBook}
          </Link>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
              {book.category}
            </span>
          </div>
          <h3 className="font-bold text-foreground leading-relaxed line-clamp-2 mb-1 group-hover:text-primary transition-colors text-sm" style={{ fontFamily: "var(--font-title, var(--font-heading, inherit))" }}>
            {book.title}
          </h3>
          <p className="text-xs text-muted-foreground" style={{ fontFamily: "var(--font-title, var(--font-heading, inherit))" }}>{book.author}</p>

          {book.rating > 0 &&
          <div className="flex items-center gap-1 mt-2">
              {[...Array(5)].map((_, i) =>
            <Star key={i} className={`w-3 h-3 ${i < Math.round(book.rating) ? "fill-accent text-accent" : "text-border"}`} />
            )}
              <span className="text-[10px] text-muted-foreground mr-1">{book.rating}</span>
            </div>
          }
        </div>
      </Link>
    </motion.div>);

}