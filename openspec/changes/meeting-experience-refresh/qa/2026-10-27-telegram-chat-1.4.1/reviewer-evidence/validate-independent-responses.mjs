import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const {contract,responseSchema,validate}=await import(pathToFileURL(path.resolve('scripts/check-api-contract.mjs')));
const directory=path.resolve(process.argv[2]);
const results=[];
for(const file of fs.readdirSync(directory).filter(f=>/^TestIndependent.*\.json$/.test(f))){
  for(const response of JSON.parse(fs.readFileSync(path.join(directory,file),'utf8'))){
    if(!response.body)continue;
    const operation=contract.paths[response.path]?.[response.method];
    if(!operation){assert.equal(response.status,404,`${file}: undocumented route ${response.path}`);results.push({file,path:response.path,status:404,result:'no public route, expected 404'});continue;}
    const schema=responseSchema(operation,response.status);
    validate(schema,response.body);
    results.push({file,path:response.path,method:response.method,status:response.status,schema,result:'passed'});
  }
}
assert(results.length>0,'No actual response bodies');
console.log(JSON.stringify({checkedAt:new Date().toISOString(),actualResponseCount:results.length,results},null,2));
