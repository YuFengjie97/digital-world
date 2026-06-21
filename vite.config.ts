import { defineConfig, loadEnv } from 'vite';
import path from 'path';

export default defineConfig(({ mode }) => {

  const env = loadEnv(mode, process.cwd(), '');
  const base = env.VITE_BASE_URL

  console.log('🧊 env', env.NODE_ENV);
  console.log('🧠 base', env.VITE_BASE_URL);

  return {
    base,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      }
    }
  }
});