path = r'src/components/admin/ProductForm.tsx'
with open(path, encoding='utf-8') as f:
    lines = f.readlines()

panel = """              <ProductFormCategoryPanel
                category={formData.category}
                clothesOptions={clothesOptions}
                setClothesOptions={setClothesOptions}
                toggleClothesSize={toggleClothesSize}
                toggleColor={toggleColor}
                fieldError={fieldErrors.clothesOptions}
                onClearError={() =>
                  setFieldErrors((prev) => ({ ...prev, clothesOptions: '' }))
                }
                t={t}
              />

"""

# Replace clothes block
start = end = None
for i, line in enumerate(lines):
    if start is None and 'isClothesCategory(formData.category)' in line:
        start = i
    if start is not None and '{/* Prices Row */}' in line:
        end = i
        break

if start is not None and end is not None:
    lines[start:end] = [panel]

# Move category row to top
cat_start = cat_end = None
for i, line in enumerate(lines):
    if 'Category & Status Row' in line:
        cat_start = i
    if cat_start and 'ProductFormCategoryPanel' in line:
        cat_end = i
        break

if cat_start and cat_end:
    cat_lines = lines[cat_start:cat_end]
    del lines[cat_start:cat_end]
    for i, line in enumerate(lines):
        if "gap: '18px'" in line and 'flexDirection' in line:
            insert = i + 1
            break
    header = [
        "              <motion.div className=\"pf-category-first\">\n",
    ]
    # fix header to div
    header = [
        "              <div className=\"pf-category-first\">\n",
        "                <p className=\"pf-category-first__title\">{t('admin.form.startWithCategory')}</p>\n",
        "                <p className=\"pf-category-first__desc\">{t('admin.form.startWithCategoryDesc')}</p>\n",
    ]
    inner = [l for l in cat_lines if 'Category & Status Row' not in l]
    lines[insert:insert] = header + inner + ["              </div>\n", "\n"]

# Add meta fields before step 2
meta = """              <motion.div className=\"pf-section-divider\" />
              <ProductFormMetaFields
                meta={productMeta}
                onChange={setProductMeta}
                tagsInput={tagsInput}
                onTagsInputChange={setTagsInput}
                category={formData.category}
                t={t}
                fieldErrors={fieldErrors}
              />

"""
meta = meta.replace('motion.div', 'motion.div').replace('<motion.div className="pf-section-divider" />', '<div className="pf-section-divider" />')
meta = """              <div className="pf-section-divider" />
              <ProductFormMetaFields
                meta={productMeta}
                onChange={setProductMeta}
                tagsInput={tagsInput}
                onTagsInputChange={setTagsInput}
                category={formData.category}
                t={t}
                fieldErrors={fieldErrors}
              />

"""

for i, line in enumerate(lines):
    if '{/* Step 2:' in line:
        lines.insert(i, meta)
        break

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('patched')
