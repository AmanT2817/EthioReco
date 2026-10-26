// EthioReco — Seed script
// Populates sample international + Ethiopian content (Tizita tracks, Amharic literature, Ethiopian films)
// Run with: bun /home/z/my-project/scripts/seed.ts

import { db } from "../src/lib/db";
import { recomputeAllItemVectors } from "../src/rec_engine/content_based";
import { hashPassword } from "../src/lib/auth/auth";

interface SeedItem {
  title: string;
  type: "book" | "movie" | "music";
  description: string;
  releaseYear?: number;
  language?: string;
  country?: string;
  coverImageUrl?: string;
  author?: string;
  director?: string;
  artist?: string;
  album?: string;
  genre: string;
  averageRating?: number;
  ratingCount?: number;
  ethiopian?: {
    culturalRegion?: string;
    traditionalGenre?: string;
    isTraditional?: boolean;
    amharicTitle?: string;
    amharicDescription?: string;
    culturalSignificance?: string;
    featuredPriority?: number;
  };
}

// Placeholder poster URL — uses picsum.photos for cover art so cards aren't empty
const poster = (seed: string) => `https://picsum.photos/seed/${encodeURIComponent(seed)}/400/600`;

const SEED_DATA: SeedItem[] = [
  // === ETHIOPIAN — Amharic Literature ===
  {
    title: "Fikir Eske Mekabir",
    type: "book",
    description: "A foundational Ethiopian novel exploring love, sacrifice, and the moral struggles of a generation caught between tradition and modernity.",
    releaseYear: 1968,
    language: "Amharic",
    country: "Ethiopia",
    coverImageUrl: poster("fikir"),
    author: "Haddis Alemayehu",
    genre: "Drama",
    ethiopian: {
      culturalRegion: "Addis Ababa",
      traditionalGenre: "Amharic Literature",
      isTraditional: true,
      amharicTitle: "ፍቅር እስከ መቃብር",
      amharicDescription: "በኢትዮጵያ ስነ-ጽሑፍ ታሪክ ውስጥ ጥልቅ የሆነ ትርጓሜና ቅርስ ያለው ልብ ወለድ ነው።",
      culturalSignificance: "Considered one of the masterpieces of modern Amharic literature. The novel's title translates literally to 'Love unto the grave' and embodies the Ethiopian ethos of sacrifice for the beloved.",
      featuredPriority: 10,
    },
  },
  {
    title: "Tsion's Life",
    type: "book",
    description: "A contemporary novel about a young woman navigating modern Addis Ababa, balancing family expectations with personal ambition.",
    releaseYear: 2010,
    language: "Amharic",
    country: "Ethiopia",
    coverImageUrl: poster("tsion"),
    author: "Megenagn Worku",
    genre: "Drama",
    ethiopian: {
      culturalRegion: "Addis Ababa",
      traditionalGenre: "Amharic Literature",
      isTraditional: false,
      amharicTitle: "የጽዮን ሕይወት",
      culturalSignificance: "Represents a new wave of Amharic fiction centering female agency in post-millennium Ethiopia.",
      featuredPriority: 7,
    },
  },
  {
    title: "Kibur Yalf Zefqel",
    type: "book",
    description: "A foundational Ethiopian novel exploring faith, identity, and the moral weight of family in the highlands.",
    releaseYear: 1980,
    language: "Amharic",
    country: "Ethiopia",
    coverImageUrl: poster("kibur"),
    author: "Abbe Gobena",
    genre: "Drama",
    ethiopian: {
      culturalRegion: "Gondar",
      traditionalGenre: "Amharic Literature",
      isTraditional: true,
      amharicTitle: "ክቡር ያልፈ ዘፍቅል",
      culturalSignificance: "A classic of the Amharic realist tradition. The novel's exploration of highland life is widely taught in Ethiopian schools.",
      featuredPriority: 7,
    },
  },
  {
    title: "Adhïs Yefelgede Yä-Mängest",
    type: "book",
    description: "A satirical novel exposing the absurdities of bureaucracy through the eyes of a young clerk in Addis Ababa.",
    releaseYear: 1992,
    language: "Amharic",
    country: "Ethiopia",
    coverImageUrl: poster("adhis"),
    author: "Bealu Girma",
    genre: "Comedy",
    ethiopian: {
      culturalRegion: "Addis Ababa",
      traditionalGenre: "Amharic Literature",
      isTraditional: false,
      amharicTitle: "አድህስ የፈለገው መንግስት",
      culturalSignificance: "Bealu Girma is one of the great satirical voices of Amharic literature. This novel uses absurdist humor to critique state power — a politically charged move that resonated deeply with Ethiopian readers.",
      featuredPriority: 6,
    },
  },
  // === ETHIOPIAN — Film ===
  {
    title: "Difret",
    type: "movie",
    description: "A courtroom drama based on a true story of a young woman who challenges the tradition of abduction-marriage in rural Ethiopia.",
    releaseYear: 2014,
    language: "Amharic",
    country: "Ethiopia",
    coverImageUrl: poster("difret"),
    director: "Zeresenay Berhane Mehari",
    genre: "Drama",
    ethiopian: {
      culturalRegion: "Addis Ababa",
      traditionalGenre: "Ethiopian Film",
      isTraditional: false,
      amharicTitle: "ድፍርት",
      culturalSignificance: "Premiered at Sundance. The title means 'courage' or 'to dare' in Amharic — a film about women asserting legal agency within traditional structures.",
      featuredPriority: 9,
    },
  },
  {
    title: "Lambadina",
    type: "movie",
    description: "An Ethiopian drama following a young man's coming-of-age amid political upheaval, exile, and return.",
    releaseYear: 2022,
    language: "Amharic",
    country: "Ethiopia",
    coverImageUrl: poster("lambadina"),
    director: "Messay Amare",
    genre: "Drama",
    ethiopian: {
      culturalRegion: "Addis Ababa",
      traditionalGenre: "Ethiopian Film",
      isTraditional: false,
      amharicTitle: "ላምባዲና",
      culturalSignificance: "Modern Ethiopian diaspora cinema exploring themes of return and identity.",
      featuredPriority: 6,
    },
  },
  {
    title: "Yefelash Shewa — Whisper of the Lion",
    type: "movie",
    description: "A historical drama set in late 19th-century Shewa, exploring the conflict between tradition and modernization through the eyes of a royal advisor.",
    releaseYear: 2018,
    language: "Amharic",
    country: "Ethiopia",
    coverImageUrl: poster("shewa"),
    director: "Temesgen Gossaye",
    genre: "Historical Fiction",
    ethiopian: {
      culturalRegion: "Addis Ababa",
      traditionalGenre: "Ethiopian Film",
      isTraditional: false,
      amharicTitle: "የፈላሽ ሸዋ — የአንበሳ ስልት",
      culturalSignificance: "Historical Ethiopian cinema is rare. This film uses period detail to interrogate the late-19th-century reform movements that shaped modern Ethiopia.",
      featuredPriority: 6,
    },
  },
  // === ETHIOPIAN — Traditional Music ===
  {
    title: "Tizita",
    type: "music",
    description: "The quintessential Tizita — a traditional Ethiopian mode associated with nostalgia, longing, and memory. Often called 'the Ethiopian blues' for its melancholic depth.",
    releaseYear: 1970,
    language: "Amharic",
    country: "Ethiopia",
    coverImageUrl: poster("tizita"),
    artist: "Mahmoud Ahmed",
    album: "Eregna BeWeyn",
    genre: "Tizita",
    ethiopian: {
      culturalRegion: "Addis Ababa",
      traditionalGenre: "Tizita",
      isTraditional: true,
      amharicTitle: "ትዝታ",
      amharicDescription: "ባህላዊ የኢትዮጵያ ሙዚቃ አይነት ሲሆን ነጎድምሽነትንና ትዝታን ይገልጻል።",
      culturalSignificance: "Tizita is a four-note musical mode (kiñit) unique to Ethiopian musicology. Often misclassified by Western platforms as 'sad music,' it is actually a complex evocation of bittersweet memory. Mahmoud Ahmed is widely regarded as its master interpreter.",
      featuredPriority: 10,
    },
  },
  {
    title: "Bati Major",
    type: "music",
    description: "Bati is a five-note pentatonic mode often associated with weddings and celebration, but Bati Major carries a layered emotional complexity distinct from any Western genre.",
    releaseYear: 1985,
    language: "Amharic",
    country: "Ethiopia",
    coverImageUrl: poster("bati"),
    artist: "Tilahun Gessesse",
    album: "Best of Tilahun",
    genre: "Bati",
    ethiopian: {
      culturalRegion: "Addis Ababa",
      traditionalGenre: "Bati",
      isTraditional: true,
      amharicTitle: "ባቲ",
      culturalSignificance: "Bati is one of the four primary kiñit (musical modes) of traditional Ethiopian musicology. It resists Western genre taxonomies — calling it 'world music' flattens centuries of theory.",
      featuredPriority: 8,
    },
  },
  {
    title: "Anchihoye Lene",
    type: "music",
    description: "A traditional Ethiopian song in the Anchihoye mode — historically performed during mourning and reflection. Distinct from Tizita and Bati in its intervallic structure.",
    releaseYear: 1975,
    language: "Amharic",
    country: "Ethiopia",
    coverImageUrl: poster("anchihoye"),
    artist: "Tilahun Gessesse",
    album: "Golden Oldies",
    genre: "Anchihoye",
    ethiopian: {
      culturalRegion: "Gondar",
      traditionalGenre: "Anchihoye",
      isTraditional: true,
      amharicTitle: "አንጺሆዬ ሌኔ",
      culturalSignificance: "The Anchihoye kiñit is one of the lesser-known traditional Ethiopian modes, often associated with introspection and lament. Its preservation is a priority for cultural continuity.",
      featuredPriority: 7,
    },
  },
  {
    title: "Tezeta — Mulatu Astatke",
    type: "music",
    description: "Ethio-jazz pioneer Mulatu Astatke's instrumental interpretation of the Tizita mode, blending traditional kiñit with jazz harmony.",
    releaseYear: 1972,
    language: "Amharic",
    country: "Ethiopia",
    coverImageUrl: poster("mulatu"),
    artist: "Mulatu Astatke",
    album: "Ethio Jazz",
    genre: "Tizita",
    ethiopian: {
      culturalRegion: "Addis Ababa",
      traditionalGenre: "Tizita",
      isTraditional: true,
      amharicTitle: "ትዝታ",
      culturalSignificance: "Mulatu Astatke is the father of Ethio-jazz, the only indigenous African form of jazz. His work fuses traditional kiñit with Latin rhythms and Western jazz harmony, creating a uniquely Ethiopian modernism.",
      featuredPriority: 9,
    },
  },
  {
    title: "Tizita — Aster Aweke",
    type: "music",
    description: "Aster Aweke's powerful vocal interpretation of Tizita — one of the most beloved modern recordings in the mode.",
    releaseYear: 1990,
    language: "Amharic",
    country: "Ethiopia",
    coverImageUrl: poster("aster"),
    artist: "Aster Aweke",
    album: "Aster",
    genre: "Tizita",
    ethiopian: {
      culturalRegion: "Gondar",
      traditionalGenre: "Tizita",
      isTraditional: true,
      amharicTitle: "ትዝታ — አስቴ አወቀ",
      culturalSignificance: "Aster Aweke is one of Ethiopia's most beloved vocalists. Her interpretations of Tizita are widely credited with keeping the mode alive in the popular imagination of the diaspora.",
      featuredPriority: 9,
    },
  },
  {
    title: "Bati — Asnakech Worku",
    type: "music",
    description: "Asnakech Worku's interpretation of Bati on the krar — a traditional five-stringed lyre.",
    releaseYear: 1980,
    language: "Amharic",
    country: "Ethiopia",
    coverImageUrl: poster("asnakech"),
    artist: "Asnakech Worku",
    album: "The Voice of the Krar",
    genre: "Bati",
    ethiopian: {
      culturalRegion: "Gondar",
      traditionalGenre: "Bati",
      isTraditional: true,
      amharicTitle: "ባቲ — አስናቀች ወርቁ",
      culturalSignificance: "Asnakech Worku was a legendary krar player and vocalist whose work preserved traditional modes for over four decades. The krar itself is a foundational instrument in Ethiopian musical heritage.",
      featuredPriority: 8,
    },
  },
  {
    title: "Sew Tedestel — Tizita in Anchihoye Mode",
    type: "music",
    description: "A cross-mode interpretation blending the Anchihoye and Tizita kiñit, performed by the legendary Hailu Mergia.",
    releaseYear: 1978,
    language: "Amharic",
    country: "Ethiopia",
    coverImageUrl: poster("hailu"),
    artist: "Hailu Mergia",
    album: "Tche Belew",
    genre: "Anchihoye",
    ethiopian: {
      culturalRegion: "Addis Ababa",
      traditionalGenre: "Anchihoye",
      isTraditional: true,
      amharicTitle: "ሰው ተደስተል — በአንጺሆዬ ቅንጅት",
      culturalSignificance: "Hailu Mergia's work with the Walias Band represents a high-water mark of Ethiopian modernist music. 'Tche Belew' is considered one of the greatest Ethiopian albums ever recorded.",
      featuredPriority: 8,
    },
  },

  // === INTERNATIONAL — Movies ===
  {
    title: "Inception",
    type: "movie",
    description: "A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea in the mind of a CEO.",
    releaseYear: 2010,
    language: "English",
    country: "USA",
    coverImageUrl: poster("inception"),
    director: "Christopher Nolan",
    genre: "Sci-Fi",
    averageRating: 4.7,
    ratingCount: 0,
  },
  {
    title: "The Notebook",
    type: "movie",
    description: "A poor yet passionate young man falls in love with a rich young woman, but their romance is tested by social differences and war.",
    releaseYear: 2004,
    language: "English",
    country: "USA",
    coverImageUrl: poster("notebook"),
    director: "Nick Cassavetes",
    genre: "Romantic Comedy",
    averageRating: 4.3,
  },
  {
    title: "Pride and Prejudice",
    type: "movie",
    description: "Elizabeth Bennet navigates love, class, and societal expectations in 19th century England.",
    releaseYear: 2005,
    language: "English",
    country: "UK",
    coverImageUrl: poster("pride"),
    director: "Joe Wright",
    genre: "Romantic Comedy",
    averageRating: 4.5,
  },
  {
    title: "Interstellar",
    type: "movie",
    description: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
    releaseYear: 2014,
    language: "English",
    country: "USA",
    coverImageUrl: poster("interstellar"),
    director: "Christopher Nolan",
    genre: "Sci-Fi",
    averageRating: 4.6,
  },
  {
    title: "Pulp Fiction",
    type: "movie",
    description: "The lives of two mob hitmen, a boxer, and a pair of diner bandits intertwine in tales of violence and redemption.",
    releaseYear: 1994,
    language: "English",
    country: "USA",
    coverImageUrl: poster("pulp"),
    director: "Quentin Tarantino",
    genre: "Thriller",
    averageRating: 4.7,
  },
  {
    title: "The Lord of the Rings: The Fellowship of the Ring",
    type: "movie",
    description: "A young hobbit inherits a powerful ring and embarks on an epic quest to destroy it before its dark power can be unleashed.",
    releaseYear: 2001,
    language: "English",
    country: "New Zealand",
    coverImageUrl: poster("lotr"),
    director: "Peter Jackson",
    genre: "Fantasy",
    averageRating: 4.8,
  },
  {
    title: "Her",
    type: "movie",
    description: "A lonely writer develops an unlikely relationship with an operating system designed to meet his every need.",
    releaseYear: 2013,
    language: "English",
    country: "USA",
    coverImageUrl: poster("her"),
    director: "Spike Jonze",
    genre: "Drama",
    averageRating: 4.2,
  },
  {
    title: "Get Out",
    type: "movie",
    description: "A young Black man visits his white girlfriend's family estate and uncovers a disturbing truth.",
    releaseYear: 2017,
    language: "English",
    country: "USA",
    coverImageUrl: poster("getout"),
    director: "Jordan Peele",
    genre: "Thriller",
    averageRating: 4.4,
  },

  // === INTERNATIONAL — Books ===
  {
    title: "The Lord of the Rings",
    type: "book",
    description: "An epic high fantasy following the hobbit Frodo Baggins and the Fellowship on their quest to destroy the One Ring.",
    releaseYear: 1954,
    language: "English",
    country: "UK",
    coverImageUrl: poster("lotrbook"),
    author: "J.R.R. Tolkien",
    genre: "Fantasy",
    averageRating: 4.8,
  },
  {
    title: "Dune",
    type: "book",
    description: "On the desert planet Arrakis, young Paul Atreides becomes entangled in a struggle for control of the most valuable substance in the universe.",
    releaseYear: 1965,
    language: "English",
    country: "USA",
    coverImageUrl: poster("dune"),
    author: "Frank Herbert",
    genre: "Sci-Fi",
    averageRating: 4.5,
  },
  {
    title: "Pride and Prejudice",
    type: "book",
    description: "Elizabeth Bennet navigates love, class, and societal expectations in 19th century England.",
    releaseYear: 1813,
    language: "English",
    country: "UK",
    coverImageUrl: poster("pridebook"),
    author: "Jane Austen",
    genre: "Romance",
    averageRating: 4.6,
  },
  {
    title: "The Silent Patient",
    type: "book",
    description: "A woman shoots her husband and never speaks again. A criminal psychotherapist becomes obsessed with uncovering why.",
    releaseYear: 2019,
    language: "English",
    country: "UK",
    coverImageUrl: poster("silent"),
    author: "Alex Michaelides",
    genre: "Thriller",
    averageRating: 4.3,
  },
  {
    title: "The Name of the Wind",
    type: "book",
    description: "A legendary musician and arcanist recounts the story of his rise from poverty to infamy.",
    releaseYear: 2007,
    language: "English",
    country: "USA",
    coverImageUrl: poster("wind"),
    author: "Patrick Rothfuss",
    genre: "Fantasy",
    averageRating: 4.7,
  },
  {
    title: "Educated",
    type: "book",
    description: "A memoir of a woman who, kept out of school by her survivalist family, educates herself enough to leave her world behind.",
    releaseYear: 2018,
    language: "English",
    country: "USA",
    coverImageUrl: poster("educated"),
    author: "Tara Westover",
    genre: "Drama",
    averageRating: 4.6,
  },

  // === INTERNATIONAL — Music ===
  {
    title: "Bohemian Rhapsody",
    type: "music",
    description: "Queen's genre-defying progressive rock opera blending ballad, opera, and hard rock.",
    releaseYear: 1975,
    language: "English",
    country: "UK",
    coverImageUrl: poster("bohemian"),
    artist: "Queen",
    album: "A Night at the Opera",
    genre: "Rock",
    averageRating: 4.9,
  },
  {
    title: "Blinding Lights",
    type: "music",
    description: "The Weeknd's synthwave hit blending 1980s electronic textures with modern pop hooks.",
    releaseYear: 2019,
    language: "English",
    country: "Canada",
    coverImageUrl: poster("blinding"),
    artist: "The Weeknd",
    album: "After Hours",
    genre: "Electronic",
    averageRating: 4.6,
  },
  {
    title: "Clair de Lune",
    type: "music",
    description: "Debussy's iconic piano piece evoking moonlight — among the most recognizable works of the Impressionist movement.",
    releaseYear: 1905,
    language: "Instrumental",
    country: "France",
    coverImageUrl: poster("clair"),
    artist: "Claude Debussy",
    album: "Suite bergamasque",
    genre: "Orchestral",
    averageRating: 4.8,
  },
  {
    title: "Hallelujah",
    type: "music",
    description: "Leonard Cohen's meditative ballad of longing and grace — covered by hundreds, never replicated.",
    releaseYear: 1984,
    language: "English",
    country: "Canada",
    coverImageUrl: poster("hallelujah"),
    artist: "Jeff Buckley",
    album: "Grace",
    genre: "Emotional Ballads",
    averageRating: 4.9,
  },
  {
    title: "Strobe",
    type: "music",
    description: "Deadmau5's progressive house epic — a 10-minute ambient journey widely considered a landmark of electronic music.",
    releaseYear: 2009,
    language: "Instrumental",
    country: "Canada",
    coverImageUrl: poster("strobe"),
    artist: "Deadmau5",
    album: "For Lack of a Better Name",
    genre: "Electronic",
    averageRating: 4.7,
  },
  {
    title: "Hotel California",
    type: "music",
    description: "The Eagles' allegorical ballad of excess, hedonism, and the American dream.",
    releaseYear: 1976,
    language: "English",
    country: "USA",
    coverImageUrl: poster("hotel"),
    artist: "Eagles",
    album: "Hotel California",
    genre: "Rock",
    averageRating: 4.7,
  },
];

