---
id: vue-course-supplement-day-3
order: 1108
date: 2026-11-03
updated: 2026-11-03
tags: [Vue, TypeScript, Vue Router, 路由守卫, 嵌套路由, 权限控制]
description: "使用账户管理和业务办理页面，掌握嵌套路由、命名导航、参数、路由元信息、导航守卫、懒加载、404、离开确认与动态路由。"
draft: false
---

## 学习目标与时间安排

前五天已经学过 Vue Router 的基础：`createRouter()`、`RouterLink`、`RouterView`、`useRoute()`、`useRouter()`，以及 `/accounts/:id` 这样的动态地址。补充第一天又学了动态组件与 `<KeepAlive>`，补充第二天学了常见的 Element Plus 业务组件。

现在考虑一个企业网银后台：页面上方和左侧是固定的业务导航，中间区域在“账户列表”“账户详情”“转账草稿”之间切换。未登录用户不能访问账户页面；普通用户不能进入管理页面；编辑转账草稿后如果直接离开，页面应提醒尚未保存。随着项目变大，还需要按需加载不同的业务页面，避免把所有页面代码一次性加载到浏览器中。

这些事情主要通过 **Vue Router（Vue 的客户端路由库）** 实现。本日重点是把“URL 怎样对应页面”和“进入页面之前要做哪些判断”联系起来，而不是只记住更多路由 API。

| 学习内容 | 建议时间 | 主要掌握什么 |
| --- | ---: | --- |
| 嵌套路由、公共布局与重定向 | 20 分钟 | `children`、多层 `RouterView`、`redirect` |
| 命名路由和地址参数 | 15 分钟 | `name`、`params`、`query`、`push`、`replace` |
| 路由元信息与导航守卫 | 25 分钟 | `meta`、`beforeEach`、登录与角色检查 |
| 路由懒加载与 404 页面 | 15 分钟 | `() => import()`、通配匹配、开发观察 |
| 路由更新和离开确认 | 20 分钟 | `watch`、`onBeforeRouteUpdate`、`onBeforeRouteLeave` |
| 导航后处理与排查 | 15 分钟 | `afterEach`、页面标题、导航失败 |
| 综合练习与验收 | 10 分钟 | 从点击入口追踪到路由和页面 |
| **主线合计** | **120 分钟** | |

动态添加路由、TypeScript 路由元信息类型扩展及部署差异安排在拓展部分，不要求第一次学习时全部掌握。

### 运行准备

继续使用 Vue 3 + TypeScript + Vite 项目。在**含有 `package.json` 的项目根目录**执行：

```bash
npm install vue-router@4
npm run dev
```

`vue-router@4` 是供 Vue 3 使用的 Vue Router 4。安装命令中的 `@4` 指主版本，不是把版本固定成 4.0.0。如果项目已经安装 Vue Router 4，不需要重复安装。

本日示例采用 **Hash 历史模式**，浏览器地址类似：

```text
http://localhost:5173/#/accounts
http://localhost:5173/#/accounts/101
```

`#` 后面的部分由前端路由处理，不会作为普通路径传给服务器。因此，本地学习时不必先配置 Nginx 或后端的页面回退规则。若真实项目使用 `createWebHistory()`，后面会说明区别。

### 全部示例共用的入口文件

为了把注意力放在路由本身，下面的**每一个完整示例**都共用这两个文件。先复制一次，后续章节按说明替换 `src/router/index.ts` 和相关页面文件即可；不需要反复创建 `main.ts` 和根组件。

文件：`src/main.ts`

```ts
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

const app = createApp(App);

// 安装 Router 后，组件才能使用 RouterLink、RouterView 等能力。
app.use(router);

// 挂载到 index.html 里的 <div id="app"></div>。
app.mount('#app');
```

文件：`src/App.vue`

```vue
<script setup lang="ts">
import { RouterView } from 'vue-router';
</script>

<template>
    <main class="app-shell">
        <!-- 当前路由匹配的顶层页面，显示在这个位置。 -->
        <RouterView />
    </main>
</template>

<style scoped>
.app-shell {
    max-width: 920px;
    margin: 24px auto;
    padding: 16px;
    font-family: Arial, sans-serif;
}
</style>
```

这里需要区分：

- `app.use(router)` 是把一个 Router 实例安装到 Vue 应用中；
- `<RouterView />` 是路由页面的**显示位置**，并不会自动决定具体显示哪个文件；
- `src/router/index.ts` 中的 `routes` 才描述“哪个地址对应哪个页面”；
- 路由中的 `component` 指定一个实际 Vue 组件，或者指定一个用于懒加载组件的函数。

每个章节都注明了需要创建的文件，并提供可以直接复制的完整代码。不同章节中的同名 `src/router/index.ts` 是**互相独立的实验版本**，学习新章节时替换原版本即可，不要把多个 `routes` 数组机械合并。

## 嵌套路由：一个公共布局里面显示不同业务页面

### 为什么企业页面需要父子路由

一个企业系统往往有固定的顶部标题、侧边菜单、面包屑和工作区域。访问账户列表时，这些外部布局不变；点击转账管理时，变化的只是工作区域中的业务页面。

如果为每个页面重复写一套导航菜单，维护成本会很高。因此一般先有一个**布局组件（Layout）**，再让多个业务页面在布局内部切换。

例如页面结构：

```text
App.vue
  └── RouterView：渲染 WorkbenchLayout.vue
        ├── 顶部标题（始终显示）
        ├── 侧边导航（始终显示）
        └── RouterView：根据子路由切换
              ├── AccountListPage.vue
              └── TransferPage.vue
```

注意这里有**两个 `<RouterView>`**：

- `App.vue` 的 `<RouterView>` 负责显示顶层的布局组件；
- `WorkbenchLayout.vue` 的 `<RouterView>` 负责显示布局下的子路由页面。

如果只在 `App.vue` 放一个 `<RouterView>`，又在路由配置中写了 `children`，那么子页面仍然需要一个能够显示它的嵌套路由出口。

### `children`：声明嵌套页面

路由记录可以有 `children` 属性：

```ts
{
    path: '/workbench',
    component: WorkbenchLayout,
    children: [
        { path: 'accounts', component: AccountListPage },
        { path: 'transfer', component: TransferPage }
    ]
}
```

这里：

- `path: '/workbench'` 是父路由的路径；
- `component: WorkbenchLayout` 指定父路由显示的布局组件；
- `children` 是子路由记录数组；
- 子路由写 `path: 'accounts'`，没有开头的 `/`，表示相对于父路由的路径，最终地址为 `/workbench/accounts`；
- `path: 'transfer'` 对应 `/workbench/transfer`。

**不要把 `path: 'accounts'` 和 `path: '/accounts'` 当成同一个意思。** 在子路由中，以 `/` 开头表示绝对路径，不会自动加上父路径前缀。阅读现有工程时尤其要注意这一点。

### `redirect` 与默认子路由

用户访问 `/workbench`，但还没有明确选择哪个业务子页面时，可以通过 `redirect`（重定向）让地址自动跳转到 `/workbench/accounts`：

```ts
{
    path: '/workbench',
    redirect: '/workbench/accounts',
    component: WorkbenchLayout,
    children: [/* ... */]
}
```

`redirect` 的作用是**改变最终匹配的地址**，而不是在原地址上额外插入一个组件。

还有另一种写法：把子路由 `path` 设为空字符串 `''`，表示父路径下的默认子页面。此时父路径本身就会显示这个子页面，URL 不需要改变。两种方式都能解决“父页面打开后显示什么”的问题，但地址变化不同。

### `<RouterLink>`：声明菜单跳转目标

布局模板中可以使用：

```vue
<RouterLink to="/workbench/accounts">账户列表</RouterLink>
```

`to` 是导航目标地址。`RouterLink` 会生成可点击的链接，并由 Vue Router 处理应用内部导航，避免普通页面跳转时重新加载整套应用。

对比：

- `<a href="https://example.com">` 适合访问外部网站；
- `<RouterLink to="/workbench/accounts">` 适合应用内已定义的路由。

在当前例子中，菜单属于布局组件，业务页面在该布局下方的 `<RouterView />` 中显示。

### 完整程序：账户列表与转账页面共用布局

保留前面的 `src/main.ts` 和 `src/App.vue`。创建下面四个文件即可运行。

文件：`src/views/WorkbenchLayout.vue`

```vue
<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router';
</script>

<template>
    <section class="layout">
        <header>
            <h2>银行业务工作台</h2>
        </header>

        <nav class="menu">
            <RouterLink to="/workbench/accounts">账户列表</RouterLink>
            <RouterLink to="/workbench/transfer">转账管理</RouterLink>
        </nav>

        <!-- 子路由在这里显示，顶部标题和导航不会重新创建。 -->
        <RouterView />
    </section>
</template>

<style scoped>
.layout { border: 1px solid #ccc; border-radius: 8px; padding: 16px; }
.menu { display: flex; gap: 18px; margin-bottom: 20px; }
.menu a { color: #245a9c; }
.menu .router-link-active { font-weight: bold; }
</style>
```

