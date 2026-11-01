---
id: vue-course-day-5
title: "Vue 企业开发 · 第五天：账户业务维护实战"
folder: miscellaneous
order: 1105
date: 2026-11-01
updated: 2026-11-01
tags: [Vue, 企业开发, 综合练习]
description: "通过完整账户维护程序练习需求修改、数据流追踪与排错。"
pinned: false
draft: false
---

## 今日目标与范围

今天不增加大型框架。阅读需求 15 分钟，运行并追踪程序 35 分钟，完成修改题 40 分钟，故障排查 20 分钟，验收 10 分钟。先尝试作答，再展开紧随题目的答案。

案例包含查询、状态筛选、分页、内联新增编辑、校验、删除和错误提示。内联表单与弹窗里的业务数据处理相同，先减少界面包装，专注数据流。接口层采用内存 Mock，刷新会恢复初始数据；没有真实 HTTP 请求。第四天的 Axios 示例负责真实 Network 训练，两者不可混称。

### 开始前复习

第二天主线讲过 computed、分页和表单校验；第三天讲过 Props 与 Emit；第四天讲过 async、await 和 finally。本例用 map 替换一条记录、filter 删除记录、push 新增记录。`{ ...record }` 生成扁平对象副本；`throw new Error(...)` 使异步函数失败并进入调用方 catch；`id === null` 表示新增，数字 ID 表示编辑。`Math.max` 选择较大值，用于保证页数至少为 1；`Math.ceil` 向上取整。先理解这些表达式，再运行完整程序。

## 业务约定

账户包含 id、name、active。姓名必填且为 2～20 字符；新增生成 ID，编辑保留 ID。查询按钮提交条件，输入本身不立即查询。取消编辑不修改列表。删除后刷新并退回第一页，避免最后一页被删空。所有数据请求期间禁用操作，并在函数内部再次检查忙碌状态。

输入姓名“失败测试”时，Mock 故意拒绝保存，以验证失败恢复。这个规则只存在于训练环境。

> [!NOTE] 本篇的阅读方式
>
> 主线按当天目标推进，完整解释用于随时回查。遇到新写法时先读它自己的小例与结果，再运行本单元完整文件；不需要把所有例子合并。两小时是主线学习目标，不代表必须在两小时内逐字读完并运行所有对照实验。练习答案紧随题目，完成自己的判断后再展开。

## 实战的学习方法：先改小需求，再阅读完整页面

前四天已经分别学习语法和控件。今天要练习的是：看懂需求，找到相关状态，修改尽可能明确的一段逻辑，验证正常和异常情况。

完整企业页面里功能会相互影响，但学习时不必一上来就同时处理所有功能。下面先完成三个独立需求，每个给出完整文件，再把相同思路放回综合程序。运行一个独立需求时，不必保留另一个需求的 App.vue。

## 需求示范：增加状态查询，并保持点击后才生效

### 先读需求中的两个限制

原页面已有姓名查询。现在新增启用/停用选择，要求两个条件同时满足；用户输入或选择时不立即改变列表，点击查询后才生效。

这要求区分两件事：控件当前值保存在 query；真正筛选使用 applied。如果直接让 computed 读取 query，输入就会立即影响结果，不符合后半项限制。

### 先确定判断规则

姓名条件为空时匹配所有名称，非空时用 includes。状态条件为空时不限制；enabled 对应 true；disabled 对应 false。

```ts
item.name.includes(applied.name) &&
(applied.status === '' || item.active === (applied.status === 'enabled'))
```

外层 && 表示姓名和状态都通过；状态部分的 || 允许全部分支直接通过。不要把两个条件改成外层 ||，否则可能姓名不匹配却仅凭状态匹配就被保留。

### 完整程序：独立查询需求

文件：`src/App.vue`，使用第一天包含 Element Plus 的 main.ts。

```vue
<script setup lang="ts">
import { reactive, computed } from 'vue';
interface Account { id: number; name: string; active: boolean }
const source: Account[] = [
    { id: 1, name: '张三', active: true },
    { id: 2, name: '李四', active: false },
    { id: 3, name: '张小明', active: false }
];
const query = reactive({ name: '', status: '' });
const applied = reactive({ name: '', status: '' });
const filtered = computed(() => source.filter(item =>
    item.name.includes(applied.name) &&
    (applied.status === '' || item.active === (applied.status === 'enabled'))
));
function search(): void {
    applied.name = query.name.trim();
    applied.status = query.status;
}
function reset(): void {
    query.name = '';
    query.status = '';
    search();
}
</script>

<template>
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

### 按操作而不是按代码行验证

| 操作 | query | applied | 结果 |
| --- | --- | --- | --- |
| 初次加载 | 两条件为空 | 两条件为空 | 全部三条 |
| 输入张，选择停用，不点击 | 张、disabled | 仍为空 | 仍三条 |
| 点击查询 | 张、disabled | 张、disabled | 张小明 |
| 把输入改为李，不点击 | 李、disabled | 张、disabled | 仍张小明 |
| 点击重置 | 两条件为空 | 两条件为空 | 全部三条 |

如果第二步立即变成一条，重点检查 computed 是否误读 query；如果第三步仍是三条，检查 search 是否复制了条件；如果结果是李四和张小明，姓名条件可能没有参与，或外层用了 ||。

这个验证表比“能点击、没报错”更能说明需求是否正确完成。

## 需求示范：编辑时取消，不得修改表格

### 为什么直接绑定行对象会提前修改

如果把当前行对象直接保存为 draft，再用 v-model 修改 draft.name，实际上可能修改同一个对象。页面上的表格会在保存前跟着变化，取消只是隐藏编辑区，无法撤回已经改动的数据。

正确做法是分开保存：editingId 标识要修改哪一条；draft 保存可编辑字段副本；保存通过后再按 ID 替换原记录。

### 先看替换规则

```ts
rows.value = rows.value.map(item =>
    item.id === editingId.value
        ? { ...item, name: draft.name }
        : item
);
```

map 为每个元素决定新数组里的对应元素。目标 ID 返回一个带新姓名的新对象，其他记录返回原对象。它不是把所有姓名统一改掉，也不依赖记录当前行号。

### 完整程序：独立编辑与校验

文件：`src/App.vue`。

```vue
<script setup lang="ts">
import { ref, reactive } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
interface Account { id: number; name: string }
interface Draft { name: string }
const rows = ref<Account[]>([
    { id: 101, name: '张三' },
    { id: 102, name: '李四' }
]);
const editingId = ref<number | null>(null);
const draft = reactive<Draft>({ name: '' });
const formRef = ref<FormInstance>();
const rules: FormRules<Draft> = {
    name: [
        { required: true, message: '请输入姓名', trigger: 'blur' },
        { min: 2, max: 20, message: '姓名为 2～20 字符', trigger: 'blur' }
    ]
};
const message = ref('');
function beginEdit(id: number): void {
    const record = rows.value.find(item => item.id === id);
    if (!record) return;
    editingId.value = record.id;
    draft.name = record.name;
    formRef.value?.clearValidate();
    message.value = '';
}
function cancel(): void {
    editingId.value = null;
    message.value = '已取消，原记录未改变';
}
async function save(): Promise<void> {
    if (!formRef.value || editingId.value === null) return;
    draft.name = draft.name.trim();
    try {
        await formRef.value.validate();
        rows.value = rows.value.map(item => item.id === editingId.value
            ? { ...item, name: draft.name } : item);
        editingId.value = null;
        message.value = '已保存';
    } catch {
        message.value = '请修正姓名';
    }
}
</script>

