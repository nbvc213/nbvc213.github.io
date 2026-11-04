---
date: 2026-11-03
tags: [Vue, TypeScript, Axios, 请求取消, 请求竞态, 服务端分页, 文件上传, 文件下载]
description: "通过可在本地运行的银行账户接口，掌握请求取消、响应乱序、统一错误处理、登录失效、服务端分页与排序、文件上传下载及接口验收。"
draft: false
---

## 学习目标与时间安排

前面的课程已经使用 Axios 发过 GET、POST 请求，也学习过 `axios.create()`、请求拦截器、响应拦截器、Vite 代理、`async/await`、`try/catch/finally` 和浏览器 Network。补充第三天还学习了 Vue Router 的登录与路由守卫。

接下来要解决的是另一类企业项目中很容易遇到的问题：**用户连续点击查询，旧请求却最后返回；HTTP 200 但业务码失败；账户列表需要让后端分页；服务端返回文件，浏览器却把它当作 JSON；登录会话过期，多个页面该怎么处理。**

这些问题不是多记几个 `axios.get()` 参数就能解决的。我们需要理解一次请求的生命周期、前后端约定，以及请求结果什么时候才允许写入页面。

| 主线内容 | 建议时间 | 本日要掌握的能力 |
| --- | ---: | --- |
| 搭建本地 HTTP 联调环境 | 15 分钟 | 区分前端、开发代理、后端和 Network |
| 取消请求与响应竞态 | 25 分钟 | `AbortController`、`signal`、只接受最新响应 |
| 统一错误与登录失效 | 20 分钟 | Axios 错误、401/403、业务码和响应拦截器 |
| 服务端分页和排序 | 25 分钟 | 查询参数、`total`、分页联动、远程排序 |
| 文件上传与下载 | 25 分钟 | `File`、`FormData`、进度、`Blob`、对象 URL |
| 排查与验收 | 10 分钟 | 按请求链路定位问题 |
| **主线合计** | **120 分钟** | |

`Promise.all()` 并行请求、防抖、请求超时与通用 API 类型设计放在拓展章节。第一次学习先完成主线，不必追求一次记住全部配置。

### 本日的示例是什么类型

这一篇与第五天的“内存 Mock”不同：**所有主线示例都通过 Axios 发起真实 HTTP 请求。** 为了让你不依赖公司内网或外部公开接口，我们会在本机启动一个很小的教学服务器。

请把下面三层分清楚：

```text
浏览器中的 Vue 页面
        │
        │ Axios 请求 /api/...
        ▼
Vite 开发服务器（示例端口 5173）
        │
        │ proxy 转发 /api 请求
        ▼
Node.js 教学接口服务器（示例端口 9009）
        │
        ├── GET  /api/accounts       查询、分页和排序
        ├── GET  /api/profile        演示会话过期
        ├── GET  /api/diagnostic     演示 HTTP 错误
        ├── POST /api/upload         接收上传请求
        ├── GET  /api/report         返回 CSV 文件
        └── GET  /api/limits         查询模拟限额
```

- **真实 HTTP**：浏览器确实向 Vite 发请求，Vite 代理到本地 Node.js 服务，Network 可以观察请求和响应。
- **教学接口**：服务器使用程序里的假数据，没有接入真实银行数据库，也没有真实用户认证。
- **生产系统**：登录认证、权限、文件存储、参数校验、限流与审计等必须由后端按真实项目规范实现，教学服务不具备这些保障。

### 运行环境

沿用之前的 Vue 3 + TypeScript + Vite 工程。Node.js 建议使用 **20 或更新的 LTS 版本**。如果你使用的是项目指定的 Node.js 版本，应以团队兼容性要求为准。

在包含 `package.json` 的项目根目录检查依赖：

```bash
npm install axios element-plus
```

如果项目已经安装，就不需要重复安装。再分别打开两个终端：

```bash
# 终端 A：启动下面提供的本地教学接口
node mock-server.mjs
```

```bash
# 终端 B：启动 Vite
npm run dev
```

`mock-server.mjs` 是 Node.js 的 `.mjs` 模块文件，可以直接使用 `import`；它**不是** Vue 组件，也不会被浏览器直接执行。

### 代码复制规则

下面的**公共配置文件只需创建一次**：

- 项目根目录：`mock-server.mjs` 和 `vite.config.ts`；
- `src/main.ts`：注册 Element Plus；
- `src/api/http.ts`：创建通用 Axios 实例。

后续每个“完整程序”会分别给出 `src/App.vue` 和必要的 API 文件。它们是互相独立的实验：**一次只运行当前章节的一个 `App.vue`，不要合并多个 `<script setup>`。**

如果你已有路由、Pinia 或团队插件，应在自己的入口文件中保留它们，不能为了照抄最小示例而删掉原有初始化配置。

## 准备一套可以真正发 HTTP 请求的实验工程

### 先认识 Vite 代理的作用

例如，浏览器从 `http://localhost:5173` 打开页面，直接请求 `http://127.0.0.1:9009/api/accounts`，就属于不同源（端口不同）。浏览器会根据同源策略和服务器的 CORS 响应头决定前端能否读取结果。

本日使用 Vite 代理，让页面只请求相对地址 `/api/...`。Vite 将其转发给 9009 端口的教学服务：

```text
页面发出：http://localhost:5173/api/accounts
代理目标：http://127.0.0.1:9009/api/accounts
```

这个例子**没有**去掉 `/api` 前缀，前后端都使用它。代理只在 Vite 开发服务器运行时生效，生产部署必须由真正的网关或 Web 服务器配置转发。

### 公共文件：Vite 配置

文件：`vite.config.ts`。

```ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
    plugins: [vue()],
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://127.0.0.1:9009',
                changeOrigin: true
            }
        }
    }
});
```

逐个认识这里的配置：

- `defineConfig()`：Vite 提供的配置辅助函数，帮助 TypeScript 检查配置内容。
- `vue()`：Vue 的 Vite 插件，用于处理 `.vue` 文件。
- `server.port`：开发服务器使用的首选端口。
- `server.proxy`：匹配路径的代理规则。
- `target`：请求转发到的目标服务地址。
- `changeOrigin`：转发时调整请求的 Host 等相关信息。

修改 `vite.config.ts` 后应重启 Vite 开发服务器。若终端显示的端口不是 5173，浏览器以终端实际地址为准。

### 公共文件：Vue 入口

文件：`src/main.ts`。

```ts
import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import App from './App.vue';

createApp(App)
    .use(ElementPlus)
    .mount('#app');
```

`createApp(App)` 创建以 `App.vue` 为根组件的应用；`.use(ElementPlus)` 安装组件库；`.mount('#app')` 把页面挂载到 `index.html` 中 `id="app"` 的元素上。和原来的基础课程相同，本日不要求重新学习这些概念。

### 公共文件：Axios 实例

文件：`src/api/http.ts`。

```ts
import axios from 'axios';

// 这是浏览器侧的 Axios 实例，不是服务器。
export const http = axios.create({
    baseURL: '/api',
    timeout: 5000
});
```

`axios.create()` 创建一份独立的请求配置。后续写 `http.get('/accounts')`，最终浏览器请求的是 `/api/accounts`。`timeout: 5000` 代表请求超时时间为 5000 毫秒（5 秒）。

这里暂时不增加拦截器。先把普通请求调通，再学习统一错误处理，避免还没看到真实响应就被公共层改写数据。

### 公共文件：本地 Node.js 教学服务器

文件：项目根目录 `mock-server.mjs`。

下面是本日所有主线示例共用的完整服务端程序。**本节不要求掌握 Node.js 服务器编写方法**；你只需知道这些 URL 会返回什么，后面通过 Network 看它们的响应。为了方便验证，这份代码完整列出，不需要另外安装 Express、数据库或上传中间件。

