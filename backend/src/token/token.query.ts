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
        expires_at = $3,
        revoked_at = NULL
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
  checkValidRefresh: `
    SELECT
      id
    FROM auth."token"
    WHERE user_id = $1
    AND session_id = $2
    AND refresh_token = $3
    AND revoked_at IS NULL
    AND expires_at > NOW()
    LIMIT 1
  `,
  revokeByPair: `
    UPDATE auth."token"
    SET revoked_at = NOW()
    WHERE user_id = $1
    AND session_id = $2
    AND refresh_token = $3
    AND revoked_at IS NULL
    RETURNING id
  `,
  getByPairAndToken: `
    SELECT
      id,
      expires_at,
      revoked_at
    FROM auth."token"
    WHERE user_id = $1
    AND session_id = $2
    AND refresh_token = $3
    LIMIT 1
  `,
  getByPairLatest: `
    SELECT
      id,
      expires_at,
      revoked_at
    FROM auth."token"
    WHERE user_id = $1
    AND session_id = $2
    ORDER BY id DESC
    LIMIT 1
  `,
};
