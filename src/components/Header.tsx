import React from 'react';
import { 
  Coins, 
  Sparkles, 
  Database, 
  ShieldCheck, 
  ShoppingBag, 
  Bot, 
  User as UserIcon, 
  Crown,
  Layers,
  ChevronDown,
  Bell
} from 'lucide-react';
import { User, NifInfo } from '../types';

interface HeaderProps {
  currentUser: User | null;
  balance: number;
  nifInfo: NifInfo | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenNifModal: () => void;
  onSwitchUser: (userId: string) => void;
  notificationCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  balance,
  nifInfo,
  activeTab,
  setActiveTab,
  onOpenNifModal,
  onSwitchUser,
  notificationCount
}) => {
  const isOwner = currentUser?.papel === 'dono' || currentUser?.papel === 'admin';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand / Logo */}
        <div className="flex items-center gap-4">
          <div 
            onClick={() => setActiveTab('studio')} 
            className="flex cursor-pointer items-center gap-3 transition-transform hover:scale-102"
          >
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-300 shadow-lg shadow-amber-500/20">
              <span className="font-extrabold text-xl text-slate-950">5</span>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-400"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-xl tracking-tight text-white">
                  Five <span className="bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">IA</span>
                </h1>
                <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
                  ANGOLA
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                Por <span className="text-amber-400/90 font-semibold">OTsUkY FiVe</span>
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1 ml-6 border-l border-slate-800/80 pl-6">
            <button
              onClick={() => setActiveTab('studio')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'studio'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              Studio IA
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'chat'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Bot className="h-4 w-4" />
              Assistente IA
            </button>
            <button
              onClick={() => setActiveTab('store')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'store'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <ShoppingBag className="h-4 w-4" />
              Comprar Coins
            </button>
            <button
              onClick={() => setActiveTab('postgres')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'postgres'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Database className="h-4 w-4" />
              PostgreSQL Schema & SQL
            </button>
            {isOwner && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'admin'
                    ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                    : 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10'
                }`}
              >
                <Crown className="h-4 w-4 text-amber-400" />
                Painel Admin
              </button>
            )}
          </nav>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-3">
          {/* NIF Badge */}
          <button
            onClick={onOpenNifModal}
            className={`hidden sm:flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
              nifInfo?.estado === 'valido'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                : 'border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
            }`}
            title="Estado do NIF Angolano"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>
              {nifInfo?.estado === 'valido' ? `NIF: ${nifInfo.nif_mascarado}` : 'Validar NIF'}
            </span>
          </button>

          {/* Five Coins Balance */}
          <div 
            onClick={() => setActiveTab('store')}
            className="flex cursor-pointer items-center gap-2 rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/15 to-yellow-500/5 px-3 py-1.5 shadow-sm transition-all hover:border-amber-500/60"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500 text-slate-950">
              <Coins className="h-3.5 w-3.5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="font-extrabold text-sm text-amber-300">
                  {balance.toLocaleString()}
                </span>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Coins</span>
              </div>
            </div>
          </div>

          {/* User Profile Switcher */}
          <div className="relative group">
            <button className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/90 px-2.5 py-1.5 text-xs text-slate-200 transition-colors hover:border-slate-700">
              <div className={`flex h-6 w-6 items-center justify-center rounded-lg font-bold ${
                isOwner ? 'bg-amber-500 text-slate-950' : 'bg-slate-700 text-slate-100'
              }`}>
                {isOwner ? <Crown className="h-3.5 w-3.5" /> : <UserIcon className="h-3.5 w-3.5" />}
              </div>
              <span className="hidden md:inline font-semibold">
                {currentUser?.nome || 'Utilizador'}
              </span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {/* Dropdown to switch accounts */}
            <div className="absolute right-0 mt-1 hidden w-56 rounded-xl border border-slate-800 bg-slate-900/95 p-1.5 shadow-2xl backdrop-blur-xl group-hover:block z-50">
              <div className="px-2.5 py-1.5 border-b border-slate-800 text-[11px] text-slate-400 font-medium">
                Alternar Sessão para Testes:
              </div>
              <button
                onClick={() => onSwitchUser('u0000000-0000-0000-0000-000000000001')}
                className={`w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition-colors ${
                  currentUser?.id === 'u0000000-0000-0000-0000-000000000001'
                    ? 'bg-amber-500/20 text-amber-300 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Crown className="h-3.5 w-3.5 text-amber-400" />
                  <div>
                    <div>OTsUkY FiVe</div>
                    <div className="text-[10px] text-amber-400/80">Super Admin & Dono</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold">99k coins</span>
              </button>
              <button
                onClick={() => onSwitchUser('u0000000-0000-0000-0000-000000000002')}
                className={`w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition-colors ${
                  currentUser?.id === 'u0000000-0000-0000-0000-000000000002'
                    ? 'bg-amber-500/20 text-amber-300 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <UserIcon className="h-3.5 w-3.5 text-slate-400" />
                  <div>
                    <div>Domingos Kapa</div>
                    <div className="text-[10px] text-slate-400">Cliente / Utilizador</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold">125 coins</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Nav Tabs */}
      <div className="flex lg:hidden overflow-x-auto border-t border-slate-900 bg-slate-950/95 px-4 py-2 gap-2 scrollbar-none">
        <button
          onClick={() => setActiveTab('studio')}
          className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1 text-xs font-medium ${
            activeTab === 'studio' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 bg-slate-900'
          }`}
        >
          <Sparkles className="h-3 w-3" />
          Studio IA
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1 text-xs font-medium ${
            activeTab === 'chat' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 bg-slate-900'
          }`}
        >
          <Bot className="h-3 w-3" />
          Assistente IA
        </button>
        <button
          onClick={() => setActiveTab('store')}
          className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1 text-xs font-medium ${
            activeTab === 'store' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 bg-slate-900'
          }`}
        >
          <ShoppingBag className="h-3 w-3" />
          Comprar Coins
        </button>
        <button
          onClick={() => setActiveTab('postgres')}
          className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1 text-xs font-medium ${
            activeTab === 'postgres' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 bg-slate-900'
          }`}
        >
          <Database className="h-3 w-3" />
          PostgreSQL & SQL
        </button>
        {isOwner && (
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1 text-xs font-medium ${
              activeTab === 'admin' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-amber-400 bg-slate-900'
            }`}
          >
            <Crown className="h-3 w-3" />
            Admin
          </button>
        )}
      </div>
    </header>
  );
};
