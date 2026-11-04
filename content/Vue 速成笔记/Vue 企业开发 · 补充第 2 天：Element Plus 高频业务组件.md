---
date: 2026-11-03
tags: [Vue, TypeScript, Element Plus, Dialog, MessageBox, DatePicker, Tabs, Table]
description: "通过银行账户和交易查询场景，学习弹窗、消息确认、表单选项、日期区间、标签页、加载状态和表格批量操作。"
draft: false
---

## 学习目标与时间安排

前面的课程已经学会 `ref()`、`reactive()`、`computed()`、`v-model`、Props、Emit 和 Element Plus 的基础表单、表格。现在考虑一个账户管理页面：点击“修改账户”弹出表单，保存时出现操作提示；删除账户前需要再次确认；查询交易记录时要选择日期区间；不同类型的交易放在不同标签页；数据正在读取时要明确显示加载状态；表格需要支持勾选多条记录。

这些需求都很常见，但需要的不只是知道某个标签的名字。还要能回答：**它接收什么数据、用哪个事件通知页面、关闭时是否保留草稿，以及数据提交给接口时究竟是什么类型。**

本日使用 Vue 3 + TypeScript + Element Plus 2.6 及以上版本。为避免凭空增加后端依赖，所有主线示例使用组件内的模拟业务数据；只有注明“模拟异步”的例子才会通过 Promise 等待，**不会自动发送 HTTP 请求**。

| 学习内容 | 建议时间 | 学习重点 |
| --- | ---: | --- |
| `el-dialog` 弹窗表单 | 20 分钟 | 显示控制、草稿、具名插槽、关闭处理 |
| `ElMessage` 与 `ElMessageBox` | 15 分钟 | 结果提示与二次确认，区分取消和失败 |
| Radio、Checkbox、Switch | 20 分钟 | 单选、多选、布尔开关、值类型 |
| `el-date-picker` | 20 分钟 | 单日期、日期区间、`value-format` |
| `el-tabs` / `el-tab-pane` | 15 分钟 | 标签名称、当前激活页、切换事件 |
| `v-loading` | 10 分钟 | 请求开始显示，结束关闭 |
| 表格多选与排序 | 20 分钟 | `selection-change`、本地排序、远程排序的区别 |
| **主线合计** | **120 分钟** | |

表单自定义异步校验、弹窗高级关闭控制、复杂组件联动等内容放在后面的拓展章节，不计入主线两小时。

### 运行方式

继续使用之前创建的 Vue 3 + TypeScript + Vite 项目。如果还没有安装 Element Plus，在项目根目录执行：

```bash
npm install element-plus
```

所有主线示例都沿用下面的应用入口。文件：`src/main.ts`。

```ts
import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import App from './App.vue';

// 先安装组件库，再把根组件挂载到页面。
createApp(App).use(ElementPlus).mount('#app');
```

`createApp(App)` 创建 Vue 应用；`.use(ElementPlus)` 注册组件库；`.mount('#app')` 将应用挂载到 `index.html` 中的 `<div id="app"></div>`。

项目中如果已经注册了 Router、Pinia 或其他插件，应保留现有入口配置，不必覆盖成这个最小版本。

在项目根目录执行：

```bash
npm run dev
```

**例子使用约定：** 除非明确指出需要多个文件，本日每一节的“完整程序”都可以单独替换 `src/App.vue` 运行。各节的 `App.vue` 是互相独立的，不要把多个 `<script setup>` 合并到同一个文件。

### 先认识组件库 API 的三种形态

今天会同时看到三种形式：

- **模板组件：** 例如 `<el-dialog>` 和 `<el-date-picker>`，在模板中声明，主要通过 Props（属性）和 Emit（事件）交互。
- **函数式服务：** 例如 `ElMessage.success('保存成功')`，在 JavaScript 或 TypeScript 函数中调用，不需要在模板中写一个 `<el-message>` 标签。
- **指令：** 例如 `v-loading="busy"`，写在现有元素或组件上，让其根据绑定的布尔值显示加载遮罩。

即使都来自 Element Plus，它们的调用方式也不同。先判断是“组件、服务还是指令”，再去查相应属性或参数，就不会把用法混在一起。

## 对话框：`el-dialog` 实现账户编辑弹窗

### 为什么使用 Dialog

第五天的账户管理案例把编辑表单直接写在页面下面，但很多企业页面会把新增、修改、查看详情放在弹窗中。这样用户不用离开当前列表，就能完成一次相对独立的操作。

`<el-dialog>` 是 Element Plus 提供的**对话框组件**。它负责弹窗的标题、遮罩、关闭按钮和内部内容区域，而表单字段、校验和保存逻辑仍然需要我们自己编写。

最基本的结构是：

```vue
<el-dialog v-model="visible" title="账户编辑">
    <p>这里是弹窗正文</p>

    <template #footer>
        <el-button @click="visible = false">取消</el-button>
    </template>
</el-dialog>
```

逐个理解：

- `v-model="visible"` 把弹窗显示状态与父组件变量双向绑定。`visible` 为 `true` 时打开，关闭后变为 `false`。
- `title` 是弹窗标题。
- `<template #footer>` 是具名插槽，表示这段按钮模板放到 Dialog 的底部区域；插槽已经在第三天学习过。
- `visible = false` 是模板中的赋值表达式。模板能自动解包 `ref`，所以这里不写 `.value`；但在 `<script setup>` 的函数中应写 `visible.value = false`。

### Dialog 常用属性与事件

| 写法 | 含义 | 常见用途 |
| --- | --- | --- |
| `v-model="visible"` | 控制显示与隐藏 | 编辑、新增、详情弹窗 |
| `title="..."` | 设置标题 | 标明当前办理业务 |
| `width="520px"` | 设置弹窗宽度 | 控制表单排版 |
| `:close-on-click-modal="false"` | 点击遮罩不关闭 | 防止误操作丢失草稿 |
| `:close-on-press-escape="false"` | 按 Esc 不关闭 | 避免业务表单意外退出 |
| `destroy-on-close` | 关闭时销毁默认插槽的内容 | 关闭后不保留某些子组件内部状态 |
| `@open` / `@closed` | 弹窗开始打开 / 完全关闭后的事件 | 做初始化日志、关闭收尾 |
| `:before-close="handler"` | 内置关闭操作前调用处理函数 | 判断是否允许关闭；需要执行回调 `done()` 才真正关闭 |
| `#footer` | 底部具名插槽 | 自定义取消、保存按钮 |

本节先学习确定、直观的关闭方式：业务按钮由页面主动设置 `visible.value = false`；重要表单禁止点击遮罩或 Esc 直接关闭。`before-close` 的使用细节放在拓展部分。

### 业务草稿与原记录要分开

假设列表中保存：

```ts
const account = { id: 101, name: '储蓄账户', active: true };
```

打开弹窗后，不应该直接让输入框修改 `account.name`。因为用户还没有点击保存，表格就会跟着变化；此时再点击取消，也无法自动撤销已经修改的对象。

应先复制需要编辑的字段到草稿：

```ts
const draft = reactive({ name: '', active: true });

draft.name = account.name;
draft.active = account.active;
```

编辑时只修改 `draft`，保存成功后才修改原记录。这个原则和第五天综合练习一致，在弹窗里尤其重要。

### 完整程序：新增与编辑账户弹窗

文件：`src/App.vue`。

