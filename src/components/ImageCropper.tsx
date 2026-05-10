'use client';

import { useState, useCallback, useEffect } from 'react';
import Cropper, { Area } from 'react-easy-crop';

interface ImageCropperProps {
  image: File | string;
  aspectRatio: number; // width/height
  onCrop: (croppedFile: File) => void;
  onCancel: () => void;
  targetWidth: number;
  targetHeight: number;
}

export default function ImageCropper({ 
  image, 
  aspectRatio, 
  onCrop, 
  onCancel,
  targetWidth,
  targetHeight 
}: ImageCropperProps) {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialZoom, setInitialZoom] = useState(1);

  // Load image and get dimensions
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
        
        // Get image dimensions and calculate initial zoom
        const img = new Image();
        img.onload = () => {
          const dimensions = { width: img.naturalWidth, height: img.naturalHeight };
          setImageDimensions(dimensions);
          
          // Calculate initial zoom to fit image properly in container
          // Container is approximately 800px wide and 400px tall
          const containerWidth = 800;
          const containerHeight = 400;
          
          // Calculate scale needed to fit image in container while maintaining aspect ratio
          const scaleX = containerWidth / dimensions.width;
          const scaleY = containerHeight / dimensions.height;
          const scaleToFit = Math.min(scaleX, scaleY);
          
          // Set initial zoom to show full image (zoom < 1 means zoomed out)
          // We want to start slightly zoomed out so user can see the full image
          const calculatedZoom = Math.min(scaleToFit * 0.9, 0.8); // Start at 80% or less to show full image
          setInitialZoom(calculatedZoom);
          setZoom(calculatedZoom);
        };
        img.onerror = () => {
          setError('Failed to load image');
        };
        img.src = src;
      } catch (err) {
        setError('Failed to load image. Please try again.');
        console.error('Error loading image:', err);
      }
    };
    
    loadImage();
  }, [image]);

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.src = url;
    });
  };

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: Area
  ): Promise<Blob> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Unable to create canvas context');
    }

    // Validate crop area is within image bounds
    const imgWidth = image.naturalWidth;
    const imgHeight = image.naturalHeight;
    
    // Clamp crop coordinates to image bounds
    const cropX = Math.max(0, Math.min(pixelCrop.x, imgWidth));
    const cropY = Math.max(0, Math.min(pixelCrop.y, imgHeight));
    const cropWidth = Math.max(1, Math.min(pixelCrop.width, imgWidth - cropX));
    const cropHeight = Math.max(1, Math.min(pixelCrop.height, imgHeight - cropY));

    // Validate crop area
    if (cropWidth <= 0 || cropHeight <= 0) {
      throw new Error('Invalid crop area. Please adjust the crop selection.');
    }

    if (cropX < 0 || cropY < 0 || cropX + cropWidth > imgWidth || cropY + cropHeight > imgHeight) {
      throw new Error('Crop area is outside image bounds. Please adjust the selection.');
    }

    // Set canvas size to target dimensions
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    // Clear canvas with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    // Draw cropped image with error handling
    try {
      ctx.drawImage(
        image,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        targetWidth,
        targetHeight
      );
    } catch (drawError) {
      throw new Error('Failed to draw image on canvas. Please try again.');
    }

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to create image file. Canvas may be empty.'));
          return;
        }
        if (blob.size === 0) {
          reject(new Error('Generated image is empty. Please try again.'));
          return;
        }
        resolve(blob);
      }, 'image/png', 1.0);
    });
  };

  const handleCrop = async () => {
    if (!croppedAreaPixels || !imageSrc) {
      setError('Please wait for image to load completely.');
      return;
    }

    if (!imageDimensions) {
      setError('Image dimensions not available. Please try again.');
      return;
    }

    setIsCropping(true);
    setError(null);

    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      const file = new File([croppedImage], `cropped_${Date.now()}.png`, { type: 'image/png' });
      onCrop(file);
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An error occurred while cropping the image. Please try again.';
      setError(errorMessage);
      console.error('Error cropping image:', error);
    } finally {
      setIsCropping(false);
    }
  };

  if (!imageSrc) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '12px',
        padding: '24px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        maxWidth: '800px'
      }}>
        <h3 style={{ 
          marginBottom: '20px', 
          fontSize: '20px', 
          fontWeight: '600',
          color: '#333'
        }}>
          Crop Banner Image ({targetWidth}x{targetHeight}px)
        </h3>
        
        <div style={{
          position: 'relative',
          width: '100%',
          height: '400px',
          backgroundColor: '#000',
          borderRadius: '8px',
          overflow: 'hidden',
          marginBottom: '20px'
        }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            restrictPosition={false}
            minZoom={0.5}
            maxZoom={5}
            style={{
              containerStyle: {
                width: '100%',
                height: '100%'
              }
            }}
          />
        </div>

        {/* Zoom Control */}
        <div style={{
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <label style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#333',
            minWidth: '60px'
          }}>
            Zoom:
          </label>
          <input
            type="range"
            value={zoom}
            min={0.5}
            max={5}
            step={0.1}
            onChange={(e) => setZoom(Number(e.target.value))}
            style={{
              flex: 1,
              height: '6px',
              borderRadius: '3px',
              background: '#ddd',
              outline: 'none',
              cursor: 'pointer'
            }}
          />
          <span style={{
            fontSize: '14px',
            color: '#666',
            minWidth: '40px',
            textAlign: 'right'
          }}>
            {zoom.toFixed(1)}x
          </span>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            backgroundColor: '#fee',
            border: '1px solid #fcc',
            color: '#c33',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '13px',
            lineHeight: '1.5'
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Instructions */}
        <div style={{
          backgroundColor: '#f0f7ff',
          padding: '12px',
          borderRadius: '8px',
          marginBottom: '20px',
          fontSize: '13px',
          color: '#555',
          lineHeight: '1.5'
        }}>
          <strong>Instructions:</strong> Drag the image to position it, and use the zoom slider to adjust. The image will be cropped to {targetWidth}x{targetHeight}px.
          {imageDimensions && (
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
              Original size: {imageDimensions.width}x{imageDimensions.height}px
            </div>
          )}
        </div>

        {/* Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onCancel}
            style={{
              padding: '12px 24px',
              backgroundColor: '#e0e0e0',
              color: '#333',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#d0d0d0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#e0e0e0';
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleCrop}
            disabled={isCropping || !croppedAreaPixels}
            style={{
              padding: '12px 24px',
              backgroundColor: isCropping || !croppedAreaPixels ? '#95a5a6' : '#3498db',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: isCropping || !croppedAreaPixels ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'background-color 0.2s',
              opacity: isCropping || !croppedAreaPixels ? 0.6 : 1
            }}
            onMouseEnter={(e) => {
              if (!isCropping && croppedAreaPixels) {
                e.currentTarget.style.backgroundColor = '#2980b9';
              }
            }}
            onMouseLeave={(e) => {
              if (!isCropping && croppedAreaPixels) {
                e.currentTarget.style.backgroundColor = '#3498db';
              }
            }}
          >
            {isCropping ? 'Cropping...' : 'Crop & Upload'}
          </button>
        </div>
      </div>
    </div>
  );
}
