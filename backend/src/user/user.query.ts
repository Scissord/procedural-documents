export const userQuery = {
  findByEmail: `
    SELECT
      id,
      pgp_sym_decrypt(email_encrypted, $1) AS email,
      password_hash,
      is_active,
      created_at
    FROM auth."user"
    WHERE email_hash = encode(digest(upper($2), 'sha256'), 'hex');
  `,
  create: `
    INSERT INTO auth."user" (
      email_encrypted,
      email_hash,
      password_hash,
      is_active
    )
    VALUES (
      pgp_sym_encrypt($2, $1),
      encode(digest(upper($2), 'sha256'), 'hex'),
      $3,
      true
    )
    RETURNING
      id,
      pgp_sym_decrypt(email_encrypted, $1) AS email,
      is_active,
      created_at
  `,
  findById: `
    SELECT
      id,
      pgp_sym_decrypt(email_encrypted, $1) AS email,
      is_active,
      created_at
    FROM auth."user"
    WHERE id = $2
  `,
};
