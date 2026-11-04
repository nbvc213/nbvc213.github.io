---
date: 2026-11-01
tags: [Vue, TypeScript, 前端开发]
description: "从 HTML、CSS、JavaScript 出发，学习 Vue 工程、单文件组件、响应式、模板指令与账户查询页面。"
draft: false
---

## 第一天学习安排

| 学习内容 | 建议时间 |
|---|---:|
| Vue、Vite 与工程启动 | 10 分钟 |
| 单文件组件、TypeScript 基础 | 15 分钟 |
| `ref()`、余额更新与点击事件 | 20 分钟 |
| 属性绑定、条件渲染 | 15 分钟 |
| `v-for`、`key` 与数组更新 | 15 分钟 |
| 表单输入与 `v-model` | 15 分钟 |
| Element Plus 基础组件 | 10 分钟 |
| 账户查询综合案例 | 15 分钟 |
| 沿数据流阅读和排查代码 | 5 分钟 |
| **合计** | **120 分钟** |

**每节先读讲解，再将完整程序复制到 `src/App.vue` 观察效果。** 这份笔记中的思考题可以在学习完对应知识后独立尝试；首次下载和安装依赖的耗时会因电脑与网络环境不同而变化。

## Vue 3 与开发工程

### 为什么已经会 HTML、CSS、JavaScript，还要学习 Vue

你已经知道，HTML 用来写页面结构，CSS 用来控制样式，JavaScript 用来处理数据和点击事件。仅用这三种技术，也能写出一个账户余额页面。例如，点击“入账”按钮时，我们先修改 JavaScript 变量，再用 `document.querySelector()` 找到页面上的余额文字，把它改成新数值。

这种方式没有错。只是当页面有账户列表、查询条件、账户状态、多个按钮时，你会发现一个麻烦：**数据变了以后，哪些页面元素需要跟着变，往往需要开发者自己逐一处理。**

Vue 是基于 JavaScript 的前端框架。你可以先把它理解成：**我们负责准备数据，并说明页面应该如何使用这些数据；数据变化以后，由 Vue 帮我们更新对应的页面。** 这叫**声明式渲染**。这里的“声明式”，意思是描述“最终要显示什么”，而不是反复编写“到哪里找到元素、再把它改成什么”的操作步骤。

例如，页面有一个余额变量 `balance`，模板写了 `{{ balance }}`，那么 Vue 就知道这个位置应该显示余额。以后只要用 Vue 的响应式方式修改 `balance`，Vue 就会安排这个位置的更新。所谓**响应式**，就是 Vue 能追踪某些数据的变化，并把变化反映到使用这些数据的界面上。

需要注意，Vue 并没有取消 HTML、CSS 或 JavaScript。相反，Vue 页面仍然使用这三种技术，只是把它们放进了更方便组织和维护的结构中。

### Vue、TypeScript、Vite 和 Element Plus 分别是什么

第一次接触 Vue 企业项目，很容易把几个名字混为一谈。实际上，它们承担的是不同工作：

| 名称 | 你可以怎样理解 | 在这个练习项目中负责什么 |
|---|---|---|
| **Vue 3** | 构建页面的框架 | 把数据、模板和用户操作联系起来 |
| **TypeScript（TS）** | 在 JavaScript 基础上增加类型检查的语言 | 帮助我们检查余额是不是数字、函数参数是不是正确类型 |
| **Vite** | 前端开发与构建工具 | 启动本地开发服务、处理 `.vue` 文件、生成可部署的前端资源 |
| **Element Plus** | 基于 Vue 3 的 UI 组件库 | 提供现成的按钮、输入框、标签和空状态组件 |
| **Node.js** | 可以在电脑上运行 JavaScript 的运行环境 | 让 Vite 等开发工具在本地运行 |
| **npm** | Node.js 常用的包管理工具 | 安装 Vue、Element Plus 等项目依赖 |

这里的**组件库**，指的是一套已经封装好的页面部件。比如 Element Plus 的 `<el-button>` 就是现成的按钮组件，不需要每次都从零写按钮样式。**依赖**是项目运行或构建时要使用的第三方软件包，通常由 `npm install` 安装。

还有两个经常出现在企业项目中的名字：Pinia 用于在多个组件之间管理共享状态，Vue Router 用于管理页面路由（根据地址显示不同页面）。它们不负责今天这个单页面的基本数据更新，暂时不需要安装和配置。

### 创建第一个 Vue + TypeScript 项目

先在电脑上安装 Node.js。打开 Windows PowerShell，分别执行：

```powershell
node -v
npm.cmd -v
```

`-v` 表示查看版本。执行成功后，会显示相应版本号。按照当前 Vite 的要求，Node.js 需要满足 `20.19+` 或 `22.12+` 等受支持版本范围；如果创建工具提示版本不符合要求，应优先升级 Node.js。

找一个存放练习代码的目录，执行：

```powershell
npm.cmd create vite@latest vue-practice -- --template vue-ts
cd vue-practice
npm.cmd install
npm.cmd install element-plus
npm.cmd run dev
```

不要把这些命令当成需要死记的咒语，我们逐个看：

1. `npm.cmd create vite@latest vue-practice -- --template vue-ts`：调用最新的 Vite 项目创建工具，创建名为 `vue-practice` 的文件夹。`--template vue-ts` 指定项目模板为“Vue + TypeScript”；其中额外的 `--` 用于把后面的参数传给项目创建工具。
2. `cd vue-practice`：进入刚创建的项目目录，`cd` 是命令行里切换目录的命令。
3. `npm.cmd install`：读取 `package.json` 里的依赖信息并安装所需软件包，通常会生成 `node_modules` 文件夹和 `package-lock.json` 锁定文件。
4. `npm.cmd install element-plus`：给项目额外安装 Element Plus 组件库。
5. `npm.cmd run dev`：执行项目里定义的开发命令，启动 Vite 本地服务。

这里使用 `npm.cmd` 是为了兼容某些 Windows PowerShell 对 `npm.ps1` 的脚本执行限制；如果你的终端中 `npm` 可以正常运行，写 `npm` 也可以。

终端会显示一个本地访问地址，例如 `http://localhost:5173/`。`localhost` 表示你当前使用的这台电脑，`5173` 是常见的开发端口；**实际以终端显示的地址为准**。浏览器打开它，就能看见页面。

开发服务运行时，改动源文件并保存，Vite 会尽量将修改快速反映到浏览器。这项功能称为**热更新（HMR）**。它帮助你观察代码修改的效果，但**源文件保存后页面变了**，不等于这个变量在运行期间已经具有 Vue 的响应式能力，这两件事要分清。

### 认识项目中的几个关键文件

创建完成后，可以先关注这几个位置：

```text
vue-practice/
├── index.html             # 浏览器加载的 HTML 入口
├── package.json           # 项目脚本与依赖信息
├── vite.config.ts         # Vite 配置文件
├── src/
│   ├── main.ts            # Vue 应用启动入口
│   └── App.vue            # 根组件，也是今天练习的页面
└── node_modules/          # npm 安装的依赖
```

`index.html` 里会有一个类似 `<div id="app"></div>` 的元素。你可以把它看作 Vue 页面在 HTML 里占用的位置，称为**挂载容器**。`src/main.ts` 负责创建 Vue 应用，并把它挂载到这个元素中；`App.vue` 则描述具体显示什么。

`package.json` 是项目配置文件，其中的 `scripts` 定义可执行的命令。比如 `npm.cmd run dev` 就是在运行 `scripts` 中名为 `dev` 的任务。`vite.config.ts` 用来调整 Vite 的开发服务、插件等配置；今天不需要改它。

#### 完整程序：让 Vue 显示第一个银行页面

**文件一：`src/main.ts`。** 用下面的代码完整替换该文件：

