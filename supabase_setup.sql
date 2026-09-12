-- ============================================================================
-- SCRIPT DE INICIALIZACIÓN DIRECTA PARA SUPABASE SQL EDITOR
-- Proyecto: VitaJuice by Rena (ISIL - Proyecto Tecnológico)
-- Este script crea todas las tablas y puebla los datos reales sin usar terminal.
-- ============================================================================

-- 1. LIMPIEZA PREVIA (Por si se vuelve a ejecutar)
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS recipe_items CASCADE;
DROP TABLE IF EXISTS supply_purchases CASCADE;
DROP TABLE IF EXISTS supplies CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2. CREACIÓN DE TABLAS

-- Usuarios
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'ADMIN',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clientes (WhatsApp)
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    email TEXT,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Catálogo de Shots y Jugos
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'SHOT',
    price NUMERIC(10, 2) NOT NULL,
    min_stock INT DEFAULT 10,
    active BOOLEAN DEFAULT TRUE,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insumos / Materia Prima
CREATE TABLE supplies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    unit TEXT NOT NULL,
    current_stock NUMERIC(10, 2) DEFAULT 0.00,
    min_stock_alert NUMERIC(10, 2) DEFAULT 100.00,
    last_cost NUMERIC(10, 3) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Compras de Insumos y Trazabilidad de Vencimientos
CREATE TABLE supply_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supply_id UUID REFERENCES supplies(id) ON DELETE CASCADE,
    quantity NUMERIC(10, 2) NOT NULL,
    unit_cost NUMERIC(10, 3) NOT NULL,
    total_cost NUMERIC(10, 2) NOT NULL,
    purchase_date TIMESTAMPTZ DEFAULT NOW(),
    expiration_date TIMESTAMPTZ,
    supplier TEXT,
    batch_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ficha Técnica / Recetas (Relación Producto ↔ Insumos)
CREATE TABLE recipe_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    supply_id UUID REFERENCES supplies(id) ON DELETE RESTRICT,
    quantity_needed NUMERIC(10, 3) NOT NULL,
    UNIQUE(product_id, supply_id)
);

-- Pedidos y Ventas
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id),
    user_id UUID REFERENCES users(id),
    status TEXT DEFAULT 'PENDIENTE',
    payment_status TEXT DEFAULT 'PENDIENTE',
    total_amount NUMERIC(10, 2) NOT NULL,
    payment_method TEXT,
    delivery_date TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Detalle de Pedidos
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    quantity INT NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL
);

-- Pagos (Culqi Sandbox)
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    provider TEXT DEFAULT 'CULQI',
    transaction_id TEXT UNIQUE NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT DEFAULT 'PEN',
    status TEXT NOT NULL,
    payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deshabilitar RLS para permitir lectura y escritura desde la aplicación web pública
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE supplies DISABLE ROW LEVEL SECURITY;
ALTER TABLE supply_purchases DISABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;

-- 3. INSERTAR DATOS INICIALES (SEED DE VITAJUICE)

-- Usuario Admin (password: admin123 con hash bcrypt)
INSERT INTO users (id, email, password, name, role, active)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'admin@vitajuice.pe',
    '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lR0e9W1kO71yXJ1v4u9d3hV8iZ0qC',
    'Administrador VitaJuice',
    'ADMIN',
    TRUE
);

-- Insumos
INSERT INTO supplies (id, name, unit, current_stock, min_stock_alert, last_cost) VALUES
('b0000000-0000-0000-0000-000000000001', 'Jengibre fresco (Kion)', 'g', 12500, 2000, 0.015),
('b0000000-0000-0000-0000-000000000002', 'Cúrcuma fresca', 'g', 450, 1500, 0.020), -- STOCK BAJO (Alerta)
('b0000000-0000-0000-0000-000000000003', 'Limón sutil exprimido', 'ml', 18000, 3000, 0.008),
('b0000000-0000-0000-0000-000000000004', 'Zumo de naranja valencia', 'ml', 25000, 5000, 0.006),
('b0000000-0000-0000-0000-000000000005', 'Espinaca baby fresca', 'g', 8000, 1500, 0.012),
('b0000000-0000-0000-0000-000000000006', 'Manzana verde', 'g', 15000, 3000, 0.007),
('b0000000-0000-0000-0000-000000000007', 'Piña golden fresca', 'g', 6000, 1500, 0.006),
('b0000000-0000-0000-0000-000000000008', 'Botella PET 60ml alimentaria', 'unidad', 2200, 500, 0.450),
('b0000000-0000-0000-0000-000000000009', 'Tapa rosca con precinto 28mm', 'unidad', 2500, 500, 0.150);

