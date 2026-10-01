const { Builder, By } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const assert = require('assert');

describe('SQL 50 Schema Tab Test', function () {
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

    it('should open the schema tab on Practice SQL 50', async function () {
        await driver.get('http://localhost:5173/practice/sql50');
        await driver.sleep(8000);
        const schemaTab = await driver.findElement(By.id('sql50-tab-schema'));
        const role = await schemaTab.getAttribute('role');
        assert.strictEqual(role, 'tab');
        await driver.sleep(10000);
    });

    after(async function () {
        if (driver) {
            await driver.quit();
        }
    });
});