```vue
<script setup lang="ts">
import { ref, reactive } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';

interface Account {
    id: number;
    name: string;
    active: boolean;
}

interface AccountDraft {
    name: string;
    active: boolean;
}

const rows = ref<Account[]>([
    { id: 101, name: '储蓄账户', active: true },
    { id: 102, name: '工资账户', active: false }
]);

const visible = ref(false);
const saving = ref(false);
const editingId = ref<number | null>(null);
const draft = reactive<AccountDraft>({ name: '', active: true });
const formRef = ref<FormInstance>();
const nextId = ref(103);

const rules: FormRules<AccountDraft> = {
    name: [
        { required: true, message: '请输入账户名称', trigger: 'blur' },
        { min: 2, max: 20, message: '长度为 2～20 个字符', trigger: 'blur' }
    ]
};

function openNew(): void {
    editingId.value = null;
    draft.name = '';
    draft.active = true;
    visible.value = true;
}

function openEdit(account: Account): void {
    editingId.value = account.id;
    // 逐字段复制，避免输入时提前修改表格原记录。
    draft.name = account.name;
    draft.active = account.active;
    visible.value = true;
}

function cancel(): void {
    if (saving.value) return;
    visible.value = false; // 不修改 rows，草稿直接丢弃。
}

async function save(): Promise<void> {
    if (saving.value || !formRef.value) return;

    saving.value = true;
    try {
        draft.name = draft.name.trim();
        await formRef.value.validate();

        if (editingId.value === null) {
            rows.value.push({
                id: nextId.value++,
                name: draft.name,
                active: draft.active
            });
        } else {
            const id = editingId.value;
            rows.value = rows.value.map(account =>
                account.id === id
                    ? { ...account, name: draft.name, active: draft.active }
                    : account
            );
        }

        visible.value = false;
    } catch {
        // 校验失败时保留弹窗和草稿，方便用户继续修改。
    } finally {
        saving.value = false;
    }
}
</script>

<template>
    <h2>账户管理</h2>

    <el-button type="primary" @click="openNew">
        新增账户
    </el-button>

    <el-table :data="rows" row-key="id" border>
        <el-table-column prop="id" label="编号" width="100" />
        <el-table-column prop="name" label="账户名称" />
        <el-table-column label="状态" width="100">
            <template #default="scope">
                {{ scope.row.active ? '启用' : '停用' }}
            </template>
        </el-table-column>
        <el-table-column label="操作" width="110">
            <template #default="scope">
                <el-button @click="openEdit(scope.row)">编辑</el-button>
            </template>
        </el-table-column>
    </el-table>

    <el-dialog
        v-model="visible"
        :title="editingId === null ? '新增账户' : '编辑账户'"
        width="520px"
        destroy-on-close
        :close-on-click-modal="false"
        :close-on-press-escape="false"
        :show-close="!saving"
    >
        <el-form
            ref="formRef"
            :model="draft"
            :rules="rules"
            label-width="100px"
        >
            <el-form-item label="账户名称" prop="name">
                <el-input v-model="draft.name" :disabled="saving" />
            </el-form-item>
            <el-form-item label="状态">
                <el-switch v-model="draft.active" :disabled="saving" />
            </el-form-item>
        </el-form>

        <template #footer>
            <el-button :disabled="saving" @click="cancel">取消</el-button>
            <el-button type="primary" :loading="saving" @click="save">
                保存
            </el-button>
        </template>
    </el-dialog>
</template>
```

这里用 `el-switch` 表示布尔开关。它是 Element Plus 组件，`v-model` 对应 `true`/`false`；后面会专门讲解它的参数。先把它看成一个可以切换启用状态的表单控件。

运行后：点击“编辑”，修改姓名然后取消，表格必须保持原值；重新打开，再输入合法名称并保存，表格才更新。点击“新增”则打开空白草稿，保存后增加一条记录。

**关键细节：** `destroy-on-close` 会在弹窗关闭时销毁默认插槽内容，重新打开时表单实例重新建立。所以 `formRef` 在未显示或尚未渲染时可能是 `undefined`；`save()` 在读取表单实例前必须检查。这个示例没有访问真实接口，页面刷新后数据恢复初始值。

> [!EXERCISE] 取消按钮为什么不能直接修改 `rows`
>
> 用户打开编辑弹窗，把账户名称从“储蓄账户”改为“理财账户”，然后点击取消。页面应如何处理？
>
> 【答案】输入控件只修改 `draft.name`，取消时只把 `visible` 改为 `false`，不调用保存函数，不修改 `rows`。重新打开时再次从原记录复制字段，仍应显示“储蓄账户”。

## 消息提示与二次确认：`ElMessage`、`ElMessageBox`

### 两种 API 的使用目的不同

有些提示只是告诉用户操作结果，例如“保存成功”。这种提示不需要中断页面操作，适合使用 **`ElMessage`**。

有些操作需要用户先明确确认，例如删除一条账户记录，适合使用 **`ElMessageBox.confirm()`**。两者都是在脚本中调用的服务方法，而不是直接写在模板中的普通组件标签。

```ts
import { ElMessage, ElMessageBox } from 'element-plus';
```

`import { ... }` 是 JavaScript 的具名导入语法，表示从 Element Plus 模块中导入这两个 API。

### `ElMessage`：非阻塞结果提示

常见调用方式：

```ts
ElMessage.success('保存成功');
ElMessage.warning('请选择账户');
ElMessage.error('操作失败');
ElMessage.info('操作已取消');
```

也可以传配置对象：

```ts
ElMessage({
    message: '账户保存成功',
    type: 'success',
    duration: 2500,
    showClose: true
});
```

这里 `message` 是内容，`type` 是提示类型，`duration` 是持续时间（毫秒），`showClose` 表示是否显示可手动关闭的按钮。`duration: 0` 表示不会自动关闭，这种持续提示要谨慎使用。

### `ElMessageBox.confirm()`：等待用户决定

调用格式：

```ts
await ElMessageBox.confirm('确定删除这条记录吗？', '删除确认', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'warning'
});
```

- 第一个参数：弹框正文消息。
- 第二个参数：弹框标题。
- 第三个参数：配置对象，用于设置按钮文字、提示类型等。
- 用户点击确认后，Promise 成功，后续 `await` 才继续执行。
- 用户取消或关闭弹框后，Promise 会拒绝，这表达的是**用户选择取消**，不等于服务器操作失败。

因此，删除业务的执行顺序应是：**先询问是否确认，再真正修改数据**。不要在弹框打开之前就删除记录。

### 完整程序：删除前确认、删除后提示

文件：`src/App.vue`。

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

interface Account {
    id: number;
    name: string;
}

const accounts = ref<Account[]>([
    { id: 101, name: '储蓄账户' },
    { id: 102, name: '工资账户' }
]);

const deleting = ref(false);

async function removeAccount(id: number): Promise<void> {
    if (deleting.value) return;

    // 第一步：只询问用户，尚未修改任何数据。
    try {
        await ElMessageBox.confirm(
            `确定删除编号 ${id} 的账户吗？`,
            '删除确认',
            {
                type: 'warning',
                confirmButtonText: '确定删除',
                cancelButtonText: '取消'
            }
        );
    } catch {
        // 用户取消或关闭确认框，不执行删除。
        ElMessage.info('已取消删除');
        return;
    }

    // 第二步：用户确认后，才进入删除业务阶段。
    deleting.value = true;
    try {
        const exists = accounts.value.some(item => item.id === id);
        if (!exists) throw new Error('账户不存在');

        // 本例是内存删除。真实项目应在这里等待后端删除接口。
        accounts.value = accounts.value.filter(item => item.id !== id);
        ElMessage.success('删除成功');
    } catch (error) {
        ElMessage.error(
            error instanceof Error ? error.message : '删除失败'
        );
    } finally {
        deleting.value = false;
    }
}
</script>

<template>
    <h2>账户删除确认</h2>

    <el-table :data="accounts" row-key="id" border>
        <el-table-column prop="id" label="编号" />
        <el-table-column prop="name" label="名称" />
        <el-table-column label="操作">
            <template #default="scope">
                <el-button
                    type="danger"
                    :disabled="deleting"
                    @click="removeAccount(scope.row.id)"
                >
                    删除
                </el-button>
            </template>
        </el-table-column>
    </el-table>
