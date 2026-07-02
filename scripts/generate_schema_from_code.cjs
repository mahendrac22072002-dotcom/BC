const fs = require('fs');
const path = require('path');

const typesPath = path.join(__dirname, '../src/integrations/supabase/types.ts');
const typesContent = fs.readFileSync(typesPath, 'utf8');

const tables = {};
const enums = {};

// Parse Enums
const enumsMatch = typesContent.match(/Enums: \{([\s\S]*?)\n    CompositeTypes:/);
if (enumsMatch) {
  const enumsBlock = enumsMatch[1];
  const enumRegex = /([a-zA-Z0-9_]+):\s*(?:(?:"([^"]+)"(?:\s*\|\s*)?)+)/g;
  let eMatch;
  const lines = enumsBlock.split('\n');
  let currentEnum = null;
  for (let line of lines) {
    line = line.trim();
    if (line.endsWith(': {') || (line.endsWith(':') && !line.includes('"'))) continue; // skip nested structs
    
    let m = line.match(/^([a-zA-Z0-9_]+):\s*"([^"]+)"/);
    if (m) {
       currentEnum = m[1];
       enums[currentEnum] = [];
       const matches = line.match(/"([^"]+)"/g);
       if (matches) {
           matches.forEach(v => enums[currentEnum].push(v.replace(/"/g, '')));
       }
    } else if (currentEnum && line.match(/^\|\s*"([^"]+)"/)) {
       const matches = line.match(/"([^"]+)"/g);
       if (matches) {
           matches.forEach(v => enums[currentEnum].push(v.replace(/"/g, '')));
       }
    }
  }
}

// Extract Tables block
const tablesMatch = typesContent.match(/Tables: \{([\s\S]*?)\n    Views:/);
if (tablesMatch) {
  const tablesBlock = tablesMatch[1];
  const tableChunks = tablesBlock.split(/\n      ([a-zA-Z0-9_]+): \{/);
  
  for (let i = 1; i < tableChunks.length; i += 2) {
    const tableName = tableChunks[i];
    const chunk = tableChunks[i+1];
    
    tables[tableName] = { columns: {}, relations: [] };
    
    // Extract Row: { ... }
    const rowMatch = chunk.match(/Row: \{([\s\S]*?)\n        \}/);
    if (rowMatch) {
      const rowBlock = rowMatch[1];
      const rowLines = rowBlock.split('\n');
      for (let line of rowLines) {
        line = line.trim();
        if (!line) continue;
        const colMatch = line.match(/^([a-zA-Z0-9_]+)(\??):\s*(.+)$/);
        if (colMatch) {
          const colName = colMatch[1];
          let colType = colMatch[3].replace(/[,;]$/, '');
          let isNullable = colType.includes('null') || colMatch[2] === '?';
          colType = colType.replace(/\s*\|\s*null/g, '').trim();
          tables[tableName].columns[colName] = { type: colType, isNullable };
        }
      }
    }

    // Extract Relationships
    const relMatch = chunk.match(/Relationships: \[([\s\S]*?)\n        \]/);
    if (relMatch) {
      const relBlock = relMatch[1];
      const relLines = relBlock.split('\n');
      let currentRel = {};
      for (let line of relLines) {
        line = line.trim();
        if (line.startsWith('foreignKeyName:')) currentRel.fkName = line.split('"')[1];
        if (line.startsWith('columns:')) {
            const cols = line.match(/"([^"]+)"/g);
            if (cols && cols.length > 0) currentRel.column = cols[0].replace(/"/g, '');
        }
        if (line.startsWith('referencedRelation:')) currentRel.targetTable = line.split('"')[1];
        if (line.startsWith('referencedColumns:')) {
            const cols = line.match(/"([^"]+)"/g);
            if (cols && cols.length > 0) currentRel.targetColumn = cols[0].replace(/"/g, '');
        }
        if (line === '},' || line === '}') {
          if (currentRel.column && currentRel.targetTable) {
            tables[tableName].relations.push(currentRel);
          }
          currentRel = {};
        }
      }
    }
  }
}

// Output JSON
fs.writeFileSync(path.join(__dirname, '../schema-from-code.json'), JSON.stringify({ tables, enums }, null, 2));

// Output SQL
let sql = '-- SCHEMA GENERATED FROM CODEBASE EXPECTATIONS\n\n';

for (const [enumName, values] of Object.entries(enums)) {
  sql += `CREATE TYPE public.${enumName} AS ENUM (${values.map(v => `'${v}'`).join(', ')});\n`;
}
sql += '\n';

const mapType = (tsType) => {
  if (tsType === 'string') return 'TEXT';
  if (tsType === 'number') return 'NUMERIC';
  if (tsType === 'boolean') return 'BOOLEAN';
  if (tsType.includes('[]')) return 'JSONB';
  if (tsType === 'Json') return 'JSONB';
  return 'TEXT';
}

for (const [tableName, tableDef] of Object.entries(tables)) {
  sql += `CREATE TABLE public.${tableName} (\n`;
  const colLines = [];
  for (const [colName, colDef] of Object.entries(tableDef.columns)) {
    let pgType = mapType(colDef.type);
    
    if (colDef.type.includes('Database["public"]["Enums"]')) {
       const enumMatch = colDef.type.match(/\["([^"]+)"\]/);
       if (enumMatch) {
          pgType = 'public.' + enumMatch[1];
       }
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

for (const [tableName, tableDef] of Object.entries(tables)) {
  for (const rel of tableDef.relations) {
    if (rel.column && rel.targetTable && rel.targetColumn) {
        sql += `ALTER TABLE public.${tableName} ADD CONSTRAINT fk_${tableName}_${rel.column} FOREIGN KEY (${rel.column}) REFERENCES public.${rel.targetTable}(${rel.targetColumn}) ON DELETE CASCADE;\n`;
    }
  }
}

fs.writeFileSync(path.join(__dirname, '../schema-from-code.sql'), sql);
console.log('Schema extracted successfully.');
