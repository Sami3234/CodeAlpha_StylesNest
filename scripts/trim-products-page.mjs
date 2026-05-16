import fs from 'fs';

const path = 'src/app/admin/products/page.tsx';
const lines = fs.readFileSync(path, 'utf8').split(/\r?\n/);

// Keep lines 0-119 (before ProductModal), then DeleteModal from line 1764 (index 1763)
const kept = [
  ...lines.slice(0, 119),
  '',
  ...lines.slice(1763),
];

let content = kept.join('\n');

// Update imports - remove clothes imports if only used in modal, keep what's needed for list
content = content.replace(
  `import {
  CLOTHES_SIZE_OPTIONS,
  DEFAULT_CLOTHES_OPTIONS,
  isClothesCategory,
  isClothesSizeRequired,
  validateClothesOptions,
  type ClothesOptions,
} from '@/lib/clothes-options';
`,
  ''
);

content = content.replace(
  `// Translation function type
type TFunction = (key: string, options?: { defaultValue?: string }) => string;

// Translation map for admin panel
const translations: Record<string, string> = {
`,
  `import { adminProductT, type AdminProductTFunction } from '@/lib/admin/product-form-shared';

// Legacy alias for list page
const translations: Record<string, string> = {
`
);

content = content.replace(
  `// Helper function to validate URL or local path
const isValidUrl = (url: string): boolean => {
  if (!url || !url.trim()) return false;
  
  // Check if it's a local path (starts with /)
  if (url.startsWith('/')) return true;
  
  // Check if it's a valid URL
  try {
    new URL(url);
    return url.startsWith('http://') || url.startsWith('https://');
  } catch {
    return false;
  }
};

`,
  ''
);

content = content.replace(
  `  const t: TFunction = (key: string, options?: { defaultValue?: string }) => {
    return translations[key] || options?.defaultValue || key;
  };`,
  `  const t: AdminProductTFunction = (key, options) =>
    translations[key] || adminProductT(key, options);`
);

content = content.replace(
  `  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
`,
  ''
);

content = content.replace(
  `  const handleSaveProduct = async (productData: Product | Partial<Product>) => {
    if (editingProduct) {
      // For editing, ensure title and description are in proper format
      const updatedProduct: Product = {
        ...editingProduct,
        ...productData,
        id: editingProduct.id,
        // Preserve title format if title is already object
        title: productData.title || editingProduct.title,
        description: productData.description || editingProduct.description,
        features: productData.features || editingProduct.features,
      } as Product;
      updateProduct(updatedProduct);
      showToast('Changes Saved', 'success');
      setEditingProduct(null);
    } else {
      // For new product, use addProduct (English only)
      const result = await addProduct(productData as Partial<Product>);
      
      if (result.success) {
        showToast('✅ Product Added Successfully!', 'success');
        setEditingProduct(null);
      } else {
        // Show error in toast
        showToast(result.error || 'Failed to add product', 'error');
        
        // If duplicate key error, show helpful message
        if (result.error?.includes('duplicate key') || result.error?.includes('reset the database sequence')) {
          showToast('🔧 Fix: Visit /api/reset-sequence to fix this issue', 'error');
        }
        // Don't close modal so user can fix the issue
      }
    }
  };

`,
  ''
);

content = content.replace(
  `  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const openAddModal = async () => {
    // Automatically reset sequence before opening add modal
    try {
      showToast('🔧 Preparing database...', 'info');
      const response = await fetch('/api/reset-sequence');
      const data = await response.json();
      if (data.success) {
        console.log('✅ Database sequence reset:', data.message);
      }
    } catch (error) {
      console.error('Failed to reset sequence:', error);
      // Continue anyway - let user try
    }
    
    setEditingProduct(null);
    setIsModalOpen(true);
  };`,
  `  const openEditPage = (product: Product) => {
    router.push(\`/admin/products/\${product.id}/edit\`);
  };

  const openAddPage = () => {
    router.push('/admin/products/new');
  };`
);

content = content.replaceAll('openAddModal', 'openAddPage');
content = content.replaceAll('openEditModal', 'openEditPage');

content = content.replace(
  `      <ProductModal key={editingProduct?.id || 'new'} isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingProduct(null); }} product={editingProduct} onSave={handleSaveProduct} t={t} />
`,
  ''
);

content = content.replace(
  `  const { products, addProduct, updateProduct, deleteProduct, toggleProductStatus, reloadProducts, loading } =
    useProducts();`,
  `  const { products, deleteProduct, toggleProductStatus, reloadProducts, loading } = useProducts();`
);

fs.writeFileSync(path, content);
console.log('Trimmed products page to', kept.length, 'lines');
