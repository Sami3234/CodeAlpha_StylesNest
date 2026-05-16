# Repair corrupted ProductForm.tsx
from pathlib import Path

path = Path('src/components/admin/ProductForm.tsx')
lines = path.read_text(encoding='utf-8').splitlines(keepends=True)

# Keep imports through validateStep1 description check (lines 1-191, 0-indexed 0-190)
head = ''.join(lines[:191])

bridge = '''
    if (categoryShowsGender(formData.category) || isClothesCategory(formData.category)) {
      const catCheck = validateCategoryOptions(formData.category, clothesOptions);
      if (!catCheck.valid) {
        newErrors.push(catCheck.error || 'Complete category options');
        newFieldErrors.clothesOptions = catCheck.error || 'Required';
      }
    }

    setErrors(newErrors);
    setFieldErrors(newFieldErrors);
    if (newErrors.length > 0) {
      showToast(newErrors[0], 'error');
    }
    return newErrors.length === 0;
  };

  const validateStep3 = () => {
    const newErrors: string[] = [];
    if (!images.main && !imageFiles.main) {
      newErrors.push(t('admin.form.errors.mainImageRequired'));
    }
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) setCurrentStep(2);
    else if (currentStep === 2) setCurrentStep(3);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleAddFeature = () => {
    const trimmed = newFeature.trim();
    if (!trimmed) return;
    setFeatures([...features, trimmed]);
    setNewFeature('');
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const handleFileUpload = async (file: File, key: 'main' | 'image2' | 'image3' | 'image4') => {
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('category', formData.category);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok && data.url) {
        setImages((prev) => ({ ...prev, [key]: data.url }));
        setImageFiles((prev) => ({ ...prev, [key]: undefined }));
        showToast('Image uploaded', 'success');
      } else {
        showToast(data.error || 'Upload failed', 'error');
      }
    } catch {
      showToast('Upload failed', 'error');
    }
  };

  const handleSubmit = async () => {
    if (!validateStep3()) return;
    setIsSubmitting(true);
    try {
      const finalImages = { ...images };
      const keys = ['main', 'image2', 'image3', 'image4'] as const;
      for (const key of keys) {
        const file = imageFiles[key];
        if (!file) continue;
        const fd = new FormData();
        fd.append('file', file);
        fd.append('category', formData.category);
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (res.ok && data.url) finalImages[key] = data.url;
      }
      const imageList = [finalImages.main, finalImages.image2, finalImages.image3, finalImages.image4].filter(
        Boolean
      );
      const productData: Partial<Product> = {
        currentPrice: formData.currentPrice,
        originalPrice: formData.originalPrice,
        discount: formData.discount,
        category: formData.category,
        freeDelivery: formData.freeDelivery,
        status: formData.status,
        image: finalImages.main,
        images: imageList,
        pricingTiers,
        productMeta: normalizeProductMetaForSave({
          ...productMeta,
          tags: parseTagsInput(tagsInput),
        }),
      };
      if (categoryShowsGender(formData.category) || isClothesCategory(formData.category)) {
        productData.clothesOptions = {
          ...clothesOptions,
          sizes: (clothesOptions.sizes ?? []).map((s) => s.toUpperCase()),
          colors: clothesOptions.colors ?? [],
        };
      }
      if (product) {
        productData.title = product.title;
        productData.description = product.description;
      } else {
        productData.title = { en: formData.title, ar: formData.title };
        productData.description = { en: formData.description, ar: formData.description };
      }
      if (features.length) {
        productData.features = { en: features, ar: features };
      }
      if (product?.id) productData.id = product.id;
      await onSave(productData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const t = tProp ?? adminProductT;

  const steps = [
    { num: 1, icon: '📝', label: t('admin.form.tab.basic') },
    { num: 2, icon: '✨', label: t('admin.form.tab.features') },
    { num: 3, icon: '🖼️', label: t('admin.form.tab.images') },
  ];

  return (
    <motion.div className="product-form-root">
      <motion.div className="product-form-back">
        <Link href="/admin/products" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
          ← Back to products
        </Link>
      </motion.div>
      <motion.div className="product-form-card">
        <motion.div className="product-form-header">
          <div>
            <h1>{product ? t('admin.editProduct') : t('admin.addProduct')}</h1>
            <p>{t('admin.form.step')} {currentStep} {t('admin.form.of')} 3 — {steps.find((s) => s.num === currentStep)?.label}</p>
          </motion.div>
          <button type="button" onClick={onCancel} style={{ padding: '10px 16px', border: '2px solid #e2e8f0', borderRadius: 10, background: '#fff', cursor: 'pointer', fontWeight: 600 }}>{t('admin.cancel')}</button>
        </motion.div>
        <motion.div className="product-form-steps">
          {steps.map((step, idx) => (
            <div key={step.num} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <motion.div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                <motion.div style={{ width: 40, height: 40, borderRadius: '50%', background: currentStep >= step.num ? '#4CAF50' : '#e0e0e0', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{step.icon}</motion.div>
                <span style={{ fontSize: 12, marginTop: 6, fontWeight: currentStep === step.num ? 700 : 500, color: currentStep === step.num ? '#1a1a2e' : '#888' }}>{step.label}</span>
              </motion.div>
              {idx < steps.length - 1 ? <motion.div style={{ flex: 1, height: 2, background: currentStep > step.num ? '#4CAF50' : '#e0e0e0', margin: '0 8px 20px' }} /> : null}
            </motion.div>
          ))}
        </motion.div>
        {errors.length > 0 && (
          <motion.div style={{ padding: '12px 24px', background: '#ffebee' }}>
            {errors.map((error, index) => (
              <p key={index} style={{ color: '#e53935', fontSize: 13, margin: '4px 0' }}>⚠️ {error}</p>
            ))}
          </motion.div>
        )}
        <motion.div className="product-form-content">
'''

