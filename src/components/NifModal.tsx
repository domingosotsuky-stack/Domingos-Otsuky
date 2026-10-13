import React, { useState } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Lock, 
  Info, 
  Building2, 
  UserCheck,
  Loader2
} from 'lucide-react';
import { NifInfo } from '../types';

interface NifModalProps {
  isOpen: boolean;
  onClose: () => void;
  nifInfo: NifInfo | null;
  onSuccess: () => void;
}

export const NifModal: React.FC<NifModalProps> = ({
  isOpen,
  onClose,
  nifInfo,
  onSuccess,
}) => {
  const [nifInput, setNifInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmitNif = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nifInput.trim()) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/nif/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nif: nifInput.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'NIF inválido segundo as normas da AGT');
      }

      setSuccessMsg(data.mensagem || 'NIF angolano validado com sucesso!');
      onSuccess();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setErrorMsg(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillExample = (example: string) => {
    setNifInput(example);
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">Validação do NIF Angolano</h3>
            <p className="text-xs text-slate-400">
              Obrigatório antes de qualquer compra de Five Coins (Regulamentação AGT)
            </p>
          </div>
        </div>

        {/* Current Status */}
        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Estado Atual:</span>
            <span
              className={`font-bold px-2 py-0.5 rounded-full ${
                nifInfo?.estado === 'valido'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              {nifInfo?.estado === 'valido' ? 'VÁLIDO E HABILITADO' : 'PENDENTE / NÃO VALIDADO'}
            </span>
          </div>
          {nifInfo?.estado === 'valido' && (
            <div className="mt-2 text-xs text-slate-300">
              NIF Registado: <strong className="text-amber-400">{nifInfo.nif_mascarado}</strong>
            </div>
          )}
        </div>

        {/* Legal Formats Box */}
        <div className="mt-4 rounded-xl border border-slate-800/80 bg-slate-950/40 p-4 space-y-2 text-xs text-slate-300">
          <div className="flex items-center gap-2 font-semibold text-amber-400">
            <Info className="h-4 w-4 shrink-0" />
            <span>Formatos Oficiais de NIF em Angola:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
            <div className="rounded-lg border border-slate-800 bg-slate-900 p-2.5">
              <div className="flex items-center gap-1.5 font-bold text-slate-200">
                <UserCheck className="h-3.5 w-3.5 text-amber-400" />
                Pessoa Singular (14 chars)
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                9 dígitos + 2 letras + 3 dígitos (igual ao BI angolano).
              </p>
              <button
                type="button"
                onClick={() => fillExample('005423189LA042')}
                className="mt-2 text-[10px] text-amber-400 hover:underline font-mono"
              >
                Exemplo: 005423189LA042
              </button>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900 p-2.5">
              <div className="flex items-center gap-1.5 font-bold text-slate-200">
                <Building2 className="h-3.5 w-3.5 text-amber-400" />
                Pessoa Coletiva (10 dígitos)
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                10 dígitos numéricos de empresa ou organização.
              </p>
              <button
                type="button"
                onClick={() => fillExample('5417032190')}
                className="mt-2 text-[10px] text-amber-400 hover:underline font-mono"
              >
                Exemplo: 5417032190
              </button>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmitNif} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Digite o seu NIF de Angola:
            </label>
            <input
              type="text"
              value={nifInput}
              onChange={e => setNifInput(e.target.value.toUpperCase())}
              placeholder="Ex: 005423189LA042 ou 5417032190"
              className="w-full font-mono uppercase tracking-wider rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-slate-100 placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              disabled={isSubmitting}
            />
          </div>

          {errorMsg && (
            <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-200">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-slate-800 pt-4">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <Lock className="h-3 w-3 text-amber-400" />
              <span>Criptografado com chave segura</span>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                Fechar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !nifInput.trim()}
                className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 hover:bg-amber-400 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Validando NIF...
                  </>
                ) : (
                  'Validar e Habilitar'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
