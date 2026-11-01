---
id: vue-course-day-4
title: "Vue 企业开发 · 第四天：工程、接口与排错"
folder: miscellaneous
order: 1104
date: 2026-11-01
updated: 2026-11-01
tags: [Vue, Axios, Vite, Pinia]
description: "建立页面到请求、响应与状态更新的完整追踪路径。"
pinned: false
draft: false
---

## 学习安排

工程与模块 20 分钟，异步流程 20 分钟，Axios 独立示例 35 分钟，Network 调试 20 分钟，Pinia 15 分钟，验收 10 分钟。代理、环境切换和拦截器作为查阅内容，不要求今天搭建完整企业基础设施。

沿用第一天工程。若第三天尝试过路由，先恢复第一天 main.ts。下面的 HTTP 示例完全依赖本机 Vite，不需要账户、密钥或外部后端。

> [!NOTE] 本篇的阅读方式
>
> 主线按当天目标推进，完整解释用于随时回查。遇到新写法时先读它自己的小例与结果，再运行本单元完整文件；不需要把所有例子合并。两小时是主线学习目标，不代表必须在两小时内逐字读完并运行所有对照实验。练习答案紧随题目，完成自己的判断后再展开。

## 工程入口与模块

浏览器读取 index.html，然后运行 main.ts，创建 App.vue 应用。使用 Router 的项目则由路由配置进一步匹配 views 下的页面。目录名称是团队约定，不是 Vue 自动寻找业务文件的规则。

| 路径 | 主要用途 | 阅读时关注什么 |
| --- | --- | --- |
| package.json | 依赖和 scripts | dev、build 究竟执行什么 |
| vite.config.ts | 构建和开发服务器配置 | 插件、端口、代理 |
| src/views | 页面组件 | 查询与提交入口 |
| src/components | 可复用组件 | Props 与 Emit |
| src/api | 接口函数 | URL、参数、响应结构 |
| src/utils | 工具函数 | 数据转换与通用逻辑 |
| src/types | 类型声明 | 字段是否与接口一致 |
| src/stores | 共享状态 | 数据来源和修改入口 |

`export` 导出具名成员，导入时用花括号；`export default` 导出默认成员，导入名可以自行选择。`import type` 只供类型检查。相对路径从当前文件解析；`@` 只有在构建工具及类型工具中配置了别名才可用，不是 JavaScript 原生路径符号。

`npm run dev` 启动开发服务；`npm run build` 按 package.json 的脚本构建，常见 Vue 模板会先做类型检查再打包；Vite 本身主要转译 TypeScript，不代表一定完成类型检查。`dist` 是构建输出，不应直接修改。

## 从启动命令找到页面代码

### package.json 记录项目怎样启动

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc -b && vite build",
    "preview": "vite preview"
  }
}
```

这是 scripts 字段的语法小例，不是让你用这几行覆盖整个 package.json。dev 右侧的 vite 启动开发服务；build 先执行类型检查再打包，前一步失败则后一步不运行；preview 预览构建产物，不会自动将每次修改重新构建。

`npm run dev` 实际执行哪个命令由项目 scripts 决定。不能因为所有项目都叫 dev，就假定每个项目都有同样的代理、Mock 或检查能力。

### 页面初始化的文件链

Vite 项目常在 index.html 中加载 `/src/main.ts`。main.ts 导入 App.vue，创建应用并注册路由、状态库和组件库。若 App.vue 主要显示 RouterView，应继续看 router 配置，而不是认为 App.vue 没有业务代码就找不到页面。

```text
index.html
  → src/main.ts
    → src/App.vue
      → RouterView（有路由时）
        → src/views/AccountList.vue
          → src/components/AccountForm.vue
```

箭头表示导入或渲染关系，不表示每个目录名都由 Vue 自动识别。实际文件名以项目为准。

### 查找业务文件的具体方法

先用页面 URL 找路由 path；从 component 导入找到页面文件；从页面 @click 找事件函数；从函数中的 import 找接口模块。若页面通过菜单动态加载，继续检查路由生成逻辑，不要仅在 views 中凭名称猜测。

### 完整程序：确认自己读到的是应用入口

在陌生项目中，先不要改业务接口，可以用一个最小页面确认入口关系。以下文件放在独立练习工程，不覆盖笔记网站。

文件：`src/main.ts`。

```ts
import { createApp } from 'vue';
import App from './App.vue';
createApp(App).mount('#app');
```

文件：`src/App.vue`。

```vue
<script setup lang="ts">
const pageName = '入口阅读实验';
</script>

<template>
    <h2>{{ pageName }}</h2>
    <p>当前页面确实由这个 App.vue 渲染。</p>
</template>
```

启动后看到入口阅读实验，证明 index.html 加载 main.ts、main.ts 挂载 App.vue 这条链成立。若修改后毫无变化，应确认当前终端目录、浏览器地址、启动脚本和真正的根组件，再继续业务阅读。

本例没有 Element Plus，所以入口只注册根组件。运行后续控件示例前，恢复第一天包含组件库的 main.ts。入口注册哪些插件会影响页面能力，不能把一份实验入口直接当作所有示例的通用入口。


## 模块系统：文件之间如何调用

### 具名导出与具名导入

```ts
// 文件：src/utils/name.ts
export function normalizeName(value: string): string {
    return value.trim();
}
```

```ts
// 另一个文件中的语法小例
import { normalizeName } from './utils/name';
console.log(normalizeName(' 张三 ')); // 张三
```

export 让函数可以被其他模块引用，import 使当前文件取得这个函数。导入时花括号里的名称需要对应具名导出。调用函数时才运行函数体，不是 import 一出现就按用户姓名执行一次。

### 默认导出与导入名

```ts
// src/utils/defaultName.ts
export default function normalize(value: string): string {
    return value.trim();
}
```

```ts
import cleanName from './utils/defaultName';
```

cleanName 是本文件为默认导出选择的名字，可以与函数声明名不同。一个模块可有多个具名导出，最多一个默认导出。看见 `import http from ...` 时应追到默认导出，不能在目标文件只搜索同名 http 就下结论。

### import type 与运行时值

```ts
import type { Account } from '../types/account';
import { getAccounts } from '../api/accounts';
```

Account 用于标注数据形状，编译后移除；getAccounts 是实际调用的函数，必须保留运行时导入。目录中的 types 只是团队约定，类型也可以在 api 文件中导出。

### 相对路径与别名

`./` 从当前文件所在目录出发，`../` 返回上一级。`@/api/accounts` 中的 @ 需要配置映射，通常指向 src。Vite 的 resolve.alias 负责构建解析，TypeScript 的 paths 负责类型工具识别；只配一边可能出现编辑器与运行结果不一致。

本课程完整示例统一使用相对路径，先保证调用链可直观看见。下方拓展区再解释工程配置。


### 完整程序：从页面调用工具模块

先用没有异步的普通函数看清跨文件调用。文件：`src/utils/normalizeName.ts`。

```ts
export function normalizeName(value: string): string {
    return value.trim();
}
```

文件：`src/App.vue`。

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { normalizeName } from './utils/normalizeName';
const input = ref(' 张三 ');
const output = ref('');
function process(): void {
    output.value = normalizeName(input.value);
}
</script>

<template>
    <input v-model="input" />
    <button @click="process">清理姓名</button>
    <p>处理结果：{{ output }}</p>
</template>
```

