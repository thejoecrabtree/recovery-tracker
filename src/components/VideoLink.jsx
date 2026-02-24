import { useState } from 'react';
import { getVideoUrl } from '../data/videos';

function extractVideoId(url) {
  if (!url) return null;
  const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

function VideoModal({ videoId, onClose }) {
  if (!videoId) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white/70 active:text-white text-sm font-medium"
        >
          Close
        </button>
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            className="absolute inset-0 w-full h-full rounded-xl"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
            title="Exercise Demo"
            allow="autoplay; encrypted-media"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}

export default function VideoLink({ movement }) {
  const url = getVideoUrl(movement);
  const videoId = extractVideoId(url);
  const [showVideo, setShowVideo] = useState(false);

  if (!url || !videoId) return null;

  return (
    <>
      <button
        onClick={e => {
          e.stopPropagation();
          setShowVideo(true);
        }}
        className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-950/40 text-red-400 hover:bg-red-900/50 active:bg-red-800/50 shrink-0 ml-1"
        title="Watch demo video"
      >
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
      </button>
      {showVideo && (
        <VideoModal videoId={videoId} onClose={() => setShowVideo(false)} />
      )}
    </>
  );
}

export function MovementWithVideo({ text, className = '' }) {
  return (
    <div className="flex items-center gap-1">
      <p className={`text-sm text-slate-300 flex-1 ${className}`}>{text}</p>
      <VideoLink movement={text} />
    </div>
  );
}
