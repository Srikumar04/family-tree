import { useTreeStore } from '../store/treeStore';
import { useUiStore } from '../store/uiStore';
import toast from 'react-hot-toast';
import type { CreatePersonInput, UpdatePersonInput, CreateRelationshipInput } from 'shared';

export const useTree = (treeId: number) => {
  const store = useTreeStore();
  const { setAddPersonOpen, setAddRelationshipOpen } = useUiStore();

  const addPerson = async (data: CreatePersonInput) => {
    const person = await store.addPerson(treeId, data);
    toast.success(`${person.firstName} added to the tree`);
    setAddPersonOpen(false);
    return person;
  };

  const updatePerson = async (personId: number, data: UpdatePersonInput) => {
    const person = await store.updatePerson(treeId, personId, data);
    toast.success('Person updated');
    return person;
  };

  const deletePerson = async (personId: number) => {
    await store.deletePerson(treeId, personId);
    toast.success('Person removed');
  };

  const addRelationship = async (data: CreateRelationshipInput) => {
    const rel = await store.addRelationship(treeId, data);
    toast.success('Relationship added');
    setAddRelationshipOpen(false);
    return rel;
  };

  const deleteRelationship = async (relId: number) => {
    await store.deleteRelationship(treeId, relId);
    toast.success('Relationship removed');
  };

  const shareTree = async () => {
    const token = await store.generateShareToken(treeId);
    const url = `${window.location.origin}/share/${token}`;
    await navigator.clipboard.writeText(url);
    toast.success('Share link copied to clipboard!');
  };

  return {
    persons: store.persons,
    relationships: store.relationships,
    selectedPersonId: store.selectedPersonId,
    selectPerson: store.selectPerson,
    addPerson,
    updatePerson,
    deletePerson,
    addRelationship,
    deleteRelationship,
    shareTree,
  };
};
