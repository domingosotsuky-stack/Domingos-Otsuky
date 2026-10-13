import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Table, 
  Terminal, 
  FileCode, 
  Download, 
  Copy, 
  Check, 
  Play, 
  Layers, 
  ArrowRight, 
  Key, 
  Link2, 
  ShieldCheck, 
  CheckCircle2, 
  Search,
  Filter,
  Maximize2
} from 'lucide-react';
import { FIVE_IA_TABLES, FIVE_IA_QUERIES, DBTable, QueryExample } from '../db/schema-data';

export const PostgresExplorer: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'erd' | 'queries' | 'scripts' | 'tables'>('erd');
  const [selectedTable, setSelectedTable] = useState<DBTable>(FIVE_IA_TABLES[0]);
  const [selectedQuery, setSelectedQuery] = useState<QueryExample>(FIVE_IA_QUERIES[0]);
  
  // SQL Scripts
  const [schemaSql, setSchemaSql] = useState('');
  const [seedSql, setSeedSql] = useState('');
  const [queriesSql, setQueriesSql] = useState('');
  const [activeScriptTab, setActiveScriptTab] = useState<'schema' | 'seed' | 'queries'>('schema');

  // Query Runner State
  const [isRunningQuery, setIsRunningQuery] = useState(false);
  const [queryResults, setQueryResults] = useState<{
    columns: string[];
    rows: Record<string, unknown>[];
    rowCount: number;
    executionTimeMs: number;
  } | null>(null);

  const [copiedStatus, setCopiedStatus] = useState<string | null>(null);

  // Load raw SQL from API
  useEffect(() => {
    fetch('/api/db/schema-raw')
      .then(res => res.json())
      .then(data => {
        setSchemaSql(data.schemaSql || '');
        setSeedSql(data.seedSql || '');
        setQueriesSql(data.queriesSql || '');
      })
      .catch(err => console.error('Error fetching SQL scripts:', err));

    // Auto-run first query
    runPredefinedQuery(FIVE_IA_QUERIES[0].id);
  }, []);

  const runPredefinedQuery = async (queryId: string) => {
    setIsRunningQuery(true);
    try {
      const res = await fetch('/api/db/run-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queryId }),
      });
      const data = await res.json();
      setQueryResults(data);
    } catch (err) {
      console.error('Error executing query:', err);
    } finally {
      setIsRunningQuery(false);
    }
  };

  const copyToClipboard = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStatus(key);
    setTimeout(() => setCopiedStatus(null), 2000);
  };

  const downloadFile = (filename: string, content: string) => {
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-8">
      {/* Title Banner */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
              <Database className="h-3.5 w-3.5" />
              Base de Dados PostgreSQL • Five IA por OTsUkY FiVe
            </div>
            <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold text-white">
              Arquitetura Relacional & Esquema Completo (16 Tabelas)
            </h2>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">
              Esquema de dados de nível de produção com restrições CHECK, tipos UUID v4, chaves estrangeiras com integridade referencial, índices de alta performance, triggers de imutabilidade e consultas analíticas de faturação e créditos.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => copyToClipboard('schema-all', schemaSql)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
            >
              {copiedStatus === 'schema-all' ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              <span>{copiedStatus === 'schema-all' ? 'Copiado!' : 'Copiar DDL SQL'}</span>
            </button>
            <button
              onClick={() => downloadFile('five_ia_postgresql_schema.sql', schemaSql)}
              className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors shadow-md shadow-amber-500/20"
            >
              <Download className="h-4 w-4" />
              <span>Baixar schema.sql</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-slate-800/80 pt-5">
          <div className="rounded-xl bg-slate-950/70 p-3 border border-slate-800">
            <span className="text-xs text-slate-400">Total de Tabelas</span>
            <div className="text-xl font-bold text-white mt-0.5">16 Tabelas</div>
          </div>
          <div className="rounded-xl bg-slate-950/70 p-3 border border-slate-800">
            <span className="text-xs text-slate-400">Restrições & Índices</span>
            <div className="text-xl font-bold text-amber-300 mt-0.5">38 Índices & Triggers</div>
          </div>
          <div className="rounded-xl bg-slate-950/70 p-3 border border-slate-800">
            <span className="text-xs text-slate-400">Bancos Nacionais</span>
            <div className="text-xl font-bold text-white mt-0.5">8 Bancos Angola</div>
          </div>
          <div className="rounded-xl bg-slate-950/70 p-3 border border-slate-800">
            <span className="text-xs text-slate-400">Consultas Analíticas</span>
            <div className="text-xl font-bold text-emerald-400 mt-0.5">8 Queries Prontas</div>
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex border-b border-slate-800 gap-2 sm:gap-6 text-sm font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('erd')}
          className={`flex items-center gap-2 pb-3 border-b-2 transition-all whitespace-nowrap ${
            activeSubTab === 'erd' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="h-4 w-4" />
          Diagrama de Relações (ERD Visual)
        </button>
        <button
          onClick={() => setActiveSubTab('queries')}
          className={`flex items-center gap-2 pb-3 border-b-2 transition-all whitespace-nowrap ${
            activeSubTab === 'queries' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Terminal className="h-4 w-4" />
          Executor de Consultas (8 Queries)
        </button>
        <button
          onClick={() => setActiveSubTab('tables')}
          className={`flex items-center gap-2 pb-3 border-b-2 transition-all whitespace-nowrap ${
            activeSubTab === 'tables' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Table className="h-4 w-4" />
          Dicionário de Dados & Tabelas
        </button>
        <button
          onClick={() => setActiveSubTab('scripts')}
          className={`flex items-center gap-2 pb-3 border-b-2 transition-all whitespace-nowrap ${
            activeSubTab === 'scripts' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <FileCode className="h-4 w-4" />
          Scripts SQL Completos
        </button>
      </div>

      {/* SUBTAB 1: INTERACTIVE ER DIAGRAM */}
      {activeSubTab === 'erd' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Mapa das 16 Tabelas e Relações Chave</h3>
              <p className="text-xs text-slate-400">Clique em qualquer tabela para inspecionar os campos, chaves primárias e estrangeiras</p>
            </div>
            <span className="text-xs text-amber-400 font-semibold">PostgreSQL Relational Architecture</span>
          </div>

          {/* Categorized ERD Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FIVE_IA_TABLES.map(table => {
              const isSelected = selectedTable.name === table.name;
              return (
                <div
                  key={table.name}
                  onClick={() => setSelectedTable(table)}
                  className={`group relative flex flex-col justify-between rounded-2xl border p-4.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-amber-500 bg-amber-500/10 shadow-xl shadow-amber-500/10 ring-1 ring-amber-500'
                      : 'border-slate-800 bg-slate-900/70 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Table className={`h-4 w-4 ${isSelected ? 'text-amber-400' : 'text-slate-400 group-hover:text-amber-400'}`} />
                        <h4 className="font-mono font-bold text-sm text-white group-hover:text-amber-300 transition-colors">
                          {table.name}
                        </h4>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                        {table.category}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                      {table.description}
                    </p>

                    {/* Column preview snippet */}
                    <div className="space-y-1 font-mono text-[11px] border-t border-slate-800/80 pt-2.5">
                      {table.columns.slice(0, 4).map(col => (
                        <div key={col.name} className="flex items-center justify-between text-slate-300">
                          <span className="flex items-center gap-1.5">
                            {col.isPk && <Key className="h-3 w-3 text-amber-400" />}
                            {col.isFk && <Link2 className="h-3 w-3 text-cyan-400" />}
                            <span className={col.isPk ? 'font-bold text-amber-300' : ''}>{col.name}</span>
                          </span>
                          <span className="text-[10px] text-slate-500">{col.type}</span>
                        </div>
                      ))}
                      {table.columns.length > 4 && (
                        <div className="text-[10px] text-slate-500 text-right pt-1">
                          + {table.columns.length - 4} outras colunas
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800/60 text-[10px] text-slate-400">
                    <span>{table.indexes.length} Índices</span>
                    <span className="text-amber-400 font-semibold group-hover:underline">Inspecionar Detalhes →</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Table Inspector Modal / Drawer */}
          {selectedTable && (
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <Table className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-mono text-lg font-bold text-white">{selectedTable.name}</h4>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-sans">
                        {selectedTable.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{selectedTable.description}</p>
                  </div>
                </div>

                <div className="text-xs text-slate-400 font-mono">
                  PostgreSQL Table DDL
                </div>
              </div>

              {/* Columns Table */}
              <div className="mt-5 overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-900 text-slate-400 text-[11px] uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Coluna</th>
                      <th className="py-2.5 px-3">Tipo PostgreSQL</th>
                      <th className="py-2.5 px-3">Atributos</th>
                      <th className="py-2.5 px-3">Padrão / FK</th>
                      <th className="py-2.5 px-3 font-sans">Descrição / Regra</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {selectedTable.columns.map(col => (
                      <tr key={col.name} className="hover:bg-slate-900/50">
                        <td className="py-2.5 px-3 font-bold text-white flex items-center gap-1.5">
                          {col.isPk && <span className="text-[10px] px-1 py-0.2 rounded bg-amber-500 text-slate-950 font-sans font-bold">PK</span>}
                          {col.isFk && <span className="text-[10px] px-1 py-0.2 rounded bg-cyan-600 text-white font-sans font-bold">FK</span>}
                          <span className={col.isPk ? 'text-amber-300' : ''}>{col.name}</span>
                        </td>
                        <td className="py-2.5 px-3 text-cyan-400">{col.type}</td>
                        <td className="py-2.5 px-3 text-slate-300">
                          {col.nullable ? 'NULL' : 'NOT NULL'}
                          {col.isUnique && ' UNIQUE'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400">
                          {col.isFk ? `→ ${col.fkTarget}` : col.defaultValue || '—'}
                        </td>
                        <td className="py-2.5 px-3 font-sans text-slate-300 text-[11px]">
                          {col.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Constraints and Indexes */}
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-800 pt-4 text-xs">
                <div>
                  <span className="font-semibold text-slate-300 block mb-1.5">Índices de Performance:</span>
                  <div className="space-y-1 font-mono text-[11px] text-slate-400">
                    {selectedTable.indexes.map((idx, i) => (
                      <div key={i} className="rounded bg-slate-900 p-1.5 border border-slate-800">
                        {idx}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="font-semibold text-slate-300 block mb-1.5">Restrições (CHECK & TRIGGERS):</span>
                  <div className="space-y-1 font-mono text-[11px] text-slate-400">
                    {selectedTable.constraints.length > 0 ? (
                      selectedTable.constraints.map((c, i) => (
                        <div key={i} className="rounded bg-slate-900 p-1.5 border border-slate-800 text-amber-300/90">
                          {c}
                        </div>
                      ))
                    ) : (
                      <div className="text-slate-500 italic">Sem restrições adicionais</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: QUERY RUNNER (8 SPECIFIED QUERIES) */}
      {activeSubTab === 'queries' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-white">Executor Interativo das 8 Consultas SQL Requeridas</h3>
              <p className="text-xs text-slate-400">Executadas diretamente no motor PostgreSQL da Five IA com dados em tempo real</p>
            </div>

            <button
              onClick={() => runPredefinedQuery(selectedQuery.id)}
              disabled={isRunningQuery}
              className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors shadow-md shadow-amber-500/20 disabled:opacity-50"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>{isRunningQuery ? 'Executando...' : 'Executar Consulta Agora'}</span>
            </button>
          </div>

          {/* Queries Selector Carousel */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {FIVE_IA_QUERIES.map(q => {
              const isSelected = selectedQuery.id === q.id;
              return (
                <button
                  key={q.id}
                  onClick={() => {
                    setSelectedQuery(q);
                    runPredefinedQuery(q.id);
                  }}
                  className={`flex flex-col text-left rounded-xl border p-3 transition-all ${
                    isSelected
                      ? 'border-amber-500 bg-amber-500/15 text-white shadow-sm'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <span className="text-[10px] font-bold text-amber-400 uppercase">Consulta {q.number}</span>
                  <span className="font-semibold text-xs mt-1 line-clamp-1">{q.title}</span>
                </button>
              );
            })}
          </div>

          {/* Query Code Viewer */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-bold text-slate-200">{selectedQuery.title}</span>
              </div>
              <button
                onClick={() => copyToClipboard('query-sql', selectedQuery.sql)}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
              >
                {copiedStatus === 'query-sql' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedStatus === 'query-sql' ? 'Copiado' : 'Copiar SQL'}</span>
              </button>
            </div>

            <div className="p-4 bg-slate-950 text-xs font-mono text-slate-200 overflow-x-auto whitespace-pre leading-relaxed">
              {selectedQuery.sql}
            </div>

            <div className="border-t border-slate-800/80 bg-slate-900/40 px-4 py-2 text-xs text-slate-400">
              💡 <strong>Objetivo:</strong> {selectedQuery.description}
            </div>
          </div>

          {/* Results Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-white">Resultado da Execução:</span>
              {queryResults && (
                <span>
                  <strong>{queryResults.rowCount}</strong> linhas retornadas em{' '}
                  <strong className="text-amber-400">{queryResults.executionTimeMs} ms</strong>
                </span>
              )}
            </div>

            {queryResults && queryResults.rows.length > 0 ? (
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 shadow-lg">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[11px]">
                    <tr>
                      {queryResults.columns.map(col => (
                        <th key={col} className="py-3 px-4 whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {queryResults.rows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                        {queryResults.columns.map(col => (
                          <td key={col} className="py-2.5 px-4 text-slate-200 whitespace-nowrap">
                            {row[col] !== undefined && row[col] !== null ? String(row[col]) : '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-center text-xs text-slate-500">
                Sem registros retornados para os parâmetros desta consulta.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 3: DATA DICTIONARY */}
      {activeSubTab === 'tables' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Dicionário de Dados Completo (16 Tabelas)</h3>
            <span className="text-xs text-slate-400">PostgreSQL Schema Definition</span>
          </div>

          <div className="space-y-6">
            {FIVE_IA_TABLES.map(table => (
              <div key={table.name} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-bold text-amber-400">{table.name}</span>
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 font-semibold">
                      {table.category}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">{table.columns.length} colunas</span>
                </div>

                <p className="text-xs text-slate-300">{table.description}</p>

                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-900 text-slate-400 text-[10px] uppercase">
                      <tr>
                        <th className="py-2 px-3">Coluna</th>
                        <th className="py-2 px-3">Tipo</th>
                        <th className="py-2 px-3">Chave</th>
                        <th className="py-2 px-3 font-sans">Descrição</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {table.columns.map(col => (
                        <tr key={col.name}>
                          <td className="py-2 px-3 font-bold text-white">{col.name}</td>
                          <td className="py-2 px-3 text-cyan-400">{col.type}</td>
                          <td className="py-2 px-3">
                            {col.isPk ? <span className="text-amber-400 font-bold">PRIMARY KEY</span> : col.isFk ? <span className="text-cyan-400 font-bold">FK ({col.fkTarget})</span> : '—'}
                          </td>
                          <td className="py-2 px-3 font-sans text-slate-300 text-[11px]">{col.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 4: RAW SQL SCRIPTS */}
      {activeSubTab === 'scripts' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveScriptTab('schema')}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                  activeScriptTab === 'schema'
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                1. DDL Schema (schema.sql)
              </button>
              <button
                onClick={() => setActiveScriptTab('seed')}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                  activeScriptTab === 'seed'
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                2. Seed Inicial (seed.sql)
              </button>
              <button
                onClick={() => setActiveScriptTab('queries')}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                  activeScriptTab === 'queries'
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                3. Consultas (queries.sql)
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  const content = activeScriptTab === 'schema' ? schemaSql : activeScriptTab === 'seed' ? seedSql : queriesSql;
                  copyToClipboard(`script-${activeScriptTab}`, content);
                }}
                className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700"
              >
                {copiedStatus === `script-${activeScriptTab}` ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>Copiar</span>
              </button>
              <button
                onClick={() => {
                  const name = activeScriptTab === 'schema' ? 'five_ia_schema.sql' : activeScriptTab === 'seed' ? 'five_ia_seed.sql' : 'five_ia_queries.sql';
                  const content = activeScriptTab === 'schema' ? schemaSql : activeScriptTab === 'seed' ? seedSql : queriesSql;
                  downloadFile(name, content);
                }}
                className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Descarregar .sql</span>
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-200 max-h-[600px] overflow-y-auto whitespace-pre leading-relaxed">
            {activeScriptTab === 'schema' && schemaSql}
            {activeScriptTab === 'seed' && seedSql}
            {activeScriptTab === 'queries' && queriesSql}
          </div>
        </div>
      )}
    </div>
  );
};
