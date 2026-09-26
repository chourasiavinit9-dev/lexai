'use client';

import React from 'react';

interface LoaderProps {
  readonly size?: string;
  readonly color?: string;
  readonly className?: string;
}

export const Loader = ({ size = '2.8rem', color = 'var(--gold, #c99a3e)', className = '' }: LoaderProps) => {
  return (
    <div
      className={`dot-spinner-wrapper ${className}`}
      style={{
        ['--uib-size' as string]: size,
        ['--uib-color' as string]: color,
      }}
      role="status"
      aria-label="Loading"
    >
      <div className="dot-spinner">
        <div className="dot-spinner__dot" />
        <div className="dot-spinner__dot" />
        <div className="dot-spinner__dot" />
        <div className="dot-spinner__dot" />
        <div className="dot-spinner__dot" />
        <div className="dot-spinner__dot" />
        <div className="dot-spinner__dot" />
        <div className="dot-spinner__dot" />
      </div>
    </div>
  );
};

export default Loader;
