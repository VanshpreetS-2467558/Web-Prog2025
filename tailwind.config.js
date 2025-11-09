import { text } from 'express';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./views/**/*.ejs",
    "./public/**/*.html"
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradientkleurBR' : "linear-gradient(to bottom right, #3b82f6, #a855f7, #ec4899)", // blauw-500 - paars-500 - roze-500
        'gradientkleurR' : "linear-gradient(to right, #3b82f6, #a855f7, #ec4899)", // blauw-500 - paars-500 - roze-500
        'gradientAchtergrond': 'linear-gradient(to bottom right, #fbcfe8, transparent, #a78bfa)', // roze-300 - transparent - paars-300
        'gradientkleurSmallText' : 'linear-gradient(to bottom right, #ec4899, #8b5cf6)', // pink-500 , purple-500
      }
    },
  },
  plugins: [],
}

