-- ================================================================
-- FIX: Sejarah Maklum Balas & Bell Notifications
-- Jalankan SQL ini dalam Supabase SQL Editor
-- Tarikh: Mac 2026
-- ================================================================

-- ----------------------------------------------------------------
-- BAHAGIAN 1: SEJARAH MAKLUM BALAS
-- Buang unique constraints supaya setiap submit maklum balas
-- menghasilkan rekod baru (bukan mengganti rekod lama).
-- ----------------------------------------------------------------

-- Buang unique constraint syor_id + department_id (jika wujud)
ALTER TABLE status_tracking
  DROP CONSTRAINT IF EXISTS status_tracking_syor_id_department_id_key;

-- Buang unique constraint syor_id + jpn_id (jika wujud)
ALTER TABLE status_tracking
  DROP CONSTRAINT IF EXISTS status_tracking_syor_id_jpn_id_key;

-- Semak juga nama constraint alternatif
ALTER TABLE status_tracking
  DROP CONSTRAINT IF EXISTS unique_syor_department;

ALTER TABLE status_tracking
  DROP CONSTRAINT IF EXISTS unique_syor_jpn;

-- Sahkan: tiada lagi unique constraint pada kombinasi tersebut
SELECT
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'status_tracking'
  AND tc.constraint_type = 'UNIQUE'
ORDER BY tc.constraint_name, kcu.ordinal_position;


-- ----------------------------------------------------------------
-- BAHAGIAN 2: BELL NOTIFICATIONS — BETULKAN TRIGGERS
-- Column sebenar dalam jadual notifications ialah 'type'
-- (bukan 'notification_type' seperti dalam trigger lama)
-- ----------------------------------------------------------------

-- Buang trigger lama
DROP TRIGGER IF EXISTS trigger_create_notification_on_status_change ON status_tracking;
DROP TRIGGER IF EXISTS trigger_create_notification_on_new_syor ON syor;

-- Buang fungsi lama
DROP FUNCTION IF EXISTS create_notification_on_status_change();
DROP FUNCTION IF EXISTS create_notification_on_new_syor();

-- ----------------------------------------------------------------
-- TRIGGER BARU: Notifikasi apabila status_tracking INSERT
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_notification_on_status_change()
RETURNS TRIGGER AS $$
DECLARE
  syor_record RECORD;
  target_user_id UUID;
  notification_title TEXT;
  notification_message TEXT;
  updater_name TEXT;
  syor_title TEXT;
  updater_role TEXT;
  creator_user_id UUID;
BEGIN
  -- Ambil maklumat syor dan pengemaskini
  SELECT
    s.*,
    u.name  AS updater_name,
    u.role  AS updater_role,
    s.title AS syor_title,
    s.created_by AS creator_id
  INTO syor_record
  FROM syor s
  LEFT JOIN users u ON u.id = NEW.updated_by
  WHERE s.id = NEW.syor_id;

  updater_name    := syor_record.updater_name;
  updater_role    := syor_record.updater_role;
  syor_title      := syor_record.syor_title;
  creator_user_id := syor_record.creator_id;

  -- SENARIO 1: Beritahu Penyelaras apabila Admin/Peneraju kemaskini
  IF updater_role IN ('admin', 'peneraju_pemeriksaan') THEN
    IF NEW.department_id IS NOT NULL THEN
      SELECT id INTO target_user_id
      FROM users
      WHERE department_id = NEW.department_id
        AND role = 'penyelaras_bahagian'
      LIMIT 1;
    ELSIF NEW.jpn_id IS NOT NULL THEN
      SELECT id INTO target_user_id
      FROM users
      WHERE jpn_id = NEW.jpn_id
        AND role IN ('penyelaras_jpn', 'penyelaras_jnn')
      LIMIT 1;
    END IF;

    IF target_user_id IS NOT NULL AND target_user_id != NEW.updated_by THEN
      IF NEW.status = 'selesai' THEN
        notification_title   := 'Status Dikemas Kini: Selesai';
        notification_message := updater_name || ' telah menandakan syor "' || syor_title || '" sebagai selesai.';
      ELSIF NEW.status = 'dalam_tindakan' THEN
        notification_title   := 'Status Dikemas Kini: Dalam Tindakan';
        notification_message := updater_name || ' telah mengemas kini status syor "' || syor_title || '" kepada dalam tindakan.';
      ELSE
        notification_title   := 'Maklum Balas Baharu';
        notification_message := updater_name || ' telah menambah maklum balas: "' || COALESCE(SUBSTRING(NEW.comments, 1, 100), '') || '"';
      END IF;

      INSERT INTO notifications (user_id, syor_id, type, title, message, read)
      VALUES (target_user_id, NEW.syor_id, 'status_update', notification_title, notification_message, FALSE);
    END IF;
  END IF;

  -- SENARIO 2: Beritahu Admin/Peneraju apabila Penyelaras bertindak balas
  IF updater_role IN ('penyelaras_bahagian', 'penyelaras_jpn', 'penyelaras_jnn') THEN
    IF creator_user_id IS NOT NULL AND creator_user_id != NEW.updated_by THEN
      notification_title   := 'Respons Baharu dari Penyelaras';
      notification_message := updater_name || ' telah memberi respons kepada syor "' || syor_title || '": "' || COALESCE(SUBSTRING(NEW.comments, 1, 100), '') || '"';

      INSERT INTO notifications (user_id, syor_id, type, title, message, read)
      VALUES (creator_user_id, NEW.syor_id, 'status_update', notification_title, notification_message, FALSE);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Pasang semula trigger pada INSERT baris baru dalam status_tracking
CREATE TRIGGER trigger_create_notification_on_status_change
  AFTER INSERT ON status_tracking
  FOR EACH ROW
  EXECUTE FUNCTION create_notification_on_status_change();


-- ----------------------------------------------------------------
-- TRIGGER BARU: Notifikasi apabila syor baharu diwujudkan
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_notification_on_new_syor()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id UUID;
  creator_name   TEXT;
BEGIN
  SELECT name INTO creator_name FROM users WHERE id = NEW.created_by;

  IF NEW.assigned_to_department IS NOT NULL THEN
    SELECT id INTO target_user_id
    FROM users
    WHERE department_id = NEW.assigned_to_department
      AND role = 'penyelaras_bahagian'
    LIMIT 1;
  ELSIF NEW.assigned_to_jpn IS NOT NULL THEN
    SELECT id INTO target_user_id
    FROM users
    WHERE jpn_id = NEW.assigned_to_jpn
      AND role IN ('penyelaras_jpn', 'penyelaras_jnn')
    LIMIT 1;
  END IF;

  IF target_user_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, syor_id, type, title, message, read)
    VALUES (
      target_user_id,
      NEW.id,
      'new_syor',
      'Syor Baharu Ditugaskan',
      creator_name || ' telah menugaskan syor baharu kepada anda: "' || NEW.title || '".',
      FALSE
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_create_notification_on_new_syor
  AFTER INSERT ON syor
  FOR EACH ROW
  EXECUTE FUNCTION create_notification_on_new_syor();


-- ----------------------------------------------------------------
-- SAHKAN: Triggers wujud
-- ----------------------------------------------------------------
SELECT trigger_name, event_object_table, event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name IN (
    'trigger_create_notification_on_status_change',
    'trigger_create_notification_on_new_syor'
  );

SELECT 'FIX selesai: Sejarah maklum balas & bell notifications diperbaiki!' AS status;
