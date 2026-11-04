---
date: 2026-11-01
tags: [Vue, TypeScript, Element Plus]
description: "掌握业务类型、响应式派生数据、表格分页与表单校验。"
draft: false
---

## 阅读与运行方法

第一天已经介绍了 Vue 页面、`ref()`、模板绑定、事件处理、条件渲染、列表渲染和 `v-model`。第二天不再从头重复这些内容，而是在它们的基础上解决企业页面中更常见的几个问题：

- 怎样描述账户、查询条件等业务数据的结构，避免字段写错、数据类型混乱。
- 当页面状态变多时，怎样选择 `ref()` 和 `reactive()`。
- 怎样根据已有状态得到筛选结果、统计数量，以及在数据变化后执行额外操作。
- 怎样使用 Element Plus 的表单、表格和分页组件组织真实业务页面。
- 怎样给表单配置校验规则，并在提交前确认校验结果。

**运行方式：** 使用第一天创建的练习工程，保留 `src/main.ts` 中注册 Element Plus 和引入样式的代码。每个标注为“完整程序”的示例，都可以整体替换 `src/App.vue` 运行。不同示例是独立程序，不要把多个 `<script setup>` 合并到同一个文件中。

如果页面中的 `el-input`、`el-table` 等标签无法识别，先检查第一天的 `src/main.ts` 是否已经执行了 `createApp(App).use(ElementPlus).mount('#app')`，而不是重新安装一遍依赖。

### 当天学习时间安排

| 学习内容 | 建议时间 | 学习重点 |
|---|---:|---|
| TypeScript 业务类型 | 20 分钟 | `interface`、数组类型、联合类型、可选属性和函数类型 |
| `ref()` 与 `reactive()` | 15 分钟 | 两种响应式状态的访问方式和适用场景 |
| `computed()` 与 `watch()` | 20 分钟 | 派生数据、缓存、数据变化后的额外操作 |
| Element Plus 查询表单 | 15 分钟 | `el-form`、`el-form-item`、输入框和选择器 |
| Element Plus 表格 | 15 分钟 | 表格数据、列配置和自定义单元格 |
| 分页与综合查询 | 20 分钟 | `slice()`、前端分页、筛选后重置页码 |
| 表单校验 | 15 分钟 | `rules`、`prop`、模板引用和异步校验 |
| **合计** | **120 分钟** | |

每个知识点后面的完整程序用于动手验证。可以先运行主线示例，再根据时间补充练习，不需要把所有示例一次性背下来。

## TypeScript：描述业务数据的结构

### 为什么企业项目需要类型

先看一个账户对象：

```ts
const account = {
    id: 101,
    name: '储蓄账户',
    balance: 3200
};

console.log(account.name);
```

这个对象有三个属性：`id`、`name` 和 `balance`。JavaScript 可以直接创建和使用它，不要求提前声明这些属性的类型。

但在企业项目中，一个账户对象可能会在很多地方使用：查询接口返回账户列表，表格读取账户姓名，详情区域读取账户余额，修改表单又需要读取账户编号。如果不同位置对同一份数据的理解不一致，就容易出现问题。

例如，接口返回的账户编号是数字，某个函数却把它当成字符串处理；或者对象中明明只有 `name`，代码却误写成 `nmae`。这类问题往往来自数据结构没有统一约定。

**TypeScript（TS）** 在 JavaScript 的基础上增加了静态类型检查。开发者可以提前描述变量、函数参数和对象应该是什么类型，编辑器和类型检查工具便能帮助发现不符合约定的代码。

需要区分两件事：

- **类型检查：** 检查代码中声明的数据类型和使用方式是否一致。
- **运行时数据校验：** 程序运行时检查真实数据是否符合要求。

TypeScript 的类型声明不会自动验证服务器实际返回的数据，也不会把字符串 `'3200'` 自动转换成数字 `3200`。它主要帮助我们在开发阶段发现代码中的类型问题。

还有一点需要注意：**开发服务器能够启动，不代表整个项目已经通过完整的 TypeScript 类型检查。** Vite 主要负责转换和提供开发服务，项目是否在启动时执行完整类型检查，取决于工程脚本和相关工具配置。因此，编辑器中的类型提示、项目配置的类型检查命令和浏览器能否运行，是需要分别判断的事情。

### `interface`：给业务对象定义结构

在 TypeScript 中，可以使用 `interface` 描述一个对象应该有哪些属性，以及每个属性分别是什么类型。

```ts
interface Account {
    id: number;
    name: string;
    balance: number;
}
```

这段代码定义了一个名为 `Account` 的接口。它规定：

- `id` 必须是数字。
- `name` 必须是字符串。
- `balance` 必须是数字。

这里的 `Account` 只是一个**类型描述**，并没有创建任何账户对象。真正创建对象仍然需要对象字面量：

```ts
const account: Account = {
    id: 101,
    name: '储蓄账户',
    balance: 3200
};
```

变量名后面的 `: Account` 表示：要求右侧创建出来的对象符合 `Account` 描述的结构。

如果遗漏 `balance`，或者把 `id` 写成字符串，类型检查就会提示不符合接口定义。

```ts
// 以下都是错误示意，不要同时取消注释运行。

// 错误一：id 要求 number，却传入 string。
// const account1: Account = {
//     id: '101',
//     name: '储蓄账户',
//     balance: 3200
// };

// 错误二：缺少接口要求的 balance。
// const account2: Account = {
//     id: 102,
//     name: '工资账户'
// };

// 错误三：属性名拼写错误。
// console.log(account.nmae);
```

可以把 `interface` 理解为一份数据结构说明书：它规定对象应该长什么样，但不会替你创建对象，也不会自动向服务器获取数据。

### 数组类型：`Account` 和 `Account[]` 不一样

一个账户对象和一组账户对象不是同一种数据。

```ts
const account: Account = {
    id: 101,
    name: '储蓄账户',
    balance: 3200
};

const accounts: Account[] = [
    account,
    {
        id: 102,
        name: '工资账户',
        balance: 8500
    }
];
```

`Account` 表示一条账户记录，`Account[]` 表示由多个 `Account` 对象组成的数组。

方括号 `[]` 表示数组类型。因此：

- `Account`：一个账户对象。
- `Account[]`：多个账户对象组成的数组。

即使查询结果只有一条记录，只要页面或函数需要的是账户列表，也应该传入数组，例如 `[account]`，而不是直接传入 `account`。

这一区别在企业项目中很重要。接口返回值、表格数据和列表状态通常都是数组，而详情区域通常使用单个对象。

### `type` 与联合类型：限制允许出现的值

`type` 可以给一个类型起别名。它除了可以描述对象，也经常用于定义联合类型。

例如，银行账户的状态只有两种：

```ts
type AccountStatus = 'normal' | 'frozen';
```

这里的 `AccountStatus` 表示：一个值只能是字符串 `'normal'` 或字符串 `'frozen'`。

竖线 `|` 在类型定义中表示“或者”。它不是 JavaScript 中用于逻辑判断的 `||`。

```ts
let status: AccountStatus = 'normal';

status = 'frozen'; // 正确

// status = 'closed'; // 错误：不属于 AccountStatus
```

如果只把状态声明为 `string`，那么 `'normal'`、`'frozen'`、`'closed'` 甚至拼写错误的 `'frezzed'` 都能通过字符串类型检查。使用联合类型，就能把业务允许的值明确限制下来。

查询条件又有一点不同：账户真实状态只有正常和冻结，但查询时还需要“全部”这个选项。因此可以再定义一个类型：

```ts
type AccountStatus = 'normal' | 'frozen';
type StatusFilter = AccountStatus | 'all';
```

`AccountStatus` 描述账户本身的状态，`StatusFilter` 描述查询条件允许选择的范围。**“全部”是查询条件，不是一种真实的账户状态。**

`interface` 和 `type` 都能描述对象结构。本课程主要用 `interface` 描述业务对象，用 `type` 描述联合类型。现阶段先掌握这种常见用法即可。

### 可选属性：属性不一定存在

有些业务字段并不是每条记录都具备。例如，账户备注可能为空，也可能没有这个字段。

```ts
interface AccountWithRemark {
    id: number;
    name: string;
    remark?: string;
}
```

属性名后的 `?` 表示该属性是可选的。下面两种对象都符合这个接口：

```ts
const accountA: AccountWithRemark = {
    id: 101,
    name: '储蓄账户',
    remark: '工资入账使用'
};

const accountB: AccountWithRemark = {
    id: 102,
    name: '备用账户'
};
```

`accountB` 没有 `remark`，并不违反接口约定。

读取可选属性时，需要考虑它不存在的情况。可以使用**可选链 `?.`**：

```ts
console.log(accountA.remark?.trim());
console.log(accountB.remark?.trim());
```

`trim()` 是字符串方法，用于去掉字符串开头和结尾的空白字符。`?.` 的作用是：如果左侧是 `null` 或 `undefined`，就停止本次属性访问，不再继续调用后面的 `trim()`，结果为 `undefined`。

注意两种问号的含义不同：

