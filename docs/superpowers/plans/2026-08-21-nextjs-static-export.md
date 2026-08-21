# Next.js Static Export Compatibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a root-hosted `out/` static export that preserves prototype navigation, replaces runtime Luming APIs with sanitized fixtures, and can be committed and pushed on `codex/nextjs-static-export`.

**Architecture:** Runtime identifiers move from App Router dynamic segments into query parameters on fixed routes. Every query-driven page uses a static Server `page.js` wrapper with a Suspense boundary around a Client implementation. Pure route builders centralize URL creation, while Luming report/log/trajectory reads resolve to tracked files under `public/demo/session_028/`.

**Tech Stack:** Next.js 16.1.6 App Router, React 19.2.3, Node.js 20+, Ant Design 6.3.1, Node built-in test assertions, static HTML/CSS/JS in `out/`.

## Global Constraints

- The build must use `output: 'export'` and must not require a Node.js runtime after `npm run build`.
- Deploy at the site root; do not add `basePath` or `assetPrefix`.
- Do not commit real `session_028` data, ignored videos, credentials, absolute symlinks, or files larger than 50 MB.
- Preserve existing client behavior except where a dynamic URL or runtime API must change for static compatibility.
- Query values must be encoded with `URLSearchParams`; do not concatenate raw identifiers.
- Keep the existing Netlify plugin configuration.
- Treat the six pre-existing test failures as baseline evidence; do not report the whole legacy suite as passing.

---

### Task 1: Static URL contract and route builder

**Files:**
- Create: `tools/test_static_routes.mjs`
- Create: `src/lib/staticRoutes.mjs`

**Interfaces:**
- Produces: `STATIC_ROUTES`, an immutable map of canonical fixed paths.
- Produces: `buildStaticHref(path, params)`, returning a path with encoded non-empty query values.
- Consumes: Node `URLSearchParams` only; it must not access `window` or Next.js runtime APIs.

- [ ] **Step 1: Write the failing route-helper test**

Create `tools/test_static_routes.mjs` with assertions that fail cleanly while the module is absent:

```js
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const modulePath = 'src/lib/staticRoutes.mjs';
assert.ok(existsSync(modulePath), 'staticRoutes.mjs must exist');

const { STATIC_ROUTES, buildStaticHref } = await import(pathToFileURL(modulePath));

assert.equal(STATIC_ROUTES.auditWorkbench, '/annotation/audit/workbench');
assert.equal(STATIC_ROUTES.collectDetail, '/collection/collect/detail');
assert.equal(STATIC_ROUTES.qaDetail, '/collection/qa/detail');
assert.equal(STATIC_ROUTES.taskDetail, '/collection/tasks/detail');
assert.ok(Object.values(STATIC_ROUTES).every((route) => !route.includes('[')));

assert.equal(
  buildStaticHref(STATIC_ROUTES.auditWorkbench, {
    id: '任务 A',
    episodeId: 'EP/1',
    mode: undefined,
  }),
  '/annotation/audit/workbench?id=%E4%BB%BB%E5%8A%A1+A&episodeId=EP%2F1',
);
assert.equal(buildStaticHref('/collection/qa/detail', { instanceId: '' }), '/collection/qa/detail');
assert.throws(() => buildStaticHref('', { id: 1 }), /non-empty path/);

console.log('STATIC_ROUTES_OK');
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node tools/test_static_routes.mjs`

Expected: exit 1 with `AssertionError: staticRoutes.mjs must exist`.

- [ ] **Step 3: Implement the minimal route module**

Create `src/lib/staticRoutes.mjs`:

