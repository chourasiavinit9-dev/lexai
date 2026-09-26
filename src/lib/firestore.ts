// Full Firestore service — lawjourney-ai-2026
// Architecture: users/{userId}/{conversations|documents|savedClauses|analyses}
// Files go to Cloud Storage (storagePath only stored here)

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
  increment,
  type Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { getDb, ensureAnonymousAuth } from './firebase-client';

// ─── Re-export Timestamp for consumers ───────────────────
export type { Timestamp };

// ═══════════════════════════════════════════════════════════
// SHARED HELPERS
// ═══════════════════════════════════════════════════════════

async function uid(): Promise<string> {
  const user = await ensureAnonymousAuth();
  return user.uid;
}

function col(userId: string, sub: string) {
  return collection(getDb(), 'users', userId, sub);
}
function subCol(userId: string, sub: string, id: string, sub2: string) {
  return collection(getDb(), 'users', userId, sub, id, sub2);
}

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

// ── Conversations ────────────────────────────────────────
export interface Conversation {
  id: string;
  title: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  model: string;
  documentId?: string;
  messageCount: number;
  lastMessage: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Timestamp | null;
  legalReferences?: Array<{ act: string; section?: string; article?: string }>;
  verificationStatus?: 'verified' | 'partial' | 'unverified';
  documentContext?: string;
  attachments?: string[];
}

// ── Documents (metadata only — file → Cloud Storage) ─────
export type OcrStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface LJDocument {
  id: string;
  fileName: string;
  fileType: string;
  storagePath: string;          // e.g. "users/uid/documents/abc.pdf"
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  ocrStatus: OcrStatus;
  ocrText?: string;             // extracted text (short docs only)
  pageCount?: number;
  documentType?: string;
  language?: string;
  processingMetadata?: Record<string, unknown>;
}

// ── Document Analyses ────────────────────────────────────
export type AnalysisType = 'understand' | 'clarify' | 'compare' | 'navigate' | 'ocr' | 'risk' | 'before_you_sign';
export type AnalysisStatus = 'pending' | 'completed' | 'failed';

export interface DocAnalysis {
  id: string;
  documentId?: string;
  type: AnalysisType;
  status: AnalysisStatus;
  createdAt: Timestamp | null;
  model: string;
  summary?: string;
  riskLevel?: 'safe' | 'low' | 'moderate' | 'high' | 'critical';
  clausesDetected?: number;
  legalReferences?: number;
  verifiedReferences?: number;
  inputSnippet?: string;        // first 200 chars of input
}

// ── Document Clauses ─────────────────────────────────────
export interface DocClause {
  id: string;
  clauseText: string;
  title: string;
  category: string;
  favorability: 'favors_you' | 'favors_other_party' | 'neutral' | 'unclear';
  riskLevel: 'safe' | 'caution' | 'risky' | 'critical';
  legalBasis?: string[];
  verificationStatus: 'verified' | 'partial' | 'unverified';
  createdAt: Timestamp | null;
  saved: boolean;
}

// ── Saved Clauses (snapshot — document-independent) ──────
export interface SavedClause {
  id: string;
  documentId?: string;
  analysisId?: string;
  clauseId?: string;
  // Snapshot fields (don't rely only on IDs)
  clauseText: string;
  title: string;
  category: string;
  favorability: DocClause['favorability'];
  riskLevel: DocClause['riskLevel'];
  legalReferences?: Array<{ act: string; section?: string }>;
  verificationStatus: DocClause['verificationStatus'];
  notes?: string;
  createdAt: Timestamp | null;
  sourceFileName?: string;
}

// ── Task checklist ───────────────────────────────────────
export type TaskStatus   = 'todo' | 'in_progress' | 'done' | 'flagged';
export type TaskPriority = 'low' | 'normal' | 'high' | 'critical';

export interface LegalTask {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: 'review' | 'verify' | 'negotiate' | 'sign' | 'consult' | 'other';
  relatedClause?: string;
  dueDate?: string;
  legalRef?: string;
  notes?: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  completedAt?: Timestamp | null;
}

