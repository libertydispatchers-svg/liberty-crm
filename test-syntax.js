const fs = require('fs');
const { parse } = require('@babel/parser');
const code = fs.readFileSync('app/admin/page.tsx', 'utf8');
try {
  parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript']
  });
  console.log('No syntax errors');
} catch (e) {
  console.error(e);
}
