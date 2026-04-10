'use client';

import type { DatingIntelligenceData } from '@/lib/datingIntelligence';
import { selectDisplayCategories } from '@/lib/datingIntelligence';

export default function DatingIntelligence({ data }: { data: DatingIntelligenceData }) {
  const categories = selectDisplayCategories(data);

  return (
    <div className="di-stack">
      {categories.map((cat) => (
        <div key={cat.type} className="di-row">
          <span className="di-emoji" aria-hidden>{cat.emoji}</span>
          <div className="di-text">
            <span className="di-label">{cat.label}</span>
            <span className="di-flavor">{cat.flavor}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