// ── Dashboard summary ────────────────────────────────────
export interface DashboardData {
  recentConversations: Conversation[];
  recentDocuments: LJDocument[];
  recentAnalyses: DocAnalysis[];
  savedClauseCount: number;
  taskStats: { total: number; done: number; flagged: number; critical: number };
}

// ═══════════════════════════════════════════════════════════
// CONVERSATIONS
// ═══════════════════════════════════════════════════════════

export async function createConversation(
  data: Pick<Conversation, 'title' | 'model' | 'documentId'>
): Promise<string> {
  const userId = await uid();
  const ref = await addDoc(col(userId, 'conversations'), {
    ...data,
    messageCount: 0,
    lastMessage: '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateConversationMeta(
  conversationId: string,
  lastMessage: string
): Promise<void> {
  const userId = await uid();
  await updateDoc(doc(col(userId, 'conversations'), conversationId), {
    lastMessage: lastMessage.slice(0, 200),
    messageCount: increment(1),
    updatedAt: serverTimestamp(),
  });
}

export async function addMessage(
  conversationId: string,
  msg: Omit<Message, 'id' | 'createdAt'>
): Promise<string> {
  const userId = await uid();
  const ref = await addDoc(subCol(userId, 'conversations', conversationId, 'messages'), {
    ...msg,
    createdAt: serverTimestamp(),
  });
  await updateConversationMeta(conversationId, msg.content);
  return ref.id;
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const userId = await uid();
  const q = query(
    subCol(userId, 'conversations', conversationId, 'messages'),
    orderBy('createdAt', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Message, 'id'>) }));
}

export async function getRecentConversations(count = 5): Promise<Conversation[]> {
  const userId = await uid();
  const q = query(col(userId, 'conversations'), orderBy('updatedAt', 'desc'), limit(count));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Conversation, 'id'>) }));
}

export function subscribeToConversations(
  callback: (convs: Conversation[]) => void,
  count = 20
): Promise<Unsubscribe> {
  return (async () => {
    const userId = await uid();
    const q = query(col(userId, 'conversations'), orderBy('updatedAt', 'desc'), limit(count));
    return onSnapshot(q, snap => {
      callback(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Conversation, 'id'>) })));
    });
  })();
}

export async function deleteConversation(conversationId: string): Promise<void> {
  const userId = await uid();
  await deleteDoc(doc(col(userId, 'conversations'), conversationId));
}

// ═══════════════════════════════════════════════════════════
// DOCUMENTS
// ═══════════════════════════════════════════════════════════

export async function createDocument(
  data: Omit<LJDocument, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const userId = await uid();
  const ref = await addDoc(col(userId, 'documents'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateDocumentOcr(
  documentId: string,
  ocrData: { ocrStatus: OcrStatus; ocrText?: string; documentType?: string; pageCount?: number }
): Promise<void> {
  const userId = await uid();
  await updateDoc(doc(col(userId, 'documents'), documentId), {
    ...ocrData,
    updatedAt: serverTimestamp(),
  });
}

export async function getRecentDocuments(count = 5): Promise<LJDocument[]> {
  const userId = await uid();
  const q = query(col(userId, 'documents'), orderBy('createdAt', 'desc'), limit(count));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<LJDocument, 'id'>) }));
}

export function subscribeToDocuments(
  callback: (docs: LJDocument[]) => void,
  count = 20
): Promise<Unsubscribe> {
  return (async () => {
    const userId = await uid();
    const q = query(col(userId, 'documents'), orderBy('createdAt', 'desc'), limit(count));
    return onSnapshot(q, snap => {
      callback(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<LJDocument, 'id'>) })));
    });
  })();
}

// ═══════════════════════════════════════════════════════════
// DOCUMENT ANALYSES
// ═══════════════════════════════════════════════════════════

