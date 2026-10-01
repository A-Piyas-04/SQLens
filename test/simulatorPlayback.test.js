const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const assert = require('assert');

const APP_URL = process.env.APP_URL || 'http://localhost:5173/';
const SETUP_SQL =
    "DROP TABLE IF EXISTS pb_emp; CREATE TABLE pb_emp (id INT, full_name TEXT, dept TEXT, salary INT); " +
    "INSERT INTO pb_emp VALUES (1,'Alice','Eng',145000),(2,'Bob','Eng',132000),(3,'Carla','Product',118000)," +
    "(4,'David','Ops',95000),(5,'Elena','Product',125000),(6,'Frank','Ops',88000); SELECT * FROM pb_emp;";
const PLAYBACK_SQL =
    'SELECT full_name, salary FROM pb_emp WHERE salary > 100000 ORDER BY salary DESC LIMIT 3';

async function buildDriver({ reducedMotion = false } = {}) {
    const options = new chrome.Options();
    options.addArguments(
        '--disable-notifications',
        '--disable-popup-blocking',
        '--disable-extensions',
        '--no-first-run',
        '--disable-default-apps',
        '--window-size=1440,900'
    );
    if (reducedMotion) options.addArguments('--force-prefers-reduced-motion');
    return new Builder().forBrowser('chrome').setChromeOptions(options).build();
}

async function skipTour(driver) {
    const buttons = await driver.findElements(By.css('.onboarding-tooltip button'));
    if (buttons.length > 0) await buttons[0].click();
}

async function setEditorSql(driver, sql) {
    const content = await driver.wait(until.elementLocated(By.css('.cm-content')), 20000);
    await content.click();
    await content.sendKeys(Key.chord(Key.CONTROL, 'a'), Key.DELETE);
    await content.sendKeys(sql);
    await content.sendKeys(Key.ESCAPE);
}

async function clickButtonWithText(driver, text) {
    const btn = await driver.wait(
        until.elementLocated(By.xpath(`//button[contains(normalize-space(.), "${text}")]`)),
        20000
    );
    await driver.wait(until.elementIsEnabled(btn), 20000);
    await btn.click();
    return btn;
}

async function clickSimulate(driver) {
    const btn = await driver.wait(until.elementLocated(By.css('[data-tour="simulator-panel"] button.retro-key')), 20000);
    await driver.wait(until.elementIsEnabled(btn), 20000);
    await btn.click();
}

async function openPlayback(driver) {
    await clickSimulate(driver);
    return driver.wait(until.elementLocated(By.css('[role="dialog"][aria-label="SQL Execution Playback"]')), 20000);
}

async function prepareApp(driver) {
    await driver.get(APP_URL);
    await driver.sleep(8000);
    await skipTour(driver);
    await setEditorSql(driver, SETUP_SQL);
    await clickButtonWithText(driver, 'Run Query');
    await driver.sleep(1500);
    await setEditorSql(driver, PLAYBACK_SQL);
}

const stageNumber = (driver) =>
    driver.executeScript(() => {
        const dialog = document.querySelector('[role="dialog"][aria-label="SQL Execution Playback"]');
        const m = dialog && dialog.textContent.match(/Stage (\d+) of/);
        return m ? Number(m[1]) : -1;
    });

const phaseLabel = (driver) =>
    driver.executeScript(() => document.querySelector('[data-phase-label]')?.textContent ?? null);

async function waitForDone(driver, timeout = 30000) {
    await driver.wait(async () => (await phaseLabel(driver)) === 'Done', timeout);
}

async function button(driver, label) {
    return driver.findElement(By.css(`button[aria-label="${label}"]`));
}