- `remark?: string`：定义接口时使用，表示这个属性可以不提供。
- `remark?.trim()`：读取数据时使用，表示左侧为空时不继续访问。

可选链适合处理确实允许缺失的数据。如果账户编号在业务上必须存在，就应该保证数据正确，而不是把所有属性都写成可选属性。

### 函数参数和返回值也可以声明类型

TypeScript 不仅可以描述变量和对象，也可以描述函数接收什么数据、返回什么结果。

```ts
function getAccountName(account: Account): string {
    return account.name;
}

function printAccountName(name: string): void {
    console.log(name);
}
```

这里有两个位置需要注意：

- `account: Account`：规定函数参数必须是一个符合 `Account` 结构的对象。
- `): string`：规定函数返回字符串。
- `): void`：表示函数不返回供调用者使用的结果。

再看一个常见的数组查询方法：

```ts
function findAccount(
    accounts: Account[],
    id: number
): Account | undefined {
    return accounts.find(item => item.id === id);
}
```

`find()` 是 JavaScript 数组方法，用于查找第一个满足条件的元素：

- 找到时，返回对应的账户对象。
- 没找到时，返回 `undefined`。

因此，返回类型写成 `Account | undefined`，而不能只写 `Account`。调用者必须考虑“没有找到”的情况：

```ts
const selected = findAccount(accounts, 999);

if (selected) {
    console.log(selected.name);
}
```

`if (selected)` 会先判断是否找到了对象。只有条件成立，才能继续读取 `selected.name`。

### 泛型：让类型可以作为参数传入

前面已经使用过 `Account[]`。但在 Vue 中，还会遇到这样的写法：

```ts
const rows = ref<Account[]>([]);
```

这里的 `<Account[]>` 不是 HTML 标签，也不是比较运算符，而是**泛型参数（Generic Type Parameter）**。

泛型可以先简单理解为：一个函数或类型可以接收另一个类型作为参数，从而明确自己内部保存或处理的数据类型。

`ref()` 可以保存数字、字符串、数组或对象。初始值明确时，TypeScript 往往能够推断类型；但空数组没有任何元素，无法仅凭初始值知道未来要保存什么。

所以：

```ts
const rows = ref<Account[]>([]);
```

表示 `rows` 是一个响应式引用，其内部的 `value` 保存 `Account` 数组。

同理：

```ts
const selected = ref<Account>();
```

表示创建一个用于保存 `Account` 的引用。由于没有提供初始值，`selected.value` 在赋值前可能是 `undefined`。

泛型会在后续的 `ref<FormInstance>()`、`FormRules<AccountFormModel>` 等代码中继续出现。看到尖括号时，先判断它是不是在给函数或类型传递类型参数。

### 完整程序：使用类型描述账户列表

文件：`src/App.vue`。本程序可以直接运行，不需要修改 `main.ts`。

```vue
<script setup lang="ts">
type AccountStatus = 'normal' | 'frozen';

interface Account {
    id: number;
    name: string;
    balance: number;
    status: AccountStatus;
    remark?: string;
}

// Account[] 表示账户对象数组。
const accounts: Account[] = [
    {
        id: 101,
        name: '储蓄账户',
        balance: 3200,
        status: 'normal',
        remark: '日常使用'
    },
    {
        id: 102,
        name: '工资账户',
        balance: 8500,
        status: 'frozen'
    }
];

// 参数必须是 Account，返回值必须是 string。
function getStatusText(status: AccountStatus): string {
    return status === 'normal' ? '正常' : '冻结';
}
</script>

<template>
    <div>
        <h2>账户列表</h2>

        <div v-for="account in accounts" :key="account.id">
            <p>账户编号：{{ account.id }}</p>
            <p>账户名称：{{ account.name }}</p>
            <p>账户余额：{{ account.balance }}</p>
            <p>账户状态：{{ getStatusText(account.status) }}</p>
            <p>账户备注：{{ account.remark?.trim() || '暂无备注' }}</p>
            <hr />
        </div>
    </div>
</template>
```

运行后会看到两条账户记录。第二条账户没有备注，模板通过可选链避免了对不存在属性调用 `trim()`，再通过 `||` 显示“暂无备注”。

可以尝试把第二条记录的 `status` 改成 `'closed'`，观察 TypeScript 的类型提示。再尝试把 `id` 改成字符串 `'102'`，观察字段类型检查。

这个例子把类型声明、数组、联合类型、可选属性和函数参数放在了一起。读企业项目时，遇到 `Account[]`、`AccountStatus` 这类写法，就可以按照今天的方式理解。

> [!EXERCISE] 判断类型是否匹配
>
> 已有 `interface Account { id: number; name: string }`，下面三种写法分别有什么问题？
>
> ```ts
> const a: Account = { id: 1, name: '张三' };
> const b: Account[] = { id: 2, name: '李四' };
> const c: Account = { id: '3', name: '王五' };
> ```
>
> 【答案】
>
> - `a` 正确，创建的是一个符合 Account 结构的对象。
> - `b` 错误，Account[] 要求数组，右侧却是单个对象。应写成 `[{ id: 2, name: '李四' }]`。
> - `c` 错误，`id` 要求 number，却传入了 string。应根据真实数据来源决定是否转换，不能只靠修改类型声明掩盖数据问题。

## `ref()` 与 `reactive()`：保存响应式状态

### 先回顾 `ref()`：脚本中通过 `.value` 访问

第一天已经介绍过 `ref()`。它会创建一个响应式引用，脚本中通过 `.value` 读取或修改其中的数据。

```ts
import { ref } from 'vue';

const balance = ref<number>(3200);

balance.value += 100;
```

`balance` 本身是一个 ref 对象，数字保存在 `balance.value` 中。

在 `<script setup>` 中，需要通过 `.value` 访问；在模板中，顶层 ref 会自动解包，因此可以直接写：

```vue
<template>
    <p>账户余额：{{ balance }}</p>
</template>
```

这里的模板自动解包是 Vue 为模板提供的便利，不代表脚本中的 `.value` 可以省略。

### `ref()` 也可以保存对象和数组

`ref()` 不仅能保存数字，也能保存对象、数组等数据。

```ts
import { ref } from 'vue';

const account = ref({
    id: 101,
    name: '储蓄账户',
    balance: 3200
});

// 修改对象内部的属性
account.value.balance = 3500;

// 整体替换对象
account.value = {
    id: 102,
    name: '工资账户',
    balance: 8500
};
```

这两种操作都可以触发相关视图更新。

第一种只修改对象中的一个属性；第二种直接把 `.value` 替换成一个新对象。

当页面需要整体替换一份数据时，`ref()` 很方便。例如，后端重新返回一份账户详情后，可以直接把新对象赋给 `account.value`。

保存数组时也一样：

```ts
const accounts = ref<Account[]>([]);
```

脚本中通过 `accounts.value` 访问数组，模板中可以直接使用 `accounts`。

### `reactive()`：直接把对象变成响应式对象

Vue 还提供了 `reactive()`。它接收一个对象，并返回这个对象的响应式代理（Proxy）。

```ts
import { reactive } from 'vue';

const form = reactive({
    name: '',
    accountNo: '',
    status: 'normal'
});

// 直接修改对象属性
form.name = '张三';
form.accountNo = '62220001';
form.status = 'frozen';
```

与 `ref()` 不同，`reactive()` 返回的对象本身就是响应式对象，不需要再通过 `.value` 访问。

因此：

```ts
form.name = '张三';       // 正确
// form.value.name = '张三'; // 错误
```

`reactive()` 经常用于表单，因为表单通常包含多个字段，逐个修改属性比较自然。

### `ref()` 和 `reactive()` 应该怎样选择

两者都能创建响应式数据，区别主要在于使用方式。

| 对比 | `ref()` | `reactive()` |
|---|---|---|
| 创建结果 | 一个 ref 引用对象 | 一个响应式代理对象 |
| 脚本访问 | 通过 `.value` | 直接访问属性 |
| 常见用途 | 基本类型、对象、数组、需要整体替换的状态 | 字段相对固定、经常逐个修改的对象 |
| 模板使用 | 顶层 ref 自动解包 | 直接读取属性 |

不要把它们理解成“数字必须用 ref、对象必须用 reactive”。`ref()` 同样可以保存对象，`reactive()` 也可以保存包含数字、字符串等属性的对象。

实际开发中，可以根据后续如何使用这份状态来选择：

- 如果经常需要整体替换对象或数组，使用 `ref()` 会更方便。
- 如果主要是逐个修改表单字段，使用 `reactive()` 会比较直观。

### 为什么 reactive 对象不能随意整体替换

看下面的代码：

```ts
let form = reactive({
    name: '张三'
});

form.name = '李四';
```

修改 `form.name` 是在修改原来的响应式代理，因此 Vue 能够追踪变化。

但如果重新给变量赋一个普通对象：

```ts
form = {
    name: '王五'
};
```

这并不是在修改原来的响应式代理，而是让变量 `form` 指向了另一个对象。原来依赖旧代理的响应式关系不会因为变量名相同就自动转移到新对象上。

所以，如果业务经常需要把整份对象替换成另一份对象，使用 `ref({ ... })` 通常更直接：

