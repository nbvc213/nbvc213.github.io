---
id: vue-course-day-1
title: "Vue 企业开发 · 第一天：单个页面如何工作"
folder: miscellaneous
order: 1101
date: 2026-11-01
updated: 2026-11-01
tags: [Vue, TypeScript, 前端开发]
description: "从工程启动到响应式、模板与账户查询，建立页面数据流。"
pinned: false
draft: false
---

## 阅读与运行方法

本课程先建立企业页面维护能力，再深入框架原理。今天研究一个页面内部的数据、模板和事件。每个知识点先阅读语法小例，再运行完整程序。**“语法小例”用于观察一处写法，“完整程序”才是可直接替换文件运行的内容。** 不必把所有小例拼进同一个大项目。

主线建议：工程准备 15 分钟，单文件组件与响应式 30 分钟，绑定和条件渲染 25 分钟，列表和输入 25 分钟，账户查询 25 分钟。首次安装另留时间。状态错位演示、重复对照例与扩展排错题可在主线后阅读；这份笔记保留完整解释，不要求两小时背下所有内容。

### 一次性创建练习工程

Vite 是开发与构建工具，负责处理 .vue 文件、提供本地开发服务并生成部署资源。Node.js 在电脑上运行这些工具，npm 安装依赖。浏览器中的网页与电脑上的开发工具是两个运行环境。

```powershell
npm.cmd create vite@latest vue-practice -- --template vue-ts
cd vue-practice
npm.cmd install
npm.cmd install element-plus axios pinia vue-router@4
npm.cmd run dev
```

`vue-practice` 是新项目名；`--template vue-ts` 选择 Vue + TypeScript 模板。后三个库将在后续课程使用，此处只是准备依赖。当前 Vite 文档要求 Node.js 20.19+ 或 22.12+，具体模板有更高要求时以安装提示为准。保留 package-lock.json，后续可用 npm.cmd ci 按锁文件恢复依赖。

打开终端输出的本地地址。以后在同一项目目录运行 npm.cmd run dev 即可，不必每节重新安装。Ctrl+C 停止当前终端里的服务。

### 设置统一入口

index.html 提供 id 为 app 的挂载容器；src/main.ts 创建应用；src/App.vue 是根组件。先完整替换 src/main.ts：

```ts
import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import App from './App.vue';
createApp(App).use(ElementPlus).mount('#app');
```

第一行导入创建应用的函数；第二行导入组件库；第三行加载其样式；第四行导入根组件；最后一行创建应用、注册组件库并挂载到 HTML 容器。

`import { createApp }` 是具名导入，花括号中的名字对应模块导出的成员；`import App` 是默认导入。`./App.vue` 表示当前目录下的文件。后面的 `import { ref } from 'vue'` 使用相同的具名导入语法。

今天完整组件均可替换 src/App.vue，保留上述 main.ts。第三天的多文件示例再按明确路径创建子组件。练习工程与笔记网站工程应放在各自目录中。

## 示例与练习怎样独立运行

整份笔记保留小例、完整程序和故意设错的练习。三者承担不同任务，运行前先确认当前小节的用途。

语法小例只聚焦一处写法，例如一行 v-if，它用于阅读和对照，不要求直接覆盖整个文件。完整程序包含脚本与模板，可整体替换 src/App.vue；切换单元时用新的完整内容替换，不要把两个 script setup 连续粘进同一个文件。

标题标明“修复代码”“常见错误”的程序会保留待排查的问题；它能用于观察错误，不代表推荐照搬到正常页面。练习后紧跟答案，网站若折叠显示，可在需要时展开。

所有完整程序都沿用本篇 main.ts，除非后文明确提供新的入口文件。组件库标签、类型声明和业务数据各有来源；复制前检查对应单元的运行约定，就能把环境缺失与业务错误区分开。

## Vue 3 概述

Vue 3 是用于构建用户界面的 JavaScript 框架。它通过组件组织页面结构和业务逻辑，通过响应式数据与模板绑定建立数据和界面之间的联系。状态变化后，Vue 会安排相关视图更新。

在账户管理页面中，余额显示、按钮禁用、列表筛选和查询条件输入都可以由状态驱动。理解这些功能，需要分别认识数据如何保存、事件如何触发函数，以及模板如何使用处理结果。

本笔记按学习依赖组织第一天的基础知识与账户查询示例。TypeScript 仅解释代码中已经使用的类型标注；Vite 仅说明构建工具的角色。组件通信、响应式进阶和接口请求等内容暂不展开。

### 原生 JavaScript 与 Vue 的界面更新方式

用户界面（User Interface，UI）需要展示数据，并在用户操作后呈现新的结果。

HTML、CSS 和 JavaScript 已经能够完成网页开发，其中 HTML 定义页面结构，CSS 控制外观，JavaScript 实现数据处理和用户交互。Vue 在此基础上提供组织界面与更新视图的机制。

例如，页面需要显示账户余额，并在单击按钮后使余额增加 100 元。

使用原生 JavaScript 时，需要在修改余额后更新页面元素：

> [!EXAMPLE] 原生 JavaScript：修改数据后手动更新页面
>
> ```html
> <p id="balance">3200</p>
> <button id="depositBtn">模拟入账</button>
>
> <script>
>     let balance = 3200;
>
>     document.querySelector('#depositBtn')
>         .addEventListener('click', () => {
>             // 修改 JavaScript 中的数据
>             balance += 100;
>
>             // 手动修改页面显示的内容
>             document.querySelector('#balance').textContent = balance;
>         });
> </script>
> ```

上述代码包含两项操作：

1. 修改数据：`balance += 100`。
2. 修改页面：通过 `document.querySelector()` 找到 HTML 元素，再更新 `textContent`。

当业务页面变得复杂，涉及几十个字段、表格、筛选条件和弹窗时，开发者需要管理大量数据与页面元素之间的对应关系。

Vue 通过建立数据与模板之间的关系，使界面能够随响应式数据变化而更新。

### 数据驱动视图

Vue 使用**声明式渲染（Declarative Rendering）**：开发者描述页面应该如何根据数据呈现，Vue 负责在响应式数据变化时更新相关页面内容。

两种写法在页面更新方式上的区别如下：

- **原生 JavaScript：** 修改数据后，开发者还要编写代码更新 DOM。
- **Vue：** 建立响应式数据与模板的关系后，修改数据即可触发 Vue 更新相关视图。

这里的 DOM（Document Object Model，文档对象模型），就是浏览器用来表示和操作 HTML 页面结构的对象模型。

> [!NOTE] 数据驱动与 DOM 更新
>
> Vue 仍然通过 DOM 呈现界面。数据驱动视图表示由 Vue 根据数据变化组织相关 DOM 更新，开发者无需为每一次变化分别编写元素查找与文本修改代码。

## Vue 单文件组件

Vue 企业项目中经常出现以下文件结构：

```text
src/
├── views/
│   └── AccountList.vue
├── components/
│   └── AccountCard.vue
└── ...
```

**单文件组件（Single-File Component，SFC）**是 Vue 用于组织组件代码的文件格式，扩展名为 `.vue`。

组件（Component）可以理解为组成页面的独立功能单元。一个组件可以代表整个业务页面，也可以代表页面中的一张卡片、一个查询表单或一张表格。

一个 `.vue` 文件可以包含三个主要部分：

| 组成部分 | 对应已有知识 | 主要职责 |
|---|---|---|
| `script` | JavaScript / TypeScript | 数据和逻辑 |
| `template` | HTML + Vue 模板语法 | 页面结构 |
| `style` | CSS | 页面样式 |

`.vue` 文件需要经过构建工具处理，将组件代码转换为浏览器能够使用的 JavaScript、CSS 等资源。Vite 在这类项目中承担开发与构建工具的角色，具体配置不属于第一天的内容。

### `<script setup lang="ts">` 的含义

Vue 3 项目常见的组件脚本结构如下：

```vue
<script setup lang="ts">
    // 数据和业务逻辑
</script>
```

这一写法由 `script`、`setup` 和 `lang="ts"` 三部分组成。

#### `script`：组件逻辑区域

`<script>` 用于编写组件的数据、函数和业务处理逻辑。

#### `setup`：组合式 API 的简化写法

`<script setup>` 是在单文件组件中使用**组合式 API（Composition API）**的简化语法。

Composition API 是 Vue 提供的一组 API，可以通过函数组织状态、计算结果、生命周期和其他组件逻辑。

`<script setup>` 中的顶层变量、函数和导入内容，可以直接在同一个组件的模板中使用，不需要手动返回。

#### `lang="ts"`：使用 TypeScript

`lang="ts"` 指定该脚本区域使用 **TypeScript（TS）**。

TypeScript 在 JavaScript 基础上增加了静态类型检查等功能，可以帮助开发者在开发阶段发现类型错误。

例如：

```typescript
const accountName: string = '张三';
const balance: number = 3200;
```

其中：

- `: string`：要求变量的值为字符串。
- `: number`：要求变量的值为数字。

上述示例中的 `: string` 和 `: number` 是类型标注。类型标注在编译处理中会被移除，其作用是帮助开发阶段检查数据类型，不会直接执行运行时的数据验证。

### `<template>`：将脚本数据放到界面中

模板保留 HTML 的结构写法，并增加 Vue 模板语法。文本插值 `{{ name }}` 会读取脚本中的 name，显示对应内容。

先运行完整 src/App.vue：

```vue
<script setup lang="ts">
const name = '储蓄账户';
</script>
<template>
    <h2>{{ name }}</h2>
    <p>这是第一个 Vue 页面。</p>
</template>
```

页面显示“储蓄账户”。把源文件中的字符串改成“工资账户”并保存，会看到开发服务器更新页面。修改源文件引发重载，不等于运行时普通变量自动具有响应式能力；后文用 ref 建立这种关系。

### `<style scoped>`：为当前组件设置样式

style 中使用 CSS。scoped 让编译器为相关元素与选择器增加作用域标记，主要限制样式范围。它不等于 Shadow DOM，父组件样式仍可能影响子组件根节点。

完整 src/App.vue：

```vue
<script setup lang="ts">
const name = '工资账户';
const balance = 3200;
</script>
<template>
    <section class="account-card">
        <h2>{{ name }}</h2>
        <p>余额：{{ balance }} 元</p>
    </section>
</template>
<style scoped>
.account-card {
    padding: 16px;
    border: 1px solid #ddd;
    border-radius: 8px;
}
</style>
```

class 是普通 HTML 属性，`.account-card` 是 CSS 类选择器。padding 设置内边距，border 设置边框，border-radius 设置圆角。脚本提供值，模板组织显示，样式控制外观；样式不负责改变余额或调用业务函数。

## 响应式数据与 `ref()`

### 普通变量与响应式数据

普通变量与响应式数据都能够保存数值，但修改后对页面的影响不同。

普通变量：

```typescript
let balance = 5000;

balance -= 100;
```

JavaScript 变量的值会改变，但修改本身不会触发 Vue 响应式视图更新。

响应式变量：

```typescript
const balance = ref<number>(5000);

balance.value -= 100;
```

Vue 能追踪响应式数据的变化，并自动安排相关视图更新。

**响应式（Reactivity）**是指 Vue 能够追踪数据变化，并安排依赖这些数据的界面内容更新。因此，响应式不只是“变量的值能够改变”，还包括变化与视图更新之间的联系。

#### `ref()` 的返回值与 `.value`

```typescript
const balance = ref<number>(5000);
```

`ref()` 返回的不是数字 `5000` 本身，而是一个包含 `.value` 属性的响应式对象。

为了理解 `.value` 的访问方式，可以先用下面的结构示意：

```typescript
{
    value: 5000
}
```

但真正的 `ref` 还具有依赖追踪和变化通知的能力，并不只是普通对象。

因此，脚本中需要通过 `.value` 读取或修改内部数据：

```typescript
const balance = ref<number>(5000);

// 正确：读取数值
console.log(balance.value); // 5000

// 正确：修改数值
balance.value = 4800;

// 正确：虽然 balance 使用 const 声明，
// 但可以修改对象内部的 value 属性。
balance.value -= 100;
```

`const` 禁止的是重新给 `balance` 变量赋值，并不禁止修改它所引用对象的属性。

#### 模板中的自动解包

Vue 提供了模板自动解包机制。

```vue
<script setup lang="ts">
import { ref } from 'vue';

const balance = ref<number>(5000);
</script>

<template>
    <p>{{ balance }}</p>
</template>
```

这里 `balance` 是模板上下文中的顶层 `ref`，所以 Vue 会自动取出其值，页面显示 `5000`，而不是整个 `ref` 对象。

脚本与模板中的访问规则如下：

**在 `<script setup>` 中访问 `ref` 的值需要 `.value`；在模板中访问顶层 `ref` 时可以省略 `.value`。**

上述规则针对模板上下文中的顶层 `ref`，不能直接推广为所有嵌套属性都会自动解包。

## 文本插值与点击事件的基本用法

### 插值显示结果，不修改原数据

`{{ 表达式 }}` 将表达式结果转换成文本，可以读取变量、进行运算或调用返回结果的方法，不能直接声明变量或写 if 语句。