`router-link-active` 是 RouterLink 在路由匹配时自动添加的 CSS 类名，可用于高亮当前菜单。它是一种样式标记，不是业务权限判断。

文件：`src/views/AccountListPage.vue`

```vue
<script setup lang="ts">
const accounts = [
    { id: 101, name: '储蓄账户' },
    { id: 102, name: '工资账户' }
];
</script>

<template>
    <section>
        <h3>账户列表</h3>
        <p>这里显示账户管理业务。</p>
        <ul>
            <li v-for="item in accounts" :key="item.id">
                {{ item.id }} - {{ item.name }}
            </li>
        </ul>
    </section>
</template>
```

文件：`src/views/TransferPage.vue`

```vue
<script setup lang="ts">
import { ref } from 'vue';

const purpose = ref('');
</script>

<template>
    <section>
        <h3>转账管理</h3>
        <label for="purpose">转账用途：</label>
        <input id="purpose" v-model="purpose" />
        <p>当前填写：{{ purpose || '尚未输入' }}</p>
    </section>
</template>
```

文件：`src/router/index.ts`

```ts
import { createRouter, createWebHashHistory } from 'vue-router';
import WorkbenchLayout from '../views/WorkbenchLayout.vue';
import AccountListPage from '../views/AccountListPage.vue';
import TransferPage from '../views/TransferPage.vue';

const router = createRouter({
    history: createWebHashHistory(),
    routes: [
        // 打开根地址时进入工作台。
        { path: '/', redirect: '/workbench' },
        {
            path: '/workbench',
            component: WorkbenchLayout,
            // 打开工作台根地址时，自动进入账户列表。
            redirect: '/workbench/accounts',
            children: [
                { path: 'accounts', component: AccountListPage },
                { path: 'transfer', component: TransferPage }
            ]
        }
    ]
});

export default router;
```

运行后打开根地址，最终会进入 `#/workbench/accounts`。点击“转账管理”，地址变为 `#/workbench/transfer`；顶部标题和导航仍然存在，中间区域换成转账页面。

在浏览器开发者工具中观察两点：**URL 发生了变化**，并且只替换了匹配到的子页面。此时如果把转账用途填写一半后切到账户列表，再切回来，未做缓存时 `TransferPage` 会重新创建，输入状态会重置。要跨路由保留状态，可以根据业务要求使用 Pinia、保存草稿，或者研究补充第一天的 `<KeepAlive>`，不能仅凭有 `children` 就期待页面自动缓存。

### 读项目时怎么判断布局是否嵌套

先看当前 URL，再查找它匹配的父路由和 `children`。如果父路由指定了 Layout 组件，就进入那个组件搜索 `<RouterView>`。当某个页面看起来只有标题、没有业务内容时，要先检查：

- 子路由是否匹配；
- 布局中是否存在用于显示子页面的 `<RouterView>`；
- 子路由的 `path` 是相对路径还是绝对路径；
- 是否存在 `redirect` 将地址带到了其他路由。

> [!EXERCISE] 为什么子页面没有显示
>
> 路由配置已经有 `children: [{ path: 'accounts', component: AccountListPage }]`，但访问 `/workbench/accounts` 时只显示工作台标题，没有账户列表。首先检查什么？
>
> 【答案】检查父布局组件 `WorkbenchLayout.vue` 中是否有 `<RouterView />`。子路由要在父布局的路由出口显示；还应确认地址是否匹配实际子路由以及组件导入是否正确。


## 命名路由与地址参数：从账户列表进入详情

### 为什么不建议把所有路径写死在按钮中

账户列表中有很多记录，每条记录对应一个详情页。如果每次跳转都要自己拼接 URL，容易把路径写错，也不利于以后统一调整路径结构。

Vue Router 允许给路由记录设置 `name`（路由名称）：

```ts
{
    path: '/accounts/:id',
    name: 'account-detail',
    component: AccountDetailPage
}
```

这里：

- `path` 是实际匹配的 URL 规则；
- `:id` 是**动态路径参数**，`/accounts/101` 和 `/accounts/102` 都能匹配这条记录；
- `name: 'account-detail'` 是开发者指定的稳定名称；
- `component` 是地址匹配后显示的页面组件。

路由名称在同一个 Router 中应保持唯一。它与组件的 `defineOptions({ name: ... })` 不是同一件事：**路由名用于导航定位，组件名用于识别组件定义**。

### `params`：给动态路径占位符提供值

可以使用命名路由加参数进行跳转：

```ts
router.push({
    name: 'account-detail',
    params: { id: '101' }
});
```

`router.push()` 表示发起一次路由导航，参数对象里的：

- `name` 指定要匹配的命名路由；
- `params` 为路径中的动态占位符提供值；
- `id: '101'` 对应配置中的 `:id`。

最终地址类似 `#/accounts/101`。

这里用字符串 `'101'` 是因为 URL 中的路径参数在读取时是字符串，不会自动转成 JavaScript 的数字。页面读取 ID 后，如果业务 API 需要 `number`，应该先进行转换和验证。

如果配置需要 `:id`，却执行 `router.push({ name: 'account-detail' })`，缺少必填参数，导航会报错；不要指望 Router 自动帮你补一个 ID。

### `query`：表示 URL 问号后的查询参数

如果账户详情页除了 ID，还要说明当前打开哪个标签，可以这样跳转：

```ts
router.push({
    name: 'account-detail',
    params: { id: '101' },
    query: { tab: 'transactions' }
});
```

结果类似：

```text
#/accounts/101?tab=transactions
```

其中：

- `params.id` 来自路径 `/accounts/:id` 中的 `:id`；
- `query.tab` 来自 URL 问号后的 `tab=transactions`；
- `query` 不需要预先写在路由的 `path` 中。

`query` 适合表示可以通过地址恢复的页面状态，例如查询条件、详情标签和页码。**不要把密码、身份证号、访问令牌或其他敏感数据放进 URL 查询参数。** URL 可能进入浏览器历史、日志或被复制转发。

### `useRoute()` 与 `useRouter()` 再区分一次

在 `<script setup>` 中：

```ts
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
```

- `route` 是当前路由信息，用来**读取** `route.params`、`route.query`、`route.fullPath` 等；
- `router` 是路由实例，用来**执行** `router.push()`、`router.replace()`、`router.back()` 等操作。

不能把它们混为一谈：`route.push()` 不是正确用法，`router.params` 也不是读取当前路径参数的方式。

### `push()`、`replace()`、`back()` 的区别

| API | 做什么 | 常见场景 |
| --- | --- | --- |
| `router.push(target)` | 导航到目标，并在历史记录中新增一项 | 从列表进入详情 |
| `router.replace(target)` | 用目标地址替换当前历史记录项 | 登录成功后替换登录页、纠正地址 |
| `router.back()` | 请求返回浏览器历史中的上一项 | 从详情返回上一页面 |
| `router.go(n)` | 相对于当前历史记录前进或后退指定步数 | 需要程序控制历史位置时 |

`router.back()` 并不等于“回到账户列表”。如果用户是直接打开详情页，或者前一个历史页面不是列表，返回结果就不一定是账户列表。**需要确保返回指定业务页面时，使用命名路由导航更明确。**

### 完整程序：命名路由、路径参数和查询参数

保留本日公共入口 `src/main.ts` 与 `src/App.vue`，用下面三个文件替换当前路由实验。

文件：`src/views/AccountIndexPage.vue`

```vue
<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

const accounts = [
    { id: 101, name: '储蓄账户' },
    { id: 102, name: '工资账户' }
];

function openDetail(id: number): void {
    // 把数字 ID 转成 URL 中使用的字符串参数。
    void router.push({
        name: 'account-detail',
        params: { id: String(id) },
        query: { tab: 'summary' }
    });
}

function historyForward(): void {
    // 如果浏览器历史中有可前进的记录，就向前一项。
    router.go(1);
}
</script>

<template>
    <h2>账户列表</h2>
    <ul>
        <li v-for="account in accounts" :key="account.id">
            {{ account.name }}
            <button @click="openDetail(account.id)">查看详情</button>
        </li>
    </ul>
    <button @click="historyForward">尝试在浏览器历史中前进</button>
</template>
```

`String(id)` 将数字转换为字符串，适合放入 URL。`void router.push(...)` 表示本例不继续等待导航完成；如果后续逻辑依赖导航结果，应使用 `await router.push(...)` 并检查结果，而不是无条件认为导航已经成功。

文件：`src/views/AccountDetailPage.vue`

