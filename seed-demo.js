const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 
async function seed() { 
  await prisma.client.deleteMany({ where: { email: 'jefe@kiuflow.com' } });
  await prisma.client.create({ 
    data: { 
      name: 'Cliente Prueba', 
      email: 'prueba@kiuflow.com',
      initials: 'CP',
      max_landings: 5
    }
  }); 
  await prisma.client.create({ 
    data: { 
      name: 'Pepito Perez', 
      email: 'pepito@kiuflow.com',
      initials: 'PP',
      max_landings: 5
    }
  }); 
  console.log('Clientes actualizados!'); 
} 
seed().catch(console.error).finally(() => prisma.$disconnect());