```js
import { createServer } from 'node:http';

const PORT = 9009;

// 虚构账户数据，仅供本地教学。
const accounts = Array.from({ length: 23 }, (_, index) => ({
    id: index + 101,
    name: index % 2 === 0 ? `张客户${index + 1}` : `李客户${index + 1}`,
    balance: (index + 1) * 350
}));

function json(res, status, body) {
    res.writeHead(status, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store'
    });
    res.end(JSON.stringify(body));
}

function ok(data) {
    // 本练习约定 '0000' 为业务成功码，其他项目不一定一样。
    return { code: '0000', message: '成功', data };
}

function readRequestBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        let total = 0;

        let tooLarge = false;

        req.on('data', chunk => {
            total += chunk.length;

            // 超出 2 MB 后不再保存数据，但先读完请求，
            // 让下面的 catch 能正常返回 HTTP 413。
            if (total > 2 * 1024 * 1024) {
                tooLarge = true;
                return;
            }

            chunks.push(chunk);
        });

        req.on('end', () => {
            if (tooLarge) {
                reject(new Error('请求体过大'));
            } else {
                resolve(Buffer.concat(chunks));
            }
        });
        req.on('error', reject);
    });
}

const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);
    const path = url.pathname;

    // GET /api/accounts?keyword=张&page=1&pageSize=5&sort=balance&order=desc
    if (req.method === 'GET' && path === '/api/accounts') {
        const keyword = (url.searchParams.get('keyword') ?? '').trim();
        const page = Number(url.searchParams.get('page') ?? '1');
        const pageSize = Number(url.searchParams.get('pageSize') ?? '5');
        const sort = url.searchParams.get('sort') ?? '';
        const order = url.searchParams.get('order') ?? '';
        const delay = Number(url.searchParams.get('delay') ?? '250');

        if (!Number.isInteger(page) || page < 1 ||
            !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 20) {
            json(res, 400, { code: 'PARAM', message: '分页参数不合法' });
            return;
        }

        if (!Number.isFinite(delay) || delay < 0 || delay > 10000) {
            json(res, 400, { code: 'PARAM', message: 'delay 不合法' });
            return;
        }

        let result = accounts.filter(item => item.name.includes(keyword));

        if (sort === 'balance' && (order === 'asc' || order === 'desc')) {
            result = [...result].sort((a, b) => {
                return order === 'asc'
                    ? a.balance - b.balance
                    : b.balance - a.balance;
            });
        }

        const total = result.length;
        const start = (page - 1) * pageSize;
        const items = result.slice(start, start + pageSize);

        // 可调延迟用于模拟网络慢以及响应先后顺序不同。
        setTimeout(() => {
            if (!res.destroyed) {
                json(res, 200, ok({ items, total, page, pageSize }));
            }
        }, delay);
        return;
    }

    // GET /api/profile?expired=1：模拟登录会话失效。
    if (req.method === 'GET' && path === '/api/profile') {
        if (url.searchParams.get('expired') === '1') {
            json(res, 401, { code: 'SESSION_EXPIRED', message: '登录已失效' });
            return;
        }

        // HTTP 200，但业务码失败。用于学习两层错误的区别。
        if (url.searchParams.get('businessFail') === '1') {
            json(res, 200, { code: 'B001', message: '模拟业务处理失败', data: null });
            return;
        }

        json(res, 200, ok({ displayName: '演示用户', role: 'viewer' }));
        return;
    }

    // GET /api/diagnostic?status=403 或 500：模拟不同 HTTP 错误。
    if (req.method === 'GET' && path === '/api/diagnostic') {
        const status = Number(url.searchParams.get('status') ?? '200');
        if (status === 403 || status === 500) {
            json(res, status, { code: `HTTP_${status}`, message: '教学用错误响应' });
        } else {
            json(res, 200, ok({ available: true }));
        }
        return;
    }

    // GET /api/limits：用于 Promise.all 并行请求练习。
    if (req.method === 'GET' && path === '/api/limits') {
        json(res, 200, ok({ dailyLimit: 20000, currency: 'CNY' }));
        return;
    }

    // POST /api/upload：只统计接收到的请求体字节，不存储文件。
    if (req.method === 'POST' && path === '/api/upload') {
        const contentType = req.headers['content-type'] ?? '';

        if (!contentType.startsWith('multipart/form-data; boundary=')) {
            json(res, 400, { code: 'FORMAT', message: '需要 multipart/form-data' });
            return;
        }

        try {
            const data = await readRequestBody(req);
            if (data.length === 0) {
                json(res, 400, { code: 'EMPTY', message: '没有上传内容' });
                return;
            }

            // 注意：这个字节数包含 multipart 边界及字段信息，
            // 不等于原文件大小；本服务不会解析或保存文件。
            json(res, 200, ok({ receivedBytes: data.length }));
        } catch {
            if (!res.destroyed) {
                json(res, 413, { code: 'TOO_LARGE', message: '请求体过大' });
            }
        }
        return;
    }

    // GET /api/report：返回 CSV 文件，而不是 JSON。
    if (req.method === 'GET' && path === '/api/report') {
        const content = [
            '编号,账户名称,余额',
            ...accounts.slice(0, 5).map(item =>
                `${item.id},${item.name},${item.balance}`
            )
        ].join('\r\n');

        // BOM 让一些表格软件更容易识别 UTF-8 中文。
        const csv = Buffer.from('\uFEFF' + content, 'utf8');
        res.writeHead(200, {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': 'attachment; filename="accounts.csv"',
            'Content-Length': csv.length
        });
        res.end(csv);
        return;
    }

    json(res, 404, { code: 'NOT_FOUND', message: '接口不存在' });
});

server.listen(PORT, '127.0.0.1', () => {
    console.log(`教学 HTTP 服务已启动：http://127.0.0.1:${PORT}`);
});
```

这份程序特意使用 Node.js 内置的 `node:http`，只需要 Node.js 就能运行。如果启动时报 `EADDRINUSE`，说明 9009 端口已被占用：关闭占用该端口的进程，或者同时修改 `mock-server.mjs` 中的 `PORT` 和 `vite.config.ts` 中的 `target`。

**上传演示的限制：** 本地接口只验证请求是 multipart 格式并统计接收字节，不会保存原文件，不会解析字段、进行杀毒或审核，也不代表真实银行附件服务的实现方式。

### 完整程序：先证明 HTTP 链路确实通了

文件：`src/App.vue`。

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { http } from './api/http';

interface Account {
    id: number;
    name: string;
    balance: number;
}

interface PageData<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
}

interface ApiResult<T> {
    code: string;
    message: string;
    data: T;
}

const rows = ref<Account[]>([]);
const message = ref('尚未查询');
const loading = ref(false);

async function load(): Promise<void> {
    if (loading.value) return;

    loading.value = true;
    message.value = '正在请求……';

    try {
        const response = await http.get<ApiResult<PageData<Account>>>(
            '/accounts',
            { params: { page: 1, pageSize: 3 } }
        );

        if (response.data.code !== '0000') {
            throw new Error(response.data.message);
        }

        rows.value = response.data.data.items;
        message.value = `请求成功，服务端总共有 ${response.data.data.total} 条`;
    } catch (error) {
        message.value = error instanceof Error ? error.message : '请求失败';
    } finally {
        loading.value = false;
    }
}
</script>

<template>
    <h2>HTTP 联通测试</h2>
    <el-button :loading="loading" @click="load">获取前三条账户</el-button>
    <p>{{ message }}</p>
    <p v-for="item in rows" :key="item.id">
        {{ item.id }} · {{ item.name }} · {{ item.balance }} 元
    </p>
</template>
```

运行后先启动服务端，再启动 Vite，点击按钮。Network 的 Fetch/XHR 中应看到 `GET /api/accounts?page=1&pageSize=3`，HTTP 200；Response 中的业务码为 `'0000'`，`data.items` 有三条记录，`data.total` 为 23。

请注意三个层级：

- `response`：Axios 响应对象，含 HTTP `status` 等信息。
- `response.data`：服务端返回的整个 JSON，含 `code`、`message`、`data`。
- `response.data.data.items`：服务端分页结果中的当前页账户数组。

这里不是固定要写三个 `.data`，而是**严格按照服务端实际响应结构逐层取值**。如果团队接口的返回结构不同，必须相应调整类型和访问路径。

> [!EXERCISE] 排查本地 HTTP 不通
>
> 按下“获取前三条账户”，Network 显示 500 或代理错误，页面提示请求失败。应该按什么顺序检查？
>
> 【答案】
>
> 先确认终端 A 的 Node.js 服务是否已经启动；再检查 `vite.config.ts` 的 `target` 是否为正确的主机与端口；然后看 Network 的 Request URL 是否以 `/api/accounts` 结尾。最后检查后端终端输出和 Network Response。不要只因为 Axios 报错就立即修改 Vue 模板。
>
> 如果打开 `http://127.0.0.1:9009/api/accounts` 能得到 JSON，但通过 Vite 的 `/api/accounts` 失败，优先检查 Vite 代理是否重启并生效。

## 请求取消与响应竞态：只显示最后一次查询的结果

### 为什么正常的 `await` 仍然可能显示旧数据

假设用户在账户查询页上连续执行：

1. 输入“张”，点击查询；服务器需要 1500 毫秒才能返回。
2. 立刻改为“李”，再次点击查询；服务器只需 100 毫秒就能返回。
3. 第二个请求先返回，页面显示“李”对应的账户。
4. 第一个请求后返回，如果代码直接执行 `rows.value = result`，页面又被旧查询覆盖为“张”对应的账户。

这就是**请求竞态（Request Race Condition）**：多个异步操作完成的先后顺序，不一定与用户发起它们的先后顺序相同。

下面这段代码存在问题：

```ts
async function search(keyword: string): Promise<void> {
    const response = await http.get('/accounts', {
        params: { keyword }
    });

    // 不知道这是不是用户目前最后一次发起的查询。
    rows.value = response.data.data.items;
}
```

问题不在于 `await` 失效，而是**它只等待当前这个函数自己的请求**；它不会自动取消其他函数调用，也不会替你判断哪个请求更新。

### `AbortController` 是什么

`AbortController` 是浏览器提供的标准 API（不属于 Axios 专有 API），用于向支持取消的异步操作发送中止信号。

```ts
const controller = new AbortController();
```

这里的 `controller` 是一个控制器对象。它提供两个重要成员：

- `controller.signal`：中止信号。把它传给支持取消的操作。
- `controller.abort()`：向该信号发送中止请求。

Axios 支持在请求配置中传入 `signal`：

```ts
const controller = new AbortController();

const response = await http.get('/accounts', {
    signal: controller.signal
});
```

如果稍后执行：

```ts
controller.abort();
```

Axios 会尝试取消这个尚未完成的客户端请求。在常见 Axios 版本中，取消会使 Promise 拒绝，出现取消类错误。可以用 `axios.isCancel(error)` 判断是不是取消错误。

**取消不是业务失败。** 用户发起新查询时，旧查询被取消，是正常的页面行为，不应该弹出“服务器异常”。

**取消也不保证服务器没有执行操作。** 客户端停止等待响应，不等于服务器一定已经停止处理。特别是支付、转账等写入请求，不能依靠 `controller.abort()` 判断交易未发生；必须查询服务端最终状态并使用业务幂等机制。

### 为什么仍然需要“请求编号”

只取消上一个请求虽然很有帮助，但实际开发中还应该避免旧异步回调覆盖新状态。例如：

- 旧请求在取消前已经完成；
- `finally` 在新请求开始后才执行，错误地把新的 loading 改成 `false`；
- 其他步骤使用的 Promise 不能立即取消。

可以给每次请求分配递增的编号：

```ts
let requestId = 0;

async function search(): Promise<void> {
    const mine = ++requestId;

    // ... await ...

    if (mine !== requestId) {
        // 自己已经不是最新的一次查询，不再更新页面。
        return;
    }
}
```

`++requestId` 会先把编号加一，再返回新编号。`mine` 是当前函数调用取得的编号；`requestId` 保存最新编号。只有两者相等，当前调用才有权更新页面。

因此，较稳妥的方案是：**新请求先取消旧请求；旧结果即使仍然到达，也不得覆盖新请求的状态。**

### 完整程序：快速输入时旧结果不会覆盖新结果

公共文件 `mock-server.mjs`、`vite.config.ts`、`src/main.ts`、`src/api/http.ts` 沿用前面的版本。只需替换 `src/App.vue`。

