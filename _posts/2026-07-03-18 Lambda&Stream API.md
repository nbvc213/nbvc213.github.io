---
title: "18 Lambda&Stream API"
layout: post
date: 2026-07-03
categories: Java 笔记
math: true
mermaid: true
---

## Lambda 表达式概述

Lambda 表达式是 JDK 1.8 引入的重要语法特性，用于简化函数式接口的实现。它可以在很多场景下替代匿名内部类，使代码更加简洁，尤其常见于集合排序、集合遍历、线程任务、事件回调和 Stream 操作中。

Lambda 表达式并不是脱离对象体系独立存在的“函数”。在 Java 中，Lambda 表达式的本质是**函数式接口的实例**。只要一个接口是函数式接口，就可以使用 Lambda 表达式来表示该接口的实现对象。

### Lambda 表达式的引入

在 JDK 1.8 之前，如果需要临时实现一个接口，通常会使用匿名内部类。例如，对 `List<Integer>` 进行降序排序时，可以这样写：

```java
List<Integer> numbers = Arrays.asList(3, 6, 1, 7, 2, 5, 4);

Collections.sort(numbers, new Comparator<Integer>() {
    @Override
    public int compare(Integer left, Integer right) {
        return right - left;
    }
});

System.out.println(numbers);
```

这段代码的核心逻辑其实只有一行：

```java
return right - left;
```

但是匿名内部类需要写出接口名、泛型、方法重写结构和方法体，代码显得比较冗长。

使用 Lambda 表达式后，可以简化为：

```java
List<Integer> numbers = Arrays.asList(3, 6, 1, 7, 2, 5, 4);

Collections.sort(numbers, (left, right) -> right - left);

System.out.println(numbers);
```

`(left, right) -> right - left` 表示对 `Comparator<Integer>` 中唯一的抽象方法 `compare()` 的实现。编译器可以根据 `Collections.sort()` 的参数类型推断出这里需要的是一个 `Comparator<Integer>` 对象，因此不需要再显式写出匿名内部类的完整结构。

#### 函数式编程思想

Java 最初以面向对象编程为核心，即通过对象封装数据和行为，完成程序功能。面向对象更关注“谁来做”，通常需要先找到对象，再调用对象的方法。

例如：

```java
printer.print("hello");
```

这类写法强调 `printer` 这个对象负责打印行为。

函数式编程更关注“做什么”，强调把行为本身作为可以传递的数据。Lambda 表达式正是 Java 对函数式编程思想的一种支持。

例如：

```java
(left, right) -> right - left
```

这段代码关注的是排序规则本身，即两个元素应该如何比较，而不是专门定义一个类去承载这个规则。

| 编程思想     | 关注重点         | 常见表达方式       |
| ------------ | ---------------- | ------------------ |
| 面向对象编程 | 对象及其行为封装 | 创建对象，调用方法 |
| 函数式编程   | 行为本身         | 将行为作为参数传递 |

Java 中的 Lambda 表达式不是独立函数，而是函数式接口的实现。因此，Lambda 表达式必须依附于一个明确的接口类型。

#### 函数式接口

函数式接口指的是**有且只有一个抽象方法的接口**。Lambda 表达式只能用于函数式接口。

例如：

```java
@FunctionalInterface
public interface Flyable {
    void fly();
}
```

`Flyable` 接口中只有一个抽象方法 `fly()`，因此它是函数式接口，可以使用 Lambda 表达式创建它的实例：

```java
Flyable flyable = () -> System.out.println("bird fly");

flyable.fly();
```

这段代码中：

```java
() -> System.out.println("bird fly")
```

就是对 `fly()` 方法的实现。

如果接口中存在多个抽象方法，就不能使用 Lambda 表达式表示它的实例，因为编译器无法判断 Lambda 表达式到底要实现哪个抽象方法。

```java
public interface AnimalAction {
    void move();
    void fly();
}
```

这个接口中有两个抽象方法，不能使用 Lambda 表达式直接实现：

```java
AnimalAction action = () -> System.out.println("move"); // 编译错误
```

#### @FunctionalInterface

`@FunctionalInterface` 用于标记函数式接口。它的作用是让编译器检查当前接口是否满足函数式接口的要求。

```java
@FunctionalInterface
public interface Task {
    void execute();

    default void printInfo() {
        System.out.println("task info");
    }

    static void help() {
        System.out.println("task help");
    }
}
```

函数式接口中可以定义默认方法和静态方法，因为它们不是抽象方法，不影响“只有一个抽象方法”的规则。

如果在接口中再增加一个抽象方法：

```java
@FunctionalInterface
public interface Task {
    void execute();

    void stop();
}
```

编译器会报错，因为该接口已经不再满足函数式接口的要求。

需要注意，`@FunctionalInterface` 不是函数式接口成立的必要条件。只要接口中有且只有一个抽象方法，即使没有使用该注解，它仍然是函数式接口。

```java
public interface Printer {
    void print(String message);
}
```

虽然没有写 `@FunctionalInterface`，但 `Printer` 仍然可以使用 Lambda 表达式：

```java
Printer printer = message -> System.out.println(message);

printer.print("hello");
```

> **结论**
>
> `@FunctionalInterface` 的作用是编译检查，不是创建函数式接口的必要条件。函数式接口成立的核心标准是：接口中有且只有一个抽象方法。

### Lambda 表达式的基本结构

Lambda 表达式的基本结构如下：

```java
(参数列表) -> {
    方法体
}
```

其中，`->` 可以读作“指向”或“实现”。左边是参数列表，右边是方法体。

例如：

```java
Comparator<Integer> comparator = (left, right) -> {
    return right - left;
};
```

如果方法体只有一条返回语句，可以简写为：

```java
Comparator<Integer> comparator = (left, right) -> right - left;
```

如果只有一个参数，参数列表的小括号也可以省略：

```java
Printer printer = message -> System.out.println(message);
```

如果没有参数，必须保留空括号：

```java
Task task = () -> System.out.println("execute task");
```

Lambda 表达式能否简写，取决于参数数量和方法体结构。简写的前提是不能破坏代码含义和可读性。

### Lambda 表达式和匿名内部类

Lambda 表达式经常被理解为匿名内部类的简化写法，但二者并不完全等价。

匿名内部类适用范围更广。它可以用于接口、抽象类，也可以用于普通类。例如，抽象类中有多个抽象方法时，可以用匿名内部类一次性实现这些方法：

```java
abstract class Animal {
    public abstract void move();

    public abstract void fly();
}

Animal animal = new Animal() {
    @Override
    public void move() {
        System.out.println("move");
    }

    @Override
    public void fly() {
        System.out.println("fly");
    }
};
```

普通类也可以通过匿名内部类创建一个没有名字的子类，并重写其中的方法：

```java
class Worker {
    public void work() {
        System.out.println("working");
    }
}

Worker worker = new Worker() {
    @Override
    public void work() {
        System.out.println("worker working");
    }
};
```

Lambda 表达式的适用范围更窄。它只能用于函数式接口，不能用于普通类或抽象类，也不能用于含有多个抽象方法的接口。

| 对比项           | 匿名内部类                             | Lambda 表达式                                   |
| ---------------- | -------------------------------------- | ----------------------------------------------- |
| 适用对象         | 接口、抽象类、普通类                   | 只能用于函数式接口                              |
| 抽象方法数量要求 | 不要求必须只有一个抽象方法             | 必须只有一个抽象方法                            |
| 代码形式         | 结构完整但较冗长                       | 简洁，突出行为                                  |
| 编译实现         | 通常生成独立的匿名内部类 `.class` 文件 | 通常通过 `invokedynamic` 等机制在运行时动态处理 |
| 主要用途         | 临时创建子类或接口实现类               | 简化函数式接口实现                              |

> **易错点**
>
> Lambda 表达式不能完全替代匿名内部类。只有当目标类型是函数式接口时，才能使用 Lambda 表达式。

## Lambda 表达式的使用

Lambda 表达式用于简化函数式接口的实现。它省略了匿名内部类中大量固定模板，只保留抽象方法最核心的两个部分：**参数列表**和**方法体**。

在 Java 中，Lambda 表达式不能脱离目标类型单独存在。它必须依附于某个函数式接口，由编译器根据上下文推断出 Lambda 表达式要实现的具体接口和抽象方法。

### Lambda 表达式的基本语法

Lambda 表达式的基本格式如下：

```java
(形参列表) -> {
    方法体
}
```

其中，`->` 称为 Lambda 操作符，也叫箭头操作符。左侧的形参列表对应函数式接口中抽象方法的参数列表，右侧的方法体对应该抽象方法的具体实现。

例如，使用匿名内部类实现比较器：

```java
Comparator<Integer> comparator = new Comparator<Integer>() {
    @Override
    public int compare(Integer left, Integer right) {
        return left - right;
    }
};
```

转换为 Lambda 表达式后：

```java
Comparator<Integer> comparator = (Integer left, Integer right) -> {
    return left - right;
};
```

