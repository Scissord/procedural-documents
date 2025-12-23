module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  // Игнорируем node_modules, если в них нет TypeScript файлов
  transformIgnorePatterns: ['node_modules/(?!some-module-to-transform)'],
  // moduleNameWrapper: {
  //   '^@controllers$': '<rootDir>/src/controllers/index.ts',
  //   '^@helpers$': '<rootDir>/src/helpers/index.ts',
  //   '^@interface$': '<rootDir>/src/interfaces/index.ts',
  //   '^@middlewares$': '<rootDir>/src/middlewares/index.ts',
  //   '^@models$': '<rootDir>/src/models/index.ts',
  //   '^@routes$': '<rootDir>/src/routes/index.ts',
  //   '^@services$': '<rootDir>/src/services/index.ts',
  //   '^@validations$': '<rootDir>/src/validations/index.ts',
  // }
};
