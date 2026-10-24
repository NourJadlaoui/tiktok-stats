import { TikTokVideo } from '@/lib/types';
import { formatCompactNumber } from '@/lib/stats';
import { format } from 'date-fns';
import { Heart, Eye, MessageCircle } from 'lucide-react';

export default function VideoCard({ video }: { video: TikTokVideo }) {
  return (
    <a
      href={video.videoUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="card group flex flex-col overflow-hidden transition hover:border-tiktok-pink"
    >
      <div className="relative aspect-[9/14] w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={video.thumbnailUrl}
          alt={video.description}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-2.5">
        {/* min-h reserves space for a full 2 lines even when the caption is
            shorter, so every card in a row lines up at the same height
            regardless of how long each video's caption happens to be. */}
        <p className="line-clamp-2 min-h-[2.25rem] text-xs font-medium leading-snug">{video.description}</p>
        <div className="mt-auto flex items-center justify-between text-[11px] text-neutral-400">
          <span>{format(new Date(video.createdAt), 'MMM d, yyyy')}</span>
        </div>
        <div className="flex items-center gap-2.5 text-[11px] text-neutral-500">
          <span className="flex items-center gap-1">
            <Eye size={11} /> {formatCompactNumber(video.views)}
          </span>
          <span className="flex items-center gap-1">
            <Heart size={11} /> {formatCompactNumber(video.likes)}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle size={11} /> {formatCompactNumber(video.comments)}
          </span>
        </div>
      </div>
    </a>
  );
}
