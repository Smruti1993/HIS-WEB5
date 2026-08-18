-- ==========================================================================
-- DB BACKUP V2 - GENERATED DYNAMICALLY FROM LIVE DATABASE
-- Generated At: 2026-08-11T17:11:32.484Z
-- ==========================================================================

-- 1. Drop existing objects
DROP VIEW IF EXISTS public.vw_batch_locations CASCADE;
DROP TABLE IF EXISTS public.app_users CASCADE;
DROP TABLE IF EXISTS public.appointments CASCADE;
DROP TABLE IF EXISTS public.bill_items CASCADE;
DROP TABLE IF EXISTS public.bill_status_history CASCADE;
DROP TABLE IF EXISTS public.bills CASCADE;
DROP TABLE IF EXISTS public.branches CASCADE;
DROP TABLE IF EXISTS public.clinical_allergies CASCADE;
DROP TABLE IF EXISTS public.clinical_diagnoses CASCADE;
DROP TABLE IF EXISTS public.clinical_narrative_diagnoses CASCADE;
DROP TABLE IF EXISTS public.clinical_notes CASCADE;
DROP TABLE IF EXISTS public.clinical_vitals CASCADE;
DROP TABLE IF EXISTS public.credit_memos CASCADE;
DROP TABLE IF EXISTS public.currency_master CASCADE;
DROP TABLE IF EXISTS public.dental_icd_master CASCADE;
DROP TABLE IF EXISTS public.departments CASCADE;
DROP TABLE IF EXISTS public.doctor_availability CASCADE;
DROP TABLE IF EXISTS public.doctor_schedules CASCADE;
DROP TABLE IF EXISTS public.employees CASCADE;
DROP TABLE IF EXISTS public.finance_chart_of_accounts CASCADE;
DROP TABLE IF EXISTS public.finance_journal_voucher_items CASCADE;
DROP TABLE IF EXISTS public.finance_journal_vouchers CASCADE;
DROP TABLE IF EXISTS public.finance_organizations CASCADE;
DROP TABLE IF EXISTS public.insurance_policies CASCADE;
DROP TABLE IF EXISTS public.inventory_batch_locations CASCADE;
DROP TABLE IF EXISTS public.inventory_item_pricing CASCADE;
DROP TABLE IF EXISTS public.inventory_item_stocks CASCADE;
DROP TABLE IF EXISTS public.inventory_items CASCADE;
DROP TABLE IF EXISTS public.inventory_opening_stock_items CASCADE;
DROP TABLE IF EXISTS public.inventory_opening_stocks CASCADE;
DROP TABLE IF EXISTS public.inventory_stock_ledger CASCADE;
DROP TABLE IF EXISTS public.item_tax_mappings CASCADE;
DROP TABLE IF EXISTS public.lab_reagent_consumption_log CASCADE;
DROP TABLE IF EXISTS public.lab_service_import_log CASCADE;
DROP TABLE IF EXISTS public.lab_service_profile_components CASCADE;
DROP TABLE IF EXISTS public.lab_service_reagents CASCADE;
DROP TABLE IF EXISTS public.lims_antibiotics CASCADE;
DROP TABLE IF EXISTS public.lims_containers CASCADE;
DROP TABLE IF EXISTS public.lims_equipment CASCADE;
DROP TABLE IF EXISTS public.lims_lab_orders CASCADE;
DROP TABLE IF EXISTS public.lims_organisms CASCADE;
DROP TABLE IF EXISTS public.lims_outsource_labs CASCADE;
DROP TABLE IF EXISTS public.lims_parameter_options CASCADE;
DROP TABLE IF EXISTS public.lims_reference_ranges CASCADE;
DROP TABLE IF EXISTS public.lims_reference_remarks CASCADE;
DROP TABLE IF EXISTS public.lims_results CASCADE;
DROP TABLE IF EXISTS public.lims_samples CASCADE;
DROP TABLE IF EXISTS public.lims_service_configs CASCADE;
DROP TABLE IF EXISTS public.lims_service_parameters CASCADE;
DROP TABLE IF EXISTS public.lims_specimens CASCADE;
DROP TABLE IF EXISTS public.lims_stains CASCADE;
DROP TABLE IF EXISTS public.lims_test_results CASCADE;
DROP TABLE IF EXISTS public.loyalty_accounts CASCADE;
DROP TABLE IF EXISTS public.loyalty_bonus_rules CASCADE;
DROP TABLE IF EXISTS public.loyalty_program_config CASCADE;
DROP TABLE IF EXISTS public.loyalty_redemption_rules CASCADE;
DROP TABLE IF EXISTS public.loyalty_sms_log CASCADE;
DROP TABLE IF EXISTS public.loyalty_tier_history CASCADE;
DROP TABLE IF EXISTS public.loyalty_tiers CASCADE;
DROP TABLE IF EXISTS public.loyalty_transactions CASCADE;
DROP TABLE IF EXISTS public.master_diagnoses CASCADE;
DROP TABLE IF EXISTS public.patient_demographics CASCADE;
DROP TABLE IF EXISTS public.patient_documents CASCADE;
DROP TABLE IF EXISTS public.patient_refunds CASCADE;
DROP TABLE IF EXISTS public.patients CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.pharmacy_direct_sale_items CASCADE;
DROP TABLE IF EXISTS public.pharmacy_direct_sales CASCADE;
DROP TABLE IF EXISTS public.pharmacy_drug_generics CASCADE;
DROP TABLE IF EXISTS public.pharmacy_drug_master CASCADE;
DROP TABLE IF EXISTS public.pharmacy_racks CASCADE;
DROP TABLE IF EXISTS public.pharmacy_return_items CASCADE;
DROP TABLE IF EXISTS public.pharmacy_returns CASCADE;
DROP TABLE IF EXISTS public.pharmacy_zones CASCADE;
DROP TABLE IF EXISTS public.policy_mapped_branches CASCADE;
DROP TABLE IF EXISTS public.policy_patient_max_amounts CASCADE;
DROP TABLE IF EXISTS public.policy_rules CASCADE;
DROP TABLE IF EXISTS public.prescription_items CASCADE;
DROP TABLE IF EXISTS public.prescriptions CASCADE;
DROP TABLE IF EXISTS public.procurement_expiry_return_items CASCADE;
DROP TABLE IF EXISTS public.procurement_expiry_returns CASCADE;
DROP TABLE IF EXISTS public.procurement_grn_items CASCADE;
DROP TABLE IF EXISTS public.procurement_grns CASCADE;
DROP TABLE IF EXISTS public.procurement_gstr2b_invoices CASCADE;
DROP TABLE IF EXISTS public.procurement_gstr2b_uploads CASCADE;
DROP TABLE IF EXISTS public.procurement_purchase_order_items CASCADE;
DROP TABLE IF EXISTS public.procurement_purchase_orders CASCADE;
DROP TABLE IF EXISTS public.procurement_purchase_receipt_items CASCADE;
DROP TABLE IF EXISTS public.procurement_purchase_receipts CASCADE;
DROP TABLE IF EXISTS public.procurement_purchase_return_items CASCADE;
DROP TABLE IF EXISTS public.procurement_purchase_returns CASCADE;
DROP TABLE IF EXISTS public.procurement_vendor_terms CASCADE;
DROP TABLE IF EXISTS public.procurement_vendors CASCADE;
DROP TABLE IF EXISTS public.role_privileges CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;
DROP TABLE IF EXISTS public.schedule_templates CASCADE;
DROP TABLE IF EXISTS public.screens CASCADE;
DROP TABLE IF EXISTS public.service_approvals CASCADE;
DROP TABLE IF EXISTS public.service_centres CASCADE;
DROP TABLE IF EXISTS public.service_definitions CASCADE;
DROP TABLE IF EXISTS public.service_location_mappings CASCADE;
DROP TABLE IF EXISTS public.service_orders CASCADE;
DROP TABLE IF EXISTS public.service_tariffs CASCADE;
DROP TABLE IF EXISTS public.sponsor_tariffs CASCADE;
DROP TABLE IF EXISTS public.stock_transfer_items CASCADE;
DROP TABLE IF EXISTS public.stock_transfers CASCADE;
DROP TABLE IF EXISTS public.store_item_mappings CASCADE;
DROP TABLE IF EXISTS public.stores CASCADE;
DROP TABLE IF EXISTS public.tax_masters CASCADE;
DROP TABLE IF EXISTS public.temp_unresolved_lab_orders CASCADE;
DROP TABLE IF EXISTS public.units CASCADE;
DROP TABLE IF EXISTS public.user_privilege_overrides CASCADE;
DROP TABLE IF EXISTS public.vital_sign_groups CASCADE;
DROP TABLE IF EXISTS public.vital_sign_parameters CASCADE;
DROP TABLE IF EXISTS public.vw_batch_locations CASCADE;

-- 2. Create Tables with exact columns, types, defaults
-- ─── app_users ──────────────────────────────────────────────────
CREATE TABLE public.app_users (
  id text DEFAULT gen_random_uuid() NOT NULL,
  username text NOT NULL,
  password text NOT NULL,
  role text NOT NULL,
  employee_id text,
  full_name text,
  created_at timestamp with time zone DEFAULT now(),
  user_code text,
  email text,
  mobile text,
  is_active boolean DEFAULT true,
  force_password_change boolean DEFAULT false,
  last_login timestamp with time zone,
  role_id uuid,
  updated_at timestamp with time zone DEFAULT now(),
  location_id text,
  department_id text
);

-- ─── appointments ──────────────────────────────────────────────────
CREATE TABLE public.appointments (
  id text NOT NULL,
  patient_id text,
  doctor_id text,
  department_id text,
  date text NOT NULL,
  time text NOT NULL,
  status text DEFAULT 'Scheduled'::text,
  symptoms text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  check_in_time timestamp with time zone,
  check_out_time timestamp with time zone,
  visit_type text DEFAULT 'New Visit'::text,
  payment_mode text DEFAULT 'CASH'::text
);

-- ─── bill_items ──────────────────────────────────────────────────
CREATE TABLE public.bill_items (
  id text NOT NULL,
  bill_id text,
  description text NOT NULL,
  quantity integer DEFAULT 1,
  unit_price numeric DEFAULT 0,
  total numeric DEFAULT 0,
  discount_amount numeric DEFAULT 0,
  tax_amount numeric DEFAULT 0,
  tax_percentage numeric DEFAULT 0,
  item_id text,
  batch_no text,
  item_type text,
  discount_percentage numeric DEFAULT 0
);