这段 Lambda 表达式的含义是：实现 `Comparator<Integer>` 接口中的 `compare()` 方法，接收两个 `Integer` 参数，并返回它们的比较结果。

Lambda 表达式关注的是行为本身。相比匿名内部类，它省略了接口实现类、方法重写结构和方法名，使代码更紧凑。

### Lambda 表达式的上下文环境

Lambda 表达式必须有明确的上下文环境。上下文环境用于告诉编译器：当前 Lambda 表达式要被当作哪个函数式接口的实例。

例如：

```java
@FunctionalInterface
interface Flyable {
    void fly();
}
Flyable flyable = () -> {
    System.out.println("fly...");
};

flyable.fly();
```

这里 `Flyable flyable` 就是 Lambda 表达式的上下文环境。编译器根据变量类型 `Flyable` 推断出：`() -> { ... }` 是在实现 `Flyable` 接口中的 `fly()` 方法。

如果直接写：

```java
() -> {
    System.out.println("fly...");
};
```

这段代码无法通过编译，因为编译器不知道它应该对应哪个接口，也无法确定它的参数列表和返回值规则。

除了变量赋值，方法调用参数也可以提供上下文环境。例如：

```java
public static void execute(Flyable flyable) {
    flyable.fly();
}
execute(() -> System.out.println("fly..."));
```

这里 `execute()` 方法的形参类型是 `Flyable`，因此方法调用也为 Lambda 表达式提供了目标类型。

> **易错点**
>
> Lambda 表达式必须依赖目标类型。没有函数式接口作为上下文，Lambda 表达式无法独立存在。

### 无返回值的 Lambda 表达式

无返回值的函数式接口，其抽象方法返回值类型为 `void`。根据参数数量不同，Lambda 表达式可以分为无参数、一个参数和多个参数三种情况。

#### 无参数无返回值

```java
@FunctionalInterface
interface NoParameterNoReturn {
    void test();
}
NoParameterNoReturn task = () -> {
    System.out.println("无参数无返回值");
};

task.test();
```

如果方法体只有一条语句，可以省略大括号：

```java
NoParameterNoReturn task = () -> System.out.println("无参数无返回值");

task.test();
```

无参数时，参数列表必须写成空括号 `()`，不能省略。

#### 一个参数无返回值

```java
@FunctionalInterface
interface OneParameterNoReturn {
    void test(Integer value);
}
OneParameterNoReturn printer = (Integer value) -> {
    System.out.println(value * 10);
};

printer.test(100);
```

一个参数时，参数类型可以由上下文推断，因此可以省略：

```java
OneParameterNoReturn printer = value -> System.out.println(value * 10);

printer.test(100);
```

当只有一个参数并且省略参数类型时，参数列表的小括号也可以省略。

#### 多个参数无返回值

```java
@FunctionalInterface
interface MoreParameterNoReturn {
    void test(Integer left, Integer right);
}
MoreParameterNoReturn printer = (Integer left, Integer right) -> {
    System.out.println(left + right);
};

printer.test(10, 20);
```

多个参数时，可以省略参数类型：

```java
MoreParameterNoReturn printer = (left, right) -> System.out.println(left + right);

printer.test(10, 20);
```

多个参数的小括号不能省略。

### 有返回值的 Lambda 表达式

有返回值的函数式接口，其抽象方法声明了返回值类型。Lambda 方法体需要返回与抽象方法兼容的结果。

#### 无参数有返回值

```java
@FunctionalInterface
interface NoParameterHasReturn {
    Integer test();
}
NoParameterHasReturn supplier = () -> {
    return 100;
};

System.out.println(supplier.test());
```

如果方法体只有一条 `return` 语句，可以省略大括号和 `return`：

```java
NoParameterHasReturn supplier = () -> 100;

System.out.println(supplier.test());
```

#### 一个参数有返回值

```java
@FunctionalInterface
interface OneParameterHasReturn {
    Integer test(Integer value);
}
OneParameterHasReturn calculator = (Integer value) -> {
    return value * 10;
};

System.out.println(calculator.test(100));
```

精简后：

```java
OneParameterHasReturn calculator = value -> value * 10;

System.out.println(calculator.test(100));
```

#### 多个参数有返回值

```java
@FunctionalInterface
interface MoreParameterHasReturn {
    Integer test(Integer a, Integer b, Integer c);
}
MoreParameterHasReturn calculator = (Integer a, Integer b, Integer c) -> {
    return a + b + c;
};

System.out.println(calculator.test(1, 2, 3));
```

精简后：

```java
MoreParameterHasReturn calculator = (a, b, c) -> a + b + c;

System.out.println(calculator.test(1, 2, 3));
```

### Lambda 表达式的语法精简规则

Lambda 表达式可以根据上下文进行语法精简，但精简必须遵守规则，不能为了简短而破坏可读性或语法正确性。

| 精简规则                                                    | 示例                                                       |
| ----------------------------------------------------------- | ---------------------------------------------------------- |
| 参数类型可以省略                                            | `(Integer a, Integer b) -> a + b` 可写为 `(a, b) -> a + b` |
| 多个参数省略类型时，必须全部省略                            | 不能写成 `(Integer a, b) -> a + b`                         |
| 只有一个参数且省略类型时，小括号可以省略                    | `(value) -> value * 10` 可写为 `value -> value * 10`       |
| 没有参数时，小括号不能省略                                  | `() -> 100`                                                |
| 多个参数时，小括号不能省略                                  | `(a, b) -> a + b`                                          |
| 方法体只有一条语句时，可以省略 `{}`                         | `value -> System.out.println(value)`                       |
| 方法体只有一条返回语句时，省略 `{}` 后必须同时省略 `return` | `(a, b) -> a + b`                                          |

例如：

```java
MoreParameterHasReturn calculator = (Integer a, Integer b, Integer c) -> {
    return a + b + c;
};
```

可以逐步精简为：

```java
MoreParameterHasReturn calculator = (a, b, c) -> {
    return a + b + c;
};
```

继续精简为：

```java
MoreParameterHasReturn calculator = (a, b, c) -> a + b + c;
```

但是不能写成：

```java
MoreParameterHasReturn calculator = (a, b, c) -> return a + b + c; // 编译错误
```

因为省略大括号后，表达式体不能再写 `return`。

> **易错点**
>
> 如果 Lambda 方法体使用 `{}`，有返回值时需要显式写 `return`；如果省略 `{}`，则不能写 `return`，表达式结果会自动作为返回值。

### 四个常用函数式接口

JDK 在 `java.util.function` 包中提供了大量通用函数式接口。常用的四个基本接口是 `Consumer`、`Supplier`、`Function` 和 `Predicate`。

| 类型       | 接口             | 抽象方法            | 含义                               |
| ---------- | ---------------- | ------------------- | ---------------------------------- |
| 消费型接口 | `Consumer<T>`    | `void accept(T t)`  | 接收一个参数，不返回结果           |
| 生产型接口 | `Supplier<T>`    | `T get()`           | 不接收参数，返回一个结果           |
| 转换型接口 | `Function<T, R>` | `R apply(T t)`      | 接收一个参数，转换后返回另一个结果 |
| 判断型接口 | `Predicate<T>`   | `boolean test(T t)` | 接收一个参数，返回判断结果         |

这些接口出现的位置，都可以使用 Lambda 表达式。

#### Consumer

`Consumer<T>` 表示消费型接口，特点是**有参数、无返回值**。

```java
import java.util.function.Consumer;

public class ConsumerTest {
    public static void main(String[] args) {
        Consumer<String> printer = value -> System.out.println(value);

        printer.accept("hello");
    }
}
```

`printer.accept("hello")` 会执行 Lambda 表达式中的打印逻辑。

`Consumer` 常用于遍历、输出、保存、处理数据等只需要消费参数而不需要返回结果的场景。

#### Supplier

`Supplier<T>` 表示生产型接口，特点是**无参数、有返回值**。

```java
import java.util.function.Supplier;

public class SupplierTest {
    public static void main(String[] args) {
        Supplier<String> supplier = () -> "hello world";

        System.out.println(supplier.get());
    }
}
```

`Supplier` 常用于延迟提供对象、生成默认值、构造数据等场景。

#### Function

`Function<T, R>` 表示转换型接口，特点是**接收一个参数，返回一个转换结果**。

```java
import java.util.function.Function;

public class FunctionTest {
    public static void main(String[] args) {
        Function<Teacher, String> getTeacherName = teacher -> teacher.getName();

        Teacher teacher = new Teacher("张三");
        System.out.println(getTeacherName.apply(teacher));
    }
}

class Teacher {
    private String name;

    public Teacher(String name) {
        this.name = name;
    }

    public String getName() {
        return name;
    }
}
```

`Function<T, R>` 中，`T` 表示传入参数类型，`R` 表示返回结果类型。

#### Predicate

`Predicate<T>` 表示判断型接口，特点是**接收一个参数，返回 boolean 结果**。

```java
import java.util.function.Predicate;

public class PredicateTest {
    public static void main(String[] args) {
        Predicate<String> javaFile = fileName -> fileName.endsWith(".java");

        System.out.println(javaFile.test("Hello.java"));
    }
}
```

