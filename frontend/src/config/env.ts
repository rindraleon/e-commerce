declare global {
  interface Window {
    __APP_CONFIG__?: {
      apiBaseUrl?: string;
      apiPrefix?: string;
      siteUrl?: string;
    };
  }
}

const runtimeConfig =
  typeof window !== 'undefined' ? window.__APP_CONFIG__ || {} : {};

export const env = {
  apiBaseUrl:
    runtimeConfig.apiBaseUrl ||
    (import.meta.env.VITE_API_BASE_URL as string) ||
    'http://localhost:3000',
  apiPrefix:
    runtimeConfig.apiPrefix || (import.meta.env.VITE_API_PREFIX as string) || '',
  siteUrl:
    runtimeConfig.siteUrl ||
    (import.meta.env.VITE_SITE_URL as string) ||
    'http://localhost:8080',
};
