import {readFile,writeFile,cp,mkdir} from 'node:fs/promises';
const dirs={vibe:'vibe-r2',chat:'chat',info:'info',settings:'settings',date:'date',place:'place-map-r4',create:'create-map',preparation:'preparation'};
for(const [name,dir] of Object.entries(dirs)){
 const base='/private/tmp/somewhere-'+dir;
 let s=await readFile(base+'/build.mjs','utf8');
 s='import {backPlugin} from "/private/tmp/somewhere-navigation/plugin.mjs";\n'+s;
 s=s.replace('entryPoints:[dir+\'/\'+entry+\'.tsx\'],plugins','entryPoints:[dir+\'/\'+entry+\'.tsx\'],plugins:[backPlugin,...plugins]');
 s=s.replace(/const dest='[^']+'/,"const dest='/private/tmp/somewhere-onboarding/nav-"+name+"'");
 s=s.replace('entryPoints:[`${dir}/${entry}.tsx`],plugins','entryPoints:[`${dir}/${entry}.tsx`],plugins:[backPlugin,...plugins]');
 if(!s.includes('...plugins'))throw Error('unpatched '+name);
 await writeFile(base+'/build-navigation.mjs',s);
 await import(base+'/build-navigation.mjs?build='+Date.now());
 console.log('BUILT',name);
}
