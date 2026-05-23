'use client';

import { useState } from 'react';
import { notifyError, notifySuccess } from '@/lib/notify';

export default function UploadImagesPage() {
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<Record<string, string>>({});

  const images = ['genralstore.jpg'];

  const uploadImage = async (imageName: string) => {
    setUploading(true);
    try {
      const response = await fetch('/api/upload-homepage-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageName }),
      });

      const data = await response.json();
      if (data.success) {
        setResults((prev) => ({ ...prev, [imageName]: data.url }));
        notifySuccess(`${imageName} uploaded`, { description: data.url });
      } else {
        notifyError(data.error ?? 'Upload failed');
      }
    } catch {
      notifyError(`Could not upload ${imageName}. Please try again.`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Upload Homepage Images to Cloudinary</h1>
      <div style={{ marginTop: '30px' }}>
        {images.map((image) => (
          <div
            key={image}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '15px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              marginBottom: '10px',
            }}
          >
            <span>{image}</span>
            <div>
              {results[image] ? (
                <div>
                  <span style={{ color: 'green', marginRight: '10px' }}>✅ Uploaded</span>
                  <input
                    type="text"
                    value={results[image]}
                    readOnly
                    style={{ width: '400px', padding: '5px' }}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                </div>
              ) : (
                <button
                  onClick={() => uploadImage(image)}
                  disabled={uploading}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#1a1a2e',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: uploading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      {Object.keys(results).length > 0 && (
        <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
          <h3>Cloudinary URLs:</h3>
          <pre style={{ backgroundColor: 'white', padding: '15px', borderRadius: '4px', overflow: 'auto' }}>
            {JSON.stringify(results, null, 2)}
          </pre>
          <p style={{ marginTop: '10px', color: '#666' }}>
            Copy these URLs and update them in <code>src/app/page.tsx</code>
          </p>
        </div>
      )}
    </div>
  );
}
