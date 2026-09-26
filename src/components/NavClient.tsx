'use client';

import { useState } from 'react';

export function NavClient() {
  const [isOpen, setIsOpen] = useState(false);

  function toggle() {
    setIsOpen(prev => !prev);
  }
  function close() {
    setIsOpen(false);
  }

  function goToTab(tabId: string) {
    close();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('switch-tab', { detail: tabId }));
    }
  }

  return (
    <>
      {/* Desktop nav links */}
      <nav role="navigation" aria-label="Primary navigation" className="nav-links">
        <a href="#tool" className="nav-link" onClick={() => goToTab('dashboard')}>Dashboard</a>
        <a href="#tool" className="nav-link" onClick={() => goToTab('understand')}>Understand</a>
        <a href="#tool" className="nav-link" onClick={() => goToTab('clarify')}>Clarify</a>
        <a href="#tool" className="nav-link" onClick={() => goToTab('compare')}>Compare</a>
        <a href="#tool" className="nav-link" onClick={() => goToTab('navigate')}>Navigate</a>
        <a href="#tool" className="nav-link" onClick={() => goToTab('chat')}>Ask AI</a>
        <a href="#tool" className="nav-link" onClick={() => goToTab('tasks')}>Tasks</a>
        <a href="#laws" className="nav-link" onClick={close}>Indian Law</a>
      </nav>

      {/* Desktop right */}
      <div className="nav-right">
        <span className="nav-badge">
          <span aria-hidden="true">🇮🇳</span> Grounded in Indian Law
        </span>
        <a href="#tool" className="btn-nav-cta" onClick={() => goToTab('understand')}>Try for Free →</a>
      </div>

      {/* Hamburger button */}
      <button
        className={`hamburger${isOpen ? ' open' : ''}`}
        aria-label="Toggle navigation menu"
        aria-expanded={isOpen}
        aria-controls="mobile-menu"
        type="button"
        onClick={toggle}
      >
        <span className="ham-bar" aria-hidden="true" />
        <span className="ham-bar" aria-hidden="true" />
        <span className="ham-bar" aria-hidden="true" />
      </button>

      {/* Mobile menu */}
      <div
        className={`mobile-menu${isOpen ? ' open' : ''}`}
        id="mobile-menu"
        role="menu"
        aria-label="Mobile navigation"
      >
        <nav className="mobile-nav">
          <a href="#tool" className="mobile-link" role="menuitem" onClick={() => goToTab('dashboard')}>⊞ Dashboard</a>
          <a href="#tool" className="mobile-link" role="menuitem" onClick={() => goToTab('understand')}>📄 Understand</a>
          <a href="#tool" className="mobile-link" role="menuitem" onClick={() => goToTab('clarify')}>💡 Clarify</a>
          <a href="#tool" className="mobile-link" role="menuitem" onClick={() => goToTab('compare')}>⚖️ Compare</a>
          <a href="#tool" className="mobile-link" role="menuitem" onClick={() => goToTab('navigate')}>🧭 Navigate</a>
          <a href="#tool" className="mobile-link" role="menuitem" onClick={() => goToTab('chat')}>💬 Ask AI</a>
          <a href="#tool" className="mobile-link" role="menuitem" onClick={() => goToTab('tasks')}>📋 Tasks</a>
          <a href="#laws" className="mobile-link" role="menuitem" onClick={close}>🇮🇳 Indian Law Coverage</a>
          <a href="#tool" className="mobile-cta" role="menuitem" onClick={() => goToTab('understand')}>Try LawJourney Free →</a>
        </nav>
      </div>
    </>
  );
}
