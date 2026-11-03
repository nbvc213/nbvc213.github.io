---
id: vue-course-supplement-day-5
order: 1110
date: 2026-11-03
updated: 2026-11-03
tags: [Vue, TypeScript, Vue DevTools, ESLint, Prettier, vue-tsc, SCSS, Vitest, 工程化]
description: "通过账户业务案例，掌握 Vue 调试、TypeScript 工具类型、静态检查、格式化、组件样式、自动化测试及构建交付。"
draft: false
---

## 学习目标与时间安排

前五天基础课程与四天补充课程已经覆盖 Vue 组件、路由、Element Plus、Axios、Pinia 和真实接口联调。最后一天不再增加新的业务框架，而是解决企业项目里另一类重要问题：**怎样定位已有代码的问题、保证修改质量，并把修改过的功能可靠地交给团队。**

本日采用账户管理案例，重点补充 Vue DevTools、TypeScript 常用工具类型、ESLint、Prettier、`vue-tsc`、SCSS 与 `:deep()`、Vitest 与 Vue Test Utils，以及构建和协作流程。每项新的 API 或语法都配有可实际操作的示例；涉及多文件的示例会标明全部文件和运行命令。

| 学习内容 | 建议时间 | 重点能力 |
| --- | ---: | --- |
| Vue DevTools 与组件数据追踪 | 15 分钟 | 从组件树追踪 Props、Emit、Pinia |
| TypeScript 企业常用工具类型 | 20 分钟 | `Pick`、`Omit`、`Partial`、`Record`、`keyof` 等 |
| ESLint、Prettier 与 `vue-tsc` | 25 分钟 | 分清规范、排版和静态类型检查 |
| scoped CSS、`:deep()` 与 SCSS | 20 分钟 | 修改业务组件样式而不污染全局 |
| Vitest 与 Vue Test Utils | 30 分钟 | 测试业务规则、组件事件和异步状态 |
| 构建与质量验收 | 10 分钟 | 执行检查、构建、预览 |
| **主线合计** | **120 分钟** | |

Git 团队协作、Playwright 浏览器端到端测试、企业自定义组件阅读和样式更多细节作为拓展，不计入两小时主线。需要时再查阅，不必在一次学习中全部完成。

### 本日运行约定

继续使用 Vue 3 + TypeScript + Vite 项目。主线中的 Vue 页面示例沿用 `src/main.ts`：

```ts
import { createApp } from 'vue';
import App from './App.vue';

createApp(App).mount('#app');
```

需要 Pinia 或 Element Plus 的章节会给出对应入口和安装说明；如果原项目已经注册这些插件，保留既有入口配置，不要因练习而覆盖团队项目的初始化代码。

以下各节的**完整程序是独立实验**。同一节中列出的文件需要一起创建；切换到另一节时，按该节说明替换对应文件。不要将不同示例中的多个 `App.vue`、测试配置或者 `vite.config.ts` 直接合并。

项目可能已经有 ESLint、Prettier 和测试框架。**先查看 `package.json` 与现有配置，再选择沿用或补充。** 不要在正式工作项目中直接覆盖原有规则、修改包管理方式或升级全部依赖。

## Vue DevTools：观察组件和共享状态

### Vue DevTools 能解决什么问题

浏览器 Network 用来查看 HTTP 请求，Sources 用来给 JavaScript 设置断点，Console 用来查看运行错误。**Vue DevTools** 则专门观察 Vue 应用内部结构：

- 当前页面实际挂载了哪些组件；
- 子组件收到什么 Props；
- 子组件发出了哪些自定义事件（不同版本的工具界面存在差异）；
- 组件的 `ref`、`reactive` 和计算属性当前是什么值；
- Pinia 中的 Store 与 State 如何变化；
- 某个显示错误究竟发生在数据传递还是模板渲染阶段。

可以安装 Vue 官方 DevTools 浏览器扩展，或在支持的工程中使用 Vue DevTools 的 Vite 集成。不同版本的扩展在面板名称、布局和事件观察能力上有所区别，因此以你当前工具的界面为准。建议同时保留浏览器的 Elements、Console 和 Network：Vue DevTools **不替代** DOM、网络和 JavaScript 调试工具。

### 完整程序：观察 Props、Emit 和 Pinia

本例通过两个子组件共享一个 Store，再把账户 ID 作为 Prop 传给按钮组件。点击按钮后，子组件发出事件，父组件调用 Pinia Action 修改状态。

如果还没有 Pinia，在项目根目录执行：

```bash
npm install pinia
```

文件：`src/stores/accountSelection.ts`

```ts
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export const useAccountSelectionStore = defineStore('account-selection', () => {
    // State：保存当前选中的账户 ID。
    const selectedId = ref<number | null>(null);

    // Getter：根据 State 计算页面需要的显示状态。
    const hasSelection = computed(() => selectedId.value !== null);

    // Action：统一修改选中状态。
    function select(id: number): void {
        selectedId.value = id;
    }

    return { selectedId, hasSelection, select };
});
```

文件：`src/components/AccountSelectButton.vue`

```vue
<script setup lang="ts">
// 父组件提供 ID 和名称。
const props = defineProps<{
    id: number;
    name: string;
}>();

// 子组件只报告用户选择的账户编号。
const emit = defineEmits<{
    (event: 'select', id: number): void;
}>();
</script>

<template>
    <button @click="emit('select', props.id)">
        选择 {{ props.name }}
    </button>
</template>
```

文件：`src/App.vue`

```vue
<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useAccountSelectionStore } from './stores/accountSelection';
import AccountSelectButton from './components/AccountSelectButton.vue';

const store = useAccountSelectionStore();
const { selectedId, hasSelection } = storeToRefs(store);

function handleSelect(id: number): void {
    store.select(id);
}
</script>

<template>
    <h2>账户选择调试</h2>

    <AccountSelectButton
        :id="101"
        name="储蓄账户"
        @select="handleSelect"
    />

    <AccountSelectButton
        :id="102"
        name="工资账户"
        @select="handleSelect"
    />

    <p>当前 ID：{{ selectedId ?? '未选择' }}</p>
    <p>是否选中：{{ hasSelection ? '是' : '否' }}</p>
</template>
```

文件：`src/main.ts`

```ts
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';

const app = createApp(App);
app.use(createPinia());
app.mount('#app');
```

执行 `npm run dev` 后打开页面及 Vue DevTools：

1. 在组件树里找到 `App` 和两个 `AccountSelectButton` 实例。
2. 选中第一个按钮组件，确认 Props 中 `id=101`、`name='储蓄账户'`。
3. 点击第一个按钮。父组件的 `handleSelect(101)` 会调用 Store Action。
4. 在 Pinia/Stores 视图中找到 `account-selection`，查看 `selectedId` 从 `null` 变为 `101`。
5. 点击第二个按钮，确认它自己的 Prop 仍为 `102`，但 Store 的 `selectedId` 变为 `102`。

**排查原则：** 子组件 Props 错误，就向父组件检查绑定；事件没有处理，就核对 Emit 与监听名称；Store 正确但页面没更新，就检查 `storeToRefs()`、计算属性和模板。不要在看到界面错误时立即修改后端接口。

### Vue DevTools 的修改功能不能代替业务验证

开发工具允许在开发过程中直接检查甚至临时修改响应式状态，但这种操作只是**调试手段**。它不代表真实业务接口完成了保存，页面刷新后也不会自动持久化到数据库。实际验收必须走完整的用户事件与 API 链路。

> [!EXERCISE] 定位账户选择不更新
>
> 点击子组件按钮后，Vue DevTools 中该组件的 `id` 正确，但 Pinia `selectedId` 没变。应该先查哪一层？
>
> 【答案】
>
> 先检查子组件是否发出 `select` 事件，以及父组件 `@select="handleSelect"` 是否正确接收参数；然后检查 `handleSelect()` 是否调用 `store.select(id)`。既然 Prop 正确，就没有必要优先怀疑数据来源。

## TypeScript 工具类型：安全地拆分接口模型

### 为什么一个账户需要多个类型

前面的项目已经定义过账户对象的 `interface`。真实项目中，同一份账户数据会用于不同操作：

- 查询响应需要完整的账户 ID、名称、状态和余额；
- 新增请求不应该由前端任意填写后端生成的 ID；
- 编辑请求只允许修改名称、备注等字段；
- 部分更新请求只提交发生变化的字段；
- 状态文字需要按照固定状态码映射。

如果每个地方都复制一遍同样的字段声明，后续增删字段时容易遗漏。TypeScript 的**工具类型（Utility Types）**可以基于已有类型生成新类型。

### 常用工具类型与参数

| 语法 | 参数含义 | 结果 | 企业业务用途 |
| --- | --- | --- | --- |
| `Pick<T, K>` | 从对象类型 `T` 中选择属性名 `K` | 只包含指定字段的新类型 | 保存草稿、表单子模型 |
| `Omit<T, K>` | 从 `T` 中去掉属性名 `K` | 排除指定字段的新类型 | 新增请求不包含 ID |
| `Partial<T>` | 把 `T` 的属性变成可选 | 允许只提供部分字段 | 局部更新 |
| `Required<T>` | 把 `T` 的属性变成必填 | 所有字段必须提供 | 表单校验后的数据契约 |
| `Readonly<T>` | 将 `T` 的属性标记为只读 | 阻止代码直接赋值 | 只读配置 |
| `Record<K, V>` | 键类型 `K`、值类型 `V` | 键值映射对象 | 状态码与中文含义映射 |
| `keyof T` | 对象类型 `T` | 属性名称的联合类型 | 限制可排序、可编辑字段 |
| `typeof value` | 已有变量 `value` | 从变量推导出类型 | 减少重复类型声明 |
| `as const` | 作用于表达式 | 尽量保留字面量并标记只读 | 固定状态选项、配置 |
| `satisfies T` | 目标类型 `T` | 检查表达式是否满足类型 | 配置对象检查并保留推断类型 |

