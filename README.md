# VLESS Node

轻量级 VLESS 节点，可以用于 [pella.app](https://www.pella.app) 平台。

## 生成 UUID.

[https://www.uuidgenerator.net](https://www.uuidgenerator.net)

## Clash Verge 客户端配置

```yaml
- { name: "Node-VLESS", type: vless, server: 你的域名, port: 443, uuid: 你的UUID, tls: true, skip-cert-verify: true, tnt: true, udp: true, network: ws, servername: 你的域名, ws-opts: { path: /你的WS路径, headers: { Host: 你的域名 } } }
```

## VLESS 标准链接
```
vless://你的UUID@你的域名:443?encryption=none&security=tls&sni=你的域名&allowInsecure=1&type=ws&host=你的域名&path=%2F你的WS路径#Node-VLESS
```