```vue
<script setup lang="ts">
import { ref, onUnmounted } from 'vue';
import axios from 'axios';
import { http } from './api/http';

interface Account {
    id: number;
    name: string;
    balance: number;
}

interface PageData<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
}

interface ApiResult<T> {
    code: string;
    message: string;
    data: T;
}

const keyword = ref('');
const rows = ref<Account[]>([]);
const loading = ref(false);
const message = ref('输入“张”或“李”，然后快速连续查询');

// 当前请求使用的取消控制器。
let currentController: AbortController | null = null;

// 当前最新请求编号，不需要放进 ref，因为不用于模板展示。
let latestId = 0;

async function search(): Promise<void> {
    // 每次点击都立即增加编号，标记为当前最新请求。
    const mine = ++latestId;

    // 先取消旧请求，再创建本次请求的控制器。
    currentController?.abort();
    const controller = new AbortController();
    currentController = controller;

    loading.value = true;
    message.value = `正在查询“${keyword.value}”……`;

    // 本例只为观察响应乱序，按关键词设置不同延迟。
    const requestedKeyword = keyword.value.trim();
    const delay = requestedKeyword.includes('张') ? 1500 : 100;

    try {
        const response = await http.get<ApiResult<PageData<Account>>>(
            '/accounts',
            {
                params: {
                    keyword: requestedKeyword,
                    page: 1,
                    pageSize: 10,
                    delay
                },
                // Axios 根据这个信号取消当前请求。
                signal: controller.signal
            }
        );

        // 已经过时的结果不能覆盖新查询。
        if (mine !== latestId) return;

        if (response.data.code !== '0000') {
            throw new Error(response.data.message);
        }

        rows.value = response.data.data.items;
        message.value = `最新查询“${requestedKeyword}”完成`;
    } catch (error) {
        // 旧请求发生的错误与取消，不影响当前新请求的页面。
        if (mine !== latestId || axios.isCancel(error)) return;

        message.value = error instanceof Error
            ? error.message
            : '查询失败';
    } finally {
        // 只有最新请求才能修改公共 loading 和控制器。
        if (mine === latestId) {
            loading.value = false;
            currentController = null;
        }
    }
}

onUnmounted(() => {
    // 组件离开页面，不再允许挂起请求修改状态。
    latestId += 1;
    currentController?.abort();
    currentController = null;
});
</script>

<template>
    <h2>账户查询：最新请求优先</h2>

    <el-input
        v-model="keyword"
        placeholder="先查询张，再快速查询李"
        style="width: 280px; margin-right: 8px"
        @keyup.enter="search"
    />

    <!-- 故意不禁用按钮，才可以验证两个请求重叠的场景。 -->
    <el-button type="primary" @click="search">查询</el-button>

    <p>{{ loading ? '最新请求处理中' : '当前没有活动查询' }}</p>
    <p>{{ message }}</p>

    <el-table :data="rows" border>
        <el-table-column prop="id" label="编号" width="110" />
        <el-table-column prop="name" label="账户名称" />
        <el-table-column prop="balance" label="余额" />
    </el-table>
</template>
```

**如何操作：**

1. 打开 Network，并勾选 `Preserve log`。
2. 输入“张”，点击查询；这次请求会带上 `delay=1500`。
3. 立刻修改为“李”，再次点击；新请求带上 `delay=100`。
4. 新请求返回后，页面只应显示“李”相关账户。
5. 被取消的旧请求在 Network 中可能显示为 canceled；它不能再把表格恢复成“张”。

这个示例同时防止三种问题：旧结果覆盖新结果、旧错误污染新提示、旧 `finally` 提前关闭新请求的 loading。

### 这个例子中的几个新语法

`onUnmounted()`：组件卸载完成时执行回调，适合停止定时器、监听器和本例尚未结束的请求。它不是每次 `v-show` 隐藏都会执行；`v-show` 只隐藏 DOM，不卸载组件。

`currentController?.abort()`：使用可选链 `?.`。当控制器是 `null` 时，不会调用 `abort()`；有控制器时则执行取消。

`return`：在异步函数中提前返回，结束当前函数的后续逻辑。它不等于取消其他请求，也不会自己中止已经发出的 HTTP 请求。

`axios.isCancel(error)`：Axios 的辅助函数，用于识别取消类型的错误；它和 `axios.isAxiosError(error)` 的用途不同，后者识别更广泛的 Axios 错误。

### 哪些场景适合取消请求

- 账户名称自动搜索，输入不断变化；
- 页码快速切换，前一页请求尚未结束；
- 离开页面后不再需要旧数据；
- 一次请求被更新的查询条件取代。

**不适合用取消来判断交易完成与否**：提交转账、扣款、创建订单等写入操作已经发出后，即使前端取消等待，服务端也可能完成处理。正确处理需要接口提供请求标识、状态查询或幂等机制。

> [!EXERCISE] 为什么 `finally` 也要判断请求编号
>
> 第一次请求开始后，第二次请求马上开始。第一次请求随后因为取消而进入 `finally`。如果它无条件执行 `loading.value = false`，会发生什么？
>
> 【答案】
>
> 第二次请求实际上还在进行，但页面被旧请求的 `finally` 提前设置为“已结束”。只有当旧请求编号仍然等于最新编号时，才允许它修改共享的 loading。取消请求本身并不会自动解决多个异步函数共同修改页面状态的问题。

## 统一错误处理：分清 HTTP、业务码与登录失效

### 为什么不能把全部错误都显示成“请求失败”

用户看到相同的“请求失败”，背后可能是完全不同的问题：

| 现象 | HTTP 层 | 业务层或客户端 | 应该怎样处理 |
| --- | --- | --- | --- |
| 查询成功 | 200 | `code = '0000'` | 展示数据 |
| 无权限 | 403 | 可能有业务错误说明 | 告知没有权限，必要时提供申请入口 |
| 未登录 / 会话过期 | 401 | 认证状态失效 | 清理登录状态，按项目规则进入登录流程 |
| 服务器异常 | 500 | 接口内部失败 | 提示稍后重试，记录排查信息 |
| 网络断开 | 没有可用 HTTP 响应 | Axios 拒绝 Promise | 提示网络连接问题 |
| 客户端主动取消 | 通常无新的有效业务结果 | Axios 取消类错误 | 不把它当作业务错误弹窗 |
| HTTP 成功、业务失败 | 200 | 例如 `code='B001'` | 按接口协议显示业务说明 |

注意：401、403 的常见含义来自 HTTP 语义；不同企业网关或接口有自己的附加约定。例如有些系统登录失效返回 HTTP 200 加特定业务码，前端必须以实际接口协议为准。

### `axios.isAxiosError()` 和 `error.response`

`catch (error)` 中的值不一定是 AxiosError。按照 TypeScript 的安全写法，先做运行时判断：

```ts
import axios from 'axios';

if (axios.isAxiosError(error)) {
    console.log(error.message);
    console.log(error.response?.status);
    console.log(error.response?.data);
}
```

- `axios.isAxiosError(error)`：判断是否为 Axios 错误对象。
- `error.message`：错误说明文本。
- `error.response?.status`：如果服务器确实返回了 HTTP 响应，可以读取状态码。
- `error.response?.data`：服务器返回的错误响应体。
- `error.request`：底层请求信息，收到响应之前失败时有助于区分情况。
- `error.code`：Axios 错误代码，可能用于识别超时、取消等情况。

这里的 `?.` 很重要：网络断开或请求根本没收到响应时，`response` 可能不存在，不能直接访问 `error.response.status`。

### `response.data.code` 和 HTTP `status` 是两个层次

我们的教学接口返回：

```json
{
    "code": "0000",
    "message": "成功",
    "data": {
        "displayName": "演示用户",
        "role": "viewer"
    }
}
```

此时 HTTP `status` 是 200，业务码是 `response.data.code`。两者不能混淆。

一般 Axios 在默认 `validateStatus` 规则下，会对不在 2xx 范围内的 HTTP 状态拒绝 Promise，因此 401、403、500 可进入 `catch`。但 HTTP 200 加失败业务码不会自动进入 `catch`，需要**按业务协议主动判断**。

### 响应拦截器为什么要继续抛出错误

下面是常见的响应拦截器结构：

```ts
http.interceptors.response.use(
    response => response,
    error => Promise.reject(error)
);
```

- 第一段处理成功的 HTTP 响应，返回完整 Axios 响应对象。
- 第二段处理 Axios 拒绝的结果，返回一个已拒绝的 Promise，让调用方继续进入 `catch`。

如果失败回调只打印日志，不返回或抛出错误，后续调用方可能收到意外的 `undefined` 成功值，导致错误被错误地“吞掉”。

本日教学示例让成功拦截器返回原始 `response`，因此页面仍然按 `response.data` 读取数据；**不要在同一份代码中一会儿返回 `response`，一会儿返回 `response.data`，却不调整类型和调用方。**

### 统一处理 401，不等于每个 API 都自己跳登录

在企业项目中，可能几十个接口都会返回 401。如果每个页面的 `catch` 都各自写一套跳转登录的逻辑，就容易出现重复提示或重复导航。

可以在公共请求层提供一个“登录失效通知入口”，由应用初始化或页面决定接到通知后怎样处理。这样请求层只识别 HTTP，路由和登录状态仍由应用层管理。

下面的示例不包含真实登录凭证，也不伪造可以访问真实账户的身份。我们只让一个演示接口返回 401，学习状态处理和提示流程。

### 完整程序：统一错误说明与登录失效通知

这里会**替换前面的公共 `src/api/http.ts`**，并额外创建一个 API 模块。完成本节后，下一节继续使用这份增强的 Axios 实例也可以，因为它仍然返回原始 `response`。

文件一：`src/api/http.ts`。

```ts
import axios from 'axios';

export const http = axios.create({
    baseURL: '/api',
    timeout: 5000
});

// 应用层注册的“会话失效”回调。
type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;
let notified = false;

export function setUnauthorizedHandler(
    handler: UnauthorizedHandler | null
): void {
    onUnauthorized = handler;
}

// 教学中手动恢复通知状态；真实项目可在重新登录成功后重置。
export function resetUnauthorizedNotice(): void {
    notified = false;
}

http.interceptors.response.use(
    response => response,
    error => {
        if (
            axios.isAxiosError(error) &&
            error.response?.status === 401 &&
            !notified
        ) {
            notified = true;
            onUnauthorized?.();
        }

        // 不吞掉错误，让页面仍可处理当前请求失败。
        return Promise.reject(error);
    }
);

// 把技术层异常转换为适合教学页面展示的短说明。
export function describeHttpError(error: unknown): string {
    if (axios.isCancel(error)) {
        return '请求已取消';
    }

    if (axios.isAxiosError(error)) {
        const status = error.response?.status;

        if (status === 401) return '登录会话已过期';
        if (status === 403) return '当前账号没有操作权限';
        if (status === 404) return '请求接口不存在';
        if (status === 500) return '服务器内部错误';

        // 本例的 Axios 超时默认可表现为 ECONNABORTED。
        if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
            return '请求超时，请稍后重试';
        }

        if (!error.response) return '网络连接失败或没有收到响应';

        return `HTTP ${status ?? '未知'} 请求失败`;
    }

    return error instanceof Error ? error.message : '发生未知错误';
}
```

