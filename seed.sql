-- =====================
-- PARTNERS
-- =====================
INSERT INTO partners (id, user_id, name, description, address, lat, lng, status, cancel_window_hours, created_at, updated_at) VALUES
  ('a1000001-0000-0000-0000-000000000001', '4998fce7-521e-4828-a2bb-6e6402005091', 'VetNova', 'Clínica veterinaria integral para mascotas. Consultas, vacunas, cirugías y urgencias.', 'Av. Cabildo 1520, Belgrano, CABA', -34.5627, -58.4567, 'active', 24, now(), now()),
  ('a1000001-0000-0000-0000-000000000002', '8e86983f-11bf-4576-acdd-28bcdf15a4fc', 'Bruma Studio', 'Peluquería y coloración profesional. Especialistas en tratamientos capilares y cortes de tendencia.', 'Thames 1830, Palermo, CABA', -34.5847, -58.4279, 'active', 12, now(), now()),
  ('a1000001-0000-0000-0000-000000000003', 'd04c92a2-55bb-4784-b646-8bd92fe3a1dc', 'Barba & Brea Barbería', 'Barbería clásica con estilo moderno. Cortes, afeitados y arreglos de barba.', 'Av. Corrientes 3240, Almagro, CABA', -34.6034, -58.4198, 'active', 6, now(), now()),
  ('a1000001-0000-0000-0000-000000000004', 'c7e4b08e-db14-4f1a-ab67-4105bd73a764', 'Salon Ivy', 'Salón de belleza integral. Cortes, coloración, tratamientos y uñas.', 'Av. Santa Fe 2890, Recoleta, CABA', -34.5956, -58.4062, 'active', 12, now(), now()),
  ('a1000001-0000-0000-0000-000000000005', '786e06d8-ee92-4d50-9dee-9b076aee9c40', 'Juan D''Elia Estilista', 'Estilista profesional con más de 15 años de experiencia. Especialista en coloración y cortes personalizados.', 'Gurruchaga 1647, Palermo Soho, CABA', -34.5891, -58.4341, 'active', 12, now(), now()),
  ('a1000001-0000-0000-0000-000000000006', '6c5001d3-3e4e-477e-8efd-cd1a8893a4d0', 'BrilloExpres', 'Auto detailing y lavado profesional. Dejamos tu auto como nuevo.', 'Av. Juan B. Justo 4521, Villa Crespo, CABA', -34.5984, -58.4456, 'active', 4, now(), now()),
  ('a1000001-0000-0000-0000-000000000007', '64044b4b-de8b-4c03-8795-caa2f85a9270', 'Juan & Cañería', 'Plomería y gasfitería profesional. Reparaciones, instalaciones y urgencias 24hs.', 'Av. Rivadavia 5430, Caballito, CABA', -34.6198, -58.4432, 'active', 2, now(), now()),
  ('a1000001-0000-0000-0000-000000000008', '3bc870c1-1940-44c0-8b91-e36857768892', 'Glow Skin Lab', 'Centro de estética avanzada. Tratamientos faciales, corporales y depilación láser.', 'Av. del Libertador 3240, Núñez, CABA', -34.5487, -58.4612, 'active', 24, now(), now()),
  ('a1000001-0000-0000-0000-000000000009', '4f05e647-92dd-4fc1-954c-f096b6c6fd87', 'Luna Nails & Lashes', 'Nail art, extensiones de uñas y lifting de pestañas. Resultados que duran.', 'Honduras 4876, Palermo, CABA', -34.5867, -58.4312, 'active', 8, now(), now());

-- =====================
-- SERVICES
-- =====================

