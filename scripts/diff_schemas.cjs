const fs = require('fs');
const path = require('path');

const schemaFromCodePath = path.join(__dirname, '../schema-from-code.json');
const stagingMigrationPath = path.join(__dirname, '../supabase/migration.sql');
const diffOutputPath = path.join(__dirname, '../schema-diff.md');

const schemaFromCode = JSON.parse(fs.readFileSync(schemaFromCodePath, 'utf8'));
const stagingSql = fs.readFileSync(stagingMigrationPath, 'utf8');

const stagingTables = {};

// Very naive parser for staging migration.sql
const tableMatches = stagingSql.matchAll(/CREATE TABLE public\.([a-zA-Z0-9_]+) \(([\s\S]*?)\);/g);
for (const match of tableMatches) {
  const tableName = match[1];
  const columnsBlock = match[2];
  const columns = {};
  
  const lines = columnsBlock.split('\n');
  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('--') || line.startsWith('CONSTRAINT') || line.startsWith('FOREIGN KEY')) continue;
    const colMatch = line.match(/^([a-zA-Z0-9_]+)\s+([a-zA-Z0-9_\[\]]+)/);
    if (colMatch) {
      columns[colMatch[1]] = colMatch[2];
    }
  }
  stagingTables[tableName] = columns;
}

let diffMd = '# Schema Diff: Code Expectations vs Staging Database\n\n';

for (const [tableName, tableDef] of Object.entries(schemaFromCode.tables)) {
  if (!stagingTables[tableName]) {
    diffMd += `## ❌ Missing Table: \`${tableName}\`\n`;
    diffMd += `- **Classification:** Missing table\n`;
    diffMd += `- **Required Columns:** ${Object.keys(tableDef.columns).join(', ')}\n\n`;
    continue;
  }
  
  const stagingCols = stagingTables[tableName];
  for (const [colName, colDef] of Object.entries(tableDef.columns)) {
    if (!stagingCols[colName]) {
      diffMd += `## ❌ Missing Column: \`${tableName}.${colName}\`\n`;
      diffMd += `- **Classification:** Missing column\n`;
      diffMd += `- **Expected Type:** ${colDef.type}\n\n`;
    }
  }
}

fs.writeFileSync(diffOutputPath, diffMd);
console.log('Diff generated to schema-diff.md');