新函数说明：

- `setUnauthorizedHandler(handler)`：保存由页面或应用提供的会话失效回调；传入 `null` 可以解除注册。
- `resetUnauthorizedNotice()`：重置通知标志，允许之后再次收到一轮 401 通知。
- `describeHttpError(error)`：把 `unknown` 错误转换为适合本演示页面显示的字符串。
- `notified`：模块级标志，避免同时返回多个 401 时重复通知。真实应用应结合登录成功、退出登录和路由变化管理它。

文件二：`src/api/profile.ts`。

```ts
import { http } from './http';

interface Profile {
    displayName: string;
    role: string;
}

interface ApiResult<T> {
    code: string;
    message: string;
    data: T;
}

export async function getProfile(
    expired: boolean,
    businessFail = false
): Promise<Profile> {
    const response = await http.get<ApiResult<Profile>>('/profile', {
        params: {
            // 两个参数只用于触发教学接口中的对应分支。
            expired: expired ? 1 : 0,
            businessFail: businessFail ? 1 : 0
        }
    });

    const body = response.data;

    // HTTP 200 并不免除业务码检查。
    if (body.code !== '0000') {
        throw new Error(body.message);
    }

    return body.data;
}

export async function getDiagnostic(status: number): Promise<void> {
    await http.get('/diagnostic', {
        params: { status }
    });
}
```

文件三：`src/App.vue`。

```vue
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import {
    describeHttpError,
    setUnauthorizedHandler,
    resetUnauthorizedNotice
} from './api/http';
import { getProfile, getDiagnostic } from './api/profile';

const message = ref('点击按钮观察状态码与页面提示');
const expiredNotice = ref(false);
const displayName = ref('');

function showSessionExpired(): void {
    expiredNotice.value = true;
}

onMounted(() => {
    // 应用层注册处理回调，HTTP 层不直接依赖路由组件。
    setUnauthorizedHandler(showSessionExpired);
});

onUnmounted(() => {
    // 页面卸载后解除对当前页面的回调引用。
    setUnauthorizedHandler(null);
});

async function loadProfile(
    expired: boolean,
    businessFail = false
): Promise<void> {
    try {
        const profile = await getProfile(expired, businessFail);
        displayName.value = profile.displayName;
        message.value = '用户资料读取成功';
    } catch (error) {
        message.value = describeHttpError(error);
    }
}

async function testStatus(status: number): Promise<void> {
    try {
        await getDiagnostic(status);
        message.value = `HTTP ${status} 请求成功`;
    } catch (error) {
        message.value = describeHttpError(error);
    }
}

function clearNotice(): void {
    // 仅恢复本地教学提示，不代表已经重新登录。
    expiredNotice.value = false;
    resetUnauthorizedNotice();
}
</script>

<template>
    <h2>HTTP 错误与会话失效</h2>

    <el-space wrap>
        <el-button @click="loadProfile(false)">正常读取</el-button>
        <el-button @click="loadProfile(true)">模拟 401</el-button>
        <el-button @click="loadProfile(false, true)">模拟 HTTP 200 业务失败</el-button>
        <el-button @click="testStatus(403)">模拟 403</el-button>
        <el-button @click="testStatus(500)">模拟 500</el-button>
    </el-space>

    <p>当前姓名：{{ displayName || '尚未读取' }}</p>
    <p>接口结果：{{ message }}</p>

    <el-alert
        v-if="expiredNotice"
        type="warning"
        title="已收到统一的登录失效通知"
        :closable="false"
        show-icon
    />

    <el-button v-if="expiredNotice" @click="clearNotice">
        清除演示通知
    </el-button>
</template>
```

**运行步骤：** 先点击“正常读取”，页面显示“演示用户”。再点击“模拟 401”，Network 应显示 401；页面一方面通过 `catch` 显示“登录会话已过期”，另一方面因为响应拦截器识别了 401，显示统一的警告框。403 和 500 则按各自状态显示不同提示。再点击“模拟 HTTP 200 业务失败”：Network 会显示 200，但 API 模块检查 `body.code` 后主动抛出“模拟业务处理失败”，因此页面也会进入 `catch`。

本例使用了 `<el-space>`：Element Plus 的间距布局组件。`wrap` 是布尔属性，空间不足时允许子元素换行；它只影响按钮排版，不参与 HTTP 请求逻辑。

### 企业项目中的认证信息应该怎么理解

常见认证方案包括：

- **Cookie / Session**：浏览器与服务器按 Cookie 和会话规则协作。Cookie 能否发送取决于站点关系、SameSite、Secure、CORS 等配置；`HttpOnly` Cookie 无法被页面 JavaScript 读取。
- **Token**：服务端按认证方案签发令牌，前端按接口规范携带。是否放在 Header、是否短期有效、如何刷新令牌，都由系统架构决定。

前端不应该自己构造一个“管理员身份”就认为有了权限。Vue Router 守卫只能控制前端导航，真正能否读取或修改账户仍然需要**每一个后端接口独立进行认证和授权**。

对于银行项目，不要因为课程示例简单，就把真实访问令牌、密码、银行卡敏感字段打印到 Console、写进查询参数或随意持久化到 Local Storage。

### 为什么不要把所有请求错误都当成“可以重试”

查询失败后重试一般是合理的；但新增、转账、支付等写入请求出现网络超时或连接中断时，**前端不能仅凭没有收到成功响应就判定服务器没有处理。**

如果后端已经执行了写入，只是响应丢失，直接重复提交可能产生重复操作。应使用业务流水号、幂等键和状态查询等接口能力进行确认。第四天原课程中的“保存成功但刷新失败”也是同一个思路：必须区分**实际业务结果**和**前端是否成功显示结果**。

> [!EXERCISE] 401、403 与业务码失败
>
> 页面收到 HTTP 403 和 HTTP 200（响应体 `code='B001'`）时，哪一个由 Axios 默认直接拒绝？哪一个需要页面或 API 层主动判断？
>
> 【答案】
>
> 在 Axios 默认状态码规则下，403 会使请求 Promise 拒绝；HTTP 200 会按 HTTP 成功响应进入后续代码。后者必须按照接口协议检查 `response.data.code`，当业务码不符合成功约定时主动抛出错误或返回明确的失败结果。二者不能只看页面最终提示就混为一谈。

## 服务端分页与排序：不要把前端切片当成后台分页

### 为什么真实企业列表经常由服务器分页

第五天课程中的账户查询示例一次拿到全部记录，然后用：

```ts
rows.value.slice(start, start + pageSize);
```

在前端截取当前页。这叫**前端分页**：完整数组已在浏览器内存中，分页只是改变哪几项显示。

真实企业查询页面可能有几十万条交易记录，不应该每次把全部记录发给浏览器。通常采用**服务端分页**：页面只提交当前页、页大小、筛选和排序条件，后端返回这一页的记录及总数。

```text
用户选择第 3 页、每页 10 条
          │
          ▼
GET /api/accounts?page=3&pageSize=10&keyword=张
          │
          ▼
服务器按条件筛选、排序、截取
          │
          ▼
{
  "items": [这一页的记录],
  "total": 符合条件的总记录数,
  "page": 3,
  "pageSize": 10
}
          │
          ▼
页面只显示 items，并把 total 交给分页控件
```

其中 `total` 应当是**符合当前筛选条件的总数**，不是这次返回的 `items.length`。如果只用 `items.length` 作为总数，分页控件就可能永远以为只有一页。

### 先约定请求和响应的类型

请求参数示意：

| 参数 | 类型 | 含义 | 示例 |
| --- | --- | --- | --- |
| `keyword` | `string` | 账户姓名查询词 | `张` |
| `page` | `number` | 页码，从 1 开始 | 2 |
| `pageSize` | `number` | 每页条数 | 5 |
| `sort` | `string` | 排序字段 | `balance` |
| `order` | `string` | 排序方向 | `asc` / `desc` |

本地教学服务返回：

```json
{
    "code": "0000",
    "message": "成功",
    "data": {
        "items": [
            { "id": 101, "name": "张客户1", "balance": 350 }
        ],
        "total": 12,
        "page": 1,
        "pageSize": 5
    }
}
```

这里只展示响应字段结构，不代表示例数组只有一条就是完整第一页。实际服务返回的 `items` 数量由查询条件与 `pageSize` 决定。

先声明类型：

```ts
interface Account {
    id: number;
    name: string;
    balance: number;
}

interface PageResult<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
}

interface ApiResult<T> {
    code: string;
    message: string;
    data: T;
}
```

`PageResult<T>` 中的 `T` 是泛型类型参数，表示一条业务记录的类型。`PageResult<Account>` 就代表账户分页结果；`ApiResult<PageResult<Account>>` 则代表带统一业务码的账户分页响应体。

这只是 TypeScript 的静态声明，不能自动验证 HTTP 响应。如果服务器把 `total` 返回成字符串 `'23'`，浏览器中的真实值不会因为类型声明自动变为数字；重要接口仍应根据业务要求做运行时验证。

### Axios 的 `params` 如何与分页关联

```ts
const response = await http.get<ApiResult<PageResult<Account>>>(
    '/accounts',
    {
        params: {
            page: 2,
            pageSize: 5,
            keyword: '张'
        }
    }
);
```

第二个参数是 Axios 请求配置对象，其中 `params` 是 URL 查询参数。它们最终出现在 Request URL 的问号后面，而不是 POST 请求体里。

返回数据时需要这样取：

```ts
const body = response.data;

if (body.code !== '0000') {
    throw new Error(body.message);
}

const pageData = body.data;

rows.value = pageData.items;
total.value = pageData.total;
```

`rows` 是**当前页**数据，不再是全部数据。这个区别会改变分页、查询和排序的实现方式。

### `el-pagination` 的几个重要属性

```vue
<el-pagination
    v-model:current-page="page"
    v-model:page-size="pageSize"
    :total="total"
    :page-sizes="[2, 5, 10]"
    layout="total, sizes, prev, pager, next"
/>
```

逐个解释：

