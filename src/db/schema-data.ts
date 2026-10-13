export interface DBTableColumn {
  name: string;
  type: string;
  nullable: boolean;
  isPk?: boolean;
  isFk?: boolean;
  fkTarget?: string; // e.g. "usuarios(id)"
  isUnique?: boolean;
  defaultValue?: string;
  description: string;
}

export interface DBTable {
  name: string;
  category: 'CONTAS E ACESSO' | 'CARTEIRA E FIVE COINS' | 'BANCOS E PAGAMENTOS' | 'IA E GERAÇÕES' | 'SISTEMA E AUDITORIA';
  description: string;
  columns: DBTableColumn[];
  indexes: string[];
  constraints: string[];
}

export const FIVE_IA_TABLES: DBTable[] = [
  {
    name: 'usuarios',
    category: 'CONTAS E ACESSO',
    description: 'Armazena contas de utilizadores, dados de autenticação e papel (inclui Dono OTsUkY FiVe)',
    columns: [
      { name: 'id', type: 'UUID', nullable: false, isPk: true, defaultValue: 'gen_random_uuid()', description: 'Identificador único do utilizador' },
      { name: 'nome', type: 'VARCHAR(150)', nullable: false, description: 'Nome completo do utilizador' },
      { name: 'email', type: 'VARCHAR(255)', nullable: false, isUnique: true, description: 'Email de acesso único' },
      { name: 'telefone', type: 'VARCHAR(30)', nullable: true, description: 'Contacto telefónico (ex: +244)' },
      { name: 'senha', type: 'VARCHAR(255)', nullable: false, description: 'Hash seguro argon2id / bcrypt' },
      { name: 'papel', type: 'papel_usuario', nullable: false, defaultValue: "'usuario'", description: "Papel de acesso: 'usuario', 'admin', 'dono'" },
      { name: 'estado', type: 'estado_usuario', nullable: false, defaultValue: "'ativo'", description: "Estado da conta: 'ativo' ou 'suspenso'" },
      { name: 'data_criacao', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'CURRENT_TIMESTAMP', description: 'Data de registo da conta' },
      { name: 'ultimo_login', type: 'TIMESTAMPTZ', nullable: true, description: 'Data e hora do último acesso' },
    ],
    indexes: ['idx_usuarios_email (email)', 'idx_usuarios_papel (papel)', 'idx_usuarios_estado (estado)'],
    constraints: ["chk_email_formato CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$')"]
  },
  {
    name: 'sessoes',
    category: 'CONTAS E ACESSO',
    description: 'Sessões ativas com token seguro, controlo de IP e expiração de login',
    columns: [
      { name: 'id', type: 'UUID', nullable: false, isPk: true, defaultValue: 'gen_random_uuid()', description: 'Identificador da sessão' },
      { name: 'usuario_id', type: 'UUID', nullable: false, isFk: true, fkTarget: 'usuarios(id)', description: 'Chave estrangeira do utilizador' },
      { name: 'token', type: 'VARCHAR(255)', nullable: false, isUnique: true, description: 'Token de autenticação' },
      { name: 'dispositivo', type: 'VARCHAR(255)', nullable: true, description: 'Navegador e SO' },
      { name: 'ip', type: 'VARCHAR(45)', nullable: true, description: 'Endereço IP de origem' },
      { name: 'data_inicio', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'CURRENT_TIMESTAMP', description: 'Início da sessão' },
      { name: 'data_expiracao', type: 'TIMESTAMPTZ', nullable: false, description: 'Expiração da sessão' }
    ],
    indexes: ['idx_sessoes_usuario (usuario_id)', 'idx_sessoes_token (token)', 'idx_sessoes_expiracao (data_expiracao)'],
    constraints: ['chk_expiracao_valida CHECK (data_expiracao > data_inicio)']
  },
  {
    name: 'nif_usuarios',
    category: 'CONTAS E ACESSO',
    description: 'Validação oficial do NIF angolano (Pessoa Singular 14 chars ou Coletiva 10 dígitos)',
    columns: [
      { name: 'id', type: 'UUID', nullable: false, isPk: true, defaultValue: 'gen_random_uuid()', description: 'ID da validação de NIF' },
      { name: 'usuario_id', type: 'UUID', nullable: false, isFk: true, isUnique: true, fkTarget: 'usuarios(id)', description: 'Chave única de utilizador' },
      { name: 'nif', type: 'VARCHAR(255)', nullable: false, isUnique: true, description: 'NIF criptografado com chave interna' },
      { name: 'nif_mascarado', type: 'VARCHAR(30)', nullable: false, description: 'NIF mascarado para exibição segura' },
      { name: 'tipo_pessoa', type: 'VARCHAR(20)', nullable: false, defaultValue: "'singular'", description: "'singular' (14 chars) ou 'coletiva' (10 dígitos)" },
      { name: 'estado', type: 'estado_nif', nullable: false, defaultValue: "'pendente'", description: "'pendente', 'valido' ou 'invalido'" },
      { name: 'data_verificacao', type: 'TIMESTAMPTZ', nullable: true, description: 'Data da validação junto da AGT' },
      { name: 'tentativas', type: 'INT', nullable: false, defaultValue: '0', description: 'Tentativas de submissão (máx 5)' },
      { name: 'mensagem_validacao', type: 'TEXT', nullable: true, description: 'Mensagem de retorno do validador' }
    ],
    indexes: ['idx_nif_usuarios_usuario (usuario_id)', 'idx_nif_usuarios_nif (nif)', 'idx_nif_usuarios_estado (estado)'],
    constraints: ['chk_tentativas_positivas CHECK (tentativas >= 0 AND tentativas <= 5)']
  },
  {
    name: 'carteiras',
    category: 'CARTEIRA E FIVE COINS',
    description: 'Saldo de Five Coins de cada utilizador (nunca negativo)',
    columns: [
      { name: 'id', type: 'UUID', nullable: false, isPk: true, defaultValue: 'gen_random_uuid()', description: 'ID da carteira' },
      { name: 'usuario_id', type: 'UUID', nullable: false, isFk: true, isUnique: true, fkTarget: 'usuarios(id)', description: 'Dono da carteira' },
      { name: 'saldo_five_coins', type: 'INT', nullable: false, defaultValue: '0', description: 'Saldo disponível de Five Coins' },
      { name: 'data_atualizacao', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'CURRENT_TIMESTAMP', description: 'Última atualização de saldo' }
    ],
    indexes: ['idx_carteiras_usuario (usuario_id)'],
    constraints: ['chk_saldo_nao_negativo CHECK (saldo_five_coins >= 0)']
  },
  {
    name: 'pacotes_coins',
    category: 'CARTEIRA E FIVE COINS',
    description: 'Pacotes oficiais de recarga de Five Coins em Kwanzas (500 Kz, 1.000 Kz, etc.)',
    columns: [
      { name: 'id', type: 'UUID', nullable: false, isPk: true, defaultValue: 'gen_random_uuid()', description: 'ID do pacote' },
      { name: 'nome', type: 'VARCHAR(100)', nullable: false, description: 'Nome do pacote (ex: Pacote Iniciante)' },
      { name: 'quantidade_coins', type: 'INT', nullable: false, description: 'Quantidade de Five Coins creditada' },
      { name: 'preco_kwanza', type: 'NUMERIC(12, 2)', nullable: false, description: 'Preço em Kwanza (AOA)' },
      { name: 'ativo', type: 'BOOLEAN', nullable: false, defaultValue: 'true', description: 'Pacote disponível para compra' },
      { name: 'data_criacao', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'CURRENT_TIMESTAMP', description: 'Data de criação do pacote' }
    ],
    indexes: ['idx_pacotes_ativo (ativo)'],
    constraints: ['chk_quantidade_coins_positiva CHECK (quantidade_coins > 0)', 'chk_preco_kwanza_positivo CHECK (preco_kwanza > 0)']
  },
  {
    name: 'transacoes_coins',
    category: 'CARTEIRA E FIVE COINS',
    description: 'Registo histórico imutável de movimentações de Five Coins (nunca editar nem apagar)',
    columns: [
      { name: 'id', type: 'UUID', nullable: false, isPk: true, defaultValue: 'gen_random_uuid()', description: 'ID da transação' },
      { name: 'usuario_id', type: 'UUID', nullable: false, isFk: true, fkTarget: 'usuarios(id)', description: 'Utilizador beneficiário/pagador' },
      { name: 'tipo', type: 'tipo_transacao_coins', nullable: false, description: "'compra', 'gasto', 'bonus', 'reembolso'" },
      { name: 'quantidade', type: 'INT', nullable: false, description: 'Variação (+creditado ou -debitado)' },
      { name: 'saldo_apos', type: 'INT', nullable: false, description: 'Saldo resultante verificado' },
      { name: 'referencia_id', type: 'VARCHAR(100)', nullable: true, description: 'ID da compra ou geração associada' },
      { name: 'descricao', type: 'TEXT', nullable: true, description: 'Descrição textual explicativa' },
      { name: 'data', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'CURRENT_TIMESTAMP', description: 'Timestamp imutável' }
    ],
    indexes: ['idx_transacoes_usuario_data (usuario_id, data DESC)', 'idx_transacoes_tipo (tipo)'],
    constraints: ['chk_saldo_apos_nao_negativo CHECK (saldo_apos >= 0)', 'TRIGGER impedir_modificacao_transacoes_coins()']
  },
  {
    name: 'custos_servicos',
    category: 'CARTEIRA E FIVE COINS',
    description: 'Tabela de custos de serviços de IA (1 foto = 5 coins, vídeo 5s = 5 coins)',
    columns: [
      { name: 'id', type: 'UUID', nullable: false, isPk: true, defaultValue: 'gen_random_uuid()', description: 'ID da regra de custo' },
      { name: 'servico', type: 'servico_tipo', nullable: false, isUnique: true, description: "'chat', 'foto', 'video'" },
      { name: 'custo_coins', type: 'INT', nullable: false, description: 'Custo base de Five Coins' },
      { name: 'duracao_base_segundos', type: 'INT', nullable: true, description: 'Duração base (5s para vídeos)' },
      { name: 'custo_por_segundo_extra', type: 'INT', nullable: true, defaultValue: '1', description: 'Coins por segundo adicional em vídeos' },
      { name: 'ativo', type: 'BOOLEAN', nullable: false, defaultValue: 'true', description: 'Serviço ativo' },
      { name: 'data_atualizacao', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'CURRENT_TIMESTAMP', description: 'Última modificação' }
    ],
    indexes: ['idx_custos_servico (servico)'],
    constraints: ['chk_custo_coins_valido CHECK (custo_coins >= 0)']
  },
  {
    name: 'bancos',
    category: 'BANCOS E PAGAMENTOS',
    description: 'Bancos de Angola credenciados para pagamentos (BAI, BFA, Atlântico, BIC, etc.)',
    columns: [
      { name: 'id', type: 'UUID', nullable: false, isPk: true, defaultValue: 'gen_random_uuid()', description: 'ID do banco' },
      { name: 'nome', type: 'VARCHAR(100)', nullable: false, description: 'Nome da instituição bancária' },
      { name: 'codigo', type: 'VARCHAR(20)', nullable: false, isUnique: true, description: 'Código do banco (BAI, BFA, BIC...)' },
      { name: 'logotipo_url', type: 'VARCHAR(255)', nullable: true, description: 'URL do logotipo do banco' },
      { name: 'ativo', type: 'BOOLEAN', nullable: false, defaultValue: 'true', description: 'Banco ativado para pagamentos' }
    ],
    indexes: ['idx_bancos_codigo (codigo)', 'idx_bancos_ativo (ativo)'],
    constraints: ['UNIQUE(codigo)']
  },
  {
    name: 'conta_recebimento',
    category: 'BANCOS E PAGAMENTOS',
    description: 'Contas bancárias oficiais e entidade Multicaixa de Five AI / OTsUkY FiVe',
    columns: [
      { name: 'id', type: 'UUID', nullable: false, isPk: true, defaultValue: 'gen_random_uuid()', description: 'ID da conta' },
      { name: 'banco_id', type: 'UUID', nullable: false, isFk: true, fkTarget: 'bancos(id)', description: 'Banco emissor' },
      { name: 'titular', type: 'VARCHAR(150)', nullable: false, defaultValue: "'Five AI / OTsUkY FiVe'", description: 'Titular da conta' },
      { name: 'iban', type: 'VARCHAR(255)', nullable: false, description: 'IBAN criptografado (restrito admin)' },
      { name: 'iban_mascarado', type: 'VARCHAR(40)', nullable: false, description: 'IBAN mascarado para o público' },
      { name: 'entidade', type: 'VARCHAR(10)', nullable: false, description: 'Código de Entidade Multicaixa EMIS (ex: 00551)' },
      { name: 'ativo', type: 'BOOLEAN', nullable: false, defaultValue: 'true', description: 'Conta ativa para receber fundos' },
      { name: 'data_criacao', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'CURRENT_TIMESTAMP', description: 'Data de criação' }
    ],
    indexes: ['idx_conta_recebimento_banco (banco_id)'],
    constraints: []
  },
  {
    name: 'compras',
    category: 'BANCOS E PAGAMENTOS',
    description: 'Pedidos de compra de coins com Referência Multicaixa única (válida por 72h)',
    columns: [
      { name: 'id', type: 'UUID', nullable: false, isPk: true, defaultValue: 'gen_random_uuid()', description: 'ID da compra' },
      { name: 'usuario_id', type: 'UUID', nullable: false, isFk: true, fkTarget: 'usuarios(id)', description: 'Utilizador comprador' },
      { name: 'pacote_id', type: 'UUID', nullable: false, isFk: true, fkTarget: 'pacotes_coins(id)', description: 'Pacote de coins selecionado' },
      { name: 'valor_kwanza', type: 'NUMERIC(12, 2)', nullable: false, description: 'Montante exato em Kwanzas' },
      { name: 'metodo_pagamento', type: 'metodo_pagamento_tipo', nullable: false, description: "'atm' ou 'referencia'" },
      { name: 'banco_id', type: 'UUID', nullable: false, isFk: true, fkTarget: 'bancos(id)', description: 'Banco de pagamento' },
      { name: 'referencia_pagamento', type: 'VARCHAR(20)', nullable: false, isUnique: true, description: 'Referência de 9 dígitos EMIS' },
      { name: 'entidade', type: 'VARCHAR(10)', nullable: false, description: 'Entidade de pagamento (ex: 00551)' },
      { name: 'estado', type: 'estado_compra', nullable: false, defaultValue: "'pendente'", description: "'pendente', 'pago', 'expirado', 'falhou', 'reembolsado'" },
      { name: 'data_criacao', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'CURRENT_TIMESTAMP', description: 'Emissão da referência' },
      { name: 'data_expiracao', type: 'TIMESTAMPTZ', nullable: false, description: 'Expiração (72 horas após criação)' },
      { name: 'data_pagamento', type: 'TIMESTAMPTZ', nullable: true, description: 'Data de liquidação confirmada' },
      { name: 'comprovativo_url', type: 'VARCHAR(500)', nullable: true, description: 'Comprovativo enviado para suporte' }
    ],
    indexes: ['idx_compras_usuario_data (usuario_id, data_criacao DESC)', 'idx_compras_referencia (referencia_pagamento)', 'idx_compras_estado (estado)', 'idx_compras_banco (banco_id)'],
    constraints: ['chk_valor_compra_positivo CHECK (valor_kwanza > 0)', 'chk_expiracao_compra CHECK (data_expiracao > data_criacao)']
  },
  {
    name: 'pagamentos_confirmacao',
    category: 'BANCOS E PAGAMENTOS',
    description: 'Registo de validação de pagamento (webhook bancário ou aprovação manual de OTsUkY FiVe)',
    columns: [
      { name: 'id', type: 'UUID', nullable: false, isPk: true, defaultValue: 'gen_random_uuid()', description: 'ID da confirmação' },
      { name: 'compra_id', type: 'UUID', nullable: false, isFk: true, isUnique: true, fkTarget: 'compras(id)', description: 'Compra liquidada' },
      { name: 'banco_id', type: 'UUID', nullable: false, isFk: true, fkTarget: 'bancos(id)', description: 'Banco emissor da liquidação' },
      { name: 'valor_recebido', type: 'NUMERIC(12, 2)', nullable: false, description: 'Valor recebido na conta' },
      { name: 'referencia_recebida', type: 'VARCHAR(20)', nullable: false, description: 'Referência transmitida no extrato' },
      { name: 'origem', type: 'origem_confirmacao', nullable: false, description: "'webhook' ou 'manual_admin'" },
      { name: 'admin_id', type: 'UUID', nullable: true, isFk: true, fkTarget: 'usuarios(id)', description: 'ID do administrador que aprovou' },
      { name: 'data_recebimento', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'CURRENT_TIMESTAMP', description: 'Data da liquidação' }
    ],
    indexes: ['idx_pagamentos_compra (compra_id)', 'idx_pagamentos_data (data_recebimento)'],
    constraints: ['chk_valor_recebido_positivo CHECK (valor_recebido > 0)']
  },
  {
    name: 'conversas',
    category: 'IA E GERAÇÕES',
    description: 'Sessões de conversa com o Assistente de Inteligência Artificial Five IA',
    columns: [
      { name: 'id', type: 'UUID', nullable: false, isPk: true, defaultValue: 'gen_random_uuid()', description: 'ID da conversa' },
      { name: 'usuario_id', type: 'UUID', nullable: false, isFk: true, fkTarget: 'usuarios(id)', description: 'Utilizador dono da conversa' },
      { name: 'titulo', type: 'VARCHAR(255)', nullable: false, defaultValue: "'Nova Conversa Five IA'", description: 'Título da conversa' },
      { name: 'data_criacao', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'CURRENT_TIMESTAMP', description: 'Data de início' }
    ],
    indexes: ['idx_conversas_usuario (usuario_id)'],
    constraints: []
  },
  {
    name: 'mensagens',
    category: 'IA E GERAÇÕES',
    description: 'Mensagens trocadas com o assistente IA e coins consumidos',
    columns: [
      { name: 'id', type: 'UUID', nullable: false, isPk: true, defaultValue: 'gen_random_uuid()', description: 'ID da mensagem' },
      { name: 'conversa_id', type: 'UUID', nullable: false, isFk: true, fkTarget: 'conversas(id)', description: 'Conversa pertencente' },
      { name: 'papel', type: 'papel_mensagem', nullable: false, description: "'usuario' ou 'assistente'" },
      { name: 'conteudo', type: 'TEXT', nullable: false, description: 'Conteúdo textual da mensagem' },
      { name: 'coins_gastos', type: 'INT', nullable: false, defaultValue: '0', description: 'Coins cobrados (se aplicável)' },
      { name: 'data', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'CURRENT_TIMESTAMP', description: 'Timestamp da mensagem' }
    ],
    indexes: ['idx_mensagens_conversa_data (conversa_id, data ASC)'],
    constraints: ['chk_coins_gastos_positivos CHECK (coins_gastos >= 0)']
  },
  {
    name: 'geracoes',
    category: 'IA E GERAÇÕES',
    description: 'Gerações e edições de imagem e vídeo com prompts, custos e links de ficheiros',
    columns: [
      { name: 'id', type: 'UUID', nullable: false, isPk: true, defaultValue: 'gen_random_uuid()', description: 'ID da geração' },
      { name: 'usuario_id', type: 'UUID', nullable: false, isFk: true, fkTarget: 'usuarios(id)', description: 'Utilizador solicitante' },
      { name: 'tipo', type: 'tipo_geracao', nullable: false, description: "'foto' ou 'video'" },
      { name: 'prompt', type: 'TEXT', nullable: false, description: 'Comando/descrição detalhada' },
      { name: 'estado', type: 'estado_geracao', nullable: false, defaultValue: "'na_fila'", description: "'na_fila', 'a_gerar', 'concluido', 'falhou'" },
      { name: 'coins_gastos', type: 'INT', nullable: false, description: 'Coins debitados na operação' },
      { name: 'url_ficheiro', type: 'TEXT', nullable: true, description: 'URL da imagem ou vídeo gerado' },
      { name: 'duracao_segundos', type: 'INT', nullable: true, description: 'Duração em segundos (obrigatório se vídeo)' },
      { name: 'largura', type: 'INT', nullable: true, defaultValue: '1024', description: 'Resolução horizontal' },
      { name: 'altura', type: 'INT', nullable: true, defaultValue: '1024', description: 'Resolução vertical' },
      { name: 'modelo_utilizado', type: 'VARCHAR(100)', nullable: true, description: 'Modelo Gemini/Veo empregado' },
      { name: 'data_criacao', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'CURRENT_TIMESTAMP', description: 'Início do processamento' },
      { name: 'data_conclusao', type: 'TIMESTAMPTZ', nullable: true, description: 'Fim do processamento' }
    ],
    indexes: ['idx_geracoes_usuario_data (usuario_id, data_criacao DESC)', 'idx_geracoes_tipo_estado (tipo, estado)'],
    constraints: ['chk_coins_geracao CHECK (coins_gastos >= 0)', "chk_duracao_video CHECK ((tipo = 'foto' AND duracao_segundos IS NULL) OR (tipo = 'video' AND duracao_segundos IS NOT NULL AND duracao_segundos >= 5))"]
  },
  {
    name: 'notificacoes',
    category: 'SISTEMA E AUDITORIA',
    description: 'Alertas de pagamento confirmado, referências expiradas, NIF e conclusão de geração',
    columns: [
      { name: 'id', type: 'UUID', nullable: false, isPk: true, defaultValue: 'gen_random_uuid()', description: 'ID da notificação' },
      { name: 'usuario_id', type: 'UUID', nullable: false, isFk: true, fkTarget: 'usuarios(id)', description: 'Destinatário' },
      { name: 'tipo', type: 'tipo_notificacao', nullable: false, description: "'pagamento_confirmado', 'referencia_expirada', 'nif_invalido', 'geracao_concluida'" },
      { name: 'mensagem', type: 'TEXT', nullable: false, description: 'Texto da notificação' },
      { name: 'lida', type: 'BOOLEAN', nullable: false, defaultValue: 'false', description: 'Se o utilizador já visualizou' },
      { name: 'data', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'CURRENT_TIMESTAMP', description: 'Data do disparo' }
    ],
    indexes: ['idx_notificacoes_usuario_lida (usuario_id, lida, data DESC)'],
    constraints: []
  },
  {
    name: 'logs_auditoria',
    category: 'SISTEMA E AUDITORIA',
    description: 'Registo exaustivo de auditoria de segurança e ações administrativas de OTsUkY FiVe',
    columns: [
      { name: 'id', type: 'UUID', nullable: false, isPk: true, defaultValue: 'gen_random_uuid()', description: 'ID do log' },
      { name: 'usuario_id', type: 'UUID', nullable: true, isFk: true, fkTarget: 'usuarios(id)', description: 'Utilizador responsável (ou null se sistema)' },
      { name: 'acao', type: 'VARCHAR(100)', nullable: false, description: 'Identificador da ação auditada' },
      { name: 'detalhes', type: 'JSONB', nullable: false, defaultValue: "'{}'::jsonb", description: 'Carga útil com parâmetros e alterações' },
      { name: 'ip', type: 'VARCHAR(45)', nullable: true, description: 'Endereço IP do solicitante' },
      { name: 'data', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'CURRENT_TIMESTAMP', description: 'Timestamp de auditoria' }
    ],
    indexes: ['idx_logs_auditoria_usuario_data (usuario_id, data DESC)', 'idx_logs_auditoria_acao (acao)'],
    constraints: []
  }
];

