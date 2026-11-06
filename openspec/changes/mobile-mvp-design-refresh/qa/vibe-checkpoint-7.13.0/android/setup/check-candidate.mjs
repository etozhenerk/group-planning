import {readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {sourceHash} from '../../../../../../../scripts/testing/catalog.mjs';
const [candidateFile, outputFile] = process.argv.slice(2);
if (!candidateFile || !outputFile) throw Error('Usage: node check-candidate.mjs CANDIDATE OUTPUT_JSON');
const candidate = JSON.parse(await readFile(resolve(candidateFile)));
if (candidate.platform !== 'android') throw Error('Android candidate required');
const artifact = await readFile(candidate.artifact);
const artifactHash = createHash('sha256').update(artifact).digest('hex');
const currentSourceHash = await sourceHash(process.cwd(), JSON.parse(await readFile('testing/config.json')), ['android']);
const result = {at: new Date().toISOString(), candidateFile:resolve(candidateFile), candidate, artifactHash, currentSourceHash,
  artifactMatches:artifactHash === candidate.artifactHash, sourceMatches:currentSourceHash === candidate.sourceHash};
await writeFile(resolve(outputFile),JSON.stringify(result,null,2));
if (!result.artifactMatches || !result.sourceMatches) throw Error('Frozen artifact/source mismatch: stop before runtime');
console.log(JSON.stringify({artifactHash,currentSourceHash,matches:true}));
