import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Calendar, Users, Music, Plus, Trash2, Image as ImageIcon, Camera, Star, Edit, X, Eye, Download, Heart, MessageSquare, ChevronRight, BarChart3, Newspaper, Radio, Trophy, Settings, TrendingUp, DollarSign, FileSpreadsheet, FileText, DownloadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
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
  const [news, setNews] = useState([]);
  const [radioEpisodes, setRadioEpisodes] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalViews: 0,
    totalDownloads: 0,
    totalLikes: 0,
    userGrowth: [],
    contentDistribution: []
  });

  // Form states
  const [newEvent, setNewEvent] = useState({ title: '', date: '', location: '', event_type: 'Concert', description: '' });
  const [eventImage, setEventImage] = useState(null);
  const [eventImagePreview, setEventImagePreview] = useState(null);

  const [newNews, setNewNews] = useState({ title: '', content: '', category: 'News', source_url: '', published_at: new Date().toISOString().slice(0, 16) });
  const [newsImage, setNewsImage] = useState(null);
  const [newsImagePreview, setNewsImagePreview] = useState(null);

  const [newRadio, setNewRadio] = useState({ title: '', description: '', is_external: false, external_url: '', date: new Date().toISOString().slice(0, 16) });
  const [radioFile, setRadioFile] = useState(null);

  // Edit states
  const [editingEvent, setEditingEvent] = useState(null);
  const [editingNews, setEditingNews] = useState(null);
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
    try {
      // 1. Fetch Events
      const { data: evs, error: eErr } = await supabase.from('events').select('*').order('date', { ascending: true });
      if (!eErr) setEvents(evs || []);

      // 2. Fetch Users
      const { data: usrs, error: uErr } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (!uErr) setUsers(usrs || []);

      // 3. Fetch News
      const { data: nws, error: nErr } = await supabase.from('news').select('*, profiles:author_id(username)').order('created_at', { ascending: false });
      if (!nErr) setNews(nws || []);

      // 4. Fetch Contents (Uploads & Posts)
      const { data: ups } = await supabase.from('uploads').select('*, profiles:user_id(username)');
      const { data: pts } = await supabase.from('posts').select('*, profiles:user_id(username)');

      // 5. Fetch Radio Episodes
      const { data: radioEvs, error: rErr } = await supabase.from('radio_episodes').select('*').order('created_at', { ascending: false });
      if (!rErr) setRadioEpisodes(radioEvs || []);

      const combined = [
        ...(ups || []).map(u => ({ ...u, contentType: 'Upload' })),
        ...(pts || []).map(p => ({ ...p, contentType: 'Post', title: p.caption || 'Publication' }))
      ].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

      setContents(combined);

      // 6. Calculate Analytics
      const totalViews = (ups || []).reduce((acc, u) => acc + (u.view_count || 0), 0);
      const totalDownloads = (ups || []).reduce((acc, u) => acc + (u.download_count || 0), 0);
      const totalLikes = [...(ups || []), ...(pts || [])].reduce((acc, c) => acc + (c.likes_count || 0), 0);

      setAnalytics({
        totalViews,
        totalDownloads,
        totalLikes,
        userGrowth: [
          { name: 'Début', users: 0, content: 0 },
          { name: 'Actuel', users: usrs?.length || 0, content: combined?.length || 0 }
        ],
        contentDistribution: [
          { name: 'Musique', value: ups?.length || 0 },
          { name: 'Posts', value: pts?.length || 0 },
          { name: 'News', value: nws?.length || 0 },
        ]
      });

    } catch (e) {
      console.error("Data loading error", e);
    }
  };

  const handleCreateOrUpdateNews = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let imageUrl = editingNews?.image_url || null;

      if (newsImage) {
        const fileExt = newsImage.name.split('.').pop();
        const fileName = `news/${Date.now()}.${fileExt}`;
        const { data: storageData, error: storageError } = await supabase.storage
          .from('covers')
          .upload(fileName, newsImage);
        if (storageError) throw storageError;
        imageUrl = storageData.path;
      }

      const newsData = {
        title: newNews.title,
        content: newNews.content,
        category: newNews.category,
        source_url: newNews.source_url,
        published_at: newNews.published_at,
        image_url: imageUrl,
        author_id: currentUser.id
      };

      if (editingNews) {
        const { error } = await supabase.from('news').update(newsData).eq('id', editingNews.id);
        if (error) throw error;
        toast.success("Actualité mise à jour !");
      } else {
        const { error } = await supabase.from('news').insert([newsData]);
        if (error) throw error;
        toast.success("Actualité publiée !");
      }

      setNewNews({ title: '', content: '', category: 'News', source_url: '' });
      setNewsImage(null);
      setNewsImagePreview(null);
      setEditingNews(null);
      loadAllData();
    } catch (err) {
      console.error(err);
      toast.error(`Erreur: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNews = async (id) => {
    if (!window.confirm("Supprimer cette actualité ?")) return;
    const { error } = await supabase.from('news').delete().eq('id', id);
    if (!error) {
      toast.success("Actualité supprimée");
      loadAllData();
    }
  };

  const startEditNews = (n) => {
    setEditingNews(n);
    setNewNews({
      title: n.title,
      content: n.content,
      category: n.category || 'News',
      source_url: n.source_url || '',
      published_at: new Date(n.published_at || n.created_at).toISOString().slice(0, 16)
    });
    setNewsImagePreview(n.image_url ? getPublicImageUrl('covers', n.image_url) : null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreateOrUpdateEvent = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let imageUrl = editingEvent?.image_url || null;

      if (eventImage) {
        const fileExt = eventImage.name.split('.').pop();
        const fileName = `events/${Date.now()}.${fileExt}`;
        const { data: storageData, error: storageError } = await supabase.storage
          .from('covers')
          .upload(fileName, eventImage);
        if (storageError) throw storageError;
        imageUrl = storageData.path;
      }

      const eventData = {
        title: newEvent.title,
        date: newEvent.date,
        location: newEvent.location,
        event_type: newEvent.event_type,
        description: newEvent.description,
        image_url: imageUrl,
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
    setEventImagePreview(event.image_url ? getPublicImageUrl('covers', event.image_url) : null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingEvent(null);
    setNewEvent({ title: '', date: '', location: '', event_type: 'Concert', description: '' });
    setEventImage(null);
    setEventImagePreview(null);
  };

  const toggleUserPremium = async (userId, currentStatus) => {
    const { error } = await supabase.from('profiles').update({ is_premium: !currentStatus }).eq('id', userId);
    if (!error) {
      toast.success("Statut premium mis à jour");
      loadAllData();
    }
  };

  const toggleUserAdmin = async (userId, currentStatus) => {
    if (userId === currentUser.id) {
      toast.error("Vous ne pouvez pas retirer vos propres droits admin");
      return;
    }
    const { error } = await supabase.from('profiles').update({ is_admin: !currentStatus }).eq('id', userId);
    if (!error) {
      toast.success(currentStatus ? "Accès admin retiré" : "Nouvel administrateur ajouté !");
      loadAllData();
    } else {
      toast.error("Erreur lors du changement de rôle");
    }
  };

  const handleCreateRadioEpisode = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let audioUrl = null;

      if (!newRadio.is_external && radioFile) {
        const fileExt = radioFile.name.split('.').pop();
        const fileName = `radio/${Date.now()}.${fileExt}`;
        const { data: storageData, error: storageError } = await supabase.storage
          .from('uploads')
          .upload(fileName, radioFile);
        if (storageError) throw storageError;
        audioUrl = storageData.path;
      }

      const radioData = {
        title: newRadio.title,
        description: newRadio.description,
        is_external: newRadio.is_external,
        audio_url: audioUrl,
        external_url: newRadio.external_url,
        date: newRadio.date,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase.from('radio_episodes').insert([radioData]);
      if (error) throw error;

      toast.success("Épisode radio ajouté !");
      setNewRadio({ title: '', description: '', is_external: false, external_url: '', date: new Date().toISOString().slice(0, 16) });
      setRadioFile(null);
      loadAllData();
    } catch (err) {
      console.error(err);
      toast.error(`Erreur Radio: ${err.message}`);
    } finally {
      setIsSubmitting(false);
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

  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) {
      toast.error("Aucune donnée à exporter");
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        let cell = row[header] === null || row[header] === undefined ? '' : row[header];
        // Handle objects (like profiles expansion)
        if (typeof cell === 'object') cell = JSON.stringify(cell).replace(/"/g, '""');
        // Escape commas and quotes
        cell = `"${String(cell).replace(/"/g, '""')}"`;
        return cell;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Export CSV terminé");
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-[#D4AF37] font-black text-2xl animate-pulse uppercase tracking-tighter">Chargement Admin...</div>;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 text-center">
        <Shield className="w-20 h-20 text-red-500 mb-6 opacity-20" />
        <h1 className="text-2xl font-black text-white uppercase mb-2">Accès Refusé</h1>
        <p className="text-white/40 mb-8 max-w-xs">Vous devez être administrateur pour accéder à cet espace.</p>
        <Button asChild className="bg-[#D4AF37] text-black font-bold">
          <Link to="/">Retour à l'accueil</Link>
        </Button>
      </div>
    );
  }

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
          <div className="flex flex-wrap gap-4 items-center">
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                   <Button variant="outline" className="border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black font-bold h-12 px-6 rounded-xl transition-all">
                      <FileSpreadsheet className="w-4 h-4 mr-2" /> Exporter Données
                   </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-[#111] border-[#222] text-white w-56">
                   <DropdownMenuItem onClick={() => exportToCSV(users, 'Membres_KLTUR')} className="cursor-pointer">
                      <Users className="w-4 h-4 mr-2" /> Liste des Membres
                   </DropdownMenuItem>
                   <DropdownMenuItem onClick={() => exportToCSV(contents, 'Contenus_KLTUR')} className="cursor-pointer">
                      <Music className="w-4 h-4 mr-2" /> Liste des Contenus
                   </DropdownMenuItem>
                   <DropdownMenuItem onClick={() => exportToCSV(events, 'Events_KLTUR')} className="cursor-pointer">
                      <Calendar className="w-4 h-4 mr-2" /> Événements
                   </DropdownMenuItem>
                   <DropdownMenuItem onClick={() => exportToCSV(news, 'News_KLTUR')} className="cursor-pointer">
                      <Newspaper className="w-4 h-4 mr-2" /> Actualités
                   </DropdownMenuItem>
                </DropdownMenuContent>
             </DropdownMenu>

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
        </div>

        <Tabs defaultValue="analytics" className="w-full">
          <TabsList className="bg-[#0a0a0a] border border-[#222] p-1 mb-8 flex flex-wrap h-auto">
            <TabsTrigger value="analytics" className="flex-grow data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black font-bold py-3 px-4">
              <BarChart3 className="w-4 h-4 mr-2" /> Analytics
            </TabsTrigger>
            <TabsTrigger value="news" className="flex-grow data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black font-bold py-3 px-4">
              <Newspaper className="w-4 h-4 mr-2" /> News
            </TabsTrigger>
            <TabsTrigger value="events" className="flex-grow data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black font-bold py-3 px-4">
              <Calendar className="w-4 h-4 mr-2" /> Événements
            </TabsTrigger>
            <TabsTrigger value="users" className="flex-grow data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black font-bold py-3 px-4">
              <Users className="w-4 h-4 mr-2" /> Utilisateurs
            </TabsTrigger>
            <TabsTrigger value="content" className="flex-grow data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black font-bold py-3 px-4">
              <Music className="w-4 h-4 mr-2" /> Contenus
            </TabsTrigger>
            <TabsTrigger value="radio" className="flex-grow data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black font-bold py-3 px-4">
              <Radio className="w-4 h-4 mr-2" /> Radio
            </TabsTrigger>
            <TabsTrigger value="team" className="flex-grow data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black font-bold py-3 px-4">
              <Shield className="w-4 h-4 mr-2" /> Équipe
            </TabsTrigger>
          </TabsList>

          {/* ANALYTICS TAB */}
          <TabsContent value="analytics" className="space-y-8 outline-none">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-[#0a0a0a] border-[#222] text-white">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-white/60">Vues Totales</CardTitle>
                  <Eye className="w-4 h-4 text-[#D4AF37]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-black">{analytics.totalViews.toLocaleString()}</div>
                  <p className="text-xs text-green-500 flex items-center mt-1"><TrendingUp className="w-3 h-3 mr-1"/> +12% ce mois</p>
                </CardContent>
              </Card>
              <Card className="bg-[#0a0a0a] border-[#222] text-white">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-white/60">Téléchargements</CardTitle>
                  <Download className="w-4 h-4 text-[#D4AF37]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-black">{analytics.totalDownloads.toLocaleString()}</div>
                  <p className="text-xs text-green-500 flex items-center mt-1"><TrendingUp className="w-3 h-3 mr-1"/> +5% ce mois</p>
                </CardContent>
              </Card>
              <Card className="bg-[#0a0a0a] border-[#222] text-white">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-white/60">Engagement (Likes)</CardTitle>
                  <Heart className="w-4 h-4 text-[#D4AF37]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-black">{analytics.totalLikes.toLocaleString()}</div>
                  <p className="text-xs text-white/40 mt-1">Sur tous les contenus</p>
                </CardContent>
              </Card>
              <Card className="bg-[#0a0a0a] border-[#222] text-white">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-white/60">Revenus Estimés</CardTitle>
                  <DollarSign className="w-4 h-4 text-[#D4AF37]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-black">450.000 <span className="text-xs font-bold">CFA</span></div>
                  <p className="text-xs text-white/40 mt-1">Via Premium & Pubs</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-2 bg-[#0a0a0a] border-[#222] text-white">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Croissance de la Plateforme</CardTitle>
                    <CardDescription className="text-white/40">Utilisateurs vs Contenus</CardDescription>
                  </div>
                  <Button onClick={() => exportToCSV(analytics.userGrowth, 'Croissance_Plateforme')} variant="ghost" size="sm" className="text-[#D4AF37] hover:bg-[#D4AF37]/10">
                    <DownloadCloud className="w-4 h-4 mr-2" /> Rapport CSV
                  </Button>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.userGrowth}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                      <XAxis dataKey="name" stroke="#666" />
                      <YAxis stroke="#666" />
                      <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333', color: '#fff' }} />
                      <Line type="monotone" dataKey="users" stroke="#D4AF37" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} />
                      <Line type="monotone" dataKey="content" stroke="#fff" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-[#0a0a0a] border-[#222] text-white">
                <CardHeader><CardTitle className="text-lg">Distribution Contenu</CardTitle></CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.contentDistribution}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {analytics.contentDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#D4AF37' : index === 1 ? '#fff' : '#444'} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333', color: '#fff' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-col gap-2 mt-4">
                    {analytics.contentDistribution.map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: i === 0 ? '#D4AF37' : i === 1 ? '#fff' : '#444' }} />
                          <span className="text-white/60">{item.name}</span>
                        </div>
                        <span className="font-bold">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* NEWS TAB */}
          <TabsContent value="news" className="space-y-8 outline-none">
            <div className="bg-[#0a0a0a] p-8 rounded-3xl border border-[#222]">
              <h3 className="text-xl font-bold mb-8 flex items-center gap-2 text-[#D4AF37]">
                {editingNews ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                {editingNews ? "Modifier l'article" : "Publier une actualité"}
              </h3>
              <form onSubmit={handleCreateOrUpdateNews} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-2">
                   <div
                    onClick={() => document.getElementById('newsImg').click()}
                    className="w-full h-56 rounded-2xl border-2 border-dashed border-[#333] overflow-hidden bg-[#111] relative group cursor-pointer flex flex-col items-center justify-center text-white/20 hover:border-[#D4AF37]/50 transition-all"
                   >
                    {newsImagePreview ? (
                      <img src={newsImagePreview} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <>
                        <ImageIcon className="w-12 h-12 mb-2" />
                        <p className="text-sm font-bold uppercase">Image de couverture</p>
                      </>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Camera className="w-10 h-10 text-white" />
                    </div>
                    <input type="file" id="newsImg" hidden accept="image/*" onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setNewsImage(file);
                        setNewsImagePreview(URL.createObjectURL(file));
                      }
                    }} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-white/60 font-bold uppercase text-[10px]">Titre</Label>
                  <Input value={newNews.title} onChange={e => setNewNews({...newNews, title: e.target.value})} required className="bg-[#111] border-[#222] h-12 focus:border-[#D4AF37]" placeholder="Le titre de l'article..." />
                </div>

                <div className="space-y-2">
                  <Label className="text-white/60 font-bold uppercase text-[10px]">Catégorie</Label>
                  <Select value={newNews.category} onValueChange={(val) => setNewNews({...newNews, category: val})}>
                    <SelectTrigger className="bg-[#111] border-[#222] h-12">
                      <SelectValue placeholder="Catégorie" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111] border-[#222] text-white">
                      <SelectItem value="News">News</SelectItem>
                      <SelectItem value="Interview">Interview</SelectItem>
                      <SelectItem value="Sortie">Nouvelle Sortie</SelectItem>
                      <SelectItem value="Event">Événement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label className="text-white/60 font-bold uppercase text-[10px]">Contenu de l'article</Label>
                  <Textarea value={newNews.content} onChange={e => setNewNews({...newNews, content: e.target.value})} className="bg-[#111] border-[#222] focus:border-[#D4AF37] min-h-[150px] resize-none" placeholder="Rédigez votre article ici..." />
                </div>

                <div className="space-y-2">
                  <Label className="text-white/60 font-bold uppercase text-[10px]">Lien source (Optionnel - ex: YouTube)</Label>
                  <Input value={newNews.source_url} onChange={e => setNewNews({...newNews, source_url: e.target.value})} className="bg-[#111] border-[#222] h-12 focus:border-[#D4AF37]" placeholder="https://..." />
                </div>

                <div className="space-y-2">
                  <Label className="text-white/60 font-bold uppercase text-[10px]">Date de Publication (Planification)</Label>
                  <Input
                    type="datetime-local"
                    value={newNews.published_at}
                    onChange={e => setNewNews({...newNews, published_at: e.target.value})}
                    className="bg-[#111] border-[#222] h-12 focus:border-[#D4AF37] [color-scheme:dark]"
                  />
                  <p className="text-[9px] text-[#D4AF37] font-bold">Laissez la date actuelle pour publier immédiatement.</p>
                </div>

                <div className="md:col-span-2 flex gap-4">
                  <Button type="submit" disabled={isSubmitting} className="flex-grow bg-[#D4AF37] text-black font-black uppercase h-14 rounded-2xl gold-glow hover:bg-[#b5952f]">
                    {isSubmitting ? 'Publication...' : (editingNews ? 'Enregistrer les modifications' : 'Publier l\'article')}
                  </Button>
                  {editingNews && (
                    <Button type="button" variant="outline" onClick={() => { setEditingNews(null); setNewNews({ title: '', content: '', category: 'News', source_url: '' }); setNewsImagePreview(null); }} className="border-[#333] text-white px-8 rounded-2xl">Annuler</Button>
                  )}
                </div>
              </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {news.map(n => (
                <div key={n.id} className="bg-[#0a0a0a] p-5 rounded-2xl border border-[#222] flex gap-4 group hover:border-[#D4AF37]/30 transition-all">
                  <img src={getPublicImageUrl('covers', n.image_url)} className="w-24 h-24 rounded-xl object-cover border border-[#222]" alt="" />
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[8px] font-black uppercase text-[#D4AF37] border border-[#D4AF37]/30 px-2 py-0.5 rounded">{n.category}</span>
                      {new Date(n.published_at) > new Date() && (
                        <span className="text-[8px] font-black uppercase text-blue-400 border border-blue-400/30 px-2 py-0.5 rounded bg-blue-400/5">Programmé</span>
                      )}
                    </div>
                    <h4 className="font-black text-white truncate">{n.title}</h4>
                    <p className="text-[10px] text-white/40 mt-1">
                      {new Date(n.published_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                    </p>
                    <div className="flex gap-2 mt-4">
                      <Button variant="ghost" onClick={() => startEditNews(n)} className="h-8 w-8 p-0 text-white/40 hover:text-white"><Edit className="w-4 h-4"/></Button>
                      <Button variant="ghost" onClick={() => handleDeleteNews(n.id)} className="h-8 w-8 p-0 text-red-500/40 hover:text-red-500"><Trash2 className="w-4 h-4"/></Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

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
                      {ev.image_url ? (
                        <img src={getPublicImageUrl('covers', ev.image_url)} className="h-full w-full object-cover" alt="" />
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
                              <AvatarFallback className="bg-[#111] text-[#D4AF37] font-black">
                                {(u.username || u.email || "U").charAt(0).toUpperCase()}
                              </AvatarFallback>
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
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} key={`${c.type}-${c.id}`} className="bg-[#0a0a0a] rounded-2xl border border-[#222] overflow-hidden group hover:border-[#D4AF37]/30 transition-all">
                  <div className="aspect-video relative overflow-hidden bg-[#111]">
                    <img src={getPublicImageUrl(c.type === 'Musique' ? 'covers' : 'posts', c.cover_art || c.content_url)} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700" alt="" />
                    <div className="absolute top-2 left-2 bg-black/80 backdrop-blur text-[8px] font-black uppercase px-2 py-1 rounded border border-white/10 tracking-widest">{c.type}</div>
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
                          <Link to={c.type === 'Musique' ? `/uploads/${c.id}` : `/posts/${c.id}`}>Ouvrir <ChevronRight className="w-3 h-3 ml-1"/></Link>
                       </Button>
                       <Button size="sm" variant="ghost" onClick={() => deleteContent(c.id, c.type)} className="text-red-500 hover:bg-red-500/10 rounded-lg h-9 w-9 p-0">
                          <Trash2 className="w-4 h-4" />
                       </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* RADIO TAB */}
          <TabsContent value="radio" className="space-y-8 outline-none">
             <div className="bg-[#0a0a0a] p-8 rounded-3xl border border-[#222]">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-500">
                    <Radio className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Gestion Radio KLTUR RAP</h3>
                    <p className="text-xs text-white/40 font-medium">Planifiez les émissions et gérez les fichiers audio.</p>
                  </div>
                </div>

                <form onSubmit={handleCreateRadioEpisode} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-6">
                      <div className="space-y-2">
                        <Label className="text-white font-bold text-xs uppercase tracking-widest">Titre de l'émission</Label>
                        <Input
                          value={newRadio.title}
                          onChange={e => setNewRadio({...newRadio, title: e.target.value})}
                          className="bg-[#111] border-[#222] h-12 focus:border-[#D4AF37]"
                          placeholder="Ex: Voix Urbaines #12"
                          required
                        />
                      </div>

                      <div className="space-y-4 pt-2">
                        <Label className="text-white font-bold text-xs uppercase tracking-widest">Source Audio</Label>
                        <div className="flex gap-4">
                           <Button
                             type="button"
                             onClick={() => setNewRadio({...newRadio, is_external: false})}
                             className={`flex-grow h-12 rounded-xl font-bold ${!newRadio.is_external ? 'bg-[#D4AF37] text-black' : 'bg-[#111] text-white/40 border border-[#222]'}`}
                           >
                             Fichier Audio
                           </Button>
                           <Button
                             type="button"
                             onClick={() => setNewRadio({...newRadio, is_external: true})}
                             className={`flex-grow h-12 rounded-xl font-bold ${newRadio.is_external ? 'bg-[#D4AF37] text-black' : 'bg-[#111] text-white/40 border border-[#222]'}`}
                           >
                             Lien URL (YouTube...)
                           </Button>
                        </div>
                      </div>

                      {newRadio.is_external ? (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                          <Label className="text-white font-bold text-xs uppercase tracking-widest">Lien Externe</Label>
                          <Input
                            value={newRadio.external_url}
                            onChange={e => setNewRadio({...newRadio, external_url: e.target.value})}
                            className="bg-[#111] border-[#222] h-12 focus:border-[#D4AF37]"
                            placeholder="https://youtube.com/watch?v=..."
                            required
                          />
                        </div>
                      ) : (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                          <Label className="text-white font-bold text-xs uppercase tracking-widest">Fichier MP3 / WAV</Label>
                          <div
                            onClick={() => document.getElementById('radioAudio').click()}
                            className="w-full h-12 bg-[#111] border border-[#222] rounded-xl flex items-center px-4 cursor-pointer hover:border-[#D4AF37]/50 transition-all text-white/50 overflow-hidden"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            <span className="truncate">{radioFile ? radioFile.name : 'Choisir un fichier...'}</span>
                          </div>
                          <input type="file" id="radioAudio" hidden accept="audio/*" onChange={(e) => setRadioFile(e.target.files[0])} />
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label className="text-white font-bold text-xs uppercase tracking-widest">Date de l'émission</Label>
                        <Input
                          type="datetime-local"
                          value={newRadio.date}
                          onChange={e => setNewRadio({...newRadio, date: e.target.value})}
                          className="bg-[#111] border-[#222] h-12 focus:border-[#D4AF37] [color-scheme:dark]"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-white font-bold text-xs uppercase tracking-widest">Description</Label>
                        <Textarea
                          value={newRadio.description}
                          onChange={e => setNewRadio({...newRadio, description: e.target.value})}
                          className="bg-[#111] border-[#222] min-h-[100px] resize-none focus:border-[#D4AF37]"
                          placeholder="Résumé de l'émission..."
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-purple-600 hover:bg-purple-700 font-bold uppercase py-6 rounded-xl shadow-lg"
                      >
                        {isSubmitting ? 'Envoi en cours...' : 'Ajouter à la Radio'}
                      </Button>
                   </div>

                   <div className="bg-[#111] p-6 rounded-2xl border border-[#222] flex flex-col items-center justify-center text-center">
                      <Trophy className="w-12 h-12 text-[#D4AF37] mb-4" />
                      <h4 className="font-bold text-white mb-2">Statistiques Radio</h4>
                      <p className="text-sm text-white/40 mb-6">Suivez l'audience en temps réel de vos émissions.</p>
                      <div className="grid grid-cols-2 gap-4 w-full">
                         <div className="bg-black/40 p-4 rounded-xl">
                            <p className="text-xl font-black text-[#D4AF37]">1.2k</p>
                            <p className="text-[10px] uppercase font-bold text-white/20">Auditeurs</p>
                         </div>
                         <div className="bg-black/40 p-4 rounded-xl">
                            <p className="text-xl font-black text-[#D4AF37]">85%</p>
                            <p className="text-[10px] uppercase font-bold text-white/20">Fidélité</p>
                         </div>
                      </div>
                      <div className="mt-8 w-full">
                         <p className="text-[10px] font-black uppercase text-white/30 mb-4 tracking-[0.2em]">Dernières diffusions</p>
                         <div className="space-y-2">
                            {radioEpisodes.slice(0, 3).map(ep => (
                              <div key={ep.id} className="bg-black/40 p-3 rounded-lg border border-white/5 flex justify-between items-center text-left">
                                 <span className="text-xs font-bold text-white truncate max-w-[150px]">{ep.title}</span>
                                 <span className="text-[9px] text-white/20 uppercase font-black">{new Date(ep.created_at).toLocaleDateString()}</span>
                              </div>
                            ))}
                         </div>
                      </div>
                   </div>
                </form>
             </div>
          </TabsContent>

          {/* TEAM TAB */}
          <TabsContent value="team" className="outline-none">
             <div className="bg-[#0a0a0a] rounded-3xl border border-[#222] overflow-hidden">
                <div className="p-8 border-b border-[#222] flex flex-col md:flex-row justify-between items-center gap-4">
                   <div>
                      <h3 className="text-xl font-bold text-white">Gestion de l'Équipe</h3>
                      <p className="text-sm text-white/40">Attribuez des rôles administratifs et gérez les membres du staff.</p>
                   </div>
                   <div className="flex gap-4">
                      <Button variant="outline" className="border-[#333] text-white font-bold" onClick={loadAllData}>
                         Rafraîchir
                      </Button>
                      <Button className="bg-white text-black hover:bg-white/90 font-bold">
                        <Plus className="w-4 h-4 mr-2" /> Recruter Nouveau Staff
                      </Button>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-8">
                   {users.filter(u => u.is_admin).map(admin => (
                      <div key={admin.id} className="bg-[#111] p-6 rounded-2xl border border-[#222] flex items-center gap-4 group hover:border-[#D4AF37]/50 transition-all">
                         <Avatar className="h-16 w-14 border border-[#333]">
                            <AvatarImage src={getPublicImageUrl('avatars', admin.avatar || admin.profilePhoto)} />
                            <AvatarFallback className="bg-black text-[#D4AF37] font-black">
                               {(admin.username || "A").charAt(0).toUpperCase()}
                            </AvatarFallback>
                         </Avatar>
                         <div className="flex-grow min-w-0">
                            <h4 className="font-black text-white truncate">{admin.username || admin.name}</h4>
                            <p className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-widest">{admin.user_role || 'Administrateur'}</p>
                            <div className="flex gap-2 mt-3">
                               <Button variant="ghost" className="h-7 px-2 text-[8px] font-black uppercase text-white/40 hover:text-white border border-white/5">Paramètres</Button>
                               <Button
                                 variant="ghost"
                                 onClick={() => toggleUserAdmin(admin.id, true)}
                                 className="h-7 px-2 text-[8px] font-black uppercase text-red-500/40 hover:text-red-500 border border-red-500/5"
                               >
                                 Retirer Admin
                               </Button>
                            </div>
                         </div>
                      </div>
                   ))}
                </div>

                <div className="p-8 bg-[#111]/30 border-t border-[#222]">
                   <h4 className="text-xs font-black uppercase tracking-widest text-white/40 mb-4">Promouvoir un membre dans l'équipe</h4>
                   <div className="flex flex-wrap gap-4">
                      {users.filter(u => !u.is_admin).slice(0, 10).map(suggest => (
                         <div key={suggest.id} className="flex items-center gap-2 bg-black/40 px-3 py-2 rounded-full border border-white/5 group hover:border-[#D4AF37]/30 transition-all">
                            <Avatar className="h-6 w-6">
                               <AvatarFallback className="text-[8px] font-black">{suggest.username?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="text-[10px] font-bold text-white/60">{suggest.username}</span>
                            <button
                              onClick={() => toggleUserAdmin(suggest.id, false)}
                              title="Ajouter au Staff"
                              className="w-5 h-5 bg-[#D4AF37]/10 rounded-full flex items-center justify-center hover:bg-[#D4AF37] hover:text-black transition-all"
                            >
                               <Plus className="w-3 h-3" />
                            </button>
                         </div>
                      ))}
                   </div>
                </div>
             </div>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default AdminDashboard;
