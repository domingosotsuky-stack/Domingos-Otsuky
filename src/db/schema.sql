-- ============================================================================
-- BANCO DE DADOS POSTGRESQL - FIVE IA (FIVE AI)
-- Criador / Proprietário: OTsUkY FiVe (Super Admin & Dono)
-- Data de Criação: 2026-10-13
-- Moeda da Plataforma: Five Coins | Moeda Fiduciária: Kwanza (AOA)
-- Métodos de Pagamento: Multicaixa ATM e Pagamento por Referência Bancária
-- ============================================================================

-- Extensões necessárias para UUIDs, funções criptográficas e validações
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. TIPOS ENUMERADOS (ENUMS)
-- ============================================================================

CREATE TYPE papel_usuario AS ENUM ('usuario', 'admin', 'dono');
CREATE TYPE estado_usuario AS ENUM ('ativo', 'suspenso');
CREATE TYPE estado_nif AS ENUM ('pendente', 'valido', 'invalido');
CREATE TYPE tipo_transacao_coins AS ENUM ('compra', 'gasto', 'bonus', 'reembolso');
CREATE TYPE servico_tipo AS ENUM ('chat', 'foto', 'video');
CREATE TYPE metodo_pagamento_tipo AS ENUM ('atm', 'referencia');
CREATE TYPE estado_compra AS ENUM ('pendente', 'pago', 'expirado', 'falhou', 'reembolsado');
CREATE TYPE origem_confirmacao AS ENUM ('webhook', 'manual_admin');
CREATE TYPE papel_mensagem AS ENUM ('usuario', 'assistente');
CREATE TYPE tipo_geracao AS ENUM ('foto', 'video');
CREATE TYPE estado_geracao AS ENUM ('na_fila', 'a_gerar', 'concluido', 'falhou');
CREATE TYPE tipo_notificacao AS ENUM ('pagamento_confirmado', 'referencia_expirada', 'nif_invalido', 'geracao_concluida');

-- ============================================================================
-- 2. TABELAS: CONTAS E ACESSO
-- ============================================================================

-- 1. Tabela: usuarios
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    telefone VARCHAR(30),
    senha VARCHAR(255) NOT NULL, -- Hash argon2id ou bcrypt ($2b$...)
    papel papel_usuario NOT NULL DEFAULT 'usuario',
    estado estado_usuario NOT NULL DEFAULT 'ativo',
    data_criacao TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ultimo_login TIMESTAMPTZ,
    CONSTRAINT chk_email_formato CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- 2. Tabela: sessoes
CREATE TABLE sessoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    dispositivo VARCHAR(255),
    ip VARCHAR(45),
    data_inicio TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_expiracao TIMESTAMPTZ NOT NULL,
    CONSTRAINT chk_expiracao_valida CHECK (data_expiracao > data_inicio)
);

-- 3. Tabela: nif_usuarios
-- NIF Angolano: Pessoa Singular (14 caracteres: 9 dígitos + 2 letras + 3 dígitos)
-- ou Pessoa Coletiva (10 dígitos numéricos).
CREATE TABLE nif_usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
    nif VARCHAR(255) NOT NULL UNIQUE, -- Armazenado com hash / cifra pgcrypto
    nif_mascarado VARCHAR(30) NOT NULL, -- Exemplo: 0054****9LA042 para visualização
    tipo_pessoa VARCHAR(20) NOT NULL DEFAULT 'singular', -- 'singular' ou 'coletiva'
    estado estado_nif NOT NULL DEFAULT 'pendente',
    data_verificacao TIMESTAMPTZ,
    tentativas INT NOT NULL DEFAULT 0,
    mensagem_validacao TEXT,
    CONSTRAINT chk_tentativas_positivas CHECK (tentativas >= 0 AND tentativas <= 5)
);

-- ============================================================================
-- 3. TABELAS: CARTEIRA E FIVE COINS
-- ============================================================================

-- 4. Tabela: carteiras
CREATE TABLE carteiras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
    saldo_five_coins INT NOT NULL DEFAULT 0,
    data_atualizacao TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_saldo_nao_negativo CHECK (saldo_five_coins >= 0)
);

-- 5. Tabela: pacotes_coins
-- Pacotes padrão estipulados: 500 Kz, 1.000 Kz, 2.000 Kz, 3.000 Kz, 5.000 Kz
CREATE TABLE pacotes_coins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) NOT NULL,
    quantidade_coins INT NOT NULL,
    preco_kwanza NUMERIC(12, 2) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT true,
    data_criacao TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_quantidade_coins_positiva CHECK (quantidade_coins > 0),
    CONSTRAINT chk_preco_kwanza_positivo CHECK (preco_kwanza > 0)
);

-- 6. Tabela: transacoes_coins (registo histórico imutável)
CREATE TABLE transacoes_coins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    tipo tipo_transacao_coins NOT NULL,
    quantidade INT NOT NULL, -- Positivo (compra, bonus, reembolso) ou negativo (gasto)
    saldo_apos INT NOT NULL,
    referencia_id VARCHAR(100), -- ID da compra, ID da geração ou ID da mensagem
    descricao TEXT,
    data TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_saldo_apos_nao_negativo CHECK (saldo_apos >= 0)
);

