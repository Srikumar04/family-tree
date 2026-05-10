export interface User {
  id: number;
  email: string;
  createdAt: string;
}

export interface Tree {
  id: number;
  name: string;
  ownerId: number;
  shareToken: string | null;
  createdAt: string;
}

export interface Person {
  id: number;
  treeId: number;
  firstName: string;
  lastName: string;
  birthDate: string | null;
  deathDate: string | null;
  gender: 'male' | 'female' | 'unknown';
  bio: string | null;
  photoUrl: string | null;
}

export interface Relationship {
  id: number;
  treeId: number;
  person1Id: number;
  person2Id: number;
  type: 'parent-child' | 'spouse' | 'sibling';
}

export interface PublicTreeData {
  tree: Tree;
  persons: Person[];
  relationships: Relationship[];
}
