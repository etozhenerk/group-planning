import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import https from 'node:https';
const root=new URL('.',import.meta.url),candidate=JSON.parse(await readFile(new URL('candidate.json',root),'utf8'));
const sha=b=>createHash('sha256').update(b).digest('hex');
const pairs=[],mismatches=[];
for(const file of candidate.files){const bytes=await readFile(candidate.artifact+'/'+file.path);const hash=sha(bytes);pairs.push([file.path,hash]);if(hash!==file.sha256||bytes.length!==file.size)mismatches.push(file.path);}
const get=path=>new Promise((resolve,reject)=>https.get('https://127.0.0.1:8899/'+path,{rejectUnauthorized:false},r=>{const a=[];r.on('data',x=>a.push(x));r.on('end',()=>resolve({status:r.statusCode,bytes:Buffer.concat(a)}));}).on('error',reject));
const html=await get('meetings/new'),text=html.bytes.toString(),entries=[...text.matchAll(/(?:src|href)="\/(assets\/[^\"]+)"/g)].map(x=>x[1]);
const paths=[...new Set([...entries,...candidate.files.filter(f=>/MeetingRoute|ChatIcon|index-/.test(f.path)).map(f=>f.path)])];
const live=[];for(const path of paths){const result=await get(path);const file=candidate.files.find(f=>f.path===path);live.push({path,status:result.status,sha256:sha(result.bytes),matches:sha(result.bytes)===file?.sha256});}
const result={at:new Date().toISOString(),candidateSha256:sha(await readFile(new URL('candidate.json',root))),candidate:{...candidate,files:undefined},diskFileCount:pairs.length,diskMismatches:mismatches,artifactHash:sha(JSON.stringify(pairs)),artifactMatches:sha(JSON.stringify(pairs))===candidate.artifactHash,liveHtml:{status:html.status,sha256:sha(html.bytes),entryPaths:entries,note:'Backend HTML metadata transforms allowed; asset byte hashes are compared.'},live,sourceDuringMainProbe:JSON.parse(await readFile(new URL('targeted-probes-https.json',root),'utf8')).before,scope:'Frozen artifact checkpoint. No final source/design acceptance.'};
await writeFile(new URL('artifact-binding.json',root),JSON.stringify(result,null,2));console.log(JSON.stringify({diskFileCount:result.diskFileCount,diskMismatches:mismatches,artifactMatches:result.artifactMatches,liveAssetCount:live.length,liveMatches:live.every(x=>x.matches)}));
