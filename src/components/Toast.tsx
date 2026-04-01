import { useToast } from '../context/ToastContext';

const typeStyles: Record<string, string> = {
  success: 'bg-green-500 text-white',
  error: 'bg-red-500 text-white',
  info: 'bg-blue-500 text-white',
};

export default function Toast() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-0 left-0 right-0 z-50 flex flex-col items-center gap-2 pt-4 px-4 pointer-events-none"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="alert"
          className={`pointer-events-auto w-full max-w-sm rounded-lg px-4 py-3 shadow-lg animate-slide-down flex items-center justify-between ${typeStyles[toast.type] ?? typeStyles.info}`}
        >
          <span className="text-sm font-medium">{toast.message}</span>
          <button
            type="button"
            aria-label="关闭提示"
            onClick={() => removeToast(toast.id)}
            className="ml-3 shrink-0 rounded p-1 hover:bg-white/20 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
