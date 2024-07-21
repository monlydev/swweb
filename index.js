const express = require('express');
const chrome = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');

const app = express();
const port = process.env.PORT || 3000;

async function screenshot(url) {
    const options = process.env.AWS_REGION
        ? {
            args: chrome.args,
            executablePath: await chrome.executablePath,
            headless: chrome.headless
        }
        : {
            args: [],
            executablePath:
                process.platform === 'win32'
                    ? 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
                    : process.platform === 'linux'
                    ? '/usr/bin/google-chrome'
                    : '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
        };
    const browser = await puppeteer.launch(options);
    const page = await browser.newPage();
    await page.setViewport({ width: 2000, height: 1000 });
    await page.goto(url, { waitUntil: 'networkidle0' });
    const screenshot = await page.screenshot({ type: 'png' });
    await browser.close();
    return screenshot;
}

app.get('/screenshot', async (req, res) => {
    const { url } = req.query;
    if (!url) {
        return res.status(400).send('URL is required');
    }

    try {
        const image = await screenshot(url);
        res.writeHead(200, {
            'Content-Type': 'image/png',
            'Content-Length': image.length
        });
        res.end(image);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