```vue
<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

// route.params.id 来自 /accounts/:id。
// Number() 尝试转换为数字；非法字符串会得到 NaN。
const accountId = computed(() => Number(route.params.id));

// 检查转换后的 ID 是否为安全的正整数。
const validId = computed(() =>
    Number.isSafeInteger(accountId.value) && accountId.value > 0
);

// 查询参数由 URL 中的 ?tab=... 提供。
const currentTab = computed(() =>
    route.query.tab === 'transactions' ? 'transactions' : 'summary'
);

function showTransactions(): void {
    void router.replace({
        name: 'account-detail',
        params: { id: String(route.params.id) },
        query: { tab: 'transactions' }
    });
}

function backToList(): void {
    // 明确返回账户列表，而不是依赖浏览器历史。
    void router.push({ name: 'account-list' });
}

function historyBack(): void {
    // 返回浏览器历史的上一项，不保证上一项就是账户列表。
    router.back();
}
</script>

<template>
    <h2>账户详情</h2>
    <p>当前完整地址：{{ route.fullPath }}</p>

    <div v-if="validId">
        <p>账户 ID：{{ accountId }}</p>
        <p>当前标签：{{ currentTab }}</p>
        <button @click="showTransactions">查看交易记录标签</button>
    </div>

    <p v-else>账户 ID 无效，请检查地址。</p>

    <button @click="backToList">返回账户列表</button>
    <button @click="historyBack">浏览器后退</button>
</template>
```

这里的新语法有几处需要解释：

- `computed(() => ...)` 创建计算属性，所依赖的路由参数变化时重新计算；
- `Number()` 转换字符串，如果内容不是可用数字，会产生 `NaN`；
- `Number.isSafeInteger()` 判断值是否为 JavaScript 可安全表达的整数；
- `route.fullPath` 是当前路由的完整客户端路径，包括查询参数；
- `router.replace()` 修改地址，但不额外新增一条历史记录。

需要特别注意：`Number('')` 会得到 `0`，`Number('00101')` 也会得到 `101`。本例只演示基础校验，真实系统中应根据接口对 ID 的格式约定增加验证，并由后端再次检查权限和记录是否存在。

文件：`src/router/index.ts`

```ts
import { createRouter, createWebHashHistory } from 'vue-router';
import AccountIndexPage from '../views/AccountIndexPage.vue';
import AccountDetailPage from '../views/AccountDetailPage.vue';

export default createRouter({
    history: createWebHashHistory(),
    routes: [
        { path: '/', redirect: { name: 'account-list' } },
        {
            path: '/accounts',
            name: 'account-list',
            component: AccountIndexPage
        },
        {
            path: '/accounts/:id',
            name: 'account-detail',
            component: AccountDetailPage
        }
    ]
});
```

点击“查看详情”，观察浏览器地址和页面上的 `route.fullPath`。再点击“查看交易记录标签”，问号后的 `tab` 会变化，但路径中的 ID 不会变化。最后点击“返回账户列表”，地址回到 `/accounts`。

手动把地址中的 ID 改成 `abc`，页面会显示无效 ID 提示。**这里只是在前端校验输入格式，绝不代表已验证用户拥有该账户。**

### `params` 与 `query` 的类型要注意

Vue Router 中，普通路径参数在匹配后通常是字符串；如果使用重复参数语法，结果还可以是字符串数组。查询参数则可能是字符串、`null` 或数组。因此，不能直接把所有 `route.params.id`、`route.query.page` 当成 `number`。

实际项目中常见的处理方式是：先检查参数的真实形态，再转换为接口要求的类型，并给无效输入明确的业务提示。**TypeScript 中写 `as number` 只是类型断言，不会把 URL 字符串转换成数字。**

> [!EXERCISE] params 和 query 是否一样
>
> 地址为 `#/accounts/102?tab=transactions`，路由配置是 `/accounts/:id`。当前账户 ID 应从哪里读取？标签名又从哪里读取？
>
> 【答案】账户 ID 从 `route.params.id` 读取，原始值是字符串 `'102'`；标签名从 `route.query.tab` 读取，值是字符串 `'transactions'`。若接口要求数字 ID，需要显式转换并校验。


## 路由元信息与导航守卫：进入业务页面前先判断

### 为什么“菜单里不显示”不等于“用户不能访问”

假设企业系统有“账户查询”和“管理员设置”两个入口。普通用户的菜单不显示“管理员设置”，但他仍然可以在地址栏手动输入 `#/settings`。

因此，不能只依赖菜单是否显示，而应该在**真正进入某条路由之前**检查当前用户是否可以访问。Vue Router 为此提供**导航守卫（Navigation Guard）**。

导航守卫不是一个特殊的 HTML 标签，而是一段在导航流程中执行的函数。它可以允许进入、取消导航，或者把用户重定向到另一条路由。

必须先分清三件事：

- **菜单显示控制：** 决定用户看不看得到入口；
- **前端路由守卫：** 决定当前浏览器是否显示某个页面；
- **后端权限校验：** 决定用户是否有权读取、修改真实业务数据。

**前两项都不能替代第三项。** 即使用户不能进入管理页面，也不代表他无法手工发起 HTTP 请求。银行业务中的认证、授权和操作审计必须由可信的服务端完成。

### `meta`：给路由记录附加业务说明

路由记录除了 `path`、`name`、`component`，还可以包含 `meta`：

```ts
{
    path: '/settings',
    name: 'settings',
    component: SettingsPage,
    meta: {
        title: '系统设置',
        requiresAuth: true,
        roles: ['manager']
    }
}
```

`meta` 是**路由元信息（Route Meta）**：开发者自己附加的说明数据，Vue Router 不会自动理解 `requiresAuth` 或 `roles` 的业务含义。

这里约定：

- `title` 表示页面标题；
- `requiresAuth: true` 表示页面要求登录；
- `roles: ['manager']` 表示只有管理员角色可以访问。

这些字段由我们编写的守卫读取并执行。**仅在路由中写 `requiresAuth: true`，没有配套守卫时，并不会自动拦住未登录用户。**

`meta` 常用于页面标题、菜单标识、访问控制标志、缓存规则、面包屑等。但把什么内容放进 `meta`，应由项目统一约定，不要为同一个含义写出 `needLogin`、`requiresAuth`、`mustAuth` 三种不同名称。

### `router.beforeEach()`：全局前置守卫

在路由实例中注册：

```ts
router.beforeEach((to, from) => {
    // 在导航被确认前运行。
});
```

其中：

- `to` 是**准备进入的目标路由**；
- `from` 是**当前正在离开的路由**；
- `to.meta` 可以读取目标路由的元信息；
- `to.fullPath` 是目标路由的完整客户端地址。

守卫返回什么，会影响这次导航：

| 返回值 | 结果 | 场景 |
| --- | --- | --- |
| 不写 `return` / 返回 `undefined` | 继续导航 | 已满足访问条件 |
| `true` | 继续导航 | 明确放行 |
| `false` | 取消此次导航 | 草稿未保存且用户拒绝离开 |
| `'/login'` | 重定向到指定路径 | 未登录，进入登录页 |
| `{ name: 'login' }` | 重定向到命名路由 | 使用稳定的路由名跳转 |
| 抛出异常 | 导航出错，由路由错误处理机制处理 | 守卫自身出现异常 |

现在的 Vue Router 4 推荐使用**返回值**控制守卫，而不是像部分 Vue 2 老项目那样在每个分支中手工调用 `next()`。看到旧代码中的 `(to, from, next)` 要知道它也是守卫写法，但不建议在新示例中混用两套控制方式。

### 登录后如何回到用户原本想打开的页面

未登录时直接访问 `#/accounts`，我们希望先显示登录页，登录成功后再返回 `#/accounts`，而不是统一跳到首页。

一种常用做法是把原目标放入登录页的 `redirect` 查询参数：

```ts
return {
    name: 'login',
    query: { redirect: to.fullPath }
};
```

跳转后地址可能变成：

```text
#/login?redirect=%2Faccounts
```

`%2F` 是 URL 编码后的 `/`。Vue Router 读取 `route.query.redirect` 时会得到解码后的值。

登录页取得这个参数后，完成登录再导航回原目标。但需要先确认目标是应用内部合法路径，不能把任意外部地址直接当作跳转目标；否则可能造成开放重定向问题。下面的教学示例只允许以单个 `/` 开头的本地目标。

### 用 TypeScript 声明 `meta` 的字段类型

如果 TypeScript 项目直接访问 `to.meta.roles`，虽然运行时可以读取，但编辑器未必知道它应该是字符串数组。

可以创建一个 **`.d.ts` 声明文件（只提供类型信息，不生成业务运行代码）**，扩展 Vue Router 已有的 `RouteMeta` 接口。TypeScript 的这种写法叫做**模块声明扩展（Module Augmentation）**。

例如：

```ts
import 'vue-router';

export {};

declare module 'vue-router' {
    interface RouteMeta {
        title?: string;
        requiresAuth?: boolean;
        roles?: Array<'viewer' | 'manager'>;
    }
}
```

