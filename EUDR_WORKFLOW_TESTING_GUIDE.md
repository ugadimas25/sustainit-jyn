# EUDR Platform - End-to-End Workflow Testing Guide

## Overview
This guide walks you through the complete EUDR compliance workflow, from data collection to final Due Diligence Statement (DDS) report generation. The platform now features seamless integration between all modules.

## Prerequisites
- **Admin Credentials**: Username `kpneudr`, Password `kpneudr2025`
- **Platform URL**: Your Replit deployment URL on port 5000
- **Test Data**: Sample plot coordinates and supplier information
- **Browser**: Chrome, Firefox, or Safari (latest version)

---

## Complete Workflow Path
```
Data Collection → Supplier Creation → Spatial Analysis → Legality Assessment → Supply Chain → DDS Report
```

---

## Getting Started: Login & Access

### Step 0: Login to the Platform
1. **Open Browser**: Navigate to your platform URL (e.g., `https://your-replit.replit.app`)
2. **Login Page**: You'll see the KPN EUDR login screen
3. **Enter Credentials**:
   - Username: `kpneudr`
   - Password: `kpneudr2025`
4. **Click**: "Login" button
5. **Verify**: You should see the Dashboard with metrics and Quick Actions
6. **Troubleshooting**: If you get 401 errors, ensure you're logged in successfully

> **Important**: You must be logged in to access any features. All API requests require authentication.

---

## Step-by-Step Testing Guide

### Phase 1: Data Collection (Creates Supplier Automatically)

> **Key Feature**: The platform automatically creates a Supplier record when you submit any data collection form. The Supplier ID will be displayed in a **green success notification** at the top-right of your screen.

#### Option A: Estate Data Collection
1. **Navigate**: Go to `/data-collection`
2. **Select**: Click "Estate Data Collection" card
3. **Fill Form** with minimum required fields:
   - Nama Supplier (Supplier Name): "PT Test Estate"
   - Nama Penanggung Jawab (Contact Person): "John Doe"
   - Email Penanggung Jawab: "john@testestate.com"
   - Nomor Telepon: "+62123456789"
   - Alamat Kantor (Office Address): "Jakarta"
   - Izin Berusaha (Business License): "IB-12345"
4. **Submit**: Click Submit button
5. **📋 COPY THE SUPPLIER ID**: A green success notification will appear at the top-right corner showing:
   - **Message**: "Data Estate dan Supplier telah berhasil dibuat. Supplier ID: sup_xxxxx"
   - **Action Required**: **Copy the Supplier ID** (e.g., `sup_123abc456def`) - you'll need this for all next steps
   - The notification stays for a few seconds - copy it immediately!
6. **Verify**:
   - Data collection record created
   - **Supplier ID displayed in notification** (this is critical for next steps)
   - **Tier Assignment**: Automatically set to Tier 1

> **💡 Pro Tip**: Keep the Supplier ID in a text file or notepad. You'll use it multiple times in the workflow.

#### Option B: Mill Data Collection
1. **Navigate**: `/data-collection` → "Mill Data Collection"
2. **Fill Form**:
   - Nama Pabrik (Mill Name): "Test Palm Oil Mill"
   - Nama Penanggung Jawab: "Jane Smith"
   - Email: "jane@testmill.com"
   - Nomor Telepon: "+62987654321"
   - Alamat Kantor: "Medan"
   - UML ID: "UML-98765"
3. **Submit**: Click Submit button
4. **📋 COPY THE SUPPLIER ID**: Green notification shows "Data Mill dan Supplier telah berhasil dibuat. Supplier ID: sup_xxxxx"
5. **Verify**: **Tier Assignment** = Tier 1

#### Option C: Smallholder Data Collection
1. **Navigate**: `/data-collection` → "Traceability Data Collection"
2. **Fill Form**:
   - Nama Pemegang DO (DO Holder): "Ahmad Petani"
   - NIK Pemegang DO: "1234567890123456"
   - Nomor DO: "DO-2024-001"
   - Kebun Asal: "Kebun Sawit 1"
3. **Submit**: Click Submit button
4. **📋 COPY THE SUPPLIER ID**: Green notification shows "Data Smallholders dan Supplier telah berhasil dibuat. Supplier ID: sup_xxxxx"
5. **Verify**: **Tier Assignment** = Tier 3

