import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useTreeStore } from '../store/treeStore';
import { useUiStore } from '../store/uiStore';
import TreeCanvas from '../components/Tree/TreeCanvas';
import PersonPanel from '../components/Person/PersonPanel';
import PersonForm from '../components/Person/PersonForm';
import Modal from '../components/UI/Modal';
import Button from '../components/UI/Button';
import EmptyState from '../components/UI/EmptyState';
import { SkeletonCard } from '../components/UI/Skeleton';
import toast from 'react-hot-toast';
import type { CreatePersonInput, CreateRelationshipInput } from 'shared';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

function AddRelationshipForm({ persons, treeId, onClose }: { persons: { id: number; firstName: string; lastName: string }[]; treeId: number; onClose: () => void }) {
  const { addRelationship } = useTreeStore();
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');
  const [type, setType] = useState<'parent-child' | 'spouse' | 'sibling'>('parent-child');
  const [saving, setSaving] = useState(false);

  const handle = async () => {
    if (!p1 || !p2) { toast.error('Select both people'); return; }
    if (p1 === p2) { toast.error('Select two different people'); return; }
    setSaving(true);
    try {
      await addRelationship(treeId, { person1Id: parseInt(p1), person2Id: parseInt(p2), type } as CreateRelationshipInput);
      toast.success('Relationship added');
      onClose();
    } catch (e: unknown) {
      const axiosErr = e as { response?: { data?: { error?: string } } };
      toast.error(axiosErr.response?.data?.error ?? 'Failed to add relationship');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="label">Relationship type</label>
        <select className="input" value={type} onChange={e => setType(e.target.value as typeof type)}>
          <option value="parent-child">Parent → Child (Person 1 is parent)</option>
          <option value="spouse">Spouse</option>
          <option value="sibling">Sibling</option>
        </select>
      </div>
      <div>
        <label className="label">Person 1</label>
        <select className="input" value={p1} onChange={e => setP1(e.target.value)}>
          <option value="">Select…</option>
          {persons.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Person 2</label>
        <select className="input" value={p2} onChange={e => setP2(e.target.value)}>
          <option value="">Select…</option>
          {persons.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
        </select>
      </div>
      <div className="flex gap-3 justify-end">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={handle} disabled={saving}>{saving ? 'Adding…' : 'Add'}</Button>
      </div>
    </div>
  );
}

export default function TreeView() {
  const { id } = useParams<{ id: string }>();
  const treeId = parseInt(id ?? '0');
  const canvasRef = useRef<HTMLDivElement>(null);

  const { trees, persons, relationships, selectedPersonId, isLoading, setActiveTree, addPerson, generateShareToken, selectPerson } = useTreeStore();
  const { theme, toggleTheme, searchQuery, setSearchQuery, isAddPersonOpen, setAddPersonOpen, isAddRelationshipOpen, setAddRelationshipOpen } = useUiStore();

  const activeTree = trees.find(t => t.id === treeId);
  const selectedPerson = persons.find(p => p.id === selectedPersonId) ?? null;

  useEffect(() => {
    if (treeId) setActiveTree(treeId);
  }, [treeId, setActiveTree]);

  const handleAddPerson = async (data: CreatePersonInput) => {
    await addPerson(treeId, data);
    toast.success(`${data.firstName} added`);
    setAddPersonOpen(false);
  };

  const handleExportPng = async () => {
    if (!canvasRef.current) return;
    const canvas = await html2canvas(canvasRef.current, { backgroundColor: '#F5F0E8', scale: 1.5 });
    const a = document.createElement('a');
    a.download = `${activeTree?.name ?? 'family-tree'}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
    toast.success('PNG exported');
  };

  const handleExportPdf = async () => {
    if (!canvasRef.current) return;
    const canvas = await html2canvas(canvasRef.current, { backgroundColor: '#F5F0E8', scale: 1.5 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width, canvas.height] });
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(`${activeTree?.name ?? 'family-tree'}.pdf`);
    toast.success('PDF exported');
  };

  const handleShare = async () => {
    const token = await generateShareToken(treeId);
    const url = `${window.location.origin}/share/${token}`;
    await navigator.clipboard.writeText(url);
    toast.success('Share link copied!');
  };

  return (
    <div className="h-screen flex flex-col bg-[var(--color-bg)]">
      {/* Toolbar */}
      <header className="flex-shrink-0 border-b border-[var(--color-border)] px-4 py-2 flex items-center gap-3 flex-wrap">
        <Link to="/dashboard" className="text-forest dark:text-gold font-body text-sm hover:underline flex items-center gap-1">
          ← Dashboard
        </Link>
        <h1 className="font-heading text-lg text-[var(--color-text)] mr-2">{activeTree?.name ?? '…'}</h1>
        <div className="flex-1" />
        <input
          className="input w-40 text-sm py-1"
          placeholder="Search…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        <Button size="sm" onClick={() => setAddPersonOpen(true)}>+ Person</Button>
        <Button size="sm" variant="secondary" onClick={() => setAddRelationshipOpen(true)}>+ Relationship</Button>
        <Button size="sm" variant="ghost" onClick={handleExportPng} title="Export PNG">⬇ PNG</Button>
        <Button size="sm" variant="ghost" onClick={handleExportPdf} title="Export PDF">⬇ PDF</Button>
        <Button size="sm" variant="ghost" onClick={handleShare} title="Share">🔗 Share</Button>
        <button onClick={toggleTheme} className="text-xl" title="Toggle theme">{theme === 'light' ? '🌙' : '☀️'}</button>
      </header>

      {/* Main area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Tree canvas area */}
        <div ref={canvasRef} className="flex-1 relative overflow-hidden">
          {isLoading ? (
            <div className="p-8 grid grid-cols-2 gap-4">
              {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : persons.length === 0 ? (
            <EmptyState
              title="Your tree is empty"
              description="Add your first family member to begin building your tree."
              action={{ label: '+ Add first person', onClick: () => setAddPersonOpen(true) }}
            />
          ) : (
            <TreeCanvas
              persons={persons}
              relationships={relationships}
              selectedPersonId={selectedPersonId}
              searchQuery={searchQuery}
              onSelectPerson={selectPerson}
            />
          )}
        </div>

        {/* Side panel */}
        <AnimatePresence>
          {selectedPerson && (
            <div className="w-80 flex-shrink-0 h-full">
              <PersonPanel
                person={selectedPerson}
                treeId={treeId}
                relationships={relationships}
                persons={persons}
                onClose={() => selectPerson(null)}
              />
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <Modal open={isAddPersonOpen} onClose={() => setAddPersonOpen(false)} title="Add Person">
        <PersonForm onSubmit={handleAddPerson} onCancel={() => setAddPersonOpen(false)} submitLabel="Add Person" />
      </Modal>

      <Modal open={isAddRelationshipOpen} onClose={() => setAddRelationshipOpen(false)} title="Add Relationship">
        <AddRelationshipForm persons={persons} treeId={treeId} onClose={() => setAddRelationshipOpen(false)} />
      </Modal>
    </div>
  );
}
