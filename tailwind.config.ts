import type { Config } from 'tailwindcss';
import colors from 'tailwindcss/colors';
import typography from '@tailwindcss/typography';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // The site's single interactive accent (focus rings, active links,
        // hover borders) — anchored on brand-600 = the same TikTok pink
        // already used everywhere else (active tab, CTAs, verdict links),
        // so focus/hover states read as "the same brand color", not an
        // unrelated one. Previously brand-600 was hardcoded to the TikTok
        // cyan while the rest of the scale was an unrelated pink-to-teal
        // ramp that nothing ever referenced — every usage in the codebase
        // only ever reads brand-600, so this scale now exists to give that
        // one color sensible lighter/darker neighbors if a future component
        // needs them, not because the other shades are used today.
        brand: {
          50: '#fff1f3',
          100: '#ffe1e6',
          200: '#fecdd6',
          300: '#fda4b4',
          400: '#fb7797',
          500: '#f43f72',
          600: '#FE2C55',
          700: '#c81f44',
          800: '#9f1a3b',
          900: '#811a35'
        },
        tiktok: {
          cyan: '#25F4EE',
          pink: '#FE2C55',
          black: '#010101'
        },
        // Semantic aliases for status colors — components can reach for
        // `success`/`warning`/`danger`/`info` instead of picking a raw
        // Tailwind hue (emerald vs green, red vs rose, ...) each time,
        // which is what caused the only real cross-component inconsistency
        // found in the color audit (one spot used `green`, everywhere else
        // used `emerald` for the same "success" meaning). These map to the
        // hues already dominant across the app, not new colors.
        success: colors.emerald,
        warning: colors.amber,
        danger: colors.red,
        info: colors.cyan
      },
      borderRadius: {
        xl2: '1.25rem'
      }
    }
  },
  plugins: [typography]
};

export default config;