#### Option D: KCP/Bulking Station
1. **Navigate**: `/data-collection` → "KCP Data Collection" or "Bulking Station"
2. **Fill Form** with KCP/Bulking details (contact person, email, address)
3. **Submit**: Click Submit button
4. **📋 COPY THE SUPPLIER ID**: Green notification shows "Data KCP/Bulking dan Supplier telah berhasil dibuat. Supplier ID: sup_xxxxx"
5. **Verify**: **Tier Assignment** = Tier 2

**🔑 Key Output**: You now have a Supplier ID! Save it in your notepad - you'll use it in Phase 2, 3, 4, and 5.

#### 📌 Alternative: How to Find Supplier ID if You Missed the Notification

If you didn't copy the Supplier ID from the notification:

1. **Go to Supply Chain**: Navigate to `/unified-supply-chain`
2. **Find Your Supplier**: Look for the supplier you just created (search by name)
3. **View Details**: Click on the supplier row
4. **Copy ID**: The Supplier ID is displayed in the supplier details

Or use browser DevTools (for technical users):
1. **Open DevTools**: Press F12 or right-click → Inspect
2. **Go to Network tab**: Click "Network"
3. **Submit form again**: Re-submit the data collection form
4. **Click the request**: Find the POST request to `/api/*-data-collection`
5. **View Response**: Click "Response" tab - you'll see the `supplierId` in the JSON

---

### Phase 2: Deforestation Monitoring & Spatial Analysis

#### Step 1: Upload Plot Shapefile
1. **Navigate**: Go to `/deforestation-monitoring`
2. **Click**: "Upload Shapefile" button
3. **Upload**: Select a shapefile (.shp + .shx + .dbf + .prj files)
   - Test file: Use any palm oil plantation boundary shapefile
   - File size: Under 50MB
4. **Verify**: Map displays uploaded plot boundaries
5. **Note**: Record the `plotId` from the upload response

#### Step 2: Run Spatial Analysis
1. **Select Plot**: Click on uploaded plot on the map
2. **Click**: "Analyze" or "Run EUDR Analysis" button
3. **Processing**: Wait 30-60 seconds for analysis
4. **Review Results**:
   - Deforestation alerts (GLAD, RADD, FORMA)
   - Protected area overlap (WDPA)
   - Peatland intersection
   - Forest cover loss statistics
   - Risk score calculation

#### Step 3: Link to Supplier
1. **In Analysis Results**: Find "Link to Supplier" option
2. **Enter**: The `supplierId` from Phase 1
3. **Submit**: Create plot-supplier linkage
4. **Verify**: Linkage created successfully

**🔑 Key Output**: Plot analysis results linked to supplier

---

### Phase 3: Legality Assessment

1. **Navigate**: Go to `/legality-assessment`
2. **Select Supplier**: Choose the supplier created in Phase 1
   - Search by name or ID
   - View tier assignment (Tier 1, 2, or 3)
3. **Complete Assessment**:
   - Fill all 8 EUDR legality indicators:
     - Legal harvest rights
     - Environmental compliance
     - Protected area compliance
     - Third-party rights
     - Labor rights
     - Anti-corruption
     - Tax compliance
     - Due diligence
   - Upload supporting documents for each indicator
4. **Submit Assessment**
5. **Review Score**:
   - Legality score calculated (0-100)
   - Risk level assigned (Low/Medium/High)
   - Status updated in system

**🔑 Key Output**: Supplier legality assessment complete with documents

---

### Phase 4: Supply Chain Management

1. **Navigate**: Go to `/unified-supply-chain`
2. **View Supplier**: Find your supplier in the list
3. **Verify Integration**:
   - Supplier shows correct tier
   - Linked plots displayed
   - Legality status visible
   - Risk indicators shown
4. **Create Supply Chain Links** (Optional):
   - Link Tier 3 (Smallholder) → Tier 2 (KCP/Bulking)
   - Link Tier 2 → Tier 1 (Estate/Mill)
   - Build complete supply chain hierarchy

**🔑 Key Output**: Complete supply chain traceability established

---

### Phase 5: DDS Report Generation

1. **Navigate**: Go to `/due-diligence-report`
2. **Select Supplier**: Choose the supplier with complete assessment
3. **Verify Prerequisites**:
   - ✅ Supplier exists
   - ✅ Plot linked and analyzed
   - ✅ Legality assessment complete
   - ✅ Documents uploaded
4. **Generate Report**: Click "Generate DDS Report"
5. **Review Report Sections**:
   - **Section 1**: Declaration of compliance
   - **Section 2**: Traceability information
   - **Section 3**: Deforestation analysis results
   - **Section 4**: Risk assessment
   - **Section 5**: Legality compliance
   - **Section 6**: Supporting documents
