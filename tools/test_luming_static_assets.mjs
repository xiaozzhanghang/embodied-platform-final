import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, lstatSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
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

const expectedQualityReport = {
  session_name: 'session_028_demo',
  overall_pass: true,
  thresholds: {
    max_speed_mps: 0.45,
    max_accel_mps2: 5,
    max_jerk_mps3: 2200.73,
    max_angular_speed_rps: 2.5,
    max_angular_accel_rps2: 23,
    max_angular_jerk_rps3: 4000.41,
    min_position_distance_m: 0.05,
  },
  trajectory_analysis: [
    {
      arm_name: 'left',
      kinematics: {
        speed_max_mps: 0.42,
        accel_max_mps2: 1.2,
        jerk_max_mps3: 18.4,
        angular_speed_max_rps: 0.8,
        angular_accel_max_rps2: 4.6,
        angular_jerk_max_rps3: 120.5,
      },
      position: { max_distance_from_start_m: 0.31 },
      checks: {
        speed: true,
        accel: true,
        jerk: true,
        angular_speed: true,
        angular_accel: true,
        angular_jerk: true,
        max_pos_dist: true,
      },
    },
    {
      arm_name: 'right',
      kinematics: {
        speed_max_mps: 0.08,
        accel_max_mps2: 0.4,
        jerk_max_mps3: 6.2,
        angular_speed_max_rps: 0.3,
        angular_accel_max_rps2: 1.8,
        angular_jerk_max_rps3: 44.2,
      },
      position: { max_distance_from_start_m: 0.12 },
      checks: {
        speed: true,
        accel: true,
        jerk: true,
        angular_speed: true,
        angular_accel: true,
        angular_jerk: true,
        max_pos_dist: true,
      },
    },
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

function walkWithAncestors(node, visitor, ancestors = []) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (const item of node) walkWithAncestors(item, visitor, ancestors);
    return;
  }
  if (typeof node.type === 'string') visitor(node, ancestors);
  const nextAncestors = [...ancestors, node];
  for (const [key, value] of Object.entries(node)) {
    if (!['loc', 'start', 'end', 'extra'].includes(key)) walkWithAncestors(value, visitor, nextAncestors);
  }
}