```ts
const form = ref({
    name: '张三'
});

form.value = {
    name: '王五'
};
```

### reactive 对象解构后，为什么可能拿到旧值

这是阅读 Vue 项目时很容易遇到的问题。

```ts
const form = reactive({
    name: '张三'
});

const { name } = form;
```

这行代码看起来像是把 `form.name` 单独取出来。但对于普通的 reactive 对象属性，解构得到的是当时读取到的值，不会自动变成一个持续跟随 `form.name` 的响应式引用。

例如：

```ts
form.name = '李四';
```

此时 `form.name` 已经变成李四，但之前解构得到的 `name` 仍然是张三。

原因在于：`const { name } = form` 执行时，JavaScript 读取了 `form.name`，然后把当时的字符串赋给局部变量 `name`。以后修改 `form.name`，不会重新执行这条解构语句。

初学阶段，直接使用 `form.name` 最容易理解，也最不容易丢失响应式关系。

### 完整程序：对比 ref、reactive 和解构

文件：`src/App.vue`。

```vue
<script setup lang="ts">
import { ref, reactive } from 'vue';

// ref 保存对象，脚本中通过 account.value 访问。
const account = ref({
    name: '储蓄账户'
});

// reactive 返回响应式代理，直接通过属性访问。
const form = reactive({
    name: '张三'
});

// 解构得到的是初始化时读取的字符串。
const { name } = form;

function updateData(): void {
    // 修改 ref 内部对象的属性。
    account.value.name = '工资账户';

    // 修改 reactive 对象的属性。
    form.name = '李四';
}
</script>

<template>
    <div>
        <p>ref 对象：{{ account.name }}</p>
        <p>reactive 对象：{{ form.name }}</p>
        <p>解构得到的 name：{{ name }}</p>

        <button @click="updateData">修改数据</button>
    </div>
</template>
```

初始页面显示：

- ref 对象：储蓄账户
- reactive 对象：张三
- 解构得到的 name：张三

点击按钮后，前两项分别变成工资账户和李四，第三项仍然是张三。

这个例子说明了两件事：`ref()` 和 `reactive()` 的脚本访问方式不同；普通 reactive 属性解构后，不会自动保留原属性的响应式联系。

> [!EXERCISE] 修复错误的访问方式
>
> 已有下面两份状态：
>
> ```ts
> const form = reactive({ name: '' });
> const account = ref({ name: '' });
> ```
>
> 下面两行分别有什么问题？
>
> ```ts
> form.value.name = '张三';
> account.name = '储蓄账户';
> ```
>
> 【答案】
>
> - `form` 是 `reactive()` 返回的代理对象，应写成 `form.name = '张三'`。
> - `account` 是 `ref()` 返回的引用对象，脚本中应写成 `account.value.name = '储蓄账户'`。

## `computed()`：根据已有状态计算结果

### 为什么需要计算属性

假设账户列表中有 10 条记录，其中 6 条状态正常。页面需要同时展示：

- 全部账户列表。
- 正常账户列表。
- 正常账户数量。

正常账户列表和正常账户数量都可以从原始账户数组中计算出来。

如果把这三个结果分别保存成三份独立状态，那么每次账户状态发生变化，都要记得同步修改另外两份数据。只要漏掉其中一步，页面就会出现数据不一致。

Vue 提供了 `computed()`，专门用于根据已有的响应式数据计算出一个结果。

```ts
import { ref, computed } from 'vue';

const balance = ref(3200);

const doubledBalance = computed(() => {
    return balance.value * 2;
});
```

这里的 `computed()` 接收一个函数，这个函数负责计算结果。函数中读取了 `balance.value`，所以 Vue 能够知道计算结果依赖 `balance`。

当 `balance` 发生变化后，`doubledBalance` 的结果也会随之更新。

### computed 的返回值与 `.value`

`computed()` 返回的也是一个响应式引用，因此在脚本中读取结果时需要使用 `.value`：

```ts
const doubledBalance = computed(() => balance.value * 2);

console.log(doubledBalance.value);
```

在模板中，顶层 computed ref 同样会自动解包：

```vue
<template>
    <p>余额的两倍：{{ doubledBalance }}</p>
</template>
```

注意：计算属性是根据已有数据得到的结果，不是另一份需要手动维护的数据。默认情况下，使用 getter 创建的计算属性是只读的，不应该通过 `doubledBalance.value = 100` 修改它。

### filter()：根据条件保留数组中的元素

账户筛选会用到 JavaScript 的数组方法 `filter()`。它会依次检查数组中的每个元素，并根据回调函数返回的布尔值决定是否保留该元素：

```ts
const numbers = [10, 20, 30, 40];

const largeNumbers = numbers.filter(number => number >= 30);
// 结果：[30, 40]
```

回调返回 `true`，当前元素就会进入新数组；返回 `false`，当前元素就不会进入结果。`filter()` 返回一个新数组，不会删除或修改原数组中的元素。

在账户页面中，`filter()` 就是用来从全部账户中挑出符合状态、姓名等条件的记录。

### computed 的 getter 为什么需要 return

下面两种写法都可以：

```ts
const totalA = computed(() => balance.value * 2);

const totalB = computed(() => {
    return balance.value * 2;
});
```

第一种使用箭头函数的表达式函数体，会自动返回表达式结果。

第二种使用花括号包围函数体，因此需要显式写 `return`。

如果漏掉 `return`：

```ts
const total = computed(() => {
    balance.value * 2;
});
```

函数执行了乘法，但没有把结果返回出去，计算属性得到的就是 `undefined`。

### computed 会缓存计算结果

计算属性还有一个重要特点：**它会根据响应式依赖进行缓存。**

例如：

```ts
const total = computed(() => {
    console.log('重新计算');
    return price.value * count.value;
});
```

这里的计算结果依赖 `price` 和 `count`。

- 当 `price` 和 `count` 都没有变化时，多次读取 `total.value` 会复用缓存结果。
- 当 `price` 或 `count` 发生变化时，计算属性的缓存失效；下一次读取时会重新执行 getter。

这里的“缓存”不是永久保存旧值，也不是每次组件更新都重新计算。Vue 会根据 getter 实际读取的响应式依赖判断是否需要重新计算。

### computed 应该只负责计算，不要顺便修改其他状态

计算属性的职责是根据已有数据得到结果。例如，根据账户列表计算正常账户数量。

不建议在 getter 中修改其他状态、提交表单或发送请求。否则，读取一个计算结果时还会产生额外操作，程序执行顺序会变得难以判断。

需要在数据变化后执行额外操作时，应该考虑 `watch()`，下一节会介绍。

### 完整程序：计算正常账户列表和数量

文件：`src/App.vue`。

```vue
<script setup lang="ts">
import { ref, computed } from 'vue';

type AccountStatus = 'normal' | 'frozen';

interface Account {
    id: number;
    name: string;
    status: AccountStatus;
}

// 原始账户数据。
const accounts = ref<Account[]>([
    { id: 1, name: '储蓄账户', status: 'normal' },
    { id: 2, name: '工资账户', status: 'frozen' },
    { id: 3, name: '理财账户', status: 'normal' }
]);

// 根据原始数据筛选正常账户。
const normalAccounts = computed(() => {
    return accounts.value.filter(account => account.status === 'normal');
});

// 根据筛选结果计算数量。
const normalCount = computed(() => {
    return normalAccounts.value.length;
});

// 把第一个账户冻结，观察计算结果是否变化。
function freezeFirst(): void {
    const firstAccount = accounts.value[0];

    if (firstAccount) {
        firstAccount.status = 'frozen';
    }
}
</script>

<template>
    <div>
        <h2>正常账户</h2>

        <p>正常账户数量：{{ normalCount }}</p>

        <ul>
            <li
                v-for="account in normalAccounts"
                :key="account.id"
            >
                {{ account.name }}
            </li>
        </ul>

        <button @click="freezeFirst">冻结第一个账户</button>
    </div>
</template>
```

初始有两个正常账户。点击“冻结第一个账户”后，原始数组中的第一个账户状态发生变化，`normalAccounts` 的依赖随之变化，重新读取时只会得到一个正常账户，`normalCount` 也变成 1。

这里没有手动执行 `normalCount.value = 1`。数量始终由正常账户列表计算得到，这正是计算属性的用途。

### computed 与普通函数有什么区别

两者都可以根据数据计算结果，但使用场景不同。

```ts
function getNormalCount(): number {
    return accounts.value.filter(
        account => account.status === 'normal'
    ).length;
}

const normalCount = computed(() => {
    return accounts.value.filter(
        account => account.status === 'normal'
    ).length;
});
```

普通函数每次被调用都会执行函数体。计算属性则会根据响应式依赖缓存结果。

如果只是执行一次独立计算，普通函数完全可以胜任；如果需要把某个计算结果作为响应式数据持续提供给模板或其他计算属性，`computed()` 更合适。

## `watch()`：数据变化后执行额外操作

### watch 和 computed 解决的问题不同

上一节的 `computed()` 解决的是：**根据已有状态，得到一个计算结果。**

例如：

