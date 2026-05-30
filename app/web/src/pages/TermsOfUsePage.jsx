import React from 'react';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { motion } from 'framer-motion';

const TermsOfUsePage = () => {
  return (
    <>
      <Helmet>
        <title>Conditions d'Utilisation - KLTUR RAP</title>
      </Helmet>
      <div className="min-h-screen flex flex-col bg-[#050505] text-white">
        <Header />
        <main className="flex-grow py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-4xl font-black uppercase mb-10 text-[#D4AF37]">Conditions d'Utilisation</h1>

            <section className="space-y-8 text-white/80 leading-relaxed">
              <div>
                <h2 className="text-xl font-bold text-white mb-4 italic">1. Accès et Usage</h2>
                <p>L'accès aux contenus de KLTUR RAP est destiné à un usage strictement personnel. Toute exploitation commerciale des contenus sans autorisation préalable de l'éditeur est interdite.</p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-white mb-4 italic">2. Respect de la Communauté</h2>
                <p>KLTUR RAP est un espace de promotion culturelle. Les utilisateurs s'engagent à ne pas publier de contenus offensants, haineux ou portant atteinte à la dignité humaine. Nous nous réservons le droit de supprimer tout contenu ne respectant pas ces valeurs.</p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-white mb-4 italic">3. Paiements et Adhésions</h2>
                <p>Les adhésions Premium sont traitées via Orange Money. Les tarifs sont affichés de manière transparente. Aucun remboursement ne sera effectué après l'activation de l'abonnement, sauf en cas d'erreur technique avérée de notre part.</p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-white mb-4 italic">4. Responsabilité</h2>
                <p>Bien que nous nous efforcions d'assurer une disponibilité maximale, KLTUR RAP ne peut être tenu responsable des interruptions de service momentanées ou des pertes de données dues à des événements indépendants de notre volonté.</p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-white mb-4 italic">5. Évolution des conditions</h2>
                <p>Ces conditions d'utilisation peuvent évoluer. Les utilisateurs sont invités à les consulter régulièrement.</p>
              </div>
            </section>
          </motion.div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default TermsOfUsePage;
