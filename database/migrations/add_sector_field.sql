-- Add sector field to departments table
-- Migration: Add sector field for better categorization

-- Create sector enum type
CREATE TYPE sector_type AS ENUM ('SPK', 'SPHEMK', 'SPIP');

-- Add sector column to departments table
ALTER TABLE departments 
ADD COLUMN sector sector_type;

-- Add sector column to users table for peneraju_pemeriksaan
ALTER TABLE users 
ADD COLUMN sector sector_type;

-- Update existing departments with their sectors
UPDATE departments SET sector = 'SPK' WHERE code IN ('BPM', 'BPR');
UPDATE departments SET sector = 'SPHEMK' WHERE code = 'BPK';
UPDATE departments SET sector = 'SPIP' WHERE code = 'BTP';

-- Update constraint for peneraju_pemeriksaan to require sector
ALTER TABLE users DROP CONSTRAINT IF EXISTS check_role_assignment;

ALTER TABLE users ADD CONSTRAINT check_role_assignment CHECK (
    (role = 'admin' AND department_id IS NULL AND jpn_id IS NULL AND sector IS NULL) OR
    (role = 'peneraju_pemeriksaan' AND department_id IS NULL AND jpn_id IS NULL AND sector IS NOT NULL) OR
    (role = 'penyelaras_bahagian' AND department_id IS NOT NULL AND jpn_id IS NULL AND sector IS NULL) OR
    (role = 'penyelaras_jpn' AND department_id IS NULL AND jpn_id IS NOT NULL AND sector IS NULL) OR
    (role = 'pemantau' AND sector IS NULL)
);

-- Update existing peneraju user with a default sector
UPDATE users SET sector = 'SPK' WHERE email = 'peneraju@moe.gov.my';