- 根据账户列表计算正常账户数量。
- 根据输入的关键词计算筛选结果。
- 根据单价和数量计算金额。

但有些场景并不是要得到一个计算结果，而是希望某个数据发生变化后，执行额外操作。

例如：

- 查询条件变化后，记录一条变化日志。
- 搜索关键词变化后，发起新的查询。
- 某个业务状态变化后，重置与它关联的页码。

这种场景可以使用 `watch()`。

### watch 的基本语法

```ts
watch(
    source,
    (newValue, oldValue) => {
        // 数据变化后执行的操作
    },
    options
);
```

三个部分分别表示：

- `source`：指定要观察的数据。
- 回调函数：数据发生变化后执行。
- `options`：可选配置，用来调整侦听行为。

回调函数中的 `newValue` 表示新值，`oldValue` 表示上一次观察到的值。

默认情况下，注册 `watch()` 时不会立即执行回调。只有被观察的数据发生变化后，回调才会执行。

### 观察 ref 数据

如果观察的是一个 `ref`，可以直接把它传给 `watch()`：

```ts
const keyword = ref('');

watch(keyword, (newValue, oldValue) => {
    console.log('旧关键词：', oldValue);
    console.log('新关键词：', newValue);
});
```

当 `keyword.value` 发生变化时，回调会收到新旧两个值。

### 观察 reactive 对象中的某个属性

如果要观察的是 `reactive` 对象中的某个属性，需要传入一个 getter 函数：

```ts
const form = reactive({
    name: '张三'
});

watch(
    () => form.name,
    (newValue, oldValue) => {
        console.log(oldValue, newValue);
    }
);
```

`() => form.name` 是一个箭头函数，它的作用是告诉 Vue：每次需要检查这个数据源时，都通过这段读取逻辑取得 `form.name`。

不要写成：

```ts
// 错误示意：这里传入的是当前读到的字符串。
// watch(form.name, callback);
```

`form.name` 在传入时只是一个字符串，并没有告诉 `watch()` 以后应该重新读取哪个属性。

### immediate：注册时立即执行一次

`watch()` 默认只在后续变化时执行回调。如果希望注册时就执行一次，可以设置 `immediate: true`：

```ts
watch(
    keyword,
    (newValue, oldValue) => {
        console.log(newValue, oldValue);
    },
    { immediate: true }
);
```

启用 `immediate` 后，回调会在侦听器注册时立即执行一次。由于这是第一次执行，没有之前的变化记录，因此不能假定第一次回调的 `oldValue` 一定是普通字符串。

`immediate` 只是控制侦听器是否立即执行，不代表组件重新创建或页面重新挂载。

### 观察整个 reactive 对象时需要注意什么

直接观察一个 `reactive` 对象时，Vue 会对它进行深层侦听：

```ts
const form = reactive({
    name: '张三',
    address: {
        city: '北京'
    }
});

watch(form, () => {
    console.log('表单对象发生变化');
});
```

这意味着对象内部的嵌套属性发生变化，也可以触发侦听回调。

但直接侦听整个对象时，嵌套属性变化前后的 `newValue` 和 `oldValue` 可能指向同一个响应式对象，并不代表 Vue 自动保存了一份修改前的深拷贝。

如果只关心姓名变化，优先使用：

```ts
watch(() => form.name, callback);
```

这样观察范围更明确，也更容易理解。

### 完整程序：记录客户姓名的变化

文件：`src/App.vue`。

```vue
<script setup lang="ts">
import { reactive, ref, watch } from 'vue';

const form = reactive({
    name: '张三'
});

const message = ref('尚未修改');

// 只观察 form.name 这个属性。
watch(
    () => form.name,
    (newValue, oldValue) => {
        message.value = `姓名从“${oldValue}”变为“${newValue}”`;
    }
);

function changeName(): void {
    form.name = '李四';
}
</script>

<template>
    <div>
        <p>当前姓名：{{ form.name }}</p>
        <p>变化记录：{{ message }}</p>

        <button @click="changeName">修改姓名</button>
    </div>
</template>
```

初始时，页面显示“当前姓名：张三”和“尚未修改”。

点击按钮后，`form.name` 变成李四，`watch()` 的回调执行，`message` 更新为“姓名从张三变为李四”。

这里 `watch()` 没有负责计算姓名，也没有负责显示输入框。它只是在观察到数据变化后执行一项额外操作。

### computed 与 watch 的选择

| 需求 | 使用方式 | 原因 |
|---|---|---|
| 根据账户列表计算正常账户数量 | `computed()` | 从已有状态得到结果 |
| 根据查询条件筛选账户 | `computed()` | 筛选结果由现有状态决定 |
| 根据单价和数量计算总金额 | `computed()` | 属于派生数据 |
| 姓名变化时记录日志 | `watch()` | 数据变化后执行额外操作 |
| 搜索条件变化后发起请求 | `watch()` | 需要执行异步副作用 |
| 表单提交时执行校验 | 事件函数 | 由用户操作决定执行时机 |

记住一个判断方法：

**如果问题是“根据当前数据，结果应该是多少”，优先考虑 computed；如果问题是“数据变化之后，我还要额外做什么”，再考虑 watch。**

> [!EXERCISE] 选择合适的 API
>
> 下面两个需求分别应该使用 `computed()` 还是 `watch()`？
>
> 1. 页面需要实时显示当前正常账户的数量。
> 2. 用户修改客户姓名后，需要在页面上记录修改前后的姓名。
>
> 【答案】
>
> 1. 使用 `computed()`。正常账户数量是从账户列表中计算得到的结果。
> 2. 使用 `watch()`。记录修改前后的姓名属于数据变化后执行的额外操作。

## Element Plus 查询表单：把控件和业务数据连接起来

### el-form：组织一组表单字段

在企业项目中，查询页面通常包含多个输入项。例如，账户查询页面可能需要输入客户姓名、账户编号，并选择账户状态。

Element Plus 提供了 `el-form` 组件，用于组织一组表单字段。

```vue
<el-form :model="query">
    <el-form-item label="客户姓名">
        <el-input v-model="query.name" />
    </el-form-item>
</el-form>
```

这里有三个组件：

- `el-form`：表单容器，负责组织整组表单数据。
- `el-form-item`：单个表单项，负责显示字段标签，并为校验提示提供位置。
- `el-input`：输入框组件，用于接收用户输入。

`:model="query"` 把脚本中的 `query` 对象传给表单组件。这里使用冒号，是因为 `model` 需要接收一个 JavaScript 对象，而不是名为 `query` 的普通字符串。

但要注意：**给 el-form 设置 model，并不会自动把内部所有输入框绑定到对象属性。** 输入框仍然需要通过 `v-model` 指定自己对应的数据字段。

### label 和 prop：显示名称与字段路径不是一回事

`el-form-item` 常见的两个属性是 `label` 和 `prop`。

```vue
<el-form-item label="客户姓名" prop="name">
    <el-input v-model="query.name" />
</el-form-item>
```

- `label="客户姓名"`：页面上显示给用户看的文字。
- `prop="name"`：指出当前表单项对应 `query` 对象中的 `name` 字段。

`label` 可以改成“姓名”“客户名称”等文字，不影响脚本中的数据字段。

`label-width` 可以设置标签区域的宽度，例如 `label-width="100px"`。它只影响表单布局，不会改变数据字段。

`prop` 则需要与实际字段对应。后面配置表单校验时，Element Plus 会根据这个字段名找到对应的规则。

### el-input：输入框组件

`el-input` 是 Element Plus 提供的输入框组件。它的基本使用方式与原生 HTML 输入框相似，但提供了统一的外观和组件属性。

```vue
<el-input
    v-model="query.name"
    placeholder="请输入客户姓名"
/>
```

`v-model` 将输入框与 `query.name` 连接起来：

- 用户输入时，`query.name` 更新。
- `query.name` 发生变化时，输入框显示内容也会同步更新。

`placeholder` 是输入框为空时显示的提示文字，不是实际提交的数据。

综合查询示例中还会用到 `clearable`，它会在输入框中显示清空按钮，方便用户快速删除当前输入；它不会改变查询函数的执行时机。

### el-select 和 el-option：选择器与候选项

如果用户需要从固定选项中选择账户状态，可以使用 `el-select`。

```vue
<el-select v-model="query.status">
    <el-option label="全部" value="all" />
    <el-option label="正常" value="normal" />
    <el-option label="冻结" value="frozen" />
</el-select>
```

`el-select` 是选择器，`el-option` 是选择器中的候选项。

每个选项有两个重要属性：

- `label`：显示给用户看的文字。
- `value`：用户选中后，实际写入 `v-model` 对应变量的值。

例如，用户选择“冻结”后：

```ts
query.status === 'frozen';
```

程序拿到的是字符串 `'frozen'`，而不是页面上显示的“冻结”。

如果希望选项的值是数字或布尔值，需要使用动态绑定：

```vue
<el-option label="启用" :value="true" />
<el-option label="停用" :value="false" />
```

`:value="true"` 中的冒号表示把 JavaScript 布尔值传给组件；如果写成 `value="true"`，传入的则是字符串 `"true"`。

