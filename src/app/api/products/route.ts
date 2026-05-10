import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET all products
export async function GET() {
  try {
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
        status,
        created_at,
        updated_at
      FROM products
      ORDER BY created_at DESC
    `;

    // Transform database rows to Product format
    const products = rows.map((row) => ({
      id: row.id,
      title: {
        en: row.title_en,
        ar: row.title_ar,
      },
      description: {
        en: row.description_en,
        ar: row.description_ar,
      },
      currentPrice: parseFloat(row.current_price),
      originalPrice: parseFloat(row.original_price),
      discount: row.discount,
      image: row.image,
      images: row.images || [],
      freeDelivery: row.free_delivery,
      soldCount: row.sold_count,
      category: row.category,
      features: (row.features_en && row.features_en.length > 0) ? {
        en: row.features_en,
        ar: row.features_ar,
      } : undefined,
      pricingTiers: row.pricing_tiers || [],
      status: row.status,
    }));

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST - Create new product
export async function POST(request: NextRequest) {
  try {
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
    } = body;

    // Validation
    if (!title || !title.en || !title.ar) {
      console.error('Validation error: Title missing');
      return NextResponse.json(
        { error: 'Title (English and Arabic) is required' },
        { status: 400 }
      );
    }

    if (!description || !description.en || !description.ar) {
      console.error('Validation error: Description missing');
      return NextResponse.json(
        { error: 'Description (English and Arabic) is required' },
        { status: 400 }
      );
    }

    if (!image || !image.trim()) {
      console.error('Validation error: Image URL missing');
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    console.log('Inserting into database...');
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
        ${status || 'active'}
      )
      RETURNING *
    `;

    const row = result[0];
    const product = {
      id: row.id,
      title: {
        en: row.title_en,
        ar: row.title_ar,
      },
      description: {
        en: row.description_en,
        ar: row.description_ar,
      },
      currentPrice: parseFloat(row.current_price),
      originalPrice: parseFloat(row.original_price),
      discount: row.discount,
      image: row.image,
      images: row.images || [],
      freeDelivery: row.free_delivery,
      soldCount: row.sold_count,
      category: row.category,
      features: (row.features_en && row.features_en.length > 0) ? {
        en: row.features_en,
        ar: row.features_ar,
      } : undefined,
      pricingTiers: row.pricing_tiers || [],
      status: row.status,
    };

    console.log('Product created successfully:', product.id);
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        error: 'Failed to create product',
        details: error instanceof Error ? error.message : 'Unknown error',
        hint: 'Check server logs for more details'
      },
      { status: 500 }
    );
  }
}

// PUT - Update product
export async function PUT(request: NextRequest) {
  try {
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
    } = body;

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

    const row = result[0];
    const product = {
      id: row.id,
      title: {
        en: row.title_en,
        ar: row.title_ar,
      },
      description: {
        en: row.description_en,
        ar: row.description_ar,
      },
      currentPrice: parseFloat(row.current_price),
      originalPrice: parseFloat(row.original_price),
      discount: row.discount,
      image: row.image,
      images: row.images || [],
      freeDelivery: row.free_delivery,
      soldCount: row.sold_count,
      category: row.category,
      features: (row.features_en && row.features_en.length > 0) ? {
        en: row.features_en,
        ar: row.features_ar,
      } : undefined,
      pricingTiers: row.pricing_tiers || [],
      status: row.status,
    };

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

    const result = await sql`
      DELETE FROM products
      WHERE id = ${id}
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, id: result[0].id });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}

