-- Check all constraints on users table that might be blocking penyelaras_jnn
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'users'::regclass 
ORDER BY conname;
