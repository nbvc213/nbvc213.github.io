---
date: 2026-11-03
tags: [Vue, TypeScript, 动态组件, KeepAlive, 模板引用, 自定义指令]
description: "通过银行账户页面学习动态组件、组件缓存、defineOptions、defineExpose、nextTick、事件修饰符、动态样式和自定义指令。"
draft: false
---

## 学习目标与时间安排

前面的课程已经学过 `.vue` 单文件组件、`ref()`、`computed()`、Props、Emit 和生命周期。现在考虑一个真实页面：用户可以在“账户查询”和“转账草稿”之间切换；切回来时，希望之前填写的查询条件仍然存在；点击“重置”按钮时，希望父组件能够让子表单清空；显示输入框后，还希望光标自动落在里面。

这些需求无法只靠重复使用 `v-if` 和 Props 完成得清楚。本日补充的是企业项目中经常看到、但五天基础课尚未集中讲过的一组组件能力。

| 学习内容 | 建议时间 | 掌握目标 |
| --- | ---: | --- |
| 动态组件 `<component :is>` | 15 分钟 | 根据业务类型切换组件 |
| `<KeepAlive>` 与激活生命周期 | 25 分钟 | 保留切换前的组件状态，处理暂停与恢复 |
| `defineOptions()` 与属性透传 | 15 分钟 | 理解组件选项、组件名、`$attrs` |
| `defineExpose()` 与模板引用 | 20 分钟 | 父组件按需调用子组件暴露的方法 |
| `nextTick()` | 15 分钟 | 等待 DOM 更新后聚焦或读取元素 |
| 事件与表单修饰符、动态样式 | 15 分钟 | 处理冒泡、默认行为、输入转换与状态样式 |
| 自定义指令 | 15 分钟 | 抽出可复用的 DOM 聚焦行为 |
| **合计** | **120 分钟** | |

本日只要求完成各节的主程序。`include`/`exclude`、`max`、全局指令注册等进一步用法保留为拓展，第一次学习时先理解用途，再根据实际项目使用。

### 运行约定

继续使用前五天的 Vue 3 + TypeScript + Vite 练习工程，不需要重新创建项目。本日大部分例子使用原生 HTML 控件，避免把 Vue 的内置机制和 Element Plus 的组件行为混在一起。

默认保留以下 `src/main.ts`；如果你的工程还注册了 Element Plus、Router 或 Pinia，可以继续保留已有注册，本日不要求卸载它们。

```ts
import { createApp } from 'vue';
import App from './App.vue';

createApp(App).mount('#app');
```

在项目根目录执行：

```bash
npm run dev
```

每节的**完整程序**都是独立的：它会注明需要创建的文件。一个示例结束后，进入下一节时，按照下一节的文件说明替换 `App.vue`，不要把多个 `<script setup>`、多个根模板合并到同一个文件。

阅读顺序统一为：**概念与用途 → 首次出现的属性、方法及简短代码 → 完整可运行程序 → 同一节中的运行步骤和结果解释**。运行验证不再拆成脱离程序的独立小节；同一段示例中用到的新语法，会先解释再出现。

本日采用 Vue 3.3 及以上才支持的 `defineOptions()`；如果使用 Vue 3.5 及以上，还可以用 `useTemplateRef()` 简化模板引用。为了兼容更多 Vue 3 项目，主线模板引用主要使用 `ref<元素或组件类型 | null>(null)`。

## 动态组件：根据条件决定显示哪个子组件

### 为什么业务页面需要动态组件

假设账户页面有两个区域：一个查询账户余额，另一个填写转账用途。用户在顶部点击“账户查询”或“转账草稿”，页面下方显示不同的业务模块。

已经学过的写法是：

```vue
<AccountQuery v-if="tab === 'query'" />
<TransferDraft v-else />
```

只有两个组件时，这种写法没有问题。但如果业务类型越来越多，一连串的 `v-if`、`v-else-if` 会让页面越来越难维护。

Vue 提供了一个特殊标签：**`<component>`**。它不是具体的业务组件，而是一个“占位入口”：你告诉它当前应该渲染哪一个组件，它就把那个组件放到这里。

```vue
<component :is="activeComponent" />
```

这里需要理解两层意思：

- `<component>` 是 Vue 的内置特殊元素，不是你创建的 `.vue` 文件。
- `:is` 是动态绑定属性，它接收**组件定义对象**，也可以接收已注册组件的名称。

如果是 Vue 3 + `<script setup>`，更推荐直接传导入的组件对象，而不是自己拼接组件名字符串。

### `:is` 与普通 `v-if` 的区别

`v-if` 决定某个指定组件是否存在；`<component :is>` 决定同一个位置当前放哪个组件。两者不是互斥的能力，而是两种不同的模板组织方法。

例如：

```ts
const activeComponent = computed(() => {
    return currentTab.value === 'query'
        ? AccountQuery
        : TransferDraft;
});
```

`computed()` 已经在基础课程学过，表示根据响应式变量计算一个结果。这里它返回的不是数字或字符串，而是一个组件定义。

当 `currentTab` 改变时，计算结果变成另一个组件，`<component>` 就改为渲染新的组件。

### 完整程序：切换账户查询与转账草稿

文件：`src/components/AccountQuery.vue`

```vue
<script setup lang="ts">
import { ref } from 'vue';

// 这个输入状态属于 AccountQuery 组件实例。
const accountNo = ref('');

function search(): void {
    // 本节只演示组件切换，不发真实查询请求。
    console.log('查询账户：', accountNo.value);
}
</script>

<template>
    <section class="panel">
        <h3>账户查询</h3>
        <label for="account-no">账户编号：</label>
        <input id="account-no" v-model="accountNo" />
        <button @click="search">查询</button>
        <p>当前输入：{{ accountNo || '未填写' }}</p>
    </section>
</template>

<style scoped>
.panel { padding: 16px; border: 1px solid #bbb; border-radius: 8px; }
input { margin-right: 8px; }
</style>
```

文件：`src/components/TransferDraft.vue`

```vue
<script setup lang="ts">
import { ref } from 'vue';

const purpose = ref('');
</script>

<template>
    <section class="panel">
        <h3>转账草稿</h3>
        <label for="purpose">转账用途：</label>
        <input id="purpose" v-model="purpose" />
        <p>草稿内容：{{ purpose || '未填写' }}</p>
    </section>
</template>

<style scoped>
.panel { padding: 16px; border: 1px solid #bbb; border-radius: 8px; }
</style>
```

文件：`src/App.vue`

```vue
<script setup lang="ts">
import { computed, ref } from 'vue';
import AccountQuery from './components/AccountQuery.vue';
import TransferDraft from './components/TransferDraft.vue';

// 联合类型限定 tab 只能使用这两个业务标识。
const tab = ref<'query' | 'transfer'>('query');

// 计算当前应当显示哪个组件定义。
const activeComponent = computed(() => {
    return tab.value === 'query' ? AccountQuery : TransferDraft;
});
</script>

<template>
    <h2>银行业务工作台</h2>
    <button @click="tab = 'query'">账户查询</button>
    <button @click="tab = 'transfer'">转账草稿</button>

    <!-- 同一个位置根据 activeComponent 显示不同的子组件。 -->
    <component :is="activeComponent" />
</template>
```

**运行验证与原因：**

先在“账户查询”中输入 `6222`，再切换到“转账草稿”，最后切回“账户查询”。你会发现原来的 `6222` 消失了。

这并不是 `v-model` 失效。原因在于**默认的动态组件切换会卸载旧组件，再创建新组件实例**：`AccountQuery` 卸载后，它内部的 `ref('')` 状态不再保留；切回来时创建新的 `AccountQuery` 实例，状态重新初始化。

如果希望切换后保留状态，下一节的 `<KeepAlive>` 就是对应的解决办法。

### 常见写法与参数

| 写法 | 作用 | 注意事项 |
| --- | --- | --- |
| `<component :is="MyPanel" />` | 渲染变量对应的组件定义 | 推荐在 `<script setup>` 中传导入的组件对象 |
| `<component :is="activeComponent" />` | 根据计算结果动态切换 | 切换时默认卸载旧实例 |
| `<component :is="activeComponent" :account-id="id" />` | 向当前组件传 Props | 被切换的组件都应正确声明其需要的 Props |
| `<component :is="activeComponent" :key="someKey" />` | 为当前组件提供显式身份标识 | `key` 不会自动保存组件状态，它用于区分实例身份 |

例如，当两个业务组件都声明了可选的 `accountId` Prop 时，可以在动态组件上直接传递：

```vue
<component
    :is="activeComponent"
    :account-id="selectedAccountId"
/>
```

这里 `selectedAccountId` 是父组件已有的变量，`:account-id` 仍是第三天学过的 Props 动态绑定。若某个被切换组件没有声明这个 Prop，要根据它的具体实现判断未声明属性如何透传，不能假定每个组件都一定读取了它。

