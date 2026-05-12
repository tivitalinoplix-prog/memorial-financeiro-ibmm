'use client';

import React, { useRef, useState } from 'react';
import { Download, FileSpreadsheet, Camera, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ExportToolbarProps {
  containerId: string;
  filename: string;
  title?: string;
  data?: Record<string, unknown>[];
  columns?: { key: string; label: string }[];
  className?: string;
}

export function ExportToolbar({ containerId, filename, title, data, columns, className }: ExportToolbarProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleScreenshot = async () => {
    setLoading('png');
    try {
      const html2canvas = (await import('html2canvas')).default;
      const element = document.getElementById(containerId);
      if (!element) { toast.error('Elemento não encontrado'); return; }

      const canvas = await html2canvas(element, {
        backgroundColor: '#09090b',
        scale: 2,
        logging: false,
        useCORS: true,
      });

      const link = document.createElement('a');
      link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('Screenshot salvo com sucesso!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao capturar tela');
    } finally {
      setLoading(null);
    }
  };

  const handlePDF = async () => {
    setLoading('pdf');
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const element = document.getElementById(containerId);
      if (!element) { toast.error('Elemento não encontrado'); return; }

      const canvas = await html2canvas(element, {
        backgroundColor: '#09090b',
        scale: 2,
        logging: false,
        useCORS: true,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'mm',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Header
      pdf.setFillColor(9, 9, 11);
      pdf.rect(0, 0, pdfWidth, 22, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('IGREJA BATISTA MEMORIAL', 10, 10);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(160, 160, 160);
      pdf.text(title || filename, 10, 16);
      pdf.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, pdfWidth - 10, 16, { align: 'right' });

      // Chart image
      const imgWidth = pdfWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const maxImgHeight = pdfHeight - 35;
      const finalHeight = Math.min(imgHeight, maxImgHeight);
      pdf.addImage(imgData, 'PNG', 10, 25, imgWidth, finalHeight);

      // Footer
      pdf.setFillColor(9, 9, 11);
      pdf.rect(0, pdfHeight - 10, pdfWidth, 10, 'F');
      pdf.setFontSize(7);
      pdf.setTextColor(100, 100, 100);
      pdf.text('Memorial Financeiro IBMM v4.1 — Eclésia Online', 10, pdfHeight - 4);
      pdf.text('Documento Confidencial', pdfWidth - 10, pdfHeight - 4, { align: 'right' });

      pdf.save(`${filename}_${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success('PDF gerado com sucesso!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao gerar PDF');
    } finally {
      setLoading(null);
    }
  };

  const handleExcel = async () => {
    setLoading('xlsx');
    try {
      const XLSX = await import('xlsx');

      let exportData = data;

      if (!exportData || exportData.length === 0) {
        // Try to extract data from HTML table
        const element = document.getElementById(containerId);
        if (!element) { toast.error('Dados não encontrados'); return; }

        const table = element.querySelector('table');
        if (table) {
          const wb = XLSX.utils.table_to_book(table, { sheet: title || 'Dados' });
          XLSX.writeFile(wb, `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`);
          toast.success('Excel gerado com sucesso!');
          return;
        }

        toast.error('Nenhum dado para exportar');
        return;
      }

      const ws = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      if (columns) {
        ws['!cols'] = columns.map(() => ({ wch: 20 }));
      }

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, title || 'Dados');
      XLSX.writeFile(wb, `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success('Excel gerado com sucesso!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao gerar Excel');
    } finally {
      setLoading(null);
    }
  };

  const buttons = [
    { id: 'pdf', icon: FileText, label: 'PDF', handler: handlePDF, color: 'text-rose-400 hover:bg-rose-500/10' },
    { id: 'xlsx', icon: FileSpreadsheet, label: 'Excel', handler: handleExcel, color: 'text-emerald-400 hover:bg-emerald-500/10' },
    { id: 'png', icon: Camera, label: 'Capturar', handler: handleScreenshot, color: 'text-violet-400 hover:bg-violet-500/10' },
  ];

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <span className="text-[9px] text-text-ghost font-bold uppercase tracking-[0.08em] mr-1 hidden sm:inline">Exportar</span>
      {buttons.map(btn => (
        <button
          key={btn.id}
          onClick={btn.handler}
          disabled={loading !== null}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1.5 text-[10px] font-medium border border-border transition-all",
            btn.color,
            loading === btn.id && "opacity-50 cursor-wait"
          )}
          title={btn.label}
        >
          {loading === btn.id ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <btn.icon className="w-3 h-3" />
          )}
          <span className="hidden lg:inline">{btn.label}</span>
        </button>
      ))}
    </div>
  );
}
