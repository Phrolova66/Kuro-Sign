import lodash from 'lodash'
import { puppeteer } from '#mao'


/** 公共函数 */
const common = {

  /** 休眠  */
  async sleep (ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  },

  /** 时间 */
  datetime (times) {
    return new Date(times * 1000).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
  },

  /** 截图 */
  async reader (data) {
    let _path = process.cwd()
    data = {
      bg: 'images/bg.webp',
      acg: 'images/acg.webp',
      logo: 'images/app.webp',
      sys: {
        scale: 'style=transform:scale(2.0)',
      },
      resPath: '../Kuro-Sign/resources/',
      savePath: 'sign.html',
      path: 'resources/sign.webp',
      defaultLayout: `${ _path }/resources/common/layout/default.html`,
      tplFile: `./resources/sign.html`,
      ...data
    }
    return await puppeteer.screenshot(data)
  },

  /**
   *  日常
   * @param data
   * @returns {Promise<*>}
   */
  async dailyData (data) {
    const datas = data.isGr ? [ 'actionData', 'dormData', 'activeData' ] : [ 'energyData', 'storeEnergyData', 'livenessData' ]
    data.dailyData = lodash.map(datas, ds => {
      let { name, status, key, cur, total, img } = data[ds]
      delete data[ds]
      return { name: name || key, status, cur, total, img }
    })
    return data
  },

  /**
   * 周常
   * @param data
   * @returns {Promise<*>}
   */
  async weeklyData (data) {
    const tmpMap = {
      战歌重奏: '本周收取次数：',
      千道门扉的异想: '本周异想积分：',
      先约电台: '本周经验上限：'
    }
    return lodash.map(data, ds => {
      let { name, status = 0, show = false, level = 0, cur, total, score = '' } = ds
      if (Array.isArray(ds)) {
        name = '先约电台'
        level = ds[0].cur
        cur = ds[1].cur
        total = ds[1].total
        show = true
        score = cur / total * 100
        score = `style='background: linear-gradient(90deg, #bb9f5e ${ score }%, #bdbdbd 0%)'`
      }
      return { name, status, show, level, tips: tmpMap[name], cur, total, score, img: `images/${ name }.webp` }
    })
  },

  /**
   * 战双资源
   * @param data
   * @returns {Promise<{currentMonth: (number|*)}>}
   */
  async monthData (data) {
    let monthData = {
      currentMonth: data.currentMonth
    }
    monthData.detail = lodash.map([ '黑卡:BlackCard', '研发资源:DevelopResource', '贸易凭据:TradeCredit' ], v => {
      let [ name, key ] = v.split(':')
      return { name, cur: data[`current${ key }`], month: data[`month${ key }`] }
    })
    return monthData
  },

  /**
   * 深渊挑战
   * @param data
   * @param isGr
   * @returns {Promise<{isGr: {name: *, status: *, cur: *, total: *, icon: *, img: string}}|{[p: string]: {name: *, status: *, cur: *, total: *, icon: *, img: string}, [p: number]: {name: *, status: *, cur: *, total: *, icon: *, img: string}, [p: symbol]: {name: *, status: *, cur: *, total: *, icon: *, img: string}}|({name: *, status: number, cur: *|number, total: *|number, icon: string, img: string} | {name: *, status: number, cur: *, total: *, icon: string, img: string} | undefined)[]>}
   */
  async bossData (data, isGr = false) {
    return isGr ?
      lodash.map(data, boss => {
        let { name, status, cur, total, img } = boss
        return { name, status, cur, total, icon: img, img: 'images/bg-common.webp' }
      }) :
      lodash.map(data, boss => {
        let { difficultyName: name, status = 0, towerAreaList, allScore: cur, maxScore: total } = boss
        if (/超载区|深境区/.test(name)) {
          let cur = lodash.sumBy(towerAreaList, v => v.star)
          let total = lodash.sumBy(towerAreaList, v => v.maxStar)
          return { name, status, cur, total, icon: 'images/tower.webp', img: `images/${ name }.webp` }
        }
        if (/再生海域/.test(name)) {
          return { name, status, cur, total, icon: 'images/slash.webp', img: `images/${ name }.webp` }
        }
      }).filter(Boolean)
  }

}


export default common