`Predicate` 常用于条件判断、过滤、删除等场景。

### Lambda 在集合中的常见用法

集合框架中很多方法都接收函数式接口作为参数，因此可以直接使用 Lambda 表达式。

#### forEach

`forEach()` 常用于遍历集合。它接收一个 `Consumer`，表示对每个元素执行某个操作。

```java
Set<String> names = new HashSet<>();

names.add("jack");
names.add("lucy");
names.add("jerry");
names.add("tom");

names.forEach(name -> System.out.println(name));
```

这段代码表示：遍历集合中的每个元素，并将元素打印出来。

如果 Lambda 表达式只是简单调用 `System.out.println()`，后续还可以使用方法引用进一步简化，不过方法引用属于后续知识点。

#### removeIf

`removeIf()` 用于根据条件删除集合中的元素。它接收一个 `Predicate`，表示删除条件。

```java
Set<String> names = new HashSet<>();

names.add("jackson");
names.add("lucy");
names.add("tom");
names.add("jetty");

names.removeIf(name -> "tom".equals(name));

System.out.println(names);
```

这段代码表示：如果集合元素等于 `"tom"`，就删除该元素。

这里推荐写成：

```java
"tom".equals(name)
```

而不是：

```java
name.equals("tom")
```

因为前者可以避免 `name` 为 `null` 时出现 `NullPointerException`。

## Lambda 表达式的方法引用

方法引用（Method Reference）是 Lambda 表达式的进一步简化形式。它适用于一种特定场景：**Lambda 表达式的方法体只是在调用一个已经存在的方法，没有额外逻辑，并且参数与返回值能够和函数式接口的抽象方法匹配**。

方法引用的本质仍然是函数式接口的实例。它不是新的执行机制，而是一种让代码更简洁的语法糖。

### 方法引用的基本理解

当 Lambda 表达式只是把参数原封不动地传给某个已有方法，并直接返回该方法的结果时，就可以考虑使用方法引用。

例如：

```java
Function<Double, Long> roundFunction = value -> Math.round(value);
```

这段 Lambda 表达式的方法体只做了一件事：调用 `Math.round(value)`。因此可以简化为：

```java
Function<Double, Long> roundFunction = Math::round;
```

这里的 `Math::round` 表示引用 `Math` 类中的静态方法 `round()`。编译器会根据 `Function<Double, Long>` 的抽象方法：

```java
Long apply(Double value);
```

推断出 `Math::round` 应该接收一个 `Double` 参数，并返回一个 `Long` 结果。

### 方法引用的使用条件

方法引用不是所有 Lambda 表达式都能替换。只有当 Lambda 表达式满足以下条件时，才适合改写为方法引用：

1. Lambda 方法体中只有一条语句。
2. 这条语句只是调用一个已经存在的方法或构造方法。
3. 没有额外判断、计算、打印前缀、变量修改等附加逻辑。
4. 函数式接口抽象方法的参数列表能够与被引用方法匹配。
5. 函数式接口抽象方法的返回值类型能够与被引用方法返回值兼容。

可以使用方法引用：

```java
Function<Double, Long> function = value -> Math.round(value);
Function<Double, Long> functionRef = Math::round;
```

不适合使用方法引用：

```java
Function<Double, Long> function = value -> {
    System.out.println("开始取整");
    return Math.round(value);
};
```

这段 Lambda 表达式除了调用 `Math.round()`，还包含打印逻辑，因此不能直接改写为 `Math::round`。

> **易错点**
>
> 方法引用只适合“单纯转发调用”的场景。如果 Lambda 表达式中还有其他业务逻辑，应继续使用 Lambda 表达式。

### 方法引用的常见形式

Java 中常见方法引用形式如下：

| 类型                   | 语法               | 含义                                   |
| ---------------------- | ------------------ | -------------------------------------- |
| 静态方法引用           | `类名::静态方法名` | 引用某个类中的静态方法                 |
| 特定对象的实例方法引用 | `对象::实例方法名` | 引用某个已经存在对象的实例方法         |
| 特定类型的实例方法引用 | `类名::实例方法名` | 使用抽象方法的第一个参数作为方法调用者 |
| 构造方法引用           | `类名::new`        | 引用某个类的构造方法                   |
| 数组引用               | `数组类型[]::new`  | 引用数组创建过程                       |

这些写法的共同点是：它们都必须依附于函数式接口，由目标类型决定最终引用哪个方法。

#### 特定对象的实例方法引用

特定对象的实例方法引用格式为：

```java
对象::实例方法名
```

它适用于 Lambda 方法体中通过某个已经存在的对象调用实例方法的情况。

例如：

```java
Consumer<String> printer = value -> System.out.println(value);
```

`System.out` 是一个已经存在的对象，`println()` 是它的实例方法。由于 Lambda 方法体只是调用 `System.out.println(value)`，因此可以写成：

```java
Consumer<String> printer = System.out::println;
```

完整示例：

```java
Consumer<String> printer = System.out::println;

printer.accept("hello world");
```

`Consumer<String>` 的抽象方法是：

```java
void accept(String value);
```

`System.out.println(String value)` 也是接收一个 `String` 参数并且无返回值，因此二者可以匹配。

再例如：

```java
Student student = new Student("张三");

Supplier<String> supplier = () -> student.getName();
```

可以改写为：

```java
Supplier<String> supplier = student::getName;
```

其中，`student` 是已经存在的对象，`getName()` 是该对象的实例方法。

```java
class Student {
    private String name;

    public Student(String name) {
        this.name = name;
    }

    public String getName() {
        return name;
    }
}
```

`Supplier<String>` 的抽象方法是：

```java
String get();
```

`student.getName()` 不需要参数，返回 `String`，因此可以匹配。

> **结论**
>
> `对象::实例方法名` 的核心是：Lambda 方法体中通过一个已经存在的对象调用实例方法。

#### 静态方法引用

静态方法引用格式为：

```java
类名::静态方法名
```

它适用于 Lambda 方法体中通过类名调用静态方法的情况。

例如：

```java
Comparator<Integer> comparator = (left, right) -> Integer.compare(left, right);
```

`Integer.compare()` 是静态方法，Lambda 方法体只是调用它，因此可以写成：

```java
Comparator<Integer> comparator = Integer::compare;
```

完整示例：

```java
Comparator<Integer> comparator = Integer::compare;

System.out.println(comparator.compare(10, 20));
```

`Comparator<Integer>` 的抽象方法是：

```java
int compare(Integer left, Integer right);
```

`Integer.compare(int x, int y)` 接收两个整数并返回比较结果，因此可以匹配。

再例如：

```java
Function<Double, Long> function = value -> Math.round(value);
```

可以简化为：

```java
Function<Double, Long> function = Math::round;
```

`Function<Double, Long>` 的抽象方法是：

```java
Long apply(Double value);
```

`Math.round(double value)` 接收一个小数并返回取整结果，因此可以作为该函数式接口的实现。

> **结论**
>
> `类名::静态方法名` 的核心是：Lambda 方法体中通过类名直接调用一个静态方法。

#### 特定类型的实例方法引用

特定类型的实例方法引用格式为：

```java
类名::实例方法名
```

这种写法容易和静态方法引用混淆。它引用的不是静态方法，而是实例方法。它的特点是：**函数式接口抽象方法的第一个参数会作为实例方法的调用者，后续参数作为实例方法的参数**。

例如：

```java
Comparator<String> comparator = (left, right) -> left.compareTo(right);
```

这里 `compareTo()` 是 `String` 对象的实例方法，真正调用者是第一个参数 `left`。因此可以改写为：

```java
Comparator<String> comparator = String::compareTo;
```

这类方法引用的对应关系如下：

```java
(left, right) -> left.compareTo(right)
```

等价于：

```java
String::compareTo
```

其中：

1. `left` 作为 `compareTo()` 的调用者。
2. `right` 作为 `compareTo()` 的参数。
3. `compareTo()` 的返回值作为函数式接口方法的返回值。

再例如：

```java
Function<Student, String> function = student -> student.getName();
```

可以改写为：

```java
Function<Student, String> function = Student::getName;
```

这里 `Function<Student, String>` 的抽象方法是：

```java
String apply(Student student);
```

`student` 会作为 `getName()` 方法的调用者，因此 `Student::getName` 可以匹配该函数式接口。

> **易错点**
>
> `类名::实例方法名` 不是调用静态方法。它表示把函数式接口抽象方法的第一个参数当作实例方法的调用者。

#### 构造方法引用

构造方法引用格式为：

```java
类名::new
```

它适用于 Lambda 方法体中只是创建并返回一个对象的情况。

例如：

```java
Supplier<Student> supplier = () -> new Student();
```

可以改写为：

```java
Supplier<Student> supplier = Student::new;
```

`Supplier<Student>` 的抽象方法是：

```java
Student get();
```

它没有参数，并返回一个 `Student` 对象，因此会匹配 `Student` 的无参数构造方法。

如果函数式接口的抽象方法有一个参数：

