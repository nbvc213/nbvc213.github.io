---
id: vue-course-day-2
title: "Vue 企业开发 · 第二天：类型、响应式与业务控件"
folder: miscellaneous
order: 1102
date: 2026-11-01
updated: 2026-11-01
tags: [Vue, TypeScript, Element Plus]
description: "按类型、派生数据、表格分页、独立校验表单的顺序学习。"
pinned: false
draft: false
---

## 学习路径与运行约定

先完成第一天工程准备，保留其中 `src/main.ts`，每个单元完整替换 `src/App.vue`。本日安排：类型 20 分钟，响应式 20 分钟，查询表格分页 35 分钟，表单校验 30 分钟，练习复盘 15 分钟。弹窗、编辑快照属于课后查阅；第五天使用内联表单，不以拓展内容为前提。

> [!NOTE] 本篇的阅读方式
>
> 主线按当天目标推进，完整解释用于随时回查。遇到新写法时先读它自己的小例与结果，再运行本单元完整文件；不需要把所有例子合并。两小时是主线学习目标，不代表必须在两小时内逐字读完并运行所有对照实验。练习答案紧随题目，完成自己的判断后再展开。

## TypeScript：先读懂类型，再写类型

### 为什么企业项目需要类型检查

账户对象原本有 name 字段，如果误写成 account.nmae，JavaScript 可能直到运行时才得到 undefined。TypeScript 可以根据对象结构在编辑器和检查阶段提示字段不存在。

```ts
const account = { id: 101, name: '储蓄账户' };
console.log(account.name); // 正确：储蓄账户
// console.log(account.nmae); // 错误示意：属性名拼写错误
```

类型检查帮助发现程序之间的约定是否一致。例如接口函数承诺返回数组，页面就不应把结果当成单个对象使用。它不会自动验证服务器真实返回的内容，类型标注也不会把数字字符串变成数字。

### 类型标注与类型推断

类型标注写在变量名之后，用冒号连接。

```ts
let accountName: string = '工资账户';
let balance: number = 3200;
let active: boolean = true;
```

string、number、boolean 分别描述字符串、数字、布尔值。`balance = '3200'` 不符合 number 类型，应修正数据转换或数据来源，而不是修改所有变量为 any。

已提供明确初始值时，TypeScript 通常可以推断类型：

```ts
let balance = 3200; // 推断为 number
balance += 100;
// balance = '很多钱'; // 错误示意
```

**类型推断不是没有类型。** 它只是省去重复书写标注。先观察编辑器提示的类型，再决定是否需要显式声明。

### interface：给业务对象定义结构

账户不只是一个姓名，还包含编号和状态。interface 为对象结构命名。

```ts
interface Account {
    id: number;
    name: string;
    active: boolean;
}
const account: Account = { id: 101, name: '储蓄账户', active: true };
```

Account 是类型名称，不是已经创建的对象。真正的对象仍由右侧 `{ ... }` 创建。缺少 active 或把 id 写成字符串时，类型检查会指出不符合声明。

### 完整程序：类型约束怎样落实到一个账户

文件：`src/App.vue`。保留第一天配置的 main.ts。

```vue
<script setup lang="ts">
interface Account {
    id: number;
    name: string;
    active: boolean;
}
const account: Account = {
    id: 101,
    name: '储蓄账户',
    active: true
};
function describe(value: Account): string {
    return `${value.id}：${value.name}`;
}
</script>

<template>
    <p>{{ describe(account) }}</p>
    <p>状态：{{ account.active ? '启用' : '停用' }}</p>
</template>
```

页面显示“101：储蓄账户”和“状态：启用”。这里没有需要用户修改的状态，所以 account 使用普通 const 对象即可，不必为了演示类型而加入响应式。

请将声明、创建与使用分开看：interface 只描述结构；对象字面量真正创建数据；`: Account` 检查这个对象是否符合约定；describe 的参数也使用同一约定，所以函数内部可以读取 id 和 name。

可以逐一尝试下面的错误，每次只改一处，然后观察编辑器提示或运行项目的类型检查：

```ts
// 错误示意一：id 应该是数字，不是字符串
// const account: Account = { id: '101', name: '储蓄账户', active: true };

// 错误示意二：缺少必须存在的 active
// const account: Account = { id: 101, name: '储蓄账户' };

// 错误示意三：函数要求 Account，不能只传一个姓名
// describe('储蓄账户');
```

这些错误分别对应字段类型、必填字段和函数参数。不要把所有红线都理解成“TypeScript 太严格”，先说清楚程序哪两处对数据的理解不一致。

> [!EXERCISE] interface 会自动创建对象吗
>
> 删除 const account 的声明，只保留 interface Account，模板还能显示 {{ account.name }} 吗？
>
> 【答案】
>
> 不能。Account 是编译阶段的类型描述，不是运行时 account 对象。模板需要实际值，必须创建对象、接收 Props 或取得接口结果。类型名首字母大写不代表它会自动生成数据。


### 数组类型：Account 与 Account[] 不相同

```ts
const account: Account = { id: 101, name: '储蓄账户', active: true };
const accounts: Account[] = [account];
```

Account 描述一条记录，Account[] 描述记录数组。即使查询只命中一条，列表仍应接收 `[account]`，不能直接接收 account。`accounts.name` 没有“当前账户姓名”的含义，应遍历数组或先找到目标元素。

### type、联合类型与字符串字面量

type 可以给一个类型起别名。联合类型表示值允许来自几个类型或几个确定值。

```ts
type Status = 'normal' | 'frozen';
type QueryStatus = Status | 'all';
let status: Status = 'normal';
let queryStatus: QueryStatus = 'all';
// status = 'all'; // 错误示意：all 只属于查询条件
```

这里的 `'normal'` 是字符串字面量类型，要求值精确等于该字符串。竖线表示“或者”，不是逻辑表达式中的 `||`。这种约束可以避免把 normal 错拼为 nomral 后页面悄悄走入错误分支。

interface 和 type 都可以描述对象。本课程用 interface 描述业务对象，用 type 描述状态联合，不要求在今天深入它们所有的合并和扩展差异。

### 完整程序：联合类型限制状态选项

文件：`src/App.vue`。

```vue
<script setup lang="ts">
import { ref } from 'vue';
type Status = 'normal' | 'frozen';
const status = ref<Status>('normal');
function freeze(): void {
    status.value = 'frozen';
}
function restore(): void {
    status.value = 'normal';
}
</script>

<template>
    <p>当前状态值：{{ status }}</p>
    <button @click="freeze">冻结</button>
    <button @click="restore">恢复正常</button>
</template>
```

初始显示 normal；冻结后显示 frozen；恢复后回到 normal。字符串字面量类型限制程序允许写入的值，不会自动把 normal 翻译为中文；中文展示仍需模板或映射处理。

如果在 freeze 中拼成 status.value='freezed'，类型检查应报错。若把 Status 简化为 string，这个拼写错误就不再能由类型提前发现。联合类型的价值在于把业务允许的集合写清楚。