```ts
// 从 Vue 中导入创建应用的函数
import { createApp } from 'vue';

// 导入 Element Plus 组件库和它的样式
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';

// 导入我们自己的根组件
import App from './App.vue';

// 创建 Vue 应用，注册 Element Plus，然后挂载到 index.html 的 #app 元素
createApp(App).use(ElementPlus).mount('#app');
```

这里的 `import` 是 JavaScript 模块语法，用来使用另一个文件或软件包导出的内容。`import { createApp }` 中的花括号表示**具名导入**，即按照导出的名称导入函数；`import App` 则使用**默认导入**。`'./App.vue'` 中的 `./` 表示从当前文件所在目录开始找。

`createApp(App)` 创建一个以 `App` 为根组件的 Vue 应用；`.use(ElementPlus)` 将 Element Plus 注册给这个应用；`.mount('#app')` 把应用显示到 `id="app"` 的 HTML 容器里。这里的点号是 JavaScript 访问对象方法的语法，并不是三个互不相关的命令。

**文件二：`src/App.vue`。** 用下面的代码完整替换该文件：

```vue
<script setup lang="ts">
// 页面中的一个普通字符串
const pageTitle: string = '个人网银账户中心';
</script>

<template>
  <main class="page">
    <h1>{{ pageTitle }}</h1>
    <p>我的第一个 Vue 页面已经运行成功。</p>
    <el-button type="primary">账户查询</el-button>
  </main>
</template>

<style scoped>
.page {
  padding: 24px;
}
</style>
```

运行结果应该包含标题“个人网银账户中心”、一行说明文字和一个带有 Element Plus 样式的按钮。这个按钮现在还不能查询，因为**显示一个按钮**和**给按钮编写业务行为**是两回事，后面才会给它绑定事件。

> [!NOTE] 后面所有完整程序怎样运行
>
> 后续每个小节的“完整程序”都可以**单独替换 `src/App.vue` 的全部内容**，而 `src/main.ts` 保持上面的版本即可。一次只运行一个示例，不要把多个 `<script setup>` 连续粘贴到同一个文件里。首次安装项目只需要做一次；以后在项目目录运行 `npm.cmd run dev` 即可。按 `Ctrl+C` 可以停止开发服务。

## Vue 单文件组件与 TypeScript 入门

### `.vue` 文件为什么同时有三种代码

在原生网页开发中，你已经见过 HTML、CSS 和 JavaScript 有时写在不同文件里。Vue 也能将它们分开，不过 Vue 还提供**单文件组件（Single-File Component，简称 SFC）**：把一个界面单元的结构、逻辑、样式组织到同一个 `.vue` 文件中。

**组件（Component）**可以理解为页面上的一个相对独立的功能块。例如：整个账户查询页面可以是一个组件，页面里的账户卡片也可以单独做成组件。今天只写一个 `App.vue`，所以还不涉及组件之间的数据传递。

一个常见的 Vue 组件有三部分：

```vue
<script setup lang="ts">
// 数据和处理函数
</script>

<template>
  <!-- 页面显示的 HTML 结构 -->
</template>

<style scoped>
/* 当前组件使用的 CSS 样式 */
</style>
```

`<template>` 是**模板**，主要负责描述界面结构。你可以把它理解为“带有 Vue 特殊语法的 HTML”。`<script setup lang="ts">` 放数据与函数，相当于我们熟悉的 JavaScript 逻辑区域，不过这里启用了 TypeScript。`<style scoped>` 放 CSS，`scoped` 告诉 Vue 为组件样式添加作用域标记，降低样式意外影响其他组件的概率；它不等于完全隔离的 Shadow DOM。

### `<script setup lang="ts">` 到底是什么意思

这段写法里的三个部分分别有含义。

`script` 表示脚本区域。`lang="ts"` 表示其中采用 TypeScript 语法。`setup` 是 Vue 3 的一种简化写法，让我们可以在脚本顶层直接定义变量、函数，并在同一个组件的模板中使用，而不用额外写一个返回对象。

这里会接触到 **组合式 API（Composition API）** 一词。API 可以简单理解为框架提供给开发者调用的功能。组合式 API 就是 Vue 3 提供的一组用于组织状态、计算结果和其他组件逻辑的函数，比如稍后会用到的 `ref()`。现在不需要与其他组件写法比较，只要认得 `<script setup>` 是企业 Vue 3 项目里很常见的形式。

### TypeScript 最基础的四种写法

TypeScript 是在 JavaScript 语法上增加类型检查能力的语言。比如余额应该是数字，如果你不小心把它写成字符串，TypeScript 可以在开发阶段提醒你。**类型检查主要发生在开发和构建阶段，不代表程序运行时会自动检查所有外部数据。**

先比较两行代码：

```ts
const balance = 5000;
const accountName: string = '工资账户';
```

第一行没有显式写类型，但 TypeScript 能根据初始值推断 `balance` 是数字。第二行的 `: string` 是**类型标注**，明确要求 `accountName` 是字符串。这些类型标注不会作为 JavaScript 运行逻辑保留下来。

| 类型 | 含义 | 例子 |
|---|---|---|
| `string` | 字符串 | `'工资账户'` |
| `number` | 数字，包括整数和小数 | `3200`、`12.5` |
| `boolean` | 只有 `true` 或 `false` 两种值 | `true` |
| `void` | 函数没有需要交给调用者使用的返回值 | `function handleClick(): void { ... }` |

注意，`void` 通常出现在函数返回值的位置。比如 `function changeName(): void` 中，冒号后面的 `void` 描述这个函数的返回类型；而 `function changeName()` 中没有写返回类型时，TypeScript 可以根据函数内容推断。

### 模板怎样读取脚本中的变量

要把脚本数据显示到页面上，最常见的写法是 **文本插值**：`{{ 表达式 }}`。这里的双大括号是 Vue 的模板语法，不是普通 HTML 语法。

例如，模板里的 `{{ accountName }}` 会读取脚本变量 `accountName` 的值。大括号内也可以放能够计算出结果的 JavaScript **表达式**，例如 `balance + 100`，但不能直接在其中声明 `const` 变量或编写多行 `if` 语句。

如果你看到 `{{ balance.toFixed(2) }}`，要知道 `toFixed(2)` 是 JavaScript 数字的方法，用于把数值格式化为保留两位小数的**字符串**。它不修改原来的数字。

#### 完整程序：账户信息卡片

**文件：`src/App.vue`**

```vue
<script setup lang="ts">
// TypeScript 能根据初始值判断这两个变量的类型
const accountName = '工资账户';
const balance: number = 5280.5;
const isActive: boolean = true;
</script>

<template>
  <section class="account-card">
    <h2>账户信息</h2>
    <p>账户名称：{{ accountName }}</p>
    <p>账户余额：{{ balance.toFixed(2) }} 元</p>
    <p>可用余额（示例计算）：{{ (balance - 100).toFixed(2) }} 元</p>
    <p>是否启用：{{ isActive ? '是' : '否' }}</p>
  </section>
</template>

<style scoped>
.account-card {
  max-width: 420px;
  padding: 20px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
}
</style>
```

这个例子把三部分联系起来了：脚本准备账户数据，模板决定数据出现在哪个位置，样式设置卡片外观。`isActive ? '是' : '否'` 使用了你在 JavaScript 中可能见过的**三元运算符**：条件成立就取问号后第一个值，不成立就取冒号后的值。

试着把脚本中的 `balance` 改成 `1000` 并保存，你会看到页面显示变化。这一次是因为 Vite 在开发期间重新加载了你修改的代码。接下来，我们要实现的是：**不改源文件，只点击页面按钮，也能让数值变化并刷新页面。**

