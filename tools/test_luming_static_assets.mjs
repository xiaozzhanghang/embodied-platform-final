import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, lstatSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import babelParser from 'next/dist/compiled/babel/parser.js';

const fixtureNames = [
  'quality-report.json',
  'trajectory-left.json',
  'trajectory-right.json',
  'check.log',
  'quality-report.txt',
  'timestamps-left.csv',
  'timestamps-right.csv',
  'queue-left.csv',
  'queue-right.csv',
  'transforms-left-to-right.txt',
  'transforms-right-to-left.txt',
];

const expectedManifest = {
  report: '/demo/session_028/quality-report.json',
  trajectoryLeft: '/demo/session_028/trajectory-left.json',
  trajectoryRight: '/demo/session_028/trajectory-right.json',
  checkLog: '/demo/session_028/check.log',
  reportText: '/demo/session_028/quality-report.txt',
  timestampsLeft: '/demo/session_028/timestamps-left.csv',
  timestampsRight: '/demo/session_028/timestamps-right.csv',
  queueLeft: '/demo/session_028/queue-left.csv',
  queueRight: '/demo/session_028/queue-right.csv',
  transformsLeftToRight: '/demo/session_028/transforms-left-to-right.txt',
  transformsRightToLeft: '/demo/session_028/transforms-right-to-left.txt',
};

const expectedFileAssetKeys = {
  check_log: 'checkLog',
  report_txt: 'reportText',
  report_json: 'report',
  left_timestamps: 'timestampsLeft',
  right_timestamps: 'timestampsRight',
  left_queue: 'queueLeft',
  right_queue: 'queueRight',
  transforms_lr: 'transformsLeftToRight',
  transforms_rl: 'transformsRightToLeft',
};

const expectedTextFixtures = {
  'check.log': '[2026-08-21 10:00:00] DEMO session=session_028_demo\n[2026-08-21 10:00:01] CHECK trajectory continuity: PASS\n[2026-08-21 10:00:02] CHECK synchronized timestamps: PASS\n',
  'quality-report.txt': 'Session: session_028_demo\nMode: PUBLIC STATIC FIXTURE\nTrajectory continuity: PASS\nTimestamp synchronization: PASS\nOverall status: PASS\n',
  'timestamps-left.csv': 'frame_id,timestamp,system_time\n0,0.000,0.005\n1,0.033,0.038\n2,0.066,0.071\n',
  'timestamps-right.csv': 'frame_id,timestamp,system_time\n0,0.000,0.006\n1,0.033,0.039\n2,0.066,0.072\n',
  'queue-left.csv': 'timestamp,queue_size,drop_count\n0.000,1,0\n0.100,2,0\n0.200,1,0\n',
  'queue-right.csv': 'timestamp,queue_size,drop_count\n0.000,1,0\n0.100,1,0\n0.200,2,0\n',
  'transforms-left-to-right.txt': 'timestamp,tx,ty,tz,qx,qy,qz,qw\n0.000,0.452,-0.122,0.892,0,0,0.707,0.707\n0.033,0.453,-0.121,0.893,0,0,0.707,0.707\n0.066,0.455,-0.120,0.895,0,0,0.706,0.708\n',
  'transforms-right-to-left.txt': 'timestamp,tx,ty,tz,qx,qy,qz,qw\n0.000,-0.452,0.122,-0.892,0,0,-0.707,0.707\n0.033,-0.453,0.121,-0.893,0,0,-0.707,0.707\n0.066,-0.455,0.120,-0.895,0,0,-0.706,0.708\n',
};

const expectedTrajectories = {
  'trajectory-left.json': [
    { time: 0, x: 0.10, y: 0.20, z: 0.30, qx: 0, qy: 0, qz: 0, qw: 1, speed: 0 },
    { time: 0.1, x: 0.12, y: 0.21, z: 0.33, qx: 0, qy: 0, qz: 0.01, qw: 0.999, speed: 0.38 },
    { time: 0.2, x: 0.15, y: 0.22, z: 0.36, qx: 0, qy: 0, qz: 0.02, qw: 0.998, speed: 0.44 },
  ],
  'trajectory-right.json': [
    { time: 0, x: 0.40, y: 0.20, z: 0.30, qx: 0, qy: 0, qz: 0, qw: 1, speed: 0 },
    { time: 0.1, x: 0.405, y: 0.21, z: 0.33, qx: 0, qy: 0, qz: 0.01, qw: 0.999, speed: 0.38 },
    { time: 0.2, x: 0.41, y: 0.22, z: 0.36, qx: 0, qy: 0, qz: 0.02, qw: 0.998, speed: 0.44 },
  ],
};

