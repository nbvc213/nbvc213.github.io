---
id: vue-course-day-3
order: 1103
date: 2026-11-01
updated: 2026-11-02
tags: [Vue, 组件化, 组件通信, 生命周期]
description: "掌握组件创建、Props、Emit、组件双向绑定、插槽和生命周期，并了解组合式函数与路由。"
draft: false
---

## 学习目标与运行方式

第一天学习了 Vue 页面中的响应式数据、模板绑定、事件处理和列表渲染；第二天学习了 TypeScript 类型、计算属性、侦听器，以及 Element Plus 表单、表格和分页。

第三天开始进入 Vue 项目中非常重要的一部分：**组件化开发（Component-based Development）**。

真实业务页面不会把所有代码都写在一个 `App.vue` 中。一个账户管理页面可能包含账户列表、账户信息卡片、查询表单、操作按钮和详情区域。开发者会把这些相对独立的界面拆分成多个组件，再通过明确的通信方式让它们协作。

本日学习结束后，应当能够：

- 创建一个 `.vue` 子组件，并在父组件中导入和使用。
- 理解组件定义与组件实例的区别，知道为什么同一个组件可以创建多个独立实例。
- 使用 Props 将父组件的数据传给子组件。
- 使用 Emit 将子组件中的用户操作通知给父组件。
- 理解组件 `v-model` 的实现原理，能够看懂 `modelValue` 和 `update:modelValue`。
- 使用默认插槽、具名插槽和作用域插槽组织可复用界面。
- 理解组件挂载、更新和卸载的时机，并在组件销毁时清理定时器、事件监听等外部资源。

当天主线是前六项。组合式函数（Composable）和 Vue Router 放在最后作为拓展内容，不要求在两小时主线学习中全部掌握。

### 学习时间安排

| 学习内容 | 建议时间 | 学习重点 |
|---|---:|---|
| 创建、导入与使用组件 | 15 分钟 | 组件文件、父子关系、组件实例 |
| Props | 20 分钟 | 父传子、必填与可选属性、单向数据流 |
| Emit | 20 分钟 | 子传父、事件名称、事件参数 |
| 组件 `v-model` | 20 分钟 | `modelValue`、更新事件、`defineModel` |
| 插槽 | 15 分钟 | 默认插槽、具名插槽、作用域插槽 |
| 生命周期 | 30 分钟 | 挂载、更新、卸载与资源清理 |
| **主线合计** | **120 分钟** | |
| Composable 与 Router | 拓展 | 按需阅读，不计入主线时间 |

### 运行前提

继续使用第一天创建的 Vue 3 + TypeScript + Vite + Element Plus 工程，不需要新建项目。

- 默认项目入口仍然是 `src/main.ts`。
- 主线示例继续使用 `src/App.vue` 作为页面入口。
- 子组件统一放在 `src/components/` 目录。
- 组合式函数示例放在 `src/composables/` 目录。
- 路由示例放在 `src/router/` 和 `src/views/` 目录。

每个完整程序都标明了需要创建或替换的文件。**同一单元中的多个文件需要一起使用；切换到下一个单元时，再按照新示例替换对应文件。** 不要把不同单元中多个 `App.vue` 的 `<script setup>` 合并到一个文件里。

主线示例默认沿用第一天已经配置好的 Element Plus。如果页面中的 `el-button`、`el-input` 等组件无法识别，先检查 `src/main.ts` 是否已经注册 Element Plus，而不是重复安装依赖。

拓展部分的 Vue Router 需要额外安装 `vue-router`。如果项目已经安装，就不必重复执行安装命令。

## 组件化开发：创建、导入与使用组件

### 为什么要把页面拆成组件

假设一个账户管理页面需要展示 20 个账户，每个账户都要显示账户名称、余额和状态。如果把每个账户的展示代码都写在页面中，就会出现大量重复结构。

组件可以把一块具有相对独立职责的界面封装起来。页面只需要使用组件，不必重复编写内部结构。

例如，可以把账户信息封装成 `AccountCard.vue`，然后在账户列表中多次使用：

```vue
<AccountCard />
<AccountCard />
<AccountCard />
```

这里的三个标签并不是三个文件，而是基于同一份组件定义创建的三个组件实例。

组件化的主要价值包括：

- **复用：** 相同的界面结构可以在多个位置使用。
- **拆分职责：** 页面负责组织整体结构，子组件负责自己的局部界面和行为。
- **降低维护成本：** 修改某个组件内部的实现，不必在多个页面中重复修改相同代码。
- **明确边界：** 组件通过 Props、Emit 和插槽等方式协作，而不是随意访问其他组件内部的数据。

组件并不是越小越好。拆分的目的在于让职责清楚、复用合理，而不是把每一行模板都拆成一个组件。

### 组件定义与组件实例

首先区分两个概念：

- **组件定义：** `.vue` 文件中描述的一种界面结构和行为，例如 `AccountCounter.vue`。
- **组件实例：** 页面实际使用组件时创建出来的某一个具体对象。

可以把组件定义理解为一份模板或设计图，把组件实例理解为根据这份定义创建出来的实际界面。

同一个组件可以创建多个实例：

```vue
<AccountCounter />
<AccountCounter />
```

如果 `count` 定义在 `AccountCounter.vue` 的 `<script setup>` 中，那么每创建一个实例，组件的初始化逻辑都会分别执行一次。两个实例会得到各自的 `count`，不会自动共享计数。

这与第二天学习的响应式数据一致：`ref()` 创建的是一份响应式状态。**状态写在组件实例内部，就属于该实例；状态放在模块级变量或 Pinia Store 中，才可能被多个实例共享。**

### 创建和使用子组件的三个步骤

假设当前页面需要使用一个账户计数器，创建子组件需要完成三个动作：

1. 在 `src/components/` 下创建组件文件。
2. 在父组件中导入这个文件。
3. 在父组件模板中使用导入的组件。

例如，父组件 `App.vue` 中：

```ts
import AccountCounter from './components/AccountCounter.vue';
```

这里的 `./` 表示从当前文件所在目录出发。由于 `App.vue` 位于 `src/`，所以 `./components/AccountCounter.vue` 对应 `src/components/AccountCounter.vue`。

路径大小写也需要保持一致。开发环境或部署环境对文件名大小写的处理可能不同，不要依赖本地环境中偶然可用的大小写写法。

在 `<script setup>` 中导入组件后，可以直接在当前组件模板中使用对应的组件标签，不需要再单独编写 `components` 注册对象：

```vue
<template>
    <AccountCounter />
</template>
```

这里的自动使用范围是**当前这个 `<script setup>` 组件**，不是说导入一次后，整个项目的所有页面都能直接使用它。

### 完整程序：创建两个独立的计数器实例

文件一：`src/components/AccountCounter.vue`

```vue
<script setup lang="ts">
import { ref } from 'vue';

// 每个 AccountCounter 实例都会创建自己的 count。
const count = ref(0);

function increase(): void {
    count.value += 1;
}
</script>

<template>
    <button @click="increase">
        已查看 {{ count }} 次
    </button>
</template>
```

文件二：`src/App.vue`

```vue
<script setup lang="ts">
import AccountCounter from './components/AccountCounter.vue';
</script>

<template>
    <h2>组件实例演示</h2>

    <!-- 两个标签创建两个独立的组件实例。 -->
    <AccountCounter />
    <AccountCounter />
</template>
```

运行后会看到两个按钮，初始都显示 0。

- 连续点击第一个按钮两次，第一个显示 2。
- 再点击第二个按钮一次，第二个显示 1。

两个实例使用的是同一个组件定义，但每个实例都有自己的局部状态。这是组件化开发中非常重要的基础。

如果以后使用 `v-for` 循环渲染多个子组件，还需要为每个实例提供稳定的 `key`：

```vue
<AccountCounter
    v-for="account in accounts"
    :key="account.id"
/>
```

`key` 用于帮助 Vue 识别列表中每一项对应的组件实例。它不是组件通信参数，也不会自动传入子组件。

> [!EXERCISE] 预测两个组件实例的状态
>
> 页面中使用了两次 `<AccountCounter />`。先点击第一个按钮两次，再点击第二个按钮一次，两个按钮分别显示多少？
>
> 【答案】
>
> 第一个显示 2，第二个显示 1。它们来自同一个组件定义，但创建的是两个独立实例。组件内部的 `count` 在每个实例初始化时分别创建，不会自动共享。

## Props：父组件向子组件传递数据

### 为什么需要 Props

刚才的 `AccountCounter` 不需要父组件传入数据，所以两个实例显示的结构和初始状态完全相同。

但实际业务中，同一种组件经常需要显示不同的数据。例如，账户信息卡片都采用相同的布局，但有的显示储蓄账户，有的显示工资账户，有的显示理财账户。

如果把账户名称写死在子组件中，就无法通过同一个组件显示不同账户。

**Props 是父组件传递给子组件的数据。** 子组件声明自己需要接收哪些属性，父组件在使用子组件时提供对应的值。

可以将 Props 与普通函数参数进行对照：

```ts
function showAccount(name: string): void {
    console.log(name);
}

showAccount('储蓄账户');
```

函数先声明参数 `name`，调用者再传入具体值。

组件也类似：子组件先声明自己接收 `name`，父组件再通过组件标签传入具体值。

### defineProps：声明子组件接收的数据

在 `<script setup>` 中，可以使用 `defineProps()` 声明 Props：

```ts
const props = defineProps<{
    name: string;
}>();
```

从内向外理解：

- `{ name: string }` 是 TypeScript 类型，表示组件接收一个名为 `name` 的字符串属性。
- `<...>` 将这份类型信息传给 `defineProps()`，用于类型检查。
- `defineProps()` 声明当前组件接收哪些 Props。
- 返回值赋给 `props`，脚本中通过 `props.name` 读取父组件传来的姓名。

这里的 `props` 是当前文件中的变量名，可以自行命名；`name` 才是父子组件之间约定的属性名称。

`defineProps()` 是 Vue 的**编译宏（Compiler Macro）**。它会被 Vue 的编译器识别和处理，在 `<script setup>` 中直接使用，不需要从 `vue` 导入。

这里的 TypeScript 类型主要用于开发阶段的静态类型检查。Vue 编译器会根据类型声明生成相应的运行时 Props 选项，但这不等于对服务器返回的业务数据进行完整校验；外部接口数据仍应根据业务要求验证。

一个组件只需要声明一次 Props。若要增加属性，应把新属性加入同一份类型声明，而不是再次调用 `defineProps()`。

### 必填属性：父组件必须提供

