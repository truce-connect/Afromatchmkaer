let inMemoryToken: string | null = null;

export const setInMemoryToken = (token: string | null): void => {
  inMemoryToken = token;
};

export const getInMemoryToken = (): string | null => inMemoryToken;

// Rewrites localhost upload URLs to the production backend URL.
// Fixes images stored in MongoDB when uploaded from a local dev environment.
const PROD_API = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/api$/, '') ?? '';

export const resolveImageUrl = (url?: string | null): string | undefined => {
  if (!url) return undefined;
  if (PROD_API && url.startsWith('http://localhost')) {
    return url.replace(/^http:\/\/localhost:\d+/, PROD_API);
  }
  return url;
};
