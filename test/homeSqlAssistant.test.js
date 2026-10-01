const { Builder, By } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const assert = require('assert');

describe('SQL Assistant Form Test', function () {
    this.timeout(45000);
    let driver;

    before(async function () {
        const options = new chrome.Options();
        options.addArguments(
            '--disable-notifications',
            '--disable-popup-blocking',
            '--disable-extensions',
            '--no-first-run',
            '--disable-default-apps'
        );
        driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .build();
    });

    it('should type a question into the SQL Assistant form', async function () {
        await driver.get('http://localhost:5173/');
        await driver.sleep(8000);
        const skipTour = await driver.findElement(By.css('.onboarding-tooltip button'));
        await skipTour.click();
        const openAssistant = await driver.findElement(By.css('button[aria-label="Open SQL assistant"]'));
        await openAssistant.click();
        const promptBox = await driver.findElement(By.css('textarea'));
        await promptBox.sendKeys('Show courses taken by students in the CSE department');
        const typed = await promptBox.getAttribute('value');
        assert.ok(typed.includes('CSE department'));
        await driver.sleep(10000);
    });

    after(async function () {
        if (driver) {
            await driver.quit();
        }
    });
});
