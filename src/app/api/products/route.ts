import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { ensureProductSchema } from '@/lib/ensure-product-schema';
import { mapProductRow } from '@/lib/product-mapper';
import { categoryShowsGender, validateCategoryOptions } from '@/lib/category-form-fields';
import { isClothesCategory, parseClothesOptions } from '@/lib/clothes-options';
import { isShoesCategory, parseShoesOptions } from '@/lib/shoes-options';
import { parseProductMeta } from '@/lib/product-meta';
import { apiErrorResponse } from '@/lib/safe-errors';
import { hasValidAdminSession, requireAdminSession } from '@/lib/require-admin-session';
import {
  applyRealSoldCounts,
  getSoldCountsMapFromOrders,
  repairSoldCountsInBackground,
} from '@/lib/product-sold-count';
import {
  attachReviewSummariesToProducts,
  getProductReviewSummariesMap,
} from '@/lib/product-reviews';
import {
  ensureProductCodesBackfilled,
  resolveProductMetaForSave,
} from '@/lib/product-code';

export const dynamic = 'force-dynamic';

function serializeClothesOptions(category: string, clothesOptions: unknown) {
  if (isShoesCategory(category)) return null;
  if (!categoryShowsGender(category) && !isClothesCategory(category)) {
    return null;
  }
  const parsed = parseClothesOptions(clothesOptions);
  const check = validateCategoryOptions(category, parsed);
  if (!check.valid) {
    return { error: check.error };
  }
  return { value: JSON.stringify(parsed) };
}

function serializeShoesOptions(category: string, shoesOptions: unknown) {
  if (!isShoesCategory(category)) return null;
  const parsed = parseShoesOptions(shoesOptions);
  const check = validateCategoryOptions(category, undefined, parsed);
  if (!check.valid) {
    return { error: check.error };
  }
  return { value: JSON.stringify(parsed) };
}

// GET products — storefront: active only; admin session: full catalog
export async function GET(request: NextRequest) {
  try {
    await ensureProductSchema();
    await ensureProductCodesBackfilled();
    const includeInactive = await hasValidAdminSession(request);

    const rows = includeInactive
      ? await sql`
          SELECT
            id, title_en, title_ar, description_en, description_ar,
            current_price, original_price, discount, image, images,
            free_delivery, delivery_charge, sold_count, category, features_en, features_ar,
            pricing_tiers, clothes_options, shoes_options, product_meta,
            status, created_at, updated_at
          FROM products
          ORDER BY created_at DESC
        `
      : await sql`
          SELECT
            id, title_en, title_ar, description_en, description_ar,
            current_price, original_price, discount, image, images,
            free_delivery, delivery_charge, sold_count, category, features_en, features_ar,
            pricing_tiers, clothes_options, shoes_options, product_meta,
            status, created_at, updated_at
          FROM products
          WHERE COALESCE(LOWER(TRIM(status)), 'active') != 'inactive'
          ORDER BY created_at DESC
        `;

    const mapped = rows.map((row: Record<string, unknown>) => mapProductRow(row));

    // Storefront: real sold counts from orders. Admin list: use DB values (faster).
    let products = includeInactive
      ? mapped
      : applyRealSoldCounts(mapped, await getSoldCountsMapFromOrders());

    const reviewSummaries = await getProductReviewSummariesMap();
    products = attachReviewSummariesToProducts(products, reviewSummaries);

    if (!includeInactive) {
      repairSoldCountsInBackground();
    }

    return NextResponse.json(
      { products },
      {
        headers: {
          'Cache-Control': includeInactive
            ? 'private, no-store, max-age=0'
            : 'public, max-age=0, must-revalidate',
        },
      },
    );
  } catch (error) {
    return apiErrorResponse({ message: 'Failed to fetch products', status: 500, cause: error });
  }
}