```vue
<p>{{ accountName }}</p>
<p>{{ balance + 100 }}</p>
<p>{{ balance.toFixed(2) }}</p>
```

第一行读取名称，第二行显示加法结果但不修改 balance，第三行将数字格式化为两位小数字符串。普通文本插值不会把字符串当作 HTML 插入。

### `v-on` 与 `@click`：点击时才执行

`v-on:click="handleDeposit"` 表示监听点击事件，`@click` 是简写。带参数的 `@click="handleDepositAmount(200)"` 也在点击时执行，不是在组件初始化时执行。

完整 src/App.vue：

```vue
<script setup lang="ts">
import { ref } from 'vue';
const balance = ref(3200);
function handleDepositAmount(amount: number): void {
    balance.value += amount;
}
</script>
<template>
    <p>余额：{{ balance.toFixed(2) }} 元</p>
    <button @click="handleDepositAmount(100)">入账 100 元</button>
    <button @click="handleDepositAmount(200)">入账 200 元</button>
</template>
```

参数 amount 接收按钮传入的数字。初始余额 3200；点击第二个按钮后，函数同步把 balance.value 改成 3400；Vue 随后更新相关文本。模板中的 balance 是顶层 ref，所以省略 .value。这里一个知识点对应一段观察，不需要先理解查询、数组或组件库。

## 模板表达式、属性绑定与事件处理

### 动态属性绑定

文本插值用于显示文本。当页面需要根据状态控制按钮是否禁用、输入框的属性值等行为时，应使用属性绑定。

Vue 提供 `v-bind` 指令来实现**动态属性绑定**。

指令（Directive）是 Vue 模板中特殊的属性语法，用于向 HTML 元素添加 Vue 的动态行为。

例如：

```vue
<!-- 完整写法 -->
<button v-bind:disabled="isDisabled">提交</button>

<!-- 简写，实际开发更常用 -->
<button :disabled="isDisabled">提交</button>
```

其中：

- `v-bind`：Vue 的属性绑定指令。
- `disabled`：需要绑定的 HTML 属性，用于控制按钮是否被禁用。
- `isDisabled`：Vue 要读取的 JavaScript 表达式，其结果决定属性值。

当 `isDisabled` 为 `true` 时，按钮被禁用；当它为 `false` 时，按钮恢复可用。

注意：

```vue
<button disabled="false">提交</button>
```

这并不会启用按钮。`disabled` 是 HTML 布尔属性，只要该属性存在，按钮就是禁用状态。

因此，需要根据布尔值动态控制时，应使用 `:disabled`。

### 综合示例：根据余额控制付款

响应式数据可以同时影响文本内容和元素属性。以下示例将余额显示、付款事件和按钮禁用状态联系起来。

**业务需求：**

账户初始余额为 250 元，每次点击“支付 100 元”扣除 100 元。余额不足 100 元时，付款按钮自动禁用。

```vue
<script setup lang="ts">
import { ref } from 'vue';

// 创建响应式账户余额
const balance = ref<number>(250);

// 付款处理函数
function handlePay(): void {
    // 余额不足，直接结束函数
    if (balance.value < 100) {
        return;
    }

    // 扣除 100 元，触发相关视图更新
    balance.value -= 100;
}
</script>

<template>
    <div>
        <h3>账户余额：{{ balance }} 元</h3>

        <!-- 余额不足 100 元时禁用按钮 -->
        <button
            :disabled="balance < 100"
            @click="handlePay"
        >
            支付 100 元
        </button>
    </div>
</template>
```

上述模板中有**两处内容依赖同一个余额状态**：

- `{{ balance }}` 决定余额显示内容。
- `:disabled="balance < 100"` 决定按钮是否禁用。

当 `balance` 改变时，Vue 会根据新的数据重新计算相关模板表达式，并更新必要的 DOM。

余额变化后，文本内容与禁用状态均由新的余额计算得到，无需分别查找这两个 DOM 位置进行修改。

### 练习：修复付款代码

```vue
<script setup lang="ts">
import { ref } from 'vue';

const balance = ref<number>(180);

function handlePay(): void {
    if (balance.value >= 100) {
        balance -= 100;
    }
}
</script>

<template>
    <p>余额：{{ balance }} 元</p>

    <button
        disabled="balance < 100"
        @click="handlePay"
    >
        支付 100 元
    </button>
</template>
```

> [!EXERCISE] 修复 `ref` 的赋值
>
> 函数中的 `balance -= 100` 有什么问题？应如何修改？
>
> 【答案】
>
> 这里的 `balance` 是使用 `const` 声明的变量，保存 Ref<number> 对象的引用，并不是普通数字。
>
> 原语句同时存在两个问题：它尝试重新给 `const` 变量赋值；它还把 Ref 对象直接用于数字减法。
>
> 应修改对象内部保存的值：
>
> ```typescript
> balance.value -= 100;
> ```
>
> `const` 限制的是变量绑定不能重新赋值，不禁止修改引用对象的属性。修改 `.value` 才符合这里的数据类型与响应式用法。

> [!EXERCISE] 修复动态禁用属性
>
> `disabled="balance < 100"` 为什么不能按余额控制禁用？应如何修改？
>
> 【答案】
>
> 不添加冒号时，这是静态 HTML 属性，Vue 不会将属性值作为 JavaScript 表达式求值。
>
> `disabled` 是原生 HTML 布尔属性，只要存在，按钮就会禁用；即使写成 `disabled="false"` 也一样。
>
> 应写为：
>
> ```vue
> <button :disabled="balance < 100" @click="handlePay">支付 100 元</button>
> ```
>
> 冒号表示 `v-bind`，Vue 会计算 `balance` < 100，根据 true 或 false 动态控制禁用状态。

> [!EXERCISE] 预测修复后的付款结果
>
> 余额初始为 180 元。修复后第一次付款，余额是多少？按钮还能继续点击吗？
>
> 【答案】
>
> 第一次付款后为 180 − 100 = **80 元**。由于 80 < 100，绑定表达式为 true，按钮禁用，不能继续通过点击该按钮付款。数据变化同时影响余额文本和禁用属性。

### 模板表达式

文本插值的基本形式如下：

```vue
<p>余额：{{ balance }} 元</p>
```

实际上，`{{ }}` 内部不仅能放变量，还能编写 JavaScript **表达式（Expression）**。

表达式是能够计算出一个值的代码。

例如：

```vue
<template>
    <!-- 直接显示变量 -->
    <p>{{ balance }}</p>

    <!-- 调用方法并显示返回结果 -->
    <p>{{ balance.toFixed(2) }}</p>

    <!-- 使用三元运算符 -->
    <p>{{ balance >= 100 ? '余额充足' : '余额不足' }}</p>
</template>
```

其中，三元运算符 `条件 ? 值1 : 值2` 表示：条件成立时得到值1，否则得到值2。

在 Vue 模板中，这种表达式不仅可以用于文本插值，还可以用于 `v-bind` 等指令。

但是，**模板主要负责描述页面如何显示，不应该放入复杂业务逻辑。**

例如，如果账户状态的判断涉及多个条件，应当将逻辑组织到脚本中。复杂表达式的组织方式留待后续响应式进阶课程展开。

### 事件绑定与函数参数

事件绑定可以将用户操作关联到处理函数：

```vue
<button @click="handlePay">支付</button>
```

其中，`@click` 是 `v-on:click` 的简写。

多个按钮也可以调用同一个函数，并通过参数区分具体操作。

例如：

```vue
<script setup lang="ts">
// action 表示用户选择的操作类型
function handleAction(action: string): void {
    console.log('当前操作：', action);
}
</script>

<template>
    <button @click="handleAction('query')">
        查询
    </button>

    <button @click="handleAction('reset')">
        重置
    </button>
</template>
```

不带调用表达式和显式传入参数的写法具有以下区别：

| 写法 | 含义 |
|---|---|
| `@click="handleAction"` | 点击时调用函数，自动传入原生事件对象 |
| `@click="handleAction('query')"` | 点击时调用函数，传入指定字符串 `'query'` |

**不要误以为 `@click="handleAction('query')"` 会在页面初始化时立即执行函数。** 它是事件绑定表达式，只有事件触发时才执行。

### 巩固：账户信息与模拟入账

账户信息组件可以将余额状态、入账操作和页面显示组织在同一个文件中。

为了让余额变化能够触发页面更新，可以使用 Vue 提供的 `ref()` 创建响应式数据。

`ref()` 用于创建响应式数据。它接收初始值，返回一个带有 `.value` 属性的响应式对象。读取或修改数据时，在 `script` 中使用 `.value`；在模板中直接访问顶层 `ref` 时，Vue 会自动解包，因此不需要写 `.value`。

例如：

```typescript
import { ref } from 'vue';

const balance = ref<number>(3200);

// 读取数据
console.log(balance.value);

// 修改数据
balance.value += 100;
```

`ref<number>(3200)` 中，`3200` 是初始值，`<number>` 是 TypeScript 的泛型类型参数，用于指定所保存数据的类型。这里先用类型参数描述内部值的类型，泛型机制暂不展开。

#### 账户信息组件

```vue
<script setup lang="ts">
import { ref } from 'vue';

// 账户名称：普通字符串变量
const accountName: string = '张三';

// 账户余额：使用 ref 创建响应式数据
const balance = ref<number>(3200);

// 模拟一笔 100 元的入账交易
function handleDeposit(): void {
    // 修改响应式数据，Vue 会更新关联的页面内容
    balance.value += 100;
}
</script>

<template>
    <div class="account-card">
        <h2>账户信息</h2>

        <p>账户名称：{{ accountName }}</p>
        <p>账户余额：{{ balance.toFixed(2) }} 元</p>

        <button @click="handleDeposit">
            模拟入账 +100 元
        </button>
    </div>
</template>

<style scoped>
.account-card {
    padding: 20px;
    border: 1px solid #ddd;
    border-radius: 8px;
}
</style>
```

#### 组件代码说明

**导入 `ref` 函数。**

这条语句从 `vue` 模块中导入名为 `ref` 的 API，供当前脚本使用。花括号中的 `ref` 是导入的名称；后面的 `ref<number>(3200)` 才是调用这个函数并创建响应式数据。导入函数和调用函数是两个不同的步骤。

**普通数据与响应式数据。**

`const accountName: string = '张三'` 声明一个普通字符串。这个例子只显示名称，没有修改名称的需求。

`const balance = ref<number>(3200)` 则创建响应式余额：`ref()` 提供响应式能力，`<number>` 说明内部保存数字，`3200` 是初始余额。需要变化并驱动页面更新的是余额，因此不能只用普通数字变量替代这里的 `ref`。

**使用文本插值显示账户名称。**

这是 Vue 的文本插值语法（Mustache Syntax），用于将表达式的结果展示到页面中。

```vue
<p>账户名称：{{ accountName }}</p>
```

Vue 会读取 `script` 中的 `accountName`，显示对应的字符串。

**格式化余额并显示。**

`balance` 是响应式数据。在模板中，它会被自动解包，因此可以直接调用数字的 `toFixed(2)` 方法，将数字格式化为保留两位小数的字符串。

这也解释了为什么在 `script` 中写 `balance.value`，而在模板中写 `balance`。

**绑定入账按钮的点击事件。**

这是 Vue 的事件绑定语法，`@click` 是 `v-on:click` 的简写。

用户点击按钮时，Vue 会调用 `handleDeposit()` 函数。

**通过 `.value` 修改响应式余额。**

函数修改响应式数据后，Vue 会安排视图更新，不需要再次使用 `document.querySelector()` 修改余额文本。

#### 组件的执行过程

1. **创建组件实例**：执行 `<script setup>` 中的初始化逻辑，创建 `accountName` 和 `balance`。
2. **初次渲染模板**：读取数据，将账户名称、余额显示在页面中。
3. **用户点击按钮**：`@click` 触发 `handleDeposit()` 函数。
4. **修改响应式数据**：`balance.value` 增加 100，Vue 检测到变化并安排更新。
5. **更新页面**：Vue 在后续更新过程中，将相关余额文本更新为新值。

**响应式数据修改与 DOM 更新是两个不同的过程。** `balance.value` 在赋值后立即改变，而相关 DOM 更新由 Vue 进行调度与批处理，不保证每次修改数据后都立即同步完成。

> [!SUPPLEMENT] scoped 样式的职责
>
> `<style scoped>` 用于限制普通 CSS 选择器的作用范围。示例中的 `padding`、`border`、`border-radius` 分别设置内边距、边框和圆角。样式描述页面外观，余额变化和按钮行为仍由脚本与模板绑定控制。

### 练习：阅读代码并预测结果

```vue
<script setup lang="ts">
import { ref } from 'vue';

const amount = ref<number>(5000);

function updateAmount(): void {
    amount.value -= 200;
}
</script>

<template>
    <p>账户余额：{{ amount }} 元</p>

    <button @click="updateAmount">
        扣款
    </button>
</template>
```

