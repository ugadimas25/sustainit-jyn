import jsPDF from 'jspdf';
import fs from 'fs';

export function generateFixedDDSPDF(reportData: any) {
  try {
    console.log('🔧 Generating FIXED 4-page DDS PDF with correct format...');

    // Create new PDF document
    const doc = new jsPDF();
    const currentDate = new Date().toLocaleDateString('en-GB');
    let yPos = 70;

    // ======================================================
    // PAGE 1 - DDS CREATION FORM INPUT (Halaman 1 ikuti isian formulir DDS creation)
    // ======================================================
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Due Diligence Statement', 105, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('-------------------------------------------------------------------------------------------------------------', 10, 30);
    doc.text('Page 1 of 4 - DDS Creation Form Input', 10, 40);
    doc.text('Status: SUBMITTED', 150, 40);
    doc.text(`Created On: ${currentDate}`, 10, 50);

    // DDS Form Data
    yPos = 70;
    doc.setFont('helvetica', 'bold');
    doc.text('1. Company Internal Ref:', 10, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text('DDS-2024-KPN-001', 80, yPos);

    yPos += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('2. Activity:', 10, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text('Import of Palm Oil Products', 50, yPos);

    // Operator Information
    yPos += 20;
    doc.setFont('helvetica', 'bold');
    doc.text('3. Operator/Trader name and address:', 10, yPos);
    
    yPos += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Name:', 15, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text('PT THIP', 40, yPos);

    yPos += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Address:', 15, yPos);
    doc.setFont('helvetica', 'normal');
    const address = 'Jl. Sudirman No. 123, Jakarta 12345, Indonesia';
    const addressLines = doc.splitTextToSize(address, 140);
    doc.text(addressLines, 45, yPos);
    yPos += addressLines.length * 5;

    yPos += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Country:', 15, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text('Indonesia', 45, yPos);

    // Commodity Section
    yPos += 20;
    doc.setFont('helvetica', 'bold');
    doc.text('Commodity(ies) or Product(s)', 10, yPos);

    yPos += 15;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Description', 10, yPos);
    doc.text('Net Mass (Kg)', 70, yPos);
    doc.text('% Est.', 120, yPos);
    doc.text('Units', 150, yPos);

    yPos += 10;
    doc.setFont('helvetica', 'normal');
    doc.text('Crude Palm Oil (CPO)', 10, yPos);
    doc.text('2150.000', 70, yPos);
    doc.text('5%', 120, yPos);
    doc.text('MT', 150, yPos);

    yPos += 15;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Scientific Name:', 10, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text('Elaeis guineensis', 60, yPos);

    yPos += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Producer Name:', 10, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text('PT BSU Growers', 60, yPos);

    yPos += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Country of Production:', 10, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text('Indonesia', 80, yPos);

    // Summary Plot Information
    yPos += 20;
    doc.setFont('helvetica', 'bold');
    doc.text('Summary Plot Information', 10, yPos);

    yPos += 10;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Total Producers: 15', 10, yPos);
    doc.text('Total Plots: 45', 10, yPos + 8);
    doc.text('Total Production Area (ha): 1250.50', 10, yPos + 16);
    doc.text('Country of Harvest: Indonesia', 10, yPos + 24);
    doc.text('Max. Intermediaries: 2', 10, yPos + 32);
    doc.text('Traceability Method: GPS Coordinates + Plot Mapping', 10, yPos + 40);
    doc.text('Expected Harvest Date: 2024-12-31', 10, yPos + 48);
    doc.text('Production Date Range: January 2024 - December 2024', 10, yPos + 56);

    // ======================================================
    // PAGE 2 - EUDR COMPLIANCE DECISION TREE (Halaman 2 EUDR Compliance Decision Tree GAMBAR TERLAMPIR)
    // ======================================================
    
    doc.addPage();
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('EUDR Compliance Decision Tree', 105, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.rect(10, 30, 190, 15);
    doc.text('Page 2 of 4', 15, 38);
    doc.text('EUDR Compliance Verification - Art. 2.40', 75, 38);
    doc.text(`Generated: ${currentDate}`, 150, 38);

    yPos = 55;

    // Embed the EUDR Compliance Decision Tree image
    try {
      const eudrDecisionTreeBase64 = fs.readFileSync('server/assets/eudr-decision-tree-base64.txt', 'utf8');
      console.log("✅ Embedding EUDR Compliance Decision Tree image");
      
      // Embed the decision tree image - full width to show details
      doc.addImage(eudrDecisionTreeBase64, 'PNG', 10, yPos, 190, 140);
      yPos += 150;
    } catch (error) {
      console.log('❌ EUDR Decision Tree image embedding failed:', error);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('[EUDR COMPLIANCE DECISION TREE]', 105, yPos + 40, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('Risk Assessment - Art. 10 → EUDR Compliance Verification - Art. 2.40', 105, yPos + 55, { align: 'center' });
      doc.text('Secondary Data → Primary Data → Geospatial Data → Surveys', 105, yPos + 65, { align: 'center' });
      doc.text('Proof of No Deforestation → Proof on Approved Land → Proof of Legality', 105, yPos + 75, { align: 'center' });
      yPos += 90;
    }

    // Brief description
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('This decision tree illustrates the systematic EUDR compliance verification process', 10, yPos);
    doc.text('following Article 2.40 requirements for deforestation-free supply chain verification.', 10, yPos + 8);

    // ======================================================
    // PAGE 3 - LCC ANALYSIS FLOWCHART (Halaman 3 flowchart LCC analysis PDF)
    // ======================================================
    
    doc.addPage();
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Land Cover Change Monitoring Flowchart', 105, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.rect(10, 30, 190, 15);
    doc.text('Page 3 of 4', 15, 38);
    doc.text('LCC Analysis Process Flow', 85, 38);
    doc.text(`Generated: ${currentDate}`, 150, 38);

    yPos = 55;

    // LCC Flowchart Description (since PDF to image conversion failed)
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('FLOWCHART LAND COVER CHANGE MONITORING', 105, yPos, { align: 'center' });
    yPos += 15;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const lccDescription = [
      'This flowchart illustrates the workflow for monitoring and verifying deforestation alerts',
      'within the KPN Plantation concession area. It aims to conduct monitoring every 2 weeks',
      'as well as incidental events.',
      '',
      'Process Flow:',
      '1. GIS Alert Detection → System Monitoring (Automated satellite analysis)',
      '2. Coordinate Verification → GIS Team (Location accuracy confirmation)', 
      '3. Desktop Analysis → Technical Team (Preliminary assessment)',
      '4. Field Verification → Estate Manager (On-ground validation)',
      '5. Final Report → System Monitoring (Compliance determination)',
      '',
      'Legal Basis:',
      '• UU No. 41/1999 on Forestry: Prohibits land clearing without permits',
      '• UU No. 32/2009 on Environmental Protection: Requires monitoring systems',
      '• UU No. 39/2014 on Plantations: Mandates sustainable principles',
      '• PP No. 22/2021 on Environmental Protection: Technology-based monitoring',
      '• Permen LHK No. P.8/MENLHK/SETJEN/KUM.1/3/2019: Remote sensing procedures',
      '• ISPO: Obliged to avoid deforestation and protect high conservation areas',
      '• NDPE Policy KPN Plantations: No Deforestation, No Peat, No Exploitation',
      '• EU Deforestation Regulation (EUDR): Supply chain traceability since 2020'
    ];

    lccDescription.forEach((line, index) => {
      doc.text(line, 10, yPos + (index * 6));
    });

    // ======================================================
    // PAGE 4 - RISK ANALYSIS FLOWCHART (Halaman 4 flowchart PDF analisis)
    // ======================================================
    
    doc.addPage();
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('EUDR Compliance Risk Analysis Flowchart', 105, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.rect(10, 30, 190, 15);
    doc.text('Page 4 of 4', 15, 38);
    doc.text('Risk Analysis and Mitigation Mechanism', 75, 38);
    doc.text(`Generated: ${currentDate}`, 150, 38);

    yPos = 55;

    // Risk Analysis Flowchart Description
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('EUDR Compliance Risk Analysis and Mitigation Mechanism', 105, yPos, { align: 'center' });
    yPos += 15;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const riskDescription = [
      'This mechanism describes the workflow to determine risk levels and mitigation actions',
      'within KPN Plantation concessions and its supplier base.',
      '',
      'Legal Basis and Related Policies:',
      '1. EU Deforestation Regulation (EUDR):',
      '   • Core principles: traceability, due diligence, deforestation-free production',
      '   • Cut-off date: 31 December 2020',
      '   • Legal compliance in country of production',
      '',
      '2. National Regulations (grouped by issue):',
      '   • Deforestation: Law No. 41/1999 on Forestry',
      '   • Land Legality: Law No. 5/1960 (Basic Agrarian Law/UUPA)',
      '   • Peatlands: MoEF Regulations on peatland governance',
      '   • Indigenous Peoples: Law No. 39/1999 on Human Rights',
      '   • Environment: Environmental quality standards, AMDAL/UKL-UPL',
      '   • Biodiversity: Law No. 5/1990 on Conservation',
      '   • Third-Party Rights (FPIC): Law No. 39/1999 on Human Rights',
      '   • Labor & Human Rights: Law No. 13/2003 on Manpower',
      '   • Taxation: Income Tax Law and VAT Law',
      '',
      '3. Company Policies:',
      '   • KPN Plantations NDPE Policy (No Deforestation, No Peat, No Exploitation)',
      '   • KPN Plantations EUDR Policy: due diligence, traceability, training, audits'
    ];

    riskDescription.forEach((line, index) => {
      doc.text(line, 10, yPos + (index * 5));
    });

    // Generate PDF buffer
    const pdfBuffer = doc.output('arraybuffer');
    
    console.log('✅ FIXED 4-page DDS PDF generated successfully!');
    console.log('📋 Pages: 1) DDS Form Input, 2) EUDR Decision Tree, 3) LCC Flowchart, 4) Risk Analysis');
    
    return pdfBuffer;

  } catch (error) {
    console.error('❌ Error generating FIXED DDS PDF:', error);
    throw error;
  }
}