<template>
    <el-table :data="rows" row-key="id">
        <el-table-column prop="id" label="编号" />
        <el-table-column prop="name" label="姓名" />
        <el-table-column label="操作">
            <template #default="scope">
                <el-button @click="beginEdit(scope.row.id)">编辑</el-button>
            </template>
        </el-table-column>
    </el-table>
    <section v-if="editingId !== null">
        <p>正在编辑 ID：{{ editingId }}</p>
        <el-form ref="formRef" :model="draft" :rules="rules">
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

编辑 ID 102 时，editingId=102，draft.name=李四；输入李小明后，只改变 draft，rows 中仍是李四；点击取消，editingId 变为 null，编辑区被移除，表格保持李四。

重新编辑 102，会再次从 rows 复制李四，之前丢弃的李小明不会自动回填。点击保存且校验通过后，map 才产生新数组，ID 102 的 name 更新为李小明。

故意清空姓名后保存，validate 拒绝，map 不执行，editingId 不清空，编辑区保留。这样用户能修正原输入，不必重新选择记录。

### 这个程序还没有接口

保存只更新当前页面 ref，刷新浏览器会恢复初始记录。后面的综合程序把同一保存流程接到 API 模块；界面与草稿原则不变，只是新增等待、失败和刷新结果的步骤。

> [!EXERCISE] 取消之后为什么下次还能恢复
>
> 本例 cancel 没有把 draft.name 重新写成李四，为什么下次编辑仍会显示李四？
>
> 【答案】
>
> beginEdit 每次都从 rows 中找到当前记录并重新赋给 draft。取消只丢弃使用这份草稿的界面；只要草稿没有提前修改 rows，下次初始化自然取得原值。不是 v-if 自动帮你回滚了业务对象。

## 需求示范：子组件只报告删除目标

### 先确定状态的拥有者

列表在父组件中，因此删除后替换列表也应由父组件处理。子组件只显示按钮，接收 ID，并发出 remove 事件。

这样“哪个账户被操作”通过参数传递，“怎样删除和处理失败”留在父端。未来接口替换时，不必让每个行按钮知道 Axios 或 Mock 的细节。

### 完整程序：独立删除组件

文件：`src/components/DeleteAccountButton.vue`。

```vue
<script setup lang="ts">
const props = defineProps<{ id: number }>();
const emit = defineEmits<{ (e: 'remove', id: number): void }>();
function requestRemove(): void {
    emit('remove', props.id);
}
</script>

<template>
    <button @click="requestRemove">删除</button>
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
    rows.value = rows.value.filter(item => item.id !== id);
    message.value = `已删除 ID ${id}`;
}
</script>

<template>
    <ul>
        <li v-for="row in rows" :key="row.id">
            {{ row.name }}
            <DeleteAccountButton :id="row.id" @remove="remove" />
        </li>
    </ul>
    <p>{{ message }}</p>
</template>
```

点击李四后的完整过程是：第二个按钮实例的 props.id=102；它 emit('remove',102)；父 remove 接收 102；filter 保留 id 不等于 102 的记录；rows 赋新数组；v-for 移除李四对应节点。

把父监听错写成 @delete 后，子组件仍会 emit，但父没有监听该名称，列表不会变化。排查应从事件名称与参数开始，不能在 filter 没有执行时先修改筛选表达式。

以上三个独立需求验证清楚后，再阅读下面的综合程序。后面的函数名称更多，但每一项机制都能对应回这些小程序。

## 从需求到代码：先分清三种数据

### 输入数据不等于已保存数据

用户正在输入的内容属于草稿，还不能当作已经保存的账户。假设表格中张三正在被编辑，用户改成李四后取消，列表应该仍显示张三。这就要求草稿和列表记录分开保存。

```ts
const record = { id: 101, name: '张三', active: true };
const draft = { name: record.name, active: record.active };
draft.name = '李四';
console.log(record.name); // 仍为张三
```

这里按字段复制，ID 留给编辑模式变量处理。若写 draft = record 并允许修改同一对象，输入时就污染已保存记录，取消按钮再关闭界面也无法自动恢复。

### 原始列表、筛选列表与当前页

```text
rows（取得的完整记录）
  → filtered（按已提交条件筛选）
    → pageRows（当前页片段）
      → el-table
```

rows 只在加载或刷新成功后替换；filtered 是 computed，不单独保存；pageRows 也是 computed。源数据变化后两个计算结果自然跟随，不需要手工同步三个数组。

### 正在输入的条件与已提交条件

```ts
const query = reactive({ name: '', status: '' });
const applied = reactive({ name: '', status: '' });
```

query 接收控件输入，applied 是上次点击查询时的快照。例如页面先按“张”查出两条，再把输入改为“李”但不点击，表格仍显示“张”的结果。只有 search 把 query 的值复制到 applied，结果才变化。

### 页面状态清单

| 状态 | 内容 | 谁负责修改 |
| --- | --- | --- |
| rows | 已加载账户数组 | refresh |
| query | 用户当前输入的条件 | 表单控件、resetQuery |
| applied | 已应用的条件 | search |
| page | 当前页码 | 分页控件、search、保存和删除后的刷新 |
| editing | 是否显示编辑区 | 新增、编辑、取消、保存成功 |
| editingId | 编辑的目标 ID 或 null | beginNew、beginEdit |
| draft | 当前草稿字段 | 初始化、回填、输入控件 |
| busy | 是否有未完成操作 | load、submit、remove |
| message | 本次操作反馈 | 成功和失败分支 |