`?` 表示字段可选；`'viewer' | 'manager'` 是联合类型，表示角色只允许这两个字符串值。之后 `to.meta.roles?.includes(role)` 就有了更清楚的类型约束。

### 完整程序：模拟登录与管理员权限

本程序使用**浏览器中的内存状态模拟登录**，没有真实用户账号、密码、认证接口、Token 或服务端会话。它只用于练习守卫的执行顺序，不具备生产安全性。

保留本日公共 `main.ts`、`App.vue`，再创建下面的文件。

文件：`src/types/router.d.ts`

```ts
import 'vue-router';

export {};

declare module 'vue-router' {
    interface RouteMeta {
        title?: string;
        requiresAuth?: boolean;
        roles?: Array<'viewer' | 'manager'>;
    }
}
```

文件：`src/state/demoAuth.ts`

```ts
import { reactive } from 'vue';

// Role 是 TypeScript 类型，不是运行时的权限系统。
export type Role = 'viewer' | 'manager';

// 模块级响应式状态：当前应用中的页面与守卫共用这一份。
export const session = reactive<{
    loggedIn: boolean;
    role: Role;
}>({
    loggedIn: false,
    role: 'viewer'
});

export function loginAs(role: Role): void {
    session.role = role;
    session.loggedIn = true;
}

export function logout(): void {
    session.loggedIn = false;
    session.role = 'viewer';
}
```

`session` 放在模块顶层，所以同一应用里导入它的页面和守卫能读取同一份状态。它与 Pinia 都能实现共享状态；本例只是为了让路由守卫更容易理解而采用最小实现。浏览器整页刷新后，模拟登录会恢复为未登录。

文件：`src/views/HomePage.vue`

```vue
<script setup lang="ts">
import { RouterLink, useRouter } from 'vue-router';
import { session, logout } from '../state/demoAuth';

const router = useRouter();

function signOut(): void {
    logout();
    void router.replace({ name: 'home' });
}
</script>

<template>
    <h2>业务首页</h2>
    <p>登录状态：{{ session.loggedIn ? '已登录' : '未登录' }}</p>
    <p v-if="session.loggedIn">当前角色：{{ session.role }}</p>

    <nav>
        <RouterLink :to="{ name: 'accounts' }">账户查询</RouterLink>
        <span> | </span>
        <RouterLink :to="{ name: 'settings' }">管理员设置</RouterLink>
        <span> | </span>
        <RouterLink :to="{ name: 'login' }">模拟登录</RouterLink>
    </nav>

    <p><button @click="signOut">退出模拟登录</button></p>
</template>
```

为方便测试，这个首页故意同时显示所有导航入口。真实项目可以按权限隐藏不应出现的菜单，但即使隐藏了按钮，也必须有路由守卫和后端接口校验。

文件：`src/views/LoginPage.vue`

```vue
<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { loginAs } from '../state/demoAuth';
import type { Role } from '../state/demoAuth';

const route = useRoute();
const router = useRouter();

function doLogin(role: Role): void {
    // 教学模拟：直接改变前端状态，并没有联系服务器。
    loginAs(role);

    // 读取守卫保存的原访问目标。
    const redirect = route.query.redirect;

    // 只允许简单的应用内绝对路径，避免直接跳转外部目标。
    const safeTarget =
        typeof redirect === 'string' &&
        redirect.startsWith('/') &&
        !redirect.startsWith('//') &&
        !redirect.includes('\\');

    if (safeTarget) {
        void router.replace(redirect);
    } else {
        void router.replace({ name: 'home' });
    }
}
</script>

<template>
    <h2>模拟登录</h2>
    <p>此处不校验真实密码，只用于观察路由权限。</p>
    <button @click="doLogin('viewer')">作为普通用户登录</button>
    <button @click="doLogin('manager')">作为管理员登录</button>
</template>
```

`typeof redirect === 'string'` 用于确认参数确实是字符串；`startsWith('/')` 用于识别应用内部路径；`includes('\\')` 检查反斜线字符。本例的校验只服务于前端演示，真实系统还应按应用允许的路径、参数和业务规范做更严格的处理。

文件：`src/views/BankAccountsPage.vue`

```vue
<script setup lang="ts">
import { RouterLink } from 'vue-router';
</script>

<template>
    <h2>账户查询页面</h2>
    <p>通过前端登录守卫后，才显示此页面。</p>
    <p>这里没有请求真实账户数据。</p>
    <RouterLink :to="{ name: 'home' }">回首页</RouterLink>
</template>
```

文件：`src/views/SettingsPage.vue`

```vue
<script setup lang="ts">
import { RouterLink } from 'vue-router';
</script>

<template>
    <h2>管理员设置</h2>
    <p>当前演示要求角色为 manager。</p>
    <RouterLink :to="{ name: 'home' }">回首页</RouterLink>
</template>
```

文件：`src/views/ForbiddenPage.vue`

```vue
<script setup lang="ts">
import { RouterLink } from 'vue-router';
</script>

<template>
    <h2>无访问权限</h2>
    <p>你已通过登录检查，但当前角色没有进入该页面的权限。</p>
    <RouterLink :to="{ name: 'home' }">回首页</RouterLink>
</template>
```

文件：`src/router/index.ts`

```ts
import { createRouter, createWebHashHistory } from 'vue-router';
import { session } from '../state/demoAuth';

import HomePage from '../views/HomePage.vue';
import LoginPage from '../views/LoginPage.vue';
import BankAccountsPage from '../views/BankAccountsPage.vue';
import SettingsPage from '../views/SettingsPage.vue';
import ForbiddenPage from '../views/ForbiddenPage.vue';

const router = createRouter({
    history: createWebHashHistory(),
    routes: [
        { path: '/', name: 'home', component: HomePage },
        { path: '/login', name: 'login', component: LoginPage },
        { path: '/403', name: 'forbidden', component: ForbiddenPage },
        {
            path: '/accounts',
            name: 'accounts',
            component: BankAccountsPage,
            meta: { title: '账户查询', requiresAuth: true }
        },
        {
            path: '/settings',
            name: 'settings',
            component: SettingsPage,
            meta: {
                title: '管理员设置',
                requiresAuth: true,
                roles: ['manager']
            }
        }
    ]
});

// 每次准备进入目标路由时，都进行统一检查。
router.beforeEach(to => {
    // to.matched 是目标地址匹配到的父子路由记录数组。
    // some() 判断其中是否至少有一条记录明确要求登录。
    const requiresAuth = to.matched.some(
        record => record.meta.requiresAuth === true
    );

    if (requiresAuth && !session.loggedIn) {
        return {
            name: 'login',
            query: { redirect: to.fullPath }
        };
    }

    // 登录通过后，再检查角色是否满足要求。
    if (
        to.meta.roles &&
        !to.meta.roles.includes(session.role)
    ) {
        return { name: 'forbidden' };
    }

    // 没有返回值，相当于允许继续导航。
});

export default router;
```

### 按场景逐步验证守卫

| 操作 | 守卫检查 | 预期结果 |
| --- | --- | --- |
| 初次访问 `#/` | 首页不要求登录 | 显示首页 |
| 未登录访问 `#/accounts` | `requiresAuth` 为真，但 `loggedIn` 为假 | 跳转登录页，URL 带 `redirect` |
| 选择“普通用户登录” | 模拟登录成功，再跳回原目标 | 进入账户查询页 |
| 普通用户进入 `#/settings` | 已登录，但角色不是 `manager` | 进入无权限页 |
| 退出后直接访问 `#/settings` | 首先没有登录 | 先进入登录页 |
| 选择“管理员登录” | 登录后满足角色要求 | 进入管理员设置页 |
| 刷新浏览器后访问 `#/accounts` | 内存登录状态重置 | 再次进入登录页 |

最后一条说明：这只是一份**前端状态模拟**。实际项目通常需要从服务端恢复登录会话或重新验证身份，不能把模块变量的 `true` 当作可靠的认证凭据。

### 守卫最容易出现的两个问题

**问题一：无限重定向。** 如果所有页面（包括登录页）都被设置为必须登录，未登录用户访问登录页又会被重定向到登录页本身，形成循环。因此登录页、无权限页等应根据业务设计保证能在需要时访问。

**问题二：守卫越写越复杂。** 如果需要加载权限数据、刷新会话、检查角色、记录审计，不要把所有网络请求和业务细节堆进一个巨大 `beforeEach` 函数。可以拆分成可测试的函数，但一定要明确“谁负责获取当前用户身份、谁负责决定路由是否可进入”。