> [!EXERCISE] 读代码
>
> 如果把 `isActive` 改成 `false`，页面上的“是否启用”会显示什么？先根据三元运算符判断，再去浏览器验证。

## 响应式数据与点击事件

### 为什么普通 JavaScript 变量还不够

看一个熟悉的 JavaScript 片段：

```ts
let balance = 5000;
balance -= 100;
```

这两行代码当然可以把 `balance` 改成 `4900`。问题在于：**普通变量的值改变，不会因为模板里显示了这个变量，Vue 就自动追踪到这次普通变量赋值。**

为了让余额变化能驱动页面更新，我们要使用 Vue 的 `ref()` 函数。`ref` 来自英文 reference，这里可以先理解为 Vue 提供的一种“装着数据、又能通知界面更新”的响应式容器。

### `ref()` 创建的究竟是什么

先看代码：

```ts
import { ref } from 'vue';

const balance = ref<number>(5000);
```

第一行从 `vue` 软件包导入 `ref` 函数；只有导入后，才能在这个脚本中使用它。第二行调用 `ref()`，初始值为 `5000`。

`<number>` 是 TypeScript 的**类型参数**：我们在调用一个支持泛型的函数时，把希望它处理的数据类型写在尖括号里。`ref<number>(5000)` 告诉 TypeScript，这个响应式容器保存数字。**泛型（Generic）**可以先理解为“让函数或数据结构可以指定自己处理的类型”。今天记住这个具体用法即可。如果写成 `ref(5000)`，TypeScript 也能根据初始值推断出数字类型。

关键是：`ref()` 返回的不是直接等于 `5000` 的数字，而是一个 Vue 管理的响应式对象。对象内部使用 `.value` 保存数据。因此，在脚本里写：

```ts
balance.value = 4900;     // 设置新余额
balance.value -= 100;    // 在现有余额上再扣 100
console.log(balance.value); // 此时输出 4800
```

这里的 `.value` 是访问对象属性的普通 JavaScript 点号语法。`balance.value -= 100` 相当于把“原来的值减去 100”重新保存到 `value` 属性中。虽然 `balance` 用 `const` 声明，不能把 `balance` 这个变量重新指向另一个对象，**但可以修改它所引用对象的 `value` 属性**。

### 为什么脚本写 `.value`，模板却不写

下面是刚开始学习 Vue 时最容易混淆的一点：

| 位置 | 正确写法 | 原因 |
|---|---|---|
| `<script setup>` 中 | `balance.value` | 需要读取 `ref` 对象内部保存的值 |
| `<template>` 中 | `{{ balance }}` | Vue 会自动解开模板中的顶层 `ref`，取出其值 |
| `<template>` 中 | `{{ balance.toFixed(2) }}` | 这里的 `balance` 已经被当作数字使用 |

这个自动取值的行为叫作**模板自动解包**。先记住今天使用的顶层 `ref` 写法，不要由此推断所有嵌套在普通对象里的 `ref` 都按完全相同的规则解包。

### 用 `@click` 告诉 Vue：按钮被点击后要做什么

你以前可能写过 `addEventListener('click', ...)`。Vue 提供了更直接的模板写法：

```vue
<button @click="handleDeposit">模拟入账</button>
```

`@click` 是 `v-on:click` 的简写，意思是“监听这个元素的点击事件”。`handleDeposit` 是脚本里定义的函数名，**点击时才调用它**。你还可以写 `@click="handleDeposit(200)"`，把数字 `200` 作为参数传进函数。这里虽然出现括号，也仍然是点击时执行，不是页面刚加载就执行。

在 TypeScript 中，函数参数可标明类型：

```ts
function handleDeposit(amount: number): void {
  balance.value += amount;
}
```

`amount: number` 表示参数 `amount` 应当是数字；函数名后面的 `: void` 表示没有需要返回给调用者的结果。`+=` 是 JavaScript 的复合赋值运算符，`a += b` 相当于 `a = a + b`。

#### 完整程序：点击按钮修改余额

**文件：`src/App.vue`**

```vue
<script setup lang="ts">
import { ref } from 'vue';

// 初始余额 5000 元，使用 ref 使其成为响应式数据
const balance = ref<number>(5000);

// 接收一笔入账金额，并加到账户余额中
function handleDeposit(amount: number): void {
  balance.value += amount;
}

// 接收一笔付款金额；余额足够时才进行扣减
function handlePay(amount: number): void {
  if (balance.value < amount) {
    return; // 余额不足时结束函数，不再执行下面的扣款
  }

  balance.value -= amount;
}
</script>

<template>
  <section class="account-card">
    <h2>账户余额</h2>
    <p class="amount">{{ balance.toFixed(2) }} 元</p>

    <button @click="handleDeposit(200)">模拟入账 200 元</button>
    <button @click="handlePay(100)">模拟付款 100 元</button>
  </section>
</template>

<style scoped>
.account-card {
  padding: 24px;
}
.amount {
  font-size: 28px;
  font-weight: bold;
}
button {
  margin-right: 12px;
  padding: 8px 12px;
}
</style>
```

你可以按这个顺序观察代码执行：页面打开时，脚本创建余额为 `5000` 的 `ref`；模板读取它，显示 `5000.00 元`。点击“入账 200 元”，Vue 通过 `@click` 调用 `handleDeposit(200)`，函数把 `balance.value` 改成 `5200`；随后 Vue 更新页面中依赖余额的文字。

这里还出现了 `if` 和 `return`。`if (balance.value < amount)` 用于判断余额是否小于付款金额；`return` 在这里的作用是**立即结束当前函数**。这样即使以后按钮没有禁用，也不会仅凭页面按钮的样式就允许余额不足时扣款。

> [!NOTE] 状态改变与 DOM 更新不是完全相同的时刻
>
> `balance.value += amount` 执行完成后，脚本立刻能读到新余额；Vue 会安排相关 DOM 更新并进行批处理。因此，**数据赋值是当前代码执行过程的一部分，页面 DOM 更新则由 Vue 调度**。今天只需要理解这一区别，不需要学习更新调度的底层实现。

> [!EXERCISE] 先预测，再运行
>
> 余额从 5000 元开始，先点击两次“模拟入账 200 元”，再点击一次“模拟付款 100 元”。请自己算出页面最后的金额，并说出究竟是哪一句代码修改了余额。

## 属性绑定与条件渲染

### 插值只负责文本；改变 HTML 属性要用 `v-bind`

到目前为止，你已经会用 `{{ balance }}` 显示余额。但是企业页面不仅要显示文字，还要根据数据改变按钮是否可点击、输入框是否禁用、元素使用什么样式等。

例如，余额不足 100 元时，付款按钮应该禁用。原生 HTML 的 `disabled` 是**布尔属性**，只要属性存在，按钮就被禁用。下面这句不会因为写了字符串 `false` 就启用按钮：

```html
<button disabled="false">付款</button>
```

想让 Vue 根据 JavaScript 表达式的真假动态控制这个属性，应该写成：

```vue
<button :disabled="balance < 100">付款</button>
```

这里的 `:` 是 `v-bind:` 的简写，`v-bind` 是 Vue 的**指令**。指令可以理解为“Vue 在 HTML 属性位置额外提供的一种特殊语法”。`:disabled="balance < 100"` 表示先计算余额是否小于 `100`，得到 `true` 或 `false`，再根据结果控制 `disabled`。

不要把 `:disabled` 和 `disabled="balance < 100"` 混为一谈。后者没有冒号，写进去的是普通 HTML 属性文本，浏览器不会把字符串 `balance < 100` 当作 Vue 表达式执行。

`v-bind` 还可以用于普通属性。例如 `:title="accountName"` 会把变量内容绑定为元素的 `title` 属性。**属性值随数据更新而更新**，并不是初始化时只赋值一次。

