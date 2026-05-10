---
title: "安装 MIRACL Core (Visual Studio 2026)"
layout: post
date: 2026-05-10
categories: 杂项笔记
math: true
mermaid: true
---

## 从 GitHub 下载并解压源码

- 从 GitHub 下载 MIRACL Core 的源码压缩包，得到文件：`core-master.zip`。
- 解压 `core-master.zip`，得到文件夹：`core-master`。
- 进入 C++ 版本源码目录：

```cmd
...\core-master\cpp
```

MIRACL Core 的 C++ 版本实际上是 C 风格代码加 namespace，后续在 Visual Studio 中可以直接把生成后的 `.cpp` 文件加入工程进行编译。

## 使用 `config64.py` 生成 BLS12381 相关源码

### 修改 `config64.py`，保留生成后的源码文件

MIRACL Core 的 `config64.py` 默认面向 `g++` 构建流程，脚本会生成若干曲线专用源码文件，并尝试调用 `g++` 与 `ar` 生成静态库 `core.a`。在 Windows + Visual Studio 2026 中，不需要使用 `core.a`，而是直接把生成后的 `.cpp` 文件加入 VS 工程。

为了避免脚本结束时删除生成文件，需要先修改 `config64.py`。

打开：

```cmd
...\core-master\cpp\config64.py
```

找到末尾清理部分：

```python
#clean up
for file in generated_files:
    delete_file(file)
delete_file("*.o")
sys.exit(0)
```

改为：

```python
#clean up
# Keep generated source files for Visual Studio/MSVC.
# for file in generated_files:
#     delete_file(file)
delete_file("*.o")
sys.exit(0)
```

这样脚本生成的 `bls_BLS12381.cpp`、`pair_BLS12381.cpp` 等文件会保留在当前目录中，供 Visual Studio 工程使用。

### 运行 `config64.py`

打开命令行，进入 MIRACL Core 的 `cpp` 目录。

执行：

```cmd
py -3 config64.py -d -o 31
```

其中：

* `config64.py`：生成 64 位构建所需源码。
* `-d`：生成动态命名的曲线专用文件，例如 `fp_BLS12381.cpp`。
* `-o 31`：选择编号为 `31` 的曲线，即 `BLS12381`。

执行过程中可能出现：

```cmd
'g++' 不是内部或外部命令，也不是可运行的程序
'ar' 不是内部或外部命令，也不是可运行的程序
```

这是正常现象。原因是 `config64.py` 默认会尝试调用 `g++` 和 `ar` 生成 `core.a`，但当前使用的是 Visual Studio/MSVC 路线，不需要生成 `core.a`。只要 BLS12381 相关 `.cpp/.h` 文件已经生成出来，就可以继续。

### 检查生成结果

在当前目录执行：

```cmd
dir *BLS12381*
dir big_B384_58.*
```

应当至少能看到以下文件：

```text
big_B384_58.cpp
big_B384_58.h

bls_BLS12381.cpp
bls_BLS12381.h

pair_BLS12381.cpp
pair_BLS12381.h

ecp_BLS12381.cpp
ecp_BLS12381.h

ecp2_BLS12381.cpp
ecp2_BLS12381.h

fp_BLS12381.cpp
fp_BLS12381.h

fp2_BLS12381.cpp
fp2_BLS12381.h

fp4_BLS12381.cpp
fp4_BLS12381.h

fp12_BLS12381.cpp
fp12_BLS12381.h

rom_field_BLS12381.cpp
rom_curve_BLS12381.cpp

config_field_BLS12381.h
config_curve_BLS12381.h
```

如果这些文件存在，说明 BLS12381 的源码生成步骤已经成功。此时不需要关心 `core.a` 是否生成成功。

## 创建 Visual Studio 2026 测试工程

### 新建空项目

* 打开 **Visual Studio 2026**。
* 选择 **创建新项目**。
* 选择 **空项目（Empty Project）**，语言选择 C++。
* 项目名称可以设置为：

```text
MIRACLCore_BLS12381_Test
```

* 平台选择 `x64`。

建议使用空项目，不要使用带默认 `main()` 的控制台模板。这样可以避免后续出现多个 `main()` 函数导致的链接错误。

### 配置工程属性

右键项目 → **属性**。

在窗口顶部确认：

```text
配置：Release
平台：x64
```

#### 添加头文件目录

进入：

```text
C/C++ → 常规 → 附加包含目录
```

