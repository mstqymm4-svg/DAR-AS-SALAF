import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { HardDrive, BookOpen, Image, FileText, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function DevStorage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const all = await base44.entities.Book.list('-created_date', 1000);
    setBooks(all);
    setLoading(false);
  };

  const withPdf    = books.filter(b => b.pdf_url);
  const withCover  = books.filter(b => b.cover_image);
  const withBoth   = books.filter(b => b.pdf_url && b.cover_image);
  const incomplete = books.filter(b => !b.pdf_url);

  const StatBar = ({ label, count, total, color }) => (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="font-medium text-muted-foreground">{label}</span>
        <span className="font-mono font-bold">{count}/{total}</span>
      </div>
      <div className="h-2.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-700`}
          style={{ width: total > 0 ? `${Math.round((count/total)*100)}%` : "0%" }} />
      </div>
      <p className="text-[10px] text-muted-foreground text-left">{total > 0 ? `${Math.round((count/total)*100)}%` : "0%"}</p>
    </div>
  );

  return (
    <div className="space-y-5" dir="rtl">
      {/* Overview */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm flex items-center gap-2"><HardDrive className="w-4 h-4 text-primary" /> نظرة عامة على التخزين</h3>
          <button onClick={loadData} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><RefreshCw className="w-3.5 h-3.5 text-muted-foreground" /></button>
        </div>
        {loading
          ? <div className="flex justify-center py-8"><div className="w-6 h-6 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
          : (
            <div className="space-y-4">
              <StatBar label="كتب بملف PDF"   count={withPdf.length}   total={books.length} color="bg-green-500" />
              <StatBar label="كتب بصورة غلاف" count={withCover.length} total={books.length} color="bg-blue-500" />
              <StatBar label="كتب مكتملة"     count={withBoth.length}  total={books.length} color="bg-primary" />
            </div>
          )
        }
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
            <FileText className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-xl font-black">{loading ? "..." : withPdf.length}</p>
            <p className="text-xs text-muted-foreground">ملف PDF</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
            <Image className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xl font-black">{loading ? "..." : withCover.length}</p>
            <p className="text-xs text-muted-foreground">صورة غلاف</p>
          </div>
        </div>
      </div>

      {/* Incomplete Books */}
      {!loading && incomplete.length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-bold text-sm text-amber-600">⚠ كتب بدون PDF ({incomplete.length})</h3>
          </div>
          <div className="divide-y divide-border max-h-64 overflow-y-auto">
            {incomplete.map(book => (
              <div key={book.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className="w-8 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                  {book.cover_image ? <img src={book.cover_image} alt="" className="w-full h-full object-cover" /> : <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{book.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{book.author}</p>
                </div>
                <span className="text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full shrink-0">بدون PDF</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}