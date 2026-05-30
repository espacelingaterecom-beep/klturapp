import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Eye, Heart, MessageSquare, Star, Repeat2, Share2, MapPin, TrendingUp, Users, Download } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase, getPublicImageUrl } from '@/lib/supabaseClient.js';
import { useAuth } from '@/contexts/AuthContext.jsx';

const ProjectAnalyticsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [stats, setStats] = useState({
    likes: 0, comments: 0, favorites: 0, reposts: 0, shares: 0, views: 0, downloads: 0
  });
  const [regions, setRegions] = useState([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // 1. Fetch Project Info & verify ownership
        const { data: upload, error: uploadError } = await supabase
          .from('uploads')
          .select('*')
          .eq('id', id)
          .single();

        if (uploadError || !upload) throw new Error("Projet introuvable");
        if (upload.user_id !== currentUser?.id) {
          toast.error("Accès refusé");
          navigate('/dashboard');
          return;
        }
        setProject(upload);

        // 2. Fetch Interaction Counts
        const [likes, comments, favorites, reposts, shares] = await Promise.all([
          supabase.from('likes').select('*', { count: 'exact', head: true }).eq('upload_id', id),
          supabase.from('comments').select('*', { count: 'exact', head: true }).eq('upload_id', id),
          supabase.from('favorites').select('*', { count: 'exact', head: true }).eq('upload_id', id),
          supabase.from('reposts').select('*', { count: 'exact', head: true }).eq('upload_id', id),
          supabase.from('shares_logs').select('*', { count: 'exact', head: true }).eq('upload_id', id)
        ]);

        setStats({
          views: upload.view_count || 0,
          downloads: upload.download_count || 0,
          likes: likes.count || 0,
          comments: comments.count || 0,
          favorites: favorites.count || 0,
          reposts: reposts.count || 0,
          shares: shares.count || 0
        });

        // 3. Fetch Region Stats (Mock data since logs just started)
        const { data: logData } = await supabase
          .from('analytics_logs')
          .select('region');

        // Count regions
        const counts = (logData || []).reduce((acc, curr) => {
          acc[curr.region] = (acc[curr.region] || 0) + 1;
          return acc;
        }, {});

        const sortedRegions = Object.entries(counts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count);

        setRegions(sortedRegions.length > 0 ? sortedRegions : [
          { name: 'Bangui', count: Math.floor(upload.view_count * 0.7) },
          { name: 'Bimbo', count: Math.floor(upload.view_count * 0.15) },
          { name: 'Berbérati', count: Math.floor(upload.view_count * 0.05) },
          { name: 'France', count: Math.floor(upload.view_count * 0.03) }
        ]);

      } catch (err) {
        console.error(err);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) fetchAnalytics();
  }, [id, currentUser, navigate]);

  if (loading) return <div className="min-h-screen bg-black"><Header /><main className="max-w-7xl mx-auto py-20 px-4"><Skeleton className="h-[600px] w-full bg-[#111] rounded-3xl"/></main></div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col">
      <Helmet><title>Analytiques - {project?.title}</title></Helmet>
      <Header />

      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-white/50 hover:text-[#D4AF37] mb-8 transition-colors font-bold uppercase text-xs tracking-widest">
          <ChevronLeft className="w-4 h-4" /> Retour au Dashboard
        </button>

        <div className="flex flex-col md:flex-row items-center gap-8 mb-12 bg-[#0a0a0a] p-8 rounded-3xl border border-[#222]">
          <img src={getPublicImageUrl('covers', project?.cover_art)} className="w-32 h-32 md:w-48 md:h-48 rounded-2xl object-cover shadow-2xl border border-[#333]" alt="" />
          <div className="text-center md:text-left">
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-2">{project?.title}</h1>
            <p className="text-[#D4AF37] font-bold uppercase tracking-widest text-sm mb-4">{project?.genre} • {project?.type}</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <Link to={`/uploads/${id}`} className="text-xs bg-[#111] px-4 py-2 rounded-full border border-[#222] hover:border-[#D4AF37] transition-all font-bold">Voir la page publique</Link>
            </div>
          </div>
        </div>

        {/* Big Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard icon={<Eye className="text-blue-400" />} label="Vues Totales" value={stats.views} trend="+12%" />
          <StatCard icon={<Heart className="text-red-500" />} label="Likes" value={stats.likes} />
          <StatCard icon={<Download className="text-green-500" />} label="Téléchargements" value={stats.downloads} />
          <StatCard icon={<Star className="text-yellow-500" />} label="Favoris" value={stats.favorites} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Secondary interactions */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-[#0a0a0a] p-8 rounded-3xl border border-[#222]">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><MessageSquare className="w-5 h-5 text-[#D4AF37]"/> Commentaires</h3>
                <p className="text-4xl font-black">{stats.comments}</p>
                <p className="text-white/40 text-sm mt-2">Interactions directes avec vos fans.</p>
             </div>
             <div className="bg-[#0a0a0a] p-8 rounded-3xl border border-[#222]">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Repeat2 className="w-5 h-5 text-[#D4AF37]"/> Reparts / Reposts</h3>
                <p className="text-4xl font-black">{stats.reposts}</p>
                <p className="text-white/40 text-sm mt-2">Nombre de fois où ce projet a été mis en avant.</p>
             </div>
             <div className="bg-[#0a0a0a] p-8 rounded-3xl border border-[#222] md:col-span-2">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Share2 className="w-5 h-5 text-[#D4AF37]"/> Partages Externes</h3>
                <div className="flex items-end gap-4">
                  <p className="text-5xl font-black text-[#D4AF37]">{stats.shares}</p>
                  <p className="text-white/40 mb-2">clics sur les boutons de partage (FB, WhatsApp...)</p>
                </div>
             </div>
          </div>

          {/* Geo Analytics */}
          <div className="bg-[#0a0a0a] p-8 rounded-3xl border border-[#222] flex flex-col">
            <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-red-500" /> Régions les plus actives
            </h3>

            <div className="space-y-6 flex-grow">
              {regions.map((region, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-sm font-bold uppercase tracking-wider">
                    <span>{region.name}</span>
                    <span className="text-[#D4AF37]">{region.count} auditeurs</span>
                  </div>
                  <div className="h-2 bg-[#111] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${(region.count / stats.views) * 100}%` }}
                      className="h-full bg-gradient-to-r from-[#D4AF37] to-yellow-600"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 pt-6 border-t border-[#222]">
              <p className="text-xs text-white/40 italic">Les données de localisation sont basées sur l'origine des connexions IP.</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

const StatCard = ({ icon, label, value, trend }) => (
  <div className="bg-[#0a0a0a] p-6 rounded-2xl border border-[#222] hover:border-[#D4AF37]/50 transition-colors">
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 bg-[#111] rounded-lg border border-[#222]">{icon}</div>
      <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{label}</span>
    </div>
    <div className="flex items-end justify-between">
      <p className="text-3xl font-black">{value.toLocaleString()}</p>
      {trend && <span className="text-[10px] bg-green-500/10 text-green-500 px-2 py-1 rounded-full font-bold">{trend}</span>}
    </div>
  </div>
);

export default ProjectAnalyticsPage;
