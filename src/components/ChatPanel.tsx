'use client';

import { useState, useRef, useEffect } from 'react';
import { SAMPLE_QUESTIONS, MAX_DOC_CHARS } from '@/lib/constants';
import type { ChatMessage } from '@/lib/types';
import type { ChatOutput } from '@/lib/validators';
import { clientChat } from '@/lib/client-api';

interface BubbleProps {
  readonly msg: ChatMessage;
  readonly disclaimer?: string;
  readonly followUps?: string[];
  readonly onFollowUp?: (q: string) => void;
}

function Bubble({ msg, disclaimer, followUps, onFollowUp }: BubbleProps) {
  return (
    <div className={`chat-bubble-wrap ${msg.role}`}>
      <div className={`chat-bubble ${msg.role}`}>{msg.content}</div>
      {msg.role === 'assistant' && disclaimer && <p className="chat-disclaimer">{disclaimer}</p>}
      {msg.role === 'assistant' && followUps && followUps.length > 0 && onFollowUp && (
        <div className="chat-follow-ups" role="group" aria-label="Suggested follow-up questions">
          {followUps.map((q, i) => (
            <button key={i} className="follow-btn" onClick={() => onFollowUp(q)}>{q}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function DocContextToggle({ open, onToggle, value, onChange }: {
  readonly open: boolean; readonly onToggle: () => void;
  readonly value: string; readonly onChange: (v: string) => void;
}) {
  return (
    <div>
      <button type="button" className="btn-ghost" aria-expanded={open} onClick={onToggle}>
        {open ? '▲' : '▼'} {open ? 'Hide' : 'Add'} document context (optional)
      </button>
      {open && (
        <div className="field" style={{ marginTop: '0.75rem' }}>
          <label htmlFor="doc-context" className="field-label">Paste a document to ask questions about it</label>
          <textarea id="doc-context" value={value} onChange={(e) => onChange(e.target.value)} placeholder="Paste your contract, clause, or legal text here…" maxLength={MAX_DOC_CHARS} rows={5} />
          <span className="char-count">{value.length.toLocaleString()} chars</span>
        </div>
      )}
    </div>
  );
}

function StarterQuestions({ onPick, disabled }: { readonly onPick: (q: string) => void; readonly disabled: boolean }) {
  return (
    <div className="chat-starter">
      <p className="chat-starter-label">Try asking:</p>
      <div className="starter-grid" role="group" aria-label="Suggested questions">
        {SAMPLE_QUESTIONS.map((q, i) => (
          <button key={i} className="starter-btn" onClick={() => onPick(q)} disabled={disabled}>{q}</button>
        ))}
      </div>
    </div>
  );
}

function MessageHistory({ messages, isLoading, lastResponse, onFollowUp, bottomRef }: {
  readonly messages: ChatMessage[]; readonly isLoading: boolean;
  readonly lastResponse: ChatOutput | null; readonly onFollowUp: (q: string) => void;
  readonly bottomRef: React.RefObject<HTMLDivElement>;
}) {
  return (
    <section aria-label="Conversation" aria-live="polite">
      <div className="chat-history">
        {messages.map((msg, i) => {
          const isLastAssistant = msg.role === 'assistant' && i === messages.length - 1;
          return (
            <Bubble
              key={i}
              msg={msg}
              disclaimer={isLastAssistant ? lastResponse?.disclaimer : undefined}
              followUps={isLastAssistant ? lastResponse?.followUpQuestions : undefined}
              onFollowUp={onFollowUp}
            />
          );
        })}
        {isLoading && (
          <div className="chat-bubble-wrap assistant" role="status" aria-label="LexAI is thinking">
            <div className="chat-bubble assistant" style={{ opacity: 0.5 }}><span aria-hidden="true">…</span></div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </section>
  );
}

function ChatInputRow({ value, onChange, onKeyDown, onSend, isLoading }: {
  readonly value: string; readonly onChange: (v: string) => void;
  readonly onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  readonly onSend: () => void; readonly isLoading: boolean;
}) {
  return (
    <div className="chat-input-row">
      <label htmlFor="chat-input" className="field-label" style={{ display: 'none' }}>Ask a legal question</label>
      <textarea
        id="chat-input" value={value} onChange={(e) => onChange(e.target.value)} onKeyDown={onKeyDown}
        placeholder="Ask any legal question… (Enter to send, Shift+Enter for new line)"
        disabled={isLoading} maxLength={2000} rows={2} aria-label="Your legal question"
      />
      <button
        type="button" className="btn-submit" onClick={onSend} disabled={isLoading || !value.trim()}
        aria-label="Send message" aria-busy={isLoading} style={{ flexShrink: 0, padding: '0.75rem 1.25rem' }}
      >
        {isLoading ? '…' : '↑'}
      </button>
    </div>
  );
}

interface Props {
  readonly onLoading: (v: boolean) => void;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly onError: (e: string | null) => void;
  readonly initialMessage?: string;
  readonly onInitialMessageConsumed?: () => void;
}

export function ChatPanel({ onLoading, isLoading, error, onError, initialMessage, onInitialMessageConsumed }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [docContext, setDocContext] = useState('');
  const [showContext, setShowContext] = useState(false);
  const [lastResponse, setLastResponse] = useState<ChatOutput | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const sentRef = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Auto-send injected clause question
  useEffect(() => {
    if (initialMessage && !sentRef.current) {
      sentRef.current = true;
      setMessages([]);
      setLastResponse(null);
      void sendMessage(initialMessage);
      onInitialMessageConsumed?.();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMessage]);

  async function sendMessage(text: string) {
    if (!text.trim()) return;
    const userMsg: ChatMessage = { role: 'user', content: text.trim() };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    onLoading(true);
    onError(null);
    try {
      const output = await clientChat({ messages: nextMessages, documentContext: docContext || undefined });
      setLastResponse(output);
      setMessages([...nextMessages, { role: 'assistant', content: output.answer }]);
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      onLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(input);
    }
  }

  return (
    <div className="chat-wrap" aria-label="Legal Q&A chat">
      <DocContextToggle open={showContext} onToggle={() => setShowContext(!showContext)} value={docContext} onChange={setDocContext} />
      {messages.length === 0 && <StarterQuestions onPick={(q) => void sendMessage(q)} disabled={isLoading} />}
      {messages.length > 0 && (
        <MessageHistory messages={messages} isLoading={isLoading} lastResponse={lastResponse} onFollowUp={(q) => void sendMessage(q)} bottomRef={bottomRef} />
      )}
      {error && <div role="alert" aria-live="assertive" className="error-msg">⚠️ {error}</div>}
      <ChatInputRow value={input} onChange={setInput} onKeyDown={handleKeyDown} onSend={() => void sendMessage(input)} isLoading={isLoading} />
      {messages.length > 0 && (
        <button type="button" className="btn-ghost" onClick={() => { setMessages([]); setLastResponse(null); onError(null); }} style={{ alignSelf: 'flex-start' }}>
          ✕ Clear conversation
        </button>
      )}
    </div>
  );
}