这些都是 **TypeScript 静态类型能力**，不会在浏览器运行时自动验证后端 JSON。比如 `Partial<Account>` 不会自动生成一个可提交接口，也不会替你检查用户权限。

### `unknown`、类型收窄和类型断言

第三、四天已经见过 `catch (error)`。未知异常应先按 `unknown` 对待，再使用 `instanceof Error` 等判断缩小类型：

```ts
function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }

    return '发生未知错误';
}
```

这里 `instanceof Error` 是运行时判断；经过判断后，TypeScript 才能安全读取 `.message`。

`as` 类型断言与运行时校验不同：

```ts
const value: unknown = { id: '错误类型' };
const account = value as { id: number };
```

这段代码能让 TypeScript **按指定类型相信** `value`，但运行时的 `id` 仍然是字符串。对于 HTTP 响应，应该根据业务要求进行运行时验证，不能滥用 `as` 掩盖字段不匹配。

### 完整程序：从账户主类型派生新增、编辑、状态映射

文件：`src/types/accountModel.ts`

```ts
export interface Account {
    id: number;
    name: string;
    active: boolean;
    balance: number;
    remark?: string;
}

// 新增请求保留姓名和状态，不允许前端指定 ID 和余额。
export type CreateAccount = Pick<Account, 'name' | 'active'>;

// 编辑只允许修改姓名和备注。
export type EditAccount = Pick<Account, 'name' | 'remark'>;

// 局部修改：允许只传入发生变化的字段。
export type PatchAccount = Partial<EditAccount>;

// 如果接口需要除 ID 外的全部字段，可以用 Omit。
export type AccountWithoutId = Omit<Account, 'id'>;

export type AccountKey = keyof Account;

// 固定状态选项，保留 'enabled' 和 'disabled' 字面量类型。
export const statusOptions = [
    { value: 'enabled', label: '启用' },
    { value: 'disabled', label: '停用' }
] as const;

export type StatusCode = (typeof statusOptions)[number]['value'];

// 所有 StatusCode 都必须有中文含义。
export const statusLabels = {
    enabled: '启用',
    disabled: '停用'
} satisfies Record<StatusCode, string>;

// 排序字段只允许使用这些账户字段。
export const sortableFields = ['id', 'name', 'balance'] as const;
export type SortField = (typeof sortableFields)[number];
```

文件：`src/App.vue`

```vue
<script setup lang="ts">
import { reactive, ref, computed } from 'vue';
import type {
    Account,
    CreateAccount,
    EditAccount,
    PatchAccount,
    AccountKey,
    SortField,
    StatusCode
} from './types/accountModel';
import { statusLabels, statusOptions } from './types/accountModel';

const rows = ref<Account[]>([
    { id: 101, name: '储蓄账户', active: true, balance: 3200 },
    { id: 102, name: '工资账户', active: false, balance: 8500 }
]);

const draft = reactive<CreateAccount>({
    name: '',
    active: true
});

const sortField = ref<SortField>('id');

function displayField(account: Account, key: AccountKey): string {
    // keyof 限制 key 必须是 Account 中存在的字段。
    return String(account[key] ?? '');
}

function addAccount(): void {
    const name = draft.name.trim();
    if (name.length === 0) return;

    rows.value.push({
        id: Math.max(100, ...rows.value.map(item => item.id)) + 1,
        name,
        active: draft.active,
        balance: 0
    });

    draft.name = '';
}

function editFirstAccount(): void {
    // 编辑请求只包含允许修改的字段。
    const changes: EditAccount = {
        name: '储蓄账户（已维护）',
        remark: '柜面确认'
    };

    const partial: PatchAccount = { remark: changes.remark };
    const first = rows.value[0];
    if (!first) return;

    rows.value[0] = { ...first, ...changes, ...partial };
}

const displayedRows = computed(() => {
    // 当前字段是受 SortField 限制的，不会传入任意属性名。
    return [...rows.value].sort((a, b) => {
        const left = a[sortField.value];
        const right = b[sortField.value];
        return typeof left === 'number' && typeof right === 'number'
            ? left - right
            : String(left).localeCompare(String(right), 'zh-CN');
    });
});

function getStatusText(active: boolean): string {
    const code: StatusCode = active ? 'enabled' : 'disabled';
    return statusLabels[code];
}
</script>

<template>
    <h2>类型工具：账户维护</h2>

    <input v-model="draft.name" placeholder="请输入新账户名称" />
    <label>
        <input type="checkbox" v-model="draft.active" />
        新账户启用
    </label>
    <button @click="addAccount">新增账户</button>
    <button @click="editFirstAccount">编辑第一条记录</button>

    <p>排序字段：</p>
    <select v-model="sortField">
        <option value="id">编号</option>
        <option value="name">名称</option>
        <option value="balance">余额</option>
    </select>

    <ul>
        <li v-for="item in displayedRows" :key="item.id">
            {{ displayField(item, 'id') }} - {{ item.name }}
            - {{ getStatusText(item.active) }}
            - {{ item.balance }} 元
            - {{ item.remark ?? '无备注' }}
        </li>
    </ul>

    <p>可选状态：{{ statusOptions.map(item => item.label).join(' / ') }}</p>
</template>
```

在 VS Code 中尝试把 `sortField` 赋值为 `'password'`，或者把 `CreateAccount` 对象写成 `{ id: 1, name: 'A', active: true }`，TypeScript 会提示类型不符合约定。然后恢复正确代码，运行页面验证新增、编辑和排序。

**重点：** 上面的类型工具负责阻止开发阶段的错误字段，不等于服务器也会拒绝非法字段。真实写入接口必须由服务端重新校验字段和权限。

### 关于 Pick、Omit 和真实业务 DTO

DTO（Data Transfer Object，数据传输对象）表示前后端约定的请求或响应结构。`Pick` 和 `Omit` 适合**字段含义确实一致**的情况；如果新增接口的字段名、格式或可选性与账户详情明显不同，应该直接定义独立的请求类型，而不是为了节省几行代码强行复用。

> [!EXERCISE] 新增参数为什么不直接使用 Account
>
> 账户详情包含 `id`、`balance` 等字段，但新增接口只允许用户提交姓名和启用状态。应该怎样定义请求类型？
>
> 【答案】
>
> 可以使用 `type CreateAccount = Pick<Account, 'name' | 'active'>`。如果新增接口字段与账户详情有不同的业务含义或格式，应单独声明 `interface CreateAccountRequest`，以真实接口协议为准。

## ESLint、Prettier 与 vue-tsc：三种不同检查

### 为什么工程需要自动检查

企业项目有多个开发者参与。某个文件在浏览器里看起来能运行，不代表它不存在类型错误、未使用变量或格式差异。一般需要把检查分成三个独立职责：

| 工具 | 主要检查什么 | 典型结果 | 能否替代其他工具 |
| --- | --- | --- | --- |
| ESLint | 代码规则、部分潜在错误、Vue/TS 规范 | 未使用变量、不推荐的写法 | 不能替代 TypeScript 完整类型检查 |
| Prettier | 代码布局和排版 | 缩进、引号、分号、换行 | 不理解业务数据是否正确 |
| `vue-tsc` | Vue SFC 和 TypeScript 的静态类型 | Props 参数不匹配、字段类型错误 | 不负责统一排版 |
| Vite build | 把程序编译、打包为部署资源 | `dist/` 文件 | 默认不代表做过完整类型检查和业务测试 |

因此，某个项目的 `npm run build` 能成功，并不必然代表类型校验已完成。要查看 `package.json` 的 `build` 脚本有没有包含 `vue-tsc` 等检查步骤。

### 先检查现有项目再添加配置

在项目根目录查看：

```bash
npm run
npm ls eslint prettier vue-tsc --depth=0
```

`npm run` 会列出当前项目脚本；`npm ls ... --depth=0` 用于查看顶层是否安装了这些包。未安装的包会显示缺失或退出非零状态，不代表 Vue 项目不能运行。

还应查找：

```text
eslint.config.js / eslint.config.mjs
.eslintrc.*
.prettierrc / .prettierrc.json
prettier.config.*
tsconfig.json / tsconfig.app.json
```

**团队项目应优先沿用既有配置。** 下例针对现代 Vue 3 + TypeScript + Vite 独立练习工程，演示如何从零添加一套基础检查。

### ESLint：安装和完整配置

在项目根目录执行：

```bash
npm install -D eslint @eslint/js eslint-plugin-vue typescript-eslint globals eslint-config-prettier
```

这些包分别承担：

- `eslint`：规则检查命令；
- `@eslint/js`：JavaScript 推荐规则；
- `eslint-plugin-vue`：理解 Vue `.vue` 文件和模板规则；
- `typescript-eslint`：让 ESLint 使用 TypeScript 语法和规则；
- `globals`：声明浏览器环境中的全局变量；
- `eslint-config-prettier`：关闭与 Prettier 排版冲突的 ESLint 规则。

文件：项目根目录 `eslint.config.mjs`

```js
import js from '@eslint/js';
import pluginVue from 'eslint-plugin-vue';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
    // 不扫描自动生成的文件。
    { ignores: ['node_modules/**', 'dist/**', 'coverage/**'] },

    // JavaScript 基础规则与 TypeScript 推荐规则。
    js.configs.recommended,
    ...tseslint.configs.recommended,

    // Vue 3 模板及组件的基础规则。
    ...pluginVue.configs['flat/essential'],

    // .vue 中的 <script lang="ts"> 使用 TypeScript 解析器。
    {
        files: ['**/*.vue'],
        languageOptions: {
            parserOptions: {
                parser: tseslint.parser
            }
        }
    },

    // Vue 编译宏由 Vue 编译器识别，而不是普通运行时变量。
    {
        files: ['**/*.{ts,vue}'],
        languageOptions: {
            globals: globals.browser
        },
        rules: {
            'no-undef': 'off'
        }
    },

    // 排版交给 Prettier，避免规则冲突。
    eslintConfigPrettier
);
```

