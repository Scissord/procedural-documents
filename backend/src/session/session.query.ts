export const sessionQuery = {
  check: `
    SELECT
    id
    FROM auth."session"
    WHERE user_id = $1
    AND ip_address = $2
    AND user_agent = $3
  `,
  update: `
    UPDATE auth."session"
    SET is_active = true,
        login_at = NOW(),
        logout_at = NULL,
        last_seen_at = NOW()
    WHERE id = $1
  `,
  create: `
    INSERT INTO auth."session" (
      user_id,
      ip_address,
      user_agent,
      is_active
    )
    VALUES ($1, $2, $3, true)
    RETURNING id
  `,
};
