---
id: vue-course-day-4
title: "Vue 企业开发 · 第四天：工程、接口与排错"
folder: miscellaneous
order: 1104
date: 2026-11-01
updated: 2026-11-02
tags: [Vue, TypeScript, Vite, Axios, Pinia, HTTP]
description: "理解 Vite 工程入口、模块调用、异步请求、Axios、Network 调试与 Pinia 状态管理。"
pinned: false
draft: false
---

## 学习目标与运行方式

第一天学习了 Vue 页面中的响应式数据、模板绑定、事件处理和列表渲染；第二天学习了 TypeScript、计算属性、侦听器和 Element Plus；第三天学习了组件化、Props、Emit、组件 `v-model`、插槽和生命周期。

第四天开始把这些知识连接成一条完整的业务处理链：

**页面操作 → 页面事件函数 → API 接口函数 → HTTP 请求 → 服务端响应 → 页面状态更新 → 模板重新渲染。**

在企业项目中，阅读一个功能不能只停留在页面组件。用户点击“查询”之后，真正的请求可能定义在 `src/api/` 中；请求使用的地址可能来自环境变量；开发环境还可能经过 Vite 代理；请求返回后，数据可能先经过响应拦截器或业务码判断，最后才交给页面。

本日学习结束后，应当能够：

- 从 `index.html`、`main.ts` 和 `App.vue` 找到 Vue 应用入口。
- 看懂 `package.json` 中的依赖和启动命令，知道 `vite.config.ts` 负责什么。
- 使用 `export`、`import`、`export default` 和 `import type` 完成跨文件调用。
- 理解 Promise、`async`、`await`、`try`、`catch` 和 `finally` 的执行关系。
- 使用 Axios 发起 GET、POST 请求，区分 Axios 响应对象、响应体和业务数据。
- 为接口请求声明 TypeScript 类型，并理解泛型不会自动验证服务器返回的数据。
- 处理 loading、错误提示、空数据和重复点击等常见请求状态。
- 使用浏览器开发者工具的 Network、Console 和 Sources 追踪请求。
- 使用 Pinia 管理多个组件或页面需要共享的状态。
- 初步看懂 Vite 代理、环境变量、请求拦截器和 Mock 的工作方式。

### 学习时间安排

| 学习内容 | 建议时间 | 学习重点 |
|---|---:|---|
| Vite 工程结构与模块系统 | 20 分钟 | 入口文件、目录职责、import/export |
| Promise 与异步流程 | 20 分钟 | async/await、错误传播、finally |
| Axios 请求与接口封装 | 35 分钟 | GET/POST、响应结构、请求状态 |
| 浏览器 Network 调试 | 20 分钟 | 请求地址、参数、状态码、响应体 |
| Pinia 状态管理 | 15 分钟 | Store、State、Getter、Action、共享状态 |
| 综合验收 | 10 分钟 | 从页面操作追踪到响应和状态更新 |
| **合计** | **120 分钟** | |

代理、环境变量、路径别名、拦截器和 Mock 会在主线之后作为拓展内容。它们在真实项目中很常见，但第一次学习时不需要一次性搭建完整的企业工程基础设施。

### 运行前提

继续使用第一天创建的 Vue 3 + TypeScript + Vite 工程，不需要重新创建项目。

- 默认页面入口仍然是 `src/main.ts`。
- 根组件仍然是 `src/App.vue`。
- 业务页面可以放在 `src/views/`，接口函数可以放在 `src/api/`，类型声明可以放在 `src/types/`，共享状态可以放在 `src/stores/`。
- 这些目录名称是团队常见的组织约定，不是 Vue 自动寻找业务文件的特殊目录。
- 主线示例优先使用原生 HTML 控件，避免为了学习 Axios 而依赖额外的 Element Plus 组件。
- Axios 和 Pinia 如果尚未安装，按对应章节的命令安装；已经安装则不必重复安装。

在项目根目录打开终端。后续命令中的 `npm` 是包管理器命令，必须在包含 `package.json` 的项目目录中执行。

安装 Axios：

```bash
npm install axios
```

安装 Pinia：

```bash
npm install pinia
```

启动项目：

```bash
npm run dev
```

如果项目使用 Windows PowerShell，且当前环境的脚本执行策略导致 `npm` 命令无法运行，可以沿用此前项目中已经验证可用的 `npm.cmd` 命令形式。

**示例使用规则：** 每个完整程序都会标明文件路径。同一个程序中的多个文件需要一起使用；切换到下一个独立示例时，再按照新示例替换对应文件。不要把不同示例中的多个 `App.vue` 或 `main.ts` 片段合并到同一个文件。

## Vite 工程结构与应用入口

### 一个 Vue 页面是怎样运行起来的

开发一个 Vue 页面时，通常先看到的是 `App.vue`，但浏览器并不是直接读取 `.vue` 文件。

在 Vite 项目中，浏览器首先读取项目根目录下的 `index.html`。这个 HTML 文件会通过 `<script type="module">` 加载入口模块，常见写法是：

```html
<script type="module" src="/src/main.ts"></script>
```

浏览器随后加载 `main.ts`。`main.ts` 创建 Vue 应用、注册需要的插件和全局组件，最后把根组件挂载到 HTML 中指定的 DOM 元素。

典型的启动链路：

```text
index.html
    ↓ 加载
src/main.ts
    ↓ 创建并挂载
src/App.vue
    ↓ 组织页面内容
页面组件 / 子组件
```

如果项目使用 Vue Router，`App.vue` 可能只负责放置 `RouterView`，真正的业务页面由路由配置决定：

```text
index.html
    ↓
src/main.ts
    ↓
src/App.vue
    ↓
RouterView
    ↓
src/router/index.ts
    ↓
src/views/AccountList.vue
    ↓
src/components/AccountForm.vue
```

这里的箭头表示文件导入、应用初始化或组件渲染关系，不代表 Vue 会自动扫描这些目录。实际入口和文件名称必须以项目代码为准。

### main.ts：创建应用并注册插件

典型的 Vue 入口文件如下：

```ts
import { createApp } from 'vue';
import App from './App.vue';

const app = createApp(App);

app.mount('#app');
```

逐行理解：

- `createApp` 是 Vue 提供的应用创建函数。
- `App` 是导入的根组件定义。
- `createApp(App)` 创建 Vue 应用实例。
- `app.mount('#app')` 把应用挂载到页面中 `id="app"` 的 DOM 元素上。

如果项目使用 Element Plus、Pinia 或 Vue Router，还需要在挂载前注册：

```ts
app.use(ElementPlus);
app.use(createPinia());
app.use(router);
app.mount('#app');
```

`app.use()` 用于安装插件。插件通常会向当前 Vue 应用提供组件、功能或全局能力。注册顺序和具体配置以插件文档及项目要求为准。

**为什么必须先注册，再 mount？** 因为组件在应用运行时需要使用这些插件提供的能力。若应用已经挂载，再试图补注册，通常不是项目期望的初始化方式。

### package.json：项目依赖和命令的清单

`package.json` 位于项目根目录，主要记录项目名称、依赖包、版本范围以及可执行脚本。

例如：

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc -b && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "vue": "^3.5.0",
    "axios": "^1.7.0",
    "pinia": "^2.2.0"
  },
  "devDependencies": {
    "vite": "^6.0.0",
    "typescript": "~5.6.0",
    "vue-tsc": "^2.1.0"
  }
}
```

这是一份结构示意，不要求把它覆盖到现有项目。实际版本应以自己的 `package.json` 为准。

#### dependencies 与 devDependencies

- `dependencies`：项目运行时需要的依赖，例如 Vue、Axios、Pinia。
- `devDependencies`：主要用于开发、类型检查、构建和测试的工具，例如 Vite、TypeScript、Vue 类型检查工具。

这是一种用途上的区分，不表示 devDependencies 中的包在开发期间不会运行。Vite 和 TypeScript 都会在开发或构建过程中执行，只是最终浏览器运行的业务代码通常不需要把它们作为运行时库加载。

#### scripts：命令名称与实际执行内容

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc -b && vite build",
    "preview": "vite preview"
  }
}
```

- `npm run dev`：执行 `scripts.dev` 对应的命令，启动开发服务器。
- `npm run build`：执行 `scripts.build` 对应的命令，生成生产构建产物。
- `npm run preview`：执行 `scripts.preview` 对应的命令，预览已经构建好的产物。

这里的 `&&` 表示前一个命令成功后才继续执行后一个命令。因此，`vue-tsc -b && vite build` 会先进行 TypeScript/Vue 类型检查，再执行 Vite 构建；类型检查失败时，后面的 `vite build` 不会继续执行。

**Vite 本身主要负责开发服务器和构建转译，不代表它一定会替你完成完整的 TypeScript 类型检查。** 是否检查类型，要看项目的构建脚本有没有配置 `vue-tsc` 或其他检查工具。

#### node_modules 与 package-lock.json

- `node_modules/`：安装依赖后生成的目录，保存项目实际使用的包文件。
- `package-lock.json`：记录依赖树和具体解析版本，帮助不同环境安装相对一致的依赖。

通常不要手动修改 `node_modules` 中的第三方包文件。修改 `package.json` 或执行安装命令后，包管理器会负责更新依赖。

### vite.config.ts：Vite 的工程配置

`vite.config.ts` 是 Vite 的配置文件，常见配置包括：

- 使用哪些插件，例如 Vue 插件。
- 开发服务器使用哪个端口。
- 开发服务器监听哪个地址。
- 是否配置代理，把某些请求转发给后端。
- 是否配置路径别名。
- 构建时如何处理资源。

最小配置示例：

```ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
    plugins: [vue()],
    server: {
        port: 5173
    }
});
```

`defineConfig()` 接收 Vite 配置对象并提供类型提示；`plugins` 是插件数组；`vue()` 返回 Vue 插件；`server.port` 设置开发服务器的首选端口。

如果端口已经被占用，Vite 是否自动切换端口取决于 `strictPort` 等配置。不要看到终端提示就假定页面一定运行在 5173，应该以终端实际输出的 Local 地址为准。

### 常见目录分别负责什么

| 路径 | 常见职责 | 阅读时关注 |
|---|---|---|
| `src/main.ts` | 应用入口 | 注册了哪些插件、挂载哪个根组件 |
| `src/App.vue` | 根组件 | 页面整体结构、路由出口 |
| `src/views/` | 页面级组件 | 查询、提交、页面业务入口 |
| `src/components/` | 可复用组件 | Props、Emit、插槽 |
| `src/api/` | 接口函数 | 请求地址、参数、响应结构 |
| `src/types/` | 类型声明 | 字段类型是否符合接口协议 |
| `src/stores/` | 共享状态 | 状态来源、修改入口 |
| `src/utils/` | 通用工具 | 格式化、转换、校验等逻辑 |
| `public/` | 原样提供的静态资源 | JSON、图标等静态文件 |

目录只是团队组织代码的方式。一个项目可以把 API 函数放在 `services/`，也可以把类型放在 `api/`；不要因为目录名称不同，就认为项目结构错误。

### 从页面入口追踪到业务文件

在陌生项目中，可以按照以下顺序查找：

1. 先确认当前浏览器地址和 Vite 实际启动地址。
2. 查看 `index.html`，确认它加载哪个入口文件。
3. 打开 `main.ts`，确认根组件、路由和全局插件。
4. 打开 `App.vue`，确认页面内容直接写在根组件中，还是通过 `RouterView` 展示路由页面。
5. 如果使用路由，查找当前 URL 对应的 `path`，再找到该路由的 `component`。
6. 进入页面组件，定位按钮的 `@click`、表单的 `@submit` 或其他事件入口。
7. 跟进事件处理函数，查看它调用了哪个 API 函数。
8. 进入 API 模块，检查 HTTP 方法、URL、请求参数和响应处理。

这条阅读路径可以避免只在 `views/` 目录中凭文件名猜测业务入口。

### 完整程序：确认应用入口关系

下面是一个最小入口实验。它不依赖 Element Plus、Pinia 或 Router，适合单独确认 Vite 是否正在运行当前工程。

文件一：`index.html`（项目根目录）

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vue 入口实验</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

文件二：`src/main.ts`

```ts
import { createApp } from 'vue';
import App from './App.vue';

// 使用 App.vue 创建 Vue 应用，并挂载到 index.html 的 #app。
createApp(App).mount('#app');
```

文件三：`src/App.vue`

```vue
<script setup lang="ts">
// 这是根组件自己的普通常量。
const pageName = '入口阅读实验';
</script>

<template>
    <h2>{{ pageName }}</h2>
    <p>当前页面确实由这个 App.vue 渲染。</p>
</template>
```

运行后看到“入口阅读实验”，说明当前浏览器页面加载了这个工程的 `index.html`，它进一步加载 `main.ts`，再由 `main.ts` 挂载 `App.vue`。

如果修改页面后浏览器毫无变化，先确认终端所在目录、浏览器访问地址、启动脚本以及真正的根组件，不要立即怀疑 Vue 响应式系统。

**注意：** 这个入口实验没有注册 Element Plus。若后续示例使用 `el-button`、`el-input` 等组件，需要恢复第一天已经配置好的 `main.ts`，或者在当前入口中重新注册 Element Plus。不要把最小入口直接覆盖到一个已经配置了多个插件的真实项目中。

## 模块系统：一个文件怎样调用另一个文件

### 为什么要拆分模块

如果把所有工具函数、接口请求、类型声明和页面状态都写在 `App.vue` 中，文件会越来越长，也很难区分不同职责。

JavaScript 和 TypeScript 使用模块系统（Module System）组织文件。一个文件可以把变量、函数、类型或类导出，其他文件再导入并使用。

在 Vue 项目中，常见的拆分方式是：

- 页面组件负责界面和页面交互。
- API 模块负责请求接口。
- 工具模块负责通用处理逻辑。
- 类型模块负责描述数据结构。
- Store 模块负责共享状态。

**模块拆分并不会自动让数据发生变化。** 导入一个函数，只是让当前文件获得调用它的能力；函数是否执行、返回值是否被使用、页面状态是否更新，仍然由具体代码决定。

### 具名导出与具名导入

使用 `export` 导出一个具名成员：

```ts
// 文件：src/utils/normalizeName.ts
export function normalizeName(value: string): string {
    return value.trim();
}
```

在其他文件中使用花括号导入：

```ts
import { normalizeName } from './utils/normalizeName';

console.log(normalizeName(' 张三 ')); // 张三
```

这里：

- `export` 表示允许其他模块导入这个函数。
- `normalizeName` 是导出的成员名称。
- `import { normalizeName }` 必须与具名导出的名称对应。
- `./utils/normalizeName` 是从当前文件所在目录出发的相对路径。

调用 `normalizeName()` 时才执行函数体。`import` 的作用是建立模块引用，不是导入时就自动执行每一个普通函数。

一个文件可以导出多个具名成员：

