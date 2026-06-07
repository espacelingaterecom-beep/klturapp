import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { CheckCircle2, Award, Zap, BarChart3, Headphones, Star, Music, Users, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { supabase } from '@/lib/supabaseClient.js';
import apiServerClient from '@/lib/apiServerClient.js';
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
      // 1. Create a manual request in Supabase
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

      // 2. Open WhatsApp for confirmation with details
      const message = encodeURIComponent(`Bonjour KLTUR RAP, je souhaite activer mon compte ${type === 'artist' ? 'Artiste Certifié' : 'Auditeur Premium'}. Mon ID: ${currentUser.id}`);
      window.open(`https://wa.me/qr/RXPRJWAHFIXRP1?text=${message}`, '_blank');

    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de l\'envoi de la demande. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    { icon: <Award className="w-6 h-6 text-[#D4AF37]" />, title: 'Badge Doré', desc: 'Démarquez-vous avec le badge de certification KLTUR RAP sur votre profil.' },
    { icon: <Zap className="w-6 h-6 text-[#D4AF37]" />, title: 'Mise en avant', desc: 'Vos projets apparaissent en haut de la galerie et dans les recommandations.' },
    { icon: <BarChart3 className="w-6 h-6 text-[#D4AF37]" />, title: 'Statistiques Avancées', desc: 'Analysez en détail les écoutes et téléchargements de vos sons.' },
    { icon: <Headphones className="w-6 h-6 text-[#D4AF37]" />, title: 'Support Prioritaire', desc: 'Une assistance dédiée pour vos sorties et problèmes techniques.' }
  ];

  return (
    <>
      <Helmet>
        <title>Premium - KLTUR RAP</title>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-[#050505]">
        <Header />

        <main className="flex-grow py-20 px-4 sm:px-6 lg:px-8 overflow-hidden relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#D4AF37]/10 via-transparent to-transparent pointer-events-none" />

          <div className="max-w-7xl mx-auto relative z-10">
            
            <div className="text-center max-w-3xl mx-auto mb-16">
               <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-5xl md:text-6xl font-black text-white uppercase tracking-tight mb-6">
                 Passez au <span className="text-[#D4AF37] gold-glow-text">NIVEAU SUPÉRIEUR</span>
               </motion.h1>
               <p className="text-xl text-white/70">
                 Que vous soyez un fan inconditionnel ou un artiste en pleine ascension, KLTUR RAP vous offre les meilleurs outils.
               </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch max-w-6xl mx-auto">

              {/* AUDITEUR PREMIUM */}
              <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} className="flex">
                <div className="bg-[#0a0a0a] rounded-3xl border border-white/10 p-8 md:p-12 flex flex-col w-full hover:border-[#D4AF37]/50 transition-all duration-500 relative">
                  <div className="mb-8">
                    <div className="w-14 h-14 bg-[#D4AF37]/10 rounded-2xl flex items-center justify-center mb-6 border border-[#D4AF37]/20">
                       <Users className="w-8 h-8 text-[#D4AF37]" />
                    </div>
                    <h2 className="text-3xl font-black text-white uppercase mb-2">Auditeur Premium</h2>
                    <p className="text-white/50 font-medium">Pour les vrais passionnés de culture</p>
                    <div className="mt-6 flex items-end gap-2">
                      <span className="text-5xl font-black text-[#D4AF37]">3000</span>
                      <span className="text-xl text-white/50 font-bold mb-1">FCFA / mois</span>
                    </div>
                  </div>

                  <ul className="space-y-4 mb-10 flex-grow">
                    <li className="flex items-center gap-3 text-white/80 font-medium">
                      <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                      Écoute illimitée et haute qualité
                    </li>
                    <li className="flex items-center gap-3 text-white/80 font-medium">
                      <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                      Aucune publicité (Radio & Plateforme)
                    </li>
                    <li className="flex items-center gap-3 text-white/80 font-medium">
                      <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                      Soutien direct : 50% reversé aux artistes
                    </li>
                    <li className="flex items-center gap-3 text-white/80 font-medium">
                      <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                      Téléchargement mode hors-ligne
                    </li>
                  </ul>

                  <Button
                    onClick={() => handlePayment('auditor', 3000)}
                    disabled={loading}
                    className="w-full h-16 bg-white text-black hover:bg-[#D4AF37] transition-all font-black text-lg uppercase tracking-wider"
                  >
                    {loading ? 'Redirection...' : 'S\'abonner (3000 CFA)'}
                  </Button>
                </div>
              </motion.div>

              {/* ARTISTE CERTIFIÉ */}
              <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="flex">
                <div className="bg-[#0a0a0a] rounded-3xl border-2 border-[#D4AF37] p-8 md:p-12 flex flex-col w-full gold-glow relative">
                  <div className="absolute top-0 right-0 bg-[#D4AF37] text-black text-xs font-black uppercase tracking-wider py-1.5 px-6 rounded-bl-2xl">Recommandé</div>

                  <div className="mb-8">
                    <div className="w-14 h-14 bg-[#D4AF37] rounded-2xl flex items-center justify-center mb-6">
                       <Award className="w-8 h-8 text-black" />
                    </div>
                    <h2 className="text-3xl font-black text-white uppercase mb-2">Artiste Certifié</h2>
                    <p className="text-white/50 font-medium">Pour booster votre carrière</p>
                    <div className="mt-6 flex items-end gap-2">
                      <span className="text-5xl font-black text-[#D4AF37]">5000</span>
                      <span className="text-xl text-white/50 font-bold mb-1">FCFA / mois</span>
                    </div>
                  </div>

                  <ul className="space-y-4 mb-10 flex-grow">
                    <li className="flex items-center gap-3 text-white/80 font-medium">
                      <CheckCircle2 className="w-5 h-5 text-[#D4AF37] shrink-0" />
                      Badge de certification doré
                    </li>
                    <li className="flex items-center gap-3 text-white/80 font-medium">
                      <CheckCircle2 className="w-5 h-5 text-[#D4AF37] shrink-0" />
                      Mise en avant prioritaire (Top Galerie)
                    </li>
                    <li className="flex items-center gap-3 text-white/80 font-medium">
                      <CheckCircle2 className="w-5 h-5 text-[#D4AF37] shrink-0" />
                      Statistiques d'écoutes détaillées
                    </li>
                    <li className="flex items-center gap-3 text-white/80 font-medium">
                      <CheckCircle2 className="w-5 h-5 text-[#D4AF37] shrink-0" />
                      Monétisation de vos écoutes premium
                    </li>
                    <li className="flex items-center gap-3 text-white/80 font-medium">
                      <CheckCircle2 className="w-5 h-5 text-[#D4AF37] shrink-0" />
                      Support direct équipe KLTUR
                    </li>
                  </ul>

                  <Button
                    onClick={() => handlePayment('artist', 5000)}
                    disabled={loading}
                    className="w-full h-16 bg-[#D4AF37] text-black hover:bg-[#b5952f] transition-all font-black text-lg uppercase tracking-wider"
                  >
                    {loading ? 'Redirection...' : 'Certifier mon compte'}
                  </Button>
                </div>
              </motion.div>

            </div>

            <div className="mt-20 text-center">
               <p className="text-white/30 text-sm italic mb-8">Besoin d'aide ou d'un autre mode de paiement ?</p>
               <a
                  href="https://wa.me/qr/RXPRJWAHFIXRP1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 px-8 h-14 bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 rounded-2xl font-bold hover:bg-[#25D366]/20 transition-all"
                >
                  <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" className="w-5 h-5" alt="" />
                  Contacter le support WhatsApp
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