# Temperate — 前端

基于 React 19 + TypeScript + Vite 构建，使用 Ant Design 组件库的 Temperate 平台前端。

**配套后端仓库：** [kratos-template-for-all](https://github.com/wuyuetianjian/kratos-template-for-all.git)

> English documentation: [README.md](./README.md)

---

## 目录

- [本地开发](#本地开发)
- [配置说明](#配置说明)
- [Docker 部署](#docker-部署)
- [配置参考](#配置参考)

---

## 本地开发

```bash
npm install
npm run dev
```

开发服务器默认启动在 `http://localhost:5173`。`/v1` 和 `/health` 请求会被 Vite 代理到后端（见 `vite.config.ts`）。

**开发环境变量**（`.env` 文件，不提交到版本库）：

```env
# 后端地址，仅用于 Vite 开发代理
BACKEND_URL=http://localhost:8000

# 若不走 Vite 代理，可直接指定 API 地址（可选）
# VITE_API_BASE_URL=http://localhost:8000
```

---

## 配置说明

所有运行时配置通过 `src/config.ts` 统一读取，优先级由高到低：

| 优先级 | 来源 | 说明 |
|--------|------|------|
| 1 | `window.__APP_CONFIG__` | 容器启动时由 `docker/entrypoint.sh` 注入到 `/config.js` |
| 2 | `VITE_*` 构建变量 | `npm run build` 时烧入 bundle，用于本地开发 |
| 3 | 代码默认值 | 兜底值 |

`src/config.ts` 暴露的字段：

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `apiBaseUrl` | `string` | `''` | API 基础地址，留空则走 Nginx 反向代理 |
| `appName` | `string` | `'Temperate'` | 应用名称 |
| `defaultPageSize` | `number` | `20` | 列表分页大小（仅代码常量） |

> **推荐**：生产环境 `apiBaseUrl` 保持空字符串，让 Nginx 代理 `/v1` 到后端，避免跨域。

---

## Docker 部署

### 构建镜像

```bash
docker build -t temperate-web .
```

构建过程：
1. **Node 22 Alpine** — 安装依赖并执行 `npm run build`
2. **Nginx 1.27 Alpine** — 提供静态产物；`docker/entrypoint.sh` 在容器启动时根据环境变量生成 `/config.js` 和 Nginx 配置

### 运行容器

```bash
docker run -d \
  -p 80:80 \
  -e BACKEND_URL=http://backend:8000 \
  -e APP_NAME=Temperate \
  temperate-web
```

### Docker Compose

```yaml
services:
  web:
    image: temperate-web
    ports:
      - "80:80"
    environment:
      BACKEND_URL: http://backend:8000
      APP_NAME: Temperate
      # API_BASE_URL: ""  # 留空走 Nginx 代理（推荐）
    depends_on:
      - backend

  backend:
    image: temperate-backend   # 见后端仓库
    ports:
      - "8000:8000"
```

---

## 配置参考

### 容器环境变量

所有配置均通过环境变量注入，无需重新构建镜像。

| 变量 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| `BACKEND_URL` | 是 | `http://backend:8000` | 后端服务地址，Nginx 用于反向代理 `/v1` 和 `/health` |
| `APP_NAME` | 否 | `Temperate` | 显示在页面标题和品牌处的应用名称 |
| `API_BASE_URL` | 否 | `''`（空） | 前端 axios 的 `baseURL`，留空则请求走相对路径由 Nginx 代理 |

### 本地开发环境变量（`.env`）

| 变量 | 说明 |
|------|------|
| `BACKEND_URL` | Vite 开发代理的后端地址 |
| `VITE_API_BASE_URL` | 不走 Vite 代理时的 API 地址（可选） |
| `VITE_APP_NAME` | 本地开发时的应用名称（可选） |

### 相关文件

| 文件 | 说明 |
|------|------|
| `src/config.ts` | 统一配置入口，所有模块通过此文件读取配置 |
| `docker/entrypoint.sh` | 容器启动脚本：生成 `config.js` + 渲染 Nginx 模板 |
| `docker/nginx.conf.template` | Nginx 配置模板，`${BACKEND_URL}` 在启动时替换 |
| `vite.config.ts` | Vite 配置，包含开发代理规则 |
| `.env` | 本地开发环境变量（不提交） |

---

## 构建命令

```bash
npm run dev      # 启动开发服务器（HMR）
npm run build    # TypeScript 检查 + Vite 生产构建，产物在 dist/
npm run preview  # 本地预览生产构建
npm run lint     # ESLint 检查
```