```ts
interface Props {
    name: string;
}

const props = defineProps<Props>();
```

这里使用 `interface` 描述 Props 的结构。`Props` 只是一个 TypeScript 类型名称，并不是 Vue 规定的特殊变量名。

由于 `name` 没有写 `?`，所以它是必填属性。父组件使用该组件时必须传入：

```vue
<RequiredAccount name="储蓄账户" />
```

如果父组件写成 `<RequiredAccount />`，TypeScript 类型检查会提示缺少必填属性。开发模式下，Vue 也可能根据编译得到的运行时属性声明给出警告。

**必填属性是对组件使用者的约定，不是 Vue 自动帮父组件生成一个值。**

### 静态属性与动态属性

父组件传值时，需要区分普通属性和动态属性。

假设父组件中有：

```ts
const selectedName = ref('理财账户');
```

下面两种写法并不相同：

```vue
<RequiredAccount name="selectedName" />

<RequiredAccount :name="selectedName" />
```

第一种没有冒号，`selectedName` 会被当作普通字符串传给子组件。子组件收到的内容就是英文单词 `selectedName`。

第二种有冒号，表示右侧是父组件模板中的 JavaScript 表达式。Vue 会读取变量 `selectedName` 当前的值，把“理财账户”传给子组件。

这里要区分：

- 冒号左侧 `name`：子组件声明的 Prop 名称。
- 冒号右侧 `selectedName`：父组件中保存数据的变量名。

左右两侧不要求同名。父组件可以使用 `selectedAccountName`，子组件仍然通过 `props.name` 接收，只要模板绑定关系正确即可。

如果父组件传递的是变量、数字、布尔值、对象或数组，通常需要使用动态绑定：

```vue
<AccountCard
    :balance="3200"
    :active="true"
    :account="selectedAccount"
/>
```

不加冒号的 `balance="3200"` 是字符串；加冒号的 `:balance="3200"` 才是数字表达式。

### Prop 名称的大小写

在 `<script setup>` 中，TypeScript 属性名通常使用驼峰命名法：

```ts
const props = defineProps<{
    accountName: string;
}>();
```

在父组件模板中，推荐使用短横线命名法：

```vue
<AccountCard account-name="储蓄账户" />
```

Vue 会把模板中的 `account-name` 对应到子组件声明的 `accountName`。

这是一种模板属性名称的书写约定。阅读项目时，要把 `account-name` 和 `accountName` 视为同一个 Prop 在模板和脚本中的两种写法，而不是两个不同字段。

### 可选属性与默认值

并不是每个组件属性都必须由父组件提供。例如，账户卡片的说明文字可能有，也可能没有。

```ts
interface Props {
    name: string;
    description?: string;
}
```

属性名后的 `?` 表示可选。这里 `name` 是必填字符串，`description` 是可选字符串。父组件可以省略说明；省略且没有默认值时，子组件读取到的 `props.description` 是 `undefined`。

需要区分：

- `undefined`：没有提供这个值。
- `''`：提供了一个空字符串。
- `'暂无说明'`：提供了具体的字符串。

例如：

```vue
<p v-if="props.description !== undefined">
    说明：{{ props.description }}
</p>
<p v-else>未提供账户说明</p>
```

当 `description` 是空字符串时，第一行仍然成立，会显示“说明：”；只有值为 `undefined` 时才显示“未提供账户说明”。

如果业务规则把空字符串也视为没有填写，可以改成 `v-if="props.description"`。这是模板判断规则不同，不是可选属性的类型定义发生了变化。

如果不希望每个父组件都重复传入相同的默认说明，可以使用 `withDefaults()`：

```ts
interface Props {
    name: string;
    description?: string;
}

const props = withDefaults(defineProps<Props>(), {
    description: '暂无说明'
});
```

`withDefaults()` 接收两个参数：第一个参数是 Props 声明，第二个参数是默认值对象。默认值对象中的属性名必须与 Props 中的名称对应。

当父组件省略 `description` 时，子组件使用“暂无说明”；父组件传入具体字符串时，使用父组件提供的值；父组件明确传入空字符串时，仍然保留空字符串，不会被默认值覆盖。

对于数组或对象类型的默认值，需要使用工厂函数返回新对象，避免多个组件实例意外共用同一个默认对象。

### 布尔 Props：不要把字符串 false 当成布尔值

如果一个属性表示是否启用，可以使用布尔类型：

```ts
interface Props {
    name: string;
    active?: boolean;
}
```

父组件可以这样传：

```vue
<AccountCard name="储蓄账户" :active="true" />
<AccountCard name="工资账户" :active="false" />
```

这里冒号右侧是 JavaScript 布尔值。不要把 `active="false"` 当作布尔假值来使用；需要明确传入布尔值时，使用动态绑定。

Vue 对 Boolean 类型的 Props 有专门的属性转换规则。没有默认值时，省略 Boolean 属性通常按 `false` 处理；如果通过 `withDefaults()` 把默认值设为 `true`，省略属性时就使用 `true`。父组件明确传入 `:active="false"` 时，仍然是 `false`，不会被默认值覆盖。

### 完整程序：父组件传递不同的账户信息

文件一：`src/components/AccountCard.vue`

```vue
<script setup lang="ts">
interface Props {
    accountName: string;
    balance: number;
    description?: string;
    active?: boolean;
}

// 为可选属性设置默认值。
const props = withDefaults(defineProps<Props>(), {
    description: '暂无说明',
    active: true
});
</script>

<template>
    <article class="account-card">
        <h3>{{ props.accountName }}</h3>
        <p>账户余额：{{ props.balance }} 元</p>
        <p>账户说明：{{ props.description }}</p>
        <p>当前状态：{{ props.active ? '启用' : '停用' }}</p>
    </article>
</template>

<style scoped>
.account-card {
    border: 1px solid #bbb;
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 12px;
}
</style>
```

文件二：`src/App.vue`

```vue
<script setup lang="ts">
import { ref } from 'vue';
import AccountCard from './components/AccountCard.vue';

const selectedName = ref('储蓄账户');
const balance = ref(3200);

function changeAccount(): void {
    selectedName.value = '理财账户';
    balance.value = 12000;
}
</script>

<template>
    <h2>账户信息</h2>

    <AccountCard
        account-name="工资账户"
        :balance="8500"
        description="企业代发工资"
    />

    <AccountCard
        :account-name="selectedName"
        :balance="balance"
    />

    <AccountCard
        account-name="备用账户"
        :balance="1000"
        :active="false"
    />

    <el-button type="primary" @click="changeAccount">
        切换当前账户
    </el-button>
</template>
```

运行后会显示三张账户卡片：第一张显示父组件提供的说明；第二张使用默认说明；第三张的状态为停用。

点击“切换当前账户”后，第二张卡片会变成理财账户，余额也会更新为 12000。子组件没有重新创建，也没有主动请求父组件的数据；父组件状态发生变化后，绑定的 Prop 更新，子组件便显示新的值。

### 单向数据流：子组件不应该直接修改 Props

Props 的基本方向是：

**父组件状态 → 父组件绑定 → 子组件 Props → 子组件展示。**

子组件接收到 Props 后，应当把它们作为输入数据读取，而不是直接修改父组件传来的值。

例如，下面的写法不正确：

```ts
// 不要直接修改顶层 Prop。
props.accountName = '新的账户名称';
```

Vue 的 Props 是只读的，直接修改顶层 Prop 会产生警告，也破坏父子组件之间的数据归属关系。

如果传入的是对象或数组，情况需要更准确地理解：Props 的只读约束主要作用于属性本身，并不等于 Vue 自动把对象深拷贝成完全不可变的数据。子组件通过对象引用访问嵌套属性时，技术上可能修改到父组件持有的同一个对象，但不推荐这样设计。

更合理的做法是：**子组件只报告用户希望执行的操作，由真正拥有数据的父组件决定如何修改。** 下一节的 Emit 就是为这种通信方式准备的。

> [!EXERCISE] 判断 Props 的传值方式
>
> 已有父组件变量：
>
> ```ts
> const selectedName = ref('理财账户');
> ```
>
> 下面两种写法分别会让子组件收到什么？
>
> ```vue
> <AccountCard account-name="selectedName" :balance="3200" />
> <AccountCard :account-name="selectedName" :balance="3200" />
> ```
>
> 【答案】
>
> 第一种把 `selectedName` 当作普通字符串，子组件收到的名称就是英文单词 `selectedName`。第二种使用动态绑定，子组件收到的是变量当前的值“理财账户”。
>
> **解析：** 不带冒号的是静态属性，带冒号的是 JavaScript 表达式。传递变量、数字、布尔值、对象或数组时，要根据需要使用动态绑定。

> [!EXERCISE] 省略属性与空字符串
>
> `description` 定义为 `description?: string`，没有设置默认值。父组件分别省略该属性和传入 `description=""`，子组件读取到的值有什么区别？
>
> 【答案】
>
> 省略属性时，子组件读取到 `undefined`；传入空字符串时，子组件读取到 `''`。
>
> **解析：** 可选属性表示父组件可以不提供该字段，不表示空字符串与未提供是同一种值。是否把空字符串也视为未填写，应由具体的业务判断决定。

## Emit：子组件向父组件发送事件

### 为什么需要 Emit

Props 解决的是父组件向子组件传递数据。但用户通常是在子组件内部进行操作，例如点击账户卡片中的“选择”按钮、点击表格行中的“查看详情”，或者点击弹窗中的“确认”。

这些操作发生在子组件内部，但真正需要修改的数据往往属于父组件。例如，账户列表由父组件保存，用户点击某个子组件的“选择”按钮后，父组件需要知道用户选中了哪个账户。

如果子组件直接访问父组件内部变量，组件之间就会产生紧密依赖，复用性会下降。

**Emit 是子组件向外发出自定义事件的机制。** 子组件报告“发生了什么”，父组件监听事件并决定如何处理。

组件通信可以先记住两个方向：

- Props：父组件把数据传给子组件。
- Emit：子组件把事件和参数传给父组件。

### defineEmits：声明子组件允许发出的事件

在 `<script setup>` 中，可以使用 `defineEmits()` 声明事件：

```ts
const emit = defineEmits<{
    (event: 'refresh'): void;
}>();
```

这里使用 TypeScript 调用签名描述事件：

- `event` 表示事件名称参数。
- `'refresh'` 是字符串字面量类型，表示只允许发出名为 `refresh` 的事件。
- `void` 表示调用这个事件时不需要依赖返回值。

