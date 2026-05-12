'use client';

import React, { useState, useCallback, useRef } from 'react';
import { X, Upload, FileSpreadsheet, CheckCircle, AlertTriangle, Loader2, Download, ArrowRight, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/mock-data';
import { toast } from 'sonner';

interface ImportedRow {
  id: number;
  data: string;
  descricao: string;
  valor: number;
  tipo: string;
  membro: string;
  categoria: string;
  selected: boolean;
}

interface ComunionImporterProps {
  isOpen: boolean;
  onClose: () => void;
}

// Mapping Comunión/Eclese columns → Memorial schema
const COLUMN_MAPPINGS: Record<string, string[]> = {
  data: ['data', 'date', 'dt_lancamento', 'dt_lanc', 'data_contribuicao', 'data_lancamento'],
  descricao: ['descricao', 'description', 'historico', 'observacao', 'obs', 'memo'],
  valor: ['valor', 'value', 'amount', 'vl_lancamento', 'vl_lanc', 'total'],
  tipo: ['tipo', 'type', 'tp_lancamento', 'natureza', 'category', 'plano_contas'],
  membro: ['membro', 'member', 'nome', 'contribuinte', 'name', 'nm_membro'],
};

// Map Eclese categories → Memorial categories
const CATEGORY_MAP: Record<string, string> = {
  'dizimo': 'Dízimos',
  'dízimo': 'Dízimos',
  'oferta': 'Ofertas',
  'missões': 'Missões Nacionais',
  'missoes': 'Missões Nacionais',
  'campanha': 'Ofertas',
  'contribuição': 'Ofertas',
  'contribuicao': 'Ofertas',
  'aluguel': 'Aluguel de Imóveis',
  'salario': 'Salário Pastoral',
  'salário': 'Salário Pastoral',
  'prebenda': 'Salário Pastoral',
  'energia': 'Energia Elétrica',
  'água': 'Água e Esgoto',
  'agua': 'Água e Esgoto',
  'internet': 'Internet',
  'limpeza': 'Serviços de Limpeza',
  'imposto': 'Impostos',
  'darf': 'Impostos',
  'cooperação': 'Cooperação Denominacional',
  'cooperacao': 'Cooperação Denominacional',
};

function mapCategory(raw: string): string {
  const lower = raw.toLowerCase().trim();
  for (const [key, val] of Object.entries(CATEGORY_MAP)) {
    if (lower.includes(key)) return val;
  }
  return raw || 'Outros';
}

function findColumn(headers: string[], mapping: string[]): number {
  for (const m of mapping) {
    const idx = headers.findIndex(h => h.toLowerCase().trim().replace(/\s+/g, '_') === m);
    if (idx >= 0) return idx;
  }
  // Fuzzy match
  for (const m of mapping) {
    const idx = headers.findIndex(h => h.toLowerCase().trim().includes(m));
    if (idx >= 0) return idx;
  }
  return -1;
}

export function ComunionImporter({ isOpen, onClose }: ComunionImporterProps) {
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'done'>('upload');
  const [rows, setRows] = useState<ImportedRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawData, setRawData] = useState<string[][]>([]);
  const [columnMap, setColumnMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, imported: 0, skipped: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setStep('upload');
    setRows([]);
    setHeaders([]);
    setRawData([]);
    setColumnMap({});
    setLoading(false);
    setStats({ total: 0, imported: 0, skipped: 0 });
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const parseCSV = (text: string): string[][] => {
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    return lines.map(line => {
      // Handle both comma and semicolon separators (Brazilian CSVs use ;)
      const sep = line.includes(';') ? ';' : ',';
      return line.split(sep).map(cell => cell.replace(/^["']|["']$/g, '').trim());
    });
  };

  const handleFileSelect = async (file: File) => {
    setLoading(true);
    try {
      let data: string[][] = [];

      if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
        const text = await file.text();
        data = parseCSV(text);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const XLSX = await import('xlsx');
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json<string[]>(firstSheet, { header: 1 });
        data = jsonData as string[][];
      } else {
        toast.error('Formato não suportado. Use CSV ou Excel.');
        return;
      }

      if (data.length < 2) {
        toast.error('Arquivo vazio ou com apenas cabeçalho');
        return;
      }

      const fileHeaders = data[0].map(h => String(h || ''));
      const fileRows = data.slice(1);

      setHeaders(fileHeaders);
      setRawData(fileRows);

      // Auto-map columns
      const autoMap: Record<string, number> = {};
      for (const [field, aliases] of Object.entries(COLUMN_MAPPINGS)) {
        const idx = findColumn(fileHeaders, aliases);
        if (idx >= 0) autoMap[field] = idx;
      }
      setColumnMap(autoMap);

      // If most columns are mapped, skip to preview
      const mappedCount = Object.keys(autoMap).length;
      if (mappedCount >= 3) {
        processRows(fileRows, fileHeaders, autoMap);
        setStep('preview');
        toast.success(`${fileRows.length} linhas encontradas • ${mappedCount} colunas mapeadas`);
      } else {
        setStep('mapping');
        toast.info('Verifique o mapeamento de colunas');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao processar arquivo: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const processRows = (dataRows: string[][], hdrs: string[], map: Record<string, number>) => {
    const processed: ImportedRow[] = dataRows.map((row, i) => {
      const rawDate = map.data >= 0 ? String(row[map.data] || '') : '';
      const rawVal = map.valor >= 0 ? String(row[map.valor] || '0') : '0';
      const rawTipo = map.tipo >= 0 ? String(row[map.tipo] || '') : '';

      // Parse value (handle Brazilian format: 1.234,56)
      const valor = parseFloat(rawVal.replace(/\./g, '').replace(',', '.')) || 0;

      return {
        id: i + 1,
        data: rawDate,
        descricao: map.descricao >= 0 ? String(row[map.descricao] || '') : '',
        valor,
        tipo: mapCategory(rawTipo),
        membro: map.membro >= 0 ? String(row[map.membro] || 'N/I') : 'N/I',
        categoria: mapCategory(rawTipo),
        selected: valor > 0,
      };
    }).filter(r => r.data || r.valor > 0);

    setRows(processed);
  };

  const handleConfirmMapping = () => {
    processRows(rawData, headers, columnMap);
    setStep('preview');
  };

  const toggleAll = (checked: boolean) => {
    setRows(prev => prev.map(r => ({ ...r, selected: checked })));
  };

  const handleImport = () => {
    const selected = rows.filter(r => r.selected);
    setStats({ total: rows.length, imported: selected.length, skipped: rows.length - selected.length });
    setStep('done');
    toast.success(`${selected.length} lançamentos importados com sucesso!`);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, []);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={handleClose} />
      <div className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[800px] sm:max-h-[90vh] bg-background border border-border z-50 flex flex-col overflow-hidden animate-slide-up">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-violet-500/10 flex items-center justify-center">
              <RefreshCw className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <h2 className="text-[13px] font-bold text-text-primary">Importar do Comunión / Eclese</h2>
              <p className="text-[10px] text-text-ghost">Sincronizar dados financeiros da igreja</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 text-text-ghost hover:text-text-primary transition-colors hover:bg-surface">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-5">
          
          {/* Step: Upload */}
          {step === 'upload' && (
            <div className="space-y-6">
              <div className="p-4 bg-violet-500/5 border border-violet-500/20">
                <h3 className="text-[12px] font-bold text-violet-400 mb-2">Como exportar do Comunión/Eclese:</h3>
                <ol className="text-[11px] text-text-muted space-y-1.5 list-decimal list-inside">
                  <li>Acesse <span className="font-mono text-text-primary">eclese.com</span> → Financeiro → Relatórios</li>
                  <li>Selecione o período desejado</li>
                  <li>Clique em &ldquo;Exportar&rdquo; → CSV ou Excel</li>
                  <li>Faça upload do arquivo aqui</li>
                </ol>
              </div>

              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="border-2 border-dashed border-border hover:border-violet-400 p-12 text-center transition-all cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls,.txt"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                />
                {loading ? (
                  <Loader2 className="w-10 h-10 text-violet-400 mx-auto mb-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-10 h-10 text-text-ghost group-hover:text-violet-400 mx-auto mb-4 transition-colors" />
                )}
                <h3 className="text-[14px] font-bold text-text-primary mb-2">
                  {loading ? 'Processando...' : 'Arraste o arquivo aqui'}
                </h3>
                <p className="text-[11px] text-text-muted">CSV, Excel (.xlsx) ou texto separado por vírgula/ponto-e-vírgula</p>
              </div>
            </div>
          )}

          {/* Step: Mapping */}
          {step === 'mapping' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-500/5 border border-amber-500/20 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <p className="text-[11px] text-text-muted">Verifique o mapeamento abaixo. Associe cada campo do Memorial a uma coluna do arquivo importado.</p>
              </div>

              <div className="space-y-3">
                {Object.entries(COLUMN_MAPPINGS).map(([field]) => (
                  <div key={field} className="flex items-center gap-3">
                    <span className="text-[11px] font-bold text-text-primary uppercase w-24 shrink-0">{field}</span>
                    <ArrowRight className="w-3 h-3 text-text-ghost shrink-0" />
                    <select
                      value={columnMap[field] ?? -1}
                      onChange={(e) => setColumnMap(prev => ({ ...prev, [field]: parseInt(e.target.value) }))}
                      className="flex-1 bg-surface border border-border text-text-primary text-[11px] px-3 py-2 focus:outline-none focus:border-primary"
                    >
                      <option value={-1}>— Não mapeado —</option>
                      {headers.map((h, i) => (
                        <option key={i} value={i}>{h}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <button
                onClick={handleConfirmMapping}
                className="w-full bg-violet-500 text-white py-2.5 text-[12px] font-bold hover:bg-violet-600 transition-colors"
              >
                Confirmar Mapeamento
              </button>
            </div>
          )}

          {/* Step: Preview */}
          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-text-muted">
                  <strong className="text-text-primary">{rows.filter(r => r.selected).length}</strong> de {rows.length} selecionados
                </span>
                <div className="flex gap-2">
                  <button onClick={() => toggleAll(true)} className="text-[10px] text-primary hover:underline">Selecionar todos</button>
                  <button onClick={() => toggleAll(false)} className="text-[10px] text-text-ghost hover:underline">Desmarcar todos</button>
                </div>
              </div>

              <div className="border border-border overflow-hidden max-h-[50vh] overflow-auto">
                <table className="w-full text-left brutal-table">
                  <thead className="bg-background sticky top-0 z-10">
                    <tr>
                      <th className="w-8">✓</th>
                      <th>Data</th>
                      <th>Membro</th>
                      <th>Categoria</th>
                      <th className="text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 100).map(row => (
                      <tr
                        key={row.id}
                        className={cn(
                          "hover:bg-primary/[0.03] cursor-pointer transition-colors",
                          !row.selected && "opacity-40"
                        )}
                        onClick={() => setRows(prev => prev.map(r => r.id === row.id ? { ...r, selected: !r.selected } : r))}
                      >
                        <td>
                          <div className={cn(
                            "w-4 h-4 border flex items-center justify-center transition-colors",
                            row.selected ? "bg-primary/20 border-primary" : "border-border"
                          )}>
                            {row.selected && <CheckCircle className="w-3 h-3 text-primary" />}
                          </div>
                        </td>
                        <td className="font-mono text-[11px] text-text-muted">{row.data}</td>
                        <td className="text-[11px] text-text-primary max-w-[150px] truncate">{row.membro}</td>
                        <td className="text-[10px] text-text-muted">{row.categoria}</td>
                        <td className="text-right font-mono text-[12px] font-bold text-emerald-400">{formatCurrency(row.valor)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rows.length > 100 && (
                <p className="text-[10px] text-text-ghost text-center">Mostrando 100 de {rows.length} linhas</p>
              )}
            </div>
          )}

          {/* Step: Done */}
          {step === 'done' && (
            <div className="text-center py-12">
              <CheckCircle className="w-14 h-14 text-emerald-400 mx-auto mb-4" />
              <h3 className="text-[16px] font-bold text-text-primary mb-2">Importação Concluída!</h3>
              <p className="text-[12px] text-text-muted mb-6">Dados do Comunión sincronizados com o Memorial</p>
              
              <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto mb-8">
                <div className="p-3 bg-surface border border-border text-center">
                  <div className="text-[18px] font-bold text-text-primary font-mono">{stats.total}</div>
                  <div className="text-[9px] text-text-ghost uppercase">Total</div>
                </div>
                <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 text-center">
                  <div className="text-[18px] font-bold text-emerald-400 font-mono">{stats.imported}</div>
                  <div className="text-[9px] text-emerald-400/60 uppercase">Importados</div>
                </div>
                <div className="p-3 bg-surface border border-border text-center">
                  <div className="text-[18px] font-bold text-text-ghost font-mono">{stats.skipped}</div>
                  <div className="text-[9px] text-text-ghost uppercase">Ignorados</div>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="bg-primary text-white px-8 py-2.5 text-[12px] font-bold hover:bg-primary-dark transition-colors"
              >
                Fechar
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'preview' && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-border bg-card">
            <button
              onClick={resetState}
              className="px-4 py-2.5 text-[11px] font-bold text-text-muted border border-border hover:bg-surface transition-colors"
            >
              Voltar
            </button>
            <button
              onClick={handleImport}
              disabled={rows.filter(r => r.selected).length === 0}
              className="px-6 py-2.5 text-[11px] font-bold bg-violet-500 text-white hover:bg-violet-600 transition-colors flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Download className="w-3.5 h-3.5" />
              Importar {rows.filter(r => r.selected).length} Lançamentos
            </button>
          </div>
        )}
      </div>
    </>
  );
}
