const { Builder, By } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const assert = require('assert');

describe('Home App Root Test', function () {
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

    it('should load the app root element', async function () {
        await driver.get('http://localhost:5173/');
        const appRoot = await driver.findElement(By.id('app'));
        assert.ok(await appRoot.isDisplayed());
        await driver.sleep(10000);
    });

    after(async function () {
        if (driver) {
            await driver.quit();
        }
    });
});