需要刻意**重新创建**同一组件的不同业务实例时，还可以为它提供不同的 `key`：

```vue
<component :is="activeComponent" :key="selectedAccountId" />
```

`key` 用于区分组件实例身份：同一组件类型下，`key` 变化会让 Vue 重新创建对应实例。它不是缓存开关，也不是自动传给子组件的业务参数。若外层存在 `<KeepAlive>`，不同 `key` 还会影响缓存实例身份，需要结合缓存配置分析。

普通组件的 Props、Emit 仍然有效，动态组件只是决定使用哪一个组件定义。

> [!EXERCISE] 动态组件为什么丢失输入
>
> 输入账户编号之后切到转账草稿，再切回账户查询，输入框为什么恢复空值？
>
> 【答案】
>
> 默认切换动态组件会卸载原组件，再创建新实例。`accountNo` 定义在子组件内部，新实例会重新执行 `ref('')`，所以恢复空值。要保留旧实例，可以使用下一节的 `<KeepAlive>`。

## KeepAlive：切换组件时保留状态

### 把“切换显示”和“销毁实例”分开

企业页面经常需要保留用户已经填写的查询条件，例如从账户列表切到交易明细，再回到账户列表时，姓名、账户编号或分页位置仍然保持原样。

Vue 的内置组件 **`<KeepAlive>`** 可以缓存被切换出去的组件实例。基本写法是：

```vue
<KeepAlive>
    <component :is="activeComponent" />
</KeepAlive>
```

注意它缓存的是**组件实例及其本地状态**，不是浏览器本地存储，也不是把数据写到后端。

这意味着：

- 在被缓存的组件之间切换，原来的实例不必销毁；
- 切回来时继续使用原实例，已输入的 `ref` 数据仍然存在；
- 整个浏览器页面刷新后，前端应用重新创建，普通 KeepAlive 缓存也会消失；
- 被缓存的组件虽然没有显示，但它内部自行创建的定时器或外部订阅**不会因为隐藏而自动暂停**。

最后一点很重要。例如用户离开实时余额页面后，如果轮询定时器继续执行，就会浪费资源，甚至造成不必要的请求。

### 组件为什么还需要新的生命周期

第三天已经学过 `onMounted()` 和 `onUnmounted()`：它们关注组件**初次挂载**和**真正卸载**。

在 `<KeepAlive>` 场景下，组件还会经历另外两种状态：

- **`onActivated()`**：缓存组件进入激活状态。首次挂载时也会调用；以后从缓存切回来时还会调用。
- **`onDeactivated()`**：缓存组件离开激活状态。切换到其他组件时调用；缓存组件真正卸载时也会进入相应的停用过程。

所以不能简单地把 `onMounted()` 当作“每次切回页面都会执行”，它不会因缓存组件重新激活而反复触发。

一个常见的设计是：

```ts
onActivated(() => {
    // 页面变为当前显示页时，恢复定时查询或事件监听。
});

onDeactivated(() => {
    // 页面不再显示时，暂停定时查询或事件监听。
});
```

这两个都是从 `vue` 导入的生命周期 API，不是 `<KeepAlive>` 标签上的事件属性。

### 完整程序：保留账户查询输入并暂停计时器

文件：`src/components/CachedAccountQuery.vue`

```vue
<script setup lang="ts">
import {
    ref,
    onMounted,
    onActivated,
    onDeactivated,
    onUnmounted
} from 'vue';

const keyword = ref('');
const activeSeconds = ref(0);

let timer: ReturnType<typeof setInterval> | undefined;

function stopTimer(): void {
    if (timer !== undefined) {
        clearInterval(timer);
        timer = undefined;
    }
}

onMounted(() => {
    console.log('账户查询组件首次挂载');
});

onActivated(() => {
    console.log('账户查询组件已激活');

    // 先确认没有旧计时器，防止重复创建。
    stopTimer();
    timer = setInterval(() => {
        activeSeconds.value += 1;
    }, 1000);
});

onDeactivated(() => {
    console.log('账户查询组件进入缓存');
    stopTimer();
});

onUnmounted(() => {
    console.log('账户查询组件真正卸载');
    stopTimer();
});
</script>

<template>
    <section class="panel">
        <h3>账户查询</h3>
        <label for="cached-keyword">查询关键词：</label>
        <input id="cached-keyword" v-model="keyword" />
        <p>当前关键词：{{ keyword || '未填写' }}</p>
        <p>累计激活时间：{{ activeSeconds }} 秒</p>
    </section>
</template>

<style scoped>
.panel { padding: 16px; border: 1px solid #aaa; margin-top: 12px; }
</style>
```

文件：`src/components/CachedTransferDraft.vue`

```vue
<script setup lang="ts">
import { ref } from 'vue';

const purpose = ref('');
</script>

<template>
    <section class="panel">
        <h3>转账草稿</h3>
        <input v-model="purpose" placeholder="输入转账用途" />
        <p>草稿：{{ purpose || '未填写' }}</p>
    </section>
</template>

<style scoped>
.panel { padding: 16px; border: 1px solid #aaa; margin-top: 12px; }
</style>
```

文件：`src/App.vue`

```vue
<script setup lang="ts">
import { computed, ref } from 'vue';
import CachedAccountQuery from './components/CachedAccountQuery.vue';
import CachedTransferDraft from './components/CachedTransferDraft.vue';

const tab = ref<'query' | 'transfer'>('query');

const activeComponent = computed(() => {
    return tab.value === 'query'
        ? CachedAccountQuery
        : CachedTransferDraft;
});
</script>

<template>
    <h2>带缓存的银行业务工作台</h2>
    <button @click="tab = 'query'">账户查询</button>
    <button @click="tab = 'transfer'">转账草稿</button>

    <KeepAlive>
        <component :is="activeComponent" />
    </KeepAlive>
</template>
```

**运行验证与预期结果：**

1. 在“账户查询”输入“工资账户”，等待激活时间增长到 3 秒。
2. 切换到“转账草稿”，填写“房租”。
3. 在转账草稿中停留一段时间，再切回账户查询。
4. 此时原来的“工资账户”仍然存在，激活计时从之前数值继续，而不是从 0 开始。
5. 再切回转账草稿，之前的“房租”同样保留。

打开浏览器 Console，还可以观察到首次挂载和后续激活的差别。缓存切换时会发生 activated/deactivated，而不会每次都重新 mounted/unmounted。

### `include`、`exclude` 和 `max` 是什么

`<KeepAlive>` 可以接收三个常用 Props：

| Prop | 含义 | 示例 |
| --- | --- | --- |
| `include` | 只缓存名称匹配的组件 | `include="CachedAccountQuery"` |
| `exclude` | 不缓存名称匹配的组件 | `exclude="SensitiveForm"` |
| `max` | 最多保留多少个缓存实例 | `:max="5"` |

**只缓存指定组件：**

```vue
<KeepAlive include="CachedAccountQuery">
    <component :is="activeComponent" />
</KeepAlive>
```

**排除指定组件：**

```vue
<KeepAlive exclude="SensitiveForm">
    <component :is="activeComponent" />
</KeepAlive>
```

**限制最多保留五个缓存实例：**

```vue
<KeepAlive :max="5">
    <component :is="activeComponent" />
</KeepAlive>
```

前两段中的 `include`、`exclude` 使用的是组件名称；`max` 是数字，因此写成动态绑定 `:max="5"`。当缓存数量达到限制并需要保留新实例时，Vue 会按最近最少使用的策略淘汰旧实例。也可以组合多个属性：

```vue
<KeepAlive include="CachedAccountQuery" :max="5">
    <component :is="activeComponent" />
</KeepAlive>
```

此时只有名称匹配 `CachedAccountQuery` 的组件才会进入缓存，其他组件切走后不会保留。

**`include` / `exclude` 匹配的是组件的 `name` 选项，不是点击按钮所用的业务标识。** Vue 3.2.34 及以上的 `<script setup>` 单文件组件可以从文件名推断组件名；如果项目需要显式指定名称，可以使用下一节的 `defineOptions()`。

需要注意：`KeepAlive` 是**组件缓存**，不是数据安全机制。敏感业务信息是否允许保留在前端内存中，应按实际安全规范处理；退出登录或切换用户时不能只依赖组件隐藏。

> [!EXERCISE] KeepAlive 为什么不能代替暂停轮询
>
> 给实时账户组件加了 `<KeepAlive>`，离开页面后定时查询仍然执行。为什么？应该在什么位置停止？
>
> 【答案】
>
> `KeepAlive` 让组件进入停用状态，但不会自动停止自己创建的 `setInterval()`。应在 `onDeactivated()` 中暂停，在 `onActivated()` 中恢复，并在 `onUnmounted()` 中兜底清理。

