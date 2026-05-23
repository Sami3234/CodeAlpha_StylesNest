'use client';

import { useState, type KeyboardEvent } from 'react';

type Props = {
  colors: string[];
  onChange: (colors: string[]) => void;
  required?: boolean;
  label?: string;
  hint?: string;
  placeholder?: string;
  error?: string;
  onClearError?: () => void;
};

export default function ColorListEditor({
  colors,
  onChange,
  required = false,
  label = 'Product colors',
  hint = 'Type a color name and press Add — e.g. Navy Blue, Maroon, Skin.',
  placeholder = 'e.g. Black, White, Peach…',
  error,
  onClearError,
}: Props) {
  const [draft, setDraft] = useState('');

  const addColor = () => {
    const name = draft.replace(/\s+/g, ' ').trim();
    if (!name) return;
    const exists = colors.some((c) => c.toLowerCase() === name.toLowerCase());
    if (exists) {
      setDraft('');
      return;
    }
    onChange([...colors, name]);
    setDraft('');
    onClearError?.();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addColor();
    }
  };

  const removeColor = (color: string) => {
    onChange(colors.filter((c) => c !== color));
    onClearError?.();
  };

  return (
    <div className={`pf-form-block pf-color-editor${error ? ' pf-color-editor--error' : ''}`}>
      <label className="pf-form-label">
        {label}
        {required ? <span className="pf-label-required"> *</span> : null}
        {!required ? (
          <span className="pf-badge pf-badge-optional" style={{ marginLeft: 8 }}>
            Optional
          </span>
        ) : null}
      </label>
      {hint ? <p className="pf-category-hint">{hint}</p> : null}

      <div className="pf-color-editor__row">
        <input
          type="text"
          className="pf-form-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          maxLength={48}
          aria-label="New color name"
        />
        <button type="button" className="pf-color-editor__add" onClick={addColor}>
          Add
        </button>
      </div>

      {colors.length > 0 ? (
        <ul className="pf-color-editor__list" aria-label="Added colors">
          {colors.map((color) => (
            <li key={color}>
              <span className="pf-color-editor__chip">{color}</span>
              <button
                type="button"
                className="pf-color-editor__remove"
                onClick={() => removeColor(color)}
                aria-label={`Remove ${color}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="pf-color-editor__empty">No colors added yet.</p>
      )}

      {error ? <p className="pf-field-error">⚠️ {error}</p> : null}
    </div>
  );
}
