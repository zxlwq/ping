# Pokemon Cloud - 智能线路检测面板

这是一个纯静态的线路检测与节点调度展示页面，适合直接部署到 Cloudflare Pages。页面包含：

- 线路节点健康检测与延迟显示
- 自动刷新与一键直达最快节点
- 常用域名一键复制
- 玻璃拟态 + 动态背景视觉效果

## 本地预览

直接用浏览器打开 `index.html` 即可。

## 部署到 Cloudflare Pages

1. 新建一个 GitHub 仓库并把本项目推送上去。
2. 进入 Cloudflare Pages，选择 `Connect to Git` 并授权 GitHub。
3. 选择该仓库后，构建设置如下：
   - Framework preset: `None`
   - Build command: 留空
   - Build output directory: `/`（项目根目录）
4. 点击部署即可。

## 配置节点

节点配置在 `app.js` 的 `nodes` 数组中，字段说明：

- `name`: 节点名称
- `url`: 节点地址
- `region`: 节点区域
- `provider`: 运营商/提供商

调整后保存即可生效。