function memberName(node) {
  if (node?.type !== 'MemberExpression' && node?.type !== 'OptionalMemberExpression') return null;
  if (node.computed && node.property?.type === 'StringLiteral') return node.property.value;
  if (node.computed && node.property?.type === 'Identifier') return node.property.name;
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

function containsIdentifier(node, name) {
  let found = false;
  walk(node, (candidate) => {
    if (candidate.type === 'Identifier' && candidate.name === name) found = true;
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

function callArguments(node, calleeName) {
  const matches = [];
  walk(node, (candidate) => {
    if (candidate.type === 'CallExpression' && candidate.callee?.type === 'Identifier' && candidate.callee.name === calleeName) {
      matches.push(candidate.arguments);
    }
  });
  return matches;
}

function hasCallWithArgument(node, calleeName, predicate) {
  return callArguments(node, calleeName).some((args) => predicate(args[0]));
}

function containsRefMethodCall(node, refName, methodName) {
  let found = false;
  walk(node, (candidate) => {
    const callee = candidate.type === 'CallExpression' ? candidate.callee : null;
    if (
      callee?.type === 'MemberExpression'
      && memberName(callee) === methodName
      && callee.object?.type === 'MemberExpression'
      && callee.object.object?.type === 'Identifier'
      && callee.object.object.name === refName
      && memberName(callee.object) === 'current'
    ) found = true;
  });
  return found;
}

function containsRefCurrentTimeReset(node, refName) {
  let found = false;
  walk(node, (candidate) => {
    const left = candidate.type === 'AssignmentExpression' ? candidate.left : null;
    if (
      left?.type === 'MemberExpression'
      && memberName(left) === 'currentTime'
      && left.object?.type === 'MemberExpression'
      && left.object.object?.type === 'Identifier'
      && left.object.object.name === refName
      && memberName(left.object) === 'current'
      && candidate.right?.type === 'NumericLiteral'
      && candidate.right.value === 0
    ) found = true;
  });
  return found;
}

function isLiteral(node, value) {
  if (value === null) return node?.type === 'NullLiteral';
  if (typeof value === 'string') return node?.type === 'StringLiteral' && node.value === value;
  if (typeof value === 'boolean') return node?.type === 'BooleanLiteral' && node.value === value;
  return false;
}

function qualityReportReasons(report) {
  return isDeepStrictEqual(report, expectedQualityReport) ? [] : ['quality-report.json differs from the complete deterministic object'];
}

function isPrivateIpv4(candidate) {
  const parts = candidate.split('.').map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  return parts[0] === 10
    || (parts[0] === 192 && parts[1] === 168)
    || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31);
}

function fixtureSafetyReasons(content) {
  const reasons = [];
  if (/(?:^|[\s"'=])(?:\/Users\/|\/home\/|\/private\/|\/var\/|\/tmp\/|\/Volumes\/|[A-Za-z]:\\)/m.test(content)) reasons.push('absolute user/private path');
  if (/(?:^|[\s"'=])\\\\[^\\\s]+\\[^\\\s]+/m.test(content)) reasons.push('UNC path');
  const ipv4Candidates = content.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g) || [];
  if (ipv4Candidates.some(isPrivateIpv4)) reasons.push('private IPv4 address');
  if (/(?:^|[^0-9a-f])(?:fc[0-9a-f]{2}|fd[0-9a-f]{2}|fe(?:8|9|a|b)[0-9a-f]):[0-9a-f:]+/i.test(content)) reasons.push('private/link-local IPv6 address');
  if (/\bAuthorization\s*:\s*Basic\s+[A-Za-z0-9+/=]+/i.test(content) || /\bBasic\s+[A-Za-z0-9+/]{8,}={0,2}\b/.test(content)) reasons.push('Basic authorization');
  if (/\bAuthorization\s*:\s*Bearer\s+\S+/i.test(content) || /\bBearer\s+[A-Za-z0-9._~+/-]{8,}/i.test(content)) reasons.push('Bearer authorization');
  if (/\b(?:username|user_name|login_user|user)\s*[=:]\s*[^\s,;]+/i.test(content)) reasons.push('username');
  if (/\b(?:password|passwd|credential|api[_-]?key|client[_-]?secret|access[_-]?token|refresh[_-]?token|secret|token)\b\s*[=:]\s*[^\s,;]+/i.test(content)) reasons.push('credential-like value');
  if (/\b(?:serial(?:_number)?|device[_-]?sn|sn)\s*[=:]\s*[A-Za-z0-9_-]{6,}\b/i.test(content)) reasons.push('device serial number');
  if (/\b\d{6}[A-Z]{2}\d{8,}\b/.test(content)) reasons.push('unlabelled device serial number');
  if (/\b(?=[A-Z0-9]{16,}\b)(?=[A-Z0-9]*[A-Z])(?=[A-Z0-9]*\d)[A-Z0-9]+\b/.test(content)) reasons.push('high-entropy device serial number');
  return reasons;
}

for (const unsafeProbe of [
  '/private/var/demo/session',
  '/var/log/demo.log',
  '/tmp/demo-session',
  '/Volumes/Collection/session',
  '\\\\server\\share',
  'username=alice',
  'user=alice',
  'peer=fd00::1',
  'peer=fc00::1',
  'peer=fe80::1',
  'Authorization: Basic dXNlcjpwYXNz',
  'Authorization: Bearer abcdefghijklmnop',
  'client_secret=demo-secret-value',
  'access_token=demo-access-token',
  'refresh_token=demo-refresh-token',
  'serial_number=ABC123456',
  'device_sn=SN987654',
  'R002FBBCBABA0066',
]) {
  check(fixtureSafetyReasons(unsafeProbe).length > 0, `fixture safety probe must be rejected: ${unsafeProbe}`);
}
for (const safeProbe of ['10.999.999.999', 'secretary', 'top secret recipe', 'ordinary robot demo prose']) {
  check(fixtureSafetyReasons(safeProbe).length === 0, `fixture safety probe must not be a false positive: ${safeProbe}`);
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
  for (const reason of fixtureSafetyReasons(content)) violations.push(`fixture contains ${reason}: ${fixturePath}`);
}

if (existsSync(path.join(fixtureDirectory, 'quality-report.json'))) {
  try {
    const report = JSON.parse(readFileSync(path.join(fixtureDirectory, 'quality-report.json'), 'utf8'));
    check(qualityReportReasons(report).length === 0, 'quality report must deep-equal the complete deterministic object');

    const badSpeed = structuredClone(report);
    badSpeed.trajectory_analysis[0].kinematics.speed_max_mps = 999;
    check(qualityReportReasons(badSpeed).length > 0, 'quality report mutation with speed=999 must be rejected');

    const missingThreshold = structuredClone(report);
    delete missingThreshold.thresholds.max_angular_jerk_rps3;
    check(qualityReportReasons(missingThreshold).length > 0, 'quality report mutation missing max_angular_jerk_rps3 must be rejected');
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
    for (const unknownKey of ['unknown', 'toString', 'constructor', '__proto__']) {
      let unknownKeyError = null;
      try { getLumingStaticAsset(unknownKey); } catch (error) { unknownKeyError = error; }
      check(unknownKeyError?.message === `Unknown Luming static asset: ${unknownKey}`, `getLumingStaticAsset must reject inherited/unknown key ${unknownKey} with the canonical error`);
    }

    const manifestAst = parse(readFileSync(manifestPath, 'utf8'));
    let usesOwnPropertyGuard = false;
    walk(manifestAst, (node) => {
      if (containsCall(node, 'Object', 'hasOwn') && containsMember(node, 'LUMING_STATIC_ASSETS', 'key')) usesOwnPropertyGuard = true;
    });
    check(usesOwnPropertyGuard, 'getLumingStaticAsset must guard keys with Object.hasOwn');
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

function analyzeDataLoadingContract(source) {
  const ast = parse(source);
  const promiseAllSettledCalls = [];
  const promiseAllCalls = [];
  let loadingEffect = null;
  let importsAlert = false;
  let rendersPartialAlert = false;
  let hasFullPageErrorGate = false;

  walk(ast, (node) => {
    if (node.type === 'ImportDeclaration' && node.source.value === 'antd') {
      importsAlert = node.specifiers.some((specifier) => specifier.imported?.name === 'Alert');
    }
    if (
      node.type === 'CallExpression'
      && node.callee?.type === 'MemberExpression'
      && node.callee.object?.type === 'Identifier'
      && node.callee.object.name === 'Promise'
    ) {
      if (memberName(node.callee) === 'allSettled') promiseAllSettledCalls.push(node);
      if (memberName(node.callee) === 'all') promiseAllCalls.push(node);
    }
    if (
      node.type === 'JSXElement'
      && node.openingElement.name?.name === 'Alert'
      && containsIdentifier(node, 'selectedEpisodeError')
      && containsIdentifier(node, 'retryRealData')
    ) {
      rendersPartialAlert = true;
    }
    if (node.type === 'ConditionalExpression' && containsIdentifier(node.test, 'selectedEpisodeError')) {
      let errorStateView = false;
      walk(node.consequent, (candidate) => {
        if (candidate.type !== 'JSXOpeningElement' || candidate.name?.name !== 'StateView') return;
        const typeAttribute = candidate.attributes.find((attribute) => attribute.type === 'JSXAttribute' && attribute.name.name === 'type');
        if (typeAttribute?.value?.type === 'StringLiteral' && typeAttribute.value.value === 'error') errorStateView = true;
      });
      if (errorStateView) hasFullPageErrorGate = true;
    }
  });

  if (promiseAllSettledCalls.length === 1) {
    walkWithAncestors(ast, (node, ancestors) => {
      if (node !== promiseAllSettledCalls[0]) return;
      loadingEffect = [...ancestors].reverse().find((ancestor) => (
        (ancestor.type === 'ArrowFunctionExpression' || ancestor.type === 'FunctionExpression')
        && ancestors.some((candidate) => (
          candidate.type === 'CallExpression'
          && candidate.callee?.type === 'Identifier'
          && candidate.callee.name === 'useEffect'
          && candidate.arguments[0] === ancestor
        ))
      ));
    });
  }

  const clearBeforeRequest = new Set();
  if (loadingEffect && promiseAllSettledCalls[0]) {
    for (const statement of loadingEffect.body.body || []) {
      if (statement.start >= promiseAllSettledCalls[0].start || statement.type !== 'ExpressionStatement') continue;
      const node = statement.expression;
      if (node.type !== 'CallExpression' || node.callee?.type !== 'Identifier') continue;
      if (node.callee.name === 'setRealReport' && isLiteral(node.arguments[0], null)) clearBeforeRequest.add('report');
      if (node.callee.name === 'setLeftTrajectory' && node.arguments[0]?.type === 'ArrayExpression' && node.arguments[0].elements.length === 0) clearBeforeRequest.add('left');
      if (node.callee.name === 'setRightTrajectory' && node.arguments[0]?.type === 'ArrayExpression' && node.arguments[0].elements.length === 0) clearBeforeRequest.add('right');
    }
  }

  const allSettled = promiseAllSettledCalls[0];
  const canonicalAllSettled = (
    promiseAllSettledCalls.length === 1
    && allSettled?.arguments[0]?.type === 'ArrayExpression'
    && allSettled.arguments[0].elements.length === 3
  );

  return {
    canonicalAllSettled,
    promiseAllSettledCount: promiseAllSettledCalls.length,
    promiseAllCount: promiseAllCalls.length,
    clearsAllSlicesBeforeRequest: clearBeforeRequest.size === 3,
    importsAlert,
    rendersPartialAlert,
    hasFullPageErrorGate,
    valid: canonicalAllSettled
      && promiseAllCalls.length === 0
      && clearBeforeRequest.size === 3
      && importsAlert
      && rendersPartialAlert
      && !hasFullPageErrorGate,
  };
}

function failedKeyIncludes(node, key) {
  let found = false;
  walk(node, (candidate) => {
    if (
      candidate.type === 'CallExpression'
      && candidate.callee?.type === 'MemberExpression'
      && candidate.callee.object?.type === 'Identifier'
      && candidate.callee.object.name === 'failedRealDataKeys'
      && memberName(candidate.callee) === 'includes'
      && candidate.arguments[0]?.type === 'StringLiteral'
      && candidate.arguments[0].value === key
    ) found = true;
  });
  return found;
}

function analyzeDataUnavailableContract(source) {
  const ast = parse(source);
  let hasFailedKeyState = false;
  let loadingEffect = null;
  let getSvgPathFunction = null;
  let getKinematicsDataFunction = null;
  let reportUnavailableBranch = false;
  let passBadgeGuardedByReportAvailability = false;
  let allSettledCall = null;

  walk(ast, (node) => {
    if (
      node.type === 'VariableDeclarator'
      && node.id?.type === 'ArrayPattern'
      && node.id.elements[0]?.name === 'failedRealDataKeys'
      && node.id.elements[1]?.name === 'setFailedRealDataKeys'
      && node.init?.type === 'CallExpression'
      && node.init.callee?.name === 'useState'
      && node.init.arguments[0]?.type === 'ArrayExpression'
      && node.init.arguments[0].elements.length === 0
    ) hasFailedKeyState = true;
    if (node.type === 'VariableDeclarator' && node.id?.name === 'getSvgPath' && node.init?.type === 'ArrowFunctionExpression') getSvgPathFunction = node.init;
    if (node.type === 'VariableDeclarator' && node.id?.name === 'getKinematicsData' && node.init?.type === 'ArrowFunctionExpression') getKinematicsDataFunction = node.init;
    if (
      node.type === 'CallExpression'
      && node.callee?.type === 'MemberExpression'
      && node.callee.object?.name === 'Promise'
      && memberName(node.callee) === 'allSettled'
    ) allSettledCall = node;
    if (node.type === 'ConditionalExpression' && failedKeyIncludes(node.test, 'report')) {
      let unavailableAlert = false;
      let successfulReportTable = false;
      walk(node.consequent, (candidate) => {
        if (candidate.type === 'JSXElement' && candidate.openingElement.name?.name === 'Alert' && source.slice(candidate.start, candidate.end).includes('质检报告不可用')) unavailableAlert = true;
      });
      walk(node.alternate, (candidate) => {
        if (candidate.type === 'JSXOpeningElement' && candidate.name?.name === 'Table') {
          const dataSource = candidate.attributes.find((attribute) => attribute.type === 'JSXAttribute' && attribute.name.name === 'dataSource');
          if (dataSource?.value?.type === 'JSXExpressionContainer' && containsCall(dataSource.value.expression, 'getKinematicsData')) successfulReportTable = true;
        }
      });
      if (unavailableAlert && successfulReportTable) reportUnavailableBranch = true;
    }
  });

  walkWithAncestors(ast, (node, ancestors) => {
    if (node.type !== 'JSXText' || !node.value.includes('所有检查通过')) return;
    if (ancestors.some((ancestor) => ancestor.type === 'LogicalExpression' && failedKeyIncludes(ancestor.left, 'report'))) {
      passBadgeGuardedByReportAvailability = true;
    }
  });

  if (allSettledCall) {
    walkWithAncestors(ast, (node, ancestors) => {
      if (node !== allSettledCall) return;
      loadingEffect = [...ancestors].reverse().find((ancestor) => (
        ancestor.type === 'ArrowFunctionExpression'
        && ancestors.some((candidate) => candidate.type === 'CallExpression' && candidate.callee?.name === 'useEffect' && candidate.arguments[0] === ancestor)
      ));
    });
  }

  let clearsFailedKeysBeforeRequest = false;
  let clearsFailedKeysWhenLeaving = false;
  let recordsRejectedKeys = false;
  if (loadingEffect && allSettledCall) {
    for (const statement of loadingEffect.body.body || []) {
      if (
        statement.type === 'ExpressionStatement'
        && statement.start < allSettledCall.start
        && hasCallWithArgument(statement, 'setFailedRealDataKeys', (argument) => argument?.type === 'ArrayExpression' && argument.elements.length === 0)
      ) clearsFailedKeysBeforeRequest = true;
      if (
        statement.type === 'IfStatement'
        && hasCallWithArgument(statement.consequent, 'setFailedRealDataKeys', (argument) => argument?.type === 'ArrayExpression' && argument.elements.length === 0)
      ) clearsFailedKeysWhenLeaving = true;
    }
    walk(loadingEffect.body, (node) => {
      if (
        node.type === 'CallExpression'
        && node.start > allSettledCall.start
        && node.callee?.type === 'Identifier'
        && node.callee.name === 'setFailedRealDataKeys'
        && node.arguments[0]?.type === 'CallExpression'
        && memberName(node.arguments[0].callee) === 'map'
        && ['report', 'trajectoryLeft', 'trajectoryRight'].every((key) => source.slice(allSettledCall.start, node.end).includes(`'${key}'`))
      ) recordsRejectedKeys = true;
    });
  }

  const emptySvgFallback = Boolean(getSvgPathFunction?.body?.body?.some((statement) => (
    statement.type === 'IfStatement'
    && containsIdentifier(statement.test, 'traj')
    && statement.consequent?.type === 'ReturnStatement'
    && isLiteral(statement.consequent.argument, '')
  )));
  const emptyKinematicsFallback = Boolean(getKinematicsDataFunction?.body?.body?.some((statement) => (
    statement.type === 'IfStatement'
    && containsIdentifier(statement.test, 'realReport')
    && statement.consequent?.type === 'ReturnStatement'
    && statement.consequent.argument?.type === 'ArrayExpression'
    && statement.consequent.argument.elements.length === 0
  )));
  const leftUnavailableCount = (source.match(/左臂轨迹不可用/g) || []).length;
  const rightUnavailableCount = (source.match(/右臂轨迹不可用/g) || []).length;
  const keepsBothTrajectoryPaths = source.includes("getSvgPath(leftTrajectory")
    && source.includes("getSvgPath(rightTrajectory")
    && source.includes("getSpeedPath(leftTrajectory")
    && source.includes("getSpeedPath(rightTrajectory");

  return {
    valid: hasFailedKeyState
      && clearsFailedKeysBeforeRequest
      && clearsFailedKeysWhenLeaving
      && recordsRejectedKeys
      && emptySvgFallback
      && emptyKinematicsFallback
      && reportUnavailableBranch
      && passBadgeGuardedByReportAvailability
      && leftUnavailableCount >= 2
      && rightUnavailableCount >= 2
      && keepsBothTrajectoryPaths,
    hasFailedKeyState,
    clearsFailedKeysBeforeRequest,
    clearsFailedKeysWhenLeaving,
    recordsRejectedKeys,
    emptySvgFallback,
    emptyKinematicsFallback,
    reportUnavailableBranch,
    passBadgeGuardedByReportAvailability,
    leftUnavailableCount,
    rightUnavailableCount,
    keepsBothTrajectoryPaths,
  };
}

const dataClientPath = 'src/app/collection/collect/data/ClientPage.js';
if (existsSync(dataClientPath)) {
  const dataSource = readFileSync(dataClientPath, 'utf8');
  const ast = parse(dataSource);
  const loadingContract = analyzeDataLoadingContract(dataSource);
  const unavailableContract = analyzeDataUnavailableContract(dataSource);
  check(loadingContract.promiseAllSettledCount === 1 && loadingContract.canonicalAllSettled, 'data Client must contain exactly one canonical Promise.allSettled call');
  check(loadingContract.promiseAllCount === 0, 'data Client must not contain Promise.all');
  check(loadingContract.clearsAllSlicesBeforeRequest, 'data Client must clear report, left trajectory, and right trajectory before starting each request');
  check(loadingContract.importsAlert && loadingContract.rendersPartialAlert, 'data Client must render selectedEpisodeError as an in-content retryable Alert');
  check(!loadingContract.hasFullPageErrorGate, 'data Client must not gate selectedEpisode content behind an error StateView');
  check(unavailableContract.valid, `data Client must expose failed report/trajectory slices without synthetic fallback: ${JSON.stringify(unavailableContract)}`);
  const badPromiseAllMutation = `${dataSource}\nPromise.all([]);\n`;
  check(!analyzeDataLoadingContract(badPromiseAllMutation).valid, 'data loading contract must reject a Promise.all mutation');
  const hardcodedSvgMutation = dataSource.replace('if (!traj || traj.length === 0) return "";', 'if (!traj || traj.length === 0) return "M 50 55 Q 85 10 120 40 T 160 30";');
  check(hardcodedSvgMutation !== dataSource && !analyzeDataUnavailableContract(hardcodedSvgMutation).valid, 'data unavailable contract must reject restoring a synthetic trajectory path');
  const hardcodedKinematicsMutation = dataSource.replace('if (!realReport) return [];', "if (!realReport) return [{ key: 'synthetic' }];");
  check(hardcodedKinematicsMutation !== dataSource && !analyzeDataUnavailableContract(hardcodedKinematicsMutation).valid, 'data unavailable contract must reject restoring synthetic kinematics rows');
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

function hasRequestTokenGuard(functionNode) {
  let guarded = false;
  walk(functionNode.body, (node) => {
    if (node.type !== 'IfStatement' || node.test?.type !== 'BinaryExpression' || !['!==', '!='].includes(node.test.operator)) return;
    const comparesToken = (
      containsMember(node.test.left, 'fileRequestTokenRef', 'current') && containsIdentifier(node.test.right, 'requestToken')
    ) || (
      containsMember(node.test.right, 'fileRequestTokenRef', 'current') && containsIdentifier(node.test.left, 'requestToken')
    );
    if (!comparesToken) return;
    let returns = node.consequent?.type === 'ReturnStatement';
    walk(node.consequent, (candidate) => {
      if (candidate.type === 'ReturnStatement') returns = true;
    });
    if (returns) guarded = true;
  });
  return guarded;
}

function incrementsFileRequestToken(node) {
  return node?.type === 'AssignmentExpression'
    && ['+=', '='].includes(node.operator)
    && containsMember(node.left, 'fileRequestTokenRef', 'current')
    && (
      node.operator === '+='
      || (node.right?.type === 'BinaryExpression' && node.right.operator === '+' && containsMember(node.right, 'fileRequestTokenRef', 'current'))
    );
}

function analyzeVideoRequestContract(source) {
  const ast = parse(source);
  let hasTokenRef = false;
  let onSelectHandler = null;
  let episodeEffect = null;
  let treeSelectedKeysIsNullable = false;
  walk(ast, (node) => {
    if (
      node.type === 'VariableDeclarator'
      && node.id?.type === 'Identifier'
      && node.id.name === 'fileRequestTokenRef'
      && node.init?.type === 'CallExpression'
      && node.init.callee?.type === 'Identifier'
      && node.init.callee.name === 'useRef'
      && node.init.arguments[0]?.type === 'NumericLiteral'
      && node.init.arguments[0].value === 0
    ) hasTokenRef = true;
    if (node.type === 'JSXOpeningElement' && node.name?.name === 'Tree') {
      const attribute = node.attributes.find((candidate) => candidate.type === 'JSXAttribute' && candidate.name.name === 'onSelect');
      if (attribute?.value?.type === 'JSXExpressionContainer' && attribute.value.expression?.type === 'ArrowFunctionExpression') {
        onSelectHandler = attribute.value.expression;
      }
      const selectedKeysAttribute = node.attributes.find((candidate) => candidate.type === 'JSXAttribute' && candidate.name.name === 'selectedKeys');
      const selectedExpression = selectedKeysAttribute?.value?.type === 'JSXExpressionContainer' ? selectedKeysAttribute.value.expression : null;
      if (
        selectedExpression?.type === 'ConditionalExpression'
        && containsIdentifier(selectedExpression.test, 'selectedFileKey')
        && selectedExpression.consequent?.type === 'ArrayExpression'
        && selectedExpression.consequent.elements.some((element) => element?.type === 'Identifier' && element.name === 'selectedFileKey')
        && selectedExpression.alternate?.type === 'ArrayExpression'
        && selectedExpression.alternate.elements.length === 0
      ) treeSelectedKeysIsNullable = true;
    }
    if (
      node.type === 'CallExpression'
      && node.callee?.type === 'Identifier'
      && node.callee.name === 'useEffect'
      && node.arguments[0]?.type === 'ArrowFunctionExpression'
      && node.arguments[1]?.type === 'ArrayExpression'
      && node.arguments[1].elements.some((element) => element?.type === 'Identifier' && element.name === 'episodeId')
    ) {
      episodeEffect = node.arguments[0];
    }
  });

  if (!onSelectHandler) return { valid: false, hasTokenRef, hasOnSelect: false };

  let fetchCall = null;
  let fetchChain = null;
  let tokenInvalidation = null;
  let clearsNonTextImmediately = false;
  let emptySelectionClearsKey = false;
  walk(onSelectHandler.body, (node) => {
    if (node.type === 'CallExpression' && node.callee?.type === 'Identifier' && node.callee.name === 'fetch') fetchCall = node;
    if (node.type === 'CallExpression' && memberName(node.callee) === 'finally' && containsCall(node, 'fetch')) fetchChain = node;
    if (
      node.type === 'AssignmentExpression'
      && containsMember(node.left, 'fileRequestTokenRef', 'current')
      && containsIdentifier(node.right, 'requestToken')
    ) tokenInvalidation = node;
    if (node.type === 'IfStatement' && containsMember(node.test, 'node', 'isText') && node.alternate) {
      const clearsContent = hasCallWithArgument(node.alternate, 'setFileContent', (argument) => isLiteral(argument, ''));
      const clearsLoading = hasCallWithArgument(node.alternate, 'setLoadingFileContent', (argument) => isLiteral(argument, false));
      if (clearsContent && clearsLoading) clearsNonTextImmediately = true;
    }
    if (
      node.type === 'IfStatement'
      && containsMember(node.test, 'keys', 'length')
      && node.alternate
      && hasCallWithArgument(node.alternate, 'setSelectedFileKey', (argument) => isLiteral(argument, null))
    ) emptySelectionClearsKey = true;
  });

  let episodeEffectInvalidatesAtStart = false;
  let episodeEffectCleanupInvalidates = false;
  let episodeEffectResetsSelection = false;
  if (episodeEffect?.body?.type === 'BlockStatement') {
    const [firstStatement] = episodeEffect.body.body;
    episodeEffectInvalidatesAtStart = firstStatement?.type === 'ExpressionStatement' && incrementsFileRequestToken(firstStatement.expression);
    const cleanup = episodeEffect.body.body.find((statement) => statement.type === 'ReturnStatement')?.argument;
    if (cleanup?.type === 'ArrowFunctionExpression' || cleanup?.type === 'FunctionExpression') {
      episodeEffectCleanupInvalidates = containsCall(cleanup.body, 'setFileContent') ? false : (() => {
        let invalidates = false;
        walk(cleanup.body, (node) => {
          if (incrementsFileRequestToken(node)) invalidates = true;
        });
        return invalidates;
      })();
    }
    episodeEffectResetsSelection = (
      hasCallWithArgument(episodeEffect.body, 'setSelectedFileKey', (argument) => isLiteral(argument, 'left_video'))
      && hasCallWithArgument(episodeEffect.body, 'setSelectedFileNode', (argument) => argument?.type === 'Identifier' && argument.name === 'node')
      && hasCallWithArgument(episodeEffect.body, 'setFileContent', (argument) => isLiteral(argument, ''))
      && hasCallWithArgument(episodeEffect.body, 'setLoadingFileContent', (argument) => isLiteral(argument, false))
      && hasCallWithArgument(episodeEffect.body, 'setIsPlaying', (argument) => isLiteral(argument, true))
      && hasCallWithArgument(episodeEffect.body, 'setFrame', (argument) => argument?.type === 'NumericLiteral' && argument.value === 0)
    );
  }

  const chainCallbacks = [];
  if (fetchChain) {
    walk(fetchChain, (node) => {
      if (node.type !== 'CallExpression') return;
      for (const argument of node.arguments) {
        if (argument?.type === 'ArrowFunctionExpression' || argument?.type === 'FunctionExpression') chainCallbacks.push(argument);
      }
    });
  }
  const contentCallbacks = chainCallbacks.filter((callback) => containsCall(callback.body, 'setFileContent'));
  const loadingCallbacks = chainCallbacks.filter((callback) => hasCallWithArgument(callback.body, 'setLoadingFileContent', (argument) => isLiteral(argument, false)));
  const guardedContentCallbacks = contentCallbacks.filter(hasRequestTokenGuard);
  const guardedLoadingCallbacks = loadingCallbacks.filter(hasRequestTokenGuard);

  return {
    valid: hasTokenRef
      && Boolean(fetchCall && fetchChain && tokenInvalidation)
      && tokenInvalidation.start < fetchCall.start
      && contentCallbacks.length === 2
      && guardedContentCallbacks.length === 2
      && loadingCallbacks.length === 1
      && guardedLoadingCallbacks.length === 1
      && clearsNonTextImmediately
      && episodeEffectInvalidatesAtStart
      && episodeEffectCleanupInvalidates
      && episodeEffectResetsSelection
      && emptySelectionClearsKey
      && treeSelectedKeysIsNullable,
    hasTokenRef,
    hasOnSelect: true,
    invalidatesBeforeFetch: Boolean(fetchCall && tokenInvalidation && tokenInvalidation.start < fetchCall.start),
    contentCallbackCount: contentCallbacks.length,
    guardedContentCallbackCount: guardedContentCallbacks.length,
    loadingCallbackCount: loadingCallbacks.length,
    guardedLoadingCallbackCount: guardedLoadingCallbacks.length,
    clearsNonTextImmediately,
    episodeEffectInvalidatesAtStart,
    episodeEffectCleanupInvalidates,
    episodeEffectResetsSelection,
    emptySelectionClearsKey,
    treeSelectedKeysIsNullable,
  };
}

const videoClientPath = 'src/app/collection/collect/video/ClientPage.js';
if (existsSync(videoClientPath)) {
  const source = readFileSync(videoClientPath, 'utf8');
  const ast = parse(source);
  const requestContract = analyzeVideoRequestContract(source);
  check(requestContract.valid, `file preview request token contract failed: ${JSON.stringify(requestContract)}`);
  const unguardedMutation = source.replaceAll('if (fileRequestTokenRef.current !== requestToken) return;', '');
  check(unguardedMutation !== source && !analyzeVideoRequestContract(unguardedMutation).valid, 'file preview contract must reject removing real fetch callback token guards');
  const missingEpisodeInvalidationMutation = source.replace('fileRequestTokenRef.current += 1;', '');
  check(missingEpisodeInvalidationMutation !== source && !analyzeVideoRequestContract(missingEpisodeInvalidationMutation).valid, 'file preview contract must reject removing episode-change token invalidation');
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

function analyzeDevicePreviewReachability(source) {
  const ast = parse(source);
  let ruleTable = null;
  let rowPreviewCallReachable = false;
  let parentCallbackOpensModal = false;
  let modalContainsPlaceholder = false;

  walk(ast, (node) => {
    if (node.type === 'FunctionDeclaration' && node.id?.name === 'RuleTable') ruleTable = node;
    if (node.type === 'JSXOpeningElement' && node.name?.name === 'RuleTable') {
      const previewAttribute = node.attributes.find((attribute) => attribute.type === 'JSXAttribute' && attribute.name.name === 'onPreviewVideo');
      if (previewAttribute?.value?.type === 'JSXExpressionContainer' && containsCall(previewAttribute.value.expression, 'setPreviewVideoUrl')) {
        parentCallbackOpensModal = true;
      }
    }
  });

  if (ruleTable) {
    walkWithAncestors(ruleTable, (node, ancestors) => {
      if (
        node.type === 'CallExpression'
        && node.callee?.type === 'Identifier'
        && node.callee.name === 'onPreviewVideo'
        && node.arguments[0]?.type === 'MemberExpression'
        && node.arguments[0].object?.name === 'record'
        && memberName(node.arguments[0]) === 'coverVideo'
        && ancestors.some((ancestor) => containsMember(ancestor.type === 'LogicalExpression' ? ancestor.left : null, 'record', 'coverVideo'))
      ) rowPreviewCallReachable = true;
    });
  }

  walk(ast, (node) => {
    if (node.type !== 'JSXElement' || node.openingElement.name?.name !== 'AppModal') return;
    const openAttribute = node.openingElement.attributes.find((attribute) => attribute.type === 'JSXAttribute' && attribute.name.name === 'open');
    if (!openAttribute?.value || !containsIdentifier(openAttribute.value, 'previewVideoUrl')) return;
    let containsPlaceholder = false;
    walk(node, (candidate) => {
      if (candidate.type === 'JSXOpeningElement' && candidate.name?.name === 'StaticVideoPlaceholder') containsPlaceholder = true;
    });
    if (containsPlaceholder) modalContainsPlaceholder = true;
  });

  return {
    valid: Boolean(ruleTable && rowPreviewCallReachable && parentCallbackOpensModal && modalContainsPlaceholder),
    rowPreviewCallReachable,
    parentCallbackOpensModal,
    modalContainsPlaceholder,
  };
}

const deviceTypesPath = 'src/app/collection/device-types/page.js';
if (existsSync(deviceTypesPath)) {
  const deviceSource = readFileSync(deviceTypesPath, 'utf8');
  const previewContract = analyzeDevicePreviewReachability(deviceSource);
  check(previewContract.valid, `device cover preview must be reachable from the RuleTable row action: ${JSON.stringify(previewContract)}`);
  const removedPreviewMutation = deviceSource.replace('onClick={() => onPreviewVideo(record.coverVideo)}', 'onClick={() => {}}');
  check(removedPreviewMutation !== deviceSource && !analyzeDevicePreviewReachability(removedPreviewMutation).valid, 'device preview contract must reject deleting the row preview call');
}

const workspaceSource = readFileSync('src/app/collection/collect/workspace/ClientPage.js', 'utf8');
check((workspaceSource.match(/静态演示占位/g) || []).length === 3, 'workspace camera overlays must label all three views as static demo placeholders');
check(!workspaceSource.includes('Live Stream'), 'workspace must not label static placeholders as live streams');
const videoSourceForLabels = readFileSync(videoClientPath, 'utf8');
check(videoSourceForLabels.includes('静态演示（无 MP4）'), 'video file preview must label video nodes as static demo without MP4');
check(!videoSourceForLabels.includes('Video Stream (MP4)'), 'video file preview must not claim an MP4 stream');

function findBindingFunction(ast, bindingName) {
  let binding = null;
  walk(ast, (node) => {
    if (
      node.type === 'VariableDeclarator'
      && node.id?.type === 'Identifier'
      && node.id.name === bindingName
      && (node.init?.type === 'ArrowFunctionExpression' || node.init?.type === 'FunctionExpression')
    ) binding = node.init;
  });
  return binding;
}

function analyzeCatalogSilentReset(source) {
  const ast = parse(source);
  const resetPlaybackState = findBindingFunction(ast, 'resetPlaybackState');
  const resetAll = findBindingFunction(ast, 'resetAll');
  const handleBack = findBindingFunction(ast, 'handleBack');
  const silentResetIsSilent = Boolean(
    resetPlaybackState
    && !containsCall(resetPlaybackState.body, 'message', 'info')
    && hasCallWithArgument(resetPlaybackState.body, 'setIsPlaying', (argument) => isLiteral(argument, false))
    && containsRefMethodCall(resetPlaybackState.body, 'leftVideoRef', 'pause')
    && containsRefMethodCall(resetPlaybackState.body, 'rightVideoRef', 'pause')
    && containsRefMethodCall(resetPlaybackState.body, 'headVideoRef', 'pause')
    && containsRefCurrentTimeReset(resetPlaybackState.body, 'leftVideoRef')
    && containsRefCurrentTimeReset(resetPlaybackState.body, 'rightVideoRef')
    && containsRefCurrentTimeReset(resetPlaybackState.body, 'headVideoRef')
  );
  const resetAllKeepsManualGuard = Boolean(
    resetAll
    && containsMember(resetAll.body, 'selectedCard', 'isLuming')
    && containsCall(resetAll.body, 'message', 'info')
    && containsCall(resetAll.body, 'resetPlaybackState')
  );
  const backUsesSilentReset = Boolean(
    handleBack
    && containsCall(handleBack.body, 'resetPlaybackState')
    && !containsCall(handleBack.body, 'resetAll')
    && !containsCall(handleBack.body, 'message', 'info')
  );
  return {
    valid: silentResetIsSilent && resetAllKeepsManualGuard && backUsesSilentReset,
    silentResetIsSilent,
    resetAllKeepsManualGuard,
    backUsesSilentReset,
  };
}

const catalogPath = 'src/app/data/catalog/page.js';
if (existsSync(catalogPath)) {
  const catalogSource = readFileSync(catalogPath, 'utf8');
  const ast = parse(catalogSource);
  const silentResetContract = analyzeCatalogSilentReset(catalogSource);
  check(silentResetContract.valid, `catalog handleBack must use a silent playback reset: ${JSON.stringify(silentResetContract)}`);
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
