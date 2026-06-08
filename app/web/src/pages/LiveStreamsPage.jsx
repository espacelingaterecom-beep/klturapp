import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Play, Users, Radio, Award, ShieldCheck, Trophy, ChevronRight, Mic2 } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase, getPublicImageUrl } from '@/lib/supabaseClient.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Link, useNavigate } from 'react-router-dom';

const LiveStreamsPage = () => {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated, isPremium } = useAuth();
  const [lives, setLives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [liveTitle, setLiveTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchLives = async () => {
      try {
        const { data, error } = await supabase
          .from('live_streams')
          .select('*, profiles:artist_id(*)')
          .eq('status', 'live')
          .order('viewer_count', { ascending: false });

        if (error) throw error;
        setLives(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLives();
  }, []);

  const handleStartLiveClick = () => {
    if (!isAuthenticated) {
      toast.error("Connectez-vous pour lancer un direct");
      return;
    }
    if (!isPremium) {
      toast.error("Le Live Streaming est réservé aux membres Premium");
      navigate('/premium');
      return;
    }
    setShowCreateModal(true);
  };

  const handleCreateLive = async () => {
    if (!liveTitle.trim()) return toast.error("Donnez un titre à votre direct");

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('live_streams')
        .insert([{
          artist_id: currentUser.id,
          title: liveTitle.trim(),
          status: 'live',
          viewer_count: 0
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success("Direct initialisé !");
      navigate(`/live/${data.id}/diffuser`);
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la création du direct");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getBadge = (user) => {
    if (user?.subscription_type === 'artist_premium') {
      return <Trophy className="w-3.5 h-3.5 text-[#D4AF37] drop-shadow-[0_0_5px_rgba(212,175,55,0.8)]" />;
    }
    if (user?.subscription_type === 'artist' || (user?.is_premium && !user?.subscription_type)) {
      return <Award className="w-3.5 h-3.5 text-[#D4AF37]" />;
    }
    if (user?.subscription_type === 'auditor') {
      return <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />;
    }
    return null;
  };

  return (
    <>
      <Helmet><title>Directs - KLTUR RAP</title></Helmet>
      <div className="min-h-screen flex flex-col bg-[#050505] text-white">
        <Header />

        <main className="flex-grow py-12 px-4 max-w-7xl mx-auto w-full">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-16 bg-[#0a0a0a] p-10 rounded-[40px] border border-[#222] relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-[100px] -mr-32 -mt-32" />
             <div className="relative z-10 text-center md:text-left">
                <div className="inline-flex items-center gap-2 bg-red-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 animate-pulse">
                   <Radio className="w-3 h-3" /> En Direct
                </div>
                <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4">
                  KLTUR <span className="text-red-500">LIVE</span>
                </h1>
                <p className="text-white/60 text-lg max-w-xl font-medium">
                  Vivez les concerts, sessions studio et interviews de vos artistes préférés en temps réel.
                </p>
             </div>
             <div className="relative z-10">
                <Button
                  onClick={handleStartLiveClick}
                  className="bg-white text-black hover:bg-red-500 hover:text-white h-16 px-10 rounded-2xl font-black uppercase tracking-widest transition-all"
                >
                  Lancer mon Direct
                </Button>
             </div>
          </div>

          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogContent className="bg-[#0a0a0a] border-[#222] text-white">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black uppercase tracking-tighter text-red-500">Nouveau Direct</DialogTitle>
                <DialogDescription className="text-white/40">
                  Préparez votre audience ! Donnez un titre percutant à votre live.
                </DialogDescription>
              </DialogHeader>

              <div className="py-6 space-y-6">
                 <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-white/40">Titre du Live</Label>
                    <Input
                      value={liveTitle}
                      onChange={(e) => setLiveTitle(e.target.value)}
                      className="bg-[#111] border-[#222] h-14 focus:border-red-500 text-lg font-bold"
                      placeholder="Ex: Session Freestyle en Direct !"
                    />
                 </div>
                 <div className="bg-red-500/5 border border-red-500/10 p-4 rounded-xl">
                    <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest mb-1">Rappel</p>
                    <p className="text-xs text-white/60 leading-relaxed">
                       Assurez-vous d'avoir une bonne connexion internet et de respecter les règles de la communauté.
                    </p>
                 </div>
              </div>

              <DialogFooter>
                 <Button variant="ghost" onClick={() => setShowCreateModal(false)} className="text-white/40">Annuler</Button>
                 <Button
                   onClick={handleCreateLive}
                   disabled={isSubmitting}
                   className="bg-red-500 text-white hover:bg-red-600 font-black uppercase px-8 h-12"
                 >
                   {isSubmitting ? 'Initialisation...' : 'Commencer le Live'}
                 </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <section className="space-y-10">
            <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
               <Mic2 className="w-8 h-8 text-red-500" /> Directs en cours
            </h2>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1,2,3].map(i => <Skeleton key={i} className="aspect-video rounded-3xl bg-[#0a0a0a]" />)}
              </div>
            ) : lives.length === 0 ? (
              <div className="text-center py-40 bg-[#0a0a0a] rounded-[40px] border border-[#222] border-dashed">
                 <Radio className="w-16 h-16 text-white/5 mx-auto mb-6" />
                 <h3 className="text-xl font-bold text-white/20 uppercase tracking-widest">Aucun direct pour le moment</h3>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {lives.map(live => (
                  <Link key={live.id} to={`/live/${live.id}`}>
                    <motion.div whileHover={{ y: -10 }} className="group relative aspect-video bg-[#0a0a0a] rounded-3xl overflow-hidden border border-[#222] hover:border-red-500 transition-all shadow-2xl">
                       <img src={getPublicImageUrl('covers', live.profiles?.profilePhoto)} className="w-full h-full object-cover opacity-50 blur-sm group-hover:opacity-100 group-hover:blur-0 transition-all duration-700" alt="" />

                       <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-colors" />

                       <div className="absolute top-4 left-4 flex gap-2">
                          <span className="bg-red-500 text-white px-3 py-1 rounded-full text-[8px] md:text-[10px] font-black uppercase shadow-lg">En Direct</span>
                          <span className="bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-[8px] md:text-[10px] font-black uppercase flex items-center gap-1.5 border border-white/10">
                             <Users className="w-3 h-3 text-red-500" /> {live.viewer_count}
                          </span>
                       </div>

                       <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-white shadow-[0_0_30px_rgba(239,68,68,0.4)]">
                             <Play className="w-8 h-8 fill-current ml-1" />
                          </div>
                       </div>

                       <div className="absolute bottom-6 left-6 right-6 flex items-center gap-4">
                          <Avatar className="h-10 w-10 md:h-12 md:w-12 border-2 border-white/20">
                             <AvatarImage src={getPublicImageUrl('avatars', live.profiles?.avatar)} />
                             <AvatarFallback className="bg-[#111] text-white font-black">{live.profiles?.username?.[0]}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                             <h4 className="font-black text-white text-base md:text-lg truncate flex items-center gap-1.5">
                                {live.title}
                                {getBadge(live.profiles)}
                             </h4>
                             <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider">@{live.profiles?.username}</p>
                          </div>
                       </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default LiveStreamsPage;