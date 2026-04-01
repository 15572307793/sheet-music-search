import { useState } from 'react';

interface ThumbnailProps {
  src: string;
  alt: string;
  onClick?: () => void;
}

export default function Thumbnail({ src, alt, onClick }: ThumbnailProps) {
  const [failed, setFailed] = useState(false);

  const proxiedSrc = `/api/images?url=${encodeURIComponent(src)}`;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-shrink-0 overflow-hidden rounded border border-gray-200 bg-gray-50"
      style={{ minWidth: 80, minHeight: 120 }}
      aria-label={alt}
    >
      {failed ? (
        <div
          className="flex items-center justify-center text-gray-400"
          style={{ width: 80, height: 120 }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-10 w-10"
            aria-hidden="true"
          >
            <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6Z" />
          </svg>
        </div>
      ) : (
        <img
          src={proxiedSrc}
          alt={alt}
          className="object-cover"
          style={{ minWidth: 80, minHeight: 120 }}
          onError={() => setFailed(true)}
        />
      )}
    </button>
  );
}
