import React, { useState, useMemo, useEffect, useRef } from 'react';
import { filterExercises, inferLevel, getDayCount } from '../filterExercises';
import { LEVEL_COLORS, capitalize, getExerciseImageUrl, formatCategoryLabel, CATEGORY_COLORS } from '../utils/helpers';
import { generatePlan } from '../services/geminiService';
import { GOAL_OPTIONS, TARGET_AREA_OPTIONS } from './Wizard/WizardSteps';
import LoadingScreen from './LoadingScreen';
import ExerciseRow from './ExerciseRow';
import PickExerciseModal from './PickExerciseModal';

export default function PlanPage({ exercises, prefs, savedPlan, setSavedPlan, onReset, onStartSession }) {
  const [activeDay, setActiveDay] = useState(0);
  const [showAddPicker, setShowAddPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(!savedPlan);
  const [planError, setPlanError] = useState(null);
  const [isReordering, setIsReordering] = useState(false);

  const dragItem = useRef();
  const dragOverItem = useRef();

  const handleDragStart = (e, position) => {
    dragItem.current = position;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
    }
    
    const targetNode = e.currentTarget;
    setTimeout(() => {
      if (targetNode && targetNode.style) {
        targetNode.style.opacity = '0.4';
      }
    }, 0);
  };

  const handleDragEnter = (e, position) => {
    dragOverItem.current = position;
  };

  const handleDragEnd = (e) => {
    if (e.currentTarget && e.currentTarget.style) {
      e.currentTarget.style.opacity = '1';
    }
    
    const fromIdx = dragItem.current;
    const toIdx = dragOverItem.current;

    if (
      typeof fromIdx === 'number' && 
      typeof toIdx === 'number' && 
      fromIdx !== toIdx
    ) {
      setSavedPlan((prev) => {
        if (!prev || !prev[activeDay]) return prev;
        
        const next = [...prev];
        const dayExercises = [...next[activeDay].exercises];
        
        if (
          fromIdx >= 0 && fromIdx < dayExercises.length && 
          toIdx >= 0 && toIdx < dayExercises.length
        ) {
          const [movedItem] = dayExercises.splice(fromIdx, 1);
          if (movedItem) {
            dayExercises.splice(toIdx, 0, movedItem);
          }
          
          next[activeDay] = { 
            ...next[activeDay], 
            exercises: dayExercises.filter(Boolean) 
          };
        }
        return next;
      });
    }
    
    dragItem.current = undefined;
    dragOverItem.current = undefined;
  };

  const { level, score } = inferLevel(prefs.frequency, prefs.duration);

  const filtered = useMemo(
    () => filterExercises(exercises, { level, equipmentLabels: prefs.equipment, injuries: prefs.injuries }),
    [exercises, level, prefs.equipment, prefs.injuries]
  );

  
  useEffect(() => {
    if (savedPlan) return;
    let cancelled = false;
    async function fetchPlan() {
      setIsLoading(true);
      setPlanError(null);
      try {
        const planResult = await generatePlan({ ...prefs, level, score }, filtered);
        if (!cancelled) setSavedPlan(planResult);
      } catch (err) {
        if (!cancelled) setPlanError(err.message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    if (filtered.length > 0) fetchPlan();
    else setIsLoading(false);
    return () => { cancelled = true; };
  }, [filtered, prefs, level, score, savedPlan, setSavedPlan]);

  const currentDay = savedPlan ? (savedPlan[activeDay] ?? savedPlan[0]) : null;
  const dayCount = getDayCount(prefs.frequency);

  function handleShuffle(dayIdx, exIdx) {
    setSavedPlan((prev) => {
      const next = prev.map((d) => ({ ...d, exercises: [...d.exercises] }));
      const day = next[dayIdx];
      const current = day.exercises[exIdx];
      
      const usedIds = new Set(day.exercises.map((e) => e.id));
      const candidates = filtered.filter(
        (e) => e.category === current.category && !usedIds.has(e.id)
      );
      if (candidates.length === 0) return prev; 
      const replacement = candidates[Math.floor(Math.random() * candidates.length)];
      day.exercises[exIdx] = {
        ...replacement,
        sets: current.sets,
        reps: current.reps,
        durationSeconds: current.durationSeconds,
        restSeconds: current.restSeconds,
        note: `Focus on controlled movement throughout.`,
      };
      return next;
    });
  }

  function handleDelete(dayIdx, exIdx) {
    setSavedPlan((prev) => {
      const next = prev.map((d) => ({ ...d, exercises: [...d.exercises] }));
      next[dayIdx].exercises.splice(exIdx, 1);
      return next;
    });
  }

  function handlePick(dayIdx, exIdx, newExercise) {
    setSavedPlan((prev) => {
      const next = prev.map((d) => ({ ...d, exercises: [...d.exercises] }));
      const day = next[dayIdx];
      const current = day.exercises[exIdx];
      day.exercises[exIdx] = {
        ...newExercise,
        sets: current.sets,
        reps: current.reps,
        durationSeconds: current.durationSeconds,
        restSeconds: current.restSeconds,
        note: `Focus on controlled movement throughout.`,
      };
      return next;
    });
  }

  function handleAdd(dayIdx, newExercise) {
    setSavedPlan((prev) => {
      const next = prev.map((d) => ({ ...d, exercises: [...d.exercises] }));
      const day = next[dayIdx];
      day.exercises.push({
        ...newExercise,
        sets: 3,
        reps: 10,
        durationSeconds: null,
        restSeconds: 60,
        note: `Focus on controlled movement throughout.`,
      });
      return next;
    });
  }

  if (isLoading) return <LoadingScreen />;

  if (planError) {
    return (
      <div className="plan-page animate-fade-in">
        <div className="results-empty" style={{ marginTop: '80px' }}>
          <div className="error-icon" style={{ fontSize: '3rem', marginBottom: '16px' }}>!</div>
          <h3>Plan Generation Failed</h3>
          <p style={{ maxWidth: '400px', margin: '0 auto', color: 'var(--text-secondary)' }}>{planError}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()} style={{ marginTop: '24px' }}>
            Retry Generation
          </button>
          <button className="btn btn-ghost" onClick={onReset} style={{ marginTop: '12px', display: 'block', margin: '12px auto 0' }}>
            ← Change Preferences
          </button>
        </div>
      </div>
    );
  }

  const goalLabel = GOAL_OPTIONS.find((o) => o.key === prefs.goal)?.label || '';
  const areaLabels = prefs.targetAreas?.map((k) => TARGET_AREA_OPTIONS.find((o) => o.key === k)?.label).filter(Boolean) || [];

  if (!savedPlan || savedPlan.length === 0) {
    return (
      <div className="plan-page animate-fade-in">
        <div className="results-empty" style={{ marginTop: '80px' }}>
          <h3>No exercises matched your preferences</h3>
          <p>Try adjusting your equipment or injury settings.</p>
          <button className="btn btn-secondary" onClick={onReset} style={{ marginTop: '12px' }}>← Change Preferences</button>
        </div>
      </div>
    );
  }

  return (
    <div className="plan-page animate-fade-in">

      {}
      <div className="plan-banner">
        <div className="plan-banner-inner">
          <div>
            <h1 className="plan-title">Your Custom Plan</h1>
            <div className="plan-meta">
              <span className={`badge ${LEVEL_COLORS[level] || 'badge-gray'}`}>{capitalize(level)}</span>
              <span className="plan-meta-dot">·</span>
              <span className="badge badge-gray" style={{ background: 'transparent', border: '1px solid var(--border-subtle)' }}>
                Level: {score}/10
              </span>
              {goalLabel && <><span className="plan-meta-dot">·</span><span>{goalLabel}</span></>}
              {areaLabels.length > 0 && <><span className="plan-meta-dot">·</span><span>{areaLabels.join(', ')}</span></>}
              <span className="plan-meta-dot">·</span>
              <span>{dayCount} day{dayCount !== 1 ? 's' : ''}/week</span>
            </div>
          </div>
          <button id="reset-preferences-btn" className="btn btn-secondary" onClick={onReset} aria-label="Change preferences">
            ← Change Preferences
          </button>
        </div>
      </div>

      {}
      <div className="plan-tabs-wrap">
        <div className="plan-tabs" role="tablist" aria-label="Workout days">
          {savedPlan.map((day, i) => (
            <button
              key={day.key}
              id={`day-tab-${i}`}
              role="tab"
              aria-selected={activeDay === i}
              aria-controls={`day-panel-${i}`}
              className={`plan-tab${activeDay === i ? ' active' : ''}`}
              onClick={() => setActiveDay(i)}
            >
              <span className="plan-tab-inner">
                <span className="plan-tab-day">
                  Day {day.dayNumber}
                  {day.completed && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{color: 'var(--accent-primary)', marginLeft: '6px'}}><polyline points="20 6 9 17 4 12"></polyline></svg>
                  )}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {}
      {currentDay && (
        <div id={`day-panel-${activeDay}`} className="plan-day-content" role="tabpanel" aria-labelledby={`day-tab-${activeDay}`}>
          <div className="plan-day-header">
            <div className="plan-day-header-text">
              <h2 className="plan-day-title">Day {currentDay.dayNumber} - {currentDay.label}</h2>
              <p className="plan-day-focus">{currentDay.focus}</p>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span className="badge badge-gray">{currentDay.exercises.length} exercises</span>
              <button 
                className="btn btn-sm btn-ghost" 
                onClick={() => setIsReordering(!isReordering)}
                style={{ color: isReordering ? 'var(--accent-primary)' : 'var(--text-secondary)' }}
              >
                {isReordering ? 'Done Editing' : 'Edit Order'}
              </button>
              <button 
                className="btn btn-sm btn-ghost" 
                onClick={() => setShowAddPicker(true)}
              >
                + Add Exercise
              </button>
            </div>
          </div>

          {}
          {currentDay.exercises.length === 0 ? (
            <div className="results-empty" style={{ padding: '40px 0' }}>
              <p>No exercises left. Go back to add more.</p>
            </div>
          ) : (
            <div className="ex-list animate-fade-up">
              {currentDay.exercises.filter(Boolean).map((ex, exIdx) => {
                if (!ex) return null;
                return (
                  <ExerciseRow
                    key={`${ex.id}-${exIdx}`}
                    exercise={ex}
                    index={exIdx}
                    filteredPool={filtered}
                    onShuffle={() => handleShuffle(activeDay, exIdx)}
                    onDelete={() => handleDelete(activeDay, exIdx)}
                    onPick={(newEx) => handlePick(activeDay, exIdx, newEx)}
                    isReordering={isReordering}
                    onDragStart={isReordering ? handleDragStart : undefined}
                    onDragEnter={isReordering ? handleDragEnter : undefined}
                    onDragEnd={isReordering ? handleDragEnd : undefined}
                  />
                );
              })}
            </div>
          )}

          {}
          {currentDay.exercises.length > 0 && !currentDay.completed && (
            <div className="start-workout-wrap">
              <button
                id="start-workout-btn"
                className="btn btn-lg btn-primary start-workout-btn"
                onClick={() => onStartSession(currentDay)}
              >
                Start Today's Workout
              </button>
            </div>
          )}
          {currentDay.exercises.length > 0 && currentDay.completed && (
            <div className="start-workout-wrap">
              <span className="badge badge-gray" style={{ padding: '8px 16px', fontSize: '0.95rem' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}><polyline points="20 6 9 17 4 12"></polyline></svg>
                Workout Completed
              </span>
            </div>
          )}

          {}
          {showAddPicker && (
            <PickExerciseModal
              allExercises={filtered}
              currentId={null}
              onPick={(ex) => { handleAdd(activeDay, ex); setShowAddPicker(false); }}
              onClose={() => setShowAddPicker(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}