查询条件中若还需要 all，应另定义 `type QueryStatus = Status | 'all'`。账户自身可以是 normal 或 frozen，但“全部”是查询含义，不是一条账户真实拥有的状态。


### 可选属性与可选链

```ts
interface AccountWithRemark {
    id: number;
    name: string;
    remark?: string;
}
const account: AccountWithRemark = { id: 101, name: '储蓄账户' };
console.log(account.remark); // undefined
console.log(account.remark?.trim()); // undefined，不会调用 trim
```

属性名后的 `?` 表示该属性可缺省；访问处的 `?.` 表示左侧为 null 或 undefined 时停止本段访问。这是两种不同语法，不能因为属性可选就假定它一定存在。

可选链不应掩盖必需数据错误。若业务必须有账户 ID，应检查并报错，不能一路可选链后什么也不做。

### 函数参数与返回值

```ts
function formatName(name: string): string {
    return name.trim();
}
function printName(name: string): void {
    console.log(name);
}
function findAccount(accounts: Account[], id: number): Account | undefined {
    return accounts.find(account => account.id === id);
}
```

参数后的标注限制传入值；右括号后的标注描述返回值。void 表示调用者不使用函数返回结果。find 没命中时返回 undefined，因此读取结果的属性前应判断存在。

```ts
const selected = findAccount(accounts, 999);
if (selected) {
    console.log(selected.name);
}
```

### 泛型：为 ref 指定内部值类型

第一天用 ref(3200) 时，数字初始值足以推断类型；空数组没有账户元素可用于推断，需要明确说明未来放什么。

```ts
import { ref } from 'vue';
const rows = ref<Account[]>([]);
const selected = ref<Account>();
```

`<Account[]>` 是类型参数，说明 rows.value 为 Account 数组，不是比较大小的表达式。`ref<Account>()` 没有初始值，所以 selected.value 还可能为 undefined。模板中使用 `selected?.name` 正是为了处理未选择状态。

### import type：只导入类型

```ts
// 假设 Account 在当前目录的 account.ts 中被具名导出
import type { Account } from './account';
```

类型在构建时会被移除；ref、computed 等函数则需要在运行时存在，不能用 import type 导入后再调用。今天下面的独立示例将 interface 放在同一文件中，不需要额外创建 account.ts。第四天再拆分类型模块。

> [!EXERCISE] 判断字段与数据形状
>
> 接口函数要求 Account[]，你传入 `{ id: 1, name: '张三', active: true }`；随后把 ID 改成 `'1'`。这是同一个错误吗？
>
> 【答案】
>
> 不是。第一个是对象与数组形状不一致，应传入包含对象的数组。第二个是 id 的字符串与 number 类型不一致，应依据接口协议确定是否转换。不能用类型断言让这两种运行时数据自动变正确。


### 完整程序：类型帮助定位错误

```vue
<script setup lang="ts">
import { ref } from 'vue'
interface Account { id: number; name: string; remark?: string }
const rows = ref<Account[]>([{ id: 1, name: '张三' }])
const selected = ref<Account>()
function select(id: number): void {
  selected.value = rows.value.find(item => item.id === id)
}
</script>
<template>
  <button @click="select(1)">选择账户</button>
  <p>{{ selected?.name }}</p>
</template>
```

`interface` 的分号分隔属性；`selected?.name` 在未选中时得到 undefined，插值不会显示姓名。将 id 改成字符串 `'1'` 会产生类型错误，应修正数据源，而不是用断言掩盖错误。

## ref 与 reactive：选择状态的保存方式

### ref 保存对象时，脚本仍要写 .value

```ts
import { ref } from 'vue';
const account = ref({ id: 101, name: '储蓄账户' });
account.value.name = '工资账户';
account.value = { id: 102, name: '理财账户' };
```

第一条赋值修改原对象的字段，第二条整体替换 ref 内的对象。两者都能触发依赖更新。模板使用顶层 account 时可以省略 .value，但脚本函数中不能省略。

### reactive 保存字段稳定的表单

```ts
import { reactive } from 'vue';
const form = reactive({ name: '', active: true });
form.name = '张三';
form.active = false;
```

reactive 返回对象的响应式代理，直接通过属性读写。不要写 form.value.name，这个对象没有名为 value 的包装层。它适合拥有多个字段、需要逐个字段修改的表单。

### 整体替换与保持引用

```ts
const form = reactive({ name: '', active: true });
// 正确：修改现有代理的属性
form.name = '李四';
form.active = true;
```

若用 let 保存 reactive 对象，再给变量重新赋一个普通对象，旧代理与新对象之间没有自动连接。依赖旧代理的消费者不会凭变量名跟随切换。需要频繁整体替换时，使用 ref({ ... }) 通常更直接。

reactive 代理中的普通属性若被解构为局部变量，也不会自动变成 ref。本课程直接保留 `form.name` 的读写方式，避免在表单刚入门时再加入解构转换工具。

### 完整程序：两种状态容器的访问方式

替换 src/App.vue：

```vue
<script setup lang="ts">
import { ref, reactive } from 'vue';
const account = ref({ name: '储蓄账户' });
const form = reactive({ name: '工资账户' });
function update() {
    account.value = { name: '理财账户' };
    form.name = '结算账户';
}
</script>
<template>
    <p>ref 对象：{{ account.name }}</p>
    <p>reactive 对象：{{ form.name }}</p>
    <button @click="update">更新两处名称</button>
</template>
```

初始显示储蓄账户与工资账户。点击后分别显示理财账户与结算账户。模板看起来都用 .name，但脚本访问规则不同，读代码时需要先看状态如何声明。

### 完整程序：解构为什么可能得到旧值

文件：`src/App.vue`。

```vue
<script setup lang="ts">
import { reactive } from 'vue';
const form = reactive({ name: '张三' });
const { name } = form;
function change(): void {
    form.name = '李四';
}
</script>

<template>
    <p>通过代理读取：{{ form.name }}</p>
    <p>初始化时解构的字符串：{{ name }}</p>
    <button @click="change">改为李四</button>
</template>
```

初始两行都是张三。点击后，第一行变为李四，第二行仍是张三。

`const { name } = form` 在这一刻读取 form.name，并把字符串张三放进局部常量 name。name 不是一个自动跟随 form.name 的 ref，也不是“属性别名”。以后修改代理，不会重新执行这条解构语句。

这里讨论的是对普通 reactive 属性的 JavaScript 解构。Vue 某些编译宏有专门转换规则，不能据此推导“所有解构都一样”；当前初学阶段保留 form.name 是最直接的写法。

### ref 对象与 reactive 对象的选用练习

若接口每次返回一整份对象，用 ref 便于 `account.value = result`；若表单字段逐一编辑，reactive 便于 `form.name = ...`。二者不是互相排斥，也不是“对象必须 reactive，数字必须 ref”的硬性规定。

