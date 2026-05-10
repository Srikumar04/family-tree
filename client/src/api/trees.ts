import api from './client';
import type { Tree } from 'shared';

export const treesApi = {
  list: () =>
    api.get<Tree[]>('/api/trees').then(r => r.data),

  create: (name: string) =>
    api.post<Tree>('/api/trees', { name }).then(r => r.data),

  delete: (id: number) =>
    api.delete(`/api/trees/${id}`),

  generateShareToken: (id: number) =>
    api.post<{ shareToken: string }>(`/api/trees/${id}/share`).then(r => r.data),
};
