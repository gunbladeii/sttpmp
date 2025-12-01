// Test Brevo Email Configuration
// Run with: node scripts/test-brevo-email.js

// Disable SSL verification for testing (if behind corporate proxy)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

require('dotenv').config({ path: '.env.local' });
const brevo = require('@getbrevo/brevo');

async function testBrevoEmail() {
  console.log('🧪 Testing Brevo Email Configuration...\n');

  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log('BREVO_API_KEY:', process.env.BREVO_API_KEY ? '✅ Set' : '❌ Missing');
  console.log('BREVO_SENDER_EMAIL:', process.env.BREVO_SENDER_EMAIL || '❌ Missing');
  console.log('BREVO_SENDER_NAME:', process.env.BREVO_SENDER_NAME || '❌ Missing');
  console.log('');

  if (!process.env.BREVO_API_KEY) {
    console.error('❌ BREVO_API_KEY is not set!');
    process.exit(1);
  }

  const apiInstance = new brevo.TransactionalEmailsApi();
  apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

  try {
    // Test 1: Get Account Info
    console.log('📡 Test 1: Checking Brevo Account...');
    const accountApi = new brevo.AccountApi();
    accountApi.setApiKey(brevo.AccountApiApiKeys.apiKey, process.env.BREVO_API_KEY);
    
    const accountInfo = await accountApi.getAccount();
    console.log('✅ Account connected!');
    console.log('   Email:', accountInfo.body.email);
    console.log('   Company:', accountInfo.body.companyName || 'N/A');
    console.log('');

    // Test 2: Get Senders List
    console.log('📡 Test 2: Checking Verified Senders...');
    const sendersApi = new brevo.SendersApi();
    sendersApi.setApiKey(brevo.SendersApiApiKeys.apiKey, process.env.BREVO_API_KEY);
    
    const senders = await sendersApi.getSenders();
    console.log('✅ Verified senders:');
    senders.body.senders.forEach(sender => {
      console.log(`   ${sender.email} - ${sender.active ? '✅ Active' : '❌ Inactive'}`);
    });
    console.log('');

    // Test 3: Send Test Email
    console.log('📡 Test 3: Sending Test Email...');
    const sendSmtpEmail = new brevo.SendSmtpEmail();
    
    sendSmtpEmail.sender = { 
      email: process.env.BREVO_SENDER_EMAIL, 
      name: process.env.BREVO_SENDER_NAME 
    };
    sendSmtpEmail.to = [{ 
      email: 'fisha.hafiz@moe.gov.my', 
      name: 'Test User' 
    }];
    sendSmtpEmail.subject = 'Test Email dari STTPMP';
    sendSmtpEmail.htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Test Email</h2>
        <p>Ini adalah test email dari sistem STTPMP.</p>
        <p>Jika anda menerima email ini, bermakna konfigurasi Brevo berjaya!</p>
      </div>
    `;

    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('✅ Test email sent successfully!');
    console.log('   Message ID:', result.body.messageId);
    console.log('');

    console.log('🎉 All tests passed! Brevo is configured correctly.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.body);
    }
    process.exit(1);
  }
}

testBrevoEmail();
