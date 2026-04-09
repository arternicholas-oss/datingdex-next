import { ImageResponse } from 'next/og';
import { createServiceClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';

export async function GET(_req: Request, { params }: { params: { shareId: string } }) {
  const svc = createServiceClient();
  const { data: plan } = await svc
    .from('plans')
    .select('share_id, share_blurb, itinerary, city')
    .eq('share_id', params.shareId)
    .single();

  const it: any = plan?.itinerary;
  const stops = it?.stops || [];
  const title = stops.map((s: any) => s.venue?.name).filter(Boolean).join('  →  ') || 'A perfect date night';
  const blurb = plan?.share_blurb || `${plan?.city ?? 'DC'} date plan, hand-built by DatingDex`;

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #fff 0%, #fff5f1 100%)',
          padding: 64,
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 14, height: 14, background: '#FF5C3A', borderRadius: 999 }} />
          <div style={{ fontSize: 24, fontWeight: 700, color: '#FF5C3A', letterSpacing: 1 }}>DATINGDEX</div>
        </div>
        <div style={{ marginTop: 24, fontSize: 22, color: '#666', fontWeight: 500 }}>A complete date night plan</div>
        <div
          style={{
            marginTop: 16,
            fontSize: 56,
            lineHeight: 1.05,
            fontWeight: 800,
            color: '#1a1a1a',
            letterSpacing: -1,
            display: 'flex',
          }}
        >
          {title}
        </div>
        <div style={{ marginTop: 28, fontSize: 28, color: '#444', lineHeight: 1.3, maxWidth: 1000, display: 'flex' }}>
          {blurb}
        </div>
        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ fontSize: 22, color: '#888' }}>Plan yours at datingdex.com/plan</div>
          <div style={{ fontSize: 22, color: '#FF5C3A', fontWeight: 700 }}>✦ AI-built</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
