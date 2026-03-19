---
title: "安装 MIRACL (Visual Studio 2026)"
layout: post
date: 2025-12-25
categories: 杂项笔记
math: true
mermaid: true
---

## 从 GitHub 下载并解压源码

- 从 GitHub 下载 MIRACL 的源码压缩包，得到文件：`MIRACL-master.zip`。
- 解压 `MIRACL-master.zip`，得到文件夹：`MIRACL-master`。

此时，你能在 `MIRACL-master` 目录下看到源码的目录结构（通常包含 `include`、`source` 等），并且至少能找到 `include\miracl.h` 和 `config.c`。

## 配置并生成 MIRACL 的构建清单与必要源文件

### 编译并运行 `config.c`

- Windows 开始菜单中找到 **Visual Studio 2026** 文件夹。
- 打开：**x64 Native Tools Command Prompt for VS 2026**。
  - 必须是 **x64**（不是 x86），因为后续会用 **Release / x64** 生成并链接 `miracl.lib`，库与程序架构不一致会导致链接失败（典型如 `LNK1112`）。
- 在命令行中切换到 `MIRACL-master` 目录。
- 在 `MIRACL-master` 目录下执行 `cl config.c`。此时当前目录下会出现 `config.exe` 和 `config.obj`。
- 继续在同一个命令行里运行 `config.exe`，开始询问一系列配置问题（下一节按 Q1～Q30 逐项输入即可）。

### `config.exe` 选项怎么选

- Q1：`Do you wish to use a double as the underlying type? (Y/N)?`。输入：`N`。
- Q2：`Now enter number of bits in underlying type=`。输入：`32`。
  - 说明：在 Windows x64 下 `int` 是 32 位，选 `32` 最稳；后续大数乘法中间结果用 64 位 `long long` 承接即可。
- Q3：`Does compiler support a 64 bit integer type? (Y/N)?`。输入：`Y`。
- Q4：`Is it called long long? (Y/N)?`。输入：`Y`。
- Q5：`Do you want a no-heap version of the MIRACL C library? (Y/N)?`。输入：`N`。
  - 说明：no-heap 会限制功能与 Big 最大长度，不适合安装验证阶段。
- Q6：`Do you want a C-only version of MIRACL (Y/N)?`。输入：`N`。
  - 说明：后续要跑 `bgw.cpp`（C++ 示例），不建议裁剪成 C-only。
- Q7：`Do you want support for flash arithmetic? (Y/N)?`。输入：`N`。
- Q8：`Do you want stripped-down version (smaller - no error messages) (Y/N)?`。输入：`N`。
- Q9：`Do you want multi-threaded version of MIRACL ... (Y/N)?`。输入：`N`。
- Q10：`Does your development environment support standard screen/keyboard I/O? ... (Y/N)?`。输入：`Y`。
- Q11：`Does your development environment support standard file I/O? ... (Y/N)?`。输入：`Y`。
- Q12：`Do you for some reason NOT want to use a full-width number base? ... Answer (Y/N)?`。输入：`N`。
- Q13：`Will all of your programs use a power-of-2 as a number base (Y/N)?`。输入：`Y`。
- Q14：`Do you want to create a Comba fixed size multiplier for binary polynomial multiplication... (Y/N)?`。输入：`N`。
- Q15：`Do you wish to use the Karatsuba/Comba/Montgomery method for modular arithmetic ... Answer (Y/N)?`。输入：`N`。
- Q16：`Do you want to create a Comba fixed size modular multiplier... (Y/N)?`。输入：`N`。
- Q17：`Do you want to save space by using a smaller but slightly slower AES implementation. (Y/N)?`。输入：`N`。
- Q18：`Do you want to use Edwards paramaterization of elliptic curves over Fp ... (Y/N)?`。输入：`N`。
- Q19：`Do you want to save space by using only affine coordinates... (Y/N)?`。输入：`N`。
- Q20：`Do you want to save space by not using point compression... (Y/N)?`。输入：`N`。
- Q21：`Do you want to save space by not supporting special code for EC double-addition... (Y/N)?`。输入：`N`。
- Q22：`Do you want to save RAM by using a smaller sliding window... (Y/N)?`。输入：`N`。
- Q23：`Do you want to save some space by supressing Lazy Reduction?... (Y/N)?`。输入：`N`。
- Q24：`Do you NOT want to use the built in random number generator?... (Y/N)?`。输入：`N`。
- Q25：`Do you want to save space by only using a simple number base?... (Y/N)?`。输入：`N`。
- Q26：`Do you want to save space by NOT supporting KOBLITZ curves... (Y/N)?`。输入：`N`。
- Q27：`Do you want to save space by NOT supporting SUPERSINGULAR curves... (Y/N)?`。输入：`N`。
- Q28：`Do you want to enable a Double Precision big type... (Y/N)?`。输入：`N`。
- Q29：`Do you want to compile MIRACL as a C++ library, rather than a C library? (Y/N)?`。输入：`N`。
- Q30：`Do you want to avoid the use of compiler intrinsics? (Y/N)?`。输入：`N`。

