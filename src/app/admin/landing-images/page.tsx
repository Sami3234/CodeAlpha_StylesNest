'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useToast } from '@/components/Toast';
import ImageCropper from '@/components/ImageCropper';

interface LandingImage {
  id: number;
  section: string;
  image_type: string;
  image_url: string;
  cloudinary_public_id?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const sections = [
  { 
    id: 'hero', 
    name: 'Hero Banner', 
    description: 'Up to 4 banners — homepage carousel (one full banner at a time)',
    maxImages: 4 
  },
  { 
    id: 'garments', 
    name: 'Garments Section', 
    description: 'Garments carousel images',
    maxImages: 5 
  },
  { 
    id: 'jewelry', 
    name: 'Jewelry Section', 
    description: 'Jewelry showcase images for the homepage collage',
    maxImages: 7 
  },
  { 
    id: 'cosmetics', 
    name: 'Makeup Section', 
    description: 'Makeup section images',
    maxImages: 5 
  },
  { 
    id: 'clothes', 
    name: 'Clothes Section', 
    description: 'Clothes / fashion images for the flip-card section',
    maxImages: 5 
  },
  { 
    id: 'jewellery', 
    name: 'Electronics Section', 
    description: 'Electronics section images',
    maxImages: 4 
  },
  { 
    id: 'general_store',
    name: 'General',
    description: 'Landing image for General section',
    maxImages: 1 
  },
];

export default function LandingImagesPage() {
  const { showToast } = useToast();
  const [activeSection, setActiveSection] = useState<string>('hero');
  const [images, setImages] = useState<Record<string, LandingImage[]>>({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<LandingImage | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<File | null>(null);
  const [cropImageType, setCropImageType] = useState<string>('');
  const [bannerSize, setBannerSize] = useState<'standard' | 'wide'>('standard'); // standard = 1920x600, wide = 1920x1080

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/landing-images', { cache: 'no-store' });
      const data = await response.json();
      
      if (data.success) {
        const grouped: Record<string, LandingImage[]> = {};
        sections.forEach(section => {
          grouped[section.id] = [];
        });
        
        const normalizeLandingSection = (section: string) => {
          if (section === 'purse') return 'jewelry';
          if (section === 'lace') return 'clothes';
          return section;
        };

        data.images.forEach((img: LandingImage) => {
          const bucket = normalizeLandingSection(img.section);
          if (!grouped[bucket]) {
            grouped[bucket] = [];
          }
          grouped[bucket].push(img);
        });
        
        setImages(grouped);
      }
    } catch (error) {
      console.error('Error fetching images:', error);
      showToast('Failed to load images', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, imageType: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', 'error');
      e.target.value = '';
      return;
    }

    // For hero banner, only allow PNG/WebP
    if (activeSection === 'hero') {
      const allowedTypes = ['image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        showToast('Banner images must be PNG or WebP format to maintain quality.', 'error');
        e.target.value = '';
        return;
      }
    }

    // Check file size
    const maxSize = activeSection === 'hero' ? 5 * 1024 * 1024 : 4 * 1024 * 1024; // 5MB for hero, 4MB for others
    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      showToast(
        `File size too large! Maximum ${maxSizeMB}MB allowed${activeSection === 'hero' ? ' for banner images' : ''}.`,
        'error'
      );
      e.target.value = '';
      return;
    }

    // Check upload limit
    const currentSection = sections.find(s => s.id === activeSection);
    const currentImagesCount = images[activeSection]?.length || 0;
    
    if (currentSection && currentImagesCount >= currentSection.maxImages) {
      showToast(
        `Upload limit reached! Maximum ${currentSection.maxImages} image(s) allowed for ${currentSection.name}.`,
        'error'
      );
      e.target.value = '';
      return;
    }

    // Show cropper for all sections
    setImageToCrop(file);
    setCropImageType(imageType);
    setShowCropper(true);
    e.target.value = '';
  };

  const uploadImage = async (file: File, imageType: string) => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('section', activeSection);
      formData.append('imageType', imageType);
      formData.append('displayOrder', String((images[activeSection]?.length || 0) + 1));

      const response = await fetch('/api/landing-images', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        showToast('Image uploaded successfully', 'success');
        fetchImages();
      } else {
        showToast(data.error || 'Failed to upload image', 'error');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      showToast('Failed to upload image. Please check your database connection.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleCropComplete = async (croppedFile: File) => {
    try {
      setShowCropper(false);
      await uploadImage(croppedFile, cropImageType);
      setImageToCrop(null);
      setCropImageType('');
    } catch (error) {
      console.error('Error in crop complete:', error);
      showToast('Failed to upload cropped image. Please try again.', 'error');
      setShowCropper(true); // Keep cropper open on error
    }
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setImageToCrop(null);
    setCropImageType('');
  };

  // Get crop settings for each section based on their card sizes
  const getCropSettings = () => {
    switch (activeSection) {
      case 'hero':
        if (bannerSize === 'wide') {
          return { aspectRatio: 1920/800, width: 1920, height: 800 };
        } else {
          return { aspectRatio: 1920/600, width: 1920, height: 600 };
        }
      case 'garments':
        // 400x450 cards - portrait orientation
        return { aspectRatio: 400/450, width: 400, height: 450 };
      case 'jewelry':
        // Various sizes, using average ~280x200 for main card
        return { aspectRatio: 280/200, width: 280, height: 200 };
      case 'cosmetics':
        // 400x300 cards - landscape
        return { aspectRatio: 400/300, width: 400, height: 300 };
      case 'clothes':
        // 500x500 flip card - square
        return { aspectRatio: 1, width: 500, height: 500 };
      case 'jewellery':
        // 450x400 cards - slightly landscape
        return { aspectRatio: 450/400, width: 450, height: 400 };
      case 'general_store':
        // 600x400 - landscape
        return { aspectRatio: 600/400, width: 600, height: 400 };
      default:
        return { aspectRatio: 1, width: 400, height: 400 };
    }
  };

  const handleDelete = async (image: LandingImage) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      const response = await fetch(`/api/landing-images?id=${image.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        showToast('Image deleted successfully', 'success');
        fetchImages();
      } else {
        showToast(data.error || 'Failed to delete image', 'error');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      showToast('Failed to delete image', 'error');
    }
  };

  const handleUpdateOrder = async (image: LandingImage, newOrder: number) => {
    try {
      const response = await fetch('/api/landing-images', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: image.id,
          displayOrder: newOrder,
        }),
      });

      const data = await response.json();

      if (data.success) {
        fetchImages();
      }
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const currentSectionImages = images[activeSection] || [];
  const currentSectionInfo = sections.find(s => s.id === activeSection);

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#1a1a2e', marginBottom: '8px' }}>
          Landing Images Management
        </h1>
        <p style={{ color: '#666', fontSize: '16px' }}>
          Manage all images displayed on the landing page. Upload images section by section.
        </p>
      </div>

      {/* Section Tabs */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '24px',
        backgroundColor: '#f8f9fa',
        padding: '8px',
        borderRadius: '12px',
        flexWrap: 'wrap',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'thin',
        justifyContent: 'center',
      }}>
        {sections.map((section) => {
          const sectionImages = images[section.id] || [];
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              style={{
                padding: '10px 16px',
                fontSize: '13px',
                fontWeight: '600',
                color: activeSection === section.id ? '#fff' : '#555',
                backgroundColor: activeSection === section.id 
                  ? '#3498db' 
                  : '#fff',
                border: activeSection === section.id 
                  ? 'none'
                  : '1px solid #e0e0e0',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
                position: 'relative',
                boxShadow: activeSection === section.id 
                  ? '0 2px 8px rgba(52, 152, 219, 0.3)' 
                  : '0 1px 3px rgba(0,0,0,0.1)',
                minWidth: 'fit-content',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                if (activeSection !== section.id) {
                  e.currentTarget.style.backgroundColor = '#f0f0f0';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeSection !== section.id) {
                  e.currentTarget.style.backgroundColor = '#fff';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                }
              }}
            >
              {section.name}
              <span style={{ 
                marginLeft: '6px', 
                opacity: activeSection === section.id ? 0.9 : 0.7,
                fontSize: '11px',
                fontWeight: '500'
              }}>
                ({sectionImages.length}/{section.maxImages})
              </span>
            </button>
          );
        })}
      </div>


      {/* Upload Area */}
      <div style={{
        backgroundColor: '#fff',
        border: currentSectionImages.length >= (currentSectionInfo?.maxImages || 0) ? '2px dashed #ffc107' : '2px dashed #e0e0e0',
        borderRadius: '16px',
        padding: '32px 24px',
        textAlign: 'center',
        marginBottom: '24px',
        transition: 'all 0.3s ease',
        opacity: currentSectionImages.length >= (currentSectionInfo?.maxImages || 0) ? 0.85 : 1,
        boxShadow: currentSectionImages.length >= (currentSectionInfo?.maxImages || 0) 
          ? '0 2px 8px rgba(255, 193, 7, 0.2)' 
          : '0 2px 8px rgba(0, 0, 0, 0.05)',
      }}>
        <div style={{ marginBottom: '20px' }}>
          <svg 
            width="48" 
            height="48" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke={currentSectionImages.length >= (currentSectionInfo?.maxImages || 0) ? '#ffc107' : '#3498db'} 
            strokeWidth="2"
            style={{ margin: '0 auto', opacity: 0.7 }}
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleFileUpload(e, `${activeSection}_${Date.now()}`)}
          disabled={uploading || (currentSectionImages.length >= (currentSectionInfo?.maxImages || 0))}
          style={{ display: 'none' }}
          id="image-upload"
        />
        <label
          htmlFor="image-upload"
          style={{
            display: 'inline-block',
            padding: '14px 32px',
            backgroundColor: uploading || (currentSectionImages.length >= (currentSectionInfo?.maxImages || 0)) 
              ? '#e0e0e0' 
              : '#3498db',
            color: '#fff',
            borderRadius: '10px',
            cursor: uploading || (currentSectionImages.length >= (currentSectionInfo?.maxImages || 0)) 
              ? 'not-allowed' 
              : 'pointer',
            fontSize: '15px',
            fontWeight: '600',
            transition: 'all 0.3s ease',
            boxShadow: uploading || (currentSectionImages.length >= (currentSectionInfo?.maxImages || 0))
              ? 'none'
              : '0 4px 12px rgba(52, 152, 219, 0.3)',
          }}
          onMouseEnter={(e) => {
            if (!uploading && currentSectionImages.length < (currentSectionInfo?.maxImages || 0)) {
              e.currentTarget.style.backgroundColor = '#2980b9';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(52, 152, 219, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            if (!uploading && currentSectionImages.length < (currentSectionInfo?.maxImages || 0)) {
              e.currentTarget.style.backgroundColor = '#3498db';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(52, 152, 219, 0.3)';
            }
          }}
        >
          {uploading 
            ? '⏳ Uploading...' 
            : currentSectionImages.length >= (currentSectionInfo?.maxImages || 0)
            ? '🚫 Limit Reached'
            : `📤 Upload Image`
          }
        </label>
        {currentSectionImages.length < (currentSectionInfo?.maxImages || 0) && (
          <div style={{ marginTop: '16px' }}>
            <p style={{ color: '#666', fontSize: '13px', margin: '0 0 8px 0', fontWeight: '500' }}>
              {activeSection === 'hero' 
                ? `Format: PNG or WebP`
                : `Formats: JPG, PNG, WebP`
              }
            </p>
            <p style={{ color: '#999', fontSize: '12px', margin: 0 }}>
              {(() => {
                const cropSettings = getCropSettings();
                const sizeText = activeSection === 'hero' 
                  ? `${bannerSize === 'wide' ? '1920x800px' : '1920x600px'}`
                  : `${cropSettings.width}x${cropSettings.height}px`;
                const maxSize = activeSection === 'hero' ? '5MB' : '4MB';
                return `Size: ${sizeText} • Max ${maxSize}`;
              })()}
            </p>
          </div>
        )}
        
        {/* Banner Size Selector - Only for Hero Section */}
        {activeSection === 'hero' && (
          <div style={{
            marginTop: '16px',
            padding: '12px',
            backgroundColor: '#f0f7ff',
            borderRadius: '8px',
            border: '1px solid #b3d9ff'
          }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: '#333',
              marginBottom: '8px'
            }}>
              Banner Size:
            </label>
            <div style={{
              display: 'flex',
              gap: '12px'
            }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                color: '#555'
              }}>
                <input
                  type="radio"
                  name="bannerSize"
                  value="standard"
                  checked={bannerSize === 'standard'}
                  onChange={(e) => setBannerSize(e.target.value as 'standard' | 'wide')}
                  style={{ cursor: 'pointer' }}
                />
                Standard (1920x600px) - Default
              </label>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                color: '#555'
              }}>
                <input
                  type="radio"
                  name="bannerSize"
                  value="wide"
                  checked={bannerSize === 'wide'}
                  onChange={(e) => setBannerSize(e.target.value as 'standard' | 'wide')}
                  style={{ cursor: 'pointer' }}
                />
                Wide (1920x800px) - Optional
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Images Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: '#999' }}>Loading images...</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: activeSection === 'hero' 
            ? 'repeat(auto-fit, minmax(500px, 1fr))' 
            : 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '20px',
          justifyContent: activeSection === 'hero' ? 'center' : 'start',
          maxWidth: activeSection === 'hero' ? '1200px' : 'none',
          margin: activeSection === 'hero' ? '0 auto' : '0',
        }}>
          {/* Show empty cards if no images, or show images with empty slots */}
          {(() => {
            const sorted = currentSectionImages.sort((a, b) => a.display_order - b.display_order);
            const maxImages = currentSectionInfo?.maxImages || 1;
            const slots: Array<{id: string | number, image: LandingImage | null, index: number}> = [];
            
            // Fill all slots - show images where they exist, empty cards for missing slots
            for (let i = 0; i < maxImages; i++) {
              const image = sorted[i] || null;
              slots.push({
                id: image ? image.id : `empty-${i}`,
                image,
                index: i
              });
            }
            
            return slots;
          })().map(({ id, image, index }) => (
              <div
                key={id}
                style={{
                  backgroundColor: '#fff',
                  border: image ? '1px solid #e8e8e8' : '2px dashed #e0e0e0',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  boxShadow: image ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                  opacity: image ? 1 : 0.6,
                }}
                onMouseEnter={(e) => {
                  if (image) {
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)';
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.borderColor = '#d0d0d0';
                  }
                }}
                onMouseLeave={(e) => {
                  if (image) {
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = '#e8e8e8';
                  }
                }}
              >
                <div style={{ 
                  position: 'relative', 
                  width: '100%', 
                  paddingTop: activeSection === 'hero' ? '31.25%' : '75%',
                  backgroundColor: image ? '#f5f5f5' : '#fafafa'
                }}>
                  {image ? (
                    <Image
                      src={image.image_url}
                      alt={image.image_type}
                      fill
                      sizes={activeSection === 'hero' ? '100vw' : '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw'}
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      textAlign: 'center',
                      color: '#ccc',
                    }}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.5 }}>
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                      <p style={{ marginTop: '8px', fontSize: '12px', color: '#999' }}>Empty</p>
                    </div>
                  )}
                </div>
                <div style={{ padding: '16px' }}>
                  {image ? (
                    <>
                      <p style={{ fontSize: '11px', color: '#999', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {image.image_type}
                      </p>
                      <button
                        onClick={() => handleDelete(image)}
                        style={{
                          width: '100%',
                          padding: '10px',
                          backgroundColor: '#e74c3c',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '600',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#c0392b';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#e74c3c';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        Delete
                      </button>
                    </>
                  ) : (
                    <p style={{ fontSize: '11px', color: '#ccc', margin: 0, textAlign: 'center', fontStyle: 'italic' }}>
                      Slot {index + 1}
                    </p>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Image Cropper Modal */}
      {/* Image Cropper Modal - For All Sections */}
      {showCropper && imageToCrop && (() => {
        const cropSettings = getCropSettings();
        return (
          <ImageCropper
            image={imageToCrop}
            aspectRatio={cropSettings.aspectRatio}
            targetWidth={cropSettings.width}
            targetHeight={cropSettings.height}
            onCrop={handleCropComplete}
            onCancel={handleCropCancel}
          />
        );
      })()}
    </div>
  );
}

