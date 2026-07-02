const fs = require('fs');
const path = require('path');

const tables = {};

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Extract .from("table")
  const fromRegex = /\.from\(['"]([^'"]+)['"]\)/g;
  let match;
  while ((match = fromRegex.exec(content)) !== null) {
    const table = match[1];
    if (!tables[table]) tables[table] = new Set();
  }

  // Very naive context extraction around .from()
  // This is just a quick diagnostic script to dump matches.
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    if (line.includes('supabase.from')) {
      const match = line.match(/\.from\(['"]([^'"]+)['"]\)/);
      if (match) {
        const table = match[1];
        // look ahead 10 lines for .select, .insert, .update
        for(let j=0; j<10; j++) {
           if (i+j < lines.length) {
              const l = lines[i+j];
              if (l.includes('.select(')) {
                 tables[table].add('SELECT: ' + l.trim());
              }
              if (l.includes('.insert(')) {
                 tables[table].add('INSERT: ' + l.trim());
              }
              if (l.includes('.update(')) {
                 tables[table].add('UPDATE: ' + l.trim());
              }
           }
        }
      }
    }
  });
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      processFile(fullPath);
    }
  }
}

walkDir('d:/brokersconnect/src');

for (const [table, queries] of Object.entries(tables)) {
  console.log(`\n=== TABLE: ${table} ===`);
  for (const q of queries) {
    console.log(q);
  }
}