另外，父子路由中 `to.meta` 是一份由匹配记录合并得到的元信息；如果子路由显式覆盖了父路由同名字段，结果会受到覆盖影响。示例中的 `to.matched.some(record => record.meta.requiresAuth === true)` 会遍历匹配到的父子路由记录，只要有一条明确要求登录就会触发登录检查。这样比只读取合并后的单个布尔字段更适合表达“父级要求登录，子页面不能随意降低要求”的规则。具体角色权限仍应按项目统一策略处理，并在后端校验。

> [!EXERCISE] 为什么写了 meta 却仍能进入页面
>
> 路由记录已经添加 `meta: { requiresAuth: true }`，但是未登录用户仍能打开对应页面。最需要检查什么？
>
> 【答案】检查 Router 是否注册了真正读取 `to.meta.requiresAuth` 的导航守卫，以及守卫有没有根据登录状态返回重定向或取消导航。`meta` 本身只是数据，不会自动完成授权检查。即使前端守卫正常工作，也需要后端独立校验真实接口权限。


## 路由懒加载与 404：页面代码什么时候才下载

### 为什么所有页面不一定要一次加载

在一个大型系统里，账户、转账、理财、报表和管理配置会有很多独立页面。如果在入口配置中把所有页面全部静态导入，应用初次加载时需要处理的代码可能比较多。

**路由懒加载（Route Lazy Loading）** 是指：把某个页面的组件代码放到独立的加载单元中，用户真正进入该路由时再加载对应组件。

此前用过静态导入：

```ts
import TransferPage from '../views/TransferPage.vue';

{
    path: '/transfer',
    component: TransferPage
}
```

现在改成：

```ts
{
    path: '/transfer',
    component: () => import('../views/TransferPage.vue')
}
```

这里新增了两处概念：

- `import('...')` 是 JavaScript 的**动态导入**语法，执行后返回 Promise，用于异步取得模块；
- `() => import('...')` 是一个函数，Vue Router 在需要解析这个路由页面时调用它，而不是在创建路由对象时立即执行全部页面加载。

Vite 在构建时可以根据这种动态导入把页面代码拆分成不同的 JavaScript 资源。Vue Router 负责什么时候加载路由组件，Vite 负责开发与构建时如何处理代码资源，两者职责不同。

**路由懒加载与上一补充日的 `defineAsyncComponent()` 不一样。** 路由配置的 `component` 应直接写成返回动态导入 Promise 的函数；不要为这个目的再额外套一层 `defineAsyncComponent()`。

### 什么时候能观察到懒加载

开发服务器运行时，在浏览器 Network 中可以观察页面模块的加载。初次进入一个尚未加载的页面，会触发相关模块请求；再次进入时，模块代码可能已经被浏览器或 Router 缓存，不一定重复下载。

生产构建后，拆分出来的文件通常会出现哈希文件名，例如某个页面独立的 `.js` 文件。实际拆包结果取决于 Vite 版本、构建配置和模块引用关系。**不要把“Network 没有第二次请求”误认为懒加载失败**，也不要将代码模块加载与业务接口请求混为一谈。

### 兜底路由：处理不存在的页面地址

用户可能输入一个不存在的地址：

```text
#/accounts/does-not-exist-page
```

如果没有匹配的路由，`<RouterView />` 就可能没有期望的页面可展示。企业应用通常会配置专门的 404 页面，告诉用户地址不存在并提供回到首页的入口。

Vue Router 4 的常见兜底写法：

```ts
{
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFoundPage
}
```

这条路径包含三个部分：

- `:pathMatch`：给动态参数起名；
- `(.*)`：用于匹配任意字符序列的正则表达式；
- 最后的 `*`：表示参数可重复，也可以不出现。

所以它可以匹配未被其他路由处理的任意路径。这是 Vue Router 4 使用的写法，**不要把 Vue Router 3 的 `path: '*'` 直接照搬到 Vue Router 4 中**。

### 完整程序：懒加载业务页和 404 页面

保留本日公共 `src/main.ts`、`src/App.vue`。创建三个文件。

文件：`src/views/DashboardPage.vue`

```vue
<script setup lang="ts">
import { RouterLink } from 'vue-router';
</script>

<template>
    <h2>业务首页</h2>
    <p>初次进入这里只需要加载首页对应的组件。</p>

    <nav>
        <RouterLink to="/transfer">进入转账页面</RouterLink>
        <span> | </span>
        <RouterLink to="/this-page-does-not-exist">访问不存在的地址</RouterLink>
    </nav>
</template>
```

文件：`src/views/TransferPage.vue`

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { RouterLink } from 'vue-router';

const purpose = ref('');
</script>

<template>
    <h2>转账业务页面</h2>
    <label for="transfer-purpose">转账用途：</label>
    <input id="transfer-purpose" v-model="purpose" />
    <p>当前草稿：{{ purpose || '尚未输入' }}</p>
    <RouterLink to="/">回首页</RouterLink>
</template>
```

文件：`src/views/NotFoundPage.vue`

```vue
<script setup lang="ts">
import { useRoute, RouterLink } from 'vue-router';

const route = useRoute();
</script>

<template>
    <h2>404：页面不存在</h2>
    <p>当前地址：{{ route.fullPath }}</p>
    <p>没有找到对应的业务页面。</p>
    <RouterLink to="/">返回业务首页</RouterLink>
</template>
```

文件：`src/router/index.ts`

```ts
import { createRouter, createWebHashHistory } from 'vue-router';
import DashboardPage from '../views/DashboardPage.vue';

export default createRouter({
    history: createWebHashHistory(),
    routes: [
        // 首页仍然使用静态导入。
        {
            path: '/',
            name: 'dashboard',
            component: DashboardPage
        },
        // 转账页按访问需要加载。
        {
            path: '/transfer',
            name: 'transfer',
            component: () => import('../views/TransferPage.vue')
        },
        // 兜底页面也可以按需加载。
        {
            path: '/:pathMatch(.*)*',
            name: 'not-found',
            component: () => import('../views/NotFoundPage.vue')
        }
    ]
});
```

运行后：

1. 访问根地址，显示业务首页；
2. 打开 Network，点击“进入转账页面”，观察 `TransferPage.vue` 对应开发模块首次加载；
3. 点击返回首页；
4. 再进入转账页面，观察是否复用已经加载的组件模块；
5. 点击“不存在的地址”，显示专门的 404 页面。

**注意：懒加载只控制组件代码什么时候被取得，不能自动缓存组件的响应式状态。** 上例从转账页离开再回来时，草稿输入仍可能重新初始化。要保留业务状态，应按需求选择 Pinia、持久化草稿、`<KeepAlive>` 等机制。

> [!EXERCISE] 懒加载等于只创建一次组件吗
>
> 转账页面使用 `component: () => import('../views/TransferPage.vue')`，第一次进入时输入了“生活费”，返回首页又重新进入。输入内容是否一定还在？
>
> 【答案】不一定，普通路由页面重新进入时可以创建新的组件实例，局部 `ref` 会重新初始化。动态 `import()` 缓存的是模块加载结果，不等于缓存组件实例或用户草稿。要保留状态，需要额外设计。

## 路由更新与离开守卫：处理页面复用和未保存草稿

### 为什么参数变了，`onMounted()` 却没重新执行

考虑一个账户详情路由：

```text
#/accounts/101
#/accounts/102
```

两条地址都匹配同一个 `/accounts/:id` 路由记录，也使用同一个 `AccountDetailPage.vue` 组件。

从 101 切换到 102 时，Vue Router 会复用相同的路由组件实例，因此不能假定它会先执行 `onUnmounted()`、再重新执行 `onMounted()`。

如果页面只在 `onMounted()` 里读取 ID 并查询，切换地址后就可能仍然显示旧账户信息。

### 用 `watch()` 观察动态路径参数

```ts
const route = useRoute();

