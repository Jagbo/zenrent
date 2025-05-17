const { Resend } = require('resend');
require('dotenv').config({ path: '.env.local' });

const resend = new Resend(process.env.RESEND_API_KEY);

async function main() {
  try {
    console.log('Attempting to send test email...');
    console.log('Using API key:', process.env.RESEND_API_KEY);
    
    const { data, error } = await resend.emails.send({
      from: 'ZenRent <onboarding@resend.dev>',
      to: 'j.agbodo@gmail.com',
      subject: 'Test Email',
      html: '<p>This is a test email from ZenRent.</p>'
    });

    if (error) {
      console.error('Error sending email:', error);
    } else {
      console.log('Email sent successfully:', data);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

main(); 