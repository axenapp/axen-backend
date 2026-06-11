import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST ?? 'localhost',
  port: Number(process.env.DATABASE_PORT) ?? 5432,
  username: process.env.DATABASE_USER ?? 'postgres',
  password: process.env.DATABASE_PASSWORD ?? 'postgres',
  database: process.env.DATABASE_NAME ?? 'axen_db',
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  synchronize: false,
});

// Horarios por defecto si el partner no tiene schedule configurado
const DEFAULT_HOURS = [9, 10, 11, 12, 14, 15, 16, 17];
const DEFAULT_DAYS = [1, 2, 3, 4, 5, 6]; // lun-sab

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}

function generateDatetimes(
  durationMinutes: number,
  schedule: any | null,
  daysAhead = 30,
): Date[] {
  const datetimes: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  for (let day = 1; day <= daysAhead; day++) {
    const date = new Date(today);
    date.setDate(today.getDate() + day);
    const dayName = DAY_NAMES[date.getDay()];
    const dayNum = date.getDay();

    if (schedule) {
      // Usar schedule del partner
      const daySchedule = schedule[dayName];
      if (!daySchedule) continue;

      const openMins = timeToMinutes(daySchedule.open);
      const closeMins = timeToMinutes(daySchedule.close);
      let current = openMins;

      while (current + durationMinutes <= closeMins) {
        const dt = new Date(date);
        dt.setHours(Math.floor(current / 60), current % 60, 0, 0);
        datetimes.push(dt);
        current += durationMinutes;
      }
    } else {
      // Usar defaults: lun-sab, horarios fijos
      if (!DEFAULT_DAYS.includes(dayNum)) continue;

      for (const hour of DEFAULT_HOURS) {
        const dt = new Date(date);
        dt.setHours(hour, 0, 0, 0);
        datetimes.push(dt);
      }
    }
  }

  return datetimes;
}

async function seed() {
  await AppDataSource.initialize();
  console.log('✅ Conectado a la base de datos');

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // ─── 1. Limpiar y recrear partner de demo ─────────────────────────────
    await queryRunner.query(`DELETE FROM slots WHERE partner_id IN (SELECT id FROM partners WHERE name = 'Peluquería Axen Demo')`);
    await queryRunner.query(`DELETE FROM services WHERE partner_id IN (SELECT id FROM partners WHERE name = 'Peluquería Axen Demo')`);
    await queryRunner.query(`DELETE FROM partners WHERE name = 'Peluquería Axen Demo'`);
    await queryRunner.query(`DELETE FROM users WHERE email = 'partner@axen.demo'`);
    console.log('🧹 Datos previos del demo limpiados');

    const passwordHash = await bcrypt.hash('Demo1234', 12);
    const userResult = await queryRunner.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'partner') RETURNING id`,
      ['Peluquería Axen Demo', 'partner@axen.demo', passwordHash],
    );
    const userId = userResult[0].id;

    const scheduleDemo = {
      monday:    { open: '09:00', close: '18:00' },
      tuesday:   { open: '09:00', close: '18:00' },
      wednesday: { open: '09:00', close: '18:00' },
      thursday:  { open: '09:00', close: '18:00' },
      friday:    { open: '09:00', close: '18:00' },
      saturday:  { open: '09:00', close: '14:00' },
      sunday:    null,
    };

    const partnerResult = await queryRunner.query(
      `INSERT INTO partners (user_id, name, description, address, status, cancel_window_hours, schedule)
       VALUES ($1, $2, $3, $4, 'active', 2, $5) RETURNING id`,
      [
        userId,
        'Peluquería Axen Demo',
        'Peluquería unisex en el centro. Cortes, tinturas y tratamientos capilares.',
        'Av. Corrientes 1234, Buenos Aires',
        JSON.stringify(scheduleDemo),
      ],
    );
    const demoPartnerId = partnerResult[0].id;
    console.log(`👤 Demo partner creado: partner@axen.demo / Demo1234`);

    const demoServices = [
      { name: 'Corte de cabello', description: 'Corte clásico o moderno a elección', duration: 30, price: 3500 },
      { name: 'Corte + Barba', description: 'Corte de cabello y arreglo de barba', duration: 45, price: 5000 },
    ];

    for (const s of demoServices) {
      const sResult = await queryRunner.query(
        `INSERT INTO services (partner_id, name, description, duration_minutes, price, is_active)
         VALUES ($1, $2, $3, $4, $5, true) RETURNING id`,
        [demoPartnerId, s.name, s.description, s.duration, s.price],
      );
      const datetimes = generateDatetimes(s.duration, scheduleDemo);
      for (const dt of datetimes) {
        await queryRunner.query(
          `INSERT INTO slots (service_id, partner_id, datetime, status) VALUES ($1, $2, $3, 'free')`,
          [sResult[0].id, demoPartnerId, dt.toISOString()],
        );
      }
    }
    console.log(`✂️  Demo: servicios y slots generados`);

    // ─── 2. Regenerar slots para todos los partners activos existentes ────
    console.log('\n📅 Regenerando slots para partners existentes...');

    // Eliminar slots futuros libres de todos los partners (excepto demo recién creado)
    await queryRunner.query(`
      DELETE FROM slots
      WHERE status = 'free'
      AND datetime > NOW()
      AND partner_id != $1
    `, [demoPartnerId]);

    // Obtener todos los servicios activos con su partner activo
    const services = await queryRunner.query(`
      SELECT s.id as service_id, s.duration_minutes, s.partner_id, p.name as partner_name, p.schedule
      FROM services s
      JOIN partners p ON p.id = s.partner_id
      WHERE s.is_active = true
        AND p.status = 'active'
        AND p.id != $1
    `, [demoPartnerId]);

    let totalSlots = 0;

    for (const service of services) {
      const schedule = service.schedule ?? null;
      const datetimes = generateDatetimes(service.duration_minutes, schedule);

      for (const dt of datetimes) {
        await queryRunner.query(
          `INSERT INTO slots (service_id, partner_id, datetime, status) VALUES ($1, $2, $3, 'free')`,
          [service.service_id, service.partner_id, dt.toISOString()],
        );
      }

      totalSlots += datetimes.length;
      console.log(`  ✅ ${service.partner_name} — ${datetimes.length} slots`);
    }

    console.log(`\n📊 Total slots generados para partners existentes: ${totalSlots}`);

    await queryRunner.commitTransaction();
    console.log('\n🎉 Seed completado exitosamente!');
    console.log('─────────────────────────────────');
    console.log('Demo login:');
    console.log('  Email:    partner@axen.demo');
    console.log('  Password: Demo1234');
    console.log('─────────────────────────────────');
    console.log('Usuario de prueba:');
    console.log('  Email:    flor@axen.com');
    console.log('  Password: Axen1234');
    console.log('─────────────────────────────────');

  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('❌ Error en el seed:', error);
    throw error;
  } finally {
    await queryRunner.release();
    await AppDataSource.destroy();
  }
}

seed().catch(console.error);
