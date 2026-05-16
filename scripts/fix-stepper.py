from pathlib import Path

p = Path('src/components/admin/ProductForm.tsx')
text = p.read_text(encoding='utf-8')

old_start = text.find('        <div className="product-form-steps">')
old_end = text.find('        {errors.length > 0', old_start)
if old_start == -1 or old_end == -1:
    raise SystemExit(f'stepper markers not found: {old_start} {old_end}')

new_block = r'''        <motion.div className="product-form-steps">
          <motion.div className="pf-stepper" role="navigation" aria-label="Form progress">
            {steps.map((step, idx) => (
              <Fragment key={step.num}>
                <motion.div
                  className={`pf-stepper__step${currentStep === step.num ? ' pf-stepper__step--active' : ''}${currentStep > step.num ? ' pf-stepper__step--done' : ''}`}
                >
                  <motion.div className="pf-stepper__circle" aria-hidden>
                    {currentStep > step.num ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    ) : (
                      step.num
                    )}
                  </motion.div>
                  <span className="pf-stepper__label">{step.label}</span>
                </motion.div>
                {idx < steps.length - 1 ? (
                  <motion.div
                    className={`pf-stepper__line${currentStep > step.num ? ' pf-stepper__line--done' : ''}`}
                    aria-hidden
                  />
                ) : null}
              </Fragment>
            ))}
          </motion.div>
        </motion.div>
'''.replace('motion.div', 'div')

text = text[:old_start] + new_block + text[old_end:]

old_back = """      <motion.div className="product-form-back">
        <Link href="/admin/products" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
          ← Back to products
        </Link>
      </motion.div>""".replace('motion.div', 'div')

new_back = """      <div className="product-form-back">
        <Link href="/admin/products" className="product-form-back__link">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to products
        </Link>
      </div>"""

if old_back in text:
    text = text.replace(old_back, new_back)

old_h = """        <div className="product-form-header">
          <motion.div>
            <h1>{product ? t('admin.editProduct') : t('admin.addProduct')}</h1>
            <p>{t('admin.form.step')} {currentStep} {t('admin.form.of')} 3 — {steps.find((s) => s.num === currentStep)?.label}</p>
          </motion.div>
          <button type="button" onClick={onCancel} style={{ padding: '10px 16px', border: '2px solid #e2e8f0', borderRadius: 10, background: '#fff', cursor: 'pointer', fontWeight: 600 }}>{t('admin.cancel')}</button>
        </motion.div>"""

old_h = old_h.replace('motion.', '')

new_h = """        <div className="product-form-header">
          <motion.div className="product-form-header__text">
            <h1>{product ? t('admin.editProduct') : t('admin.addProduct')}</h1>
            <p>
              {t('admin.form.step')} {currentStep} {t('admin.form.of')} 3 —{' '}
              <span className="product-form-header__step-name">
                {steps.find((s) => s.num === currentStep)?.label}
              </span>
            </p>
          </motion.div>
          <button type="button" onClick={onCancel} className="product-form-header__cancel">
            {t('admin.cancel')}
          </button>
        </motion.div>"""

new_h = new_h.replace('motion.', '')

if old_h in text:
    text = text.replace(old_h, new_h)

p.write_text(text, encoding='utf-8')
print('ok')
