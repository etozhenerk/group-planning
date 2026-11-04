from pathlib import Path
import re, shutil
src=Path('/Users/misha/Documents/Codex/projects/group-planning/openspec/changes/mobile-mvp-design-refresh/assets/onboarding-r5')
dst=Path('/private/tmp/somewhere-onboarding/nav-onboarding');dst.mkdir(exist_ok=True)
for f in ['boardgame.png','dinner.png']:shutil.copyfile(src/f,dst/f)
for inp,out in [('index.html','preview.html'),('frame.html','frame.html')]:
 s=(src/inp).read_text()
 # Точечная ревизия текущего собранного макета: исходники r5 отдельно не сохранены.
 pattern=r'\(0,([\w$]+)\.jsx\)\("button",\{type:"button",className:([\w$]+)\.back,style:\{visibility:([\w$]+)===0\?"hidden":"visible"\},disabled:([\w$]+)==="busy",onClick:\(\)=>[\w$]+\([\w$]+-1\),children:"\\u2190 \\u041D\\u0430\\u0437\\u0430\\u0434"\}\)'
 matches=list(re.finditer(pattern,s))
 if not matches and inp=='index.html':
  (dst/out).write_text(s);continue
 assert len(matches)==1
 m=matches[0];a=m.group(1)
 icon=f'(0,{a}.jsx)("svg",{{viewBox:"0 0 24 24",width:24,height:24,fill:"none",stroke:"currentColor",strokeWidth:1.7,strokeLinecap:"round",strokeLinejoin:"round","aria-hidden":true,children:(0,{a}.jsx)("path",{{d:"m15 5-7 7 7 7"}})}})'
 new=m.group(0).replace('type:"button",','type:"button","aria-label":"Предыдущий шаг","data-page-back":true,',1)
 new=new[:new.rfind('children:')]+f'children:{icon}'+'})'
 s=s[:m.start()]+new+s[m.end():]
 css=Path('/private/tmp/somewhere-navigation/PageBack.module.css').read_text().replace('.back','[data-page-back]').replace('var(--ds-color-border-strong)','#414248').replace('var(--ds-color-surface)','#303137').replace('var(--ds-color-text)','#f5f4f1').replace('var(--ds-color-background)','#24252a').replace('var(--ds-color-accent)','#d6cce9')
 css=re.sub(r':global\(([^)]+)\)',r'\1',css)
 s=s.replace('</head>','<style>'+css+'</style></head>')
 (dst/out).write_text(s)
