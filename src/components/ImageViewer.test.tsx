import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ImageViewer from './ImageViewer';

function createTouch(
  target: Element,
  id: number,
  clientX: number,
  clientY: number
): Touch {
  return {
    identifier: id,
    target,
    clientX,
    clientY,
    pageX: clientX,
    pageY: clientY,
    screenX: clientX,
    screenY: clientY,
    radiusX: 0,
    radiusY: 0,
    rotationAngle: 0,
    force: 0,
  };
}

function makeTouchList(...touches: Touch[]): TouchList {
  const list = touches as unknown as TouchList;
  Object.defineProperty(list, 'length', { value: touches.length });
  Object.defineProperty(list, 'item', {
    value: (i: number) => touches[i] ?? null,
  });
  return list;
}

describe('ImageViewer', () => {
  const defaultProps = {
    src: 'https://example.com/sheet.jpg',
    alt: '乐谱图片',
  };

  it('renders an image with the provided src and alt', () => {
    render(<ImageViewer {...defaultProps} />);
    const img = screen.getByRole('img', { name: '乐谱图片' });
    expect(img).toHaveAttribute('src', defaultProps.src);
    expect(img).toHaveAttribute('alt', defaultProps.alt);
  });

  it('renders a container with touch-none class', () => {
    render(<ImageViewer {...defaultProps} />);
    const container = screen.getByTestId('image-viewer');
    expect(container.classList.contains('touch-none')).toBe(true);
  });

  it('starts with scale 1 and no translation', () => {
    render(<ImageViewer {...defaultProps} />);
    const img = screen.getByRole('img', { name: '乐谱图片' });
    expect(img.style.transform).toBe('translate(0px, 0px) scale(1)');
  });

  it('resets zoom on double-tap', () => {
    render(<ImageViewer {...defaultProps} />);
    const container = screen.getByTestId('image-viewer');
    const img = screen.getByRole('img', { name: '乐谱图片' });

    const touch = createTouch(container, 0, 100, 100);
    const touchList = makeTouchList(touch);

    // Simulate pinch to zoom in first
    const t1 = createTouch(container, 0, 100, 100);
    const t2 = createTouch(container, 1, 200, 200);
    const twoTouchList = makeTouchList(t1, t2);

    fireEvent.touchStart(container, { touches: twoTouchList });

    const t1Moved = createTouch(container, 0, 50, 50);
    const t2Moved = createTouch(container, 1, 250, 250);
    const movedTouchList = makeTouchList(t1Moved, t2Moved);

    fireEvent.touchMove(container, { touches: movedTouchList });
    fireEvent.touchEnd(container, { touches: makeTouchList() });

    // Verify zoomed in
    expect(img.style.transform).not.toBe('translate(0px, 0px) scale(1)');

    // Double-tap to reset
    fireEvent.touchStart(container, { touches: touchList });
    fireEvent.touchEnd(container, { touches: makeTouchList() });

    // Second tap within 300ms
    fireEvent.touchStart(container, { touches: touchList });

    expect(img.style.transform).toBe('translate(0px, 0px) scale(1)');
  });

  it('applies pinch-to-zoom with two fingers', () => {
    render(<ImageViewer {...defaultProps} />);
    const container = screen.getByTestId('image-viewer');
    const img = screen.getByRole('img', { name: '乐谱图片' });

    const t1 = createTouch(container, 0, 100, 100);
    const t2 = createTouch(container, 1, 200, 200);
    const startTouches = makeTouchList(t1, t2);

    fireEvent.touchStart(container, { touches: startTouches });

    // Move fingers apart (zoom in)
    const t1Moved = createTouch(container, 0, 50, 50);
    const t2Moved = createTouch(container, 1, 250, 250);
    const moveTouches = makeTouchList(t1Moved, t2Moved);

    fireEvent.touchMove(container, { touches: moveTouches });
    fireEvent.touchEnd(container, { touches: makeTouchList() });

    // Scale should be > 1 after zooming in
    const transform = img.style.transform;
    const scaleMatch = transform.match(/scale\(([^)]+)\)/);
    expect(scaleMatch).not.toBeNull();
    const scaleValue = parseFloat(scaleMatch![1]);
    expect(scaleValue).toBeGreaterThan(1);
  });

  it('constrains zoom to max 5x', () => {
    render(<ImageViewer {...defaultProps} />);
    const container = screen.getByTestId('image-viewer');
    const img = screen.getByRole('img', { name: '乐谱图片' });

    // Simulate extreme zoom
    for (let i = 0; i < 10; i++) {
      const t1 = createTouch(container, 0, 10, 10);
      const t2 = createTouch(container, 1, 20, 20);
      fireEvent.touchStart(container, { touches: makeTouchList(t1, t2) });

      const t1m = createTouch(container, 0, 0, 0);
      const t2m = createTouch(container, 1, 300, 300);
      fireEvent.touchMove(container, { touches: makeTouchList(t1m, t2m) });
      fireEvent.touchEnd(container, { touches: makeTouchList() });
    }

    const transform = img.style.transform;
    const scaleMatch = transform.match(/scale\(([^)]+)\)/);
    const scaleValue = parseFloat(scaleMatch![1]);
    expect(scaleValue).toBeLessThanOrEqual(5);
  });

  it('constrains zoom to min 1x', () => {
    render(<ImageViewer {...defaultProps} />);
    const container = screen.getByTestId('image-viewer');
    const img = screen.getByRole('img', { name: '乐谱图片' });

    // Simulate pinch to zoom out (fingers moving closer)
    const t1 = createTouch(container, 0, 50, 50);
    const t2 = createTouch(container, 1, 250, 250);
    fireEvent.touchStart(container, { touches: makeTouchList(t1, t2) });

    const t1m = createTouch(container, 0, 140, 140);
    const t2m = createTouch(container, 1, 160, 160);
    fireEvent.touchMove(container, { touches: makeTouchList(t1m, t2m) });
    fireEvent.touchEnd(container, { touches: makeTouchList() });

    const transform = img.style.transform;
    const scaleMatch = transform.match(/scale\(([^)]+)\)/);
    const scaleValue = parseFloat(scaleMatch![1]);
    expect(scaleValue).toBeGreaterThanOrEqual(1);
  });

  it('supports single-finger drag when zoomed in', () => {
    render(<ImageViewer {...defaultProps} />);
    const container = screen.getByTestId('image-viewer');
    const img = screen.getByRole('img', { name: '乐谱图片' });

    // First zoom in
    const t1 = createTouch(container, 0, 100, 100);
    const t2 = createTouch(container, 1, 200, 200);
    fireEvent.touchStart(container, { touches: makeTouchList(t1, t2) });

    const t1m = createTouch(container, 0, 50, 50);
    const t2m = createTouch(container, 1, 250, 250);
    fireEvent.touchMove(container, { touches: makeTouchList(t1m, t2m) });
    fireEvent.touchEnd(container, { touches: makeTouchList() });

    // Now drag with single finger
    const dragStart = createTouch(container, 0, 150, 150);
    fireEvent.touchStart(container, { touches: makeTouchList(dragStart) });

    const dragMove = createTouch(container, 0, 180, 200);
    fireEvent.touchMove(container, { touches: makeTouchList(dragMove) });
    fireEvent.touchEnd(container, { touches: makeTouchList() });

    // Translation should have changed
    const transform = img.style.transform;
    const translateMatch = transform.match(/translate\(([^,]+)px,\s*([^)]+)px\)/);
    expect(translateMatch).not.toBeNull();
    // At least one axis should have moved
    const tx = parseFloat(translateMatch![1]);
    const ty = parseFloat(translateMatch![2]);
    expect(Math.abs(tx) + Math.abs(ty)).toBeGreaterThan(0);
  });

  it('does not drag when not zoomed in', () => {
    render(<ImageViewer {...defaultProps} />);
    const container = screen.getByTestId('image-viewer');
    const img = screen.getByRole('img', { name: '乐谱图片' });

    // Try to drag at scale 1
    const dragStart = createTouch(container, 0, 150, 150);
    fireEvent.touchStart(container, { touches: makeTouchList(dragStart) });

    const dragMove = createTouch(container, 0, 180, 200);
    fireEvent.touchMove(container, { touches: makeTouchList(dragMove) });
    fireEvent.touchEnd(container, { touches: makeTouchList() });

    // Translation should remain 0
    expect(img.style.transform).toBe('translate(0px, 0px) scale(1)');
  });

  it('sets draggable=false on the image', () => {
    render(<ImageViewer {...defaultProps} />);
    const img = screen.getByRole('img', { name: '乐谱图片' });
    expect(img.getAttribute('draggable')).toBe('false');
  });
});
