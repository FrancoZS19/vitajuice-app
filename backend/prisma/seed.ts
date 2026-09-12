import { PrismaClient, Role, OrderStatus, PaymentStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de datos para VitaJuice by Rena...');

  // Limpiar base de datos si tiene datos previos
  await prisma.payment.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.recipeItem.deleteMany({});
  await prisma.supplyPurchase.deleteMany({});
  await prisma.supply.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.user.deleteMany({});

  // 1. CREAR USUARIOS (Admin para el MVP)
  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('admin123', salt);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@vitajuice.pe',
      password: adminPassword,
      name: 'Administrador VitaJuice',
      role: Role.ADMIN,
      active: true,
    },
  });
  console.log('✅ Usuario Administrador creado: admin@vitajuice.pe / admin123');

  // 2. CREAR INSUMOS (Materia prima y envases)
  // Nota técnica para el docente: Se configuran deliberadamente con unidades exactas (g, ml, unidad)
  // y uno de ellos con stock bajo para disparar la alerta en la demo.
  const rawSupplies = [
    { name: 'Jengibre fresco (Kion)', unit: 'g', currentStock: 12500, minStockAlert: 2000, lastCost: 0.015 }, // S/ 15 el kilo
    { name: 'Cúrcuma fresca', unit: 'g', currentStock: 450, minStockAlert: 1500, lastCost: 0.020 }, // ⚠️ STOCK BAJO (dispara alerta)
    { name: 'Limón sutil exprimido', unit: 'ml', currentStock: 18000, minStockAlert: 3000, lastCost: 0.008 },
    { name: 'Zumo de naranja valencia', unit: 'ml', currentStock: 25000, minStockAlert: 5000, lastCost: 0.006 },
    { name: 'Espinaca baby fresca', unit: 'g', currentStock: 8000, minStockAlert: 1500, lastCost: 0.012 },
    { name: 'Manzana verde', unit: 'g', currentStock: 15000, minStockAlert: 3000, lastCost: 0.007 },
    { name: 'Pepino holandés', unit: 'g', currentStock: 10000, minStockAlert: 2000, lastCost: 0.005 },
    { name: 'Piña golden fresca', unit: 'g', currentStock: 6000, minStockAlert: 1500, lastCost: 0.006 },
    { name: 'Miel pura de abeja', unit: 'g', currentStock: 4000, minStockAlert: 800, lastCost: 0.035 },
    { name: 'Maca negra en polvo', unit: 'g', currentStock: 2500, minStockAlert: 500, lastCost: 0.040 },
    { name: 'Botella PET 60ml grado alimentario', unit: 'unidad', currentStock: 2200, minStockAlert: 500, lastCost: 0.45 },
    { name: 'Tapa rosca con precinto 28mm', unit: 'unidad', currentStock: 2500, minStockAlert: 500, lastCost: 0.15 },
    { name: 'Botella vidrio 350ml (Jugos)', unit: 'unidad', currentStock: 400, minStockAlert: 100, lastCost: 1.20 },
  ];

  const createdSupplies: Record<string, any> = {};
  for (const s of rawSupplies) {
    const supply = await prisma.supply.create({
      data: {
        name: s.name,
        unit: s.unit,
        currentStock: s.currentStock,
        minStockAlert: s.minStockAlert,
        lastCost: s.lastCost,
      },
    });
    createdSupplies[s.name] = supply;
  }
  console.log(`✅ ${rawSupplies.length} Insumos registrados.`);

  // 3. COMPRAS DE INSUMOS (Entradas y Lotes con fechas de vencimiento)
  // Se incluye un lote próximo a vencer (3 días) para la alerta
  const now = new Date();
  const expiringSoon = new Date();
  expiringSoon.setDate(now.getDate() + 3); // Vence en 3 días -> DISPARA ALERTA

  const safeExpiration = new Date();
  safeExpiration.setDate(now.getDate() + 25);

  await prisma.supplyPurchase.createMany({
    data: [
      {
        supplyId: createdSupplies['Piña golden fresca'].id,
        quantity: 6000,
        unitCost: 0.006,
        totalCost: 36.00,
        purchaseDate: new Date(),
        expirationDate: expiringSoon, // ⚠️ Lote por vencer
        supplier: 'Distribuidora Frutas San Luis',
        batchNumber: 'LOTE-PIN-0402',
      },
      {
        supplyId: createdSupplies['Jengibre fresco (Kion)'].id,
        quantity: 15000,
        unitCost: 0.015,
        totalCost: 225.00,
        purchaseDate: new Date(),
        expirationDate: safeExpiration,
        supplier: 'Agro Selva Central',
        batchNumber: 'LOTE-JEN-1108',
      },
      {
        supplyId: createdSupplies['Botella PET 60ml grado alimentario'].id,
        quantity: 2500,
        unitCost: 0.45,
        totalCost: 1125.00,
        purchaseDate: new Date(),
        expirationDate: null,
        supplier: 'Envases Plásticos Perú SAC',
        batchNumber: 'LOTE-PET-991',
      },
    ],
  });
  console.log('✅ Lotes de compras registrados (incluye lote próximo a vencer para test de alertas).');

  // 4. CATÁLOGO DE PRODUCTOS (Los 7 Shots de VitaJuice + Packs + Jugo)
  const rawProducts = [
    {
      name: 'Shot Inmune (60ml)',
      description: 'Potente fórmula de Jengibre, Cúrcuma, Limón, Naranja y toque de pimienta para elevar defensas.',
      category: 'SHOT',
      price: 7.50,
      minStock: 20,
    },
    {
      name: 'Shot Detox (60ml)',
      description: 'Purificante con Espinaca baby, Manzana verde, Pepino y Limón alcalinizante.',
      category: 'SHOT',
      price: 7.50,
      minStock: 20,
    },
    {
      name: 'Shot Energy (60ml)',
      description: 'Energía pura y natural a base de Maca negra, Cacao y Miel de abeja pura.',
      category: 'SHOT',
      price: 8.00,
      minStock: 15,
    },
    {
      name: 'Shot Glow (60ml)',
      description: 'Revitalizante para piel y cabello con Cúrcuma, Naranja y Zanahoria.',
      category: 'SHOT',
      price: 7.50,
      minStock: 15,
    },
    {
      name: 'Shot Anti-inflamatorio (60ml)',
      description: 'Dosis concentrada de Cúrcuma, Jengibre y Piña golden antiinflamatoria.',
      category: 'SHOT',
      price: 8.00,
      minStock: 15,
    },
    {
      name: 'Shot Digestivo (60ml)',
      description: 'Alivia digestión pesada con extracto fresco de Sábila, Menta y Limón.',
      category: 'SHOT',
      price: 7.50,
      minStock: 15,
    },
    {
      name: 'Shot Relax (60ml)',
      description: 'Calma el estrés y favorece el descanso con infusión botánica concentrada.',
      category: 'SHOT',
      price: 8.00,
      minStock: 15,
    },
    {
      name: 'Pack Semanal (7 Shots Surtidos)',
      description: '1 unidad de cada sabor para tu rutina diaria de lunes a domingo.',
      category: 'PACK',
      price: 50.00,
      minStock: 10,
    },
    {
      name: 'Jugo Verde Cold-Pressed 350ml',
      description: 'Jugo prensado en frío de Manzana verde, Espinaca, Pepino y Limón.',
      category: 'JUICE',
      price: 14.00,
      minStock: 10,
    },
  ];

  const createdProducts: Record<string, any> = {};
  for (const p of rawProducts) {
    const prod = await prisma.product.create({
      data: {
        name: p.name,
        description: p.description,
        category: p.category,
        price: p.price,
        minStock: p.minStock,
        active: true,
      },
    });
    createdProducts[p.name] = prod;
  }
  console.log(`✅ ${rawProducts.length} Productos de VitaJuice creados.`);

  // 5. RECETAS / FICHAS TÉCNICAS (Relación Producto ↔ Insumos necesarios por unidad)
  // Esta es la base matemática para el costo de producción y margen real
  const recipes = [
    // Shot Inmune
    { prod: 'Shot Inmune (60ml)', supply: 'Jengibre fresco (Kion)', qty: 15 }, // 15g
    { prod: 'Shot Inmune (60ml)', supply: 'Cúrcuma fresca', qty: 5 }, // 5g
    { prod: 'Shot Inmune (60ml)', supply: 'Limón sutil exprimido', qty: 20 }, // 20ml
    { prod: 'Shot Inmune (60ml)', supply: 'Zumo de naranja valencia', qty: 20 }, // 20ml
    { prod: 'Shot Inmune (60ml)', supply: 'Botella PET 60ml grado alimentario', qty: 1 },
    { prod: 'Shot Inmune (60ml)', supply: 'Tapa rosca con precinto 28mm', qty: 1 },

    // Shot Detox
    { prod: 'Shot Detox (60ml)', supply: 'Espinaca baby fresca', qty: 15 }, // 15g
    { prod: 'Shot Detox (60ml)', supply: 'Manzana verde', qty: 20 }, // 20g
    { prod: 'Shot Detox (60ml)', supply: 'Pepino holandés', qty: 15 }, // 15g
    { prod: 'Shot Detox (60ml)', supply: 'Limón sutil exprimido', qty: 10 }, // 10ml
    { prod: 'Shot Detox (60ml)', supply: 'Botella PET 60ml grado alimentario', qty: 1 },
    { prod: 'Shot Detox (60ml)', supply: 'Tapa rosca con precinto 28mm', qty: 1 },

    // Shot Anti-inflamatorio
    { prod: 'Shot Anti-inflamatorio (60ml)', supply: 'Cúrcuma fresca', qty: 15 },
    { prod: 'Shot Anti-inflamatorio (60ml)', supply: 'Jengibre fresco (Kion)', qty: 10 },
    { prod: 'Shot Anti-inflamatorio (60ml)', supply: 'Piña golden fresca', qty: 25 },
    { prod: 'Shot Anti-inflamatorio (60ml)', supply: 'Botella PET 60ml grado alimentario', qty: 1 },
    { prod: 'Shot Anti-inflamatorio (60ml)', supply: 'Tapa rosca con precinto 28mm', qty: 1 },

    // Shot Energy
    { prod: 'Shot Energy (60ml)', supply: 'Maca negra en polvo', qty: 5 },
    { prod: 'Shot Energy (60ml)', supply: 'Miel pura de abeja', qty: 10 },
    { prod: 'Shot Energy (60ml)', supply: 'Zumo de naranja valencia', qty: 35 },
    { prod: 'Shot Energy (60ml)', supply: 'Botella PET 60ml grado alimentario', qty: 1 },
    { prod: 'Shot Energy (60ml)', supply: 'Tapa rosca con precinto 28mm', qty: 1 },
  ];

  for (const r of recipes) {
    if (createdProducts[r.prod] && createdSupplies[r.supply]) {
      await prisma.recipeItem.create({
        data: {
          productId: createdProducts[r.prod].id,
          supplyId: createdSupplies[r.supply].id,
          quantityNeeded: r.qty,
        },
      });
    }
  }
  console.log('✅ Fichas técnicas (Recetas) vinculadas para cálculo de costo de producción.');

  // 6. CLIENTES REALES (Canal WhatsApp)
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        name: 'Camila Rodriguez',
        phone: '987654321',
        email: 'camila.rodriguez@gmail.com',
        address: 'Calle Los Pinos 245, Dpto 402, Miraflores, Lima',
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Rodrigo Mendoza',
        phone: '912345678',
        email: 'rodrigo.mendoza@outlook.com',
        address: 'Av. Dos de Mayo 1150, San Isidro, Lima',
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Gimnasio FitZone Surco (Contacto: Valeria)',
        phone: '998877665',
        email: 'ventas@fitzonesurco.pe',
        address: 'Av. Primavera 650, Santiago de Surco, Lima',
      },
    }),
  ]);
  console.log('✅ Clientes de prueba registrados.');

  // 7. PEDIDOS DE PRUEBA (Incluye casos pagados y un caso estancado para alerta)
  const dateOldPending = new Date();
  dateOldPending.setDate(now.getDate() - 4); // Pedido de hace 4 días sin pagar -> ALERTA

  // Pedido 1: Pagado con Culqi y entregado
  const order1 = await prisma.order.create({
    data: {
      orderNumber: 'VJ-2026-001',
      customerId: customers[0].id,
      userId: admin.id,
      status: OrderStatus.ENTREGADO,
      paymentStatus: PaymentStatus.PAGADO,
      totalAmount: 65.00,
      paymentMethod: 'CULQI',
      deliveryDate: new Date(),
      notes: 'Entregar en portería. Cliente recurrente de WhatsApp.',
      items: {
        create: [
          {
            productId: createdProducts['Pack Semanal (7 Shots Surtidos)'].id,
            quantity: 1,
            unitPrice: 50.00,
            subtotal: 50.00,
          },
          {
            productId: createdProducts['Shot Inmune (60ml)'].id,
            quantity: 2,
            unitPrice: 7.50,
            subtotal: 15.00,
          },
        ],
      },
    },
  });

  // Registro de pago en Culqi
  await prisma.payment.create({
    data: {
      orderId: order1.id,
      provider: 'CULQI',
      transactionId: 'chr_test_66f2c6947230da37a1b2c3d4',
      amount: 65.00,
      currency: 'PEN',
      status: 'SUCCESS',
      payload: {
        outcome: { type: 'venta_exitosa', code: 'AUT000' },
        source: { card_number: '4111********1111', brand: 'Visa' },
      },
    },
  });

  // Pedido 2: En preparación, pagado por Yape
  await prisma.order.create({
    data: {
      orderNumber: 'VJ-2026-002',
      customerId: customers[1].id,
      userId: admin.id,
      status: OrderStatus.EN_PREPARACION,
      paymentStatus: PaymentStatus.PAGADO,
      totalAmount: 31.00,
      paymentMethod: 'YAPE',
      deliveryDate: new Date(),
      notes: 'Enviar comprobante Yape al 912345678.',
      items: {
        create: [
          {
            productId: createdProducts['Shot Inmune (60ml)'].id,
            quantity: 2,
            unitPrice: 7.50,
            subtotal: 15.00,
          },
          {
            productId: createdProducts['Shot Energy (60ml)'].id,
            quantity: 2,
            unitPrice: 8.00,
            subtotal: 16.00,
          },
        ],
      },
    },
  });

  // Pedido 3: PENDIENTE hace 4 días (⚠️ DISPARA ALERTA DE PEDIDO ESTANCADO)
  await prisma.order.create({
    data: {
      orderNumber: 'VJ-2026-003',
      customerId: customers[2].id,
      userId: admin.id,
      status: OrderStatus.PENDIENTE,
      paymentStatus: PaymentStatus.PENDIENTE,
      totalAmount: 150.00,
      paymentMethod: 'TRANSFERENCIA',
      createdAt: dateOldPending,
      notes: 'Gimnasio pidió cotización de 20 shots surtidos, aún no confirma depósito.',
      items: {
        create: [
          {
            productId: createdProducts['Pack Semanal (7 Shots Surtidos)'].id,
            quantity: 3,
            unitPrice: 50.00,
            subtotal: 150.00,
          },
        ],
      },
    },
  });

  console.log('✅ Pedidos de prueba registrados (completados, en proceso y pendiente antiguo).');
  console.log('🎉 Seed finalizado con éxito para VitaJuice by Rena.');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
