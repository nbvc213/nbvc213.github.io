---
id: vue-course-day-3
title: "Vue 企业开发 · 第三天：组件如何协作"
folder: miscellaneous
order: 1103
date: 2026-11-01
updated: 2026-11-01
tags: [Vue, 组件通信]
description: "依次学习组件创建、Props、Emit、双向绑定、插槽与生命周期。"
pinned: false
draft: false
---

## 学习安排

沿用第一天工程和 main.ts。每个单元给出的文件都是该单元完整文件；切换单元时替换 App.vue，未被导入的旧组件不会显示。顺序为组件创建 15 分钟、Props 20 分钟、Emit 20 分钟、双向绑定 20 分钟、插槽 15 分钟、生命周期与练习 30 分钟。Composable 与 Router 放在拓展区，不作为第五天代码的隐含依赖。

> [!NOTE] 本篇的阅读方式
>
> 主线按当天目标推进，完整解释用于随时回查。遇到新写法时先读它自己的小例与结果，再运行本单元完整文件；不需要把所有例子合并。两小时是主线学习目标，不代表必须在两小时内逐字读完并运行所有对照实验。练习答案紧随题目，完成自己的判断后再展开。

## 创建、导入与使用组件

组件把一块界面及其行为封装起来。引用其他组件的组件称为父组件，被引用者称为子组件。这是相对关系，不是文件夹名称决定的身份。同一个组件文件可以产生多个实例，每个实例执行自己的 setup，拥有独立的局部状态。

### 组件定义与组件实例

AccountCounter.vue 文件描述“这种计数器怎样工作”，组件实例则是页面上实际使用的某一个计数器。同一份定义可以在模板中使用两次，不需要复制两个文件。

```vue
<AccountCounter />
<AccountCounter />
```

这两处标签分别创建实例。若 count 定义在组件的 script setup 内，创建每个实例时都会执行初始化，因此两个实例各有自己的 count。后面 Pinia 的共享状态则是另一种明确设计，不能混同。

### 创建子组件的三个动作

先创建文件，再导入文件，最后在模板使用导入名。文件存在于 components 文件夹，不代表 Vue 会自动在所有页面注册它。

```ts
import AccountCounter from './components/AccountCounter.vue';
```

这里 `./` 从当前 App.vue 所在目录出发，导入名 AccountCounter 将在模板中使用。路径错误先检查文件是否存在、目录是否相对当前文件、大小写是否一致。

```vue
<template>
    <AccountCounter />
</template>
```

script setup 让导入的组件直接可用于当前模板，不需要另写 components 注册对象。这个规则局限于当前使用方式，不能推广为所有脚本写法都自动注册。

### 创建组件不是复制业务状态

本单元只做计数器，没有 Props、Emit 和接口。先确认组件能正确显示、两个实例状态独立，再让父组件传数据。这样出现问题时可以区分“没有导入组件”与“通信参数错误”。

下面两个文件构成这一单元的完整程序。保留第一天 main.ts，不需要路由配置。


创建 `src/components/AccountCounter.vue`。这是普通路径，无须预先注册一个“components 文件夹”。

```vue
<script setup lang="ts">
import { ref } from 'vue'
const count = ref(0)
function increase() { count.value += 1 }
</script>
<template>
  <button @click="increase">已查看 {{ count }} 次</button>
</template>
```

完整 `src/App.vue`：

```vue
<script setup lang="ts">
import AccountCounter from './components/AccountCounter.vue'
</script>
<template>
  <AccountCounter />
  <AccountCounter />
</template>
```

`script setup` 中导入组件后，可直接将导入名用作模板标签。两个按钮的 count 各自独立。若用 `v-for` 渲染子组件，仍要用稳定业务 ID 作为 key。

> [!EXERCISE] 预测实例状态
>
> 先点击第一个按钮两次，再点击第二个一次，各显示多少？
>
> 【答案】
>
> 分别为 2 和 1。它们来自同一个组件定义，但不是同一个组件实例；只有显式使用共享状态才会相互影响。

## Props：让父组件决定子组件显示什么

### 从“写死姓名”到“接收姓名”

先考虑一个不接收外部数据的子组件：

```vue
<template>
    <p>账户名称：储蓄账户</p>
</template>
```

无论父组件在哪里使用它，都会显示储蓄账户。如果页面有三种账户，就要改子组件或复制文件，这不利于复用。

我们希望保留同一种显示结构，让父组件分别指定储蓄账户、工资账户或理财账户。**Props 就是父组件传给子组件的数据。** 子组件先声明自己接收哪些数据，父组件再按这些名称传值。

它与普通函数的参数可以对照理解：函数先声明参数 name，调用者再传入具体字符串；组件先声明 Prop name，父组件再通过标签属性传入具体值。组件的输入还能随父状态变化而更新，不是只在创建时读一次。

### defineProps 的各部分分别表示什么

先只看一个必填姓名：

```ts
const props = defineProps<{ name: string }>();
```

从内向外拆开理解：

- `{ name: string }` 描述输入数据的结构：有一个名为 name 的属性，值为字符串。
- `<...>` 把这个类型交给 defineProps，帮助编译器和编辑器检查父组件传值。
- `defineProps()` 声明当前组件接收这些 Props。
- 返回值赋给 props，脚本就可以通过 props.name 读取当前收到的姓名。

props 是当前文件选择的变量名，通常沿用这个名字方便阅读；name 是对外约定的属性名，父组件必须按 name 传值。两者的地位不同。

defineProps 是 Vue 的编译宏，也就是编译器会专门处理的语法。它在 script setup 中直接使用，不用写 `import { defineProps } from 'vue'`。一个组件里不要为了增加第二个属性再调用一次 defineProps，应把属性放进同一份声明。

### 必填属性：父组件必须明确提供

```ts
interface Props {
    name: string;
}
const props = defineProps<Props>();
```

interface Props 与前面的内联对象类型描述同一件事：name 必须存在且为字符串。Props 首字母大写是类型名称的习惯，不是 Vue 自动识别的特殊名字。

父组件正确写法：

```vue
<RequiredAccount name="储蓄账户" />
```

这里传的是固定字符串。若写 `<RequiredAccount />` 而未传 name，类型工具会提示缺少必填属性，开发模式下 Vue 也会给出对应警告。**“必填”是给组件使用者的要求，不是让 Vue 自动替用户创造一个姓名。**

### 完整程序：同一组件接收两个不同姓名

