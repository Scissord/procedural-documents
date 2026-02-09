CREATE TABLE IF NOT EXISTS ref.documents (
  id BIGSERIAL PRIMARY KEY,
  name_ru VARCHAR(255) NOT NULL,
  role_id INTEGER NOT NULL,
  stage_id INTEGER NOT NULL REFERENCES ref.stage(id) ON DELETE NO ACTION,
  jurisdiction_id INTEGER NOT NULL,
  classification_id INTEGER NOT NULL REFERENCES ref.classification(id) ON DELETE NO ACTION,
  placeholders JSONB NOT NULL DEFAULT '{}',
  sections JSONB NOT NULL DEFAULT '[]',
  rules JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_documents_stage_id ON ref.documents(stage_id);
CREATE INDEX IF NOT EXISTS idx_documents_classification_id ON ref.documents(classification_id);
CREATE INDEX IF NOT EXISTS idx_documents_role_id ON ref.documents(role_id);
CREATE INDEX IF NOT EXISTS idx_documents_deleted_at ON ref.documents(deleted_at) WHERE deleted_at IS NULL;