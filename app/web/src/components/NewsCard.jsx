import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Award, ArrowRight, Facebook, Youtube, Share2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient.js';
import { formatRichText } from '@/lib/textFormatter.jsx';

const NewsCard = ({ news }) => {
  const getFileUrl = (bucket, path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  };
  const isExternal = !!news.source_url;
  const isFacebook = news.source_url?.includes('facebook.com');
  const isYoutube = news.source_url?.includes('youtube.com') || news.source_url?.includes('youtu.be');

  const CardContent = (
    <div className="bg-[#0a0a0a] rounded-2xl border border-[#222] overflow-hidden hover:border-[#D4AF37] transition-all duration-300 hover:-translate-y-1 flex flex-col h-full">
      <div className="aspect-video relative overflow-hidden bg-[#111] flex items-center justify-center">
        {news.image || news.image_url ? (
          <img
            src={news.image_url || getFileUrl('covers', news.image)}
            alt={news.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              // Si l'image distante échoue (CORS Facebook), on montre un fallback propre
              e.target.style.display = 'none';
              e.target.parentElement.classList.add('bg-blue-900/10');
            }}
          />
        ) : null}

        {/* Fallback Icons if image missing or blocked */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
          {isFacebook && <Facebook className="w-16 h-16 text-[#1877F2]" />}
          {isYoutube && <Youtube className="w-16 h-16 text-red-600" />}
          {!isFacebook && !isYoutube && <Share2 className="w-16 h-16 text-[#D4AF37]" />}
        </div>

        <div className="absolute top-3 left-3 bg-black/80 backdrop-blur border border-[#333] text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded">
          {news.category}
        </div>

        {isExternal && (
           <div className="absolute top-3 right-3 bg-[#D4AF37] text-black p-1.5 rounded-full shadow-lg">
              {isFacebook ? <Facebook className="w-3 h-3 fill-current" /> : isYoutube ? <Youtube className="w-3 h-3 fill-current" /> : <Share2 className="w-3 h-3" />}
           </div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-grow">
        <div className="flex items-center text-xs text-[#D4AF37] mb-2 font-medium">
          <Calendar className="w-3 h-3 mr-1" />
          {new Date(news.created_at || news.created).toLocaleDateString('fr-FR')}
        </div>
        
        <h3 className="font-bold text-white text-lg mb-2 line-clamp-2 group-hover:text-[#D4AF37] transition-colors">{news.title}</h3>
        <div className="text-sm text-white/60 line-clamp-3 mb-4 flex-grow">{formatRichText(news.excerpt || (news.content ? news.content.substring(0, 100) + '...' : ''))}</div>

        <div className="flex items-center justify-between pt-4 border-t border-[#222] mt-auto">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white flex items-center gap-1">
              {news.expand?.authorId?.name || 'Rédaction'}
              {news.expand?.authorId?.is_premium && <Award className="w-3 h-3 text-[#D4AF37]" />}
            </span>
          </div>
          <span className="text-[#D4AF37] text-sm font-bold flex items-center group-hover:underline">
            {isExternal ? 'Voir la source' : 'Lire plus'} <ArrowRight className="w-4 h-4 ml-1" />
          </span>
        </div>
      </div>
    </div>
  );

  if (isExternal) {
    return (
      <a href={news.source_url} target="_blank" rel="noopener noreferrer" className="group block h-full">
        {CardContent}
      </a>
    );
  }

  return (
    <Link to={`/actualites/${news.id}`} className="group block h-full">
      {CardContent}
    </Link>
  );
};

export default NewsCard;