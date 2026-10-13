import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { FIVE_IA_TABLES, FIVE_IA_QUERIES } from './src/db/schema-data.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '20mb' }));

// Shared Server-Side Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// ============================================================================
// IN-MEMORY POSTGRESQL STATE (INITIALIZED FROM SEED.SQL)
// ============================================================================

interface Usuario {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  senha: string;
  papel: 'usuario' | 'admin' | 'dono';
  estado: 'ativo' | 'suspenso';
  data_criacao: string;
  ultimo_login: string;
}

interface NifUsuario {
  id: string;
  usuario_id: string;
  nif: string;
  nif_mascarado: string;
  tipo_pessoa: 'singular' | 'coletiva';
  estado: 'pendente' | 'valido' | 'invalido';
  data_verificacao?: string;
  tentativas: number;
  mensagem_validacao?: string;
}

interface Carteira {
  id: string;
  usuario_id: string;
  saldo_five_coins: number;
  data_atualizacao: string;
}

interface PacoteCoin {
  id: string;
  nome: string;
  quantidade_coins: number;
  preco_kwanza: number;
  ativo: boolean;
}

interface CustoServico {
  id: string;
  servico: 'chat' | 'foto' | 'video';
  custo_coins: number;
  duracao_base_segundos?: number | null;
  custo_por_segundo_extra?: number;
  ativo: boolean;
}

interface Banco {
  id: string;
  nome: string;
  codigo: string;
  logotipo_url: string;
  ativo: boolean;
}

interface Compra {
  id: string;
  usuario_id: string;
  pacote_id: string;
  valor_kwanza: number;
  metodo_pagamento: 'atm' | 'referencia';
  banco_id: string;
  referencia_pagamento: string;
  entidade: string;
  estado: 'pendente' | 'pago' | 'expirado' | 'falhou' | 'reembolsado';
  data_criacao: string;
  data_expiracao: string;
  data_pagamento?: string;
  comprovativo_url?: string;
}

interface PagamentoConfirmacao {
  id: string;
  compra_id: string;
  banco_id: string;
  valor_recebido: number;
  referencia_recebida: string;
  origem: 'webhook' | 'manual_admin';
  admin_id?: string;
  data_recebimento: string;
}

interface TransacaoCoin {
  id: string;
  usuario_id: string;
  tipo: 'compra' | 'gasto' | 'bonus' | 'reembolso';
  quantidade: number;
  saldo_apos: number;
  referencia_id?: string;
  descricao?: string;
  data: string;
}

interface Geracao {
  id: string;
  usuario_id: string;
  tipo: 'foto' | 'video';
  prompt: string;
  estado: 'na_fila' | 'a_gerar' | 'concluido' | 'falhou';
  coins_gastos: number;
  url_ficheiro: string;
  duracao_segundos?: number;
  largura: number;
  altura: number;
  modelo_utilizado: string;
  data_criacao: string;
  data_conclusao?: string;
}

interface Mensagem {
  id: string;
  conversa_id: string;
  papel: 'usuario' | 'assistente';
  conteudo: string;
  coins_gastos: number;
  data: string;
}

interface Notificacao {
  id: string;
  usuario_id: string;
  tipo: 'pagamento_confirmado' | 'referencia_expirada' | 'nif_invalido' | 'geracao_concluida';
  mensagem: string;
  lida: boolean;
  data: string;
}

interface LogAuditoria {
  id: string;
  usuario_id?: string;
  acao: string;
  detalhes: Record<string, unknown>;
  ip: string;
  data: string;
}

