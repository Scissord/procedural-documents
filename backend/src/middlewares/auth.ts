// 1. Получает accessToken, из headers
// 2. Получаем refreshToken, из куков
// 3. Проверяем accessToken на valid
// 3. decodedAccess = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);
// 4. Если access валидный
// 5. decodedRefresh = jwt.verify(refresh, process.env.JWT_ACCESS_SECRET);
// 6. req.user_id = decodedRefresh.user_id
// 7. Тогда пускаем в контроллер
// 8. Если accessToken не verify, тогда
// 9. Пытаемся обновлять через refresh, Если он verify, тогда кидаем новый access во фронт
// 10. Если refresh не verify, кидаем 405, чтобы выкинуть пользователя

// try {
//   const payload = jwt.verify(token, SECRET_KEY);
//   // ✅ токен валиден и НЕ истёк
// } catch (err) {
//   if (err.name === 'TokenExpiredError') {
//     // ❌ токен истёк
//   } else {
//     // ❌ токен невалиден (подпись, формат и т.д.)
//   }
// }

// axios interceptors