### `v-if`、`v-else`：决定页面上有没有这个元素

有些业务信息不只是禁用，而是需要根据条件决定是否出现。例如账户已销户时，不展示余额信息。Vue 可以写成：

```vue
<p v-if="hasAccount">账户存在</p>
<p v-else>账户不存在</p>
```

`v-if` 的表达式为 `true` 时，Vue 渲染第一个元素；为 `false` 时，不渲染这个分支。`v-else` 表示“否则”，必须紧跟它所属的 `v-if` 或 `v-else-if` 分支。只有你确实需要“否则展示什么”时，才要写 `v-else`；**`v-if` 单独使用也是正确的。**

如果是多个状态，可以使用 `v-else-if`：

```vue
<p v-if="status === 'normal'">账户正常</p>
<p v-else-if="status === 'frozen'">账户冻结</p>
<p v-else>其他状态</p>
```

这里的 `===` 是 JavaScript 的严格相等运算符，判断两个值是否相同而不进行宽松的类型转换。Vue 按顺序判断这些分支，最终渲染符合条件的分支。

### `v-show`：元素还在，只是暂时隐藏

另一种写法是：

```vue
<p v-show="showBalance">账户余额：5000 元</p>
```

`v-show` 不负责创建或销毁这段内容，而是根据条件调整元素的 CSS `display` 样式。条件为 `false` 时，这个元素仍在浏览器的 DOM（文档对象模型，即浏览器表示网页元素的结构）中，只是不显示。

你可以这样区分：

| 指令 | 条件为 `false` 时 | 典型场景 |
|---|---|---|
| `v-if` | 对应内容不在当前渲染的 DOM 中 | 是否有账户、是否显示查询结果区 |
| `v-show` | 元素仍在 DOM 中，通过 CSS 隐藏 | 经常展开或收起的余额说明 |

需要特别注意：`v-show` 只是显示控制，**不能用于保护敏感信息**。真实个人网银的账户信息保护还要依赖服务端的身份认证和授权，而不是仅靠前端隐藏元素。

#### 完整程序：禁用付款、关闭账户和切换余额

**文件：`src/App.vue`**

```vue
<script setup lang="ts">
import { ref } from 'vue';

// 三个状态分别控制：余额数值、账户是否存在、余额是否可见
const balance = ref<number>(150);
const hasAccount = ref<boolean>(true);
const showBalance = ref<boolean>(true);

function handlePay(): void {
  // 即使按钮已经禁用，函数也保留余额检查
  if (!hasAccount.value || balance.value < 100) {
    return;
  }

  balance.value -= 100;
}

function toggleBalance(): void {
  // ! 代表逻辑取反：true 变 false，false 变 true
  showBalance.value = !showBalance.value;
}

function closeAccount(): void {
  hasAccount.value = false;
}

function reopenAccount(): void {
  hasAccount.value = true;
  showBalance.value = true;
}
</script>

<template>
  <section class="account-card">
    <h2>账户管理</h2>

    <div v-if="hasAccount">
      <p>账户状态：正常</p>

      <p v-show="showBalance">余额：{{ balance }} 元</p>

      <button @click="toggleBalance">显示 / 隐藏余额</button>
      <button :disabled="balance < 100" @click="handlePay">
        支付 100 元
      </button>
      <button @click="closeAccount">模拟关闭账户</button>
    </div>

    <div v-else>
      <p>暂无可用账户。</p>
      <button @click="reopenAccount">模拟重新开通</button>
    </div>
  </section>
</template>

<style scoped>
.account-card {
  padding: 24px;
}
button {
  margin: 4px 8px 4px 0;
  padding: 8px;
}
button:disabled {
  cursor: not-allowed;
}
</style>
```

运行后，先不要急着点击所有按钮。先看 `hasAccount`、`showBalance`、`balance` 各负责什么：`hasAccount` 决定账户区域是否存在，`showBalance` 只控制余额文字的显示，`balance` 则决定金额以及付款按钮的禁用状态。

初始余额为 150 元，支付一次后余额变成 50 元。这时 `:disabled="balance < 100"` 会重新计算为 `true`，按钮被禁用，而余额的文字也随同一份响应式数据更新。**你没有分别写“刷新余额”和“禁用按钮”的 DOM 操作，因为两个地方都声明了自己依赖余额。**

代码里还使用了 `!` 运算符：`!hasAccount.value` 的意思是“账户不存在”，`!showBalance.value` 用于在显示和隐藏之间切换。

> [!EXERCISE] 比较两种隐藏方式
>
> 先点击“显示 / 隐藏余额”，再点击“模拟关闭账户”。这两次操作对页面结构有什么不同？试着分别用 `v-show` 和 `v-if` 解释，而不是只说“文字看不到了”。

## 列表渲染与响应式数组

### 为什么不能给每个账户都手写一段 HTML

之前的例子只有一个账户，所以在模板中写一段 `<p>` 就够了。但在真实的账户查询页面中，客户可能有一个账户、三个账户，或者没有账户。我们不可能根据账户数量反复修改源代码、手工复制 HTML。

你已经学过 JavaScript 数组，可以把多个账户表示为一个数组：

```ts
const accounts = [
  { id: 101, name: '储蓄账户', balance: 5000 },
  { id: 102, name: '工资账户', balance: 8000 }
];
```

数组外面是 `[]`，每个 `{ ... }` 是一个 JavaScript 对象。对象中的 `id`、`name`、`balance` 是属性；例如 `accounts[0].name` 读取第一条账户的名称。这里的 `id` 是我们模拟的业务标识，不是银行真实账户号码。

Vue 提供 `v-for` 指令，把一个数组里的多条记录转换为重复的页面结构。

### `v-for="account in accounts"` 怎样读

```vue
<div v-for="account in accounts" :key="account.id">
  {{ account.name }}：{{ account.balance }} 元
</div>
```

读这句话时，可以按“从 `accounts` 数组中依次取出一个 `account`，为每个账户生成一个 `<div>`”来理解。

- `accounts` 是整个数组。
- `account` 是这次遍历中取到的单个账户对象，相当于 JavaScript `forEach()` 中的当前元素。
- `account.name` 和 `account.balance` 读取当前账户的属性。
- 当数组有两条记录时，这个模板就会生成两行；数组为空时，它不会生成账户行。

如果还需要显示序号，可以写 `v-for="(account, index) in accounts"`。`index` 是数组下标，从 `0` 开始，所以界面序号通常显示 `index + 1`。

### `:key="account.id"` 为什么不能随便删掉

你应该注意到了 `v-for` 旁边的 `:key`。`key` 是 Vue 用来标识列表中每个节点**身份**的特殊属性。可以把它想成“这个页面行对应哪个账户”的标签。

比如账户 101 和 102 之间，插入一个新账户后，原来排在第二行的账户可能变成第三行。**位置会变，账户 ID 不会因为换了位置就改变。** 因此，业务列表通常用稳定且唯一的账户 ID 作为 `key`。

不推荐在会删除、插入或调整顺序的列表中使用 `:key="index"`。原因是下标仅代表当前位置；删除第一条后，后面各条记录的下标都会变化。Vue 可能根据旧位置复用 DOM 节点；如果其中包含用户输入的文本或子组件状态，就容易发生状态错位。

这里的“唯一”是说**同一组列表中的兄弟节点不能使用重复的 key**；不要求整个系统所有页面都使用同一套编号。

### 怎样往响应式数组里添加和删除记录

当一个数组需要改变，并让页面列表跟着更新时，也可以用 `ref()` 保存它：

```ts
const accounts = ref([
  { id: 101, name: '储蓄账户', balance: 5000 }
]);
```

脚本里访问这个数组仍要写 `accounts.value`，而模板里可以直接写 `accounts`，因为它是顶层 `ref`。

