import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Calendar, Users, Music, Plus, Trash2, Image as ImageIcon, Camera, Star, Edit, X, Eye, Download, Heart, MessageSquare, ChevronRight, Radio, Newspaper, Link as LinkIcon, FileAudio, UserCircle } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase, getPublicImageUrl } from '@/lib/supabaseClient.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useNavigate, Link } from 'react-router-dom';

const AdminDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Data states
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [contents, setContents] = useState([]);
  const [radioEpisodes, setRadioEpisodes] = useState([]);
  const [news, setNews] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);

  // Form states
  const [newEvent, setNewEvent] = useState({ title: '', date: '', location: '', event_type: 'Concert', description: '' });
  const [eventImage, setEventImage] = useState(null);
  const [eventImagePreview, setEventImagePreview] = useState(null);

  const [newEpisode, setNewEpisode] = useState({ title: '', date: '', duration: '', description: '', audio_url: '' });
  const [audioSourceType, setAudioSourceType] = useState('link'); // 'link' or 'file'
  const [audioFile, setAudioFile] = useState(null);

  const [newNews, setNewNews] = useState({ title: '', category: 'News', excerpt: '', content: '', image_url: '', source_url: '' });

  const [newMember, setNewMember] = useState({ name: '', role: '', bio: '', image_url: '' });

  // Edit states
  const [editingEvent, setEditingEvent] = useState(null);
  const [editingEpisode, setEditingEpisode] = useState(null);
  const [editingNews, setEditingNews] = useState(null);
  const [editingMember, setEditingMember] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!currentUser) {
        navigate('/connexion');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', currentUser.id)
          .maybeSingle();

        if (data?.is_admin) {
          setIsAdmin(true);
          loadAllData();
        } else {
          toast.error("Accès réservé aux administrateurs");
          navigate('/');
        }
      } catch (err) {
        console.error("Admin check error:", err);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [currentUser, navigate]);

  const loadAllData = async () => {
    // 1. Fetch Events
    try {
      const { data: evs } = await supabase.from('events').select('*').order('date', { ascending: true });
      setEvents(evs || []);
    } catch (e) { console.error("Events error", e); }

    // Fetch Radio Episodes
    try {
      const { data: rad } = await supabase.from('radio_episodes').select('*').order('date', { ascending: false });
      setRadioEpisodes(rad || []);
    } catch (e) { console.error("Radio error", e); }

    // Fetch News
    try {
      const { data: nw } = await supabase.from('news').select('*').order('created_at', { ascending: false });
      setNews(nw || []);
    } catch (e) { console.error("News error", e); }

    // Fetch Team
    try {
      const { data: tm } = await supabase.from('team_members').select('*').order('created_at', { ascending: true });
      setTeamMembers(tm || []);
    } catch (e) { console.error("Team error", e); }

    // 2. Fetch Users (Indépendant et Robuste)
    try {
      const { data: usrs, error: uErr } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (uErr) {
        // Fallback sans tri si la colonne created_at manque
        const { data: fallbackUsrs } = await supabase.from('profiles').select('*');
        setUsers(fallbackUsrs || []);
      } else {
        setUsers(usrs || []);
      }
    } catch (e) {
      console.error("Users fetch error", e);
    }

    // 3. Fetch Contents
    try {
      const { data: ups } = await supabase.from('uploads').select('*, profiles:user_id(username)');
      const { data: pts } = await supabase.from('posts').select('*, profiles:user_id(username)');

      const combined = [
        ...(ups || []).map(u => ({ ...u, contentType: 'Upload' })),
        ...(pts || []).map(p => ({ ...p, contentType: 'Post', title: p.caption || 'Publication' }))
      ].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

      setContents(combined);
    } catch (e) {
      console.error("Contents fetch error", e);
    }
  };

  const handleCreateOrUpdateEvent = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let imagePath = editingEvent?.image || editingEvent?.image_url || null;

      if (eventImage) {
        const fileExt = eventImage.name.split('.').pop();
        const fileName = `events/${Date.now()}.${fileExt}`;
        const { data: storageData, error: storageError } = await supabase.storage
          .from('covers')
          .upload(fileName, eventImage);
        if (storageError) throw storageError;
        imagePath = storageData.path;
      }

      const eventData = {
        title: newEvent.title,
        date: newEvent.date,
        location: newEvent.location,
        event_type: newEvent.event_type,
        description: newEvent.description,
        image: imagePath, // Réactivé
        organizer_id: currentUser.id
      };

      if (editingEvent) {
        const { error } = await supabase.from('events').update(eventData).eq('id', editingEvent.id);
        if (error) throw error;
        toast.success("Événement mis à jour !");
      } else {
        const { error } = await supabase.from('events').insert([eventData]);
        if (error) throw error;
        toast.success("Événement publié !");
      }

      setNewEvent({ title: '', date: '', location: '', event_type: 'Concert', description: '' });
      setEventImage(null);
      setEventImagePreview(null);
      setEditingEvent(null);
      loadAllData();
    } catch (err) {
      console.error(err);
      toast.error(`Erreur: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditEvent = (event) => {
    setEditingEvent(event);
    setNewEvent({
      title: event.title,
      date: new Date(event.date).toISOString().slice(0, 16),
      location: event.location,
      event_type: event.event_type || 'Concert',
      description: event.description || ''
    });
    setEventImagePreview((event.image || event.image_url) ? getPublicImageUrl('covers', event.image || event.image_url) : null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingEvent(null);
    setNewEvent({ title: '', date: '', location: '', event_type: 'Concert', description: '' });
    setEventImage(null);
    setEventImagePreview(null);
  };

  const handleCreateOrUpdateEpisode = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let finalAudioUrl = newEpisode.audio_url;

      if (audioSourceType === 'file' && audioFile) {
        const fileExt = audioFile.name.split('.').pop();
        const fileName = `radio/${Date.now()}.${fileExt}`;
        const { data: storageData, error: storageError } = await supabase.storage
          .from('uploads') // On peut réutiliser le bucket uploads ou en créer un 'radio'
          .upload(fileName, audioFile);

        if (storageError) throw storageError;

        // Obtenir l'URL publique
        const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(storageData.path);
        finalAudioUrl = publicUrl;
      }

      const episodeData = {
        title: newEpisode.title,
        date: newEpisode.date,
        duration: newEpisode.duration,
        description: newEpisode.description,
        audio_url: finalAudioUrl
      };

      if (editingEpisode) {
        const { error } = await supabase.from('radio_episodes').update(episodeData).eq('id', editingEpisode.id);
        if (error) throw error;
        toast.success("Épisode mis à jour !");
      } else {
        const { error } = await supabase.from('radio_episodes').insert([episodeData]);
        if (error) throw error;
        toast.success("Épisode publié !");
      }

      setNewEpisode({ title: '', date: '', duration: '', description: '', audio_url: '' });
      setAudioFile(null);
      setAudioSourceType('link');
      setEditingEpisode(null);
      loadAllData();
    } catch (err) {
      console.error(err);
      toast.error(`Erreur: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditEpisode = (ep) => {
    setEditingEpisode(ep);
    setNewEpisode({
      title: ep.title,
      date: ep.date,
      duration: ep.duration,
      description: ep.description || '',
      audio_url: ep.audio_url || ''
    });
    setAudioSourceType('link');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteEpisode = async (id) => {
    if (!window.confirm("Supprimer cet épisode ?")) return;
    const { error } = await supabase.from('radio_episodes').delete().eq('id', id);
    if (error) toast.error("Erreur de suppression");
    else {
      toast.success("Épisode supprimé");
      loadAllData();
    }
  };

  const handleCreateOrUpdateNews = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const newsData = {
        ...newNews,
        author_id: currentUser.id
      };

      if (editingNews) {
        const { error } = await supabase.from('news').update(newsData).eq('id', editingNews.id);
        if (error) throw error;
        toast.success("Article mis à jour !");
      } else {
        const { error } = await supabase.from('news').insert([newsData]);
        if (error) throw error;
        toast.success("Article publié !");
      }

      setNewNews({ title: '', category: 'News', excerpt: '', content: '', image_url: '', source_url: '' });
      setEditingNews(null);
      loadAllData();
    } catch (err) {
      console.error(err);
      toast.error(`Erreur: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditNews = (n) => {
    setEditingNews(n);
    setNewNews({
      title: n.title,
      category: n.category || 'News',
      excerpt: n.excerpt || '',
      content: n.content || '',
      image_url: n.image_url || '',
      source_url: n.source_url || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteNews = async (id) => {
    if (!window.confirm("Supprimer cet article ?")) return;
    const { error } = await supabase.from('news').delete().eq('id', id);
    if (error) toast.error("Erreur de suppression");
    else {
      toast.success("Article supprimé");
      loadAllData();
    }
  };

  const handleCreateOrUpdateMember = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingMember) {
        const { error } = await supabase.from('team_members').update(newMember).eq('id', editingMember.id);
        if (error) throw error;
        toast.success("Membre mis à jour !");
      } else {
        const { error } = await supabase.from('team_members').insert([newMember]);
        if (error) throw error;
        toast.success("Membre ajouté !");
      }

      setNewMember({ name: '', role: '', bio: '', image_url: '' });
      setEditingMember(null);
      loadAllData();
    } catch (err) {
      console.error(err);
      toast.error(`Erreur: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditMember = (m) => {
    setEditingMember(m);
    setNewMember({
      name: m.name,
      role: m.role,
      bio: m.bio || '',
      image_url: m.image_url || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteMember = async (id) => {
    if (!window.confirm("Supprimer ce membre de l'équipe ?")) return;
    const { error } = await supabase.from('team_members').delete().eq('id', id);
    if (error) toast.error("Erreur de suppression");
    else {
      toast.success("Membre supprimé");
      loadAllData();
    }
  };

  const toggleUserPremium = async (userId, currentStatus) => {
    const { error } = await supabase.from('profiles').update({ is_premium: !currentStatus }).eq('id', userId);
    if (!error) {
      toast.success("Statut premium mis à jour");
      loadAllData();
    }
  };

  const deleteContent = async (id, type) => {
    if (!window.confirm("Supprimer ce contenu définitivement ?")) return;
    const table = type === 'Upload' ? 'uploads' : 'posts';
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (!error) {
      toast.success("Contenu supprimé");
      loadAllData();
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm("Supprimer cet événement ?")) return;
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) toast.error("Erreur de suppression");
    else {
      toast.success("Événement supprimé");
      loadAllData();
    }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-[#D4AF37] font-black text-2xl animate-pulse">KLTUR RAP ADMIN...</div>;
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col">
      <Helmet><title>Admin - KLTUR RAP</title></Helmet>
      <Header />

      <main className="flex-grow py-12 px-4 max-w-7xl mx-auto w-full">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 bg-[#0a0a0a] p-8 rounded-3xl border border-[#222]">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-[#D4AF37] rounded-2xl text-black shadow-[0_0_40px_rgba(212,175,55,0.2)]">
              <Shield className="w-12 h-12" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight">Espace Administration</h1>
              <p className="text-white/40 font-bold uppercase text-xs tracking-widest mt-1">Gestion complète de la plateforme</p>
            </div>
          </div>
          <div className="flex gap-4">
             <div className="bg-[#111] px-6 py-3 rounded-2xl border border-[#222] text-center">
                <p className="text-2xl font-black text-[#D4AF37]">{users.length}</p>
                <p className="text-[10px] text-white/40 uppercase font-bold">Membres</p>
             </div>
             <div className="bg-[#111] px-6 py-3 rounded-2xl border border-[#222] text-center">
                <p className="text-2xl font-black text-[#D4AF37]">{contents.length}</p>
                <p className="text-[10px] text-white/40 uppercase font-bold">Contenus</p>
             </div>
          </div>
        </div>

        <Tabs defaultValue="events" className="w-full">
          <TabsList className="bg-[#0a0a0a] border border-[#222] p-1 mb-8 w-full justify-start overflow-x-auto overflow-y-hidden no-scrollbar h-auto">
            <TabsTrigger value="events" className="flex-shrink-0 data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black font-bold py-3 px-4 md:px-8">
              <Calendar className="w-4 h-4 mr-2" /> Événements
            </TabsTrigger>
            <TabsTrigger value="radio" className="flex-shrink-0 data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black font-bold py-3 px-4 md:px-8">
              <Radio className="w-4 h-4 mr-2" /> Radio
            </TabsTrigger>
            <TabsTrigger value="news" className="flex-shrink-0 data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black font-bold py-3 px-4 md:px-8">
              <Newspaper className="w-4 h-4 mr-2" /> News
            </TabsTrigger>
            <TabsTrigger value="team" className="flex-shrink-0 data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black font-bold py-3 px-4 md:px-8">
              <UserCircle className="w-4 h-4 mr-2" /> Équipe
            </TabsTrigger>
            <TabsTrigger value="users" className="flex-shrink-0 data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black font-bold py-3 px-4 md:px-8">
              <Users className="w-4 h-4 mr-2" /> Utilisateurs
            </TabsTrigger>
            <TabsTrigger value="content" className="flex-shrink-0 data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black font-bold py-3 px-4 md:px-8">
              <Music className="w-4 h-4 mr-2" /> Contenus
            </TabsTrigger>
          </TabsList>

          {/* EVENTS TAB */}
          <TabsContent value="events" className="space-y-8 outline-none">
            {/* Form */}
            <div className="bg-[#0a0a0a] p-8 rounded-3xl border border-[#222] relative">
              <h3 className="text-xl font-bold mb-8 flex items-center gap-2 text-[#D4AF37]">
                {editingEvent ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                {editingEvent ? "Modifier l'événement" : "Créer un nouvel événement"}
              </h3>

              <form onSubmit={handleCreateOrUpdateEvent} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-2">
                   <div
                    onClick={() => document.getElementById('eventImg').click()}
                    className="w-full h-56 rounded-2xl border-2 border-dashed border-[#333] overflow-hidden bg-[#111] relative group cursor-pointer flex flex-col items-center justify-center text-white/20 hover:border-[#D4AF37]/50 transition-all"
                   >
                    {eventImagePreview ? (
                      <img src={eventImagePreview} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <>
                        <ImageIcon className="w-12 h-12 mb-2" />
                        <p className="text-sm font-bold uppercase">Image de l'affiche / Flyer</p>
                      </>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Camera className="w-10 h-10 text-white" />
                    </div>
                    <input type="file" id="eventImg" hidden accept="image/*" onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setEventImage(file);
                        setEventImagePreview(URL.createObjectURL(file));
                      }
                    }} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-white/60 font-bold uppercase text-[10px]">Titre</Label>
                  <Input value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} required className="bg-[#111] border-[#222] h-12 focus:border-[#D4AF37]" placeholder="Ex: Concert Rap RCA" />
                </div>

                <div className="space-y-2">
                  <Label className="text-white/60 font-bold uppercase text-[10px]">Date et Heure</Label>
                  <Input type="datetime-local" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} required className="bg-[#111] border-[#222] h-12 focus:border-[#D4AF37] [color-scheme:dark]" />
                </div>

                <div className="space-y-2">
                  <Label className="text-white/60 font-bold uppercase text-[10px]">Lieu</Label>
                  <Input value={newEvent.location} onChange={e => setNewEvent({...newEvent, location: e.target.value})} required className="bg-[#111] border-[#222] h-12 focus:border-[#D4AF37]" placeholder="Ex: Stade de Bangui" />
                </div>

                <div className="space-y-2">
                  <Label className="text-white/60 font-bold uppercase text-[10px]">Catégorie</Label>
                  <Input value={newEvent.event_type} onChange={e => setNewEvent({...newEvent, event_type: e.target.value})} className="bg-[#111] border-[#222] h-12 focus:border-[#D4AF37]" placeholder="Concert, Battle, Festival..." />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label className="text-white/60 font-bold uppercase text-[10px]">Description</Label>
                  <Textarea value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} className="bg-[#111] border-[#222] focus:border-[#D4AF37] min-h-[100px] resize-none" placeholder="Détails de l'événement..." />
                </div>

                <div className="md:col-span-2 flex gap-4">
                  <Button type="submit" disabled={isSubmitting} className="flex-grow bg-[#D4AF37] text-black font-black uppercase h-14 rounded-2xl gold-glow hover:bg-[#b5952f]">
                    {isSubmitting ? 'Publication...' : (editingEvent ? 'Enregistrer les modifications' : 'Publier sur l\'App')}
                  </Button>
                  {editingEvent && (
                    <Button type="button" variant="outline" onClick={cancelEdit} className="border-[#333] text-white px-8 rounded-2xl hover:bg-red-500 hover:text-white hover:border-red-500 transition-all">
                      Annuler
                    </Button>
                  )}
                </div>
              </form>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 gap-6">
              <h4 className="text-sm font-black uppercase tracking-[0.2em] text-[#D4AF37]">Événements publiés</h4>
              {events.length === 0 ? (
                <div className="text-center py-20 bg-[#0a0a0a] rounded-3xl border border-[#222] text-white/20">Aucun événement à afficher</div>
              ) : events.map(ev => (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={ev.id} className="bg-[#0a0a0a] p-6 rounded-3xl border border-[#222] flex flex-col md:flex-row items-center justify-between gap-6 hover:border-[#D4AF37]/30 transition-all group">
                  <div className="flex items-center gap-6 w-full">
                    <div className="h-20 w-20 rounded-2xl overflow-hidden bg-[#111] shrink-0 border border-[#333]">
                      {(ev.image || ev.image_url) ? (
                        <img src={getPublicImageUrl('covers', ev.image || ev.image_url)} className="h-full w-full object-cover" alt="" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-white/10"><Calendar className="w-8 h-8" /></div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-black uppercase text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded-full mb-2 inline-block">{ev.event_type || 'Concert'}</span>
                      <h4 className="font-black text-xl text-white truncate">{ev.title}</h4>
                      <div className="flex flex-wrap gap-4 mt-1 text-sm text-white/40 font-bold uppercase tracking-wider">
                         <span>{new Date(ev.date).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                         <span>• {ev.location}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="outline" onClick={() => startEditEvent(ev)} className="border-[#333] text-white hover:border-[#D4AF37] hover:text-[#D4AF37] rounded-xl h-12 w-12 p-0">
                      <Edit className="w-5 h-5" />
                    </Button>
                    <Button variant="outline" onClick={() => handleDeleteEvent(ev.id)} className="border-[#333] text-red-500 hover:bg-red-500/10 hover:border-red-500/50 rounded-xl h-12 w-12 p-0">
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* RADIO TAB */}
          <TabsContent value="radio" className="space-y-8 outline-none">
             <div className="bg-[#0a0a0a] p-8 rounded-3xl border border-[#222]">
              <h3 className="text-xl font-bold mb-8 flex items-center gap-2 text-[#D4AF37]">
                <Radio className="w-5 h-5" />
                {editingEpisode ? "Modifier l'épisode radio" : "Ajouter un nouvel épisode"}
              </h3>

              <form onSubmit={handleCreateOrUpdateEpisode} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-white/60 font-bold uppercase text-[10px]">Titre de l'épisode</Label>
                  <Input value={newEpisode.title} onChange={e => setNewEpisode({...newEpisode, title: e.target.value})} required className="bg-[#111] border-[#222] h-12 focus:border-[#D4AF37]" placeholder="Ex: Épisode 12 : Spécial Makassy" />
                </div>

                <div className="space-y-2">
                  <Label className="text-white/60 font-bold uppercase text-[10px]">Date de diffusion</Label>
                  <Input type="date" value={newEpisode.date} onChange={e => setNewEpisode({...newEpisode, date: e.target.value})} required className="bg-[#111] border-[#222] h-12 focus:border-[#D4AF37] [color-scheme:dark]" />
                </div>

                <div className="space-y-2">
                  <Label className="text-white/60 font-bold uppercase text-[10px]">Durée</Label>
                  <Input value={newEpisode.duration} onChange={e => setNewEpisode({...newEpisode, duration: e.target.value})} required className="bg-[#111] border-[#222] h-12 focus:border-[#D4AF37]" placeholder="Ex: 60:00" />
                </div>

                <div className="space-y-4">
                  <Label className="text-white/60 font-bold uppercase text-[10px]">Source de l'audio</Label>
                  <div className="flex gap-4 p-1 bg-[#111] border border-[#222] rounded-xl h-12">
                    <button
                      type="button"
                      onClick={() => setAudioSourceType('link')}
                      className={`flex-1 flex items-center justify-center gap-2 rounded-lg text-xs font-bold transition-all ${audioSourceType === 'link' ? 'bg-[#D4AF37] text-black' : 'text-white/40 hover:text-white'}`}
                    >
                      <LinkIcon className="w-3.5 h-3.5" /> Lien Externe
                    </button>
                    <button
                      type="button"
                      onClick={() => setAudioSourceType('file')}
                      className={`flex-1 flex items-center justify-center gap-2 rounded-lg text-xs font-bold transition-all ${audioSourceType === 'file' ? 'bg-[#D4AF37] text-black' : 'text-white/40 hover:text-white'}`}
                    >
                      <FileAudio className="w-3.5 h-3.5" /> Fichier Audio
                    </button>
                  </div>

                  {audioSourceType === 'link' ? (
                    <Input
                      value={newEpisode.audio_url}
                      onChange={e => setNewEpisode({...newEpisode, audio_url: e.target.value})}
                      className="bg-[#111] border-[#222] h-12 focus:border-[#D4AF37]"
                      placeholder="https://... (ex: SoundCloud, MP3 direct)"
                    />
                  ) : (
                    <div className="relative h-12">
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={e => setAudioFile(e.target.files[0])}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      />
                      <div className="h-full border border-[#222] bg-[#111] rounded-xl flex items-center px-4 text-xs font-bold text-white/60">
                        {audioFile ? audioFile.name : "Sélectionner un fichier MP3..."}
                      </div>
                    </div>
                  )}
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label className="text-white/60 font-bold uppercase text-[10px]">Description / Résumé</Label>
                  <Textarea value={newEpisode.description} onChange={e => setNewEpisode({...newEpisode, description: e.target.value})} className="bg-[#111] border-[#222] focus:border-[#D4AF37] min-h-[100px] resize-none" placeholder="De quoi parle cet épisode ?" />
                </div>

                <div className="md:col-span-2 flex gap-4">
                  <Button type="submit" disabled={isSubmitting} className="flex-grow bg-[#D4AF37] text-black font-black uppercase h-14 rounded-2xl gold-glow hover:bg-[#b5952f]">
                    {isSubmitting ? 'Enregistrement...' : (editingEpisode ? 'Mettre à jour' : 'Publier l\'épisode')}
                  </Button>
                  {editingEpisode && (
                    <Button type="button" variant="outline" onClick={() => { setEditingEpisode(null); setNewEpisode({ title: '', date: '', duration: '', description: '', audio_url: '' }); }} className="border-[#333] text-white px-8 rounded-2xl hover:bg-red-500 transition-all">
                      Annuler
                    </Button>
                  )}
                </div>
              </form>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <h4 className="text-sm font-black uppercase tracking-[0.2em] text-[#D4AF37]">Archives Radio</h4>
              {radioEpisodes.length === 0 ? (
                <div className="text-center py-20 bg-[#0a0a0a] rounded-3xl border border-[#222] text-white/20">Aucun épisode archivé</div>
              ) : radioEpisodes.map(ep => (
                <div key={ep.id} className="bg-[#0a0a0a] p-6 rounded-3xl border border-[#222] flex items-center justify-between gap-6 hover:border-[#D4AF37]/30 transition-all">
                  <div className="flex items-center gap-6">
                    <div className="h-14 w-14 rounded-xl bg-[#111] flex items-center justify-center text-[#D4AF37] border border-[#222]">
                      <Radio className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-black text-white">{ep.title}</h4>
                      <p className="text-xs text-white/40 font-bold uppercase tracking-wider">{new Date(ep.date).toLocaleDateString('fr-FR')} • {ep.duration}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => startEditEpisode(ep)} className="border-[#333] text-white hover:border-[#D4AF37] rounded-xl h-10 w-10 p-0">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" onClick={() => handleDeleteEpisode(ep.id)} className="border-[#333] text-red-500 hover:bg-red-500/10 rounded-xl h-10 w-10 p-0">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* NEWS TAB */}
          <TabsContent value="news" className="space-y-8 outline-none">
             <div className="bg-[#0a0a0a] p-8 rounded-3xl border border-[#222]">
              <h3 className="text-xl font-bold mb-8 flex items-center gap-2 text-[#D4AF37]">
                <Newspaper className="w-5 h-5" />
                {editingNews ? "Modifier l'article" : "Publier une actualité"}
              </h3>

              <form onSubmit={handleCreateOrUpdateNews} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-white/60 font-bold uppercase text-[10px]">Titre de l'actualité</Label>
                  <Input value={newNews.title} onChange={e => setNewNews({...newNews, title: e.target.value})} required className="bg-[#111] border-[#222] h-12 focus:border-[#D4AF37]" placeholder="Ex: Sortie de l'album de..." />
                </div>

                <div className="space-y-2">
                  <Label className="text-white/60 font-bold uppercase text-[10px]">Catégorie</Label>
                  <Select value={newNews.category} onValueChange={v => setNewNews({...newNews, category: v})}>
                    <SelectTrigger className="bg-[#111] border-[#222] h-12 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111] border-[#222] text-white">
                      <SelectItem value="News">News</SelectItem>
                      <SelectItem value="Interviews">Interviews</SelectItem>
                      <SelectItem value="Ateliers">Ateliers</SelectItem>
                      <SelectItem value="Chroniques">Chroniques</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-white/60 font-bold uppercase text-[10px]">URL de l'image</Label>
                  <Input value={newNews.image_url} onChange={e => setNewNews({...newNews, image_url: e.target.value})} className="bg-[#111] border-[#222] h-12 focus:border-[#D4AF37]" placeholder="https://images.unsplash.com/..." />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label className="text-white/60 font-bold uppercase text-[10px]">Extrait (Court résumé)</Label>
                  <Input value={newNews.excerpt} onChange={e => setNewNews({...newNews, excerpt: e.target.value})} className="bg-[#111] border-[#222] h-12 focus:border-[#D4AF37]" placeholder="Quelques mots pour attirer l'attention..." />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label className="text-white/60 font-bold uppercase text-[10px]">Contenu de l'article</Label>
                  <Textarea value={newNews.content} onChange={e => setNewNews({...newNews, content: e.target.value})} className="bg-[#111] border-[#222] focus:border-[#D4AF37] min-h-[200px] resize-none" placeholder="Rédigez votre article ici..." />
                </div>

                <div className="space-y-2">
                  <Label className="text-white/60 font-bold uppercase text-[10px]">Lien source (Optionnel)</Label>
                  <Input value={newNews.source_url} onChange={e => setNewNews({...newNews, source_url: e.target.value})} className="bg-[#111] border-[#222] h-12 focus:border-[#D4AF37]" placeholder="Lien vers article original..." />
                </div>

                <div className="md:col-span-2 flex gap-4">
                  <Button type="submit" disabled={isSubmitting} className="flex-grow bg-[#D4AF37] text-black font-black uppercase h-14 rounded-2xl gold-glow hover:bg-[#b5952f]">
                    {isSubmitting ? 'Enregistrement...' : (editingNews ? 'Enregistrer les modifications' : 'Publier l\'article')}
                  </Button>
                  {editingNews && (
                    <Button type="button" variant="outline" onClick={() => { setEditingNews(null); setNewNews({ title: '', category: 'News', excerpt: '', content: '', image_url: '', source_url: '' }); }} className="border-[#333] text-white px-8 rounded-2xl hover:bg-red-500 transition-all">
                      Annuler
                    </Button>
                  )}
                </div>
              </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {news.length === 0 ? (
                <div className="md:col-span-2 text-center py-20 bg-[#0a0a0a] rounded-3xl border border-[#222] text-white/20">Aucun article publié</div>
              ) : news.map(n => (
                <div key={n.id} className="bg-[#0a0a0a] p-5 rounded-3xl border border-[#222] flex gap-5 hover:border-[#D4AF37]/30 transition-all group">
                   <div className="h-24 w-24 rounded-2xl overflow-hidden shrink-0 border border-[#333]">
                      <img src={n.image_url || 'https://via.placeholder.com/150'} className="h-full w-full object-cover" alt="" />
                   </div>
                   <div className="flex-grow min-w-0">
                      <span className="text-[10px] font-black uppercase text-[#D4AF37] mb-1 inline-block">{n.category}</span>
                      <h4 className="font-bold text-white truncate text-lg mb-2">{n.title}</h4>
                      <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm" onClick={() => startEditNews(n)} className="h-8 border-[#222] text-xs font-bold text-white hover:border-[#D4AF37]">
                          <Edit className="w-3 h-3 mr-1" /> Modifier
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteNews(n.id)} className="h-8 border-[#222] text-xs font-bold text-red-500 hover:bg-red-500/10">
                          <Trash2 className="w-3 h-3 mr-1" />
                        </Button>
                      </div>
                   </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* TEAM TAB */}
          <TabsContent value="team" className="space-y-8 outline-none">
            <div className="bg-[#0a0a0a] p-8 rounded-3xl border border-[#222]">
              <h3 className="text-xl font-bold mb-8 flex items-center gap-2 text-[#D4AF37]">
                <UserCircle className="w-5 h-5" />
                {editingMember ? "Modifier le membre" : "Ajouter un membre à l'équipe"}
              </h3>

              <form onSubmit={handleCreateOrUpdateMember} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-white/60 font-bold uppercase text-[10px]">Nom complet</Label>
                  <Input value={newMember.name} onChange={e => setNewMember({...newMember, name: e.target.value})} required className="bg-[#111] border-[#222] h-12 focus:border-[#D4AF37]" placeholder="Ex: Jonathan Mambachaka" />
                </div>

                <div className="space-y-2">
                  <Label className="text-white/60 font-bold uppercase text-[10px]">Rôle / Poste</Label>
                  <Input value={newMember.role} onChange={e => setNewMember({...newMember, role: e.target.value})} required className="bg-[#111] border-[#222] h-12 focus:border-[#D4AF37]" placeholder="Ex: CEO & Fondateur" />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label className="text-white/60 font-bold uppercase text-[10px]">URL de la photo</Label>
                  <Input value={newMember.image_url} onChange={e => setNewMember({...newMember, image_url: e.target.value})} required className="bg-[#111] border-[#222] h-12 focus:border-[#D4AF37]" placeholder="https://..." />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label className="text-white/60 font-bold uppercase text-[10px]">Biographie courte</Label>
                  <Textarea value={newMember.bio} onChange={e => setNewMember({...newMember, bio: e.target.value})} className="bg-[#111] border-[#222] focus:border-[#D4AF37] min-h-[100px] resize-none" placeholder="Description du membre..." />
                </div>

                <div className="md:col-span-2 flex gap-4">
                  <Button type="submit" disabled={isSubmitting} className="flex-grow bg-[#D4AF37] text-black font-black uppercase h-14 rounded-2xl gold-glow hover:bg-[#b5952f]">
                    {isSubmitting ? 'Enregistrement...' : (editingMember ? 'Mettre à jour' : 'Ajouter à l\'équipe')}
                  </Button>
                  {editingMember && (
                    <Button type="button" variant="outline" onClick={() => { setEditingMember(null); setNewMember({ name: '', role: '', bio: '', image_url: '' }); }} className="border-[#333] text-white px-8 rounded-2xl hover:bg-red-500 transition-all">
                      Annuler
                    </Button>
                  )}
                </div>
              </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teamMembers.length === 0 ? (
                <div className="md:col-span-3 text-center py-20 bg-[#0a0a0a] rounded-3xl border border-[#222] text-white/20">Aucun membre enregistré</div>
              ) : teamMembers.map(m => (
                <div key={m.id} className="bg-[#0a0a0a] p-5 rounded-3xl border border-[#222] flex flex-col hover:border-[#D4AF37]/30 transition-all group">
                   <div className="h-48 w-full rounded-2xl overflow-hidden border border-[#333] mb-4">
                      <img src={m.image_url || 'https://via.placeholder.com/300'} className="h-full w-full object-cover filter grayscale group-hover:grayscale-0 transition-all" alt="" />
                   </div>
                   <div className="flex-grow">
                      <h4 className="font-bold text-white text-lg">{m.name}</h4>
                      <p className="text-[#D4AF37] text-xs font-black uppercase tracking-widest mb-3">{m.role}</p>
                      <p className="text-white/50 text-sm line-clamp-3 mb-4">{m.bio}</p>
                      <div className="flex items-center gap-2 pt-4 border-t border-[#222]">
                        <Button variant="outline" size="sm" onClick={() => startEditMember(m)} className="flex-1 h-10 border-[#222] text-xs font-bold text-white hover:border-[#D4AF37]">
                          <Edit className="w-3.5 h-3.5 mr-1" /> Modifier
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteMember(m.id)} className="h-10 w-10 border-[#222] text-red-500 hover:bg-red-500/10">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                   </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* USERS TAB */}
          <TabsContent value="users" className="outline-none">
            <div className="bg-[#0a0a0a] rounded-3xl border border-[#222] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-[#111] text-[10px] font-black uppercase tracking-widest text-white/40 border-b border-[#222]">
                    <tr>
                      <th className="px-8 py-6">Membre</th>
                      <th className="px-8 py-6">Rôle & Contact</th>
                      <th className="px-8 py-6">Date Inscription</th>
                      <th className="px-8 py-6 text-right">Action Premium</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#222]">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12 border-2 border-[#222] group-hover:border-[#D4AF37]/30 transition-all">
                              <AvatarImage src={getPublicImageUrl('avatars', u.avatar || u.profilePhoto)} />
                              <AvatarFallback className="bg-[#111] text-[#D4AF37] font-black">{u.username?.charAt(0) || u.email?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-black text-white flex items-center gap-1.5">
                                {u.username || u.name}
                                {u.is_premium && <Star className="w-3.5 h-3.5 fill-[#D4AF37] text-[#D4AF37]" />}
                              </p>
                              <p className="text-xs text-white/40 truncate">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className="text-[10px] font-black uppercase text-[#D4AF37] border border-[#D4AF37]/30 px-2 py-1 rounded bg-[#D4AF37]/5">{u.user_role || 'Membre'}</span>
                          {u.phone && <p className="text-[10px] text-white/40 mt-1.5 font-bold uppercase">{u.phone}</p>}
                        </td>
                        <td className="px-8 py-5 text-sm text-white/60 font-medium">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString('fr-FR') : 'Inconnue'}
                        </td>
                        <td className="px-8 py-5 text-right">
                          <Button
                            size="sm" variant="outline"
                            onClick={() => toggleUserPremium(u.id, u.is_premium)}
                            className={`rounded-xl font-bold text-[10px] uppercase h-10 ${u.is_premium ? "border-red-500/20 text-red-400 hover:bg-red-500/10" : "border-[#D4AF37]/20 text-[#D4AF37] hover:bg-[#D4AF37]/10"}`}
                          >
                            {u.is_premium ? 'Retirer Certif.' : 'Certifier Membre'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* CONTENT TAB */}
          <TabsContent value="content" className="outline-none">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {contents.map(c => (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} key={`${c.contentType}-${c.id}`} className="bg-[#0a0a0a] rounded-2xl border border-[#222] overflow-hidden group hover:border-[#D4AF37]/30 transition-all">
                  <div className="aspect-video relative overflow-hidden bg-[#111]">
                    <img src={getPublicImageUrl(c.contentType === 'Upload' ? 'covers' : 'posts', c.cover_art || c.content_url)} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700" alt="" />
                    <div className="absolute top-2 left-2 bg-black/80 backdrop-blur text-[8px] font-black uppercase px-2 py-1 rounded border border-white/10 tracking-widest">
                      {c.contentType === 'Upload' ? (c.type || 'MUSIQUE') : 'POST'}
                    </div>
                  </div>
                  <div className="p-5">
                    <h4 className="font-black text-sm truncate text-white mb-1">{c.title}</h4>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-4">Par @{c.profiles?.username || 'Inconnu'}</p>

                    <div className="grid grid-cols-3 gap-2 border-t border-[#222] pt-4 mb-4">
                       <div className="text-center">
                          <p className="text-xs font-black text-[#D4AF37]">{c.view_count || 0}</p>
                          <Eye className="w-3 h-3 mx-auto mt-0.5 text-white/20" />
                       </div>
                       <div className="text-center border-x border-[#222]">
                          <p className="text-xs font-black text-white">{c.likes_count || 0}</p>
                          <Heart className="w-3 h-3 mx-auto mt-0.5 text-white/20" />
                       </div>
                       <div className="text-center">
                          <p className="text-xs font-black text-white">{c.download_count || 0}</p>
                          <Download className="w-3 h-3 mx-auto mt-0.5 text-white/20" />
                       </div>
                    </div>

                    <div className="flex gap-2">
                       <Button asChild size="sm" variant="ghost" className="flex-grow text-[10px] font-black uppercase text-white/60 hover:text-[#D4AF37] hover:bg-transparent">
                          <Link to={c.contentType === 'Upload' ? `/uploads/${c.id}` : `/posts/${c.id}`}>Ouvrir <ChevronRight className="w-3 h-3 ml-1"/></Link>
                       </Button>
                       <Button size="sm" variant="ghost" onClick={() => deleteContent(c.id, c.contentType)} className="text-red-500 hover:bg-red-500/10 rounded-lg h-9 w-9 p-0">
                          <Trash2 className="w-4 h-4" />
                       </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default AdminDashboard;
