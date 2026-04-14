import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { formatTime12h, glance12h, dedupeLeadingSentence } from '@/lib/format';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Returns a print-optimized HTML page with window.print() auto-trigger.
 * Safari / Chrome "Save as PDF" from the print dialog produces a clean A4.
 * Designed to be robust without a headless browser or extra deps.
 * For a true server-rendered PDF binary, swap in @vercel/og + pdfkit later.
 */
export async function GET(_req: Request, { params }: { params: { shareId: string } }) {
  const svc = createServiceClient();
  const { data: plan } = await svc
    .from('plans')
    .select('share_id, city, situation, vibe, activity, budget, itinerary, plan_payload, share_blurb')
    .eq('share_id', params.shareId)
    .single();
  if (!plan) return new NextResponse('Not found', { status: 404 });

  const it: any = plan.itinerary;
  const stops: any[] = it?.stops || [];
  const p: any = plan.plan_payload || {};

  const esc = (s: any) =>
    String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  const stopHtml = stops
    .map((s: any, i: number) => {
      const beats = s.beats || {};
      return `
        <section class="stop">
          <div class="stop-head">
            <div class="time">
              <div class="slot">${esc(s.slot || 'main')}</div>
              <div class="clock">${esc(formatTime12h(s.startTime || ''))}</div>
              <div class="dur">${esc(s.durationMin || 60)} min</div>
            </div>
            <div class="title">
              <h2>${esc(s.venue?.name || 'Stop')}</h2>
              <div class="meta">${esc(s.venue?.neighborhood || '')} \u00b7 ${esc(s.venue?.price || '')}</div>
            </div>
          </div>
          ${s.blurb ? `<p class="blurb">${esc(dedupeLeadingSentence(s.blurb))}</p>` : ''}
          <dl class="beats">
            ${beats.arrival ? `<dt>Walk in</dt><dd>${esc(beats.arrival)}</dd>` : ''}
            ${beats.whyThisWorks ? `<dt>Why this</dt><dd>${esc(beats.whyThisWorks)}</dd>` : ''}
            ${beats.orderFirst ? `<dt>Order first</dt><dd>${esc(beats.orderFirst)}</dd>` : ''}
            ${beats.insiderTip ? `<dt>Insider</dt><dd>${esc(beats.insiderTip)}</dd>` : ''}
            ${s.whatToWear ? `<dt>Wear</dt><dd>${esc(s.whatToWear)}</dd>` : ''}
            ${s.photoSpot ? `<dt>Photo spot</dt><dd>${esc(s.photoSpot)}</dd>` : ''}
          </dl>
          ${
            i < stops.length - 1 && s.walkTo
              ? `<div class="walk">${esc(s.walkTo.minutes)}m walk \u2014 ${esc(s.walkTo.line)}</div>`
              : ''
          }
        </section>
      `;
    })
    .join('\n');

  const playlistQr = p.playlist?.url
    ? `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(p.playlist.url)}`
    : '';

  const calQr = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.datingdex.com'}/api/plan/${params.shareId}/ics`;
  const calQrImg = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(calQr)}`;

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Date Plan \u00b7 DatingDex</title>
<meta name="robots" content="noindex" />
<style>
  @page { size: A4; margin: 20mm 16mm; }
  * { box-sizing: border-box; }
  body { font-family: "Helvetica Neue", Arial, sans-serif; color: #1a1a1a; line-height: 1.45; margin: 0; padding: 0; background: #fff; }
  .sheet { max-width: 720px; margin: 0 auto; padding: 40px 32px; }
  .brand { color: #FF5C3A; font-weight: 800; letter-spacing: 2px; font-size: 12px; }
  h1 { font-size: 28px; margin: 8px 0 4px; font-weight: 800; line-height: 1.2; }
  .cold { font-family: Georgia, serif; font-style: italic; color: #333; margin: 16px 0 8px; border-left: 3px solid #FF5C3A; padding-left: 12px; }
  .glance { font-weight: 700; margin: 16px 0; }
  .strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; border: 1px solid #eee; border-radius: 8px; padding: 12px; margin: 16px 0; font-size: 12px; }
  .strip .lbl { color: #888; text-transform: uppercase; font-size: 10px; letter-spacing: .5px; }
  .strip .val { font-weight: 700; font-size: 16px; }
  .stop { margin: 24px 0; page-break-inside: avoid; border-top: 1px solid #eee; padding-top: 16px; }
  .stop-head { display: flex; gap: 16px; align-items: flex-start; }
  .time { min-width: 80px; text-align: center; border-right: 1px dashed #ddd; padding-right: 12px; }
  .slot { font-size: 10px; letter-spacing: .5px; color: #888; text-transform: uppercase; }
  .clock { font-weight: 800; font-size: 18px; }
  .dur { font-size: 10px; color: #888; }
  .title h2 { margin: 0; font-size: 18px; }
  .meta { color: #666; font-size: 12px; margin-top: 2px; }
  .blurb { color: #333; margin: 10px 0; }
  .beats { display: grid; grid-template-columns: 110px 1fr; gap: 4px 12px; margin: 8px 0 4px; font-size: 13px; }
  .beats dt { font-weight: 700; color: #555; }
  .beats dd { margin: 0; color: #222; }
  .walk { font-style: italic; color: #666; font-size: 12px; margin-top: 10px; border-top: 1px dashed #ddd; padding-top: 8px; }
  .section { margin: 20px 0; page-break-inside: avoid; }
  .section h3 { font-size: 14px; margin: 0 0 6px; text-transform: uppercase; letter-spacing: .5px; color: #888; }
  ul { margin: 8px 0; padding-left: 18px; }
  .note { font-family: Georgia, serif; font-style: italic; border-top: 1px solid #eee; padding-top: 16px; margin-top: 24px; color: #333; }
  .sig { text-align: right; color: #888; margin-top: 4px; }
  .qrs { display: flex; gap: 24px; justify-content: space-between; margin-top: 24px; border-top: 1px solid #eee; padding-top: 16px; }
  .qr { text-align: center; font-size: 11px; color: #555; }
  .qr img { display: block; margin: 0 auto 4px; }
  .fineprint { text-align: center; color: #999; font-size: 10px; margin-top: 24px; }
  @media print { .no-print { display: none !important; } }
  .no-print { position: sticky; top: 0; background: #fff4f1; padding: 12px 16px; text-align: center; font-size: 14px; }
  .no-print button { background: #FF5C3A; color: #fff; border: 0; padding: 8px 14px; border-radius: 999px; cursor: pointer; font-weight: 700; }
</style>
</head>
<body>
  <div class="no-print">
    Use your browser\u2019s Save-as-PDF from the print dialog &middot;
    <button onclick="window.print()">Print / Save PDF</button>
  </div>
  <div class="sheet">
    <div class="brand">DATINGDEX \u00b7 Date plan</div>
    <h1>${esc(stops.map((s: any) => s.venue?.name).filter(Boolean).join(' \u2192 '))}</h1>
    ${p.coldOpen ? `<div class="cold">${esc(p.coldOpen)}</div>` : ''}
    ${p.nightAtAGlance ? `<div class="glance">${esc(glance12h(p.nightAtAGlance))}</div>` : ''}

    <div class="strip">
      <div><div class="lbl">Leave by</div><div class="val">${esc(formatTime12h(p.timingSheet?.leaveBy || ''))}</div></div>
      <div><div class="lbl">Arrive</div><div class="val">${esc(formatTime12h(p.timingSheet?.arriveBy || ''))}</div></div>
      <div><div class="lbl">Weather</div><div class="val">${p.weather ? esc(p.weather.tempF) + '\u00b0F' : '\u2014'}</div></div>
      <div><div class="lbl">Total</div><div class="val">$${it?.totalEstimateUsd?.[0] ?? '\u2014'}\u2013${it?.totalEstimateUsd?.[1] ?? '\u2014'}</div></div>
    </div>

    ${stopHtml}

    ${p.paymentNote ? `<div class="section"><h3>At the bill</h3><p>${esc(p.paymentNote)}</p></div>` : ''}

    ${(p as any).conversationHooks?.length ? `<div class="section"><h3>Conversation hooks</h3><ul>${((p as any).conversationHooks as string[]).map((h) => `<li>${esc(h)}</li>`).join('')}</ul></div>` : ''}

    ${p.bailoutLine || p.extendLine ? `<div class="section">
      ${p.extendLine ? `<h3>If it\u2019s going great</h3><p>${esc(p.extendLine)}</p>` : ''}
      ${p.bailoutLine ? `<h3 style="margin-top:12px">If you need out</h3><p>${esc(p.bailoutLine)}</p>` : ''}
    </div>` : ''}

    ${p.postDateText ? `<div class="section"><h3>Morning-after text</h3><p><em>\u201c${esc(p.postDateText)}\u201d</em></p></div>` : ''}

    ${p.producersNote ? `<div class="note"><p>${esc(p.producersNote)}</p><div class="sig">\u2014 DatingDex</div></div>` : ''}

    <div class="qrs">
      ${playlistQr ? `<div class="qr"><img src="${playlistQr}" alt="Playlist QR" /><div>Pre-date playlist</div><div style="color:#999">${esc(p.playlist?.name || '')}</div></div>` : ''}
      <div class="qr"><img src="${calQrImg}" alt="Calendar QR" /><div>Add to calendar</div><div style="color:#999">scan to import .ics</div></div>
    </div>

    <div class="fineprint">
      Plan #${esc(params.shareId)} \u00b7 Generated by DatingDex \u00b7 www.datingdex.com
    </div>
  </div>
  <script>window.addEventListener('load', () => { try { window.print(); } catch (e) {} });</script>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'private, max-age=0, no-store',
    },
  });
}
