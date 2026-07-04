import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { getChannelTypeInfo } from "@/components/dev/DevSocialChannels";
import { ExternalLink, Share2, ChevronLeft } from "lucide-react";

export default function SocialChannelsSection() {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.SocialChannel.filter({ visible: true })
      .then((data) => setChannels((data || []).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (channels.length === 0) return null;

  const handleShare = async (ch) => {
    if (navigator.share) {
      try {
        await navigator.share({ title: ch.name, url: ch.url });
      } catch (e) {}
    } else {
      try {
        await navigator.clipboard.writeText(ch.url);
        toast.success("تم نسخ الرابط");
      } catch (e) {}
    }
  };

  return (
    <section className="px-4 sm:px-6 lg:px-8 py-8 max-w-6xl mx-auto" dir="rtl">
      <div className="text-center mb-6">
        <h2 className="text-xl font-black mb-1">قنواتنا على التواصل الاجتماعي</h2>
        <p className="text-sm text-muted-foreground">تابعنا وتواصل معنا عبر منصاتنا</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {channels.map((ch) => {
          const typeInfo = getChannelTypeInfo(ch.channel_type);
          const Icon = typeInfo.icon;
          return (
            <motion.div
              key={ch.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center text-center hover:shadow-lg transition-shadow group"
            >
              <div className={`w-14 h-14 rounded-2xl ${typeInfo.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                {ch.icon_url
                  ? <img src={ch.icon_url} alt={ch.name} className="w-full h-full rounded-2xl object-cover" />
                  : <Icon className={`w-7 h-7 ${typeInfo.color}`} />}
              </div>
              <p className="text-sm font-bold mb-1 truncate w-full">{ch.name}</p>
              {ch.description && <p className="text-[10px] text-muted-foreground line-clamp-2 mb-3">{ch.description}</p>}
              <div className="flex gap-1.5 mt-auto">
                <a href={ch.url} target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1 bg-primary text-primary-foreground text-xs font-medium px-3 py-2 rounded-lg hover:bg-primary/90 transition-colors">
                  فتح <ExternalLink className="w-3 h-3" />
                </a>
                <button onClick={() => handleShare(ch)}
                  className="flex items-center justify-center w-9 h-9 rounded-lg border border-border hover:bg-muted transition-colors">
                  <Share2 className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}