export interface User {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  papel: 'usuario' | 'admin' | 'dono';
  estado: 'ativo' | 'suspenso';
  data_criacao: string;
  ultimo_login?: string;
}

export interface NifInfo {
  id?: string;
  usuario_id?: string;
  nif?: string;
  nif_mascarado: string;
  tipo_pessoa?: 'singular' | 'coletiva';
  estado: 'pendente' | 'valido' | 'invalido';
  tentativas: number;
  mensagem_validacao?: string;
}

export interface CoinPackage {
  id: string;
  nome: string;
  quantidade_coins: number;
  preco_kwanza: number;
  ativo: boolean;
}

export interface ServiceCost {
  id: string;
  servico: 'chat' | 'foto' | 'video';
  custo_coins: number;
  duracao_base_segundos?: number | null;
  custo_por_segundo_extra?: number;
  ativo: boolean;
}

export interface Bank {
  id: string;
  nome: string;
  codigo: string;
  logotipo_url: string;
  ativo: boolean;
}

export interface Purchase {
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

export interface Generation {
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

export interface CoinTransaction {
  id: string;
  usuario_id: string;
  tipo: 'compra' | 'gasto' | 'bonus' | 'reembolso';
  quantidade: number;
  saldo_apos: number;
  referencia_id?: string;
  descricao?: string;
  data: string;
}

export interface AuditLog {
  id: string;
  usuario_id?: string;
  acao: string;
  detalhes: Record<string, unknown>;
  ip: string;
  data: string;
}
