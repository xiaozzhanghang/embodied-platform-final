import {
  lstat,
  readFile,
  readdir,
  realpath,
  rm,
} from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const MAX_FILE_BYTES = 50 * 1024 * 1024;

const APPROVED_OUTPUT_ONLY_PATHS = Object.freeze([
  '1780382810146',
  'assets/videos',
  'videos',
  'annotation_workbench_prototype.html',
]);

const MEDIA_EXTENSIONS = new Set([
  '.264',
  '.3g2',
  '.3gp',
  '.aac',
  '.asf',
  '.avi',
  '.f4v',
  '.flac',
  '.flv',
  '.h264',
  '.hevc',
  '.m4a',
  '.m2ts',
  '.m2v',
  '.m4v',
  '.mkv',
  '.mov',
  '.mp4',
  '.mp3',
  '.mpeg',
  '.mpg',
  '.mts',
  '.mxf',
  '.ogg',
  '.ogv',
  '.opus',
  '.rmvb',
  '.ts',
  '.vob',
  '.wav',
  '.webm',
  '.wmv',
]);

const ALLOWED_OUTPUT_EXTENSIONS = new Set([
  '',
  '.avif',
  '.cjs',
  '.css',
  '.csv',
  '.eot',
  '.gif',
  '.htm',
  '.html',
  '.ico',
  '.jpeg',
  '.jpg',
  '.js',
  '.json',
  '.log',
  '.map',
  '.md',
  '.mjs',
  '.otf',
  '.png',
  '.svg',
  '.ttf',
  '.txt',
  '.wasm',
  '.webmanifest',
  '.webp',
  '.woff',
  '.woff2',
  '.xml',
]);

const SECRET_FILE_PATTERNS = Object.freeze([
  /^\.env(?:\..+)?$/iu,
  /^\.(?:npmrc|netrc|pypirc)$/iu,
  /^id_(?:rsa|dsa|ecdsa|ed25519)(?:\.pub)?$/iu,
  /^(?:credentials?|secrets?)(?:\.[^.]+)?$/iu,
]);

