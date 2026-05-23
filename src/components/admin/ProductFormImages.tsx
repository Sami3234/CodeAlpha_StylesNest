'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import ImageCropper from '@/components/ImageCropper';
import { useToast } from '@/components/Toast';
import ColorListEditor from '@/components/admin/ColorListEditor';
import type { AdminProductTFunction } from '@/lib/admin/product-form-shared';
import { isValidProductImageUrl } from '@/lib/admin/product-form-shared';
import { categoryColorsRequired } from '@/lib/product-colors';
import { uploadFormDataWithProgress } from '@/lib/upload-with-progress';

export const MAX_PRODUCT_IMAGES = 12;

export type ProductImageEntry = {
  id: string;
  url: string;
  colors?: string[];
  pendingFile?: File;
};

const PRODUCT_CROP = { aspectRatio: 1, width: 1200, height: 1200 };

type Props = {
  images: ProductImageEntry[];
  onChange: (images: ProductImageEntry[]) => void;
  category: string;
  productTitle: string;
  t: AdminProductTFunction;
  imageColorErrors?: Record<string, string>;
  onClearImageColorError?: (imageId: string) => void;
};

function newImageId() {
  return `img_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

async function uploadProductImage(
  file: File,
  category: string,
  productName: string,
  onProgress: (percent: number) => void,
): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('category', category);
  fd.append('productName', productName.trim() || 'product');
  const data = (await uploadFormDataWithProgress('/api/upload', fd, onProgress)) as {
    url?: string;
    error?: string;
  };
  if (!data.url) {
    throw new Error(data.error || 'Upload failed');
  }
  return data.url;
}

export default function ProductFormImages({
  images,
  onChange,
  category,
  productTitle,
  t,
  imageColorErrors = {},
  onClearImageColorError,
}: Props) {
  const colorsRequired = categoryColorsRequired(category);
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropQueue, setCropQueue] = useState<File[]>([]);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [replaceId, setReplaceId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [cropperSession, setCropperSession] = useState(0);
  const [urlDraft, setUrlDraft] = useState('');

  const slotsLeft = MAX_PRODUCT_IMAGES - images.length;
  const showCropper = Boolean(cropFile);

  const startCrop = (file: File, replaceTargetId: string | null = null) => {
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', 'error');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      showToast('Image must be 8MB or smaller', 'error');
      return;
    }
    setReplaceId(replaceTargetId);
    setCropFile(file);
  };

  const onPickFiles = (fileList: FileList | null, replaceTargetId: string | null = null) => {
    if (!fileList?.length) return;
    const picked = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (!picked.length) {
      showToast('Please select image files only', 'error');
      return;
    }

    if (replaceTargetId) {
      startCrop(picked[0], replaceTargetId);
      return;
    }

    const allowed = Math.min(picked.length, slotsLeft);
    if (allowed < picked.length) {
      showToast(`Maximum ${MAX_PRODUCT_IMAGES} images allowed`, 'error');
    }
    if (allowed === 0) {
      showToast(`Maximum ${MAX_PRODUCT_IMAGES} images reached`, 'error');
      return;
    }

    const batch = picked.slice(0, allowed);
    setCropQueue(batch.slice(1));
    startCrop(batch[0], null);
  };

  const closeCropper = () => {
    setCropFile(null);
    setCropQueue([]);
    setReplaceId(null);
  };

  const handleCropCancel = () => {
    closeCropper();
  };

  const handleCropComplete = async (croppedFile: File) => {
    setUploading(true);
    setUploadProgress(0);
    try {
      const url = await uploadProductImage(croppedFile, category, productTitle, (p) => {
        setUploadProgress(p);
      });
      setUploadProgress(100);

      if (replaceId) {
        onChange(
          images.map((img) =>
            img.id === replaceId ? { ...img, url, pendingFile: undefined } : img
          )
        );
        showToast('Image updated', 'success');
      } else {
        onChange([...images, { id: newImageId(), url, colors: [] }]);
        showToast('Image added', 'success');
      }

      const next = cropQueue[0];
      if (next) {
        setCropQueue(cropQueue.slice(1));
        setCropFile(next);
        setReplaceId(null);
      } else {
        closeCropper();
      }
    } catch {
      showToast('Upload failed. Please try again.', 'error');
      setUploadProgress(0);
      setCropperSession((n) => n + 1);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (id: string) => {
    onChange(images.filter((img) => img.id !== id));
  };

  const setAsMain = (id: string) => {
    const idx = images.findIndex((img) => img.id === id);
    if (idx <= 0) return;
    const next = [...images];
    const [item] = next.splice(idx, 1);
    next.unshift(item);
    onChange(next);
  };

  const addUrlImage = () => {
    const trimmed = urlDraft.trim();
    if (!isValidProductImageUrl(trimmed)) {
      showToast('Enter a valid image URL', 'error');
      return;
    }
    if (images.length >= MAX_PRODUCT_IMAGES) {
      showToast(`Maximum ${MAX_PRODUCT_IMAGES} images allowed`, 'error');
      return;
    }
    onChange([...images, { id: newImageId(), url: trimmed, colors: [] }]);
    setUrlDraft('');
    showToast('Image URL added', 'success');
  };

  const updateUrl = (id: string, url: string) => {
    onChange(images.map((img) => (img.id === id ? { ...img, url, pendingFile: undefined } : img)));
  };

  const updateImageColors = (id: string, colors: string[]) => {
    onChange(images.map((img) => (img.id === id ? { ...img, colors } : img)));
    onClearImageColorError?.(id);
  };

  return (
    <div className="pf-images">
      <div className="pf-images__intro">
        <h3 className="pf-images__title">
          {t('admin.form.productImages', { defaultValue: 'Product images' })}
          <span className="pf-label-required">*</span>
        </h3>
        <p className="pf-images__desc">
          {t('admin.form.productImagesDesc', {
            defaultValue:
              'Pick images → adjust crop → Apply crop. Upload runs automatically with a progress bar. Up to 12 images.',
          })}
        </p>
        {colorsRequired ? (
          <p className="pf-images__colors-note">
            {t('admin.form.imageColorsRequiredNote', {
              defaultValue:
                'Clothes & shoes: add at least one color under each image (required).',
            })}
          </p>
        ) : (
          <p className="pf-images__colors-note pf-images__colors-note--optional">
            {t('admin.form.imageColorsOptionalNote', {
              defaultValue: 'Colors under each image are optional for this category.',
            })}
          </p>
        )}
        <p className="pf-images__count">
          {images.length} / {MAX_PRODUCT_IMAGES}{' '}
          {t('admin.form.imagesAdded', { defaultValue: 'images' })}
        </p>
      </div>

      {images.length > 0 ? (
        <div className="pf-images__grid">
          {images.map((entry, index) => (
            <div
              key={entry.id}
              className={`pf-images__card${index === 0 ? ' pf-images__card--main' : ''}`}
            >
              <div className="pf-images__thumb">
                {isValidProductImageUrl(entry.url) ? (
                  <Image
                    src={entry.url}
                    alt={index === 0 ? 'Main product' : `Product ${index + 1}`}
                    fill
                    sizes="(max-width: 640px) 50vw, 160px"
                    style={{ objectFit: 'cover' }}
                    unoptimized
                  />
                ) : (
                  <span className="pf-images__placeholder">?</span>
                )}
                {index === 0 ? <span className="pf-images__badge">Main</span> : null}
              </div>

              <div className="pf-images__colors">
                <ColorListEditor
                  compact
                  colors={entry.colors ?? []}
                  onChange={(colors) => updateImageColors(entry.id, colors)}
                  required={colorsRequired}
                  label={t('admin.form.imageColors', { defaultValue: 'Colors for this image' })}
                  hint={t('admin.form.imageColorsHint', {
                    defaultValue: 'e.g. Black, Maroon, Peach — shown when customers pick this photo.',
                  })}
                  error={imageColorErrors[entry.id]}
                  onClearError={() => onClearImageColorError?.(entry.id)}
                />
              </div>

              <input
                type="url"
                className="pf-images__url-input"
                value={entry.url}
                onChange={(e) => updateUrl(entry.id, e.target.value)}
                placeholder={t('admin.form.imageUrlPlaceholder')}
              />

              <div className="pf-images__actions">
                <label className="pf-images__btn pf-images__btn--secondary">
                  <input
                    type="file"
                    accept="image/*"
                    className="pf-images__file-input"
                    disabled={uploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) onPickFiles(e.target.files, entry.id);
                      e.target.value = '';
                    }}
                  />
                  {t('admin.form.replaceImage', { defaultValue: 'Replace' })}
                </label>
                {index > 0 ? (
                  <button
                    type="button"
                    className="pf-images__btn pf-images__btn--secondary"
                    onClick={() => setAsMain(entry.id)}
                  >
                    {t('admin.form.setAsMain', { defaultValue: 'Set main' })}
                  </button>
                ) : null}
                <button
                  type="button"
                  className="pf-images__btn pf-images__btn--danger"
                  onClick={() => removeImage(entry.id)}
                  aria-label="Remove image"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="pf-images__empty">
          <p>{t('admin.form.noImagesYet', { defaultValue: 'No images yet. Upload or paste a URL below.' })}</p>
        </div>
      )}

      {slotsLeft > 0 ? (
        <div className="pf-images__add-row">
          <label className="pf-images__add-btn">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="pf-images__file-input"
              disabled={uploading}
              onChange={(e) => {
                onPickFiles(e.target.files);
                e.target.value = '';
              }}
            />
            <span className="pf-images__add-icon">+</span>
            {t('admin.form.addImages', { defaultValue: 'Add images (crop, then upload)' })}
          </label>

          <div className="pf-images__url-row">
            <input
              type="url"
              className="pf-form-input"
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              placeholder={t('admin.form.imageUrlPlaceholder')}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addUrlImage();
                }
              }}
            />
            <button type="button" className="pf-images__btn pf-images__btn--primary" onClick={addUrlImage}>
              {t('admin.form.addUrl', { defaultValue: 'Add URL' })}
            </button>
          </div>
        </div>
      ) : (
        <p className="pf-images__limit-msg">
          {t('admin.form.imagesLimitReached', {
            defaultValue: `Maximum ${MAX_PRODUCT_IMAGES} images reached. Remove one to add more.`,
          })}
        </p>
      )}

      {showCropper && cropFile ? (
        <ImageCropper
          key={`${cropFile.name}-${cropFile.size}-${cropperSession}`}
          image={cropFile}
          aspectRatio={PRODUCT_CROP.aspectRatio}
          targetWidth={PRODUCT_CROP.width}
          targetHeight={PRODUCT_CROP.height}
          onCrop={handleCropComplete}
          onCancel={handleCropCancel}
          uploading={uploading}
          uploadProgress={uploadProgress}
        />
      ) : null}
    </div>
  );
}
