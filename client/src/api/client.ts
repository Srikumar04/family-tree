import axios from 'axios';

// In production Express serves the client, so API is same-origin.
// In dev the server is on :3001.
const baseURL = import.meta.env.PROD ? '' : 'http://localhost:3001';

const api = axios.create({
  baseURL,
  withCredentials: true,
});

export default api;
