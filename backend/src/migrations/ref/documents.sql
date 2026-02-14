CREATE TABLE IF NOT EXISTS ref.document (
  id BIGSERIAL PRIMARY KEY,
  name_ru VARCHAR(255) NOT NULL,
  role_id INTEGER NOT NULL REFERENCES ref.role(id) ON DELETE NO ACTION,
  stage_id INTEGER NOT NULL REFERENCES ref.stage(id) ON DELETE NO ACTION,
  classification_id INTEGER NOT NULL REFERENCES ref.classification(id) ON DELETE NO ACTION,
  placeholders JSONB NOT NULL DEFAULT '{}',
  sections JSONB NOT NULL DEFAULT '[]',
  rules JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_document_stage_id ON ref.document(stage_id);
CREATE INDEX IF NOT EXISTS idx_document_classification_id ON ref.document(classification_id);
CREATE INDEX IF NOT EXISTS idx_document_role_id ON ref.document(role_id);
CREATE INDEX IF NOT EXISTS idx_document_deleted_at ON ref.document(deleted_at) WHERE deleted_at IS NULL;