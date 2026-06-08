import React, { useState } from 'react';
import { capitalize, getExerciseImageUrl, formatCategoryLabel, CATEGORY_COLORS } from '../utils/helpers';
import PickExerciseModal from './PickExerciseModal';

export default function ExerciseRow({ exercise, index, filteredPool, onShuffle, onDelete, onPick, isReordering, onDragStart, onDragEnter, onDragEnd }) {
  const [showPicker, setShowPicker] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [imgError, setImgError] = useState(false);
  
  if (!exercise) return null;
  
  const imageUrl = exercise.images?.[0] ? getExerciseImageUrl(exercise.images[0]) : null;
  const categoryClass = CATEGORY_COLORS[exercise.category] || 'badge-gray';

  const effort = exercise.durationSeconds
    ? `${exercise.sets} sets × ${exercise.durationSeconds}s`
    : exercise.sets
    ? `${exercise.sets} sets × ${exercise.reps} reps`
    : null;

  return (
    <>
      <div 
        className={`ex-row ${isReordering ? 'ex-row-reordering' : ''}`}
        draggable={isReordering}
        onDragStart={(e) => onDragStart && onDragStart(e, index)}
        onDragEnter={(e) => onDragEnter && onDragEnter(e, index)}
        onDragEnd={onDragEnd}
        onDragOver={(e) => e.preventDefault()}
        style={{ cursor: isReordering ? 'grab' : 'default' }}
      >
        {isReordering ? (
          <div className="ex-row-drag-handle" style={{ color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', width: '28px', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </div>
        ) : (
          <span className="ex-row-num">{index + 1}</span>
        )}

        <div className="ex-row-thumb">
          {imageUrl && !imgError ? (
            <img src={imageUrl} alt={exercise.name} onError={() => setImgError(true)} loading="lazy" />
          ) : (
            <div className="ex-row-thumb-fallback" />
          )}
        </div>

        <div className="ex-row-info">
          <span className="ex-row-name">{exercise.name}</span>
          <div className="ex-row-meta">
            {effort && <span className="prescription-effort">{effort}</span>}
            {exercise.restSeconds && (
              <span className="prescription-rest">Rest {exercise.restSeconds}s</span>
            )}
            <span className={`badge ${categoryClass}`} style={{ fontSize: '0.72rem' }}>
              {formatCategoryLabel(exercise.category)}
            </span>
          </div>
          {exercise.note && <p className="ex-row-note">{exercise.note}</p>}
          {exercise.instructions && exercise.instructions.length > 0 && (
            <button 
              className="view-instructions-btn" 
              onClick={() => setShowInstructions(true)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '6px'}}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
              View Instructions
            </button>
          )}
        </div>

        <div className="ex-row-actions">
          <button
            className="ex-action-btn"
            title="Shuffle - swap with a random similar exercise"
            onClick={onShuffle}
            aria-label="Shuffle exercise"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 3 21 3 21 8"></polyline><line x1="4" y1="20" x2="21" y2="3"></line><polyline points="21 16 21 21 16 21"></polyline><line x1="15" y1="15" x2="21" y2="21"></line><line x1="4" y1="4" x2="9" y2="9"></line></svg>
          </button>
          <button
            className="ex-action-btn"
            title="Pick - choose a specific exercise"
            onClick={() => setShowPicker(true)}
            aria-label="Pick exercise"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
          <button
            className="ex-action-btn ex-action-btn--danger"
            title="Remove this exercise"
            onClick={onDelete}
            aria-label="Delete exercise"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      </div>

      {showPicker && (
        <PickExerciseModal
          allExercises={filteredPool}
          currentId={exercise.id}
          onPick={(ex) => { onPick(ex); setShowPicker(false); }}
          onClose={() => setShowPicker(false)}
        />
      )}

      {showInstructions && (
        <div className="modal-overlay" onClick={() => setShowInstructions(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{exercise.name} Instructions</h3>
              <button className="modal-close-btn" onClick={() => setShowInstructions(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              <ol className="instructions-list">
                {exercise.instructions.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
