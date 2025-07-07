import lodash from 'lodash'
import fs from 'node:fs'
import puppeteer from 'puppeteer'
import template from 'art-template'

const _path = process.cwd()

export class Puppeteer {
  constructor () {
    this.config = {
      headless: 'new',
      args: [ '--disable-gpu', '--disable-setuid-sandbox', '--no-sandbox', '--no-zygote' ],
      executablePath: '/usr/bin/google-chrome'
    }
  }

  async screenshot (data = {}) {
    // 初始化浏览器
    let browser = await puppeteer.launch(this.config)
    const {
      multiPageHeight = 4000, imgType = 'jpeg', path, savePath,
      omitBackground = true, quality = 100, multiPage = false
    } = data

    let tmpHtml = fs.readFileSync(data.tplFile, 'utf8')
    tmpHtml = template.render(tmpHtml, data)
    await fs.writeFileSync(savePath, tmpHtml)

    const page = await browser.newPage()
    await page.goto(`file://${ _path }/${ lodash.trim(savePath, '.') }`, {
      waitUntil: 'networkidle2'
    })
    const body = await page.$('#container') || await page.$('body')
    // 统一截图参数处理
    const screenshotOptions = {
      type: imgType,
      omitBackground,
      ...(imgType === 'jpeg' ? { quality } : {}),
      ...(path ? { path } : {})
    }
    // 分页逻辑
    const handleScreenshot = async (element, isFullPage = false) => {
      return isFullPage ?
        await page.screenshot(screenshotOptions) :
        await element.screenshot(screenshotOptions)
    }
    // 优化分页截图
    if (multiPage) {
      const boundingBox = await body.boundingBox()
      const pageCount = Math.ceil(boundingBox.height / multiPageHeight)
      await page.setViewport({
        width: Math.ceil(boundingBox.width),
        height: multiPageHeight + 100
      })
      for (let i = 0; i < pageCount; i++) {
        if (i > 0) {
          await page.evaluate((height) => window.scrollBy(0, height), multiPageHeight)
          // 最后一页调整高度
          if (i === pageCount - 1) {
            const lastPageHeight = boundingBox.height - multiPageHeight * (pageCount - 1)
            await page.setViewport({
              width: Math.ceil(boundingBox.width),
              height: Math.ceil(lastPageHeight)
            })
          }
        }
        await handleScreenshot(body, true)
        if (pageCount > 1 && i < pageCount - 1) {
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      }
    } else {
      // 单页截图
      await handleScreenshot(body)
    }
    return await browser.close()
  }
}


export default new Puppeteer()
