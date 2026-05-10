import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Download Excel template for importing orders
 * Returns sample format that users should follow
 */
export async function GET() {
  try {
    // Sample Excel data structure
    const template = {
      columns: ['Customer', 'Phone', 'City', 'Address', 'Product', 'Quantity', 'Price', 'Total'],
      sampleRows: [
        {
          Customer: 'Ahmed Hassan',
          Phone: '+92 300 1234567',
          City: 'Karachi',
          Address: 'Gulshan-e-Iqbal, Block 15',
          Product: 'Waterproof Turbo Shaver',
          Quantity: 2,
          Price: 4.9,
          Total: 9.8
        },
        {
          Customer: 'Sara Khan',
          Phone: '+92 321 9876543',
          City: 'Lahore',
          Address: 'DHA Phase 5, House 8',
          Product: 'Jet Mavic Camera HD 4k Drone',
          Quantity: 1,
          Price: 7.9,
          Total: 7.9
        }
      ],
      instructions: [
        'Required fields: Customer, Phone, City, Address, Product, Quantity, Price, Total',
        'Phone format: +92 3XX XXXXXXX or just numbers',
        'City: Use exact city names from dropdown',
        'Product: Product name',
        'Quantity: Number of items',
        'Price: Unit price',
        'Total: Total amount (Quantity × Price)',
        'All imported orders will be set to PENDING status'
      ]
    };

    return NextResponse.json(template);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate template' },
      { status: 500 }
    );
  }
}

