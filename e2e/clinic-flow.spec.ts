import { expect, Page, test } from '@playwright/test';

const STORAGE_KEY = 'nam-y-quan:progress:v1';

async function enterClinic(page: Page) {
  await page.goto('./');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByText('Vào Y Quán (Im lặng)').click();
  await expect(page.getByText('Ca 01: Người chèo đò dầm mưa đêm').first()).toBeVisible();
}

async function goRoom(page: Page, label: string) {
  await page.locator('button', { hasText: label }).last().click();
  await page.waitForTimeout(700); // brush-sweep room transition
}

async function pickHerb(page: Page, name: string) {
  const drawer = page.locator('.wood-drawer', { has: page.locator('.drawer-herb-title', { hasText: new RegExp(`^${name}`) }) });
  await drawer.locator('.drawer-face-btn').click();
  await drawer.locator('.drawer-cedar-well').click();
  await page.waitForTimeout(1300); // scoop animation
}

async function progress(page: Page) {
  return page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? '{}'), STORAGE_KEY);
}

test('treats case 01 end to end: examine, seal Sổ Biện Chứng, prescribe, stamp', async ({ page }) => {
  await enterClinic(page);

  await page.locator('.tabletop-tool-btn', { hasText: 'Thẻ Vấn' }).click();
  await page.getByRole('button', { name: /Bác thấy sợ lạnh/ }).click();
  await page.getByRole('button', { name: /Từ sáng tới giờ/ }).click();

  await page.locator('.tabletop-tool-btn', { hasText: 'Đĩa Bát Quái' }).click();
  const ledger = page.locator('.bien-chung-ledger');
  await expect(ledger.locator('.btn-cinnabar')).toHaveText(/0\/4/);
  for (const axis of ['Biểu chứng', 'Hàn chứng', 'Thực chứng']) {
    await page.locator('.knob-half', { hasText: new RegExp(`^${axis}$`) }).click();
  }
  await page.locator('.element-petal-btn.el-kim').click();
  await ledger.locator('.btn-cinnabar').click();
  await expect(ledger).toHaveClass(/is-sealed/);

  await goRoom(page, 'Dược Các');
  for (const herb of ['Tía tô', 'Kinh giới', 'Sinh khương', 'Cam thảo']) await pickHerb(page, herb);

  await goRoom(page, 'Nội Các');
  await page.getByRole('button', { name: /Dập Ấn Chu Sa/ }).click();

  await expect.poll(async () => (await progress(page)).completedCases?.['c1-phong-han']?.bestScore ?? 0).toBeGreaterThanOrEqual(80);
  const p = await progress(page);
  expect(p.pendingFollowUps ?? []).toEqual([]);
});

test('a poor prescription brings the patient back for tái khám with a letter', async ({ page }) => {
  await enterClinic(page);
  await goRoom(page, 'Dược Các');
  await pickHerb(page, 'Bạc hà');
  await goRoom(page, 'Nội Các');
  await page.getByRole('button', { name: /Dập Ấn Chu Sa/ }).click();

  await expect.poll(async () => (await progress(page)).pendingFollowUps?.length ?? 0).toBe(1);
  await page.evaluate((k) => {
    const p = JSON.parse(localStorage.getItem(k)!);
    p.dayCount = p.pendingFollowUps[0].dueDay;
    localStorage.setItem(k, JSON.stringify(p));
  }, STORAGE_KEY);
  await page.reload();
  await page.getByText('Vào Y Quán (Im lặng)').click();

  await page.locator('.follow-up-btn').click();
  await expect(page.locator('.follow-up-letter-sheet')).toBeVisible();
  await page.getByRole('button', { name: /Mời Ông Ba Đò vào/ }).click();
  await expect(page.getByText(/^Tái khám — /).first()).toBeVisible();
});

test('clinic dialogs sit above the fixed guide bar, tray and dock', async ({ page }) => {
  await enterClinic(page);
  await page.locator('button', { hasText: 'Ca & Sổ Y Án' }).first().click();
  await page.getByRole('button', { name: 'Đóng lại' }).click({ timeout: 3000 });
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('settings opens fully on screen and its volume sliders work', async ({ page }) => {
  await enterClinic(page);
  await page.getByRole('button', { name: 'Cài đặt âm thanh và hồ sơ hành y' }).click();
  const dialog = page.getByRole('dialog', { name: 'Cài đặt âm thanh và hồ sơ hành y' });
  const box = await dialog.locator('.woodblock-sheet').boundingBox();
  expect(box!.y).toBeGreaterThanOrEqual(0);
  const slider = dialog.locator('input[type="range"]').first();
  await slider.click(); // a real click: fails if the slider sits off screen or under the HUD
  await slider.fill('20');
  await expect(dialog.getByText('Âm lượng Nhạc & Âm cảnh (20%)')).toBeVisible();
  await dialog.getByRole('button', { name: 'Đóng lại' }).click();
  await expect(dialog).toHaveCount(0);
});
