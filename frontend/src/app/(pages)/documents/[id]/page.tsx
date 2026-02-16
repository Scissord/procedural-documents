'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  Button,
  Input,
  Label,
  LeftCard,
  Loading,
  RightCard,
} from '@/components';
import { AppDocumentService, RefDocumentService } from '@/services';
import { IAppDocument, IRefDocument } from '@/interfaces';
import { Loader2 } from 'lucide-react';
import { useNotificationStore } from '@/store';

type FormValues = Record<string, string>;

export default function DocumentPage() {
  const router = useRouter();

  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const uuid = params.id;
  const isGenerateMode = uuid === 'generate';

  const roleId = Number(searchParams.get('role_id'));
  const classificationId = Number(searchParams.get('classification_id'));
  const stageId = Number(searchParams.get('stage_id'));
  const hasGenerateFilters =
    Number.isFinite(roleId) &&
    Number.isFinite(classificationId) &&
    Number.isFinite(stageId);

  const addNotification = useNotificationStore((s) => s.addNotification);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  const [isGeneratingDocument, setIsGeneratingDocument] = useState(false);
  const [refDocuments, setRefDocuments] = useState<IRefDocument[]>([]);
  const [selectedRefDocumentId, setSelectedRefDocumentId] = useState<
    number | null
  >(null);
  const [formValues, setFormValues] = useState<FormValues>({});
  const [appDocument, setAppDocument] = useState<IAppDocument | null>(null);
  const [selectedRefDocument, setSelectedRefDocument] =
    useState<IRefDocument | null>(null);

  const placeholderKeys = useMemo(() => {
    if (!selectedRefDocument) {
      return [];
    }
    const required = selectedRefDocument.placeholders?.required ?? [];
    const optional = selectedRefDocument.placeholders?.optional ?? [];
    return Array.from(new Set([...required, ...optional]));
  }, [selectedRefDocument]);

  const requiredPlaceholderKeys = useMemo(
    () => new Set(selectedRefDocument?.placeholders?.required ?? []),
    [selectedRefDocument],
  );

  const handleTemplateChange = async (templateId: number) => {
    setSelectedRefDocumentId(templateId);
    setIsLoadingTemplate(true);
    const response = await RefDocumentService.getById(templateId);
    if (response.statusCode === 200) {
      setSelectedRefDocument((response.data?.document as IRefDocument) ?? null);
    } else {
      setSelectedRefDocument(null);
    }
    setIsLoadingTemplate(false);
  };

  const handleFieldChange = (key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleGenerateDocument = async () => {
    const situation = (formValues.situation ?? '').trim();
    if (!situation) {
      addNotification({
        type: 'destructive',
        title: 'Ошибка!',
        description: 'Пожалуйста, опишите ситуацию по делу. (6000 символов)',
      });
      return;
    }

    if (!selectedRefDocumentId) {
      addNotification({
        type: 'destructive',
        title: 'Ошибка!',
        description: 'Пожалуйста, выберите шаблон документа.',
      });
      setIsGeneratingDocument(false);
      return;
    }

    setIsGeneratingDocument(true);
    const response = await AppDocumentService.create({
      fields: {
        ...formValues,
        document_id: selectedRefDocumentId,
      },
    });

    if (response.statusCode === 200) {
      const doc = response.data?.document as IAppDocument;
      const docId = doc?.id;

      if (docId && typeof docId === 'string') {
        router.push(`/documents/${docId}`);
      } else {
        addNotification({
          type: 'destructive',
          title: 'Ошибка!',
          description: 'Не удалось получить ID созданного документа.',
        });
      }
    }

    setIsGeneratingDocument(false);
  };

  const handleFetchDocument = async () => {
    const response = await AppDocumentService.getById(uuid);
    if (response.statusCode === 200) {
      setAppDocument((response?.data?.document as IAppDocument) ?? []);
    }
  };

  useEffect(() => {
    if (!isGenerateMode && uuid !== 'generate') {
      handleFetchDocument();
    }
  }, [isGenerateMode]);

  useEffect(() => {
    const loadPageData = async () => {
      setIsLoading(true);

      if (isGenerateMode) {
        if (!hasGenerateFilters) {
          setIsLoading(false);
          return;
        }

        const response = await RefDocumentService.get({
          role_id: roleId,
          classification_id: classificationId,
          stage_id: stageId,
        });

        if (response.statusCode === 200) {
          const docs = (response.data?.documents as IRefDocument[]) ?? [];
          setRefDocuments(docs);
          const firstDocumentId = docs[0]?.id ?? null;
          setSelectedRefDocumentId(firstDocumentId);

          if (firstDocumentId !== null) {
            setIsLoadingTemplate(true);
            const byIdResponse =
              await RefDocumentService.getById(firstDocumentId);
            if (byIdResponse.statusCode === 200) {
              setSelectedRefDocument(
                (byIdResponse.data?.document as IRefDocument) ?? null,
              );
            } else {
              setSelectedRefDocument(null);
            }
            setIsLoadingTemplate(false);
          } else {
            setSelectedRefDocument(null);
          }
        } else {
          setRefDocuments([]);
          setSelectedRefDocumentId(null);
          setSelectedRefDocument(null);
        }
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
    };

    void loadPageData();
  }, [
    isGenerateMode,
    hasGenerateFilters,
    roleId,
    classificationId,
    stageId,
    uuid,
  ]);

  useEffect(() => {
    if (!selectedRefDocument) {
      setFormValues({});
      return;
    }

    const nextValues: FormValues = {
      situation: formValues.situation ?? '',
    };
    for (const key of placeholderKeys) {
      nextValues[key] = formValues[key] ?? '';
    }
    setFormValues(nextValues);
  }, [selectedRefDocumentId, placeholderKeys.join('|')]);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <LeftCard
          isGenerateMode={isGenerateMode}
          hasGenerateFilters={hasGenerateFilters}
          selectedRefDocumentId={selectedRefDocumentId}
          handleTemplateChange={handleTemplateChange}
          refDocuments={refDocuments}
          formValues={formValues}
          handleFieldChange={handleFieldChange}
          placeholderKeys={placeholderKeys}
          requiredPlaceholderKeys={requiredPlaceholderKeys}
          handleGenerateDocument={handleGenerateDocument}
          isGeneratingDocument={isGeneratingDocument}
          appDocument={appDocument}
        />
        <RightCard
          isGenerateMode={isGenerateMode}
          isLoadingTemplate={isLoadingTemplate}
          selectedRefDocument={selectedRefDocument}
          formValues={formValues}
          handleFieldChange={handleFieldChange}
          appDocument={appDocument}
          isGeneratingDocument={isGeneratingDocument}
        />
      </div>
    </div>
  );
}
