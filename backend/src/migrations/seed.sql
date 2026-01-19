-- ============================================
-- ПАРАМЕТРЫ: Замените значения ниже
-- ============================================
-- Входные данные:
--   email: email пользователя
--   first_name: имя пользователя
--   password: пароль (будет захэширован через bcrypt)
--   SECRET_KEY: ключ для шифрования данных
-- ============================================

DO $$
DECLARE
  -- ПАРАМЕТРЫ: Измените эти значения
  v_email TEXT := 'test@example.com';
  v_first_name TEXT := 'Иван';
  v_password_hash TEXT := '$2b$10$7VlRgJRkIVH7uRhfERCHu.IlFUvhBkqY9Br3wCdaY3qJWrhvQD4AO'; -- bcrypt hash для пароля "lemon"
  v_secret_key TEXT := '8pXoO5nDiOLGTPggOF3OU53wPmWQMUaYRM4UbsvidP0gjNZbeuIsbE3nmQsaQ26j';

  -- Внутренние переменные
  v_user_id BIGINT;
  v_email_hash TEXT;
  v_first_name_hash TEXT;
BEGIN
  -- Проверка и установка расширения pgcrypto
  CREATE EXTENSION IF NOT EXISTS pgcrypto;

  -- Вычисляем хэши
  v_email_hash := encode(digest(upper(v_email), 'sha256'), 'hex');
  v_first_name_hash := encode(digest(upper(v_first_name), 'sha256'), 'hex');

  -- Удаление старой записи, если существует
  DELETE FROM auth.token WHERE user_id IN (SELECT id FROM auth."user" WHERE email_hash = v_email_hash);
  DELETE FROM auth.session WHERE user_id IN (SELECT id FROM auth."user" WHERE email_hash = v_email_hash);
  DELETE FROM auth.profile WHERE user_id IN (SELECT id FROM auth."user" WHERE email_hash = v_email_hash);
  DELETE FROM auth."user" WHERE email_hash = v_email_hash;

  -- 1. Создание пользователя в auth.user
  INSERT INTO auth."user" (
    email_encrypted,
    email_hash,
    password_hash,
    is_active
  ) VALUES (
    pgp_sym_encrypt(v_email, v_secret_key),
    v_email_hash,
    v_password_hash,
    true
  ) ON CONFLICT (email_hash) DO UPDATE SET
    email_encrypted = EXCLUDED.email_encrypted,
    password_hash = EXCLUDED.password_hash,
    is_active = EXCLUDED.is_active
  RETURNING id INTO v_user_id;

  -- Если пользователь уже существовал, получаем его ID
  IF v_user_id IS NULL THEN
    SELECT id INTO v_user_id
    FROM auth."user"
    WHERE email_hash = v_email_hash;
  END IF;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'ОШИБКА: Не удалось создать или найти пользователя!';
  END IF;

  RAISE NOTICE '✓ Пользователь создан/обновлен (ID: %)', v_user_id;

  -- 2. Создание/обновление профиля в auth.profile
  UPDATE auth.profile SET
    first_name_encrypted = pgp_sym_encrypt(v_first_name, v_secret_key),
    first_name_hash = v_first_name_hash,
    gender = 'male',
    locale = 'ru',
    timezone = 'Asia/Almaty',
    updated_at = CURRENT_TIMESTAMP
  WHERE user_id = v_user_id;

  -- Если профиль не существует, создаем его
  IF NOT FOUND THEN
    INSERT INTO auth.profile (
      user_id,
      first_name_encrypted,
      first_name_hash,
      gender,
      locale,
      timezone
    ) VALUES (
      v_user_id,
      pgp_sym_encrypt(v_first_name, v_secret_key),
      v_first_name_hash,
      'male',
      'ru',
      'Asia/Almaty'
    );
    RAISE NOTICE '✓ Профиль создан';
  ELSE
    RAISE NOTICE '✓ Профиль обновлен';
  END IF;

  -- 3. Создание сессии в auth.session
  INSERT INTO auth.session (
    user_id,
    ip_address,
    user_agent,
    login_at,
    is_active
  ) VALUES (
    v_user_id,
    '127.0.0.1'::inet,
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    NOW(),
    true
  ) ON CONFLICT DO NOTHING;

  RAISE NOTICE '✓ Сессия создана';

  -- 4. Создание токена в auth.token
  INSERT INTO auth.token (
    user_id,
    refresh_token,
    expires_at
  ) VALUES (
    v_user_id,
    'temp-refresh-token-' || gen_random_uuid()::text,
    NOW() + INTERVAL '30 days'
  ) ON CONFLICT DO NOTHING;

  RAISE NOTICE '✓ Токен создан';

  -- Проверка результата
  DECLARE
    v_profile_exists BOOLEAN;
    v_sessions_count INTEGER;
    v_tokens_count INTEGER;
  BEGIN
    -- Проверяем профиль
    SELECT EXISTS(SELECT 1 FROM auth.profile WHERE user_id = v_user_id) INTO v_profile_exists;

    -- Проверяем сессии
    SELECT COUNT(*) INTO v_sessions_count
    FROM auth.session
    WHERE user_id = v_user_id;

    -- Проверяем токены
    SELECT COUNT(*) INTO v_tokens_count
    FROM auth.token
    WHERE user_id = v_user_id;

    -- Итоговая информация
    RAISE NOTICE '========================================';
    RAISE NOTICE 'РЕЗУЛЬТАТ ПРОВЕРКИ:';
    RAISE NOTICE '  Email: %', v_email;
    RAISE NOTICE '  Имя: %', v_first_name;
    RAISE NOTICE '  Пользователь ID: %', v_user_id;
    RAISE NOTICE '  Профиль: %', CASE WHEN v_profile_exists THEN '✓' ELSE '✗' END;
    RAISE NOTICE '  Сессии: %', v_sessions_count;
    RAISE NOTICE '  Токены: %', v_tokens_count;
    RAISE NOTICE '========================================';

    -- Финальная проверка
    IF NOT v_profile_exists THEN
      RAISE WARNING 'ПРЕДУПРЕЖДЕНИЕ: Профиль не найден!';
    END IF;

    IF v_sessions_count = 0 THEN
      RAISE WARNING 'ПРЕДУПРЕЖДЕНИЕ: Сессии не найдены!';
    END IF;

    IF v_tokens_count = 0 THEN
      RAISE WARNING 'ПРЕДУПРЕЖДЕНИЕ: Токены не найдены!';
    END IF;
  END;
END $$;