运行结束后会提示类似：

- `A file mirdef.tst has been generated... rename it to mirdef.h`
- `A file miracl.lst has been generated...`

按提示执行两步收尾动作：

- 将 `mirdef.tst` 重命名为 `mirdef.h`。
- 准备 `mrmuldv.c`：
  - 由于本次选择的是 underlying type = `32`，建议使用通用 C 版本。
  - 将 `mrmuldv.ccc` 复制为 `mrmuldv.c`（后续会被 `miracl.lst` 引用并编译进 `miracl.lib`）。

参考内容：

```cmd
This program attempts to generate a mirdef.h file from your
responses to some simple questions, and by some internal tests
of its own.

The most fundamental decision is that of the 'underlying type'
that is the C data type to be used to store each digit of a
big number. You input the number of bits in this type, and
this program finds a suitable candidate (usually short, int or
long). Typical values would be 16, 32 or perhaps 64.
The bigger the better, but a good starting point would be to
enter the native wordlength of your computer

For your information:-
The size of a char  is 8 bits
The size of a short is 16 bits
The size of an int  is 32 bits
The size of a long  is 32 bits
The size of a double is 64 bits, its mantissa is 53 bits
The size of a long double is 64 bits, its mantissa is 53 bits

    Little-endian processor detected

A double can be used as the underlying type. In rare circumstances
 this may be optimal. NOT recommended!

Do you wish to use a double as the underlying type? (Y/N)?N

Now enter number of bits in underlying type= 32

    underlying type is an int
    32 bit unsigned type is an unsigned int

Does compiler support a 64 bit integer type? (Y/N)?Y
Is it called long long? (Y/N)?Y
    double length type is a long long
    64 bit unsigned type is an unsigned long long

For very constrained environments it is possible to build a version of MIRACL
which does not require a heap. Not recommended for beginners.
Some routines are not available in this mode and the max length of Big
variables is fixed at compile time
Do you want a no-heap version of the MIRACL C library? (Y/N)? N

Do you want a C-only version of MIRACL (Y/N)?N

Do you want support for flash arithmetic? (Y/N)?N
Do you want stripped-down version (smaller - no error messages) (Y/N)?N
Do you want multi-threaded version of MIRACL
Not recommended for program development - read the manual (Y/N)?N
Does your development environment support standard screen/keyboard I/O?
(It doesn't for example in MS Windows, and embedded applications)
If in doubt, answer Yes (Y/N)?Y
Does your development environment support standard file I/O?
(It doesn't for example in an embedded application)
If in doubt, answer Yes (Y/N)?Y


Do you for some reason NOT want to use a full-width number base?

You may not if your processor instruction set does not support
32-bit UNSIGNED multiply and divide instructions.
If NOT then a full-width number base will be difficult and
slow to implement, which is a pity, because its normally faster
If for some other reason you don't want to use a full-width
number base, (abnormal handling of integer overflow or no muldvd()
/muldvd2()/muldvm() available?), answer Yes
If in doubt answer No

Answer (Y/N)?N

Always using a power-of-2 (or 0) as a number base reduces code space
and will also be a little faster. This is recommended.

Will all of your programs use a power-of-2 as a number base (Y/N)?Y

Do you want to create a Comba fixed size multiplier
for binary polynomial multiplication. This requires that
your processor supports a special binary multiplication instruction
which it almost certainly does not....
Useful particularly for Elliptic Curve cryptosystems over GF(2^m).

Default to No. Answer (Y/N)?N

Do you wish to use the Karatsuba/Comba/Montgomery method
for modular arithmetic - as used by exponentiation
cryptosystems like RSA.
This method is probably fastest om most processors which
which support unsigned mul and a carry flag
NOTE: your compiler must support in-line assembly,
and you must be able to supply a suitable .mcs file
like, for example, ms86.mcs for pentium processors

Answer (Y/N)?N

Do you want to create a Comba fixed size modular
multiplier, for faster modular multiplication with
smaller moduli. Can generate a lot of code
Useful particularly for Elliptic Curve cryptosystems over GF(p).

Answer (Y/N)?N

Do you want to save space by using a smaller but slightly slower
AES implementation. Default to No. (Y/N)?N

Do you want to use Edwards paramaterization of elliptic curves over Fp
This is faster for basic Elliptic Curve cryptography (but does not support
Pairing-based Cryptography and some applications). Default to No. (Y/N)?N


Do you want to save space by using only affine coordinates
for elliptic curve cryptography. Default to No. (Y/N)?N

Do you want to save space by not using point compression
for EC(p) elliptic curve cryptography. Default to No. (Y/N)?N

Do you want to save space by not supporting special code
for EC double-addition, as required for ECDSA signature
verification, or any multi-addition of points. Default to No. (Y/N)?N

Do you want to save RAM by using a smaller sliding window
for all elliptic curve cryptography. Default to No. (Y/N)?N

Do you want to save some space by supressing Lazy Reduction?
(as used for ZZn2 arithmetic). Default to No. (Y/N)?N

Do you NOT want to use the built in random number generator?
Removing it saves space, and maybe you have your own source
of randomness? Default to No. (Y/N)?N

Do you want to save space by only using a simple number base?
(the number base in mirsys(.) must be 0 or must divide 2^U
exactly, where U is number of bits in the underlying type)
NOTE: no number base changes possible
Default to No. (Y/N)?N

Do you want to save space by NOT supporting KOBLITZ curves
for EC(2^m) elliptic curve cryptography. Default to No. (Y/N)?N

Do you want to save space by NOT supporting SUPERSINGULAR curves
for EC(2^m) elliptic curve cryptography. Default to No. (Y/N)?N

Do you want to enable a Double Precision big type. See doubig.txt
for more information. Default to No. (Y/N)?N

Do you want to compile MIRACL as a C++ library, rather than a C library?
Default to No. (Y/N)?N

Do you want to avoid the use of compiler intrinsics?
Default to No. (Y/N)?N

You must now provide an assembly or C file mrmuldv.c,
containing implementations of muldiv(), muldvd(), muldvd2() and muldvm()
Check mrmuldv.any - a C or assembly language version is
there already

A file mirdef.tst has been generated. If you are happy with it,
rename it to mirdef.h and use for compiling the MIRACL library.
A file miracl.lst has been generated that includes all the
files to be included in this build of the MIRACL library.
```

