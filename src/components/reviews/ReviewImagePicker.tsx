'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { IoCameraOutline, IoImagesOutline } from 'react-icons/io5';
import { toast } from 'sonner';
import './review-image-picker.css';

export type ReviewPhotoSlots = [string | null, string | null, string | null];

type Props = {
  slots: ReviewPhotoSlots;
  onSlotsChange: (slots: ReviewPhotoSlots) => void;
  disabled?: boolean;
};

export default function ReviewImagePicker({ slots, onSlotsChange, disabled }: Props) {
  const [isMobile, setIsMobile] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [pickerSlot, setPickerSlot] = useState<number | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraSlot, setCameraSlot] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const gallerySlotRef = useRef<number | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOpen(false);
    setCameraSlot(null);
  }, []);

  useEffect(() => {
    if (!cameraOpen || !videoRef.current || !streamRef.current) return;
    videoRef.current.srcObject = streamRef.current;
    void videoRef.current.play().catch(() => {});
  }, [cameraOpen]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 899px)');
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const setSlot = (index: number, url: string | null) => {
    const next: ReviewPhotoSlots = [...slots] as ReviewPhotoSlots;
    next[index] = url;
    onSlotsChange(next);
  };

  const uploadFile = async (file: File, slotIndex: number) => {
    setUploadingSlot(slotIndex);
    setPickerSlot(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/reviews/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setSlot(slotIndex, data.url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not upload photo');
    } finally {
      setUploadingSlot(null);
    }
  };

  const openCamera = async (slotIndex: number) => {
    setPickerSlot(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error('Camera not supported. Use gallery instead.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      streamRef.current = stream;
      setCameraSlot(slotIndex);
      setCameraOpen(true);
    } catch {
      toast.error('Camera access denied.');
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const slotIndex = cameraSlot;
    if (!video || slotIndex === null || !video.videoWidth) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    stopCamera();

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          toast.error('Could not capture photo');
          return;
        }
        void uploadFile(new File([blob], `review-${Date.now()}.jpg`, { type: 'image/jpeg' }), slotIndex);
      },
      'image/jpeg',
      0.88,
    );
  };

  const onTileClick = (index: number) => {
    if (disabled || uploadingSlot !== null || slots[index]) return;
    if (!isMobile) {
      gallerySlotRef.current = index;
      fileRef.current?.click();
      return;
    }
    setPickerSlot(index);
  };

  const firstEmpty = slots.findIndex((s) => !s);

  return (
    <div className="rip-root">
      <p className="rip-label">Add photos</p>
      <p className="rip-hint">
        Up to 3 photos — <strong>1 required</strong>, 2 optional.{' '}
        {isMobile ? 'Tap + to add.' : 'Click + to upload.'}
      </p>

      <div className="rip-row">
        {slots.map((url, index) => {
          const isRequired = index === 0 && !slots[0];
          const isUploading = uploadingSlot === index;

          if (url) {
            return (
              <div key={index} className="rip-tile rip-tile--filled">
                <div className="rip-tile__img-wrap">
                  <Image src={url} alt="" fill sizes="96px" unoptimized />
                </div>
                {!disabled ? (
                  <button
                    type="button"
                    className="rip-tile__remove"
                    aria-label="Remove photo"
                    onClick={() => setSlot(index, null)}
                  >
                    ×
                  </button>
                ) : null}
              </div>
            );
          }

          if (index > 0 && !slots[0]) return null;

          return (
            <button
              key={index}
              type="button"
              className={`rip-tile${isRequired ? ' rip-tile--required' : ''}${isUploading ? ' rip-tile--uploading' : ''}`}
              disabled={disabled || isUploading}
              onClick={() => onTileClick(index)}
              aria-label={index === 0 ? 'Add required photo' : 'Add optional photo'}
            >
              <span className="rip-tile__plus">
                <span className="rip-tile__plus-icon">+</span>
                {isUploading ? (
                  <span className="rip-tile__plus-text">…</span>
                ) : index === 0 ? (
                  <span className="rip-tile__plus-text">Required</span>
                ) : (
                  <span className="rip-tile__plus-text">Optional</span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          const slot = gallerySlotRef.current ?? pickerSlot ?? firstEmpty;
          gallerySlotRef.current = null;
          e.target.value = '';
          if (file && slot >= 0) void uploadFile(file, slot);
        }}
      />

      {pickerSlot !== null && isMobile ? (
        <div
          className="rip-sheet-backdrop"
          role="presentation"
          onClick={() => setPickerSlot(null)}
        >
          <div
            className="rip-sheet"
            role="dialog"
            aria-label="Add photo"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="rip-sheet__title">Add photo</p>
            <button
              type="button"
              className="rip-sheet__btn"
              onClick={() => void openCamera(pickerSlot)}
            >
              <IoCameraOutline size={22} aria-hidden />
              Take photo
            </button>
            <button
              type="button"
              className="rip-sheet__btn"
              onClick={() => {
                gallerySlotRef.current = pickerSlot;
                setPickerSlot(null);
                fileRef.current?.click();
              }}
            >
              <IoImagesOutline size={22} aria-hidden />
              Choose from gallery
            </button>
            <button type="button" className="rip-sheet__cancel" onClick={() => setPickerSlot(null)}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {cameraOpen ? (
        <div className="rip-camera-overlay" role="dialog" aria-label="Camera">
          <video ref={videoRef} className="rip-camera-video" playsInline muted />
          <div className="rip-camera-bar">
            <button type="button" className="rip-camera-capture" onClick={capturePhoto}>
              Take photo
            </button>
            <button type="button" className="rip-camera-cancel" onClick={stopCamera}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function slotsToImageUrls(slots: ReviewPhotoSlots): string[] {
  return slots.filter((u): u is string => Boolean(u));
}

export const emptyPhotoSlots = (): ReviewPhotoSlots => [null, null, null];
