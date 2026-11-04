import * as esbuild from '/Users/misha/Documents/Codex/projects/group-planning/node_modules/esbuild/lib/main.js'
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises'
const root='/Users/misha/Documents/Codex/projects/group-planning',dir='/private/tmp/somewhere-create-map'
const plugin={name:'isolated-create-preview',setup(build){
 build.onLoad({filter:/CreateMeetingForm\/CreateMeetingForm\.tsx$/},async args=>({contents:await readFile(dir+'/CreateMeetingForm.proposal.tsx','utf8'),loader:'tsx',resolveDir:args.path.slice(0,args.path.lastIndexOf('/'))}))
 build.onLoad({filter:/MeetingFields\/MeetingFields\.tsx$/},async args=>({contents:await readFile(dir+'/MeetingFields.proposal.tsx','utf8'),loader:'tsx',resolveDir:args.path.slice(0,args.path.lastIndexOf('/'))}))
 build.onLoad({filter:/MeetingTimeFields\/MeetingTimeFields\.tsx$/},async args=>({contents:await readFile(dir+'/MeetingTimeFields.proposal.tsx','utf8'),loader:'tsx',resolveDir:args.path.slice(0,args.path.lastIndexOf('/'))}))
 build.onLoad({filter:/DateInput\/DateInput\.tsx$/},async args=>({contents:await readFile(dir+'/DateInput.proposal.tsx','utf8'),loader:'tsx',resolveDir:args.path.slice(0,args.path.lastIndexOf('/'))}))
 build.onLoad({filter:/DateInput\/DateInput\.module\.css$/},async args=>({contents:(await readFile(args.path,'utf8'))+'\n.required {margin-left:4px;color:var(--ds-color-error);font-size:18px;font-weight:650;line-height:1;}.visuallyHidden {position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;}',loader:'local-css'}))
 build.onLoad({filter:/MeetingTimeFields\/MeetingTimeFields\.module\.css$/},async args=>({contents:(await readFile(args.path,'utf8'))+'\n.form-time {align-items:start;grid-template-columns:minmax(0,1fr) minmax(0,1fr);}',loader:'local-css'}))
 build.onLoad({filter:/DateButton\/DateButton\.tsx$/},async args=>({contents:(await readFile(args.path,'utf8')).replace('aria-describedby={`${id}-value`}', 'aria-describedby={`${id}-value ${id}-required`}').replace('          disableTransition', "          floatingStyles={{position:'fixed',left:8,right:8,top:'auto',bottom:24,width:'auto',transform:'none'}}\n          disableTransition"),loader:'tsx',resolveDir:args.path.slice(0,args.path.lastIndexOf('/'))}))
 build.onLoad({filter:/DateCalendar\/DateCalendar\.module\.css$/},async args=>({contents:(await readFile(args.path,'utf8'))+"\n.content { --g-color-text-danger:var(--ds-color-weekend-text); }",loader:'local-css'}))

 build.onLoad({filter:/DateButton\/DateButton\.module\.css$/},async args=>({contents:(await readFile(args.path,'utf8')).replaceAll('font-size: 13px','font-size: 16px').replaceAll('font-size: 12px','font-size: 16px')+'\n.button {border:1px solid var(--ds-color-border-strong);}.button[aria-invalid=true] {outline:none;border-color:color-mix(in srgb,var(--ds-color-error) 65%,var(--ds-color-border-strong));box-shadow:0 0 0 3px color-mix(in srgb,var(--ds-color-error) 7%,transparent);background:color-mix(in srgb,var(--ds-color-error) 3%,var(--ds-color-navigation));}',loader:'local-css'}))

 for(const name of ['CreateMeetingForm','MeetingFields','CoverEditor','CoverActions']){build.onLoad({filter:new RegExp(name+'/'+name+'\\.module\\.css$')},async()=>({contents:await readFile(dir+'/'+name+'.module.css','utf8'),loader:'local-css'}))}
 build.onLoad({filter:/create-meeting\/model\/useCreateMeeting\.ts$/},()=>({contents:'export {useCreateMeeting} from "'+dir+'/useCreateFixture"',loader:'ts'}))
 build.onLoad({filter:/CoverEditor\/CoverEditor\.tsx$/},async args=>({contents:(await readFile(args.path,'utf8')).replace("mobile ? (hasPhoto ? 'Фото встречи' : 'Не добавлена') : 'необязательно'","'необязательно'"),loader:'tsx',resolveDir:args.path.slice(0,args.path.lastIndexOf('/'))}))
 build.onLoad({filter:/entities\/meeting\/lib\/prepareCover\.ts$/},async args=>({contents:(await readFile(args.path,'utf8')).replace("@/entities/meeting/lib/prepareCover.worker.ts","./cover-worker.js"),loader:'ts',resolveDir:args.path.slice(0,args.path.lastIndexOf('/'))}))
}}
const options={bundle:true,minify:true,format:'esm',loader:{'.svg':'dataurl'},outdir:`${dir}/dist`,jsx:'automatic',nodePaths:[`${root}/node_modules`],alias:{'@':`${root}/frontend/web/src`,'@preview':dir},define:{'process.env.NODE_ENV':'"production"'}}
await writeFile(dir+'/demoCover.ts','export const demoCover={media_type:"image/png",data:'+JSON.stringify((await readFile(dir+'/dinner.png')).toString('base64'))+'} as const')
await esbuild.build({ ...options, entryPoints:[root+'/frontend/web/src/entities/meeting/lib/prepareCover.worker.ts'],outdir:undefined,outfile:dir+'/cover-worker.js' })
for(const [entry,id,file,title,plugins] of [['frame-entry','meetings-list','frame','Новая встреча',[plugin]],['entry','somewhere-meetings-list','preview','Новая встреча · дизайн',[]]]){
 await esbuild.build({...options,entryPoints:[`${dir}/${entry}.tsx`],plugins})
 const css=await readFile(`${dir}/dist/${entry}.css`,'utf8'),js=await readFile(`${dir}/dist/${entry}.js`,'utf8')
 const outer=file==='preview'?`html,body{margin:0;background:#ededeb}body{padding:20px;box-sizing:border-box}#${id}{max-width:min(390px,calc((100dvh - 140px)*358/760));margin:auto}`:''
 await writeFile(`${dir}/${file}.html`,`<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>${outer}${css}</style></head><body><div id="${id}"></div><script type="module">${js.replaceAll('</script','<\\/script')}</script></body></html>`)
}

const dest='/private/tmp/somewhere-onboarding/create-r5';await mkdir(dest,{recursive:true});for(const file of ['frame.html','preview.html','dinner.png','somewhere.svg','cover-worker.js'])await copyFile(dir+'/'+file,dest+'/'+file);
