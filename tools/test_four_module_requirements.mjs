import assert from "node:assert/strict";
import {
  COLUMNS,
  MODULES,
  requirementsByModule,
  validateRequirements,
} from "./build_four_module_requirements.mjs";

assert.equal(COLUMNS.length, 22, "shared requirement schema must contain 22 columns");
assert.deepEqual(
  MODULES.map((module) => module.name),
  ["数据采集", "数据标注", "标注工作台", "数据质检", "模版中心"],
  "module order must match the approved workbook design",
);

validateRequirements(requirementsByModule);

const expectedCounts = {
  数据采集: 17,
  数据标注: 12,
  标注工作台: 16,
  数据质检: 10,
  模版中心: 10,
};

for (const module of MODULES) {
  assert.equal(
    requirementsByModule[module.name].length,
    expectedCounts[module.name],
    `${module.name} must contain the approved atomic requirement count`,
  );
}

assert.equal(
  MODULES.reduce((sum, module) => sum + requirementsByModule[module.name].length, 0),
  65,
  "workbook must contain 65 atomic requirements",
);

console.log("DATA_VALIDATION_OK");
