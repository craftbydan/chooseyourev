import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/** Public site URL for OG / canonical (set VITE_SITE_ORIGIN on Vercel to your domain). */
const DEFAULT_SITE_ORIGIN = 'https://ev.craftbydan.com';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const origin = (env.VITE_SITE_ORIGIN || DEFAULT_SITE_ORIGIN).replace(/\/$/, '');
  const canonical = `${origin}/`;
  const ogImage = `${origin}/og-image.png`;

  return {
    plugins: [
      react(),
      {
        name: 'inject-site-meta',
        transformIndexHtml(html) {
          return html
            .replace(/__SITE_CANONICAL__/g, canonical)
            .replace(/__OG_IMAGE__/g, ogImage);
        },
      },
    ],
  };
});
