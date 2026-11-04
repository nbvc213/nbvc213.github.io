---
date: 2026-11-01
description: 通过账户管理案例，综合练习需求拆解、数据流追踪、查询分页、表单维护、组件通信与故障排查。
tags:
- Vue
- Vue 3
- TypeScript
- Element Plus
- 综合实战
---

## 今日学习目标与时间安排

前四天已经分别学习 Vue 基础、TypeScript、响应式数据、Element Plus 表单与表格、组件通信、生命周期、Composable、Vue Router、Vite、Axios、异步流程和 Pinia。

第五天不再以增加新 API 为目标，而是把这些知识放进一个完整业务场景中，练习企业开发中更重要的能力：**阅读需求、定位代码、理解数据流、完成小范围修改，并通过正常和异常场景验证结果。**

本日使用"账户管理"作为练习案例，包含：

-   账户列表查询；
-   姓名与启用状态组合筛选；
-   点击查询后才应用筛选条件；
-   分页展示；
-   新增账户；
-   编辑账户；
-   表单校验；
-   删除账户；
-   请求过程中的忙碌状态；
-   操作成功、失败和刷新失败的反馈；
-   子组件通过 Props 和 Emit 与父组件通信；
-   将内存 Mock 接口替换为真实 HTTP 接口的思路。

### 建议的两小时主线

  环节               建议时间 学习任务
  ---------------- ---------- --------------------------------------------
  阅读需求            15 分钟 明确字段、查询规则、新增编辑规则和异常约定
  运行并追踪程序      35 分钟 从按钮事件追踪到数据模块，再回到表格
  完成修改题          40 分钟 增加字段、调整校验、修改删除规则
  故障排查            20 分钟 观察失败恢复、事件传递和数据展示问题
  最终验收            10 分钟 独立解释一条完整业务链路

这两小时是主线学习安排，不代表必须在两小时内逐字读完所有解释并运行全部对照实验。主线先完成，补充内容可在后续复习时查阅。

### 本日案例的边界

本日综合程序使用**内存 Mock 数据源**模拟接口：

-   数据保存在 `src/api/accounts.ts` 模块内部的数组中；
-   API 函数通过 Promise 和定时延迟模拟异步过程；
-   保存、删除会修改模块内部数组；
-   页面通过调用 API 函数重新读取数据；
-   刷新浏览器后，模块重新初始化，数据恢复为初始值；
-   这些操作不会产生真实 HTTP 请求，Network 中不会出现对应的 Fetch/XHR 请求。

第四天已经使用 Axios 和静态 JSON 练习真实 HTTP 请求与 Network 面板。本日的重点是业务数据流和页面状态管理，不能把内存 Mock 误认为真实前后端联调。

## 运行环境与项目准备

### 项目基础

本日示例沿用第一天创建的 Vue 3 + TypeScript + Vite 工程，并使用 Element Plus。

项目至少需要以下依赖：

-   `vue`
-   `typescript`
-   `vite`
-   `element-plus`

如果工程已经安装 Element Plus，不需要重复安装。如果没有安装，在项目根目录执行：

```bash
npm install element-plus
```

本日不要求额外安装 Pinia、Axios 或 Vue Router。它们属于前几天学习的内容，但本案例的页面状态只在一个业务页面内使用，因此直接使用组件中的 `ref`、`reactive` 和 `computed` 即可。

**不要为了使用状态管理库而把所有变量都放进 Store。** 是否使用 Pinia，应由状态是否需要跨组件、跨页面共享决定。

### 本日文件结构

在项目的 `src` 目录下创建或替换以下文件：

```text
src/
├── api/
│   └── accounts.ts
├── components/
│   └── AccountActions.vue
├── types/
│   └── account.ts
├── App.vue
└── main.ts
```

各文件职责：

  -----------------------------------------------------------------------------------
  文件                                职责
  ----------------------------------- -----------------------------------------------
  `types/account.ts`                  定义账户记录和账户草稿的数据类型

  `api/accounts.ts`                   模拟查询、新增、编辑和删除接口

  `components/AccountActions.vue`     显示每行的编辑、删除按钮，并向父组件发送事件

  `App.vue`                           管理查询条件、列表、分页、编辑表单和操作反馈

  `main.ts`                           创建 Vue 应用、注册 Element Plus 并挂载根组件
  -----------------------------------------------------------------------------------

如果项目已经有其他页面或组件，可以保留它们。本日只需要保证上述文件的导入路径一致。

### Element Plus 入口配置

文件：`src/main.ts`。

```ts
import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import App from './App.vue';

// 创建 Vue 应用，注册 Element Plus，再挂载根组件。
createApp(App)
    .use(ElementPlus)
    .mount('#app');
```

`app.use(ElementPlus)` 用于把 Element Plus 安装到当前 Vue 应用，使模板可以使用 `el-button`、`el-form`、`el-table`、`el-pagination` 等组件。

如果项目已经在 `main.ts` 中注册 Element Plus，不要重复注册。保留项目原有入口配置即可。

### 启动项目

在项目根目录执行：

```bash
npm run dev
```

根据终端输出打开 Vite 提供的本地地址，通常是：

```text
http://localhost:5173/
```

实际端口以终端输出为准。

## 一、先把业务需求转换成页面规则

### 账户数据结构

本例中的账户包含三个字段：

  字段       TypeScript 类型   含义                 示例
  ---------- ----------------- -------------------- ------------
  `id`       `number`          账户记录的唯一编号   `101`
  `name`     `string`          账户名称             `储蓄账户`
  `active`   `boolean`         是否启用             `true`

`active` 使用布尔值：

-   `true` 表示启用；
-   `false` 表示停用。

它不是字符串。`true` 和 `'true'` 是不同的数据，`false` 和 `'false'` 也是不同的数据。

### 业务规则清单

  功能       业务规则
  ---------- ---------------------------------------------------------
  查询       支持按姓名和账户状态筛选
  组合条件   姓名与状态必须同时满足
  查询时机   输入框变化不立即筛选，点击查询后才应用条件
  重置       清空查询条件，并立即恢复全部记录
  分页       每页显示 2 条记录
  新增       姓名必填，长度为 2～20 个字符；新增时生成 ID
  编辑       按账户 ID 找到记录；编辑时保留原 ID
  取消编辑   只丢弃草稿，不得提前修改表格记录
  删除       根据账户 ID 删除对应记录
  忙碌状态   数据操作期间禁用相关控件，并在函数内部阻止重复进入
  异常处理   请求失败后恢复按钮状态，并保留可修正的编辑草稿
  特殊测试   姓名为"失败测试"时，Mock 故意拒绝保存，用于验证失败流程

"失败测试"是本练习人为设置的异常条件，不是现实账户业务规则。

### 从需求中识别数据，而不是先写模板

一个账户管理页面至少需要区分以下几类数据：

1.  **数据源（database）**：模拟接口内部保存的完整账户记录。
2.  **页面列表（rows）**：页面最近一次成功取得的账户记录。
3.  **编辑草稿（draft）**：用户正在输入、尚未保存的字段。
4.  **当前查询条件（query）**：用户此刻在输入框和下拉框中填写的内容。
5.  **已应用条件（applied）**：上一次点击查询时正式提交的条件。
6.  **当前页数据（pageRows）**：经过筛选和分页后，真正交给表格展示的数据。

它们之间不是同一份数据，也不应该随意混用。

```text
模拟数据源 database
        │
        │ listAccounts()
        ▼
页面完整列表 rows
        │
        │ 根据已提交条件 applied 筛选
        ▼
筛选结果 filtered
        │
        │ 根据 page 和 pageSize 截取
        ▼
当前页 pageRows
        │
        ▼
Element Plus 表格

用户输入 query ──点击查询──> applied

已保存记录 rows ──复制字段──> 编辑草稿 draft
                                      │
                                      │ 校验通过并保存
                                      ▼
                                Mock 数据源 database
```

这张图是本日最重要的模型。后续无论看查询、编辑还是删除，都要先判断代码正在操作哪一层数据。

### 页面状态清单

  ------------------------------------------------------------------------------------------------
  变量                    保存的内容                            主要修改入口
  ----------------------- ------------------------------------- ----------------------------------
  `rows`                  页面取得的完整账户数组                `refresh()`

  `query`                 用户当前输入的查询条件                表单控件、重置函数

  `applied`               已经提交并生效的查询条件              `search()`

  `filtered`              根据 `rows` 和 `applied` 计算的结果   `computed()` 自动计算

  `page`                  当前页码                              分页控件、查询、保存、删除

  `pageRows`              当前页要展示的记录                    `computed()` 自动计算

  `editing`               是否显示编辑区域                      新增、编辑、取消、保存成功

  `editingId`             当前编辑记录的 ID；`null` 表示新增    新增、编辑、取消、保存成功

  `draft`                 当前编辑或新增的草稿字段              初始化、回填、输入控件

  `busy`                  是否有尚未结束的数据操作              `load()`、`submit()`、`remove()`

  `message`               成功或阶段性操作反馈                  操作函数

  `errorMessage`          当前错误提示                          操作失败时设置
  ------------------------------------------------------------------------------------------------

**先列出状态，再追踪状态由谁修改。** 这样比直接从几百行代码中寻找变量更容易建立整体认识。

## 二、先完成三个独立需求

综合程序包含多项功能。为了避免一次阅读过多代码，先把三个最典型的修改单独拆开：查询条件、编辑取消、组件删除。每个示例都是独立程序，运行时分别替换 `src/App.vue`，不要把三个示例合并到同一个页面。

## 需求示范：增加状态查询，并保持点击后才生效

### 需求中的两个限制

原页面已经支持按姓名查询，现在增加启用/停用选择，并要求：

-   姓名和状态两个条件必须同时满足；
-   用户输入或选择时不立即改变列表；
-   点击"查询"后才应用新的条件。

这里有两个不同的时间点：

-   用户正在修改控件时，变化保存在 `query`；
-   点击查询后，正式参与筛选的条件保存在 `applied`。

如果 `computed` 直接读取 `query`，输入框一变化，筛选结果就会立即变化，与"点击后才生效"的要求冲突。

### 先确定筛选表达式

姓名条件：

```ts
item.name.includes(applied.name)
```

`includes()` 判断字符串中是否包含指定内容。查询条件为空字符串时，任何字符串都包含空字符串，因此空姓名条件会匹配全部账户。

状态条件：

```ts
applied.status === '' ||
item.active === (applied.status === 'enabled')
```

