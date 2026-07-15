import { motion } from "framer-motion";

const DEFAULT_CATS = [
{ name: "القرآن وعلومه", emoji: "📖", color: "emerald" },
{ name: "الحديث الشريف", emoji: "📜", color: "amber" },
{ name: "الفقه الإسلامي", emoji: "⚖️", color: "blue" },
{ name: "السيرة النبوية", emoji: "🕌", color: "rose" },
{ name: "العقيدة", emoji: "💎", color: "violet" },
{ name: "التزكية والرقائق", emoji: "🌿", color: "teal" },
{ name: "التاريخ الإسلامي", emoji: "🏛️", color: "orange" },
{ name: "أخرى", emoji: "📁", color: "gray" }];


const COLOR_MAP = {
  emerald: "hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-700 dark:hover:text-emerald-400",
  amber: "hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:text-amber-700 dark:hover:text-amber-400",
  blue: "hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-700 dark:hover:text-blue-400",
  rose: "hover:border-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-700 dark:hover:text-rose-400",
  violet: "hover:border-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30 hover:text-violet-700 dark:hover:text-violet-400",
  teal: "hover:border-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/30 hover:text-teal-700 dark:hover:text-teal-400",
  orange: "hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30 hover:text-orange-700 dark:hover:text-orange-400",
  gray: "hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/30 hover:text-gray-700 dark:hover:text-gray-400"
};

function getStoredCategories() {
  try {
    const stored = localStorage.getItem("dev_categories");
    if (stored) {
      return JSON.parse(stored).map((name) => {
        const found = DEFAULT_CATS.find((c) => c.name === name);
        return found || { name, emoji: "📁", color: "gray" };
      });
    }
  } catch (e) {}
  return DEFAULT_CATS;
}

export const categories = [
{ name: "الكل", emoji: "📚", color: "primary" },
...getStoredCategories()];


export default function CategoryChip({ category, isActive, onClick }) {
  const colorClass = COLOR_MAP[category.color] || COLOR_MAP.gray;

  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      whileHover={{ y: -2 }}
      onClick={() => onClick?.(category.name)}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap border transition-all duration-200 shrink-0 hidden ${
      isActive ?
      "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/25" :
      `border-border bg-card text-muted-foreground hover:shadow-md ${colorClass}`}`
      }>
      
      <span className="text-base">{category.emoji}</span>
      <span>{category.name}</span>
    </motion.button>);

}