> [!EXERCISE] 找到访问方式错误
>
> `const form = reactive({ name: '' })` 后写 `form.value.name = '张三'`；`const account = ref({ name: '' })` 后写 `account.name = '张三'`。分别怎样修复？
>
> 【答案】
>
> 第一处改为 form.name，因为 reactive 返回代理对象本身。第二处改为 account.value.name，因为脚本中的 account 是 ref 容器。先看声明，再决定访问方式，不能只凭变量名像不像对象判断。


## computed：从已有状态得到结果

### 为什么不再保存一份重复状态

假设页面既保存账户数组，又保存“启用数量”。每次新增、删除、切换状态后都要手工更新数量，容易漏掉。计算属性可以直接根据账户数组计算数量，让结果跟随依赖变化。

```ts
const activeCount = computed(() => {
    return rows.value.filter(account => account.active).length;
});
```

computed 接收 getter，即读取计算结果的函数。Vue 在计算时追踪 getter 读取的响应式数据。依赖未变化时读取可使用缓存，依赖变化后再读取时重新计算；不是所有组件状态变化都要重新运行此 getter。

### return 决定计算属性的结果

```ts
const cleanedName = computed(() => form.name.trim());
const cleanedNameAgain = computed(() => {
    return form.name.trim();
});
```

两个写法结果相同。花括号表示函数体，必须显式 return；漏写 return 就得到 undefined。计算属性在脚本中读 `.value`，在模板中顶层自动解包。

### 完整程序：数量与数组同时变化

```vue
<script setup lang="ts">
import { ref, computed } from 'vue';
const accounts = ref([
    { id: 1, name: '张三', active: true },
    { id: 2, name: '李四', active: false }
]);
const activeCount = computed(() => accounts.value.filter(item => item.active).length);
function enableSecond() {
    const account = accounts.value.find(item => item.id === 2);
    if (account) account.active = true;
}
</script>
<template>
    <p>启用数量：{{ activeCount }}</p>
    <button @click="enableSecond">启用第二个账户</button>
</template>
```

初始数量是 1。点击后修改对象属性 active，getter 依赖失效，页面读取时得到 2。不需要另外编写 activeCount.value = 2；这里它是只读派生结果。

### 完整程序：观察缓存与普通函数的区别

文件：`src/App.vue`。Console 中的日志仅用于观察计算次数，不是业务副作用设计。

```vue
<script setup lang="ts">
import { ref, computed } from 'vue';
const price = ref(10);
const count = ref(2);
const unrelated = ref(0);
const total = computed(() => {
    console.log('computed：重新计算总额');
    return price.value * count.value;
});
function calculateTotal(): number {
    console.log('普通函数：计算总额');
    return price.value * count.value;
}
function changeUnrelated(): void { unrelated.value += 1; }
function increaseCount(): void { count.value += 1; }
</script>

<template>
    <p>计算属性：{{ total }}</p>
    <p>普通函数：{{ calculateTotal() }}</p>
    <p>无关计数：{{ unrelated }}</p>
    <button @click="changeUnrelated">只修改无关计数</button>
    <button @click="increaseCount">数量加一</button>
</template>
```

初始两种结果都是 20。点击“只修改无关计数”后，模板需要重新更新，其中普通函数会再次被调用；total 的依赖 price 和 count 没变，可复用计算缓存。

点击“数量加一”，count 变为 3，total 依赖失效，重新读取时得到 30。缓存不是永久冻结结果，而是在依赖没有变化时复用结果。

判断依赖要看 getter 实际读取了什么。本例没有读取 unrelated，所以 unrelated 的变化不会使 total 因它本身而失效。

### 为什么计算属性不应该保存另一个结果

```ts
// 错误方向示意：不要把提交或其他状态修改塞进计算过程
// const total = computed(() => {
//     message.value = '已经计算';
//     return price.value * count.value;
// });
```

读取一个派生值却偷偷修改另一个状态，会让执行顺序难以判断。computed 应负责“这个结果是多少”；需要额外做什么动作，交给事件函数或 watch。

> [!EXERCISE] computed 没有 return
>
> 把 getter 写成 `computed(() => { price.value * count.value })`，为什么不显示 20？是否需要手动让页面重新渲染？
>
> 【答案】
>
> 花括号里的乘法结果被丢弃，函数默认返回 undefined。应补 return，或去掉花括号使用表达式函数体。问题在返回值，不在 Vue 没有更新页面。


## watch：数据变化后执行额外动作

### 数据源与回调

watch 用于副作用，即计算之外的动作，例如记录变化、启动异步查询、重置与之关联的页码。它的典型语法是：

```ts
watch(source, (newValue, oldValue) => {
    // 变化后需要执行的逻辑
}, { immediate: true });
```

source 决定“观察谁”，回调决定“变化后做什么”，第三个参数是选项。newValue 是本次值，oldValue 是上次观察到的值。默认不是赋值一次就立刻同步调用一次，Vue 会调度和批处理回调。

### ref 可以直接作为源，属性应提供 getter

```ts
watch(keyword, (newValue, oldValue) => {
    console.log('关键词变化', oldValue, newValue);
});
watch(() => form.name, (newValue) => {
    console.log('姓名变化', newValue);
});
```

第一种传 ref 对象；第二种传每次能重新读取属性的函数。`watch(form.name, ...)` 只是传入当时的字符串，无法表达以后要重新读取哪个属性。

### immediate 与对象旧值的边界

`immediate: true` 会在注册时执行一次，第一次没有先前值，不能假定 oldValue 一定是字符串。默认不带 immediate 时，注册本身不执行变化回调。

直接 watch 一个 reactive 对象会隐式深度侦听；嵌套属性改变时，newValue 和 oldValue 可能是同一个代理。watch 不会自动保存一份深拷贝历史。需要比较单个姓名的前后值时，观察 `() => form.name` 更清楚。

### 完整程序：观察 immediate 的第一次回调

文件：`src/App.vue`。

```vue
<script setup lang="ts">
import { ref, watch } from 'vue';
const name = ref('张三');
const record = ref('');
watch(name, (newValue, oldValue) => {
    if (oldValue === undefined) {
        record.value = `首次执行，当前姓名为 ${newValue}`;
    } else {
        record.value = `姓名由 ${oldValue} 变为 ${newValue}`;
    }
}, { immediate: true });
function rename(): void { name.value = '李四'; }
</script>

<template>
    <p>姓名：{{ name }}</p>
    <p>变化记录：{{ record }}</p>
    <button @click="rename">改为李四</button>
</template>
```

有 immediate 时，初次显示就出现“首次执行，当前姓名为张三”。点击后出现“姓名由张三变为李四”。再次点击仍赋值为李四，没有新的值变化，通常不会再触发一次相同值的回调。

删除第三个参数后，初始 record 为空；首次更名时才得到张三到李四。这就是“注册后立即执行一次”与“仅在以后变化时执行”的区别。

### 观察 getter 与观察其当前结果

`watch(() => form.name, callback)` 传入一个以后还能重新执行的读取函数；`watch(form.name, callback)` 只传入当时的字符串。前者保留“如何取得新值”的方法，后者只提供了“刚才读到的值”。

