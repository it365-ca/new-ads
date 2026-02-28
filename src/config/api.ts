// Configuration de l'API backend
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:4000/api' : `${window.location.origin}/api`),
  UPLOAD_URL: import.meta.env.VITE_UPLOAD_URL || (window.location.hostname === 'localhost' ? 'http://localhost:4000/uploads' : `${window.location.origin}/uploads`)
};
