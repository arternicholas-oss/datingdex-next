/**
 * Curated pre-date playlist mapping.
 * These are public Spotify playlists \u2014 no API, no OAuth, no keys required.
 * Swap in editorially-curated DatingDex playlists as they\u2019re built.
 */

import type { VibeChoice } from './planner';

export type Playlist = {
  name: string;
  url: string;
  note: string;
};

// Editor\u2019s note: these are Spotify public playlists picked for mood match.
// Replace with in-house DatingDex playlists over time (spotify for creators).
const PLAYLISTS_BY_VIBE: Record<VibeChoice, Playlist> = {
  'impressive': {
    name: 'Late Dinner',
    url: 'https://open.spotify.com/playlist/37i9dQZF1DWZeKCadgRdKQ',
    note: '20 minutes, starts slow, ends with a pulse. Play it on the way over. Don\u2019t explain it.',
  },
  'intimate': {
    name: 'Quiet Mind',
    url: 'https://open.spotify.com/playlist/37i9dQZF1DWT1y5j3JdSlI',
    note: 'Low-lit, close, modern. Don\u2019t play it loud. That\u2019s the whole point.',
  },
  'low-pressure': {
    name: 'Bossa Nova Dinner',
    url: 'https://open.spotify.com/playlist/37i9dQZF1DWVpZWo2wAmAt',
    note: 'Keeps the temperature right. No one has to talk about the music.',
  },
  'classic-romantic': {
    name: 'Sunset Lover',
    url: 'https://open.spotify.com/playlist/37i9dQZF1DWYlBpFupJmJ1',
    note: 'Starts with the feeling. Ends somewhere soft. Exactly enough.',
  },
  'adventurous': {
    name: 'Indie Mix',
    url: 'https://open.spotify.com/playlist/37i9dQZF1DX2Nc3B70tvx0',
    note: 'Good for the car, not the dinner. Cut it off when you park.',
  },
  'something-else': {
    name: 'Date Night',
    url: 'https://open.spotify.com/playlist/37i9dQZF1DX7rOY2tZUw1k',
    note: 'A safe default. Skip the first track if it\u2019s the obvious one.',
  },
};

export function getPlaylistForVibe(vibe: VibeChoice): Playlist {
  return PLAYLISTS_BY_VIBE[vibe] || PLAYLISTS_BY_VIBE['classic-romantic'];
}
