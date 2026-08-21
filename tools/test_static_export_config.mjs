import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

const [
  { default: nextConfig },
  packageSource,
  readmeSource,
  handoverSource,
  netlifySource,
  gitignoreSource,
] = await Promise.all([
  import(pathToFileURL('next.config.mjs').href),
  readFile('package.json', 'utf8'),
  readFile('README.md', 'utf8'),
  readFile('docs/release_notes_and_ops_handover.md', 'utf8'),
  readFile('netlify.toml', 'utf8'),
  readFile('.gitignore', 'utf8'),
]);

const pkg = JSON.parse(packageSource);
const violations = [];
const check = (condition, message) => {
  if (!condition) violations.push(message);
};

check(
  isDeepStrictEqual(nextConfig, { output: 'export', trailingSlash: true }),
  'next.config.mjs must export only output="export" and trailingSlash=true',
);
check(nextConfig.output === 'export', 'nextConfig.output must be "export"');
check(nextConfig.trailingSlash === true, 'nextConfig.trailingSlash must be true');
check(nextConfig.basePath === undefined, 'nextConfig.basePath must remain unset');
check(nextConfig.assetPrefix === undefined, 'nextConfig.assetPrefix must remain unset');
check(pkg.scripts?.build === 'next build', 'package build script must remain exactly "next build"');
check(
  pkg.scripts?.start === 'npx --yes serve@14.2.4 out',
  'package start script must be exactly "npx --yes serve@14.2.4 out"',
);
check(
  pkg.dependencies?.serve === undefined && pkg.devDependencies?.serve === undefined,
  'serve must not be added as a package dependency',
);

const activeGitignoreLines = gitignoreSource
  .split(/\r?\n/u)
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith('#'));
check(activeGitignoreLines.includes('/out/'), '.gitignore must contain an active exact /out/ rule');

const activeNetlifyLines = netlifySource
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
  {
    pattern: /(?:server|\u670d\u52a1\u8fdb\u7a0b|\u670d\u52a1\u7aef)[^\n]{0,80}(?:rollback|\u56de\u6eda)|(?:rollback|\u56de\u6eda)[^\n]{0,80}(?:server|\u670d\u52a1\u8fdb\u7a0b|\u670d\u52a1\u7aef)/iu,
    label: 'server-process rollback',
  },
];

for (const [documentName, documentSource] of [
  ['README.md', readmeSource],
  ['docs/release_notes_and_ops_handover.md', handoverSource],
]) {
  const normalizedSource = documentSource.replaceAll('\r\n', '\n');
  check(
    normalizedSource.includes(exactWorkflow),
    `${documentName} must contain the exact npm ci/build/start workflow`,
  );
  for (const statement of requiredDeploymentStatements) {
    check(normalizedSource.includes(statement), `${documentName} must contain: ${statement}`);
  }
  for (const { pattern, label } of forbiddenDeploymentInstructions) {
    check(!pattern.test(normalizedSource), `${documentName} must not instruct ${label}`);
  }
}

assert.deepEqual(violations, [], `static export contract violations:\n- ${violations.join('\n- ')}`);
console.log('STATIC_EXPORT_CONFIG_OK');
