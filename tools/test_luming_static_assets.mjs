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

function getDefaultExportedComponent(ast, expectedName) {
  const defaultExports = ast.program.body.filter((node) => node.type === 'ExportDefaultDeclaration');
  if (defaultExports.length !== 1) return null;

  const declaration = defaultExports[0].declaration;
  let component = null;
  if (declaration?.type === 'FunctionDeclaration') {
    component = declaration;
  } else if (declaration?.type === 'Identifier') {
    for (const statement of ast.program.body) {
      if (statement.type === 'FunctionDeclaration' && statement.id?.name === declaration.name) component = statement;
      if (statement.type !== 'VariableDeclaration') continue;
      const declarator = statement.declarations.find((candidate) => candidate.id?.type === 'Identifier' && candidate.id.name === declaration.name);
      if (declarator && ['ArrowFunctionExpression', 'FunctionExpression'].includes(declarator.init?.type)) component = declarator.init;
    }
  }

  const componentName = component?.id?.name || declaration?.name;
  if (!component || componentName !== expectedName || component.body?.type !== 'BlockStatement') return null;
  const directReturns = component.body.body.filter((statement) => statement.type === 'ReturnStatement');
  const returnJsx = directReturns.length === 1 && ['JSXElement', 'JSXFragment'].includes(directReturns[0].argument?.type)
    ? directReturns[0].argument
    : null;
  return {
    component,
    body: component.body,
    statements: component.body.body,
    returnJsx,
  };
}

function getDirectVariableDeclarator(componentContext, bindingName) {
  if (!componentContext) return null;
  for (const statement of componentContext.statements) {
    if (statement.type !== 'VariableDeclaration') continue;
    const declarator = statement.declarations.find((candidate) => (
      (candidate.id?.type === 'Identifier' && candidate.id.name === bindingName)
      || (candidate.id?.type === 'ArrayPattern' && candidate.id.elements.some((element) => element?.type === 'Identifier' && element.name === bindingName))
    ));
    if (declarator) return declarator;
  }
  return null;
}

function getDirectHookCalls(componentContext, hookName) {
  if (!componentContext) return [];
  return componentContext.statements.flatMap((statement) => {
    if (
      statement.type === 'ExpressionStatement'
      && statement.expression?.type === 'CallExpression'
      && statement.expression.callee?.type === 'Identifier'
      && statement.expression.callee.name === hookName
    ) return [statement.expression];
    return [];
  });
}

function hasExactDependencies(call, dependencyNames) {
  const dependencies = call?.arguments[1];
  return dependencies?.type === 'ArrayExpression'
    && dependencies.elements.length === dependencyNames.length
    && dependencies.elements.every((element, index) => element?.type === 'Identifier' && element.name === dependencyNames[index]);
}

function jsxAttribute(openingElement, attributeName) {
  return openingElement?.attributes?.find((attribute) => attribute.type === 'JSXAttribute' && attribute.name.name === attributeName) || null;
}

function containsRenderedText(node, text) {
  let found = false;
  walk(node, (candidate) => {
    if (candidate.type === 'JSXText' && candidate.value.includes(text)) found = true;
    if (candidate.type === 'StringLiteral' && candidate.value.includes(text)) found = true;
  });
  return found;
}

function containsExactString(node, value) {
  let found = false;
  walk(node, (candidate) => {
    if (candidate.type === 'StringLiteral' && candidate.value === value) found = true;
  });
  return found;
}

