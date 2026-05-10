import api from './client';
import type { User } from 'shared';

export const authApi = {
  register: (email: string, password: string) =>
    api.post<{ user: User }>('/api/auth/register', { email, password }).then(r => r.data),

  login: (email: string, password: string) =>
    api.post<{ user: User }>('/api/auth/login', { email, password }).then(r => r.data),

  logout: () =>
    api.post('/api/auth/logout').then(r => r.data),

  me: () =>
    api.get<{ user: User }>('/api/auth/me').then(r => r.data),
};
