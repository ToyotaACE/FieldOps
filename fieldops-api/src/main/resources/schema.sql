-- Ajustes idempotentes executados após o Hibernate (ddl-auto=update).
-- O Hibernate não remove restrições NOT NULL de colunas existentes; por isso
-- este script libera a coluna de resposta, pois uma evidência agora também
-- pode pertencer a uma não conformidade.
ALTER TABLE IF EXISTS inspection_evidences
    ALTER COLUMN inspection_answer_id DROP NOT NULL;