```ts
export function normalizeName(value: string): string {
    return value.trim();
}

export function isEmpty(value: string): boolean {
    return value.trim().length === 0;
}
```

导入时可以一起写：

```ts
import { normalizeName, isEmpty } from './utils/name';
```

也可以只导入需要的成员：

```ts
import { normalizeName } from './utils/name';
```

### 默认导出与默认导入

一个模块还可以使用 `export default` 导出一个默认成员：

```ts
// 文件：src/utils/defaultName.ts
export default function normalize(value: string): string {
    return value.trim();
}
```

默认导入不需要花括号：

```ts
import cleanName from './utils/defaultName';
```

这里的 `cleanName` 是导入方自己选择的本地名称，不要求与函数声明名 `normalize` 一样。

一个模块最多只能有一个默认导出，但可以同时存在多个具名导出：

```ts
export const MAX_LENGTH = 20;

export function normalize(value: string): string {
    return value.trim();
}

export default function formatName(value: string): string {
    return value.trim().toUpperCase();
}
```

可以这样导入：

```ts
import formatName, { MAX_LENGTH, normalize } from './nameTools';
```

阅读企业项目时，如果看到：

```ts
import http from './http';
```

应该到 `./http` 对应的模块中确认默认导出了什么。不要只搜索文件里有没有同名的 `http` 变量，就判断导入关系。

### import type：只导入类型

TypeScript 中有些导入只用于类型检查，不需要在 JavaScript 运行时保留。

```ts
import type { Account } from '../types/account';
import { getAccounts } from '../api/accounts';
```

- `Account` 用于标注账户数据结构，是类型。
- `getAccounts` 是实际运行时函数，需要被调用。

`import type` 明确表示只导入类型。编译时类型导入会被移除，不会在浏览器运行时产生一个名为 `Account` 的 JavaScript 对象。

类型也可以从 API 文件导出，不一定必须放在 `types/` 目录。目录如何组织是团队约定，关键是要明确区分类型声明与运行时值。

### 相对路径：./ 与 ../

模块导入路径中的：

- `./` 表示当前文件所在目录。
- `../` 表示当前文件所在目录的上一级。
- `../../` 表示向上两级。

例如，当前文件是 `src/views/AccountList.vue`：

```ts
import { getAccounts } from '../api/accounts';
import type { Account } from '../types/account';
```

从 `views/` 返回到 `src/`，再进入 `api/` 或 `types/`。

如果当前文件是 `src/App.vue`，则导入 API 模块时路径会变成：

```ts
import { getAccounts } from './api/accounts';
```

相对路径必须根据**当前导入文件所在位置**计算，而不是根据项目根目录计算。

### 路径别名 @ 不是 JavaScript 原生语法

很多 Vue 项目使用：

```ts
import { getAccounts } from '@/api/accounts';
```

这里的 `@` 通常被配置为 `src/` 目录的别名。

它不是 JavaScript 或 TypeScript 自带的路径符号。只有当 Vite、TypeScript 等相关工具都配置了对应映射时，才能正确解析。

通常需要两处配置：

- Vite 的 `resolve.alias`：负责开发和构建时的模块路径解析。
- TypeScript 的 `compilerOptions.paths`：负责类型检查和编辑器解析。

只配置一边，可能出现编辑器能识别但运行失败，或者浏览器能运行但编辑器报找不到模块的情况。

本课程完整主线示例优先使用相对路径，让文件调用关系更加直观。路径别名放在后面的拓展内容中说明。

### 完整程序：从页面调用工具模块

先使用一个普通同步函数理解跨文件调用。文件一：`src/utils/normalizeName.ts`。

```ts
// 导出一个清理姓名的工具函数。
export function normalizeName(value: string): string {
    return value.trim();
}
```

文件二：`src/App.vue`。

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { normalizeName } from './utils/normalizeName';

const input = ref(' 张三 ');
const output = ref('');

function process(): void {
    // 把输入值传给工具函数，并将返回值写入页面使用的状态。
    output.value = normalizeName(input.value);
}
</script>

<template>
    <input v-model="input" />
    <button @click="process">清理姓名</button>
    <p>处理结果：{{ output }}</p>
</template>
```

运行后，输入框初始值两边有空格。点击“清理姓名”，页面调用 `process()`；`process()` 把 `input.value` 传给工具函数；工具函数返回去掉首尾空白的字符串；页面再把返回值赋给 `output.value`。

工具函数并不知道 `output` 是哪个 ref，也不会自动更新模板。**跨文件调用仍然要明确参数、返回值和赋值位置。** 后面把普通工具函数换成异步 API 函数时，调用链并没有变，只是需要等待请求结果并处理失败分支。

> [!EXERCISE] 导入成功却不显示结果
>
> `process()` 中只写 `normalizeName(input.value)`，没有后续赋值，为什么处理结果段落不变化？
>
> 【答案】
>
> 工具函数确实执行并返回了结果，但返回值被丢弃；模板读取的是 `output`，而 `output` 没有发生变化。应写成 `output.value = normalizeName(input.value)`。
>
> **解析：** 函数执行成功不代表模板依赖的响应式状态已经改变。这与第一天学习列表筛选时调用 `filter()` 却没有接收返回数组，是同一种数据流遗漏。


## Promise 与异步流程

### 为什么接口请求需要异步处理

读取本地变量通常很快就能得到结果：

```ts
const name = '储蓄账户';
console.log(name);
```

但网络请求不一样。浏览器需要把请求发送出去，等待服务器处理，再接收响应。请求耗时取决于网络、服务器处理和其他环境因素，代码不能假定结果会立刻返回。

如果浏览器必须等网络请求结束后才能处理其他事情，页面就会出现明显卡顿。因此 JavaScript 使用异步机制处理这类操作。

**异步（Asynchronous）**表示发起一项操作后，当前执行流程不必一直等待它完成，可以先继续处理其他任务；等异步操作有结果后，再执行与结果有关的后续代码。

在 Vue 项目中，接口请求、定时器、文件读取等操作都可能涉及异步处理。

### Promise：对未来结果的封装

Promise 是 JavaScript 提供的一种异步结果对象。它表示某项操作将来可能成功，也可能失败。

Promise 有三种状态：

| 状态 | 英文名称 | 含义 |
|---|---|---|
| 等待中 | `pending` | 操作尚未完成 |
| 已兑现 / 成功 | `fulfilled` | 操作成功，并得到成功结果 |
| 已拒绝 / 失败 | `rejected` | 操作失败，并得到失败原因 |

Promise 从 `pending` 变为 `fulfilled` 或 `rejected` 后，状态就确定下来，不会再从成功改为失败，也不会从失败改为成功。

可以用 `new Promise()` 创建一个 Promise：

```ts
const task = new Promise<string>((resolve, reject) => {
    resolve('取得账户');
});
```

这里：

- `new Promise<string>()` 创建一个成功结果类型为 `string` 的 Promise。
- 参数是一个执行器函数（executor），创建 Promise 时会立即执行。
- `resolve(value)` 用于把 Promise 标记为成功，并提供成功结果。
- `reject(reason)` 用于把 Promise 标记为失败，并提供失败原因。

本例调用 `resolve('取得账户')`，所以 Promise 成功结果是字符串“取得账户”。`reject` 没有使用，说明本例没有模拟失败分支。

**不要把 `resolve()` 当作普通函数的 `return`。** `return` 是函数返回值；`resolve()` 是把 Promise 的状态确定为成功。

### Promise 的执行器会立即执行，结果回调会异步执行

下面的代码可以观察到两种执行时机：

```ts
console.log('A');

const task = new Promise<string>((resolve) => {
    console.log('B：执行器立即运行');
    resolve('C：Promise 已成功');
});

task.then((value) => {
    console.log(value);
});

console.log('D');
```

输出顺序：

```text
A
B：执行器立即运行
D
C：Promise 已成功
```

原因是：

- `new Promise()` 的执行器在创建 Promise 时同步执行，所以先打印 B。
- `resolve()` 确定 Promise 的成功结果。
- `.then()` 中的回调会进入 Promise 微任务队列，不会在当前同步代码中间立即执行。
- 当前同步代码执行完毕后，才会执行成功回调。

真实 HTTP 请求通常由 Axios 或浏览器网络 API 创建 Promise，不需要开发者自己用 `new Promise()` 把 Axios 再包一层。

### async：声明一个异步函数

在函数前加上 `async`，这个函数就成为异步函数：

```ts
async function getName(): Promise<string> {
    return '张三';
}
```

这里的返回类型 `Promise<string>` 表示函数调用后得到一个 Promise，Promise 成功时提供字符串。

即使函数体中直接 `return '张三'`，调用者取得的也不是普通字符串，而是一个成功结果为字符串的 Promise：

```ts
const result = getName();

console.log(result); // Promise
```

可以把它理解为：`async` 函数会把普通返回值包装成已成功的 Promise；如果函数内部抛出异常，则返回一个已拒绝的 Promise。

因此，下面的类型是错误的：

```ts
const name: string = getName();
```

`getName()` 返回 `Promise<string>`，不能直接赋给 `string`。需要等待 Promise 成功后再取得其中的字符串。

### await：等待 Promise 的结果

`await` 用于等待一个 Promise 完成：

```ts
async function loadName(): Promise<void> {
    const name = await getName();
    console.log(name);
}
```

这里：

- `getName()` 返回 `Promise<string>`。
- `await` 等待 Promise 完成。
- 成功时，`name` 取得 Promise 提供的字符串。
- 后续代码在结果可用后继续执行。

`await` 暂停的是当前 `async` 函数后续语句的执行，不会冻结整个浏览器页面。等待期间，浏览器仍然可以处理其他事件和任务。

例如，用户点击查询按钮后，函数开始等待接口响应；在等待期间，页面仍然可以绘制 loading 状态、处理其他控件事件。

**调用异步函数和取得异步结果是两件事。** 调用函数得到 Promise；在异步函数中通过 `await` 等待，才取得成功结果。

### await 遇到失败 Promise 会怎样

如果等待的 Promise 进入 `rejected` 状态，`await` 会把失败原因作为异常抛出。可以使用 `try...catch` 处理：

```ts
async function load(): Promise<void> {
    try {
        const name = await getName();
        console.log(name);
    } catch (error) {
        console.log('读取失败');
    }
}
```

这与同步代码中的异常处理思路一致：

- `try` 包围需要执行的代码。
- 代码正常完成时，继续执行 `try` 中后续语句。
- 发生异常时，跳过 `try` 中剩余语句，进入匹配的 `catch`。
- `catch` 负责处理异常。

TypeScript 中 `catch` 捕获的 `error` 默认应按 `unknown` 对待，因为抛出的值不一定是 `Error` 对象。需要读取 `message` 时，先判断类型：

```ts
if (error instanceof Error) {
    console.log(error.message);
} else {
    console.log('发生未知错误');
}
```

`instanceof Error` 是运行时类型判断。通过判断后，TypeScript 才允许安全地读取 `Error` 的 `message` 属性。

### finally：无论成功还是失败都执行的收尾

请求时经常需要显示 loading。无论请求成功还是失败，操作结束后都应该恢复 loading。

如果只在成功分支写 `loading.value = false`，请求失败后这行代码不会执行，按钮就可能一直处于禁用状态。

`finally` 用于编写无论成功还是失败都需要执行的收尾逻辑：

```ts
async function load(): Promise<void> {
    loading.value = true;

    try {
        const result = await getAccounts();
        rows.value = result;
    } catch (error) {
        errorMessage.value =
            error instanceof Error ? error.message : '请求失败';
    } finally {
        loading.value = false;
    }
}
```

执行过程：

```text
loading = true
    ↓
执行 try 中的请求
    ├─ 成功：保存结果
    └─ 失败：进入 catch，保存错误
    ↓
finally 一定执行
    ↓
loading = false
```

`finally` 不代表请求最终成功，只代表执行到这里时，前面的操作已经进入收尾阶段。

**不要在 `finally` 中无条件 `return`。** `finally` 中的返回值可能覆盖原本的返回结果，甚至影响异常继续传播。

### 完整程序：async/await、成功、失败和 finally

本例先使用 `setTimeout()` 模拟异步操作，不产生 HTTP 请求。目的是先看清异步控制流，再进入 Axios。

文件：`src/App.vue`。

```vue
<script setup lang="ts">
import { ref } from 'vue';

const message = ref('等待操作');
const loading = ref(false);

// 模拟一个耗时操作：500 毫秒后成功或失败。
function simulateRequest(fail: boolean): Promise<string> {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (fail) {
                reject(new Error('模拟请求失败'));
            } else {
                resolve('模拟请求成功');
            }
        }, 500);
    });
}

async function run(fail: boolean): Promise<void> {
    // 防止请求尚未结束时再次进入同一个操作。
    if (loading.value) {
        return;
    }

    loading.value = true;
    message.value = '正在处理……';

    try {
        // 等待模拟请求完成，成功时取得字符串。
        const result = await simulateRequest(fail);
        message.value = result;
    } catch (error) {
        // catch 中的 error 按 unknown 处理，先判断再读取 message。
        message.value =
            error instanceof Error ? error.message : '发生未知错误';
    } finally {
        // 无论成功还是失败，都恢复按钮状态。
        loading.value = false;
    }
}
</script>

<template>
    <h2>异步流程实验</h2>

    <button :disabled="loading" @click="run(false)">
        模拟成功
    </button>

    <button :disabled="loading" @click="run(true)">
        模拟失败
    </button>

    <p>{{ message }}</p>
    <p>当前是否处理中：{{ loading ? '是' : '否' }}</p>
</template>
```

运行后分别点击两个按钮：

- 点击“模拟成功”，约 500 毫秒后显示“模拟请求成功”。
- 点击“模拟失败”，约 500 毫秒后显示“模拟请求失败”。
- 无论哪种结果，按钮最终都会恢复可点击状态。

`setTimeout(callback, 500)` 表示约 500 毫秒后执行回调；`new Promise()` 把这个延迟操作包装成 Promise。这里的模拟只用于理解异步流程，浏览器 Network 中不会出现 HTTP 请求。

### 为什么既要禁用按钮，又要在函数开头判断 loading

模板中：

```vue
<button :disabled="loading" @click="run(false)">
    模拟成功
