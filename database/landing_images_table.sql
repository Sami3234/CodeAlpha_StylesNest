-- Create landing_images table
CREATE TABLE IF NOT EXISTS landing_images (
  id SERIAL PRIMARY KEY,
  section TEXT NOT NULL,
  image_type TEXT NOT NULL,
  image_url TEXT NOT NULL,
  cloudinary_public_id TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(section, image_type, display_order)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_landing_images_section ON landing_images(section);
CREATE INDEX IF NOT EXISTS idx_landing_images_active ON landing_images(is_active);

-- Add comment
COMMENT ON TABLE landing_images IS 'Stores landing page images for different sections';