### 查询按钮不会因为 v-model 而自动执行查询

输入框和查询函数是两个不同的环节。

`v-model` 只负责同步数据，并不会自动调用查询函数。什么时候真正使用这些查询条件，需要由按钮事件决定。

例如：

```ts
function handleQuery(): void {
    console.log(query.name);
    console.log(query.status);
}
```

模板中通过 `@click` 绑定：

```vue
<el-button type="primary" @click="handleQuery">
    查询
</el-button>
```

用户输入内容时，查询条件发生变化；只有点击查询按钮，`handleQuery()` 才会执行。

`el-button` 的 `type="primary"` 只设置按钮的主要视觉样式，不会改变点击事件或查询逻辑。

### 完整程序：一个简单的账户查询表单

文件：`src/App.vue`。

```vue
<script setup lang="ts">
import { reactive, ref } from 'vue';

type StatusFilter = 'all' | 'normal' | 'frozen';

// 查询条件的数据结构。
interface AccountQuery {
    name: string;
    status: StatusFilter;
}

// 保存用户正在输入的查询条件。
const query = reactive<AccountQuery>({
    name: '',
    status: 'all'
});

// 保存点击查询后生成的提示。
const result = ref('尚未查询');

function handleQuery(): void {
    const statusText =
        query.status === 'all' ? '全部状态' :
        query.status === 'normal' ? '正常账户' : '冻结账户';

    result.value =
        `客户姓名：${query.name.trim() || '未填写'}；查询范围：${statusText}`;
}

function handleReset(): void {
    query.name = '';
    query.status = 'all';
    result.value = '查询条件已重置';
}
</script>

<template>
    <div>
        <h2>账户查询</h2>

        <el-form :model="query" label-width="100px">
            <el-form-item label="客户姓名">
                <el-input
                    v-model="query.name"
                    placeholder="请输入客户姓名"
                />
            </el-form-item>

            <el-form-item label="账户状态">
                <el-select v-model="query.status">
                    <el-option label="全部" value="all" />
                    <el-option label="正常" value="normal" />
                    <el-option label="冻结" value="frozen" />
                </el-select>
            </el-form-item>
        </el-form>

        <el-button type="primary" @click="handleQuery">
            查询
        </el-button>

        <el-button @click="handleReset">
            重置
        </el-button>

        <p>当前输入：{{ query.name }} / {{ query.status }}</p>
        <p>{{ result }}</p>
    </div>
</template>
```

这里的 `reactive<AccountQuery>()` 使用了泛型参数，告诉 TypeScript：这个响应式对象应当符合 `AccountQuery` 的结构。这样 `query.name` 就是字符串，`query.status` 就只能是 `StatusFilter` 允许的值。

输入姓名并选择状态后，“当前输入”会立即变化；点击查询按钮后，`handleQuery()` 才会读取查询条件并更新结果。点击重置则会清空姓名，并把状态恢复为“全部”。

## Element Plus 表格：把数组数据显示成行和列

### el-table：表格的数据来源

在企业项目中，查询结果通常需要展示在表格中。Element Plus 提供了 `el-table` 组件。

```vue
<el-table :data="accounts">
    <el-table-column prop="name" label="账户名称" />
</el-table>
```

`el-table` 的 `data` 属性接收数组。数组中每个对象对应表格中的一行。

`el-table-column` 用于配置表格中的一列：

- `prop`：指定当前列读取每条记录的哪个字段。
- `label`：设置表头显示的文字。

例如，`prop="name"` 表示每一行读取当前账户对象的 `name` 属性；`label="账户名称"` 表示表格顶部显示“账户名称”。

注意：`prop` 指向的是每条记录内部的字段，不是脚本中的某个顶层变量。

### row-key：告诉表格每一行的唯一标识

```vue
<el-table :data="accounts" row-key="id">
```

`row-key="id"` 表示使用每条记录的 `id` 字段作为行的唯一标识。

假设有三条账户记录：

```ts
[
    { id: 101, name: '储蓄账户' },
    { id: 102, name: '工资账户' },
    { id: 103, name: '理财账户' }
]
```

表格就会分别使用 101、102、103 识别这些行。

行标识与数组下标不是一回事。数组下标会因为排序、筛选和分页而变化，业务 ID 则用于识别记录本身。使用稳定的 ID 更适合企业业务数据。

### 自定义列：为什么要使用插槽

如果一列只需要显示对象中的普通字段，使用 `prop` 就够了。

但有些列需要特殊展示。例如，账户状态在数据中保存的是 `'normal'` 或 `'frozen'`，页面希望显示成“正常”或“冻结”；又或者操作列中需要放置按钮。

这时可以使用**插槽（Slot）**。

插槽可以理解为组件预留出来的内容位置：组件负责提供表格结构，开发者负责填入这一格具体应该显示什么。

```vue
<el-table-column label="账户状态">
    <template #default="scope">
        {{ scope.row.status === 'normal' ? '正常' : '冻结' }}
    </template>
</el-table-column>
```

这里有几个新写法：

- `<template>`：Vue 模板中的逻辑容器，不会像普通 `div` 一样额外生成页面元素。
- `#default`：`v-slot:default` 的简写，表示填入组件的默认插槽。
- `scope`：接收插槽传入数据的局部变量名，可以自行命名。
- `scope.row`：Element Plus 传入的当前行数据对象。

所以，当表格正在渲染第二行时，`scope.row` 就是第二条账户记录。通过 `scope.row.status`，就能读取当前行的账户状态。

### 完整程序：展示账户信息和自定义状态列

文件：`src/App.vue`。

```vue
<script setup lang="ts">
type AccountStatus = 'normal' | 'frozen';

interface Account {
    id: number;
    name: string;
    balance: number;
    status: AccountStatus;
}

const accounts: Account[] = [
    {
        id: 101,
        name: '储蓄账户',
        balance: 3200,
        status: 'normal'
    },
    {
        id: 102,
        name: '工资账户',
        balance: 8500,
        status: 'frozen'
    },
    {
        id: 103,
        name: '理财账户',
        balance: 12000,
        status: 'normal'
    }
];
</script>

<template>
    <div>
        <h2>账户信息</h2>

        <el-table
            :data="accounts"
            row-key="id"
            border
            stripe
        >
            <el-table-column
                prop="id"
                label="账户编号"
            />

            <el-table-column
                prop="name"
                label="账户名称"
            />

            <el-table-column
                prop="balance"
                label="账户余额"
            />

            <el-table-column label="账户状态">
                <template #default="scope">
                    {{ scope.row.status === 'normal' ? '正常' : '冻结' }}
                </template>
            </el-table-column>
        </el-table>
    </div>
</template>
```

`border` 用于显示表格边框，`stripe` 用于显示交替行底色。它们只影响表格外观，不会改变账户数据。

前三列直接通过 `prop` 读取字段，最后一列使用默认插槽，把英文状态转换成中文文字。

阅读企业项目中的表格时，可以按这个顺序看：

1. 先找 `el-table` 的 `:data`，确认表格数据从哪里来。
2. 再看每个 `el-table-column` 的 `prop`，确认普通列读取哪个字段。
3. 如果列中没有 `prop`，而是出现 `template #default`，就继续查看插槽中的自定义展示逻辑。

## 分页：理解当前页的数据从哪里来

### slice()：从数组中截取一段数据

前端分页的核心并不复杂：假设已经拿到全部查询结果，只需要根据当前页码和每页条数，从数组中取出对应的一部分。

JavaScript 的 `slice()` 方法可以完成这个操作。

```ts
const accounts = ['账户 A', '账户 B', '账户 C', '账户 D', '账户 E'];

const firstPage = accounts.slice(0, 2);
const secondPage = accounts.slice(2, 4);
```

`slice(start, end)` 表示从数组的 `start` 下标开始截取，到 `end` 下标之前结束。

需要注意：**start 对应的元素会被包含，end 对应的元素不会被包含。**

所以：

- `slice(0, 2)` 得到下标 0、1 的元素。
- `slice(2, 4)` 得到下标 2、3 的元素。

`slice()` 不会修改原数组，而是返回一个新的数组。

### 当前页和每页条数怎样换算成数组下标

假设每页显示 10 条记录：

- 第 1 页：从下标 0 开始。
- 第 2 页：从下标 10 开始。
- 第 3 页：从下标 20 开始。

因此，当前页的起始下标可以使用下面的公式计算：

```ts
const start = (currentPage - 1) * pageSize;
```

这里：

- `currentPage`：当前页码，从 1 开始。
- `pageSize`：每页显示的记录数量。
- `start`：当前页在数组中的起始下标，从 0 开始。

结束位置是：

```ts
const end = start + pageSize;
```

最终得到当前页数据：

```ts
const pageRows = accounts.slice(start, end);
```

例如当前页是第 2 页，每页 10 条：

```ts
const start = (2 - 1) * 10; // 10
const end = 10 + 10;        // 20
```

因此，第二页取数组下标 10 到 19 的记录。

### el-pagination：分页控件

Element Plus 提供了 `el-pagination` 组件，用来显示页码和分页操作。

