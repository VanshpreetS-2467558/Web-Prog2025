import { text } from 'express';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./views/**/*.ejs",
    "./public/**/*.html"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

