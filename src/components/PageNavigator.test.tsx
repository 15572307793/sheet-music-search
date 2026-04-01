import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PageNavigator from './PageNavigator';

function createTouch(target: Element, id: number, clientX: number, clientY: number): Touch {
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
  Object.defineProperty(list, 'item', { value: (i: number) => touches[i] ?? null });
  return list;
}

describe('PageNavigator', () => {
  const defaultProps = {
    currentPage: 2,
    totalPages: 5,
    onPageChange: vi.fn(),
  };

  it('displays current page and total pages', () => {
    render(<PageNavigator {...defaultProps} />);
    expect(screen.getByTestId('page-indicator').textContent).toBe('2/5');
  });

  it('displays 1/1 for single page', () => {
    render(<PageNavigator currentPage={1} totalPages={1} onPageChange={vi.fn()} />);
    expect(screen.getByTestId('page-indicator').textContent).toBe('1/1');
  });

  it('calls onPageChange with previous page when clicking previous button', () => {
    const onPageChange = vi.fn();
    render(<PageNavigator currentPage={3} totalPages={5} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByLabelText('上一页'));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('calls onPageChange with next page when clicking next button', () => {
    const onPageChange = vi.fn();
    render(<PageNavigator currentPage={3} totalPages={5} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByLabelText('下一页'));
    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it('disables previous button on first page', () => {
    render(<PageNavigator currentPage={1} totalPages={5} onPageChange={vi.fn()} />);
    expect(screen.getByLabelText('上一页')).toBeDisabled();
  });

  it('disables next button on last page', () => {
    render(<PageNavigator currentPage={5} totalPages={5} onPageChange={vi.fn()} />);
    expect(screen.getByLabelText('下一页')).toBeDisabled();
  });

  it('disables both buttons when totalPages is 1', () => {
    render(<PageNavigator currentPage={1} totalPages={1} onPageChange={vi.fn()} />);
    expect(screen.getByLabelText('上一页')).toBeDisabled();
    expect(screen.getByLabelText('下一页')).toBeDisabled();
  });

  it('enables both buttons on a middle page', () => {
    render(<PageNavigator currentPage={3} totalPages={5} onPageChange={vi.fn()} />);
    expect(screen.getByLabelText('上一页')).not.toBeDisabled();
    expect(screen.getByLabelText('下一页')).not.toBeDisabled();
  });

  it('navigates to previous page on swipe right', () => {
    const onPageChange = vi.fn();
    render(<PageNavigator currentPage={3} totalPages={5} onPageChange={onPageChange} />);
    const container = screen.getByTestId('page-navigator');

    const touchStart = createTouch(container, 0, 200, 100);
    fireEvent.touchStart(container, { touches: makeTouchList(touchStart) });

    const touchEnd = createTouch(container, 0, 300, 100);
    fireEvent.touchEnd(container, { changedTouches: makeTouchList(touchEnd) });

    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('navigates to next page on swipe left', () => {
    const onPageChange = vi.fn();
    render(<PageNavigator currentPage={3} totalPages={5} onPageChange={onPageChange} />);
    const container = screen.getByTestId('page-navigator');

    const touchStart = createTouch(container, 0, 300, 100);
    fireEvent.touchStart(container, { touches: makeTouchList(touchStart) });

    const touchEnd = createTouch(container, 0, 200, 100);
    fireEvent.touchEnd(container, { changedTouches: makeTouchList(touchEnd) });

    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it('does not navigate on small swipe (below threshold)', () => {
    const onPageChange = vi.fn();
    render(<PageNavigator currentPage={3} totalPages={5} onPageChange={onPageChange} />);
    const container = screen.getByTestId('page-navigator');

    const touchStart = createTouch(container, 0, 200, 100);
    fireEvent.touchStart(container, { touches: makeTouchList(touchStart) });

    const touchEnd = createTouch(container, 0, 230, 100);
    fireEvent.touchEnd(container, { changedTouches: makeTouchList(touchEnd) });

    expect(onPageChange).not.toHaveBeenCalled();
  });

  it('does not swipe left past last page', () => {
    const onPageChange = vi.fn();
    render(<PageNavigator currentPage={5} totalPages={5} onPageChange={onPageChange} />);
    const container = screen.getByTestId('page-navigator');

    const touchStart = createTouch(container, 0, 300, 100);
    fireEvent.touchStart(container, { touches: makeTouchList(touchStart) });

    const touchEnd = createTouch(container, 0, 200, 100);
    fireEvent.touchEnd(container, { changedTouches: makeTouchList(touchEnd) });

    expect(onPageChange).not.toHaveBeenCalled();
  });

  it('does not swipe right past first page', () => {
    const onPageChange = vi.fn();
    render(<PageNavigator currentPage={1} totalPages={5} onPageChange={onPageChange} />);
    const container = screen.getByTestId('page-navigator');

    const touchStart = createTouch(container, 0, 200, 100);
    fireEvent.touchStart(container, { touches: makeTouchList(touchStart) });

    const touchEnd = createTouch(container, 0, 300, 100);
    fireEvent.touchEnd(container, { changedTouches: makeTouchList(touchEnd) });

    expect(onPageChange).not.toHaveBeenCalled();
  });
});
