/**
 * consolidate-data.cjs
 * Parses all raw-*.ts files and text files from lib/data/
 * and regenerates unified_transactions.json with full coverage.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', 'lib', 'data');
const OUTPUT = path.join(DATA_DIR, 'unified_transactions.json');

// Load existing JSON to avoid duplicates
let existing = [];
try {
  existing = JSON.parse(fs.readFileSync(OUTPUT, 'utf-8'));
  console.log(`Existing JSON has ${existing.length} transactions.`);
} catch (e) {
  console.log('No existing JSON found, starting fresh.');
}

// Build a set of existing IDs for dedup
const existingIds = new Set(existing.map(t => t.id));
const existingKeys = new Set(existing.map(t => `${t.date}|${t.amount}|${t.counterparty}|${t.category}`));

// Parse a raw line:
// DD/MM/YYYY Category Description PaymentMethod R$ Value
function parseLine(line, sourceFile) {
  line = line.trim();
  if (!line || line.length < 15) return null;

  // Match: DD/MM/YYYY ... R$ [-]value
  const dateMatch = line.match(/^(\d{2}\/\d{2}\/\d{4})\s+/);
  if (!dateMatch) return null;

  const dateStr = dateMatch[1]; // DD/MM/YYYY
  const rest = line.slice(dateMatch[0].length);

  // Extract value (R$ at the end)
  const valMatch = rest.match(/R\$\s*(-?[\d.,]+)\s*$/);
  if (!valMatch) return null;

  const rawVal = valMatch[1].replace(/\./g, '').replace(',', '.');
  const amount = parseFloat(rawVal);
  if (isNaN(amount)) return null;

  const beforeVal = rest.slice(0, rest.lastIndexOf('R$')).trim();

  // Extract payment method (last word/phrase before R$)
  const payMethods = ['PIX', 'Boleto', 'Débito em Conta', 'Dinheiro', 'Cheque', 'Cartão de Crédito', 'Transferência entre Agências'];
  let paymentMethod = 'Outro';
  let contentBeforePay = beforeVal;

  for (const pm of payMethods) {
    if (beforeVal.endsWith(pm)) {
      paymentMethod = pm;
      contentBeforePay = beforeVal.slice(0, -pm.length).trim();
      break;
    }
  }

  // First "word group" is the category - grab until the pattern changes
  // Categories are like "Dízimos", "Missões Projeto Amazônia", "Custos dos Ministérios - Geral", etc
  // The description/counterparty follows
  const knownCategories = [
    'Missões Projeto Casa Viver', 'Missões Projeto Amazônia', 'Missões Nacionais - Sustento de Missionário',
    'Missões Nacionais - Campanha Anual', 'Missões Mundiais Farinha Enriquecida',
    'Missões Mundiais', 'Missões Nacionais', 'Missões Estaduais', 'Missões Cristolândia', 'Missões Geral',
    'Custos dos Ministérios - Geral', 'Despesas Ministeriais - Geral',
    'Oferta para Ação Social', 'Oferta para Ceia', 'Ofertas',
    'Ação Social - Cestas Básicas', 'Ação Social - Projetos Assistenciais', 'Ação Social - Geral',
    'Aquisição de Equipamentos Eletrônicos', 'Manutenção Predial - Serviço', 'Manutenção Predial - Material',
    'Manutenção de Instrumentos Musicais', 'Obras e Construções - Serviço',
    'Salário Pastoral', 'Prebenda Ministerial', 'Salários',
    'Serviços Contábeis', 'Serviços Administrativos', 'Serviços de Limpeza', 'Serviços Gráficos', 'Serviços de Cozinha',
    'Tarifas Bancárias', 'Transferência a Débito', 'Transferência a Crédito',
    'Adoração e Música', 'Educação Cristã - Geral', 'Ceia do Senhor',
    'Literatura e Materiais Pedagógicos para Congregaçã', 'Literatura',
    'Cooperação Denominacional', 'Cristolândia Campos',
    'Energia Elétrica', 'Água e Esgoto', 'Internet', 'Telefonia Móvel', 'Combustível',
    'Segurança Patrimonial', 'Dedetização',
    'Material de Limpeza', 'Materiais Descartáveis',
    'Aluguel de Imóveis', 'Hospedagens',
    'Impostos', 'Homenagens e Presentes',
    'Jovens', 'Tecnologia e Informática', 'Casa Viver',
    'Vila Minha Pátria', 'Transportes e Fretes',
    'Administrativas - Geral',
    'Igreja Batista Jesus Transforma - RS',
    'Dízimos', 'Inscrições', 'Manancial', 'Almoços e Jantares', 'Almoço', 'Lanche', 'Crianças', 'Obras',
    'Missões Projeto Casa Viver'
  ];

  // Sort by length desc so longer matches first
  knownCategories.sort((a, b) => b.length - a.length);

  let category = 'Outros';
  let description = contentBeforePay;

  for (const cat of knownCategories) {
    if (contentBeforePay.startsWith(cat)) {
      category = cat;
      description = contentBeforePay.slice(cat.length).trim();
      break;
    }
  }

  // Extract counterparty from description
  let counterparty = description;
  // Clean up pipe separators
  if (counterparty.includes('|')) {
    const parts = counterparty.split('|');
    counterparty = parts[parts.length - 1].trim();
  }
  // If counterparty starts with "PIX:" or "PIX " prefix, clean
  counterparty = counterparty.replace(/^PIX:\s*/, '').replace(/^Pix:\s*/, '').trim();

  // Parse date
  const [dd, mm, yyyy] = dateStr.split('/').map(Number);
  const isoDate = `${yyyy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
  const monthLabel = `${String(mm).padStart(2, '0')}/${String(yyyy).slice(-2)}`;

  // Determine direction
  const direction = amount < 0 ? 'out' : 'in';
  const entryType = amount < 0 ? 'débito' : 'crédito';

  // Determine account source from sourceFile
  let accountSource = 'DESCONHECIDO';
  let accountGroup = 'Geral';
  if (sourceFile.includes('itau') || sourceFile.includes('raw-2') || sourceFile.includes('raw-3') || sourceFile.includes('raw-4') || sourceFile.includes('raw-5')) {
    accountSource = 'ITAU';
    accountGroup = 'Conta Corrente Itaú';
  } else if (sourceFile.includes('sicoob') || sourceFile.includes('raw-1')) {
    accountSource = 'SICOOB_CC';
    accountGroup = 'Conta Corrente Sicoob';
  } else if (sourceFile.includes('tesouraria') || sourceFile.includes('raw-6') || sourceFile.includes('raw-7') || sourceFile.includes('raw-8') || sourceFile.includes('raw-9') || sourceFile.includes('raw-10') || sourceFile.includes('raw-11') || sourceFile.includes('raw-12')) {
    accountSource = 'TESOURARIA';
    accountGroup = 'Tesouraria Manual';
  }

  // Determine if transfer
  const isTransfer = category.includes('Transferência') || description.toLowerCase().includes('transferência');
  const isInternalTransfer = isTransfer && (description.includes('entre CC') || description.includes('APLICACAO') || description.includes('APLIC'));

  // Determine operation type
  let operationType = 'Outros';
  if (paymentMethod === 'PIX') operationType = 'PIX';
  else if (paymentMethod === 'Boleto') operationType = 'Boleto';
  else if (paymentMethod === 'Cheque') operationType = 'Cheque';
  else if (paymentMethod === 'Dinheiro') operationType = 'Dinheiro';
  else if (paymentMethod === 'Cartão de Crédito') operationType = 'Cartão';
  else if (paymentMethod === 'Débito em Conta') operationType = 'Débito Automático';

  const id = crypto.createHash('md5').update(`${isoDate}|${amount}|${counterparty}|${category}|${description.slice(0, 30)}`).digest('hex');

  return {
    id,
    date: isoDate,
    year: yyyy,
    month: mm,
    month_label: monthLabel,
    account_source: accountSource,
    account_group: accountGroup,
    document_source: sourceFile,
    entry_type: entryType,
    operation_type: operationType,
    category,
    description: description || category,
    counterparty: counterparty || 'N/I',
    amount,
    amount_absolute: Math.abs(amount),
    direction,
    payment_method: paymentMethod,
    raw_text: line,
    confidence: 0.95,
    is_transfer: isTransfer,
    is_internal_transfer_candidate: isInternalTransfer
  };
}

function extractRawStrings(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  // Extract template literal content between backticks
  const matches = content.match(/`([^`]+)`/gs);
  if (!matches) return [];
  return matches.map(m => m.slice(1, -1)); // remove backticks
}

