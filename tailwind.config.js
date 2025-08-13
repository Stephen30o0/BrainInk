export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './quiz/src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: "#00a8ff",
        secondary: "#00ffaa",
        tertiary: "#ff00aa",
        dark: "#0a0a1a",
        light: "#f0f0ff",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
      },
      animation: {
        'float': 'float 15s ease-in-out infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'glitch': 'glitch 500ms infinite'
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        'neon': '0 0 5px #00a8ff, 0 0 10px #00a8ff',
        'neon-green': '0 0 5px #00ffaa, 0 0 10px #00ffaa',
        'neon-pink': '0 0 5px #ff00aa, 0 0 10px #ff00aa',
      }
    },
  },
  plugins: [],
}