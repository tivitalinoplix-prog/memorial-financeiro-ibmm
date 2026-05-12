'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Upload, FileText, CheckCircle2, ShieldAlert, Loader2, X } from 'lucide-react';

export function ImportModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [step, setStep] = useState<'upload' | 'analyzing' | 'form'>('upload');
  
  const [formData, setFormData] = useState({
    supplier: 'Supermercado Central',
    cnpj: '12.345.678/0001-90',
    date: '10/04/2026',
    value: 'R$ 450,00',
    costCenter: 'Cozinha',
    type: 'NF Produto',
    area: 'Departamento',
    observation: 'Compra de suprimentos para o jantar de casais'
  });

  if (!isOpen) return null;

  const handleFileUpload = (e: React.DragEvent | React.ChangeEvent) => {
    e.preventDefault();
    setStep('analyzing');
    setTimeout(() => {
      setStep('form');
    }, 2500);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const resetAndClose = () => {
    setStep('upload');
    onClose();
  };

  const inputClass = "w-full bg-surface border border-border px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors font-sans placeholder:text-text-muted";
  const labelClass = "block text-[10px] font-bold text-text-muted uppercase tracking-[0.08em] mb-1.5";

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-[2px] z-[1000] flex items-center justify-center p-4">
      <div className="bg-card border border-border w-full max-w-[580px] flex flex-col max-h-[90vh] animate-slide-up">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
          <div>
            <div className="text-base font-bold text-text-primary tracking-tight flex items-center gap-2">
              <Upload className="w-4 h-4 text-primary" />
              Upload de Nota Fiscal
            </div>
            <div className="text-[11px] text-text-muted mt-0.5">Extração automática via Gemini AI</div>
          </div>
          <button onClick={resetAndClose} className="p-2 text-text-muted hover:text-text-primary hover:bg-surface transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1">
          {step === 'upload' && (
            <div 
              className="border-2 border-dashed border-border hover:border-primary/50 p-12 text-center cursor-pointer transition-colors bg-surface group"
              onDrop={handleFileUpload}
              onDragOver={handleDragOver}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <input type="file" id="file-upload" className="hidden" onChange={handleFileUpload} accept="image/*,.pdf" />
              <div className="w-14 h-14 bg-card border border-border flex items-center justify-center mx-auto mb-4 group-hover:border-primary/50 transition-colors">
                <FileText className="w-7 h-7 text-primary" />
              </div>
              <div className="text-sm text-text-primary font-semibold mb-1">Arraste a nota fiscal ou clique aqui</div>
              <div className="text-[11px] text-text-muted">PDF, JPG, PNG — máx. 5MB</div>
            </div>
          )}

          {step === 'analyzing' && (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
              <div className="text-sm font-semibold text-text-primary mb-1">Gemini está analisando...</div>
              <div className="text-[11px] text-text-muted">Extraindo fornecedor, valores e classificação</div>
            </div>
          )}

          {step === 'form' && (
            <div className="animate-slide-up">
              {/* Success Banner */}
              <div className="bg-emerald-500/10 text-emerald-500 px-4 py-3 mb-5 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-bold">Extração concluída</div>
                  <div className="text-[11px] mt-0.5 opacity-80">Confiança: <span className="font-bold font-mono">94%</span></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className={labelClass}>Fornecedor</label>
                  <input type="text" value={formData.supplier} onChange={(e) => setFormData({...formData, supplier: e.target.value})} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>CNPJ</label>
                  <input type="text" value={formData.cnpj} onChange={(e) => setFormData({...formData, cnpj: e.target.value})} className={cn(inputClass, "font-mono")} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className={labelClass}>Data de Emissão</label>
                  <input type="text" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className={inputClass} />
                </div>
                <div>
                  <label className={cn(labelClass, "flex justify-between items-center")}>
                    Valor 
                    <span className="flex items-center gap-1 text-[9px] text-amber-500">
                      <ShieldAlert className="w-3 h-3" /> Validar
                    </span>
                  </label>
                  <input type="text" value={formData.value} onChange={(e) => setFormData({...formData, value: e.target.value})}
                    className={cn(inputClass, "bg-amber-500/5 border-amber-500/30 text-amber-400 font-bold focus:border-amber-500")}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className={labelClass}>Centro de Custo</label>
                  <select value={formData.costCenter} onChange={(e) => setFormData({...formData, costCenter: e.target.value})} className={cn(inputClass, "appearance-none cursor-pointer")}>
                    <option>Patrimônio</option><option>Missões</option><option>Administração</option>
                    <option>Adolescentes</option><option>Mulheres</option><option>Comunicação</option>
                    <option>Cozinha</option><option>Som</option><option>Fotografia</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Tipo de Documento</label>
                  <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className={cn(inputClass, "appearance-none cursor-pointer")}>
                    <option>NF Serviço</option><option>NF Produto</option><option>Recibo</option>
                    <option>Dízimo</option><option>Oferta</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className={labelClass}>Área</label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="area" checked={formData.area === 'Ministério'} onChange={() => setFormData({...formData, area: 'Ministério'})} className="accent-primary" />
                    <span className="text-sm text-text-secondary">Ministério</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="area" checked={formData.area === 'Departamento'} onChange={() => setFormData({...formData, area: 'Departamento'})} className="accent-primary" />
                    <span className="text-sm text-text-secondary">Departamento</span>
                  </label>
                </div>
              </div>

              <div>
                <label className={labelClass}>Observações</label>
                <textarea value={formData.observation} onChange={(e) => setFormData({...formData, observation: e.target.value})}
                  className={cn(inputClass, "min-h-[70px] resize-none")}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {step === 'form' && (
          <div className="p-5 border-t border-border bg-surface shrink-0 flex gap-3">
            <button onClick={resetAndClose}
              className="flex-1 py-2.5 border border-border bg-transparent text-text-primary text-sm font-semibold hover:bg-card transition-colors">
              Salvar Revisão
            </button>
            <button onClick={resetAndClose}
              className="flex-1 py-2.5 bg-primary text-white text-sm font-bold hover:bg-primary-dark transition-colors">
              Aprovar & Integrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
