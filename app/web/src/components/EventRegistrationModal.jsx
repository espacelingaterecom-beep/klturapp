import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient.js';
import { useAuth } from '@/contexts/AuthContext.jsx';

const EventRegistrationModal = ({ isOpen, onClose, event }) => {
  const { currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    tickets: '1',
    requests: '',
    terms: false
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.terms) {
      toast.error('Veuillez accepter les conditions.');
      return;
    }

    setIsSubmitting(true);
    try {
      const ticketNumber = `TKT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      const { error } = await supabase
        .from('event_registrations')
        .insert([{
          event_id: event.id,
          user_id: currentUser.id,
          status: 'confirmed',
          ticket_number: ticketNumber
        }]);

      if (error) throw error;

      toast.success('Inscription confirmée ! Un email vous a été envoyé.');
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de l\'inscription.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#0a0a0a] border border-[#333] text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-[#D4AF37] uppercase">S'inscrire à l'événement</DialogTitle>
          <DialogDescription className="text-white/60">
            {event?.title} - {new Date(event?.date).toLocaleDateString('fr-FR')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label className="text-white/80">Nom complet</Label>
            <Input value={currentUser?.name || currentUser?.username || ''} disabled className="bg-[#111] border-[#333] text-white/50" />
          </div>
          
          <div className="space-y-2">
            <Label className="text-white/80">Email</Label>
            <Input value={currentUser?.email || ''} disabled className="bg-[#111] border-[#333] text-white/50" />
          </div>

          <div className="space-y-2">
            <Label className="text-white/80">Nombre de billets</Label>
            <Select value={formData.tickets} onValueChange={(v) => setFormData(p => ({...p, tickets: v}))}>
              <SelectTrigger className="bg-[#111] border-[#333] text-white">
                <SelectValue placeholder="Sélectionnez" />
              </SelectTrigger>
              <SelectContent className="bg-[#111] border-[#333] text-white">
                {[1,2,3,4,5].map(n => <SelectItem key={n} value={n.toString()}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-white/80">Demandes spéciales</Label>
            <Textarea 
              value={formData.requests} 
              onChange={(e) => setFormData(p => ({...p, requests: e.target.value}))}
              className="bg-[#111] border-[#333] text-white resize-none" 
              placeholder="Optionnel..."
            />
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox 
              id="terms" 
              checked={formData.terms} 
              onCheckedChange={(c) => setFormData(p => ({...p, terms: c}))}
              className="border-[#555] data-[state=checked]:bg-[#D4AF37] data-[state=checked]:border-[#D4AF37]"
            />
            <Label htmlFor="terms" className="text-sm text-white/80 cursor-pointer">
              J'accepte les conditions de participation
            </Label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent border-[#333] text-white hover:bg-[#111]">
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1 bg-[#D4AF37] text-black hover:bg-[#b5952f] font-bold">
              {isSubmitting ? 'Confirmation...' : 'Confirmer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EventRegistrationModal;