## 生成 `miracl.lib`

### 新建静态库项目 `miracl`

- 在 **Visual Studio 2026** 中新建一个“静态库（C++）”项目，项目命名为 `miracl`，直接使用默认的 C++ 静态库模板即可。
- 新建完成后，解决方案资源管理器里会出现一些模板自带文件（常见如 `miracl.cpp`、`pch.h`、`pch.cpp`、`framework.h`），把它们**删除或从项目中排除**，确保项目后续只编译 MIRACL 的源码文件。
  - 易错点：如果保留了 `pch.*` 或开启了预编译头设置，后面导入 `.c` 文件时很容易出现无意义的编译报错（例如要求必须包含 `pch.h`）。

### 导入 `miracl.lst` 中列出的全部 `.c` 文件

- 打开 `miracl.lst`（由 `config.exe` 生成，通常就在你运行 `config.exe` 的那个目录），确认里面列出了本次构建要编进静态库的 `.c` 文件清单，并且包含 `mrmuldv.c`。
- 在 Visual Studio 的解决方案资源管理器中，对项目 `miracl` 右键选择 **添加 → 现有项…**，然后到你本机 MIRACL 源码所在目录，把 `miracl.lst` 中列出的 `.c` 文件**全部选中并加入项目**（可以使用文末提供的 Python 脚本辅助完成）。
  - 不同 MIRACL 版本的目录结构不一样，有的 `.c` 在根目录，有的在 `source` 目录；不要死盯路径，原则是“清单里列出的文件必须全部加入”。
  - 一定要确认项目里最终确实加入了 `mrmuldv.c`，否则后续会缺少 `muldiv/muldvd/muldvd2/muldvm` 的实现导致链接问题。

