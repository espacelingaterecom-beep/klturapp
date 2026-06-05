import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Formate un texte pour rendre les @mentions et #hashtags cliquables.
 * @param {string} text - Le texte brut à formater
 * @returns {React.ReactNode} - Le texte formaté avec des composants Link
 */
export const formatRichText = (text) => {
  if (!text) return null;

  // Regex pour capturer les @mentions et #hashtags
  // On capture le symbole + le mot qui suit
  const regex = /([@#][\w-]+)/g;
  const parts = text.split(regex);

  return parts.map((part, i) => {
    if (part.startsWith('@')) {
      const username = part.substring(1);
      return (
        <Link
          key={i}
          to={`/profil/${username}`}
          className="text-[#D4AF37] font-bold hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </Link>
      );
    } else if (part.startsWith('#')) {
      const tag = part.substring(1);
      return (
        <Link
          key={i}
          to={`/actualites?search=${tag}`}
          className="text-[#D4AF37] hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </Link>
      );
    }
    return part;
  });
};
