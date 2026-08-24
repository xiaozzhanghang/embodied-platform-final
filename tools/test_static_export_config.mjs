import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

const [
  { default: nextConfig },
  packageSource,
  packageLockSource,
  nextPackageSource,
  readmeSource,
  handoverSource,
  netlifySource,
  gitignoreSource,
] = await Promise.all([
  import(pathToFileURL('next.config.mjs').href),
  readFile('package.json', 'utf8'),
  readFile('package-lock.json', 'utf8'),
  readFile('node_modules/next/package.json', 'utf8'),
  readFile('README.md', 'utf8'),
  readFile('docs/release_notes_and_ops_handover.md', 'utf8'),
  readFile('netlify.toml', 'utf8'),
  readFile('.gitignore', 'utf8'),
]);

const pkg = JSON.parse(packageSource);
const packageLock = JSON.parse(packageLockSource);
const nextPkg = JSON.parse(nextPackageSource);

const exactWorkflow = '```bash\nnpm ci\nnpm run build\nnpm start\n```';
const requiredDeploymentStatements = [
  '- **可部署目录**：`out/`',
  '- **部署根路径**：`/`',
  '- **Luming 数据说明**：页面仅使用可公开发布的合成 fixture，不包含真实采集数据。',
  '- **回滚方式**：重新部署上一份已归档的 `out/` 静态产物。',
];
const forbiddenDeploymentInstructions = [
  { pattern: /\bnext\s+start\b/iu, label: 'next start' },
  { pattern: /\bpm2\b/iu, label: 'PM2' },
  { pattern: /\bk8s\b|kubernetes/iu, label: 'K8s/Kubernetes server runtime' },
  { pattern: /\bdocker\b/iu, label: 'Docker server deployment' },
  { pattern: /\bcontainers?\b|\bcontainerized\b|\u5bb9\u5668(?:\u5316|\u7f16\u6392|\u90e8\u7f72|\u8fd0\u884c)?/iu, label: 'container server deployment' },
  { pattern: /\bnode\s+server\.js\b/iu, label: 'node server.js deployment' },
  {
    pattern: /(?:server|\u670d\u52a1\u8fdb\u7a0b|\u670d\u52a1\u7aef)[^\n]{0,80}(?:rollback|\u56de\u6eda)|(?:rollback|\u56de\u6eda)[^\n]{0,80}(?:server|\u670d\u52a1\u8fdb\u7a0b|\u670d\u52a1\u7aef)/iu,
    label: 'server-process rollback',
  },
];

function visibleMarkdown(source) {
  return source.replace(/<!--[\s\S]*?-->/gu, '').replaceAll('\r\n', '\n');
}