## defineOptions：声明组件自身的选项

### 它到底解决什么问题

第三天使用 `<script setup>` 时，我们把 `ref()`、函数和 Props 放在这个区域里。组件文件本身还可以有一些**组件选项（Component Options）**，例如组件的名字和是否自动继承外部传来的 HTML 属性。

在较早的写法中，这些选项写在 `export default { ... }` 里。Vue 3.3 起可以在 `<script setup>` 中直接使用 **`defineOptions()`**：

```ts
defineOptions({
    name: 'BankSearchInput',
    inheritAttrs: false
});
```

这里的两项分别是：

- `name`：组件名字。开发者工具和 `<KeepAlive include="...">` 等场景会用到它。
- `inheritAttrs`：是否把父组件传来的、**没有被声明为 Props 的属性**自动加到子组件根元素上。默认值为 `true`；设置为 `false` 就关闭自动透传。

`defineOptions()` 是 Vue **编译宏**：由 Vue 编译器处理，直接在 `<script setup>` 中使用，不需要 `import`。它不是运行时返回组件实例的函数，也不是 `defineProps()`、`defineEmits()` 的替代品。

### 什么叫“没有被声明为 Props 的属性”

假设父组件使用一个自定义输入组件：

```vue
<BankSearchInput
    v-model="keyword"
    placeholder="输入账户名称"
    maxlength="12"
/>
```

子组件声明了 `modelValue`，但没有声明 `placeholder` 和 `maxlength` 这两个 Props。那么 `placeholder`、`maxlength` 属于**透传属性（Fallthrough Attributes）**。

如果组件只有一个根元素，Vue 默认会把透传属性加到这个根元素上。问题是，子组件的根元素可能是 `<div>`，而真正需要 `placeholder` 的是里面的 `<input>`。

这就解释了为什么要写：

```ts
defineOptions({ inheritAttrs: false });
```

同时在目标输入框上写：

```vue
<input v-bind="$attrs" />
```

`$attrs` 是 Vue 提供的对象，保存当前组件收到的未声明为 Props 的透传属性。`v-bind="$attrs"` 表示把对象里的属性逐个绑定到当前元素上。它不是新的 JS 语法，而是 Vue 模板中 `v-bind` 的对象形式。

### 完整程序：把父组件属性传给内部输入框

文件：`src/components/BankSearchInput.vue`

```vue
<script setup lang="ts">
// Vue 3.3+：显式设置组件名，关闭根元素的自动属性透传。
defineOptions({
    name: 'BankSearchInput',
    inheritAttrs: false
});

const props = defineProps<{
    modelValue: string;
}>();

const emit = defineEmits<{
    (event: 'update:modelValue', value: string): void;
}>();

function handleInput(event: Event): void {
    // 原生 input 事件携带 Event，需要确认目标元素类型。
    if (event.target instanceof HTMLInputElement) {
        emit('update:modelValue', event.target.value);
    }
}
</script>

<template>
    <!-- 根元素是 div；父组件的 placeholder 不应该加到 div 上。 -->
    <div class="search-field">
        <label for="bank-keyword">账户查询：</label>

        <!-- 把没有声明为 Props 的属性转交给真正的 input。 -->
        <input
            id="bank-keyword"
            :value="props.modelValue"
            @input="handleInput"
            v-bind="$attrs"
        />
    </div>
</template>

<style scoped>
.search-field { display: flex; align-items: center; gap: 8px; margin: 12px 0; }
input { padding: 6px 10px; }
</style>
```

文件：`src/App.vue`

```vue
<script setup lang="ts">
import { ref } from 'vue';
import BankSearchInput from './components/BankSearchInput.vue';

const keyword = ref('');
</script>

<template>
    <h2>自定义账户搜索组件</h2>

    <BankSearchInput
        v-model="keyword"
        placeholder="请输入账户名称"
        :maxlength="12"
        aria-label="账户名称查询输入框"
    />

    <p>查询条件：{{ keyword || '未填写' }}</p>
</template>
```

**代码执行过程：**

1. 父组件的 `v-model="keyword"` 按第三天学习的约定，向子组件传 `modelValue` 并监听 `update:modelValue`。
2. 子组件把 `props.modelValue` 放进原生 `<input>` 的 `value`。
3. 父组件传来的 `placeholder`、`maxlength`、`aria-label` 没有定义为子组件 Props，因此由 `$attrs` 接收。
4. `v-bind="$attrs"` 把它们放到内部输入框，而不是外层 `<div>`。
5. 用户输入后，原生 `input` 事件被 `handleInput()` 接收，子组件发出 `update:modelValue`，父组件更新 `keyword`。

**运行验证：** 输入框应显示“请输入账户名称”的提示文字，输入内容最长为 12 个字符；输入内容时，下方“查询条件”同步更新。打开浏览器 Elements 面板，可以确认 `placeholder` 和 `maxlength` 最终落在内部 `<input>`，而不是外层 `<div>`。

### `name` 和 `inheritAttrs` 不要混淆

| 组件选项 | 作用 | 典型场景 |
| --- | --- | --- |
| `name` | 为组件指定名字 | DevTools 展示、KeepAlive 名称匹配 |
| `inheritAttrs: true` | 对单根组件默认透传属性 | 外部 class、title 等直接应用到根元素 |
| `inheritAttrs: false` | 关闭自动属性透传 | 需要把属性转交给内部 input 或其他元素 |

`defineOptions()` 的参数必须能在编译阶段处理，不能引用依赖组件实例的局部响应式变量。组件名称也不是在用户切换账户时动态改变的业务状态。

另外，`$attrs` 中的属性不等于 Props：**Props 是组件主动声明的公共接口；`$attrs` 是没有声明为 Props 的其余透传属性。** 不应该把关键业务数据全塞进 `$attrs`，否则组件的输入契约会变得模糊。

> [!EXERCISE] placeholder 不显示在哪里检查
>
> 父组件把 `placeholder` 传给 `<BankSearchInput>`，但子组件模板的根元素是 `<div>`，真正的输入框是内部 `<input>`。为什么属性可能没有正确生效？
>
> 【答案】
>
> Vue 默认会把未声明的属性透传到单一根元素，即外层 `<div>`。`placeholder` 对这个 `<div>` 没有输入提示作用。可以通过 `defineOptions({ inheritAttrs: false })` 关闭自动透传，再在内部 `<input>` 上使用 `v-bind="$attrs"`。

## defineExpose：允许父组件调用子组件公开的方法

### Props、Emit 已经能通信，为什么还要它

第三天的规则是：父组件给子组件传数据用 Props，子组件通知父组件发生了什么用 Emit。这仍然是大多数业务通信的首选。

但有些操作不是“传一份数据”或者“子组件向上报告事件”，而是**父组件主动要求子组件执行一个动作**，例如：

- 点击页面顶部“清空”按钮，让某个独立子表单重置；
- 弹窗打开后，让子表单聚焦到第一项；
- 点击页面外层“检查信息”按钮，让子表单执行内部校验。

这时候可以给子组件放一个**模板引用（Template Ref）**，然后由子组件通过 **`defineExpose()`** 明确开放少量方法。

### 模板引用中的 `ref` 是什么

注意同一个单词有两种关联用法：

```ts
const count = ref(0);
```

这创建一个响应式引用，保存数字。

```vue
<input ref="nameInput" />
```

这里 `ref="nameInput"` 是 Vue 模板的**特殊属性**，意思是“把这个 DOM 元素的引用保存到名为 `nameInput` 的模板引用变量里”。

在 `<script setup>` 中，可这样定义：

```ts
const nameInput = ref<HTMLInputElement | null>(null);
```

这行 TypeScript 的含义是：

- `HTMLInputElement` 是浏览器原生 `<input>` 对应的 DOM 类型；
- `null` 表示元素当前还不存在，比如首次渲染之前；
- `<HTMLInputElement | null>` 表示引用里可以是输入框，也可以是 `null`。

首次挂载完成之后，Vue 才会把 DOM 元素放到 `nameInput.value` 中。如果元素被 `v-if` 移除，该引用又可能变为 `null`。

如果 `ref` 放在**自定义组件标签**上，取得的就不是原生 DOM，而是子组件对外暴露的组件实例接口。

### `defineExpose()` 的写法

在子组件中：

```ts
function reset(): void {
    // 清理子组件的数据。
}

defineExpose({ reset });
```

`defineExpose()` 也是 Vue 的编译宏，不需要导入。`<script setup>` 创建的子组件默认不会把脚本中的所有变量、函数自动开放给父组件。**只有显式暴露的内容才是它允许父组件通过组件引用访问的公共接口。**

在父组件中：

```ts
const editorRef = ref<InstanceType<typeof AccountEditor> | null>(null);

function resetFromParent(): void {
    editorRef.value?.reset();
}
```

