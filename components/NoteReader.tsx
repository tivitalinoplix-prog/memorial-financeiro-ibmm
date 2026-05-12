'use client';

import React, { useState, useCallback, useRef } from 'react';
import { X, Upload, Loader2, CheckCircle, AlertCircle, Brain, FileText, Sparkles, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/mock-data';
import { toast } from 'sonner';

interface ExtractedData {
  cnpj: string;
  razaoSocial: string;
  valor: number;
  data: string;
  descricao: string;
  centroCusto: string;
  metodoPagamento: string;
  confianca: number;
  itens: string[];
}

interface NoteReaderProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: ExtractedData) => void;
}

const CENTROS_CUSTO = [
  'Salário Pastoral', 'Custos dos Ministérios - Geral', 'Despesas Ministeriais - Geral',
  'Dízimos', 'Ofertas', 'Impostos', 'Serviços de Limpeza', 'Cooperação Denominacional',
  'Adoração e Música', 'Energia Elétrica', 'Manutenção Predial - Serviço',
  'Manutenção Predial - Material', 'Serviços Contábeis', 'Serviços Administrativos',
  'Aquisição de Equipamentos Eletrônicos', 'Obras e Construções - Serviço',
  'Aluguel de Imóveis', 'Material de Limpeza', 'Água e Esgoto', 'Internet',
  'Telefonia Móvel', 'Combustível', 'Segurança Patrimonial', 'Transportes e Fretes',
  'Literatura', 'Educação Cristã - Geral', 'Missões Nacionais', 'Missões Mundiais',
  'Ação Social - Cestas Básicas', 'Ação Social - Geral', 'Homenagens e Presentes',
  'Hospedagens', 'Tarifas Bancárias', 'Serviços Gráficos', 'Serviços de Cozinha',
  'Tecnologia e Informática', 'Jovens', 'Crianças'
];

const METODOS_PAGAMENTO = ['PIX', 'Boleto', 'Dinheiro', 'Cheque', 'Cartão de Crédito', 'Débito em Conta', 'Transferência'];

