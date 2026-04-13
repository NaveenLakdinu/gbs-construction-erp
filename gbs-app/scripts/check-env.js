// Environment checker script
const fs = require('fs');
const path = require('path');

function checkEnvironment() {
  console.log('=== Environment Check ===');
  
  // Check if .env file exists
  const envPath = path.join(process.cwd(), '.env');
  const envExists = fs.existsSync(envPath);
  console.log('1. .env file exists:', envExists);
  
  if (envExists) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const hasDbUrl = envContent.includes('DATABASE_URL=');
    console.log('2. DATABASE_URL present:', hasDbUrl);
    
    if (hasDbUrl) {
      const dbUrlMatch = envContent.match(/DATABASE_URL=([^\s\n]+)/);
      if (dbUrlMatch) {
        const dbUrl = dbUrlMatch[1];
        console.log('3. Database URL format:', dbUrl.startsWith('postgresql://') ? 'Valid' : 'Invalid');
        console.log('4. Database host:', dbUrl.includes('@') ? dbUrl.split('@')[1].split('/')[0] : 'Not found');
      }
    }
  }
  
  // Check Node environment
  console.log('5. NODE_ENV:', process.env.NODE_ENV || 'Not set');
  
  // Check Prisma schema
  const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
  const schemaExists = fs.existsSync(schemaPath);
  console.log('6. Prisma schema exists:', schemaExists);
  
  if (schemaExists) {
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    const hasPostgres = schemaContent.includes('provider = "postgresql"');
    console.log('7. PostgreSQL provider configured:', hasPostgres);
  }
  
  console.log('\n=== Check completed ===');
}

checkEnvironment();