`defineEmits()` 会返回一个 `emit` 函数，子组件通过它发出事件：

```ts
emit('refresh');
```

和 `defineProps()` 一样，`defineEmits()` 也是 `<script setup>` 中的编译宏，不需要从 `vue` 导入。

如果事件需要携带参数，可以把参数写在事件声明中：

```ts
const emit = defineEmits<{
    (event: 'select', id: number): void;
}>();
```

这里表示事件名称必须是 `select`，并且事件需要携带一个数字参数 `id`。发出事件时应提供符合约定的参数：

```ts
emit('select', 101);
```

### 父组件如何监听子组件事件

父组件使用子组件时，可以通过 `@事件名` 监听自定义事件：

```vue
<AccountAction @refresh="handleRefresh" />
```

当子组件执行 `emit('refresh')` 时，父组件中绑定的 `handleRefresh()` 就会执行。

如果事件携带参数：

```vue
<AccountAction @select="handleSelect" />
```

父组件处理函数可以接收这个参数：

```ts
function handleSelect(id: number): void {
    console.log('选中的账户 ID：', id);
}
```

子组件执行 `emit('select', 101)` 后，父组件的 `handleSelect()` 会收到数字 `101`。

这里的 `id` 是事件载荷，不是子组件自动把所有内部状态暴露给父组件。**子组件发出什么参数，父组件就接收什么参数。**

### 完整执行过程：子组件通知父组件选择账户

假设子组件负责显示账户信息和选择按钮，父组件负责保存当前选中的账户 ID。

执行顺序如下：

1. 父组件创建 `AccountAction` 实例，并通过 Props 传入账户 ID。
2. 用户点击子组件中的按钮。
3. 子组件的点击处理函数执行。
4. 子组件调用 `emit('select', props.id)`，发出 `select` 事件并携带账户 ID。
5. 父组件监听到 `select` 事件，调用 `handleSelect(id)`。
6. 父组件修改自己的 `selectedId`。
7. 父组件模板根据新的状态更新。

子组件不需要知道父组件把选中 ID 保存在哪个变量中，也不需要知道父组件后续会执行什么业务逻辑。

### 完整程序：账户列表通过 Emit 传递选中 ID

文件一：`src/components/AccountAction.vue`

```vue
<script setup lang="ts">
const props = defineProps<{
    id: number;
    name: string;
}>();

const emit = defineEmits<{
    (event: 'select', id: number): void;
    (event: 'remove', id: number): void;
}>();

function selectAccount(): void {
    // 把当前子组件对应的账户 ID 通知父组件。
    emit('select', props.id);
}

function removeAccount(): void {
    // 子组件只报告删除意图，不直接修改父组件数组。
    emit('remove', props.id);
}
</script>

<template>
    <div class="account-action">
        <span>{{ props.name }}（{{ props.id }}）</span>

        <button @click="selectAccount">选择</button>
        <button @click="removeAccount">删除</button>
    </div>
</template>

<style scoped>
.account-action {
    display: flex;
    gap: 12px;
    align-items: center;
    margin-bottom: 10px;
}
</style>
```

文件二：`src/App.vue`

```vue
<script setup lang="ts">
import { ref } from 'vue';
import AccountAction from './components/AccountAction.vue';

interface Account {
    id: number;
    name: string;
}

const accounts = ref<Account[]>([
    { id: 101, name: '储蓄账户' },
    { id: 102, name: '工资账户' },
    { id: 103, name: '理财账户' }
]);

const selectedId = ref<number | null>(null);
const message = ref('尚未选择账户');

// 接收子组件传来的账户 ID。
function handleSelect(id: number): void {
    selectedId.value = id;
    message.value = `当前选择的账户 ID：${id}`;
}

// 根据子组件传来的 ID，在父组件中删除对应记录。
function handleRemove(id: number): void {
    accounts.value = accounts.value.filter(
        account => account.id !== id
    );

    // 如果删除的正是当前选中账户，就清除选中状态。
    if (selectedId.value === id) {
        selectedId.value = null;
    }
}
</script>

<template>
    <h2>账户列表</h2>

    <AccountAction
        v-for="account in accounts"
        :key="account.id"
        :id="account.id"
        :name="account.name"
        @select="handleSelect"
        @remove="handleRemove"
    />

    <p>{{ message }}</p>
    <p>当前选中 ID：{{ selectedId ?? '无' }}</p>
    <p>剩余账户数量：{{ accounts.length }}</p>
</template>
```

运行后，每条账户记录都有“选择”和“删除”两个按钮。

点击“选择”时，子组件发送 `select` 事件，父组件取得对应 ID 并修改 `selectedId`。

点击“删除”时，子组件发送 `remove` 事件，父组件通过 `filter()` 生成不包含该 ID 的新数组，再把新数组赋给 `accounts.value`。

这里最重要的不是按钮本身，而是数据归属：

- 子组件知道自己显示哪条账户记录，所以能发送对应 ID。
- 父组件拥有账户数组，所以由父组件真正删除记录。
- 父组件拥有选中状态，所以由父组件保存 `selectedId`。

### 事件名称和参数必须匹配

父子组件之间的事件名称是一份明确约定。

如果子组件执行：

```ts
emit('select', 101);
```

父组件却写：

```vue
<AccountAction @selected="handleSelect" />
```

那么父组件监听的是 `selected`，子组件发出的是 `select`，两者不匹配，处理函数不会按预期执行。

排查事件不生效时，可以依次检查：

1. 子组件是否执行了 `emit()`。
2. `emit()` 中的事件名称是否正确。
3. 父组件监听的事件名称是否与子组件一致。
4. 子组件发出的参数类型和顺序是否与父组件处理函数一致。

### 组件自定义事件不会自动向上冒泡

原生 DOM 事件有冒泡机制，但 Vue 组件自定义事件不会像 DOM 事件一样自动逐层向祖先组件传播。

例如：

```text
页面 App
  └── 中间组件 AccountList
        └── 子组件 AccountAction
```

如果 `AccountAction` 发出 `select`，只有直接监听它的 `AccountList` 能接收到。若 `App` 需要知道这次选择，中间组件必须明确接收并转发事件，或者使用其他合适的共享状态方案。

因此，阅读企业项目中的组件事件时，不要假设子组件发出的事件会自动到达最外层页面。

### Props 与 Emit 配合使用

在实际开发中，Props 和 Emit 经常成对出现：

- 父组件通过 Props 把当前数据传给子组件。
- 子组件根据 Props 显示内容。
- 用户在子组件中进行操作。
- 子组件通过 Emit 报告操作及必要参数。
- 父组件处理事件并修改自己拥有的状态。
- 新状态再通过 Props 传给子组件。

可以把它记成：

**数据向下传，事件向上报；状态由拥有它的组件负责修改。**

> [!EXERCISE] 事件名称不匹配
>
> 子组件执行 `emit('select', 102)`，父组件却使用 `@selected="handleSelect"` 监听。点击按钮后，父组件为什么没有更新？应该修改哪一处？
>
> 【答案】
>
> 因为子组件发出的是 `select`，父组件监听的是 `selected`，事件名称不一致。可以将父组件改为 `@select="handleSelect"`。
>
> **解析：** Emit 是显式的组件通信协议，父组件不会根据事件名称的含义自动推断另一个名称。Props 也不能代替事件监听来解决这个问题。

## 组件的 v-model：理解双向绑定的实现

### 先回顾原生输入框的 v-model

第一天已经使用过原生表单输入框的 `v-model`：

```vue
<input v-model="name" />
```

当用户输入内容时，`name` 会更新；当程序修改 `name` 时，输入框显示也会同步更新。

`v-model` 将数据传递和更新事件组合成一个方便的语法。

但在自定义组件上使用 `v-model` 时，不能简单认为子组件可以随意修改父组件的变量。它仍然是通过 Props 和 Emit 两个方向完成通信。

### 自定义组件的默认 v-model 由什么组成

假设父组件中有：

```ts
const name = ref('张三');
```

父组件使用：

```vue
<NameInput v-model="name" />
```

Vue 会把它展开成类似下面的形式：

```vue
<NameInput
    :model-value="name"
    @update:model-value="name = $event"
/>
```

这两部分分别负责：

- `:model-value="name"`：把父组件当前的 `name` 传给子组件。
- `@update:model-value="name = $event"`：监听子组件的更新事件，把事件携带的新值写回父组件的 `name`。

因此，自定义组件的默认 `v-model` 本质上仍然是：

**一个名为 `modelValue` 的 Prop + 一个名为 `update:modelValue` 的更新事件。**

子组件不能只接收 `modelValue` 就期待父组件自动更新。它还必须在值变化时发出 `update:modelValue` 事件。

### modelValue、update:modelValue 与 $event

脚本中通常使用驼峰命名：

- Prop：`modelValue`
- 事件：`update:modelValue`

模板中通常使用短横线形式：

- `model-value`
- `update:model-value`

事件名称中的冒号是协议名称的一部分。`update:modelValue` 表示“更新 modelValue”，不能把它当作普通单词随意改成 `update-modelValue`。

模板中的 `$event` 表示当前事件传递的参数。子组件执行：

```ts
emit('update:modelValue', '李四');
```

父组件监听时，`$event` 就是字符串 `'李四'`。

需要注意，不同事件的 `$event` 内容可能不同：

- Element Plus 的输入框更新事件会提供新的输入值。
- 原生 HTML 输入框的 `input` 事件提供的是 DOM Event 对象。

因此，不能仅凭事件名称判断 `$event` 一定是字符串，要看事件由哪个组件或元素发出，以及它规定了什么参数。

### 完整程序：手动实现组件 v-model

文件一：`src/components/NameInput.vue`

```vue
<script setup lang="ts">
const props = defineProps<{
    modelValue: string;
}>();

const emit = defineEmits<{
    (event: 'update:modelValue', value: string): void;
}>();

function handleUpdate(value: string): void {
    // 将内部输入框产生的新值转发给父组件。
    emit('update:modelValue', value);
}
</script>

<template>
    <el-input
        :model-value="props.modelValue"
        @update:model-value="handleUpdate"
        placeholder="请输入姓名"
    />
</template>
```

文件二：`src/App.vue`

```vue
<script setup lang="ts">
import { ref } from 'vue';
import NameInput from './components/NameInput.vue';

const name = ref('张三');

function resetName(): void {
    // 父组件修改自己的状态，子输入框会同步更新。
    name.value = '张三';
}
</script>

<template>
    <h2>组件双向绑定</h2>

    <NameInput v-model="name" />

    <p>父组件中的姓名：{{ name }}</p>

    <el-button @click="resetName">
        恢复姓名
    </el-button>
</template>
```

