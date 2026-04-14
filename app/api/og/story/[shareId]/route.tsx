import { ImageResponse } from 'next/og';
import { createServiceClient } from '@/lib/supabase-server';
import { formatTime12h } from '@/lib/format';

export const runtime = 'nodejs';

/**
 * Instagram Story-sized Date Card (1080x1920).
 * Beautiful branded image users share on IG Stories.
 * "We're doing [Restaurant] → [Bar] tonight, planned by @DatingDex"
 */
export async function GET(_req: Request, { params }: { params: { shareId: string } }) {
  const svc = createServiceClient();
  const { data: plan } = await svc
    .from('plans')
    .select('share_id, share_blurb, itinerary, city, created_at')
    .eq('share_id', params.shareId)
    .single();

  const it: any = plan?.itinerary;
  const stops: any[] = it?.stops || [];
  const city = plan?.city || 'Washington, DC';
  const dressCode = it?.dressCode;
  const estimate = it?.totalEstimateUsd;

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(180deg, #1a1a1a 0%, #2d1b14 50%, #1a1a1a 100%)',
          padding: '80px 60px',
          fontFamily: 'sans-serif',
          color: '#fff',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 16, height: 16, background: '#FF5C3A', borderRadius: 999 }} />
          <div style={{ fontSize: 28, fontWeight: 800, color: '#FF5C3A', letterSpacing: 2 }}>DATINGDEX</div>
        </div>

        <div style={{ fontSize: 22, color: '#888', marginTop: 12, letterSpacing: 1 }}>
          {city.toUpperCase()} DATE NIGHT
        </div>

        {/* Main title */}
        <div
          style={{
            marginTop: 60,
            fontSize: 52,
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: -0.5,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <span style={{ color: '#FF5C3A', fontSize: 24, fontWeight: 700, letterSpacing: 2, marginBottom: 16 }}>
            TONIGHT&apos;S PLAN
          </span>
          {stops.map((s: any, i: number) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
              <span style={{ color: '#fff' }}>{s.venue?.name || `Stop ${i + 1}`}</span>
              {i < stops.length - 1 && <span style={{ color: '#FF5C3A', fontSize: 32 }}>→</span>}
            </div>
          ))}
        </div>

        {/* Stop details */}
        <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 24 }}>
          {stops.map((s: any, i: number) => (
            <div
              key={i}
              style={{
                display: 'flex',
                flexDirection: 'column',
                borderLeft: '3px solid #FF5C3A',
                paddingLeft: 20,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 20, color: '#FF5C3A', fontWeight: 700 }}>{formatTime12h(s.startTime)}</span>
                <span style={{ fontSize: 20, color: '#999' }}>·</span>
                <span style={{ fontSize: 20, color: '#999' }}>{s.venue?.neighborhood}</span>
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>{s.venue?.name}</div>
              <div style={{ fontSize: 18, color: '#888', marginTop: 2 }}>
                {s.venue?.price}
              </div>
            </div>
          ))}
        </div>

        {/* Dress code if available */}
        {dressCode && (
          <div
            style={{
              marginTop: 40,
              background: 'rgba(255,92,58,0.12)',
              borderRadius: 16,
              padding: '20px 24px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <span style={{ fontSize: 16, color: '#FF5C3A', fontWeight: 700, letterSpacing: 1 }}>WHAT TO WEAR</span>
            <span style={{ fontSize: 22, color: '#ddd', marginTop: 6, lineHeight: 1.4 }}>{dressCode}</span>
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            marginTop: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}
        >
          {estimate && (
            <div style={{ fontSize: 20, color: '#666' }}>
              ${estimate[0]}–${estimate[1]} for two
            </div>
          )}
          <div
            style={{
              background: '#FF5C3A',
              color: '#fff',
              padding: '16px 32px',
              borderRadius: 999,
              fontSize: 22,
              fontWeight: 700,
            }}
          >
            Plan yours at datingdex.com
          </div>
          <div style={{ fontSize: 16, color: '#555', marginTop: 4 }}>AI-choreographed date nights ✦</div>
        </div>
      </div>
    ),
    { width: 1080, height: 1920 }
  );
}