你在 JavaScript 中已经可以使用数组方法。这里最需要区分的是：

| 方法 | 是否修改原数组 | 用来做什么 |
|---|---|---|
| `push(item)` | 是 | 在数组末尾添加一条记录 |
| `splice(start, count)` | 是 | 从指定下标开始删除一定数量的记录，也可插入 |
| `filter(callback)` | 否 | 根据回调函数的判断结果生成一个新数组 |

`filter()` 接收一个**回调函数**（传给另一个函数、由它逐个调用的函数）。对每条记录，回调返回 `true` 就保留，返回 `false` 就排除。例如：

```ts
accounts.value = accounts.value.filter(
  account => account.id !== 101
);
```

`account => account.id !== 101` 是 JavaScript 的**箭头函数**。它接收当前的 `account`，判断 ID 是否不等于 101；`!==` 表示严格不等于。`filter()` 把符合条件的记录放进新数组，再通过 `accounts.value = ...` 将这个新数组保存为页面使用的数据。

**如果只执行 `accounts.value.filter(...)`，却不接收它返回的新数组，原来的列表就不会因此被删除。** 这是企业页面查询和删除逻辑里非常常见的错误。

#### 完整程序：新增和删除账户

**文件：`src/App.vue`**

```vue
<script setup lang="ts">
import { ref } from 'vue';

// 初始账户列表：每个账户都有稳定且唯一的 id
const accounts = ref([
  { id: 101, name: '储蓄账户', balance: 5000 },
  { id: 102, name: '工资账户', balance: 8000 }
]);

// 下次新增账户使用的 ID。这里只用于生成模拟数据
let nextId = 103;

function addAccount(): void {
  // push 会把新账户加入当前响应式数组
  accounts.value.push({
    id: nextId,
    name: `模拟账户${nextId}`,
    balance: 1000
  });

  // ID 加一，避免连续新增时出现重复 key
  nextId += 1;
}

function deleteAccount(id: number): void {
  // filter 返回一个新数组：保留 ID 不等于指定值的账户
  accounts.value = accounts.value.filter(
    account => account.id !== id
  );
}
</script>

<template>
  <section class="page">
    <h2>账户列表</h2>
    <p>当前有 {{ accounts.length }} 个账户</p>

    <p v-if="accounts.length === 0">暂无账户</p>

    <div
      v-for="(account, index) in accounts"
      :key="account.id"
      class="account-row"
    >
      <span>
        {{ index + 1 }}. {{ account.name }}：{{ account.balance }} 元
      </span>
      <button @click="deleteAccount(account.id)">删除</button>
    </div>

    <button @click="addAccount">新增模拟账户</button>
  </section>
</template>

<style scoped>
.page {
  padding: 24px;
  max-width: 620px;
}
.account-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #ddd;
  padding: 12px 0;
}
button {
  margin: 8px;
  padding: 6px 12px;
}
</style>
```

这里出现了一种 JavaScript 字符串写法：`` `模拟账户${nextId}` ``。外层的反引号创建**模板字符串**，`${nextId}` 把变量的值插入字符串。例如 `nextId` 为 103 时，生成的名称就是“模拟账户103”。

注意 `nextId` 使用了普通 `let`，而不是 `ref()`。这是因为它只在新增函数内部帮助生成编号，**模板没有读取 `nextId`**，所以不需要利用它驱动视图。真正需要驱动列表更新的是 `accounts`，因此它必须是响应式数据。

你可以先新增两次，再删除原来的工资账户，观察列表数量、账户名称和序号是否同步变化。`v-for` 和 `{{ accounts.length }}` 都读取同一个响应式数组，所以 Vue 能根据数组变化更新两处页面。

> [!EXERCISE] 找到决定页面变化的那一行
>
> 如果把 `deleteAccount()` 里的 `accounts.value =` 删除，只保留 `accounts.value.filter(...)`，点击删除按钮后会发生什么？先根据 `filter()` 是否修改原数组来推断，再修改代码验证。

## 表单输入与 `v-model`

### 为什么输入框需要专门的数据绑定

账户查询不能只靠固定按钮，用户还要自己输入查询条件。例如，输入“工资”后点击查询，页面只显示名称中包含“工资”的账户。

这件事至少涉及两个位置：一处是浏览器里的输入框，另一处是 Vue 脚本里的查询条件。如果只在 HTML 中写 `<input>`，浏览器当然允许用户输入文字，但 Vue 脚本中的变量不会因此自动得到新内容。

`v-model` 就是用来解决**表单输入与数据之间同步**问题的 Vue 指令。

### `v-model` 的“双向”是什么意思

假设有一条响应式数据：

```ts
const queryName = ref<string>('');
```

`''` 是空字符串，代表现在还没有输入查询条件。模板写：

```vue
<input v-model="queryName" />
```

那么会建立两个方向的关系：

1. **数据到输入框**：如果脚本执行 `queryName.value = '工资'`，输入框会显示“工资”。
2. **输入框到数据**：如果用户在输入框中输入“理财”，Vue 会把输入同步到 `queryName.value`。

所以，`v-model` 可以简单理解为：数据改变，输入框跟着变；用户输入，数据也跟着变。它**不负责创建响应式变量**——变量还是由 `ref()` 创建。

此外，`v-model` 也不会自动执行“查询业务”。**输入文字**只是更新查询条件，**点击查询**才应该调用查询函数；除非你在业务代码里专门设计了实时查询机制。

### `v-model` 和 `:value` 不一样

这是第一天必须弄清楚的区别。

```vue
<input :value="queryName" />
<input v-model="queryName" />
```

第一行的 `:value` 只建立**数据到输入框**的属性绑定。用户仍然能在这个普通输入框里手动输入文字，但**这些文字不会自动写回 `queryName.value`**。如果之后脚本修改了 `queryName.value`，输入框又会根据新的绑定值更新。

第二行的 `v-model` 则在显示数据的同时，也处理用户输入后写回数据的工作。对原生文本输入框来说，可以从概念上理解为 `:value` 加上监听 `input` 事件；Vue 帮你把常用的这两件事封装成了一条指令。

这样区分更准确：

| 写法 | 数据修改后，输入框更新吗 | 用户输入后，Vue 数据更新吗 |
|---|---|---|
| `:value="queryName"` | 是 | 否，需要额外处理输入事件 |
| `v-model="queryName"` | 是 | 是 |

在 `<script setup>` 中修改数据时，仍然要使用 `.value`；在模板中的 `v-model="queryName"` 不需要写 `.value`。

#### 完整程序：对照两种绑定方式

**文件：`src/App.vue`**

```vue
<script setup lang="ts">
import { ref } from 'vue';

// 唯一真正保存查询条件的响应式变量
const queryName = ref<string>('工资');

function setDefaultName(): void {
  // 修改响应式数据，两种绑定的输入框都会收到新值
  queryName.value = '储蓄';
}

function clearName(): void {
  // v-model 输入框会随变量一起清空
  queryName.value = '';
}
</script>

<template>
  <section class="page">
    <h2>输入框绑定实验</h2>

    <p>第一个输入框使用 v-model：</p>
    <input v-model="queryName" placeholder="请输入账户名称" />

    <p>第二个输入框只使用 :value：</p>
    <input :value="queryName" placeholder="这里也可以输入，但不写回变量" />

    <p>Vue 当前保存的查询条件：{{ queryName }}</p>

    <button @click="setDefaultName">把条件设置为“储蓄”</button>
    <button @click="clearName">清空条件</button>
  </section>
</template>

<style scoped>
.page {
  padding: 24px;
}
input {
  display: block;
  width: 320px;
  box-sizing: border-box;
  padding: 8px;
}
button {
  margin: 14px 8px 0 0;
  padding: 8px;
}
</style>
```