### 配置 `miracl` 项目并生成 `miracl.lib`

- 在 VS 顶部工具栏把 **解决方案配置**切换为 `Release`、把 **解决方案平台**切换为 `x64`，保证后续生成出来的库与你最终要运行的测试程序架构一致。
- 右键项目 `miracl` → **属性**，在 `Release | x64` 下把 **C/C++ → 预编译头** 设置为 **不使用预编译头**，避免模板工程的 PCH 机制影响 MIRACL 的 `.c` 文件编译。
- 在 **C/C++ → 常规 → 附加包含目录** 中添加能找到 `miracl.h` 与你生成的 `mirdef.h` 的目录，并确保编译时优先使用你用 `config.exe` 生成的那份 `mirdef.h`（必要时可以用它覆盖 MIRACL 自带的 `include\mirdef.h`）。
  - 如果工程里同时存在“旧的 `mirdef.h`”和“你生成的 `mirdef.h`”，并且包含目录顺序不对，就会出现“看似能编过，但运行/链接异常”的非常隐蔽问题。

右键项目 `miracl` → **生成/重新生成**，生成完成后在输出窗口确认出现 `... -> ...\x64\Release\miracl.lib`，并在对应目录下检查 `miracl.lib` 的更新时间为刚刚生成。

## 测试工程 `bgw_test`（验证 MIRACL 可用）

### 创建工程并导入测试源码

- 在 **Visual Studio 2026** 中新建一个控制台工程，推荐直接用“控制台应用（C++）”模板，项目命名为 `bgw_test`。

- 创建完成后，将模板自动生成的源文件（通常带 `main`）删除或从项目中排除，避免出现“重复定义 `main`”的编译错误，并准备把 `bgw.cpp` 作为唯一入口程序加入工程。

- 在解决方案资源管理器中对项目 `bgw_test` 右键选择 **添加 → 现有项…**，将 `bgw.cpp` 加入工程，同时按你在 `bgw.cpp` 中选择的 pairing 曲线类型加入配套的 `.cpp` 文件（只选一套，不要混用）。

  - 如果在 `bgw.cpp` 中启用的是 **`MR_PAIRING_SSP`**（GF(p) 曲线），需要加入：`ssp_pair.cpp`、`ecn.cpp`、`zzn.cpp`、`zzn2.cpp`、`big.cpp`。
  - 如果在 `bgw.cpp` 中启用的是 **`MR_PAIRING_SS2`**（GF(2^m) 曲线），需要加入：`ss2_pair.cpp`、`ec2.cpp`、`gf2m.cpp`、`gf2m4x.cpp`、`big.cpp`。


> 这里说的“在 `bgw.cpp` 中选择 pairing 曲线类型”，指的是 **`bgw.cpp` 顶部那一组 `#define MR_PAIRING_SS2` / `#define MR_PAIRING_SSP` 的宏开关**。你需要 **只启用其中一种**（另一种保持注释），MIRACL 会据此编译不同的双线性对（pairing）曲线实现：
>
> - `MR_PAIRING_SS2`：基于 **GF(2^m)** 的曲线实现（需要 `ss2_pair.cpp` 等配套源文件）。
> - `MR_PAIRING_SSP`：基于 **GF(p)** 的曲线实现（需要 `ssp_pair.cpp` 等配套源文件）。
>
> **注意：两套源文件不能混用**，否则会出现重复符号或链接错误。
>
> ```cpp
> //********* CHOOSE JUST ONE OF THESE **********
> #define MR_PAIRING_SS2    // AES-80 or AES-128 security GF(2^m) curve
> //#define AES_SECURITY 80   // OR
> #define AES_SECURITY 128
> 
> //#define MR_PAIRING_SSP    // AES-80 or AES-128 security GF(p) curve
> //#define AES_SECURITY 80   // OR
> //#define AES_SECURITY 128
> //*********************************************
> ```

