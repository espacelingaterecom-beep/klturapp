import React from 'react';
import { Youtube, Facebook, MapPin, Phone, Mail, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-[#050505] border-t border-[#333333] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* Column 1: About */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img 
                src="https://horizons-cdn.hostinger.com/8cb4c9c6-9962-4ccc-80b1-ea71b7a63684/866a587d484c1eedb4c3fd12c56b7757.png" 
                alt="KLTUR RAP Logo" 
                className="h-10 w-auto"
              />
              <span className="text-xl font-bold text-[#D4AF37]">KLTUR RAP</span>
            </div>
            <p className="text-sm text-white/70 leading-relaxed">
              Que pour la culture hip-hop centrafricaine. Votre plateforme de référence pour la scène urbaine de Bangui. Émission radio, événements, talents et actualités.
            </p>
          </div>

          {/* Column 2: Follow Us */}
          <div>
            <h3 className="text-lg font-bold text-[#D4AF37] mb-6">Suivez-nous</h3>
            <div className="flex gap-4">
              <a 
                href="https://www.youtube.com/@KLTURRAP" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-xl bg-[#111111] border border-[#333333] flex items-center justify-center text-white hover:text-[#D4AF37] hover-gold-glow"
                aria-label="YouTube"
              >
                <Youtube className="h-5 w-5" />
              </a>
              <a 
                href="https://www.facebook.com/61556600949652/posts/122109859640220031/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-xl bg-[#111111] border border-[#333333] flex items-center justify-center text-white hover:text-[#D4AF37] hover-gold-glow"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a 
                href="https://whatsapp.com/channel/0029VbBceaT0Qeak1de5DQ1X" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-xl bg-[#111111] border border-[#333333] flex items-center justify-center text-white hover:text-[#D4AF37] hover-gold-glow"
                aria-label="WhatsApp"
              >
                <MessageCircle className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Column 3: Contact */}
          <div>
            <h3 className="text-lg font-bold text-[#D4AF37] mb-6">Contact</h3>
            <ul className="space-y-4 text-sm text-white/80">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-[#D4AF37] shrink-0" />
                <span>Quartier Galabadja,<br />Bangui, RCA</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-[#D4AF37] shrink-0" />
                <div className="flex flex-col">
                  <a href="tel:+23670591292" className="hover:text-[#D4AF37] transition-colors">+236 70 59 12 92</a>
                  <a href="tel:+23674508193" className="hover:text-[#D4AF37] transition-colors">+236 74 50 81 93</a>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-[#D4AF37] shrink-0" />
                <div className="flex flex-col">
                  <a href="mailto:espacelingaterecom@gmail.com" className="hover:text-[#D4AF37] transition-colors break-all">espacelingaterecom@gmail.com</a>
                  <a href="mailto:picassolefa@gmail.com" className="hover:text-[#D4AF37] transition-colors break-all">picassolefa@gmail.com</a>
                </div>
              </li>
            </ul>
          </div>

          {/* Column 4: Legal */}
          <div>
            <h3 className="text-lg font-bold text-[#D4AF37] mb-6">Plateforme</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/equipe" className="text-white/70 hover:text-[#D4AF37] transition-colors duration-300">
                  L'Équipe
                </Link>
              </li>
              <li>
                <Link to="/rejoindre" className="text-white/70 hover:text-[#D4AF37] transition-colors duration-300">
                  Devenir Bénévole
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-white/70 hover:text-[#D4AF37] transition-colors duration-300">
                  Nous contacter
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 5: Legal */}
          <div>
            <h3 className="text-lg font-bold text-[#D4AF37] mb-6">Légal</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/politique-confidentialite" className="text-white/70 hover:text-[#D4AF37] transition-colors duration-300">
                  Politique de confidentialité
                </Link>
              </li>
              <li>
                <Link to="/conditions-utilisation" className="text-white/70 hover:text-[#D4AF37] transition-colors duration-300">
                  Conditions d'utilisation
                </Link>
              </li>
              <li>
                <Link to="/mentions-legales" className="text-white/70 hover:text-[#D4AF37] transition-colors duration-300">
                  Mentions légales
                </Link>
              </li>
            </ul>
          </div>

        </div>

        <div className="pt-8 border-t border-[#333333] text-center flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-white/50">
            © {new Date().getFullYear()} KLTUR RAP. Tous droits réservés.
          </p>
          <p className="text-sm text-white/50">
            Fait avec passion à Bangui.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;