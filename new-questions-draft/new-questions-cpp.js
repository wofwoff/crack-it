export const NEW_CPP = [
  {
    id: "q-cpp-uniqueptr-001",
    subject: "CPP",
    concept: "unique_ptr Ownership Transfer",
    difficulty: "medium",
    stem:
      "`std::unique_ptr<Connection> conn = pool.acquire();` then code does `std::unique_ptr<Connection> backup = conn;` to keep a second handle around 'just in case', followed later by `conn->send(data);`. This fails to compile. A teammate suggests changing the second line to `auto backup = std::move(conn);` to fix it. After that change, what actually happens at the `conn->send(data)` call?",
    options: [
      {
        text: "`conn` is now null because `std::move` transferred ownership to `backup`, so `conn->send(data)` dereferences a null pointer instead of fixing the original problem",
        sub: "Move transfers, doesn't duplicate, ownership",
        fix: "",
      },
      {
        text: "The compile error in the original code was a fluke; `unique_ptr` actually supports copying, so the suggested fix was unnecessary",
        sub: "Denies unique_ptr's core constraint",
        fix:
          "`unique_ptr`'s copy constructor and copy assignment are explicitly deleted — `std::unique_ptr<Connection> backup = conn;` cannot compile under any circumstances, that's the entire reason it failed.",
      },
      {
        text: "`std::move(conn)` creates a second independent `unique_ptr` pointing at a separate copy of the `Connection`, so both `conn` and `backup` remain valid and own distinct objects",
        sub: "Confuses move with deep copy",
        fix:
          "`std::move` doesn't copy or clone anything — it casts `conn` to an rvalue so the move constructor steals its internal pointer, leaving `conn` empty. Only one `Connection` object ever exists here.",
      },
      {
        text: "Both `conn` and `backup` now point to the same `Connection`, and whichever one is destroyed first will close the connection for the other",
        sub: "Treats unique_ptr like shared_ptr",
        fix:
          "`unique_ptr` move construction transfers the raw pointer to `backup` and explicitly resets `conn`'s internal pointer to null — it does not leave two unique_ptrs sharing the same address. That sharing behavior describes `shared_ptr`, not `unique_ptr`.",
      },
    ],
    correctIndex: 0,
    proTip:
      "`unique_ptr` enforces single ownership at compile time by deleting its copy operations — if you find yourself reaching for `std::move` just to silence a compile error, stop and ask whether you actually need shared ownership (`shared_ptr`) instead of pretending to keep two live handles.",
    lesson:
      "`unique_ptr` models exclusive ownership, so its copy constructor and copy assignment operator are deleted by design — the original `backup = conn` line fails to compile because there's no copy to perform. `std::move` doesn't work around that by duplicating the resource; it converts `conn` to an rvalue reference so the move constructor can steal its internal pointer and explicitly null out the source. After the move, `conn` genuinely owns nothing, so using it afterward is a null-pointer dereference, not a fix for wanting two live handles.",
    remember: "std::move on a unique_ptr transfers ownership and nulls the source — it never creates a second valid owner, so using the moved-from pointer afterward dereferences null.",
    interviewAnswer: "The original code fails because unique_ptr's copy constructor is deleted — there's no such thing as copying a unique_ptr, only moving it. Switching to std::move 'fixes' the compile error, but it does so by transferring ownership of the Connection to backup and leaving conn null — it doesn't clone the connection or share it. So conn->send(data) right after that is a null pointer dereference, which is arguably worse than the original compile error because it's a runtime crash instead of being caught at compile time. If the real intent is for both conn and backup to be valid simultaneously, the right tool is shared_ptr, not std::move on a unique_ptr.",
  },
  {
    id: "q-cpp-danglingref-001",
    subject: "CPP",
    concept: "Dangling Reference from Local",
    difficulty: "medium",
    stem:
      "`const std::string& getName(int id) { std::string name = lookupName(id); return name; }` compiles without warning in one build but crashes intermittently in production when the caller later reads the returned reference. What's going on?",
    options: [
      {
        text: "`name` is a local variable that's destroyed when `getName` returns, so the returned reference dangles — any later read is undefined behavior, which is why it 'works' sometimes and crashes other times depending on what overwrites that stack memory",
        sub: "Returning a reference to a destroyed local",
        fix: "",
      },
      {
        text: "Binding the return type to `const std::string&` extends `name`'s lifetime to match the reference, so this is safe and the crash must come from somewhere else",
        sub: "Misapplies lifetime extension to return values",
        fix:
          "Lifetime extension only applies when a const reference binds directly to a temporary in the same scope, like `const std::string& r = makeTemp();` — it does not apply across a function return boundary, so `name` is destroyed normally when `getName` exits.",
      },
      {
        text: "`std::string`'s destructor doesn't actually free its internal buffer until the program exits, so the data stays valid even after `name` goes out of scope",
        sub: "False claim about string destruction timing",
        fix:
          "`std::string`'s destructor runs deterministically when the object goes out of scope and releases its heap buffer (when not using SSO) immediately — there's no language guarantee, or actual implementation behavior, that defers this to program exit.",
      },
      {
        text: "The build that crashes must have a different compiler optimization level; with optimizations off this code is fully defined and safe",
        sub: "Misattributes UB to optimization settings alone",
        fix:
          "This is undefined behavior at every optimization level — `-O0` builds can also crash or silently 'work' by luck depending on what's written to the freed stack slot next; optimization level changes the symptoms, not the underlying correctness.",
      },
    ],
    correctIndex: 0,
    proTip:
      "If a function returns a reference, ask 'whose object is this referring to, and will it still be alive after I return?' — returning a reference or pointer to a stack-local is one of the most common sources of intermittent, hard-to-reproduce crashes in C++.",
    lesson:
      "Local variables have automatic storage duration and are destroyed when the function returns. Returning a reference (or pointer) to one hands the caller a reference to memory that's no longer valid — reading it is undefined behavior, which can manifest as garbage data, a crash, or even appearing to 'work' if the stack memory hasn't been overwritten yet. The fix is to return by value (letting move semantics or copy elision make it cheap) rather than by reference to a local.",
    remember: "Returning a reference to a local variable hands back a dangling reference the moment the function exits — return by value instead, and let move semantics keep it cheap.",
    interviewAnswer: "name is a local std::string with automatic storage duration, so it's destroyed the instant getName returns — the const std::string& that comes back is a reference to memory that's already been deallocated. The intermittent crash is classic undefined-behavior signature: sometimes the stack memory hasn't been reused yet so the string looks fine, other times something else has overwritten it and you get garbage or a crash. People sometimes think binding to a const reference extends the lifetime, but that only applies when the reference binds directly to a temporary in the same expression, not across a return boundary. The fix is trivial — just return std::string by value; copy elision or the move constructor makes that cheap, and there's no dangling reference to worry about.",
  },
  {
    id: "q-cpp-rule5-001",
    subject: "CPP",
    concept: "Rule of Five — Move Assignment",
    difficulty: "hard",
    stem:
      "`class Buffer` manages a raw `char* data` and defines a custom destructor (`delete[] data;`) and a custom copy constructor (deep copy), but no move constructor, no move assignment operator, and no copy assignment operator. Code does `Buffer a = makeBuffer(); Buffer b; b = a;` where `makeBuffer()` returns by value. Profiling shows this is unexpectedly doing a full deep copy on `b = a;` even though `a` is about to be discarded in some other call sites where `std::move(a)` is used. Why doesn't `std::move(a)` followed by assignment actually move?",
    options: [
      {
        text: "With no user-declared move assignment operator, `b = std::move(a)` falls back to the (implicitly or explicitly) defined copy assignment operator, which performs a deep copy — `std::move` only casts to an rvalue, it doesn't force a move if no move assignment exists to bind to",
        sub: "Missing move assignment forces fallback to copy assignment",
        fix: "",
      },
      {
        text: "Because a custom destructor is declared, the compiler automatically generates a move assignment operator that does a shallow pointer copy, which is what's slow here",
        sub: "Misstates which special members get suppressed vs generated",
        fix:
          "It's the opposite: declaring a custom destructor suppresses the compiler's implicitly-generated move constructor and move assignment operator entirely — none is implicitly generated here, so there's no shallow-copy move to blame; assignment falls back to copy.",
      },
      {
        text: "`std::move(a)` doesn't compile unless the class explicitly opts in with `= default` on a move constructor, so this code wouldn't build",
        sub: "Invents a compile-time requirement for std::move",
        fix:
          "`std::move` is just `static_cast<Buffer&&>(a)` and compiles regardless of what special members `Buffer` declares; it always compiles, the question is purely which overload — move or copy assignment — actually gets selected and runs.",
      },
      {
        text: "The deep copy is unavoidable here because `char*` arrays can never be moved, only deep-copied, regardless of what assignment operators are defined",
        sub: "False claim about raw pointer movability",
        fix:
          "A raw pointer is trivially movable — moving simply means copying the pointer value and nulling the source, which is exactly what a hand-written move assignment operator for `Buffer` would do in O(1) instead of deep-copying the buffer.",
      },
    ],
    correctIndex: 0,
    proTip:
      "The Rule of Five isn't five independent suggestions — declaring even one of destructor/copy-ctor/copy-assign/move-ctor/move-assign is a signal you're managing a resource manually, and skipping the move pair silently downgrades every `std::move` in your codebase to a full copy.",
    lesson:
      "`std::move` doesn't perform a move by itself — it's a cast that makes its argument eligible to bind to an rvalue-reference overload (i.e., a move constructor or move assignment operator). If the class has a user-declared destructor or copy constructor, the compiler does not implicitly generate move operations, so overload resolution on `b = std::move(a)` has no move assignment to select and falls back to copy assignment, performing a full deep copy. The fix is to explicitly declare a move assignment operator (and move constructor) that steals the pointer and nulls the source in O(1).",
    remember: "std::move only enables move overload resolution — without a user-declared (or defaulted) move assignment operator, assignment silently falls back to a full deep copy.",
    interviewAnswer: "std::move(a) just casts a to an rvalue reference — it doesn't force anything to move by itself, it only makes a eligible to bind to a move assignment operator if one exists. Because Buffer declares a custom destructor and copy constructor but never declares move operations, the compiler suppresses the implicit move assignment entirely, so there's nothing for that rvalue to bind to except the regular copy assignment operator, which does the deep copy. That's the classic Rule-of-Five trap: once you write any one of the five special members by hand because you're managing a resource, you usually need to write all five, or every std::move in the codebase quietly degrades into a copy. The fix is a real move assignment operator that steals data's pointer and sets the source's pointer to nullptr.",
  },
  {
    id: "q-cpp-vectorrealloc-001",
    subject: "CPP",
    concept: "vector Reallocation Cost",
    difficulty: "medium",
    stem:
      "A hot loop does `std::vector<Order> orders; for (int i = 0; i < 1'000'000; ++i) orders.push_back(makeOrder(i));` with no `reserve()` call beforehand. Profiling shows a large chunk of total time is spent not in `makeOrder` but inside `push_back` itself, copying/moving existing elements. Why does this happen even though `push_back` is documented as amortized O(1)?",
    options: [
      {
        text: "Each time capacity is exceeded, `vector` allocates a larger buffer (typically growing by ~1.5x–2x) and relocates every existing element into it, so even though this happens at exponentially decreasing frequency, the relocated element count grows with the vector — `reserve()` upfront avoids all of that work",
        sub: "Amortized O(1) still pays a real, non-trivial relocation cost without reserve",
        fix: "",
      },
      {
        text: "`push_back` is actually O(n) on every single call, not amortized O(1) — the documentation's complexity guarantee is only theoretical and doesn't hold for real implementations",
        sub: "Misstates the standard's complexity guarantee",
        fix:
          "Amortized O(1) is a real, standard-mandated guarantee that holds for real implementations — not just theoretical. The total cost across N push_backs is O(N), it's just that the cost isn't evenly distributed: most calls are O(1) and a few trigger O(k) relocations, which is exactly what's showing up in the profile.",
      },
      {
        text: "The slowdown is from `makeOrder` being called inside the loop expression, which forces the compiler to disable move semantics for `Order`",
        sub: "Unrelated false claim about call-site move suppression",
        fix:
          "Where a function is called from has no bearing on whether its return value can be moved — `makeOrder(i)`'s returned temporary is moved (or elided) into the vector regardless of being inline in a loop. That's not the source of the relocation cost being profiled.",
      },
      {
        text: "`std::vector` reallocates and copies all elements on every `push_back` call by design, to keep elements contiguous in memory",
        sub: "Claims every call reallocates, contradicting amortized growth",
        fix:
          "Reallocation only happens when size would exceed current capacity, not on every call — most push_back calls just write into already-reserved spare capacity with no relocation at all, which is precisely what makes the average cost O(1).",
      },
    ],
    correctIndex: 0,
    proTip:
      "If you know (or can estimate) the final size of a vector before filling it, call `reserve()` upfront — it turns a sequence of geometric reallocations into a single allocation and eliminates all the relocation work entirely.",
    lesson:
      "`vector::push_back` is amortized O(1) because growth is geometric (implementations commonly grow capacity by a factor like 1.5x or 2x), so the total relocation work across N insertions sums to O(N) rather than O(N²) — but that total work is still real and non-zero, concentrated into the calls that trigger reallocation. Each reallocation move/copy-constructs every existing element into the new buffer, which is exactly the cost the profiler is attributing to `push_back`. Calling `reserve(1'000'000)` before the loop allocates the final buffer once, so no element is ever relocated.",
    remember: "Amortized O(1) push_back still does real relocation work on every growth step — reserve() upfront when the final size is knowable, and that cost disappears entirely.",
    interviewAnswer: "push_back being amortized O(1) means the total cost over many calls is linear, not that every individual call is free — when the vector runs out of capacity, it has to allocate a bigger buffer and move or copy every existing element into it, and with a million elements those relocations add up to real, measurable time even though they happen at exponentially decreasing frequency. That's exactly what the profiler is catching: it's not makeOrder, it's vector doing repeated geometric growth. Since we know the final size upfront here, calling orders.reserve(1'000'000) before the loop allocates once and eliminates every single relocation — push_back then just writes into existing capacity for the entire loop.",
  },
  {
    id: "q-cpp-intoverflow-001",
    subject: "CPP",
    concept: "Signed Integer Overflow UB",
    difficulty: "hard",
    stem:
      "A bounds-check helper is written as `bool isValidRange(int start, int len) { return start + len > start; }` intended to catch cases where `len` is large enough to overflow. In release builds with optimizations on, this check sometimes gets entirely removed by the compiler and always behaves as if it returned `true`, even for inputs that should overflow. Why?",
    options: [
      {
        text: "Signed integer overflow is undefined behavior in C++, so the compiler is permitted to assume `start + len` never overflows and optimize `start + len > start` down to always `true`, eliminating the check entirely",
        sub: "UB lets the optimizer assume overflow never happens",
        fix: "",
      },
      {
        text: "The compiler removed the check because `start + len > start` is always mathematically true for any integers, so the optimization is just simplifying a tautology",
        sub: "Treats it as true math rather than UB-driven assumption",
        fix:
          "It's only a mathematical tautology for unbounded integers; for fixed-width signed `int`, `start + len` can wrap and become less than `start` if it overflows — the compiler isn't proving real math here, it's exploiting the rule that signed overflow is UB and therefore assumed not to occur.",
      },
      {
        text: "This only happens because `int` is unsigned on this platform, where wraparound is well-defined and always produces a larger value",
        sub: "Confuses signed and unsigned wraparound semantics",
        fix:
          "`int` is a signed type by default; unsigned integer overflow is well-defined modular wraparound in C++, but that's not what's happening here — the bug specifically depends on `int` being signed, where overflow is UB rather than defined wraparound.",
      },
      {
        text: "Compilers never remove or alter conditional checks like this; the 'always true' behavior must be coming from a bug in `isValidRange`'s caller, not the optimizer",
        sub: "Denies that optimizers exploit UB this aggressively",
        fix:
          "Real-world compilers (GCC, Clang, MSVC) do exploit signed-overflow UB exactly this way at -O2/-O3 — removing or short-circuiting overflow checks like this is a well-documented optimization, not a hypothetical.",
      },
    ],
    correctIndex: 0,
    proTip:
      "Never try to detect signed integer overflow by checking the result after the fact (`a + b > a`) — the addition that overflows is already UB before you get to check it, so the optimizer can erase your check. Detect it beforehand using something like `__builtin_add_overflow`, widen to a larger type, or use unsigned arithmetic where wraparound is well-defined.",
    lesson:
      "The C++ standard defines signed integer overflow as undefined behavior, not wraparound — so when the compiler can prove a code path requires `start + len` to overflow for the comparison to ever be false, it's allowed to assume that path is unreachable and optimize accordingly, often collapsing the whole comparison to a constant `true`. This is a real, common optimization at -O2/-O3 in GCC and Clang. The fix is to check for overflow before performing the operation (e.g., `len > INT_MAX - start`) or use a type/operation with well-defined overflow semantics.",
    remember: "Signed overflow is UB, so compilers may assume it never happens and silently delete post-hoc overflow checks like `a + b > a` — check for overflow before the addition, not after.",
    interviewAnswer: "The bug is that this check relies on signed integer overflow actually happening and producing a smaller wrapped value — but signed overflow is undefined behavior in C++, not defined wraparound like unsigned arithmetic. Because of that, the optimizer is allowed to reason 'if start + len overflowed, that would be UB, which by definition can't happen, so this comparison must always be true' and just erase the check at -O2 or -O3. It's a really common real-world gotcha — GCC and Clang both do this. The correct fix is to check for overflow before doing the addition, something like len > INT_MAX - start, or do the arithmetic in a wider or unsigned type where the behavior is actually defined.",
  },
  {
    id: "q-cpp-forwarding-001",
    subject: "CPP",
    concept: "Perfect Forwarding & Universal References",
    difficulty: "hard",
    stem:
      "A wrapper is written as `template <typename T> void logAndEmplace(std::vector<T>& v, T&& item) { log(item); v.push_back(item); }` intended to forward `item` into the vector without an extra copy. Profiling shows `push_back(item)` always copies, even when callers pass temporaries like `logAndEmplace(v, makeLargeOrder())`. What's wrong?",
    options: [
      {
        text: "`item` is passed as `T&&`, but inside the function body `item` is itself an lvalue (it has a name), so `v.push_back(item)` always calls the copy overload; reaching the move overload requires `std::move(item)` (or `std::forward<T>(item)` if `T&&` were a true forwarding reference) at the call site",
        sub: "Named rvalue references are lvalues when used",
        fix: "",
      },
      {
        text: "`T&&` here is a forwarding (universal) reference, so `item` should already automatically forward as an rvalue with no extra code needed — the real bug must be inside `push_back` itself",
        sub: "Misidentifies T&& as a forwarding reference in this context",
        fix:
          "`T&&` is only a forwarding reference when `T` is deduced directly in that exact function template (e.g. `template<typename T> void f(T&& x)`). Here `T` is already bound by the `std::vector<T>&` parameter earlier in the signature, so `T&&` is just an ordinary rvalue reference, not a forwarding reference — it does not auto-forward.",
      },
      {
        text: "The copy happens because `log(item)` internally consumes or moves from `item`, leaving `push_back` no choice but to copy what's left",
        sub: "Wrongly blames the unrelated log() call",
        fix:
          "`log(item)` takes `item` by whatever its own signature specifies (commonly by const reference for a logging function) and has no special standard-mandated power to move from its argument — it isn't what forces `push_back` to copy; the copy happens regardless of what `log` does, purely because `item` is used as a named lvalue.",
      },
      {
        text: "Since the function parameter type is `T&&` and a temporary was passed in, the compiler automatically treats every use of `item` inside the function as an rvalue",
        sub: "Misunderstands that reference category is per-expression, not per-declaration",
        fix:
          "Whether a function parameter was originally bound to an rvalue has no bearing on how that named parameter behaves inside the function body — any named variable, regardless of its declared reference type, is an lvalue expression when you write its name. That's exactly why std::move/std::forward exist — to re-cast it back to an rvalue when needed.",
      },
    ],
    correctIndex: 0,
    proTip:
      "A named variable is always an lvalue, full stop — even if its type is `T&&` or `int&&`. To actually move from it, you have to explicitly say so with `std::move` (or `std::forward<T>` for a genuine forwarding reference where `T` is deduced right there in that parameter).",
    lesson:
      "`T&&` only behaves as a forwarding/universal reference when `T` is a template parameter deduced directly from that same function parameter (e.g. `template<typename T> void f(T&& x)`); here `T` was already fixed by the earlier `std::vector<T>&` parameter, so `item`'s type is a plain rvalue reference. Regardless of reference category, any named variable is an lvalue expression inside the function body — `item` used by name selects the lvalue (copying) overload of `push_back`. To actually move, the call site needs `std::move(item)`.",
    remember: "A parameter typed T&& is still an lvalue once you refer to it by name inside the function — only std::move (or std::forward for true forwarding references) makes it bind to the move overload.",
    interviewAnswer: "The trap here is conflating 'the parameter type is T&&' with 'using item will automatically move.' Even though item's declared type is an rvalue reference, item is a named variable, and any named variable is an lvalue when you write it in an expression — so v.push_back(item) resolves to the copying overload every time. On top of that, this T&& isn't even a true forwarding reference, because T was already deduced from the std::vector<T>& parameter earlier in the signature — forwarding references only happen when T is deduced directly from that exact parameter. So even std::forward<T>(item) wouldn't be quite right here conceptually, though it would still work mechanically; the cleanest fix is just std::move(item) since by the time we're pushing it, we're done with it and want to transfer it.",
  },
  {
    id: "q-cpp-diamond-001",
    subject: "CPP",
    concept: "Diamond Problem & Virtual Inheritance",
    difficulty: "hard",
    stem:
      "`class Sensor { protected: int readingCount = 0; };` and `class TempSensor : public Sensor {};` and `class PressureSensor : public Sensor {};` and `class CombinedSensor : public TempSensor, public PressureSensor {};`. Code in `CombinedSensor` does `readingCount++;` and it fails to compile with an 'ambiguous member' error, even though logically there should be one shared reading count. Why, and what's the standard fix?",
    options: [
      {
        text: "`CombinedSensor` contains two separate `Sensor` subobjects — one via `TempSensor`, one via `PressureSensor` — so `readingCount` is ambiguous between them; the fix is to make `TempSensor` and `PressureSensor` inherit from `Sensor` virtually so `CombinedSensor` gets a single shared `Sensor` subobject",
        sub: "Non-virtual diamond inheritance duplicates the base subobject",
        fix: "",
      },
      {
        text: "The ambiguity is just a naming collision; renaming `readingCount` to two different names in `TempSensor` and `PressureSensor` is the standard fix recommended for this pattern",
        sub: "Treats the duplication as a naming problem, not a layout problem",
        fix:
          "Renaming sidesteps the symptom but defeats the entire purpose of sharing one Sensor's state — the real problem is that two physically separate Sensor subobjects exist, so even with different names the reading counts would be tracked independently rather than shared, which isn't what the design intends.",
      },
      {
        text: "This is a compiler bug — `CombinedSensor` should automatically know to merge identical inherited members from a common ancestor without any special syntax",
        sub: "Denies that diamond duplication is standard, intended behavior",
        fix:
          "Diamond-shaped non-virtual inheritance producing two distinct base subobjects, and the resulting ambiguity, is standard-mandated C++ behavior across all conforming compilers — it's not a bug, it's the default semantics that `virtual` inheritance exists specifically to override.",
      },
      {
        text: "`protected` members can't be inherited through more than one path, so the fix is to make `readingCount` public instead",
        sub: "Misattributes the issue to access specifier rather than subobject duplication",
        fix:
          "Access level (protected vs public) has nothing to do with this ambiguity — a public `readingCount` would produce the exact same 'ambiguous member' error, because the problem is that there are two distinct subobjects, not that one is inaccessible.",
      },
    ],
    correctIndex: 0,
    proTip:
      "Default (non-virtual) multiple inheritance gives every inheritance path its own copy of a shared base — if two paths to the same base class are supposed to refer to one shared state, that base must be inherited `virtual` by every intermediate class, or you get duplicated subobjects and ambiguous member access.",
    lesson:
      "In ordinary (non-virtual) multiple inheritance, each base class in the hierarchy gets its own independent subobject, so a diamond like `CombinedSensor : TempSensor, PressureSensor` (where both derive from `Sensor`) ends up containing two distinct `Sensor` subobjects, each with its own `readingCount`. Referring to `readingCount` from `CombinedSensor` is ambiguous because the compiler can't tell which copy you mean. Declaring `class TempSensor : public virtual Sensor` and `class PressureSensor : public virtual Sensor` makes both paths share a single `Sensor` subobject, resolving the ambiguity and giving the intended shared state.",
    remember: "Non-virtual diamond inheritance creates one base subobject per inheritance path (ambiguous, duplicated state) — virtual inheritance on the intermediate classes collapses them into a single shared subobject.",
    interviewAnswer: "This is the classic diamond problem: because TempSensor and PressureSensor each inherit from Sensor normally, CombinedSensor ends up with two completely separate Sensor subobjects in memory, each with its own readingCount — so when CombinedSensor refers to readingCount, the compiler genuinely can't tell which of the two copies you mean, hence the ambiguous member error. The standard fix is virtual inheritance: declare TempSensor and PressureSensor as inheriting virtual public Sensor, which tells the compiler that no matter how many paths lead to Sensor, there should only be one shared instance of it in the most-derived object. After that change, readingCount resolves unambiguously to that single shared subobject.",
  },
  {
    id: "q-cpp-staticinit-001",
    subject: "CPP",
    concept: "Static Initialization Order Fiasco",
    difficulty: "hard",
    stem:
      "`// logger.cpp\\nstd::string g_logPrefix = \"[APP] \";`  and  `// config.cpp\\nstd::string g_configPath = g_logPrefix + \"config.json\";` (these are two different translation units, each with a global `std::string`). At startup, `g_configPath` is sometimes correctly `\"[APP] config.json\"` and sometimes just `\"config.json\"`, depending on build/link order. What's happening?",
    options: [
      {
        text: "The C++ standard does not guarantee initialization order for non-local static objects across different translation units, so whether `g_logPrefix` has been constructed yet when `g_configPath`'s initializer runs depends on link order, which is undefined behavior territory the standard calls the 'static initialization order fiasco'",
        sub: "Cross-TU static init order is unspecified",
        fix: "",
      },
      {
        text: "Both globals are guaranteed to be zero-initialized before any constructors run, so this is actually deterministic and the inconsistency must be coming from a data race elsewhere",
        sub: "Conflates zero-initialization guarantee with the actual bug",
        fix:
          "Zero-initialization happening first is true but irrelevant to the bug — the issue is about which translation unit's *dynamic* initializer (the constructor call building the std::string's contents) runs first, and that order across TUs is genuinely unspecified by the standard, not a data race.",
      },
      {
        text: "This can't actually happen — within the same program, all global objects are always constructed in the exact order they're declared in source, regardless of which file they're in",
        sub: "False claim of cross-file declaration-order guarantee",
        fix:
          "The standard only guarantees construction order *within* a single translation unit, in the order objects are defined in that file. Across different translation units, the order is unspecified — it commonly depends on link order or the whims of the build system, which is exactly the bug being described.",
      },
      {
        text: "The inconsistent value means `g_logPrefix` has a data race from being accessed on multiple threads during static initialization",
        sub: "Misattributes a single-threaded ordering bug to threading",
        fix:
          "Nothing in this scenario involves multiple threads — both global variables are being initialized during single-threaded program startup. The nondeterminism comes purely from cross-TU initialization order being unspecified, not from concurrent access.",
      },
    ],
    correctIndex: 0,
    proTip:
      "Never let one translation unit's global object's initializer depend on another TU's global object — the order is a coin flip determined by your linker. If you need a guaranteed-initialized global dependency, wrap it in a function returning a function-local `static` (the 'Construct On First Use' idiom), since local statics are guaranteed initialized on first use, not at some arbitrary global startup order.",
    lesson:
      "C++ guarantees that non-local static objects within a single translation unit are initialized in the order they're defined in that file, but it explicitly does not guarantee any particular order between objects defined in different translation units — that order is determined by implementation details like link order, which can change across builds, compilers, or even unrelated source changes. This is the 'static initialization order fiasco': `g_configPath`'s initializer reads `g_logPrefix`, but whether `g_logPrefix`'s constructor has already run by that point is essentially undefined from the standard's perspective. The standard fix is the Construct-On-First-Use idiom, returning a function-local `static` reference instead of a plain global.",
    remember: "Initialization order between globals in different translation units is unspecified — if one global's initializer depends on another TU's global, use a function-local static (Construct On First Use) instead.",
    interviewAnswer: "This is the static initialization order fiasco. C++ only guarantees that statics within the same translation unit get initialized in declaration order — across different .cpp files, there's no guaranteed order at all, it just falls out of whatever order the linker happens to process translation units in. So depending on the build, g_logPrefix's constructor might run before or after g_configPath's initializer tries to read it; when it hasn't run yet, g_configPath ends up concatenating onto a default-constructed empty string instead of the real prefix. The standard fix is Construct On First Use: wrap g_logPrefix in a function that returns a reference to a function-local static, since local statics are guaranteed to initialize the first time that function is called, which sidesteps cross-TU ordering entirely.",
  },
  {
    id: "q-cpp-stdfunction-001",
    subject: "CPP",
    concept: "std::function Overhead",
    difficulty: "medium",
    stem:
      "A hot per-frame callback path was refactored from a plain function pointer `void (*callback)(Entity&)` to `std::function<void(Entity&)> callback` for flexibility (so lambdas with captures could be used). After the change, profiling on 100k entities per frame shows a measurable slowdown in calling `callback(entity)` itself, even though the callback body is identical. What's the most likely cause?",
    options: [
      {
        text: "`std::function` type-erases its target and commonly heap-allocates storage for captures beyond a small inline buffer, so each call goes through an indirect call into erased storage instead of a direct call, adding real per-call overhead that a raw function pointer doesn't have",
        sub: "Type erasure plus possible heap allocation adds indirection cost",
        fix: "",
      },
      {
        text: "`std::function` and raw function pointers compile down to identical machine code, so any measured slowdown must be from an unrelated change made during the same refactor",
        sub: "Denies any real overhead difference",
        fix:
          "`std::function` is a type-erased wrapper with virtual-call-like dispatch and potential heap allocation for its target, which is measurably more expensive per call than a bare function pointer's direct call — this is a well-documented, real overhead, not a wash.",
      },
      {
        text: "The slowdown is because `std::function` validates its argument types at every call using RTTI, which a function pointer skips",
        sub: "Invents a runtime type-check that doesn't exist in std::function's call path",
        fix:
          "`std::function<void(Entity&)>::operator()` does not perform RTTI-based argument validation on every call — argument types are fixed at compile time by the template signature. The actual overhead source is the indirect/type-erased dispatch and potential allocation, not runtime type checking.",
      },
      {
        text: "Lambdas with captures are inherently slower to execute than plain functions, regardless of whether they're stored in a function pointer or a std::function",
        sub: "Misattributes the cost to lambdas rather than the wrapper",
        fix:
          "A captureless lambda already converts to a plain function pointer with zero overhead, and even a capturing lambda's body executes at normal speed once entered — the overhead being measured here is specifically the std::function wrapper's dispatch/allocation, not lambda execution itself.",
      },
    ],
    correctIndex: 0,
    proTip:
      "`std::function` is great for flexibility (any callable, stored uniformly) but isn't free — in genuinely hot, tight loops prefer a template parameter (`template<typename F> void run(F&& callback)`) so the compiler can inline the actual callable, or fall back to a function pointer plus an explicit `void*` context if you must erase the type without `std::function`'s overhead.",
    lesson:
      "`std::function` achieves its flexibility (storing any callable matching a signature, including capturing lambdas, function pointers, or functors) through type erasure: it stores the callable behind an internal interface and dispatches through it, similar in spirit to a virtual call, and if the callable's captured state doesn't fit in `std::function`'s small inline buffer, it heap-allocates storage for it. Both the indirect dispatch and any heap allocation are real costs absent from a raw function pointer, which is just a direct call. Templates avoid this entirely because the compiler knows the concrete callable type at compile time and can often inline it completely.",
    remember: "std::function trades a direct call for type-erased dispatch (and possible heap allocation for captures) — in hot loops prefer a template parameter so the compiler can inline the actual callable.",
    interviewAnswer: "A raw function pointer is just a direct call through an address — minimal overhead. std::function has to support storing any callable with a matching signature, so it type-erases the target behind an internal interface and dispatches through that, which is a similar cost profile to a virtual call, plus if the lambda's captures don't fit in its small-buffer optimization, it heap-allocates to hold them. Over 100k calls per frame, that per-call indirection and potential allocation adds up to a real, measurable difference even though the callback body itself didn't change. If this is truly hot-path code, I'd either pass the callable as a template parameter so the compiler can inline it directly, or, if true type erasure is required, hand-roll a lighter-weight erasure that avoids the allocation, rather than defaulting to std::function in the innermost loop.",
  },
  {
    id: "q-cpp-falsesharing-001",
    subject: "CPP",
    concept: "False Sharing in Multithreaded Code",
    difficulty: "hard",
    stem:
      "Four worker threads each increment their own counter in `struct Counters { std::atomic<long> count[4]; }; Counters c;` with thread `i` only ever touching `c.count[i]`. Despite each thread writing to a logically distinct, non-overlapping element with no shared data and no contention in the algorithm, throughput is far worse than four independent atomics allocated separately on the heap. What's the cause?",
    options: [
      {
        text: "All four `long` counters likely fit within the same CPU cache line (commonly 64 bytes), so every thread's write invalidates the cache line for the other three cores even though they're modifying different array elements — this is false sharing, fixed by padding each counter to its own cache line",
        sub: "Logically independent data sharing one physical cache line",
        fix: "",
      },
      {
        text: "`std::atomic<long>` internally uses a mutex to guarantee atomicity, and all four elements are serialized through that same mutex, explaining the slowdown",
        sub: "Misattributes atomic implementation to lock-based serialization",
        fix:
          "`std::atomic<long>` on essentially all mainstream platforms is implemented lock-free using native atomic CPU instructions, not an internal mutex — there's no shared lock serializing the four elements; the slowdown is a cache-coherency effect, not a locking one.",
      },
      {
        text: "The array `count[4]` exceeds the maximum size `std::atomic` supports for lock-free operation, so the compiler silently falls back to non-atomic, racy increments",
        sub: "Invents a size limit causing silent non-atomicity",
        fix:
          "There's no such size threshold here — four `long` elements is nowhere near any practical lock-free limit, and `std::atomic` does not silently downgrade to non-atomic behavior under any circumstances; if a type weren't lock-free, `is_lock_free()` would report that, but correctness wouldn't be compromised.",
      },
      {
        text: "This is just normal atomic contention — any `std::atomic` accessed by multiple threads is inherently slow regardless of memory layout, so separating them onto the heap wouldn't actually help",
        sub: "Denies the layout-dependent nature of the problem, contradicted by the premise",
        fix:
          "The premise explicitly states that four independently heap-allocated atomics (one per allocation, naturally landing on separate cache lines) perform far better — so the slowdown isn't from atomics being inherently slow under any multithreaded use, it's specifically caused by the shared-array layout packing them onto one cache line.",
      },
    ],
    correctIndex: 0,
    proTip:
      "When multiple threads frequently write to logically independent data, check whether that data is physically packed together — pad or align each thread's hot data to its own cache line (`alignas(64)` or a padding member) to eliminate false sharing, since the cache-coherence protocol operates at cache-line granularity, not per-variable.",
    lesson:
      "CPU cache coherence protocols (like MESI) operate at the granularity of a full cache line (typically 64 bytes), not individual variables — when core A writes to any byte in a cache line, every other core's cached copy of that entire line is invalidated, forcing them to reload it on their next access. Here, four 8-byte `long` atomics packed into one array easily fit within a single 64-byte cache line, so even though each thread only touches its own array element, every write bounces the whole line between cores, serializing what should be fully parallel work. The fix is to pad each counter (e.g., to 64 bytes, often via `alignas(64)` or an explicit padding struct) so each lives on its own cache line.",
    remember: "Cache coherence invalidates a whole cache line on any write to it — packing independent per-thread data into the same line causes false sharing; pad each thread's data to its own cache line to fix it.",
    interviewAnswer: "Even though each thread only ever writes its own count[i] and there's no logical data race, the cache coherence protocol doesn't know or care about array element boundaries — it operates at the granularity of a whole cache line, typically 64 bytes. Four longs are only 32 bytes total, so all four almost certainly land in the same cache line, and every time any thread writes its element, that invalidates the entire line in the other three cores' caches, forcing them to refetch it before their next access. That's false sharing — the threads are fighting over cache-line ownership even though their actual data is independent. The fix is to pad the struct so each counter gets its own cache line, typically with alignas(64) or explicit padding bytes between elements, which is exactly why separately heap-allocated atomics performed better — the allocator naturally spread them across different cache lines.",
  },
];