</button>
```

这是界面层面的保护：请求进行时，按钮显示为禁用状态，用户不能通过这个按钮再次触发操作。

函数开头：

```ts
if (loading.value) {
    return;
}
```

这是逻辑层面的保护：即使同一个函数从其他入口被调用，也能在函数内部阻止重复进入。

只在一个按钮上设置 `disabled`，不代表其他入口也受到保护。真实项目中，同一个查询函数可能被按钮、回车事件、页面初始化或其他组件调用，因此函数内部的 guard 更可靠。

但前端的 `loading` 判断只用于减少重复触发，不能替代后端的幂等控制。对于转账、支付、订单提交等重要写入操作，最终仍需要后端根据业务协议防止重复处理。

### Promise、async/await 与 try/catch 的关系

| 语法 | 作用 | 常见使用场景 |
|---|---|---|
| `Promise<T>` | 表示未来的成功值或失败结果 | HTTP 请求、异步函数返回值 |
| `async` | 声明异步函数，函数总返回 Promise | 页面查询、保存函数 |
| `await` | 等待 Promise 成功结果；失败时抛出异常 | 取得请求响应 |
| `try` | 包围可能发生异常的代码 | 请求与数据处理 |
| `catch` | 处理异常 | 错误提示、日志记录 |
| `finally` | 无论成功失败都执行 | 恢复 loading、释放临时状态 |

### 一个容易忽略的业务问题：保存成功不等于刷新成功

例如，用户点击“新增账户”：

1. 页面调用新增接口。
2. 新增接口成功，后端已经保存数据。
3. 页面继续调用列表查询接口刷新表格。
4. 列表查询接口失败。

如果把两个操作放在同一个 `try` 中，第二个请求失败时会进入 `catch`。但这不意味着第一步新增失败。

```ts
let saved = false;

try {
    await createAccount(payload);
    saved = true;

    rows.value = await getAccounts();
    message.value = '新增成功，列表已刷新';
} catch (error) {
    if (saved) {
        message.value = '新增已完成，但列表刷新失败';
    } else {
        message.value = '新增失败';
    }
} finally {
    loading.value = false;
}
```

这里用 `saved` 记录新增接口是否已经成功。它避免把“保存成功后刷新失败”误报为“新增失败”，进而诱导用户再次提交。

这是银行、支付、订单等业务页面非常重要的处理思路：**必须区分业务操作是否完成，以及后续页面刷新是否完成。**

> [!EXERCISE] 失败后按钮一直禁用
>
> 如果只在 `await` 后设置 `loading.value = false`，而没有使用 `finally`，请求失败时会发生什么？
>
> 【答案】
>
> `await` 遇到失败 Promise 会抛出异常，代码跳过成功路径中的 `loading.value = false`，进入 `catch`。如果没有在其他位置恢复 loading，按钮就可能一直禁用。
>
> **解析：** 成功和失败都会执行 `finally`，所以恢复 loading 这类公共收尾操作应放在 `finally` 中。

## Axios：发送真正的 HTTP 请求

### HTTP 请求的基本组成

浏览器与服务器之间通过 HTTP（Hypertext Transfer Protocol，超文本传输协议）交换请求和响应。

一次常见的 HTTP 请求包含：

- **请求方法（Method）：** 表示请求操作类型，例如 GET、POST、PUT、DELETE。
- **请求地址（URL）：** 表示请求发送到哪里。
- **查询参数（Query Parameters）：** 常放在 URL 的问号后面，用于筛选、分页等。
- **请求头（Headers）：** 携带内容类型、认证信息等元数据。
- **请求体（Request Body）：** 在 POST、PUT 等请求中携带需要提交的数据。

服务器处理请求后返回 HTTP 响应。响应中包含状态码、响应头和响应体。

常见方法的用途：

| 方法 | 常见用途 | 典型数据位置 |
|---|---|---|
| GET | 查询资源 | URL 查询参数 |
| POST | 新增资源或提交操作 | 请求体 |
| PUT | 整体更新资源 | 请求体 |
| PATCH | 局部更新资源 | 请求体 |
| DELETE | 删除资源 | URL 或请求体，按接口约定 |

这些是常见设计习惯，不是对所有银行接口的强制规定。真实系统中，具体请求方法、字段位置、交易码和报文格式必须以接口文档为准。

### Axios 是什么

Axios 是一个基于 Promise 的 HTTP 客户端库。它帮助前端发送 HTTP 请求、处理响应、配置超时和拦截器。

使用 Axios 前，需要先安装：

```bash
npm install axios
```

然后在 TypeScript 文件中导入：

```ts
import axios from 'axios';
```

Axios 常见调用方式：

```ts
const response = await axios.get('/accounts.json');
```

这里 `axios.get()` 返回 Promise，`await` 等待请求完成，成功后得到 Axios 响应对象。

### GET：查询参数放在哪里

Axios 的 GET 请求可以通过第二个参数中的 `params` 传递查询参数：

```ts
const response = await axios.get('/api/accounts', {
    params: {
        name: '张三',
        page: 1,
        pageSize: 10
    }
});
```

Axios 会把 `params` 序列化到 URL 查询字符串中，最终请求地址类似：

```text
/api/accounts?name=张三&page=1&pageSize=10
```

这里：

- 第一个参数 `'/api/accounts'` 是请求路径。
- 第二个参数是 Axios 请求配置对象。
- `params` 是配置对象中的查询参数字段。

不要把 GET 的查询参数误认为请求体。打开 Network 后，可以在 Request URL 或 Query String Parameters 中查看它们。

### POST：提交数据通常放在请求体

POST 请求常用于新增或提交业务操作：

```ts
const response = await axios.post('/api/accounts', {
    name: '张三',
    active: true
});
```

`axios.post(url, data, config)` 的第二个参数通常是请求体数据，第三个参数才是请求配置。

因此：

```ts
axios.post('/api/accounts', {
    name: '张三'
});
```

与：

```ts
axios.post('/api/accounts', {
    params: {
        name: '张三'
    }
});
```

并不等价。第二种会把一个名为 `params` 的对象作为请求体字段发送，不会自动变成 URL 查询参数。

如果接口要求特定报文格式、表单格式或请求头，必须按后端接口定义设置，不能只根据 GET/POST 的习惯猜测。

### Axios 响应对象与 response.data

Axios 请求成功后返回的是一个响应对象（AxiosResponse），不一定就是业务数据本身。

常用字段：

| 字段 | 含义 |
|---|---|
| `response.data` | 服务器返回的响应体 |
| `response.status` | HTTP 状态码，例如 200 |
| `response.statusText` | HTTP 状态文本 |
| `response.headers` | 响应头 |
| `response.config` | 本次请求使用的配置 |
| `response.request` | 底层请求对象 |

最常见的是 `response.data`：

```ts
const response = await axios.get<Account[]>('/accounts.json');

const rows = response.data;
```

这里 `response` 是 Axios 响应对象，`response.data` 才是服务器响应体。如果服务器返回的是账户数组，那么 `rows` 就是账户数组。

**不要把 Axios 响应对象和服务器响应体当成同一个对象。**

### 为什么有时会出现 response.data.data

有些后端会把业务数据再包一层统一响应结构：

```json
{
    "code": 0,
    "message": "成功",
    "data": [
        {
            "id": 101,
            "name": "储蓄账户",
            "active": true
        }
    ]
}
```

Axios 收到后：

- `response`：Axios 响应对象。
- `response.data`：整个 JSON 响应体。
- `response.data.data`：业务数据数组。

所以是否需要读取 `.data.data`，取决于后端实际返回结构，而不是 Axios 固定要求读取两次 `data`。

另一个后端也可能直接返回数组：

```json
[
    {
        "id": 101,
        "name": "储蓄账户",
        "active": true
    }
]
```

这时 `response.data` 已经是数组，再读 `response.data.data` 就是错误的。

**判断数据结构最可靠的方式是查看 Network 中的 Response，而不是根据变量名或经验猜测。**

### TypeScript 泛型：描述响应体的类型

Axios 方法支持泛型：

```ts
const response = await axios.get<Account[]>('/accounts.json');
```

`Account[]` 表示这次请求预期返回账户数组。

可以定义账户类型：

```ts
interface Account {
    id: number;
    name: string;
    active: boolean;
}
```

再定义统一响应结构：

```ts
interface ApiResult<T> {
    code: number;
    message: string;
    data: T;
}
```

`T` 是泛型类型参数，用来表示业务数据的具体类型：

- `ApiResult<Account[]>`：`data` 是账户数组。
- `ApiResult<Account>`：`data` 是单个账户。
- `ApiResult<number>`：`data` 是数字。

例如：

```ts
const response =
    await axios.get<ApiResult<Account[]>>('/api/accounts');

const accounts = response.data.data;
```

这里 Axios 的响应体类型被声明为 `ApiResult<Account[]>`，因此 `response.data` 是包裹对象，`response.data.data` 是账户数组。

### 泛型不会自动验证服务器数据

这是一个非常重要的区别。

```ts
axios.get<Account[]>('/accounts.json');
```

这里的 `Account[]` 是 TypeScript 对响应体的静态类型声明，帮助编辑器提示字段、检查代码中的类型使用。

它不会在浏览器运行时自动检查服务器是否真的返回了数组，也不会检查每个对象是否真的有 `id`、`name` 和 `active`。

如果服务器实际返回：

```json
{
    "data": []
}
```

但代码声明它是 `Account[]`，TypeScript 仍可能允许你按数组方式编写代码。运行时真实数据不会因为泛型声明而改变。

因此要区分：

- **静态类型声明：** 告诉 TypeScript 代码预期的数据结构。
- **运行时数据验证：** 真正检查服务器返回的内容是否符合结构。

对于重要接口，应该根据业务需要检查响应字段，或使用运行时校验方案。不要把泛型当作后端数据校验器。

### HTTP 状态码与业务状态码不是一回事

HTTP 状态码表示 HTTP 这一层请求处理结果，例如：

- `200`：请求在 HTTP 层成功。
- `400`：请求格式或参数有问题。
- `401`：通常表示未认证。
- `403`：通常表示无权限。
- `404`：请求资源不存在。
- `500`：服务器内部错误。

但有些系统即使业务失败，也会返回 HTTP 200，再通过响应体中的 `code` 表示业务结果：

```json
{
    "code": 1001,
    "message": "无查询权限",
    "data": null
}
```

因此要分两层判断：

1. HTTP 请求是否成功到达并得到成功响应。
2. 响应体中的业务码是否表示业务处理成功。

HTTP 200 不代表业务一定成功；业务码为 0 也不是所有系统的通用约定，必须看当前接口协议。

### 完整程序：读取包裹响应并检查业务码

本例使用本机 Vite 提供的静态 JSON 文件，模拟后端返回统一业务响应结构。它不需要外部服务器、账户或密钥。

文件一：`public/account-result.json`。

```json
{
    "code": 0,
    "message": "成功",
    "data": [
        {
            "id": 101,
            "name": "储蓄账户",
            "active": true
        },
        {
            "id": 102,
            "name": "工资账户",
            "active": false
        }
    ]
}
```

文件二：`src/api/wrappedAccounts.ts`。

```ts
import axios from 'axios';

// 账户业务数据类型。
export interface Account {
    id: number;
    name: string;
    active: boolean;
}

// 统一业务响应结构，T 表示 data 字段的类型。
interface ApiResult<T> {
    code: number;
    message: string;
    data: T;
}

export async function getWrappedAccounts(): Promise<Account[]> {
    // response 是 AxiosResponse，response.data 是整个业务响应对象。
    const response = await axios.get<ApiResult<Account[]>>(
        '/account-result.json'
    );

    const body = response.data;

    // 本例约定 code=0 表示业务成功。
    if (body.code !== 0) {
        throw new Error(body.message);
    }

    // 只把真正的账户数组返回给调用方。
    return body.data;
}
```

文件三：`src/App.vue`。

```vue
<script setup lang="ts">
import { ref } from 'vue';
import {
    getWrappedAccounts
} from './api/wrappedAccounts';
import type {
    Account
} from './api/wrappedAccounts';

const rows = ref<Account[]>([]);
const message = ref('尚未加载');
const loading = ref(false);

async function load(): Promise<void> {
    if (loading.value) {
        return;
    }

    loading.value = true;
    message.value = '正在加载……';

    try {
        // API 函数已经返回 Account[]，不需要再次读取 .data。
        rows.value = await getWrappedAccounts();
        message.value = '加载成功';
    } catch (error) {
        rows.value = [];
        message.value =
            error instanceof Error ? error.message : '加载失败';
    } finally {
        loading.value = false;
    }
}
</script>

<template>
    <h2>统一业务响应示例</h2>

    <button :disabled="loading" @click="load">
        {{ loading ? '加载中……' : '加载账户' }}
    </button>

    <p>{{ message }}</p>

    <ul>
        <li
            v-for="account in rows"
            :key="account.id"
        >
            {{ account.name }}
            - {{ account.active ? '正常' : '停用' }}
        </li>
    </ul>
</template>
```

运行后点击“加载账户”，页面显示两条账户记录。

可以修改 `account-result.json` 中的业务码进行对照：

- 将 `code` 改为 `1001`，将 `message` 改为“无查询权限”。
- 保存文件后再次点击加载。
- 页面进入 `catch`，显示“无查询权限”。
- Network 中仍可能显示 HTTP 200，因为静态 JSON 文件成功传输了；失败来自我们在 API 函数中检查业务码后主动抛出的异常。

将 `code` 恢复为 `0` 后再次加载，列表恢复。

这个示例需要重点理解数据经过了几层：

```text
Axios 请求
    ↓
response（Axios 响应对象）
    ↓ response.data
body（整个业务响应体）
    ↓ body.code 检查
body.data（账户数组）
    ↓ API 函数 return
页面 rows.value
    ↓
模板渲染
```

> [!EXERCISE] 多取了一层 data
>
> `getWrappedAccounts()` 已经返回 `body.data`，页面却写成：
>
> ```ts
> const response = await getWrappedAccounts();
> rows.value = response.data;
> ```
>
> 错误在哪里？
>
> 【答案】
>
> `getWrappedAccounts()` 的返回类型是 `Promise<Account[]>`。经过 `await` 后，`response` 已经是账户数组，不是 AxiosResponse，也不是业务包裹对象，因此没有业务意义上的 `.data` 属性。
>
> 应直接写 `rows.value = await getWrappedAccounts()`。
>
> **解析：** 变量名叫 `response` 不会改变真实数据结构。阅读代码时应追踪函数声明的返回类型和实际 `return` 的内容。


## 完整请求示例：使用 Axios 查询本地账户数据

### 为什么先使用本地 JSON

第一次练习 HTTP 请求时，最容易遇到的问题是没有可用的后端接口。为了先把前端请求链路学清楚，可以使用 Vite 提供的静态 JSON 文件。

在项目根目录创建 `public/accounts.json`：

```json
[
    {
        "id": 101,
        "name": "储蓄账户",
        "balance": 3200,
        "status": "normal"
    },
    {
        "id": 102,
        "name": "工资账户",
        "balance": 8500,
        "status": "normal"
    },
    {
        "id": 103,
        "name": "理财账户",
        "balance": 12000,
        "status": "frozen"
    }
]
```

Vite 会把 `public/` 目录中的文件作为静态资源提供。文件 `public/accounts.json` 可以通过：

```text
http://localhost:5173/accounts.json
```

访问。实际端口以终端启动信息为准。

这是真正的 HTTP GET 请求，可以在浏览器 Network 面板中看到；但它仍然只是静态文件，不是数据库接口。

静态 JSON 有两个限制：

- 文件内容不会根据 URL 查询参数自动筛选。
- 它不支持通过 POST、PUT 或 DELETE 修改文件内容。

因此，本例先让前端读取全部账户，再在 API 函数中使用数组的 `filter()` 完成简单筛选。真实后端接口则可能直接接收 `name`、`page`、`pageSize` 等参数，由服务器完成查询。

### 先定义账户数据类型

文件：`src/types/account.ts`。

```ts
// 描述接口返回的账户对象结构。
export interface Account {
    id: number;
    name: string;
    balance: number;
    status: 'normal' | 'frozen';
}
```

这里使用了 TypeScript 的联合类型：

```ts
status: 'normal' | 'frozen';
```

它表示 `status` 只能是两个字符串字面量中的一个：`'normal'` 或 `'frozen'`。

如果误写成：

```ts
status: 'closed';
```

TypeScript 就会提示类型不匹配。

这个类型描述的是代码预期的数据形状，并不会在运行时自动拦截 JSON 中的错误字段。若 JSON 写错了字段或数据类型，仍应通过 Network 和实际运行结果排查。

### 再编写 API 模块

文件：`src/api/accounts.ts`。

```ts
import axios from 'axios';
import type { Account } from '../types/account';

