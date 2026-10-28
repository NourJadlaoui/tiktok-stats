import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 8,
          background: 'linear-gradient(135deg, #25F4EE, #FE2C55)'
        }}
      >
        <span style={{ color: 'white', fontSize: 20, fontWeight: 800, fontFamily: 'sans-serif' }}>N</span>
      </div>
    ),
    { ...size }
  );
}
