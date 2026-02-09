/**
 * Тесты для валидации универсального PromptBuilder
 * Проверяет генерацию промптов для разных типов документов
 */

import { PromptBuilder } from '../src/services/prompt/prompt';
import { IDocumentTemplate } from '../src/interfaces';

// Тестовые шаблоны для разных типов документов
const testTemplates: IDocumentTemplate[] = [
  // 1. Исковое заявление (Истец, Возбуждение дела)
  {
    id: 1,
    name_ru: 'Исковое заявление',
    role_id: 1,
    stage_id: 1,
    jurisdiction_id: 1,
    classification_id: 1,
    placeholders: { required: [], optional: [] },
    sections: [
      { key: 'header', title_ru: 'Шапка', template: 'standard_header' },
      { key: 'body', title_ru: 'Текст документа', template: 'standard_body' },
      { key: 'requests', title_ru: 'Просительная часть', template: 'standard_requests' },
      { key: 'attachments', title_ru: 'Приложения', template: 'standard_attachments' },
      { key: 'signature', title_ru: 'Подпись', template: 'standard_signature' },
    ],
    rules: { stages_allowed: ['Возбуждение дела'] },
  },

  // 2. Апелляционная жалоба (Истец, Обжалование)
  {
    id: 37,
    name_ru: 'Апелляционная жалоба',
    role_id: 1,
    stage_id: 5,
    jurisdiction_id: 1,
    classification_id: 1,
    placeholders: { required: [], optional: [] },
    sections: [
      { key: 'header', title_ru: 'Шапка', template: 'standard_header' },
      { key: 'body', title_ru: 'Текст документа', template: 'standard_body' },
      { key: 'requests', title_ru: 'Просительная часть', template: 'standard_requests' },
      { key: 'attachments', title_ru: 'Приложения', template: 'standard_attachments' },
      { key: 'signature', title_ru: 'Подпись', template: 'standard_signature' },
    ],
    rules: { stages_allowed: ['Обжалование'] },
  },

  // 3. Отзыв на исковое заявление (Ответчик, Подготовка дела)
  {
    id: 48,
    name_ru: 'Отзыв (возражения) на исковое заявление',
    role_id: 2,
    stage_id: 2,
    jurisdiction_id: 1,
    classification_id: 1,
    placeholders: { required: [], optional: [] },
    sections: [
      { key: 'header', title_ru: 'Шапка', template: 'standard_header_defendant' },
      { key: 'facts', title_ru: 'Фактические обстоятельства', template: 'standard_facts' },
      { key: 'legal_basis', title_ru: 'Правовые основания', template: 'standard_legal_basis' },
      { key: 'requests', title_ru: 'Просительная часть', template: 'standard_requests' },
      { key: 'attachments', title_ru: 'Приложения', template: 'standard_attachments' },
      { key: 'signature', title_ru: 'Подпись', template: 'standard_signature' },
    ],
    rules: { stages_allowed: ['Подготовка дела'] },
  },

  // 4. Ходатайство о назначении экспертизы (Истец, Разбирательство)
  {
    id: 21,
    name_ru: 'Ходатайство о назначении судебной экспертизы',
    role_id: 1,
    stage_id: 3,
    jurisdiction_id: 1,
    classification_id: 1,
    placeholders: { required: [], optional: ['expert_type', 'expert_questions'] },
    sections: [
      { key: 'header', title_ru: 'Шапка', template: 'standard_header' },
      { key: 'body', title_ru: 'Текст документа', template: 'standard_body' },
      { key: 'requests', title_ru: 'Просительная часть', template: 'standard_requests' },
      { key: 'attachments', title_ru: 'Приложения', template: 'standard_attachments' },
      { key: 'signature', title_ru: 'Подпись', template: 'standard_signature' },
    ],
    rules: { stages_allowed: ['Судебное разбирательство'] },
  },

  // 5. Мировое соглашение
  {
    id: 29,
    name_ru: 'Мировое соглашение (проект для утверждения судом)',
    role_id: 1,
    stage_id: 3,
    jurisdiction_id: 1,
    classification_id: 1,
    placeholders: { required: [], optional: [] },
    sections: [
      { key: 'header', title_ru: 'Шапка', template: 'standard_header' },
      { key: 'body', title_ru: 'Текст документа', template: 'standard_body' },
      { key: 'requests', title_ru: 'Просительная часть', template: 'standard_requests' },
      { key: 'signature', title_ru: 'Подпись', template: 'standard_signature' },
    ],
    rules: { stages_allowed: ['Судебное разбирательство'] },
  },

  // 6. Кассационная жалоба
  {
    id: 39,
    name_ru: 'Кассационная жалоба',
    role_id: 1,
    stage_id: 5,
    jurisdiction_id: 1,
    classification_id: 1,
    placeholders: { required: [], optional: [] },
    sections: [
      { key: 'header', title_ru: 'Шапка', template: 'standard_header' },
      { key: 'body', title_ru: 'Текст документа', template: 'standard_body' },
      { key: 'requests', title_ru: 'Просительная часть', template: 'standard_requests' },
      { key: 'attachments', title_ru: 'Приложения', template: 'standard_attachments' },
      { key: 'signature', title_ru: 'Подпись', template: 'standard_signature' },
    ],
    rules: { stages_allowed: ['Обжалование'] },
  },

  // 7. Заявление о возбуждении исполнительного производства
  {
    id: 43,
    name_ru: 'Заявление о возбуждении исполнительного производства',
    role_id: 1,
    stage_id: 6,
    jurisdiction_id: 1,
    classification_id: 1,
    placeholders: { required: [], optional: [] },
    sections: [
      { key: 'header', title_ru: 'Шапка', template: 'standard_header' },
      { key: 'body', title_ru: 'Текст документа', template: 'standard_body' },
      { key: 'requests', title_ru: 'Просительная часть', template: 'standard_requests' },
      { key: 'attachments', title_ru: 'Приложения', template: 'standard_attachments' },
      { key: 'signature', title_ru: 'Подпись', template: 'standard_signature' },
    ],
    rules: { stages_allowed: ['Исполнение'] },
  },

  // 8. Частная жалоба (на определение суда)
  {
    id: 38,
    name_ru: 'Частная жалоба (на определение суда)',
    role_id: 1,
    stage_id: 5,
    jurisdiction_id: 1,
    classification_id: 1,
    placeholders: { required: [], optional: [] },
    sections: [
      { key: 'header', title_ru: 'Шапка', template: 'standard_header' },
      { key: 'body', title_ru: 'Текст документа', template: 'standard_body' },
      { key: 'requests', title_ru: 'Просительная часть', template: 'standard_requests' },
      { key: 'attachments', title_ru: 'Приложения', template: 'standard_attachments' },
      { key: 'signature', title_ru: 'Подпись', template: 'standard_signature' },
    ],
    rules: { stages_allowed: ['Обжалование'] },
  },
];

