-- Fix Duplicate: Bahagian Perancangan dan Penyelidikan Dasar Pendidikan
-- Masalah: Terdapat 2 entri dengan nama yang sama - satu dengan kod 'EPRD' dan satu lagi 'BPPDP'
-- Penyelesaian: Kekalkan 'EPRD', pindahkan semua rujukan dari 'BPPDP' ke 'EPRD', padam 'BPPDP'

DO $$
DECLARE
  v_eprd_id UUID;
  v_bppdp_id UUID;
BEGIN
  -- Dapatkan ID untuk kedua-dua entri
  SELECT id INTO v_eprd_id  FROM departments WHERE code = 'EPRD'  LIMIT 1;
  SELECT id INTO v_bppdp_id FROM departments WHERE code = 'BPPDP' LIMIT 1;

  IF v_eprd_id IS NULL THEN
    RAISE NOTICE 'EPRD tidak dijumpai. Tiada perubahan dibuat.';
    RETURN;
  END IF;

  IF v_bppdp_id IS NULL THEN
    RAISE NOTICE 'BPPDP tidak dijumpai. Mungkin sudah dibersihkan sebelum ini.';
    RETURN;
  END IF;

  RAISE NOTICE 'EPRD id: %, BPPDP id: %', v_eprd_id, v_bppdp_id;

  -- Pindahkan semua syor yang dirujuk ke BPPDP → guna EPRD
  -- (syor table uses 'assigned_to_department', not 'department_id')
  UPDATE syor
  SET assigned_to_department = v_eprd_id
  WHERE assigned_to_department = v_bppdp_id;

  -- Pindahkan semua users yang ditugaskan ke BPPDP → guna EPRD
  UPDATE users
  SET department_id = v_eprd_id
  WHERE department_id = v_bppdp_id;

  -- Pindahkan status_tracking jika ada rujukan ke BPPDP
  UPDATE status_tracking
  SET department_id = v_eprd_id
  WHERE department_id = v_bppdp_id;

  -- Padam entri BPPDP yang duplikasi
  DELETE FROM departments WHERE id = v_bppdp_id;

  RAISE NOTICE 'Selesai. Entri BPPDP telah dipadam, semua rujukan dipindah ke EPRD.';
END $$;

-- Sahkan keputusan
SELECT id, name, code FROM departments WHERE name LIKE '%Perancangan dan Penyelidikan Dasar%';