async function seed() {
  console.log("EthioReco — seeding sample content...");
  const existing = await db.item.count();
  if (existing > 0) {
    console.log(`Database already has ${existing} items — skipping seed.`);
    console.log("(To reseed, delete the database file and re-run.)");
    process.exit(0);
  }

  let ethCount = 0;
  let intCount = 0;
  for (const s of SEED_DATA) {
    const item = await db.item.create({
      data: {
        title: s.title,
        type: s.type,
        description: s.description,
        releaseYear: s.releaseYear ?? null,
        language: s.language ?? null,
        country: s.country ?? null,
        coverImageUrl: s.coverImageUrl ?? null,
        genre: s.genre,
        author: s.author ?? null,
        director: s.director ?? null,
        artist: s.artist ?? null,
        album: s.album ?? null,
        averageRating: s.averageRating ?? 0,
        ratingCount: s.ratingCount ?? 0,
        status: "active",
      },
    });
    if (s.ethiopian) {
      await db.ethiopianMetadata.create({
        data: {
          itemId: item.id,
          culturalRegion: s.ethiopian.culturalRegion ?? null,
          traditionalGenre: s.ethiopian.traditionalGenre ?? null,
          isTraditional: s.ethiopian.isTraditional ?? false,
          amharicTitle: s.ethiopian.amharicTitle ?? null,
          amharicDescription: s.ethiopian.amharicDescription ?? null,
          culturalSignificance: s.ethiopian.culturalSignificance ?? null,
          featuredPriority: s.ethiopian.featuredPriority ?? 0,
          curatedBy: "seed-script",
        },
      });
      ethCount++;
    } else {
      intCount++;
    }
  }

  console.log(`Seeded ${SEED_DATA.length} items (${ethCount} Ethiopian, ${intCount} international).`);

  // Refit + persist TF-IDF vectors
  console.log("Computing TF-IDF vectors...");
  const vecCount = await recomputeAllItemVectors();
  console.log(`Vectorized ${vecCount} items.`);

  // Create an admin user for testing (idempotent — upsert)
  // Email: admin@ethioreco.local, Password: admin12345
  console.log("Creating admin user...");
  const adminPw = await hashPassword("admin12345");
  const existingAdmin = await db.user.findUnique({ where: { email: "admin@ethioreco.local" } });
  let admin;
  if (existingAdmin) {
    admin = existingAdmin;
    console.log(`Admin already exists: admin@ethioreco.local / admin12345`);
  } else {
    admin = await db.user.create({
      data: {
        email: "admin@ethioreco.local",
        name: "Curator",
        passwordHash: adminPw,
        role: "admin",
        status: "active",
        onboardingCompleted: true,
      },
    });
    await db.credit.create({ data: { userId: admin.id, balance: 1000 } });
    await db.creditTransaction.create({
      data: { userId: admin.id, amount: 1000, reason: "initial" },
    });
    console.log(`Admin created: admin@ethioreco.local / admin12345`);
  }

  console.log("Seed complete. Open EthioReco and click 'Begin Discovery' to register a user.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