配置文件使用 `.mjs` 是为了明确采用 ECMAScript Module 的 `import`/`export`，不依赖当前项目的 `package.json` 是否设置 `"type": "module"`。

`tseslint.config()` 用于组合规则配置。`files` 指定规则作用于哪些文件；`ignores` 排除生成目录；`languageOptions` 设置解析和全局环境；`rules` 可以覆盖单条规则。例子采用无需 TypeScript 项目信息的基本规则，**不是完整的类型感知 ESLint 检查**。真正的类型校验仍由下面的 `vue-tsc` 承担。

这份配置使用了当前常见的 ESLint Flat Config 格式。已有项目如果使用旧 `.eslintrc` 或团队预置配置，不应混用两套配置而不检查兼容性。

### 完整程序：让 ESLint 检查账户查询组件

文件：`src/App.vue`

```vue
<script setup lang="ts">
import { computed, ref } from 'vue';

const keyword = ref('');
const accounts = ref([
    { id: 101, name: '储蓄账户' },
    { id: 102, name: '工资账户' }
]);

const filtered = computed(() =>
    accounts.value.filter(account => account.name.includes(keyword.value.trim()))
);
</script>

<template>
    <h2>账户查询规范检查</h2>
    <input v-model="keyword" placeholder="请输入名称" />
    <ul>
        <li v-for="account in filtered" :key="account.id">
            {{ account.name }}
        </li>
    </ul>
</template>
```

运行检查：

```bash
npx eslint "src/**/*.{ts,vue}"
```

`npx` 在当前项目中寻找并执行已安装的命令。检查通过时一般不输出错误；违反规则时会报告文件、行列和规则名称。规则提示是供你定位的，不是让你在业务代码中随意关闭检查。

现在在 `<script setup>` 中故意增加：

```ts
const unusedValue = 123;
```

再次运行 ESLint。由于该变量未被使用，TypeScript ESLint 推荐规则应报告未使用变量；删除它后重新检查。

> [!NOTE] Vue 模板变量和 ESLint
>
> Vue 的 `ref`、Props、Emit 会同时出现在 `<script setup>` 与 `<template>` 中。必须使用能理解 `.vue` 文件的解析配置，否则普通 JavaScript 规则可能误判变量未使用，或者直接无法解析模板。遇到此类问题，优先检查 ESLint 版本、Vue 插件与解析器配置。

### Prettier：统一代码格式

Prettier 只负责排版，不负责验证账户业务规则。先安装：

```bash
npm install -D prettier
```

文件：项目根目录 `.prettierrc.json`

```json
{
  "singleQuote": true,
  "semi": true,
  "tabWidth": 4,
  "printWidth": 100,
  "trailingComma": "none",
  "endOfLine": "lf"
}
```

常见选项：

| 属性 | 含义 | 本例设定 |
| --- | --- | --- |
| `singleQuote` | JavaScript 字符串是否优先使用单引号 | `true` |
| `semi` | 语句末尾是否保留分号 | `true` |
| `tabWidth` | 每级缩进的空格数 | 4 |
| `printWidth` | 目标行宽，超过后尝试换行 | 100 |
| `trailingComma` | 多行对象等位置是否添加尾随逗号 | 不添加 |
| `endOfLine` | 行尾符号风格 | LF |

这些只是教学示例，**实际项目应服从团队既定格式**。不要为了个人偏好在一个需求提交里重排整个仓库，否则代码审查的差异会变得难以阅读。

文件：项目根目录 `.prettierignore`

```gitignore
node_modules/
dist/
coverage/
```

执行检查，不修改文件：

```bash
npx prettier --check src/App.vue
```

执行格式化，直接写回文件：

```bash
npx prettier --write src/App.vue
```

`--check` 用于检查现有排版是否符合配置；`--write` 用于实际改写文件。改写后应该使用 `git diff` 查看变化，避免混入与业务无关的大规模格式调整。

### vue-tsc：校验 `.vue` 里的 TypeScript

Vite 的开发服务器主要追求快速转换与热更新，默认不会对整个 Vue 项目做完整 TypeScript 类型检查。`vue-tsc` 能理解单文件组件的脚本和模板，并进行静态类型分析。

安装：

```bash
npm install -D vue-tsc typescript
```

如果项目有 `tsconfig.app.json`，运行：

```bash
npx vue-tsc --noEmit -p tsconfig.app.json
```

- `--noEmit`：只检查，不输出编译后的 JavaScript 文件；
- `-p tsconfig.app.json`：指定应用使用的 TypeScript 项目配置。

如果项目没有 `tsconfig.app.json`，则以实际参与 Vue 应用检查的配置文件为准，不要凭空创建一个不完整的 TypeScript 项目。已有 `vue-tsc -b` 构建脚本也可以继续沿用。

### 完整程序：观察 Props 类型错误

文件：`src/components/AccountAmount.vue`

```vue
<script setup lang="ts">
const props = defineProps<{
    amount: number;
}>();
</script>

<template>
    <p>可用余额：{{ props.amount }} 元</p>
</template>
```

文件：`src/App.vue`

```vue
<script setup lang="ts">
import AccountAmount from './components/AccountAmount.vue';

const balance: number = 3200;
</script>

<template>
    <h2>账户余额类型检查</h2>
    <AccountAmount :amount="balance" />
</template>
```

正常运行类型检查后，把父组件改成下面的**故意错误**版本：

```vue
<AccountAmount amount="三千二百" />
```

子组件要求 `number`，父组件却传入字符串。`vue-tsc` 应指出 Prop 类型不匹配。将其恢复为 `:amount="balance"` 后再次检查。

这里要区分两个不同问题：

- `amount="3200"` 传的是字符串，仍不符合 `number`；
- `:amount="3200"` 传的是 JavaScript 数字表达式，符合 `number`。

**类型检查通过不代表业务金额正确。** 例如余额字段虽然是数字，但可能为负数、超过限额或不符合接口单位，这些仍然需要业务验证。

### package.json：把检查命令固定下来

在已有 `package.json` 的 `scripts` 对象中**合并**以下命令，保留原有 `dev`、`build` 等脚本，不要直接覆盖整个文件：

```json
{
  "scripts": {
    "lint": "eslint \"src/**/*.{ts,vue}\"",
    "format:check": "prettier --check src",
    "format": "prettier --write src",
    "typecheck": "vue-tsc --noEmit -p tsconfig.app.json"
  }
}
```

此处 `scripts` 是可合并的配置片段，不是要替换的完整 `package.json`。如果 TypeScript 配置文件路径不同，调整 `typecheck` 的 `-p` 参数。

以后运行：

```bash
npm run lint
npm run format:check
npm run typecheck
```

三项检查分别执行，哪一步失败就先修复对应问题。**不要把自动格式化 `--write` 放在 CI 的只读检查步骤中**；CI 通常应该通过 `--check` 报告不符合规范的文件，由开发者在本地修正后提交。

> [!EXERCISE] 哪一种工具应该发现问题
>
> ① 行缩进不统一；② 父组件给数字 Prop 传入字符串；③ 声明了无用变量；④ 接口真实返回余额为负数。
>
> 【答案】
>
> ① 优先由 Prettier 处理；② 由 `vue-tsc` 的静态类型检查发现；③ 由 ESLint 规则发现；④ 静态类型无法保证业务金额合法，需要运行时业务校验或测试。

## Scoped CSS、SCSS 与布局：修改样式而不影响其他页面

### 为什么 Element Plus 样式经常需要单独处理

企业项目中，页面往往有固定的查询表单、操作按钮和表格。你可能需要把某个查询输入框加宽、调整两栏布局，或者修改某一处 Element Plus 控件的内边距。

Vue 的单文件组件支持：

```vue
<style scoped>
/* 当前组件自己的样式 */
</style>
```

`scoped` 会由 Vue 编译器对本组件模板中的元素添加作用域标记，并调整 CSS 选择器，使规则主要作用于当前组件生成的元素。它并不是 Shadow DOM，也不保证后代组件的所有内部节点都能被普通选择器选中。

例如：

```css
.account-page .el-input__wrapper {
    padding: 10px;
}
```

在 `<style scoped>` 中，这个规则未必能够命中 Element Plus 在子组件内部创建的 `.el-input__wrapper` 元素。此时可以使用 Vue 的 `:deep()` 伪类，把需要深入匹配的部分明确标出来。

### :deep()：只在指定业务范围调整子组件内部样式

```css
.account-page :deep(.el-input__wrapper) {
    border-radius: 12px;
}
```

可以分两部分理解：

- `.account-page`：先限制到当前业务页面的容器；
- `:deep(.el-input__wrapper)`：允许匹配后代子组件内部的该元素。

**要始终配合稳定的业务容器类名使用深度选择器**，避免在一个页面中无意修改所有 Element Plus 输入框。第三方组件内部 DOM 类名可能随库升级变化，优先使用组件公开的 Props、CSS 变量或主题配置；只有没有对应公开配置时，再考虑 `:deep()`。

### SCSS 是什么

SCSS 是 Sass 提供的一种 CSS 扩展语法，文件通常以 `.scss` 结尾。它允许在 CSS 基础上使用变量、嵌套规则、Mixin（可复用样式片段）等功能。

在 Vue 单文件组件中可以写：

```vue
<style scoped lang="scss">
$gap: 16px;

.panel {
    padding: $gap;

    &__title {
        font-weight: 600;
    }
}
</style>
```

其中：