按照下面的顺序亲自操作，会比只背“双向绑定”这个词更有用：

1. 在第一个输入框中把“工资”改为“理财”。观察第二个输入框和下面的文本，两者也会跟着显示“理财”。
2. 再把第二个输入框手动改成“活期”。你会看到第二个输入框可以暂时显示“活期”，但下面保存的查询条件仍是“理财”，第一个输入框也没有变化。
3. 点击“把条件设置为‘储蓄’”。脚本修改 `queryName.value`，两个输入框都显示“储蓄”。
4. 点击“清空条件”。`queryName.value` 变成空字符串，两个输入框和页面文本一同更新。

到这里，你应该能够回答一个企业项目里的实际问题：**为什么输入框里明明有文字，点击查询却使用了旧条件？** 一个需要检查的原因，就是这个输入框可能只使用了 `:value`，没有把用户输入写回查询状态。

> [!EXERCISE] 修改一个业务行为
>
> 现在增加一个“设置为理财”按钮，让它点击后把查询条件设置为“理财”。先模仿 `setDefaultName()` 自己添加函数和按钮，再运行验证。重点观察脚本中为什么要写 `.value`。

## Element Plus 基础组件

### 原生 HTML 和组件库的关系

我们前面的例子使用 `<button>`、`<input>`，它们都是 HTML 原生元素。真实企业页面往往希望按钮、输入框、状态标记具有一致的样式和交互效果，这时可以使用 Element Plus 提供的现成组件。

例如，原生按钮写 `<button>`，Element Plus 按钮则写 `<el-button>`。后者不是浏览器原生 HTML 元素，而是 Element Plus 已经开发好的 **Vue 组件**。

在 `src/main.ts` 中，我们已经使用 `.use(ElementPlus)` 注册组件库，并且导入了 `element-plus/dist/index.css` 样式，所以当前练习可以直接在模板中使用这些组件。

### 常用组件及其属性

今天只需要认识四个组件：

| 组件 | 作用 | 例子 |
|---|---|---|
| `<el-button>` | 按钮 | `<el-button type="primary">查询</el-button>` |
| `<el-input>` | 输入框 | `<el-input v-model="queryName" />` |
| `<el-tag>` | 状态标签 | `<el-tag type="success">正常</el-tag>` |
| `<el-empty>` | 没有数据时的空状态 | `<el-empty description="暂无账户" />` |

组件标签上的 `type`、`description` 叫作**组件属性（Prop）**，可以先理解为“使用组件时传给它的配置值”。`type="primary"` 表示主按钮样式，`type="danger"` 表示危险操作的视觉样式，`type="success"` 常用于成功或正常状态。它们改变组件的外观，**不会自动实现查询、删除或业务校验**。

`description="暂无账户"` 用来指定空状态组件显示的提示文字。像 `<el-input ... />` 这样末尾写 `/>`，是单文件组件模板中允许的自闭合写法；如果你更习惯，也可以写成 `<el-input ...></el-input>`。

Element Plus 仍然使用 Vue 的常见模板语法：

- 给按钮绑定点击事件，写 `@click="handleQuery"`。
- 让输入框和响应式变量同步，写 `v-model="queryName"`。
- 根据当前数据禁用组件，写 `:disabled="条件表达式"`。
- 根据账户状态改变标签颜色，可以在 `:type` 中使用三元运算符。

也就是说，**Element Plus 提供的是已经做好的界面部件，Vue 的数据绑定规则并没有因此改变。**

#### 完整程序：Element Plus 账户状态展示

**文件：`src/App.vue`**

```vue
<script setup lang="ts">
import { ref } from 'vue';

const customerName = ref<string>('');
const accountStatus = ref<string>('normal');

function freezeAccount(): void {
  accountStatus.value = 'frozen';
}

function restoreAccount(): void {
  accountStatus.value = 'normal';
}

function clearCustomerName(): void {
  customerName.value = '';
}
</script>

<template>
  <section class="page">
    <h2>客户账户状态</h2>

    <el-input
      v-model="customerName"
      placeholder="请输入客户姓名"
      class="customer-input"
    />

    <p>当前输入：{{ customerName }}</p>

    <p>
      账户状态：
      <el-tag :type="accountStatus === 'normal' ? 'success' : 'danger'">
        {{ accountStatus === 'normal' ? '正常' : '冻结' }}
      </el-tag>
    </p>

    <el-button type="primary" @click="restoreAccount">恢复正常</el-button>
    <el-button type="danger" @click="freezeAccount">模拟冻结</el-button>
    <el-button @click="clearCustomerName">清空姓名</el-button>
  </section>
</template>

<style scoped>
.page {
  max-width: 520px;
  padding: 24px;
}
.customer-input {
  margin: 12px 0;
}
</style>
```

`el-tag` 的 `:type` 是动态属性绑定。表达式 `accountStatus === 'normal' ? 'success' : 'danger'` 的结果是字符串 `success` 或 `danger`，再交给 `el-tag` 决定标签样式。标签中间的文本插值则控制显示“正常”还是“冻结”。**同一个账户状态，分别驱动标签颜色与显示文字。**

在真实银行系统里，冻结和恢复账户是需要后台业务权限与服务端处理的操作。这里仅用本地变量模拟状态变化，用于学习组件与响应式绑定，并没有操作任何真实银行账户。

> [!EXERCISE] 给按钮添加业务限制
>
> 当前账户已经是冻结状态时，能否让“模拟冻结”按钮自动禁用？请回忆 `:disabled` 的含义，找到它应该读取的响应式状态。

## 综合案例：账户名称与状态查询

### 先搞清楚“原始数据、查询条件、展示结果”

现在把前面学过的内容拼成一个完整的账户查询页面。这时最重要的不是样式，而是把数据分成不同职责。

假设页面有四条本地模拟账户。用户输入“工资”、选择“冻结”，然后点击“查询”，页面需要展示满足条件的账户。

其中需要区分三类数据：

| 数据 | 保存什么 | 什么时候改变 |
|---|---|---|
| `sourceAccounts` | 可供查询的全部模拟账户 | 今天的示例中不改变 |
| `queryName`、`selectedStatus` | 输入框和状态按钮所代表的查询条件 | 用户输入或选择条件时改变 |
| `displayedAccounts` | 当前页面实际显示的查询结果 | 点击查询或重置后改变 |

为什么不直接使用同一个数组保存所有内容？因为“有多少原始账户”和“本次要显示哪些账户”不是同一件事。查询结果少，并不表示原始账户被删除；重置查询后，仍应恢复全部账户。

另外，**用户修改查询条件，不应该在我们这个示例里自动改变查询结果**。我们采用的是“点击查询才刷新结果”的页面行为。`v-model` 负责输入同步，`handleQuery()` 才负责业务查询，二者分工明确。

### 查询函数里要用到的 JavaScript 方法

先认识两个字符串方法与一个数组方法，后面才不会看不懂完整代码。

`trim()` 用于去掉字符串开头和结尾的空白字符。例如 `'  工资  '.trim()` 得到 `'工资'`。查询条件常常要先做这个处理，避免用户多输入空格而匹配不到。

`includes(keyword)` 用于判断字符串是否包含指定内容。例如 `'工资账户'.includes('工资')` 结果为 `true`，`'理财账户'.includes('工资')` 结果为 `false`。它区分大小写；当查询关键词是空字符串时，任意字符串调用 `includes('')` 都返回 `true`。

`filter(callback)` 我们已经见过：它遍历数组，对每条账户运行回调，保留返回 `true` 的账户，最终得到一个**新数组**。哪怕只筛选出一条记录，返回值也仍是数组；如果没有匹配数据，返回空数组 `[]`。