这段程序可以按六个步骤理解：

1. 父组件创建 `name`，初始值为“张三”。
2. 父组件通过 `v-model` 把 `name` 传给 `NameInput`。
3. 子组件通过 `props.modelValue` 取得父组件的值，并传给内部的 `el-input`。
4. 用户在输入框中把姓名改成“李四”，`el-input` 发出 `update:model-value`，携带新的字符串。
5. 子组件的 `handleUpdate()` 接收新值，再通过 `emit('update:modelValue', value)` 向父组件发送更新事件。
6. 父组件的 `v-model` 接收新值并更新 `name`，随后新的 Prop 再向下传递，输入框和段落保持一致。

所以，双向绑定不是两个组件直接修改彼此的数据，而是**父状态向下传递，子事件向上更新父状态**。

### 不使用 v-model 时，可以把两部分手动写出来

下面的写法与 `<NameInput v-model="name" />` 在通信结构上等价：

```vue
<NameInput
    :model-value="name"
    @update:model-value="name = $event"
/>
```

如果希望逻辑更清楚，也可以在父组件中绑定一个处理函数：

```ts
function handleNameUpdate(value: string): void {
    name.value = value;
}
```

```vue
<NameInput
    :model-value="name"
    @update:model-value="handleNameUpdate"
/>
```

这种展开形式在阅读复杂组件或排查双向绑定问题时非常有用。看到 `v-model`，就应该能在脑中还原出 Prop 和更新事件两个部分。

### 命名 v-model：一个组件可以有多个模型

默认 `v-model` 使用 `modelValue` 和 `update:modelValue`。

如果一个组件需要同时绑定多个不同的数据，可以使用命名模型：

```vue
<AccountEditor
    v-model:name="accountName"
    v-model:balance="accountBalance"
/>
```

它们分别对应：

- `name` Prop 和 `update:name` 事件。
- `balance` Prop 和 `update:balance` 事件。

这与第二天 Element Plus 分页组件中的：

```vue
<el-pagination
    v-model:current-page="currentPage"
/>
```

是同一种命名双向绑定思路。这里绑定的模型名是 `currentPage`，对应的更新事件是 `update:currentPage`。

阅读第三方组件时，可以先找到它支持哪些 `v-model` 名称，再确认这些名称对应的 Prop 和更新事件。

### defineModel：Vue 3.4 及以上的简化写法

前面的 `NameInput.vue` 手动声明了 `modelValue` 和 `update:modelValue`。Vue 3.4 及以上提供了 `defineModel()`，可以把这两个声明组合起来。

```ts
const model = defineModel<string>();
```

这里：

- `defineModel<string>()` 声明一个字符串类型的模型。
- 返回的 `model` 是一个可读写的响应式引用。
- 子组件读取 `model.value` 可以得到当前模型值。
- 子组件修改 `model.value` 时，Vue 会按照组件 v-model 的更新协议通知父组件。

它不是允许子组件直接修改普通只读 Prop 的例外，而是 Vue 为模型 Prop 和更新事件提供的简写。

### 完整程序：使用 defineModel 实现姓名输入

文件一：`src/components/ModernNameInput.vue`

```vue
<script setup lang="ts">
// Vue 3.4+ 支持 defineModel。
const model = defineModel<string>({
    required: true
});
</script>

<template>
    <!-- model 本身是 ref，模板中可直接交给 v-model。 -->
    <el-input v-model="model" />
</template>
```

文件二：`src/App.vue`

```vue
<script setup lang="ts">
import { ref } from 'vue';
import ModernNameInput from './components/ModernNameInput.vue';

const name = ref('张三');

function resetName(): void {
    name.value = '张三';
}
</script>

<template>
    <h2>defineModel 演示</h2>

    <ModernNameInput v-model="name" />

    <p>父组件姓名：{{ name }}</p>

    <el-button @click="resetName">
        恢复姓名
    </el-button>
</template>
```

父组件的使用方式与手动实现版本完全相同。区别在于子组件内部不再需要手动声明 `modelValue`、`update:modelValue`，而是使用 `defineModel()` 完成这项工作。

**版本要求：** `defineModel()` 从 Vue 3.4 开始提供。如果项目使用的 Vue 版本低于 3.4，应使用前面手动声明 Props 和 Emit 的方式。可以检查项目 `package.json` 中的 `vue` 版本。

如果子组件给 `defineModel()` 设置默认值，而父组件对应的模型初始值仍然是 `undefined`，就可能出现子组件显示默认值、父组件状态却没有同步初始值的情况。为了避免这种状态差异，实际业务中应让父组件明确初始化模型值，或者谨慎设计默认值。

### Props、Emit 与 v-model 的关系

| 方式 | 子组件声明 | 父组件使用 | 主要作用 |
|---|---|---|---|
| 单向传值 | `defineProps()` | `:name="value"` | 父向子传递数据 |
| 自定义事件 | `defineEmits()` | `@select="handler"` | 子向父通知操作 |
| 默认双向绑定 | `modelValue` + `update:modelValue` | `v-model="value"` | 组合向下传值和向上更新 |
| 命名双向绑定 | `title` + `update:title` | `v-model:title="value"` | 绑定指定名称的模型 |
| 简化双向绑定 | `defineModel()` | `v-model="value"` | 减少子组件手动声明代码 |

> [!EXERCISE] 只有 Prop 能实现双向绑定吗
>
> 父组件使用：
>
> ```vue
> <NameInput :model-value="name" />
> ```
>
> 子组件内部可以正常显示姓名，但用户修改输入框后，父组件中的 `name` 会自动更新吗？
>
> 【答案】
>
> 不会。父组件只把 `name` 向下传给子组件，没有监听子组件发出的更新事件。
>
> **解析：** 完整的默认 `v-model` 需要 `:model-value` 和 `@update:model-value` 两部分。可以直接使用 `v-model`，也可以手动展开这两个部分。

## 插槽：父组件向子组件传递模板内容

### 为什么需要插槽

Props 主要传递数据。例如，父组件把账户名称和余额传给子组件，子组件根据这些数据显示固定的账户卡片结构。

但有时，父组件希望传入的不只是一条数据，而是一段完整的模板内容。

例如，页面中有多个信息面板，它们都需要相同的边框、标题区域和底部区域，但每个面板内部显示的内容不同。

**插槽（Slot）允许父组件把一段模板内容放入子组件预留的位置。** 可以把它理解成一个内容占位区域：子组件负责整体结构，父组件决定某些区域具体显示什么。

### 默认插槽与默认内容

子组件中使用 `<slot />` 声明一个默认插槽：

```vue
<template>
    <section class="panel">
        <slot />
    </section>
</template>
```

父组件使用时，把内容写在组件标签内部：

```vue
<AccountPanel>
    <p>储蓄账户用于日常收支。</p>
</AccountPanel>
```

父组件提供的段落会出现在子组件的 `<slot />` 位置。

子组件也可以为插槽提供默认内容：

```vue
<slot>父组件没有提供说明</slot>
```

当父组件没有提供默认插槽内容时，显示“父组件没有提供说明”；当父组件提供了内容时，则显示父组件提供的内容。默认内容是一种回退方案，不是无论如何都会附加在父组件内容后面。

### 具名插槽：为多个内容位置指定名称

如果子组件中有多个插槽位置，就需要为它们分别命名：

```vue
<template>
    <section>
        <header>
            <slot name="header" />
        </header>

        <main>
            <slot />
        </main>

        <footer>
            <slot name="footer" />
        </footer>
    </section>
</template>
```

这里有三个插槽：

- `name="header"`：标题区域。
- 默认插槽：正文区域。
- `name="footer"`：底部区域。

父组件使用 `<template>` 和 `#插槽名` 指定内容放在哪个位置：

```vue
<AccountPanel>
    <template #header>
        <h2>账户详情</h2>
    </template>

    <template #default>
        <p>本次查询到 3 条记录。</p>
    </template>

    <template #footer>
        <p>以上内容仅供查看。</p>
    </template>
</AccountPanel>
```

`#header` 是 `v-slot:header` 的简写；`#footer` 是 `v-slot:footer` 的简写。默认插槽也可以显式写成 `#default`，但只有一个默认插槽时，通常直接把内容写在组件标签内部即可。

父组件中的 `<template #header>` 等模板容器不会额外生成一个普通 HTML 元素。最终生成什么结构，由子组件中插槽所在的位置决定。

### 完整程序：账户面板中的默认插槽和具名插槽

文件一：`src/components/NamedPanel.vue`

```vue
<template>
    <section class="panel">
        <header class="panel-header">
            <slot name="header">默认标题</slot>
        </header>

        <main class="panel-main">
            <slot>默认正文内容</slot>
        </main>

        <footer class="panel-footer">
            <slot name="footer">默认底部说明</slot>
        </footer>
    </section>
</template>

<style scoped>
.panel {
    border: 1px solid #bbb;
    border-radius: 8px;
    margin-bottom: 12px;
}

.panel-header,
.panel-main,
.panel-footer {
    padding: 12px;
}

.panel-header {
    border-bottom: 1px solid #ddd;
}

.panel-footer {
    border-top: 1px solid #ddd;
}
</style>
```

文件二：`src/App.vue`

```vue
<script setup lang="ts">
import NamedPanel from './components/NamedPanel.vue';
</script>

<template>
    <h2>账户信息面板</h2>

    <NamedPanel>
        <template #header>
            <h3>储蓄账户</h3>
        </template>

        <template #default>
            <p>账户余额：3200 元</p>
            <p>账户状态：正常</p>
        </template>

        <template #footer>
            <p>最后查询时间：今天</p>
        </template>
    </NamedPanel>

    <NamedPanel>
        <template #header>
            <h3>工资账户</h3>
        </template>

        <template #default>
            <p>账户余额：8500 元</p>
        </template>
    </NamedPanel>
</template>
```

第一块面板的标题、正文和底部内容都由父组件提供。第二块面板没有提供 `footer` 插槽，所以子组件会显示默认底部说明。它也没有改变子组件的边框和布局。

这就是插槽适合复用界面框架的原因：**子组件固定整体结构，父组件按业务需要填入不同内容。**

### 插槽内容的作用域属于父组件

这一点非常重要：**父组件写在插槽中的模板，默认读取的是父组件自己的变量。**

例如：

```vue
<script setup lang="ts">
const message = '来自父组件的说明';
</script>

<template>
    <AccountPanel>
        <p>{{ message }}</p>
    </AccountPanel>
</template>
```

