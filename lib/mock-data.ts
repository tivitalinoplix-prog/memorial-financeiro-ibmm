export const MONTHS = [
  'Jan/25', 'Fev/25', 'Mar/25', 'Abr/25', 'Mai/25', 'Jun/25',
  'Jul/25', 'Ago/25', 'Set/25', 'Out/25', 'Nov/25', 'Dez/25',
  'Jan/26', 'Fev/26', 'Mar/26', 'Abr/26', 'Mai/26'
];

export const DEMO_DATA = {
  monthly: [
    { m: 'Jan/25', receitas: 107361, despesas: 214551, saldo: -107190, txns: 458 },
    { m: 'Fev/25', receitas: 26103, despesas: 139083, saldo: -112980, txns: 226 },
    { m: 'Mar/25', receitas: 33111, despesas: 54219, saldo: -21108, txns: 184 },
    { m: 'Abr/25', receitas: 16472, despesas: 0, saldo: 16472, txns: 99 },
    { m: 'Mai/25', receitas: 22123, despesas: 64701, saldo: -42578, txns: 184 },
    { m: 'Jun/25', receitas: 30318, despesas: 153285, saldo: -122967, txns: 222 },
    { m: 'Jul/25', receitas: 2563, despesas: 25429, saldo: -22866, txns: 23 },
    { m: 'Ago/25', receitas: 9634, despesas: 89100, saldo: -79466, txns: 98 },
    { m: 'Set/25', receitas: 9567, despesas: 102904, saldo: -93337, txns: 102 },
    { m: 'Out/25', receitas: 6024, despesas: 128992, saldo: -122968, txns: 117 },
    { m: 'Nov/25', receitas: 8382, despesas: 83436, saldo: -75054, txns: 103 },
    { m: 'Dez/25', receitas: 8380, despesas: 109409, saldo: -101029, txns: 111 },
    { m: 'Jan/26', receitas: 10099, despesas: 61710, saldo: -51611, txns: 68 },
    { m: 'Fev/26', receitas: 82136, despesas: 61332, saldo: 20804, txns: 22 },
    { m: 'Mar/26', receitas: 15010, despesas: 77161, saldo: -62151, txns: 112 },
    { m: 'Abr/26', receitas: 11214, despesas: 700, saldo: 10514, txns: 63 },
    { m: 'Mai/26', receitas: 7183, despesas: 0, saldo: 7183, txns: 26 },
  ],
  costCenters: [
    { name: 'Salário Pastoral', val: 293457, type: 'd', col: 'var(--color-primary)' },
    { name: 'Custos Ministeriais', val: 206624, type: 'd', col: 'var(--color-violet)' },
    { name: 'Despesas Ministeriais', val: 188650, type: 'd', col: '#475569' },
    { name: 'Dízimos', val: 173372, type: 'm', col: 'var(--color-cyan)' },
    { name: 'Impostos', val: 63853, type: 'd', col: 'var(--color-amber)' },
    { name: 'Serviços de Limpeza', val: 58198, type: 'd', col: 'var(--color-rose)' },
    { name: 'Ofertas', val: 40979, type: 'm', col: 'var(--color-emerald)' },
    { name: 'Cooperação Denominacional', val: 35390, type: 'm', col: '#a78bfa' },
    { name: 'Adoração e Música', val: 26600, type: 'd', col: 'var(--color-orange)' },
    { name: 'Energia Elétrica', val: 24791, type: 'd', col: '#34d399' },
  ],
  suppliers: [
    { name: 'Pr. Frederico A. C. Reis', cnpj: 'Prebendas', val: 263910 },
    { name: 'CMA Imóveis (Aluguel Pastoral)', cnpj: 'Boleto', val: 70491 },
    { name: 'Fox Serviços e Portaria', cnpj: 'Boleto', val: 43090 },
    { name: 'Hudson Music House', cnpj: 'PIX', val: 41946 },
    { name: 'Sanocaps (Adm.)', cnpj: 'PIX', val: 36000 },
    { name: 'SISPAG Fornecedores', cnpj: 'Boleto', val: 33093 },
    { name: 'Prisma Assessores (Contábil)', cnpj: 'Boleto', val: 14261 },
    { name: 'Rodrigo A. Machado (Música)', cnpj: 'PIX', val: 26600 },
    { name: 'Receita Federal (DARF)', cnpj: 'Boleto/PIX', val: 63853 },
    { name: 'Enel / Ampla Energia', cnpj: 'Boleto', val: 24791 },
  ],
  opTypes: [
    { name: 'PIX', count: 473, val: 766647, col: '#6366f1' },
    { name: 'Dinheiro', count: 923, val: 311951, col: '#8b5cf6' },
    { name: 'Boleto', count: 152, val: 268429, col: '#22d3ee' },
    { name: 'Débito Automático', count: 23, val: 74742, col: '#f59e0b' },
    { name: 'Cheque', count: 27, val: 28342, col: '#f97316' },
    { name: 'Cartão de Crédito', count: 3, val: 3060, col: '#ef4444' },
  ],
  pipeline: { receb: 2218, extrai: 2100, revis: 1980, aprov: 1920, integ: 1850, erro: 68, retry: 31 },
  inboxItems: [
    { id: 1, sup: 'Pr. Frederico A. C. Reis', cnpj: 'CPF', date: '11/03/26', val: 16707.59, cc: 'Salário Pastoral', tipo: 'PIX', status: 'integrado', icon: '⛪' },
    { id: 2, sup: 'CMA Imóveis', cnpj: 'CNPJ', date: '05/03/26', val: 5887.07, cc: 'Aluguel Pastoral', tipo: 'PIX', status: 'integrado', icon: '🏠' },
    { id: 3, sup: 'FOX Serviços e Portaria', cnpj: 'CNPJ', date: '05/03/26', val: 3700.54, cc: 'Serviços de Limpeza', tipo: 'PIX', status: 'integrado', icon: '🧹' },
    { id: 4, sup: 'Pantograf Gráfica', cnpj: 'CNPJ', date: '04/03/26', val: 22350.00, cc: 'Literatura', tipo: 'PIX', status: 'aprovado', icon: '📚' },
    { id: 5, sup: 'CDG Produção Gráfica', cnpj: 'CNPJ', date: '12/03/26', val: 8411.35, cc: 'EBD Material', tipo: 'Boleto', status: 'pendente', icon: '📖' },
    { id: 6, sup: 'Rodrigo Azevedo Machado', cnpj: 'CPF', date: '13/03/26', val: 2600.00, cc: 'Adoração e Música', tipo: 'PIX', status: 'integrado', icon: '🎵' },
    { id: 7, sup: 'Prisma Assessores', cnpj: 'CNPJ', date: '13/03/26', val: 1621.00, cc: 'Serviços Contábeis', tipo: 'Boleto', status: 'integrado', icon: '📊' },
    { id: 8, sup: 'ANA PAULA GUIMARÃES', cnpj: 'CPF', date: '12/03/26', val: 2766.00, cc: 'Limpeza Ar-Cond.', tipo: 'Boleto', status: 'revisao', icon: '❄️' },
    { id: 9, sup: 'Paulo Roberto C. Amorim', cnpj: 'CPF', date: '25/03/26', val: 1650.00, cc: 'Obras e Construções', tipo: 'PIX', status: 'pendente', icon: '🔨' },
    { id: 10, sup: 'Yuri P. L. Guabiraba', cnpj: 'CPF', date: '30/04/26', val: 700.00, cc: 'Ajuda de Custos', tipo: 'PIX', status: 'pendente', icon: '💼' },
    { id: 11, sup: 'Magno Santos Nogueira', cnpj: 'CPF', date: '01/03/26', val: 300.00, cc: 'Segurança', tipo: 'PIX', status: 'integrado', icon: '🛡️' },
    { id: 12, sup: 'Receita Federal', cnpj: 'DARF', date: '20/03/26', val: 3564.45, cc: 'Impostos', tipo: 'PIX', status: 'integrado', icon: '🏛️' },
  ],
  corrLog: [
    { id: 'COR-2026-0112', sup: 'Pr. Frederico A. C. Reis', val: 16707.59, status: 'integrado', ts: '11/03 09:15', lote: 'LT-026-A' },
    { id: 'COR-2026-0111', sup: 'CMA Imóveis', val: 5887.07, status: 'integrado', ts: '05/03 10:30', lote: 'LT-026-A' },
    { id: 'COR-2026-0110', sup: 'FOX Serviços e Portaria', val: 3700.54, status: 'integrado', ts: '05/03 10:31', lote: 'LT-026-A' },
    { id: 'COR-2026-0109', sup: 'Pantograf Gráfica', val: 22350.00, status: 'aprovado', ts: '04/03 14:22', lote: 'LT-025-C' },
    { id: 'COR-2026-0108', sup: 'CDG Produção Gráfica', val: 8411.35, status: 'pendente', ts: '12/03 11:45', lote: 'LT-026-B' },
    { id: 'COR-2026-0107', sup: 'Rodrigo A. Machado', val: 2600.00, status: 'integrado', ts: '13/03 16:00', lote: 'LT-026-B' },
    { id: 'COR-2026-0106', sup: 'Prisma Assessores', val: 1621.00, status: 'integrado', ts: '13/03 16:05', lote: 'LT-026-B' },
    { id: 'COR-2026-0105', sup: 'Receita Federal', val: 3564.45, status: 'integrado', ts: '20/03 09:00', lote: 'LT-026-C' },
  ]
};

export const formatCurrency = (val: number) => 
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val).replace(/\u00A0/g, ' ');

export const formatCurrencyShort = (val: number) => {
  if (val >= 1e6) return 'R$ ' + (val / 1e6).toFixed(2).replace('.', ',') + 'M';
  if (val >= 1e3) return 'R$ ' + (val / 1e3).toFixed(0) + 'k';
  return formatCurrency(val);
};

export const formatNumber = (val: number) => new Intl.NumberFormat('pt-BR').format(val).replace(/\u00A0/g, ' ');