-- 7. Tabela: custos_servicos
-- Regra Five IA: 1 imagem = 5 Five Coins, 1 vídeo de 5s = 5 Five Coins
CREATE TABLE custos_servicos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    servico servico_tipo NOT NULL UNIQUE,
    custo_coins INT NOT NULL,
    duracao_base_segundos INT DEFAULT NULL, -- Exemplo: 5 segundos para vídeo
    custo_por_segundo_extra INT DEFAULT 1,  -- Custo adicional para vídeos mais longos
    ativo BOOLEAN NOT NULL DEFAULT true,
    data_atualizacao TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_custo_coins_valido CHECK (custo_coins >= 0)
);

-- ============================================================================
-- 4. TABELAS: BANCOS E PAGAMENTOS ANGOLA
-- ============================================================================

-- 8. Tabela: bancos
-- Bancos operantes em Angola com rede Multicaixa EMIS
CREATE TABLE bancos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) NOT NULL,
    codigo VARCHAR(20) NOT NULL UNIQUE, -- Ex: BAI, BFA, BIC, ATL, STB, SOL, KEV, BNI
    logotipo_url VARCHAR(255),
    ativo BOOLEAN NOT NULL DEFAULT true
);

-- 9. Tabela: conta_recebimento
CREATE TABLE conta_recebimento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    banco_id UUID NOT NULL REFERENCES bancos(id) ON DELETE RESTRICT,
    titular VARCHAR(150) NOT NULL DEFAULT 'Five AI / OTsUkY FiVe',
    iban VARCHAR(255) NOT NULL, -- IBAN Criptografado (visível apenas para admin/dono)
    iban_mascarado VARCHAR(40) NOT NULL, -- Ex: AO06 0040 **** **** **** 4210
    entidade VARCHAR(10) NOT NULL, -- Código de entidade Multicaixa (ex: 00551)
    ativo BOOLEAN NOT NULL DEFAULT true,
    data_criacao TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 10. Tabela: compras
CREATE TABLE compras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    pacote_id UUID NOT NULL REFERENCES pacotes_coins(id) ON DELETE RESTRICT,
    valor_kwanza NUMERIC(12, 2) NOT NULL,
    metodo_pagamento metodo_pagamento_tipo NOT NULL,
    banco_id UUID NOT NULL REFERENCES bancos(id) ON DELETE RESTRICT,
    referencia_pagamento VARCHAR(20) NOT NULL UNIQUE, -- 9 dígitos Multicaixa EMIS
    entidade VARCHAR(10) NOT NULL,
    estado estado_compra NOT NULL DEFAULT 'pendente',
    data_criacao TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_expiracao TIMESTAMPTZ NOT NULL, -- Válido por 72 horas
    data_pagamento TIMESTAMPTZ,
    comprovativo_url VARCHAR(500),
    CONSTRAINT chk_valor_compra_positivo CHECK (valor_kwanza > 0),
    CONSTRAINT chk_expiracao_compra CHECK (data_expiracao > data_criacao)
);

-- 11. Tabela: pagamentos_confirmacao
CREATE TABLE pagamentos_confirmacao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    compra_id UUID NOT NULL UNIQUE REFERENCES compras(id) ON DELETE RESTRICT,
    banco_id UUID NOT NULL REFERENCES bancos(id) ON DELETE RESTRICT,
    valor_recebido NUMERIC(12, 2) NOT NULL,
    referencia_recebida VARCHAR(20) NOT NULL,
    origem origem_confirmacao NOT NULL,
    admin_id UUID REFERENCES usuarios(id), -- Caso seja confirmação manual
    data_recebimento TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_valor_recebido_positivo CHECK (valor_recebido > 0)
);

-- ============================================================================
-- 5. TABELAS: IA E GERAÇÕES
-- ============================================================================

-- 12. Tabela: conversas
CREATE TABLE conversas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL DEFAULT 'Nova Conversa Five IA',
    data_criacao TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 13. Tabela: mensagens
CREATE TABLE mensagens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversa_id UUID NOT NULL REFERENCES conversas(id) ON DELETE CASCADE,
    papel papel_mensagem NOT NULL,
    conteudo TEXT NOT NULL,
    coins_gastos INT NOT NULL DEFAULT 0,
    data TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_coins_gastos_positivos CHECK (coins_gastos >= 0)
);

-- 14. Tabela: geracoes
CREATE TABLE geracoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo tipo_geracao NOT NULL,
    prompt TEXT NOT NULL,
    estado estado_geracao NOT NULL DEFAULT 'na_fila',
    coins_gastos INT NOT NULL,
    url_ficheiro TEXT,
    duracao_segundos INT DEFAULT NULL, -- Obrigatório para vídeos (5, 10, 15 etc.)
    largura INT DEFAULT 1024,
    altura INT DEFAULT 1024,
    modelo_utilizado VARCHAR(100),
    data_criacao TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_conclusao TIMESTAMPTZ,
    CONSTRAINT chk_coins_geracao CHECK (coins_gastos >= 0),
    CONSTRAINT chk_duracao_video CHECK (
        (tipo = 'foto' AND duracao_segundos IS NULL) OR
        (tipo = 'video' AND duracao_segundos IS NOT NULL AND duracao_segundos >= 5)
    )
);

