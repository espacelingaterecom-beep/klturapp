import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Award, Share2, Facebook, Twitter, ChevronLeft, Users, Clock, Info } from 'lucide-react';
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

const EventDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useAuth();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showRegModal, setShowRegModal] = useState(false);

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

        // Map data
        const mappedEvent = {
          ...data,
          expand: {
            organizerId: data.profiles
          }
        };
        setEvent(mappedEvent);
      } catch (err) {
        console.error(err);
        toast.error('Événement introuvable.');
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
    window.scrollTo(0, 0);
  }, [id]);

  const handleRegisterClick = () => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
    } else {
      setShowRegModal(true);
    }
  };

  const handleShare = (platform) => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Ne manquez pas "${event?.title}" sur KLTUR RAP !`);
    if (platform === 'facebook') window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
    if (platform === 'twitter') window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
    if (platform === 'copy') {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Lien copié !");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col">
        <Header />
        <main className="flex-grow py-12 px-4 max-w-7xl mx-auto w-full">
          <Skeleton className="h-[600px] w-full bg-[#111] rounded-2xl"/>
        </main>
        <Footer />
      </div>
    );
  }

  if (!event) return (
    <div className="min-h-screen bg-[#050505] flex flex-col">
      <Header />
      <div className="flex-grow flex flex-col items-center justify-center text-center p-4">
        <Info className="w-16 h-16 text-white/20 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Événement introuvable</h2>
        <p className="text-white/50 mb-8">Cet événement n'existe pas ou a été supprimé.</p>
        <Button asChild className="bg-[#D4AF37] text-black hover:bg-[#b5952f]">
          <Link to="/evenements">Retour aux événements</Link>
        </Button>
      </div>
      <Footer />
    </div>
  );

  const organizer = event.expand?.organizerId;
  const eventDate = new Date(event.date);

  return (
    <>
      <Helmet>
        <title>{event.title} - Événements - KLTUR RAP</title>
      </Helmet>

      <LoginPromptModal isOpen={showLoginPrompt} onClose={() => setShowLoginPrompt(false)} />
      {showRegModal && <EventRegistrationModal isOpen={showRegModal} onClose={() => setShowRegModal(false)} event={event} />}

      <div className="min-h-screen flex flex-col bg-[#050505]">
        <Header />

        <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          <Link to="/evenements" className="inline-flex items-center text-white/50 hover:text-[#D4AF37] mb-8 transition-colors group">
            <ChevronLeft className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" /> Retour à la liste
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

            {/* Left Column: Image & Main Info */}
            <div className="lg:col-span-2 space-y-8">
              <div className="relative rounded-3xl overflow-hidden border border-[#222] bg-[#0a0a0a] shadow-2xl">
                <img
                  src={getFileUrl('covers', event.image || event.image_url)}
                  alt={event.title}
                  className="w-full aspect-video object-cover"
                />
                <div className="absolute top-6 left-6 bg-[#D4AF37] text-black text-sm font-black uppercase tracking-widest px-4 py-2 rounded-xl shadow-lg">
                  {event.event_type || 'Événement'}
                </div>
              </div>

              <div className="space-y-6">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight uppercase tracking-tight">
                  {event.title}
                </h1>

                <div className="flex flex-wrap gap-6 items-center py-6 border-y border-[#222]">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-[#111] rounded-2xl border border-[#222] text-[#D4AF37]">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Date</p>
                      <p className="text-white font-bold">{eventDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-[#111] rounded-2xl border border-[#222] text-[#D4AF37]">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Heure</p>
                      <p className="text-white font-bold">{event.time || eventDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-[#111] rounded-2xl border border-[#222] text-[#D4AF37]">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Lieu</p>
                      <p className="text-white font-bold">{event.location}</p>
                    </div>
                  </div>
                </div>

                <div className="prose prose-invert max-w-none">
                  <h3 className="text-xl font-bold text-white mb-4">À propos de cet événement</h3>
                  <p className="text-white/70 text-lg leading-relaxed whitespace-pre-wrap">
                    {event.description || "Aucune description détaillée n'est disponible pour cet événement."}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Sidebar / Actions */}
            <div className="space-y-8">
              <div className="bg-[#0a0a0a] rounded-3xl border border-[#222] p-8 space-y-8 sticky top-24">
                <div className="space-y-4">
                  <Button
                    onClick={handleRegisterClick}
                    className="w-full h-16 bg-[#D4AF37] text-black hover:bg-[#b5952f] font-black text-lg uppercase tracking-wider rounded-2xl gold-glow"
                  >
                    Je m'inscris
                  </Button>
                  <p className="text-center text-[10px] text-white/40 font-bold uppercase tracking-widest">Inscription gratuite et rapide</p>
                </div>

                <div className="pt-8 border-t border-[#222]">
                  <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-4">Organisé par</p>
                  <Link to={`/profil/${organizer?.id}`} className="flex items-center gap-4 group">
                    <Avatar className="w-14 h-14 border-2 border-[#222] group-hover:border-[#D4AF37]/50 transition-all">
                      <AvatarImage src={organizer?.avatar ? getFileUrl('avatars', organizer.avatar) : getFileUrl('avatars', organizer?.profilePhoto)} />
                      <AvatarFallback className="bg-[#111] text-[#D4AF37] font-black uppercase">
                        {organizer?.username?.charAt(0) || organizer?.name?.charAt(0) || 'O'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-white font-black uppercase group-hover:text-[#D4AF37] transition-colors flex items-center gap-1.5">
                        {organizer?.username || organizer?.name || 'Organisateur'}
                        {organizer?.is_premium && <Award className="w-4 h-4 fill-[#D4AF37] text-[#D4AF37]" />}
                      </p>
                      <p className="text-xs text-white/40 font-bold uppercase tracking-widest">{organizer?.user_role || 'Artiste / Organisateur'}</p>
                    </div>
                  </Link>
                </div>

                <div className="pt-8 border-t border-[#222] grid grid-cols-2 gap-4">
                  <div className="bg-[#111] p-4 rounded-2xl border border-[#222] text-center">
                    <Users className="w-5 h-5 mx-auto mb-2 text-white/20" />
                    <p className="text-lg font-black text-white">Public</p>
                    <p className="text-[10px] text-white/40 uppercase font-bold tracking-tighter">Accessibilité</p>
                  </div>
                  <div className="bg-[#111] p-4 rounded-2xl border border-[#222] text-center">
                    <Award className="w-5 h-5 mx-auto mb-2 text-white/20" />
                    <p className="text-lg font-black text-white">Certifié</p>
                    <p className="text-[10px] text-white/40 uppercase font-bold tracking-tighter">KLTUR RAP</p>
                  </div>
                </div>

                <div className="pt-8 border-t border-[#222]">
                  <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-4">Partager l'événement</p>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handleShare('facebook')} className="flex-1 bg-transparent border-[#222] hover:bg-blue-600 hover:border-blue-600 group">
                      <Facebook className="w-5 h-5 text-white" />
                    </Button>
                    <Button variant="outline" onClick={() => handleShare('twitter')} className="flex-1 bg-transparent border-[#222] hover:bg-sky-500 hover:border-sky-500 group">
                      <Twitter className="w-5 h-5 text-white" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="flex-1 bg-transparent border-[#222] hover:border-[#D4AF37] hover:text-[#D4AF37]">
                          <Share2 className="w-5 h-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-[#111] border-[#333] text-white">
                        <DropdownMenuItem onClick={() => handleShare('copy')} className="cursor-pointer">Copier le lien</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent('Check out this event: ' + window.location.href)}`, '_blank')} className="cursor-pointer">WhatsApp</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
