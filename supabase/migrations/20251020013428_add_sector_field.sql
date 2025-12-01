
CREATE TYPE sector_type AS ENUM ('SPK', 'SPHEMK', 'SPIP');

ALTER TABLE departments 
ADD COLUMN sector sector_type;

UPDATE departments 
SET sector = 'SPK' 
WHERE code IN ('BPM', 'BPR');

UPDATE departments 
SET sector = 'SPHEMK' 
WHERE code = 'BPK';

UPDATE departments 
SET sector = 'SPIP' 
WHERE code = 'BTP';

ALTER TABLE users 
ADD COLUMN sector sector_type;

UPDATE users 
SET sector = 'SPK' 
WHERE role = 'peneraju_pemeriksaan' AND sector IS NULL;

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