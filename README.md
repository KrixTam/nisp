# nisp
## 简介

NISP 是一个基于事件的轻量协议，当前实现以 UNIX Domain Socket 为传输层，服务端使用 Twisted（Python）实现，客户端示例提供了 Node.js 版本。协议以“事件（Event）”为核心，所有交互通过事件标识 `eid`（18位十六进制字符串）来串联，同时配合有限状态机管理生命周期。

核心特性：
- 事件驱动 + 有限状态机（INIT → INIT_END → PROCESS_APPLY → PROCESS_END）
- 72 bit 事件ID编码，包含随机码、时间戳影子、位置码及命令信息
- 简单的握手与心跳机制
- 请求/响应均为结构化消息，字段包含 `eid`、`data` 以及响应时的 `ec`（错误码）

## 术语与常量

- 事件ID总长：`EVENT_ID_BITS = 72`，编码为 18 位十六进制字符串（`EVENT_ID_LEN = 18`）
- 字段位宽：
  - `RANDOM_CODE_BITS = 6`
  - `TIMESTAMP_SHADOW_BITS = 48`（由时间戳与随机码插入生成）
  - `POSITION_CODE_BITS = 4`
  - `COMMAND_STATE_BITS = 2`
  - `COMMAND_ID_BITS = 12`
- 状态值：`STATE_INIT = 0`，`STATE_INIT_END = 1`，`STATE_PROCESS_APPLY = 2`，`STATE_PROCESS_END = 3`
- 心跳命令：`HEARTBEAT_ID = 0`
- 关键键名：
  - `KEY_EVENT_ID = "eid"`
  - `KEY_DATA = "data"`
  - `KEY_ERROR_CODE = "ec"`
  - `KEY_NAME = "name"`

## 事件ID（eid）编码

事件ID由如下比特连接后再进行十六进制编码：
```
RANDOM_CODE(6) + TIMESTAMP_SHADOW(48) + POSITION_CODE(4) + COMMAND_STATE(2) + COMMAND_ID(12)
```

生成逻辑（简述）：
- 随机码 `random_code` 与随机位置码 `position_code`（0~15）共同作用于时间戳分包（每包 `TS_PACKAGE_LEN - 1 = 7` 位），生成 `TIMESTAMP_SHADOW`（48 位）
- `timestamp` 基于 `EPOCH_MOMENT = moment('2020-12-21')` 和 `EPOCH_DEFAULT = 1608480000` 做偏移与校验，保证“时间不逆流”
- `COMMAND_STATE` + `COMMAND_ID` 共同标识命令与其状态

反解（unpack）时会校验：
- 随机码插入一致性（`random_code` 校验）
- 事件时间不得晚于当前时间（逆流检查）

在 Python 中，可用 `EventId.unpack(eid)` 得到 `(cid, state, timestamp)`。其中 `cid.value` 为命令ID整数，`state.value` 为状态整数，`timestamp` 为 `moment` 时间。

## 消息格式

- 请求（客户端 → 服务端）：
  - 字段：`{ "eid": "<18hex>", "data": <object> }`
  - 校验：`PV_REQUEST` 要求 `eid`（格式）与 `data`（object）

- 响应（服务端 → 客户端）：
  - 字段：`{ "eid": "<18hex>", "ec": <int>, "data": <object> }`
  - 校验：`PV_RESPONSE` 要求 `eid`、`ec`、`data`

注意：Python 服务端样例中使用 `yaml.safe_load` 解析，服务端初始握手发送的内容为 `{'name': '<hex4>'}`（YAML 兼容）。Node 客户端使用 `JSON.parse`，其测试用例中的握手为 `{"name":"<hex4>"}`。实际部署时建议统一为标准 JSON。

## 状态机与心跳流程

- 状态流转：
  - `INIT` → 调用命令 `init()`，成功后推进到 `INIT_END`
  - `PROCESS_APPLY` → 调用命令 `process()`，成功后推进到 `PROCESS_END`
- 响应的 `eid` 与请求的 `eid` 保持“核心一致”（同一时间戳与命令），状态在处理完成后应为 `PROCESS_END`

心跳（`HEARTBEAT_ID = 0`）：
- 客户端收到服务端握手的 `{"name":"<hex4>"}` 后，周期性发送心跳事件：
  - 心跳请求：`{ "eid": "<HEARTBEAT eid>", "data": {"name": "<hex4>"} }`
  - 服务端校验 `PV_HEARTBEAT`（`name` 为 4 位十六进制字符串），且该 `name` 已在连接集 `_clients` 中注册才认为有效
  - 成功返回：`{ "eid": "<PROCESS_END eid>", "ec": 0, "data": {} }`；否则服务端主动断开连接

## 服务端实现（Python / Twisted）

关键模块：
- `nisp/server.py`
  - `NISPServer`：管理配置（socket 路径、超时等）与服务启动/停止
  - `NISProtocol`：Twisted 协议类，`connectionMade` 时下发 `name`；`dataReceived` 处理中校验与事件分发
  - `HeartBeat`：心跳命令（`Command` 子类），`init` 校验客户端注册与 `name` 格式，`process` 返回空数据与 `ec=0`
- `nisp/datamodel.py`
  - `EventId`：事件ID生成/解析/状态推进
  - `Event`：处理请求，调用 `EventId.next()`，生成响应数据
- `nisp/const.py`：位宽、键名、校验器（`ParameterValidator`）与服务端状态等常量
- `nisp/utils.py`：日志与位操作工具

