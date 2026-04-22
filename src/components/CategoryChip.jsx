const DEFAULT_CATS = [
{ name: "القرآن وعلومه", emoji: "📖" },
{ name: "الحديث الشريف", emoji: "📜" },
{ name: "الفقه الإسلامي", emoji: "⚖️" },
{ name: "السيرة النبوية", emoji: "🕌" },
{ name: "العقيدة", emoji: "💎" },
{ name: "التزكية والرقائق", emoji: "🌿" },
{ name: "التاريخ الإسلامي", emoji: "🏛️" },
{ name: "أخرى", emoji: "📁" }];


function getStoredCategories() {
  try {
    const stored = localStorage.getItem("dev_categories");
    if (stored) {
      return JSON.parse(stored).map((name) => {
        const found = DEFAULT_CATS.find((c) => c.name === name);
        return found || { name, emoji: "📁" };
      });
    }
  } catch (e) {}
  return DEFAULT_CATS;
}

export const categories = [
{ name: "الكل", emoji: "📚" },
...getStoredCategories()];


export default function CategoryChip({ category, isActive, onClick }) {
  return (
    <button
      onClick={() => onClick(category.name)} className="bg-card text-muted-foreground px-4 py-2 text-sm font-extrabold text-left normal-case rounded-full flex items-center gap-2 whitespace-nowrap transition-all duration-200 border border-border hover:text-foreground hover:border-primary/30">




      
      
      <span className="text-[#24e5e5] hidden">{category.emoji}</span>
      {category.name}
    </button>);

}