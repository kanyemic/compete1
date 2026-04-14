import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const baseURL = 'http://127.0.0.1:3000';
const outputDir = '/Users/kanyemic/Desktop/medical challenge/compete1/screenshots';
const viewport = { width: 1440, height: 1100 };

const now = new Date();
const isoDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
const isoTime = now.toISOString();

const loggedInSeed = {
  identity: {
    id: 'demo-local-user-001',
    displayName: '影像测试员',
    avatar: '🩺',
    isGuest: false,
    authUserId: 'demo-auth-user-001',
    email: 'demo@example.com',
  },
  authUsers: [
    {
      id: 'demo-auth-user-001',
      email: 'demo@example.com',
      password: '123456',
    },
  ],
  authSession: {
    userId: 'demo-auth-user-001',
    email: 'demo@example.com',
  },
  playerStats: {
    bestSoloStreak: 18,
    totalSoloRuns: 7,
    totalQuestionsAnswered: 38,
    totalCorrectAnswers: 31,
    lastPlayedAt: isoTime,
  },
  trainingHistory: [
    {
      id: 'history-1',
      mode: 'daily_challenge',
      score: 820,
      correctCount: 4,
      totalQuestions: 5,
      completedAt: isoTime,
    },
    {
      id: 'history-2',
      mode: 'solo_streak',
      score: 18,
      correctCount: 18,
      totalQuestions: 19,
      completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'history-3',
      mode: 'solo_streak',
      score: 11,
      correctCount: 11,
      totalQuestions: 12,
      completedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'history-4',
      mode: 'daily_challenge',
      score: 760,
      correctCount: 4,
      totalQuestions: 5,
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'history-5',
      mode: 'solo_streak',
      score: 9,
      correctCount: 9,
      totalQuestions: 10,
      completedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
  dailyChallengeRecord: {
    date: isoDate,
    score: 820,
    correctCount: 4,
    totalQuestions: 5,
    completedAt: isoTime,
    totalTimeMs: 28600,
  },
  wrongQuestions: [
    {
      id: 'wrong-1',
      mode: 'daily_challenge',
      questionId: 'case-1',
      category: '病理 · 组织病理学',
      specialty: '病理',
      modality: '组织病理学',
      description: '一名丙型肝炎肝硬化患者的肝活检，显示不规则的小梁结构。',
      options: ['肝脂肪变性', '肝细胞癌', '正常肝组织', '肝血管瘤'],
      correctAnswer: '肝细胞癌',
      selectedAnswer: '正常肝组织',
      explanation: '切片显示肝细胞小梁增厚和细胞异型性，这是肝细胞癌的特征。',
      difficulty: 'Hard',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Hepatocellular_carcinoma_histopathology_%282%29.jpg/640px-Hepatocellular_carcinoma_histopathology_%282%29.jpg',
      sourceName: 'Wikipedia Commons',
      sourceUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Hepatocellular_carcinoma_histopathology_%282%29.jpg/640px-Hepatocellular_carcinoma_histopathology_%282%29.jpg',
      reviewStatus: 'approved',
      reviewerName: '内容初审组',
      updatedAt: isoTime,
      createdAt: isoTime,
    },
    {
      id: 'wrong-2',
      mode: 'solo_streak',
      questionId: 'case-2',
      category: '神经 · CT',
      specialty: '神经',
      modality: 'CT',
      description: '70岁男性，突然出现左侧肢体无力。头部平扫 CT。',
      options: ['蛛网膜下腔出血', '缺血性脑卒中 (MCA 区域)', '硬膜下血肿', '正常头部 CT'],
      correctAnswer: '缺血性脑卒中 (MCA 区域)',
      selectedAnswer: '正常头部 CT',
      explanation: '右侧 MCA 区域低密度影，灰白质分界模糊，符合急性缺血性脑卒中。',
      difficulty: 'Medium',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/MCA_Territory_Infarct.jpg/600px-MCA_Territory_Infarct.jpg',
      sourceName: 'Wikipedia Commons',
      sourceUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/MCA_Territory_Infarct.jpg/600px-MCA_Territory_Infarct.jpg',
      reviewStatus: 'approved',
      reviewerName: '内容初审组',
      updatedAt: isoTime,
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    },
  ],
  analyticsEvents: [
    {
      id: 'event-1',
      name: 'home_exposed',
      payload: {},
      createdAt: isoTime,
      syncedAt: isoTime,
      identityId: 'demo-local-user-001',
    },
    {
      id: 'event-2',
      name: 'leaderboard_opened',
      payload: {},
      createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      syncedAt: null,
      identityId: 'demo-local-user-001',
    },
  ],
};

const ensureOutputDir = async () => {
  await fs.mkdir(outputDir, { recursive: true });
};

const seedStorage = (seed) => {
  localStorage.setItem('medscan.localPlayerIdentity', JSON.stringify(seed.identity));
  localStorage.setItem('medscan.localAuthUsers', JSON.stringify(seed.authUsers));
  localStorage.setItem('medscan.localAuthSession', JSON.stringify(seed.authSession));
  localStorage.setItem('medscan.localPlayerStats', JSON.stringify(seed.playerStats));
  localStorage.setItem('medscan.trainingHistory', JSON.stringify(seed.trainingHistory));
  localStorage.setItem('medscan.dailyChallengeRecord', JSON.stringify(seed.dailyChallengeRecord));
  localStorage.setItem('medscan.wrongQuestions', JSON.stringify(seed.wrongQuestions));
  localStorage.setItem('medscan.analyticsEvents', JSON.stringify(seed.analyticsEvents));
};

const createContext = async (browser, seed = null) => {
  const context = await browser.newContext({ viewport });
  if (seed) {
    await context.addInitScript(seedStorage, seed);
  }
  const page = await context.newPage();
  await page.goto(baseURL, { waitUntil: 'networkidle' });
  return { context, page };
};

const saveShot = async (page, filename, options = {}) => {
  await page.screenshot({
    path: path.join(outputDir, filename),
    fullPage: options.fullPage ?? true,
  });
};

const clickMenuCardHeading = async (page, text) => {
  await page.getByRole('heading', { name: text, exact: true }).click();
};

const clickButtonByText = async (page, text) => {
  await page.locator('button').filter({ hasText: text }).first().click();
};

const answerDailyChallenge = async (page) => {
  for (let step = 0; step < 20; step += 1) {
    if (await page.getByText('今日挑战完成', { exact: true }).isVisible().catch(() => false)) {
      return;
    }

    const nextLabel = await page.locator('button').filter({ hasText: /继续下一题|查看挑战结果/ }).first();
    if (await nextLabel.isVisible().catch(() => false)) {
      await nextLabel.click();
      await page.waitForTimeout(400);
      continue;
    }

    const optionCards = page.locator('div').filter({ has: page.locator('span.font-semibold') });
    const count = await optionCards.count();
    if (count > 0) {
      await optionCards.nth(0).click();
      await page.waitForTimeout(500);
      continue;
    }

    await page.waitForTimeout(500);
  }
};

const main = async () => {
  await ensureOutputDir();
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
  });

  try {
    {
      const { context, page } = await createContext(browser);
      await saveShot(page, '01-home-guest.png');
      await clickButtonByText(page, '查看全球排名');
      await page.waitForTimeout(300);
      await saveShot(page, '02-login-required-modal.png');
      await context.close();
    }

    {
      const { context, page } = await createContext(browser);
      await clickButtonByText(page, '登录 / 个人主页');
      await page.getByText('个人主页', { exact: true }).waitFor();
      await page.waitForTimeout(300);
      await saveShot(page, '03-profile-guest.png');
      await context.close();
    }

    {
      const { context, page } = await createContext(browser, loggedInSeed);
      await page.waitForTimeout(300);
      await saveShot(page, '04-home-logged-in.png');
      await context.close();
    }

    {
      const { context, page } = await createContext(browser, loggedInSeed);
      await clickButtonByText(page, '查看个人主页');
      await page.getByText('个人主页', { exact: true }).waitFor();
      await page.waitForTimeout(300);
      await saveShot(page, '05-profile-logged-in.png');
      await context.close();
    }

    {
      const { context, page } = await createContext(browser, loggedInSeed);
      await clickButtonByText(page, '查看全球排名');
      await page.getByText('全球排名', { exact: true }).waitFor();
      await page.waitForTimeout(300);
      await saveShot(page, '06-leaderboard.png');
      await context.close();
    }

    {
      const { context, page } = await createContext(browser, loggedInSeed);
      await clickButtonByText(page, '查看错题本');
      await page.getByText('错题本', { exact: true }).waitFor();
      await page.waitForTimeout(300);
      await saveShot(page, '07-wrong-questions.png');
      await context.close();
    }

    {
      const { context, page } = await createContext(browser);
      await clickMenuCardHeading(page, '每日挑战');
      await page.locator('text=今日挑战').first().waitFor();
      await page.waitForTimeout(800);
      await saveShot(page, '08-daily-challenge-playing.png', { fullPage: false });
      await answerDailyChallenge(page);
      await page.waitForTimeout(800);
      await saveShot(page, '09-daily-challenge-result.png', { fullPage: false });
      await context.close();
    }
  } finally {
    await browser.close();
  }
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
