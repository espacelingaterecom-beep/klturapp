import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { CheckCircle2, Award, Zap, BarChart3, Headphones, Star } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext.jsx';
import apiServerClient from '@/lib/apiServerClient.js';
import { Link } from 'react-router-dom';

const PremiumPage = () => {
  const { currentUser, isPremium, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    if (!isAuthenticated) {
      toast.error('Connectez-vous pour devenir premium');
      return;
    }
    
    setLoading(true);
    try {
      const data = await apiServerClient('/orange-money/initiate-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, amount: 5000 })
      });

      if (data.paymentUrl) {
        window.open(data.paymentUrl, '_blank');
        toast.info('Redirection vers Orange Money. Une fois payé, votre compte sera automatiquement mis à jour.');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Erreur lors de l\'initialisation du paiement');
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
          {/* Background Glows */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#D4AF37]/10 via-transparent to-transparent pointer-events-none" />

          <div className="max-w-7xl mx-auto relative z-10">
            
            {isPremium ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl mx-auto bg-[#0a0a0a] rounded-2xl border border-[#D4AF37] p-12 text-center shadow-[0_0_50px_rgba(212,175,55,0.1)]"
              >
                <Award className="w-24 h-24 text-[#D4AF37] mx-auto mb-6 drop-shadow-[0_0_15px_rgba(212,175,55,0.5)]" />
                <h1 className="text-4xl font-black text-white uppercase mb-4">Vous êtes <span className="text-[#D4AF37]">Premium</span></h1>
                <p className="text-white/70 text-lg mb-8">Merci de faire partie de l'élite de KLTUR RAP. Profitez de tous vos avantages exclusifs sur la plateforme.</p>
                <Button asChild className="h-14 px-8 bg-[#D4AF37] text-black hover:bg-[#b5952f] font-bold text-lg">
                  <Link to="/dashboard">Accéder au Dashboard</Link>
                </Button>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
                  <h1 className="text-5xl md:text-6xl font-black text-white uppercase tracking-tight mb-6 leading-none">
                    Certifiez votre compte <span className="text-[#D4AF37] gold-glow-text">KLTUR RAP</span>
                  </h1>
                  <p className="text-xl text-white/70 mb-10 leading-relaxed">
                    Passez au niveau supérieur. Le programme Premium donne aux artistes indépendants les outils pour briller et monétiser leur passion.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
                    {benefits.map((b, i) => (
                      <div key={i} className="flex gap-4">
                        <div className="mt-1 bg-[#111] p-3 rounded-xl border border-[#333] shrink-0 h-fit">{b.icon}</div>
                        <div>
                          <h3 className="font-bold text-white mb-1">{b.title}</h3>
                          <p className="text-sm text-white/50 leading-relaxed">{b.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Testimonial */}
                  <div className="bg-[#111] border-l-4 border-[#D4AF37] p-6 rounded-r-xl relative">
                    <Star className="absolute top-4 right-4 w-12 h-12 text-[#D4AF37]/10" />
                    <p className="text-white/80 italic font-medium mb-4 relative z-10">"Depuis que j'ai pris le compte Premium, mes projets remontent en haut de la galerie et mes vues ont triplé. C'est un indispensable pour la visibilité."</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#222] flex items-center justify-center font-bold text-[#D4AF37]">M</div>
                      <div>
                        <p className="text-sm font-bold text-white uppercase">Malko Trap</p>
                        <p className="text-xs text-[#D4AF37] font-bold flex items-center gap-1"><Award className="w-3 h-3"/> Artiste Certifié</p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
                  <div className="bg-[#0a0a0a] rounded-3xl border border-[#D4AF37]/30 p-8 md:p-12 relative overflow-hidden group hover:border-[#D4AF37] transition-all duration-500">
                    <div className="absolute top-0 right-0 bg-[#D4AF37] text-black text-xs font-bold uppercase tracking-wider py-1.5 px-4 rounded-bl-xl z-20">Recommandé</div>
                    
                    <div className="relative z-10 text-center mb-8">
                      <h2 className="text-3xl font-black text-white uppercase mb-2">Passe Premium</h2>
                      <p className="text-white/50 font-medium">Abonnement annuel</p>
                      <div className="mt-6 flex items-end justify-center gap-2">
                        <span className="text-5xl font-black text-[#D4AF37]">5000</span>
                        <span className="text-xl text-white/50 font-bold mb-1">FCFA / an</span>
                      </div>
                    </div>

                    <ul className="space-y-4 mb-10">
                      {['Badge doré sur votre profil', 'Mise en avant dans la galerie', 'Upload illimité de projets', 'Statistiques détaillées', 'Support direct sur WhatsApp'].map((feat, i) => (
                        <li key={i} className="flex items-center gap-3 text-white/80 font-medium">
                          <CheckCircle2 className="w-5 h-5 text-[#D4AF37] shrink-0" />
                          {feat}
                        </li>
                      ))}
                    </ul>

                    <Button 
                      onClick={handlePayment} 
                      disabled={loading}
                      className="w-full h-16 bg-[#D4AF37] text-black hover:bg-[#b5952f] transition-all font-black text-lg uppercase tracking-wider animate-gold-pulse relative overflow-hidden"
                    >
                      {loading ? 'Redirection...' : 'Payer avec Orange Money'}
                    </Button>
                    <p className="text-center text-xs text-white/40 mt-4">Paiement sécurisé. Activation immédiate après confirmation.</p>
                  </div>
                </motion.div>
              </div>
            )}

          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default PremiumPage;