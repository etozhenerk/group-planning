import * as esbuild from '/Users/misha/Documents/Codex/projects/group-planning/node_modules/esbuild/lib/main.js'
import {readFile,writeFile} from 'node:fs/promises'
const root='/Users/misha/Documents/Codex/projects/group-planning',dir='/private/tmp/somewhere-invite'
const plugin={name:'isolated-invitation-preview',setup(build){
 for(const [pattern,name] of [[/features\/respond\/model\/useRespond\.ts$/,'useRespond'],[/features\/sign-in\/model\/useSignIn\.ts$/,'useSignIn'],[/features\/sign-in\/model\/useLogout\.ts$/,'useLogout']]){build.onLoad({filter:pattern},()=>({contents:'export {'+name+'} from "'+dir+'/'+name+'Fixture"',loader:'ts'}))}
 build.onLoad({filter:/ResponseButtons\/ResponseButtons\.module\.css$/},async()=>({contents:await readFile(dir+'/ResponseButtons.module.css','utf8'),loader:'local-css'}))
 build.onLoad({filter:/ResponseButtons\/ResponseButtons\.tsx$/},async args=>{
  let source='import {InvitationNotice} from "@preview/InvitationNotice";\n'+await readFile(args.path,'utf8')
  source=source.replace(/      \{action.mutation.error && \([\s\S]*?\n      \)\}/,'')
  source=source.replace("      <div className={styles['response-buttons']}>",'<>{action.mutation.error && <InvitationNotice title="Не удалось отправить ответ" text="Ответ не изменился. Повторите выбор."/>}</>\n      <div className={styles[\'response-buttons\']}>')
  source=source.replace('<p role="status">Сохраняем ответ…</p>','<span role="status" className={styles.srOnly}>Сохраняем ответ…</span>')
  return {contents:source,loader:'tsx',resolveDir:args.path.slice(0,args.path.lastIndexOf('/'))}
 })
 build.onLoad({filter:/SignInButton\/SignInButton\.tsx$/},async args=>{let source='import {InvitationNotice} from "@preview/InvitationNotice";\n'+await readFile(args.path,'utf8');source=source.replace(/      \{action.error && \([\s\S]*?\n      \)\}/,'').replace('      <button','      {action.error && <InvitationNotice id={errorId} title="Не удалось открыть вход" text="Попробуйте ещё раз."/>}\n      <button');return {contents:source,loader:'tsx',resolveDir:args.path.slice(0,args.path.lastIndexOf('/'))}})
 build.onLoad({filter:/SignInButton\/SignInButton\.module\.css$/},async args=>({contents:(await readFile(args.path,'utf8'))+'\n.button {width:100%;min-height:48px;font-size:14px;font-weight:600;} .primary {background:var(--ds-color-action);color:var(--ds-color-action-text);}',loader:'local-css'}))
 build.onLoad({filter:/frontend\/web\/src\/entities\/meeting\/model\/use(CoverImage|MediaImage)\.ts$/},args=>({contents:'export {'+args.path.split('/').pop().replace('.ts','')+'} from "'+dir+'/fixtureHooks"',loader:'ts'}))
 build.onLoad({filter:/shared\/ui\/Brand\/Brand\.tsx$/},async args=>({contents:(await readFile(args.path,'utf8')).replace('src="/somewhere.svg"','src="./somewhere.svg"'),loader:'tsx',resolveDir:args.path.slice(0,args.path.lastIndexOf('/'))}))
}}
const options={bundle:true,minify:true,format:'esm',loader:{'.svg':'dataurl'},outdir:dir+'/dist',jsx:'automatic',nodePaths:[root+'/node_modules'],alias:{'@':root+'/frontend/web/src','@preview':dir},define:{'process.env.NODE_ENV':'"production"'}}
for(const [entry,id,file,title,plugins] of [['frame-entry','meetings-list','frame','Приглашение на встречу',[plugin]],['entry','somewhere-meetings-list','preview','Приглашение · новый дизайн',[]]]){
 await esbuild.build({...options,entryPoints:[dir+'/'+entry+'.tsx'],plugins})
 const css=await readFile(dir+'/dist/'+entry+'.css','utf8'),js=await readFile(dir+'/dist/'+entry+'.js','utf8')
 const outer=file==='preview'?'html,body{margin:0;background:#ededeb}body{padding:20px;box-sizing:border-box}#'+id+'{max-width:min(390px,calc((100dvh - 140px)*358/760));margin:auto}':''
 await writeFile(dir+'/'+file+'.html','<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+title+'</title><style>'+outer+css+'</style></head><body><div id="'+id+'"></div><script type="module">'+js.replaceAll('</script','<\/script')+'</script></body></html>')
}
