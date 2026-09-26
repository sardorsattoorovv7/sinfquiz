import {defineConfig} from 'vite';
export default defineConfig({
 server:{host:process.env.VITE_HOST||'0.0.0.0'},
 build:{
  chunkSizeWarningLimit:650,
  rolldownOptions:{output:{codeSplitting:{groups:[
   {name:'supabase',test:/node_modules[\\/]@supabase/,priority:30},
   {name:'react',test:/node_modules[\\/](react|react-dom|scheduler)/,priority:20},
   {name:'icons',test:/node_modules[\\/]lucide-react/,priority:15},
  ]}}},
 },
});
