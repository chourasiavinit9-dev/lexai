'use client';

import { useEffect, useMemo, useState } from 'react';

export type RobotState =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'responding'
  | 'success'
  | 'error';

interface Props {
  readonly state: RobotState;
  readonly size?: 'sm' | 'md' | 'lg';
}

/** Maps RobotState → RuiBo asset path */
const ASSET: Record<RobotState, string> = {
  idle:       '/ruibo/idle.png',
  listening:  '/ruibo/listening.png',
  thinking:   '/ruibo/thinking.png',
  responding: '/ruibo/listening.png',
  success:    '/ruibo/success.png',
  error:      '/ruibo/error.png',
};

const SIZE_PX: Record<NonNullable<Props['size']>, number> = {
  sm: 64,
  md: 110,
  lg: 160,
};

/** Inline keyframe animations per state */
const ANIM: Record<RobotState, string> = {
  idle:       'ruibo-breathe 4.8s ease-in-out infinite',
  listening:  'ruibo-attentive 1.8s ease-in-out infinite',
  thinking:   'ruibo-think 1.7s ease-in-out infinite',
  responding: 'ruibo-attentive 1.4s ease-in-out infinite',
  success:    'ruibo-success 700ms cubic-bezier(.2,.8,.2,1) both',
  error:      'ruibo-error 500ms ease-out both',
};

export function RobotSVG({ state, size = 'md' }: Props) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const px = SIZE_PX[size];
  const src = useMemo(() => ASSET[state], [state]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  return (
    <>
      {/* Inject keyframes once */}
      <style>{`
        @keyframes ruibo-breathe {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-3px) scale(1.012); }
        }
        @keyframes ruibo-attentive {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-2px) rotate(-1.5deg); }
        }
        @keyframes ruibo-think {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          35% { transform: translateY(-3px) rotate(-2.5deg); }
          70% { transform: translateY(-1px) rotate(2deg); }
        }
        @keyframes ruibo-success {
          0% { transform: translateY(8px) scale(.92); opacity: .5; }
          65% { transform: translateY(-5px) scale(1.06); opacity: 1; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes ruibo-error {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-4px) rotate(-2deg); }
          50% { transform: translateX(4px) rotate(2deg); }
          80% { transform: translateX(-2px) rotate(-1deg); }
        }
      `}</style>

      <div
        className={`robot-svg robot-svg--${state}`}
        aria-hidden="true"
        style={{
          width: px,
          height: px,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {/* Glow halo */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: state === 'error'
              ? 'radial-gradient(circle, rgba(201,54,54,0.18) 0%, transparent 70%)'
              : state === 'success'
              ? 'radial-gradient(circle, rgba(22,128,91,0.18) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(245,197,24,0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* RuiBo image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={src}
          src={src}
          alt=""
          width={px}
          height={px}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            objectPosition: 'center',
            userSelect: 'none',
            WebkitUserDrag: 'none' as React.CSSProperties['userSelect'],
            animation: reducedMotion ? 'none' : ANIM[state],
            filter: 'drop-shadow(0 8px 16px rgba(16,24,40,0.18))',
            position: 'relative',
            zIndex: 1,
          } as React.CSSProperties}
          draggable={false}
        />
      </div>
    </>
  );
}