握手流程：
1. 服务端分配 4 位十六进制 `name` 并注册到 `NISProtocol._clients`
2. 下发 `{'name': '<hex4>'}`
3. 客户端后续在心跳或业务报文 `data` 中携带该 `name` 进行校验

## Node.js版本

关键模块：
- `nisp.js/core.js`
  - `NISPClient(fd_path, heartbeat_interval)`：连接、心跳发送、请求发送与事件监听
  - `generate_event_index(...)`：生成事件索引（命令ID + 时间），用于内部回调管理
- `nisp.js/datamodel.js`
  - `Event(cid, state?, ts?)`：生成请求内容（含 `eid` 与 `data`）
  - `unpack_event_id(eid)`：解析事件ID，得到 `[cid_bin, state_bin, moment_ts]`

心跳示例（Node 测试用例逻辑）：
1. 客户端收到服务端 `{"name":"test_abc"}` 后设置本地名称
2. 周期性发送 `HEARTBEAT` 事件，请求 `data` 包含 `name`
3. 服务端返回 `PROCESS_END` 状态的响应，客户端以事件索引触发监听器

## 快速开始

- 启动服务端（默认在当前目录创建 `./nisp.socket`）：
```bash
python run_s.py
```

- 启动 Python 客户端示例（连接并完成握手 + 心跳一次往返）：
```bash
python run_c.py
```

- Node 客户端（参考 `nisp.js` 测试）：
  - 安装依赖：`npm install`（需要 `moment`、`winston`）
  - 使用 `net.createConnection({path: '<socket_path>'})` 连接，并按上文心跳/业务流程构造/解析报文
  - 测试：`npm test`（包含数据模型与客户端行为的单元测试）

## 测试与覆盖率

运行仓库自带的测试与覆盖率报告（生成 `htmlcov`）：
```bash
python run_coverage.py
```

关键测试覆盖：
- 位操作工具：`insert_bit`、`remove_bit`、`separate_bits`
- 数据模型：`CommandId`、`CommandState`、`Command`、`EventId`、`Event`
- 服务端整合测试：握手、心跳与状态校验（`nisp.test.server.test_Server`）
- Node 客户端：连接、重连、心跳与异常处理（`nisp/cli/test/core.test.js`）

## 目录结构（摘录）

- `nisp/const.py`：协议常量与校验器
- `nisp/datamodel.py`：事件ID与事件处理
- `nisp/server.py`：Twisted 服务端与心跳命令
- `nisp/utils.py`：日志与位工具
- `nisp/test/*`：Python 测试
- `nisp/cli/*`：Node 客户端与测试
- `run_s.py` / `run_c.py` / `run_coverage.py`：运行与测试脚本

## 注意事项

- 服务端当前握手报文用 YAML 兼容的单引号字符串，建议在生产环境统一采用标准 JSON
- `EventId.unpack` 对未来时间进行“逆流”检查，异常会导致处理失败或断开
- 心跳仅在 `name` 已注册的前提下有效，握手后需保持该 `name` 一致传输

## EventId 与 EID 格式

- 事件 ID `eid` 统一为 22 位小写十六进制字符串：前 18 位为事件编码，末尾 4 位为 `client_id`。
- `client_id` 为必填，必须是 4 位小写十六进制（例如 `abcd`）。
- Python 构造签名（参数顺序调整）：`EventId(client_id: str, cid: int = 0, state: int = STATE_INIT, timestamp: moment = None)`。
- 序列化：`str(eid)` 返回 22 位字符串（`18位事件编码 + 4位client_id`）。
- 解析：`EventId.unpack(...)` 返回 4 元组 `(cid, state, timestamp, client_id)`。

示例（Python）：
```python
from nisp.datamodel import EventId
from nisp.const import STATE_INIT
from moment import moment

eid = EventId('abcd', cid=1, state=STATE_INIT, timestamp=moment('2021-01-02 12:23:22'))
eid_str = str(eid)  # 22 位，结尾为 'abcd'
cid, state, ts, client_id = EventId.unpack(eid_str)
assert client_id == 'abcd'
```

## 请求/响应消息格式约束

- `KEY_EVENT_ID`（`eid`）必须匹配 `^[a-f0-9]{22}$`。
- 心跳请求 `KEY_NAME`（即 `client_id`）必须是 `^[a-f0-9]{4}$`。

示例（YAML/JSON）：
```json
// 请求
{ "eid": "58ca6e32b444000000abcd", "data": { ... } }

// 响应
{ "eid": "58ca6e32b444000000abcd", "data": { ... }, "ec": 0 }
```

## 心跳与超时

- 心跳使用 `client_id`（4 位 hex）作为标识并在服务器注册。
- 服务器侧心跳超时会打印：`[client_id] 心跳超时（>Ns），断开连接。`
- 事件处理侧超时会打印：`[eid][client_id] 事件超时（>Xs），断开连接。`
- 超时触发将返回 `None`（协议层会断开连接）。

## Quick Start（Python）

- 启动服务器（示例在 `run_s.py`）：保持不变。
- 发送事件（构造 22 位 `eid`，包含 `client_id`）：

```python
from nisp.datamodel import Event, EventId
from nisp.const import STATE_INIT

client_id = 'abcd'  # 必须是 4 位小写十六进制
eid = EventId(client_id, cid=1, state=STATE_INIT)
e = Event(str(eid))
payload = { "name": client_id }
res = e.process(payload)
# 事件处理可能返回响应或因超时/状态返回 None
```

## 兼容性说明

- 旧版 18 位 `eid` 不再支持，会在参数校验阶段（或 `EventId.unpack`）抛出错误。
- 所有构造 `EventId(...)` 的代码需要显式传入 `client_id`（首位参数）。

