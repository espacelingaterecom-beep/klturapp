import React from 'react';
import { Play, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { getPublicImageUrl } from '@/lib/supabaseClient.js';

const ArtistCard = ({ artist }) => {
  const imageUrl = artist.profilePhoto
    ? getPublicImageUrl('avatars', artist.profilePhoto)
    : artist.avatar
      ? getPublicImageUrl('avatars', artist.avatar)
      : artist.image; // Fallback for old data

  return (
    <div className="bg-[#0a0a0a] rounded-2xl overflow-hidden border border-[#222] hover:border-[#D4AF37] transition-all duration-300 glow-gold-hover group h-full flex flex-col">
      <div className="relative overflow-hidden aspect-square">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={artist.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-[#111] flex items-center justify-center">
            <span className="text-4xl font-black text-white/10 uppercase">{artist.name?.charAt(0)}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6">
          <Link to={`/profil/${artist.id}`}>
            <Button className="bg-[#D4AF37] text-black hover:bg-[#FDB913] transition-all duration-300 font-bold gap-2">
              <Play className="h-4 w-4" />
              Voir le Profil
            </Button>
          </Link>
        </div>
      </div>

      <div className="p-6 flex-grow flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-2xl font-black text-white group-hover:text-[#D4AF37] transition-colors duration-300 uppercase truncate">
            {artist.name}
          </h3>
          {artist.is_premium && <Award className="w-5 h-5 text-[#D4AF37]" />}
        </div>

        <p className="text-sm text-white/60 leading-relaxed mb-6 line-clamp-3 flex-grow">
          {artist.bio || "Aucune biographie disponible pour cet artiste."}
        </p>

        <div className="space-y-2 mt-auto">
          <div className="flex items-center justify-between py-2 border-t border-[#222]">
            <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">{artist.user_role || 'Artiste'}</span>
            <Link to={`/profil/${artist.id}`} className="text-xs text-white/40 hover:text-white underline font-bold">Voir détails</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtistCard;