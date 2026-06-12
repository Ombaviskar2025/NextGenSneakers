import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ModelPreloader } from '../services/ModelPreloader';

interface ShoeViewerWithPlaceholderProps {
  modelId: string;
  title: string;
  placeholderSrc?: string;
  className?: string;
  /** Extra Sketchfab embed URL params (e.g. ui_controls=1) */
  extraParams?: string;
  /** Mask styling for the container */
  maskStyle?: React.CSSProperties;
  /** Custom iframe className */
  iframeClassName?: string;
}

const DEFAULT_PLACEHOLDER = '/hero-shoe.png';

export const ShoeViewerWithPlaceholder: React.FC<ShoeViewerWithPlaceholderProps> = ({
  modelId,
  title,
  placeholderSrc = DEFAULT_PLACEHOLDER,
  className = '',
  extraParams = '',
  maskStyle,
  iframeClassName = '',
}) => {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Build the full Sketchfab embed URL
  const baseParams = `autostart=1&transparent=1&ui_theme=dark&ui_controls=0&ui_infos=0&ui_stop=0&ui_inspector=0&ui_watermark_link=0&ui_watermark=0&ui_ar=0&ui_help=0&ui_settings=0&ui_vr=0&ui_fullscreen=0&ui_annotations=0&ui_title=0&ui_author=0&ui_hint=0&camera=0&preload=1&scrollwheel=0&dnt=1&max_texture_size=1024&graph_optimizer=1`;
  const allParams = extraParams ? `${baseParams}&${extraParams}` : baseParams;
  const iframeSrc = `https://sketchfab.com/models/${modelId}/embed?${allParams}`;

  // Trigger preload when this component mounts
  useEffect(() => {
    ModelPreloader.preloadModel(modelId);
  }, [modelId]);

  // Reset state when modelId changes (user switches shoes)
  useEffect(() => {
    setIframeLoaded(false);
    setShowPlaceholder(true);
    if (fadeTimerRef.current) {
      clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
  }, [modelId]);

  // Handle iframe load complete
  const handleIframeLoad = useCallback(() => {
    setIframeLoaded(true);
    // Keep placeholder visible for an extra 300ms to let Sketchfab's
    // internal renderer initialize, then start the crossfade
    fadeTimerRef.current = setTimeout(() => {
      setShowPlaceholder(false);
    }, 400);
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, []);

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={maskStyle}
    >
      {/* Layer 1: Sketchfab iframe (behind placeholder) */}
      <iframe
        ref={iframeRef}
        key={modelId}
        title={title}
        src={iframeSrc}
        className={`absolute inset-0 w-full h-full border-0 ${iframeClassName}`}
        style={{
          background: 'transparent',
          opacity: iframeLoaded ? 1 : 0,
          transition: 'opacity 0.5s ease-in-out',
          zIndex: 1,
        }}
        allow="autoplay; fullscreen; xr-spatial-tracking"
        onLoad={handleIframeLoad}
      />

      {/* Layer 2: Placeholder image (on top, fades out when 3D is ready) */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          zIndex: 2,
          opacity: showPlaceholder ? 1 : 0,
          transition: 'opacity 0.6s ease-in-out',
          pointerEvents: showPlaceholder ? 'auto' : 'none',
        }}
      >
        <img
          src={placeholderSrc}
          alt={`${title} preview`}
          className="w-full h-full object-contain"
          style={{
            filter: 'drop-shadow(0 8px 32px rgba(0,0,0,0.5))',
          }}
        />

        {/* Subtle shimmer animation on the placeholder */}
        {showPlaceholder && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.03) 50%, transparent 100%)',
              animation: 'shimmer 2s infinite',
            }}
          />
        )}
      </div>

      {/* Inline keyframes for shimmer */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};