- `lang="scss"`：告诉构建工具先按 SCSS 解析样式；
- `$gap`：SCSS 变量，编译时替换成对应值；
- `.panel { ... }`：嵌套规则所在的父级选择器；
- `&`：表示当前嵌套位置的父选择器；
- `&__title`：将 `.panel` 与 `__title` 拼接成 `.panel__title`。

SCSS 变量与浏览器原生 CSS 自定义属性不同：SCSS 变量在构建阶段处理，CSS 变量（例如 `--el-color-primary`）可以在运行时参与样式计算。不要把 SCSS 变量当成 Vue 响应式状态。

### 安装 Sass

在项目根目录执行：

```bash
npm install -D sass
```

Vite 可以在安装对应预处理器后处理 `<style lang="scss">`。如果项目已有 Sass 或使用其他样式方案（Less、CSS Modules、Tailwind 等），不需要强行更换。真实工程应优先沿用当前组件库和项目的样式规范。

### Flexbox 和 Grid：分别解决什么布局

| CSS 布局 | 主要用途 | 本例场景 |
| --- | --- | --- |
| `display: flex` | 沿主轴排列、对齐和换行 | 查询按钮、操作栏 |
| `display: grid` | 组织行列结构 | 左侧查询区 + 右侧账户卡片 |
| `gap` | 子项之间的间距 | 卡片和按钮之间的空隙 |
| `grid-template-columns` | 定义网格列宽 | 两栏的比例 |
| `@media` | 根据屏幕条件切换规则 | 小屏幕改成单栏 |

`flex` 和 `grid` 都是浏览器原生 CSS 能力，不是 Vue 特殊指令。实际开发中它们经常与 `scoped`、SCSS、Element Plus 一起使用。

### 完整程序：账户查询卡片、响应式布局与 :deep()

本例使用 Element Plus，需要在 `main.ts` 中注册组件库。

文件：`src/main.ts`

```ts
import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import App from './App.vue';

createApp(App).use(ElementPlus).mount('#app');
```

文件：`src/App.vue`

```vue
<script setup lang="ts">
import { computed, ref } from 'vue';

interface Account {
    id: number;
    name: string;
    active: boolean;
}

const keyword = ref('');
const accounts = ref<Account[]>([
    { id: 101, name: '储蓄账户', active: true },
    { id: 102, name: '工资账户', active: false },
    { id: 103, name: '理财账户', active: true }
]);

const filtered = computed(() =>
    accounts.value.filter(item => item.name.includes(keyword.value.trim()))
);

function clearKeyword(): void {
    keyword.value = '';
}
</script>

<template>
    <main class="account-page">
        <h2>账户维护</h2>

        <div class="account-grid">
            <section class="panel search-panel">
                <h3 class="panel__title">查询条件</h3>

                <el-input
                    v-model="keyword"
                    placeholder="请输入账户名称"
                    clearable
                />

                <div class="search-actions">
                    <el-button type="primary" @click="clearKeyword">
                        清空
                    </el-button>
                    <span>已匹配 {{ filtered.length }} 条</span>
                </div>
            </section>

            <section class="panel results-panel">
                <h3 class="panel__title">账户列表</h3>

                <ul>
                    <li v-for="account in filtered" :key="account.id">
                        <span>{{ account.name }}</span>
                        <strong>{{ account.active ? '正常' : '停用' }}</strong>
                    </li>
                </ul>
            </section>
        </div>
    </main>
</template>

<style scoped lang="scss">
// SCSS 变量：在构建时用于复用尺寸。
$space: 16px;
$border-color: #d9e1ea;

// Mixin：复用卡片边框和圆角规则。
@mixin business-panel {
    padding: $space;
    border: 1px solid $border-color;
    border-radius: 10px;
    background: #fff;
}

.account-page {
    max-width: 960px;
    margin: 24px auto;
    padding: $space;

    .account-grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1.5fr);
        gap: $space;
    }

    .panel {
        @include business-panel;

        // & 表示当前选择器，编译后是 .panel__title。
        &__title {
            margin: 0 0 $space;
            font-size: 18px;
        }
    }

    .search-actions {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: $space;
    }

    // 只修改当前查询面板内部的 Element Plus 输入框包装元素。
    .search-panel :deep(.el-input__wrapper) {
        border-radius: 12px;
    }

    .results-panel ul {
        padding-left: 18px;
    }

    .results-panel li {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        padding: 6px 0;
    }
}

// 小屏幕下从两列改为一列。
@media (max-width: 680px) {
    .account-page .account-grid {
        grid-template-columns: 1fr;
    }
}
</style>
```

运行 `npm run dev` 后：

1. 在输入框输入“账户”，右侧列表会随输入变化。这是 Vue `computed` 的结果，与 SCSS 无关。
2. 打开浏览器 Elements，找到 `.search-panel` 下的 `.el-input__wrapper`，观察其圆角样式。
3. 把浏览器窗口缩窄至 680px 以下，两栏会改为单栏。
4. 将 `:deep(.el-input__wrapper)` 改成普通 `.el-input__wrapper`，比较样式是否还能命中控件内部节点，再恢复。
5. 修改 `$space`，观察多个位置的内边距和间距一起变化。

**注意：** `:deep()` 的目标是组件库的内部 DOM。若升级 Element Plus 后内部结构变化，覆盖样式可能失效，因此应优先选择官方支持的 CSS 变量和组件 Props。

### 拓展：SCSS 文件模块化

如果多个组件需要复用相同样式，可以把变量和 Mixin 放到单独文件，再通过 Sass 的 `@use` 引入。下面是完整的两文件形式。

文件：`src/styles/_business.scss`

```scss
$gap: 16px;

@mixin card {
    border: 1px solid #d9e1ea;
    border-radius: 8px;
    padding: $gap;
}
```

文件：`src/App.vue`

```vue
<script setup lang="ts">
const title = '账户卡片';
</script>

<template>
    <section class="account-card">
        <h2>{{ title }}</h2>
        <p>这是通过 SCSS 模块复用样式的卡片。</p>
    </section>
</template>

<style scoped lang="scss">
@use './styles/business' as business;

.account-card {
    @include business.card;
    margin: business.$gap;
}
</style>
```

`@use '路径' as 名称` 引入 SCSS 模块；`@include business.card` 使用其中的 Mixin；`business.$gap` 读取模块中公开的变量。文件名前的下划线 `_business.scss` 表示 Sass 部分文件，导入时可以省略下划线和 `.scss` 扩展名。

> [!EXERCISE] :deep() 应写在哪个范围
>
> 只想修改“账户查询区”的 Element Plus 输入框圆角，为什么不建议在 scoped 样式中只写 `:deep(.el-input__wrapper)`？
>
> 【答案】
>
> 单独使用深度选择器会扩大当前组件内的匹配范围，可能影响本页其他输入框。更稳妥的是先用 `.search-panel` 限定业务区域，再写 `.search-panel :deep(.el-input__wrapper)`；如果组件提供公开的主题变量或样式属性，应优先使用官方接口。

## Vitest 与 Vue Test Utils：给业务修改建立自动化验证

### 单元测试、组件测试和端到端测试的区别

仅靠手动点击可以验证页面基本流程，但每次修改都重新走一遍全部业务步骤，容易遗漏边界和回归问题。自动化测试可以把已经确认的业务规则写成可重复执行的断言。

| 测试层次 | 测试对象 | 本日对应场景 |
| --- | --- | --- |
| 单元测试 | 独立函数的输入和输出 | 判断停用账户是否可删除、计算分页数 |
| 组件测试 | Vue 组件的 Props、渲染与事件 | 点击账户按钮是否发出正确 ID |
| 异步组件测试 | 组件与异步依赖的协作 | 请求成功、请求失败、loading 恢复 |
| E2E（端到端）测试 | 真实浏览器里的整条用户流程 | 打开页面、搜索账户、确认结果 |

**Vitest** 是常用于 Vite 项目的测试运行器；**Vue Test Utils（VTU）** 是 Vue 3 组件测试工具，提供 `mount()`、`trigger()` 等方法。两者配合使用：Vitest 运行测试并提供断言，Vue Test Utils 负责挂载和操作 Vue 组件。

### 安装与环境配置

在项目根目录执行：

```bash
npm install -D vitest @vue/test-utils jsdom
```

- `vitest`：执行测试；
- `@vue/test-utils`：挂载和操作 Vue 组件；
- `jsdom`：在 Node.js 测试进程中模拟浏览器 DOM 环境。

Vitest 默认环境偏向 Node.js，单纯测试普通 TypeScript 工具函数时不需要 DOM；测试 Vue 组件时需要适合的 DOM 环境，例如 `jsdom`。

本日创建单独的测试配置文件，避免与原有 Vite 开发配置直接混用。**注意：独立 `vitest.config.ts` 会覆盖 Vitest 对 `vite.config.ts` 的默认读取，所以必须把测试需要的 Vue 插件再次写进测试配置。**

文件：项目根目录 `vitest.config.ts`

```ts
import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
    // 测试 .vue 单文件组件时仍然需要 Vue 插件。
    plugins: [vue()],

    test: {
        // jsdom 提供 document、window 等 DOM 能力。
        environment: 'jsdom',

        // 把测试限制在 src 中，避免把 E2E 脚本当成 Vitest 测试。
        include: ['src/**/*.test.ts']
    }
});
```

在已有 `package.json` 的 `scripts` 中合并：

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- `vitest run`：运行测试一次后退出，适合提交前验证和 CI；
- `vitest`：启动监听模式，文件变化时重新执行有关测试。

如果团队项目已经有 Vitest 配置，应该先检查测试目录、测试环境与 Vue 插件，避免新建同名配置覆盖既有规则。

### describe、it、expect：怎样表达业务规则

Vitest 中最常见的三个函数：

```ts
describe('账户删除规则', () => {
    it('停用账户允许删除', () => {
        expect(true).toBe(true);
    });
});
```

