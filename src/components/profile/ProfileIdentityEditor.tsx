'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSession } from 'next-auth/react';
import {
  IoCameraOutline,
  IoCreateOutline,
  IoImagesOutline,
  IoPersonCircleOutline,
} from 'react-icons/io5';
import { toast } from 'sonner';
import { clientMessageFromApi } from '@/lib/safe-errors';
import './profile-identity-editor.css';

const ImageCropper = dynamic(() => import('@/components/ImageCropper'), { ssr: false });

const AVATAR_SIZE = 400;

type Props = {
  fullName: string;
  email: string | null;
  imageUrl: string | null;
  providerLabel: string;
  compact?: boolean;
  onNameChange: (name: string) => void;
  onImageChange: (url: string | null) => void;
};

export default function ProfileIdentityEditor({
  fullName,
  email,
  imageUrl,
  providerLabel,
  compact,
  onNameChange,
  onImageChange,
}: Props) {
  const { update: updateSession } = useSession();
  const [editOpen, setEditOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState(fullName);
  const [savingName, setSavingName] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [photoSheetOpen, setPhotoSheetOpen] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [portalReady, setPortalReady] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    setNameDraft(fullName);
  }, [fullName]);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 899px)');
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const pickPhoto = () => {
    if (isMobile) {
      setPhotoSheetOpen(true);
    } else {
      fileRef.current?.click();
    }
  };

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOpen(false);
  }, []);

  useEffect(() => {
    if (!cameraOpen || !videoRef.current || !streamRef.current) return;
    videoRef.current.srcObject = streamRef.current;
    void videoRef.current.play().catch(() => {});
  }, [cameraOpen]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const syncSession = async (name: string, image: string | null) => {
    await updateSession({ name, image });
  };

  const uploadAvatar = async (file: File) => {
    setUploading(true);
    setUploadProgress(10);
    try {
      const form = new FormData();
      form.append('file', file);
      setUploadProgress(40);
      const res = await fetch('/api/account/profile/avatar', { method: 'POST', body: form });
      const data = await res.json();
      setUploadProgress(90);
      if (!res.ok) throw new Error(clientMessageFromApi(data, 'Upload failed'));

      const url = data.url as string;
      onImageChange(url);
      await syncSession(nameDraft.trim() || fullName, url);
      setUploadProgress(100);
      toast.success('Profile photo updated');
      setCropFile(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not upload photo');
      setCropFile(null);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const openCamera = async () => {
    setPhotoSheetOpen(false);
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error('Camera not supported. Use gallery instead.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOpen(true);
    } catch {
      toast.error('Camera access denied.');
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;

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
        setCropFile(new File([blob], `avatar-${Date.now()}.jpg`, { type: 'image/jpeg' }));
      },
      'image/jpeg',
      0.9,
    );
  };

  const onGalleryPick = (file: File | undefined) => {
    if (!file) return;
    setPhotoSheetOpen(false);
    setCropFile(file);
  };

  const saveName = async () => {
    const trimmed = nameDraft.trim();
    if (trimmed.length < 2) {
      toast.error('Name must be at least 2 characters');
      return;
    }
    setSavingName(true);
    try {
      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(clientMessageFromApi(data, 'Save failed'));

      onNameChange(trimmed);
      await syncSession(trimmed, imageUrl);
      toast.success('Name updated');
      setEditOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save name');
    } finally {
      setSavingName(false);
    }
  };

  const avatarInner = imageUrl ? (
    <Image src={imageUrl} alt="" fill sizes="112px" unoptimized />
  ) : (
    <IoPersonCircleOutline
      size={compact ? 28 : 52}
      color="#94a3b8"
      aria-hidden
    />
  );

  return (
    <>
      <div
        className={`profile-sidebar__identity pie-identity${compact ? ' pie-identity--clickable' : ''}`}
        role={compact ? 'button' : undefined}
        tabIndex={compact ? 0 : undefined}
        onClick={compact ? () => setEditOpen(true) : undefined}
        onKeyDown={
          compact
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setEditOpen(true);
                }
              }
            : undefined
        }
      >
        <button
          type="button"
          className="pie-avatar-btn profile-sidebar__avatar-wrap"
          onClick={(e) => {
            e.stopPropagation();
            setEditOpen(true);
          }}
          disabled={uploading}
          aria-label="Edit profile photo"
        >
          <div className="profile-avatar">{avatarInner}</div>
          <span className="pie-avatar-edit" aria-hidden>
            <IoCreateOutline size={12} />
          </span>
        </button>
        <div className="profile-sidebar__meta">
          <h2 className="profile-sidebar__name">{fullName}</h2>
          {email ? <p className="profile-sidebar__email">{email}</p> : null}
        </div>
        <span className="profile-badge">{providerLabel}</span>
      </div>

      {compact ? (
        <p className="pie-edit-hint">Tap to edit name or photo</p>
      ) : (
        <button
          type="button"
          className="profile-btn profile-btn--outline"
          style={{ width: '100%', marginTop: 12 }}
          onClick={() => setEditOpen(true)}
        >
          Edit profile
        </button>
      )}

      {portalReady && editOpen
        ? createPortal(
            <div
              className="pie-modal-backdrop"
              role="presentation"
              onClick={() => !savingName && !uploading && setEditOpen(false)}
            >
              <div
                className="pie-modal"
                role="dialog"
                aria-labelledby="pie-edit-title"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 id="pie-edit-title" className="pie-modal__title">
                  Edit profile
                </h3>
                <p className="pie-modal__desc">Update your display name and profile photo.</p>

                <div className="pie-modal__avatar-row">
                  <button
                    type="button"
                    className="pie-modal__avatar pie-avatar-btn"
                    onClick={pickPhoto}
                    disabled={uploading}
                    aria-label="Change profile photo"
                  >
                    <div className="pie-modal__avatar-inner">
                      {imageUrl ? (
                        <Image src={imageUrl} alt="" fill sizes="96px" unoptimized />
                      ) : (
                        <IoPersonCircleOutline size={48} color="#94a3b8" aria-hidden />
                      )}
                    </div>
                    <span className="pie-avatar-edit" aria-hidden>
                      <IoCameraOutline size={12} />
                    </span>
                  </button>
              <button
                type="button"
                className="profile-btn profile-btn--secondary"
                onClick={pickPhoto}
                disabled={uploading}
              >
                {uploading ? 'Uploading…' : isMobile ? 'Change photo' : 'Upload photo'}
              </button>
            </div>

            <label className="pie-modal__field">
              Display name
              <input
                type="text"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                autoComplete="name"
                maxLength={120}
              />
            </label>

            <div className="pie-modal__actions">
              <button
                type="button"
                className="profile-btn profile-btn--ghost"
                onClick={() => setEditOpen(false)}
                disabled={savingName || uploading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="profile-btn profile-btn--primary"
                onClick={() => void saveName()}
                disabled={savingName || uploading}
              >
                {savingName ? 'Saving…' : 'Save'}
              </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {portalReady && photoSheetOpen && isMobile
        ? createPortal(
            <div
              className="pie-sheet-backdrop"
              role="presentation"
              onClick={() => setPhotoSheetOpen(false)}
            >
              <div
                className="pie-sheet"
                role="dialog"
                aria-label="Profile photo"
                onClick={(e) => e.stopPropagation()}
              >
                <p className="pie-sheet__title">Profile photo</p>
                <button type="button" className="pie-sheet__btn" onClick={() => void openCamera()}>
                  <IoCameraOutline size={22} aria-hidden />
                  Take photo
                </button>
                <button
                  type="button"
                  className="pie-sheet__btn"
                  onClick={() => fileRef.current?.click()}
                >
                  <IoImagesOutline size={22} aria-hidden />
                  Choose from gallery
                </button>
                <button type="button" className="pie-sheet__cancel" onClick={() => setPhotoSheetOpen(false)}>
                  Cancel
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          onGalleryPick(e.target.files?.[0]);
          e.target.value = '';
        }}
      />

      {portalReady && cameraOpen
        ? createPortal(
            <div className="pie-camera-overlay" role="dialog" aria-label="Camera">
              <video ref={videoRef} className="pie-camera-video" playsInline muted />
              <div className="pie-camera-bar">
                <button type="button" className="pie-camera-capture" onClick={capturePhoto}>
                  Take photo
                </button>
                <button type="button" className="pie-camera-cancel" onClick={stopCamera}>
                  Cancel
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}

      {cropFile ? (
        <ImageCropper
          image={cropFile}
          aspectRatio={1}
          targetWidth={AVATAR_SIZE}
          targetHeight={AVATAR_SIZE}
          onCrop={(file) => void uploadAvatar(file)}
          onCancel={() => setCropFile(null)}
          uploading={uploading}
          uploadProgress={uploadProgress}
        />
      ) : null}
    </>
  );
}
