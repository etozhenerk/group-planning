import * as esbuild from '/Users/misha/Documents/Codex/projects/group-planning/node_modules/esbuild/lib/main.js'
import {readFile,writeFile} from 'node:fs/promises'
const root='/Users/misha/Documents/Codex/projects/group-planning',dir='/private/tmp/somewhere-invitations'
const plugin={name:'isolated-preview',setup(build){
 build.onLoad({filter:/InvitationCard\/InvitationCard\.module\.css$/},async()=>({contents:await readFile(`${dir}/InvitationCard.module.css`,'utf8'),loader:'local-css'}))
 build.onLoad({filter:/InvitationCard\/InvitationCard\.tsx$/},async args=>({contents:(await readFile(args.path,'utf8')).replace('Ваш ответ: Возможно','Изменить ответ →'),loader:'tsx',resolveDir:args.path.slice(0,args.path.lastIndexOf('/'))}))
 build.onLoad({filter:/features\/respond\/model\/useRespond\.ts$/},()=>({contents:`export {useRespond} from '${dir}/useRespondFixture'`,loader:'ts'}))
 build.onLoad({filter:/frontend\/web\/src\/entities\/meeting\/model\/use(CoverImage|MediaImage)\.ts$/},args=>({contents:`export {${args.path.split('/').pop().replace('.ts','')}} from '${dir}/fixtureHooks.ts'`,loader:'ts'}))
 build.onLoad({filter:/shared\/ui\/Brand\/Brand\.tsx$/},async args=>({contents:(await readFile(args.path,'utf8')).replace('src="/somewhere.svg"','src="./somewhere.svg"'),loader:'tsx',resolveDir:args.path.slice(0,args.path.lastIndexOf('/'))}))
}}
const options={bundle:true,minify:true,format:'esm',loader:{'.svg':'dataurl'},outdir:`${dir}/dist`,jsx:'automatic',nodePaths:[`${root}/node_modules`],alias:{'@':`${root}/frontend/web/src`,'@preview':dir},define:{'process.env.NODE_ENV':'"production"'}}
for(const [entry,id,file,title,plugins] of [['frame-entry','meetings-list','frame','Приглашения',[plugin]],['entry','somewhere-meetings-list','preview','Приглашения · новый дизайн',[]]]){
 await esbuild.build({...options,entryPoints:[`${dir}/${entry}.tsx`],plugins})
 const css=await readFile(`${dir}/dist/${entry}.css`,'utf8'),js=await readFile(`${dir}/dist/${entry}.js`,'utf8')
 const outer=file==='preview'?`html,body{margin:0;background:#ededeb}body{padding:20px;box-sizing:border-box}#${id}{max-width:min(390px,calc((100dvh - 140px)*358/760));margin:auto}`:''
 await writeFile(`${dir}/${file}.html`,`<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>${outer}${css}</style></head><body><div id="${id}"></div><script type="module">${js.replaceAll('</script','<\\/script')}</script></body></html>`)
}
