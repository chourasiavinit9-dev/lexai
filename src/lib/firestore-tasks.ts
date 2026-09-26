// Firestore task manager — runs in the browser (client-side)
// Data model:
//   /tasks/{userId}/items/{taskId}
//
// Collections:
//   /sessions/{userId}/analyses/{id}  — Understand / Clarify / Compare results
//   /sessions/{userId}/chats/{id}     — Chat conversation history
//   /sessions/{userId}/scans/{id}     — OCR document scans
//   /sessions/{userId}/tasks/{id}     — Legal task checklist items

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp,
  type Timestamp,
  type Unsubscribe,
  type DocumentData,
} from 'firebase/firestore';
import { getDb, ensureAnonymousAuth } from './firebase-client';

// ─── Shared types ──────────────────────────────────────────
export interface FirestoreTimestamped {
  id: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

// ── Legal Task (checklist item) ─────────────────────────────
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'flagged';
export type TaskPriority = 'low' | 'normal' | 'high' | 'critical';

export interface LegalTask extends FirestoreTimestamped {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: 'review' | 'verify' | 'negotiate' | 'sign' | 'consult' | 'other';
  relatedClause?: string;
  dueDate?: string;
  legalRef?: string;
  notes?: string;
  completedAt?: Timestamp | null;
}

// ── Analysis record ─────────────────────────────────────────
export interface AnalysisRecord extends FirestoreTimestamped {
  type: 'understand' | 'clarify' | 'compare' | 'navigate' | 'ocr';
  documentSnippet: string; // first 200 chars of doc
  overallRisk?: string;
  documentType?: string;
  summary?: string;
}

// ── Chat session ────────────────────────────────────────────
export interface ChatSession extends FirestoreTimestamped {
  title: string; // first user message (truncated)
  messageCount: number;
  lastMessage: string;
  lastRole: 'user' | 'assistant';
}

// ── OCR scan record ─────────────────────────────────────────
export interface ScanRecord extends FirestoreTimestamped {
  documentType: string;
  summary: string;
  refCount: number;
  verifiedCount: number;
  ocrConfidence: string;
}

// ─── Helper: get user collection path ──────────────────────
async function userPath(sub: string): Promise<string> {
  const user = await ensureAnonymousAuth();
  return `sessions/${user.uid}/${sub}`;
}

// ═══════════════════════════════════════════════════════════
// LEGAL TASKS
// ═══════════════════════════════════════════════════════════

export async function addTask(
  task: Omit<LegalTask, 'id' | 'createdAt' | 'updatedAt' | 'completedAt'>
): Promise<string> {
  const db = getDb();
  const path = await userPath('tasks');
  const ref = await addDoc(collection(db, path), {
    ...task,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    completedAt: null,
  });
  return ref.id;
}

export async function updateTask(id: string, updates: Partial<LegalTask>): Promise<void> {
  const db = getDb();
  const path = await userPath('tasks');
  await updateDoc(doc(db, path, id), {
    ...updates,
    updatedAt: serverTimestamp(),
    ...(updates.status === 'done' ? { completedAt: serverTimestamp() } : {}),
  });
}

export async function deleteTask(id: string): Promise<void> {
  const db = getDb();
  const path = await userPath('tasks');
  await deleteDoc(doc(db, path, id));
}

export function subscribeToTasks(
  callback: (tasks: LegalTask[]) => void
): Promise<Unsubscribe> {
  return (async () => {
    const db = getDb();
    const path = await userPath('tasks');
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
      const tasks = snap.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<LegalTask, 'id'>),
      }));
      callback(tasks);
    });
  })();
}

export async function getAllTasks(): Promise<LegalTask[]> {
  const db = getDb();
  const path = await userPath('tasks');
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<LegalTask, 'id'>) }));
}

// ═══════════════════════════════════════════════════════════
// ANALYSIS HISTORY
// ═══════════════════════════════════════════════════════════

export async function saveAnalysis(
  record: Omit<AnalysisRecord, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const db = getDb();
  const path = await userPath('analyses');
  const ref = await addDoc(collection(db, path), {
    ...record,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getRecentAnalyses(count = 10): Promise<AnalysisRecord[]> {
  const db = getDb();
  const path = await userPath('analyses');
  const q = query(collection(db, path), orderBy('createdAt', 'desc'), limit(count));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<AnalysisRecord, 'id'>) }));
}

// ═══════════════════════════════════════════════════════════
// CHAT HISTORY
// ═══════════════════════════════════════════════════════════

export async function saveChatSession(
  record: Omit<ChatSession, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const db = getDb();
  const path = await userPath('chats');
  const ref = await addDoc(collection(db, path), {
    ...record,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getRecentChats(count = 10): Promise<ChatSession[]> {
  const db = getDb();
  const path = await userPath('chats');
  const q = query(collection(db, path), orderBy('createdAt', 'desc'), limit(count));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<ChatSession, 'id'>) }));
}

// ═══════════════════════════════════════════════════════════
// OCR SCAN HISTORY
// ═══════════════════════════════════════════════════════════

export async function saveScan(
  record: Omit<ScanRecord, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const db = getDb();
  const path = await userPath('scans');
  const ref = await addDoc(collection(db, path), {
    ...record,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getRecentScans(count = 10): Promise<ScanRecord[]> {
  const db = getDb();
  const path = await userPath('scans');
  const q = query(collection(db, path), orderBy('createdAt', 'desc'), limit(count));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<ScanRecord, 'id'>) }));
}

// ─── utility: safe DocumentData coerce (avoid any) ─────────
export function castDoc<T>(data: DocumentData): T {
  return data as unknown as T;
}