// POST - Create new product (admin only)
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminSession(request);
    if (!admin.ok) return admin.response;

    await ensureProductSchema();

    const body = await request.json();
    
    const {
      title,
      description,
      currentPrice,
      originalPrice,
      discount,
      image,
      images,
      freeDelivery,
      deliveryCharge,
      category,
      features,
      pricingTiers,
      status,
      clothesOptions,
      shoesOptions,
      productMeta,
    } = body;

    if (!title || !title.en || !title.ar) {
      return NextResponse.json(
        { error: 'Title (English and Arabic) is required' },
        { status: 400 }
      );
    }

    if (!description || !description.en || !description.ar) {
      return NextResponse.json(
        { error: 'Description (English and Arabic) is required' },
        { status: 400 }
      );
    }

    if (!image || !image.trim()) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    const clothesSerialized = serializeClothesOptions(category, clothesOptions);
    if (clothesSerialized && 'error' in clothesSerialized) {
      return NextResponse.json({ error: clothesSerialized.error }, { status: 400 });
    }
    const shoesSerialized = serializeShoesOptions(category, shoesOptions);
    if (shoesSerialized && 'error' in shoesSerialized) {
      return NextResponse.json({ error: shoesSerialized.error }, { status: 400 });
    }

    const finalMeta = await resolveProductMetaForSave(
      parseProductMeta(productMeta) ?? {},
      String(category ?? 'general'),
    );
    const metaJson = JSON.stringify(finalMeta);

    const deliveryChargeValue =
      freeDelivery === true
        ? 0
        : Math.max(0, parseFloat(String(deliveryCharge ?? 0)) || 0);

    const result = await sql`
      INSERT INTO products (
        title_en,
        title_ar,
        description_en,
        description_ar,
        current_price,
        original_price,
        discount,
        image,
        images,
        free_delivery,
        delivery_charge,
        sold_count,
        category,
        features_en,
        features_ar,
        pricing_tiers,
        clothes_options,
        shoes_options,
        product_meta,
        status
      )
      VALUES (
        ${title.en},
        ${title.ar},
        ${description.en},
        ${description.ar},
        ${currentPrice},
        ${originalPrice},
        ${discount},
        ${image},
        ${JSON.stringify(images || [])},
        ${freeDelivery},
        ${deliveryChargeValue},
        0,
        ${category},
        ${JSON.stringify(features?.en || [])},
        ${JSON.stringify(features?.ar || [])},
        ${JSON.stringify(pricingTiers || [])},
        ${clothesSerialized && 'value' in clothesSerialized ? clothesSerialized.value : null},
        ${shoesSerialized && 'value' in shoesSerialized ? shoesSerialized.value : null},
        ${metaJson},
        ${status || 'active'}
      )
      RETURNING *
    `;

    const product = mapProductRow(result[0] as Record<string, unknown>);

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    return apiErrorResponse({ message: 'Failed to create product', status: 500, cause: error });
  }
}

// PUT - Update product (admin only)
export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdminSession(request);
    if (!admin.ok) return admin.response;

    await ensureProductSchema();

    const body = await request.json();
    const {
      id,
      title,
      description,
      currentPrice,
      originalPrice,
      discount,
      image,
      images,
      freeDelivery,
      deliveryCharge,
      category,
      features,
      pricingTiers,
      status,
      clothesOptions,
      shoesOptions,
      productMeta,
    } = body;

    const clothesSerialized = serializeClothesOptions(category, clothesOptions);
    if (clothesSerialized && 'error' in clothesSerialized) {
      return NextResponse.json({ error: clothesSerialized.error }, { status: 400 });
    }
    const shoesSerialized = serializeShoesOptions(category, shoesOptions);
    if (shoesSerialized && 'error' in shoesSerialized) {
      return NextResponse.json({ error: shoesSerialized.error }, { status: 400 });
    }

    const existingRows = await sql`
      SELECT product_meta FROM products WHERE id = ${id} LIMIT 1
    `;
    const existingMeta = parseProductMeta(
      existingRows[0] ? (existingRows[0] as { product_meta: unknown }).product_meta : undefined,
    );

    const finalMeta = await resolveProductMetaForSave(
      parseProductMeta(productMeta) ?? {},
      String(category ?? 'general'),
      { preserveSku: existingMeta?.sku },
    );
    const metaJson = JSON.stringify(finalMeta);

    const deliveryChargeValue =
      freeDelivery === true
        ? 0
        : Math.max(0, parseFloat(String(deliveryCharge ?? 0)) || 0);

    const result = await sql`
      UPDATE products
      SET
        title_en = ${title.en},
        title_ar = ${title.ar},
        description_en = ${description.en},
        description_ar = ${description.ar},
        current_price = ${currentPrice},
        original_price = ${originalPrice},
        discount = ${discount},
        image = ${image},
        images = ${JSON.stringify(images || [])},
        free_delivery = ${freeDelivery},
        delivery_charge = ${deliveryChargeValue},
        category = ${category},
        features_en = ${JSON.stringify(features?.en || [])},
        features_ar = ${JSON.stringify(features?.ar || [])},
        pricing_tiers = ${JSON.stringify(pricingTiers || [])},
        clothes_options = ${clothesSerialized && 'value' in clothesSerialized ? clothesSerialized.value : null},
        shoes_options = ${shoesSerialized && 'value' in shoesSerialized ? shoesSerialized.value : null},
        product_meta = ${metaJson},
        status = ${status || 'active'},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const product = mapProductRow(result[0] as Record<string, unknown>);

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

// DELETE - Delete product (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdminSession(request);
    if (!admin.ok) return admin.response;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    await sql`DELETE FROM products WHERE id = ${id}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
