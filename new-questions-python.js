export const NEW_PYTHON = [
  {
    id: "q-py-asyncio-block-001",
    subject: "PYTHON",
    concept: "Blocking the asyncio Event Loop",
    difficulty: "hard",
    stem:
      "An async FastAPI endpoint handler does:\n```python\nasync def get_report(report_id: str):\n    data = requests.get(f\"https://internal-api/reports/{report_id}\")\n    return data.json()\n```\nUnder load, the whole server becomes unresponsive — even requests to completely unrelated, fast endpoints start timing out. Why does one slow endpoint stall the entire server, when async is supposed to handle concurrency?",
    options: [
      {
        text: "requests.get() is a synchronous, blocking call; calling it inside an async def function blocks the single-threaded event loop entirely, so no other coroutine — including ones for unrelated endpoints — can run until that call returns",
        sub: "A blocking call inside a coroutine freezes the whole event loop, not just that request",
        fix: "",
      },
      {
        text: "FastAPI runs each request in its own OS thread, so requests.get() shouldn't be able to affect other requests at all",
        sub: "Assumes FastAPI uses thread-per-request by default",
        fix:
          "By default, FastAPI/asyncio runs async def endpoints as coroutines cooperatively scheduled on a single event loop thread, not as one OS thread per request — that's exactly why a blocking call in one coroutine can stall every other coroutine sharing that loop.",
      },
      {
        text: "This is just normal network latency; the server is responsive, it's just waiting on a slow internal API",
        sub: "Dismisses the stall as expected latency rather than a blocking bug",
        fix:
          "Normal network latency would only slow down that one request's response time — it wouldn't cause unrelated, fast endpoints to time out, which is the actual symptom described and the signature of the event loop itself being blocked.",
      },
      {
        text: "The bug is that report_id isn't validated, causing the endpoint to hang on malformed input",
        sub: "Misattributes the stall to input validation",
        fix:
          "Input validation has nothing to do with why unrelated endpoints become unresponsive; the description specifically calls out that the whole server stalls under load, which points to the blocking requests.get() call monopolizing the event loop, not malformed report_id values.",
      },
    ],
    correctIndex: 0,
    proTip:
      "Inside an async def function, never call a synchronous blocking library (requests, time.sleep, a blocking DB driver, file I/O) directly — use an async-native equivalent (httpx.AsyncClient, asyncio.sleep) or, if a sync call is unavoidable, run it in a thread pool via `await asyncio.to_thread(requests.get, url)` so it doesn't occupy the event loop.",
    lesson:
      "asyncio's concurrency model relies on cooperative multitasking on a single thread: coroutines voluntarily yield control back to the event loop at await points, letting other coroutines run while one is waiting on I/O. requests.get() is a synchronous, blocking call — it does not await anything and does not yield control; it occupies the thread for the entire duration of the network round-trip. Calling it inside an async def function means the event loop itself is frozen for that duration, unable to schedule any other coroutine, including ones serving completely unrelated, otherwise-fast endpoints. This is why one slow synchronous call inside an async handler can take down an entire server's responsiveness, not just that one request's latency. The fix is to use an async-native HTTP client like httpx.AsyncClient with `await client.get(...)`, which yields control during the network wait, or to offload the blocking call to a separate thread via `await asyncio.to_thread(requests.get, url)` so the event loop stays free.",
    remember: "A blocking synchronous call inside an async def function freezes the entire single-threaded event loop for everyone, not just that request — always use async-native I/O libraries or asyncio.to_thread() for unavoidable blocking calls.",
    interviewAnswer: "The root cause is that requests.get() is a synchronous, blocking call, and asyncio's whole concurrency model depends on coroutines cooperatively yielding control at await points so the event loop can run other work in the meantime. Because requests.get() doesn't await anything, it just blocks the thread for the full duration of that HTTP round-trip — and since asyncio typically runs on a single thread, that means the entire event loop is frozen, unable to schedule any other coroutine, including completely unrelated fast endpoints. That's exactly why one slow synchronous call inside an async handler can make the whole server look unresponsive under load, not just slow down that one request. The fix is to swap requests for an async-native client like httpx.AsyncClient and properly await the call, or if you're stuck with a synchronous library, wrap it in await asyncio.to_thread(requests.get, url) so it runs on a separate thread and the event loop stays free to serve other requests.",
  },
  {
    id: "q-py-dataclass-mutable-001",
    subject: "PYTHON",
    concept: "Dataclasses and Mutable Field Defaults",
    difficulty: "medium",
    stem:
      "A team defines:\n```python\nfrom dataclasses import dataclass\n\n@dataclass\nclass ShoppingCart:\n    items: list = []\n```\nWhat happens when they try to run this code, and why does the dataclass decorator behave this way?",
    options: [
      {
        text: "It raises a ValueError at class definition time, because dataclasses explicitly forbid mutable default values like list, dict, and set to prevent the shared-mutable-default bug that plain Python functions are prone to",
        sub: "dataclass actively detects and rejects mutable defaults",
        fix: "",
      },
      {
        text: "It runs fine, and every ShoppingCart instance shares the exact same list object as its default items, just like Python's classic mutable default argument pitfall",
        sub: "Assumes dataclass behaves like a plain function default argument with no special handling",
        fix:
          "Unlike plain function default arguments, the dataclass decorator specifically inspects field defaults and raises an error for known mutable types (list, dict, set) at class definition time, precisely because it knows this pattern would otherwise create a shared mutable default across all instances.",
      },
      {
        text: "It runs fine and each instance automatically gets its own independent empty list, because dataclass detects list literals and deep-copies them per instance",
        sub: "Assumes dataclass auto-fixes the problem silently",
        fix:
          "dataclass does not silently fix this for you — it raises an explicit error instead of guessing what you meant, specifically so the bug is caught loudly at definition time rather than masked or silently 'handled' in a way that might surprise you later.",
      },
      {
        text: "It runs fine because type annotations like `list` make Python treat the field as immutable",
        sub: "Confuses type annotations with immutability enforcement",
        fix:
          "Python type annotations are not enforced at runtime and have no effect on mutability — a `list` annotation doesn't make the underlying object immutable, and this misunderstanding doesn't change what dataclass actually does here, which is raise an error.",
      },
    ],
    correctIndex: 0,
    proTip:
      "The dataclass-approved fix is `items: list = field(default_factory=list)` — default_factory tells the dataclass to call list() fresh for every new instance, giving each one its own independent empty list instead of sharing one mutable object.",
    lesson:
      "In ordinary Python, `def f(items=[]):` is a classic bug: the empty list is created once when the function is defined, and every call that doesn't pass its own items shares that same list object, so mutations from one call leak into subsequent calls. The dataclass decorator is aware of this exact pitfall and proactively guards against it: when it sees a field annotated with a known mutable default (a literal list, dict, or set instance as the default value), it raises a ValueError at class definition time rather than silently allowing a class-wide shared mutable default to be created. The correct way to give a dataclass field a fresh mutable default per instance is `items: list = field(default_factory=list)`, where default_factory is a zero-argument callable (list, dict, set, or a custom function) that dataclass invokes fresh for every new instance, guaranteeing each ShoppingCart gets its own independent list.",
    remember: "dataclass raises ValueError on mutable literal defaults (list/dict/set) instead of silently sharing them — use `field(default_factory=list)` to get a fresh mutable object per instance.",
    interviewAnswer: "This actually raises a ValueError as soon as Python processes the class definition, because the dataclass decorator specifically detects mutable default values like list, dict, and set and refuses to let you declare them as a plain default. That's a deliberate safety mechanism: it's preventing the classic Python mutable-default-argument bug, where a value like list() is the same shared object across multiple instances and mutations in one place leak into every other instance. The correct way to write this is items: list = field(default_factory=list), where default_factory is a callable that dataclass invokes fresh for every new instance — so each ShoppingCart actually gets its own independent empty list instead of all of them silently sharing one.",
  },
  {
    id: "q-py-slots-memory-001",
    subject: "PYTHON",
    concept: "__slots__ for Memory Optimization",
    difficulty: "medium",
    stem:
      "A service holds millions of small Point objects in memory (`class Point: def __init__(self, x, y): self.x = x; self.y = y`), and memory usage is a real cost concern at this scale. A teammate suggests adding `__slots__ = ('x', 'y')` to the class. What does this change, and what's the tradeoff?",
    options: [
      {
        text: "Each instance stores x and y in a fixed-size slot layout instead of a per-instance __dict__, meaningfully reducing per-object memory overhead at the cost of losing the ability to dynamically add new attributes to instances at runtime",
        sub: "Slots trade dynamic attribute flexibility for memory savings",
        fix: "",
      },
      {
        text: "__slots__ only affects performance of attribute lookup speed and has no effect on memory usage at all",
        sub: "Denies the memory benefit of __slots__",
        fix:
          "__slots__'s primary, well-documented benefit at scale is exactly memory reduction — by avoiding a per-instance __dict__, it can meaningfully cut memory overhead for classes with many instances; there is a secondary attribute-access speed benefit too, but denying the memory impact misses the main point of the optimization.",
      },
      {
        text: "__slots__ makes instances immutable, so x and y can no longer be reassigned after construction",
        sub: "Confuses __slots__ with immutability",
        fix:
          "__slots__ restricts which attribute names can exist on an instance, but attributes listed in __slots__ remain fully mutable and reassignable — immutability would require something like frozen dataclasses or overriding __setattr__, not __slots__ by itself.",
      },
      {
        text: "__slots__ requires rewriting the class to inherit from a special SlottedObject base class to take effect",
        sub: "Invents an unnecessary base class requirement",
        fix:
          "__slots__ is a plain class attribute that works directly on ordinary classes — no special base class is required; simply declaring `__slots__ = ('x', 'y')` at the class level is sufficient.",
      },
    ],
    correctIndex: 0,
    proTip:
      "__slots__ pays off most clearly when you have many (thousands to millions) instances of a class with a small, fixed set of attributes known in advance — the memory savings per instance are modest individually but compound significantly at scale; it's rarely worth it for classes with few instances or classes that need dynamic attributes.",
    lesson:
      "By default, Python instances store their attributes in a per-instance __dict__, which gives flexibility (you can add new attributes to any instance at any time) but costs memory — a dict has overhead well beyond just the key-value pairs it holds, due to hash table bucket allocation, resizing headroom, and pointer overhead. Declaring `__slots__ = ('x', 'y')` tells Python to allocate a fixed-size, array-like structure for exactly those named attributes instead of giving each instance a __dict__, which can reduce per-instance memory usage substantially — often cited as roughly 40-50% less per object, though the exact figure varies by Python version and attribute count. The tradeoff is that slotted instances can no longer have arbitrary new attributes set on them at runtime (`point.z = 5` raises AttributeError unless z is also declared in __slots__), and certain dynamic patterns (like using __dict__-based monkey-patching, weak references without explicitly adding '__weakref__' to slots, or multiple inheritance from multiple slotted classes) become more restricted. For a use case like millions of simple Point objects with a fixed, known shape, this tradeoff strongly favors __slots__.",
    remember: "__slots__ replaces a per-instance __dict__ with a fixed attribute layout, cutting memory per object substantially at the cost of losing the ability to add arbitrary new attributes dynamically — worth it at scale (many instances, fixed known attributes), not worth it for flexible/few-instance classes.",
    interviewAnswer: "Adding __slots__ = ('x', 'y') changes how instances store their attributes under the hood: normally every instance gets its own __dict__ to hold attributes, which is flexible but has real memory overhead beyond just the data itself, because of how dictionaries allocate hash table space. __slots__ tells Python to skip the per-instance dict entirely and use a fixed, array-like layout for just the named attributes, which meaningfully reduces memory per object — at millions of instances, that adds up to a real, measurable savings. The tradeoff is that you lose dynamic flexibility: you can no longer do point.z = 5 to bolt on a new attribute at runtime unless z is also declared in __slots__, and a few patterns like certain multiple-inheritance combinations or weak references need extra care. For a simple, fixed-shape class like Point held in the millions, that tradeoff is clearly worth it — you know the shape in advance and don't need runtime flexibility.",
  },
  {
    id: "q-py-exception-chain-001",
    subject: "PYTHON",
    concept: "Exception Chaining with raise from",
    difficulty: "medium",
    stem:
      "A function wraps a low-level error in a more meaningful domain-specific one:\n```python\ndef load_user_config(path):\n    try:\n        return json.loads(open(path).read())\n    except json.JSONDecodeError:\n        raise ConfigError(f\"Invalid config at {path}\")\n```\nIn production, this raises ConfigError as expected, but the traceback only shows where ConfigError was raised — the original JSONDecodeError with the actual parse failure details (line, column, bad token) is gone. What should change, and why?",
    options: [
      {
        text: "Use `raise ConfigError(...) from e` (capturing the original exception as e) instead of a bare raise, which sets __cause__ on the new exception and makes Python display both tracebacks chained together",
        sub: "Explicit exception chaining preserves the original traceback",
        fix: "",
      },
      {
        text: "Nothing needs to change; Python automatically preserves the full original traceback information any time a new exception is raised inside an except block",
        sub: "Assumes implicit chaining always shows full original details",
        fix:
          "Python does set an implicit __context__ link when you raise inside an except block without 'from', and modern Python does print 'During handling of the above exception, another exception occurred' — but the question's symptom (original error details missing) suggests either chaining was suppressed/logged incompletely elsewhere, or the explicit `from e` pattern is what's actually needed to make the cause unambiguous and guaranteed rather than relying on implicit context which can be suppressed by `raise ... from None` elsewhere in the codebase or swallowed by logging that only captures the outer exception's str().",
      },
      {
        text: "Catch Exception broadly instead of json.JSONDecodeError specifically, so more error information is captured",
        sub: "Widens the except clause instead of addressing chaining",
        fix:
          "Broadening the except clause changes which errors are caught, not whether the original exception's details are preserved and surfaced when a new one is raised — it doesn't address the actual symptom of missing original error details.",
      },
      {
        text: "Add `traceback.print_exc()` inside the except block before raising ConfigError",
        sub: "Prints immediately rather than attaching context to the raised exception",
        fix:
          "This would print the original traceback to stderr at that moment, but it doesn't attach the original exception to ConfigError itself, so anything downstream that catches and logs ConfigError specifically (e.g., a structured logger capturing just the raised exception object) still loses the connection between the two errors.",
      },
    ],
    correctIndex: 0,
    proTip:
      "`raise NewException(...) from original_exception` is the explicit, guaranteed way to chain exceptions — it sets `__cause__` on the new exception (versus the implicit, suppressible `__context__` link), making the relationship unambiguous to both humans reading the traceback and tools that introspect exception chains programmatically.",
    lesson:
      "When you raise a new exception inside an except block, Python automatically links the new exception's __context__ attribute to the exception being handled, and by default prints both as a chained traceback with 'During handling of the above exception, another exception occurred.' However, this implicit context can be lost or suppressed in various ways — logging code that only captures str(exception) or formats just the outermost exception, code elsewhere using `raise ... from None` to explicitly suppress chaining, or monitoring/error-tracking tools that don't walk the __context__/__cause__ chain. The explicit form `raise ConfigError(f\"Invalid config at {path}\") from e` sets __cause__ directly (a stronger, explicit signal than __context__) and makes the causal relationship part of the exception's own identity rather than relying on it surviving incidentally through the call stack — and code/tools that do introspect __cause__ specifically (many structured loggers and error trackers do) will reliably surface it. The practical fix here is to capture the JSONDecodeError as a named variable (`except json.JSONDecodeError as e:`) and use `from e` so the original parse failure details are guaranteed to be attached to and discoverable from ConfigError.",
    remember: "Use `raise NewError(...) from e` to explicitly chain exceptions via __cause__ — more reliable than relying on implicit __context__, which can be lost by logging tools or suppressed elsewhere with `from None`.",
    interviewAnswer: "The fix is to explicitly chain the exception with `raise ConfigError(f\"Invalid config at {path}\") from e`, capturing the original JSONDecodeError as e in the except clause. Without the explicit from e, Python does still set an implicit __context__ link and will print both exceptions in development, but that implicit link is fragile in production — it can get lost if logging code only captures the string representation of the outermost exception, or if something elsewhere in the codebase uses raise ... from None to intentionally suppress chaining, or if an error-tracking tool only looks at __cause__ and not __context__. Using from e explicitly sets __cause__, which is the stronger, more deliberate signal of 'this exception was caused by that one,' and it's what reliably survives through logging and error-tracking pipelines so the original JSONDecodeError's line, column, and bad token details don't get silently dropped.",
  },
  {
    id: "q-py-multiprocessing-pickle-001",
    subject: "PYTHON",
    concept: "Multiprocessing Pickling Failures",
    difficulty: "hard",
    stem:
      "A script tries to parallelize work using multiprocessing:\n```python\nimport multiprocessing as mp\n\ndef process_item(item, logger):\n    logger.info(f\"processing {item}\")\n    return item * 2\n\nwith mp.Pool(4) as pool:\n    results = pool.starmap(process_item, [(i, my_logger) for i in items])\n```\nThis raises a pickling error mentioning that a lock object (or similar) can't be pickled. Why does passing my_logger to worker processes fail, and what does this reveal about how multiprocessing actually works?",
    options: [
      {
        text: "multiprocessing.Pool workers run in separate OS processes with separate memory spaces, so arguments must be serialized (pickled) to cross the process boundary; many real-world objects like loggers, locks, sockets, and database connections hold OS-level resources or unpicklable internal state and cannot be pickled, so they can't be passed directly to worker functions",
        sub: "Separate processes require pickling, and not everything is picklable",
        fix: "",
      },
      {
        text: "multiprocessing.Pool workers share the same memory space as the parent via threads under the hood, so this should work exactly like passing any object to a regular function call",
        sub: "Confuses multiprocessing with multithreading's shared memory model",
        fix:
          "multiprocessing.Pool, true to its name, spawns separate OS processes, each with its own independent memory space — that's precisely why arguments have to be pickled and sent across a process boundary (e.g. via pipes) rather than just being directly accessible the way they would be with shared-memory threads.",
      },
      {
        text: "The error is unrelated to multiprocessing and is actually caused by the f-string inside logger.info()",
        sub: "Misattributes the failure to string formatting",
        fix:
          "f-string formatting happens entirely inside the worker process after the function and its arguments have already been successfully unpickled — the failure described occurs before that point, at the argument-serialization step, which is specifically about the logger object itself being unpicklable.",
      },
      {
        text: "Pool.starmap silently ignores arguments it can't pickle and just passes None instead, so the real bug is a later TypeError from None being used as a logger",
        sub: "Invents silent argument substitution behavior",
        fix:
          "multiprocessing does not silently substitute None for unpicklable arguments — it raises a pickling error immediately, which is exactly the error described in the scenario, rather than silently swapping in a placeholder and deferring the failure.",
      },
    ],
    correctIndex: 0,
    proTip:
      "The standard fix is to not pass unpicklable objects like loggers across the process boundary at all — instead, create the logger fresh inside each worker process (e.g., via a Pool initializer function, or by calling logging.getLogger(name) inside process_item itself, since loggers are typically retrieved by name and configured once via logging config rather than passed as live objects).",
    lesson:
      "multiprocessing.Pool achieves true parallelism (bypassing Python's GIL) by spawning separate OS-level processes, each with its own independent memory space — unlike threading, where threads share the same process memory and can directly reference the same objects. Because worker processes don't share memory with the parent, any function and its arguments sent to a worker via Pool.map/starmap must be serialized (pickled) in the parent process, sent across a process boundary (typically via an OS pipe), and deserialized (unpickled) in the worker. Most simple objects — numbers, strings, lists, dicts of picklable things — serialize fine, but many real-world objects carry OS-level resources or complex internal state that pickle cannot represent: logging.Logger instances often hold internal lock objects (for thread-safe writes) which are explicitly unpicklable, and similar issues arise with open file handles, network sockets, and database connections. The fix is to avoid passing such objects across the process boundary: instead, create the logger independently inside each worker process — either by calling logging.getLogger(name) at the top of process_item (loggers are typically retrieved by name from a global registry and configured once via logging.config, not passed around as live objects) or by using Pool's initializer parameter to set up per-worker state once when each worker process starts.",
    remember: "multiprocessing workers are separate OS processes with separate memory — all arguments must be pickled across that boundary, and objects holding OS resources or locks (loggers, file handles, sockets, DB connections) typically aren't picklable; create such objects fresh inside each worker instead of passing them in.",
    interviewAnswer: "The core issue is that multiprocessing.Pool spawns genuinely separate OS processes with their own independent memory spaces, not threads sharing memory — so every argument passed to a worker function has to be pickled in the parent process and unpickled in the worker, since there's no shared memory to just reference directly. A logging.Logger instance typically holds an internal lock object to make writes thread-safe, and lock objects are explicitly unpicklable because they represent OS-level synchronization primitives tied to the process that created them, so trying to pickle my_logger to send it across the process boundary fails immediately. The fix is to not pass the logger as an argument at all — instead, call logging.getLogger(name) inside process_item itself to get a logger fresh in each worker process, since Python's logging module is designed around retrieving loggers by name from a global registry rather than passing live logger objects around, and the worker process's logging config can be set up once via Pool's initializer parameter if needed.",
  },
  {
    id: "q-py-fstring-eval-001",
    subject: "PYTHON",
    concept: "f-string Evaluation Timing",
    difficulty: "medium",
    stem:
      "A function logs a value lazily for debugging:\n```python\ndef process(data):\n    log.debug(f\"Processing {expensive_summary(data)}\")\n    return transform(data)\n```\nA teammate points out this calls expensive_summary(data) on every single call to process(), even when the debug log level is disabled and the message is never actually printed. Why does this happen, and how does it differ from how log.debug is 'supposed' to be lazy?",
    options: [
      {
        text: "f-strings are evaluated eagerly at the point they're constructed, regardless of whether the resulting string is ever used — log.debug receives an already-fully-formatted string, so expensive_summary(data) runs every time regardless of the configured log level",
        sub: "f-string interpolation happens before the function call, unconditionally",
        fix: "",
      },
      {
        text: "logging's debug() method is broken and doesn't actually check the log level before formatting the message",
        sub: "Blames the logging module instead of the f-string evaluation timing",
        fix:
          "The logging module does check the effective log level before doing its own internal formatting work when you use its %-style lazy interpolation (log.debug('Processing %s', expensive_summary(data)) still evaluates the argument eagerly too, but log.debug('...%s', arg) with deferred placeholders is the mechanism logging provides) — the actual issue here is that f-strings build the complete string before log.debug is even called, so there's no opportunity for logging's internal level-check to prevent the work from happening in the first place.",
      },
      {
        text: "expensive_summary(data) is being called twice — once for the f-string and once inside log.debug itself",
        sub: "Invents a double-call that doesn't occur",
        fix:
          "expensive_summary(data) is called exactly once, at f-string construction time, before log.debug is ever invoked — there's no second call inside logging itself; the issue is that this single call happens unconditionally, not that it happens redundantly.",
      },
      {
        text: "This only happens in CPython; other Python implementations evaluate f-strings lazily on demand",
        sub: "Misattributes eager evaluation to a CPython-specific quirk",
        fix:
          "f-string evaluation timing (immediate, at the point of construction) is defined by the Python language specification itself (PEP 498), not a CPython implementation detail — any conformant Python implementation evaluates f-string expressions eagerly when the f-string literal is executed.",
      },
    ],
    correctIndex: 0,
    proTip:
      "For expensive debug-only computations, use the logging module's native lazy interpolation instead of an f-string: `log.debug(\"Processing %s\", expensive_summary(data))` still has the same eagerness problem for the argument itself, so the real fix is to guard explicitly with `if log.isEnabledFor(logging.DEBUG): log.debug(f\"Processing {expensive_summary(data)}\")`, ensuring expensive_summary only runs when the message would actually be emitted.",
    lesson:
      "An f-string like f\"Processing {expensive_summary(data)}\" is fully evaluated by the Python interpreter at the moment that expression executes — the curly-brace expression inside it is just regular Python code that runs immediately, producing a complete string object before that string is ever passed anywhere. This means `log.debug(f\"Processing {expensive_summary(data)}\")` always calls expensive_summary(data) first, builds the full string, and only then calls log.debug with that already-built string — log.debug never gets a chance to check 'is debug logging even enabled?' before the expensive work has already happened. This is different from the logging module's traditional %-style lazy interpolation, `log.debug(\"Processing %s\", some_arg)`, where logging internally checks the effective log level before performing the (comparatively cheap) % string formatting — though note even there, if some_arg is itself the result of a function call like expensive_summary(data), that function call still happens eagerly as a Python argument before log.debug is invoked, since Python evaluates function arguments before calling the function. The only way to truly skip expensive_summary(data) when debug logging is disabled is an explicit guard: `if log.isEnabledFor(logging.DEBUG): log.debug(f\"Processing {expensive_summary(data)}\")`.",
    remember: "f-strings evaluate their embedded expressions immediately and unconditionally at construction time — wrapping an expensive call in an f-string passed to log.debug() does not make it lazy; guard with log.isEnabledFor(level) to truly skip the work when the level is disabled.",
    interviewAnswer: "The key thing to understand is that f-strings are evaluated eagerly, immediately, at the point where the f-string literal executes — the expression inside the curly braces is just ordinary Python code that runs right then, producing a complete string before that string goes anywhere else. So in log.debug(f\"Processing {expensive_summary(data)}\"), Python has to fully evaluate expensive_summary(data) and build the complete string first, and only after that does it call log.debug with the finished string — by that point the expensive work has already happened, regardless of whether debug logging is even enabled. This is different from what people often expect from logging's traditional lazy %-style interpolation, where logging checks the log level internally before doing string formatting — though even that doesn't save you here, because expensive_summary(data) as a function call argument would still be evaluated eagerly by Python before log.debug is even invoked, regardless of which style you use. The actual fix is an explicit guard: if log.isEnabledFor(logging.DEBUG): before the log.debug call, so expensive_summary only runs when the message would genuinely be emitted.",
  },
  {
    id: "q-py-walrus-scope-001",
    subject: "PYTHON",
    concept: "Walrus Operator Scoping Pitfalls",
    difficulty: "medium",
    stem:
      "Inside a list comprehension, a developer uses the walrus operator to avoid recomputing a value:\n```python\nresults = [y := f(x), y**2, y**3]\n```\nA teammate is confused why, after this line runs in a function, `y` is accessible as a normal variable in the enclosing function scope — even though list comprehensions normally have their own scope and don't leak loop variables. What's actually going on?",
    options: [
      {
        text: "The walrus operator (:=) is specifically defined to bind its target name in the nearest enclosing scope outside the comprehension, not within the comprehension's own implicit scope — this is explicit, intentional behavior carved out in PEP 572 precisely because comprehensions normally have isolated scopes",
        sub: "Walrus assignment targets deliberately escape the comprehension's scope",
        fix: "",
      },
      {
        text: "This is a bug/inconsistency in CPython; walrus assignments are supposed to stay scoped to the comprehension just like the implicit loop variable in a regular `for y in ...` comprehension",
        sub: "Treats the documented behavior as an unintended implementation bug",
        fix:
          "This is explicitly documented, intentional behavior defined by PEP 572, not a bug — the PEP specifically carves out an exception so that walrus targets bind in the containing scope, distinct from how a comprehension's own implicit `for` variable stays local to the comprehension.",
      },
      {
        text: "y leaks because list comprehensions in Python don't actually have their own scope at all; that's only true for generator expressions",
        sub: "Misstates which comprehensions have isolated scope",
        fix:
          "Since Python 3, all comprehensions — list, set, dict, and generator expressions alike — execute in their own implicit function-like scope, which is exactly why an ordinary `for y in ...` loop variable inside a comprehension does NOT leak; the walrus operator is the specific, deliberate exception to this rule, not evidence that the rule doesn't exist.",
      },
      {
        text: "y only becomes accessible afterward because results itself is a list, and Python automatically promotes list elements to named variables",
        sub: "Invents a nonexistent automatic variable-promotion mechanism",
        fix:
          "Python has no mechanism that promotes list elements into named variables based on their origin — y is accessible afterward specifically and only because of the walrus operator's explicit scoping rule, unrelated to results being a list.",
      },
    ],
    correctIndex: 0,
    proTip:
      "This is a deliberate, documented exception, not an accident — PEP 572 explicitly states that an assignment expression occurring in a comprehension binds in the containing scope, honoring the user's apparent intention to assign to a variable they can use afterward, rather than trapping it inside the comprehension's normally-isolated scope.",
    lesson:
      "Since Python 3.0, comprehensions (list, set, dict) and generator expressions execute in their own implicit, function-like scope — this is why a regular `for y in range(10)` inside a list comprehension does not leak y into the enclosing scope afterward, unlike old-style Python 2 list comprehensions. However, PEP 572 (which introduced the walrus operator := in Python 3.8) carves out an explicit, deliberate exception: an assignment expression's target name binds in the nearest enclosing scope that is not itself a comprehension scope — meaning it skips past the comprehension's isolated scope and lands in the function (or module/class) scope containing the comprehension. This was a conscious design decision: the rationale in the PEP is that someone using := inside a comprehension is clearly expressing an intent to use that value afterward (that's the whole point of using assignment-as-expression), so trapping it inside the comprehension's scope would defeat the purpose. In `results = [y := f(x), y**2, y**3]`, y is therefore bound in the function's own scope and remains accessible as an ordinary local variable after the comprehension finishes executing.",
    remember: "Walrus operator (:=) targets inside a comprehension deliberately bind in the enclosing scope, not the comprehension's own isolated scope — an explicit, documented exception (PEP 572) to the rule that comprehension variables don't leak.",
    interviewAnswer: "This is intentional, documented behavior from PEP 572, not an accident. Since Python 3, comprehensions execute in their own isolated, function-like scope, which is exactly why a normal `for y in range(10)` loop variable inside a list comprehension doesn't leak out afterward. The walrus operator is a deliberate, explicit exception to that rule: PEP 572 specifies that an assignment expression's target binds in the nearest enclosing scope outside the comprehension, not inside the comprehension's own scope. The reasoning given in the PEP is that if you're using := inside a comprehension, you're clearly signaling that you want to use that value afterward — that's the entire point of assignment expressions — so it would defeat the purpose if the value got trapped inside the comprehension's isolated scope the way an ordinary loop variable does. So y := f(x) inside that list comprehension binds y in the surrounding function's scope, and it's accessible as a normal local variable once the comprehension finishes.",
  },
  {
    id: "q-py-type-hints-runtime-001",
    subject: "PYTHON",
    concept: "Type Hints Are Not Enforced at Runtime",
    difficulty: "medium",
    stem:
      "A function is annotated:\n```python\ndef calculate_discount(price: float, percent: int) -> float:\n    return price * (1 - percent / 100)\n```\nA developer calls `calculate_discount(\"99.99\", \"10\")` (passing strings instead of float/int) in production. What actually happens when this runs, and what does that reveal about Python's type hints?",
    options: [
      {
        text: "Python raises a TypeError at runtime, but not because of the type hints — it's from the actual operation `\"10\" / 100`, since str doesn't support division by an int; the type hints themselves are purely documentation/tooling metadata and are not checked or enforced by the Python interpreter at call time",
        sub: "Type hints are unenforced; any failure comes from the real operations performed, not hint-checking",
        fix: "",
      },
      {
        text: "Python raises a TypeError immediately when the function is called, because the arguments don't match the annotated float and int types",
        sub: "Assumes Python performs runtime type checking based on annotations",
        fix:
          "CPython performs no runtime type checking based on annotations — calling a function with arguments that don't match its type hints does not raise any error by itself; whatever happens next depends entirely on whether the function's actual code does something that fails with the given argument types.",
      },
      {
        text: "Python silently and automatically converts \"99.99\" and \"10\" to float and int based on the annotations, so the function returns the correct numeric result",
        sub: "Assumes annotations trigger automatic coercion",
        fix:
          "Type annotations have no runtime coercion behavior in standard Python — the interpreter does not inspect annotations to convert argument types; if the code happens to work it's only because the operations performed (like str * something or str division) coincidentally don't error, not because of any conversion.",
      },
      {
        text: "This raises a SyntaxError because the function signature mixes type hints with default-free positional parameters",
        sub: "Invents a nonexistent syntax restriction",
        fix:
          "There is nothing syntactically wrong with this function definition — type-hinted parameters without defaults are completely standard, valid syntax, and the function defines without any SyntaxError; whatever error occurs happens later, at call time, from the actual arithmetic.",
      },
    ],
    correctIndex: 0,
    proTip:
      "Type hints in standard Python are purely for static analysis tools (mypy, pyright), IDEs, and human readers — they are not checked or enforced by the CPython interpreter at runtime; to actually validate types at runtime, you need an explicit check, an assertion, or a library like pydantic that performs real runtime validation/coercion based on annotations.",
    lesson:
      "Python's type hints (PEP 484 and friends) are a purely optional, advisory annotation system: the standard CPython interpreter parses and stores them (accessible via __annotations__) but never inspects them to validate, coerce, or reject function arguments at call time. Calling calculate_discount(\"99.99\", \"10\") does not raise any error due to the float/int annotations being violated — Python simply proceeds to execute the function body with whatever objects were actually passed. What happens next depends entirely on whether the function's actual operations succeed with those types: `percent / 100` becomes `\"10\" / 100`, and since the str type does not define division by an int, this raises a genuine TypeError — but that error comes from Python's normal dynamic operator dispatch failing, not from any type-hint enforcement mechanism. If the function's body happened not to perform any operation that's incompatible with strings (or if it used operations that strings do support, like + for concatenation), it would run to completion without error despite completely violating its own type hints. This is exactly why static type checkers like mypy exist — they analyze the annotations at development time, before the code ever runs, to catch this class of mismatch that the runtime itself will never catch on its own. For runtime validation/coercion, you need an explicit library like pydantic, or to write manual isinstance checks.",
    remember: "Python type hints are not enforced or checked at runtime by the standard interpreter — they're metadata for tools like mypy/pyright and human readers; any runtime error from a type mismatch comes from the actual operation performed, not from hint violation itself.",
    interviewAnswer: "This call doesn't fail because of the type hints at all — Python's standard interpreter never checks annotations against the actual arguments passed at call time; type hints are purely advisory metadata meant for static analysis tools like mypy and for IDEs and human readers. What does happen is that the function body executes with the actual string arguments, and percent / 100 becomes \"10\" / 100 — and since strings don't support division by an integer, that line raises a genuine TypeError, but that's Python's normal dynamic type dispatch failing on an unsupported operation, completely independent of the float and int annotations on the function signature. It's actually a good illustration of why these hints exist as a development-time tool rather than a runtime guarantee — a static type checker run against this code before deployment would have flagged the string arguments as incompatible immediately, but the standard Python runtime itself provides zero protection here; if you need actual runtime validation, you'd reach for something like pydantic or explicit isinstance checks.",
  },
  {
    id: "q-py-mutable-classattr-001",
    subject: "PYTHON",
    concept: "Mutable Class Attributes Shared Across Instances",
    difficulty: "medium",
    stem:
      "A class tracks tags per instance:\n```python\nclass Task:\n    tags = []\n\n    def add_tag(self, tag):\n        self.tags.append(tag)\n\nt1 = Task()\nt2 = Task()\nt1.add_tag(\"urgent\")\nprint(t2.tags)\n```\nWhat does this print, and why does modifying t1 affect t2?",
    options: [
      {
        text: "['urgent'] — tags is defined at the class level (not inside __init__), so it's a single list object shared by the class itself and accessed by every instance through attribute lookup, and self.tags.append() mutates that one shared list in place rather than creating a new per-instance list",
        sub: "Class-level mutable attributes are shared across all instances",
        fix: "",
      },
      {
        text: "[] — each instance automatically gets its own independent copy of tags the moment it's created, so t2 is unaffected by changes to t1",
        sub: "Assumes class attributes are copied per instance automatically",
        fix:
          "Python does not copy class attributes into each instance automatically; t1.tags and t2.tags both resolve, via normal attribute lookup, to the exact same list object that lives on the Task class itself — there is no implicit per-instance copying happening here.",
      },
      {
        text: "This raises an AttributeError because tags was never explicitly initialized inside __init__",
        sub: "Assumes class-level attributes without __init__ aren't valid",
        fix:
          "Class-level attributes are completely valid in Python and don't require __init__ to exist — tags = [] at the class body level creates a real attribute accessible to all instances via normal lookup, with no AttributeError involved.",
      },
      {
        text: "['urgent'] is printed, but only because t1 and t2 are actually the same object due to how Task() works",
        sub: "Misattributes the sharing to instance identity rather than attribute lookup",
        fix:
          "t1 and t2 are genuinely two separate Task instances (t1 is not t2 evaluates to False is wrong — they are distinct objects); the sharing isn't because they're the same instance, it's because both instances' attribute lookups for 'tags' fall through to the same single class-level list object, since neither instance has its own tags entry in its instance __dict__.",
      },
    ],
    correctIndex: 0,
    proTip:
      "The fix is to initialize mutable attributes inside __init__ instead of at the class body level: `def __init__(self): self.tags = []` creates a fresh list in each instance's own __dict__, so instance attribute lookup finds the per-instance list before ever falling back to the class attribute.",
    lesson:
      "`tags = []` written directly inside the class body (not inside a method) creates a class attribute — a single list object that belongs to the Task class itself, created exactly once when the class statement executes. When you access self.tags on an instance, Python's attribute lookup first checks the instance's own __dict__; if nothing is found there (which is the case here, since neither t1 nor t2 has ever had `self.tags = something` executed for them), it falls back to looking in the class's __dict__ and finds the shared list. Critically, self.tags.append(tag) does not assign to self.tags (which would create a new instance attribute) — it calls .append() on whatever object self.tags currently resolves to, which is the shared class-level list, mutating it in place. Since t1 and t2 both fall back to that same shared list for lookups, t1.add_tag(\"urgent\") mutates the one list both instances see, so t2.tags prints ['urgent'] even though add_tag was never called on t2. The fix is to initialize tags inside __init__: `def __init__(self): self.tags = []`, which creates a genuinely separate list in each instance's own __dict__ the moment that instance is constructed, so instance-level lookup finds the per-instance list immediately and never falls through to the shared class attribute.",
    remember: "Mutable values (list/dict/set) assigned directly in the class body are shared by all instances via attribute lookup fallback — initialize mutable attributes inside __init__ as self.attr = [] to give each instance its own independent object.",
    interviewAnswer: "This prints ['urgent'], and it's a really common gotcha. Because tags = [] is written directly in the class body rather than inside __init__, it's a class attribute — one single list object that belongs to the Task class itself, created once when the class is defined. When you write self.tags inside a method, Python looks first in the instance's own __dict__, and since neither t1 nor t2 has ever had self.tags assigned directly, that lookup falls through to the class's __dict__ and finds that one shared list. The key detail is that self.tags.append(tag) doesn't assign a new value to self.tags — it just calls .append() on whatever object self.tags currently resolves to, which is that single shared class-level list, mutating it in place. So both t1 and t2, which both fall back to the same shared list, see the mutation. The fix is to move the initialization into __init__ — self.tags = [] there creates a genuinely separate list in each instance's own __dict__ as soon as that instance is constructed, so the per-instance list is found immediately and the shared class attribute is never touched.",
  },
  {
    id: "q-py-weakref-cache-001",
    subject: "PYTHON",
    concept: "Weak References to Avoid Memory Leaks in Caches",
    difficulty: "hard",
    stem:
      "A service keeps a global cache mapping expensive-to-construct Session objects to metadata: `_session_cache = {}` where keys are live Session objects. Even after callers are done with a Session and drop all their own references to it, memory usage keeps climbing — Session objects are never garbage collected. Why, and what's the idiomatic fix?",
    options: [
      {
        text: "A regular dict holds a strong reference to each key, so as long as a Session object is a key in _session_cache, its reference count never reaches zero and it can never be garbage collected — the fix is to use weakref.WeakKeyDictionary, which holds keys via weak references that don't prevent garbage collection and automatically removes entries once the referenced object is collected",
        sub: "Plain dicts create strong references that prevent garbage collection",
        fix: "",
      },
      {
        text: "Python's garbage collector doesn't run automatically for objects used as dict keys, so the fix is to call gc.collect() periodically",
        sub: "Misdiagnoses the issue as a GC scheduling problem rather than reference counting",
        fix:
          "CPython's garbage collector (both reference counting and the generational cycle collector) runs automatically regardless of whether an object is used as a dict key — the issue isn't that collection isn't happening, it's that a strong reference from the cache dict genuinely keeps the reference count above zero, so there's nothing eligible to collect in the first place; calling gc.collect() wouldn't free a Session still referenced as a live dict key.",
      },
      {
        text: "Session objects are leaking because dict keys must be hashable, and Python keeps a permanent reference to any object once it's been hashed",
        sub: "Conflates hashability with reference retention",
        fix:
          "Hashability is just a requirement for usability as a dict key (the object needs __hash__) and has nothing to do with reference lifetime — Python does not retain a permanent reference to an object merely because __hash__ was called on it at some point; the actual cause is the dict's own ongoing strong reference to the key for as long as that entry exists.",
      },
      {
        text: "This is expected and unavoidable; any object used as a dict key will never be garbage collected for the lifetime of the program",
        sub: "Overgeneralizes the leak as permanent and unfixable",
        fix:
          "This is absolutely fixable — it's exactly the problem weakref.WeakKeyDictionary exists to solve; the leak isn't an inherent, permanent property of using objects as dict keys, it's specifically caused by ordinary dict's strong-reference semantics, which has a well-established alternative.",
      },
    ],
    correctIndex: 0,
    proTip:
      "weakref.WeakKeyDictionary (and WeakValueDictionary for the values-side equivalent) is purpose-built for exactly this cache pattern — it lets a dict-like structure track metadata about objects without being the thing that keeps those objects alive, and it automatically prunes entries once their referenced object is actually garbage collected elsewhere.",
    lesson:
      "In CPython, an object is eligible for garbage collection once its reference count drops to zero (with a supplementary cycle collector for reference cycles). A regular dict holds strong references to both its keys and values — as long as a Session object remains a key in _session_cache, the dict itself counts as one of the references keeping that object alive, so even if every caller drops their own reference to a Session, the cache's reference alone keeps the count above zero, and the Session is never collected. This is a classic, easy-to-miss memory leak pattern in long-running services: a cache meant to be a passive, non-owning observer of objects ends up being the very thing that pins them in memory forever. The idiomatic fix is weakref.WeakKeyDictionary, a dict-like structure from the standard library's weakref module that holds its keys via weak references — references that do not increment the reference count and therefore do not prevent garbage collection. When a Session's last strong reference elsewhere in the program is dropped, the object becomes eligible for collection despite still being 'in' the WeakKeyDictionary, and the weak dictionary automatically removes the corresponding entry once the object is actually collected, so the cache never artificially keeps objects alive nor accumulates stale entries for objects that no longer exist.",
    remember: "A regular dict holds strong references to its keys, which can prevent garbage collection and leak memory if the dict outlives the logical need for those objects — use weakref.WeakKeyDictionary (or WeakValueDictionary) for caches that should observe objects without keeping them alive.",
    interviewAnswer: "The leak happens because a regular dict holds a strong reference to every key it contains, and as long as a Session object is a key in _session_cache, that's one more reference keeping its reference count above zero — so even after every caller drops their own reference to a Session, the cache's own internal reference alone is enough to keep it alive indefinitely and prevent garbage collection. It's a really common trap: a cache that's meant to passively track metadata about objects ends up being the thing that pins those objects in memory forever, since dict ownership semantics are strong by default. The idiomatic fix is weakref.WeakKeyDictionary from the standard library — it's a dict-like structure that holds its keys via weak references, which don't count toward an object's reference count and therefore don't block garbage collection. Once a Session's last real reference elsewhere is dropped, it becomes eligible for collection even though it's technically still 'in' the weak dictionary, and the dictionary automatically prunes that entry once the object is actually collected — so you get the caching behavior you want without it secretly becoming a memory leak.",
  },
];