这里新增的 TypeScript 写法需要分开看：

- `typeof AccountEditor`：取得导入的组件定义对应的类型；
- `InstanceType<...>`：取得该组件的实例类型；
- `| null`：允许子组件还没有挂载；
- `?.reset()`：可选链调用，只有引用不为 `null` 时才调用 `reset()`。

在常见的 Vite + Vue + TypeScript 项目中，`InstanceType<typeof AccountEditor>` 可以用于给组件模板引用提供类型。要在 `<script setup>` 中尽早调用 `defineExpose()`；不要等到顶层 `await` 之后再调用，否则公开接口可能无法按预期建立。

### 完整程序：父组件要求子表单重置与聚焦

文件：`src/components/AccountEditor.vue`

```vue
<script setup lang="ts">
import { ref } from 'vue';

// 子组件自己管理尚未提交的姓名草稿。
const name = ref('张三');

// 原生输入框的模板引用，未挂载时为 null。
const nameInput = ref<HTMLInputElement | null>(null);

function reset(): void {
    name.value = '';
}

function focusName(): void {
    // focus() 是 HTMLInputElement 的原生 DOM 方法。
    nameInput.value?.focus();
}

// 明确只向父组件公开这两个方法。
// 组件内部的 name、nameInput 不在公开接口中。
defineExpose({ reset, focusName });
</script>

<template>
    <section class="editor">
        <label for="editor-name">账户姓名：</label>
        <input
            id="editor-name"
            ref="nameInput"
            v-model="name"
        />
        <p>子组件草稿：{{ name || '未填写' }}</p>
    </section>
</template>

<style scoped>
.editor { border: 1px solid #aaa; border-radius: 6px; padding: 14px; margin-top: 12px; }
</style>
```

文件：`src/App.vue`

```vue
<script setup lang="ts">
import { ref } from 'vue';
import AccountEditor from './components/AccountEditor.vue';

// 引用的是子组件的公开实例，不是原生 input。
const editorRef = ref<InstanceType<typeof AccountEditor> | null>(null);

function clearChild(): void {
    // 父组件不直接修改子组件内部的 name。
    editorRef.value?.reset();
}

function focusChild(): void {
    editorRef.value?.focusName();
}
</script>

<template>
    <h2>父组件控制子表单</h2>
    <button @click="clearChild">清空子表单</button>
    <button @click="focusChild">定位到姓名输入框</button>

    <!-- Vue 挂载后把子组件的公开实例放到 editorRef 中。 -->
    <AccountEditor ref="editorRef" />
</template>
```

**运行验证与调用链：**

输入“工资账户”，点击外层的“清空子表单”，输入变成空字符串。点击“定位到姓名输入框”，光标会移动到子组件中的输入框。

整个过程是：

```text
父组件按钮点击
    ↓
调用 editorRef.value?.reset()
    ↓
子组件公开方法 reset()
    ↓
子组件内部 name.value = ''
    ↓
子组件模板更新
```

父组件没有直接接触子组件的私有状态。以后子组件内部将 `name` 改名，或者重构输入区域，只要继续公开 `reset()`，父组件就不必跟着修改内部细节。

### `useTemplateRef()`：简化模板引用的写法（拓展）

前面的模板引用采用 `ref<HTMLInputElement | null>(null)`，这种写法在 Vue 3 较早版本中也能使用。Vue 3.5 起还提供 **`useTemplateRef()`**，让模板引用名称与变量之间的关系更直观。

例如模板写 `ref="bankInput"`，脚本可以写：

```ts
const bankInput = useTemplateRef<HTMLInputElement>('bankInput');
```

这里的字符串 `'bankInput'` 必须与模板的 `ref` 属性一致。返回值仍是响应式引用，初次挂载前元素还不存在，所以使用时同样需要考虑 `null`。

下面是这个 API 的完整程序，**仅适用于 Vue 3.5 及以上**。如果当前企业项目仍使用更早的 Vue 3 版本，继续使用上节的 `ref<HTMLInputElement | null>(null)` 即可。

文件：`src/App.vue`

```vue
<script setup lang="ts">
import { useTemplateRef, onMounted } from 'vue';

// 字符串 bankInput 与模板中的 ref="bankInput" 对应。
const bankInput = useTemplateRef<HTMLInputElement>('bankInput');

function focusInput(): void {
    bankInput.value?.focus();
}

// 初次挂载之后元素才真正存在。
onMounted(focusInput);
</script>

<template>
    <h2>银行账户输入框</h2>
    <input ref="bankInput" placeholder="请输入账户编号" />
    <button @click="focusInput">重新定位到输入框</button>
</template>
```

这里 `onMounted()` 是已经学过的生命周期钩子；新知识点只有 `useTemplateRef()` 的引用方式。它不会改变父子组件通信规则，也不能绕过 `defineExpose()` 访问子组件没有公开的方法。

**运行验证：** 首次打开页面时输入框自动聚焦。点击“重新定位到输入框”，浏览器焦点再次落在同一个输入框。若去掉 `onMounted(focusInput)`，首次打开时不会自动聚焦，但按钮在组件挂载后仍能调用 `focusInput()`。

### 与 Props、Emit 的适用边界

| 需要完成的事情 | 优先使用 | 原因 |
| --- | --- | --- |
| 父组件传入账户编号 | Props | 是明确的输入数据 |
| 子组件通知用户选择了账户 | Emit | 是明确的用户操作事件 |
| 父组件和子组件共同维护输入值 | `v-model` | 是值和更新事件的固定约定 |
| 父组件让子表单清空或聚焦 | `defineExpose` + 模板引用 | 是对子组件公开方法的直接调用 |

不要为了方便而用 `defineExpose({ ...所有变量和方法 })`。公开接口过大，会让父组件依赖子组件内部实现，后续维护反而困难。

> [!EXERCISE] 为什么父组件不能直接调用任意子函数
>
> `<script setup>` 子组件内部定义了 `reset()`，父组件已经写了 `ref="editorRef"`，为什么仍需要 `defineExpose({ reset })`？
>
> 【答案】
>
> `<script setup>` 组件默认不会公开其所有内部变量与函数。模板引用只能访问子组件明确暴露的公共实例接口；`defineExpose({ reset })` 用于建立这个接口。

## nextTick：先更新响应式数据，再操作新生成的 DOM

### 为什么修改变量后立刻取不到输入框

假设一个弹窗或编辑区通过 `v-if="editing"` 控制：

```vue
<input v-if="editing" ref="nameInput" />
```

用户点击“编辑”时，函数执行：

```ts
editing.value = true;
nameInput.value?.focus();
```

你可能觉得：`editing` 已经变为 `true`，输入框就应该存在了。实际上，Vue 为了效率，会把同一轮中的状态修改安排到后续的 DOM 更新流程里，而不是每改一个变量就立刻同步重建页面元素。

因此**修改响应式变量成功，不等于对应的 DOM 已经完成更新**。这时 `nameInput.value` 仍然可能是 `null`。

**`nextTick()`** 是 Vue 提供的函数，用于等待当前已经安排的 DOM 更新完成。使用它以后，才能稳定地操作这轮更新刚生成的元素。

```ts
editing.value = true;
await nextTick();
nameInput.value?.focus();
```

这里：

- `editing.value = true`：改变响应式状态；
- `await nextTick()`：等待 Vue 处理完当前轮 DOM 更新；
- `nameInput.value?.focus()`：在元素存在时聚焦。

`nextTick()` 来自 `vue`，需要 `import { nextTick } from 'vue'`。它返回 Promise，因此可以搭配已经学过的 `await`。使用 `await` 的函数需要声明为 `async`。

### 完整程序：显示编辑表单并自动聚焦

文件：`src/App.vue`

```vue
<script setup lang="ts">
import { ref, nextTick } from 'vue';

const editing = ref(false);
const name = ref('');
const nameInput = ref<HTMLInputElement | null>(null);
const message = ref('点击按钮开始编辑');

async function beginEdit(): Promise<void> {
    // 第一步：让模板准备显示输入框。
    editing.value = true;

    // 第二步：等待 Vue 完成这轮 DOM 更新。
    await nextTick();

    // 第三步：此时输入框已挂载，才尝试聚焦。
    nameInput.value?.focus();
    message.value = '编辑区域已显示，并已尝试定位输入框';
}

function closeEdit(): void {
    editing.value = false;
    message.value = '编辑区域已关闭';
}
</script>

<template>
    <h2>账户姓名编辑</h2>
    <button @click="beginEdit">开始编辑并聚焦</button>
    <button @click="closeEdit">关闭编辑</button>
    <p>{{ message }}</p>

    <section v-if="editing">
        <label for="focus-name">账户姓名：</label>
        <input
            id="focus-name"
            ref="nameInput"
            v-model="name"
            placeholder="输入姓名"
        />
        <p>当前输入：{{ name || '未填写' }}</p>
    </section>
</template>
```

