import { sql } from '@/lib/db';
import { mapProductRow } from '@/lib/product-mapper';
import { parseProductMeta } from '@/lib/product-meta';
import { getLineTotal, getUnitPrice } from '@/lib/product-pricing';
import { isOutOfStock, isStockTracked } from '@/lib/product-stock';
import {
  buildOrderProductName,
  validateCartLineOptions,
  type CartLineOptions,
} from '@/lib/cart-line-options';
import { getProductTitle } from '@/utils/getProductText';

export type OrderLineInput = {
  productId: number;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
  paymentMethod?: string;
};

export type ValidatedOrderLine = {
  productId: number;
  name: string;
  quantity: number;
  price: number;
  lineTotal: number;
  paymentMethod?: string;
  selectedSize?: string;
  selectedColor?: string;
  pickPoint?: string;
};

export type ValidateOrderResult =
  | { ok: true; products: ValidatedOrderLine[]; total: number }
  | { ok: false; error: string; status: number };

function normalizeOptions(line: OrderLineInput): CartLineOptions {
  return {
    selectedSize: line.selectedSize?.trim() || undefined,
    selectedColor: line.selectedColor?.trim() || undefined,
  };
}

export async function validateAndPriceOrderLines(
  lines: OrderLineInput[],
): Promise<ValidateOrderResult> {
  if (!Array.isArray(lines) || lines.length === 0) {
    return { ok: false, error: 'At least one product is required.', status: 400 };
  }

  const stockUse = new Map<number, number>();
  const validated: ValidatedOrderLine[] = [];

  for (const line of lines) {
    const productId = Math.floor(Number(line.productId));
    const quantity = Math.floor(Number(line.quantity));

    if (!Number.isFinite(productId) || productId < 1) {
      return { ok: false, error: 'Invalid product in order.', status: 400 };
    }
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > 99) {
      return { ok: false, error: 'Invalid quantity in order.', status: 400 };
    }

    const rows = await sql`
      SELECT
        id, title_en, title_ar, description_en, description_ar,
        current_price, original_price, discount, image, images,
        free_delivery, sold_count, category, features_en, features_ar,
        pricing_tiers, clothes_options, shoes_options, product_meta, status
      FROM products
      WHERE id = ${productId}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return { ok: false, error: `Product #${productId} not found.`, status: 400 };
    }

    const product = mapProductRow(rows[0] as Record<string, unknown>);
    if (product.status === 'inactive') {
      return { ok: false, error: `${getProductTitle(product)} is no longer available.`, status: 400 };
    }

    if (isOutOfStock(product)) {
      return { ok: false, error: `${getProductTitle(product)} is out of stock.`, status: 400 };
    }

    if (isStockTracked(product)) {
      const used = stockUse.get(productId) ?? 0;
      const limit = product.productMeta!.stockQuantity!;
      if (used + quantity > limit) {
        const left = Math.max(0, limit - used);
        return {
          ok: false,
          error:
            left <= 0
              ? `${getProductTitle(product)} is out of stock.`
              : `Only ${left} of ${getProductTitle(product)} available.`,
          status: 400,
        };
      }
      stockUse.set(productId, used + quantity);
    }

    const options = normalizeOptions(line);
    const optionsCheck = validateCartLineOptions(product, options);
    if (!optionsCheck.valid) {
      return {
        ok: false,
        error: `${getProductTitle(product)}: ${optionsCheck.error ?? 'Invalid options.'}`,
        status: 400,
      };
    }

    const name = buildOrderProductName(getProductTitle(product), product, options);
    const lineTotal = getLineTotal(product, quantity);
    const unitPrice = getUnitPrice(product, quantity);

    validated.push({
      productId,
      name,
      quantity,
      price: unitPrice,
      lineTotal,
      paymentMethod: line.paymentMethod?.trim() || undefined,
      selectedSize: options.selectedSize,
      selectedColor: options.selectedColor,
      pickPoint: product.productMeta?.pickPoint?.trim() || undefined,
    });
  }

  const total = validated.reduce((sum, l) => sum + l.lineTotal, 0);
  return { ok: true, products: validated, total };
}

/** Decrement stock after successful order (when tracked). */
export async function decrementStockForOrderLines(lines: ValidatedOrderLine[]): Promise<void> {
  const byProduct = new Map<number, number>();
  for (const line of lines) {
    byProduct.set(line.productId, (byProduct.get(line.productId) ?? 0) + line.quantity);
  }

  for (const [productId, qty] of byProduct) {
    const rows = await sql`
      SELECT product_meta FROM products WHERE id = ${productId} LIMIT 1
    `;
    if (rows.length === 0) continue;

    const meta = parseProductMeta(rows[0].product_meta);
    if (meta?.stockQuantity == null) continue;

    const current = meta.stockQuantity;
    const next = Math.max(0, current - qty);
    const nextMeta = { ...meta, stockQuantity: next };

    await sql`
      UPDATE products
      SET product_meta = ${JSON.stringify(nextMeta)}::jsonb,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${productId}
    `;
  }
}
