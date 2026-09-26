'use client';

import { useState, useEffect } from 'react';
import {
  getDashboardData,
  type DashboardData,
  type Conversation,
  type LJDocument,
  type DocAnalysis,
} from '@/lib/firestore';

// ─── Time ago helper ──────────────────────────────────────
function timeAgo(ts: import('firebase/firestore').Timestamp | null): string {
  if (!ts) return '';
  const secs = Math.floor((Date.now() - ts.toMillis()) / 1000);
  if (secs < 60) return 'Just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  if (secs < 604800) return `${Math.floor(secs / 86400)}d ago`;
  return ts.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// ─── Risk badge ───────────────────────────────────────────
const RISK_CLS: Record<string, string> = {
  safe: 'db-risk-safe', low: 'db-risk-low',
  moderate: 'db-risk-moderate', high: 'db-risk-high', critical: 'db-risk-critical',
};

function RiskBadge({ risk }: { readonly risk?: string }) {
  if (!risk) return null;
  return <span className={`db-risk-badge ${RISK_CLS[risk] ?? ''}`}>{risk}</span>;
}

// ─── Stat card ────────────────────────────────────────────
function StatCard({ icon, label, value, sub, cls = '', onClick }: {
  readonly icon: string;
  readonly label: string;
  readonly value: number | string;
  readonly sub?: string;
  readonly cls?: string;
  readonly onClick?: () => void;
}) {
  return (
    <div
      className={`db-stat-card ${cls}${onClick ? ' clickable' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={e => onClick && e.key === 'Enter' && onClick()}
    >
      <div className="db-stat-icon">{icon}</div>
      <div>
        <p className="db-stat-val">{value}</p>
        <p className="db-stat-label">{label}</p>
        {sub && <p className="db-stat-sub">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────
function Section({ title, icon, count, children, onViewAll }: {
  readonly title: string;
  readonly icon: string;
  readonly count?: number;
  readonly children: React.ReactNode;
  readonly onViewAll?: () => void;
}) {
  return (
    <div className="db-section">
      <div className="db-section-head">
        <div className="db-section-title-row">
          <span className="db-section-icon">{icon}</span>
          <h3 className="db-section-title">{title}</h3>
          {count !== undefined && <span className="db-section-count">{count}</span>}
        </div>
        {onViewAll && (
          <button type="button" className="db-view-all" onClick={onViewAll}>View all →</button>
        )}
      </div>
      <div className="db-section-body">{children}</div>
    </div>
  );
}

// ─── Empty row ────────────────────────────────────────────
function EmptyRow({ msg }: { readonly msg: string }) {
  return <p className="db-empty-row">{msg}</p>;
}

// ─── Conversation row ─────────────────────────────────────
function ConversationRow({ conv }: { readonly conv: Conversation }) {
  return (
    <div className="db-list-row">
      <div className="db-row-icon-wrap db-row-icon--chat">✦</div>
      <div className="db-row-content">
        <p className="db-row-title">{conv.title || 'Untitled conversation'}</p>
        {conv.lastMessage && (
          <p className="db-row-sub">&ldquo;{conv.lastMessage.slice(0, 80)}{conv.lastMessage.length > 80 ? '…' : ''}&rdquo;</p>
        )}
      </div>
      <div className="db-row-meta">
        <p className="db-row-time">{timeAgo(conv.updatedAt)}</p>
        <p className="db-row-msgs">{conv.messageCount} msgs</p>
      </div>
    </div>
  );
}

// ─── Document row ─────────────────────────────────────────
const FILE_ICON: Record<string, string> = {
  'application/pdf': '📄',
  'image/jpeg': '🖼',
  'image/png': '🖼',
  'image/webp': '🖼',
};

function DocumentRow({ ljDoc }: { readonly ljDoc: LJDocument }) {
  const icon = FILE_ICON[ljDoc.fileType] ?? '📋';
  return (
    <div className="db-list-row">
      <div className="db-row-icon-wrap db-row-icon--doc">{icon}</div>
      <div className="db-row-content">
        <p className="db-row-title">{ljDoc.fileName}</p>
        <p className="db-row-sub">
          {ljDoc.documentType ? ljDoc.documentType.replace(/_/g, ' ') : ljDoc.fileType}
          {ljDoc.pageCount ? ` · ${ljDoc.pageCount} pages` : ''}
        </p>
      </div>
      <div className="db-row-meta">
        <p className="db-row-time">{timeAgo(ljDoc.createdAt)}</p>
        <span className={`db-ocr-badge db-ocr-${ljDoc.ocrStatus}`}>{ljDoc.ocrStatus}</span>
      </div>
    </div>
  );
}

// ─── Analysis row ─────────────────────────────────────────
const ANALYSIS_ICON: Record<string, string> = {
  understand: '📄', clarify: '💡', compare: '⚖', navigate: '🧭',
  ocr: '🔍', risk: '⚠', before_you_sign: '✍',
};

function AnalysisRow({ analysis }: { readonly analysis: DocAnalysis }) {
  return (
    <div className="db-list-row">
      <div className="db-row-icon-wrap db-row-icon--analysis">
        {ANALYSIS_ICON[analysis.type] ?? '📊'}
      </div>
      <div className="db-row-content">
        <p className="db-row-title">{analysis.type.replace(/_/g, ' ')} analysis</p>
        {analysis.summary && (
          <p className="db-row-sub">{analysis.summary.slice(0, 80)}{analysis.summary.length > 80 ? '…' : ''}</p>
        )}
      </div>
      <div className="db-row-meta">
        <p className="db-row-time">{timeAgo(analysis.createdAt)}</p>
        {analysis.riskLevel && <RiskBadge risk={analysis.riskLevel} />}
      </div>
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────
function Skeleton() {
  return (
    <div className="db-skeleton-wrap">
      {[0, 1, 2].map(i => (
        <div key={i} className="db-skeleton-row">
          <div className="db-skel db-skel-icon" />
          <div className="db-skel-lines">
            <div className="db-skel db-skel-line db-skel-line--long" />
            <div className="db-skel db-skel-line db-skel-line--short" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────
interface DashboardProps {
  readonly onSwitchTab: (tab: string) => void;
}

export function Dashboard({ onSwitchTab }: DashboardProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDashboardData()
      .then(d => { setData(d); setLoading(false); })
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : 'Failed to load dashboard';
        // Suppress auth/config errors — show empty dashboard instead
        if (msg.includes('auth/') || msg.includes('configuration-not-found')) {
          setData({
            recentConversations: [], recentDocuments: [],
            recentAnalyses: [], savedClauseCount: 0,
            taskStats: { total: 0, done: 0, flagged: 0, critical: 0 },
          });
        } else {
          setError(msg);
        }
        setLoading(false);
      });
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="db-root" aria-label="LAWJOURNEY Dashboard">

      {/* ── Hero greeting ─── */}
      <div className="db-hero">
        <div>
          <p className="db-greeting">{greeting}</p>
          <h2 className="db-tagline">Continue your legal journey.</h2>
          <p className="db-tagline-sub">All your documents, analyses, and conversations — in one place.</p>
        </div>
        <div className="db-hero-badge">
          <span className="db-firebase-dot" />
          <span>Synced · Firebase</span>
        </div>
      </div>

      {error && (
        <div className="db-error" role="alert">⚠ {error}</div>
      )}

      {/* ── Stats row ─── */}
      {data && (
        <div className="db-stats-row">
          <StatCard icon="💬" label="Conversations" value={data.recentConversations.length || '—'} onClick={() => onSwitchTab('chat')} />
          <StatCard icon="📄" label="Documents" value={data.recentDocuments.length || '—'} onClick={() => onSwitchTab('understand')} />
          <StatCard icon="♡" label="Saved Clauses" value={data.savedClauseCount || '—'} cls="gold" onClick={() => onSwitchTab('understand')} />
          <StatCard
            icon="📋" label="Tasks"
            value={data.taskStats.total || '—'}
            sub={data.taskStats.total > 0 ? `${data.taskStats.done} done` : undefined}
            onClick={() => onSwitchTab('tasks')}
          />
          {data.taskStats.critical > 0 && (
            <StatCard icon="⚠" label="Critical" value={data.taskStats.critical} cls="critical" onClick={() => onSwitchTab('tasks')} />
          )}
        </div>
      )}

      {/* ── Bento grid ─── */}
      <div className="db-bento">

        {/* Left column */}
        <div className="db-bento-col">

          {/* Recent Conversations */}
          <Section
            title="Recent Conversations" icon="✦"
            count={data?.recentConversations.length}
            onViewAll={() => onSwitchTab('chat')}
          >
            {loading ? <Skeleton /> : data?.recentConversations.length ? (
              data.recentConversations.map(c => <ConversationRow key={c.id} conv={c} />)
            ) : (
              <EmptyRow msg="No conversations yet — ask LAWJOURNEY AI something." />
            )}
          </Section>

          {/* Recent Analyses */}
          <Section
            title="Recent Analyses" icon="📊"
            count={data?.recentAnalyses.length}
            onViewAll={() => onSwitchTab('understand')}
          >
            {loading ? <Skeleton /> : data?.recentAnalyses.length ? (
              data.recentAnalyses.map(a => <AnalysisRow key={a.id} analysis={a} />)
            ) : (
              <EmptyRow msg="Paste a document to run your first analysis." />
            )}
          </Section>
        </div>

        {/* Right column */}
        <div className="db-bento-col">

          {/* Recent Documents */}
          <Section
            title="My Documents" icon="📄"
            count={data?.recentDocuments.length}
            onViewAll={() => onSwitchTab('understand')}
          >
            {loading ? <Skeleton /> : data?.recentDocuments.length ? (
              data.recentDocuments.map(d => <DocumentRow key={d.id} ljDoc={d} />)
            ) : (
              <EmptyRow msg="Upload a document in the Analyse tab to get started." />
            )}
          </Section>

          {/* Saved Clauses */}
          <Section
            title="Saved Clauses" icon="♡"
            count={data?.savedClauseCount}
            onViewAll={() => onSwitchTab('understand')}
          >
            {loading ? <Skeleton /> : (data?.savedClauseCount ?? 0) > 0 ? (
              <div className="db-saved-clauses-count-card">
                <p className="db-saved-big">{data?.savedClauseCount}</p>
                <p className="db-saved-label">clauses saved</p>
                <p className="db-saved-hint">Save clauses from any analysis using the ♡ button.</p>
              </div>
            ) : (
              <>
                <EmptyRow msg="No saved clauses yet." />
                <p className="db-saved-hint-inline">
                  Tip: after running an analysis, click ♡ on any clause to save it here.
                </p>
              </>
            )}
          </Section>

          {/* Quick actions */}
          <Section title="Quick Actions" icon="⚡">
            <div className="db-quick-actions">
              {[
                { icon: '📄', label: 'Understand a document', tab: 'understand' },
                { icon: '📷', label: 'Scan & OCR document', tab: 'ocr' },
                { icon: '💡', label: 'Clarify a clause', tab: 'clarify' },
                { icon: '✦', label: 'Ask LAWJOURNEY AI', tab: 'chat' },
                { icon: '📋', label: 'My task checklist', tab: 'tasks' },
              ].map(a => (
                <button
                  key={a.tab}
                  type="button"
                  className="db-quick-btn"
                  onClick={() => onSwitchTab(a.tab)}
                >
                  <span className="db-quick-icon">{a.icon}</span>
                  <span>{a.label}</span>
                  <span className="db-quick-arrow">→</span>
                </button>
              ))}
            </div>
          </Section>
        </div>
      </div>

      {/* Firebase attribution */}
      <div className="db-footer">
        <span>Powered by Firebase · Firestore · Anonymous Auth</span>
        <span>·</span>
        <span>India region (asia-south1)</span>
        <span>·</span>
        <a
          href="https://console.firebase.google.com/project/lawjourney-ai-2026/firestore"
          target="_blank" rel="noopener noreferrer"
          className="db-console-link"
        >
          View in Firebase Console ↗
        </a>
      </div>
    </div>
  );
}

export default Dashboard;
