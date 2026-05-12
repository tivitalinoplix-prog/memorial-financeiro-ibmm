# Memorial Financeiro IBMM v5.0 — Setup Completo

## 🎯 O que foi implementado na branch `v5-automation`

✅ **3 commits à frente da main:**
1. `lib/supabase.ts` — Cliente Supabase + tipos TransactionRow
2. `lib/db.ts` — Data layer abstraction (Supabase + JSON fallback)
3. `app/api/sync-comunion/route.ts` — Endpoint de scraping (estrutura real mapeada)

✅ **Mapeamento REAL do Comunión/Eclese:**
- URL base: `https://eclese.com/FINANCIAL/Lancamento/List/{caixaId}`
- IDs das contas: ITAÚ=1, CAIXA_TESOURARIA=2, SICOOB=3, CARTAO_SICOOB=4
- 649 lançamentos em 2024 na CAIXA TESOURARIA (paginado em 22 páginas)
- Estrutura HTML das tabelas mapeada e pronta

---

## ⚙️ PRÓXIMOS PASSOS (VOCÊ PRECISA FAZER)

### 1️⃣ Criar projeto no Supabase

Acesse: https://supabase.com/dashboard/projects

1. Crie um novo projeto (nome: `memorial-financeiro-ibmm`)
2. Região: South America (São Paulo) — para menor latência
3. Senha do banco: escolha uma forte

### 2️⃣ Executar o SQL de criação das tabelas

Após criar o projeto, vá em **SQL Editor** e execute:

```sql
-- Copie e cole o conteúdo de: supabase/migrations/001_create_transactions.sql
-- (o arquivo SQL já está criado nesta branch)
```

**OU** rode diretamente no SQL Editor do Supabase:

```sql
CREATE TABLE public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  description TEXT,
  amount NUMERIC(12,2) NOT NULL,
  category TEXT,
  supplier TEXT,
  cnpj TEXT,
  document_source TEXT,
  cost_center TEXT,
  payment_method TEXT,
  account_source TEXT,
  entry_type TEXT CHECK (entry_type IN ('crédito', 'débito')),
  operation_type TEXT,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmado', 'rejeitado')),
  confidence NUMERIC(3,2),
  source_type TEXT NOT NULL CHECK (source_type IN ('ocr', 'comunion', 'manual', 'csv_import', 'json_import')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  raw_data JSONB
);

CREATE INDEX idx_transactions_date ON public.transactions(date DESC);
CREATE INDEX idx_transactions_source ON public.transactions(source_type);
CREATE UNIQUE INDEX idx_transactions_dedupe 
  ON public.transactions(date, amount, COALESCE(description,''), COALESCE(account_source,''));
```

### 3️⃣ Pegar as credenciais do Supabase

Vá em **Project Settings → API**:

- `NEXT_PUBLIC_SUPABASE_URL` — ex: `https://xxxxx.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — chave pública (anon/public)
- `SUPABASE_SERVICE_ROLE_KEY` — chave privada (secret, para API routes)

### 4️⃣ Adicionar as variáveis de ambiente no Vercel

Acesse: https://vercel.com/tivitalinoplix-progs-projects/memorial-financeiro-ibmm/settings/environment-variables

Adicione as 3 variáveis:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6Ikp...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6Ikp...
```

**Aplique para:** Production, Preview, Development

### 5️⃣ Atualizar `package.json` com a dependência

Adicione no `package.json`:

```json
"dependencies": {
  "@supabase/supabase-js": "^2.39.0",
  ...
}
```

E rode: `npm install` (localmente) ou faça um novo deploy no Vercel que rodará automaticamente.

### 6️⃣ Fazer merge da branch `v5-automation` na `main`

No GitHub, clique em "Compare & pull request" e faça o merge.

---

## 🧪 Testar a integração

Após o deploy com as env vars configuradas:

1. Acesse o app: https://memorial-financeiro-ibmm.vercel.app/
2. Abra o console do navegador (F12)
3. Teste o endpoint: 
   ```js
   fetch('/api/sync-comunion', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       accountId: 2,
       dateFrom: '01/01/2024',
       dateTo: '31/12/2024',
       mode: 'test'
     })
   }).then(r => r.json()).then(console.log)
   ```

