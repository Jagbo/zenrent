// Test script for tax form generation
const PDFDocument = require('pdfkit');
const fs = require('fs-extra');
const path = require('path');

// Create directory for the test PDF
const testDir = path.join(process.cwd(), 'tmp', 'test-tax-forms');
fs.ensureDirSync(testDir);

// Create a test PDF
const doc = new PDFDocument({ margin: 50 });
const outputPath = path.join(testDir, 'test-form.pdf');
doc.pipe(fs.createWriteStream(outputPath));

// Add content to the PDF
doc.fontSize(24).text('ZenRent Tax Form Test', { align: 'center' });
doc.moveDown();
doc.fontSize(12).text(`User ID: fd98eb7b-e2a1-488b-a669-d34c914202b1`, { align: 'center' });
doc.moveDown();
doc.fontSize(12).text(`Tax Year: 2023/2024`, { align: 'center' });
doc.moveDown();
doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
doc.moveDown(2);

// Add more content
doc.fontSize(16).text('Self Assessment Tax Return (SA100)', { underline: true });
doc.moveDown();

// Personal details
doc.fontSize(14).text('Personal Details', { underline: true });
doc.moveDown(0.5);
doc.fontSize(12).text('Name: John Doe');
doc.fontSize(12).text('UTR: 1234567890');
doc.fontSize(12).text('National Insurance Number: AB123456C');
doc.moveDown();

// Income summary
doc.fontSize(14).text('Income Summary', { underline: true });
doc.moveDown(0.5);
doc.fontSize(12).text('Employment Income: £0.00');
doc.fontSize(12).text('Self-Employment Income: £0.00');
doc.fontSize(12).text('Property Income: £15,000.00');
doc.fontSize(12).text('Other Income: £0.00');
doc.fontSize(12).text('Total Income: £15,000.00');
doc.moveDown();

// Finalize the PDF
doc.end();

console.log(`Test PDF generated at: ${outputPath}`);
console.log('Please check if the file exists and can be opened correctly.'); 