文件：`src/components/RequiredAccount.vue`。

```vue
<script setup lang="ts">
interface Props {
    name: string;
}
const props = defineProps<Props>();
</script>

<template>
    <p>账户名称：{{ props.name }}</p>
</template>
```

文件：`src/App.vue`。

```vue
<script setup lang="ts">
import RequiredAccount from './components/RequiredAccount.vue';
</script>

<template>
    <RequiredAccount name="储蓄账户" />
    <RequiredAccount name="工资账户" />
</template>
```

页面依次显示“账户名称：储蓄账户”和“账户名称：工资账户”。两行来自同一份组件定义，差别来自父组件传入的值。

第一行创建子实例时收到 name='储蓄账户'；第二行创建另一个实例时收到 name='工资账户'。两个实例各自读取自己的 props.name，不会因为都叫 name 而覆盖彼此。

### 动态属性：传变量要加冒号

假设父组件声明：

```ts
const selectedName = ref('理财账户');
```

下面两种写法不同：

```vue
<RequiredAccount name="selectedName" />
<RequiredAccount :name="selectedName" />
```

第一行把 selectedName 当成普通字符串，子组件显示这十二个英文字母。第二行把 selectedName 当成父模板表达式，读取其当前值，因此显示理财账户。

冒号左边 name 是子组件接收的属性；右边 selectedName 是父组件的变量。左边和右边不要求同名，不要为了“看起来对应”就误以为两个组件共享了一个局部变量。

### 完整程序：父状态变化后子显示跟随变化

文件：`src/components/LiveAccount.vue`。

```vue
<script setup lang="ts">
const props = defineProps<{ name: string }>();
</script>

<template>
    <p>子组件收到：{{ props.name }}</p>
</template>
```

文件：`src/App.vue`。

```vue
<script setup lang="ts">
import { ref } from 'vue';
import LiveAccount from './components/LiveAccount.vue';
const selectedName = ref('储蓄账户');
function changeName(): void {
    selectedName.value = '理财账户';
}
</script>

<template>
    <p>父组件状态：{{ selectedName }}</p>
    <button @click="changeName">切换到理财账户</button>
    <LiveAccount :name="selectedName" />
</template>
```

初次显示时父与子都显示储蓄账户。点击后先执行父函数，修改 selectedName.value；父模板绑定重新取得理财账户，子 props.name 更新，子模板随之改变。

这条数据流是“父状态 → 父绑定 → 子 Props → 子显示”。子组件没有调用父函数，也没有自己维护第二份姓名副本。

### 可选属性：允许父组件省略，但要处理省略后的值

有些账户需要显示说明，有些没有。可以让说明可选：

```ts
interface Props {
    name: string;
    description?: string;
}
```

name 没有问号，仍然必填；description 带问号，父组件可以不传。对这里的可选字符串而言，未传且无默认值时，子组件收到 undefined。

这与空字符串不同：空字符串表示确实传了一个长度为零的字符串；undefined 表示当前没有这个值。模板应明确决定没有说明时是否隐藏这一行，而不是直接调用 description.trim()。

### 完整程序：有说明和无说明的账户

文件：`src/components/OptionalAccount.vue`。

```vue
<script setup lang="ts">
interface Props {
    name: string;
    description?: string;
}
const props = defineProps<Props>();
</script>

<template>
    <section>
        <h3>{{ props.name }}</h3>
        <p v-if="props.description !== undefined">说明：{{ props.description }}</p>
        <p v-else>未提供账户说明</p>
    </section>
</template>
```

文件：`src/App.vue`。

```vue
<script setup lang="ts">
import OptionalAccount from './components/OptionalAccount.vue';
</script>

<template>
    <OptionalAccount name="储蓄账户" description="用于日常收支" />
    <OptionalAccount name="工资账户" />
    <OptionalAccount name="理财账户" description="" />
</template>
```

结果分三种：第一组显示“用于日常收支”；第二组显示“未提供账户说明”；第三组显示“说明：”但没有后续文字，因为空字符串不等于 undefined。

如果业务把空字符串也视为没有说明，可以改成 v-if="props.description"。这是一项显示规则变化，不是 TypeScript 可选属性规则发生变化。

> [!EXERCISE] 省略与空字符串
>
> 将上例判断改成 v-if="props.description" 后，第二组和第三组分别显示什么？为什么？
>
> 【答案】
>
> 两组都显示未提供账户说明。undefined 和空字符串在条件判断中都为假；原来的 !== undefined 则只排除 undefined。因此，同一个属性的类型不变，模板条件不同，也会产生不同的显示规则。

### 默认值：在没有提供值时使用指定内容

现在希望没有说明时显示“暂无说明”，不让每个父组件重复填写。可以通过 withDefaults 设置默认值。

先把两步分开看：

```ts
interface Props {
    name: string;
    description?: string;
}
```

这一步只描述“说明可选”。它还没有规定默认文字。随后：

```ts
const props = withDefaults(defineProps<Props>(), {
    description: '暂无说明'
});
```

withDefaults 的第一个参数是 defineProps 的结果，表示给哪一组输入设置默认值；第二个参数是默认值对象，键 description 必须对应属性名，值为要使用的默认内容。

默认值不是“只要内容不满意就替换”。它在收到 undefined 时生效，包括省略该属性；父组件传入空字符串时仍保留空字符串，不会替换为暂无说明。

### 完整程序：比较默认值生效与不生效的情况

文件：`src/components/DefaultAccount.vue`。

```vue
<script setup lang="ts">
interface Props {
    name: string;
    description?: string;
}
const props = withDefaults(defineProps<Props>(), {
    description: '暂无说明'
});
</script>

<template>
    <section>
        <h3>{{ props.name }}</h3>
        <p>说明：{{ props.description }}</p>
    </section>
</template>
```

文件：`src/App.vue`。

```vue
<script setup lang="ts">
import DefaultAccount from './components/DefaultAccount.vue';
</script>

<template>
    <DefaultAccount name="储蓄账户" />
    <DefaultAccount name="工资账户" description="企业代发工资" />
    <DefaultAccount name="理财账户" description="" />
</template>
```

| 父组件传法 | 子组件 description | 页面说明 |
| --- | --- | --- |
| 不传 description | 暂无说明 | 使用默认值 |
| 传企业代发工资 | 企业代发工资 | 使用传入值 |
| 传空字符串 | 空字符串 | 不使用默认值 |

