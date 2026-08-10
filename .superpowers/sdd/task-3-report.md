# Task 3 公共 UI 组件报告

## 交付文件

- `src/components/ui/PageHeader.js`
- `src/components/ui/FilterPanel.js`
- `src/components/ui/TableToolbar.js`
- `src/components/ui/StatusTag.js`
- `src/components/ui/FormSection.js`
- `src/components/ui/ActionFooter.js`
- `src/components/ui/AppModal.js`
- `src/components/ui/StateView.js`
- `src/components/ui/index.js`
- `tools/test_ui_components.mjs`

组件仅渲染既有 `.ui-*` 语义类，不发起业务请求。`StatusTag` 集中维护语义状态色；`AppModal` 将 `small`、`medium`、`large` 固定映射为 520、720、960，脏数据关闭时使用 `Modal.confirm`，不管理表单提交；`StateView` 覆盖 `loading`、`empty`、`no-result`、`forbidden`、`error` 五种状态。

## TDD 记录

### RED 1：公共出口尚不存在

命令：

```bash
node tools/test_ui_components.mjs
```

输出（exit 1）：

```text
Error: ENOENT: no such file or directory, open 'src/components/ui/index.js'
code: 'ENOENT'
```

### RED 2：StateView 默认文案回退

命令：

```bash
node tools/test_ui_components.mjs
```

输出（exit 1）：

```text
AssertionError [ERR_ASSERTION]: The input did not match the regular expression /title \|\| defaults\.title/
```

### RED 3：宽度映射不得被透传属性覆盖

命令：

```bash
node tools/test_ui_components.mjs
```

输出（exit 1）：

```text
AssertionError [ERR_ASSERTION]: The input did not match the regular expression /<Modal \{\.\.\.modalProps\} centered width=/
```

### GREEN

命令：

```bash
node tools/test_ui_components.mjs && npm run build && git diff --check
```

输出（exit 0）：

```text
UI_COMPONENTS_OK
> prototype@0.1.0 build
> next build
✓ Compiled successfully
✓ Generating static pages using 9 workers (55/55)
```

## 构建结果

`npm run build` 退出码为 0。Next.js 16.1.6（Turbopack）完成编译、类型检查、55 个静态页面生成与优化。

## 自检

- 所有八个组件已从 `src/components/ui/index.js` 导出。
- 所有使用 Ant Design 或 React state 的组件均声明 `'use client';`。
- `AppModal` 保留调用方的 Modal 属性，但强制使用语义宽度、居中与统一取消处理。
- `StateView` 在调用方未提供标题或说明时保留各状态的默认文案。
- `git diff --check` 无空白错误。

## 关注点

- 当前仓库没有 React 组件渲染测试运行器；契约测试验证公开出口、状态映射和关键关闭/回退约束，生产构建验证全站构建。后续若引入测试运行器，可补充 DOM 交互测试。

## 提交

提交信息：`feat: add reusable admin UI components`。最终 SHA 由提交完成后的仓库 `HEAD` 确认。
