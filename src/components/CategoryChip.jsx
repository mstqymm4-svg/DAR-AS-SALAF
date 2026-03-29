export const categories = [
  { name: "الكل", emoji: "📚" },
  { name: "القرآن وعلومه", emoji: "📖" },
  { name: "الحديث الشريف", emoji: "📜" },
  { name: "الفقه الإسلامي", emoji: "⚖️" },
  { name: "السيرة النبوية", emoji: "🕌" },
  { name: "العقيدة", emoji: "💎" },
  { name: "التزكية والرقائق", emoji: "🌿" },
  { name: "التاريخ الإسلامي", emoji: "🏛️" },
  { name: "أخرى", emoji: "📁" },
];

export default function CategoryChip({ category, isActive, onClick }) {
  return (
    <button
      onClick={() => onClick(category.name)}
      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
        isActive
          ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
          : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
      }`}
    >
      <span>{category.emoji}</span>
      {category.name}
    </button>
  );
}