读陌生项目时，先做这样的状态清单，再逐个追踪修改入口。变量多本身不是错误，问题在于是否有清楚的职责与关联。

## 先手工走完六个业务过程

### 查询：提交条件后回到第一页

```ts
applied.name = query.name.trim();
applied.status = query.status;
page.value = 1;
```

trim 去掉首尾空白，保留中间空格。状态条件中，空字符串表示全部；enabled 对应 active=true；disabled 对应 active=false。filtered 同时检查姓名和状态，两者都满足才保留。

假设在第二页查询停用账户，总共只剩一条，必须回到第一页；否则切片起点仍为 2，得到空数组。不要只修复页面文字，却忽略页码是筛选链的一部分。

### 新增：显式初始化每个字段

```ts
editingId.value = null;
draft.name = '';
draft.active = true;
editing.value = true;
```

null 明确表示“没有旧记录 ID”。新增不能沿用上次编辑残留的 ID，否则保存会误改旧记录。草稿字段也应显式初始化，不能依赖上一次关闭弹窗时碰巧已经清空。

### 编辑：按 ID 找记录，再复制到草稿

```ts
const record = rows.value.find(item => item.id === id);
if (!record) return;
editingId.value = record.id;
draft.name = record.name;
draft.active = record.active;
```

先确认记录存在，再访问字段。find 的结果不是数组。ID 是稳定业务标识，不能使用“表格第二行”作为目标，因为排序和分页会改变行位置。

### 保存：校验通过后才写入

```ts
draft.name = draft.name.trim();
await formRef.value.validate();
await saveAccount(editingId.value, { ...draft });
```

第一步先清理首尾空白，避免纯空格绕过必填检查；第二步等待校验；第三步才调用保存。`{ ...draft }` 为本次调用创建扁平数据副本，表达提交时的字段快照。

如果 validate 失败，代码直接进入 catch，saveAccount 不会执行。保存失败则保留草稿，用户可修改后重试。只有保存真正成功才关闭编辑区。

### 删除：把目标 ID 一直传到数据层

```text
第二行删除按钮
  → 子 emit('remove', props.id)
    → 父 remove(id)
      → deleteAccount(id)
        → database.filter(item => item.id !== id)
```

整条链都以 ID 确定同一记录。子组件不直接修改 rows，也不导入数据库模块。事件、页面状态和数据源各自承担一段职责。

### 刷新：读取新源数据，再保证页码合法

```ts
rows.value = await listAccounts();
const lastPage = Math.max(1, Math.ceil(filtered.value.length / pageSize));
if (page.value > lastPage) page.value = lastPage;
```

总页数等于匹配条数除以每页条数向上取整；即使没有记录，也用 1 作为本例合法页码。保存和删除还会主动回第一页，使行为更容易预测。

注意 filtered 读取 applied 条件，保存后刷新不等于清空查询。新增记录不符合当前条件时可能暂时不可见，提示应帮助用户理解这个结果。

## Mock 接口怎样模拟业务状态

### 模块内共享数据与页面响应式状态

database 在 api/accounts.ts 的模块顶层创建，是所有接口函数使用的内存数据。它不是 Vue ref，不负责直接驱动页面。页面需要 await listAccounts 取得副本后赋给 rows，才能反映最新结果。

```ts
return database.map(item => ({ ...item }));
```

map 创建新数组，展开语法创建每一条扁平记录的副本。这样页面草稿不会绕开保存函数偷偷修改模拟数据库。若对象有嵌套字段，仍要进一步处理复制边界。

### 延迟只模拟时间，不模拟网络

```ts
function delay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 300));
}
```

Promise<void> 表示完成时不提供业务值，只让调用方等待约 300 毫秒。setTimeout 的延迟不是精确执行保证。这一函数没有 HTTP 传输，所以 Network 不会出现请求。

### 新增与编辑分别怎样写入

新增时使用 nextId 生成新 ID 后 push。编辑时 map 整个数组，只替换与目标 ID 相等的一条，其他记录保留。删除时 filter 排除目标 ID。三种操作都不应把“当前分页索引”当成数据库位置。

### 为什么 Mock 也检查字段

本例模拟数据层的业务拒绝：姓名长度错误或命中特殊失败测试值时 throw Error。真实系统中后端必须独立校验；即使前端曾校验通过，数据层仍可能拒绝权限、冲突或其他业务条件。

下面才将这些过程组合进完整程序。程序的每一处核心机制都已经在前四天讲过，今天重点理解它们的连接关系。


## 完整程序

在第一天创建的练习工程中创建或完整替换下列五个文件。第三天和第四天留下的其他文件可保留，本例未导入它们。若未安装依赖，回到第一天的安装步骤。

### 类型文件

`src/types/account.ts`：

```ts
export interface Account {
  id: number
  name: string
  active: boolean
}
export interface AccountDraft {
  name: string
  active: boolean
}
```

Account 是已保存记录，AccountDraft 是待提交字段，避免把创建时尚不存在的 ID 混入输入表单。

### 内存接口文件

`src/api/accounts.ts`：

```ts
import type { Account, AccountDraft } from '../types/account'
let database: Account[] = [
  { id: 1, name: '张三', active: true },
  { id: 2, name: '李四', active: false },
  { id: 3, name: '张小明', active: true }
]
let nextId = 4
function delay(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 300))
}
export async function listAccounts(): Promise<Account[]> {
  await delay()
  // 返回副本，页面编辑不会直接污染模拟数据库。
  return database.map(item => ({ ...item }))
}
export async function saveAccount(id: number | null, draft: AccountDraft): Promise<void> {
  await delay()
  const name = draft.name.trim()
  if (name.length < 2 || name.length > 20) throw new Error('姓名长度不符合要求')
  if (name === '失败测试') throw new Error('模拟保存失败，请修改后重试')
  if (id === null) {
    database.push({ id: nextId++, name, active: draft.active })
  } else {
    if (!database.find(item => item.id === id)) throw new Error('账户不存在')
    database = database.map(item => item.id === id
      ? { id, name, active: draft.active } : item)
  }
}
export async function deleteAccount(id: number): Promise<void> {
  await delay()
  if (!database.find(item => item.id === id)) throw new Error('账户不存在')
  database = database.filter(item => item.id !== id)
}
```