</template>
```

这段代码特意把两种 `catch` 分开：第一次只处理用户在确认框中的取消行为；第二次处理真正删除阶段的异常。这样不会出现“用户点取消，却被当作接口失败”的错误反馈。

在企业项目中，如果删除请求超时，不能仅凭前端没有收到响应就断定后端一定没有删除成功。真实删除还需要根据接口设计和重新查询结果判断，不能鼓励用户盲目重复提交。

> [!EXERCISE] 为什么需要两个不同的 `catch`
>
> 用户点击删除后按“取消”，为什么不应该提示“删除接口失败”？
>
> 【答案】取消发生在确认阶段，还没有调用删除逻辑。`ElMessageBox.confirm()` 的 Promise 被拒绝只表示确认流程没有继续；真正接口失败应由确认之后的删除阶段单独处理。

## 单选、多选与开关：`el-radio`、`el-checkbox`、`el-switch`

### 为什么三个组件不能随便替换

一个银行业务配置页可能需要选择“账户类型”、勾选“支持的通知渠道”，以及设置“是否启用短信通知”。这三项看起来都在做选择，但数据结构不一样：

- **Radio（单选框）：** 从一组互斥选项中选择一个，例如个人账户或企业账户。对应一个字符串、数字等单值。
- **Checkbox（复选框）：** 可以勾选多项，例如短信和站内消息。复选框组对应一个数组。
- **Switch（开关）：** 表示开/关两种状态，例如通知功能是否开启。默认对应布尔值 `true` 或 `false`。

在写模板之前，先确定保存到变量中的数据类型，能避免后来接口字段和控件值不一致。

### Radio：`el-radio-group` 与 `el-radio`

```vue
<el-radio-group v-model="accountType">
    <el-radio value="personal">个人账户</el-radio>
    <el-radio value="company">企业账户</el-radio>
</el-radio-group>
```

这里：

- `el-radio-group` 负责管理同一组单选项，通过 `v-model` 绑定当前选中的值。
- 每个 `el-radio` 的 `value` 表示这个选项真正保存的值，例如 `'personal'`。
- 标签内部“个人账户”是用户看到的文字，并不是自动保存到变量中的值。
- `@change` 可以监听值变化，事件参数是选中后的值，适合更新相关说明或清理依赖字段。

在 Element Plus 2.6 及以上，推荐用 `value` 明确指定选项值；旧版本曾将 `label` 同时作为选项值，这种旧用法已经废弃。**阅读旧项目时要先核对组件库版本。**

### Checkbox：单个布尔勾选与多选数组

单个复选框可以表示“是否同意”：

```vue
<el-checkbox v-model="agreed">我已阅读并同意协议</el-checkbox>
```

此时 `agreed` 是布尔值。

多个选项则使用一组：

```vue
<el-checkbox-group v-model="channels">
    <el-checkbox value="sms">短信</el-checkbox>
    <el-checkbox value="inbox">站内消息</el-checkbox>
</el-checkbox-group>
```

此时 `channels` 应初始化为数组，例如：

```ts
const channels = ref<string[]>(['sms']);
```

选中“站内消息”后，数组会包含 `'sms'` 和 `'inbox'`。用户看到的文字与真正保存的 `value` 应分别理解。`@change` 事件可以取得更新后的选中值集合。

### Switch：布尔状态与业务状态

```vue
<el-switch
    v-model="enabled"
    active-text="启用"
    inactive-text="停用"
/>
```

`v-model="enabled"` 绑定布尔状态；`active-text` 和 `inactive-text` 负责显示提示文字，不会把变量自动变成“启用”“停用”两个字符串。常用的 `disabled` 可以禁止操作，`loading` 可以让开关在处理期间显示忙碌状态，`@change` 在值变化时触发。

如果某个后端接口要求的是 `'Y'/'N'` 或 `1/0`，不应默认以为组件一定返回字符串或数字。可以在提交 API 参数前明确转换：

```ts
const enabledFlag = enabled.value ? 'Y' : 'N';
```

这样界面仍以布尔状态管理，接口边界负责转换成后端要求的格式。

### 完整程序：账户通知偏好设置

文件：`src/App.vue`。三个组件在同一个独立示例中分别完成单选、多选、开关，并展示每项实际绑定的数据类型。

```vue
<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';

// 联合类型限制单选值只能是规定的账户类型。
type AccountType = 'personal' | 'company';
type Channel = 'sms' | 'inbox' | 'email';

const accountType = ref<AccountType>('personal');
const channels = ref<Channel[]>(['sms']);
const notificationsEnabled = ref(true);
const agreed = ref(false);

const summary = computed(() => {
    return {
        accountType: accountType.value,
        channels: [...channels.value],
        notificationsEnabled: notificationsEnabled.value,
        agreed: agreed.value
    };
});

function handleTypeChange(value: unknown): void {
    // change 的值来自组件事件，先转为可展示的文字。
    ElMessage.info(`账户类型变为：${String(value)}`);
}

function saveSettings(): void {
    if (!agreed.value) {
        ElMessage.warning('请先勾选确认信息');
        return;
    }

    // 这里构造模拟接口参数，没有发送真实 HTTP 请求。
    const payload = {
        accountType: accountType.value,
        channels: notificationsEnabled.value ? [...channels.value] : [],
        noticeFlag: notificationsEnabled.value ? 'Y' : 'N'
    };

    console.log('模拟提交的通知偏好：', payload);
    ElMessage.success('偏好设置已准备好，请查看 Console');
}
</script>

<template>
    <h2>账户通知偏好</h2>

    <el-form label-width="110px">
        <el-form-item label="账户类型">
            <el-radio-group
                v-model="accountType"
                @change="handleTypeChange"
            >
                <el-radio value="personal">个人账户</el-radio>
                <el-radio value="company">企业账户</el-radio>
            </el-radio-group>
        </el-form-item>

        <el-form-item label="通知渠道">
            <el-checkbox-group v-model="channels">
                <el-checkbox value="sms">短信</el-checkbox>
                <el-checkbox value="inbox">站内消息</el-checkbox>
                <el-checkbox value="email">电子邮件</el-checkbox>
            </el-checkbox-group>
        </el-form-item>

        <el-form-item label="启用通知">
            <el-switch
                v-model="notificationsEnabled"
                active-text="启用"
                inactive-text="停用"
            />
        </el-form-item>

        <el-form-item label="信息确认">
            <el-checkbox v-model="agreed">
                我已确认上述设置
            </el-checkbox>
        </el-form-item>
    </el-form>

    <el-button type="primary" @click="saveSettings">
        保存偏好
    </el-button>

    <p>当前账户类型：{{ summary.accountType }}</p>
    <p>当前通知渠道：{{ summary.channels.join('、') || '未选择' }}</p>
    <p>通知开关：{{ summary.notificationsEnabled ? 'true' : 'false' }}</p>
    <p>已确认：{{ summary.agreed ? 'true' : 'false' }}</p>