初始 output 为空。点击后页面 process 把输入字符串传给模块函数，模块返回清理结果，再由页面给 output.value 赋值。

工具函数并不知道 output 是哪个 ref，也不会自动更新模板。跨文件调用与同文件调用一样，仍要明确参数、返回值和赋值位置。把这个过程理解清楚，再把工具函数换成异步 API 函数，就只多了等待与失败分支。

> [!EXERCISE] 导入成功却不显示结果
>
> process 中只写 normalizeName(input.value)，没有后续赋值，为什么处理结果段落不变化？
>
> 【答案】
>
> 工具函数返回值被丢弃，而模板读取 output。应写 output.value = normalizeName(input.value)。函数执行成功不代表模板依赖的状态已经改变，这与第一天 filter 丢弃结果是同一种数据流遗漏。


## Promise 与错误处理

Promise 表示将来成功或失败的结果。async 函数总返回 Promise；await 等待 Promise 完成，让当前异步函数暂时让出执行机会，并不会冻结整个页面。

try 包围可能失败的步骤，catch 处理失败，finally 不论成功失败都运行，适合恢复 loading。不要在 finally 中 return，以免覆盖原结果或错误。

### Promise 的三种状态

Promise 初始为 pending，即等待结果；成功后为 fulfilled；失败后为 rejected。一个 Promise 一旦确定结果，不会再从成功改成失败。

```ts
const task = new Promise<string>((resolve, reject) => {
    resolve('取得账户');
});
```

`<string>` 表示成功结果是字符串；resolve 提供成功值，reject 提供失败原因。示例没有失败分支，实际业务中应依据操作结果调用其中一个。不要把 resolve 当作 return 的同义词，它是在改变 Promise 结果。

### async 函数的返回值

```ts
async function getName(): Promise<string> {
    return '张三';
}
```

函数体返回字符串，外层调用得到 Promise<string>。`const result = getName()` 得到的是 Promise，不能直接把它当字符串使用；在 async 函数内部用 await getName() 才取得字符串结果。

### 完整程序：async 返回 Promise，不直接返回页面字符串

文件：`src/App.vue`。

```vue
<script setup lang="ts">
import { ref } from 'vue';
const result = ref('尚未读取');
async function getAccountName(): Promise<string> {
    return '储蓄账户';
}
async function load(): Promise<void> {
    const name = await getAccountName();
    result.value = name;
}
</script>

<template>
    <button @click="load">读取名称</button>
    <p>{{ result }}</p>
</template>
```

虽然 getAccountName 内部立刻 return 字符串，但调用它得到的是 Promise<string>。load 用 await 取得成功值，再写入 ref<string>。

如果直接写 result.value = getAccountName()，类型检查会提示 Promise<string> 不能赋给 string。不要通过 String(getAccountName()) 让提示消失，那通常只会得到 Promise 对象的字符串表示，而不是成功结果。

真正的接口函数也遵循同一规则，只是成功值来自网络，而不是固定 return。


### await 不会阻塞整个页面

```ts
message.value = '开始';
const result = await getName();
message.value = result;
```

await 暂停当前异步函数后续步骤，其他事件和浏览器工作仍可继续；等操作完成后才恢复下一行。如果等待的是失败 Promise，控制流跳入最近的 catch。

### 错误如何逐层传播

```ts
async function fail(): Promise<void> {
    throw new Error('无法取得账户');
}
async function run(): Promise<void> {
    try {
        await fail();
        console.log('失败时不会执行这一行');
    } catch (error) {
        console.log('处理失败');
    } finally {
        console.log('本次操作结束');
    }
}
```

throw 创建失败路径，catch 处理它，finally 负责共用收尾。请求 loading 应在 finally 恢复，而不是只写在成功路径。错误对象类型在 catch 中不能随意假定为 Error，使用 instanceof Error 判断后再取 message。

### 成功、失败、收尾分别放在哪里

假设一项操作需要加载账户：开始时显示忙碌；成功时替换列表；失败时保留可读错误；最后恢复按钮。

```text
开始：loading=true
  → await 请求
    → 成功：取得并保存结果
    → 失败：进入 catch，记录错误
  → finally：loading=false
```

try 不是“保证请求成功”，catch 不是“自动修复失败”，finally 也不是“最后总会成功”。它们分别组织正常路径、异常路径和共同收尾。

如果 catch 里继续 throw，错误还会传给更外层；如果 catch 正常结束，当前函数就把这一层错误处理完了。写公共接口模块时应明确错误要不要继续传播，页面才能正确决定显示什么。

### 不要把写入成功与读取成功混在一起

保存接口成功之后，刷新列表还可能失败。若两项 await 全部包在一个 try 里，catch 仍会收到第二项失败。需要记录已经完成的阶段，才能准确提示用户，而不是让用户重复新增。

第五天将实际使用这一点：saved 标识写入是否完成，刷新失败时提示“保存已完成，但刷新失败”。本单元先掌握 try/catch/finally 的基本分支。


### 为什么还要防止重复操作

按钮禁用提供界面反馈，函数开头 `if (loading.value) return` 保护实际入口。只禁用一个按钮而遗漏另一个入口，仍可能产生重复请求；同一个函数的 guard 能覆盖多个调用来源。真正的重复写入防护仍需要后端协议。

下面模拟延迟 500 毫秒，先把异步流程与网络传输分开理解。


完整 `src/App.vue`，先只观察异步控制流：