- `v-model:current-page="page"`：双向绑定当前页码。
- `v-model:page-size="pageSize"`：双向绑定每页条数。
- `:total="total"`：符合条件的总记录数，必须来自服务端分页结果。
- `:page-sizes="[2, 5, 10]"`：允许用户选择的每页条数。
- `layout`：指定分页控件展示哪些功能。`total` 显示总数；`sizes` 显示条数选择；`prev`、`pager`、`next` 分别是上一页、页码和下一页。

这里的 `total` 不是总页数。Element Plus 会根据 `total` 和 `pageSize` 计算需要展示的页码。

### `sortable="custom"` 与 `sort-change`

默认情况下，某些表格列排序会直接对前端当前数据进行排序。但服务端分页时，**只排序当前页并不等于排序全部查询结果**。

需要用自定义排序模式：

```vue
<el-table-column
    prop="balance"
    label="账户余额"
    sortable="custom"
/>
```

`sortable="custom"` 告诉 Element Plus：这个列的排序由外部处理。用户点击表头时，表格会发出 `sort-change` 事件，我们需要把它转换为接口参数并重新请求。

```vue
<el-table @sort-change="handleSortChange">
    <!-- 列定义 -->
</el-table>
```

事件中会提供当前排序字段 `prop` 和排序方向 `order`：

- `ascending`：升序；
- `descending`：降序；
- `null`：不排序。

如果后端只接收 `asc` 和 `desc`，前端就需要明确转换，不能把 Element Plus 的 `ascending` 直接当作后端约定。

### 什么时候重新请求，以及为什么要回第一页

这些操作都可能改变查询结果：

| 页面操作 | 要改变的状态 | 是否重置页码 |
| --- | --- | --- |
| 点击查询 | 正式查询关键词 | 是，回第 1 页 |
| 清空条件并重新查询 | 正式查询关键词 | 是 |
| 切换页码 | 当前页 `page` | 否 |
| 改变每页条数 | `pageSize` | 一般回第 1 页或按项目约定 |
| 点击排序表头 | 排序字段、方向 | 是，回第 1 页 |

例如用户原来在第 5 页，新的关键词只匹配 2 条记录。如果还请求第 5 页，服务端会返回空 `items`；用户可能误认为没有查到数据。因此切换查询条件时应回到第一页。

### 完整程序：后端分页、条件查询、余额排序

公共文件沿用本日开头的本地服务器、Vite 代理和 `src/api/http.ts`。本节新增一个类型/API 文件，再替换 `src/App.vue`。

文件一：`src/api/pagedAccounts.ts`。

```ts
import { http } from './http';

export interface Account {
    id: number;
    name: string;
    balance: number;
}

export interface PageResult<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
}

interface ApiResult<T> {
    code: string;
    message: string;
    data: T;
}

export interface AccountQuery {
    keyword: string;
    page: number;
    pageSize: number;
    sortOrder: '' | 'asc' | 'desc';
}

export async function fetchAccountPage(
    query: AccountQuery,
    signal?: AbortSignal
): Promise<PageResult<Account>> {
    const response = await http.get<ApiResult<PageResult<Account>>>(
        '/accounts',
        {
            params: {
                keyword: query.keyword,
                page: query.page,
                pageSize: query.pageSize,
                // 未启用排序时，不传对应参数。
                sort: query.sortOrder ? 'balance' : undefined,
                order: query.sortOrder || undefined
            },
            signal
        }
    );

    const body = response.data;

    if (body.code !== '0000') {
        throw new Error(body.message);
    }

    return body.data;
}
```

`signal?: AbortSignal` 中的 `?` 表示可选参数。如果调用方不传中止信号，函数也可以正常请求；如果传入了信号，就交给 Axios 处理取消。

文件二：`src/App.vue`。

```vue
<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue';
import axios from 'axios';
import { fetchAccountPage } from './api/pagedAccounts';
import type { Account } from './api/pagedAccounts';

const keywordInput = ref('');
const appliedKeyword = ref('');

const page = ref(1);
const pageSize = ref(5);
const total = ref(0);
const rows = ref<Account[]>([]);

const sortOrder = ref<'' | 'asc' | 'desc'>('');

const loading = ref(false);
const message = ref('');

// 避免页码快速切换时，旧响应覆盖新结果。
let controller: AbortController | null = null;
let latestId = 0;

async function load(): Promise<void> {
    const mine = ++latestId;

    controller?.abort();
    const current = new AbortController();
    controller = current;

    loading.value = true;
    message.value = '';

    try {
        const result = await fetchAccountPage(
            {
                keyword: appliedKeyword.value,
                page: page.value,
                pageSize: pageSize.value,
                sortOrder: sortOrder.value
            },
            current.signal
        );

        if (mine !== latestId) return;

        // items 才是当前页记录，total 是符合条件的总数。
        rows.value = result.items;
        total.value = result.total;
    } catch (error) {
        if (mine !== latestId || axios.isCancel(error)) return;

        message.value = error instanceof Error
            ? error.message
            : '账户查询失败';
        rows.value = [];
        total.value = 0;
    } finally {
        if (mine === latestId) {
            loading.value = false;
            controller = null;
        }
    }
}

function search(): void {
    const value = keywordInput.value.trim();

    // 条件和页码都没变时，允许手动刷新同一页。
    if (appliedKeyword.value === value && page.value === 1) {
        void load();
        return;
    }

    appliedKeyword.value = value;
    page.value = 1;
}

function resetQuery(): void {
    keywordInput.value = '';
    search();
}

interface SortEvent {
    prop: string;
    order: 'ascending' | 'descending' | null;
}

function handleSortChange(event: SortEvent): void {
    // 只对余额列执行服务端排序。
    const nextOrder = event.prop === 'balance'
        ? event.order === 'ascending'
            ? 'asc'
            : event.order === 'descending'
                ? 'desc'
                : ''
        : '';

    if (sortOrder.value === nextOrder && page.value === 1) {
        void load();
        return;
    }

    sortOrder.value = nextOrder;
    page.value = 1;
}

// 侦听已提交条件和分页状态：初次运行也自动查询。
watch(
    [appliedKeyword, page, pageSize, sortOrder],
    () => {
        void load();
    },
    { immediate: true }
);

onUnmounted(() => {
    latestId += 1;
    controller?.abort();
    controller = null;
});
</script>

<template>
    <h2>账户列表：服务端分页</h2>

    <el-space wrap>
        <el-input
            v-model="keywordInput"
            placeholder="输入张或李"
            style="width: 240px"
            @keyup.enter="search"
        />
        <el-button type="primary" @click="search">查询</el-button>
        <el-button @click="resetQuery">重置</el-button>
    </el-space>

    <p v-if="message" style="color: #c0392b">{{ message }}</p>

    <el-table
        :data="rows"
        v-loading="loading"
        row-key="id"
        border
        @sort-change="handleSortChange"
    >
        <el-table-column prop="id" label="编号" width="100" />
        <el-table-column prop="name" label="账户名称" />
        <el-table-column
            prop="balance"
            label="余额"
            sortable="custom"
        />
    </el-table>

    <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[2, 5, 10]"
        layout="total, sizes, prev, pager, next"
        style="margin-top: 16px"
    />
</template>
```

### 这里的 `watch()` 比简单点击事件多做了什么

```ts
watch(
    [appliedKeyword, page, pageSize, sortOrder],
    () => void load(),
    { immediate: true }
);
```

- 第一参数是一个数组，列出要侦听的响应式来源。
- 第二参数是状态发生变化后的回调，这里发起一次查询。
- `immediate: true` 让侦听器注册后立即执行一次，完成页面初次加载。

当页码、页大小、正式关键词或排序方向变化时，侦听器发起新请求。Vue 会按其更新调度规则处理同一轮的同步状态变化，因此在 `search()` 中同时改变 `appliedKeyword` 和 `page`，一般不会按变量个数机械地各请求一次。

不要同时再写 `@current-change="load"` 和这个侦听器，否则可能产生不必要的重复查询。本例统一由 `watch()` 处理状态变化。

### 实际操作与验收

| 操作 | 预期 Request URL 参数 | 页面预期 |
| --- | --- | --- |
| 初次打开 | `page=1&pageSize=5` | 5 条，总数 23 |
| 点击第 2 页 | `page=2&pageSize=5` | 下一页数据，不是本地切片 |
| 每页改为 2 条 | `pageSize=2` | 每页 2 条，页码按控件联动变化 |
| 输入“张”并查询 | `keyword=张&page=1` | 按姓名筛选，`total` 变小 |
| 点击余额升序 | `sort=balance&order=asc` | 全部匹配数据按余额升序返回 |
| 点击余额降序 | `sort=balance&order=desc` | 全部匹配数据按余额降序返回 |

打开 Network 检查每次请求的 Query String Parameters 和 Response。**特别确认是服务器返回的 `items` 发生了变化，而不是前端只把当前 5 条记录重新排列。**

### 服务端分页容易出错的地方

**错误一：** `:total="rows.length"`。这只是当前页的数量，不是总数。应使用接口返回的 `total`。

**错误二：** 服务端已经返回当前页，却又在前端执行 `rows.slice(start, end)`。这样第二页很可能被再次截断成空数组。

**错误三：** 查询条件改变后不重置 `page`。用户仍处在旧的高页码，新的条件可能没有那么多页，结果变成空列表。

**错误四：** `sortable` 使用前端本地排序，却误以为后端按全部数据排序。服务端分页时应明确约定排序参数。

**错误五：** 忽略响应乱序。用户快速切换页码时，先发出的旧页可能更晚返回。本例已经复用请求取消和请求编号方案。

> [!EXERCISE] 为什么第二页什么都没有
>
> 后端响应 `items` 中明明有 5 条第二页记录，页面又执行 `items.slice((page-1)*5, page*5)`，结果变为空。应该保留这个 `slice()` 吗？
>
> 【答案】
>
> 不应该。服务端已经根据 `page=2&pageSize=5` 返回了当前页的 5 条记录，再从这 5 条里面按第二页的下标从 5 开始切片，自然会得到空数组。服务端分页的页面直接把 `items` 交给表格，`total` 交给分页控件。

## 文件上传：`File`、`FormData` 与上传进度

### 为什么普通 JSON 不能直接替代文件上传

账户业务中常见“上传证明材料”“上传电子回单附件”等需求。普通表单提交的是姓名、日期、账户 ID 等字段，而上传还包含文件的二进制内容。