---

## 📚 Documentação técnica

### Arquivos criados:
- `lib/supabase.ts` — Cliente + tipos
- `lib/db.ts` — getTransactions(), insertTransaction(), upsertTransactions()
- `app/api/sync-comunion/route.ts` — POST endpoint (mock por enquanto, pronto para scraping real)

### Próximas implementações (já documentadas no código):
- Scraper real com Puppeteer/Playwright no `/api/sync-comunion`
- Atualizar NoteReader para salvar no Supabase após OCR
- Atualizar ComunionImporter para usar `upsertTransactions` com deduplicação
- Script de importação dos 2.218 registros do JSON → Supabase

---

## ✅ Migração dos Dados JSON → Supabase

### Status: **PRONTO PARA EXECUTAR**

 O script `scripts/migrate-json-to-supabase.ts` foi criado e está pronto para importar os 2.218 registros do arquivo `lib/data/unified_transactions.json` para o Supabase.

### Pré-requisitos

1. **Obter credenciais do Supabase:**
   - Acesse: https://supabase.com/dashboard/project/svhvgvymmhoktvnmwggm/settings/api
   - Copie o **Project URL** (NEXT_PUBLIC_SUPABASE_URL)
   - Copie o **service_role secret** (SUPABASE_SERVICE_ROLE_KEY)
   - ⚠️ **NUNCA** commite a service_role key no GitHub

2. **Configurar variáveis de ambiente:**
   
   Crie o arquivo `.env.local` na raiz do projeto:
   
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://svhvgvymmhoktvnmwggm.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJhbG...seu_token_aqui
   NEXT_PUBLIC_GEMINI_API_KEY=AIzaSy...seu_token_existente
   ```

3. **Instalar dependências** (se ainda não instalou):
   
   ```bash
   npm install
   npm install -D tsx  # Para executar TypeScript diretamente
   ```

### Como executar a migração

```bash
# Execute o script de migração
npx tsx scripts/migrate-json-to-supabase.ts
```

### O que o script faz:

1. ✅ Lê o arquivo `unified_transactions.json` (2.218 registros)
2. ✅ Verifica se o banco já tem dados (previne duplicação)
3. ✅ Converte o formato JSON para o formato da tabela Supabase
4. ✅ Insere os registros em batches de 100 (mais eficiente)
5. ✅ Mostra progresso em tempo real
6. ✅ Valida a contagem final no banco

### Após a migração

Depois de executar com sucesso, você pode:

1. **Verificar no Supabase:**
   - https://supabase.com/dashboard/project/svhvgvymmhoktvnmwggm/editor
   - Clique na tabela `transações`
   - Deve mostrar 2.218 registros

2. **Testar o app:**
   ```bash
   npm run dev
   ```
   - O dashboard agora vai carregar dados do Supabase
   - Fallback automático para JSON se Supabase estiver offline

3. **Deploy no Vercel:**
   - Configure as env vars no Vercel:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `SUPABASE_SERVICE_ROLE_KEY`
   - Push para v5-automation → deploy automático

### Solução de problemas

**Erro "Missing Supabase credentials":**
- Certifique-se que o arquivo `.env.local` existe na raiz
- Verifique que as variáveis estão corretas (sem espaços)

**Erro "Database already contains transactions":**
- O script previne duplicação
- Se quiser re-importar, limpe a tabela no Supabase primeiro

**Erro de conexão:**
- Verifique sua internet
- Confirme que o projeto Supabase está ativo
- Teste o URL no navegador

---

## 📋 Checklist de conclusão v5-automation

- [x] Branch criada com commits semânticos
- [x] Tabelas Supabase criadas (transactions + comunion_sync_logs)
- [x] Script de migração criado
- [x] Lib/db.ts com abstração Supabase + fallback JSON
- [x] Mapeamento real do Comunión/Eclese documentado
- [ ] **Migração executada (2.218 registros no Supabase)**
- [ ] App testado localmente com Supabase
- [ ] Env vars configuradas no Vercel
- [ ] Deploy testado em produção
- [ ] Merge para main após aprovação


---

**Qualquer dúvida, consulte os comentários nos arquivos criados ou pergunte!**
