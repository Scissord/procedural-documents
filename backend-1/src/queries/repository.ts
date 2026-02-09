import { IQuery, IGetQuery } from '@interfaces';

export function existQuery(table: string) {
  return `
    SELECT * FROM ${table}
    WHERE reziddb = $1
    AND parent = $2
  `;
}

export function getQuery(config: IGetQuery) {
  const main = config.main;
  const joins = config.joins || [];
  const where = config.where || [];

  const mainAlias = main.alias ?? 't0';

  const selectFields = [];

  if (main.fields && main.fields.length) {
    for (const f of main.fields) {
      selectFields.push(`${mainAlias}.${f} AS ${mainAlias}_${f}`);
    }
  } else {
    selectFields.push(`${mainAlias}.*`);
  }

  joins.forEach((j, i) => {
    const alias = j.alias ?? `t${i + 1}`;
    if (j.fields?.length) {
      for (const f of j.fields) {
        selectFields.push(`${alias}.${f} AS ${alias}_${f}`);
      }
    } else {
      selectFields.push(`${alias}.*`);
    }
  });

  let query = `SELECT\n  ${selectFields.join(',\n  ')}\nFROM ${main.table} ${mainAlias}`;

  joins.forEach((j, i) => {
    const alias = j.alias ?? `t${i + 1}`;
    query += `\nLEFT JOIN ${j.table} ${alias} ON ${alias}.${j.fk} = ${j.ref}`;
  });

  if (where.length) {
    query += `\nWHERE ${where.join(' AND ')}`;
  }

  return query + ';';
}

export function createQuery({ table, fk, is_main, fields }: IQuery) {
  const cols = [];
  const vals = [];
  let index = 1;

  // Если таблица НЕ главная → при создании нужно указать FK
  if (!is_main) {
    cols.push(fk);
    vals.push(`$${index++}`);
  }

  // Перебираем обычные поля
  for (const field of fields) {
    if (typeof field === 'string') {
      cols.push(field);
      vals.push(`$${index++}`);
    } else if (field.encrypted) {
      cols.push(field.name + '_encrypted');
      cols.push(field.name + '_hash');

      vals.push(`pgp_sym_encrypt($${index}, '${process.env.SECRET_KEY}')`);
      vals.push(`encode(digest(upper($${index}), 'sha256'), 'hex')`);

      index++;
    }
  }

  return `
    INSERT INTO ${table} (
      ${cols.join(',\n      ')}
    )
    VALUES (
      ${vals.join(',\n      ')}
    )
    RETURNING id;
  `;
}

export function updateQuery({ table, pk, fk, is_main, fields }: IQuery) {
  const whereField = is_main ? pk : fk;

  if (!whereField) {
    throw new Error(
      `UPDATE requires ${is_main ? 'pk' : 'fk'} for table ${table}`,
    );
  }

  const sets: string[] = [];
  let index = 2; // $1 — pk или fk

  for (const field of fields) {
    if (typeof field === 'string') {
      sets.push(`${field} = $${index++}`);
    } else if (field.encrypted) {
      sets.push(
        `${field.name}_encrypted = pgp_sym_encrypt($${index}, '${process.env.SECRET_KEY}')`,
      );
      sets.push(
        `${field.name}_hash = encode(digest(upper($${index}), 'sha256'), 'hex')`,
      );
      index++;
    }
  }

  sets.push(`update_date = $${index++}`);
  sets.push(`update_user = $${index++}`);

  return `
    UPDATE ${table}
    SET
      ${sets.join(',\n      ')}
    WHERE ${whereField} = $1
    RETURNING id;
  `;
}
