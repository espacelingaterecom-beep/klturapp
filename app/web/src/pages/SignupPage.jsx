import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { supabase } from '@/lib/supabaseClient.js';

const SignupPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    password: '',
    passwordConfirm: '',
    userRole: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.userRole) {
      toast.error('Veuillez sélectionner un rôle.');
      return;
    }

    if (formData.password !== formData.passwordConfirm) {
      toast.error('Les mots de passe ne correspondent pas.');
      return;
    }
    
    if (formData.password.length < 8) {
      toast.error('Le mot de passe doit faire au moins 8 caractères.');
      return;
    }

    setIsSubmitting(true);
    try {
      await signup({
        ...formData,
        user_role: formData.userRole // Map to snake_case for consistency
      });
      toast.success('Compte créé avec succès ! Bienvenue.');
      navigate('/dashboard');
    } catch (error) {
      console.error(error);
      const msg = error?.response?.message || 'Une erreur est survenue lors de l\'inscription. Ce nom d\'utilisateur est peut-être déjà pris.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const roles = ['Artiste', 'Producteur', 'Beat maker', 'Photographe', 'Réalisateur', 'Manager', 'Ingénieur de son', 'Auditeur', 'Autre'];

  return (
    <>
      <Helmet>
        <title>Inscription - KLTUR RAP</title>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-[#050505]">
        <Header />

        <main className="flex-grow flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-xl bg-[#0a0a0a] rounded-2xl p-8 border border-[#222] shadow-2xl"
          >
            <div className="text-center mb-10">
              <h1 className="text-3xl font-black text-white uppercase tracking-tight mb-2">Rejoindre <span className="text-[#D4AF37]">Le Mouvement</span></h1>
              <p className="text-white/60">Créez votre profil pour partager ou découvrir.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-white/80 font-bold">Nom d'utilisateur (unique) <span className="text-[#D4AF37]">*</span></Label>
                  <Input 
                    id="username" name="username" 
                    value={formData.username} onChange={handleChange}
                    className="bg-[#111] border-[#333] text-white focus:border-[#D4AF37] h-12"
                    placeholder="Ex: mctalent123" required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white/80 font-bold">Nom complet / Nom d'artiste <span className="text-[#D4AF37]">*</span></Label>
                  <Input 
                    id="name" name="name" 
                    value={formData.name} onChange={handleChange}
                    className="bg-[#111] border-[#333] text-white focus:border-[#D4AF37] h-12"
                    placeholder="Ex: MC Talent" required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/80 font-bold">Email <span className="text-[#D4AF37]">*</span></Label>
                <Input 
                  id="email" name="email" type="email"
                  value={formData.email} onChange={handleChange}
                  className="bg-[#111] border-[#333] text-white focus:border-[#D4AF37] h-12"
                  placeholder="contact@artiste.com" required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="userRole" className="text-white/80 font-bold">Rôle principal <span className="text-[#D4AF37]">*</span></Label>
                <Select value={formData.userRole} onValueChange={(val) => setFormData(p => ({...p, userRole: val}))} required>
                  <SelectTrigger className="bg-[#111] border-[#333] text-white h-12">
                    <SelectValue placeholder="Sélectionnez votre rôle" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111] border-[#333] text-white">
                    {roles.map(role => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white/80 font-bold">Mot de passe <span className="text-[#D4AF37]">*</span></Label>
                  <Input 
                    id="password" name="password" type="password"
                    value={formData.password} onChange={handleChange}
                    className="bg-[#111] border-[#333] text-white focus:border-[#D4AF37] h-12"
                    placeholder="Min. 8 caractères" required minLength={8}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passwordConfirm" className="text-white/80 font-bold">Confirmer <span className="text-[#D4AF37]">*</span></Label>
                  <Input 
                    id="passwordConfirm" name="passwordConfirm" type="password"
                    value={formData.passwordConfirm} onChange={handleChange}
                    className="bg-[#111] border-[#333] text-white focus:border-[#D4AF37] h-12"
                    placeholder="Min. 8 caractères" required minLength={8}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full h-14 bg-[#D4AF37] text-black hover:bg-[#b5952f] transition-all font-black text-lg uppercase tracking-wider mt-4"
              >
                {isSubmitting ? 'Création...' : 'Créer mon compte'}
              </Button>
            </form>

            <p className="text-center mt-8 text-white/60 font-medium">
              Déjà inscrit ?{' '}
              <Link to="/connexion" className="text-[#D4AF37] font-bold hover:underline">
                Se connecter
              </Link>
            </p>
          </motion.div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default SignupPage;