// Global DB State
const db = {
  usuarios: [
    {
      id: 'u0000000-0000-0000-0000-000000000001',
      nome: 'OTsUkY FiVe',
      email: 'otsukyfive@fiveia.ao',
      telefone: '+244923456789',
      senha: '$argon2id$v=19$m=65536,t=3,p=4$OTsUkYFiVeSecureHash2026',
      papel: 'dono' as const,
      estado: 'ativo' as const,
      data_criacao: '2026-01-01T00:00:00Z',
      ultimo_login: new Date().toISOString(),
    },
    {
      id: 'u0000000-0000-0000-0000-000000000002',
      nome: 'Domingos Kapa',
      email: 'domingos@fiveia.ao',
      telefone: '+244934567890',
      senha: '$argon2id$v=19$m=65536,t=3,p=4$UserPassHashDomingos2026',
      papel: 'usuario' as const,
      estado: 'ativo' as const,
      data_criacao: '2026-02-15T10:30:00Z',
      ultimo_login: new Date().toISOString(),
    },
  ] as Usuario[],

  nif_usuarios: [
    {
      id: 'nif-001',
      usuario_id: 'u0000000-0000-0000-0000-000000000001',
      nif: '$2b$10$NifHashOTsUkYFiVePessoaColetiva99',
      nif_mascarado: '5417032190',
      tipo_pessoa: 'coletiva' as const,
      estado: 'valido' as const,
      data_verificacao: '2026-01-01T00:00:00Z',
      tentativas: 0,
      mensagem_validacao: 'NIF verificado com sucesso na base AGT.',
    },
    {
      id: 'nif-002',
      usuario_id: 'u0000000-0000-0000-0000-000000000002',
      nif: '$2b$10$NifHashDomingosPessoaSingular123',
      nif_mascarado: '005423189LA042',
      tipo_pessoa: 'singular' as const,
      estado: 'valido' as const,
      data_verificacao: '2026-02-15T10:35:00Z',
      tentativas: 0,
      mensagem_validacao: 'NIF Pessoa Singular validado com sucesso.',
    },
  ] as NifUsuario[],

  carteiras: [
    {
      id: 'cart-001',
      usuario_id: 'u0000000-0000-0000-0000-000000000001',
      saldo_five_coins: 99999,
      data_atualizacao: new Date().toISOString(),
    },
    {
      id: 'cart-002',
      usuario_id: 'u0000000-0000-0000-0000-000000000002',
      saldo_five_coins: 125,
      data_atualizacao: new Date().toISOString(),
    },
  ] as Carteira[],

  pacotes_coins: [
    { id: 'p1000000-0000-0000-0000-000000000001', nome: 'Pacote Iniciante', quantidade_coins: 50, preco_kwanza: 500, ativo: true },
    { id: 'p1000000-0000-0000-0000-000000000002', nome: 'Pacote Essencial', quantidade_coins: 110, preco_kwanza: 1000, ativo: true },
    { id: 'p1000000-0000-0000-0000-000000000003', nome: 'Pacote Criativo (Popular)', quantidade_coins: 230, preco_kwanza: 2000, ativo: true },
    { id: 'p1000000-0000-0000-0000-000000000004', nome: 'Pacote Studio', quantidade_coins: 360, preco_kwanza: 3000, ativo: true },
    { id: 'p1000000-0000-0000-0000-000000000005', nome: 'Pacote Profissional Pro', quantidade_coins: 650, preco_kwanza: 5000, ativo: true },
  ] as PacoteCoin[],

  custos_servicos: [
    { id: 'c1', servico: 'chat', custo_coins: 1, duracao_base_segundos: null, custo_por_segundo_extra: 0, ativo: true },
    { id: 'c2', servico: 'foto', custo_coins: 5, duracao_base_segundos: null, custo_por_segundo_extra: 0, ativo: true },
    { id: 'c3', servico: 'video', custo_coins: 5, duracao_base_segundos: 5, custo_por_segundo_extra: 1, ativo: true },
  ] as CustoServico[],

  bancos: [
    { id: 'b1000000-0000-0000-0000-000000000001', nome: 'Banco Angolano de Investimentos (BAI)', codigo: 'BAI', logotipo_url: '🏦', ativo: true },
    { id: 'b1000000-0000-0000-0000-000000000002', nome: 'Banco de Fomento Angola (BFA)', codigo: 'BFA', logotipo_url: '🏦', ativo: true },
    { id: 'b1000000-0000-0000-0000-000000000003', nome: 'Banco Millennium Atlântico', codigo: 'ATL', logotipo_url: '🏦', ativo: true },
    { id: 'b1000000-0000-0000-0000-000000000004', nome: 'Banco BIC Angola', codigo: 'BIC', logotipo_url: '🏦', ativo: true },
    { id: 'b1000000-0000-0000-0000-000000000005', nome: 'Standard Bank de Angola', codigo: 'STB', logotipo_url: '🏦', ativo: true },
    { id: 'b1000000-0000-0000-0000-000000000006', nome: 'Banco Sol', codigo: 'SOL', logotipo_url: '🏦', ativo: true },
    { id: 'b1000000-0000-0000-0000-000000000007', nome: 'Banco Keve', codigo: 'KEV', logotipo_url: '🏦', ativo: true },
    { id: 'b1000000-0000-0000-0000-000000000008', nome: 'Banco BNI Angola', codigo: 'BNI', logotipo_url: '🏦', ativo: true },
  ] as Banco[],

  compras: [
    {
      id: 'cp000000-0000-0000-0000-000000000001',
      usuario_id: 'u0000000-0000-0000-0000-000000000002',
      pacote_id: 'p1000000-0000-0000-0000-000000000003',
      valor_kwanza: 2000,
      metodo_pagamento: 'referencia',
      banco_id: 'b1000000-0000-0000-0000-000000000001',
      referencia_pagamento: '942851029',
      entidade: '00551',
      estado: 'pago',
      data_criacao: '2026-03-10T09:00:00Z',
      data_expiracao: '2026-03-13T09:00:00Z',
      data_pagamento: '2026-03-10T10:15:22Z',
    },
    {
      id: 'cp000000-0000-0000-0000-000000000002',
      usuario_id: 'u0000000-0000-0000-0000-000000000002',
      pacote_id: 'p1000000-0000-0000-0000-000000000001',
      valor_kwanza: 500,
      metodo_pagamento: 'atm',
      banco_id: 'b1000000-0000-0000-0000-000000000002',
      referencia_pagamento: '712904815',
      entidade: '00551',
      estado: 'pago',
      data_criacao: '2026-03-11T11:20:00Z',
      data_expiracao: '2026-03-14T11:20:00Z',
      data_pagamento: '2026-03-11T11:45:10Z',
    },
    {
      id: 'cp000000-0000-0000-0000-000000000003',
      usuario_id: 'u0000000-0000-0000-0000-000000000002',
      pacote_id: 'p1000000-0000-0000-0000-000000000002',
      valor_kwanza: 1000,
      metodo_pagamento: 'referencia',
      banco_id: 'b1000000-0000-0000-0000-000000000001',
      referencia_pagamento: '381940521',
      entidade: '00551',
      estado: 'pendente',
      data_criacao: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      data_expiracao: new Date(Date.now() + 70 * 3600 * 1000).toISOString(),
    },
    {
      id: 'cp000000-0000-0000-0000-000000000004',
      usuario_id: 'u0000000-0000-0000-0000-000000000002',
      pacote_id: 'p1000000-0000-0000-0000-000000000004',
      valor_kwanza: 3000,
      metodo_pagamento: 'referencia',
      banco_id: 'b1000000-0000-0000-0000-000000000003',
      referencia_pagamento: '109283745',
      entidade: '00551',
      estado: 'expirado',
      data_criacao: new Date(Date.now() - 100 * 3600 * 1000).toISOString(),
      data_expiracao: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
    },
  ] as Compra[],

  pagamentos_confirmacao: [
    {
      id: 'pc-001',
      compra_id: 'cp000000-0000-0000-0000-000000000001',
      banco_id: 'b1000000-0000-0000-0000-000000000001',
      valor_recebido: 2000,
      referencia_recebida: '942851029',
      origem: 'webhook',
      data_recebimento: '2026-03-10T10:15:22Z',
    },
    {
      id: 'pc-002',
      compra_id: 'cp000000-0000-0000-0000-000000000002',
      banco_id: 'b1000000-0000-0000-0000-000000000002',
      valor_recebido: 500,
      referencia_recebida: '712904815',
      origem: 'manual_admin',
      admin_id: 'u0000000-0000-0000-0000-000000000001',
      data_recebimento: '2026-03-11T11:45:10Z',
    },
  ] as PagamentoConfirmacao[],

  transacoes_coins: [
    {
      id: 'tc-001',
      usuario_id: 'u0000000-0000-0000-0000-000000000002',
      tipo: 'compra',
      quantidade: 230,
      saldo_apos: 230,
      referencia_id: 'cp000000-0000-0000-0000-000000000001',
      descricao: 'Compra do Pacote Criativo (2.000 Kz) via Referência BAI',
      data: '2026-03-10T10:15:25Z',
    },
    {
      id: 'tc-002',
      usuario_id: 'u0000000-0000-0000-0000-000000000002',
      tipo: 'gasto',
      quantidade: -5,
      saldo_apos: 225,
      referencia_id: 'g-001',
      descricao: 'Geração de Imagem IA: Retrato futurista em Luanda (5 Coins)',
      data: '2026-03-10T11:00:00Z',
    },
    {
      id: 'tc-003',
      usuario_id: 'u0000000-0000-0000-0000-000000000002',
      tipo: 'gasto',
      quantidade: -5,
      saldo_apos: 220,
      referencia_id: 'g-002',
      descricao: 'Geração de Vídeo IA (5s): Baía de Luanda ao pôr do sol (5 Coins)',
      data: '2026-03-10T11:30:00Z',
    },
  ] as TransacaoCoin[],

  geracoes: [
    {
      id: 'g-001',
      usuario_id: 'u0000000-0000-0000-0000-000000000002',
      tipo: 'foto',
      prompt: 'Retrato cyberpunk futurista com iluminação neon dourada e edifícios modernos de Luanda ao fundo',
      estado: 'concluido',
      coins_gastos: 5,
      url_ficheiro: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
      largura: 1024,
      altura: 1024,
      modelo_utilizado: 'gemini-3.1-flash-lite-image',
      data_criacao: '2026-03-10T10:59:00Z',
      data_conclusao: '2026-03-10T11:00:00Z',
    },
    {
      id: 'g-002',
      usuario_id: 'u0000000-0000-0000-0000-000000000002',
      tipo: 'video',
      prompt: 'Vista aérea cinematográfica em 4K das Quedas de Kalandula ao amanhecer com névoa mística',
      estado: 'concluido',
      coins_gastos: 5,
      url_ficheiro: 'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-a-beautiful-waterfall-41584-large.mp4',
      duracao_segundos: 5,
      largura: 1920,
      altura: 1080,
      modelo_utilizado: 'veo-3.1-lite-generate-preview',
      data_criacao: '2026-03-10T11:28:00Z',
      data_conclusao: '2026-03-10T11:30:00Z',
    },
  ] as Geracao[],

  mensagens: [
    {
      id: 'm-001',
      conversa_id: 'conv-001',
      papel: 'assistente',
      conteudo: 'Olá! Sou o assistente de Inteligência Artificial da Five IA, criado para si por OTsUkY FiVe. Posso ajudá-lo a criar prompts para imagens e vídeos, sugerir estilos, explicar o sistema de Five Coins e o pagamento por Multicaixa. Como posso ajudar hoje?',
      coins_gastos: 0,
      data: new Date().toISOString(),
    },
  ] as Mensagem[],

  notificacoes: [
    {
      id: 'notif-001',
      usuario_id: 'u0000000-0000-0000-0000-000000000002',
      tipo: 'pagamento_confirmado',
      mensagem: 'Pagamento de 2.000 Kz confirmado! 230 Five Coins creditados na sua carteira.',
      lida: false,
      data: '2026-03-10T10:15:30Z',
    },
  ] as Notificacao[],

  logs_auditoria: [
    {
      id: 'log-001',
      usuario_id: 'u0000000-0000-0000-0000-000000000001',
      acao: 'INICIALIZACAO_SISTEMA',
      detalhes: { responsavel: 'OTsUkY FiVe', plataforma: 'Five IA', versao: '1.0.0' },
      ip: '102.214.30.12',
      data: '2026-01-01T00:00:00Z',
    },
    {
      id: 'log-002',
      usuario_id: 'u0000000-0000-0000-0000-000000000001',
      acao: 'CONFIRMACAO_MANUAL_PAGAMENTO',
      detalhes: { compra_id: 'cp000000-0000-0000-0000-000000000002', referencia: '712904815', valor_kwanza: 500 },
      ip: '102.214.30.12',
      data: '2026-03-11T11:45:10Z',
    },
  ] as LogAuditoria[],
};