浏览器通过 `File` 对象表示用户选择的文件，通过 `FormData` 组织包含文本字段和文件的 multipart 表单数据。Axios 可以直接把 `FormData` 作为 POST 请求体发送。

典型流程：

```text
用户选择本地文件
       ↓
<input type="file"> 取得 File
       ↓
new FormData()
       ↓
form.append('file', file)
       ↓
Axios POST /api/upload
       ↓
服务器接收 multipart/form-data
       ↓
返回上传结果
       ↓
页面显示成功或失败
```

本日使用原生 `<input type="file">`，是为了先理解文件对象与 HTTP 请求。之后如果企业项目采用 Element Plus 的 `<el-upload>`，其底层仍然离不开文件对象、请求参数和上传结果，只是组件帮你封装了文件列表、触发按钮、校验钩子等界面逻辑。

### `File` 代表什么

用户选择一个文件后，浏览器会给页面一个 `File` 对象，常见属性包括：

| 属性 | 含义 |
| --- | --- |
| `file.name` | 文件名称 |
| `file.size` | 文件大小，单位为字节 |
| `file.type` | 浏览器识别的 MIME 类型，可能为空或不完全可信 |
| `file.lastModified` | 文件最后修改时间的时间戳 |

**文件名称和 MIME 类型不能当作安全证明。** 浏览器的 `accept` 只帮助文件选择器筛选，不是可靠的安全校验。真实服务端仍需要独立检查文件类型、内容、大小、权限和恶意内容。

### 从文件输入框中安全地取得 File

```ts
function onFileChange(event: Event): void {
    const target = event.target;

    if (!(target instanceof HTMLInputElement)) {
        return;
    }

    const file = target.files?.[0] ?? null;
    selectedFile.value = file;
}
```

这里有几个第一次需要理解的写法：

- `Event` 是浏览器事件对象类型。
- `event.target` 是触发事件的目标，类型较宽，不能直接假定一定有 `files` 属性。
- `instanceof HTMLInputElement` 在运行时检查目标是不是输入元素，TypeScript 因此允许读取 `target.files`。
- `target.files?.[0]` 通过可选链取得选择的第一个文件；如果没有文件，则得到 `undefined`。
- `?? null` 把 `undefined` 转为明确的“未选择文件”状态 `null`。

### `FormData` 怎样组织请求体

```ts
const form = new FormData();
form.append('file', selectedFile.value, selectedFile.value.name);
form.append('purpose', 'account-proof');
```

`new FormData()` 创建一个用于发送表单数据的对象。`append(name, value, filename?)` 中：

- 第一个参数是服务端规定的字段名，例如 `'file'`；
- 第二个参数是字段值，文件可以传 `File`；
- 第三个参数是可选的文件名，传入文件时可明确指定名称。

第二次 `append` 添加普通文本字段 `purpose`。真实业务接口要求的字段名、文件数量和附加参数必须按接口文档来，不能随意改。

### 为什么不手动写固定的 multipart Content-Type

发送 `FormData` 时，通常**不要自己手写**：

```ts
// 不建议对 FormData 请求手动使用这样不完整的请求头。
const wrongHeaders = {
    'Content-Type': 'multipart/form-data'
};
```

multipart 请求的 `Content-Type` 还需要配套的 `boundary`（分隔请求各个字段的边界标识）。浏览器或 Axios 的浏览器适配流程会在适当情况下生成带有 boundary 的请求头。随意手写不完整的 Content-Type 可能使服务端无法正确解析。

因此主线代码直接传入 `FormData`，让请求库和浏览器处理合适的报文格式。

### `onUploadProgress` 的含义

Axios 的请求配置可以传入：

```ts
onUploadProgress: event => {
    console.log(event.loaded, event.total);
}
```

这里 `event` 是上传进度事件：

- `loaded`：当前已完成的传输字节数；
- `total`：总传输字节数，在无法确定总长度的场景中可能缺失；
- 根据 `loaded / total` 可以计算一个进度百分比。

当 `total` 不存在或为 0 时，不能直接除法计算比例。并且**进度达到 100% 不等于服务器已经成功保存文件**；只有接口成功响应并通过业务检查后，才能向用户报告上传完成。

### 完整程序：上传文件并显示进度

仍然沿用本日公共 HTTP 服务器。这个服务器不会存储真实文件，只会返回本次 multipart 请求体的字节数；因此文件上传实验不会留下业务附件。

文件一：`src/api/fileTransfer.ts`。

```ts
import { http } from './http';

interface ApiResult<T> {
    code: string;
    message: string;
    data: T;
}

export interface UploadResult {
    receivedBytes: number;
}

export async function uploadProof(
    file: File,
    onProgress: (percent: number) => void
): Promise<UploadResult> {
    const form = new FormData();

    // 接口协议规定文件字段名为 file。
    form.append('file', file, file.name);
    form.append('purpose', 'account-proof');

    const response = await http.post<ApiResult<UploadResult>>(
        '/upload',
        form,
        {
            onUploadProgress(event) {
                // total 不存在时，不随意显示错误百分比。
                if (!event.total || event.total <= 0) return;

                const percent = Math.min(
                    100,
                    Math.round(event.loaded / event.total * 100)
                );

                onProgress(percent);
            }
        }
    );

    if (response.data.code !== '0000') {
        throw new Error(response.data.message);
    }

    return response.data.data;
}
```

参数含义：

- `file`：用户选择的 `File` 对象；
- `onProgress`：页面传进来的回调函数，API 模块有进度时通过它报告百分比；
- 返回值 `Promise<UploadResult>`：上传 HTTP 请求成功并通过业务码检查后得到的结果。

文件二：`src/App.vue`。

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { uploadProof } from './api/fileTransfer';

const selectedFile = ref<File | null>(null);
const uploading = ref(false);
const progress = ref(0);
const message = ref('请选择不超过 1 MB 的 .txt 或 .csv 文件');

function onFileChange(event: Event): void {
    const target = event.target;

    // 事件目标不一定能被 TypeScript 识别为文件输入元素。
    if (!(target instanceof HTMLInputElement)) return;

    selectedFile.value = target.files?.[0] ?? null;
    progress.value = 0;
}

async function submit(): Promise<void> {
    if (uploading.value || !selectedFile.value) return;

    const file = selectedFile.value;

    // 前端校验只是用户体验，真实服务端仍要再次验证。
    if (file.size > 1024 * 1024) {
        message.value = '文件不能超过 1 MB';
        return;
    }

    const validSuffix = /\.(txt|csv)$/i.test(file.name);
    if (!validSuffix) {
        message.value = '本练习只允许选择 .txt 或 .csv 文件';
        return;
    }

    uploading.value = true;
    progress.value = 0;
    message.value = '正在上传……';

    try {
        const result = await uploadProof(file, value => {
            progress.value = value;
        });

        // 只有成功响应后才显示真正的上传完成。
        message.value = `服务端已收到请求体 ${result.receivedBytes} 字节（未存储文件）`;
    } catch (error) {
        message.value = error instanceof Error ? error.message : '上传失败';
    } finally {
        uploading.value = false;
    }
}
</script>

<template>
    <h2>业务附件上传实验</h2>

    <input
        type="file"
        accept=".txt,.csv"
        :disabled="uploading"
        @change="onFileChange"
    />

    <p>当前文件：{{ selectedFile?.name || '未选择' }}</p>

    <el-button
        type="primary"
        :loading="uploading"
        :disabled="!selectedFile || uploading"
        @click="submit"
    >
        上传
    </el-button>

    <el-progress :percentage="progress" style="max-width: 360px" />
    <p>{{ message }}</p>
</template>
```

这里首次出现了 `<el-progress>`，它是 Element Plus 的**进度条组件**。`:percentage="progress"` 绑定数字 0～100，用于显示进度。进度条本身不会发请求，也不会判断接口是否成功；它只展示脚本维护的数值。

**运行步骤：**

1. 在电脑上新建一个较小的 `proof.txt` 文件，写入几行测试内容。
2. 页面选择文件，点击上传。
3. 打开 Network，找到 `POST /api/upload`。
4. 在 Headers 中确认 `Content-Type` 包含 `multipart/form-data` 及 boundary。
5. 在 Payload 中查看 `file`、`purpose` 等字段。
6. 在 Response 中查看 `receivedBytes`。

**为什么 `receivedBytes` 往往大于 `file.size`？** 因为服务端教学接口计算的是整个 multipart 请求体，里面除了文件，还包含文本字段、boundary 和报文头等信息。它不是文件最终写入磁盘的大小。

### 上传失败怎么排查

- Network 中没有请求：检查选择文件事件、按钮禁用状态和 `submit()` 是否执行。
- HTTP 400：检查请求体是否真的是 multipart 格式，字段是否符合服务端约定。
- 进度条到了 100% 但仍然失败：说明网络传输进度和服务端业务结果是两回事。
- 文件类型被拒绝：检查前端选择限制，但最终仍以服务端安全校验为准。
- 大文件中途失败：检查前端大小限制、服务端大小限制、代理、超时及实际上传方式。

> [!EXERCISE] `FormData` 与普通 JSON 的区别
>
> 需要上传一个 `File` 和一条业务说明，为什么不直接写成 `JSON.stringify({ file, purpose })`？
>
> 【答案】
>
> `File` 是浏览器中的文件对象，普通 JSON 序列化不能把它的二进制内容按文件上传协议自然转换成服务器需要的文件字段。`FormData` 可以同时携带文件和文本字段，通过 multipart/form-data 发送；字段名和文件处理方式仍需符合服务端接口约定。

## 文件下载：`Blob`、`responseType` 与对象 URL

### 为什么接口返回文件时不能直接当 JSON 处理

账户查询接口返回 JSON 数组，但“导出交易记录”“下载电子回单”往往返回 CSV、PDF、Excel 等文件字节。

如果 Axios 仍把它当普通业务 JSON 使用，例如读取 `response.data.code`，就会处理错误。下载文件时需要按后端约定指定响应类型。

```ts
const response = await http.get<Blob>('/report', {
    responseType: 'blob'
});
```

- `responseType: 'blob'`：告诉 Axios 在浏览器中将响应体作为 `Blob`（二进制大对象）提供。
- `Blob`：浏览器用来表示一段二进制数据的对象，可用于文件下载、预览等。
- `response.data`：此时应是 `Blob`，不再是之前的 `{ code, message, data }` JSON 对象。

所以本节的导出接口**不使用**前面通用 JSON 业务响应体格式，而是直接发送文件。真实接口如果对错误情况返回 JSON、成功时返回文件，还要额外处理两种响应类型。

### `URL.createObjectURL()` 做了什么

获得 Blob 后，可以调用：

```ts
const objectUrl = URL.createObjectURL(blob);
```

它创建一个供当前浏览器使用的临时对象 URL，形状类似 `blob:...`。这不是后端真实文件地址，也不是永久链接；浏览器只通过它访问当前内存中的 Blob。

随后创建一个下载链接：

```ts
const link = document.createElement('a');
link.href = objectUrl;
link.download = 'accounts.csv';
link.click();
```

- `document.createElement('a')`：创建一个 `<a>` 元素。
- `link.href`：指定链接目标，这里是 Blob 的临时 URL。
- `link.download`：建议的下载文件名。
- `link.click()`：在脚本中触发这个链接的点击行为。

用完对象 URL 后，需要调用：

```ts
URL.revokeObjectURL(objectUrl);
```

它会释放这个对象 URL。不要在浏览器还需要访问它时过早释放；如果是一次性下载，可以在触发下载后按合理时机释放。

### 完整程序：从服务端下载 CSV 账户清单

只需沿用公共 HTTP 服务，并替换 `src/App.vue`。本地服务的 `/api/report` 返回真正的 CSV 字节，浏览器 Network 中的 Response 不是账户 JSON。

文件一：`src/api/report.ts`。

```ts
import { http } from './http';

