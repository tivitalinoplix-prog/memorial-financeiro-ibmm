import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

async function run() {
  console.log('🚀 Iniciando Robô de Exploração do Comunión (Eclese)...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    userDataDir: 'C:\\Users\\tivit\\AppData\\Local\\Google\\Chrome\\User Data',
    args: ['--start-maximized']
  });

  const page = await browser.newPage();
  
  console.log(`🌐 Navegando para o módulo financeiro...`);
  await page.goto('https://eclese.com/FINANCIAL/', { waitUntil: 'networkidle2' });

  console.log('⏳ Aguardando carregamento da interface (e potencial login manual)...');
  await new Promise(r => setTimeout(r, 10000)); // Aguarda 10 segundos

  console.log('🔍 Mapeando estrutura do DOM...');
  
  const domStructure = await page.evaluate(() => {
    const extractSelectors = (selector: string) => {
      const elements = document.querySelectorAll(selector);
      return Array.from(elements).map(el => ({
        tag: el.tagName,
        id: el.id,
        className: el.className,
        text: (el as HTMLElement).innerText?.trim() || '',
        name: (el as HTMLInputElement).name || '',
        type: (el as HTMLInputElement).type || '',
        ariaLabel: el.getAttribute('aria-label') || ''
      })).filter(el => el.id || el.name || el.className || el.text);
    };

    return {
      title: document.title,
      url: window.location.href,
      menus: extractSelectors('nav a, .menu a, .sidebar a, [role="menuitem"]'),
      inputs: extractSelectors('input, textarea'),
      selects: extractSelectors('select'),
      buttons: extractSelectors('button, input[type="submit"], input[type="button"], .btn')
    };
  });

  console.log('✅ Estrutura extraída!');

  const outputPath = path.join(process.cwd(), 'comunion_dom_map.json');
  fs.writeFileSync(outputPath, JSON.stringify(domStructure, null, 2), 'utf-8');
  console.log(`💾 JSON salvo em: ${outputPath}`);

  await browser.close();
  console.log('🏁 Processo finalizado.');
}

run().catch(console.error);