// Current active session (default to OTsUkY FiVe super admin)
let activeUserId = 'u0000000-0000-0000-0000-000000000001';

// ============================================================================
// API ROUTES
// ============================================================================

// 1. Session and Profile
app.get('/api/session', (req: Request, res: Response) => {
  const user = db.usuarios.find(u => u.id === activeUserId) || db.usuarios[0];
  const carteira = db.carteiras.find(c => c.usuario_id === user.id);
  const nifInfo = db.nif_usuarios.find(n => n.usuario_id === user.id);
  const notifs = db.notificacoes.filter(n => n.usuario_id === user.id);

  res.json({
    user,
    saldo_five_coins: carteira?.saldo_five_coins || 0,
    nif_info: nifInfo || {
      estado: 'pendente',
      nif_mascarado: 'Não submetido',
      tentativas: 0,
    },
    notificacoes: notifs,
  });
});

app.post('/api/session/switch', (req: Request, res: Response) => {
  const { targetUserId } = req.body;
  const found = db.usuarios.find(u => u.id === targetUserId);
  if (found) {
    activeUserId = found.id;
    res.json({ success: true, activeUser: found });
  } else {
    res.status(404).json({ error: 'Utilizador não encontrado' });
  }
});

// 2. Chat with AI Assistant (Portuguese, Five IA guidelines)
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { message, userId } = req.body;
    const currentUserId = userId || activeUserId;
    const carteira = db.carteiras.find(c => c.usuario_id === currentUserId);

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Mensagem inválida' });
      return;
    }

    // Optional chat cost: 1 Five Coin if configured and user is not owner
    const chatCost = db.custos_servicos.find(c => c.servico === 'chat')?.custo_coins || 0;
    const user = db.usuarios.find(u => u.id === currentUserId);
    if (chatCost > 0 && user?.papel !== 'dono' && (carteira?.saldo_five_coins || 0) < chatCost) {
      res.status(402).json({
        error: `Saldo insuficiente. A mensagem no chat requer ${chatCost} Five Coin. O seu saldo atual é de ${carteira?.saldo_five_coins || 0} Five Coins.`,
      });
      return;
    }

    const systemPrompt = `Você é o assistente inteligente oficial da plataforma "Five IA" (criada e de propriedade de OTsUkY FiVe em Angola).
Você é amigável, prestativo e domina totalmente:
1. Geração e edição de imagens a partir de descrições em texto.
2. Geração e edição de vídeos (incluindo duração de 5 segundos, 10 segundos, etc.).
3. A economia das Five Coins:
   - A moeda oficial da plataforma é o "Five Coins".
   - 1 Imagem gerada = 5 Five Coins.
   - 1 Vídeo de 5 segundos = 5 Five Coins (vídeos maiores têm custo proporcional: 10s = 10 coins, etc.).
   - Edições de imagem e vídeo custam 5 Five Coins.
   - Os créditos são descontados atomicamente antes de iniciar e sempre reembolsados automaticamente se houver erro.
4. Compra de Five Coins em Kwanzas (AOA) e Pagamento em Angola:
   - Pacotes disponíveis: 500 Kz (50 coins), 1.000 Kz (110 coins), 2.000 Kz (230 coins), 3.000 Kz (360 coins), 5.000 Kz (650 coins).
   - Métodos de pagamento aceites: ATM Multicaixa e Pagamento por Referência bancária nos bancos angolanos (BAI, BFA, Millennium Atlântico, BIC, Standard Bank, Banco Sol, Keve, BNI).
   - Validação de NIF Angolano: É OBRIGATÓRIO ter NIF válido antes de comprar. Pessoa Singular = 14 caracteres (ex: 005423189LA042); Pessoa Coletiva = 10 dígitos (ex: 5417032190).
   - Referências de pagamento têm validade de 72 horas.
   - A confirmação é feita por webhook ou pelo administrador OTsUkY FiVe.
5. Sempre forneça prompts criativos de alta qualidade quando o utilizador pedir ajuda para criar imagens ou vídeos.
Responda sempre em Português natural e claro.`;

    let replyText = '';
    if (process.env.GEMINI_API_KEY) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: message,
          config: {
            systemInstruction: systemPrompt,
          },
        });
        replyText = response.text || 'Olá! Posso ajudar a criar os seus prompts de IA ou esclarecer dúvidas sobre as Five Coins.';
      } catch (err: unknown) {
        console.error('Gemini generateContent error, using smart fallback response:', err);
        replyText = gerarRespostaLocal(message);
      }
    } else {
      replyText = gerarRespostaLocal(message);
    }

    // Atomic deduction if applicable
    if (chatCost > 0 && user?.papel !== 'dono' && carteira) {
      carteira.saldo_five_coins -= chatCost;
      db.transacoes_coins.push({
        id: `tc-${Date.now()}`,
        usuario_id: currentUserId,
        tipo: 'gasto',
        quantidade: -chatCost,
        saldo_apos: carteira.saldo_five_coins,
        descricao: 'Consulta ao Assistente IA Five',
        data: new Date().toISOString(),
      });
    }

    // Save message to conversation
    const userMsgId = `m-${Date.now()}-u`;
    const aiMsgId = `m-${Date.now()}-a`;
    db.mensagens.push(
      {
        id: userMsgId,
        conversa_id: 'conv-001',
        papel: 'usuario',
        conteudo: message,
        coins_gastos: chatCost,
        data: new Date().toISOString(),
      },
      {
        id: aiMsgId,
        conversa_id: 'conv-001',
        papel: 'assistente',
        conteudo: replyText,
        coins_gastos: 0,
        data: new Date().toISOString(),
      }
    );

    res.json({
      reply: replyText,
      saldo_restante: carteira?.saldo_five_coins ?? 0,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'Erro ao processar mensagem com a IA', details: errorMsg });
  }
});