// 创建一个 Axios 实例，统一设置基础地址和超时时间。
const http = axios.create({
    baseURL: '/',
    timeout: 5000
});

// 读取账户数据，并按关键词进行前端筛选。
export async function getAccounts(
    keyword: string
): Promise<Account[]> {
    // 等待 HTTP 响应。泛型声明响应体预期为 Account[]。
    const response = await http.get<Account[]>('/accounts.json');

    // 静态 JSON 不会根据 keyword 筛选，所以在前端过滤。
    const normalizedKeyword = keyword.trim();

    return response.data.filter(account =>
        account.name.includes(normalizedKeyword)
    );
}
```

逐步理解：

1. `import axios from 'axios'` 导入 Axios 默认导出。
2. `import type { Account }` 只导入类型，不作为运行时对象使用。
3. `axios.create()` 创建一个 Axios 实例。
4. `baseURL: '/'` 表示请求使用当前站点根路径作为基础地址。
5. `timeout: 5000` 表示请求超时时间为 5000 毫秒。
6. `http.get<Account[]>('/accounts.json')` 发起 GET 请求，并声明预期响应体为账户数组。
7. `await` 等待响应完成。
8. `response.data` 取得服务器响应体。
9. `filter()` 返回符合关键词条件的新数组。
10. 函数将筛选后的数组作为 `Promise<Account[]>` 的成功结果返回。

这里的 `getAccounts()` 是 API 模块提供给页面的函数。页面不需要知道它内部使用 Axios，也不需要知道静态 JSON 的文件名，只需要调用函数并接收账户数组。

### 最后在页面中调用 API

文件：`src/App.vue`。

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getAccounts } from './api/accounts';
import type { Account } from './types/account';

const keyword = ref('');
const rows = ref<Account[]>([]);
const loading = ref(false);
const errorMessage = ref('');

// 查询账户。
async function search(): Promise<void> {
    // 请求尚未完成时，阻止重复进入。
    if (loading.value) {
        return;
    }

    loading.value = true;
    errorMessage.value = '';

    try {
        // 将页面当前关键词传给 API 模块。
        rows.value = await getAccounts(keyword.value);
    } catch (error) {
        // 本例采用失败后清空列表的处理策略。
        rows.value = [];
        errorMessage.value =
            error instanceof Error ? error.message : '请求失败';
    } finally {
        // 成功或失败都会恢复按钮状态。
        loading.value = false;
    }
}

// 组件初次挂载后自动执行一次查询。
onMounted(search);
</script>

<template>
    <main class="page">
        <h2>账户查询</h2>

        <div class="search-bar">
            <input
                v-model="keyword"
                placeholder="请输入账户名称"
                @keyup.enter="search"
            />

            <button
                :disabled="loading"
                @click="search"
            >
                {{ loading ? '查询中……' : '查询' }}
            </button>
        </div>

        <p v-if="errorMessage" class="error">
            {{ errorMessage }}
        </p>

        <p v-else-if="loading">
            正在加载账户……
        </p>

        <table v-else-if="rows.length > 0">
            <thead>
                <tr>
                    <th>账户编号</th>
                    <th>账户名称</th>
                    <th>余额</th>
                    <th>状态</th>
                </tr>
            </thead>

            <tbody>
                <tr
                    v-for="account in rows"
                    :key="account.id"
                >
                    <td>{{ account.id }}</td>
                    <td>{{ account.name }}</td>
                    <td>{{ account.balance }} 元</td>
                    <td>
                        {{ account.status === 'normal' ? '正常' : '冻结' }}
                    </td>
                </tr>
            </tbody>
        </table>

        <p v-else>
            没有符合条件的账户
        </p>
    </main>
</template>

<style scoped>
.page {
    max-width: 760px;
    margin: 30px auto;
    padding: 20px;
}

.search-bar {
    display: flex;
    gap: 10px;
    margin-bottom: 16px;
}

input {
    flex: 1;
    min-width: 0;
    padding: 8px 10px;
}

button {
    padding: 8px 18px;
    cursor: pointer;
}

button:disabled {
    cursor: not-allowed;
}

table {
    width: 100%;
    border-collapse: collapse;
}

th,
td {
    padding: 10px;
    border: 1px solid #ddd;
    text-align: left;
}

.error {
    color: #c0392b;
}
</style>
```

### 完整程序的执行顺序

第一次打开页面：

1. Vue 创建 `App.vue` 组件实例。
2. 组件完成初次挂载后，`onMounted(search)` 调用 `search()`。
3. `search()` 把 `loading` 设置为 `true`。
4. 页面调用 `getAccounts(keyword.value)`。
5. API 模块通过 Axios 向 `/accounts.json` 发送 GET 请求。
6. Vite 返回 `public/accounts.json` 中的 JSON 内容。
7. Axios 将响应体放在 `response.data`。
8. API 模块通过 `filter()` 返回账户数组。
9. 页面使用 `await` 取得数组，赋给 `rows.value`。
10. Vue 检测到响应式状态变化，重新渲染模板。
11. `finally` 将 `loading` 恢复为 `false`。

用户在输入框输入“工资”并点击查询时，页面再次调用 `search()`。这次 API 函数接收到的关键词是“工资”，读取完整 JSON 后只返回名称中包含“工资”的账户。

这里要特别注意：**输入框内容改变不会自动发送请求。** `v-model` 只负责同步 `keyword`；点击按钮或按 Enter 才会调用 `search()`。

### loading、空列表和请求失败必须区分

这三个状态表达不同含义：

| 状态 | 含义 | 页面反馈 |
|---|---|---|
| loading | 请求正在进行 | 显示加载提示，禁用查询按钮 |
| 空列表 | 请求成功，但没有符合条件的数据 | 显示“没有符合条件的账户” |
| 请求失败 | 请求未成功完成或数据处理失败 | 显示错误信息 |

不能把请求失败直接当成“没有数据”。例如，服务器 500、网络断开或路径 404，都不意味着账户数量为 0。

本例在失败时清空列表，并显示错误信息。这是一种明确的页面策略。其他业务页面也可以保留上次成功查询的数据，但必须告诉用户当前数据可能不是最新结果，不能让用户误以为刷新成功。

### API 模块为什么不直接修改页面的 ref

`getAccounts()` 只接收 `keyword`，并返回 `Account[]`：

```ts
export async function getAccounts(
    keyword: string
): Promise<Account[]> {
    // ...
}
```

它不直接导入 `App.vue` 中的 `rows`、`loading` 或 `errorMessage`。

这种职责拆分有几个好处：

- API 模块可以被多个页面复用。
- 页面决定何时请求、显示什么 loading 状态。
- 页面决定失败时清空列表还是保留旧数据。
- API 模块只关心请求参数和返回数据，不需要知道页面结构。

可以将职责记成：

- **页面组件：** 用户交互、页面状态和展示。
- **API 模块：** 请求地址、请求参数和响应数据处理。
- **类型模块：** 描述接口数据结构。

### Axios 错误：请求失败时可以检查什么

Axios 请求失败时，常见原因包括：

- 请求地址错误，服务器返回 404。
- 服务器处理失败，返回 500 等 HTTP 错误状态。
- 网络连接失败，浏览器无法取得响应。
- 请求超时，超过 Axios 配置的等待时间。
- 浏览器跨域策略阻止前端读取响应。

可以通过 Axios 的错误对象获取更多信息。使用 `axios.isAxiosError()` 能判断捕获到的值是否属于 Axios 错误：

```ts
import axios from 'axios';

try {
    const response = await axios.get('/accounts.json');
    console.log(response.data);
} catch (error) {
    if (axios.isAxiosError(error)) {
        console.log('Axios 错误：', error.message);

        // 如果服务器确实返回了 HTTP 响应，可以读取状态码和响应体。
        console.log('HTTP 状态：', error.response?.status);
        console.log('响应内容：', error.response?.data);
    } else if (error instanceof Error) {
        console.log('其他错误：', error.message);
    } else {
        console.log('未知错误');
    }
}
```

常见属性：

- `error.message`：错误说明。
- `error.response`：服务器已经返回 HTTP 响应时，可在这里查看状态码、响应头和响应体。
- `error.request`：请求已经发出，但没有取得可用响应时，可能包含底层请求对象。
- `error.config`：本次请求使用的配置。

`error.response` 可能不存在，例如网络断开或请求没有收到响应。读取时使用可选链 `?.`，避免错误处理代码自身再次抛出异常。

**不要仅凭 `error.message` 就断定后端发生了什么。** 需要结合 Network、请求地址、HTTP 状态码、响应体和后端日志一起判断。

### 完整程序：区分 Axios 错误和普通错误

可以在页面中把错误处理写得更明确：

```ts
import axios from 'axios';

async function load(): Promise<void> {
    loading.value = true;
    errorMessage.value = '';

    try {
        rows.value = await getAccounts(keyword.value);
    } catch (error) {
        rows.value = [];

        if (axios.isAxiosError(error)) {
            if (error.response) {
                errorMessage.value =
                    `服务器返回 HTTP ${error.response.status}`;
            } else if (error.request) {
                errorMessage.value = '请求已发出，但没有收到响应';
            } else {
                errorMessage.value = error.message;
            }
        } else if (error instanceof Error) {
            errorMessage.value = error.message;
        } else {
            errorMessage.value = '发生未知错误';
        }
    } finally {
        loading.value = false;
    }
}
```

这段代码可以帮助区分“服务器返回错误响应”和“没有收到响应”。实际项目中，错误提示应根据业务要求进一步转换，不应该把所有底层技术信息原样暴露给最终用户。

### 请求状态表：把页面逻辑画出来

```text
用户触发查询
    ↓
检查 loading
    ├─ 已经在请求：直接返回
    └─ 没有请求：继续
          ↓
      loading = true
      清除旧错误
          ↓
      调用 API 函数
          ↓
       等待 Axios
       ├─ 成功：取得 Account[]，更新 rows
       └─ 失败：记录错误，按策略处理 rows
          ↓
      finally
          ↓
      loading = false
```

这张流程图可以用来检查页面是否遗漏状态更新：

- 请求开始时是否设置 loading？
- 请求失败时是否进入 catch？
- 请求结束时是否一定恢复 loading？
- 成功结果是否赋给模板真正使用的状态？
- 空数据和错误状态是否有不同展示？

> [!EXERCISE] 响应成功但页面报错
>
> 将 `accounts.json` 从数组改成：
>
> ```json
> {
>     "data": [
>         { "id": 101, "name": "储蓄账户", "balance": 3200, "status": "normal" }
>     ]
> }
> ```
>
> 页面执行 `response.data.filter(...)` 时，为什么会出现 `filter is not a function`？
>
> 【答案】
>
> 因为服务器响应体已经从数组变成对象。此时 `response.data` 是包含 `data` 字段的对象，不是数组。应该同步修改响应类型，并从 `response.data.data` 取得数组后再筛选。
>
> 例如：
>
> ```ts
> interface Result<T> {
>     data: T;
> }
>
> const response = await http.get<Result<Account[]>>('/accounts.json');
> return response.data.data.filter(
>     account => account.name.includes(keyword.trim())
> );
> ```
>
> **解析：** 只修改 TypeScript 泛型不会改变服务器实际返回的数据。类型声明、数据访问路径和真实响应结构必须一致。

> [!EXERCISE] 空列表与请求失败
>
> 如果服务器成功返回合法空数组 `[]`，与请求地址写错导致 404，两种情况应该显示相同的提示吗？
>
> 【答案】
>
> 不应该。返回 `[]` 表示请求成功，但没有符合条件的数据；404 表示请求资源不存在，请求失败。前者应显示空数据状态，后者应显示错误提示。
>
> **解析：** 数据为空和数据没有成功取得，是两个不同的业务状态。

## 浏览器 Network：从请求到响应逐步排查

### 为什么要学会使用 Network

前端页面出现“查询失败”时，原因不一定在 Vue：

- 按钮事件可能没有触发。
- 事件处理函数可能没有调用 API。
- API 可能使用了错误的请求地址。
- 请求参数可能传错。
- 服务器可能返回了错误状态。
- HTTP 请求可能成功，但响应数据结构与页面预期不一致。
- 页面可能取得了正确数据，却没有赋给模板使用的响应式变量。

如果只看页面最后显示的错误提示，很难知道问题在哪一层。

浏览器开发者工具（Developer Tools）提供了几个常用面板：

| 面板 | 主要用途 |
|---|---|
| Network | 查看真实网络请求、参数、状态码、响应内容 |
| Console | 查看运行时错误、日志和异常堆栈 |
| Sources | 查看源代码、设置断点、单步调试 |
| Application | 查看 Local Storage、Session Storage、Cookie 等浏览器存储 |

第四天重点使用 Network、Console 和 Sources。

### Network：确认请求是否真正发出

打开浏览器开发者工具：

- Chrome / Edge 通常按 `F12` 或 `Ctrl + Shift + I`。
- 选择 `Network` 面板。
- 勾选 `Preserve log` 可以在页面跳转时保留请求记录。
- 需要重新观察初始化请求时，刷新页面。
- 点击页面中的查询按钮，观察是否出现新的请求记录。

Network 中可以按请求类型筛选：

- `Fetch/XHR`：常用于查看由 JavaScript 发起的接口请求。
- `JS`：JavaScript 文件。
- `CSS`：样式文件。
- `Img`：图片资源。
- `Doc`：页面文档。

本例的 Axios GET 请求通常会出现在 `Fetch/XHR` 中。

如果列表中没有请求，不要立刻认定后端接口不可用。应该先检查页面事件和 API 函数是否真的执行。