模块顶层 database 被本模块函数共享，因此多次调用可以看到修改；这与组件局部 ref 不同。它只是练习中的内存数据源。`nextId++` 先使用当前值再递增，不因删除而重复利用已有 ID。

### 行操作组件

`src/components/AccountActions.vue`：

```vue
<script setup lang="ts">
const props = defineProps<{ id: number; busy: boolean }>()
const emit = defineEmits<{
  (e: 'edit', id: number): void
  (e: 'remove', id: number): void
}>()
</script>
<template>
  <el-button :disabled="props.busy" @click="emit('edit', props.id)">编辑</el-button>
  <el-button :disabled="props.busy" @click="emit('remove', props.id)">删除</el-button>
</template>
```

子组件不直接删除数据，只发出目标 ID。父页面负责业务调用，这让调试入口清晰可见。

### 应用入口

`src/main.ts`：

```ts
import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
createApp(App).use(ElementPlus).mount('#app')
```

### 完整页面

`src/App.vue`：

```vue
<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { Account, AccountDraft } from './types/account'
import { listAccounts, saveAccount, deleteAccount } from './api/accounts'
import AccountActions from './components/AccountActions.vue'

const rows = ref<Account[]>([])
const busy = ref(false)
const message = ref('')
const query = reactive({ name: '', status: '' })
const applied = reactive({ name: '', status: '' })
const page = ref(1)
const pageSize = 2
const editing = ref(false)
const editingId = ref<number | null>(null)
const draft = reactive<AccountDraft>({ name: '', active: true })
const formRef = ref<FormInstance>()
const rules: FormRules<AccountDraft> = {
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '姓名长度为 2～20', trigger: 'blur' }
  ]
}
const filtered = computed(() => rows.value.filter(item =>
  item.name.includes(applied.name) &&
  (applied.status === '' || item.active === (applied.status === 'enabled'))
))
const pageRows = computed(() => {
  const start = (page.value - 1) * pageSize
  return filtered.value.slice(start, start + pageSize)
})
function search() {
  if (busy.value) return
  applied.name = query.name.trim()
  applied.status = query.status
  page.value = 1
}
function resetQuery() {
  query.name = ''
  query.status = ''
  search()
}
function beginNew() {
  if (busy.value) return
  editingId.value = null
  draft.name = ''
  draft.active = true
  editing.value = true
  formRef.value?.clearValidate()
}
function beginEdit(id: number) {
  if (busy.value) return
  const record = rows.value.find(item => item.id === id)
  if (!record) return
  editingId.value = record.id
  // 逐字段复制，输入时不修改列表。
  draft.name = record.name
  draft.active = record.active
  editing.value = true
  formRef.value?.clearValidate()
}
async function refresh() {
  rows.value = await listAccounts()
  const lastPage = Math.max(1, Math.ceil(filtered.value.length / pageSize))
  if (page.value > lastPage) page.value = lastPage
}
async function load() {
  if (busy.value) return
  busy.value = true
  message.value = ''
  try { await refresh() }
  catch (error) { message.value = error instanceof Error ? error.message : '加载失败' }
  finally { busy.value = false }
}
async function submit() {
  if (busy.value || !formRef.value) return
  busy.value = true
  let saved = false
  try {
    draft.name = draft.name.trim()
    await formRef.value.validate()
    await saveAccount(editingId.value, { ...draft })
    saved = true
    editing.value = false
    page.value = 1
    await refresh()
    message.value = '保存成功；列表仍按当前查询条件显示'
  } catch (error) {
    message.value = saved ? '保存已完成，但刷新失败，请重新加载' :
      (error instanceof Error ? error.message : '请检查表单字段')
  } finally { busy.value = false }
}
async function remove(id: number) {
  if (busy.value) return
  busy.value = true
  let deleted = false
  try {
    await deleteAccount(id)
    deleted = true
    if (editingId.value === id) editing.value = false
    page.value = 1
    await refresh()
    message.value = '删除成功'
  } catch (error) {
    message.value = deleted ? '删除已完成，但刷新失败，请重新加载' :
      (error instanceof Error ? error.message : '删除失败')
  } finally { busy.value = false }
}
onMounted(load)
</script>

<template>
  <h2>账户管理</h2>
  <el-form :model="query">
    <el-form-item label="姓名"><el-input v-model="query.name" :disabled="busy" /></el-form-item>
    <el-form-item label="状态">
      <el-select v-model="query.status" :disabled="busy">
        <el-option label="全部" value="" />
        <el-option label="启用" value="enabled" />
        <el-option label="停用" value="disabled" />
      </el-select>
    </el-form-item>
  </el-form>
  <el-button :disabled="busy" @click="search">查询</el-button>
  <el-button :disabled="busy" @click="resetQuery">重置</el-button>
  <el-button :disabled="busy" @click="beginNew">新增</el-button>
  <el-button :loading="busy" :disabled="busy" @click="load">重新加载</el-button>
  <p>{{ message }}</p>
  <el-table :data="pageRows" row-key="id" border>
    <el-table-column prop="id" label="编号" />
    <el-table-column prop="name" label="姓名" />
    <el-table-column label="状态">
      <template #default="scope">{{ scope.row.active ? '启用' : '停用' }}</template>
    </el-table-column>
    <el-table-column label="操作">
      <template #default="scope">
        <AccountActions :id="scope.row.id" :busy="busy" @edit="beginEdit" @remove="remove" />
      </template>
    </el-table-column>
  </el-table>
  <el-empty v-if="!busy && filtered.length === 0" description="没有匹配账户" />
  <el-pagination v-model:current-page="page" :page-size="pageSize"
    :total="filtered.length" layout="prev, pager, next" :disabled="busy" />
  <section v-if="editing">
    <h3>{{ editingId === null ? '新增账户' : '编辑账户' }}</h3>
    <el-form ref="formRef" :model="draft" :rules="rules">
      <el-form-item label="姓名" prop="name">
        <el-input v-model="draft.name" :disabled="busy" />
      </el-form-item>
      <el-form-item label="状态" prop="active">
        <el-select v-model="draft.active" :disabled="busy">
          <el-option label="启用" :value="true" />
          <el-option label="停用" :value="false" />
        </el-select>
      </el-form-item>
    </el-form>
    <el-button :loading="busy" :disabled="busy" @click="submit">保存</el-button>
    <el-button :disabled="busy" @click="editing = false">取消</el-button>
  </section>
</template>
```

