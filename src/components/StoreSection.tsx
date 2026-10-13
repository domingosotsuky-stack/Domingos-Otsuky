import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Coins, 
  ShieldCheck, 
  CreditCard, 
  Building, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Copy, 
  Check, 
  FileText, 
  ExternalLink,
  Loader2,
  Lock
} from 'lucide-react';
import { CoinPackage, Bank, Purchase, NifInfo } from '../types';

interface StoreSectionProps {
  balance: number;
  nifInfo: NifInfo | null;
  onOpenNifModal: () => void;
  packages: CoinPackage[];
  banks: Bank[];
  purchases: Purchase[];
  onRefreshSession: () => void;
}

export const StoreSection: React.FC<StoreSectionProps> = ({
  balance,
  nifInfo,
  onOpenNifModal,
  packages,
  banks,
  purchases,
  onRefreshSession,
}) => {
  const [selectedPackage, setSelectedPackage] = useState<CoinPackage | null>(null);
  const [selectedBankId, setSelectedBankId] = useState<string>(banks[0]?.id || '');
  const [selectedMethod, setSelectedMethod] = useState<'referencia' | 'atm'>('referencia');
  const [isGeneratingRef, setIsGeneratingRef] = useState(false);
  const [activePurchaseSlip, setActivePurchaseSlip] = useState<{
    compra: Purchase;
    banco: Bank;
    pacote: CoinPackage;
    instrucoes: {
      entidade: string;
      referencia: string;
      montante_kwanza: string;
      validade_horas: number;
      expira_em: string;
      passos: string[];
    };
  } | null>(null);

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const hasValidNif = nifInfo?.estado === 'valido';

  const handleSelectPackageToBuy = (pkg: CoinPackage) => {
    if (!hasValidNif) {
      setErrorMessage('O NIF angolano é obrigatório antes de emitir referências de pagamento.');
      onOpenNifModal();
      return;
    }
    setErrorMessage(null);
    setSelectedPackage(pkg);
    // Scroll to payment config
    window.scrollTo({ top: 350, behavior: 'smooth' });
  };

  const handleCreatePaymentReference = async () => {
    if (!selectedPackage) return;

    if (!hasValidNif) {
      onOpenNifModal();
      return;
    }

    setIsGeneratingRef(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pacoteId: selectedPackage.id,
          bancoId: selectedBankId || banks[0]?.id,
          metodoPagamento: selectedMethod,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao gerar referência de pagamento');
      }

      setActivePurchaseSlip(data);
      onRefreshSession();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setErrorMessage(errorMsg);
    } finally {
      setIsGeneratingRef(false);
    }
  };

  const copyText = (label: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="space-y-10">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 sm:p-8">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
            <Coins className="h-3.5 w-3.5" />
            Loja Oficial Five Coins • Angola (Kwanza AOA)
          </div>
          <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold text-white">
            Adquira Five Coins com Pagamento por Multicaixa ou Referência
          </h2>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            Todas as compras são efetuadas em Kwanzas (Kz) através dos canais bancários autorizados de Angola. É obrigatório apresentar e validar o seu NIF antes da compra.
          </p>

          {/* NIF Status Callout */}
          <div className="mt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                hasValidNif ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
              }`}>
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>Requisito Legal: NIF Angolano</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    hasValidNif ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {hasValidNif ? 'VALIDADO' : 'PENDENTE'}
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  {hasValidNif
                    ? `NIF Registado: ${nifInfo.nif_mascarado} (Habilitado para pagamentos)`
                    : 'Validação exigida antes de emitir qualquer referência Multicaixa.'}
                </div>
              </div>
            </div>

            {!hasValidNif && (
              <button
                onClick={onOpenNifModal}
                className="rounded-lg bg-amber-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors shrink-0"
              >
                Validar NIF Agora
              </button>
            )}
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Packages Grid */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-amber-400" />
            Pacotes Oficiais de Five Coins
          </h3>
          <span className="text-xs text-slate-400">Preços fixados em Kwanzas (AOA)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {packages.map(pkg => {
            const isSelected = selectedPackage?.id === pkg.id;
            const isPopular = pkg.preco_kwanza === 2000;

            return (
              <div
                key={pkg.id}
                onClick={() => handleSelectPackageToBuy(pkg)}
                className={`group relative flex flex-col justify-between rounded-2xl border p-5 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500/10 shadow-xl shadow-amber-500/10 scale-102'
                    : isPopular
                    ? 'border-amber-500/40 bg-slate-900/80 hover:border-amber-500/80'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                {isPopular && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 px-2.5 py-0.5 text-[10px] font-extrabold text-slate-950 tracking-wide uppercase">
                    Mais Popular
                  </span>
                )}

                <div>
                  <h4 className="text-sm font-semibold text-slate-200">{pkg.nome}</h4>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-white">
                      {pkg.quantidade_coins}
                    </span>
                    <span className="text-xs font-bold text-amber-400 uppercase">Coins</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    ≈ {Math.floor(pkg.quantidade_coins / 5)} imagens ou vídeos (5s)
                  </p>
                </div>

                <div className="mt-6 border-t border-slate-800/80 pt-4">
                  <div className="text-xl font-bold text-amber-300">
                    {pkg.preco_kwanza.toLocaleString('pt-AO')} Kz
                  </div>
                  <button
                    type="button"
                    className={`mt-3 w-full rounded-xl py-2 text-xs font-bold transition-colors ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-slate-200 group-hover:bg-amber-500 group-hover:text-slate-950'
                    }`}
                  >
                    {isSelected ? 'Selecionado' : 'Escolher Pacote'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Package Payment Configurator */}
      {selectedPackage && (
        <div className="rounded-2xl border border-amber-500/30 bg-slate-900/90 p-6 sm:p-8 backdrop-blur-xl shadow-2xl animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs font-semibold text-amber-400">Passo 2: Configuração de Pagamento</span>
              <h3 className="text-xl font-bold text-white mt-1">
                Finalizar Compra do {selectedPackage.nome} ({selectedPackage.quantidade_coins} Coins)
              </h3>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400">Montante a Pagar</span>
              <div className="text-2xl font-extrabold text-amber-400">
                {selectedPackage.preco_kwanza.toLocaleString('pt-AO')} Kz
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Method & Bank selection */}
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Método de Pagamento Autorizado em Angola:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('referencia')}
                    className={`flex items-center gap-2.5 rounded-xl border p-3 text-xs font-bold transition-all ${
                      selectedMethod === 'referencia'
                        ? 'border-amber-500 bg-amber-500/15 text-amber-300'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    <CreditCard className="h-4 w-4" />
                    <span>Pagamento por Referência</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('atm')}
                    className={`flex items-center gap-2.5 rounded-xl border p-3 text-xs font-bold transition-all ${
                      selectedMethod === 'atm'
                        ? 'border-amber-500 bg-amber-500/15 text-amber-300'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    <Building className="h-4 w-4" />
                    <span>ATM Multicaixa Físico</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Selecione o seu Banco em Angola:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {banks.map(bank => (
                    <button
                      key={bank.id}
                      type="button"
                      onClick={() => setSelectedBankId(bank.id)}
                      className={`flex flex-col items-center justify-center rounded-xl border p-2.5 text-xs font-semibold transition-all ${
                        selectedBankId === bank.id
                          ? 'border-amber-500 bg-amber-500/15 text-amber-300'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-base mb-1">{bank.logotipo_url}</span>
                      <span>{bank.codigo}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-xs text-slate-300 space-y-2">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                  <Clock className="h-4 w-4" />
                  <span>Validade da Referência: 72 Horas</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Após clicar em gerar referência, o sistema emitirá a Entidade e o código único de 9 dígitos. Pode pagar no Multicaixa Express, ATM ou Homebanking. Os Five Coins serão creditados automaticamente após confirmação bancária.
                </p>
              </div>

              <button
                onClick={handleCreatePaymentReference}
                disabled={isGeneratingRef}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/20 hover:bg-amber-400 transition-all disabled:opacity-50"
              >
                {isGeneratingRef ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Gerando Referência EMIS...
                  </>
                ) : (
                  <>
                    <span>Emitir Referência ({selectedPackage.preco_kwanza.toLocaleString('pt-AO')} Kz)</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>

            {/* Right: Issued Reference Slip (if generated) */}
            <div>
              {activePurchaseSlip ? (
                <div className="rounded-2xl border-2 border-amber-500/60 bg-slate-950 p-6 shadow-xl relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="font-extrabold text-xs text-amber-400 uppercase tracking-wider">
                      TALÃO MULTICAIXA EMIS
                    </span>
                    <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                      PENDENTE
                    </span>
                  </div>

                  <div className="mt-5 space-y-4 font-mono text-sm">
                    <div className="flex items-center justify-between rounded-xl bg-slate-900 p-3 border border-slate-800">
                      <span className="text-xs text-slate-400">ENTIDADE:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-white tracking-widest">
                          {activePurchaseSlip.instrucoes.entidade}
                        </span>
                        <button
                          onClick={() => copyText('entidade', activePurchaseSlip.instrucoes.entidade)}
                          className="text-slate-400 hover:text-white"
                        >
                          {copiedField === 'entidade' ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-slate-900 p-3 border border-slate-800">
                      <span className="text-xs text-slate-400">REFERÊNCIA:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-amber-400 tracking-widest">
                          {activePurchaseSlip.instrucoes.referencia}
                        </span>
                        <button
                          onClick={() => copyText('referencia', activePurchaseSlip.instrucoes.referencia)}
                          className="text-slate-400 hover:text-white"
                        >
                          {copiedField === 'referencia' ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-slate-900 p-3 border border-slate-800">
                      <span className="text-xs text-slate-400">MONTANTE:</span>
                      <span className="text-lg font-bold text-emerald-400">
                        {activePurchaseSlip.instrucoes.montante_kwanza}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/80 font-sans space-y-1">
                      <p>• Expira em: <strong>{new Date(activePurchaseSlip.instrucoes.expira_em).toLocaleString('pt-AO')}</strong></p>
                      <p>• Banco Parceiro: <strong>{activePurchaseSlip.banco.nome}</strong></p>
                      <p>• Five Coins a creditar: <strong className="text-amber-400">+{activePurchaseSlip.pacote.quantidade_coins} Coins</strong></p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-200">
                    💡 <strong>Como pagar agora:</strong> Abra o aplicativo <strong>Multicaixa Express</strong> ou dirija-se a um ATM, vá a "Pagamentos" &gt; "Pagamentos por Referência" e insira a Entidade e Referência acima.
                  </div>
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 p-8 text-center text-slate-500">
                  <CreditCard className="h-10 w-10 text-slate-700 mb-2" />
                  <p className="text-xs font-semibold text-slate-400">Talão de Pagamento será exibido aqui</p>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                    Clique em "Emitir Referência" para gerar os dados oficiais de pagamento Multicaixa.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-400" />
          Histórico das Suas Compras e Pedidos de Coins
        </h3>

        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Referência</th>
                <th className="py-3 px-4">Entidade</th>
                <th className="py-3 px-4">Valor em Kwanzas</th>
                <th className="py-3 px-4">Método</th>
                <th className="py-3 px-4">Data Emissão</th>
                <th className="py-3 px-4">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {purchases.map(p => (
                <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-amber-300">{p.referencia_pagamento}</td>
                  <td className="py-3 px-4 font-mono">{p.entidade}</td>
                  <td className="py-3 px-4 font-bold text-white">{p.valor_kwanza.toLocaleString('pt-AO')} Kz</td>
                  <td className="py-3 px-4 uppercase">{p.metodo_pagamento}</td>
                  <td className="py-3 px-4 text-slate-400">{new Date(p.data_criacao).toLocaleDateString('pt-AO')}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.estado === 'pago'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : p.estado === 'pendente'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-red-500/20 text-red-300 border border-red-500/30'
                      }`}
                    >
                      {p.estado.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
