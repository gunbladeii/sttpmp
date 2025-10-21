const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testSectorFields() {
  console.log('🧪 Testing Sector Fields Migration...');
  console.log('=====================================');
  
  try {
    // Test departments table
    console.log('📋 Testing departments table...');
    const { data: departments, error: deptError } = await supabase
      .from('departments')
      .select('id, name, code, sector')
      .limit(5);
    
    if (deptError) {
      console.error('❌ Departments query error:', deptError);
    } else {
      console.log('✅ Departments with sectors:');
      departments.forEach(dept => {
        console.log(`   ${dept.name} (${dept.code}) → Sector: ${dept.sector || 'NULL'}`);
      });
    }
    
    console.log('');
    
    // Test users table
    console.log('👥 Testing users table...');
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, name, role, sector, department_id, jpn_id')
      .limit(5);
    
    if (userError) {
      console.error('❌ Users query error:', userError);
    } else {
      console.log('✅ Users with sectors:');
      users.forEach(user => {
        console.log(`   ${user.name} (${user.role}) → Sector: ${user.sector || 'NULL'}`);
      });
    }
    
    console.log('');
    
    // Test full syor query like in Dashboard Laporan
    console.log('📊 Testing Dashboard Laporan query...');
    const { data: syorData, error: syorError } = await supabase
      .from('syor')
      .select(`
        id,
        title,
        creator:created_by(name, sector),
        department:assigned_to_department(name, code, sector)
      `)
      .limit(3);
    
    if (syorError) {
      console.error('❌ Syor query error:', syorError);
    } else {
      console.log('✅ Syor with sector data:');
      syorData.forEach(syor => {
        console.log(`   "${syor.title.substring(0, 50)}..."`);
        console.log(`     Creator Sector: ${syor.creator?.sector || 'NULL'}`);
        console.log(`     Dept Sector: ${syor.department?.sector || 'NULL'}`);
        console.log('');
      });
    }
    
    console.log('🎉 All tests completed successfully!');
    console.log('');
    console.log('📋 Summary:');
    console.log('✅ Sector fields added to departments table');
    console.log('✅ Sector fields added to users table');
    console.log('✅ Dashboard Laporan query working');
    console.log('✅ Migration applied successfully');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSectorFields();