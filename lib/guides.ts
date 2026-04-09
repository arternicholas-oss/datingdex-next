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
  {
    slug: 'best-rooftop-bars-dc-date-night',
    title: 'Best Rooftop Bars in DC for a Date Night (2026)',
    h1: 'The Best Rooftop Bars in Washington DC for Date Night',
    description:
      'The best rooftop bars in DC for date night in 2026. Sunset timing, dress codes, reservation tactics, and the rooftops that actually live up to the photos.',
    published: '2026-04-08',
    updated: '2026-04-08',
    intro: [
      'A rooftop date is one of the highest-leverage moves in DC. The view does the work, the air does the work, and the photo at the end is built in. The catch: most DC rooftops are oversold, undersized, and impossible to walk into on a Friday at 7pm.',
      'Below are the rooftops that consistently deliver — with the timing, booking strategy, and dress-code intel you need to actually have a good night.',
    ],
    sections: [
      {
        h2: 'Time it for sunset',
        body: [
          'Arrive 45 minutes before sunset, not at sunset. The 30-minute window before is when the light goes gold and every photo looks intentional. Sit on the west side of the roof if you can specify.',
          'In summer, sunset is around 8:30pm — a 7:45 reservation is ideal. In winter, sunset slips to 5pm and the rooftops with heaters become essential.',
        ],
      },
      {
        h2: 'Booking the rooftop',
        body: [
          'Most DC rooftops do NOT take rooftop-specific reservations on Resy or OpenTable — they seat the indoor restaurant first and walk-up the rooftop. The hack: book the indoor dining room at 6:30pm and ask the host if you can be moved upstairs after.',
          'For the rooftops that do take direct reservations (a small handful), book 14 days in advance for Friday and Saturday. Tuesday and Wednesday are wide open.',
        ],
      },
      {
        h2: 'What to wear',
        body: [
          'Most DC rooftops are smart-casual — no athletic wear, no flip-flops, no shorts after 7pm. A button-down or a slip dress reads correctly almost everywhere. Bring a layer; even in July the rooftops with shade get breezy after dark.',
        ],
      },
    ],
    faq: [
      {
        q: 'What is the best rooftop bar in DC for a date?',
        a: 'The best rooftop dates in DC combine a clear view, a real cocktail program, and seating you can actually claim. Our top picks are concentrated in 14th Street, Penn Quarter, and the Wharf.',
      },
      {
        q: 'Do DC rooftops take reservations?',
        a: 'Some do, most do not. The reliable workaround is to book the indoor restaurant and ask to be moved to the rooftop after you order a drink.',
      },
      {
        q: 'When is the best time to go to a DC rooftop on a date?',
        a: 'Arrive 45 minutes before sunset. The light is best in the 30-minute window before sunset, the crowd is still thin, and you can lock in the better seats.',
      },
      {
        q: 'Is rooftop dating year-round in DC?',
        a: 'Mostly April through October. A handful of DC rooftops have heaters and stay open in winter, but the wind makes them rough below 45°F. Switch to a cozy bar with a fireplace for December and January.',
      },
    ],
    pickVenues: (all) =>
      all
        .filter((v) => /rooftop|view|sky|terrace/i.test(v.name + ' ' + v.desc + ' ' + v.hook))
        .concat(all.filter((v) => /Romantic|Impress/i.test(v.vibe)))
        .filter((v, i, arr) => arr.findIndex((x) => x.slug === v.slug) === i)
        .sort(byScore)
        .slice(0, 15),
  },
  {
    slug: 'late-night-date-spots-dc',
    title: 'Late Night Date Spots in DC (Open After 10pm)',
    h1: 'Late Night Date Spots in Washington DC',
    description:
      'The best late-night date spots in DC — bars, restaurants, and dessert spots open after 10pm. Where to go after the show, after dinner, after the date almost ended.',
    published: '2026-04-08',
    updated: '2026-04-08',
    intro: [
      'The late-night spot is the most underrated weapon in DC dating. It is the place you suggest at 9:45pm when the dinner is going better than expected, when neither of you wants the night to end, when you need a graceful reason to keep going for one more hour.',
      'These are the DC spots that actually deliver after 10pm — open kitchens, real bartenders, rooms that feel busy without being chaotic.',
    ],
    sections: [
      {
        h2: 'The "one more drink" move',
        body: [
          'When dinner has been good, do not pay the check and ask "where to next?" — that breaks the rhythm. Instead, while you are still mid-conversation, say: "I know a place a few blocks away that gets good after 10. Want to walk over after this?" You have given them an out (no) and a path (walk).',
          'Pick a late-night spot that is a 5 to 10 minute walk from your dinner. The walk is the date.',
        ],
      },
      {
        h2: 'Late-night categories that work',
        body: [
          'Speakeasies and dim cocktail bars are the safest move — the lighting flatters, the menus are short, and "let me read you the cocktail list" is built-in conversation. Dessert spots and gelato are the soft option. Wine bars work if you both still have appetite.',
          'Avoid clubs, sports bars after the game, and any room with a TV.',
        ],
      },
      {
        h2: 'Neighborhoods that stay open',
        body: [
          'U Street, Shaw, and 14th Street have the deepest late-night density. Penn Quarter dies after 10 except for a few spots. Georgetown is largely closed by 11pm on weeknights — do not get stuck there.',
        ],
      },
    ],
    faq: [
      {
        q: 'What is open late on a date in DC?',
        a: 'Speakeasies, cocktail bars, dessert spots, and a handful of restaurants with late-night menus — concentrated in U Street, Shaw, and 14th Street.',
      },
      {
        q: 'How late do DC restaurants stay open?',
        a: 'Most stop seating by 10pm on weeknights and 10:30 to 11pm on weekends. Bars and late-night spots run until 1am or 2am on Friday and Saturday.',
      },
      {
        q: 'Is it weird to suggest a second spot on a first date?',
        a: 'Only if the first spot was bad. If the date is going well at 9:45pm, suggesting one more drink at a place a few blocks away is the strongest signal you can send that you want to keep talking.',
      },
    ],
    pickVenues: (all) =>
      all
        .filter((v) => /Late Night|Cocktail|Bar|Speakeasy/i.test(v.vibe))
        .sort(byScore)
        .slice(0, 15),
  },
  {
    slug: 'dc-date-ideas-by-neighborhood',
    title: 'DC Date Ideas by Neighborhood (2026 Guide)',
    h1: 'DC Date Ideas by Neighborhood',
    description:
      'Where to take a date in every Washington DC neighborhood — from Georgetown to Shaw to the Wharf. Pros, cons, parking, vibes, and the right reservation strategy for each.',
    published: '2026-04-08',
    updated: '2026-04-08',
    intro: [
      'The neighborhood you pick matters more than the restaurant. Pick the wrong neighborhood and a great restaurant feels stranded — no walk, no after-spot, no escape route. Pick the right one and even a B+ restaurant becomes part of an A night.',
      'This is the neighborhood-by-neighborhood guide to dating in DC: where to go, when to go, and where the local landmines are.',
    ],
    sections: [
      {
        h2: 'Dupont Circle — best all-around',
        body: [
          'Dupont is the most reliable date neighborhood in DC. Walkable, metro-accessible, dense with options at every price point, and the kind of foot traffic that keeps energy up without feeling chaotic. Park-and-walk friendly. Easy to chain a drink, dinner, and a third spot inside 8 blocks.',
        ],
      },
      {
        h2: 'Shaw and U Street — best for second and third dates',
        body: [
          'Shaw and U Street are where the date gets interesting. Higher concept restaurants, real cocktail bars, and the late-night density that makes the "one more drink" move actually work. Slightly less polished than Dupont, which often plays as charming.',
        ],
      },
      {
        h2: 'Georgetown — best for romance, worst for parking',
        body: [
          'Georgetown wins on atmosphere — cobblestones, the canal, the waterfront — and loses on logistics. Parking is genuinely miserable, the metro is a 15-minute walk, and many spots close early. Choose Georgetown only if you both live close or if the date is special enough to justify the friction.',
        ],
      },
      {
        h2: 'Penn Quarter — best for downtown convenience',
        body: [
          'Penn Quarter works when one of you is coming from work and the other is coming from a metro. Solid mid-range restaurants, easy parking garages, but it dies after 10pm — plan your second spot somewhere else.',
        ],
      },
      {
        h2: 'The Wharf — best for views, trickiest crowds',
        body: [
          'The Wharf has the best water views in the city and the worst weekend crowds. Go on a Tuesday or Wednesday for the experience without the chaos. Skip the obvious chains; the smaller restaurants on the eastern end consistently outperform.',
        ],
      },
      {
        h2: '14th Street — best for trendy and late-night',
        body: [
          'The strip from Logan Circle to U Street is the densest cocktail-bar corridor in the city and the best place to chain three spots in one night. Reservations are competitive on Fridays and Saturdays.',
        ],
      },
    ],
    faq: [
      {
        q: 'What is the best DC neighborhood for a date?',
        a: 'Dupont Circle is the most reliable all-around date neighborhood in DC — walkable, metro-accessible, and dense with options at every price point. For second and third dates, Shaw and U Street offer more interesting restaurants and better late-night density.',
      },
      {
        q: 'Where should you avoid for a date in DC?',
        a: 'Avoid neighborhoods with parking issues unless both of you live close (Georgetown), and avoid Penn Quarter after 10pm unless you have a clear plan for a second spot in another area.',
      },
      {
        q: 'Is Georgetown good for a date?',
        a: 'Georgetown is great for atmosphere but hard for logistics. Parking is genuinely difficult and the neighborhood closes early. Choose Georgetown when the date is special enough to justify the friction, and plan accordingly.',
      },
    ],
    pickVenues: (all) => all.sort(byScore).slice(0, 15),
  },
  {
    slug: 'dc-date-night-budget-guide',
    title: 'DC Date Night on a Budget — Under $75 for Two (2026)',
    h1: 'DC Date Night on a Budget — Under $75 for Two',
    description:
      'How to plan a great DC date night for under $75 for two. Real itineraries, real spots, the order-strategy that keeps the bill down, and the moves that look generous without being expensive.',
    published: '2026-04-08',
    updated: '2026-04-08',
    intro: [
      'A $75 date night in DC is not just possible — it can outperform a $200 one if you make the right choices. The trick is shifting your budget away from the entree and toward the experience: a great drink, a small shared plate, and a free or near-free second activity that gives the night its shape.',
      'Below is the playbook, plus the spots that consistently make $75 for two feel generous.',
    ],
    sections: [
      {
        h2: 'The order strategy',
        body: [
          'Skip entrees. Two cocktails plus three small plates almost always costs less than two entrees and tastes more interesting. You also get the bonus of sharing food, which is intimacy at no extra cost.',
          'Order the cocktail special, not the most expensive cocktail. The special is what the bartender wants to be making — it is almost always the best drink in the house.',
        ],
      },
      {
        h2: 'Free and near-free second spots',
        body: [
          'After dinner, do not pay for a second venue. Walk somewhere. The Tidal Basin at night, the Georgetown waterfront, the National Mall after 9pm, the Kennedy Center rooftop terrace (free, open until midnight). The walk and the view are the second date.',
          'In winter, swap the walk for a free museum — the Phillips Collection is open until 8:30pm on Thursdays, and the Hirshhorn has rotating evening events.',
        ],
      },
      {
        h2: 'The budget moves that read as effort',
        body: [
          'Pre-book the table even at a $$ spot — walking in and being told to wait kills the night. Show up 5 minutes early. Order a drink while you wait. These three moves cost nothing and signal more thoughtfulness than a $50 entree.',
        ],
      },
    ],
    faq: [
      {
        q: 'Can you have a good DC date for under $75?',
        a: 'Yes — and a thoughtful $75 date often outperforms a $200 one. The key is shifting budget away from entrees toward experience: cocktails, shared small plates, and a free second activity like a waterfront walk or an evening museum visit.',
      },
      {
        q: 'What are the cheapest date spots in DC?',
        a: 'Coffee dates, happy hours from 4pm to 6pm at higher-end restaurants, small-plate cocktail bars, and any restaurant with a sub-$30 prix fixe. Many great DC restaurants run $25 to $35 happy hour menus that include drinks.',
      },
      {
        q: 'What free things can you do on a date in DC?',
        a: 'Walk the Tidal Basin, visit any Smithsonian museum, walk the Georgetown waterfront, see the monuments at night, or check out a free evening event at the Kennedy Center or Phillips Collection.',
      },
    ],
    pickVenues: (all) =>
      all
        .filter((v) => v.price === '$' || v.price === '$$')
        .sort(byScore)
        .slice(0, 15),
  },
  {
    slug: 'best-brunch-date-spots-dc',
    title: 'Best Brunch Date Spots in DC (2026)',
    h1: 'Best Brunch Date Spots in Washington DC',
    description:
      'Brunch is the lowest-pressure date format in DC: daylight, mimosas, and a built-in two-hour cap. Here are the spots that actually deliver.',
    published: '2026-04-08',
    updated: '2026-04-08',
    intro: [
      'Brunch dates work because they remove the biggest sources of first-date anxiety: the awkward "where does this end" question and the expectation of a three-hour dinner marathon. You get daylight, caffeine, a glass of something sparkling, and a clean exit if the chemistry is not there — or an easy pivot to a walk if it is.',
      'The spots below are DC rooms that are actually romantic at 11am, not just dinner restaurants pulling double duty.',
    ],
    sections: [
      {
        h2: 'What makes a brunch spot date-worthy',
        body: [
          'Good lighting, tables you can hear each other across, a menu beyond eggs benedict, and a drinks program that takes mimosas seriously.',
          'Bonus points for walkable neighborhoods so you can extend the date with zero planning.',
        ],
      },
      {
        h2: 'How to play it',
        body: [
          'Book for 11:30am — late enough you both had time to get ready, early enough the room is not screaming. Skip bottomless unless you already know each other; it forces a pace that can tip into awkward.',
          'End with a walk, not a second round.',
        ],
      },
    ],
    faq: [
      {
        q: 'Is brunch a good first date?',
        a: 'It is arguably the best first date in DC. Daylight reduces pressure, the time window is naturally capped, and you can pivot to a walk if things click.',
      },
      {
        q: 'Should I book ahead for brunch in DC?',
        a: 'Yes. The best brunch rooms in DC book out Saturdays and Sundays a week in advance. Resy or OpenTable at the 11am–noon window.',
      },
    ],
    pickVenues: (all) =>
      all
        .filter((v) => v.vibe === 'romantic' || v.vibe === 'casual' || v.vibe === 'upscale')
        .sort(byScore)
        .slice(0, 12),
  },
];

export function getGuideBySlug(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}

export function allGuideSlugs(): string[] {
  return GUIDES.map((g) => g.slug);
}

export { slugify };
