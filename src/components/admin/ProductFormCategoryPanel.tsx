'use client';

import {
  CLOTHES_SIZE_OPTIONS,
  clothesStitchLabel,
  isClothesSizeRequired,
  type ClothesOptions,
} from '@/lib/clothes-options';
import type { ShoesOptions } from '@/lib/shoes-options';
import {
  categoryShowsClothesPanel,
  categoryShowsGender,
  categoryShowsShoesPanel,
  CLOTHES_COLOR_PRESETS,
  SHOE_COLOR_PRESETS,
  SHOE_SIZE_OPTIONS,
} from '@/lib/category-form-fields';
import type { AdminProductTFunction } from '@/lib/admin/product-form-shared';

type Props = {
  category: string;
  clothesOptions: ClothesOptions;
  setClothesOptions: React.Dispatch<React.SetStateAction<ClothesOptions>>;
  shoesOptions: ShoesOptions;
  setShoesOptions: React.Dispatch<React.SetStateAction<ShoesOptions>>;
  toggleClothesSize: (size: string) => void;
  toggleShoeSize: (size: string) => void;
  toggleClothesColor: (color: string) => void;
  toggleShoeColor: (color: string) => void;
  fieldError?: string;
  onClearError: () => void;
  t: AdminProductTFunction;
};

export default function ProductFormCategoryPanel({
  category,
  clothesOptions,
  setClothesOptions,
  shoesOptions,
  setShoesOptions,
  toggleClothesSize,
  toggleShoeSize,
  toggleClothesColor,
  toggleShoeColor,
  fieldError,
  onClearError,
  t,
}: Props) {
  const showGender = categoryShowsGender(category);
  const showClothes = categoryShowsClothesPanel(category);
  const showShoes = categoryShowsShoesPanel(category);

  if (!showGender && !showClothes && !showShoes) return null;

  const panelTitle = showClothes
    ? t('admin.form.clothesOptions')
    : showShoes
      ? t('admin.form.shoesOptions', { defaultValue: 'Shoes options' })
      : t('admin.form.categoryAudience', { defaultValue: 'Audience' });

  const genderValue = showShoes ? shoesOptions.gender : clothesOptions.gender;
  const setGender = (g: 'men' | 'women') => {
    if (showShoes) {
      setShoesOptions((p) => ({ ...p, gender: g }));
    } else {
      setClothesOptions((p) => ({ ...p, gender: g }));
    }
    onClearError();
  };

  return (
    <div className={`pf-category-panel${fieldError ? ' pf-category-panel--error' : ''}`}>
      <div className="pf-category-panel__head">
        <h4 className="pf-category-panel__title">{panelTitle}</h4>
        <span className="pf-badge pf-badge-store">Required for this category</span>
      </div>

      {showGender ? (
        <div className="pf-category-field">
          <label className="pf-category-label">
            {t('admin.form.clothesGender')} <span className="pf-label-required">*</span>
          </label>
          <p className="pf-category-hint">{t('admin.form.clothesGenderHint')}</p>
          <div className="pf-chip-row">
            {(['men', 'women'] as const).map((g) => (
              <label
                key={g}
                className={`pf-chip${genderValue === g ? ' pf-chip--active pf-chip--gender' : ''}`}
              >
                <input
                  type="radio"
                  name="categoryGender"
                  checked={genderValue === g}
                  onChange={() => setGender(g)}
                />
                {g === 'men' ? t('admin.form.clothesMen') : t('admin.form.clothesWomen')}
              </label>
            ))}
          </div>
        </div>
      ) : null}

      {showClothes ? (
        <>
          <div className="pf-category-field">
            <label className="pf-category-label">
              {t('admin.form.clothesStitch')} <span className="pf-label-required">*</span>
            </label>
            <p className="pf-category-hint">{t('admin.form.clothesStitchHint')}</p>
            <div className="pf-chip-row">
              {(['stitched', 'unstitched'] as const).map((s) => (
                <label
                  key={s}
                  className={`pf-chip${clothesOptions.stitch === s ? ' pf-chip--active pf-chip--stitch' : ''}`}
                >
                  <input
                    type="radio"
                    name="clothesStitch"
                    checked={clothesOptions.stitch === s}
                    onChange={() => {
                      setClothesOptions((p) => ({ ...p, stitch: s }));
                      onClearError();
                    }}
                  />
                  {clothesStitchLabel(s)}
                </label>
              ))}
            </div>
          </div>

          <div className="pf-category-field">
            <label className="pf-category-label">
              {t('admin.form.clothesSizes')}
              {isClothesSizeRequired(clothesOptions.stitch) ? (
                <span className="pf-label-required"> *</span>
              ) : (
                <span className="pf-badge pf-badge-optional" style={{ marginLeft: 8 }}>
                  Optional
                </span>
              )}
            </label>
            <p className="pf-category-hint">
              {isClothesSizeRequired(clothesOptions.stitch)
                ? t('admin.form.clothesSizesHintStitched')
                : t('admin.form.clothesSizesHintUnstitched')}
            </p>
            <div className="pf-chip-row">
              {CLOTHES_SIZE_OPTIONS.map((size) => {
                const selected = clothesOptions.sizes.includes(size);
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => toggleClothesSize(size)}
                    className={`pf-size-btn${selected ? ' pf-size-btn--active' : ''}`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pf-category-field">
            <label className="pf-category-label">
              {t('admin.form.clothesColors')}
              <span className="pf-badge pf-badge-optional" style={{ marginLeft: 8 }}>
                Optional
              </span>
            </label>
            <p className="pf-category-hint">{t('admin.form.clothesColorsHint')}</p>
            <div className="pf-chip-row">
              {CLOTHES_COLOR_PRESETS.map((color) => {
                const selected = (clothesOptions.colors ?? []).includes(color);
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => toggleClothesColor(color)}
                    className={`pf-color-btn${selected ? ' pf-color-btn--active' : ''}`}
                  >
                    {color}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      ) : null}

      {showShoes ? (
        <>
          <div className="pf-category-field">
            <label className="pf-category-label">
              {t('admin.form.shoesSizes', { defaultValue: 'Shoe sizes' })}{' '}
              <span className="pf-label-required">*</span>
            </label>
            <p className="pf-category-hint">
              {t('admin.form.shoesSizesHint', {
                defaultValue: 'Select EU sizes available for this pair (e.g. 38, 39, 40).',
              })}
            </p>
            <div className="pf-chip-row">
              {SHOE_SIZE_OPTIONS.map((size) => {
                const selected = shoesOptions.sizes.includes(size);
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => toggleShoeSize(size)}
                    className={`pf-size-btn${selected ? ' pf-size-btn--active' : ''}`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pf-category-field">
            <label className="pf-category-label">
              {t('admin.form.shoesColors', { defaultValue: 'Shoe colors' })}
              <span className="pf-badge pf-badge-optional" style={{ marginLeft: 8 }}>
                Optional
              </span>
            </label>
            <p className="pf-category-hint">
              {t('admin.form.shoesColorsHint', {
                defaultValue: 'Colors customers can choose when ordering.',
              })}
            </p>
            <div className="pf-chip-row">
              {SHOE_COLOR_PRESETS.map((color) => {
                const selected = (shoesOptions.colors ?? []).includes(color);
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => toggleShoeColor(color)}
                    className={`pf-color-btn${selected ? ' pf-color-btn--active' : ''}`}
                  >
                    {color}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      ) : null}

      {fieldError ? <p className="pf-field-error">⚠️ {fieldError}</p> : null}
    </div>
  );
}
