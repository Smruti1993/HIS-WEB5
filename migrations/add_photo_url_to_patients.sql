-- Add photo_url column to patients table to store patient photo (base64 string or image URL)
ALTER TABLE patients ADD COLUMN IF NOT EXISTS photo_url TEXT;