export async function saveAnalysis(
  data: Omit<DocAnalysis, 'id' | 'createdAt'>
): Promise<string> {
  const userId = await uid();
  // Store under both top-level analyses AND under document if documentId given
  const ref = await addDoc(col(userId, 'analyses'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  if (data.documentId) {
    // Mirror summary under document
    await addDoc(subCol(userId, 'documents', data.documentId, 'analyses'), {
      ...data,
      analysisId: ref.id,
      createdAt: serverTimestamp(),
    });
  }
  return ref.id;
}

export async function getRecentAnalyses(count = 5): Promise<DocAnalysis[]> {
  const userId = await uid();
  const q = query(col(userId, 'analyses'), orderBy('createdAt', 'desc'), limit(count));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<DocAnalysis, 'id'>) }));
}

// ═══════════════════════════════════════════════════════════
// SAVED CLAUSES
// ═══════════════════════════════════════════════════════════

export async function saveClause(
  data: Omit<SavedClause, 'id' | 'createdAt'>
): Promise<string> {
  const userId = await uid();
  const ref = await addDoc(col(userId, 'savedClauses'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateClauseNotes(id: string, notes: string): Promise<void> {
  const userId = await uid();
  await updateDoc(doc(col(userId, 'savedClauses'), id), { notes });
}

export async function deleteSavedClause(id: string): Promise<void> {
  const userId = await uid();
  await deleteDoc(doc(col(userId, 'savedClauses'), id));
}

export async function getSavedClauses(): Promise<SavedClause[]> {
  const userId = await uid();
  const q = query(col(userId, 'savedClauses'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<SavedClause, 'id'>) }));
}

export function subscribeToSavedClauses(
  callback: (clauses: SavedClause[]) => void
): Promise<Unsubscribe> {
  return (async () => {
    const userId = await uid();
    const q = query(col(userId, 'savedClauses'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, snap => {
      callback(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<SavedClause, 'id'>) })));
    });
  })();
}

// ═══════════════════════════════════════════════════════════
// LEGAL TASKS
// ═══════════════════════════════════════════════════════════

export async function addTask(
  task: Omit<LegalTask, 'id' | 'createdAt' | 'updatedAt' | 'completedAt'>
): Promise<string> {
  const userId = await uid();
  const ref = await addDoc(col(userId, 'tasks'), {
    ...task,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    completedAt: null,
  });
  return ref.id;
}

export async function updateTask(id: string, updates: Partial<LegalTask>): Promise<void> {
  const userId = await uid();
  await updateDoc(doc(col(userId, 'tasks'), id), {
    ...updates,
    updatedAt: serverTimestamp(),
    ...(updates.status === 'done' ? { completedAt: serverTimestamp() } : {}),
  });
}

export async function deleteTask(id: string): Promise<void> {
  const userId = await uid();
  await deleteDoc(doc(col(userId, 'tasks'), id));
}

export function subscribeToTasks(
  callback: (tasks: LegalTask[]) => void
): Promise<Unsubscribe> {
  return (async () => {
    const userId = await uid();
    const q = query(col(userId, 'tasks'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, snap => {
      callback(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<LegalTask, 'id'>) })));
    });
  })();
}

// ═══════════════════════════════════════════════════════════
// DASHBOARD AGGREGATION
// ═══════════════════════════════════════════════════════════

export async function getDashboardData(): Promise<DashboardData> {
  const [convs, docs, analyses, savedClauses, tasks] = await Promise.all([
    getRecentConversations(5),
    getRecentDocuments(5),
    getRecentAnalyses(5),
    getSavedClauses(),
    (async () => {
      const userId = await uid();
      const q = query(col(userId, 'tasks'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<LegalTask, 'id'>) }));
    })(),
  ]);

  const taskStats = {
    total: tasks.length,
    done: tasks.filter(t => t.status === 'done').length,
    flagged: tasks.filter(t => t.status === 'flagged').length,
    critical: tasks.filter(t => t.priority === 'critical').length,
  };

  return {
    recentConversations: convs,
    recentDocuments: docs,
    recentAnalyses: analyses,
    savedClauseCount: savedClauses.length,
    taskStats,
  };
}