默认值放在子组件中，是为了让所有使用者遵守同一项缺省规则。它没有修改父组件的变量，只决定子组件本次输入解析后的值。

### 布尔属性需要单独理解

截图中的 active 是布尔属性。Vue 对布尔 Props 有特殊转换规则，不能直接照搬可选字符串的结论。

在常见的类型声明 `active?: boolean` 中，Vue 编译得到布尔 Prop：省略时通常转换为 false，写裸属性 active 通常表示 true；明确绑定 `:active="false"` 则为 false。

若我们明确设置默认值 true，省略时使用 true；父端明确传入 false 时仍然是 false。默认 true 不会覆盖显式 false。

### 完整程序：布尔默认值与显式 false

文件：`src/components/BooleanAccount.vue`。

```vue
<script setup lang="ts">
const props = withDefaults(defineProps<{
    name: string;
    active?: boolean;
}>(), {
    active: true
});
</script>

<template>
    <p>{{ props.name }}：{{ props.active ? '启用' : '停用' }}</p>
</template>
```

文件：`src/App.vue`。

```vue
<script setup lang="ts">
import BooleanAccount from './components/BooleanAccount.vue';
</script>

<template>
    <BooleanAccount name="储蓄账户" />
    <BooleanAccount name="工资账户" :active="false" />
    <BooleanAccount name="理财账户" :active="true" />
</template>
```

结果依次是启用、停用、启用。第一行没传，使用默认 true；第二行传了布尔 false，不触发默认替换；第三行明确传 true。

不要写 active="false" 来表示布尔假。这是字符串，不符合当前声明。需要传布尔表达式时使用冒号，和第一天的动态属性规则一致。

