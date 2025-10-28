# NISP CLI (Node.js)

NISP 的 Node.js 客户端实现与 Python 侧保持一致的协议约定，包含事件编码（EID）、心跳、命令发送与响应解析。

## 概述

- 事件 ID `eid` 固定为 22 位小写十六进制：
  - 前 18 位为事件编码（随机码、时间影子、位置码、命令码）。
  - 后 4 位为 `client_id`（客户端标识）。
- `client_id` 必须是 4 位小写十六进制。若握手名非 4 位 hex，客户端会进行规范化为稳定的 4 位 hex。
- 事件与心跳遵循同一消息格式，服务端负责注册与超时处理。

## 安装

- Node.js 版本建议 `>= 14`
- 包依赖在 `nisp/cli/package.json`

```bash
npm install
```

## EID 与 ClientId

- EID 组成：`18位事件编码 + 4位client_id`。
- 客户端会在握手阶段接收 `name` 并转为 4 位 hex 作为 `client_id`（函数 `utils.normalize_clientid(name)`）。
- 解析 EID：
  - `datamodel.unpack_event_id(eid)` 返回 `[cid_bin, state_bin, timestamp, clientId]`。
  - 旧调用只解构前三项也可工作，`clientId` 可选使用。

示例：

```javascript
const { Event, unpack_event_id } = require('./datamodel');
const constants = require('./constants');
const moment = require('moment');

const clientId = 'abcd';
const evt = new Event(clientId, constants.HEARTBEAT_ID, constants.STATE_INIT_END, new moment('2021-01-02 12:23:22'));
const eid = evt.eid(); // 22位

const [cid_bin, state_bin, ts, cid] = unpack_event_id(eid);
console.log(cid_bin, state_bin, ts.format('YYYY-MM-DD HH:mm:ss.SSS'), cid); // 输出 4 位 clientId
```

## 消息格式

- 请求（JSON）：
  - `eid`：`^[a-f0-9]{22}$`
  - `data`：对象
- 响应（JSON）：
  - `eid`：`^[a-f0-9]{22}$`
  - `data`：对象
  - `ec`：整数（错误码）

示例：

```json
{ "eid": "58ca6e32b444000000abcd", "data": { "name": "abcd" } }
```

```json
{ "eid": "58ca6e32b444000000abcd", "data": {}, "ec": 0 }
```

## API（Node.js）

- `datamodel.Event(clientId, cid, state, ts)`
  - 构造事件；`eid()` 返回 22 位。
  - `process(data)` 返回请求 JSON 字符串或 `null`。
- `datamodel.unpack_event_id(eid)`
  - 解析 22 位 `eid`，返回 `[cid_bin, state_bin, timestamp, clientId]`。
- `core.NISPClient(fd_path, heartbeat_interval=5000)`
  - `connect()`：连接 UNIX Socket 并握手，保存 `name` 与 `clientId`。
  - `heartbeat()`：发送心跳事件（`HEARTBEAT_ID`）。
  - `send_command(cid, ts, data, callback)`：发送命令事件。
  - `apply_command(cid, init_end_callback, process_end_callback)`：注册并发送命令，处理状态演进。
  - `end()`：结束连接（半关闭）。
  - `close()`：关闭连接。
  - `reconnect()`：重连。
- `core.generate_event_index(...)`
  - 生成事件索引，用于客户端内部比对。

## 心跳与超时

- 心跳请求携带 `client_id`，服务端注册并维护心跳时间。
- 服务端心跳超时会在终端打印：`[client_id] 心跳超时（>Ns），断开连接。`
- 事件处理层超时会打印：`[eid][client_id] 事件超时（>Xs），断开连接。`
- 超时触发时，协议层返回 `null`，客户端将断开连接。

## 快速使用

- 启动你的 UNIX Socket 服务（示例请参考 Python 侧 `run_s.py`）。
- 使用 `NISPClient` 进行连接与心跳：

```javascript
const core = require('./core');
const constants = require('./constants');

const client = new core.NISPClient('./nisp.socket', 1000); // 1s 心跳
client.connect();

// 发送命令
setTimeout(() => {
  client.send_command(constants.HEARTBEAT_ID, new (require('moment'))(), {}, (res) => {
    console.log('response:', res);
  });
}, 500);
```

## 测试

Node 测试位于 `nisp/cli/test`，包含数据模型与客户端行为的单元测试。

```bash
npm test
```

或在仓库根目录运行 Python 覆盖率脚本（包含部分 Node 测试）：

```bash
python3 run_coverage.py
```

## 兼容性说明

- 旧版 18 位 `eid` 不再支持（长度与模式校验会抛错）。
- 所有事件必须携带 4 位 `client_id`，生成 `eid` 时会附加到末尾。
- 如果握手名不是 4 位 hex，客户端会进行规范化为稳定的 4 位 hex（`utils.normalize_clientid`）。如需强约束服务端只返回合法值，可改为严格校验并拒绝。