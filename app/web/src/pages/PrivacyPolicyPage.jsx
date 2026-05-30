import React from 'react';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { motion } from 'framer-motion';

const PrivacyPolicyPage = () => {
  return (
    <>
      <Helmet>
        <title>Politique de Confidentialité - KLTUR RAP</title>
      </Helmet>
      <div className="min-h-screen flex flex-col bg-[#050505] text-white">
        <Header />
        <main className="flex-grow py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-4xl font-black uppercase mb-10 text-[#D4AF37]">Politique de Confidentialité</h1>

            <section className="space-y-8 text-white/80 leading-relaxed">
              <div>
                <h2 className="text-xl font-bold text-white mb-4 italic">1. Collecte des données</h2>
                <p>Dans le cadre de l'utilisation de la plateforme KLTUR RAP, nous collectons les informations suivantes :</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Informations d'identité (Nom, prénom, nom d'artiste).</li>
                  <li>Coordonnées (Adresse email, numéro de téléphone).</li>
                  <li>Données d'adhésion et historique de paiement.</li>
                  <li>Contenus uploadés (Musiques, images de profil, bio).</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-bold text-white mb-4 italic">2. Utilisation des données</h2>
                <p>Vos données sont utilisées exclusivement pour :</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>La gestion de votre compte et de vos adhésions Premium.</li>
                  <li>L'envoi de newsletters et d'informations sur la culture hip-hop centrafricaine.</li>
                  <li>L'amélioration de nos services et de l'expérience utilisateur sur l'application.</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-bold text-white mb-4 italic">3. Sécurité et Stockage</h2>
                <p>Nous attachons une importance capitale à la sécurité de vos informations. Vos données sont stockées de manière sécurisée via nos infrastructures techniques (PocketBase). Nous mettons en œuvre des mesures de protection contre tout accès non autorisé.</p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-white mb-4 italic">4. Vos droits</h2>
                <p>Conformément aux réglementations en vigueur, vous disposez d'un droit d'accès, de rectification et de suppression de vos données personnelles. Vous pouvez exercer ces droits à tout moment en nous contactant via les coordonnées fournies dans les mentions légales.</p>
              </div>
            </section>
          </motion.div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default PrivacyPolicyPage;