```vue
<el-pagination
    v-model:current-page="currentPage"
    :page-size="pageSize"
    :total="total"
    layout="prev, pager, next"
/>
```

常见属性如下：

| 属性 | 含义 |
|---|---|
| `current-page` | 当前页码 |
| `page-size` | 每页显示多少条记录 |
| `total` | 全部符合条件的记录总数 |
| `layout` | 分页区域中显示哪些控件 |

`v-model:current-page` 是 Vue 的命名双向绑定写法。它表示把分页组件的当前页码与脚本中的 `currentPage` 连接起来：用户点击其他页码时，`currentPage` 会同步更新。

`page-size` 和 `total` 前面的冒号表示传入脚本中的变量值，而不是普通字符串。

**分页控件负责让用户切换页码，但它不会自动替你对数组执行 `slice()`。** 仍然需要自己根据当前页码计算 `pageRows`，再把 `pageRows` 传给表格。

### total 为什么不能写成当前页数组的长度

假设全部符合条件的账户有 25 条，每页显示 10 条。

第一页的 `pageRows.length` 是 10，但全部符合条件的记录总数是 25。

如果把 `total` 写成 `pageRows.length`，分页组件只会认为总记录数是 10，无法正确展示全部页码。

所以：

```vue
<el-pagination
    :total="filteredAccounts.length"
    :page-size="pageSize"
/>
```

这里的 `total` 应该是筛选后、分页前的记录总数，而不是当前页数组的长度。

### 前端分页和后端分页有什么区别

这两种分页方式看起来都能显示页码，但数据处理的位置不同。

**前端分页：**

1. 一次性取得全部符合条件的记录。
2. 前端根据当前页码计算起始下标。
3. 使用 `slice()` 截取当前页数据。
4. 将截取结果传给表格。

**后端分页：**

1. 前端把当前页码、每页条数和查询条件发送给后端。
2. 后端根据这些条件查询数据库。
3. 后端只返回当前页记录，同时返回符合条件的总记录数。
4. 前端直接把后端返回的当前页记录传给表格，不再对当前页数组进行全量分页截取。

例如，后端已经返回了第二页的 10 条记录，这 10 条记录本身就是第二页的数据。如果前端再对它们执行 `slice(10, 20)`，得到的就会是空数组。

阅读企业项目时，首先要判断分页由前端还是后端负责，再判断表格 `:data` 绑定的到底是全部数据还是当前页数据。

### 完整程序：一个独立的前端分页示例

文件：`src/App.vue`。

```vue
<script setup lang="ts">
import { ref, computed } from 'vue';

const accounts = [
    { id: 1, name: '账户 A' },
    { id: 2, name: '账户 B' },
    { id: 3, name: '账户 C' },
    { id: 4, name: '账户 D' },
    { id: 5, name: '账户 E' }
];

// 当前页码从 1 开始。
const currentPage = ref(1);

// 每页固定显示两条。
const pageSize = 2;

// 根据当前页码计算当前页数据。
const pageRows = computed(() => {
    const start = (currentPage.value - 1) * pageSize;
    const end = start + pageSize;

    return accounts.slice(start, end);
});
</script>

<template>
    <div>
        <p>当前页：{{ currentPage }}</p>
        <p>全部记录：{{ accounts.length }} 条</p>

        <el-table
            :data="pageRows"
            row-key="id"
            border
        >
            <el-table-column prop="id" label="编号" />
            <el-table-column prop="name" label="账户名称" />
        </el-table>

        <el-pagination
            v-model:current-page="currentPage"
            :page-size="pageSize"
            :total="accounts.length"
            layout="prev, pager, next"
        />
    </div>
</template>
```

本例有 5 条记录，每页显示 2 条，因此一共有 3 页。

| 当前页 | start | end | 实际取得的下标 |
|---|---:|---:|---|
| 第 1 页 | 0 | 2 | 0、1 |
| 第 2 页 | 2 | 4 | 2、3 |
| 第 3 页 | 4 | 6 | 4 |

第三页的 `end` 是 6，但数组只有 5 个元素。`slice()` 会截取到数组实际存在的末尾，不会因为结束下标超过数组长度而报错。

点击分页控件时，`currentPage` 发生变化，`pageRows` 重新计算，表格就会显示对应的记录。

## 综合程序：账户查询、表格和前端分页

前面分别学习了查询表单、表格和分页。现在把它们组合成一个完整的账户查询页面。

这个页面包含：

- 按账户名称查询。
- 按账户状态筛选。
- 点击查询后才应用查询条件。
- 表格显示筛选后的账户。
- 分页显示当前页数据。
- 查询条件变化后，将当前页重置为第一页。

### 为什么要区分 query 和 appliedQuery

有些页面要求用户输入查询条件后，点击“查询”按钮才更新结果。

如果计算属性直接读取输入框绑定的 `query`，那么用户每输入一个字符，表格就会立刻变化。这种行为叫作即时筛选。

如果产品要求点击查询按钮才执行筛选，就需要分别保存两份数据：

- `query`：用户正在编辑的查询条件。
- `appliedQuery`：上一次点击查询按钮时正式应用的查询条件。

点击查询时，把 `query` 的值复制到 `appliedQuery`，计算属性根据 `appliedQuery` 筛选。

本例还会用到字符串方法 `includes()`。`account.name.includes(keyword)` 用来判断账户名称中是否包含指定关键词，返回布尔值；它区分大小写。当关键词是空字符串时，结果为 `true`，所以没有填写姓名条件时不会排除任何账户。

```ts
function handleQuery(): void {
    appliedQuery.name = query.name.trim();
    appliedQuery.status = query.status;
    currentPage.value = 1;
}
```

这里还把当前页重置为 1。原因是筛选结果可能变少，如果仍停留在原来的第 3 页，就可能出现当前页没有数据的情况。

### 完整程序：账户查询与前端分页

文件：`src/App.vue`。可以直接替换运行。

```vue
<script setup lang="ts">
import { ref, reactive, computed } from 'vue';

type AccountStatus = 'normal' | 'frozen';
type StatusFilter = 'all' | AccountStatus;

interface Account {
    id: number;
    name: string;
    balance: number;
    status: AccountStatus;
}

interface AccountQuery {
    name: string;
    status: StatusFilter;
}

// 模拟后端返回的全部账户数据。
const accounts = ref<Account[]>([
    { id: 101, name: '张三储蓄账户', balance: 3200, status: 'normal' },
    { id: 102, name: '李四工资账户', balance: 8500, status: 'frozen' },
    { id: 103, name: '张三理财账户', balance: 12000, status: 'normal' },
    { id: 104, name: '王五储蓄账户', balance: 5600, status: 'normal' },
    { id: 105, name: '赵六工资账户', balance: 9200, status: 'frozen' },
    { id: 106, name: '张三备用账户', balance: 1800, status: 'normal' }
]);

// 用户正在输入的查询条件。
const query = reactive<AccountQuery>({
    name: '',
    status: 'all'
});

// 点击查询后正式应用的条件。
const appliedQuery = reactive<AccountQuery>({
    name: '',
    status: 'all'
});

// 分页状态。
const currentPage = ref(1);
const pageSize = 3;

// 根据已应用的查询条件筛选账户。
const filteredAccounts = computed(() => {
    return accounts.value.filter(account => {
        // includes() 判断账户名称中是否包含输入的关键词。
        const matchName = account.name.includes(appliedQuery.name);

        // 选择 all 时不限制状态，否则要求状态完全一致。
        const matchStatus =
            appliedQuery.status === 'all' ||
            account.status === appliedQuery.status;

        return matchName && matchStatus;
    });
});

// 根据当前页码，从筛选结果中截取当前页数据。
const pageRows = computed(() => {
    const start = (currentPage.value - 1) * pageSize;
    const end = start + pageSize;

    return filteredAccounts.value.slice(start, end);
});

// 点击查询后，把输入条件复制到正式查询条件。
function handleQuery(): void {
    appliedQuery.name = query.name.trim();
    appliedQuery.status = query.status;

    // 新的查询结果从第一页开始显示。
    currentPage.value = 1;
}

// 重置输入条件，并立即应用重置后的条件。
function handleReset(): void {
    query.name = '';
    query.status = 'all';

    handleQuery();
}
</script>

<template>
    <div>
        <h2>个人账户查询</h2>

        <el-form :model="query" label-width="100px">
            <el-form-item label="账户名称">
                <el-input
                    v-model="query.name"
                    placeholder="请输入账户名称或关键词"
                    clearable
                />
            </el-form-item>

            <el-form-item label="账户状态">
                <el-select v-model="query.status">
                    <el-option label="全部" value="all" />
                    <el-option label="正常" value="normal" />
                    <el-option label="冻结" value="frozen" />
                </el-select>
            </el-form-item>
        </el-form>

        <div>
            <el-button type="primary" @click="handleQuery">
                查询
            </el-button>

            <el-button @click="handleReset">
                重置
            </el-button>
        </div>

        <p>查询结果：{{ filteredAccounts.length }} 条</p>

        <el-table
            :data="pageRows"
            row-key="id"
            border
            stripe
        >
            <el-table-column
                prop="id"
                label="账户编号"
            />

            <el-table-column
                prop="name"
                label="账户名称"
            />

            <el-table-column
                prop="balance"
                label="账户余额"
            />

            <el-table-column label="账户状态">
                <template #default="scope">
                    {{ scope.row.status === 'normal' ? '正常' : '冻结' }}
                </template>
            </el-table-column>
        </el-table>

        <el-pagination
            v-model:current-page="currentPage"
            :page-size="pageSize"
            :total="filteredAccounts.length"
            layout="prev, pager, next"
        />
    </div>
</template>
```

