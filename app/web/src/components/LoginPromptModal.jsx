import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';

const LoginPromptModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#0a0a0a] border border-[#333] text-white sm:max-w-md p-8">
        <DialogHeader className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-[#111] border border-[#D4AF37]/30 flex items-center justify-center mb-4 gold-glow">
            <Lock className="w-8 h-8 text-[#D4AF37]" />
          </div>
          <DialogTitle className="text-2xl font-black uppercase tracking-tight text-white mb-2">
            Rejoignez KLTUR RAP pour accéder à ce contenu
          </DialogTitle>
          <DialogDescription className="text-white/60 text-base">
            Inscrivez-vous gratuitement pour découvrir, partager et promouvoir la culture hip-hop.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-6">
          <Button 
            onClick={() => { onClose(); navigate('/inscription'); }} 
            className="w-full h-14 bg-[#D4AF37] text-black hover:bg-[#b5952f] transition-all font-black text-lg uppercase tracking-wider"
          >
            S'inscrire
          </Button>
          <Button 
            onClick={() => { onClose(); navigate('/connexion'); }} 
            variant="outline"
            className="w-full h-14 bg-transparent border-[#333] text-white hover:bg-[#111] hover:text-[#D4AF37] transition-all font-bold text-lg uppercase tracking-wider"
          >
            Se connecter
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoginPromptModal;