export const profileQuery = {
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
