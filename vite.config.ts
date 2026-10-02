import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

// GitHub Pages では https://<user>.github.io/kikkake-map/ で配信される
export default defineConfig({
  base: '/kikkake-map/',
  plugins: [preact()],
});