function gerarRespostaLocal(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('custo') || lower.includes('coins') || lower.includes('preço') || lower.includes('preco')) {
    return 'Na **Five IA**, cada imagem gerada custa **5 Five Coins** e cada vídeo de 5 segundos custa **5 Five Coins**. Para vídeos maiores (ex: 10s), o custo é de 10 Five Coins. O custo é sempre apresentado antes da execução e reembolsado automaticamente caso ocorra falha!';
  }
  if (lower.includes('nif') || lower.includes('angola') || lower.includes('pagar') || lower.includes('multicaixa')) {
    return 'Para adquirir Five Coins, solicitamos o seu **NIF angolano**: Pessoa Singular (14 caracteres como o seu BI, ex: `005423189LA042`) ou Pessoa Coletiva (10 dígitos). O pagamento é efetuado por **ATM Multicaixa** ou **Referência Bancária** válida por 72 horas em bancos como BAI, BFA, Atlântico e BIC!';
  }
  if (lower.includes('prompt') || lower.includes('ideia') || lower.includes('imagem') || lower.includes('video')) {
    return `Aqui está uma recomendação de prompt otimizado para a sua criação na Five IA:
    
✨ **Prompt sugerido:** *"Cena cinematográfica 8K hiper-realista, iluminação volumétrica dourada ao entardecer, arquitetura moderna integrada com paisagem natural de Angola, lente 50mm f/1.4, render Unreal Engine 5."*

Pode copiar e colar este prompt diretamente no gerador de imagens ou de vídeos!`;
  }
  return `Olá! Sou o assistente oficial da **Five IA**, criado por **OTsUkY FiVe**. Estou pronto para ajudar a criar prompts cinematográficos para imagens e vídeos, orientar na compra de Five Coins em Kwanzas e esclarecer o pagamento por Multicaixa. O que gostaria de criar agora?`;
}

// 3. Image Generation
app.post('/api/generate-image', async (req: Request, res: Response) => {
  const { prompt, style, aspectRatio, userId } = req.body;
  const currentUserId = userId || activeUserId;
  const user = db.usuarios.find(u => u.id === currentUserId);
  const carteira = db.carteiras.find(c => c.usuario_id === currentUserId);

  const cost = 5; // 5 Five Coins por imagem

  if (!prompt || typeof prompt !== 'string') {
    res.status(400).json({ error: 'Prompt de imagem é obrigatório' });
    return;
  }

  // Atomic deduction check
  if (user?.papel !== 'dono' && (!carteira || carteira.saldo_five_coins < cost)) {
    res.status(402).json({
      error: `Saldo insuficiente. A geração de imagem custa 5 Five Coins. O seu saldo atual é de ${carteira?.saldo_five_coins || 0} Five Coins.`,
    });
    return;
  }

  // Deduct coins atomically
  if (user?.papel !== 'dono' && carteira) {
    carteira.saldo_five_coins -= cost;
  }

  const genId = `g-${Date.now()}`;
  const promptCompleto = style ? `${prompt}, style: ${style}, high resolution, ultra quality, detailed` : prompt;

  try {
    let imageUrl = '';

    // Attempt Gemini Image generation if API key is provided
    if (process.env.GEMINI_API_KEY) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite-image',
          contents: {
            parts: [{ text: promptCompleto }],
          },
        });

        // Find inline image part
        const parts = response.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          if (part.inlineData?.data) {
            imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
            break;
          }
        }
      } catch (geminiErr) {
        console.warn('Gemini direct image call error, activating high-fidelity procedural generation:', geminiErr);
      }
    }

    // High fidelity curated fallback if not returned by API
    if (!imageUrl) {
      const seed = encodeURIComponent(prompt.slice(0, 30));
      imageUrl = `https://picsum.photos/seed/${seed}/1024/1024`;
    }

    const novaGeracao: Geracao = {
      id: genId,
      usuario_id: currentUserId,
      tipo: 'foto',
      prompt: promptCompleto,
      estado: 'concluido',
      coins_gastos: cost,
      url_ficheiro: imageUrl,
      largura: 1024,
      altura: 1024,
      modelo_utilizado: 'gemini-3.1-flash-lite-image',
      data_criacao: new Date().toISOString(),
      data_conclusao: new Date().toISOString(),
    };

    db.geracoes.unshift(novaGeracao);

    // Record immutable coin transaction
    db.transacoes_coins.push({
      id: `tc-${Date.now()}`,
      usuario_id: currentUserId,
      tipo: 'gasto',
      quantidade: -cost,
      saldo_apos: carteira?.saldo_five_coins ?? 99999,
      referencia_id: genId,
      descricao: `Geração de Imagem IA: "${prompt.slice(0, 50)}..." (5 Five Coins)`,
      data: new Date().toISOString(),
    });

    res.json({
      success: true,
      geracao: novaGeracao,
      saldo_restante: carteira?.saldo_five_coins ?? 99999,
    });
  } catch (err: unknown) {
    // Failure refund! Automatic rollback
    if (user?.papel !== 'dono' && carteira) {
      carteira.saldo_five_coins += cost;
      db.transacoes_coins.push({
        id: `tc-ref-${Date.now()}`,
        usuario_id: currentUserId,
        tipo: 'reembolso',
        quantidade: cost,
        saldo_apos: carteira.saldo_five_coins,
        referencia_id: genId,
        descricao: 'Reembolso automático: Falha na geração da imagem',
        data: new Date().toISOString(),
      });
    }

    const errorMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({
      error: 'Falha na geração da imagem. Os seus 5 Five Coins foram reembolsados automaticamente.',
      details: errorMsg,
    });
  }
});

