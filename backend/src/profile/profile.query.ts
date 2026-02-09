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
      $1,
      pgp_sym_encrypt($2::text, $3),
      encode(digest(upper($2::text), 'sha256'), 'hex'),
      CASE WHEN $4::text IS NOT NULL THEN pgp_sym_encrypt($4::text, $3) ELSE NULL END,
      CASE WHEN $4::text IS NOT NULL THEN encode(digest(upper($4::text), 'sha256'), 'hex') ELSE NULL END,
      CASE WHEN $5::text IS NOT NULL THEN pgp_sym_encrypt($5::text, $3) ELSE NULL END,
      CASE WHEN $5::text IS NOT NULL THEN encode(digest(upper($5::text), 'sha256'), 'hex') ELSE NULL END,
      CASE WHEN $6::text IS NOT NULL THEN pgp_sym_encrypt($6::text, $3) ELSE NULL END,
      CASE WHEN $6::text IS NOT NULL THEN encode(digest(upper($6::text), 'sha256'), 'hex') ELSE NULL END,
      CASE WHEN $7::text IS NOT NULL THEN pgp_sym_encrypt($7::text, $3) ELSE NULL END,
      CASE WHEN $7::text IS NOT NULL THEN encode(digest(upper($7::text), 'sha256'), 'hex') ELSE NULL END,
      $8, $9, $10
    )
  `,
  findByUserId: `
    SELECT
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
    FROM auth.profile
    WHERE user_id = $2
  `,
};