```vue
<script setup lang="ts">
import { ref } from 'vue'
const message = ref('等待操作')
const loading = ref(false)
function simulate(fail: boolean): Promise<string> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (fail) reject(new Error('模拟失败'))
      else resolve('模拟成功')
    }, 500)
  })
}
async function run(fail: boolean) {
  if (loading.value) return
  loading.value = true
  try {
    message.value = await simulate(fail)
  } catch (error) {
    message.value = error instanceof Error ? error.message : '未知错误'
  } finally {
    loading.value = false
  }
}
</script>
<template>
  <el-button :disabled="loading" @click="run(false)">成功请求</el-button>
  <el-button :disabled="loading" @click="run(true)">失败请求</el-button>
  <p>{{ message }}</p>
</template>
```

Promise 构造器接收执行器，resolve 完成成功结果，reject 标记失败；setTimeout 延迟执行一次。Error 保存错误信息，instanceof 检查运行时对象类别。这只是计时器模拟，不会在 Network 中产生 HTTP 请求。

> [!EXERCISE] 失败后按钮一直禁用
>
> 如果只在 await 后设置 loading=false，请求失败会发生什么？
>
> 【答案】
>
> await 抛出错误后跳入 catch，跳过成功路径的赋值，loading 可能一直为 true。恢复状态放入 finally，成功和失败都会执行。

## Axios 与真正的 HTTP 请求

HTTP 请求包括方法、URL、查询参数或请求体。GET 常用于读取，POST 常用于提交；具体业务语义以接口约定为准。Axios 是发送 HTTP 请求的库。`axios.create` 创建可复用实例，baseURL 是公共路径前缀，timeout 是超时毫秒数。

`get<T>(url, { params })` 用 params 生成 URL 查询参数，T 描述响应体类型。Axios 返回的响应对象包含 status、headers、data 等；真正 JSON 响应体通常在 response.data 中。若后端响应体本身还有 data 字段，则可能要读 response.data.data，不能凭经验随意增减一层。

### GET 的查询参数与 POST 的请求体

```ts
// 接口形态小例：依赖确实存在的后端，不是本课本地 JSON 路径
await http.get('/accounts', { params: { name: '张三', page: 1 } });
await http.post('/accounts', { name: '张三', active: true });
```

GET 的 params 会序列化进 URL 查询串，适合筛选和分页；POST 第二个参数通常作为请求体发送，JSON 字段承载新增数据。传参位置不是按偏好决定，应遵守后端接口文档。

### AxiosResponse 与业务响应体

```ts
const response = await http.get<Account[]>('/accounts');
const rows = response.data;
```

response 是 Axios 响应对象，包含 status、headers、data 等；response.data 才是服务器响应体。若服务器返回数组，rows 就是数组。

有些后端返回包裹结构：

```json
{ "code": 0, "message": "成功", "data": [{ "id": 101, "name": "张三", "active": true }] }
```

那么 response.data 是这个对象，账户数组在 response.data.data。HTTP status 与业务 code 是不同层：HTTP 200 仍可能包含业务失败码。

### 泛型响应结构表达什么

```ts
interface ApiResult<T> {
    code: number;
    message: string;
    data: T;
}
```

T 是业务数据类型的位置。ApiResult<Account[]> 表示 data 是账户数组，ApiResult<Account> 表示单个账户。泛型不会替你从 JSON 中取出 data，也不会验证真实响应；调用方必须按照协议读取并检查。

### 完整程序：读包裹响应，并检查业务码

这次仍然使用本机静态文件，但将响应体改成常见的业务包裹结构。它独立于后面的裸数组示例；两种形状不能混用。

文件：`public/account-result.json`。

```json
{
    "code": 0,
    "message": "成功",
    "data": [
        { "id": 101, "name": "储蓄账户", "active": true },
        { "id": 102, "name": "工资账户", "active": false }
    ]
}
```

文件：`src/api/wrappedAccounts.ts`。

```ts
import axios from 'axios';
export interface Account {
    id: number;
    name: string;
    active: boolean;
}
interface ApiResult<T> {
    code: number;
    message: string;
    data: T;
}
export async function getWrappedAccounts(): Promise<Account[]> {
    const response = await axios.get<ApiResult<Account[]>>('/account-result.json');
    const body = response.data;
    if (body.code !== 0) {
        throw new Error(body.message);
    }
    return body.data;
}
```

文件：`src/App.vue`。

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { getWrappedAccounts } from './api/wrappedAccounts';
import type { Account } from './api/wrappedAccounts';
const rows = ref<Account[]>([]);
const message = ref('尚未加载');
const loading = ref(false);
async function load(): Promise<void> {
    if (loading.value) return;
    loading.value = true;
    try {
        rows.value = await getWrappedAccounts();
        message.value = '加载成功';
    } catch (error) {
        rows.value = [];
        message.value = error instanceof Error ? error.message : '加载失败';
    } finally {
        loading.value = false;
    }
}
</script>

<template>
    <button :disabled="loading" @click="load">加载包裹响应</button>
    <p>{{ message }}</p>
    <ul>
        <li v-for="row in rows" :key="row.id">{{ row.name }}</li>
    </ul>
