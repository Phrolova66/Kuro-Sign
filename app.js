import lodash from 'lodash'
import { KuroApi, common } from '#mao'


export class App {
  constructor () {
  }

  // 社区和任务
  async forumSignIn () {
    let data = { tasks: [] }
    try {
      // 获取个人信息
      const mine = await KuroApi.getData('mine')
      const userId = mine?.data?.mine?.userId
      if (!mine.success || !userId) {
        console.error(`[${ mine.code }]: ${ mine.msg }`)
        return
      }
      // 获取任务列表
      const taskList = await KuroApi.getData('taskList', {
        userId: userId
      })
      let { dailyTask, maxDailyGold } = taskList?.data
      if (!taskList.success || !dailyTask.length) {
        console.error(`[${ mine.code }]: ${ mine.msg }`)
        return
      }
      // 帖子列表
      const forumList = await KuroApi.getData('forumList', {
        forumId: 9,
        gameId: 3,
        pageIndex: 1,
        pageSize: 20
      })
      let postList = forumList?.data?.postList || [] // 数组
      if (!forumList.success || !postList.length) {
        console.error(`[${ forumList.code }]: ${ forumList.msg }`)
        return
      }
      // 任务映射关系
      const taskMap = {
        '用户签到': (post) => [ 'forumSignIn', { gameId: 2 } ],
        '浏览3篇帖子': (post) => [ 'postDetail', { postId: post.postId } ],
        '点赞5次': (post) => [ 'like', {
          forumId: post.gameForumId,
          gameId: post.gameId,
          postId: post.postId,
          toUserId: post.userId,
          postType: post.postType
        } ],
        '分享1次帖子': (post) => [ 'shareTask', { gameId: post.gameId, postId: post.postId } ]
      }
      // 执行任务
      for (const task of dailyTask) {
        const { remark, process, needActionTimes, completeTimes } = task
        if (process >= 1.0) {
          data.tasks.push({ remark, msg: '✅已完成' })
          continue // 已完成，跳过
        }
        // 找出任务需要执行的次数
        let max = needActionTimes - completeTimes
        for (const [ i, post ] of postList.entries()) {
          if (i === max) break
          const [ key, params ] = await taskMap[remark](post)
          // 执行
          let result = await KuroApi.getData(key, params)
          if (!result.success) max++
          // 每次操作后休眠1秒，防止频繁请求
          await common.sleep(1000)
        }
        data.tasks.push({ remark, msg: '✅已完成' })
      }
      // 6. 查询总库洛币
      const totalGold = await KuroApi.getData('totalGold')
      data.dailyGold = maxDailyGold || 0
      data.totalGold = totalGold?.data?.goldNum || 0
      return data
    } catch (error) {
      console.error('执行出错:', error.message)
      return false
    }
  }


  // 游戏
  async gameSignIn (data = {}) {
    const baseParams = {
      gameId: data.gameId,
      serverId: data.serverId,
      roleId: data.roleId,
      userId: data.userId
    }
    if (!data.hasSignIn) {
      // 初始化
      await KuroApi.getData('initSignIn', baseParams)
      // 执行
      const signInParams = {
        ...baseParams,
        reqMonth: new Date().toISOString().slice(5, 7) // 自动生成MM格式月份
      }
      await KuroApi.getData('signin', signInParams)
    }
    // 查询结果
    const { data: [ { goodsName, goodsNum, goodsUrl } ] } = await KuroApi.getData('queryRecord', baseParams)
    // 物品
    return { goodsName, goodsNum, goodsUrl }
  }


  static async run () {
    let app = new App()
    let result = {}
    try {
      // 社区
      let forumData = await app.forumSignIn()
      // TODO 咕咕咕....

      // 封装数据获取逻辑
      const getGameData = async (data = { isGr: false }) => {
        await KuroApi.getData('refresh', data)
        return await KuroApi.getData('widget', data)
      }
      // 执行
      let games = await Promise.all([ getGameData(), getGameData({ isGr: true }) ])

      // 统一校验数据有效性
      if (!games.every(game => game?.success && game?.data)) {
        return false
      }
      games = lodash.map(games, game => game.data)

      // 并行处理游戏数据
      result.games = await Promise.all(games.map(async (game) => {
        game.isGr = game.gameId === 2
        game.serverTime = common.datetime(game.serverTime)
        game = await common.dailyData(game)

        // 签到
        let sign = await app.gameSignIn(game)
        // TODO 咕咕咕....

        if (game.isGr) {
          game.serverName = '战双帕弥什'
          const monthData = await KuroApi.getData('month', { roleId: game.roleId })
          game.monthData = await common.monthData(monthData?.data)
          game.bossData = await common.bossData(game.bossData)
        } else {
          let params = {
            gameId: game.gameId,
            roleId: game.roleId,
            serverId: game.serverId
          }
          const [ base, tower, slash ] = await Promise.all([
            JSON.parse((await KuroApi.getData('base', params))?.data),
            JSON.parse((await KuroApi.getData('tower', params))?.data),
            JSON.parse((await KuroApi.getData('slash', params))?.data)
          ])
          const { rougeTitle: name, rougeScore: cur, rougeScoreLimit: total } = base
          let weeklyData = [ game.weeklyData, { name, cur, total }, game.battlePassData ]
          game.weeklyData = await common.weeklyData(weeklyData)
          game.bossData = await common.bossData([ ...tower.difficultyList, ...slash.difficultyList ])
        }
        game.logo = `images/${ game.serverName }.webp`
        return game
      }))
      await common.reader(result)
    } catch (error) {
      console.error('执行出错:', error)
      return false
    }
  }
}


await App.run()
