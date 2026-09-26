'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { RobotSVG, type RobotState } from './RobotSVG';
import { OCRUploader } from './OCRUploader';
import { MAX_DOC_CHARS } from '@/lib/constants';
import type { ChatMessage } from '@/lib/types';
import type { ChatOutput } from '@/lib/validators';
import { clientChat } from '@/lib/client-api';

// ── Quick actions ────────────────────────────────────────────
const QUICK_ACTIONS = [
  { icon: '📄', label: 'Explain a clause', q: 'Can you explain what this clause means? "The Employee shall not, during the term of this Agreement or for a period of 2 years thereafter, directly or indirectly engage in any business that competes with the Company."' },
  { icon: '⚖️', label: 'Check my legal rights', q: 'What are my rights as a tenant under the Rent Control Act if my landlord wants to evict me?' },
  { icon: '🔍', label: 'Spot one-sided terms', q: 'What clauses in a contract should I watch out for that might be unfair or one-sided under Indian law?' },
  { icon: '🏛️', label: 'Constitutional rights', q: 'Which fundamental rights under the Indian Constitution can protect me in a contract dispute?' },
  { icon: '📋', label: 'Understand NDA terms', q: 'What does a typical NDA mean for me as an employee, and are there any terms that cannot be enforced under Indian law?' },
];