> [!EXERCISE] 连续两次扣款
>
> 如果连续点击两次“扣款”按钮，页面最终显示多少元？说明从数据变化到页面更新的过程。
>
> 【答案】
>
> **最终显示 4600 元。**
>
> 1. 初始 `amount.value` 为 5000。
> 2. 第一次点击触发 `updateAmount()`，执行 `amount.value -= 200`，数据变为 4800。
> 3. 第二次点击再次执行该函数，数据变为 4600。
> 4. 模板使用 `amount` 显示余额，Vue 根据响应式变化自动安排相关页面更新。
>
> 必须区分两个时间过程：数据修改是同步的，执行减法后立即读取 `amount.value` 就能得到新值；DOM 更新由 Vue 异步调度并批量处理，不保证每次赋值后立即完成真实 DOM 更新。

> [!WARNING] 数据更新与 DOM 更新不能混为一谈
>
> 响应式数据修改后，可以立即读取新的状态值；相应 DOM 更新由 Vue 统一调度。因此，在数据已经改变的时刻，立即读取的 DOM 仍可能保留旧内容。

## 条件渲染

在企业项目中，页面内容经常需要根据业务状态变化。

例如：

- 用户有账户时展示账户信息，没有账户时显示提示。
- 接口请求过程中显示加载提示。
- 某个查询条件满足后显示额外输入项。
- 点击按钮展开或折叠详情区域。

Vue 提供了两种常用指令。

### `v-if`：根据条件渲染内容

```vue
<p v-if="hasAccount">账户信息已加载</p>
<p v-else>暂无账户信息</p>
```

`v-if` 后面是 JavaScript 表达式：

- `hasAccount` 为 `true`：渲染第一段内容。
- `hasAccount` 为 `false`：渲染 `v-else` 对应的内容。

`v-else` 必须紧跟在对应的 `v-if` 或 `v-else-if` 分支后面。

还可以使用 `v-else-if` 处理多个条件：

```vue
<p v-if="status === 'success'">查询成功</p>
<p v-else-if="status === 'loading'">正在查询</p>
<p v-else>查询失败</p>
```

这里使用了 JavaScript 严格相等运算符 `===`，判断 `status` 是否等于指定字符串。

### `v-show`：切换显示状态

```vue
<p v-show="showBalance">账户余额：3200 元</p>
```

`v-show` 根据表达式结果控制元素的 CSS `display` 属性。

当 `showBalance` 为 `false` 时，元素依然存在于 DOM 中，只是被隐藏。

### `v-if` 与 `v-show` 的区别

| 比较 | `v-if` | `v-show` |
|---|---|---|
| 条件不成立 | 不渲染或移除对应元素 | 隐藏元素 |
| 是否保留 DOM 元素 | 否 | 是 |
| 切换开销 | 需要创建或销毁相关内容 | 主要是切换 CSS 显示状态 |
| 适用场景 | 业务条件决定内容是否存在 | 频繁切换显示与隐藏 |

如果某个区域需要频繁切换显示状态，通常可优先考虑 `v-show`；如果条件很少变化，则可优先考虑 `v-if`。选择依据是是否需要反复创建或卸载对应内容。

另外，`v-show` 只是视觉隐藏，不是安全控制手段。敏感信息不能仅依赖 `v-show` 防止用户访问。

### 综合示例：账户区域与余额显示

账户区域是否存在和余额是否显示，可以由两个不同的布尔状态控制。

```vue
<script setup lang="ts">
import { ref } from 'vue';

// 是否存在账户
const hasAccount = ref<boolean>(true);

// 是否显示账户余额
const showBalance = ref<boolean>(false);

// 账户余额
const balance = ref<number>(3200);

// 切换余额显示状态
function toggleBalance(): void {
    showBalance.value = !showBalance.value;
}

// 修改账户状态
function updateAccountStatus(status: boolean): void {
    hasAccount.value = status;

    // 账户不存在时，重置余额显示状态
    if (!status) {
        showBalance.value = false;
    }
}
</script>

<template>
    <div>
        <h2>账户查询</h2>

        <div v-if="hasAccount">
            <p>账户状态：正常</p>

            <button @click="toggleBalance">
                显示 / 隐藏余额
            </button>

            <p v-show="showBalance">
                账户余额：{{ balance }} 元
            </p>

            <button @click="updateAccountStatus(false)">
                模拟关闭账户
            </button>
        </div>

        <div v-else>
            <p>暂无账户信息</p>

            <button @click="updateAccountStatus(true)">
                模拟开通账户
            </button>
        </div>
    </div>
</template>
```

阅读这段代码，重点不是记住每一行，而是能够建立下面的对应关系：

- `hasAccount` 控制整个账户信息区域是否存在。
- `showBalance` 控制余额文本是否显示。
- `toggleBalance()` 修改余额显示状态。
- `updateAccountStatus()` 修改账户状态，并根据业务条件重置余额显示状态。
- 两个变量都是 `ref<boolean>`，因此修改时需要访问 `.value`。

### 练习：预测条件渲染行为

```vue
<script setup lang="ts">
import { ref } from 'vue';

const hasAccount = ref<boolean>(true);
const showBalance = ref<boolean>(false);

function toggleBalance(): void {
    showBalance.value = !showBalance.value;
}

function closeAccount(): void {
    hasAccount.value = false;
}
</script>

<template>
    <div v-if="hasAccount">
        <p>账户正常</p>

        <button @click="toggleBalance">
            查看余额
        </button>

        <p v-show="showBalance">
            余额：5000 元
        </p>

        <button @click="closeAccount">
            关闭账户
        </button>
    </div>

    <p v-else>账户不存在</p>
</template>
```

> [!EXERCISE] 初始显示与 DOM
>
> 初次加载显示哪些内容？“余额：5000 元”的 DOM 元素是否存在？
>
> 【答案】
>
> `hasAccount` 为 true，所以账户区域存在，显示“账户正常”、查看余额按钮和关闭账户按钮。
>
> `showBalance` 为 `false`，因此余额文本不可见，但其 DOM 元素仍存在。`v-show` 通过 CSS `display: none` 隐藏元素，不会删除它。

> [!EXERCISE] 切换余额显示
>
> 点击一次“查看余额”后发生什么？再次点击同一按钮后又如何？
>
> 【答案】
>
> 第一次执行 `showBalance.value` = !false，结果为 true，余额文本显示。
>
> 第二次执行 `showBalance.value` = !true，结果为 false，余额再次隐藏。
>
> 改变的是余额元素的显示状态，没有删除余额元素，也没有修改余额数据。

> [!EXERCISE] 关闭账户后的区域与状态
>
> 点击“关闭账户”后显示什么？原账户区域是否仍在 DOM 中？脚本中的响应式变量是否随之消失？
>
> 【答案】
>
> `closeAccount()` 将 `hasAccount.value` 改为 false。`v-if` 分支不再成立，Vue 卸载账户区域及其中的子元素，页面显示 `v-else` 的“账户不存在”。
>
> 这里只移除了组件模板中的一部分，没有卸载整个 Vue 组件，因此 `hasAccount`、`showBalance` 两个响应式变量仍然存在。
>
> 本练习的 `closeAccount()` 仅修改 `hasAccount`；不要与前面完整案例的 `updateAccountStatus()` 混淆，后者还会主动把 `showBalance` 重置为 false。

## 列表渲染与响应式数组

账户列表、交易明细和查询结果的数量通常由数组决定。**列表渲染**用于根据数组内容重复生成对应的页面结构。

### `v-for` 的基本语法

例如，账户数组中包含三条记录：

```typescript
const accounts = [
    { id: 101, name: '储蓄账户', balance: 5000 },
    { id: 102, name: '工资账户', balance: 8000 },
    { id: 103, name: '理财账户', balance: 12000 }
];
```

如果用普通 HTML 展示，需要分别编写三组元素：

```html
<p>储蓄账户：5000 元</p>
<p>工资账户：8000 元</p>
<p>理财账户：12000 元</p>
```

但实际项目中，账户数量由数据决定，不可能每返回一条账户信息就手动添加一段 HTML。

Vue 提供了 `v-for` 指令，能够根据数组中的数据重复渲染元素。

基本语法：

```vue
<div v-for="item in items">
    {{ item }}
</div>
```

其中：

- `items`：被遍历的数组。
- `item`：当前遍历到的数组元素。
- `in`：`v-for` 的语法关键字。

它的遍历过程可以与 JavaScript 数组遍历进行对照：

```javascript
items.forEach((item) => {
    // 处理当前数组元素
});
```

区别是：`forEach()` 执行 JavaScript 回调函数，而 `v-for` 根据数据重复生成模板对应的页面结构。

### 渲染列表前先认识 key

下面的完整程序将给每一行写 `:key="account.id"`。key 是供 Vue 区分节点身份的特殊属性，应该在同一组兄弟节点中稳定且唯一。这里使用账户 ID，不用账户当前处在数组中的位置。

```vue
<p v-for="account in accounts" :key="account.id">
    {{ account.name }}
</p>
```

v-for 决定重复生成几行，key 决定每行对应哪个业务身份。后面再通过插入和删除演示为什么动态列表不宜用下标作身份。

### 根据数组渲染账户列表

```vue
<script setup lang="ts">
import { ref } from 'vue';

// TypeScript 根据初始值推断数组元素的类型
const accounts = ref([
    { id: 101, name: '储蓄账户', balance: 5000 },
    { id: 102, name: '工资账户', balance: 8000 },
    { id: 103, name: '理财账户', balance: 12000 }
]);
</script>

<template>
    <div>
        <h2>我的账户</h2>

        <!-- 每个账户对象生成一行 -->
        <p
            v-for="account in accounts"
            :key="account.id"
        >
            {{ account.name }}：{{ account.balance }} 元
        </p>
    </div>
</template>
```

这里的 `account` 表示当前账户对象，因此可以使用 `account.name`、`account.balance` 访问它的属性。

`accounts` 是由 `ref()` 创建的响应式数组。在模板中，Vue 会自动解包顶层 `ref`，因此不需要写 `accounts.value`。

### 遍历时获取数组下标

`v-for` 可以提供第二个变量，用于表示当前元素的索引：

```vue
<p
    v-for="(account, index) in accounts"
    :key="account.id"
>
    {{ index + 1 }}. {{ account.name }}
</p>
```

`index` 从 `0` 开始，因此使用 `index + 1` 显示从 1 开始的序号。

### `key` 与列表节点的身份

可以注意到：

```vue
:key="account.id"
```

这行代码在企业项目中非常常见。

**`key` 是 Vue 用来识别列表中每个渲染节点身份的特殊属性。**

例如：

```text
账户 101 → 储蓄账户
账户 102 → 工资账户
账户 103 → 理财账户
```

当列表数据发生变化时，Vue 可以根据每个账户的 `key` 判断哪些节点需要保留、移动、创建或移除。

例如，假设删除账户 102，剩余账户 101 和账户 103。使用稳定的 `id` 作为 `key`，Vue 就能够正确识别这两个账户对应的节点。

#### 数组下标作为 `key` 的限制

下面这种写法不推荐用于会增加、删除或重新排序的账户列表：

```vue
<p
    v-for="(account, index) in accounts"
    :key="index"
>
    {{ account.name }}
</p>
```

原因是：删除或插入元素时，其他元素的 `index` 可能改变。

例如，删除第一条数据：

| 账户 | 删除前 `index` | 删除后 `index` |
|---|---|---|
| 账户 101 | 0 | 已删除 |
| 账户 102 | 1 | 0 |
| 账户 103 | 2 | 1 |

如果使用 `index` 作为 `key`，Vue 会按照位置识别元素，而不是按照账户的业务身份识别元素。

在列表包含输入框、子组件内部状态等内容时，这可能导致状态对应错误。

**企业项目推荐使用稳定且唯一的业务标识作为 `key`，例如账户 ID、交易流水号、用户 ID 等。** 这里的唯一性至少要保证同一列表的兄弟节点之间不重复。

### 响应式数组的修改方式

对于保存单个数值的 `ref`，通过 `.value` 修改数据：

```typescript
const balance = ref<number>(5000);
balance.value -= 100;
```

如果 `ref()` 保存的是数组，也可以通过 `.value` 访问和修改它：

```typescript
const accounts = ref([
    { id: 101, name: '储蓄账户' }
]);

// 新增账户
accounts.value.push({
    id: 102,
    name: '工资账户'
});

// 删除第一个账户
accounts.value.splice(0, 1);
```

这里 `push()` 和 `splice()` 都是 JavaScript 数组方法。因为 `ref()` 创建的响应式数组会追踪这些变更，所以 Vue 会安排列表的相关更新。

还可以使用 `filter()` 创建新数组，并将其重新赋值给 `.value`：

```typescript
// 保留 id 不等于 102 的账户
accounts.value = accounts.value.filter(
    account => account.id !== 102
);
```

**注意：** `filter()` 本身不会修改原数组，而是返回一个新数组，所以这里需要给 `accounts.value` 重新赋值。

### 综合示例：账户列表新增与删除

