
import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function checkPeatlandTable() {
  try {
    console.log("🔍 Checking database connection...");
    
    // Test basic connection
    const testQuery = await db.execute(sql`SELECT 1 as test`);
    console.log("✅ Database connection successful");

    // Check if the peatland_idn table exists
    console.log("\n🔍 Checking for peatland_idn table...");
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'peatland_idn'
      ) as exists;
    `);

    console.log("Table exists result:", tableExists.rows[0]);

    if (tableExists.rows[0].exists) {
      console.log("✅ Table 'peatland_idn' exists!");

      // Show table structure
      console.log("\n🏗️ Table structure:");
      const columns = await db.execute(sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'peatland_idn'
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      `);

      columns.rows.forEach(col => {
        console.log(`- ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULLABLE'}`);
      });

      // Count records
      const count = await db.execute(sql`
        SELECT COUNT(*) as total FROM peatland_idn;
      `);
      console.log(`\n📊 Total records: ${count.rows[0].total}`);

      // Show sample data if any exists
      if (parseInt(count.rows[0].total) > 0) {
        console.log("\n📋 Sample data (first 3 records):");
        const sample = await db.execute(sql`
          SELECT 
            COALESCE("Kubah_GBT", kubah_gbt, 'Unknown') as kubah_classification,
            COALESCE("Ekosistem", ekosistem, 'Unknown') as ecosystem,
            COALESCE("Province", province, 'Unknown') as province_name,
            COALESCE("Area_Ha", area_ha, 0) as area_hectares
          FROM peatland_idn 
          LIMIT 3;
        `);
        console.table(sample.rows);

        // Check if geometry column exists and is valid
        console.log("\n🗺️ Checking geometry data:");
        const geomCheck = await db.execute(sql`
          SELECT 
            COUNT(*) as total_rows,
            COUNT(geom) as rows_with_geom,
            COUNT(CASE WHEN ST_IsValid(geom) THEN 1 END) as valid_geom_rows
          FROM peatland_idn;
        `);
        console.log("Geometry stats:", geomCheck.rows[0]);
      }

      // Check for PostGIS extension
      console.log("\n🌐 Checking PostGIS extension:");
      try {
        const postgisCheck = await db.execute(sql`
          SELECT extname, extversion 
          FROM pg_extension 
          WHERE extname = 'postgis';
        `);
        if (postgisCheck.rows.length > 0) {
          console.log("✅ PostGIS extension is available:", postgisCheck.rows[0]);
        } else {
          console.log("❌ PostGIS extension not found");
        }
      } catch (err) {
        console.log("❌ Error checking PostGIS:", err);
      }

    } else {
      console.log("❌ Table 'peatland_idn' does not exist");
      
      // List all tables
      console.log("\n📋 Available tables in database:");
      const allTables = await db.execute(sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name;
      `);

      if (allTables.rows.length > 0) {
        allTables.rows.forEach((row, index) => {
          console.log(`${index + 1}. ${row.table_name}`);
        });
      } else {
        console.log("No tables found in public schema");
      }

      // Check if there are any tables with 'peat' in the name
      console.log("\n🔍 Searching for tables with 'peat' in name:");
      const peatTables = await db.execute(sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name ILIKE '%peat%'
        ORDER BY table_name;
      `);

      if (peatTables.rows.length > 0) {
        peatTables.rows.forEach((row, index) => {
          console.log(`${index + 1}. ${row.table_name}`);
        });
      } else {
        console.log("No tables found with 'peat' in name");
      }
    }

  } catch (error) {
    console.error("❌ Error checking database:", error);
  } finally {
    process.exit(0);
  }
}

// Run the check
checkPeatlandTable();
