export const artists = [
  {
    id: 1,
    name: "Makassy",
    bio: "Rappeur et producteur centrafricain, pionnier du hip-hop à Bangui. Connu pour ses textes engagés sur la jeunesse et la culture urbaine.",
    image: "https://images.unsplash.com/photo-1547495827-fff7a5e8b26c",
    tracks: [
      { title: "Bangui City", duration: "3:45" },
      { title: "Voix de la Rue", duration: "4:12" }
    ]
  },
  {
    id: 2,
    name: "Lioness",
    bio: "Rappeuse et slameuse, première femme du rap centrafricain. Elle défend les droits des femmes à travers ses textes puissants.",
    image: "https://images.unsplash.com/photo-1659200092945-cd43219601bd",
    tracks: [
      { title: "Femme Forte", duration: "3:28" },
      { title: "Liberté", duration: "4:01" }
    ]
  },
  {
    id: 3,
    name: "Kool G",
    bio: "Beatmaker et MC, spécialiste du boom bap classique. Il fusionne les rythmes traditionnels centrafricains avec le hip-hop moderne.",
    image: "https://images.unsplash.com/photo-1652805976332-3ea2cf30e146",
    tracks: [
      { title: "Rythmes Ancestraux", duration: "3:55" },
      { title: "Beat de Bangui", duration: "3:33" }
    ]
  },
  {
    id: 4,
    name: "DJ Sanza",
    bio: "DJ et producteur, créateur de l'Afro-Trap centrafricain. Il mixe les sonorités locales avec les beats trap contemporains.",
    image: "https://images.unsplash.com/photo-1590697304053-10d95df6aca6",
    tracks: [
      { title: "Sanza Trap", duration: "3:18" },
      { title: "Afro Vibes", duration: "4:22" }
    ]
  },
  {
    id: 5,
    name: "MC Zande",
    bio: "Rappeur conscient et activiste culturel. Ses textes abordent l'histoire, l'identité et les défis de la jeunesse centrafricaine.",
    image: "https://images.unsplash.com/photo-1619210247879-68ef573f9723",
    tracks: [
      { title: "Histoire Vivante", duration: "4:45" },
      { title: "Identité", duration: "3:52" }
    ]
  },
  {
    id: 6,
    name: "B-Girl Nzapa",
    bio: "Danseuse breakdance et chorégraphe. Elle enseigne la culture hip-hop aux jeunes de Bangui et organise des battles de danse.",
    image: "https://images.unsplash.com/photo-1559732277-7453b141e3a1",
    tracks: [
      { title: "Break the Floor", duration: "3:15" },
      { title: "Dance Revolution", duration: "3:40" }
    ]
  }
];

export const events = [
  {
    id: 1,
    title: "Concert Hip-Hop Solidaire",
    date: "2026-06-15",
    time: "19h00",
    location: "Place de la République, Bangui",
    artists: ["Makassy", "Lioness", "MC Zande"],
    description: "Grande soirée hip-hop avec les meilleurs artistes de Bangui. Tous les bénéfices seront reversés aux associations culturelles locales.",
    type: "concert",
    price: "2000 FCFA"
  },
  {
    id: 2,
    title: "Atelier d'Écriture Rap",
    date: "2026-06-22",
    time: "14h00",
    location: "Centre Culturel Boganda, Bangui",
    artists: ["MC Zande"],
    description: "Atelier d'écriture de textes rap pour débutants et confirmés. Apprenez les techniques de flow, de rime et de storytelling.",
    type: "workshop",
    price: "Gratuit"
  },
  {
    id: 3,
    title: "Battle de Breakdance",
    date: "2026-07-08",
    time: "16h00",
    location: "Stade Barthélemy Boganda, Bangui",
    artists: ["B-Girl Nzapa", "Crew Sango Dancers"],
    description: "Compétition de breakdance réunissant les meilleurs danseurs de la région. Jury professionnel et prix à gagner.",
    type: "festival",
    price: "1500 FCFA"
  },
  {
    id: 4,
    title: "Festival Voix Urbaines",
    date: "2026-07-20",
    time: "18h00",
    location: "Parc de la Victoire, Bangui",
    artists: ["Makassy", "Kool G", "DJ Sanza", "Lioness"],
    description: "Festival de 3 jours célébrant la culture hip-hop centrafricaine. Concerts, ateliers, expositions et battles de danse.",
    type: "festival",
    price: "3500 FCFA (Pass 3 jours)"
  },
  {
    id: 5,
    title: "Atelier Production Musicale",
    date: "2026-08-05",
    time: "10h00",
    location: "Studio KLTUR RAP, Bangui",
    artists: ["DJ Sanza", "Kool G"],
    description: "Formation intensive sur la production de beats hip-hop. Apprenez à utiliser les logiciels MAO et créez vos propres instrumentales.",
    type: "workshop",
    price: "5000 FCFA"
  }
];