// Process all raw-*.ts files
const rawFiles = fs.readdirSync(DATA_DIR).filter(f => f.startsWith('raw-') && f.endsWith('.ts'));
console.log(`Found ${rawFiles.length} raw files to process.`);

let newTransactions = [];
let duplicateCount = 0;

for (const file of rawFiles) {
  const filePath = path.join(DATA_DIR, file);
  const strings = extractRawStrings(filePath);
  let fileCount = 0;

  for (const raw of strings) {
    const lines = raw.split('\n');
    for (const line of lines) {
      const tx = parseLine(line, file);
      if (tx) {
        const key = `${tx.date}|${tx.amount}|${tx.counterparty}|${tx.category}`;
        if (!existingIds.has(tx.id) && !existingKeys.has(key)) {
          newTransactions.push(tx);
          existingIds.add(tx.id);
          existingKeys.add(key);
          fileCount++;
        } else {
          duplicateCount++;
        }
      }
    }
  }
  console.log(`  ${file}: +${fileCount} new transactions`);
}

// Also process .txt files
const txtFiles = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.txt'));
for (const file of txtFiles) {
  const filePath = path.join(DATA_DIR, file);
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  let fileCount = 0;

  for (const line of lines) {
    const tx = parseLine(line, file);
    if (tx) {
      const key = `${tx.date}|${tx.amount}|${tx.counterparty}|${tx.category}`;
      if (!existingIds.has(tx.id) && !existingKeys.has(key)) {
        newTransactions.push(tx);
        existingIds.add(tx.id);
        existingKeys.add(key);
        fileCount++;
      } else {
        duplicateCount++;
      }
    }
  }
  console.log(`  ${file}: +${fileCount} new transactions`);
}

// Merge and sort
const allTransactions = [...existing, ...newTransactions].sort((a, b) => a.date.localeCompare(b.date));

console.log(`\n--- Summary ---`);
console.log(`Existing: ${existing.length}`);
console.log(`New parsed: ${newTransactions.length}`);
console.log(`Duplicates skipped: ${duplicateCount}`);
console.log(`Total: ${allTransactions.length}`);

// Write output
fs.writeFileSync(OUTPUT, JSON.stringify(allTransactions, null, 2), 'utf-8');
console.log(`\nWritten to ${OUTPUT}`);

// Stats
const years = [...new Set(allTransactions.map(t => t.year))].sort();
console.log(`Years covered: ${years.join(', ')}`);
for (const y of years) {
  const count = allTransactions.filter(t => t.year === y).length;
  const months = [...new Set(allTransactions.filter(t => t.year === y).map(t => t.month_label))].sort();
  console.log(`  ${y}: ${count} txns across ${months.length} months (${months.join(', ')})`);
}
