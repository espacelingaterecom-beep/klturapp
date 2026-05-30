import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabaseClient.js';

const ResetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== passwordConfirm) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 8) {
      toast.error('Le mot de passe doit faire au moins 8 caractères');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      toast.success('Mot de passe mis à jour avec succès !');
      navigate('/connexion');
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Une erreur est survenue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Nouveau mot de passe - KLTUR RAP</title>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-[#050505]">
        <Header />

        <main className="flex-grow flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#D4AF37]/5 via-transparent to-transparent pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md bg-[#0a0a0a] rounded-2xl p-8 border border-[#222] shadow-2xl relative z-10"
          >
            <div className="text-center mb-10">
              <h1 className="text-3xl font-black text-white uppercase tracking-tight mb-2">Réinitialisation</h1>
              <p className="text-white/60">Saisissez votre nouveau mot de passe.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="password" surprised className="text-white/80 font-bold">Nouveau mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-[#111] border-[#333] text-white focus:border-[#D4AF37] focus:ring-[#D4AF37] h-12"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="passwordConfirm" className="text-white/80 font-bold">Confirmer le mot de passe</Label>
                <Input
                  id="passwordConfirm"
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  className="bg-[#111] border-[#333] text-white focus:border-[#D4AF37] focus:ring-[#D4AF37] h-12"
                  placeholder="••••••••"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-14 bg-[#D4AF37] text-black hover:bg-[#b5952f] transition-all font-black text-lg uppercase tracking-wider"
              >
                {isSubmitting ? 'Mise à jour...' : 'Réinitialiser le mot de passe'}
              </Button>
            </form>
          </motion.div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default ResetPasswordPage;
