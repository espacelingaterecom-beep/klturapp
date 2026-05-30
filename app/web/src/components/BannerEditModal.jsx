import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient.js';
import { useAuth } from '@/contexts/AuthContext.jsx';

const BannerEditModal = ({ isOpen, onClose, onUpdate }) => {
  const { currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({
    bannerText: currentUser?.banner_text || '',
    bannerStyle: currentUser?.banner_style || 'image'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let bannerPath = currentUser?.banner_image;

      if (file) {
        const ext = file.name.split('.').pop();
        const fileName = `${currentUser.id}/${Date.now()}_banner.${ext}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('covers')
          .upload(fileName, file);

        if (uploadError) throw uploadError;
        bannerPath = uploadData.path;
      }

      const updates = {
        banner_text: formData.bannerText,
        banner_style: formData.bannerStyle,
        banner_image: bannerPath,
        updated_at: new Date().toISOString(),
      };

      const { data: updated, error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', currentUser.id)
        .select()
        .single();

      if (updateError) throw updateError;

      toast.success('Bannière mise à jour');
      if (onUpdate) onUpdate(updated);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#0a0a0a] border border-[#333] text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-[#D4AF37] uppercase">Modifier la bannière</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label className="text-white/80">Style de bannière</Label>
            <Select value={formData.bannerStyle} onValueChange={(v) => setFormData(p => ({...p, bannerStyle: v}))}>
              <SelectTrigger className="bg-[#111] border-[#333] text-white">
                <SelectValue placeholder="Sélectionnez" />
              </SelectTrigger>
              <SelectContent className="bg-[#111] border-[#333] text-white">
                <SelectItem value="image">Image personnalisée</SelectItem>
                <SelectItem value="solid">Couleur unie (Noir)</SelectItem>
                <SelectItem value="gradient">Dégradé Or</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.bannerStyle === 'image' && (
            <div className="space-y-2">
              <Label className="text-white/80">Image (Max 20MB)</Label>
              <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} className="bg-[#111] border-[#333] text-white" />
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-white/80">Texte sur la bannière (Optionnel)</Label>
            <Input 
              value={formData.bannerText} 
              onChange={(e) => setFormData(p => ({...p, bannerText: e.target.value}))}
              className="bg-[#111] border-[#333] text-white" 
              placeholder="Ex: Nouvel album disponible !"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent border-[#333] text-white hover:bg-[#111]">Annuler</Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1 bg-[#D4AF37] text-black hover:bg-[#b5952f] font-bold">
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BannerEditModal;