这里的 `message` 属于父组件。即使这段 `<p>` 最终被渲染在 `AccountPanel` 内部，它也不会因此自动获得子组件内部的局部变量。

这与普通函数的词法作用域类似：代码写在哪个组件的模板中，就按照哪个组件的作用域解析变量。

如果父组件需要在插槽内容中使用子组件的数据，子组件必须明确把数据作为插槽参数提供出来。

### 作用域插槽：子组件把数据提供给父模板

子组件可以在 `<slot>` 上绑定属性：

```vue
<slot :account="account" />
```

这里的 `account` 是子组件中的数据，`:account` 表示把它作为一个名为 `account` 的插槽参数传给父组件。

父组件通过 `#default="scope"` 接收这些参数：

```vue
<template #default="scope">
    <p>{{ scope.account.name }}</p>
</template>
```

这里：

- `scope` 是接收插槽参数的局部变量名，可以改成 `slotData`。
- `scope.account` 是子组件提供的账户对象。
- `scope.account.name` 读取该账户的名称。

因此，作用域插槽的数据方向是：**子组件提供数据，父组件决定如何显示。**

这和 Props 的方向不同：

- Props：父组件提供数据，子组件显示。
- 作用域插槽：子组件提供插槽数据，父组件编写显示模板。

### 插槽参数的名称由子组件决定

假设子组件写：

```vue
<slot :account="account" />
```

父组件就可以读取 `scope.account`。

如果子组件改为：

```vue
<slot :row="account" />
```

父组件就需要读取 `scope.row`。

`scope` 只是父组件为接收参数声明的变量名，可以自由命名；`account` 或 `row` 则是子组件提供的参数名称，父子双方必须对应。

第二天学习的 Element Plus 表格插槽也使用了同样的机制：

```vue
<el-table-column label="账户名称">
    <template #default="scope">
        {{ scope.row.name }}
    </template>
</el-table-column>
```

Element Plus 为默认插槽提供了当前行数据，所以父模板可以通过 `scope.row` 读取当前行。自定义组件和 Element Plus 表格的具体参数不同，但底层的作用域插槽思路是一致的。

### 完整程序：父组件决定如何展示子组件提供的账户数据

文件一：`src/components/AccountPanel.vue`

```vue
<script setup lang="ts">
interface Account {
    id: number;
    name: string;
    balance: number;
}

const props = defineProps<{
    account: Account;
}>();
</script>

<template>
    <section class="account-panel">
        <header>
            <slot name="header">账户信息</slot>
        </header>

        <main>
            <!-- 将子组件收到的账户对象作为插槽参数提供给父模板。 -->
            <slot :account="props.account">
                <p>{{ props.account.name }}</p>
            </slot>
        </main>

        <footer>
            <!-- 具名插槽也可以提供自己的参数。 -->
            <slot
                name="footer"
                :id="props.account.id"
            >
                <p>账户编号：{{ props.account.id }}</p>
            </slot>
        </footer>
    </section>
</template>

<style scoped>
.account-panel {
    border: 1px solid #bbb;
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 12px;
}

header,
main,
footer {
    padding: 8px;
}

footer {
    border-top: 1px solid #ddd;
}
</style>
```

文件二：`src/App.vue`

```vue
<script setup lang="ts">
import AccountPanel from './components/AccountPanel.vue';

interface Account {
    id: number;
    name: string;
    balance: number;
}

const account: Account = {
    id: 101,
    name: '储蓄账户',
    balance: 3200
};
</script>

<template>
    <AccountPanel :account="account">
        <template #header>
            <h2>账户详情</h2>
        </template>

        <template #default="scope">
            <p>账户名称：{{ scope.account.name }}</p>
            <p>账户余额：{{ scope.account.balance }} 元</p>
        </template>

        <template #footer="footerData">
            <p>当前账户编号：{{ footerData.id }}</p>
            <p>以上信息由父组件决定如何展示。</p>
        </template>
    </AccountPanel>
</template>
```

本例中，父组件把账户对象通过 Props 传给 `AccountPanel`。子组件收到对象后，又通过默认插槽参数 `account` 把它提供给父组件的插槽模板。

父组件使用 `scope.account.name` 和 `scope.account.balance` 生成正文；底部插槽使用另一个参数 `id`，所以接收变量 `footerData.id`。

这里要把两次通信分开理解：

1. `:account="account"` 是父组件通过 Props 向子组件传递账户对象。
2. `:account="props.account"` 是子组件通过插槽参数向父模板提供账户对象。

它们发生在不同方向，不能把 Props 和作用域插槽混为一谈。

### Props、Emit 与 Slot 应该怎样选择

| 需求 | 使用方式 | 数据或内容方向 |
|---|---|---|
| 父组件告诉子组件显示哪个账户 | Props | 父 → 子 |
| 子组件通知父组件用户选择了哪个账户 | Emit | 子 → 父 |
| 父组件给子组件提供一段标题或按钮模板 | 默认插槽 / 具名插槽 | 父组件提供内容 |
| 子组件提供当前行数据，让父组件自定义显示方式 | 作用域插槽 | 子组件提供数据 |
| 父子组件共同维护一个输入值 | `v-model` | 向下传值 + 向上更新 |

不要为了所有通信都使用同一种方式。传递普通业务数据时优先考虑 Props；报告用户操作时使用 Emit；需要让使用者自定义组件内部的模板内容时使用 Slot。

> [!EXERCISE] 具名插槽名称由谁决定
>
> 子组件写成：
>
> ```vue
> <footer>
>     <slot name="actions" />
> </footer>
> ```
>
> 父组件应该使用 `#footer` 还是 `#actions` 填充这个位置？
>
> 【答案】
>
> 应使用 `#actions`。
>
> **解析：** 父组件对接的是插槽的 `name`，而不是包裹插槽的 HTML 标签。`footer` 决定页面结构，`actions` 才是插槽名称。

> [!EXERCISE] 作用域插槽的数据来自哪里
>
> 父组件没有声明 `account`，却可以在下面的模板中读取 `scope.account.name`：
>
> ```vue
> <template #default="scope">
>     {{ scope.account.name }}
> </template>
> ```
>
> 为什么能够读取？把这段模板移动到 `AccountPanel` 外部，还能继续使用 `scope.account` 吗？
>
> 【答案】
>
> 能够读取，是因为子组件通过 `<slot :account="account" />` 提供了名为 `account` 的插槽参数，父模板通过 `scope` 接收它。
>
> 把模板移到插槽作用域之外，就不能继续使用局部变量 `scope`。插槽参数只在对应的插槽模板范围内有效。

## 生命周期：组件在不同阶段执行什么操作

### 组件为什么有生命周期

组件不是永久存在的。一个组件从创建到离开页面，会经历若干阶段：

1. 创建组件实例，执行组件初始化逻辑。
2. 把组件的初始内容挂载到页面。
3. 响应式数据变化，更新页面内容。
4. 组件不再需要时，从页面中卸载并清理相关资源。

Vue 为这些阶段提供了生命周期钩子（Lifecycle Hooks）。开发者可以在相应阶段注册回调函数，让代码在指定时机执行。

生命周期钩子不是普通的“随时调用的方法”。它们用于把一段回调注册到组件实例的某个生命周期阶段。

### setup 与挂载不是同一件事

在 `<script setup>` 中编写的代码，会在组件实例初始化时执行。

例如：

```ts
const count = ref(0);

function increase(): void {
    count.value += 1;
}
```

执行这些代码时，响应式状态和函数已经创建，但组件模板对应的 DOM 尚未完成初次挂载。

如果某段逻辑需要访问已经生成并插入页面的 DOM，就不能简单地放在 setup 初始化代码中。应根据需要使用 `onMounted()`。

### 常见生命周期钩子

组合式 API 中常用的生命周期钩子如下：

| 生命周期钩子 | 执行时机 | 常见用途 |
|---|---|---|
| `onBeforeMount()` | 初次挂载开始之前 | 挂载前需要执行的准备工作 |
| `onMounted()` | 组件初次挂载完成后 | 访问已挂载 DOM、启动依赖页面的行为 |
| `onBeforeUpdate()` | 响应式数据变化导致 DOM 更新之前 | 更新前读取当前 DOM 状态 |
| `onUpdated()` | 组件 DOM 更新完成后 | 需要在更新后读取 DOM 的场景 |
| `onBeforeUnmount()` | 组件卸载之前 | 卸载前的收尾工作 |
| `onUnmounted()` | 组件卸载完成后 | 清理定时器、事件监听等外部资源 |

不需要为了完整而在每个组件中都写上全部钩子。应该根据实际需求选择。

### onMounted 与 onUpdated

`onMounted()` 接收一个回调函数。组件完成初次挂载后，Vue 会执行这个回调：

```ts
import { onMounted } from 'vue';

onMounted(() => {
    console.log('组件已经挂载');
});
```

它只表示当前组件实例完成了初次挂载，不表示每次数据变化或页面更新都会再次执行。

`onUpdated()` 则在组件因为响应式数据变化而完成 DOM 更新后执行：

```ts
import { onUpdated } from 'vue';

onUpdated(() => {
    console.log('组件 DOM 已更新');
});
```

它不是某个具体字段的监听器。如果只关心 `name` 是否变化，应该使用第二天学习的 `watch()`；如果要根据已有数据计算结果，应该使用 `computed()`。

Vue 会对同一轮中的多次状态修改进行更新调度和合并。因此，不能简单地把 `onUpdated()` 执行一次等同于“用户只操作了一次”。

**不要在 `onUpdated()` 中无条件修改驱动当前组件渲染的响应式数据。** 这样可能导致状态修改再次触发 DOM 更新，进而形成重复更新甚至无限循环。

### onUnmounted：组件卸载后执行清理

组件卸载时，Vue 会停止与该组件关联的响应式效果，但不会自动理解和清理所有由开发者自行创建的外部资源。

例如：

- `setInterval()` 创建的定时器。
- `window.addEventListener()` 注册的事件监听。
- 某些手动创建的订阅或外部连接。

这些资源需要在适当的生命周期阶段主动释放。

```ts
import { onUnmounted } from 'vue';

onUnmounted(() => {
    clearInterval(timer);
});
```

`onUnmounted()` 在组件实例卸载后执行。对于定时器、事件监听等资源，通常在这里完成清理。

### 定时器：为什么创建后必须清理

`setInterval(callback, 1000)` 会按照指定时间间隔重复执行回调函数。它会返回一个定时器标识，后续可以通过 `clearInterval()` 停止这个定时器。

