import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { StudioIA } from './components/StudioIA';
import { AssistantChat } from './components/AssistantChat';
import { StoreSection } from './components/StoreSection';
import { PostgresExplorer } from './components/PostgresExplorer';
import { AdminPanel } from './components/AdminPanel';
import { NifModal } from './components/NifModal';
import { User, NifInfo, CoinPackage, Bank, Purchase, Generation, ServiceCost, AuditLog } from './types';
import { ShieldCheck, Heart, Sparkles, Database, HelpCircle } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('studio');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [nifInfo, setNifInfo] = useState<NifInfo | null>(null);
  const [packages, setPackages] = useState<CoinPackage[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [serviceCosts, setServiceCosts] = useState<ServiceCost[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [notificationCount, setNotificationCount] = useState<number>(1);
  const [isNifModalOpen, setIsNifModalOpen] = useState<boolean>(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState<boolean>(true);

  // Load all initial database and session state
  const loadAppState = async () => {
    try {
      // 1. Session & Profile
      const sessionRes = await fetch('/api/session');
      if (sessionRes.ok) {
        const sessionData = await sessionRes.json();
        setCurrentUser(sessionData.user);
        setBalance(sessionData.saldo_five_coins);
        setNifInfo(sessionData.nif_info);
        setNotificationCount(sessionData.notificacoes?.length || 0);
      }

      // 2. Full Store & DB data
      const dataRes = await fetch('/api/data/export-all');
      if (dataRes.ok) {
        const allData = await dataRes.json();
        setPackages(allData.pacotes_coins || []);
        setBanks(allData.bancos || []);
        setPurchases(allData.compras || []);
        setGenerations(allData.geracoes || []);
        setServiceCosts(allData.custos_servicos || []);
        setAuditLogs(allData.logs_auditoria || []);
      }
    } catch (err) {
      console.error('Error loading Five IA initial state:', err);
    } finally {
      setIsLoadingInitial(false);
    }
  };

  useEffect(() => {
    loadAppState();
  }, []);

  const handleSwitchUser = async (targetUserId: string) => {
    try {
      const res = await fetch('/api/session/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId }),
      });
      if (res.ok) {
        await loadAppState();
      }
    } catch (err) {
      console.error('Error switching user:', err);
    }
  };

  if (isLoadingInitial) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-600 to-yellow-300 shadow-xl shadow-amber-500/20 animate-pulse">
            <span className="font-extrabold text-3xl text-slate-950">5</span>
          </div>
          <p className="text-sm font-semibold text-slate-400">Carregando Five IA & PostgreSQL Engine...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-amber-500 selection:text-slate-950">
      {/* Global Navigation Header */}
      <Header
        currentUser={currentUser}
        balance={balance}
        nifInfo={nifInfo}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNifModal={() => setIsNifModalOpen(true)}
        onSwitchUser={handleSwitchUser}
        notificationCount={notificationCount}
      />

      {/* Main Content View */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-8 sm:px-6">
        {activeTab === 'studio' && (
          <StudioIA
            balance={balance}
            onRefreshSession={loadAppState}
            generations={generations}
            setGenerations={setGenerations}
            onOpenStore={() => setActiveTab('store')}
          />
        )}

        {activeTab === 'chat' && (
          <AssistantChat
            balance={balance}
            onRefreshSession={loadAppState}
            onOpenStore={() => setActiveTab('store')}
          />
        )}

        {activeTab === 'store' && (
          <StoreSection
            balance={balance}
            nifInfo={nifInfo}
            onOpenNifModal={() => setIsNifModalOpen(true)}
            packages={packages}
            banks={banks}
            purchases={purchases}
            onRefreshSession={loadAppState}
          />
        )}

        {activeTab === 'postgres' && (
          <PostgresExplorer />
        )}

        {activeTab === 'admin' && (
          <AdminPanel
            packages={packages}
            serviceCosts={serviceCosts}
            purchases={purchases}
            banks={banks}
            auditLogs={auditLogs}
            onRefreshAll={loadAppState}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 px-4 text-xs text-slate-500">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-white text-sm">Five <span className="text-amber-400">IA</span></span>
            <span>•</span>
            <span>Plataforma de Inteligência Artificial de Angola</span>
            <span>•</span>
            <span className="text-amber-400 font-semibold">Criado por OTsUkY FiVe</span>
          </div>

          <div className="flex items-center gap-6 text-[11px] text-slate-400">
            <button onClick={() => setActiveTab('postgres')} className="hover:text-amber-300 transition-colors">
              PostgreSQL Schema (16 Tabelas)
            </button>
            <button onClick={() => setIsNifModalOpen(true)} className="hover:text-amber-300 transition-colors">
              Validação de NIF (AGT)
            </button>
            <button onClick={() => setActiveTab('store')} className="hover:text-amber-300 transition-colors">
              Multicaixa EMIS (72h)
            </button>
          </div>
        </div>
      </footer>

      {/* Angolan NIF Modal */}
      <NifModal
        isOpen={isNifModalOpen}
        onClose={() => setIsNifModalOpen(false)}
        nifInfo={nifInfo}
        onSuccess={loadAppState}
      />
    </div>
  );
}