-- VetNova
INSERT INTO services (id, partner_id, name, description, duration_minutes, price, is_active, created_at, updated_at) VALUES
  ('b1000001-0000-0000-0000-000000000001', 'a1000001-0000-0000-0000-000000000001', 'Consulta General', 'Revisación clínica completa de tu mascota.', 30, 8500.00, true, now(), now()),
  ('b1000001-0000-0000-0000-000000000002', 'a1000001-0000-0000-0000-000000000001', 'Vacunación', 'Aplicación de vacunas según esquema sanitario.', 20, 6000.00, true, now(), now()),
  ('b1000001-0000-0000-0000-000000000003', 'a1000001-0000-0000-0000-000000000001', 'Baño y Peluquería Canina', 'Baño, secado y corte según raza.', 90, 12000.00, true, now(), now());

-- Bruma Studio
INSERT INTO services (id, partner_id, name, description, duration_minutes, price, is_active, created_at, updated_at) VALUES
  ('b1000001-0000-0000-0000-000000000004', 'a1000001-0000-0000-0000-000000000002', 'Lavado + Corte', 'Incluye lavado, corte según estilo solicitado y peinado.', 45, 10000.00, true, now(), now()),
  ('b1000001-0000-0000-0000-000000000005', 'a1000001-0000-0000-0000-000000000002', 'Coloración', 'Coloración completa con productos profesionales.', 120, 16000.00, true, now(), now()),
  ('b1000001-0000-0000-0000-000000000006', 'a1000001-0000-0000-0000-000000000002', 'Brushing', 'Lavado y brushing profesional.', 45, 12000.00, true, now(), now()),
  ('b1000001-0000-0000-0000-000000000007', 'a1000001-0000-0000-0000-000000000002', 'Peinado para Evento', 'Peinado especial para eventos y ocasiones.', 90, 20000.00, true, now(), now());

-- Barba & Brea
INSERT INTO services (id, partner_id, name, description, duration_minutes, price, is_active, created_at, updated_at) VALUES
  ('b1000001-0000-0000-0000-000000000008', 'a1000001-0000-0000-0000-000000000003', 'Corte de Cabello', 'Corte clásico o moderno a elección.', 30, 7000.00, true, now(), now()),
  ('b1000001-0000-0000-0000-000000000009', 'a1000001-0000-0000-0000-000000000003', 'Corte + Barba', 'Corte de cabello y arreglo de barba completo.', 50, 11000.00, true, now(), now()),
  ('b1000001-0000-0000-0000-000000000010', 'a1000001-0000-0000-0000-000000000003', 'Afeitado Clásico', 'Afeitado con navaja y toalla caliente.', 40, 9000.00, true, now(), now());

-- Salon Ivy
INSERT INTO services (id, partner_id, name, description, duration_minutes, price, is_active, created_at, updated_at) VALUES
  ('b1000001-0000-0000-0000-000000000011', 'a1000001-0000-0000-0000-000000000004', 'Corte y Peinado', 'Corte personalizado con peinado incluido.', 60, 13000.00, true, now(), now()),
  ('b1000001-0000-0000-0000-000000000012', 'a1000001-0000-0000-0000-000000000004', 'Mechas', 'Mechas balayage o californianas.', 150, 25000.00, true, now(), now()),
  ('b1000001-0000-0000-0000-000000000013', 'a1000001-0000-0000-0000-000000000004', 'Manicura', 'Limpieza y esmaltado de uñas.', 45, 7500.00, true, now(), now());

-- Juan D'Elia
INSERT INTO services (id, partner_id, name, description, duration_minutes, price, is_active, created_at, updated_at) VALUES
  ('b1000001-0000-0000-0000-000000000014', 'a1000001-0000-0000-0000-000000000005', 'Corte Personalizado', 'Diagnóstico capilar y corte a medida.', 60, 15000.00, true, now(), now()),
  ('b1000001-0000-0000-0000-000000000015', 'a1000001-0000-0000-0000-000000000005', 'Coloración Técnica', 'Técnica de color avanzada personalizada.', 180, 35000.00, true, now(), now()),
  ('b1000001-0000-0000-0000-000000000016', 'a1000001-0000-0000-0000-000000000005', 'Tratamiento Keratina', 'Alisado y nutrición profunda con keratina.', 120, 28000.00, true, now(), now());

