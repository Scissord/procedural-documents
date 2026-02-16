import { IFields } from 'src/app_document/dto/create-document.dto';

export const getTemplate = (fields: IFields) => {
  switch (+fields.document_id) {
    case 1:
      return getFirstTemplate(fields);
  }

  throw new Error('Document ID not found');
};

const getFirstTemplate = (fields: IFields) => {
  const maxSituationChars = 6000;
  const situation =
    fields.situation && fields.situation.length > maxSituationChars
      ? `${fields.situation.slice(0, maxSituationChars)}\n\n<<СИТУАЦИЯ СОКРАЩЕНА: пришёл слишком большой текст; укажи ключевые факты/даты/суммы/документы отдельно>>`
      : fields.situation;

  return `
    ДОКУМЕНТ (структура для заполнения)

    В ${fields.court_name}

    Адрес: ${fields.court_address}

    Истец: ${fields.plaintiff_fio_or_name}, ИИН/БИН: ${fields.plaintiff_iin_bin}

    Адрес: ${fields.plaintiff_address}

    Контакты: ${fields.plaintiff_phone_email}

    Ответчик: ${fields.defendant_fio_or_name}, ИИН/БИН: ${fields.defendant_iin_bin}

    Адрес: ${fields.defendant_address}

    Контакты: ${fields.defendant_phone_email}

    Представитель: ${fields.representative}

    Цена иска: ${fields.price_of_claim}

    Исковое заявление

    Описательная часть: ${situation}

    Мотивировочная часть: В соответствии со ст. ...

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
};