</template>
```

先看接口函数取值过程：Axios response.data 得到整个 JSON 对象；body.code 检查业务结果；body.data 才是记录数组；函数只把数组返回给页面。因此页面 rows 不需要再读一次 .data。

运行第一次加载后显示两个账户。再把 JSON 的 code 改成 1001，message 改成“无查询权限”，刷新或重新加载后应进入失败路径，页面显示无查询权限。Network 仍可能看到 HTTP 200，因为静态文件传输成功，失败来自响应体中的业务约定。

把 code 恢复为 0 后再次加载，列表恢复。这个实验让你亲自区分 HTTP 成功、业务成功与页面更新，不能只靠一个“请求成功”的日志判断。

> [!EXERCISE] 多取了一层 data
>
> getWrappedAccounts 已返回 body.data，页面却把结果记为 response，再写 rows.value = response.data。错误在哪里？
>
> 【答案】
>
> 页面取得的已是 Account[]，它不是 AxiosResponse，也不是业务包裹对象。应直接 rows.value = await getWrappedAccounts()。变量名字叫 response 不会改变真实数据形状，应追踪函数的返回值。


### loading、空列表与失败提示要分开

请求开始时清理上次错误并设置 loading；成功后赋值 rows；失败后显示错误；finally 恢复 loading。空列表表示“请求完成但没有记录”，不能把网络失败也无声地显示成“没有账户”。

本课完整程序采用失败后清空列表的策略，让错误提示成为主要反馈。其他产品也可能保留旧数据并标注刷新失败，只要明确表达数据是否为旧结果即可。

### 本地 JSON 为什么适合第一轮请求训练

public/accounts.json 是真实 HTTP 资源，能在 Network 看到请求；它不需要后端账户与数据库。但静态文件不会根据 name 参数自动筛选，也不支持新增编辑。这次由前端取得数组后筛选，后续切换后端时再把查询条件交给服务器。


### 完整程序：本地 JSON 查询

创建 `public/accounts.json`，Vite 会通过 `/accounts.json` 提供它：

```json
[
  { "id": 1, "name": "张三", "active": true },
  { "id": 2, "name": "李四", "active": false }
]
```

完整 `src/types/account.ts`：

```ts
export interface Account {
  id: number
  name: string
  active: boolean
}
```

完整 `src/api/accounts.ts`：

```ts
import axios from 'axios'
import type { Account } from '../types/account'
const http = axios.create({ baseURL: '/', timeout: 5000 })
export async function getAccounts(keyword: string): Promise<Account[]> {
  const response = await http.get<Account[]>('accounts.json')
  // 静态文件不会处理查询参数，本例收到全量数据后在前端筛选。
  return response.data.filter(item => item.name.includes(keyword.trim()))
}
```

完整 `src/App.vue`：

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getAccounts } from './api/accounts'
import type { Account } from './types/account'
const keyword = ref('')
const rows = ref<Account[]>([])
const loading = ref(false)
const errorMessage = ref('')
async function search() {
  if (loading.value) return
  loading.value = true
  errorMessage.value = ''
  try {
    rows.value = await getAccounts(keyword.value)
  } catch (error) {
    rows.value = []
    errorMessage.value = error instanceof Error ? error.message : '请求失败'
  } finally {
    loading.value = false
  }
}
onMounted(search)
</script>
<template>
  <el-input v-model="keyword" />
  <el-button :loading="loading" :disabled="loading" @click="search">查询</el-button>
  <p v-if="errorMessage">{{ errorMessage }}</p>
  <p v-else-if="loading">正在加载</p>
  <el-table v-else-if="rows.length > 0" :data="rows" row-key="id">
    <el-table-column prop="name" label="姓名" />
  </el-table>
  <el-empty v-else description="没有账户" />
</template>
```

按钮 loading 属性显示忙碌状态；函数内部 guard 同时防止重复进入。这个策略是“请求期间忽略再次查询”，不是“允许并发并保证最新结果胜出”。真实搜索建议按产品需求选择禁用、取消旧请求或请求序号策略。

### 完整请求示例的逐步执行

第一次挂载时，onMounted 调用 search。search 的 guard 确保没有未完成操作，随后设置 loading=true 并清除错误。调用 getAccounts(keyword.value) 时，把当时输入值作为字符串参数传入，不是让 API 模块直接访问页面 ref。

API 模块向 accounts.json 发送 GET，等待响应，取 response.data 后按参数筛选，返回 Account[]。页面 await 取得数组，赋给 rows.value，模板相应显示表格或空状态。finally 最后恢复按钮。

| 阶段 | keyword | loading | rows 的含义 |
| --- | --- | --- | --- |
| 初始化 | 空字符串 | false | 尚未加载的空数组 |
| 请求中 | 用户输入值 | true | 可能保留上一轮数据，当前由加载分支遮盖 |
| 成功 | 当前输入值 | false | 本次筛选结果 |
| 失败 | 当前输入值 | false | 清空，由错误分支说明失败 |

输入改变并不自动运行 search。onMounted 只处理初始加载，@click 处理后续查询；v-model 只更新关键词。


## 在浏览器中追踪请求

打开开发者工具后选择 Network，刷新页面，找到 accounts.json。检查 Request URL 是否正确，Status 是否成功，Response 是否真的是 JSON 数组。再到 Sources 找到 accounts.ts，在 await 后一行设断点，重新查询，观察 response.data；返回 App.vue 观察 rows 的赋值。Console 用于读取异常堆栈，不要只看最后一行提示文字。

HTTP 200 只代表该层请求成功，不保证业务成功。若响应是 `{ code: 500, data: null }`，还需要按业务协议判断 code。TypeScript 泛型是静态声明，不验证响应；真实系统可用手动检查或运行时校验库确认数据形状。

### 用固定问题顺序检查 Network

1. **有没有请求？** 没有时先回到按钮事件和函数断点，而不是先改后端 URL。
2. **请求发往哪里？** 查看 Request URL、方法和查询参数，确认路径前缀与代理规则。
3. **HTTP 是否成功？** 404 常见于路径不存在，401/403 常与认证权限有关，500 常指服务器处理失败；最终原因仍以响应和服务端记录为准。
4. **返回的内容是什么？** 检查 Response 的原始体和 Content-Type，开发服务器回退的 HTML 即使 status 为 200 也不是账户数组。
5. **页面如何取出数据？** 核对 response.data 的形状，再跟踪它赋给哪个 ref，最后检查模板是否读取同一状态。

### 断点比猜测更直接

在 App.vue 的 search 内设置断点，点击查询。逐步执行到 API 函数，查看传入 keyword；跨过 await 后查看 response.data；返回页面后查看 rows.value。异步调用跨越任务恢复，调试器显示方式可能不同，但业务数据链条不变。

Console 适合先确认函数是否进入与错误堆栈位置；Sources 断点适合观察中间值；Network 适合证实传输。三者分工不同，不能只打印“请求成功”就认为字段映射正确。

### 最小故障实验

将 API 路径暂时改成 missing-accounts.json，再查询。若服务器返回 404，catch 显示错误；若开发服务器回退 HTML，则可能到 filter 才失败。无论哪种，先看原始响应再确定原因。恢复路径后再次查询，确认错误清除、按钮恢复、数据重新出现。

清空 JSON 为合法空数组 `[]` 再查询，应显示没有账户；这与文件不存在应有不同反馈。完成后恢复两条初始记录。


> [!EXERCISE] 响应成功但页面报错
>
> 把 accounts.json 从数组改为 `{ "data": [...] }` 后，filter 不是函数，为什么？
>
> 【答案】
>
> response.data 变成对象。应同步声明响应结构，例如 `interface Result { data: Account[] }`，使用 get<Result>，再对 response.data.data 筛选。只修改泛型不会改变真实数据结构。

