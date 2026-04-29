/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'gb-case': '#D1D5D8',       // Color del plástico de la consola
        'gb-screen': '#8BAC0F',     // Verde claro de la pantalla
        'gb-screen-dark': '#0F380F',// Verde oscuro (píxeles)
        'gb-red': '#990000',        // Botón A/B
        'pokemon-yellow': '#FFDE00',
        'pokemon-blue': '#3B4CCA',
      },
      fontFamily: {
        'retro': ['PokemonGB', 'monospace'],
      }
    },
  },
  plugins: [],
}