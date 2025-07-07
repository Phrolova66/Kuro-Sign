import fetch from 'node-fetch'


export class KuroApi {
  constructor () {
    this.token = process.env.token
    this.kuroApiUrl = 'https://api.kurobbs.com'
  }

  async getData (key = '', data = {}) {
    let { url, body = '' } = await this.getKuroApi(key, data)
    let headers = await this.getHeaders(url)
    try {
      let response = await fetch(url, {
        method: 'post',
        headers: headers,
        body: body
      })
      if (!response.ok) {
        return { code: response.status, msg: response.statusText }
      }
      return await response.json()
    } catch (e) {
      return { code: e.code, msg: e.msg }
    }
  }

  async getKuroApi (name, data) {
    let ApiMap = {
      // baseData
      base: {
        url: `${ this.kuroApiUrl }/aki/roleBox/akiBox/baseData`,
        body: `gameId=${ data.gameId }&roleId=${ data.roleId }&serverId=${ data.serverId }`,
      },
      // 绑定游戏账号列表
      roleList: {
        url: `${ this.kuroApiUrl }/gamer/role/default`,
      },
      // 鸣潮、战双小组件
      refresh: {
        url: `${ this.kuroApiUrl }/gamer/widget/game${ data.isGr ? 2 : 3 }/refresh`,
        body: `type=${ data.isGr ? 1 : 2 }&sizeType=${ data.isGr ? 2 : 1 }`
      },
      widget: {
        url: `${ this.kuroApiUrl }/gamer/widget/game${ data.isGr ? 2 : 3 }/getData`,
        body: `type=${ data.isGr ? 1 : 2 }&sizeType=${ data.isGr ? 2 : 1 }`
      },
      // 配置信息 V2
      initSignIn: {
        url: `${ this.kuroApiUrl }/encourage/signIn/initSignInV2`,
        body: `gameId=${ data.gameId }&serverId=${ data.serverId }&roleId=${ data.roleId }&userId=${ data.userId }`,
      },
      // 游戏 V2
      signin: {
        url: `${ this.kuroApiUrl }/encourage/signIn/v2`,
        body: `gameId=${ data.gameId }&serverId=${ data.serverId }&roleId=${ data.roleId }&userId=${ data.userId }&reqMonth=${ data.reqMonth }`,
      },
      // 深塔
      tower: {
        url: `${ this.kuroApiUrl }/aki/roleBox/akiBox/towerDataDetail`,
        body: `gameId=${ data.gameId }&roleId=${ data.roleId }&serverId=${ data.serverId }`,
      },
      // 深塔
      slash: {
        url: `${ this.kuroApiUrl }/aki/roleBox/akiBox/slashDetail`,
        body: `gameId=${ data.gameId }&roleId=${ data.roleId }&serverId=${ data.serverId }`,
      },
      // 游戏记录 V2
      queryRecord: {
        url: `${ this.kuroApiUrl }/encourage/signIn/queryRecordV2`,
        body: `gameId=${ data.gameId }&serverId=${ data.serverId }&roleId=${ data.roleId }&userId=${ data.userId }`,
      },
      // 战双资源
      month: {
        url: `${ this.kuroApiUrl }/haru/resource/currentMonth`,
        body: `roleId=${ data.roleId }`
      },
      // 个人信息
      mine: {
        url: `${ this.kuroApiUrl }/user/mineV2`,
      },
      // 社区
      forumSignIn: {
        url: `${ this.kuroApiUrl }/user/signIn`,
        body: `gameId=${ data.gameId }`,
      },
      //帖子列表
      forumList: {
        url: `${ this.kuroApiUrl }/forum/list`,
        body: `forumId=${ data.forumId }&gameId=${ data.gameId }&pageIndex=${ data.pageIndex }&pageSize=${ data.pageSize }`,
      },
      //帖子详情
      postDetail: {
        url: `${ this.kuroApiUrl }/forum/getPostDetail`,
        body: `isOnlyPublisher=0&postId=${ data.postId }&showOderType=2`,
      },
      //通用论坛点赞
      like: {
        url: `${ this.kuroApiUrl }/forum/like`,
        body: `forumId=${ data.forumId }&gameId=${ data.gameId }&likeType=1&operateType=1&postId=${ data.postId }&postType=${ data.postType }&toUserId=${ data.toUserId }`,
      },
      // 社区分享任务
      shareTask: {
        url: `${ this.kuroApiUrl }/encourage/level/shareTask`,
        body: `gameId=${ data.gameId }&postId=${ data.postId }`,
      },
      // 任务列表
      taskList: {
        url: `${ this.kuroApiUrl }/encourage/level/getTaskProcess`,
        body: `gameId=0&userId=${ data.userId }`,
      },
      // 库洛币总数
      totalGold: {
        url: `${ this.kuroApiUrl }/encourage/gold/getTotalGold`,
      },
    }
    return ApiMap[name]
  }

  async getHeaders (url = '') {
    let headers = {
      Host: 'api.kurobbs.com',
      Connection: 'keep-alive',
      source: 'android',
      'b-at': 'f7158ce6b2234299b8bce6ccf04e37d3',
      token: this.token,
      devCode: '113.16.136.193, Mozilla/5.0 (... Chrome/97 Mobile Safari/537.36 Kuro/2.5.3 KuroGameBox/2.5.3)',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept-Encoding': 'gzip, deflate',
      'User-Agent': 'Mozilla/5.0 (... Chrome/97 Mobile Safari/537.36 Kuro/2.5.3 KuroGameBox/2.5.3)',
      Accept: 'application/json, text/plain, */*',
      Origin: 'https://web-static.kurobbs.com',
      'sec-fetch-site': 'same-site',
      'sec-fetch-mode': 'cors',
      'sec-fetch-dest': 'empty',
      'X-Requested-With': 'com.kurogame.kjq',
      'Accept-Language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7'
    }
    if (/(default|user|forum|level|gold)/.test(url)) {
      headers.devCode = ''
      headers.version = '2.5.3'
      headers.versionCode = '2530'
      headers.model = 'PCLM10'
      headers.Cookie = `user_token=${ this.token }`
      headers['User-Agent'] = 'okhttp/3.11.0'
    }
    return headers
  }

}


export default new KuroApi()