可以把 getter 想成一条读取路径，不要把它理解成“为了使用箭头函数而多加一层”。这一区别同样适用于观察 Props 的单个字段。

> [!EXERCISE] immediate 会不会重新创建组件
>
> immediate=true 时首次就执行一次 callback，是否说明组件被挂载了两次？
>
> 【答案】
>
> 不是。它只是 watch 的执行选项，在注册时调用一次回调；组件的创建与挂载次数由组件树和生命周期决定。不能用一次 watch 回调推断实例重新创建。


### computed 与 watch 的职责区别

姓名清理后的文本、筛选结果、当前页数组都属于“根据已有状态得到结果”，用 computed。记录姓名变更、对外发请求是“变化后执行动作”，用 watch。不要让 computed 一边返回数量、一边修改其他状态或发送请求。


### 完整程序：计算结果与变化记录

```vue
<script setup lang="ts">
import { reactive, computed, watch, ref } from 'vue'
const form = reactive({ name: '' })
const normalized = computed(() => form.name.trim())
const message = ref('尚未修改')
watch(() => form.name, (newValue, oldValue) => {
  message.value = `从“${oldValue}”变为“${newValue}”`
})
</script>
<template>
  <el-input v-model="form.name" />
  <p>清理后：{{ normalized }}</p>
  <p>{{ message }}</p>
</template>
```

> [!EXERCISE] 选择合适的工具
>
> “启用账户数量”和“姓名变化时记录日志”分别适合 computed 还是 watch？
>
> 【答案】
>
> 数量由现有数据推导，适合 computed；记录日志是副作用，适合 watch。不要用 watch 手动维护本来可以直接计算出的重复状态。

## 查询表单：先理解输入与 model 的关系

### el-form 和 el-form-item 分别做什么

el-form 组织一组表单字段，model 属性传入字段数据对象。el-form-item 包裹一个字段，label 表示用户看到的名称。

```vue
<el-form :model="query">
    <el-form-item label="姓名">
        <el-input v-model="query.name" />
    </el-form-item>
</el-form>
```

外层 `:model="query"` 让表单知道这组数据在哪里，不会自动替里面所有输入框完成绑定。输入框仍需 v-model 指向 query.name。label 只是文字，不是对象字段名。

### el-select 和 el-option：显示文字与实际值

el-select 是选择器，el-option 是候选项。用户选择哪一项，select 的 v-model 就接收该项的 value。

```vue
<el-select v-model="query.status">
    <el-option label="全部" value="" />
    <el-option label="启用" value="enabled" />
    <el-option label="停用" value="disabled" />
</el-select>
```

选择“启用”后，query.status 是字符串 enabled，不是中文“启用”。label 服务于展示，value 服务于业务处理。空字符串作为全部选项，是本例约定，不是所有下拉框都必须这样设计。

### 完整程序：观察选中值

```vue
<script setup lang="ts">
import { reactive } from 'vue';
const query = reactive({ status: '' });
</script>
<template>
    <el-form :model="query">
        <el-form-item label="状态">
            <el-select v-model="query.status">
                <el-option label="全部" value="" />
                <el-option label="启用" value="enabled" />
                <el-option label="停用" value="disabled" />
            </el-select>
        </el-form-item>
    </el-form>
    <p>程序接收到的值：{{ query.status }}</p>
</template>
```

初始选择“全部”，段落值为空。选择“停用”，段落显示 disabled。若要传数字或布尔值，应使用 `:value="1"` 或 `:value="true"`；没有冒号的 `value="true"` 是字符串，不能当布尔值处理。

### 完整程序：两个查询条件分别保存在哪里

这次增加姓名，但暂时不加入表格与筛选，只观察表单数据。文件：`src/App.vue`。

```vue
<script setup lang="ts">
import { reactive, ref } from 'vue';
const query = reactive({ name: '', status: '' });
const submitted = ref('尚未查询');
function submitQuery(): void {
    const statusText = query.status === '' ? '全部' : query.status;
    submitted.value = `提交的姓名：${query.name.trim()}；状态：${statusText}`;
}
function reset(): void {
    query.name = '';
    query.status = '';
    submitted.value = '已重置';
}
</script>

<template>
    <el-form :model="query">
        <el-form-item label="姓名">
            <el-input v-model="query.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="状态">
            <el-select v-model="query.status">
                <el-option label="全部" value="" />
                <el-option label="启用" value="enabled" />
                <el-option label="停用" value="disabled" />
            </el-select>
        </el-form-item>
    </el-form>
    <el-button @click="submitQuery">查询</el-button>
    <el-button @click="reset">重置</el-button>
    <p>正在输入：{{ query.name }} / {{ query.status }}</p>
    <p>{{ submitted }}</p>
</template>
```

输入张三并选择停用时，query 变成 `{ name: '张三', status: 'disabled' }`；“正在输入”一行立即变化，但 submitted 仍是尚未查询。点击查询后函数读取两个字段，才生成提交说明。

这说明表单容器并没有自动执行查询。el-form 组织字段，el-form-item 展示标签，控件 v-model 更新数据，查询函数决定何时使用数据。四个职责分别对应四处代码。

把 label 从姓名改为客户名称，数据仍保存在 query.name；把 v-model 改成 query.status，才会改变实际写入位置。排错时优先看绑定表达式，不要只看显示文字。

> [!EXERCISE] 忘记给输入框写 v-model
>
> 保留 el-form 的 :model="query"，但删掉姓名输入框的 v-model。用户仍能输入张三，query.name 会自动变为张三吗？
>
> 【答案】
>
> 不会。表单 model 不能替代控件绑定。输入框可以有自己的界面输入状态，但 query.name 没有与它连接，提交函数仍读取旧值。补回 v-model="query.name"。


## 表格：行数据与列配置

### el-table 接收数组

```vue
<el-table :data="accounts">
    <el-table-column prop="name" label="姓名" />
</el-table>
```

data 是当前需要展示的数组。el-table-column 配置一列，prop 指出每一行读取哪个字段，label 是表头。prop="name" 读取 row.name，不是名为 name 的顶层变量，也不是 type/interface 的名字。

### 完整程序：最小两列表格

```vue
<script setup lang="ts">
const accounts = [
    { id: 101, name: '张三' },
    { id: 102, name: '李四' }
];
</script>
<template>
    <el-table :data="accounts" row-key="id" border stripe>
        <el-table-column prop="id" label="编号" />
        <el-table-column prop="name" label="姓名" />
    </el-table>
</template>
```

两条记录生成两行，两个 column 生成两列。border 开启边框，stripe 开启交替行底色；它们没有改变数据。row-key="id" 告诉表格用每行 id 作为身份，不是把数字 id 传给表格。它与 v-for 的稳定 key 属于相近的身份管理思想。

### 自定义列：为什么需要插槽

普通 prop 列只能直接显示字段。若要把 active 显示成“启用/停用”，或在一行放编辑按钮，就需要告诉表格“这一格应该如何生成”。插槽是组件留给使用者填入模板的位置。

