import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Music, Video, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { supabase } from '@/lib/supabaseClient.js';

const UploadPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
    videoFile: null
  });

  const handleInputChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e) => {
    setFiles(prev => ({ ...prev, [e.target.name]: e.target.files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.type || !formData.genre || !formData.releaseDate || !files.coverArt) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (formData.type === 'Music Video' && !files.videoFile) {
      toast.error('Veuillez fournir un fichier vidéo');
      return;
    }

    if (formData.type !== 'Music Video' && !files.audioFile) {
      toast.error('Veuillez fournir un fichier audio');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Upload Files to Storage
      let coverArtPath = '';
      let filePath = '';

      // Upload Cover
      if (files.coverArt) {
        const ext = files.coverArt.name.split('.').pop();
        const fileName = `${currentUser.id}/${Date.now()}_cover.${ext}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('covers')
          .upload(fileName, files.coverArt);

        if (uploadError) {
          console.error("Storage Cover Error:", uploadError);
          throw new Error(`Fichier Image: ${uploadError.message}`);
        }
        coverArtPath = uploadData.path;
      }

      // Upload Audio/Video
      const mediaFile = formData.type === 'Music Video' ? files.videoFile : files.audioFile;
      if (mediaFile) {
        const ext = mediaFile.name.split('.').pop();
        const fileName = `${currentUser.id}/${Date.now()}_media.${ext}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('uploads')
          .upload(fileName, mediaFile);

        if (uploadError) {
          console.error("Storage Media Error:", uploadError);
          throw new Error(`Fichier Média: ${uploadError.message}`);
        }
        filePath = uploadData.path;
      }

      // 2. Create Record in Database
      const { data, error } = await supabase
        .from('uploads')
        .insert([{
          user_id: currentUser.id,
          title: formData.title,
          type: formData.type,
          genre: formData.genre,
          description: formData.description,
          collaborators: formData.collaborators,
          release_date: new Date(formData.releaseDate).toISOString(),
          is_explicit: formData.isExplicit,
          cover_art: coverArtPath,
          file_path: filePath
        }])
        .select()
        .single();

      if (error) {
        console.error("Database Insert Error:", error);
        throw new Error(`Données: ${error.message}`);
      }
      
      toast.success('Projet uploadé avec succès !');
      navigate(`/uploads/${data.id}`);
    } catch (err) {
      console.error("Full upload error object:", err);
      toast.error(`Erreur: ${err.message || "Vérifiez la taille des fichiers."}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Nouveau Projet - KLTUR RAP</title>
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
              <h1 className="text-4xl font-black text-white uppercase tracking-tight">Publier un Projet</h1>
              <p className="text-white/60 font-medium">Partagez votre art avec la communauté KLTUR RAP.</p>
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

                  <div className="space-y-2">
                    <Label className="text-white font-bold">Artistes en featuring (optionnel)</Label>
                    <Input name="collaborators" value={formData.collaborators} onChange={handleInputChange} className="bg-[#111] border-[#333] text-white focus:border-[#D4AF37]" placeholder="Noms séparés par des virgules" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-white font-bold">Description</Label>
                      <span className="text-xs text-white/50">{formData.description.split(/\s+/).filter(word => word.length > 0).length}/1000 mots</span>
                    </div>
                    <Textarea
                      name="description" value={formData.description} onChange={handleInputChange} rows={8}
                      className="bg-[#111] border-[#333] text-white focus:border-[#D4AF37] resize-none"
                      placeholder="Racontez l'histoire de ce projet (Max 1000 mots)..."
                    />
                  </div>
                </div>

                {/* File Uploads */}
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-[#D4AF37] border-b border-[#222] pb-2">Fichiers Médias</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label className="text-white font-bold flex items-center gap-2"><ImageIcon className="w-4 h-4"/> Cover Art <span className="text-[#D4AF37]">*</span></Label>
                      <div className="border-2 border-dashed border-[#333] rounded-xl p-6 text-center hover:border-[#D4AF37]/50 transition-colors bg-[#111]">
                        <input type="file" name="coverArt" id="coverArt" accept="image/*" className="hidden" onChange={handleFileChange} />
                        <label htmlFor="coverArt" className="cursor-pointer flex flex-col items-center">
                          {files.coverArt ? (
                            <CheckCircle2 className="w-10 h-10 text-[#D4AF37] mb-2" />
                          ) : (
                            <ImageIcon className="w-10 h-10 text-white/20 mb-2" />
                          )}
                          <span className="text-sm font-medium text-white/80">{files.coverArt ? files.coverArt.name : 'Choisir une image (Max 10MB)'}</span>
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
                    ) : (
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
                  {isSubmitting ? 'Upload en cours...' : 'Publier le projet'}
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