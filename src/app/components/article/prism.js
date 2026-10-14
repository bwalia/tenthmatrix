// Prism core + the languages our articles use. Import this module (client
// only) instead of 'prismjs' directly so every code path gets the same set.
import Prism from 'prismjs';
import 'prismjs/components/prism-markup-templating';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-lua';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-docker';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-toml';
import 'prismjs/components/prism-ini';
import 'prismjs/components/prism-nginx';
import 'prismjs/components/prism-hcl';
import 'prismjs/components/prism-diff';

Prism.manual = true;

export const LANG_LABELS = {
  js: 'JavaScript',
  javascript: 'JavaScript',
  ts: 'TypeScript',
  typescript: 'TypeScript',
  jsx: 'JSX',
  tsx: 'TSX',
  py: 'Python',
  python: 'Python',
  bash: 'Bash',
  sh: 'Shell',
  shell: 'Shell',
  json: 'JSON',
  yaml: 'YAML',
  yml: 'YAML',
  go: 'Go',
  rust: 'Rust',
  lua: 'Lua',
  docker: 'Dockerfile',
  dockerfile: 'Dockerfile',
  sql: 'SQL',
  toml: 'TOML',
  ini: 'INI',
  nginx: 'nginx',
  hcl: 'HCL',
  diff: 'Diff',
  html: 'HTML',
  markup: 'HTML',
  css: 'CSS',
};

export default Prism;
