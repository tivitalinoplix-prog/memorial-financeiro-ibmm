/**
 * Migration script to import unified_transactions.json into Supabase
 * Run: npx tsx scripts/migrate-json-to-supabase.ts
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'
import { jsonToTransactionRow } from '../lib/db'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials')
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function migrate() {
  try {
    console.log('🚀 Starting migration...')
    console.log('📁 Reading unified_transactions.json...')
    
    const jsonPath = join(__dirname, '../lib/data/unified_transactions.json')
    const rawData = readFileSync(jsonPath, 'utf-8')
    const jsonTransactions = JSON.parse(rawData)
    
    console.log(`📊 Found ${jsonTransactions.length} transactions in JSON`)
    
    // Check current count in database
    const { count: existingCount, error: countError } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
    
    if (countError) {
      console.error('❌ Error checking existing transactions:', countError)
      throw countError
    }
    
    console.log(`💾 Database currently has ${existingCount || 0} transactions`)
    
    if (existingCount && existingCount > 0) {
      console.log('⚠️  Database already contains transactions')
      console.log('Do you want to:')
      console.log('  1. Skip migration (database already populated)')
      console.log('  2. Add new records (may create duplicates)')
      console.log('  3. Clear and re-import all')
      console.log('\nExiting safely. Modify script if you want to proceed.')
      return
    }
    
    // Convert JSON format to Supabase row format
    console.log('🔄 Converting JSON records to database format...')
    const rows = jsonTransactions.map(jsonToTransactionRow)
    
    // Insert in batches (Supabase has limits)
    const BATCH_SIZE = 100
    let inserted = 0
    let errors = 0
    
    console.log(`📤 Inserting ${rows.length} records in batches of ${BATCH_SIZE}...`)
    
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE)
      const batchNum = Math.floor(i / BATCH_SIZE) + 1
      const totalBatches = Math.ceil(rows.length / BATCH_SIZE)
      
      process.stdout.write(`\r  Batch ${batchNum}/${totalBatches}...`)
      
      const { error } = await supabase
        .from('transactions')
        .insert(batch)
      
      if (error) {
        console.error(`\n❌ Error in batch ${batchNum}:`, error.message)
        errors += batch.length
      } else {
        inserted += batch.length
      }
    }
    
    console.log('\n')
    console.log('✅ Migration complete!')
    console.log(`   Inserted: ${inserted} records`)
    if (errors > 0) {
      console.log(`   Errors: ${errors} records`)
    }
    console.log(`   Total: ${jsonTransactions.length} records processed`)
    
    // Verify final count
    const { count: finalCount } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
    
    console.log(`💾 Database now has ${finalCount} transactions`)
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

migrate()