```vue
<script setup lang="ts">
import { ref } from 'vue';

// 响应式账户列表
const accounts = ref([
    { id: 101, name: '储蓄账户', balance: 5000 },
    { id: 102, name: '工资账户', balance: 8000 }
]);

// 新增账户
function addAccount(): void {
    accounts.value.push({
        id: 103,
        name: '理财账户',
        balance: 12000
    });
}

// 根据账户 ID 删除对应记录
function deleteAccount(id: number): void {
    accounts.value = accounts.value.filter(
        account => account.id !== id
    );
}
</script>

<template>
    <div>
        <h2>账户列表</h2>

        <div
            v-for="account in accounts"
            :key="account.id"
        >
            <span>
                {{ account.name }}：{{ account.balance }} 元
            </span>

            <!-- 将当前账户 ID 传递给删除函数 -->
            <button @click="deleteAccount(account.id)">
                删除
            </button>
        </div>

        <button @click="addAccount">
            添加理财账户
        </button>
    </div>
</template>
```

本例为简化教学，`addAccount()` 使用了固定 ID，因此只适合新增一次。实际业务中需要保证新增记录的标识唯一。

> [!WARNING] 避免在同一元素上混用列表与条件筛选
>
> 不要在同一个元素上同时使用 `v-for` 与依赖当前遍历变量的 `v-if` 来过滤列表。`v-if` 的优先级更高，不能直接使用该元素上由 `v-for` 定义的变量。本笔记通过业务函数先生成需要展示的数组，再进行列表渲染。

> [!NOTE] 固定 ID 的教学示例只新增一次
>
> 本例 `addAccount()` 使用固定 ID 103，适合观察一次新增操作。重复调用会产生重复 ID；实际业务需要保证同一列表的记录标识唯一。

### 练习：账户列表新增与删除

```vue
<script setup lang="ts">
import { ref } from 'vue';

const accounts = ref([
    { id: 1, name: '账户A', balance: 1000 },
    { id: 2, name: '账户B', balance: 2000 }
]);

function addAccount(): void {
    accounts.value.push({
        id: 3,
        name: '账户C',
        balance: 3000
    });
}

function deleteAccount(id: number): void {
    accounts.value = accounts.value.filter(
        account => account.id !== id
    );
}
</script>

<template>
    <div
        v-for="(account, index) in accounts"
        :key="index"
    >
        {{ account.name }}：{{ account.balance }}
        <button @click="deleteAccount(account.id)">
            删除
        </button>
    </div>

    <button @click="addAccount">新增</button>
</template>
```

> [!EXERCISE] 新增后删除的结果
>
> 先点击一次“新增”，再删除账户 B，最终显示哪些账户和余额？
>
> 【答案】
>
> 新增后数组依次为 A（1000 元）、B（2000 元）、C（3000 元）。删除 B 时，`filter` 保留 id 不等于 2 的记录，最终显示 **A：1000 元、C：3000 元**。

> [!EXERCISE] 修复列表 `key`
>
> 这里使用 :`key`="`index`" 有什么问题？应改成什么？
>
> 【答案】
>
> 动态列表插入、删除或重排后，`index` 会随位置变化。Vue 可能复用原来对应其他账户的节点，导致输入框或子组件内部状态错位。应改为 `:key="account.id"`，使用稳定且唯一的业务标识。下节以输入框备注详细说明。

> [!EXERCISE] 为什么接收 `filter` 的结果
>
> 为什么删除函数要写 `accounts.value = accounts.value.filter(...)`？省略赋值会怎样？
>
> 【答案】
>
> `filter()` 不修改原数组，而是返回新数组。将返回值赋给 `accounts.value`，模板才能读取新的展示数组。
>
> 如果只写：
>
> ```typescript
> accounts.value.filter(account => account.id !== id);
> ```
>
> 筛选仍会执行，但返回结果被丢弃，`accounts.value` 不变，页面列表不会因为这次调用发生变化。也可以使用 `splice` 等直接修改数组的方法，但其执行方式与 `filter` 不同。

### 使用下标作为 `key` 的状态错位示例

```vue
<script setup lang="ts">
import { ref } from 'vue';

const accounts = ref([
    { id: 1, name: '账户A' },
    { id: 2, name: '账户B' },
    { id: 3, name: '账户C' }
]);

function deleteAccount(id: number): void {
    accounts.value = accounts.value.filter(
        account => account.id !== id
    );
}
</script>

<template>
    <div
        v-for="(account, index) in accounts"
        :key="index"
    >
        <span>{{ account.name }}</span>

        <input placeholder="请输入备注" />

        <button @click="deleteAccount(account.id)">
            删除
        </button>
    </div>
</template>
```

这里的输入框没有通过 `v-model` 绑定数据。用户输入的文字由浏览器保存在输入框的 DOM 状态中。

假设在账户 B 的输入框中填写了“工资账户”，初始 DOM 节点可以理解为：

| `key` | 账户 | 输入框中的内容 |
|---|---|---|
| 0 | 账户 A | 空 |
| 1 | 账户 B | 工资账户 |
| 2 | 账户 C | 空 |

现在删除账户 A，数组变为：

```typescript
[
    { id: 2, name: '账户B' },
    { id: 3, name: '账户C' }
]
```

新的 `index` 变成：

| `key` | 账户 |
|---|---|
| 0 | 账户 B |
| 1 | 账户 C |

Vue 使用 `key` 识别节点，因此：

- 原来 `key=0` 的账户 A 节点被复用来展示账户 B。
- 原来 `key=1` 的账户 B 节点被复用来展示账户 C。
- 原来 `key=2` 的账户 C 节点被移除。

**问题就在这里：节点被复用时，输入框中的用户输入状态并不会因为账户名称变了就自动清空。**

因此，账户 B 的备注可能跟着原来的 DOM 节点出现在账户 C 下面。

可以发现，账户名称显示正确，但输入框的内容却错位了。

这就是使用数组下标作为 `key` 的典型问题。

改成：

```vue
<div
    v-for="account in accounts"
    :key="account.id"
>
```

账户列表的节点身份不再取决于它所在的位置，而是取决于账户自身的唯一 ID。

删除账户 A 后：

| `key` | 原来的账户 | 操作 |
|---|---|---|
| 1 | 账户 A | 删除 |
| 2 | 账户 B | 保留原节点 |
| 3 | 账户 C | 保留原节点 |

因为账户 B 的 `key` 始终是 `2`，所以 Vue 可以保持它对应的 DOM 节点及输入框状态，不会错误地复用到账户 C。

**这就是 `key` 的本质：告诉 Vue，哪些节点代表同一个业务对象，而不是仅仅告诉 Vue 它位于数组的第几个位置。**

需要记住两点：

- 对于会新增、删除、插入或调整顺序的业务列表，优先使用稳定、唯一的业务 ID。
- `key` 不能解决所有状态管理问题，它解决的是 Vue 在列表更新时如何识别和复用节点的问题。输入数据依然应该根据业务需求正确管理。

`filter()` 不会修改原数组，它会返回一个新的数组。

如果只写：

```typescript
accounts.value.filter(account => account.id !== id);
```

那么筛选确实执行了，但返回的新数组没有被保存，原来的 `accounts.value` 不发生变化，页面中的账户列表也就不会因为这次调用而改变。

因此，必须将筛选结果重新赋值给 `accounts.value`，或者使用 `splice()` 等能够直接修改原数组的方法。

## Element Plus 基础组件

Element Plus 是基于 Vue 3 的 UI 组件库，提供按钮、输入框、标签和空状态等可重复使用的界面组件。以下示例以项目中已经配置好相应组件为前提。

原生 HTML 按钮可以绑定 Vue 事件：

```vue
<button @click="deleteAccount(account.id)">
    删除
</button>
```

但企业项目中的按钮还需要统一颜色、尺寸、禁用状态、加载动画等样式和行为。

如果每个页面都从零编写 CSS，开发成本会很高。

**Element Plus 是基于 Vue 3 的 UI 组件库**，提供了大量可以直接使用的界面组件，例如：

| Element Plus 组件 | 功能 |
|---|---|
| `el-button` | 按钮 |
| `el-input` | 输入框 |
| `el-form` | 表单 |
| `el-table` | 表格 |
| `el-pagination` | 分页 |
| `el-dialog` | 弹窗 |
| `el-tag` | 状态标签 |
| `el-empty` | 空数据提示 |

可以将它们理解为经过封装、可以重复使用的页面功能组件。

**需要区分：Vue 负责响应式和组件运行机制，Element Plus 提供现成的界面组件。**

### `el-button`：按钮组件

```vue
<el-button type="primary" @click="handleQuery">
    查询
</el-button>

<el-button @click="handleReset">
    重置
</el-button>
```

这里：

- `el-button` 是 Element Plus 提供的 Vue 组件。
- `type="primary"` 是组件属性（Prop），指定按钮的视觉类型。
- `@click` 仍然是 Vue 的事件绑定语法。

Element Plus 的使用仍沿用前面介绍的 Vue 事件处理语法。

例如，`el-button` 也支持 `disabled`：

```vue
<el-button :disabled="balance < 100">
    支付
</el-button>
```

与原生按钮一样，`:` 表示将后面的 JavaScript 表达式结果绑定到属性上。

### 状态标签与空数据提示

在账户列表中，经常需要展示账户状态：

```vue
<el-tag type="success">正常</el-tag>
<el-tag type="danger">冻结</el-tag>
```

`el-tag` 用于显示状态标签，`type` 决定其视觉样式。

如果查询没有返回数据，可以使用：

```vue
<el-empty description="暂无账户数据" />
```

它会显示空状态提示。

### 删除按钮将使用的属性

`type="danger"` 表示危险操作的视觉样式，不会自动删除或弹出确认。`size="small"` 指定小尺寸，适合列表行内按钮。

```vue
<el-button type="danger" size="small" @click="deleteAccount(101)">删除</el-button>
```

点击时传入 ID 101，真正操作由函数决定。改变 type 或 size 只改变外观，不改变删除目标。

### 综合示例：账户列表与状态标签

```vue
<script setup lang="ts">
import { ref } from 'vue';

// 定义账户列表
const accounts = ref([
    { id: 101, name: '储蓄账户', status: 'normal' },
    { id: 102, name: '工资账户', status: 'frozen' }
]);

// 根据账户 ID 删除数据
function deleteAccount(id: number): void {
    accounts.value = accounts.value.filter(
        account => account.id !== id
    );
}
</script>

<template>
    <div>
        <h2>账户列表</h2>

        <!-- 当数组没有数据时，显示空状态 -->
        <el-empty
            v-if="accounts.length === 0"
            description="暂无账户数据"
        />

        <!-- 遍历账户数据，生成列表 -->
        <div
            v-for="account in accounts"
            :key="account.id"
        >
            <span>{{ account.name }}</span>

            <!-- 根据状态动态决定标签样式 -->
            <el-tag
                :type="account.status === 'normal'
                    ? 'success'
                    : 'danger'"
            >
                {{ account.status === 'normal' ? '正常' : '冻结' }}
            </el-tag>

            <el-button
                type="danger"
                size="small"
                @click="deleteAccount(account.id)"
            >
                删除
            </el-button>
        </div>
    </div>
</template>
```

这个案例已经有了企业项目常见的基本结构：

- `script`：保存账户数据，处理删除逻辑。
- `v-for`：根据数据生成账户行。
- `el-tag`：根据账户状态显示不同标签。
- `el-button`：触发账户删除操作。
- `el-empty`：没有账户数据时显示提示。

### 练习：冻结账户不允许删除

> [!EXERCISE] 动态禁用当前行的删除按钮
>
> 在本节 Element Plus 账户列表的删除按钮上补充属性：正常账户可删除，冻结账户的按钮禁用。
>
> 【答案】
>
> ```vue
> <el-button
>     type="danger"
>     size="small"
>     :disabled="account.status === 'frozen'"
>     @click="deleteAccount(account.id)"
> >
>     删除
> </el-button>
> ```
>
> `disabled` 才是按钮用于控制禁用的属性名，不能写成 `disable`。
>
> `accounts` 是整个数组；`account` 是 `v-for` 当前遍历到的账户对象。应读取 `account.status`，不能写 `accounts.status`。
>
> 冻结账户比较结果为 true，按钮禁用；正常账户比较结果为 false，按钮可点击。使用严格相等运算符 ===，避免 == 比较中的隐式类型转换。

### 空状态提示与列表的组织方式

**`v-if` 可以独立使用，后面不要求必须有 `v-else`。**

`v-if` 可以独立控制一组内容，也可以与其他条件分支组合使用。

#### 独立使用 `v-if`

```vue
<p v-if="hasAccount">账户信息</p>
```

- `hasAccount === true`：渲染 `<p>`。
- `hasAccount === false`：不渲染 `<p>`，不会自动显示其他内容。

也就是说，`v-if` 本身就有完整的判断能力。

#### 使用互斥的条件分支

```vue
<p v-if="hasAccount">账户信息</p>
<p v-else>暂无账户信息</p>
```

- `hasAccount === true`：显示“账户信息”。
- `hasAccount === false`：显示“暂无账户信息”。

