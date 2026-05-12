import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import { upsertTransactions } from '../lib/db';

const TARGET_URL = 'https://eclese.com/FINANCIAL/Report/ExtratoFinanceiroPeriodico?id=7&caixaID=3&strInicial=01/01/2025&strFinal=11/05/2026#';

async function run() {
  console.log('🚀 Iniciando Robô do Comunión (Eclese)...');
  
  // Abre o navegador usando o perfil principal do Chrome para aproveitar a sessão salva
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // Pode variar dependendo da instalação
    userDataDir: 'C:\\Users\\tivit\\AppData\\Local\\Google\\Chrome\\User Data', // Reaproveita seu perfil
    args: ['--start-maximized']
  });

  const page = await browser.newPage();
  
  console.log(`🌐 Navegando para: ${TARGET_URL}`);
  await page.goto(TARGET_URL, { waitUntil: 'networkidle2' });

  console.log('⏳ Aguardando carregamento da tabela financeira...');
  console.log('👉 ATENÇÃO: Se aparecer a tela de login, por favor, faça o login no navegador aberto.');
  
  // Aguarda até que a tabela de resultados esteja visível
  // Assumindo que a tabela usa classes ou IDs comuns no Eclese
  // Se precisar, aumentamos o timeout para dar tempo de digitar o login
  try {
    // Procura por alguma tag table (isso pode ser ajustado com o ID correto da tabela)
    await page.waitForSelector('table', { timeout: 60000 });
    console.log('✅ Tabela carregada com sucesso!');
  } catch (error) {
    console.log('❌ Demorou muito ou não achou a tabela. O login foi feito?');
    await browser.close();
    process.exit(1);
  }

  // Extrai o HTML e faz o parse da tabela
  console.log('🔍 Extraindo dados da tabela...');
  
  const rawData = await page.evaluate(() => {
    // Eclese tables usually have a specific ID or class, we fallback to the first major table
    const table = document.querySelector('table');
    if (!table) return [];

    const rows = Array.from(table.querySelectorAll('tbody tr'));
    return rows.map(tr => {
      const tds = Array.from(tr.querySelectorAll('td'));
      return tds.map(td => td.innerText.trim());
    });
  });

  console.log(`✅ ${rawData.length} linhas extraídas!`);

  // O Eclese normalmente retorna: [Data, Descrição, Documento, Conta, Entrada, Saida, Saldo]
  // Você precisará ajustar os índices abaixo com base no layout real!
  const transactions = rawData.map((row, index) => {
    try {
      const dateRaw = row[0]; // ex: "15/01/2025"
      const [d, m, y] = dateRaw.split('/');
      const isoDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      
      const description = row[1];
      const account = row[3] || 'Desconhecido';
      
      const isEntrada = row[4] && row[4] !== '0,00' && row[4] !== '';
      const amountStr = isEntrada ? row[4] : row[5];
      const amount = parseFloat(amountStr.replace(/\./g, '').replace(',', '.'));
      
      return {
        date: isoDate,
        description,
        amount,
        type: isEntrada ? 'entrada' : 'saida',
        category: 'Outros', // Default, precisaremos de IA ou dicionário para classificar
        account: account,
        status: 'completed'
      };
    } catch (err) {
      console.log(`⚠️ Falha ao parsear linha ${index}:`, row);
      return null;
    }
  }).filter(Boolean);

  console.log(`💾 Salvando ${transactions.length} registros no Supabase...`);
  
  if (transactions.length > 0) {
    try {
      // @ts-ignore
      const result = await upsertTransactions(transactions);
      console.log(`📈 Resultado: ${result.inserted} novos, ${result.duplicates} duplicados ignorados.`);
    } catch (e) {
      console.error('❌ Erro no Supabase:', e);
    }
  }

  const dumpPath = path.join(process.cwd(), 'eclese_dump.html');
  const html = await page.content();
  fs.writeFileSync(dumpPath, html, 'utf-8');
  console.log(`💾 HTML salvo temporariamente em: ${dumpPath} para análise profunda caso o parser falhe.`);

  console.log('⏸️ Mantendo o navegador aberto por 10 segundos para você ver...');
  await new Promise(r => setTimeout(r, 10000));
  
  await browser.close();
  console.log('🏁 Processo finalizado.');
}

run().catch(console.error);
