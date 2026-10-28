import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a0a',
          backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(37,244,238,0.35), transparent 45%), radial-gradient(circle at 75% 70%, rgba(254,44,85,0.35), transparent 45%)'
        }}
      >
        <div style={{ display: 'flex', fontSize: 72, fontWeight: 800, color: 'white' }}>
          <span style={{ background: 'linear-gradient(90deg, #25F4EE, #FE2C55)', backgroundClip: 'text', color: 'transparent' }}>
            NicheTok
          </span>
          <span style={{ marginLeft: 16 }}>.io</span>
        </div>
        <div style={{ display: 'flex', marginTop: 24, fontSize: 30, color: '#a3a3a3' }}>
          TikTok analytics &amp; creator growth dashboard
        </div>
      </div>
    ),
    { ...size }
  );
}