const violations = [];
const check = (condition, message) => {
  if (!condition) violations.push(message);
};

function collectFiles(directory, predicate = () => true) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectFiles(entryPath, predicate);
    return predicate(entryPath) ? [entryPath.replaceAll('\\', '/')] : [];
  });
}

function parse(source) {
  return babelParser.parse(source, { sourceType: 'module', plugins: ['jsx'] });
}

function walk(node, visitor, parent = null) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (const item of node) walk(item, visitor, parent);
    return;
  }
  if (typeof node.type === 'string') visitor(node, parent);
  for (const [key, value] of Object.entries(node)) {
    if (!['loc', 'start', 'end', 'extra'].includes(key)) walk(value, visitor, node);
  }
}

function memberName(node) {
  if (node?.type !== 'MemberExpression' && node?.type !== 'OptionalMemberExpression') return null;
  if (node.computed && node.property?.type === 'StringLiteral') return node.property.value;
  if (!node.computed && node.property?.type === 'Identifier') return node.property.name;
  return null;
}

function containsMember(node, objectName, propertyName) {
  let found = false;
  walk(node, (candidate) => {
    if (
      (candidate.type === 'MemberExpression' || candidate.type === 'OptionalMemberExpression')
      && candidate.object?.type === 'Identifier'
      && candidate.object.name === objectName
      && memberName(candidate) === propertyName
    ) found = true;
  });
  return found;
}

function containsCall(node, calleeObject, calleeProperty, firstStringArgument) {
  let found = false;
  walk(node, (candidate) => {
    if (candidate.type !== 'CallExpression' && candidate.type !== 'OptionalCallExpression') return;
    const callee = candidate.callee;
    const matchesCallee = calleeProperty === undefined
      ? callee?.type === 'Identifier' && callee.name === calleeObject
      : (
        (callee?.type === 'MemberExpression' || callee?.type === 'OptionalMemberExpression')
        && callee.object?.type === 'Identifier'
        && callee.object.name === calleeObject
        && memberName(callee) === calleeProperty
      );
    if (!matchesCallee) return;
    if (firstStringArgument === undefined || candidate.arguments[0]?.value === firstStringArgument) found = true;
  });
  return found;
}