```java
Function<String, Student> function = name -> new Student(name);
```

可以改写为：

```java
Function<String, Student> function = Student::new;
```

此时 `Function<String, Student>` 的抽象方法是：

```java
Student apply(String name);
```

因此编译器会根据参数列表选择 `Student(String name)` 构造方法。

示例类：

```java
class Student {
    private String name;

    public Student() {
    }

    public Student(String name) {
        this.name = name;
    }
}
```

> **结论**
>
> `类名::new` 会根据函数式接口抽象方法的参数列表，自动匹配对应的构造方法。

#### 数组引用

数组引用格式为：

```java
数组类型[]::new
```

它适用于 Lambda 方法体中只是根据长度创建并返回数组的情况。

例如：

```java
Function<Integer, String[]> arrayCreator = length -> new String[length];
```

可以改写为：

```java
Function<Integer, String[]> arrayCreator = String[]::new;
```

完整示例：

```java
Function<Integer, String[]> arrayCreator = String[]::new;

String[] names = arrayCreator.apply(3);

System.out.println(Arrays.toString(names));
```

`Function<Integer, String[]>` 的抽象方法是：

```java
String[] apply(Integer length);
```

它接收一个整数作为数组长度，并返回 `String[]` 数组，因此可以匹配 `String[]::new`。

数组引用也可以用于基本数据类型数组：

```java
Function<Integer, int[]> intArrayCreator = int[]::new;

int[] numbers = intArrayCreator.apply(5);
```

> **结论**
>
> `数组类型[]::new` 表示根据传入的长度创建指定类型的数组。

## Stream API 概述

Stream API 是 JDK 1.8 引入的一套流式数据处理 API，主要用于对集合、数组等数据源进行筛选、映射、排序、统计、遍历等操作。它将函数式编程风格引入 Java，使集合数据处理可以通过链式调用完成，代码更加简洁、清晰。

Stream 不是一种新的集合，也不负责存储数据。它更像是一条数据处理流水线：从数据源获取元素，经过若干中间处理，最后通过终止操作得到结果。

### 什么是 Stream API

Stream API 用于对数据源中的元素进行计算和处理。常见数据源包括集合、数组等。

例如，一个集合中保存了若干整数：

```java
List<Integer> numbers = Arrays.asList(3, 6, 1, 7, 2, 5, 4);
```

使用传统方式筛选偶数，通常需要手动遍历：

```java
List<Integer> result = new ArrayList<>();

for (Integer number : numbers) {
    if (number % 2 == 0) {
        result.add(number);
    }
}

System.out.println(result);
```

使用 Stream API 可以写成：

```java
List<Integer> result = numbers.stream()
        .filter(number -> number % 2 == 0)
        .toList();

System.out.println(result);
```

这段代码中，`stream()` 创建流，`filter()` 负责筛选，`toList()` 负责收集结果。整个处理过程以链式调用的方式表达，代码重点更集中在“对数据做什么处理”。

> **结论**
>
> Stream API 关注的是对数据的计算操作，而不是数据本身的存储。

### Stream 和 Collection 的区别

`Collection` 和 `Stream` 都经常与集合数据处理有关，但二者关注点不同。

| 对比项         | `Collection`       | `Stream`                     |
| -------------- | ------------------ | ---------------------------- |
| 关注点         | 数据存储           | 数据计算                     |
| 是否保存元素   | 保存元素           | 不保存元素                   |
| 面向对象       | 内存中的数据结构   | 数据处理流水线               |
| 常见用途       | 增删改查集合元素   | 筛选、映射、排序、统计、遍历 |
| 是否可重复使用 | 可以多次遍历和操作 | 一次终止操作后不能再次使用   |

`Collection` 是静态的内存数据结构，强调“存放了哪些数据”。例如 `List`、`Set` 都属于集合，用来保存元素。

`Stream` 是基于数据源形成的计算过程，强调“对数据做什么处理”。它不会代替集合保存数据，而是从集合、数组等数据源中读取元素，并对元素执行计算。

例如：

```java
List<String> names = Arrays.asList("jack", "lucy", "tom");

Stream<String> stream = names.stream();
```

这里 `names` 是真正保存数据的集合，`stream` 只是基于该集合创建出来的数据处理通道。

> **易错点**
>
> Stream 不是集合，不能把它理解成“存放数据的新容器”。集合负责存储数据，Stream 负责处理数据。

### Stream API 的操作步骤

Stream API 的使用一般分为三个步骤：创建 Stream、中间操作、终止操作。

#### 创建 Stream

第一步是从数据源创建 Stream 对象。数据源可以是集合、数组，也可以是直接给定的一组值。

```java
List<String> names = Arrays.asList("jack", "lucy", "tom");

Stream<String> stream = names.stream();
```

这一步只是创建流，还没有真正对数据进行计算。

#### 中间操作

中间操作用于描述数据处理规则，例如筛选、转换、排序等。中间操作会返回新的 Stream，因此可以继续链式调用。

```java
Stream<String> resultStream = names.stream()
        .filter(name -> name.length() > 3)
        .map(name -> name.toUpperCase());
```

`filter()` 和 `map()` 都是中间操作。它们不会立刻执行真正的数据处理，而是先记录处理规则。

#### 终止操作

终止操作用于触发整个 Stream 流水线的执行，并返回最终结果。常见终止操作包括 `forEach()`、`count()`、`collect()`、`toList()` 等。

```java
List<String> result = names.stream()
        .filter(name -> name.length() > 3)
        .map(name -> name.toUpperCase())
        .toList();
```

当执行到 `toList()` 时，前面的 `filter()` 和 `map()` 才会真正开始工作。

> **结论**
>
> Stream 的中间操作具有延迟执行特性。只有遇到终止操作时，中间操作才会真正执行。

### Stream API 的重要特点

Stream API 有几个核心特点。

#### Stream 不存储元素

Stream 不会保存数据。它只从集合、数组等数据源中获取元素并进行处理。

```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4);

Stream<Integer> stream = numbers.stream();
```

真正保存元素的是 `numbers`，不是 `stream`。

#### Stream 通常不改变数据源

Stream 操作通常不会直接修改原始集合，而是返回新的处理结果。

```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4);

List<Integer> result = numbers.stream()
        .filter(number -> number % 2 == 0)
        .toList();

System.out.println(numbers);
System.out.println(result);
```

`numbers` 仍然是原来的集合，`result` 是筛选后的新结果。

> **注意**
>
> Stream API 本身强调不改变数据源，但如果在 Lambda 表达式中手动修改对象属性或外部变量，仍然可能产生副作用。因此使用 Stream 时应尽量避免在流水线中编写带副作用的逻辑。

#### Stream 支持链式调用

很多 Stream 方法会返回新的 Stream，因此可以连续调用。

```java
List<String> result = Stream.of("jack", "lucy", "tom", "jerry")
        .filter(name -> name.length() > 3)
        .map(name -> name.toUpperCase())
        .toList();
```

这种写法将多个处理步骤连接成一条流水线，代码结构清晰。

#### Stream 具有延迟执行特性

中间操作不会立即执行，只有终止操作触发时才会真正执行。

```java
Stream<String> stream = Stream.of("jack", "lucy", "tom")
        .filter(name -> {
            System.out.println("filter: " + name);
            return name.length() > 3;
        });
```

这段代码只创建了流和筛选规则，但不会打印任何内容。只有添加终止操作后才会执行：

```java
stream.forEach(System.out::println);
```

#### Stream 只能被消费一次

一个 Stream 一旦执行了终止操作，就不能再继续使用。

```java
Stream<String> stream = Stream.of("jack", "lucy", "tom");

stream.forEach(System.out::println);

stream.count(); // 运行时报错
```

执行 `forEach()` 后，这个流已经被消费，再调用 `count()` 会抛出异常。

如果还需要再次处理同一批数据，应重新创建一个 Stream。

> **易错点**
>
> Stream 不是集合，不能像集合一样反复遍历。一个 Stream 执行终止操作后就不能再次使用。

## 创建 Stream 的方式

Stream 可以通过集合、数组或 `Stream` 接口的静态方法创建。不同数据源对应不同创建方式。

### 通过 Collection 创建 Stream

`Collection` 接口提供了 `stream()` 方法，集合类可以直接调用该方法创建顺序流。

```java
List<String> names = Arrays.asList("aa", "bb", "cc");

Stream<String> stream = names.stream();
```

由于 `List`、`Set` 等集合都属于 `Collection` 体系，因此都可以使用 `stream()`。

```java
Set<Integer> numbers = new HashSet<>();

numbers.add(1);
numbers.add(2);
numbers.add(3);

Stream<Integer> stream = numbers.stream();
```

`stream()` 创建的是顺序流，默认按照单线程方式处理元素。

### 通过 Arrays 创建 Stream

数组可以通过 `Arrays.stream()` 创建 Stream。

对象数组会创建普通的 `Stream<T>`：

```java
String[] names = {"aa", "bb", "cc"};

Stream<String> stream = Arrays.stream(names);
```

基本数据类型数组会创建对应的专用流：

