-- ============================================================================
-- EXEMPLOS DE CONSULTAS SQL - FIVE IA (POSTGRESQL)
-- Solicitadas na especificação do projeto pelo criador OTsUkY FiVe
-- ============================================================================

-- ============================================================================
-- CONSULTA 1: SALDO DO USUÁRIO
-- Retorna o saldo atual em Five Coins do usuário com dados da conta e estado do NIF
-- ============================================================================
SELECT 
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
WHERE u.id = 'u0000000-0000-0000-0000-000000000002';


-- ============================================================================
-- CONSULTA 2: HISTÓRICO DE COINS
-- Extrato histórico detalhado de movimentações (compras, gastos, bônus, reembolsos)
-- Ordenado cronologicamente decrescente
-- ============================================================================
SELECT 
    tc.id AS transacao_id,
    tc.data,
    tc.tipo,
    tc.quantidade,
    tc.saldo_apos,
    tc.referencia_id,
    tc.descricao
FROM transacoes_coins tc
WHERE tc.usuario_id = 'u0000000-0000-0000-0000-000000000002'
ORDER BY tc.data DESC;


-- ============================================================================
-- CONSULTA 3: COMPRAS PAGAS
-- Lista todas as compras confirmadas e pagas com detalhes do pacote e banco
-- ============================================================================
SELECT 
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
ORDER BY cp.data_pagamento DESC;


-- ============================================================================
-- CONSULTA 4: GERAÇÕES POR USUÁRIO
-- Retorna todas as fotos e vídeos gerados pelo usuário, custo em coins e status
-- ============================================================================
SELECT 
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
ORDER BY g.data_criacao DESC;


-- ============================================================================
-- CONSULTA 5: COMPRAS PENDENTES POR BANCO
-- Compras aguardando pagamento ou confirmação bancária, agrupadas por banco
-- ============================================================================
SELECT 
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
ORDER BY valor_total_kwanza_pendente DESC;


-- ============================================================================
-- CONSULTA 6: COMPRAS PAGAS POR MÉTODO (ATM VS REFERÊNCIA)
-- Comparativo analítico entre pagamentos via Caixa Multicaixa (ATM) e Referência
-- ============================================================================
SELECT 
    cp.metodo_pagamento,
    COUNT(cp.id) AS quantidade_compras,
    SUM(cp.valor_kwanza) AS total_arrecadado_kwanza,
    ROUND(AVG(cp.valor_kwanza), 2) AS ticket_medio_kwanza,
    ROUND((COUNT(cp.id)::numeric / NULLIF(SUM(COUNT(cp.id)) OVER (), 0) * 100), 2) AS percentual_transacoes,
    ROUND((SUM(cp.valor_kwanza)::numeric / NULLIF(SUM(SUM(cp.valor_kwanza)) OVER (), 0) * 100), 2) AS percentual_faturamento
FROM compras cp
WHERE cp.estado = 'pago'
GROUP BY cp.metodo_pagamento
ORDER BY total_arrecadado_kwanza DESC;


-- ============================================================================
-- CONSULTA 7: REFERÊNCIAS EXPIRADAS
-- Identifica referências que passaram do prazo limite de 72 horas sem confirmação
-- Permite ao sistema ou cronjob atualizar o estado para 'expirado' e notificar
-- ============================================================================
SELECT 
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
ORDER BY cp.data_expiracao ASC;


-- ============================================================================
-- CONSULTA 8: TOTAL FATURADO EM KWANZA POR BANCO E POR MÊS
-- Relatório executivo financeiro para a administração (OTsUkY FiVe)
-- ============================================================================
SELECT 
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
ORDER BY ano_mes DESC, total_kwanza DESC;