含义：

-   `applied.status === ''`：没有选择状态限制，直接通过；
-   `applied.status === 'enabled'`：右侧比较结果为 `true`，只保留启用账户；
-   `applied.status === 'disabled'`：右侧比较结果为 `false`，只保留停用账户。

两个条件使用外层 `&&`：

```ts
姓名匹配 && 状态匹配
```

`&&` 要求两边都为真。不能改成外层 `||`，否则姓名不匹配的记录也可能仅凭状态匹配而被保留。

### 完整程序：独立查询需求

文件：`src/App.vue`。

本例使用静态数组作为数据源，不发起接口请求。需要先按"运行环境与项目准备"完成 Element Plus 注册。

```vue
<script setup lang="ts">
import { reactive, computed } from 'vue';

interface Account {
    id: number;
    name: string;
    active: boolean;
}

const source: Account[] = [
    { id: 1, name: '张三', active: true },
    { id: 2, name: '李四', active: false },
    { id: 3, name: '张小明', active: false }
];

// 控件当前输入值。
const query = reactive({
    name: '',
    status: ''
});

// 点击查询后正式生效的条件。
const applied = reactive({
    name: '',
    status: ''
});

// 计算结果只依赖已提交条件，不直接依赖 query。
const filtered = computed(() => {
    return source.filter(item => {
        const matchesName = item.name.includes(applied.name);

        const matchesStatus =
            applied.status === '' ||
            item.active === (applied.status === 'enabled');

        // 两个条件必须同时满足。
        return matchesName && matchesStatus;
    });
});

// 点击查询时，把当前输入复制为正式查询条件。
function search(): void {
    applied.name = query.name.trim();
    applied.status = query.status;
}

// 重置后立即应用空条件。
function reset(): void {
    query.name = '';
    query.status = '';
    search();
}
</script>

<template>
    <h2>账户查询</h2>

    <el-form :model="query">
        <el-form-item label="姓名">
            <el-input v-model="query.name" />
        </el-form-item>

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

    <p>结果数量：{{ filtered.length }}</p>

    <el-table :data="filtered" row-key="id">
        <el-table-column prop="name" label="姓名" />

        <el-table-column label="状态">
            <template #default="scope">
                {{ scope.row.active ? '启用' : '停用' }}
            </template>
        </el-table-column>
    </el-table>
</template>
```

### 按操作验证，而不是只看页面有没有报错

  ------------------------------------------------------------------------------------
  操作                         `query`            `applied`          预期结果
  ---------------------------- ------------------ ------------------ -----------------
  初次加载                     姓名、状态均为空   姓名、状态均为空   全部三条

  输入"张"，选择停用，不点击   张、disabled       仍为空             仍显示三条

  点击查询                     张、disabled       张、disabled       只显示张小明

  把输入改为"李"，不点击       李、disabled       仍是张、disabled   仍显示张小明

  点击重置                     两条件为空         两条件为空         恢复全部三条
  ------------------------------------------------------------------------------------

如果第二步立即变成一条，说明计算属性可能误读了 `query`。如果点击查询后仍显示三条，检查 `search()` 是否把条件复制给 `applied`。如果结果出现李四和张小明，检查姓名条件是否参与，以及是否误把外层 `&&` 写成了 `||`。

**需求验证要覆盖操作顺序。** 单纯确认"按钮能点、页面没报错"，不足以证明查询时机和组合条件正确。

## 需求示范：编辑时取消，不得修改表格

### 为什么不能直接把表格行对象当作草稿

假设表格中有一条记录：

```ts
const record = {
    id: 101,
    name: '张三',
    active: true
};
```

如果直接把整条记录交给编辑表单：

```ts
const draft = record;
```

那么 `draft` 和 `record` 指向同一个对象。通过 `v-model` 修改 `draft.name`，实际也修改了 `record.name`。

这会导致一个业务问题：用户把"张三"改成"李四"后点击取消，表格已经显示"李四"。取消按钮只关闭编辑界面，并不会自动撤销之前对原对象的修改。

正确做法是：**编辑时只把允许修改的字段复制到独立草稿中；校验通过并保存后，再更新列表记录。**

### 先看按 ID 替换记录的规则

```ts
rows.value = rows.value.map(item => {
    return item.id === editingId.value
        ? { ...item, name: draft.name }
        : item;
});
```

`map()` 会遍历原数组，并为每个元素生成新数组中的对应元素：

-   如果当前元素的 ID 等于 `editingId`，返回一个带有新姓名的新对象；
-   如果不是目标记录，原样返回该元素。

这里的判断使用稳定的业务 ID，而不是数组下标或表格行号。分页、排序和筛选都会改变记录在页面中的位置，但不会改变记录 ID。

`{ ...item, name: draft.name }` 是对象展开语法：先复制原对象的可枚举自身属性，再用后面的 `name` 覆盖旧姓名。本例字段都是基本类型，浅复制足够；如果记录中包含嵌套对象或数组，还要单独考虑复制深度。

### 完整程序：独立编辑与校验

文件：`src/App.vue`。

```vue
<script setup lang="ts">
import { ref, reactive } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';

interface Account {
    id: number;
    name: string;
}

interface Draft {
    name: string;
}

const rows = ref<Account[]>([
    { id: 101, name: '张三' },
    { id: 102, name: '李四' }
]);

// null 表示新增模式；数字表示正在编辑的记录 ID。
const editingId = ref<number | null>(null);

// 草稿与 rows 中的记录分开保存。
const draft = reactive<Draft>({
    name: ''
});

const formRef = ref<FormInstance>();

const rules: FormRules<Draft> = {
    name: [
        {
            required: true,
            message: '请输入姓名',
            trigger: 'blur'
        },
        {
            min: 2,
            max: 20,
            message: '姓名为 2～20 字符',
            trigger: 'blur'
        }
    ]
};

const message = ref('');

function beginEdit(id: number): void {
    // 根据稳定 ID 找到目标记录。
    const record = rows.value.find(item => item.id === id);

    if (!record) {
        return;
    }

    editingId.value = record.id;

    // 只复制可编辑字段，不让草稿指向原记录。
    draft.name = record.name;

    // 清理上一次编辑留下的校验提示。
    formRef.value?.clearValidate();

    message.value = '';
}

function cancel(): void {
    // 取消只关闭编辑区，不修改 rows。
    editingId.value = null;
    message.value = '已取消，原记录未改变';
}

async function save(): Promise<void> {
    if (!formRef.value || editingId.value === null) {
        return;
    }

    // 先清除首尾空白，再进行校验。
    draft.name = draft.name.trim();

    try {
        // 校验成功后才执行列表替换。
        await formRef.value.validate();

        rows.value = rows.value.map(item => {
            return item.id === editingId.value
                ? { ...item, name: draft.name }
                : item;
        });

        editingId.value = null;
        message.value = '已保存';
    } catch {
        // 校验失败时保留编辑区，方便用户修正。
        message.value = '请修正姓名';
    }
}
</script>

<template>
    <h2>账户编辑</h2>

    <el-table :data="rows" row-key="id">
        <el-table-column prop="id" label="编号" />
        <el-table-column prop="name" label="姓名" />

        <el-table-column label="操作">
            <template #default="scope">
                <el-button @click="beginEdit(scope.row.id)">
                    编辑
                </el-button>
            </template>
        </el-table-column>
    </el-table>

    <section v-if="editingId !== null">
        <p>正在编辑 ID：{{ editingId }}</p>

        <el-form
            ref="formRef"
            :model="draft"
            :rules="rules"
        >
            <el-form-item label="姓名" prop="name">
                <el-input v-model="draft.name" />
            </el-form-item>
        </el-form>

        <el-button @click="save">保存</el-button>
        <el-button @click="cancel">取消</el-button>
    </section>

    <p>{{ message }}</p>
</template>
```

### 从一次编辑追踪变量

假设点击 ID 为 102 的记录：

1.  `beginEdit(102)` 在 `rows` 中找到李四；
2.  `editingId` 变为 `102`；
3.  `draft.name` 被赋值为"李四"；
4.  用户输入"李小明"，只改变 `draft.name`；
5.  `rows` 中的原记录仍然是"李四"；
6.  点击取消，`editingId` 变为 `null`，编辑区域消失；
7.  再次编辑 ID 102 时，函数重新从 `rows` 复制"李四"，之前未保存的"李小明"不会自动恢复。

如果输入合法姓名并保存，`validate()` 成功后才执行 `map()`，ID 102 的姓名才更新为"李小明"。

如果把姓名清空后保存，`validate()` 会拒绝，`map()` 不执行，编辑区继续显示，用户可以修正输入。

### `clearValidate()` 和 `resetFields()` 不一样

Element Plus 表单实例提供多种操作：

-   `clearValidate()`：清除校验结果和错误提示，不负责清空业务字段；
-   `resetFields()`：把表单字段恢复到表单记录的初始值，具体初始值取决于表单模型及其初始化时机；
-   `validate()`：执行表单校验，校验通过时 Promise 成功，校验不通过时 Promise 拒绝。

本例需要保留当前编辑草稿，因此不能在取消或切换记录时随意调用 `resetFields()`，否则可能把草稿重置到不符合当前业务预期的值。

### 这个程序还没有接口

本例保存时只修改组件中的 `rows`。刷新浏览器后，数组重新初始化，数据恢复原值。

后面的综合程序会把同样的草稿和校验流程接到 API 模块上。区别在于保存时需要等待异步结果，并处理接口失败。

## 需求示范：子组件只报告删除目标

### 先确定谁拥有列表状态

本例中，账户列表由父组件 `App.vue` 管理。删除一条记录后，父组件负责更新列表。

行操作子组件只负责显示按钮，并把用户选择的账户 ID 发送给父组件。它不应该直接导入数据源，也不应该自己修改父组件的 `rows`。

这样可以明确分工：

-   子组件负责呈现行操作；
-   Props 告诉子组件当前操作哪条记录，以及操作是否禁用；
-   Emit 把用户操作和目标 ID 通知父组件；
-   父组件决定如何删除，以及如何处理成功和失败。

### 完整程序：删除按钮组件

文件：`src/components/DeleteAccountButton.vue`。

```vue
<script setup lang="ts">
// 父组件传入目标账户 ID。
const props = defineProps<{
    id: number;
}>();

// 子组件声明自己会发出 remove 事件，参数为账户 ID。
const emit = defineEmits<{
    (e: 'remove', id: number): void;
}>();

function requestRemove(): void {
    // 只报告用户操作，不在子组件中修改列表。
    emit('remove', props.id);
}
</script>

<template>
    <button @click="requestRemove">
        删除
    </button>
</template>
```

