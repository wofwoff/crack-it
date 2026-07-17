export const NEW_OS = [
  {
    id: "q-os-mmap-001",
    subject: "OS",
    concept: "Memory-Mapped Files (mmap)",
    difficulty: "hard",
    stem: "A service loads a 4GB log-indexing file by calling read() into a heap buffer at startup, which takes 6 seconds and uses 4GB of RSS even though any given request only touches a few KB of the file. A teammate suggests mmap()-ing the file instead and letting the OS manage paging. After the change, startup is near-instant and RSS stays low until pages are actually touched. Why does mmap() behave this way?",
    options: [
      {
        text: "It maps the file address space into the process's page cache lazily, page faulting in data only as specific offsets are accessed.",
        sub: "Demand paging backs the mapping by the page cache",
        fix: "",
      },
      {
        text: "It imposes a maximum file size restriction that matches physical RAM, forcing the file system to truncate excessive data ranges.",
        sub: "Size limit forces partial load",
        fix: "mmap() can map files much larger than physical memory because the mapping is purely virtual. Pages are loaded into RAM only when accessed.",
      },
      {
        text: "It schedules asynchronous reading threads in the kernel to preload the file segments ahead of actual process instruction execution.",
        sub: "Async kernel-side read ahead",
        fix: "mmap() does not run background threads to load the entire file. The latency savings come from establishing virtual references instead of copying data.",
      },
      {
        text: "It runs a background hardware compression sweep that minimizes the resident memory footprint of the mapped pages after allocation.",
        sub: "Transparent compression reduces resident size",
        fix: "mmap() does not compress memory pages. RSS remains low simply because untouched virtual pages are never allocated in physical memory.",
      },
    ],
    correctIndex: 0,
    proTip: "mmap() turns 'load this whole file' into 'let page faults load it for me, one page at a time, backed by the page cache.' That's why startup time for mmap() is roughly O(1) regardless of file size, while read() into a buffer is O(file size).",
    lesson: "read() copies bytes from the page cache into a process buffer, so loading N bytes costs roughly N bytes of work and memory up front. mmap() instead establishes a virtual mapping to the file's page-cache pages; nothing is copied until the process actually touches a given page, at which point a page fault brings just that page in. This makes mmap() ideal for large files accessed sparsely or randomly, since cost scales with bytes actually touched, not file size.",
    remember: "mmap() defers work to page faults: virtual mapping is instant, RSS grows only as pages are actually touched, unlike read() which copies the whole file up front.",
    interviewAnswer: "The read() approach has to copy the entire 4GB from the page cache into a heap buffer before the process can do anything, so both the time and the RSS scale with file size. mmap() instead just sets up page-table entries pointing at the file's pages in the page cache — no data is copied at mmap() time. When the process actually touches a byte in a given page, that triggers a minor page fault, the kernel maps that one page in, and execution resumes. Since most requests only touch a few KB, you end up paying for exactly the bytes you use instead of the whole file, which explains both the instant startup and the low resident memory.",
  },
  {
    id: "q-os-cowfork-001",
    subject: "OS",
    concept: "Copy-on-Write fork()",
    difficulty: "medium",
    stem: `A pre-forking web server starts a master process that loads a large read-only ML model, consuming 800MB of memory. It then forks 8 worker processes. You run a process monitoring command and observe:

\`\`\`bash
$ ps -o pid,ppid,rss,cmd
  PID  PPID    RSS CMD
 4101  4100 819200 gunicorn: master
 4102  4101 821440 gunicorn: worker_1
 4103  4101 820980 gunicorn: worker_2
 4104  4101 822120 gunicorn: worker_3
...
$ free -m
              total        used        free      shared  buff/cache   available
Mem:          16384         980       12540         800        2864       14500
\`\`\`

Although each of the 8 workers reports over 800MB of Resident Set Size (RSS), the host's actual memory utilization has only increased by about 180MB since the workers were spawned. Which mechanical behavior of the kernel's memory management subsystem accounts for this difference?`,
    options: [
      {
        text: "The fork system call allocates virtual memory only for thread stacks, omitting the parent heap segment from the child's address space to avoid upfront data replication.",
        sub: "Heap is excluded from the child's address space",
        fix: "The fork() system call duplicates the parent's entire address space, including the heap. The child has access to all parent heap data, but it is backed by the parent's physical pages until a write occurs.",
      },
      {
        text: "The child processes share the parent's physical page table mappings read-only, delaying physical duplication of each page until a write operation triggers a page fault.",
        sub: "Pages are duplicated lazily, only on write",
        fix: "",
      },
      {
        text: "The process manager groups the workers into a single execution context where all state is managed via shared thread buffers instead of real OS-level processes.",
        sub: "Misreported process model",
        fix: "Pre-forking servers run separate OS-level processes, not threads or single contexts. The memory efficiency is due to kernel page sharing, not userspace runtime tricks.",
      },
      {
        text: "The kernel's background page merging daemon periodically scans the system RAM to identify and deduplicate duplicate blocks across processes with matching binary segments.",
        sub: "Kernel same-page merging scans and merges matching pages",
        fix: "While Kernel Samepage Merging (KSM) exists, it runs periodically as a background scanner and is not responsible for the immediate, zero-overhead sharing at fork time.",
      },
    ],
    correctIndex: 1,
    proTip: "Copy-on-write is why pre-fork server models (Gunicorn, Unicorn, PHP-FPM) are memory-efficient: load your big read-mostly data (models, config, code) once before forking, and every worker shares those physical pages for free until something actually mutates them.",
    lesson: "fork() gives the child process its own page tables, but initially points every entry at the same physical pages as the parent, marked read-only, with a copy-on-write flag set. No physical memory is duplicated at fork time. Only when either process writes to a shared page does the kernel trap the write, allocate a private physical copy for the writer, and let it proceed — so memory grows incrementally as pages are actually mutated, not all at once.",
    remember: "fork() shares physical pages copy-on-write; duplication only happens lazily per-page on the first write, which is why pre-fork workers don't multiply RSS by worker count.",
    interviewAnswer: "Right after fork(), the 8 children don't get their own physical copy of that 800MB — they get their own page tables, but every entry still points at the same physical pages the parent has, marked read-only with copy-on-write set. So memory usage barely moves at fork time because nothing was actually duplicated. As each worker runs and starts writing to its own request-local state — or even just touching reference counts in CPython objects — the kernel traps that write, copies just that one 4KB page for the writer, and lets it proceed. That's why you see RSS creep up gradually instead of jumping 8x immediately, and it's exactly why the pre-fork model is memory-efficient for read-mostly data like a loaded model.",
  },
  {
    id: "q-os-fdleak-001",
    subject: "OS",
    concept: "File Descriptor Limits / Leaks",
    difficulty: "medium",
    stem: `A high-throughput ingestion agent runs for several days before failing with:

\`\`\`text
Error: EMFILE: too many open files
\`\`\`

You inspect the file descriptors held by the process and see the following pattern:

\`\`\`text
$ lsof -p 20401
COMMAND   PID USER   FD   TYPE DEVICE SIZE/OFF    NODE NAME
ingest  20401 root    3r   REG   8,16       128 1004123 /app/config.json
ingest  20401 root    4r   REG   8,16       128 1004123 /app/config.json
ingest  20401 root    5r   REG   8,16       128 1004123 /app/config.json
ingest  20401 root    6r   REG   8,16       128 1004123 /app/config.json
...
\`\`\`

Every request handler opens \`config.json\` to parse settings. While the success path contains proper cleanup logic, the system eventually crashes under continuous load. What is the root cause?`,
    options: [
      {
        text: "The OS kernel dynamically reduces the process's file descriptor quota to reclaim page cache memory during periods of physical RAM pressure.",
        sub: "Dynamic quota reduction",
        fix: "The kernel never dynamically shrinks the process's file descriptor limits (RLIMIT_NOFILE) on its own; limits are fixed until changed by ulimit or setrlimit.",
      },
      {
        text: "An error path triggers an exception that bypasses the cleanup block, preventing file descriptor reclamation and leading to exhaustion.",
        sub: "Unhandled error path never reaches cleanup",
        fix: "",
      },
      {
        text: "The network layer fails to purge TCP connections in the TIME_WAIT state, causing orphaned sockets to occupy file descriptor entries.",
        sub: "Ephemeral socket exhaustion",
        fix: "Sockets in TIME_WAIT are closed from the process's perspective and do not consume file descriptor table entries in the process's file table.",
      },
      {
        text: "The local filesystem runs out of available inode indexes on disk, forcing the write stream to fail with an allocation limit error.",
        sub: "Inode exhaustion on the filesystem",
        fix: "EMFILE indicates the process-specific open file descriptor table is full. Filesystem inode exhaustion produces ENOSPC or ENFILE, not EMFILE.",
      },
    ],
    correctIndex: 1,
    proTip: "EMFILE almost always means 'something on an error path isn't calling close().' The fastest way to confirm: `ls -la /proc/<pid>/fd | wc -l` over time, then `lsof -p <pid>` to see what's piling up and never being released — usually one specific file or socket type tied to one code path.",
    lesson: "Every process has a finite number of file descriptor slots (RLIMIT_NOFILE, commonly 1024 by default). Each open() consumes one slot until a matching close() releases it. If an exception, early return, or error branch bypasses the cleanup code, that descriptor is never released even though the file object becomes unreachable — unlike memory, the kernel won't reclaim it until the process exits or the descriptor is explicitly closed. Over enough iterations, this exhausts the limit and open() starts failing with EMFILE.",
    remember: "EMFILE after long uptime = fd leak, usually a close() that's skipped on an error/exception path; check with lsof -p <pid> | wc -l trending up over time.",
    interviewAnswer: "Since the service is bounded in request rate but the open fd count keeps climbing forever, this has the signature of a classic resource leak rather than legitimate load — something is opening files faster than it's closing them. The fact that the success path calls close() but the bug only shows up after days strongly suggests an error or exception path that returns or throws before reaching the close(), so every failed request leaks one descriptor. Unlike memory, the kernel won't reclaim a leaked fd via garbage collection — it stays open until explicitly closed or the process exits — so it just accumulates until you hit RLIMIT_NOFILE and start seeing EMFILE. I'd confirm with lsof -p <pid> to see what's piling up, then wrap the open() in a try/finally or use a context manager so close() runs unconditionally.",
  },
  {
    id: "q-os-signal-001",
    subject: "OS",
    concept: "Signal Handling",
    difficulty: "hard",
    stem: `A Node.js server container is deployed on Kubernetes with a 30-second grace period. The app's logic includes a global try/finally block:

\`\`\`javascript
try {
    startHttpServer();
} finally {
    console.log("Flushing pending metrics and closing DB connections...");
    db.close();
}
\`\`\`

During a rolling deployment, the container is stopped. However, logs show that running HTTP requests are terminated instantly, and the finally block's log message never appears. What explains this immediate termination?`,
    options: [
      {
        text: "The process lacks an explicit SIGTERM signal handler, causing the kernel to apply the default signal disposition which kills the process instantly.",
        sub: "Default SIGTERM disposition is immediate termination",
        fix: "",
      },
      {
        text: "The runtime engine suspends the execution pipeline as soon as any signal is received, preventing any further asynchronous event execution.",
        sub: "Misapplied grace period scope",
        fix: "The event loop is not frozen by signals; if a signal handler were registered, it would run normally on the event loop or block execution to invoke the callback.",
      },
      {
        text: "The orchestrator sends an unblockable SIGKILL signal immediately, ignoring the grace period setting because no liveness probe was configured.",
        sub: "Uncatchable signal sent prematurely",
        fix: "Kubernetes sends SIGTERM first and respects the grace period. SIGKILL is sent only if the container fails to exit after the grace period expires.",
      },
      {
        text: "The try-finally statement blocks are language-level constructs that do not execute if the process receives any signals during execution.",
        sub: "Cleanup blocks are signal-independent",
        fix: "Finally blocks do run on normal exits or caught exceptions, but cannot execute if the process is terminated abruptly from outside by the OS before the stack is unwound.",
      },
    ],
    correctIndex: 0,
    proTip: "If your app needs to drain connections on shutdown, you must explicitly register a SIGTERM handler (or catch it in your framework's lifecycle hooks). Without one, the default disposition for SIGTERM is immediate termination — your finally blocks and cleanup code never get a chance to run.",
    lesson: "Every signal has a default disposition if the process hasn't installed a custom handler; for SIGTERM, the default is to terminate the process immediately, bypassing normal language-level cleanup like try/finally. Kubernetes' shutdown sequence sends SIGTERM, waits up to terminationGracePeriodSeconds, then sends SIGKILL (which truly cannot be caught or ignored) if the process hasn't exited. To drain in-flight requests gracefully, the application must register an explicit SIGTERM handler that stops accepting new work and waits for existing requests to finish before exiting.",
    remember: "No SIGTERM handler = default disposition kills the process immediately, skipping finally blocks; graceful shutdown requires explicitly catching SIGTERM, since only SIGKILL is truly uncatchable.",
    interviewAnswer: "This points to the app never having registered a SIGTERM handler. Kubernetes' shutdown sequence is to send SIGTERM and then wait up to the grace period before escalating to SIGKILL, but if the process doesn't install a handler for SIGTERM, the default disposition kicks in, which is immediate termination — and that bypasses normal language constructs like a finally block entirely, since the process never goes through its usual exit path. The fix is to explicitly catch SIGTERM in the application, stop accepting new connections, let in-flight requests finish, and then exit on its own — all within the grace period, so Kubernetes never needs to fall back to the uncatchable SIGKILL.",
  },
  {
    id: "q-os-oomkiller-001",
    subject: "OS",
    concept: "OOM Killer",
    difficulty: "hard",
    stem: `A Node.js API container running inside a Kubernetes cluster suddenly exits with exit code 137. There are no application stack traces or error logs. Running a node-level diagnostics command reveals the following log snippet:

\`\`\`text
[12045.678901] oom-kill:constraint=CONSTRAINT_MEMCG,nodemask=(null),cpuset=docker,mems_allowed=0,oom_memcg=/kubepods/burstable/pod123,task=node,pid=14205,uid=1000
[12045.678915] Memory cgroup out of memory: Killed process 14205 (node) total-vm:1248384kB, anon-rss:520192kB, file-rss:4096kB, shmem-rss:0kB
\`\`\`

What is the operational cause of this termination?`,
    options: [
      {
        text: "The runtime engine encountered a memory allocation limit in the JavaScript heap, throwing a fatal system exception that bypassed the application's global try-catch blocks.",
        sub: "CPU throttling triggers eviction",
        fix: "Heap exhaustion inside Node.js/V8 leads to an in-process fatal error (e.g., 'JavaScript heap out of memory') printed to stderr, not an external cgroup OOM-kill event logged by the kernel.",
      },
      {
        text: "The operating system detected a segmentation fault within a compiled native addon, triggering an immediate process dump and core generation.",
        sub: "Native code memory corruption",
        fix: "A segmentation fault (SIGSEGV) is triggered by illegal memory access within the process and generates a core dump or stack trace, rather than an out-of-memory cgroup termination.",
      },
      {
        text: "An external kernel mechanism terminated the process with a non-catchable signal because the memory utilization of the container exceeded its configured cgroup threshold.",
        sub: "External system memory termination",
        fix: "",
      },
      {
        text: "The container scheduler evicted the workload because the application process exceeded its allocated CPU shares, causing a thread scheduling deadlock.",
        sub: "Application-level exception suppressed",
        fix: "Exceeding CPU limits causes the kernel to throttle the process (limit CPU cycles) but does not trigger process termination or SIGKILL. Cgroup OOM kills are memory-driven.",
      },
    ],
    correctIndex: 2,
    proTip: "If a container dies with OOMKilled and zero application logs, stop looking in your app's exception handlers — none of them ran. Go straight to `dmesg` or `journalctl -k` on the node and look for the oom-killer's badness-score selection log; that's the kernel deciding to SIGKILL your process from outside its control entirely.",
    lesson: "When a cgroup (which is how container memory limits are enforced) hits its memory limit, the kernel's OOM killer steps in, picks a process to sacrifice based on an internal badness/oom_score heuristic, and sends it SIGKILL directly. This happens entirely outside the process's control — there's no exception to catch, no signal handler can intervene (SIGKILL is uncatchable), and no cleanup code runs. This is fundamentally different from an in-process memory error like a V8 heap exhaustion, which does produce an application-level error before crashing.",
    remember: "OOMKilled = kernel cgroup OOM killer SIGKILLs the process from outside; no exception, no handler, no cleanup runs — check dmesg/journalctl -k, not application logs.",
    interviewAnswer: "The absence of any application-level error is actually the biggest clue here — it tells you the process didn't die from something it could see or catch. When a container's cgroup memory usage crosses its limit, the kernel's OOM killer steps in from outside the process, picks a victim based on its oom_score, and sends it a SIGKILL directly. SIGKILL can't be caught or handled, so there's no exception, no finally block, no cleanup — the process just stops mid-instruction. That matches exactly what we're seeing: dmesg shows the kernel's own 'Out of memory: Killed process' log, which is the kernel's audit trail for an OOM kill, completely separate from anything Node's own error handling could have intercepted. Next step would be to profile what's actually growing — a leak, an unbounded cache, or just genuinely needing a higher memory limit.",
  },
  {
    id: "q-os-falsesharing-001",
    subject: "OS",
    concept: "CPU Cache Locality / False Sharing",
    difficulty: "hard",
    stem: `You are optimizing a high-performance multithreaded statistics library. You write the following parallel increment logic:

\`\`\`cpp
int counters[8]; // Aligned contiguously in memory

void worker_thread(int thread_id) {
    for (int i = 0; i < 10000000; ++i) {
        counters[thread_id]++;
    }
}
\`\`\`

Each thread executes on a separate core and accesses only its dedicated index. However, profiling shows CPU cycles are dominated by cache-line invalidation traffic, and the execution is slower than running sequentially. What physical mechanism causes this degradation?`,
    options: [
      {
        text: "The OS page directory enforces mutual exclusion on concurrent writes to adjacent memory locations inside the same physical page frame.",
        sub: "Scheduler-enforced serialization on arrays",
        fix: "The virtual memory system works at the page level (usually 4KB) and does not serialize or block concurrent writes to different parts of the same page.",
      },
      {
        text: "Unrelated variables accessed by different cores sit on the same cache line, causing each write to invalidate the line in the other cores' caches.",
        sub: "Cache-coherence traffic from co-located unrelated data",
        fix: "",
      },
      {
        text: "The pipeline execution unit serializes concurrent thread instructions when they reference the same base address in the stack pointer register.",
        sub: "Translation lookaside buffer pressure",
        fix: "The CPU pipeline does not serialize instructions across different execution cores based on base memory offsets unless there is a true registers dependency.",
      },
      {
        text: "The hardware memory controller blocks concurrent writes to adjacent array elements to prevent bit flip corruption in the DRAM bank.",
        sub: "Concurrent writes to the same memory location",
        fix: "The memory controller doesn't intervene to serialize concurrent writes to adjacent words; cache coherence protocols handle memory sync at the CPU level.",
      },
    ],
    correctIndex: 1,
    proTip: "The cache-coherence protocol operates at cache-line granularity (typically 64 bytes), not variable granularity. Eight 4-byte ints easily fit in one line, so even though each thread only writes its 'own' int, every write triggers a coherence invalidation across all cores caching that line. Fix: pad each counter to its own cache line, or use per-thread-local counters and aggregate at the end.",
    lesson: "False sharing happens when independent variables used by different threads happen to share a CPU cache line. Cache coherence protocols (like MESI) track ownership at the granularity of a full cache line, not individual variables, so when one core writes to its part of the line, the line is invalidated in every other core's cache, forcing a re-fetch over the interconnect. The threads have no logical dependency and no correctness issue, but they pay a heavy performance penalty from constant cache-line ping-ponging. The fix is padding or alignment so each thread's hot data occupies its own cache line.",
    remember: "False sharing = independent variables sharing one cache line; writes by one core invalidate it for all cores caching it, even with zero logical data dependency. Fix with padding/alignment to separate cache lines.",
    interviewAnswer: "There's no correctness bug here — each thread only ever touches its own array slot — but performance is suffering from false sharing. Cache coherence protocols track state at the granularity of a full 64-byte cache line, not individual 4-byte ints, and 8 ints packed into a 32-byte array almost certainly all land on the same line. So every time one thread increments its counter, the cache-coherence protocol has to invalidate that line in every other core's cache, forcing them to refetch it over the interconnect on their next access — even though logically the threads share nothing. perf c2c is exactly the tool for surfacing this, since it shows cache-line-level contention across cores. The standard fix is to pad each counter out to its own cache line, often 64 bytes, so each thread's writes stay local to its own line.",
  },
  {
    id: "q-os-spinlock-001",
    subject: "OS",
    concept: "Spinlocks vs Blocking Locks",
    difficulty: "medium",
    stem: "A kernel-level data structure is protected by a spinlock that's typically held for only a few nanoseconds (a handful of instructions). A new engineer proposes replacing it with a regular mutex (which sleeps the waiting thread and triggers a context switch) to 'be safer and avoid wasting CPU while waiting.' A senior engineer pushes back, saying that would make things slower, not safer. Who's right, and why?",
    options: [
      {
        text: "The senior engineer: the context switch overhead of a mutex significantly exceeds the brief CPU cycles spent busy-waiting for a nanosecond-scale critical section.",
        sub: "Context-switch overhead outweighs brief spin",
        fix: "",
      },
      {
        text: "Both are equally performant, as modern OS schedulers employ sophisticated techniques to minimize context switch overhead to near-zero latency.",
        sub: "Optimized schedulers nullify context-switch cost",
        fix: "Context switches are not free — saving/restoring registers, flushing or invalidating parts of the pipeline and TLB, and the eventual reschedule typically cost on the order of microseconds, which is enormous compared to a multi-nanosecond critical section.",
      },
      {
        text: "The new engineer: mutexes provide superior safety guarantees, inherently preventing priority inversion and deadlocks more effectively than spinlocks.",
        sub: "Blocking locks offer inherent safety mechanisms",
        fix: "Mutexes don't inherently prevent priority inversion — that requires a specific protocol like priority inheritance, which can be layered onto either blocking locks or spinlocks. Lock type alone doesn't decide that.",
      },
      {
        text: "The new engineer: busy-waiting consumes CPU resources inefficiently, making blocking mutexes a universally optimal choice for resource contention management.",
        sub: "Busy-waiting is always a resource drain",
        fix: "Whether spinning 'wastes' CPU depends entirely on hold time relative to context-switch cost — for very short critical sections, spinning is the cheaper option overall, which is precisely why kernels use spinlocks for exactly this case.",
      },
    ],
    correctIndex: 0,
    proTip: "Rule of thumb: spin if the expected wait is shorter than roughly two context switches' worth of time; block if it's longer. That's why kernels use spinlocks for short, interrupt-context-safe critical sections, and mutexes/semaphores for anything that might block on I/O or hold the lock for a while.",
    lesson: "A spinlock makes a waiting thread busy-loop, checking the lock repeatedly, which wastes CPU cycles but avoids a context switch. A blocking mutex instead puts the waiting thread to sleep and triggers a context switch, which has real, measurable overhead (saving/restoring state, scheduler bookkeeping, cache and TLB effects) typically on the order of microseconds. When the critical section is extremely short — common in kernel code — the cost of even two context switches (sleep, then wake) vastly exceeds the cost of just spinning until the lock frees up.",
    remember: "Spinlocks beat blocking mutexes when hold time is shorter than a context switch (~microseconds); for nanosecond-scale critical sections, spinning wastes less time than sleeping and waking a thread.",
    interviewAnswer: "The senior engineer is right. The whole tradeoff between spinlocks and blocking locks comes down to comparing the cost of busy-waiting against the cost of a context switch, and for a critical section that's only a handful of instructions, spinning is actually the cheaper option. A blocking mutex puts the waiting thread to sleep, which means a context switch out, scheduler bookkeeping, eventually a context switch back in, plus the cache and TLB churn that comes with running a different thread in between — all of that easily costs microseconds, which absolutely dwarfs a few nanoseconds of spinning. That's exactly why kernels use spinlocks for short, low-level critical sections — the busy-wait is wasted cycles, but it's far fewer wasted cycles than the alternative.",
  },
  {
    id: "q-os-syscall-001",
    subject: "OS",
    concept: "Syscall Overhead / User-Kernel Boundary",
    difficulty: "medium",
    stem: `A log-shipping daemon writes log entries to disk. Profiling the execution under heavy load reveals high CPU usage. Running an execution trace produces the following summary:

\`\`\`text
% time     seconds  usecs/call     calls    errors syscall
------ ----------- ----------- --------- --------- -----------
 94.20    4.120531           2   2000000           write
  3.15    0.137890          45      3000           openat
  2.65    0.115901          38      3000           close
\`\`\`

When the daemon is modified to buffer the log lines in a local memory array and write them in chunks of 500 lines, the CPU consumption drops by over 80%. Why does this optimization yield such a significant improvement?`,
    options: [
      {
        text: "It allows the OS block layer to bypass the buffer cache and perform direct-memory-access (DMA) operations directly to the physical storage device.",
        sub: "Observer effect from tracing",
        fix: "Buffered writes still go through the kernel's page/buffer cache unless the file is opened with O_DIRECT; batching does not change the caching layer usage.",
      },
      {
        text: "It minimizes the frequency of privilege mode transitions and execution context saves required to cross the user-kernel boundary.",
        sub: "Mode-switch cost is paid per call, not per byte",
        fix: "",
      },
      {
        text: "It prevents the kernel scheduler from prioritizing other concurrent processes, ensuring uninterrupted CPU time slices for the daemon.",
        sub: "Kernel-imposed syscall throttling",
        fix: "Batching writes doesn't alter scheduling priorities or lock the CPU; it simply reduces the CPU cycles spent executing kernel-user transitions.",
      },
      {
        text: "It avoids triggering synchronous block-level file allocation writes on the storage drive for each small update, reducing controller latency.",
        sub: "Synchronous disk flush per write()",
        fix: "Standard write() calls are asynchronous with respect to disk I/O; they write to the page cache, so they do not block on physical disk allocation write.",
      },
    ],
    correctIndex: 1,
    proTip: "Every syscall pays a fixed 'toll' for crossing the user/kernel boundary — saving registers, switching page tables or privilege level, kernel-side validation — typically in the hundreds of nanoseconds, regardless of payload size. That's the whole rationale behind buffered I/O (stdio's fwrite, or app-level batching): convert N small syscalls into 1 big one and pay the toll once.",
    lesson: "System calls require a transition from unprivileged user mode to privileged kernel mode, which involves a trap/mode switch, often a change in security context, and kernel-side argument validation — work that is largely fixed-cost, independent of the amount of data the call actually moves. When an application makes many small syscalls, it pays this fixed overhead repeatedly for very little data each time. Buffering writes in userspace and flushing in larger batches amortizes that fixed per-call cost over much more data, which is why batching syscalls is a standard performance technique for I/O-heavy code.",
    remember: "Every syscall pays a fixed user-to-kernel mode-switch cost regardless of payload size; batching many small writes into fewer large ones amortizes that fixed cost over more data.",
    interviewAnswer: "The key insight is that the cost of a syscall isn't proportional to how much data it moves — crossing from user mode into kernel mode has a largely fixed overhead, from the trap itself to saving and restoring register state to kernel-side validation, and that toll gets paid on every single call regardless of payload size. When you're calling write() once per log line, you're paying that fixed cost thousands of times a second for just a few bytes each time, so the per-call overhead ends up dominating over the actual data-transfer cost. Buffering in userspace and flushing every few hundred lines means you pay that fixed transition cost once per batch instead of once per line, which is exactly the kind of overhead strace -c was surfacing as a disproportionate amount of time spent in write() relative to bytes transferred.",
  },
  {
    id: "q-os-zombie-001",
    subject: "OS",
    concept: "Zombie Process Accumulation",
    difficulty: "medium",
    stem: `A containerized batch-job runner spawns short-lived child processes. After running for several days, the container fails to fork new processes, and you run a diagnostic check:

\`\`\`text
$ ps aux
USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
root     12401  0.0  0.0      0     0 ?        Z    01:22   0:00 [job_worker] <defunct>
root     12405  0.0  0.0      0     0 ?        Z    01:23   0:00 [job_worker] <defunct>
root     12409  0.0  0.0      0     0 ?        Z    01:24   0:00 [job_worker] <defunct>
...
\`\`\`

Why do these terminated processes remain in the system table and consume PID resources?`,
    options: [
      {
        text: "The kernel's process scheduler is actively deprioritizing the cleanup routines for short-lived, finished processes in favor of allocating resources to active jobs.",
        sub: "Scheduler defers cleanup for active processes",
        fix: "There's no scheduler-level deferral of process cleanup based on priority — zombie persistence is specifically about whether wait()/waitpid() has been called by the parent, not scheduling priority.",
      },
      {
        text: "The container's strict memory limits prevent the operating system from fully deallocating kernel structures of finished processes, leaving them partially alive.",
        sub: "Kernel resource reclamation impeded by memory",
        fix: "Zombie processes consume almost no memory — just a process table entry holding exit status and a few accounting fields. Their persistence is about an un-reaped exit status, not memory limits.",
      },
      {
        text: "The kernel retains the process ID and exit status of a terminated child until its parent explicitly invokes `wait()` or `waitpid()` to retrieve these resources.",
        sub: "Parent required to collect exit status",
        fix: "",
      },
      {
        text: "The `exec()` system call silently failed for child processes, meaning they are still actively running their original program context instead of the intended job.",
        sub: "Unsuccessful `exec()` maintains old context",
        fix: "A 'Z' (defunct) state in `ps` specifically means the process has already terminated and exited — it isn't still running, hidden or otherwise; that state only exists for processes the kernel is holding onto post-exit for their parent.",
      },
    ],
    correctIndex: 2,
    proTip: "In containers this is especially nasty because PID 1 inside the container is usually your application, not a real init system — and PID 1 has the special job of reaping orphaned/zombie processes. If your app doesn't call wait() and isn't built to act as a mini-init, zombies pile up until you hit the container's PID limit. That's exactly why tools like tini or dumb-init exist: run them as PID 1 to reap zombies for you.",
    lesson: "When a child process terminates, it doesn't fully disappear immediately — the kernel keeps a minimal process table entry (the zombie, state Z) holding its exit status so the parent can retrieve it via wait() or waitpid(). Only after the parent reaps that status is the process table entry actually freed. If the parent never calls wait(), zombies accumulate indefinitely, each consuming a PID and a process table slot, eventually exhausting the PID limit even though they use almost no other resources.",
    remember: "Zombie (Z) processes are terminated children whose exit status hasn't been reaped via wait()/waitpid(); they hold a PID slot until reaped, and accumulate forever if the parent never calls wait().",
    interviewAnswer: "This is exactly what zombie processes look like. When a child process exits, the kernel doesn't immediately free its process table entry — it holds onto the exit status in a minimal 'zombie' state so the parent can retrieve it with wait() or waitpid(). If the parent, the job runner in this case, never calls wait(), that exit status is never collected, so the zombie just sits there forever holding a PID. Since each zombie still occupies a PID slot even though it's not doing any real work, enough of them accumulate to exhaust the container's PID limit and you can't fork anything new. The fix is to actually reap children with wait()/waitpid() after each job, or run an init process like tini as PID 1 inside the container, since PID 1 has the special responsibility of reaping orphaned and zombie processes.",
  },
  {
    id: "q-os-epoll-001",
    subject: "OS",
    concept: "epoll / Event-Driven I/O vs Blocking I/O",
    difficulty: "hard",
    stem: "A chat server originally spawned one thread per client connection, each blocked on a synchronous `read()` waiting for that client's next message. At 2,000 concurrent connections, the server was spending most of its time on thread scheduling and context switching, with most threads idle waiting on I/O. Rewriting it around a single-threaded event loop using `epoll` to wait on all 2,000 sockets at once dramatically cut CPU usage and let it scale to 50,000 connections. What does epoll fundamentally let the server avoid?",
    options: [
      {
        text: "All context switching between user and kernel space by keeping application data processing entirely within the kernel's execution context.",
        sub: "Kernel-native application data handling.",
        fix: "epoll reduces *thread* context switches by multiplexing I/O, but it still requires the application to retrieve and process data in userspace, necessitating user-kernel transitions for each read or write operation.",
      },
      {
        text: "The requirement for kernel involvement in network I/O, instead enabling direct memory access (DMA) between the NIC and userspace buffers.",
        sub: "Direct hardware-to-userspace data transfer.",
        fix: "epoll is an OS-level mechanism for I/O multiplexing; it operates within the kernel's networking stack and does not bypass it or directly manage hardware DMA to userspace. That functionality is handled by specialized kernel-bypass solutions like DPDK.",
      },
      {
        text: "The significant CPU and memory overhead associated with dedicating a blocked operating system thread to every idle client connection.",
        sub: "Efficient single-thread I/O readiness management.",
        fix: "",
      },
      {
        text: "Guaranteed sub-millisecond message latency and deterministic, priority-ordered processing across all active network connections.",
        sub: "Deterministic, low-latency priority queueing.",
        fix: "epoll provides a notification mechanism for readiness, not guaranteed low latency or strict priority-based processing for data. Its primary benefit is scalability via reduced thread overhead, not per-message timing or ordering.",
      },
    ],
    correctIndex: 2,
    proTip: "The core problem with thread-per-connection at scale isn't the I/O itself, it's that every idle connection still ties up an OS thread's stack, kernel scheduling slot, and context-switch overhead. epoll flips the model: instead of N threads each blocked asking 'is my socket ready yet?', one thread asks the kernel once, 'which of these N sockets are ready?' — turning an O(threads) scheduling problem into an O(1) thread, O(ready sockets) work problem.",
    lesson: "Thread-per-connection blocking I/O scales poorly because each idle connection still consumes a full OS thread, with its own stack memory and a slot in the scheduler's run queue, even while doing nothing but waiting. epoll (and similar mechanisms like kqueue) lets a single thread register interest in many file descriptors and then make one syscall that blocks until any of them become ready, returning just the ready subset. This collapses thousands of blocked threads into one thread handling an event loop, eliminating the per-connection thread and context-switch overhead that dominated the original design.",
    remember: "epoll replaces 'one blocked thread per idle connection' with 'one thread asking the kernel which of N sockets are ready,' collapsing per-connection thread/scheduling overhead — that's why event loops scale past thread-per-connection models.",
    interviewAnswer: "The thread-per-connection model's real cost isn't the I/O — it's that every single idle connection, even one sitting there for minutes doing nothing, still occupies a full OS thread with its own stack and a slot the scheduler has to consider on every reschedule. At 2,000 connections, most of those threads are blocked doing nothing, but the kernel is still paying scheduling and context-switch overhead managing all of them. epoll flips that model: instead of thousands of threads each independently blocked asking 'is my socket ready,' you have one thread that registers all 2,000 sockets with the kernel and makes a single blocking call that returns only the subset that's actually ready to read or write. That collapses an O(number of connections) threading and scheduling problem into a single thread doing an event loop, which is exactly why it scales to tens of thousands of connections where thread-per-connection falls over.",
  },
];
