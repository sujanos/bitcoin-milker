export const BACKEND_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3000';

export const APP_ID = import.meta.env.VITE_APP_ID;
export const APP_VERSION = import.meta.env.VITE_APP_VERSION;
export const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI || window.location.origin;
export const CONSENT_PAGE_BASE =
  import.meta.env.VITE_CONSENT_PAGE_BASE_URL || `https://dashboard.heyvincent.ai`;
export const CONSENT_PAGE_DCA_URL = `${CONSENT_PAGE_BASE}/${APP_ID}/consent?redirectUri=${REDIRECT_URI}`;