**运行验证与预期结果：**

1. 初次页面没有姓名输入框。
2. 点击“开始编辑并聚焦”，输入框出现，浏览器焦点落到输入框中，可以直接输入。
3. 点击“关闭编辑”，`v-if` 移除输入框，模板引用变回 `null`。
4. 再次点击“开始编辑并聚焦”，`nextTick()` 等待新的输入框挂载后再次聚焦。

### 为什么不直接使用 `setTimeout()`

使用 `setTimeout(..., 0)` 把操作推迟到另一个任务，也不等于准确表达“等待 Vue 把 DOM 更新好”。它依赖事件循环调度，而且会让代码表达的意图变得模糊。

这里真正需要等待的是**Vue 的视图更新**，因此 `nextTick()` 更合适。

但 `nextTick()` 不会帮你等待后端接口请求。如果数据来自 Axios，仍然需要先 `await` 请求结果，再更新状态，并在需要读 DOM 时 `await nextTick()`。两种 `await` 等待的是不同的事情。

### 什么时候需要，什么时候不需要

| 需求 | 是否需要 `nextTick()` | 原因 |
| --- | --- | --- |
| 修改 `ref` 后让文本自动更新 | 不需要 | Vue 会自己安排模板更新 |
| `v-if` 显示输入框后立即调用 `.focus()` | 需要 | 必须等新 DOM 挂载 |
| 修改列表后读取最新 `scrollHeight` | 需要 | 要读取更新后的 DOM 尺寸 |
| 调用 Axios 等待服务器返回 | 不能用它代替请求等待 | `nextTick` 不负责网络 |

> [!EXERCISE] `nextTick` 等待的是哪一步
>
> 页面执行 `editing.value = true` 后立即读取 `nameInput.value`，为什么会是 `null`？`await nextTick()` 能帮我们等待什么？
>
> 【答案】
>
> 因为 Vue 把响应式状态对应的 DOM 更新安排在后续执行，输入框可能还没有被创建。`nextTick()` 等待本轮 Vue DOM 更新完成，不负责等待 HTTP 请求。

## 表单修饰符：清理输入与转换数据

在学习点击、提交和键盘事件修饰符之前，先了解紧接着的综合示例将使用到的 **`v-model` 表单修饰符**。`.trim` 和 `.number` 负责处理输入值的转换，不负责处理事件冒泡或浏览器默认提交。

它们与后面要学的 `@click.stop`、`@submit.prevent` 等 **`v-on` 事件修饰符** 属于不同类别：前者关注输入值如何写入响应式状态，后者关注事件如何触发和传播。

### `.trim`：去掉输入值首尾空白

```vue
<input v-model.trim="keyword" placeholder="请输入账户名称" />
```

假设 `keyword` 是一个字符串 ref，用户输入前后带空白的内容，Vue 将清理首尾空白后的结果同步到 `keyword`。它不会删除字符串中间的空格，也不能取代业务提交前的服务端参数校验。

### `.number`：尝试转换为数字

```vue
<input v-model.number="amount" type="number" />
```

假设 `amount` 的类型为 `ref<number | string>(100)`。用户输入可解析的数字时，模型值是数值；清空输入框时，模型值可以是空字符串。转换失败时会保留原值，所以不能仅因使用了 `.number` 就断言任何时刻的输入值都是 `number`。

对于原生 `type="number"` 的输入框，Vue 本身也会启用数字转换；这里显式写 `.number` 便于阅读。**实际提交金额前仍需验证是否为空、是否为合法数字、是否在允许范围内，并按接口约定处理金额精度。**

### `.trim` 和 `.number` 与事件修饰符的区别

```vue
<!-- 修改双向绑定的数据值。 -->
<input v-model.trim="keyword" />

<!-- 按 Enter 执行查询，不会自动清理 keyword。 -->
<input v-model="keyword" @keyup.enter="search" />
```

第一个例子修改输入值写入模型的规则，第二个例子修改什么键盘事件会执行函数。这两类修饰符服务于不同目的。

下面的完整程序可以在一个页面里观察 `.trim` 和 `.number` 的实际结果。

### 完整程序：姓名去空白与金额类型检查

文件：`src/App.vue`

```vue
<script setup lang="ts">
import { ref } from 'vue';

// 允许空字符串：用户把数字输入框清空后，值不一定是 number。
const amount = ref<number | string>(100);
const name = ref('');

function check(): void {
    console.log('姓名：', name.value);
    console.log('金额值：', amount.value);
    console.log('金额值的运行时类型：', typeof amount.value);
}
</script>

<template>
    <h2>查询条件类型实验</h2>
    <label>
        姓名：
        <input v-model.trim="name" placeholder="输入姓名" />
    </label>
    <label>
        金额：
        <input v-model.number="amount" type="number" />
    </label>
    <button @click="check">检查输入值</button>

    <p>姓名：{{ name }}</p>
    <p>金额：{{ amount }}</p>
    <p>金额类型：{{ typeof amount }}</p>
</template>
```

**运行验证：** 在姓名框输入前后带空白的文字，观察下方显示的姓名已经去除首尾空白；在金额框输入 `125` 并点击“检查输入值”，Console 显示金额类型为 `number`；清空金额输入框后再检查，金额值是空字符串，类型为 `string`。如果你输入的数据不满足业务金额要求，`.number` 不会代替业务校验。

这说明表单修饰符改变的是**输入值写入响应式状态的处理方式**。后面介绍事件修饰符时，将把这两类语法结合成一个账户页面示例。

## 事件修饰符：少写事件细节，多表达操作意图

### 从普通事件回顾

第一天我们已经写过：

```vue
<button @click="search">查询</button>
```

这里 `@click` 是 `v-on:click` 的简写，表示点击时执行 `search()`。

企业页面的事件处理还需要面对一些浏览器本身的行为：

- 点击表格行里的“删除”按钮时，浏览器会把点击事件向外层行元素传播；
- 在原生 `<form>` 中提交时，浏览器默认会执行表单提交行为；
- 用户在查询输入框里按 Enter，希望直接执行查询；
- 某些引导按钮只允许被触发一次。

Vue 提供 **事件修饰符（Event Modifiers）**。它们是写在事件名称后、以点号开头的限定语法：

```vue
<button @click.stop="remove">删除</button>
```

`.stop` 并不是新的 JavaScript 函数，而是 Vue 编译模板时附加的事件处理要求：触发这个点击事件时阻止它继续冒泡到外层。

### `.stop`：阻止点击冒泡

先理解原生 DOM 的**冒泡（Bubbling）**：当你点击一个嵌套元素，事件会先在目标元素处触发，然后沿着 DOM 祖先节点向外传播。

例如，页面里有一个可点击的账户卡片，卡片内部还有删除按钮：

```vue
<div @click="openDetail">
    <button @click="remove">删除</button>
</div>
```

点击按钮时，浏览器先触发按钮的点击处理，再把同一个点击事件向上传给外层 `<div>`。结果可能是先删除，再打开详情，显然不符合业务预期。

改成：

```vue
<div @click="openDetail">
    <button @click.stop="remove">删除</button>
</div>
```

点击按钮时，按钮处理函数正常执行，但事件不会再继续冒泡到外层卡片。

注意 `.stop` 只控制这次 DOM 事件的传播，**不会自动阻止后端删除，也不会替你完成确认弹窗**。

如果子组件的点击处理本身会发出 `emit('remove', id)`，`.stop` 也不会自动取消自定义组件事件。它处理的是当前 DOM 点击事件向祖先 DOM 元素传播的问题。

### `.prevent`：阻止浏览器默认行为

原生表单提交默认会触发浏览器导航或重新加载页面的行为。单页应用往往希望由 JavaScript 接管提交过程：

```vue
<form @submit.prevent="submitForm">
    <input v-model="name" />
    <button type="submit">保存</button>
</form>
```

这里：

- `<form>` 是 HTML 原生表单；
- `type="submit"` 表示这个按钮负责触发表单提交；
- `@submit.prevent` 监听 submit 事件，同时调用 `preventDefault()` 阻止浏览器默认提交；
- `submitForm()` 再决定执行校验、请求和状态更新。

**`.prevent` 不是“阻止运行提交函数”**，它只是阻止浏览器的默认动作。自定义的 `submitForm()` 仍会执行。

### `.enter`：把键盘输入转成业务操作

```vue
<input v-model="keyword" @keyup.enter="search" />
```

`keyup` 是用户松开按键时触发的键盘事件；`.enter` 表示只在按下并松开 Enter 键时执行查询。

如果输入框位于 `<form>` 内，Enter 本身就可能触发原生表单提交。**不要不加分析地同时在表单上写 `@submit.prevent="search"`，又在同一个输入框上写 `@keyup.enter="search"`**，否则一次 Enter 操作有机会触发两条路径。先统一决定由哪一个事件负责提交。