```java
int[] numbers = {11, 22, 33, 44};
IntStream intStream = Arrays.stream(numbers);

long[] longNumbers = {11L, 22L, 33L};
LongStream longStream = Arrays.stream(longNumbers);

double[] scores = {1.0, 2.0, 3.0};
DoubleStream doubleStream = Arrays.stream(scores);
```

`IntStream`、`LongStream` 和 `DoubleStream` 是专门处理基本数据类型的流，可以避免频繁装箱和拆箱，提高数值处理效率。

| 数组类型                           | 创建结果       |
| ---------------------------------- | -------------- |
| `String[]`、`Integer[]` 等对象数组 | `Stream<T>`    |
| `int[]`                            | `IntStream`    |
| `long[]`                           | `LongStream`   |
| `double[]`                         | `DoubleStream` |

> **注意**
>
> `Stream`、`IntStream`、`LongStream` 和 `DoubleStream` 都属于流体系，底层都继承自 `BaseStream`。

### 通过 Stream.of 创建 Stream

`Stream` 接口提供了静态方法 `of()`，可以直接根据一组值创建 Stream。

```java
Stream<String> stringStream = Stream.of("aa", "bb", "cc");

Stream<Integer> integerStream = Stream.of(11, 22, 33, 44);
```

这种方式适合数据量较少、直接在代码中给出元素的场景。

例如：

```java
Stream.of("jack", "lucy", "tom")
        .forEach(System.out::println);
```

## 顺序流和并行流

Stream 可以分为顺序流和并行流。

顺序流按照单线程方式处理元素，默认情况下通过 `stream()` 创建的流就是顺序流。并行流可以把数据拆分成多个部分，并由多个线程并行处理，从而在某些大数据量、计算密集型场景下提高效率。

### 顺序流

顺序流是默认流形式。它会按照单线程方式处理元素。

```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4);

Stream<Integer> stream = numbers.stream();

System.out.println(stream.isParallel());
```

输出结果：

```java
false
```

`false` 表示当前流不是并行流，而是顺序流。

顺序流的特点是执行过程相对稳定，顺序更容易理解，适合大多数普通集合处理场景。

### parallel 方法

可以通过 `parallel()` 方法把顺序流转换为并行流。

```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4);

Stream<Integer> stream = numbers.stream();

Stream<Integer> parallelStream = stream.parallel();

System.out.println(stream == parallelStream);
System.out.println(parallelStream.isParallel());
```

输出结果：

```java
true
true
```

`parallel()` 返回的仍然是当前流对象，只是把该流标记为并行流。

> **注意**
>
> `parallel()` 并不是创建一个全新的独立流对象，而是把当前流转换为并行模式。因此转换后应继续使用返回的流对象进行后续操作。

### parallelStream 方法

`Collection` 接口还提供了 `parallelStream()` 方法，可以直接创建并行流。

```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4);

Stream<Integer> parallelStream = numbers.parallelStream();

System.out.println(parallelStream.isParallel());
```

输出结果：

```java
true
```

这表示通过 `parallelStream()` 创建出来的流默认就是并行流。

### 并行流的使用边界

并行流可以提高某些场景下的处理效率，但并不是所有情况都适合使用。

适合考虑并行流的场景包括：

1. 数据量较大。
2. 每个元素的处理逻辑相对耗时。
3. 元素之间没有顺序依赖。
4. 操作不依赖共享可变状态。
5. 结果不要求严格保持处理顺序，或框架可以正确保证最终结果。

不适合使用并行流的场景包括：

1. 数据量很小。
2. 每个元素处理非常简单。
3. 操作中频繁访问共享变量。
4. 处理逻辑有顺序依赖。
5. 涉及线程安全问题或外部资源操作。

例如：

```java
List<Integer> result = numbers.parallelStream()
        .filter(number -> number % 2 == 0)
        .toList();
```

这类无共享状态的筛选操作比较适合并行处理。

不推荐在并行流中随意修改外部集合：

```java
List<Integer> result = new ArrayList<>();

numbers.parallelStream()
        .forEach(number -> result.add(number)); // 不推荐
```

因为多个线程同时修改同一个 `ArrayList` 可能产生线程安全问题。

> **易错点**
>
> 并行流不一定比顺序流更快。是否使用并行流，应根据数据量、计算成本、线程安全和顺序要求综合判断。

## Stream API 的中间操作

Stream API 的中间操作用于描述数据处理规则，例如筛选、映射、去重、排序、跳过和截断等。中间操作本身不会立即执行，而是返回一个新的 `Stream` 对象，因此可以继续进行链式调用。

中间操作具有**惰性执行**特点：只有当 Stream 遇到终止操作时，前面声明的中间操作才会真正执行。

### 中间操作的基本特点

Stream 的完整处理流程通常由三部分组成：

```java
数据源 -> 创建 Stream -> 中间操作 -> 终止操作
```

中间操作只负责“记录处理规则”，不会立刻计算结果。例如：

```java
Stream<String> stream = Stream.of("jack", "lucy", "tom")
        .filter(name -> name.length() > 3);
```

这段代码只声明了筛选规则，并不会真正遍历元素。只有执行终止操作时，筛选逻辑才会运行：

```java
stream.forEach(System.out::println);
```

常见中间操作如下：

| 中间操作          | 作用                   |
| ----------------- | ---------------------- |
| `filter()`        | 按条件筛选元素         |
| `map()`           | 将元素转换为另一种形式 |
| `flatMap()`       | 将多个流扁平化为一个流 |
| `distinct()`      | 去除重复元素           |
| `sorted()`        | 对元素排序             |
| `skip()`          | 跳过前若干个元素       |
| `limit()`         | 截取前若干个元素       |
| `Stream.concat()` | 合并两个 Stream        |

> **结论**
>
> 中间操作不会直接产生最终结果，它只是组成 Stream 流水线的一部分；真正触发计算的是终止操作。

### 示例数据

为了说明对象流的处理，可以定义一个 `Student` 类：

```java
public class Student {
    private String name;
    private int age;
    private String sex;
    private String city;

    public Student() {
    }

    public Student(String name, int age, String sex, String city) {
        this.name = name;
        this.age = age;
        this.sex = sex;
        this.city = city;
    }

    public String getName() {
        return name;
    }

    public int getAge() {
        return age;
    }

    public String getSex() {
        return sex;
    }

    public String getCity() {
        return city;
    }

    @Override
    public String toString() {
        return "Student{" +
                "name='" + name + '\'' +
                ", age=" + age +
                ", sex='" + sex + '\'' +
                ", city='" + city + '\'' +
                '}';
    }
}
```

提供一个用于获取学生集合的工具类：

```java
public class StudentData {
    public static List<Student> getStudentList() {
        List<Student> students = new ArrayList<>();

        students.add(new Student("张三", 21, "男", "武汉"));
        students.add(new Student("李四", 18, "女", "重庆"));
        students.add(new Student("王五", 25, "女", "成都"));
        students.add(new Student("赵六", 22, "男", "武汉"));
        students.add(new Student("王麻子", 16, "女", "成都"));

        return students;
    }
}
```

### filter 筛选

`filter()` 用于按照指定条件筛选流中的元素。符合条件的元素会保留下来，不符合条件的元素会被过滤掉。

方法声明：

```java
Stream<T> filter(Predicate<? super T> predicate);
```

`filter()` 接收一个 `Predicate` 判断型函数式接口。该接口的抽象方法返回 `boolean`，返回 `true` 表示保留元素，返回 `false` 表示过滤元素。

例如，筛选年龄大于 20 的学生：

```java
StudentData.getStudentList()
        .stream()
        .filter(student -> student.getAge() > 20)
        .forEach(System.out::println);
```

筛选字符串长度大于 3 的元素：

```java
Stream.of("hello", "zhangsan", "lisi", "abc", "def")
        .filter(value -> value.length() > 3)
        .forEach(System.out::println);
```

`filter()` 不会改变原集合中的数据，它只是从流中筛选出符合条件的元素，形成新的 Stream。

> **结论**
>
> `filter()` 用于保留满足条件的元素，条件由 `Predicate` 提供。

### map 映射

`map()` 用于把流中的每个元素按照指定规则转换成另一个元素。转换前后元素类型可以相同，也可以不同。

方法声明：

```java
<R> Stream<R> map(Function<? super T, ? extends R> mapper);
```

`map()` 接收一个 `Function` 转换型函数式接口。它会接收一个元素，并返回转换后的结果。

例如，将字符串转换为大写：

```java
Stream.of("hello", "king", "lucy", "jack")
        .map(String::toUpperCase)
        .forEach(System.out::println);
```

获取所有学生姓名：

```java
StudentData.getStudentList()
        .stream()
        .map(Student::getName)
        .forEach(System.out::println);
```

先筛选男学生，再映射为学生姓名：

```java
StudentData.getStudentList()
        .stream()
        .filter(student -> "男".equals(student.getSex()))
        .map(Student::getName)
        .forEach(System.out::println);
```

这段代码体现了 Stream 的链式处理思想：

