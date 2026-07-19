import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { BookOpen, Globe, Smartphone, Heart, ArrowLeft, Info } from "lucide-react";
import { useT } from "@/lib/i18n";

export default function About() {
  const t = useT();
  const appName = t.appName || "مكتبة الكتب الإسلامية";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}>
        
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Info className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground not-italic no-underline text-left">عن التطبيق</h1>
        </div>

        <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none">
          <p className="text-foreground leading-relaxed text-base sm:text-lg">
            تطبيق <strong>{appName}</strong> تطبيق دار العلوم صُنع لشيخ محمد هارون نور محمد المحمدي المدني 
            صُنع من قِبل ولده مستقيم محمد هارون لنشر كتب الشيخ محمد هارون ومحتواه الإسلامي 
            من خلال تطبيق يجميع بين الكتب وفيديوهات ومحاضرات الشيخ محمد هارون 
          </p>

          <p className="text-muted-foreground leading-relaxed mt-4">
            شيخ محمد هارون نور درس في الجامعة الاسلامية في المملكة العربية السعودية 
            هذا التطبيق صدقه جاريه عن جميع عن المسلمين والمسلمات الاحياء منهم والاموات 
  
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
          <div className="bg-card border border-border rounded-2xl p-5 text-center">
            <BookOpen className="w-8 h-8 text-primary mx-auto mb-2" />
            <h2 className="font-bold text-sm text-foreground">مكتبة شاملة</h2>
            <p className="text-xs text-muted-foreground mt-1">مئات الكتب الإسلامية في مختلف المجالات</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-5 text-center">
            <Globe className="w-8 h-8 text-accent mx-auto mb-2" />
            <h2 className="font-bold text-sm text-foreground">لغات متعددة</h2>
            <p className="text-xs text-muted-foreground mt-1">دعم العربية والأوردية مع عرض صحيح للحروف</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-5 text-center">
            <Smartphone className="w-8 h-8 text-primary mx-auto mb-2" />
            <h2 className="font-bold text-sm text-foreground">قراءة دون اتصال</h2>
            <p className="text-xs text-muted-foreground mt-1">حمّل كتبك واقرأها في أي وقت</p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">صُنع بعناية 


          </p>
          <Link to="/" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
            العودة للرئيسية
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        </div>
      </motion.div>
    </div>);

}