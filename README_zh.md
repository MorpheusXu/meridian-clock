<div align="right">
  <a href="./README.md">English</a> | <strong>简体中文</strong>
</div>

# Meridian for Obsidian

Meridian 是一个 Obsidian 时钟插件。它提供指针和数字两种模式的表盘，你可以把它放在侧边栏，用来方便地查看本地时间或其他时区的时间。

<div align="center">
  <table>
    <tr>
      <td align="center"><strong>🌙 深色模式</strong></td>
      <td align="center"><strong>☀️ 浅色模式</strong></td>
    </tr>
    <tr>
      <td><img src="images/clock-dark1.gif" width="350" /></td>
      <td><img src="images/clock-light1.gif" width="350" /></td>
    </tr>
  </table>
</div>

## 主要功能

- **双表盘模式：** 支持传统的指针钟表和现代的数字电子表。
- **世界时钟（四宫格）：** 可以在同一个面板中同时显示 4 个不同城市的时钟，方便对照。
- **时区与自定义城市：** 插件内置了全球主要城市的列表。如果找不到你需要的城市，你可以自己添加，并为其绑定标准的时区（例如 `Asia/Shanghai` 或 `Europe/London`），插件会自动处理该地区的夏令时（DST）转换。
- **外观自定义：**
  - 调整表盘的刻度样式（如经典刻度、圆点、数字等）。
  - 自定义背景、指针、刻度、数字的颜色。
  - 为数字电子表更改字体和秒数大小。
  - 设置指针的走动方式（平滑扫动、机械跳秒，或直接隐藏秒针）。
- **主题预设：** 内置了多款配置好的主题供直接使用。你也可以将自己搭配好的样式保存到“我的预设”中，以便随时切换。

<div align="center">
  <table>
    <tr>
      <td align="center"><strong>🌙 深色模式</strong></td>
      <td align="center"><strong>☀️ 浅色模式</strong></td>
    </tr>
    <tr>
      <td><img src="images/clock-dark2.gif" width="350" /></td>
      <td><img src="images/clock-light2.gif" width="350" /></td>
    </tr>
  </table>
</div>

## 如何使用

1. 打开命令面板 (`Ctrl/Cmd + P`)。
2. 搜索并运行 **`Open Meridian Clock`**。
3. 时钟会在一个新的面板中打开。你可以把这个面板拖拽放到左侧或右侧边栏。
4. 进入 `设置 > Meridian`，在这里修改时区、调整外观颜色以及管理预设。

## 安装方法

**通过 Obsidian 社区插件市场：**
1. 打开 Obsidian `设置` > `第三方插件`。
2. 关闭“安全模式”。
3. 点击 `浏览` 并搜索 **Meridian Clock**。
4. 安装并启用插件。

**手动安装：**
1. 从 [Releases 页面](https://github.com/MorpheusXu/meridian-clock/releases) 下载最新版本的 `main.js`、`styles.css` 和 `manifest.json` 文件。
2. 在你的笔记库的 `.obsidian/plugins/` 文件夹下新建一个名为 `meridian-clock` 的文件夹。
3. 将下载的三个文件放进去。
4. 重启 Obsidian 并在设置中启用它。

## 反馈与问题
如果在使用中遇到 bug，或者有新功能的建议，欢迎在 [GitHub](https://github.com/MorpheusXu/meridian-clock/issues) 提交 Issue。