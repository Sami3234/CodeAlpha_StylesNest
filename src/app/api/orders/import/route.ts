import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface ExcelProduct {
  name: string;
  quantity: number;
  price: number;
}

interface DatabaseProduct {
  id: number;
  title_en: string;
  title_ar: string;
  current_price: number;
  pricing_tiers: PricingTier[] | null;
}

interface PricingTier {
  quantity: number;
  price: number;
}

interface ProcessedProduct {
  name: string;
  quantity: number;
  price: number;
}

/**
 * Import orders from Excel data
 * Expected format: Array of orders with customer, phone, city, address, products, total
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orders } = body;

    if (!orders || !Array.isArray(orders) || orders.length === 0) {
      return NextResponse.json(
        { error: 'Invalid data format. Expected array of orders.' },
        { status: 400 }
      );
    }

    // Get current order count to generate sequential IDs
    const existingOrders = await sql`SELECT COUNT(*) as count FROM orders`;
    let currentCount = Number(existingOrders[0]?.count || 0);

    // Fetch all products from database for intelligent pricing
    const allProducts = await sql`
      SELECT id, title_en, title_ar, current_price, pricing_tiers 
      FROM products
    `;

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const orderData of orders) {
      try {
        // Validate required fields
        if (!orderData.customer || !orderData.phone || !orderData.city || !orderData.address) {
          errors.push(`Row skipped: Missing required fields (customer, phone, city, or address)`);
          errorCount++;
          continue;
        }

        if (!orderData.products || orderData.products.length === 0) {
          errors.push(`Order for ${orderData.customer} skipped: No products`);
          errorCount++;
          continue;
        }

        // Process products with intelligent pricing
        const processedProducts: ProcessedProduct[] = (orderData.products as ExcelProduct[]).map((prod) => {
          const productName = prod.name;
          const quantity = prod.quantity;
          const excelPrice = prod.price;

          // Try to find product in database (fuzzy matching)
          const dbProduct = (allProducts as DatabaseProduct[]).find((p) => {
            const titleEn = p.title_en.toLowerCase();
            const titleAr = p.title_ar;
            const searchName = productName.toLowerCase();
            
            return titleEn.includes(searchName) || 
                   searchName.includes(titleEn) ||
                   titleAr === productName;
          });

          if (dbProduct) {
            // Product exists in database
            const pricingTiers = dbProduct.pricing_tiers;
            
            if (pricingTiers && Array.isArray(pricingTiers) && pricingTiers.length > 0) {
              // Pricing tiers available - Use tier price
              const tier = pricingTiers.find((t) => t.quantity === quantity);
              
              if (tier) {
                // Tier found for this quantity
                return {
                  name: productName,
                  quantity: quantity,
                  price: tier.price / tier.quantity, // Unit price from tier
                };
              } else {
                // Tier not found for this quantity - Use Excel price
                return {
                  name: productName,
                  quantity: quantity,
                  price: excelPrice,
                };
              }
            } else {
              // No pricing tiers - Use Excel price (manual entry)
              return {
                name: productName,
                quantity: quantity,
                price: excelPrice,
              };
            }
          } else {
            // Product not in database - Use Excel price (custom product)
            return {
              name: productName,
              quantity: quantity,
              price: excelPrice,
            };
          }
        });

        // Generate sequential order ID
        currentCount++;
        const orderId = `#QE${currentCount.toString().padStart(4, '0')}`;

        // Get current date and time
        const now = new Date();
        const date = now.toISOString().split('T')[0];
        const time = now.toTimeString().slice(0, 5);

        // Calculate total based on processed products
        const total = processedProducts.reduce(
          (sum: number, p) => sum + (p.price * p.quantity), 
          0
        );

        // Insert into database
        await sql`
          INSERT INTO orders (
            id,
            customer,
            phone,
            city,
            address,
            products,
            total,
            status,
            date,
            time
          )
          VALUES (
            ${orderId},
            ${orderData.customer},
            ${orderData.phone},
            ${orderData.city},
            ${orderData.address},
            ${JSON.stringify(processedProducts)}::jsonb,
            ${parseFloat(String(total))}::decimal,
            'pending',
            ${date}::date,
            ${time}::time
          )
        `;

        successCount++;
      } catch (error) {
        console.error('Error importing order:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push(`Failed to import order for ${orderData.customer}: ${errorMessage}`);
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      imported: successCount,
      failed: errorCount,
      total: orders.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Error importing orders:', error);
    return NextResponse.json(
      { error: 'Failed to import orders', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

