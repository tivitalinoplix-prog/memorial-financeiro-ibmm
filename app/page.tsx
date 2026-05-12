'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { LayoutDashboard, ReceiptText, Stethoscope, Workflow, Building2, HeartHandshake, Bell, Upload, AlertCircle, FileText, Database, Search, Activity, X, Menu } from 'lucide-react';
import { toast } from 'sonner';
import { LogoHeader } from '@/components/logo';
import { DashboardTab } from '@/components/tabs/DashboardTab';
import { InboxTab } from '@/components/tabs/InboxTab';
import { SurgeryTab } from '@/components/tabs/SurgeryTab';
import { PipelineTab } from '@/components/tabs/PipelineTab';
import { SuppliersTab } from '@/components/tabs/SuppliersTab';
import { PastoralTab } from '@/components/tabs/PastoralTab';
import { ExtratosTab } from '@/components/tabs/ExtratosTab';
import { ImportModal } from '@/components/ImportModal';
import { ThemeToggle } from '@/components/ThemeToggle';
import { cn } from '@/lib/utils';

export default function App() {
  const [activeTab, setActiveTab] = useState('exec');
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [demoMode, setDemoMode] = useState(true);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'error', text: 'Falha na integração: Eclésia offline', time: 'Há 5 min' },
    { id: 2, type: 'warning', text: '3 notas aguardam revisão humana', time: 'Há 25 min' },
    { id: 3, type: 'info', text: 'Processamento em lote concluído', time: 'Há 2 horas' },
  ]);

  const handleTestToast = () => {
    toast.success('Nota extraída com sucesso!', {
      description: 'Livraria Palavra Viva — R$ 4.230,50'
    });
  };

  const tabs = [
    { id: 'exec', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'extratos', label: 'Extratos', icon: Database },
    { id: 'inbox', label: 'Inbox', icon: ReceiptText, badge: 47 },
    { id: 'surg', label: 'Mesa de Cirurgia', icon: Stethoscope },
    { id: 'pipe', label: 'Integração', icon: Workflow },
    { id: 'supp', label: 'Fornecedores', icon: Building2 },
    { id: 'past', label: 'Visão Pastoral', icon: HeartHandshake },
  ];

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden selection:bg-primary/25">
      
      {/* ═══ Desktop Sidebar ═══ */}
      <aside className="hidden lg:flex flex-col w-56 bg-surface border-r border-border shrink-0">
        <div className="p-5 pb-4 border-b border-border">
          <LogoHeader />
        </div>
        
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto custom-scrollbar">
          {tabs.map((tab, index) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 text-[12px] font-medium transition-all group",
                  isActive 
                    ? "bg-primary-muted text-primary border-l-2 border-primary" 
                    : "text-text-muted hover:text-text-secondary hover:bg-background border-l-2 border-transparent"
                )}
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <div className="flex items-center gap-2.5">
                  <tab.icon className={cn("w-4 h-4 transition-colors", isActive ? "text-primary" : "text-text-ghost group-hover:text-text-muted")} />
                  {tab.label}
                </div>
                {tab.badge && (
                  <span className={cn(
                    "px-1.5 py-0.5 text-[9px] font-bold transition-colors",
                    isActive ? "bg-primary/20 text-primary" : "bg-rose/15 text-rose"
                  )}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer — Status & Version */}
        <div className="p-3 border-t border-border space-y-2">
          {/* Sync Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-positive opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-positive"></span>
              </span>
              <span className="text-[10px] text-text-muted">Eclésia Online</span>
            </div>
            <span className="text-[9px] text-positive bg-positive/10 px-1.5 py-0.5 font-mono font-bold">SYNC</span>
          </div>
          {/* Version */}
          <div className="flex items-center justify-between text-[10px] text-text-ghost">
            <span className="font-mono">v5.0</span>
            <span className="text-text-ghost/50">IBMM</span>
          </div>
        </div>
      </aside>

      {/* ═══ Main Area ═══ */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* ── Topbar ── */}
        <header className="h-14 border-b border-border bg-background flex items-center px-4 sm:px-5 shrink-0 gap-3 z-20">
          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-1.5 text-text-muted hover:text-text-primary transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Mobile Logo */}
          <div className="flex items-center gap-3 lg:hidden">
            <LogoHeader />
          </div>
          
          {/* Search Bar (Desktop) */}
          <div className="hidden lg:flex items-center flex-1 max-w-xl gap-3">
            <div className="relative flex-1 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-ghost group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Buscar nota, CNPJ, correlação..." 
                className="w-full bg-card border border-border text-text-primary text-[12px] pl-9 pr-12 py-2 focus:outline-none focus:border-primary focus-ring transition-colors placeholder:text-text-ghost"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <span className="text-[9px] bg-background border border-border text-text-ghost px-1.5 py-0.5 font-mono">⌘K</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-bold text-text-ghost uppercase tracking-[0.08em]">Período</span>
              <select className="bg-card border border-border text-text-secondary text-[11px] font-medium px-2 py-1.5 focus:outline-none focus:border-primary cursor-pointer appearance-none focus-ring">
                <option value="today">Hoje</option>
                <option value="7d">7 dias</option>
                <option value="30d">30 dias</option>
                <option value="month">Este Mês</option>
                <option value="year">Este Ano</option>
              </select>
            </div>
          </div>
          
          {/* Right Actions */}
          <div className="flex items-center ml-auto gap-2 shrink-0">
            {/* Demo Toggle */}
            <button 
              onClick={() => setDemoMode(!demoMode)}
              className={cn(
                "border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.05em] transition-all",
                demoMode 
                  ? "bg-primary-muted border-primary/30 text-primary" 
                  : "bg-card border-border text-text-ghost hover:text-text-muted"
              )}
            >
              <span className="flex items-center gap-1.5">
                <span className={cn("w-1.5 h-1.5 transition-colors", demoMode ? "bg-primary" : "bg-text-ghost")}></span>
                Demo {demoMode ? 'ON' : 'OFF'}
              </span>
            </button>
            
            <div className="h-4 w-px bg-border hidden sm:block"></div>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Notifications */}
            <div className="relative">
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative p-2 text-text-muted hover:text-text-primary transition-colors hover:bg-card"
              >
                <Bell className="w-4 h-4" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-3.5 h-3.5 text-[8px] font-bold flex items-center justify-center bg-rose text-white">
                    {notifications.length}
                  </span>
                )}
              </button>
              
              {isNotifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)}></div>
                  <div className="absolute right-0 top-full mt-1 w-80 bg-card border border-border z-50 overflow-hidden animate-slide-down">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                      <h3 className="text-[12px] font-bold text-text-primary uppercase tracking-[0.05em]">Notificações</h3>
                      <button 
                        onClick={() => { setNotifications([]); setIsNotifOpen(false); }}
                        className="text-[10px] text-primary hover:text-primary-light font-medium"
                      >
                        Limpar
                      </button>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length > 0 ? notifications.map(n => (
                        <div key={n.id} className="px-4 py-3 border-b border-border last:border-none hover:bg-surface cursor-pointer transition-colors flex gap-3">
                          <div className={cn(
                            "w-7 h-7 flex items-center justify-center shrink-0",
                            n.type === 'error' ? "bg-rose/10 text-rose" :
                            n.type === 'warning' ? "bg-amber/10 text-amber" : "bg-primary-muted text-primary"
                          )}>
                            {n.type === 'error' ? <AlertCircle className="w-3.5 h-3.5" /> :
                             n.type === 'warning' ? <Activity className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                          </div>
                          <div>
                            <p className="text-[11px] text-text-secondary leading-tight mb-0.5">{n.text}</p>
                            <p className="text-[9px] text-text-ghost font-mono">{n.time}</p>
                          </div>
                        </div>
                      )) : (
                        <div className="p-8 text-center text-text-muted text-[12px]">
                          Nenhuma notificação.
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Upload Button */}
            <button 
              onClick={() => { setIsImportOpen(true); handleTestToast(); }}
              className="bg-primary hover:bg-primary-dark text-white pl-3 pr-4 py-2 text-[11px] font-bold transition-all flex items-center gap-2 uppercase tracking-[0.03em] active:scale-[0.98]"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nova Nota</span>
            </button>
          </div>
        </header>

        {/* ── Tablet Nav ── */}
        <nav className="hidden sm:flex lg:hidden bg-background border-b border-border px-1 overflow-x-auto hide-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "flex items-center justify-center p-3 transition-colors border-b-2 whitespace-nowrap min-w-[50px] relative",
                activeTab === tab.id 
                  ? "border-primary text-primary bg-primary-muted" 
                  : "border-transparent text-text-ghost hover:text-text-muted"
              )}
              title={tab.label}
            >
              <tab.icon className="w-4 h-4" />
              {tab.badge && activeTab !== tab.id && (
                <span className="absolute top-1.5 right-1 w-1.5 h-1.5 bg-rose"></span>
              )}
            </button>
          ))}
        </nav>

        {/* ═══ Main Content ═══ */}
        <main className="flex-1 overflow-auto bg-background-alt relative">
          {!demoMode ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 animate-fade-in">
              <div className="relative w-44 h-28 md:w-56 md:h-36 mb-8 overflow-hidden border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src="https://i.postimg.cc/vHf6Nxx7/memorial.jpg" 
                  alt="Igreja Batista Memorial" 
                  className="w-full h-full object-cover grayscale opacity-60"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent"></div>
              </div>
              <h2 className="text-xl font-bold text-text-primary mb-2 tracking-tight" style={{ fontFamily: 'var(--font-geist-sans)' }}>Portal Administrativo</h2>
              <p className="text-text-muted max-w-sm mb-8 text-[13px] leading-relaxed">
                Ambiente de produção requer autenticação. Conecte suas credenciais para acessar operações reais.
              </p>
              <button className="bg-primary hover:bg-primary-dark text-white font-bold px-8 py-3 text-sm transition-all uppercase tracking-[0.05em] active:scale-[0.98]">
                Autenticar no Eclésia
              </button>
            </div>
          ) : (
            <div className="p-4 sm:p-5 lg:p-6 max-w-[1900px] mx-auto min-h-full">
              {activeTab === 'extratos' && <ExtratosTab />}
              {activeTab === 'exec' && <DashboardTab />}
              {activeTab === 'inbox' && <InboxTab />}
              {activeTab === 'surg' && <SurgeryTab />}
              {activeTab === 'pipe' && <PipelineTab />}
              {activeTab === 'supp' && <SuppliersTab />}
              {activeTab === 'past' && <PastoralTab />}
            </div>
          )}

          {/* Footer */}
          <footer className="mt-auto border-t border-border bg-background px-5 py-5">
            <div className="max-w-[1900px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-white p-0.5">
                  <Image 
                    src="https://i.postimg.cc/MZcB1FWf/logo-ibm.png" 
                    alt="IBM Logo" 
                    width={28} 
                    height={28} 
                    className="object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex flex-col">
                  <h4 className="text-text-primary text-[10px] font-bold uppercase tracking-[0.1em]" style={{ fontFamily: 'var(--font-geist-sans)' }}>Igreja Batista Memorial</h4>
                  <p className="text-[9px] text-text-ghost">© 2024–2026 Memorial Admin — Sistema Operacional v5.0</p>
                </div>
              </div>

              <div className="flex items-center gap-5 text-[10px] text-text-ghost">
                <a href="#" className="hover:text-primary transition-colors">Segurança</a>
                <a href="#" className="hover:text-primary transition-colors">Ajuda</a>
                <a href="#" className="hover:text-primary transition-colors">Privacidade</a>
                <div className="h-3 w-px bg-border hidden md:block"></div>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 bg-primary"></span>
                  <span className="font-mono">Status: OK</span>
                </div>
              </div>
            </div>
          </footer>
        </main>

        {/* ── Mobile Bottom Nav ── */}
        <nav className="sm:hidden flex bg-background border-t border-border shrink-0 safe-area-bottom pb-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-0.5 p-2 pt-2.5 transition-colors relative",
                  isActive ? "text-primary" : "text-text-ghost"
                )}
              >
                {isActive && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-primary"></div>}
                <tab.icon className="w-4 h-4 mx-auto" />
                <span className="text-[8px] font-bold truncate w-full text-center px-0.5 uppercase tracking-[0.03em]">{tab.label.split(' ')[0]}</span>
                {tab.badge && !isActive && (
                  <span className="absolute top-1.5 right-1/4 w-1.5 h-1.5 bg-rose"></span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ═══ Mobile Drawer ═══ */}
      {isMobileMenuOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-fade-in" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-surface border-r border-border z-50 lg:hidden flex flex-col animate-slide-up" style={{ animation: 'none', transform: 'translateX(0)' }}>
            <div className="p-5 pb-4 border-b border-border flex items-center justify-between">
              <LogoHeader />
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-1.5 text-text-muted hover:text-text-primary">
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-3 text-[13px] font-medium transition-all",
                      isActive 
                        ? "bg-primary-muted text-primary border-l-2 border-primary" 
                        : "text-text-muted hover:text-text-secondary hover:bg-background border-l-2 border-transparent"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <tab.icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-text-ghost")} />
                      {tab.label}
                    </div>
                    {tab.badge && (
                      <span className="bg-rose/15 text-rose text-[9px] font-bold px-1.5 py-0.5">{tab.badge}</span>
                    )}
                  </button>
                );
              })}
            </nav>
            <div className="p-3 border-t border-border text-[10px] text-text-ghost font-mono">
              v5.0 — Memorial IBMM
            </div>
          </div>
        </>
      )}

      <ImportModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />
    </div>
  );
}