文件：`src/App.vue`。

```vue
<script setup lang="ts">
import { ref } from 'vue';
import DeleteAccountButton from './components/DeleteAccountButton.vue';

const rows = ref([
    { id: 101, name: '张三' },
    { id: 102, name: '李四' }
]);

const message = ref('');

function remove(id: number): void {
    // filter 返回不包含目标 ID 的新数组。
    rows.value = rows.value.filter(item => item.id !== id);

    message.value = `已删除 ID ${id}`;
}
</script>

<template>
    <h2>账户删除</h2>

    <ul>
        <li
            v-for="row in rows"
            :key="row.id"
        >
            {{ row.name }}

            <DeleteAccountButton
                :id="row.id"
                @remove="remove"
            />
        </li>
    </ul>

    <p>{{ message }}</p>
</template>
```

点击李四的删除按钮后，执行顺序：

```text
第二行按钮对应的 props.id = 102
        ↓
子组件 emit('remove', 102)
        ↓
父组件监听 @remove
        ↓
父组件 remove(102)
        ↓
filter 排除 id 为 102 的记录
        ↓
rows.value 替换为新数组
        ↓
Vue 更新列表
```

如果子组件发出 `remove`，父组件却写成 `@delete="remove"`，父组件就没有监听到这个事件。此时应先核对事件名称和参数，而不是直接修改 `filter()`。

## 三、综合程序：账户管理页面

前面三个小程序分别验证了查询、编辑和组件通信。现在把它们与分页、异步 Mock、表单校验、错误处理组合成一个完整页面。

### 完整业务流程

页面首次加载时，调用 `listAccounts()` 取得账户数组；用户填写查询条件并点击查询，页面更新已应用条件；筛选结果交给分页计算；用户新增、编辑或删除时，页面调用对应 API；操作成功后重新读取数据，再更新表格。

```text
页面挂载
   ↓
onMounted(load)
   ↓
load()
   ↓
refresh()
   ↓
listAccounts()
   ↓
rows.value = 返回数据
   ↓
filtered 重新计算
   ↓
pageRows 重新计算
   ↓
el-table 显示当前页

查询按钮 ──> search() ──> applied ──> filtered ──> pageRows

新增按钮 ──> beginNew() ──> draft
编辑按钮 ──> beginEdit(id) ──> 从 rows 复制到 draft
保存按钮 ──> submit() ──> validate() ──> saveAccount()
                                              ↓
                                         refresh()
                                              ↓
                                         rows 更新

删除按钮 ──子组件 Emit──> remove(id) ──> deleteAccount()
                                              ↓
                                         refresh()
```

### 类型文件

文件：`src/types/account.ts`。

```ts
// 已保存的账户记录。
export interface Account {
    id: number;
    name: string;
    active: boolean;
}

// 表单中的待提交字段。
// 新增时还没有 ID，因此草稿不包含 id。
export interface AccountDraft {
    name: string;
    active: boolean;
}
```

为什么需要分开定义 `Account` 和 `AccountDraft`？

`Account` 表示已经存在的数据记录，必须有 `id`。`AccountDraft` 表示用户准备提交的字段，在新增时还没有 ID。

如果直接让新增表单使用 `Account`，就需要给尚未生成的 ID 编造一个值，或者把 ID 设为可选。单独定义草稿类型更清楚，也能避免把"数据库记录"和"用户输入"混为一谈。

### 内存接口文件

文件：`src/api/accounts.ts`。

```ts
import type { Account, AccountDraft } from '../types/account';

// 模拟数据源：保存在当前模块的内存中。
let database: Account[] = [
    { id: 1, name: '张三', active: true },
    { id: 2, name: '李四', active: false },
    { id: 3, name: '张小明', active: true }
];

// 下一条新增记录使用的 ID。
let nextId = 4;

// 用定时器模拟异步耗时，不会产生真实 HTTP 请求。
function delay(): Promise<void> {
    return new Promise(resolve => {
        setTimeout(resolve, 300);
    });
}

// 查询全部账户，返回记录副本。
export async function listAccounts(): Promise<Account[]> {
    await delay();

    // 返回新数组，并为每条扁平记录创建副本。
    // 页面修改副本不会直接修改模块内部的 database。
    return database.map(item => ({ ...item }));
}

// 新增或编辑账户。
// id 为 null 表示新增；数字表示编辑对应 ID。
export async function saveAccount(
    id: number | null,
    draft: AccountDraft
): Promise<void> {
    await delay();

    // 数据层再次清理并校验姓名。
    const name = draft.name.trim();

    if (name.length < 2 || name.length > 20) {
        throw new Error('姓名长度不符合要求');
    }

    // 人为设置的失败条件，用于练习异常处理。
    if (name === '失败测试') {
        throw new Error('模拟保存失败，请修改后重试');
    }

    if (id === null) {
        // 新增：生成新 ID，再把记录加入数据源。
        database.push({
            id: nextId++,
            name,
            active: draft.active
        });
    } else {
        // 编辑：先确认目标记录存在。
        const exists = database.find(item => item.id === id);

        if (!exists) {
            throw new Error('账户不存在');
        }

        // 只替换目标 ID 对应的记录，其他记录保留。
        database = database.map(item => {
            return item.id === id
                ? { id, name, active: draft.active }
                : item;
        });
    }
}

// 删除账户。
export async function deleteAccount(id: number): Promise<void> {
    await delay();

    // 删除前确认目标存在。
    const exists = database.find(item => item.id === id);

    if (!exists) {
        throw new Error('账户不存在');
    }

    // filter 返回不包含目标 ID 的新数组。
    database = database.filter(item => item.id !== id);
}
```

**这个模块不依赖 Vue。** `database` 不是 `ref`，它只是模块内部的普通数组。页面通过 `await listAccounts()` 取得数据，再把结果赋给自己的 `rows`。

模块顶层变量在当前模块被加载后创建一次。同一个应用中的多个调用会使用这份模块数据，因此保存和删除能够影响下一次查询。但浏览器刷新会重新加载模块，数据也会重新初始化。

`delay()` 只是模拟等待时间。它没有调用 `fetch()` 或 Axios，因此 Network 中不会出现对应的 HTTP 请求。

### 行操作组件

文件：`src/components/AccountActions.vue`。

```vue
<script setup lang="ts">
// id 确定当前行操作的目标账户。
// busy 表示父页面正在执行数据操作。
const props = defineProps<{
    id: number;
    busy: boolean;
}>();

// 子组件只通知父组件编辑或删除，不直接修改数据源。
const emit = defineEmits<{
    (e: 'edit', id: number): void;
    (e: 'remove', id: number): void;
}>();
</script>

<template>
    <el-button
        :disabled="props.busy"
        @click="emit('edit', props.id)"
    >
        编辑
    </el-button>

    <el-button
        :disabled="props.busy"
        @click="emit('remove', props.id)"
    >
        删除
    </el-button>
</template>
```

父组件通过 `:id="scope.row.id"` 把当前行 ID 传给子组件，通过 `:busy="busy"` 告诉子组件是否应该禁用操作按钮。

子组件发出 `edit` 或 `remove` 事件时，父组件接收同一个 ID。子组件不需要知道账户数据保存在什么位置，也不需要知道删除函数使用 Mock 还是 Axios。

### 应用入口

文件：`src/main.ts`。

```ts
import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import App from './App.vue';

// 本日示例只需注册 Element Plus，不需要重复创建 Pinia。
createApp(App)
    .use(ElementPlus)
    .mount('#app');
```

### 完整页面

文件：`src/App.vue`。