-- ============================================================================
-- 6. TABELAS: SISTEMA E AUDITORIA
-- ============================================================================

-- 15. Tabela: notificacoes
CREATE TABLE notificacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo tipo_notificacao NOT NULL,
    mensagem TEXT NOT NULL,
    lida BOOLEAN NOT NULL DEFAULT false,
    data TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 16. Tabela: logs_auditoria
CREATE TABLE logs_auditoria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    acao VARCHAR(100) NOT NULL,
    detalhes JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip VARCHAR(45),
    data TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 7. ÍNDICES DE PERFORMANCE E PESQUISA RÁPIDA
-- ============================================================================

-- Índices em usuarios
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_papel ON usuarios(papel);
CREATE INDEX idx_usuarios_estado ON usuarios(estado);

-- Índices em sessoes
CREATE INDEX idx_sessoes_usuario ON sessoes(usuario_id);
CREATE INDEX idx_sessoes_token ON sessoes(token);
CREATE INDEX idx_sessoes_expiracao ON sessoes(data_expiracao);

-- Índices em nif_usuarios
CREATE INDEX idx_nif_usuarios_usuario ON nif_usuarios(usuario_id);
CREATE INDEX idx_nif_usuarios_nif ON nif_usuarios(nif);
CREATE INDEX idx_nif_usuarios_estado ON nif_usuarios(estado);

-- Índices em transacoes_coins
CREATE INDEX idx_transacoes_usuario_data ON transacoes_coins(usuario_id, data DESC);
CREATE INDEX idx_transacoes_tipo ON transacoes_coins(tipo);

-- Índices em compras
CREATE INDEX idx_compras_usuario_data ON compras(usuario_id, data_criacao DESC);
CREATE INDEX idx_compras_referencia ON compras(referencia_pagamento);
CREATE INDEX idx_compras_estado ON compras(estado);
CREATE INDEX idx_compras_banco ON compras(banco_id);
CREATE INDEX idx_compras_expiracao ON compras(data_expiracao);

-- Índices em geracoes
CREATE INDEX idx_geracoes_usuario_data ON geracoes(usuario_id, data_criacao DESC);
CREATE INDEX idx_geracoes_tipo_estado ON geracoes(tipo, estado);

-- Índices em conversas e mensagens
CREATE INDEX idx_conversas_usuario ON conversas(usuario_id);
CREATE INDEX idx_mensagens_conversa_data ON mensagens(conversa_id, data ASC);

-- Índices em notificacoes e logs
CREATE INDEX idx_notificacoes_usuario_lida ON notificacoes(usuario_id, lida, data DESC);
CREATE INDEX idx_logs_auditoria_usuario_data ON logs_auditoria(usuario_id, data DESC);
CREATE INDEX idx_logs_auditoria_acao ON logs_auditoria(acao);

-- ============================================================================
-- 8. FUNÇÕES E GATILHOS (TRIGGERS) DE INTEGRIDADE E REGRAS DE NEGÓCIO
-- ============================================================================

-- Regra: Imutabilidade de transacoes_coins (nunca editar nem apagar histórico)
CREATE OR REPLACE FUNCTION impedir_modificacao_transacoes_coins()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'A tabela transacoes_coins é imutável! Não é permitido atualizar ou apagar registros históricos.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_imutabilidade_transacoes_coins
BEFORE UPDATE OR DELETE ON transacoes_coins
FOR EACH ROW EXECUTE FUNCTION impedir_modificacao_transacoes_coins();

-- Regra de NIF Angolano: Formato oficial Pessoa Singular (14 caracteres) ou Coletiva (10 dígitos)
CREATE OR REPLACE FUNCTION validar_formato_nif_angolano(nif_texto TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Pessoa Singular: 9 dígitos + 2 letras maiúsculas + 3 dígitos (Ex: 005423189LA042)
    IF nif_texto ~ '^[0-9]{9}[A-Z]{2}[0-9]{3}$' THEN
        RETURN TRUE;
    END IF;

    -- Pessoa Coletiva: 10 dígitos numéricos (Ex: 5417032190)
    IF nif_texto ~ '^[0-9]{10}$' THEN
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Regra: Criar carteira automaticamente ao cadastrar novo usuário
CREATE OR REPLACE FUNCTION criar_carteira_novo_usuario()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO carteiras (usuario_id, saldo_five_coins)
    VALUES (NEW.id, 0);

    -- Criar notificação de boas-vindas
    INSERT INTO notificacoes (usuario_id, tipo, mensagem)
    VALUES (
        NEW.id,
        'pagamento_confirmado',
        'Bem-vindo à Five IA criada por OTsUkY FiVe! Adicione o seu NIF e adquira Five Coins para começar a criar.'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_criar_carteira_usuario
AFTER INSERT ON usuarios
FOR EACH ROW EXECUTE FUNCTION criar_carteira_novo_usuario();