function collectContractViolations({
  nextConfigValue = nextConfig,
  pkgValue = pkg,
  packageLockValue = packageLock,
  nextPkgValue = nextPkg,
  readmeValue = readmeSource,
  handoverValue = handoverSource,
  netlifyValue = netlifySource,
  gitignoreValue = gitignoreSource,
} = {}) {
  const violations = [];
  const check = (condition, message) => {
    if (!condition) violations.push(message);
  };

  check(
    isDeepStrictEqual(nextConfigValue, { output: 'export', trailingSlash: true }),
    'next.config.mjs must export only output="export" and trailingSlash=true',
  );
  check(nextConfigValue.output === 'export', 'nextConfig.output must be "export"');
  check(nextConfigValue.trailingSlash === true, 'nextConfig.trailingSlash must be true');
  check(nextConfigValue.basePath === undefined, 'nextConfig.basePath must remain unset');
  check(nextConfigValue.assetPrefix === undefined, 'nextConfig.assetPrefix must remain unset');
  check(pkgValue.engines?.node === '>=20.9.0', 'package engines.node must be exactly ">=20.9.0"');
  check(
    packageLockValue.packages?.['']?.engines?.node === pkgValue.engines?.node,
    'package-lock root Node minimum must match package.json',
  );
  check(nextPkgValue.engines?.node === '>=20.9.0', 'installed Next.js metadata must require Node >=20.9.0');
  check(
    pkgValue.engines?.node === nextPkgValue.engines?.node,
    'package Node minimum must match installed Next.js metadata',
  );
  check(pkgValue.scripts?.build === 'next build', 'package build script must remain exactly "next build"');
  check(
    pkgValue.scripts?.postbuild === 'node tools/sanitize_static_export.mjs',
    'package postbuild script must be exactly "node tools/sanitize_static_export.mjs"',
  );
  check(
    pkgValue.scripts?.start === 'npx --yes serve@14.2.4 out',
    'package start script must be exactly "npx --yes serve@14.2.4 out"',
  );
  check(
    pkgValue.dependencies?.serve === undefined && pkgValue.devDependencies?.serve === undefined,
    'serve must not be added as a package dependency',
  );

  const activeGitignoreLines = gitignoreValue
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));
  check(activeGitignoreLines.includes('/out/'), '.gitignore must contain an active exact /out/ rule');

  const activeNetlifyLines = netlifyValue
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));
  check(
    activeNetlifyLines.some((line, index) => (
      line === 'package = "@netlify/plugin-nextjs"'
      && activeNetlifyLines[index - 1] === '[[plugins]]'
    )),
    'netlify.toml must retain the active @netlify/plugin-nextjs plugin',
  );

  for (const [documentName, documentSource] of [
    ['README.md', readmeValue],
    ['docs/release_notes_and_ops_handover.md', handoverValue],
  ]) {
    const visibleSource = visibleMarkdown(documentSource);
    check(
      visibleSource.includes(exactWorkflow),
      `${documentName} visible content must contain the exact npm ci/build/start workflow`,
    );
    for (const statement of requiredDeploymentStatements) {
      check(visibleSource.includes(statement), `${documentName} visible content must contain: ${statement}`);
    }
    for (const { pattern, label } of forbiddenDeploymentInstructions) {
      check(!pattern.test(visibleSource), `${documentName} visible content must not instruct ${label}`);
    }
  }

  const visibleReadme = visibleMarkdown(readmeValue);
  const visibleHandover = visibleMarkdown(handoverValue);
  check(
    visibleReadme.includes('- **\u5bfc\u51fa\u5b89\u5168\u51c0\u5316**\uff1a`npm run build` \u4f1a\u81ea\u52a8\u6e05\u7406\u672c\u673a\u5a92\u4f53\u526f\u672c\u5e76\u5b89\u5168\u68c0\u67e5 `out/`\uff1b\u4ec5\u90e8\u7f72\u68c0\u67e5\u901a\u8fc7\u7684\u4ea7\u7269\u3002'),
    'README.md must explain automatic postbuild sanitization and sanitized-only deployment',
  );
  check(
    visibleHandover.includes('- **\u53d1\u5e03\u5206\u652f**\uff1a`codex/nextjs-static-export`'),
    'handover must name codex/nextjs-static-export as the release branch',
  );
  check(!visibleHandover.includes('99a8eae'), 'handover must not retain old SHA 99a8eae');
  check(!visibleHandover.includes('release/v1.2.0'), 'handover must not retain old release/v1.2.0 branch');
  check(visibleHandover.includes('Node.js >= 20.9.0'), 'handover must require Node.js >= 20.9.0');
  check(visibleHandover.includes('git rev-parse HEAD'), 'handover must verify the local final SHA before release');
  check(
    visibleHandover.includes('git ls-remote origin refs/heads/codex/nextjs-static-export'),
    'handover must verify the remote final SHA before release',
  );
  check(visibleHandover.includes('\u672c\u5730\u4e0e\u8fdc\u7aef SHA \u5fc5\u987b\u4e00\u81f4'), 'handover must require matching local and remote SHA values');
  check(
    visibleHandover.includes('> **\u80fd\u529b\u8fb9\u754c**\uff1a\u4ee5\u4e0b\u529f\u80fd\u5747\u4e3a fixture-driven \u9759\u6001\u6f14\u793a\uff1b\u672a\u63a5\u5165\u540e\u7aef\u3001\u9274\u6743\u3001\u6301\u4e45\u5316\u3001\u7ed3\u7b97\u6216\u771f\u5b9e\u5bfc\u51fa\u3002'),
    'handover feature list must declare the fixture-driven static-demo boundary',
  );
  for (const forbiddenClaim of [
    '\u65b0\u529f\u80fd\u4e0a\u7ebf',
    '\u65b0\u7cfb\u7edf\u4e0a\u7ebf',
    '\u4e0a\u7ebf\u5b8c\u6210\u786e\u8ba4',
    '\u751f\u4ea7\u73af\u5883\u5192\u70df\u6d4b\u8bd5',
    '\u81ea\u52a8\u6d41\u8f6c\u81f3',
    '\u5b9e\u65f6\u8ffd\u8e2a',
    '\u4e00\u952e\u6253\u5305\u5f52\u6863\u4e0e\u5bfc\u51fa',
  ]) {
    check(!visibleHandover.includes(forbiddenClaim), `handover must not claim live capability: ${forbiddenClaim}`);
  }

  return violations;
}

function assertMutationRejected(label, overrides, expectedViolation) {
  const mutationViolations = collectContractViolations(overrides);
  assert.ok(
    mutationViolations.some((violation) => violation.includes(expectedViolation)),
    `${label} mutation must be rejected with ${expectedViolation}; got:\n${mutationViolations.join('\n')}`,
  );
}

assertMutationRejected(
  'HTML-comment-only documentation',
  { readmeValue: `<!--\n${readmeSource}\n-->` },
  'README.md visible content must contain the exact npm ci/build/start workflow',
);
assertMutationRejected(
  'Docker deployment instruction',
  { readmeValue: `${readmeSource}\nDeploy with Docker container.\n` },
  'Docker server deployment',
);
assertMutationRejected(
  'stale release SHA',
  { handoverValue: `${handoverSource}\nCommit ID: 99a8eae\n` },
  'old SHA 99a8eae',
);
assertMutationRejected(
  'Node 20.0 minimum',
  {
    pkgValue: { ...pkg, engines: { ...pkg.engines, node: '>=20.0.0' } },
    handoverValue: handoverSource.replaceAll('20.9.0', '20.0.0'),
  },
  'package engines.node must be exactly ">=20.9.0"',
);
assertMutationRejected(
  'stale package-lock Node minimum',
  {
    packageLockValue: {
      ...packageLock,
      packages: {
        ...packageLock.packages,
        '': {
          ...packageLock.packages[''],
          engines: { node: '>=20.0.0' },
        },
      },
    },
  },
  'package-lock root Node minimum must match package.json',
);
console.log('STATIC_EXPORT_CONFIG_MUTATION_PROBES_OK');

const violations = collectContractViolations();
assert.deepEqual(violations, [], `static export contract violations:\n- ${violations.join('\n- ')}`);
console.log('STATIC_EXPORT_CONFIG_OK');
