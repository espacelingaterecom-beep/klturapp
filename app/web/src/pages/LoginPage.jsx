import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext.jsx';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
      toast.success('Connexion réussie !');
      navigate(from, { replace: true });
    } catch (error) {
      console.error(error);
      toast.error('Email ou mot de passe incorrect.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Connexion - KLTUR RAP</title>
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
              <h1 className="text-3xl font-black text-white uppercase tracking-tight mb-2">Espace <span className="text-[#D4AF37]">Artiste</span></h1>
              <p className="text-white/60">Connectez-vous pour gérer vos projets.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/80 font-bold">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-[#111] border-[#333] text-white focus:border-[#D4AF37] focus:ring-[#D4AF37] placeholder:text-white/30 h-12"
                  placeholder="artiste@email.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white/80 font-bold">Mot de passe</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-[#111] border-[#333] text-white focus:border-[#D4AF37] focus:ring-[#D4AF37] placeholder:text-white/30 h-12"
                  placeholder="••••••••"
                  required
                />
              </div>

              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full h-14 bg-[#D4AF37] text-black hover:bg-[#b5952f] transition-all font-black text-lg uppercase tracking-wider"
              >
                {isSubmitting ? 'Connexion...' : 'Se Connecter'}
              </Button>
            </form>

            <p className="text-center mt-8 text-white/60">
              Pas encore de compte ?{' '}
              <Link to="/inscription" className="text-[#D4AF37] font-bold hover:underline">
                S'inscrire
              </Link>
            </p>
          </motion.div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default LoginPage;