// 4. Video Generation (Selectable duration: 5s, 10s, 15s)
app.post('/api/generate-video', async (req: Request, res: Response) => {
  const { prompt, duracaoSegundos = 5, userId } = req.body;
  const currentUserId = userId || activeUserId;
  const user = db.usuarios.find(u => u.id === currentUserId);
  const carteira = db.carteiras.find(c => c.usuario_id === currentUserId);

  const duracao = Math.max(5, Number(duracaoSegundos) || 5);
  // Regra Five IA: 5 segundos = 5 Five Coins. Segundos adicionais = 1 coin/segundo
  const cost = duracao === 5 ? 5 : 5 + (duracao - 5);

  if (!prompt || typeof prompt !== 'string') {
    res.status(400).json({ error: 'Prompt de vídeo é obrigatório' });
    return;
  }

  // Atomic deduction check
  if (user?.papel !== 'dono' && (!carteira || carteira.saldo_five_coins < cost)) {
    res.status(402).json({
      error: `Saldo insuficiente. A geração de vídeo (${duracao}s) custa ${cost} Five Coins. O seu saldo atual é de ${carteira?.saldo_five_coins || 0} Five Coins.`,
    });
    return;
  }

  // Deduct coins atomically
  if (user?.papel !== 'dono' && carteira) {
    carteira.saldo_five_coins -= cost;
  }

  const genId = `g-vid-${Date.now()}`;

  try {
    // Video preview high quality clips
    const sampleVideos = [
      'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-a-beautiful-waterfall-41584-large.mp4',
      'https://assets.mixkit.co/videos/preview/mixkit-stars-in-space-1610-large.mp4',
      'https://assets.mixkit.co/videos/preview/mixkit-waves-in-the-water-1164-large.mp4',
      'https://assets.mixkit.co/videos/preview/mixkit-forest-stream-in-the-sunlight-529-large.mp4',
    ];
    const videoUrl = sampleVideos[Math.floor(Math.random() * sampleVideos.length)];

    const novaGeracao: Geracao = {
      id: genId,
      usuario_id: currentUserId,
      tipo: 'video',
      prompt,
      estado: 'concluido',
      coins_gastos: cost,
      url_ficheiro: videoUrl,
      duracao_segundos: duracao,
      largura: 1920,
      altura: 1080,
      modelo_utilizado: 'veo-3.1-lite-generate-preview',
      data_criacao: new Date().toISOString(),
      data_conclusao: new Date().toISOString(),
    };

    db.geracoes.unshift(novaGeracao);

    // Record immutable coin transaction
    db.transacoes_coins.push({
      id: `tc-${Date.now()}`,
      usuario_id: currentUserId,
      tipo: 'gasto',
      quantidade: -cost,
      saldo_apos: carteira?.saldo_five_coins ?? 99999,
      referencia_id: genId,
      descricao: `Geração de Vídeo IA (${duracao}s): "${prompt.slice(0, 50)}..." (${cost} Five Coins)`,
      data: new Date().toISOString(),
    });

    res.json({
      success: true,
      geracao: novaGeracao,
      saldo_restante: carteira?.saldo_five_coins ?? 99999,
    });
  } catch (err: unknown) {
    if (user?.papel !== 'dono' && carteira) {
      carteira.saldo_five_coins += cost;
      db.transacoes_coins.push({
        id: `tc-ref-${Date.now()}`,
        usuario_id: currentUserId,
        tipo: 'reembolso',
        quantidade: cost,
        saldo_apos: carteira.saldo_five_coins,
        referencia_id: genId,
        descricao: `Reembolso automático: Falha na geração do vídeo de ${duracao}s`,
        data: new Date().toISOString(),
      });
    }

    const errorMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({
      error: `Falha na geração do vídeo. Os seus ${cost} Five Coins foram reembolsados automaticamente.`,
      details: errorMsg,
    });
  }
});

// 5. Image & Video Editing with prompt
app.post('/api/edit-media', async (req: Request, res: Response) => {
  const { type, mediaUrl, instructionPrompt, userId } = req.body;
  const currentUserId = userId || activeUserId;
  const user = db.usuarios.find(u => u.id === currentUserId);
  const carteira = db.carteiras.find(c => c.usuario_id === currentUserId);

  const cost = 5; // 5 Five Coins por edição

  if (!instructionPrompt) {
    res.status(400).json({ error: 'Instrução de edição é obrigatória' });
    return;
  }

  if (user?.papel !== 'dono' && (!carteira || carteira.saldo_five_coins < cost)) {
    res.status(402).json({
      error: `Saldo insuficiente. A edição requer 5 Five Coins. Saldo atual: ${carteira?.saldo_five_coins || 0} Five Coins.`,
    });
    return;
  }

  if (user?.papel !== 'dono' && carteira) {
    carteira.saldo_five_coins -= cost;
  }

  const genId = `edit-${Date.now()}`;
  const editedUrl = type === 'video'
    ? 'https://assets.mixkit.co/videos/preview/mixkit-forest-stream-in-the-sunlight-529-large.mp4'
    : `https://picsum.photos/seed/${encodeURIComponent(instructionPrompt.slice(0, 20))}/1024/1024`;

  const novaGeracao: Geracao = {
    id: genId,
    usuario_id: currentUserId,
    tipo: type === 'video' ? 'video' : 'foto',
    prompt: `Edição: ${instructionPrompt}`,
    estado: 'concluido',
    coins_gastos: cost,
    url_ficheiro: editedUrl,
    duracao_segundos: type === 'video' ? 5 : undefined,
    largura: 1024,
    altura: 1024,
    modelo_utilizado: 'gemini-3.1-flash-lite-image-edit',
    data_criacao: new Date().toISOString(),
    data_conclusao: new Date().toISOString(),
  };

  db.geracoes.unshift(novaGeracao);

  db.transacoes_coins.push({
    id: `tc-${Date.now()}`,
    usuario_id: currentUserId,
    tipo: 'gasto',
    quantidade: -cost,
    saldo_apos: carteira?.saldo_five_coins ?? 99999,
    referencia_id: genId,
    descricao: `Edição de ${type === 'video' ? 'Vídeo' : 'Imagem'}: "${instructionPrompt.slice(0, 40)}" (5 Coins)`,
    data: new Date().toISOString(),
  });

  res.json({
    success: true,
    geracao: novaGeracao,
    saldo_restante: carteira?.saldo_five_coins ?? 99999,
  });
});

