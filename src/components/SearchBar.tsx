'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface SearchBarProps {
  onSearch: (query: string) => void;
  searchQuery: string;
}

export default function SearchBar({ onSearch, searchQuery }: SearchBarProps) {
  const [inputValue, setInputValue] = useState(searchQuery);
  const [isFocused, setIsFocused] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    onSearch(value);
  };

  const handleClear = () => {
    setInputValue('');
    onSearch('');
  };

  return (
    <div 
      style={{ 
        background: 'transparent',
        paddingTop: '24px',
        paddingBottom: '16px'
      }}
    >
      <div
        style={{
          maxWidth: '1300px',
          margin: '0 auto',
          paddingLeft: 'clamp(10px, 3vw, 15px)',
          paddingRight: 'clamp(10px, 3vw, 15px)'
        }}
      >
        {/* Search bar centered */}
        <motion.div 
          style={{
            position: 'relative',
            maxWidth: '500px',
            margin: '0 auto'
          }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Search Icon */}
          <svg
            style={{
              position: 'absolute',
              left: '18px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '20px',
              height: '20px',
              color: isFocused ? '#667eea' : '#999',
              transition: 'color 0.2s ease',
              zIndex: 1
            }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>

          {/* Search Input */}
          <motion.input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Search products..."
            style={{
              width: '100%',
              padding: '14px 50px 14px 50px',
              fontSize: '16px',
              border: isFocused ? '2px solid #667eea' : '2px solid rgba(255,255,255,0.4)',
              borderRadius: '35px',
              background: isFocused 
                ? 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(240,244,255,0.95) 100%)'
                : 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(15px)',
              color: '#1a1a1a',
              outline: 'none',
              boxShadow: isFocused 
                ? '0px 10px 30px rgba(102,126,234,0.35), 0px 5px 15px rgba(118,75,162,0.2), inset 0px 1px 0px rgba(255,255,255,0.8)' 
                : '0px 6px 20px rgba(102,126,234,0.15), 0px 2px 8px rgba(118,75,162,0.1)',
              transition: 'all 0.3s ease'
            }}
            whileFocus={{ scale: 1.02 }}
          />

          {/* Clear Button */}
          {inputValue && (
            <motion.button
              onClick={handleClear}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,0.05)',
                border: 'none',
                borderRadius: '50%',
                cursor: 'pointer',
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '28px',
                height: '28px'
              }}
              whileHover={{ scale: 1.1, background: 'rgba(0,0,0,0.1)' }}
              whileTap={{ scale: 0.9 }}
            >
              <svg
                style={{
                  width: '14px',
                  height: '14px',
                  color: '#666'
                }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </motion.button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