-- Compras de Insumos (Incluye lote con vencimiento próximo)
INSERT INTO supply_purchases (supply_id, quantity, unit_cost, total_cost, purchase_date, expiration_date, supplier, batch_number) VALUES
('b0000000-0000-0000-0000-000000000007', 6000, 0.006, 36.00, NOW(), NOW() + INTERVAL '3 days', 'Frutas San Luis', 'LOTE-PIN-0402'),
('b0000000-0000-0000-0000-000000000001', 15000, 0.015, 225.00, NOW(), NOW() + INTERVAL '25 days', 'Agro Selva', 'LOTE-JEN-1108'),
('b0000000-0000-0000-0000-000000000008', 2500, 0.450, 1125.00, NOW(), NULL, 'Envases Perú', 'LOTE-PET-991');

-- Los 7 Shots de VitaJuice + Packs
INSERT INTO products (id, name, description, category, price, min_stock, active) VALUES
('c0000000-0000-0000-0000-000000000001', 'Shot Inmune (60ml)', 'Jengibre, Cúrcuma, Limón, Naranja y pimienta.', 'SHOT', 7.50, 20, TRUE),
('c0000000-0000-0000-0000-000000000002', 'Shot Detox (60ml)', 'Espinaca baby, Manzana verde, Pepino y Limón.', 'SHOT', 7.50, 20, TRUE),
('c0000000-0000-0000-0000-000000000003', 'Shot Energy (60ml)', 'Maca negra, Cacao puro y Miel pura de abeja.', 'SHOT', 8.00, 15, TRUE),
('c0000000-0000-0000-0000-000000000004', 'Shot Glow (60ml)', 'Cúrcuma, Naranja, Zanahoria y Beterraga.', 'SHOT', 7.50, 15, TRUE),
('c0000000-0000-0000-0000-000000000005', 'Shot Anti-inflamatorio (60ml)', 'Cúrcuma concentrada, Jengibre y Piña golden.', 'SHOT', 8.00, 15, TRUE),
('c0000000-0000-0000-0000-000000000006', 'Shot Digestivo (60ml)', 'Sábila/Aloe fresco, Menta y Limón sutil.', 'SHOT', 7.50, 15, TRUE),
('c0000000-0000-0000-0000-000000000007', 'Shot Relax (60ml)', 'Infusión botánica concentrada de Manzanilla y Maracuyá.', 'SHOT', 8.00, 15, TRUE),
('c0000000-0000-0000-0000-000000000008', 'Pack Semanal (7 Shots)', '1 shot de cada sabor para tu rutina semanal.', 'PACK', 50.00, 10, TRUE),
('c0000000-0000-0000-0000-000000000009', 'Jugo Verde Cold-Pressed 350ml', 'Prensado en frío de Manzana verde y Espinaca.', 'JUICE', 14.00, 10, TRUE);

-- Recetas (Fichas Técnicas para Shot Inmune)
INSERT INTO recipe_items (product_id, supply_id, quantity_needed) VALUES
('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 15.000), -- 15g Kion
('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 5.000),  -- 5g Cúrcuma
('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 20.000), -- 20ml Limón
('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', 20.000), -- 20ml Naranja
('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000008', 1.000),  -- 1 botella
('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000009', 1.000);  -- 1 tapa

-- Clientes
INSERT INTO customers (id, name, phone, email, address) VALUES
('d0000000-0000-0000-0000-000000000001', 'Camila Rodriguez', '987654321', 'camila@gmail.com', 'Calle Los Pinos 245, Miraflores'),
('d0000000-0000-0000-0000-000000000002', 'Rodrigo Mendoza', '912345678', 'rodrigo@outlook.com', 'Av. Dos de Mayo 1150, San Isidro'),
('d0000000-0000-0000-0000-000000000003', 'Gimnasio FitZone Surco', '998877665', 'ventas@fitzone.pe', 'Av. Primavera 650, Surco');

-- Pedidos Iniciales
INSERT INTO orders (id, order_number, customer_id, user_id, status, payment_status, total_amount, payment_method, notes, created_at) VALUES
('e0000000-0000-0000-0000-000000000001', 'VJ-2026-001', 'd0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'ENTREGADO', 'PAGADO', 65.00, 'CULQI', 'Cliente recurrente WhatsApp', NOW()),
('e0000000-0000-0000-0000-000000000002', 'VJ-2026-002', 'd0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'EN_PREPARACION', 'PAGADO', 31.00, 'YAPE', 'Enviar comprobante por WhatsApp', NOW()),
('e0000000-0000-0000-0000-000000000003', 'VJ-2026-003', 'd0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'PENDIENTE', 'PENDIENTE', 150.00, 'TRANSFERENCIA', 'Pedido de prueba antiguo sin pagar', NOW() - INTERVAL '4 days');

-- Detalle Pedido 1
INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal) VALUES
('e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000008', 1, 50.00, 50.00),
('e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 2, 7.50, 15.00);

-- Pago Culqi
INSERT INTO payments (order_id, provider, transaction_id, amount, currency, status, payload) VALUES
('e0000000-0000-0000-0000-000000000001', 'CULQI', 'chr_test_66f2c6947230da37', 65.00, 'PEN', 'SUCCESS', '{"outcome": {"type": "venta_exitosa"}}'::jsonb);