</template>
```

`type Channel = 'sms' | 'inbox' | 'email'` 是 TypeScript 字符串字面量联合类型，帮助你限制数组元素的预期值。`[...channels.value]` 是数组展开语法，创建新数组副本，避免外部代码意外与原数组共用同一个数组对象。`join('、')` 则是 JavaScript 数组方法，把多个字符串用顿号连接成展示文本。

运行时依次观察：Radio 只能选一项；Checkbox Group 能选择多个渠道；Switch 只改变布尔开关；未勾选确认时，点击保存只出现警告；勾选确认后，Console 中能看到转换好的 `noticeFlag`。

> [!EXERCISE] 单选和多选的初始化为什么不同
>
> `const accountType = ref('personal')` 与 `const channels = ref<string[]>(['sms'])` 为什么一个是字符串，一个是数组？
>
> 【答案】Radio Group 只保留当前选中的一个 `value`；Checkbox Group 可以同时选中多个选项，因此保存的是多个 `value` 组成的数组。不能把多选数组误当作一个普通字符串提交。

> [!EXERCISE] Switch 的文字与实际值
>
> 一个 Switch 使用 `active-text="启用"`，当前 `notificationsEnabled` 为 `true`。提交时是否会自动发送“启用”两个字？
>
> 【答案】不会。`active-text` 负责显示，默认 `v-model` 仍为布尔值 `true`。如果接口要求字符串，应在构造请求参数时明确转换。

## 日期选择：`el-date-picker` 实现交易日期查询

### 日期组件与普通文本输入有什么区别

银行流水查询经常需要日期区间。如果让用户在普通文本框手动输入日期，就需要自己处理格式、合法日期、起止顺序等大量细节。

`<el-date-picker>` 提供日期面板，可以选择单个日期，也可以选择起止日期区间。使用前先分清两个概念：

- **显示格式（`format`）：** 用户在输入框里看到日期的样子。
- **绑定值格式（`value-format`）：** `v-model` 实际收到什么类型和内容。

没有设置 `value-format` 时，组件默认返回 `Date` 对象；设置 `value-format="YYYY-MM-DD"` 后，绑定值会按指定格式返回日期字符串。两者不能混为一谈。

### 单日期与日期区间

选择某一天：

```vue
<el-date-picker
    v-model="businessDate"
    type="date"
    value-format="YYYY-MM-DD"
/>
```

选择起止日期：

```vue
<el-date-picker
    v-model="dateRange"
    type="daterange"
    value-format="YYYY-MM-DD"
    start-placeholder="开始日期"
    end-placeholder="结束日期"
/>
```

`type="date"` 选择单日；`type="daterange"` 选择两个日期。范围模式下，选定后取得由起始日期和结束日期组成的数组；清空后绑定值可能不是两个元素的数组。主程序用 `Array.isArray()` 和长度检查确保只在确实选择了两个日期时才构造查询参数。

### 日期格式为什么大小写敏感

在日期格式中，`YYYY` 是四位年份，`MM` 是月份，`DD` 是日期。`MM` 和 `mm` 不相同，后者表示分钟；`DD` 与 `dd` 也不是同一个格式标记。

推荐先使用下面这组容易对照的约定：

| 属性 | 示例 | 实际意义 |
| --- | --- | --- |
| `type="date"` | 选择 2026-11-03 | 选择单个日期 |
| `type="daterange"` | 起止日期 | 选择区间 |
| `format="YYYY/MM/DD"` | `2026/11/03` | 输入框展示 |
| `value-format="YYYY-MM-DD"` | `2026-11-03` | 绑定到变量的值 |
| `clearable` | 清除按钮 | 允许清空已选择的日期 |
| `:disabled-date="fn"` | 不允许未来日期 | 决定面板中的哪些日期不可选 |
| `@change="fn"` | 选定值变化 | 在用户完成日期选择或清空后处理变化 |

日期范围是**日期**还是**精确到秒的时间**，要看业务接口。`YYYY-MM-DD` 不包含时分秒，如果后端需要按时间戳查询，必须明确起止边界、时区和是否包含结束日，不能仅把日期字符串随便拼成时间戳。

### `disabled-date`：禁用不符合业务条件的日期

`disabled-date` 接收一个函数，Element Plus 会用候选日期 `Date` 对象调用它，返回 `true` 表示禁用该日期。

例如，交易历史查询不允许选择今天之后的日期：

```ts
function disableFuture(candidate: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return candidate.getTime() > today.getTime();
}
```

`setHours(0, 0, 0, 0)` 把本地日期时间改为当天零点，避免因为当前有小时和分钟而误禁用今天。`getTime()` 返回时间戳数值，便于比较两个 `Date` 对象代表的时刻。此例使用浏览器本地日期规则，真实银行业务可能需要以服务器或交易系统的业务日期为准。

### 完整程序：交易查询日期区间

文件：`src/App.vue`。

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage } from 'element-plus';

// 指定 value-format 后，单日期模型保存格式化字符串。
const businessDate = ref('');

// 区间模型保存两个日期字符串；未选择时用 null 表示空状态。
const dateRange = ref<string[] | null>(null);
const querySummary = ref('尚未查询');

function disableFuture(candidate: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return candidate.getTime() > today.getTime();
}

function search(): void {
    if (!Array.isArray(dateRange.value) || dateRange.value.length !== 2) {
        ElMessage.warning('请完整选择开始日期和结束日期');
        return;
    }

    const [startDate, endDate] = dateRange.value;
    if (!startDate || !endDate) {
        ElMessage.warning('日期范围不完整');
        return;
    }

    // 模拟后端查询参数，不会发起真实网络请求。
    const params = {
        startDate,
        endDate,
        businessDate: businessDate.value || undefined
    };

    querySummary.value = JSON.stringify(params);
    console.log('拟发送的交易查询参数：', params);
}

function reset(): void {
    businessDate.value = '';
    dateRange.value = null;
    querySummary.value = '已重置查询条件';
}
</script>

<template>
    <h2>交易记录日期查询</h2>

    <el-form label-width="110px">
        <el-form-item label="业务日期">
            <el-date-picker
                v-model="businessDate"
                type="date"
                format="YYYY/MM/DD"
                value-format="YYYY-MM-DD"
                placeholder="可选业务日期"
                :disabled-date="disableFuture"
                clearable
            />
        </el-form-item>

        <el-form-item label="交易区间">
            <el-date-picker
                v-model="dateRange"
                type="daterange"
                format="YYYY/MM/DD"
                value-format="YYYY-MM-DD"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                :disabled-date="disableFuture"
                clearable
            />
        </el-form-item>
    </el-form>

    <el-button type="primary" @click="search">查询</el-button>
    <el-button @click="reset">重置</el-button>

    <p>单日期绑定值：{{ businessDate || '无' }}</p>
    <p>区间绑定值：{{ Array.isArray(dateRange) ? dateRange.join(' 至 ') : '无' }}</p>
    <p>查询参数：{{ querySummary }}</p>
</template>
```

`JSON.stringify(params)` 是 JavaScript 的对象序列化方法，把普通对象转换为 JSON 字符串，便于页面展示当前拟提交的参数；它本身不会发送 HTTP 请求。

运行后先选择日期区间，再点击查询。可以在页面上对照**显示的格式**与**实际绑定的值**；清空区间后点击查询，应显示缺少日期的提示。然后尝试选择未来日期，确认日期面板禁用了它们。

> [!EXERCISE] `format` 与 `value-format` 的区别
>
> 如果输入框显示 `2026/11/03`，接口却要求 `2026-11-03`，应该分别设置什么？
>
> 【答案】设置 `format="YYYY/MM/DD"` 控制展示，设置 `value-format="YYYY-MM-DD"` 控制 `v-model` 返回的字符串格式。不要把 `format` 当作接口参数格式设置。

## 标签页：`el-tabs` 与 `el-tab-pane`

### 标签页解决的是什么问题

账户系统中，一个页面可能同时提供“全部交易”“待处理交易”“已完成交易”。如果为每种类型都新建独立页面，用户需要频繁跳转；如果把所有内容放在同一张表里，又容易混淆。

`<el-tabs>` 是标签页容器，负责当前激活的标签；`<el-tab-pane>` 是每个标签对应的内容面板。常见结构：

```vue
<el-tabs v-model="activeTab">
    <el-tab-pane label="全部交易" name="all">全部内容</el-tab-pane>
    <el-tab-pane label="待处理" name="pending">待处理内容</el-tab-pane>
</el-tabs>
```

这里最重要的两个属性是：

- `label`：标签上展示给用户看的文字。
- `name`：这个标签的唯一业务标识，要与 `activeTab` 的值对应。

例如用户点击“待处理”，`activeTab` 就变成 `'pending'`，而不是变成“待处理”三个字。不要把显示文字和程序保存的标识混在一起。