export function NoteReader({ isOpen, onClose, onConfirm }: NoteReaderProps) {
  const [step, setStep] = useState<'upload' | 'processing' | 'review' | 'error'>('upload');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setStep('upload');
    setImagePreview(null);
    setExtractedData(null);
    setErrorMsg('');
    setIsEditing(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const processWithGemini = async (base64Image: string, mimeType: string) => {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Chave da API Gemini não configurada');
    }

    const prompt = `Você é um assistente de classificação financeira de uma igreja batista.

Analise esta nota fiscal/comprovante e extraia as seguintes informações em formato JSON:

{
  "cnpj": "CNPJ do fornecedor (apenas números, com pontuação XX.XXX.XXX/XXXX-XX)",
  "razaoSocial": "Nome/Razão Social do fornecedor",
  "valor": 0.00,
  "data": "DD/MM/YYYY",
  "descricao": "Descrição resumida do serviço/produto",
  "centroCusto": "Uma das categorias: ${CENTROS_CUSTO.slice(0, 20).join(', ')}",
  "metodoPagamento": "PIX, Boleto, Dinheiro, Cheque, Cartão de Crédito, Débito em Conta ou Transferência",
  "confianca": 0.95,
  "itens": ["item 1", "item 2"]
}

REGRAS DE CLASSIFICAÇÃO:
- Serviços de limpeza, zeladoria, portaria → "Serviços de Limpeza"
- Aluguel, imobiliária → "Aluguel de Imóveis"
- Contador, contabilidade → "Serviços Contábeis"
- DARF, imposto, tributo → "Impostos"
- Energia, luz, eletricidade → "Energia Elétrica"
- Água, saneamento → "Água e Esgoto"
- Internet, telecom → "Internet"
- Instrumento musical, som → "Adoração e Música"
- Livro, material didático, EBD → "Literatura" ou "Educação Cristã - Geral"
- Construção, reforma, pedreiro → "Obras e Construções - Serviço"
- Equipamento eletrônico, computador → "Aquisição de Equipamentos Eletrônicos"
- Gráfica, impressão → "Serviços Gráficos"
- Salário, prebenda, pastor → "Salário Pastoral"
- Missão, missionário → "Missões Nacionais" ou "Missões Mundiais"
- Cesta básica, doação → "Ação Social - Cestas Básicas"

Se não conseguir identificar algum campo, use "N/I" para texto e 0 para número.
O campo "confianca" deve refletir sua certeza de 0 a 1.

Retorne APENAS o JSON, sem markdown, sem backticks, sem explicação.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Image
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 2048
          }
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Erro na API Gemini: ${response.status} — ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) throw new Error('Resposta vazia da API');

    // Clean the response (remove markdown code blocks if present)
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleanText) as ExtractedData;
  };

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast.error('Formato não suportado. Use imagem ou PDF.');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setImagePreview(dataUrl);
      setStep('processing');

      try {
        const base64 = dataUrl.split(',')[1];
        const mimeType = file.type;
        const extracted = await processWithGemini(base64, mimeType);
        setExtractedData(extracted);
        setStep('review');
        toast.success('Nota fiscal lida com sucesso!', {
          description: `Confiança: ${Math.round((extracted.confianca || 0.8) * 100)}%`
        });
      } catch (err: any) {
        console.error('Gemini Error:', err);
        setErrorMsg(err.message || 'Erro ao processar nota fiscal');
        setStep('error');
        toast.error('Erro ao processar nota');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, []);

  const handleInputChange = (field: keyof ExtractedData, value: string | number) => {
    if (!extractedData) return;
    setExtractedData({ ...extractedData, [field]: value });
  };

  const handleConfirm = () => {
    if (!extractedData) return;
    onConfirm(extractedData);
    toast.success('Nota integrada com sucesso!', {
      description: `${extractedData.razaoSocial} — ${formatCurrency(extractedData.valor)}`
    });
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={handleClose} />
      <div className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[720px] sm:max-h-[90vh] bg-background border border-border z-50 flex flex-col overflow-hidden animate-slide-up">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary/10 flex items-center justify-center">
              <Brain className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-[13px] font-bold text-text-primary">Leitura Inteligente de Nota Fiscal</h2>
              <p className="text-[10px] text-text-ghost">Gemini Vision AI • Classificação automática</p>
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
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-border hover:border-primary p-12 text-center transition-all cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />
              <Upload className="w-10 h-10 text-text-ghost group-hover:text-primary mx-auto mb-4 transition-colors" />
              <h3 className="text-[14px] font-bold text-text-primary mb-2">Arraste a nota fiscal aqui</h3>
              <p className="text-[11px] text-text-muted mb-4">ou clique para selecionar arquivo</p>
              <div className="flex items-center justify-center gap-4 text-[9px] text-text-ghost">
                <span>📷 JPG / PNG</span>
                <span>📄 PDF</span>
                <span>🔍 Até 10MB</span>
              </div>
            </div>
          )}

          {/* Step: Processing */}
          {step === 'processing' && (
            <div className="text-center py-12">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 border-2 border-primary/20 animate-ping" />
                <div className="absolute inset-2 border-2 border-primary/40 animate-pulse" />
                <div className="absolute inset-4 bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-primary animate-pulse" />
                </div>
              </div>
              <h3 className="text-[14px] font-bold text-text-primary mb-2">Gemini Vision processando...</h3>
              <p className="text-[11px] text-text-muted">Extraindo CNPJ, valor, data e classificando centro de custo</p>
              <div className="mt-6 flex items-center justify-center gap-3 text-[10px] text-text-ghost">
                <Loader2 className="w-3 h-3 animate-spin text-primary" />
                <span>Normalmente leva 3-8 segundos</span>
              </div>
            </div>
          )}

          {/* Step: Error */}
          {step === 'error' && (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
              <h3 className="text-[14px] font-bold text-text-primary mb-2">Erro na Extração</h3>
              <p className="text-[11px] text-rose-400 mb-6 max-w-md mx-auto">{errorMsg}</p>
              <button
                onClick={resetState}
                className="bg-primary text-white px-6 py-2.5 text-[12px] font-bold hover:bg-primary-dark transition-colors"
              >
                Tentar Novamente
              </button>
            </div>
          )}

          {/* Step: Review */}
          {step === 'review' && extractedData && (
            <div className="space-y-4">
              {/* Confidence Bar */}
              <div className="flex items-center gap-3 p-3 bg-surface border border-border">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-text-primary uppercase tracking-[0.05em]">Confiança da IA</span>
                    <span className="text-[11px] font-bold font-mono text-emerald-400">{Math.round((extractedData.confianca || 0.8) * 100)}%</span>
                  </div>
                  <div className="h-1.5 bg-background w-full">
                    <div 
                      className="h-full bg-emerald-500 transition-all" 
                      style={{ width: `${(extractedData.confianca || 0.8) * 100}%` }} 
                    />
                  </div>
                </div>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={cn(
                    "p-1.5 transition-colors",
                    isEditing ? "text-primary bg-primary/10" : "text-text-ghost hover:text-text-primary hover:bg-surface"
                  )}
                  title="Editar campos"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Preview + Data Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Image preview */}
                {imagePreview && (
                  <div className="border border-border overflow-hidden bg-surface">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imagePreview} alt="Nota Fiscal" className="w-full h-auto max-h-[300px] object-contain" />
                  </div>
                )}

                {/* Extracted Fields */}
                <div className="space-y-3">
                  <Field label="Fornecedor" value={extractedData.razaoSocial} editable={isEditing} onChange={(v) => handleInputChange('razaoSocial', v)} />
                  <Field label="CNPJ" value={extractedData.cnpj} editable={isEditing} onChange={(v) => handleInputChange('cnpj', v)} mono />
                  <Field label="Valor" value={formatCurrency(extractedData.valor)} editable={isEditing} onChange={(v) => handleInputChange('valor', parseFloat(v.replace(/[^\d.,]/g, '').replace(',', '.')) || 0)} highlight />
                  <Field label="Data" value={extractedData.data} editable={isEditing} onChange={(v) => handleInputChange('data', v)} mono />
                  <Field label="Descrição" value={extractedData.descricao} editable={isEditing} onChange={(v) => handleInputChange('descricao', v)} />

                  {/* Centro de Custo (Select) */}
                  <div>
                    <label className="text-[9px] text-text-ghost font-bold uppercase tracking-[0.08em] mb-1 block">Centro de Custo</label>
                    {isEditing ? (
                      <select
                        value={extractedData.centroCusto}
                        onChange={(e) => handleInputChange('centroCusto', e.target.value)}
                        className="w-full bg-surface border border-primary/30 text-text-primary text-[11px] px-3 py-2 focus:outline-none focus:border-primary"
                      >
                        {CENTROS_CUSTO.map(cc => (
                          <option key={cc} value={cc}>{cc}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="text-[12px] font-semibold text-primary bg-primary/5 border border-primary/20 px-3 py-2">
                        {extractedData.centroCusto}
                      </div>
                    )}
                  </div>

                  {/* Método de Pagamento (Select) */}
                  <div>
                    <label className="text-[9px] text-text-ghost font-bold uppercase tracking-[0.08em] mb-1 block">Método de Pagamento</label>
                    {isEditing ? (
                      <select
                        value={extractedData.metodoPagamento}
                        onChange={(e) => handleInputChange('metodoPagamento', e.target.value)}
                        className="w-full bg-surface border border-primary/30 text-text-primary text-[11px] px-3 py-2 focus:outline-none focus:border-primary"
                      >
                        {METODOS_PAGAMENTO.map(mp => (
                          <option key={mp} value={mp}>{mp}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="text-[11px] text-text-muted border border-border px-3 py-2 bg-surface">{extractedData.metodoPagamento}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Items */}
              {extractedData.itens && extractedData.itens.length > 0 && (
                <div className="p-3 bg-surface border border-border">
                  <h4 className="text-[9px] font-bold text-text-ghost uppercase tracking-[0.08em] mb-2">Itens Identificados</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {extractedData.itens.map((item, i) => (
                      <span key={i} className="text-[10px] bg-background border border-border px-2 py-1 text-text-muted">{item}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {step === 'review' && (
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-border bg-card">
            <button
              onClick={resetState}
              className="px-4 py-2.5 text-[11px] font-bold text-text-muted border border-border hover:bg-surface transition-colors"
            >
              Nova Nota
            </button>
            <div className="flex gap-2">
              <button
                onClick={handleClose}
                className="px-4 py-2.5 text-[11px] font-bold text-text-muted border border-border hover:bg-surface transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                className="px-6 py-2.5 text-[11px] font-bold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors flex items-center gap-2"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Confirmar e Integrar
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/* ── Reusable Field Component ── */
function Field({ label, value, editable, onChange, mono, highlight }: {
  label: string;
  value: string;
  editable?: boolean;
  onChange?: (v: string) => void;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div>
      <label className="text-[9px] text-text-ghost font-bold uppercase tracking-[0.08em] mb-1 block">{label}</label>
      {editable ? (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className={cn(
            "w-full bg-surface border border-primary/30 text-text-primary text-[11px] px-3 py-2 focus:outline-none focus:border-primary",
            mono && "font-mono"
          )}
        />
      ) : (
        <div className={cn(
          "text-[11px] border border-border px-3 py-2 bg-surface",
          mono ? "font-mono text-text-muted" : "text-text-primary",
          highlight && "font-bold text-emerald-400 text-[13px]"
        )}>
          {value || 'N/I'}
        </div>
      )}
    </div>
  );
}
