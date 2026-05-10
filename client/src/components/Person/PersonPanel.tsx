import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTreeStore } from '../../store/treeStore';
import { mediaBase } from '../../api/mediaUrl';
import PersonForm from './PersonForm';
import PersonCard from './PersonCard';
import Button from '../UI/Button';
import Modal from '../UI/Modal';
import toast from 'react-hot-toast';
import type { Person, Relationship } from 'shared';
import type { CreatePersonInput } from 'shared';

interface Props {
  person: Person;
  treeId: number;
  relationships: Relationship[];
  persons: Person[];
  onClose: () => void;
}

function RelSection({ label, items, persons, onSelect }: { label: string; items: Person[]; persons: Person[]; onSelect: (id: number) => void }) {
  if (items.length === 0) return null;
  return (
    <div>
      <h4 className="font-body text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-2">{label}</h4>
      <div className="space-y-1">
        {items.map(p => <PersonCard key={p.id} person={p} onClick={() => onSelect(p.id)} compact />)}
      </div>
    </div>
  );
}

export default function PersonPanel({ person, treeId, relationships, persons, onClose }: Props) {
  const { updatePerson, deletePerson, selectPerson } = useTreeStore();
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const personMap = new Map(persons.map(p => [p.id, p]));

  const parents = relationships
    .filter(r => r.type === 'parent-child' && r.person2Id === person.id)
    .map(r => personMap.get(r.person1Id)).filter(Boolean) as Person[];

  const children = relationships
    .filter(r => r.type === 'parent-child' && r.person1Id === person.id)
    .map(r => personMap.get(r.person2Id)).filter(Boolean) as Person[];

  const spouses = relationships
    .filter(r => r.type === 'spouse' && (r.person1Id === person.id || r.person2Id === person.id))
    .map(r => personMap.get(r.person1Id === person.id ? r.person2Id : r.person1Id)).filter(Boolean) as Person[];

  const siblings = relationships
    .filter(r => r.type === 'sibling' && (r.person1Id === person.id || r.person2Id === person.id))
    .map(r => personMap.get(r.person1Id === person.id ? r.person2Id : r.person1Id)).filter(Boolean) as Person[];

  const handleUpdate = async (data: CreatePersonInput) => {
    try {
      await updatePerson(treeId, person.id, data);
      toast.success('Person updated');
      setIsEditing(false);
    } catch {
      toast.error('Update failed');
    }
  };

  const handleDelete = async () => {
    try {
      await deletePerson(treeId, person.id);
      toast.success(`${person.firstName} removed`);
      onClose();
    } catch {
      toast.error('Delete failed');
    }
  };

  const GENDER_COLORS = { male: '#3D6B20', female: '#be123c', unknown: '#C9A84C' };

  return (
    <>
      <motion.div
        className="h-full flex flex-col bg-[var(--color-bg)] border-l border-[var(--color-border)] shadow-xl overflow-y-auto"
        initial={{ x: 320 }} animate={{ x: 0 }} exit={{ x: 320 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: GENDER_COLORS[person.gender], overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 18 }}>
              {person.photoUrl
                ? <img src={`${mediaBase}${person.photoUrl}`} alt="" className="w-full h-full object-cover" />
                : `${person.firstName[0]}${person.lastName[0]}`}
            </div>
            <div>
              <h2 className="font-heading text-lg text-[var(--color-text)]">{person.firstName} {person.lastName}</h2>
              <p className="font-body text-xs text-[var(--color-text-muted)] capitalize">{person.gender}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] text-2xl leading-none mt-1">&times;</button>
        </div>

        <div className="flex-1 p-4 space-y-5 overflow-y-auto">
          {!isEditing ? (
            <>
              {/* Details */}
              <div className="space-y-2">
                {person.birthDate && (
                  <div className="flex gap-2 font-body text-sm">
                    <span className="text-[var(--color-text-muted)] w-16">Born</span>
                    <span>{new Date(person.birthDate).toLocaleDateString()}</span>
                  </div>
                )}
                {person.deathDate && (
                  <div className="flex gap-2 font-body text-sm">
                    <span className="text-[var(--color-text-muted)] w-16">Died</span>
                    <span>{new Date(person.deathDate).toLocaleDateString()}</span>
                  </div>
                )}
                {person.bio && (
                  <p className="font-body text-sm text-[var(--color-text)] leading-relaxed pt-1">{person.bio}</p>
                )}
              </div>

              {/* Relationships */}
              <div className="space-y-4">
                <RelSection label="Parents" items={parents} persons={persons} onSelect={id => selectPerson(id)} />
                <RelSection label="Spouses" items={spouses} persons={persons} onSelect={id => selectPerson(id)} />
                <RelSection label="Children" items={children} persons={persons} onSelect={id => selectPerson(id)} />
                <RelSection label="Siblings" items={siblings} persons={persons} onSelect={id => selectPerson(id)} />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="secondary" onClick={() => setIsEditing(true)}>Edit</Button>
                <Button size="sm" variant="danger" onClick={() => setConfirmDelete(true)}>Delete</Button>
              </div>
            </>
          ) : (
            <PersonForm
              initial={person}
              onSubmit={handleUpdate}
              onCancel={() => setIsEditing(false)}
              submitLabel="Update"
            />
          )}
        </div>
      </motion.div>

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete Person">
        <p className="font-body text-[var(--color-text)] mb-6">
          Remove <strong>{person.firstName} {person.lastName}</strong> from the tree? All their relationships will also be removed.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setConfirmDelete(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </>
  );
}
