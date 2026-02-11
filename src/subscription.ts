import { defineGkdSubscription } from '@gkd-kit/define';
import { batchImportApps } from '@gkd-kit/tools';
import { RawApp, RawAppGroup } from '@gkd-kit/api';
import categories from './categories';
import globalGroups, { OPEN_AD_ORDER } from './globalGroups';

// 1. 加载所有应用
const apps = await batchImportApps(`${import.meta.dirname}/apps`);
const rawApps: RawApp[] = [];

// 2. 处理应用规则
apps.forEach((appConfig: RawApp) => {
  // 保持原作者对开屏广告权重的处理逻辑
  appConfig.groups?.forEach((g: RawAppGroup) => {
    if (g.name.startsWith('开屏广告')) {
      g.order = OPEN_AD_ORDER;
    }
  });

  // --- 定制小红书规则 ---
  if (appConfig.id === 'com.xingin.xhs') {
    // A. 修改原有的 Key 6 (自动展开回复)
    // 必须保留 "功能类-" 前缀，否则构建会报错 "not match any category"
    const expandGroup = appConfig.groups?.find((g) => g.key === 6);
    if (expandGroup) {
      expandGroup.name = '功能类-自动点击展开回复';
      expandGroup.desc = '兼容笔记页和视频页的展开回复按钮';
      expandGroup.rules = [
        {
          matches: ['[text~="^展开.*回复$"][top > 100][bottom < 2300]'],
          snapshotUrls: [
            'https://i.gkd.li/i/25229613',
            'https://i.gkd.li/i/25230190',
          ],
          activityIds: [
            'com.xingin.matrix.notedetail.NoteDetailActivity',
            'com.xingin.matrix.detail.activity.DetailFeedActivity',
          ],
        },
      ];
    }

    // B. 注入全新的 "自动点击翻译" 规则
    appConfig.groups?.push({
      key: 1002,
      name: '功能类-自动点击翻译', // 同样添加 "功能类-" 前缀
      desc: '兼容多种日期格式并精准点击翻译',
      rules: [
        {
          action: 'clickCenter',
          position: { left: 'width*0.99', top: 'height / 2' },
          matches: ['[text$="翻译"][top > 100][bottom < 2300]'],
          snapshotUrls: [
            'https://i.gkd.li/i/25230421',
            'https://i.gkd.li/i/25231036',
          ],
          activityIds: [
            'com.xingin.matrix.notedetail.NoteDetailActivity',
            'com.xingin.matrix.detail.activity.DetailFeedActivity',
          ],
        },
      ],
    });
  }

  rawApps.push(appConfig);
});

// 3. 导出订阅
export default defineGkdSubscription({
  id: 666,
  name: 'AIsouler的GKD订阅-个人定制版',
  version: 0,
  author: 'AIsouler',
  checkUpdateUrl: './AIsouler_gkd.version.json5',
  supportUri: 'https://github.com/AIsouler/GKD_subscription',
  categories,
  globalGroups,
  apps: rawApps,
});