因此，**只有需要在条件不成立时展示另一组内容，才需要使用 `v-else`。**

#### 空数组与独立的列表渲染

原来的代码是：

```vue
<template>
    <!-- 没有账户时显示空状态 -->
    <el-empty
        v-if="accounts.length === 0"
        description="暂无账户数据"
    />

    <!-- 遍历账户数组 -->
    <div
        v-for="account in accounts"
        :key="account.id"
    >
        {{ account.name }}
    </div>
</template>
```

这里的 `v-if` 与 `v-for` 是**两个独立的指令**，并没有组成 `if...else` 分支。

| 条件 | `el-empty` | `v-for` |
|---|---|---|
| `accounts` 为空数组 | 显示“暂无账户数据” | 遍历 0 次，不生成账户行 |
| `accounts` 有数据 | 不显示空状态 | 遍历数组并生成账户行 |

所以，即使不写 `v-else`，也能实现预期效果。

也可以明确使用 `v-if...v-else`：

```vue
<template>
    <el-empty
        v-if="accounts.length === 0"
        description="暂无账户数据"
    />

    <template v-else>
        <div
            v-for="account in accounts"
            :key="account.id"
        >
            {{ account.name }}
        </div>
    </template>
</template>
```

`<template v-else>` 用于将内部的一组内容组织为条件分支。

它表示将内部的多个元素作为一个条件分支，而 `<template>` 本身不会生成额外的真实 DOM 元素。

两种写法在当前案例中最终展示的内容相同。第二种写法更明确地表达了“没有数据时显示空状态，否则显示列表”的互斥关系。

## 表单输入与双向绑定

### 用户输入与响应式状态

响应式数据可以由脚本函数修改，例如：

```typescript
const accountName = ref<string>('张三');

function changeName(): void {
    accountName.value = '李四';
}
```

输入框则需要把用户填写的内容保存到状态中。

例如，用户在客户姓名输入框中输入“王五”时，页面需要完成以下同步：

1. 输入框显示“王五”。
2. Vue 中的 `accountName.value` 自动变成 `'王五'`。
3. 其他使用 `accountName` 的页面内容同步更新。

Vue 提供 `v-model` 指令，专门简化这类数据绑定。

### `v-model` 的基本用法

`v-model` 是 Vue 提供的**双向绑定指令**，可以在表单输入元素和 JavaScript 状态之间同步数据。

对于文本输入框，它主要解决两个方向的数据同步：

- **数据 → 输入框：** 修改 `accountName.value`，输入框会显示新值。
- **输入框 → 数据：** 用户在输入框输入文字时，Vue 会更新 `accountName.value`。

#### 原生文本输入框

```vue
<script setup lang="ts">
import { ref } from 'vue';

// 定义响应式客户姓名
const accountName = ref<string>('张三');
</script>

<template>
    <div>
        <input v-model="accountName" />

        <p>当前客户：{{ accountName }}</p>
    </div>
</template>
```

当用户在输入框中修改客户姓名时，下面的文本会跟着变化。

注意，`v-model="accountName"` 在模板中不需要 `.value`，因为它引用的是顶层 `ref`。但如果在 `script` 中操作该变量，仍然需要通过 `.value`。

### `v-model` 与 `:value` 的区别

双向绑定与单独的属性绑定在输入同步方向上有所不同。

对于原生文本输入框，可以从概念上将：

```vue
<input v-model="accountName" />
```

理解成：

```vue
<input
    :value="accountName"
    @input="accountName = ($event.target as HTMLInputElement).value"
/>
```

上面是解释其基本原理的等价示意，实际 TypeScript 项目中会更适合把事件处理写到脚本函数中。

这里的 `$event` 是 Vue 模板事件处理表达式中用于引用原生事件对象的特殊变量，`HTMLInputElement` 是 TypeScript 提供的 HTML 输入框元素类型。

它体现了两件事：

- `:value` 把 Vue 数据显示到输入框。
- `@input` 监听用户输入，把新值写回 Vue 数据。

`v-model` 将这两个方向的同步组织在同一条指令中。

因此：

| 写法 | 作用 |
|---|---|
| `:value="accountName"` | 将数据绑定到输入框的值，不会自动把用户输入写回数据 |
| `v-model="accountName"` | 同时处理数据展示与用户输入后的状态更新 |

对于文本输入框，`v-model` 在正常输入时根据 `input` 事件更新数据；使用中文输入法时，输入法组合输入阶段有特殊处理，提交组合文本后才同步。这个细节以后讨论表单事件时再深入。

> [!NOTE] `v-model` 的职责
>
> `v-model` 并不负责创建响应式数据。本例的响应式能力来自 `ref`；`v-model` 负责建立输入框与数据之间的同步关系。

### Element Plus 输入框

在企业项目中，通常不会直接使用原生 `<input>`，而是使用 Element Plus 的 `el-input`。

```vue
<script setup lang="ts">
import { ref } from 'vue';

// 查询条件
const customerName = ref<string>('');

// 查询函数
function handleQuery(): void {
    // 读取用户当前输入的姓名
    console.log('查询客户：', customerName.value);
}

// 重置函数
function handleReset(): void {
    // 清空响应式数据，输入框也会清空
    customerName.value = '';
}
</script>

<template>
    <div>
        <el-input
            v-model="customerName"
            placeholder="请输入客户姓名"
        />

        <el-button type="primary" @click="handleQuery">
            查询
        </el-button>

        <el-button @click="handleReset">
            重置
        </el-button>

        <p>当前输入：{{ customerName }}</p>
    </div>
</template>
```

输入同步与业务操作需要分别处理：

**修改 `customerName.value` 和操作输入框，是通过 `v-model` 联系起来的，但点击“查询”按钮才会执行 `handleQuery()`。**

也就是说，用户输入姓名会更新查询条件，但不会因为使用了 `v-model` 就自动调用查询函数。

因此，输入框的数据同步与查询函数的执行时机应分别判断，不能仅凭模板使用了 `v-model` 就认定列表会立即更新。

### 单向绑定的持续更新关系

#### 从数据到输入框的单向同步

两种绑定方式如下：

```vue
<input :value="name" />

<input v-model="name" />
```

两者最核心的区别在于数据传递的方向。

**单向绑定不表示只在初始化时赋值一次。**

只要 `name.value` 发生变化，Vue 就会更新 `:value` 绑定的输入框内容。

但是反过来，用户修改输入框的内容，不会自动修改 `name.value`。

#### 双输入框示例与状态变化

以下组件用两个输入框和一段文本观察数据同步：

```vue
<script setup lang="ts">
import { ref } from 'vue';

const name = ref<string>('张三');

function handleReset(): void {
    name.value = '默认客户';
}
</script>

<template>
    <input v-model="name" />

    <input :value="name" />

    <p>客户姓名：{{ name }}</p>

    <button @click="handleReset">
        重置
    </button>
</template>
```

**1. 初始状态**

`name.value` 为 `'张三'`，所以：

| 位置 | 显示内容 |
|---|---|
| 第一个输入框（`v-model`） | 张三 |
| 第二个输入框（`:value`） | 张三 |
| 页面文本 | 张三 |

**2. 修改第一个输入框为“李四”**

第一个输入框使用 `v-model`。

当用户输入“李四”时，Vue 会自动修改：

```typescript
name.value = '李四';
```

由于响应式数据发生变化，绑定它的其他页面内容也会更新。

因此，两个输入框和文本全部显示“李四”。

**3. 修改第二个输入框为“王五”**

用户手动把第二个输入框改成了“王五”。

浏览器允许用户编辑输入框，因此第二个输入框确实会显示“王五”。

但是，`:value` 没有负责把输入事件中的新值写回 `name.value`。

所以此时：

| 位置 | 当前内容 |
|---|---|
| `name.value` | 李四 |
| 第一个输入框 | 李四 |
| 第二个输入框 | 王五 |
| 页面文本 | 李四 |

也就是说，**输入框当前的内容和 Vue 中保存的数据可以暂时不一致。**

这并不矛盾，因为 `:value` 没有实现从输入框到 Vue 数据的同步。

**4. 点击“重置”按钮**

执行：

```typescript
name.value = '默认客户';
```

此时 Vue 中的数据发生变化。

于是：

- 第一个输入框通过 `v-model` 更新。
- 第二个输入框通过 `:value` 更新。
- 页面文本通过 `{{ name }}` 更新。

最终三个位置全部显示“默认客户”。

#### 双向同步的工作原理

对于原生文本输入框，`v-model` 可以理解为同时完成了两个工作。

**第一步：将数据绑定到输入框。**

```vue
<input :value="name" />
```

**第二步：监听用户的输入，把新值更新到 Vue 数据。**

Vue 使用输入事件完成这一操作。

因此：

```vue
<input v-model="name" />
```

在基本工作原理上，相当于：**`:value` + `@input` 事件处理。**

阅读业务项目代码时，需要区分两种情况：

- 使用 `v-model`：组件已经建立了相应的双向数据同步机制。
- 使用单独的 `:value`：如果还需要将用户输入保存到响应式数据，就必须另外实现输入事件处理等逻辑。

可以将它记成一句话：

**`:value` 负责“把数据给输入框”；`v-model` 既负责“把数据给输入框”，也负责“把输入框的新值写回数据”。**

### 练习：双输入框的状态变化

> [!EXERCISE] 编辑 `v-model` 输入框
>
> 使用上面的双输入框组件，把第一个输入框从张三改为李四后，name.value、第二个输入框和页面文本分别是什么？
>
> 【答案】
>
> 第一个输入框使用 `v-model`，用户输入会将 name.value 更新为李四。第二个输入框的 `:value` 和文本插值也依赖同一份数据，所以第二个输入框与页面文本都显示李四。

> [!EXERCISE] 编辑 `:value` 输入框
>
> 接着把第二个输入框改为王五。name.value 会自动变化吗？两个输入框和页面文本分别显示什么？
>
> 【答案】
>
> 不会自动变化。第二个输入框在浏览器中可被编辑并显示王五，但 `:value` 没有把新输入写回 name.value。数据仍为李四，第一个输入框和页面文本也仍为李四。输入框的临时 DOM 状态可以与 Vue 数据不一致。

> [!EXERCISE] 脚本修改绑定数据
>
> 在上述状态下点击重置，函数把 name.value 设为默认客户。两个输入框和文本各显示什么？为什么？
>
> 【答案】
>
> 三个位置都显示默认客户。数据发生变化后，第一个输入框通过 `v-model` 更新，第二个通过 `:value` 更新，文本通过插值更新。这说明 `:value` 持续建立从数据到属性的绑定，不是只初始化一次。

### 练习：原生输入框的单向绑定

```vue
<script setup lang="ts">
import { ref } from 'vue';

const keyword = ref<string>('ABC');

function changeKeyword(): void {
    keyword.value = 'XYZ';
}
</script>

<template>
    <input :value="keyword" />

    <p>{{ keyword }}</p>

    <button @click="changeKeyword">修改数据</button>
</template>
```

> [!EXERCISE] 手动输入后读取状态
>
> 用户将输入框中的 ABC 改为 123，但尚未点击按钮。`keyword.value` 是什么？段落显示什么？
>
> 【答案】
>
> `keyword.value` 仍为 ABC，段落也显示 ABC；只有输入框暂时显示 123。单独的 `:value` 不监听并保存新的用户输入。

> [!EXERCISE] 通过按钮修改数据
>
> 随后点击“修改数据”按钮。输入框和段落显示什么？
>
> 【答案】
>
> 按钮调用 `changeKeyword()`，执行 `keyword.value` = 'XYZ'。响应式数据变化后，输入框通过 `:value` 更新为 XYZ，段落也显示 XYZ。

### 综合示例：根据账户名称查询

名称查询中需要区分两个不同的过程：

**输入过程负责更新条件，查询过程负责根据条件生成展示结果。** 是否在输入时立即查询，取决于业务代码如何关联这两个过程。

以下示例在单击查询按钮后更新列表。

#### 查询条件与查询结果的职责

假设页面有一个“账户名称”输入框。

用户输入“工资”，然后点击“查询”，页面才显示工资账户。

因此，可以用两个响应式变量分别保存输入条件与展示结果：

```typescript
// 用户正在输入的查询条件
const queryName = ref<string>('');

// 当前页面展示的查询结果
const displayedAccounts = ref(sourceAccounts);
```

它们的职责不同：

| 变量 | 职责 | 修改时机 |
|---|---|---|
| `queryName` | 保存用户输入的账户名称 | 用户输入时，通过 `v-model` 更新 |
| `displayedAccounts` | 保存当前查询结果 | 执行查询或重置函数时更新 |

所以，**查询条件发生变化，不代表查询结果必须立即变化。**

输入条件是否立即影响列表，由业务代码决定；Vue 的输入同步机制本身不会强制执行查询。

#### 账户名称查询组件

下面使用 Element Plus 的 `el-input` 实现账户名称输入，并通过按钮触发查询。

