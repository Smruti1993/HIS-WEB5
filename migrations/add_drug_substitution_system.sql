-- 1. Add strength_unit to Drug Generic Master
ALTER TABLE pharmacy_drug_generics
  ADD COLUMN IF NOT EXISTS strength_unit text CHECK (strength_unit IN ('mg', 'mcg', 'ml', '%', 'IU', 'g', 'mcg/ml', 'mg/ml'));

-- 1a. Backfill strength_unit by extracting unit suffix from existing free-text strength values
UPDATE pharmacy_drug_generics
SET strength_unit = CASE
  WHEN strength ~* 'mg/ml' THEN 'mg/ml'
  WHEN strength ~* 'mcg/ml' THEN 'mcg/ml'
  WHEN strength ~* 'mcg' THEN 'mcg'
  WHEN strength ~* 'mg' THEN 'mg'
  WHEN strength ~* 'ml' THEN 'ml'
  WHEN strength ~* '%' THEN '%'
  WHEN strength ~* 'iu' THEN 'IU'
  WHEN strength ~* 'g' THEN 'g'
  ELSE NULL
END
WHERE strength_unit IS NULL AND strength IS NOT NULL;

-- 2. Add dosage_form, pack details, and substitutable flags to Drug Master
ALTER TABLE pharmacy_drug_master
  ADD COLUMN IF NOT EXISTS dosage_form text CHECK (dosage_form IN ('tablet', 'capsule', 'syrup', 'cream', 'injection', 'drops', 'inhaler', 'gel'));

ALTER TABLE pharmacy_drug_master
  ADD COLUMN IF NOT EXISTS pack_size numeric(10,2) DEFAULT 1.0;

ALTER TABLE pharmacy_drug_master
  ADD COLUMN IF NOT EXISTS pack_unit text DEFAULT 'tablets';

ALTER TABLE pharmacy_drug_master
  ADD COLUMN IF NOT EXISTS substitutable boolean DEFAULT true;

ALTER TABLE pharmacy_drug_master
  ADD COLUMN IF NOT EXISTS margin_percent numeric(5,2) DEFAULT 0.00;

ALTER TABLE pharmacy_drug_master
  ADD COLUMN IF NOT EXISTS cost_price numeric(15,2) DEFAULT 0.00;

-- Backfill dosage_form on Drug Master from Generic Master available_forms/form_of_administration where possible (validating against enum)
UPDATE pharmacy_drug_master m
SET dosage_form = CASE 
  WHEN LOWER(SPLIT_PART(g.available_forms, ',', 1)) IN ('tablet', 'capsule', 'syrup', 'cream', 'injection', 'drops', 'inhaler', 'gel') THEN LOWER(SPLIT_PART(g.available_forms, ',', 1))
  ELSE 'tablet'
END
FROM pharmacy_drug_generics g
WHERE m.generic_id = g.id AND m.dosage_form IS NULL AND g.available_forms IS NOT NULL;

-- 3. Create Substitution Audit Log table
CREATE TABLE IF NOT EXISTS pharmacy_substitution_audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id uuid REFERENCES pharmacy_direct_sales(id) ON DELETE CASCADE,
  line_no integer NOT NULL,
  original_drug_id uuid REFERENCES inventory_items(id) ON DELETE RESTRICT,
  suggested_drug_ids uuid[] DEFAULT '{}'::uuid[],
  switched_to_drug_id uuid REFERENCES inventory_items(id) ON DELETE RESTRICT,
  action text CHECK (action IN ('kept', 'switched', 'dismissed')),
  user_id text,
  created_at timestamp with time zone DEFAULT now()
);

-- 4. Add Rx Linkage substitution columns
ALTER TABLE prescriptions
  ADD COLUMN IF NOT EXISTS substitution_allowed boolean DEFAULT true;

ALTER TABLE pharmacy_direct_sales
  ADD COLUMN IF NOT EXISTS substitution_allowed boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS prescription_id text REFERENCES prescriptions(id) ON DELETE SET NULL;
