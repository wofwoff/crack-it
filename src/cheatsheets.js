// Cheatsheet content for Cracked.
// Structured by subject, then topic (which matches question.concept / prompt.concept), with subtopics and brief explanations.

export const CHEATSHEETS = {
  DBMS: [
    {
      topic: "Isolation Levels",
      brief: "Controls how transaction changes are visible to concurrent operations to maintain data integrity.",
      subtopics: [
        { name: "Dirty Read", explanation: "Reading uncommitted data that might roll back, leading to invalid reads." },
        { name: "Non-repeatable Read", explanation: "Reading a row twice in a transaction and seeing different values due to a concurrent update." },
        { name: "Phantom Read", explanation: "Running a range query twice and seeing new rows inserted or deleted by another transaction." },
        { name: "Isolation Levels", explanation: "Read Uncommitted (fastest, no locks), Read Committed (no dirty reads), Repeatable Read (no non-repeatable reads), and Serializable (full range locking, slowest)." }
      ]
    },
    {
      topic: "Indexing",
      brief: "Data structures used to speed up retrieval of rows from tables at the cost of additional write overhead.",
      subtopics: [
        { name: "B-Tree Indexes", explanation: "Self-balancing trees that support range queries, sorted retrieval, and equality lookups. Must search left-to-right on prefix keys." },
        { name: "Hash Indexes", explanation: "High-speed O(1) equality check indexes, but do not support range scans or ordering." },
        { name: "Composite Index", explanation: "Index on multiple columns. Order matters: place equality filters first, then range/sort filters." },
        { name: "Covering Index", explanation: "An index that contains all columns requested by a query, allowing the database to skip table heap lookups entirely." }
      ]
    },
    {
      topic: "Normalization",
      brief: "Process of organizing data in a database to reduce redundancy and improve data integrity.",
      subtopics: [
        { name: "1NF (First Normal Form)", explanation: "Each table cell must contain atomic values, and each record must be unique." },
        { name: "2NF (Second Normal Form)", explanation: "Must be in 1NF and have no partial dependencies (every non-prime attribute depends on the entire primary key)." },
        { name: "3NF (Third Normal Form)", explanation: "Must be in 2NF and have no transitive dependencies (non-prime attributes depend only on the primary key)." },
        { name: "BCNF (Boyce-Codd Normal Form)", explanation: "For every non-trivial functional dependency X -> Y, X must be a super key." }
      ]
    },
    {
      topic: "ACID",
      brief: "Core properties ensuring database transactions are processed reliably.",
      subtopics: [
        { name: "Atomicity", explanation: "All operations in a transaction succeed, or the entire transaction is rolled back ('All or nothing')." },
        { name: "Consistency", explanation: "A transaction must transition the database from one valid state to another, maintaining constraints." },
        { name: "Isolation", explanation: "Concurrent execution of transactions results in a state equivalent to serial execution." },
        { name: "Durability", explanation: "Once committed, changes survive system failures (written to write-ahead logs / non-volatile storage)." }
      ]
    },
    {
      topic: "Joins",
      brief: "Combines rows from two or more tables based on a related column.",
      subtopics: [
        { name: "Inner Join", explanation: "Returns records with matching values in both tables." },
        { name: "Left / Right Outer Join", explanation: "Returns all records from the left (or right) table, and matched records from the other table." },
        { name: "Full Outer Join", explanation: "Returns all records when there is a match in either left or right table." },
        { name: "Cross Join", explanation: "Returns the Cartesian product of the two tables." }
      ]
    },
    {
      topic: "Concurrency Control",
      brief: "Techniques used to handle conflicts when multiple transactions access the database concurrently.",
      subtopics: [
        { name: "Pessimistic Locking", explanation: "Acquires locks on records before modifying them to block concurrent access." },
        { name: "Optimistic Locking", explanation: "Checks for conflicts (e.g., using versions or timestamps) at commit time; rolls back if conflict is found." },
        { name: "Two-Phase Locking (2PL)", explanation: "Growing phase (acquires locks) followed by a shrinking phase (releases locks). Ensures serializability." },
        { name: "MVCC (Multi-Version Concurrency Control)", explanation: "Creates logical snapshots of data per transaction, allowing reads to proceed without locking writes." }
      ]
    },
    {
      topic: "CAP Theorem",
      brief: "A distributed system can guarantee at most two out of three: Consistency, Availability, and Partition Tolerance.",
      subtopics: [
        { name: "Consistency (CAP)", explanation: "Every read receives the most recent write or an error." },
        { name: "Availability (CAP)", explanation: "Every non-failing node returns a non-error response (without guarantee it contains the latest write)." },
        { name: "Partition Tolerance", explanation: "The system continues to operate despite network partition/message drops. Essential in real distributed networks." }
      ]
    },
    {
      topic: "Sharding",
      brief: "Horizontal partitioning of data across multiple database engines or machines.",
      subtopics: [
        { name: "Horizontal vs Vertical Partitioning", explanation: "Horizontal splits rows across servers (sharding); vertical splits columns into separate tables." },
        { name: "Shard Key", explanation: "The key used to distribute rows. Choosing a bad key leads to hot spots or query broadcasts." },
        { name: "Consistent Hashing", explanation: "Algorithmic mapping of keys to shards that minimizes rehashing when nodes are added or removed." }
      ]
    },
    {
      topic: "Deadlock",
      brief: "A state where two or more transactions are blocked, each waiting for locks held by the other.",
      subtopics: [
        { name: "Detection & Prevention", explanation: "Engines run lock-graph cycle detection to abort one transaction, or use timeouts." },
        { name: "Avoidance Tactics", explanation: "Acquire locks in a fixed global order, keep transactions short, and use lower isolation levels if safe." }
      ]
    },
    {
      topic: "Denormalization",
      brief: "Adding redundant data intentionally to speed up complex queries.",
      subtopics: [
        { name: "Trade-offs", explanation: "Improves read performance but slows down writes and increases disk usage." },
        { name: "Implementation", explanation: "Used in data warehouses, reporting replicas, or via pre-computed materialized views." }
      ]
    },
    {
      topic: "Keys & Constraints",
      brief: "Rules enforced on data columns to maintain database consistency and structure.",
      subtopics: [
        { name: "Primary vs Unique Key", explanation: "Primary Key uniquely identifies a row and cannot be NULL. Unique Key ensures uniqueness but allows one NULL value." },
        { name: "Foreign Key Constraints", explanation: "Maintains referential integrity between tables, defining cascades on delete or update." }
      ]
    },
    {
      topic: "Query Optimization",
      brief: "The process of selecting the most efficient query execution plan.",
      subtopics: [
        { name: "EXPLAIN Plan", explanation: "Analyzer output showing scans (Seq Scan vs Index Scan), cost estimates, and join methods." },
        { name: "N+1 Query Problem", explanation: "Executing one query to fetch parent records and then N separate queries to fetch child records. Solved with eager loading/joins." }
      ]
    }
  ],
  OS: [
    {
      topic: "CPU Scheduling",
      brief: "Determines which process gets the CPU when another is blocked or suspended.",
      subtopics: [
        { name: "Scheduling Algorithms", explanation: "FCFS (non-preemptive), SJF (shortest job first), Round Robin (time slices, preemptive), Priority Scheduling." },
        { name: "Preemptive vs Non-Preemptive", explanation: "Preemptive can interrupt a running process (e.g. RR); non-preemptive runs a process until it terminates or blocks." },
        { name: "Starvation", explanation: "Low-priority processes wait indefinitely. Resolved using 'aging' (increasing priority over time)." }
      ]
    },
    {
      topic: "Deadlock",
      brief: "A cycle of dependency where processes are blocked waiting for resources held by each other.",
      subtopics: [
        { name: "Coffman Conditions", explanation: "Four necessary conditions: Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait." },
        { name: "Banker's Algorithm", explanation: "Resource allocation algorithm used to avoid deadlocks by simulating allocations and verifying if safe states exist." },
        { name: "Detection and Recovery", explanation: "Let deadlocks occur, detect them via resource-graphs, and recover by killing processes or preempting resources." }
      ]
    },
    {
      topic: "Virtual Memory",
      brief: "Maps program-visible addresses to physical hardware addresses, isolating process memory spaces.",
      subtopics: [
        { name: "Paging", explanation: "Splits virtual memory into fixed-size pages and physical memory into frames. Uses Page Tables to map them." },
        { name: "TLB (Translation Lookaside Buffer)", explanation: "A hardware cache storing recent virtual-to-physical address translations to avoid dual memory accesses." },
        { name: "Page Fault", explanation: "Interrupt triggered when a process requests a page not currently resident in physical memory (RAM), requiring loading from disk." }
      ]
    },
    {
      topic: "Thrashing",
      brief: "A state where the system spends more time swapping pages in and out of disk than executing processes.",
      subtopics: [
        { name: "Causes & Fixes", explanation: "Occurs when available physical RAM is insufficient for the working sets of active processes. Fix by reducing multi-programming or adding RAM." },
        { name: "Working Set Model", explanation: "Tracks the set of pages actively used by a process in a recent time interval to allocate frames efficiently." }
      ]
    },
    {
      topic: "Synchronization",
      brief: "Coordinating execution of concurrent processes to prevent race conditions on shared data.",
      subtopics: [
        { name: "Critical Section", explanation: "The block of code where shared resources are accessed. Only one process should enter at a time." },
        { name: "Race Condition", explanation: "Occurs when output depends on the execution sequence/timing of concurrent threads." },
        { name: "Peterson's Solution", explanation: "Classic software algorithm for mutual exclusion between two processes using flags and turn variables." }
      ]
    },
    {
      topic: "Semaphores",
      brief: "Variables used to control access to common resources in concurrent systems.",
      subtopics: [
        { name: "Binary Semaphore", explanation: "Value ranges only between 0 and 1 (similar to a Mutex but lacks ownership concept)." },
        { name: "Counting Semaphore", explanation: "Value represents available resource units, decremented on acquire (P) and incremented on release (V)." },
        { name: "Producer-Consumer Problem", explanation: "Classic sync problem where buffers are filled and emptied, coordinated via semaphores." }
      ]
    },
    {
      topic: "Process vs Thread",
      brief: "Different execution models in operating systems.",
      subtopics: [
        { name: "Process", explanation: "An independent program execution unit with its own virtual address space, file descriptors, and memory." },
        { name: "Thread", explanation: "A lightweight unit of execution within a process. Threads share the parent process's memory space but have their own stacks." },
        { name: "Context Switch", explanation: "Saving the state of a CPU thread/process and loading another. Thread context switches are faster than process context switches." }
      ]
    },
    {
      topic: "Page Replacement",
      brief: "Algorithms used to select which memory page to swap out when a new page is needed.",
      subtopics: [
        { name: "FIFO", explanation: "First-In, First-Out. Suffers from Belady's Anomaly (more page frames can cause more page faults)." },
        { name: "LRU (Least Recently Used)", explanation: "Replaces the page that hasn't been accessed for the longest time. High overhead to implement perfectly." },
        { name: "Optimal (OPT)", explanation: "Replaces the page that will not be used for the longest duration in the future. Theoretical baseline only." }
      ]
    },
    {
      topic: "Processes & fork",
      brief: "Creating and managing processes in Unix-like systems.",
      subtopics: [
        { name: "fork()", explanation: "Creates a child process by duplicating the calling process. Returns 0 in child, child's PID in parent." },
        { name: "Zombie Process", explanation: "A terminated process whose entry still exists in the process table because the parent hasn't read its exit status." },
        { name: "Orphan Process", explanation: "A process whose parent has terminated. Adopted by the 'init' system process (PID 1)." }
      ]
    },
    {
      topic: "Locks & Mutexes",
      brief: "Mutual exclusion locks used to prevent concurrent access to critical sections.",
      subtopics: [
        { name: "Mutex", explanation: "Mutual exclusion lock with an owner. Only the thread that locks it can unlock it." },
        { name: "Spinlock", explanation: "A lock where a thread loops continuously ('spins') waiting for the lock. Fast for short waits, wastes CPU for long ones." },
        { name: "Reentrant Lock", explanation: "Allows a thread to acquire the same lock multiple times without deadlocking itself." }
      ]
    },
    {
      topic: "IPC",
      brief: "Inter-Process Communication mechanisms allowing processes to exchange data.",
      subtopics: [
        { name: "Pipes", explanation: "Unidirectional data channel (anonymous pipes for parent-child, named pipes for unrelated processes)." },
        { name: "Shared Memory", explanation: "Fastest IPC. Maps a memory block to the address space of multiple processes; requires synchronization (e.g. semaphores)." },
        { name: "Message Queues / Sockets", explanation: "OS-managed queues for message passing, or network sockets for local/remote communication." }
      ]
    },
    {
      topic: "Context Switching",
      brief: "Mechanism of storing state of a CPU task so it can be resumed later.",
      subtopics: [
        { name: "Overhead", explanation: "Involves saving registers, program counters, flushing caches (for processes), and loading new states." },
        { name: "Interrupt Handling", explanation: "Hardware interrupts trigger context switches to OS interrupt service routines." }
      ]
    }
  ],
  CN: [
    {
      topic: "TLS Handshake",
      brief: "Secures TCP connections via cryptographic negotiation, validating identities and generating session keys.",
      subtopics: [
        { name: "Asymmetric vs Symmetric Crypto", explanation: "Asymmetric (Public/Private keys) is used to verify certificates and exchange a key; Symmetric (shared key) encrypts application data." },
        { name: "Handshake Steps", explanation: "1. ClientHello, 2. ServerHello & Certificate, 3. Key Exchange (DH/RSA), 4. Finished. TLS 1.3 reduces this to 1 Round Trip Time (RTT)." }
      ]
    },
    {
      topic: "Caching",
      brief: "Storing resources close to the client to avoid redundant network round trips.",
      subtopics: [
        { name: "Cache-Control Headers", explanation: "no-store (never cache), no-cache (must revalidate with server), max-age (validity duration in seconds)." },
        { name: "ETag and Last-Modified", explanation: "Conditional requests using 'If-None-Match' (ETag) or 'If-Modified-Since'. Returns 304 Not Modified if unchanged." },
        { name: "CDN Caching", explanation: "Caching static assets at edge servers physically close to users." }
      ]
    },
    {
      topic: "TCP vs UDP",
      brief: "The two primary transport layer protocols with distinct performance and reliability trade-offs.",
      subtopics: [
        { name: "TCP (Transmission Control Protocol)", explanation: "Connection-oriented, reliable (guarantees delivery and order via ACKs/Sequence numbers), flow/congestion control, higher latency." },
        { name: "UDP (User Datagram Protocol)", explanation: "Connectionless, unreliable (best-effort, no ACKs), lightweight, low latency (ideal for DNS, video streaming, gaming)." }
      ]
    },
    {
      topic: "DNS",
      brief: "Domain Name System resolves human-readable domain names to machine-readable IP addresses.",
      subtopics: [
        { name: "DNS Records", explanation: "A (IPv4 mapping), AAAA (IPv6 mapping), CNAME (canonical alias), MX (mail servers), TXT (text verification)." },
        { name: "Recursive vs Iterative Queries", explanation: "Recursive queries demand the final IP from the DNS resolver; iterative queries return referrals to other DNS servers (Root -> TLD -> Authoritative)." }
      ]
    },
    {
      topic: "HTTP Status Codes",
      brief: "Standardized numeric responses from web servers indicating outcome of requests.",
      subtopics: [
        { name: "2xx Success", explanation: "200 OK, 201 Created, 204 No Content (successful request with empty body)." },
        { name: "3xx Redirection", explanation: "301 Moved Permanently, 302 Found (temporary), 304 Not Modified (cached version is valid)." },
        { name: "4xx Client Errors", explanation: "400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict." },
        { name: "5xx Server Errors", explanation: "500 Internal Server Error, 502 Bad Gateway, 503 Service Unavailable, 504 Gateway Timeout." }
      ]
    },
    {
      topic: "Congestion Control",
      brief: "TCP algorithms designed to prevent network collapse by limiting data transmission rates.",
      subtopics: [
        { name: "Slow Start", explanation: "Starts with small window (CWND) and doubles it every RTT until it hits threshold (SSTHRESH)." },
        { name: "Congestion Avoidance", explanation: "Increases CWND linearly (+1 per RTT) once threshold is hit." },
        { name: "Fast Retransmit & Recovery", explanation: "Triggers retransmission immediately on receiving 3 duplicate ACKs, instead of waiting for timeout." }
      ]
    },
    {
      topic: "Load Balancing",
      brief: "Distributing incoming traffic across multiple servers to ensure availability and prevent overload.",
      subtopics: [
        { name: "Algorithms", explanation: "Round Robin (sequential), Least Connections (routes to idle servers), IP Hash (routes same IP to same server for session sticky)." },
        { name: "Layer 4 vs Layer 7", explanation: "Layer 4 operates on transport layer (TCP/IP level, fast routing); Layer 7 inspects application data (HTTP headers, cookies, paths)." }
      ]
    },
    {
      topic: "REST & Idempotency",
      brief: "Architectural style for web services and predictability of HTTP methods.",
      subtopics: [
        { name: "HTTP Methods", explanation: "GET (read), POST (create), PUT (replace), PATCH (update), DELETE." },
        { name: "Idempotency", explanation: "An operation is idempotent if running it multiple times produces the same server state. GET, PUT, and DELETE are idempotent. POST is NOT." }
      ]
    },
    {
      topic: "IP Addressing & Subnets",
      brief: "Addressing schemes and network segmentation.",
      subtopics: [
        { name: "IPv4 vs IPv6", explanation: "IPv4 uses 32-bit addresses (approx 4.3B addresses); IPv6 uses 128-bit hexadecimal addresses." },
        { name: "CIDR Notation", explanation: "Classless Inter-Domain Routing (e.g. /24 indicates 24 network bits and 8 host bits, giving 256 addresses)." }
      ]
    },
    {
      topic: "CORS",
      brief: "Cross-Origin Resource Sharing is a browser security mechanism restricting cross-origin requests.",
      subtopics: [
        { name: "Same-Origin Policy (SOP)", explanation: "Blocks reading resources from origins (protocol, domain, port) different from the page origin." },
        { name: "Preflight Request", explanation: "Browser sends an HTTP OPTIONS request before complex requests to check if server allows the cross-origin method." }
      ]
    },
    {
      topic: "HTTP/1.1 vs HTTP/2",
      brief: "Evolution of the application-layer web protocol.",
      subtopics: [
        { name: "HTTP/1.1 Problems", explanation: "Head-of-Line (HOL) blocking where one slow request delays all subsequent requests in a TCP connection." },
        { name: "HTTP/2 Enhancements", explanation: "Multiplexing (multiple requests/responses over one TCP connection), binary framing, header compression (HPACK), server push." }
      ]
    },
    {
      topic: "Sessions & Cookies",
      brief: "Techniques for maintaining stateful data in stateless HTTP environments.",
      subtopics: [
        { name: "Cookies", explanation: "Small key-value data sent by server in Set-Cookie and returned by browser on future requests." },
        { name: "Cookie Security", explanation: "HttpOnly (prevents access via JS/XSS), Secure (transmits only over HTTPS), SameSite (Strict/Lax/None controls CSRF)." },
        { name: "Session vs JWT", explanation: "Sessions store state on server (client holds session ID); JWT (JSON Web Token) stores cryptographically signed state directly on client." }
      ]
    },
    {
      topic: "NAT",
      brief: "Network Address Translation maps private local IP addresses to a public internet address.",
      subtopics: [
        { name: "Purpose", explanation: "Conserves public IPv4 addresses and adds security by hiding internal network topologies." }
      ]
    }
  ],
  OOP: [
    {
      topic: "SOLID",
      brief: "Five design principles making software designs more understandable, flexible, and maintainable.",
      subtopics: [
        { name: "SRP (Single Responsibility)", explanation: "A class should have only one reason to change, meaning it performs one job." },
        { name: "OCP (Open/Closed)", explanation: "Software entities should be open for extension but closed for modification." },
        { name: "LSP (Liskov Substitution)", explanation: "Subtypes must be substitutable for their base types without altering correctness." },
        { name: "ISP (Interface Segregation)", explanation: "Clients should not be forced to depend on methods they do not use (prefer small, focused interfaces)." },
        { name: "DIP (Dependency Inversion)", explanation: "High-level modules should not depend on low-level modules. Both should depend on abstractions." }
      ]
    },
    {
      topic: "Single Responsibility",
      brief: "Ensuring a component has one clear role or reason to exist.",
      subtopics: [
        { name: "Identification", explanation: "If a class handles database access, data validation, and email alerts, it violates SRP." },
        { name: "Resolution", explanation: "Refactor into dedicated classes: DatabaseRepository, UserValidator, and NotificationService." }
      ]
    },
    {
      topic: "Liskov Substitution",
      brief: "Ensuring subclass behaviors match base class contracts.",
      subtopics: [
        { name: "Violation Example", explanation: "A Square class inheriting from Rectangle where setting width modifies height, violating Rectangle expectations." },
        { name: "Fix", explanation: "Avoid inheritance for behavioral mismatches; use composition or interface implementations instead." }
      ]
    },
    {
      topic: "Composition vs Inheritance",
      brief: "Two ways to reuse code and define relationships between classes.",
      subtopics: [
        { name: "Inheritance", explanation: "Defines an 'IS-A' relationship. Tight coupling; changes in base class cascade to subclasses." },
        { name: "Composition", explanation: "Defines a 'HAS-A' relationship. Loose coupling; components are easily swapped at runtime." }
      ]
    },
    {
      topic: "Encapsulation",
      brief: "Bundling data and methods into a single unit and restricting direct access to object internals.",
      subtopics: [
        { name: "Access Modifiers", explanation: "Private (accessible only within class), Protected (class and subclasses), Public (accessible anywhere)." },
        { name: "Benefits", explanation: "Protects object invariants, hides implementation details, and reduces coupling." }
      ]
    },
    {
      topic: "Polymorphism",
      brief: "Ability of different objects to respond to the same method call in their own unique way.",
      subtopics: [
        { name: "Compile-time (Static)", explanation: "Method Overloading: Same method name with different parameters resolved at compile time." },
        { name: "Runtime (Dynamic)", explanation: "Method Overriding: Subclass redefines virtual methods of a parent, resolved at runtime via vtables." }
      ]
    },
    {
      topic: "Factory Pattern",
      brief: "Creational design pattern providing an interface for creating objects in a superclass but letting subclasses alter the type.",
      subtopics: [
        { name: "Simple Factory", explanation: "Encapsulates instantiation logic into a helper class based on inputs." },
        { name: "Factory Method", explanation: "Defines an abstract method in a base class, delegating object creation to child classes." }
      ]
    },
    {
      topic: "Strategy Pattern",
      brief: "Behavioral design pattern that lets you define a family of algorithms, encapsulate each, and make them interchangeable at runtime.",
      subtopics: [
        { name: "Implementation", explanation: "Pass a interface reference (e.g. PaymentStrategy) to a context object (e.g. Checkout), permitting runtime strategy changes." }
      ]
    },
    {
      topic: "Coupling & Cohesion",
      brief: "Software metrics measuring relationships between modules and focus within a module.",
      subtopics: [
        { name: "Coupling", explanation: "Degree of interdependence between modules. Aim for Loose Coupling (modifying A doesn't break B)." },
        { name: "Cohesion", explanation: "Degree of focus within a module. Aim for High Cohesion (all parts of a class belong together)." }
      ]
    },
    {
      topic: "Abstraction",
      brief: "Hiding complex details and showing only the essential features of an object.",
      subtopics: [
        { name: "Interfaces vs Abstract Classes", explanation: "Interfaces define pure behavior contracts (multiple inheritance allowed); abstract classes can contain state and default methods." }
      ]
    },
    {
      topic: "Observer Pattern",
      brief: "Behavioral pattern where a subject notifies registered observer objects of state changes.",
      subtopics: [
        { name: "Usage", explanation: "Event listeners, pub-sub messaging, or model-view bindings." }
      ]
    },
    {
      topic: "Singleton Pattern",
      brief: "Creational pattern ensuring a class has only one instance and providing a global access point.",
      subtopics: [
        { name: "Implementation Risks", explanation: "Requires thread-safety (double-checked locking). Can act as anti-pattern due to global state and testing difficulties." }
      ]
    }
  ],
  CPP: [
    {
      topic: "References vs Pointers",
      brief: "Two ways to refer to another object in memory.",
      subtopics: [
        { name: "References", explanation: "Syntax alias. Must be initialized at declaration, cannot be null, and cannot be reseated to point to another object." },
        { name: "Pointers", explanation: "Variables holding memory addresses. Can be null, reassigned, and support pointer arithmetic." }
      ]
    },
    {
      topic: "Const Correctness",
      brief: "Declaring variables, pointers, and class methods immutable to prevent accidental changes.",
      subtopics: [
        { name: "Const Pointers", explanation: "const int* p (data is const); int* const p (pointer address is const); const int* const p (both const)." },
        { name: "Const Methods", explanation: "void func() const; guarantees the method will not modify any non-mutable class members." }
      ]
    },
    {
      topic: "RAII",
      brief: "Resource Acquisition Is Initialization ties resource lifetime to object scope/lifetime.",
      subtopics: [
        { name: "Mechanism", explanation: "Acquire resource in constructor, release it in destructor. Guarantees cleanup even during exceptions." }
      ]
    },
    {
      topic: "Object Slicing",
      brief: "Occurs when a derived class object is assigned by value to a base class object.",
      subtopics: [
        { name: "Problem", explanation: "The derived members are 'sliced' away, leaving only base members, breaking polymorphism." },
        { name: "Fix", explanation: "Pass objects by reference or pointer instead of by value." }
      ]
    },
    {
      topic: "Virtual Destructors",
      brief: "Ensures proper cleanup of derived class objects when deleted through a base class pointer.",
      subtopics: [
        { name: "Missing Destructors", explanation: "If base destructor is not virtual, deleting through base pointer calls only base destructor, leaking derived class resources." }
      ]
    },
    {
      topic: "Move Semantics",
      brief: "Allows transferring ownership of heap resources between objects instead of deep-copying them (C++11).",
      subtopics: [
        { name: "Lvalues vs Rvalues", explanation: "Lvalues have names and persistent storage; Rvalues are temporary values (literals, temporary return values)." },
        { name: "std::move", explanation: "Cast an lvalue to an rvalue reference (&&) to trigger move constructor/move assignment." }
      ]
    },
    {
      topic: "Copy Constructor",
      brief: "Constructor called to initialize an object with a copy of an existing object.",
      subtopics: [
        { name: "Deep vs Shallow Copy", explanation: "Shallow copy copies pointer addresses; deep copy allocates new memory and duplicates pointed-to content. Must manage this for custom pointers." }
      ]
    },
    {
      topic: "Iterator Invalidation",
      brief: "Occurs when modification of a container renders existing iterators pointing to elements invalid.",
      subtopics: [
        { name: "Examples", explanation: "std::vector push_back triggers memory reallocation, invalidating all outstanding iterators." }
      ]
    },
    {
      topic: "Smart Pointers",
      brief: "Automates memory management via RAII object wrappers (C++11).",
      subtopics: [
        { name: "std::unique_ptr", explanation: "Sole ownership. Cannot be copied, only moved." },
        { name: "std::shared_ptr", explanation: "Shared ownership. Uses reference counting; deletes memory when count hits zero." },
        { name: "std::weak_ptr", explanation: "Non-owning observer pointing to shared_ptr. Prevents cyclic dependency memory leaks." }
      ]
    },
    {
      topic: "Virtual Dispatch",
      brief: "The mechanism C++ uses to resolve runtime method calls for polymorphic classes.",
      subtopics: [
        { name: "Vtable & Vptr", explanation: "Each class with virtual methods has a vtable of function pointers; instances contain a hidden pointer (vptr) to this table." }
      ]
    },
    {
      topic: "Templates",
      brief: "Enables generic programming by letting functions and classes operate with generic types.",
      subtopics: [
        { name: "Template Metaprogramming", explanation: "Code executes at compile time, generating specialized class definitions for types." }
      ]
    },
    {
      topic: "Exception Safety",
      brief: "Guarantees provided by functions when exceptions are thrown.",
      subtopics: [
        { name: "Safety Guarantees", explanation: "Basic (no leaks, system is valid), Strong (transactional, rollback on error), Nothrow (guaranteed not to throw)." }
      ]
    }
  ],
  PYTHON: [
    {
      topic: "Mutable Default Arguments",
      brief: "Default parameters in Python are evaluated once at function definition time, not runtime.",
      subtopics: [
        { name: "The Bug", explanation: "Using a mutable object (e.g. def func(val=[])) retains modifications across multiple function calls." },
        { name: "The Fix", explanation: "Use None as default (def func(val=None)) and initialize as val = [] inside the function." }
      ]
    },
    {
      topic: "GIL",
      brief: "Global Interpreter Lock restricts Python to executing only one thread of bytecode at a time in CPython.",
      subtopics: [
        { name: "Impact", explanation: "CPU-bound multithreading is serialized, rendering it slower. CPU concurrency requires multiprocessing." },
        { name: "IO-bound Tasks", explanation: "GIL is released during network/file IO, allowing standard threads to run concurrently." }
      ]
    },
    {
      topic: "is vs ==",
      brief: "Two distinct equality comparison operators in Python.",
      subtopics: [
        { name: "is (Identity)", explanation: "Checks if two variables refer to the exact same object in memory (id(a) == id(b))." },
        { name: "== (Equality)", explanation: "Checks if values are equivalent (calls custom __eq__ methods)." }
      ]
    },
    {
      topic: "Generators",
      brief: "Functions that return iterator objects using the yield statement, evaluating elements lazily.",
      subtopics: [
        { name: "yield vs return", explanation: "yield pauses the function, saves state, and returns a value; resumes on next() call." },
        { name: "Memory Efficiency", explanation: "Generators stream items one by one, avoiding loading massive lists into memory." }
      ]
    },
    {
      topic: "Shallow vs Deep Copy",
      brief: "Copy behaviors for nested mutable objects in the copy module.",
      subtopics: [
        { name: "Shallow Copy", explanation: "Creates a new outer object but copies references to nested objects." },
        { name: "Deep Copy", explanation: "Recursively copies all child elements, creating a fully independent clone." }
      ]
    },
    {
      topic: "Decorators",
      brief: "Functions that wrap other functions or classes to modify or extend their behavior.",
      subtopics: [
        { name: "Syntax", explanation: "Uses @decorator syntax; decorators accept a callable and return a new wrapper callable." }
      ]
    },
    {
      topic: "Closures and Late Binding",
      brief: "Nested functions capture variables from the enclosing scope, bound at execution time.",
      subtopics: [
        { name: "Late Binding Bug", explanation: "Loop variables inside lambda lists hold their final value when lambdas are executed later." },
        { name: "Fix", explanation: "Force early binding using default arguments: lambda x, i=i: x * i." }
      ]
    },
    {
      topic: "*args and **kwargs",
      brief: "Allows passing variable numbers of positional or keyword arguments to functions.",
      subtopics: [
        { name: "*args", explanation: "Unpacks positional arguments into a tuple." },
        { name: "**kwargs", explanation: "Unpacks keyword arguments into a dictionary." }
      ]
    },
    {
      topic: "Context Managers",
      brief: "Standardized setup and teardown of resources using the 'with' statement.",
      subtopics: [
        { name: "Protocol", explanation: "Objects implementing __enter__ and __exit__ methods, guaranteeing resource cleanup." }
      ]
    },
    {
      topic: "Method Resolution Order",
      brief: "The sequence Python checks to resolve attributes/methods in multiple inheritance.",
      subtopics: [
        { name: "C3 Linearization", explanation: "Algorithm Python uses (accessible via class.mro()) ensuring base classes are resolved after children." }
      ]
    },
    {
      topic: "classmethod vs staticmethod",
      brief: "Two decorators defining method behaviors on Python classes.",
      subtopics: [
        { name: "classmethod", explanation: "Receives class (cls) as first argument; can modify class state." },
        { name: "staticmethod", explanation: "Receives no class or instance argument; behaves like a plain utility function nested inside a class." }
      ]
    },
    {
      topic: "Garbage Collection",
      brief: "Python's automatic memory management system.",
      subtopics: [
        { name: "Reference Counting", explanation: "Deallocates objects immediately when reference count drops to 0." },
        { name: "Generational GC", explanation: "Cyclic garbage collector that detects and cleans circular references that reference counting misses." }
      ]
    }
  ],
  OA: [
    {
      topic: "Number Series",
      brief: "Sequences of numbers following a logical rule.",
      subtopics: [
        { name: "Patterns", explanation: "Arithmetic progression (diffs), geometric (multiplication), Fibonacci, prime numbers, double difference (differences of differences)." }
      ]
    },
    {
      topic: "Letter Series",
      brief: "Sequences of alphabet characters conforming to a logical pattern.",
      subtopics: [
        { name: "Tips", explanation: "Convert letters to positions (A=1, Z=26) and check for numeric progressions or backward loops." }
      ]
    },
    {
      topic: "Seating Arrangement",
      brief: "Arranging individuals in specific linear or circular patterns based on relative constraints.",
      subtopics: [
        { name: "Linear Arrangement", explanation: "Rows facing North/South; keep track of absolute left vs relative left." },
        { name: "Circular Arrangement", explanation: "Facing inside (right is counter-clockwise) vs facing outside (right is clockwise)." }
      ]
    },
    {
      topic: "Syllogisms",
      brief: "Logical arguments where a conclusion is drawn from given statements.",
      subtopics: [
        { name: "Venn Diagram Method", explanation: "Map relations (All A are B, Some B are C) using circles and verify overlap possibilities." }
      ]
    },
    {
      topic: "Coding-Decoding",
      brief: "Deciphering cipher rules applied to words to code new ones.",
      subtopics: [
        { name: "Techniques", explanation: "Position shifting (+3 positions), reverse lettering (A <-> Z), code pairing, and direct matching." }
      ]
    },
    {
      topic: "Blood Relations",
      brief: "Puzzles testing understanding of family lineages and connections.",
      subtopics: [
        { name: "Mapping", explanation: "Use family trees. Clearly separate generations horizontally and specify genders explicitly." }
      ]
    },
    {
      topic: "Directions",
      brief: "Navigating displacement and direction based on turns.",
      subtopics: [
        { name: "Key Points", explanation: "Use standard coordinate compass. Displacement calculations frequently utilize the Pythagorean theorem." }
      ]
    },
    {
      topic: "Statement Conclusions",
      brief: "Evaluating if specific conclusions logically follow from given premises.",
      subtopics: [
        { name: "Strict Logic", explanation: "Do not assume external information. A conclusion must be 100% derived from statements." }
      ]
    },
    {
      topic: "Odd One Out",
      brief: "Identifying the element that does not share a common characteristic with others in the set.",
      subtopics: [
        { name: "Common Rules", explanation: "Numeric properties (even/prime/square), vocabulary, alphabetical groups, or structural categories." }
      ]
    },
    {
      topic: "Venn Reasoning",
      brief: "Analyzing intersection categories of multiple logical sets.",
      subtopics: [
        { name: "Logical Intersections", explanation: "e.g., Doctors, Humans, and Painters, showing they can overlap or nest." }
      ]
    },
    {
      topic: "Ranking",
      brief: "Determining position or order of items in a sequence.",
      subtopics: [
        { name: "Formula", explanation: "Total elements = Position from top + Position from bottom - 1." }
      ]
    },
    {
      topic: "Data Sufficiency",
      brief: "Deciding if the provided statements are sufficient to answer a question.",
      subtopics: [
        { name: "Evaluation", explanation: "Check Statement 1 alone, Statement 2 alone, both together, or neither. Do not calculate the final answer, just verify sufficiency." }
      ]
    },
    {
      topic: "Clock Logic",
      brief: "Problems relating to angles, coincidences, and gains/losses in analog clocks.",
      subtopics: [
        { name: "Angles", explanation: "Minute hand moves 6 degrees/min; hour hand moves 0.5 degrees/min. Relative speed is 5.5 degrees/min." }
      ]
    },
    {
      topic: "Arithmetic Logic",
      brief: "Basic word math problems involving ages, ratios, averages, or speed.",
      subtopics: [
        { name: "Methods", explanation: "Convert verbal statements directly into algebra equations and solve for variables." }
      ]
    },
    {
      topic: "Constraint Puzzle",
      brief: "Grid arrangements matching multiple attributes to items based on complex statements.",
      subtopics: [
        { name: "Grid Method", explanation: "Create a matrix of checkmarks and crosses to eliminate invalid combinations systematically." }
      ]
    },
    {
      topic: "Input-Output Pattern",
      brief: "Machine-like step-by-step rearrangement of numbers or words.",
      subtopics: [
        { name: "Analysis", explanation: "Compare sequential steps to find sorting rules (e.g. sorting words alphabetically while numbers descend)." }
      ]
    },
    {
      topic: "Analogy",
      brief: "Finding similar relationships between pairs of terms.",
      subtopics: [
        { name: "Patterns", explanation: "Cause-effect, country-capital, tool-worker, or synonym-antonym pairs." }
      ]
    },
    {
      topic: "Calendar Logic",
      brief: "Calculating days and dates across months or years.",
      subtopics: [
        { name: "Odd Days", explanation: "Standard year has 1 odd day (365 % 7 = 1); leap year has 2 odd days. Find total odd days to shift the day of the week." }
      ]
    }
  ],
  DSA: [
    {
      topic: "Sliding Window",
      brief: "A technique used to perform operations on a specific nested subarray/substring of a sequence.",
      subtopics: [
        { name: "Fixed Window", explanation: "Maintain a constant window size, adding the next element and removing the leftmost (e.g., max sum subarray of size K)." },
        { name: "Variable Window", explanation: "Adjust bounds dynamically based on conditions, expanding right to grow and shrinking left to satisfy constraints (e.g., longest substring with K unique characters)." },
        { name: "Complexity", explanation: "Reduces nested loop solutions from O(N^2) to O(N) by traversing each element at most twice." }
      ]
    },
    {
      topic: "Graph BFS",
      brief: "Breadth-First Search traverses a graph level-by-level using a queue.",
      subtopics: [
        { name: "Shortest Path", explanation: "BFS guarantees finding the shortest path in unweighted graphs since it explores nodes in increasing distance order." },
        { name: "Visited Set", explanation: "Always track visited nodes to avoid infinite cycles in cyclic graphs." },
        { name: "Multi-Source BFS", explanation: "Initialize queue with multiple starting nodes to run concurrent wavefronts (e.g., grid distance maps)." }
      ]
    },
    {
      topic: "Dynamic Programming",
      brief: "Solves complex optimization problems by breaking them down into overlapping subproblems and caching results.",
      subtopics: [
        { name: "Memoization (Top-Down)", explanation: "Solves problems recursively, caching results in a table before returning." },
        { name: "Tabulation (Bottom-Up)", explanation: "Fills a multi-dimensional table iteratively, solving smaller subproblems first." },
        { name: "Optimal Substructure", explanation: "The optimal solution to a problem contains optimal solutions to its subproblems." }
      ]
    },
    {
      topic: "Two Pointers",
      brief: "Uses two pointer indices to scan a sorted container, moving toward or away from each other.",
      subtopics: [
        { name: "Opposite Ends", explanation: "Start at left and right boundaries, meeting in the middle (e.g., sorted two-sum, valid palindrome)." },
        { name: "Fast and Slow Pointers", explanation: "Move pointers at different speeds (e.g. Floyd's cycle detection in linked lists, mid-point tracking)." }
      ]
    },
    {
      topic: "Binary Search",
      brief: "O(log N) search algorithm on sorted ranges by repeatedly dividing the search interval in half.",
      subtopics: [
        { name: "Conditions", explanation: "Requires random access (e.g., array) and a monotonic search space (sorted elements or predicate function return values)." },
        { name: "Boundary Updates", explanation: "Calculate mid = low + (high - low) / 2 to avoid overflow; use low = mid + 1 or high = mid - 1 to guarantee termination." }
      ]
    },
    {
      topic: "Hashing",
      brief: "Mapping keys to values via hash functions for constant-time lookups.",
      subtopics: [
        { name: "Hash Maps & Sets", explanation: "Provides average O(1) time complexity for insertion, deletion, and lookup." },
        { name: "Collisions", explanation: "When multiple keys hash to same bucket. Handled via Chaining (linked lists/trees at buckets) or Open Addressing (probing)." }
      ]
    },
    {
      topic: "Stack",
      brief: "LIFO (Last In, First Out) linear data structure.",
      subtopics: [
        { name: "Monotonic Stack", explanation: "Stack elements are kept strictly increasing/decreasing. Used for finding next greater/smaller elements in O(N)." },
        { name: "Call Stack", explanation: "Used by compilers to track execution flow, frame variables, and return targets during recursion." }
      ]
    },
    {
      topic: "Linked List",
      brief: "Sequential nodes linked via memory pointers.",
      subtopics: [
        { name: "Singly vs Doubly", explanation: "Singly contains next pointer; doubly list contains next and prev pointers allowing bidirectional traversal." },
        { name: "Sentinel Nodes", explanation: "Dummy header/tail nodes that simplify edge cases during element insertion/deletion." }
      ]
    },
    {
      topic: "Tree Traversal",
      brief: "Visiting all nodes in a hierarchical tree data structure.",
      subtopics: [
        { name: "Depth-First Search (DFS)", explanation: "In-order (Left, Root, Right - yields sorted order in BST), Pre-order (Root, Left, Right), Post-order (Left, Right, Root)." },
        { name: "Breadth-First Search (BFS)", explanation: "Level-order traversal visiting nodes tier-by-tier using a queue." }
      ]
    },
    {
      topic: "Heap / Top-K",
      brief: "A complete binary tree that maintains heap properties, ideal for priority queues.",
      subtopics: [
        { name: "Min vs Max Heap", explanation: "Min-heap roots hold the smallest element; max-heap roots hold the largest. Insertion and extraction take O(log N)." },
        { name: "Top-K Problems", explanation: "Maintain a heap of size K. Improves complexity of finding K largest elements from O(N log N) to O(N log K)." }
      ]
    },
    {
      topic: "Greedy",
      brief: "Builds up a solution piece-by-piece, making the locally optimal choice at each stage.",
      subtopics: [
        { name: "Characteristics", explanation: "Fast execution, but only works if local choices guarantee a globally optimal solution (e.g. Kruskal's, Huffman coding)." }
      ]
    },
    {
      topic: "Backtracking",
      brief: "Systematic search of state spaces by building candidates and abandoning ('backtracking') them if invalid.",
      subtopics: [
        { name: "Recursion Tree", explanation: "Involves exploring possibilities, marking states, recursing, and unmarking states (e.g. N-Queens, Sudoku, permutations)." }
      ]
    },
    {
      topic: "Union-Find",
      brief: "Disjoint-set data structure tracking partitioned elements.",
      subtopics: [
        { name: "Operations", explanation: "Union (merges two sets) and Find (determines which set an element belongs to)." },
        { name: "Optimizations", explanation: "Path Compression (flattens tree during Find) and Union by Rank (attaches smaller tree to larger). Achieves near-constant O(alpha(N)) time." }
      ]
    }
  ]
};