```vue
<el-table-column label="状态">
    <template #default="scope">
        {{ scope.row.active ? '启用' : '停用' }}
    </template>
</el-table-column>
```

`#default` 指定默认插槽；这里的 template 只是组织插槽内容，不会多生成一个 HTML template 元素。scope 接收表格提供的对象，其中 row 是当前行。scope 是自己起的局部变量名，不是固定关键字。

### 完整程序：通过当前行 ID 定位记录

```vue
<script setup lang="ts">
import { ref } from 'vue';
interface Account { id: number; name: string; active: boolean }
const accounts: Account[] = [
    { id: 101, name: '张三', active: true },
    { id: 102, name: '李四', active: false }
];
const selectedName = ref('');
function select(id: number): void {
    const account = accounts.find(item => item.id === id);
    if (account) selectedName.value = account.name;
}
</script>
<template>
    <el-table :data="accounts" row-key="id">
        <el-table-column prop="name" label="姓名" />
        <el-table-column label="状态">
            <template #default="scope">
                {{ scope.row.active ? '启用' : '停用' }}
            </template>
        </el-table-column>
        <el-table-column label="操作">
            <template #default="scope">
                <el-button @click="select(scope.row.id)">选择</el-button>
            </template>
        </el-table-column>
    </el-table>
    <p>选中：{{ selectedName }}</p>
</template>
```

点击第二行时，scope.row 是李四对应对象，scope.row.id 是 102。select 接收数字 ID，再从已声明为 Account[] 的数据中查找目标，最后更新姓名。当前行提供目标身份，源数组提供完整业务记录；这也避免把组件库宽泛的行对象类型直接当成 Account。第三天将解释如何让自己的组件提供插槽。

## 分页：先计算数组范围，再连接控件

### slice 如何得到当前页

```ts
const items = ['A', 'B', 'C', 'D', 'E'];
console.log(items.slice(0, 2)); // ['A', 'B']
console.log(items.slice(2, 4)); // ['C', 'D']
```

slice 的 start 包含在结果中，end 不包含，不修改原数组。每页两条时，第一页起点是 0，第二页起点是 2。

```ts
const start = (currentPage.value - 1) * pageSize;
return filtered.value.slice(start, start + pageSize);
```

currentPage 从 1 开始，数组下标从 0 开始，因此必须减 1。filtered 是筛选后的全部匹配记录，pageRows 是当前页片段，二者不可混用。

### el-pagination 的数据约定

```vue
<el-pagination
    v-model:current-page="currentPage"
    :page-size="pageSize"
    :total="filtered.length"
    layout="prev, pager, next"
/>
```

current-page 表示当前页；page-size 表示每页数量；total 是所有匹配记录数量；layout 选择上一页、页码、下一页区域。`v-model:current-page` 是命名双向绑定，用户点第二页后，它更新 currentPage，依赖该值的 computed 再切出新数组。第三天会解释这种绑定背后的 Prop 和事件协议。

分页控件不会自动替你切片；只绑定页码而始终给表格 source，表格仍显示全部记录。total 也不能写 pageRows.length，否则控件可能误以为永远只有一页。

### 完整程序：只学习分页，不加入查询

先把筛选拿掉，用五条确定记录验证分页公式。文件：`src/App.vue`。

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
const page = ref(1);
const pageSize = 2;
const pageRows = computed(() => {
    const start = (page.value - 1) * pageSize;
    return accounts.slice(start, start + pageSize);
});
</script>

<template>
    <p>当前页：{{ page }}；总记录：{{ accounts.length }}</p>
    <el-table :data="pageRows" row-key="id">
        <el-table-column prop="id" label="编号" />
        <el-table-column prop="name" label="名称" />
    </el-table>
    <el-pagination
        v-model:current-page="page"
        :page-size="pageSize"
        :total="accounts.length"
        layout="prev, pager, next"
    />
</template>
```

| 当前页 | start | end | 取得的下标 | 看到的账户 |
| --- | --- | --- | --- | --- |
| 1 | 0 | 2 | 0、1 | A、B |
| 2 | 2 | 4 | 2、3 | C、D |
| 3 | 4 | 6 | 4 | E |

end 超过数组长度时 slice 只取到实际存在的元素，不会自动补一条空账户。点击第三页后，page 变成 3，computed 返回一条记录，表格就显示一行。

如果将表格 :data 改成 accounts，分页控件仍能切换页码，但表格总是显示五条。这是绑定错数据源，不是分页控件没有响应。

如果将 total 改成 pageRows.length，第一页只有两条，分页控件会以为总共只有两条，因此很可能只显示一页。总条数与当前页条数必须分开。

### 前端分页和后端分页怎样区分

前端分页已经拿到全部匹配记录，因此可以 slice。后端分页只拿到当前页，响应通常还带 total；前端切页后需要再次发请求，不应该按全量偏移继续 slice 当前页数组。

例如后端返回第二页两条记录时，再从这两条中 slice(2,4) 就会得到空数组。看到第二页为空，应先判断分页到底由谁处理，而不是盲目调大 pageSize。

> [!EXERCISE] 修改每页条数
>
> 将本例 pageSize 改成 3，第一页和第二页分别显示哪些账户？total 应该随之改成 3 吗？
>
> 【答案】
>
> 第一页 A、B、C；第二页 D、E。total 仍是 5，因为数据总量没有变化。pageSize 描述每页容量，不是记录总数。


### 查询条件与已应用条件

若 computed 直接读取 query.name，输入时结果会即时变化。若产品要求点击查询才变化，应把编辑中的 query 与已经应用的 applied 分开。

```ts
function search() {
    applied.name = query.name.trim();
    applied.status = query.status;
    currentPage.value = 1;
}
```

这一函数同时提交两个条件并重置页码。下面的操作列继续传入 scope.row.id，再从 source.value 按 ID 找到记录。完整程序只组合本单元已解释的控件，不包含新增、编辑、删除和接口。


### 完整程序：筛选后分页

```vue
<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
interface Account { id: number; name: string; active: boolean }
const source = ref<Account[]>([
  { id: 1, name: '张三', active: true },
  { id: 2, name: '李四', active: false },
  { id: 3, name: '张小明', active: true }
])
const query = reactive({ name: '', status: '' })
const applied = reactive({ name: '', status: '' })
const currentPage = ref(1)
const pageSize = 2
const selectedName = ref('')
const filtered = computed(() => source.value.filter(item =>
  item.name.includes(applied.name) &&
  (applied.status === '' || item.active === (applied.status === 'enabled'))
))
const pageRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filtered.value.slice(start, start + pageSize)
})
function search() {
  applied.name = query.name.trim()
  applied.status = query.status
  currentPage.value = 1
}
function reset() {
  query.name = ''
  query.status = ''
  search()
}
function select(id: number) {
  const account = source.value.find(item => item.id === id)
  if (account) selectedName.value = account.name
}
</script>
<template>
  <el-form :model="query">
    <el-form-item label="姓名"><el-input v-model="query.name" /></el-form-item>
    <el-form-item label="状态">
      <el-select v-model="query.status">
        <el-option label="全部" value="" />
        <el-option label="启用" value="enabled" />
        <el-option label="停用" value="disabled" />
      </el-select>
    </el-form-item>
  </el-form>
  <el-button @click="search">查询</el-button>
  <el-button @click="reset">重置</el-button>
  <el-table :data="pageRows" row-key="id" border stripe>
    <el-table-column prop="name" label="姓名" />
    <el-table-column label="操作">
      <template #default="scope">
        <el-button @click="select(scope.row.id)">选择</el-button>
      </template>
    </el-table-column>
  </el-table>
  <el-pagination v-model:current-page="currentPage" :page-size="pageSize"
    :total="filtered.length" layout="prev, pager, next" />
  <p>选中：{{ selectedName }}</p>