- `describe('名称', callback)`：把相关测试组织为一组；
- `it('行为描述', callback)`：定义一个可独立执行的测试用例；
- `expect(actual)`：创建针对实际值的断言；
- `.toBe(expected)`：使用类似 `Object.is` 的严格值比较；
- `.toEqual(expected)`：比较对象、数组等结构是否具有预期内容。

测试用例应该写出明确的业务输入和预期输出，而不是只写“函数能执行”。

### 完整程序：账户删除规则与分页工具的单元测试

文件：`src/utils/accountRules.ts`

```ts
export interface Account {
    id: number;
    active: boolean;
}

// 业务规则：只有停用账户允许删除。
export function canDelete(account: Account): boolean {
    return account.active === false;
}

// 计算总页数，空列表时仍返回 1，方便页面管理页码。
export function getPageCount(total: number, pageSize: number): number {
    if (!Number.isInteger(total) || total < 0) {
        throw new Error('总条数必须为非负整数');
    }

    if (!Number.isInteger(pageSize) || pageSize <= 0) {
        throw new Error('每页条数必须为正整数');
    }

    return Math.max(1, Math.ceil(total / pageSize));
}
```

文件：`src/utils/accountRules.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { canDelete, getPageCount } from './accountRules';

describe('账户删除规则', () => {
    it('停用账户允许删除', () => {
        expect(canDelete({ id: 101, active: false })).toBe(true);
    });

    it('启用账户不允许删除', () => {
        expect(canDelete({ id: 102, active: true })).toBe(false);
    });
});

describe('分页规则', () => {
    it('五条记录，每页两条，共三页', () => {
        expect(getPageCount(5, 2)).toBe(3);
    });

    it('空数据仍以第一页作为有效页码', () => {
        expect(getPageCount(0, 2)).toBe(1);
    });

    it('每页条数为零时拒绝计算', () => {
        expect(() => getPageCount(5, 0)).toThrow('每页条数必须为正整数');
    });
});
```

为了同时在浏览器里观察函数的结果，可以使用这个完整页面。文件：`src/App.vue`

```vue
<script setup lang="ts">
import { computed, ref } from 'vue';
import { canDelete, getPageCount } from './utils/accountRules';

const accounts = ref([
    { id: 101, active: true },
    { id: 102, active: false },
    { id: 103, active: false }
]);

const pageCount = computed(() => getPageCount(accounts.value.length, 2));

function remove(id: number): void {
    const account = accounts.value.find(item => item.id === id);
    if (!account || !canDelete(account)) return;

    accounts.value = accounts.value.filter(item => item.id !== id);
}
</script>

<template>
    <h2>账户删除业务规则</h2>
    <p>总页数：{{ pageCount }}</p>
    <ul>
        <li v-for="account in accounts" :key="account.id">
            账户 {{ account.id }}：{{ account.active ? '启用' : '停用' }}
            <button :disabled="!canDelete(account)" @click="remove(account.id)">
                删除
            </button>
        </li>
    </ul>
</template>
```

在根目录运行：

```bash
npm run test
```

应执行五条测试并全部通过。再故意把业务规则改成 `return account.active === true`，重新执行测试，就会出现针对启用/停用规则的失败报告。测试失败表明**当前实现与已写出的预期不一致**，不代表测试自动知道真实业务规则；前提是断言本身来自已确认的需求。

### mount、trigger、emitted：测试 Props 和 Emit

第三天已经学过父组件通过 Props 传数据，子组件通过 Emit 通知操作。组件测试可以直接检查这份通信协议，而不必每次打开浏览器手工点击。

Vue Test Utils 的常用方法：

| API | 参数或返回结果 | 作用 |
| --- | --- | --- |
| `mount(Component, options)` | 组件定义、可选的 Props 等配置 | 创建可测试的组件实例 |
| `wrapper.get(selector)` | CSS 选择器 | 查找元素；找不到时抛出错误 |
| `wrapper.find(selector)` | CSS 选择器 | 查找元素；可通过 `exists()` 判断是否存在 |
| `wrapper.text()` | 无参数 | 读取渲染后的文本 |
| `wrapper.attributes(name)` | 属性名称 | 读取 DOM 属性 |
| `wrapper.trigger('click')` | DOM 事件名称 | 模拟向元素触发事件，并等待一轮组件更新 |
| `wrapper.emitted('select')` | 自定义事件名称 | 读取组件发出的事件及参数 |

这里的 `trigger()` 是测试环境向 DOM 元素触发事件，不等于真实用户通过鼠标完成所有浏览器交互细节。组件通信测试和真实浏览器 E2E 测试解决的是不同层次的问题。

### 完整程序：账户按钮组件与事件测试

文件：`src/components/AccountAction.vue`

```vue
<script setup lang="ts">
const props = defineProps<{
    id: number;
    name: string;
    active: boolean;
}>();

const emit = defineEmits<{
    (event: 'select', id: number): void;
    (event: 'remove', id: number): void;
}>();
</script>

<template>
    <section>
        <p>{{ props.name }}</p>
        <button data-testid="select" @click="emit('select', props.id)">
            选择
        </button>
        <button
            data-testid="remove"
            :disabled="props.active"
            @click="emit('remove', props.id)"
        >
            删除
        </button>
    </section>
</template>
```

文件：`src/components/AccountAction.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import AccountAction from './AccountAction.vue';

describe('AccountAction', () => {
    it('按照 Props 展示账户名称', () => {
        const wrapper = mount(AccountAction, {
            props: { id: 101, name: '储蓄账户', active: true }
        });

        expect(wrapper.text()).toContain('储蓄账户');
    });

    it('点击选择后发出 select 事件和数字 ID', async () => {
        const wrapper = mount(AccountAction, {
            props: { id: 101, name: '储蓄账户', active: false }
        });

        await wrapper.get('[data-testid="select"]').trigger('click');

        // emitted 返回每次触发事件时传递的参数数组。
        expect(wrapper.emitted('select')).toEqual([[101]]);
    });

    it('启用账户的删除按钮被禁用', () => {
        const wrapper = mount(AccountAction, {
            props: { id: 101, name: '储蓄账户', active: true }
        });

        expect(wrapper.get('[data-testid="remove"]').attributes('disabled'))
            .toBeDefined();
    });

    it('停用账户点击删除时带上正确 ID', async () => {
        const wrapper = mount(AccountAction, {
            props: { id: 102, name: '工资账户', active: false }
        });

        await wrapper.get('[data-testid="remove"]').trigger('click');
        expect(wrapper.emitted('remove')).toEqual([[102]]);
    });
});
```

文件：`src/App.vue`

```vue
<script setup lang="ts">
import { ref } from 'vue';
import AccountAction from './components/AccountAction.vue';

const selectedId = ref<number | null>(null);
const rows = ref([
    { id: 101, name: '储蓄账户', active: true },
    { id: 102, name: '工资账户', active: false }
]);

function select(id: number): void {
    selectedId.value = id;
}

function remove(id: number): void {
    rows.value = rows.value.filter(item => item.id !== id);
}
</script>

<template>
    <h2>组件事件与测试</h2>
    <AccountAction
        v-for="account in rows"
        :key="account.id"
        :id="account.id"
        :name="account.name"
        :active="account.active"
        @select="select"
        @remove="remove"
    />
    <p>当前选择：{{ selectedId ?? '无' }}</p>
</template>
```

运行 `npm run test`，同时也可以执行 `npm run dev` 手动点击组件。自动化测试验证组件自己的 Props、按钮属性和 Emit；浏览器手动验证父组件是否正确处理事件并更新列表。

> [!NOTE] data-testid 为什么要用
>
> `data-testid` 是普通 HTML 自定义属性，不是 Vue 内置指令。测试中用它选择元素，可以避免 CSS 类名或按钮位置变化造成测试误命中。但它也不应替代对实际用户可见行为的验证；真实浏览器测试可优先使用按钮名称、标签等用户视角的定位方式。

### vi.fn()、mockResolvedValue 和 flushPromises：测试异步组件

组件通常会调用 API，但单元测试不应每次都依赖真实银行测试环境。可以通过函数 Prop 注入一个**可控制的异步函数**，再使用 Vitest 的 Mock Function 记录调用并决定成功或失败结果。

- `vi.fn(implementation)`：创建一个可记录调用的模拟函数；
- `mockResolvedValue(value)`：让模拟函数调用时返回成功结果为 `value` 的 Promise；
- `mockRejectedValue(reason)`：让模拟函数调用时返回失败原因为 `reason` 的 Promise；
- `toHaveBeenCalledWith(...)`：断言函数接收到了指定参数；
- `toHaveBeenCalledTimes(n)`：断言函数被调用的次数；
- `flushPromises()`：等待测试环境中已经排队的 Promise 任务完成，常用于等待异步组件把结果写回响应式状态。

**不要仅用 `await wrapper.trigger('click')` 就假定接口 Promise 也已经完成。** `trigger()` 主要等待 Vue 的下一轮 DOM 更新；如果事件函数内部 `await` 另一个 Promise，还需要根据测试场景进一步等待。

### 完整程序：同时测试查询成功和查询失败

文件：`src/components/AccountLookup.vue`

```vue
<script setup lang="ts">
import { ref } from 'vue';

// 把实际 API 函数作为 Prop 传入，方便测试替换其行为。
const props = defineProps<{
    accountId: number;
    fetchAccount: (id: number) => Promise<string>;
}>();

const accountName = ref('');
const errorMessage = ref('');
const loading = ref(false);

async function search(): Promise<void> {
    if (loading.value) return;

    loading.value = true;
    errorMessage.value = '';

    try {
        accountName.value = await props.fetchAccount(props.accountId);
    } catch (error) {
        errorMessage.value =
            error instanceof Error ? error.message : '未知错误';
    } finally {
        loading.value = false;
    }
}
</script>

<template>
    <section>
        <button :disabled="loading" @click="search">
            {{ loading ? '查询中' : '查询账户' }}
        </button>
        <p v-if="errorMessage" role="alert">{{ errorMessage }}</p>
        <p v-else>账户名称：{{ accountName || '尚未查询' }}</p>
    </section>
</template>
```