这里 `:value="false"` 传布尔值；若写 `value="false"` 则传字符串，会破坏 active 的含义。表单通过 v-if 创建，初次 beginNew 时 formRef 尚可能为空，使用可选链跳过清理；新实例本身没有旧校验消息。已有表单切换记录时则清理旧提示。

## 运行与执行链

执行 `npm.cmd run dev`，初始显示第一页两条数据。第二页显示第三条。新增“王小明”后回到第一页；清空查询后可在列表找到新记录。编辑后取消应保持原数据。删除只影响内存模拟数据，刷新浏览器恢复初始记录。

保存链条为：按钮 → submit → 清理姓名 → validate → saveAccount → Mock 更新 → refresh → rows 赋值 → filtered 重新计算 → pageRows 重新计算 → 表格更新。

程序区分“写入失败”和“写入成功但刷新失败”，防止把后者误报为保存失败，诱使用户重复提交。真实后端还需处理鉴权、服务端校验、重复提交和并发冲突，本训练不声称覆盖完整生产安全设计。

## 逐函数阅读综合页面

### load 和 refresh 为什么分开

refresh 只负责“取得最新数组并校正页码”，不自行控制 busy，也不吞掉错误。load 是用户触发的完整操作：检查忙碌、设置 busy、调用 refresh、处理错误、最后恢复状态。

submit 与 remove 成功后也需要刷新，因此复用 refresh。如果它们转而调用 load，load 开头发现 busy 已经为 true，可能直接 return，导致保存后没有真正刷新。

这就是拆分“内部可复用步骤”和“用户操作入口”的原因。它不是为了把一个函数机械拆成两个，而是因为调用场景确实不同。

### beginEdit 为什么先 find，再赋值

```ts
const record = rows.value.find(item => item.id === id);
if (!record) return;
```

先确认当前数据里存在目标，再读取 name 与 active。若记录已被其他流程移除，find 会返回 undefined，直接读 record.name 会出错。即使按钮来自表格，也应保留数据不存在的合理分支。

接下来复制 name 和 active 到 draft，保存 ID 到 editingId。复制普通字符串和布尔值不会把后续输入连回原对象；这与直接让 draft 指向整行对象不同。

### submit 中哪一行才真正写入

`draft.name = draft.name.trim()` 只清理草稿；validate 只检查字段；saveAccount 才把记录写入数据层；refresh 才重新取得写入后的列表；message 只负责反馈。

因此“表单校验通过”“保存成功”“列表刷新成功”是三个不同阶段。排错时标记已完成阶段，就能避免把第二阶段的问题误判为第一阶段问题。

### 保存过程的状态表

| 时刻 | busy | editing | 数据层 | 页面 rows |
| --- | --- | --- | --- | --- |
| 用户输入草稿 | false | true | 旧数据 | 旧数据 |
| 开始提交 | true | true | 尚未修改 | 旧数据 |
| 校验不通过 | 最终 false | 保持 true | 旧数据 | 旧数据 |
| 保存接口拒绝 | 最终 false | 保持 true | 未完成写入 | 旧数据 |
| 保存成功 | true | 改为 false | 已更新 | 等待刷新 |
| 刷新成功 | 最终 false | false | 已更新 | 最新数据 |
| 刷新失败 | 最终 false | false | 已更新 | 可能仍是旧数据 |

最后一行尤其重要：表格旧数据不代表写入没发生。真实系统中，用户重复点击新增可能创建第二条记录，因此提示必须区分阶段。

### remove 为什么也需要 deleted 标识

删除成功后刷新可能失败，逻辑与保存相同。deleted=false 表示还不能确认删除完成；deleteAccount 返回后设为 true；若随后 refresh 抛错，给出“删除已完成，但刷新失败”。

页面不应为了“看起来即时”就在请求前无条件移除目标记录。若要做乐观更新，需要额外设计失败回滚，本课程先采用成功后刷新方式，把数据流保持清晰。

### busy 与 loading 只是命名，不是魔法

这里 busy 是普通 ref<boolean>，名字换成 loading 也不会自动产生特殊能力。真正的作用来自三处：函数开头判断；按钮和输入控件的 disabled 绑定；finally 中恢复为 false。

若漏掉最后一项，页面可能一直不能操作；若只写最后一项而没有 guard，可能重复进入；若只有函数 guard 而没界面提示，用户会不知道点击为什么被忽略。三个位置共同形成可理解的操作状态。

## 独立实验：保存完成，但列表刷新失败

### 实验要解决什么问题

这一点容易只记结论却无法验证。下面用两个文件创建一个确定的场景：每次新增都成功，但紧接着第一次读取故意失败；下一次手动读取又成功。

它仍是浏览器内 Mock，不发送 HTTP。目的是观察阶段，不是新学后端技术。运行此例时，完整替换 App.vue 并创建对应 API 文件即可，保留第一天入口。

### 完整接口模块

文件：`src/api/saveRefreshDemo.ts`。

```ts
export interface DemoAccount {
    id: number;
    name: string;
}
let database: DemoAccount[] = [{ id: 1, name: '初始账户' }];
let nextId = 2;
let rejectNextRead = false;
export async function addDemoAccount(name: string): Promise<void> {
    database.push({ id: nextId++, name });
    rejectNextRead = true;
}
export async function readDemoAccounts(): Promise<DemoAccount[]> {
    if (rejectNextRead) {
        rejectNextRead = false;
        throw new Error('模拟：写入后的首次读取失败');
    }
    return database.map(item => ({ ...item }));
}
```

addDemoAccount 先把新记录放进 database，再把 rejectNextRead 设为 true。读取函数遇到 true 时，先重置开关再抛错，因此只失败一次。数据库里的新记录不会因为这次读失败自动撤销。

### 完整页面：分别处理保存和读取

文件：`src/App.vue`。

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { addDemoAccount, readDemoAccounts } from './api/saveRefreshDemo';
import type { DemoAccount } from './api/saveRefreshDemo';
const rows = ref<DemoAccount[]>([]);
const message = ref('');
const busy = ref(false);
async function reload(): Promise<void> {
    if (busy.value) return;
    busy.value = true;
    try {
        rows.value = await readDemoAccounts();
        message.value = '列表读取成功';
    } catch (error) {
        message.value = error instanceof Error ? error.message : '读取失败';
    } finally {
        busy.value = false;
    }
}
async function save(): Promise<void> {
    if (busy.value) return;
    busy.value = true;
    let saved = false;
    try {
        await addDemoAccount('新账户');
        saved = true;
        rows.value = await readDemoAccounts();
        message.value = '保存并刷新成功';
    } catch (error) {
        if (saved) {
            message.value = '保存已完成，但刷新失败；请重新读取，勿重复新增';
        } else {
            message.value = error instanceof Error ? error.message : '保存失败';
        }
    } finally {
        busy.value = false;
    }
}
onMounted(reload);
</script>