1. `stream()` 创建学生对象流。
2. `filter()` 保留性别为男的学生对象。
3. `map()` 将学生对象转换为学生姓名。
4. `forEach()` 输出最终结果。

### flatMap 扁平化映射

`flatMap()` 用于将多个流合并展开为一个流。它常用于处理“集合中嵌套集合”的结构。

方法声明：

```java
<R> Stream<R> flatMap(Function<? super T, ? extends Stream<? extends R>> mapper);
```

`map()` 和 `flatMap()` 的区别在于：`map()` 是普通映射，可能得到嵌套流；`flatMap()` 会把内部流展开，形成一个扁平的流。

例如，存在三个集合：

```java
Stream<List<Integer>> stream = Stream.of(
        Arrays.asList(1, 2, 3),
        Arrays.asList(4, 5, 6),
        Arrays.asList(7, 8, 9)
);
```

使用 `flatMap()` 将多个集合中的元素展开到同一个流中：

```java
stream.flatMap(list -> list.stream())
        .forEach(System.out::println);
```

也可以使用方法引用：

```java
stream.flatMap(List::stream)
        .forEach(System.out::println);
```

处理结果相当于把：

```java
[1, 2, 3], [4, 5, 6], [7, 8, 9]
```

展开为：

```java
1, 2, 3, 4, 5, 6, 7, 8, 9
```

> **易错点**
>
> `map()` 适合一对一转换，`flatMap()` 适合把多个内部流展开成一个流。

### distinct 去重

`distinct()` 用于去除流中的重复元素。

方法声明：

```java
Stream<T> distinct();
```

例如，去除重复整数：

```java
Stream.of(11, 22, 33, 44, 33)
        .distinct()
        .forEach(System.out::println);
```

对于基本包装类型和字符串等常见类型，去重结果通常符合直观理解。

如果对对象去重，底层依赖对象的 `equals()` 和 `hashCode()` 方法判断元素是否重复。若自定义类没有重写这两个方法，默认会按照对象地址判断，内容相同但不是同一个对象时，仍然会被认为是不同元素。

例如：

```java
StudentData.getStudentList()
        .stream()
        .distinct()
        .forEach(System.out::println);
```

如果 `Student` 没有重写 `equals()` 和 `hashCode()`，`distinct()` 不会按照姓名、年龄等内容自动去重。

如果只需要去除重复年龄，可以先映射出年龄，再去重：

```java
StudentData.getStudentList()
        .stream()
        .map(Student::getAge)
        .distinct()
        .forEach(System.out::println);
```

> **结论**
>
> `distinct()` 依赖 `equals()` 和 `hashCode()` 判断重复。对自定义对象去重时，应根据业务需要重写这两个方法，或先映射出需要去重的属性。

### sorted 排序

`sorted()` 用于对流中的元素进行排序。Stream API 提供了两种排序方式：自然排序和指定排序。

#### 自然排序

无参 `sorted()` 使用自然排序。

方法声明：

```java
Stream<T> sorted();
```

例如，对整数升序排序：

```java
Stream.of(4, 1, 3, 6, 2, 5)
        .sorted()
        .forEach(System.out::println);
```

自然排序要求元素类型实现 `Comparable` 接口。`Integer`、`String` 等常见类型已经实现了 `Comparable`，因此可以直接排序。

如果对自定义对象调用无参 `sorted()`：

```java
StudentData.getStudentList()
        .stream()
        .sorted()
        .forEach(System.out::println);
```

则 `Student` 必须实现 `Comparable<Student>`，否则运行时会出现类型转换异常。

例如，按年龄升序实现自然排序：

```java
public class Student implements Comparable<Student> {
    private String name;
    private int age;

    @Override
    public int compareTo(Student other) {
        return Integer.compare(this.age, other.age);
    }
}
```

> **易错点**
>
> 无参 `sorted()` 依赖元素的自然排序规则。自定义对象如果没有实现 `Comparable`，不能直接使用无参 `sorted()` 排序。

#### 指定排序

有参 `sorted()` 可以传入 `Comparator` 指定排序规则。

方法声明：

```java
Stream<T> sorted(Comparator<? super T> comparator);
```

例如，对整数升序排序：

```java
Stream.of(4, 1, 3, 6, 2, 5)
        .sorted(Integer::compare)
        .forEach(System.out::println);
```

按学生年龄降序排序：

```java
StudentData.getStudentList()
        .stream()
        .sorted((left, right) -> Integer.compare(right.getAge(), left.getAge()))
        .forEach(System.out::println);
```

按学生年龄升序排序，也可以使用 `Comparator.comparingInt()`：

```java
StudentData.getStudentList()
        .stream()
        .sorted(Comparator.comparingInt(Student::getAge))
        .forEach(System.out::println);
```

如果只需要输出排序后的年龄，可以先排序再映射：

```java
StudentData.getStudentList()
        .stream()
        .sorted(Comparator.comparingInt(Student::getAge))
        .map(Student::getAge)
        .forEach(System.out::println);
```

也可以先映射出年龄，再对年龄排序：

```java
StudentData.getStudentList()
        .stream()
        .map(Student::getAge)
        .sorted()
        .forEach(System.out::println);
```

> **注意**
>
> 比较整数时，推荐使用 `Integer.compare()` 或 `Comparator.comparingInt()`，不建议直接使用 `right.getAge() - left.getAge()`。虽然简单数据下结果正常，但减法比较在极端数值下可能产生整数溢出问题。

### concat 合并

`concat()` 用于将两个 Stream 合并为一个 Stream。

方法声明：

```java
public static <T> Stream<T> concat(
        Stream<? extends T> first,
        Stream<? extends T> second
);
```

例如：

```java
Stream<String> first = Stream.of("aa", "bb", "cc");
Stream<String> second = Stream.of("11", "22", "33");

Stream.concat(first, second)
        .forEach(System.out::println);
```

合并后的流会先依次处理第一个流中的元素，再处理第二个流中的元素。

需要注意，被合并的两个 Stream 类型应当兼容，否则无法形成统一类型的结果流。

> **易错点**
>
> `Stream.concat()` 合并后会产生一个新的 Stream。原来的两个 Stream 会参与该流水线，执行终止操作后不能再被单独重复使用。

### skip 跳过

`skip()` 用于跳过流中的前 `n` 个元素。

方法声明：

```java
Stream<T> skip(long n);
```

例如：

```java
Stream.of(11, 22, 33, 44, 55, 66)
        .skip(2)
        .forEach(System.out::println);
```

这段代码会跳过前两个元素 `11` 和 `22`，从 `33` 开始处理。

如果 `n` 大于流中元素数量，结果流为空。

### limit 截断

`limit()` 用于截取流中的前 `n` 个元素。

方法声明：

```java
Stream<T> limit(long maxSize);
```

例如：

```java
Stream.of(11, 22, 33, 44, 55, 66)
        .limit(3)
        .forEach(System.out::println);
```

这段代码只保留前三个元素：

```java
11
22
33
```

#### skip 和 limit 组合使用

`skip()` 和 `limit()` 常组合使用，用于从指定位置开始截取若干元素。

例如，从索引为 2 的位置开始截取 3 个元素：

```java
Stream.of(11, 22, 33, 44, 55, 66)
        .skip(2)
        .limit(3)
        .forEach(System.out::println);
```

执行过程为：

1. `skip(2)` 跳过 `11` 和 `22`。
2. 剩余元素为 `33, 44, 55, 66`。
3. `limit(3)` 截取前三个元素。
4. 最终输出 `33, 44, 55`。

> **注意**
>
> Stream 中的 `skip()` 和 `limit()` 是按流中元素顺序处理的。对于无序流或并行流，使用时要注意结果顺序是否符合需求。

### 中间操作的链式组合

多个中间操作可以组合成一条流水线。

例如，筛选年龄大于 18 的男学生，提取姓名并排序：

```java
StudentData.getStudentList()
        .stream()
        .filter(student -> student.getAge() > 18)
        .filter(student -> "男".equals(student.getSex()))
        .map(Student::getName)
        .sorted()
        .forEach(System.out::println);
```

处理过程为：

1. `filter(student -> student.getAge() > 18)` 保留年龄大于 18 的学生。
2. `filter(student -> "男".equals(student.getSex()))` 保留性别为男的学生。
3. `map(Student::getName)` 将学生对象转换为姓名。
4. `sorted()` 对姓名进行自然排序。
5. `forEach()` 触发执行并输出结果。

这类写法体现了 Stream 的核心优势：每一步只描述一个清晰的数据处理动作，多个动作通过链式调用组合成完整处理流程。

### 常见中间操作对比

