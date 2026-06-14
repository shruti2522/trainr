import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { capitalize, formatCategoryLabel } from '../../utils/helpers';

export default function PickExerciseModal({ allExercises, currentId, onPick, onClose }) {
  const [query, setQuery] = useState('');

  const grouped = useMemo(() => {
    const q = query.toLowerCase();
    const filtered = allExercises.filter(
      (ex) =>
        ex.id !== currentId &&
        (ex.name.toLowerCase().includes(q) ||
          (ex.primaryMuscles || []).some((m) => m.toLowerCase().includes(q)) ||
          (ex.category || '').toLowerCase().includes(q))
    );
    return filtered.reduce((acc, ex) => {
      const cat = ex.category || 'other';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(ex);
      return acc;
    }, {});
  }, [allExercises, currentId, query]);

  const modalContent = (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content pick-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Pick an Exercise</h3>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="pick-modal-search">
          <input
            className="form-input"
            type="search"
            placeholder="Search by name or muscle…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>
        <div className="pick-modal-body">
          {Object.entries(grouped).map(([cat, exs]) => (
            <div key={cat} className="pick-modal-group">
              <p className="pick-modal-group-label">{formatCategoryLabel(cat)}</p>
              {exs.map((ex) => (
                <button
                  key={ex.id}
                  className="pick-modal-item"
                  onClick={() => onPick(ex)}
                >
                  <span className="pick-modal-item-name">{ex.name}</span>
                  <span className="pick-modal-item-muscles">
                    {(ex.primaryMuscles || []).map(capitalize).join(', ')}
                  </span>
                </button>
              ))}
            </div>
          ))}
          {Object.keys(grouped).length === 0 && (
            <p style={{ padding: '24px', color: 'var(--text-muted)', textAlign: 'center' }}>No exercises found.</p>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