```vue
<script setup lang="ts">
import { ref } from 'vue';

// 原始账户数据
const sourceAccounts = [
    { id: 101, name: '储蓄账户', balance: 5000 },
    { id: 102, name: '工资账户', balance: 8000 },
    { id: 103, name: '理财账户', balance: 12000 }
];

// 用户输入的查询条件
const queryName = ref<string>('');

// 页面展示的账户列表
const displayedAccounts = ref(sourceAccounts);

// 查询账户
function handleQuery(): void {
    // 去除查询条件首尾的空格
    const keyword = queryName.value.trim();

    // 查询条件为空，展示全部账户
    if (keyword === '') {
        displayedAccounts.value = sourceAccounts;
        return;
    }

    // 根据账户名称筛选数据
    displayedAccounts.value = sourceAccounts.filter(
        account => account.name.includes(keyword)
    );
}

// 重置查询条件和展示结果
function handleReset(): void {
    queryName.value = '';
    displayedAccounts.value = sourceAccounts;
}
</script>

<template>
    <div>
        <h2>账户查询</h2>

        <!-- 用户输入时更新 queryName -->
        <el-input
            v-model="queryName"
            placeholder="请输入账户名称"
        />

        <el-button
            type="primary"
            @click="handleQuery"
        >
            查询
        </el-button>

        <el-button @click="handleReset">
            重置
        </el-button>

        <p>查询结果：{{ displayedAccounts.length }} 条</p>

        <el-empty
            v-if="displayedAccounts.length === 0"
            description="没有符合条件的账户"
        />

        <div v-else>
            <div
                v-for="account in displayedAccounts"
                :key="account.id"
            >
                {{ account.name }}：{{ account.balance }} 元
            </div>
        </div>
    </div>
</template>
```

这里出现了两个 JavaScript 字符串方法：

- `trim()`：移除字符串首尾的空白字符，例如 `' 工资 '` 处理后得到 `'工资'`。
- `includes(keyword)`：判断字符串中是否包含指定内容。例如 `'工资账户'.includes('工资')` 返回 `true`。它区分大小写。

`return` 表示立即结束当前函数，因此查询条件为空时，不会再执行后面的筛选逻辑。

#### 从输入到列表更新的执行过程

假设用户在输入框中输入“工资”。

1. **用户输入“工资”**：`v-model` 将输入内容同步给 `queryName.value`，此时它的值是 `'工资'`。
2. **账户列表暂时不变**：因为还没有执行 `handleQuery()`，所以 `displayedAccounts` 仍然包含三条账户。
3. **用户点击“查询”**：`@click` 触发 `handleQuery()`，函数读取 `queryName.value`。
4. **筛选并更新结果**：`filter()` 返回符合条件的账户，将新数组赋值给 `displayedAccounts.value`。
5. **Vue 更新列表**：`v-for` 根据新的 `displayedAccounts` 渲染，此时只显示工资账户。

### 练习：条件、查询和重置

> [!EXERCISE] 逐步预测查询状态
>
> 使用本节账户名称查询组件，依次执行：
>
> 1. 页面初次加载。
> 2. 输入“工资”，不查询。
> 3. 点击查询。
> 4. 将输入改为“理财”，不查询。
> 5. 点击重置。
>
> 说明第 2～5 步的查询条件与展示结果。
>
> 【答案】
>
> | 操作 | `queryName.value` | `displayedAccounts.value` |
> | --- | --- | --- |
> | 输入工资 | 工资 | 全部三条账户 |
> | 点击查询 | 工资 | 工资账户，一条记录的数组 |
> | 改为理财，不查询 | 理财 | 仍为工资账户，一条记录的数组 |
> | 点击重置 | 空字符串 | 恢复全部三条账户 |
>
> `v-model` 更新的是输入条件，不会自动执行 `handleQuery`。第四步结果保持不变；第五步执行 `handleReset`，而不是按新条件再次查询。
>
> 重置函数中，`queryName.value` = '' 清空条件，`displayedAccounts.value` = `sourceAccounts` 恢复完整列表。

> [!EXERCISE] 增加只清空输入的按钮
>
> 增加 `handleClearInput()` 和对应 el-button。要求只清空名称输入，不能改变当前查询结果，也不能调用 `handleReset`。
>
> 【答案】
>
> ```typescript
> function handleClearInput(): void {
>     queryName.value = '';
> }
> ```
>
> ```vue
> <el-button @click="handleClearInput">清空输入</el-button>
> ```
>
> 函数只修改 `queryName`，没有修改 `displayedAccounts`，因此输入框清空、结果保留，也没有重新筛选。

### 清空输入、查询与重置的区别

```typescript
// 仅清空输入框
function handleClearInput(): void {
    queryName.value = '';
}

// 重置整个查询区域
function handleReset(): void {
    queryName.value = '';
    displayedAccounts.value = sourceAccounts;
}
```

虽然两个函数都会清空输入框，但它们对查询结果的处理不同。

**清空输入**只改变查询条件；**重置**同时恢复查询条件和结果数据。

这说明在 Vue 中，界面上的每个按钮执行什么操作，最终由对应的业务函数决定，而不是由按钮名称或者 `v-model` 自动决定。

> [!WARNING] `filter` 的结果始终是数组
>
> `filter()` 返回值可以有零条、一条或多条元素。一条工资账户也应写为：
>
> ```typescript
> [
>     { id: 102, name: '工资账户', balance: 8000 }
> ]
> ```
>
> 不能去掉外层方括号，把展示列表误写为单个账户对象。

## Vue 业务页面的数据流与代码阅读

Vue 业务页面将数据处理、响应式状态与模板展示联系起来。阅读代码时，除了理解各条语法，还需要追踪用户操作如何改变状态，以及状态如何影响页面。

以账户查询为例，需要明确功能入口、函数执行顺序，以及查询条件、原始数据、展示结果之间的关系。单独修改其中一个状态，并不意味着其他状态也会自动改变。

### 从功能入口追踪页面行为

阅读 `AccountQuery.vue` 时，可以先确定需要分析的页面功能，再查找其事件入口、处理函数与相关状态，逐步建立局部代码之间的联系。

#### 事件、函数、状态与视图

一个简单的 Vue 业务页面，可以先拆成四个部分：

1. **页面入口**：用户点击“查询账户”按钮，触发 `@click="handleQuery(...)"`。
2. **业务处理函数**：`handleQuery()` 读取查询条件、筛选数据。
3. **响应式状态**：`displayedAccounts.value` 保存需要展示的查询结果。
4. **页面展示**：`v-for="account in displayedAccounts"` 展示筛选后的账户列表。

这四个部分共同构成一个业务操作的数据流。

这里的“页面入口”表示用户触发当前功能的位置，例如查询按钮；它与整个 Vue 应用的启动入口不是同一个概念。

### 原始数据与展示数据

在编写完整页面前，需要先区分两类数据：

- **原始账户数据**：当前可供查询的全部账户。
- **页面展示数据**：根据查询条件筛选后，实际显示在页面上的账户。

例如：

```typescript
// 原始账户数据
const sourceAccounts = [
    { id: 101, name: '储蓄账户', status: 'normal', balance: 5000 },
    { id: 102, name: '工资账户', status: 'frozen', balance: 8000 },
    { id: 103, name: '理财账户', status: 'normal', balance: 12000 }
];
```

这里的 `status` 表示账户状态：

- `'normal'`：正常。
- `'frozen'`：冻结。

现在假设用户只查询正常账户。

可以通过 JavaScript 数组方法 `filter()` 生成查询结果：

```typescript
const result = sourceAccounts.filter(
    account => account.status === 'normal'
);
```

筛选结果是一个新数组：

```typescript
[
    { id: 101, name: '储蓄账户', status: 'normal', balance: 5000 },
    { id: 103, name: '理财账户', status: 'normal', balance: 12000 }
]
```

这里需要明确：

**`filter()` 只负责按照条件筛选数据，不负责更新 Vue 页面。**

如果希望页面随着查询结果变化，就需要把结果保存到 Vue 的响应式数据中。

```typescript
const displayedAccounts = ref(sourceAccounts);

// 根据条件筛选数据，并修改响应式状态
displayedAccounts.value = sourceAccounts.filter(
    account => account.status === 'normal'
);
```

这样，模板中依赖 `displayedAccounts` 的部分才会随之更新。

**JavaScript 负责数据筛选，Vue 负责响应式追踪与视图更新。** 只有数据处理结果进入模板使用的状态，页面才会展示相应结果。

### 综合示例：按账户状态查询

以下组件使用本地数组模拟账户数据，展示按状态查询、结果统计、空状态与重置操作。

文件名称：`AccountQuery.vue`

组件中的查询条件、展示数组与模板区域具有明确的对应关系。

```vue
<script setup lang="ts">
import { ref } from 'vue';

// 1. 模拟原始账户数据
const sourceAccounts = [
    { id: 101, name: '储蓄账户', status: 'normal', balance: 5000 },
    { id: 102, name: '工资账户', status: 'frozen', balance: 8000 },
    { id: 103, name: '理财账户', status: 'normal', balance: 12000 }
];

// 2. 当前查询条件，all 表示全部账户
const currentStatus = ref<string>('all');

// 3. 页面实际展示的账户列表
const displayedAccounts = ref(sourceAccounts);

// 4. 根据账户状态查询数据
function handleQuery(status: string): void {
    // 保存用户选择的查询条件
    currentStatus.value = status;

    // 根据查询条件生成新的展示数据
    if (status === 'all') {
        displayedAccounts.value = sourceAccounts;
    } else {
        displayedAccounts.value = sourceAccounts.filter(
            account => account.status === status
        );
    }
}

// 5. 重置查询条件和账户列表
function handleReset(): void {
    currentStatus.value = 'all';
    displayedAccounts.value = sourceAccounts;
}
</script>

<template>
    <div class="account-page">
        <h2>账户查询</h2>

        <!-- 查询操作区域 -->
        <div class="query-actions">
            <el-button
                type="primary"
                @click="handleQuery('normal')"
            >
                查询正常账户
            </el-button>

            <el-button @click="handleQuery('frozen')">
                查询冻结账户
            </el-button>

            <el-button @click="handleQuery('closed')">
                查询已销户账户
            </el-button>

            <el-button @click="handleReset">
                重置
            </el-button>
        </div>

        <!-- 当前查询条件和结果数量 -->
        <p>当前查询条件：{{ currentStatus }}</p>
        <p>查询结果：{{ displayedAccounts.length }} 条</p>

        <!-- 查询结果为空时显示提示 -->
        <el-empty
            v-if="displayedAccounts.length === 0"
            description="没有符合条件的账户"
        />

        <!-- 查询结果不为空时展示账户 -->
        <div v-else>
            <div
                v-for="account in displayedAccounts"
                :key="account.id"
                class="account-item"
            >
                <span>{{ account.name }}</span>

                <span>{{ account.balance }} 元</span>

                <el-tag
                    :type="account.status === 'normal'
                        ? 'success'
                        : 'danger'"
                >
                    {{ account.status === 'normal' ? '正常' : '冻结' }}
                </el-tag>
            </div>
        </div>
    </div>
</template>

<style scoped>
.account-page {
    padding: 20px;
}

.query-actions {
    margin-bottom: 20px;
}

.account-item {
    display: flex;
    gap: 20px;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #ddd;
}
</style>
```

#### 查询按钮与事件入口

“查询正常账户”的功能入口位于模板中的按钮：

```vue
<el-button
    type="primary"
    @click="handleQuery('normal')"
>
    查询正常账户
</el-button>
```

通过这段代码，可以立即知道：

1. 页面使用 Element Plus 按钮组件。
2. 用户点击按钮后，会调用 `handleQuery()`。
3. 调用时传入字符串 `'normal'`。

沿事件绑定定位 `handleQuery` 的定义，可以继续分析条件与结果如何产生。

#### 查询函数的参数与分支

在 `<script setup>` 中找到：

```typescript
function handleQuery(status: string): void {
    currentStatus.value = status;

    if (status === 'all') {
        displayedAccounts.value = sourceAccounts;
    } else {
        displayedAccounts.value = sourceAccounts.filter(
            account => account.status === status
        );
    }
}
```

函数参数声明为：

```typescript
status: string
```

这是 TypeScript 的类型标注，要求调用时传入字符串。

函数最后的 `: void` 表示该函数不返回有用的结果。

当点击“查询正常账户”时：

```typescript
handleQuery('normal');
```

因此，在本次函数执行过程中：

```typescript
status === 'normal'
```

函数内部依次保存条件并生成展示结果。

**第一行：**

```typescript
currentStatus.value = status;
```

将当前查询条件更新为 `'normal'`。

**第二部分：**

```typescript
if (status === 'all') {
    displayedAccounts.value = sourceAccounts;
} else {
    displayedAccounts.value = sourceAccounts.filter(
        account => account.status === status
    );
}
```

因为 `'normal' !== 'all'`，所以进入 `else` 分支。

`filter()` 遍历原始账户数组，只保留状态为 `'normal'` 的记录。

最终将结果赋值给 `displayedAccounts.value`。

#### 查询过程中的状态变化

查询过程中，三个变量的职责与变化如下：

