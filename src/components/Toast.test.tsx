import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Toast from './Toast';
import { ToastProvider, useToast } from '../context/ToastContext';

function ToastTrigger({ message, type }: { message: string; type: 'success' | 'error' | 'info' }) {
  const { showToast } = useToast();
  return <button onClick={() => showToast(message, type)}>Show Toast</button>;
}

function renderWithProvider(ui: React.ReactElement, autoDismissMs = 3000) {
  return render(
    <ToastProvider autoDismissMs={autoDismissMs}>
      {ui}
    </ToastProvider>,
  );
}

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders nothing when there are no toasts', () => {
    const { container } = renderWithProvider(<Toast />);
    expect(container.querySelector('[aria-live]')).toBeNull();
  });

  it('shows a success toast with green styling', () => {
    renderWithProvider(
      <>
        <ToastTrigger message="操作成功" type="success" />
        <Toast />
      </>,
    );

    fireEvent.click(screen.getByText('Show Toast'));
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('操作成功');
    expect(alert.className).toContain('bg-green-500');
  });

  it('shows an error toast with red styling', () => {
    renderWithProvider(
      <>
        <ToastTrigger message="下载失败" type="error" />
        <Toast />
      </>,
    );

    fireEvent.click(screen.getByText('Show Toast'));
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('下载失败');
    expect(alert.className).toContain('bg-red-500');
  });

  it('shows an info toast with blue styling', () => {
    renderWithProvider(
      <>
        <ToastTrigger message="请输入曲谱名称" type="info" />
        <Toast />
      </>,
    );

    fireEvent.click(screen.getByText('Show Toast'));
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('请输入曲谱名称');
    expect(alert.className).toContain('bg-blue-500');
  });

  it('auto-dismisses after the configured timeout', () => {
    renderWithProvider(
      <>
        <ToastTrigger message="即将消失" type="info" />
        <Toast />
      </>,
      3000,
    );

    fireEvent.click(screen.getByText('Show Toast'));
    expect(screen.getByText('即将消失')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.queryByText('即将消失')).not.toBeInTheDocument();
  });

  it('supports multiple stacked toasts', () => {
    function MultiTrigger() {
      const { showToast } = useToast();
      return (
        <>
          <button onClick={() => showToast('第一条', 'success')}>Toast 1</button>
          <button onClick={() => showToast('第二条', 'error')}>Toast 2</button>
          <button onClick={() => showToast('第三条', 'info')}>Toast 3</button>
        </>
      );
    }

    renderWithProvider(
      <>
        <MultiTrigger />
        <Toast />
      </>,
    );

    fireEvent.click(screen.getByText('Toast 1'));
    fireEvent.click(screen.getByText('Toast 2'));
    fireEvent.click(screen.getByText('Toast 3'));

    const alerts = screen.getAllByRole('alert');
    expect(alerts).toHaveLength(3);
    expect(alerts[0]).toHaveTextContent('第一条');
    expect(alerts[1]).toHaveTextContent('第二条');
    expect(alerts[2]).toHaveTextContent('第三条');
  });

  it('removes a toast when close button is clicked', () => {
    renderWithProvider(
      <>
        <ToastTrigger message="可关闭" type="info" />
        <Toast />
      </>,
    );

    fireEvent.click(screen.getByText('Show Toast'));
    expect(screen.getByText('可关闭')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('关闭提示'));
    expect(screen.queryByText('可关闭')).not.toBeInTheDocument();
  });
});

describe('useToast', () => {
  it('throws when used outside ToastProvider', () => {
    function BadComponent() {
      useToast();
      return null;
    }

    expect(() => render(<BadComponent />)).toThrow(
      'useToast must be used within a ToastProvider',
    );
  });
});