### Request URL：请求实际发往哪里

选中一条请求，在 Headers 面板中查看 Request URL。

例如：

```text
http://localhost:5173/accounts.json
```

它说明浏览器实际请求的是当前 Vite 开发服务器上的 `accounts.json`。

如果代码写的是：

```ts
axios.get('/api/accounts');
```

Network 中可能显示：

```text
http://localhost:5173/api/accounts
```

这并不必然意味着请求最终由 Vite 自己处理。如果配置了开发代理，Vite 可能会把请求转发到另一个后端地址。代理细节需要结合 `vite.config.ts` 判断。

### Request Method：确认请求方法

在 Headers 中查看 Request Method：

- GET 表示查询请求。
- POST 表示提交请求。
- PUT、PATCH、DELETE 等表示其他请求方式。

如果接口要求 POST，但页面实际发出 GET，应该回到 API 模块检查调用方法，而不是只修改页面显示。

### Query String Parameters：检查查询参数

GET 请求使用 `params` 时，可以在 Headers 中查看 Query String Parameters。

例如代码：

```ts
axios.get('/api/accounts', {
    params: {
        name: '工资',
        page: 1,
        pageSize: 10
    }
});
```

Network 中应能看到对应的查询参数。

如果参数值不对，检查页面传入 API 函数的参数，再检查 API 函数是否把它放入 `params`。不要只看页面输入框中的文字，因为输入框显示值和实际请求参数可能不是同一变量。

### Payload：检查请求体

POST 请求的请求体通常可以在 Payload 面板中查看。

例如：

```ts
axios.post('/api/accounts', {
    name: '新账户',
    balance: 1000
});
```

Network 中应能看到提交的字段。

如果请求体为空或字段不完整，应该检查 `axios.post()` 的第二个参数，以及页面提交函数是否正确构造了 payload。

### Response：查看服务器真正返回什么

Response 面板展示服务器返回的响应内容。

这一步尤其重要，因为 TypeScript 泛型只是静态声明。即使代码写着：

```ts
axios.get<Account[]>('/api/accounts');
```

也不能据此证明服务器真的返回了 `Account[]`。

应该直接查看 Response：

- 是数组，还是对象？
- 对象中是否有 `code`、`message` 和 `data`？
- 字段名是否与 TypeScript 类型一致？
- 数字字段是否真的返回数字？
- 是否返回了 HTML 错误页面，而不是 JSON？

如果页面报 `filter is not a function`，就要确认 `response.data` 是否真的为数组。

### Status：区分 HTTP 成功和失败

Network 中的 Status 是 HTTP 状态码。

常见情况：

| 状态码 | 常见含义 | 前端排查方向 |
|---|---|---|
| 200 | HTTP 请求成功 | 继续检查业务码和响应结构 |
| 400 | 请求错误 | 检查参数和请求体 |
| 401 | 未认证 | 检查登录状态和认证信息 |
| 403 | 无权限 | 检查用户权限和接口授权 |
| 404 | 资源不存在 | 检查请求路径、代理和后端映射 |
| 500 | 服务器内部错误 | 查看响应信息和服务端日志 |

这些说明用于初步定位，不能只根据状态码断定最终原因。例如 404 可能来自 Vite 静态资源路径错误，也可能来自后端路由不存在；需要结合 Request URL 和 Response 判断。

### HTTP 200 但页面仍然失败

有时 Network 显示 200，页面却提示“无查询权限”或其他业务失败。

例如响应：

```json
{
    "code": 1001,
    "message": "无查询权限",
    "data": null
}
```

HTTP 200 表示请求在 HTTP 层成功返回；业务码 `1001` 表示当前接口协议下业务处理失败。

如果 API 函数中有：

```ts
if (result.code !== 0) {
    throw new Error(result.message);
}
```

那么业务码不符合约定时，前端会主动抛出异常，页面进入 `catch`。Network 仍显示 200 是正常的，因为这个异常发生在前端业务处理阶段。

### Response 是 HTML，为什么 JSON 处理会失败

某些开发服务器在找不到资源时，可能根据配置返回应用入口 HTML，而不是你预期的 JSON 文件。

例如：

- 请求地址写错。
- 静态 JSON 没有放在 `public/` 目录。
- 路径前缀不正确。
- 代理没有匹配请求。
- 后端路径不存在。

如果 Response 显示的是：

```html
<!doctype html>
<html>
...
</html>
```

但页面代码却把它当作账户数组使用，就可能出现数据解析或数组方法调用错误。

此时不要通过修改 `Account` 类型来掩盖问题。应该先确认请求到底返回了什么，再修复地址或服务端配置。

### Sources：设置断点观察数据变化

Network 负责查看传输；Sources 负责查看代码执行过程。

例如，在 `src/App.vue` 的查询函数中：

```ts
const response = await getAccounts(keyword.value);
rows.value = response;
```

可以在 `await` 后一行设置断点。

点击查询时：

1. 浏览器暂停在断点处。
2. 查看当前 `keyword.value`。
3. 单步执行，进入 API 函数。
4. 查看 API 函数中的请求地址和参数。
5. 请求完成后查看 `response.data`。
6. 回到页面查看 API 函数返回值。
7. 观察 `rows.value` 是否得到正确数组。
8. 继续执行，检查模板是否读取 `rows`。

断点可以帮助区分“接口没返回数据”和“接口返回了数据但页面没有正确赋值”这两类问题。

### Console：查看错误堆栈

Console 适合查看：

- `console.log()` 输出的中间变量。
- TypeError、ReferenceError 等运行时错误。
- 异步请求失败后打印的错误对象。
- 错误发生的文件和行号。

例如：

```ts
try {
    rows.value = await getAccounts(keyword.value);
} catch (error) {
    console.error('账户查询失败：', error);
}
```

`console.error()` 会以错误日志形式输出信息。真实项目中应避免把密码、令牌、银行卡号等敏感信息打印到控制台。

### 固定排查顺序：从页面一直追到响应

当页面查询功能不工作时，可以按下面的顺序排查：

1. **有没有触发事件？** 在按钮处理函数第一行设置断点，或先输出一条日志。
2. **有没有调用 API？** 检查事件处理函数是否真正执行了 API 函数。
3. **请求发往哪里？** 查看 Request URL、Request Method 和参数。
4. **HTTP 是否成功？** 查看 Status，必要时结合响应头和服务器日志。
5. **服务器返回了什么？** 查看 Response，确认数据结构与预期一致。
6. **API 函数如何处理响应？** 检查是否正确读取 `response.data`，是否检查业务码。
7. **页面是否取得了正确结果？** 查看 `await` 的返回值。
8. **结果是否写入响应式状态？** 检查 `rows.value` 等变量。
9. **模板是否读取了同一份状态？** 检查 `v-for`、条件渲染和字段名。

可以把这条链路概括为：

```text
按钮点击
    ↓
页面事件函数
    ↓
API 函数
    ↓
Axios 请求
    ↓
Network 中的请求和响应
    ↓
API 函数解析数据
    ↓
页面 await 取得结果
    ↓
修改 ref / reactive
    ↓
Vue 更新模板
```

### 最小故障实验

完成账户查询示例后，可以主动制造三个问题，训练定位能力：

**实验一：路径错误**

把 API 中的 `/accounts.json` 临时改为 `/missing-accounts.json`，重新查询。查看 Network 的 Request URL、Status 和 Response，再观察页面错误提示。

**实验二：合法空数据**

把 `accounts.json` 改成：

```json
[]
```

重新查询。请求应成功，页面显示“没有符合条件的账户”，而不是请求失败。

**实验三：响应结构不匹配**

把 JSON 从数组改成对象：

```json
{
    "data": []
}
```

如果 API 仍然执行 `response.data.filter()`，就会发生类型或运行时错误。根据 Response 修正数据访问路径和类型声明。

完成后恢复三条初始账户记录，避免后续练习受到影响。

> [!EXERCISE] 请求没有出现在 Network 中
>
> 点击查询按钮后页面没有变化，Network 的 Fetch/XHR 中也没有出现请求。应该优先检查后端还是前端？
>
> 【答案】
>
> 应先检查前端事件链：按钮的 `@click` 是否绑定正确、处理函数是否执行、处理函数是否调用 API 函数。若 API 函数根本没有执行，就还没有到后端请求阶段。
>
> **解析：** 排查要从请求链路最前面开始。没有请求记录时，不应该直接把问题归因于后端接口。

> [!EXERCISE] Network 显示 200，但页面提示业务失败
>
> Network 中 Status 是 200，Response 中却有 `{"code":1001,"message":"无查询权限","data":null}`。为什么页面仍会进入 `catch`？
>
> 【答案】
>
> HTTP 200 只说明 HTTP 层成功返回。API 函数检查到业务码不等于约定的成功码后，主动执行 `throw new Error(result.message)`，所以页面的 `await` 会抛出异常并进入 `catch`。
>
> **解析：** HTTP 状态与业务码属于不同层次，必须分别判断。


## Pinia：多个组件如何共享同一份状态

### 为什么需要状态管理

第三天学习了 Props 和 Emit：

- 父组件通过 Props 把数据传给子组件。
- 子组件通过 Emit 把用户操作通知给父组件。

当组件层级较浅时，这种方式足够清楚。但如果多个页面都需要使用同一份数据，逐层传递 Props 和转发 Emit 就会变得复杂。

例如：

- 账户列表页面需要显示当前选中的账户。
- 账户详情页面也需要读取当前选中的账户。
- 账户操作栏需要修改当前选中的账户。
- 页面顶部还需要显示当前账户名称。

如果这些组件彼此没有直接的父子关系，就不适合为了传递一份状态而建立大量中间通信。

**Pinia 是 Vue 的状态管理库，可以集中保存多个组件或页面需要共享的状态。**

可以把它理解为应用中的一个共享状态模块：不同组件通过同一个 Store 读取或修改状态，而不必彼此直接导入。

### 哪些数据适合放进 Store

并不是所有变量都应该放进 Pinia。

适合放进 Store 的数据：

- 登录用户信息。
- 多个页面需要共同使用的当前账户或业务对象。
- 多个组件共同维护的筛选条件。
- 应用级的权限、菜单或配置状态。

通常留在组件内部的数据：

- 某个输入框尚未提交的临时内容。
- 只在一个弹窗内部使用的开关。
- 单个组件的展开/收起状态。
- 仅服务于当前页面的临时提示文字。

判断标准是：**这份状态是否确实需要跨组件或跨页面共享。** 如果只有一个组件使用，放在组件自己的 `ref` 中通常更简单。

过早把所有变量都放进 Store，会扩大状态影响范围，让代码难以判断哪些页面能够修改同一份数据。

### 安装 Pinia

如果项目尚未安装 Pinia，在项目根目录执行：

```bash
npm install pinia
```

然后在 `src/main.ts` 中注册：

```ts
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';

const app = createApp(App);

// 创建 Pinia 实例，并注册到当前 Vue 应用。
app.use(createPinia());

app.mount('#app');
```

这里：

- `createPinia()` 创建 Pinia 实例。
- `app.use()` 把 Pinia 安装到当前 Vue 应用。
- 组件在 setup 中调用 Store 时，会从当前应用取得对应的 Pinia 实例。

**注册 Pinia 必须发生在组件使用 Store 之前。** 如果忘记注册，组件调用 `useXxxStore()` 时就无法找到当前应用的 Pinia 实例。

如果项目已经在 `main.ts` 中注册 Pinia，不要再次创建第二份实例；应沿用已有注册。

### defineStore：定义一个 Store

Pinia 使用 `defineStore()` 定义 Store：

```ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useSelectionStore = defineStore('selection', () => {
    const id = ref(0);

    const hasSelection = computed(() => id.value !== 0);

    function select(value: number): void {
        id.value = value;
    }

    return {
        id,
        hasSelection,
        select
    };
});
```

`defineStore()` 的第一个参数是 Store ID，第二个参数是 Store 定义函数。

这里的 `'selection'` 是 Store 的唯一标识，应当在当前 Pinia 应用中保持唯一。不同业务 Store 不应随意使用同一个 ID。

`defineStore()` 返回的是一个获取 Store 的函数，而不是立刻返回某一份状态。因此通常命名为 `useSelectionStore`，组件中再调用：

```ts
const store = useSelectionStore();
```

这时才取得当前 Pinia 实例中对应的 Store。

### Setup Store：使用 ref、computed 和函数定义状态

上面的写法属于 Pinia 的 Setup Store 风格。它与 Vue 组合式 API 很接近：

| Setup Store 中的写法 | 对应职责 | 含义 |
|---|---|---|
| `ref()` / `reactive()` | State | 保存状态 |
| `computed()` | Getter | 根据 State 计算派生结果 |
| 普通函数 | Action | 执行业务操作、修改状态或发起异步操作 |

例如：

```ts
const id = ref(0); // State：保存当前账户编号

const hasSelection = computed(() => {
    return id.value !== 0;
}); // Getter：判断是否已经选择账户

function select(value: number): void {
    id.value = value;
} // Action：修改当前账户编号
```

这三者的职责不同：

- State 保存原始状态。
- Getter 根据已有状态计算结果，不需要重复保存一份相同含义的数据。
- Action 封装修改状态或执行业务操作的入口。

在 Setup Store 中，需要把希望暴露给外部使用的状态、Getter 和 Action 放进 `return` 对象。没有返回的局部变量不会作为普通 Store 属性供组件使用。

### 在组件中取得 Store

组件中导入并调用 Store：

```ts
import { useSelectionStore } from './stores/selection';

const store = useSelectionStore();
```

然后可以读取状态、调用 Getter 和 Action：

```ts
console.log(store.id);
console.log(store.hasSelection);

store.select(101);
```

需要注意，Pinia 会对 Store 中的响应式属性进行代理和自动解包。通过 `store.id` 读取时，拿到的是解包后的数字，不需要写 `store.id.value`。

但在 Store 定义函数内部，`id` 仍然是 ref，所以需要写：

```ts
id.value = value;
```

两处写法不同，是因为它们访问的对象不同：

- Store 内部：直接访问 `ref` 变量，使用 `.value`。
- 组件通过 Store 对象访问：Pinia 自动解包，通常不写 `.value`。

### 为什么不能直接解构 Store

下面的写法看起来很自然：

```ts
const store = useSelectionStore();

const { id, hasSelection } = store;
```

但直接解构普通 Store 属性时，可能只取得当时的值，不会保留与 Store 状态之间的响应式连接。

例如 `id` 初始为 0，解构后得到的可能就是普通数字 0。之后 Store 中的 `id` 改为 101，局部变量 `id` 不会自动变成 101。

这与第二天学习的 `reactive` 对象解构问题类似：**解构普通属性值，不等于取得一个持续跟随原对象变化的 ref。**

### storeToRefs：安全地解构 State 和 Getter

Pinia 提供 `storeToRefs()`：

