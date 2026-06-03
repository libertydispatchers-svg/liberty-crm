const fs = require('fs');
const acorn = require('acorn');
const jsx = require('acorn-jsx');
const Parser = acorn.Parser.extend(jsx());

const code = fs.readFileSync('/Users/STUDIO/liberty-crm/app/admin/page.tsx', 'utf8');
try {
  Parser.parse(code, { ecmaVersion: 2020, sourceType: 'module' });
  console.log('Syntax OK');
} catch (e) {
  console.error(e.message);
}