如果组件卸载后没有清理定时器，定时器回调仍可能继续执行，造成不必要的资源占用，甚至访问已经不再需要的组件状态。

TypeScript 中可以这样声明定时器变量：

```ts
let timer: ReturnType<typeof setInterval> | undefined;
```

`ReturnType<typeof setInterval>` 表示取得 `setInterval` 函数的返回类型；`| undefined` 表示定时器还没有创建时，变量可以是 `undefined`。这种写法不需要手动猜测当前类型环境中定时器标识的具体类型。

### 完整程序：挂载时启动定时器，卸载时清理

文件一：`src/components/LifecycleDemo.vue`

```vue
<script setup lang="ts">
import { ref, onMounted, onUpdated, onUnmounted } from 'vue';

const seconds = ref(0);
let timer: ReturnType<typeof setInterval> | undefined;

onMounted(() => {
    console.log('mounted：组件完成初次挂载');

    // 组件挂载后开始计时，每秒增加一次。
    timer = setInterval(() => {
        seconds.value += 1;
    }, 1000);
});

onUpdated(() => {
    // seconds 变化后，模板更新完成时执行。
    console.log('updated：页面已显示新的秒数', seconds.value);
});

onUnmounted(() => {
    console.log('unmounted：组件已经卸载');

    // 组件不再显示时停止定时器。
    if (timer !== undefined) {
        clearInterval(timer);
        timer = undefined;
    }
});
</script>

<template>
    <section>
        <p>组件已经显示 {{ seconds }} 秒</p>
    </section>
</template>
```

文件二：`src/App.vue`

```vue
<script setup lang="ts">
import { ref } from 'vue';
import LifecycleDemo from './components/LifecycleDemo.vue';

const visible = ref(true);

function toggleVisible(): void {
    visible.value = !visible.value;
}
</script>

<template>
    <h2>生命周期演示</h2>

    <button @click="toggleVisible">
        {{ visible ? '卸载计时组件' : '重新创建计时组件' }}
    </button>

    <LifecycleDemo v-if="visible" />
</template>
```

运行后，打开浏览器开发者工具的 Console：

1. 页面初次显示时，执行 `onMounted()`，控制台出现 mounted 日志。
2. 每秒 `seconds` 增加，模板显示的秒数发生变化，随后执行 `onUpdated()`。
3. 点击“卸载计时组件”，`v-if` 移除组件，执行 `onUnmounted()`，定时器被清理。
4. 再次点击按钮，Vue 创建一个新的组件实例，`seconds` 重新从 0 开始，定时器也重新创建。

这个程序同时说明了组件实例和生命周期之间的关系：重新创建组件实例时，组件内部的 `ref` 也会重新初始化。

### v-if 与 v-show：隐藏组件不一定等于卸载组件

第二天已经学习过 `v-if` 和 `v-show`。在组件场景中，两者的区别不仅是显示方式不同，还会影响组件生命周期。

| 对比 | `v-if` | `v-show` |
|---|---|---|
| 条件为假时 | 从页面中移除对应内容 | 保留元素，只改变显示状态 |
| 组件实例 | 卸载 | 保留 |
| 再次显示 | 创建新实例 | 显示原实例 |
| 组件内部状态 | 新实例会重新初始化 | 原状态保留 |
| 定时器等资源 | 卸载时应清理 | 隐藏时仍可能继续运行 |

如果把上例中的 `<LifecycleDemo v-if="visible" />` 改成 `<LifecycleDemo v-show="visible" />`，点击隐藏按钮时，组件不会卸载，`onUnmounted()` 不会执行，定时器也不会因为隐藏而自动停止。再次显示时，仍然是原来的组件实例，计时不会从 0 重新开始。

所以，**v-if 控制组件是否存在，v-show 控制组件是否显示。** 如果某个组件在隐藏时必须停止定时器或释放资源，应根据实际业务选择合适的卸载策略，不能把 `v-show` 当成卸载。

### window 事件监听也需要清理

除了定时器，窗口大小变化监听也是常见的外部资源：

```ts
window.addEventListener('resize', updateWidth);
```

这行代码会把 `updateWidth` 注册为窗口尺寸变化时执行的回调。卸载时需要：

```ts
window.removeEventListener('resize', updateWidth);
```

**添加和移除监听时必须使用同一个函数引用。**

下面的写法不能正确移除之前注册的监听：

```ts
window.addEventListener('resize', () => {
    console.log(window.innerWidth);
});

window.removeEventListener('resize', () => {
    console.log(window.innerWidth);
});
```

虽然两段箭头函数的内容看起来相同，但它们是两个不同的函数对象，不能互相匹配。

### 完整程序：监听窗口宽度并在卸载时移除监听

文件：`src/App.vue`

```vue
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const width = ref(0);

function updateWidth(): void {
    width.value = window.innerWidth;
}

onMounted(() => {
    // 初次挂载后读取窗口当前宽度。
    updateWidth();

    // 注册窗口尺寸变化监听。
    window.addEventListener('resize', updateWidth);
});

onUnmounted(() => {
    // 使用同一个函数引用移除监听。
    window.removeEventListener('resize', updateWidth);
});
</script>

<template>
    <p>当前窗口宽度：{{ width }} px</p>
</template>
```

这里把读取窗口宽度和注册监听放在 `onMounted()` 中，是因为它们依赖浏览器环境。卸载时通过 `onUnmounted()` 移除监听，避免组件不再需要时仍然保留回调。

### 生命周期与 watch 应该怎样区分

生命周期钩子和 `watch()` 都能在某个时机执行代码，但它们关注的对象不同。

| 需求 | 使用方式 | 原因 |
|---|---|---|
| 组件初次显示后执行初始化 | `onMounted()` | 关注组件挂载阶段 |
| 组件 DOM 更新后读取页面尺寸 | `onUpdated()` | 关注组件更新阶段 |
| 某个查询条件变化后发起请求 | `watch()` | 关注具体响应式数据 |
| 组件离开页面时清理定时器 | `onUnmounted()` | 关注组件卸载阶段 |
| 根据账户列表计算账户数量 | `computed()` | 关注派生数据 |

例如，用户修改账户名称时，如果只需要记录旧值和新值，应使用 `watch(() => form.name, ...)`，而不是在 `onUpdated()` 中比较整个页面。

生命周期钩子回答的是“组件处于哪个阶段”；`watch()` 回答的是“指定的数据发生变化后要做什么”。

> [!EXERCISE] v-if 与 v-show 对生命周期的影响
>
> 将计时组件从 `v-if="visible"` 改为 `v-show="visible"`。点击隐藏按钮后，定时器会自动停止吗？重新显示后，计时会从 0 开始吗？
>
> 【答案】
>
> 定时器不会自动停止，重新显示后计时也不会从 0 开始。
>
> **解析：** `v-show` 只控制显示状态，不会卸载组件实例，因此 `onUnmounted()` 不会执行。只有 `v-if` 条件变为假并移除组件时，才会触发卸载过程；重新创建实例后，组件内部状态重新初始化。

## 拓展：Composable 组合式函数

### 什么是 Composable

在前面的组件中，`AccountCounter` 自己管理 `count`，`LifecycleDemo` 自己管理定时器。随着项目变大，可能会发现不同组件需要使用相似的状态逻辑。

例如：

- 多个页面都需要计数器逻辑。
- 多个组件都需要读取窗口宽度。
- 多个页面都需要管理查询条件和重置行为。

如果把这些逻辑复制到不同组件中，后续修改时就需要重复维护。

Vue 允许把可复用的有状态逻辑提取到普通 TypeScript 文件中，这种函数通常称为**组合式函数（Composable）**，命名习惯是 `useXxx`。

Composable 的重点是复用逻辑，而不是复用一整块页面结构。

### 普通工具函数与 Composable 的区别

先看一个普通工具函数：

```ts
function formatMoney(amount: number): string {
    return amount.toFixed(2);
}
```

它只接收一个金额，返回格式化后的字符串，没有创建响应式状态，也不管理监听或生命周期。这种函数通常就是普通工具函数。

再看一个组合式函数：

```ts
function useCounter() {
    const count = ref(0);

    function increase(): void {
        count.value += 1;
    }

    return { count, increase };
}
```

它创建响应式状态，并把状态和操作函数一起返回给调用者。组件可以直接使用这套逻辑。

因此，是否属于 Composable，不是看函数名有没有 `use`，而是看它是否在组合和复用响应式状态、侦听器、生命周期等 Vue 逻辑。

### Composable 与组件的区别

| 对比 | 组件 | Composable |
|---|---|---|
| 主要复用内容 | 界面结构和相关行为 | 有状态的业务逻辑 |
| 文件形式 | `.vue` 文件 | 通常是 `.ts` 文件 |
| 是否有模板 | 有 | 没有 |
| 是否可以创建响应式状态 | 可以 | 可以 |
| 是否可以在组件中使用 | 可以 | 可以在组件 setup 中调用 |

例如，账户卡片需要复用完整的展示结构，适合封装为组件；多个页面需要复用“记录查询次数”的逻辑，则可以封装为 Composable。

### 状态放在哪里，决定多个调用者是否共享

看下面的写法：

```ts
import { ref } from 'vue';

export function useCounter() {
    const count = ref(0);

    function increase(): void {
        count.value += 1;
    }

    return { count, increase };
}
```

`count` 定义在 `useCounter()` 函数内部。每调用一次 `useCounter()`，函数都会创建一份新的 `count`。

例如：

```ts
const first = useCounter();
const second = useCounter();
```

`first.count` 和 `second.count` 是两份独立状态。

如果把 `count` 移到函数外：

```ts
import { ref } from 'vue';

// 模块加载时创建一份状态。
const count = ref(0);

export function useCounter() {
    function increase(): void {
        count.value += 1;
    }

    return { count, increase };
}
```

那么同一个模块中的多个调用者会取得同一份模块级 `count`，从而共享状态。

所以要区分：

- **逻辑复用：** 多个组件使用同一套函数实现。
- **状态共享：** 多个组件操作同一份响应式数据。

两者不是一回事。Composable 默认不意味着全局共享，是否共享取决于状态创建的位置和具体设计。

### 解构 Composable 返回值为什么可以保留响应式

```ts
const { count, increase } = useCounter();
```

这里解构出来的 `count` 仍然是一个 ref 对象，所以响应式关系没有丢失。模板能够自动解包它，脚本中仍然通过 `count.value` 读取或修改。

这与第二天学习的 reactive 对象解构不同：

