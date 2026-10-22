import { defineConfig, loadEnv } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json';

export default defineConfig(({ mode }) => {
  // Load environment variables from .env
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [crx({ manifest })],
    define: {
      'process.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || ''),
      'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || '')
    },
    build: {
      target: 'esnext',
      rollupOptions: {
        input: {
          sidepanel: 'src/sidepanel/sidepanel.html'
        }
      }
    }
  };
});