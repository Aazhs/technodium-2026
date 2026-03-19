import { useEffect, useRef, useState } from 'react';

type CursorVariant = 'default' | 'hover' | 'block' | 'text';

const INTERACTIVE_SELECTOR = [
  'a',
  'button',
  'select',
  'label',
  '[role="button"]',
  '.magic-hover',
  '.nav-toggle'
].join(', ');

const BLOCK_SELECTOR = [
  'button',
  'select',
  '.btn',
  '.magic-hover__square',
  '.nav-cta',
  '.nav-logout',
  '.nav-toggle',
  '.hero-stat-item',
  '.round-card',
  '.step-card',
  '.winner-card',
  '.dash-card',
  '.ps-card',
  '.detail-block',
  '.form-container',
  '.participation-prize'
].join(', ');

const TEXT_INPUT_SELECTOR = [
  'input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="button"]):not([type="submit"]):not([type="reset"])',
  'textarea',
  '[contenteditable="true"]'
].join(', ');

function canUseCustomCursor() {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

function getCursorVariant(target: EventTarget | null): CursorVariant {
  if (!(target instanceof Element)) {
    return 'default';
  }

  if (target.closest(TEXT_INPUT_SELECTOR)) {
    return 'text';
  }

  if (target.closest(BLOCK_SELECTOR)) {
    return 'block';
  }

  if (target.closest(INTERACTIVE_SELECTOR)) {
    return 'hover';
  }

  return 'default';
}

function setCursorPosition(node: HTMLDivElement | null, x: number, y: number) {
  if (!node) {
    return;
  }

  node.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
}

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const coreRef = useRef<HTMLDivElement | null>(null);
  const targetRef = useRef({ x: 0, y: 0 });
  const positionRef = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number | null>(null);
  const visibleRef = useRef(false);
  const variantRef = useRef<CursorVariant>('default');
  const pressedRef = useRef(false);

  const [enabled] = useState(canUseCustomCursor);
  const [visible, setVisible] = useState(false);
  const [variant, setVariant] = useState<CursorVariant>('default');
  const [pressed, setPressed] = useState(false);

  useEffect(() => {
    if (!enabled) {
      document.body.classList.remove('custom-cursor-enabled');
      return;
    }

    document.body.classList.add('custom-cursor-enabled');

    const setVisibleState = (nextVisible: boolean) => {
      if (visibleRef.current === nextVisible) {
        return;
      }

      visibleRef.current = nextVisible;
      setVisible(nextVisible);
    };

    const setVariantState = (nextVariant: CursorVariant) => {
      if (variantRef.current === nextVariant) {
        return;
      }

      variantRef.current = nextVariant;
      setVariant(nextVariant);
    };

    const setPressedState = (nextPressed: boolean) => {
      if (pressedRef.current === nextPressed) {
        return;
      }

      pressedRef.current = nextPressed;
      setPressed(nextPressed);
    };

    const stopAnimation = () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };

    const tick = () => {
      const nextX = positionRef.current.x + (targetRef.current.x - positionRef.current.x) * 0.18;
      const nextY = positionRef.current.y + (targetRef.current.y - positionRef.current.y) * 0.18;

      positionRef.current = { x: nextX, y: nextY };
      setCursorPosition(cursorRef.current, nextX, nextY);

      if (Math.abs(targetRef.current.x - nextX) < 0.2 && Math.abs(targetRef.current.y - nextY) < 0.2) {
        positionRef.current = { ...targetRef.current };
        setCursorPosition(cursorRef.current, targetRef.current.x, targetRef.current.y);
        animationFrameRef.current = null;
        return;
      }

      animationFrameRef.current = window.requestAnimationFrame(tick);
    };

    const startAnimation = () => {
      if (animationFrameRef.current === null) {
        animationFrameRef.current = window.requestAnimationFrame(tick);
      }
    };

    const handleMove = (event: MouseEvent) => {
      const nextPosition = { x: event.clientX, y: event.clientY };
      targetRef.current = nextPosition;

      if (!visibleRef.current) {
        positionRef.current = nextPosition;
        setCursorPosition(cursorRef.current, nextPosition.x, nextPosition.y);
      }

      setCursorPosition(coreRef.current, nextPosition.x, nextPosition.y);
      setVisibleState(true);
      setVariantState(getCursorVariant(event.target));
      startAnimation();
    };

    const handleOver = (event: MouseEvent) => {
      setVariantState(getCursorVariant(event.target));
    };

    const handleDown = () => {
      setPressedState(true);
    };

    const handleUp = () => {
      setPressedState(false);
    };

    const handleWindowOut = (event: MouseEvent) => {
      if (event.relatedTarget) {
        return;
      }

      stopAnimation();
      setVisibleState(false);
      setVariantState('default');
      setPressedState(false);
    };

    const handleBlur = () => {
      stopAnimation();
      setVisibleState(false);
      setVariantState('default');
      setPressedState(false);
    };

    document.addEventListener('mousemove', handleMove, { passive: true });
    document.addEventListener('mouseover', handleOver, { passive: true });
    document.addEventListener('mousedown', handleDown);
    document.addEventListener('mouseup', handleUp);
    window.addEventListener('mouseout', handleWindowOut);
    window.addEventListener('blur', handleBlur);

    return () => {
      stopAnimation();
      document.body.classList.remove('custom-cursor-enabled');
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseover', handleOver);
      document.removeEventListener('mousedown', handleDown);
      document.removeEventListener('mouseup', handleUp);
      window.removeEventListener('mouseout', handleWindowOut);
      window.removeEventListener('blur', handleBlur);
    };
  }, [enabled]);

  if (!enabled) {
    return null;
  }

  return (
    <>
      <div
        className={`custom-cursor${visible ? ' is-visible' : ''}${pressed ? ' is-pressed' : ''}`}
        data-variant={variant}
        aria-hidden="true"
        ref={cursorRef}
      >
        <div className="custom-cursor__frame"></div>
      </div>
      <div
        className={`custom-cursor__core${visible ? ' is-visible' : ''}${pressed ? ' is-pressed' : ''}`}
        data-variant={variant}
        aria-hidden="true"
        ref={coreRef}
      >
        <div className="custom-cursor__core-shape"></div>
      </div>
    </>
  );
}
