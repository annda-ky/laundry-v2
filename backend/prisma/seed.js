const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create default settings
  const settings = await prisma.settings.upsert({
    where: { id: 'default-settings' },
    update: {},
    create: {
      id: 'default-settings',
      businessName: 'LaundryKu',
      address: 'Jl. Raya Laundry No. 123',
      phone: '08123456789',
      footer: 'Terima kasih telah menggunakan jasa kami!',
      template: 'simple',
    },
  });
  console.log('✅ Settings created');

  // Hash passwords
  const ownerPassword = await bcrypt.hash('owner123', 10);
  const kasirPassword = await bcrypt.hash('kasir123', 10);

  // Create default Owner
  const owner = await prisma.user.upsert({
    where: { username: 'owner' },
    update: {},
    create: {
      username: 'owner',
      password: ownerPassword,
      name: 'Owner Laundry',
      role: 'OWNER',
      isActive: true,
    },
  });
  console.log('✅ Owner created:', owner.username);

  // Create default Kasir
  const kasir = await prisma.user.upsert({
    where: { username: 'kasir' },
    update: {},
    create: {
      username: 'kasir',
      password: kasirPassword,
      name: 'Kasir Laundry',
      role: 'KASIR',
      isActive: true,
    },
  });
  console.log('✅ Kasir created:', kasir.username);

  // Create default services
  const services = [
    { name: 'Cuci Kering Lipat', type: 'KILOAN', price: 7000, estimatedTime: 48 },
    { name: 'Cuci Setrika', type: 'KILOAN', price: 10000, estimatedTime: 72 },
    { name: 'Setrika Saja', type: 'KILOAN', price: 5000, estimatedTime: 24 },
    { name: 'Cuci Express', type: 'KILOAN', price: 15000, estimatedTime: 12 },
    { name: 'Dry Clean Jas', type: 'SATUAN', price: 35000, estimatedTime: 72 },
    { name: 'Dry Clean Gaun', type: 'SATUAN', price: 45000, estimatedTime: 72 },
    { name: 'Cuci Selimut', type: 'SATUAN', price: 25000, estimatedTime: 48 },
    { name: 'Cuci Bed Cover', type: 'SATUAN', price: 30000, estimatedTime: 48 },
    { name: 'Cuci Karpet Kecil', type: 'SATUAN', price: 20000, estimatedTime: 72 },
    { name: 'Cuci Karpet Besar', type: 'SATUAN', price: 50000, estimatedTime: 96 },
  ];

  for (const service of services) {
    await prisma.service.upsert({
      where: { id: service.name.toLowerCase().replace(/\s+/g, '-') },
      update: {},
      create: {
        id: service.name.toLowerCase().replace(/\s+/g, '-'),
        ...service,
      },
    });
  }
  console.log('✅ Services created:', services.length);

  // Create sample customers
  const customers = [
    { name: 'Budi Santoso', phone: '081234567890', address: 'Jl. Merdeka No. 10' },
    { name: 'Siti Rahayu', phone: '081234567891', address: 'Jl. Sudirman No. 25' },
    { name: 'Ahmad Hidayat', phone: '081234567892', address: 'Jl. Gatot Subroto No. 5' },
  ];

  for (const customer of customers) {
    await prisma.customer.upsert({
      where: { id: customer.name.toLowerCase().replace(/\s+/g, '-') },
      update: {},
      create: {
        id: customer.name.toLowerCase().replace(/\s+/g, '-'),
        ...customer,
      },
    });
  }
  console.log('✅ Sample customers created:', customers.length);

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