```vue
<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';

import type { Account, AccountDraft } from './types/account';

import {
    listAccounts,
    saveAccount,
    deleteAccount
} from './api/accounts';

import AccountActions from './components/AccountActions.vue';

// -------------------- 页面数据 --------------------

// 最近一次成功加载的完整账户列表。
const rows = ref<Account[]>([]);

// 数据操作期间为 true，用于禁用控件并阻止重复进入。
const busy = ref(false);

// 操作反馈与错误提示分开保存。
const message = ref('');
const errorMessage = ref('');

// -------------------- 查询条件 --------------------

type QueryStatus = '' | 'enabled' | 'disabled';

// 用户正在编辑的查询条件。
const query = reactive<{
    name: string;
    status: QueryStatus;
}>({
    name: '',
    status: ''
});

// 点击查询后正式生效的条件。
const applied = reactive<{
    name: string;
    status: QueryStatus;
}>({
    name: '',
    status: ''
});

// 当前页码和每页条数。
const page = ref(1);
const pageSize = 2;

// -------------------- 编辑草稿 --------------------

// 是否显示新增/编辑区域。
const editing = ref(false);

// null 表示新增；数字表示正在编辑的账户 ID。
const editingId = ref<number | null>(null);

// 草稿与 rows 中的记录分开保存。
const draft = reactive<AccountDraft>({
    name: '',
    active: true
});

// Element Plus 表单实例。
const formRef = ref<FormInstance>();

// 姓名校验规则。
const rules: FormRules<AccountDraft> = {
    name: [
        {
            required: true,
            message: '请输入姓名',
            trigger: 'blur'
        },
        {
            min: 2,
            max: 20,
            message: '姓名长度为 2～20',
            trigger: 'blur'
        }
    ]
};

// -------------------- 计算属性 --------------------

// 先按姓名和状态筛选完整列表。
const filtered = computed(() => {
    return rows.value.filter(item => {
        const matchesName = item.name.includes(applied.name);

        const matchesStatus =
            applied.status === '' ||
            item.active === (applied.status === 'enabled');

        // 两个条件必须同时满足。
        return matchesName && matchesStatus;
    });
});

// 再从筛选结果中截取当前页。
const pageRows = computed(() => {
    const start = (page.value - 1) * pageSize;

    return filtered.value.slice(start, start + pageSize);
});

// -------------------- 查询操作 --------------------

// 点击查询后，才把 query 复制给 applied。
function search(): void {
    if (busy.value) {
        return;
    }

    applied.name = query.name.trim();
    applied.status = query.status;

    // 新条件可能改变总页数，因此回到第一页。
    page.value = 1;

    message.value = '';
    errorMessage.value = '';
}

// 清空查询条件，并立即应用空条件。
function resetQuery(): void {
    if (busy.value) {
        return;
    }

    query.name = '';
    query.status = '';

    search();
}

// -------------------- 新增和编辑 --------------------

// 初始化新增草稿。
function beginNew(): void {
    if (busy.value) {
        return;
    }

    // null 明确表示新增模式。
    editingId.value = null;

    draft.name = '';
    draft.active = true;

    editing.value = true;

    // 如果表单实例已经存在，清除旧校验提示。
    // 首次打开时表单可能尚未创建，因此使用可选链。
    formRef.value?.clearValidate();

    message.value = '';
    errorMessage.value = '';
}

// 根据 ID 找到记录，并逐字段复制到草稿。
function beginEdit(id: number): void {
    if (busy.value) {
        return;
    }

    const record = rows.value.find(item => item.id === id);

    // 记录不存在时不继续读取其字段。
    if (!record) {
        errorMessage.value = '未找到要编辑的账户';
        return;
    }

    editingId.value = record.id;

    // 逐字段复制，输入时不会提前修改 rows 中的记录。
    draft.name = record.name;
    draft.active = record.active;

    editing.value = true;

    formRef.value?.clearValidate();

    message.value = '';
    errorMessage.value = '';
}

// 取消编辑：只关闭编辑区，不写入数据源。
function cancelEdit(): void {
    if (busy.value) {
        return;
    }

    editing.value = false;
    editingId.value = null;

    message.value = '已取消，账户列表未修改';
    errorMessage.value = '';
}

// -------------------- 数据读取 --------------------

// refresh 只负责读取最新数据和校正页码。
// 它不设置 busy，也不吞掉异常，因此可以被多个业务函数复用。
async function refresh(): Promise<void> {
    // 只有读取成功后才替换 rows；失败时旧列表仍保留。
    rows.value = await listAccounts();

    // 重新计算当前筛选条件下的总页数。
    // Math.max 保证页码至少为 1。
    const lastPage = Math.max(
        1,
        Math.ceil(filtered.value.length / pageSize)
    );

    // 如果删除后原页码已经超出范围，就校正到最后一页。
    if (page.value > lastPage) {
        page.value = lastPage;
    }
}

// 页面初始化或用户点击重新加载时调用。
async function load(): Promise<void> {
    if (busy.value) {
        return;
    }

    busy.value = true;
    message.value = '';
    errorMessage.value = '';

    try {
        await refresh();
    } catch (error) {
        errorMessage.value =
            error instanceof Error ? error.message : '加载失败';
    } finally {
        // 成功或失败都会恢复操作状态。
        busy.value = false;
    }
}

// -------------------- 保存操作 --------------------

async function submit(): Promise<void> {
    // 防止重复提交；表单实例不存在时也不能继续。
    if (busy.value || !formRef.value) {
        return;
    }

    busy.value = true;
    message.value = '';
    errorMessage.value = '';

    // 用于区分“保存失败”和“保存成功但刷新失败”。
    let saved = false;

    try {
        // 先清除首尾空白，再执行表单校验。
        draft.name = draft.name.trim();

        // 校验不通过会拒绝 Promise，后续保存不会执行。
        await formRef.value.validate();

        // 传入草稿副本，避免 API 层直接持有响应式草稿对象。
        await saveAccount(editingId.value, { ...draft });

        // 到这里说明数据层已经确认保存成功。
        saved = true;

        // 保存成功后关闭编辑区。
        editing.value = false;
        editingId.value = null;

        // 保存后从第一页查看当前查询条件下的结果。
        page.value = 1;

        // 重新读取数据，更新页面列表。
        await refresh();

        message.value = '保存成功；列表仍按当前查询条件显示';
    } catch (error) {
        if (saved) {
            // 写入已经成功，失败发生在后续刷新阶段。
            // 不能提示用户“保存失败，请重新提交”。
            message.value = '保存已完成，但列表刷新失败，请点击重新加载；不要重复新增';
        } else {
            // 校验失败或保存接口拒绝。
            errorMessage.value =
                error instanceof Error ? error.message : '请检查表单字段';
        }
    } finally {
        busy.value = false;
    }
}

// -------------------- 删除操作 --------------------

async function remove(id: number): Promise<void> {
    if (busy.value) {
        return;
    }

    busy.value = true;
    message.value = '';
    errorMessage.value = '';

    // 区分删除失败与删除成功后刷新失败。
    let deleted = false;

    try {
        await deleteAccount(id);

        // 删除接口成功返回后，才认为数据源已完成删除。
        deleted = true;

        // 如果删除的正是当前编辑记录，关闭对应编辑区。
        if (editingId.value === id) {
            editing.value = false;
            editingId.value = null;
        }

        page.value = 1;

        await refresh();

        message.value = '删除成功';
    } catch (error) {
        if (deleted) {
            message.value = '删除已完成，但列表刷新失败，请点击重新加载';
        } else {
            errorMessage.value =
                error instanceof Error ? error.message : '删除失败';
        }
    } finally {
        busy.value = false;
    }
}

// 组件首次挂载后自动加载一次账户列表。
onMounted(() => {
    void load();
});
</script>

<template>
    <main class="page">
        <h2>账户管理</h2>

        <!-- 查询条件：控件绑定 query，不直接绑定 applied。 -->
        <el-form :model="query" inline>
            <el-form-item label="姓名">
                <el-input
                    v-model="query.name"
                    placeholder="请输入账户姓名"
                    :disabled="busy"
                    clearable
                />
            </el-form-item>

            <el-form-item label="状态">
                <el-select
                    v-model="query.status"
                    placeholder="请选择状态"
                    :disabled="busy"
                >
                    <el-option label="全部" value="" />
                    <el-option label="启用" value="enabled" />
                    <el-option label="停用" value="disabled" />
                </el-select>
            </el-form-item>
        </el-form>

        <!-- 查询、重置、新增和重新加载入口。 -->
        <div class="toolbar">
            <el-button
                type="primary"
                :disabled="busy"
                @click="search"
            >
                查询
            </el-button>

            <el-button
                :disabled="busy"
                @click="resetQuery"
            >
                重置
            </el-button>

            <el-button
                type="success"
                :disabled="busy"
                @click="beginNew"
            >
                新增
            </el-button>

            <el-button
                :loading="busy"
                :disabled="busy"
                @click="load"
            >
                重新加载
            </el-button>
        </div>

        <!-- 业务错误和阶段性反馈分开显示。 -->
        <el-alert
            v-if="errorMessage"
            :title="errorMessage"
            type="error"
            show-icon
            :closable="false"
        />

        <p v-if="message" class="message">
            {{ message }}
        </p>

        <!-- 表格读取的是经过筛选和分页后的 pageRows。 -->
        <el-table
            :data="pageRows"
            row-key="id"
            border
            stripe
            v-loading="busy"
        >
            <el-table-column
                prop="id"
                label="编号"
                width="100"
            />

            <el-table-column
                prop="name"
                label="姓名"
            />

            <el-table-column label="状态" width="120">
                <template #default="scope">
                    {{ scope.row.active ? '启用' : '停用' }}
                </template>
            </el-table-column>

            <el-table-column
                label="操作"
                width="180"
            >
                <template #default="scope">
                    <AccountActions
                        :id="scope.row.id"
                        :busy="busy"
                        @edit="beginEdit"
                        @remove="remove"
                    />
                </template>
            </el-table-column>
        </el-table>

        <!-- 只有请求没有报错且结果为空时，才显示空数据提示。 -->
        <el-empty
            v-if="!busy && !errorMessage && filtered.length === 0"
            description="没有匹配账户"
        />

        <!-- 分页总数来自筛选结果，而不是完整 rows。 -->
        <el-pagination
            v-model:current-page="page"
            :page-size="pageSize"
            :total="filtered.length"
            layout="prev, pager, next"
            :disabled="busy"
        />

        <!-- 新增和编辑共用一份草稿与一套校验规则。 -->
        <section
            v-if="editing"
            class="editor"
        >
            <h3>
                {{ editingId === null ? '新增账户' : '编辑账户' }}
            </h3>

            <el-form
                ref="formRef"
                :model="draft"
                :rules="rules"
                label-width="90px"
            >
                <el-form-item
                    label="姓名"
                    prop="name"
                >
                    <el-input
                        v-model="draft.name"
                        placeholder="请输入 2～20 个字符"
                        :disabled="busy"
                    />
                </el-form-item>

                <el-form-item
                    label="状态"
                    prop="active"
                >
                    <el-select
                        v-model="draft.active"
                        :disabled="busy"
                    >
                        <!-- :value 传入真正的布尔值。 -->
                        <el-option label="启用" :value="true" />
                        <el-option label="停用" :value="false" />
                    </el-select>
                </el-form-item>
            </el-form>

            <div class="toolbar">
                <el-button
                    type="primary"
                    :loading="busy"
                    :disabled="busy"
                    @click="submit"
                >
                    保存
                </el-button>

                <el-button
                    :disabled="busy"
                    @click="cancelEdit"
                >
                    取消
                </el-button>
            </div>
        </section>
    </main>
</template>

<style scoped>
.page {
    max-width: 900px;
    margin: 30px auto;
    padding: 20px;
}

.toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin: 16px 0;
}

.message {
    margin: 12px 0;
    color: #409eff;
}

.editor {
    margin-top: 28px;
    padding: 20px;
    border: 1px solid #dcdfe6;
    border-radius: 6px;
}
</style>
```

### 完整程序的运行结果

初次加载后，页面应显示：

    编号 姓名   状态
  ------ ------ ------
       1 张三   启用
       2 李四   停用

第二页显示：

    编号 姓名     状态
  ------ -------- ------
       3 张小明   启用

如果初次加载没有显示数据，先检查浏览器 Console 是否有错误，再检查 `onMounted(load)`、API 导入路径和 `listAccounts()` 的返回值。

### 这份完整程序中几个容易忽略的细节

**第一，`rows`、`filtered` 和 `pageRows` 不是三份需要手动同步的数据。**

`rows` 是页面保存的完整数据；`filtered` 和 `pageRows` 都是 `computed`。只要 `rows`、`applied` 或 `page` 发生变化，计算属性就会重新计算。

**第二，查询条件输入与正式筛选条件分开。**

输入框绑定 `query`，计算属性读取 `applied`。因此用户只输入不点击查询时，列表保持原结果。

**第三，新增和编辑共用同一份表单。**

