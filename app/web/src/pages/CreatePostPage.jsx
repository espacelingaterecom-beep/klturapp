import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Camera, Video, X, Check, Upload } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { supabase } from '@/lib/supabaseClient.js';

const CreatePostPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [mediaType, setMediaType] = useState(null); // 'image' or 'video'

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 52428800) { // 50MB limit
        toast.error("Fichier trop volumineux (Max 50MB)");
        return;
      }

      const type = selectedFile.type.startsWith('video') ? 'video' : 'image';
      setMediaType(type);
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleUpload = async () => {
    if (!file || loading) return;
    setLoading(true);

    try {
      // 1. Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUser.id}/${Date.now()}.${fileExt}`;

      const { data: storageData, error: storageError } = await supabase.storage
        .from('posts')
        .upload(fileName, file);

      if (storageError) {
        console.error("Storage Error:", storageError);
        throw new Error(`Erreur Fichier (Storage): ${storageError.message}`);
      }

      // 2. Create Database Record
      const { error: dbError } = await supabase
        .from('posts')
        .insert({
          user_id: currentUser.id,
          content_url: storageData.path,
          caption: caption,
          media_type: mediaType
        });

      if (dbError) {
        console.error("Database Error:", dbError);
        throw new Error(`Erreur Données (Table): ${dbError.message}`);
      }

      toast.success("Publication partagée !");
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Helmet><title>Publier - KLTUR RAP</title></Helmet>
      <Header />

      <main className="max-w-2xl mx-auto py-12 px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#0a0a0a] rounded-3xl border border-[#222] overflow-hidden">
          <div className="p-6 border-b border-[#222] flex items-center justify-between">
            <h1 className="text-xl font-black uppercase tracking-tight">Nouveau Post</h1>
            {file && (
              <button onClick={() => { setFile(null); setPreview(null); }} className="text-white/50 hover:text-red-500 transition-colors">
                <X className="w-6 h-6" />
              </button>
            )}
          </div>

          <div className="p-6">
            {!preview ? (
              <div className="aspect-square rounded-2xl border-2 border-dashed border-[#333] flex flex-col items-center justify-center gap-4 bg-[#111] hover:border-[#D4AF37] transition-all group cursor-pointer relative">
                <input type="file" accept="image/*,video/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                <div className="w-16 h-16 rounded-full bg-black flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8 text-[#D4AF37]" />
                </div>
                <p className="font-bold text-white/50 uppercase tracking-wider text-sm">Image ou Vidéo courte</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="aspect-square rounded-2xl overflow-hidden bg-black border border-[#222]">
                  {mediaType === 'video' ? (
                    <video src={preview} className="w-full h-full object-cover" controls />
                  ) : (
                    <img src={preview} className="w-full h-full object-cover" alt="Preview" />
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold text-[#D4AF37] uppercase">Légende</p>
                  <Textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Écrivez quelque chose... #klturrap #bangui"
                    className="bg-[#111] border-[#222] focus:border-[#D4AF37] min-h-[100px] resize-none text-lg"
                  />
                </div>

                <Button
                  onClick={handleUpload}
                  disabled={loading}
                  className="w-full h-14 bg-[#D4AF37] text-black hover:bg-[#b5952f] font-black text-lg uppercase tracking-wider"
                >
                  {loading ? 'Partage en cours...' : 'Partager sur le mouvement'}
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default CreatePostPage;