添加：

```cmd
...\core-master\cpp
```

#### 设置 C++ 标准

进入：

```text
C/C++ → 语言 → C++ 语言标准
```

建议选择：

```text
ISO C++17 标准 (/std:c++17)
```

#### 关闭预编译头

如果工程模板带有预编译头设置，需要进入：

```text
C/C++ → 预编译头
```

设置为：

```text
不使用预编译头
```

如果保留 `pch.h` 机制，后续导入 MIRACL Core 的 `.cpp` 文件时可能出现无意义的编译错误。

#### 添加常用预处理宏

进入：

```text
C/C++ → 预处理器 → 预处理器定义
```

添加：

```text
_CRT_SECURE_NO_WARNINGS
```

该宏主要用于避免 MSVC 对部分 C 风格函数给出安全警告，不影响密码学逻辑。

## 向工程中添加 MIRACL Core 源文件

右键项目 → **添加 → 现有项…**，从 `D:\Code\Projects\core-master\cpp` 中添加以下文件。

### BLS12381 必需源码

```text
big_B384_58.cpp

fp_BLS12381.cpp
fp2_BLS12381.cpp
fp4_BLS12381.cpp
fp12_BLS12381.cpp

ecp_BLS12381.cpp
ecp2_BLS12381.cpp
pair_BLS12381.cpp
bls_BLS12381.cpp

rom_field_BLS12381.cpp
rom_curve_BLS12381.cpp
```

### 通用工具源码

```text
rand.cpp
randapi.cpp
oct.cpp
hash.cpp
hmac.cpp
```

这些文件为随机数、字节串、哈希、HMAC 等功能提供基础支持。BLS 签名测试会用到这些通用模块。

### 暂时不要添加的文件

安装验证阶段暂时不要添加以下文件：

```text
ecdh_BLS12381.cpp
eddsa_BLS12381.cpp
hpke_BLS12381.cpp
mpin_BLS12381.cpp
```

这些文件分别对应 ECDH、EdDSA、HPKE、MPIN 等其他功能，不是最小 BLS12381 验证程序所必需的。后续如果需要使用这些功能，再单独添加即可。

也不要添加这些模板文件：

```text
big.cpp
fp.cpp
fp2.cpp
fp4.cpp
fp12.cpp
ecp.cpp
ecp2.cpp
pair.cpp
bls.cpp
```

这些是模板源码，内部通常包含占位符或通用宏，不适合作为已经选定 BLS12381 后的工程源码。应当使用带曲线后缀的文件，例如 `fp_BLS12381.cpp`、`pair_BLS12381.cpp`、`bls_BLS12381.cpp`。

## 添加最小 BLS12381 测试程序

在项目中新建文件：

```text
test_bls12381_min.cpp
```

写入以下代码：

```cpp
#include <cstdio>
#include <ctime>

#include "bls_BLS12381.h"
#include "randapi.h"

using namespace core;
using namespace BLS12381;

int main()
{
    char raw[100];
    octet RAW = {0, sizeof(raw), raw};
    csprng RNG;

    unsigned long ran = (unsigned long)time(nullptr);

    RAW.len = 100;
    RAW.val[0] = (char)ran;
    RAW.val[1] = (char)(ran >> 8);
    RAW.val[2] = (char)(ran >> 16);
    RAW.val[3] = (char)(ran >> 24);

    for (int i = 4; i < 100; i++)
    {
        RAW.val[i] = (char)i;
    }

    CREATE_CSPRNG(&RNG, &RAW);

    char message[] = "Hello BLS12-381 from MIRACL Core";
    octet M = {0, sizeof(message), message};
    OCT_jstring(&M, message);

    char s[BGS_BLS12381];
    char ikm[64];
    char w[4 * BFS_BLS12381 + 1];
    char sig[BFS_BLS12381 + 1];

    octet S = {0, sizeof(s), s};
    octet W = {0, sizeof(w), w};
    octet SIG = {0, sizeof(sig), sig};
    octet IKM = {0, sizeof(ikm), ikm};

    if (BLS_INIT() != BLS_OK)
    {
        printf("BLS_INIT failed\n");
        KILL_CSPRNG(&RNG);
        return 1;
    }

    OCT_rand(&IKM, &RNG, 32);

    if (BLS_KEY_PAIR_GENERATE(&IKM, &S, &W) != BLS_OK)
    {
        printf("KeyGen failed\n");
        KILL_CSPRNG(&RNG);
        return 1;
    }

    BLS_CORE_SIGN(&SIG, &M, &S);

    int ok = BLS_CORE_VERIFY(&SIG, &M, &W);

    printf("BLS12381 verify result: %s\n", ok == BLS_OK ? "OK" : "FAIL");

    KILL_CSPRNG(&RNG);

    return ok == BLS_OK ? 0 : 1;
}
```