> [!EXERCISE] 制造并定位失败
>
> 将 JSON 文件中的一个逗号删掉，再查询。应该从哪些地方确认问题？
>
> 【答案】
>
> 先看 Network 返回的原始内容，再看 Console 或页面错误。不同解析配置下可能在解析阶段失败，也可能得到字符串并在 filter 处失败。恢复合法 JSON 后重新请求，确认 loading 能恢复，错误提示能清除。

## Pinia：跨组件共享状态

局部表单草稿通常留在组件；登录用户、跨页面共享的业务选择可放 Store。Pinia 是 Vue 状态管理库。defineStore 定义 Store，State 保存状态，Getter 提供派生结果，Action 实现修改或异步行为。

setup 风格中 ref 对应状态、computed 对应 Getter、函数对应 Action。`storeToRefs` 将状态和 Getter 转成可解构的 ref，避免直接解构普通值失去响应关联；Action 可以直接通过 store 调用。

### 哪些数据值得共享

搜索输入与尚未提交的表单草稿通常只服务于一个页面，不必放 Store。登录用户信息、多个页面共同使用的选择项适合明确共享。过早把所有变量放入 Store，会让修改影响范围难以判断。

### defineStore 的 ID 与 setup 函数

```ts
export const useSelectionStore = defineStore('selection', () => {
    const id = ref(0);
    return { id };
});
```

selection 是唯一 Store ID，不能把不同业务 Store 都写成同一个字符串。defineStore 返回的是取得 Store 的函数，组件调用 useSelectionStore() 才取得当前 Pinia 实例中的 Store。

### State、Getter 与 Action 的对应

```ts
const id = ref(0); // State：保存选择
const hasSelection = computed(() => id.value !== 0); // Getter：派生结果
function select(value: number) { id.value = value; } // Action：修改入口
```

这是 setup 风格 Store 的表达方式，不需要另外写 state/getters/actions 配置对象。返回出去的成员才能供组件正常使用并被 Pinia 工具识别，不要故意隐藏需要管理的状态。

### storeToRefs 为什么只转换状态

```ts
const store = useSelectionStore();
const { id, hasSelection } = storeToRefs(store);
store.select(101);
```

Store 对外提供自动解包的属性。直接 `const { id } = store` 可能只取到当时的普通值，后续修改不再更新这个局部变量。storeToRefs 为状态和 Getter 提供可保持连接的 ref；Action 是函数，可以直接通过 store 调用，不必也转成 ref。

### 注册 Pinia 与组件调用的顺序

入口先 `.use(createPinia())`，再挂载组件。组件 setup 中调用 useSelectionStore 时，才能获得应用中的 Pinia。多个组件在同一应用中调用同一 Store，会拿到同一份状态；这与第三天独立的 useCounter 局部状态不同。


本单元是独立示例。完整 `src/stores/selection.ts`：

```ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
export const useSelectionStore = defineStore('selection', () => {
  const id = ref(0)
  const hasSelection = computed(() => id.value !== 0)
  function select(value: number) { id.value = value }
  return { id, hasSelection, select }
})
```

完整 `src/main.ts`：

```ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
createApp(App).use(createPinia()).mount('#app')
```

完整 `src/App.vue`：

```vue
<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useSelectionStore } from './stores/selection'
const store = useSelectionStore()
const { id, hasSelection } = storeToRefs(store)
</script>
<template>
  <button @click="store.select(7)">选择账户 7</button>
  <p>编号：{{ id }}，已选择：{{ hasSelection }}</p>
</template>
```

同一 Pinia 实例下的其他组件调用相同 Store 会共享状态。刷新页面通常会丢失内存状态；Pinia 不自动持久化，也不是后端数据库。

### 完整程序：两个组件共享同一个选择

前面的 Store 只在一个组件里使用，还不能直接观察共享。下面让两个兄弟组件分别读取和修改同一份选择。没有组件库控件，入口只需注册 Pinia。

文件：`src/stores/sharedAccount.ts`。

```ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
export const useSharedAccountStore = defineStore('shared-account', () => {
    const selectedName = ref('尚未选择');
    const hasSelection = computed(() => selectedName.value !== '尚未选择');
    function select(name: string): void {
        selectedName.value = name;
    }
    return { selectedName, hasSelection, select };
});
```

文件：`src/components/AccountSelector.vue`。

```vue
<script setup lang="ts">
import { useSharedAccountStore } from '../stores/sharedAccount';
const store = useSharedAccountStore();
</script>

<template>
    <button @click="store.select('储蓄账户')">选择储蓄账户</button>
    <button @click="store.select('工资账户')">选择工资账户</button>
</template>
```

文件：`src/components/AccountSummary.vue`。

```vue
<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useSharedAccountStore } from '../stores/sharedAccount';
const store = useSharedAccountStore();
const { selectedName, hasSelection } = storeToRefs(store);
</script>

<template>
    <p>当前选择：{{ selectedName }}</p>
    <p>已有选择：{{ hasSelection ? '是' : '否' }}</p>
</template>
```

文件：`src/main.ts`。

```ts
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
createApp(App).use(createPinia()).mount('#app');
```

文件：`src/App.vue`。

```vue
<script setup lang="ts">
import AccountSelector from './components/AccountSelector.vue';
import AccountSummary from './components/AccountSummary.vue';
</script>

<template>
    <AccountSelector />
    <AccountSummary />
</template>
```

初始摘要显示尚未选择、否。点击选择工资账户后，Selector 调用 Store Action，Store 修改 selectedName，Getter hasSelection 重新得到 true，Summary 显示工资账户、是。

这两个子组件没有互相导入，也没有通过父组件转发 Props。它们调用同一个 useSharedAccountStore，在同一个 Pinia 实例里取得同一份状态，所以能协作。

### Store 内部与外部的 .value 不一样

Store setup 内的 selectedName 是 ref，函数里写 selectedName.value。组件取得的 store.selectedName 由 Pinia 代理提供自动解包，通常不用再写 .value。使用 storeToRefs 后得到的局部 selectedName 又是 ref，脚本里应写 selectedName.value，模板顶层仍自动解包。

这三种访问位置要对应声明来源，不要只看到同一个名字就统一加或删 .value。

### storeToRefs 的对照实验

在 Summary 中临时改成 `const { selectedName } = store`，只保留姓名段落再运行。它可能只拿到当时的字符串尚未选择，后续 Store 改变，局部字符串不会重新连接回去。

