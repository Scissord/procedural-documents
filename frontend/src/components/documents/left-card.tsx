'use client';

import { useRef } from 'react';
import { Button, Input, Label, Loading, RightCard } from '@/components';
import { IAppDocument, IRefDocument } from '@/interfaces';

const PLACEHOLDER_META: Record<
  string,
  { label: string; type?: 'text' | 'date' | 'email' }
> = {
  court_name: { label: 'Название суда' },
  court_address: { label: 'Адрес суда' },
  plaintiff_fio_or_name: { label: 'ФИО/наименование истца' },
  plaintiff_address: { label: 'Адрес истца' },
  plaintiff_iin_bin: { label: 'ИИН/БИН истца' },
  plaintiff_phone_email: { label: 'Телефон и e-mail истца', type: 'email' },
  defendant_fio_or_name: { label: 'ФИО/наименование ответчика' },
  defendant_address: { label: 'Адрес ответчика' },
  defendant_iin_bin: { label: 'ИИН/БИН ответчика' },
  defendant_phone_email: { label: 'Телефон и e-mail ответчика', type: 'email' },
  date: { label: 'Дата', type: 'date' },
  signature: { label: 'Подпись' },
  price_of_claim: { label: 'Цена иска' },
  case_number: { label: 'Номер дела' },
  representative: { label: 'Представитель' },
  expert_type: { label: 'Вид экспертизы' },
  expert_questions: { label: 'Вопросы эксперту' },
  expert_institution: { label: 'Экспертное учреждение' },
  hearing_date: { label: 'Дата заседания', type: 'date' },
  protocol_date: { label: 'Дата протокола', type: 'date' },
  situation: { label: 'Опишите ситуацию по делу ' },
};

interface LeftCardProps {
  isGenerateMode: boolean;
  hasGenerateFilters: boolean;
  selectedRefDocumentId: number | null;
  handleTemplateChange: (templateId: number) => void;
  refDocuments: IRefDocument[];
  formValues: Record<string, string>;
  handleFieldChange: (key: string, value: string) => void;
  placeholderKeys: any[];
  requiredPlaceholderKeys: Record<string, any>;
  handleGenerateDocument: () => void;
  isGeneratingDocument: boolean;
  appDocuments: IAppDocument[] | [];
  isUploadingAppeal?: boolean;
  handleUploadAppeal?: (file: File) => void;
}

export const LeftCard = ({
  isGenerateMode,
  hasGenerateFilters,
  selectedRefDocumentId,
  handleTemplateChange,
  refDocuments,
  formValues,
  handleFieldChange,
  placeholderKeys,
  requiredPlaceholderKeys,
  handleGenerateDocument,
  isGeneratingDocument,
  appDocuments,
  isUploadingAppeal = false,
  handleUploadAppeal,
}: LeftCardProps) => {
  const appealInputRef = useRef<HTMLInputElement | null>(null);
  const latestDocument = appDocuments.length
    ? appDocuments[appDocuments.length - 1]
    : null;
  const canUploadAppeal = !isGenerateMode && latestDocument?.stage === 0;

  return (
    <section className="rounded-xl border bg-card p-5 shadow-sm">
      <h1 className="mb-4 text-2xl font-semibold text-foreground">
        {isGenerateMode ? 'Создание документа' : 'Данные документа'}
      </h1>

      {isGenerateMode ? (
        <div className="space-y-4">
          <div>
            <Label htmlFor="refDocument">Шаблон документа</Label>
            <select
              id="refDocument"
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={selectedRefDocumentId ?? ''}
              onChange={(e) =>
                void handleTemplateChange(Number(e.target.value))
              }
            >
              <option value="" disabled>
                Выберите шаблон документа
              </option>
              {refDocuments.map((doc) => (
                <option key={doc.id} value={doc.id} disabled={!doc.is_active}>
                  {doc.name_ru}
                  {!doc.is_active ? ' (недоступно)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="situation">Опишите ситуацию по делу *</Label>
            <textarea
              id="situation"
              required
              rows={5}
              value={formValues.situation ?? ''}
              onChange={(e) => handleFieldChange('situation', e.target.value)}
              placeholder="Подробно опишите ситуацию, чтобы корректно сформировать документ"
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {placeholderKeys.map((key) => (
            <div key={key}>
              <Label htmlFor={key}>
                {PLACEHOLDER_META[key]?.label ?? key}
                {requiredPlaceholderKeys.has(key) ? ' *' : ''}
              </Label>
              <Input
                id={key}
                type={PLACEHOLDER_META[key]?.type ?? 'text'}
                value={formValues[key] ?? ''}
                onChange={(e) => handleFieldChange(key, e.target.value)}
                placeholder={`Введите ${(
                  PLACEHOLDER_META[key]?.label ?? key
                ).toLowerCase()}`}
              />
            </div>
          ))}

          <div className="pt-2" onClick={handleGenerateDocument}>
            <Button
              disabled={
                isGeneratingDocument ||
                !(formValues.situation ?? '').trim().length
              }
              type="button"
            >
              {isGeneratingDocument
                ? 'Генерация документа...'
                : 'Сформировать документ'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3 text-sm">
          {appDocuments.length > 0 ? (
            <div className="space-y-3 text-sm">
              <div>Документ в состоянии</div>
              {canUploadAppeal ? (
                <div className="pt-2">
                  <input
                    ref={appealInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.rtf,.txt"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file || !handleUploadAppeal) {
                        return;
                      }
                      handleUploadAppeal(file);
                      e.currentTarget.value = '';
                    }}
                  />
                  <Button
                    type="button"
                    disabled={isUploadingAppeal}
                    onClick={() => appealInputRef.current?.click()}
                  >
                    {isUploadingAppeal
                      ? 'Загрузка возражения...'
                      : 'Загрузить возражение'}
                  </Button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="space-y-3 text-sm">Документы отсутствуют</div>
          )}
        </div>
      )}
    </section>
  );
};
