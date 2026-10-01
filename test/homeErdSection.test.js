const { Builder, By } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const assert = require('assert');

describe('Home ERD Section Test', function () {
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

    it('should show the Entity Relationship Diagram section', async function () {
        await driver.get('http://localhost:5173/');
        await driver.sleep(8000);
        const erdSection = await driver.findElement(By.id('erd-section'));
        const heading = await erdSection.findElement(By.css('h2'));
        const text = await heading.getText();
        assert.ok(text.includes('Entity Relationship Diagram'));
        await driver.sleep(10000);
    });

    after(async function () {
        if (driver) {
            await driver.quit();
        }
    });
});
