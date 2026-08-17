import assert from "node:assert/strict";
import { buildWorkbook } from "./build_four_module_requirements.mjs";

const workbook = buildWorkbook();
const sheetSummary = await workbook.inspect({ kind: "sheet", include: "name,index", maxChars: 4000 });
const sheetNames = sheetSummary.ndjson
  .split("\n")
  .filter(Boolean)
  .map((line) => JSON.parse(line).name);

assert.deepEqual(
  sheetNames,
  ["使用说明", "开发总览", "功能需求清单"],
  "all module tabs must be combined into one requirement sheet",
);

const instructions = workbook.worksheets.getItem("使用说明");
const dictionaryRows = instructions.getRange("A21:C42").values;

assert.equal(dictionaryRows.length, 22, "field dictionary must contain 22 rows");
assert.deepEqual(dictionaryRows[0], [1, "需求ID", "模块内唯一编号"]);
assert.deepEqual(dictionaryRows.at(-1), [22, "备注", "风险与补充"]);

const combined = workbook.worksheets.getItem("功能需求清单");
const combinedRows = combined.getRange("A6:B70").values;
assert.equal(combinedRows.length, 65, "combined sheet must contain all 65 requirements");
assert.deepEqual(
  [...new Set(combinedRows.map((row) => row[1]))],
  ["数据采集", "数据标注", "标注工作台", "数据质检", "模版中心"],
  "combined sheet must keep all five module labels in the approved order",
);

console.log("WORKBOOK_STRUCTURE_OK");