恢复 storeToRefs 后，取得的是连接 Store 的 ref，变化继续传递。与第二天 reactive 普通属性解构相同，核心是分清“取到一个值”还是“保留一个响应式连接”。

> [!EXERCISE] Store 是否自动写数据库
>
> 选择工资账户后刷新浏览器，为什么可能回到尚未选择？这是 Store 失效了吗？
>
> 【答案】
>
> 不是。这个 Store 只存当前应用内存；页面刷新重新创建应用与 Store，初始化逻辑再次运行。持久化到浏览器或后端需要另外明确实现，Pinia 不会自动保存到数据库。


## 拓展：代理、环境变量与拦截器

以下为配置查阅，不替换上面的静态 JSON 实验。先逐项理解下一份配置将出现的名称。

- defineConfig 为配置对象提供类型提示；plugins 是插件数组，vue() 加载处理 Vue 单文件组件的插件。
- server 保存开发服务器选项；port 是首选端口，host 是监听地址。127.0.0.1 表示只接受本机连接。
- proxy 按路径前缀转发请求；target 是后端目标地址；changeOrigin 调整转发请求的 Host。
- 本例把 /api/accounts 转发到目标服务的同名路径，不会自动删除 /api 前缀。后端必须确实提供这个路径。

假设后端监听 3000 端口并接收 /api/accounts，完整 vite.config.ts 如下：

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    host: '127.0.0.1',
    proxy: { '/api': { target: 'http://127.0.0.1:3000', changeOrigin: true } }
  }
})
```

defineConfig 提供配置类型提示；plugins 加载 Vue 文件处理插件；port 是首选端口，host 控制监听地址；proxy 把匹配前缀的开发请求转发给目标服务，changeOrigin 调整转发 Host。本例保留 `/api` 路径，后端没有该前缀时必须按接口约定重写。没有后端时代理不会凭空创建接口。生产部署需要服务器另行配置转发。

`.env` 存放公共环境变量，`.env.development` 与 `.env.production` 按模式加载。`VITE_API_BASE=/api` 可通过 `import.meta.env.VITE_API_BASE` 读取，值通常为字符串；更改后重启开发服务器。VITE_ 前缀变量会暴露给客户端，不能存私钥。

真实接口常见调用表达式为 `http.get('/accounts', { params: { name, page, pageSize } })` 和 `http.post('/accounts', payload)`，分别把参数放 URL 查询串与请求体。它们只是接口形态说明，不代表存在可访问的后端。

请求拦截器适合统一附加请求头，必须返回 config；响应拦截器适合统一处理响应，成功分支返回约定结果，错误分支通常 `return Promise.reject(error)` 保持失败传播。若拦截器返回 response.data，调用方就不能仍按 AxiosResponse 读取 response.data.data；类型和运行行为必须一致。

Mock 是模拟数据或接口行为。静态 JSON 只适合读取；一个普通 mock.ts 文件若没有被导入、注册中间件或交给插件处理，不会自动成为 HTTP 路由。第五天使用明确导入的内存服务模拟增删改；它不会产生 Network 请求，也不会持久保存。

### 用一个具体地址理解代理

假设浏览器在 http://127.0.0.1:5173 打开页面，代码请求 /api/accounts?name=张三；开发服务器识别 /api 前缀后，把请求转发到 http://127.0.0.1:3000/api/accounts?name=张三。

```text
页面请求：5173 /api/accounts
  → Vite 的 proxy 匹配 /api
    → 后端目标：3000 /api/accounts
      → 后端响应
        → Vite 转回浏览器
```

浏览器 Network 通常看到的是发给开发服务器的地址，而不是直接跳到目标后端地址。想确认代理目标，应同时看 vite.config.ts，不要因为 Network 里仍是 5173 就认为代理没有生效。

changeOrigin 调整转发的 Host 头，不等于自动删除路径前缀。后端若只提供 /accounts，应按项目约定配置 rewrite；不能把“代理成功连接”和“后端路径匹配”混为同一件事。

开发代理只在开发服务器提供这项服务。构建后的静态文件部署到别处，生产服务器或网关需要独立配置。若开发正常而生产请求 404，应检查部署后的实际 baseURL 和转发规则。

## 拓展实例：Axios 封装与响应类型一致

### 一个只负责 HTTP 的实例

本示例依赖确实存在的 `/api` 后端，不是替换本地 JSON 练习的必要步骤。完整 `src/api/http.ts`：

```ts
import axios from 'axios';
const http = axios.create({ baseURL: '/api', timeout: 5000 });
http.interceptors.request.use(config => {
    // 这里可按真实协议统一添加请求头，本例只保留配置。
    return config;
});
http.interceptors.response.use(
    response => response,
    error => Promise.reject(error)
);
export default http;
```

interceptors.request.use 注册请求发出前的处理器；返回 config 才能让后续请求继续。interceptors.response.use 的第一个回调处理成功响应，第二个回调处理失败。Promise.reject(error) 保留失败，使页面 catch 能接住。

如果错误回调只 console.log 然后结束，返回值是 undefined，调用方可能误以为错误已经被处理。公共封装中应明确是返回替代数据还是继续抛出失败，不能模糊。

本例成功回调仍返回 Axios response，所以页面或 API 函数继续读取 response.data。若封装改成返回响应体，应同步修改函数类型和所有调用方，不能只改一行返回值。

### 完整程序：在 Network 中观察请求拦截器

前一份 http.ts 展示的是结构。现在加一项能观察到的行为：统一给请求增加 X-Learning-Source 请求头，值为 vue-course。该请求头只用于学习，不是登录令牌，也没有真实鉴权能力。

Axios 请求配置里的 headers 保存请求头；这里的 headers.set(name,value) 设置一个头字段。请求拦截器返回修改后的 config，之后 Axios 按这份配置发送。

响应拦截器只打印 HTTP 状态，并原样返回 response，所以 API 模块仍通过 response.data 读取 JSON。先不解包，避免同时改变类型与调用习惯。

文件：`src/api/interceptorHttp.ts`。

```ts
import axios from 'axios';
const http = axios.create({ baseURL: '/', timeout: 5000 });
http.interceptors.request.use(config => {
    config.headers.set('X-Learning-Source', 'vue-course');
    console.log('请求拦截器：准备发送', config.url);
    return config;
});
http.interceptors.response.use(
    response => {
        console.log('响应拦截器：HTTP 状态', response.status);
        return response;
    },
    error => {
        console.log('响应拦截器：继续传递失败');
        return Promise.reject(error);
    }
);
export default http;
```

文件：`src/api/interceptorAccounts.ts`。

```ts
import http from './interceptorHttp';
export interface Account {
    id: number;
    name: string;
}
export async function getInterceptedAccounts(): Promise<Account[]> {
    const response = await http.get<Account[]>('/interceptor-accounts.json');
    return response.data;
}
```

文件：`public/interceptor-accounts.json`。

```json
[
    { "id": 101, "name": "拦截器实验账户" }
]
```

文件：`src/App.vue`。

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { getInterceptedAccounts } from './api/interceptorAccounts';
import type { Account } from './api/interceptorAccounts';
const rows = ref<Account[]>([]);
const message = ref('');
const loading = ref(false);
async function load(): Promise<void> {
    if (loading.value) return;
    loading.value = true;
    try {
        rows.value = await getInterceptedAccounts();
        message.value = '读取成功';
    } catch (error) {
        message.value = error instanceof Error ? error.message : '读取失败';
    } finally {
        loading.value = false;
    }
}
</script>

<template>
    <button :disabled="loading" @click="load">观察拦截器请求</button>
    <p>{{ message }}</p>
    <ul><li v-for="row in rows" :key="row.id">{{ row.name }}</li></ul>
</template>
```

