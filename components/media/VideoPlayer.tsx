"use client";

import { useState } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";

interface VideoPlayerProps {
  src: string;
  thumbnail?: string;
  autoPlay?: boolean;
  controls?: boolean;
  className?: string;
}

export function VideoPlayer({ 
  src, 
  thumbnail, 
  autoPlay = false,
  controls = true,
  className = ""
}: VideoPlayerProps) {
  const [playing, setPlaying] = useState(autoPlay);
  const [muted, setMuted] = useState(false);

  return (
    <div className={`relative aspect-video bg-black rounded-lg overflow-hidden ${className}`}>
      <video
        src={src}
        poster={thumbnail}
        controls={controls}
        autoPlay={autoPlay}
        muted={muted}
        playsInline
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        className="w-full h-full object-contain"
      />
      
      {/* Custom controls overlay (optional) */}
      {!controls && (
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={(e) => {
              const video = e.currentTarget.parentElement?.querySelector('video');
              if (video) {
                if (playing) {
                  video.pause();
                } else {
                  video.play();
                }
              }
            }}
            className="w-16 h-16 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
          >
            {playing ? (
              <Pause className="w-8 h-8 text-white" />
            ) : (
              <Play className="w-8 h-8 text-white ml-1" />
            )}
          </button>
        </div>
      )}
      
      {/* Mute toggle */}
      {!controls && (
        <button
          onClick={() => setMuted(!muted)}
          className="absolute top-2 right-2 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
        >
          {muted ? (
            <VolumeX className="w-4 h-4 text-white" />
          ) : (
            <Volume2 className="w-4 h-4 text-white" />
          )}
        </button>
      )}
    </div>
  );
}

