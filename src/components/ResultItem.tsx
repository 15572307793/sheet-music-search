import type { ResultItemProps } from '../types/components';
import Thumbnail from './Thumbnail';
import QualityTag from './QualityTag';
import DownloadButton from './DownloadButton';

export default function ResultItem({ item, onPreview, onDownload }: ResultItemProps) {
  return (
    <article className="flex gap-3 rounded-lg border border-gray-200 bg-white p-3">
      <Thumbnail src={item.thumbnailUrl} alt={item.title} onClick={onPreview} />

      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          <button
            type="button"
            onClick={onPreview}
            className="block truncate text-left text-sm font-semibold text-gray-900 hover:text-blue-600"
          >
            {item.title}
          </button>

          <p className="mt-0.5 text-xs text-gray-500">
            <span>{item.sourceName}</span>
            <span className="mx-1">·</span>
            <a
              href={item.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              查看原始来源
            </a>
          </p>

          {item.qualityTags.length > 0 && (
            <div className="mt-1 flex gap-1">
              {item.qualityTags.map((tag) => (
                <QualityTag key={tag} tag={tag} />
              ))}
            </div>
          )}
        </div>

        <div className="mt-2">
          <DownloadButton item={item} onDownload={onDownload} />
        </div>
      </div>
    </article>
  );
}