`editingId === null` 表示新增；`editingId` 是数字表示编辑。模板根据这个条件显示不同标题，提交时把同一个 ID 传给 `saveAccount()`。

**第四，`active` 必须保持布尔类型。**

`<el-option label="停用" :value="false" />` 中的冒号表示动态绑定，传入的是布尔值 `false`。如果写成 `value="false"`，传入的就是字符串 `'false'`，后续的布尔判断会出现错误。

**第五，表格数据不是直接读取 `rows`。**

表格绑定 `:data="pageRows"`，因此它显示的是筛选后的当前页。排查"数据没有显示"时，需要逐层检查 `rows`、`filtered` 和 `pageRows`。

## 四、运行程序并按业务操作验证

### 初次加载

组件挂载后执行：

```ts
onMounted(() => {
    void load();
});
```

`onMounted()` 是 Vue 生命周期钩子，在组件完成挂载后执行回调。回调调用 `load()`，开始读取账户数据。

执行过程：

```text
组件挂载完成
    ↓
onMounted 回调
    ↓
load()
    ↓
busy = true
    ↓
refresh()
    ↓
await listAccounts()
    ↓
rows.value = 账户数组
    ↓
filtered 重新计算
    ↓
pageRows 重新计算
    ↓
表格更新
    ↓
finally：busy = false
```

`void load()` 表示这里不需要在生命周期回调中继续使用 `load()` 返回的 Promise。`load()` 自身已经用 `try...catch...finally` 处理了错误。

### 查询与重置

  操作                       输入     预期结果
  -------------------------- -------- ----------------------------
  初始加载                   无条件   显示全部三条记录
  输入姓名"张"，不点击       张       列表不变
  点击查询                   张       显示张三、张小明
  清空姓名，选择停用并查询   停用     只显示李四
  点击重置                   无条件   恢复全部记录，并回到第一页

注意：`query` 的变化不会直接触发筛选。只有 `search()` 修改 `applied` 后，`filtered` 才会重新计算。

### 新增

新增一条账户：

1.  点击"新增"；
2.  `editingId` 设置为 `null`；
3.  草稿姓名清空，状态默认为启用；
4.  输入"王小明"；
5.  点击保存；
6.  表单校验通过；
7.  `saveAccount(null, draft)` 在 Mock 数据源中新增记录；
8.  页面刷新列表；
9.  编辑区域关闭，页码回到第一页。

新增成功后，页面仍然保留已提交的查询条件。如果当前按"张"查询，新增"王小明"后它不会出现在当前结果中。这不代表保存失败，而是新记录不符合当前筛选条件。点击重置后即可看到它。

### 编辑并取消

1.  点击张三对应的"编辑"；
2.  草稿中回填张三的姓名和启用状态；
3.  把姓名改为"张三修改版"；
4.  不点击保存，直接点击取消；
5.  表格仍显示张三。

原因是输入只修改 `draft`，没有提前修改 `rows` 或 Mock 数据源。

### 编辑并保存

再次编辑张三，输入合法姓名后保存：

1.  姓名先执行 `trim()`；
2.  `validate()` 执行表单校验；
3.  `saveAccount(id, draft)` 按原 ID 修改数据源；
4.  `refresh()` 重新读取账户数组；
5.  `rows` 更新，计算属性重新计算；
6.  表格显示修改后的姓名。

编辑前后的 ID 应保持不变。编辑不是删除旧记录再随意创建一个新 ID。

### 删除

删除操作通过子组件发出目标 ID，父组件接收后调用 `deleteAccount(id)`。删除成功后刷新列表，目标 ID 不再出现。

本例每页两条记录。如果删除了最后一页唯一的记录，刷新后必须保证当前页码仍然合法。综合程序中删除后回到第一页，`refresh()` 还会再次检查页码边界。

### 失败路径

分别测试以下情况：

  输入或操作             预期结果
  ---------------------- ------------------------------------
  姓名为空               表单校验不通过，不调用保存接口
  姓名只有一个字符       不满足最小长度
  姓名只有空格           `trim()` 后为空，不能保存
  姓名为"失败测试"       前端长度校验通过，Mock 主动拒绝
  保存期间再次点击保存   `busy` 阻止重复进入
  保存失败               编辑区保留，草稿保留，`busy` 恢复
  删除不存在的 ID        Mock 抛出"账户不存在"
  删除成功但刷新失败     提示删除已完成，不诱导用户重复删除

## 五、逐函数追踪综合页面

### `load()` 和 `refresh()` 为什么分开

`refresh()` 负责读取最新数组并校正页码；`load()` 负责把一次用户操作组织完整：

-   检查是否已经有操作进行；
-   设置 `busy`；
-   清空旧提示；
-   调用 `refresh()`；
-   捕获错误；
-   在 `finally` 中恢复 `busy`。

保存和删除成功后也需要重新读取数据，因此它们可以直接复用 `refresh()`。

如果 `submit()` 在保存后调用 `load()`，会遇到一个问题：`submit()` 已经把 `busy` 设置为 `true`，而 `load()` 开头又检查 `busy`。此时 `load()` 会直接返回，刷新操作反而没有执行。

这就是为什么要把"内部可复用的刷新步骤"和"完整用户操作入口"分开。

### `beginEdit()` 为什么先 `find()` 再复制字段

```ts
const record = rows.value.find(item => item.id === id);

if (!record) {
    return;
}

draft.name = record.name;
draft.active = record.active;
```

`find()` 返回第一个满足条件的元素；如果没有找到，返回 `undefined`。

因此必须先检查 `record` 是否存在，再读取它的字段。不能假设表格上出现过的记录在任何时刻都一定还存在于数据源中。

本例使用 ID 定位记录，而不是使用"当前表格第二行"。分页、筛选和排序会改变页面行的位置，业务 ID 才是稳定的定位依据。

### `submit()` 中哪一行才真正写入数据

按执行顺序区分：

  代码                               作用                       是否写入数据源
  ---------------------------------- -------------------------- ------------------
  `draft.name = draft.name.trim()`   清理草稿首尾空白           否
  `await formRef.value.validate()`   检查表单字段               否
  `await saveAccount(...)`           调用数据层执行新增或编辑   是
  `saved = true`                     记录写入阶段已成功         否
  `await refresh()`                  重新读取数据并更新页面     读取，不负责写入
  `message.value = ...`              更新页面反馈               否

因此，**表单校验成功、数据写入成功、页面刷新成功，是三个不同阶段。**

排错时要确认失败发生在哪个阶段，不能把后续刷新失败误判为前面的保存失败。

### 保存状态变化表

  时刻           `busy`       `editing`   Mock 数据源   页面 `rows`
  -------------- ------------ ----------- ------------- ----------------
  用户输入草稿   false        true        旧数据        旧数据
  开始提交       true         true        尚未修改      旧数据
  校验不通过     最终 false   true        旧数据        旧数据
  保存接口拒绝   最终 false   true        未完成写入    旧数据
  保存成功       true         false       已更新        等待刷新
  刷新成功       最终 false   false       已更新        最新数据
  刷新失败       最终 false   false       已更新        可能仍是旧数据

最后一行非常重要：**表格仍显示旧数据，不代表写入没有发生。**

如果保存已经成功，但刷新失败，用户再次点击新增，可能产生重复记录。正确做法是明确提示写入已经完成、列表刷新失败，并引导用户重新加载，而不是重新提交新增操作。

### 为什么需要 `saved` 和 `deleted`

```ts
let saved = false;

try {
    await saveAccount(id, payload);
    saved = true;

    await refresh();
} catch (error) {
    if (saved) {
        message.value = '保存已完成，但列表刷新失败';
    } else {
        errorMessage.value = '保存失败';
    }
}
```

`saved` 不是 Vue 响应式状态，它只是当前函数执行期间的普通局部变量，用来记录流程是否已经越过"保存成功"这个阶段。

删除流程中的 `deleted` 作用相同：

-   `deleted === false`：尚未确认删除成功；
-   `deleted === true`：删除函数已经成功返回；
-   如果此后刷新失败，应该报告"删除已完成，但列表刷新失败"。

它们的意义不是多增加两个布尔变量，而是避免把不同业务阶段混成一个结果。

### `busy` 与 `loading` 只是变量名称

本例使用 `busy` 表示操作是否正在进行。把它改名为 `loading`，并不会自动获得任何特殊能力。

真正发挥作用的是三个位置：

1.  函数开头判断 `if (busy.value) return`，阻止重复进入；
2.  按钮、输入框和分页控件绑定 `:disabled="busy"`，阻止用户在操作期间继续修改；
3.  `finally` 中恢复 `busy.value = false`，保证成功和失败后都能继续操作。

只做其中一项是不够的。按钮禁用是界面保护，函数 guard 是逻辑保护，`finally` 是状态恢复。

前端忙碌状态只能减少重复触发，不能替代真实后端的幂等控制。对于转账、支付、订单提交等重要写入操作，后端仍需要依据业务协议防止重复处理。

### `map()`、`filter()` 和 `push()` 在本例中的职责

  方法         本例用途                 返回结果
  ------------ ------------------------ --------------------------
  `map()`      编辑时替换目标记录       新数组，元素数量不变
  `filter()`   删除时排除目标记录       新数组，可能变短
  `push()`     新增时向数据源追加记录   修改原数组，返回新长度
  `find()`     根据 ID 找一条记录       找到的元素或 `undefined`
  `slice()`    取得当前页数据           新数组，不修改原数组

例如：

```ts
// 编辑：只替换 ID 为 2 的记录。
database = database.map(item =>
    item.id === 2
        ? { ...item, name: '新名称' }
        : item
);

// 删除：排除 ID 为 2 的记录。
database = database.filter(item => item.id !== 2);

// 新增：向原数组末尾添加记录。
database.push({
    id: nextId++,
    name: '新账户',
    active: true
});
```

这三种操作的返回和修改方式不同。阅读代码时要分清是"生成新数组后重新赋值"，还是"直接修改原数组"。

### `Math.ceil()` 和 `Math.max()` 怎样保证页码合法

总页数通常按下面的公式计算：

```ts
const totalPages = Math.ceil(total / pageSize);
```

`Math.ceil()` 向上取整。例如每页 2 条：

    总条数 计算              总页数
  -------- --------------- --------
         0 `ceil(0 / 2)`          0
         1 `ceil(1 / 2)`          1
         2 `ceil(2 / 2)`          1
         3 `ceil(3 / 2)`          2
         4 `ceil(4 / 2)`          2
         5 `ceil(5 / 2)`          3

