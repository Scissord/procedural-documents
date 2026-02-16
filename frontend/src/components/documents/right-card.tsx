'use client';

import { IAppDocument, IRefDocument } from '@/interfaces';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface LeftCardProps {
  isGenerateMode: boolean;
  isLoadingTemplate: boolean;
  selectedRefDocument: IRefDocument | null;
  formValues: Record<string, string>;
  handleFieldChange: (key: string, value: string) => void;
  appDocument: IAppDocument | null;
  isGeneratingDocument: boolean;
}

export const RightCard = ({
  isGenerateMode,
  isLoadingTemplate,
  selectedRefDocument,
  formValues,
  handleFieldChange,
  appDocument,
  isGeneratingDocument,
}: LeftCardProps) => {
  const [selectedDoc, setSelectedDoc] = useState<{
    title: string;
    text: string;
  } | null>(null);

  useEffect(() => {
    if (appDocument) {
      setSelectedDoc(appDocument.docs[0]);
    }
  }, [appDocument]);

  return (
    <section className="rounded-xl border bg-card p-5 shadow-sm">
      <h2 className="mb-4 text-2xl font-semibold text-foreground">
        Предпросмотр документа
      </h2>

      {isGenerateMode ? (
        isLoadingTemplate ? (
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Загрузка шаблона...</span>
          </div>
        ) : selectedRefDocument ? (
          <div className="space-y-4 text-sm">
            <p className="font-medium">{selectedRefDocument.name_ru}</p>
            <div className="space-y-2">
              {selectedRefDocument.sections?.map((section) => (
                <div
                  key={section.key}
                  className="rounded-md border bg-background p-3"
                >
                  <p className="font-medium">{section.title_ru}</p>
                  <p className="text-muted-foreground">{section.template}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Шаблон документа не выбран.
          </p>
        )
      ) : appDocument ? (
        <>
          <div className="flex items-center gap-3 mb-3">
            {appDocument?.docs.map((doc: any, idx: number) => (
              <div
                key={idx}
                onClick={() => setSelectedDoc(doc)}
                className="rounded-md border bg-background p-2 cursor-pointer
                hover:bg-blue-700 hover:opacity-70
                transition-colors duration-300 ease-in-out"
              >
                <p className="font-medium">{doc.title}</p>
              </div>
            ))}
          </div>
          {selectedDoc && (
            <div className="rounded-md border bg-white text-black p-3 mb-3">
              <p className="font-medium">{selectedDoc.title}</p>
              <textarea
                rows={10}
                className="min-h-screen mt-2 w-full rounded-md border border-black px-3 py-2 text-sm"
                value={formValues[selectedDoc.title] ?? selectedDoc.text}
                onChange={(e) =>
                  handleFieldChange(selectedDoc.title, e.target.value)
                }
              />
            </div>
          )}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Нечего отображать.</p>
      )}
    </section>
  );
};