-- BrilloExpres
INSERT INTO services (id, partner_id, name, description, duration_minutes, price, is_active, created_at, updated_at) VALUES
  ('b1000001-0000-0000-0000-000000000017', 'a1000001-0000-0000-0000-000000000006', 'Lavado Exterior', 'Lavado completo exterior con secado.', 30, 5000.00, true, now(), now()),
  ('b1000001-0000-0000-0000-000000000018', 'a1000001-0000-0000-0000-000000000006', 'Lavado Full', 'Lavado exterior e interior completo.', 60, 9000.00, true, now(), now()),
  ('b1000001-0000-0000-0000-000000000019', 'a1000001-0000-0000-0000-000000000006', 'Detailing Completo', 'Pulido, encerado y limpieza profunda interior.', 180, 25000.00, true, now(), now());

-- Juan & Cañería
INSERT INTO services (id, partner_id, name, description, duration_minutes, price, is_active, created_at, updated_at) VALUES
  ('b1000001-0000-0000-0000-000000000020', 'a1000001-0000-0000-0000-000000000007', 'Diagnóstico de Cañerías', 'Revisión e inspección de instalaciones.', 45, 8000.00, true, now(), now()),
  ('b1000001-0000-0000-0000-000000000021', 'a1000001-0000-0000-0000-000000000007', 'Destapación', 'Destapación de cañerías con herramientas profesionales.', 60, 12000.00, true, now(), now()),
  ('b1000001-0000-0000-0000-000000000022', 'a1000001-0000-0000-0000-000000000007', 'Instalación Sanitaria', 'Instalación de artefactos sanitarios.', 120, 20000.00, true, now(), now());

-- Glow Skin Lab
INSERT INTO services (id, partner_id, name, description, duration_minutes, price, is_active, created_at, updated_at) VALUES
  ('b1000001-0000-0000-0000-000000000023', 'a1000001-0000-0000-0000-000000000008', 'Limpieza Facial Profunda', 'Limpieza, extracción y tratamiento hidratante.', 60, 14000.00, true, now(), now()),
  ('b1000001-0000-0000-0000-000000000024', 'a1000001-0000-0000-0000-000000000008', 'Depilación Láser Zona Chica', 'Axilas, bozo o entrecejo.', 30, 10000.00, true, now(), now()),
  ('b1000001-0000-0000-0000-000000000025', 'a1000001-0000-0000-0000-000000000008', 'Hidratación Profunda', 'Tratamiento facial hidratante con ácido hialurónico.', 75, 18000.00, true, now(), now());

-- Luna Nails & Lashes
INSERT INTO services (id, partner_id, name, description, duration_minutes, price, is_active, created_at, updated_at) VALUES
  ('b1000001-0000-0000-0000-000000000026', 'a1000001-0000-0000-0000-000000000009', 'Esmaltado Semipermanente', 'Esmaltado gel de larga duración.', 60, 9000.00, true, now(), now()),
  ('b1000001-0000-0000-0000-000000000027', 'a1000001-0000-0000-0000-000000000009', 'Extensiones de Uñas', 'Extensiones en acrílico o gel a elección.', 90, 16000.00, true, now(), now()),
  ('b1000001-0000-0000-0000-000000000028', 'a1000001-0000-0000-0000-000000000009', 'Lifting de Pestañas', 'Lifting y tinte de pestañas naturales.', 75, 13000.00, true, now(), now());

-- =====================
-- SLOTS (próximos 5 días, horarios 9hs a 18hs cada 1hs)
-- =====================
INSERT INTO slots (id, service_id, partner_id, datetime, status, created_at, updated_at)
SELECT
  uuid_generate_v4(),
  s.id,
  s.partner_id,
  (CURRENT_DATE + (d || ' days')::interval + (h || ' hours')::interval),
  'free',
  now(),
  now()
FROM services s
CROSS JOIN generate_series(1, 5) AS d
CROSS JOIN generate_series(9, 18) AS h
WHERE s.partner_id != 'a1000001-0000-0000-0000-000000000007'; -- Juan & Cañería no tiene horarios fijos
