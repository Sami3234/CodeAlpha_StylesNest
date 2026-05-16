'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import Cropper, { Area, MediaSize } from 'react-easy-crop';

interface ImageCropperProps {
  image: File | string;
  aspectRatio: number;
  onCrop: (croppedFile: File) => void;
  onCancel: () => void;
  targetWidth: number;
  targetHeight: number;
}

/** Minimum zoom so the crop frame is filled (no empty gaps). */
function getCoverZoom(mediaWidth: number, mediaHeight: number, aspect: number): number {
  const mediaAspect = mediaWidth / mediaHeight;
  if (mediaAspect > aspect) {
    return mediaAspect / aspect;
  }
  return aspect / mediaAspect;
}

/** Zoom so the entire image is visible inside the crop frame (less zoomed in). */
function getFitZoom(mediaWidth: number, mediaHeight: number, aspect: number): number {
  const mediaAspect = mediaWidth / mediaHeight;
  if (mediaAspect > aspect) {
    return aspect / mediaAspect;
  }
  return mediaAspect / aspect;
}

type FitMode = 'fit' | 'cover';

export default function ImageCropper({
  image,
  aspectRatio,
  onCrop,
  onCancel,
  targetWidth,
  targetHeight,
}: ImageCropperProps) {
  const [imageSrc, setImageSrc] = useState('');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [minZoom, setMinZoom] = useState(0.1);
  const [maxZoom, setMaxZoom] = useState(6);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(
    null
  );
  const [isCropping, setIsCropping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fitMode, setFitMode] = useState<FitMode>('fit');

  const aspectLabel = useMemo(
    () => `${targetWidth} × ${targetHeight}px`,
    [targetWidth, targetHeight]
  );

  const applyZoomMode = useCallback(
    (media: MediaSize, mode: FitMode) => {
      const cover = getCoverZoom(media.naturalWidth, media.naturalHeight, aspectRatio);
      const fit = getFitZoom(media.naturalWidth, media.naturalHeight, aspectRatio);

      const nextZoom =
        mode === 'fit'
          ? Math.max(fit * 0.98, 0.05)
          : Math.max(cover * 1.01, fit);

      setMinZoom(Math.max(fit * 0.4, 0.05));
      setMaxZoom(Math.max(cover * 3, 2, nextZoom + 1));
      setZoom(nextZoom);
      setCrop({ x: 0, y: 0 });
      setFitMode(mode);
    },
    [aspectRatio]
  );

  useEffect(() => {
    const loadImage = async () => {
      try {
        let src = '';
        if (typeof image === 'string') {
          src = image;
        } else {
          src = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(image);
          });
        }

        setImageSrc(src);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCroppedAreaPixels(null);
        setError(null);
        setFitMode('fit');

        const img = new Image();
        img.onload = () => {
          setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
        };
        img.onerror = () => setError('Failed to load image');
        img.src = src;
      } catch (err) {
        setError('Failed to load image. Please try again.');
        console.error('Error loading image:', err);
      }
    };

    loadImage();
  }, [image]);

  const onMediaLoaded = useCallback(
    (media: MediaSize) => {
      setImageDimensions({ width: media.naturalWidth, height: media.naturalHeight });
      applyZoomMode(media, 'fit');
    },
    [applyZoomMode]
  );

  const onCropComplete = useCallback((_croppedArea: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleFitFull = () => {
    if (!imageDimensions) return;
    applyZoomMode(
      {
        naturalWidth: imageDimensions.width,
        naturalHeight: imageDimensions.height,
        width: imageDimensions.width,
        height: imageDimensions.height,
      },
      'fit'
    );
  };

  const handleFillFrame = () => {
    if (!imageDimensions) return;
    applyZoomMode(
      {
        naturalWidth: imageDimensions.width,
        naturalHeight: imageDimensions.height,
        width: imageDimensions.width,
        height: imageDimensions.height,
      },
      'cover'
    );
  };

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.addEventListener('load', () => resolve(img));
      img.addEventListener('error', (e) => reject(e));
      img.src = url;
    });

  const getCroppedImg = async (imageSrc: string, pixelCrop: Area): Promise<Blob> => {
    const imageEl = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Unable to create canvas context');
    }

    const imgWidth = imageEl.naturalWidth;
    const imgHeight = imageEl.naturalHeight;

    const cropX = Math.max(0, Math.min(pixelCrop.x, imgWidth));
    const cropY = Math.max(0, Math.min(pixelCrop.y, imgHeight));
    const cropWidth = Math.max(1, Math.min(pixelCrop.width, imgWidth - cropX));
    const cropHeight = Math.max(1, Math.min(pixelCrop.height, imgHeight - cropY));

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(imageEl, cropX, cropY, cropWidth, cropHeight, 0, 0, targetWidth, targetHeight);

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size === 0) {
            reject(new Error('Failed to create image file. Please try again.'));
            return;
          }
          resolve(blob);
        },
        'image/png',
        1
      );
    });
  };

  const handleCrop = async () => {
    if (!croppedAreaPixels || !imageSrc) {
      setError('Please wait for the image to load, then position your crop.');
      return;
    }

    setIsCropping(true);
    setError(null);

    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      const file = new File([croppedImage], `cropped_${targetWidth}x${targetHeight}_${Date.now()}.png`, {
        type: 'image/png',
      });
      onCrop(file);
    } catch (cropError) {
      const errorMessage =
        cropError instanceof Error
          ? cropError.message
          : 'An error occurred while cropping the image. Please try again.';
      setError(errorMessage);
      console.error('Error cropping image:', cropError);
    } finally {
      setIsCropping(false);
    }
  };

  if (!imageSrc) return null;

  return (
    <div
      className="image-cropper-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-cropper-title"
    >
      <div className="image-cropper-panel">
        <h3 id="image-cropper-title" className="image-cropper-title">
          Custom crop — fixed output {aspectLabel}
        </h3>
        <p className="image-cropper-subtitle">
          Drag the image to choose the area · zoom only if needed · orange frame = exact size on site
        </p>

        <div
          className="image-cropper-viewport"
          style={{ aspectRatio: `${targetWidth} / ${targetHeight}` }}
        >
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            onMediaLoaded={onMediaLoaded}
            objectFit="contain"
            restrictPosition={false}
            showGrid
            zoomWithScroll
            minZoom={minZoom}
            maxZoom={maxZoom}
            cropShape="rect"
            style={{
              containerStyle: {
                width: '100%',
                height: '100%',
                borderRadius: '8px',
              },
              cropAreaStyle: {
                border: '2px solid rgba(255, 140, 66, 0.95)',
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.55)',
              },
            }}
          />
        </div>

        <div className="image-cropper-preset-row">
          <button
            type="button"
            className={`image-cropper-preset-btn${fitMode === 'fit' ? ' is-active' : ''}`}
            onClick={handleFitFull}
          >
            Full image
          </button>
          <button
            type="button"
            className={`image-cropper-preset-btn${fitMode === 'cover' ? ' is-active' : ''}`}
            onClick={handleFillFrame}
          >
            Fill frame
          </button>
          <span className="image-cropper-preset-hint">Output size stays {aspectLabel}</span>
        </div>

        <div className="image-cropper-controls">
          <label className="image-cropper-zoom-label" htmlFor="crop-zoom">
            Zoom
          </label>
          <input
            id="crop-zoom"
            type="range"
            value={zoom}
            min={minZoom}
            max={maxZoom}
            step={0.01}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="image-cropper-zoom-slider"
          />
          <span className="image-cropper-zoom-value">{zoom.toFixed(2)}×</span>
        </div>

        {error ? (
          <div className="image-cropper-error" role="alert">
            <strong>Error:</strong> {error}
          </div>
        ) : null}

        <div className="image-cropper-hint">
          <strong>How it works:</strong> The frame ratio is fixed ({aspectLabel}). You move and zoom the
          photo underneath — only the part inside the frame is saved. Start with <em>Full image</em> so
          nothing is over-zoomed; use <em>Fill frame</em> only if you want edge-to-edge coverage.
          {imageDimensions ? (
            <span className="image-cropper-hint-meta">
              Your file: {imageDimensions.width}×{imageDimensions.height}px
            </span>
          ) : null}
        </div>

        <div className="image-cropper-actions">
          <button type="button" className="image-cropper-cancel-btn" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="image-cropper-submit-btn"
            onClick={handleCrop}
            disabled={isCropping || !croppedAreaPixels}
          >
            {isCropping ? 'Saving…' : 'Crop & upload'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .image-cropper-backdrop {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          background: rgba(0, 0, 0, 0.88);
        }
        .image-cropper-panel {
          width: 100%;
          max-width: min(960px, 96vw);
          max-height: 94vh;
          overflow-y: auto;
          background: #fff;
          border-radius: 14px;
          padding: 22px 24px 24px;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
        }
        .image-cropper-title {
          margin: 0 0 6px;
          font-size: 20px;
          font-weight: 700;
          color: #1a202c;
        }
        .image-cropper-subtitle {
          margin: 0 0 16px;
          font-size: 13px;
          color: #64748b;
          line-height: 1.45;
        }
        .image-cropper-viewport {
          position: relative;
          width: 100%;
          max-height: min(52vh, 420px);
          background: #0f172a;
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 14px;
        }
        .image-cropper-preset-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
          margin-bottom: 14px;
        }
        .image-cropper-preset-btn {
          padding: 8px 16px;
          border-radius: 8px;
          border: 2px solid #cbd5e1;
          background: #f8fafc;
          color: #334155;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition:
            background 0.15s ease,
            border-color 0.15s ease,
            color 0.15s ease;
        }
        .image-cropper-preset-btn:hover {
          border-color: #94a3b8;
          background: #f1f5f9;
        }
        .image-cropper-preset-btn.is-active {
          border-color: #3498db;
          background: #eff6ff;
          color: #1d4ed8;
        }
        .image-cropper-preset-hint {
          font-size: 12px;
          color: #64748b;
        }
        .image-cropper-controls {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px 14px;
          margin-bottom: 14px;
        }
        .image-cropper-zoom-label {
          font-size: 14px;
          font-weight: 600;
          color: #334155;
        }
        .image-cropper-zoom-slider {
          flex: 1;
          min-width: 140px;
          height: 6px;
          accent-color: #3498db;
          cursor: pointer;
        }
        .image-cropper-zoom-value {
          font-size: 13px;
          color: #64748b;
          min-width: 48px;
          text-align: right;
        }
        .image-cropper-error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #b91c1c;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 14px;
          font-size: 13px;
          line-height: 1.5;
        }
        .image-cropper-hint {
          background: #f0f7ff;
          padding: 12px 14px;
          border-radius: 8px;
          margin-bottom: 18px;
          font-size: 13px;
          color: #475569;
          line-height: 1.55;
        }
        .image-cropper-hint-meta {
          display: block;
          margin-top: 6px;
          font-size: 12px;
          color: #64748b;
        }
        .image-cropper-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }
        .image-cropper-cancel-btn,
        .image-cropper-submit-btn {
          padding: 12px 22px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }
        .image-cropper-cancel-btn {
          background: #e2e8f0;
          color: #334155;
        }
        .image-cropper-cancel-btn:hover {
          background: #cbd5e1;
        }
        .image-cropper-submit-btn {
          background: #3498db;
          color: #fff;
        }
        .image-cropper-submit-btn:hover:not(:disabled) {
          background: #2980b9;
        }
        .image-cropper-submit-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