-- ─── bill_status_history ──────────────────────────────────────────────────
CREATE TABLE public.bill_status_history (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  bill_id text NOT NULL,
  old_status text,
  new_status text NOT NULL,
  changed_by text NOT NULL,
  reason text,
  changed_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ─── bills ──────────────────────────────────────────────────
CREATE TABLE public.bills (
  id text NOT NULL,
  patient_id text,
  appointment_id text,
  date timestamp with time zone DEFAULT now(),
  status text DEFAULT 'Unpaid'::text,
  total_amount numeric DEFAULT 0,
  paid_amount numeric DEFAULT 0,
  invoice_no text,
  is_pharmacy boolean DEFAULT false,
  discount_amount numeric DEFAULT 0,
  tax_amount numeric DEFAULT 0,
  prescription_id uuid,
  created_by text,
  round_off numeric DEFAULT 0,
  doctor_id text,
  department_id text,
  payment_mode text,
  amount_received numeric DEFAULT 0,
  reference_no text,
  notes text,
  refund_status text DEFAULT 'Pending'::text,
  refund_id uuid,
  cancelled_at timestamp with time zone,
  branch_id uuid,
  payer_type text DEFAULT 'Self'::text NOT NULL,
  sponsor_id uuid,
  patient_due_amount numeric DEFAULT 0.00 NOT NULL,
  sponsor_due_amount numeric DEFAULT 0.00 NOT NULL
);

-- ─── branches ──────────────────────────────────────────────────
CREATE TABLE public.branches (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  name text NOT NULL,
  code text,
  status text DEFAULT 'Active'::text,
  vat_reg_no text,
  logo_url text
);

-- ─── clinical_allergies ──────────────────────────────────────────────────
CREATE TABLE public.clinical_allergies (
  id text NOT NULL,
  patient_id text,
  allergen text NOT NULL,
  severity text,
  reaction text,
  status text DEFAULT 'Active'::text,
  recorded_at timestamp with time zone DEFAULT now(),
  allergy_type text,
  onset_date date,
  resolved_date date,
  remarks text
);

-- ─── clinical_diagnoses ──────────────────────────────────────────────────
CREATE TABLE public.clinical_diagnoses (
  id text NOT NULL,
  appointment_id text,
  code text,
  description text NOT NULL,
  type text DEFAULT 'Provisional'::text,
  added_at timestamp with time zone DEFAULT now(),
  is_poa boolean DEFAULT false,
  icd_code text
);

-- ─── clinical_narrative_diagnoses ──────────────────────────────────────────────────
CREATE TABLE public.clinical_narrative_diagnoses (
  id text NOT NULL,
  appointment_id text,
  illness text,
  illness_duration_value integer,
  illness_duration_unit text,
  behavioural_activity text,
  narrative text,
  recorded_at timestamp with time zone DEFAULT now()
);

-- ─── clinical_notes ──────────────────────────────────────────────────
CREATE TABLE public.clinical_notes (
  id text NOT NULL,
  appointment_id text,
  note_type text NOT NULL,
  description text,
  recorded_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone
);

-- ─── clinical_vitals ──────────────────────────────────────────────────
CREATE TABLE public.clinical_vitals (
  id text NOT NULL,
  appointment_id text,
  recorded_at timestamp with time zone DEFAULT now(),
  bp_systolic integer,
  bp_diastolic integer,
  temperature numeric,
  pulse integer,
  respiratory_rate integer,
  weight numeric,
  height numeric,
  bmi numeric,
  spo2 integer
);

-- ─── credit_memos ──────────────────────────────────────────────────
CREATE TABLE public.credit_memos (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  bill_id text NOT NULL,
  refund_id uuid,
  credit_memo_no text NOT NULL,
  amount numeric NOT NULL,
  reason text NOT NULL,
  created_by text NOT NULL,
  approved_by text,
  status text DEFAULT 'Approved'::text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ─── currency_master ──────────────────────────────────────────────────
CREATE TABLE public.currency_master (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  code text NOT NULL,
  name text NOT NULL,
  symbol text NOT NULL,
  is_active boolean DEFAULT true,
  is_default boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ─── dental_icd_master ──────────────────────────────────────────────────
CREATE TABLE public.dental_icd_master (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  code text NOT NULL,
  description text NOT NULL,
  status text DEFAULT 'Active'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ─── departments ──────────────────────────────────────────────────
CREATE TABLE public.departments (
  id text NOT NULL,
  name text NOT NULL,
  code text,
  status text DEFAULT 'Active'::text
);

-- ─── doctor_availability ──────────────────────────────────────────────────
CREATE TABLE public.doctor_availability (
  id text NOT NULL,
  doctor_id text,
  day_of_week integer NOT NULL,
  start_time text NOT NULL,
  end_time text NOT NULL,
  slot_duration_minutes integer DEFAULT 30
);

-- ─── doctor_schedules ──────────────────────────────────────────────────
CREATE TABLE public.doctor_schedules (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  doctor_id text NOT NULL,
  day_of_week integer NOT NULL,
  start_time time without time zone NOT NULL,
  end_time time without time zone NOT NULL,
  slot_type text DEFAULT 'available'::text NOT NULL,
  slot_duration integer DEFAULT 30 NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_by text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ─── employees ──────────────────────────────────────────────────
CREATE TABLE public.employees (
  id text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text,
  phone text,
  role text NOT NULL,
  department_id text,
  specialization text,
  status text DEFAULT 'Active'::text
);

-- ─── finance_chart_of_accounts ──────────────────────────────────────────────────
CREATE TABLE public.finance_chart_of_accounts (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  code character varying NOT NULL,
  name character varying NOT NULL,
  account_type character varying NOT NULL,
  account_group character varying,
  balance_nature character varying NOT NULL,
  system_purpose text,
  parent_id uuid,
  is_group boolean DEFAULT false,
  description text,
  status character varying DEFAULT 'Active'::character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ─── finance_journal_voucher_items ──────────────────────────────────────────────────
CREATE TABLE public.finance_journal_voucher_items (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  voucher_id uuid,
  account_id uuid,
  posting_nature character varying NOT NULL,
  amount numeric NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now()
);

-- ─── finance_journal_vouchers ──────────────────────────────────────────────────
CREATE TABLE public.finance_journal_vouchers (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  voucher_no character varying NOT NULL,
  voucher_date date NOT NULL,
  ref_type character varying NOT NULL,
  ref_doc_id uuid,
  ref_doc_no character varying,
  narration text,
  total_debit numeric DEFAULT 0.00,
  total_credit numeric DEFAULT 0.00,
  status character varying DEFAULT 'Draft'::character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ─── finance_organizations ──────────────────────────────────────────────────
CREATE TABLE public.finance_organizations (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  code character varying NOT NULL,
  name character varying NOT NULL,
  sponsor_type character varying NOT NULL,
  payer_id character varying,
  vat_not_required boolean DEFAULT false,
  contract_created_by character varying DEFAULT 'SMRUTI RANJAN MISHRA'::character varying,
  organization_type character varying DEFAULT 'With MOU'::character varying,
  account_no character varying,
  organization_group character varying,
  receiver_id character varying,
  gateway_configuration character varying DEFAULT '--Select--'::character varying,
  vat_no character varying,
  active boolean DEFAULT true,
  is_daman_or_thiqa boolean DEFAULT false,
  max_approval_time integer DEFAULT 0,
  address_details text,
  building_no character varying,
  city character varying DEFAULT 'RIYADH'::character varying,
  country character varying DEFAULT 'Saudi Arabia'::character varying,
  postal_code character varying,
  state character varying DEFAULT 'ar-Riyad'::character varying,
  dist character varying DEFAULT 'ar-Riyad'::character varying,
  contacts jsonb DEFAULT '[]'::jsonb,
  insurance_id text,
  branch_id character varying,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  approval_required boolean DEFAULT false NOT NULL
);

-- ─── insurance_policies ──────────────────────────────────────────────────
CREATE TABLE public.insurance_policies (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  policy_no text NOT NULL,
  policy_name text NOT NULL,
  sponsor_type text NOT NULL,
  sponsor_id uuid,
  insurance_id uuid,
  service_tax text DEFAULT 'VAT 15 PERCENT'::text,
  start_date timestamp with time zone NOT NULL,
  end_date timestamp with time zone NOT NULL,
  sponsor_pay_tax boolean DEFAULT true,
  is_sponsor_price boolean DEFAULT true,
  patient_amt numeric DEFAULT 0.00,
  active boolean DEFAULT true,
  restricted boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ─── inventory_batch_locations ──────────────────────────────────────────────────
CREATE TABLE public.inventory_batch_locations (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  store_id uuid NOT NULL,
  item_id uuid NOT NULL,
  batch_no character varying NOT NULL,
  zone_id uuid NOT NULL,
  rack_id uuid NOT NULL,
  shelf_no integer NOT NULL,
  bin_no character varying NOT NULL,
  is_primary boolean DEFAULT true NOT NULL,
  notes text,
  created_by text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ─── inventory_item_pricing ──────────────────────────────────────────────────
CREATE TABLE public.inventory_item_pricing (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  item_id uuid,
  branch_id uuid,
  branch_name text,
  pricing_method text DEFAULT 'MRP'::text,
  price numeric DEFAULT 0,
  markup_percentage numeric DEFAULT 0
);

-- ─── inventory_item_stocks ──────────────────────────────────────────────────
CREATE TABLE public.inventory_item_stocks (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  item_id uuid NOT NULL,
  ved_category text,
  is_reusable boolean DEFAULT false,
  item_rate numeric DEFAULT 1.0,
  fsn_type text,
  is_bulky boolean DEFAULT false,
  cycle_count_frequency text,
  reusable_count numeric DEFAULT 0,
  reserved_qty numeric DEFAULT 0.0,
  manufacturer_name text
);

-- ─── inventory_items ──────────────────────────────────────────────────
CREATE TABLE public.inventory_items (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  item_code text NOT NULL,
  item_name text NOT NULL,
  item_description text NOT NULL,
  arabic_name text NOT NULL,
  item_type text NOT NULL,
  item_category text NOT NULL,
  item_group text NOT NULL,
  item_class text,
  stock_type text DEFAULT 'Stock'::text,
  procurement_type text DEFAULT 'Local'::text,
  base_uom text DEFAULT 'EACH'::text,
  track_uom text DEFAULT 'EACH'::text,
  distribution_category text NOT NULL,
  purchase_organisation text NOT NULL,
  shelf_life_limit numeric DEFAULT 0.0,
  item_specification text,
  sfda text,
  gtin text,
  nphies_drug_type text,
  is_inventorised boolean DEFAULT true,
  is_batch_tracked boolean DEFAULT true,
  is_expiry_date_required boolean DEFAULT true,
  is_serialized boolean DEFAULT false,
  is_active boolean DEFAULT true,
  is_approval_required boolean DEFAULT true,
  is_insurance_cover boolean DEFAULT true,
  drug_sub_groups text,
  purchase_uom text DEFAULT 'EACH'::text NOT NULL,
  sales_uom text DEFAULT 'EACH'::text NOT NULL,
  default_pricing_method text DEFAULT 'MRP'::text,
  default_markup_percentage numeric DEFAULT 0.0,
  branch text,
  purchase_inventory_acc text NOT NULL,
  cost_of_sales_acc text NOT NULL,
  sale_account text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  reorder_level numeric DEFAULT 50,
  min_stock_level numeric DEFAULT 10,
  purchase_conversion_factor numeric DEFAULT 1.0,
  sales_conversion_factor numeric DEFAULT 1.0,
  storage_condition text
);

-- ─── inventory_opening_stock_items ──────────────────────────────────────────────────
CREATE TABLE public.inventory_opening_stock_items (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  opening_stock_id uuid,
  item_id uuid,
  item_code text,
  item_name text,
  item_category text,
  batch_no text,
  batch_start_date date,
  batch_end_date date,
  quantity numeric DEFAULT 0,
  rate numeric DEFAULT 0,
  amount numeric DEFAULT 0,
  mrp numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- ─── inventory_opening_stocks ──────────────────────────────────────────────────
CREATE TABLE public.inventory_opening_stocks (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  store_id uuid,
  entry_date date DEFAULT CURRENT_DATE,
  status text DEFAULT 'Draft'::text,
  created_at timestamp with time zone DEFAULT now()
);

-- ─── inventory_stock_ledger ──────────────────────────────────────────────────
CREATE TABLE public.inventory_stock_ledger (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  store_id uuid,
  item_id uuid,
  transaction_type text NOT NULL,
  ref_type text,
  ref_doc_no text,
  ref_doc_date timestamp with time zone DEFAULT now(),
  stock_in_quantity numeric DEFAULT 0,
  stock_out_quantity numeric DEFAULT 0,
  closing_stock numeric DEFAULT 0,
  closing_stock_rate numeric DEFAULT 0,
  closing_stock_value numeric DEFAULT 0,
  currency text DEFAULT 'SAR'::text,
  batch_no text,
  batch_date date,
  expiry_date date,
  created_at timestamp with time zone DEFAULT now()
);

-- ─── item_tax_mappings ──────────────────────────────────────────────────
CREATE TABLE public.item_tax_mappings (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  item_id uuid,
  tax_id uuid,
  created_at timestamp with time zone DEFAULT now()
);

-- ─── lab_reagent_consumption_log ──────────────────────────────────────────────────
CREATE TABLE public.lab_reagent_consumption_log (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  lab_order_id uuid,
  service_id text,
  item_id uuid,
  store_id uuid,
  quantity_deducted numeric NOT NULL,
  ledger_ref_id uuid,
  action text NOT NULL,
  reversed_by_log_id uuid,
  override_reason text,
  performed_by text,
  created_at timestamp with time zone DEFAULT now()
);

-- ─── lab_service_import_log ──────────────────────────────────────────────────
CREATE TABLE public.lab_service_import_log (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  performed_by text,
  file_name text,
  total_rows integer NOT NULL,
  created_count integer DEFAULT 0 NOT NULL,
  updated_count integer DEFAULT 0 NOT NULL,
  skipped_count integer DEFAULT 0 NOT NULL,
  error_count integer DEFAULT 0 NOT NULL,
  row_results jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- ─── lab_service_profile_components ──────────────────────────────────────────────────
CREATE TABLE public.lab_service_profile_components (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  profile_service_id text NOT NULL,
  component_service_id text NOT NULL,
  display_order integer DEFAULT 0 NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ─── lab_service_reagents ──────────────────────────────────────────────────
CREATE TABLE public.lab_service_reagents (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  service_id text,
  item_id uuid,
  store_id uuid,
  quantity_per_test numeric NOT NULL,
  unit_id text,
  is_mandatory boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- ─── lims_antibiotics ──────────────────────────────────────────────────
CREATE TABLE public.lims_antibiotics (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  name text NOT NULL,
  code text NOT NULL,
  status text DEFAULT 'Active'::text
);

-- ─── lims_containers ──────────────────────────────────────────────────
CREATE TABLE public.lims_containers (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  name text NOT NULL,
  code text NOT NULL,
  cap_color text,
  status text DEFAULT 'Active'::text
);

-- ─── lims_equipment ──────────────────────────────────────────────────
CREATE TABLE public.lims_equipment (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  name text NOT NULL,
  code text NOT NULL,
  model text,
  manufacturer text,
  status text DEFAULT 'Active'::text
);

-- ─── lims_lab_orders ──────────────────────────────────────────────────
CREATE TABLE public.lims_lab_orders (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  service_order_id text,
  barcode_no text NOT NULL,
  priority text DEFAULT 'Routine'::text,
  status text DEFAULT 'Ordered'::text,
  ordered_at timestamp with time zone DEFAULT now(),
  collected_at timestamp with time zone,
  collected_by text,
  accepted_at timestamp with time zone,
  accepted_by text,
  result_captured_at timestamp with time zone,
  result_captured_by text,
  certified_at timestamp with time zone,
  certified_by text,
  collector_badge text,
  collection_remarks text,
  identity_verified boolean DEFAULT false,
  consent_obtained boolean DEFAULT false,
  instrument_run_id text,
  rack_position text,
  test_start_at timestamp with time zone,
  test_end_at timestamp with time zone,
  test_notes text,
  clinical_comments text,
  result_status text DEFAULT 'Preliminary'::text,
  qc_passed boolean DEFAULT false,
  reagent_in_date boolean DEFAULT false,
  calibration_verified boolean DEFAULT false,
  maintenance_ok boolean DEFAULT false,
  duplicate_run_required boolean DEFAULT false,
  control_lot_no text,
  reagent_lot_no text,
  calibration_date date,
  expiry_date date,
  test_method text,
  analyzer_channel text,
  received_at timestamp with time zone,
  received_by text,
  lab_section text,
  service_id text,
  source_profile_service_id text,
  profile_group_id uuid
);

-- ─── lims_organisms ──────────────────────────────────────────────────
CREATE TABLE public.lims_organisms (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  name text NOT NULL,
  code text NOT NULL,
  status text DEFAULT 'Active'::text
);

-- ─── lims_outsource_labs ──────────────────────────────────────────────────
CREATE TABLE public.lims_outsource_labs (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  name text NOT NULL,
  code text NOT NULL,
  contact_no text,
  email text,
  status text DEFAULT 'Active'::text
);

-- ─── lims_parameter_options ──────────────────────────────────────────────────
CREATE TABLE public.lims_parameter_options (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  parameter_id uuid,
  option_value text NOT NULL,
  sort_order integer DEFAULT 0,
  status text DEFAULT 'Active'::text
);

-- ─── lims_reference_ranges ──────────────────────────────────────────────────
CREATE TABLE public.lims_reference_ranges (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  parameter_id uuid,
  gender text DEFAULT 'All'::text,
  age_min numeric DEFAULT 0,
  age_max numeric DEFAULT 999,
  ref_min text,
  ref_max text,
  critical_min text,
  critical_max text,
  unit text,
  status text DEFAULT 'Active'::text,
  remarks text,
  borderline_low text,
  borderline_high text,
  equipment_id uuid,
  site text,
  is_derived boolean DEFAULT false
);

-- ─── lims_reference_remarks ──────────────────────────────────────────────────
CREATE TABLE public.lims_reference_remarks (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  service_id text,
  site text,
  equipment_id uuid,
  parameter_id uuid,
  remarks text,
  test_method text,
  footer text,
  is_active boolean DEFAULT true,
  status text DEFAULT 'Active'::text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- ─── lims_results ──────────────────────────────────────────────────
CREATE TABLE public.lims_results (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  lab_order_id uuid,
  parameter_id uuid,
  value text,
  flag text DEFAULT 'Normal'::text,
  is_amended boolean DEFAULT false,
  amended_reason text,
  captured_by text,
  captured_at timestamp with time zone DEFAULT now(),
  equipment_id uuid
);

-- ─── lims_samples ──────────────────────────────────────────────────
CREATE TABLE public.lims_samples (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  lab_order_id uuid,
  specimen_id uuid,
  container_id uuid,
  sample_no text NOT NULL,
  status text DEFAULT 'Pending'::text,
  rejection_reason text,
  rejected_by text,
  collection_site text,
  volume_ml numeric,
  temp_req text,
  sent_by text,
  sent_time timestamp with time zone,
  condition text DEFAULT 'Good'::text,
  section text,
  received_at timestamp with time zone,
  received_by text
);

-- ─── lims_service_configs ──────────────────────────────────────────────────
CREATE TABLE public.lims_service_configs (
  service_id text NOT NULL,
  result_type text DEFAULT 'Numeric'::text,
  clinical_significance text,
  patient_instruction text,
  phlebotomist_instruction text,
  technician_instruction text,
  gender_wise boolean DEFAULT false,
  age_range_wise boolean DEFAULT false,
  delta_check boolean DEFAULT false,
  is_result_mandatory boolean DEFAULT true,
  is_derived boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  specimen_id uuid,
  container_id uuid
);

-- ─── lims_service_parameters ──────────────────────────────────────────────────
CREATE TABLE public.lims_service_parameters (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  service_id text,
  name text NOT NULL,
  code text NOT NULL,
  result_type text DEFAULT 'Numeric'::text,
  sort_order integer DEFAULT 0,
  status text DEFAULT 'Active'::text,
  parent_id uuid,
  short_name text,
  is_mandatory boolean DEFAULT true,
  is_derived boolean DEFAULT false,
  is_parameter_sum boolean DEFAULT false,
  is_active boolean DEFAULT true
);

-- ─── lims_specimens ──────────────────────────────────────────────────
CREATE TABLE public.lims_specimens (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  name text NOT NULL,
  code text NOT NULL,
  status text DEFAULT 'Active'::text
);

-- ─── lims_stains ──────────────────────────────────────────────────
CREATE TABLE public.lims_stains (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  name text NOT NULL,
  code text NOT NULL,
  status text DEFAULT 'Active'::text
);

-- ─── lims_test_results ──────────────────────────────────────────────────
CREATE TABLE public.lims_test_results (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  lab_order_id uuid,
  parameter_id uuid,
  result_value text,
  result_flag text,
  equipment_id uuid,
  result_at timestamp with time zone DEFAULT now(),
  result_by text
);

-- ─── loyalty_accounts ──────────────────────────────────────────────────
CREATE TABLE public.loyalty_accounts (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  account_no character varying NOT NULL,
  mobile character varying NOT NULL,
  patient_name character varying NOT NULL,
  date_of_birth date,
  gender character varying,
  email character varying,
  patient_id character varying,
  enrolment_date date DEFAULT CURRENT_DATE NOT NULL,
  enrolment_source character varying DEFAULT 'Pharmacy'::character varying,
  current_tier character varying DEFAULT 'Silver'::character varying NOT NULL,
  account_status character varying DEFAULT 'Active'::character varying NOT NULL,
  suspension_reason text,
  current_points numeric DEFAULT 0 NOT NULL,
  lifetime_points numeric DEFAULT 0 NOT NULL,
  lifetime_spend numeric DEFAULT 0 NOT NULL,
  total_transactions integer DEFAULT 0 NOT NULL,
  last_transaction_date date,
  referred_by_mobile character varying,
  consent_given boolean DEFAULT false NOT NULL,
  consent_date timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ─── loyalty_bonus_rules ──────────────────────────────────────────────────
CREATE TABLE public.loyalty_bonus_rules (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  bonus_type character varying NOT NULL,
  points_awarded numeric,
  earn_multiplier numeric DEFAULT 1.00,
  trigger_condition text,
  valid_from date,
  valid_to date,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ─── loyalty_program_config ──────────────────────────────────────────────────
CREATE TABLE public.loyalty_program_config (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  program_name character varying DEFAULT 'MediPoints'::character varying NOT NULL,
  program_status character varying DEFAULT 'Active'::character varying NOT NULL,
  effective_from date DEFAULT CURRENT_DATE NOT NULL,
  point_value numeric DEFAULT 1.00 NOT NULL,
  earn_rate numeric DEFAULT 1.00 NOT NULL,
  min_bill_to_earn numeric DEFAULT 0.00 NOT NULL,
  points_rounding character varying DEFAULT 'FLOOR'::character varying NOT NULL,
  expiry_days integer DEFAULT 365 NOT NULL,
  expiry_type character varying DEFAULT 'ROLLING'::character varying NOT NULL,
  expiry_warning_days integer DEFAULT 30 NOT NULL,
  sms_enabled boolean DEFAULT true NOT NULL,
  sms_on_earn boolean DEFAULT true NOT NULL,
  sms_on_redeem boolean DEFAULT true NOT NULL,
  sms_on_expiry_warning boolean DEFAULT true NOT NULL,
  auto_enroll boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ─── loyalty_redemption_rules ──────────────────────────────────────────────────
CREATE TABLE public.loyalty_redemption_rules (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  min_points_to_redeem numeric DEFAULT 50 NOT NULL,
  max_redemption_pct numeric DEFAULT 10.00 NOT NULL,
  max_points_per_bill numeric DEFAULT 500 NOT NULL,
  partial_redemption boolean DEFAULT true NOT NULL,
  block_on_discounted_bill boolean DEFAULT true NOT NULL,
  exclude_gst_from_redeem boolean DEFAULT true NOT NULL,
  updated_at timestamp with time zone DEFAULT now()
);

-- ─── loyalty_sms_log ──────────────────────────────────────────────────
CREATE TABLE public.loyalty_sms_log (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  account_id uuid NOT NULL,
  mobile character varying NOT NULL,
  template_type character varying NOT NULL,
  message_text text NOT NULL,
  sent_on timestamp with time zone DEFAULT now(),
  status character varying DEFAULT 'Pending'::character varying,
  gateway_ref character varying
);

-- ─── loyalty_tier_history ──────────────────────────────────────────────────
CREATE TABLE public.loyalty_tier_history (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  account_id uuid NOT NULL,
  changed_from character varying NOT NULL,
  changed_to character varying NOT NULL,
  changed_on timestamp with time zone DEFAULT now() NOT NULL,
  reason character varying,
  lifetime_points_at_change numeric
);

-- ─── loyalty_tiers ──────────────────────────────────────────────────
CREATE TABLE public.loyalty_tiers (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  tier_name character varying NOT NULL,
  min_lifetime_points numeric DEFAULT 0 NOT NULL,
  earn_multiplier numeric DEFAULT 1.00 NOT NULL,
  downgrade_days integer,
  birthday_bonus_points numeric DEFAULT 0,
  welcome_bonus_points numeric DEFAULT 0,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- ─── loyalty_transactions ──────────────────────────────────────────────────
CREATE TABLE public.loyalty_transactions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  account_id uuid NOT NULL,
  transaction_date timestamp with time zone DEFAULT now() NOT NULL,
  transaction_type character varying NOT NULL,
  points numeric NOT NULL,
  balance_before numeric NOT NULL,
  balance_after numeric NOT NULL,
  monetary_value numeric DEFAULT 0,
  reference_bill_no character varying,
  reference_amount numeric,
  description text,
  is_reversed boolean DEFAULT false NOT NULL,
  reversed_by_txn uuid,
  created_by character varying NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- ─── master_diagnoses ──────────────────────────────────────────────────
CREATE TABLE public.master_diagnoses (
  id text NOT NULL,
  code text NOT NULL,
  description text NOT NULL,
  status text DEFAULT 'Active'::text
);

-- ─── patient_demographics ──────────────────────────────────────────────────
CREATE TABLE public.patient_demographics (
  id bigint DEFAULT nextval('patient_demographics_id_seq'::regclass) NOT NULL,
  abha_number character varying NOT NULL,
  abha_address character varying,
  eka_oid character varying,
  eka_uuid character varying,
  first_name character varying,
  middle_name character varying,
  last_name character varying,
  full_name character varying,
  gender character,
  year_of_birth integer,
  month_of_birth integer,
  day_of_birth integer,
  mobile character varying,
  address text,
  pincode character varying,
  state_name character varying,
  district_name character varying,
  kyc_verified boolean DEFAULT false,
  profile_photo_b64 text,
  source character varying DEFAULT 'abdm'::character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ─── patient_documents ──────────────────────────────────────────────────
CREATE TABLE public.patient_documents (
  id text NOT NULL,
  patient_id text NOT NULL,
  appointment_id text,
  name text NOT NULL,
  file_type text NOT NULL,
  file_data text NOT NULL,
  uploaded_at timestamp with time zone,
  uploaded_by text,
  size bigint
);

-- ─── patient_refunds ──────────────────────────────────────────────────
CREATE TABLE public.patient_refunds (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  refund_no text NOT NULL,
  patient_id text,
  refund_date timestamp with time zone DEFAULT now(),
  total_amount numeric DEFAULT 0,
  payment_method text DEFAULT 'Cash'::text,
  remarks text,
  created_by text,
  created_at timestamp with time zone DEFAULT now(),
  status text DEFAULT 'Pending'::text NOT NULL
);

-- ─── patients ──────────────────────────────────────────────────
CREATE TABLE public.patients (
  id text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  dob date,
  gender text,
  phone text,
  email text,
  address text,
  registration_date timestamp with time zone DEFAULT now()
);

-- ─── payments ──────────────────────────────────────────────────
CREATE TABLE public.payments (
  id text NOT NULL,
  bill_id text,
  date timestamp with time zone DEFAULT now(),
  amount numeric DEFAULT 0,
  method text,
  reference text
);

-- ─── pharmacy_direct_sale_items ──────────────────────────────────────────────────
CREATE TABLE public.pharmacy_direct_sale_items (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  sale_id uuid,
  item_id uuid,
  batch_no text NOT NULL,
  quantity numeric NOT NULL,
  unit_price numeric NOT NULL,
  total_price numeric NOT NULL,
  expiry_date date,
  created_at timestamp with time zone DEFAULT now(),
  tax_percentage numeric DEFAULT 0,
  tax_amount numeric DEFAULT 0
);

-- ─── pharmacy_direct_sales ──────────────────────────────────────────────────
CREATE TABLE public.pharmacy_direct_sales (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  sale_no text NOT NULL,
  sale_date timestamp with time zone DEFAULT now(),
  store_id uuid,
  first_name text NOT NULL,
  middle_name text,
  last_name text,
  phone_no text,
  external_no text,
  dob date,
  age numeric,
  age_unit text DEFAULT 'Years'::text,
  gender text,
  referred_doctor text,
  license_no text,
  nationality text DEFAULT 'SAUDI'::text,
  is_insured boolean DEFAULT false,
  is_new_external_patient boolean DEFAULT true,
  total_amount numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  tax_amount numeric DEFAULT 0,
  invoice_no text,
  receipt_no text,
  payment_mode text DEFAULT 'Cash'::text,
  reference_no text,
  pg_order_id text,
  pg_payment_id text,
  payment_status text DEFAULT 'pending'::text,
  discount_percentage numeric DEFAULT 0,
  discount_amount numeric DEFAULT 0
);

-- ─── pharmacy_drug_generics ──────────────────────────────────────────────────
CREATE TABLE public.pharmacy_drug_generics (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  generic_code text NOT NULL,
  generic_name text NOT NULL,
  group_name text,
  available_forms text,
  strength text,
  form_of_administration text,
  route_of_administration text,
  is_drug_generic boolean DEFAULT true,
  is_antibiotic boolean DEFAULT false,
  is_narcotic boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ─── pharmacy_drug_master ──────────────────────────────────────────────────
CREATE TABLE public.pharmacy_drug_master (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  item_id uuid,
  item_code text NOT NULL,
  drug_name text NOT NULL,
  generic_id uuid,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ─── pharmacy_racks ──────────────────────────────────────────────────
CREATE TABLE public.pharmacy_racks (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  zone_id uuid NOT NULL,
  rack_code character varying NOT NULL,
  rack_name character varying,
  no_of_shelves integer DEFAULT 5 NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- ─── pharmacy_return_items ──────────────────────────────────────────────────
CREATE TABLE public.pharmacy_return_items (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  return_id uuid,
  item_id text,
  batch_no text,
  description text,
  quantity numeric NOT NULL,
  unit_price numeric NOT NULL,
  total_amount numeric NOT NULL,
  batch_date timestamp with time zone,
  expiry_date timestamp with time zone,
  tax_percentage numeric DEFAULT 0,
  tax_amount numeric DEFAULT 0
);

-- ─── pharmacy_returns ──────────────────────────────────────────────────
CREATE TABLE public.pharmacy_returns (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  return_no text NOT NULL,
  original_bill_id text,
  patient_id text,
  store_id text,
  return_date timestamp with time zone DEFAULT now(),
  total_amount numeric NOT NULL,
  created_by text,
  status text DEFAULT 'Completed'::text,
  tax_amount numeric DEFAULT 0,
  refund_status text DEFAULT 'Pending'::text,
  refund_id uuid
);

-- ─── pharmacy_zones ──────────────────────────────────────────────────
CREATE TABLE public.pharmacy_zones (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  store_id uuid NOT NULL,
  zone_code character varying NOT NULL,
  zone_name character varying NOT NULL,
  temperature character varying DEFAULT 'Ambient'::character varying NOT NULL,
  description text,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- ─── policy_mapped_branches ──────────────────────────────────────────────────
CREATE TABLE public.policy_mapped_branches (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  policy_id uuid NOT NULL,
  branch_code text NOT NULL,
  branch_name text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- ─── policy_patient_max_amounts ──────────────────────────────────────────────────
CREATE TABLE public.policy_patient_max_amounts (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  policy_id uuid NOT NULL,
  class_name text DEFAULT 'A+'::text NOT NULL,
  circle_name text DEFAULT 'Corporate'::text,
  branch_code text DEFAULT 'All'::text,
  pat_max_amt numeric DEFAULT 100.00 NOT NULL,
  minimum_amt numeric DEFAULT 0.00,
  approval_limit numeric DEFAULT 1500.00,
  visit_type text DEFAULT 'OP'::text,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- ─── policy_rules ──────────────────────────────────────────────────
CREATE TABLE public.policy_rules (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  policy_id uuid NOT NULL,
  rule_type text NOT NULL,
  visit_type text NOT NULL,
  gender text DEFAULT 'All'::text,
  class_name text DEFAULT 'SERVICE_GROUPS'::text,
  tariff_class text DEFAULT 'A+'::text,
  tariff_value text DEFAULT 'A+ Value'::text,
  amount_limit numeric DEFAULT 0.00,
  quantity_limit integer DEFAULT 0,
  patient_copay text DEFAULT '10%'::text,
  sponsor_payment text DEFAULT '90%'::text,
  patient_deductible text DEFAULT '0'::text,
  patient_deductible_type text DEFAULT 'Amt'::text,
  approval_required boolean DEFAULT true,
  exclude boolean DEFAULT false,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  alias_code text,
  alias_name text,
  group_name text DEFAULT 'All'::text
);

-- ─── prescription_items ──────────────────────────────────────────────────
CREATE TABLE public.prescription_items (
  id text DEFAULT (uuid_generate_v4())::text NOT NULL,
  prescription_id text,
  generic_name text,
  item_id text,
  frequency text,
  dose text,
  units text,
  intake_qty numeric,
  start_date date,
  no_days integer,
  total_qty numeric,
  drug_instruction text,
  remarks text,
  status text DEFAULT 'Pending'::text,
  created_at timestamp with time zone DEFAULT now(),
  unit_price numeric DEFAULT 0,
  tax_percentage numeric DEFAULT 0,
  tax_amount numeric DEFAULT 0,
  total_amount numeric DEFAULT 0
);

-- ─── prescriptions ──────────────────────────────────────────────────
CREATE TABLE public.prescriptions (
  id text DEFAULT (uuid_generate_v4())::text NOT NULL,
  appointment_id text,
  patient_id text,
  doctor_id text,
  order_date timestamp with time zone DEFAULT now(),
  order_type text,
  status text DEFAULT 'Pending'::text,
  total_amount numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  tax_amount numeric DEFAULT 0
);

-- ─── procurement_expiry_return_items ──────────────────────────────────────────────────
CREATE TABLE public.procurement_expiry_return_items (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  return_id uuid,
  item_id uuid,
  batch_code character varying NOT NULL,
  expiry_date date NOT NULL,
  current_stock numeric DEFAULT 0.00,
  quantity numeric NOT NULL,
  rate numeric NOT NULL,
  value numeric NOT NULL,
  remarks text,
  created_at timestamp with time zone DEFAULT now()
);

-- ─── procurement_expiry_returns ──────────────────────────────────────────────────
CREATE TABLE public.procurement_expiry_returns (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  doc_no character varying NOT NULL,
  doc_date date NOT NULL,
  store_id uuid,
  vendor_id uuid,
  no_of_days integer NOT NULL,
  net_amount numeric DEFAULT 0.00,
  purchase_organisation character varying DEFAULT 'Pharmacy'::character varying NOT NULL,
  remarks text,
  status character varying DEFAULT 'Draft'::character varying NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- ─── procurement_grn_items ──────────────────────────────────────────────────
CREATE TABLE public.procurement_grn_items (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  grn_id uuid,
  item_id uuid,
  locator text,
  batch_code text NOT NULL,
  batch_date date,
  expiry_date date NOT NULL,
  po_quantity numeric DEFAULT 0.00,
  received_quantity numeric NOT NULL,
  accepted_quantity numeric NOT NULL,
  rate numeric NOT NULL,
  public_price numeric DEFAULT 0.00,
  unit_cost numeric NOT NULL,
  discount_percentage numeric DEFAULT 0.00,
  discount_amount numeric DEFAULT 0.00,
  vat_percentage numeric DEFAULT 15.00,
  vat_amount numeric DEFAULT 0.00,
  total_amount numeric NOT NULL,
  remarks text,
  is_bulky boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  cgst_amount numeric DEFAULT 0.00,
  sgst_amount numeric DEFAULT 0.00,
  igst_amount numeric DEFAULT 0.00,
  qc_status text DEFAULT 'Passed'::text
);

-- ─── procurement_grns ──────────────────────────────────────────────────
CREATE TABLE public.procurement_grns (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  grn_no text NOT NULL,
  grn_type text NOT NULL,
  vendor_id uuid,
  store_id uuid,
  po_id uuid,
  gate_entry_date date NOT NULL,
  gate_entry_no text NOT NULL,
  discount_percentage numeric DEFAULT 0.00,
  discount_amount numeric DEFAULT 0.00,
  net_amount numeric DEFAULT 0.00,
  gross_amount numeric DEFAULT 0.00,
  billing_structure jsonb DEFAULT '{}'::jsonb,
  other_details jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'Draft'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  invoice_no text
);

-- ─── procurement_gstr2b_invoices ──────────────────────────────────────────────────
CREATE TABLE public.procurement_gstr2b_invoices (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  upload_id uuid,
  invoice_no character varying NOT NULL,
  invoice_date character varying,
  taxable_value numeric DEFAULT 0.00,
  tax_amount numeric DEFAULT 0.00,
  cgst numeric DEFAULT 0.00,
  sgst numeric DEFAULT 0.00,
  igst numeric DEFAULT 0.00,
  supplier_name character varying,
  supplier_gst character varying,
  created_at timestamp with time zone DEFAULT now()
);

-- ─── procurement_gstr2b_uploads ──────────────────────────────────────────────────
CREATE TABLE public.procurement_gstr2b_uploads (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  period character varying NOT NULL,
  file_name character varying NOT NULL,
  upload_date timestamp with time zone DEFAULT now(),
  invoices_count integer DEFAULT 0,
  total_itc numeric DEFAULT 0.00,
  uploaded_by character varying DEFAULT 'System Manager'::character varying,
  status character varying DEFAULT 'Processed'::character varying,
  is_reconciled boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- ─── procurement_purchase_order_items ──────────────────────────────────────────────────
CREATE TABLE public.procurement_purchase_order_items (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  po_id uuid,
  item_id uuid,
  quantity numeric NOT NULL,
  public_price numeric DEFAULT 0.00,
  discount_percentage numeric DEFAULT 0.00,
  unit_cost numeric NOT NULL,
  is_bulk boolean DEFAULT false,
  tax_structure text,
  remarks text,
  source_doc_num text,
  source_doc_date date,
  source_quantity numeric DEFAULT 0.00,
  pending_quantity numeric DEFAULT 0.00,
  short_close_quantity numeric DEFAULT 0.00,
  created_at timestamp with time zone DEFAULT now()
);

-- ─── procurement_purchase_orders ──────────────────────────────────────────────────
CREATE TABLE public.procurement_purchase_orders (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  po_no text NOT NULL,
  po_type text DEFAULT 'Direct Purchase Order'::text NOT NULL,
  vendor_id uuid,
  store_id uuid,
  ref_doc_date date,
  ref_doc_no text,
  purchase_organisation text DEFAULT 'Pharmacy'::text NOT NULL,
  currency_code text DEFAULT 'Saudi Riyal'::text NOT NULL,
  currency_exchange_rate numeric DEFAULT 1.0,
  valid_till date,
  discount_amount numeric DEFAULT 0.00,
  discount_percentage numeric DEFAULT 0.00,
  tax_code uuid,
  is_non_stock boolean DEFAULT false,
  account_code text,
  net_amount numeric DEFAULT 0.00,
  address_details jsonb DEFAULT '{}'::jsonb,
  other_details jsonb DEFAULT '{}'::jsonb,
  imported_items text,
  status text DEFAULT 'Draft'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ─── procurement_purchase_receipt_items ──────────────────────────────────────────────────
CREATE TABLE public.procurement_purchase_receipt_items (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  receipt_id uuid,
  item_id uuid,
  quantity numeric NOT NULL,
  remarks text,
  rate numeric NOT NULL,
  discount_percentage numeric DEFAULT 0.00,
  discount_amount numeric DEFAULT 0.00,
  source_quantity numeric DEFAULT 0.00,
  pending_quantity numeric DEFAULT 0.00,
  already_converted_quantity numeric DEFAULT 0.00,
  batch_details jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- ─── procurement_purchase_receipts ──────────────────────────────────────────────────
CREATE TABLE public.procurement_purchase_receipts (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  receipt_no text NOT NULL,
  receipt_date date DEFAULT now() NOT NULL,
  grn_id uuid,
  vendor_id uuid,
  store_id uuid,
  tax_profile text,
  net_amount numeric DEFAULT 0.00,
  address_details jsonb DEFAULT '{}'::jsonb,
  reference_details jsonb DEFAULT '{}'::jsonb,
  lc_details jsonb DEFAULT '{}'::jsonb,
  other_details jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'Draft'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ─── procurement_purchase_return_items ──────────────────────────────────────────────────
CREATE TABLE public.procurement_purchase_return_items (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  return_id uuid,
  item_id uuid,
  quantity numeric NOT NULL,
  rate numeric NOT NULL,
  discount_percentage numeric DEFAULT 0.00,
  discount_amount numeric DEFAULT 0.00,
  source_quantity numeric DEFAULT 0.00,
  return_reason text,
  batch_details jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- ─── procurement_purchase_returns ──────────────────────────────────────────────────
CREATE TABLE public.procurement_purchase_returns (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  return_no character varying NOT NULL,
  return_date date NOT NULL,
  return_type character varying NOT NULL,
  source_grn_id uuid,
  source_prn_id uuid,
  vendor_id uuid,
  store_id uuid,
  net_amount numeric DEFAULT 0.00,
  remarks text,
  status character varying DEFAULT 'Draft'::character varying NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- ─── procurement_vendor_terms ──────────────────────────────────────────────────
CREATE TABLE public.procurement_vendor_terms (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  vendor_id uuid,
  term_code text NOT NULL,
  term_desc text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- ─── procurement_vendors ──────────────────────────────────────────────────
CREATE TABLE public.procurement_vendors (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  code text NOT NULL,
  name text NOT NULL,
  vendor_type text NOT NULL,
  billing_structure text,
  currency text DEFAULT 'SAR'::text NOT NULL,
  credit_period text,
  rating text,
  payment_term text,
  supplier_sub_type text,
  pan_no text,
  regst_status text NOT NULL,
  account_group text NOT NULL,
  tds_type text,
  export_license text,
  account text,
  remarks text,
  active boolean DEFAULT true,
  quality_check_required boolean DEFAULT false,
  suspended boolean DEFAULT false,
  iso_certified boolean DEFAULT false,
  is_vat boolean DEFAULT false,
  bank_info jsonb DEFAULT '{}'::jsonb,
  registration_details jsonb DEFAULT '{}'::jsonb,
  business_info jsonb DEFAULT '{}'::jsonb,
  contact_details jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  address text
);

-- ─── role_privileges ──────────────────────────────────────────────────
CREATE TABLE public.role_privileges (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  role_id uuid,
  screen_id uuid,
  can_view boolean DEFAULT false,
  can_create boolean DEFAULT false,
  can_edit boolean DEFAULT false,
  can_delete boolean DEFAULT false,
  can_export boolean DEFAULT false
);

-- ─── roles ──────────────────────────────────────────────────
CREATE TABLE public.roles (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  role_code text NOT NULL,
  role_name text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ─── schedule_templates ──────────────────────────────────────────────────
CREATE TABLE public.schedule_templates (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  doctor_id text NOT NULL,
  template_name text DEFAULT 'Default'::text NOT NULL,
  week_start date NOT NULL,
  created_by text,
  created_at timestamp with time zone DEFAULT now()
);

-- ─── screens ──────────────────────────────────────────────────
CREATE TABLE public.screens (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  module text NOT NULL,
  screen_code text NOT NULL,
  screen_name text NOT NULL,
  screen_url text NOT NULL,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- ─── service_approvals ──────────────────────────────────────────────────
CREATE TABLE public.service_approvals (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  order_id text NOT NULL,
  sponsor_id uuid,
  approval_status text DEFAULT 'Pending'::text NOT NULL,
  approval_code text,
  amount_approved numeric DEFAULT 0.00 NOT NULL,
  remarks text,
  requested_by text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ─── service_centres ──────────────────────────────────────────────────
CREATE TABLE public.service_centres (
  id text NOT NULL,
  name text NOT NULL,
  code text,
  status text DEFAULT 'Active'::text,
  department_id text
);

-- ─── service_definitions ──────────────────────────────────────────────────
CREATE TABLE public.service_definitions (
  id text NOT NULL,
  code text NOT NULL,
  name text NOT NULL,
  alternate_name text,
  service_type text,
  service_category text,
  est_duration integer,
  status text DEFAULT 'Active'::text,
  chargeable boolean DEFAULT true,
  applicable_visit_type text DEFAULT 'Both'::text,
  applicable_gender text DEFAULT 'Both'::text,
  re_order_duration integer,
  auto_cancellation_days integer,
  min_time_billing integer,
  max_time_billing integer,
  max_orderable_qty integer,
  cpt_code text,
  nphies_code text,
  nphies_desc text,
  schedulable boolean DEFAULT false,
  surgical_service boolean DEFAULT false,
  individually_orderable boolean DEFAULT true,
  auto_processable boolean DEFAULT false,
  consent_required boolean DEFAULT false,
  is_restricted boolean DEFAULT false,
  is_external boolean DEFAULT false,
  is_percentage_tariff boolean DEFAULT false,
  is_tooth_mandatory boolean DEFAULT false,
  is_auth_required boolean DEFAULT false,
  group_name text,
  billing_group_name text,
  financial_group text,
  cpt_description text,
  special_instructions text,
  created_at timestamp with time zone DEFAULT now()
);

-- ─── service_location_mappings ──────────────────────────────────────────────────
CREATE TABLE public.service_location_mappings (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  service_id text NOT NULL,
  branch_id uuid NOT NULL,
  department_id text,
  service_centre_id text,
  is_primary boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- ─── service_orders ──────────────────────────────────────────────────
CREATE TABLE public.service_orders (
  id text NOT NULL,
  appointment_id text,
  service_id text,
  service_name text,
  cpt_code text,
  quantity integer DEFAULT 1,
  unit_price numeric DEFAULT 0,
  discount_amount numeric DEFAULT 0,
  total_price numeric DEFAULT 0,
  order_date timestamp with time zone DEFAULT now(),
  status text DEFAULT 'Ordered'::text,
  billing_status text DEFAULT 'Pending'::text,
  priority text DEFAULT 'Routine'::text,
  ordering_doctor_id text,
  instructions text,
  service_center text,
  created_at timestamp with time zone DEFAULT now(),
  tooth_numbers text,
  dental_selections jsonb DEFAULT '[]'::jsonb
);

-- ─── service_tariffs ──────────────────────────────────────────────────
CREATE TABLE public.service_tariffs (
  id text NOT NULL,
  service_id text,
  tariff_name text NOT NULL,
  price numeric DEFAULT 0,
  effective_date date DEFAULT CURRENT_DATE,
  status text DEFAULT 'Active'::text,
  created_at timestamp with time zone DEFAULT now()
);

-- ─── sponsor_tariffs ──────────────────────────────────────────────────
CREATE TABLE public.sponsor_tariffs (
  id character varying NOT NULL,
  sponsor_id uuid,
  item_type character varying NOT NULL,
  item_code character varying NOT NULL,
  item_name character varying NOT NULL,
  cpt_code character varying,
  group_name character varying,
  base_tariff numeric DEFAULT 0.00 NOT NULL,
  contract_type character varying NOT NULL,
  tariff_amount numeric DEFAULT 0.00 NOT NULL,
  sponsor_code character varying,
  sponsor_description character varying,
  class_name character varying DEFAULT 'A+'::character varying NOT NULL,
  nphies_code character varying,
  nphies_desc character varying,
  active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- ─── stock_transfer_items ──────────────────────────────────────────────────
CREATE TABLE public.stock_transfer_items (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  transfer_id uuid,
  item_id uuid,
  batch_no text,
  expiry_date date,
  quantity numeric NOT NULL,
  source_ledger_id uuid,
  destination_ledger_id uuid,
  unit_id text
);

-- ─── stock_transfers ──────────────────────────────────────────────────
CREATE TABLE public.stock_transfers (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  transfer_no text NOT NULL,
  source_store_id uuid NOT NULL,
  destination_store_id uuid NOT NULL,
  status text DEFAULT 'Completed'::text NOT NULL,
  requested_by text,
  approved_by text,
  requested_at timestamp with time zone DEFAULT now(),
  approved_at timestamp with time zone,
  notes text
);

-- ─── store_item_mappings ──────────────────────────────────────────────────
CREATE TABLE public.store_item_mappings (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  store_id uuid,
  item_id uuid
);

-- ─── stores ──────────────────────────────────────────────────
CREATE TABLE public.stores (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  store_code text NOT NULL,
  store_name text NOT NULL,
  branch_id uuid,
  status text DEFAULT 'Active'::text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  store_type text,
  department_id text
);

-- ─── tax_masters ──────────────────────────────────────────────────
CREATE TABLE public.tax_masters (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  tax_name text NOT NULL,
  percentage numeric NOT NULL,
  status text DEFAULT 'Active'::text,
  created_at timestamp with time zone DEFAULT now()
);

-- ─── temp_unresolved_lab_orders ──────────────────────────────────────────────────
CREATE TABLE public.temp_unresolved_lab_orders (
  lab_order_id uuid NOT NULL,
  service_order_id text,
  logged_at timestamp with time zone DEFAULT now()
);

-- ─── units ──────────────────────────────────────────────────
CREATE TABLE public.units (
  id text NOT NULL,
  name text NOT NULL,
  code text,
  status text DEFAULT 'Active'::text
);

-- ─── user_privilege_overrides ──────────────────────────────────────────────────
CREATE TABLE public.user_privilege_overrides (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  user_id text,
  screen_id uuid,
  can_view boolean DEFAULT false,
  can_create boolean DEFAULT false,
  can_edit boolean DEFAULT false,
  can_delete boolean DEFAULT false,
  can_export boolean DEFAULT false
);

-- ─── vital_sign_groups ──────────────────────────────────────────────────
CREATE TABLE public.vital_sign_groups (
  id text NOT NULL,
  name text NOT NULL,
  status text DEFAULT 'Active'::text
);

-- ─── vital_sign_parameters ──────────────────────────────────────────────────
CREATE TABLE public.vital_sign_parameters (
  id text NOT NULL,
  group_id text,
  name text NOT NULL,
  control_type text NOT NULL,
  reference_range_min text,
  reference_range_max text,
  unit text,
  is_active boolean DEFAULT true,
  formula text
);

-- ─── vw_batch_locations ──────────────────────────────────────────────────
CREATE TABLE public.vw_batch_locations (
  id uuid,
  store_id uuid,
  item_id uuid,
  batch_no character varying,
  shelf_no integer,
  bin_no character varying,
  is_primary boolean,
  notes text,
  created_by text,
  updated_at timestamp with time zone,
  zone_id uuid,
  zone_code character varying,
  zone_name character varying,
  temperature character varying,
  rack_id uuid,
  rack_code character varying,
  rack_name character varying,
  item_name text,
  item_code text,
  location_display text,
  location_code text
);

-- 3. Create Views
CREATE OR REPLACE VIEW public.vw_batch_locations AS 
 SELECT bl.id,
    bl.store_id,
    bl.item_id,
    bl.batch_no,
    bl.shelf_no,
    bl.bin_no,
    bl.is_primary,
    bl.notes,
    bl.created_by,
    bl.updated_at,
    pz.id AS zone_id,
    pz.zone_code,
    pz.zone_name,
    pz.temperature,
    pr.id AS rack_id,
    pr.rack_code,
    pr.rack_name,
    ii.item_name,
    ii.item_code,
    ((((((((('Zone '::text || (pz.zone_code)::text) || ' › '::text) || (pr.rack_code)::text) || ' › '::text) || 'Shelf '::text) || bl.shelf_no) || ' › '::text) || 'Bin '::text) || (bl.bin_no)::text) AS location_display,
    (((((((pz.zone_code)::text || '-'::text) || (pr.rack_code)::text) || '-S'::text) || bl.shelf_no) || '-B'::text) || lpad((bl.bin_no)::text, 2, '0'::text)) AS location_code
   FROM (((inventory_batch_locations bl
     JOIN pharmacy_zones pz ON ((pz.id = bl.zone_id)))
     JOIN pharmacy_racks pr ON ((pr.id = bl.rack_id)))
     JOIN inventory_items ii ON ((ii.id = bl.item_id)));

-- 4. Insert Seed and Lookup Data
-- Seed roles
INSERT INTO public.roles (id, role_code, role_name, description) VALUES ('9c602d0c-d4d0-45b4-946f-7a1e7bc268fc', 'ADMIN', 'Administrator', 'Full system access, bypasses all privilege checks') ON CONFLICT DO NOTHING;
INSERT INTO public.roles (id, role_code, role_name, description) VALUES ('e5fc17d7-67b8-4ba0-b3e0-7da474d9674f', 'LAB001', 'LAB', NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.roles (id, role_code, role_name, description) VALUES ('5cee6f3e-9a90-4b36-8c11-133ef2c0d22a', 'LAB002', 'LAB-REPORT', NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.roles (id, role_code, role_name, description) VALUES ('65853bae-c66f-410f-b14f-0fa76009dbac', 'IN001', 'INVENTORY', NULL) ON CONFLICT DO NOTHING;

-- Seed screens
INSERT INTO public.screens (id, module, screen_code, screen_name, screen_url, display_order) VALUES ('093e0d33-32b4-46fa-99f5-404ca289a863', 'Lab', 'LIMS_COLLECT', 'Collect Sample', '/lims/collect', 2) ON CONFLICT DO NOTHING;
INSERT INTO public.screens (id, module, screen_code, screen_name, screen_url, display_order) VALUES ('30354377-810c-4e1f-9d78-f934e102c97d', 'Lab', 'LIMS_ACCEPT', 'Accept Sample', '/lims/accept', 3) ON CONFLICT DO NOTHING;
INSERT INTO public.screens (id, module, screen_code, screen_name, screen_url, display_order) VALUES ('b85487fc-bd1e-4366-9cc3-989192cb2eb4', 'Lab', 'LIMS_PERFORM', 'Perform Test', '/lims/perform', 4) ON CONFLICT DO NOTHING;
INSERT INTO public.screens (id, module, screen_code, screen_name, screen_url, display_order) VALUES ('efbadbc8-fd9e-4768-b2c7-8f61345010bd', 'Lab', 'LIMS_AMENDMENTS', 'Pathology Amendments', '/lims/amendments', 5) ON CONFLICT DO NOTHING;
INSERT INTO public.screens (id, module, screen_code, screen_name, screen_url, display_order) VALUES ('89e81b90-b238-4f3a-991b-4d84557c06c5', 'Finance', 'FIN_BILLING', 'Billing Workbench', '/finance/billing', 1) ON CONFLICT DO NOTHING;
INSERT INTO public.screens (id, module, screen_code, screen_name, screen_url, display_order) VALUES ('c6548f06-a74d-4baf-8821-4d7052274be1', 'Finance', 'FIN_REFUND', 'Refund Workbench', '/finance/transactions/refund', 2) ON CONFLICT DO NOTHING;
INSERT INTO public.screens (id, module, screen_code, screen_name, screen_url, display_order) VALUES ('736a5423-86e0-4e6d-ac5e-06c110be862a', 'Finance', 'FIN_COA', 'Chart of Accounts', '/finance/masters/chart-of-accounts', 3) ON CONFLICT DO NOTHING;
INSERT INTO public.screens (id, module, screen_code, screen_name, screen_url, display_order) VALUES ('8dcb62b6-4e02-4409-896f-2043b138c3d5', 'Finance', 'FIN_JV', 'Journal Vouchers', '/finance/transactions/journal-vouchers', 4) ON CONFLICT DO NOTHING;
INSERT INTO public.screens (id, module, screen_code, screen_name, screen_url, display_order) VALUES ('7a4ba429-d68a-4efe-8906-ea3f6e5dc64a', 'Finance', 'FIN_ORG', 'Organization Master', '/finance/masters/organization', 5) ON CONFLICT DO NOTHING;
INSERT INTO public.screens (id, module, screen_code, screen_name, screen_url, display_order) VALUES ('0385e23d-bac9-4953-81ad-5d311fa23c0e', 'Finance', 'FIN_PLAN', 'Plan Definition', '/finance/masters/plan-definition', 6) ON CONFLICT DO NOTHING;
INSERT INTO public.screens (id, module, screen_code, screen_name, screen_url, display_order) VALUES ('22766351-d68b-4cda-bd60-4e67ec6ae922', 'Finance', 'FIN_TARIFF', 'Sponsor Tariff', '/finance/masters/sponsor-tariff', 7) ON CONFLICT DO NOTHING;
INSERT INTO public.screens (id, module, screen_code, screen_name, screen_url, display_order) VALUES ('f2fe8cb4-982e-4458-9d19-53a24af3d4b6', 'Lab', 'LIMS_DASHBOARD', 'LIMS Dashboard', '/lims/dashboard', 1) ON CONFLICT DO NOTHING;
INSERT INTO public.screens (id, module, screen_code, screen_name, screen_url, display_order) VALUES ('d1c139e9-4c71-4ff9-8366-8245458cae67', 'System', 'DASHBOARD', 'Main Dashboard', '/', 1) ON CONFLICT DO NOTHING;
INSERT INTO public.screens (id, module, screen_code, screen_name, screen_url, display_order) VALUES ('6a8e5a29-88cd-4ded-9abf-88f12760f7c1', 'System', 'APPOINTMENTS', 'Appointments Page', '/appointments', 2) ON CONFLICT DO NOTHING;
INSERT INTO public.screens (id, module, screen_code, screen_name, screen_url, display_order) VALUES ('e4767e46-8c9e-4a44-b0f8-7658ca54c76b', 'System', 'PATIENTS', 'Patients Registration', '/patients', 3) ON CONFLICT DO NOTHING;
INSERT INTO public.screens (id, module, screen_code, screen_name, screen_url, display_order) VALUES ('b2544a55-5fff-4ccf-818d-a0dedee059e6', 'System', 'DOCTOR_WORKBENCH', 'Doctor Workbench', '/doctor-workbench', 4) ON CONFLICT DO NOTHING;
INSERT INTO public.screens (id, module, screen_code, screen_name, screen_url, display_order) VALUES ('d8381010-6c20-441a-977c-9241950d13fc', 'System', 'ABDM_PROFILES', 'ABDM Profiles', '/abdm-profiles', 5) ON CONFLICT DO NOTHING;
INSERT INTO public.screens (id, module, screen_code, screen_name, screen_url, display_order) VALUES ('934be39a-1e26-4d51-a106-9951f9dae56d', 'System', 'REPORTS', 'System Reports', '/reports', 6) ON CONFLICT DO NOTHING;
INSERT INTO public.screens (id, module, screen_code, screen_name, screen_url, display_order) VALUES ('1135164a-3c11-414d-bbe8-aa4c19eb926d', 'System', 'EMPLOYEES', 'Doctors & Staff Management', '/employees', 7) ON CONFLICT DO NOTHING;
INSERT INTO public.screens (id, module, screen_code, screen_name, screen_url, display_order) VALUES ('930d6b49-a55f-47cf-b477-a78c7263c0eb', 'System', 'AVAILABILITY', 'Availability Scheduler', '/availability', 8) ON CONFLICT DO NOTHING;
INSERT INTO public.screens (id, module, screen_code, screen_name, screen_url, display_order) VALUES ('5968ab30-c687-4d59-98bf-405881a201ce', 'System', 'MASTERS', 'Administration Masters', '/masters', 9) ON CONFLICT DO NOTHING;
INSERT INTO public.screens (id, module, screen_code, screen_name, screen_url, display_order) VALUES ('135622ec-275b-46c1-a0d6-9e7233f2d613', 'System', 'RBAC_CONFIG', 'RBAC Control Center', '/rbac', 10) ON CONFLICT DO NOTHING;
INSERT INTO public.screens (id, module, screen_code, screen_name, screen_url, display_order) VALUES ('e344fdd4-c5e2-4d81-b3c2-5ff25a285174', 'Inventory', 'INVENTORY_DASHBOARD', 'Inventory Module Access', '/inventory', 1) ON CONFLICT DO NOTHING;
INSERT INTO public.screens (id, module, screen_code, screen_name, screen_url, display_order) VALUES ('50356998-5601-4335-851d-d24387bfe55b', 'Pharmacy', 'PHARMACY_DASHBOARD', 'Pharmacy Module Access', '/pharmacy', 1) ON CONFLICT DO NOTHING;
INSERT INTO public.screens (id, module, screen_code, screen_name, screen_url, display_order) VALUES ('d17cd2b9-5be6-49ff-931b-2eca51ba9115', 'Procurement', 'PROCUREMENT_DASHBOARD', 'Procurement Module Access', '/procurement', 1) ON CONFLICT DO NOTHING;
INSERT INTO public.screens (id, module, screen_code, screen_name, screen_url, display_order) VALUES ('7a99fd79-c4a6-43d0-aed0-5a5e18410fa1', 'Lab', 'LIMS_MASTERS', 'LIMS Masters Configuration', '/lims/masters', 7) ON CONFLICT DO NOTHING;
INSERT INTO public.screens (id, module, screen_code, screen_name, screen_url, display_order) VALUES ('a13d1a9a-7c44-40ce-9ede-18d6893a72ce', 'Lab', 'LIMS_ANALYTICS', 'Compliance & Analytics', '/lims/analytics', 6) ON CONFLICT DO NOTHING;

-- Seed role_privileges
INSERT INTO public.role_privileges (id, role_id, screen_id, can_view, can_create, can_edit, can_delete, can_export) VALUES ('50f39e0e-e189-47d8-8bf5-c3684e6e151e', 'e5fc17d7-67b8-4ba0-b3e0-7da474d9674f', 'd1c139e9-4c71-4ff9-8366-8245458cae67', false, false, false, false, false) ON CONFLICT DO NOTHING;
INSERT INTO public.role_privileges (id, role_id, screen_id, can_view, can_create, can_edit, can_delete, can_export) VALUES ('e349d783-30dc-454b-abbb-d37844b5fc8f', 'e5fc17d7-67b8-4ba0-b3e0-7da474d9674f', 'f2fe8cb4-982e-4458-9d19-53a24af3d4b6', true, true, true, true, true) ON CONFLICT DO NOTHING;
INSERT INTO public.role_privileges (id, role_id, screen_id, can_view, can_create, can_edit, can_delete, can_export) VALUES ('8ca2e79a-23a1-4f7f-a3f4-544f6b943bcc', 'e5fc17d7-67b8-4ba0-b3e0-7da474d9674f', '50356998-5601-4335-851d-d24387bfe55b', false, false, false, false, false) ON CONFLICT DO NOTHING;
INSERT INTO public.role_privileges (id, role_id, screen_id, can_view, can_create, can_edit, can_delete, can_export) VALUES ('bcb19465-d89f-4cd0-a1e5-1fe86fabf9c7', 'e5fc17d7-67b8-4ba0-b3e0-7da474d9674f', 'e344fdd4-c5e2-4d81-b3c2-5ff25a285174', false, false, false, false, false) ON CONFLICT DO NOTHING;
INSERT INTO public.role_privileges (id, role_id, screen_id, can_view, can_create, can_edit, can_delete, can_export) VALUES ('c30d7fdb-6180-4233-9d75-1161c2437ee4', 'e5fc17d7-67b8-4ba0-b3e0-7da474d9674f', '89e81b90-b238-4f3a-991b-4d84557c06c5', false, false, false, false, false) ON CONFLICT DO NOTHING;
INSERT INTO public.role_privileges (id, role_id, screen_id, can_view, can_create, can_edit, can_delete, can_export) VALUES ('ed9b6350-6e4d-47dc-9144-47affe57e6dd', 'e5fc17d7-67b8-4ba0-b3e0-7da474d9674f', 'd17cd2b9-5be6-49ff-931b-2eca51ba9115', false, false, false, false, false) ON CONFLICT DO NOTHING;
INSERT INTO public.role_privileges (id, role_id, screen_id, can_view, can_create, can_edit, can_delete, can_export) VALUES ('15e5e11c-aa95-4d36-a7cb-5977c92d0189', 'e5fc17d7-67b8-4ba0-b3e0-7da474d9674f', '093e0d33-32b4-46fa-99f5-404ca289a863', true, true, true, true, true) ON CONFLICT DO NOTHING;
INSERT INTO public.role_privileges (id, role_id, screen_id, can_view, can_create, can_edit, can_delete, can_export) VALUES ('b3cc750f-3977-427f-89e0-2bbff6ca1e85', 'e5fc17d7-67b8-4ba0-b3e0-7da474d9674f', 'c6548f06-a74d-4baf-8821-4d7052274be1', false, false, false, false, false) ON CONFLICT DO NOTHING;
INSERT INTO public.role_privileges (id, role_id, screen_id, can_view, can_create, can_edit, can_delete, can_export) VALUES ('c59174e4-bae0-4a65-88fd-13a17c98e4c9', 'e5fc17d7-67b8-4ba0-b3e0-7da474d9674f', '6a8e5a29-88cd-4ded-9abf-88f12760f7c1', false, false, false, false, false) ON CONFLICT DO NOTHING;
INSERT INTO public.role_privileges (id, role_id, screen_id, can_view, can_create, can_edit, can_delete, can_export) VALUES ('eaf7f485-f938-4315-91d5-0370e0dc353d', 'e5fc17d7-67b8-4ba0-b3e0-7da474d9674f', '736a5423-86e0-4e6d-ac5e-06c110be862a', false, false, false, false, false) ON CONFLICT DO NOTHING;
INSERT INTO public.role_privileges (id, role_id, screen_id, can_view, can_create, can_edit, can_delete, can_export) VALUES ('618702d4-20c5-4f0d-9c4b-7c9265a2c4da', 'e5fc17d7-67b8-4ba0-b3e0-7da474d9674f', 'e4767e46-8c9e-4a44-b0f8-7658ca54c76b', false, false, false, false, false) ON CONFLICT DO NOTHING;
INSERT INTO public.role_privileges (id, role_id, screen_id, can_view, can_create, can_edit, can_delete, can_export) VALUES ('f47e82e0-99c3-40e2-8b3d-4551b20c1168', 'e5fc17d7-67b8-4ba0-b3e0-7da474d9674f', '30354377-810c-4e1f-9d78-f934e102c97d', false, false, false, false, false) ON CONFLICT DO NOTHING;
INSERT INTO public.role_privileges (id, role_id, screen_id, can_view, can_create, can_edit, can_delete, can_export) VALUES ('0f574c2a-1346-4137-aed3-922dcd2d9363', 'e5fc17d7-67b8-4ba0-b3e0-7da474d9674f', '8dcb62b6-4e02-4409-896f-2043b138c3d5', false, false, false, false, false) ON CONFLICT DO NOTHING;
INSERT INTO public.role_privileges (id, role_id, screen_id, can_view, can_create, can_edit, can_delete, can_export) VALUES ('607ab1de-6060-40f3-8d4e-74f83623752c', 'e5fc17d7-67b8-4ba0-b3e0-7da474d9674f', 'b85487fc-bd1e-4366-9cc3-989192cb2eb4', false, false, false, false, false) ON CONFLICT DO NOTHING;
INSERT INTO public.role_privileges (id, role_id, screen_id, can_view, can_create, can_edit, can_delete, can_export) VALUES ('b6e1f728-55a8-40a2-8c30-7a5e7cbf99bf', 'e5fc17d7-67b8-4ba0-b3e0-7da474d9674f', 'b2544a55-5fff-4ccf-818d-a0dedee059e6', false, false, false, false, false) ON CONFLICT DO NOTHING;
INSERT INTO public.role_privileges (id, role_id, screen_id, can_view, can_create, can_edit, can_delete, can_export) VALUES ('d2a8f376-6e72-4bdf-99af-8b0290306290', 'e5fc17d7-67b8-4ba0-b3e0-7da474d9674f', 'efbadbc8-fd9e-4768-b2c7-8f61345010bd', false, false, false, false, false) ON CONFLICT DO NOTHING;
INSERT INTO public.role_privileges (id, role_id, screen_id, can_view, can_create, can_edit, can_delete, can_export) VALUES ('e1589043-8851-4422-9c8b-c4a022046e8e', 'e5fc17d7-67b8-4ba0-b3e0-7da474d9674f', 'd8381010-6c20-441a-977c-9241950d13fc', false, false, false, false, false) ON CONFLICT DO NOTHING;
INSERT INTO public.role_privileges (id, role_id, screen_id, can_view, can_create, can_edit, can_delete, can_export) VALUES ('0d9f6d3f-930d-4672-acf6-deaadd6792a2', 'e5fc17d7-67b8-4ba0-b3e0-7da474d9674f', '7a4ba429-d68a-4efe-8906-ea3f6e5dc64a', false, false, false, false, false) ON CONFLICT DO NOTHING;
INSERT INTO public.role_privileges (id, role_id, screen_id, can_view, can_create, can_edit, can_delete, can_export) VALUES ('13b940bb-c697-4bcb-ab9a-d07bd7c05af5', 'e5fc17d7-67b8-4ba0-b3e0-7da474d9674f', '0385e23d-bac9-4953-81ad-5d311fa23c0e', false, false, false, false, false) ON CONFLICT DO NOTHING;
INSERT INTO public.role_privileges (id, role_id, screen_id, can_view, can_create, can_edit, can_delete, can_export) VALUES ('c1a05657-f33a-49ed-ae34-10d4dd26a176', 'e5fc17d7-67b8-4ba0-b3e0-7da474d9674f', 'a13d1a9a-7c44-40ce-9ede-18d6893a72ce', false, false, false, false, false) ON CONFLICT DO NOTHING;
INSERT INTO public.role_privileges (id, role_id, screen_id, can_view, can_create, can_edit, can_delete, can_export) VALUES ('f1835c87-2915-4620-8da4-a2b4475ccc7d', 'e5fc17d7-67b8-4ba0-b3e0-7da474d9674f', '934be39a-1e26-4d51-a106-9951f9dae56d', false, false, false, false, false) ON CONFLICT DO NOTHING;
INSERT INTO public.role_privileges (id, role_id, screen_id, can_view, can_create, can_edit, can_delete, can_export) VALUES ('3a1a347d-de54-49dd-9728-04d5bc0ac51f', 'e5fc17d7-67b8-4ba0-b3e0-7da474d9674f', '1135164a-3c11-414d-bbe8-aa4c19eb926d', false, false, false, false, false) ON CONFLICT DO NOTHING;
INSERT INTO public.role_privileges (id, role_id, screen_id, can_view, can_create, can_edit, can_delete, can_export) VALUES ('6bcef8ba-9491-44aa-a387-17384439e16c', 'e5fc17d7-67b8-4ba0-b3e0-7da474d9674f', '7a99fd79-c4a6-43d0-aed0-5a5e18410fa1', false, false, false, false, false) ON CONFLICT DO NOTHING;
INSERT INTO public.role_privileges (id, role_id, screen_id, can_view, can_create, can_edit, can_delete, can_export) VALUES ('316cb757-b6ea-402b-b592-306a210cf6c9', 'e5fc17d7-67b8-4ba0-b3e0-7da474d9674f', '22766351-d68b-4cda-bd60-4e67ec6ae922', false, false, false, false, false) ON CONFLICT DO NOTHING;
INSERT INTO public.role_privileges (id, role_id, screen_id, can_view, can_create, can_edit, can_delete, can_export) VALUES ('1ac1ae54-cdd6-462e-951d-cb4d03ca3a7f', 'e5fc17d7-67b8-4ba0-b3e0-7da474d9674f', '930d6b49-a55f-47cf-b477-a78c7263c0eb', false, false, false, false, false) ON CONFLICT DO NOTHING;
INSERT INTO public.role_privileges (id, role_id, screen_id, can_view, can_create, can_edit, can_delete, can_export) VALUES ('8eb54df9-f468-4cad-be68-b49a2801e2d6', 'e5fc17d7-67b8-4ba0-b3e0-7da474d9674f', '5968ab30-c687-4d59-98bf-405881a201ce', false, false, false, false, false) ON CONFLICT DO NOTHING;
INSERT INTO public.role_privileges (id, role_id, screen_id, can_view, can_create, can_edit, can_delete, can_export) VALUES ('303174e8-f9c6-4cac-8e60-561a7af15424', 'e5fc17d7-67b8-4ba0-b3e0-7da474d9674f', '135622ec-275b-46c1-a0d6-9e7233f2d613', false, false, false, false, false) ON CONFLICT DO NOTHING;
INSERT INTO public.role_privileges (id, role_id, screen_id, can_view, can_create, can_edit, can_delete, can_export) VALUES ('9eb3796b-b66a-4d76-92b1-2e6abfd50ff2', '65853bae-c66f-410f-b14f-0fa76009dbac', 'd1c139e9-4c71-4ff9-8366-8245458cae67', false, false, false, false, false) ON CONFLICT DO NOTHING;
INSERT INTO public.role_privileges (id, role_id, screen_id, can_view, can_create, can_edit, can_delete, can_export) VALUES ('fb0725a7-5255-4208-85f9-b01cac8af6f3', '65853bae-c66f-410f-b14f-0fa76009dbac', 'f2fe8cb4-982e-4458-9d19-53a24af3d4b6', false, false, false, false, false) ON CONFLICT DO NOTHING;
INSERT INTO public.role_privileges (id, role_id, screen_id, can_view, can_create, can_edit, can_delete, can_export) VALUES ('fe1e5680-37f8-4d84-a3c6-c6a3624a5d54', '65853bae-c66f-410f-b14f-0fa76009dbac', '50356998-5601-4335-851d-d24387bfe55b', false, false, false, false, false) ON CONFLICT DO NOTHING;
INSERT INTO public.role_privileges (id, role_id, screen_id, can_view, can_create, can_edit, can_delete, can_export) VALUES ('cf4c9a5e-60c1-4530-a5dc-51044983a994', '65853bae-c66f-410f-b14f-0fa76009dbac', 'e344fdd4-c5e2-4d81-b3c2-5ff25a285174', true, true, true, true, true) ON CONFLICT DO NOTHING;
INSERT INTO public.role_privileges (id, role_id, screen_id, can_view, can_create, can_edit, can_delete, can_export) VALUES ('d2888dcd-0389-4a1d-8f41-f740b2c736b5', '65853bae-c66f-410f-b14f-0fa76009dbac', '89e81b90-b238-4f3a-991b-4d84557c06c5', false, false, false, false, false) ON CONFLICT DO NOTHING;
INSERT INTO public.role_privileges (id, role_id, screen_id, can_view, can_create, can_edit, can_delete, can_export) VALUES ('c69bc8ab-0dd5-4a90-8d78-3c4663675b32', '65853bae-c66f-410f-b14f-0fa76009dbac', 'd17cd2b9-5be6-49ff-931b-2eca51ba9115', true, true, true, true, true) ON CONFLICT DO NOTHING;
INSERT INTO public.role_privileges (id, role_id, screen_id, can_view, can_create, can_edit, can_delete, can_export) VALUES ('e8a88082-b6ab-4332-9342-583303746113', '65853bae-c66f-410f-b14f-0fa76009dbac', '093e0d33-32b4-46fa-99f5-404ca289a863', false, false, false, false, false) ON CONFLICT DO NOTHING;
INSERT INTO public.role_privileges (id, role_id, screen_id, can_view, can_create, can_edit, can_delete, can_export) VALUES ('dde14b3b-a1b4-4cf3-8408-bdeb9a783d4d', '65853bae-c66f-410f-b14f-0fa76009dbac', 'c6548f06-a74d-4baf-8821-4d7052274be1', false, false, false, false, false) ON CONFLICT DO NOTHING;
INSERT INTO public.role_privileges (id, role_id, screen_id, can_view, can_create, can_edit, can_delete, can_export) VALUES ('0bca7bb9-d86a-40a7-b41c-2d4a4a71c634', '65853bae-c66f-410f-b14f-0fa76009dbac', '6a8e5a29-88cd-4ded-9abf-88f12760f7c1', false, false, false, false, false) ON CONFLICT DO NOTHING;
INSERT INTO public.role_privileges (id, role_id, screen_id, can_view, can_create, can_edit, can_delete, can_export) VALUES ('59c49788-ca80-44df-9214-e0593a9c4ba3', '65853bae-c66f-410f-b14f-0fa76009dbac', '736a5423-86e0-4e6d-ac5e-06c110be862a', false, false, false, false, false) ON CONFLICT DO NOTHING;
INSERT INTO public.role_privileges (id, role_id, screen_id, can_view, can_create, can_edit, can_delete, can_export) VALUES ('7eac1e36-3105-41df-aaf9-3a610571088a', '65853bae-c66f-410f-b14f-0fa76009dbac', 'e4767e46-8c9e-4a44-b0f8-7658ca54c76b', false, false, false, false, false) ON CONFLICT DO NOTHING;
INSERT INTO public.role_privileges (id, role_id, screen_id, can_view, can_create, can_edit, can_delete, can_export) VALUES ('c6de058a-b2c5-4b52-92ec-d8bad4f1abfe', '65853bae-c66f-410f-b14f-0fa76009dbac', '30354377-810c-4e1f-9d78-f934e102c97d', false, false, false, false, false) ON CONFLICT DO NOTHING;
INSERT INTO public.role_privileges (id, role_id, screen_id, can_view, can_create, can_edit, can_delete, can_export) VALUES ('6638c728-9d23-466e-b6b1-2954790cbcb3', '5cee6f3e-9a90-4b36-8c11-133ef2c0d22a', '8dcb62b6-4e02-4409-896f-2043b138c3d5', false, false, false, false, false) ON CONFLICT DO NOTHING;
INSERT INTO public.role_privileges (id, role_id, screen_id, can_view, can_create, can_edit, can_delete, can_export) VALUES ('8125b655-e225-4018-8a6a-5c8b45d111eb', '5cee6f3e-9a90-4b36-8c11-133ef2c0d22a', 'b85487fc-bd1e-4366-9cc3-989192cb2eb4', false, false, false, false, false) ON CONFLICT DO NOTHING;
INSERT INTO public.role_privileges (id, role_id, screen_id, can_view, can_create, can_edit, can_delete, can_export) VALUES ('e48004d3-151a-4fec-aa36-16126ba3fa9a', '5cee6f3e-9a90-4b36-8c11-133ef2c0d22a', 'b2544a55-5fff-4ccf-818d-a0dedee059e6', false, false, false, false, false) ON CONFLICT DO NOTHING;
INSERT INTO public.role_privileges (id, role_id, screen_id, can_view, can_create, can_edit, can_delete, can_export) VALUES ('1d6dcbe7-e36c-4f60-8be9-ed7fd3ee325a', '5cee6f3e-9a90-4b36-8c11-133ef2c0d22a', 'efbadbc8-fd9e-4768-b2c7-8f61345010bd', false, false, false, false, false) ON CONFLICT DO NOTHING;
INSERT INTO public.role_privileges (id, role_id, screen_id, can_view, can_create, can_edit, can_delete, can_export) VALUES ('8c5067bf-9947-4d09-89cb-ee3f8586d147', '5cee6f3e-9a90-4b36-8c11-133ef2c0d22a', 'd8381010-6c20-441a-977c-9241950d13fc', false, false, false, false, false) ON CONFLICT DO NOTHING;
INSERT INTO public.role_privileges (id, role_id, screen_id, can_view, can_create, can_edit, can_delete, can_export) VALUES ('58652cd0-5284-47af-a6c8-693f022b652d', '5cee6f3e-9a90-4b36-8c11-133ef2c0d22a', '7a4ba429-d68a-4efe-8906-ea3f6e5dc64a', false, false, false, false, false) ON CONFLICT DO NOTHING;
INSERT INTO public.role_privileges (id, role_id, screen_id, can_view, can_create, can_edit, can_delete, can_export) VALUES ('878fc42b-2777-43e8-bf3d-73743742072a', '5cee6f3e-9a90-4b36-8c11-133ef2c0d22a', '0385e23d-bac9-4953-81ad-5d311fa23c0e', false, false, false, false, false) ON CONFLICT DO NOTHING;
INSERT INTO public.role_privileges (id, role_id, screen_id, can_view, can_create, can_edit, can_delete, can_export) VALUES ('f49a42b5-2a73-42f8-be31-51241d28e8ac', '5cee6f3e-9a90-4b36-8c11-133ef2c0d22a', 'a13d1a9a-7c44-40ce-9ede-18d6893a72ce', false, false, false, false, false) ON CONFLICT DO NOTHING;
INSERT INTO public.role_privileges (id, role_id, screen_id, can_view, can_create, can_edit, can_delete, can_export) VALUES ('4106197c-0e9e-4dde-9c0b-ccb9639f6497', '5cee6f3e-9a90-4b36-8c11-133ef2c0d22a', '934be39a-1e26-4d51-a106-9951f9dae56d', false, false, false, false, false) ON CONFLICT DO NOTHING;
INSERT INTO public.role_privileges (id, role_id, screen_id, can_view, can_create, can_edit, can_delete, can_export) VALUES ('149ef012-6182-461b-8265-bf4e954f7ab8', '5cee6f3e-9a90-4b36-8c11-133ef2c0d22a', '1135164a-3c11-414d-bbe8-aa4c19eb926d', false, false, false, false, false) ON CONFLICT DO NOTHING;
INSERT INTO public.role_privileges (id, role_id, screen_id, can_view, can_create, can_edit, can_delete, can_export) VALUES ('acf9f6b4-9668-4707-b29a-540b4b9b243d', '5cee6f3e-9a90-4b36-8c11-133ef2c0d22a', '7a99fd79-c4a6-43d0-aed0-5a5e18410fa1', false, false, false, false, false) ON CONFLICT DO NOTHING;
INSERT INTO public.role_privileges (id, role_id, screen_id, can_view, can_create, can_edit, can_delete, can_export) VALUES ('87ea19b1-92af-4833-9d60-ba472a01cb69', '5cee6f3e-9a90-4b36-8c11-133ef2c0d22a', '22766351-d68b-4cda-bd60-4e67ec6ae922', false, false, false, false, false) ON CONFLICT DO NOTHING;
INSERT INTO public.role_privileges (id, role_id, screen_id, can_view, can_create, can_edit, can_delete, can_export) VALUES ('bab40739-c97f-4aa8-a34c-d3932609f445', '5cee6f3e-9a90-4b36-8c11-133ef2c0d22a', '930d6b49-a55f-47cf-b477-a78c7263c0eb', false, false, false, false, false) ON CONFLICT DO NOTHING;
INSERT INTO public.role_privileges (id, role_id, screen_id, can_view, can_create, can_edit, can_delete, can_export) VALUES ('d3b87c39-52a2-4458-ae55-cbbe7edf2767', '5cee6f3e-9a90-4b36-8c11-133ef2c0d22a', '5968ab30-c687-4d59-98bf-405881a201ce', false, false, false, false, false) ON CONFLICT DO NOTHING;
INSERT INTO public.role_privileges (id, role_id, screen_id, can_view, can_create, can_edit, can_delete, can_export) VALUES ('a2609077-457d-4cbb-ab43-477896b1fd5f', '5cee6f3e-9a90-4b36-8c11-133ef2c0d22a', '135622ec-275b-46c1-a0d6-9e7233f2d613', false, false, false, false, false) ON CONFLICT DO NOTHING;
INSERT INTO public.role_privileges (id, role_id, screen_id, can_view, can_create, can_edit, can_delete, can_export) VALUES ('083b035b-3f05-4468-b858-879dd3542801', '65853bae-c66f-410f-b14f-0fa76009dbac', '8dcb62b6-4e02-4409-896f-2043b138c3d5', false, false, false, false, false) ON CONFLICT DO NOTHING;
INSERT INTO public.role_privileges (id, role_id, screen_id, can_view, can_create, can_edit, can_delete, can_export) VALUES ('8125b655-e225-4018-8a6a-5c8b45d111eb', '65853bae-c66f-410f-b14f-0fa76009dbac', 'b85487fc-bd1e-4366-9cc3-989192cb2eb4', false, false, false, false, false) ON CONFLICT DO NOTHING;
INSERT INTO public.role_privileges (id, role_id, screen_id, can_view, can_create, can_edit, can_delete, can_export) VALUES ('e48004d3-151a-4fec-aa36-16126ba3fa9a', '65853bae-c66f-410f-b14f-0fa76009dbac', 'b2544a55-5fff-4ccf-818d-a0dedee059e6', false, false, false, false, false) ON CONFLICT DO NOTHING;
INSERT INTO public.role_privileges (id, role_id, screen_id, can_view, can_create, can_edit, can_delete, can_export) VALUES ('1d6dcbe7-e36c-4f60-8be9-ed7fd3ee325a', '65853bae-c66f-410f-b14f-0fa76009dbac', 'efbadbc8-fd9e-4768-b2c7-8f61345010bd', false, false, false, false, false) ON CONFLICT DO NOTHING;
INSERT INTO public.role_privileges (id, role_id, screen_id, can_view, can_create, can_edit, can_delete, can_export) VALUES ('8c5067bf-9947-4d09-89cb-ee3f8586d147', '65853bae-c66f-410f-b14f-0fa76009dbac', 'd8381010-6c20-441a-977c-9241950d13fc', false, false, false, false, false) ON CONFLICT DO NOTHING;
INSERT INTO public.role_privileges (id, role_id, screen_id, can_view, can_create, can_edit, can_delete, can_export) VALUES ('58652cd0-5284-47af-a6c8-693f022b652d', '65853bae-c66f-410f-b14f-0fa76009dbac', '7a4ba429-d68a-4efe-8906-ea3f6e5dc64a', false, false, false, false, false) ON CONFLICT DO NOTHING;
INSERT INTO public.role_privileges (id, role_id, screen_id, can_view, can_create, can_edit, can_delete, can_export) VALUES ('878fc42b-2777-43e8-bf3d-73743742072a', '65853bae-c66f-410f-b14f-0fa76009dbac', '0385e23d-bac9-4953-81ad-5d311fa23c0e', false, false, false, false, false) ON CONFLICT DO NOTHING;
INSERT INTO public.role_privileges (id, role_id, screen_id, can_view, can_create, can_edit, can_delete, can_export) VALUES ('f49a42b5-2a73-42f8-be31-51241d28e8ac', '65853bae-c66f-410f-b14f-0fa76009dbac', 'a13d1a9a-7c44-40ce-9ede-18d6893a72ce', false, false, false, false, false) ON CONFLICT DO NOTHING;
INSERT INTO public.role_privileges (id, role_id, screen_id, can_view, can_create, can_edit, can_delete, can_export) VALUES ('4106197c-0e9e-4dde-9c0b-ccb9639f6497', '65853bae-c66f-410f-b14f-0fa76009dbac', '934be39a-1e26-4d51-a106-9951f9dae56d', false, false, false, false, false) ON CONFLICT DO NOTHING;
INSERT INTO public.role_privileges (id, role_id, screen_id, can_view, can_create, can_edit, can_delete, can_export) VALUES ('149ef012-6182-461b-8265-bf4e954f7ab8', '65853bae-c66f-410f-b14f-0fa76009dbac', '1135164a-3c11-414d-bbe8-aa4c19eb926d', false, false, false, false, false) ON CONFLICT DO NOTHING;
INSERT INTO public.role_privileges (id, role_id, screen_id, can_view, can_create, can_edit, can_delete, can_export) VALUES ('acf9f6b4-9668-4707-b29a-540b4b9b243d', '65853bae-c66f-410f-b14f-0fa76009dbac', '7a99fd79-c4a6-43d0-aed0-5a5e18410fa1', false, false, false, false, false) ON CONFLICT DO NOTHING;
INSERT INTO public.role_privileges (id, role_id, screen_id, can_view, can_create, can_edit, can_delete, can_export) VALUES ('87ea19b1-92af-4833-9d60-ba472a01cb69', '65853bae-c66f-410f-b14f-0fa76009dbac', '22766351-d68b-4cda-bd60-4e67ec6ae922', false, false, false, false, false) ON CONFLICT DO NOTHING;
INSERT INTO public.role_privileges (id, role_id, screen_id, can_view, can_create, can_edit, can_delete, can_export) VALUES ('bab40739-c97f-4aa8-a34c-d3932609f445', '65853bae-c66f-410f-b14f-0fa76009dbac', '930d6b49-a55f-47cf-b477-a78c7263c0eb', false, false, false, false, false) ON CONFLICT DO NOTHING;
INSERT INTO public.role_privileges (id, role_id, screen_id, can_view, can_create, can_edit, can_delete, can_export) VALUES ('d3b87c39-52a2-4458-ae55-cbbe7edf2767', '65853bae-c66f-410f-b14f-0fa76009dbac', '5968ab30-c687-4d59-98bf-405881a201ce', false, false, false, false, false) ON CONFLICT DO NOTHING;
INSERT INTO public.role_privileges (id, role_id, screen_id, can_view, can_create, can_edit, can_delete, can_export) VALUES ('a2609077-457d-4cbb-ab43-477896b1fd5f', '65853bae-c66f-410f-b14f-0fa76009dbac', '135622ec-275b-46c1-a0d6-9e7233f2d613', false, false, false, false, false) ON CONFLICT DO NOTHING;

-- Seed branches
INSERT INTO public.branches (id, name, code, status, vat_reg_no, logo_url) VALUES ('7222fe57-1ba1-40fd-9942-ecd8907faccb', 'HERRICK HEALTHCARE - HIMS', 'HOSP-001', 'Active', NULL, '') ON CONFLICT DO NOTHING;

-- Seed units
INSERT INTO public.units (id, name, code, status) VALUES ('1769694942713', 'DEN1', 'UN009', 'Active') ON CONFLICT DO NOTHING;
INSERT INTO public.units (id, name, code, status) VALUES ('e7b032b4-aed1-4d0e-91cd-2fe733023cf3', 'GM', 'UN002', 'Active') ON CONFLICT DO NOTHING;
INSERT INTO public.units (id, name, code, status) VALUES ('ML', 'Milliliter', 'ML', 'Active') ON CONFLICT DO NOTHING;
INSERT INTO public.units (id, name, code, status) VALUES ('VIAL', 'Vial (single dose)', 'VIAL', 'Active') ON CONFLICT DO NOTHING;
INSERT INTO public.units (id, name, code, status) VALUES ('KIT', 'Kit (multiple vials)', 'KIT', 'Active') ON CONFLICT DO NOTHING;
INSERT INTO public.units (id, name, code, status) VALUES ('STRIP', 'Test Strip', 'STRIP', 'Active') ON CONFLICT DO NOTHING;

-- Seed lims_specimens
INSERT INTO public.lims_specimens (id, name, code, status) VALUES ('4c7e3201-fa8b-4016-aecd-b66ce7405bcb', 'SERUM', 'SC001', 'Active') ON CONFLICT DO NOTHING;
INSERT INTO public.lims_specimens (id, name, code, status) VALUES ('5d0783e0-27ad-4d29-a299-0328e7b3154f', 'EDTA', 'SC002', 'Active') ON CONFLICT DO NOTHING;

-- Seed lims_containers
INSERT INTO public.lims_containers (id, name, code, cap_color, status) VALUES ('a91e911d-47d4-40ce-a12a-9a007c9cd820', 'RED TUBE', 'RD001', '', 'Active') ON CONFLICT DO NOTHING;
INSERT INTO public.lims_containers (id, name, code, cap_color, status) VALUES ('bbc0419c-2ef1-44b8-ba72-2f15850d4468', 'BLACK TUBE', 'RD002', '', 'Active') ON CONFLICT DO NOTHING;

-- Seed departments
INSERT INTO public.departments (id, name, code, status) VALUES ('1769694907292', 'DENTAL', 'DEN001', 'Active') ON CONFLICT DO NOTHING;
INSERT INTO public.departments (id, name, code, status) VALUES ('28dd0060-717f-4250-9c6c-5faffc289158', 'GM', 'GM001', 'Active') ON CONFLICT DO NOTHING;
INSERT INTO public.departments (id, name, code, status) VALUES ('1579db62-f6e6-45e3-b1ee-fe1d6ca29d8c', 'LA001', 'LAB', 'Active') ON CONFLICT DO NOTHING;

-- Seed service_centres
INSERT INTO public.service_centres (id, name, code, status, department_id) VALUES ('1769694923156', 'DENTAL', 'SC001', 'Active', NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.service_centres (id, name, code, status, department_id) VALUES ('6aa4126b-7b5b-4f79-a497-357521094fcf', 'GM', 'SC003', 'Active', '28dd0060-717f-4250-9c6c-5faffc289158') ON CONFLICT DO NOTHING;
INSERT INTO public.service_centres (id, name, code, status, department_id) VALUES ('a6904921-e8eb-4f96-9ef3-b5dd9c1d1d93', 'SC004', 'LAB1', 'Active', '1579db62-f6e6-45e3-b1ee-fe1d6ca29d8c') ON CONFLICT DO NOTHING;

-- Seed finance_organizations
INSERT INTO public.finance_organizations (id, code, name, sponsor_type, payer_id, vat_not_required, contract_created_by, organization_type, account_no, organization_group, receiver_id, gateway_configuration, vat_no, active, is_daman_or_thiqa, max_approval_time, address_details, building_no, city, country, postal_code, state, dist, contacts, insurance_id, branch_id, created_at, approval_required) VALUES ('0ef22acd-1715-47fb-bff0-ec8a0f038530', 'ORG-001', 'BUPA', 'TPA', '', false, 'SMRUTI RANJAN MISHRA', 'With MOU', 'ORG-444363', '', '', '--Select--', '', true, false, 0, '', '1', 'RIYADH', 'Saudi Arabia', '', 'ar-Riyad', 'ar-Riyad', '[{"id":"0f32fc07-d987-419b-addc-ad69b61bd045","idNo":"0546899641","value":"0546899641","idType":"Primary ID","mobile":"0546899641","lastName":"","firstName":"Abduallah Ahmed Albriki cuns","primaryId":true,"middleName":"","contactType":"Mobile","designation":"Executive"}]'::jsonb, '', '', '2026-05-06 17:26:16.248+00', false) ON CONFLICT DO NOTHING;

-- 5. Apply Primary Keys & Unique Constraints
ALTER TABLE public.app_users ADD CONSTRAINT app_users_id_unique UNIQUE (id);
ALTER TABLE public.appointments ADD CONSTRAINT appointments_pkey PRIMARY KEY (id);
ALTER TABLE public.bill_status_history ADD CONSTRAINT bill_status_history_pkey PRIMARY KEY (id);
ALTER TABLE public.bills ADD CONSTRAINT bills_pkey PRIMARY KEY (id);
ALTER TABLE public.branches ADD CONSTRAINT branches_pkey PRIMARY KEY (id);
ALTER TABLE public.credit_memos ADD CONSTRAINT credit_memos_pkey PRIMARY KEY (id);
ALTER TABLE public.credit_memos ADD CONSTRAINT credit_memos_credit_memo_no_key UNIQUE (credit_memo_no);
ALTER TABLE public.departments ADD CONSTRAINT departments_id_unique UNIQUE (id);
ALTER TABLE public.doctor_availability ADD CONSTRAINT doctor_availability_pkey PRIMARY KEY (id);
ALTER TABLE public.doctor_schedules ADD CONSTRAINT doctor_schedules_pkey PRIMARY KEY (id);
ALTER TABLE public.doctor_schedules ADD CONSTRAINT doctor_schedules_doctor_id_day_of_week_start_time_key UNIQUE (doctor_id, day_of_week, start_time);
ALTER TABLE public.employees ADD CONSTRAINT employees_pkey PRIMARY KEY (id);
ALTER TABLE public.finance_chart_of_accounts ADD CONSTRAINT finance_chart_of_accounts_pkey PRIMARY KEY (id);
ALTER TABLE public.finance_chart_of_accounts ADD CONSTRAINT finance_chart_of_accounts_code_key UNIQUE (code);
ALTER TABLE public.finance_journal_voucher_items ADD CONSTRAINT finance_journal_voucher_items_pkey PRIMARY KEY (id);
ALTER TABLE public.finance_journal_vouchers ADD CONSTRAINT finance_journal_vouchers_pkey PRIMARY KEY (id);
ALTER TABLE public.finance_journal_vouchers ADD CONSTRAINT finance_journal_vouchers_voucher_no_key UNIQUE (voucher_no);
ALTER TABLE public.finance_organizations ADD CONSTRAINT finance_organizations_pkey PRIMARY KEY (id);
ALTER TABLE public.finance_organizations ADD CONSTRAINT finance_organizations_code_key UNIQUE (code);
ALTER TABLE public.insurance_policies ADD CONSTRAINT insurance_policies_pkey PRIMARY KEY (id);
ALTER TABLE public.insurance_policies ADD CONSTRAINT insurance_policies_policy_no_key UNIQUE (policy_no);
ALTER TABLE public.inventory_batch_locations ADD CONSTRAINT inventory_batch_locations_pkey PRIMARY KEY (id);
ALTER TABLE public.inventory_batch_locations ADD CONSTRAINT inventory_batch_locations_store_id_item_id_batch_no_zone_id_key UNIQUE (store_id, item_id, batch_no, zone_id, rack_id, shelf_no, bin_no);
ALTER TABLE public.inventory_item_pricing ADD CONSTRAINT inventory_item_pricing_pkey PRIMARY KEY (id);
ALTER TABLE public.inventory_item_pricing ADD CONSTRAINT inventory_item_pricing_item_id_branch_id_key UNIQUE (item_id, branch_id);
ALTER TABLE public.inventory_item_stocks ADD CONSTRAINT inventory_item_stocks_pkey PRIMARY KEY (id);
ALTER TABLE public.inventory_item_stocks ADD CONSTRAINT inventory_item_stocks_item_id_key UNIQUE (item_id);
ALTER TABLE public.inventory_items ADD CONSTRAINT inventory_items_pkey PRIMARY KEY (id);
ALTER TABLE public.inventory_items ADD CONSTRAINT inventory_items_item_code_key UNIQUE (item_code);
ALTER TABLE public.inventory_opening_stock_items ADD CONSTRAINT inventory_opening_stock_items_pkey PRIMARY KEY (id);
ALTER TABLE public.inventory_opening_stocks ADD CONSTRAINT inventory_opening_stocks_pkey PRIMARY KEY (id);
ALTER TABLE public.inventory_stock_ledger ADD CONSTRAINT inventory_stock_ledger_pkey PRIMARY KEY (id);
ALTER TABLE public.item_tax_mappings ADD CONSTRAINT item_tax_mappings_pkey PRIMARY KEY (id);
ALTER TABLE public.item_tax_mappings ADD CONSTRAINT item_tax_mappings_item_id_tax_id_key UNIQUE (item_id, tax_id);
ALTER TABLE public.lab_reagent_consumption_log ADD CONSTRAINT lab_reagent_consumption_log_pkey PRIMARY KEY (id);
ALTER TABLE public.lab_service_import_log ADD CONSTRAINT lab_service_import_log_pkey PRIMARY KEY (id);
ALTER TABLE public.lab_service_profile_components ADD CONSTRAINT lab_service_profile_components_pkey PRIMARY KEY (id);
ALTER TABLE public.lab_service_profile_components ADD CONSTRAINT lab_service_profile_component_profile_service_id_component__key UNIQUE (profile_service_id, component_service_id);
ALTER TABLE public.lab_service_reagents ADD CONSTRAINT lab_service_reagents_pkey PRIMARY KEY (id);
ALTER TABLE public.lab_service_reagents ADD CONSTRAINT lab_service_reagents_service_id_item_id_store_id_key UNIQUE (service_id, item_id, store_id);
ALTER TABLE public.lims_antibiotics ADD CONSTRAINT lims_antibiotics_pkey PRIMARY KEY (id);
ALTER TABLE public.lims_antibiotics ADD CONSTRAINT lims_antibiotics_name_key UNIQUE (name);
ALTER TABLE public.lims_antibiotics ADD CONSTRAINT lims_antibiotics_code_key UNIQUE (code);
ALTER TABLE public.lims_containers ADD CONSTRAINT lims_containers_pkey PRIMARY KEY (id);
ALTER TABLE public.lims_containers ADD CONSTRAINT lims_containers_name_key UNIQUE (name);
ALTER TABLE public.lims_containers ADD CONSTRAINT lims_containers_code_key UNIQUE (code);
ALTER TABLE public.lims_equipment ADD CONSTRAINT lims_equipment_pkey PRIMARY KEY (id);
ALTER TABLE public.lims_equipment ADD CONSTRAINT lims_equipment_name_key UNIQUE (name);
ALTER TABLE public.lims_equipment ADD CONSTRAINT lims_equipment_code_key UNIQUE (code);
ALTER TABLE public.lims_lab_orders ADD CONSTRAINT lims_lab_orders_pkey PRIMARY KEY (id);
ALTER TABLE public.lims_organisms ADD CONSTRAINT lims_organisms_pkey PRIMARY KEY (id);
ALTER TABLE public.lims_organisms ADD CONSTRAINT lims_organisms_name_key UNIQUE (name);
ALTER TABLE public.lims_organisms ADD CONSTRAINT lims_organisms_code_key UNIQUE (code);
ALTER TABLE public.lims_outsource_labs ADD CONSTRAINT lims_outsource_labs_pkey PRIMARY KEY (id);
ALTER TABLE public.lims_outsource_labs ADD CONSTRAINT lims_outsource_labs_code_key UNIQUE (code);
ALTER TABLE public.lims_parameter_options ADD CONSTRAINT lims_parameter_options_pkey PRIMARY KEY (id);
ALTER TABLE public.lims_parameter_options ADD CONSTRAINT lims_parameter_options_parameter_id_option_value_key UNIQUE (parameter_id, option_value);
ALTER TABLE public.lims_reference_ranges ADD CONSTRAINT lims_reference_ranges_pkey PRIMARY KEY (id);
ALTER TABLE public.lims_reference_remarks ADD CONSTRAINT lims_reference_remarks_pkey PRIMARY KEY (id);
ALTER TABLE public.lims_results ADD CONSTRAINT lims_results_pkey PRIMARY KEY (id);
ALTER TABLE public.lims_samples ADD CONSTRAINT lims_samples_pkey PRIMARY KEY (id);
ALTER TABLE public.lims_samples ADD CONSTRAINT lims_samples_sample_no_key UNIQUE (sample_no);
ALTER TABLE public.lims_service_configs ADD CONSTRAINT lims_service_configs_pkey PRIMARY KEY (service_id);
ALTER TABLE public.lims_service_parameters ADD CONSTRAINT lims_service_parameters_pkey PRIMARY KEY (id);
ALTER TABLE public.lims_service_parameters ADD CONSTRAINT lims_service_parameters_service_id_code_key UNIQUE (service_id, code);
ALTER TABLE public.lims_specimens ADD CONSTRAINT lims_specimens_pkey PRIMARY KEY (id);
ALTER TABLE public.lims_specimens ADD CONSTRAINT lims_specimens_name_key UNIQUE (name);
ALTER TABLE public.lims_specimens ADD CONSTRAINT lims_specimens_code_key UNIQUE (code);
ALTER TABLE public.lims_stains ADD CONSTRAINT lims_stains_pkey PRIMARY KEY (id);
ALTER TABLE public.lims_stains ADD CONSTRAINT lims_stains_name_key UNIQUE (name);
ALTER TABLE public.lims_stains ADD CONSTRAINT lims_stains_code_key UNIQUE (code);
ALTER TABLE public.lims_test_results ADD CONSTRAINT lims_test_results_pkey PRIMARY KEY (id);
ALTER TABLE public.loyalty_accounts ADD CONSTRAINT loyalty_accounts_pkey PRIMARY KEY (id);
ALTER TABLE public.loyalty_accounts ADD CONSTRAINT loyalty_accounts_account_no_key UNIQUE (account_no);
ALTER TABLE public.loyalty_accounts ADD CONSTRAINT loyalty_accounts_mobile_key UNIQUE (mobile);
ALTER TABLE public.loyalty_bonus_rules ADD CONSTRAINT loyalty_bonus_rules_pkey PRIMARY KEY (id);
ALTER TABLE public.loyalty_program_config ADD CONSTRAINT loyalty_program_config_pkey PRIMARY KEY (id);
ALTER TABLE public.loyalty_redemption_rules ADD CONSTRAINT loyalty_redemption_rules_pkey PRIMARY KEY (id);
ALTER TABLE public.loyalty_sms_log ADD CONSTRAINT loyalty_sms_log_pkey PRIMARY KEY (id);
ALTER TABLE public.loyalty_tier_history ADD CONSTRAINT loyalty_tier_history_pkey PRIMARY KEY (id);
ALTER TABLE public.loyalty_tiers ADD CONSTRAINT loyalty_tiers_pkey PRIMARY KEY (id);
ALTER TABLE public.loyalty_tiers ADD CONSTRAINT loyalty_tiers_tier_name_key UNIQUE (tier_name);
ALTER TABLE public.loyalty_transactions ADD CONSTRAINT loyalty_transactions_pkey PRIMARY KEY (id);
ALTER TABLE public.master_diagnoses ADD CONSTRAINT master_diagnoses_pkey PRIMARY KEY (id);
ALTER TABLE public.patient_demographics ADD CONSTRAINT patient_demographics_pkey PRIMARY KEY (id);
ALTER TABLE public.patient_demographics ADD CONSTRAINT patient_demographics_abha_number_key UNIQUE (abha_number);
ALTER TABLE public.patient_documents ADD CONSTRAINT patient_documents_pkey PRIMARY KEY (id);
ALTER TABLE public.patient_refunds ADD CONSTRAINT patient_refunds_pkey PRIMARY KEY (id);
ALTER TABLE public.patient_refunds ADD CONSTRAINT patient_refunds_refund_no_key UNIQUE (refund_no);
ALTER TABLE public.patients ADD CONSTRAINT patients_pkey PRIMARY KEY (id);
ALTER TABLE public.payments ADD CONSTRAINT payments_pkey PRIMARY KEY (id);
ALTER TABLE public.pharmacy_direct_sale_items ADD CONSTRAINT pharmacy_direct_sale_items_pkey PRIMARY KEY (id);
ALTER TABLE public.pharmacy_direct_sales ADD CONSTRAINT pharmacy_direct_sales_pkey PRIMARY KEY (id);
ALTER TABLE public.pharmacy_direct_sales ADD CONSTRAINT pharmacy_direct_sales_sale_no_key UNIQUE (sale_no);
ALTER TABLE public.pharmacy_drug_generics ADD CONSTRAINT pharmacy_drug_generics_pkey PRIMARY KEY (id);
ALTER TABLE public.pharmacy_drug_generics ADD CONSTRAINT pharmacy_drug_generics_generic_code_key UNIQUE (generic_code);
ALTER TABLE public.pharmacy_drug_master ADD CONSTRAINT pharmacy_drug_master_pkey PRIMARY KEY (id);
ALTER TABLE public.pharmacy_racks ADD CONSTRAINT pharmacy_racks_pkey PRIMARY KEY (id);
ALTER TABLE public.pharmacy_racks ADD CONSTRAINT pharmacy_racks_zone_id_rack_code_key UNIQUE (zone_id, rack_code);
ALTER TABLE public.pharmacy_return_items ADD CONSTRAINT pharmacy_return_items_pkey PRIMARY KEY (id);
ALTER TABLE public.pharmacy_returns ADD CONSTRAINT pharmacy_returns_pkey PRIMARY KEY (id);
ALTER TABLE public.pharmacy_returns ADD CONSTRAINT pharmacy_returns_return_no_key UNIQUE (return_no);
ALTER TABLE public.pharmacy_zones ADD CONSTRAINT pharmacy_zones_pkey PRIMARY KEY (id);
ALTER TABLE public.pharmacy_zones ADD CONSTRAINT pharmacy_zones_store_id_zone_code_key UNIQUE (store_id, zone_code);
ALTER TABLE public.policy_mapped_branches ADD CONSTRAINT policy_mapped_branches_pkey PRIMARY KEY (id);
ALTER TABLE public.policy_mapped_branches ADD CONSTRAINT policy_mapped_branches_policy_id_branch_code_key UNIQUE (policy_id, branch_code);
ALTER TABLE public.policy_patient_max_amounts ADD CONSTRAINT policy_patient_max_amounts_pkey PRIMARY KEY (id);
ALTER TABLE public.policy_rules ADD CONSTRAINT policy_rules_pkey PRIMARY KEY (id);
ALTER TABLE public.prescription_items ADD CONSTRAINT prescription_items_pkey PRIMARY KEY (id);
ALTER TABLE public.prescriptions ADD CONSTRAINT prescriptions_pkey PRIMARY KEY (id);
ALTER TABLE public.procurement_expiry_return_items ADD CONSTRAINT procurement_expiry_return_items_pkey PRIMARY KEY (id);
ALTER TABLE public.procurement_expiry_returns ADD CONSTRAINT procurement_expiry_returns_pkey PRIMARY KEY (id);
ALTER TABLE public.procurement_expiry_returns ADD CONSTRAINT procurement_expiry_returns_doc_no_key UNIQUE (doc_no);
ALTER TABLE public.procurement_grn_items ADD CONSTRAINT procurement_grn_items_pkey PRIMARY KEY (id);
ALTER TABLE public.procurement_grns ADD CONSTRAINT procurement_grns_pkey PRIMARY KEY (id);
ALTER TABLE public.procurement_grns ADD CONSTRAINT procurement_grns_grn_no_key UNIQUE (grn_no);
ALTER TABLE public.procurement_gstr2b_invoices ADD CONSTRAINT procurement_gstr2b_invoices_pkey PRIMARY KEY (id);
ALTER TABLE public.procurement_gstr2b_uploads ADD CONSTRAINT procurement_gstr2b_uploads_pkey PRIMARY KEY (id);
ALTER TABLE public.procurement_purchase_order_items ADD CONSTRAINT procurement_purchase_order_items_pkey PRIMARY KEY (id);
ALTER TABLE public.procurement_purchase_orders ADD CONSTRAINT procurement_purchase_orders_pkey PRIMARY KEY (id);
ALTER TABLE public.procurement_purchase_orders ADD CONSTRAINT procurement_purchase_orders_po_no_key UNIQUE (po_no);
ALTER TABLE public.procurement_purchase_receipt_items ADD CONSTRAINT procurement_purchase_receipt_items_pkey PRIMARY KEY (id);
ALTER TABLE public.procurement_purchase_receipts ADD CONSTRAINT procurement_purchase_receipts_pkey PRIMARY KEY (id);
ALTER TABLE public.procurement_purchase_receipts ADD CONSTRAINT procurement_purchase_receipts_receipt_no_key UNIQUE (receipt_no);
ALTER TABLE public.procurement_purchase_return_items ADD CONSTRAINT procurement_purchase_return_items_pkey PRIMARY KEY (id);
ALTER TABLE public.procurement_purchase_returns ADD CONSTRAINT procurement_purchase_returns_pkey PRIMARY KEY (id);
ALTER TABLE public.procurement_purchase_returns ADD CONSTRAINT procurement_purchase_returns_return_no_key UNIQUE (return_no);
ALTER TABLE public.procurement_vendor_terms ADD CONSTRAINT procurement_vendor_terms_pkey PRIMARY KEY (id);
ALTER TABLE public.procurement_vendors ADD CONSTRAINT procurement_vendors_pkey PRIMARY KEY (id);
ALTER TABLE public.procurement_vendors ADD CONSTRAINT procurement_vendors_code_key UNIQUE (code);
ALTER TABLE public.role_privileges ADD CONSTRAINT role_privileges_pkey PRIMARY KEY (id);
ALTER TABLE public.role_privileges ADD CONSTRAINT role_privileges_role_id_screen_id_key UNIQUE (role_id, screen_id);
ALTER TABLE public.roles ADD CONSTRAINT roles_pkey PRIMARY KEY (id);
ALTER TABLE public.roles ADD CONSTRAINT roles_role_code_key UNIQUE (role_code);
ALTER TABLE public.schedule_templates ADD CONSTRAINT schedule_templates_pkey PRIMARY KEY (id);
ALTER TABLE public.screens ADD CONSTRAINT screens_pkey PRIMARY KEY (id);
ALTER TABLE public.screens ADD CONSTRAINT screens_screen_code_key UNIQUE (screen_code);
ALTER TABLE public.service_approvals ADD CONSTRAINT service_approvals_pkey PRIMARY KEY (id);
ALTER TABLE public.service_centres ADD CONSTRAINT service_centres_pkey PRIMARY KEY (id);
ALTER TABLE public.service_definitions ADD CONSTRAINT service_definitions_pkey PRIMARY KEY (id);
ALTER TABLE public.service_location_mappings ADD CONSTRAINT service_location_mappings_pkey PRIMARY KEY (id);
ALTER TABLE public.service_location_mappings ADD CONSTRAINT service_location_mappings_service_id_branch_id_service_cent_key UNIQUE (service_id, branch_id, service_centre_id);
ALTER TABLE public.service_orders ADD CONSTRAINT service_orders_pkey PRIMARY KEY (id);
ALTER TABLE public.service_tariffs ADD CONSTRAINT service_tariffs_pkey PRIMARY KEY (id);
ALTER TABLE public.sponsor_tariffs ADD CONSTRAINT sponsor_tariffs_pkey PRIMARY KEY (id);
ALTER TABLE public.stock_transfer_items ADD CONSTRAINT stock_transfer_items_pkey PRIMARY KEY (id);
ALTER TABLE public.stock_transfers ADD CONSTRAINT stock_transfers_pkey PRIMARY KEY (id);
ALTER TABLE public.stock_transfers ADD CONSTRAINT stock_transfers_transfer_no_key UNIQUE (transfer_no);
ALTER TABLE public.store_item_mappings ADD CONSTRAINT store_item_mappings_pkey PRIMARY KEY (id);
ALTER TABLE public.store_item_mappings ADD CONSTRAINT store_item_mappings_store_id_item_id_key UNIQUE (store_id, item_id);
ALTER TABLE public.stores ADD CONSTRAINT stores_pkey PRIMARY KEY (id);
ALTER TABLE public.stores ADD CONSTRAINT stores_store_code_key UNIQUE (store_code);
ALTER TABLE public.tax_masters ADD CONSTRAINT tax_masters_pkey PRIMARY KEY (id);
ALTER TABLE public.temp_unresolved_lab_orders ADD CONSTRAINT temp_unresolved_lab_orders_pkey PRIMARY KEY (lab_order_id);
ALTER TABLE public.units ADD CONSTRAINT units_pkey PRIMARY KEY (id);
ALTER TABLE public.user_privilege_overrides ADD CONSTRAINT user_privilege_overrides_pkey PRIMARY KEY (id);
ALTER TABLE public.user_privilege_overrides ADD CONSTRAINT user_privilege_overrides_user_id_screen_id_key UNIQUE (user_id, screen_id);
ALTER TABLE public.vital_sign_groups ADD CONSTRAINT vital_sign_groups_pkey PRIMARY KEY (id);
ALTER TABLE public.vital_sign_parameters ADD CONSTRAINT vital_sign_parameters_pkey PRIMARY KEY (id);

-- 6. Apply Foreign Key Constraints
ALTER TABLE public.app_users ADD CONSTRAINT fk_app_users_employee FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE SET NULL;
ALTER TABLE public.app_users ADD CONSTRAINT app_users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);
ALTER TABLE public.app_users ADD CONSTRAINT app_users_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.service_centres(id);
ALTER TABLE public.app_users ADD CONSTRAINT app_users_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);
ALTER TABLE public.appointments ADD CONSTRAINT appointments_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.employees(id) ON DELETE SET NULL;
ALTER TABLE public.bill_status_history ADD CONSTRAINT bill_status_history_bill_id_fkey FOREIGN KEY (bill_id) REFERENCES public.bills(id) ON DELETE CASCADE;
ALTER TABLE public.bills ADD CONSTRAINT bills_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;
ALTER TABLE public.bills ADD CONSTRAINT bills_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.employees(id);
ALTER TABLE public.bills ADD CONSTRAINT bills_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;
ALTER TABLE public.bills ADD CONSTRAINT bills_sponsor_id_fkey FOREIGN KEY (sponsor_id) REFERENCES public.finance_organizations(id) ON DELETE SET NULL;
ALTER TABLE public.bills ADD CONSTRAINT bills_refund_id_fkey FOREIGN KEY (refund_id) REFERENCES public.patient_refunds(id) ON DELETE SET NULL;
ALTER TABLE public.clinical_allergies ADD CONSTRAINT clinical_allergies_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;
ALTER TABLE public.credit_memos ADD CONSTRAINT credit_memos_bill_id_fkey FOREIGN KEY (bill_id) REFERENCES public.bills(id) ON DELETE RESTRICT;
ALTER TABLE public.credit_memos ADD CONSTRAINT fk_credit_memos_refund_id FOREIGN KEY (refund_id) REFERENCES public.patient_refunds(id) ON DELETE SET NULL;
ALTER TABLE public.doctor_availability ADD CONSTRAINT doctor_availability_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.employees(id) ON DELETE CASCADE;
ALTER TABLE public.doctor_schedules ADD CONSTRAINT doctor_schedules_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.employees(id) ON DELETE CASCADE;
ALTER TABLE public.finance_chart_of_accounts ADD CONSTRAINT finance_chart_of_accounts_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.finance_chart_of_accounts(id) ON DELETE SET NULL;
ALTER TABLE public.finance_journal_voucher_items ADD CONSTRAINT finance_journal_voucher_items_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.finance_chart_of_accounts(id) ON DELETE RESTRICT;
ALTER TABLE public.finance_journal_voucher_items ADD CONSTRAINT finance_journal_voucher_items_voucher_id_fkey FOREIGN KEY (voucher_id) REFERENCES public.finance_journal_vouchers(id) ON DELETE CASCADE;
ALTER TABLE public.insurance_policies ADD CONSTRAINT insurance_policies_insurance_id_fkey FOREIGN KEY (insurance_id) REFERENCES public.finance_organizations(id) ON DELETE SET NULL;
ALTER TABLE public.insurance_policies ADD CONSTRAINT insurance_policies_sponsor_id_fkey FOREIGN KEY (sponsor_id) REFERENCES public.finance_organizations(id) ON DELETE SET NULL;
ALTER TABLE public.inventory_batch_locations ADD CONSTRAINT inventory_batch_locations_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;
ALTER TABLE public.inventory_batch_locations ADD CONSTRAINT inventory_batch_locations_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.inventory_items(id) ON DELETE CASCADE;
ALTER TABLE public.inventory_batch_locations ADD CONSTRAINT inventory_batch_locations_zone_id_fkey FOREIGN KEY (zone_id) REFERENCES public.pharmacy_zones(id);
ALTER TABLE public.inventory_batch_locations ADD CONSTRAINT inventory_batch_locations_rack_id_fkey FOREIGN KEY (rack_id) REFERENCES public.pharmacy_racks(id);
ALTER TABLE public.inventory_item_pricing ADD CONSTRAINT inventory_item_pricing_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.inventory_items(id) ON DELETE CASCADE;
ALTER TABLE public.inventory_item_stocks ADD CONSTRAINT inventory_item_stocks_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.inventory_items(id) ON DELETE CASCADE;
ALTER TABLE public.inventory_opening_stock_items ADD CONSTRAINT inventory_opening_stock_items_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.inventory_items(id) ON DELETE CASCADE;
ALTER TABLE public.inventory_opening_stock_items ADD CONSTRAINT inventory_opening_stock_items_opening_stock_id_fkey FOREIGN KEY (opening_stock_id) REFERENCES public.inventory_opening_stocks(id) ON DELETE CASCADE;
ALTER TABLE public.inventory_opening_stocks ADD CONSTRAINT inventory_opening_stocks_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;
ALTER TABLE public.inventory_stock_ledger ADD CONSTRAINT inventory_stock_ledger_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.inventory_items(id) ON DELETE CASCADE;
ALTER TABLE public.inventory_stock_ledger ADD CONSTRAINT inventory_stock_ledger_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;
ALTER TABLE public.item_tax_mappings ADD CONSTRAINT item_tax_mappings_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.inventory_items(id) ON DELETE CASCADE;
ALTER TABLE public.item_tax_mappings ADD CONSTRAINT item_tax_mappings_tax_id_fkey FOREIGN KEY (tax_id) REFERENCES public.tax_masters(id) ON DELETE CASCADE;
ALTER TABLE public.lab_reagent_consumption_log ADD CONSTRAINT lab_reagent_consumption_log_lab_order_id_fkey FOREIGN KEY (lab_order_id) REFERENCES public.lims_lab_orders(id) ON DELETE CASCADE;
ALTER TABLE public.lab_reagent_consumption_log ADD CONSTRAINT lab_reagent_consumption_log_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.service_definitions(id);
ALTER TABLE public.lab_reagent_consumption_log ADD CONSTRAINT lab_reagent_consumption_log_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.inventory_items(id);
ALTER TABLE public.lab_reagent_consumption_log ADD CONSTRAINT lab_reagent_consumption_log_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id);
ALTER TABLE public.lab_reagent_consumption_log ADD CONSTRAINT lab_reagent_consumption_log_reversed_by_log_id_fkey FOREIGN KEY (reversed_by_log_id) REFERENCES public.lab_reagent_consumption_log(id);
ALTER TABLE public.lab_reagent_consumption_log ADD CONSTRAINT lab_reagent_consumption_log_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES public.app_users(id);
ALTER TABLE public.lab_service_import_log ADD CONSTRAINT lab_service_import_log_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES public.app_users(id);
ALTER TABLE public.lab_service_profile_components ADD CONSTRAINT lab_service_profile_components_profile_service_id_fkey FOREIGN KEY (profile_service_id) REFERENCES public.service_definitions(id) ON DELETE CASCADE;
ALTER TABLE public.lab_service_profile_components ADD CONSTRAINT lab_service_profile_components_component_service_id_fkey FOREIGN KEY (component_service_id) REFERENCES public.service_definitions(id) ON DELETE RESTRICT;
ALTER TABLE public.lab_service_reagents ADD CONSTRAINT lab_service_reagents_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.service_definitions(id) ON DELETE CASCADE;
ALTER TABLE public.lab_service_reagents ADD CONSTRAINT lab_service_reagents_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.inventory_items(id) ON DELETE RESTRICT;
ALTER TABLE public.lab_service_reagents ADD CONSTRAINT lab_service_reagents_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE RESTRICT;
ALTER TABLE public.lab_service_reagents ADD CONSTRAINT lab_service_reagents_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.units(id);
ALTER TABLE public.lims_lab_orders ADD CONSTRAINT lims_lab_orders_service_order_id_fkey FOREIGN KEY (service_order_id) REFERENCES public.service_orders(id) ON DELETE CASCADE;
ALTER TABLE public.lims_lab_orders ADD CONSTRAINT lims_lab_orders_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.service_definitions(id);
ALTER TABLE public.lims_lab_orders ADD CONSTRAINT lims_lab_orders_source_profile_service_id_fkey FOREIGN KEY (source_profile_service_id) REFERENCES public.service_definitions(id);
ALTER TABLE public.lims_parameter_options ADD CONSTRAINT lims_parameter_options_parameter_id_fkey FOREIGN KEY (parameter_id) REFERENCES public.lims_service_parameters(id) ON DELETE CASCADE;
ALTER TABLE public.lims_reference_ranges ADD CONSTRAINT lims_reference_ranges_parameter_id_fkey FOREIGN KEY (parameter_id) REFERENCES public.lims_service_parameters(id) ON DELETE CASCADE;
ALTER TABLE public.lims_reference_ranges ADD CONSTRAINT lims_reference_ranges_equipment_id_fkey FOREIGN KEY (equipment_id) REFERENCES public.lims_equipment(id);
ALTER TABLE public.lims_reference_remarks ADD CONSTRAINT lims_reference_remarks_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.service_definitions(id) ON DELETE CASCADE;
ALTER TABLE public.lims_reference_remarks ADD CONSTRAINT lims_reference_remarks_equipment_id_fkey FOREIGN KEY (equipment_id) REFERENCES public.lims_equipment(id) ON DELETE SET NULL;
ALTER TABLE public.lims_reference_remarks ADD CONSTRAINT lims_reference_remarks_parameter_id_fkey FOREIGN KEY (parameter_id) REFERENCES public.lims_service_parameters(id) ON DELETE SET NULL;
ALTER TABLE public.lims_results ADD CONSTRAINT lims_results_lab_order_id_fkey FOREIGN KEY (lab_order_id) REFERENCES public.lims_lab_orders(id) ON DELETE CASCADE;
ALTER TABLE public.lims_results ADD CONSTRAINT lims_results_parameter_id_fkey FOREIGN KEY (parameter_id) REFERENCES public.lims_service_parameters(id) ON DELETE CASCADE;
ALTER TABLE public.lims_results ADD CONSTRAINT lims_results_equipment_id_fkey FOREIGN KEY (equipment_id) REFERENCES public.lims_equipment(id);
ALTER TABLE public.lims_samples ADD CONSTRAINT lims_samples_lab_order_id_fkey FOREIGN KEY (lab_order_id) REFERENCES public.lims_lab_orders(id) ON DELETE CASCADE;
ALTER TABLE public.lims_samples ADD CONSTRAINT lims_samples_specimen_id_fkey FOREIGN KEY (specimen_id) REFERENCES public.lims_specimens(id);
ALTER TABLE public.lims_samples ADD CONSTRAINT lims_samples_container_id_fkey FOREIGN KEY (container_id) REFERENCES public.lims_containers(id);
ALTER TABLE public.lims_samples ADD CONSTRAINT lims_samples_sent_by_fkey FOREIGN KEY (sent_by) REFERENCES public.employees(id);
ALTER TABLE public.lims_samples ADD CONSTRAINT lims_samples_received_by_fkey FOREIGN KEY (received_by) REFERENCES public.employees(id);
ALTER TABLE public.lims_service_configs ADD CONSTRAINT lims_service_configs_specimen_id_fkey FOREIGN KEY (specimen_id) REFERENCES public.lims_specimens(id) ON DELETE SET NULL;
ALTER TABLE public.lims_service_configs ADD CONSTRAINT lims_service_configs_container_id_fkey FOREIGN KEY (container_id) REFERENCES public.lims_containers(id) ON DELETE SET NULL;
ALTER TABLE public.lims_service_configs ADD CONSTRAINT lims_service_configs_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.service_definitions(id) ON DELETE CASCADE;
ALTER TABLE public.lims_service_parameters ADD CONSTRAINT lims_service_parameters_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.service_definitions(id) ON DELETE CASCADE;
ALTER TABLE public.lims_service_parameters ADD CONSTRAINT lims_service_parameters_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.lims_service_parameters(id) ON DELETE SET NULL;
ALTER TABLE public.lims_test_results ADD CONSTRAINT lims_test_results_lab_order_id_fkey FOREIGN KEY (lab_order_id) REFERENCES public.lims_lab_orders(id) ON DELETE CASCADE;
ALTER TABLE public.lims_test_results ADD CONSTRAINT lims_test_results_parameter_id_fkey FOREIGN KEY (parameter_id) REFERENCES public.lims_service_parameters(id) ON DELETE CASCADE;
ALTER TABLE public.lims_test_results ADD CONSTRAINT lims_test_results_equipment_id_fkey FOREIGN KEY (equipment_id) REFERENCES public.lims_equipment(id);
ALTER TABLE public.lims_test_results ADD CONSTRAINT lims_test_results_result_by_fkey FOREIGN KEY (result_by) REFERENCES public.employees(id);
ALTER TABLE public.loyalty_accounts ADD CONSTRAINT loyalty_accounts_current_tier_fkey FOREIGN KEY (current_tier) REFERENCES public.loyalty_tiers(tier_name);
ALTER TABLE public.loyalty_sms_log ADD CONSTRAINT loyalty_sms_log_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.loyalty_accounts(id);
ALTER TABLE public.loyalty_tier_history ADD CONSTRAINT loyalty_tier_history_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.loyalty_accounts(id);
ALTER TABLE public.loyalty_transactions ADD CONSTRAINT loyalty_transactions_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.loyalty_accounts(id) ON DELETE CASCADE;
ALTER TABLE public.patient_refunds ADD CONSTRAINT patient_refunds_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;
ALTER TABLE public.pharmacy_direct_sale_items ADD CONSTRAINT pharmacy_direct_sale_items_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.inventory_items(id) ON DELETE RESTRICT;
ALTER TABLE public.pharmacy_direct_sale_items ADD CONSTRAINT pharmacy_direct_sale_items_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.pharmacy_direct_sales(id) ON DELETE CASCADE;
ALTER TABLE public.pharmacy_direct_sales ADD CONSTRAINT pharmacy_direct_sales_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE RESTRICT;
ALTER TABLE public.pharmacy_drug_master ADD CONSTRAINT pharmacy_drug_master_generic_id_fkey FOREIGN KEY (generic_id) REFERENCES public.pharmacy_drug_generics(id) ON DELETE SET NULL;
ALTER TABLE public.pharmacy_drug_master ADD CONSTRAINT pharmacy_drug_master_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.inventory_items(id) ON DELETE CASCADE;
ALTER TABLE public.pharmacy_racks ADD CONSTRAINT pharmacy_racks_zone_id_fkey FOREIGN KEY (zone_id) REFERENCES public.pharmacy_zones(id) ON DELETE CASCADE;
ALTER TABLE public.pharmacy_return_items ADD CONSTRAINT pharmacy_return_items_return_id_fkey FOREIGN KEY (return_id) REFERENCES public.pharmacy_returns(id) ON DELETE CASCADE;
ALTER TABLE public.pharmacy_returns ADD CONSTRAINT pharmacy_returns_refund_id_fkey FOREIGN KEY (refund_id) REFERENCES public.patient_refunds(id) ON DELETE SET NULL;
ALTER TABLE public.pharmacy_zones ADD CONSTRAINT pharmacy_zones_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;
ALTER TABLE public.policy_mapped_branches ADD CONSTRAINT policy_mapped_branches_policy_id_fkey FOREIGN KEY (policy_id) REFERENCES public.insurance_policies(id) ON DELETE CASCADE;
ALTER TABLE public.policy_patient_max_amounts ADD CONSTRAINT policy_patient_max_amounts_policy_id_fkey FOREIGN KEY (policy_id) REFERENCES public.insurance_policies(id) ON DELETE CASCADE;
ALTER TABLE public.policy_rules ADD CONSTRAINT policy_rules_policy_id_fkey FOREIGN KEY (policy_id) REFERENCES public.insurance_policies(id) ON DELETE CASCADE;
ALTER TABLE public.prescription_items ADD CONSTRAINT prescription_items_prescription_id_fkey FOREIGN KEY (prescription_id) REFERENCES public.prescriptions(id) ON DELETE CASCADE;
ALTER TABLE public.procurement_expiry_return_items ADD CONSTRAINT procurement_expiry_return_items_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.inventory_items(id) ON DELETE RESTRICT;
ALTER TABLE public.procurement_expiry_return_items ADD CONSTRAINT procurement_expiry_return_items_return_id_fkey FOREIGN KEY (return_id) REFERENCES public.procurement_expiry_returns(id) ON DELETE CASCADE;
ALTER TABLE public.procurement_expiry_returns ADD CONSTRAINT procurement_expiry_returns_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE RESTRICT;
ALTER TABLE public.procurement_expiry_returns ADD CONSTRAINT procurement_expiry_returns_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.procurement_vendors(id) ON DELETE RESTRICT;
ALTER TABLE public.procurement_grn_items ADD CONSTRAINT procurement_grn_items_grn_id_fkey FOREIGN KEY (grn_id) REFERENCES public.procurement_grns(id) ON DELETE CASCADE;
ALTER TABLE public.procurement_grn_items ADD CONSTRAINT procurement_grn_items_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.inventory_items(id) ON DELETE RESTRICT;
ALTER TABLE public.procurement_grns ADD CONSTRAINT procurement_grns_po_id_fkey FOREIGN KEY (po_id) REFERENCES public.procurement_purchase_orders(id) ON DELETE SET NULL;
ALTER TABLE public.procurement_grns ADD CONSTRAINT procurement_grns_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE RESTRICT;
ALTER TABLE public.procurement_grns ADD CONSTRAINT procurement_grns_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.procurement_vendors(id) ON DELETE RESTRICT;
ALTER TABLE public.procurement_gstr2b_invoices ADD CONSTRAINT procurement_gstr2b_invoices_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES public.procurement_gstr2b_uploads(id) ON DELETE CASCADE;
ALTER TABLE public.procurement_purchase_order_items ADD CONSTRAINT procurement_purchase_order_items_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.inventory_items(id) ON DELETE RESTRICT;
ALTER TABLE public.procurement_purchase_order_items ADD CONSTRAINT procurement_purchase_order_items_po_id_fkey FOREIGN KEY (po_id) REFERENCES public.procurement_purchase_orders(id) ON DELETE CASCADE;
ALTER TABLE public.procurement_purchase_orders ADD CONSTRAINT procurement_purchase_orders_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE RESTRICT;
ALTER TABLE public.procurement_purchase_orders ADD CONSTRAINT procurement_purchase_orders_tax_code_fkey FOREIGN KEY (tax_code) REFERENCES public.tax_masters(id) ON DELETE SET NULL;
ALTER TABLE public.procurement_purchase_orders ADD CONSTRAINT procurement_purchase_orders_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.procurement_vendors(id) ON DELETE RESTRICT;
ALTER TABLE public.procurement_purchase_receipt_items ADD CONSTRAINT procurement_purchase_receipt_items_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.inventory_items(id) ON DELETE RESTRICT;
ALTER TABLE public.procurement_purchase_receipt_items ADD CONSTRAINT procurement_purchase_receipt_items_receipt_id_fkey FOREIGN KEY (receipt_id) REFERENCES public.procurement_purchase_receipts(id) ON DELETE CASCADE;
ALTER TABLE public.procurement_purchase_receipts ADD CONSTRAINT procurement_purchase_receipts_grn_id_fkey FOREIGN KEY (grn_id) REFERENCES public.procurement_grns(id) ON DELETE SET NULL;
ALTER TABLE public.procurement_purchase_receipts ADD CONSTRAINT procurement_purchase_receipts_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE RESTRICT;
ALTER TABLE public.procurement_purchase_receipts ADD CONSTRAINT procurement_purchase_receipts_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.procurement_vendors(id) ON DELETE RESTRICT;
ALTER TABLE public.procurement_purchase_return_items ADD CONSTRAINT procurement_purchase_return_items_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.inventory_items(id) ON DELETE RESTRICT;
ALTER TABLE public.procurement_purchase_return_items ADD CONSTRAINT procurement_purchase_return_items_return_id_fkey FOREIGN KEY (return_id) REFERENCES public.procurement_purchase_returns(id) ON DELETE CASCADE;
ALTER TABLE public.procurement_purchase_returns ADD CONSTRAINT procurement_purchase_returns_source_grn_id_fkey FOREIGN KEY (source_grn_id) REFERENCES public.procurement_grns(id) ON DELETE SET NULL;
ALTER TABLE public.procurement_purchase_returns ADD CONSTRAINT procurement_purchase_returns_source_prn_id_fkey FOREIGN KEY (source_prn_id) REFERENCES public.procurement_purchase_receipts(id) ON DELETE SET NULL;
ALTER TABLE public.procurement_purchase_returns ADD CONSTRAINT procurement_purchase_returns_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE RESTRICT;
ALTER TABLE public.procurement_purchase_returns ADD CONSTRAINT procurement_purchase_returns_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.procurement_vendors(id) ON DELETE RESTRICT;
ALTER TABLE public.procurement_vendor_terms ADD CONSTRAINT procurement_vendor_terms_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.procurement_vendors(id) ON DELETE CASCADE;
ALTER TABLE public.role_privileges ADD CONSTRAINT role_privileges_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;
ALTER TABLE public.role_privileges ADD CONSTRAINT role_privileges_screen_id_fkey FOREIGN KEY (screen_id) REFERENCES public.screens(id) ON DELETE CASCADE;
ALTER TABLE public.schedule_templates ADD CONSTRAINT schedule_templates_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.employees(id) ON DELETE CASCADE;
ALTER TABLE public.service_approvals ADD CONSTRAINT service_approvals_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.service_orders(id) ON DELETE CASCADE;
ALTER TABLE public.service_approvals ADD CONSTRAINT service_approvals_sponsor_id_fkey FOREIGN KEY (sponsor_id) REFERENCES public.finance_organizations(id) ON DELETE SET NULL;
ALTER TABLE public.service_location_mappings ADD CONSTRAINT service_location_mappings_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.service_definitions(id) ON DELETE CASCADE;
ALTER TABLE public.service_location_mappings ADD CONSTRAINT service_location_mappings_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;
ALTER TABLE public.service_location_mappings ADD CONSTRAINT service_location_mappings_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL;
ALTER TABLE public.service_location_mappings ADD CONSTRAINT service_location_mappings_service_centre_id_fkey FOREIGN KEY (service_centre_id) REFERENCES public.service_centres(id) ON DELETE CASCADE;
ALTER TABLE public.service_orders ADD CONSTRAINT service_orders_ordering_doctor_id_fkey FOREIGN KEY (ordering_doctor_id) REFERENCES public.employees(id) ON DELETE SET NULL;
ALTER TABLE public.service_orders ADD CONSTRAINT service_orders_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.service_definitions(id) ON DELETE SET NULL;
ALTER TABLE public.service_orders ADD CONSTRAINT fk_service_orders_appointment FOREIGN KEY (appointment_id) REFERENCES public.appointments(id);
ALTER TABLE public.service_tariffs ADD CONSTRAINT service_tariffs_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.service_definitions(id) ON DELETE CASCADE;
ALTER TABLE public.sponsor_tariffs ADD CONSTRAINT sponsor_tariffs_sponsor_id_fkey FOREIGN KEY (sponsor_id) REFERENCES public.finance_organizations(id) ON DELETE CASCADE;
ALTER TABLE public.stock_transfer_items ADD CONSTRAINT stock_transfer_items_transfer_id_fkey FOREIGN KEY (transfer_id) REFERENCES public.stock_transfers(id) ON DELETE CASCADE;
ALTER TABLE public.stock_transfer_items ADD CONSTRAINT stock_transfer_items_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.inventory_items(id);
ALTER TABLE public.stock_transfer_items ADD CONSTRAINT stock_transfer_items_source_ledger_id_fkey FOREIGN KEY (source_ledger_id) REFERENCES public.inventory_stock_ledger(id);
ALTER TABLE public.stock_transfer_items ADD CONSTRAINT stock_transfer_items_destination_ledger_id_fkey FOREIGN KEY (destination_ledger_id) REFERENCES public.inventory_stock_ledger(id);
ALTER TABLE public.stock_transfer_items ADD CONSTRAINT stock_transfer_items_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.units(id);
ALTER TABLE public.stock_transfers ADD CONSTRAINT stock_transfers_source_store_id_fkey FOREIGN KEY (source_store_id) REFERENCES public.stores(id);
ALTER TABLE public.stock_transfers ADD CONSTRAINT stock_transfers_destination_store_id_fkey FOREIGN KEY (destination_store_id) REFERENCES public.stores(id);
ALTER TABLE public.stock_transfers ADD CONSTRAINT stock_transfers_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES public.app_users(id);
ALTER TABLE public.stock_transfers ADD CONSTRAINT stock_transfers_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.app_users(id);
ALTER TABLE public.store_item_mappings ADD CONSTRAINT store_item_mappings_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.inventory_items(id) ON DELETE CASCADE;
ALTER TABLE public.store_item_mappings ADD CONSTRAINT store_item_mappings_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;
ALTER TABLE public.stores ADD CONSTRAINT stores_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;
ALTER TABLE public.stores ADD CONSTRAINT stores_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL;
ALTER TABLE public.user_privilege_overrides ADD CONSTRAINT user_privilege_overrides_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.app_users(id) ON DELETE CASCADE;
ALTER TABLE public.user_privilege_overrides ADD CONSTRAINT user_privilege_overrides_screen_id_fkey FOREIGN KEY (screen_id) REFERENCES public.screens(id) ON DELETE CASCADE;
ALTER TABLE public.vital_sign_parameters ADD CONSTRAINT vital_sign_parameters_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.vital_sign_groups(id) ON DELETE CASCADE;