describe('Simulator playback (fullscreen) E2E', function () {
    this.timeout(240000);
    let driver;

    before(async function () {
        driver = await buildDriver();
        await prepareApp(driver);
    });

    after(async function () {
        if (driver) await driver.quit();
    });

    it('opens the playback modal on the FROM stage', async function () {
        await openPlayback(driver);
        assert.strictEqual(await stageNumber(driver), 1);
        await waitForDone(driver);
        const bar = await driver.findElement(By.css('[data-operation-bar]'));
        assert.ok((await bar.getText()).includes('FROM'));
    });

    it('pauses mid-animation with Space and resumes from the same point', async function () {
        await (await button(driver, 'Next stage')).click();
        await driver.sleep(400);
        assert.notStrictEqual(await phaseLabel(driver), 'Done');
        await driver.findElement(By.css('body')).sendKeys(Key.SPACE);
        await driver.wait(until.elementLocated(By.css('button[aria-label="Resume"]')), 5000);
        const frozen = await driver.executeScript(() => document.querySelector('[data-stage-root]').innerHTML);
        await driver.sleep(2000);
        const still = await driver.executeScript(() => document.querySelector('[data-stage-root]').innerHTML);
        assert.strictEqual(still, frozen, 'stage DOM must not change while paused');
        await driver.findElement(By.css('body')).sendKeys(Key.SPACE);
        await waitForDone(driver);
        assert.strictEqual(await stageNumber(driver), 2);
    });

    it('changes speed without restarting the stage', async function () {
        await (await button(driver, 'Next stage')).click();
        await driver.sleep(300);
        const before = await phaseLabel(driver);
        await (await button(driver, 'Fast speed')).click();
        assert.strictEqual(await (await button(driver, 'Fast speed')).getAttribute('aria-pressed'), 'true');
        const after = await phaseLabel(driver);
        assert.ok(after === before || after !== 'Focus', 'speed change must not reset to the focus phase');
        await waitForDone(driver);
        await (await button(driver, 'Normal speed')).click();
    });

    it('navigates back and replays the stage', async function () {
        const current = await stageNumber(driver);
        await (await button(driver, 'Previous stage')).click();
        await waitForDone(driver);
        assert.strictEqual(await stageNumber(driver), current - 1);
        await (await button(driver, 'Replay stage')).click();
        await driver.sleep(100);
        assert.notStrictEqual(await phaseLabel(driver), 'Done');
        await waitForDone(driver);
    });

    it('autoplay reaches the last stage only after each stage completes', async function () {
        await (await button(driver, 'Switch to autoplay')).click();
        await (await button(driver, 'Play')).click();
        await driver.wait(
            async () => (await stageNumber(driver)) === 5 && (await phaseLabel(driver)) === 'Done',
            90000
        );
        const rows = await driver.findElements(By.css('[data-grid-body] [data-row-id]'));
        assert.strictEqual(rows.length, 3);
    });

    it('collapses the lesson panel into a rail without losing content', async function () {
        await (await button(driver, 'Collapse lesson panel')).click();
        await driver.wait(until.elementLocated(By.css('[data-lesson-rail]')), 5000);
        const hidden = await driver.executeScript(
            () => document.getElementById('simulator-lesson-panel')?.hidden
        );
        assert.strictEqual(hidden, true);
        const stored = await driver.executeScript(() => localStorage.getItem('simulator:lessonPanelCollapsed'));
        assert.strictEqual(stored, '1');
    });

    it('resizes without horizontal scrolling in the visualisation', async function () {
        for (const [w, h] of [[1920, 1080], [1366, 768], [1280, 720]]) {
            await driver.manage().window().setRect({ width: w, height: h });
            await driver.sleep(500);
            const overflow = await driver.executeScript(() => {
                const root = document.querySelector('[data-stage-root]');
                return root.scrollWidth - root.clientWidth;
            });
            assert.ok(overflow <= 1, `no horizontal overflow at ${w}x${h} (got ${overflow}px)`);
        }
        await driver.manage().window().setRect({ width: 1440, height: 900 });
    });

    it('persists the collapsed lesson panel across close/reopen', async function () {
        await driver.findElement(By.css('body')).sendKeys(Key.ESCAPE);
        await driver.wait(async () => (await driver.findElements(By.css('[role="dialog"]'))).length === 0, 5000);
        await clickSimulate(driver);
        await driver.wait(until.elementLocated(By.css('[data-lesson-rail]')), 10000);
        await (await button(driver, 'Expand lesson panel')).click();
        await driver.wait(async () => (await driver.findElements(By.css('[data-lesson-rail]'))).length === 0, 5000);
        await driver.findElement(By.css('body')).sendKeys(Key.ESCAPE);
    });
});

describe('Simulator playback with reduced motion E2E', function () {
    this.timeout(180000);
    let driver;

    before(async function () {
        driver = await buildDriver({ reducedMotion: true });
        await prepareApp(driver);
    });

    after(async function () {
        if (driver) await driver.quit();
    });

    it('reaches the correct final state with reduced motion', async function () {
        await openPlayback(driver);
        for (let i = 1; i < 5; i++) {
            await waitForDone(driver);
            await (await button(driver, 'Next stage')).click();
        }
        await waitForDone(driver);
        assert.strictEqual(await stageNumber(driver), 5);
        const rows = await driver.findElements(By.css('[data-grid-body] [data-row-id]'));
        assert.strictEqual(rows.length, 3);
        const names = await driver.executeScript(() =>
            [...document.querySelectorAll('[data-grid-body] [data-row-id] [data-col="full_name"]')].map((c) => c.textContent)
        );
        assert.deepStrictEqual(names, ['Alice', 'Bob', 'Elena']);
    });
});
