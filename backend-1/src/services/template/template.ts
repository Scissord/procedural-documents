// Дефолтные значения для Telegram бота
const defaultData = {
  court_name: 'Название суда',
  court_address: 'Адресс суда',
  price_of_claim: '...',
  userData: {
    fullName: 'ФИО истца',
    iin: 'ИИН/БИН истца',
    address: 'Адрес истца',
    phone: 'Телефон истца',
    email: 'plaintiff@test.com',
  },
  opponentData: {
    fullName: 'Имя ответчика',
    iin: 'ИИН/БИН ответчика',
    address: 'Адрес ответчика',
    phone: 'Телефон ответчика',
    email: 'defendant@test.com',
    representative: 'Представитель ответчика',
  },
};

export const TemplateService = {
  getFirstTemplate(situation: string) {
    return `
      ДОКУМЕНТ (структура для заполнения)

      В ${defaultData.court_name}

      Адрес: ${defaultData.court_address}

      Истец: ${defaultData.userData.fullName}, ИИН/БИН: ${defaultData.userData.iin}

      Адрес: ${defaultData.userData.address}

      Контакты: ${defaultData.userData.phone}
      ${defaultData.userData.email}

      Ответчик: ${defaultData.opponentData.fullName}, ИИН/БИН: ${defaultData.opponentData.iin}

      Адрес: ${defaultData.opponentData.address}

      Контакты: ${defaultData.opponentData.phone}
      ${defaultData.opponentData.email}

      Представитель: ${defaultData.opponentData.representative}

      Цена иска: ${defaultData.price_of_claim}

      Исковое заявление

      Описательная часть: ${situation}

      Мотивировочная часть: В соответствии со ст. ...
      Исковое заявление подается в суд в письменной форме, в соответствии со ст. 458 Гражданского процессуального кодекса Республики Казахстан, с указанием наименования суда, в который подается заявление, и сведений о сторонах.

      На основании изложенного

      ПРОШУ СУД:

      1) ______________________________________________________________________

      2) ______________________________________________________________________

      Перечень прилагаемых документов:

      1) ______________________________________________________________________

      2) ______________________________________________________________________

      3) ______________________________________________________________________

      Дата: «__» __________ 20__ г.

      Подпись: ____________________
    `.trim();
  },

  getSecondTemplate(situation: string) {
    return `
      ДОКУМЕНТ (структура для заполнения)

      Исковое заявление

      Стадия: Возбуждение дела

      Шапка (реквизиты):

      В ${defaultData.court_name}

      Адрес: ${defaultData.court_address}

      Истец: ${defaultData.userData.fullName}, ИИН/БИН: ${defaultData.userData.iin}

      Адрес: ${defaultData.userData.address}

      Контакты: ${defaultData.userData.phone}
      ${defaultData.userData.email}

      Ответчик: ${defaultData.opponentData.fullName}, ИИН/БИН: ${defaultData.opponentData.iin}

      Адрес: ${defaultData.opponentData.address}

      Контакты: ${defaultData.opponentData.phone}
      ${defaultData.opponentData.email}

      Представитель: ${defaultData.opponentData.representative}

      Текст документа (каркас):

      Цена иска: ${defaultData.price_of_claim}

      [1. Вводная часть / предмет обращения]

      Настоящим обращаюсь в суд с документом: «Исковое заявление».

      [2. Обстоятельства и фактические данные]

      Изложение обстоятельств: ${situation}

      Сведения о доказательствах: _____________________________________________

      [3. Правовое обоснование]

      Нормы права и процессуальные основания: _________________________________

      [4. Просительная часть]

      На основании изложенного ПРОШУ СУД:

      1) ______________________________________________________________________

      2) ______________________________________________________________________

      [5. Приложения]

      Перечень прилагаемых документов:

      1) ______________________________________________________________________

      2) ______________________________________________________________________

      3) ______________________________________________________________________

      Дата: «___» __________ 20__ г.

      Подпись: ____________________
    `.trim();
  },
};