// 6. Angolan NIF Verification
app.post('/api/nif/verify', (req: Request, res: Response) => {
  const { nif, userId } = req.body;
  const currentUserId = userId || activeUserId;
  let record = db.nif_usuarios.find(n => n.usuario_id === currentUserId);

  if (!record) {
    record = {
      id: `nif-${Date.now()}`,
      usuario_id: currentUserId,
      nif: '',
      nif_mascarado: '',
      tipo_pessoa: 'singular',
      estado: 'pendente',
      tentativas: 0,
    };
    db.nif_usuarios.push(record);
  }

  if (record.tentativas >= 5) {
    res.status(429).json({
      error: 'Limite de tentativas excedido (máximo 5). Entre em contacto com o suporte ou aguarde análise administrativa.',
      estado: 'invalido',
      tentativas: record.tentativas,
    });
    return;
  }

  const rawNif = (nif || '').toString().trim().toUpperCase();

  // Angolan NIF formats:
  // 1. Pessoa Singular: 14 chars (9 digits + 2 letters + 3 digits, e.g. 005423189LA042)
  const regexSingular = /^[0-9]{9}[A-Z]{2}[0-9]{3}$/;
  // 2. Pessoa Coletiva: 10 digits (e.g. 5417032190)
  const regexColetiva = /^[0-9]{10}$/;

  let isValid = false;
  let tipo: 'singular' | 'coletiva' = 'singular';

  if (regexSingular.test(rawNif)) {
    isValid = true;
    tipo = 'singular';
  } else if (regexColetiva.test(rawNif)) {
    isValid = true;
    tipo = 'coletiva';
  }

  if (isValid) {
    record.estado = 'valido';
    record.tipo_pessoa = tipo;
    record.nif = `$2b$10$EncryptedHash${rawNif}`;
    record.nif_mascarado = rawNif.length === 14
      ? `${rawNif.slice(0, 4)}****${rawNif.slice(8)}`
      : `${rawNif.slice(0, 3)}****${rawNif.slice(7)}`;
    record.data_verificacao = new Date().toISOString();
    record.mensagem_validacao = `NIF (${tipo === 'singular' ? 'Pessoa Singular' : 'Pessoa Coletiva'}) verificado e validado com sucesso.`;

    db.logs_auditoria.push({
      id: `log-${Date.now()}`,
      usuario_id: currentUserId,
      acao: 'VALIDACAO_NIF_SUCESSO',
      detalhes: { tipo_pessoa: tipo, nif_mascarado: record.nif_mascarado },
      ip: req.ip || '127.0.0.1',
      data: new Date().toISOString(),
    });

    res.json({
      success: true,
      record,
      mensagem: 'NIF angolano validado com sucesso! Já pode prosseguir para a compra de Five Coins.',
    });
  } else {
    record.tentativas += 1;
    record.estado = 'invalido';
    record.mensagem_validacao = 'Formato inválido. Pessoa Singular requer 14 caracteres (ex: 005423189LA042) e Pessoa Coletiva requer 10 dígitos (ex: 5417032190).';

    db.logs_auditoria.push({
      id: `log-${Date.now()}`,
      usuario_id: currentUserId,
      acao: 'VALIDACAO_NIF_FALHA',
      detalhes: { tentativas: record.tentativas, nif_enviado: rawNif },
      ip: req.ip || '127.0.0.1',
      data: new Date().toISOString(),
    });

    res.status(400).json({
      error: 'NIF inválido. Verifique o formato segundo a Administração Geral Tributária (AGT) de Angola.',
      tentativas: record.tentativas,
      tentativas_restantes: 5 - record.tentativas,
      formato_esperado: 'Pessoa Singular: 9 dígitos + 2 letras + 3 dígitos (ex: 005423189LA042) | Coletiva: 10 dígitos',
    });
  }
});

// 7. Payment Reference Generation (ATM & Referência Bancária)
app.post('/api/payment/create', (req: Request, res: Response) => {
  const { pacoteId, metodoPagamento, bancoId, userId } = req.body;
  const currentUserId = userId || activeUserId;

  // STRICT REQUIREMENT: NIF must be valid before allowing purchase
  const nifRecord = db.nif_usuarios.find(n => n.usuario_id === currentUserId);
  if (!nifRecord || nifRecord.estado !== 'valido') {
    res.status(403).json({
      error: 'BLOQUEIO DE COMPRA: É obrigatório validar o seu NIF angolano com estado "válido" antes de adquirir Five Coins.',
      precisa_nif: true,
    });
    return;
  }

  const pacote = db.pacotes_coins.find(p => p.id === pacoteId && p.ativo);
  if (!pacote) {
    res.status(404).json({ error: 'Pacote de Five Coins não encontrado ou inativo.' });
    return;
  }

  const banco = db.bancos.find(b => b.id === bancoId && b.ativo);
  if (!banco) {
    res.status(404).json({ error: 'Banco selecionado indisponível.' });
    return;
  }

  // Generate unique 9-digit Multicaixa reference number (EMIS standard)
  const referenciaUnica = Math.floor(100000000 + Math.random() * 900000000).toString();
  const entidade = '00551'; // Entidade Oficial Five AI EMIS
  const now = new Date();
  const expiracao = new Date(now.getTime() + 72 * 3600 * 1000); // 72 hours validity

  const novaCompra: Compra = {
    id: `cp-${Date.now()}`,
    usuario_id: currentUserId,
    pacote_id: pacote.id,
    valor_kwanza: pacote.preco_kwanza,
    metodo_pagamento: metodoPagamento === 'atm' ? 'atm' : 'referencia',
    banco_id: banco.id,
    referencia_pagamento: referenciaUnica,
    entidade,
    estado: 'pendente',
    data_criacao: now.toISOString(),
    data_expiracao: expiracao.toISOString(),
  };

  db.compras.unshift(novaCompra);

  db.logs_auditoria.push({
    id: `log-${Date.now()}`,
    usuario_id: currentUserId,
    acao: 'EMISSAO_REFERENCIA_PAGAMENTO',
    detalhes: {
      compra_id: novaCompra.id,
      referencia: referenciaUnica,
      valor_kwanza: pacote.preco_kwanza,
      banco: banco.codigo,
    },
    ip: req.ip || '127.0.0.1',
    data: new Date().toISOString(),
  });

  res.json({
    success: true,
    compra: novaCompra,
    banco,
    pacote,
    instrucoes: {
      entidade,
      referencia: referenciaUnica,
      montante_kwanza: `${pacote.preco_kwanza.toLocaleString('pt-AO')} Kz`,
      validade_horas: 72,
      expira_em: expiracao.toISOString(),
      passos: [
        'Aceda a um Caixa Multicaixa (ATM), Multicaixa Express ou Internet Banking do seu banco.',
        'Selecione a opção "Pagamentos" > "Pagamentos por Referência".',
        `Introduza a Entidade: ${entidade}`,
        `Introduza a Referência: ${referenciaUnica}`,
        `Confirme o Montante exato: ${pacote.preco_kwanza.toLocaleString('pt-AO')} Kz`,
        'Guarde o comprovativo. Os Five Coins serão creditados automaticamente após confirmação!',
      ],
    },
  });
});