文件：`src/components/AccountLookup.test.ts`

```ts
import { describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import AccountLookup from './AccountLookup.vue';

describe('AccountLookup', () => {
    it('成功时展示返回名称，并传递正确 ID', async () => {
        // 准备一个模拟 API，并指定这次调用返回的成功结果。
        const fetchAccount = vi.fn(async (_id: number): Promise<string> => '');
        fetchAccount.mockResolvedValue('账户 101');

        const wrapper = mount(AccountLookup, {
            props: { accountId: 101, fetchAccount }
        });

        await wrapper.get('button').trigger('click');
        await flushPromises();

        expect(fetchAccount).toHaveBeenCalledWith(101);
        expect(fetchAccount).toHaveBeenCalledTimes(1);
        expect(wrapper.text()).toContain('账户 101');
    });

    it('失败时展示错误，且按钮恢复可用', async () => {
        const fetchAccount = vi.fn(async (_id: number): Promise<string> => '');
        fetchAccount.mockRejectedValue(new Error('模拟网络异常'));

        const wrapper = mount(AccountLookup, {
            props: { accountId: 102, fetchAccount }
        });

        await wrapper.get('button').trigger('click');
        await flushPromises();

        expect(wrapper.get('[role="alert"]').text()).toBe('模拟网络异常');
        expect(wrapper.get('button').attributes('disabled')).toBeUndefined();
    });
});
```

文件：`src/App.vue`

```vue
<script setup lang="ts">
import AccountLookup from './components/AccountLookup.vue';

// 本地教学函数：延迟 200 毫秒返回名称，不发送 HTTP。
async function fetchAccount(id: number): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return id === 101 ? '储蓄账户' : '其他账户';
}
</script>

<template>
    <h2>账户异步查询</h2>
    <AccountLookup :account-id="101" :fetch-account="fetchAccount" />
</template>
```

这套程序可以在浏览器直接运行。测试则通过 `vi.fn()` 替换 API 函数，实现**不依赖网络的成功与失败分支测试**。浏览器中的示例函数虽然异步，但使用的是 `setTimeout`，不会出现在 Network 的 Fetch/XHR 记录中。

如果实际项目通过 `import` 固定调用 API 模块，也可以使用 Vitest 的 `vi.mock()` 模拟模块依赖，但需要遵循其模块提升与清理规则。本日先掌握**显式依赖注入 + `vi.fn()`** 的方法，较容易追踪参数和返回结果。

### 测试不应该掩盖真正的业务边界

以上测试能够验证：

- 传入哪个账户 ID；
- 子组件如何处理 API 成功和失败；
- loading 是否在失败后恢复；
- 按钮是否发出正确事件。

但它们不能自动证明：真实后端有权限、认证合法、请求报文正确、转账没有重复提交。完整联调仍要结合接口文档、Network、后端日志和业务测试。

> [!EXERCISE] 为什么需要等待异步完成
>
> 一个组件的点击函数中先 `await fetchAccount()`，再设置 `accountName`。测试只写 `await wrapper.trigger('click')` 就断言名称，为什么可能失败？
>
> 【答案】
>
> `trigger()` 主要等待 Vue 的视图更新，不保证另一个尚未完成的异步 Promise 已经取得结果。应根据实际请求和测试工具等待 Promise，例如在此测试里追加 `await flushPromises()`，再断言最终页面文本。若存在真正的定时延迟或不可控网络，仍应采用可控制的 Mock 或等待策略。

## 构建、预览与提交前质量检查

### `npm run dev` 和生产构建不是同一个过程

开发服务器的目标是快速调试，生产构建的目标是生成浏览器最终加载的静态资源。这两个阶段不能混为一谈。

| 命令 | 主要用途 | 是否用于生产环境直接对外提供服务 |
| --- | --- | --- |
| `npm run dev` | 启动 Vite 开发服务器，提供热更新 | 否 |
| `npm run typecheck` | 执行 Vue/TS 静态类型检查 | 不启动服务器 |
| `npm run lint` | 检查代码规范 | 不启动服务器 |
| `npm run test` | 运行自动化测试 | 不启动服务器 |
| `npm run build` | 生成生产构建资源 | 生成文件，不是正式 Web 服务器 |
| `npm run preview` | 本地查看已经构建的文件 | 仅用于预览，不应当作生产服务器 |

Vite 的默认输出目录是项目根目录下的 `dist/`。正式部署时，静态文件通常由 Web 服务器、网关或静态资源平台对外提供；API 请求则按实际部署架构由网关或后端处理。

### 完整程序：构建一个可独立预览的页面

文件：`src/App.vue`

```vue
<script setup lang="ts">
import { ref } from 'vue';

const result = ref('尚未检查');

function check(): void {
    result.value = '前端页面可以正常执行';
}
</script>

<template>
    <main class="page">
        <h2>账户维护构建验收</h2>
        <button @click="check">检查页面事件</button>
        <p>{{ result }}</p>
    </main>
</template>

<style scoped>
.page {
    max-width: 640px;
    margin: 40px auto;
    padding: 20px;
}
</style>
```

文件：`src/main.ts`

```ts
import { createApp } from 'vue';
import App from './App.vue';

createApp(App).mount('#app');
```

文件：`vite.config.ts`

```ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
    plugins: [vue()],

    // 当页面部署在网站根路径时使用 /。
    base: '/',

    build: {
        outDir: 'dist'
    }
});
```

文件：`index.html`（项目根目录）

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>账户维护构建验收</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

在已有 `package.json` 的 `scripts` 中确认存在以下命令；若没有，再合并添加：

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

执行：

```bash
npm run build
npm run preview
```

Vite 默认生成 `dist/` 目录。`preview` 默认通常在 `http://localhost:4173/` 启动预览服务；准确端口以终端信息为准。打开页面，点击按钮，确认出现“前端页面可以正常执行”。

**注意：** 此处 `vite.config.ts` 是独立构建实验。真实项目若已经配置路由、路径别名、代理和其他插件，不要直接覆盖；应在原配置上核对所需字段。

### `base`：部署在子目录时为什么静态资源会 404

假设系统部署地址为：

```text
https://example.com/netbank/
```

而不是网站根目录。那么 Vite 构建时就应该按实际资源访问前缀设置：

```ts
export default defineConfig({
    plugins: [vue()],
    base: '/netbank/'
});
```

`base` 是部署时资源的公共基路径。配置后，Vite 会按该前缀调整构建产物中的静态资源引用。不同部署模式或 Web 服务器还可能需要对应的路由回退与代理规则。

如果只看到首页 HTML 正常，但 JS、CSS 文件 404，应先检查构建产物的资源路径和部署子目录，不要立即修改 Vue 组件。

如果项目使用 Vue Router 的 History 模式，还要在正式服务器上配置对应的页面回退规则。Hash 模式与 History 模式的服务器要求不同，第三天已经解释过，不需要在此重复配置一整套 Router。

### 提交前的推荐检查顺序

可以把质量检查固定为下面的顺序：

```text
TypeScript 类型检查
    ↓
ESLint 规则检查
    ↓
Prettier 排版检查
    ↓
Vitest 单元与组件测试
    ↓
Vite 生产构建
    ↓
本地预览与关键页面冒烟检查
```

在已有 `package.json` 的 `scripts` 中合并：

```json
{
  "scripts": {
    "typecheck": "vue-tsc --noEmit -p tsconfig.app.json",
    "lint": "eslint \"src/**/*.{ts,vue}\"",
    "format:check": "prettier --check src",
    "test": "vitest run",
    "build": "vite build",
    "preview": "vite preview",
    "quality": "npm run typecheck && npm run lint && npm run format:check && npm run test && npm run build"
  }
}
```

运行：

```bash
npm run quality
```

`&&` 表示上一条命令成功后才继续执行下一条。它不会神奇地修复错误；某一步失败后，应根据输出定位文件和原因，再单独复查该步骤。

如果项目只有 `tsconfig.json` 而没有 `tsconfig.app.json`，需要相应调整 `typecheck` 的 `-p` 参数。**本节的 scripts 是合并片段，不是完整 package.json；安装的依赖仍由原有项目的 `package.json` 管理。**

### 质量检查通过仍不等于业务验收通过

假设页面把冻结账户错误显示成“正常”，但类型、代码风格和单元测试没有覆盖这条规则，那么全部自动检查依然可能通过。开发交付时，还应根据需求验证成功、失败、边界条件和真实接口的关键路径。

> [!EXERCISE] 构建后页面白屏，如何判断优先原因
>
> `npm run build` 成功，本地开发环境也正常，但部署到 `/netbank/` 后页面白屏，Network 里的 JS/CSS 资源返回 404。应该优先检查什么？
>
> 【答案】
>
> 优先检查 Vite 的 `base` 配置、构建产物中生成的静态资源地址和服务器的部署目录映射。如果使用 History 路由，还要检查服务器的回退规则。问题出现在资源请求层，不应首先修改业务组件的 `ref` 或 `computed`。

## 拓展：Git 团队协作与差异检查

### 为什么需要先看差异再提交

企业开发通常在同一仓库里协作。一个小需求往往只应该修改少量页面、API、类型、配置或测试文件。提交前如果不检查差异，可能把调试日志、无关格式化、个人环境变量、构建文件或临时数据一起提交。

下面以已有 Git 仓库为前提。命令只作为学习和使用说明，**不要在不了解当前分支和团队规定时直接对真实项目执行覆盖、重置或强制推送操作。**