| 操作       | 方法              | 接收参数                  | 返回结果    | 典型用途               |
| ---------- | ----------------- | ------------------------- | ----------- | ---------------------- |
| 筛选       | `filter()`        | `Predicate`               | `Stream<T>` | 保留满足条件的元素     |
| 映射       | `map()`           | `Function`                | `Stream<R>` | 将元素转换为另一种形式 |
| 扁平化映射 | `flatMap()`       | 返回 Stream 的 `Function` | `Stream<R>` | 展开嵌套集合或嵌套流   |
| 去重       | `distinct()`      | 无                        | `Stream<T>` | 去除重复元素           |
| 排序       | `sorted()`        | 无或 `Comparator`         | `Stream<T>` | 对元素排序             |
| 跳过       | `skip()`          | `long`                    | `Stream<T>` | 跳过前 n 个元素        |
| 截断       | `limit()`         | `long`                    | `Stream<T>` | 截取前 n 个元素        |
| 合并       | `Stream.concat()` | 两个 Stream               | `Stream<T>` | 合并两个流             |

## Stream API 的终止操作

终止操作用于触发 Stream 流水线的真正执行，并返回最终计算结果。中间操作只负责组织处理规则，只有执行终止操作时，前面的筛选、映射、排序等中间操作才会真正参与计算。

终止操作执行后，当前 Stream 会被消费，不能再继续执行其他中间操作或终止操作。

### 终止操作的基本特点

Stream 操作可以分为中间操作和终止操作。中间操作返回新的 `Stream`，可以继续链式调用；终止操作会结束整个流处理过程，并返回最终结果。

例如：

```java
List<Student> result = StudentData.getStudentList()
        .stream()
        .filter(student -> student.getAge() > 20)
        .collect(Collectors.toList());
```

其中，`filter()` 是中间操作，`collect()` 是终止操作。只有执行到 `collect()` 时，`filter()` 才会真正开始筛选数据。

终止操作有两个重要特点：

1. **触发计算**：前面的中间操作会在终止操作执行时真正运行。
2. **消费 Stream**：终止操作执行后，该 Stream 不能再次使用。

例如：

```java
Stream<String> stream = Stream.of("aa", "bb", "cc");

stream.forEach(System.out::println);

stream.count(); // 运行时报错
```

`forEach()` 执行后，`stream` 已经被消费，再调用 `count()` 会抛出异常。

> **结论**
>
> 终止操作是 Stream 流水线的结束点。一个 Stream 只能执行一次终止操作，若需要再次处理同一批数据，应重新创建 Stream。

### forEach 遍历

`forEach()` 用于遍历 Stream 中的元素。

方法声明：

```java
void forEach(Consumer<? super T> action);
```

`forEach()` 接收一个 `Consumer` 消费型函数式接口。它会对流中的每个元素执行指定操作。

例如，遍历所有学生：

```java
List<Student> students = StudentData.getStudentList();

students.stream()
        .forEach(System.out::println);
```

也可以先筛选，再遍历：

```java
students.stream()
        .filter(student -> student.getAge() > 20)
        .forEach(System.out::println);
```

这段代码会先筛选年龄大于 20 的学生，再逐个输出。

`forEach()` 通常用于输出、打印、执行某个无返回值动作。它是终止操作，因此执行后 Stream 会失效。

> **注意**
>
> `forEach()` 更适合执行无返回值的操作。如果目的是得到一个新的集合，应优先使用 `collect()` 或 `toList()`，不要在 `forEach()` 中手动向外部集合添加元素。

### match 匹配

匹配操作用于判断 Stream 中的元素是否满足某个条件。常见方法包括 `allMatch()`、`anyMatch()` 和 `noneMatch()`。

| 方法                                        | 作用                           |
| ------------------------------------------- | ------------------------------ |
| `allMatch(Predicate<? super T> predicate)`  | 判断是否所有元素都满足条件     |
| `anyMatch(Predicate<? super T> predicate)`  | 判断是否至少有一个元素满足条件 |
| `noneMatch(Predicate<? super T> predicate)` | 判断是否所有元素都不满足条件   |

例如：

```java
List<Student> students = StudentData.getStudentList();
```

判断所有学生是否都叫“王五”：

```java
boolean all = students.stream()
        .allMatch(student -> "王五".equals(student.getName()));

System.out.println(all);
```

判断是否至少有一个学生叫“王五”：

```java
boolean any = students.stream()
        .anyMatch(student -> "王五".equals(student.getName()));

System.out.println(any);
```

判断是否没有任何学生叫“王五”：

```java
boolean none = students.stream()
        .noneMatch(student -> "王五".equals(student.getName()));

System.out.println(none);
```

这三个方法都返回 `boolean`，并且都属于终止操作。

> **补充**
>
> `allMatch()`、`anyMatch()`、`noneMatch()` 具有短路特性。只要已经能够确定最终结果，就不会继续处理后续元素。

#### findFirst 查找第一个元素

`findFirst()` 用于获取 Stream 中的第一个元素。

方法声明：

```java
Optional<T> findFirst();
```

它返回的是 `Optional<T>`，而不是直接返回元素对象。`Optional` 可以理解为一个最多保存一个值的容器，用于更优雅地处理可能为空的结果。

例如，获取第一个学生：

```java
Optional<Student> first = StudentData.getStudentList()
        .stream()
        .findFirst();

first.ifPresent(System.out::println);
```

如果确定 `Optional` 中有值，也可以使用 `get()` 获取：

```java
Student student = first.get();
System.out.println(student);
```

但直接调用 `get()` 有风险。如果 `Optional` 中没有值，会抛出异常。因此更推荐先判断，或者使用 `ifPresent()`。

获取第四个学生可以先跳过前三个元素，再获取第一个元素：

```java
Optional<Student> fourth = StudentData.getStudentList()
        .stream()
        .skip(3)
        .findFirst();

fourth.ifPresent(System.out::println);
```

> **易错点**
>
> `Optional.get()` 不是空安全方法。若不能确定容器中一定有值，应使用 `isPresent()`、`ifPresent()` 或其他 Optional API 处理空值情况。

### reduce 归约

`reduce()` 用于把 Stream 中的多个元素反复结合，最终归约成一个值。

常用方法有两种：

```java
Optional<T> reduce(BinaryOperator<T> accumulator);
T reduce(T identity, BinaryOperator<T> accumulator);
```

`BinaryOperator<T>` 表示接收两个相同类型的参数，并返回同类型结果。归约过程会不断把前一次计算结果和下一个元素继续计算，直到得到最终值。

#### 无初始值归约

例如，计算集合中所有整数之和：

```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);

Optional<Integer> sum = numbers.stream()
        .reduce(Integer::sum);

sum.ifPresent(System.out::println);
```

执行过程可以理解为：

```java
(((1 + 2) + 3) + 4) + 5
```

计算所有元素的乘积：

```java
numbers.stream()
        .reduce((left, right) -> left * right)
        .ifPresent(System.out::println);
```

获取长度最长的字符串：

```java
Stream.of("I", "love", "you", "too")
        .reduce((left, right) -> left.length() > right.length() ? left : right)
        .ifPresent(System.out::println);
```

无初始值的 `reduce()` 返回 `Optional<T>`，原因是 Stream 可能为空。如果流中没有元素，就没有可归约的结果。

#### 有初始值归约

有初始值的 `reduce()` 会从指定初始值开始归约，并直接返回结果。

例如，以 `10` 为初始值，计算所有元素之和：

```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);

Integer sum = numbers.stream()
        .reduce(10, Integer::sum);

System.out.println(sum);
```

执行过程可以理解为：

```java
10 + 1 + 2 + 3 + 4 + 5
```

由于已经给定初始值，即使 Stream 为空，也能返回该初始值，因此返回类型不是 `Optional<T>`。

#### 对对象属性进行归约

归约也可以用于对象属性统计。比如计算所有学生年龄之和：

```java
StudentData.getStudentList()
        .stream()
        .map(Student::getAge)
        .reduce(Integer::sum)
        .ifPresent(System.out::println);
```

这里先通过 `map(Student::getAge)` 把 `Student` 对象映射为年龄，再使用 `reduce()` 对年龄求和。

> **结论**
>
> `reduce()` 适合把多个元素合并成一个结果，例如求和、求积、求最大长度元素、统计某个属性总和等。

#### count、max 和 min

`count()`、`max()`、`min()` 本质上也属于常见归约类操作，只是使用频率高，因此 Stream API 提供了专门方法。

| 方法                                                | 作用         |
| --------------------------------------------------- | ------------ |
| `long count()`                                      | 统计元素个数 |
| `Optional<T> max(Comparator<? super T> comparator)` | 获取最大元素 |
| `Optional<T> min(Comparator<? super T> comparator)` | 获取最小元素 |

统计学生数量：

```java
long count = StudentData.getStudentList()
        .stream()
        .count();

System.out.println(count);
```

获取年龄最大的学生：

```java
StudentData.getStudentList()
        .stream()
        .max(Comparator.comparingInt(Student::getAge))
        .ifPresent(System.out::println);
```

获取最大学生年龄：

```java
StudentData.getStudentList()
        .stream()
        .map(Student::getAge)
        .max(Integer::compare)
        .ifPresent(System.out::println);
```

获取年龄最小的学生：

```java
StudentData.getStudentList()
        .stream()
        .min(Comparator.comparingInt(Student::getAge))
        .ifPresent(System.out::println);
```

获取最小学生年龄：