function collectPromiseCalls(node, methodName) {
  const calls = [];
  walk(node, (candidate) => {
    if (
      candidate.type === 'CallExpression'
      && candidate.callee?.type === 'MemberExpression'
      && candidate.callee.object?.type === 'Identifier'
      && candidate.callee.object.name === 'Promise'
      && memberName(candidate.callee) === methodName
    ) calls.push(candidate);
  });
  return calls;
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
  const componentContext = getDefaultExportedComponent(ast, 'CollectTaskDataPage');
  const directEffects = getDirectHookCalls(componentContext, 'useEffect');
  const promiseAllSettledCalls = directEffects.flatMap((effect) => collectPromiseCalls(effect.arguments[0]?.body, 'allSettled'));
  const promiseAllCalls = directEffects.flatMap((effect) => collectPromiseCalls(effect.arguments[0]?.body, 'all'));
  const loadingEffects = directEffects.filter((effect) => collectPromiseCalls(effect.arguments[0]?.body, 'allSettled').length > 0);
  const loadingEffect = loadingEffects.length === 1 ? loadingEffects[0].arguments[0] : null;
  const allSettled = promiseAllSettledCalls.length === 1 ? promiseAllSettledCalls[0] : null;
  const importsAlert = ast.program.body.some((node) => (
    node.type === 'ImportDeclaration'
    && node.source.value === 'antd'
    && node.specifiers.some((specifier) => specifier.imported?.name === 'Alert')
  ));
  let rendersPartialAlert = false;
  let hasFullPageErrorGate = false;

  walk(componentContext?.returnJsx, (node) => {
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

  const clearBeforeRequest = new Set();
  if (loadingEffect && allSettled) {
    for (const statement of loadingEffect.body.body || []) {
      if (statement.start >= allSettled.start || statement.type !== 'ExpressionStatement') continue;
      const node = statement.expression;
      if (node.type !== 'CallExpression' || node.callee?.type !== 'Identifier') continue;
      if (node.callee.name === 'setRealReport' && isLiteral(node.arguments[0], null)) clearBeforeRequest.add('report');
      if (node.callee.name === 'setLeftTrajectory' && node.arguments[0]?.type === 'ArrayExpression' && node.arguments[0].elements.length === 0) clearBeforeRequest.add('left');
      if (node.callee.name === 'setRightTrajectory' && node.arguments[0]?.type === 'ArrayExpression' && node.arguments[0].elements.length === 0) clearBeforeRequest.add('right');
    }
  }

  const canonicalAllSettled = (
    Boolean(componentContext)
    && loadingEffects.length === 1
    && promiseAllSettledCalls.length === 1
    && allSettled?.arguments[0]?.type === 'ArrayExpression'
    && allSettled.arguments[0].elements.length === 3
  );
  const loadedKeys = [];
  if (canonicalAllSettled) {
    for (const request of allSettled.arguments[0].elements) {
      if (
        request?.type !== 'CallExpression'
        || memberName(request.callee) !== 'then'
        || request.callee.object?.type !== 'CallExpression'
        || request.callee.object.callee?.type !== 'Identifier'
        || request.callee.object.callee.name !== 'fetch'
      ) continue;
      const asset = request.callee.object.arguments[0];
      if (asset?.type === 'MemberExpression' && asset.object?.name === 'LUMING_STATIC_ASSETS') loadedKeys.push(memberName(asset));
    }
  }

  const independentlyApplied = new Set();
  if (loadingEffect) {
    for (const [resultName, setterName] of [
      ['reportResult', 'setRealReport'],
      ['leftResult', 'setLeftTrajectory'],
      ['rightResult', 'setRightTrajectory'],
    ]) {
      walk(loadingEffect.body, (node) => {
        if (
          node.type === 'IfStatement'
          && containsMember(node.test, resultName, 'status')
          && containsCall(node.consequent, setterName)
          && containsMember(node.consequent, resultName, 'value')
        ) independentlyApplied.add(setterName);
      });
    }
  }

  let combinesRejectedReasons = false;
  if (loadingEffect) {
    walk(loadingEffect.body, (node) => {
      if (
        node.type === 'IfStatement'
        && containsIdentifier(node.test, 'rejectedResults')
        && containsCall(node.consequent, 'setRealDataError')
      ) combinesRejectedReasons = true;
    });
  }

  return {
    hasTargetComponent: Boolean(componentContext),
    canonicalAllSettled,
    promiseAllSettledCount: promiseAllSettledCalls.length,
    promiseAllCount: promiseAllCalls.length,
    clearsAllSlicesBeforeRequest: clearBeforeRequest.size === 3,
    importsAlert,
    rendersPartialAlert,
    hasFullPageErrorGate,
    loadedKeys,
    independentlyAppliedCount: independentlyApplied.size,
    combinesRejectedReasons,
    valid: canonicalAllSettled
      && promiseAllCalls.length === 0
      && clearBeforeRequest.size === 3
      && importsAlert
      && rendersPartialAlert
      && !hasFullPageErrorGate
      && JSON.stringify(loadedKeys) === JSON.stringify(['report', 'trajectoryLeft', 'trajectoryRight'])
      && independentlyApplied.size === 3
      && combinesRejectedReasons,
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

function returnsEmptyStringForMissingTrajectory(functionNode) {
  const [firstStatement] = executableStatements(functionNode?.body);
  return Boolean(
    firstStatement?.type === 'IfStatement'
    && containsIdentifier(firstStatement.test, 'traj')
    && containsMember(firstStatement.test, 'traj', 'length')
    && firstStatement.consequent?.type === 'ReturnStatement'
    && isLiteral(firstStatement.consequent.argument, '')
  );
}

function isExactFailedKeyTest(node, key) {
  return node?.type === 'CallExpression'
    && node.callee?.type === 'MemberExpression'
    && node.callee.object?.type === 'Identifier'
    && node.callee.object.name === 'failedRealDataKeys'
    && memberName(node.callee) === 'includes'
    && node.arguments.length === 1
    && node.arguments[0]?.type === 'StringLiteral'
    && node.arguments[0].value === key;
}

function executableStatements(blockStatement) {
  return blockStatement?.type === 'BlockStatement'
    ? blockStatement.body.filter((statement) => statement.type !== 'EmptyStatement')
    : [];
}

function pathUsesDataCall(openingElement, functionName, trajectoryName) {
  if (openingElement?.name?.name !== 'path') return false;
  const dataAttribute = jsxAttribute(openingElement, 'd');
  const expression = dataAttribute?.value?.type === 'JSXExpressionContainer' ? dataAttribute.value.expression : null;
  return expression?.type === 'CallExpression'
    && expression.callee?.type === 'Identifier'
    && expression.callee.name === functionName
    && expression.arguments[0]?.type === 'Identifier'
    && expression.arguments[0].name === trajectoryName;
}

function findSmallestDataPanel(root, functionName) {
  const candidates = [];
  walk(root, (node) => {
    if (node.type !== 'JSXElement' || node.openingElement.name?.name !== 'div') return;
    let left = false;
    let right = false;
    walk(node, (candidate) => {
      if (candidate.type !== 'JSXOpeningElement') return;
      if (pathUsesDataCall(candidate, functionName, 'leftTrajectory')) left = true;
      if (pathUsesDataCall(candidate, functionName, 'rightTrajectory')) right = true;
    });
    if (left && right) candidates.push(node);
  });
  candidates.sort((left, right) => (left.end - left.start) - (right.end - right.start));
  return candidates[0] || null;
}

function panelHasUnavailableGuard(panel, key, label) {
  let found = false;
  walk(panel, (node) => {
    if (
      node.type === 'ConditionalExpression'
      && failedKeyIncludes(node.test, key)
      && (containsExactString(node.consequent, label) || containsExactString(node.alternate, label))
    ) found = true;
  });
  return found;
}

function staticTruthValue(node) {
  if (node?.type === 'BooleanLiteral') return node.value;
  if (node?.type === 'NullLiteral') return false;
  if (node?.type === 'NumericLiteral') return Boolean(node.value);
  if (node?.type === 'StringLiteral') return Boolean(node.value);
  if (node?.type === 'UnaryExpression' && node.operator === '!') {
    const argumentValue = staticTruthValue(node.argument);
    return argumentValue === null ? null : !argumentValue;
  }
  return null;
}

function subtreeContainsNode(root, target) {
  let found = false;
  walk(root, (node) => {
    if (node === target) found = true;
  });
  return found;
}

function isStaticallyUnreachable(target, ancestors) {
  for (const ancestor of ancestors) {
    if (ancestor.type === 'LogicalExpression') {
      const leftValue = staticTruthValue(ancestor.left);
      const targetInRight = subtreeContainsNode(ancestor.right, target);
      if (targetInRight && ((ancestor.operator === '&&' && leftValue === false) || (ancestor.operator === '||' && leftValue === true))) return true;
    }
    if (ancestor.type === 'ConditionalExpression') {
      const testValue = staticTruthValue(ancestor.test);
      if (testValue === false && subtreeContainsNode(ancestor.consequent, target)) return true;
      if (testValue === true && subtreeContainsNode(ancestor.alternate, target)) return true;
    }
  }
  return false;
}

function hasReachableDirectSvgPath(panel, functionName, trajectoryName) {
  let found = false;
  walkWithAncestors(panel, (node, ancestors) => {
    if (node.type !== 'JSXElement' || !pathUsesDataCall(node.openingElement, functionName, trajectoryName)) return;
    const svgAncestorIndex = ancestors.findLastIndex((ancestor) => ancestor.type === 'JSXElement' && ancestor.openingElement.name?.name === 'svg');
    if (svgAncestorIndex < 0) return;
    const wrappers = ancestors.slice(svgAncestorIndex + 1);
    const expectedFailureKey = trajectoryName === 'leftTrajectory' ? 'trajectoryLeft' : 'trajectoryRight';
    const directChild = wrappers.length === 0;
    const conditionalChild = wrappers.length === 2
      && wrappers[0].type === 'JSXExpressionContainer'
      && wrappers[1].type === 'ConditionalExpression'
      && isExactFailedKeyTest(wrappers[1].test, expectedFailureKey)
      && subtreeContainsNode(wrappers[1].alternate, node);
    if (!directChild && !conditionalChild) return;
    if (!isStaticallyUnreachable(node, ancestors)) found = true;
  });
  return found;
}

function analyzeDataUnavailableContract(source) {
  const ast = parse(source);
  const componentContext = getDefaultExportedComponent(ast, 'CollectTaskDataPage');
  const failedStateBinding = getDirectVariableDeclarator(componentContext, 'failedRealDataKeys');
  const getSvgPathFunction = getDirectVariableDeclarator(componentContext, 'getSvgPath')?.init;
  const getSpeedPathFunction = getDirectVariableDeclarator(componentContext, 'getSpeedPath')?.init;
  const getKinematicsDataFunction = getDirectVariableDeclarator(componentContext, 'getKinematicsData')?.init;
  const directEffects = getDirectHookCalls(componentContext, 'useEffect');
  const loadingEffects = directEffects.filter((effect) => collectPromiseCalls(effect.arguments[0]?.body, 'allSettled').length > 0);
  const loadingEffect = loadingEffects.length === 1 ? loadingEffects[0].arguments[0] : null;
  const allSettledCalls = loadingEffect ? collectPromiseCalls(loadingEffect.body, 'allSettled') : [];
  const allSettledCall = allSettledCalls.length === 1 ? allSettledCalls[0] : null;
  const hasFailedKeyState = Boolean(
    failedStateBinding?.id?.type === 'ArrayPattern'
    && failedStateBinding.id.elements[0]?.name === 'failedRealDataKeys'
    && failedStateBinding.id.elements[1]?.name === 'setFailedRealDataKeys'
    && failedStateBinding.init?.type === 'CallExpression'
    && failedStateBinding.init.callee?.name === 'useState'
    && failedStateBinding.init.arguments[0]?.type === 'ArrayExpression'
    && failedStateBinding.init.arguments[0].elements.length === 0
  );
  let reportUnavailableBranch = false;
  let passBadgeGuardedByReportAvailability = false;

  const reportCards = [];
  walk(componentContext?.returnJsx, (node) => {
    if (
      node.type === 'JSXElement'
      && node.openingElement.name?.name === 'Card'
      && containsRenderedText(jsxAttribute(node.openingElement, 'title')?.value, '自动质检诊断分析报告')
    ) reportCards.push(node);
  });
  const reportCard = reportCards.length === 1 ? reportCards[0] : null;
  const directReportConditions = (reportCard?.children || []).flatMap((child) => (
    child.type === 'JSXExpressionContainer'
      && child.expression?.type === 'ConditionalExpression'
      && isExactFailedKeyTest(child.expression.test, 'report')
      ? [child.expression]
      : []
  ));
  if (directReportConditions.length === 1) {
    const reportCondition = directReportConditions[0];
    let unavailableAlert = false;
    let successfulReportTable = false;
    walk(reportCondition.consequent, (candidate) => {
      if (
        candidate.type === 'JSXOpeningElement'
        && candidate.name?.name === 'Alert'
        && jsxAttribute(candidate, 'message')?.value?.type === 'StringLiteral'
        && jsxAttribute(candidate, 'message').value.value === '质检报告不可用'
      ) unavailableAlert = true;
    });
    walk(reportCondition.alternate, (candidate) => {
      if (candidate.type === 'JSXOpeningElement' && candidate.name?.name === 'Table') {
        const dataSource = jsxAttribute(candidate, 'dataSource');
        if (dataSource?.value?.type === 'JSXExpressionContainer' && containsCall(dataSource.value.expression, 'getKinematicsData')) successfulReportTable = true;
      }
    });
    reportUnavailableBranch = unavailableAlert && successfulReportTable;
  }

  walkWithAncestors(reportCard, (node, ancestors) => {
    if (node.type !== 'JSXText' || !node.value.includes('所有检查通过')) return;
    if (ancestors.some((ancestor) => ancestor.type === 'LogicalExpression' && failedKeyIncludes(ancestor.left, 'report'))) {
      passBadgeGuardedByReportAvailability = true;
    }
  });

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
    let rejectedResultsBinding = null;
    walk(loadingEffect.body, (node) => {
      if (
        node.type === 'VariableDeclarator'
        && node.id?.type === 'Identifier'
        && node.id.name === 'rejectedResults'
        && node.init?.type === 'CallExpression'
        && memberName(node.init.callee) === 'filter'
        && node.init.callee.object?.type === 'ArrayExpression'
      ) rejectedResultsBinding = node;
      if (
        node.type === 'CallExpression'
        && node.start > allSettledCall.start
        && node.callee?.type === 'Identifier'
        && node.callee.name === 'setFailedRealDataKeys'
        && node.arguments[0]?.type === 'CallExpression'
        && memberName(node.arguments[0].callee) === 'map'
        && node.arguments[0].callee.object?.type === 'Identifier'
        && node.arguments[0].callee.object.name === 'rejectedResults'
      ) recordsRejectedKeys = true;
    });
    const rejectedKeys = rejectedResultsBinding?.init?.callee?.object?.elements?.map((entry) => entry?.elements?.[0]?.value) || [];
    recordsRejectedKeys = recordsRejectedKeys
      && JSON.stringify(rejectedKeys) === JSON.stringify(['report', 'trajectoryLeft', 'trajectoryRight']);
  }

  const emptySvgFallback = returnsEmptyStringForMissingTrajectory(getSvgPathFunction);
  const emptySpeedFallback = returnsEmptyStringForMissingTrajectory(getSpeedPathFunction);
  const [firstKinematicsStatement] = executableStatements(getKinematicsDataFunction?.body);
  const emptyKinematicsFallback = Boolean(
    firstKinematicsStatement?.type === 'IfStatement'
    && containsIdentifier(firstKinematicsStatement.test, 'realReport')
    && firstKinematicsStatement.consequent?.type === 'ReturnStatement'
    && firstKinematicsStatement.consequent.argument?.type === 'ArrayExpression'
    && firstKinematicsStatement.consequent.argument.elements.length === 0
  );
  const telemetryCards = [];
  walk(componentContext?.returnJsx, (node) => {
    if (
      node.type === 'JSXElement'
      && node.openingElement.name?.name === 'Card'
      && jsxAttribute(node.openingElement, 'title')?.value?.type === 'StringLiteral'
      && jsxAttribute(node.openingElement, 'title').value.value === '运动轨迹与力矩监视 (Telemetry)'
    ) telemetryCards.push(node);
  });
  const telemetryCard = telemetryCards.length === 1 ? telemetryCards[0] : null;
  const trajectoryPanel = findSmallestDataPanel(telemetryCard, 'getSvgPath');
  const speedPanel = findSmallestDataPanel(telemetryCard, 'getSpeedPath');
  const renderedPaths = {
    trajectoryLeft: false,
    trajectoryRight: false,
    speedLeft: false,
    speedRight: false,
  };
  renderedPaths.trajectoryLeft = hasReachableDirectSvgPath(trajectoryPanel, 'getSvgPath', 'leftTrajectory');
  renderedPaths.trajectoryRight = hasReachableDirectSvgPath(trajectoryPanel, 'getSvgPath', 'rightTrajectory');
  renderedPaths.speedLeft = hasReachableDirectSvgPath(speedPanel, 'getSpeedPath', 'leftTrajectory');
  renderedPaths.speedRight = hasReachableDirectSvgPath(speedPanel, 'getSpeedPath', 'rightTrajectory');
  const trajectoryLabelsGuarded = Boolean(
    trajectoryPanel
    && panelHasUnavailableGuard(trajectoryPanel, 'trajectoryLeft', '左臂轨迹不可用')
    && panelHasUnavailableGuard(trajectoryPanel, 'trajectoryRight', '右臂轨迹不可用')
  );
  const speedLabelsGuarded = Boolean(
    speedPanel
    && panelHasUnavailableGuard(speedPanel, 'trajectoryLeft', '左臂轨迹不可用')
    && panelHasUnavailableGuard(speedPanel, 'trajectoryRight', '右臂轨迹不可用')
  );
  const keepsBothTrajectoryPaths = Object.values(renderedPaths).every(Boolean);

  return {
    valid: Boolean(componentContext?.returnJsx)
      && hasFailedKeyState
      && clearsFailedKeysBeforeRequest
      && clearsFailedKeysWhenLeaving
      && recordsRejectedKeys
      && emptySvgFallback
      && emptySpeedFallback
      && emptyKinematicsFallback
      && reportUnavailableBranch
      && passBadgeGuardedByReportAvailability
      && trajectoryLabelsGuarded
      && speedLabelsGuarded
      && keepsBothTrajectoryPaths,
    hasTargetComponent: Boolean(componentContext),
    hasFailedKeyState,
    clearsFailedKeysBeforeRequest,
    clearsFailedKeysWhenLeaving,
    recordsRejectedKeys,
    emptySvgFallback,
    emptySpeedFallback,
    emptyKinematicsFallback,
    reportUnavailableBranch,
    passBadgeGuardedByReportAvailability,
    trajectoryLabelsGuarded,
    speedLabelsGuarded,
    renderedPaths,
    keepsBothTrajectoryPaths,
  };
}

const dataClientPath = 'src/app/collection/collect/data/ClientPage.js';
if (existsSync(dataClientPath)) {
  const dataSource = readFileSync(dataClientPath, 'utf8');
  const loadingContract = analyzeDataLoadingContract(dataSource);
  const unavailableContract = analyzeDataUnavailableContract(dataSource);
  check(loadingContract.hasTargetComponent && unavailableContract.hasTargetComponent, 'data contracts must bind to default-export CollectTaskDataPage');
  check(loadingContract.promiseAllSettledCount === 1 && loadingContract.canonicalAllSettled, 'data Client must contain exactly one canonical Promise.allSettled call');
  check(loadingContract.promiseAllCount === 0, 'data Client must not contain Promise.all');
  check(loadingContract.clearsAllSlicesBeforeRequest, 'data Client must clear report, left trajectory, and right trajectory before starting each request');
  check(loadingContract.importsAlert && loadingContract.rendersPartialAlert, 'data Client must render selectedEpisodeError as an in-content retryable Alert');
  check(!loadingContract.hasFullPageErrorGate, 'data Client must not gate selectedEpisode content behind an error StateView');
  check(JSON.stringify(loadingContract.loadedKeys) === JSON.stringify(['report', 'trajectoryLeft', 'trajectoryRight']), 'Promise.allSettled must independently fetch report, trajectoryLeft, and trajectoryRight');
  check(loadingContract.independentlyAppliedCount === 3, 'fulfilled report and trajectory results must be applied independently inside the real loading effect');
  check(loadingContract.combinesRejectedReasons, 'data Client must combine rejected result reasons into realDataError');
  check(unavailableContract.valid, `data Client must expose failed report/trajectory slices without synthetic fallback: ${JSON.stringify(unavailableContract)}`);
  const badPromiseAllMutation = dataSource.replace('    Promise.allSettled([', '    Promise.all([]);\n\n    Promise.allSettled([');
  check(badPromiseAllMutation !== dataSource, 'Promise.all mutation must alter the real data loading effect');
  check(!analyzeDataLoadingContract(badPromiseAllMutation).valid, 'data loading contract must reject a Promise.all mutation');
  const hardcodedSvgMutation = dataSource.replace('if (!traj || traj.length === 0) return "";', 'if (!traj || traj.length === 0) return "M 50 55 Q 85 10 120 40 T 160 30";');
  check(hardcodedSvgMutation !== dataSource && !analyzeDataUnavailableContract(hardcodedSvgMutation).valid, 'data unavailable contract must reject restoring a synthetic trajectory path');
  const hardcodedKinematicsMutation = dataSource.replace('if (!realReport) return [];', "if (!realReport) return [{ key: 'synthetic' }];");
  check(hardcodedKinematicsMutation !== dataSource && !analyzeDataUnavailableContract(hardcodedKinematicsMutation).valid, 'data unavailable contract must reject restoring synthetic kinematics rows');
  const hardcodedSpeedMutation = dataSource.replace(
    `  const getSpeedPath = (traj, maxLimit) => {
    if (!traj || traj.length === 0) return "";`,
    `  const getSpeedPath = (traj, maxLimit) => {
    if (!traj || traj.length === 0) return "M 10 30 L 190 30";`,
  );
  check(hardcodedSpeedMutation !== dataSource, 'synthetic speed-path mutation must alter the data Client');
  check(!analyzeDataUnavailableContract(hardcodedSpeedMutation).valid, 'data unavailable contract must reject restoring a synthetic speed path');
  const unreachableSpeedGuardMutation = dataSource.replace(
    `  const getSpeedPath = (traj, maxLimit) => {
    if (!traj || traj.length === 0) return "";`,
    `  const getSpeedPath = (traj, maxLimit) => {
    return "M 10 30 L 190 30";
    if (!traj || traj.length === 0) return "";`,
  );
  check(
    unreachableSpeedGuardMutation !== dataSource
      && unreachableSpeedGuardMutation.includes('return "M 10 30 L 190 30";\n    if (!traj || traj.length === 0)'),
    'unreachable speed-guard mutation must insert a synthetic return before the real guard',
  );
  check(!analyzeDataUnavailableContract(unreachableSpeedGuardMutation).valid, 'data unavailable contract must reject an unreachable empty speed guard after a synthetic return');
  const brokenReportWithDeadDecoy = dataSource
    .replace('message="质检报告不可用"', 'message="质检报告加载失败"')
    .concat(`
const deadReportUnavailableDecoy = failedRealDataKeys.includes('report') ? (
  <Alert message="质检报告不可用" />
) : (
  <Table dataSource={getKinematicsData()} />
);
`);
  check(
    brokenReportWithDeadDecoy !== dataSource
      && brokenReportWithDeadDecoy.includes('message="质检报告加载失败"')
      && brokenReportWithDeadDecoy.includes('deadReportUnavailableDecoy'),
    'dead report JSX mutation must alter the rendered branch and append its decoy',
  );
  check(!analyzeDataUnavailableContract(brokenReportWithDeadDecoy).valid, 'data unavailable contract must reject a broken rendered report branch plus dead JSX decoy');
  const constantReportWithFalseDecoy = dataSource.replace(
    `{failedRealDataKeys.includes('report') ? (`,
    `{false && (
                    failedRealDataKeys.includes('report') ? (
                      <Alert message="质检报告不可用" />
                    ) : (
                      <Table dataSource={getKinematicsData()} />
                    )
                  )}
                  {false ? (`,
  );
  check(
    constantReportWithFalseDecoy !== dataSource
      && constantReportWithFalseDecoy.includes('{false && (')
      && constantReportWithFalseDecoy.includes('{false ? ('),
    'constant report mutation must replace the real report test and insert a false logical decoy in the same Card',
  );
  check(!analyzeDataUnavailableContract(constantReportWithFalseDecoy).valid, 'data unavailable contract must reject an always-success report branch plus false logical decoy');
  const missingLeftRenderedPathsMutation = dataSource
    .replace(
      `<path d={getSvgPath(leftTrajectory, '#1677ff', true)} fill="none" stroke="#1677ff" strokeWidth="2" />`,
      `{/* getSvgPath(leftTrajectory is intentionally present only in this comment */}`,
    )
    .replace(
      `<path d={getSpeedPath(leftTrajectory, 1.2)} fill="none" stroke="#1677ff" strokeWidth="1.2" />`,
      `{/* getSpeedPath(leftTrajectory is intentionally present only in this comment */}`,
  );
  check(
    missingLeftRenderedPathsMutation !== dataSource
      && !missingLeftRenderedPathsMutation.includes(`<path d={getSvgPath(leftTrajectory, '#1677ff', true)}`)
      && !missingLeftRenderedPathsMutation.includes(`<path d={getSpeedPath(leftTrajectory, 1.2)}`)
      && (missingLeftRenderedPathsMutation.match(/intentionally present only in this comment/g) || []).length === 2,
    'rendered path mutation must remove both real left paths and retain only comment decoys',
  );
  check(!analyzeDataUnavailableContract(missingLeftRenderedPathsMutation).valid, 'data unavailable contract must reject missing rendered trajectory/speed paths even when comments retain matching strings');
  const unreachableLeftTrajectoryPathMutation = dataSource.replace(
    `<path d={getSvgPath(leftTrajectory, '#1677ff', true)} fill="none" stroke="#1677ff" strokeWidth="2" />`,
    `{false && (<path d={getSvgPath(leftTrajectory, '#1677ff', true)} fill="none" stroke="#1677ff" strokeWidth="2" />)}`,
  );
  check(
    unreachableLeftTrajectoryPathMutation !== dataSource
      && unreachableLeftTrajectoryPathMutation.includes(`{false && (<path d={getSvgPath(leftTrajectory, '#1677ff', true)}`),
    'unreachable telemetry-path mutation must wrap the real left trajectory path in false &&',
  );
  check(!analyzeDataUnavailableContract(unreachableLeftTrajectoryPathMutation).valid, 'data unavailable contract must reject a telemetry path hidden behind false &&');
  const missingTrajectoryLabelWithCommentDecoy = dataSource
    .replace("? '左臂轨迹不可用' : '● 左臂轨迹 (起:蓝 终:绿)'", "? '左臂轨迹加载失败' : '● 左臂轨迹 (起:蓝 终:绿)'")
    .concat('\n// 左臂轨迹不可用\n');
  check(
    missingTrajectoryLabelWithCommentDecoy !== dataSource
      && missingTrajectoryLabelWithCommentDecoy.includes("'左臂轨迹加载失败'")
      && missingTrajectoryLabelWithCommentDecoy.endsWith('// 左臂轨迹不可用\n'),
    'trajectory-label mutation must alter the rendered label and append its comment decoy',
  );
  check(!analyzeDataUnavailableContract(missingTrajectoryLabelWithCommentDecoy).valid, 'data unavailable contract must bind unavailable labels to the real trajectory panel instead of comments');
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

function containsAbruptCompletionOutsideNestedFunctions(node) {
  let found = false;
  const visit = (candidate) => {
    if (!candidate || typeof candidate !== 'object' || found) return;
    if (Array.isArray(candidate)) {
      for (const child of candidate) visit(child);
      return;
    }
    if (['ArrowFunctionExpression', 'FunctionExpression', 'FunctionDeclaration'].includes(candidate.type)) return;
    if (candidate.type === 'ReturnStatement' || candidate.type === 'ThrowStatement') {
      found = true;
      return;
    }
    for (const [key, value] of Object.entries(candidate)) {
      if (!['loc', 'start', 'end', 'extra'].includes(key)) visit(value);
    }
  };
  visit(node);
  return found;
}

function directCallStatementMatches(statement, calleeName, argumentPredicate) {
  const expression = statement?.type === 'ExpressionStatement' ? statement.expression : null;
  return expression?.type === 'CallExpression'
    && expression.callee?.type === 'Identifier'
    && expression.callee.name === calleeName
    && argumentPredicate(expression.arguments[0]);
}

function cleanupHasReachableTokenIncrement(cleanupFunction) {
  if (cleanupFunction?.body?.type !== 'BlockStatement') return false;
  for (const statement of executableStatements(cleanupFunction.body)) {
    if (statement.type === 'ExpressionStatement' && incrementsFileRequestToken(statement.expression)) return true;
    if (containsAbruptCompletionOutsideNestedFunctions(statement)) return false;
  }
  return false;
}

function analyzeVideoRequestContract(source) {
  const ast = parse(source);
  const componentContext = getDefaultExportedComponent(ast, 'EpisodeVideoPage');
  const tokenBinding = getDirectVariableDeclarator(componentContext, 'fileRequestTokenRef');
  const hasTokenRef = Boolean(
    tokenBinding?.init?.type === 'CallExpression'
    && tokenBinding.init.callee?.type === 'Identifier'
    && tokenBinding.init.callee.name === 'useRef'
    && tokenBinding.init.arguments[0]?.type === 'NumericLiteral'
    && tokenBinding.init.arguments[0].value === 0
  );
  let onSelectHandler = null;
  let treeSelectedKeysIsNullable = false;
  const trees = [];
  walk(componentContext?.returnJsx, (node) => {
    if (node.type === 'JSXOpeningElement' && node.name?.name === 'Tree') {
      trees.push(node);
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
  });

  const directEffects = getDirectHookCalls(componentContext, 'useEffect');
  const episodeDependencyEffects = directEffects.filter((effect) => (
    effect.arguments[1]?.type === 'ArrayExpression'
    && effect.arguments[1].elements.some((element) => element?.type === 'Identifier' && element.name === 'episodeId')
  ));
  const exactEpisodeEffects = directEffects.filter((effect) => hasExactDependencies(effect, ['episodeId']));
  const hasUniqueExactEpisodeEffect = episodeDependencyEffects.length === 1 && exactEpisodeEffects.length === 1;
  const episodeEffect = hasUniqueExactEpisodeEffect ? exactEpisodeEffects[0].arguments[0] : null;

  if (!onSelectHandler) {
    return {
      valid: false,
      hasTargetComponent: Boolean(componentContext),
      hasTokenRef,
      hasOnSelect: false,
      hasUniqueExactEpisodeEffect,
      renderedTreeCount: trees.length,
    };
  }

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
    const statements = executableStatements(episodeEffect.body);
    const [firstStatement] = statements;
    episodeEffectInvalidatesAtStart = firstStatement?.type === 'ExpressionStatement' && incrementsFileRequestToken(firstStatement.expression);
    const finalStatement = statements.at(-1);
    const directReturns = statements.filter((statement) => statement.type === 'ReturnStatement');
    const hasEarlierAbruptCompletion = statements.slice(1, -1).some(containsAbruptCompletionOutsideNestedFunctions);
    const cleanup = directReturns.length === 1 && finalStatement?.type === 'ReturnStatement' ? finalStatement.argument : null;
    episodeEffectCleanupInvalidates = !hasEarlierAbruptCompletion
      && (cleanup?.type === 'ArrowFunctionExpression' || cleanup?.type === 'FunctionExpression')
      && cleanupHasReachableTokenIncrement(cleanup);
    const reachableResetStatements = !hasEarlierAbruptCompletion ? statements.slice(1, -1) : [];
    episodeEffectResetsSelection = (
      reachableResetStatements.some((statement) => directCallStatementMatches(statement, 'setSelectedFileKey', (argument) => isLiteral(argument, 'left_video')))
      && reachableResetStatements.some((statement) => directCallStatementMatches(statement, 'setSelectedFileNode', (argument) => argument?.type === 'Identifier' && argument.name === 'node'))
      && reachableResetStatements.some((statement) => directCallStatementMatches(statement, 'setFileContent', (argument) => isLiteral(argument, '')))
      && reachableResetStatements.some((statement) => directCallStatementMatches(statement, 'setLoadingFileContent', (argument) => isLiteral(argument, false)))
      && reachableResetStatements.some((statement) => directCallStatementMatches(statement, 'setIsPlaying', (argument) => isLiteral(argument, true)))
      && reachableResetStatements.some((statement) => directCallStatementMatches(statement, 'setFrame', (argument) => argument?.type === 'NumericLiteral' && argument.value === 0))
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
    valid: Boolean(componentContext?.returnJsx)
      && hasTokenRef
      && trees.length === 1
      && hasUniqueExactEpisodeEffect
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
    hasTargetComponent: Boolean(componentContext),
    hasTokenRef,
    hasOnSelect: true,
    hasUniqueExactEpisodeEffect,
    renderedTreeCount: trees.length,
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
  const correctEpisodeEffectDecoy = `
useEffect(() => {
  fileRequestTokenRef.current += 1;
  const node = null;
  setSelectedFileKey('left_video');
  setSelectedFileNode(node);
  setFileContent('');
  setLoadingFileContent(false);
  setIsPlaying(true);
  setFrame(0);
  return () => {
    fileRequestTokenRef.current += 1;
  };
}, [episodeId]);
`;
  const missingStartWithExternalDecoy = missingEpisodeInvalidationMutation.concat(correctEpisodeEffectDecoy);
  check(missingStartWithExternalDecoy !== source && missingStartWithExternalDecoy.includes(correctEpisodeEffectDecoy), 'external effect decoy mutation must alter the video Client');
  check(!analyzeVideoRequestContract(missingStartWithExternalDecoy).valid, 'file preview contract must reject a broken real start invalidation plus component-external effect decoy');
  const missingCleanup = source.replace(
    `    return () => {
      fileRequestTokenRef.current += 1;
    };
  }, [episodeId]);`,
    `    return () => {};
  }, [episodeId]);`,
  );
  const missingCleanupWithNestedDecoy = missingCleanup.replace(
    '\n  return (\n',
    `
  function deadEpisodeEffectDecoy() {
    ${correctEpisodeEffectDecoy.trim()}
  }

  return (
`,
  );
  check(missingCleanup !== source && missingCleanupWithNestedDecoy !== missingCleanup && missingCleanupWithNestedDecoy.includes('deadEpisodeEffectDecoy'), 'nested cleanup decoy mutation must alter the video Client');
  check(!analyzeVideoRequestContract(missingCleanupWithNestedDecoy).valid, 'file preview contract must reject a broken real cleanup plus nested dead effect decoy');
  const extraEpisodeDependencyMutation = source.replace('}, [episodeId]);', '}, [episodeId, taskId]);');
  check(extraEpisodeDependencyMutation !== source, 'episode dependency mutation must alter the video Client');
  check(!analyzeVideoRequestContract(extraEpisodeDependencyMutation).valid, 'file preview contract must require the exact [episodeId] dependency array');
  const unreachableEpisodeResetMutation = source.replace(
    `    fileRequestTokenRef.current += 1;
    const findNode = (nodes) => {`,
    `    fileRequestTokenRef.current += 1;
    if (true) return;
    const findNode = (nodes) => {`,
  );
  check(
    unreachableEpisodeResetMutation !== source
      && unreachableEpisodeResetMutation.includes('fileRequestTokenRef.current += 1;\n    if (true) return;'),
    'unreachable episode-reset mutation must insert an early return immediately after the initial invalidation',
  );
  check(!analyzeVideoRequestContract(unreachableEpisodeResetMutation).valid, 'file preview contract must reject reset calls made unreachable by an earlier return');
  const unreachableCleanupIncrementMutation = source.replace(
    `    return () => {
      fileRequestTokenRef.current += 1;
    };
  }, [episodeId]);`,
    `    return () => {
      return;
      fileRequestTokenRef.current += 1;
    };
  }, [episodeId]);`,
  );
  check(
    unreachableCleanupIncrementMutation !== source
      && unreachableCleanupIncrementMutation.includes('return () => {\n      return;\n      fileRequestTokenRef.current += 1;'),
    'unreachable cleanup mutation must insert a return before the cleanup invalidation',
  );
  check(!analyzeVideoRequestContract(unreachableCleanupIncrementMutation).valid, 'file preview contract must reject cleanup invalidation after an earlier return');
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
