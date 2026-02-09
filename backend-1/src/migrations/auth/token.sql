CREATE TABLE auth.token (
  id bigserial PRIMARY KEY,
  user_id bigint NOT NULL,
  refresh_token varchar(512) NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  revoked_at timestamptz,
  CONSTRAINT fk_token_user FOREIGN KEY (user_id) REFERENCES auth."user"(id) ON DELETE NO ACTION
);