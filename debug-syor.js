// Debug script to check syor filtering issue
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wxfqsrryhlzocnrmhgqw.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4ZnFzcnJ5aGx6b2Nucm1oZ3F3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk0MTE1MTIsImV4cCI6MjA0NDk4NzUxMn0.bYBwv4l2Ts4JGH3HJMTLS6pzWWOhvtOK-rLGzV4JiD4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugSyorFiltering() {
  console.log('=== DEBUG SYOR FILTERING ===\n')
  
  // 1. Check departments with sector SPK
  console.log('1. Departments with sector SPK:')
  const { data: spkDepartments, error: deptError } = await supabase
    .from('departments')
    .select('*')
    .eq('sector', 'SPK')
  
  if (deptError) {
    console.error('Error:', deptError)
  } else {
    console.log('SPK Departments:', spkDepartments)
  }
  
  // 2. Check all syor in database
  console.log('\n2. All syor in database:')
  const { data: allSyor, error: syorError } = await supabase
    .from('syor')
    .select(`
      *,
      department:assigned_to_department(name, code, sector),
      jpn:assigned_to_jpn(name, state)
    `)
  
  if (syorError) {
    console.error('Error:', syorError)
  } else {
    console.log('All Syor:', allSyor)
  }
  
  // 3. Check syor assigned to SPK departments specifically
  if (spkDepartments && spkDepartments.length > 0) {
    console.log('\n3. Syor assigned to SPK departments:')
    const departmentIds = spkDepartments.map(dept => dept.id)
    console.log('SPK Department IDs:', departmentIds)
    
    const { data: spkSyor, error: spkSyorError } = await supabase
      .from('syor')
      .select(`
        *,
        department:assigned_to_department(name, code, sector),
        jpn:assigned_to_jpn(name, state)
      `)
      .in('assigned_to_department', departmentIds)
    
    if (spkSyorError) {
      console.error('Error:', spkSyorError)
    } else {
      console.log('SPK Syor:', spkSyor)
    }
  }
  
  // 4. Check users table for SPK peneraju
  console.log('\n4. Peneraju SPK users:')
  const { data: spkUsers, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('sector', 'SPK')
    .eq('role', 'peneraju_pemeriksaan')
  
  if (userError) {
    console.error('Error:', userError)
  } else {
    console.log('SPK Peneraju Users:', spkUsers)
  }
}

debugSyorFiltering().catch(console.error)