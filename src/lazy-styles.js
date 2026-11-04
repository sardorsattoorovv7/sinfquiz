// Wait for a view's styles before revealing it. Vite caches these modules, so
// returning to a page reuses the styles without another download or a flash.
export const loadLegacyStyles=()=>Promise.all([import('./styles.css'),import('./theme.css')]);
export const loadStudyStyles=()=>Promise.all([loadLegacyStyles(),import('./practice.css'),import('./course.css')]);
export const loadAdminStyles=()=>Promise.all([loadStudyStyles(),import('./admin-overrides.css')]);
export const afterStyles=(load,styles)=>()=>Promise.all([styles(),load()]).then(([,module])=>module);
