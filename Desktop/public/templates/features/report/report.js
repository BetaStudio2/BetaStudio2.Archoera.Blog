window.BINDER = window.BINDER || {};
window.BINDER.report =
  '<h1>项目月度报告</h1>' +
  '<h2>报告概述</h2>' +
  '<p>本报告总结了项目在当前周期内的整体进展、关键指标和下一阶段工作计划。</p>' +

  '<h2>关键指标</h2>' +
  '<table style="border-collapse:collapse;width:100%;max-width:600px;margin:10px 0;">' +
    '<tr style="background:#1e2632;"><td style="padding:8px 12px;border:1px solid #3b3b3b;font-weight:600;color:#e8edf7;">指标</td><td style="padding:8px 12px;border:1px solid #3b3b3b;font-weight:600;color:#e8edf7;">当前值</td><td style="padding:8px 12px;border:1px solid #3b3b3b;font-weight:600;color:#e8edf7;">目标值</td><td style="padding:8px 12px;border:1px solid #3b3b3b;font-weight:600;color:#e8edf7;">进度</td></tr>' +
    '<tr><td style="padding:8px 12px;border:1px solid #3b3b3b;">需求完成数</td><td style="padding:8px 12px;border:1px solid #3b3b3b;">18</td><td style="padding:8px 12px;border:1px solid #3b3b3b;">20</td><td style="padding:8px 12px;border:1px solid #3b3b3b;color:#4ecb71;">90%</td></tr>' +
    '<tr><td style="padding:8px 12px;border:1px solid #3b3b3b;">Bug 解决率</td><td style="padding:8px 12px;border:1px solid #3b3b3b;">42</td><td style="padding:8px 12px;border:1px solid #3b3b3b;">45</td><td style="padding:8px 12px;border:1px solid #3b3b3b;color:#f0c040;">93%</td></tr>' +
    '<tr><td style="padding:8px 12px;border:1px solid #3b3b3b;">代码覆盖率</td><td style="padding:8px 12px;border:1px solid #3b3b3b;">78%</td><td style="padding:8px 12px;border:1px solid #3b3b3b;">80%</td><td style="padding:8px 12px;border:1px solid #3b3b3b;color:#4ecb71;">97.5%</td></tr>' +
  '</table>' +

  '<h2>本周进展</h2>' +
  '<ul>' +
    '<li>完成用户管理模块的开发和单元测试</li>' +
    '<li>优化首页加载性能，LCP 指标提升 30%</li>' +
    '<li>完成 v1.2 版本的需求评审和任务拆分</li>' +
    '<li>修复 8 个 P0/P1 级别的线上问题</li>' +
  '</ul>' +

  '<h2>下阶段计划</h2>' +
  '<ul>' +
    '<li>启动报表导出功能的前端开发</li>' +
    '<li>推进自动化测试框架的集成</li>' +
    '<li>完成性能监控平台的搭建</li>' +
  '</ul>' +

  '<h2>风险与问题</h2>' +
  '<p>无重大风险项。第三方依赖库存在一个小版本兼容问题，已与相关方确认解决方案，预计下周完成修复。</p>';