```java
StudentData.getStudentList()
        .stream()
        .map(Student::getAge)
        .min(Integer::compare)
        .ifPresent(System.out::println);
```

> **注意**
>
> 比较整数大小时，推荐使用 `Integer.compare()` 或 `Comparator.comparingInt()`，避免使用减法比较导致极端情况下整数溢出。

### collect 收集

`collect()` 用于把 Stream 的计算结果收集起来。结果可以是集合、Map、统计值、分组结果或拼接后的字符串。

方法声明：

```java
<R, A> R collect(Collector<? super T, A, R> collector);
```

实际开发中，`collect()` 通常和 `Collectors` 工具类配合使用。传入的 `Collector` 决定了最终收集方式。

#### 归集为 List、Set 和 Map

将 Stream 结果收集为 `List`：

```java
List<Integer> list = Stream.of(1, 20, 30, 9, 8, 90, 100)
        .filter(number -> number > 10)
        .collect(Collectors.toList());

System.out.println(list);
```

将 Stream 结果收集为 `Set`：

```java
Set<Integer> set = Stream.of(1, 20, 30, 9, 8, 10, 10, 90, 100)
        .filter(number -> number <= 10)
        .collect(Collectors.toSet());

System.out.println(set);
```

`Set` 会根据集合自身规则去除重复元素。

将 Stream 结果收集为 `Map`：

```java
Map<String, String> map = Stream.of("张三:成都", "李四:武汉", "王五:重庆")
        .collect(Collectors.toMap(
                value -> value.substring(0, value.indexOf(":")),
                value -> value.substring(value.indexOf(":") + 1)
        ));

map.forEach((key, value) -> System.out.println(key + "=" + value));
```

这里每个字符串都按 `:` 拆分，左边作为 key，右边作为 value。

> **易错点**
>
> 使用 `Collectors.toMap()` 时，如果生成了重复 key，默认会抛出异常。存在重复 key 时，需要额外指定合并规则。

#### 归集为指定集合类型

`Collectors.toList()` 和 `Collectors.toSet()` 不强调具体集合实现类型。如果需要明确收集到 `ArrayList`、`LinkedList`、`HashSet`、`TreeSet` 等具体集合，可以使用 `Collectors.toCollection()`。

```java
List<String> words = Arrays.asList("I", "love", "you", "too");

ArrayList<String> arrayList = words.stream()
        .filter(word -> word.length() > 2)
        .collect(Collectors.toCollection(ArrayList::new));

LinkedList<String> linkedList = words.stream()
        .filter(word -> word.length() > 2)
        .collect(Collectors.toCollection(LinkedList::new));

HashSet<String> hashSet = words.stream()
        .filter(word -> word.length() > 2)
        .collect(Collectors.toCollection(HashSet::new));

TreeSet<String> treeSet = words.stream()
        .filter(word -> word.length() > 2)
        .collect(Collectors.toCollection(TreeSet::new));
```

`toCollection()` 的参数是一个集合构造器，常用构造方法引用表示，例如 `ArrayList::new`。

#### 归集处理结果示例

筛选年龄大于 20 的女学生，并按年龄升序排序，最后收集到 `ArrayList`：

```java
ArrayList<Student> result = StudentData.getStudentList()
        .stream()
        .filter(student -> student.getAge() > 20)
        .filter(student -> "女".equals(student.getSex()))
        .sorted(Comparator.comparingInt(Student::getAge))
        .collect(Collectors.toCollection(ArrayList::new));

result.forEach(System.out::println);
```

这段代码的处理顺序是：

1. 创建学生对象流。
2. 筛选年龄大于 20 的学生。
3. 筛选性别为女的学生。
4. 按年龄升序排序。
5. 将结果收集到 `ArrayList`。

#### 收集为数组

Stream 可以通过 `toArray()` 收集为数组。

不指定数组类型时，返回 `Object[]`：

```java
List<String> names = Arrays.asList("aa", "bb", "cc", "dd");

Object[] array = names.stream()
        .toArray();

System.out.println(Arrays.toString(array));
```

如果希望得到指定类型数组，可以传入数组构造方法引用：

```java
String[] stringArray = names.stream()
        .toArray(String[]::new);

System.out.println(Arrays.toString(stringArray));
```

> **注意**
>
> `toArray()` 是 Stream 的终止操作，不是 `Stream` 的静态方法。使用 `String[]::new` 可以让结果数组保持明确的元素类型。

### collect 统计

`Collectors` 提供了一系列统计方法，可以通过 `collect()` 完成计数、平均值、最值、求和和概要统计。

| 方法                                                         | 作用         |
| ------------------------------------------------------------ | ------------ |
| `counting()`                                                 | 统计元素数量 |
| `averagingInt()`、`averagingLong()`、`averagingDouble()`     | 计算平均值   |
| `maxBy()`                                                    | 获取最大元素 |
| `minBy()`                                                    | 获取最小元素 |
| `summingInt()`、`summingLong()`、`summingDouble()`           | 求和         |
| `summarizingInt()`、`summarizingLong()`、`summarizingDouble()` | 汇总统计信息 |

统计学生数量：

```java
Long count = StudentData.getStudentList()
        .stream()
        .collect(Collectors.counting());

System.out.println(count);
```

计算学生平均年龄：

```java
Double averageAge = StudentData.getStudentList()
        .stream()
        .collect(Collectors.averagingInt(Student::getAge));

System.out.println(averageAge);
```

获取年龄最大的学生：

```java
StudentData.getStudentList()
        .stream()
        .collect(Collectors.maxBy(Comparator.comparingInt(Student::getAge)))
        .ifPresent(System.out::println);
```

获取年龄最小的学生：

```java
StudentData.getStudentList()
        .stream()
        .collect(Collectors.minBy(Comparator.comparingInt(Student::getAge)))
        .ifPresent(System.out::println);
```

计算所有学生年龄之和：

```java
Integer totalAge = StudentData.getStudentList()
        .stream()
        .collect(Collectors.summingInt(Student::getAge));

System.out.println(totalAge);
```

获取年龄的完整统计信息：

```java
IntSummaryStatistics statistics = StudentData.getStudentList()
        .stream()
        .collect(Collectors.summarizingInt(Student::getAge));

System.out.println(statistics.getCount());
System.out.println(statistics.getSum());
System.out.println(statistics.getMin());
System.out.println(statistics.getMax());
System.out.println(statistics.getAverage());
```

`summarizingInt()` 会一次性得到数量、总和、最小值、最大值和平均值，适合需要多个统计指标的场景。

### groupingBy 分组

`groupingBy()` 用于按照指定规则对 Stream 元素进行分组，结果通常是一个 `Map`。

例如，按照学生性别分组：

```java
Map<String, List<Student>> map = StudentData.getStudentList()
        .stream()
        .collect(Collectors.groupingBy(Student::getSex));

map.forEach((key, value) -> System.out.println(key + " => " + value));
```

分组结果中：

1. `Map` 的 key 是分组依据，例如性别。
2. `Map` 的 value 是属于该分组的元素列表。

如果按照城市分组，可以写成：

```java
Map<String, List<Student>> cityMap = StudentData.getStudentList()
        .stream()
        .collect(Collectors.groupingBy(Student::getCity));
```

> **结论**
>
> `groupingBy()` 适合把一组对象按照某个属性分类，最终得到 `Map<分组条件, 分组结果>`。

### joining 接合

`joining()` 用于把 Stream 中的字符串元素拼接成一个字符串。

例如，将所有学生姓名用逗号连接：

```java
String names = StudentData.getStudentList()
        .stream()
        .map(Student::getName)
        .collect(Collectors.joining(","));

System.out.println(names);
```

如果希望逗号后带空格，可以写成：

```java
String names = StudentData.getStudentList()
        .stream()
        .map(Student::getName)
        .collect(Collectors.joining(", "));
```

`joining()` 只能直接处理字符串流。如果原始流中是对象，需要先通过 `map()` 转换为字符串。

> **结论**
>
> `joining()` 常用于把多个字符串结果合并成一个字符串，通常会配合 `map()` 使用。

### 常见终止操作对比

| 终止操作      | 返回结果             | 典型用途                            |
| ------------- | -------------------- | ----------------------------------- |
| `forEach()`   | `void`               | 遍历处理元素                        |
| `allMatch()`  | `boolean`            | 判断是否全部满足条件                |
| `anyMatch()`  | `boolean`            | 判断是否至少一个满足条件            |
| `noneMatch()` | `boolean`            | 判断是否全部不满足条件              |
| `findFirst()` | `Optional<T>`        | 获取第一个元素                      |
| `reduce()`    | `Optional<T>` 或 `T` | 将多个元素归约为一个值              |
| `count()`     | `long`               | 统计元素数量                        |
| `max()`       | `Optional<T>`        | 获取最大元素                        |
| `min()`       | `Optional<T>`        | 获取最小元素                        |
| `collect()`   | 由收集器决定         | 收集为集合、Map、统计值、分组结果等 |
| `toArray()`   | 数组                 | 收集为数组                          |

