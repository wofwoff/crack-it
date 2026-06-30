export const NEW_CPP = [
  {
    id: "q-cpp-uniqueptr-001",
    subject: "CPP",
    concept: "unique_ptr Ownership Transfer",
    difficulty: "medium",
    stem:
      "A connection pool returns resources via `std::unique_ptr<Connection> acquire()`. A developer writes:\n```cpp\nstd::unique_ptr<Connection> a = pool.acquire();\nstd::unique_ptr<Connection> b = a;\n```\nWhat happens when this code is compiled?",
    options: [
      {
        text: "Compile error — unique_ptr's copy constructor is deleted, so `b = a` won't compile",
        sub: "unique_ptr enforces single ownership at compile time",
        fix: "",
      },
      {
        text: "Compiles fine — both a and b now share ownership of the same Connection",
        sub: "Assumes unique_ptr behaves like shared_ptr",
        fix:
          "unique_ptr has no reference counting and its copy constructor is explicitly deleted; this code would not compile at all, let alone produce shared ownership.",
      },
      {
        text: "Compiles fine — a is set to nullptr and b takes ownership, like a move",
        sub: "Assumes copy syntax implicitly moves for unique_ptr",
        fix:
          "Implicit moves only happen for rvalues (temporaries) or with explicit std::move(); `b = a` is a copy-initialization from an lvalue, which unique_ptr's deleted copy constructor rejects at compile time.",
      },
      {
        text: "Compiles fine, but causes a double-free at runtime when both a and b go out of scope",
        sub: "Assumes unique_ptr allows copies that later conflict",
        fix:
          "This never reaches runtime — the compiler rejects the copy at compile time precisely to prevent this exact double-free scenario from ever being possible.",
      },
    ],
    correctIndex: 0,
    proTip:
      "unique_ptr's entire safety guarantee comes from its copy constructor and copy assignment being `= delete`d — the compiler refuses to let two unique_ptrs reference the same object, which is what makes std::move() necessary to transfer ownership explicitly.",
    lesson:
      "std::unique_ptr models exclusive ownership: only one unique_ptr may own a given object at a time. To enforce this, its copy constructor and copy assignment operator are deleted, so `std::unique_ptr<Connection> b = a;` fails to compile when a is an lvalue. To transfer ownership, the developer must write `std::unique_ptr<Connection> b = std::move(a);`, which explicitly moves the underlying pointer from a to b and sets a to nullptr. This compile-time enforcement is precisely what prevents the double-free and use-after-free bugs that raw pointer ownership allows.",
    remember: "unique_ptr's copy operations are deleted by design — ownership transfer requires std::move(), and the compiler catches accidental copies before they become runtime bugs.",
    interviewAnswer: "This won't compile, because unique_ptr's copy constructor is deleted — that's the entire point of the type, it models exclusive ownership and the compiler enforces 'only one owner' at compile time rather than relying on programmer discipline. To actually transfer ownership from a to b, you need std::move(a), which invokes the move constructor instead, transfers the underlying raw pointer to b, and leaves a holding nullptr. I'd point out that this compile-time rejection is a feature, not a limitation — it's catching exactly the kind of double-ownership bug that used to cause double-frees with raw pointers or auto_ptr.",
  },
  {
    id: "q-cpp-danglingref-001",
    subject: "CPP",
    concept: "Dangling Reference from Local",
    difficulty: "hard",
    stem:
      "A function returns a reference to a local variable:\n```cpp\nconst std::string& getDefaultName() {\n    std::string name = \"guest\";\n    return name;\n}\n\nstd::cout << getDefaultName();\n```\nWhat is the actual problem with this code, and why might it sometimes appear to work?",
    options: [
      {
        text: "name's storage is destroyed when getDefaultName() returns, so the reference is dangling; the output is undefined behavior that can coincidentally print the right thing if the memory hasn't been overwritten yet",
        sub: "Returning a reference to a local creates a dangling reference",
        fix: "",
      },
      {
        text: "This is legal and safe because const references extend the lifetime of what they refer to",
        sub: "Confuses reference binding with lifetime extension",
        fix:
          "Lifetime extension applies only when a const reference binds directly to a temporary at the point of declaration in the same scope, not to a named local variable returned by reference from a function — name's storage is gone the instant the function returns.",
      },
      {
        text: "The compiler automatically converts the return type to std::string by value, so there's no issue",
        sub: "Assumes implicit return-type promotion happens",
        fix:
          "C++ does not silently change a function's declared return type; the function returns exactly what its signature says, a reference, and that reference is left dangling.",
      },
      {
        text: "This only fails if name is declared static; as a plain local it's fine",
        sub: "Inverts the actual fix",
        fix:
          "It's the opposite: making name static is what would fix this (since static locals persist for the program's lifetime) — as written, without static, the local is destroyed at function return and the reference dangles.",
      },
    ],
    correctIndex: 0,
    proTip:
      "Returning a reference (or pointer) to a local variable is one of the most common sources of 'works on my machine, crashes in CI' bugs in C++ — the behavior is undefined, not guaranteed-broken, so it can appear to work by accident until the stack memory gets reused.",
    lesson:
      "Local variable name lives on the stack frame of getDefaultName(). When the function returns, that stack frame is popped and name's storage is no longer valid, but the returned reference still points at that now-invalid memory location — a dangling reference. Using it (std::cout << getDefaultName()) is undefined behavior: it might print 'guest' if the memory hasn't been overwritten by anything else yet, or it might print garbage, or crash, depending on what subsequently reuses that stack space. The fix is to return by value (std::string getDefaultName()), letting move semantics or RVO avoid unnecessary copies while keeping the returned data safely owned by the caller.",
    remember: "Never return a reference or pointer to a local/stack variable — its storage is gone when the function returns, even though the reference itself still 'points' somewhere. Return by value instead.",
    interviewAnswer: "The bug is that name is a local variable living on getDefaultName()'s stack frame, and that frame is destroyed the instant the function returns — so the const std::string& being returned is a dangling reference to memory that's no longer valid. The reason it might 'appear to work' is that undefined behavior doesn't mean guaranteed failure; if nothing has overwritten that stack memory yet, std::cout might print 'guest' correctly, which makes this exact bug notoriously hard to catch in casual testing and far more likely to surface under different optimization levels or call patterns in production. The fix is straightforward: return std::string by value instead of by reference — modern compilers apply return value optimization or a move, so it's not even meaningfully slower, and it's actually safe.",
  },
  {
    id: "q-cpp-rule5-001",
    subject: "CPP",
    concept: "Rule of Five — Move Assignment",
    difficulty: "hard",
    stem:
      "A Buffer class manages a raw heap array and defines a custom destructor and copy constructor (deep copy), but no move constructor or move assignment operator. In a hot loop, code does `buffers[i] = createLargeBuffer();` where createLargeBuffer() returns a Buffer by value. What actually happens performance-wise, and why?",
    options: [
      {
        text: "Without a user-declared move assignment operator, the compiler falls back to copy assignment, so each iteration performs a full deep copy of the heap array instead of a cheap pointer swap",
        sub: "Missing move operations silently degrade to copies",
        fix: "",
      },
      {
        text: "The compiler automatically generates a move assignment operator regardless of the user-declared destructor and copy constructor, so this is already efficient",
        sub: "Assumes move operations are always implicitly generated",
        fix:
          "The compiler only implicitly generates move operations when no copy constructor, copy assignment, destructor, or move operation is user-declared; declaring a custom destructor and copy constructor here suppresses implicit move generation entirely, forcing a fallback to copying.",
      },
      {
        text: "This causes a compile error because Buffer has no move constructor",
        sub: "Assumes missing move operations are a hard compile failure",
        fix:
          "Missing move operations don't cause a compile error — the compiler simply falls back to using the available copy constructor and copy assignment operator, which is a silent performance problem, not a build failure.",
      },
      {
        text: "createLargeBuffer()'s return value is leaked because there's no move constructor to claim it",
        sub: "Confuses absent move semantics with a memory leak",
        fix:
          "No leak occurs — the temporary returned by createLargeBuffer() is still properly copied from and then destroyed via Buffer's destructor; the issue is wasted copying performance, not memory safety.",
      },
    ],
    correctIndex: 0,
    proTip:
      "The Rule of Five (or Rule of Zero) exists exactly for this trap: declaring any one of destructor, copy constructor, or copy assignment suppresses the compiler's implicit generation of move operations, so a class can silently lose move semantics and degrade to expensive copies everywhere a move was expected.",
    lesson:
      "When a class declares a custom destructor and copy constructor (typically because it manages a raw resource like a heap array), the compiler does not implicitly generate move constructor or move assignment operator for that class — the special member function generation rules suppress them once any of the 'big five' is user-declared. So `buffers[i] = createLargeBuffer();`, which should ideally move the temporary's heap pointer into buffers[i] (an O(1) pointer swap), instead falls back to the available copy assignment operator, performing a full O(n) deep copy of the underlying array on every iteration of the hot loop. The fix is to explicitly add a move constructor and move assignment operator (or follow the Rule of Five fully) that steal the source's pointer and null it out, avoiding the redundant allocation and copy.",
    remember: "Declaring a destructor or copy constructor suppresses implicit move-operation generation — if you manage a resource manually, follow the Rule of Five explicitly or the Rule of Zero by delegating to RAII members, or you'll silently lose move semantics.",
    interviewAnswer: "Because Buffer declares a custom destructor and copy constructor, the compiler's special member function rules kick in and suppress implicit generation of move constructor and move assignment for that class — declaring any one of the 'Rule of Five' members disables the automatic moves. So when buffers[i] = createLargeBuffer() runs, the compiler can't find a move assignment operator to use and falls back to the copy assignment operator instead, which performs a full deep copy of the heap array on every single iteration of that hot loop — that's a real, often invisible performance bug. The fix is to explicitly implement move constructor and move assignment that just steal the source's pointer and null it out, turning each assignment into an O(1) pointer swap instead of an O(n) copy.",
  },
  {
    id: "q-cpp-vectorrealloc-001",
    subject: "CPP",
    concept: "vector Reallocation Cost",
    difficulty: "medium",
    stem:
      "A function builds a `std::vector<int>` by calling push_back() in a loop 1 million times, starting from a default-constructed empty vector with no reserve() call. A teammate claims this is roughly O(n) overall despite individual push_backs sometimes triggering reallocation and copying all existing elements. Why is the teammate's claim correct?",
    options: [
      {
        text: "vector's growth strategy doubles capacity on reallocation, so the total cost of all copies across the whole sequence sums to a geometric series bounded by O(n), giving amortized O(1) per push_back",
        sub: "Amortized analysis of geometric growth",
        fix: "",
      },
      {
        text: "vector never actually reallocates during push_back; it always has enough hidden capacity",
        sub: "Denies that reallocation happens at all",
        fix:
          "vector absolutely does reallocate when size exceeds capacity — that's an observable, well-documented behavior (and the reason iterators/pointers/references are invalidated on growth); the claim of amortized O(1) accounts for these reallocations, it doesn't deny them.",
      },
      {
        text: "Each individual push_back is O(1) worst-case, so the loop is trivially O(n)",
        sub: "Misstates the worst-case complexity of a single call",
        fix:
          "An individual push_back that triggers reallocation is O(current size) in the worst case, not O(1) — the O(1) figure only holds on average (amortized) across the whole sequence of calls, not for every single call.",
      },
      {
        text: "The compiler optimizes the loop to call reserve(1000000) automatically based on the loop bound",
        sub: "Assumes compiler-inferred capacity reservation",
        fix:
          "Compilers do not analyze loop trip counts to inject reserve() calls into vector's growth logic; this is a runtime data-structure behavior, not something resolved by compiler optimization passes.",
      },
    ],
    correctIndex: 0,
    proTip:
      "Amortized analysis is the right lens for vector growth: most push_backs are O(1) with no reallocation, and the rare reallocations get geometrically less frequent as size grows, so the total work across n insertions sums to O(n), not O(n^2) — but reserve() upfront still avoids the constant-factor cost of repeated copying when n is known ahead of time.",
    lesson:
      "std::vector typically grows by doubling its capacity when push_back() exceeds the current capacity (the exact growth factor is implementation-defined but is geometric, commonly ~2x or ~1.5x). Although a single reallocation copies all existing elements — an O(k) operation when going from capacity k to 2k — these reallocations happen at exponentially increasing intervals (after 1, 2, 4, 8, ... elements), so the total copying work across all n push_backs sums to a geometric series that is O(n), not O(n^2). Dividing total work by n operations gives amortized O(1) per push_back. In practice, though, calling reserve(1000000) upfront when n is known avoids the actual reallocation-and-copy overhead entirely, which matters for real-world performance even though it doesn't change the asymptotic amortized complexity.",
    remember: "vector's doubling growth strategy makes push_back amortized O(1) — the geometric reallocation schedule means total copying across n insertions sums to O(n), not O(n^2) — but reserve() still avoids real reallocation overhead when n is known in advance.",
    interviewAnswer: "The key idea is amortized analysis: vector grows by roughly doubling its capacity each time it needs to reallocate, so reallocations happen at sizes like 1, 2, 4, 8, 16 and so on — exponentially less frequently as the vector grows. Each individual reallocation costs O(current size) because it has to copy every existing element, but because those reallocation points are spaced geometrically, the total copying work summed across all n push_backs works out to a geometric series that's bounded by O(n) overall, not O(n squared). Dividing that total O(n) work by n operations gives you the amortized O(1) per push_back the teammate is describing — though I'd still recommend calling reserve(1000000) upfront here since we know the final size, because it avoids the real reallocation-and-copy cost entirely rather than just keeping it asymptotically bounded.",
  },
  {
    id: "q-cpp-intoverflow-001",
    subject: "CPP",
    concept: "Signed Integer Overflow UB",
    difficulty: "hard",
    stem:
      "A function computes the midpoint of an array range for binary search:\n```cpp\nint mid = (low + high) / 2;\n```\nwhere low and high are both int. A code reviewer flags this as a latent bug even though it 'works in testing.' What's the actual issue?",
    options: [
      {
        text: "If low and high are both large (close to INT_MAX), their sum can overflow a signed int, which is undefined behavior in C++ — not just wraparound, but behavior the compiler is free to assume never happens, potentially breaking optimized builds",
        sub: "Signed overflow is undefined behavior, not wraparound",
        fix: "",
      },
      {
        text: "This is fine in C++ because signed integers wrap around using two's complement, just like unsigned integers",
        sub: "Assumes signed overflow has guaranteed wraparound semantics",
        fix:
          "Unsigned integer overflow has well-defined wraparound semantics in C++, but signed integer overflow is explicitly undefined behavior per the standard — the underlying hardware may use two's complement, but the language does not guarantee that behavior, and optimizing compilers can exploit the UB in surprising ways.",
      },
      {
        text: "The bug is a potential division-by-zero if low + high happens to equal 0",
        sub: "Misidentifies the risk as division by zero",
        fix:
          "Dividing by the literal constant 2 can never be a division by zero regardless of the numerator's value; the actual problem is the addition overflowing before the division even happens.",
      },
      {
        text: "There's no real issue; this pattern is the standard, fully safe way to compute a midpoint in any language",
        sub: "Assumes this is universally safe",
        fix:
          "This is a well-documented historical bug pattern (it shipped in real binary search implementations including a famous JDK bug) — it is safe only when low + high is guaranteed not to overflow, which isn't guaranteed in general.",
      },
    ],
    correctIndex: 0,
    proTip:
      "The fix for this exact bug is well-known: compute the midpoint as `low + (high - low) / 2` instead of `(low + high) / 2` — the subtraction-based form can't overflow when low and high are both valid, non-negative indices within range, because high - low is bounded by the array size.",
    lesson:
      "In C++, signed integer overflow is undefined behavior, not guaranteed two's-complement wraparound (that guarantee applies only to unsigned integers). If low and high are both large enough that low + high exceeds INT_MAX, the addition overflows, and the compiler is permitted to assume this never happens — which can lead to surprising results under optimization, not just an incorrect numeric answer. This exact bug famously existed in real-world binary search implementations (including a widely cited bug in Java's standard library, which uses the same signed-overflow-prone formula) for years before being noticed, precisely because it only manifests with very large index values that don't show up in typical tests. The standard fix is `int mid = low + (high - low) / 2;`, which avoids the overflow-prone addition since high - low is bounded by the valid range size.",
    remember: "Signed integer overflow is undefined behavior in C++, not wraparound — `low + high` can overflow for large indices; prefer `low + (high - low) / 2` for midpoint calculations to avoid the overflow-prone addition.",
    interviewAnswer: "The reviewer is right to flag it — low + high can overflow a signed int if both are large, say both near INT_MAX, and unlike unsigned integers, signed integer overflow in C++ is undefined behavior, not guaranteed wraparound. That distinction matters because an optimizing compiler is allowed to assume signed overflow never happens, which means this isn't just 'you might get a wrong negative number' — the actual runtime behavior under optimization can be genuinely unpredictable. This is also not a hypothetical: this exact formula caused a real, long-standing bug in Java's binary search implementation. The standard fix is to rewrite it as low + (high - low) / 2, since high minus low is bounded by the size of the range and can't overflow the way low plus high can.",
  },
  {
    id: "q-cpp-forwarding-001",
    subject: "CPP",
    concept: "Perfect Forwarding & Universal References",
    difficulty: "hard",
    stem:
      "A wrapper function is meant to forward its argument to an inner function while preserving whether the original argument was an lvalue or rvalue:\n```cpp\ntemplate<typename T>\nvoid wrapper(T&& arg) {\n    inner(arg);\n}\n```\nA teammate says this 'loses' the rvalue-ness of arguments passed to wrapper, causing inner() to always treat arg as an lvalue, and a move that should happen doesn't. Why is this true, and what fixes it?",
    options: [
      {
        text: "Inside wrapper's body, arg is a named variable and therefore always an lvalue expression regardless of what it was bound to; std::forward<T>(arg) is needed to conditionally cast it back to an rvalue when T was deduced from an rvalue argument",
        sub: "Named rvalue references are themselves lvalues — forwarding requires std::forward",
        fix: "",
      },
      {
        text: "T&& always binds only to rvalues, so wrapper can never even be called with an lvalue argument in the first place",
        sub: "Misunderstands T&& as a plain rvalue reference instead of a forwarding reference",
        fix:
          "In a template context with T deduced, T&& is a forwarding (universal) reference that binds to both lvalues and rvalues, deducing T as either Type& or Type respectively — it is not restricted to rvalues the way a fixed Type&& would be in a non-template context.",
      },
      {
        text: "The bug doesn't exist; arg already keeps its rvalue-ness automatically when passed to inner()",
        sub: "Assumes value category propagates automatically through a named parameter",
        fix:
          "Value category does not propagate automatically — any named parameter, even one declared as T&&, is an lvalue expression when used inside the function body; this is precisely why std::forward exists as a tool you must invoke explicitly.",
      },
      {
        text: "Replacing inner(arg) with inner(std::move(arg)) fixes it without needing std::forward",
        sub: "Suggests unconditional move instead of conditional forwarding",
        fix:
          "std::move(arg) unconditionally casts arg to an rvalue, which would incorrectly move from arg even when the original caller passed an lvalue that should be copied, not moved — that breaks correctness for lvalue callers; std::forward<T>(arg) is needed because it conditionally preserves the original value category instead of forcing it to always be an rvalue.",
      },
    ],
    correctIndex: 0,
    proTip:
      "The rule that resolves this whole category of confusion: 'all named rvalue references are lvalues.' T&& is only a forwarding reference in the unevaluated, parameter-declaration sense — the moment you refer to it by name inside the function body, it's an lvalue expression, full stop, which is exactly why std::forward exists.",
    lesson:
      "Inside a function template, `T&& arg` where T is deduced is a forwarding (universal) reference: it binds to lvalues (deducing T as Type&) and rvalues (deducing T as Type) alike, via reference collapsing. However, once inside wrapper's body, the expression `arg` by itself is a named variable, and named variables are always lvalue expressions in C++, regardless of whether the entity they refer to is an lvalue or rvalue reference. So `inner(arg)` always calls the lvalue overload of inner, even if wrapper was originally called with a temporary (rvalue). std::forward<T>(arg) fixes this by using the deduced T to conditionally static_cast arg back to an rvalue reference only when T indicates the original argument was an rvalue, correctly 'forwarding' the original value category through to inner().",
    remember: "A named rvalue reference is itself an lvalue inside the function body — use std::forward<T>(arg) (not std::move, which is unconditional) to preserve the original caller's value category through a forwarding reference.",
    interviewAnswer: "The teammate is right, and the key rule is that a named rvalue reference is itself an lvalue once you're inside the function — so even though T&& correctly deduces as a forwarding reference at the call site and can bind to either an lvalue or an rvalue, the moment you write inner(arg) inside wrapper's body, arg as an expression is always an lvalue, so inner always sees an lvalue overload regardless of what was originally passed in. The fix is std::forward<T>(arg) instead of plain arg — forward uses the deduced T to conditionally cast back to an rvalue only when the original call was with an rvalue, which correctly propagates the value category through. I'd also flag that std::move(arg) is the wrong fix here, because that unconditionally treats arg as an rvalue even when the original caller passed an lvalue, which would incorrectly move from something the caller still needs.",
  },
  {
    id: "q-cpp-diamond-001",
    subject: "CPP",
    concept: "Diamond Problem & Virtual Inheritance",
    difficulty: "hard",
    stem:
      "Classes Reader and Writer both publicly inherit from a common base IOBase, and a class FileHandler publicly inherits from both Reader and Writer (without virtual inheritance). Code does `FileHandler fh; fh.someIOBaseMethod();` where someIOBaseMethod() is defined only in IOBase. What happens?",
    options: [
      {
        text: "Compile error — ambiguous: FileHandler contains two separate IOBase subobjects (one via Reader, one via Writer), so the compiler can't determine which one someIOBaseMethod() should resolve to",
        sub: "The classic diamond problem with non-virtual inheritance",
        fix: "",
      },
      {
        text: "It compiles and calls IOBase's method once, since both paths ultimately lead to the same logical base class",
        sub: "Assumes the compiler deduplicates identical base classes automatically",
        fix:
          "Without `virtual` inheritance, the compiler does not deduplicate the base — FileHandler genuinely contains two distinct IOBase subobjects with separate memory and separate state, which is exactly why the call is ambiguous rather than resolved.",
      },
      {
        text: "It compiles, but someIOBaseMethod() silently picks the Reader path's copy of IOBase by default",
        sub: "Assumes an implicit precedence rule",
        fix:
          "C++ does not have an implicit 'leftmost base wins' rule for ambiguous member lookup through multiple inheritance paths — the compiler flags the ambiguity as an error rather than silently picking one path.",
      },
      {
        text: "This only fails at runtime with a segfault, not at compile time",
        sub: "Misplaces the failure from compile time to runtime",
        fix:
          "Ambiguous base class member access is detected and rejected by the compiler at compile time, before the program can ever run — it never gets the chance to segfault.",
      },
    ],
    correctIndex: 0,
    proTip:
      "The fix for the diamond problem is virtual inheritance: `class Reader : public virtual IOBase` and `class Writer : public virtual IOBase` ensure FileHandler contains exactly one shared IOBase subobject instead of two separate ones, resolving the ambiguity.",
    lesson:
      "When Reader and Writer both inherit from IOBase non-virtually, and FileHandler inherits from both Reader and Writer, FileHandler ends up containing two distinct, separately constructed IOBase subobjects in memory — one through the Reader path and one through the Writer path. Calling fh.someIOBaseMethod() is therefore genuinely ambiguous: the compiler has no way to know whether you mean the IOBase reached via Reader or the one reached via Writer, so it raises a compile-time ambiguity error (this is the classic 'diamond problem'). The standard resolution is virtual inheritance — declaring `class Reader : public virtual IOBase` and `class Writer : public virtual IOBase` — which makes FileHandler share a single IOBase subobject across both paths, so fh.someIOBaseMethod() resolves unambiguously to that one shared instance. Alternatively, the call can be disambiguated explicitly with fh.Reader::someIOBaseMethod() without changing the inheritance model, though that doesn't fix the underlying duplicate-state problem.",
    remember: "Non-virtual diamond inheritance creates duplicate base subobjects, causing ambiguous member access at compile time — fix with `virtual` inheritance on the shared base to merge it into a single subobject.",
    interviewAnswer: "This is the classic diamond inheritance problem: because Reader and Writer both inherit from IOBase non-virtually, FileHandler ends up with two separate, independent IOBase subobjects in its memory layout — one that came through Reader, one through Writer. So when you call fh.someIOBaseMethod(), the compiler genuinely can't tell which of the two copies you mean, and it's a compile-time ambiguity error, not a runtime issue. The standard fix is virtual inheritance: declare Reader and Writer as inheriting `public virtual IOBase`, which tells the compiler to share a single IOBase subobject across both inheritance paths, so FileHandler only has one, and the call resolves unambiguously. You could also disambiguate manually with fh.Reader::someIOBaseMethod() without restructuring the hierarchy, but that's a workaround rather than a real fix for the underlying duplicated-state problem.",
  },
  {
    id: "q-cpp-staticinit-001",
    subject: "CPP",
    concept: "Static Initialization Order Fiasco",
    difficulty: "hard",
    stem:
      "File a.cpp defines `Logger globalLogger;` at namespace scope. File b.cpp defines `Config globalConfig;` at namespace scope, and Config's constructor calls `globalLogger.log(\"initializing\");`. Both are separate translation units. What's the risk, and why can it be intermittent across builds?",
    options: [
      {
        text: "Static Initialization Order Fiasco: C++ does not guarantee initialization order of non-local static objects across different translation units, so globalConfig's constructor might run before globalLogger's, calling log() on an unconstructed object — undefined behavior that can vary by compiler, linker, or even build flags",
        sub: "Cross-TU static initialization order is unspecified",
        fix: "",
      },
      {
        text: "C++ guarantees static objects are initialized in the order their translation units are compiled, so this is always safe as long as a.cpp compiles before b.cpp",
        sub: "Assumes compile order determines initialization order",
        fix:
          "The C++ standard makes no such guarantee — initialization order of non-local statics across different translation units is unspecified, and it is not tied to compile order, file listing order, or alphabetical order of filenames.",
      },
      {
        text: "This is safe because global/namespace-scope variables are zero-initialized before any constructors run, so globalLogger is always in a valid state",
        sub: "Confuses zero-initialization with full construction",
        fix:
          "Zero-initialization happens before dynamic initialization, but a zero-initialized Logger is not the same as a fully constructed one — calling a member function like log() on an object whose constructor hasn't run yet is still undefined behavior, even if its memory happens to be zeroed.",
      },
      {
        text: "Static objects in different translation units are always initialized in reverse order of their destruction, so this code is well-defined by that guarantee",
        sub: "Misapplies the destruction-order guarantee to construction order across TUs",
        fix:
          "C++ does guarantee that static objects are destroyed in the reverse order of their construction, but that's a relationship between each object's own construction and destruction — it says nothing about establishing a defined construction order between two unrelated translation units in the first place.",
      },
    ],
    correctIndex: 0,
    proTip:
      "The standard fix is the 'construct on first use' idiom: replace the global object with a function returning a function-local static reference, e.g. `Logger& globalLogger() { static Logger instance; return instance; }` — function-local statics are guaranteed to be initialized the first time control passes through their declaration, sidestepping cross-TU ordering entirely.",
    lesson:
      "C++ guarantees that non-local static objects within a single translation unit are initialized in the order they're defined in that file, but it makes no guarantee about the relative initialization order of static objects defined in different translation units (a.cpp vs b.cpp here). If globalConfig (in b.cpp) happens to be initialized before globalLogger (in a.cpp) — which depends on link order, compiler internals, or even unrelated build configuration changes — then Config's constructor calls log() on a Logger object that hasn't been constructed yet, which is undefined behavior. This is the well-known 'static initialization order fiasco,' and it's notoriously intermittent because the actual order is an implementation detail that can shift between compiler versions, optimization levels, or simply the order object files are passed to the linker. The standard fix is the construct-on-first-use idiom: wrap each global in a function returning a reference to a function-local static, since C++ does guarantee function-local statics initialize on first use, deterministically resolving the dependency regardless of translation unit.",
    remember: "Initialization order of non-local statics across different translation units is unspecified — the fix is 'construct on first use': wrap globals in functions returning function-local static references instead of plain namespace-scope objects.",
    interviewAnswer: "This is the static initialization order fiasco — C++ only guarantees that static objects within the same translation unit initialize in declaration order, but it makes no promise about the order between globalLogger in a.cpp and globalConfig in b.cpp, since they're in different translation units. So if the linker or compiler happens to initialize globalConfig first, its constructor calls globalLogger.log(), but globalLogger hasn't been constructed yet — that's undefined behavior, and it's notoriously intermittent because the actual order can depend on link order, compiler version, or optimization flags rather than anything in the source code itself. The standard fix is construct-on-first-use: instead of a plain namespace-scope Logger globalLogger, you write a function like Logger& globalLogger() that contains a function-local static Logger instance and returns a reference to it — function-local statics are guaranteed by the standard to initialize the first time execution reaches that line, which sidesteps the cross-translation-unit ordering problem entirely.",
  },
  {
    id: "q-cpp-stdfunction-001",
    subject: "CPP",
    concept: "std::function Overhead",
    difficulty: "medium",
    stem:
      "A hot path in an audio processing loop calls a callback 48,000 times per second, stored as `std::function<void(float)> callback`. Profiling shows this callback invocation is a meaningful chunk of CPU time even though the callback itself is a tiny lambda capturing one float by value. A teammate suggests replacing std::function with a template parameter. Why might that help?",
    options: [
      {
        text: "std::function type-erases its target and typically involves an indirect call through a vtable-like mechanism, plus potential heap allocation for captures that don't fit its small-buffer optimization; a template parameter lets the compiler know the concrete callable type at compile time and often inline the call entirely",
        sub: "Type erasure trades flexibility for indirection and potential allocation overhead",
        fix: "",
      },
      {
        text: "std::function is fundamentally just a function pointer with no extra overhead, so changing to a template would have no measurable effect",
        sub: "Understates std::function's actual implementation cost",
        fix:
          "std::function is considerably heavier than a raw function pointer — it type-erases arbitrary callables (lambdas with captures, functors, etc.) via an internal mechanism similar to virtual dispatch, and can heap-allocate for captures exceeding its small-buffer optimization threshold, both of which add real overhead absent in a plain function pointer or a templated callable.",
      },
      {
        text: "std::function always heap-allocates on every single call, which is why it's slow",
        sub: "Misattributes per-call overhead to allocation on every invocation",
        fix:
          "The potential heap allocation happens once, when the std::function is constructed/assigned with a given callable (and only if the callable doesn't fit small-buffer optimization), not on every single invocation — the slowdown is from the indirect call mechanism on each call, while allocation is a one-time cost at assignment.",
      },
      {
        text: "Templates would make this code slower because templates always increase binary size without runtime benefit",
        sub: "Treats template instantiation cost as purely negative with no runtime upside",
        fix:
          "While templates can increase binary size through instantiation, the claim ignores their primary runtime benefit here: the compiler can see the concrete callable type and potentially inline the call entirely, which directly addresses the profiled overhead — a real runtime upside, not just a size cost.",
      },
    ],
    correctIndex: 0,
    proTip:
      "When a callback is invoked extremely frequently in a hot path, prefer a template parameter (e.g. `template<typename Callback> void process(Callback&& cb)`) over std::function — it lets the compiler see the concrete type and potentially inline the call, eliminating the type-erasure indirection that std::function necessarily introduces.",
    lesson:
      "std::function<void(float)> is a type-erased wrapper that can hold any callable matching its signature — a function pointer, lambda, functor, or bind expression — by storing it behind an internal abstraction, typically implemented with something resembling virtual dispatch to invoke the stored callable indirectly. This indirection means the compiler generally cannot inline through a std::function call, unlike a direct call to a concrete lambda type. Additionally, lambdas with captures that don't fit within std::function's small-buffer optimization (implementation-defined, often a few words) force a heap allocation when the std::function is constructed. In a tight loop running 48,000 times per second, that per-call indirect-dispatch overhead adds up. Replacing `std::function<void(float)> callback` with a template parameter `template<typename Callback> void process(Callback&& cb)` lets the compiler know the lambda's exact type at compile time, generally enabling full inlining of the callback body directly into the loop, eliminating both the indirection and any heap allocation concern.",
    remember: "std::function adds type-erasure overhead (indirect dispatch, possible heap allocation for large captures) that blocks inlining — prefer a template parameter for hot-path callbacks where the concrete type can be known at compile time.",
    interviewAnswer: "The overhead comes from what std::function actually is under the hood — a type-erased wrapper that can hold any callable matching its signature, which means invoking it goes through an indirect call, conceptually similar to a virtual function call, rather than a direct call the compiler can inline. On top of that, if the lambda's captures don't fit within std::function's small-buffer optimization, constructing it triggers a heap allocation. None of that is free when you're calling it 48,000 times a second. Switching to a template parameter — something like template<typename Callback> void process(Callback&& cb) — lets the compiler see the lambda's concrete type at the call site, which usually means it can inline the callback body directly into the loop and eliminate the indirection entirely. The tradeoff is that std::function gives you a stable type you can store in containers or pass across translation unit boundaries, while a template requires the callable type to be visible at compile time, so it's a flexibility-versus-performance tradeoff, and in a 48kHz hot loop, performance usually wins.",
  },
  {
    id: "q-cpp-falsesharing-001",
    subject: "CPP",
    concept: "False Sharing in Multithreaded Code",
    difficulty: "hard",
    stem:
      "Four threads each increment their own dedicated counter in a tight loop:\n```cpp\nstruct Counters { std::atomic<long> count[4]; };\nCounters counters;\n// thread i repeatedly does counters.count[i]++;\n```\nEach thread writes only to its own array slot, with no logical data dependency between threads, yet performance scales poorly as more threads are added — far worse than the embarrassingly parallel workload would suggest. What's happening?",
    options: [
      {
        text: "False sharing — the four counters likely fit within one or two CPU cache lines (64 bytes typically holds eight 8-byte longs), so when one thread writes its counter, it invalidates the cache line for all other cores sharing it, forcing repeated cross-core cache coherence traffic even though there's no real data dependency",
        sub: "Cache-line-level contention despite logically independent data",
        fix: "",
      },
      {
        text: "This is a data race, since multiple threads write to the same Counters struct concurrently",
        sub: "Misidentifies independent atomic writes as a data race",
        fix:
          "There is no data race here — each thread writes to a logically distinct array element via std::atomic, and atomic operations on different memory locations accessed by different threads have well-defined behavior; the slowdown is a performance issue from cache coherence, not a correctness/race issue.",
      },
      {
        text: "std::atomic<long> is implemented with a global mutex internally, so all four threads are serialized regardless of which slot they touch",
        sub: "Assumes atomics are mutex-based rather than typically lock-free",
        fix:
          "On essentially all modern platforms, std::atomic<long> is lock-free (compiles to hardware atomic instructions like LOCK XADD), not implemented via a global mutex — the bottleneck is genuinely about cache line contention between cores, not artificial serialization through a shared lock.",
      },
      {
        text: "The slowdown is from the threads being scheduled on the same CPU core, so they never run in parallel at all",
        sub: "Attributes the issue to scheduling rather than memory layout",
        fix:
          "The scenario doesn't indicate single-core scheduling, and even with proper multi-core scheduling, false sharing would still degrade performance — the bottleneck is the shared cache line bouncing between cores' caches, independent of how threads happen to be scheduled.",
      },
    ],
    correctIndex: 0,
    proTip:
      "The fix for false sharing is padding each contended variable out to its own cache line, often via `alignas(64)` or inserting padding bytes between struct members, so that logically independent data physically lives on separate cache lines and stops triggering cross-core invalidation traffic.",
    lesson:
      "Even though each thread only writes to its own array slot with no logical data dependency, the four std::atomic<long> values in the count array are likely packed contiguously into the same 64-byte CPU cache line (a typical cache line holds eight 8-byte longs). Cache coherence protocols (like MESI) operate at the granularity of a whole cache line, not individual variables: when thread 0 writes count[0], the cache line containing all four counters is invalidated in every other core's cache, forcing those cores to re-fetch the line from a shared cache or memory before their next access — even though threads 1-3 never touch count[0] at all. This is 'false sharing': the sharing is false because there's no real logical dependency, but the hardware still pays the synchronization cost because the data happens to live on the same physical cache line. The fix is to pad each counter to occupy its own cache line, e.g. `struct alignas(64) PaddedCounter { std::atomic<long> value; };` and an array of four PaddedCounters, ensuring each thread's counter lives on a separate cache line with no cross-core invalidation traffic.",
    remember: "False sharing: independent variables packed into the same cache line still trigger cross-core cache invalidation traffic on every write — pad hot, per-thread data to separate cache lines (alignas(64)) to fix it.",
    interviewAnswer: "This is false sharing, and it's a really common gotcha in 'embarrassingly parallel' code. Even though each thread logically only touches its own slot in the counters array, all four std::atomic<long> values are small enough — 8 bytes each — to fit together in a single 64-byte CPU cache line. Cache coherence protocols work at the granularity of a whole cache line, not individual variables, so when thread 0 writes count[0], it invalidates that entire cache line in every other core's cache, even though threads 1 through 3 never touch count[0] — they just get punished by proximity. Each thread ends up generating cross-core cache invalidation traffic on basically every write, which is why performance degrades far more than you'd expect for genuinely independent work. The standard fix is to pad each counter out to its own cache line, typically with alignas(64) on a wrapper struct around each atomic, so the four counters physically live on four separate cache lines and stop interfering with each other at the hardware level.",
  },
];