# Fix motion.div typos in bridge - use div
bridge = bridge.replace('motion.div', 'div')

step1_prefix = '''
          {currentStep === 1 && (
            <div className="pf-step1">
              <div className="pf-category-first">
                <p className="pf-category-first__title">{t('admin.form.startWithCategory')}</p>
                <p className="pf-category-first__desc">{t('admin.form.startWithCategoryDesc')}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="pf-form-block">
                    <label className="pf-form-label">{t('admin.form.category')}<span className="pf-label-required">*</span></label>
                    <select className="pf-form-select" value={formData.category} onChange={(e) => { setFormData({ ...formData, category: e.target.value }); if (fieldErrors.clothesOptions) setFieldErrors((p) => ({ ...p, clothesOptions: '' })); }}>
                      {categories.filter((c) => c.id !== 'all').map((cat) => (
                        <option key={cat.id} value={cat.id}>{t(`categories.${cat.id}`)}</option>
                      ))}
                    </select>
                  </motion.div>
                  <div className="pf-form-block">
                    <label className="pf-form-label">{t('admin.form.status')}</label>
                    <select className="pf-form-select" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}>
                      <option value="active">{t('admin.active')}</option>
                      <option value="inactive">{t('admin.inactive')}</option>
                    </select>
                  </motion.div>
                </motion.div>
              </motion.div>
              <div className="pf-form-block">
                <label className="pf-form-label">{t('admin.form.title')}<span className="pf-label-required">*</span></label>
                <input type="text" className={`pf-form-input${fieldErrors.title ? ' pf-form-input--error' : ''}`} value={formData.title} onChange={(e) => { setFormData({ ...formData, title: e.target.value }); if (fieldErrors.title) setFieldErrors((p) => ({ ...p, title: '' })); }} placeholder="Enter product title..." />
                {fieldErrors.title ? <p className="pf-field-error">⚠️ {fieldErrors.title}</p> : null}
              </motion.div>
'''
step1_prefix = step1_prefix.replace('motion.div', 'motion.div').replace('</motion.div>', '</div>').replace('<motion.div', '<div').replace('motion.div', 'motion.div')
# fix remaining
import re
step1_prefix = re.sub(r'</?motion\.motion\.div', lambda m: '</div' if m.group(0).startswith('</') else '<div', step1_prefix)
step1_prefix = step1_prefix.replace('motion.div', 'div')

# step1 body: lines 193-647 (index 192-647)
step1_body = ''.join(lines[192:647])

# meta + close step1
step1_suffix = '''
              <div className="pf-section-divider" />
              <ProductFormMetaFields meta={productMeta} onChange={setProductMeta} tagsInput={tagsInput} onTagsInputChange={setTagsInput} category={formData.category} t={t} fieldErrors={fieldErrors} />
            </motion.div>
          )}
'''
step1_suffix = step1_suffix.replace('motion.div', 'motion.div')
step1_suffix = step1_suffix.replace('</motion.div>', '</motion.div>').replace('<motion.div', '<div').replace('motion.div', 'div')

# steps 2-3 and footer: from 662 to end, fix meta duplicate
tail = ''.join(lines[661:])
# remove duplicate meta block at start of tail if present
tail = tail.replace('''              <div className="pf-section-divider" />
              <ProductFormMetaFields
                meta={productMeta}
                onChange={setProductMeta}
                tagsInput={tagsInput}
                onTagsInputChange={setTagsInput}
                category={formData.category}
                t={t}
                fieldErrors={fieldErrors}
              />

''', '')

out = head + bridge + step1_prefix + step1_body + step1_suffix + tail
out = out.replace('motion.div', 'div')
path.write_text(out, encoding='utf-8')
print('repaired', len(out.splitlines()), 'lines')
