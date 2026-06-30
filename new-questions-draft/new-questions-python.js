export const NEW_PYTHON = [
  {
    id: "q-py-asyncio-block-001",
    subject: "PYTHON",
    concept: "Blocking the asyncio Event Loop",
    difficulty: "hard",
    stem:
      "Your FastAPI service handles 200 req/s comfortably until one endpoint starts calling a third-party pricing API:\n```python\n@app.get(\"/price\")\nasync def get_price(sku: str):\n    resp = requests.get(f\"https://pricing.example/{sku}\")\n    return {\"price\": resp.json()[\"price\"]}\n```\nAfter deploy, p99 latency across ALL endpoints (not just /price) spikes whenever pricing calls are slow, even unrelated endpoints with no shared resources. Why?",
    options: [
      {
        text: "requests.get is a blocking synchronous call, and it freezes the single-threaded event loop, so no other coroutine — on any endpoint — can run until it returns",
        sub: "Sync I/O inside an async def blocks the whole loop",
        fix: "",
      },
      {
        text: "FastAPI shares one global request queue, so a slow /price request blocks other requests from being dequeued",
        sub: "Invents a queueing mechanism that isn't how the event loop works",
        fix: "There's no shared request queue at the application layer — the actual mechanism is that requests.get() never yields control back to the event loop, so it can't schedule any other coroutine, including ones for unrelated endpoints.",
      },
      {
        text: "The third-party API is rate-limiting the whole server's IP, slowing down all outbound calls",
        sub: "Blames an external network effect instead of the code",
        fix: "Rate-limiting would cause failures or 429s on calls TO that API specifically, not latency on unrelated endpoints that never talk to the pricing service at all.",
      },
      {
        text: "Python's GIL prevents any two requests from being processed in parallel regardless of how the code is written",
        sub: "Conflates GIL with event-loop scheduling",
        fix: "The GIL allows cooperative async concurrency just fine — many coroutines interleave on one thread under the GIL. The problem here is specifically that requests.get() never hands control back, not that the GIL forbids parallelism.",
      },
    ],
    correctIndex: 0,
    proTip:
      "If a function doesn't have 'await' in front of an I/O call, assume it blocks the event loop until proven otherwise. Swap requests for httpx.AsyncClient, or run the blocking call in a thread pool via asyncio.to_thread().",
    lesson:
      "asyncio runs all coroutines on a single thread, cooperatively switching between them only at 'await' points. A regular blocking call like requests.get() has no await — it runs to completion before yielding, so the entire event loop, and every other in-flight request, is frozen for that duration.",
    remember:
      "In an async app, one sync blocking call doesn't just slow its own request — it freezes the entire single-threaded event loop for everyone.",
    interviewAnswer:
      "The bug is that requests.get() is a synchronous, blocking call sitting inside an async def function. asyncio's whole concurrency model depends on coroutines voluntarily yielding control at await points — that's how it interleaves hundreds of in-flight requests on one thread. requests.get() never awaits anything; it just blocks the thread until the HTTP call returns. Since there's only one thread running the event loop, nothing else — no other coroutine, no other endpoint's handler — can make progress during that window. The fix is to use an async-native HTTP client like httpx.AsyncClient with await, or if you're stuck with a sync library, push it off the event loop with await asyncio.to_thread(requests.get, url).",
  },
  {
    id: "q-py-dataclass-mutable-001",
    subject: "PYTHON",
    concept: "Dataclasses and Mutable Field Defaults",
    difficulty: "medium",
    stem:
      "A teammate refactors a plain class into a dataclass for brevity:\n```python\n@dataclass\nclass Cart:\n    user_id: int\n    items: list = []\n```\nThe app immediately crashes at import time. What happens?",
    options: [
      {
        text: "ValueError is raised at class definition time because dataclasses forbid mutable default values for fields like list, dict, and set",
        sub: "",
        fix: "",
      },
      {
        text: "It imports fine, but every Cart instance silently shares the same items list, just like the classic mutable-default-argument bug",
        sub: "Correct underlying bug, wrong outcome for dataclasses specifically",
        fix: "Plain functions would indeed silently share a mutable default, but @dataclass explicitly checks for unhashable mutable defaults like list/dict/set and raises ValueError at class-definition time instead of allowing the silent-sharing footgun.",
      },
      {
        text: "TypeError is raised every time you instantiate Cart(), because items has no type-compatible default factory",
        sub: "Wrong timing — error happens at class definition, not instantiation",
        fix: "The error fires immediately when the class body is executed (i.e., at import/definition time), not later when you call Cart(...) — dataclasses validate field defaults while building the generated __init__.",
      },
      {
        text: "Nothing crashes; dataclasses automatically convert mutable literal defaults into default_factory calls behind the scenes",
        sub: "Assumes implicit magic that dataclasses don't perform",
        fix: "Dataclasses do not auto-convert your defaults — you must explicitly opt in with field(default_factory=list). Without it, a mutable default is treated as an error, not silently fixed.",
      },
    ],
    correctIndex: 0,
    proTip:
      "Use field(default_factory=list) (or dict, or set) for any mutable default in a dataclass — it's a one-line fix and the dataclass machinery calls the factory fresh per instance.",
    lesson:
      "Dataclasses generate __init__ for you, and the authors anticipated the classic mutable-default-argument trap. Rather than let every instance silently share one list object, the dataclass decorator inspects field defaults and raises ValueError for known-mutable types, forcing you to use default_factory instead.",
    remember:
      "@dataclass refuses mutable literal defaults outright (ValueError at definition time) instead of letting instances silently share state — use field(default_factory=list).",
    interviewAnswer:
      "This crashes immediately when Python processes the class body, with a ValueError saying mutable default <class 'list'> is not allowed. Dataclasses are aware of the classic Python gotcha where a mutable default argument gets created once and shared across all calls — so rather than let that bug slip into your data model silently, the dataclass decorator proactively detects list, dict, and set defaults and refuses to generate the class. The fix is items: list = field(default_factory=list), which tells dataclass to call list() fresh for every new instance instead of reusing one shared object.",
  },
  {
    id: "q-py-slots-memory-001",
    subject: "PYTHON",
    concept: "__slots__ for Memory Optimization",
    difficulty: "medium",
    stem:
      "A data pipeline creates ~20 million small Point objects and the process is hitting memory limits:\n```python\nclass Point:\n    def __init__(self, x, y):\n        self.x = x\n        self.y = y\n```\nA senior engineer suggests adding `__slots__ = (\"x\", \"y\")` to the class. Why would this meaningfully reduce memory usage here?",
    options: [
      {
        text: "Without __slots__, each instance carries a per-object __dict__ to store attributes; __slots__ replaces that dict with fixed-size slots, cutting per-instance overhead substantially at this scale",
        sub: "",
        fix: "",
      },
      {
        text: "__slots__ makes Python store x and y as C-level primitive ints instead of boxed PyObject values, shrinking each attribute",
        sub: "Misattributes the savings to attribute storage type rather than removing __dict__",
        fix: "__slots__ doesn't change how the values themselves are represented (they're still regular Python objects) — the savings come entirely from eliminating the per-instance __dict__ that would otherwise hold those attributes.",
      },
      {
        text: "__slots__ deduplicates identical Point instances so repeated coordinates only consume memory once",
        sub: "Confuses slots with interning/caching behavior",
        fix: "__slots__ has nothing to do with deduplication or interning — every Point() call still creates a fully distinct object; it only changes how that single object's attributes are stored internally.",
      },
      {
        text: "__slots__ moves instance creation from the heap to the stack, avoiding heap allocation overhead per object",
        sub: "Misunderstands Python's memory model",
        fix: "All Python objects, slots or not, are heap-allocated — Python doesn't expose stack allocation for objects. The savings are from a smaller per-object layout (no __dict__), not a different allocation arena.",
      },
    ],
    correctIndex: 0,
    proTip:
      "__slots__ typically saves 40-50% per instance for small attribute-heavy classes because it eliminates the ~104+ byte __dict__ overhead per object — multiply that by 20 million and it's gigabytes, not bytes.",
    lesson:
      "By default, every instance gets its own __dict__ so attributes can be added dynamically at runtime — flexible, but expensive at scale. Declaring __slots__ tells Python to allocate a fixed, dict-free layout for exactly the named attributes, trading dynamic flexibility (no arbitrary new attributes, no per-instance __dict__) for substantially lower per-object memory.",
    remember:
      "__slots__ saves memory by removing each instance's __dict__, not by changing how attribute values themselves are stored.",
    interviewAnswer:
      "Normally every instance of a class gets its own __dict__ to hold its attributes, which is what lets you do something like point.z = 5 even though z was never declared — that flexibility costs memory, roughly 100+ bytes of dict overhead per instance on top of the actual data. When you declare __slots__ = ('x', 'y'), Python skips creating that per-instance __dict__ entirely and instead gives each instance a fixed, compact layout sized exactly for x and y. At 20 million instances, eliminating that dict overhead per object adds up to real gigabytes of savings. The tradeoff is you lose the ability to dynamically add new attributes that aren't in the slots list, and you can't easily mix __slots__ with multiple inheritance from other slotted classes.",
  },
  {
    id: "q-py-exception-chain-001",
    subject: "PYTHON",
    concept: "Exception Chaining with raise from",
    difficulty: "medium",
    stem:
      "A teammate is debugging a confusing traceback from this code and asks why it's so hard to find the real cause:\n```python\ndef load_config(path):\n    try:\n        with open(path) as f:\n            return json.load(f)\n    except json.JSONDecodeError:\n        raise ValueError(\"Config file is invalid\")\n```\nThe traceback shows ValueError: Config file is invalid but gives no hint about what was actually malformed in the JSON. What's the cleanest fix?",
    options: [
      {
        text: "Replace the raise with `raise ValueError(\"Config file is invalid\") from e`, which preserves the original JSONDecodeError in the traceback as the explicit cause",
        sub: "",
        fix: "",
      },
      {
        text: "Nothing needs to change — Python automatically chains exceptions raised inside an except block, so the JSONDecodeError details are already in the traceback",
        sub: "Confuses implicit chaining with what actually gets displayed",
        fix: "Python does set __context__ implicitly here, and a full traceback would normally show 'During handling of the above exception, another exception occurred' — but many logging setups, error trackers, or re-raises elsewhere can suppress or strip __context__, and being explicit with 'from e' makes the cause field guaranteed and self-documenting rather than implicit.",
      },
      {
        text: "Catch Exception instead of json.JSONDecodeError so that all possible errors are captured with full detail",
        sub: "Widens the catch but doesn't address chaining or detail loss",
        fix: "Catching a broader exception type doesn't add any information to the raised ValueError — the original error's message and traceback are still discarded unless you explicitly chain or include them.",
      },
      {
        text: "Use `raise ValueError(\"Config file is invalid\") from None` to fully suppress the original exception and keep the traceback clean",
        sub: "Suppresses the very information needed for debugging",
        fix: "'from None' explicitly disables exception chaining, hiding the original JSONDecodeError entirely — that's the opposite of what's needed when the goal is to see what was actually malformed.",
      },
    ],
    correctIndex: 0,
    proTip:
      "`raise X from e` sets __cause__ explicitly and prints 'The above exception was the direct cause of the following exception' — it's the difference between an accidental, suppressible context and a guaranteed, intentional one.",
    lesson:
      "When you raise a new exception inside an except block, Python implicitly chains the original as __context__, but tooling and intermediate re-raises can obscure it. Explicit chaining with `raise ... from e` sets __cause__ directly, guaranteeing the original exception (and its message, like which JSON key or line failed to parse) stays visible in any traceback or error report.",
    remember:
      "`raise NewError(...) from original_error` guarantees the root cause survives in the traceback — don't rely on implicit __context__ chaining alone for debuggability.",
    interviewAnswer:
      "The core issue is that the original JSONDecodeError — which would actually say something like 'Expecting property name enclosed in double quotes: line 4 column 1' — gets discarded when we raise a fresh ValueError with just a generic message. Even though Python implicitly tracks the original as __context__, that detail isn't guaranteed to survive logging pipelines or re-raises elsewhere, and it's not part of the exception's own data. The fix is explicit chaining: catch it as `except json.JSONDecodeError as e` and then `raise ValueError(\"Config file is invalid\") from e`. That sets __cause__ explicitly, so any traceback, logger, or error tracker shows both exceptions and you can immediately see the actual JSON parsing failure instead of just the generic wrapper message.",
  },
  {
    id: "q-py-multiprocessing-pickle-001",
    subject: "PYTHON",
    concept: "Multiprocessing Pickling Failures",
    difficulty: "hard",
    stem:
      "A batch job processes images in parallel and works fine locally but crashes in CI:\n```python\nclass ImageProcessor:\n    def __init__(self, db_conn):\n        self.db_conn = db_conn\n\n    def process(self, path):\n        return resize(path)\n\nprocessor = ImageProcessor(get_db_connection())\nwith multiprocessing.Pool(4) as pool:\n    results = pool.map(processor.process, image_paths)\n```\nIt fails with `TypeError: cannot pickle '_thread.lock' object` (or similar) before any image is processed. What's going on?",
    options: [
      {
        text: "multiprocessing.Pool sends work to separate processes by pickling the callable and its arguments, and the bound method processor.process drags along the whole ImageProcessor instance — including db_conn, which holds an unpicklable lock/socket",
        sub: "",
        fix: "",
      },
      {
        text: "pool.map is single-threaded by default and the error is unrelated — it's actually the db_conn timing out under load",
        sub: "Misidentifies the error type and the mechanism entirely",
        fix: "Pool(4) explicitly creates 4 worker processes, and the TypeError is a pickling error raised before any work happens, not a runtime timeout — db_conn never gets the chance to be used in a worker because the task can't even be serialized to send there.",
      },
      {
        text: "Python's GIL prevents the same database connection from being shared across multiple processes, raising this error as a safety check",
        sub: "Conflates the GIL (a threading concept) with a multiprocessing/serialization issue",
        fix: "The GIL only governs threads within a single process and is irrelevant to separate processes; this is purely a pickling/serialization failure when multiprocessing tries to transfer the task object to worker processes via inter-process communication.",
      },
      {
        text: "image_paths contains objects that aren't valid file paths, causing resize() to throw and multiprocessing to mis-report it as a pickle error",
        sub: "Misattributes a pickling failure to the task's data payload",
        fix: "The error happens during serialization of the task itself, before resize() ever runs in a worker — it's about whether processor.process (and the object it's bound to) can be pickled, not about the contents of image_paths.",
      },
    ],
    correctIndex: 0,
    proTip:
      "multiprocessing.Pool ships work to worker processes over IPC by pickling it — any callable you pass must be picklable along with everything it closes over. Bound methods pickle the whole `self`, so keep instances passed to workers lean, or use a module-level function plus pass only picklable data.",
    lesson:
      "Unlike threading, separate processes don't share memory, so multiprocessing.Pool serializes (pickles) the function and arguments to send across process boundaries. processor.process is a bound method, so pickling it requires pickling processor itself, including db_conn — and database connections typically hold OS-level resources like sockets or locks that simply cannot be pickled.",
    remember:
      "multiprocessing.Pool pickles whatever you hand it — a bound method pickles its entire instance, so unpicklable attributes like open DB connections or locks blow up before any work runs.",
    interviewAnswer:
      "The traceback is happening before any actual image processing because Pool.map has to pickle the task it's sending to a worker process — and processor.process is a bound method, which means pickling it requires pickling the entire processor object it's bound to, including self.db_conn. Database connections wrap OS-level resources like sockets and internal locks, and those simply can't be serialized — hence 'cannot pickle _thread.lock object'. This works locally only by coincidence of timing or maybe a different pool size; the real fix is to avoid shipping live connections across process boundaries — either open the DB connection inside each worker process (e.g., in a Pool initializer), or refactor process() into a plain function that takes a path and returns a result with no stateful object attached.",
  },
  {
    id: "q-py-fstring-eval-001",
    subject: "PYTHON",
    concept: "f-string Evaluation Timing",
    difficulty: "medium",
    stem:
      "A logging helper is supposed to lazily build expensive debug messages only when DEBUG logging is enabled:\n```python\nlogger.debug(f\"User snapshot: {build_expensive_snapshot(user)}\")\n```\nProfiling shows build_expensive_snapshot() runs on every request, even in production where the logger level is set to WARNING and the debug line never actually gets logged. Why?",
    options: [
      {
        text: "f-strings are evaluated immediately at the point they're constructed, regardless of what happens to the resulting string afterward — so build_expensive_snapshot(user) runs before logger.debug even decides whether to log anything",
        sub: "",
        fix: "",
      },
      {
        text: "logger.debug() always executes its arguments fully and only suppresses the print step, which is a logging library limitation rather than an f-string issue",
        sub: "Misplaces the cause on the logging call instead of the f-string itself",
        fix: "The logging module is specifically designed to support lazy formatting via %-style args (logger.debug('msg %s', expr)), where expr is only evaluated if the log level is active — the actual problem is that an f-string forces eager evaluation before logger.debug is even called, bypassing that laziness entirely.",
      },
      {
        text: "build_expensive_snapshot(user) is being called twice — once to build the f-string and once internally by the logging module to validate the message",
        sub: "Invents a double-evaluation mechanism that doesn't exist",
        fix: "There's no double evaluation here — the function runs exactly once, at f-string construction time, which already happens before logger.debug can check the active log level. The bug isn't redundant calls, it's premature timing.",
      },
      {
        text: "The logger level check (DEBUG vs WARNING) happens asynchronously, so by the time it's evaluated, the snapshot function has already started running on another thread",
        sub: "Invents async/threading behavior the code doesn't exhibit",
        fix: "logger.debug() is a synchronous call with no threading involved here — the level check and any potential suppression happen in plain sequential Python, with no race condition needed to explain the observed eager execution.",
      },
    ],
    correctIndex: 0,
    proTip:
      "Never put expensive calls inside an f-string passed to a logger. Use the logging module's lazy %-style interpolation — logger.debug('User snapshot: %s', build_expensive_snapshot(user)) still evaluates the argument eagerly in Python, so for truly lazy behavior, guard with `if logger.isEnabledFor(logging.DEBUG):` instead.",
    lesson:
      "An f-string is just syntax sugar that's converted into a sequence of str()/format() calls executed immediately when the literal is evaluated — there's no deferral mechanism. By the time logger.debug(f\"...\") is called, Python has already fully built the formatted string (and run any function calls embedded in it), so the logger's internal level check happens far too late to skip the expensive work.",
    remember:
      "f-strings are eagerly evaluated at the literal's construction point — wrapping an expensive call in one defeats any downstream lazy-evaluation logic like a logger's level check.",
    interviewAnswer:
      "The problem is that f-strings have no laziness at all — `f\"...{build_expensive_snapshot(user)}\"` is evaluated as a normal Python expression the instant that line executes, which means build_expensive_snapshot(user) runs and the full string gets built before logger.debug() is even called, let alone before it checks whether DEBUG-level logging is enabled. So in production at WARNING level, you're paying the full cost of the expensive function every request just to throw the resulting string away. The standard fix is to lean on the logging module's actual lazy evaluation path, which uses %-style placeholders: logger.debug('User snapshot: %s', build_expensive_snapshot(user)) — but note even that still evaluates the argument eagerly in CPython, so for a function that's genuinely expensive, the bulletproof fix is to guard the whole call with `if logger.isEnabledFor(logging.DEBUG):` before building the snapshot at all.",
  },
  {
    id: "q-py-walrus-scope-001",
    subject: "PYTHON",
    concept: "Walrus Operator Scoping Pitfalls",
    difficulty: "hard",
    stem:
      "A teammate adds a walrus operator inside a list comprehension to cache an expensive lookup, expecting it to behave like a local loop variable:\n```python\ndef tag_users(users):\n    return [tagged for u in users if (tagged := classify(u)) != \"unknown\"]\n\nresult = tag_users(all_users)\nprint(tagged)  # they expected a NameError here\n```\nTo their surprise, `print(tagged)` outside the function doesn't raise NameError but instead prints the last classification computed. Why?",
    options: [
      {
        text: "The walrus operator inside a comprehension binds its target in the containing function's scope (tag_users), not a private comprehension scope — but `tagged` is still local to tag_users, so this example would actually raise NameError; the only way it wouldn't is if the comprehension itself were at module level instead of inside a function",
        sub: "",
        fix: "",
      },
      {
        text: "List comprehensions never have their own scope in Python 3, so any variable assigned inside one, walrus or not, leaks to the enclosing scope automatically",
        sub: "Overgeneralizes — regular for-loop targets in comprehensions ARE scoped, only walrus targets escape",
        fix: "Since Python 3, comprehensions do have their own internal scope, and a plain `for u in users` loop variable like u stays private to the comprehension — it's specifically the walrus operator that's defined to bind in the enclosing scope, not comprehensions leaking variables in general.",
      },
      {
        text: "Walrus assignments inside comprehensions are bound at the module's global scope regardless of where the comprehension itself appears",
        sub: "Wrong target scope — it's the nearest enclosing function scope, not always global",
        fix: "PEP 572 specifies the walrus target binds to the nearest enclosing scope that isn't itself a comprehension — if the comprehension is inside a function, that's the function's local scope, not the module's global scope; print(tagged) at module level after calling tag_users() would in fact raise NameError in this example.",
      },
      {
        text: "classify(u) implicitly declares tagged as a global because it's called with an argument from the outer function's parameter list",
        sub: "Invents a rule about function calls creating globals",
        fix: "Calling a function with an argument has no effect on variable scoping rules; nothing about classify(u)'s call signature influences where tagged is bound — that's governed purely by the walrus operator's scoping rule (PEP 572), not by what's passed into the call.",
      },
    ],
    correctIndex: 0,
    proTip:
      "The walrus operator deliberately 'leaks' out of comprehension scope into the nearest enclosing function or module scope — that's a documented PEP 572 design choice, not a bug. It's exactly why `if (n := len(data)) > threshold` patterns work for reuse after the comprehension. But that leak stops at the enclosing function boundary — it doesn't go further to module/global scope unless the comprehension itself is at module level.",
    lesson:
      "Since Python 3, comprehensions create their own scope, which is why a plain `for u in users` keeps u from leaking. The walrus operator is a deliberate, documented exception: per PEP 572, := always binds in the nearest enclosing scope that isn't a comprehension, specifically so you can reuse the computed value after the comprehension finishes. In this example, that target scope is tag_users' local scope — so tagged is accessible after the list comprehension inside tag_users, but it still does not escape all the way to module/global scope, meaning the teammate's print(tagged) at module level would raise NameError, not print a value.",
    remember:
      "Walrus targets in a comprehension bind to the nearest enclosing function scope (by PEP 572 design), not to the comprehension itself and not all the way out to global scope.",
    interviewAnswer:
      "This is actually a trick in the question — as written, print(tagged) at module scope after calling tag_users() would raise NameError, not print the last value, because PEP 572 specifies the walrus operator binds its target to the nearest enclosing scope that isn't a comprehension itself. Inside tag_users, that's the function's local scope, so tagged is a local variable of tag_users — accessible if you returned it or printed it from inside that function, but invisible once you're back at module level. This is genuinely surprising the first time you see it because regular comprehension loop variables like u don't leak at all in Python 3 — comprehensions get their own private scope — but the walrus is a deliberate exception designed for cases like `if (n := len(data)) > 10`, where you want to reuse the computed value right after the comprehension, in the same enclosing scope.",
  },
  {
    id: "q-py-type-hints-runtime-001",
    subject: "PYTHON",
    concept: "Type Hints Are Not Enforced at Runtime",
    difficulty: "medium",
    stem:
      "A teammate is confused after this code runs without error and corrupts downstream data:\n```python\ndef apply_discount(price: float, percent: float) -> float:\n    return price - (price * percent / 100)\n\ntotal = apply_discount(\"99.99\", 10)\n```\nThey expected a TypeError since a str was passed where float was annotated. mypy was never run in CI. What actually happens?",
    options: [
      {
        text: "It raises a TypeError, but only because string * int multiplication ('99.99' * 10 / 100-style logic) eventually hits an unsupported operation — type annotations themselves are purely documentation and are never checked or enforced by the Python interpreter at runtime",
        sub: "",
        fix: "",
      },
      {
        text: "Python silently coerces \"99.99\" to a float automatically to match the float annotation before running the function body",
        sub: "Invents automatic coercion based on annotations",
        fix: "Python never reads annotations to perform implicit conversions — the function body receives exactly the str object that was passed in, completely unmodified, and any type mismatch only surfaces if the operations inside the function happen to fail.",
      },
      {
        text: "The annotations cause a TypeError to be raised immediately when apply_discount is called, before the function body even runs",
        sub: "Assumes annotations are enforced like a runtime type check",
        fix: "Function annotations are stored in __annotations__ as metadata and are not checked by the interpreter at call time — no built-in mechanism inspects arguments against : float hints unless you add an external validator like pydantic or a manual isinstance check.",
      },
      {
        text: "It runs to completion and returns a valid float because Python treats numeric strings as interchangeable with numbers in arithmetic",
        sub: "Wrong outcome — claims success where the operation actually fails",
        fix: "Python does not treat str and float as interchangeable in arithmetic — \"99.99\" * percent / 100 mixes a str with division, which raises a TypeError (str doesn't support division), so the call does not complete successfully.",
      },
    ],
    correctIndex: 0,
    proTip:
      "Type hints are documentation and tooling fuel (mypy, pyright, IDE autocomplete) — they have zero runtime effect by themselves. If you need actual runtime validation, reach for pydantic models, dataclasses with __post_init__ checks, or explicit isinstance() guards.",
    lesson:
      "CPython stores function annotations in __annotations__ purely as metadata; nothing in the interpreter consults them when a function is called. Static type checkers like mypy analyze annotations offline to catch mismatches before runtime, but if that checker never runs (as in this CI setup), a str sails straight into a float-annotated parameter and only fails if and when the function body performs an operation that str doesn't support.",
    remember:
      "Type hints are never checked by the Python interpreter at call time — they're metadata for tools like mypy; without static checking in CI, a wrong type silently flows in and fails (if at all) wherever it breaks an operation.",
    interviewAnswer:
      "Type annotations in Python are purely advisory — CPython parses `price: float` and stashes it in the function's __annotations__ dict, but nothing in the call machinery actually checks the argument against it. So apply_discount(\"99.99\", 10) sails right into the function body with price still bound to the string \"99.99\". The actual failure, if any, happens inside the body: price * percent / 100 tries to multiply a str by an int, which Python actually allows as string repetition in some forms, but combined with the division here it ultimately raises a TypeError from an unsupported operation, not from any annotation check. The real fix is twofold: run a static checker like mypy in CI so this is caught before deploy, and/or add explicit runtime validation (isinstance checks, or a pydantic model) at the boundary where untrusted input enters the system, since annotations alone provide zero runtime safety.",
  },
  {
    id: "q-py-mutable-classattr-001",
    subject: "PYTHON",
    concept: "Mutable Class Attributes Shared Across Instances",
    difficulty: "medium",
    stem:
      "A bug report says that adding an item to one shopping cart mysteriously adds it to every other user's cart too:\n```python\nclass Cart:\n    items = []\n\n    def add(self, item):\n        self.items.append(item)\n\ncart_a = Cart()\ncart_b = Cart()\ncart_a.add(\"book\")\nprint(cart_b.items)  # [\"book\"] -- unexpected!\n```\nWhat's the root cause?",
    options: [
      {
        text: "items is defined as a class attribute (in the class body, not in __init__), so all instances share the exact same list object until an instance attribute named items shadows it",
        sub: "",
        fix: "",
      },
      {
        text: "self.items.append(item) implicitly creates a new class-level binding that propagates to all existing and future instances by design",
        sub: "Misdescribes append() as a rebinding/broadcast operation",
        fix: ".append() mutates the list object in place and creates no new binding at all — it doesn't 'propagate' anything; the bug is that cart_a and cart_b were already pointing at the identical list object before append was ever called.",
      },
      {
        text: "Cart instances are cached and reused by Python's object pooling, so cart_a and cart_b are actually the same underlying object",
        sub: "Invents an object-pooling mechanism that doesn't apply to user-defined classes",
        fix: "Python does not pool or reuse instances of user-defined classes like this — cart_a and cart_b are genuinely two distinct Cart objects with different ids; what they share is just the one list object referenced by the class attribute items.",
      },
      {
        text: "This is expected GIL behavior — the interpreter serializes list mutations across instances within the same thread to maintain consistency",
        sub: "Conflates GIL (a threading/concurrency mechanism) with object identity",
        fix: "The GIL governs how bytecode executes across threads and has nothing to do with which list object an attribute lookup resolves to; this is single-threaded code, and the sharing is purely a consequence of attribute lookup falling through to a class-level mutable default.",
      },
    ],
    correctIndex: 0,
    proTip:
      "Mutable class attributes are the class-level twin of the mutable-default-argument bug — both stem from one object being created once and shared everywhere it shouldn't be. Always initialize mutable per-instance state inside __init__ (self.items = []), not in the class body.",
    lesson:
      "Attributes defined directly in a class body (not inside __init__) belong to the class itself, not to any instance. When you write self.items.append(...), Python's attribute lookup walks up to the class to find items (since no instance attribute shadows it yet), and mutates that one shared list — so every instance that hasn't created its own items sees the change.",
    remember:
      "A mutable attribute defined in the class body (not __init__) is shared by every instance until something reassigns it on a specific instance — append/mutate operations affect all instances at once.",
    interviewAnswer:
      "The bug is that items is declared as a class attribute — right in the class body — rather than as an instance attribute inside __init__. That means there's exactly one list object living on the Cart class itself, and every instance that doesn't have its own items attribute falls through to that shared class-level list during attribute lookup. When cart_a.add('book') runs, self.items.append('book') doesn't create anything new — append mutates the existing list in place — and since cart_a.items and cart_b.items both resolve to that same shared object, the mutation is visible from both. This is the class-attribute cousin of the classic mutable-default-argument bug. The fix is to move the initialization into __init__: `def __init__(self): self.items = []`, so each instance gets its own fresh list at construction time instead of sharing the class's.",
  },
  {
    id: "q-py-weakref-cache-001",
    subject: "PYTHON",
    concept: "Weak References to Avoid Memory Leaks in Caches",
    difficulty: "hard",
    stem:
      "A long-running service caches parsed Report objects keyed by their owning Session so repeated lookups are fast:\n```python\n_report_cache = {}\n\ndef get_report(session):\n    if session not in _report_cache:\n        _report_cache[session] = parse_report(session)\n    return _report_cache[session]\n```\nMemory usage grows without bound even though Session objects are supposed to be short-lived and garbage collected after each request. What's the most likely cause, and what's the standard fix?",
    options: [
      {
        text: "_report_cache holds a normal (strong) reference to each session as a dict key, so the cache itself keeps every Session alive forever; switching to a weakref.WeakKeyDictionary lets entries be collected once nothing else references the session",
        sub: "",
        fix: "",
      },
      {
        text: "parse_report(session) is leaking memory internally by creating circular references that the garbage collector can never detect",
        sub: "Misdiagnoses the leak as a gc cycle-detection failure rather than an intentional strong reference",
        fix: "Python's cyclic garbage collector does detect and clean up reference cycles (that's its whole purpose) — the actual cause here is much simpler: the cache dict holds an ordinary strong reference to each session key, which by itself is enough to keep it alive regardless of cycles.",
      },
      {
        text: "Dictionaries in Python never release memory for removed or evicted keys due to internal hash table fragmentation, so the cache grows monotonically regardless of what's stored",
        sub: "Misattributes growth to dict internals rather than reference counting",
        fix: "Dict memory fragmentation might affect the dict's own bucket array slightly, but it doesn't explain unbounded growth of session objects specifically — the real cause is that nothing is ever removed from _report_cache at all, since each key is a strong reference keeping its Session permanently reachable.",
      },
      {
        text: "Session objects implement __eq__ but not __hash__, causing Python to insert duplicate entries for what should be the same key",
        sub: "Unverified/irrelevant — and a missing __hash__ would raise TypeError, not silently leak",
        fix: "If a class defines __eq__ without __hash__, Python actually makes it unhashable (raises TypeError when used as a dict key), so this would crash immediately rather than silently leak memory — that's not consistent with the symptom described.",
      },
    ],
    correctIndex: 0,
    proTip:
      "Any cache keyed or valued by application objects (not just primitives) should default to weakref.WeakKeyDictionary or WeakValueDictionary unless you have an explicit, bounded eviction policy — otherwise the cache becomes an unintentional permanent reference root.",
    lesson:
      "A plain dict holds strong references to both its keys and values, which counts toward an object's reference count just like any other variable. Even though the rest of the application is done with a Session after a request finishes, the cache's strong reference keeps its refcount above zero forever, so it's never collected. A WeakKeyDictionary instead holds weak references that don't prevent garbage collection — once the session's last real (strong) reference goes away, the entry is automatically dropped from the cache.",
    remember:
      "A normal dict cache holds strong references to its keys, which alone is enough to keep otherwise-dead objects alive forever — use weakref.WeakKeyDictionary when the cache shouldn't be what keeps something alive.",
    interviewAnswer:
      "The leak is that _report_cache is a plain dict, and plain dicts hold strong references to their keys — so simply being a key in this cache is enough to keep a Session object's reference count above zero, which means the garbage collector can never reclaim it, no matter how 'short-lived' it's supposed to be elsewhere in the app. Every new session that flows through get_report adds a permanent entry, so memory grows linearly with total requests ever served, never shrinking. The standard fix is to swap the plain dict for weakref.WeakKeyDictionary, which stores weak references to its keys — references that don't count toward the object's refcount. Once every other strong reference to a given Session goes away at the end of its request, the WeakKeyDictionary entry is automatically and transparently removed, and the cache stops being a hidden memory-leak root.",
  },
];
