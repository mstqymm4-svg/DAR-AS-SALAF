import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Tv, PlayCircle, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useT } from "@/lib/i18n";
import { getVideoChannels } from "@/lib/offlineSync";
import { useContentRefresh } from "@/hooks/useContentSync";
import SmartImage from "./SmartImage";

export default function HomeChannels() {
  const t = useT();
  const [channels, setChannels] = useState([]);

  const loadData = () => {
    getVideoChannels()
      .then((data) => setChannels((data || []).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))))
      .catch(() => {});
  };

  useEffect(() => { loadData(); }, []);

  useContentRefresh(["channels"], loadData);

  if (channels.length === 0) return null;

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
            <Tv className="w-4 h-4 text-primary" />
          </span>
          {t.videoChannels}
        </h2>
        <Link to="/videos" className="text-sm text-primary font-bold hover:underline flex items-center gap-1 hover:gap-2 transition-all">
          {t.viewAll}
          <ArrowLeft className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Horizontal scroll on mobile, grid on desktop */}
      <div className="flex md:grid md:grid-cols-4 gap-4 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-hide snap-x snap-mandatory">
        {channels.map((ch, i) => (
          <motion.div
            key={ch.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            className="shrink-0 w-40 md:w-auto snap-start"
          >
            <Link
              to="/videos"
              className="group block bg-card border border-border rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 hover:border-primary/30 transition-all duration-300"
            >
              <div className="aspect-video bg-gradient-to-br from-red-500/15 to-primary/5 flex items-center justify-center relative overflow-hidden">
                {ch.channel_logo ? (
                  <SmartImage
                    src={ch.channel_logo}
                    alt={ch.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    fallback={() => <Tv className="w-12 h-12 text-red-500/40" />}
                  />
                ) : (
                  <Tv className="w-12 h-12 text-red-500/40" />
                )}
                {/* Play overlay on hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-all duration-300">
                  <PlayCircle className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 scale-50 group-hover:scale-100 transition-all duration-300 drop-shadow-lg" />
                </div>
              </div>
              <div className="p-3 text-center">
                <h3 className="text-sm font-bold truncate">{ch.name}</h3>
                {ch.description && (
                  <p className="text-[10px] text-muted-foreground line-clamp-2 mt-1">{ch.description}</p>
                )}
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}