### 常用属性、事件与状态

| 写法 | 含义 | 企业使用场景 |
| --- | --- | --- |
| `v-model="activeTab"` | 当前激活标签的 `name` | 控制显示哪个模块 |
| `<el-tab-pane name="...">` | 标签的内部标识 | 控制业务类型 |
| `label="..."` | 标签标题 | 展示中文名称 |
| `type="card"` | 卡片式外观 | 后台页面模块切换 |
| `tab-position="left"` | 标签导航放在左侧 | 内容较多的设置页面 |
| `:disabled="true"` | 禁止切换到指定标签 | 尚未开放的业务 |
| `@tab-change="handler"` | 当前激活标签发生改变时触发 | 触发必要的查询、记录状态 |
| `@tab-click="handler"` | 点击标签时触发 | 用户点击行为处理 |
| `<el-tab-pane lazy>` | 首次激活时才渲染面板内容 | 减少较复杂面板的初始化开销 |

`tab-change` 和 `tab-click` 不能完全等同：前者关注激活值改变，后者关注点击行为。业务需要“真正切换后才查询”时，应优先考虑 `tab-change` 或侦听 `activeTab`。

`lazy` 只解决首次内容延迟渲染，不等于缓存组件实例，也不能当作 `<KeepAlive>` 的替代品。需要保留路由页面状态时，仍应分析 Vue 组件实例及缓存策略。

### 完整程序：按交易状态切换标签

文件：`src/App.vue`。

```vue
<script setup lang="ts">
import { ref, computed } from 'vue';

interface Transaction {
    id: number;
    summary: string;
    amount: number;
    status: 'pending' | 'done';
}

type TabName = 'all' | 'pending' | 'done';

const activeTab = ref<TabName>('all');
const lastChange = ref('尚未切换');

const records = ref<Transaction[]>([
    { id: 1, summary: '账户转入', amount: 300, status: 'done' },
    { id: 2, summary: '转账预约', amount: 500, status: 'pending' },
    { id: 3, summary: '信用卡还款', amount: 200, status: 'done' }
]);

// 三个标签共用一份数据源，按当前激活的 name 选择展示数据。
const visibleRows = computed(() => {
    if (activeTab.value === 'all') return records.value;
    return records.value.filter(item => item.status === activeTab.value);
});

function handleTabChange(name: string | number): void {
    // Element Plus 的标签 name 可以是字符串或数字。
    lastChange.value = `当前标签变为：${String(name)}`;
}
</script>

<template>
    <h2>交易记录</h2>

    <el-tabs
        v-model="activeTab"
        type="card"
        @tab-change="handleTabChange"
    >
        <el-tab-pane label="全部交易" name="all">
            <p>查看所有交易</p>
        </el-tab-pane>
        <el-tab-pane label="待处理" name="pending" lazy>
            <p>等待执行的交易</p>
        </el-tab-pane>
        <el-tab-pane label="已完成" name="done">
            <p>执行完成的交易</p>
        </el-tab-pane>
    </el-tabs>

    <p>{{ lastChange }}</p>
    <p>当前标签标识：{{ activeTab }}</p>

    <el-table :data="visibleRows" row-key="id" border>
        <el-table-column prop="summary" label="交易摘要" />
        <el-table-column prop="amount" label="金额" />
        <el-table-column label="状态">
            <template #default="scope">
                {{ scope.row.status === 'done' ? '已完成' : '待处理' }}
            </template>
        </el-table-column>
    </el-table>
</template>
```

点击“待处理”后，`activeTab` 更新为 `'pending'`，`visibleRows` 重新计算，只保留预约转账。`el-table` 本身不需要知道用户点了哪个标签，它只负责显示计算出来的数组。

这份示例故意把结果表格放在 Tabs 之外，说明标签页的激活值也可以控制其他区域的显示。实际项目如果每个标签内部包含完全不同的业务组件，也可以把对应组件放进各自的 `el-tab-pane` 中。

> [!EXERCISE] 标签显示文字和模型值
>
> `<el-tab-pane label="已完成" name="done" />` 激活后，`activeTab` 保存什么？
>
> 【答案】保存 `'done'`，因为 `name` 才是模型标识。`label` 只是用户看到的标签标题。

## 加载遮罩：`v-loading` 与异步状态

### 加载状态不只是一个动画

在账户查询或交易提交时，用户需要知道系统正在处理。如果仅显示空表格或按钮没有反馈，用户可能以为点击没有生效，继续重复操作。

Element Plus 提供 `v-loading` 指令。它可以直接绑定一个布尔变量：

```vue
<div v-loading="loading">正在查询的区域</div>
```

当 `loading` 为 `true` 时，在指定区域显示遮罩；为 `false` 时隐藏。这个指令是 Element Plus 提供的，不是 Vue 内置指令，也不等于自动发送接口请求。

### `v-loading` 与按钮 `:loading` 是两回事

```vue
<el-table v-loading="loading" :data="rows" />
<el-button :loading="loading">查询</el-button>
```

- `v-loading` 是指令，给一个区域添加加载遮罩。
- `el-button` 的 `loading` 是按钮组件的属性，在按钮里显示加载状态。

两者都可以绑定同一个 `loading`，让列表和按钮同步展示“正在处理”。另外，`element-loading-text="正在读取账户..."` 可改变遮罩文字。

### 为什么还要有 `try...finally`

加载动画不会自动识别你的异步函数是否结束。必须由业务代码负责修改状态：

```ts
loading.value = true;
try {
    await request();
} finally {
    loading.value = false;
}
```

`finally` 在正常完成和捕获异常的流程中都会执行，适合恢复状态。为了避免重复请求，还应该在函数入口检查 `loading.value`。

### 完整程序：账户查询成功与失败

文件：`src/App.vue`。

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage } from 'element-plus';

interface Account {
    id: number;
    name: string;
}

const rows = ref<Account[]>([]);
const loading = ref(false);
const errorMessage = ref('');

function simulateQuery(fail: boolean): Promise<Account[]> {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (fail) {
                reject(new Error('模拟账户查询异常'));
            } else {
                resolve([
                    { id: 101, name: '储蓄账户' },
                    { id: 102, name: '工资账户' }
                ]);
            }
        }, 900);
    });
}

async function load(fail: boolean): Promise<void> {
    if (loading.value) return;

    loading.value = true;
    errorMessage.value = '';
    try {
        rows.value = await simulateQuery(fail);
        ElMessage.success('读取成功');
    } catch (error) {
        // 本例失败时清空旧数据，并展示独立错误提示。
        rows.value = [];
        errorMessage.value =
            error instanceof Error ? error.message : '读取失败';
        ElMessage.error(errorMessage.value);
    } finally {
        loading.value = false;
    }
}
</script>

<template>
    <h2>账户列表加载</h2>

    <el-button type="primary" :loading="loading" @click="load(false)">
        模拟成功查询
    </el-button>
    <el-button :disabled="loading" @click="load(true)">
        模拟失败查询
    </el-button>

    <p v-if="errorMessage">{{ errorMessage }}</p>

    <el-table
        v-loading="loading"
        element-loading-text="正在读取账户..."
        :data="rows"
        row-key="id"
        border
    >
        <el-table-column prop="id" label="编号" />
        <el-table-column prop="name" label="账户名称" />
    </el-table>