// 这个接口返回的是 CSV 文件数据，不是 ApiResult<T>。
export async function getAccountReport(): Promise<Blob> {
    const response = await http.get<Blob>('/report', {
        responseType: 'blob'
    });

    return response.data;
}
```

文件二：`src/App.vue`。

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { getAccountReport } from './api/report';

const downloading = ref(false);
const message = ref('尚未导出');

async function download(): Promise<void> {
    if (downloading.value) return;

    downloading.value = true;
    message.value = '正在下载数据……';

    try {
        const blob = await getAccountReport();

        // 为服务器返回的 CSV Blob 创建临时浏览器 URL。
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = objectUrl;
        link.download = '账户清单.csv';

        // 挂到页面中再触发，兼容需要连接到文档的场景。
        document.body.appendChild(link);
        link.click();
        link.remove();

        // 给浏览器一点时间处理下载，再释放临时 URL。
        setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);

        message.value = '已触发账户清单下载';
    } catch (error) {
        message.value = error instanceof Error ? error.message : '下载失败';
    } finally {
        downloading.value = false;
    }
}
</script>

<template>
    <h2>账户清单导出</h2>

    <el-button
        type="primary"
        :loading="downloading"
        @click="download"
    >
        导出 CSV
    </el-button>

    <p>{{ message }}</p>
</template>
```

点击按钮后，在 Network 中找到 `GET /api/report`。应能看到 `Content-Type: text/csv; charset=utf-8` 和 `Content-Disposition: attachment; filename="accounts.csv"`，浏览器出现下载文件。

这里的“已触发下载”不等于浏览器一定已将文件成功保存到用户磁盘。浏览器下载路径、权限和取消操作不受这个按钮函数完全控制，页面不能擅自声称文件已保存成功。

### 文件下载与错误响应的特殊问题

当 `responseType: 'blob'` 时，如果服务器因认证失效返回 HTTP 401 及 JSON 错误体，有些浏览器/Axios 组合中的错误响应体也可能被包装为 Blob。

所以不要在下载接口的 `catch` 中毫无判断地写：

```ts
error.response.data.message
```

因为这里的 `data` 可能不是普通 JSON 对象。应先判断 HTTP 状态；如确需读取 Blob 错误体，要在符合服务端约定和大小限制的前提下将其解析成文本或 JSON。对于统一的 401/403，通常优先由公共错误处理层按状态码识别。

另外，生产系统中的下载文件名可能来自服务端 `Content-Disposition` 响应头。读取该字段时必须正确处理编码，并对文件名做安全处理；不要不加检查就把服务端或用户输入直接拼成任意路径。

> [!EXERCISE] 下载接口返回的 `.data` 是什么
>
> 账户导出接口返回 CSV 文件；代码使用 `responseType: 'blob'`。此时 `response.data` 能直接写成 `response.data.data.items` 吗？
>
> 【答案】
>
> 不能。成功下载响应体是 Blob，而不是此前的 JSON 业务包裹对象。应将 `response.data` 作为 Blob，通过 `URL.createObjectURL()` 等方式交给浏览器处理。如果后端错误时返回 JSON，需要在失败分支根据状态和实际响应类型另行处理。

## 拓展：`Promise.all()` 同时查询两个独立接口

### 什么时候适合并行请求

账户首页可能同时需要：

- 当前账户的部分列表；
- 当日转账限额信息。

如果两份数据互不依赖，不一定非得等账户列表返回后才请求限额。可以同时发起请求，等两者都成功后再组合结果。

```ts
const [accountResponse, limitResponse] = await Promise.all([
    http.get('/accounts', { params: { page: 1, pageSize: 2 } }),
    http.get('/limits')
]);
```

`Promise.all(iterable)` 接收一组 Promise（或者普通值），返回一个新的 Promise：

- 全部成功时，按**输入顺序**返回结果数组，不按网络返回先后排序；
- 只要有一个 Promise 拒绝，整体 Promise 就会拒绝；
- 其他已发出的请求不会因为 `Promise.all()` 拒绝而被自动取消。

数组解构中的 `accountResponse` 和 `limitResponse` 对应的是两个输入位置，与哪一个先返回没有关系。

如果“账户列表失败，但限额卡片仍应显示”，就不适合不加处理地用 `Promise.all()` 包围整个页面的所有数据；需要为不同区域分别处理错误，或者使用 `Promise.allSettled()` 获取各自成功或失败的结果。

### 完整程序：账户摘要与限额一起加载

沿用本日公共 HTTP 服务。只需替换 `src/App.vue`。

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { http } from './api/http';

interface Account {
    id: number;
    name: string;
    balance: number;
}

interface PageResult<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
}

interface LimitInfo {
    dailyLimit: number;
    currency: string;
}

interface ApiResult<T> {
    code: string;
    message: string;
    data: T;
}

const accounts = ref<Account[]>([]);
const dailyLimit = ref<number | null>(null);
const currency = ref('');
const message = ref('尚未加载');
const loading = ref(false);

async function loadDashboard(): Promise<void> {
    if (loading.value) return;

    loading.value = true;
    message.value = '正在并行查询账户和限额……';

    try {
        // 两个请求同时开始，无须串行等待。
        const [accountResponse, limitResponse] = await Promise.all([
            http.get<ApiResult<PageResult<Account>>>('/accounts', {
                params: { page: 1, pageSize: 2 }
            }),
            http.get<ApiResult<LimitInfo>>('/limits')
        ]);

        if (accountResponse.data.code !== '0000' ||
            limitResponse.data.code !== '0000') {
            throw new Error('业务响应码表示失败');
        }

        accounts.value = accountResponse.data.data.items;
        dailyLimit.value = limitResponse.data.data.dailyLimit;
        currency.value = limitResponse.data.data.currency;
        message.value = '账户与限额都查询成功';
    } catch (error) {
        message.value = error instanceof Error ? error.message : '加载失败';
    } finally {
        loading.value = false;
    }
}
</script>

<template>
    <h2>账户与限额并行查询</h2>
    <el-button :loading="loading" @click="loadDashboard">
        加载首页数据
    </el-button>
    <p>{{ message }}</p>
    <p>日限额：{{ dailyLimit ?? '尚未取得' }} {{ currency }}</p>
    <p v-for="item in accounts" :key="item.id">
        {{ item.name }}：{{ item.balance }} 元
    </p>
</template>
```

打开 Network，点击加载。通常可以看到 `/api/accounts` 和 `/api/limits` 两条请求在相近时间发出。即使限额接口先完成，`Promise.all()` 解构后的结果顺序仍和输入顺序一致。

这里 `dailyLimit` 初始为 `null`，模板中使用 `dailyLimit ?? '尚未取得'`。空值合并运算符 `??` 只有在左侧为 `null` 或 `undefined` 时才使用默认值，**数字 0 是有效值**，不会被错误替换成“尚未取得”。

> [!EXERCISE] 两条并行请求有一条失败
>
> `Promise.all([A(), B()])` 中 A 成功、B 失败，`await` 会得到 A 的结果数组吗？A 会因为 B 失败而自动被取消吗？
>
> 【答案】
>
> 不会。`Promise.all()` 只要有一个 Promise 拒绝，整体就拒绝，当前 `await` 会抛出失败原因；它也不会自动取消另一个已经发出的请求。对于允许部分区域独立显示成功结果的页面，应分别处理每个请求，或者使用 `Promise.allSettled()` 等方式设计对应的成功与失败展示。

## 拓展：输入防抖与接口请求控制

### 为什么自动搜索可能导致请求过多

如果输入框每变化一个字符就立即调用查询，用户输入“张小明”可能连续触发“张”“张小”“张小明”等多次请求。这不一定是业务真正需要的。

**防抖（Debounce）**的意思是：在事件连续发生时，暂时不执行操作，只有连续一段时间没有新事件，才执行最后一次。常用于搜索建议、联想查询。

节流（Throttle）则不同：在连续事件中限制操作的执行频率，常用于滚动、窗口尺寸变化等频繁事件。两者都不是 Vue 专有能力。

最简单的防抖使用 `setTimeout()` 和 `clearTimeout()`：

```ts
let timer: ReturnType<typeof setTimeout> | undefined;

function schedule(): void {
    if (timer !== undefined) {
        clearTimeout(timer);
    }

    timer = setTimeout(() => {
        // 停止输入一段时间后执行。
    }, 350);
}
```

`setTimeout(callback, 350)` 安排一个延迟回调；返回一个定时器标识。`clearTimeout(timer)` 取消之前仍未执行的回调。

**防抖只减少新请求的发起频率，不自动取消已经发出的旧请求。** 所以在真实自动搜索中，仍然应该结合请求取消或最新请求编号。

### 完整程序：停止输入后自动查询

使用本日公共服务，只需替换 `src/App.vue`。这个程序同时使用防抖、取消请求和响应编号，方便一次观察三种机制的不同职责。

```vue
<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue';
import axios from 'axios';
import { http } from './api/http';

interface Account {
    id: number;
    name: string;
    balance: number;
}

