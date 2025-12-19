const http = require('http');
const net = require('net');
const { WebSocket, createWebSocketStream } = require('ws');

// --- 配置参数 ---
// 你的 UUID
const UUID = process.env.UUID || 'a98d91c8-6407-43b0-9335-78c275fea4c9';
// WebSocket 路径
const WSPATH = process.env.WSPATH || UUID.slice(0, 8);
// 监听端口               
const PORT = process.env.PORT || 3000;

const uuidHex = UUID.replace(/-/g, "");

// 创建 HTTP 服务器，用于承载 WebSocket
const httpServer = http.createServer((req, res) => {
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Server is running.');
  } else {
    res.writeHead(404);
    res.end();
  }
});

// 创建 WebSocket 服务
const wss = new WebSocket.Server({ server: httpServer });

wss.on('connection', (ws, req) => {
  // 验证路径
  if (!req.url.startsWith(`/${WSPATH}`)) {
    ws.close();
    return;
  }

  ws.once('message', msg => {
    const [VERSION] = msg;
    const id = msg.slice(1, 17);

    // 验证 UUID
    if (!id.every((v, i) => v == parseInt(uuidHex.substr(i * 2, 2), 16))) {
      ws.close();
      return;
    }

    // 解析 VLESS 头部信息
    let i = msg.slice(17, 18).readUInt8() + 19;
    const port = msg.slice(i, i += 2).readUInt16BE(0);
    const ATYP = msg.slice(i, i += 1).readUInt8();

    let host = '';
    if (ATYP == 1) { // IPv4
      host = msg.slice(i, i += 4).join('.');
    } else if (ATYP == 2) { // Domain
      const hostLen = msg.slice(i, i += 1).readUInt8();
      host = msg.slice(i, i += hostLen).toString();
    } else if (ATYP == 3) { // IPv6
      host = msg.slice(i, i += 16).reduce((s, b, i, a) => (i % 2 ? s.concat(a.slice(i - 1, i + 1)) : s), []).map(b => b.readUInt16BE(0).toString(16)).join(':');
    }

    // VLESS 响应：版本号 + 余项长度(0)
    ws.send(new Uint8Array([VERSION, 0]));

    // 建立双向流转发
    const duplex = createWebSocketStream(ws);
    const conn = net.connect({ host, port }, function () {
      this.write(msg.slice(i));
      duplex.pipe(this).pipe(duplex);
    });

    // 错误处理，防止进程崩溃
    conn.on('error', () => ws.close());
    duplex.on('error', () => conn.destroy());
  });
});

httpServer.listen(PORT, () => {
  console.log(`VLESS Node is running on port ${PORT}`);
  console.log(`WebSocket Path: /${WSPATH}`);
});