### `.self`：只在事件目标是当前元素时执行

遮罩层中有一个弹窗内容区，用户点击弹窗内部时不应关闭弹窗，点击遮罩空白处才关闭：

```vue
<div class="mask" @click.self="closeDialog">
    <section class="dialog">
        <p>账户操作确认</p>
        <button @click="confirm">确认</button>
    </section>
</div>
```

这里监听器绑在外层 `.mask`。点击空白遮罩时，事件目标就是 `.mask`，执行 `closeDialog()`；点击里面的 `<section>` 或按钮时，事件目标是内部元素，**不执行** `closeDialog()`。不过，内部按钮自己的 `confirm()` 仍然可以执行。

`.self` 和 `.stop` 不相同：`.self` 检查事件目标是不是当前元素；`.stop` 阻止事件继续向祖先元素冒泡。`.self` 本身**不会阻止冒泡**。

### `.once`：让当前事件监听器最多触发一次

例如用户首次阅读操作指引后，记录一次确认行为：

```vue
<button @click.once="acknowledge">
    我已阅读操作指引
</button>
```

第一次点击会执行 `acknowledge()`，之后再次点击不会触发这个监听器。它**不等于自动禁用按钮**，也不会禁止同一个函数通过其他代码入口被调用。

`.once` 只约束当前前端事件监听器，**并不等于业务接口具备幂等性**，不能代替后端的重复提交保护。

### 修饰符可以组合，但执行顺序有意义

例如：

```vue
<form @submit.prevent="submitForm">
    <button type="submit" @click.stop="recordClick">提交</button>
</form>
```

按钮的 `.stop` 只阻止 **click** 事件的冒泡；提交按钮仍会触发表单的 **submit** 事件，由 `@submit.prevent` 接管。两个事件不同，不能认为阻止 click 冒泡就阻止了 form 提交。

**事件修饰符小结：** `.stop` 管传播、`.prevent` 管默认行为、`.enter` 管按键过滤、`.self` 管目标元素、`.once` 管触发次数。

### 完整程序：账户卡片、查询输入和原生提交

文件：`src/App.vue`

```vue
<script setup lang="ts">
import { ref } from 'vue';

const keyword = ref('');
const note = ref('');
const log = ref<string[]>([]);
const showTips = ref(true);

function record(text: string): void {
    // 把新操作日志放到最前面，方便观察事件是否触发。
    log.value.unshift(text);
}

function openDetail(): void {
    record('打开账户详情：101');
}

function removeAccount(): void {
    record('点击删除账户：101（只记录操作，不真正删除）');
}

function search(): void {
    record(`查询关键词：${keyword.value}`);
}

function submitForm(): void {
    record(`提交备注：${note.value}`);
}

function closeTips(): void {
    showTips.value = false;
    record('点击遮罩空白区域，关闭说明');
}

function acknowledge(): void {
    record('已阅读提示（只记录一次）');
}
</script>

<template>
    <h2>账户事件处理演示</h2>

    <div class="account-card" @click="openDetail">
        <strong>账户 101：储蓄账户</strong>
        <button @click.stop="removeAccount">删除（不打开详情）</button>
    </div>

    <div class="line">
        <input
            v-model.trim="keyword"
            placeholder="输入查询关键词，按 Enter"
            @keyup.enter="search"
        />
        <button @click="search">查询</button>
    </div>

    <!-- 原生 form 的提交交给 Vue 接管，不会刷新浏览器页面。 -->
    <form @submit.prevent="submitForm" class="line">
        <input v-model.trim="note" placeholder="输入备注" />
        <button type="submit">保存备注</button>
    </form>

    <button @click.once="acknowledge">我已阅读（仅触发一次）</button>

    <div v-if="showTips" class="mask" @click.self="closeTips">
        <div class="dialog">
            <p>这是模拟业务说明区。</p>
            <p>点击说明框内部不会关闭，点击灰色空白遮罩才会关闭。</p>
        </div>
    </div>

    <h3>操作日志</h3>
    <ul>
        <li v-for="(item, index) in log" :key="index">{{ item }}</li>
    </ul>
</template>

<style scoped>
.account-card { display: flex; gap: 16px; align-items: center; border: 1px solid #aaa; padding: 12px; cursor: pointer; }
.line { display: flex; gap: 8px; margin-top: 12px; }
.mask { margin-top: 12px; min-height: 120px; padding: 16px; background: #ddd; cursor: pointer; }
.dialog { width: 75%; background: #fff; padding: 10px; cursor: default; }
</style>
```

**运行验证与预期结果：**

- 点击卡片空白处，日志出现“打开账户详情”。
- 点击卡片内的“删除”，只出现删除日志，不会同时出现打开详情。
- 在查询框输入两端带空格的文字，再按 Enter，可以观察 `.trim` 的处理结果。
- 在备注表单中点击“保存备注”，页面不会因为原生 form 提交而刷新，输入与日志继续保留。
- 连续点击“我已阅读”，对应日志只新增一次。
- 点击说明框内部，遮罩保留；点击遮罩空白处，说明消失。

本例使用 `:key="index"` 只因为操作日志是简单的展示列表，并没有在行内维护独立表单状态。业务记录列表仍应优先使用稳定 ID 作为 `key`。

> [!EXERCISE] 为什么一个 Enter 操作可能调用两次查询
>
> `<form @submit.prevent="search">` 包住输入框，输入框又写了 `@keyup.enter="search"`。为什么有重复执行风险？
>
> 【答案】
>
> Enter 可能触发表单提交，而输入框的 `keyup.enter` 又调用一次 `search()`。应该统一提交入口，例如只使用表单的 `@submit.prevent="search"`，或者调整结构让输入框 Enter 与表单提交不会形成两条重复路径。

## 动态样式：根据业务状态改变外观

### 静态 class 与动态 class 是什么关系

HTML 中已经有：

```html
<div class="account-card">账户信息</div>
```

这表示元素始终使用 `account-card` 样式。

但业务页面还需要根据状态切换外观：账户停用时显示灰色背景；校验出错时显示红色边框；金额较高时强调显示。

Vue 提供 `:class` 和 `:style`。它们都是 `v-bind` 的特殊形式：

- `:class` 管理元素拥有哪些 CSS 类名；
- `:style` 管理元素的行内 CSS 样式值。

### `:class` 的对象写法

```vue
<div :class="{ disabled: !active }">账户信息</div>
```

右边是一个 JavaScript 对象：

- 键 `disabled` 是 CSS 类名；
- 值 `!active` 是布尔表达式；
- 为真时加入 `disabled` 类，为假时不加入。

如果 CSS 类名带短横线，可以写成字符串键：

```vue
<div :class="{ 'account-disabled': !active }">账户信息</div>
```

还可以与静态 `class` 同时使用：

```vue
<div class="account-card" :class="{ 'account-disabled': !active }">
    账户信息
</div>
```

这里 `account-card` 始终存在；`account-disabled` 取决于 `active`。

`:class` 也支持数组，例如：

```vue
<div :class="['account-card', { 'account-disabled': !active }]">
    账户信息
</div>
```

这个数组把固定类名和条件类名组合在一起。开发时选一种易读写法即可，不必把所有页面都改成数组形式。

### `:style` 的对象写法

```vue
<span :style="{ color: active ? 'green' : 'gray' }">
    账户状态
</span>
```

对象里的 `color` 是 CSS 属性名，右侧是根据状态计算的属性值。

对于带短横线的 CSS 属性，JavaScript 对象中可以使用驼峰形式：

```ts
const amountStyle = computed(() => ({
    fontSize: '20px',
    fontWeight: 'bold'
}));
```

`fontSize` 对应 CSS 的 `font-size`，`fontWeight` 对应 `font-weight`。例如字号的 `20px` 是带单位的字符串，不应在这个场景下只写无单位的 `20`。

### 完整程序：账户启用状态与余额提示

文件：`src/App.vue`