interface PageData<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
}

interface ApiResult<T> {
    code: string;
    message: string;
    data: T;
}

const keyword = ref('');
const rows = ref<Account[]>([]);
const message = ref('输入姓名，停顿 350 毫秒后自动查询');
const loading = ref(false);

let timer: ReturnType<typeof setTimeout> | undefined;
let controller: AbortController | null = null;
let latestId = 0;

async function load(term: string, mine: number): Promise<void> {
    const current = new AbortController();
    controller = current;
    loading.value = true;

    try {
        const response = await http.get<ApiResult<PageData<Account>>>(
            '/accounts',
            {
                params: { keyword: term, page: 1, pageSize: 10 },
                signal: current.signal
            }
        );

        if (mine !== latestId) return;

        if (response.data.code !== '0000') {
            throw new Error(response.data.message);
        }

        rows.value = response.data.data.items;
        message.value = `已查询“${term}”`;
    } catch (error) {
        if (mine !== latestId || axios.isCancel(error)) return;
        message.value = error instanceof Error ? error.message : '查询失败';
    } finally {
        if (mine === latestId) {
            loading.value = false;
            controller = null;
        }
    }
}

watch(keyword, value => {
    // 新输入立即让旧请求失去更新页面的资格。
    const mine = ++latestId;

    if (timer !== undefined) clearTimeout(timer);
    controller?.abort();
    controller = null;
    loading.value = false;

    // 输入结束一小段时间后再真正发出 HTTP 请求。
    timer = setTimeout(() => {
        void load(value.trim(), mine);
    }, 350);
});

onUnmounted(() => {
    latestId += 1;
    if (timer !== undefined) clearTimeout(timer);
    controller?.abort();
});
</script>

<template>
    <h2>账户自动搜索</h2>
    <el-input v-model="keyword" placeholder="连续输入张、李等关键词" />
    <p>{{ loading ? '网络请求中……' : message }}</p>

    <el-table :data="rows" row-key="id">
        <el-table-column prop="name" label="账户名称" />
        <el-table-column prop="balance" label="余额" />
    </el-table>
</template>
```

运行时连续输入几个字，观察 Network：输入过程频繁变化，但不会每个字符都立即对应一个新 HTTP 请求。停止输入约 350 毫秒后，才会发送最后一次查询。如果旧请求已经发出，它会被取消，旧结果也无法覆盖当前表格。

这里 350 毫秒只是教学参数，不是所有业务页面都应该使用的固定值。对于账户查询按钮、重要提交操作、交易确认等场景，是否需要防抖应该由业务交互要求决定。

## 企业项目中完整的请求调用链

回到真实代码阅读，建议从页面点击或页面初始化开始，沿着以下顺序追踪：

```text
页面事件：@click / @change / watch / onMounted
        ↓
页面函数：load / search / submit
        ↓
业务 API：fetchAccountPage / uploadProof / getAccountReport
        ↓
Axios 实例：baseURL、timeout、headers
        ↓
请求拦截器（如果项目配置）
        ↓
Vite 代理（开发环境）或生产网关
        ↓
后端接口
        ↓
HTTP Status + Response Headers + Response Body
        ↓
响应拦截器（如果项目配置）
        ↓
业务码检查 / 文件内容处理 / 类型转换
        ↓
页面状态：rows、total、loading、error
        ↓
Vue 更新组件界面
```

同一个操作出问题时，定位顺序也沿着这条链路进行。特别注意以下问题并不属于同一个层次：

| 问题 | 重点查看的代码或工具 |
| --- | --- |
| 按钮点了没反应 | 组件事件绑定、处理函数、`busy` / `disabled` |
| 没有网络请求 | 页面函数有没有调用 API；是否被防抖、取消或 guard 阻止 |
| 请求 URL 错误 | Axios `baseURL`、API 路径、Vite 代理 |
| 参数和页面输入不同 | 页面状态、API 参数转换、Network Query / Payload |
| 请求被取消 | `signal`、`abort()`、Network 状态、是否过期请求 |
| 服务器返回 401 | HTTP 认证、会话、公共错误处理和路由状态 |
| HTTP 200 但业务报错 | `response.data.code` 与接口约定 |
| 服务端分页只有一页 | `total` 是否取自服务端，而非 `items.length` |
| 页面出现旧查询数据 | 请求编号、取消、是否过期响应覆盖新状态 |
| 上传进度 100% 但失败 | 请求是否获得成功响应、业务码、服务端校验 |
| 下载的是乱码或 JSON | `responseType`、Content-Type、实际响应体、字符编码 |

### 为什么浏览器 Network 是必要的

本日公共教学服务器通过 Vite 代理提供 HTTP 接口，故意让你能够在 Network 中看到参数、响应和错误。企业开发时，如果只在页面中 `console.log(rows.value)`，就可能无法区分：

- 后端本来就没返回正确数据；
- 请求/响应拦截器改变了结构；
- API 函数取错了 `.data` 层级；
- 页面又对已经分页的数据做了第二次切片；
- 旧请求结果覆盖新请求结果。

**先找出数据在哪一层开始不符合预期，再修改那一层。** 不要用改 TypeScript 类型断言的办法掩盖运行时数据问题。

## 当日综合练习

> [!EXERCISE] 只取消旧请求就一定安全了吗
>
> 使用 `controller.abort()` 取消旧查询，但旧请求的 `finally` 仍可能在新请求开始后执行。应该怎样避免界面显示错误？
>
> 【答案】
>
> 使用递增请求编号或比较当前控制器引用，只有最新请求才允许修改公共 `loading` 和控制器状态。旧请求无论成功、失败还是取消，都不能覆盖新请求的状态。`abort()` 主要负责取消网络等待，请求编号负责限制结果写入权限，二者职责不同。

> [!EXERCISE] 401 是否代表可以直接更换前端角色
>
> 接口返回 401，前端修改 Pinia 中的角色为 admin，然后重新进入页面，是否意味着已经通过后端认证？
>
> 【答案】
>
> 不意味着。Pinia 和 Vue Router 中的角色数据属于前端状态，最多控制页面显示和导航。后端接口必须基于可信的登录会话、令牌和服务端权限策略独立校验。401 应当按项目协议进入重新认证流程，而不是通过修改前端角色绕过验证。

> [!EXERCISE] 查询总数和当前页数量
>
> 后端响应 `data.items` 有 5 条，`data.total` 为 38。`el-pagination` 的 `:total` 应绑定 5 还是 38？
>
> 【答案】
>
> 应绑定 38，因为它表示符合当前查询条件的记录总数。5 只是本次当前页返回的记录数。把 5 误当 `total`，分页控件就无法展示后续页。

> [!EXERCISE] `ascending` 与 `asc`
>
> Element Plus 的 `sort-change` 事件返回 `order='ascending'`，而后端要求 `order=asc`。能直接把组件事件中的原值传给后端吗？
>
> 【答案】
>
> 不能假定可以。应按照接口协议显式映射：`ascending → asc`、`descending → desc`，取消排序时传空值或不传排序参数。后端能识别什么字段和值必须以接口文档为准。

> [!EXERCISE] 文件上传进度与上传成功
>
> 进度条显示 100%，但服务器返回 HTTP 400，应该显示“上传成功”吗？
>
> 【答案】
>
> 不应该。进度事件只说明客户端传输进度，服务器仍可能拒绝文件类型、大小、内容或权限。只有真正收到成功响应并通过业务码检查后，才可以按接口语义展示上传成功。

> [!EXERCISE] Blob 下载和 JSON 接口
>
> 文件下载接口设了 `responseType: 'blob'`，页面还通过 `response.data.data.items` 读取账户数组，这有什么问题？
>
> 【答案】
>
> 下载成功时 `response.data` 是 Blob，而不是 JSON 业务对象。应根据文件接口协议把 Blob 交给浏览器下载，不能沿用普通 JSON 接口的字段访问方式。若错误响应为 JSON，还需要在错误分支按实际类型和 HTTP 状态处理。

> [!EXERCISE] 写入请求超时是否等于写入失败
>
> 用户提交转账后，前端等待响应超时。能否立即显示“转账未成功，请重新提交”？
>
> 【答案】
>
> 不能。超时只表示前端在规定时间内没有取得可确认的响应，服务端可能尚未处理、正在处理，也可能已经完成处理。应按照业务协议查询交易状态、使用业务流水号或幂等机制确认结果，避免重复转账。前端取消请求或超时不等于服务端自动回滚。

## 学完后需要达到的标准

把下面几件事当作本日的实际验收，而不是要求背诵全部 API 名称：

- 能独立启动本地接口服务，并在 Network 中找到对应的 HTTP 请求。
- 能解释为什么旧请求最后返回会覆盖新结果，并正确使用 `AbortController`、`signal` 和请求编号。
- 能识别 AxiosError，区分 HTTP 401、403、500、网络失败、取消，以及 HTTP 200 加业务失败码。
- 能说明登录失效通知和前端路由跳转的职责边界，知道前端角色状态不等于后端权限。
- 能把账户查询改成服务端分页，正确区分 `items.length` 与 `total`。
- 能把 Element Plus 的排序事件转换成后端排序参数，而不是只对当前页排序。
- 能选择本地文件、通过 `FormData` 上传，并解释进度 100% 不等于业务成功。
- 能以 Blob 方式下载 CSV，知道临时对象 URL 需要适时释放。
- 能根据业务需求判断请求适合并行、串行、防抖还是取消。

### 后续课程衔接

补充第五天将进入**TypeScript 常用工具类型、Vue DevTools、工程规范、样式与测试**等内容。本日重点是“HTTP 请求生命周期和业务接口协作”，不会为了扩展知识面提前增加一整套复杂工程框架。

### 参考资料

- [Axios 官方文档：取消请求](https://axios-http.com/docs/cancellation)
- [Axios 官方文档：拦截器](https://axios-http.com/docs/interceptors)
- [Axios 官方文档：错误处理](https://axios-http.com/docs/handling_errors)
- [Axios 官方文档：请求配置](https://axios-http.com/docs/req_config)
- [Axios 官方文档：文件上传](https://axios.rest/pages/advanced/file-posting)
- [Element Plus 官方文档：分页](https://element-plus.org/en-US/component/pagination.html)
- [Element Plus 官方文档：表格](https://element-plus.org/en-US/component/table.html)
- [MDN：AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
- [MDN：FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData)
- [MDN：Blob URL](https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Schemes/blob)
