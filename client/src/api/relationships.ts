import api from './client';
import type { Relationship } from 'shared';
import type { CreateRelationshipInput } from 'shared';

export const relationshipsApi = {
  list: (treeId: number) =>
    api.get<Relationship[]>(`/api/trees/${treeId}/relationships`).then(r => r.data),

  create: (treeId: number, data: CreateRelationshipInput) =>
    api.post<Relationship>(`/api/trees/${treeId}/relationships`, data).then(r => r.data),

  delete: (treeId: number, relId: number) =>
    api.delete(`/api/trees/${treeId}/relationships/${relId}`),
};