```vue
<script setup lang="ts">
import { ref, computed } from 'vue';

const active = ref(true);
const balance = ref(3200);

const balanceStyle = computed(() => {
    // 余额达到阈值时用深蓝色，否则使用普通颜色。
    return {
        color: balance.value >= 5000 ? '#1b4f72' : '#444',
        fontWeight: balance.value >= 5000 ? 'bold' : 'normal',
        fontSize: '20px'
    };
});

function toggleActive(): void {
    active.value = !active.value;
}

function addBalance(): void {
    balance.value += 2000;
}
</script>

<template>
    <h2>账户状态样式</h2>

    <!-- 固定类名始终存在，条件类名随 active 更新。 -->
    <article class="account-card" :class="{ 'account-disabled': !active }">
        <h3>工资账户</h3>

        <p>
            状态：
            <strong :class="active ? 'state-on' : 'state-off'">
                {{ active ? '启用' : '停用' }}
            </strong>
        </p>

        <!-- 余额的样式值来自 computed，模板无需手动操作 DOM。 -->
        <p>余额：<span :style="balanceStyle">{{ balance }} 元</span></p>
    </article>

    <button @click="toggleActive">切换启用状态</button>
    <button @click="addBalance">余额增加 2000 元</button>
</template>

<style scoped>
.account-card { padding: 16px; border: 1px solid #bbb; border-radius: 8px; margin-bottom: 12px; }
.account-disabled { background: #eee; opacity: 0.75; }
.state-on { color: #167047; }
.state-off { color: #a33b3b; }
button { margin-right: 8px; }
</style>
```

**运行验证与预期结果：**

1. 初次显示时，账户为“启用”，余额 3200 元，余额颜色是普通灰色。
2. 点击“切换启用状态”，卡片背景变灰、文字变为“停用”，但余额数值不变。
3. 点击“余额增加 2000 元”，余额变为 5200 元，`balanceStyle` 重新计算并将数字强调显示。
4. 再切换账户状态，只有与 `active` 相关的类名变化；它不会自动改变 `balance`。

### 为什么这比手动设置 `element.style` 更适合业务组件

在这个程序中，`active` 和 `balance` 是唯一需要维护的业务状态。点击按钮后，Vue 会根据绑定关系更新 class 和 style。开发者不需要手动查找 DOM，再调用 `classList.add()` 或修改元素的 `style.color`。

页面样式能通过绑定表达清楚时，应优先使用 `:class`、`:style`；只有确实需要直接操作原生 DOM 行为时，才考虑自定义指令。

**外观禁用不是业务权限控制。** `.account-disabled` 只是颜色和透明度变化，不会阻止点击，也不会禁止调用后端接口。如果业务要限制操作，需要另外控制控件状态，并由后端执行最终权限校验。

> [!EXERCISE] 动态类名为什么没有生效
>
> CSS 定义了 `.account-disabled`，模板写成 `:class="{ accountDisabled: !active }"`。为什么停用时没有应用到目标样式？
>
> 【答案】
>
> 对象键 `accountDisabled` 对应的类名是 `accountDisabled`，而不是 `account-disabled`。可以改成 `:class="{ 'account-disabled': !active }"`，使它与 CSS 选择器名称一致。

## 自定义指令：抽出重复的 DOM 操作

### 自定义指令和组件、Composable 有什么区别

在企业项目中你可能会看到：

```vue
<input v-focus />
```

Vue 内置指令包括 `v-if`、`v-for`、`v-model` 等，但 **`v-focus` 不是 Vue 自带的**。只有开发者在当前组件或全局注册它之后，才能在模板里使用。

**自定义指令（Custom Directive）**适合复用需要直接访问或操作 DOM 的行为，例如“某个输入框挂载后自动获得焦点”。

与其他复用方式对照：

| 方式 | 主要封装内容 | 例子 |
| --- | --- | --- |
| Vue 组件 | 一块界面结构及其逻辑 | 账户卡片、查询表单 |
| Composable | 可复用的状态和处理逻辑 | `useCounter()`、窗口宽度监听 |
| 自定义指令 | 直接作用于 DOM 元素的行为 | `v-focus` 自动聚焦输入框 |

并不是任何业务函数都适合写成指令。数据筛选、接口请求、表单数据管理，更适合放在组件、Composable 或 API 模块中。

### 局部自定义指令怎样命名

在 `<script setup>` 中，可以定义一个以 `v` 开头、后面使用驼峰命名的变量：

```ts
const vFocus = {
    mounted(el: HTMLInputElement) {
        el.focus();
    }
};
```

模板中就可以写：

```vue
<input v-focus />
```

这里的对应关系是：

- 脚本变量 `vFocus`；
- 模板指令 `v-focus`。

这不是在 Vue 中凭空调用一个叫 `focus` 的函数，而是 Vue 在渲染时识别 `v-focus` 并执行注册对象中匹配时机的钩子。

### `mounted()`、`updated()` 和 `unmounted()`

自定义指令可以声明多个生命周期钩子。它们和 Vue 组件的生命周期概念相似，但操作对象不同：

- `mounted(el, binding)`：绑定的 DOM 元素挂载后执行；
- `updated(el, binding)`：指令所在组件及其子组件更新后执行；
- `unmounted(el, binding)`：绑定的 DOM 元素卸载时执行。

`el` 是当前指令真正作用的 DOM 元素。`binding` 提供指令相关信息，例如指令参数值 `binding.value` 和上一次绑定的值 `binding.oldValue`。

如果只是“输入框初次出现时聚焦”，用 `mounted()` 就足够；如果还要求“把一个响应式开关从 false 改为 true 时重新聚焦”，就可以配合 `updated()` 判断变化。

### `ObjectDirective`：为自定义指令声明类型

在 TypeScript 项目中，可以使用 Vue 导出的 `ObjectDirective` 类型明确指令允许绑定什么元素、接收什么值。例如：

```ts
import type { ObjectDirective } from 'vue';

const vFocus: ObjectDirective<HTMLInputElement, boolean> = {
    mounted(el, binding) {
        // el 必须是 input；binding.value 是布尔开关。
        if (binding.value) {
            el.focus();
        }
    }
};
```

`ObjectDirective<元素类型, 绑定值类型>` 的第一个类型参数是指令作用的 DOM 元素类型，第二个类型参数是 `v-focus="..."` 传入的值类型。这里分别是 `HTMLInputElement` 和 `boolean`。

在 `mounted()`、`updated()` 等钩子中，`el` 是当前元素，`binding.value` 是这次的绑定值，`binding.oldValue` 是上一次的绑定值。完整程序会在开关从 `false` 变为 `true` 时重新聚焦，并在元素移除时记录 `unmounted()` 的执行。

### 完整程序：局部 `v-focus` 指令

文件：`src/App.vue`

```vue
<script setup lang="ts">
import { ref } from 'vue';
import type { ObjectDirective } from 'vue';

const visible = ref(true);
const shouldFocus = ref(true);
const keyword = ref('');

// ObjectDirective 是 Vue 提供的 TypeScript 类型。
// 第一个泛型表示该指令预期绑定在 input 元素上；
// 第二个泛型表示绑定值是 boolean。
const vFocus: ObjectDirective<HTMLInputElement, boolean> = {
    mounted(el, binding) {
        // 元素首次挂载后，如果开关为 true，就聚焦。
        if (binding.value) {
            el.focus();
        }
    },

    updated(el, binding) {
        // 只有开关从非 true 变为 true 时，才主动聚焦。
        if (binding.value && !binding.oldValue) {
            el.focus();
        }
    },

    unmounted() {
        // 本例没有定时器等资源需要清理，只记录卸载时机。
        console.log('v-focus 对应的输入框已卸载');
    }
};

function toggleInput(): void {
    visible.value = !visible.value;
}

</script>

<template>
    <h2>账户查询自动聚焦</h2>

    <button @click="toggleInput">
        {{ visible ? '移除输入框' : '重新显示输入框' }}
    </button>

    <label>
        <input type="checkbox" v-model="shouldFocus" />
        允许自动聚焦
    </label>

    <p>
        <input
            v-if="visible"
            v-focus="shouldFocus"
            v-model="keyword"
            placeholder="输入账户关键词"
        />
    </p>

    <p>查询条件：{{ keyword || '未填写' }}</p>
</template>
```

**运行验证与预期结果：**

1. 页面初次打开时，`visible=true`、`shouldFocus=true`，输入框挂载，指令的 `mounted()` 调用 `.focus()`。
2. 取消勾选“允许自动聚焦”，把 `shouldFocus` 设为 `false`。
3. 再勾选，开关从 `false` 变为 `true`，指令在更新阶段重新聚焦输入框。
4. 点击“移除输入框”，`v-if` 让元素卸载，Console 记录 `unmounted()` 的日志。
5. 再点击“重新显示输入框”，Vue 创建新 DOM 元素，再次执行指令的 `mounted()`。如果开关为真，就自动聚焦。

`focus()` 是浏览器 `HTMLInputElement` 的原生方法，不是 Vue 才有的方法；Vue 的作用是把这个原生行为安排到合适的元素生命周期里。

### 全局注册：所有组件都能使用同一条指令

前面的 `vFocus` 只在当前 `App.vue` 中有效。如果多个页面都需要它，可以把指令抽成模块，再在应用入口统一注册。

文件：`src/directives/focus.ts`

```ts
import type { ObjectDirective } from 'vue';

const focusDirective: ObjectDirective<HTMLInputElement> = {
    mounted(el) {
        el.focus();
    }
};

export default focusDirective;
```

文件：`src/main.ts`