</template>
```

`query` 保存正在输入的条件，`applied` 保存点击查询时的条件。因此输入不会立即改变表格。前端分页先取得全部数据再切片；后端分页把页码、页大小和条件交给服务器，只接收当前页和总条数，不能再次按全量偏移切片。

> [!EXERCISE] 查询后空白
>
> 当前在第二页，查询结果只有一条，为什么可能看不到数据？本例哪里避免了这个问题？
>
> 【答案】
>
> 第二页从索引 2 开始切片，一条数据没有该位置。search 把 currentPage 设为 1。分页 total 应取筛选后的总量，不是当前页长度。

## 表单校验：数据、规则与字段如何连接

### 为什么需要校验

表单不能仅靠“用户应该输入正确内容”。提交前需要明确检查姓名是否存在、长度是否满足约定，并把错误定位到对应字段。前端校验改善反馈，后端仍需独立验证输入。

### rules：规则按 model 字段组织

```ts
const form = reactive({ name: '' });
const rules = {
    name: [
        { required: true, message: '请输入姓名', trigger: 'blur' },
        { min: 2, max: 20, message: '姓名长度为 2～20', trigger: 'blur' }
    ]
};
```

rules.name 是 name 字段的规则数组，可以先检查必填再检查长度。required 表示必填，message 是提示文字。此处值为字符串，min/max 表示长度；不能不区分字段类型就把它们解释为数值大小。

trigger='blur' 表示失去焦点时触发相关交互校验；trigger='change' 表示值变化时触发。主动 validate 还会执行完整校验，不应认为只有先手动失焦才能提交检查。

### model、prop 与 v-model 各做一步

```vue
<el-form :model="form" :rules="rules">
    <el-form-item label="姓名" prop="name">
        <el-input v-model="form.name" />
    </el-form-item>
</el-form>
```

model 提供数据对象，rules 提供规则对象，表单项 prop 连接其中的 name 字段，输入框 v-model 实际读写 form.name。四个位置共同组成链条。只绑定 rules 而没有正确 prop，表单就无法按预期定位字段。

这里 label 是“姓名”也可以写“账户名称”，不会影响字段路径；prop 必须对应实际字段，不能跟着中文显示文字随意改。

### 从一条规则看完整的校验对应关系

以姓名 name 为例，检查顺序是：找到 el-form 的 model=form；找到 el-form-item 的 prop=name；据此读取 form.name；再取 rules.name 中的规则；失败提示显示在对应表单项下。

```text
el-form 的 model=form
  → el-form-item 的 prop=name
    → 待验证值 form.name
      → 对应规则 rules.name
        → 当前字段的提示区域
```

这里的箭头是代码阅读路径，不是要求自己写这些内部步骤。开发者要做的是让名称正确对上，Element Plus 才能按约定执行。

如果 form.name 已经更新，但校验始终不工作，应先对照 prop 与规则键，而不是再增加一个 watch 强制触发。

### required 与长度规则是两个条件

required 检查是否提供值；字符串长度规则检查字符长度范围。输入一个字时 required 可以通过，min=2 仍会失败。只设置 required 不能保证姓名足够长，只设置长度也未必等同于业务必填。

空白字符需要业务清理。如果允许输入前后空格，建议提交前 trim，然后再校验。后续综合程序采用此顺序，避免纯空格看起来有长度却没有实际内容。

### blur 与 change 不决定是否能主动校验

blur 指输入失去焦点时的交互触发，change 指值变化时的相关触发。点击提交调用 validate 时，会主动检查规则，不能因为用户没先点开再离开输入框，就跳过必填。

这也是为什么表单有两条反馈路径：输入过程及时提醒；提交前统一确认。二者服务于不同操作时机。


## 模板引用：调用表单组件提供的方法

### 状态 ref 与组件 ref 的区别

第一天的 ref('') 用来保存输入字符串；这里的 ref<FormInstance>() 用来保存表单组件实例。它们都使用 ref 容器，但里面的值含义不同。

```ts
import { ref } from 'vue';
import type { FormInstance } from 'element-plus';
const formRef = ref<FormInstance>();
```

```vue
<el-form ref="formRef" :model="form">...</el-form>
```

模板的 `ref="formRef"` 指向脚本中同名引用，组件挂载后 Vue 才填入实例。初始化阶段或被 v-if 移除后，它可能不存在；不能在文件第一行就假设有 validate 方法。

### validate、resetFields 与 clearValidate

```ts
await formRef.value.validate();
formRef.value?.resetFields();
formRef.value?.clearValidate();
```

第一行主动校验；第二行恢复字段记录的初始值并清除提示；第三行只清除提示，不改变值。可选链在组件未就绪时跳过方法调用。resetFields 依赖表单记录的初始值，不保证永远清空，也不一定是本次编辑记录的业务快照。

FormInstance 描述实例 API，FormRules<FormData> 描述与业务字段匹配的规则结构。它们只在类型检查阶段存在，因此使用 import type。

## validate 的异步结果：先学最小控制流程

### Promise 表示稍后完成的操作

校验可能包含异步规则。validate 返回 Promise；成功时继续后续语句，失败时拒绝。async 声明函数可以使用 await；await 等待结果，不会冻结整个网页。

```ts
async function submit() {
    try {
        await formRef.value.validate();
        console.log('校验通过，才执行这里');
    } catch {
        console.log('校验失败，进入这里');
    }
}
```

try 包围可能失败的代码；catch 处理失败。不要调用 validate 后马上无条件保存，否则校验还没完成就已提交。完整示例还先检查实例存在，再开始校验；第四天将同样的流程用于请求。


### 完整程序：独立新增表单

```vue
<script setup lang="ts">
import { reactive, ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
interface FormData { name: string }
const form = reactive<FormData>({ name: '' })
const formRef = ref<FormInstance>()
const result = ref('')
const rules: FormRules<FormData> = {
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '姓名长度为 2～20', trigger: 'blur' }
  ]
}
async function submit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    result.value = `已通过校验：${form.name}`
  } catch {
    result.value = '请修正表单'
  }
}
function reset() {
  formRef.value?.resetFields()
  result.value = ''
}
</script>
<template>
  <el-form ref="formRef" :model="form" :rules="rules">
    <el-form-item label="姓名" prop="name">
      <el-input v-model="form.name" />
    </el-form-item>
  </el-form>
  <el-button @click="submit">校验</el-button>
  <el-button @click="reset">重置</el-button>
  <p>{{ result }}</p>
