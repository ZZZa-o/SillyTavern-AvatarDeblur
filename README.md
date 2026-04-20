# SillyTavern Avatar Deblur

彻底解决 SillyTavern 头像 / 背景 / Persona 头像模糊问题的纯前端扩展。
**插件完全免费分享**

## 原理

SillyTavern 前端在显示头像时，走的是后端的 `/thumbnail?type=avatar&file=xxx` 端点，该端点会对图片进行压缩。本扩展在前端拦截所有这类请求，把 URL 重写成直接指向原图的路径：

| thumbnail type | 真实路径 |
| --- | --- |
| `avatar` | `/characters/<file>` |
| `bg` | `/backgrounds/<file>` |
| `persona` | `/User Avatars/<file>` |

效果等同于禁用缩略图系统，但**不需要修改 `config.yaml`，不需要删除 `thumbnails` 资料夹，不需要重启后端**。

实现方式：

1. 初次加载时扫描全部 `<img>` 与带 `background-image` 的元素；
2. 通过 `MutationObserver` 监听后续动态插入 / 属性变更的节点；
3. 额外拦截 `window.fetch` 作为极端情境的保险。

## 安装

在 SillyTavern 内：

1. 打开 **Extensions** → **Install extension**；
2. 输入本仓库的 Git URL：
   ```
   https://github.com/ZZZa-o/SillyTavern-AvatarDeblur
   ```
3. 安装完成后刷新页面即可，不需要任何配置。

或者手动安装：把整个资料夹放到
`SillyTavern/public/scripts/extensions/third-party/SillyTavern-AvatarDeblur/`
然后刷新浏览器。


## 兼容性

- SillyTavern 1.12+
- 所有主题、所有 CSS 自订方案
- 不影响任何其他扩展

## License

MIT