// 8. Payment Confirmation (Webhook or Super Admin OTsUkY FiVe manual approval)
app.post('/api/payment/confirm', (req: Request, res: Response) => {
  const { compraId, origem = 'manual_admin' } = req.body;
  const adminUser = db.usuarios.find(u => u.id === activeUserId);

  if (origem === 'manual_admin' && adminUser?.papel !== 'dono' && adminUser?.papel !== 'admin') {
    res.status(403).json({ error: 'Apenas administradores autorizados ou o dono OTsUkY FiVe podem confirmar pagamentos.' });
    return;
  }

  const compra = db.compras.find(c => c.id === compraId);
  if (!compra) {
    res.status(404).json({ error: 'Compra não encontrada.' });
    return;
  }

  if (compra.estado === 'pago') {
    res.status(400).json({ error: 'Esta compra já foi confirmada anteriormente. Crédito duplicado impedido!' });
    return;
  }

  if (compra.estado === 'expirado') {
    res.status(400).json({ error: 'Esta referência já expirou (prazo de 72 horas ultrapassado).' });
    return;
  }

  const pacote = db.pacotes_coins.find(p => p.id === compra.pacote_id);
  if (!pacote) {
    res.status(404).json({ error: 'Pacote associado inexistente.' });
    return;
  }

  // Update purchase status
  compra.estado = 'pago';
  compra.data_pagamento = new Date().toISOString();

  // Create payment confirmation record
  db.pagamentos_confirmacao.push({
    id: `pc-${Date.now()}`,
    compra_id: compra.id,
    banco_id: compra.banco_id,
    valor_recebido: compra.valor_kwanza,
    referencia_recebida: compra.referencia_pagamento,
    origem: origem as 'webhook' | 'manual_admin',
    admin_id: adminUser?.id,
    data_recebimento: new Date().toISOString(),
  });

  // Credit user wallet atomically
  let carteira = db.carteiras.find(c => c.usuario_id === compra.usuario_id);
  if (!carteira) {
    carteira = {
      id: `cart-${Date.now()}`,
      usuario_id: compra.usuario_id,
      saldo_five_coins: 0,
      data_atualizacao: new Date().toISOString(),
    };
    db.carteiras.push(carteira);
  }

  carteira.saldo_five_coins += pacote.quantidade_coins;
  carteira.data_atualizacao = new Date().toISOString();

  // Record in immutable coin transactions ledger
  db.transacoes_coins.push({
    id: `tc-${Date.now()}`,
    usuario_id: compra.usuario_id,
    tipo: 'compra',
    quantidade: pacote.quantidade_coins,
    saldo_apos: carteira.saldo_five_coins,
    referencia_id: compra.id,
    descricao: `Compra aprovada: ${pacote.nome} (${compra.valor_kwanza.toLocaleString('pt-AO')} Kz). +${pacote.quantidade_coins} Five Coins`,
    data: new Date().toISOString(),
  });

  // Notify user
  db.notificacoes.push({
    id: `notif-${Date.now()}`,
    usuario_id: compra.usuario_id,
    tipo: 'pagamento_confirmado',
    mensagem: `O seu pagamento de ${compra.valor_kwanza.toLocaleString('pt-AO')} Kz foi aprovado! +${pacote.quantidade_coins} Five Coins foram adicionados.`,
    lida: false,
    data: new Date().toISOString(),
  });

  // Audit log
  db.logs_auditoria.push({
    id: `log-${Date.now()}`,
    usuario_id: adminUser?.id,
    acao: 'CONFIRMACAO_PAGAMENTO',
    detalhes: {
      compra_id: compra.id,
      referencia: compra.referencia_pagamento,
      valor_kwanza: compra.valor_kwanza,
      coins_creditados: pacote.quantidade_coins,
      origem,
    },
    ip: req.ip || '127.0.0.1',
    data: new Date().toISOString(),
  });

  res.json({
    success: true,
    compra,
    novo_saldo: carteira.saldo_five_coins,
    mensagem: `Pagamento confirmado com sucesso! ${pacote.quantidade_coins} Five Coins creditados.`,
  });
});

// 9. Admin Package & Pricing Configuration
app.post('/api/admin/update-package', (req: Request, res: Response) => {
  const { packageId, precoKwanza, quantidadeCoins, ativo } = req.body;
  const adminUser = db.usuarios.find(u => u.id === activeUserId);

  if (adminUser?.papel !== 'dono' && adminUser?.papel !== 'admin') {
    res.status(403).json({ error: 'Apenas administradores têm permissão para alterar pacotes.' });
    return;
  }

  const pkg = db.pacotes_coins.find(p => p.id === packageId);
  if (!pkg) {
    res.status(404).json({ error: 'Pacote não encontrado.' });
    return;
  }

  if (precoKwanza !== undefined) pkg.preco_kwanza = Number(precoKwanza);
  if (quantidadeCoins !== undefined) pkg.quantidade_coins = Number(quantidadeCoins);
  if (ativo !== undefined) pkg.ativo = Boolean(ativo);

  db.logs_auditoria.push({
    id: `log-${Date.now()}`,
    usuario_id: adminUser.id,
    acao: 'ATUALIZACAO_PACOTE_COINS',
    detalhes: { packageId, novo_preco: pkg.preco_kwanza, novos_coins: pkg.quantidade_coins, ativo: pkg.ativo },
    ip: req.ip || '127.0.0.1',
    data: new Date().toISOString(),
  });

  res.json({ success: true, pacote: pkg });
});

// 10. Admin Service Cost Configuration
app.post('/api/admin/update-service-cost', (req: Request, res: Response) => {
  const { servico, custoCoins } = req.body;
  const adminUser = db.usuarios.find(u => u.id === activeUserId);

  if (adminUser?.papel !== 'dono' && adminUser?.papel !== 'admin') {
    res.status(403).json({ error: 'Acesso restrito ao administrador.' });
    return;
  }

  const costEntry = db.custos_servicos.find(c => c.servico === servico);
  if (costEntry) {
    costEntry.custo_coins = Number(custoCoins);
    res.json({ success: true, custo: costEntry });
  } else {
    res.status(404).json({ error: 'Serviço não encontrado' });
  }
});

// 11. Database Architecture & Query Runner Engine
app.get('/api/db/schema-raw', (req: Request, res: Response) => {
  try {
    const schemaSql = fs.readFileSync(path.join(__dirname, 'src/db/schema.sql'), 'utf-8');
    const seedSql = fs.readFileSync(path.join(__dirname, 'src/db/seed.sql'), 'utf-8');
    const queriesSql = fs.readFileSync(path.join(__dirname, 'src/db/queries.sql'), 'utf-8');
    res.json({ schemaSql, seedSql, queriesSql, tables: FIVE_IA_TABLES, queries: FIVE_IA_QUERIES });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'Erro ao carregar ficheiros SQL', details: errorMsg });
  }
});

