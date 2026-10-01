const { Builder, By } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const assert = require('assert');

describe('SQL 50 Page Load Test', function () {
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

    it('should load the Practice SQL 50 page', async function () {
        await driver.get('http://localhost:5173/practice/sql50');
        await driver.sleep(8000);
        const heading = await driver.findElement(By.css('h1'));
        const text = await heading.getText();
        assert.ok(text.includes('Practice SQL 50'));
        await driver.sleep(10000);
    });

    after(async function () {
        if (driver) {
            await driver.quit();
        }
    });
});
