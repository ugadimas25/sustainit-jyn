CREATE TYPE "public"."assessment_status" AS ENUM('Draft', 'In Progress', 'Submitted', 'Under Review', 'Complete');--> statement-breakpoint
CREATE TYPE "public"."business_step" AS ENUM('harvesting', 'processing', 'shipping', 'receiving', 'storing', 'transformation', 'aggregation', 'disaggregation');--> statement-breakpoint
CREATE TYPE "public"."disposition" AS ENUM('active', 'inactive', 'in_transit', 'stored', 'processed', 'shipped');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('TRANSFER', 'TRANSFORM', 'AGGREGATE', 'DISAGGREGATE');--> statement-breakpoint
CREATE TYPE "public"."facility_type" AS ENUM('plot', 'mill', 'warehouse', 'port', 'collection_center', 'processing_center', 'refinery');--> statement-breakpoint
CREATE TYPE "public"."forest_status" AS ENUM('Ex-Forest Area', 'Forest Area', 'Non-Forest Area');--> statement-breakpoint
CREATE TYPE "public"."legality_status" AS ENUM('compliant', 'under_review', 'non_compliant');--> statement-breakpoint
CREATE TYPE "public"."mitigation_status" AS ENUM('pending', 'in_progress', 'completed', 'not_applicable');--> statement-breakpoint
CREATE TYPE "public"."party_type" AS ENUM('grower', 'mill', 'trader', 'manufacturer', 'port', 'warehouse');--> statement-breakpoint
CREATE TYPE "public"."permit_type" AS ENUM('AMDAL', 'UKL-UPL', 'SPPL', 'None Required');--> statement-breakpoint
CREATE TYPE "public"."relationship_type" AS ENUM('supplier', 'customer', 'processor', 'transporter');--> statement-breakpoint
CREATE TYPE "public"."risk_category" AS ENUM('spatial', 'non_spatial');--> statement-breakpoint
CREATE TYPE "public"."risk_item_type" AS ENUM('deforestasi', 'legalitas_lahan', 'kawasan_gambut', 'indigenous_people', 'sertifikasi', 'dokumentasi_legal');--> statement-breakpoint
CREATE TYPE "public"."risk_level" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."risk_parameter_level" AS ENUM('tinggi', 'sedang', 'rendah');--> statement-breakpoint
CREATE TYPE "public"."risk_status" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."supplier_type" AS ENUM('Estate', 'Mill', 'Bulking Station', 'KCP', 'Smallholder', 'Other');--> statement-breakpoint
CREATE TYPE "public"."tenure_type" AS ENUM('HGU', 'HGB', 'State Forest Permit', 'Customary Land', 'Other');--> statement-breakpoint
CREATE TABLE "analysis_results" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plot_id" text NOT NULL,
	"country" text NOT NULL,
	"area" numeric(12, 2) NOT NULL,
	"overall_risk" text NOT NULL,
	"compliance_status" text NOT NULL,
	"gfw_loss" text NOT NULL,
	"jrc_loss" text NOT NULL,
	"sbtn_loss" text NOT NULL,
	"gfw_loss_area" numeric(12, 4) DEFAULT '0',
	"jrc_loss_area" numeric(12, 4) DEFAULT '0',
	"sbtn_loss_area" numeric(12, 4) DEFAULT '0',
	"high_risk_datasets" jsonb DEFAULT '[]'::jsonb,
	"peatland_overlap" text DEFAULT 'No overlap',
	"peatland_area" numeric(12, 4) DEFAULT '0',
	"geometry" jsonb,
	"upload_session" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bulking_data_collection" (
	"id" serial PRIMARY KEY NOT NULL,
	"ubl_facility_id" text,
	"nama_fasilitas_bulking" text NOT NULL,
	"nama_group" text,
	"izin_berusaha" text,
	"tipe_sertifikat" text,
	"nomor_sertifikat" text,
	"lembaga_sertifikasi" text,
	"ruang_lingkup_sertifikasi" text,
	"masa_berlaku_sertifikat" text,
	"alamat_kantor" text,
	"alamat_bulking" text,
	"model_chain_of_custody" text,
	"kapasitas_total" numeric(10, 2),
	"sistem_pencatatan" text,
	"tanggal_pengisian_kuisioner" date,
	"nama_penanggung_jawab" text,
	"jabatan_penanggung_jawab" text,
	"email_penanggung_jawab" text,
	"nomor_telepon_penanggung_jawab" text,
	"nama_tim_internal" text,
	"jabatan_tim_internal" text,
	"email_tim_internal" text,
	"nomor_telepon_tim_internal" text,
	"daftar_tangki" jsonb DEFAULT '[]'::jsonb,
	"sumber_produk" jsonb DEFAULT '[]'::jsonb,
	"status" text DEFAULT 'draft',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commodities" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"uom_base" text NOT NULL,
	"category" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "commodities_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "custody_chains" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chain_id" text NOT NULL,
	"root_lot_id" varchar NOT NULL,
	"current_facility_id" varchar NOT NULL,
	"status" text DEFAULT 'active',
	"total_quantity" numeric(12, 3),
	"remaining_quantity" numeric(12, 3),
	"risk_level" "risk_level" DEFAULT 'low',
	"compliance_score" numeric(5, 2),
	"last_updated" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "custody_chains_chain_id_unique" UNIQUE("chain_id")
);
--> statement-breakpoint
CREATE TABLE "dds_reports" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shipment_id" text,
	"company_internal_ref" text,
	"activity" text,
	"operator_legal_name" text NOT NULL,
	"operator_address" text NOT NULL,
	"place_of_activity" text,
	"operator_country" text,
	"operator_iso_code" text,
	"eori_number" text,
	"hs_code" text NOT NULL,
	"product_description" text NOT NULL,
	"scientific_name" text,
	"common_name" text,
	"producer_name" text,
	"net_mass_kg" numeric(10, 3) NOT NULL,
	"volume_unit" text,
	"volume_quantity" numeric(10, 3),
	"percentage_estimation" numeric(5, 2),
	"supplementary_unit" text,
	"supplementary_quantity" numeric(10, 3),
	"plot_selection_method" text,
	"selected_plot_id" text,
	"plot_name" text,
	"total_producers" integer,
	"total_plots" integer,
	"total_production_area" numeric(10, 2),
	"country_of_harvest" text,
	"max_intermediaries" integer,
	"traceability_method" text,
	"expected_harvest_date" date,
	"production_date_range" text,
	"country_of_production" text NOT NULL,
	"geolocation_type" text,
	"geolocation_coordinates" text,
	"uploaded_geojson" jsonb,
	"geojson_validated" boolean DEFAULT false,
	"geojson_validation_errors" text,
	"plot_geolocations" text[],
	"establishment_geolocations" text[],
	"kml_file_name" text,
	"geojson_file_paths" text,
	"plot_bounding_box" jsonb,
	"plot_centroid" jsonb,
	"plot_area" numeric(12, 4),
	"prior_dds_reference" text,
	"operator_declaration" text NOT NULL,
	"signed_by" text NOT NULL,
	"signed_date" timestamp NOT NULL,
	"signatory_function" text NOT NULL,
	"digital_signature" text,
	"signature_type" text,
	"signature_image_path" text,
	"signature_data" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"submission_date" timestamp,
	"eu_trace_reference" text,
	"pdf_document_path" text,
	"pdf_file_name" text,
	"session_id" text,
	"download_count" integer DEFAULT 0,
	"last_downloaded" timestamp,
	"deforestation_risk_level" text,
	"legality_status" text,
	"compliance_score" numeric(5, 2),
	"traceability" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "estate_data_collection" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nama_supplier" text NOT NULL,
	"nama_group_parent_company" text,
	"akta_pendirian_perusahaan" text,
	"akta_pendirian_dokumen" text,
	"akta_perubahan" text,
	"akta_perubahan_dokumen" text,
	"izin_berusaha" text,
	"tipe_sertifikat" text,
	"nomor_sertifikat" text,
	"lembaga_sertifikasi" text,
	"ruang_lingkup_sertifikasi" text,
	"masa_berlaku_sertifikat" text,
	"link_dokumen" text,
	"alamat_kantor" text,
	"alamat_kebun" text,
	"koordinat_kantor" text,
	"koordinat_kebun" text,
	"jenis_supplier" text,
	"total_produksi_tbs" text,
	"tanggal_pengisian_kuisioner" text,
	"nama_penanggung_jawab" text,
	"jabatan_penanggung_jawab" text,
	"email_penanggung_jawab" text,
	"nomor_telepon_penanggung_jawab" text,
	"nama_tim_internal" text,
	"jabatan_tim_internal" text,
	"email_tim_internal" text,
	"nomor_telepon_tim_internal" text,
	"sumber_tbs" jsonb DEFAULT '[]'::jsonb,
	"memiliki_kebijakan_perlindungan_hutan" boolean,
	"keterangan_kebijakan_hutan" text,
	"dokumen_kebijakan_hutan" text,
	"mengikuti_workshop_ndpe" boolean,
	"keterangan_workshop_ndpe" text,
	"memiliki_sop_konservasi" boolean,
	"memiliki_sop_pembukaan_lahan" boolean,
	"keterangan_sop" text,
	"melakukan_penilaian_nkt" boolean,
	"menyampaikan_laporan_nkt" boolean,
	"melakukan_penilaian_skt" boolean,
	"keterangan_penilaian" text,
	"penanaman_di_area_gambut" boolean,
	"keterangan_area_gambut" text,
	"luas_area_gambut" numeric(10, 2),
	"tahun_pembukaan_gambut" integer,
	"memiliki_sk_titik_penaatan" boolean,
	"keterangan_sk_titik_penaatan" text,
	"dokumen_sk_titik_penaatan" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "eudr_assessments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supplier_type" "supplier_type" NOT NULL,
	"supplier_name" text NOT NULL,
	"supplier_id" text NOT NULL,
	"location" text NOT NULL,
	"ownership" text,
	"contact_name" text,
	"contact_position" text,
	"contact_email" text,
	"contact_phone" text,
	"status" "assessment_status" DEFAULT 'Draft',
	"assigned_auditor" text,
	"land_title_number" text,
	"title_issuance_date" date,
	"tenure_type" "tenure_type" NOT NULL,
	"land_area" numeric(10, 2) NOT NULL,
	"gps_coordinates" text,
	"plot_map_reference" text,
	"land_tenure_documents" jsonb DEFAULT '[]'::jsonb,
	"permit_type" "permit_type" NOT NULL,
	"permit_number" text,
	"issuance_year" integer,
	"environmental_status" text NOT NULL,
	"monitoring_report_details" text,
	"environmental_documents" jsonb DEFAULT '[]'::jsonb,
	"forest_license_number" text,
	"forest_status" "forest_status" NOT NULL,
	"impact_assessment_id" text,
	"protected_area_status" boolean DEFAULT false,
	"forest_documents" jsonb DEFAULT '[]'::jsonb,
	"fpic_status" boolean DEFAULT false,
	"fpic_date" date,
	"communal_rights" boolean DEFAULT false,
	"land_conflict" boolean DEFAULT false,
	"conflict_description" text,
	"community_permits" integer DEFAULT 0,
	"third_party_documents" jsonb DEFAULT '[]'::jsonb,
	"employee_count" integer DEFAULT 0,
	"permanent_employees" integer DEFAULT 0,
	"contractual_employees" integer DEFAULT 0,
	"has_worker_contracts" boolean DEFAULT false,
	"bpjs_ketenagakerjaan_number" text,
	"bpjs_kesehatan_number" text,
	"last_k3_audit_date" date,
	"labour_documents" jsonb DEFAULT '[]'::jsonb,
	"policy_adherence" boolean DEFAULT false,
	"grievance_records" boolean DEFAULT false,
	"grievance_description" text,
	"certification" text,
	"human_rights_violations" boolean DEFAULT false,
	"human_rights_documents" jsonb DEFAULT '[]'::jsonb,
	"npwp_number" text,
	"last_tax_return_year" integer,
	"pbb_payment_proof" boolean DEFAULT false,
	"anti_bribery_policy" boolean DEFAULT false,
	"code_of_ethics" boolean DEFAULT false,
	"whistleblower_mechanism" boolean DEFAULT false,
	"tax_anti_corruption_documents" jsonb DEFAULT '[]'::jsonb,
	"trade_licenses" jsonb DEFAULT '[]'::jsonb,
	"corporate_registration" text,
	"customs_registration" text,
	"dinas_agriculture_registry" text,
	"business_license" text,
	"other_laws_documents" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_inputs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" varchar NOT NULL,
	"lot_id" varchar NOT NULL,
	"quantity" numeric(12, 3) NOT NULL,
	"uom" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "event_outputs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" varchar NOT NULL,
	"new_lot_id" varchar NOT NULL,
	"quantity" numeric(12, 3) NOT NULL,
	"uom" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" text NOT NULL,
	"type" "event_type" NOT NULL,
	"occurred_at" timestamp NOT NULL,
	"business_step" "business_step" NOT NULL,
	"disposition" "disposition" NOT NULL,
	"read_point_facility_id" varchar NOT NULL,
	"biz_location_facility_id" varchar,
	"ilmd" jsonb,
	"event_metadata" jsonb,
	"recorded_by" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "events_event_id_unique" UNIQUE("event_id")
);
--> statement-breakpoint
CREATE TABLE "external_layers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" text NOT NULL,
	"layer_type" text NOT NULL,
	"geometry" text,
	"attributes" jsonb,
	"valid_from" timestamp,
	"valid_to" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "facilities" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"party_id" varchar NOT NULL,
	"name" text NOT NULL,
	"type" "facility_type" NOT NULL,
	"geometry" text,
	"address" text,
	"country" text,
	"province" text,
	"district" text,
	"village" text,
	"certifications" jsonb DEFAULT '[]'::jsonb,
	"risk_flags" jsonb DEFAULT '[]'::jsonb,
	"capacity" numeric(12, 3),
	"capacity_uom" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "kcp_data_collection" (
	"id" serial PRIMARY KEY NOT NULL,
	"ubl_facility_id" text,
	"nama_kcp" text NOT NULL,
	"nama_group" text,
	"izin_berusaha" text,
	"tipe_sertifikat" text,
	"nomor_sertifikat" text,
	"lembaga_sertifikasi" text,
	"ruang_lingkup_sertifikasi" text,
	"masa_berlaku_sertifikat" text,
	"alamat_kantor" text,
	"alamat_kcp" text,
	"koordinat_kantor" text,
	"koordinat_kcp" text,
	"model_chain_of_custody" text,
	"kapasitas_olah_mt_hari" numeric(10, 2),
	"sistem_pencatatan" text,
	"tanggal_pengisian_kuisioner" date,
	"nama_penanggung_jawab" text,
	"jabatan_penanggung_jawab" text,
	"email_penanggung_jawab" text,
	"nomor_telepon_penanggung_jawab" text,
	"nama_tim_internal" text,
	"jabatan_tim_internal" text,
	"email_tim_internal" text,
	"nomor_telepon_tim_internal" text,
	"daftar_tangki_silo" jsonb DEFAULT '[]'::jsonb,
	"sumber_produk" jsonb DEFAULT '[]'::jsonb,
	"status" text DEFAULT 'draft',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "legacy_estate_data_collection" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supplier_name" text NOT NULL,
	"group_parent_company_name" text,
	"establishment_act" text,
	"amendment_act" text,
	"business_license" text,
	"certification_type" text,
	"certificate_number" text,
	"certification_body" text,
	"certification_scope" text,
	"certificate_validity" date,
	"document_link" text,
	"office_address" text,
	"estate_address" text,
	"estate_coordinates" text,
	"office_coordinates" text,
	"supplier_type" text,
	"total_annual_production" numeric(12, 3),
	"form_filling_date" date,
	"responsible_person_name" text,
	"responsible_person_position" text,
	"responsible_person_email" text,
	"responsible_person_phone" text,
	"internal_team_name" text,
	"internal_team_position" text,
	"internal_team_email" text,
	"internal_team_phone" text,
	"ffb_sources" jsonb DEFAULT '[]'::jsonb,
	"has_forest_peat_policy" boolean,
	"forest_peat_policy_notes" text,
	"forest_peat_document_link" text,
	"attended_ndpe_workshop" boolean,
	"ndpe_workshop_notes" text,
	"has_forest_protection_procedure" boolean,
	"has_conservation_area_sop" boolean,
	"has_land_opening_sop" boolean,
	"forest_protection_notes" text,
	"conducted_hcv_assessment" boolean,
	"submitted_hcv_report" boolean,
	"conducted_hcs_assessment" boolean,
	"hcs_assessment_notes" text,
	"planting_on_peatland" boolean,
	"peatland_area" numeric(8, 2),
	"peatland_opening_year" integer,
	"peatland_notes" text,
	"has_hydrological_restoration_permit" boolean,
	"hydrological_permit_notes" text,
	"hydrological_document_link" text,
	"status" text DEFAULT 'draft',
	"completion_percentage" integer DEFAULT 0,
	"review_comments" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lots" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lot_id" text NOT NULL,
	"commodity_id" varchar NOT NULL,
	"quantity" numeric(12, 3) NOT NULL,
	"uom" text NOT NULL,
	"grade" text,
	"owner_facility_id" varchar NOT NULL,
	"produced_at" timestamp NOT NULL,
	"expiry_at" timestamp,
	"ilmd" jsonb,
	"attributes" jsonb,
	"parent_lot_ids" jsonb DEFAULT '[]'::jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "lots_lot_id_unique" UNIQUE("lot_id")
);
--> statement-breakpoint
CREATE TABLE "mass_balance_records" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" varchar NOT NULL,
	"facility_id" varchar NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"total_input" numeric(12, 3),
	"total_output" numeric(12, 3),
	"total_waste" numeric(12, 3),
	"efficiency" numeric(5, 2),
	"is_valid" boolean DEFAULT true,
	"discrepancies" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "mill_data_collection" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"uml_id" text,
	"nama_pabrik" text NOT NULL,
	"nama_group_parent_company" text,
	"akta_pendirian_perusahaan" text,
	"akta_pendirian_dokumen" text,
	"akta_perubahan" text,
	"akta_perubahan_dokumen" text,
	"izin_berusaha" text,
	"tipe_sertifikat" text,
	"nomor_sertifikat" text,
	"lembaga_sertifikasi" text,
	"ruang_lingkup_sertifikasi" text,
	"masa_berlaku_sertifikat" text,
	"alamat_kantor" text,
	"alamat_pabrik" text,
	"koordinat_pabrik" text,
	"koordinat_kantor" text,
	"jenis_supplier" text,
	"kuantitas_cpo_pk" text,
	"tanggal_pengisian_kuisioner" text,
	"nama_penanggung_jawab" text,
	"jabatan_penanggung_jawab" text,
	"email_penanggung_jawab" text,
	"nomor_telepon_penanggung_jawab" text,
	"nama_tim_internal" text,
	"jabatan_tim_internal" text,
	"email_tim_internal" text,
	"nomor_telepon_tim_internal" text,
	"kebun_inti" jsonb DEFAULT '[]'::jsonb,
	"kebun_sepupu" jsonb DEFAULT '[]'::jsonb,
	"third_partied" jsonb DEFAULT '[]'::jsonb,
	"small_holder" jsonb DEFAULT '[]'::jsonb,
	"memiliki_kebijakan_perlindungan_hutan" boolean,
	"memiliki_kebijakan_perlindungan_gambut" boolean,
	"keterangan_kebijakan_hutan" text,
	"dokumen_kebijakan_hutan" text,
	"mengikuti_workshop_ndpe" boolean,
	"keterangan_workshop_ndpe" text,
	"memiliki_sop_konservasi" boolean,
	"memiliki_sop_pembukaan_lahan" boolean,
	"keterangan_sop" text,
	"melakukan_penilaian_nkt" boolean,
	"menyampaikan_laporan_nkt" boolean,
	"melakukan_penilaian_skt" boolean,
	"keterangan_penilaian" text,
	"penanaman_di_area_gambut" boolean,
	"keterangan_area_gambut" text,
	"luas_area_gambut" numeric(10, 2),
	"tahun_pembukaan_gambut" integer,
	"memiliki_sk_titik_penaatan" boolean,
	"keterangan_sk_titik_penaatan" text,
	"dokumen_sk_titik_penaatan" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mills" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"location" text NOT NULL,
	"capacity" numeric(10, 2),
	"manager_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parties" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" "party_type" NOT NULL,
	"parent_id" varchar,
	"gln" text,
	"address" text,
	"country" text,
	"certifications" jsonb DEFAULT '[]'::jsonb,
	"risk_flags" jsonb DEFAULT '[]'::jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "plots" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plot_id" text NOT NULL,
	"facility_id" varchar,
	"polygon" text,
	"area_ha" numeric(10, 4),
	"crop" text,
	"planting_year" integer,
	"certifications" jsonb DEFAULT '[]'::jsonb,
	"risk_flags" jsonb DEFAULT '[]'::jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "plots_plot_id_unique" UNIQUE("plot_id")
);
--> statement-breakpoint
CREATE TABLE "risk_assessment_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"risk_assessment_id" varchar NOT NULL,
	"category" "risk_category" NOT NULL,
	"item_type" "risk_item_type" NOT NULL,
	"item_name" text NOT NULL,
	"risk_level" "risk_parameter_level" NOT NULL,
	"parameter" text NOT NULL,
	"risk_value" integer NOT NULL,
	"weight" numeric(5, 2) NOT NULL,
	"calculated_risk" numeric(5, 2) NOT NULL,
	"normalized_score" numeric(5, 4) NOT NULL,
	"final_score" numeric(5, 4) NOT NULL,
	"mitigation_required" boolean DEFAULT false,
	"mitigation_description" text,
	"mitigation_status" "mitigation_status" DEFAULT 'pending',
	"data_sources" jsonb DEFAULT '[]'::jsonb,
	"source_links" jsonb DEFAULT '[]'::jsonb,
	"evidence_files" jsonb DEFAULT '[]'::jsonb,
	"assessed_by" varchar,
	"assessed_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "risk_assessments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supplier_id" varchar,
	"supplier_name" text NOT NULL,
	"assessor_id" varchar,
	"assessor_name" text,
	"assessment_date" timestamp DEFAULT now() NOT NULL,
	"assessment_period" text,
	"status" "assessment_status" DEFAULT 'Draft' NOT NULL,
	"overall_score" numeric(5, 2),
	"risk_classification" "risk_level",
	"spatial_risk_score" numeric(5, 2),
	"spatial_risk_level" "risk_level",
	"non_spatial_risk_score" numeric(5, 2),
	"non_spatial_risk_level" "risk_level",
	"risk_item_scores" jsonb,
	"mitigation_actions" jsonb DEFAULT '[]'::jsonb,
	"evidence_documents" jsonb DEFAULT '[]'::jsonb,
	"supporting_data" jsonb,
	"reviewed_by" varchar,
	"reviewed_at" timestamp,
	"approved_by" varchar,
	"approved_at" timestamp,
	"recommendations" text,
	"next_review_date" timestamp,
	"notes" text,
	"version" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shipment_id" text NOT NULL,
	"from_facility_id" varchar NOT NULL,
	"to_facility_id" varchar NOT NULL,
	"depart_at" timestamp,
	"arrive_at" timestamp,
	"estimated_arrive_at" timestamp,
	"mode" text,
	"carrier" text,
	"vessel_name" text,
	"docs" jsonb DEFAULT '[]'::jsonb,
	"status" text DEFAULT 'pending',
	"total_weight" numeric(12, 3),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "shipments_shipment_id_unique" UNIQUE("shipment_id")
);
--> statement-breakpoint
CREATE TABLE "supplier_assessment_progress" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supplier_name" text NOT NULL,
	"supplier_type" text NOT NULL,
	"data_collection_completed" boolean DEFAULT false,
	"data_collection_completed_at" timestamp,
	"data_collection_id" varchar,
	"legality_compliance_completed" boolean DEFAULT false,
	"legality_compliance_completed_at" timestamp,
	"legality_compliance_id" varchar,
	"risk_assessment_completed" boolean DEFAULT false,
	"risk_assessment_completed_at" timestamp,
	"risk_assessment_id" varchar,
	"current_step" integer DEFAULT 1,
	"workflow_completed" boolean DEFAULT false,
	"workflow_completed_at" timestamp,
	"last_updated_by" varchar,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "supplier_links" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_party_id" varchar NOT NULL,
	"to_party_id" varchar NOT NULL,
	"tier" integer NOT NULL,
	"relationship_type" "relationship_type" NOT NULL,
	"start_date" date,
	"end_date" date,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "supplier_workflow_links" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_supplier_id" varchar NOT NULL,
	"child_supplier_id" varchar NOT NULL,
	"parent_tier" integer NOT NULL,
	"child_tier" integer NOT NULL,
	"link_type" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_name" text NOT NULL,
	"registration_number" text,
	"name" text NOT NULL,
	"contact_person" text,
	"email" text,
	"phone" text,
	"address" text,
	"business_type" text NOT NULL,
	"supplier_type" text NOT NULL,
	"tier" integer DEFAULT 1,
	"legality_status" text DEFAULT 'pending',
	"legality_score" integer,
	"certifications" jsonb DEFAULT '[]'::jsonb,
	"linked_suppliers" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "traceability_data_collection" (
	"id" serial PRIMARY KEY NOT NULL,
	"nomor_do" text NOT NULL,
	"pemegang_do" text NOT NULL,
	"alamat_pemegang_do" text,
	"lokasi_usaha" text,
	"akta_pendirian_usaha" text,
	"nib" text,
	"npwp" text,
	"ktp" text,
	"pemasok_tbs" jsonb DEFAULT '[]'::jsonb,
	"status" text DEFAULT 'draft',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"role" text DEFAULT 'compliance_officer' NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "workflow_shipments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supplier_id" varchar NOT NULL,
	"product_type" text NOT NULL,
	"quantity" numeric(12, 3) NOT NULL,
	"unit" text NOT NULL,
	"shipment_date" timestamp NOT NULL,
	"destination" text NOT NULL,
	"batch_number" text NOT NULL,
	"quality_grade" text NOT NULL,
	"status" text DEFAULT 'pending',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "custody_chains" ADD CONSTRAINT "custody_chains_root_lot_id_lots_id_fk" FOREIGN KEY ("root_lot_id") REFERENCES "public"."lots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custody_chains" ADD CONSTRAINT "custody_chains_current_facility_id_facilities_id_fk" FOREIGN KEY ("current_facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dds_reports" ADD CONSTRAINT "dds_reports_shipment_id_shipments_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_inputs" ADD CONSTRAINT "event_inputs_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_inputs" ADD CONSTRAINT "event_inputs_lot_id_lots_id_fk" FOREIGN KEY ("lot_id") REFERENCES "public"."lots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_outputs" ADD CONSTRAINT "event_outputs_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_outputs" ADD CONSTRAINT "event_outputs_new_lot_id_lots_id_fk" FOREIGN KEY ("new_lot_id") REFERENCES "public"."lots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_read_point_facility_id_facilities_id_fk" FOREIGN KEY ("read_point_facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_biz_location_facility_id_facilities_id_fk" FOREIGN KEY ("biz_location_facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facilities" ADD CONSTRAINT "facilities_party_id_parties_id_fk" FOREIGN KEY ("party_id") REFERENCES "public"."parties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lots" ADD CONSTRAINT "lots_commodity_id_commodities_id_fk" FOREIGN KEY ("commodity_id") REFERENCES "public"."commodities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lots" ADD CONSTRAINT "lots_owner_facility_id_facilities_id_fk" FOREIGN KEY ("owner_facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mass_balance_records" ADD CONSTRAINT "mass_balance_records_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mass_balance_records" ADD CONSTRAINT "mass_balance_records_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mills" ADD CONSTRAINT "mills_manager_id_users_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parties" ADD CONSTRAINT "parties_parent_id_parties_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."parties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plots" ADD CONSTRAINT "plots_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_assessment_items" ADD CONSTRAINT "risk_assessment_items_risk_assessment_id_risk_assessments_id_fk" FOREIGN KEY ("risk_assessment_id") REFERENCES "public"."risk_assessments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_assessment_items" ADD CONSTRAINT "risk_assessment_items_assessed_by_users_id_fk" FOREIGN KEY ("assessed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_assessments" ADD CONSTRAINT "risk_assessments_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_assessments" ADD CONSTRAINT "risk_assessments_assessor_id_users_id_fk" FOREIGN KEY ("assessor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_assessments" ADD CONSTRAINT "risk_assessments_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_assessments" ADD CONSTRAINT "risk_assessments_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_from_facility_id_facilities_id_fk" FOREIGN KEY ("from_facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_to_facility_id_facilities_id_fk" FOREIGN KEY ("to_facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_links" ADD CONSTRAINT "supplier_links_from_party_id_parties_id_fk" FOREIGN KEY ("from_party_id") REFERENCES "public"."parties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_links" ADD CONSTRAINT "supplier_links_to_party_id_parties_id_fk" FOREIGN KEY ("to_party_id") REFERENCES "public"."parties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_workflow_links" ADD CONSTRAINT "supplier_workflow_links_parent_supplier_id_suppliers_id_fk" FOREIGN KEY ("parent_supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_workflow_links" ADD CONSTRAINT "supplier_workflow_links_child_supplier_id_suppliers_id_fk" FOREIGN KEY ("child_supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_shipments" ADD CONSTRAINT "workflow_shipments_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;