const SHELL = {"version":"0.8.1","generation":"f975650935bca09dbc09","base":"/","assets":["/apple-touch-icon.png","/assets/AvatarStrip-5pxE1s_X.js","/assets/Modal-BCQirdQf.js","/assets/NpcTag-B0AyIV3A.js","/assets/Profile-D0x96MsE.js","/assets/Profile-qtPlCvl5.css","/assets/ResultList-BQCcxtTL.css","/assets/ResultList-BcCH219d.js","/assets/ResultRow-Cd7jY17Q.js","/assets/RoundProgress-BQrxuYmJ.js","/assets/SegmentPicker-otCHzWVq.js","/assets/Shell-DG4-hsvU.js","/assets/Shell-l4dZYyCx.css","/assets/SubmitBanner-pm4qdfcR.js","/assets/TapButton-CmndovMZ.js","/assets/TapButton-DRZ0hYXj.css","/assets/Timer-DIIeswfl.js","/assets/TurnCard-B-bScXnw.js","/assets/Tutorial-e77jO02J.js","/assets/failure-srm_8CkE.wav","/assets/index-DC0ecRsD.js","/assets/juice-DtE8m6IY.css","/assets/juice-RyQxDWF9.js","/assets/ladder-BYzjwJ0s.js","/assets/ladder/replay-C4w0DQXF.js","/assets/liar-B9Nbo69F.css","/assets/liar-CfzYDnF8.js","/assets/nunchi-DKoImRBN.js","/assets/pirate-DnPR-dsE.js","/assets/stopwatch-B-3k-bD3.js","/assets/stopwatch-BhtQW-I8.css","/assets/success-BLRK0UwO.wav","/assets/sus-jar-D560NwLl.js","/assets/three.module-C8enonVg.js","/assets/tick-IAYvGoSq.wav","/assets/who-picked-Byz62xvI.js","/favicon-32.png","/favicon.svg","/icon-192.png","/icon-512.png","/icon-maskable-512.png","/","/index.html","/juice/","/juice/index.html","/ladder/","/ladder/index.html","/ladder/replay/","/ladder/replay/index.html","/liar/","/liar/index.html","/manifest.webmanifest","/nunchi/","/nunchi/index.html","/pirate/","/pirate/index.html","/stopwatch/","/stopwatch/index.html","/sus-jar/","/sus-jar/index.html","/who-picked/","/who-picked/index.html"]};
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
