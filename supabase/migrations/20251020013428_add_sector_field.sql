-- Add sector field to departments table
-- This migration adds sector classification to departments for better reporting

-- Create sector enum type
CREATE TYPE sector_type AS ENUM ('SPK', 'SPHEMK', 'SPIP');

-- Add sector column to departments table
ALTER TABLE departments 
ADD COLUMN sector sector_type;

-- Update existing departments with their sectors
-- SPK: Sektor Penaziran Kurikulum
-- SPHEMK: Sektor Penaziran Hal Ehwal Murid & Kokurikulum  
-- SPIP: Sektor Penaziran Institusi Pendidikan
UPDATE departments 
SET sector = 'SPK' 
WHERE code IN ('BPM', 'BPR');

UPDATE departments 
SET sector = 'SPHEMK' 
WHERE code = 'BPK';

UPDATE departments 
SET sector = 'SPIP' 
WHERE code = 'BTP';

-- Add sector column to users table for peneraju_pemeriksaan role
ALTER TABLE users 
ADD COLUMN sector sector_type;

-- Update existing peneraju_pemeriksaan user with a sector (default SPK) BEFORE adding constraint
UPDATE users 
SET sector = 'SPK' 
WHERE role = 'peneraju_pemeriksaan' AND sector IS NULL;

-- Update constraint to handle sector for peneraju_pemeriksaan
ALTER TABLE users 
DROP CONSTRAINT IF EXISTS check_role_assignment;

ALTER TABLE users 
ADD CONSTRAINT check_role_assignment CHECK (
    (role = 'admin' AND department_id IS NULL AND jpn_id IS NULL AND sector IS NULL) OR
    (role = 'peneraju_pemeriksaan' AND department_id IS NULL AND jpn_id IS NULL AND sector IS NOT NULL) OR
    (role = 'penyelaras_bahagian' AND department_id IS NOT NULL AND jpn_id IS NULL AND sector IS NULL) OR
    (role = 'penyelaras_jpn' AND department_id IS NULL AND jpn_id IS NOT NULL AND sector IS NULL) OR
    (role = 'pemantau' AND sector IS NULL)
);