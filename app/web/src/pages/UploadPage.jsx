import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Music, Video, Image as ImageIcon, CheckCircle2, File as FileIcon, Archive } from 'lucide-react';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { supabase } from '@/lib/supabaseClient.js';
import { formatRichText } from '@/lib/textFormatter.jsx';

const UploadPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);

  const [formData, setFormData] = useState({
    title: '',
    type: '',
    genre: '',
    description: '',
    collaborators: '',
    releaseDate: '',
    isExplicit: false
  });

  const [files, setFiles] = useState({
    coverArt: null,
    audioFile: null,
    videoFile: null,
    otherFile: null
  });

  const [previews, setPreviews] = useState({
    coverArt: null
  });

  useEffect(() => {
    if (isEditMode) {
      const fetchProject = async () => {
        try {
          const { data, error } = await supabase
            .from('uploads')
            .select('*')
            .eq('id', id)
            .single();

          if (error) throw error;

          if (data.user_id !== currentUser.id) {
            toast.error("Vous n'avez pas l'autorisation de modifier ce projet.");
            navigate('/dashboard');
            return;
          }

          setFormData({
            title: data.title || '',
            type: data.type || '',
            genre: data.genre || '',
            description: data.description || '',
            collaborators: data.collaborators || '',
            releaseDate: data.release_date ? new Date(data.release_date).toISOString().split('T')[0] : '',
            isExplicit: data.is_explicit || false
          });

          if (data.cover_art) {
            const { data: urlData } = supabase.storage.from('covers').getPublicUrl(data.cover_art);
            setPreviews({ coverArt: urlData.publicUrl });
          }
        } catch (err) {
          console.error(err);
          toast.error("Erreur lors du chargement du projet.");
        } finally {
          setInitialLoading(false);
        }
      };
      fetchProject();
    }
  }, [id, isEditMode, currentUser.id, navigate]);

  const [mentionSuggestions, setMentionSuggestions] = useState([]);
  const [hashtagSuggestions, setHashtagSuggestions] = useState([]);
  const [mentionIndex, setMentionIndex] = useState(-1);
  const [activeMentionField, setActiveMentionField] = useState(null); // 'description' or 'collaborators'

  const handleInputChange = async (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'description' || name === 'collaborators') {
      const cursorPosition = e.target.selectionStart;
      const textBeforeCursor = value.substring(0, cursorPosition);
      const words = textBeforeCursor.split(/[\s,]/);
      const lastWord = words[words.length - 1];

      if (lastWord.startsWith('@') && lastWord.length > 1) {
        const query = lastWord.substring(1);
        setMentionIndex(cursorPosition - lastWord.length);
        setActiveMentionField(name);

        const { data } = await supabase
          .from('profiles')
          .select('id, username, avatar')
          .ilike('username', `${query}%`)
          .limit(5);

        setMentionSuggestions(data || []);
        setHashtagSuggestions([]);
      } else if (name === 'description' && lastWord.startsWith('#') && lastWord.length > 1) {
        const query = lastWord.substring(1);
        setMentionIndex(cursorPosition - lastWord.length);
        setActiveMentionField(name);

        const tags = ['RCA', 'HipHop', 'Bangui', 'KlturRap', 'Nouveauté', 'Clip', 'RapCentrafricain']
          .filter(t => t.toLowerCase().startsWith(query.toLowerCase()))
          .slice(0, 5);

        setHashtagSuggestions(tags);
        setMentionSuggestions([]);
      } else {
        setMentionSuggestions([]);
        setHashtagSuggestions([]);
        setActiveMentionField(null);
      }
    }
  };

  const selectMention = (username) => {
    const field = activeMentionField || 'description';
    const before = formData[field].substring(0, mentionIndex);
    const after = formData[field].substring(formData[field].indexOf(' ', mentionIndex) === -1 && formData[field].indexOf(',', mentionIndex) === -1 ? formData[field].length : Math.max(formData[field].indexOf(' ', mentionIndex), formData[field].indexOf(',', mentionIndex)));

    setFormData(prev => ({
      ...prev,
      [field]: `${before}@${username}${field === 'collaborators' ? ', ' : ' '}${after.trim()}`
    }));
    setMentionSuggestions([]);
    setActiveMentionField(null);
  };

  const selectHashtag = (tag) => {
    const before = formData.description.substring(0, mentionIndex);
    const after = formData.description.substring(formData.description.indexOf(' ', mentionIndex) === -1 ? formData.description.length : formData.description.indexOf(' ', mentionIndex));
    setFormData(prev => ({
      ...prev,
      description: `${before}#${tag} ${after.trim()}`
    }));
    setHashtagSuggestions([]);
    setActiveMentionField(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    const name = e.target.name;
    setFiles(prev => ({ ...prev, [name]: file }));

    if (name === 'coverArt' && file) {
      setPreviews(prev => ({ ...prev, coverArt: URL.createObjectURL(file) }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.type || !formData.genre || !formData.releaseDate) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (!isEditMode && !files.coverArt) {
      toast.error('Une image de couverture est obligatoire');
      return;
    }

    if (!isEditMode) {
      if (formData.type === 'Music Video' && !files.videoFile) {
        toast.error('Veuillez fournir un fichier vidéo');
        return;
      }

      const isAudioType = ['Song', 'EP', 'Album', 'Mixtape'].includes(formData.type);
      if (isAudioType && !files.audioFile) {
        toast.error('Veuillez fournir un fichier audio');
        return;
      }

      if (formData.type === 'Other' && !files.otherFile) {
        toast.error('Veuillez fournir votre fichier');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // 1. Upload Files to Storage
      let coverArtPath = null;
      let filePath = null;

      // Upload Cover
      if (files.coverArt) {
        const ext = files.coverArt.name.split('.').pop();
        const fileName = `${currentUser.id}/${Date.now()}_cover.${ext}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('covers')
          .upload(fileName, files.coverArt);

        if (uploadError) throw new Error(`Fichier Image: ${uploadError.message}`);
        coverArtPath = uploadData.path;
      }

      // Upload Media/File
      const isAudioType = ['Song', 'EP', 'Album', 'Mixtape'].includes(formData.type);
      let mediaFile = null;
      if (formData.type === 'Music Video') mediaFile = files.videoFile;
      else if (isAudioType) mediaFile = files.audioFile;
      else mediaFile = files.otherFile;

      if (mediaFile) {
        const ext = mediaFile.name.split('.').pop();
        const fileName = `${currentUser.id}/${Date.now()}_file.${ext}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('uploads')
          .upload(fileName, mediaFile);

        if (uploadError) throw new Error(`Fichier: ${uploadError.message}`);
        filePath = uploadData.path;
      }

      // 2. Database Record
      const payload = {
        title: formData.title,
        type: formData.type,
        genre: formData.genre,
        description: formData.description,
        collaborators: formData.collaborators,
        release_date: new Date(formData.releaseDate).toISOString(),
        is_explicit: formData.isExplicit,
      };

      if (coverArtPath) payload.cover_art = coverArtPath;
      if (filePath) payload.file_path = filePath;

      if (isEditMode) {
        const { error } = await supabase
          .from('uploads')
          .update(payload)
          .eq('id', id);

        if (error) throw error;
        toast.success('Projet mis à jour !');
        navigate(`/uploads/${id}`);
      } else {
        payload.user_id = currentUser.id;
        const { data, error } = await supabase
          .from('uploads')
          .insert([payload])
          .select()
          .single();

        if (error) throw error;
        toast.success('Projet publié avec succès !');
        navigate(`/uploads/${data.id}`);
      }
    } catch (err) {
      console.error(err);
      toast.error(`Erreur: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (initialLoading) return <div className="min-h-screen bg-black flex items-center justify-center text-[#D4AF37] font-black animate-pulse uppercase">Chargement...</div>;

  return (
    <>
      <Helmet>
        <title>{isEditMode ? 'Modifier Projet' : 'Nouveau Projet'} - KLTUR RAP</title>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-[#050505]">
        <Header />

        <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <h1 className="text-4xl font-black text-white uppercase tracking-tight">
                {isEditMode ? 'Modifier le projet' : 'Publier un Projet'}
              </h1>
              <p className="text-white/60 font-medium">
                {isEditMode ? 'Mettez à jour les informations de votre œuvre.' : 'Partagez votre art avec la communauté KLTUR RAP.'}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-[#0a0a0a] rounded-2xl border border-[#222] p-6 md:p-10"
            >
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Info */}
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-[#D4AF37] border-b border-[#222] pb-2">Informations Générales</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-white font-bold">Titre du projet <span className="text-[#D4AF37]">*</span></Label>
                      <Input name="title" value={formData.title} onChange={handleInputChange} className="bg-[#111] border-[#333] text-white focus:border-[#D4AF37]" placeholder="Ex: Bangui State of Mind" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-white font-bold">Date de sortie <span className="text-[#D4AF37]">*</span></Label>
                      <Input type="date" name="releaseDate" value={formData.releaseDate} onChange={handleInputChange} className="bg-[#111] border-[#333] text-white focus:border-[#D4AF37] [color-scheme:dark]" />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white font-bold">Type <span className="text-[#D4AF37]">*</span></Label>
                      <Select value={formData.type} onValueChange={(val) => setFormData(p => ({...p, type: val}))}>
                        <SelectTrigger className="bg-[#111] border-[#333] text-white">
                          <SelectValue placeholder="Sélectionnez..." />
                        </SelectTrigger>
                        <SelectContent className="bg-[#111] border-[#333] text-white">
                          <SelectItem value="Song">Single (Chanson)</SelectItem>
                          <SelectItem value="EP">EP</SelectItem>
                          <SelectItem value="Album">Album</SelectItem>
                          <SelectItem value="Mixtape">Mixtape</SelectItem>
                          <SelectItem value="Music Video">Clip Vidéo</SelectItem>
                          <SelectItem value="Other">Autre (PDF, ZIP, Document...)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white font-bold">Genre <span className="text-[#D4AF37]">*</span></Label>
                      <Select value={formData.genre} onValueChange={(val) => setFormData(p => ({...p, genre: val}))}>
                        <SelectTrigger className="bg-[#111] border-[#333] text-white">
                          <SelectValue placeholder="Sélectionnez..." />
                        </SelectTrigger>
                        <SelectContent className="bg-[#111] border-[#333] text-white">
                          <SelectItem value="Hip-Hop">Hip-Hop</SelectItem>
                          <SelectItem value="Rap">Rap</SelectItem>
                          <SelectItem value="Trap">Trap</SelectItem>
                          <SelectItem value="Drill">Drill</SelectItem>
                          <SelectItem value="R&B">R&B</SelectItem>
                          <SelectItem value="Afrobeat">Afrobeat</SelectItem>
                          <SelectItem value="Autres">Autres</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2 relative">
                    <Label className="text-white font-bold">Artistes en featuring (optionnel)</Label>
                    <Input name="collaborators" value={formData.collaborators} onChange={handleInputChange} className="bg-[#111] border-[#333] text-white focus:border-[#D4AF37]" placeholder="Noms précédés de @ séparés par des virgules" />

                    {mentionSuggestions.length > 0 && activeMentionField === 'collaborators' && (
                      <div className="absolute top-full left-0 w-64 bg-[#111] border border-[#222] rounded-xl shadow-2xl z-50 mt-2 overflow-hidden">
                        {mentionSuggestions.map(user => (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => selectMention(user.username)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#D4AF37] hover:text-black transition-colors text-left"
                          >
                            <Avatar className="h-6 w-6 border border-white/10">
                              <AvatarFallback className="text-[10px]">{user.username[0]}</AvatarFallback>
                            </Avatar>
                            <span className="font-bold text-sm">@{user.username}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 relative">
                    <div className="flex justify-between items-center">
                      <Label className="text-white font-bold">Description</Label>
                      <span className="text-xs text-white/50">{(formData.description || "").split(/\s+/).filter(word => word.length > 0).length}/1000 mots</span>
                    </div>
                    <Textarea
                      name="description" value={formData.description} onChange={handleInputChange} rows={8}
                      className="bg-[#111] border-[#222] text-white focus:border-[#D4AF37] resize-none"
                      placeholder="Racontez l'histoire de ce projet (Max 1000 mots)..."
                    />
                    <div className="mt-2 text-white/40 text-[10px] leading-relaxed">
                      {formatRichText(formData.description)}
                    </div>

                    {mentionSuggestions.length > 0 && activeMentionField === 'description' && (
                      <div className="absolute bottom-full left-0 w-64 bg-[#111] border border-[#222] rounded-xl shadow-2xl z-50 mb-2 overflow-hidden">
                        {mentionSuggestions.map(user => (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => selectMention(user.username)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#D4AF37] hover:text-black transition-colors text-left"
                          >
                            <Avatar className="h-6 w-6 border border-white/10">
                              <AvatarFallback className="text-[10px]">{user.username[0]}</AvatarFallback>
                            </Avatar>
                            <span className="font-bold text-sm">@{user.username}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {hashtagSuggestions.length > 0 && (
                      <div className="absolute bottom-full left-0 w-64 bg-[#111] border border-[#222] rounded-xl shadow-2xl z-50 mb-2 overflow-hidden">
                        {hashtagSuggestions.map(tag => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => selectHashtag(tag)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#D4AF37] hover:text-black transition-colors text-left font-bold text-sm"
                          >
                            #{tag}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* File Uploads */}
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-[#D4AF37] border-b border-[#222] pb-2">Fichiers Médias</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label className="text-white font-bold flex items-center gap-2"><ImageIcon className="w-4 h-4"/> Cover Art <span className="text-[#D4AF37]">*</span></Label>
                    <div className="border-2 border-dashed border-[#333] rounded-xl p-6 text-center hover:border-[#D4AF37]/50 transition-colors bg-[#111] overflow-hidden">
                        <input type="file" name="coverArt" id="coverArt" accept="image/*" className="hidden" onChange={handleFileChange} />
                        <label htmlFor="coverArt" className="cursor-pointer flex flex-col items-center">
                          {previews.coverArt ? (
                            <img src={previews.coverArt} className="w-20 h-20 object-cover rounded-lg mb-2" alt="Preview" />
                          ) : files.coverArt ? (
                            <CheckCircle2 className="w-10 h-10 text-[#D4AF37] mb-2" />
                          ) : (
                            <ImageIcon className="w-10 h-10 text-white/20 mb-2" />
                          )}
                          <span className="text-sm font-medium text-white/80">{files.coverArt ? files.coverArt.name : (isEditMode ? 'Changer l\'image' : 'Choisir une image (Max 10MB)')}</span>
                        </label>
                      </div>
                    </div>

                    {formData.type === 'Music Video' ? (
                      <div className="space-y-3">
                        <Label className="text-white font-bold flex items-center gap-2"><Video className="w-4 h-4"/> Fichier Vidéo <span className="text-[#D4AF37]">*</span></Label>
                        <div className="border-2 border-dashed border-[#333] rounded-xl p-6 text-center hover:border-[#D4AF37]/50 transition-colors bg-[#111]">
                          <input type="file" name="videoFile" id="videoFile" accept="video/mp4,video/webm" className="hidden" onChange={handleFileChange} />
                          <label htmlFor="videoFile" className="cursor-pointer flex flex-col items-center">
                            {files.videoFile ? (
                              <CheckCircle2 className="w-10 h-10 text-[#D4AF37] mb-2" />
                            ) : (
                              <Video className="w-10 h-10 text-white/20 mb-2" />
                            )}
                            <span className="text-sm font-medium text-white/80">{files.videoFile ? files.videoFile.name : 'Choisir une vidéo (MP4/WEBM, Max 500MB)'}</span>
                          </label>
                        </div>
                      </div>
                    ) : ['Song', 'EP', 'Album', 'Mixtape'].includes(formData.type) ? (
                      <div className="space-y-3">
                        <Label className="text-white font-bold flex items-center gap-2"><Music className="w-4 h-4"/> Fichier Audio <span className="text-[#D4AF37]">*</span></Label>
                        <div className="border-2 border-dashed border-[#333] rounded-xl p-6 text-center hover:border-[#D4AF37]/50 transition-colors bg-[#111]">
                          <input type="file" name="audioFile" id="audioFile" accept="audio/mpeg,audio/wav,audio/flac" className="hidden" onChange={handleFileChange} />
                          <label htmlFor="audioFile" className="cursor-pointer flex flex-col items-center">
                            {files.audioFile ? (
                              <CheckCircle2 className="w-10 h-10 text-[#D4AF37] mb-2" />
                            ) : (
                              <Music className="w-10 h-10 text-white/20 mb-2" />
                            )}
                            <span className="text-sm font-medium text-white/80">{files.audioFile ? files.audioFile.name : 'Choisir un audio (MP3/WAV, Max 100MB)'}</span>
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Label className="text-white font-bold flex items-center gap-2"><FileIcon className="w-4 h-4"/> Votre Fichier <span className="text-[#D4AF37]">*</span></Label>
                        <div className="border-2 border-dashed border-[#333] rounded-xl p-6 text-center hover:border-[#D4AF37]/50 transition-colors bg-[#111]">
                          <input type="file" name="otherFile" id="otherFile" className="hidden" onChange={handleFileChange} />
                          <label htmlFor="otherFile" className="cursor-pointer flex flex-col items-center">
                            {files.otherFile ? (
                              <CheckCircle2 className="w-10 h-10 text-[#D4AF37] mb-2" />
                            ) : (
                              <Archive className="w-10 h-10 text-white/20 mb-2" />
                            )}
                            <span className="text-sm font-medium text-white/80">{files.otherFile ? files.otherFile.name : 'Choisir un fichier (Tout format, Max 100MB)'}</span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3 bg-[#111] p-4 rounded-xl border border-[#333]">
                  <Checkbox 
                    id="isExplicit" 
                    checked={formData.isExplicit}
                    onCheckedChange={(checked) => setFormData(p => ({...p, isExplicit: checked}))}
                    className="border-[#555] data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="isExplicit" className="text-white font-bold cursor-pointer">Contenu Explicite</Label>
                    <p className="text-sm text-white/50">Cochez si le projet contient des paroles crues ou réservées à un public averti.</p>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full h-14 bg-[#D4AF37] text-black hover:bg-[#b5952f] transition-all font-black text-lg uppercase tracking-wider"
                >
                  {isSubmitting ? (isEditMode ? 'Mise à jour...' : 'Upload en cours...') : (isEditMode ? 'Enregistrer les modifications' : 'Publier le projet')}
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

export default UploadPage;