const fixtureDirectory = 'public/demo/session_028';
check(
  JSON.stringify(collectFiles(fixtureDirectory).map((filePath) => path.basename(filePath)).sort()) === JSON.stringify([...fixtureNames].sort()),
  'public/demo/session_028 must contain exactly the eleven declared fixtures',
);
for (const name of fixtureNames) {
  const fixturePath = path.join(fixtureDirectory, name);
  if (!existsSync(fixturePath)) {
    violations.push(`missing fixture: ${fixturePath}`);
    continue;
  }
  const stat = lstatSync(fixturePath);
  check(stat.isFile() && !stat.isSymbolicLink(), `fixture must be a regular file: ${fixturePath}`);
  check(stat.size < 100 * 1024, `fixture must be smaller than 100 KB: ${fixturePath}`);
  const content = readFileSync(fixturePath, 'utf8');
  if (expectedTextFixtures[name]) check(content === expectedTextFixtures[name], `fixture content must match the deterministic contract: ${fixturePath}`);
  if (expectedTrajectories[name]) {
    try {
      check(JSON.stringify(JSON.parse(content)) === JSON.stringify(expectedTrajectories[name]), `trajectory fixture must match the deterministic records: ${fixturePath}`);
    } catch (error) {
      violations.push(`trajectory fixture must be valid JSON: ${fixturePath} (${error.message})`);
    }
  }
  check(!/(?:^|[\s"'])(?:\/Users\/|\/home\/|[A-Za-z]:\\)/m.test(content), `fixture contains an absolute user path: ${fixturePath}`);
  check(!/\b(?:10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2})\b/.test(content), `fixture contains a private IP: ${fixturePath}`);
  check(!/(?:password|passwd|credential|api[_-]?key|secret|bearer\s+|token\s*[=:])/i.test(content), `fixture contains a credential-like value: ${fixturePath}`);
  check(!/\b\d{6}[A-Z]{2}\d{8,}\b/.test(content), `fixture contains a device serial number: ${fixturePath}`);
}

if (existsSync(path.join(fixtureDirectory, 'quality-report.json'))) {
  try {
    const report = JSON.parse(readFileSync(path.join(fixtureDirectory, 'quality-report.json'), 'utf8'));
    check(report.session_name === 'session_028_demo' && report.overall_pass === true, 'quality report must use the public demo identity and passing result');
    check(JSON.stringify(Object.keys(report.thresholds)) === JSON.stringify([
      'max_speed_mps', 'max_accel_mps2', 'max_jerk_mps3', 'max_angular_speed_rps',
      'max_angular_accel_rps2', 'max_angular_jerk_rps3', 'min_position_distance_m',
    ]), 'quality report must contain the complete threshold shape');
    check(report.trajectory_analysis?.length === 2, 'quality report must contain left and right trajectory analysis');
    for (const arm of ['left', 'right']) {
      const analysis = report.trajectory_analysis.find((item) => item.arm_name === arm);
      check(Boolean(analysis?.kinematics && analysis?.position && analysis?.checks), `quality report must contain complete ${arm} analysis fields`);
      check(Object.values(analysis?.checks || {}).every((value) => value === true), `quality report ${arm} checks must use deterministic passing values`);
    }
  } catch (error) {
    violations.push(`quality report must be valid JSON: ${error.message}`);
  }
}

const manifestPath = 'src/lib/lumingStaticAssets.mjs';
if (!existsSync(manifestPath)) {
  violations.push(`missing manifest: ${manifestPath}`);
} else {
  try {
    const { LUMING_STATIC_ASSETS, getLumingStaticAsset } = await import(`${pathToFileURL(path.resolve(manifestPath)).href}?test=${Date.now()}`);
    check(Object.isFrozen(LUMING_STATIC_ASSETS), 'LUMING_STATIC_ASSETS must be frozen');
    check(JSON.stringify(LUMING_STATIC_ASSETS) === JSON.stringify(expectedManifest), 'LUMING_STATIC_ASSETS keys and URLs must match the exact public fixture manifest');
    check(Object.values(LUMING_STATIC_ASSETS).every((url) => url.startsWith('/demo/session_028/')), 'manifest URLs must remain under /demo/session_028/');
    for (const [key, url] of Object.entries(expectedManifest)) {
      check(getLumingStaticAsset(key) === url, `getLumingStaticAsset must resolve ${key}`);
    }
    let unknownKeyThrows = false;
    try { getLumingStaticAsset('unknown'); } catch (error) { unknownKeyThrows = /Unknown Luming static asset: unknown/.test(error.message); }
    check(unknownKeyThrows, 'getLumingStaticAsset must reject an unknown key');
  } catch (error) {
    violations.push(`manifest could not be loaded: ${error.message}`);
  }
}

const apiRoutes = collectFiles('src/app/api', (filePath) => path.basename(filePath) === 'route.js');
check(apiRoutes.length === 0, `runtime API routes remain: ${apiRoutes.join(', ')}`);

const trackedPaths = execFileSync('git', ['ls-files', '-z', '--', 'src', 'public'], { encoding: 'utf8' }).split('\0').filter(Boolean);
const trackedSymlinks = trackedPaths.filter((filePath) => lstatSync(filePath, { throwIfNoEntry: false })?.isSymbolicLink());
check(trackedSymlinks.length === 0, `tracked/static symlinks remain: ${trackedSymlinks.join(', ')}`);
check(!lstatSync('public/session_028', { throwIfNoEntry: false }), 'public/session_028 must not exist');

const forbiddenReferences = [
  ['/api/luming', /\/api\/luming/],
  ['session_028 video.mp4', /\/session_028\/[^\s"'`]*video\.mp4/],
  ['/assets/videos/', /\/assets\/videos\//],
  ['/videos/session_028_', /\/videos\/session_028_/],
  ['chopsticks-reference.png', /chopsticks-reference\.png/],
];
const scannableTrackedFiles = trackedPaths.filter((filePath) => {
  const stat = lstatSync(filePath, { throwIfNoEntry: false });
  if (!stat || stat.isSymbolicLink()) return false;
  return /\.(?:js|jsx|mjs|ts|tsx|css|json|txt|csv|log|md)$/i.test(filePath);
});
for (const filePath of scannableTrackedFiles) {
  const source = readFileSync(filePath, 'utf8');
  for (const [label, pattern] of forbiddenReferences) {
    if (pattern.test(source)) violations.push(`non-portable reference ${label}: ${filePath}`);
  }
}

for (const assetPath of ['public/assets/robot_view.png', 'public/assets/images/robot_schematic.png']) {
  check(existsSync(assetPath), `tracked placeholder asset is missing: ${assetPath}`);
  if (existsSync(assetPath)) check(lstatSync(assetPath).isFile() && !lstatSync(assetPath).isSymbolicLink(), `placeholder asset must be a regular file: ${assetPath}`);
  check(trackedPaths.includes(assetPath), `placeholder asset must be tracked: ${assetPath}`);
}

const dataClientPath = 'src/app/collection/collect/data/ClientPage.js';
if (existsSync(dataClientPath)) {
  const ast = parse(readFileSync(dataClientPath, 'utf8'));
  let allSettledCall = null;
  walk(ast, (node) => {
    if (
      node.type === 'CallExpression'
      && node.callee?.type === 'MemberExpression'
      && node.callee.object?.type === 'Identifier'
      && node.callee.object.name === 'Promise'
      && memberName(node.callee) === 'allSettled'
    ) allSettledCall = node;
  });
  check(Boolean(allSettledCall), 'data Client must load report and trajectories with Promise.allSettled');
  if (allSettledCall?.arguments[0]?.type === 'ArrayExpression') {
    const loadedKeys = [];
    walk(allSettledCall.arguments[0], (node, parent) => {
      if (
        (node.type === 'MemberExpression' || node.type === 'OptionalMemberExpression')
        && node.object?.type === 'Identifier'
        && node.object.name === 'LUMING_STATIC_ASSETS'
        && parent?.type === 'CallExpression'
        && parent.callee?.type === 'Identifier'
        && parent.callee.name === 'fetch'
      ) loadedKeys.push(memberName(node));
    });
    check(JSON.stringify(loadedKeys) === JSON.stringify(['report', 'trajectoryLeft', 'trajectoryRight']), 'Promise.allSettled must independently fetch report, trajectoryLeft, and trajectoryRight');
  } else if (allSettledCall) {
    violations.push('Promise.allSettled must receive an explicit three-request array');
  }

  for (const [resultName, setterName] of [
    ['reportResult', 'setRealReport'],
    ['leftResult', 'setLeftTrajectory'],
    ['rightResult', 'setRightTrajectory'],
  ]) {
    let independentApply = false;
    walk(ast, (node) => {
      if (node.type !== 'IfStatement') return;
      if (!containsMember(node.test, resultName, 'status')) return;
      if (!containsCall(node.consequent, setterName)) return;
      if (!containsMember(node.consequent, resultName, 'value')) return;
      independentApply = true;
    });
    check(independentApply, `${setterName} must apply its fulfilled allSettled result independently`);
  }
  let combinesRejectedReasons = false;
  walk(ast, (node) => {
    if (node.type === 'IfStatement' && /rejected/.test(readFileSync(dataClientPath, 'utf8').slice(node.start, node.end)) && containsCall(node.consequent, 'setRealDataError')) {
      combinesRejectedReasons = true;
    }
  });
  check(combinesRejectedReasons, 'data Client must combine rejected result reasons into realDataError');
}

const videoClientPath = 'src/app/collection/collect/video/ClientPage.js';
if (existsSync(videoClientPath)) {
  const source = readFileSync(videoClientPath, 'utf8');
  const ast = parse(source);
  const fileAssetMap = {};
  let readFileResponseFunction = null;
  walk(ast, (node) => {
    if (node.type === 'VariableDeclarator' && node.id?.type === 'Identifier' && node.id.name === 'fileAssetKeys' && node.init?.type === 'ObjectExpression') {
      for (const property of node.init.properties) {
        if (property.type === 'ObjectProperty') fileAssetMap[property.key.name || property.key.value] = property.value.value;
      }
    }
    if (node.type === 'FunctionDeclaration' && node.id?.name === 'readFileResponse') readFileResponseFunction = node;
  });
  check(JSON.stringify(fileAssetMap) === JSON.stringify(expectedFileAssetKeys), 'fileAssetKeys must match the exact static preview key map');
  check(Boolean(readFileResponseFunction), 'file preview must use a readFileResponse helper');
  if (readFileResponseFunction) {
    const statements = readFileResponseFunction.body.body;
    const statusCheckIndex = statements.findIndex((statement) => statement.type === 'IfStatement' && containsMember(statement.test, 'response', 'ok'));
    const parseIndex = statements.findIndex((statement) => containsCall(statement, 'response', 'json') || containsCall(statement, 'response', 'text'));
    check(statusCheckIndex >= 0 && parseIndex > statusCheckIndex, 'file preview must check response.ok before response.json() or response.text()');
  }
}

const placeholderPath = 'src/components/StaticVideoPlaceholder.js';
if (!existsSync(placeholderPath)) {
  violations.push(`missing placeholder component: ${placeholderPath}`);
} else {
  const source = readFileSync(placeholderPath, 'utf8');
  const ast = parse(source);
  let imagePathFound = false;
  let videoElementFound = false;
  walk(ast, (node) => {
    if (node.type === 'JSXOpeningElement' && node.name?.name === 'video') videoElementFound = true;
    if (node.type === 'StringLiteral' && node.value === '/assets/robot_view.png') imagePathFound = true;
  });
  check(imagePathFound, 'StaticVideoPlaceholder must use /assets/robot_view.png');
  check(!videoElementFound && !/\.mp4\b/.test(source), 'StaticVideoPlaceholder must never load a video URL');
  check(source.includes('静态包未包含真实采集视频'), 'StaticVideoPlaceholder must explain the static video boundary');
}

const placeholderConsumers = new Map([
  ['src/app/collection/collect/data/ClientPage.js', 1],
  ['src/app/collection/collect/video/ClientPage.js', 1],
  ['src/app/collection/collect/workspace/ClientPage.js', 3],
  ['src/app/collection/device-types/page.js', 1],
  ['src/app/data/catalog/page.js', 2],
]);
for (const [filePath, minimumCount] of placeholderConsumers) {
  const ast = parse(readFileSync(filePath, 'utf8'));
  let importsPlaceholder = false;
  let placeholderCount = 0;
  let videoCount = 0;
  walk(ast, (node) => {
    if (node.type === 'ImportDeclaration' && node.source.value === '@/components/StaticVideoPlaceholder') importsPlaceholder = true;
    if (node.type === 'JSXOpeningElement' && node.name?.name === 'StaticVideoPlaceholder') placeholderCount += 1;
    if (node.type === 'JSXOpeningElement' && node.name?.name === 'video') videoCount += 1;
  });
  check(importsPlaceholder, `${filePath} must import StaticVideoPlaceholder`);
  check(placeholderCount >= minimumCount, `${filePath} must render at least ${minimumCount} StaticVideoPlaceholder instance(s)`);
  check(videoCount === 0, `${filePath} must not retain video elements`);
}

const catalogPath = 'src/app/data/catalog/page.js';
if (existsSync(catalogPath)) {
  const ast = parse(readFileSync(catalogPath, 'utf8'));
  const requiredControls = new Set(['播放全部', '暂停全部', '重置全部']);
  const disabledControls = new Set();
  let guardedStaticDownload = false;
  walk(ast, (node) => {
    if (node.type !== 'JSXElement' || node.openingElement.name?.name !== 'Button') return;
    const label = node.children.filter((child) => child.type === 'JSXText').map((child) => child.value.trim()).join('');
    const disabledAttribute = node.openingElement.attributes.find((attribute) => attribute.type === 'JSXAttribute' && attribute.name.name === 'disabled');
    if (requiredControls.has(label) && disabledAttribute?.value?.type === 'JSXExpressionContainer' && containsMember(disabledAttribute.value.expression, 'selectedCard', 'isLuming')) {
      disabledControls.add(label);
    }
    if (label === '下载') {
      const onClick = node.openingElement.attributes.find((attribute) => attribute.type === 'JSXAttribute' && attribute.name.name === 'onClick');
      if (
        onClick?.value?.type === 'JSXExpressionContainer'
        && containsMember(onClick.value.expression, 'card', 'isLuming')
        && containsCall(onClick.value.expression, 'message', 'info', '静态演示包不包含真实视频下载')
      ) guardedStaticDownload = true;
    }
  });
  check(disabledControls.size === requiredControls.size, 'catalog play, pause, and reset controls must be disabled for Luming cards');
  check(guardedStaticDownload, 'catalog Luming download must show the static-package information message');
}

assert.deepEqual(violations, [], `Luming static asset contract failed:\n- ${violations.join('\n- ')}`);
console.log('LUMING_STATIC_ASSETS_OK');