### 按照执行顺序理解这段程序

这段程序虽然比前面的例子长，但并不是把所有代码混在一起。它可以分成四个部分。

**第一部分：准备数据和查询条件**

`accounts` 保存全部账户记录；`query` 保存用户正在输入的条件；`appliedQuery` 保存已经提交的条件。

用户在输入框中输入内容时，只会改变 `query`，不会立即改变 `appliedQuery`。

**第二部分：计算筛选结果**

`filteredAccounts` 是计算属性。它读取 `accounts` 和 `appliedQuery`，使用 `filter()` 保留符合条件的账户。

`includes()` 用于判断账户名称是否包含查询关键词。例如，`'张三储蓄账户'.includes('张三')` 的结果为 `true`。

当查询关键词为空字符串时，任何字符串都包含空字符串，因此不会因为姓名条件而排除账户。

**第三部分：计算当前页数据**

`pageRows` 根据 `currentPage` 和 `pageSize` 计算起始下标，再使用 `slice()` 截取当前页。

表格绑定的是 `pageRows`，而不是 `accounts` 或 `filteredAccounts`。因此表格只显示当前页的记录。

**第四部分：处理查询和重置**

点击查询时，`handleQuery()` 把输入条件复制到正式查询条件，并将页码重置为 1。

点击重置时，先清空输入条件，再调用 `handleQuery()` 应用重置后的条件。这样筛选结果会恢复为全部账户。

### 运行时可以按下面的顺序验证

1. 初始页面显示全部 6 条账户记录，第一页显示 3 条。
2. 输入“张三”，点击查询，结果缩小为 3 条。
3. 将状态改为“冻结”，点击查询，结果只保留符合两个条件的账户。
4. 点击重置，姓名清空、状态恢复为全部，表格重新显示全部记录。
5. 如果先切换到第二页，再执行新的查询，程序会自动回到第一页。

这段程序没有连接真实银行接口，`accounts` 是写在前端的模拟数据。真实项目中，账户数据会由后端接口返回；前端筛选和分页的具体实现还要根据接口设计决定。

> [!EXERCISE] 查询后为什么要重置页码
>
> 假设账户列表原本有 30 条记录，每页显示 10 条。用户切换到第 3 页后，输入关键词查询，结果只剩 2 条。如果不重置当前页，会发生什么？
>
> 【答案】
>
> 第 3 页的起始下标是 20，而新的筛选结果只有 2 条，因此 `slice(20, 30)` 会返回空数组。将 `currentPage` 重置为 1 后，起始下标变成 0，才能显示这 2 条记录。

## 表单校验：提交之前检查用户输入

### 为什么表单需要校验

查询表单通常只负责收集条件，但新增、修改等业务表单往往需要在提交前检查数据是否符合要求。

例如，新增账户联系人时：

- 姓名不能为空。
- 姓名长度必须符合业务要求。
- 某些字段必须选择指定值。

如果只依赖用户自己检查，无法保证提交的数据符合业务要求。

Element Plus 提供了表单校验能力。开发者可以配置规则，让组件在适当时机检查输入，并把错误信息显示在对应表单项下方。

需要注意：前端校验主要用于改善用户体验。真实业务仍然必须由后端再次校验，不能因为前端校验通过，就认为服务器可以无条件信任这份数据。

### rules：为每个字段配置校验规则

先看一份简单的规则：

```ts
const rules = {
    name: [
        {
            required: true,
            message: '请输入客户姓名',
            trigger: 'blur'
        },
        {
            min: 2,
            max: 20,
            message: '姓名长度为 2～20 个字符',
            trigger: 'blur'
        }
    ]
};
```

`rules` 是一个对象，它的属性名对应表单数据中的字段名。

这里的 `rules.name` 是姓名字段的规则数组，包含两条规则：

**第一条：**

- `required: true`：要求字段必须填写。
- `message`：校验失败时显示的提示文字。
- `trigger: 'blur'`：在输入框失去焦点时触发相关校验。

**第二条：**

- `min: 2`：字符串最少 2 个字符。
- `max: 20`：字符串最多 20 个字符。
- `message`：长度不符合要求时显示的提示。
- `trigger: 'blur'`：失去焦点时触发校验。

这里的 `min` 和 `max` 用于字符串长度。不同类型的校验规则含义可能不同，不能把它们不加区分地理解成所有字段都在比较数字大小。

### model、rules、prop 和 v-model 必须对应起来

完整的表单校验需要把四个位置连接起来：

```vue
<el-form :model="form" :rules="rules">
    <el-form-item label="客户姓名" prop="name">
        <el-input v-model="form.name" />
    </el-form-item>
</el-form>
```

它们分别负责：

| 位置 | 作用 |
|---|---|
| `:model="form"` | 告诉表单数据对象在哪里 |
| `:rules="rules"` | 提供各个字段对应的校验规则 |
| `prop="name"` | 指定当前表单项对应哪个字段 |
| `v-model="form.name"` | 将输入框与实际字段连接起来 |

以 `name` 字段为例，Element Plus 会根据表单项的 `prop="name"`，在表单数据 `form` 中找到 `name` 字段，再根据 `rules.name` 取得对应规则。

因此，下面三个名称必须保持一致：

- `form.name`
- `rules.name`
- `prop="name"`

如果把 `prop` 写成 `username`，但实际数据和规则都叫 `name`，组件就无法按预期找到对应字段的规则。

`label` 只是显示文字。把 `label="客户姓名"` 改成 `label="联系人"`，不会改变实际字段路径。

### required 和长度规则是两个独立条件

只设置 `required`，只能检查是否填写了内容，不能保证姓名长度符合业务要求。

只设置长度规则，也不能直接等同于必填。业务上需要同时满足必填和长度要求时，就应该配置两条规则。

另外，字符串前后可能存在空格。例如用户输入三个空格，字符串长度并不为零，但实际业务上可能仍然属于没有填写有效姓名。

如果业务不允许这种输入，可以在提交前使用 `trim()` 去掉首尾空白，再执行校验。

### blur 和 change：什么时候触发校验

常见的 `trigger` 有：

- `blur`：输入框失去焦点时触发。
- `change`：字段值发生变化时触发。

这两种配置主要影响用户输入过程中的校验时机。

此外，还可以在点击提交按钮时，主动调用表单的 `validate()` 方法执行校验。即使用户没有先触发失焦校验，也可以在提交时统一检查。

因此，表单校验可以分为两个时机：

1. 用户输入过程中，根据规则触发提示。
2. 用户点击提交时，主动执行完整校验。

## 模板引用：从脚本中调用表单组件的方法

### 什么是模板引用

前面使用的 `ref()` 主要用于保存响应式数据，例如：

```ts
const name = ref('');
```

但 Vue 的 `ref` 还有另一种用途：**通过模板引用获取页面中的组件实例或 DOM 元素。**

例如，Element Plus 的 `el-form` 组件提供了 `validate()`、`resetFields()` 等方法。若希望在脚本中主动调用这些方法，就需要先拿到表单组件实例。

在 `<script setup>` 中，可以先定义一个 ref：

```ts
import { ref } from 'vue';
import type { FormInstance } from 'element-plus';

const formRef = ref<FormInstance>();
```

这里的 `FormInstance` 是 Element Plus 提供的表单实例类型。它告诉 TypeScript：`formRef` 将来保存的是一个表单组件实例。

### 模板中的 ref 属性怎样对应到脚本变量

在模板中：

```vue
<el-form ref="formRef">
    ...
</el-form>
```

这里的 `ref="formRef"` 不是在创建另一个响应式数据，而是在告诉 Vue：组件挂载后，把这个表单组件实例放到脚本中名为 `formRef` 的引用里。

因此，组件尚未挂载时，`formRef.value` 还没有实例；组件挂载后，Vue 才会把实例赋给它。

这也是为什么不能在组件初始化的任意位置，无条件假设 `formRef.value` 已经存在。

### FormInstance 和 FormRules 为什么使用 import type

```ts
import type { FormInstance, FormRules } from 'element-plus';
```

`import type` 表示只导入类型，不导入运行时需要执行的值。

`FormInstance` 用来描述表单组件实例的类型；`FormRules` 用来描述校验规则对象的类型。 `FormRules<AccountFormModel>` 中的 `AccountFormModel` 是传给 `FormRules` 的泛型参数，表示规则应该对应这份表单模型中的字段。

它们只参与 TypeScript 类型检查，构建后不会作为普通 JavaScript 值保留。

