import {defineConfig,loadEnv} from 'vite';
import {localAdminApi} from './local-admin-api.js';
export default defineConfig(({mode})=>{
 const env=loadEnv(mode,process.cwd(),'');
 for(const name of ['VITE_SUPABASE_URL','SUPABASE_SECRET_KEY','SUPABASE_SERVICE_ROLE_KEY']){
  if(!process.env[name]&&env[name])process.env[name]=env[name];
 }
 return {
 plugins:[localAdminApi()],
 server:{host:process.env.VITE_HOST||'0.0.0.0',strictPort:true},
 build:{
  chunkSizeWarningLimit:650,
  rolldownOptions:{output:{codeSplitting:{groups:[
   {name:'supabase',test:/node_modules[\\/]@supabase/,priority:30},
   {name:'react',test:/node_modules[\\/](react|react-dom|scheduler)/,priority:20},
   {name:'icons',test:/node_modules[\\/]lucide-react/,priority:15},
  ]}}},
 },
 }; 
});
