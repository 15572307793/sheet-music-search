import { useOnlineStatus } from '../hooks/useOnlineStatus';

export default function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="alert"
      className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white text-center text-sm py-2 px-4"
      style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}
    >
      当前无网络连接，请检查网络后重试
    </div>
  );
}
