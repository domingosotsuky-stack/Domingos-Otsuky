import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Coins, 
  User, 
  Copy, 
  Check, 
  ArrowRight, 
  HelpCircle, 
  ShieldCheck, 
  FileText,
  Loader2
} from 'lucide-react';

interface MessageItem {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  cost?: number;
}

interface AssistantChatProps {
  balance: number;
  onRefreshSession: () => void;
  onOpenStore: () => void;
  onUsePromptInStudio?: (prompt: string) => void;
}

export const AssistantChat: React.FC<AssistantChatProps> = ({
  balance,
  onRefreshSession,
  onOpenStore,
  onUsePromptInStudio,
}) => {
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Olá! Sou o assistente oficial de Inteligência Artificial da **Five IA**, criado para si por **OTsUkY FiVe**.

Estou aqui para:
- 🎨 **Ajudar a criar e otimizar prompts** para gerar imagens e vídeos incríveis.
- 🪙 **Esclarecer as regras das Five Coins**: Cada imagem custa **5 Five Coins**, e cada vídeo de 5s custa **5 Five Coins** (vídeos mais longos têm custo calculado proporcionalmente).
- 🇦🇴 **Explicar a compra de créditos em Kwanzas (Kz)**: Pacotes de 500 Kz a 5.000 Kz com validação do **NIF angolano** e pagamento por **Multicaixa / Referência**.
- 💡 Dar ideias e sugestões artísticas para os seus projetos visuais.

Como posso ajudar hoje?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || isLoading) return;

    const userMsg: MessageItem = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro na comunicação com a IA');
      }

      const botMsg: MessageItem = {
        id: `a-${Date.now()}`,
        sender: 'assistant',
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, botMsg]);
      onRefreshSession();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: `⚠️ ${errorMsg || 'Erro temporário ao consultar a IA. Por favor, tente novamente.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const quickPrompts = [
    'Como funcionam as Five Coins e os custos de imagem e vídeo?',
    'Cria um prompt realista para uma foto da Baía de Luanda ao pôr do sol',
    'Como validar o meu NIF angolano e pagar por Referência Multicaixa?',
    'Sugere 3 ideias de vídeos cinematográficos para promover turismo em Angola',
  ];

  return (
    <div className="flex flex-col h-[750px] max-w-5xl mx-auto rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-md overflow-hidden shadow-2xl">
      {/* Chat Header */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 shadow-md shadow-amber-500/20">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-base">Assistente Five IA</h3>
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-xs text-slate-400">
              Especialista em prompts criativos, Five Coins e pagamentos Multicaixa
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1 text-xs text-slate-300">
            <Coins className="h-3.5 w-3.5 text-amber-400" />
            <span>Saldo: <strong className="text-amber-300 font-bold">{balance}</strong> Coins</span>
          </div>
          <button
            onClick={onOpenStore}
            className="hidden sm:inline-flex rounded-lg bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 text-xs font-semibold text-amber-300 hover:bg-amber-500/25 transition-colors"
          >
            Adquirir Coins
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'assistant' && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300">
                <Sparkles className="h-4 w-4" />
              </div>
            )}

            <div
              className={`relative max-w-2xl rounded-2xl p-4 text-sm leading-relaxed shadow-sm ${
                msg.sender === 'user'
                  ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-none'
                  : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.text}</div>

              <div
                className={`mt-2 flex items-center justify-between gap-4 text-[11px] ${
                  msg.sender === 'user' ? 'text-slate-900/70 font-semibold' : 'text-slate-500'
                }`}
              >
                <span>{msg.timestamp}</span>

                {msg.sender === 'assistant' && (
                  <button
                    onClick={() => copyToClipboard(msg.id, msg.text)}
                    className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors"
                    title="Copiar resposta"
                  >
                    {copiedId === msg.id ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-400" />
                        <span className="text-emerald-400">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {msg.sender === 'user' && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-slate-200 font-bold">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-slate-950 border border-slate-800 px-4 py-3 text-xs text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
              <span>O assistente Five IA está a formular a melhor resposta...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Bar */}
      <div className="border-t border-slate-800/80 bg-slate-950/40 px-6 py-2.5 overflow-x-auto">
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="text-[11px] font-semibold text-slate-400 shrink-0">Perguntas frequentes:</span>
          {quickPrompts.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              className="rounded-lg border border-slate-800 bg-slate-900/90 px-2.5 py-1 text-xs text-slate-300 hover:border-amber-500/40 hover:text-amber-300 transition-colors shrink-0"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <div className="border-t border-slate-800 bg-slate-950 p-4">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-3"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={e => setInputMessage(e.target.value)}
            placeholder="Pergunte ao assistente da Five IA (prompts, Five Coins, regras, vídeos, imagens)..."
            className="flex-1 rounded-xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !inputMessage.trim()}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 hover:bg-amber-400 disabled:opacity-50 transition-all cursor-pointer shrink-0"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
