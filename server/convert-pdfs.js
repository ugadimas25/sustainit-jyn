const pdf2pic = require('pdf2pic');
const fs = require('fs');
const path = require('path');

async function convertPdfsToImages() {
  try {
    console.log('Converting LCC flowchart PDF to image...');
    
    // Convert LCC flowchart PDF
    const lccConvert = pdf2pic.fromPath('server/assets/lcc-flowchart.pdf', {
      density: 300,
      saveFilename: 'lcc-flowchart',
      savePath: './server/assets/',
      format: 'png',
      width: 2000,
      height: 1500
    });
    
    const lccResult = await lccConvert(1, true);
    console.log('LCC flowchart converted:', lccResult);
    
    console.log('Converting Risk Analysis flowchart PDF to image...');
    
    // Convert Risk Analysis flowchart PDF
    const riskConvert = pdf2pic.fromPath('server/assets/risk-analysis-flowchart.pdf', {
      density: 300,
      saveFilename: 'risk-analysis-flowchart',
      savePath: './server/assets/',
      format: 'png',
      width: 2000,
      height: 1500
    });
    
    const riskResult = await riskConvert(1, true);
    console.log('Risk Analysis flowchart converted:', riskResult);
    
    // Convert images to base64
    console.log('Converting images to base64...');
    
    const lccImagePath = 'server/assets/lcc-flowchart.1.png';
    const riskImagePath = 'server/assets/risk-analysis-flowchart.1.png';
    
    if (fs.existsSync(lccImagePath)) {
      const lccBase64 = fs.readFileSync(lccImagePath, 'base64');
      fs.writeFileSync('server/assets/lcc-flowchart-base64.txt', lccBase64);
      console.log('✅ LCC flowchart base64 saved');
    }
    
    if (fs.existsSync(riskImagePath)) {
      const riskBase64 = fs.readFileSync(riskImagePath, 'base64');
      fs.writeFileSync('server/assets/risk-analysis-flowchart-base64.txt', riskBase64);
      console.log('✅ Risk Analysis flowchart base64 saved');
    }
    
    console.log('✅ PDF to image conversion completed successfully!');
    
  } catch (error) {
    console.error('❌ Error converting PDFs:', error);
  }
}

convertPdfsToImages();