### 按顺序观察四个位置

先打开 Console 和 Network，再点击按钮。Console 先显示准备发送；Network 中找到 JSON 请求，在 Request Headers 里确认 X-Learning-Source；请求完成后 Console 显示响应状态；最后页面显示账户名。

这四处分别证明配置处理、真实传输、响应处理与页面赋值，不能只看到一条请求日志就认定响应已经到达页面。

将 API 路径临时改成不存在的 JSON 资源，再请求。确认错误经过响应拦截器后仍到页面 catch，loading 最终恢复。若开发服务器把未知路径回退成 HTML，还要检查响应体形状，第四天前面的调试实验已经说明这种边界。

### 为什么不能在错误拦截器里只打印

如果错误回调执行完就返回 undefined，Promise 链可能把它当作已经处理的结果。上层不一定按原失败路径进入 catch，可能到访问 response.data 时才报另一个错误。

因此公共层若没有提供明确的替代成功结果，应继续拒绝 Promise。页面才有机会按具体业务决定显示什么、是否保留旧数据和是否允许重试。

> [!EXERCISE] 响应拦截器提前返回 response.data
>
> 若把成功回调改成 return response.data，却保持 API 中的 response.data 不变，为什么可能得到 undefined 或类型不一致？
>
> 【答案】
>
> API 接收到的运行时值已经是响应体，不再是 AxiosResponse，再访问 .data 就多取了一层。若仍沿用 Axios 默认类型签名，类型也可能与真实返回不一致。初学封装时先保留 response，等能统一调整类型与调用方时再考虑解包策略。

### 业务码与 HTTP 状态分层检查

完整 `src/api/resultAccounts.ts`，与上面的 http.ts 配套：

```ts
import http from './http';
import type { Account } from '../types/account';
interface ApiResult<T> {
    code: number;
    message: string;
    data: T;
}
export async function getResultAccounts(): Promise<Account[]> {
    const response = await http.get<ApiResult<Account[]>>('/accounts');
    const result = response.data;
    if (result.code !== 0) throw new Error(result.message);
    return result.data;
}
```

这里约定 code=0 为业务成功，只适用于这个协议，不是所有后端统一规则。HTTP 失败通常先由 Axios 拒绝；HTTP 成功但 code 非零，由我们主动 throw。页面对两种失败都可以用同一套 finally 恢复状态。

## 拓展实例：环境模式与路径别名

### 模式选择影响加载哪些变量

`.env` 中放公共项，`.env.development` 在开发模式中覆盖，`.env.production` 在生产模式中覆盖。示例文件：

```dotenv
VITE_API_BASE=/api
```

在客户端代码读取：

```ts
const apiBase = import.meta.env.VITE_API_BASE;
```

变量值通常是字符串；`VITE_ENABLE_MOCK=false` 的读取值不是布尔 false。若采用该开关，应明确写 `import.meta.env.VITE_ENABLE_MOCK === 'true'`。不要把密钥放入 VITE_ 前缀变量，因为它会进入客户端。

### 完整程序：看见当前模式和字符串开关

文件：`.env.development`，放在练习项目根目录，而不是 src 中。

```dotenv
VITE_API_BASE=/api
VITE_USE_MOCK=true
```

文件：`.env.production`。

```dotenv
VITE_API_BASE=/production-api
VITE_USE_MOCK=false
```

文件：`src/App.vue`。

```vue
<script setup lang="ts">
const mode = import.meta.env.MODE;
const apiBase = import.meta.env.VITE_API_BASE;
const rawFlag = import.meta.env.VITE_USE_MOCK;
const useMock = rawFlag === 'true';
</script>

<template>
    <p>当前模式：{{ mode }}</p>
    <p>接口前缀：{{ apiBase }}</p>
    <p>开关原文：{{ rawFlag }}</p>
    <p>解析为布尔值后：{{ useMock ? '启用 Mock' : '关闭 Mock' }}</p>
</template>
```

开发服务器通常使用 development 模式，显示 /api 和启用 Mock。修改环境文件后需要重启开发服务器，让工具重新加载；不能像修改一个 ref 那样等待页面自动读磁盘。

运行 npm.cmd run build 后再运行 npm.cmd run preview，查看构建产物通常会显示 production 模式、/production-api 和关闭 Mock。模式值是在构建时进入客户端代码的，preview 不会把构建结果重新变成开发模式。

字符串 'false' 本身在 JavaScript 条件判断中是真值。若写 if(rawFlag)，可能错误地开启 Mock，因此这里明确比较 rawFlag === 'true'。任何配置开关都应先确定字符串到业务类型的解析规则。

不要把令牌或私钥放在这些环境变量里。它们是公开前端配置，进入网页后用户可以查看；环境文件名称含 production 并不会让其内容自动保密。


### 别名应让构建与类型检查都认识

下列是配置思路小例，不要求覆盖已有工程：Vite 的 resolve.alias 将 @ 指向 src，TypeScript 则在实际承载应用配置的 tsconfig 中补充对应 paths。项目有 tsconfig.app.json 时，应先查看 extends/references 关系再编辑。

```json
{
  "compilerOptions": {
    "paths": { "@/*": ["./src/*"] }
  }
}
```