export interface QueryExample {
  id: string;
  number: number;
  title: string;
  description: string;
  sql: string;
}

export const FIVE_IA_QUERIES: QueryExample[] = [
  {
    id: 'q1',
    number: 1,
    title: 'Saldo do Usuário',
    description: 'Consulta o saldo atual de Five Coins, dados cadastrais e estado do NIF angolano para um utilizador específico.',
    sql: `SELECT 
    u.id AS usuario_id,
    u.nome,
    u.email,
    u.papel,
    c.saldo_five_coins,
    COALESCE(n.estado, 'pendente') AS estado_nif,
    n.nif_mascarado,
    c.data_atualizacao
FROM usuarios u
INNER JOIN carteiras c ON c.usuario_id = u.id
LEFT JOIN nif_usuarios n ON n.usuario_id = u.id
WHERE u.id = 'u0000000-0000-0000-0000-000000000002';`
  },
  {
    id: 'q2',
    number: 2,
    title: 'Histórico de Coins',
    description: 'Extrato imutável de todas as movimentações (compras, gastos em IA, bónus, reembolsos) com saldo verificado.',
    sql: `SELECT 
    tc.id AS transacao_id,
    tc.data,
    tc.tipo,
    tc.quantidade,
    tc.saldo_apos,
    tc.referencia_id,
    tc.descricao
FROM transacoes_coins tc
WHERE tc.usuario_id = 'u0000000-0000-0000-0000-000000000002'
ORDER BY tc.data DESC;`
  },
  {
    id: 'q3',
    number: 3,
    title: 'Compras Pagas',
    description: 'Lista todas as compras faturadas com sucesso com detalhes do pacote, banco e método de liquidação.',
    sql: `SELECT 
    cp.id AS compra_id,
    cp.referencia_pagamento,
    cp.entidade,
    u.nome AS usuario_nome,
    u.email AS usuario_email,
    p.nome AS pacote_nome,
    p.quantidade_coins AS coins_recebidos,
    cp.valor_kwanza,
    cp.metodo_pagamento,
    b.nome AS banco_nome,
    b.codigo AS banco_codigo,
    cp.data_pagamento,
    pc.origem AS origem_confirmacao,
    pc.data_recebimento
FROM compras cp
INNER JOIN usuarios u ON u.id = cp.usuario_id
INNER JOIN pacotes_coins p ON p.id = cp.pacote_id
INNER JOIN bancos b ON b.id = cp.banco_id
LEFT JOIN pagamentos_confirmacao pc ON pc.compra_id = cp.id
WHERE cp.estado = 'pago'
ORDER BY cp.data_pagamento DESC;`
  },
  {
    id: 'q4',
    number: 4,
    title: 'Gerações por Usuário',
    description: 'Relatório de imagens e vídeos gerados, tempo de renderização, prompt e Five Coins consumidos.',
    sql: `SELECT 
    g.id AS geracao_id,
    g.tipo,
    g.prompt,
    g.estado,
    g.coins_gastos,
    g.duracao_segundos,
    g.url_ficheiro,
    g.data_criacao,
    g.data_conclusao,
    ROUND(EXTRACT(EPOCH FROM (g.data_conclusao - g.data_criacao))::numeric, 2) AS tempo_segundos
FROM geracoes g
WHERE g.usuario_id = 'u0000000-0000-0000-0000-000000000002'
ORDER BY g.data_criacao DESC;`
  },
  {
    id: 'q5',
    number: 5,
    title: 'Compras Pendentes por Banco',
    description: 'Volume e total em Kwanzas aguardando confirmação ou liquidação em cada banco angolano parceiro.',
    sql: `SELECT 
    b.codigo AS banco_codigo,
    b.nome AS banco_nome,
    COUNT(cp.id) AS total_compras_pendentes,
    SUM(cp.valor_kwanza) AS valor_total_kwanza_pendente,
    MIN(cp.data_criacao) AS compra_mais_antiga_pendente
FROM bancos b
LEFT JOIN compras cp ON cp.banco_id = b.id AND cp.estado = 'pendente'
WHERE b.ativo = true
GROUP BY b.id, b.codigo, b.nome
HAVING COUNT(cp.id) > 0
ORDER BY valor_total_kwanza_pendente DESC;`
  },
  {
    id: 'q6',
    number: 6,
    title: 'Compras Pagas por Método (ATM vs Referência)',
    description: 'Comparativo percentual e financeiro entre pagamentos no ATM Multicaixa físico e Pagamento por Referência bancária.',
    sql: `SELECT 
    cp.metodo_pagamento,
    COUNT(cp.id) AS quantidade_compras,
    SUM(cp.valor_kwanza) AS total_arrecadado_kwanza,
    ROUND(AVG(cp.valor_kwanza), 2) AS ticket_medio_kwanza,
    ROUND((COUNT(cp.id)::numeric / NULLIF(SUM(COUNT(cp.id)) OVER (), 0) * 100), 2) AS percentual_transacoes,
    ROUND((SUM(cp.valor_kwanza)::numeric / NULLIF(SUM(SUM(cp.valor_kwanza)) OVER (), 0) * 100), 2) AS percentual_faturamento
FROM compras cp
WHERE cp.estado = 'pago'
GROUP BY cp.metodo_pagamento
ORDER BY total_arrecadado_kwanza DESC;`
  },
  {
    id: 'q7',
    number: 7,
    title: 'Referências Expiradas',
    description: 'Identifica transações que ultrapassaram a janela de 72 horas para expiração automática e notificação do cliente.',
    sql: `SELECT 
    cp.id AS compra_id,
    cp.referencia_pagamento,
    cp.entidade,
    cp.valor_kwanza,
    u.nome AS usuario_nome,
    u.email AS usuario_email,
    b.codigo AS banco_codigo,
    cp.data_criacao,
    cp.data_expiracao,
    CURRENT_TIMESTAMP - cp.data_expiracao AS tempo_expirado_atraso
FROM compras cp
INNER JOIN usuarios u ON u.id = cp.usuario_id
INNER JOIN bancos b ON b.id = cp.banco_id
WHERE cp.estado = 'pendente' 
  AND cp.data_expiracao < CURRENT_TIMESTAMP
ORDER BY cp.data_expiracao ASC;`
  },
  {
    id: 'q8',
    number: 8,
    title: 'Total Faturado em Kwanza por Banco e por Mês',
    description: 'Relatório executivo financeiro mensal para o proprietário OTsUkY FiVe e equipa financeira da Five IA.',
    sql: `SELECT 
    TO_CHAR(cp.data_pagamento, 'YYYY-MM') AS ano_mes,
    b.codigo AS banco_codigo,
    b.nome AS banco_nome,
    COUNT(cp.id) AS total_pagamentos,
    SUM(cp.valor_kwanza) AS total_kwanza,
    ROUND(AVG(cp.valor_kwanza), 2) AS ticket_medio_kwanza
FROM compras cp
INNER JOIN bancos b ON b.id = cp.banco_id
WHERE cp.estado = 'pago'
  AND cp.data_pagamento IS NOT NULL
GROUP BY TO_CHAR(cp.data_pagamento, 'YYYY-MM'), b.id, b.codigo, b.nome
ORDER BY ano_mes DESC, total_kwanza DESC;`
  }
];
