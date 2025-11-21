#!/usr/bin/env node

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function configureGiyaPay() {
  console.log('🔧 GiyaPay Configuration Tool\n');
  
  try {
    // Get configuration from user
    const merchantId = await question('Enter your GiyaPay Merchant ID: ');
    const merchantSecret = await question('Enter your GiyaPay Merchant Secret: ');
    const sandboxMode = (await question('Use sandbox mode? (y/n): ')).toLowerCase() === 'y';
    
    if (!merchantId || !merchantSecret) {
      console.error('❌ Merchant ID and Secret are required!');
      process.exit(1);
    }
    
    console.log('\n📡 Configuring GiyaPay...');
    
    // Try to configure via API
    const response = await fetch('http://localhost:9000/admin/giyapay', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        merchantId,
        merchantSecret,
        sandboxMode,
        isEnabled: true
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ GiyaPay configured successfully!');
      console.log(`   Merchant ID: ${result.config?.merchantId}`);
      console.log(`   Sandbox Mode: ${result.config?.sandboxMode ? 'Yes' : 'No'}`);
      console.log(`   Status: ${result.config?.isEnabled ? 'Enabled' : 'Disabled'}`);
    } else {
      const error = await response.text();
      console.error('❌ Failed to configure GiyaPay:', error);
      
      // Try alternative method - direct database/service approach
      console.log('\n🔄 Trying alternative configuration method...');
      
      // Set environment variables as fallback
      console.log('\n📝 Alternative: Set these environment variables in your backend:');
      console.log(`GIYAPAY_MERCHANT_ID=${merchantId}`);
      console.log(`GIYAPAY_MERCHANT_SECRET=${merchantSecret}`);
      console.log(`GIYAPAY_SANDBOX_MODE=${sandboxMode}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    // Provide manual configuration instructions
    console.log('\n📋 Manual Configuration Instructions:');
    console.log('1. Add these environment variables to your backend .env file:');
    console.log(`   GIYAPAY_MERCHANT_ID=${merchantId || 'your_merchant_id'}`);
    console.log(`   GIYAPAY_MERCHANT_SECRET=${merchantSecret || 'your_merchant_secret'}`);
    console.log(`   GIYAPAY_SANDBOX_MODE=${sandboxMode || 'false'}`);
    console.log('\n2. Restart your backend server');
    console.log('3. The GiyaPay options should appear in checkout');
  }
  
  rl.close();
}

// Check if backend is running
async function checkBackend() {
  try {
    const response = await fetch('http://localhost:9000/health');
    return response.ok;
  } catch {
    return false;
  }
}

async function main() {
  const backendRunning = await checkBackend();
  
  if (!backendRunning) {
    console.log('⚠️  Backend not running on http://localhost:9000');
    console.log('Please start your backend first with: npm run dev');
    process.exit(1);
  }
  
  await configureGiyaPay();
}

main().catch(console.error);



