-- ============================================================================
-- SCRIPT DE POVOAMENTO INICIAL (SEED) - FIVE IA
-- Contém conta do Dono/Admin OTsUkY FiVe, bancos de Angola, pacotes e custos
-- ============================================================================

-- 1. POVOAR BANCOS DE ANGOLA
INSERT INTO bancos (id, nome, codigo, logotipo_url, ativo) VALUES
('b1000000-0000-0000-0000-000000000001', 'Banco Angolano de Investimentos (BAI)', 'BAI', 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Banco_Angolano_de_Investimentos_logo.png', true),
('b1000000-0000-0000-0000-000000000002', 'Banco de Fomento Angola (BFA)', 'BFA', 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Logo_BFA.png', true),
('b1000000-0000-0000-0000-000000000003', 'Banco Millennium Atlântico', 'ATL', 'https://upload.wikimedia.org/wikipedia/commons/6/60/Banco_Millennium_Atlantico.png', true),
('b1000000-0000-0000-0000-000000000004', 'Banco BIC Angola', 'BIC', 'https://upload.wikimedia.org/wikipedia/commons/5/52/Banco_BIC_logo.png', true),
('b1000000-0000-0000-0000-000000000005', 'Standard Bank de Angola', 'STB', 'https://upload.wikimedia.org/wikipedia/commons/9/9f/Standard_Bank_logo.png', true),
('b1000000-0000-0000-0000-000000000006', 'Banco Sol', 'SOL', 'https://upload.wikimedia.org/wikipedia/commons/e/e9/Banco_Sol_logo.png', true),
('b1000000-0000-0000-0000-000000000007', 'Banco Keve', 'KEV', 'https://upload.wikimedia.org/wikipedia/commons/d/d4/Banco_Keve.png', true),
('b1000000-0000-0000-0000-000000000008', 'Banco BNI Angola', 'BNI', 'https://upload.wikimedia.org/wikipedia/commons/a/a2/Banco_BNI.png', true)
ON CONFLICT (codigo) DO NOTHING;

-- 2. POVOAR CUSTOS DE SERVIÇOS FIVE IA
-- Regras obrigatórias:
-- 1 geração de imagem = 5 Five Coins
-- 1 geração de vídeo de 5 segundos = 5 Five Coins
-- Chat = 1 Five Coin (ou configurável)
INSERT INTO custos_servicos (id, servico, custo_coins, duracao_base_segundos, custo_por_segundo_extra, ativo) VALUES
('c1000000-0000-0000-0000-000000000001', 'chat', 1, NULL, 0, true),
('c1000000-0000-0000-0000-000000000002', 'foto', 5, NULL, 0, true),
('c1000000-0000-0000-0000-000000000003', 'video', 5, 5, 1, true)
ON CONFLICT (servico) DO UPDATE SET
    custo_coins = EXCLUDED.custo_coins,
    duracao_base_segundos = EXCLUDED.duracao_base_segundos,
    custo_por_segundo_extra = EXCLUDED.custo_por_segundo_extra;

-- 3. POVOAR PACOTES DE FIVE COINS EM KWANZAS (AOA)
-- Pacotes configurados: 500 Kz, 1.000 Kz, 2.000 Kz, 3.000 Kz, 5.000 Kz
INSERT INTO pacotes_coins (id, nome, quantidade_coins, preco_kwanza, ativo) VALUES
('p1000000-0000-0000-0000-000000000001', 'Pacote Iniciante', 50, 500.00, true),
('p1000000-0000-0000-0000-000000000002', 'Pacote Essencial', 110, 1000.00, true),
('p1000000-0000-0000-0000-000000000003', 'Pacote Criativo (Popular)', 230, 2000.00, true),
('p1000000-0000-0000-0000-000000000004', 'Pacote Studio', 360, 3000.00, true),
('p1000000-0000-0000-0000-000000000005', 'Pacote Profissional Pro', 650, 5000.00, true)
ON CONFLICT (id) DO NOTHING;

-- 4. POVOAR CONTA DE RECEBIMENTO DO DONO (OTsUkY FiVe)
INSERT INTO conta_recebimento (id, banco_id, titular, iban, iban_mascarado, entidade, ativo) VALUES
('cr000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'Five AI / OTsUkY FiVe', '$2b$10$C75KqG8bM1X9wY2zL0mNPO8Q1Z4vJ3...', 'AO06 0040 0000 1234 5678 9012 3', '00551', true),
('cr000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000002', 'Five AI / OTsUkY FiVe', '$2b$10$D86LrI9cN2Y0xZ3aM1nOQP9R2A5wK4...', 'AO06 0006 0000 9876 5432 1098 7', '00551', true)
ON CONFLICT (id) DO NOTHING;

-- 5. POVOAR USUÁRIO PRINCIPAL: OTsUkY FiVe (SUPER ADMIN & DONO)
INSERT INTO usuarios (id, nome, email, telefone, senha, papel, estado, data_criacao, ultimo_login) VALUES
('u0000000-0000-0000-0000-000000000001', 'OTsUkY FiVe', 'otsukyfive@fiveia.ao', '+244923456789', '$argon2id$v=19$m=65536,t=3,p=4$OTsUkYFiVeSecureHash2026', 'dono', 'ativo', '2026-01-01 00:00:00+01', CURRENT_TIMESTAMP),
('u0000000-0000-0000-0000-000000000002', 'Domingos Kapa', 'domingos@fiveia.ao', '+244934567890', '$argon2id$v=19$m=65536,t=3,p=4$UserPassHashDomingos2026', 'usuario', 'ativo', '2026-02-15 10:30:00+01', CURRENT_TIMESTAMP),
('u0000000-0000-0000-0000-000000000003', 'Helena Afonso', 'helena@gmail.com', '+244912345678', '$argon2id$v=19$m=65536,t=3,p=4$UserPassHashHelena2026', 'usuario', 'ativo', '2026-03-01 14:00:00+01', CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;

-- 6. CARTEIRAS E SALDOS
INSERT INTO carteiras (usuario_id, saldo_five_coins) VALUES
('u0000000-0000-0000-0000-000000000001', 99999), -- Saldo ilimitado de gestão para o Dono
('u0000000-0000-0000-0000-000000000002', 125),   -- Domingos Kapa
('u0000000-0000-0000-0000-000000000003', 45)     -- Helena Afonso
ON CONFLICT (usuario_id) DO UPDATE SET saldo_five_coins = EXCLUDED.saldo_five_coins;

-- 7. REGISTRO DE NIFS ANGOLANOS
INSERT INTO nif_usuarios (usuario_id, nif, nif_mascarado, tipo_pessoa, estado, data_verificacao, tentativas, mensagem_validacao) VALUES
('u0000000-0000-0000-0000-000000000001', '$2b$10$NifHashOTsUkYFiVePessoaColetiva99', '5417032190', 'coletiva', 'valido', '2026-01-01 00:00:00+01', 0, 'NIF validado com sucesso na base AGT.'),
('u0000000-0000-0000-0000-000000000002', '$2b$10$NifHashDomingosPessoaSingular123', '005423189LA042', 'singular', 'valido', '2026-02-15 10:35:00+01', 0, 'NIF Pessoa Singular validado com sucesso.'),
('u0000000-0000-0000-0000-000000000003', '$2b$10$NifHashHelenaPessoaSingular456', '008912340UE018', 'singular', 'valido', '2026-03-01 14:05:00+01', 0, 'NIF validado e habilitado para compras.')
ON CONFLICT (usuario_id) DO NOTHING;

-- 8. COMPRAS HISTÓRICAS E TRANSAÇÕES DE EXEMPLO
INSERT INTO compras (id, usuario_id, pacote_id, valor_kwanza, metodo_pagamento, banco_id, referencia_pagamento, entidade, estado, data_criacao, data_expiracao, data_pagamento) VALUES
('cp000000-0000-0000-0000-000000000001', 'u0000000-0000-0000-0000-000000000002', 'p1000000-0000-0000-0000-000000000003', 2000.00, 'referencia', 'b1000000-0000-0000-0000-000000000001', '942851029', '00551', 'pago', '2026-03-10 09:00:00+01', '2026-03-13 09:00:00+01', '2026-03-10 10:15:22+01'),
('cp000000-0000-0000-0000-000000000002', 'u0000000-0000-0000-0000-000000000003', 'p1000000-0000-0000-0000-000000000001', 500.00, 'atm', 'b1000000-0000-0000-0000-000000000002', '712904815', '00551', 'pago', '2026-03-11 11:20:00+01', '2026-03-14 11:20:00+01', '2026-03-11 11:45:10+01'),
('cp000000-0000-0000-0000-000000000003', 'u0000000-0000-0000-0000-000000000002', 'p1000000-0000-0000-0000-000000000002', 1000.00, 'referencia', 'b1000000-0000-0000-0000-000000000001', '381940521', '00551', 'pendente', CURRENT_TIMESTAMP - INTERVAL '2 hours', CURRENT_TIMESTAMP + INTERVAL '70 hours', NULL),
('cp000000-0000-0000-0000-000000000004', 'u0000000-0000-0000-0000-000000000003', 'p1000000-0000-0000-0000-000000000004', 3000.00, 'referencia', 'b1000000-0000-0000-0000-000000000003', '109283745', '00551', 'expirado', CURRENT_TIMESTAMP - INTERVAL '100 hours', CURRENT_TIMESTAMP - INTERVAL '28 hours', NULL)
ON CONFLICT (id) DO NOTHING;

-- 9. CONFIRMAÇÃO DE PAGAMENTOS
INSERT INTO pagamentos_confirmacao (id, compra_id, banco_id, valor_recebido, referencia_recebida, origem, admin_id, data_recebimento) VALUES
('pc000000-0000-0000-0000-000000000001', 'cp000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 2000.00, '942851029', 'webhook', NULL, '2026-03-10 10:15:22+01'),
('pc000000-0000-0000-0000-000000000002', 'cp000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000002', 500.00, '712904815', 'manual_admin', 'u0000000-0000-0000-0000-000000000001', '2026-03-11 11:45:10+01')
ON CONFLICT (compra_id) DO NOTHING;

-- 10. TRANSAÇÕES DE COINS HISTÓRICAS
INSERT INTO transacoes_coins (id, usuario_id, tipo, quantidade, saldo_apos, referencia_id, descricao, data) VALUES
('tc000000-0000-0000-0000-000000000001', 'u0000000-0000-0000-0000-000000000002', 'compra', 230, 230, 'cp000000-0000-0000-0000-000000000001', 'Compra do Pacote Criativo (2.000 Kz) via Referência BAI', '2026-03-10 10:15:25+01'),
('tc000000-0000-0000-0000-000000000002', 'u0000000-0000-0000-0000-000000000002', 'gasto', -5, 225, 'g0000000-0000-0000-0000-000000000001', 'Geração de Imagem IA: Retrato futurista em Luanda', '2026-03-10 11:00:00+01'),
('tc000000-0000-0000-0000-000000000003', 'u0000000-0000-0000-0000-000000000002', 'gasto', -5, 220, 'g0000000-0000-0000-0000-000000000002', 'Geração de Vídeo IA (5s): Baía de Luanda ao pôr do sol', '2026-03-10 11:30:00+01')
ON CONFLICT (id) DO NOTHING;

-- 11. GERAÇÕES EXEMPLO
INSERT INTO geracoes (id, usuario_id, tipo, prompt, estado, coins_gastos, url_ficheiro, duracao_segundos, data_criacao, data_conclusao) VALUES
('g0000000-0000-0000-0000-000000000001', 'u0000000-0000-0000-0000-000000000002', 'foto', 'Retrato cyberpunk estilizado de jovem empreendedor angolano com iluminação dourada e fundo Baía de Luanda', 'concluido', 5, 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80', NULL, '2026-03-10 10:59:00+01', '2026-03-10 11:00:00+01'),
('g0000000-0000-0000-0000-000000000002', 'u0000000-0000-0000-0000-000000000002', 'video', 'Vista aérea cinematográfica em 4K das Quedas de Kalandula ao amanhecer com névoa mística', 'concluido', 5, 'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-a-beautiful-waterfall-41584-large.mp4', 5, '2026-03-10 11:28:00+01', '2026-03-10 11:30:00+01')
ON CONFLICT (id) DO NOTHING;

-- 12. LOGS DE AUDITORIA
INSERT INTO logs_auditoria (usuario_id, acao, detalhes, ip) VALUES
('u0000000-0000-0000-0000-000000000001', 'INICIALIZACAO_SISTEMA', '{"responsavel": "OTsUkY FiVe", "versao": "1.0.0", "status": "ativo"}'::jsonb, '102.214.30.12'),
('u0000000-0000-0000-0000-000000000001', 'CONFIRMACAO_MANUAL_PAGAMENTO', '{"compra_id": "cp000000-0000-0000-0000-000000000002", "referencia": "712904815", "valor": 500}'::jsonb, '102.214.30.12');