关于省略布尔属性的转换及默认值触发条件，可查阅 [Vue Props 官方说明](https://vuejs.org/guide/components/props)。

### 对象 Props：类型、变量和属性名逐一对照

实际页面常传整个账户对象：

```ts
interface Account {
    id: number;
    name: string;
}
const props = defineProps<{ account: Account }>();
```

这里 Account 是类型，account 是子组件接收的属性名，props.account 是收到的具体对象。它们不是同一个东西。

父端 `:account="selectedAccount"` 左边对应子 account，右边对应父变量 selectedAccount。子读取 props.account.name，父读取 selectedAccount.value.name。两个文件的局部变量不会因这次传递而合并。

### 完整程序：父组件修改对象字段

文件：`src/components/ObjectAccount.vue`。

```vue
<script setup lang="ts">
interface Account {
    id: number;
    name: string;
}
const props = defineProps<{ account: Account }>();
</script>

<template>
    <p>编号：{{ props.account.id }}</p>
    <p>名称：{{ props.account.name }}</p>
</template>
```

文件：`src/App.vue`。

```vue
<script setup lang="ts">
import { ref } from 'vue';
import ObjectAccount from './components/ObjectAccount.vue';
const selectedAccount = ref({ id: 101, name: '储蓄账户' });
function rename(): void {
    selectedAccount.value.name = '日常结算账户';
}
</script>

<template>
    <button @click="rename">父组件修改名称</button>
    <ObjectAccount :account="selectedAccount" />
</template>
```

点击后子显示跟随改变。数据的修改入口仍在父组件 rename，子组件只负责读取。即使父端整体替换 selectedAccount.value，只要新对象符合结构，绑定也会把新对象传给子组件。

### 单向数据流：读取的位置与修改的位置要清楚

下面是错误方向的语法示意，不应加入上面的程序：

```ts
// props.account = { id: 102, name: '另一个账户' }; // 顶层 Prop 只读
// props.account.name = '偷偷改名'; // 嵌套修改可能影响父对象，业务上应避免
```

“只读”主要约束 Prop 这一层，不代表 Vue 自动把传入对象做成完全不可变的深拷贝。对象被共享引用时，修改嵌套字段可能影响父数据，读代码就很难找到谁改了它。

正确方向是子组件报告“用户希望改成什么”，由拥有状态的父组件决定是否接受。下一单元的 Emit 专门解决这个问题。

> [!EXERCISE] 拆解父子名称
>
> 父组件写 `<ObjectAccount :account="current" />`，子组件读 props.account.name。哪一个名字可以由父组件随意更名？如果把左边改成 :current="current"，子组件会自动知道吗？
>
> 【答案】
>
> 右边 current 是父变量名，可在父文件内一致更名。左边 account 是组件输入协议，不能单方面改成 current；子组件仍声明 account，必须让两边一致。子组件不会按变量内容猜测属性名。

## Emit：子组件发出事件

自定义事件表达“发生了什么”。`defineEmits` 声明允许发出的事件及参数类型，返回的 emit 函数负责发出事件。这里使用调用签名：`(e: 'select', id: number): void`，表示事件名只能是 select，参数必须是数字。

父组件 `@select="handleSelect"` 接收事件参数。组件事件不会像原生 DOM 事件那样自动逐层冒泡，祖父组件需要中间组件转发或其他明确机制。

### 先从不携带参数的事件开始

子组件有一个“申请刷新”按钮，父组件负责真正执行刷新。第一步不传 ID，不改对象，只确认子到父的通知能到达。

```ts
const emit = defineEmits<{ (e: 'refresh'): void }>();
```

这个类型里只有一个参数 e，合法值只能是 refresh。调用 emit('refresh') 表示发出通知，没有业务载荷。父组件用 @refresh 监听。

### 完整程序：子组件申请，父组件计数

文件：`src/components/RefreshButton.vue`。

```vue
<script setup lang="ts">
const emit = defineEmits<{ (e: 'refresh'): void }>();
function requestRefresh(): void {
    emit('refresh');
}
</script>

<template>
    <button @click="requestRefresh">申请刷新</button>
</template>
```

文件：`src/App.vue`。

```vue
<script setup lang="ts">
import { ref } from 'vue';
import RefreshButton from './components/RefreshButton.vue';
const refreshCount = ref(0);
function handleRefresh(): void {
    refreshCount.value += 1;
}
</script>

<template>
    <RefreshButton @refresh="handleRefresh" />
    <p>父组件已收到 {{ refreshCount }} 次刷新请求</p>
</template>
```

第一次点击时，子 requestRefresh 执行 emit；父监听收到 refresh，调用 handleRefresh；父计数从 0 变成 1。子组件没有 ref 计数，也没有取得父组件函数引用。

若把父监听暂时改成 @reload，点击仍会进入子函数，但父计数不变。事件名必须匹配。恢复为 @refresh 后再继续学习带参数的事件。

### 再增加载荷：告诉父组件操作的是谁

有多行账户时，“用户选择了某行”还不够，父组件需要知道目标 ID。于是添加第二个参数：

```ts
emit('select', 101);
```

select 是事件名称，101 是这次事件携带的业务值。父处理函数接收 101，而不是自动收到子组件的所有状态。

```ts
function handleSelect(id: number): void {
    selectedId.value = id;
}
```

参数名 id 可由父函数自行选择，但参数顺序和类型应与子组件发送的一致。子发送数字、父却当成对象读 id.name，是通信协议错误。

### 事件名是一份明确协议

```ts
const emit = defineEmits<{
    (e: 'select', id: number): void;
}>();
```

defineEmits 也是编译宏。返回的 emit 是可调用函数。类型中的 e 表示事件名，字面量 select 限制合法名称；第二个参数 id 要求数字；void 表示不依赖这次调用的返回结果。

```ts
emit('select', 101);
```

这不是直接调用父组件里名为 select 的函数，而是报告名为 select 的事件并携带 ID。父页面如何处理，由其监听表达式决定。

### 父组件接收参数，不必猜测目标

```vue
<AccountAction :id="101" name="储蓄账户" @select="handleSelect" />
```

```ts
function handleSelect(id: number): void {
    selectedId.value = id;
}
```

当子组件 emit('select', 101) 时，101 成为 handleSelect 的第一个参数。若子端发送整个对象而父端按数字处理，两边约定就不一致，应统一类型和载荷。

### Props 与 Emit 分别承担一个方向

父组件通过 Props 给子组件 ID 和名称；子组件通过 Emit 回报用户选择了哪个 ID。子组件不需要知道父状态变量名是 selectedId，也不需要导入父组件文件，这样它可以在不同页面复用。

组件自定义事件不会自动逐级冒泡。若 AccountAction 放在中间组件内部，外层只监听中间组件，就需要中间层明确转发事件。

### 点击事件与业务事件不是同一个名称

子模板的 @click 来自按钮；父模板的 @select 来自子组件 defineEmits。一次点击经过两个步骤：先接收原生/组件按钮点击，再发出具有业务含义的 select。排错时应分别检查，不要看到父模板没有 @click 就认为没绑定按钮。


完整 `src/components/AccountAction.vue`：

```vue
<script setup lang="ts">
const props = defineProps<{ id: number; name: string }>()
const emit = defineEmits<{ (e: 'select', id: number): void }>()
function select() { emit('select', props.id) }
</script>
<template>
  <button @click="select">选择 {{ props.name }}</button>
</template>
```

完整 `src/App.vue`：

```vue
<script setup lang="ts">
import { ref } from 'vue'
import AccountAction from './components/AccountAction.vue'
const selectedId = ref(0)
function handleSelect(id: number) { selectedId.value = id }
</script>
<template>
  <AccountAction :id="7" name="张三" @select="handleSelect" />
  <p>当前 ID：{{ selectedId }}</p>
</template>
```

执行顺序：按钮 click → 子 select → emit 携带 7 → 父 handleSelect 接收 7 → 修改 selectedId → 父模板更新。业务状态归父组件，子组件只报告操作。

> [!EXERCISE] 事件定位
>
> 子组件发出 select，父组件监听 selected，点击后没有变化，应改哪里？能否通过修改子组件 Props 来绕过？
>
> 【答案】
>
> 统一事件名，例如父组件改为 `@select="handleSelect"`。不应修改 Props 绕过通信约定。先确认子事件是否发出，再确认父监听名称和参数是否一致。

## 自定义组件的双向绑定

组件的默认 `v-model` 由 `modelValue` Prop 和 `update:modelValue` 事件组成。它不是允许子组件直接改 Props 的例外。

`$event` 是模板事件表达式收到的事件载荷。Element Plus 输入框的 update:model-value 载荷是新的输入值；原生输入框 input 载荷则是 DOM Event，二者不能混同。

### 先写出双向绑定的完整形式

```vue
<NameInput
    :model-value="name"
    @update:model-value="name = $event"
/>
```

name 是父模板上下文中的顶层 ref，可在模板表达式中直接赋值。上面先将值传下去，再用更新事件接收新值。这两个动作合起来，才形成“父状态变化影响输入，用户输入也影响父状态”。

其简写为：

```vue
<NameInput v-model="name" />
```

v-model 没有允许子组件绕过只读 Props。子组件仍要接收 modelValue，并发出 update:modelValue；若只做前半部分，父状态永远不会收到输入。

### 大小写与冒号属于协议名称

脚本声明 modelValue、update:modelValue；模板中常用 model-value、update:model-value。事件里的冒号是名称的一部分，不能写成 update-modelValue 后仍期望默认 v-model 自动匹配。

### $event 的内容由事件发出者决定

```vue
<el-input :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)" />
```

这里 el-input 的更新事件提供新输入值，所以 $event 是字符串载荷。原生 input 的 @input 则提供 DOM Event，不能直接把整个事件当字符串保存。读第三方组件时应查它的事件参数，而不是只根据事件名猜测。

### 双向绑定的六步执行过程

1. 父 name 初始为张三。
2. 父通过 modelValue 把张三传给 NameInput。
3. NameInput 把值传给内部 el-input，界面显示张三。
4. 用户改成李四，el-input 发出新字符串。
5. NameInput 转发 update:modelValue，父 v-model 更新 name。
6. 新父状态向下传递，段落和输入框保持一致。

下面程序可用来验证每一步，不需要加入表格或弹窗。


完整 `src/components/NameInput.vue`：

```vue
<script setup lang="ts">
defineProps<{ modelValue: string }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()
</script>
<template>
  <el-input :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)" />
</template>
```

完整 `src/App.vue`：

```vue
<script setup lang="ts">
import { ref } from 'vue'
import NameInput from './components/NameInput.vue'
const name = ref('张三')
</script>
<template>
  <NameInput v-model="name" />
  <p>{{ name }}</p>
</template>
```

输入值先作为事件向上传递，父状态更新后再作为 Prop 向下传递。第二天的 `v-model:current-page` 同理，只是使用命名模型 currentPage 及其更新事件。

### defineModel：理解协议后的简写

前面手写 modelValue 和 update:modelValue 是为了看清两个方向。Vue 3.4 及以上提供 defineModel，把这两项声明合并起来。

```ts
const model = defineModel<string>({ required: true });
```

string 约束模型值类型；required=true 要求父端提供该模型；返回的 model 是可读写引用。对子端 model.value 的写入，会按照更新事件协议通知父端，并不是直接修改普通只读 Prop。

### 完整程序：使用 defineModel 的姓名输入

文件：`src/components/ModernNameInput.vue`。

```vue
<script setup lang="ts">
const model = defineModel<string>({ required: true });
</script>

<template>
    <el-input v-model="model" />
</template>
```

文件：`src/App.vue`。

```vue
<script setup lang="ts">
import { ref } from 'vue';
import ModernNameInput from './components/ModernNameInput.vue';
const name = ref('张三');
function reset(): void { name.value = '张三'; }
</script>

<template>
    <ModernNameInput v-model="name" />
    <p>父组件姓名：{{ name }}</p>
    <button @click="reset">恢复姓名</button>
</template>
```

用户改成李四时，内部输入更新 model，defineModel 生成的协议让父 name 同步变为李四；点击父恢复按钮，父状态又向下更新输入框。

与前一个 NameInput 相比，父端使用方式完全相同，子端少了手工声明和转发代码。能解释前一种写法，才算理解这一简写。

若只在子端设置默认值、父端初始模型却是 undefined，可能出现子有默认内容而父还没有相同值的情况。本课程让父端明确初始化，先避免这种状态差异。

> [!EXERCISE] 只传 Prop 能双向更新吗
>
> 父端把 v-model="name" 改成 :model-value="name"，却不监听任何更新事件。子输入以后，父段落会自动变化吗？
>
> 【答案】
>
> 不会按双向绑定预期更新。父只提供了向下的值，没有接收向上的更新。应保留 v-model，或展开写出 :model-value 加 @update:model-value 的两部分。子端使用 defineModel 不会替父端补上一条没有声明的监听。

## 插槽：父组件提供界面内容

前面的 Props 让父组件传入数据。现在考虑另一个问题：父组件希望给统一的外框填入一段不同的界面，可能是说明、按钮或表格。这需要插槽。下面依次学习默认位置、命名位置和带数据的插槽，每一步先独立运行。

### 默认插槽：给组件填入内容

只有 Props 时，子组件往往要预先决定所有展示内容。若需要统一外框，却允许父端放不同的提示或按钮，可以在子组件预留 slot。

子组件的语法小例：

```vue
<section class="panel">
    <slot />
</section>
```

父组件的使用小例：

```vue
<AccountPanel><p>本账户只读</p></AccountPanel>
```

父模板中标签之间的段落填入 slot 位置。slot 本身不是最终页面上一个独立的 HTML 节点。

### 默认内容是没有提供插槽时的回退

```vue
<slot>暂无补充说明</slot>
```

父组件没有填入默认插槽时，显示“暂无补充说明”；已经提供内容时，显示父内容。不要把这里的回退文字理解成每次都固定附加在父内容后面。

### 具名插槽：给不同位置起名字

```vue
<header><slot name="header" /></header>
<main><slot /></main>
<footer><slot name="footer" /></footer>
```

header、main、footer 是原生 HTML 结构标签；slot 的 name 则是插槽协议。父端用 `<template #header>` 和 `<template #footer>` 指定放在哪一处。`#header` 是 `v-slot:header` 的简写。

### 完整程序：只学习默认插槽

先不传插槽参数，避免把“填内容”和“传数据”混在一起。

文件：`src/components/SimplePanel.vue`。

```vue
<script setup lang="ts">
// 本组件只组织插槽，不需要创建响应式状态。
</script>

<template>
    <section class="panel">
        <h3>统一的账户说明区</h3>
        <slot>父组件没有提供说明</slot>
    </section>
</template>

<style scoped>
.panel {
    padding: 12px;
    border: 1px solid #bbb;
    margin-bottom: 12px;
}
</style>
```

文件：`src/App.vue`。

```vue
<script setup lang="ts">
import SimplePanel from './components/SimplePanel.vue';
</script>

<template>
    <SimplePanel>
        <p>储蓄账户用于日常收支。</p>
    </SimplePanel>
    <SimplePanel />
</template>
```

第一块面板显示父组件提供的段落，第二块显示子组件的回退文字。两块都保留子组件固定写好的标题和边框，只有 slot 位置的内容不同。

把第一块的段落换成按钮，按钮也会出现在同一个 slot 位置。插槽允许填模板结构，因此比“传一条字符串说明”更灵活；如果只需要一个固定文字字段，Props 通常更直接。

### 完整程序：标题、正文、底部各填自己的位置

文件：`src/components/NamedPanel.vue`。

```vue
<script setup lang="ts">
// 本组件只组织插槽，不需要创建响应式状态。
</script>

<template>
    <section>
        <header><slot name="header">默认标题</slot></header>
        <main><slot>默认正文</slot></main>
        <footer><slot name="footer">默认底部说明</slot></footer>
    </section>
</template>
```

文件：`src/App.vue`。

```vue
<script setup lang="ts">
import NamedPanel from './components/NamedPanel.vue';
</script>

<template>
    <NamedPanel>
        <template #header>
            <h2>账户查询结果</h2>
        </template>
        <template #default>
            <p>本次查到 3 条记录。</p>
        </template>
        <template #footer>
            <p>结果只包含有权限查看的账户。</p>
        </template>
    </NamedPanel>
</template>
```

父组件把三个区域分别放入同名插槽。#default 填默认位置；#header 填 name="header" 的位置；#footer 同理。父端这些 template 不会生成额外布局框，实际结构由子组件的 header、main、footer 决定。

删掉父端整个 #footer 后，子组件显示默认底部说明。若把 #footer 错拼为 #foot，子组件没有提供这个位置，不能期望内容自动落到底部。

> [!EXERCISE] 插槽名与 HTML 标签
>
> 子组件使用 `<footer><slot name="actions" /></footer>`，父端应写 #footer 还是 #actions？
>
> 【答案】
>
> 写 #actions。父端对接的是 slot 的 name，不是包裹它的 HTML 标签。footer 负责页面结构，actions 负责插槽名称。

### 默认插槽的作用域仍属于父组件

父组件填进去的内容，读取的是父组件中可访问的变量。它不能因为最终显示在子组件内部，就直接访问子组件所有的局部变量。

若子组件需要让插槽使用自己的 account，必须明确传出插槽参数：

```vue
<slot :account="account" />
```

父端接收：

```vue
<template #default="scope">
    {{ scope.account.name }}
</template>
```

scope 是接收这些插槽参数的对象。这就是作用域插槽：子组件提供数据，父组件决定如何显示。本例参数叫 account；第二天表格提供的参数叫 row，因此写 scope.row。名称由提供者决定，不可以随便互换。

### 插槽参数不是直接修改父状态

假设子组件提供：

```vue
<slot :account="account" />
```

父端 `#default="scope"` 相当于接收一组具名数据，其中有 scope.account。scope 只在这段插槽模板内有效，不能拿到插槽外的段落中继续使用。

```vue
<template #default="scope">
    <p>{{ scope.account.name }}</p>
</template>
```

这里读取的是子提供的 account，不是要求父组件自己也声明一个 account。反过来，子组件没有传 balance 时，父插槽不能凭空使用 scope.balance。

**作用域插槽并不是 Emit。** 插槽参数让父模板生成内容，Emit 通知父逻辑发生操作。它们都可能从子端提供信息，但用途和执行入口不同。

下面程序将展示：子持有张三账户，父决定用段落显示姓名；如果父把段落换成标签组件，子不需要改动数据提供方式。

### 本单元完整程序的阅读重点

下面三个位置需要对上：子组件 `:account="account"` → 父插槽 scope.account → 最终读取 name。header 和 footer 不需要子数据，所以没有插槽参数。先确认默认内容、命名位置、数据提供方，再阅读代码。


完整 `src/components/AccountPanel.vue`：

```vue
<script setup lang="ts">
const account = { id: 1, name: '张三' }
</script>
<template>
  <section>
    <slot name="header">账户信息</slot>
    <slot :account="account" />
    <slot name="footer" />
  </section>
</template>
```

完整 `src/App.vue`：

```vue
<script setup lang="ts">
import AccountPanel from './components/AccountPanel.vue'
</script>
<template>
  <AccountPanel>
    <template #header><h2>账户详情</h2></template>
    <template #default="scope"><p>{{ scope.account.name }}</p></template>
    <template #footer><p>只读展示</p></template>
  </AccountPanel>
</template>
```

slot 上的 `:account` 提供名为 account 的插槽参数。第二天表格的 scope.row 就是同一种数据提供方式；scope 只是局部变量名，可以换名，不是 Vue 保留字。

### 对照第二天的表格插槽

| 使用位置 | 子组件提供什么 | 父模板读取什么 |
| --- | --- | --- |
| 自定义 AccountPanel | 名为 account 的参数 | scope.account.name |
| Element Plus 表格列 | 名为 row 的当前行参数 | scope.row.name |

scope 这个名字可以改成 slotData，随后统一写 slotData.row。不能改的是提供方约定的 row 字段，除非提供方也相应修改。

> [!EXERCISE] 数据来自哪里
>
> 父组件没有声明 account，却能在 #default="scope" 中显示 scope.account.name，为什么？把它移到 AccountPanel 外面还能用吗？
>
> 【答案】
>
> account 由子组件通过 slot 参数提供，不是父组件顶层状态。scope 仅在这段插槽模板的局部作用域内有效；移到外面后不能继续访问。需要其他区域共享时，应重新设计数据归属，而不是随意把局部变量搬出去。

## 生命周期：挂载与清理

组件并非一直存在：进入页面时创建，显示后可能多次更新，离开时可能被移除。生命周期钩子让我们在这些时刻执行相应动作。先观察挂载与更新，再单独处理卸载清理；不要把所有钩子同时塞进第一个例子。

### 创建、挂载、更新和卸载不是同一时刻

组件创建时执行 script setup，建立变量、计算属性和函数。挂载是初始 DOM 被插入页面；更新是已有组件根据依赖变化重新更新 DOM；卸载是该实例被移除并清理关联资源。

```ts
onMounted(() => {
    console.log('组件已经挂载');
});
```

onMounted 接收回调，不是让你立刻执行回调再把结果传给钩子。通常在这里启动依赖页面已挂载的行为。页面稍后输入变化不会重新执行一次 onMounted。

### onUpdated 用于观察 DOM 更新后的阶段

```ts
onUpdated(() => {
    console.log('这个组件完成了一次 DOM 更新');
});
```

它不是“某一个字段变化”的专用监听。若需要观察姓名，用 watch；若只需要计算数量，用 computed。不要在 onUpdated 内无条件修改同一个驱动渲染的状态，否则会形成更新循环。

### 完整程序：观察挂载与更新次数

文件：`src/App.vue`。

```vue
<script setup lang="ts">
import { ref, onMounted, onUpdated } from 'vue';
const count = ref(0);
function increase(): void { count.value += 1; }
onMounted(() => {
    console.log('mounted：这个实例完成初次挂载');
});
onUpdated(() => {
    console.log('updated：DOM 已按当前计数更新', count.value);
});
</script>

<template>
    <p>当前计数：{{ count }}</p>
    <button @click="increase">加一</button>
</template>
```

打开浏览器 Console 后刷新，看到 mounted 日志。点击一次按钮，count 变成 1，在相关 DOM 更新后出现 updated 日志；不会因此重新执行 mounted。

如果在同一函数内连续两次修改 count，Vue 通常合并一次更新，不应靠 updated 次数统计业务操作。要统计业务操作，应在事件函数中明确计数。

这个示例只在钩子中打印，不在 onUpdated 中修改 count，因此不会制造自触发循环。

### onUnmounted 负责释放外部资源

```ts
onUnmounted(() => {
    clearInterval(timer);
});
```

Vue 会停止与已卸载实例关联的响应式效果，但不会替你理解每一个自行建立的外部资源。定时器、window 监听等应明确清理。`setInterval(callback, 1000)` 每隔约一秒执行一次，返回用于停止它的标识。

`ReturnType<typeof setInterval>` 取 setInterval 函数的返回类型，避免浏览器和其他类型环境对定时器标识的定义不同；`| undefined` 表示定时器还没创建。

### 完整补充程序：注册和移除窗口监听

这一例只需完整替换 src/App.vue，不依赖下面的 Ticker 文件。window.innerWidth 读取窗口宽度；addEventListener 注册监听；removeEventListener 必须使用同一个函数引用才能移除对应监听。

```vue
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
const width = ref(0);
function updateWidth(): void { width.value = window.innerWidth; }
onMounted(() => {
    updateWidth();
    window.addEventListener('resize', updateWidth);
});
onUnmounted(() => {
    window.removeEventListener('resize', updateWidth);
});
</script>
<template><p>窗口宽度：{{ width }}</p></template>
```

初始 setup 只创建 width；挂载后读取实际宽度并开始监听；窗口变化触发同一个 updateWidth；卸载时移除它。不能用两个分别声明的匿名箭头函数注册和移除，因为它们是不同的函数对象。

### 定时器完整程序的观察方法

下面由 App 的 v-if 控制 Ticker 实例是否存在。显示时开始计时，移除时停止，重新显示产生新实例，从 0 再开始。若改为 v-show，隐藏不会卸载实例，计时仍继续。


完整 `src/components/Ticker.vue`：

```vue
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
const seconds = ref(0)
let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  timer = setInterval(() => { seconds.value += 1 }, 1000)
})
onUnmounted(() => {
  if (timer !== undefined) clearInterval(timer)
})
</script>
<template><p>已显示 {{ seconds }} 秒</p></template>
```

完整 `src/App.vue`：

```vue
<script setup lang="ts">
import { ref } from 'vue'
import Ticker from './components/Ticker.vue'
const visible = ref(true)
</script>
<template>
  <button @click="visible = !visible">切换</button>
  <Ticker v-if="visible" />
</template>
```

> [!EXERCISE] 清理时机
>
> 将 v-if 改为 v-show 后，隐藏时定时器会停止吗？重新显示时计数是否重置？
>
> 【答案】
>
> 不会停止，也不会重置，因为实例仍存在，没有卸载。v-if 移除时触发清理，重新创建实例后从 0 开始。注册 window 事件监听时同样需要在卸载阶段用原函数引用移除监听。

## 拓展：组合式函数

Composable 是复用有状态逻辑的函数，通常命名为 useXxx；普通工具函数通常只是把输入转换为输出。状态放在函数内部时，每次调用通常创建独立状态；移到模块顶层则可能共享，不能随意移动。

### 先判断复用的是算法还是状态过程

一个 `formatMoney(amount)` 只把金额转换为字符串，通常属于普通工具函数。一个 useCounter 创建响应式数量并提供修改方法，返回供组件使用的状态，属于组合式函数。

```ts
function formatMoney(amount: number): string {
    return amount.toFixed(2);
}
```

工具函数没有必要为了“使用 Vue”而创建 ref。只有当复用逻辑确实涉及状态、监听或生命周期，才需要组合式函数的组织方式。

### useXxx 返回什么，组件就使用什么

```ts
const { count, increase } = useCounter();
```

这里返回的 count 本身是 ref，解构取得的仍是同一个 ref，所以模板继续自动解包；increase 是修改该 ref 的函数。不是所有对象解构都保留响应式，要看解构出来的是 ref 还是已经取出的普通值。

### 状态创建位置决定是否共享

```ts
export function useCounter() {
    const count = ref(0); // 每次调用创建自己的状态
    return { count };
}
```

若将 count 移到函数外，模块只创建一份，多个调用方可能共享它。逻辑复用不等于状态共享，本课程默认把局部状态放在函数内部。若设计全局共享，应使用明确约定或第四天的 Store。


完整 `src/composables/useCounter.ts`：

```ts
import { ref } from 'vue'
export function useCounter() {
  const count = ref(0)
  function increase() { count.value += 1 }
  return { count, increase }
}
```

完整 `src/App.vue`：

```vue
<script setup lang="ts">
import { useCounter } from './composables/useCounter'
const { count, increase } = useCounter()
</script>
<template><button @click="increase">{{ count }}</button></template>
```

解构得到的 count 本身仍是 ref，因此保留响应式；不要把 reactive 对象的普通数值属性直接解构后就假定它会持续同步。

### 完整程序：复用逻辑，但不共享计数

下面三个文件构成独立程序，无须再回前一段寻找 useCounter 的内容。这里只观察局部状态，不引入 Pinia。

文件：`src/composables/useCounter.ts`。

```ts
import { ref } from 'vue';
export function useCounter() {
    const count = ref(0);
    function increase(): void { count.value += 1; }
    return { count, increase };
}
```

文件：`src/components/CounterBox.vue`。

```vue
<script setup lang="ts">
import { useCounter } from '../composables/useCounter';
const props = defineProps<{ title: string }>();
const { count, increase } = useCounter();
</script>

<template>
    <section>
        <p>{{ props.title }}：{{ count }}</p>
        <button @click="increase">增加一次</button>
    </section>
</template>
```

文件：`src/App.vue`。

```vue
<script setup lang="ts">
import CounterBox from './components/CounterBox.vue';
</script>

<template>
    <CounterBox title="查询次数" />
    <CounterBox title="编辑次数" />
</template>
```

两个组件分别调用 useCounter，每次调用都创建自己的 ref。点击第一块两次、第二块一次，分别显示 2 和 1。复用的是“创建数量并提供增加函数”这套逻辑，不是同一份数量。

如果把 count 移到 useCounter 函数外，它就在模块加载时只创建一次，两个调用者可能共用。这个位置变化会改变业务行为，不是单纯移动代码排版。

组合式函数也可以注册 watch 和生命周期，但要遵守这些 API 的使用时机。例如需要组件生命周期的函数，通常在组件 setup 的同步阶段调用。不要在任意异步回调里临时注册一个本来应属于组件初始化的钩子。

> [!EXERCISE] 普通工具函数还是 Composable
>
> “把 3200 转成 3200.00”与“保存查询关键词并提供清空方法”应分别怎样组织？
>
> 【答案】
>
> 前者可以是无状态的格式化工具函数；后者涉及可变化状态与操作方法，适合组合式函数。不要只因函数名写了 use 就认定它具有特殊能力，关键看它创建和管理什么。

## 拓展：路由与页面入口

一个企业应用通常有账户列表、账户详情等多个页面。路由负责根据当前地址决定显示哪个页面组件。先弄清地址与组件的映射，再学习显示位置、导航和参数读取。

本独立示例使用哈希路由，网址带 `#`，无需服务器配置 history 回退。替换 main.ts 后只运行本例；后续主线恢复第一天 main.ts。

### 地址、路由配置和页面组件

路由解决“当前地址应显示哪个页面”。用户访问 /accounts/1 时，配置中的 `/accounts/:id` 匹配该地址，:id 接收片段 1，并把匹配组件显示在 RouterView 位置。

```ts
{ path: '/accounts/:id', component: AccountView }
```

path 是匹配规则，component 是已经导入的 Vue 组件对象，不是随便写一个文件路径字符串就会自动加载。views 文件夹是约定，路由不会自动扫描其中所有文件。

### RouterView 与 RouterLink

```vue
<RouterLink to="/accounts/1">账户 1</RouterLink>
<RouterView />
```

RouterLink 的 to 指定导航目标，点击后由 Router 更新地址并切换匹配内容；RouterView 显示匹配结果。仅定义路由而没有 RouterView，页面没有显示位置。

### useRoute 读取当前地址信息

```ts
const route = useRoute();
console.log(route.params.id);
```

route.params 是路径参数，例如 /accounts/1 的 id；route.query 是问号后的查询参数，例如 ?name=张三。URL 中的数字字符不是已验证的业务数字 ID，需要依据业务转换和校验。

### useRouter 执行跳转

```ts
const router = useRouter();
router.push('/accounts/2');
```

router 是执行导航操作的对象，route 是当前路由信息；名字接近，职责不同。push 增加一次历史记录，用户通常可以通过浏览器后退返回。

### 为什么这个示例选择哈希路由

createWebHashHistory 使用 # 后的路径，适合直接在 Vite 练习。history 模式地址更简洁，但部署服务器需对前端路由提供入口回退；这属于工程部署配置，不在本例额外加入。

下面包含页面、路由配置、入口和 App 四个文件。阅读时从 main.ts 的 use(router) 到路由映射，再到 App 的 RouterView，最后查看 AccountView 中 route 和 router 的使用。


完整 `src/views/AccountView.vue`：

```vue
<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
const route = useRoute()
const router = useRouter()
function next() { router.push('/accounts/2') }
</script>
<template>
  <p>路由 ID：{{ route.params.id }}</p>
  <button @click="next">查看账户 2</button>
</template>
```

完整 `src/router/index.ts`：

```ts
import { createRouter, createWebHashHistory } from 'vue-router'
import AccountView from '../views/AccountView.vue'
export default createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/accounts/1' },
    { path: '/accounts/:id', component: AccountView }
  ]
})
```

createRouter 创建路由实例，history 指定地址模式，routes 是映射数组，redirect 重定向，component 指定要显示的组件。完整 `src/main.ts`：

```ts
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
createApp(App).use(router).mount('#app')
```

完整 `src/App.vue`：

```vue
<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>
<template>
  <RouterLink to="/accounts/1">账户 1</RouterLink>
  <RouterView />
</template>
```

`to` 是导航目标。页面组件仍是 Vue 组件，只是由路由匹配决定显示。相同组件切换路由参数时可能复用实例，不能假定每次参数变化都重新执行 onMounted；需要时 watch 参数。

### 完整程序：路由参数变化时实例可能复用

这个例子与前面的基本路由独立，完整替换以下四个文件。先解释新增的一处 watch：数据源 `() => route.params.id` 每次读取当前路径参数；immediate 让初次进入也记录一次。

文件：`src/views/AccountDetail.vue`。

```vue
<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
const route = useRoute();
const observedId = ref('');
watch(() => route.params.id, (value) => {
    observedId.value = String(value);
    console.log('当前参数变化：', value);
}, { immediate: true });
onMounted(() => {
    console.log('详情实例挂载');
});
</script>

<template>
    <p>当前路径参数：{{ route.params.id }}</p>
    <p>watch 记录的 ID：{{ observedId }}</p>
</template>
```

文件：`src/router/index.ts`。

```ts
import { createRouter, createWebHashHistory } from 'vue-router';
import AccountDetail from '../views/AccountDetail.vue';
export default createRouter({
    history: createWebHashHistory(),
    routes: [
        { path: '/', redirect: '/accounts/101' },
        { path: '/accounts/:id', component: AccountDetail }
    ]
});
```

文件：`src/main.ts`。

```ts
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
createApp(App).use(router).mount('#app');
```

文件：`src/App.vue`。

```vue
<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router';
</script>

<template>
    <RouterLink to="/accounts/101">账户 101</RouterLink>
    <RouterLink to="/accounts/102">账户 102</RouterLink>
    <RouterView />
</template>
```

初次进入会显示 101，并出现挂载日志。点击账户 102 后，两行显示 102；在通常的同一路由组件复用情况下，会出现参数变化日志，却不重新出现挂载日志。

因此以后根据 ID 请求详情时，不能只在 onMounted 中读取初始 ID，就认为导航到别的 ID 一定会再次挂载。可以观察具体参数，第四天再把请求接入这个逻辑。

这里 String(value) 只是为了显示参数，不等于完成业务 ID 校验。真实接口要求数字时，还要按协议转换并检查合法性。

## 组件通信综合阅读练习

> [!EXERCISE] 多实例的 ID 与事件
>
> 父页面用 v-for 渲染三个 AccountAction，分别传入 ID 101、102、103，统一监听 @select="handleSelect"。点击第二个后为什么父函数能知道是哪一个？key 在这里代替事件参数了吗？
>
> 【答案】
>
> 第二个实例的 Props.id 是 102，子组件发出 emit('select', props.id)，所以父函数收到 102。key 只帮助 Vue 识别实例身份，不会自动成为事件参数；没有显式 emit ID，父函数不会从 key 自动取得它。

> [!EXERCISE] 找到真正负责保存的组件
>
> 子组件只包含姓名输入与 save 事件，父组件接收 save 后调用接口。页面保存失败时，应该只检查子组件吗？
>
> 【答案】
>
> 先确认子组件是否发出正确事件及参数，再检查父监听、父处理函数、接口模块和失败分支。真正决定保存行为的是父组件处理函数；子组件显示保存按钮不代表它拥有请求逻辑。

## 当日验收与资料

能画出“父状态 → Props → 子展示；子操作 → Emit → 父函数 → 父状态”的链条，并找到真正修改状态的文件，即完成主线。

- [Vue Props](https://vuejs.org/guide/components/props)
- [Vue 组件事件](https://vuejs.org/guide/components/events.html)
- [Vue 插槽](https://vuejs.org/guide/components/slots.html)
- [Vue Router 组合式 API](https://router.vuejs.org/guide/advanced/composition-api)
