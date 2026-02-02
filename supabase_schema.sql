-- ==========================================
-- MIGRATION COMMANDS (Run these if tables already exist)
-- ==========================================

-- Fix for Appointments table missing columns
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS check_in_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS check_out_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS visit_type TEXT DEFAULT 'New Visit';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS payment_mode TEXT DEFAULT 'CASH';

-- Fix for Clinical Diagnoses table missing columns
ALTER TABLE clinical_diagnoses ADD COLUMN IF NOT EXISTS icd_code TEXT;
ALTER TABLE clinical_diagnoses ADD COLUMN IF NOT EXISTS is_poa BOOLEAN DEFAULT FALSE;

-- Fix for Clinical Allergies table to support detailed form
ALTER TABLE clinical_allergies ADD COLUMN IF NOT EXISTS allergy_type TEXT;
ALTER TABLE clinical_allergies ADD COLUMN IF NOT EXISTS onset_date DATE;
ALTER TABLE clinical_allergies ADD COLUMN IF NOT EXISTS resolved_date DATE;
ALTER TABLE clinical_allergies ADD COLUMN IF NOT EXISTS remarks TEXT;

-- CRITICAL: Refresh the PostgREST schema cache to recognize new columns immediately
NOTIFY pgrst, 'reload schema';

-- ==========================================
-- 1. Master Data Tables
-- ==========================================

