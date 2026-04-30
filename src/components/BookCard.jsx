import { Link } from "react-router-dom";
import { Heart, Star, BookOpen, BookMarked } from "lucide-react";
import { motion } from "framer-motion";

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

const categoryIcons = {
  "القرآن وعلومه": "📖",
  "الحديث الشريف": "📜",
  "الفقه الإسلامي": "⚖️",
  "السيرة النبوية": "🕌",
  "العقيدة": "💎",
  "التزكية والرقائق": "🌿",
  "التاريخ الإسلامي": "🏛️",
  "أخرى": "📚"
};

export default function BookCard({ book, isFavorite, onToggleFavorite, index = 0 }) {
  const gradient = categoryColors[book.category] || categoryColors["أخرى"];
  const emoji = categoryIcons[book.category] || "📚";

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
          <img
            src={book.cover_image}
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> :


          <div className="flex flex-col items-center gap-2">
              
              <BookOpen className="w-6 h-6 text-primary/30" />
            </div>
          }
          
          {/* Favorite Button */}
          {onToggleFavorite &&
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFavorite(book.id);
            }}
            className="absolute top-3 left-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:scale-110 transition-transform">
            
              <Heart
              className={`w-4 h-4 transition-colors ${
              isFavorite ? "fill-red-500 text-red-500" : "text-gray-400"}`
              } />
            
            </button>
          }

          {/* Featured Badge */}
          {book.is_featured &&
          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-accent text-accent-foreground text-[10px] font-bold shadow-sm">
              ⭐ مميز
            </div>
          }
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium hidden">
              {book.category}
            </span>
          </div>
          <h3 className="font-bold text-foreground text-sm leading-relaxed line-clamp-2 mb-1 group-hover:text-primary transition-colors">
            {book.title}
          </h3>
          <p className="text-xs text-muted-foreground">{book.author}</p>
          
          {book.rating > 0 &&
          <div className="flex items-center gap-1 mt-2">
              {[...Array(5)].map((_, i) =>
            <Star
              key={i}
              className={`w-3 h-3 ${
              i < Math.round(book.rating) ?
              "fill-accent text-accent" :
              "text-border"}`
              } />

            )}
              <span className="text-[10px] text-muted-foreground mr-1">{book.rating}</span>
            </div>
          }
        </div>
      </Link>

      <div className="px-4 pb-4 -mt-1">
        <Link
          to={`/read/${book.id}`}
          className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-colors">
          
          <BookMarked className="w-3.5 h-3.5" />
          قراءة الكتاب
        </Link>
      </div>
    </motion.div>);

}