因为这一次有“名称”和“状态”两个条件，还会用到两个 JavaScript 逻辑运算符：

- `&&` 表示**并且**。只有名称条件和状态条件都满足，才保留这条账户。
- `||` 表示**或者**。如果状态选择了“全部”，就不用限制账户状态；否则要求实际账户状态与所选状态一致。

这里把它们写成两个中间变量，目的是让你先看清每个条件，不必一开始就读懂一整行很长的布尔表达式。

### 完整程序：可查询、可重置、有空状态的账户页面

**文件：`src/App.vue`。** 以下代码可以完整替换文件运行，不需要另外创建子组件、接口文件或模拟服务。

```vue
<script setup lang="ts">
import { ref } from 'vue';

// 原始账户列表：用本地数组模拟后台返回的数据
const sourceAccounts = [
  { id: 101, name: '储蓄账户', balance: 5000, status: 'normal' },
  { id: 102, name: '工资账户', balance: 8000, status: 'frozen' },
  { id: 103, name: '理财账户', balance: 12000, status: 'normal' },
  { id: 104, name: '养老金账户', balance: 6000, status: 'normal' }
];

// 两个查询条件：账户名称与账户状态
const queryName = ref<string>('');
const selectedStatus = ref<string>('all');

// 页面当前展示的结果。初始状态显示全部账户
const displayedAccounts = ref(sourceAccounts);

// 选择账户状态，只修改查询条件，不立即执行查询
function chooseStatus(status: string): void {
  selectedStatus.value = status;
}

// 点击“查询”后执行
function handleQuery(): void {
  // 清除查询名称首尾的空白字符
  const keyword = queryName.value.trim();

  // filter 生成符合两项条件的新数组
  displayedAccounts.value = sourceAccounts.filter(account => {
    // 名称中是否包含查询关键词
    const nameMatched = account.name.includes(keyword);

    // “全部”表示不限制状态；否则要求状态相同
    const statusMatched =
      selectedStatus.value === 'all' ||
      account.status === selectedStatus.value;

    // 名称和状态都符合，才保留当前账户
    return nameMatched && statusMatched;
  });

  // 浏览器开发者工具中可以观察每次查询产生的结果
  console.log('本次查询结果：', displayedAccounts.value);
}

// 重置：恢复输入、状态和展示结果
function handleReset(): void {
  queryName.value = '';
  selectedStatus.value = 'all';
  displayedAccounts.value = sourceAccounts;
}
</script>

<template>
  <section class="account-page">
    <h2>个人网银 · 账户查询</h2>

    <!-- 查询条件区域 -->
    <div class="query-area">
      <label class="field-title">账户名称</label>
      <el-input
        v-model="queryName"
        placeholder="例如：工资、储蓄"
        class="query-input"
      />

      <p class="field-title">账户状态</p>
      <div class="status-actions">
        <el-button
          :type="selectedStatus === 'all' ? 'primary' : 'default'"
          @click="chooseStatus('all')"
        >
          全部
        </el-button>
        <el-button
          :type="selectedStatus === 'normal' ? 'primary' : 'default'"
          @click="chooseStatus('normal')"
        >
          正常
        </el-button>
        <el-button
          :type="selectedStatus === 'frozen' ? 'primary' : 'default'"
          @click="chooseStatus('frozen')"
        >
          冻结
        </el-button>
      </div>

      <div class="query-actions">
        <el-button type="primary" @click="handleQuery">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>
    </div>

    <!-- 结果展示区域 -->
    <h3>查询结果（{{ displayedAccounts.length }} 条）</h3>

    <el-empty
      v-if="displayedAccounts.length === 0"
      description="没有符合条件的账户"
    />

    <div v-else class="account-list">
      <div
        v-for="account in displayedAccounts"
        :key="account.id"
        class="account-row"
      >
        <div>
          <strong>{{ account.name }}</strong>
          <p>账户编号：{{ account.id }}</p>
          <p>账户余额：{{ account.balance.toFixed(2) }} 元</p>
        </div>

        <el-tag :type="account.status === 'normal' ? 'success' : 'danger'">
          {{ account.status === 'normal' ? '正常' : '冻结' }}
        </el-tag>
      </div>
    </div>
  </section>
</template>

<style scoped>
.account-page {
  max-width: 760px;
  margin: 24px auto;
  padding: 24px;
  border: 1px solid #e4e7ed;
  border-radius: 10px;
}
.query-area {
  margin-bottom: 24px;
}
.field-title {
  display: block;
  margin: 14px 0 8px;
  font-size: 14px;
}
.query-input {
  max-width: 360px;
}
.status-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.query-actions {
  margin-top: 20px;
}
.account-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid #e4e7ed;
}
.account-row p {
  margin: 6px 0 0;
  color: #606266;
}
</style>
```

这里的 `return nameMatched && statusMatched` 位于 `filter()` 的回调函数中，表示返回一个布尔值，让 `filter()` 判断当前账户是否保留。它与前面付款函数中单独写 `return;` 的用途不同：前者**向调用者返回判断结果**，后者只是结束函数。

模板里的 `<label>` 是 HTML 标签，常用于表单字段的说明文字；这里用于展示字段名称。`class="query-input"` 使用普通 HTML 类名，交给下方的 CSS 设置宽度，不属于新的 Vue 指令。

你还会看到 `:type="selectedStatus === 'all' ? 'primary' : 'default'"`。这并不是新的语法：还是前面学过的 **`:type` 动态属性绑定 + 三元运算符**。选中“全部”时使用主按钮样式，其他状态按钮恢复默认样式，让用户知道自己正在选择哪个条件。

### 把一次查询完整追踪出来

下面按照真实操作顺序，追踪“查询冻结的工资账户”是怎么发生的。

**第一步：输入账户名称。** 用户在 `el-input` 中输入“工资”，由于模板写了 `v-model="queryName"`，脚本里的 `queryName.value` 变成 `'工资'`。这时列表不会自动筛选，因为还没有触发查询函数。

**第二步：点击“冻结”状态按钮。** 它绑定了 `@click="chooseStatus('frozen')"`，所以执行 `chooseStatus()`，把 `selectedStatus.value` 设为 `'frozen'`。按钮样式会变化，因为它的 `:type` 依赖这个状态；但展示数组此时仍然没有改变。

**第三步：点击“查询”。** `@click="handleQuery"` 找到脚本里的查询函数。函数先用 `trim()` 处理名称，再运行 `sourceAccounts.filter(...)`。

**第四步：逐条判断。** 对储蓄账户来说，名称不包含“工资”，所以不保留；对工资账户来说，名称包含“工资”，状态又是 `frozen`，所以保留；其他账户的名称不符合条件，也不保留。

**第五步：保存展示结果。** 筛选出来的是一个只包含工资账户的新数组。代码把它赋值给 `displayedAccounts.value`，Vue 随后更新结果数量和列表内容。`sourceAccounts` 没有被改变。

整条链路可以记成：

**用户输入 / 选择 → 查询条件发生变化 → 点击查询 → 执行 `filter()` → 赋值给 `displayedAccounts.value` → 模板更新。**

### 查询和重置为什么是两个不同操作

只清空输入框，和重置整个查询页面，并不是一回事。例如：

```ts
// 仅清空输入条件，不改变当前查询结果
function clearName(): void {
  queryName.value = '';
}
```

这个函数只改了 `queryName`，所以输入框会清空，但 `displayedAccounts` 中保存的旧查询结果不变。相比之下，完整程序中的 `handleReset()` 一次修改了查询名称、选中状态和展示结果，页面才恢复初始状态。

有些项目希望修改条件后自动重新查询，这当然可以实现，但那属于业务设计上的另一种选择，**不是 `v-model` 自动赋予的行为**。阅读企业页面代码时，要以实际调用了哪个函数、修改了哪些状态为准。