### 常见命令与含义

| 命令 | 作用 | 需要注意 |
| --- | --- | --- |
| `git status` | 查看工作区和暂存区状态 | 提交前先执行 |
| `git branch --show-current` | 查看当前分支名称 | 防止在错误分支修改 |
| `git switch -c feature/account-remark` | 创建并切换新分支 | 分支命名遵循团队约定 |
| `git diff` | 查看尚未暂存的修改 | 检查是否夹带无关修改 |
| `git diff --check` | 检查差异中的空白等格式问题 | 不等于运行 Prettier |
| `git add src/types/account.ts` | 只暂存指定文件 | 比直接 `git add .` 更可控 |
| `git diff --cached` | 查看已经暂存、准备提交的内容 | 提交前重点检查 |
| `git commit -m "feat: add account remark"` | 为当前暂存内容创建提交 | 要先确认提交范围 |
| `git fetch` | 更新远端分支引用 | 不会自动合并到当前工作区 |
| `git push -u origin feature/account-remark` | 推送新分支 | 远端名称和权限以仓库为准 |

### 完整操作示例：新增账户备注字段

假设你已在正确的 Git 仓库中，且当前工作区干净，团队允许以功能分支开发。可以按下面顺序操作：

```bash
# 确认当前位置与工作区状态。
git status
git branch --show-current

# 创建并切换到专门处理需求的分支。
git switch -c feature/account-remark

# 修改类型、页面、API 和对应测试后，先查看差异。
git diff
git diff --check

# 单独暂存本次需求涉及的文件。
git add src/types/account.ts
git add src/App.vue
git add src/api/accounts.ts

# 查看即将提交的实际内容。
git diff --cached

# 只在检查、验证通过后创建提交。
git commit -m "feat: add account remark"

# 如果团队采用远端功能分支协作，再按仓库规定推送。
git push -u origin feature/account-remark
```

本段是**操作流程示例**，不是可在任意仓库无条件逐行运行的脚本。如果对应文件不存在、工作区未清理、分支已存在或团队要求先从指定开发分支切出，应先处理相应前提。

提交前还要确认 `.env.local`、证书、口令、访问令牌、真实客户数据等不在提交范围。`.gitignore` 可以减少误加入文件，但已经被 Git 跟踪的敏感文件不会因为后来加入忽略规则就自动消失。

### 发现合并冲突时应该做什么

出现冲突后，应先理解双方对同一段业务逻辑的修改，结合需求和接口协议保留正确内容，再运行类型检查、测试和构建。不要简单选择“全部接受当前版本”或“全部接受对方版本”来让冲突标记消失。

对于不熟悉的仓库历史，避免随意执行 `git reset --hard`、`git push --force` 等可能丢弃修改或覆盖他人历史的命令。企业协作的目标是保留可追溯、可审查的变更。

## 拓展：Playwright 浏览器端到端测试

### E2E 为什么不是组件测试的重复

Vitest + Vue Test Utils 能够在模拟 DOM 中测试组件及其逻辑，但不能完整覆盖真实浏览器中的页面导航、焦点行为、网络加载、构建后资源路径等问题。

Playwright 通过真实浏览器运行测试，适合对关键用户操作进行端到端验证，例如：

- 打开业务页面；
- 输入账户姓名；
- 点击查询；
- 检查页面结果；
- 判断异常提示是否出现。

本节是扩展内容。浏览器测试成本比普通单元测试更高，应该优先覆盖关键业务流程，而不是把所有内部函数都改写成 E2E 测试。

### 安装与运行准备

在项目根目录执行：

```bash
npm install -D @playwright/test
npx playwright install chromium
```

`@playwright/test` 是测试运行器；`playwright install chromium` 安装此示例需要的 Chromium 浏览器运行文件。在企业内网或受控设备中，安装浏览器可能受网络和软件策略限制，应该按团队环境要求操作。

### 完整程序：浏览器中查询账户

文件：`src/App.vue`

```vue
<script setup lang="ts">
import { computed, ref } from 'vue';

const keyword = ref('');
const applied = ref('');
const accounts = [
    { id: 101, name: '储蓄账户' },
    { id: 102, name: '工资账户' }
];

const results = computed(() =>
    accounts.filter(item => item.name.includes(applied.value))
);

function search(): void {
    applied.value = keyword.value.trim();
}
</script>

<template>
    <h2>账户搜索 E2E</h2>

    <label for="account-keyword">账户名称</label>
    <input id="account-keyword" v-model="keyword" />
    <button @click="search">查询账户</button>

    <ul>
        <li v-for="account in results" :key="account.id">
            {{ account.name }}
        </li>
    </ul>
</template>
```

文件：`src/main.ts`

```ts
import { createApp } from 'vue';
import App from './App.vue';

createApp(App).mount('#app');
```

文件：项目根目录 `playwright.config.ts`

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './e2e',

    // 本例仅使用已安装的 Chromium 浏览器。
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],

    use: {
        baseURL: 'http://127.0.0.1:5173'
    },

    // 执行测试前启动本地 Vite 服务。
    webServer: {
        command: 'npm run dev -- --host 127.0.0.1 --port 5173 --strictPort',
        url: 'http://127.0.0.1:5173',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000
    }
});
```

文件：`e2e/account-search.spec.ts`

```ts
import { expect, test } from '@playwright/test';

test('按账户名称查询，仅显示匹配记录', async ({ page }) => {
    // baseURL 会与相对地址组合。
    await page.goto('/');

    // 根据关联的 label 定位输入框。
    await page.getByLabel('账户名称').fill('工资');

    // 根据用户看到的按钮名称点击。
    await page.getByRole('button', { name: '查询账户' }).click();

    // 等待页面显示符合预期的结果。
    await expect(page.getByText('工资账户')).toBeVisible();
    await expect(page.getByText('储蓄账户')).toHaveCount(0);
});
```

如果现有 `vite.config.ts` 把端口固定为其他值，应按实际端口同步修改 `playwright.config.ts`；上述例子通过命令行参数显式指定 5173，并使用 `--strictPort` 避免静默换用其他端口。

运行：

```bash
npx playwright test
```

测试启动时，Playwright 的 `webServer` 可以按配置启动 Vite，然后在 Chromium 中打开页面并执行操作。若系统缺少浏览器依赖、端口冲突或浏览器安装被阻止，需先解决环境问题，不能只根据测试启动失败判断 Vue 代码有问题。

此处的数据是页面中的静态数组，没有后端依赖。真实企业项目的 E2E 测试需要确定测试账户、测试环境、数据清理和隔离策略，**不应对生产账户执行具有真实资金或业务后果的测试操作**。

### 常用 Playwright API 对照

| API | 参数或用途 | 说明 |
| --- | --- | --- |
| `page.goto('/')` | 浏览器打开地址 | 可结合 `baseURL` 使用 |
| `page.getByLabel('账户名称')` | 按可访问名称定位表单控件 | 需要正确的 label 关联 |
| `locator.fill('工资')` | 输入文本 | 会替换输入框当前值 |
| `page.getByRole('button', { name: '查询账户' })` | 按角色与名称定位按钮 | 比依赖 CSS 类名更贴近用户操作 |
| `locator.click()` | 点击元素 | 会执行真实浏览器中的点击流程 |
| `expect(locator).toBeVisible()` | 断言元素可见 | 等待满足条件或直到超时 |
| `expect(locator).toHaveCount(0)` | 断言没有匹配元素 | 用于验证旧结果被过滤 |

## 拓展：阅读企业自定义组件与声明文件

### 为什么项目中的 EsXxx 组件不一定属于 Element Plus

企业项目可能封装了一套自己的业务组件库，例如：

```vue
<EsStatusBadge :status="status" />
```

像 `EsStatusBadge` 这样带有团队前缀的组件通常来自项目自己的组件包或公司框架，具体 API 必须以实际源代码和类型声明为准。**名字像 Element Plus，不代表它就是 Element Plus 组件。**

如果只能找到 `.d.ts` 声明文件，可以先据此判断 Props、事件和公开方法，但还应继续查找组件实现及使用示例，才能确定运行行为。

### 看到 DefineComponent 和 ExtractPropTypes 如何理解

例如类型声明里出现：

```ts
declare const _default: import('vue').DefineComponent<
    import('vue').ExtractPropTypes<{
        status: {
            type: StringConstructor;
            required: true;
        };
    }>
>;
```

不需要背整个泛型结构。抓住两件事：

- `DefineComponent<...>`：这是 Vue 组件的类型描述；
- `ExtractPropTypes<...>`：Vue/TypeScript 从 Props 定义中推导对应的属性类型。

可以看出此组件需要一个字符串类型的 `status`，但仅凭这段声明，还不能确定组件如何展示它、点击后发生什么、是否发出自定义事件。

### 完整程序：自己封装一个状态标签组件

文件：`src/components/EsStatusBadge.vue`

```vue
<script setup lang="ts">
import { computed } from 'vue';

defineOptions({ name: 'EsStatusBadge' });

const props = defineProps<{
    status: 'normal' | 'frozen';
    clickable?: boolean;
}>();

const emit = defineEmits<{
    (event: 'inspect', status: 'normal' | 'frozen'): void;
}>();

const label = computed(() =>
    props.status === 'normal' ? '正常' : '冻结'
);

function inspect(): void {
    if (!props.clickable) return;
    emit('inspect', props.status);
}
</script>

<template>
    <button
        type="button"
        :disabled="!props.clickable"
        @click="inspect"
    >
        <slot name="prefix">账户状态：</slot>
        {{ label }}
    </button>
</template>
```

文件：`src/App.vue`

```vue
<script setup lang="ts">
import { ref } from 'vue';
import EsStatusBadge from './components/EsStatusBadge.vue';

const currentStatus = ref<'normal' | 'frozen'>('normal');
const message = ref('尚未查看');