6. **Download**: Export as PDF

**🔑 Key Output**: Professional DDS report ready for submission

---

## Dashboard Verification

1. **Navigate**: Go to `/dashboard`
2. **Verify Metrics Display**:
   - Total suppliers count updated
   - Plots analyzed count increased
   - Risk distribution shows your data
   - Supply chain health metrics updated
   - Compliance status reflected
3. **Quick Actions**: Test navigation to each module

---

## Integration Points to Verify

### ✅ Data Collection → Supplier
- [ ] Form submission creates supplier automatically
- [ ] Correct tier assigned based on type
- [ ] `supplierId` returned in response
- [ ] Contact details mapped correctly

### ✅ Supplier → Spatial Analysis
- [ ] Can link plot to supplier using supplierId
- [ ] Analysis results associated with supplier
- [ ] Risk scores calculated

### ✅ Spatial Analysis → Legality
- [ ] Deforestation data flows to legality assessment
- [ ] Protected area violations flagged
- [ ] Environmental compliance pre-filled

### ✅ Legality → DDS Report
- [ ] Assessment data included in report
- [ ] Documents attached to report
- [ ] Risk scores displayed correctly

### ✅ All → Dashboard
- [ ] Real-time metrics update
- [ ] Tier distribution accurate
- [ ] Compliance percentage correct

---

## Expected Processing Times

- **Data Collection Form**: < 1 second
- **Shapefile Upload**: 2-5 seconds (depends on file size)
- **Spatial Analysis (EUDR API)**: 30-60 seconds
  - GFW analysis: ~2-5s per feature
  - Multiple datasets: GFW, JRC, SBTN
- **Legality Assessment**: < 1 second
- **DDS Report Generation**: 3-5 seconds

---

## Troubleshooting

### Issue: Supplier not created
**Solution**: Check that required fields are filled (name, contact person, email)

### Issue: Cannot link plot to supplier
**Solution**: Ensure you're using the exact `supplierId` from data collection response

### Issue: Spatial analysis timeout
**Solution**: 
- Check file size (< 50MB)
- Check feature count (< 1000 features)
- Retry if external API is slow

### Issue: DDS report missing data
**Solution**: Verify all prerequisites:
1. Supplier exists
2. Plot linked
3. Analysis complete
4. Legality assessment done

### Issue: Dashboard metrics not updating
**Solution**: Refresh page or clear localStorage

---

## Test Data Recommendations

### Sample Coordinates (Indonesia Palm Oil Region)
- **Latitude**: 2.5° N
- **Longitude**: 101.5° E
- **Region**: Riau Province (known palm oil area)

### Sample Supplier Names
- Estate: "PT Sawit Makmur Tbk"
- Mill: "Palm Oil Processing Mill Riau"
- KCP: "Koperasi Sawit Rakyat"
- Smallholder: "Ahmad bin Ibrahim"

---

## Success Criteria

A complete end-to-end test is successful when:

1. ✅ Data collection creates supplier with supplierId
2. ✅ Plot uploaded and appears on map
3. ✅ Spatial analysis completes with results
4. ✅ Plot successfully linked to supplier
5. ✅ Legality assessment completed with score
6. ✅ Supply chain hierarchy established
7. ✅ DDS report generated with all sections
8. ✅ Dashboard reflects all activities

---

## API Response Examples

### Data Collection Response
```json
{
  "id": "dc_123456",
  "namaSupplier": "PT Test Estate",
  "supplierId": "sup_789012",
  "createdAt": "2024-10-09T07:00:00Z",
  "message": "Data collection and supplier created successfully"
}
```

### Spatial Analysis Response
```json
{
  "plotId": "plot_345678",
  "supplierId": "sup_789012",
  "deforestationAlerts": 5,
  "protectedAreaOverlap": true,
  "riskScore": 65,
  "status": "analyzed"
}
```

---

## Notes

- **Automatic Integration**: All supplier creation is automatic - no manual steps needed
- **Tier Assignment**: Automatic based on collection type (Estate/Mill=1, KCP/Bulking=2, Smallholder=3)
- **Data Persistence**: All data persists in PostgreSQL database
- **Real-time Updates**: Dashboard updates automatically after each step
- **Document Storage**: Uses Google Cloud Storage for uploaded files

---

## Next Steps After Testing

1. Review generated DDS reports for accuracy
2. Test with real production data
3. Configure custom risk thresholds if needed
4. Set up automated alert notifications
5. Train users on the complete workflow

---

*Last Updated: October 9, 2025*
*Platform Version: 1.0.0*
