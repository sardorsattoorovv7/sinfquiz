import {defineConfig} from 'vite';
export default defineConfig({server:{host:process.env.VITE_HOST||'0.0.0.0'}});
