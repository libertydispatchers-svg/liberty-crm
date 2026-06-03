// Central configuration for the Liberty Dispatchers app
export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://libertydispatch.xyz');
export const IS_PRODUCTION = process.env.NODE_ENV === 'production';