```ts
import { createApp } from 'vue';
import App from './App.vue';
import focusDirective from './directives/focus';

const app = createApp(App);

// app.directive('focus', ...) 注册后，模板中使用 v-focus。
app.directive('focus', focusDirective);

app.mount('#app');
```

文件：`src/App.vue`

```vue
<script setup lang="ts">
import { ref } from 'vue';

const keyword = ref('');
const shown = ref(true);
</script>

<template>
    <h2>全局自动聚焦指令</h2>
    <button @click="shown = !shown">切换输入框</button>

    <!-- v-focus 已在 main.ts 中全局注册。 -->
    <input
        v-if="shown"
        v-focus
        v-model="keyword"
        placeholder="账户名称"
    />

    <p>当前关键词：{{ keyword }}</p>
</template>
```

这里多了一个新的 Vue 应用 API：`app.directive(name, definition)`。第一个参数 `'focus'` 是指令注册名称，第二个参数是指令定义对象；模板用 `v-focus` 使用它。和局部指令一样，真正的输入框每次被 `v-if` 创建时，都会执行指令的挂载钩子。

**运行验证：** 重新启动使用这个 `main.ts` 的项目，输入框首次显示时自动获得焦点；点击“切换输入框”使其消失，再点击让它重新出现，新的输入框会再次自动聚焦。与局部指令不同，其他组件也可直接使用这个已注册的 `v-focus`，不必每个组件重复声明 `const vFocus`。

### 哪些场景不应该用自定义指令

有些企业项目会写 `v-permission` 控制按钮是否显示。阅读这种代码时要知道：**仅在浏览器里隐藏或禁用按钮不能建立真正的授权边界**。用户可以绕过前端界面直接调用 HTTP 接口，所以真实权限校验必须由后端执行。

另外，自定义指令应优先用在原生 DOM 元素上。如果把指令绑定到复杂自定义组件，最终作用的根节点、多个根节点的情况和组件更新时机都会增加理解难度。能用 Props、`:class`、`v-if` 表达的状态变化，先使用已有声明式能力。

> [!EXERCISE] `v-focus` 是不是 Vue 内置指令
>
> 一个项目的模板里直接写 `<input v-focus />`，但当前组件没有声明 `vFocus`。应该去哪里继续查找？
>
> 【答案】
>
> 先查 `main.ts` 是否使用 `app.directive('focus', ...)` 全局注册，再查是否有其他插件统一注册指令；如果都没有，该模板可能缺少指令定义。Vue 本身不提供一个默认的 `v-focus` 指令。

## 当日复盘与项目阅读方法

### 看到陌生标签时先判断它属于哪一类

企业项目里可能同时出现 Vue 内置特殊标签、Element Plus 标签和团队自定义组件。单看名字不一定能知道它是哪一类，应该按来源逐步判断。

| 看到的写法 | 来源或性质 | 首先查什么 |
| --- | --- | --- |
| `<component :is="..." />` | Vue 内置动态组件占位元素 | `:is` 最终返回哪个组件定义 |
| `<KeepAlive>` | Vue 内置缓存组件 | 包住的组件是谁、是否被缓存 |
| `defineOptions({ ... })` | `<script setup>` 编译宏 | 组件名和属性继承配置 |
| `defineExpose({ ... })` | `<script setup>` 编译宏 | 对父组件公开了哪些字段或方法 |
| `ref="editorRef"` | Vue 模板特殊属性 | 引用的是 DOM 还是子组件实例 |
| `nextTick()` | Vue DOM 更新时序 API | 当前等待哪轮 DOM 更新 |
| `@click.stop` | Vue 事件修饰符 | 是否需要阻止 DOM 事件冒泡 |
| `@submit.prevent` | Vue 事件修饰符 | 是否需要阻止浏览器默认提交 |
| `:class` / `:style` | Vue 动态属性绑定 | 哪个业务状态决定样式 |
| `v-focus` | 项目自定义指令 | 当前组件 `vFocus` 或全局 `app.directive()` |
| `<el-dialog>` | Element Plus 组件 | 组件库的 Props、事件与插槽 |
| `<EsStep>` 等 | 可能是团队自定义组件 | 导入路径、类型声明、Props、Emit、插槽 |

例如在真实项目里遇到：

```vue
<KeepAlive :include="cachedNames">
    <component :is="currentView" />
</KeepAlive>
```

可以按这个顺序理解：

1. 查 `currentView`，确认当前显示的组件从哪里导入。
2. 查 `cachedNames`，确认哪些组件名允许进入缓存。
3. 查被缓存组件里的 `onActivated()`、`onDeactivated()`，确认切换时有没有恢复查询或暂停资源。
4. 查子组件内部的数据初始化，确认缓存能否保留查询条件。
5. 如果发现缓存失效，再检查组件名、`key` 和切换时的组件实例身份。

不要仅凭“切回来页面显示旧数据”就判断接口缓存。组件实例缓存、Pinia 共享状态和请求层缓存属于不同机制，应该分别追踪。

### 不同通信与行为机制的职责

| 需求 | 推荐工具 | 原因 |
| --- | --- | --- |
| 根据业务类型显示不同页面块 | `<component :is>` | 同一个位置选择不同组件定义 |
| 切换后保留表单内容 | `<KeepAlive>` | 保留被切换组件实例 |
| 切走后暂停轮询，切回后恢复 | `onDeactivated()` / `onActivated()` | 缓存组件的激活状态发生变化 |
| 显式命名组件 | `defineOptions({ name })` | 明确组件元数据 |
| 将 placeholder 交给内部 input | `inheritAttrs: false` + `$attrs` | 控制透传属性最终落在哪个元素 |
| 父组件要求子表单清空 | `defineExpose()` + 模板引用 | 明确开放命令式操作 |
| 打开编辑区后自动聚焦 | `nextTick()` + 模板引用 | 等待新 DOM 生成 |
| 表格行按钮不触发行点击 | `@click.stop` | 阻止事件向外冒泡 |
| 原生表单提交不刷新页面 | `@submit.prevent` | 阻止默认行为 |
| 根据账户状态显示灰色样式 | `:class` / `:style` | 用响应式状态声明界面外观 |
| 多个输入框复用自动聚焦行为 | 自定义指令 `v-focus` | 封装底层 DOM 操作 |

### 简单自测

> [!EXERCISE] 综合判断
>
> 某业务页用 `<component :is="view">` 在账户查询和转账草稿间切换，用户反映：切回账户查询时查询条件清空；加上 `<KeepAlive>` 后条件保留，但切到转账草稿时查询页的定时器仍继续运行。应分别处理哪两个问题？
>
> 【答案】
>
> 先用 `<KeepAlive>` 保留账户查询组件实例及其内部状态；再在账户查询组件的 `onDeactivated()` 中停止定时器、`onActivated()` 中恢复定时器，真正卸载时用 `onUnmounted()` 兜底清理。缓存状态和释放外部资源是两件不同的事。

> [!EXERCISE] 区分模板引用与响应式数据
>
> `const inputRef = ref<HTMLInputElement | null>(null)` 和 `const keyword = ref('')` 都调用了 `ref()`，它们为什么不是同一类业务变量？
>
> 【答案】
>
> `keyword` 保存字符串业务状态；`inputRef` 用于接收模板中的原生 DOM 元素，元素挂载前还不存在，因此初始化为 `null`。前者主要参与模板数据绑定，后者主要用于调用 `.focus()` 等 DOM 方法。

> [!EXERCISE] 为什么样式不能代替权限
>
> 账户状态为停用时，页面给按钮加了灰色 class。是否可以据此保证停用账户不能提交交易？
>
> 【答案】
>
> 不能。class 只改变外观，并不构成业务授权。前端应根据状态禁用相应控件，并在操作函数里检查；后端仍必须独立验证账户状态、用户权限及交易规则。

### 官方文档索引

- [Vue：动态组件](https://vuejs.org/guide/essentials/component-basics.html#dynamic-components)
- [Vue：KeepAlive](https://vuejs.org/guide/built-ins/keep-alive.html)
- [Vue：script setup、defineOptions 和 defineExpose](https://vuejs.org/api/sfc-script-setup.html)
- [Vue：模板引用](https://vuejs.org/guide/essentials/template-refs.html)
- [Vue：响应式 DOM 更新与 nextTick](https://vuejs.org/guide/essentials/reactivity-fundamentals.html#dom-update-timing)
- [Vue：事件处理与修饰符](https://vuejs.org/guide/essentials/event-handling.html)
- [Vue：表单输入绑定与修饰符](https://vuejs.org/guide/essentials/forms.html#modifiers)
- [Vue：动态 class 和 style](https://vuejs.org/guide/essentials/class-and-style.html)
- [Vue：自定义指令](https://vuejs.org/guide/reusability/custom-directives.html)