function handleInspect(status: 'normal' | 'frozen'): void {
    message.value = status === 'normal' ? '当前账户正常' : '当前账户冻结';
}
</script>

<template>
    <h2>自定义业务组件</h2>

    <EsStatusBadge
        :status="currentStatus"
        :clickable="true"
        @inspect="handleInspect"
    >
        <template #prefix>账户状态：</template>
    </EsStatusBadge>

    <button @click="currentStatus = 'frozen'">模拟冻结</button>
    <p>{{ message }}</p>
</template>
```

这个程序把第三天学习的 Props、Emit、插槽与补充第一天学习的 `defineOptions()` 组合在一个组件中。阅读现有企业项目时，建议按下面顺序定位：

1. 找到组件在哪里导入或全局注册；
2. 找到实际实现或类型声明；
3. 先列出 Props，区分必填和可选、默认值和类型；
4. 找到 Emit 事件名称与参数；
5. 查看具名插槽，以及父组件实际传入的内容；
6. 如果父组件通过 `ref` 调用了子组件方法，再检查 `defineExpose()`；
7. 最后顺着内部代码追踪它是否调用 API、Store 或其他框架组件。

如果组件来源是发布到 `node_modules` 的外部包，要优先查找版本对应的文档、类型定义和源代码，**不要直接在安装目录里修改第三方文件作为正式修复方案**。

> [!EXERCISE] 看到自定义组件声明的第一步
>
> 页面中使用 `<EsStatusBadge :status="accountStatus" />`。编辑器打开它的声明后，只看到 `DefineComponent<ExtractPropTypes<...>>`，应该怎样继续理解它？
>
> 【答案】
>
> 先找到 Props 定义中 `status` 的类型、是否必填，再查看是否存在事件和插槽约定。随后尽可能查找真实组件实现与项目中的调用示例。编译后的类型声明只能说明公开类型的一部分，不能单凭它推断内部业务处理。

## 企业项目的交付检查清单

完成一个需求后，不要只根据“页面没有报错”判断完成。可以用下面的表格做一次自查。

| 检查范围 | 具体内容 | 推荐验证方式 |
| --- | --- | --- |
| 需求范围 | 只修改本需求涉及的页面、类型和接口 | 对照需求说明、查看 Git 差异 |
| 组件数据 | Props、Emit、Store 是否传入正确值 | Vue DevTools、组件测试 |
| 类型约定 | 参数与响应字段是否符合声明 | `vue-tsc`、接口文档 |
| 代码规则 | 是否有未使用变量或 Vue 不推荐写法 | ESLint |
| 排版规范 | 是否符合仓库现有格式 | Prettier `--check` |
| 样式范围 | 是否误改了其他业务区域 | 浏览器 Elements、不同尺寸验证 |
| 业务逻辑 | 正常、异常和边界场景是否符合需求 | 单元测试、手工验证 |
| 组件协议 | 按钮是否发送正确事件，禁用状态是否正确 | Vue Test Utils |
| 异步状态 | 成功失败后 loading 是否恢复 | Mock 异步组件测试 |
| 接口联调 | 参数、状态码、响应体与业务码是否符合协议 | Network、后端日志 |
| 构建产物 | 类型检查、测试、构建能否通过 | `npm run quality` |
| 部署路径 | 静态资源前缀和路由回退是否正确 | `preview`、测试环境部署 |
| 提交范围 | 无日志、凭据、无关格式化和临时文件 | `git diff`、`git diff --cached` |

## 当日练习与参考答案

> [!EXERCISE] 练习：辨别检查工具
>
> 某个 Vue 页面在浏览器中能够运行，但父组件给一个数字 Prop 传入字符串；另一个开发者修改文件后把整个页面缩进成了不同风格。分别应该使用什么工具优先定位？
>
> 【答案】
>
> 数字 Prop 接收字符串的静态类型问题由 `vue-tsc` 检查；代码排版交给 Prettier。ESLint 可以进一步检查未使用变量和 Vue 规范，但不应把这三种工具视为可以互相替代。

> [!EXERCISE] 练习：判断类型工具的适用范围
>
> `Account` 包含 `id`、`name`、`active`、`balance`，新增接口只允许提交 `name` 和 `active`。如何构造静态类型？这个类型能否保证后端不会收到非法字段？
>
> 【答案】
>
> 可以写成 `type CreateAccount = Pick<Account, 'name' | 'active'>`。它主要限制 TypeScript 开发阶段的使用方式，不能替代服务器对实际请求报文的校验和权限检查。

> [!EXERCISE] 练习：为什么 scoped CSS 没有覆盖输入框
>
> 在 `<style scoped>` 中写了 `.el-input__wrapper { ... }`，但 Element Plus 输入框没有变化。应该怎么排查？
>
> 【答案】
>
> 先用浏览器 Elements 确认真实 DOM 和类名，再检查 `scoped` 的作用域边界。确实需要命中子组件内部元素时，在限定业务容器的前提下使用 `.search-panel :deep(.el-input__wrapper)`；若有组件库公开的主题配置，应优先使用官方方式。

> [!EXERCISE] 练习：测试一个组件事件
>
> 子组件点击“选择”时应该发出 `select` 事件并携带账户 ID 101。请写出核心组件测试断言。
>
> 【答案】
>
> ```ts
> const wrapper = mount(AccountAction, {
>     props: { id: 101, name: '储蓄账户', active: false }
> });
>
> await wrapper.get('[data-testid="select"]').trigger('click');
> expect(wrapper.emitted('select')).toEqual([[101]]);
> ```
>
> `emitted('select')` 读取子组件实际发出的事件及参数。它不会直接证明父组件已经调用接口，因此仍需由父组件测试或联调覆盖后续流程。

> [!EXERCISE] 练习：测试异步请求失败
>
> 组件在点击按钮后调用异步函数，成功后显示名称，失败后显示错误。你希望测试接口失败而不调用真实服务，应该怎么做？
>
> 【答案】
>
> 用 `vi.fn()` 创建可控制的模拟异步函数，让它拒绝 Promise，并作为组件依赖传入。点击按钮后使用 `flushPromises()` 等待 Promise 完成，再断言错误提示出现，以及 `loading` 控制的按钮恢复可用。完整代码见“测试异步组件”一节。

> [!EXERCISE] 练习：构建通过仍然不能发布
>
> `npm run build` 成功，能否直接认定本次账户维护需求已经通过验收？
>
> 【答案】
>
> 不能。构建成功主要说明资源可以完成构建，不保证类型检查、业务规则、接口权限和异常流程全部正确。还需要执行项目约定的类型检查、静态规则、测试，以及需求指定的接口和业务场景验证。

> [!EXERCISE] 练习：提交前发现大量无关格式改动
>
> 一个需求只修改了账户备注，但 `git diff` 显示几十个无关文件的缩进也发生变化。应该怎样处理？
>
> 【答案】
>
> 先核对这些变更是否由格式化整个项目造成。如果与需求无关，应按团队规范保留或撤销无关修改，并只暂存此次需求涉及的文件。提交前用 `git diff --cached` 再次确认范围，不应在不理解变更影响的情况下将无关文件全部提交。

## 十天学习结束后的能力边界

完成五天基础课程与五天补充课程后，应当能够把以下工作串成一个完整流程：

```text
阅读现有项目
    ↓
定位页面、组件、路由和接口
    ↓
根据需求确定修改范围
    ↓
修改 TypeScript 类型、页面和相关组件
    ↓
通过 Vue DevTools / Network / 断点定位问题
    ↓
编写或补充业务规则与组件测试
    ↓
执行 ESLint、Prettier、vue-tsc 和构建
    ↓
按正常、异常及边界场景验收
    ↓
审查 Git 差异并按团队流程提交
```

这意味着你已经具备阅读 Vue 3 企业项目、完成常见页面改动和参加前后端联调的基础能力；并不意味着已经掌握任何公司项目的全部自定义组件、业务协议或部署系统。进入真实项目后，应继续以现有代码、接口文档、团队规范和实际测试结果为准。

### 复习优先级

如果时间有限，建议优先动手完成：

1. 用 Vue DevTools 找到一个真实组件的 Props、Emit 和 Pinia 状态；
2. 能为一个新增或编辑需求合理使用 `Pick`、`Omit`、`Partial`；
3. 能在现有项目中分别运行 ESLint、Prettier 和 `vue-tsc`，并解释各自的报错；
4. 能修改 Element Plus 控件样式，并确认没有影响其他业务页面；
5. 能为一条业务规则写 Vitest 测试，为一个自定义组件写事件测试；
6. 能执行构建、检查资源路径，并审查准备提交的文件差异。

### 参考资料

- [Vue 官方文档：工具链与 Vue DevTools](https://vuejs.org/guide/scaling-up/tooling)
- [Vue 官方文档：TypeScript 支持](https://vuejs.org/guide/typescript/overview)
- [Vue 官方文档：SFC CSS 与 :deep()](https://vuejs.org/api/sfc-css-features)
- [TypeScript 官方文档：工具类型](https://www.typescriptlang.org/docs/handbook/utility-types.html)
- [ESLint Vue 插件：配置指南](https://eslint.vuejs.org/user-guide/)
- [TypeScript ESLint：配置指南](https://typescript-eslint.io/docs/)
- [Prettier：安装与使用](https://prettier.io/docs/install)
- [Vue Test Utils：组件测试](https://test-utils.vuejs.org/guide/)
- [Vitest：测试环境](https://vitest.dev/guide/environment)
- [Vitest：Mock 与模拟函数](https://vitest.dev/guide/mocking.html)
- [Vite：生产构建](https://vite.dev/guide/build)
- [Vite：静态站点部署](https://vite.dev/guide/static-deploy)
- [Playwright：测试 Web 服务器配置](https://playwright.dev/docs/test-webserver)