CREATE TABLE IF NOT EXISTS departments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT,
    status TEXT DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS units (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT,
    status TEXT DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS service_centres (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT,
    status TEXT DEFAULT 'Active'
);

-- ==========================================
-- 2. Staff & Patients
-- ==========================================

CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    role TEXT NOT NULL, -- 'Doctor', 'Nurse', 'Admin', 'Staff'
    department_id TEXT REFERENCES departments(id) ON DELETE SET NULL,
    specialization TEXT,
    status TEXT DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    dob DATE,
    gender TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS doctor_availability (
    id TEXT PRIMARY KEY,
    doctor_id TEXT REFERENCES employees(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL, -- 0=Sunday, 1=Monday...
    start_time TEXT NOT NULL, -- Format 'HH:mm'
    end_time TEXT NOT NULL,   -- Format 'HH:mm'
    slot_duration_minutes INTEGER DEFAULT 30
);

-- ==========================================
-- 3. Appointments
-- ==========================================

CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY,
    patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id TEXT REFERENCES employees(id) ON DELETE SET NULL,
    department_id TEXT REFERENCES departments(id) ON DELETE SET NULL,
    date TEXT NOT NULL, -- Format 'YYYY-MM-DD'
    time TEXT NOT NULL, -- Format 'HH:mm'
    status TEXT DEFAULT 'Scheduled', -- 'Scheduled', 'Checked-In', 'In-Consultation', 'Completed', 'Cancelled'
    visit_type TEXT DEFAULT 'New Visit', -- 'New Visit', 'Follow-up'
    payment_mode TEXT DEFAULT 'CASH',
    symptoms TEXT,
    notes TEXT,
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_out_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 4. Billing & Finance
-- ==========================================

CREATE TABLE IF NOT EXISTS bills (
    id TEXT PRIMARY KEY,
    patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE,
    appointment_id TEXT REFERENCES appointments(id) ON DELETE SET NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'Unpaid', -- 'Unpaid', 'Partial', 'Paid'
    total_amount NUMERIC(10, 2) DEFAULT 0,
    paid_amount NUMERIC(10, 2) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS bill_items (
    id TEXT PRIMARY KEY,
    bill_id TEXT REFERENCES bills(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price NUMERIC(10, 2) DEFAULT 0,
    total NUMERIC(10, 2) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    bill_id TEXT REFERENCES bills(id) ON DELETE CASCADE,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    amount NUMERIC(10, 2) DEFAULT 0,
    method TEXT, -- 'Cash', 'Card', 'Insurance', 'Online'
    reference TEXT
);

-- ==========================================
-- 5. Clinical Data (Workbench & Consultation)
-- ==========================================

CREATE TABLE IF NOT EXISTS clinical_vitals (
    id TEXT PRIMARY KEY,
    appointment_id TEXT REFERENCES appointments(id) ON DELETE CASCADE,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    bp_systolic INTEGER,
    bp_diastolic INTEGER,
    temperature NUMERIC(4, 1),
    pulse INTEGER,
    respiratory_rate INTEGER,
    map NUMERIC(5, 2), -- Mean Arterial Pressure
    spo2 INTEGER,      -- Oxygen Saturation
    height NUMERIC(5, 2),
    weight NUMERIC(5, 2),
    bmi NUMERIC(4, 1),
    tobacco_use TEXT,
    row_remarks JSONB  -- Stores remarks for specific rows (e.g. {"temperature": "High"})
);

CREATE TABLE IF NOT EXISTS clinical_diagnoses (
    id TEXT PRIMARY KEY,
    appointment_id TEXT REFERENCES appointments(id) ON DELETE CASCADE,
    code TEXT, -- Legacy or internal code
    icd_code TEXT, -- Official ICD Code
    description TEXT NOT NULL,
    type TEXT DEFAULT 'Provisional', -- 'Provisional', 'Final', 'Primary', 'Secondary'
    is_poa BOOLEAN DEFAULT FALSE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- New Table for the top part of the Diagnosis Screen
CREATE TABLE IF NOT EXISTS clinical_narrative_diagnoses (
    id TEXT PRIMARY KEY,
    appointment_id TEXT REFERENCES appointments(id) ON DELETE CASCADE,
    illness TEXT,
    illness_duration_value INTEGER,
    illness_duration_unit TEXT, -- Days, Weeks, Months, Years
    behavioural_activity TEXT,
    narrative TEXT,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clinical_allergies (
    id TEXT PRIMARY KEY,
    patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE,
    allergen TEXT NOT NULL,
    allergy_type TEXT, -- 'Drug', 'Food', 'Environmental', 'NonFormulaDrug'
    severity TEXT, -- 'Mild', 'Moderate', 'Severe'
    reaction TEXT, -- Stores multiple reactions
    status TEXT DEFAULT 'Active',
    onset_date DATE,
    resolved_date DATE,
    remarks TEXT,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clinical_notes (
    id TEXT PRIMARY KEY,
    appointment_id TEXT REFERENCES appointments(id) ON DELETE CASCADE,
    note_type TEXT NOT NULL, -- 'Chief Complaint', 'Past History', 'Family History', 'Treatment Plan', etc.
    description TEXT, -- Stores HTML content from Rich Text Editor
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

-- ==========================================
-- 6. Performance Indexes
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_bills_patient ON bills(patient_id);
CREATE INDEX IF NOT EXISTS idx_clinical_notes_appt ON clinical_notes(appointment_id);
CREATE INDEX IF NOT EXISTS idx_clinical_vitals_appt ON clinical_vitals(appointment_id);
CREATE INDEX IF NOT EXISTS idx_clinical_diagnoses_appt ON clinical_diagnoses(appointment_id);
CREATE INDEX IF NOT EXISTS idx_clinical_narrative_appt ON clinical_narrative_diagnoses(appointment_id);
CREATE INDEX IF NOT EXISTS idx_clinical_allergies_patient ON clinical_allergies(patient_id);
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(last_name);
CREATE INDEX IF NOT EXISTS idx_employees_dept ON employees(department_id);

-- ==========================================
-- 7. Security (Row Level Security)
-- ==========================================

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_centres ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_vitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_diagnoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_narrative_diagnoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_allergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_notes ENABLE ROW LEVEL SECURITY;

-- Create open policies for development (Allows full access to anyone with the API key)
CREATE POLICY "Enable all access for all users" ON departments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for all users" ON units FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for all users" ON service_centres FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for all users" ON employees FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for all users" ON patients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for all users" ON doctor_availability FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for all users" ON appointments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for all users" ON bills FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for all users" ON bill_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for all users" ON payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for all users" ON clinical_vitals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for all users" ON clinical_diagnoses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for all users" ON clinical_narrative_diagnoses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for all users" ON clinical_allergies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for all users" ON clinical_notes FOR ALL USING (true) WITH CHECK (true);