watch(
    () => route.params.id,
    newId => {
        console.log('要显示的账户：', newId);
    },
    { immediate: true }
);
```

这里的 `watch()` 在第二天已经学过：

- 第一个参数 `() => route.params.id` 是一个 getter 函数，告诉 Vue 需要观察哪项响应式数据；
- 第二个参数是值变化后的回调；
- `immediate: true` 表示侦听器注册后立刻执行一次，随后继续响应 ID 变化。

它适合“初次进入页面时要读取账户，后续 ID 改变时也要更新”的情况。

### `onBeforeRouteUpdate()`：路由复用时运行

Vue Router 还提供 `onBeforeRouteUpdate()`：

```ts
onBeforeRouteUpdate((to, from) => {
    if (to.params.id !== from.params.id) {
        console.log('账户 ID 即将变化为', to.params.id);
    }
});
```

它是**组件内部的路由更新守卫**。路由变化，但当前组件实例仍被复用时，会调用这个钩子。

- `to`：即将进入的目标路由；
- `from`：当前路由；
- 通过比较两次的 `params.id`，可以判断是否需要重新读取账户；
- 返回 `false` 可以取消当前这次路由更新。

**不要把它当成 `onMounted()` 的替代品。** 初次挂载时，需要另外处理当前 ID；参数更新时，再用更新守卫或 `watch()` 处理。简单展示场景使用 `watch()` 已经足够；需要在导航被确认之前执行判断、取消路由变化时，更新守卫更合适。

### `onBeforeRouteLeave()`：离开页面前拦截

假设用户正在填写转账用途，尚未保存就点击导航。如果直接跳走，输入状态可能丢失。

可以在转账草稿组件中注册离开守卫：

```ts
onBeforeRouteLeave(() => {
    if (dirty.value) {
        const leave = window.confirm('草稿未保存，确定离开吗？');
        if (!leave) return false;
    }
});
```

这里：

- `dirty` 是我们自己定义的布尔状态，表示页面是否有未保存修改；
- `window.confirm()` 是浏览器原生确认弹框，返回布尔值；
- 返回 `false` 取消当前导航；
- 用户选择确定，函数没有返回 `false`，导航会继续。

`onBeforeRouteLeave()` 是 Vue Router 的组合式 API，和 `onUnmounted()` 不同：前者在**准备离开路由时**运行，能够阻止导航；后者在组件实际卸载后运行，已经不能撤销刚才的离开操作。

### 完整程序：账户参数更新与草稿离开确认

保留公共 `src/main.ts`、`src/App.vue`。创建下面三个文件。

文件：`src/views/AccountDetailPage.vue`

```vue
<script setup lang="ts">
import { ref, watch } from 'vue';
import { RouterLink, useRoute, onBeforeRouteUpdate } from 'vue-router';

const route = useRoute();
const name = ref('');

const accounts: Record<string, string> = {
    '101': '储蓄账户',
    '102': '工资账户'
};

// Record<string, string> 表示“字符串键对应字符串值”的对象类型。
function loadById(rawId: unknown): void {
    // URL 的参数需要先确认类型，再查找对应的账户。
    const id = typeof rawId === 'string' ? rawId : '';
    name.value = accounts[id] ?? '未找到该账户';
}

// 初次进入时运行，ID 变化后再次运行。
watch(
    () => route.params.id,
    newId => loadById(newId),
    { immediate: true }
);

// 观察路由更新守卫触发时机，不再重复修改 name。
onBeforeRouteUpdate((to, from) => {
    if (to.params.id !== from.params.id) {
        console.log('准备切换账户：', from.params.id, '→', to.params.id);
    }
});
</script>

<template>
    <h2>账户详情</h2>
    <p>当前 ID：{{ route.params.id }}</p>
    <p>账户名称：{{ name }}</p>

    <RouterLink to="/accounts/101">账户 101</RouterLink>
    <span> | </span>
    <RouterLink to="/accounts/102">账户 102</RouterLink>
    <span> | </span>
    <RouterLink to="/transfer-draft">转账草稿</RouterLink>
</template>
```

这里的 `Record<string, string>` 是 TypeScript 的工具类型，表示一个以字符串为键、以字符串为值的字典；`??` 是空值合并运算符，只有左边为 `null` 或 `undefined` 时才使用后面的默认值。

文件：`src/views/TransferDraftPage.vue`

```vue
<script setup lang="ts">
import { ref, watch } from 'vue';
import { RouterLink, onBeforeRouteLeave } from 'vue-router';

const purpose = ref('');
const dirty = ref(false);
const savedMessage = ref('');

// 用户修改输入内容后，记为“存在未保存的修改”。
watch(purpose, () => {
    dirty.value = true;
    savedMessage.value = '';
});

function saveDraft(): void {
    // 教学模拟：只修改当前页面状态，没有 HTTP 请求和数据库写入。
    dirty.value = false;
    savedMessage.value = '已模拟保存到当前组件状态';
}

onBeforeRouteLeave(() => {
    // 没有未保存修改时，可以直接离开。
    if (!dirty.value) return;

    const confirmed = window.confirm('草稿尚未保存，确定离开吗？');
    if (!confirmed) return false;
});
</script>

<template>
    <h2>转账草稿</h2>
    <label for="purpose">转账用途：</label>
    <input id="purpose" v-model="purpose" />

    <p>是否有未保存修改：{{ dirty ? '是' : '否' }}</p>
    <p>{{ savedMessage }}</p>

    <button @click="saveDraft">模拟保存草稿</button>
    <p>
        <RouterLink to="/accounts/101">返回账户详情</RouterLink>
    </p>
</template>
```

文件：`src/router/index.ts`

```ts
import { createRouter, createWebHashHistory } from 'vue-router';
import AccountDetailPage from '../views/AccountDetailPage.vue';
import TransferDraftPage from '../views/TransferDraftPage.vue';

export default createRouter({
    history: createWebHashHistory(),
    routes: [
        { path: '/', redirect: '/accounts/101' },
        {
            path: '/accounts/:id',
            name: 'account-detail',
            component: AccountDetailPage
        },
        {
            path: '/transfer-draft',
            name: 'transfer-draft',
            component: TransferDraftPage
        }
    ]
});
```

### 运行后重点观察什么

先进入账户 101，再点击账户 102：地址和页面名称会变化，Console 会记录路由参数变化。`watch()` 负责初次加载和后续变化，`onBeforeRouteUpdate()` 则演示组件实例复用时的守卫时机。

然后进入转账草稿：

1. 不输入任何内容，点击“返回账户详情”，可以直接离开；
2. 再次进入，输入“工资转账”，点击返回；
3. 浏览器弹出确认框，点击“取消”，仍停留在草稿页；
4. 再点击返回并选择“确定”，可以离开；
5. 重新进入，填写内容后点击“模拟保存草稿”，再点击返回，不再弹确认框。

本例的“保存”只表示把 `dirty` 变成 `false`，**不是真正把草稿存到后端或浏览器持久化存储**。真实业务应在保存接口确认成功后才清除未保存状态。

### 离开守卫能拦截所有关闭行为吗

不能。`onBeforeRouteLeave()` 主要处理 Vue Router 管理的客户端路由导航，**不能把它当成关闭浏览器标签页、整个窗口或刷新页面时可靠的保存保护**。

如果业务需要提醒整页卸载，还涉及浏览器原生 `beforeunload` 等机制，但现代浏览器对提示文本和触发条件有严格限制。对于重要草稿，更可靠的方案是按业务要求做自动保存和服务端持久化，而不是只依赖一个弹框。

> [!EXERCISE] 为什么切换 ID 后页面还是旧数据
>
> 账户详情只在 `onMounted()` 读取一次 `route.params.id`，从 `/accounts/101` 切换到 `/accounts/102` 后页面仍显示 101。优先考虑什么问题？
>
> 【答案】两条地址匹配相同的路由组件，Vue Router 复用了组件实例，`onMounted()` 不会因参数变化重新执行。应观察 `route.params.id`，例如使用 `watch(() => route.params.id, load, { immediate: true })`，或根据业务需要使用 `onBeforeRouteUpdate()`。


## `beforeEnter()` 与 `afterEach()`：为特定页面校验并统一收尾

### 全局守卫与单条路由的守卫有什么区别

前面学过：

```ts
router.beforeEach(to => {
    // 每次导航进入新路由之前都会经过这里。
});
```

它适合处理所有页面共同遵守的规则，例如登录状态、统一权限策略。

但有时某个检查只属于一个页面。例如“账户详情 ID 必须是系统认识的编号”，没必要让其他页面也执行这段判断。Vue Router 允许在单条路由记录中声明 `beforeEnter`：

```ts
{
    path: '/accounts/:id',
    component: AccountDetailPage,
    beforeEnter: to => {
        // 只有进入这条路由记录时，才需要处理这条规则。
    }
}
```

`beforeEnter` 是**路由独享守卫（Per-route Guard）**。它与 `beforeEach()` 一样可以返回 `false` 取消导航、返回一个目标地址进行重定向，也可以不返回值表示放行。

需要注意一个边界：**只改变同一路由记录的 `params`、`query` 等参数时，`beforeEnter` 不会因为参数变化而重新执行。** 如果需要在账户 101 切换到账户 102 时持续验证 ID，应在响应式侦听或路由更新流程中处理，不能只依赖 `beforeEnter`。

### `router.afterEach()`：导航结束后执行统一操作

另一个常见需求是：进入不同页面时，让浏览器标签页显示对应标题。

例如：

```ts
router.afterEach((to, from, failure) => {
    if (!failure && typeof to.meta.title === 'string') {
        document.title = to.meta.title;
    }
});
```

`afterEach()` 注册**全局后置钩子**：

- `to` 是目标路由；
- `from` 是来源路由；
- `failure` 表示是否发生了导航失败，例如守卫取消导航；
- `document.title` 是浏览器页面标题，浏览器标签页会显示它。

这里的 `typeof ... === 'string'` 是 JavaScript 类型判断，只有标题确实是字符串时才把它赋给 `document.title`。

与 `beforeEach()` 不同，`afterEach()` **不能通过返回值阻止或改写已经完成的导航**。它更适合页面标题、记录日志、清理导航级提示等收尾逻辑。

当导航因守卫取消或重复导航而没有成功切换时，不应该无条件把浏览器标题改成用户没进入的页面标题，因此示例先判断 `!failure`。

### 完整程序：详情 ID 检查与浏览器标题

保留本日的公共 `src/main.ts` 和 `src/App.vue`，创建下面四个文件。

文件：`src/views/TitleHomePage.vue`

```vue
<script setup lang="ts">
import { RouterLink } from 'vue-router';
</script>

