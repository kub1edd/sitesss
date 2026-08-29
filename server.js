const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const PORT = process.env.PORT || 3000;
const TWITCH_WEB_CLIENT = 'kimne78kx3ncx6brgo4mv6wki5h1ko';

// Массив разных Client-ID, включая мобильные и консольные, которые обходят Integrity
const CLIENT_IDS = [
    { id: 'kd1erw4rtjc41gr00cdiruktdx27eb', ua: 'Dalvik/2.1.0 (Linux; U; Android 11; SM-G998B Build/RP1A.200720.012) tv.twitch.android.app/13.4.0' }, // Android
    { id: 'ue6666qo983tsx6so1t0vnawi233wa', ua: 'Twitch/11.9.1 (iPhone; iOS 15.0; Scale/3.00)' }, // iOS
    { id: 'jzkbprff40iqj646a697cyrvl0zt2m6', ua: 'Nintendo Switch' }, // Switch
    { id: '72cdcdcy1sso7lz1v9e7zo3yl1aeqr', ua: 'FireTV' }, // FireTV
    { id: 'ttb34u0pue6vvtsswbsfbl2m6j960e', ua: 'TwitchTV' }, // Generic TV
    { id: 'kimne78kx3ncx6brgo4mv6wki5h1ko', ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' } // Web
];

function twitchPost(body, clientObj) {
    return new Promise((resolve, reject) => {
        const headers = {
            'Content-Type': 'application/json',
            'Client-ID': clientObj.id,
            'User-Agent': clientObj.ua,
            'X-Device-Id': Math.random().toString(36).substring(2, 15),
            'Content-Length': Buffer.byteLength(body),
            'Accept-Encoding': 'gzip'
        };

        const opts = { hostname: 'gql.twitch.tv', port: 443, path: '/gql', method: 'POST', headers };
        
        const req = https.request(opts, res => {
            let stream = res;
            if (res.headers['content-encoding'] === 'gzip') {
                stream = zlib.createGunzip();
                res.pipe(stream);
            }
            let data = '';
            stream.on('data', c => data += c);
            stream.on('end', () => resolve({ status: res.statusCode, body: data }));
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

const server = http.createServer(async (req, res) => {

    // ══════════════════════════════════════════════
    //  ПОИСК КАНАЛОВ (Сверхбыстрый точный поиск)
    // ══════════════════════════════════════════════
    if (req.url.startsWith('/api/search?q=')) {
        const query = decodeURIComponent(req.url.split('/api/search?q=')[1]).replace(/"/g, '');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'application/json');

        const body = JSON.stringify({ query: `{ user(login: "${query}") { login displayName profileImageURL(width:50) } }` });

        try {
            const r = await twitchPost(body, CLIENT_IDS[CLIENT_IDS.length - 1]); // Web client
            if (r.status === 200) {
                const d = JSON.parse(r.body);
                if (d?.data?.user) {
                    res.writeHead(200);
                    res.end(JSON.stringify([d.data.user]));
                    return;
                }
            }
            res.writeHead(200);
            res.end('[]');
        } catch (e) {
            res.writeHead(500);
            res.end(JSON.stringify({ error: e.message }));
        }
        return;
    }

    // ══════════════════════════════════════════════
    //  GQL PROXY (для клипов)
    // ══════════════════════════════════════════════
    if (req.url === '/api/gql' && req.method === 'POST') {
        let body = '';
        req.on('data', c => body += c);
        req.on('end', async () => {
            try {
                const r = await twitchPost(body, CLIENT_IDS[CLIENT_IDS.length - 1]); // Используем обычный Web Client
                res.writeHead(r.status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
                res.end(r.body);
            } catch (e) {
                res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
                res.end(JSON.stringify({ error: e.message }));
            }
        });
        return;
    }

    // ══════════════════════════════════════════════
    //  STATIC FILES
    // ══════════════════════════════════════════════
    let filePath = './public' + decodeURI(req.url);
    if (req.url === '/') filePath = './public/index.html';
    const ext = String(path.extname(filePath)).toLowerCase();
    const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.otf': 'font/otf', '.ttf': 'font/ttf', '.mp3': 'audio/mpeg' };
    fs.readFile(filePath, (err, content) => {
        if (err) { res.writeHead(404); res.end('Not found'); }
        else { res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' }); res.end(content); }
    });
});

server.listen(PORT, () => console.log(`[Clip Battle] http://localhost:${PORT}`));
