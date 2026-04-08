import { VENUES, slugify, type Venue } from './venues';

export type GuideSection = { h2: string; body: string[] };
export type GuideFaq = { q: string; a: string };

export type Guide = {
  slug: string;
  title: string;
  h1: string;
  description: string;
  published: string;
  updated: string;
  intro: string[];
  sections: GuideSection[];
  faq: GuideFaq[];
  pickVenues: (all: Venue[]) => Venue[];
};

const byScore = (a: Venue, b: Venue) => (b.score ?? 0) - (a.score ?? 0);

export const GUIDES: Guide[] = [
  {
    slug: 'best-first-date-spots-dc',
    title: 'Best First Date Spots in Washington DC (2026)',
    h1: 'The 15 Best First Date Spots in Washington DC',
    description:
      'The best first date spots in Washington DC for 2026, ranked. Low-pressure conversation, easy parking, graceful exits, and book-on-Resy picks across Dupont, Shaw, Georgetown, and Penn Quarter.',
    published: '2026-04-08',
    updated: '2026-04-08',
    intro: [
      'A great first date in DC needs three things: a room that lets you actually hear each other, a menu that doesn\'t force a 20-minute decision, and a graceful exit if chemistry fizzles. We ranked every spot in our database on exactly those criteria.',
      'Below are the 15 highest-scoring first date venues in Washington DC this year, pulled from the 309 spots we track. Each one is a low-stakes room where you can order a drink, split something small, and decide in 45 minutes whether you want act two.',
    ],
    sections: [
      {
        h2: 'What makes a first date spot actually work',
        body: [
          'We score every venue on three signals: conversation (can you hear each other without shouting), vibe (does the room do the work for you), and exit (can you leave after one drink without it being weird). A real first date spot nails all three.',
          'Avoid tasting menus, places with two-hour waits, and any restaurant where the host stand feels like an audition. Save those for date three.',
        ],
      },
      {
        h2: 'Neighborhoods that over-index for first dates',
        body: [
          'Dupont Circle and Shaw are our top-ranked neighborhoods for first dates — walkable, metro-accessible, and dense with bars you can move to if things are going well. Penn Quarter works if one of you is coming from downtown. Georgetown is romantic but parking is miserable; only choose it if you both live close.',
        ],
      },
      {
        h2: 'How to use this list',
        body: [
          'Pick three from the grid below that match your budget and neighborhood. Book the earliest one on Resy or OpenTable. If they cancel, you have two backups without having to re-scroll.',
        ],
      },
    ],
    faq: [
      {
        q: 'What is the best first date spot in DC?',
        a: 'Our top-ranked first date spots are concentrated in Dupont Circle, Shaw, and Penn Quarter — neighborhoods with walkable bar density so you can easily move venues if the date is going well.',
      },
      {
        q: 'How much should a first date in DC cost?',
        a: 'Aim for $$ rather than $$$. A first date should feel generous without being an investment. Two drinks and a shared plate in the $60 to $90 range signals effort without pressure.',
      },
      {
        q: 'Should you make a reservation for a first date?',
        a: 'Yes, always. Walking in cold and getting told it\'s a 45-minute wait kills momentum. Book on Resy or OpenTable at least 48 hours out.',
      },
      {
        q: 'What should you avoid on a first date in DC?',
        a: 'Avoid tasting menus, loud sports bars, anywhere with a two-hour minimum, and any restaurant where you can\'t comfortably leave after one drink.',
      },
    ],
    pickVenues: (all) =>
      all.filter((v) => v.vibe.toLowerCase().includes('first date')).sort(byScore).slice(0, 15),
  },
  {
    slug: 'most-romantic-restaurants-dc',
    title: 'Most Romantic Restaurants in Washington DC (2026)',
    h1: 'The Most Romantic Restaurants in Washington DC',
    description:
      'The most romantic restaurants in DC for 2026. Candlelit rooms, quiet banquettes, and menus built for lingering — hand-ranked across Georgetown, Dupont, and the Wharf.',
    published: '2026-04-08',
    updated: '2026-04-08',
    intro: [
      'Romantic does not mean expensive and it does not mean a white tablecloth you\'re afraid to spill on. It means the room does half the work — lighting, acoustics, pacing — so you can actually pay attention to the person across from you.',
      'These are the DC restaurants that consistently deliver that. Candlelight, banquettes, windows, or a bar you can tuck into without feeling watched.',
    ],
    sections: [
      {
        h2: 'Signals of a genuinely romantic room',
        body: [
          'Look for warm low lighting (not dim, not dark), tables spaced far enough apart that you\'re not eavesdropping on your neighbors, and servers who disappear between courses. Music should sit under conversation, not on top of it.',
          'Bonus points for a window seat, a fireplace, or a garden terrace in the spring.',
        ],
      },
      {
        h2: 'Best neighborhoods for a romantic night',
        body: [
          'Georgetown wins on pure atmosphere — the cobblestones and waterfront do the work. Dupont Circle is the best balance of romance and convenience. The Wharf has the water views but is a scene; go on a weeknight.',
        ],
      },
    ],
    faq: [
      {
        q: 'What is the most romantic restaurant in DC?',
        a: 'Our highest-ranked romantic spots are in Georgetown and along the Wharf, where the room and the view both contribute. But a quieter neighborhood pick in Dupont often beats a famous waterfront place on a crowded Saturday.',
      },
      {
        q: 'When should you book a romantic dinner in DC?',
        a: 'Seven to fourteen days out for weekends, especially for anniversaries and Valentine\'s. Weeknight romance (Tuesday or Wednesday) is dramatically easier to book and often quieter on the floor.',
      },
      {
        q: 'Is Georgetown the most romantic neighborhood in DC?',
        a: 'By atmosphere, yes — waterfront, cobblestones, and historic facades. But parking is difficult and cabs are slow, so only pick Georgetown if you\'re both already nearby.',
      },
    ],
    pickVenues: (all) =>
      all
        .filter((v) => ['Impress Them', 'Date Night', 'Anniversary'].some((t) => v.vibe.includes(t)))
        .sort(byScore)
        .slice(0, 15),
  },
  {
    slug: 'cheap-date-ideas-dc-under-50',
    title: 'Cheap Date Ideas in DC Under $50 (2026)',
    h1: 'Cheap Date Ideas in Washington DC Under $50',
    description:
      'Real date ideas in DC for under $50 total — not sad, not student-budget. Coffee, wine bars, walks, and $ venues that punch above their weight.',
    published: '2026-04-08',
    updated: '2026-04-08',
    intro: [
      'A $50 date in DC is completely doable — the trick is picking venues where the room and the hospitality make the price invisible. Skip chains, skip anywhere with a cover, and lean on neighborhood coffee shops, natural wine bars, and $ spots with real cooking.',
      'Everything below keeps two people under $50 all-in, including tax and tip, if you share smart.',
    ],
    sections: [
      {
        h2: 'The $50 date blueprint',
        body: [
          'Two drinks and one shared small plate is the default. Coffee date first, then a short walk, then a decision to either part ways or add a glass of wine somewhere nearby. That pacing keeps costs low and optionality high.',
        ],
      },
      {
        h2: 'Neighborhoods that are cheap without feeling cheap',
        body: [
          'Shaw, H Street, and Petworth consistently punch above their price. Avoid Georgetown and the Wharf for budget dates — the real estate forces prices up regardless of concept.',
        ],
      },
    ],
    faq: [
      {
        q: 'Can you really do a date in DC for under $50?',
        a: 'Yes. Two coffees and a shared pastry is $15. Two natural wines and a small plate at a $ wine bar is $35 to $45. A long walk after either one is free.',
      },
      {
        q: 'What is the best cheap date neighborhood in DC?',
        a: 'Shaw and H Street have the highest density of well-reviewed $ venues. You can start with coffee, walk 10 minutes, and end at a wine bar without driving.',
      },
      {
        q: 'Are cheap dates in DC less romantic?',
        a: 'No. A great neighborhood coffee bar on a sunny Saturday morning beats an expensive dinner where you spend the night checking the bill.',
      },
    ],
    pickVenues: (all) =>
      all
        .filter((v) => v.price === '$' || v.vibe.toLowerCase().includes('coffee'))
        .sort(byScore)
        .slice(0, 15),
  },
  {
    slug: 'best-anniversary-dinner-dc',
    title: 'Best Anniversary Dinner Spots in Washington DC (2026)',
    h1: 'The Best Anniversary Dinner Spots in Washington DC',
    description:
      'The best anniversary dinner restaurants in DC for 2026. Rooms worth the occasion, menus worth the memory, and reservations you can actually land.',
    published: '2026-04-08',
    updated: '2026-04-08',
    intro: [
      'An anniversary dinner is one of the three or four times a year the room actually matters. You want somewhere that treats the occasion without making a big show of it — a candle, a kind word from the server, maybe a small dessert they didn\'t charge for.',
      'These are the DC restaurants that deliver that without turning it into a performance.',
    ],
    sections: [
      {
        h2: 'How to pick the right anniversary spot',
        body: [
          'Prioritize somewhere you can both hear each other and somewhere you have not been together before. A new room for a recurring date is the simplest way to make it feel like an occasion.',
          'When you book, note the anniversary in the reservation. Most good restaurants flag it and it changes the pacing of the meal in your favor.',
        ],
      },
      {
        h2: 'When to book',
        body: [
          'Two to three weeks ahead for a weekend. Four weeks for a milestone. Avoid Valentine\'s week entirely — the kitchen is under siege and the service suffers.',
        ],
      },
    ],
    faq: [
      {
        q: 'What is the best anniversary restaurant in DC?',
        a: 'The best anniversary spot is somewhere you have not been together before. Pick from our highest-scoring impress-them venues and filter out anywhere you have a shared memory already.',
      },
      {
        q: 'Should you tell the restaurant it is your anniversary?',
        a: 'Yes. Note it in the reservation. Good rooms will adjust pacing, maybe comp a small dessert, and make sure your server knows before they greet you.',
      },
      {
        q: 'How far in advance should you book an anniversary dinner in DC?',
        a: 'Two to three weeks for a regular weekend, four weeks for a milestone. Book early, not close.',
      },
    ],
    pickVenues: (all) =>
      all
        .filter((v) => v.price === '$$$' || v.price === '$$$$')
        .sort(byScore)
        .slice(0, 12),
  },
  {
    slug: 'rainy-day-date-ideas-dc',
    title: 'Rainy Day Date Ideas in Washington DC (2026)',
    h1: 'Rainy Day Date Ideas in Washington DC',
    description:
      'The best rainy day date ideas in DC — cozy bars, long lingering lunches, museums, and bookshops you can kill three hours in without noticing.',
    published: '2026-04-08',
    updated: '2026-04-08',
    intro: [
      'DC does rainy days well. The museums are free, the bars are warm, and the neighborhoods are walkable enough that you can duck between them without getting fully soaked.',
      'Here is what actually works when the weather cancels your plan.',
    ],
    sections: [
      {
        h2: 'The rainy day playbook',
        body: [
          'Coffee first, then a museum or a bookshop, then a long lingering lunch or early dinner at a $$ spot with a banquette and a window. Rainy days are about slowing down, not rerouting.',
          'Pick venues within a five-minute walk of a metro stop. The car is not your friend today.',
        ],
      },
      {
        h2: 'Best rainy day neighborhoods',
        body: [
          'Dupont Circle, Penn Quarter, and Adams Morgan all have enough indoor density that you can string together a full afternoon without needing an umbrella for more than a block at a time.',
        ],
      },
    ],
    faq: [
      {
        q: 'What is the best rainy day date in DC?',
        a: 'A long lingering lunch at a cozy $$ spot near a metro, sandwiched between a coffee and a museum or bookshop. Low pressure, high atmosphere, and the weather becomes part of the mood.',
      },
      {
        q: 'Are DC museums a good rainy day date?',
        a: 'Yes — and many are free. The Phillips Collection, the Hirshhorn, and the National Portrait Gallery are all compact enough for a two-hour visit without exhausting either of you.',
      },
    ],
    pickVenues: (all) =>
      all
        .filter((v) => ['Cozy', 'Late Night', 'Coffee', 'Date Night'].some((t) => v.vibe.includes(t)))
        .sort(byScore)
        .slice(0, 15),
  },
];

export function getGuideBySlug(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}

export function allGuideSlugs(): string[] {
  return GUIDES.map((g) => g.slug);
}

export { slugify };
