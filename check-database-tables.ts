
import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function checkDatabaseTables() {
  try {
    console.log("🔍 Checking database connection...");
    
    // Test basic connection
    const testQuery = await db.execute(sql`SELECT 1 as test`);
    console.log("✅ Database connection successful");

    // Check if the table exists
    console.log("\n🔍 Checking for adm_boundary_lv0 table...");
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'adm_boundary_lv0'
      ) as exists;
    `);

    console.log("Table exists result:", tableExists.rows[0]);

    if (tableExists.rows[0].exists) {
      console.log("✅ Table 'adm_boundary_lv0' exists!");

      // Show table structure
      console.log("\n🏗️ Table structure:");
      const columns = await db.execute(sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'adm_boundary_lv0'
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      `);

      columns.rows.forEach(col => {
        console.log(`- ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULLABLE'}`);
      });

      // Count records
      const count = await db.execute(sql`
        SELECT COUNT(*) as total FROM adm_boundary_lv0;
      `);
      console.log(`\n📊 Total records: ${count.rows[0].total}`);

      // Show sample data if any exists
      if (parseInt(count.rows[0].total) > 0) {
        console.log("\n📋 Sample data (first 3 records):");
        const sample = await db.execute(sql`
          SELECT gid, iso_a3, iso_a2, nam_0, sovereign 
          FROM adm_boundary_lv0 
          LIMIT 3;
        `);
        console.table(sample.rows);
      }

    } else {
      console.log("❌ Table 'adm_boundary_lv0' does not exist");
      
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
    }

  } catch (error) {
    console.error("❌ Error checking database:", error);
  } finally {
    process.exit(0);
  }
}

// Run the check
checkDatabaseTables();
