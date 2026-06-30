export const NEW_OS = [
  {
    id: "q-os-mmap-001",
    subject: "OS",
    concept: "Memory-Mapped Files (mmap)",
    difficulty: "hard",
    stem:
      "A service loads a 4GB log-indexing file by calling read() into a heap buffer at startup, which takes 6 seconds and uses 4GB of RSS even though any given request only touches a few KB of the file. A teammate suggests mmap()-ing the file instead and letting the OS manage paging. After the change, startup is near-instant and RSS stays low until pages are actually touched. Why does mmap() behave this way?",
    options: [
      {
        text: "mmap() maps the file lazily into the page cache; pages are faulted in on first access instead of being copied up front",
        sub: "Demand paging backs the mapping by the page cache",
        fix: "",
      },
      {
        text: "mmap() compresses the file in memory, so RSS stays low even after the whole file is read",
        sub: "Transparent compression reduces resident size",
        fix:
          "mmap() does not compress anything. RSS stays low because untouched pages were never faulted in, not because resident pages are smaller.",
      },
      {
        text: "mmap() runs the read in a background kernel thread so it finishes faster",
        sub: "Async kernel-side read ahead",
        fix:
          "The speedup isn't from backgrounding the same amount of work — it's that mmap() does almost no work upfront at all, since it just establishes a mapping rather than copying file contents into a buffer.",
      },
      {
        text: "mmap() only works on files smaller than physical RAM, so the 4GB file must have been truncated",
        sub: "Size limit forces partial load",
        fix:
          "mmap() can map files far larger than physical RAM — that's exactly the point. The mapping is virtual; only touched pages consume RAM.",
      },
    ],
    correctIndex: 0,
    proTip:
      "mmap() turns 'load this whole file' into 'let page faults load it for me, one page at a time, backed by the page cache.' That's why startup time for mmap() is roughly O(1) regardless of file size, while read() into a buffer is O(file size).",
    lesson:
      "read() copies bytes from the page cache into a process buffer, so loading N bytes costs roughly N bytes of work and memory up front. mmap() instead establishes a virtual mapping to the file's page-cache pages; nothing is copied until the process actually touches a given page, at which point a page fault brings just that page in. This makes mmap() ideal for large files accessed sparsely or randomly, since cost scales with bytes actually touched, not file size.",
    remember: "mmap() defers work to page faults: virtual mapping is instant, RSS grows only as pages are actually touched, unlike read() which copies the whole file up front.",
    interviewAnswer: "The read() approach has to copy the entire 4GB from the page cache into a heap buffer before the process can do anything, so both the time and the RSS scale with file size. mmap() instead just sets up page-table entries pointing at the file's pages in the page cache — no data is copied at mmap() time. When the process actually touches a byte in a given page, that triggers a minor page fault, the kernel maps that one page in, and execution resumes. Since most requests only touch a few KB, you end up paying for exactly the bytes you use instead of the whole file, which explains both the instant startup and the low resident memory.",
  },
  {
    id: "q-os-cowfork-001",
    subject: "OS",
    concept: "Copy-on-Write fork()",
    difficulty: "medium",
    stem:
      "A Python web worker process has 800MB RSS from a loaded ML model. The team forks 8 worker processes (a common pattern with Gunicorn's pre-fork model) to handle requests in parallel, expecting total memory usage near 6.4GB. Instead, `free -h` shows total usage barely above 900MB right after fork, then climbing slowly as workers run. What explains the low memory footprint immediately after forking?",
    options: [
      {
        text: "Copy-on-write: child processes share the parent's physical pages read-only until either side writes, at which point only that page is duplicated",
        sub: "Pages are duplicated lazily, only on write",
        fix: "",
      },
      {
        text: "fork() only duplicates the stack and registers, not the heap, so the model data was never copied to begin with",
        sub: "Heap is excluded from the child's address space",
        fix:
          "fork() gives the child a full logical copy of the parent's entire address space, including the heap — it's just that the underlying physical pages are shared via copy-on-write rather than immediately duplicated.",
      },
      {
        text: "Linux deduplicates identical pages across all processes automatically via KSM, regardless of how they were created",
        sub: "Kernel same-page merging scans and merges matching pages",
        fix:
          "KSM is a real feature but it's opt-in, scans periodically, and isn't what's responsible for the immediate low memory right after fork() — that's copy-on-write, which applies instantly at fork time.",
      },
      {
        text: "The 8 workers are actually still a single process internally; `free -h` is undercounting because Gunicorn uses green threads, not real fork()",
        sub: "Misreported process model",
        fix:
          "Gunicorn's pre-fork worker model uses real OS processes via fork(), not green threads — that's the whole point of the pattern, to get process-level isolation per worker.",
      },
    ],
    correctIndex: 0,
    proTip:
      "Copy-on-write is why pre-fork server models (Gunicorn, Unicorn, PHP-FPM) are memory-efficient: load your big read-mostly data (models, config, code) once before forking, and every worker shares those physical pages for free until something actually mutates them.",
    lesson:
      "fork() gives the child process its own page tables, but initially points every entry at the same physical pages as the parent, marked read-only, with a copy-on-write flag set. No physical memory is duplicated at fork time. Only when either process writes to a shared page does the kernel trap the write, allocate a private physical copy for the writer, and let it proceed — so memory grows incrementally as pages are actually mutated, not all at once.",
    remember: "fork() shares physical pages copy-on-write; duplication only happens lazily per-page on the first write, which is why pre-fork workers don't multiply RSS by worker count.",
    interviewAnswer: "Right after fork(), the 8 children don't get their own physical copy of that 800MB — they get their own page tables, but every entry still points at the same physical pages the parent has, marked read-only with copy-on-write set. So memory usage barely moves at fork time because nothing was actually duplicated. As each worker runs and starts writing to its own request-local state — or even just touching reference counts in CPython objects — the kernel traps that write, copies just that one 4KB page for the writer, and lets it proceed. That's why you see RSS creep up gradually instead of jumping 8x immediately, and it's exactly why the pre-fork model is memory-efficient for read-mostly data like a loaded model.",
  },
  {
    id: "q-os-fdleak-001",
    subject: "OS",
    concept: "File Descriptor Limits / Leaks",
    difficulty: "medium",
    stem:
      "A long-running ingestion service starts throwing `EMFILE: too many open files` after running for several days, even though it processes a steady, bounded request rate. `lsof -p <pid> | wc -l` shows the count climbing steadily over time and never dropping. Code review shows every request opens a file with `open()` to read a config snippet, and the success path calls `close()`. What is most likely happening?",
    options: [
      {
        text: "An exception path skips the close() call, so file descriptors leak on every failed request and accumulate until the per-process fd limit is hit",
        sub: "Unhandled error path never reaches cleanup",
        fix: "",
      },
      {
        text: "The OS is silently lowering the process's file descriptor limit over time due to memory pressure",
        sub: "Dynamic rlimit adjustment under load",
        fix:
          "The kernel does not silently shrink a process's rlimit based on memory pressure. The fd limit (ulimit -n / RLIMIT_NOFILE) is fixed unless explicitly changed by the process or an administrator.",
      },
      {
        text: "Each open() call is creating a new inode on disk, and the filesystem is running out of inodes",
        sub: "Inode exhaustion on the filesystem",
        fix:
          "Opening an existing file for reading doesn't create a new inode, and EMFILE specifically signals a per-process open-file-descriptor limit, not filesystem inode exhaustion (which would surface as ENOSPC).",
      },
      {
        text: "TCP sockets in TIME_WAIT are consuming the descriptor table and crowding out file opens",
        sub: "Ephemeral socket exhaustion",
        fix:
          "Sockets in TIME_WAIT are already closed from the application's perspective and don't hold an open fd in this process; the growth is tied to the per-request open()/close() pattern around file reads, not socket lifecycle.",
      },
    ],
    correctIndex: 0,
    proTip:
      "EMFILE almost always means 'something on an error path isn't calling close().' The fastest way to confirm: `ls -la /proc/<pid>/fd | wc -l` over time, then `lsof -p <pid>` to see what's piling up and never being released — usually one specific file or socket type tied to one code path.",
    lesson:
      "Every process has a finite number of file descriptor slots (RLIMIT_NOFILE, commonly 1024 by default). Each open() consumes one slot until a matching close() releases it. If an exception, early return, or error branch bypasses the cleanup code, that descriptor is never released even though the file object becomes unreachable — unlike memory, the kernel won't reclaim it until the process exits or the descriptor is explicitly closed. Over enough iterations, this exhausts the limit and open() starts failing with EMFILE.",
    remember: "EMFILE after long uptime = fd leak, usually a close() that's skipped on an error/exception path; check with lsof -p <pid> | wc -l trending up over time.",
    interviewAnswer: "Since the service is bounded in request rate but the open fd count keeps climbing forever, this has the signature of a classic resource leak rather than legitimate load — something is opening files faster than it's closing them. The fact that the success path calls close() but the bug only shows up after days strongly suggests an error or exception path that returns or throws before reaching the close(), so every failed request leaks one descriptor. Unlike memory, the kernel won't reclaim a leaked fd via garbage collection — it stays open until explicitly closed or the process exits — so it just accumulates until you hit RLIMIT_NOFILE and start seeing EMFILE. I'd confirm with lsof -p <pid> to see what's piling up, then wrap the open() in a try/finally or use a context manager so close() runs unconditionally.",
  },
  {
    id: "q-os-signal-001",
    subject: "OS",
    concept: "Signal Handling",
    difficulty: "hard",
    stem:
      "A Kubernetes deployment sets `terminationGracePeriodSeconds: 30`. On rolling deploys, the old pod is supposed to finish in-flight HTTP requests before exiting. Instead, logs show requests being cut off immediately when a new deploy starts, well before 30 seconds pass. The app's only shutdown logic is a `finally` block that runs when the process exits normally. What's the most likely cause?",
    options: [
      {
        text: "The process has no handler for SIGTERM, so the default action terminates it immediately instead of running any graceful-shutdown logic first",
        sub: "Default SIGTERM disposition is immediate termination",
        fix: "",
      },
      {
        text: "Kubernetes is sending SIGKILL first instead of SIGTERM, which can never be caught or ignored",
        sub: "Uncatchable signal sent prematurely",
        fix:
          "Kubernetes sends SIGTERM first and only escalates to SIGKILL after the grace period expires. If shutdown is happening immediately, SIGTERM itself is the problem, not a premature SIGKILL — and SIGKILL specifically cannot be the issue if processes get to log anything at all in response to the signal.",
      },
      {
        text: "The grace period only applies to liveness probes, not to the application process itself",
        sub: "Misapplied grace period scope",
        fix:
          "terminationGracePeriodSeconds governs how long Kubernetes waits between sending SIGTERM and SIGKILL to the container's main process — it isn't scoped to probes at all.",
      },
      {
        text: "A `finally` block can never run in response to process termination, regardless of signal handling",
        sub: "Cleanup blocks are signal-independent",
        fix:
          "finally blocks do run on normal exception unwinding or process exit, but a signal like SIGTERM whose default disposition is to terminate the process doesn't go through normal control flow at all, so it bypasses finally — the issue is the missing handler, not finally being inherently broken.",
      },
    ],
    correctIndex: 0,
    proTip:
      "If your app needs to drain connections on shutdown, you must explicitly register a SIGTERM handler (or catch it in your framework's lifecycle hooks). Without one, the default disposition for SIGTERM is immediate termination — your finally blocks and cleanup code never get a chance to run.",
    lesson:
      "Every signal has a default disposition if the process hasn't installed a custom handler; for SIGTERM, the default is to terminate the process immediately, bypassing normal language-level cleanup like try/finally. Kubernetes' shutdown sequence sends SIGTERM, waits up to terminationGracePeriodSeconds, then sends SIGKILL (which truly cannot be caught or ignored) if the process hasn't exited. To drain in-flight requests gracefully, the application must register an explicit SIGTERM handler that stops accepting new work and waits for existing requests to finish before exiting.",
    remember: "No SIGTERM handler = default disposition kills the process immediately, skipping finally blocks; graceful shutdown requires explicitly catching SIGTERM, since only SIGKILL is truly uncatchable.",
    interviewAnswer: "This points to the app never having registered a SIGTERM handler. Kubernetes' shutdown sequence is to send SIGTERM and then wait up to the grace period before escalating to SIGKILL, but if the process doesn't install a handler for SIGTERM, the default disposition kicks in, which is immediate termination — and that bypasses normal language constructs like a finally block entirely, since the process never goes through its usual exit path. The fix is to explicitly catch SIGTERM in the application, stop accepting new connections, let in-flight requests finish, and then exit on its own — all within the grace period, so Kubernetes never needs to fall back to the uncatchable SIGKILL.",
  },
  {
    id: "q-os-oomkiller-001",
    subject: "OS",
    concept: "OOM Killer",
    difficulty: "hard",
    stem:
      "A Node.js API container keeps dying with no application-level error logs, no stack trace, no unhandled exception — it just stops, and `kubectl describe pod` shows `OOMKilled`. `dmesg` on the node around the time of the crash shows a line mentioning `Out of memory: Killed process` with the container's PID. The memory limit on the container is 512Mi, and a memory profiler shows usage was creeping toward that limit gradually over an hour. Why did the process die with no application-level exception at all?",
    options: [
      {
        text: "The Linux kernel's OOM killer selected and SIGKILLed the process directly when the cgroup memory limit was exceeded, which gives the process no chance to catch an exception or run cleanup code",
        sub: "Kernel-level termination bypasses the application entirely",
        fix: "",
      },
      {
        text: "Node.js threw an out-of-memory exception that was silently swallowed by a try/catch somewhere in the request handler",
        sub: "Application-level exception suppressed",
        fix:
          "A JS heap OOM inside the V8 engine would normally produce a fatal V8 error in stdout/stderr before the process dies, and is a different mechanism from a cgroup limit being exceeded — the dmesg OOM killer log specifically indicates the kernel terminated the process from outside, which a try/catch cannot intercept at all.",
      },
      {
        text: "The container's CPU limit was exceeded, causing Kubernetes to evict and restart the pod",
        sub: "CPU throttling triggers eviction",
        fix:
          "CPU limits cause throttling, not termination, and the explicit dmesg 'Out of memory' message and OOMKilled status both point specifically to a memory limit being hit, not CPU.",
      },
      {
        text: "A segmentation fault in a native Node.js addon crashed the process before it could log anything",
        sub: "Native code memory corruption",
        fix:
          "A segfault would show a different kernel log signature (a SIGSEGV trap) and isn't what dmesg reported here — the explicit 'Out of memory: Killed process' message is the OOM killer's own log line, a distinct kernel mechanism from a segfault.",
      },
    ],
    correctIndex: 0,
    proTip:
      "If a container dies with OOMKilled and zero application logs, stop looking in your app's exception handlers — none of them ran. Go straight to `dmesg` or `journalctl -k` on the node and look for the oom-killer's badness-score selection log; that's the kernel deciding to SIGKILL your process from outside its control entirely.",
    lesson:
      "When a cgroup (which is how container memory limits are enforced) hits its memory limit, the kernel's OOM killer steps in, picks a process to sacrifice based on an internal badness/oom_score heuristic, and sends it SIGKILL directly. This happens entirely outside the process's control — there's no exception to catch, no signal handler can intervene (SIGKILL is uncatchable), and no cleanup code runs. This is fundamentally different from an in-process memory error like a V8 heap exhaustion, which does produce an application-level error before crashing.",
    remember: "OOMKilled = kernel cgroup OOM killer SIGKILLs the process from outside; no exception, no handler, no cleanup runs — check dmesg/journalctl -k, not application logs.",
    interviewAnswer: "The absence of any application-level error is actually the biggest clue here — it tells you the process didn't die from something it could see or catch. When a container's cgroup memory usage crosses its limit, the kernel's OOM killer steps in from outside the process, picks a victim based on its oom_score, and sends it a SIGKILL directly. SIGKILL can't be caught or handled, so there's no exception, no finally block, no cleanup — the process just stops mid-instruction. That matches exactly what we're seeing: dmesg shows the kernel's own 'Out of memory: Killed process' log, which is the kernel's audit trail for an OOM kill, completely separate from anything Node's own error handling could have intercepted. Next step would be to profile what's actually growing — a leak, an unbounded cache, or just genuinely needing a higher memory limit.",
  },
  {
    id: "q-os-falsesharing-001",
    subject: "OS",
    concept: "CPU Cache Locality / False Sharing",
    difficulty: "hard",
    stem:
      "A multi-threaded counter library has each of 8 worker threads incrementing its own `int counter` in a global `int counters[8]` array, each thread only touching its own index, no locks involved. Profiling with `perf c2c` shows heavy cache-line contention, and the benchmark is far slower with 8 threads than with 1, despite there being no logical data dependency between threads. What's going on?",
    options: [
      {
        text: "False sharing: multiple counters land on the same 64-byte cache line, so writes by one core invalidate the cache line for all cores sharing it, even though the threads touch logically independent data",
        sub: "Cache-coherence traffic from co-located unrelated data",
        fix: "",
      },
      {
        text: "This is a data race on a shared variable, and the threads are corrupting each other's counter values",
        sub: "Concurrent writes to the same memory location",
        fix:
          "Each thread writes only to its own array index with no overlap, so there's no race on the data itself — the slowdown is a cache-coherence performance effect, not a correctness/data-race issue.",
      },
      {
        text: "The threads are being serialized by the OS scheduler because int arrays can only be accessed by one thread at a time",
        sub: "Scheduler-enforced serialization on arrays",
        fix:
          "There is no such OS or language rule serializing access to different elements of an array by different threads; arrays support fully concurrent access to distinct elements.",
      },
      {
        text: "TLB misses from the array spanning multiple pages are dominating runtime",
        sub: "Translation lookaside buffer pressure",
        fix:
          "An 8-int (32-byte) array fits comfortably within a single page and even a single cache line, so TLB pressure isn't the bottleneck — and perf c2c specifically flags cache-line contention between cores, which is the false-sharing signature, not a TLB issue.",
      },
    ],
    correctIndex: 0,
    proTip:
      "The cache-coherence protocol operates at cache-line granularity (typically 64 bytes), not variable granularity. Eight 4-byte ints easily fit in one line, so even though each thread only writes its 'own' int, every write triggers a coherence invalidation across all cores caching that line. Fix: pad each counter to its own cache line, or use per-thread-local counters and aggregate at the end.",
    lesson:
      "False sharing happens when independent variables used by different threads happen to share a CPU cache line. Cache coherence protocols (like MESI) track ownership at the granularity of a full cache line, not individual variables, so when one core writes to its part of the line, the line is invalidated in every other core's cache, forcing a re-fetch over the interconnect. The threads have no logical dependency and no correctness issue, but they pay a heavy performance penalty from constant cache-line ping-ponging. The fix is padding or alignment so each thread's hot data occupies its own cache line.",
    remember: "False sharing = independent variables sharing one cache line; writes by one core invalidate it for all cores caching it, even with zero logical data dependency. Fix with padding/alignment to separate cache lines.",
    interviewAnswer: "There's no correctness bug here — each thread only ever touches its own array slot — but performance is suffering from false sharing. Cache coherence protocols track state at the granularity of a full 64-byte cache line, not individual 4-byte ints, and 8 ints packed into a 32-byte array almost certainly all land on the same line. So every time one thread increments its counter, the cache-coherence protocol has to invalidate that line in every other core's cache, forcing them to refetch it over the interconnect on their next access — even though logically the threads share nothing. perf c2c is exactly the tool for surfacing this, since it shows cache-line-level contention across cores. The standard fix is to pad each counter out to its own cache line, often 64 bytes, so each thread's writes stay local to its own line.",
  },
  {
    id: "q-os-spinlock-001",
    subject: "OS",
    concept: "Spinlocks vs Blocking Locks",
    difficulty: "medium",
    stem:
      "A kernel-level data structure is protected by a spinlock that's typically held for only a few nanoseconds (a handful of instructions). A new engineer proposes replacing it with a regular mutex (which sleeps the waiting thread and triggers a context switch) to 'be safer and avoid wasting CPU while waiting.' A senior engineer pushes back, saying that would make things slower, not safer. Who's right, and why?",
    options: [
      {
        text: "The senior engineer: for a lock held only briefly, spinning burns a few wasted cycles, but blocking would cost far more in context-switch overhead than the entire critical section takes to execute",
        sub: "Context-switch cost dwarfs a short busy-wait",
        fix: "",
      },
      {
        text: "The new engineer: mutexes are always safer than spinlocks because they prevent priority inversion entirely",
        sub: "Blocking locks eliminate priority inversion",
        fix:
          "Mutexes don't inherently prevent priority inversion — that requires a specific protocol like priority inheritance, which can be layered onto either blocking locks or spinlocks. Lock type alone doesn't decide that.",
      },
      {
        text: "Both are equivalent in performance since the OS scheduler optimizes context switches to be effectively free",
        sub: "Context switches are negligible overhead",
        fix:
          "Context switches are not free — saving/restoring registers, flushing or invalidating parts of the pipeline and TLB, and the eventual reschedule typically cost on the order of microseconds, which is enormous compared to a multi-nanosecond critical section.",
      },
      {
        text: "The new engineer: spinning wastes CPU regardless of hold time, so it should always be avoided in favor of sleeping locks",
        sub: "Spinning is categorically wasteful",
        fix:
          "Whether spinning 'wastes' CPU depends entirely on hold time relative to context-switch cost — for very short critical sections, spinning is the cheaper option overall, which is precisely why kernels use spinlocks for exactly this case.",
      },
    ],
    correctIndex: 0,
    proTip:
      "Rule of thumb: spin if the expected wait is shorter than roughly two context switches' worth of time; block if it's longer. That's why kernels use spinlocks for short, interrupt-context-safe critical sections, and mutexes/semaphores for anything that might block on I/O or hold the lock for a while.",
    lesson:
      "A spinlock makes a waiting thread busy-loop, checking the lock repeatedly, which wastes CPU cycles but avoids a context switch. A blocking mutex instead puts the waiting thread to sleep and triggers a context switch, which has real, measurable overhead (saving/restoring state, scheduler bookkeeping, cache and TLB effects) typically on the order of microseconds. When the critical section is extremely short — common in kernel code — the cost of even two context switches (sleep, then wake) vastly exceeds the cost of just spinning until the lock frees up.",
    remember: "Spinlocks beat blocking mutexes when hold time is shorter than a context switch (~microseconds); for nanosecond-scale critical sections, spinning wastes less time than sleeping and waking a thread.",
    interviewAnswer: "The senior engineer is right. The whole tradeoff between spinlocks and blocking locks comes down to comparing the cost of busy-waiting against the cost of a context switch, and for a critical section that's only a handful of instructions, spinning is actually the cheaper option. A blocking mutex puts the waiting thread to sleep, which means a context switch out, scheduler bookkeeping, eventually a context switch back in, plus the cache and TLB churn that comes with running a different thread in between — all of that easily costs microseconds, which absolutely dwarfs a few nanoseconds of spinning. That's exactly why kernels use spinlocks for short, low-level critical sections — the busy-wait is wasted cycles, but it's far fewer wasted cycles than the alternative.",
  },
  {
    id: "q-os-syscall-001",
    subject: "OS",
    concept: "Syscall Overhead / User-Kernel Boundary",
    difficulty: "medium",
    stem:
      "A log-shipping tool calls `write()` once per log line, sometimes thousands of times per second. `strace -c` shows the process spending a disproportionate amount of wall-clock time inside `write()` syscalls relative to the tiny amount of data each one transfers. Switching to buffering log lines in a userspace buffer and flushing with one `write()` every few hundred lines drops CPU usage significantly. Why does batching help here?",
    options: [
      {
        text: "Each syscall forces a transition from user mode to kernel mode (and back), which has fixed overhead independent of how much data is transferred, so making fewer, larger syscalls amortizes that fixed cost over more data",
        sub: "Mode-switch cost is paid per call, not per byte",
        fix: "",
      },
      {
        text: "write() is a blocking call that always waits for the data to be physically flushed to disk before returning, so fewer calls means less time waiting on disk",
        sub: "Synchronous disk flush per write()",
        fix:
          "A normal write() to a regular file just copies data into the kernel's page cache and returns — it doesn't wait for the disk under normal (non-O_SYNC) conditions. The overhead here is the per-call user/kernel transition cost, not synchronous disk I/O.",
      },
      {
        text: "The kernel rate-limits write() calls to prevent any single process from monopolizing I/O bandwidth",
        sub: "Kernel-imposed syscall throttling",
        fix:
          "There's no general per-syscall rate limiter in the kernel for write(); the overhead strace is showing is the fixed cost paid on every user-to-kernel transition, not artificial throttling.",
      },
      {
        text: "strace itself is slowing down each write() call, and the real, unobserved program has no such overhead",
        sub: "Observer effect from tracing",
        fix:
          "strace does add some overhead while attached, but the underlying CPU-usage improvement from batching is measured independently after the change and holds true without strace attached — the syscall transition cost is real, not a tracing artifact.",
      },
    ],
    correctIndex: 0,
    proTip:
      "Every syscall pays a fixed 'toll' for crossing the user/kernel boundary — saving registers, switching page tables or privilege level, kernel-side validation — typically in the hundreds of nanoseconds, regardless of payload size. That's the whole rationale behind buffered I/O (stdio's fwrite, or app-level batching): convert N small syscalls into 1 big one and pay the toll once.",
    lesson:
      "System calls require a transition from unprivileged user mode to privileged kernel mode, which involves a trap/mode switch, often a change in security context, and kernel-side argument validation — work that is largely fixed-cost, independent of the amount of data the call actually moves. When an application makes many small syscalls, it pays this fixed overhead repeatedly for very little data each time. Buffering writes in userspace and flushing in larger batches amortizes that fixed per-call cost over much more data, which is why batching syscalls is a standard performance technique for I/O-heavy code.",
    remember: "Every syscall pays a fixed user-to-kernel mode-switch cost regardless of payload size; batching many small writes into fewer large ones amortizes that fixed cost over more data.",
    interviewAnswer: "The key insight is that the cost of a syscall isn't proportional to how much data it moves — crossing from user mode into kernel mode has a largely fixed overhead, from the trap itself to saving and restoring register state to kernel-side validation, and that toll gets paid on every single call regardless of payload size. When you're calling write() once per log line, you're paying that fixed cost thousands of times a second for just a few bytes each time, so the per-call overhead ends up dominating over the actual data-transfer cost. Buffering in userspace and flushing every few hundred lines means you pay that fixed transition cost once per batch instead of once per line, which is exactly the kind of overhead strace -c was surfacing as a disproportionate amount of time spent in write() relative to bytes transferred.",
  },
  {
    id: "q-os-zombie-001",
    subject: "OS",
    concept: "Zombie Process Accumulation",
    difficulty: "medium",
    stem:
      "A containerized batch-job runner spawns short-lived child processes via `fork()`/`exec()` for each job, but never calls `wait()` or `waitpid()` on them after they finish. Over a few days, `ps aux` inside the container shows a growing number of processes in state `Z` (defunct), and eventually the container hits its PID limit and can't fork new processes at all. Why do these terminated processes stick around instead of disappearing?",
    options: [
      {
        text: "A process that has exited but whose parent hasn't called wait()/waitpid() yet becomes a zombie: the kernel keeps its exit status and PID slot allocated until the parent reaps it",
        sub: "Exit status held until parent collects it",
        fix: "",
      },
      {
        text: "The container's memory limit is too low to fully deallocate finished processes, so they linger in a half-freed state",
        sub: "Memory pressure prevents full cleanup",
        fix:
          "Zombie processes consume almost no memory — just a process table entry holding exit status and a few accounting fields. Their persistence is about an un-reaped exit status, not memory limits.",
      },
      {
        text: "exec() failed silently for each job, so the child processes are actually still running, just hidden",
        sub: "Silent exec failure",
        fix:
          "A 'Z' (defunct) state in ps specifically means the process has already terminated and exited — it isn't still running, hidden or otherwise; that state only exists for processes the kernel is holding onto post-exit for their parent.",
      },
      {
        text: "The kernel's process scheduler is deprioritizing cleanup of short-lived processes in favor of active jobs",
        sub: "Scheduler-deferred cleanup",
        fix:
          "There's no scheduler-level deferral of process cleanup based on priority — zombie persistence is specifically about whether wait()/waitpid() has been called by the parent, not scheduling priority.",
      },
    ],
    correctIndex: 0,
    proTip:
      "In containers this is especially nasty because PID 1 inside the container is usually your application, not a real init system — and PID 1 has the special job of reaping orphaned/zombie processes. If your app doesn't call wait() and isn't built to act as a mini-init, zombies pile up until you hit the container's PID limit. That's exactly why tools like tini or dumb-init exist: run them as PID 1 to reap zombies for you.",
    lesson:
      "When a child process terminates, it doesn't fully disappear immediately — the kernel keeps a minimal process table entry (the zombie, state Z) holding its exit status so the parent can retrieve it via wait() or waitpid(). Only after the parent reaps that status is the process table entry actually freed. If the parent never calls wait(), zombies accumulate indefinitely, each consuming a PID and a process table slot, eventually exhausting the PID limit even though they use almost no other resources.",
    remember: "Zombie (Z) processes are terminated children whose exit status hasn't been reaped via wait()/waitpid(); they hold a PID slot until reaped, and accumulate forever if the parent never calls wait().",
    interviewAnswer: "This is exactly what zombie processes look like. When a child process exits, the kernel doesn't immediately free its process table entry — it holds onto the exit status in a minimal 'zombie' state so the parent can retrieve it with wait() or waitpid(). If the parent, the job runner in this case, never calls wait(), that exit status is never collected, so the zombie just sits there forever holding a PID. Since each zombie still occupies a PID slot even though it's not doing any real work, enough of them accumulate to exhaust the container's PID limit and you can't fork anything new. The fix is to actually reap children with wait()/waitpid() after each job, or run an init process like tini as PID 1 inside the container, since PID 1 has the special responsibility of reaping orphaned and zombie processes.",
  },
  {
    id: "q-os-epoll-001",
    subject: "OS",
    concept: "epoll / Event-Driven I/O vs Blocking I/O",
    difficulty: "hard",
    stem:
      "A chat server originally spawned one thread per client connection, each blocked on a synchronous `read()` waiting for that client's next message. At 2,000 concurrent connections, the server was spending most of its time on thread scheduling and context switching, with most threads idle waiting on I/O. Rewriting it around a single-threaded event loop using `epoll` to wait on all 2,000 sockets at once dramatically cut CPU usage and let it scale to 50,000 connections. What does epoll fundamentally let the server avoid?",
    options: [
      {
        text: "Dedicating a blocked OS thread (and its scheduling/context-switch overhead) per idle connection — epoll lets one thread ask the kernel which of many sockets are ready, instead of one thread per socket sleeping until data arrives",
        sub: "One thread monitors many file descriptors via a single syscall",
        fix: "",
      },
      {
        text: "epoll eliminates context switches entirely by handling all socket reads directly in kernel space without ever returning to userspace",
        sub: "Kernel-space-only I/O processing",
        fix:
          "epoll still requires returning to userspace for the application to actually process each ready socket's data; what it eliminates is the need for a blocked OS thread per idle connection, not user/kernel transitions altogether.",
      },
      {
        text: "epoll bypasses TCP entirely and reads data directly from the NIC, skipping the kernel's networking stack",
        sub: "Direct NIC-to-userspace data path",
        fix:
          "epoll is a notification mechanism layered on top of the normal kernel networking stack and socket buffers — it doesn't bypass TCP or talk to hardware directly; that would be closer to kernel-bypass techniques like DPDK.",
      },
      {
        text: "epoll guarantees lower latency per message than blocking I/O because it processes sockets in priority order",
        sub: "Priority-based message scheduling",
        fix:
          "epoll doesn't impose or guarantee any priority ordering among ready sockets — its win here is scalability via reduced per-connection thread overhead, not inherently lower per-message latency or prioritized scheduling.",
      },
    ],
    correctIndex: 0,
    proTip:
      "The core problem with thread-per-connection at scale isn't the I/O itself, it's that every idle connection still ties up an OS thread's stack, kernel scheduling slot, and context-switch overhead. epoll flips the model: instead of N threads each blocked asking 'is my socket ready yet?', one thread asks the kernel once, 'which of these N sockets are ready?' — turning an O(threads) scheduling problem into an O(1) thread, O(ready sockets) work problem.",
    lesson:
      "Thread-per-connection blocking I/O scales poorly because each idle connection still consumes a full OS thread, with its own stack memory and a slot in the scheduler's run queue, even while doing nothing but waiting. epoll (and similar mechanisms like kqueue) lets a single thread register interest in many file descriptors and then make one syscall that blocks until any of them become ready, returning just the ready subset. This collapses thousands of blocked threads into one thread handling an event loop, eliminating the per-connection thread and context-switch overhead that dominated the original design.",
    remember: "epoll replaces 'one blocked thread per idle connection' with 'one thread asking the kernel which of N sockets are ready,' collapsing per-connection thread/scheduling overhead — that's why event loops scale past thread-per-connection models.",
    interviewAnswer: "The thread-per-connection model's real cost isn't the I/O — it's that every single idle connection, even one sitting there for minutes doing nothing, still occupies a full OS thread with its own stack and a slot the scheduler has to consider on every reschedule. At 2,000 connections, most of those threads are blocked doing nothing, but the kernel is still paying scheduling and context-switch overhead managing all of them. epoll flips that model: instead of thousands of threads each independently blocked asking 'is my socket ready,' you have one thread that registers all 2,000 sockets with the kernel and makes a single blocking call that returns only the subset that's actually ready to read or write. That collapses an O(number of connections) threading and scheduling problem into a single thread doing an event loop, which is exactly why it scales to tens of thousands of connections where thread-per-connection falls over.",
  },
];