```ts
const form = reactive({
    name: '张三'
});

const { name } = form;
```

这里的 `name` 是读取出来的普通字符串，不会自动变成持续跟随 `form.name` 的 ref。

因此，**解构是否保留响应式，取决于解构出来的值本身是不是 ref，而不是只看有没有使用解构语法。**

### 完整程序：使用 Composable 复用计数逻辑

文件一：`src/composables/useCounter.ts`

```ts
import { ref } from 'vue';

export function useCounter() {
    // 每次调用 useCounter 都创建独立的 count。
    const count = ref(0);

    function increase(): void {
        count.value += 1;
    }

    return {
        count,
        increase
    };
}
```

文件二：`src/components/CounterBox.vue`

```vue
<script setup lang="ts">
import { useCounter } from '../composables/useCounter';

const props = defineProps<{
    title: string;
}>();

// 每个 CounterBox 实例调用一次，得到自己的计数状态。
const { count, increase } = useCounter();
</script>

<template>
    <section>
        <p>{{ props.title }}：{{ count }}</p>

        <button @click="increase">
            增加一次
        </button>
    </section>
</template>

<style scoped>
section {
    border: 1px solid #bbb;
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 12px;
}
</style>
```

文件三：`src/App.vue`

```vue
<script setup lang="ts">
import CounterBox from './components/CounterBox.vue';
</script>

<template>
    <h2>Composable 复用逻辑</h2>

    <CounterBox title="查询次数" />
    <CounterBox title="编辑次数" />
</template>
```

点击第一块两次、第二块一次，分别显示 2 和 1。

两个组件复用的是 `useCounter()` 中创建计数状态和增加计数的逻辑，但由于 `count` 位于函数内部，每个组件实例调用时都会创建自己的状态。

如果把 `count` 移到模块顶层，两个组件就会共享计数。状态创建位置的变化会改变业务行为，不是简单的代码整理。

### Composable 中可以使用 watch 和生命周期吗

可以。Composable 不仅能返回 `ref` 和函数，也可以封装 `watch()`、生命周期钩子等逻辑。

例如，一个 Composable 可以在组件挂载后注册窗口尺寸监听，并在组件卸载时移除监听。

但需要注意调用时机：如果 Composable 内部使用 `onMounted()`、`onUnmounted()` 等生命周期钩子，通常应在组件的 `setup` 同步执行阶段调用，确保它们能关联到当前组件实例。`watch()` 本身也可以在组件外使用，但如果不在组件的响应式作用域中创建，就需要自行管理侦听器的停止时机。

不要等到某个按钮点击后，才临时调用一个依赖组件初始化上下文的 Composable 并期望它自动绑定到正确的生命周期。

## 拓展：Vue Router 页面路由

### 为什么需要路由

一个企业应用通常不只有一个页面。例如账户列表页面、账户详情页面、转账页面和交易记录页面，都需要根据用户访问的地址显示不同的页面组件。

**路由负责建立 URL 地址与页面组件之间的映射关系。** 当地址发生变化时，Vue Router 根据路由配置确定应该显示哪个组件。

### 安装 Vue Router

Vue 3 项目使用 Vue Router 4。

如果项目还没有安装，在项目根目录执行：

```bash
npm install vue-router@4
```

如果 `package.json` 中已经有 `vue-router`，就不需要重复安装。

本拓展使用哈希路由（Hash History），地址形式类似：

```text
http://localhost:5173/#/accounts/101
```

哈希路由不需要服务器为每个前端路径额外配置回退入口，适合本地学习和简单部署场景。

### 路由配置：地址对应哪个组件

路由配置通常放在 `src/router/index.ts` 中：

```ts
import { createRouter, createWebHashHistory } from 'vue-router';
```

其中：

- `createRouter()` 用于创建路由实例。
- `createWebHashHistory()` 用于创建哈希路由的历史记录模式。
- `routes` 是路由配置数组，每一项描述一个地址及其对应的处理方式。

例如：

```ts
const routes = [
    {
        path: '/accounts/:id',
        component: AccountDetail
    }
];
```

这里：

- `path` 表示匹配地址的规则。
- `:id` 表示动态路径参数。
- `component` 指定匹配后显示的 Vue 组件。

`/accounts/101` 和 `/accounts/102` 都能匹配 `/accounts/:id`，区别在于 `id` 参数分别为 101 和 102。

`component` 需要引用已经导入的组件对象，不能仅仅写一个随意的文件路径字符串就期待路由自动找到文件。

### RouterLink 与 RouterView

Vue Router 提供两个常用组件：

- `RouterLink`：用于声明导航目标，点击后切换路由。
- `RouterView`：用于显示当前路由匹配到的组件。

例如：

```vue
<RouterLink to="/accounts/101">
    查看账户 101
</RouterLink>

<RouterView />
```

点击 `RouterLink` 后，路由地址发生变化，Vue Router 根据配置找到匹配组件，并在 `RouterView` 所在的位置显示它。

只配置路由而没有提供 `RouterView`，就没有明确的页面显示位置。

### useRoute 与 useRouter：当前路由信息和导航操作

在页面组件中，可以通过组合式 API 获取路由相关对象：

```ts
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
```

它们的职责不同：

| API | 返回内容 | 主要用途 |
|---|---|---|
| `useRoute()` | 当前路由信息对象 | 读取当前路径、参数和查询参数 |
| `useRouter()` | 路由实例 | 执行页面跳转等导航操作 |

读取当前路径参数：

```ts
const route = useRoute();

console.log(route.params.id);
```

对于 `/accounts/101`，`route.params.id` 对应路径参数 `101`。

读取问号后的查询参数：

```text
/accounts/101?tab=detail
```

可以使用：

```ts
console.log(route.query.tab);
```

`params` 来自路径规则中的动态参数；`query` 来自 URL 问号后的查询参数。两者来源不同，不要混淆。

URL 中的参数首先是地址信息，不代表它已经通过业务校验。真实业务中，如果后端接口要求数字 ID，还需要按接口约定转换并验证。

### 使用 router.push() 进行跳转

如果不是通过点击 `RouterLink`，而是希望在脚本中根据业务操作跳转，可以使用 `router.push()`：

```ts
const router = useRouter();

function goToAccount(): void {
    router.push('/accounts/102');
}
```

`router.push()` 会发起一次导航，并把新的地址加入浏览器历史记录。用户通常可以通过浏览器后退按钮返回之前的页面。

这里要记住：

- `route`：查看当前路由是什么。
- `router`：执行路由跳转等操作。

### 完整程序：账户详情路由

文件一：`src/views/AccountDetail.vue`

```vue
<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

function goToAccount102(): void {
    router.push('/accounts/102');
}
</script>

<template>
    <h2>账户详情页面</h2>

    <p>当前账户 ID：{{ route.params.id }}</p>

    <button @click="goToAccount102">
        查看账户 102
    </button>
</template>
```

文件二：`src/router/index.ts`

```ts
import {
    createRouter,
    createWebHashHistory
} from 'vue-router';

import AccountDetail from '../views/AccountDetail.vue';

const router = createRouter({
    history: createWebHashHistory(),

    routes: [
        {
            path: '/',
            redirect: '/accounts/101'
        },
        {
            path: '/accounts/:id',
            component: AccountDetail
        }
    ]
});

export default router;
```

文件三：`src/App.vue`

```vue
<script setup lang="ts">
import {
    RouterLink,
    RouterView
} from 'vue-router';
</script>

<template>
    <h2>账户管理</h2>

    <nav>
        <RouterLink to="/accounts/101">
            账户 101
        </RouterLink>

        <span> | </span>

        <RouterLink to="/accounts/102">
            账户 102
        </RouterLink>
    </nav>

    <RouterView />
</template>
```

文件四：`src/main.ts`

```ts
import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';

import App from './App.vue';
import router from './router';

const app = createApp(App);

// 注册 Element Plus。
app.use(ElementPlus);

// 注册 Vue Router。
app.use(router);

app.mount('#app');
```

这里的 `main.ts` 是路由拓展示例使用的入口。实际替换时，应保留项目中原本需要的全局样式、插件和其他配置，不要因为照抄示例而删除项目已有的初始化代码。

运行后，访问根地址会重定向到 `/accounts/101`。点击“账户 102”，路由参数变成 102，详情组件显示新的 ID。

### 动态路由参数变化时，组件可能被复用

这里有一个容易忽略的地方。

从 `/accounts/101` 跳转到 `/accounts/102` 时，两条地址都匹配同一条路由记录：

```ts
{
    path: '/accounts/:id',
    component: AccountDetail
}
```

Vue Router 在这种情况下通常会复用当前组件实例，而不是先销毁旧实例再创建一个新实例。

因此，不能认为每次 `id` 变化都会重新执行 `onMounted()`。

如果详情页面需要在 ID 变化后重新查询数据，就应该观察路由参数：

```ts
watch(
    () => route.params.id,
    (newId) => {
        // 根据新的 ID 执行查询。
    },
    { immediate: true }
);
```

这里使用 getter 函数读取 `route.params.id`，让 Vue 能够追踪这个参数的变化。

`immediate: true` 表示侦听器注册后先执行一次，因此初次进入页面时也能处理当前 ID；之后 ID 变化时，再执行回调。

### 完整程序：观察路由参数变化

文件一：`src/views/AccountDetail.vue`

```vue
<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const observedId = ref('');

watch(
    () => route.params.id,
    (newId) => {
        // 动态路径参数通常是字符串。
        observedId.value = String(newId ?? '');
        console.log('当前账户 ID 变化：', newId);
    },
    { immediate: true }
);

onMounted(() => {
    console.log('账户详情组件完成挂载');
});
</script>

<template>
    <h2>账户详情</h2>

    <p>当前路由 ID：{{ route.params.id }}</p>
    <p>侦听记录的 ID：{{ observedId }}</p>
</template>
```

文件二：`src/router/index.ts`

```ts
import {
    createRouter,
    createWebHashHistory
} from 'vue-router';

import AccountDetail from '../views/AccountDetail.vue';

export default createRouter({
    history: createWebHashHistory(),

    routes: [
        {
            path: '/',
            redirect: '/accounts/101'
        },
        {
            path: '/accounts/:id',
            component: AccountDetail
        }
    ]
});
```

文件三：`src/App.vue`

```vue
<script setup lang="ts">
import {
    RouterLink,
    RouterView
} from 'vue-router';
</script>

<template>
    <h2>账户管理</h2>

    <RouterLink to="/accounts/101">
        账户 101
    </RouterLink>

    <span> | </span>

    <RouterLink to="/accounts/102">
        账户 102
    </RouterLink>

    <RouterView />
</template>
```

