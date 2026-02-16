import { NestFactory } from '@nestjs/core';
import { AppModule } from 'src/app.module';
import { PgService } from 'src/db/pg.service';
import { classifications } from 'src/data/classification';
import { stages } from 'src/data/stage';
import { roles } from 'src/data/role';
import { documents } from 'src/data/document';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const pg = app.get(PgService);
  const client = await pg.getClient();

  try {
    await client.query('BEGIN');
    await client.query(`
      TRUNCATE TABLE
        ref.document,
        ref.stage,
        ref.role,
        ref.classification
      RESTART IDENTITY CASCADE
    `);

    for (const c of classifications) {
      await client.query(
        `INSERT INTO ref.classification (id, name, code)
         VALUES ($1, $2, $3)
         ON CONFLICT (id) DO NOTHING`,
        [c.id, c.name, c.code],
      );
    }

    for (const s of stages) {
      await client.query(
        `INSERT INTO ref.stage (id, name, classification_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (id) DO NOTHING`,
        [s.id, s.name, s.classification_id],
      );
    }

    for (const r of roles) {
      await client.query(
        `INSERT INTO ref.role (id, name_ru, code)
         VALUES ($1, $2, $3)
         ON CONFLICT (id) DO NOTHING`,
        [r.id, r.name_ru, r.code],
      );
    }

    for (const d of documents) {
      await client.query(
        `INSERT INTO ref.document
          (id, name_ru, role_id, stage_id, classification_id, placeholders, sections, rules)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8::jsonb)
         ON CONFLICT (id) DO NOTHING`,
        [
          d.id,
          d.name_ru,
          d.role_id,
          d.stage_id,
          d.classification_id,
          JSON.stringify(d.placeholders ?? {}),
          JSON.stringify(d.sections ?? []),
          JSON.stringify(d.rules ?? {}),
        ],
      );
    }

    await client.query(
      `SELECT setval('ref.classification_id_seq', COALESCE((SELECT MAX(id) FROM ref.classification), 1), true)`,
    );
    await client.query(
      `SELECT setval('ref.stage_id_seq', COALESCE((SELECT MAX(id) FROM ref.stage), 1), true)`,
    );
    await client.query(
      `SELECT setval('ref.role_id_seq', COALESCE((SELECT MAX(id) FROM ref.role), 1), true)`,
    );
    await client.query(
      `SELECT setval('ref.document_id_seq', COALESCE((SELECT MAX(id) FROM ref.document), 1), true)`,
    );

    await client.query('COMMIT');
    console.log('Seed completed');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
    await app.close();
  }
}

void seed();
