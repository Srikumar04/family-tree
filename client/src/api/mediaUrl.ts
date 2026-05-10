// Returns the correct base URL for uploaded media (photos).
// Empty string in production (same-origin); localhost:3001 in dev.
export const mediaBase = import.meta.env.PROD ? '' : 'http://localhost:3001';
