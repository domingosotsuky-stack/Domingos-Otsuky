import React, { useState } from 'react';
import { 
  Sparkles, 
  Video, 
  Image as ImageIcon, 
  Wand2, 
  Coins, 
  Clock, 
  Play, 
  Download, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Sliders, 
  Upload, 
  RefreshCw,
  Info
} from 'lucide-react';
import { Generation } from '../types';

interface StudioIAProps {
  balance: number;
  onRefreshSession: () => void;
  generations: Generation[];
  setGenerations: React.Dispatch<React.SetStateAction<Generation[]>>;
  onOpenStore: () => void;
}

export const StudioIA: React.FC<StudioIAProps> = ({
  balance,
  onRefreshSession,
  generations,
  setGenerations,
  onOpenStore,
}) => {
  const [activeMode, setActiveMode] = useState<'image' | 'video' | 'edit'>('image');

  // Image Generation State
  const [imagePrompt, setImagePrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('Fotografia Realista');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16'>('1:1');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // Video Generation State
  const [videoPrompt, setVideoPrompt] = useState('');
  const [videoDuration, setVideoDuration] = useState<number>(5); // 5s, 10s, 15s
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);

  // Media Editing State
  const [editPrompt, setEditPrompt] = useState('');
  const [editMediaType, setEditMediaType] = useState<'image' | 'video'>('image');
  const [editSourceUrl, setEditSourceUrl] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Notifications
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Calculators for costs
  const imageCost = 5; // Regra Five IA: 5 Five Coins por imagem
  const videoCost = videoDuration === 5 ? 5 : 5 + (videoDuration - 5); // 5 coins para 5s, proporcional acima
  const editCost = 5; // 5 Five Coins por edição

  const promptSuggestions = [
    'Retrato cinematográfico em 8K de jovem angolana com joias tradicionais e iluminação de estúdio',
    'Cidade de Luanda futurista no ano 2077 com arranha-céus flutuantes e carros aéreos',
    'Leão majestoso no pôr do sol da savana africana com poeira dourada e lente macro',
    'Carro desportivo elétrico ultra-moderno a acelerar na Marginal de Luanda com reflexos no asfalto molhado',
  ];

  // 1. Handle Image Generation
  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) return;

    if (balance < imageCost) {
      setStatusMessage({
        type: 'error',
        text: `Saldo insuficiente! Precisa de ${imageCost} Five Coins para gerar esta imagem. O seu saldo atual é de ${balance} Five Coins.`,
      });
      return;
    }

    setIsGeneratingImage(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: imagePrompt,
          style: selectedStyle,
          aspectRatio,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao gerar imagem');
      }

      setGenerations(prev => [data.geracao, ...prev]);
      setStatusMessage({
        type: 'success',
        text: `Imagem gerada com sucesso! 5 Five Coins foram debitados com transparência.`,
      });
      setImagePrompt('');
      onRefreshSession();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setStatusMessage({
        type: 'error',
        text: errorMsg || 'Ocorreu um erro. Se houve débito, os créditos foram reembolsados automaticamente.',
      });
      onRefreshSession();
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // 2. Handle Video Generation
  const handleGenerateVideo = async () => {
    if (!videoPrompt.trim()) return;

    if (balance < videoCost) {
      setStatusMessage({
        type: 'error',
        text: `Saldo insuficiente! Um vídeo de ${videoDuration}s requer ${videoCost} Five Coins. O seu saldo atual é de ${balance} Five Coins.`,
      });
      return;
    }

    setIsGeneratingVideo(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: videoPrompt,
          duracaoSegundos: videoDuration,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao gerar vídeo');
      }

      setGenerations(prev => [data.geracao, ...prev]);
      setStatusMessage({
        type: 'success',
        text: `Vídeo (${videoDuration}s) renderizado com sucesso! ${videoCost} Five Coins debitados.`,
      });
      setVideoPrompt('');
      onRefreshSession();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setStatusMessage({
        type: 'error',
        text: errorMsg || 'Falha ao processar o vídeo. Os Five Coins foram devolvidos à sua carteira.',
      });
      onRefreshSession();
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  // 3. Handle Media Editing
  const handleEditMedia = async () => {
    if (!editPrompt.trim()) return;

    if (balance < editCost) {
      setStatusMessage({
        type: 'error',
        text: `Saldo insuficiente! A edição requer ${editCost} Five Coins.`,
      });
      return;
    }

    setIsEditing(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/edit-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: editMediaType,
          mediaUrl: editSourceUrl,
          instructionPrompt: editPrompt,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro na edição da mídia');
      }

      setGenerations(prev => [data.geracao, ...prev]);
      setStatusMessage({
        type: 'success',
        text: `Edição concluída com sucesso! 5 Five Coins debitados.`,
      });
      setEditPrompt('');
      onRefreshSession();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setStatusMessage({
        type: 'error',
        text: errorMsg,
      });
    } finally {
      setIsEditing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Studio Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 sm:p-8">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
            <Sparkles className="h-3.5 w-3.5" />
            Five IA Studio • Criado por OTsUkY FiVe
          </div>
          <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Geração e Edição de Imagens & Vídeos com Inteligência Artificial
          </h2>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            Crie conteúdo visual ultrarrealista com os modelos mais avançados de IA. Cada imagem custa <strong className="text-amber-400">5 Five Coins</strong> e cada vídeo de 5 segundos custa <strong className="text-amber-400">5 Five Coins</strong> com custos transparentes antes de cada geração.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg bg-slate-900/80 border border-slate-800 px-3 py-1.5 text-xs text-slate-300">
              <ImageIcon className="h-3.5 w-3.5 text-amber-400" />
              <span>1 Imagem = <strong>5 Coins</strong></span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-slate-900/80 border border-slate-800 px-3 py-1.5 text-xs text-slate-300">
              <Video className="h-3.5 w-3.5 text-amber-400" />
              <span>Vídeo 5s = <strong>5 Coins</strong></span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-slate-900/80 border border-slate-800 px-3 py-1.5 text-xs text-slate-300">
              <Clock className="h-3.5 w-3.5 text-amber-400" />
              <span>Vídeo 10s = <strong>10 Coins</strong></span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-slate-900/80 border border-slate-800 px-3 py-1.5 text-xs text-slate-300">
              <RefreshCw className="h-3.5 w-3.5 text-emerald-400" />
              <span>Reembolso automático em caso de falha</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mode Selector Tabs */}
      <div className="flex border-b border-slate-800 gap-2 sm:gap-4">
        <button
          onClick={() => setActiveMode('image')}
          className={`flex items-center gap-2 pb-3 text-sm font-semibold transition-all border-b-2 ${
            activeMode === 'image'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ImageIcon className="h-4 w-4" />
          Gerar Imagens (5 Coins)
        </button>
        <button
          onClick={() => setActiveMode('video')}
          className={`flex items-center gap-2 pb-3 text-sm font-semibold transition-all border-b-2 ${
            activeMode === 'video'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Video className="h-4 w-4" />
          Gerar Vídeos ({videoCost} Coins)
        </button>
        <button
          onClick={() => setActiveMode('edit')}
          className={`flex items-center gap-2 pb-3 text-sm font-semibold transition-all border-b-2 ${
            activeMode === 'edit'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Wand2 className="h-4 w-4" />
          Editar Imagens / Vídeos (5 Coins)
        </button>
      </div>

      {/* Feedback Alert */}
      {statusMessage && (
        <div
          className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${
            statusMessage.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
              : 'border-red-500/30 bg-red-500/10 text-red-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
          )}
          <div className="flex-1">
            <p>{statusMessage.text}</p>
          </div>
          {statusMessage.type === 'error' && balance < 5 && (
            <button
              onClick={onOpenStore}
              className="rounded-lg bg-amber-500 px-3 py-1 text-xs font-bold text-slate-950 hover:bg-amber-400"
            >
              Comprar Coins
            </button>
          )}
        </div>
      )}

      {/* Active Studio Form */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm">
        {/* MODE 1: IMAGE GENERATION */}
        {activeMode === 'image' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-2">
                Descreva a imagem que deseja gerar com a Five IA:
              </label>
              <textarea
                value={imagePrompt}
                onChange={e => setImagePrompt(e.target.value)}
                placeholder="Exemplo: Retrato em estilo cyberpunk de um arquiteto angolano a observar a Baía de Luanda à noite, iluminação neon azul e âmbar, textura hiper-detalhada em 8K..."
                rows={4}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/80 p-3.5 text-sm text-slate-100 placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* Prompt Ideas */}
            <div>
              <span className="text-xs font-semibold text-slate-400">Sugestões rápidas de prompts:</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {promptSuggestions.map((sug, i) => (
                  <button
                    key={i}
                    onClick={() => setImagePrompt(sug)}
                    className="rounded-lg border border-slate-800 bg-slate-950/60 px-2.5 py-1 text-xs text-slate-300 hover:border-amber-500/50 hover:text-amber-300 transition-colors"
                  >
                    💡 {sug.slice(0, 48)}...
                  </button>
                ))}
              </div>
            </div>

            {/* Styles & Aspect Ratio */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Estilo Artístico:
                </label>
                <select
                  value={selectedStyle}
                  onChange={e => setSelectedStyle(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-sm text-slate-200 focus:border-amber-500 focus:outline-none"
                >
                  <option value="Fotografia Realista">Fotografia Realista (Ultra Detalhada)</option>
                  <option value="3D Cinema Render">3D Cinema Render (Octane / Unreal 5)</option>
                  <option value="Cyberpunk Futurista">Cyberpunk Futurista Neon</option>
                  <option value="Arte Conceptual Épica">Arte Conceptual Épica</option>
                  <option value="Anime Japonês Moderno">Anime Japonês Moderno</option>
                  <option value="Pintura Africana a Óleo">Pintura Expressiva Africana</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Proporção da Imagem:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['1:1', '16:9', '9:16'] as const).map(ratio => (
                    <button
                      key={ratio}
                      type="button"
                      onClick={() => setAspectRatio(ratio)}
                      className={`rounded-xl border py-2 text-xs font-semibold transition-all ${
                        aspectRatio === ratio
                          ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {ratio} {ratio === '1:1' ? '(Quadrado)' : ratio === '16:9' ? '(Horizontal)' : '(Vertical)'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Cost and Confirmation Button */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800 pt-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <Coins className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-200">
                    Custo da Operação: <span className="text-amber-400 font-extrabold">{imageCost} Five Coins</span>
                  </div>
                  <div className="text-xs text-slate-400">
                    O seu saldo atual: <strong className="text-slate-200">{balance} Coins</strong>
                  </div>
                </div>
              </div>

              <button
                onClick={handleGenerateImage}
                disabled={isGeneratingImage || !imagePrompt.trim()}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isGeneratingImage ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Gerando Imagem com IA...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Gerar Imagem ({imageCost} Five Coins)
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* MODE 2: VIDEO GENERATION */}
        {activeMode === 'video' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-2">
                Descreva a cena cinematográfica para o vídeo com IA:
              </label>
              <textarea
                value={videoPrompt}
                onChange={e => setVideoPrompt(e.target.value)}
                placeholder="Exemplo: Câmera em movimento suave a sobrevoar as Quedas de Kalandula ao amanhecer, névoa a subir e raios de sol dourados entre as árvores..."
                rows={4}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/80 p-3.5 text-sm text-slate-100 placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* Video Duration Selector */}
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-2">
                Duração Selecionável do Vídeo (Regra Five IA):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { dur: 5, coins: 5, label: '5 Segundos (Padrão)', desc: '5 Five Coins' },
                  { dur: 10, coins: 10, label: '10 Segundos', desc: '10 Five Coins' },
                  { dur: 15, coins: 15, label: '15 Segundos', desc: '15 Five Coins' },
                ].map(item => (
                  <button
                    key={item.dur}
                    type="button"
                    onClick={() => setVideoDuration(item.dur)}
                    className={`flex flex-col items-center justify-center rounded-xl border p-3.5 transition-all ${
                      videoDuration === item.dur
                        ? 'border-amber-500 bg-amber-500/15 text-amber-300 shadow-sm'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="font-bold text-sm text-white">{item.label}</span>
                    <span className="text-xs font-semibold text-amber-400 mt-1">{item.desc}</span>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-400">
                Cada geração de 5 segundos custa <strong>5 Five Coins</strong>. Para durações maiores, o custo total é calculado e apresentado com transparência antes de confirmar.
              </p>
            </div>

            {/* Cost and Confirmation Button */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800 pt-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <Coins className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-200">
                    Custo Total do Vídeo ({videoDuration}s): <span className="text-amber-400 font-extrabold">{videoCost} Five Coins</span>
                  </div>
                  <div className="text-xs text-slate-400">
                    O seu saldo atual: <strong className="text-slate-200">{balance} Coins</strong>
                  </div>
                </div>
              </div>

              <button
                onClick={handleGenerateVideo}
                disabled={isGeneratingVideo || !videoPrompt.trim()}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isGeneratingVideo ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processando Vídeo ({videoDuration}s)...
                  </>
                ) : (
                  <>
                    <Video className="h-4 w-4" />
                    Gerar Vídeo ({videoCost} Five Coins)
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* MODE 3: EDIT MEDIA */}
        {activeMode === 'edit' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Tipo de Mídia a Editar:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditMediaType('image')}
                    className={`rounded-xl border py-2 text-xs font-semibold ${
                      editMediaType === 'image'
                        ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    Editar Imagem
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditMediaType('video')}
                    className={`rounded-xl border py-2 text-xs font-semibold ${
                      editMediaType === 'video'
                        ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    Editar Vídeo
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  URL da Imagem / Vídeo Origem (ou envie ficheiro):
                </label>
                <input
                  type="text"
                  value={editSourceUrl}
                  onChange={e => setEditSourceUrl(e.target.value)}
                  placeholder="https://exemplo.com/sua-imagem.jpg"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2 text-sm text-slate-200 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-2">
                Instruções de Edição com Comandos Escritos:
              </label>
              <textarea
                value={editPrompt}
                onChange={e => setEditPrompt(e.target.value)}
                placeholder="Exemplo: Mude a iluminação para pôr do sol, adicione reflexos dourados nos edifícios e remova os carros do fundo..."
                rows={3}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/80 p-3.5 text-sm text-slate-100 placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800 pt-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <Coins className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-200">
                    Custo de Edição: <span className="text-amber-400 font-extrabold">{editCost} Five Coins</span>
                  </div>
                  <div className="text-xs text-slate-400">
                    Saldo disponível: <strong className="text-slate-200">{balance} Coins</strong>
                  </div>
                </div>
              </div>

              <button
                onClick={handleEditMedia}
                disabled={isEditing || !editPrompt.trim()}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isEditing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Aplicando Edição com IA...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    Executar Edição ({editCost} Five Coins)
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Generations Gallery */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white">Histórico de Criações na Five IA</h3>
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
              {generations.length} criações
            </span>
          </div>
          <span className="text-xs text-slate-400">Registo gravado na base de dados PostgreSQL</span>
        </div>

        {generations.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 p-12 text-center text-slate-400">
            <Sparkles className="h-10 w-10 text-slate-600 mb-3" />
            <p className="font-semibold text-slate-300">Ainda não realizou gerações.</p>
            <p className="text-xs mt-1 text-slate-500 max-w-sm">
              Escreva um prompt acima e crie a sua primeira imagem ou vídeo com 5 Five Coins!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {generations.map(gen => (
              <div
                key={gen.id}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 transition-all hover:border-amber-500/40 hover:shadow-xl"
              >
                <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
                  {gen.tipo === 'video' ? (
                    <video
                      src={gen.url_ficheiro}
                      controls
                      className="h-full w-full object-cover"
                      poster="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80"
                    />
                  ) : (
                    <img
                      src={gen.url_ficheiro}
                      alt={gen.prompt}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  )}

                  {/* Badge */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 rounded-lg bg-slate-950/80 px-2 py-1 text-[11px] font-bold text-amber-300 backdrop-blur-md border border-amber-500/20">
                    {gen.tipo === 'video' ? <Video className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}
                    <span>{gen.tipo === 'video' ? `Vídeo (${gen.duracao_segundos || 5}s)` : 'Imagem'}</span>
                  </div>

                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded-lg bg-slate-950/80 px-2 py-1 text-[11px] font-bold text-slate-200 backdrop-blur-md border border-slate-700">
                    <Coins className="h-3 w-3 text-amber-400" />
                    <span>{gen.coins_gastos} Coins</span>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-4 justify-between">
                  <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                    "{gen.prompt}"
                  </p>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-3 text-[11px] text-slate-400">
                    <span>{new Date(gen.data_criacao).toLocaleDateString('pt-AO')}</span>
                    <a
                      href={gen.url_ficheiro}
                      download={`five-ia-${gen.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded-md bg-slate-800 px-2 py-1 text-slate-200 hover:bg-amber-500 hover:text-slate-950 transition-colors font-semibold"
                    >
                      <Download className="h-3 w-3" />
                      Baixar
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
