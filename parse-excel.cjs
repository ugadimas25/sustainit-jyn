const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Read the Excel file
const filePath = 'attached_assets/Form_06.1_06.2_ Analisa dan Mitigasi Risiko (2)_1758047696989.xlsb';

try {
  console.log('Reading Excel file:', filePath);
  
  // Read the binary Excel file
  const workbook = XLSX.readFile(filePath);
  
  console.log('Worksheet names:', workbook.SheetNames);
  
  // Process each worksheet
  workbook.SheetNames.forEach((sheetName, index) => {
    console.log(`\n=== SHEET ${index + 1}: ${sheetName} ===`);
    
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    
    console.log(`Rows: ${jsonData.length}`);
    console.log('First 20 rows:');
    jsonData.slice(0, 20).forEach((row, i) => {
      if (row.some(cell => cell !== '')) {
        console.log(`Row ${i + 1}:`, row);
      }
    });
    
    // Save to JSON file for easier analysis
    fs.writeFileSync(`risk-assessment-${sheetName.replace(/[^a-zA-Z0-9]/g, '_')}.json`, 
                     JSON.stringify(jsonData, null, 2));
    
    // Try to identify potential scoring criteria
    console.log('\n--- Potential Scoring Sections ---');
    jsonData.forEach((row, i) => {
      const rowText = row.join(' ').toLowerCase();
      if (rowText.includes('skor') || rowText.includes('score') || 
          rowText.includes('bobot') || rowText.includes('weight') ||
          rowText.includes('spatial') || rowText.includes('non') ||
          rowText.includes('kriteria') || rowText.includes('criteria')) {
        console.log(`Row ${i + 1}:`, row);
      }
    });
  });
  
  console.log('\n=== SUMMARY ===');
  console.log('Excel file parsed successfully!');
  console.log('JSON files created for each worksheet');
  console.log('Check the generated JSON files for detailed analysis');
  
} catch (error) {
  console.error('Error parsing Excel file:', error.message);
  console.log('File path:', filePath);
  console.log('File exists:', fs.existsSync(filePath));
  
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log('File size:', stats.size, 'bytes');
  }
}