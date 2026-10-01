const { Builder, By } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const assert = require('assert');

describe('SQL 50 Navigate Home Test', function () {
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

    it('should go back to the workspace from Practice SQL 50', async function () {
        await driver.get('http://localhost:5173/practice/sql50');
        await driver.sleep(8000);
        const workspaceButton = await driver.findElement(By.css('header button'));
        await workspaceButton.click();
        await driver.sleep(2000);
        const url = await driver.getCurrentUrl();
        assert.ok(url.includes('localhost:5173'));
        assert.ok(!url.includes('/practice/sql50'));
        await driver.sleep(10000);
    });

    after(async function () {
        if (driver) {
            await driver.quit();
        }
    });
});