// ── Message bubble ───────────────────────────────────────────
function MessageBubble({
  msg,
  disclaimer,
  followUps,
  onFollowUp,
}: {
  readonly msg: ChatMessage;
  readonly disclaimer?: string;
  readonly followUps?: string[];
  readonly onFollowUp?: (q: string) => void;
}) {
  return (
    <div className={`pchat-bubble-wrap ${msg.role}`}>
      {msg.role === 'assistant' && (
        <div className="pchat-avatar" aria-hidden="true">
          <RobotSVG state="responding" size="sm" />
        </div>
      )}
      <div className="pchat-bubble-col">
        <div className={`pchat-bubble ${msg.role}`}>{msg.content}</div>
        {msg.role === 'assistant' && disclaimer && (
          <p className="pchat-disclaimer">{disclaimer}</p>
        )}
        {msg.role === 'assistant' && followUps && followUps.length > 0 && onFollowUp && (
          <div className="pchat-followups" role="group" aria-label="Suggested follow-ups">
            {followUps.map((q, i) => (
              <button key={i} className="pchat-followup-btn" onClick={() => onFollowUp(q)} type="button">
                {q}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Thinking bubble ──────────────────────────────────────────
function ThinkingBubble() {
  return (
    <div className="pchat-bubble-wrap assistant" role="status" aria-label="LAWJOURNEY AI is thinking">
      <div className="pchat-avatar" aria-hidden="true">
        <RobotSVG state="thinking" size="sm" />
      </div>
      <div className="pchat-bubble assistant pchat-bubble--thinking">
        <span className="think-dot" aria-hidden="true" />
        <span className="think-dot" aria-hidden="true" />
        <span className="think-dot" aria-hidden="true" />
      </div>
    </div>
  );
}

// ── Welcome screen ───────────────────────────────────────────
function WelcomeScreen({
  onQuickAction,
  isLoading,
}: {
  readonly onQuickAction: (q: string) => void;
  readonly isLoading: boolean;
}) {
  return (
    <div className="pchat-welcome">
      {/* Hero robot */}
      <div className="pchat-hero-robot" aria-hidden="true">
        <RobotSVG state="idle" size="lg" />
      </div>

      <div className="pchat-welcome-text">
        <p className="pchat-greeting-label">LAWJOURNEY AI</p>
        <h2 className="pchat-greeting-h">Hello. How can I help?</h2>
        <p className="pchat-greeting-sub">
          Ask me about Indian law, a clause in your contract, or your legal rights.
          Grounded in real Indian statutes — not generic answers.
        </p>
      </div>

      {/* Bento quick actions */}
      <div className="pchat-quick-grid" role="group" aria-label="Quick actions">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.label}
            type="button"
            className="pchat-quick-card"
            onClick={() => onQuickAction(action.q)}
            disabled={isLoading}
          >
            <span className="pchat-quick-icon" aria-hidden="true">{action.icon}</span>
            <span className="pchat-quick-label">{action.label}</span>
          </button>
        ))}
      </div>

      <p className="pchat-powered">
        Powered by Gemini AI · Indian Contract Act · Constitution of India · Consumer Protection Act
      </p>
    </div>
  );
}

// ── Document context bar ─────────────────────────────────────
function DocContextBar({
  open,
  onToggle,
  value,
  onChange,
}: {
  readonly open: boolean;
  readonly onToggle: () => void;
  readonly value: string;
  readonly onChange: (v: string) => void;
}) {
  const hasDoc = value.trim().length > 0;
  return (
    <div className="pchat-context-bar">
      <button
        type="button"
        className={`pchat-context-toggle${hasDoc ? ' has-doc' : ''}`}
        aria-expanded={open}
        onClick={onToggle}
      >
        <span aria-hidden="true">{hasDoc ? '📄' : '+'}</span>
        {hasDoc ? (
          <span>
            <span className="pchat-context-tag">DOCUMENT CONTEXT</span>
            {value.slice(0, 40).trim()}…
          </span>
        ) : (
          'Add document context'
        )}
        <span aria-hidden="true" style={{ marginLeft: 'auto', opacity: 0.5 }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="pchat-context-area">
          <label htmlFor="pchat-doc" className="pchat-context-label">
            Paste a contract or clause — I&apos;ll answer your questions about it
          </label>
          <textarea
            id="pchat-doc"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Paste your legal document, clause, or terms here…"
            maxLength={MAX_DOC_CHARS}
            rows={4}
            className="pchat-context-textarea"
          />
          <span className="pchat-context-count">{value.length.toLocaleString()} chars</span>
        </div>
      )}
    </div>
  );
}

// ── Main panel ───────────────────────────────────────────────
interface PremiumChatPanelProps {
  readonly initialMessage?: string;
  readonly onInitialMessageConsumed?: () => void;
  readonly onClose?: () => void;
}

export function PremiumChatPanel({ initialMessage, onInitialMessageConsumed, onClose }: PremiumChatPanelProps) {
  const [tab, setTab] = useState<'chat' | 'ocr'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [docContext, setDocContext] = useState('');
  const [showContext, setShowContext] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<ChatOutput | null>(null);
  const [robotState, setRobotState] = useState<RobotState>('idle');

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const sentRef = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;
    const userMsg: ChatMessage = { role: 'user', content: text.trim() };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setIsLoading(true);
    setError(null);
    setRobotState('thinking');

    try {
      const output = await clientChat({
        messages: nextMessages,
        documentContext: docContext || undefined,
      });

      setLastResponse(output);
      setRobotState('responding');
      setMessages([...nextMessages, { role: 'assistant', content: output.answer }]);

      setTimeout(() => {
        setRobotState('success');
        setTimeout(() => setRobotState('idle'), 1200);
      }, 400);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
      setRobotState('error');
    } finally {
      setIsLoading(false);
    }
  }, [messages, docContext]);

  // Auto-send injected clause
  useEffect(() => {
    if (initialMessage && !sentRef.current) {
      sentRef.current = true;
      void sendMessage(initialMessage);
      onInitialMessageConsumed?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMessage]);

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    if (robotState === 'idle' || robotState === 'success') setRobotState('listening');
  }

  function handleBlur() {
    if (robotState === 'listening') setRobotState('idle');
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(input);
    }
  }

  function handleClear() {
    setMessages([]);
    setLastResponse(null);
    setError(null);
    setRobotState('idle');
    sentRef.current = false;
    inputRef.current?.focus();
  }

  const isEmpty = messages.length === 0 && !isLoading && !error;

  return (
    <div className="pchat-root" aria-label="LAWJOURNEY AI legal assistant">
      {/* ── Header ─────────────────────────── */}
      <div className="pchat-header">
        <div className="pchat-header-brand">
          <div className="pchat-header-robot" aria-hidden="true">
            <RobotSVG state={robotState} size="sm" />
          </div>
          <div>
            <p className="pchat-header-name">LAWJOURNEY AI</p>
            <p className="pchat-header-status">
              <span className={`pchat-status-dot${isLoading ? ' loading' : error ? ' error' : ''}`} aria-hidden="true" />
              {isLoading ? 'Analysing…' : error ? 'Error — try again' : 'Legal Companion · Ready'}
            </p>
          </div>
        </div>
        <div className="pchat-header-right">
          {/* Mode tabs */}
          <div className="pchat-mode-tabs" role="tablist" aria-label="Panel mode">
            <button
              type="button" role="tab"
              aria-selected={tab === 'chat'}
              className={`pchat-mode-tab${tab === 'chat' ? ' active' : ''}`}
              onClick={() => setTab('chat')}
            >✦ Chat</button>
            <button
              type="button" role="tab"
              aria-selected={tab === 'ocr'}
              className={`pchat-mode-tab${tab === 'ocr' ? ' active' : ''}`}
              onClick={() => setTab('ocr')}
            >📄 Analyse</button>
          </div>
          {messages.length > 0 && tab === 'chat' && (
            <button type="button" className="pchat-clear-btn" onClick={handleClear} aria-label="Clear conversation">
              Clear
            </button>
          )}
          {/* Close button — shown when used inside floating panel */}
          {onClose && (
            <button
              type="button"
              className="pchat-close-x"
              onClick={onClose}
              aria-label="Close chat"
              title="Close"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── Bento body ─────────────────────── */}
      <div className="pchat-body">
        {tab === 'ocr' ? (
          <OCRUploader
            isLoading={isLoading}
            onLoadingChange={setIsLoading}
            onResult={() => { /* result rendered inside OCRUploader */ }}
            onAskAbout={(q) => {
              setTab('chat');
              void sendMessage(q);
            }}
          />
        ) : isEmpty ? (
          <WelcomeScreen onQuickAction={(q) => void sendMessage(q)} isLoading={isLoading} />
        ) : (
          <section className="pchat-conversation" aria-live="polite" aria-label="Conversation">
            {messages.map((msg, i) => {
              const isLastAssistant = msg.role === 'assistant' && i === messages.length - 1;
              return (
                <MessageBubble
                  key={i}
                  msg={msg}
                  disclaimer={isLastAssistant ? lastResponse?.disclaimer : undefined}
                  followUps={isLastAssistant ? lastResponse?.followUpQuestions : undefined}
                  onFollowUp={(q) => void sendMessage(q)}
                />
              );
            })}
            {isLoading && <ThinkingBubble />}
            {error && (
              <div className="pchat-error-card" role="alert">
                <div className="pchat-error-robot" aria-hidden="true">
                  <RobotSVG state="error" size="sm" />
                </div>
                <div>
                  <p className="pchat-error-title">Something went wrong.</p>
                  <p className="pchat-error-msg">{error}</p>
                  <button
                    type="button"
                    className="pchat-retry-btn"
                    onClick={() => {
                      setError(null);
                      const lastUser = [...messages].reverse().find(m => m.role === 'user');
                      if (lastUser) {
                        void sendMessage(lastUser.content);
                      } else {
                        setRobotState('idle');
                      }
                    }}
                  >
                    Try again ↻
                  </button>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </section>
        )}
      </div>

      {/* ── Document context ────────────────── */}
      <DocContextBar
        open={showContext}
        onToggle={() => setShowContext(!showContext)}
        value={docContext}
        onChange={setDocContext}
      />

      {/* ── Input row ──────────────────────── */}
      <div className="pchat-input-area">
        <label htmlFor="pchat-input" className="visually-hidden">Ask LAWJOURNEY AI a legal question</label>
        <textarea
          ref={inputRef}
          id="pchat-input"
          className="pchat-input"
          value={input}
          onChange={handleInput}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about Indian law…"
          disabled={isLoading}
          maxLength={2000}
          rows={1}
          aria-label="Your legal question"
        />
        <button
          type="button"
          className="pchat-send-btn"
          onClick={() => void sendMessage(input)}
          disabled={isLoading || !input.trim()}
          aria-label="Send message"
          aria-busy={isLoading}
        >
          {isLoading ? (
            <span className="pchat-send-spinner" aria-hidden="true" />
          ) : (
            <span aria-hidden="true">↑</span>
          )}
        </button>
      </div>

      <p className="pchat-footer-note">
        Legal information only · Not a substitute for a licensed advocate
      </p>
    </div>
  );
}