与之相对，`ref()`、`reactive()`、`computed()` 等函数需要在程序运行时调用，因此要使用普通的 `import`。

### validate()：主动执行表单校验

拿到表单实例后，就可以调用它提供的 `validate()` 方法：

```ts
await formRef.value.validate();
```

`validate()` 会按照表单配置的规则检查字段。

它返回一个 Promise。可以先把 Promise 理解为：一个代表“未来才会完成的操作”的对象。校验过程完成后，程序才能知道校验是否通过。

因此，调用校验时通常会配合 `async` 和 `await`：

```ts
async function submit(): Promise<void> {
    await formRef.value.validate();

    console.log('校验通过，可以继续后续操作');
}
```

这里有三个新语法：

- `async`：声明一个异步函数，使函数内部可以使用 `await`。
- `await`：等待 Promise 对应的操作完成，再继续执行后面的语句。
- `Promise<void>`：表示这个异步函数最终不返回业务数据。

`await` 不会冻结整个浏览器页面。等待期间，浏览器仍然可以处理其他界面任务。

### try...catch：处理校验失败

如果校验失败，`validate()` 返回的 Promise 会以失败状态结束。可以使用 `try...catch` 分别处理成功和失败：

```ts
async function submit(): Promise<void> {
    try {
        await formRef.value.validate();

        console.log('校验通过');
    } catch {
        console.log('校验失败');
    }
}
```

`try` 中放置可能失败的操作；如果其中的异步操作失败，就会进入 `catch`。

这样可以避免校验还没有完成，程序就直接执行保存逻辑。

在调用组件方法之前，还要先判断模板引用是否已经取得实例：

```ts
if (!formRef.value) {
    return;
}
```

如果 `formRef.value` 不存在，就提前结束函数，不继续调用 `validate()`。

### resetFields 和 clearValidate 有什么区别

Element Plus 表单实例还提供了两个容易混淆的方法：

```ts
formRef.value?.resetFields();
formRef.value?.clearValidate();
```

它们的区别是：

| 方法 | 作用 | 是否修改输入值 |
|---|---|---|
| `resetFields()` | 恢复表单记录的初始值，并清除校验提示 | 是 |
| `clearValidate()` | 清除校验提示 | 否 |

`resetFields()` 恢复的是表单组件记录的初始值，不应简单理解成“把所有输入框清空”。

例如，表单初始化时姓名就是“张三”，调用 `resetFields()` 后恢复的就是“张三”，而不是空字符串。

`clearValidate()` 只清除错误提示，输入框中原来的内容仍然保留。

如果需要把某个字段改成指定值，应直接修改数据：

```ts
form.name = '李四';
```

不要把 `resetFields()` 当成任意业务数据回填或编辑快照恢复工具。

### 完整程序：带校验的账户联系人表单

文件：`src/App.vue`。

```vue
<script setup lang="ts">
import { reactive, ref } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';

interface AccountFormModel {
    name: string;
}

// 表单实际保存的数据。
const form = reactive<AccountFormModel>({
    name: ''
});

// 用于取得 el-form 组件实例。
const formRef = ref<FormInstance>();

// 页面上的操作结果提示。
const result = ref('尚未提交');

// name 字段对应的校验规则。
const rules: FormRules<AccountFormModel> = {
    name: [
        {
            required: true,
            message: '请输入客户姓名',
            trigger: 'blur'
        },
        {
            min: 2,
            max: 20,
            message: '姓名长度为 2～20 个字符',
            trigger: 'blur'
        }
    ]
};

// 提交前主动校验。
async function handleSubmit(): Promise<void> {
    // 确认表单组件实例已经取得。
    if (!formRef.value) {
        return;
    }

    // 去掉姓名首尾的空白字符，再执行校验。
    form.name = form.name.trim();

    try {
        // 等待校验完成。
        await formRef.value.validate();

        // 只有校验通过，才会执行到这里。
        result.value = `校验通过，客户姓名：${form.name}`;
    } catch {
        // 校验失败时进入这里。
        result.value = '校验未通过，请检查输入内容';
    }
}

// 恢复表单记录的初始值。
function handleReset(): void {
    formRef.value?.resetFields();
    result.value = '表单已恢复初始值';
}

// 只清除错误提示，不修改输入内容。
function handleClearValidate(): void {
    formRef.value?.clearValidate();
    result.value = '已清除校验提示';
}
</script>

<template>
    <div>
        <h2>新增账户联系人</h2>

        <el-form
            ref="formRef"
            :model="form"
            :rules="rules"
            label-width="100px"
        >
            <el-form-item
                label="客户姓名"
                prop="name"
            >
                <el-input
                    v-model="form.name"
                    placeholder="请输入客户姓名"
                />
            </el-form-item>
        </el-form>

        <el-button
            type="primary"
            @click="handleSubmit"
        >
            提交校验
        </el-button>

        <el-button @click="handleReset">
            恢复初始值
        </el-button>

        <el-button @click="handleClearValidate">
            清除校验提示
        </el-button>

        <p>当前姓名：{{ form.name }}</p>
        <p>{{ result }}</p>
    </div>
</template>
```

### 按照实际操作理解程序执行过程

可以按下面的顺序运行：

1. 初始时姓名为空，点击“提交校验”，必填规则不通过，输入框下方显示错误提示。
2. 输入一个字，再点击“提交校验”，必填规则通过，但长度规则不通过。
3. 输入“张三”，点击“提交校验”，两条规则都通过，程序进入 `try` 中校验之后的代码，显示“校验通过”。
4. 点击“清除校验提示”，错误提示会被清除，但输入框中的姓名不会改变。
5. 点击“恢复初始值”，表单恢复到初始化时的空字符串。

本例的 `result` 只是页面反馈，不代表数据已经保存到服务器。真实业务中，校验通过后还需要调用后端接口完成保存。

> [!EXERCISE] 找出校验规则无法对应的原因
>
> 表单数据和规则定义如下：
>
> ```ts
> const form = reactive({
>     name: ''
> });
>
> const rules = {
>     name: [
>         { required: true, message: '请输入姓名', trigger: 'blur' }
>     ]
> };
> ```
>
> 但是模板中写成了：
>
> ```vue
> <el-form-item label="姓名" prop="username">
>     <el-input v-model="form.name" />
> </el-form-item>
> ```
>
> 应该修改哪一处？
>
> 【答案】
>
> 将 `prop="username"` 修改为 `prop="name"`。表单数据字段、规则对象的键和表单项的 `prop` 必须对应。`label` 只是展示文字，不能代替字段路径。

## 当日复盘与练习

### 今天需要真正掌握的内容

完成第二天学习后，至少应该能够解释并使用以下内容：

- 能看懂 `interface`、`type`、联合类型、可选属性和数组类型。
- 能区分 `Account` 与 `Account[]`，知道 `find()` 可能返回 `undefined`。
- 能解释 `ref()` 和 `reactive()` 的区别，知道脚本中什么时候需要 `.value`。
- 能区分 `computed()` 和 `watch()`，知道计算属性为什么需要返回值。
- 能看懂 `el-form`、`el-form-item`、`el-input` 和 `el-select` 的基本关系。
- 能看懂 `el-table` 的数据来源、列配置和默认插槽。
- 能根据当前页码和每页条数计算分页数据，理解 `slice()` 的起止下标。
- 能配置 Element Plus 表单校验规则，知道 `model`、`rules`、`prop` 和 `v-model` 如何对应。
- 能通过模板引用取得表单实例，并使用 `validate()`、`resetFields()` 和 `clearValidate()`。

### 课后练习

**练习一：账户状态类型**

定义一个 `AccountStatus` 类型，只允许 `'normal'` 和 `'frozen'`。再定义一个 `Account` 接口，至少包含 `id`、`name`、`balance` 和 `status` 四个字段。

要求：创建两条账户记录，并使用 `Account[]` 声明数组类型。

**练习二：正常账户数量**

使用 `ref()` 保存账户数组，再使用 `computed()` 计算正常账户数量。

要求：点击按钮冻结一个账户，页面上的正常账户数量应自动变化，不允许手工维护数量。

**练习三：查询与分页**

在账户查询综合程序中增加一个查询条件：最低余额。

要求：只有账户名称、账户状态和最低余额都符合条件时，账户才出现在查询结果中。点击查询后，分页回到第一页。

**练习四：表单校验**

在联系人表单中增加一个“联系电话”字段。

要求：联系电话必填，失去焦点时进行校验；点击提交时主动执行全部规则。先完成规则和字段对应关系，再考虑增加更严格的格式检查。

### 参考资料

- [Vue 官方文档：TypeScript 与组合式 API](https://vuejs.org/guide/typescript/composition-api)
- [Vue 官方文档：计算属性](https://vuejs.org/guide/essentials/computed)
- [Vue 官方文档：侦听器](https://vuejs.org/guide/essentials/watchers)
- [Element Plus：表单组件](https://element-plus.org/en-US/component/form.html)
- [Element Plus：表格组件](https://element-plus.org/en-US/component/table.html)
- [Element Plus：分页组件](https://element-plus.org/en-US/component/pagination.html)