本例把空列表时的可用页码也设为 1：

```ts
const lastPage = Math.max(
    1,
    Math.ceil(filtered.value.length / pageSize)
);
```

`Math.max()` 返回参数中的最大值。因此总页数为 0 时，`lastPage` 仍为 1。

删除记录后，原来的页码可能超出新总页数：

```ts
if (page.value > lastPage) {
    page.value = lastPage;
}
```

这可以避免当前页指向一个已经不存在的页面。

### `slice()` 怎样计算当前页

```ts
const start = (page.value - 1) * pageSize;

return filtered.value.slice(start, start + pageSize);
```

假设每页 2 条：

    当前页   起始下标   结束下标（不包含） 取得的下标
  -------- ---------- -------------------- ------------
         1          0                    2 0、1
         2          2                    4 2、3
         3          4                    6 4、5

`slice(start, end)` 不包含 `end` 对应的下标，也不会修改原数组。

分页数据链应当是：

```text
rows
  ↓ filter
filtered
  ↓ slice
pageRows
  ↓
el-table
```

如果 `filtered` 有数据，但 `pageRows` 为空，先检查当前页码和切片起点，不要立即断定接口没有返回数据。

## 六、独立实验：保存成功，但列表刷新失败

### 实验目的

这一实验专门验证一个重要业务问题：**写入操作已经成功，后续读取却失败时，不能把整个操作简单地报告为失败。**

使用两个文件创建一个确定场景：

-   新增函数先把记录写入内存数据源；
-   新增完成后，把"下一次读取失败"开关打开；
-   第一次读取故意抛出异常；
-   再次手动读取时恢复成功。

本例仍然是浏览器内 Mock，不发送 HTTP。

### 完整接口模块

文件：`src/api/saveRefreshDemo.ts`。

```ts
export interface DemoAccount {
    id: number;
    name: string;
}

let database: DemoAccount[] = [
    { id: 1, name: '初始账户' }
];

let nextId = 2;

// 控制下一次读取是否故意失败。
let rejectNextRead = false;

export async function addDemoAccount(name: string): Promise<void> {
    // 先完成写入。
    database.push({
        id: nextId++,
        name
    });

    // 再让紧接着的下一次读取失败。
    rejectNextRead = true;
}

export async function readDemoAccounts(): Promise<DemoAccount[]> {
    if (rejectNextRead) {
        // 失败一次后立即恢复开关。
        rejectNextRead = false;

        throw new Error('模拟：写入后的首次读取失败');
    }

    // 返回副本，避免外部直接修改数据源。
    return database.map(item => ({ ...item }));
}
```

### 完整页面

文件：`src/App.vue`。

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue';

import {
    addDemoAccount,
    readDemoAccounts
} from './api/saveRefreshDemo';

import type {
    DemoAccount
} from './api/saveRefreshDemo';

const rows = ref<DemoAccount[]>([]);
const message = ref('');
const busy = ref(false);

async function reload(): Promise<void> {
    if (busy.value) {
        return;
    }

    busy.value = true;

    try {
        rows.value = await readDemoAccounts();
        message.value = '列表读取成功';
    } catch (error) {
        message.value =
            error instanceof Error ? error.message : '读取失败';
    } finally {
        busy.value = false;
    }
}

async function save(): Promise<void> {
    if (busy.value) {
        return;
    }

    busy.value = true;

    // 记录新增是否已经完成。
    let saved = false;

    try {
        await addDemoAccount('新账户');
        saved = true;

        // 本次读取会按接口模块中的规则故意失败。
        rows.value = await readDemoAccounts();

        message.value = '保存并刷新成功';
    } catch (error) {
        if (saved) {
            message.value =
                '保存已完成，但刷新失败；请重新读取，勿重复新增';
        } else {
            message.value =
                error instanceof Error ? error.message : '保存失败';
        }
    } finally {
        busy.value = false;
    }
}

onMounted(() => {
    void reload();
});
</script>

<template>
    <h2>保存与刷新分阶段处理</h2>

    <button :disabled="busy" @click="save">
        新增一条
    </button>

    <button :disabled="busy" @click="reload">
        重新读取
    </button>

    <p>{{ message }}</p>

    <ul>
        <li
            v-for="row in rows"
            :key="row.id"
        >
            {{ row.id }}：{{ row.name }}
        </li>
    </ul>
