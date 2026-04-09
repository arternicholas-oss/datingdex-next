'use client';

import { useEffect, useState } from 'react';

type EBEvent = {
  id: string;
  title: string;
  url: string;
  startLocal: string;
  endLocal: string;
  imageUrl: string | null;
  venueName: string | null;
  area: string | null;
  isFree: boolean;
  minPrice: string | null;
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const tomorrow = new Date(Date.now() + 86400000);
  if (d.toDateString() === today.toDateString()) return 'Tonight';
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function EventbriteTonight() {
  const [events, setEvents] = useState<EBEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/eventbrite')
      .then((r) => r.json())
      .then((d) => setEvents(d.events || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="eb-tonight-loading">
        <div className="eb-shimmer" /><div className="eb-shimmer" /><div className="eb-shimmer" />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="eb-tonight-empty">
        <p>Check back soon — we pull tonight&apos;s best events from Eventbrite every hour.</p>
      </div>
    );
  }

  return (
    <div className="eb-tonight-grid">
      {events.map((e) => (
        <a
          key={e.id}
          href={e.url}
          target="_blank"
          rel="noopener noreferrer"
          className="eb-card"
        >
          {e.imageUrl && (
            <div
              className="eb-card-img"
              style={{ backgroundImage: `url(${e.imageUrl})` }}
            />
          )}
          <div className="eb-card-body">
            <div className="eb-card-when">
              {formatDate(e.startLocal)} · {formatTime(e.startLocal)}
            </div>
            <h4 className="eb-card-title">{e.title}</h4>
            {e.venueName && (
              <div className="eb-card-venue">{e.venueName}</div>
            )}
            <div className="eb-card-price">
              {e.isFree ? 'Free' : e.minPrice ? `From $${e.minPrice}` : 'See pricing'}
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}