### 配置 `bgw_test` 工程

- 在 VS 顶部工具栏把 **解决方案配置** 切换为 `Release`、把 **解决方案平台** 切换为 `x64`，并确保与 `miracl.lib` 的生成配置完全一致。
- 右键项目 `bgw_test` → **属性**，将 **C/C++ → 语言 → C++ 语言标准** 设置为 **C++17**。
  - 如果使用更高版本（例如 C++20/Latest），MIRACL 的旧式输入代码可能在 `big.cpp` 处触发 `istream >> char*` 相关编译错误；固定到 C++17 是最省事的兼容方案。
- 在 **C/C++ → 常规** 中，将以下三个目录加入 **附加包含目录**，否则 `bgw.cpp` 以及 pairing 相关源码会因为找不到头文件而无法编译：
  - `MIRACL-master\include`（包含 `miracl.h` / `mirdef.h` 等核心头文件）
  - `MIRACL-master\source\curve`（包含椭圆曲线相关头文件）
  - `MIRACL-master\source\curve\pairing`（包含 pairing 相关头文件）
- 在 **链接器 → 常规** 中把 `miracl.lib` 所在目录加入 **附加库目录**（通常是 `...\miracl\x64\Release\`）。
- 在 **链接器 → 输入** 中把 `miracl.lib` 加入 **附加依赖项**，保证 `bgw_test` 能链接到你生成的静态库。
- 在 **C/C++ → 代码生成 → 运行库** 中，让 `bgw_test` 与 `miracl` 工程保持一致（Release 下一般用 `/MD`），避免运行库不一致带来的链接错误。

### 运行并确认输出

- 将 `bgw_test` 设为启动项目，使用 **Ctrl + F5**（不调试运行）执行程序，观察控制台输出。
- 若安装与链接正确，程序会打印两行关键结果，形如：`Encryption Key= ...` 与 `Decryption Key= ...`，并且两者应当完全一致，同时进程以退出码 0 结束，这就说明：`miracl.lib` 可用、pairing 相关源码编译无误、`bgw.cpp` 的流程可以正常跑通。

```
Encryption Key= DD22AE26644036E62C7AC9BE03C695BB
Decryption Key= DD22AE26644036E62C7AC9BE03C695BB
```

## 附录：Python 脚本

```python
#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
find_and_copy.py

========================
功能
========================
从控制台输入“若干个文件名”（每行一个，空行结束），再输入一个目录路径（单独一行）。
脚本会在该目录下递归搜索这些文件，并将找到的文件复制到当前目录下新建的 searchResult 文件夹中。

========================
使用方式（Windows / macOS / Linux）
========================

1) 保存本脚本为：find_and_copy.py

2) 打开终端/命令行，进入脚本所在目录后执行：
   - Windows:
       python find_and_copy.py
     或
       py find_and_copy.py
   - macOS/Linux:
       python3 find_and_copy.py

3) 按提示输入文件名列表（每行一个），例如：
       mrcore.c
       mrarth0.c
       mrarth1.c
       mrarth2.c
       mrsmall.c
       mrio1.c

   输入完成后，直接按一次回车（输入空行）结束文件名输入。

4) 然后再输入要搜索的目录路径（单独一行），例如：
       D:\\Projects\\MIRACL-master\\source
   也可以输入：
       D:\Projects\MIRACL-master\source

5) 脚本执行结束后，会在“当前工作目录”（你运行脚本时所在的目录）生成：
       ./searchResult
   并将找到的文件复制进去。

========================
注意事项
========================
- 搜索是递归的：会在目录及其所有子目录里查找。
- 如果同名文件在不同子目录中出现多份，脚本会自动改名避免覆盖：
    e.g. mrcore.c, mrcore__1.c, mrcore__2.c ...
