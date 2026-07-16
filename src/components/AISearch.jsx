import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, Search, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AISearch({ books, onResults, onClear }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setActive(true);

    const booksList = books.map((b, i) => `${i + 1}. العنوان: "${b.title}" | المؤلف: ${b.author} | التصنيف: ${b.category} | ID: ${b.id}`).join("\n");

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `أنت مساعد مكتبة إسلامية ذكي. المستخدم يبحث عن: "${query}"\n\nقائمة الكتب المتاحة:\n${booksList}\n\nمهمتك: ابحث في القائمة وأعد IDs الكتب المناسبة للبحث (كل ID في سطر). إذا لم يوجد شيء مناسب، أعد قائمة فارغة. أجب فقط بالـ IDs.`,
      response_json_schema: {
        type: "object",
        properties: {
          matching_ids: { type: "array", items: { type: "string" } },
          explanation: { type: "string" }
        }
      }
    });

    const matchedBooks = books.filter((b) => result.matching_ids?.includes(b.id));
    onResults(matchedBooks, result.explanation || `نتائج البحث عن: "${query}"`);
    setLoading(false);
  };

  const handleClear = () => {
    setQuery("");
    setActive(false);
    onClear();
  };

  return (
    <div className="mb-4">
      <div className="flex gap-2 hidden">
        <div className="relative flex-1">
          <Sparkles className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-accent" />
          <Input
            placeholder="اسألني عن أي موضوع ديني... (مثال: كتب عن الصلاة)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pr-10 h-12 rounded-xl bg-card border-accent/30 text-sm" />
          
        </div>
        {active ?
        <Button onClick={handleClear} variant="outline" className="h-12 px-4 rounded-xl shrink-0 gap-1">
            <X className="w-4 h-4" />
            مسح
          </Button> :

        <Button onClick={handleSearch} disabled={loading || !query.trim()} className="h-12 px-4 rounded-xl shrink-0 gap-1 bg-accent text-accent-foreground hover:bg-accent/90">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            بحث ذكي
          </Button>
        }
      </div>
      {active && !loading &&
      <div className="flex items-center gap-1.5 mt-2">
          <Sparkles className="w-3 h-3 text-accent" />
          <span className="text-xs text-muted-foreground">البحث الذكي نشط</span>
        </div>
      }
    </div>);

}