```js
export const STATIC_ROUTES = Object.freeze({
  auditDetail: '/annotation/audit/detail',
  auditWorkbench: '/annotation/audit/workbench',
  annotationEditor: '/annotation/editor',
  collectDetail: '/collection/collect/detail',
  collectConnection: '/collection/collect/connection',
  collectData: '/collection/collect/data',
  collectStatus: '/collection/collect/status',
  collectVideo: '/collection/collect/video',
  collectWorkspace: '/collection/collect/workspace',
  configDetail: '/collection/config/detail',
  deviceTypeDetail: '/collection/device-types/detail',
  devicePartDetail: '/collection/device-types/part-detail',
  deviceDetail: '/collection/devices/detail',
  qaDetail: '/collection/qa/detail',
  qaReview: '/collection/qa/review',
  taskbookDetail: '/collection/taskbooks/detail',
  taskDetail: '/collection/tasks/detail',
  templateDetail: '/collection/templates/detail',
});

export function buildStaticHref(path, params = {}) {
  if (typeof path !== 'string' || path.length === 0) {
    throw new TypeError('buildStaticHref requires a non-empty path');
  }

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  }

  const query = search.toString();
  return query ? `${path}?${query}` : path;
}
```

- [ ] **Step 4: Verify GREEN**

Run: `node tools/test_static_routes.mjs`

Expected: `STATIC_ROUTES_OK` and exit 0.

- [ ] **Step 5: Commit the helper**

```bash
git add tools/test_static_routes.mjs src/lib/staticRoutes.mjs
git commit -m "test: define static route URL contract"
```

---

### Task 2: Annotation routes and Suspense wrappers

**Files:**
- Create: `tools/test_static_annotation_routes.mjs`
- Create: `src/components/StaticRouteBoundary.js`
- Move: `src/app/annotation/audit/[id]/page.js` → `src/app/annotation/audit/detail/ClientPage.js`
- Move: `src/app/annotation/audit/[id]/[episodeId]/page.js` → `src/app/annotation/audit/workbench/ClientPage.js`
- Move: `src/app/annotation/editor/[type]/page.js` → `src/app/annotation/editor/ClientPage.js`
- Move: `src/app/annotation/review-list/page.js` → `src/app/annotation/review-list/ClientPage.js`
- Move: `src/app/annotation/workbench-solutions/page.js` → `src/app/annotation/workbench-solutions/ClientPage.js`
- Create: the corresponding five Server `page.js` wrappers
- Modify: `src/app/annotation/audit/page.js`
- Modify: the moved Client pages above
- Modify: `src/lib/uiRouteManifest.mjs`

**Interfaces:**
- Consumes: `STATIC_ROUTES` and `buildStaticHref` from Task 1.
- Produces: fixed annotation pages that read `id`, `episodeId`, `type`, `mode`, `tab`, and `device` from `useSearchParams`.
- Produces: `StaticRouteBoundary({ children })` for all later query-driven pages.

- [ ] **Step 1: Write the annotation route-tree test**

The test must assert these five `page.js` files exist, the three old bracket pages do not exist, each Server wrapper imports `StaticRouteBoundary`, each `ClientPage.js` contains `'use client'`, and annotation source contains none of these forbidden templates:

```js
const forbidden = [
  /`\/annotation\/audit\/\$\{/,
  /`\/annotation\/audit\/\$\{[^}]+\}\/\$\{/,
  /\/annotation\/editor\/\$\{/,
];
```

Run: `node tools/test_static_annotation_routes.mjs`

Expected RED: the fixed route files are absent.

- [ ] **Step 2: Add the reusable boundary**

Create `src/components/StaticRouteBoundary.js`:

```js
import { Suspense } from 'react';

export default function StaticRouteBoundary({ children }) {
  return (
    <Suspense fallback={<div className="ui-page">页面参数加载中…</div>}>
      {children}
    </Suspense>
  );
}
```

- [ ] **Step 3: Move the five Client implementations and add wrappers**

Each new Server wrapper uses this exact form, with the local Client import:

```js
import StaticRouteBoundary from '@/components/StaticRouteBoundary';
import ClientPage from './ClientPage';

export default function Page() {
  return (
    <StaticRouteBoundary>
      <ClientPage />
    </StaticRouteBoundary>
  );
}
```

Add wrappers at:

- `src/app/annotation/audit/detail/page.js`
- `src/app/annotation/audit/workbench/page.js`
- `src/app/annotation/editor/page.js`
- `src/app/annotation/review-list/page.js`
- `src/app/annotation/workbench-solutions/page.js`

- [ ] **Step 4: Replace annotation parameter reads and navigation**

In the three moved dynamic Clients, replace `useParams` with `useSearchParams` and use these defaults:

```js
const searchParams = useSearchParams();
const instanceId = searchParams.get('id') || '19884';
const episodeId = searchParams.get('episodeId') || '744108';
const type = searchParams.get('type') || 'range';
```

Use the parameter names that each page already consumes; do not introduce a second `searchParams` binding. Replace every dynamic annotation navigation with `buildStaticHref`, including list → detail, detail → workbench, next episode, close/back, and QA → audit workbench. Example:

```js
router.push(buildStaticHref(STATIC_ROUTES.auditWorkbench, {
  id: instanceId,
  episodeId: nextEp.id,
  type: nextEp.annoType,
  mode: 'audit',
}));
```

- [ ] **Step 5: Update the UI route manifest**

Replace the three bracket entries with the new fixed `page.js` paths. Add the previously unregistered pages `annotation/long-video-workbench`, `annotation/review`, `annotation/workbench-solutions`, and `collection/qa-dual-view` so `tools/test_ui_route_manifest.mjs` describes the real tree.

- [ ] **Step 6: Verify and commit annotation routes**

Run:

```bash
node tools/test_static_annotation_routes.mjs
node tools/test_static_routes.mjs
node tools/test_ui_route_manifest.mjs
git diff --check
```

Expected: all four commands exit 0.

Commit:

```bash
git add src/app/annotation src/components/StaticRouteBoundary.js src/lib/uiRouteManifest.mjs tools/test_static_annotation_routes.mjs
git commit -m "refactor: make annotation routes statically addressable"
```

---

### Task 3: Collection capture workflow routes

**Files:**
- Create: `tools/test_static_collect_routes.mjs`
- Move six capture pages from bracket directories to fixed Client pages under `collect/{detail,connection,data,status,video,workspace}/ClientPage.js`
- Create six Server wrappers in those fixed directories
- Modify: `src/app/collection/collect/page.js`
- Modify: the six moved Client pages
- Modify: `src/lib/uiRouteManifest.mjs`

**Interfaces:**
- Consumes: `StaticRouteBoundary`, `STATIC_ROUTES`, and `buildStaticHref`.
- Produces: fixed collection-capture routes using `taskId` and optional `episodeId` query values.

- [ ] **Step 1: Write and run the failing capture-route test**

Assert these canonical pages exist:

```text
src/app/collection/collect/detail/page.js
src/app/collection/collect/connection/page.js
src/app/collection/collect/data/page.js
src/app/collection/collect/status/page.js
src/app/collection/collect/video/page.js
src/app/collection/collect/workspace/page.js
```

Assert no capture `page.js` path contains `[` and source has no template navigation matching `/collection/collect/<name>/${...}`.

Run: `node tools/test_static_collect_routes.mjs`

Expected RED: canonical pages are absent.

- [ ] **Step 2: Move Client pages and add the six standard wrappers**

Move the page contents without redesigning them. In every Client replace `useParams` with `useSearchParams` and read:

```js
const searchParams = useSearchParams();
const taskId = searchParams.get('taskId') || 'CT-20250301001';
const episodeId = searchParams.get('episodeId') || 'session_028';
```

Use only the keys needed by the page. The data page keeps its existing `CT-20250301002` default.

- [ ] **Step 3: Replace capture navigation with canonical URLs**

Update these flows with `buildStaticHref`:

- collection list → detail/workspace
- detail → video/data/connection/QA detail
- connection → workspace
- status → connection/workspace
- video → data

For the video path pass both `taskId` and `episodeId`; for all other capture paths pass `taskId` only.

- [ ] **Step 4: Update the six manifest paths**

Change only the route paths; preserve their current `type` and `phase` classifications.

- [ ] **Step 5: Verify and commit capture routes**

Run:

```bash
node tools/test_static_collect_routes.mjs
node tools/test_static_annotation_routes.mjs
node tools/test_ui_route_manifest.mjs
git diff --check
```

Expected: all commands exit 0.

Commit:

```bash
git add src/app/collection/collect src/lib/uiRouteManifest.mjs tools/test_static_collect_routes.mjs
git commit -m "refactor: flatten collection capture routes for export"
```

---

### Task 4: Collection management routes and remaining query pages

**Files:**
- Create: `tools/test_static_management_routes.mjs`
- Move dynamic management pages into fixed Client pages for config detail, device-type detail, part detail, device detail, QA detail/review, taskbook detail, task detail, and template detail
- Delete: `src/app/collection/tasks/detail/[taskId]/page.js` after consolidating on the richer `src/app/collection/tasks/[id]/page.js`
- Wrap existing query pages: collection-task create, taskbook create, task create, and template create
- Modify navigation call sites in collection list/detail pages
- Modify: `src/lib/uiRouteManifest.mjs`

**Interfaces:**
- Consumes: the shared boundary and route builder.
- Produces: fixed management URLs for `id`, `instanceId`, `seqId`, `taskId`, `type`, `edit`, and `mode` values.

- [ ] **Step 1: Write and run the failing management-route test**

The test must recursively scan `src/app` and assert:

```js
assert.deepEqual(dynamicPages, [], 'static export must not retain bracket page routes');
assert.deepEqual(clientSearchParamPages, [], 'page.js using useSearchParams must be a Server wrapper');
```

`clientSearchParamPages` means a `page.js` containing both `'use client'` and `useSearchParams`; `ClientPage.js` files are allowed.

Run: `node tools/test_static_management_routes.mjs`

Expected RED: bracket routes and top-level query Client pages are listed.

- [ ] **Step 2: Migrate the ten management dynamic pages**

Use these canonical parameter mappings:

| Fixed page | Query keys |
| --- | --- |
| `/collection/config/detail` | `id` |
| `/collection/device-types/detail` | `id`, `edit` |
| `/collection/device-types/part-detail` | `id`, `edit` |
| `/collection/devices/detail` | `id`, `edit` |
| `/collection/qa/detail` | `instanceId`, `tab` |
| `/collection/qa/review` | `instanceId`, `seqId` |
| `/collection/taskbooks/detail` | `id` |
| `/collection/tasks/detail` | `id`, `type`, `needCollect` |
| `/collection/templates/detail` | `id` |

Move the nested QA review page before moving its parent. Keep the richer task `[id]` implementation and remove the second simple task detail implementation.

- [ ] **Step 3: Wrap the four existing static query pages**

Move each current `page.js` to `ClientPage.js` and add the standard Server wrapper in:

- `src/app/collection/collection-tasks/create/`
- `src/app/collection/taskbooks/create/`
- `src/app/collection/tasks/create/`
- `src/app/collection/templates/create/`

- [ ] **Step 4: Update every management navigation call site**

Apply the canonical builder to:

- `collection/collection-tasks/page.js`
- `collection/annotation-tasks/page.js`
- `collection/qa/page.js`
- `collection/qa-dual-view/page.js`
- `collection/taskbooks/page.js`
- moved taskbook/task/template Clients
- `collection/device-types/page.js`
- `collection/devices/page.js`
- moved device Clients
- capture-detail and annotation Clients that open QA detail

Preserve existing non-dynamic create-page query links; build them with `buildStaticHref` when they include record-derived values.

- [ ] **Step 5: Reconcile the route manifest and verify GREEN**

The manifest must contain every discovered `page.js` exactly once and no bracket path. Run:

```bash
node tools/test_static_management_routes.mjs
node tools/test_static_collect_routes.mjs
node tools/test_static_annotation_routes.mjs
node tools/test_ui_route_manifest.mjs
rg -n "useParams" src/app
git diff --check
```

Expected: the four Node tests and `git diff --check` exit 0; `rg` returns no matches and therefore exits 1.

- [ ] **Step 6: Commit management route migration**

```bash
git add src/app/collection src/app/annotation src/lib/uiRouteManifest.mjs tools/test_static_management_routes.mjs
git commit -m "refactor: replace dynamic management paths with query routes"
```

---

### Task 5: Luming static fixtures and portable media fallbacks

**Files:**
- Create: `tools/test_luming_static_assets.mjs`
- Create: `src/lib/lumingStaticAssets.mjs`
- Create: `src/components/StaticVideoPlaceholder.js`
- Create: eleven fixture files under `public/demo/session_028/`
- Modify: `src/app/collection/collect/data/ClientPage.js`
- Modify: `src/app/collection/collect/video/ClientPage.js`
- Modify: `src/app/collection/collect/workspace/ClientPage.js`
- Modify: `src/app/collection/device-types/page.js`
- Modify: `src/app/data/catalog/page.js`
- Delete: `src/app/api/luming/route.js`
- Delete: `src/app/api/luming/video/route.js`
- Delete: tracked symlink `public/session_028`

**Interfaces:**
- Produces: `LUMING_STATIC_ASSETS` with report, trajectory, log, CSV, and transform URLs.
- Produces: `getLumingStaticAsset(key)`, throwing on an unknown key.
- Produces: `StaticVideoPlaceholder({ label })`, which uses `/assets/robot_view.png` and never loads a video URL.

- [ ] **Step 1: Write and run the failing Luming asset test**

The test must assert:

- all eleven fixture paths exist and are regular files smaller than 100 KB;
- `LUMING_STATIC_ASSETS` contains only `/demo/session_028/` URLs;
- `src/app/api` has no `route.js`;
- `public/session_028` does not exist;
- source has no `/api/luming`, `/session_028/...video.mp4`, `/assets/videos/`, `/videos/session_028_`, or `chopsticks-reference.png` reference.

Run: `node tools/test_luming_static_assets.mjs`

Expected RED: runtime API routes, the symlink, and media references are reported.

- [ ] **Step 2: Add the asset manifest**

Create `src/lib/lumingStaticAssets.mjs`:

```js
const BASE = '/demo/session_028';

export const LUMING_STATIC_ASSETS = Object.freeze({
  report: `${BASE}/quality-report.json`,
  trajectoryLeft: `${BASE}/trajectory-left.json`,
  trajectoryRight: `${BASE}/trajectory-right.json`,
  checkLog: `${BASE}/check.log`,
  reportText: `${BASE}/quality-report.txt`,
  timestampsLeft: `${BASE}/timestamps-left.csv`,
  timestampsRight: `${BASE}/timestamps-right.csv`,
  queueLeft: `${BASE}/queue-left.csv`,
  queueRight: `${BASE}/queue-right.csv`,
  transformsLeftToRight: `${BASE}/transforms-left-to-right.txt`,
  transformsRightToLeft: `${BASE}/transforms-right-to-left.txt`,
});

export function getLumingStaticAsset(key) {
  const url = LUMING_STATIC_ASSETS[key];
  if (!url) throw new Error(`Unknown Luming static asset: ${key}`);
  return url;
}
```

- [ ] **Step 3: Add deterministic sanitized fixtures**

Use this complete `quality-report.json` shape so every field read by the data table is present:

```json
{
  "session_name": "session_028_demo",
  "overall_pass": true,
  "thresholds": {
    "max_speed_mps": 0.45,
    "max_accel_mps2": 5,
    "max_jerk_mps3": 2200.73,
    "max_angular_speed_rps": 2.5,
    "max_angular_accel_rps2": 23,
    "max_angular_jerk_rps3": 4000.41,
    "min_position_distance_m": 0.05
  },
  "trajectory_analysis": [
    {
      "arm_name": "left",
      "kinematics": {
        "speed_max_mps": 0.42,
        "accel_max_mps2": 1.2,
        "jerk_max_mps3": 18.4,
        "angular_speed_max_rps": 0.8,
        "angular_accel_max_rps2": 4.6,
        "angular_jerk_max_rps3": 120.5
      },
      "position": { "max_distance_from_start_m": 0.31 },
      "checks": {
        "speed": true,
        "accel": true,
        "jerk": true,
        "angular_speed": true,
        "angular_accel": true,
        "angular_jerk": true,
        "max_pos_dist": true
      }
    },
    {
      "arm_name": "right",
      "kinematics": {
        "speed_max_mps": 0.08,
        "accel_max_mps2": 0.4,
        "jerk_max_mps3": 6.2,
        "angular_speed_max_rps": 0.3,
        "angular_accel_max_rps2": 1.8,
        "angular_jerk_max_rps3": 44.2
      },
      "position": { "max_distance_from_start_m": 0.12 },
      "checks": {
        "speed": true,
        "accel": true,
        "jerk": true,
        "angular_speed": true,
        "angular_accel": true,
        "angular_jerk": true,
        "max_pos_dist": true
      }
    }
  ]
}
```

Use these trajectory records in the two JSON arrays, changing the right-hand X values to `0.40`, `0.405`, and `0.41`:

```json
[
  {"time":0,"x":0.10,"y":0.20,"z":0.30,"qx":0,"qy":0,"qz":0,"qw":1,"speed":0},
  {"time":0.1,"x":0.12,"y":0.21,"z":0.33,"qx":0,"qy":0,"qz":0.01,"qw":0.999,"speed":0.38},
  {"time":0.2,"x":0.15,"y":0.22,"z":0.36,"qx":0,"qy":0,"qz":0.02,"qw":0.998,"speed":0.44}
]
```

Use the following exact text fixtures:

```text
# check.log
[2026-08-21 10:00:00] DEMO session=session_028_demo
[2026-08-21 10:00:01] CHECK trajectory continuity: PASS
[2026-08-21 10:00:02] CHECK synchronized timestamps: PASS

# quality-report.txt
Session: session_028_demo
Mode: PUBLIC STATIC FIXTURE
Trajectory continuity: PASS
Timestamp synchronization: PASS
Overall status: PASS
```

Use these exact CSV contents; the `# filename` lines label separate files and are not written into the files:

```csv
# timestamps-left.csv
frame_id,timestamp,system_time
0,0.000,0.005
1,0.033,0.038
2,0.066,0.071

# queue-left.csv
timestamp,queue_size,drop_count
0.000,1,0
0.100,2,0
0.200,1,0

# timestamps-right.csv
frame_id,timestamp,system_time
0,0.000,0.006
1,0.033,0.039
2,0.066,0.072

# queue-right.csv
timestamp,queue_size,drop_count
0.000,1,0
0.100,1,0
0.200,2,0
```

Use these exact transform fixtures; the `# filename` lines label separate files and are not written into the files:

```csv
# transforms-left-to-right.txt
timestamp,tx,ty,tz,qx,qy,qz,qw
0.000,0.452,-0.122,0.892,0,0,0.707,0.707
0.033,0.453,-0.121,0.893,0,0,0.707,0.707
0.066,0.455,-0.120,0.895,0,0,0.706,0.708

# transforms-right-to-left.txt
timestamp,tx,ty,tz,qx,qy,qz,qw
0.000,-0.452,0.122,-0.892,0,0,-0.707,0.707
0.033,-0.453,0.121,-0.893,0,0,-0.707,0.707
0.066,-0.455,0.120,-0.895,0,0,-0.706,0.708
```

No fixture may contain an absolute path, username, device serial number, private IP, or credential.

- [ ] **Step 4: Replace API calls with independent fixture loads**

In the data Client, import `LUMING_STATIC_ASSETS` and replace the all-or-nothing API block with `Promise.allSettled`. Set each fulfilled report/trajectory independently; combine rejected reasons into the existing `realDataError` shape. Change visible labels from “实际/真实数据” to “静态演示数据”.

In the file-preview Client, use this exact key map and check `response.ok` before `json()` or `text()`:

```js
const fileAssetKeys = {
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
```

- [ ] **Step 5: Replace non-portable media**

Create `src/components/StaticVideoPlaceholder.js`:

```js
export default function StaticVideoPlaceholder({ label = '采集视频' }) {
  return (
    <div style={{ position: 'relative', minHeight: 240, display: 'grid', placeItems: 'center', overflow: 'hidden', borderRadius: 8, background: '#090d16' }}>
      <img
        src="/assets/robot_view.png"
        alt={`${label}静态演示占位`}
        style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: 0.48 }}
      />
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', padding: 24, color: '#dbeafe', textAlign: 'center', background: 'linear-gradient(180deg, rgba(9,13,22,0.15), rgba(9,13,22,0.72))' }}>
        <div>
          <div style={{ fontWeight: 700 }}>{label}</div>
          <div style={{ marginTop: 8, fontSize: 12 }}>静态包未包含真实采集视频</div>
        </div>
      </div>
    </div>
  );
}
```

Replace media references in these exact pages:

- `collection/collect/data/ClientPage.js`: replace the `session_028` `<video>` with `StaticVideoPlaceholder`.
- `collection/collect/video/ClientPage.js`: replace left/right `<video>` elements with `StaticVideoPlaceholder`.
- `collection/collect/workspace/ClientPage.js`: replace three `/assets/videos/*.mp4` elements with the placeholder and replace every `chopsticks-reference.png` value with `/assets/images/robot_schematic.png`.
- `collection/device-types/page.js`: replace `resolveVideoSrc` and its ignored video outputs with a tracked-image placeholder path and render `StaticVideoPlaceholder` at the consumer.
- `data/catalog/page.js`: replace both Luming `<video>` elements with placeholders, disable play/pause/reset controls while `selectedCard.isLuming`, and change the Luming download action to `message.info('静态演示包不包含真实视频下载')`.

Delete both API handlers and the tracked absolute symlink. Do not remove or move the user's ignored local media directories.

- [ ] **Step 6: Verify and commit static demo data**

Run:

```bash
node tools/test_luming_static_assets.mjs
node tools/test_static_routes.mjs
git diff --check
git status --short
```

Expected: tests exit 0; status contains only Task 5 files.

Commit:

```bash
git add src/app src/components/StaticVideoPlaceholder.js src/lib/lumingStaticAssets.mjs public/demo public/session_028 tools/test_luming_static_assets.mjs
git commit -m "feat: replace Luming runtime APIs with static demo fixtures"
```

---

### Task 6: Export configuration, preview command, and deployment documentation

**Files:**
- Create: `tools/test_static_export_config.mjs`
- Modify: `next.config.mjs`
- Modify: `package.json`
- Modify: `README.md`
- Modify: `docs/release_notes_and_ops_handover.md`
- Verify unchanged: `netlify.toml`

**Interfaces:**
- Produces: `npm run build` → `out/`.
- Produces: `npm start` → fixed-version static preview command for `out/`.

- [ ] **Step 1: Write and run the failing export-config test**

Import `next.config.mjs` and assert:

```js
assert.equal(nextConfig.output, 'export');
assert.equal(nextConfig.trailingSlash, true);
assert.equal(nextConfig.basePath, undefined);
assert.equal(nextConfig.assetPrefix, undefined);
assert.equal(pkg.scripts.build, 'next build');
assert.match(pkg.scripts.start, /serve@14\.2\.4 out/);
assert.match(netlifyConfig, /@netlify\/plugin-nextjs/);
```

Also assert `.gitignore` ignores `/out/` and docs no longer instruct operators to run `next start` or PM2 against the Next server.

Run: `node tools/test_static_export_config.mjs`

Expected RED: `output` and `trailingSlash` are absent and `start` is still `next start`.

- [ ] **Step 2: Enable static export and preview**

Set `next.config.mjs` to:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
};