| 变量 | 作用 | 查询后变化 |
|---|---|---|
| `sourceAccounts` | 保存模拟原始账户数据 | 不变 |
| `currentStatus` | 保存当前查询条件 | 改为 `'normal'` |
| `displayedAccounts` | 保存当前展示的账户数据 | 变为两条正常账户记录 |

这里的 `sourceAccounts` 是普通数组，本例不会修改它。

`currentStatus` 和 `displayedAccounts` 使用 `ref()` 定义，因此是响应式状态。

#### 状态与模板的对应关系

首先：

```vue
<p>当前查询条件：{{ currentStatus }}</p>
```

显示当前条件。

其次：

```vue
<p>查询结果：{{ displayedAccounts.length }} 条</p>
```

显示当前结果数量。

最后：

```vue
<div
    v-for="account in displayedAccounts"
    :key="account.id"
>
    ...
</div>
```

根据最新的 `displayedAccounts` 生成账户列表。

整个执行流程就是：

**点击查询 → 调用函数 → 筛选原始数据 → 修改响应式结果 → Vue 更新查询条件、数量和账户列表。**

本例中的 `sourceAccounts` 是本地模拟数据源。真实项目也可能通过接口取得数据，再将结果写入响应式状态；接口调用不在本日示例中实现。

### 业务代码的阅读顺序

以后拿到类似页面，建议按下面的顺序分析，而不是一开始就深入每个细节。

1. **先看 `<template>`，找到业务入口**：确认页面上有哪些查询按钮、列表、输入框和操作按钮，重点观察 `@click`、`v-for`、`v-if` 等指令。
2. **通过事件名称寻找处理函数**：例如根据 `@click="handleQuery"` 找到 `handleQuery()`，确认传入什么参数、执行哪些条件判断。
3. **追踪函数读取和修改的数据**：区分原始数据、查询条件和结果数据，重点关注 `.value` 的赋值、`filter()` 以及数组修改操作。
4. **返回模板，寻找数据的使用位置**：例如使用搜索功能查找 `displayedAccounts`，了解它控制哪些展示内容。
5. **最后确认特殊情况**：例如查询结果为空、查询条件重置、按钮禁用等分支是否正确处理。

在 VS Code 或 IntelliJ IDEA 等开发工具中，可以使用查找引用、跳转定义等功能快速追踪变量和函数，而不需要反复手动翻阅整个文件。

### 练习：追踪查询流程并修改需求

> [!EXERCISE] 查询冻结账户
>
> 使用本节完整示例。点击“查询冻结账户”后，`currentStatus.value` 是什么？`displayedAccounts.value` 包含哪些数据？`sourceAccounts` 是否变化？
>
> 【答案】
>
> `currentStatus.value` 变为 `frozen`；展示结果仍是数组，即使只有一条：
>
> ```typescript
> [
>     { id: 102, name: '工资账户', status: 'frozen', balance: 8000 }
> ]
> ```
>
> `sourceAccounts` 不发生变化。`filter` 创建新数组，查询函数把新数组保存到 `displayedAccounts.value`，没有删除或覆盖原始数组。

> [!EXERCISE] 追踪空结果的来源
>
> 点击“查询已销户账户”后，为什么页面显示“没有符合条件的账户”？结合 `filter`、展示状态与 `v-if` 说明。
>
> 【答案】
>
> 1. 点击按钮调用 `handleQuery`('`closed`')。
> 2. 函数把 `currentStatus.value` 更新为 `closed`，进入状态筛选分支。
> 3. `filter` 遍历原始数组，查找 status === '`closed`' 的记录。
> 4. 原始数据没有已销户账户，返回空数组 []。
> 5. 空数组写入 `displayedAccounts.value`，其长度为 0。
> 6. `v-if` 条件成立，渲染 el-empty；`v-else` 的账户列表不渲染。
>
> 解释空状态时，应追踪“哪段代码产生了空数组”，而不止指出最终判断为真。

> [!EXERCISE] 增加高余额查询
>
> 增加 `handleHighBalanceQuery()` 和按钮，筛选余额大于等于 6000 元的账户，并将条件状态更新为 `highBalance`。
>
> 【答案】
>
> ```typescript
> function handleHighBalanceQuery(): void {
>     currentStatus.value = 'highBalance';
>     displayedAccounts.value = sourceAccounts.filter(
>         account => account.balance >= 6000
>     );
> }
> ```
>
> ```vue
> <el-button @click="handleHighBalanceQuery">查询高余额账户</el-button>
> ```
>
> 最终显示工资账户（8000 元）和理财账户（12000 元）。回调表达式返回布尔值，决定当前记录是否保留。本例是无参数函数，也可写 `@click`="`handleHighBalanceQuery()`"，同样在点击时调用。

### 页面逻辑错误的排查

页面结果与预期不一致时，可以沿同一条数据流逐段检查，判断问题发生在事件触发、数据处理、响应式赋值还是模板展示。

常见异常包括：按钮事件未触发、筛选条件不生效、结果未保存，以及模板显示的数据与预期不一致。这些现象可能来自不同位置，需要结合实际数据确认原因。

排查时应依据实际的参数、数据与模板绑定判断原因，而不只是观察按钮是否被点击。

#### 数据流的检查顺序

检查过程可以分为事件入口、函数逻辑、状态赋值和模板使用四个阶段。

**第一步：确认入口是否真的触发了**

先看模板里的事件绑定，例如：

```vue
<el-button @click="handleQuery">查询</el-button>
```

首先确认：

- 点击按钮时，是否真的调用了这个函数？
- 函数名称有没有写错？
- 有没有传错参数？

**第二步：确认函数内部逻辑是否正确**

例如：

- `if` 条件是否写反了？
- `filter()` 条件是否正确？
- 重置逻辑是否覆盖了前面的结果？

**第三步：确认响应式数据是否真的被修改了**

例如：

```typescript
displayedAccounts.value = ...
```

要重点看：

- 有没有忘写 `.value`
- 有没有只调用 `filter()` 却没有接收返回值
- 有没有把结果赋值给错误的变量

**第四步：确认模板是否真的使用了正确的数据**

例如页面列表到底是：

```vue
v-for="account in displayedAccounts"
```

还是错误地写成：

```vue
v-for="account in sourceAccounts"
```

如果模板绑定错了，就算函数把 `displayedAccounts` 改对了，页面也不会按预期变化。

#### 使用日志检查参数与结果

`console.log()` 可以输出函数参数和状态值，辅助检查执行过程。

在 Vue 项目中，日志同样可以用于检查函数接收到的参数，以及赋值后的展示数据。

例如：

```typescript
function handleQuery(status: string): void {
    // 检查函数是否执行，以及接收到的参数
    console.log('查询函数执行，status =', status);

    currentStatus.value = status;

    if (status === 'all') {
        displayedAccounts.value = sourceAccounts;
    } else {
        displayedAccounts.value = sourceAccounts.filter(
            account => account.status === status
        );
    }

    // 检查实际保存的查询结果
    console.log('查询结果：', displayedAccounts.value);
}
```

当用户点击“查询冻结账户”时，预期控制台输出：

```text
查询函数执行，status = frozen

查询结果：
[
    { id: 102, name: '工资账户', status: 'frozen', balance: 8000 }
]
```

如果第一个日志正确，说明事件已经触发、参数也已传入。

如果第二个日志中的数据不正确，那么就应该重点检查函数内部的数据处理和赋值逻辑。

当然，也可以通过浏览器开发者工具或 IDE 的断点功能，逐行观察函数执行过程。它们与后端 Java 代码调试的基本思路是相通的。

需要注意的是，`console.log()` 输出响应式对象本身时，开发者工具对对象的展开显示可能反映之后的状态。检查 `ref` 中的基本类型值，可以直接记录 `.value`；检查数组内容时，也可以在需要时记录数据快照。对象日志的展开方式应与实际记录时刻区分。

### 常见错误：丢弃筛选结果

以下示例修改了当前条件，但没有保存筛选得到的新数组。

```vue
<script setup lang="ts">
import { ref } from 'vue';

const sourceAccounts = [
    { id: 101, name: '储蓄账户', status: 'normal', balance: 5000 },
    { id: 102, name: '工资账户', status: 'frozen', balance: 8000 },
    { id: 103, name: '理财账户', status: 'normal', balance: 12000 }
];

const currentStatus = ref<string>('all');
const displayedAccounts = ref(sourceAccounts);

function handleQuery(status: string): void {
    currentStatus.value = status;

    sourceAccounts.filter(
        account => account.status === status
    );
}
</script>

<template>
    <div>
        <el-button @click="handleQuery('normal')">
            查询正常账户
        </el-button>

        <p>当前条件：{{ currentStatus }}</p>

        <div
            v-for="account in displayedAccounts"
            :key="account.id"
        >
            {{ account.name }} - {{ account.balance }}
        </div>
    </div>
</template>
```

单击“查询正常账户”按钮后，条件文本与列表会出现不同的变化。

对应函数如下：

```typescript
function handleQuery(status: string): void {
    currentStatus.value = status;

    sourceAccounts.filter(
        account => account.status === status
    );
}
```

可以发现：

- `currentStatus.value` 确实被改了
- 但 `filter()` 的结果并没有赋值给 `displayedAccounts.value`

因此页面上会出现一个很典型的现象：

- “当前条件”会变成 `normal`
- 但是下面的账户列表**不会变化**
- 页面仍然显示全部账户

**原因：** 因为模板里列表渲染使用的是：

```vue
v-for="account in displayedAccounts"
```

而 `displayedAccounts` 并没有被修改。

`filter()` 虽然执行了，但只是返回了一个新数组，没有被保存下来，所以它对页面展示没有产生实际影响。

这类错误本质上是：**做了数据处理，但没有把处理结果写回响应式状态。**

也就是说，JavaScript 筛选逻辑执行了，但 Vue 没有拿到新的页面展示数据。

正确写法应该是：

```typescript
function handleQuery(status: string): void {
    currentStatus.value = status;

    displayedAccounts.value = sourceAccounts.filter(
        account => account.status === status
    );
}
```

### 常见错误：模板读取错误的数据

即使查询函数正确保存结果，模板读取错误的数据也会使页面展示不符合预期。

```vue
<script setup lang="ts">
import { ref } from 'vue';

const sourceAccounts = [
    { id: 101, name: '储蓄账户', status: 'normal', balance: 5000 },
    { id: 102, name: '工资账户', status: 'frozen', balance: 8000 },
    { id: 103, name: '理财账户', status: 'normal', balance: 12000 }
];

const displayedAccounts = ref(sourceAccounts);

function handleQuery(status: string): void {
    displayedAccounts.value = sourceAccounts.filter(
        account => account.status === status
    );
}
</script>

<template>
    <div>
        <el-button @click="handleQuery('normal')">
            查询正常账户
        </el-button>

        <!-- 这里故意写错了 -->
        <div
            v-for="account in sourceAccounts"
            :key="account.id"
        >
            {{ account.name }}
        </div>
    </div>
</template>
```

这次函数逻辑是对的，`displayedAccounts.value` 也确实被正确修改了。

但是模板却写成了：

```vue
v-for="account in sourceAccounts"
```

所以页面展示的始终是原始数据，而不是筛选结果。

- 点击按钮后，数据处理逻辑正确执行。
- 但页面列表仍然不变化。

**原因：** 页面没有使用响应式结果数据；模板绑定的是错误的变量。

### 事件、赋值与模板的交叉检查

如果以后在项目里遇到“点了按钮但列表不变化”，可以按下面思路定位：

1. 先看按钮的事件绑定：`@click="handleQuery('normal')"`，确认实际调用的函数和传入的参数。
2. 再看函数里是否真的改了响应式数据：`displayedAccounts.value = ...`。如果没有，很可能就是问题点。
3. 最后看模板到底渲染的是谁：`v-for="account in ???"`，确认到底渲染的是 `sourceAccounts` 还是 `displayedAccounts`。

### 练习：定位查询逻辑错误

```vue
<script setup lang="ts">
import { ref } from 'vue';

const sourceAccounts = [
    { id: 1, name: '账户A', status: 'normal', balance: 1000 },
    { id: 2, name: '账户B', status: 'frozen', balance: 2000 },
    { id: 3, name: '账户C', status: 'normal', balance: 3000 }
];

const displayedAccounts = ref(sourceAccounts);
const currentStatus = ref<string>('all');

function handleQueryNormal(): void {
    currentStatus.value = 'normal';

    sourceAccounts.filter(
        account => account.status === 'normal'
    );
}
</script>

<template>
    <div>
        <p>当前条件：{{ currentStatus }}</p>

        <el-button @click="handleQueryNormal">
            查询正常账户
        </el-button>

        <div
            v-for="account in displayedAccounts"
            :key="account.id"
        >
            {{ account.name }} - {{ account.balance }}
        </div>
    </div>
</template>
```

> [!EXERCISE] 区分变化与不变的数据
>
> 点击查询正常账户后，页面中哪一部分会变化，哪一部分不会变化？
>
> 【答案】
>
> `currentStatus.value` 从 `all` 变为 `normal`，因此条件文本更新。`displayedAccounts.value` 没有被修改，仍保存原来的三条账户，列表继续显示 A、B、C。

