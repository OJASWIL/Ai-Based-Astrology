// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      animation: {
        'css': 'css 1s ease-in-out infinite',
      },
      keyframes: {
        css: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        }
      }
    }
  }
}