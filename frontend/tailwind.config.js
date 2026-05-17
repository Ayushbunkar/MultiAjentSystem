/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
        sans:  ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        bg:    '#0c0e16',
        bg2:   '#12151f',
        sur:   '#161a2b',
        sur2:  '#1c2130',
        bdr:   'rgba(200,205,225,0.08)',
        sage:  '#8faa94',
        lav:   '#9d93bf',
        rose:  '#bf9898',
        sky:   '#85adbf',
        wheat: '#c4ad8e',
        txt:   '#d8dce8',
        txt2:  '#8890a8',
        txt3:  '#4a5068',
      },
      boxShadow: {
        card: '0 8px 32px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.03) inset',
        sm:   '0 2px 12px rgba(0,0,0,0.35)',
      },
      borderRadius: { xl2: '16px' },
      animation: {
        blink: 'blink 1.2s ease-in-out infinite',
        spin:  'spin 0.8s linear infinite',
      },
      keyframes: {
        blink: { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.3 } },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