</template>
```

运行后：点击成功查询，表格先显示加载遮罩，约 900 毫秒后显示两条记录；点击失败查询，同样会显示加载状态，但随后进入 `catch`，显示错误，最终也会消除加载遮罩。

这里的 `setTimeout` 用来模拟异步等待，不会产生 HTTP 请求；要观察真实网络请求，需要把 `simulateQuery()` 换成第四天学习的 Axios API 函数，并到浏览器 Network 查看结果。

### 扩展：`ElLoading.service()`

除了指令，还可以在脚本中调用 `ElLoading.service()` 返回一个加载实例，通过 `close()` 关闭。适合某些不能方便地在模板中绑定 `v-loading` 的场景。

一般页面首选模板指令：状态和区域关系更直接。若使用全屏 Loading Service，要记住全屏服务属于单例语义，多个独立操作共同持有时必须设计好关闭时机，不能因为其中一个请求结束就无条件把其他请求的加载提示也关掉。

> [!EXERCISE] 为什么加了 v-loading 也会一直转圈
>
> 页面出现加载遮罩后一直不消失。是 Element Plus 自动加载失败了吗？应该优先检查什么？
>
> 【答案】优先检查绑定的 `loading` 是否在所有完成路径中恢复为 `false`。特别是 `await` 抛出异常后，是否有 `finally` 执行公共收尾逻辑。`v-loading` 只负责根据变量显示，不负责管理请求生命周期。

## 表格进阶：多选与排序

### 多选：增加 `selection` 列

第五天已经学过普通 `el-table` 和自定义操作列。要让用户批量选择账户，可以增加一个特殊列：

```vue
<el-table-column type="selection" width="55" />
```

`type="selection"` 表示这一列不是读取某个账户字段，而是显示复选框。还可以设置 `:selectable="canSelect"`，让 `canSelect(row)` 返回 `false` 的行禁止勾选。用户选中或取消选中时，表格会触发 `selection-change`：

```vue
<el-table @selection-change="handleSelectionChange" />
```

处理函数会收到当前选中行组成的数组：

```ts
function handleSelectionChange(selection: Account[]): void {
    selectedRows.value = selection;
}
```

因此，不是每点击一次就只会拿到一个 ID，而是会拿到**当前选择集合**。批量操作时通常先从集合中提取 ID：

```ts
const ids = selectedRows.value.map(item => item.id);
```

`map()` 会生成由 ID 组成的新数组，不会修改原行对象。

### 本地排序与服务端排序

Element Plus 的表格列支持 `sortable`：

```vue
<el-table-column prop="balance" label="余额" sortable />
```

这表示可以在当前表格数据上按列排序。适合数据已经全部加载到浏览器的情况。

如果后端只返回当前页，而用户要对**全部账户**按余额排序，就不能只对当前页排序。应该使用：

```vue
<el-table-column prop="balance" label="余额" sortable="custom" />
```

再在表格上监听 `sort-change`，把字段和排序方向传给后端，由后端排序后返回数据。`sortable="custom"` 本身并不会请求后端；需要开发者写出具体逻辑。

### 排序事件数据怎样理解

常见的 `sort-change` 回调会携带：

- `prop`：按哪个字段排序，例如 `'balance'`。
- `order`：`'ascending'`（升序）、`'descending'`（降序）或 `null`（恢复未排序）。

这里的排序方向是状态，不是中文展示文字。提交后端时可根据协议映射成 `ASC`、`DESC` 或其他要求。

### 完整程序：批量冻结账户与余额排序

本例使用 `sortable="custom"` 展示排序事件，并在选择列设置 `reserve-selection` 与稳定 `row-key`，帮助切换排序顺序时保留已勾选行。但为了无需后端也能直接运行，由前端 `computed()` 执行模拟排序。真实项目采用服务端排序时，只需把本地排序换成 Axios 请求及响应赋值，不应同时用两套排序逻辑。

文件：`src/App.vue`。

```vue
<script setup lang="ts">
import { ref, computed } from 'vue';
import type { TableInstance } from 'element-plus';
import { ElMessage, ElMessageBox } from 'element-plus';

interface Account {
    id: number;
    name: string;
    balance: number;
    frozen: boolean;
}

type SortOrder = 'ascending' | 'descending' | null;

const rows = ref<Account[]>([
    { id: 101, name: '储蓄账户', balance: 3200, frozen: false },
    { id: 102, name: '工资账户', balance: 8500, frozen: false },
    { id: 103, name: '备用账户', balance: 1000, frozen: false },
    { id: 104, name: '冻结账户', balance: 2000, frozen: true }
]);

const selectedRows = ref<Account[]>([]);
const sortOrder = ref<SortOrder>(null);
const tableRef = ref<TableInstance>();

// 自定义排序：复制数组，避免在 computed 中直接改变原始 rows。
const displayRows = computed(() => {
    const copy = [...rows.value];
    if (sortOrder.value === 'ascending') {
        return copy.sort((a, b) => a.balance - b.balance);
    }
    if (sortOrder.value === 'descending') {
        return copy.sort((a, b) => b.balance - a.balance);
    }
    return copy;
});

// 已冻结的账户不允许进入本次批量冻结集合。
function canSelect(row: Account): boolean {
    return !row.frozen;
}

function handleSelectionChange(selection: Account[]): void {
    selectedRows.value = selection;
}

function handleSortChange(event: { order?: string | null }): void {
    // 将组件事件的宽类型转换为本页面约定的三种排序状态。
    sortOrder.value =
        event.order === 'ascending' || event.order === 'descending'
            ? event.order
            : null;
}

async function freezeSelected(): Promise<void> {
    const ids = selectedRows.value.map(item => item.id);
    if (ids.length === 0) {
        ElMessage.warning('请至少选择一条未冻结账户');
        return;
    }

    try {
        await ElMessageBox.confirm(
            `确定冻结选中的 ${ids.length} 条账户吗？`,
            '批量冻结确认',
            { type: 'warning' }
        );
    } catch {
        return; // 用户取消，原数据不变。
    }

    // Mock 业务处理：按 ID 替换目标记录。
    rows.value = rows.value.map(item =>
        ids.includes(item.id)
            ? { ...item, frozen: true }
            : item
    );

    // 清空表格选择，避免误把旧选择带入下一次操作。
    tableRef.value?.clearSelection();
    selectedRows.value = [];
    ElMessage.success('模拟批量冻结完成');
}
</script>

<template>
    <h2>账户批量操作</h2>

    <el-button type="warning" @click="freezeSelected">
        冻结选中账户（{{ selectedRows.length }}）
    </el-button>

    <el-table
        ref="tableRef"
        :data="displayRows"
        row-key="id"
        border
        @selection-change="handleSelectionChange"
        @sort-change="handleSortChange"
    >
        <el-table-column
            type="selection"
            width="55"
            :selectable="canSelect"
            :reserve-selection="true"
        />
        <el-table-column prop="id" label="编号" />
        <el-table-column prop="name" label="名称" />
        <el-table-column
            prop="balance"
            label="余额"
            sortable="custom"
        />
        <el-table-column label="状态">
            <template #default="scope">
                {{ scope.row.frozen ? '冻结' : '正常' }}
            </template>
        </el-table-column>
    </el-table>

    <p>已选择 ID：{{ selectedRows.map(item => item.id).join('、') || '无' }}</p>
    <p>当前排序：{{ sortOrder || '原始顺序' }}</p>