export const newsPosts = [
  {
    id: 1,
    title: "Makassy sort son nouvel album 'Bangui Renaissance'",
    date: "2026-05-10",
    category: "News",
    excerpt: "Le rappeur centrafricain Makassy annonce la sortie de son troisième album studio, un projet ambitieux qui célèbre la renaissance culturelle de Bangui.",
    content: "Après deux ans de travail, Makassy dévoile enfin son nouvel opus..."
  },
  {
    id: 2,
    title: "Interview exclusive avec Lioness : 'Le rap féminin en RCA'",
    date: "2026-05-08",
    category: "Interviews",
    excerpt: "Rencontre avec Lioness, pionnière du rap féminin centrafricain. Elle nous parle de son parcours, ses combats et ses projets futurs.",
    content: "KLTUR RAP : Comment as-tu découvert le hip-hop ? Lioness : J'avais 14 ans..."
  },
  {
    id: 3,
    title: "Atelier d'écriture rap : retour sur une session inspirante",
    date: "2026-05-05",
    category: "Workshops",
    excerpt: "Le dernier atelier d'écriture animé par MC Zande a réuni 32 jeunes talents. Découvrez les moments forts de cette journée créative.",
    content: "Samedi dernier, le Centre Culturel Boganda a accueilli..."
  },
  {
    id: 4,
    title: "Histoire du hip-hop centrafricain : des origines à aujourd'hui",
    date: "2026-05-01",
    category: "Cultural Chronicles",
    excerpt: "Plongée dans l'histoire du mouvement hip-hop en République Centrafricaine, de ses débuts dans les années 90 à son essor actuel.",
    content: "Le hip-hop arrive en RCA au début des années 90..."
  },
  {
    id: 5,
    title: "DJ Sanza remporte le prix du meilleur producteur 2026",
    date: "2026-04-28",
    category: "News",
    excerpt: "Lors de la cérémonie des Central African Music Awards, DJ Sanza a été sacré meilleur producteur de l'année pour son travail innovant.",
    content: "Une consécration méritée pour DJ Sanza qui a révolutionné..."
  },
  {
    id: 6,
    title: "B-Girl Nzapa : 'La danse hip-hop comme outil d'émancipation'",
    date: "2026-04-25",
    category: "Interviews",
    excerpt: "Entretien avec B-Girl Nzapa sur son engagement pour promouvoir le breakdance auprès des jeunes filles de Bangui.",
    content: "Depuis 5 ans, B-Girl Nzapa anime des cours de breakdance..."
  },
  {
    id: 7,
    title: "Atelier beatmaking : créez vos propres instrumentales",
    date: "2026-04-20",
    category: "Workshops",
    excerpt: "Kool G et DJ Sanza organisent un atelier de production musicale pour apprendre à créer des beats hip-hop professionnels.",
    content: "Le prochain atelier aura lieu le 5 août au Studio KLTUR RAP..."
  },
  {
    id: 8,
    title: "Le hip-hop centrafricain s'exporte à l'international",
    date: "2026-04-15",
    category: "Cultural Chronicles",
    excerpt: "De plus en plus d'artistes centrafricains sont invités à se produire dans des festivals internationaux, portant haut les couleurs du pays.",
    content: "Makassy sera en tournée européenne cet été, Lioness participera..."
  }
];

export const radioShows = [
  {
    id: 1,
    title: "KLTUR RAP – Voix Urbaines",
    duration: "60 minutes",
    schedule: "Samedi 16h-17h | Rediffusion Mercredi 21h-22h",
    description: "L'émission de référence pour la culture hip-hop centrafricaine. Découvrez les nouveautés, les interviews d'artistes et les chroniques culturelles.",
    segments: [
      {
        name: "KLTUR OPEN MIC",
        description: "Découverte de nouveaux talents locaux. Chaque semaine, un artiste émergent présente son univers."
      },
      {
        name: "KLTIVE MOI",
        description: "Sélection des meilleurs sons hip-hop du moment, locaux et internationaux."
      },
      {
        name: "ALA OUNDA MBI",
        description: "Chronique culturelle sur l'histoire du hip-hop et ses influences en Afrique Centrale."
      },
      {
        name: "MANDA NA MBI",
        description: "Interview exclusive avec un artiste, producteur ou acteur de la scène hip-hop."
      },
      {
        name: "KLTUR ACTU",
        description: "Actualités de la scène hip-hop centrafricaine : concerts, sorties d'albums, événements."
      }
    ]
  }
];

export const episodes = [
  {
    id: 1,
    title: "Épisode 12 : Spécial Makassy",
    date: "2026-05-10",
    duration: "60:00",
    description: "Interview exclusive de Makassy pour la sortie de son album 'Bangui Renaissance'.",
    audioUrl: "#"
  },
  {
    id: 2,
    title: "Épisode 11 : Les femmes du rap centrafricain",
    date: "2026-05-03",
    duration: "60:00",
    description: "Focus sur les rappeuses qui font bouger la scène : Lioness, MC Fatou et Lady Sanza.",
    audioUrl: "#"
  },
  {
    id: 3,
    title: "Épisode 10 : Histoire du hip-hop en RCA",
    date: "2026-04-26",
    duration: "60:00",
    description: "Retour sur 30 ans de culture hip-hop en République Centrafricaine.",
    audioUrl: "#"
  },
  {
    id: 4,
    title: "Épisode 9 : Spécial Beatmakers",
    date: "2026-04-19",
    duration: "60:00",
    description: "Rencontre avec DJ Sanza et Kool G, les architectes du son hip-hop centrafricain.",
    audioUrl: "#"
  }
];