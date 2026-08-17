# Annotation Action Template Binding Prototype Implementation Plan

> **Goal:** Deliver an isolated interactive prototype that demonstrates how annotation-task creation should bind mixed collection data to exactly one compatible action schema and template.

**Architecture:** Add a no-dependency standalone web prototype under `prototypes/` so the current Next.js pages and the user's in-progress styling changes remain untouched. Put all selection, schema-locking, template filtering, auto-split, and publish-validation rules in a pure ESM model. Cover that model with Node's built-in test runner, then bind it to a polished browser UI.

**Tech Stack:** Semantic HTML, CSS, browser ES modules, Node `node:test`.

---

## Task 1: Define the behavior contract with failing tests

**Files:**
- Create: `prototypes/annotation-action-template-binding/model.test.mjs`
- Create later: `prototypes/annotation-action-template-binding/model.mjs`

**Steps:**
1. Test grouping episodes by normalized action schema.
2. Test that eligible data from different source collection tasks can coexist when their action schema matches.
3. Test that mixing different schemas is rejected with a split suggestion.
4. Test that zero-frame and pending-QC data cannot enter a publishable selection.
5. Test strict template compatibility and unknown-action handling.
6. Run `node --test prototypes/annotation-action-template-binding/model.test.mjs` and confirm the missing model fails first.

## Task 2: Implement the selection and validation model

**Files:**
- Create: `prototypes/annotation-action-template-binding/model.mjs`

**Steps:**
1. Implement episode eligibility checks.
2. Implement schema grouping and selection locking.
3. Implement compatible-template filtering and recommendation.
4. Implement automatic split planning.
5. Implement final publish validation.
6. Re-run the focused model test until it passes.

## Task 3: Build the interactive prototype page

**Files:**
- Create: `prototypes/annotation-action-template-binding/index.html`
- Create: `prototypes/annotation-action-template-binding/styles.css`
- Create: `prototypes/annotation-action-template-binding/app.mjs`

**Steps:**
1. Build the optional scene, child-scene, and collection-task filters.
2. Keep query results unselected by default and expose source task, SOP/action, frames, QC, and compatibility columns.
3. Lock the task to the first selected action schema while allowing cross-task data with the same schema.
4. Show a clear block message when a conflicting schema is selected and provide an automatic-split preview.
5. Recommend only compatible templates and show an SOP snapshot preview.
6. Support imported data whose action is unknown through an explicit no-template/manual-annotation path.
7. Add a sticky task assembly summary and publish validation feedback.

## Task 4: Verify behavior and presentation

**Files:**
- Verify: `prototypes/annotation-action-template-binding/model.test.mjs`
- Verify: prototype page files above

**Steps:**
1. Run the focused Node tests.
2. Run `git diff --check` for whitespace errors.
3. Start a local static server and open `/` at the prototype server origin.
4. Inspect the desktop layout and confirm the browser console has no errors.
5. Exercise same-schema selection, mixed-schema blocking, automatic split, unknown-action handling, and successful publish.
6. Capture a browser screenshot for handoff.
