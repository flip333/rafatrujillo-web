// Avisa a Bing (→ ChatGPT Search / Copilot), Yandex, Naver, etc. que el sitio cambió.
// Uso, después de cada despliegue a producción:  node scripts/indexnow.mjs
const HOST = 'rafatrujillo.xyz'
const KEY = '8ef2bbaf6efecf1ae34ccce821daf6a3' // archivo público: https://rafatrujillo.xyz/8ef2bbaf6efecf1ae34ccce821daf6a3.txt
const URLS = ['/', '/en', '/privacidad', '/en/privacy', '/llms.txt', '/llms-full.txt'].map(p => `https://${HOST}${p}`)

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList: URLS }),
})
console.log(`IndexNow → ${res.status} ${res.statusText}`, URLS.length, 'URLs')
