export const testSwagger = {
  '/test': {
    post: {
      summary: 'Создать',
      tags: ['Тег'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['data', 'signature'],
              properties: {
                xml: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
      responses: {
        201: { description: 'Запись создана успешно' },
        400: { description: 'Некорректный запрос' },
        500: { description: 'Ошибка сервера' },
      },
    },
  },
};
