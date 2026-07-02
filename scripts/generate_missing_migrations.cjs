const fs = require('fs');
const path = require('path');

const schemaFromCodePath = path.join(__dirname, '../schema-from-code.json');
const stagingMigrationPath = path.join(__dirname, '../supabase/migration.sql');
const outputPath = path.join(__dirname, '../supabase/migrations/0004_full_recovery.sql');

const schemaFromCode = JSON.parse(fs.readFileSync(schemaFromCodePath, 'utf8'));
const stagingSql = fs.readFileSync(stagingMigrationPath, 'utf8');

const stagingTables = {};
const tableMatches = stagingSql.matchAll(/CREATE TABLE public\.([a-zA-Z0-9_]+) \(([\s\S]*?)\);/g);
for (const match of tableMatches) {
  const tableName = match[1];
  const columnsBlock = match[2];
  const columns = {};
  for (let line of columnsBlock.split('\n')) {
    line = line.trim();
    if (!line || line.startsWith('--') || line.startsWith('CONSTRAINT') || line.startsWith('FOREIGN KEY')) continue;
    const colMatch = line.match(/^([a-zA-Z0-9_]+)\s+([a-zA-Z0-9_\[\]]+)/);
    if (colMatch) columns[colMatch[1]] = colMatch[2];
  }
  stagingTables[tableName] = columns;
}

let sql = `-- Migration: 0004_full_recovery
-- Purpose: Add missing tables, columns, and relations derived from codebase source-of-truth.
-- Preconditions: Base schema exists
-- Postconditions: All frontend-expected schema objects exist

BEGIN;

-- 1. Create Enums (Idempotent using DO block)
DO $$
BEGIN
`;

for (const [enumName, values] of Object.entries(schemaFromCode.enums)) {
  sql += `  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '${enumName}') THEN\n`;
  sql += `    CREATE TYPE public.${enumName} AS ENUM (${values.map(v => `'${v}'`).join(', ')});\n`;
  sql += `  END IF;\n`;
}

sql += `END $$;\n\n-- 2. Create Missing Tables\n`;

const mapType = (tsType) => {
  if (tsType === 'string') return 'TEXT';
  if (tsType === 'number') return 'NUMERIC';
  if (tsType === 'boolean') return 'BOOLEAN';
  if (tsType.includes('[]')) return 'JSONB';
  if (tsType === 'Json') return 'JSONB';
  return 'TEXT';
}

for (const [tableName, tableDef] of Object.entries(schemaFromCode.tables)) {
  if (!stagingTables[tableName]) {
    sql += `CREATE TABLE IF NOT EXISTS public.${tableName} (\n`;
    const colLines = [];
    for (const [colName, colDef] of Object.entries(tableDef.columns)) {
      let pgType = mapType(colDef.type);
      if (colDef.type.includes('Database["public"]["Enums"]')) {
         const enumMatch = colDef.type.match(/\["([^"]+)"\]/);
         if (enumMatch) pgType = 'public.' + enumMatch[1];
      }
      if (colName === 'id' && pgType === 'TEXT') pgType = 'UUID DEFAULT uuid_generate_v4()';
      if (colName === 'created_at' || colName === 'updated_at') pgType = 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()';
      
      let line = `    ${colName} ${pgType}`;
      if (colName === 'id') line += ' PRIMARY KEY';
      else if (!colDef.isNullable) line += ' NOT NULL';
      colLines.push(line);
    }
    sql += colLines.join(',\n') + '\n);\n\n';
  }
}

sql += `-- 3. Add Missing Columns to Existing Tables\n`;

for (const [tableName, tableDef] of Object.entries(schemaFromCode.tables)) {
  if (stagingTables[tableName]) {
    const stagingCols = stagingTables[tableName];
    for (const [colName, colDef] of Object.entries(tableDef.columns)) {
      if (!stagingCols[colName]) {
        let pgType = mapType(colDef.type);
        if (colDef.type.includes('Database["public"]["Enums"]')) {
           const enumMatch = colDef.type.match(/\["([^"]+)"\]/);
           if (enumMatch) pgType = 'public.' + enumMatch[1];
        }
        if (colName === 'id' && pgType === 'TEXT') pgType = 'UUID DEFAULT uuid_generate_v4()';
        if (colName === 'created_at' || colName === 'updated_at') pgType = 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()';
        
        sql += `ALTER TABLE public.${tableName} ADD COLUMN IF NOT EXISTS ${colName} ${pgType};\n`;
      }
    }
  }
}

sql += `\n-- 4. Add Foreign Keys for Missing Tables (Idempotent via DO block)\n`;

sql += `DO $$\nBEGIN\n`;
for (const [tableName, tableDef] of Object.entries(schemaFromCode.tables)) {
  for (const rel of tableDef.relations) {
    if (rel.column && rel.targetTable && rel.targetColumn) {
        sql += `  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_${tableName}_${rel.column}') THEN\n`;
        sql += `    ALTER TABLE public.${tableName} ADD CONSTRAINT fk_${tableName}_${rel.column} FOREIGN KEY (${rel.column}) REFERENCES public.${rel.targetTable}(${rel.targetColumn}) ON DELETE CASCADE;\n`;
        sql += `  END IF;\n`;
    }
  }
}
sql += `END $$;\n\n`;

sql += `COMMIT;\n`;

fs.writeFileSync(outputPath, sql);
console.log('Recovery migration generated to ' + outputPath);