<template>
    <h2>业务首页</h2>
    <RouterLink to="/accounts/101">查看账户 101</RouterLink>
    <span> | </span>
    <RouterLink to="/accounts/999">查看不存在的账户 999</RouterLink>
</template>
```

文件：`src/views/TitleAccountPage.vue`

```vue
<script setup lang="ts">
import { useRoute, RouterLink } from 'vue-router';

const route = useRoute();
</script>

<template>
    <h2>账户详情</h2>
    <p>当前账户编号：{{ route.params.id }}</p>
    <RouterLink to="/">回首页</RouterLink>
</template>
```

文件：`src/views/TitleNotFoundPage.vue`

```vue
<script setup lang="ts">
import { RouterLink } from 'vue-router';
</script>

<template>
    <h2>未找到目标记录或页面</h2>
    <p>此处只模拟前端地址校验。</p>
    <RouterLink to="/">回首页</RouterLink>
</template>
```

文件：`src/router/index.ts`

```ts
import { createRouter, createWebHashHistory } from 'vue-router';
import TitleHomePage from '../views/TitleHomePage.vue';
import TitleAccountPage from '../views/TitleAccountPage.vue';
import TitleNotFoundPage from '../views/TitleNotFoundPage.vue';

const router = createRouter({
    history: createWebHashHistory(),
    routes: [
        {
            path: '/',
            name: 'home',
            component: TitleHomePage,
            meta: { title: '业务首页' }
        },
        {
            path: '/accounts/:id',
            name: 'account-detail',
            component: TitleAccountPage,
            meta: { title: '账户详情' },
            beforeEnter: to => {
                // 当前案例只认识 101 和 102 两个测试编号。
                const raw = to.params.id;
                if (raw !== '101' && raw !== '102') {
                    return { name: 'not-found' };
                }
            }
        },
        {
            path: '/404',
            name: 'not-found',
            component: TitleNotFoundPage,
            meta: { title: '页面不存在' }
        }
    ]
});

// 导航后统一更新浏览器标题。
router.afterEach((to, from, failure) => {
    if (!failure) {
        document.title =
            typeof to.meta.title === 'string'
                ? to.meta.title
                : '银行业务系统';
    }

    // 控制台用于观察实际完成的路由切换。
    console.log('导航：', from.fullPath, '→', to.fullPath);
});

export default router;
```

运行后：

1. 进入首页，浏览器标签页标题为“业务首页”；
2. 点击账户 101，进入详情，标题变为“账户详情”；
3. 返回首页，再点击账户 999，进入 `/404` 页面，标题变为“页面不存在”。

**注意：** 这里的 `beforeEnter` 只验证教学用的两种固定编号，不能证明真正的账户在数据库中存在，更不能证明当前用户有查看权限。真实接口应由后端检查账户存在性及访问权限。

### 与常见的 `onMounted()` 有什么区别

| 机制 | 关注的事情 | 是否适合做页面标题的统一管理 |
| --- | --- | --- |
| `onMounted()` | 某一个组件完成挂载 | 每页都写会重复 |
| `watch(() => route.params.id, ...)` | 当前路由参数的变化 | 适合某个详情页的数据更新 |
| `beforeEnter` | 进入特定路由前的检查 | 不是统一标题处理的首选 |
| `router.beforeEach()` | 全局导航前的检查 | 适合权限与公共前置规则 |
| `router.afterEach()` | 全局导航结束后的处理 | 适合统一页面标题和导航日志 |

> [!EXERCISE] 为什么 afterEach 不适合阻止进入页面
>
> 在 `router.afterEach()` 中发现用户角色不符合要求，想通过 `return false` 拒绝访问。为什么不应该这样设计？
>
> 【答案】后置钩子发生在导航结束后，返回 `false` 不会像前置守卫那样取消导航。权限检查应放在 `beforeEach()` 或其他适当的前置守卫中；真实数据权限仍须由后端校验。


## 拓展：根据业务配置动态添加路由

### 什么情况下需要动态路由

有些企业系统的菜单不是完全写死在前端项目里的。登录后，系统可能读取用户的菜单配置，再决定需要注册哪些业务页面。

Vue Router 提供了动态管理路由记录的 API：

| API | 作用 | 常见使用场景 |
| --- | --- | --- |
| `router.addRoute(record)` | 新增一条路由记录 | 注册按需启用的业务模块 |
| `router.hasRoute(name)` | 检查指定名称的路由是否存在 | 避免重复注册 |
| `router.removeRoute(name)` | 删除指定名称的路由 | 移除已经不再启用的模块 |
| `router.getRoutes()` | 取得当前已注册的路由记录 | 调试和生成可视化信息时使用 |

这些方法操作的是**前端路由匹配表**，不是服务器权限表。动态移除某个路由也不等于用户无法直接调用服务器接口。

### `addRoute()` 不会自动跳到新页面

假设当前 URL 是 `#/audit`，但这条路由之前并不存在。后来执行：

```ts
router.addRoute({
    path: '/audit',
    name: 'audit',
    component: AuditPage
});
```

这只是在 Router 内新增匹配记录。它不会自动发起一次新的导航；如果需要显示新页面，还要执行 `router.push()` 或 `router.replace()`。

如果新增路由发生在全局前置守卫中，应该按 Vue Router 的规则返回目标地址来重新触发匹配，并防止无限重定向；不要在一个守卫分支里随意重复添加相同路由。

### 完整程序：动态启用审计页面

保留本日公共 `src/main.ts` 与 `src/App.vue`，创建以下三个文件。

文件：`src/views/DynamicHomePage.vue`

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const message = ref('审计页面尚未注册');

// getRoutes() 返回当前路由记录数组，便于观察动态注册的结果。
const initialCount = router.getRoutes().length;

async function openAudit(): Promise<void> {
    // 只有当前没有这条命名路由时才注册。
    if (!router.hasRoute('audit')) {
        router.addRoute({
            path: '/audit',
            name: 'audit',
            // 路由页面按需加载。
            component: () => import('./AuditPage.vue')
        });

        const newCount = router.getRoutes().length;
        message.value = `路由记录数量：${initialCount} → ${newCount}`;
    }

    // addRoute 不自动导航，所以这里明确进入审计页。
    await router.push({ name: 'audit' });
}
</script>

<template>
    <h2>系统模块入口</h2>
    <p>{{ message }}</p>
    <button @click="openAudit">启用并打开审计页面</button>
</template>
```

文件：`src/views/AuditPage.vue`

```vue
<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

async function disableAudit(): Promise<void> {
    // 先离开审计页面，避免当前页面仍引用即将移除的路由。
    await router.replace({ name: 'home' });

    if (router.hasRoute('audit')) {
        router.removeRoute('audit');
    }
}
</script>

<template>
    <h2>审计页面</h2>
    <p>这是刚才动态注册的页面。</p>
    <button @click="disableAudit">返回首页并移除审计路由</button>
</template>
```

文件：`src/router/index.ts`

```ts
import { createRouter, createWebHashHistory } from 'vue-router';
import DynamicHomePage from '../views/DynamicHomePage.vue';

export default createRouter({
    history: createWebHashHistory(),
    routes: [
        // 初始路由表中只有首页，没有 /audit。
        {
            path: '/',
            name: 'home',
            component: DynamicHomePage
        }
    ]
});
```

运行后，初始只有首页路由。点击按钮，代码先注册 `/audit`，再导航到审计页面。点击“返回首页并移除审计路由”后，回到首页并删除注册记录。再次点击启用按钮，又会重新注册。

此例把 `addRoute()`、`hasRoute()` 和 `removeRoute()` 放在同一条可观察的操作链中，便于理解它们改变的是路由表而不是账户或权限数据。

**实际项目中，动态路由不能替代服务端权限控制。** 用户通过修改前端 JavaScript 或直接访问 HTTP 接口，可能绕过所有浏览器端的显示限制；服务端必须独立核对身份、角色和具体业务资源。

## 拓展：Hash 与 History 模式在部署时的差别

### 两种路由历史模式

本日全部运行程序都使用：

```ts
history: createWebHashHistory()
```

它产生带 `#` 的客户端地址，例如：

```text
https://example.com/#/accounts/101
```

