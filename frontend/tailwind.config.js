/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans:  ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        bg:    'var(--bg)',
        bg2:   'var(--bg2)',
        sur:   'var(--sur)',
        sur2:  'var(--sur2)',
        bdr:   'var(--bdr)',
        sage:  'var(--sage)',
        lav:   'var(--lav)',
        rose:  'var(--rose)',
        sky:   'var(--sky)',
        wheat: 'var(--wheat)',
        txt:   'var(--txt)',
        txt2:  'var(--txt2)',
        txt3:  'var(--txt3)',
      },
      boxShadow: {
        card: '0 12px 40px rgba(167, 171, 219, 0.12), 0 1px 0 rgba(255,255,255,0.8) inset, 0 1px 2px rgba(167, 171, 219, 0.05)',
        sm:   '0 4px 16px rgba(167, 171, 219, 0.08)',
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
