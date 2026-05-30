import React from 'react';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { motion } from 'framer-motion';

const LegalNoticePage = () => {
  return (
    <>
      <Helmet>
        <title>Mentions Légales - KLTUR RAP</title>
      </Helmet>
      <div className="min-h-screen flex flex-col bg-[#050505] text-white">
        <Header />
        <main className="flex-grow py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-4xl font-black uppercase mb-10 text-[#D4AF37]">Mentions Légales</h1>

            <section className="space-y-8 text-white/80 leading-relaxed">
              <div>
                <h2 className="text-xl font-bold text-white mb-4 italic">1. Éditeur</h2>
                <p><strong>Nom :</strong> KLTUR RAP – Culture & Voix Urbaines</p>
                <p><strong>Siège social :</strong> Bangui, République Centrafricaine (RCA)</p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-white mb-4 italic">2. Responsables de publication</h2>
                <p>Linga Tere / Jonathan MAMBACHAKA</p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-white mb-4 italic">3. Hébergement</h2>
                <p>Le site est hébergé par : [Veuillez insérer le nom de votre hébergeur ici]</p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-white mb-4 italic">4. Contact</h2>
                <p><strong>Email :</strong> contact@klturrap.com</p>
                <p><strong>WhatsApp :</strong> [Veuillez insérer votre numéro WhatsApp]</p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-white mb-4 italic">5. Propriété intellectuelle</h2>
                <p>L'ensemble des éléments (textes, images, musiques, vidéos) présents sur l'application KLTUR RAP sont protégés par le droit d'auteur. Toute reproduction ou distribution non autorisée est strictement interdite.</p>
              </div>
            </section>
          </motion.div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default LegalNoticePage;
