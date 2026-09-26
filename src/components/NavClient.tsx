'use client';

import { useState, useEffect } from 'react';

const NAV_ITEMS = [
  { id: 'dashboard',  label: 'Dashboard' },
  { id: 'understand', label: 'Analyze' },
  { id: 'clarify',    label: 'Clarify' },
  { id: 'compare',    label: 'Compare' },
  { id: 'navigate',   label: 'Navigate' },
  { id: 'chat',       label: 'Ask AI' },
  { id: 'tasks',      label: 'Tasks' },
] as const;

export function NavClient() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('');

  useEffect(() => {
    // Sync active tab indicator with hash / switch-tab events
    const syncTab = () => {
      const hash = window.location.hash.replace('#', '');
      const validIds = NAV_ITEMS.map(n => n.id);
      if (validIds.includes(hash as (typeof NAV_ITEMS)[number]['id'])) {
        setActiveTab(hash);
      }
    };
    const handleSwitch = (e: Event) => {
      const t = (e as CustomEvent).detail as string;
      if (t) setActiveTab(t);
    };
    window.addEventListener('hashchange', syncTab);
    window.addEventListener('switch-tab', handleSwitch);
    syncTab();
    return () => {
      window.removeEventListener('hashchange', syncTab);
      window.removeEventListener('switch-tab', handleSwitch);
    };
  }, []);

  function toggle() { setIsOpen(prev => !prev); }
  function close()  { setIsOpen(false); }

  function goToTab(tabId: string) {
    close();
    setActiveTab(tabId);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('switch-tab', { detail: tabId }));
    }
  }

  return (
    <>
      {/* ── Desktop primary nav ── */}
      <nav role="navigation" aria-label="Primary navigation" className="nav-links">
        {NAV_ITEMS.map(item => (
          <a
            key={item.id}
            href="#tool"
            className={`nav-link${activeTab === item.id ? ' nav-link--active' : ''}`}
            aria-current={activeTab === item.id ? 'page' : undefined}
            onClick={() => goToTab(item.id)}
          >
            {item.label}
          </a>
        ))}
        {/* Indian Law — scrolls to laws section, not a tab */}
        <a
          href="#laws"
          className="nav-link"
          onClick={close}
        >
          Indian Law
        </a>
      </nav>

      {/* ── Desktop right ── */}
      <div className="nav-right">
        <span className="nav-badge">
          <span aria-hidden="true">🇮🇳</span> Grounded in Indian Law
        </span>
        <a href="#tool" className="btn-nav-cta" onClick={() => goToTab('understand')}>
          Analyze a Document
        </a>
      </div>

      {/* ── Hamburger ── */}
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

      {/* ── Mobile menu ── */}
      <div
        className={`mobile-menu${isOpen ? ' open' : ''}`}
        id="mobile-menu"
        role="menu"
        aria-label="Mobile navigation"
      >
        <nav className="mobile-nav">
          {NAV_ITEMS.map(item => (
            <a
              key={item.id}
              href="#tool"
              className={`mobile-link${activeTab === item.id ? ' mobile-link--active' : ''}`}
              role="menuitem"
              onClick={() => goToTab(item.id)}
            >
              {item.label}
            </a>
          ))}
          <a
            href="#laws"
            className="mobile-link"
            role="menuitem"
            onClick={close}
          >
            🇮🇳 Indian Law Coverage
          </a>
          <a
            href="#tool"
            className="mobile-cta"
            role="menuitem"
            onClick={() => goToTab('understand')}
          >
            Analyze a Document →
          </a>
        </nav>
      </div>
    </>
  );
}
