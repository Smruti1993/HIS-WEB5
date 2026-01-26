-- 1. Master Tables
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

-- 2. Employees Table
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

-- 3. Patients Table
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

-- 4. Doctor Availability Table
CREATE TABLE IF NOT EXISTS doctor_availability (
    id TEXT PRIMARY KEY,
    doctor_id TEXT REFERENCES employees(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL, -- 0=Sunday, 1=Monday...
    start_time TEXT NOT NULL, -- Format 'HH:mm'
    end_time TEXT NOT NULL,   -- Format 'HH:mm'
    slot_duration_minutes INTEGER DEFAULT 30
);

-- 5. Appointments Table
CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY,
    patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id TEXT REFERENCES employees(id) ON DELETE SET NULL,
    department_id TEXT REFERENCES departments(id) ON DELETE SET NULL,
    date TEXT NOT NULL, -- Format 'YYYY-MM-DD'
    time TEXT NOT NULL, -- Format 'HH:mm'
    status TEXT DEFAULT 'Scheduled', -- 'Scheduled', 'Completed', 'Cancelled'
    symptoms TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_centres ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- 7. Create Policies
-- Note: For this demo application using a simple Anon Key without user Auth,
-- we allow public access. In a production app, you would restrict this to authenticated users.

-- Departments
CREATE POLICY "Enable all access for all users" ON departments FOR ALL USING (true) WITH CHECK (true);

-- Units
CREATE POLICY "Enable all access for all users" ON units FOR ALL USING (true) WITH CHECK (true);

-- Service Centres
CREATE POLICY "Enable all access for all users" ON service_centres FOR ALL USING (true) WITH CHECK (true);

-- Employees
CREATE POLICY "Enable all access for all users" ON employees FOR ALL USING (true) WITH CHECK (true);

-- Patients
CREATE POLICY "Enable all access for all users" ON patients FOR ALL USING (true) WITH CHECK (true);

-- Doctor Availability
CREATE POLICY "Enable all access for all users" ON doctor_availability FOR ALL USING (true) WITH CHECK (true);

-- Appointments
CREATE POLICY "Enable all access for all users" ON appointments FOR ALL USING (true) WITH CHECK (true);
