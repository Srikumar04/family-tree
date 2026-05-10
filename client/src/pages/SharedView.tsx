import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { shareApi } from '../api/share';
import TreeCanvas from '../components/Tree/TreeCanvas';
import PersonPanel from '../components/Person/PersonPanel';
import EmptyState from '../components/UI/EmptyState';
import type { PublicTreeData } from 'shared';

export default function SharedView() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<PublicTreeData | null>(null);
  const [error, setError] = useState('');
  const [selectedPersonId, setSelectedPersonId] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;
    shareApi.getPublicTree(token)
      .then(setData)
      .catch(() => setError('This shared tree could not be found.'));
  }, [token]);

  const selectedPerson = data?.persons.find(p => p.id === selectedPersonId) ?? null;

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <EmptyState title="Tree not found" description={error} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <div className="font-heading text-2xl text-forest animate-pulse">Loading…</div>
      </div>
    );
  }

  return (
    <motion.div
      className="h-screen flex flex-col bg-[var(--color-bg)]"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
    >
      <header className="flex-shrink-0 border-b border-[var(--color-border)] px-6 py-3 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl text-forest dark:text-gold">{data.tree.name}</h1>
          <p className="font-body text-xs text-[var(--color-text-muted)]">Shared family tree · read only</p>
        </div>
        <Link
          to="/register"
          className="btn-primary text-sm inline-flex items-center gap-2"
        >
          🌳 Create your own tree
        </Link>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 relative overflow-hidden">
          <TreeCanvas
            persons={data.persons}
            relationships={data.relationships}
            selectedPersonId={selectedPersonId}
            searchQuery=""
            onSelectPerson={setSelectedPersonId}
          />
        </div>
        <AnimatePresence>
          {selectedPerson && (
            <div className="w-80 flex-shrink-0 h-full">
              <PersonPanel
                person={selectedPerson}
                treeId={data.tree.id}
                relationships={data.relationships}
                persons={data.persons}
                onClose={() => setSelectedPersonId(null)}
              />
            </div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
