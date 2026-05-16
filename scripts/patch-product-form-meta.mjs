import fs from 'fs';

const path = 'src/components/admin/ProductForm.tsx';
let f = fs.readFileSync(path, 'utf8');

if (!f.includes("import './product-form.css'")) {
  f = f.replace(
    "import { adminProductT, type AdminProductTFunction, isValidProductImageUrl } from '@/lib/admin/product-form-shared';",
    `import { adminProductT, type AdminProductTFunction, isValidProductImageUrl } from '@/lib/admin/product-form-shared';
import ProductFormMetaFields from '@/components/admin/ProductFormMetaFields';
import {
  EMPTY_PRODUCT_META,
  normalizeProductMetaForSave,
  parseTagsInput,
  tagsToInput,
  type ProductMeta,
} from '@/lib/product-meta';
import './product-form.css';`
  );
}

if (!f.includes('const [productMeta, setProductMeta]')) {
  f = f.replace(
    `  const [clothesOptions, setClothesOptions] = useState<ClothesOptions>(() =>
    product?.clothesOptions
      ? { ...product.clothesOptions, sizes: [...product.clothesOptions.sizes] }
      : { ...DEFAULT_CLOTHES_OPTIONS, sizes: [...DEFAULT_CLOTHES_OPTIONS.sizes] }
  );`,
    `  const [clothesOptions, setClothesOptions] = useState<ClothesOptions>(() =>
    product?.clothesOptions
      ? { ...product.clothesOptions, sizes: [...product.clothesOptions.sizes] }
      : { ...DEFAULT_CLOTHES_OPTIONS, sizes: [...DEFAULT_CLOTHES_OPTIONS.sizes] }
  );

  const [productMeta, setProductMeta] = useState<ProductMeta>(() => ({
    ...EMPTY_PRODUCT_META,
    ...product?.productMeta,
  }));
  const [tagsInput, setTagsInput] = useState(() => tagsToInput(product?.productMeta?.tags));`
  );
}

if (!f.includes('productData.productMeta')) {
  f = f.replace(
    `      if (isClothesCategory(formData.category)) {
        productData.clothesOptions = {
          ...clothesOptions,
          sizes: clothesOptions.sizes.map((s) => s.toUpperCase()),
        };
      }`,
    `      if (isClothesCategory(formData.category)) {
        productData.clothesOptions = {
          ...clothesOptions,
          sizes: clothesOptions.sizes.map((s) => s.toUpperCase()),
        };
      }

      productData.productMeta = normalizeProductMetaForSave({
        ...productMeta,
        tags: parseTagsInput(tagsInput),
      });`
  );
}

f = f.replace(
  `<motion.div style={{ maxWidth: '960px', margin: '0 auto', width: '100%', paddingBottom: '32px' }}>`,
  `<div className="product-form-root">`
);
f = f.replace(
  `<div style={{ maxWidth: '960px', margin: '0 auto', width: '100%', paddingBottom: '32px' }}>`,
  `<div className="product-form-root">`
);

f = f.replace(
  `<div style={{ marginBottom: '20px' }}>
        <Link`,
  `<div className="product-form-back">
        <Link`
);

f = f.replace(
  `      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '16px',
          width: '100%',
          overflow: 'hidden',
          boxShadow: '0 4px 24px rgba(15, 23, 42, 0.08)',
          border: '1px solid #e2e8f0',
        }}
      >`,
  `<motion.div className="product-form-card">`
);
f = f.replace(
  `<div
        style={{
          backgroundColor: '#fff',
          borderRadius: '16px',
          width: '100%',
          overflow: 'hidden',
          boxShadow: '0 4px 24px rgba(15, 23, 42, 0.08)',
          border: '1px solid #e2e8f0',
        }}
      >`,
  `<div className="product-form-card">`
);

// header block - add class to first header div after Page header comment
f = f.replace(
  `        <div
          style={{
            padding: '28px 32px',
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >`,
  `        <div className="product-form-header">`
);

f = f.replace(
  `        <div style={{ padding: '28px 32px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>`,
  `        <div className="product-form-steps">`
);

f = f.replace(
  `        <div style={{ minHeight: '480px', padding: '32px 28px' }}>`,
  `        <div className="product-form-content">`
);

// footer - find Modal Footer or Form actions
f = f.replace(
  /padding: '24px 32px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '12px', backgroundColor: '#fafafa'/,
  "className: 'product-form-footer'"
);

// Insert meta fields after title block closing - before Category row
const metaInsert = `
              <ProductFormMetaFields
                meta={productMeta}
                onChange={setProductMeta}
                tagsInput={tagsInput}
                onTagsInputChange={setTagsInput}
                category={formData.category}
                t={t}
                fieldErrors={fieldErrors}
              />
`;

if (!f.includes('ProductFormMetaFields')) {
  f = f.replace(
    `              {/* Category & Status Row */}`,
    `${metaInsert}
              {/* Category & Status Row */}`
  );
}

// Fix closing - last two divs before function end
f = f.replace(/\n    <\/div>\n  \);\n}\s*$/m, '\n    </div>\n  );\n}\n');

fs.writeFileSync(path, f);
console.log('Patched ProductForm meta + layout');