</template>
```

运行后按以下顺序验证：

1. 勾选“储蓄账户”和“工资账户”，顶部数量应为 2。
2. 点击余额列标题，在升序、降序和无排序之间切换，记录顺序发生变化。
3. 点击“冻结选中账户”，先出现确认框。点击取消，数据不变。
4. 再次确认后，两条账户显示冻结，选择被清空；已经冻结的行不可再次勾选。
5. 刷新浏览器后，内存数据重新初始化，冻结结果不保留。真实企业业务应由后端接口处理和保存。

这里用到了 `TableInstance` 类型以及 `tableRef.value?.clearSelection()`。`TableInstance` 表示 Element Plus 表格组件实例的类型；`ref="tableRef"` 让 Vue 在表格挂载后把实例赋给变量；`clearSelection()` 是表格暴露的清除勾选方法。`?.` 是可选链，用于在实例还没有创建时避免访问空值抛错。

### 多选与分页共同使用时的注意事项

本例没有分页。如果后端是分页接口，每次只返回当前页，表格选择状态需要按业务规则处理：

- 仅允许当前页批量操作：切换页码时清空选择。
- 允许跨页选择：需要保存已选 ID 的独立集合，并设置稳定的 `row-key`，结合表格的 `reserve-selection` 行为管理选择；不能仅凭当前页 `selection-change` 结果代表所有页。

`reserve-selection` 表示尝试依据稳定的 `row-key` 在数据更新时保留已选行，它不是跨页批量业务的完整实现。`selection-change` 的数组是**表格当前维护的选择**，不一定天然等同于“服务端整个查询结果范围内的选中集合”。跨页批量操作需要专门设计和测试。

> [!EXERCISE] 为什么当前页排序不等于全量排序
>
> 服务器有 1000 条记录，每次只返回 10 条。如果前端只对这 10 条按余额排序，能否说完成了“全部记录按余额从高到低排序”？
>
> 【答案】不能。前端只能改变当前已加载的 10 条记录顺序。需要全量排序时，应让后端先按排序条件处理全部符合条件的记录，再返回对应页；前端通过 `sort-change` 读取排序字段与方向，并请求新数据。

## 拓展：表单自定义校验与异步校验

### 为什么内置校验规则不够用

前五天的 `el-form` 已经介绍 `required`、`min`、`max`。它们能检查必填、长度等简单规则。但有些企业业务需要进一步判断：

- 账户别名是否与已有别名重复。
- 查询起止金额是否满足业务关系。
- 某个字段是否符合当前业务状态。

这类检查可以写成**自定义校验器（validator）**。`el-form-item` 的 `prop` 指向表单模型字段，`rules` 中对应字段的规则可以提供 `validator` 函数。

```ts
const rules = {
    alias: [{
        validator: async (_rule: unknown, value: string) => {
            if (value.trim() === '已存在别名') {
                throw new Error('账户别名已存在');
            }
        },
        trigger: 'blur'
    }]
};
```

这里：

- `validator` 是自定义校验函数。
- `_rule` 是校验规则信息，本例不用它，所以用下划线开头表示未使用。
- `value` 是当前待校验字段的值。
- `throw new Error(...)` 表示规则未通过，错误消息交给表单显示。
- `trigger: 'blur'` 表示失去焦点时触发校验。
- `async` 允许校验函数内部通过 `await` 等待异步操作，例如检查后端是否已有相同别名。

### 为什么校验不能只放在浏览器

前端校验主要用于及时提示用户、减少无效请求，但**不能建立真正的数据一致性保证**。两个用户可能同时申请同一个别名：两个前端都认为未重复，最后仍可能发生冲突。

真实系统必须由后端再次校验，并根据业务需要使用数据库唯一约束、事务或其他机制保证正确性。前端的异步校验只是改善交互，不是最终裁决。

### 完整程序：模拟账户别名重复校验

文件：`src/App.vue`。本例用 Promise 延迟模拟查询已有别名，不发 HTTP 请求。

```vue
<script setup lang="ts">
import { ref, reactive } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage } from 'element-plus';

interface AliasForm {
    alias: string;
}

const form = reactive<AliasForm>({ alias: '' });
const formRef = ref<FormInstance>();
const saving = ref(false);
const currentAlias = ref('储蓄账户');

const existingAliases = ['储蓄账户', '工资账户'];

async function validateAlias(_rule: unknown, value: string): Promise<void> {
    const candidate = value.trim();
    if (candidate.length < 2) {
        throw new Error('别名至少需要两个字符');
    }

    // 模拟远程检查延迟。
    await new Promise<void>(resolve => setTimeout(resolve, 400));

    if (existingAliases.includes(candidate)) {
        throw new Error('该账户别名已存在');
    }
}

const rules: FormRules<AliasForm> = {
    alias: [
        { required: true, message: '请输入账户别名', trigger: 'blur' },
        { validator: validateAlias, trigger: 'blur' }
    ]
};

async function submit(): Promise<void> {
    if (saving.value || !formRef.value) return;

    saving.value = true;
    try {
        form.alias = form.alias.trim();
        await formRef.value.validate();

        // 本例保存到组件局部状态，不调用后端接口。
        currentAlias.value = form.alias;
        ElMessage.success('模拟保存成功');
    } catch {
        ElMessage.warning('请检查表单校验提示');
    } finally {
        saving.value = false;
    }
}
</script>

<template>
    <h2>账户别名校验</h2>
    <p>当前演示账户别名：{{ currentAlias }}</p>

    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="新别名" prop="alias">
            <el-input v-model="form.alias" :disabled="saving" />
        </el-form-item>
    </el-form>

    <el-button type="primary" :loading="saving" @click="submit">
        检查并保存
    </el-button>
    <p>测试说明：输入“工资账户”会提示重复，输入“我的日常账户”可以通过。</p>
</template>
```

尝试输入“工资账户”后失焦，会先等待模拟检查，然后显示“该账户别名已存在”。输入一个长度足够、且未出现在 `existingAliases` 里的名称，可以通过并更新页面显示。

这段代码没有真实网络请求，`existingAliases` 只是模拟集合。将来改成真实接口时，应考虑用户连续修改输入值导致的请求竞态和校验结果过期问题；如果校验值变化很频繁，可以再结合请求取消或版本序号，确保旧结果不会覆盖最新输入状态。

> [!EXERCISE] 异步校验通过就绝对不会重复吗
>
> 浏览器先查询到别名可用，随后用户点击保存。可以因此完全取消服务端重复检查吗？
>
> 【答案】不能。前端异步校验只是一种用户体验机制，检查与最终保存不是同一个原子操作。服务端仍要重新校验，并通过数据库约束或业务事务保证并发情况下的数据正确性。

## 拓展：`before-close` 与关闭前确认

### 与主动设置 `visible = false` 的区别

前面的 Dialog 使用：

```vue
<el-dialog :before-close="beforeClose" />
```

`before-close` 用于拦截 Dialog **内置的关闭操作**（例如标题栏关闭按钮、遮罩等，具体取决于启用的关闭方式）。它不会自动替你拦截 footer 插槽中自行编写的所有关闭按钮。

参数 `done` 是 Dialog 提供的继续关闭回调。只有确认可以关闭时才调用它；不调用时本次关闭会被阻止。

如果你自己写：

```ts
visible.value = false;
```

这是直接修改控制显示的变量，不会自动走你期望的所有内置关闭前确认流程。要让取消按钮也执行确认，应显式调用同一套关闭判断逻辑，而不是依赖 `before-close` 猜测拦截范围。

### 完整程序：点击弹窗右上角关闭前确认

文件：`src/App.vue`。

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { ElMessageBox } from 'element-plus';

const visible = ref(false);
const remark = ref('');

async function beforeClose(done: () => void): Promise<void> {
    // 没有输入时可以直接关闭。
    if (remark.value.trim() === '') {
        done();
        return;
    }

    try {
        await ElMessageBox.confirm(
            '当前备注尚未保存，确定要关闭吗？',
            '确认关闭',
            { type: 'warning' }
        );
        done(); // 用户确认丢弃草稿，才真正关闭 Dialog。
    } catch {
        // 用户取消关闭，不执行 done()，弹窗保留。
    }
}

async function cancelFromFooter(): Promise<void> {
    // footer 取消按钮不会自动调用 before-close，需显式复用。
    await beforeClose(() => {
        visible.value = false;
    });
}
</script>

<template>
    <el-button @click="visible = true">填写业务备注</el-button>

    <el-dialog
        v-model="visible"
        title="业务备注"
        width="480px"
        :before-close="beforeClose"
        :close-on-click-modal="false"
    >
        <el-input
            v-model="remark"
            type="textarea"
            :rows="3"
            placeholder="填写后尝试关闭"
        />

        <template #footer>
            <el-button @click="cancelFromFooter">取消</el-button>
            <el-button type="primary" @click="visible = false">
                模拟已保存并关闭
            </el-button>
        </template>
    </el-dialog>
</template>
```

