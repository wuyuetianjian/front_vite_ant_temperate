# 主题系统 / Theme System

## 目标

九个外观预设各自忠实移植一套 Ant Design 官方主题，包含设计令牌、组件级
覆盖，以及组件级 `classNames` 特效；同时保留用户的“自定义核心令牌”能力，官方
配色作为默认值。

## 架构

```
src/theme/antd/
  index.ts        UseTheme 类型 + useAntdThemeConfig 总控 hook
  default.ts dark.ts glass.ts    自建（对齐 antd 原生 / 暗色 / 玻璃）
  mui.ts shadcn.ts cartoon.ts illustration.ts bootstrap.ts geek.ts   移植官方
src/theme/presets.ts   themePresets / lightDefaults：预设卡片预览 + 自定义编辑器默认值
src/styles/liquid-glass.css      glass 玻璃材质（变量定义）
src/styles/glass-overrides.css   antd 组件的玻璃样式，整体 scope 到 [data-theme-preset="glass"]
```

- 每个预设 hook 用 `antd-style` 的 `createStyles` 定义特效类，返回完整
  `ConfigProviderProps`（`theme` + `button`/`input`/`modal`/… 的 `classNames`）。
- `useAntdThemeConfig(preset, mode, customConfig)` **无条件调用全部 9 个 hook**
  （antd-style 的 `useStyles` 是 React hook，不能条件调用），按 `preset` 选中一套，
  再叠加：
  - 解析后的 light/dark（`darkAlgorithm`）与 compact（`compactAlgorithm`）算法；
  - 用户自定义令牌覆盖——**仅覆盖用户实际改动、与预设默认不同的字段**，未改动的
    账户得到纯净的官方主题。
- `App.tsx` 用 `<ConfigProvider {...configProps}>` 展开，`AntdApp` 挂 `app.className`
  （承载 geek 的 textShadow 等）。

## 组件特效示例

| 预设 | 特效 |
|------|------|
| geek | 绿色霓虹描边 + 发光 + 直角 + 文字 textShadow |
| mui | 大写字母按钮 + 立体阴影 + 点击涟漪 |
| shadcn | 扁平深色主按钮 + 细边 |
| cartoon | 粗描边 + 大圆角 + 棕褐卡片 |
| illustration | 3px 描边 + 4px 硬阴影 + 粉色卡片 |
| bootstrap | 渐变立体按钮 |
| glass | 壁纸 + 半透明 + 毛玻璃（仅此预设保留材质） |

## 自定义令牌边界

- **令牌驱动的预设**（default/glass/dark/cartoon/illustration/bootstrap/geek）：
  用户改主色/背景/圆角/密度等全部即时生效。
- **深度定制预设**（mui/shadcn）：按钮配色/圆角在特效 `classNames` / `components`
  中硬编码以还原官方观感，故这些具体元素不随令牌变化；其余令牌驱动的元素
  （链接、选中态等）仍生效。

## CSS 作用域约定

`glass-overrides.css` 的全部 `.ant-*` 玻璃覆盖都包裹在
`:root[data-theme-preset="glass"] { … }`（原生 CSS 嵌套）内，确保非 glass 预设完全
由官方主题接管，不被玻璃样式污染。自研 UI 类（`.theme-preset-*`、`.theme-token-*`、
`.wallpaper-*`）保持全局。

## 持久化

预设与令牌通过 `PUT /v1/auth/me/theme` 保存，`GET /v1/auth/me` 恢复。管理员可在
“系统设置 → 外观”设全局默认，作用于未保存个人偏好的用户。