```ts
import { storeToRefs } from 'pinia';

const store = useSelectionStore();

const { id, hasSelection } = storeToRefs(store);
```

它会把 Store 中的响应式状态和 Getter 转换成 ref，让解构后的变量继续与 Store 保持响应式连接。

此时：

- 在 `<script setup>` 中读取 `id.value`。
- 在 `<script setup>` 中读取 `hasSelection.value`。
- 在 Vue 模板顶层直接使用 `id` 和 `hasSelection`，模板会自动解包 ref。
- Action 是函数，可以继续通过 `store.select()` 调用，不需要使用 `storeToRefs()`。

例如：

```ts
const store = useSelectionStore();
const { id, hasSelection } = storeToRefs(store);

store.select(101);

console.log(id.value); // 101
```

这里 `id` 是 ref，所以脚本中读取需要 `.value`。`store.select()` 是函数，可以直接调用。

### 完整程序：创建一个最简单的 Pinia Store

文件一：`src/stores/selection.ts`。

```ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useSelectionStore = defineStore('selection', () => {
    // State：保存当前选择的账户编号。
    const id = ref(0);

    // Getter：根据 id 判断是否已经选择账户。
    const hasSelection = computed(() => id.value !== 0);

    // Action：统一通过函数修改账户编号。
    function select(value: number): void {
        id.value = value;
    }

    return {
        id,
        hasSelection,
        select
    };
});
```

文件二：`src/main.ts`。

```ts
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';

const app = createApp(App);

// 在挂载组件前注册 Pinia。
app.use(createPinia());

app.mount('#app');
```

文件三：`src/App.vue`。

```vue
<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useSelectionStore } from './stores/selection';

const store = useSelectionStore();

// State 和 Getter 通过 storeToRefs 解构。
const { id, hasSelection } = storeToRefs(store);

function chooseAccount(): void {
    // Action 可以直接通过 store 调用。
    store.select(101);
}
</script>

<template>
    <h2>Pinia 状态管理</h2>

    <button @click="chooseAccount">
        选择账户 101
    </button>

    <p>当前账户编号：{{ id }}</p>
    <p>是否已经选择：{{ hasSelection ? '是' : '否' }}</p>
</template>
```

运行后，初始编号为 0，是否选择为“否”。点击按钮后，Action 修改 State，Getter 重新计算，模板显示编号 101 和“是”。

### 完整程序：两个兄弟组件共享同一份账户状态

前面的程序只在一个组件中使用 Store，还不能直观看出 Pinia 的共享价值。下面让两个没有直接父子通信关系的组件分别负责选择和展示。

文件一：`src/stores/sharedAccount.ts`。

```ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useSharedAccountStore = defineStore(
    'shared-account',
    () => {
        // 多个组件共享当前选择的账户名称。
        const selectedName = ref('尚未选择');

        // Getter：判断当前是否已经选择账户。
        const hasSelection = computed(() => {
            return selectedName.value !== '尚未选择';
        });

        // Action：修改共享状态。
        function select(name: string): void {
            selectedName.value = name;
        }

        return {
            selectedName,
            hasSelection,
            select
        };
    }
);
```

文件二：`src/components/AccountSelector.vue`。

```vue
<script setup lang="ts">
import { useSharedAccountStore } from '../stores/sharedAccount';

// 取得共享 Store。
const store = useSharedAccountStore();
</script>

<template>
    <section>
        <h3>账户选择区</h3>

        <button @click="store.select('储蓄账户')">
            选择储蓄账户
        </button>

        <button @click="store.select('工资账户')">
            选择工资账户
        </button>
    </section>
</template>
```

文件三：`src/components/AccountSummary.vue`。

```vue
<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useSharedAccountStore } from '../stores/sharedAccount';

const store = useSharedAccountStore();

// 使用 storeToRefs 保留 State 和 Getter 的响应式连接。
const { selectedName, hasSelection } = storeToRefs(store);
</script>

<template>
    <section>
        <h3>当前账户摘要</h3>

        <p>当前选择：{{ selectedName }}</p>

        <p>
            是否已经选择：
            {{ hasSelection ? '是' : '否' }}
        </p>
    </section>
</template>
```

文件四：`src/App.vue`。

```vue
<script setup lang="ts">
import AccountSelector from './components/AccountSelector.vue';
import AccountSummary from './components/AccountSummary.vue';
</script>

<template>
    <h2>兄弟组件共享状态</h2>

    <AccountSelector />

    <AccountSummary />
</template>
```

文件五：`src/main.ts`。

```ts
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';

const app = createApp(App);

// 所有组件使用当前应用注册的同一个 Pinia 实例。
app.use(createPinia());

app.mount('#app');
```

运行后：

1. 页面初始显示“尚未选择”，是否已经选择为“否”。
2. 点击“选择工资账户”。
3. `AccountSelector` 调用 Store 的 `select()` Action。
4. Store 修改 `selectedName`。
5. `AccountSummary` 通过同一个 Store 读取到新的状态。
6. Getter `hasSelection` 重新计算为 `true`。
7. 摘要区域显示“工资账户”和“是”。

两个子组件没有互相导入，也没有通过父组件转发 Props 和 Emit。它们调用同一个 `useSharedAccountStore()`，在同一个 Pinia 实例中取得同一份状态，因此能够协作。

### Pinia 与第三天 Composable 的区别

第三天学习的 Composable 可以复用有状态逻辑，但是否共享状态取决于状态创建的位置。

例如：

```ts
export function useCounter() {
    const count = ref(0);
    return { count };
}
```

每次调用 `useCounter()`，都会创建一份新的 `count`。

Pinia 的 Store 则根据 Store ID 在当前 Pinia 实例中管理对应状态。同一个应用中的多个组件调用同一个 `useSharedAccountStore()`，会取得同一份 Store 状态。

| 对比 | 普通 Composable | Pinia Store |
|---|---|---|
| 主要目的 | 复用响应式逻辑 | 管理应用共享状态 |
| 多次调用是否共享状态 | 取决于状态定义位置 | 同一 Pinia 实例、同一 Store ID 对应同一份 Store |
| 是否要求注册插件 | 不要求 Pinia 注册 | 需要先注册 Pinia |
| 常见用途 | 窗口尺寸、计数逻辑、局部查询逻辑 | 登录用户、当前账户、跨页面共享业务状态 |

不要把“代码复用”和“状态共享”当成同一个概念。

### Pinia 不会自动把状态保存到数据库

Pinia 默认管理的是当前前端应用运行期间的状态。刷新浏览器时，应用会重新初始化，Store 也会重新创建。

例如，选择了“工资账户”后刷新页面，如果没有额外持久化逻辑，状态可能重新回到“尚未选择”。

Pinia 本身不等于：

- 数据库。
- 后端会话。
- 自动持久化工具。
- 跨设备同步机制。

如果业务需要刷新后保留状态，需要明确使用 Local Storage、Session Storage、持久化插件或后端接口等方案，并考虑数据有效期、安全性和清理策略。

**尤其不要把密码、完整银行卡号、访问令牌等敏感信息随意写入浏览器持久化存储。** 是否允许保存、保存哪些字段，应遵循项目安全规范。

### 组件局部状态、Props/Emit 与 Pinia 怎样选择

| 业务需求 | 推荐方式 | 原因 |
|---|---|---|
| 一个组件内部的输入值 | `ref` / `reactive` | 状态只属于当前组件 |
| 父组件给子组件传账户信息 | Props | 明确的父向子数据流 |
| 子组件通知父组件选中账户 | Emit | 明确报告用户操作 |
| 父子组件共同维护输入值 | `v-model` | 统一模型值和更新事件 |
| 多个无直接关系的组件共享当前账户 | Pinia | 避免层层传递和事件转发 |
| 多个页面共用登录用户信息 | Pinia | 适合应用级共享状态 |

> [!EXERCISE] Store 是否自动写入数据库
>
> 选择“工资账户”后刷新浏览器，为什么可能回到“尚未选择”？这是 Pinia 失效了吗？
>
> 【答案】
>
> 不是。当前 Store 只保存前端应用运行期间的内存状态。页面刷新后，应用和 Store 会重新初始化，`selectedName` 再次执行 `ref('尚未选择')`。
>
> **解析：** Pinia 负责状态管理，不会自动将数据写入数据库或浏览器持久化存储。需要持久化时，应另行实现并遵循项目安全要求。

> [!EXERCISE] 直接解构 Store 为什么不更新
>
> 下面的代码为什么可能导致页面不再跟随 Store 更新？
>
> ```ts
> const store = useSharedAccountStore();
> const { selectedName } = store;
> ```
>
> 应该怎样修改？
>
> 【答案】
>
> 直接解构 Store 的普通属性可能只取得当时的值，失去与原 Store 属性的响应式连接。应使用：
>
> ```ts
> const store = useSharedAccountStore();
> const { selectedName } = storeToRefs(store);
> ```
>
> **解析：** `storeToRefs()` 会为 State 和 Getter 创建保持响应式连接的 ref；Action 是函数，仍然通过 `store` 调用。


## 拓展：Axios 实例、请求拦截器与响应拦截器

### 为什么需要创建 Axios 实例

前面的示例直接调用：

```ts
axios.get('/accounts.json');
```

真实项目中，多个接口可能具有相同的基础配置：

- 都使用同一个后端服务地址。
- 都需要相同的超时时间。
- 都需要添加统一请求头。
- 都需要统一处理响应或错误。

如果每个接口都单独写一遍这些配置，会产生重复代码。

Axios 提供 `axios.create()` 创建独立的 Axios 实例：

```ts
import axios from 'axios';

const http = axios.create({
    baseURL: '/api',
    timeout: 5000
});

export default http;
```

常见配置：

| 配置项 | 作用 |
|---|---|
| `baseURL` | 请求地址的基础前缀 |
| `timeout` | 请求超时时间，单位为毫秒 |
| `headers` | 默认请求头 |
| `params` | 请求查询参数 |
| `withCredentials` | 是否在跨域请求中携带凭据，需与服务器 CORS 配置配合 |

例如：

```ts
http.get('/accounts');
```

在 `baseURL` 为 `/api` 时，最终请求路径会组合为 `/api/accounts`。

如果每次请求都需要相同的基础路径和超时时间，就可以把它们集中放在实例配置中。

### baseURL 与接口路径如何组合

假设：

```ts
const http = axios.create({
    baseURL: '/api'
});
```

调用：

```ts
http.get('/accounts');
```

请求路径对应：

```text
/api/accounts
```

如果 `baseURL` 是：

```ts
baseURL: 'https://test.example.com/api'
```

那么调用 `http.get('/accounts')` 就会向对应服务的 `/api/accounts` 路径发送请求。

注意，`baseURL` 不是后端接口的完整业务定义。它只负责公共地址部分，具体接口路径仍由每个 API 函数提供。

### 请求拦截器：发送请求之前统一处理

请求拦截器（Request Interceptor）会在请求发送之前执行。

常见用途：

- 统一添加认证请求头。
- 统一添加渠道标识。
- 记录请求日志。
- 根据项目规范补充公共参数。

基本写法：

```ts
http.interceptors.request.use(
    config => {
        // 修改请求配置。
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);
```

`interceptors.request.use()` 接收成功处理函数和可选的失败处理函数。

请求处理函数接收 `config`，它表示本次请求的配置。修改后必须返回 `config`，让 Axios 继续使用这份配置发送请求。

如果处理函数没有正确返回配置，请求链就可能无法按预期继续。

### 响应拦截器：服务器返回响应后统一处理

响应拦截器（Response Interceptor）会在请求取得响应后执行。

基本写法：

```ts
http.interceptors.response.use(
    response => {
        return response;
    },
    error => {
        return Promise.reject(error);
    }
);
```

两个分支：

- 第一个函数处理成功响应。
- 第二个函数处理失败响应。

如果成功处理函数返回原始 `response`，调用方仍然可以使用：

```ts
const response = await http.get<Account[]>('/accounts');
const rows = response.data;
```

如果成功处理函数改成：

```ts
response => response.data
```

那么 Axios 调用链向上返回的运行时值就变成响应体，而不再是完整 AxiosResponse。

这会影响调用方的数据访问方式和 TypeScript 类型。**拦截器返回什么，调用方就必须按照什么结构接收。** 初学时建议先保留完整 `response`，等理解类型和调用链后再决定是否统一解包。

### 为什么错误拦截器通常要返回 Promise.reject

如果错误拦截器只打印错误：

```ts
error => {
    console.error(error);
}
```

这个回调正常结束时会返回 `undefined`，可能使后续 Promise 链把错误当作已处理的结果，调用方不再按预期进入 `catch`。

如果公共层没有提供一个明确的替代成功结果，通常应继续拒绝 Promise：

```ts
error => {
    console.error(error);
    return Promise.reject(error);
}
```

这样页面仍然可以通过 `try...catch` 处理错误。

### 完整程序：Axios 实例与拦截器

本例仍然访问本地静态 JSON，不依赖真实后端。它的目的是在 Network 中观察请求头和拦截器执行顺序。

文件一：`public/interceptor-accounts.json`。

```json
[
    {
        "id": 101,
        "name": "拦截器实验账户"
    }
]
```

文件二：`src/api/interceptorHttp.ts`。

```ts
import axios from 'axios';

// 创建独立 Axios 实例。
const http = axios.create({
    baseURL: '/',
    timeout: 5000
});

// 请求拦截器：在真正发送请求前添加统一请求头。
http.interceptors.request.use(
    config => {
        // Axios 1.x 的请求头对象支持 set 方法。
        config.headers.set('X-Learning-Source', 'vue-course');

        console.log('请求拦截器：准备发送', config.url);

        // 必须返回修改后的配置。
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

// 响应拦截器：成功时保留完整 AxiosResponse。
http.interceptors.response.use(
    response => {
        console.log('响应拦截器：HTTP 状态', response.status);

        return response;
    },
    error => {
        console.log('响应拦截器：继续传递失败');

        // 让页面仍然能够进入 catch。
        return Promise.reject(error);
    }
);

export default http;
```

文件三：`src/api/interceptorAccounts.ts`。

```ts
import http from './interceptorHttp';

export interface Account {
    id: number;
    name: string;
}

export async function getInterceptedAccounts(): Promise<Account[]> {
    const response = await http.get<Account[]>(
        '/interceptor-accounts.json'
    );

    // 响应拦截器返回完整 response，因此这里仍读取 response.data。
    return response.data;
}
```

文件四：`src/App.vue`。

