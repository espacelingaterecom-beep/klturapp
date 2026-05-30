import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient.js';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

const VolunteerPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    desiredRole: '',
    experience: '',
    socialMedia: '',
    agreedToTerms: false
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Le nom est requis';
    
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    if (!formData.desiredRole) {
      newErrors.desiredRole = 'Veuillez sélectionner un rôle';
    }

    if (!formData.agreedToTerms) {
      newErrors.agreedToTerms = 'Vous devez accepter les conditions pour continuer';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSelectChange = (value) => {
    setFormData(prev => ({ ...prev, desiredRole: value }));
    if (errors.desiredRole) setErrors(prev => ({ ...prev, desiredRole: '' }));
  };

  const handleCheckboxChange = (checked) => {
    setFormData(prev => ({ ...prev, agreedToTerms: checked }));
    if (errors.agreedToTerms) setErrors(prev => ({ ...prev, agreedToTerms: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('volunteers')
        .insert([{
          name: formData.name,
          email: formData.email,
          phone: formData.phone || "",
          desired_role: formData.desiredRole,
          experience: formData.experience || "",
          social_media: formData.socialMedia || "",
          agreed_to_terms: formData.agreedToTerms,
          status: 'pending'
        }]);

      if (error) throw error;

      toast.success('Votre candidature a été envoyée avec succès !');
      setFormData({
        name: '', email: '', phone: '', desiredRole: '', 
        experience: '', socialMedia: '', agreedToTerms: false
      });
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Une erreur est survenue lors de l\'envoi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Rejoindre - KLTUR RAP</title>
        <meta name="description" content="Devenez bénévole, artiste, ou partenaire. Rejoignez la communauté KLTUR RAP." />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-[#050505]">
        <Header />

        <main className="flex-grow py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">
                Rejoignez le <span className="text-[#D4AF37] gold-glow-text">Mouvement</span>
              </h1>
              <p className="text-lg text-white/70 leading-relaxed">
                Remplissez ce formulaire pour proposer votre candidature. Nous étudions tous les profils avec attention.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-[#0a0a0a] rounded-2xl p-6 md:p-10 border border-[#222] hover-gold-glow"
            >
              <form onSubmit={handleSubmit} className="space-y-8">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-white">Nom complet <span className="text-[#D4AF37]">*</span></Label>
                    <Input 
                      id="name" name="name" 
                      value={formData.name} onChange={handleInputChange}
                      className="bg-[#111111] border-[#333] text-white focus:border-[#D4AF37]"
                      placeholder="Jean Dupont"
                    />
                    {errors.name && <p className="text-sm text-red-400">{errors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">Email <span className="text-[#D4AF37]">*</span></Label>
                    <Input 
                      id="email" name="email" type="email"
                      value={formData.email} onChange={handleInputChange}
                      className="bg-[#111111] border-[#333] text-white focus:border-[#D4AF37]"
                      placeholder="jean@example.com"
                    />
                    {errors.email && <p className="text-sm text-red-400">{errors.email}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-white">Téléphone</Label>
                    <Input 
                      id="phone" name="phone" type="tel"
                      value={formData.phone} onChange={handleInputChange}
                      className="bg-[#111111] border-[#333] text-white focus:border-[#D4AF37]"
                      placeholder="+236 00 00 00 00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Rôle désiré <span className="text-[#D4AF37]">*</span></Label>
                    <Select value={formData.desiredRole} onValueChange={handleSelectChange}>
                      <SelectTrigger className="bg-[#111111] border-[#333] text-white focus:border-[#D4AF37]">
                        <SelectValue placeholder="Sélectionnez un rôle" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#111111] border-[#333] text-white">
                        <SelectItem value="DJ">DJ</SelectItem>
                        <SelectItem value="Réalisateur">Réalisateur</SelectItem>
                        <SelectItem value="Community Manager">Community Manager</SelectItem>
                        <SelectItem value="Chroniqueur">Chroniqueur</SelectItem>
                        <SelectItem value="Artiste">Artiste</SelectItem>
                        <SelectItem value="Autre">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.desiredRole && <p className="text-sm text-red-400">{errors.desiredRole}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience" className="text-white">Expérience / Biographie</Label>
                  <Textarea 
                    id="experience" name="experience" rows={4}
                    value={formData.experience} onChange={handleInputChange}
                    className="bg-[#111111] border-[#333] text-white focus:border-[#D4AF37] resize-none"
                    placeholder="Racontez-nous brièvement votre parcours..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="socialMedia" className="text-white">Liens Réseaux Sociaux / Portfolio</Label>
                  <Input 
                    id="socialMedia" name="socialMedia" 
                    value={formData.socialMedia} onChange={handleInputChange}
                    className="bg-[#111111] border-[#333] text-white focus:border-[#D4AF37]"
                    placeholder="https://instagram.com/..."
                  />
                </div>

                <div className="flex items-start space-x-3 bg-[#111111] p-4 rounded-lg border border-[#333]">
                  <Checkbox 
                    id="agreedToTerms" 
                    checked={formData.agreedToTerms} 
                    onCheckedChange={handleCheckboxChange} 
                    className="border-[#D4AF37] data-[state=checked]:bg-[#D4AF37] data-[state=checked]:text-black mt-1"
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="agreedToTerms" className="text-white cursor-pointer font-medium">
                      J'accepte de rejoindre la communauté KLTUR RAP
                    </Label>
                    <p className="text-sm text-white/50">
                      En cochant cette case, j'accepte d'être recontacté(e) pour participer aux activités de l'association.
                    </p>
                  </div>
                </div>
                {errors.agreedToTerms && <p className="text-sm text-red-400 -mt-4">{errors.agreedToTerms}</p>}

                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-[#D4AF37] text-black hover:bg-[#b5952f] transition-all text-lg py-6 font-bold animate-gold-pulse"
                >
                  {isSubmitting ? 'Envoi en cours...' : 'Soumettre ma candidature'}
                </Button>
              </form>
            </motion.div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default VolunteerPage;