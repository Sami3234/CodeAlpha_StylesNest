'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import './category-nav.css';

interface CategoryNavProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

/**
 * Local assets under `/public/images/`. General uses your `general.webp` file.
 */
const categoryImages: Record<string, string> = {
  all: '/images/all.png',
  cosmetics: '/images/cosmatics.jpg',
  jewelry: '/images/jewelry.jpg',
  watches: '/images/watches.jpg',
  makeup: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=200&h=200&fit=crop',
  clothes: '/images/clothes.jpg',
  shoes: '/images/shoes.jpg',
  electronics:
    'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=200&h=200&fit=crop',
  general: '/images/general.webp',
  bags: '/images/bags.jpg',
  menfashion: '/images/men-fashion.jpg',
};

const categoryIds = [
  'all',
  'cosmetics',
  'jewelry',
  'watches',
  'makeup',
  'clothes',
  'shoes',
  'electronics',
  'bags',
  'menfashion',
  'general',
];

const categoryLabels: Record<string, string> = {
  all: 'All',
  cosmetics: 'Cosmetics',
  jewelry: 'Jewelry',
  watches: 'Watches',
  makeup: 'Makeup',
  clothes: 'Clothes',
  shoes: 'Shoes',
  electronics: 'Electronics',
  general: 'General',
  bags: 'Bags',
  menfashion: 'Men Fashion',
};

export default function CategoryNav({ activeCategory, onCategoryChange }: CategoryNavProps) {
  return (
    <nav className="category-nav" aria-label="Product categories">
      <motion.div
        className="category-nav__inner"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <ul className="category-list">
          {categoryIds.map((categoryId, index) => {
            const categoryImage = categoryImages[categoryId];
            const isActive = activeCategory === categoryId;
            return (
              <motion.li
                key={categoryId}
                className="category-list__item"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <motion.button
                  type="button"
                  className={`category-btn${isActive ? ' category-btn--active' : ''}`}
                  onClick={() => onCategoryChange(categoryId)}
                  aria-pressed={isActive}
                  aria-label={categoryLabels[categoryId] || categoryId}
                  whileHover={{ scale: isActive ? 1.06 : 1.08 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="category-btn__ring" aria-hidden />
                  <span className="category-btn__inner">
                    {categoryImage ? (
                      <span className="category-btn__img-wrap">
                        <Image
                          src={categoryImage}
                          alt=""
                          fill
                          sizes="(max-width: 767px) 56px, 88px"
                          style={{
                            objectFit: 'cover',
                            filter: isActive
                              ? 'brightness(1.1) saturate(1.2)'
                              : 'brightness(1) saturate(1)',
                          }}
                          className="category-image"
                        />
                      </span>
                    ) : null}
                  </span>
                </motion.button>

                <span
                  className={`category-label${isActive ? ' category-label--active' : ''}`}
                >
                  {categoryLabels[categoryId] || categoryId}
                </span>
              </motion.li>
            );
          })}
        </ul>
      </motion.div>
    </nav>
  );
}
