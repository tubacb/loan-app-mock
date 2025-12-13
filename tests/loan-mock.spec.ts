import { test, expect } from '@playwright/test';
import {LoanPage} from "./loan-page";

const serviceURL = 'http://localhost:3000';
let loanPage:LoanPage;

test.beforeEach(async ({ page }) => {
    loanPage = new LoanPage(page);
    await page.goto(serviceURL);
})

test('default flow with mock', async ({page}) => {
    const amountValue: string = '22.3'
    const amountResponse = {paymentAmountMonthly: amountValue};
    await page.route('**/api/loan-calc?amount=500&period=12', async route => {
        await route.fulfill({
            contentType: 'application/json',
            body: JSON.stringify(amountResponse),
        });
    });
    await page.goto(serviceURL);
    await loanPage.checkVisibility(loanPage.monthlyPayment);
    const textContentElement = await loanPage.monthlyPayment.textContent()
    const monthlyValue = textContentElement?.replace('€', '').trim() ?? ''
    expect(monthlyValue).toBe(amountValue);
})

test.only('amount error flow with mock', async ({page}) => {

    await page.route('**/api/loan-calc?amount=50&period=12', async route => {
        await route.fulfill({
            status:400,
        });
    });
    await loanPage.amount.fill('50');
    await loanPage.checkVisibility(loanPage.error);
    await page.route('**/api/loan-calc?amount=500&period=12', async route => {
        await route.fulfill({
            status:200,
        });
    });
    await loanPage.amount.fill('500');
    await expect(loanPage.error).toBeHidden();
    await loanPage.mainFlow('user','password')
})

test('main flow', async ({ page }) => {
    await page.goto(serviceURL);
    await loanPage.mainFlow('username','password');
});

test('redirect flow', async ({ page }) => {
    await page.goto(serviceURL);
    await loanPage.img1.click();
    await expect(loanPage.applyButton).toBeInViewport();
    await loanPage.img2.click();
    await expect(loanPage.applyButton).toBeInViewport();
})