<template>
    <button :disabled="busy" @click="save">新增一条</button>
    <button :disabled="busy" @click="reload">重新读取</button>
    <p>{{ message }}</p>
    <ul><li v-for="row in rows" :key="row.id">{{ row.id }}：{{ row.name }}</li></ul>
</template>
```

### 按三步复现实验

第一步初始加载：显示 ID 1 的初始账户，busy 最终 false。

第二步点击新增一条：数据库已经有 ID 2，但紧接着读取失败；页面仍显示旧的一条，并提示保存已完成、请重新读取。saved=true 让 catch 知道写入阶段已经过去。

第三步点击重新读取：开关已重置，读取成功，页面显示两条。不要再次点击新增来“重试刷新”，否则数据库真的会再加一条，这不是 Vue 重复渲染，而是你再次执行了新增操作。

> [!EXERCISE] 删掉 saved 标识会丢失什么信息
>
> 若 catch 永远显示保存失败，而没有 saved 判断，用户可能怎样操作？它为什么有业务风险？
>
> 【答案】
>
> 用户可能以为上一条没有写入，再点新增。数据层其实已保存第一条，第二次会产生另一条。标记阶段是为了准确反馈，不是为了多加一个布尔变量；真实写入接口还应依据协议提供重复请求保护。

## 用操作表验证完整程序

### 先运行成功路径

| 操作 | 输入或前提 | 应看到的结果 |
| --- | --- | --- |
| 初次加载 | 默认三条记录 | 第一页两条，第二页一条 |
| 输入不查询 | 输入姓名“张” | 表格仍保持上次已应用结果 |
| 查询 | 姓名为“张” | 张三、张小明两条 |
| 状态查询 | 清空姓名，选停用并查询 | 只显示李四 |
| 重置 | 当前有条件 | 输入恢复默认，显示全部记录第一页 |
| 新增 | 王小明、启用 | 成功后关闭表单，重置查询后可以找到 |
| 编辑并取消 | 改姓名但不保存 | 列表保留原名 |
| 编辑并保存 | 合法姓名 | 仍为原 ID，姓名改变 |
| 删除 | 删除目标行 | 只移除目标 ID，页码合法 |

每次只改变一个条件，才能判断是哪一步影响结果。不要一次修改姓名、状态、分页和接口结构后才统一试运行。

### 再运行失败路径

空姓名提交应触发校验，接口不能新增记录；一个字不满足长度，仍保留表单；纯空格经过 trim 后为空，必须被拒绝；姓名“失败测试”通过前端长度规则，但由 Mock 返回模拟保存失败。

失败后检查 busy 是否恢复、草稿是否保留、列表是否没有提前写入，以及修改姓名后是否可以重试。这些检查直接验证 try/catch/finally 的业务意义。

### 区分写入成功和刷新成功

```ts
let saved = false;
await saveAccount(id, payload);
saved = true;
await refresh();
```

如果 refresh 失败，saved 已经为 true。应告诉用户“写入完成但刷新失败”，不能简单报告“保存失败，请重试”。否则用户可能重复新增。完整页面使用 saved/deleted 标识区分这两个阶段。

在本例中可以临时把 listAccounts 的函数体改成 `throw new Error('模拟加载失败')`，验证加载失败提示与 busy 恢复。要验证“保存成功后刷新失败”，应在首次加载之后才修改模拟条件；完成实验后恢复原函数，避免把故意的故障保留进正常案例。

### 避免编辑状态与删除状态冲突

如果用户删除的正是当前草稿对应记录，程序将 editing 设为 false，避免留下一个对不存在记录的编辑界面。若删除其他行，当前草稿可以保留。这是业务选择，不是 Vue 自动实现的行为。

### 本例选择了怎样的并发策略

busy=true 时禁用查询、编辑、保存和删除，并由函数 guard 再次保护。它把操作串行化，便于训练执行链。真实系统若允许并行查询，需要处理旧响应覆盖新响应；若允许并发写入，需要服务端幂等或冲突检测。不能仅靠前端按钮禁用保证所有请求永远不重复。

## 遇到问题时按层定位

### 点击后没有变化

先确认按钮未被 busy 禁用，再确认子组件 emit 和父监听一致，然后在父函数开头断点。尚未进入函数时不要先修改筛选条件或数据库。

### 状态变了但列表没变

检查修改的是 draft、rows 还是 database。draft 是未提交草稿；database 是 Mock 数据源；表格最终读取的是 pageRows。必须沿 refresh → rows → filtered → pageRows 验证，不能只看某个对象字段已经改变。

### 数据存在但当前页为空

先清空查询排除筛选，再回第一页排除切片，最后核对 rows 数组。不要看到“无数据”就立即断言接口失败。

### 类型报错先看形状

Account 是一条记录，Account[] 是记录数组；number 与字符串数字不同；boolean false 与字符串 'false' 不同；find 可能返回 undefined。应修复来源、字段和分支判断，不要用 any 让错误消失。

### 表单错误提示残留

确认新记录字段已赋值，再清理旧校验。clearValidate 不会清空数据，resetFields 不一定恢复当前编辑快照。v-if 初次创建表单前，formRef 可能不存在；可选链只是避免调用空实例，不会替你完成初始化。

## 做需求修改前先列影响范围

例如增加备注，不是只加一个输入框，还要考虑类型、草稿初始化、编辑回填、提交数据、模拟数据层和列表展示。先列影响范围，再逐处修改，每一步都能说明它解决哪个输入或输出问题。

练习中使用的 `record.remark ?? ''` 是空值合并：只有左侧为 null 或 undefined 时才取右值，已有空字符串不会被当成不存在。它只处理可选字段的默认展示，不涉及新的 Vue 核心机制。


## 需求修改练习与完整解析

本节题目针对前面的五文件综合程序，不针对三个独立需求示范。先保存可运行版本，每完成一题都按验收步骤操作，再继续下一题。

> [!EXERCISE] 增加备注字段，贯通输入、保存和显示
>
> 增加可选备注 remark：新增时为空，编辑时回填，保存后能重新读到，表格显示备注。哪些文件、字段和函数需要一起修改？请不要只加输入框。
>
> 【答案】
>
> **先明确影响范围。** 备注是一项可提交、可保存、可读取的业务字段，因此需要同步类型、草稿初始化、编辑回填、Mock 写入和模板显示。行操作组件和 main.ts 不处理该字段，无须为它增加业务逻辑。
>
> **类型文件 src/types/account.ts 的完整替换内容：**
>
> ```ts
> export interface Account {
>     id: number;
>     name: string;
>     active: boolean;
>     remark?: string;
> }
> export interface AccountDraft {
>     name: string;
>     active: boolean;
>     remark?: string;
> }
> ```
>
> 问号表示旧记录可以没有备注。新增字段没有要求旧记录必须补一条真实内容，页面回填时将缺省值转换成空字符串即可。
>
> **修改 App.vue 中草稿声明：**
>
> ```ts
> const draft = reactive<AccountDraft>({
>     name: '',
>     active: true,
>     remark: ''
> });
> ```
>
> **完整替换 beginNew：**
>
> ```ts
> function beginNew(): void {
>     if (busy.value) return;
>     editingId.value = null;
>     draft.name = '';
>     draft.active = true;
>     draft.remark = '';
>     editing.value = true;
>     formRef.value?.clearValidate();
> }
> ```
>
> **完整替换 beginEdit：**
>
> ```ts
> function beginEdit(id: number): void {
>     if (busy.value) return;
>     const record = rows.value.find(item => item.id === id);
>     if (!record) return;
>     editingId.value = record.id;
>     draft.name = record.name;
>     draft.active = record.active;
>     draft.remark = record.remark ?? '';
>     editing.value = true;
>     formRef.value?.clearValidate();
> }
> ```
>
> `?? ''` 只在 remark 为 null 或 undefined 时补空字符串，已有备注原样保留。新增清空与编辑回填是两个入口，都要覆盖，否则容易把上一条记录的备注带给下一条。
>
> **Mock 文件 src/api/accounts.ts 中完整替换 saveAccount：**
>
> ```ts
> export async function saveAccount(id: number | null, draft: AccountDraft): Promise<void> {
>     await delay();
>     const name = draft.name.trim();
>     if (name.length < 2 || name.length > 20) throw new Error('姓名长度不符合要求');
>     if (name === '失败测试') throw new Error('模拟保存失败，请修改后重试');
>     const payload = {
>         name,
>         active: draft.active,
>         remark: draft.remark ?? ''
>     };
>     if (id === null) {
>         database.push({ id: nextId++, ...payload });
>     } else {
>         if (!database.find(item => item.id === id)) throw new Error('账户不存在');
>         database = database.map(item => item.id === id
>             ? { id, ...payload } : item);
>     }
> }
> ```
>
> 原 listAccounts 已按 `{ ...item }` 复制记录，会保留 remark，不必再增加一层手动映射。submit 已用 `{ ...draft }` 发送草稿，因此也会包含 remark。判断哪些位置已经能够自然传递新字段，避免为了“全部改一遍”而增加多余代码。
>
> **模板修改有两处。** 在编辑表单姓名项后加入：
>
> ```vue
> <el-form-item label="备注" prop="remark">
>     <el-input v-model="draft.remark" />
> </el-form-item>
> ```
>
> 在表格姓名列后加入：
>
> ```vue
> <el-table-column prop="remark" label="备注" />
> ```
>
> 备注是可选字段，不加入 required 规则。若业务以后要求长度上限，再增加对应规则与数据层检查。
>
> **验收：** 新增王小明并填“测试账户”；保存后重置查询，找到该记录并确认备注列；再次编辑确认备注回填；改备注后取消，表格应保留旧备注；再次编辑后保存，重新加载应看到新备注。浏览器整页刷新会重置本例内存 Mock，不能把它当成持久化数据库。

> [!EXERCISE] 修改姓名匹配规则
>
> 姓名查询由“包含关键词”改为“以关键词开头”。在不改变状态筛选的前提下给出完整 filtered 声明，并说明验证数据。
>
> 【答案】
>
> ```ts
> const filtered = computed(() => rows.value.filter(item =>
>     item.name.startsWith(applied.name) &&
>     (applied.status === '' || item.active === (applied.status === 'enabled'))
> ));
> ```
>
> startsWith 只判断前缀，不修改原姓名。初始记录中查询张，应命中张三和张小明；查询小明，不应命中张小明；空关键词仍匹配全部姓名。再选择启用并查询，确认状态条件仍参与。只检查一个正例不足以证明“包含”已变为“前缀”。

> [!EXERCISE] 修改姓名长度，并拒绝纯空格
>
> 姓名改为 3～30 字符，纯空格不得保存。写出前端与 Mock 的关键修改，并说明为什么只改提示文字不够。
>
> 【答案】
>
> 前端 rules 的完整 name 规则改为：
>
> ```ts
> const rules: FormRules<AccountDraft> = {
>     name: [
>         { required: true, message: '请输入姓名', trigger: 'blur' },
>         { min: 3, max: 30, message: '姓名长度为 3～30', trigger: 'blur' }
>     ]
> };
> ```
>
> submit 保留 `draft.name = draft.name.trim()`，并放在 validate 之前；Mock 中改为：
>
> ```ts
> const name = draft.name.trim();
> if (name.length < 3 || name.length > 30) {
>     throw new Error('姓名长度必须为 3～30');
> }
> ```
>
> 只改 message 不会改变 min/max；只改前端不保证数据层规则一致。分别验证 2 字符失败、3 字符成功、30 字符成功、31 字符失败、纯空格失败。新增和编辑都使用同一提交链，两种模式各验一次。

> [!EXERCISE] 启用账户禁止删除
>
> 要求启用账户的删除按钮禁用，并且绕过按钮直接调用 Mock 时也必须拒绝。分别修改子组件、父传值和数据层。
>
> 【答案】
>
> src/components/AccountActions.vue 完整替换为：
>
> ```vue
> <script setup lang="ts">
> const props = defineProps<{ id: number; busy: boolean; active: boolean }>();
> const emit = defineEmits<{
>     (e: 'edit', id: number): void;
>     (e: 'remove', id: number): void;
> }>();
> </script>
>
> <template>
>     <el-button :disabled="props.busy" @click="emit('edit', props.id)">编辑</el-button>
>     <el-button :disabled="props.busy || props.active"
>         @click="emit('remove', props.id)">删除</el-button>
> </template>
> ```
>
> 父表格操作列中改成：
>
> ```vue
> <AccountActions :id="scope.row.id" :busy="busy" :active="scope.row.active"
>     @edit="beginEdit" @remove="remove" />
> ```
>
> API 模块完整替换 deleteAccount：
>
> ```ts
> export async function deleteAccount(id: number): Promise<void> {
>     await delay();
>     const account = database.find(item => item.id === id);
>     if (!account) throw new Error('账户不存在');
>     if (account.active) throw new Error('启用账户不允许删除');
>     database = database.filter(item => item.id !== id);
> }
> ```
>
> 验证初始张三按钮禁用，李四可删；再编辑一个账户状态，从启用改为停用，保存并刷新列表后删除按钮才可用。界面禁用负责反馈，数据层判断负责规则，二者职责不同；真实系统还必须由服务端检查。

## 故障排查练习与验证路径

> [!EXERCISE] 保存成功却看不到记录
>
> 当前按姓名张查询，新增王小明后提示成功，但表格中没有它。请按顺序排查，不得直接断言响应式失效。
>
> 【答案】
>
> 首先看 rows 是否包含新记录；若没有，继续追保存结果和 refresh；若有，再看 filtered；若 filtered 没有，核对 applied.name，王小明不含张，排除是正常结果；若 filtered 有而 pageRows 没有，再核对页码和切片。
>
> 本例保存后仍保留已应用查询条件。点击重置恢复全部记录后，应能找到王小明。正确反馈应说明保存成功且列表仍按当前条件展示，而不是为了显示新记录偷偷绕过筛选。

> [!EXERCISE] 模拟失败后再次保存
>
> 新增失败测试，随后改成成功测试再保存。说明每次 rows、draft、editing、busy 应处于什么状态。
>
> 【答案】
>
> 首次：前端长度通过，Mock 拒绝，rows 不新增；draft 仍为失败测试，editing 仍为 true；catch 显示模拟错误，finally 恢复 busy=false。第二次：草稿改为成功测试，保存成功，editing=false；刷新取得新 rows；busy 最终恢复 false。
>
> 如果第一次失败后记录已在表格出现，说明界面可能在请求成功前提前写入；如果按钮一直禁用，检查 finally；如果草稿丢失，检查是否在请求前无条件关闭编辑区。

> [!EXERCISE] 点击删除没有响应
>
> 子组件 emit('remove', id)，父监听写为 @delete="remove"。请给出最短排查路线，并指出修复后还需要验证什么。
>
> 【答案】
>
> 确认按钮可用；确认子点击处理确实发出 remove；比对父监听名；改为 @remove。然后在父 remove 处确认收到数字 ID，在 deleteAccount 处确认同一 ID，最后检查刷新后的 rows 是否排除了目标。只看到子 emit 被执行，还不能证明删除已经到达数据层。

> [!EXERCISE] 切换真实 HTTP 接口
>
> 后端约定 GET /api/accounts 返回 Account[]，POST /api/accounts 新增，PUT /api/accounts/:id 编辑，DELETE /api/accounts/:id 删除。怎样保持页面调用不变并替换接口层？
>
> 【答案】
>
> 保持 listAccounts、saveAccount、deleteAccount 的函数名、参数及返回约定，完整替换 src/api/accounts.ts。下面只有在该后端确实存在且代理配置正确时才能运行；本机内存 Mock 不会自动生成这些 HTTP 地址。
>
> ```ts
> import axios from 'axios';
> import type { Account, AccountDraft } from '../types/account';
> const http = axios.create({ baseURL: '/api', timeout: 5000 });
> export async function listAccounts(): Promise<Account[]> {
>     const response = await http.get<Account[]>('/accounts');
>     return response.data;
> }
> export async function saveAccount(id: number | null, draft: AccountDraft): Promise<void> {
>     if (id === null) {
>         await http.post('/accounts', draft);
>     } else {
>         await http.put(`/accounts/${id}`, draft);
>     }
> }
> export async function deleteAccount(id: number): Promise<void> {
>     await http.delete(`/accounts/${id}`);
> }
> ```
>
> 验证时按操作打开 Network：查询看 GET 与响应数组；新增看 POST 请求体是否含 name、active；编辑看 PUT 的路径 ID 与请求体；删除看 DELETE 的 ID。失败时确认 catch 提示和 busy 恢复。
>
> 若实际响应为 `{ code, data }`，必须按第四天方式处理包裹层；若后端分页，要改查询参数与返回结构，并把后端 total 交给分页控件。不能只更换 URL 就宣称联调完成。

## 面对陌生项目的独立练习

选一个已有 Vue 3 项目，只做一个低影响修改，例如增加只读表格列或调整必填提示。先找到入口和路由，再列页面状态来源，找到 API 模块与响应映射位置，最后修改并验证。

记录以下证据：目标文件路径、按钮或字段的模板位置、处理函数、真实响应结构、修改前后行为。涉及接口时保留 Network 中方法、URL、参数和响应的观察结果；不要把本例 Mock 的固定协议直接套到其他项目。

如果项目采用 Pinia，确认数据究竟来自 Store 还是页面 ref。若页面由多个子组件组成，继续检查 Props 与 Emit；若逻辑抽进 Composable，沿返回的状态与方法向下追踪。文件更多不意味着数据流无法理解，仍然是前四天相同的阅读步骤。

## 五天最终验收

| 验收任务 | 可观察证据 |
| --- | --- |
| 找到入口和目标页面 | 说出 index.html、main.ts、App.vue，以及有路由时的映射 |
| 识别数据归属 | 指出 rows 是页面状态，draft 是编辑草稿，props 是父输入，Store 是共享状态 |
| 追踪组件通信 | 逐步解释子 remove 事件怎样触发父删除函数 |
| 修改小型需求 | 完成备注字段或校验范围修改，并覆盖新增与编辑 |
| 排查数据未显示 | 分别检查响应结构、赋值、筛选与页码 |
| 验证接口失败 | 能展示错误信息、恢复按钮，并避免误报重复提交 |

独立完成字段修改、失败恢复、通信排错三项后，再进入陌生项目练习。若只能照着答案复制，应回到对应单元再做一次相似修改，不以阅读完篇幅代替掌握。

## 后续查阅边界

十小时主线建立维护路径；复杂 Router 配置、Composable 设计、Pinia 持久化、通用请求封装、复杂弹窗表单属于后续深入。原计划中的关键词已分布在前四天主线和拓展区，不能把“见过一个 API”当成“已经能够独立设计”。真实企业开发中，每次修改仍需依据接口文档、现有工程约定和可复现的验证结果。