</template>
```

`resetFields()` 恢复字段记录的初始值并清除校验，不保证恢复成业务需要的空值；`clearValidate()` 只移除校验提示，不改数据。新增和编辑共用表单时应明确给字段赋值，不把 resetFields 当作任意业务快照恢复工具。

> [!EXERCISE] 校验没有触发
>
> model 使用 form.name，rules 的键是 name，但表单项写成 `prop="username"`，应怎样修复？
>
> 【答案】
>
> 改成 `prop="name"`。model 字段路径、规则键和表单项 prop 必须对应。不能只修改 label，它仅影响文字。


### 独立表单的操作过程

1. 初始 name 是空字符串，result 为空，没有提交成功信息。
2. 不输入内容直接校验，required 不通过，进入 catch，字段显示错误提示。
3. 输入一个字后校验，必填通过但长度失败；并不是第一条规则通过就必然允许提交。
4. 输入“张三”再校验，await 正常结束，然后才设置“已通过校验”。
5. 点击重置，字段恢复初始化时的空值，提示和 result 被清理。

`result` 是示范反馈，不代表已经把数据保存到服务器。本单元只验证表单机制，接口保存留到第四、第五天。

> [!EXERCISE] 清除提示还是清空数据
>
> 编辑表单已经回填“张三”，切换记录时只想去掉旧错误提示，应调用哪个方法？如果需要把字段改成“李四”，哪个方法会自动完成？
>
> 【答案】
>
> 只清提示用 clearValidate。两个清理方法都不负责按业务选择另一条记录；应明确给 form.name 赋值为李四，然后按需清除提示。resetFields 恢复的是被记录的初始值，不能替代任意编辑回填逻辑。


## 重置与清除校验：用实际初始值比较

### 三个操作并不相同

“恢复原始值”“清空输入”“只去掉红字”经常被统称为重置，但代码动作不同。先明确用户要哪一种，再选择方法。

- resetFields：恢复表单记录的初始值，并清除校验提示。
- clearValidate：清除提示，保留输入值。
- 给 form.name 赋空字符串：改变数据，不承诺等同于以上两种方法。

### 完整程序：初始姓名不是空字符串

文件：`src/App.vue`。

```vue
<script setup lang="ts">
import { reactive, ref } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
interface FormData { name: string }
const form = reactive<FormData>({ name: '张三' });
const formRef = ref<FormInstance>();
const rules: FormRules<FormData> = {
    name: [{ required: true, message: '姓名不能为空', trigger: 'blur' }]
};
const message = ref('');
async function validate(): Promise<void> {
    if (!formRef.value) return;
    try {
        await formRef.value.validate();
        message.value = '通过';
    } catch {
        message.value = '未通过';
    }
}
function reset(): void {
    formRef.value?.resetFields();
    message.value = '恢复表单记录的初始值';
}
function clearError(): void {
    formRef.value?.clearValidate();
    message.value = '只清除了校验提示';
}
function clearInput(): void {
    form.name = '';
    message.value = '只把字段改为空字符串';
}
</script>

<template>
    <el-form ref="formRef" :model="form" :rules="rules">
        <el-form-item label="姓名" prop="name">
            <el-input v-model="form.name" />
        </el-form-item>
    </el-form>
    <el-button @click="validate">校验</el-button>
    <el-button @click="reset">恢复初始值</el-button>
    <el-button @click="clearError">只清提示</el-button>
    <el-button @click="clearInput">只清输入</el-button>
    <p>当前数据：{{ form.name }}</p>
    <p>{{ message }}</p>
</template>
```

按下面顺序验证，而不是只点一次看有没有红字：初次姓名张三；清空输入后点击校验，显示错误；点击只清提示，错误消失但输入仍为空；再点击恢复初始值，姓名回到张三。

因此 resetFields 不等于“清空”。这个表单初始值就是张三，恢复的自然是张三。编辑对话框切换记录时，应明确初始化或回填业务字段，不能依赖某一次旧初始值碰巧符合需求。

Element Plus 新版本还提供设置初始值的扩展 API，本课不依赖它，保证先理解数据赋值与校验提示是两件事。方法的版本边界可查阅 [Element Plus 表单文档](https://element-plus.org/en-US/component/form)。

> [!EXERCISE] 编辑取消时恢复什么
>
> 假设表单首次挂载值是张三，后来回填李四并编辑为李小明。取消时业务要求恢复本次打开的李四，能不加判断地调用 resetFields 吗？
>
> 【答案】
>
> 不能假定它保存了本次打开的李四。应在打开时记录本次业务快照，取消时按快照恢复，或关闭并重新从当前记录初始化。表单记录的初始值与业务编辑快照可能不是同一时刻的数据。


## 拓展：数组修改与编辑副本

### 四种数组处理分别改变什么

```ts
const rows = [
    { id: 1, name: '张三' },
    { id: 2, name: '李四' }
];
rows.push({ id: 3, name: '王五' }); // 原数组增加一条
const kept = rows.filter(row => row.id !== 2); // 新数组，不包含 ID 2
const renamed = rows.map(row => row.id === 1 ? { ...row, name: '张小明' } : row);
const selected = rows.find(row => row.id === 1); // 单个对象或 undefined
```

push 原地修改；filter 和 map 返回新数组，必须把结果交给后续状态才能改变页面；find 返回对象，不是数组。map 中的三元表达式只替换目标 ID，其他对象继续使用原引用。为 ref 数组整体赋值时写 rows.value = 新数组。

### filter 与 map 都返回数组，但目的不同

```ts
const source = [
    { id: 1, name: '张三' },
    { id: 2, name: '李四' }
];
const remaining = source.filter(item => item.id !== 1);
const renamed = source.map(item => item.id === 1
    ? { ...item, name: '张小明' } : item);
```

remaining 只包含李四，长度从 2 变成 1；renamed 仍有两条，只把 ID 1 的姓名改为张小明。filter 决定某个元素保不保留，map 决定这个位置放什么结果。

两种操作都没有把新数组自动写回 source。页面使用 ref 数组时，要明确 `rows.value = ...`，否则模板仍读原来的值。

### find 返回一条，不是长度为一的数组

```ts
const found = source.find(item => item.id === 1);
const missing = source.find(item => item.id === 999);
```

found 是 `{ id: 1, name: '张三' }`，missing 是 undefined。find 不删除记录，也不复制对象；found 仍指向源数组中的那个对象。若直接改 found.name，源对象也会改变。

要编辑后允许取消，应先找到记录，再复制可编辑字段到草稿。不能因为 find 返回了一条，就误以为它已经帮你创建了安全副本。

### 完整程序：按 ID 新增、改名与删除

本例只处理数组，不包含查询、分页、弹窗和接口。文件：`src/App.vue`。

```vue
<script setup lang="ts">
import { ref } from 'vue';
interface Account { id: number; name: string }
const rows = ref<Account[]>([
    { id: 1, name: '张三' },
    { id: 2, name: '李四' }
]);
let nextId = 3;
function add(): void {
    rows.value.push({ id: nextId++, name: '新账户' });
}
function rename(id: number): void {
    rows.value = rows.value.map(item => item.id === id
        ? { ...item, name: item.name + '（已修改）' } : item);
}
function remove(id: number): void {
    rows.value = rows.value.filter(item => item.id !== id);
}
</script>