</template>
```

### 按三步复现实验

**第一步：初始加载。**

页面显示 ID 1 的"初始账户"，读取成功，`busy` 最终恢复为 `false`。

**第二步：点击"新增一条"。**

`addDemoAccount()` 已经把 ID 2 的记录写入 `database`，随后 `readDemoAccounts()` 故意失败。页面仍然显示旧的一条记录，但提示"保存已完成，但刷新失败"。

此时：

-   数据源中已经有两条记录；
-   页面 `rows` 仍然是旧数组；
-   `saved` 为 `true`；
-   `busy` 最终恢复为 `false`。

**第三步：点击"重新读取"。**

失败开关已经重置，读取成功，页面显示两条记录。

如果第二步之后再次点击"新增一条"，数据源会再新增一条。这不是 Vue 重复渲染，而是用户再次执行了一次新增操作。

### 为什么不能把刷新失败报告为保存失败

假设页面只显示"保存失败，请重试"，用户可能再次点击新增。

但第一次新增其实已经成功，第二次操作就会再创建一条记录。对于账户、订单、支付等业务，这种错误反馈会造成真实业务风险。

因此要明确区分：

-   业务写入是否成功；
-   后续列表刷新是否成功；
-   页面是否展示了最新数据。

真实后端还需要根据接口协议设计幂等键、重复请求检测或其他防重复机制。前端的 `saved` 标识只负责正确区分本次调用的阶段，不能代替服务端幂等控制。

## 七、需求修改练习与完整解析

本节题目针对前面的五文件综合程序。开始修改前，先保存一份可运行版本。每完成一题，都按验收步骤操作，再继续下一题。

> [!EXERCISE] 增加备注字段，贯通输入、保存和显示
>
> 增加可选备注 `remark`：新增时为空，编辑时回填，保存后能够重新读取，表格显示备注。需要修改哪些文件、字段和函数？不要只添加输入框。
>
> 【答案】
>
> **先明确影响范围。** 备注是可提交、可保存、可读取的业务字段，因此需要检查：
>
> -   账户类型；
> -   草稿类型；
> -   新增草稿初始化；
> -   编辑时的数据回填；
> -   Mock 保存逻辑；
> -   表单输入控件；
> -   表格展示列。
>
> `AccountActions.vue` 和 `main.ts` 不处理账户字段，不需要为备注增加业务逻辑。
>
> **第一步：替换 `src/types/account.ts`。**
>
> ```ts
> export interface Account {
>     id: number;
>     name: string;
>     active: boolean;
>     remark?: string;
> }
>
> export interface AccountDraft {
>     name: string;
>     active: boolean;
>     remark?: string;
> }
> ```
>
> `remark?` 表示备注字段可选，旧记录可以没有备注。这里不要求所有历史记录立即补齐真实备注。
>
> **第二步：修改 `App.vue` 中的草稿声明。**
>
> ```ts
> const draft = reactive<AccountDraft>({
>     name: '',
>     active: true,
>     remark: ''
> });
> ```
>
> **第三步：完整替换 `beginNew()`。**
>
> ```ts
> function beginNew(): void {
>     if (busy.value) return;
>
>     editingId.value = null;
>     draft.name = '';
>     draft.active = true;
>     draft.remark = '';
>
>     editing.value = true;
>     formRef.value?.clearValidate();
> }
> ```
>
> 新增时必须清空备注，避免上一条编辑记录的内容残留。
>
> **第四步：完整替换 `beginEdit()`。**
>
> ```ts
> function beginEdit(id: number): void {
>     if (busy.value) return;
>
>     const record = rows.value.find(item => item.id === id);
>     if (!record) return;
>
>     editingId.value = record.id;
>     draft.name = record.name;
>     draft.active = record.active;
>
>     // 兼容旧记录没有 remark 的情况。
>     draft.remark = record.remark ?? '';
>
>     editing.value = true;
>     formRef.value?.clearValidate();
> }
> ```
>
> `?? ''` 是空值合并运算符。只有左侧为 `null` 或 `undefined` 时才使用右侧空字符串；如果已有备注，即使备注本身是空字符串，也会保留原值。
>
> **第五步：完整替换 `src/api/accounts.ts` 中的 `saveAccount()`。**
>
> ```ts
> export async function saveAccount(
>     id: number | null,
>     draft: AccountDraft
> ): Promise<void> {
>     await delay();
>
>     const name = draft.name.trim();
>
>     if (name.length < 2 || name.length > 20) {
>         throw new Error('姓名长度不符合要求');
>     }
>
>     if (name === '失败测试') {
>         throw new Error('模拟保存失败，请修改后重试');
>     }
>
>     const payload = {
>         name,
>         active: draft.active,
>         remark: draft.remark ?? ''
>     };
>
>     if (id === null) {
>         database.push({
>             id: nextId++,
>             ...payload
>         });
>     } else {
>         const exists = database.find(item => item.id === id);
>
>         if (!exists) {
>             throw new Error('账户不存在');
>         }
>
>         database = database.map(item => {
>             return item.id === id
>                 ? { id, ...payload }
>                 : item;
>         });
>     }
> }
> ```
>
> 原来的 `listAccounts()` 已经通过 `{ ...item }` 复制记录，会自动保留新增的 `remark` 字段。页面 `submit()` 也已经通过 `{ ...draft }` 传递草稿，因此不必再为这两个位置增加重复映射。
>
> **第六步：修改 `App.vue` 模板。**
>
> 在姓名表单项后加入：
>
> ```vue
> <el-form-item label="备注" prop="remark">
>     <el-input
>         v-model="draft.remark"
>         placeholder="请输入备注（可选）"
>     />
> </el-form-item>
> ```
>
> 在表格姓名列后加入：
>
> ```vue
> <el-table-column
>     prop="remark"
>     label="备注"
> />
> ```
>
> 备注是可选字段，不需要加入 `required` 规则。
>
> **验收：**
>
> 1.  新增王小明，备注填写"测试账户"；
> 2.  保存后重置查询，确认表格显示备注；
> 3.  再次编辑，确认备注能够回填；
> 4.  修改备注后取消，表格应保留旧备注；
> 5.  再次编辑并保存，重新加载后应显示新备注。
>
> 本例使用内存 Mock，整页刷新后数据会恢复初始值。这里的"重新加载"指调用列表读取函数，不是刷新浏览器页面。

> [!EXERCISE] 修改姓名匹配规则
>
> 姓名查询由"包含关键词"改为"以关键词开头"。在不改变状态筛选的前提下，给出完整 `filtered` 声明，并说明如何验证。
>
> 【答案】
>
> ```ts
> const filtered = computed(() => {
>     return rows.value.filter(item => {
>         const matchesName = item.name.startsWith(applied.name);
>
>         const matchesStatus =
>             applied.status === '' ||
>             item.active === (applied.status === 'enabled');
>
>         return matchesName && matchesStatus;
>     });
> });
> ```
>
> `startsWith()` 判断字符串是否以指定内容开头，不会修改原姓名。
>
> 验证：
>
> -   查询"张"，应命中张三和张小明；
> -   查询"小明"，不应命中张小明；
> -   查询空字符串，应匹配全部姓名；
> -   再选择"启用"并查询，确认状态条件仍参与。
>
> 只验证一个正例不足以证明"包含"已经变成"前缀"。还要检查原先能够包含匹配、但不以关键词开头的情况。

> [!EXERCISE] 修改姓名长度，并拒绝纯空格
>
> 姓名长度改为 3～30 个字符，纯空格不得保存。写出前端与 Mock 的关键修改，并说明为什么只修改提示文字不够。
>
> 【答案】
>
> **前端校验规则：**
>
> ```ts
> const rules: FormRules<AccountDraft> = {
>     name: [
>         {
>             required: true,
>             message: '请输入姓名',
>             trigger: 'blur'
>         },
>         {
>             min: 3,
>             max: 30,
>             message: '姓名长度为 3～30',
>             trigger: 'blur'
>         }
>     ]
> };
> ```
>
> `submit()` 中保留：
>
> ```ts
> draft.name = draft.name.trim();
> await formRef.value.validate();
> ```
>
> 必须先 `trim()`，再校验。这样纯空格会变成空字符串，无法通过必填校验。
>
> **Mock 数据层校验：**
>
> ```ts
> const name = draft.name.trim();
>
> if (name.length < 3 || name.length > 30) {
>     throw new Error('姓名长度必须为 3～30');
> }
> ```
>
> 只改 `message` 不会改变 `min` 和 `max` 的实际规则；只改前端也不能保证数据层始终遵守规则。真实系统中后端必须独立校验。
>
> 分别验证 2 个字符失败、3 个字符成功、30 个字符成功、31 个字符失败、纯空格失败。新增和编辑都要各测试一次。

> [!EXERCISE] 启用账户禁止删除
>
> 要求启用账户的删除按钮禁用，并且绕过按钮直接调用 Mock 时也必须拒绝。分别修改子组件、父组件传值和数据层。
>
> 【答案】
>
> **第一步：完整替换 `src/components/AccountActions.vue`。**
>
> ```vue
> <script setup lang="ts">
> const props = defineProps<{
>     id: number;
>     busy: boolean;
>     active: boolean;
> }>();
>
> const emit = defineEmits<{
>     (e: 'edit', id: number): void;
>     (e: 'remove', id: number): void;
> }>();
> </script>
>
> <template>
>     <el-button
>         :disabled="props.busy"
>         @click="emit('edit', props.id)"
>     >
>         编辑
>     </el-button>
>
>     <el-button
>         :disabled="props.busy || props.active"
>         @click="emit('remove', props.id)"
>     >
>         删除
>     </el-button>
> </template>
> ```
>
> `props.active` 为 `true` 时，删除按钮禁用；停用账户 `active=false` 时，按钮才可用。
>
> **第二步：修改父组件的操作列。**
>
> ```vue
> <AccountActions
>     :id="scope.row.id"
>     :busy="busy"
>     :active="scope.row.active"
>     @edit="beginEdit"
>     @remove="remove"
> />
> ```
>
> **第三步：完整替换 API 模块中的 `deleteAccount()`。**
>
> ```ts
> export async function deleteAccount(id: number): Promise<void> {
>     await delay();
>
>     const account = database.find(item => item.id === id);
>
>     if (!account) {
>         throw new Error('账户不存在');
>     }
>
>     if (account.active) {
>         throw new Error('启用账户不允许删除');
>     }
>
>     database = database.filter(item => item.id !== id);
> }
> ```
>
> **验收：** 初始张三的删除按钮应禁用，李四的删除按钮可用。再编辑一个账户，把状态从启用改为停用，保存并重新加载列表后，删除按钮才应可用。
>
> 界面禁用负责给用户明确反馈；数据层判断负责拒绝不符合规则的操作。需要注意，本例的 Mock 仍运行在浏览器中，并不具备真实服务端安全边界。真实系统必须由后端重新检查账户状态和用户权限，不能依赖前端按钮禁用保护业务数据。

> [!EXERCISE] 保存成功却看不到新记录
>
> 当前按姓名"张"查询，新增"王小明"后提示成功，但表格中没有新记录。请按顺序排查，不要直接断言响应式失效。
>
> 【答案】
>
> 按数据链逐层检查：
>
> 1.  看 `rows` 是否包含新记录。如果没有，继续检查保存和刷新过程；
> 2.  如果 `rows` 有新记录，看 `filtered` 是否包含它；
> 3.  如果 `filtered` 不包含，检查 `applied.name`；
> 4.  "王小明"不包含"张"，所以在当前条件下被排除是正常结果；
> 5.  如果 `filtered` 有记录但 `pageRows` 没有，再检查当前页码和 `slice()` 的起始位置。
>
> 本例保存后保留已提交的查询条件。点击重置恢复全部记录后，应能找到王小明。不能为了显示新记录而绕过用户已经提交的筛选条件。

> [!EXERCISE] 模拟保存失败后再次提交
>
> 新增姓名"失败测试"，然后把草稿改为"成功测试"再保存。说明两次操作中 `rows`、`draft`、`editing` 和 `busy` 应处于什么状态。
>
> 【答案】
>
> **第一次提交：**
>
> -   前端长度校验通过；
> -   Mock 根据特殊测试值拒绝保存；
> -   数据源没有新增记录，`rows` 不新增；
> -   `draft.name` 仍为"失败测试"；
> -   `editing` 保持 `true`，编辑区域仍然显示；
> -   `catch` 显示模拟错误；
> -   `finally` 将 `busy` 恢复为 `false`。
>
> **第二次提交：**
>
> -   用户把草稿改成"成功测试"；
> -   Mock 保存成功；
> -   `editing` 变为 `false`；
> -   `refresh()` 取得新列表；
> -   `rows` 更新；
> -   `busy` 最终恢复为 `false`。
>
> 如果第一次失败后记录已经出现在表格中，说明页面可能在请求成功前提前修改了列表；如果按钮一直禁用，检查 `finally`；如果草稿丢失，检查是否在保存开始时就无条件关闭编辑区。

> [!EXERCISE] 点击删除没有响应
>
> 子组件发出 `emit('remove', id)`，父组件监听却写成 `@delete="remove"`。给出最短排查路线，并指出修复后还需要验证什么。
>
> 【答案】
>
> 先确认按钮没有被 `busy` 禁用，再确认子组件的点击处理确实发出了 `remove` 事件。随后比对父组件监听名，将 `@delete` 改成 `@remove`。
>
> 修复后继续检查：
>
> 1.  父组件 `remove()` 是否收到数字 ID；
> 2.  `deleteAccount()` 是否收到同一个 ID；
> 3.  数据层是否排除了目标 ID；
> 4.  刷新后 `rows` 是否不再包含目标记录。
>
> 只看到子组件执行 `emit()`，还不能证明删除已经到达数据层。

> [!EXERCISE] 将内存 Mock 替换为真实 HTTP 接口
>
> 假设后端约定：
>
> -   `GET /api/accounts` 返回 `Account[]`；
> -   `POST /api/accounts` 新增；
> -   `PUT /api/accounts/:id` 编辑；
> -   `DELETE /api/accounts/:id` 删除。
>
> 如何保持页面调用方式不变，只替换 API 层？
>
> 【答案】
>
> 保持 `listAccounts()`、`saveAccount()`、`deleteAccount()` 的函数名称、参数和返回约定，替换 `src/api/accounts.ts`。页面仍然调用这三个函数，不需要知道底层由内存 Mock 还是 Axios 完成。
>
> **真实 HTTP 版本的 `src/api/accounts.ts`：**
>
> ```ts
> import axios from 'axios';
> import type { Account, AccountDraft } from '../types/account';
>
> const http = axios.create({
>     baseURL: '/api',
>     timeout: 5000
> });
>
> export async function listAccounts(): Promise<Account[]> {
>     const response = await http.get<Account[]>('/accounts');
>     return response.data;
> }
>
> export async function saveAccount(
>     id: number | null,
>     draft: AccountDraft
> ): Promise<void> {
>     if (id === null) {
>         await http.post('/accounts', draft);
>     } else {
>         await http.put(`/accounts/${id}`, draft);
>     }
> }
>
> export async function deleteAccount(id: number): Promise<void> {
>     await http.delete(`/accounts/${id}`);
> }
> ```
>
> **运行前提：** 只有在后端真实提供这些接口、请求方法、参数结构和响应结构，并且开发代理配置正确时，这份代码才能正常运行。内存 Mock 不会自动创建 `/api/accounts` 这些 HTTP 地址。
>
> 验证时按操作打开 Network：
>
>   ------------------------------------------------------------------------------------------------
>   操作                    预期请求                     重点检查
>   ----------------------- ---------------------------- -------------------------------------------
>   初次加载或重新加载      GET `/api/accounts`          Status、Response 是否为账户数组
>
>   新增                    POST `/api/accounts`         Request Payload 是否包含 `name`、`active`
>
>   编辑                    PUT `/api/accounts/:id`      URL 中的 ID 是否正确，请求体是否正确
>
>   删除                    DELETE `/api/accounts/:id`   URL 中的 ID 是否为目标账户
>   ------------------------------------------------------------------------------------------------
>
> 如果后端实际返回 `{ code, message, data }`，必须按第四天的响应结构处理方式读取业务数据；如果后端采用服务端分页，还需要把查询参数和返回的 `total` 接入分页控件。不能只更换 URL 就宣称已经完成联调。

## 八、面对陌生企业项目的阅读与修改方法

第五天的账户管理案例虽然是一个练习页面，但它训练的阅读顺序可以迁移到真实 Vue 项目。

### 第一步：从入口找到实际页面

先检查：

```text
index.html
    ↓
