import type { QualityTag as QualityTagType } from '../types/index';

interface QualityTagProps {
  tag: QualityTagType;
}

const tagStyles: Record<QualityTagType, string> = {
  '高清': 'bg-green-100 text-green-700',
  '推荐': 'bg-blue-100 text-blue-700',
};

export default function QualityTag({ tag }: QualityTagProps) {
  return (
    <span
      className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${tagStyles[tag]}`}
    >
      {tag}
    </span>
  );
}