const TEXT_VIOLATIONS = Object.freeze([
  {
    label: 'RFC1918 address',
    pattern: /(?<![0-9A-Za-z.])(?:10\.(?:(?:[0-9]{1,3}|x)\.){2}(?:[0-9]{1,3}|x)|172\.(?:1[6-9]|2[0-9]|3[01])\.(?:[0-9]{1,3}|x)\.(?:[0-9]{1,3}|x)|192\.168\.(?:[0-9]{1,3}|x)\.(?:[0-9]{1,3}|x))(?![0-9A-Za-z.])/iu,
  },
  { label: 'absolute user/home path', pattern: /\/(?:Users|home)\//u },
  {
    label: 'host-specific absolute path',
    pattern: /\/(?:userdata|etc\/galbot|etc\/supervisor)\/|\/data\/bin(?:\/|\b)/u,
  },
  { label: 'runtime Luming API', pattern: /\/api\/luming\b/u },
  {
    label: 'known credential literal',
    pattern: /(?<![0-9A-Za-z@._-])(?:12345678|gb@2023|miracle666)(?![0-9A-Za-z@._-])/iu,
  },
  { label: 'known Wi-Fi SSID literal', pattern: /miracle-office-5g/iu },
  {
    label: 'non-empty textual password',
    pattern: /\bPassword\s*:\s*(?!unavailable|disabled|not-configured|none|null|empty)[^\s'"<>{}(),;]+/u,
  },
  {
    label: 'known device serial literal',
    pattern: /(?:GALBOT-116-GB105|R001GBD-2026040[1-7]|LUMOS-UMI-009|R001FBBCBABA0058|R002FBBCBABA0066|250801DR48FP26003296|250801DR48FP26003349)/u,
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
]);

function isPathInside(root, candidate) {
  const relativePath = path.relative(root, candidate);
  return relativePath !== ''
    && relativePath !== '..'
    && !relativePath.startsWith(`..${path.sep}`)
    && !path.isAbsolute(relativePath);
}

export function resolveInsideOutput(outputDirectory, relativeTarget) {
  const outputRoot = path.resolve(outputDirectory);
  if (typeof relativeTarget !== 'string' || relativeTarget.length === 0 || path.isAbsolute(relativeTarget)) {
    throw new TypeError('static output target must be a non-empty relative path');
  }

  const target = path.resolve(outputRoot, relativeTarget);
  if (!isPathInside(outputRoot, target)) {
    throw new Error(`refusing target outside the static output root: ${relativeTarget}`);
  }
  return target;
}

async function assertOutputRoot(outputDirectory) {
  const outputRoot = path.resolve(outputDirectory);
  if (path.basename(outputRoot) !== 'out') {
    throw new Error(`static output root must have basename "out": ${outputRoot}`);
  }

  const rootStats = await lstat(outputRoot);
  if (rootStats.isSymbolicLink() || !rootStats.isDirectory()) {
    throw new Error(`static output root must be a real directory: ${outputRoot}`);
  }

  const [realOutputRoot, realProjectPublic] = await Promise.all([
    realpath(outputRoot),
    realpath(path.resolve('public')),
  ]);
  if (realOutputRoot === realProjectPublic || isPathInside(realProjectPublic, realOutputRoot)) {
    throw new Error(`refusing to operate inside public source directory: ${outputRoot}`);
  }
  return realOutputRoot;
}

async function collectAuditViolations(outputRoot) {
  const violations = [];
  let filesScanned = 0;

  async function visit(currentDirectory) {
    const entries = await readdir(currentDirectory, { withFileTypes: true });
    for (const entry of entries) {
      const entryPath = path.join(currentDirectory, entry.name);
      const relativePath = path.relative(outputRoot, entryPath).replaceAll(path.sep, '/');
      const stats = await lstat(entryPath);

      if (stats.isSymbolicLink()) {
        violations.push(`${relativePath}: symbolic link`);
        continue;
      }
      if (stats.isDirectory()) {
        await visit(entryPath);
        continue;
      }
      if (!stats.isFile()) {
        violations.push(`${relativePath}: unsupported non-regular filesystem entry`);
        continue;
      }

      filesScanned += 1;
      const extension = path.extname(entry.name).toLowerCase();
      if (SECRET_FILE_PATTERNS.some((pattern) => pattern.test(entry.name))) {
        violations.push(`${relativePath}: forbidden secret-bearing filename`);
      }
      if (MEDIA_EXTENSIONS.has(extension)) {
        violations.push(`${relativePath}: forbidden media extension ${extension}`);
      }
      if (!ALLOWED_OUTPUT_EXTENSIONS.has(extension)) {
        violations.push(`${relativePath}: unsupported static output extension ${extension || '<none>'}`);
      }
      if (stats.size > MAX_FILE_BYTES) {
        violations.push(`${relativePath}: larger than 50 MiB (${stats.size} bytes)`);
      }
      if (stats.size > MAX_FILE_BYTES) continue;

      const source = await readFile(entryPath, 'utf8');
      for (const { label, pattern } of TEXT_VIOLATIONS) {
        if (pattern.test(source)) violations.push(`${relativePath}: ${label}`);
      }
    }
  }

  await visit(outputRoot);
  return { filesScanned, violations: violations.sort() };
}

export async function auditStaticExport(outputDirectory = 'out') {
  const outputRoot = await assertOutputRoot(outputDirectory);
  const result = await collectAuditViolations(outputRoot);
  if (result.violations.length > 0) {
    throw new Error(`static export safety violations:\n- ${result.violations.join('\n- ')}`);
  }
  return { outputRoot, filesScanned: result.filesScanned };
}

export async function sanitizeStaticExport(outputDirectory = 'out') {
  const outputRoot = await assertOutputRoot(outputDirectory);
  const removed = [];

  for (const relativeTarget of APPROVED_OUTPUT_ONLY_PATHS) {
    const target = resolveInsideOutput(outputRoot, relativeTarget);
    let stats;
    try {
      stats = await lstat(target);
    } catch (error) {
      if (error?.code === 'ENOENT') continue;
      throw error;
    }
    if (stats.isSymbolicLink()) {
      throw new Error(`refusing to remove symbolic link from static output: ${relativeTarget}`);
    }
    const realTarget = await realpath(target);
    if (!isPathInside(outputRoot, realTarget)) {
      throw new Error(`refusing generated path through a symlink outside static output: ${relativeTarget}`);
    }
    await rm(target, { recursive: true, force: false });
    removed.push(relativeTarget);
  }

  const audit = await auditStaticExport(outputRoot);
  return { ...audit, removed };
}

const isMain = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  try {
    const result = await sanitizeStaticExport(process.argv[2] || 'out');
    console.log(`STATIC_EXPORT_SANITIZED files=${result.filesScanned} removed=${result.removed.join(',') || 'none'}`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
