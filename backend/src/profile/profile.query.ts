export const profileQuery = {
  create: `
    INSERT INTO auth.profile (
      user_id,
      first_name_encrypted, first_name_hash,
      last_name_encrypted, last_name_hash,
      middle_name_encrypted, middle_name_hash,
      phone_encrypted, phone_hash,
      birthday_encrypted, birthday_hash,
      gender, locale, timezone
    )
    VALUES (
      $2,

      pgp_sym_encrypt($3::text, $1),
      encode(digest(upper($3::text), 'sha256'), 'hex'),

      CASE WHEN $4::text IS NOT NULL THEN pgp_sym_encrypt($4::text, $1) END,
      CASE WHEN $4::text IS NOT NULL THEN encode(digest(upper($4::text), 'sha256'), 'hex') END,

      CASE WHEN $5::text IS NOT NULL THEN pgp_sym_encrypt($5::text, $1) END,
      CASE WHEN $5::text IS NOT NULL THEN encode(digest(upper($5::text), 'sha256'), 'hex') END,

      CASE WHEN $6::text IS NOT NULL THEN pgp_sym_encrypt($6::text, $1) END,
      CASE WHEN $6::text IS NOT NULL THEN encode(digest(upper($6::text), 'sha256'), 'hex') END,

      CASE WHEN $7::text IS NOT NULL THEN pgp_sym_encrypt($7::text, $1) END,
      CASE WHEN $7::text IS NOT NULL THEN encode(digest(upper($7::text), 'sha256'), 'hex') END,

      $8, $9, $10
    ) RETURNING
      id as profile_id,
      pgp_sym_decrypt(first_name_encrypted, $1) AS first_name,
      pgp_sym_decrypt(last_name_encrypted, $1) AS last_name,
      pgp_sym_decrypt(middle_name_encrypted, $1) AS middle_name,
      pgp_sym_decrypt(phone_encrypted, $1) AS phone,
      pgp_sym_decrypt(birthday_encrypted, $1) AS birthday,
      avatar_url,
      gender,
      locale,
      timezone
  `,
  findByUserId: `
    SELECT
      id,
      user_id,
      pgp_sym_decrypt(first_name_encrypted, $1) AS first_name,
      pgp_sym_decrypt(last_name_encrypted, $1) AS last_name,
      pgp_sym_decrypt(middle_name_encrypted, $1) AS middle_name,
      pgp_sym_decrypt(phone_encrypted, $1) AS phone,
      pgp_sym_decrypt(birthday_encrypted, $1) AS birthday,
      avatar_url,
      gender,
      locale,
      timezone
    FROM auth.profile
    WHERE user_id = $2
  `,
  updateByUserId: `
    UPDATE auth.profile
    SET
      first_name_encrypted = CASE
        WHEN $3::text IS NOT NULL THEN pgp_sym_encrypt($3::text, $1)
        ELSE first_name_encrypted
      END,
      first_name_hash = CASE
        WHEN $3::text IS NOT NULL THEN encode(digest(upper($3::text), 'sha256'), 'hex')
        ELSE first_name_hash
      END,
      last_name_encrypted = CASE
        WHEN $4::text IS NOT NULL THEN pgp_sym_encrypt($4::text, $1)
        ELSE last_name_encrypted
      END,
      last_name_hash = CASE
        WHEN $4::text IS NOT NULL THEN encode(digest(upper($4::text), 'sha256'), 'hex')
        ELSE last_name_hash
      END,
      middle_name_encrypted = CASE
        WHEN $5::text IS NOT NULL THEN pgp_sym_encrypt($5::text, $1)
        ELSE middle_name_encrypted
      END,
      middle_name_hash = CASE
        WHEN $5::text IS NOT NULL THEN encode(digest(upper($5::text), 'sha256'), 'hex')
        ELSE middle_name_hash
      END,
      phone_encrypted = CASE
        WHEN $6::text IS NOT NULL THEN pgp_sym_encrypt($6::text, $1)
        ELSE phone_encrypted
      END,
      phone_hash = CASE
        WHEN $6::text IS NOT NULL THEN encode(digest(upper($6::text), 'sha256'), 'hex')
        ELSE phone_hash
      END,
      birthday_encrypted = CASE
        WHEN $7::text IS NOT NULL THEN pgp_sym_encrypt($7::text, $1)
        ELSE birthday_encrypted
      END,
      birthday_hash = CASE
        WHEN $7::text IS NOT NULL THEN encode(digest(upper($7::text), 'sha256'), 'hex')
        ELSE birthday_hash
      END,
      gender = COALESCE($8::varchar(10), gender),
      locale = COALESCE($9::varchar(10), locale),
      timezone = COALESCE($10::varchar(255), timezone),
      updated_at = CURRENT_TIMESTAMP
    WHERE user_id = $2
    RETURNING
      id,
      user_id,
      pgp_sym_decrypt(first_name_encrypted, $1) AS first_name,
      pgp_sym_decrypt(last_name_encrypted, $1) AS last_name,
      pgp_sym_decrypt(middle_name_encrypted, $1) AS middle_name,
      pgp_sym_decrypt(phone_encrypted, $1) AS phone,
      pgp_sym_decrypt(birthday_encrypted, $1) AS birthday,
      avatar_url,
      gender,
      locale,
      timezone
  `,
};
