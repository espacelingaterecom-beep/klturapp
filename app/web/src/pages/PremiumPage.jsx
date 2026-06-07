import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { CheckCircle2, Award, Zap, BarChart3, Headphones, Star, Music, Users, ShieldCheck, Rocket } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { supabase } from '@/lib/supabaseClient.js';
import { Link } from 'react-router-dom';

const PremiumPage = () => {
  const { currentUser, isPremium, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);

  const handlePayment = async (type, amount) => {
    if (!isAuthenticated) {
      toast.error('Connectez-vous pour devenir premium');
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('subscription_requests')
        .insert([{
          user_id: currentUser.id,
          type,
          amount,
          status: 'pending'
        }]);

      if (error) throw error;

      toast.success('Demande envoyée ! Veuillez procéder au paiement.');

      const offerName = type === 'artist_premium' ? 'Artiste Premium (10.000 CFA)' :
                        type === 'artist' ? 'Artiste Standard (5.000 CFA)' :
                        'Auditeur Premium (3.000 CFA)';

      const message = encodeURIComponent(`Bonjour KLTUR RAP, je souhaite activer l'offre ${offerName}. Mon ID: ${currentUser.id}`);
      window.open(`https://wa.me/qr/RXPRJWAHFIXRP1?text=${message}`, '_blank');

    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de l\'envoi de la demande.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Offres Premium - KLTUR RAP</title>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-[#050505]">
        <Header />

        <main className="flex-grow py-20 px-4 sm:px-6 lg:px-8 overflow-hidden relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#D4AF37]/10 via-transparent to-transparent pointer-events-none" />

          <div className="max-w-7xl mx-auto relative z-10">
            
            <div className="text-center max-w-3xl mx-auto mb-16">
               <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-5xl md:text-6xl font-black text-white uppercase tracking-tight mb-6">
                 CHOISISSEZ VOTRE <span className="text-[#D4AF37] gold-glow-text">STATUT</span>
               </motion.h1>
               <p className="text-xl text-white/70">
                 Des offres adaptées à chaque profil pour faire rayonner la culture Hip-Hop.
               </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">

              {/* AUDITEUR PREMIUM */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex">
                <div className="bg-[#0a0a0a] rounded-3xl border border-white/5 p-8 flex flex-col w-full hover:border-blue-500/30 transition-all duration-500">
                  <div className="mb-8">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6 border border-blue-500/20">
                       <Users className="w-6 h-6 text-blue-400" />
                    </div>
                    <h2 className="text-2xl font-black text-white uppercase mb-1">Auditeur Premium</h2>
                    <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Le soutien des fans</p>
                    <div className="mt-6 flex items-end gap-2">
                      <span className="text-4xl font-black text-blue-400">3000</span>
                      <span className="text-sm text-white/40 font-bold mb-1">CFA / mois</span>
                    </div>
                  </div>

                  <ul className="space-y-4 mb-10 flex-grow text-sm">
                    <li className="flex items-center gap-3 text-white/70 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" /> Écoute illimitée HD
                    </li>
                    <li className="flex items-center gap-3 text-white/70 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" /> Mode Hors-ligne
                    </li>
                    <li className="flex items-center gap-3 text-white/70 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" /> Aucune publicité
                    </li>
                    <li className="flex items-center gap-3 text-white/70 font-medium font-bold text-blue-400">
                      <Star className="w-4 h-4 fill-current shrink-0" /> 50% reversé aux artistes
                    </li>
                  </ul>

                  <Button
                    onClick={() => handlePayment('auditor', 3000)}
                    disabled={loading}
                    variant="outline"
                    className="w-full h-14 border-blue-500/50 text-blue-400 hover:bg-blue-500 hover:text-white transition-all font-black uppercase text-xs"
                  >
                    S'abonner
                  </Button>
                </div>
              </motion.div>

              {/* ARTISTE STANDARD */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex">
                <div className="bg-[#0a0a0a] rounded-3xl border border-[#D4AF37]/30 p-8 flex flex-col w-full hover:border-[#D4AF37]/60 transition-all duration-500 relative">
                  <div className="mb-8">
                    <div className="w-12 h-12 bg-[#D4AF37]/10 rounded-xl flex items-center justify-center mb-6 border border-[#D4AF37]/20">
                       <Music className="w-6 h-6 text-[#D4AF37]" />
                    </div>
                    <h2 className="text-2xl font-black text-white uppercase mb-1">Artiste Standard</h2>
                    <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Pour débuter</p>
                    <div className="mt-6 flex items-end gap-2">
                      <span className="text-4xl font-black text-white">5000</span>
                      <span className="text-sm text-white/40 font-bold mb-1">CFA / mois</span>
                    </div>
                  </div>

                  <ul className="space-y-4 mb-10 flex-grow text-sm">
                    <li className="flex items-center gap-3 text-white/70 font-medium text-[#D4AF37]">
                      <Award className="w-4 h-4 shrink-0" /> Badge Vérifié (Or)
                    </li>
                    <li className="flex items-center gap-3 text-white/70 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0" /> Publication illimitée
                    </li>
                    <li className="flex items-center gap-3 text-white/70 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0" /> Suivi des écoutes
                    </li>
                    <li className="flex items-center gap-3 text-white/70 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0" /> Paiement aux écoutes
                    </li>
                  </ul>

                  <Button
                    onClick={() => handlePayment('artist', 5000)}
                    disabled={loading}
                    className="w-full h-14 bg-white text-black hover:bg-[#D4AF37] transition-all font-black uppercase text-xs"
                  >
                    Activer
                  </Button>
                </div>
              </motion.div>

              {/* ARTISTE PREMIUM */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex">
                <div className="bg-[#0a0a0a] rounded-3xl border-2 border-[#D4AF37] p-8 flex flex-col w-full gold-glow relative">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#D4AF37] text-black text-[10px] font-black uppercase px-4 py-1 rounded-full whitespace-nowrap">Propulsion Maximale</div>

                  <div className="mb-8">
                    <div className="w-12 h-12 bg-[#D4AF37] rounded-xl flex items-center justify-center mb-6">
                       <Rocket className="w-6 h-6 text-black" />
                    </div>
                    <h2 className="text-2xl font-black text-white uppercase mb-1">Artiste Premium</h2>
                    <p className="text-[#D4AF37] text-[10px] font-black uppercase tracking-[0.2em]">Offre Élite</p>
                    <div className="mt-6 flex items-end gap-2">
                      <span className="text-4xl font-black text-[#D4AF37]">10 000</span>
                      <span className="text-sm text-white/40 font-bold mb-1">CFA / mois</span>
                    </div>
                  </div>

                  <ul className="space-y-4 mb-10 flex-grow text-sm">
                    <li className="flex items-center gap-3 text-white font-bold">
                      <Zap className="w-4 h-4 text-[#D4AF37] fill-current shrink-0" /> Tout de l'offre Standard
                    </li>
                    <li className="flex items-center gap-3 text-white/70 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0" /> Mise en avant (Top Galerie)
                    </li>
                    <li className="flex items-center gap-3 text-white/70 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0" /> Playlists officielles
                    </li>
                    <li className="flex items-center gap-3 text-white/70 font-medium font-bold text-[#D4AF37]">
                      <BarChart3 className="w-4 h-4 shrink-0" /> Stats avancées (Vues/Jours)
                    </li>
                    <li className="flex items-center gap-3 text-white/70 font-medium">
                      <Headphones className="w-4 h-4 text-[#D4AF37] shrink-0" /> Support Prioritaire
                    </li>
                  </ul>

                  <Button
                    onClick={() => handlePayment('artist_premium', 10000)}
                    disabled={loading}
                    className="w-full h-14 bg-[#D4AF37] text-black hover:bg-[#b5952f] transition-all font-black uppercase text-xs"
                  >
                    Passer à l'Élite
                  </Button>
                </div>
              </motion.div>

            </div>

            <div className="mt-20 text-center">
               <p className="text-white/30 text-xs italic mb-8 uppercase tracking-widest font-black">Méthodes de paiement acceptées : Orange Money & Moov Money</p>
               <a
                  href="https://wa.me/qr/RXPRJWAHFIXRP1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 px-8 h-14 bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 rounded-2xl font-bold hover:bg-[#25D366]/20 transition-all text-sm uppercase tracking-wider"
                >
                  <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" className="w-5 h-5" alt="" />
                  Besoin d'assistance ? WhatsApp
                </a>
            </div>

          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default PremiumPage;