```vue
<script setup lang="ts">
import { ref } from 'vue';
import {
    getInterceptedAccounts
} from './api/interceptorAccounts';
import type {
    Account
} from './api/interceptorAccounts';

const rows = ref<Account[]>([]);
const message = ref('尚未读取');
const loading = ref(false);

async function load(): Promise<void> {
    if (loading.value) {
        return;
    }

    loading.value = true;
    message.value = '正在读取……';

    try {
        rows.value = await getInterceptedAccounts();
        message.value = '读取成功';
    } catch (error) {
        message.value =
            error instanceof Error ? error.message : '读取失败';
    } finally {
        loading.value = false;
    }
}
</script>

<template>
    <h2>Axios 拦截器实验</h2>

    <button :disabled="loading" @click="load">
        {{ loading ? '读取中……' : '观察拦截器请求' }}
    </button>

    <p>{{ message }}</p>

    <ul>
        <li
            v-for="account in rows"
            :key="account.id"
        >
            {{ account.name }}
        </li>
    </ul>
</template>
```

### 如何观察拦截器执行结果

打开浏览器开发者工具，同时打开 Console 和 Network。

点击“观察拦截器请求”：

1. Console 先显示“请求拦截器：准备发送”。
2. Network 出现 `interceptor-accounts.json` 请求。
3. 在请求的 Headers 中找到 `X-Learning-Source`，确认值为 `vue-course`。
4. 请求成功后，Console 显示“响应拦截器：HTTP 状态 200”。
5. 页面显示“拦截器实验账户”。

这几个位置分别证明：

- 请求拦截器修改了请求配置。
- 浏览器真正发出了 HTTP 请求。
- 响应拦截器接收到了服务器响应。
- API 函数返回数据，页面更新了响应式状态。

不要只看到 Console 中打印“准备发送”，就认定服务器已经收到请求。真正的传输结果仍要以 Network 为准。

### 业务码检查应该放在哪一层

如果多个页面都使用同一套业务响应结构，可以在公共 API 层或统一响应处理层检查业务码。

例如：

```ts
interface ApiResult<T> {
    code: number;
    message: string;
    data: T;
}

async function getResultAccounts(): Promise<Account[]> {
    const response = await http.get<ApiResult<Account[]>>('/accounts');

    const result = response.data;

    if (result.code !== 0) {
        throw new Error(result.message);
    }

    return result.data;
}
```

这里假定当前接口协议约定 `code === 0` 表示业务成功。这个约定只适用于对应系统，不是所有银行或所有后端都统一使用 0。

HTTP 失败通常会由 Axios 拒绝 Promise；HTTP 成功但业务码不符合约定时，则由代码主动 `throw`。对于页面来说，两种情况都可以进入 `catch`，再由页面决定显示什么提示。

如果把业务码检查放进响应拦截器，应确保所有接口都遵循同一响应协议。若某些接口直接返回文件、数组或其他特殊结构，就不能无条件按统一包裹对象读取。

## 拓展：Vite 代理与前后端联调

### 为什么开发环境经常需要代理

前端开发服务器和后端服务通常运行在不同地址：

```text
前端 Vite： http://localhost:5173
后端服务： http://localhost:8080
```

如果浏览器页面从 5173 端口发起请求，直接访问 8080 端口，就属于跨源请求。浏览器会根据同源策略和 CORS 配置决定是否允许页面读取响应。

同源通常要求协议、域名和端口都一致。只要其中一项不同，就属于不同源。

开发环境常使用 Vite 代理（Proxy）：

```text
浏览器
  ↓ 请求 /api/accounts
Vite 开发服务器 5173
  ↓ 代理转发
后端服务 8080
  ↓ 返回响应
Vite 再把响应交给浏览器
```

浏览器请求的是当前 Vite 服务下的 `/api/accounts`，由 Vite 根据配置转发到后端。

代理的作用是转发请求，不是创建后端接口，也不是自动解决所有跨域和认证问题。

### vite.config.ts 中的 proxy

假设后端监听 `http://127.0.0.1:8080`，并且后端接口路径为 `/api/accounts`，可以配置：

```ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
    plugins: [vue()],

    server: {
        port: 5173,

        proxy: {
            '/api': {
                target: 'http://127.0.0.1:8080',
                changeOrigin: true
            }
        }
    }
});
```

配置项：

- `server`：开发服务器相关配置。
- `proxy`：代理规则对象。
- `'/api'`：匹配请求路径的前缀。
- `target`：需要转发到的后端目标地址。
- `changeOrigin`：转发时调整请求的 Host 相关信息。

本例没有设置 `rewrite`，因此 `/api` 前缀会保留。浏览器请求 `/api/accounts`，后端收到的仍然是 `/api/accounts`。

如果后端实际接口是 `/accounts`，就需要根据后端路径约定进行重写：

```ts
proxy: {
    '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, '')
    }
}
```

此时浏览器请求 `/api/accounts`，转发到后端时会去掉 `/api`，后端收到 `/accounts`。

**代理是否保留前缀，必须与后端真实接口路径对应。** 不要认为配置了 `target` 就会自动删除 `/api`。

### 代理不会凭空创建后端接口

如果后端没有提供 `/api/accounts`，即使 Vite 代理配置正确，也无法让这个接口自动存在。

代理只负责把匹配的请求转发到目标服务。后端是否启动、端口是否正确、路径是否存在、接口是否允许当前请求，都需要分别确认。

代理只在 Vite 开发服务器运行期间生效。项目构建后，静态文件部署到 Nginx、Tomcat 或其他服务器时，生产环境的反向代理需要由对应服务器或网关配置。

因此：

- 开发环境正常，生产环境 404：检查生产服务器转发规则和实际 API 地址。
- 开发环境 404：检查 Vite 代理匹配、目标地址和后端路径。
- Network 中显示 Vite 端口：不代表代理一定没生效，浏览器看到的仍可能是发给 Vite 的地址。

### 完整程序：让前端请求经过 Vite 代理

文件一：`vite.config.ts`。

```ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
    plugins: [vue()],

    server: {
        port: 5173,

        proxy: {
            '/api': {
                target: 'http://127.0.0.1:8080',
                changeOrigin: true,
                rewrite: path => path.replace(/^\/api/, '')
            }
        }
    }
});
```

文件二：`src/api/proxyAccounts.ts`。

```ts
import axios from 'axios';

const http = axios.create({
    // 请求先发给当前 Vite 服务，再由 Vite 转发。
    baseURL: '/api',
    timeout: 5000
});

export interface Account {
    id: number;
    name: string;
}

export async function getProxyAccounts(): Promise<Account[]> {
    const response = await http.get<Account[]>('/accounts');
    return response.data;
}
```

文件三：`src/App.vue`。

```vue
<script setup lang="ts">
import { ref } from 'vue';
import {
    getProxyAccounts
} from './api/proxyAccounts';
import type {
    Account
} from './api/proxyAccounts';

const rows = ref<Account[]>([]);
const message = ref('尚未查询');

async function load(): Promise<void> {
    try {
        rows.value = await getProxyAccounts();
        message.value = '查询成功';
    } catch (error) {
        message.value =
            error instanceof Error ? error.message : '查询失败';
    }
}
</script>

<template>
    <button @click="load">查询后端账户</button>
    <p>{{ message }}</p>

    <ul>
        <li
            v-for="account in rows"
            :key="account.id"
        >
            {{ account.name }}
        </li>
    </ul>
</template>
```

这个示例需要后端真实运行在 `127.0.0.1:8080`，并提供 `/accounts` 接口。没有这样的后端时，请求失败是预期结果，不要把它当成可独立运行的静态 JSON 示例。

实际联调时，在 Network 中查看浏览器请求地址，再结合 `vite.config.ts` 推断代理目标，最后检查后端是否收到请求。代理配置文件本身不能证明后端已经成功处理。

## 拓展：环境变量与不同运行模式

### 为什么需要环境变量

前端项目在开发、测试和生产环境中，通常需要使用不同的接口地址：

```text
开发环境：/api
测试环境：https://test.example.com/api
生产环境：https://api.example.com
```

如果把地址直接写死在每个 API 函数中，切换环境时就要修改很多文件。

环境变量（Environment Variables）可以把环境相关配置放在单独文件中，再由 Vite 根据当前模式加载。

### Vite 的环境文件

常见环境文件：

| 文件 | 用途 |
|---|---|
| `.env` | 所有模式都会加载的公共变量 |
| `.env.development` | 开发模式变量 |
| `.env.production` | 生产模式变量 |
| `.env.local` | 本地专用变量，通常不提交到版本库 |
| `.env.development.local` | 开发模式下的本地覆盖变量 |

具体加载优先级以 Vite 当前版本的环境变量规则为准。常见做法是把所有环境共用的配置放在 `.env`，把不同环境的值分别放在对应模式文件中。

### 为什么客户端变量必须以 VITE_ 开头

Vite 默认只把符合 `envPrefix` 规则的变量暴露给客户端代码，默认前缀是 `VITE_`。

例如：

```dotenv
VITE_API_BASE=/api
```

可以在代码中读取：

```ts
const apiBase = import.meta.env.VITE_API_BASE;
```

如果写成：

```dotenv
API_SECRET=abc123
```

默认不会通过 `import.meta.env.API_SECRET` 暴露给客户端。

但反过来，任何 `VITE_` 前缀变量都可能进入最终前端代码，被浏览器用户查看。因此：

**不要把数据库密码、私钥、服务端密钥或其他必须保密的信息放在 `VITE_` 环境变量中。** 环境文件名称包含 `production`，也不会让客户端变量自动保密。

### 环境变量的值通常是字符串

例如：

```dotenv
VITE_USE_MOCK=false
```

读取后：

```ts
const useMock = import.meta.env.VITE_USE_MOCK;
```

`useMock` 的原始值是字符串 `'false'`，不是布尔值 `false`。

JavaScript 中非空字符串是真值，所以：

```ts
if (import.meta.env.VITE_USE_MOCK) {
    // 字符串 'false' 也会进入这里。
}
```

会产生错误判断。

需要把字符串明确转换为布尔值：

```ts
const useMock = import.meta.env.VITE_USE_MOCK === 'true';
```

只有原始值严格等于字符串 `'true'` 时，`useMock` 才是布尔 `true`。

### import.meta.env.MODE

Vite 还提供当前运行模式：

```ts
const mode = import.meta.env.MODE;
```

常见结果：

- 运行开发服务器时，通常是 `development`。
- 执行生产构建时，通常是 `production`。

也可以使用：

```ts
if (import.meta.env.DEV) {
    console.log('当前是开发环境');
}

if (import.meta.env.PROD) {
    console.log('当前是生产环境');
}
```

`DEV` 和 `PROD` 是布尔值；自定义的 `VITE_` 变量通常以字符串形式读取。

### 完整程序：观察开发和生产模式的变量

文件一：`.env.development`（项目根目录）。

```dotenv
VITE_API_BASE=/api
VITE_USE_MOCK=true
```

文件二：`.env.production`（项目根目录）。

```dotenv
VITE_API_BASE=/production-api
VITE_USE_MOCK=false
```

文件三：`src/App.vue`。

```vue
<script setup lang="ts">
const mode = import.meta.env.MODE;
const apiBase = import.meta.env.VITE_API_BASE;

// 环境变量原始值是字符串。
const rawFlag = import.meta.env.VITE_USE_MOCK;

// 明确把字符串开关转换为布尔值。
const useMock = rawFlag === 'true';
</script>

<template>
    <h2>环境变量实验</h2>

    <p>当前模式：{{ mode }}</p>
    <p>接口前缀：{{ apiBase }}</p>
    <p>开关原始值：{{ rawFlag }}</p>
    <p>
        Mock 状态：
        {{ useMock ? '启用' : '关闭' }}
    </p>
</template>
```

启动开发服务器：

```bash
npm run dev
```

通常会显示 development、`/api` 和启用 Mock。

执行生产构建：

```bash
npm run build
```

再预览构建产物：

```bash
npm run preview
```

通常会看到 production、`/production-api` 和关闭 Mock。

这里需要理解：环境变量在 Vite 启动或构建时加载。修改 `.env` 文件后，应重启开发服务器；生产环境变量则会在构建时进入构建产物。`preview` 只是预览已经构建好的结果，不会把生产构建重新变成开发模式。

### 路径别名：让 Vite 与 TypeScript 同时识别

假设项目中经常需要从页面导入 API 模块：

```ts
import { getAccounts } from '../../../api/accounts';
```

目录层级较深时，相对路径会变得很长。可以把 `src/` 配置为 `@`：

```ts
import { getAccounts } from '@/api/accounts';
```

Vite 配置文件中：

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

`new URL('./src', import.meta.url)` 根据当前配置文件的位置生成目标目录的文件 URL；`fileURLToPath()` 将文件 URL 转换成当前操作系统使用的文件路径。

这段代码运行在 Vite 的 Node.js 配置环境，不是在浏览器中访问用户磁盘。

TypeScript 也需要知道这个映射。在项目实际参与应用检查的 `tsconfig.app.json` 或对应配置中，补充：

```json
{
    "compilerOptions": {
        "paths": {
            "@/*": ["./src/*"]
        }
    }
}
```

这只是需要合并的配置片段，不要直接覆盖项目现有的 `tsconfig.app.json`。真实项目可能通过 `extends`、`references` 等方式拆分配置，应该先查看配置继承关系。

如果浏览器运行正常，但编辑器提示找不到 `@/` 模块，检查 TypeScript 的 `paths`；如果编辑器没有报错，但 Vite 运行时找不到文件，检查 `vite.config.ts` 的 `resolve.alias`。

### Mock：模拟数据不只有一种方式

Mock 指用模拟数据或模拟服务代替真实后端，常见形式包括：

| 形式 | 工作方式 | Network 是否出现 HTTP 请求 |
|---|---|---|
| 静态 JSON | 浏览器通过 URL 读取 `public/` 文件 | 会 |
| 页面导入的 Mock 函数 | JavaScript 在浏览器内直接返回数据 | 不会 |
| Mock 中间件或插件 | 开发服务器模拟 HTTP 接口 | 通常会 |

**仅仅创建一个 `mock.ts` 文件，不会自动产生 HTTP 接口。**

一个普通 TypeScript 文件只有在被页面或其他模块导入并执行，或者被 Mock 插件、中间件明确注册后，才会产生对应行为。

这也是阅读企业项目时需要确认的地方：`src/mock/`、`mock/` 或 `Mock/` 只是目录名称。应该继续查找它是否被入口文件导入、是否在 `vite.config.ts` 中注册插件，以及页面实际调用的是哪个函数或 URL。

### 完整程序：在内存 Mock 与静态 HTTP 数据之间切换

本例展示两种来源如何对外提供同一种返回类型。页面不需要知道数据来自内存数组还是 HTTP。

文件一：`.env.development`。

```dotenv
VITE_USE_MOCK=true
```

文件二：`public/switch-accounts.json`。

```json
[
    {
        "id": 101,
        "name": "HTTP 储蓄账户"
    }
]
```

文件三：`src/api/switchAccounts.ts`。

