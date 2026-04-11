'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Props {
  neighborhoods: string[];
  vibes: string[];
}

export default function DiscoveryFilter({ neighborhoods, vibes }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="filter-toggle"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="discovery-filters"
      >
        {open ? '\u2715 Close Filters' : '\u2630 Filters'}
      </button>

      <aside
        id="discovery-filters"
        className={`discovery-sidebar ${open ? 'discovery-sidebar--open' : ''}`}
      >
        <div className="sidebar-section">
          <h3>Neighborhoods</h3>
          <ul>
            {neighborhoods.map(n => (
              <li key={n}>
                <Link href={`/dc/${n.toLowerCase().replace(/\s+/g, '-')}`} onClick={() => setOpen(false)}>
                  {n}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="sidebar-section">
          <h3>Vibes</h3>
          <ul>
            {vibes.map(v => (
              <li key={v}>
                <Link href={`/vibe/${v.toLowerCase().replace(/\s+/g, '-')}`} onClick={() => setOpen(false)}>
                  {v}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {open && <div className="filter-backdrop" onClick={() => setOpen(false)} />}
    </>
  );
}
