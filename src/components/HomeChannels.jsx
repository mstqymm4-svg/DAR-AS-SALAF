import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Tv } from "lucide-react";
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

  // Auto-refresh when channels change in background
  useContentRefresh(["channels"], loadData);

  if (channels.length === 0) return null;

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Tv className="w-5 h-5 text-primary" />
          {t.videoChannels}
        </h2>
        <Link to="/videos" className="text-sm text-primary font-medium hover:underline">
          {t.viewAll}
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {channels.map((ch, i) => (
          <motion.div
            key={ch.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
          >
            <Link
              to="/videos"
              className="group block bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              <div className="aspect-video bg-gradient-to-br from-red-500/15 to-red-600/5 flex items-center justify-center relative overflow-hidden">
                {ch.channel_logo ? (
                  <SmartImage src={ch.channel_logo} alt={ch.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" fallback={() => <Tv className="w-10 h-10 text-red-500/40" />} />
                ) : (
                  <Tv className="w-10 h-10 text-red-500/40" />
                )}
              </div>
              <div className="p-3 text-center">
                <h3 className="text-sm font-bold truncate">{ch.name}</h3>
                {ch.description && <p className="text-[10px] text-muted-foreground line-clamp-2 mt-1">{ch.description}</p>}
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}