import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Clock, Youtube, Facebook, MessageCircle } from 'lucide-react';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    artist: '',
    phone: '',
    message: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Le nom est requis';
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }
    if (!formData.artist.trim()) newErrors.artist = 'Ce champ est requis';
    if (!formData.message.trim()) {
      newErrors.message = 'Le message est requis';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Le message doit contenir au moins 10 caractères';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const existingCollaborations = JSON.parse(localStorage.getItem('kltur_collaborations') || '[]');
      existingCollaborations.push({
        id: Date.now(),
        ...formData,
        submittedAt: new Date().toISOString()
      });
      localStorage.setItem('kltur_collaborations', JSON.stringify(existingCollaborations));

      toast.success('Message envoyé avec succès');
      setFormData({ name: '', email: '', artist: '', phone: '', message: '' });
      setErrors({});
    } catch (error) {
      toast.error('Erreur lors de l\'envoi du message');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  return (
    <>
      <Helmet>
        <title>Contact - KLTUR RAP</title>
        <meta name="description" content="Contactez KLTUR RAP. Écrivez-nous ou retrouvez-nous à Galabadja, Bangui." />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-[#050505]">
        <Header />

        <main className="flex-grow py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h1 className="text-5xl md:text-6xl font-bold mb-4 text-white">
                Contactez <span className="text-[#D4AF37] gold-glow-text">KLTUR RAP</span>
              </h1>
              <p className="text-xl text-white/70 max-w-3xl mx-auto leading-relaxed">
                Une collaboration, une question, ou simplement dire bonjour ? Écrivez-nous ou venez nous rencontrer.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-20">
              {/* Contact Form */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-[#0a0a0a] rounded-2xl p-8 border border-[#222] hover-gold-glow"
              >
                <h2 className="text-3xl font-bold mb-8 text-white">Envoyez un message</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="name" className="text-white mb-2 block">Nom complet <span className="text-[#D4AF37]">*</span></Label>
                    <Input id="name" name="name" value={formData.name} onChange={handleChange} className="bg-[#111111] border-[#333] text-white focus:border-[#D4AF37]" placeholder="Votre nom" />
                    {errors.name && <p className="text-sm text-red-400 mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-white mb-2 block">Email <span className="text-[#D4AF37]">*</span></Label>
                    <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} className="bg-[#111111] border-[#333] text-white focus:border-[#D4AF37]" placeholder="votre@email.com" />
                    {errors.email && <p className="text-sm text-red-400 mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <Label htmlFor="artist" className="text-white mb-2 block">Nom d'artiste / Organisation <span className="text-[#D4AF37]">*</span></Label>
                    <Input id="artist" name="artist" value={formData.artist} onChange={handleChange} className="bg-[#111111] border-[#333] text-white focus:border-[#D4AF37]" placeholder="Artiste ou Orga" />
                    {errors.artist && <p className="text-sm text-red-400 mt-1">{errors.artist}</p>}
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-white mb-2 block">Téléphone</Label>
                    <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} className="bg-[#111111] border-[#333] text-white focus:border-[#D4AF37]" placeholder="+236 XX XX XX XX" />
                  </div>

                  <div>
                    <Label htmlFor="message" className="text-white mb-2 block">Message <span className="text-[#D4AF37]">*</span></Label>
                    <Textarea id="message" name="message" value={formData.message} onChange={handleChange} rows={5} className="bg-[#111111] border-[#333] text-white focus:border-[#D4AF37] resize-none" placeholder="Décrivez votre projet..." />
                    {errors.message && <p className="text-sm text-red-400 mt-1">{errors.message}</p>}
                  </div>

                  <Button type="submit" disabled={isSubmitting} className="w-full bg-[#D4AF37] text-black hover:bg-[#b5952f] transition-all font-bold py-6 text-lg animate-gold-pulse">
                    {isSubmitting ? 'Envoi en cours...' : 'Envoyer'}
                  </Button>
                </form>
              </motion.div>

              {/* Direct Info & Socials */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="space-y-10"
              >
                <div>
                  <h2 className="text-3xl font-bold mb-8 text-white">Coordonnées</h2>
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center shrink-0 border border-[#D4AF37]/20">
                        <MapPin className="h-6 w-6 text-[#D4AF37]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white mb-1">Adresse</h3>
                        <p className="text-white/70">Quartier Galabadja,<br />Bangui, République Centrafricaine</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center shrink-0 border border-[#D4AF37]/20">
                        <Phone className="h-6 w-6 text-[#D4AF37]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white mb-1">Téléphone</h3>
                        <p className="text-white/70 flex flex-col">
                          <a href="tel:+23670591292" className="hover:text-[#D4AF37] transition-colors">+236 70 59 12 92</a>
                          <a href="tel:+23674508193" className="hover:text-[#D4AF37] transition-colors">+236 74 50 81 93</a>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center shrink-0 border border-[#D4AF37]/20">
                        <Mail className="h-6 w-6 text-[#D4AF37]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white mb-1">Email</h3>
                        <p className="text-white/70 flex flex-col">
                          <a href="mailto:espacelingaterecom@gmail.com" className="hover:text-[#D4AF37] transition-colors break-all">espacelingaterecom@gmail.com</a>
                          <a href="mailto:picassolefa@gmail.com" className="hover:text-[#D4AF37] transition-colors break-all">picassolefa@gmail.com</a>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center shrink-0 border border-[#D4AF37]/20">
                        <Clock className="h-6 w-6 text-[#D4AF37]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white mb-1">Heures d'ouverture</h3>
                        <p className="text-white/70">Samedi 16h-17h (Émission Radio)</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-[#222]">
                  <h3 className="text-xl font-bold mb-6 text-white">Réseaux Sociaux</h3>
                  <div className="flex gap-4">
                    <a href="https://www.youtube.com/@KLTURRAP" target="_blank" rel="noopener noreferrer" className="w-14 h-14 rounded-xl bg-[#111111] border border-[#333] flex items-center justify-center text-white hover:text-[#D4AF37] hover:border-[#D4AF37] transition-all hover-gold-glow">
                      <Youtube className="h-6 w-6" />
                    </a>
                    <a href="https://www.facebook.com/61556600949652/posts/122109859640220031/" target="_blank" rel="noopener noreferrer" className="w-14 h-14 rounded-xl bg-[#111111] border border-[#333] flex items-center justify-center text-white hover:text-[#D4AF37] hover:border-[#D4AF37] transition-all hover-gold-glow">
                      <Facebook className="h-6 w-6" />
                    </a>
                    <a href="https://whatsapp.com/channel/0029VbBceaT0Qeak1de5DQ1X" target="_blank" rel="noopener noreferrer" className="w-14 h-14 rounded-xl bg-[#111111] border border-[#333] flex items-center justify-center text-white hover:text-[#D4AF37] hover:border-[#D4AF37] transition-all hover-gold-glow">
                      <MessageCircle className="h-6 w-6" />
                    </a>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Map Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="w-full h-[400px] rounded-2xl overflow-hidden border border-[#222] z-0 hover-gold-glow bg-[#111111]"
            >
              <iframe
                title="Carte de Bangui - Quartier Galabadja"
                src="https://maps.google.com/maps?q=Quartier%20Galabadja,%20Bangui,%20R%C3%A9publique%20Centrafricaine&t=&z=14&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full grayscale contrast-125 opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-500"
              ></iframe>
            </motion.div>

          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default ContactPage;