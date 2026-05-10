import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useTreeStore } from '../store/treeStore';
import { useUiStore } from '../store/uiStore';
import { SkeletonTreeCard } from '../components/UI/Skeleton';
import EmptyState from '../components/UI/EmptyState';
import Button from '../components/UI/Button';
import Modal from '../components/UI/Modal';
import toast from 'react-hot-toast';
import type { Tree } from 'shared';

function TreeCard({ tree, onOpen, onDelete }: { tree: Tree; onOpen: () => void; onDelete: () => void }) {
  return (
    <motion.div
      className="card hover:shadow-md cursor-pointer group"
      whileHover={{ y: -2 }}
      onClick={onOpen}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-heading text-lg text-forest dark:text-gold">{tree.name}</h3>
          <p className="font-body text-sm text-[var(--color-text-muted)] mt-1">
            Created {new Date(tree.createdAt).toLocaleDateString()}
          </p>
          {tree.shareToken && (
            <span className="inline-block mt-2 text-xs bg-gold/20 text-bark rounded-full px-2 py-0.5 font-body">
              Shared
            </span>
          )}
        </div>
        <span className="text-3xl">🌳</span>
      </div>
      <div className="flex gap-2 mt-4">
        <Button size="sm" onClick={e => { e.stopPropagation(); onOpen(); }}>Open</Button>
        <Button size="sm" variant="danger" onClick={e => { e.stopPropagation(); onDelete(); }}>Delete</Button>
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const { logout } = useAuthStore();
  const { trees, isLoading, fetchTrees, createTree, deleteTree } = useTreeStore();
  const { toggleTheme, theme } = useUiStore();
  const navigate = useNavigate();
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => { fetchTrees(); }, [fetchTrees]);

  const handleCreate = async () => {
    if (!newName.trim()) { toast.error('Please enter a tree name'); return; }
    setCreating(true);
    try {
      const tree = await createTree(newName.trim());
      setShowNew(false);
      setNewName('');
      navigate(`/trees/${tree.id}`);
    } catch {
      toast.error('Failed to create tree');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await deleteTree(id);
      toast.success('Tree deleted');
    } catch {
      toast.error('Failed to delete tree');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <motion.div
      className="min-h-screen bg-[var(--color-bg)]"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <header className="border-b border-[var(--color-border)] px-6 py-4 flex items-center justify-between">
        <h1 className="font-heading text-2xl text-forest dark:text-gold">🌳 Family Tree</h1>
        <div className="flex items-center gap-3">
          <span className="font-body text-sm text-[var(--color-text-muted)] hidden sm:block">{user?.email}</span>
          <button onClick={toggleTheme} className="text-xl" title="Toggle theme">
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <Button variant="secondary" size="sm" onClick={handleLogout}>Sign out</Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-heading text-3xl text-[var(--color-text)]">My Family Trees</h2>
          <Button onClick={() => setShowNew(true)}>+ New Tree</Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <SkeletonTreeCard key={i} />)}
          </div>
        ) : trees.length === 0 ? (
          <EmptyState
            title="No family trees yet"
            description="Create your first family tree to begin preserving your family's history."
            action={{ label: '+ Create your first tree', onClick: () => setShowNew(true) }}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {trees.map(tree => (
              <TreeCard
                key={tree.id}
                tree={tree}
                onOpen={() => navigate(`/trees/${tree.id}`)}
                onDelete={() => handleDelete(tree.id, tree.name)}
              />
            ))}
          </div>
        )}
      </main>

      <Modal open={showNew} onClose={() => setShowNew(false)} title="New Family Tree">
        <div className="space-y-4">
          <div>
            <label className="label">Tree name</label>
            <input
              className="input"
              placeholder="e.g. The Smith Family"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? 'Creating…' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
