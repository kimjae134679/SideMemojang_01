import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

// Run manually before each release: node tools/verify-release.mjs
// No GitHub Actions, network requests, or publishing are performed.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const release = path.resolve(process.argv[2] || path.join(root, 'release'));
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));
const version = packageJson.version;
const exeName = 'side-memojang-setup-' + version + '.exe';
const exeFile = path.join(release, exeName);
const ymlFile = path.join(release, 'latest.yml');
const errors = [];
const assert = (ok, message) => { if (!ok) errors.push(message); };
assert(/^\d+\.\d+\.\d+$/.test(version), 'Invalid package version: ' + version);
assert(lock.version === version && lock.packages?.['']?.version === version, 'package-lock.json version mismatch');
assert(packageJson.build?.win?.verifyUpdateCodeSignature === false, 'Unsigned build must set win.verifyUpdateCodeSignature: false');
assert(!Object.hasOwn(packageJson.build?.win || {}, 'publisherName'), 'Unsigned build must not declare publisherName');
assert(fs.existsSync(exeFile), 'Missing ' + exeName);
assert(fs.existsSync(ymlFile), 'Missing release/latest.yml');
if (fs.existsSync(exeFile) && fs.existsSync(ymlFile)) {
  const yml = fs.readFileSync(ymlFile, 'utf8');
  const topField = field => yml.split(/\r?\n/).find(line => line.startsWith(field + ':'))?.split(':').slice(1).join(':').trim().replace(/^['"]|['"]$/g, '');
  const fileSize = fs.statSync(exeFile).size;
  const expectedSha512 = crypto.createHash('sha512');
  for await (const block of fs.createReadStream(exeFile)) expectedSha512.update(block);
  const sha512 = expectedSha512.digest('base64');
  assert(topField('version') === version, 'latest.yml version mismatch');
  assert(topField('path') === exeName, 'latest.yml path mismatch');
  assert(yml.includes('url: ' + exeName), 'latest.yml URL mismatch');
  assert(yml.includes('size: ' + fileSize), 'latest.yml file size mismatch');
  assert(topField('sha512') === sha512, 'latest.yml top-level SHA-512 mismatch');
  assert(yml.includes('sha512: ' + sha512), 'latest.yml nested SHA-512 mismatch');
}
if (errors.length) {
  console.error('Release verification failed:\n' + errors.map(s => ' - ' + s).join('\n'));
  process.exitCode = 1;
} else {
  console.log('Release files verified locally for v' + version + '.');
  console.log('Next: upload the EXE and latest.yml separately to GitHub Release and confirm URLs.');
}
