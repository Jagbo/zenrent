const fetch = require('node-fetch');

// Get the email address from command line arguments
const email = process.argv[2] || 'j.agbodo@gmail.com';
const mailbox = email.split('@')[0]; // Extract the username part

console.log(`Checking emails for: ${email} (mailbox: ${mailbox})`);

async function checkEmails() {
  try {
    // First get the list of emails
    const response = await fetch(`http://localhost:54324/api/v1/mailbox/${mailbox}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch emails: ${response.statusText}`);
    }
    
    const emails = await response.json();
    console.log(`Found ${emails.length} emails in mailbox`);
    
    // Display the most recent email
    if (emails.length > 0) {
      const latestEmail = emails[0]; // Assuming they're sorted newest first
      console.log('\nLatest email:');
      console.log(`Subject: ${latestEmail.subject}`);
      console.log(`From: ${latestEmail.from}`);
      console.log(`Date: ${latestEmail.date}`);
      
      // Get the email content
      const emailId = latestEmail.id;
      const contentResponse = await fetch(`http://localhost:54324/api/v1/mailbox/${mailbox}/${emailId}`);
      
      if (!contentResponse.ok) {
        throw new Error(`Failed to fetch email content: ${contentResponse.statusText}`);
      }
      
      const emailContent = await contentResponse.json();
      
      // Look for password reset link in HTML content
      const htmlBody = emailContent.body.html || '';
      const linkMatch = htmlBody.match(/href="(https?:\/\/[^"]+)"/);
      const resetLink = linkMatch ? linkMatch[1] : 'No reset link found';
      
      console.log('\nReset Link:');
      console.log(resetLink);
      
      // For debugging: output the raw HTML
      console.log('\nHTML Content:');
      console.log(htmlBody);
    } else {
      console.log('No emails found in the mailbox');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkEmails(); 