> [!EXERCISE] 定位缺失的赋值
>
> 指出函数中的错误，并说明为什么 `filter` 已经执行，页面仍不按结果更新。
>
> 【答案】
>
> 函数只调用了 `sourceAccounts.filter(...)`，没有保存其返回值。`filter()` 不修改 `sourceAccounts`，也不会自动写入 `displayedAccounts`。模板绑定的展示数组未变化，因此列表不会显示筛选结果。

> [!EXERCISE] 修复查询函数
>
> 给出修正后的 `handleQueryNormal()`。
>
> 【答案】
>
> ```typescript
> function handleQueryNormal(): void {
>     currentStatus.value = 'normal';
>     displayedAccounts.value = sourceAccounts.filter(
>         account => account.status === 'normal'
>     );
> }
> ```
>
> 函数同时更新条件状态与展示状态。修复后，条件显示 `normal`，列表显示账户 A（1000 元）和账户 C（3000 元）。

> [!SUPPLEMENT] 数据源与展示数组的初始化关系
>
> `ref`(`sourceAccounts`) 不会为原始数组创建深复制备份。数组作为 `ref` 的值时，会经过 Vue 的响应式处理，不能把它理解为一份完全独立的数据。
>
> 示例通过 `filter` 创建新数组，再替换 `displayedAccounts.value`，因此没有修改 `sourceAccounts`。示例也不修改账户对象字段；生成新数组不等于对其中对象进行深复制。

## 综合案例：账户名称与状态查询

### 页面功能与数据结构

账户查询页面需要支持以下功能：

- 支持输入账户名称进行查询。
- 使用列表展示账户名称、余额和状态。
- 查询结果为空时显示空状态。
- 支持重置查询条件。

组件代码如下：

```vue
<script setup lang="ts">
import { ref } from 'vue';

// 模拟后端返回的原始账户数据
const sourceAccounts = [
    { id: 1, name: '储蓄账户', balance: 5000, status: 'normal' },
    { id: 2, name: '工资账户', balance: 8000, status: 'frozen' },
    { id: 3, name: '理财账户', balance: 12000, status: 'normal' }
];

// 查询条件
const queryName = ref<string>('');

// 页面展示结果
const displayedAccounts = ref(sourceAccounts);

// 根据账户名称查询
function handleQuery(): void {
    const keyword = queryName.value.trim();

    displayedAccounts.value = sourceAccounts.filter(
        account => account.name.includes(keyword)
    );
}

// 重置查询
function handleReset(): void {
    queryName.value = '';
    displayedAccounts.value = sourceAccounts;
}
</script>

<template>
    <div>
        <h2>账户查询</h2>

        <!-- 查询区域 -->
        <el-input
            v-model="queryName"
            placeholder="请输入账户名称"
        />

        <el-button type="primary" @click="handleQuery">
            查询
        </el-button>

        <el-button @click="handleReset">
            重置
        </el-button>

        <!-- 查询结果 -->
        <p>共查询到 {{ displayedAccounts.length }} 条账户</p>

        <el-empty
            v-if="displayedAccounts.length === 0"
            description="暂无账户数据"
        />

        <div v-else>
            <div
                v-for="account in displayedAccounts"
                :key="account.id"
            >
                <span>{{ account.name }}</span>
                <span>{{ account.balance }} 元</span>

                <el-tag
                    :type="account.status === 'normal'
                        ? 'success'
                        : 'danger'"
                >
                    {{ account.status === 'normal' ? '正常' : '冻结' }}
                </el-tag>
            </div>
        </div>
    </div>
</template>
```

### 扩展需求：只查询正常账户

需求是在现有页面增加“只查询正常账户”按钮，点击后只展示 `normal` 状态的账户，同时保留用户已经输入的名称。新按钮只按状态筛选，不将名称作为附加条件。

> [!EXERCISE] 预测正常账户查询结果
>
> 输入框已输入工资，但尚未点击名称查询。点击新增的“只查询正常账户”按钮后，页面应显示哪些账户？输入框是否变化？
>
> 【答案】
>
> 显示两条正常账户：
>
> ```typescript
> [
>     { id: 1, name: '储蓄账户', balance: 5000, status: 'normal' },
>     { id: 3, name: '理财账户', balance: 12000, status: 'normal' }
> ]
> ```
>
> 输入框仍为工资。该功能只按状态生成展示数组，没有修改 `queryName.value`，也不需要读取名称条件。

> [!EXERCISE] 实现正常账户查询
>
> 编写 `handleQueryNormal()` 及对应按钮。
>
> 【答案】
>
> ```typescript
> function handleQueryNormal(): void {
>     displayedAccounts.value = sourceAccounts.filter(
>         account => account.status === 'normal'
>     );
> }
> ```
>
> ```vue
> <el-button @click="handleQueryNormal">只查询正常账户</el-button>
> ```
>
> 把函数放入本页 `script setup`，将按钮放入查询操作区。函数从完整数据源筛选 `normal` 状态，只更新展示结果，满足保留输入条件的要求。

> [!EXERCISE] 再次执行原名称查询
>
> 接上一步，输入框仍为工资。点击原来的查询按钮，最终显示哪些账户？为什么冻结账户还能重新出现？
>
> 【答案】
>
> 最终结果为：
>
> ```typescript
> [
>     { id: 2, name: '工资账户', balance: 8000, status: 'frozen' }
> ]
> ```
>
> 1. 正常账户查询只替换 `displayedAccounts`，没有删除原始数据。
> 2. 输入条件仍为工资。
> 3. 再次点击名称查询，执行 `handleQuery()`，读取并清理名称条件。
> 4. 函数重新对 `sourceAccounts` 筛选名称包含工资的账户。
> 5. 工资账户虽然是 `frozen`，仍符合名称条件，因此进入新结果。
>
> 两次查询都从原始数组开始，不是在上一次结果上继续筛选。

> [!NOTE] 不同课次的数据与空条件处理
>
> 前面的名称查询示例使用账户 ID 101～103，本节综合案例使用 1～3。每段代码中的记录以当前示例为准。
>
> 前面的名称查询函数显式判断空关键词并恢复全部数据；本节通过 `includes(keyword)` 筛选。对于示例中的字符串名称，`includes('')` 为 `true`，所以空关键词也会得到全部账户。

## 查询与重置的综合排错练习

以下账户查询组件中，查询函数和重置函数各有一处状态更新遗漏。可以结合事件绑定、数组返回值和展示状态检查问题。

```vue
<script setup lang="ts">
import { ref } from 'vue';

// 原始账户数据
const sourceAccounts = [
    { id: 101, name: '储蓄账户', status: 'normal' },
    { id: 102, name: '工资账户', status: 'frozen' },
    { id: 103, name: '理财账户', status: 'normal' }
];

// 查询条件
const currentStatus = ref<string>('all');

// 页面展示数据
const displayedAccounts = ref(sourceAccounts);

// 查询函数
function handleQuery(status: string): void {
    currentStatus.value = status;

    if (status === 'all') {
        displayedAccounts.value = sourceAccounts;
    } else {
        sourceAccounts.filter(
            account => account.status === status
        );
    }
}

// 重置函数
function handleReset(): void {
    currentStatus.value = 'all';
}
</script>

<template>
    <div>
        <h2>账户查询</h2>

        <el-button @click="handleQuery('frozen')">
            查询冻结账户
        </el-button>

        <el-button @click="handleReset">
            重置
        </el-button>

        <p>查询条件：{{ currentStatus }}</p>

        <p>查询结果：{{ displayedAccounts.length }} 条</p>

        <div
            v-for="account in displayedAccounts"
            :key="account.id"
        >
            {{ account.name }}
        </div>
    </div>
</template>
```

> [!EXERCISE] 查询遗漏了哪一步
>
> 点击“查询冻结账户”后，条件已是 `frozen`，但仍显示全部账户。指出错误及原因。
>
> 【答案】
>
> else 分支调用 `filter` 却未接收返回值。`currentStatus` 已改变，但 `displayedAccounts` 仍是原数组，所以列表保持三条。需要把筛选结果赋给 `displayedAccounts.value`。

> [!EXERCISE] 为什么重置后列表不恢复
>
> 假设查询函数已修复，已显示冻结账户。点击重置后，条件变为 `all`，列表为什么仍未恢复？
>
> 【答案】
>
> 重置函数只修改 `currentStatus.value`，没有恢复展示结果。条件和结果是独立状态，将条件设置为 `all` 不会自动再次调用查询，也不会自动恢复 `displayedAccounts`。

> [!EXERCISE] 完整修复查询与重置函数
>
> 给出修正后的完整 `handleQuery()` 和 `handleReset()`。
>
> 【答案】
>
> ```typescript
> function handleQuery(status: string): void {
>     currentStatus.value = status;
>     if (status === 'all') {
>         displayedAccounts.value = sourceAccounts;
>     } else {
>         displayedAccounts.value = sourceAccounts.filter(
>             account => account.status === status
>         );
>     }
> }
>
> function handleReset(): void {
>     currentStatus.value = 'all';
>     displayedAccounts.value = sourceAccounts;
> }
> ```
>
> 查询要保存结果，重置要同时恢复条件与结果。

## 核心内容小结

### 数据、组件与类型

Vue 的核心是声明式渲染和响应式数据驱动视图。开发者定义数据与模板的关系，Vue 根据状态安排页面更新。

单文件组件用 `script`、`template`、`style` 分别组织逻辑、结构与样式。`script setup` 中的顶层变量、函数和导入内容可以直接供同一组件模板使用。`lang="ts"` 指定 TypeScript；类型标注用于开发阶段检查，不会自动执行运行时数据验证。

`ref()` 返回带 `.value` 的响应式对象。脚本读写使用 `.value`，模板读取本笔记示例中的顶层 `ref` 时自动解包。`const` 不禁止修改对象属性。响应式数据同步修改，DOM 更新由 Vue 异步调度和批处理。

### 模板语法与列表更新

| 写法 | 核心作用 | 常见误区 |
| --- | --- | --- |
| 文本插值 | 显示表达式结果 | 忽略方法或表达式返回的值 |
| `v-bind` / 冒号 | 动态设置属性 | 把静态 `disabled` 当成表达式 |
| `v-on` / `@click` | 事件触发时执行处理器 | 认为带参数调用在初始化时立即执行 |
| `v-if` / `v-else-if` / `v-else` | 条件决定内容是否渲染 | 认为 `v-if` 必须搭配 `v-else` |
| `v-show` | 切换 CSS `display` | 认为隐藏就等于移除 DOM |
| `v-for` | 按数组生成列表 | 混淆整个数组与当前元素 |
| `key` | 标识节点身份 | 用变化的下标标识动态业务记录 |
| `v-model` | 同步输入与状态 | 认为它会创建响应式数据或自动执行查询 |
| `:value` | 数据单向传到输入框 | 认为单向等于只读或只初始化一次 |

`push()`、`splice()` 直接修改原数组；`filter()` 返回新数组。要让页面展示筛选结果，必须接收结果并更新模板实际读取的状态。`filter()` 即使只有一条结果也仍返回数组。

Element Plus 提供现成的按钮、输入框、标签和空状态等组件，其使用仍遵循 Vue 的属性与事件绑定方式。注意 `disabled` 的拼写，以及 `account.status` 与 `accounts` 的对象、数组区别。

### 业务流程与排错

阅读业务功能时，沿“用户操作 → 事件函数 → 条件与数据处理 → 响应式赋值 → 模板展示”追踪。页面不变化时，依次确认事件触发、逻辑条件、结果赋值和模板数据源，不应只检查筛选条件。

原始数据、查询条件和展示结果职责不同。用户输入只修改条件；查询函数决定如何生成结果；清空输入只处理条件；重置同时恢复条件和结果。多种查询是否叠加，取决于它们从哪个数组开始筛选。

> [!CONCLUSION] 业务代码阅读要点
>
> 先找到用户触发功能的位置，再找函数和参数；确认函数实际修改哪些状态，最后回到模板核对这些状态的用途。
>
> 把数据变化、页面更新、DOM 是否存在和输入框临时显示区分开；把原始数组、筛选后的新数组、数组中的单个对象区分开。这些区别共同构成第一天阅读与修改 Vue 业务页面的基础。
## 进入第二天前，把阅读方法固定下来

面对一个按钮，先找到事件绑定，再找到函数，确认参数和修改目标，最后回模板看哪些区域读取该状态。不要只用“应该更新”作判断，应说出更新的是哪个 ref 或哪一个对象属性。

面对查询，分别指出源数组、输入条件和展示结果。面对列表，分清整个数组和当前元素。面对表单，分清输入同步与查询执行。第二天会在这套方法上增加类型、派生数据和业务控件，基本数据流不会另换一套规则。

## 官方资料

- [Vue 响应式基础](https://vuejs.org/guide/essentials/reactivity-fundamentals.html)
- [Vue 模板语法](https://vuejs.org/guide/essentials/template-syntax.html)
- [Vite 起步](https://vite.dev/guide/)
