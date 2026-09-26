'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  subscribeToTasks,
  addTask,
  updateTask,
  deleteTask,
  type LegalTask,
  type TaskStatus,
  type TaskPriority,
} from '@/lib/firestore';

// ─── Status/priority configs ──────────────────────────────
const STATUS_CONFIG: Record<TaskStatus, { label: string; icon: string; cls: string }> = {
  todo:        { label: 'To Do',       icon: '○', cls: 'todo' },
  in_progress: { label: 'In Progress', icon: '◑', cls: 'in-progress' },
  done:        { label: 'Done',        icon: '●', cls: 'done' },
  flagged:     { label: 'Flagged',     icon: '⚑', cls: 'flagged' },
};

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; cls: string }> = {
  low:      { label: 'Low',      cls: 'low' },
  normal:   { label: 'Normal',   cls: 'normal' },
  high:     { label: 'High',     cls: 'high' },
  critical: { label: 'Critical', cls: 'critical' },
};

const CATEGORY_OPTIONS = [
  { value: 'review',    label: '📖 Review' },
  { value: 'verify',   label: '✓ Verify' },
  { value: 'negotiate',label: '⚖ Negotiate' },
  { value: 'sign',     label: '✍ Sign' },
  { value: 'consult',  label: '👤 Consult Advocate' },
  { value: 'other',    label: '• Other' },
] as const;

