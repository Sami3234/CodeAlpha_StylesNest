import fs from 'fs';

const path = 'src/components/admin/ProductForm.tsx';
let f = fs.readFileSync(path, 'utf8');

const headerBtnOld = `          <button
            onClick={onCancel}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              color: '#fff',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>`;

const headerBtnNew = `          <button
            type="button"
            onClick={onCancel}
            style={{
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.2)',
              cursor: 'pointer',
              padding: '10px 18px',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            {t('admin.cancel')}
          </button>`;

if (f.includes(headerBtnOld)) f = f.replace(headerBtnOld, headerBtnNew);

f = f.replace(
  `<h2 style={{ fontSize: '20px', fontWeight: '600', color: '#fff', marginBottom: '4px' }}>`,
  `<h1 style={{ fontSize: '26px', fontWeight: '700', color: '#fff', marginBottom: '6px' }}>`
);
f = f.replace(
  /(\{product \? t\('admin\.editProduct'\) : t\('admin\.addProduct'\)\})\s*<\/h2>/,
  '$1</h1>'
);
f = f.replace(
  `{t('admin.form.step')} {currentStep} {t('admin.form.of')} 3`,
  `{t('admin.form.step')} {currentStep} {t('admin.form.of')} 3 — {steps.find((s) => s.num === currentStep)?.label}`
);
f = f.replace(`fontSize: '13px', color: 'rgba(255,255,255,0.6)'`, `fontSize: '14px', color: 'rgba(255,255,255,0.65)'`);

f = f.replace(
  `justifyContent: 'space-between',
          }}
        >
          <motion.div>
            <h1 style`,
  `justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <motion.div>
            <h1 style`
);

// fix if motion.div was wrongly inserted in header inner
f = f.replace(`          <motion.div>
            <h1 style`, `          <motion.div>
            <h1 style`);
f = f.replace(`          <motion.div>
            <h1`, `          <motion.div>
            <h1`);
f = f.replace(`          <motion.div>
            <h1`, `          <motion.div>
            <h1`);

// Actually fix motion to div for inner header content
f = f.replace(
  /(\{\/\* Page header \*\/\s*<div[\s\S]*?)<motion\.div>\s*<h1/,
  '$1<div>\n            <h1'
);
f = f.replace(
  /(\{\/\* Page header \*\/[\s\S]*?<p style=\{[\s\S]*?3 — \{steps[\s\S]*?<\/p>\s*)<\/motion\.motion.div>/,
  '$1</motion.div>'
);

f = f.replace(
  `{/* Step Indicator */}
        <div style={{ padding: '24px', backgroundColor: '#fafafa', borderBottom: '1px solid #eee' }}>`,
  `{/* Step Indicator */}
        <motion.div style={{ padding: '28px 32px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>`
);

f = f.replace(`padding: '24px', minHeight: '480px', padding: '32px 28px'`, `minHeight: '480px', padding: '32px 28px'`);
f = f.replace(`{/* Modal Footer */}`, `{/* Form actions */}`);
f = f.replace(
  `padding: '20px 24px', borderTop: '1px solid #eee'`,
  `padding: '24px 32px', borderTop: '1px solid #e2e8f0', backgroundColor: '#fafafa'`
);

fs.writeFileSync(path, f);
console.log('done');
