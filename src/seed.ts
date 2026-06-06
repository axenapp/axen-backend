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

async function seed() {
  await AppDataSource.initialize();
  console.log('✅ Conectado a la base de datos');

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // ─── Limpiar datos previos del seed ───────────────────────────────────
    await queryRunner.query(`DELETE FROM slots WHERE partner_id IN (SELECT id FROM partners WHERE name = 'Peluquería Axen Demo')`);
    await queryRunner.query(`DELETE FROM services WHERE partner_id IN (SELECT id FROM partners WHERE name = 'Peluquería Axen Demo')`);
    await queryRunner.query(`DELETE FROM partners WHERE name = 'Peluquería Axen Demo'`);
    await queryRunner.query(`DELETE FROM users WHERE email = 'partner@axen.demo'`);
    console.log('🧹 Datos previos limpiados');

    // ─── Usuario partner ──────────────────────────────────────────────────
    const passwordHash = await bcrypt.hash('Demo1234', 12);
    const userResult = await queryRunner.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'partner')
       RETURNING id`,
      ['Peluquería Axen Demo', 'partner@axen.demo', passwordHash],
    );
    const userId = userResult[0].id;
    console.log(`👤 Usuario partner creado: partner@axen.demo / Demo1234`);

    // ─── Partner ──────────────────────────────────────────────────────────
    const partnerResult = await queryRunner.query(
      `INSERT INTO partners (user_id, name, description, address, status, cancel_window_hours)
       VALUES ($1, $2, $3, $4, 'active', 2)
       RETURNING id`,
      [
        userId,
        'Peluquería Axen Demo',
        'Peluquería unisex en el centro. Cortes, tinturas y tratamientos capilares.',
        'Av. Corrientes 1234, Buenos Aires',
      ],
    );
    const partnerId = partnerResult[0].id;
    console.log(`🏪 Partner creado: ${partnerId}`);

    // ─── Servicios ────────────────────────────────────────────────────────
    const service1 = await queryRunner.query(
      `INSERT INTO services (partner_id, name, description, duration_minutes, price, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id`,
      [partnerId, 'Corte de cabello', 'Corte clásico o moderno a elección', 30, 3500],
    );
    const service2 = await queryRunner.query(
      `INSERT INTO services (partner_id, name, description, duration_minutes, price, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id`,
      [partnerId, 'Corte + Barba', 'Corte de cabello y arreglo de barba', 45, 5000],
    );
    console.log(`✂️  Servicios creados`);

    // ─── Slots (próximos 7 días, 09:00 a 18:00 cada hora) ────────────────
    const serviceIds = [service1[0].id, service2[0].id];
    const hours = [9, 10, 11, 12, 14, 15, 16, 17];
    let slotsCreated = 0;

    for (let day = 1; day <= 7; day++) {
      const date = new Date();
      date.setDate(date.getDate() + day);
      date.setHours(0, 0, 0, 0);

      for (const serviceId of serviceIds) {
        for (const hour of hours) {
          const datetime = new Date(date);
          datetime.setHours(hour, 0, 0, 0);

          await queryRunner.query(
            `INSERT INTO slots (service_id, partner_id, datetime, status)
             VALUES ($1, $2, $3, 'free')`,
            [serviceId, partnerId, datetime.toISOString()],
          );
          slotsCreated++;
        }
      }
    }
    console.log(`📅 ${slotsCreated} slots creados para los próximos 7 días`);

    await queryRunner.commitTransaction();
    console.log('\n🎉 Seed completado exitosamente!');
    console.log('─────────────────────────────────');
    console.log('Partner login:');
    console.log('  Email:    partner@axen.demo');
    console.log('  Password: Demo1234');
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