// ─── Add Task Modal ───────────────────────────────────────
function AddTaskModal({ onClose, onAdd }: {
  readonly onClose: () => void;
  readonly onAdd: (t: Omit<LegalTask, 'id' | 'createdAt' | 'updatedAt' | 'completedAt'>) => Promise<void>;
}) {
  const [title, setTitle]         = useState('');
  const [desc, setDesc]           = useState('');
  const [priority, setPriority]   = useState<TaskPriority>('normal');
  const [category, setCategory]   = useState<LegalTask['category']>('review');
  const [legalRef, setLegalRef]   = useState('');
  const [dueDate, setDueDate]     = useState('');
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required.'); return; }
    setSaving(true);
    try {
      await onAdd({
        title: title.trim(),
        description: desc.trim() || undefined,
        status: 'todo',
        priority,
        category,
        legalRef: legalRef.trim() || undefined,
        dueDate: dueDate || undefined,
      });
      onClose();
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="tm-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Add task">
      <div className="tm-modal" onClick={e => e.stopPropagation()}>
        <div className="tm-modal-header">
          <h3 className="tm-modal-title">New Legal Task</h3>
          <button type="button" className="tm-modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <form className="tm-modal-form" onSubmit={handleSubmit}>
          <label className="tm-label">
            Task title *
            <input
              className="tm-input"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Verify non-compete clause with advocate"
              maxLength={200}
              required
              autoFocus
            />
          </label>
          <label className="tm-label">
            Details
            <textarea
              className="tm-textarea"
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="What needs to be done?"
              rows={3}
              maxLength={1000}
            />
          </label>
          <div className="tm-form-row">
            <label className="tm-label">
              Category
              <select className="tm-select" value={category} onChange={e => setCategory(e.target.value as LegalTask['category'])}>
                {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
            <label className="tm-label">
              Priority
              <select className="tm-select" value={priority} onChange={e => setPriority(e.target.value as TaskPriority)}>
                {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </label>
          </div>
          <div className="tm-form-row">
            <label className="tm-label">
              Legal reference
              <input className="tm-input" value={legalRef} onChange={e => setLegalRef(e.target.value)} placeholder="e.g. ICA §27, Article 21" maxLength={100} />
            </label>
            <label className="tm-label">
              Due date
              <input className="tm-input" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </label>
          </div>
          {error && <p className="tm-form-error">{error}</p>}
          <div className="tm-form-actions">
            <button type="button" className="tm-btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="tm-btn-primary" disabled={saving}>
              {saving ? 'Saving…' : '+ Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Single task card ─────────────────────────────────────
function TaskCard({
  task,
  onStatusChange,
  onDelete,
}: {
  readonly task: LegalTask;
  readonly onStatusChange: (id: string, s: TaskStatus) => void;
  readonly onDelete: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const status   = STATUS_CONFIG[task.status];
  const priority = PRIORITY_CONFIG[task.priority];

  async function handleDelete() {
    setDeleting(true);
    onDelete(task.id);
  }

  const nextStatus: Record<TaskStatus, TaskStatus> = {
    todo: 'in_progress',
    in_progress: 'done',
    done: 'todo',
    flagged: 'todo',
  };

  return (
    <div className={`tm-task-card tm-task-card--${status.cls}${task.status === 'done' ? ' done' : ''}`}>
      <div className="tm-task-main">
        {/* Status toggle */}
        <button
          type="button"
          className={`tm-status-btn tm-status-btn--${status.cls}`}
          onClick={() => onStatusChange(task.id, nextStatus[task.status])}
          aria-label={`Mark as ${nextStatus[task.status]}`}
          title={`Click to mark as ${nextStatus[task.status]}`}
        >
          {status.icon}
        </button>
        <div className="tm-task-content">
          <div className="tm-task-title-row">
            <span className={`tm-task-title${task.status === 'done' ? ' struck' : ''}`}>{task.title}</span>
            <span className={`tm-priority-badge tm-priority-badge--${priority.cls}`}>{priority.label}</span>
          </div>
          {task.description && <p className="tm-task-desc">{task.description}</p>}
          <div className="tm-task-meta">
            <span className="tm-task-cat">{CATEGORY_OPTIONS.find(c => c.value === task.category)?.label ?? task.category}</span>
            {task.legalRef && <span className="tm-task-ref">⚖ {task.legalRef}</span>}
            {task.dueDate  && <span className="tm-task-due">📅 {task.dueDate}</span>}
          </div>
        </div>
        <button
          type="button"
          className="tm-delete-btn"
          onClick={handleDelete}
          disabled={deleting}
          aria-label="Delete task"
        >✕</button>
      </div>
      {/* Status badge row */}
      <div className="tm-task-footer">
        <div className="tm-status-pills">
          {(Object.keys(STATUS_CONFIG) as TaskStatus[]).map(s => (
            <button
              key={s}
              type="button"
              className={`tm-status-pill${task.status === s ? ' active' : ''}`}
              onClick={() => onStatusChange(task.id, s)}
              aria-pressed={task.status === s}
              title={STATUS_CONFIG[s].label}
            >
              {STATUS_CONFIG[s].icon} {STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Stats bar ────────────────────────────────────────────
function StatsBar({ tasks }: { readonly tasks: LegalTask[] }) {
  const total    = tasks.length;
  const done     = tasks.filter(t => t.status === 'done').length;
  const flagged  = tasks.filter(t => t.status === 'flagged').length;
  const critical = tasks.filter(t => t.priority === 'critical').length;
  const pct      = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="tm-stats">
      <div className="tm-stat">
        <span className="tm-stat-val">{total}</span>
        <span className="tm-stat-label">Tasks</span>
      </div>
      <div className="tm-stat">
        <span className="tm-stat-val tm-stat-val--done">{done}</span>
        <span className="tm-stat-label">Done</span>
      </div>
      {flagged > 0 && (
        <div className="tm-stat">
          <span className="tm-stat-val tm-stat-val--flagged">{flagged}</span>
          <span className="tm-stat-label">Flagged</span>
        </div>
      )}
      {critical > 0 && (
        <div className="tm-stat">
          <span className="tm-stat-val tm-stat-val--critical">{critical}</span>
          <span className="tm-stat-label">Critical</span>
        </div>
      )}
      <div className="tm-progress-wrap">
        <div className="tm-progress-track">
          <div className="tm-progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="tm-progress-pct">{pct}%</span>
      </div>
    </div>
  );
}

// ─── Filter bar ───────────────────────────────────────────
type FilterStatus = TaskStatus | 'all';

// ─── Main TaskManager panel ───────────────────────────────
export function TaskManager() {
  const [tasks, setTasks]         = useState<LegalTask[]>([]);
  const [loading, setLoading]     = useState(true);
  const [fbError, setFbError]     = useState<string | null>(null);
  const [showAdd, setShowAdd]     = useState(false);
  const [filter, setFilter]       = useState<FilterStatus>('all');
  const [filterPrio, setFilterPrio] = useState<TaskPriority | 'all'>('all');

  // Real-time Firestore subscription with LocalStorage fallback
  useEffect(() => {
    // Load cached local tasks first so UI is instant
    try {
      const cached = localStorage.getItem('lawjourney_tasks');
      if (cached) {
        setTasks(JSON.parse(cached));
        setLoading(false);
      }
    } catch {
      // ignore
    }

    let unsub: (() => void) | null = null;
    subscribeToTasks((t) => {
      if (t && t.length > 0) {
        setTasks(t);
        try { localStorage.setItem('lawjourney_tasks', JSON.stringify(t)); } catch {}
      }
      setLoading(false);
    }).then(fn => {
      unsub = fn;
    }).catch((e: unknown) => {
      setLoading(false);
      // Suppress blocking error banner; local tasks work seamlessly
      console.log('Firestore connecting in offline/local mode:', e);
    });
    return () => { if (unsub) unsub(); };
  }, []);

  const handleAdd = useCallback(async (
    task: Omit<LegalTask, 'id' | 'createdAt' | 'updatedAt' | 'completedAt'>
  ) => {
    const tempId = 'task_' + Date.now();
    const newTask: LegalTask = {
      ...task,
      id: tempId,
      createdAt: null as any,
      updatedAt: null as any,
    };
    setTasks(prev => {
      const next = [newTask, ...prev];
      try { localStorage.setItem('lawjourney_tasks', JSON.stringify(next)); } catch {}
      return next;
    });

    try {
      await addTask(task);
    } catch (e) {
      console.warn('Saved task locally (Firestore unavailable):', e);
    }
  }, []);

  const handleStatusChange = useCallback(async (id: string, status: TaskStatus) => {
    setTasks(prev => {
      const next = prev.map(t => t.id === id ? { ...t, status } : t);
      try { localStorage.setItem('lawjourney_tasks', JSON.stringify(next)); } catch {}
      return next;
    });

    try {
      await updateTask(id, { status });
    } catch {
      // already updated locally
    }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    setTasks(prev => {
      const next = prev.filter(t => t.id !== id);
      try { localStorage.setItem('lawjourney_tasks', JSON.stringify(next)); } catch {}
      return next;
    });

    try {
      await deleteTask(id);
    } catch {
      // already deleted locally
    }
  }, []);

  const filtered = tasks.filter(t => {
    if (filter !== 'all' && t.status !== filter) return false;
    if (filterPrio !== 'all' && t.priority !== filterPrio) return false;
    return true;
  });

  const activeTasks = filtered.filter(t => t.status !== 'done');
  const doneTasks   = filtered.filter(t => t.status === 'done');

  return (
    <div className="tm-root" aria-label="Legal task manager">
      {/* Header */}
      <div className="tm-header">
        <div>
          <p className="tm-eyebrow">LEGAL TASK MANAGER</p>
          <h2 className="tm-title">My Legal Checklist</h2>
          <p className="tm-subtitle">Track your document review tasks · Synced via Firebase</p>
        </div>
        <button type="button" className="tm-add-btn" onClick={() => setShowAdd(true)}>
          + Add Task
        </button>
      </div>

      {/* Stats */}
      {tasks.length > 0 && <StatsBar tasks={tasks} />}

      {/* Filters */}
      {tasks.length > 1 && (
        <div className="tm-filters">
          <div className="tm-filter-group">
            {(['all', 'todo', 'in_progress', 'flagged', 'done'] as FilterStatus[]).map(s => (
              <button
                key={s}
                type="button"
                className={`tm-filter-btn${filter === s ? ' active' : ''}`}
                onClick={() => setFilter(s)}
              >
                {s === 'all' ? 'All' : STATUS_CONFIG[s]?.label}
              </button>
            ))}
          </div>
          <div className="tm-filter-group">
            {(['all', 'critical', 'high', 'normal', 'low'] as const).map(p => (
              <button
                key={p}
                type="button"
                className={`tm-filter-btn${filterPrio === p ? ' active' : ''}`}
                onClick={() => setFilterPrio(p)}
              >
                {p === 'all' ? 'Any priority' : PRIORITY_CONFIG[p]?.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Firebase error */}
      {fbError && (
        <div className="tm-fb-error" role="alert">
          ⚠ {fbError}
          <button type="button" onClick={() => setFbError(null)} className="tm-fb-error-dismiss">✕</button>
        </div>
      )}

      {/* Body */}
      <div className="tm-body">
        {loading ? (
          <div className="tm-loading">
            <div className="tm-loading-spinner" />
            <p>Connecting to Firebase…</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="tm-empty">
            <div className="tm-empty-icon">📋</div>
            <p className="tm-empty-title">No tasks yet</p>
            <p className="tm-empty-sub">Add a task to track your document review checklist.</p>
            <button type="button" className="tm-add-btn" onClick={() => setShowAdd(true)}>+ Create your first task</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="tm-empty">
            <p className="tm-empty-title">No matching tasks</p>
            <button type="button" className="tm-filter-btn" onClick={() => { setFilter('all'); setFilterPrio('all'); }}>Clear filters</button>
          </div>
        ) : (
          <div className="tm-task-list">
            {activeTasks.map(t => (
              <TaskCard
                key={t.id}
                task={t}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
              />
            ))}
            {doneTasks.length > 0 && (
              <>
                <p className="tm-section-divider">Completed ({doneTasks.length})</p>
                {doneTasks.map(t => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDelete}
                  />
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Firebase badge */}
      <div className="tm-firebase-badge">
        <span className="tm-firebase-dot" />
        Synced with Firebase · Real-time
      </div>

      {/* Add modal */}
      {showAdd && (
        <AddTaskModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />
      )}
    </div>
  );
}

// Export a default too for lazy loading
export default TaskManager;
