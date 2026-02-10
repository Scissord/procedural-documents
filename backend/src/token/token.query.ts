export const tokenQuery = {
  check: `
    SELECT
      id
    FROM auth."token"
    WHERE user_id = $1
    AND session_id = $2
  `,
  update: `
    UPDATE auth."token"
    SET refresh_token = $2,
        expires_at = $3
    WHERE id = $1
    RETURNING id, refresh_token, expires_at
  `,
  create: `
    INSERT INTO auth."token" (
      user_id,
      session_id,
      refresh_token,
      expires_at
    )
    VALUES ($1, $2, $3, $4)
    RETURNING
      id,
      user_id,
      session_id,
      refresh_token,
      expires_at
  `,
};