> [!EXERCISE] 在浏览器里进行三轮观察
>
> 第一轮：只输入“工资”但不点查询，列表有没有变化？第二轮：点击“正常”并查询，结果为什么是空？第三轮：点击“重置”后，输入框、状态选择、账户列表分别恢复成什么？

## 从页面功能反向阅读业务代码

### 拿到一个陌生 `.vue` 文件，应该从哪里开始

真实企业项目的 `.vue` 文件可能很长，里面既有页面结构又有处理函数。阅读时，不要从第一行开始就试图理解所有变量。假如你的任务是“修改账户查询按钮的筛选条件”，可以沿着页面功能反向找代码。

**先找模板中的业务入口。** 在 `<template>` 里搜索“查询”，找到：

```vue
<el-button type="primary" @click="handleQuery">查询</el-button>
```

这行代码告诉你，点击动作进入 `handleQuery` 函数。于是到 `<script setup>` 里搜索 `handleQuery` 的定义。

**再看函数究竟读了什么、改了什么。** 在当前案例中，函数读取 `queryName.value`、`selectedStatus.value`，从 `sourceAccounts` 里筛选记录，然后给 `displayedAccounts.value` 赋新值。

**最后回到模板看谁依赖这个结果。** 搜索 `displayedAccounts`，你会发现结果数量、`v-if` 的空状态判断和 `v-for` 的列表渲染都依赖它。这就解释了为什么只要修改一个响应式结果，就能使几个区域一同更新。

你可以把这个阅读顺序记成：**界面入口 → 处理函数 → 读取和修改的状态 → 模板里的使用位置**。

### 页面不更新时，按数据流排查

如果点击查询后，查询条件文字变了，但列表还是旧的，先不要猜测“是不是 Vue 没刷新”。从这四个问题入手：

1. **事件触发了吗？** 看 `@click` 是否指向正确的函数。在函数开头临时写 `console.log('查询被触发')`，点击按钮，检查浏览器开发者工具的 Console（控制台）有没有输出。
2. **筛选条件对吗？** 看函数读取的是 `queryName.value` 还是其他变量；查看 `filter()` 的条件是不是与需求一致。
3. **筛选结果保存了吗？** `filter()` 返回一个新数组。不能只调用 `sourceAccounts.filter(...)` 而忽略它的结果；必须把结果保存到模板真正使用的状态，例如 `displayedAccounts.value`。
4. **模板读的是哪个数组？** 如果函数更新了 `displayedAccounts`，而模板偏偏写 `v-for="account in sourceAccounts"`，页面仍然会显示原始数组。这不是响应式失效，而是**模板绑定错了数据源**。

浏览器开发者工具可以通过常见的 `F12` 打开，Console 用于查看 `console.log()` 输出。`console.log()` 是 JavaScript 的调试方法，会把指定值输出到控制台。它不会直接修改页面，也不等于 Vue 的特殊 API。

### 完整程序：定位并修复一个查询错误

下面仍然是一份可以直接运行的程序，但它故意让“查询”按钮只修改条件、没有修改展示数组。这样你可以亲眼看到“函数执行了，但列表不变”是什么样子。

**文件：`src/App.vue`**

```vue
<script setup lang="ts">
import { ref } from 'vue';

const sourceAccounts = [
  { id: 1, name: '储蓄账户', status: 'normal' },
  { id: 2, name: '工资账户', status: 'frozen' },
  { id: 3, name: '理财账户', status: 'normal' }
];

const selectedStatus = ref<string>('all');
const displayedAccounts = ref(sourceAccounts);

function handleQueryNormal(): void {
  selectedStatus.value = 'normal';
  console.log('查询按钮已点击');

  // 故意遗漏：filter 的新数组没有保存到 displayedAccounts
  sourceAccounts.filter(account => account.status === 'normal');
}
</script>

<template>
  <section class="page">
    <h2>查询问题定位</h2>
    <el-button type="primary" @click="handleQueryNormal">
      查询正常账户
    </el-button>

    <p>当前条件：{{ selectedStatus }}</p>
    <p>列表记录数：{{ displayedAccounts.length }}</p>

    <div v-for="account in displayedAccounts" :key="account.id">
      {{ account.name }} — {{ account.status }}
    </div>
  </section>
</template>

<style scoped>
.page {
  padding: 24px;
}
</style>
```

运行后，点击按钮会看到“当前条件”变为 `normal`，控制台也会打印“查询按钮已点击”，但列表依然有三条。这个现象至少说明两件事：一是事件函数确实执行了，二是 `selectedStatus` 已正确修改。所以这时应该重点检查**结果数组是否更新**，而不是反复修改按钮的绑定语法。

> [!EXERCISE] 自己修复错误
>
> 请只修改 `handleQueryNormal()`，让它把筛选结果真正写入页面展示状态。提示：对照上一节综合案例中 `displayedAccounts.value = sourceAccounts.filter(...)` 的写法。修复后，页面应该只剩下储蓄账户和理财账户。

## 第一天知识回顾

### 把关键语法与作用对应起来

| 代码 | 核心作用 | 最容易弄错的地方 |
|---|---|---|
| `<script setup lang="ts">` | 使用 TypeScript 编写组件逻辑 | 把 `script`、`setup`、`lang` 误认为同一概念 |
| `{{ balance }}` | 在模板中显示表达式结果 | 认为普通变量赋值一定会触发响应式更新 |
| `ref(5000)` | 创建响应式数据 | 忘记在脚本中使用 `.value` |
| `@click="handlePay"` | 点击后调用处理函数 | 以为必须在模板中使用 `addEventListener` |
| `:disabled="balance < 100"` | 用表达式控制按钮禁用 | 漏写冒号，变成静态属性 |
| `v-if` / `v-else` | 根据条件选择渲染的内容 | 以为 `v-if` 一定要搭配 `v-else` |
| `v-show` | 利用 CSS 隐藏或显示内容 | 误以为隐藏就等于 DOM 被删除 |
| `v-for="account in accounts"` | 为数组中的每条数据生成一行 | 混淆数组和当前元素 |
| `:key="account.id"` | 为列表节点提供稳定身份 | 给会变化的列表使用下标作为 key |
| `v-model="queryName"` | 同步输入框与响应式数据 | 以为它会自动执行查询函数 |
| `:value="queryName"` | 将数据绑定到输入框的值 | 以为它会自动保存用户的新输入 |
| `filter()` | 按条件生成新数组 | 调用后没有接收返回值 |

### 一次小练习：沿着数据流自己解释页面

重新运行“综合案例：账户名称与状态查询”，尝试不看讲解，自己指出：**哪个变量保存输入条件，哪个变量保存页面结果，点击查询时调用哪个函数，以及哪一句代码会真正改变展示列表。**

如果你能说清楚这四个位置的关系，就说明第一天最重要的目标已经达成。以后阅读个人网银前端代码时，也可以沿着同样的顺序寻找业务逻辑。

> [!CONCLUSION] 今天最需要记住的一句话
>
> **页面显示什么，由模板读取的数据决定；用户做了什么，由事件进入的函数决定；页面什么时候变化，要看函数有没有修改模板实际依赖的响应式状态。**

## 官方资料

- [Vue 官方指南：快速上手](https://cn.vuejs.org/guide/quick-start.html)
- [Vue 官方指南：响应式基础](https://cn.vuejs.org/guide/essentials/reactivity-fundamentals.html)
- [Vue 官方指南：模板语法](https://cn.vuejs.org/guide/essentials/template-syntax.html)
- [Vite 官方指南](https://vite.dev/guide/)
- [Element Plus 快速开始](https://element-plus.org/zh-CN/guide/quickstart)
