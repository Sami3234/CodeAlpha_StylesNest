/**
 * Script to call the add-general-store-products API endpoint
 */

async function addProducts() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const apiUrl = `${baseUrl}/api/add-general-store-products`;
  
  console.log('🚀 Calling API to add general store products...\n');
  console.log(`URL: ${apiUrl}\n`);
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Success! Products added to database:\n');
      console.log(JSON.stringify(data, null, 2));
      
      if (data.summary) {
        console.log('\n📊 Summary:');
        console.log(`   Total Products: ${data.summary.total}`);
        console.log(`   ✅ Successfully Added: ${data.summary.success}`);
        console.log(`   ❌ Failed: ${data.summary.failed}`);
        
        if (data.summary.errors && data.summary.errors.length > 0) {
          console.log('\n❌ Errors:');
          data.summary.errors.forEach((error, index) => {
            console.log(`   ${index + 1}. ${error}`);
          });
        }
      }
    } else {
      const errorData = await response.text();
      console.error('❌ Error:', response.status, response.statusText);
      console.error('Response:', errorData);
    }
  } catch (error) {
    console.error('❌ Network Error:', error.message);
    console.error('\n💡 Make sure your Next.js server is running:');
    console.error('   npm run dev');
  }
}

addProducts();

