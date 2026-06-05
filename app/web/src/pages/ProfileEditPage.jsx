import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { User, Shield, Link as LinkIcon, Camera, Info, Bell, Trash2, AlertCircle } from 'lucide-react';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { supabase } from '@/lib/supabaseClient.js';
import { useNavigate } from 'react-router-dom';

const ProfileEditPage = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);

  const roles = ['Artiste', 'Producteur', 'Beat maker', 'Photographe', 'Réalisateur', 'Manager', 'Ingénieur de son', 'Auditeur', 'Autre'];

  const [formData, setFormData] = useState({
    username: '',
    phone: '',
    name: '',
    bio: '',
    website: '',
    user_role: '',
    socialLinks: {
      facebook: '', instagram: '', twitter: '', tiktok: '', snapchat: '', whatsapp: '',
      youtube: '', vimeo: '',
      spotify: '', apple_music: '', deezer: '', boom_music: '', amazon_music: '', soundcloud: ''
    },
    notifications: {
      new_messages: true,
      new_likes: true,
      new_followers: true,
      marketing_emails: false
    },
    oldPassword: '',
    password: '',
    passwordConfirm: ''
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: user, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .maybeSingle();

        if (error) throw error;

        if (user) {
          setFormData({
            username: user.username || '',
            phone: user.phone || '',
            name: user.name || '',
            bio: user.bio || '',
            website: user.website || '',
            user_role: user.user_role || '',
            socialLinks: user.social_links || {
              facebook: '', instagram: '', twitter: '', tiktok: '', snapchat: '', whatsapp: '',
              youtube: '', vimeo: '',
              spotify: '', apple_music: '', deezer: '', boom_music: '', amazon_music: '', soundcloud: ''
            },
            notifications: user.notification_settings || {
              new_messages: true,
              new_likes: true,
              new_followers: true,
              marketing_emails: false
            },
            oldPassword: '',
            password: '',
            passwordConfirm: ''
          });

          if (user.avatar) {
            const { data } = supabase.storage.from('avatars').getPublicUrl(user.avatar);
            setPhotoPreview(data.publicUrl);
          } else if (user.profilePhoto) {
            const { data } = supabase.storage.from('avatars').getPublicUrl(user.profilePhoto);
            setPhotoPreview(data.publicUrl);
          }
        }
      } catch (err) {
        console.error("Profile fetch error:", err);
        toast.error(`Erreur: ${err.message || "Impossible de charger les données"}`);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [currentUser.id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('social_')) {
      const platform = name.substring(7);
      setFormData(p => ({
        ...p,
        socialLinks: { ...p.socialLinks, [platform]: value }
      }));
    } else {
      setFormData(p => ({ ...p, [name]: value }));
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 20971520) {
        toast.error('Image trop volumineuse (max 20MB)');
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let avatarPath = null;

      if (photoFile) {
        const ext = photoFile.name.split('.').pop();
        const fileName = `${currentUser.id}/${Date.now()}_avatar.${ext}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, photoFile);

        if (uploadError) throw uploadError;
        avatarPath = uploadData.path;
      }

      const updates = {
        username: formData.username,
        phone: formData.phone,
        name: formData.name,
        bio: formData.bio,
        website: formData.website,
        user_role: formData.user_role,
        social_links: formData.socialLinks,
        notification_settings: formData.notifications,
        updated_at: new Date().toISOString(),
      };

      if (avatarPath) {
        updates.avatar = avatarPath;
        updates.profilePhoto = avatarPath;
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', currentUser.id);

      if (profileError) throw profileError;

      if (formData.password) {
        if (formData.password !== formData.passwordConfirm) {
          toast.error("Les nouveaux mots de passe ne correspondent pas");
          setIsSubmitting(false);
          return;
        }

        const { error: authError } = await supabase.auth.updateUser({
          password: formData.password
        });

        if (authError) throw authError;
      }

      toast.success("Profil mis à jour avec succès");
      
      // Clear password fields on success
      setFormData(p => ({...p, oldPassword: '', password: '', passwordConfirm: ''}));
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Erreur lors de la mise à jour");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase.rpc('request_account_deletion');

      if (error) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            deletion_requested: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentUser.id);

        if (updateError) throw updateError;
      }

      toast.success("Demande de suppression enregistrée. Vous allez être déconnecté.");
      setTimeout(async () => {
        await logout();
        navigate('/');
      }, 2000);
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la suppression du compte");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#050505]" />;

  return (
    <>
      <Helmet>
        <title>Paramètres du Profil - KLTUR RAP</title>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-[#050505]">
        <Header />

        <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="text-4xl font-black text-white uppercase tracking-tight">Paramètres du Profil</h1>
            <p className="text-white/60 font-medium">Gérez vos informations et votre présence sur la plateforme.</p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Account Info */}
            <section className="bg-[#0a0a0a] rounded-2xl border border-[#222] p-6 md:p-8">
              <h2 className="text-xl font-bold text-[#D4AF37] border-b border-[#222] pb-3 mb-6 flex items-center gap-2">
                <Info className="w-5 h-5" /> Informations du Compte
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-white font-bold">Email (Lecture seule)</Label>
                  <Input value={currentUser.email} disabled className="bg-[#111] border-[#333] text-white/50 opacity-70" />
                </div>
                <div className="space-y-2">
                  <Label className="text-white font-bold">Rôle</Label>
                  <Select value={formData.user_role} onValueChange={(val) => setFormData(p => ({...p, user_role: val}))}>
                    <SelectTrigger className="bg-[#111] border-[#333] text-white">
                      <SelectValue placeholder="Sélectionnez votre rôle" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111] border-[#333] text-white">
                      {roles.map(role => (
                        <SelectItem key={role} value={role}>{role}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-white font-bold">Nom d'utilisateur</Label>
                  <Input name="username" value={formData.username} onChange={handleInputChange} className="bg-[#111] border-[#333] text-white focus:border-[#D4AF37]" required />
                </div>
                <div className="space-y-2">
                  <Label className="text-white font-bold">Téléphone</Label>
                  <Input name="phone" value={formData.phone} onChange={handleInputChange} className="bg-[#111] border-[#333] text-white focus:border-[#D4AF37]" />
                </div>
              </div>
            </section>

            {/* Profile Details */}
            <section className="bg-[#0a0a0a] rounded-2xl border border-[#222] p-6 md:p-8">
              <h2 className="text-xl font-bold text-[#D4AF37] border-b border-[#222] pb-3 mb-6 flex items-center gap-2">
                <User className="w-5 h-5" /> Détails Publics
              </h2>
              
              <div className="flex flex-col md:flex-row gap-8 mb-6">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#333] bg-[#111] relative group">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/20">
                        <Camera className="w-10 h-10" />
                      </div>
                    )}
                    <label htmlFor="photoUpload" className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                      <Camera className="w-8 h-8 text-white" />
                    </label>
                    <input id="photoUpload" type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                  </div>
                  <Label htmlFor="photoUpload" className="text-sm font-bold text-[#D4AF37] cursor-pointer hover:underline">Changer la photo</Label>
                </div>

                <div className="flex-grow space-y-6">
                  <div className="space-y-2">
                    <Label className="text-white font-bold">Nom d'affichage</Label>
                    <Input name="name" value={formData.name} onChange={handleInputChange} className="bg-[#111] border-[#333] text-white focus:border-[#D4AF37]" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white font-bold">Site Web</Label>
                    <Input name="website" type="url" value={formData.website} onChange={handleInputChange} className="bg-[#111] border-[#333] text-white focus:border-[#D4AF37]" placeholder="https://" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-white font-bold">Bio</Label>
                  <span className="text-xs text-white/50">{(formData.bio || "").split(/\s+/).filter(word => word.length > 0).length}/1000 mots</span>
                </div>
                <Textarea 
                  name="bio" value={formData.bio} onChange={handleInputChange} rows={8}
                  className="bg-[#111] border-[#333] text-white focus:border-[#D4AF37] resize-none" 
                  placeholder="Parlez-nous de votre parcours (Max 1000 mots)..."
                />
              </div>
            </section>

            {/* Social Links */}
            <section className="bg-[#0a0a0a] rounded-2xl border border-[#222] p-6 md:p-8">
              <h2 className="text-xl font-bold text-[#D4AF37] border-b border-[#222] pb-3 mb-6 flex items-center gap-2">
                <LinkIcon className="w-5 h-5" /> Réseaux Sociaux & Plateformes
              </h2>

              <div className="space-y-8">
                <div>
                  <h3 className="text-sm font-bold text-white/40 uppercase tracking-wider mb-4">Réseaux Sociaux</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {['facebook', 'instagram', 'twitter', 'tiktok', 'snapchat', 'whatsapp'].map(platform => (
                      <div key={platform} className="space-y-1">
                        <Label className="text-white/80 font-bold capitalize">{platform === 'twitter' ? 'X (Twitter)' : platform}</Label>
                        <Input
                          name={`social_${platform}`} value={formData.socialLinks[platform] || ''} onChange={handleInputChange}
                          className="bg-[#111] border-[#333] text-white focus:border-[#D4AF37]" placeholder={`Lien ${platform}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white/40 uppercase tracking-wider mb-4">Streaming & Vidéo</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {['youtube', 'vimeo', 'spotify', 'apple_music', 'deezer', 'boom_music', 'amazon_music', 'soundcloud'].map(platform => (
                      <div key={platform} className="space-y-1">
                        <Label className="text-white/80 font-bold capitalize">{platform.replace('_', ' ')}</Label>
                        <Input
                          name={`social_${platform}`} value={formData.socialLinks[platform] || ''} onChange={handleInputChange}
                          className="bg-[#111] border-[#333] text-white focus:border-[#D4AF37]" placeholder={`Lien ${platform.replace('_', ' ')}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Security */}
            <section className="bg-[#0a0a0a] rounded-2xl border border-[#222] p-6 md:p-8">
              <h2 className="text-xl font-bold text-[#D4AF37] border-b border-[#222] pb-3 mb-6 flex items-center gap-2">
                <Bell className="w-5 h-5" /> Notifications
              </h2>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-white font-bold">Nouveaux Messages</Label>
                    <p className="text-xs text-white/40">Recevoir une alerte quand on vous contacte.</p>
                  </div>
                  <Switch
                    checked={formData.notifications.new_messages}
                    onCheckedChange={(val) => setFormData(p => ({...p, notifications: {...p.notifications, new_messages: val}}))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-white font-bold">Nouveaux Likes</Label>
                    <p className="text-xs text-white/40">Être averti quand quelqu'un aime vos projets.</p>
                  </div>
                  <Switch
                    checked={formData.notifications.new_likes}
                    onCheckedChange={(val) => setFormData(p => ({...p, notifications: {...p.notifications, new_likes: val}}))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-white font-bold">Nouveaux Abonnés</Label>
                    <p className="text-xs text-white/40">Suivre la croissance de votre communauté.</p>
                  </div>
                  <Switch
                    checked={formData.notifications.new_followers}
                    onCheckedChange={(val) => setFormData(p => ({...p, notifications: {...p.notifications, new_followers: val}}))}
                  />
                </div>
              </div>
            </section>

            {/* Security */}
            <section className="bg-[#0a0a0a] rounded-2xl border border-[#222] p-6 md:p-8">
              <h2 className="text-xl font-bold text-[#D4AF37] border-b border-[#222] pb-3 mb-6 flex items-center gap-2">
                <Shield className="w-5 h-5" /> Sécurité
              </h2>
              <p className="text-white/50 text-sm mb-4">Ne remplissez ces champs que si vous souhaitez modifier votre mot de passe.</p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-white font-bold">Ancien mot de passe</Label>
                  <Input name="oldPassword" type="password" value={formData.oldPassword} onChange={handleInputChange} className="bg-[#111] border-[#333] text-white focus:border-[#D4AF37]" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white font-bold">Nouveau mot de passe</Label>
                    <Input name="password" type="password" value={formData.password} onChange={handleInputChange} className="bg-[#111] border-[#333] text-white focus:border-[#D4AF37]" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white font-bold">Confirmer le nouveau</Label>
                    <Input name="passwordConfirm" type="password" value={formData.passwordConfirm} onChange={handleInputChange} className="bg-[#111] border-[#333] text-white focus:border-[#D4AF37]" />
                  </div>
                </div>
              </div>
            </section>

            <Button type="submit" disabled={isSubmitting} className="w-full h-14 bg-[#D4AF37] text-black hover:bg-[#b5952f] font-black text-lg uppercase tracking-wider">
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </Button>

            {/* Danger Zone */}
            <section className="mt-12 bg-red-950/10 rounded-2xl border border-red-900/30 p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <AlertCircle className="w-6 h-6 text-red-500" />
                <div>
                  <h2 className="text-xl font-bold text-red-500">Zone de Danger</h2>
                  <p className="text-xs text-white/40">Actions irréversibles concernant votre compte.</p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-red-950/20 p-6 rounded-xl border border-red-900/20">
                <div>
                  <h3 className="text-white font-bold mb-1">Supprimer mon compte</h3>
                  <p className="text-xs text-white/40 max-w-md">Cette action supprimera définitivement votre profil, vos morceaux et toutes vos données associées à KLTUR RAP.</p>
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="bg-red-600 hover:bg-red-700 font-bold px-8">
                      <Trash2 className="w-4 h-4 mr-2" /> Supprimer
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-[#0a0a0a] border border-[#222] text-white">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-2xl font-black uppercase tracking-tighter text-red-500">Attention !</AlertDialogTitle>
                      <AlertDialogDescription className="text-white/60">
                        Êtes-vous absolument sûr de vouloir supprimer votre compte ? Cette action est **irréversible** et toutes vos données seront perdues.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                      <AlertDialogCancel className="bg-[#111] border-[#333] text-white hover:bg-[#222]">Annuler</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        className="bg-red-600 text-white hover:bg-red-700 font-bold"
                        disabled={isDeleting}
                      >
                        {isDeleting ? 'Suppression...' : 'Oui, supprimer mon compte'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </section>
          </form>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default ProfileEditPage;