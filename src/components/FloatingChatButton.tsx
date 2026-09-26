'use client';

import { useState, useEffect } from 'react';
import { RobotSVG } from './RobotSVG';
import { PremiumChatPanel } from './PremiumChatPanel';

interface Props {
  readonly initialMessage?: string;
  readonly onInitialMessageConsumed?: () => void;
}

export function FloatingChatButton({ initialMessage, onInitialMessageConsumed }: Props) {
  const [open, setOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  // Auto-open if a clause was sent via "Ask AI about this"
  useEffect(() => {
    if (initialMessage) {
      setOpen(true);
      setHasUnread(false);
    }
  }, [initialMessage]);

  function toggle() {
    setOpen(prev => !prev);
    if (!open) setHasUnread(false);
  }

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fchat-backdrop"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Chat panel — X button lives inside the PremiumChatPanel header */}
      <div
        className={`fchat-panel${open ? ' open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="LAWJOURNEY AI chat assistant"
      >
        {open && (
          <PremiumChatPanel
            initialMessage={initialMessage}
            onInitialMessageConsumed={onInitialMessageConsumed}
            onClose={() => setOpen(false)}
          />
        )}
      </div>

      {/* Floating trigger button */}
      <button
        type="button"
        className={`fchat-trigger${open ? ' open' : ''}`}
        onClick={toggle}
        aria-label={open ? 'Close LAWJOURNEY AI assistant' : 'Open LAWJOURNEY AI assistant'}
        aria-expanded={open}
        aria-controls="fchat-panel"
      >
        {open ? (
          <span className="fchat-trigger-x" aria-hidden="true">✕</span>
        ) : (
          <>
            <div className="fchat-trigger-robot" aria-hidden="true">
              <RobotSVG state="idle" size="sm" />
            </div>
            <div className="fchat-trigger-text">
              <span className="fchat-trigger-label">Ask LAWJOURNEY</span>
              <span className="fchat-trigger-sub">Legal AI · Indian Law</span>
            </div>
            {hasUnread && <span className="fchat-unread-dot" aria-label="New message" />}
          </>
        )}
      </button>
    </>
  );
}
