from pathlib import Path
root=Path('/private/tmp/somewhere-onboarding')
links=[('vibe','Вайб'),('create','Создание'),('place','Карта'),('chat','Чат'),('info','Детали'),('settings','Настройки'),('date','Дата'),('preparation','Подготовка'),('onboarding','Знакомство')]
for name,_ in links:
 p=root/f'nav-{name}/preview.html';s=p.read_text();nav='<nav aria-label="Экраны для сравнения" style="font:13px system-ui;display:flex;justify-content:center;flex-wrap:wrap;gap:8px;margin:0 auto 16px;max-width:760px">'
 for target,label in links:
  query='?state=map' if target=='place' else ''
  nav+=f'<a style="padding:8px 12px;border-radius:10px;color:#24252a;text-decoration:none;background:{"#d6cce9" if target==name else "#fff"}" href="../nav-{target}/preview.html{query}">{label}</a>'
 nav+='</nav>';s=s.replace('<body>','<body>'+nav,1);p.write_text(s)
