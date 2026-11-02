// 本地预览用的假 nuo 接口：在普通浏览器里模拟糯叽机宿主，AI 返回固定示例数据。
// 只用于开发测试，不要粘进糯叽机。
(function () {
  const mem = {};
  const log = (...a) => console.log('[mock]', ...a);
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  let n = 0;
  const post = (board, i) => ({
    board,
    title_ko: ['이 드라마 결말 나만 이해 안 됨?', '회사에서 점심 혼밥하는 수다러 있어?', '썸남이 답장을 3시간 뒤에 함 ㅠㅠ', '새벽 3시인데 잠이 안 와', '오늘 퇴근길에 개웃긴 일 있었음 ㅋㅋㅋ'][i % 5] + (n ? ' ' + n : ''),
    title_zh: ['这部剧的结局只有我看不懂吗？', '有在公司一个人吃午饭的姐妹吗？', '暧昧对象三小时后才回消息呜呜', '凌晨三点了还睡不着', '今天下班路上遇到超好笑的事哈哈哈'][i % 5],
    body_ko: '아니 진짜 ㅋㅋㅋ\n나만 그런 거 아니지?\n수다러들 생각 궁금함',
    body_zh: '不是真的哈哈哈\n不会只有我这样吧？\n想听听大家的想法',
    comments: [
      { ko: 'ㄹㅇ 나도 그럼 ㅋㅋㅋㅋ', zh: '真的我也是哈哈哈' },
      { ko: '헐 미쳤다', zh: '天哪疯了' },
      { ko: '원글 수다러 힘내 ㅠㅠ', zh: '楼主加油呜呜' },
    ],
  });
  window.nuo = {
    storage: {
      async get(k) { return mem[k] ?? null; },
      async set(k, v) { mem[k] = v; },
      async getAll() { return { ...mem }; },
      async remove(k) { delete mem[k]; },
    },
    ai: {
      async chat(messages, opts) {
        await wait(300);
        const u = messages[messages.length - 1].content;
        log('ai.chat', opts || '', u.slice(0, 40));
        n++;
        let out;
        if (/个新帖子/.test(u)) {
          const boards = (u.match(/\b(movie|chat|love|night)\(/g) || ['chat(']).map((s) => s.slice(0, -1));
          out = [0, 1, 2, 3, 4].map((i) => post(boards[i % boards.length], i + n));
          return { text: '```json\n' + JSON.stringify(out) + '\n```' };
        }
        if (/挑一个你此刻/.test(u)) out = { board: 'night', title_ko: '요즘 누가 자꾸 생각남', title_zh: '最近总是想起某个人', body_ko: '말은 못 하겠고\n그냥 여기다 씀', body_zh: '说不出口\n就写在这里了' };
        else if (/user_ko/.test(u)) out = { user_ko: '나도 완전 공감함 ㅠㅠ', user_zh: '我也超有共鸣呜呜', replies: [{ ko: 'ㅇㅈ', zh: '认同', to_user: true }] };
        else if (/以你自己的身份写一条评论/.test(u)) out = { ko: '…이거 혹시 나 얘기임? ㅋㅋ', zh: '……这说的不会是我吧？哈哈' };
        else if (/用户要在/.test(u)) out = { title_ko: '오늘 너무 피곤함', title_zh: '今天好累', body_ko: '하루종일 일함 ㅠㅠ', body_zh: '上了一整天班呜呜', comments: [{ ko: '고생했어 수다러', zh: '辛苦啦' }] };
        else if (/再生成/.test(u)) out = { comments: [{ ko: '나 3번이랑 같은 생각', zh: '我和3楼想的一样', reply_to: 3 }, { ko: '이거 핫게 갈 듯', zh: '这帖要上热门了', reply_to: null }] };
        else out = { zh: '（翻译）' + u.slice(0, 20) };
        return { text: JSON.stringify(out) };
      },
    },
    roster: { async list() { return [{ id: 12, name: '서도윤' }, { id: 34, name: '林晚' }]; } },
    feed: {
      async publish(o) { log('feed.publish', o.items.length, 'items'); window.__lastFeed = o; return { items: o.items.length }; },
      async clear() { log('feed.clear'); },
      async nudge(t, o) { log('feed.nudge', t, JSON.stringify(o)); },
    },
    actions: {
      _box: [{ id: 'do_1', actionId: 'writePost', args: { board: 'love', title_ko: '연락 기다리는 중', body_ko: '그냥… 기다리는 중임', title_zh: '在等消息', body_zh: '就……在等', anon: 'yes' }, charId: '12', charName: '서도윤', via: 'chat', at: Date.now() - 60000 }],
      async declare(list, o) { log('actions.declare', list.length, o && o.eagerness); },
      async inbox() { const b = this._box; this._box = []; return b; },
      async ack(ids, o) { log('actions.ack', JSON.stringify(ids), JSON.stringify(o)); window.__lastAck = o; },
    },
    chat: { async sendCard(c) { log('chat.sendCard', c.title); window.__lastCard = c; } },
    on(ev, fn) { log('on', ev); },
  };
  window.Nuojiji = { close() { log('close'); }, async getUser() { return { nickname: '밤산책' }; } };
})();
