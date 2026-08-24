import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  access,
  mkdir,
  mkdtemp,
  open,
  readFile,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const sanitizerPath = 'tools/sanitize_static_export.mjs';
const clientSourceFiles = execFileSync(
  'git',
  ['ls-files', 'src/app', 'src/components', 'src/lib'],
  { encoding: 'utf8' },
).trim().split('\n').filter(Boolean);

const sourceRules = [
  {
    label: 'RFC1918 address',
    pattern: /(?<![0-9A-Za-z.])(?:10\.(?:(?:[0-9]{1,3}|x)\.){2}(?:[0-9]{1,3}|x)|172\.(?:1[6-9]|2[0-9]|3[01])\.(?:[0-9]{1,3}|x)\.(?:[0-9]{1,3}|x)|192\.168\.(?:[0-9]{1,3}|x)\.(?:[0-9]{1,3}|x))(?![0-9A-Za-z.])/iu,
  },
  { label: 'absolute user/home path', pattern: /\/(?:Users|home)\//u },
  {
    label: 'host-specific absolute path',
    pattern: /\/(?:userdata|etc\/galbot|etc\/supervisor)\/|\/data\/bin(?:\/|\b)/u,
  },
  {
    label: 'known credential literal',
    pattern: /(?<![0-9A-Za-z@._-])(?:12345678|gb@2023|miracle666)(?![0-9A-Za-z@._-])/iu,
  },
  { label: 'known Wi-Fi SSID literal', pattern: /miracle-office-5g/iu },
  {
    label: 'non-empty textual password',
    pattern: /\bPassword\s*:\s*(?!unavailable|disabled)[^\s'"]+|\u5bc6\u7801\s*[:=]\s*["']?(?!\u672a\u914d\u7f6e|\u7a7a|\u4e0d\u53ef\u7528)[^"'\s),.]+/u,
  },
  {
    label: 'non-empty password field',
    pattern: /\b(?:sshPass|password|passwd)\s*:\s*['"][^'"]+['"]/iu,
  },
  {
    label: 'privileged/demo SSH username literal',
    pattern: /\bsshUser\s*:\s*['"](?:root|galbot)['"]|(?:root|galbot)@/iu,
  },
  {
    label: 'known device serial literal',
    pattern: /(?:GALBOT-116-GB105|R001GBD-2026040[1-7]|LUMOS-UMI-009|R001FBBCBABA0058|R002FBBCBABA0066)/u,
  },
  {
    label: 'high-entropy device serial literal',
    pattern: /(?<![A-Z0-9])(?=[A-Z0-9]{16,}(?![A-Z0-9]))(?=[A-Z0-9]*[A-Z])(?=[A-Z0-9]*\d)[A-Z0-9]+(?![A-Z0-9])/u,
  },
  {
    label: 'non-empty credential assignment',
    pattern: /(?<![A-Za-z0-9_])(?:api[_-]?key|client[_-]?secret|access[_-]?token|refresh[_-]?token|private[_-]?key|credential|secret)\s*["']?\s*[:=]\s*["'][^"'\r\n]{8,}["']/iu,
  },
  {
    label: 'environment credential assignment',
    pattern: /\b[A-Z][A-Z0-9_]*(?:SECRET|TOKEN|API_KEY|PRIVATE_KEY|PASSWORD)[A-Z0-9_]*\s*=\s*[A-Za-z0-9_./+=-]{8,}/u,
  },
  {
    label: 'authorization header credential',
    pattern: /\bAuthorization\s*[:=]\s*["'](?:Basic|Bearer)\s+[^"'\s]{8,}["']/iu,
  },
  {
    label: 'private key material',
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/u,
  },
];

const contractViolations = [];
try {
  await access(sanitizerPath);
} catch {
  contractViolations.push(`${sanitizerPath} must exist`);
}

for (const filePath of clientSourceFiles) {
  const source = await readFile(filePath, 'utf8');
  const lines = source.split(/\r?\n/u);
  for (const [index, line] of lines.entries()) {
    for (const { label, pattern } of sourceRules) {
      if (pattern.test(line)) contractViolations.push(`${filePath}:${index + 1}: ${label}`);
    }
  }
}

const {
  MAX_FILE_BYTES,
  auditStaticExport,
  resolveInsideOutput,
  sanitizeStaticExport,
} = await import(pathToFileURL(sanitizerPath).href);

assert.equal(MAX_FILE_BYTES, 50 * 1024 * 1024, '50 MiB must be the exact file-size ceiling');
assert.equal(typeof auditStaticExport, 'function', 'auditStaticExport must be exported for direct tests');
assert.equal(typeof resolveInsideOutput, 'function', 'resolveInsideOutput must be exported for path-boundary tests');
assert.equal(typeof sanitizeStaticExport, 'function', 'sanitizeStaticExport must be exported for direct tests');

async function exists(targetPath) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function createCase(label) {
  const root = await mkdtemp(path.join(tmpdir(), `static-export-${label}-`));
  const outDir = path.join(root, 'out');
  await mkdir(outDir);
  return { root, outDir };
}

async function expectSafetyFailure(label, setup, expectedPattern) {
  const { root, outDir } = await createCase(label);
  try {
    await setup({ root, outDir });
    await assert.rejects(() => sanitizeStaticExport(outDir), expectedPattern);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

{
  const { root, outDir } = await createCase('known-local');
  try {
    const publicSource = path.join(root, 'public/videos/source.mp4');
    const publicHtmlSource = path.join(root, 'public/annotation_workbench_prototype.html');
    await mkdir(path.dirname(publicSource), { recursive: true });
    await writeFile(publicSource, 'source-media-must-remain');
    await writeFile(publicHtmlSource, '<script src="https://cdn.example.invalid/no-sri.js"></script>');

    await writeFile(path.join(outDir, 'index.html'), '<!doctype html><title>safe</title>');
    await writeFile(path.join(outDir, 'annotation_workbench_prototype.html'), 'generated-public-copy');
    await mkdir(path.join(outDir, 'assets'), { recursive: true });
    await writeFile(path.join(outDir, 'assets/app.js'), 'console.log("safe")');
    await writeFile(
      path.join(outDir, 'assets/vendor.js'),
      'const svgPath="M7.2-10.2.4.3z";const digits="0123456789";const inputTypes={password:!0};',
    );
    await mkdir(path.join(outDir, '1780382810146/videos'), { recursive: true });
    await writeFile(path.join(outDir, '1780382810146/videos/local.h264'), 'generated-copy');
    await mkdir(path.join(outDir, 'assets/videos'), { recursive: true });
    await writeFile(path.join(outDir, 'assets/videos/local.mp4'), 'generated-copy');
    await mkdir(path.join(outDir, 'videos'), { recursive: true });
    await writeFile(path.join(outDir, 'videos/local.mov'), 'generated-copy');

    const result = await sanitizeStaticExport(outDir);
    assert.deepEqual(
      result.removed,
      ['1780382810146', 'assets/videos', 'videos', 'annotation_workbench_prototype.html'],
      'only the approved generated local-only paths may be removed',
    );
    assert.equal(await exists(path.join(outDir, '1780382810146')), false);
    assert.equal(await exists(path.join(outDir, 'assets/videos')), false);
    assert.equal(await exists(path.join(outDir, 'videos')), false);
    assert.equal(await exists(path.join(outDir, 'annotation_workbench_prototype.html')), false);
    assert.equal(await readFile(path.join(outDir, 'index.html'), 'utf8'), '<!doctype html><title>safe</title>');
    assert.equal(await readFile(path.join(outDir, 'assets/app.js'), 'utf8'), 'console.log("safe")');
    assert.match(
      await readFile(path.join(outDir, 'assets/vendor.js'), 'utf8'),
      /svgPath/u,
      'vendor-like SVG paths and metadata must not be misclassified as secrets',
    );
    assert.equal(await readFile(publicSource, 'utf8'), 'source-media-must-remain');
    assert.equal(
      await readFile(publicHtmlSource, 'utf8'),
      '<script src="https://cdn.example.invalid/no-sri.js"></script>',
    );
    await auditStaticExport(outDir);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

await expectSafetyFailure('unknown-media', async ({ outDir }) => {
  await mkdir(path.join(outDir, 'uploads'));
  await writeFile(path.join(outDir, 'uploads/leak.mkv'), 'unknown-media-must-not-be-deleted');
}, /forbidden media extension/u);

for (const extension of ['.264', '.3g2', '.3gp', '.asf', '.f4v', '.hevc', '.m2v', '.mxf', '.rmvb', '.vob', '.wav', '.flac']) {
  await expectSafetyFailure(`media-${extension.slice(1)}`, async ({ outDir }) => {
    await writeFile(path.join(outDir, `unexpected${extension}`), 'unexpected-media');
  }, /forbidden media extension/u);
}

await expectSafetyFailure('symlink', async ({ root, outDir }) => {
  const target = path.join(root, 'outside.txt');
  await writeFile(target, 'outside');
  await symlink(target, path.join(outDir, 'outside-link'));
}, /symbolic link/u);

await expectSafetyFailure('large-file', async ({ outDir }) => {
  const handle = await open(path.join(outDir, 'large.bin'), 'w');
  try {
    await handle.truncate(MAX_FILE_BYTES + 1);
  } finally {
    await handle.close();
  }
}, /larger than 50 MiB/u);

for (const { label, contents, expected } of [
  { label: 'private-ip', contents: 'const host = "192.168.1.5";', expected: /RFC1918/u },
  { label: 'private-subnet', contents: 'configure the 192.168.1.x subnet', expected: /RFC1918/u },
  { label: 'users-path', contents: 'const source = "/Users/example/media";', expected: /absolute user\/home path/u },
  { label: 'home-path', contents: 'const source = "/home/example/media";', expected: /absolute user\/home path/u },
  { label: 'host-path', contents: 'const source = "/userdata/private/media";', expected: /host-specific absolute path/u },
  { label: 'runtime-api', contents: 'fetch("/api/luming")', expected: /runtime Luming API/u },
  { label: 'credential', contents: 'Password: gb@2023', expected: /known credential literal/u },
  { label: 'wifi-ssid', contents: 'const ssid = "miracle-office-5g";', expected: /known Wi-Fi SSID literal/u },
  { label: 'device-serial', contents: 'const serial = "R001GBD-20260401";', expected: /known device serial literal/u },
  { label: 'xv-device-serial', contents: 'const serial = "250801DR48FP26003296";', expected: /known device serial literal/u },
  { label: 'api-key-assignment', contents: '{"apiKey":"EXAMPLE_NOT_REAL_SECRET_1234567890"}', expected: /non-empty credential assignment/u },
  { label: 'environment-secret', contents: 'AWS_SECRET_ACCESS_KEY=EXAMPLE_NOT_REAL_SECRET_1234567890', expected: /environment credential assignment/u },
  { label: 'authorization-header', contents: 'Authorization: "Bearer EXAMPLE_NOT_REAL_TOKEN_1234567890"', expected: /authorization header credential/u },
  { label: 'private-key', contents: '-----BEGIN PRIVATE KEY-----', expected: /private key material/u },
]) {
  await expectSafetyFailure(label, async ({ outDir }) => {
    await writeFile(path.join(outDir, 'bundle.js'), contents);
  }, expected);
}

for (const secretFileName of ['.env', '.npmrc', '.netrc', '.pypirc', 'id_rsa', 'id_ed25519', 'credentials.json', 'secrets.json']) {
  await expectSafetyFailure(`secret-file-${secretFileName.replaceAll('.', '-')}`, async ({ outDir }) => {
    await writeFile(path.join(outDir, secretFileName), 'STATIC_DEMO_PLACEHOLDER=true');
  }, /forbidden secret-bearing filename/u);
}

await expectSafetyFailure('dotenv-text', async ({ outDir }) => {
  await writeFile(path.join(outDir, '.env.production'), 'HOST=192.168.1.5');
}, /RFC1918/u);

await expectSafetyFailure('dotenv-text-with-nul', async ({ outDir }) => {
  await writeFile(path.join(outDir, '.env.local'), 'HOST=192.168.1.5\0');
}, /RFC1918/u);

await expectSafetyFailure('extensionless-text', async ({ outDir }) => {
  await writeFile(path.join(outDir, 'CONFIG'), 'source=/home/example/private');
}, /absolute user\/home path/u);

await expectSafetyFailure('extensionless-text-with-nul', async ({ outDir }) => {
  await writeFile(path.join(outDir, 'CONFIG'), 'HOST=192.168.1.5\0');
}, /RFC1918/u);

await expectSafetyFailure('yaml-text', async ({ outDir }) => {
  await writeFile(path.join(outDir, 'config.yaml'), 'host: 192.168.1.5');
}, /RFC1918/u);

{
  const root = await mkdtemp(path.join(tmpdir(), 'static-export-parent-link-'));
  const outside = path.join(root, 'outside');
  const outDir = path.join(root, 'out');
  await mkdir(path.join(outside, 'videos'), { recursive: true });
  await mkdir(outDir);
  await writeFile(path.join(outside, 'videos', 'sentinel.mp4'), 'must-not-be-removed');
  await symlink(outside, path.join(outDir, 'assets'));
  try {
    await assert.rejects(
      () => sanitizeStaticExport(outDir),
      /symlink outside static output/u,
    );
    assert.equal(
      await readFile(path.join(outside, 'videos', 'sentinel.mp4'), 'utf8'),
      'must-not-be-removed',
      'a symlinked parent must never let the sanitizer remove files outside out',
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

{
  const publicTestParent = await mkdtemp(path.join(path.resolve('public'), '.static-export-boundary-'));
  const outDir = path.join(publicTestParent, 'out');
  const linkRoot = await mkdtemp(path.join(tmpdir(), 'static-export-public-link-'));
  const linkedParent = path.join(linkRoot, 'linked-parent');
  await mkdir(outDir);
  await symlink(publicTestParent, linkedParent);
  try {
    await assert.rejects(
      () => sanitizeStaticExport(path.join(linkedParent, 'out')),
      /inside public source directory/u,
    );
  } finally {
    await rm(linkRoot, { recursive: true, force: true });
    await rm(publicTestParent, { recursive: true, force: true });
  }
}

{
  const { root, outDir } = await createCase('path-boundary');
  const notOut = path.join(root, 'not-output');
  await mkdir(notOut);
  try {
    assert.throws(
      () => resolveInsideOutput(outDir, '../public'),
      /outside the static output root/u,
    );
    await assert.rejects(
      () => sanitizeStaticExport(notOut),
      /basename "out"/u,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

assert.deepEqual(
  contractViolations,
  [],
  `static export safety contract violations:\n- ${contractViolations.join('\n- ')}`,
);
console.log('STATIC_EXPORT_SAFETY_OK');
