import api from './client';
import type { PublicTreeData } from 'shared';

export const shareApi = {
  getPublicTree: (token: string) =>
    api.get<PublicTreeData>(`/api/share/${token}`).then(r => r.data),
};