- 复制会保留文件元信息（mtime 等），使用 shutil.copy2。
- 如果你想只在当前目录（不递归）查找，可自行修改 walk 部分（本脚本默认递归）。
"""

from __future__ import annotations

import os
import sys
import shutil
from pathlib import Path
from typing import Dict, List, Set


def read_filenames_from_stdin() -> List[str]:
    """
    逐行读取文件名，直到遇到空行结束。
    返回去重后的文件名列表（保持输入顺序）。
    """
    print("请输入若干个文件名（每行一个），输入空行结束：")
    seen: Set[str] = set()
    filenames: List[str] = []

    while True:
        line = input().strip()
        if line == "":
            break
        # 只取文件名本身，防止用户误输入路径
        name = Path(line).name
        if name not in seen:
            seen.add(name)
            filenames.append(name)

    if not filenames:
        print("未输入任何文件名，退出。")
        sys.exit(1)

    return filenames


def read_search_root() -> Path:
    """
    读取搜索根目录路径。
    """
    print("请输入要搜索的目录路径（单独一行）：")
    root_str = input().strip().strip('"')  # 去掉可能的引号
    root = Path(root_str)

    if not root.exists() or not root.is_dir():
        print(f"目录不存在或不是目录：{root}")
        sys.exit(1)

    return root


def ensure_output_dir() -> Path:
    """
    在当前工作目录创建 searchResult 目录（如果已存在则复用）。
    """
    out_dir = Path.cwd() / "searchResult"
    out_dir.mkdir(parents=True, exist_ok=True)
    return out_dir


def build_unique_dest_path(out_dir: Path, filename: str, used: Dict[str, int]) -> Path:
    """
    生成不冲突的目标文件路径：
    - 第一次：filename
    - 第二次：name__1.ext
    - 第三次：name__2.ext
    ...
    """
    p = Path(filename)
    stem = p.stem
    suffix = p.suffix  # 包含 '.c' 之类
    count = used.get(filename, 0)

    if count == 0:
        used[filename] = 1
        return out_dir / filename

    # 已存在同名，开始追加编号
    new_name = f"{stem}__{count}{suffix}"
    used[filename] = count + 1
    return out_dir / new_name


def search_files(root: Path, target_names: Set[str]) -> List[Path]:
    """
    在 root 下递归搜索文件名属于 target_names 的文件，返回命中的完整路径列表。
    """
    hits: List[Path] = []
    for dirpath, _, filenames in os.walk(root):
        for fn in filenames:
            if fn in target_names:
                hits.append(Path(dirpath) / fn)
    return hits


def main() -> None:
    filenames = read_filenames_from_stdin()
    root = read_search_root()

    target_set = set(filenames)
    out_dir = ensure_output_dir()

    print("\n开始搜索...")
    hits = search_files(root, target_set)

    # 统计每个目标文件是否找到
    found_map: Dict[str, List[Path]] = {name: [] for name in filenames}
    for p in hits:
        found_map[p.name].append(p)

    # 复制文件
    used_name_counter: Dict[str, int] = {}
    copied_count = 0

    print(f"输出目录：{out_dir}\n")
    for name in filenames:
        paths = found_map.get(name, [])
        if not paths:
            print(f"[未找到] {name}")
            continue

        for src in paths:
            dest = build_unique_dest_path(out_dir, name, used_name_counter)
            try:
                shutil.copy2(src, dest)
                copied_count += 1
                print(f"[已复制] {src}  ->  {dest.name}")
            except Exception as e:
                print(f"[复制失败] {src}  ({e})")

    # 汇总
    missing = [n for n in filenames if not found_map.get(n)]
    print("\n====================")
    print(f"搜索根目录：{root}")
    print(f"目标文件数（去重后）：{len(filenames)}")
    print(f"命中路径数：{len(hits)}")
    print(f"成功复制文件数：{copied_count}")
    if missing:
        print(f"未找到：{len(missing)} 个 -> {', '.join(missing)}")
    else:
        print("全部目标文件均已找到并处理。")
    print("====================\n")


if __name__ == "__main__":
    main()
```