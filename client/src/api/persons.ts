import api from './client';
import type { Person } from 'shared';
import type { CreatePersonInput, UpdatePersonInput } from 'shared';

export const personsApi = {
  list: (treeId: number) =>
    api.get<Person[]>(`/api/trees/${treeId}/persons`).then(r => r.data),

  create: (treeId: number, data: CreatePersonInput) =>
    api.post<Person>(`/api/trees/${treeId}/persons`, data).then(r => r.data),

  update: (treeId: number, personId: number, data: UpdatePersonInput) =>
    api.put<Person>(`/api/trees/${treeId}/persons/${personId}`, data).then(r => r.data),

  delete: (treeId: number, personId: number) =>
    api.delete(`/api/trees/${treeId}/persons/${personId}`),

  uploadPhoto: (file: File) => {
    const form = new FormData();
    form.append('photo', file);
    return api.post<{ photoUrl: string }>('/api/upload/photo', form).then(r => r.data);
  },
};
