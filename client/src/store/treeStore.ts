import { create } from 'zustand';
import { treesApi } from '../api/trees';
import { personsApi } from '../api/persons';
import { relationshipsApi } from '../api/relationships';
import type { Tree, Person, Relationship } from 'shared';
import type { CreatePersonInput, UpdatePersonInput, CreateRelationshipInput } from 'shared';

interface TreeState {
  trees: Tree[];
  activeTreeId: number | null;
  persons: Person[];
  relationships: Relationship[];
  selectedPersonId: number | null;
  isLoading: boolean;

  fetchTrees: () => Promise<void>;
  createTree: (name: string) => Promise<Tree>;
  deleteTree: (id: number) => Promise<void>;
  setActiveTree: (id: number) => Promise<void>;

  fetchPersons: (treeId: number) => Promise<void>;
  addPerson: (treeId: number, data: CreatePersonInput) => Promise<Person>;
  updatePerson: (treeId: number, personId: number, data: UpdatePersonInput) => Promise<Person>;
  deletePerson: (treeId: number, personId: number) => Promise<void>;

  fetchRelationships: (treeId: number) => Promise<void>;
  addRelationship: (treeId: number, data: CreateRelationshipInput) => Promise<Relationship>;
  deleteRelationship: (treeId: number, relId: number) => Promise<void>;

  selectPerson: (id: number | null) => void;
  generateShareToken: (treeId: number) => Promise<string>;
}

export const useTreeStore = create<TreeState>((set, get) => ({
  trees: [],
  activeTreeId: null,
  persons: [],
  relationships: [],
  selectedPersonId: null,
  isLoading: false,

  fetchTrees: async () => {
    set({ isLoading: true });
    const trees = await treesApi.list();
    set({ trees, isLoading: false });
  },

  createTree: async (name) => {
    const tree = await treesApi.create(name);
    set(s => ({ trees: [tree, ...s.trees] }));
    return tree;
  },

  deleteTree: async (id) => {
    await treesApi.delete(id);
    set(s => ({ trees: s.trees.filter(t => t.id !== id) }));
  },

  setActiveTree: async (id) => {
    set({ activeTreeId: id, isLoading: true, persons: [], relationships: [], selectedPersonId: null });
    const [persons, relationships] = await Promise.all([
      personsApi.list(id),
      relationshipsApi.list(id),
    ]);
    set({ persons, relationships, isLoading: false });
  },

  fetchPersons: async (treeId) => {
    const persons = await personsApi.list(treeId);
    set({ persons });
  },

  addPerson: async (treeId, data) => {
    const person = await personsApi.create(treeId, data);
    set(s => ({ persons: [...s.persons, person] }));
    return person;
  },

  updatePerson: async (treeId, personId, data) => {
    const person = await personsApi.update(treeId, personId, data);
    set(s => ({ persons: s.persons.map(p => p.id === personId ? person : p) }));
    return person;
  },

  deletePerson: async (treeId, personId) => {
    await personsApi.delete(treeId, personId);
    set(s => ({
      persons: s.persons.filter(p => p.id !== personId),
      relationships: s.relationships.filter(r => r.person1Id !== personId && r.person2Id !== personId),
      selectedPersonId: s.selectedPersonId === personId ? null : s.selectedPersonId,
    }));
  },

  fetchRelationships: async (treeId) => {
    const relationships = await relationshipsApi.list(treeId);
    set({ relationships });
  },

  addRelationship: async (treeId, data) => {
    const rel = await relationshipsApi.create(treeId, data);
    set(s => ({ relationships: [...s.relationships, rel] }));
    return rel;
  },

  deleteRelationship: async (treeId, relId) => {
    await relationshipsApi.delete(treeId, relId);
    set(s => ({ relationships: s.relationships.filter(r => r.id !== relId) }));
  },

  selectPerson: (id) => set({ selectedPersonId: id }),

  generateShareToken: async (treeId) => {
    const { shareToken } = await treesApi.generateShareToken(treeId);
    set(s => ({
      trees: s.trees.map(t => t.id === treeId ? { ...t, shareToken } : t),
    }));
    return shareToken;
  },
}));
