Project is build with Vite
--------------------------
More info: https://vitejs.dev/guide/

npm create vite@latest
Need to install the following packages:
  create-vite@4.3.1
Ok to proceed? (y) y
√ Project name: ... ./
√ Package name: ... ai-summarizer
√ Select a framework: » React
√ Select a variant: » JavaScript

Install Redux Toolkit
---------------------
npm install @reduxjs/toolkit

Install Tailwind CSS with Vite
------------------------------
https://tailwindcss.com/docs/guides/vite

npm install -D tailwindcss postcss autoprefixer

npx tailwindcss init -p

Created Tailwind CSS config file: tailwind.config.js
Created PostCSS config file: postcss.config.js

Configure your template paths
Add the paths to all of your template files in your tailwind.config.js file:
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

Install react-redux
--------------------
npm install react-redux

Run the Application
-------------------
npm run dev

Hero.jsx
--------
Contains the heading, description and the logo.

Demo.jsx
--------
Conains the summarizer input bar and functinality.

Build for production
---------------------
npm run build

Host the app online
------------------
app.netlify.com

App hosted at : https://deft-platypus-6c4687.netlify.app/