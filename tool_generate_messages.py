import re,ast
from pathlib import Path
s=Path('src/shared/i18n/messages.ts').read_text()
en=s[s.index('export const englishMessages'):s.index('export const messages')]
my=s[s.index('  my: {',s.index('export const messages')):]
pattern=re.compile(r"'([^']+)':\s*('(?:\\.|[^'\\])*'|\"(?:\\.|[^\"\\])*\")\s*,?",re.S)
def entries(text): return {key:ast.literal_eval(value) for key,value in pattern.findall(text)}
e,m=entries(en),entries(my)
assert set(e)==set(m), f'Translations differ: {set(e)^set(m)}'
def quote(value): return "'"+value.replace('\\','\\\\').replace("'","\\'").replace('$',r'\$').replace('\n',r'\n')+"'"
with Path('lib/shared/messages.dart').open('w') as file:
 file.write('const messages = <String, Map<String, String>>{\n')
 for language,items in [('en',e),('my',m)]:
  file.write(f"  '{language}': {{\n")
  for key,value in items.items(): file.write(f'    {quote(key)}: {quote(value)},\n')
  file.write('  },\n')
 file.write('};\n')

import subprocess
subprocess.run(['dart', 'format', 'lib/shared/messages.dart'], check=True, stdout=subprocess.DEVNULL)