<template>
    <button @click="add">新增一条</button>
    <ul>
        <li v-for="row in rows" :key="row.id">
            {{ row.id }}：{{ row.name }}
            <button @click="rename(row.id)">改名</button>
            <button @click="remove(row.id)">删除</button>
        </li>
    </ul>
</template>
```

初始两条。新增时 push 改变 ref 内数组，Vue 能跟踪它；改名时 map 生成新数组，赋回 rows.value；删除时 filter 生成新数组，也赋回同一状态。

nextId++ 先使用当前数字，再增加一。删除 ID 2 后新增，会得到 ID 3，而不是按数组当前长度重新生成 2。业务 ID 应保持唯一，不能把“当前有几条”当成永远不冲突的生成规则。

> [!EXERCISE] map 中漏掉其他行
>
> 改名时写成 rows.value.map(item => { if (item.id === id) return { ...item, name: '新名' } })，非目标行会怎样？
>
> 【答案】
>
> 非目标分支没有 return，结果数组对应位置变为 undefined，而不是自动保留原记录。应在其他分支返回 item，或使用本例的三元表达式。map 会为每个位置收集回调结果，不具备“没有返回就维持原值”的规则。

### 数据副本与取消编辑

```ts
const record = { id: 1, name: '张三' };
const draft = { ...record };
draft.name = '李四';
console.log(record.name); // 张三
```

展开语法把第一层属性复制到新对象。它与 `const draft = record` 不同，后者是同一对象的两个引用，修改 draft.name 也会修改 record.name。真实对象如果含嵌套地址对象，浅副本里的 address 仍共享，需要按业务复制嵌套字段。

### 新增模式与编辑模式

新增初始化空字段，编辑从选中记录复制字段，并保存目标 ID。保存时根据模式决定新增还是替换；取消只丢弃草稿。不要把表格行索引当 ID，排序和分页后索引会变化。

### el-dialog 的可见性、标题与底部插槽

```vue
<el-dialog v-model="visible" title="编辑账户" width="500px">
    <el-input v-model="draft.name" />
    <template #footer>
        <el-button @click="save">保存</el-button>
    </template>
</el-dialog>
```

visible 为 true 时打开，false 时关闭。title 是弹窗标题，width 是宽度。`#footer` 将操作按钮放到组件预留的底部位置，插槽内容仍可访问当前页面的 save 函数。输入框不会因为放进弹窗就自动拥有校验规则。

`@open="handleOpen"` 在开始打开时触发；`@opened="handleOpened"` 在动画结束后触发，适合依赖已显示布局的操作。首次打开前，弹窗内部表单可能尚未挂载，不能在设置 visible 的下一句就无条件调用 formRef。下面示例没有依赖组件实例的方法，先理解草稿与可见性即可。

`push` 添加元素并改变原数组；`filter` 常用于删除；`map` 返回转换后的新数组，适合按 ID 替换；`find` 定位一条记录。对 ref 数组整体赋值要写 `.value`，数组内部修改如 `rows.value.push(record)` 可以被追踪。

展开语法 `{ ...row }` 创建浅副本，只复制第一层属性。编辑扁平记录时，用副本可以避免输入尚未保存就修改表格；嵌套对象仍共享引用，需要按业务复制嵌套字段。新增模式没有旧 ID，编辑模式必须保留目标 ID；不要用当前表格索引充当持久标识。

`el-dialog` 用 `v-model` 控制可见性，`title` 设置标题，`width` 设置宽度；`open` 在打开流程开始时触发，`opened` 在打开动画结束后触发。`#footer` 是底部具名插槽。首次打开时内部内容可能尚未挂载，不能在设置 visible 的同一瞬间就假定内部 formRef 已就绪。

### 先单独验证弹窗可见性

下面只有一个布尔状态，不包含表单和编辑数据。文件：`src/App.vue`。

```vue
<script setup lang="ts">
import { ref } from 'vue';
const visible = ref(false);
function open(): void { visible.value = true; }
function close(): void { visible.value = false; }
</script>

<template>
    <el-button @click="open">打开说明</el-button>
    <el-dialog v-model="visible" title="账户说明" width="500px">
        <p>此弹窗只用于说明账户规则。</p>
        <template #footer>
            <el-button @click="close">知道了</el-button>
        </template>
    </el-dialog>
    <p>可见状态：{{ visible }}</p>
</template>
```

初始 visible=false，弹窗关闭。点击打开，状态为 true；点击知道了，函数改回 false。点击组件自己的关闭按钮，也会通过 v-model 协议把父 visible 改为 false。

title 只决定标题，width 只决定宽度，#footer 只决定按钮放在哪个预留位置。它们不会替你初始化草稿或保存记录。确认这个最小程序后，再运行下面独立编辑弹窗，才能分辨可见性错误与草稿错误。

### 编辑弹窗的四个时刻

打开前：从 record 复制草稿；打开后：输入只修改 draft；保存时：复制 draft 到 record 再关闭；取消时：只关闭，下次打开重新复制 record。

因此取消不需要“反向撤销每次输入”。只要输入从未修改原始记录，丢弃草稿就足够。下一份程序正是按这一顺序实现。


### 完整程序：独立编辑弹窗

```vue
<script setup lang="ts">
import { ref } from 'vue'
const record = ref({ id: 1, name: '张三' })
const draft = ref({ id: 1, name: '' })
const visible = ref(false)
function open() {
  draft.value = { ...record.value }
  visible.value = true
}
function save() {
  record.value = { ...draft.value }
  visible.value = false
}
</script>
<template>
  <p>{{ record.name }}</p>
  <el-button @click="open">编辑</el-button>
  <el-dialog v-model="visible" title="编辑账户" width="500px">
    <el-input v-model="draft.name" />
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button @click="save">保存</el-button>
    </template>
  </el-dialog>
</template>
```

取消不修改 record；再次打开重新复制当前记录。这个示例只解释副本和弹窗，不代表已完成真实接口提交或校验。

## 当日验收与资料

能够新增表格列、调整分页、修改姓名长度规则，并解释“计算值”和“副作用”的区别，即完成主线。复盘时优先检查 computed 是否 return、表单 prop 是否匹配、查询是否重置页码。

- [Vue TypeScript 组合式 API](https://vuejs.org/guide/typescript/composition-api)
- [Vue watch](https://vuejs.org/guide/essentials/watchers)
- [Element Plus 表单](https://element-plus.org/en-US/component/form.html)
