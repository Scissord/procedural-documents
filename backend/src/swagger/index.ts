import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Router } from 'express';
import { testSwagger } from './test.swagger';

const url =
  process.env.NODE_ENV === 'local'
    ? 'http://localhost:3000'
    : 'http://prod_url.kz';

const swagger = () => {
  const options = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'ЦН Получение сведений о процессе судопроизводства.',
        version: '1.0.0',
        description: 'Сервис для обработки сведений о процессе суда.',
      },
      tags: [
        {
          name: 'Судебный процесс',
        },
      ],
      servers: [
        {
          url,
        },
      ],
      paths: {
        ...testSwagger,
      },
    },
    apis: ['./src/swagger/*.ts'],
  };

  const swaggerSpec = swaggerJSDoc(options);

  const router = Router();
  router.use(swaggerUi.serve);
  router.get('/', swaggerUi.setup(swaggerSpec));
  router.get('/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  return router;
};

export default swagger;
