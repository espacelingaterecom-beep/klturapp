import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Calendar, MapPin, Award, ChevronLeft, Share2, Facebook, Twitter, Users, Clock, Info } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import LoginPromptModal from '@/components/LoginPromptModal.jsx';
import EventRegistrationModal from '@/components/EventRegistrationModal.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { supabase } from '@/lib/supabaseClient.js';
import { motion } from 'framer-motion';

const EventDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useAuth();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showRegModal, setShowRegModal] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  const getFileUrl = (bucket, path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  };

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*, profiles:organizer_id(*)')
          .eq('id', id)
          .single();

        if (error) throw error;
        setEvent(data);
      } catch (err) {
        console.error(err);
        toast.error('Événement introuvable.');
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  const handleShare = (platform) => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Rejoignez-moi à l'événement "${event?.title}" sur KLTUR RAP !`);
    if (platform === 'facebook') window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
    if (platform === 'twitter') window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
    if (platform === 'copy') {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Lien copié !");
    }
  };

  if (loading) return <div className="min-h-screen bg-[#050505] flex flex-col"><Header /><main className="flex-grow py-12 px-4 max-w-7xl mx-auto w-full"><Skeleton className="h-[500px] w-full bg-[#111] rounded-3xl"/></main><Footer /></div>;
  if (!event) return <div className="min-h-screen bg-[#050505] flex flex-col"><Header /><div className="text-white text-center py-20 flex-grow">Événement introuvable</div><Footer /></div>;

  const organizer = event.profiles;

  return (
    <>
      <Helmet>
        <title>{event.title} - Événement KLTUR RAP</title>
      </Helmet>

      <LoginPromptModal isOpen={showLoginPrompt} onClose={() => setShowLoginPrompt(false)} />
      <EventRegistrationModal isOpen={showRegModal} onClose={() => setShowRegModal(false)} event={event} />

      <div className="min-h-screen flex flex-col bg-[#050505]">
        <Header />

        <main className="flex-grow py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/50 hover:text-[#D4AF37] mb-8 transition-colors font-bold uppercase text-xs tracking-widest">
            <ChevronLeft className="w-4 h-4" /> Retour aux événements
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-[#0a0a0a] rounded-3xl border border-[#222] overflow-hidden shadow-2xl">
                {/* Hero Image */}
                <div className="aspect-video relative overflow-hidden bg-[#111]">
                  {event.image ? (
                    <img
                      src={getFileUrl('covers', event.image)}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/10">
                      <Calendar className="w-24 h-24" />
                    </div>
                  )}
                  <div className="absolute top-6 left-6 bg-[#D4AF37] text-black px-4 py-1.5 rounded-full font-black uppercase text-xs tracking-wider shadow-lg">
                    {event.event_type || 'Événement'}
                  </div>
                </div>

                {/* Content */}
                <div className="p-8 md:p-12">
                  <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight mb-6 leading-none">
                    {event.title}
                  </h1>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                      <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] shrink-0">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-white/30 tracking-widest mb-1">Date</p>
                        <p className="text-white font-bold">{new Date(event.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                      <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] shrink-0">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-white/30 tracking-widest mb-1">Lieu</p>
                        <p className="text-white font-bold">{event.location}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <Info className="w-5 h-5 text-[#D4AF37]" /> À propos de l'événement
                    </h3>
                    <div className="relative">
                      <p className={`text-white/70 leading-relaxed whitespace-pre-wrap ${!isDescExpanded ? 'line-clamp-4 md:line-clamp-none' : ''}`}>
                        {event.description || "Aucune description détaillée fournie pour cet événement."}
                      </p>
                      {event.description && event.description.length > 200 && (
                        <button
                          onClick={() => setIsDescExpanded(!isDescExpanded)}
                          className="mt-2 text-[#D4AF37] font-bold text-xs uppercase tracking-widest md:hidden"
                        >
                          {isDescExpanded ? 'Voir moins' : 'Lire la suite'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-[#111] border-t border-[#222] flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <Button
                        onClick={() => isAuthenticated ? setShowRegModal(true) : setShowLoginPrompt(true)}
                        className="bg-[#D4AF37] text-black hover:bg-[#b5952f] font-black uppercase px-8 h-12 rounded-xl shadow-lg"
                      >
                        Participer à l'événement
                      </Button>
                   </div>

                   <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="text-white/60 hover:text-white font-bold">
                        <Share2 className="w-5 h-5 mr-2" /> Partager
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-[#111] border-[#222] text-white">
                      <DropdownMenuItem onClick={() => handleShare('facebook')} className="cursor-pointer"><Facebook className="w-4 h-4 mr-2"/> Facebook</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleShare('twitter')} className="cursor-pointer"><Twitter className="w-4 h-4 mr-2"/> Twitter</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleShare('copy')} className="cursor-pointer font-bold text-[#D4AF37]">Copier le lien</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Organizer Card */}
              <div className="bg-[#0a0a0a] rounded-3xl border border-[#222] p-8 text-center shadow-xl">
                <p className="text-[10px] font-black uppercase text-white/30 tracking-[0.2em] mb-6">Organisé par</p>
                <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-[#111] shadow-2xl">
                  <AvatarImage src={getFileUrl('avatars', organizer?.avatar || organizer?.profilePhoto)} />
                  <AvatarFallback className="bg-[#111] text-[#D4AF37] text-2xl font-bold">{organizer?.username?.charAt(0) || 'A'}</AvatarFallback>
                </Avatar>
                <div className="flex items-center justify-center gap-2 mb-1">
                  <h3 className="text-xl font-bold text-white uppercase">{organizer?.username || organizer?.name || 'KLTUR RAP'}</h3>
                  {organizer?.is_premium && <Award className="w-5 h-5 text-[#D4AF37]" title="Certifié" />}
                </div>
                <p className="text-[#D4AF37] font-bold text-xs uppercase tracking-widest mb-8">{organizer?.user_role || 'Staff'}</p>

                <Button asChild variant="outline" className="w-full border-[#222] text-white hover:bg-white hover:text-black font-bold h-12 rounded-xl transition-all">
                  <Link to={`/profil/${organizer?.id}`}>Voir le profil</Link>
                </Button>
              </div>

              {/* Event Stats */}
              <div className="bg-[#0a0a0a] rounded-3xl border border-[#222] p-8 shadow-xl">
                 <div className="space-y-6">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3 text-white/60">
                          <Users className="w-5 h-5 text-[#D4AF37]" />
                          <span className="text-sm font-bold uppercase tracking-wider">Inscrits</span>
                       </div>
                       <span className="text-white font-black">124</span>
                    </div>
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3 text-white/60">
                          <Clock className="w-5 h-5 text-[#D4AF37]" />
                          <span className="text-sm font-bold uppercase tracking-wider">Statut</span>
                       </div>
                       <span className="text-green-500 font-black uppercase text-[10px] bg-green-500/10 px-2 py-1 rounded border border-green-500/20">Ouvert</span>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default EventDetailPage;