export default nextConfig;
```

Keep `build` unchanged and set:

```json
"start": "npx --yes serve@14.2.4 out"
```

Do not add another package dependency and do not change `netlify.toml`.

- [ ] **Step 3: Update documentation**

README and the release handover must document this exact sequence:

```bash
npm ci
npm run build
npm start
```

State that `out/` is the deployable directory, the deployment must be rooted at `/`, and Luming views contain public synthetic fixtures rather than live collection data. Replace PM2/`next start` rollback instructions with redeploying a previously archived `out/` artifact.

- [ ] **Step 4: Verify config and run the real export**

Run:

```bash
node tools/test_static_export_config.mjs
npm run build
test -f out/index.html
test -f out/404.html
test -f out/annotation/audit/workbench/index.html
test -f out/collection/collect/detail/index.html
test -f out/collection/qa/detail/index.html
test -f out/demo/session_028/quality-report.json
git diff --check
```

Expected: all commands exit 0 and Next reports a successful static export.

- [ ] **Step 5: Commit configuration and docs**

```bash
git add next.config.mjs package.json README.md docs/release_notes_and_ops_handover.md tools/test_static_export_config.mjs
git commit -m "build: enable portable Next.js static export"
```

---

### Task 7: Full verification, tracked-tree reproduction, and push

**Files:**
- No new production files.
- Update tests or manifest only if the failure is directly caused by the static-route migration.

**Interfaces:**
- Produces: verified local commit and matching remote branch.

- [ ] **Step 1: Run the complete static-focused suite**

```bash
node tools/test_static_routes.mjs
node tools/test_static_annotation_routes.mjs
node tools/test_static_collect_routes.mjs
node tools/test_static_management_routes.mjs
node tools/test_luming_static_assets.mjs
node tools/test_static_export_config.mjs
node tools/test_ui_route_manifest.mjs
npm run build
git diff --check
```

Expected: every command exits 0.

- [ ] **Step 2: Record legacy baseline without hiding failures**

Run every `tools/test_*.mjs` file and record the exact pass/fail count. Compare failures with the original baseline: four passes, four assertion failures, and two `@oai/artifact-tool` dependency failures. Investigate only new or changed failures; do not claim the legacy suite is green if those six remain.

- [ ] **Step 3: Rebuild from tracked files only**

After all implementation commits, run:

```bash
verify_dir=$(mktemp -d)
git archive HEAD | tar -x -C "$verify_dir"
ln -s "$PWD/node_modules" "$verify_dir/node_modules"
(cd "$verify_dir" && npm run build)
test -f "$verify_dir/out/index.html"
test -f "$verify_dir/out/demo/session_028/quality-report.json"
```

Expected: the archive build succeeds without ignored media or the former desktop symlink.

- [ ] **Step 4: Smoke-test representative deep links**

Start `python3 -m http.server 4173 --directory out` in a managed background session, then request:

```bash
curl -fsSI http://127.0.0.1:4173/
curl -fsSI 'http://127.0.0.1:4173/annotation/audit/workbench/?id=19884&episodeId=744108'
curl -fsSI 'http://127.0.0.1:4173/collection/collect/detail/?taskId=42729'
curl -fsSI 'http://127.0.0.1:4173/collection/qa/detail/?instanceId=QA-DEMO-001'
curl -fsS http://127.0.0.1:4173/demo/session_028/quality-report.json
```

Expected: four HTTP 200 responses and valid JSON with `session_name: session_028_demo`.

- [ ] **Step 5: Verify Git state and push normally**

```bash
git status --short
git log --oneline --decorate origin/main..HEAD
git push -u origin codex/nextjs-static-export
git ls-remote origin refs/heads/codex/nextjs-static-export
git rev-parse HEAD
```

Expected: clean status, non-force push success, and identical local/remote commit hashes.
