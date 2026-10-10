const SHELL = {"version":"0.8.2","generation":"6ecee0785505f83a9cb5","base":"/","assets":["/apple-touch-icon.png","/assets/AvatarStrip-CWCaa7Nl.js","/assets/Modal-BVeY-Wqc.js","/assets/NpcTag-jYrHDBkr.js","/assets/OrderIntro-C_ggzlR8.js","/assets/OrderIntro-Cg2bIpT_.css","/assets/Profile-CMwObcZV.js","/assets/Profile-DQvohWCs.css","/assets/ResultList-BQCcxtTL.css","/assets/ResultList-jDlKAjUs.js","/assets/ResultRow-D3kAS5U7.js","/assets/RoundProgress-CV03eH-D.js","/assets/SegmentPicker-VxLA_ac9.js","/assets/Shell-1FpM8uin.js","/assets/Shell-DBntQJa7.css","/assets/SubmitBanner-zjFo2934.js","/assets/TapButton-DRZ0hYXj.css","/assets/TapButton-d4x7fLY9.js","/assets/Timer-CkjPgG0T.js","/assets/TurnCard-DWjyhQ4J.js","/assets/Tutorial-CGFtfS-g.js","/assets/failure-srm_8CkE.wav","/assets/gobble-CBp7eLi2.js","/assets/gulp-XrPWYMAC.wav","/assets/index-CnX8xxO_.js","/assets/juice-BY1ZqlI_.js","/assets/juice-DtE8m6IY.css","/assets/ladder-CFRy4a17.js","/assets/ladder/replay-BRi8XUoP.js","/assets/liar-B9Nbo69F.css","/assets/liar-DUqXBKpD.js","/assets/nunchi-79IRTUhp.js","/assets/pirate-DVCycf0G.js","/assets/stopwatch-1Eqm-DN9.js","/assets/stopwatch-BhtQW-I8.css","/assets/success-BIg9b5j2.js","/assets/success-BLRK0UwO.wav","/assets/sus-jar-Ceklyl_Y.js","/assets/three.module-C8enonVg.js","/assets/tick-IAYvGoSq.wav","/assets/who-picked-C5AFoCAx.js","/favicon-32.png","/favicon.svg","/gobble/","/gobble/index.html","/icon-192.png","/icon-512.png","/icon-maskable-512.png","/","/index.html","/juice/","/juice/index.html","/ladder/","/ladder/index.html","/ladder/replay/","/ladder/replay/index.html","/liar/","/liar/index.html","/manifest.webmanifest","/nunchi/","/nunchi/index.html","/pirate/","/pirate/index.html","/stopwatch/","/stopwatch/index.html","/sus-jar/","/sus-jar/index.html","/who-picked/","/who-picked/index.html"]};
/* 앱 셸 워커. 빌드가 위에 `const SHELL = { version, generation, base, assets }` 를 붙인다. */
const PREFIX = 'moyeora-shell-'
const CACHE = PREFIX + SHELL.generation
const urls = new Set(SHELL.assets.map((a) => new URL(a, self.location.origin).href))
const NAV_TIMEOUT_MS = 4000

self.addEventListener('install', (event) => {
  // 새 워커는 설치만 하고 기다린다. 적용은 사용자가 안전한 화면에서 누를 때(APPLY_UPDATE)
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE)
    try {
      // 일부만 받은 채로 끝내지 않는다: 실패하면 이번 세대를 버리고 다음 확인 때 다시
      await cache.addAll(SHELL.assets.map((a) => new Request(a, { cache: 'reload' })))
    } catch (err) {
      await caches.delete(CACHE)
      throw err
    }
  })())
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // 다른 탭이 아직 이전 세대 파일을 쓸 수 있어 가장 최근 이전 세대는 남긴다
    const others = (await caches.keys()).filter((k) => k.startsWith(PREFIX) && k !== CACHE)
    await Promise.all(others.slice(0, -1).map((k) => caches.delete(k)))
    await self.clients.claim()
  })())
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'APPLY_UPDATE') event.waitUntil(self.skipWaiting())
  if (event.data?.type === 'GET_UPDATE_INFO') event.ports?.[0]?.postMessage({ version: SHELL.version })
})

// 페이지: 네트워크 우선(서버가 있어야 하는 앱이라 최신이 기본), 느리거나 끊기면 캐시
const navigate = async (request) => {
  const ctl = new AbortController()
  const t = setTimeout(() => ctl.abort(), NAV_TIMEOUT_MS)
  try {
    return await fetch(request, { signal: ctl.signal })
  } catch (err) {
    const hit = await caches.match(request, { ignoreSearch: true })
    if (hit) return hit
    throw err
  } finally {
    clearTimeout(t)
  }
}

self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin) return
  if (request.mode === 'navigate') return event.respondWith(navigate(request))
  const key = url.origin + url.pathname
  if (urls.has(key)) {
    event.respondWith(caches.open(CACHE).then((c) => c.match(key)).then((hit) => hit ?? fetch(request)))
  } else if (url.pathname.startsWith(SHELL.base + 'assets/')) {
    // 해시 파일: 다른 탭이 이전 세대 파일을 아직 요청할 수 있다
    event.respondWith(caches.match(request).then((hit) => hit ?? fetch(request)))
  }
})
