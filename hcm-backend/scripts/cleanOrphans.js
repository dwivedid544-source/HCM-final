const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanDatabaseOrphans() {
  console.log('🔄 Checking and cleaning orphaned database records...');

  try {
    // 1. EmployeeProfiles linked to invalid departments
    const empDeptsCleaned = await prisma.$executeRawUnsafe(`
      UPDATE employeeprofile 
      SET departmentId = NULL 
      WHERE departmentId IS NOT NULL 
        AND departmentId NOT IN (SELECT id FROM department)
    `);
    console.log(`- Cleared departmentId on orphaned EmployeeProfiles: ${empDeptsCleaned} rows`);

    // 2. Orphaned departments
    const deptsCleaned = await prisma.$executeRawUnsafe(`
      DELETE FROM department 
      WHERE organizationId NOT IN (SELECT id FROM organization)
    `);
    console.log(`- Deleted orphaned Departments: ${deptsCleaned} rows`);

    // 3. Orphaned users organizationId
    const usersCleaned = await prisma.$executeRawUnsafe(`
      UPDATE user 
      SET organizationId = NULL 
      WHERE organizationId IS NOT NULL 
        AND organizationId NOT IN (SELECT id FROM organization)
    `);
    console.log(`- Set organizationId to NULL for orphaned Users: ${usersCleaned} rows`);

    // 4. Orphaned EmployeeProfiles organizationId
    const empOrgsCleaned = await prisma.$executeRawUnsafe(`
      UPDATE employeeprofile 
      SET organizationId = NULL 
      WHERE organizationId IS NOT NULL 
        AND organizationId NOT IN (SELECT id FROM organization)
    `);
    console.log(`- Set organizationId to NULL for orphaned EmployeeProfiles: ${empOrgsCleaned} rows`);

    // 5. Orphaned AuditLogs organizationId
    try {
      const auditCleaned = await prisma.$executeRawUnsafe(`
        UPDATE auditlog 
        SET organizationId = NULL 
        WHERE organizationId IS NOT NULL 
          AND organizationId NOT IN (SELECT id FROM organization)
      `);
      console.log(`- Set organizationId to NULL for orphaned AuditLogs: ${auditCleaned} rows`);
    } catch (e) {
      // auditlog might not have organizationId
    }

    console.log('\n✅ Database cleanup completed successfully!');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanDatabaseOrphans();
