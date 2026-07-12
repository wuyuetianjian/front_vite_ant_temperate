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

## 管理页面

| 页面 | 路径 | 所需权限 |
|------|------|----------|
| 仪表盘 | `/admin` | （任意已登录用户） |
| 用户管理 | `/admin/users` | `ListUsers` |
| 角色管理 | `/admin/roles` | `ListRoles` |
| 权限管理 | `/admin/permissions` | `ListPermissions` |
| SSO 认证 | `/admin/sso` | `ListSSOProviders` |
| 在线会话 | `/admin/sessions` | `ListSessions` |
| 审计日志 | `/admin/audit-logs` | `ListAuditLogs` |
| 系统设置 | `/admin/settings` | `GetSystemSettings` |
| **服务账号** | `/admin/service-accounts` | `ListServiceAccounts` |
| 个人设置 | `/admin/profile` | （任意已登录用户） |

### 用户主题预设

个人设置页包含外观主题面板，支持默认、暗黑、类 MUI、类 shadcn、卡通、
插画、类 Bootstrap 拟物化、玻璃和极客风格。只有玻璃风格使用壁纸、透明和
模糊效果，其余预设均为实体表面。用户还可自定义核心令牌（颜色、文字、边框、
圆角、密度和色彩模式），通过 `/v1/auth/me/theme` 保存，并在下次登录时从
`/v1/auth/me` 自动恢复；组件级高级令牌保留给管理员配置。管理员可在“系统设置
→ 外观”中设置全局默认预设、色彩模式和核心令牌 JSON，配置保存至
`system_settings`，只作用于尚未保存个人主题偏好的用户。
系统默认主题也可在同一设置面板中恢复为内置默认配置。

### 认证与用户管理

登录页对本地用户和 LDAP 用户复用同一个用户名/密码表单。后端会先认证本地用户；
当本地用户不存在或本地密码校验失败时，再回退到 LDAP。LDAP provider 不会作为
单独的登录按钮显示；OIDC 和 SAML provider 会作为跳转登录按钮显示。

SSO provider 页面支持在保存 LDAP 配置前进行账号测试。测试会使用当前表单中输入
的配置和测试账号密码；测试通过后才能保存。管理员也可以选择“不测试直接保存”。

用户管理页会把用户来源显示为 `SSO 名称 (协议)`，例如 `Keycloak (OIDC)`、
`Corporate LDAP (LDAP)` 或 `Local (LOCAL)`。管理员可以重置本地用户密码；后端
生成随机密码，前端只在弹窗中展示一次并支持复制。LDAP 用户密码由 LDAP 管理，
不会在用户管理页重置。

在线会话页会用同样的 `SSO 名称 (协议)` 格式显示每个会话的登录来源。该字段
上线前已存在的会话可能显示为空，需要用户重新登录后才会写入。

被禁用用户和权限不足的已登录用户会进入 Forbidden 页面。被禁用账号显示专门的
账号禁用提示；其他授权失败显示权限不足提示。

### 服务账号页面

服务账号页面允许管理员创建和管理机器/服务身份，使其可以使用长期有效的
Token 直接调用后端 API。

**主要功能：**

- **新建** — 填写名称、描述（可选）、有效期（天，0 = 永不过期）和绑定角色。
  生成的 Token 在弹窗中展示一次，支持一键复制。
- **Token 展示弹窗** — 显示完整 Token，并提供 Java、Go、Rust、Python
  四种语言的使用代码模板。
- **编辑** — 修改描述、启用/禁用账号、更改角色绑定。
- **重新生成 Token** — 立即轮换 Token（原 Token 即时失效），
  新 Token 同样在弹窗中展示并附带代码模板。
- **删除** — 永久删除服务账号并使其 Token 失效。

所有创建、重新生成和删除操作均会记录至审计日志。

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

## 双因素认证（2FA）

系统支持基于 TOTP 的双因素认证（兼容 Google Authenticator、Microsoft Authenticator、Authy 等）。

**管理员控制：**
- 在 **系统设置 → 双因素认证** 中全局启用或禁用 2FA 功能。
- 全局开关开启后，已绑定验证器的用户登录时将被要求输入验证码。
- 管理员可在用户管理页对任意用户一键重置 2FA（无需验证码）。

**用户自助：**
- 全局开关开启时，用户可在 **个人设置 → 双因素认证** 中自行绑定/关闭 2FA。
- 用户自行关闭 2FA 需输入当前绑定的 TOTP 验证码进行确认。

**启用 2FA 后的登录流程：**
1. 输入用户名 + 密码 → 服务端返回 `requires_2fa: true` 及 `pre_auth_token`。
2. 前端展示 6 位验证码输入框。
3. 用户提交验证码 → 调用 `/v1/auth/verify-totp` → 获得完整会话 Token。

LDAP 复用同一个用户名/密码登录表单。前端统一提交到 `/v1/auth/login`；
后端先校验本地用户和密码，本地用户不存在或本地密码校验失败时，再尝试启用的
LDAP 认证，并在成功后同步本地用户。LDAP 不会在登录页渲染为单独的 SSO 登录按钮。

OIDC 与 SAML provider 会作为跳转登录按钮渲染，点击后打开 `/v1/sso/login/{id}`。
SSO 管理页（`/admin/sso`）按协议类型渲染配置字段；SAML 2.0 包含 IdP Entity ID、
IdP SSO URL、IdP Certificate、SP Entity ID，以及当 IdP 要求签名时使用的 SP
私钥/证书。「生成 SP 证书」按钮会调用 `POST /v1/sso/saml/keypair` 生成自签名
SP 密钥对并自动填入。配置字段标签与 Keycloak 字段名一致。provider 配置与
IdP（Keycloak）设置见后端 `docs/sso-saml-design.md`。

退出 SSO 会话会同时注销 IdP 会话：登出接口返回 `sso_logout_url`，前端把浏览器
跳转过去（OIDC end-session / SAML 单点登出）后再回到登录页。用户列表新增展示
SSO 采集到的**邮箱**列。

---

## 构建命令

```bash
npm run dev      # 启动开发服务器（HMR）
npm run build    # TypeScript 检查 + Vite 生产构建，产物在 dist/
npm run preview  # 本地预览生产构建
npm run lint     # ESLint 检查
```