文件四：`src/main.ts`

```ts
import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';

import App from './App.vue';
import router from './router';

const app = createApp(App);

app.use(ElementPlus);
app.use(router);

app.mount('#app');
```

初次进入时，路由参数为 101。侦听器因为设置了 `immediate: true`，会立即执行一次，记录当前 ID。

点击“账户 102”后，路由参数变化，侦听器再次执行，页面显示 102。

在通常的同一路由组件复用场景下，组件不会重新挂载，所以控制台不会因为这次参数变化再次出现“账户详情组件完成挂载”。

这里的 `String(newId ?? '')` 只是为了将参数转换成便于展示的字符串，不等于完成业务 ID 的合法性检查。真实接口要求数字时，还需要按照接口协议进行转换和校验。

### hash 路由与 history 路由

Vue Router 常见的两种 Web 历史模式：

| 模式 | 创建方式 | 地址示例 | 部署注意事项 |
|---|---|---|---|
| Hash | `createWebHashHistory()` | `/#/accounts/101` | 通常不需要服务器为前端路径配置回退 |
| History | `createWebHistory()` | `/accounts/101` | 服务器需要把前端路由地址回退到应用入口 |

Hash 模式把路由信息放在 `#` 后面，服务器请求的仍然是同一个页面入口，因此本地练习通常比较方便。

History 模式的地址更简洁，但用户直接刷新 `/accounts/101` 时，服务器也会收到这个路径。部署环境必须正确配置回退规则，否则可能返回 404。

本课程使用 Hash 模式只是为了减少本地运行和部署配置，不代表所有企业项目都使用 Hash 模式。阅读已有项目时，应以它的实际路由配置为准。

## 当日复盘与练习

### 组件通信的整体关系

第三天最重要的不是记住某一个 API，而是理解不同组件之间应该怎样协作。

| 机制 | 谁提供信息 | 谁接收信息 | 典型用途 |
|---|---|---|---|
| Props | 父组件 | 子组件 | 传入账户名称、ID、状态等数据 |
| Emit | 子组件 | 父组件 | 报告选择、删除、提交等操作 |
| `v-model` | 父子双方按约定协作 | 父子双方按约定协作 | 输入值、开关状态等需要同步的模型 |
| Slot | 父组件提供模板内容 | 子组件提供插入位置 | 自定义标题、正文、操作区 |
| 作用域插槽 | 子组件提供数据 | 父组件模板接收数据 | 表格当前行、自定义数据展示 |

可以用下面的方式理解一次完整的账户选择流程：

1. 父组件保存账户数组。
2. 父组件通过 `v-for` 创建多个账户子组件。
3. 每个子组件通过 Props 接收自己的账户 ID 和名称。
4. 用户点击某个子组件的“选择”按钮。
5. 子组件通过 Emit 发送 `select` 事件和账户 ID。
6. 父组件接收事件，更新自己的选中 ID。
7. 父组件根据新状态更新页面，必要时再通过 Props 把新状态传给子组件。

这条链路中，**谁拥有业务状态，谁就负责修改业务状态；子组件通过事件报告用户操作，不应随意越过通信边界修改父组件数据。**

### 今天需要掌握的内容

完成第三天主线后，应当能够做到：

- 看懂 `.vue` 文件如何导入和使用其他组件。
- 区分组件定义与组件实例，理解同一组件的多个实例为什么拥有独立状态。
- 解释 `defineProps()` 的作用，区分静态属性和动态属性。
- 看懂必填属性、可选属性、默认值和布尔 Props。
- 解释为什么 Props 是单向数据流，以及为什么不应该直接修改父组件传入的对象。
- 使用 `defineEmits()` 声明事件，并让父组件接收事件参数。
- 解释 `v-model` 为什么由 Prop 和更新事件组成。
- 看懂 `modelValue`、`update:modelValue` 和 `defineModel()`。
- 区分默认插槽、具名插槽和作用域插槽。
- 解释 `onMounted()`、`onUpdated()` 和 `onUnmounted()` 的执行时机。
- 知道 `v-if` 与 `v-show` 对组件实例和生命周期的影响。
- 能够在组件卸载时清理定时器和窗口事件监听。

### 课后练习

> [!EXERCISE] 练习一：创建可复用的账户信息组件
>
> 创建 `AccountInfo.vue`，要求父组件传入账户编号、账户名称和账户余额，子组件负责显示。
>
> 要求：
>
> - 使用 TypeScript 声明 Props 类型。
> - 账户编号使用 `number`，名称使用 `string`，余额使用 `number`。
> - 父组件创建两个组件实例，分别显示不同账户。
>
> 【答案】
>
> `AccountInfo.vue`：
>
> ```vue
> <script setup lang="ts">
> interface Props {
>     id: number;
>     name: string;
>     balance: number;
> }
>
> const props = defineProps<Props>();
> </script>
>
> <template>
>     <div>
>         <p>账户编号：{{ props.id }}</p>
>         <p>账户名称：{{ props.name }}</p>
>         <p>账户余额：{{ props.balance }}</p>
>     </div>
> </template>
> ```
>
> 父组件：
>
> ```vue
> <script setup lang="ts">
> import AccountInfo from './components/AccountInfo.vue';
> </script>
>
> <template>
>     <AccountInfo :id="101" name="储蓄账户" :balance="3200" />
>     <AccountInfo :id="102" name="工资账户" :balance="8500" />
> </template>
> ```
>
> **解析：** 两个组件实例使用同一份组件定义，但 Props 不同，所以显示内容不同。

> [!EXERCISE] 练习二：子组件通知父组件选择账户
>
> 在练习一的基础上，为子组件增加“选择”按钮。
>
> 要求：
>
> - 子组件点击按钮时发出 `select` 事件。
> - 事件携带当前账户 ID。
> - 父组件接收 ID，并在页面中显示当前选中的账户编号。
>
> 【答案】
>
> 子组件增加：
>
> ```ts
> const emit = defineEmits<{
>     (event: 'select', id: number): void;
> }>();
>
> function selectAccount(): void {
>     emit('select', props.id);
> }
> ```
>
> 子组件模板增加：
>
> ```vue
> <button @click="selectAccount">选择</button>
> ```
>
> 父组件增加：
>
> ```ts
> const selectedId = ref<number | null>(null);
>
> function handleSelect(id: number): void {
>     selectedId.value = id;
> }
> ```
>
> 父组件使用：
>
> ```vue
> <AccountInfo
>     :id="101"
>     name="储蓄账户"
>     :balance="3200"
>     @select="handleSelect"
> />
> ```
>
> **解析：** 子组件只发送事件和账户 ID，父组件才负责修改 `selectedId`。如果子组件发出 `select`，父组件就必须监听同名事件。

> [!EXERCISE] 练习三：手动展开组件 v-model
>
> 父组件有一个 `name` 响应式变量，子组件接收姓名并在输入变化时通知父组件。
>
> 要求：不要直接使用 `v-model`，手动写出它对应的 Prop 和更新事件。
>
> 【答案】
>
> 父组件：
>
> ```vue
> <NameInput
>     :model-value="name"
>     @update:model-value="name = $event"
> />
> ```
>
> 子组件需要声明：
>
> ```ts
> const props = defineProps<{
>     modelValue: string;
> }>();
>
> const emit = defineEmits<{
>     (event: 'update:modelValue', value: string): void;
> }>();
> ```
>
> 输入框发生变化时：
>
> ```ts
> emit('update:modelValue', newValue);
> ```
>
> **解析：** 默认组件 `v-model` 由 `modelValue` Prop 和 `update:modelValue` 更新事件组成。只写向下传值，没有向上更新事件，就无法完成双向绑定。

> [!EXERCISE] 练习四：选择合适的插槽
>
> 某个账户面板需要固定的边框和布局，但父组件需要分别自定义标题、正文和底部操作按钮。应该使用 Props、Emit 还是插槽？
>
> 【答案】
>
> 应使用具名插槽。子组件提供 `header`、默认插槽和 `footer` 等位置，父组件通过 `#header`、`#default` 和 `#footer` 分别填入内容。
>
> **解析：** Props 主要传递数据，Emit 主要报告事件，插槽适合让父组件提供一段模板内容。

> [!EXERCISE] 练习五：判断生命周期
>
> 一个组件通过 `onMounted()` 创建定时器，通过 `onUnmounted()` 清理定时器。父组件使用 `v-if` 控制它的显示。
>
> 要求：解释组件隐藏、重新显示时分别发生什么。
>
> 【答案】
>
> `v-if` 变为假时，组件实例被卸载，执行 `onUnmounted()`，定时器被清理。再次显示时会创建新实例，重新执行 `setup` 和 `onMounted()`，定时器重新创建，组件内部状态重新初始化。
>
> **解析：** `v-if` 控制组件是否存在。若换成 `v-show`，组件实例仍然存在，隐藏时不会执行 `onUnmounted()`，定时器也不会自动停止。

> [!EXERCISE] 练习六：定位组件通信问题
>
> 父组件通过 Props 把账户 ID 传给子组件。子组件点击按钮后执行 `emit('select', props.id)`，但父页面没有更新。
>
> 请按照合理的排查顺序说明应该检查什么。
>
> 【答案】
>
> 1. 确认按钮点击事件是否执行。
> 2. 确认子组件是否执行 `emit()`。
> 3. 确认事件名称是否与父组件监听的名称一致。
> 4. 确认事件参数是否正确传出。
> 5. 确认父组件处理函数是否被调用。
> 6. 确认处理函数是否修改了真正用于页面展示的响应式状态。
>
> **解析：** 组件通信是一条完整链路，不能只检查子组件中的按钮。父组件是否监听正确、处理函数是否修改正确的数据，都可能导致页面没有更新。

### 学习资料

- [Vue 官方文档：组件基础](https://vuejs.org/guide/essentials/component-basics.html)
- [Vue 官方文档：Props](https://vuejs.org/guide/components/props.html)
- [Vue 官方文档：组件事件](https://vuejs.org/guide/components/events.html)
- [Vue 官方文档：组件 v-model](https://vuejs.org/guide/components/v-model.html)
- [Vue 官方文档：插槽](https://vuejs.org/guide/components/slots.html)
- [Vue 官方文档：生命周期](https://vuejs.org/guide/essentials/lifecycle.html)
- [Vue 官方文档：组合式函数](https://vuejs.org/guide/reusability/composables.html)
- [Vue Router 官方文档](https://router.vuejs.org/)
