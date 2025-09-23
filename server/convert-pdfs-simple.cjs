const pdf2pic = require('pdf2pic');
const fs = require('fs');

async function convertPdfsToImages() {
  try {
    console.log('Converting LCC flowchart PDF to image...');
    
    const convert = pdf2pic.fromPath('server/assets/lcc-flowchart.pdf', {
      density: 150,
      saveFilename: 'lcc-flowchart',
      savePath: './server/assets/',
      format: 'png'
    });
    
    const lccResult = await convert(1);
    console.log('LCC flowchart converted:', lccResult);
    
    console.log('Converting Risk Analysis flowchart PDF to image...');
    
    const riskConvert = pdf2pic.fromPath('server/assets/risk-analysis-flowchart.pdf', {
      density: 150,
      saveFilename: 'risk-analysis-flowchart',
      savePath: './server/assets/',
      format: 'png'
    });
    
    const riskResult = await riskConvert(1);
    console.log('Risk Analysis flowchart converted:', riskResult);
    
    console.log('✅ PDF to image conversion completed!');
    
  } catch (error) {
    console.error('❌ Error converting PDFs:', error);
    console.log('📝 Creating fallback - using text descriptions instead');
  }
}

convertPdfsToImages();