`el-input type="textarea"` 表示把普通单行输入框切换为多行文本框，`:rows="3"` 指定初始可见的文本行数。

测试：不填写内容时直接点击右上角关闭；输入文字后点击右上角关闭，会先出现确认；点击“取消”时弹窗不关闭；点击 footer 的“取消”也走同一套判断。最后的“模拟已保存并关闭”表示业务已完成，所以直接关闭。真实项目应在后端保存成功后才这样执行，不要仅凭点击按钮就声称保存已成功。

## 拓展：`ElLoading.service()` 处理命令式加载

### 什么时候使用加载服务

大多数页面可以直接在模板中写 `v-loading="loading"`。如果某个操作需要在脚本中临时开启全屏加载遮罩，可以使用 `ElLoading.service()`，它会返回一个可以关闭的实例。

服务方式需要自己保证关闭，不会因为 Promise 成功或失败自动消失。

### 完整程序：模拟批处理全屏加载

文件：`src/App.vue`。

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { ElLoading, ElMessage } from 'element-plus';

const working = ref(false);

async function batchProcess(): Promise<void> {
    if (working.value) return;
    working.value = true;

    const loading = ElLoading.service({
        fullscreen: true,
        lock: true,
        text: '正在模拟批量处理账户，请勿重复提交'
    });

    try {
        // 模拟处理耗时，不发 HTTP 请求。
        await new Promise<void>(resolve => setTimeout(resolve, 1200));
        ElMessage.success('模拟批量处理结束');
    } catch {
        ElMessage.error('处理失败');
    } finally {
        loading.close();
        working.value = false;
    }
}
</script>

<template>
    <h2>批量处理</h2>
    <el-button type="primary" :disabled="working" @click="batchProcess">
        开始模拟批处理
    </el-button>
</template>
```

`fullscreen: true` 表示全屏覆盖；`lock: true` 表示加载期间锁定页面滚动；`text` 是遮罩说明。`loading.close()` 负责结束遮罩，应该放在 `finally` 中。

**注意：** Element Plus 的全屏 Loading Service 是单例，不要让多个并发业务各自认为自己拥有一份独立全屏遮罩。真实项目中应规划全局加载计数或按区域展示，避免一个请求结束时误关闭另一个请求仍在使用的遮罩。

## 当日复盘与企业项目阅读顺序

### 学会先认组件，再找状态

以后阅读企业项目的模板时，遇到一个标签可以先判断它属于哪一类：

| 看到的代码 | 先确认什么 | 继续追踪 |
| --- | --- | --- |
| `<el-dialog v-model="visible">` | `visible` 由谁控制 | 打开函数、草稿初始化、关闭规则 |
| `<template #footer>` | 父组件填入了什么底部内容 | 保存、取消按钮事件 |
| `ElMessage.success(...)` | 这是非阻塞结果提示 | 是哪个操作真正完成后触发 |
| `ElMessageBox.confirm(...)` | 用户确认是否已完成 | 取消分支是否提前返回 |
| `<el-radio-group>` | 单选的绑定值是什么类型 | 选项 `value` 和接口枚举 |
| `<el-checkbox-group>` | 模型是否为数组 | 数组元素值与业务含义 |
| `<el-switch>` | 模型是布尔还是定制值 | 是否需要提交前转换 |
| `<el-date-picker>` | `type` 与 `value-format` | 接口要求日期还是时间戳 |
| `<el-tabs>` | 当前标签的 `name` | 切换时是否发起查询 |
| `v-loading="loading"` | 控制加载的变量 | `finally` 是否恢复状态 |
| `<el-table-column type="selection">` | 选择范围是什么 | 批量操作使用的 ID 列表 |
| `<el-table-column sortable="custom">` | 是否真正启用了后端排序 | `sort-change` 和 API 参数 |

### 容易混淆的几个概念

**弹窗与消息确认：** `el-dialog` 用于自定义复杂界面，例如含多个表单字段的业务编辑；`ElMessageBox.confirm()` 适合只需要确认或取消的简短问题，不必为一次普通删除确认搭建整套表单弹窗。

**视觉状态与真实状态：** 一个 Switch 显示“关闭”，不代表后端某个服务一定已经关闭；界面绑定值和服务器持久化结果是两回事。真实接口失败时，要按业务规则恢复 UI 或重新查询。

**加载与接口请求：** `v-loading` 不发 HTTP 请求，`ElLoading.service()` 也不发 HTTP 请求。它们只负责显示等待中的视觉反馈。

**本地与服务端排序：** `sortable` 对已加载数据排序；`sortable="custom"` 则需要开发者处理排序事件，真实服务端排序必须由接口实现。

**表单通过校验与保存成功：** `formRef.value.validate()` 通过只代表当前前端规则通过，不等于数据已经提交、也不等于服务器已经保存成功。

### 练习检查清单

> [!EXERCISE] 弹窗关闭后为什么保留了旧输入
>
> 账户编辑弹窗关闭后重新打开，仍然显示上一条记录的姓名。应从哪些位置检查？
>
> 【答案】先检查每次打开弹窗时是否用当前记录重新初始化草稿；再检查是否直接把原行对象绑定给表单；最后检查 `destroy-on-close` 与表单内部状态的处理方式。是否销毁组件不能替代正确的业务草稿初始化。

> [!EXERCISE] 日期输入框显示对了，但接口报格式错误
>
> 输入框显示 `2026/11/03`，接口要求 `2026-11-03`，为什么只设置 `format="YYYY/MM/DD"` 不够？
>
> 【答案】`format` 只控制显示。接口需要的数据类型和格式取决于 `value-format` 或接口层转换；应该明确设置 `value-format="YYYY-MM-DD"`，并检查最终请求的真实参数。

> [!EXERCISE] 全部交易与当前页交易的批量操作
>
> 用户在服务端分页表格上只勾选当前页两条记录，程序能否直接把当前 `selection-change` 数组认定为“用户选中了查询结果的全部记录”？
>
> 【答案】不能。`selection-change` 代表表格当前维护的选择。是否允许跨页选择、如何保存已选 ID、取消选择时如何同步，都需要按业务要求明确设计。

> [!EXERCISE] 保存失败后怎么恢复按钮和弹窗
>
> 提交弹窗表单时打开了 loading，接口返回失败。用户仍要修改刚才的内容重新保存，页面应该如何处理？
>
> 【答案】在 `catch` 中显示业务错误并保留当前草稿和弹窗，在 `finally` 中恢复 loading。不能在请求尚未成功时就关闭弹窗、丢弃草稿，或者把按钮永久禁用。

### 官方文档索引

- [Element Plus：Dialog 对话框](https://element-plus.org/zh-CN/component/dialog.html)
- [Element Plus：Message 消息提示](https://element-plus.org/zh-CN/component/message.html)
- [Element Plus：MessageBox 消息弹框](https://element-plus.org/zh-CN/component/message-box.html)
- [Element Plus：Radio 单选框](https://element-plus.org/zh-CN/component/radio.html)
- [Element Plus：Checkbox 多选框](https://element-plus.org/zh-CN/component/checkbox.html)
- [Element Plus：Switch 开关](https://element-plus.org/zh-CN/component/switch.html)
- [Element Plus：DatePicker 日期选择器](https://element-plus.org/zh-CN/component/date-picker.html)
- [Element Plus：Tabs 标签页](https://element-plus.org/zh-CN/component/tabs.html)
- [Element Plus：Loading 加载](https://element-plus.org/zh-CN/component/loading.html)
- [Element Plus：Table 表格](https://element-plus.org/zh-CN/component/table.html)
- [Element Plus：Form 表单](https://element-plus.org/zh-CN/component/form.html)