## 运行并验证安装是否成功

将 `test_bls12381_min.cpp` 作为当前工程中唯一包含 `main()` 的文件，然后选择：

```text
Release | x64
```

点击：

```text
生成 → 生成解决方案
```

若编译成功，使用 **Ctrl + F5** 运行程序。

如果安装和配置正确，控制台应输出：

```text
BLS12381 verify result: OK
```

这说明以下内容均已成功配置：

* MIRACL Core 源码可以被 VS2026 编译。
* BLS12381 曲线参数加载正常。
* BLS 密钥生成可用。
* BLS 签名可用。
* BLS 验签可用。
* Pairing 相关底层函数可用。

## 测试程序说明

该测试程序完成了一次最小 BLS 签名与验签流程：

1. 初始化随机数生成器 `RNG`。
2. 构造待签名消息 `M`。
3. 调用 `BLS_INIT()` 初始化 BLS 环境。
4. 调用 `BLS_KEY_PAIR_GENERATE()` 生成 BLS 私钥与公钥。
5. 调用 `BLS_CORE_SIGN()` 对消息签名。
6. 调用 `BLS_CORE_VERIFY()` 验证签名。
7. 若返回 `BLS_OK`，输出 `BLS12381 verify result: OK`。

从数学结构上看，BLS 签名大致对应：

$$
h=\mathsf{HashToCurve}(m),\qquad sig=sk\cdot h.
$$

验签则检查配对等式是否成立：

$$
e(sig,g_2)=e(h,pk).
$$

## 常见错误与解决方法

### `g++` 或 `ar` 不是内部或外部命令

现象：

```cmd
'g++' 不是内部或外部命令，也不是可运行的程序
'ar' 不是内部或外部命令，也不是可运行的程序
```

原因：

`config64.py` 默认尝试用 `g++` 编译并用 `ar` 打包生成 `core.a`，但 Windows + VS2026 环境通常没有安装 MinGW 工具链。

解决：

如果 BLS12381 相关 `.cpp/.h` 文件已经生成，可以忽略该错误。VS2026 路线不需要 `core.a`，而是直接把生成后的 `.cpp` 加入项目编译。

### 找不到 `bls_BLS12381.h`

原因：

工程没有添加 MIRACL Core 的 `cpp` 目录作为头文件搜索路径。

解决：

在：

```text
C/C++ → 常规 → 附加包含目录
```

加入：

```cmd
...\core-master\cpp
```

### 出现 `main` 重复定义

原因：

项目里同时加入了两个或多个包含 `main()` 的文件，例如同时加入了官方 `testbls.cpp` 和自写的 `test_bls12381_min.cpp`。

解决：

确保项目中只有一个包含 `main()` 的 `.cpp` 文件。安装验证阶段只保留 `test_bls12381_min.cpp` 即可。

### 出现 `XXX`、`YYY`、`ZZZ` 等模板占位符错误

原因：

错误地加入了模板源码文件，例如：

```text
fp.cpp
ecp.cpp
pair.cpp
bls.cpp
```

解决：

删除这些模板文件，改为加入曲线专用文件：

```text
fp_BLS12381.cpp
ecp_BLS12381.cpp
pair_BLS12381.cpp
bls_BLS12381.cpp
```

### 出现未解析的外部符号，例如 `OCT_xxx`、`HASH_xxx`、`CREATE_CSPRNG`

原因：

缺少 MIRACL Core 的通用工具源码。

解决：

确认项目中已经加入：

```text
rand.cpp
randapi.cpp
oct.cpp
hash.cpp
hmac.cpp
```

### 出现 `C4819` 编码警告

现象：

```text
warning C4819: 该文件包含不能在当前代码页中表示的字符
```

原因：

源码文件中有中文注释，但文件编码不是 VS 当前代码页可识别的格式。

解决：

将 `.cpp` 文件保存为 UTF-8 编码，最好使用：

```text
UTF-8 with signature
```

或者在测试源码中只使用英文注释。
