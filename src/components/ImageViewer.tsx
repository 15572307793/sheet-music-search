import { useRef, useState, useCallback, type TouchEvent } from 'react';

interface ImageViewerProps {
  src: string;
  alt: string;
}

const MIN_SCALE = 1;
const MAX_SCALE = 5;

interface Point {
  x: number;
  y: number;
}

interface TouchLike {
  clientX: number;
  clientY: number;
}

function getDistance(t1: TouchLike, t2: TouchLike): number {
  const dx = t1.clientX - t2.clientX;
  const dy = t1.clientY - t2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function getMidpoint(t1: TouchLike, t2: TouchLike): Point {
  return {
    x: (t1.clientX + t2.clientX) / 2,
    y: (t1.clientY + t2.clientY) / 2,
  };
}

export default function ImageViewer({ src, alt }: ImageViewerProps) {
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState<Point>({ x: 0, y: 0 });

  const lastTouchRef = useRef<Point | null>(null);
  const lastDistRef = useRef<number | null>(null);
  const lastMidRef = useRef<Point | null>(null);
  const lastTapRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const clampScale = (s: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));

  const resetView = useCallback(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, []);

  const handleTouchStart = useCallback(
    (e: TouchEvent<HTMLDivElement>) => {
      const touches = e.touches;

      if (touches.length === 1) {
        // Detect double-tap
        const now = Date.now();
        if (now - lastTapRef.current < 300) {
          e.preventDefault();
          resetView();
          lastTapRef.current = 0;
          return;
        }
        lastTapRef.current = now;
        lastTouchRef.current = { x: touches[0].clientX, y: touches[0].clientY };
      }

      if (touches.length === 2) {
        lastDistRef.current = getDistance(touches[0], touches[1]);
        lastMidRef.current = getMidpoint(touches[0], touches[1]);
      }
    },
    [resetView]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent<HTMLDivElement>) => {
      const touches = e.touches;

      if (touches.length === 2 && lastDistRef.current !== null) {
        e.preventDefault();
        const newDist = getDistance(touches[0], touches[1]);
        const ratio = newDist / lastDistRef.current;

        setScale((prev) => clampScale(prev * ratio));

        if (lastMidRef.current) {
          const newMid = getMidpoint(touches[0], touches[1]);
          setTranslate((prev) => ({
            x: prev.x + (newMid.x - lastMidRef.current!.x),
            y: prev.y + (newMid.y - lastMidRef.current!.y),
          }));
          lastMidRef.current = newMid;
        }

        lastDistRef.current = newDist;
        return;
      }

      if (touches.length === 1 && scale > 1 && lastTouchRef.current) {
        e.preventDefault();
        const dx = touches[0].clientX - lastTouchRef.current.x;
        const dy = touches[0].clientY - lastTouchRef.current.y;
        setTranslate((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
        lastTouchRef.current = { x: touches[0].clientX, y: touches[0].clientY };
      }
    },
    [scale]
  );

  const handleTouchEnd = useCallback(() => {
    lastTouchRef.current = null;
    lastDistRef.current = null;
    lastMidRef.current = null;
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden touch-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      data-testid="image-viewer"
    >
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-contain"
        style={{
          transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
          transformOrigin: 'center center',
          willChange: 'transform',
        }}
        draggable={false}
      />
    </div>
  );
}
