import React, { useState } from 'react';
import { 
  Crown, 
  CheckCircle, 
  XCircle, 
  DollarSign, 
  Settings, 
  Users, 
  ShieldAlert, 
  Coins, 
  Building, 
  Clock, 
  RefreshCw, 
  Check, 
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import { CoinPackage, ServiceCost, Purchase, Bank, AuditLog } from '../types';

interface AdminPanelProps {
  packages: CoinPackage[];
  serviceCosts: ServiceCost[];
  purchases: Purchase[];
  banks: Bank[];
  auditLogs: AuditLog[];
  onRefreshAll: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  packages,
  serviceCosts,
  purchases,
  banks,
  auditLogs,
  onRefreshAll,
}) => {
  const [activeTab, setActiveTab] = useState<'payments' | 'packages' | 'costs' | 'audit'>('payments');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter pending purchases
  const pendingPurchases = purchases.filter(p => p.estado === 'pendente');

  // Handle manual confirmation of purchase
  const handleConfirmPurchase = async (compraId: string) => {
    setIsProcessing(true);
    setActionSuccess(null);

    try {
      const res = await fetch('/api/payment/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ compraId, origem: 'manual_admin' }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao confirmar pagamento');
      }

      setActionSuccess(data.mensagem || 'Pagamento confirmado com sucesso! Coins creditados ao cliente.');
      onRefreshAll();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      alert(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  // Update Package Price / Coins
  const handleUpdatePackage = async (pkgId: string, preco: number, coins: number) => {
    try {
      const res = await fetch('/api/admin/update-package', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: pkgId,
          precoKwanza: preco,
          quantidadeCoins: coins,
        }),
      });

      if (!res.ok) throw new Error('Erro ao atualizar pacote');
      setActionSuccess('Pacote atualizado com sucesso no PostgreSQL!');
      onRefreshAll();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      alert(errorMsg);
    }
  };

  return (
    <div className="space-y-8">
      {/* Admin Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-amber-500/40 bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20">
            <Crown className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-white">
                Painel Administrativo Five IA
              </h2>
              <span className="rounded-md bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-xs font-bold text-amber-300">
                OTsUkY FiVe (DONO)
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Controlo soberano de pacotes, preços em Kwanzas, aprovação de pagamentos EMIS e auditoria
            </p>
          </div>
        </div>

        <button
          onClick={onRefreshAll}
          className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Atualizar Dados
        </button>
      </div>

      {actionSuccess && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-200">
          <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-4 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('payments')}
          className={`flex items-center gap-2 pb-3 border-b-2 transition-all ${
            activeTab === 'payments' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Clock className="h-4 w-4" />
          Aprovação de Pagamentos ({pendingPurchases.length} Pendentes)
        </button>
        <button
          onClick={() => setActiveTab('packages')}
          className={`flex items-center gap-2 pb-3 border-b-2 transition-all ${
            activeTab === 'packages' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <DollarSign className="h-4 w-4" />
          Preços e Pacotes em Kwanzas
        </button>
        <button
          onClick={() => setActiveTab('costs')}
          className={`flex items-center gap-2 pb-3 border-b-2 transition-all ${
            activeTab === 'costs' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Coins className="h-4 w-4" />
          Custos dos Serviços de IA
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 pb-3 border-b-2 transition-all ${
            activeTab === 'audit' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <ShieldAlert className="h-4 w-4" />
          Logs de Auditoria
        </button>
      </div>

      {/* TAB 1: PENDING PAYMENTS APPROVAL */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">
              Compras Aguardando Confirmação Bancária / Webhook
            </h3>
            <span className="text-xs text-slate-400">
              Apenas administradores podem creditar saldo manualmente após verificação real no extrato
            </span>
          </div>

          {pendingPurchases.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center text-xs text-slate-400">
              Nenhuma compra pendente no momento. Todos os pagamentos foram devidamente processados.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Referência EMIS</th>
                    <th className="py-3 px-4">Valor em Kwanzas</th>
                    <th className="py-3 px-4">Método</th>
                    <th className="py-3 px-4">Banco Parceiro</th>
                    <th className="py-3 px-4">Data Emissão</th>
                    <th className="py-3 px-4">Ação Administrativa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {pendingPurchases.map(cp => {
                    const banco = banks.find(b => b.id === cp.banco_id);
                    return (
                      <tr key={cp.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-amber-400">
                          {cp.referencia_pagamento}
                        </td>
                        <td className="py-3 px-4 font-bold text-white">
                          {cp.valor_kwanza.toLocaleString('pt-AO')} Kz
                        </td>
                        <td className="py-3 px-4 uppercase font-semibold">
                          {cp.metodo_pagamento}
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          {banco?.nome || 'Banco Angolano'}
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {new Date(cp.data_criacao).toLocaleString('pt-AO')}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleConfirmPurchase(cp.id)}
                            disabled={isProcessing}
                            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shadow-sm disabled:opacity-50"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Aprovar e Creditar Coins
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PACKAGES & KWANZA PRICES */}
      {activeTab === 'packages' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">
              Gestão de Pacotes de Five Coins e Preços em Kwanzas (AOA)
            </h3>
            <span className="text-xs text-slate-400">
              Alterações refletidas instantaneamente sem modificar o código-fonte
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {packages.map(pkg => (
              <div key={pkg.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-sm">{pkg.nome}</h4>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    pkg.ativo ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                  }`}>
                    {pkg.ativo ? 'ATIVO' : 'DESATIVADO'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Preço em Kwanzas (Kz):</label>
                    <input
                      type="number"
                      defaultValue={pkg.preco_kwanza}
                      id={`price-${pkg.id}`}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-slate-100 font-bold focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Qtd Five Coins:</label>
                    <input
                      type="number"
                      defaultValue={pkg.quantidade_coins}
                      id={`coins-${pkg.id}`}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-amber-300 font-bold focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const priceInput = document.getElementById(`price-${pkg.id}`) as HTMLInputElement;
                    const coinsInput = document.getElementById(`coins-${pkg.id}`) as HTMLInputElement;
                    handleUpdatePackage(pkg.id, Number(priceInput.value), Number(coinsInput.value));
                  }}
                  className="w-full rounded-xl bg-amber-500 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors"
                >
                  Salvar Alterações
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SERVICE COSTS */}
      {activeTab === 'costs' && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-white">
            Tabela Oficial de Custos de Inteligência Artificial
          </h3>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Serviço de IA</th>
                  <th className="py-3 px-4">Custo Base (Coins)</th>
                  <th className="py-3 px-4">Duração Base</th>
                  <th className="py-3 px-4">Custo por Segundo Extra</th>
                  <th className="py-3 px-4">Regra do Sistema</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {serviceCosts.map(sc => (
                  <tr key={sc.id}>
                    <td className="py-3 px-4 font-bold text-amber-300 uppercase">
                      {sc.servico === 'foto' ? 'Geração / Edição de Imagem' : sc.servico === 'video' ? 'Geração / Edição de Vídeo' : 'Chat Assistente'}
                    </td>
                    <td className="py-3 px-4 font-extrabold text-white">
                      {sc.custo_coins} Five Coins
                    </td>
                    <td className="py-3 px-4">
                      {sc.duracao_base_segundos ? `${sc.duracao_base_segundos} segundos` : 'N/A (Instantâneo)'}
                    </td>
                    <td className="py-3 px-4">
                      {sc.custo_por_segundo_extra ? `+${sc.custo_por_segundo_extra} coin / segundo` : 'Sem custo extra'}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      Débito atómico com garantia de devolução
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-white">
            Logs de Auditoria do Sistema e Ações Administrativas
          </h3>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60">
            <table className="w-full text-left text-xs text-slate-300 font-mono">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Ação</th>
                  <th className="py-3 px-4">IP</th>
                  <th className="py-3 px-4">Detalhes JSON</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-4 text-slate-400">
                      {new Date(log.data).toLocaleString('pt-AO')}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-amber-400">
                      {log.acao}
                    </td>
                    <td className="py-2.5 px-4 text-slate-400">{log.ip}</td>
                    <td className="py-2.5 px-4 text-slate-300 font-sans text-[11px]">
                      {JSON.stringify(log.detalhes)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
