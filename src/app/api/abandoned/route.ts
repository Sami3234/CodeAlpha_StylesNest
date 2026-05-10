import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface AbandonedOrderRow {
  id: number;
  name: string;
  phone: string;
  city: string | null;
  address: string | null;
  quantity: string | null;
  product_id: string | null;
  status: string;
  created_at: string;
}

// GET all abandoned orders (optionally filtered by phone and name)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    const name = searchParams.get('name');

    let rows: AbandonedOrderRow[];
    
    if (phone && name) {
      // Filter by phone and name
      rows = await sql`
        SELECT 
          id,
          name,
          phone,
          city,
          address,
          quantity,
          product_id,
          status,
          created_at
        FROM abandoned_orders
        WHERE phone = ${phone} AND name = ${name}
        ORDER BY created_at DESC
      ` as AbandonedOrderRow[];
    } else {
      // Get all orders
      rows = await sql`
        SELECT 
          id,
          name,
          phone,
          city,
          address,
          quantity,
          product_id,
          status,
          created_at
        FROM abandoned_orders
        ORDER BY created_at DESC
      ` as AbandonedOrderRow[];
    }

    const abandonedOrders = rows.map((row) => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      city: row.city || '',
      address: row.address || '',
      quantity: row.quantity || '',
      product_id: row.product_id || '',
      status: 'unsubmitted' as const,
      created_at: row.created_at,
    }));

    return NextResponse.json({ abandonedOrders });
  } catch (error) {
    console.error('Error fetching abandoned orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch abandoned orders' },
      { status: 500 }
    );
  }
}

// POST - Create or update abandoned order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, city, address, quantity, product_id } = body;

    // Validation: name and phone are required
    if (!name || !name.trim() || !phone || !phone.trim()) {
      return NextResponse.json(
        { error: 'Name and phone are required' },
        { status: 400 }
      );
    }

    // Check if order with same phone and name already exists
    const existing = await sql`
      SELECT id, name, phone, city, address, quantity, product_id, created_at
      FROM abandoned_orders
      WHERE phone = ${phone} AND name = ${name}
    `;

    if (existing.length > 0) {
      // Update existing order
      const existingOrder = existing[0];
      
      // Check if data is exactly the same
      const isSameData = 
        existingOrder.city === (city || '') &&
        existingOrder.address === (address || '') &&
        existingOrder.quantity === (quantity || '') &&
        existingOrder.product_id === (product_id || '');
      
      if (isSameData) {
        // No changes, return existing
        return NextResponse.json({ 
          abandonedOrder: {
            id: existingOrder.id,
            name: existingOrder.name,
            phone: existingOrder.phone,
            city: existingOrder.city || '',
            address: existingOrder.address || '',
            quantity: existingOrder.quantity || '',
            product_id: existingOrder.product_id || '',
            status: 'unsubmitted' as const,
            created_at: existingOrder.created_at,
          },
          updated: false
        });
      }
      
      // Update with new data
      const result = await sql`
        UPDATE abandoned_orders
        SET
          city = ${city || ''},
          address = ${address || ''},
          quantity = ${quantity || ''},
          product_id = ${product_id || ''},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${existingOrder.id}
        RETURNING *
      `;
      
      const row = result[0];
      return NextResponse.json({
        abandonedOrder: {
          id: row.id,
          name: row.name,
          phone: row.phone,
          city: row.city || '',
          address: row.address || '',
          quantity: row.quantity || '',
          product_id: row.product_id || '',
          status: 'unsubmitted' as const,
          created_at: row.created_at,
        },
        updated: true
      });
    }

    // Create new abandoned order
    const id = `abandoned_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const result = await sql`
      INSERT INTO abandoned_orders (
        id,
        name,
        phone,
        city,
        address,
        quantity,
        product_id,
        status
      )
      VALUES (
        ${id},
        ${name},
        ${phone},
        ${city || ''},
        ${address || ''},
        ${quantity || ''},
        ${product_id || ''},
        'unsubmitted'
      )
      RETURNING *
    `;

    const row = result[0];
    return NextResponse.json({
      abandonedOrder: {
        id: row.id,
        name: row.name,
        phone: row.phone,
        city: row.city || '',
        address: row.address || '',
        quantity: row.quantity || '',
        product_id: row.product_id || '',
        status: 'unsubmitted' as const,
        created_at: row.created_at,
      },
      created: true
    }, { status: 201 });
  } catch (error) {
    console.error('Error saving abandoned order:', error);
    return NextResponse.json(
      { error: 'Failed to save abandoned order' },
      { status: 500 }
    );
  }
}

// DELETE - Remove abandoned order (when user submits)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const phone = searchParams.get('phone');
    const name = searchParams.get('name');

    if (id) {
      // Delete by ID
      const result = await sql`
        DELETE FROM abandoned_orders
        WHERE id = ${id}
        RETURNING id
      `;

      if (result.length === 0) {
        return NextResponse.json(
          { error: 'Abandoned order not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, id: result[0].id });
    } else if (phone && name) {
      // Delete by phone and name (when order is submitted)
      const result = await sql`
        DELETE FROM abandoned_orders
        WHERE phone = ${phone} AND name = ${name}
        RETURNING id
      `;

      return NextResponse.json({ 
        success: true, 
        deleted: result.length > 0,
        count: result.length 
      });
    } else {
      return NextResponse.json(
        { error: 'Either id or both phone and name are required' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error deleting abandoned order:', error);
    return NextResponse.json(
      { error: 'Failed to delete abandoned order' },
      { status: 500 }
    );
  }
}