src/main.ts
    ↓
src/App.vue
    ↓
路由配置（如果使用 Vue Router）
    ↓
实际业务页面
```

不要假定 `App.vue` 一定就是最终业务页面。如果根组件使用 `RouterView`，就要继续检查路由配置，根据当前 URL 找到真正加载的页面组件。

### 第二步：从模板找到业务入口

先阅读 `<template>`，识别：

-   查询按钮；
-   输入框和下拉框；
-   表格；
-   新增、编辑、删除按钮；
-   分页控件；
-   弹窗或编辑区域。

重点寻找 `@click`、`@change`、`@submit`、`v-model`、`v-for`、`v-if` 等绑定。

例如：

```vue
<el-button @click="handleQuery">
    查询
</el-button>
```

这说明用户点击按钮后会调用 `handleQuery()`。接下来应搜索这个函数的定义，而不是直接猜测接口位置。

### 第三步：追踪处理函数使用的数据

找到 `handleQuery()` 后，继续查看：

-   它读取了哪些查询变量；
-   是否有 `trim()`、条件判断或参数转换；
-   是否调用 API 函数；
-   是否修改 `ref` 的 `.value`；
-   是否修改 `reactive` 对象的属性；
-   是否更新了 Pinia Store；
-   是否通过计算属性派生列表。

把每个变量的含义写下来，尤其要区分输入草稿、正式查询条件、接口结果和表格展示数据。

### 第四步：从页面函数找到 API 模块

例如：

```ts
import { getAccounts } from '@/api/accounts';

async function handleQuery(): Promise<void> {
    const result = await getAccounts(query);
    rows.value = result;
}
```

继续打开 `getAccounts()`，确认：

-   请求方法是 GET 还是 POST；
-   请求 URL 是什么；
-   参数放在 `params` 还是请求体；
-   返回值是什么类型；
-   是否经过 Axios 拦截器；
-   是否检查统一业务码；
-   是否对响应结构进行了解包。

不要只根据 API 函数名推断它的行为，要查看函数内部实现。

### 第五步：用 Network 核实真实请求

对于真实 HTTP 请求，打开浏览器 Network 面板，依次检查：

1.  Request URL；
2.  Request Method；
3.  Query String Parameters 或 Payload；
4.  HTTP Status；
5.  Response。

TypeScript 类型只是代码预期的数据结构，真实响应必须以 Network 中的 Response 为准。

如果没有请求记录，先回到事件函数和 API 调用；如果 HTTP 成功但页面没有数据，再检查业务码、响应结构、状态赋值、筛选和分页。

### 第六步：修改需求前先列影响范围

例如新增一个"备注"字段，不能只在模板中增加输入框。至少要检查：

-   类型定义；
-   草稿初始化；
-   编辑回填；
-   表单输入；
-   保存参数；
-   API 或数据层写入；
-   列表响应；
-   表格展示；
-   旧数据缺少该字段时的兼容处理。

修改前先列清单，每改一处都能说明它负责哪一段数据流。

### 第七步：按业务场景验收

不要只验证一次成功操作。至少考虑：

-   正常输入；
-   空值；
-   边界长度；
-   不存在的 ID；
-   请求失败；
-   保存成功但刷新失败；
-   当前查询条件不匹配新数据；
-   分页数据发生变化；
-   用户连续点击；
-   子组件事件没有正确传递。

一次只改变一个因素，才能判断哪个环节导致结果变化。

## 九、常见故障与定位顺序

  ---------------------------------------------------------------------------------------------------
  现象                         优先检查                         可能原因
  ---------------------------- -------------------------------- -------------------------------------
  点击查询没有反应             按钮事件、处理函数               事件没有绑定或函数未执行

  子组件按钮点击后父页面不变   Emit 名称、父监听名称            `remove` 与 `delete` 等事件名不一致

  输入内容后表格立即变化       computed 读取的变量              误用 `query`，没有使用 `applied`

  编辑后取消仍然改变表格       草稿与原记录是否共用对象         直接绑定行对象，未创建草稿副本

  保存失败后按钮一直禁用       `finally`                        忘记恢复 `busy`

  数据源有记录，表格没有       `rows`、`filtered`、`pageRows`   筛选条件排除或页码切片错误

  删除最后一页记录后页面空白   总页数与当前页                   删除后没有校正页码

  状态判断异常                 `true`、`false` 与字符串         `value="false"` 传入字符串

  表单旧错误提示残留           `clearValidate()`                切换草稿时没有清理旧校验状态

  表单引用为空                 `formRef` 与 `v-if`              表单实例尚未创建

  保存成功但页面提示失败       `saved` 标识                     把刷新失败误认为保存失败

  刷新后 Mock 数据消失         数据存放位置                     内存数据随页面重新加载而初始化
  ---------------------------------------------------------------------------------------------------

### 故障排查的固定顺序

遇到"数据没有显示"时，按下面的顺序定位：

```text
用户操作是否触发
    ↓
事件处理函数是否执行
    ↓
API 函数是否被调用
    ↓
数据层是否返回或写入正确数据
    ↓
rows 是否得到正确结果
    ↓
filtered 是否保留目标记录
    ↓
pageRows 是否包含目标记录
    ↓
模板是否绑定了正确变量
```

不要一开始就修改模板，也不要只看到页面空白就认定接口没有返回数据。先找到问题发生在哪一层，再修改对应代码。

## 十、五天课程知识串联

  -------------------------------------------------------------------------------------------------------------------------------------------------
  学习日                  核心内容                                                               在第五天中的应用
  ----------------------- ---------------------------------------------------------------------- --------------------------------------------------
  第一天                  Vue 工程入口、单文件组件、模板语法、响应式基础、条件与列表渲染         页面入口、`v-if`、`v-for`、`v-model`

  第二天                  TypeScript 类型、`ref`、`reactive`、`computed`、表单校验、表格与分页   账户类型、草稿、筛选计算、表单规则、分页

  第三天                  Props、Emit、组件 `v-model`、插槽、生命周期、Composable、Router        行操作组件、事件传递、`onMounted`

  第四天                  Vite、模块组织、Promise、async/await、Axios、Network、Pinia            API 模块、异步操作、请求错误定位、真实 HTTP 替换

  第五天                  需求拆解、完整数据流、业务修改、故障排查与验收                         将前四天知识用于一个完整账户管理页面
  -------------------------------------------------------------------------------------------------------------------------------------------------

### 第五天重点复习的代码表达式

  ------------------------------------------------------------------------------------------------------
  表达式                            含义                                        在案例中的作用
  --------------------------------- ------------------------------------------- ------------------------
  `item.name.includes(keyword)`     判断字符串是否包含关键词                    姓名筛选

  `item.name.startsWith(keyword)`   判断字符串是否以关键词开头                  修改姓名匹配规则

  `array.find(predicate)`           找到第一个满足条件的元素                    按 ID 定位记录

  `array.filter(predicate)`         返回满足条件的元素组成的新数组              筛选和删除

  `array.map(callback)`             根据原数组生成新数组                        替换编辑记录

  `array.push(item)`                向原数组末尾添加元素                        Mock 新增

  `{ ...record }`                   浅复制对象的可枚举自身属性                  创建草稿副本或提交快照

  `value.trim()`                    去掉字符串首尾空白                          姓名清理

  `value ?? fallback`               仅在左侧为 null 或 undefined 时使用默认值   兼容可选备注

  `Math.ceil(value)`                向上取整                                    计算总页数

  `Math.max(a, b)`                  返回较大的数                                保证页码至少为 1

  `array.slice(start, end)`         截取数组片段，不修改原数组                  当前页数据

  `throw new Error(message)`        抛出异常                                    模拟接口拒绝

  `await promise`                   等待 Promise 成功结果，失败时抛出异常       查询、保存、删除

  `finally`                         无论成功或失败都执行                        恢复 `busy`

  `id === null`                     判断是否为新增模式                          区分新增与编辑
  ------------------------------------------------------------------------------------------------------

## 十一、第五天最终验收

### 业务理解验收

  ----------------------------------------------------------------------------------------------
  验收任务                            达标表现
  ----------------------------------- ----------------------------------------------------------
  解释数据来源                        能区分 Mock 的 `database`、页面 `rows`、编辑草稿 `draft`

  解释查询过程                        能说清 `query` 与 `applied` 为什么分开

  解释筛选和分页                      能说明 `rows → filtered → pageRows` 的计算关系

  解释新增与编辑                      能说明 `id === null` 与数字 ID 的区别

  解释取消编辑                        能说明为什么草稿不能直接引用原记录

  解释组件通信                        能追踪子组件 Emit 到父组件处理函数

  解释异常处理                        能说明 `try`、`catch`、`finally` 和 `busy` 的关系

  解释保存与刷新                      能区分写入成功和列表刷新成功
  ----------------------------------------------------------------------------------------------

### 动手修改验收

独立完成以下三项，不查看答案：

1.  增加一个可选字段，并贯通类型、草稿、保存和表格展示；
2.  修改姓名筛选规则，并验证正例与反例；
3.  增加一条删除限制，同时在界面和数据层分别处理。

如果只能照着代码复制，尚未达到独立修改的目标。应先遮住答案，重新完成一次相似需求，再解释每处改动影响了哪一层数据。

### 故障排查验收

至少能独立解释并定位：

-   点击按钮没有产生任何请求或状态变化；
-   子组件 Emit 与父组件监听名称不一致；
-   数据源有记录，但当前筛选结果为空；
-   当前页码超出删除后的总页数；
-   表单校验失败后编辑区应该如何保留；
-   保存成功但刷新失败时，为什么不能提示用户重复提交。

### 后续查阅边界

五天课程的主线目标是建立 Vue 企业项目的阅读与维护路径，不代表已经掌握所有 Vue 工程设计。

复杂 Router 权限设计、Composable 抽象、Pinia 持久化、通用请求封装、复杂弹窗表单、服务端分页、并发控制和完整接口安全设计，都可以在后续实际项目中继续深入。

真实开发中，每次修改仍然需要以需求说明、接口文档、现有工程约定和可复现的验证结果为依据。**能够从需求追到代码、从代码追到数据、从异常追到原因，并独立完成小范围修改，才是本次五天课程真正希望建立的能力。**