Vue Router 还支持：

```ts
history: createWebHistory()
```

它会产生不带 `#` 的正常路径，例如：

```text
https://example.com/accounts/101
```

`createWebHistory()` 通常更适合希望使用简洁地址的 Web 应用，但它需要部署服务器正确配置页面回退：用户直接访问或刷新 `/accounts/101` 时，服务器要把应用页面入口返回给浏览器，再由前端 Router 判断具体显示哪个组件。

如果服务器只按物理文件寻找 `/accounts/101`，而没有回退配置，用户刷新时就可能得到服务器的 404，而不是 Vue 的业务详情页面。

### 完整程序：将 Hash 入口改成 History 模式

沿用前面“路由懒加载与 404”章节中的 `DashboardPage.vue`、`TransferPage.vue`、`NotFoundPage.vue`，并保留公共 `src/main.ts`、`src/App.vue`。只需把路由文件替换为下面的完整版本。

文件：`src/router/index.ts`

```ts
import { createRouter, createWebHistory } from 'vue-router';
import DashboardPage from '../views/DashboardPage.vue';

export default createRouter({
    // 改为不带 # 的浏览器 History 模式。
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            name: 'dashboard',
            component: DashboardPage
        },
        {
            path: '/transfer',
            name: 'transfer',
            component: () => import('../views/TransferPage.vue')
        },
        {
            path: '/:pathMatch(.*)*',
            name: 'not-found',
            component: () => import('../views/NotFoundPage.vue')
        }
    ]
});
```

开发时，Vite 通常能为单页应用提供需要的页面入口回退；构建部署到真实服务器后，需要按实际 Nginx、Tomcat 或网关配置决定怎么处理这些路径。这里不能把 Vite 开发服务器能运行，直接当成生产部署已经完成。

例如，使用 Nginx 托管前端单页应用时，常见思路是：静态资源按文件提供，无法匹配的前端路由回退到 `index.html`。但如果同一个服务还代理 `/api/` 等后端接口，**不能把接口路径也无条件重写成前端 HTML**。具体部署规则必须结合项目配置，不应直接照搬某一个通用模板。

| 对比 | Hash 模式 | History 模式 |
| --- | --- | --- |
| Router API | `createWebHashHistory()` | `createWebHistory()` |
| 地址形式 | `/#/accounts` | `/accounts` |
| 是否需要服务器理解 `#` 后的路径 | 不需要 | 不涉及 `#` |
| 直接刷新深层地址 | 一般不需要额外的前端路由回退 | 服务器需配置应用入口回退 |
| 常见排错方向 | `#` 后的路由匹配 | 服务器回退规则与客户端路由匹配 |

## 当日复盘与企业项目阅读顺序

### 常见路由配置的职责

| 看到的代码 | 先判断什么 | 下一步追踪 |
| --- | --- | --- |
| `children: [...]` | 是否使用父子布局 | 父组件里的第二层 `<RouterView>` |
| `redirect: ...` | 地址会跳转到哪里 | 最终匹配的目标路由 |
| `name: 'account-detail'` | 是否通过命名路由导航 | `router.push({ name, params })` |
| `params: { id }` | ID 是否来自动态路径 | 详情组件如何转换和验证 ID |
| `query: { tab }` | 是否把页面状态放进 URL | `route.query.tab` 的解析与默认值 |
| `meta: { requiresAuth: true }` | 这是约定数据，不是自动授权 | 是否有守卫真正读取这个字段 |
| `router.beforeEach(...)` | 全局导航前判断 | 登录状态、角色来源、重定向循环 |
| `beforeEnter: ...` | 是否为特定路由检查 | 参数变化时是否仍需其他验证 |
| `router.afterEach(...)` | 导航后统一处理什么 | 页面标题、日志和失败分支 |
| `component: () => import(...)` | 是否为懒加载页面 | 加载后组件是否发接口请求 |
| `/:pathMatch(.*)*` | 是否有兜底 404 | 具体 404 页面内容 |
| `onBeforeRouteUpdate()` | 组件是否被复用 | 动态参数变化后的数据更新 |
| `onBeforeRouteLeave()` | 能否安全离开当前页面 | 草稿状态、确认逻辑、返回值 |
| `router.addRoute()` | 路由是否动态注册 | 权限数据与路由表是否混淆 |

### 阅读企业项目时，从哪里开始

先看浏览器地址属于 Hash 还是 History 模式，再从 `src/main.ts` 找到注册的路由模块。

```text
浏览器当前 URL
    ↓
main.ts 中 app.use(router)
    ↓
router/index.ts 中的 routes
    ↓
父布局、children、redirect
    ↓
匹配到的页面组件
    ↓
路由前置守卫与 meta
    ↓
页面的 onMounted / watch / onBeforeRouteUpdate
    ↓
页面事件、API 函数、HTTP 请求
```

如果问题是“访问页面被跳到登录”，优先看导航守卫和登录状态；如果问题是“URL 已变化但页面没有内容”，优先看路由匹配、布局出口和懒加载错误；如果问题是“切换账户 ID 后仍显示旧数据”，优先看组件复用与参数监听；如果问题是“刷新深层地址后服务器 404”，优先看 History 模式和部署服务器回退规则。

### 练习检查清单

> [!EXERCISE] 父布局与子路由
>
> 业务地址是 `/workbench/accounts`，父路由 `path: '/workbench'`。子路由应该写 `path: 'accounts'` 还是 `path: '/workbench/accounts'`？布局里应该放什么？
>
> 【答案】使用相对路径 `path: 'accounts'` 更清晰，最终自动拼接成 `/workbench/accounts`；父布局组件中必须有显示子页面的 `<RouterView />`。如果写成带 `/` 的绝对路径，需要明确其独立路径含义。

> [!EXERCISE] 登录后返回目标页
>
> 未登录访问 `#/accounts`，被守卫跳到登录页，登录后应该怎样恢复原目标？
>
> 【答案】在守卫中把 `to.fullPath` 保存到登录页的 `query.redirect`，登录成功后读取并验证它是应用允许的内部地址，再使用 `router.replace()` 导航。不能把任意外部地址原样作为跳转目标。

> [!EXERCISE] HTTP 状态 200 是否说明页面有权限
>
> 前端守卫已经允许进入账户详情，后端返回 HTTP 200，但响应体里说明“无查询权限”。能否认为前端权限检查已经充分？
>
> 【答案】不能。前端路由守卫只管导航，后端仍应校验具体接口和业务资源的授权。HTTP 200 也不等于业务处理成功，需要按响应体协议判断业务码。

> [!EXERCISE] 懒加载、组件缓存和请求缓存
>
> 使用 `() => import('./TransferPage.vue')` 后，转账草稿是否会自动保存？是否说明业务接口只会请求一次？
>
> 【答案】都不是。动态导入用于按需加载页面模块，不等于缓存 Vue 组件实例，也不等于缓存业务 HTTP 请求结果。草稿和接口缓存需要另外设计。

> [!EXERCISE] 详情页 ID 切换
>
> 详情页 `onMounted()` 只读取了账户 101，用户切换到 `/accounts/102` 后仍显示 101。为什么？
>
> 【答案】同一路由记录匹配的组件会被复用，`onMounted()` 不会因为参数变化而重新运行。应使用 `watch(() => route.params.id, ..., { immediate: true })` 或合适的路由更新机制。

> [!EXERCISE] 未保存草稿时拒绝离开
>
> 用户在转账草稿页输入了内容，点击菜单离开后不希望丢失内容。应该在哪个阶段阻止导航？
>
> 【答案】使用 `onBeforeRouteLeave()`，根据是否存在未保存修改决定是否返回 `false` 取消导航。`onUnmounted()` 已经发生在组件卸载阶段，无法用它撤销导航。真实保存操作必须在接口确认成功后再清除未保存标志。

### 官方文档索引

- [Vue Router：嵌套路由](https://router.vuejs.org/zh/guide/essentials/nested-routes)
- [Vue Router：命名路由](https://router.vuejs.org/guide/essentials/named-routes)
- [Vue Router：动态路由匹配](https://router.vuejs.org/zh/guide/essentials/dynamic-matching)
- [Vue Router：路由元信息](https://router.vuejs.org/guide/advanced/meta)
- [Vue Router：导航守卫](https://router.vuejs.org/zh/guide/advanced/navigation-guards)
- [Vue Router：组合式 API](https://router.vuejs.org/zh/guide/advanced/composition-api)
- [Vue Router：路由懒加载](https://router.vuejs.org/guide/advanced/lazy-loading)
- [Vue Router：动态添加路由](https://router.vuejs.org/guide/advanced/dynamic-routing)
- [Vue Router：不同的历史模式](https://router.vuejs.org/guide/essentials/history-mode)
- [Vue Router：导航失败](https://router.vuejs.org/guide/advanced/navigation-failures)
