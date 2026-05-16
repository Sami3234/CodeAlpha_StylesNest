import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { ensureProductSchema } from '@/lib/ensure-product-schema';
import { mapProductRow } from '@/lib/product-mapper';
import { categoryShowsGender, validateCategoryOptions } from '@/lib/category-form-fields';
import { isClothesCategory, parseClothesOptions } from '@/lib/clothes-options';
import { normalizeProductMetaForSave, parseProductMeta } from '@/lib/product-meta';
import { apiErrorResponse } from '@/lib/safe-errors';

export const dynamic = 'force-dynamic';

function serializeClothesOptions(category: string, clothesOptions: unknown) {
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

// GET all products
export async function GET() {
  try {
    await ensureProductSchema();

    const rows = await sql`
      SELECT 
        id,
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
        sold_count,
        category,
        features_en,
        features_ar,
        pricing_tiers,
        clothes_options,
        product_meta,
        status,
        created_at,
        updated_at
      FROM products
      ORDER BY created_at DESC
    `;

    const products = rows.map((row) => mapProductRow(row as Record<string, unknown>));

    return NextResponse.json({ products });
  } catch (error) {
    return apiErrorResponse({ message: 'Failed to fetch products', status: 500, cause: error });
  }
}

// POST - Create new product
export async function POST(request: NextRequest) {
  try {
    await ensureProductSchema();

    const body = await request.json();
    console.log('Received product data:', JSON.stringify(body, null, 2));
    
    const {
      title,
      description,
      currentPrice,
      originalPrice,
      discount,
      image,
      images,
      freeDelivery,
      soldCount,
      category,
      features,
      pricingTiers,
      status,
      clothesOptions,
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

    const metaJson = JSON.stringify(
      normalizeProductMetaForSave(parseProductMeta(productMeta) ?? {})
    );

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
        sold_count,
        category,
        features_en,
        features_ar,
        pricing_tiers,
        clothes_options,
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
        ${soldCount || 0},
        ${category},
        ${JSON.stringify(features?.en || [])},
        ${JSON.stringify(features?.ar || [])},
        ${JSON.stringify(pricingTiers || [])},
        ${clothesSerialized && 'value' in clothesSerialized ? clothesSerialized.value : null},
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

// PUT - Update product
export async function PUT(request: NextRequest) {
  try {
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
      soldCount,
      category,
      features,
      pricingTiers,
      status,
      clothesOptions,
      productMeta,
    } = body;

    const clothesSerialized = serializeClothesOptions(category, clothesOptions);
    if (clothesSerialized && 'error' in clothesSerialized) {
      return NextResponse.json({ error: clothesSerialized.error }, { status: 400 });
    }

    const metaJson = JSON.stringify(
      normalizeProductMetaForSave(parseProductMeta(productMeta) ?? {})
    );

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
        sold_count = ${soldCount || 0},
        category = ${category},
        features_en = ${JSON.stringify(features?.en || [])},
        features_ar = ${JSON.stringify(features?.ar || [])},
        pricing_tiers = ${JSON.stringify(pricingTiers || [])},
        clothes_options = ${clothesSerialized && 'value' in clothesSerialized ? clothesSerialized.value : null},
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

// DELETE - Delete product
export async function DELETE(request: NextRequest) {
  try {
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