paths 只帮助 TypeScript 解析，不会替 Vite 自动修改运行时 import。今天使用相对路径，目的是在工程刚入门时保持导入链直观。

### 完整配置：让 @ 同时被 Vite 与类型检查识别

相对路径很直观，层级多时会出现 ../../../。别名只是把常用目录起一个短名称，不改变模块内容。

下面的配置使用 Node.js 的 node:url 工具：new URL('./src', import.meta.url) 根据当前配置文件位置找到 src；fileURLToPath 把文件 URL 转成当前系统的文件路径。这段代码运行在开发工具环境，不是在浏览器里读用户磁盘。

文件：`vite.config.ts`。

```ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';
export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    }
});
```

resolve.alias 给 Vite 指定运行与构建时的解析规则。类型工具还需要知道同一映射。下面是一份用于此独立实验的最小应用配置，已有工程应对照其配置继承关系合并，而不是删除其他必要选项。

文件：`tsconfig.app.json`。

```json
{
    "compilerOptions": {
        "target": "ES2022",
        "module": "ESNext",
        "moduleResolution": "Bundler",
        "strict": true,
        "skipLibCheck": true,
        "noEmit": true,
        "lib": ["ES2022", "DOM", "DOM.Iterable"],
        "types": ["vite/client"],
        "paths": {
            "@/*": ["./src/*"]
        }
    },
    "include": ["src/**/*.ts", "src/**/*.vue"]
}
```

本例主要关注 paths；其他选项分别为目标语法、模块方式、构建器解析、严格检查、库声明检查策略、只检查不输出、运行环境类型和文件范围。Vite 模板已有相近配置时，通常只需补 paths，而不是重新配置所有选项。

文件：`src/utils/aliasName.ts`。

```ts
export const name = '从别名导入的账户';
```

文件：`src/App.vue`。

```vue
<script setup lang="ts">
import { name } from '@/utils/aliasName';
</script>

<template>
    <p>{{ name }}</p>
</template>
```

运行后应显示从别名导入的账户。若浏览器能运行但编辑器报找不到模块，重点检查 TypeScript paths；若编辑器不报错但运行找不到文件，重点检查 Vite alias。两套工具不是自动互相代替。


### Mock 的三种常见位置

静态 JSON 是一个可读取资源，能在 Network 看到 GET，但不处理写入。页面导入的 Mock 函数在浏览器内执行，通常没有 HTTP 请求。开发服务器中间件或 Mock 插件可以建立模拟 HTTP 接口，前提是确实配置并启用。

不能只新建 mock/accounts.ts 就假定 /api/accounts 自动存在。切换真实接口时，应定位“哪个模块被页面导入”和“请求实际发往哪里”，然后逐步核对响应协议。

> [!EXERCISE] 判断数据到底来自哪里
>
> 页面调用 listAccounts，Network 没有新请求，但列表刷新了，是否一定是浏览器故障？
>
> 【答案】
>
> 不一定。先追到 listAccounts 的实现，看它是否是内存 Mock、静态缓存或 Store 读取。函数名字像 API 不代表内部一定发送 HTTP。只有确认已调用 Axios/fetch 等传输入口后，再排查 Network 过滤条件与请求行为。

## 独立实验：在 HTTP 与本地 Mock 之间切换

### 先规定两种来源返回同样形状

页面只需要 Account[]，不应因为切换来源就到处增加判断。把差异留在 API 模块：本地 Mock 返回数组，HTTP 也返回数组；页面始终调用同一个 getSwitchAccounts。

本例 HTTP 来源仍使用本机静态 JSON，保证你可以直接运行并观察 Network。它只是读取对照，不声称静态 JSON 支持后端增删改。

文件：`src/api/switchAccounts.ts`。

```ts
import axios from 'axios';
export interface Account {
    id: number;
    name: string;
}
const mockAccounts: Account[] = [
    { id: 901, name: 'Mock 储蓄账户' }
];
export async function getSwitchAccounts(): Promise<Account[]> {
    const useMock = import.meta.env.VITE_USE_MOCK === 'true';
    if (useMock) {
        return mockAccounts.map(item => ({ ...item }));
    }
    const response = await axios.get<Account[]>('/switch-accounts.json');
    return response.data;
}
```

文件：`public/switch-accounts.json`。

```json
[
    { "id": 101, "name": "HTTP 储蓄账户" }
]
```

文件：`.env.development`。

```dotenv
VITE_USE_MOCK=true
```

文件：`src/App.vue`。

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { getSwitchAccounts } from './api/switchAccounts';
import type { Account } from './api/switchAccounts';
const rows = ref<Account[]>([]);
const errorMessage = ref('');
async function load(): Promise<void> {
    try {
        rows.value = await getSwitchAccounts();
        errorMessage.value = '';
    } catch (error) {
        errorMessage.value = error instanceof Error ? error.message : '读取失败';
    }
}
</script>

<template>
    <button @click="load">加载对照数据</button>
    <p>{{ errorMessage }}</p>
    <ul><li v-for="row in rows" :key="row.id">{{ row.name }}</li></ul>
</template>
```

先启动并加载，显示 Mock 储蓄账户。打开 Network，这次函数直接返回模块内数据，不会新发 switch-accounts.json 请求。

然后把环境值改成 false，重启开发服务器，再加载。页面显示 HTTP 储蓄账户，并能看到 JSON 的 GET 请求。页面组件没有改变，因为两种来源都遵守相同函数返回类型。

**切换 Mock 的关键不是文件名里有没有 mock，而是实际执行了哪条分支。** 真实企业项目可能用插件、服务层或环境配置，仍然要追到具体实现证实。

> [!EXERCISE] 开关写成 if(useMockText)
>
> 环境变量是字符串 false，API 却仍走 Mock。怎样定位和修复？
>
> 【答案】
>
> 先在 API 模块查看读到的原始值与类型，确认它是非空字符串；再检查是否直接拿它作条件。应显式比较 import.meta.env.VITE_USE_MOCK === 'true'，改环境值后重启。不能只改页面显示文字来假装来源已切换。



## 当日验收与资料

能从按钮找到 API 文件，识别参数、响应包裹层、loading 恢复位置，并在 Network 证实实际响应内容，即完成主线。

- [Axios 实例](https://axios-http.com/docs/instance)
- [Axios 错误处理](https://axios-http.com/docs/handling_errors)
- [Vite 环境变量](https://vite.dev/guide/env-and-mode)
- [Pinia 核心概念](https://pinia.vuejs.org/core-concepts/)
