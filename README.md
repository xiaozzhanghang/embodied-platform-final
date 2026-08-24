This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Local development

Install dependencies and run the development server:

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Static build, preview, and deployment

Run this exact sequence from the repository root:

```bash
npm ci
npm run build
npm start
```

`npm run build` creates a portable static export, and `npm start` previews that export locally with the pinned static server command from `package.json`.

- **可部署目录**：`out/`
- **部署根路径**：`/`
- **Luming 数据说明**：页面仅使用可公开发布的合成 fixture，不包含真实采集数据。
- **回滚方式**：重新部署上一份已归档的 `out/` 静态产物。
- **导出安全净化**：`npm run build` 会自动清理本机媒体副本并安全检查 `out/`；仅部署检查通过的产物。

The build requires Node.js 20.9.0 or newer. Its automatic safety step removes only generated copies under `out/`; it does not modify `public/`. After the build succeeds, publish the sanitized contents of `out/` at the site root. The deployed artifact does not require a Node.js application process.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

See the [Next.js static export documentation](https://nextjs.org/docs/app/guides/static-exports) for hosting details.
