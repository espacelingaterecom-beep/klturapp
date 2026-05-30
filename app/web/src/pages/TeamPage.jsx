import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Button } from '@/components/ui/button';

const teamMembers = [
  {
    id: 1,
    name: "JONATHAN MAMBACHAKA",
    role: "CEO & Fondateur",
    bio: "Visionnaire et leader, Jonathan est le moteur derrière la plateforme KLTUR RAP. Son objectif : propulser la culture urbaine centrafricaine sur la scène internationale.",
    image: "https://achphabduyhwlllsysan.supabase.co/storage/v1/object/public/avatars/Jonathan%20MAMBACHAKA.jpg"
  },
  {
    id: 2,
    name: "Jospin pod NZAPA-HIMI",
    role: "Community Manager",
    bio: "La voix numérique de KLTUR RAP. Jospin connecte les artistes et le public, animant chaque jour la communauté passionnée du hip-hop de Bangui.",
    image: "https://achphabduyhwlllsysan.supabase.co/storage/v1/object/public/avatars/JOSPIN%20POD%20NZAPA%20HIMI.jpg"
  },
  {
    id: 3,
    name: "Chacha2m",
    role: "Réalisateur (Director)",
    bio: "L'œil visuel du mouvement. Chacha2m sublime les clips, documentaires et interviews pour donner à la culture urbaine des images à la hauteur de son talent.",
    image: "https://achphabduyhwlllsysan.supabase.co/storage/v1/object/public/avatars/CHACHA2M.jpg"
  },
  {
    id: 4,
    name: "DJ T-Bain",
    role: "DJ & Producteur",
    bio: "Le maître des platines. DJ T-Bain fait vibrer les événements KLTUR RAP avec ses sélections pointues et ses mixes inoubliables.",
    image: "https://achphabduyhwlllsysan.supabase.co/storage/v1/object/public/avatars/DJ%20T-bain.jpg"
  },
  {
    id: 5,
    name: "Judicaël",
    role: "Responsable Logistique",
    bio: "Pilier essentiel des opérations, Judicaël s'assure que chaque événement et chaque diffusion de KLTUR RAP se déroule sans accroc.",
    image: "https://achphabduyhwlllsysan.supabase.co/storage/v1/object/public/avatars/JUDICAEL.jpg"
  }
];

const TeamPage = () => {
  return (
    <>
      <Helmet>
        <title>Notre Équipe - KLTUR RAP</title>
        <meta name="description" content="Découvrez les visages derrière KLTUR RAP. Une équipe passionnée dédiée à la culture hip-hop en République Centrafricaine." />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-[#050505]">
        <Header />

        <main className="flex-grow">
          {/* Mission Section */}
          <section className="py-24 relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-4xl bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#D4AF37]/10 via-transparent to-transparent pointer-events-none" />
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white">
                  L'Équipe <span className="text-[#D4AF37] gold-glow-text">KLTUR RAP</span>
                </h1>
                <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed mb-12">
                  Unis par une même passion : structurer, promouvoir et exporter le talent brut de la scène urbaine centrafricaine. Voici les artisans de l'ombre et de la lumière.
                </p>
              </motion.div>
            </div>
          </section>

          {/* Team Grid Section */}
          <section className="pb-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {teamMembers.map((member, index) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="bg-[#0a0a0a] border border-[#222] rounded-2xl overflow-hidden group hover-gold-glow"
                  >
                    <div className="aspect-[4/5] w-full relative overflow-hidden">
                      <img 
                        src={member.image} 
                        alt={`Photo de ${member.name}`}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 filter grayscale group-hover:grayscale-0"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                      
                      <div className="absolute bottom-0 left-0 w-full p-6">
                        <h3 className="text-2xl font-bold text-white mb-1">{member.name}</h3>
                        <p className="text-[#D4AF37] font-semibold text-sm uppercase tracking-wider">{member.role}</p>
                      </div>
                    </div>
                    
                    <div className="p-6 border-t border-[#222]">
                      <p className="text-white/70 text-sm leading-relaxed">
                        {member.bio}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Call to Action */}
          <section className="py-24 bg-[#0a0a0a] border-t border-[#222]">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                  Vous partagez notre vision ?
                </h2>
                <p className="text-lg text-white/70 mb-10 leading-relaxed">
                  Nous sommes toujours à la recherche de nouveaux talents pour faire grandir la communauté. Rédacteurs, beatmakers, danseurs ou bénévoles... Rejoignez le mouvement !
                </p>
                <Link to="/rejoindre">
                  <Button className="bg-[#D4AF37] text-black hover:bg-[#b5952f] transition-all duration-300 text-lg px-8 py-6 font-bold animate-gold-pulse gap-2">
                    Rejoindre Notre Équipe
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              </motion.div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default TeamPage;