```ts
import axios from 'axios';

export interface Account {
    id: number;
    name: string;
}

// 模拟数据保存在当前浏览器模块的内存中。
const mockAccounts: Account[] = [
    {
        id: 901,
        name: 'Mock 储蓄账户'
    }
];

export async function getSwitchAccounts(): Promise<Account[]> {
    // 环境变量是字符串，必须明确比较。
    const useMock = import.meta.env.VITE_USE_MOCK === 'true';

    if (useMock) {
        // 返回副本，避免调用者直接修改模块内部的原始数组对象。
        return mockAccounts.map(account => ({ ...account }));
    }

    // 关闭 Mock 后，改为发起真正的 HTTP GET 请求。
    const response = await axios.get<Account[]>('/switch-accounts.json');

    return response.data;
}
```

文件四：`src/App.vue`。

```vue
<script setup lang="ts">
import { ref } from 'vue';
import {
    getSwitchAccounts
} from './api/switchAccounts';
import type {
    Account
} from './api/switchAccounts';

const rows = ref<Account[]>([]);
const message = ref('尚未加载');

async function load(): Promise<void> {
    try {
        rows.value = await getSwitchAccounts();
        message.value = '加载成功';
    } catch (error) {
        message.value =
            error instanceof Error ? error.message : '读取失败';
    }
}
</script>

<template>
    <h2>Mock 与 HTTP 切换</h2>

    <button @click="load">加载账户</button>

    <p>{{ message }}</p>

    <ul>
        <li
            v-for="account in rows"
            :key="account.id"
        >
            {{ account.name }}
        </li>
    </ul>
</template>
```

启动开发服务器并点击“加载账户”，页面显示“Mock 储蓄账户”。Network 中不会因为这次调用出现 `switch-accounts.json` 请求，因为 API 函数直接返回模块内存数据。

然后将 `.env.development` 改为：

```dotenv
VITE_USE_MOCK=false
```

重启开发服务器，再点击加载。页面显示“HTTP 储蓄账户”，Network 中可以看到对 `switch-accounts.json` 的 GET 请求。

页面始终调用同一个 `getSwitchAccounts()`，返回值始终是 `Promise<Account[]>`。数据来源的差异被封装在 API 模块内部。

**切换 Mock 的关键不是文件名中有没有 mock，而是代码实际执行了哪条分支。**

本例的内存 Mock 只存在于当前页面运行期间，刷新后会重新初始化；它不是数据库，也不支持跨设备保存。

> [!EXERCISE] 环境开关写成直接判断
>
> 环境变量 `VITE_USE_MOCK=false`，代码却仍然进入 Mock 分支。怎样定位和修复？
>
> 【答案】
>
> 先查看 `import.meta.env.VITE_USE_MOCK` 的原始值和类型，确认它是非空字符串 `'false'`。如果代码直接写 `if (import.meta.env.VITE_USE_MOCK)`，字符串 `'false'` 仍然是真值。
>
> 应改为 `import.meta.env.VITE_USE_MOCK === 'true'`，并在修改环境文件后重启开发服务器。
>
> **解析：** 环境变量的字符串值不会自动转换为布尔值。判断开关时应明确约定字符串到布尔值的转换规则。


## 当日复盘与综合验收

### 今天最重要的是建立完整调用链

第四天的知识点看起来分散：Vite、模块导入、Promise、Axios、Network、Pinia、代理和环境变量。实际上，它们围绕同一个问题展开：

**页面中的一次业务操作，如何通过工程模块调用接口，取得数据并更新页面？**

以账户查询为例：

```text
index.html
    ↓
main.ts
    ↓
App.vue
    ↓ 用户点击查询
search()
    ↓
getAccounts(keyword)
    ↓
Axios GET /accounts.json
    ↓
Vite 静态资源服务 / 后端服务
    ↓
HTTP Response
    ↓
response.data
    ↓
API 函数解析并返回 Account[]
    ↓
rows.value = result
    ↓
Vue 响应式更新
    ↓
模板显示账户列表
```

如果项目使用 Axios 拦截器，请求和响应还会经过拦截器；如果请求地址以 `/api` 开头，开发环境可能经过 Vite 代理；如果多个页面需要共享当前账户，则可以把状态放入 Pinia。

因此，阅读企业项目时不要只问“这个页面在哪里”，还要问：

- 页面从哪个入口加载？
- 点击按钮后执行哪个函数？
- 这个函数调用哪个 API？
- API 使用什么 URL、方法和参数？
- 请求经过了什么配置、代理和拦截器？
- 服务器返回的真实结构是什么？
- 页面如何把返回结果写入响应式状态？
- 其他组件是否通过 Pinia 共享这份状态？

### 各知识点的职责边界

| 知识点 | 主要负责什么 | 不负责什么 |
|---|---|---|
| Vite | 开发服务器、模块处理和构建 | 不会自动创建业务接口 |
| `package.json` | 记录依赖和脚本命令 | 不直接实现页面业务 |
| `import` / `export` | 在模块之间共享代码 | 不会自动执行所有导入函数 |
| Promise | 表示未来的异步结果 | 不保证操作一定成功 |
| `async` / `await` | 组织异步函数的执行流程 | 不会把异步操作变成同步网络 |
| Axios | 发送 HTTP 请求并处理响应 | 不会替你理解业务字段含义 |
| TypeScript 泛型 | 描述代码预期的数据结构 | 不会验证真实服务器响应 |
| Network | 观察真实 HTTP 传输 | 不负责修改业务数据 |
| Pinia | 管理应用共享状态 | 不自动持久化到数据库 |
| Vite Proxy | 开发期间转发匹配的请求 | 不会自动创建后端接口 |
| 环境变量 | 按模式提供配置值 | 不会自动把字符串转成布尔值 |
| Mock | 模拟数据或接口行为 | 普通 `mock.ts` 文件不会自动成为 HTTP 服务 |

### 常见问题排查表

| 现象 | 优先检查 | 常见原因 |
|---|---|---|
| 修改页面后浏览器没有变化 | 终端目录、访问地址、入口文件 | 启动的不是当前工程 |
| `import` 找不到模块 | 导入路径、文件名大小写、别名配置 | 相对路径计算错误或工具未配置别名 |
| `await` 后得到的仍不是预期数据 | 函数返回类型、是否等待正确的 Promise | 函数返回的是 Promise 包装对象或数据层级判断错误 |
| 请求按钮点击后没有 Network 记录 | 按钮事件、处理函数、API 调用 | 请求链路尚未执行到 Axios |
| Network 出现 404 | Request URL、静态文件位置、代理路径 | 资源不存在或路径前缀不正确 |
| Network 出现 500 | Response、后端日志、请求参数 | 服务端处理失败 |
| Network 显示 200，但页面提示业务失败 | Response 中的 `code` | HTTP 成功，业务码失败 |
| `filter is not a function` | Response 数据结构 | `response.data` 不是数组 |
| 请求失败后按钮一直禁用 | `finally` | loading 没有在失败路径恢复 |
| Pinia 更新后某个组件不变化 | 是否直接解构 Store | 解构丢失响应式连接，应使用 `storeToRefs` |
| 刷新页面后 Store 恢复初始值 | 持久化方案 | Pinia 默认只保存运行时状态 |
| Mock 开关为 false 却仍进入 Mock | 环境变量原始值 | `'false'` 是非空字符串，条件判断为真 |

### 主线知识检查

完成今天的主线学习后，应当能够做到：

- 说出 `index.html → main.ts → App.vue` 的应用入口关系。
- 通过 `package.json` 判断项目如何启动和构建。
- 解释 `vite.config.ts` 的主要职责。
- 区分具名导出、默认导出和 `import type`。
- 根据当前文件位置正确计算相对导入路径。
- 解释 Promise 的 `pending`、`fulfilled` 和 `rejected` 状态。
- 解释为什么 `async` 函数总是返回 Promise。
- 说明 `await` 暂停的是当前异步函数后续语句，而不是整个页面。
- 使用 `try...catch...finally` 处理请求成功、失败和收尾。
- 使用 Axios 的 GET 和 POST 方法传递查询参数与请求体。
- 区分 AxiosResponse、`response.data` 和业务响应中的 `data`。
- 解释为什么 TypeScript 泛型不会验证真实 HTTP 响应。
- 在请求过程中正确处理 loading、空数据和错误提示。
- 使用 Network 检查 URL、Method、参数、Status 和 Response。
- 使用 Sources 断点追踪请求参数和返回结果。
- 使用 Pinia 定义 State、Getter 和 Action。
- 通过 `storeToRefs()` 保留 Store 状态的响应式连接。
- 解释 Pinia 默认不会自动持久化状态。

### 课后练习

> [!EXERCISE] 练习一：判断应用入口
>
> 一个 Vite + Vue 项目中，`index.html` 加载 `src/main.ts`，`main.ts` 导入 `App.vue` 并执行 `createApp(App).mount('#app')`。如果要查找真正的业务页面，下一步应该查看什么？
>
> 【答案】
>
> 先查看 `App.vue`。如果它直接编写业务界面，就从这里继续查找；如果它主要放置 `RouterView`，就查看路由配置，根据当前 URL 找到对应的页面组件。
>
> **解析：** `App.vue` 是根组件，但不一定是最终业务页面。使用路由时，真正的页面由路由配置决定。

> [!EXERCISE] 练习二：具名导出与默认导出
>
> 文件 `name.ts` 中有：
>
> ```ts
> export function normalizeName(value: string): string {
>     return value.trim();
> }
>
> export default function formatName(value: string): string {
>     return value.toUpperCase();
> }
> ```
>
> 下面的导入是否正确？
>
> ```ts
> import format, { normalizeName } from './name';
> ```
>
> 【答案】
>
> 正确。`normalizeName` 是具名导出，需要使用花括号并保持名称对应；默认导出可以由导入方命名为 `format`。
>
> **解析：** 具名导入对应导出的成员名称；默认导入可以自行选择本地名称。

> [!EXERCISE] 练习三：async 函数的返回值
>
> ```ts
> async function getBalance(): Promise<number> {
>     return 3200;
> }
>
> const balance = getBalance();
> ```
>
> `balance` 是数字 3200，还是 Promise？
>
> 【答案】
>
> `balance` 是 `Promise<number>`，不是数字 3200。需要在另一个异步函数中使用 `await getBalance()`，才能取得成功结果 3200。
>
> **解析：** `async` 函数总是返回 Promise。函数体中的普通返回值会成为 Promise 的成功结果。

> [!EXERCISE] 练习四：loading 应该放在哪里恢复
>
> 页面请求函数使用 `try...catch`，但只在请求成功后执行 `loading.value = false`。请求失败后可能出现什么现象？应该如何修改？
>
> 【答案】
>
> 请求失败时，`await` 抛出异常，代码跳过成功路径中的赋值，loading 可能一直为 true。应把恢复操作放入 `finally`：
>
> ```ts
> try {
>     rows.value = await getAccounts();
> } catch (error) {
>     errorMessage.value = '查询失败';
> } finally {
>     loading.value = false;
> }
> ```
>
> **解析：** `finally` 在正常完成和异常处理后都会执行，适合放置恢复 loading 等共同收尾操作。

> [!EXERCISE] 练习五：区分 Axios 响应的层级
>
> 后端返回：
>
> ```json
> {
>     "code": 0,
>     "message": "成功",
>     "data": [
>         { "id": 101, "name": "储蓄账户" }
>     ]
> }
> ```
>
> 代码：
>
> ```ts
> const response = await axios.get('/api/accounts');
> ```
>
> 整个业务响应对象在哪里？真正的账户数组在哪里？
>
> 【答案】
>
> 整个业务响应对象在 `response.data`；账户数组在 `response.data.data`。
>
> **解析：** `response` 是 AxiosResponse，第一层 `.data` 取得服务器响应体；响应体本身又有一个名为 `data` 的业务字段，因此再读取一层。

> [!EXERCISE] 练习六：HTTP 成功但业务失败
>
> Network 显示 Status 为 200，Response 中 `code` 为 1001，页面却进入 `catch`。这种情况是否矛盾？
>
> 【答案】
>
> 不矛盾。HTTP 200 代表 HTTP 层成功返回；API 函数检查到业务码不符合当前接口约定后主动抛出异常，页面的 `await` 因此进入 `catch`。
>
> **解析：** HTTP 状态码与业务状态码属于不同层次，应分别检查。

> [!EXERCISE] 练习七：Network 没有请求
>
> 点击“查询”后页面没有变化，Network 的 Fetch/XHR 中也没有请求。应该优先检查哪几处？
>
> 【答案】
>
> 先检查按钮的事件绑定、事件处理函数是否执行，以及处理函数是否调用 API 函数。确认执行到 Axios 请求后，再检查 Network。
>
> **解析：** 没有请求记录时，问题可能发生在请求链路之前。不要跳过前端事件流程，直接去修改后端接口。

> [!EXERCISE] 练习八：Pinia 共享状态
>
> 两个兄弟组件都调用 `useSharedAccountStore()`。其中一个组件通过 Action 修改账户名称，另一个组件为什么能显示新名称？
>
> 【答案】
>
> 因为两个组件在同一个 Vue 应用中使用同一个 Pinia 实例，并调用相同 Store ID 对应的 Store，所以读取的是同一份共享状态。状态变化后，另一个组件中的响应式引用也会更新。
>
> **解析：** Pinia 不是让两个组件互相调用，而是让它们访问同一个 Store。

> [!EXERCISE] 练习九：Mock 文件是否自动成为接口
>
> 项目中新增了 `src/mock/accounts.ts`，页面访问 `/api/accounts` 时是否一定会返回这个文件中的数据？
>
> 【答案】
>
> 不一定。普通 TypeScript 文件不会自动成为 HTTP 接口。它必须被页面或其他模块导入执行，或者由 Mock 插件、开发服务器中间件明确注册为接口。
>
> **解析：** 要追踪文件是否被导入、插件是否注册，以及页面实际调用的是函数还是 HTTP URL。

### 第四天学习完成的标准

不要求背下所有配置项。真正完成第四天主线的标志是：**面对一个已经存在的 Vue 页面，能够从用户操作开始，沿着事件函数、API 模块、Axios 请求、Network 响应，一直追踪到页面状态更新。**

如果遇到问题，能够先判断问题位于哪一层，再去查看对应代码，而不是在页面、接口和配置文件之间盲目修改。

### 参考资料

- [Vue 官方文档：应用实例](https://vuejs.org/guide/essentials/application.html)
- [TypeScript 官方文档：模块](https://www.typescriptlang.org/docs/handbook/2/modules.html)
- [MDN：Promise](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise)
- [MDN：async function](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Statements/async_function)
- [Axios 官方文档：实例](https://axios-http.com/docs/instance)
- [Axios 官方文档：错误处理](https://axios-http.com/docs/handling_errors)
- [Vite 官方文档：环境变量与模式](https://vite.dev/guide/env-and-mode)
- [Vite 官方文档：服务器选项](https://vite.dev/config/server-options)
- [Pinia 官方文档：核心概念](https://pinia.vuejs.org/core-concepts/)