const testSituation = `
Между мной и ООО "Рога и Копыта" был заключен договор займа на сумму 500 000 тенге.
Срок возврата займа истек 01.01.2025 года.
Несмотря на неоднократные устные и письменные требования, ответчик до настоящего времени
не вернул сумму займа. Имеется расписка от заемщика.
`;

const testStructure = `
В Межрайонный суд города Алматы
Адрес: г. Алматы, ул. Тестовая, 1

Истец: Иванов Иван Иванович
Адрес: г. Алматы, ул. Примерная, 10

Ответчик: ООО "Рога и Копыта"
Адрес: г. Алматы, ул. Фирменная, 5

ИСКОВОЕ ЗАЯВЛЕНИЕ
о взыскании суммы займа

[Описательная часть]
_____________________________________

[Мотивировочная часть]
_____________________________________

ПРОШУ СУД:
1) _____________________________________
2) _____________________________________

Приложения:
1) _____________________________________

Дата: «___» __________ 20__ г.
Подпись: ____________________
`;

describe('PromptBuilder - Universal Prompt Generation', () => {
  describe('getRoleInstructions', () => {
    it('should return plaintiff instructions for role_id 1', () => {
      const instructions = PromptBuilder.getRoleInstructions(1);
      expect(instructions).toContain('ИСТЦА');
      expect(instructions).toContain('требования');
    });

    it('should return defendant instructions for role_id 2', () => {
      const instructions = PromptBuilder.getRoleInstructions(2);
      expect(instructions).toContain('ОТВЕТЧИКА');
      expect(instructions).toContain('возражения');
    });
  });

  describe('getStageName', () => {
    it('should return correct stage names', () => {
      expect(PromptBuilder.getStageName(1)).toBe('Возбуждение дела');
      expect(PromptBuilder.getStageName(2)).toBe('Подготовка дела');
      expect(PromptBuilder.getStageName(3)).toBe('Судебное разбирательство');
      expect(PromptBuilder.getStageName(4)).toBe('После решения');
      expect(PromptBuilder.getStageName(5)).toBe('Обжалование');
      expect(PromptBuilder.getStageName(6)).toBe('Исполнение');
    });
  });

  describe('buildRAGStrategy', () => {
    it('should generate RAG strategy for stage 1 (Возбуждение дела)', () => {
      const strategy = PromptBuilder.buildRAGStrategy(1, 'Исковое заявление');
      expect(strategy).toContain('kz_gk');
      expect(strategy).toContain('kz_gpk');
      expect(strategy).toContain('kz_civil_practice');
      expect(strategy).toContain('форма и содержание');
    });

    it('should generate RAG strategy for stage 5 (Обжалование)', () => {
      const strategy = PromptBuilder.buildRAGStrategy(5, 'Апелляционная жалоба');
      expect(strategy).toContain('апелляционное');
      expect(strategy).toContain('основания обжалования');
    });

    it('should generate RAG strategy for stage 6 (Исполнение)', () => {
      const strategy = PromptBuilder.buildRAGStrategy(6, 'Заявление о возбуждении исполнительного производства');
      expect(strategy).toContain('исполнительное производство');
    });
  });

  describe('buildSectionsGuide', () => {
    it('should generate section guides for all template sections', () => {
      const template = testTemplates[0]; // Исковое заявление
      const guide = PromptBuilder.buildSectionsGuide(template.sections);

      expect(guide).toContain('ШАПКА');
      expect(guide).toContain('ТЕКСТ ДОКУМЕНТА');
      expect(guide).toContain('ПРОСИТЕЛЬНАЯ ЧАСТЬ');
      expect(guide).toContain('ПРИЛОЖЕНИЯ');
    });

    it('should include defendant-specific header for defendant templates', () => {
      const template = testTemplates[2]; // Отзыв на исковое заявление
      const guide = PromptBuilder.buildSectionsGuide(template.sections);

      expect(guide).toContain('ФАКТИЧЕСКИЕ ОБСТОЯТЕЛЬСТВА');
      expect(guide).toContain('ПРАВОВЫЕ ОСНОВАНИЯ');
    });
  });

  describe('buildUniversalPrompt', () => {
    testTemplates.forEach((template, index) => {
      it(`should generate valid prompt for ${template.name_ru} (id: ${template.id})`, () => {
        const prompt = PromptBuilder.buildUniversalPrompt(
          template,
          testSituation,
          testStructure,
        );

        // Проверяем базовые элементы промпта
        expect(prompt).toContain('юрист-практик по Республике Казахстан');
        expect(prompt).toContain(template.name_ru);
        expect(prompt).toContain('kz_gk');
        expect(prompt).toContain('kz_gpk');
        expect(prompt).toContain('kz_civil_practice');
        expect(prompt).toContain('search_legislation');
        expect(prompt).toContain(testSituation.trim());

        // Проверяем специфичные для роли инструкции
        if (template.role_id === 1) {
          expect(prompt).toContain('ИСТЦА');
        } else if (template.role_id === 2) {
          expect(prompt).toContain('ОТВЕТЧИКА');
        }

        // Проверяем длину промпта (не должен быть слишком коротким)
        expect(prompt.length).toBeGreaterThan(1000);
      });
    });

    it('should include court decision block for Исковое заявление', () => {
      const template = testTemplates[0];
      const prompt = PromptBuilder.buildUniversalPrompt(template, testSituation, testStructure);

      expect(prompt).toContain('ПРЕДВАРИТЕЛЬНОЕ РЕШЕНИЕ СУДА');
    });

    it('should include appellate instructions for Апелляционная жалоба', () => {
      const template = testTemplates[1];
      const prompt = PromptBuilder.buildUniversalPrompt(template, testSituation, testStructure);

      expect(prompt).toContain('АПЕЛЛЯЦИОННОЙ ЖАЛОБЫ');
      expect(prompt).toContain('отменить');
    });

    it('should include cassation instructions for Кассационная жалоба', () => {
      const template = testTemplates[5];
      const prompt = PromptBuilder.buildUniversalPrompt(template, testSituation, testStructure);

      expect(prompt).toContain('КАССАЦИОННОЙ ЖАЛОБЫ');
      expect(prompt).toContain('существенные нарушения');
    });

    it('should include settlement instructions for Мировое соглашение', () => {
      const template = testTemplates[4];
      const prompt = PromptBuilder.buildUniversalPrompt(template, testSituation, testStructure);

      expect(prompt).toContain('МИРОВОГО СОГЛАШЕНИЯ');
      expect(prompt).toContain('взаимные уступки');
    });

    it('should include expert instructions for Ходатайство о назначении экспертизы', () => {
      const template = testTemplates[3];
      const prompt = PromptBuilder.buildUniversalPrompt(template, testSituation, testStructure);

      expect(prompt).toContain('ЭКСПЕРТ');
      expect(prompt).toContain('вопросы');
    });

    it('should include execution instructions for Заявление о возбуждении исполнительного производства', () => {
      const template = testTemplates[6];
      const prompt = PromptBuilder.buildUniversalPrompt(template, testSituation, testStructure);

      expect(prompt).toContain('ИСПОЛНИТЕЛЬНОГО ПРОИЗВОДСТВА');
    });

    it('should include private complaint instructions for Частная жалоба', () => {
      const template = testTemplates[7];
      const prompt = PromptBuilder.buildUniversalPrompt(template, testSituation, testStructure);

      expect(prompt).toContain('ЧАСТНОЙ ЖАЛОБЫ');
      expect(prompt).toContain('ОПРЕДЕЛЕНИЕ');
    });
  });

  describe('Prompt consistency', () => {
    it('should always include RAG instructions', () => {
      testTemplates.forEach((template) => {
        const prompt = PromptBuilder.buildUniversalPrompt(template, testSituation, testStructure);
        expect(prompt).toContain('RAG');
        expect(prompt).toContain('search_legislation');
        expect(prompt).toContain('limit=5');
      });
    });

    it('should always include placeholder handling rules', () => {
      testTemplates.forEach((template) => {
        const prompt = PromptBuilder.buildUniversalPrompt(template, testSituation, testStructure);
        expect(prompt).toContain('<<НУЖНО УТОЧНИТЬ');
        expect(prompt).toContain('_____');
      });
    });

    it('should always include source restriction rules', () => {
      testTemplates.forEach((template) => {
        const prompt = PromptBuilder.buildUniversalPrompt(template, testSituation, testStructure);
        expect(prompt).toContain('ОГРАНИЧЕНИЕ ИСТОЧНИКОВ');
        expect(prompt).toContain('ТОЛЬКО результаты search_legislation');
      });
    });
  });
});
