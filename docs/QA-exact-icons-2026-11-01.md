# 修正图标选型不一致

2026-11-01。

上一轮把预览的ListOrdered重新画成1/2/3清单，未准确执行用户选型。本轮从预览包装器固定使用的lucide@1.17.0取得ListOrdered、Maximize2、Minimize2图形，逐项比较每条路径完全相同；线宽统一1.7。

仅替换静态sprite，不添加运行时CDN依赖。许可证保存于public/licenses/lucide.txt。前端构建与51篇/5013章节/103页面内容检查通过，浏览器确认数字清单显示1/2。

截图：exact-selected-icons-2026-11-01.png。
