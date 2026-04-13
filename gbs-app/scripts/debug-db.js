// Database debugging script
const { PrismaClient } = require('@prisma/client');

const globalForPrisma = globalThis;
const prisma = globalForPrisma.prisma || new PrismaClient();

async function debugDatabase() {
  try {
    console.log('=== Database Connection Debug ===');
    
    // Test 1: Check database connection
    console.log('1. Testing database connection...');
    await prisma.$connect();
    console.log('   Database connected successfully!');

    // Test 2: Check if table exists
    console.log('2. Checking projects table...');
    const result = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'projects'`;
    console.log('   Projects table exists:', result.length > 0);

    // Test 3: Count existing projects
    console.log('3. Counting existing projects...');
    const count = await prisma.projects.count();
    console.log(`   Current projects count: ${count}`);

    // Test 4: Try to create a test project
    console.log('4. Creating test project...');
    const testProject = await prisma.projects.create({
      data: {
        name: 'Debug Test Project',
        location: 'Test Location',
        status: 'Ongoing'
      }
    });
    console.log('   Test project created:', testProject);

    // Test 5: Verify the project was saved
    console.log('5. Verifying project was saved...');
    const savedProject = await prisma.projects.findUnique({
      where: { id: testProject.id }
    });
    console.log('   Project found in database:', !!savedProject);

    // Test 6: Clean up test project
    console.log('6. Cleaning up test project...');
    await prisma.projects.delete({
      where: { id: testProject.id }
    });
    console.log('   Test project deleted');

    console.log('\n=== All tests completed successfully! ===');
    
  } catch (error) {
    console.error('=== Database Error Detected ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    if (error.code === 'P1001') {
      console.error('Issue: Database connection failed');
      console.error('Solution: Check DATABASE_URL in .env file');
    } else if (error.code === 'P2002') {
      console.error('Issue: Unique constraint violation');
    } else if (error.code === 'P2025') {
      console.error('Issue: Record not found');
    }
  } finally {
    await prisma.$disconnect();
  }
}

debugDatabase();