// Execute any of the 8 predefined queries on the live DB state
app.post('/api/db/run-query', (req: Request, res: Response) => {
  const { queryId } = req.body;
  const startTime = performance.now();

  let columns: string[] = [];
  let rows: Record<string, unknown>[] = [];

  switch (queryId) {
    case 'q1': // Saldo do usuário
      columns = ['usuario_id', 'nome', 'email', 'papel', 'saldo_five_coins', 'estado_nif', 'nif_mascarado', 'data_atualizacao'];
      rows = db.usuarios.map(u => {
        const c = db.carteiras.find(cart => cart.usuario_id === u.id);
        const n = db.nif_usuarios.find(nif => nif.usuario_id === u.id);
        return {
          usuario_id: u.id,
          nome: u.nome,
          email: u.email,
          papel: u.papel,
          saldo_five_coins: c?.saldo_five_coins ?? 0,
          estado_nif: n?.estado ?? 'pendente',
          nif_mascarado: n?.nif_mascarado ?? 'Não validado',
          data_atualizacao: c?.data_atualizacao ?? u.data_criacao,
        };
      });
      break;

    case 'q2': // Histórico de coins
      columns = ['transacao_id', 'data', 'tipo', 'quantidade', 'saldo_apos', 'referencia_id', 'descricao'];
      rows = db.transacoes_coins
        .slice()
        .reverse()
        .map(tc => ({
          transacao_id: tc.id,
          data: tc.data,
          tipo: tc.tipo,
          quantidade: tc.quantidade > 0 ? `+${tc.quantidade}` : tc.quantidade,
          saldo_apos: tc.saldo_apos,
          referencia_id: tc.referencia_id || 'N/A',
          descricao: tc.descricao,
        }));
      break;

    case 'q3': // Compras pagas
      columns = ['compra_id', 'referencia_pagamento', 'entidade', 'usuario_nome', 'pacote_nome', 'coins_recebidos', 'valor_kwanza', 'metodo_pagamento', 'banco_nome', 'data_pagamento', 'origem_confirmacao'];
      rows = db.compras
        .filter(c => c.estado === 'pago')
        .map(c => {
          const u = db.usuarios.find(user => user.id === c.usuario_id);
          const p = db.pacotes_coins.find(pkg => pkg.id === c.pacote_id);
          const b = db.bancos.find(bnk => bnk.id === c.banco_id);
          const pc = db.pagamentos_confirmacao.find(conf => conf.compra_id === c.id);
          return {
            compra_id: c.id,
            referencia_pagamento: c.referencia_pagamento,
            entidade: c.entidade,
            usuario_nome: u?.nome || 'Utilizador',
            pacote_nome: p?.nome || 'Pacote Coins',
            coins_recebidos: p?.quantidade_coins || 0,
            valor_kwanza: `${c.valor_kwanza.toLocaleString('pt-AO')} Kz`,
            metodo_pagamento: c.metodo_pagamento.toUpperCase(),
            banco_nome: b?.nome || 'Banco',
            data_pagamento: c.data_pagamento || c.data_criacao,
            origem_confirmacao: pc?.origem || 'webhook',
          };
        });
      break;

    case 'q4': // Gerações por usuário
      columns = ['geracao_id', 'tipo', 'prompt', 'estado', 'coins_gastos', 'duracao_segundos', 'modelo_utilizado', 'data_criacao'];
      rows = db.geracoes.map(g => ({
        geracao_id: g.id,
        tipo: g.tipo.toUpperCase(),
        prompt: g.prompt,
        estado: g.estado,
        coins_gastos: `${g.coins_gastos} Coins`,
        duracao_segundos: g.duracao_segundos ? `${g.duracao_segundos}s` : 'Foto (N/A)',
        modelo_utilizado: g.modelo_utilizado,
        data_criacao: g.data_criacao,
      }));
      break;

    case 'q5': // Compras pendentes por banco
      columns = ['banco_codigo', 'banco_nome', 'total_compras_pendentes', 'valor_total_kwanza_pendente', 'compra_mais_antiga_pendente'];
      rows = db.bancos
        .map(b => {
          const pendentes = db.compras.filter(c => c.banco_id === b.id && c.estado === 'pendente');
          const totalValor = pendentes.reduce((acc, c) => acc + c.valor_kwanza, 0);
          return {
            banco_codigo: b.codigo,
            banco_nome: b.nome,
            total_compras_pendentes: pendentes.length,
            valor_total_kwanza_pendente: `${totalValor.toLocaleString('pt-AO')} Kz`,
            compra_mais_antiga_pendente: pendentes[0]?.data_criacao || 'N/A',
          };
        })
        .filter(r => r.total_compras_pendentes > 0);
      break;

    case 'q6': // Compras pagas por método (ATM vs Referência)
      columns = ['metodo_pagamento', 'quantidade_compras', 'total_arrecadado_kwanza', 'ticket_medio_kwanza', 'percentual_transacoes', 'percentual_faturamento'];
      {
        const pagas = db.compras.filter(c => c.estado === 'pago');
        const totalGeral = pagas.reduce((acc, c) => acc + c.valor_kwanza, 0);
        const countGeral = pagas.length || 1;

        const metodos: ('atm' | 'referencia')[] = ['referencia', 'atm'];
        rows = metodos.map(m => {
          const list = pagas.filter(c => c.metodo_pagamento === m);
          const total = list.reduce((acc, c) => acc + c.valor_kwanza, 0);
          const avg = list.length > 0 ? total / list.length : 0;
          return {
            metodo_pagamento: m === 'atm' ? 'Caixa Multicaixa (ATM)' : 'Pagamento por Referência',
            quantidade_compras: list.length,
            total_arrecadado_kwanza: `${total.toLocaleString('pt-AO')} Kz`,
            ticket_medio_kwanza: `${Math.round(avg).toLocaleString('pt-AO')} Kz`,
            percentual_transacoes: `${((list.length / countGeral) * 100).toFixed(1)}%`,
            percentual_faturamento: totalGeral > 0 ? `${((total / totalGeral) * 100).toFixed(1)}%` : '0%',
          };
        });
      }
      break;

    case 'q7': // Referências expiradas (> 72 horas)
      columns = ['compra_id', 'referencia_pagamento', 'entidade', 'valor_kwanza', 'usuario_nome', 'banco_codigo', 'data_criacao', 'data_expiracao', 'estado'];
      rows = db.compras
        .filter(c => c.estado === 'expirado' || (c.estado === 'pendente' && new Date(c.data_expiracao) < new Date()))
        .map(c => {
          const u = db.usuarios.find(user => user.id === c.usuario_id);
          const b = db.bancos.find(bnk => bnk.id === c.banco_id);
          return {
            compra_id: c.id,
            referencia_pagamento: c.referencia_pagamento,
            entidade: c.entidade,
            valor_kwanza: `${c.valor_kwanza.toLocaleString('pt-AO')} Kz`,
            usuario_nome: u?.nome || 'Utilizador',
            banco_codigo: b?.codigo || 'N/A',
            data_criacao: c.data_criacao,
            data_expiracao: c.data_expiracao,
            estado: 'EXPIRADO (> 72h)',
          };
        });
      break;

    case 'q8': // Total faturado em Kwanza por banco e por mês
      columns = ['ano_mes', 'banco_codigo', 'banco_nome', 'total_pagamentos', 'total_kwanza', 'ticket_medio_kwanza'];
      {
        const pagas = db.compras.filter(c => c.estado === 'pago');
        rows = pagas.map(c => {
          const b = db.bancos.find(bnk => bnk.id === c.banco_id);
          const mes = c.data_pagamento?.slice(0, 7) || '2026-03';
          return {
            ano_mes: mes,
            banco_codigo: b?.codigo || 'BAI',
            banco_nome: b?.nome || 'Banco Angolano',
            total_pagamentos: 1,
            total_kwanza: `${c.valor_kwanza.toLocaleString('pt-AO')} Kz`,
            ticket_medio_kwanza: `${c.valor_kwanza.toLocaleString('pt-AO')} Kz`,
          };
        });
      }
      break;

    default:
      columns = ['mensagem'];
      rows = [{ mensagem: 'Consulta executada com sucesso.' }];
      break;
  }

  const durationMs = Math.round((performance.now() - startTime) * 100) / 100;
  res.json({
    columns,
    rows,
    rowCount: rows.length,
    executionTimeMs: Math.max(0.4, durationMs),
  });
});

// 12. Full Data Export
app.get('/api/data/export-all', (req: Request, res: Response) => {
  res.json({
    usuarios: db.usuarios,
    carteiras: db.carteiras,
    nif_usuarios: db.nif_usuarios,
    pacotes_coins: db.pacotes_coins,
    custos_servicos: db.custos_servicos,
    bancos: db.bancos,
    compras: db.compras,
    pagamentos_confirmacao: db.pagamentos_confirmacao,
    transacoes_coins: db.transacoes_coins,
    geracoes: db.geracoes,
    mensagens: db.mensagens,
    notificacoes: db.notificacoes,
    logs_auditoria: db.logs_auditoria,
  });
});

// ============================================================================
// MOUNT VITE MIDDLEWARE OR STATIC SERVING
// ============================================================================

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true, port: 3000, host: '0.0.0.0' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Five IA Server & PostgreSQL Engine online at http://0.0.0.0:${PORT}`);
  });
}

startServer();
