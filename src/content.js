// Content bank for PlacementPrep.
// Each MCQ: { id, subject, concept, difficulty, stem, options[{text, sub, fix}], correctIndex, proTip, lesson }
// The correct option keeps fix: "". Every distractor explains why it is wrong in `fix`.
// Subjects: DBMS, OS, CN, OOP. DSA prompts are self-graded logic drills.

export const QUESTIONS = [
  // ----------------------------------------------------------------------------
  // DBMS
  // ----------------------------------------------------------------------------
  {
    id: "q-dbms-iso-001",
    subject: "DBMS",
    concept: "Isolation Levels",
    difficulty: "medium",
    stem:
      "A banking application reads a user's account balance as $1,000 within an open transaction. A concurrent transaction withdraws $200 and commits. When the same transaction reads the balance again, it sees $800. Which isolation anomaly does this describe?",
    options: [
      {
        text: "Dirty Read",
        sub: "Reads uncommitted data from a concurrent transaction",
        fix:
          "Dirty reads happen before the other transaction commits. Here the withdrawal committed before the second read, so the issue is that the same row changed inside one transaction.",
      },
      {
        text: "Non-repeatable Read",
        sub: "Same query returns different values within one transaction",
        fix: "",
      },
      {
        text: "Phantom Read",
        sub: "New rows appear in repeated range queries",
        fix:
          "Phantom reads involve a repeated range query where new rows appear. This scenario reads the same account row twice and gets two values.",
      },
      {
        text: "Lost Update",
        sub: "Two concurrent writes; one silently overwrites the other",
        fix:
          "Lost update is a write-write race. This case is a read consistency problem caused by a committed update between two reads.",
      },
    ],
    correctIndex: 1,
    proTip:
      "Non-repeatable reads sit in the middle of SQL's isolation hierarchy. Raising from Read Committed to Repeatable Read usually gives each transaction a stable view of rows it has already read.",
    lesson:
      "A non-repeatable read happens when the same transaction reads the same row twice and gets different values because another committed transaction changed it in between. Dirty reads are about uncommitted data, phantom reads are about new rows in a repeated range query, and lost updates are about competing writes.",
  },
  {
    id: "q-dbms-iso-002",
    subject: "DBMS",
    concept: "Isolation Levels",
    difficulty: "hard",
    stem:
      "A report runs SELECT COUNT(*) FROM orders WHERE status='PENDING' twice inside one transaction. Between the two reads, another transaction inserts three new pending orders and commits, so the counts differ. Which anomaly and which isolation level prevents it?",
    options: [
      {
        text: "Non-repeatable read; fixed by Read Committed",
        sub: "Existing row changed value",
        fix:
          "No existing row changed value here; entirely new rows appeared in the range. That is a phantom, not a non-repeatable read, and Read Committed does not stop it.",
      },
      {
        text: "Phantom read; fixed by Serializable",
        sub: "New rows match a repeated range predicate",
        fix: "",
      },
      {
        text: "Dirty read; fixed by Repeatable Read",
        sub: "Reading uncommitted inserts",
        fix:
          "The inserts were committed before the second read, so nothing dirty was read. Repeatable Read also does not reliably block phantoms in the SQL standard.",
      },
      {
        text: "Lost update; fixed by row locks",
        sub: "Competing writes overwrote each other",
        fix:
          "There is no competing write on the same row here. The reporting transaction only reads, so this is a phantom, not a lost update.",
      },
    ],
    correctIndex: 1,
    proTip:
      "Phantoms are about set membership, not row values. Serializable (often via predicate/range locks or serialization checks) is the standard level that eliminates them.",
    lesson:
      "A phantom read occurs when a transaction re-runs a range or predicate query and sees rows that were inserted (or deleted) by another committed transaction. The SQL standard only guarantees phantoms are prevented at Serializable isolation. Many engines use range locks or serializable snapshot isolation to enforce it.",
  },
  {
    id: "q-dbms-index-001",
    subject: "DBMS",
    concept: "Indexing",
    difficulty: "hard",
    stem:
      "A query filters on user_id and status, then sorts by created_at descending. The table has millions of rows and a single-column index on user_id. The plan still performs a large sort. Which index is most likely to help?",
    options: [
      {
        text: "An index on status only",
        sub: "Improves one predicate but ignores sort order",
        fix:
          "Status alone is usually low-cardinality and does not help the final ordering. The query needs an index that matches the filter prefix and the order.",
      },
      {
        text: "A composite index on user_id, status, created_at DESC",
        sub: "Matches filters first, then the order by",
        fix: "",
      },
      {
        text: "A hash index on created_at",
        sub: "Fast equality lookup, weak for range/order scans",
        fix:
          "Hash indexes are not useful for ordered scans. The query needs a B-tree style composite index whose key order matches the access pattern.",
      },
      {
        text: "A covering index on every table column",
        sub: "Avoids lookup but bloats writes and cache",
        fix:
          "Covering can help, but blindly indexing every column is expensive. Start with the predicate and ordering columns that drive the plan.",
      },
    ],
    correctIndex: 1,
    proTip:
      "Composite index order matters: equality filters first, then range or sort columns. That lets the engine narrow the scan and reuse index order instead of sorting a large result.",
    lesson:
      "Indexes trade write cost and storage for faster reads. For compound queries, the most useful index usually starts with the columns used in equality filters, then adds the column used for range scans or ordering. A covering index can also include projected columns, but it should be deliberate because every index slows writes.",
  },
  {
    id: "q-dbms-index-002",
    subject: "DBMS",
    concept: "Indexing",
    difficulty: "medium",
    stem:
      "A table has a B-tree index on (last_name, first_name). A query filters only on first_name = 'Priya'. The optimizer chooses a full table scan instead of the index. Why?",
    options: [
      {
        text: "B-tree indexes only work for equality on the whole key",
        sub: "Partial keys are never usable",
        fix:
          "B-trees do support partial-key lookups, but only as a left-to-right prefix. The issue is which prefix the query uses.",
      },
      {
        text: "The query skips the index's leading column, so the prefix is unusable",
        sub: "Filtering only on a non-leading column breaks the prefix",
        fix: "",
      },
      {
        text: "Composite indexes can only be used in ORDER BY",
        sub: "They never help WHERE clauses",
        fix:
          "Composite indexes absolutely help WHERE clauses when the leading columns are used. The problem here is the missing leading column.",
      },
      {
        text: "first_name has too many distinct values to index",
        sub: "High cardinality blocks index use",
        fix:
          "High cardinality usually makes an index more useful, not less. The real blocker is that first_name is not the leading column.",
      },
    ],
    correctIndex: 1,
    proTip:
      "Think of a composite index like a phone book sorted by last name then first name. You can't efficiently find everyone named 'Priya' without the last name, because the data isn't ordered by first name.",
    lesson:
      "A composite B-tree index is ordered left to right. It can satisfy queries that use a left-prefix of the key (last_name, or last_name+first_name), but not a query that filters only on a trailing column. To serve a first_name-only filter, you need an index with first_name as its leading column.",
  },
  {
    id: "q-dbms-norm-001",
    subject: "DBMS",
    concept: "Normalization",
    difficulty: "medium",
    stem:
      "An Orders table stores customer_id, customer_email, and customer_address on every row. When a customer changes their email, dozens of order rows must be updated, and some get missed. Which normalization issue is this?",
    options: [
      {
        text: "Update anomaly from unnormalized redundancy",
        sub: "Duplicated customer data must be changed in many places",
        fix: "",
      },
      {
        text: "Violation of first normal form",
        sub: "A column holds multiple values",
        fix:
          "1NF is about atomic, single-valued columns. Here each column is atomic; the problem is repeated customer data across rows.",
      },
      {
        text: "Loss of referential integrity",
        sub: "A foreign key points to a missing row",
        fix:
          "No dangling reference is described. The issue is duplicated non-key data, not a broken foreign key.",
      },
      {
        text: "Over-normalization causing too many joins",
        sub: "Data split into excessive tables",
        fix:
          "This is the opposite: the data is under-normalized. Splitting customer attributes into their own table would fix it.",
      },
    ],
    correctIndex: 0,
    proTip:
      "Update, insertion, and deletion anomalies are the classic symptoms that a table needs to be decomposed. Moving customer attributes into a Customers table keyed by customer_id removes the redundancy.",
    lesson:
      "Normalization removes redundancy by decomposing tables so each fact is stored once. When non-key attributes (like customer_email) depend on something other than the table's key and are duplicated across rows, you get update anomalies. Moving those attributes to a table keyed by what they actually depend on resolves it, typically reaching 2NF/3NF.",
  },
  {
    id: "q-dbms-norm-002",
    subject: "DBMS",
    concept: "Normalization",
    difficulty: "hard",
    stem:
      "A table Students(student_id, zip_code, city) always has city fully determined by zip_code, while student_id is the primary key. Which normal form is violated, and what fixes it?",
    options: [
      {
        text: "2NF; remove partial dependency on part of the key",
        sub: "Non-key depends on part of a composite key",
        fix:
          "2NF concerns partial dependencies on a composite key. Here the key is a single column (student_id), so 2NF is not the issue.",
      },
      {
        text: "3NF; remove the transitive dependency zip_code -> city",
        sub: "A non-key attribute depends on another non-key attribute",
        fix: "",
      },
      {
        text: "1NF; make city atomic",
        sub: "Column holds multiple values",
        fix:
          "city is already atomic. 1NF is satisfied; the problem is a dependency between two non-key columns.",
      },
      {
        text: "BCNF; the key is not a superkey",
        sub: "A determinant is not a candidate key",
        fix:
          "BCNF is the stricter generalization, but the textbook violation here is the transitive dependency, which 3NF targets directly.",
      },
    ],
    correctIndex: 1,
    proTip:
      "3NF says non-key columns must depend on the key, the whole key, and nothing but the key. zip_code -> city is a non-key-to-non-key (transitive) dependency, so split it into a ZipCodes(zip_code, city) table.",
    lesson:
      "Third normal form forbids transitive dependencies: a non-key attribute determining another non-key attribute. Since city depends on zip_code (a non-key attribute) rather than directly on student_id, the table is in 2NF but not 3NF. Extracting zip_code -> city into its own table removes the redundancy.",
  },
  {
    id: "q-dbms-acid-001",
    subject: "DBMS",
    concept: "ACID",
    difficulty: "easy",
    stem:
      "During a money transfer, the system debits account A, then crashes before crediting account B. After restart, the debit has been rolled back so no money disappeared. Which ACID property guaranteed this all-or-nothing behavior?",
    options: [
      {
        text: "Atomicity",
        sub: "A transaction either fully completes or fully rolls back",
        fix: "",
      },
      {
        text: "Consistency",
        sub: "Transactions move the DB between valid states",
        fix:
          "Consistency is the end goal, but the specific mechanism that undid the partial debit is atomicity's all-or-nothing rollback.",
      },
      {
        text: "Isolation",
        sub: "Concurrent transactions don't interfere",
        fix:
          "Isolation is about concurrency between transactions. The scenario is a single transaction recovering from a crash.",
      },
      {
        text: "Durability",
        sub: "Committed data survives crashes",
        fix:
          "Durability guarantees committed work persists. Here the transaction never committed, so what mattered was rolling back the partial change.",
      },
    ],
    correctIndex: 0,
    proTip:
      "Atomicity is enforced by the write-ahead log and rollback: uncommitted changes are undone on recovery so the transaction leaves no partial footprint.",
    lesson:
      "ACID stands for Atomicity, Consistency, Isolation, Durability. Atomicity guarantees a transaction is indivisible — either all its operations take effect or none do. If a crash occurs mid-transaction, recovery rolls back the incomplete work, which is exactly what prevented the orphaned debit.",
  },
  {
    id: "q-dbms-acid-002",
    subject: "DBMS",
    concept: "ACID",
    difficulty: "medium",
    stem:
      "A user clicks 'Place order', the database returns success, and a millisecond later the server loses power. After reboot, the order is still present. Which ACID property guarantees the committed order survived the crash?",
    options: [
      {
        text: "Atomicity",
        sub: "All-or-nothing execution",
        fix:
          "Atomicity covers partial-failure rollback during a transaction. Here the transaction already committed; the question is whether committed data persists.",
      },
      {
        text: "Durability",
        sub: "Once committed, data survives power loss and crashes",
        fix: "",
      },
      {
        text: "Isolation",
        sub: "Concurrent transactions stay independent",
        fix:
          "Isolation concerns concurrency, not crash survival of committed data.",
      },
      {
        text: "Consistency",
        sub: "Constraints and invariants hold",
        fix:
          "Consistency keeps the database valid, but the specific guarantee that a committed write outlives a power cut is durability.",
      },
    ],
    correctIndex: 1,
    proTip:
      "Durability is typically implemented by flushing the write-ahead/redo log to stable storage before acknowledging commit, so recovery can replay it.",
    lesson:
      "Durability means that once a transaction is committed, its effects persist even through power loss or crashes. Databases achieve this by writing changes to a durable log before confirming the commit, then replaying the log on restart to ensure no acknowledged write is lost.",
  },
  {
    id: "q-dbms-join-001",
    subject: "DBMS",
    concept: "Joins",
    difficulty: "medium",
    stem:
      "You need every customer listed, along with their orders if any exist, and customers with zero orders should still appear with NULL order fields. Which join produces this?",
    options: [
      {
        text: "INNER JOIN customers and orders",
        sub: "Only rows with matches on both sides",
        fix:
          "An inner join drops customers who have no orders, so customers with zero orders would vanish from the result.",
      },
      {
        text: "LEFT (OUTER) JOIN customers to orders",
        sub: "All left rows, matched right rows or NULLs",
        fix: "",
      },
      {
        text: "RIGHT (OUTER) JOIN customers to orders",
        sub: "All right rows, NULLs on the left",
        fix:
          "A right join keeps all order rows and could drop customers without orders, the opposite of what's required. (Written in this direction, customers without orders are lost.)",
      },
      {
        text: "CROSS JOIN customers and orders",
        sub: "Cartesian product of both tables",
        fix:
          "A cross join pairs every customer with every order, producing a combinatorial blowup, not a per-customer order list.",
      },
    ],
    correctIndex: 1,
    proTip:
      "A LEFT JOIN preserves every row from the left table. Unmatched right-side columns come back as NULL, which is exactly how you surface 'customers with no orders'.",
    lesson:
      "A LEFT OUTER JOIN returns all rows from the left table and the matching rows from the right table; where there is no match, right-side columns are NULL. An INNER JOIN returns only rows that match on both sides. Choose LEFT JOIN when you must keep every record from one table regardless of matches.",
  },
  {
    id: "q-dbms-mvcc-001",
    subject: "DBMS",
    concept: "Concurrency Control",
    difficulty: "hard",
    stem:
      "In Postgres, a long analytics SELECT runs for 30 seconds. Concurrent writers keep updating the same rows the whole time, yet the SELECT never blocks them and sees a stable snapshot. Which mechanism explains this?",
    options: [
      {
        text: "Two-phase locking taking shared read locks",
        sub: "Readers lock rows, blocking writers",
        fix:
          "Under strict 2PL, readers would take shared locks and block writers. The scenario explicitly says writers are never blocked, so locking isn't the mechanism.",
      },
      {
        text: "Multiversion concurrency control (MVCC)",
        sub: "Readers see a consistent snapshot of old row versions",
        fix: "",
      },
      {
        text: "Table-level exclusive locks",
        sub: "Whole table locked during the read",
        fix:
          "An exclusive table lock would stop writers entirely, contradicting the scenario where writers continue freely.",
      },
      {
        text: "Dirty reads at Read Uncommitted",
        sub: "Reading in-flight uncommitted changes",
        fix:
          "Reading uncommitted data would make the snapshot unstable and inconsistent, the opposite of the stable view described.",
      },
    ],
    correctIndex: 1,
    proTip:
      "MVCC keeps multiple versions of a row. Readers get the version valid at their snapshot, so 'readers don't block writers and writers don't block readers' becomes possible.",
    lesson:
      "Multiversion concurrency control gives each transaction a consistent snapshot by retaining older row versions instead of overwriting in place. Readers see the version that was committed as of their snapshot, so they don't need read locks and don't block writers. This is how databases like Postgres provide snapshot isolation with high read concurrency.",
  },
  {
    id: "q-dbms-cap-001",
    subject: "DBMS",
    concept: "CAP Theorem",
    difficulty: "medium",
    stem:
      "A distributed datastore is split by a network partition. The team decides every node must keep answering reads and writes, even if some nodes return slightly stale data. Which CAP trade-off did they choose?",
    options: [
      {
        text: "They chose consistency over availability (CP)",
        sub: "Reject requests to avoid stale reads",
        fix:
          "A CP system would refuse or block requests on the minority side to avoid stale data. Here they keep serving, so they did not prioritize consistency.",
      },
      {
        text: "They chose availability over consistency (AP)",
        sub: "Keep serving, tolerate temporary staleness",
        fix: "",
      },
      {
        text: "They achieved all three (CAP) simultaneously",
        sub: "Consistency, availability, and partition tolerance together",
        fix:
          "CAP says during a partition you cannot have both full consistency and full availability. You must trade one off.",
      },
      {
        text: "They abandoned partition tolerance",
        sub: "Assume the network never splits",
        fix:
          "You cannot abandon partition tolerance in a real distributed system; partitions happen. The choice is between C and A when they occur.",
      },
    ],
    correctIndex: 1,
    proTip:
      "CAP is only a dilemma during a partition. Choosing to keep serving despite staleness is the classic AP stance; many systems offer tunable consistency to move along this spectrum.",
    lesson:
      "The CAP theorem states that during a network partition a distributed system can guarantee at most two of Consistency, Availability, and Partition tolerance. Since partitions are unavoidable, the real choice is between staying available (AP, risking stale reads) or staying consistent (CP, rejecting some requests).",
  },
  {
    id: "q-dbms-shard-001",
    subject: "DBMS",
    concept: "Sharding",
    difficulty: "medium",
    stem:
      "A single Postgres instance can't keep up with write volume on a 2-billion-row events table. The team wants writes spread across multiple machines. Which scaling approach fits?",
    options: [
      {
        text: "Add read replicas",
        sub: "Copy data to extra nodes for reads",
        fix:
          "Read replicas scale reads, not writes; all writes still funnel to the primary. The bottleneck here is write throughput.",
      },
      {
        text: "Horizontally shard (partition) the table by a shard key",
        sub: "Split rows across nodes so each handles part of the writes",
        fix: "",
      },
      {
        text: "Add a larger cache in front of the database",
        sub: "Serve hot rows from memory",
        fix:
          "Caching offloads reads of hot data; it does not distribute write load across machines.",
      },
      {
        text: "Increase the isolation level",
        sub: "Stronger transactional guarantees",
        fix:
          "Raising isolation adds overhead and never increases write capacity; it typically reduces concurrency.",
      },
    ],
    correctIndex: 1,
    proTip:
      "Sharding distributes both data and write load by a shard key (e.g., user_id hash). Pick a key with even distribution to avoid hot shards, and remember cross-shard queries get harder.",
    lesson:
      "Sharding (horizontal partitioning) splits a large table's rows across multiple database nodes based on a shard key, so each node owns a subset of data and absorbs a fraction of the write load. It scales writes beyond one machine, at the cost of more complex cross-shard queries and transactions. Replication, by contrast, scales reads and improves availability.",
  },
  {
    id: "q-dbms-deadlock-001",
    subject: "DBMS",
    concept: "Deadlock",
    difficulty: "hard",
    stem:
      "Transaction T1 updates row A then tries to update row B; concurrently T2 updates row B then tries to update row A. Both hang and the database aborts one with a deadlock error. What's the most reliable way to prevent this recurring?",
    options: [
      {
        text: "Raise isolation to Serializable",
        sub: "Stronger guarantees stop deadlocks",
        fix:
          "Higher isolation does not prevent deadlocks; it often increases locking and can make them more likely. The cycle comes from lock ordering.",
      },
      {
        text: "Acquire locks on rows in a consistent global order",
        sub: "Always lock A before B everywhere",
        fix: "",
      },
      {
        text: "Add more indexes on A and B",
        sub: "Faster lookups avoid contention",
        fix:
          "Indexes speed access but do not change the order in which transactions take conflicting locks, so the cycle can still form.",
      },
      {
        text: "Disable the deadlock detector",
        sub: "Let transactions wait it out",
        fix:
          "Disabling detection turns a quick abort into an indefinite hang. It hides the problem rather than preventing the cycle.",
      },
    ],
    correctIndex: 1,
    proTip:
      "A consistent lock-acquisition order breaks the circular-wait condition. If every transaction grabs A before B, T1 and T2 can no longer hold one and wait on the other in a cycle.",
    lesson:
      "Database deadlocks arise when transactions acquire locks in opposite orders, creating a circular wait. Engines detect the cycle and abort a victim. The durable fix is to impose a consistent global lock ordering so cycles cannot form; shorter transactions and lower lock scope also reduce the window.",
  },
  {
    id: "q-dbms-denorm-001",
    subject: "DBMS",
    concept: "Denormalization",
    difficulty: "medium",
    stem:
      "A product page must join 6 normalized tables on every load, and the join has become the top latency cost under heavy read traffic. The team copies a few frequently-read fields onto the product row to skip joins. What is this technique and its main risk?",
    options: [
      {
        text: "Normalization; risk of more joins",
        sub: "Splitting data into more tables",
        fix:
          "This is the opposite of normalization. They are intentionally duplicating data to reduce joins, which is denormalization.",
      },
      {
        text: "Denormalization; risk of data getting out of sync",
        sub: "Duplicating fields for read speed",
        fix: "",
      },
      {
        text: "Sharding; risk of cross-shard queries",
        sub: "Splitting rows across nodes",
        fix:
          "Sharding distributes rows across machines. Here data stays on one node but is duplicated across columns/tables for speed.",
      },
      {
        text: "Indexing; risk of slower writes",
        sub: "Adding a lookup structure",
        fix:
          "Indexing adds a separate structure for lookups; it does not copy fields onto rows. This scenario copies data to avoid joins.",
      },
    ],
    correctIndex: 1,
    proTip:
      "Denormalization trades write complexity and storage for read speed. Once data is duplicated, you must keep copies in sync — often via triggers, application logic, or async jobs.",
    lesson:
      "Denormalization deliberately introduces redundancy (duplicated columns or precomputed aggregates) to avoid expensive joins and speed up reads. The trade-off is that every duplicate must be updated together, risking inconsistency. It's a common, valid optimization for read-heavy workloads when applied carefully.",
  },
  {
    id: "q-dbms-keys-001",
    subject: "DBMS",
    concept: "Keys & Constraints",
    difficulty: "easy",
    stem:
      "An Orders table has customer_id that must always reference an existing row in Customers. A bug let an order be inserted with a customer_id that no Customer row has. Which constraint, if enforced, would have blocked it?",
    options: [
      {
        text: "A UNIQUE constraint on customer_id",
        sub: "No two rows share the value",
        fix:
          "UNIQUE only stops duplicate values; it does nothing to ensure the value exists in another table.",
      },
      {
        text: "A FOREIGN KEY referencing Customers(customer_id)",
        sub: "Value must exist in the referenced table",
        fix: "",
      },
      {
        text: "A NOT NULL constraint on customer_id",
        sub: "Value cannot be empty",
        fix:
          "NOT NULL only forbids missing values; a non-null but non-existent customer_id would still slip through.",
      },
      {
        text: "A CHECK constraint that customer_id > 0",
        sub: "Value passes a boolean test",
        fix:
          "A CHECK validates a row-local condition. It cannot verify that the id exists in another table.",
      },
    ],
    correctIndex: 1,
    proTip:
      "Foreign keys enforce referential integrity: the database rejects child rows pointing at non-existent parents and can cascade updates or deletes.",
    lesson:
      "A foreign key constraint ties a column to a key in another table and guarantees referential integrity — you cannot insert a child row whose foreign key has no matching parent, and you cannot orphan children by deleting a referenced parent (unless cascading is configured). UNIQUE, NOT NULL, and CHECK enforce different, row-local rules.",
  },
  {
    id: "q-dbms-query-001",
    subject: "DBMS",
    concept: "Query Optimization",
    difficulty: "hard",
    stem:
      "An EXPLAIN plan shows a Seq Scan reading 5 million rows to return 12, filtering on WHERE email = ?. There is no index on email. What is the most direct fix and its cost?",
    options: [
      {
        text: "Add a B-tree index on email; cost is slightly slower writes",
        sub: "Turns the scan into a fast lookup",
        fix: "",
      },
      {
        text: "Rewrite the query with SELECT * to read fewer rows",
        sub: "Changing projection speeds the scan",
        fix:
          "SELECT * reads more columns, not fewer rows. Projection doesn't change how many rows the filter must scan without an index.",
      },
      {
        text: "Increase work_mem so the sort is faster",
        sub: "More memory for sorting",
        fix:
          "There is no sort here; the cost is scanning 5M rows to find 12. More sort memory doesn't address the missing index.",
      },
      {
        text: "Raise the isolation level to reduce locking",
        sub: "Less locking means faster reads",
        fix:
          "Isolation level doesn't reduce how many rows a filter scans. The bottleneck is the full scan, fixed by an index.",
      },
    ],
    correctIndex: 0,
    proTip:
      "A sequential scan that returns a tiny fraction of rows is a classic 'missing index' signal. A B-tree index on the equality column turns O(n) scanning into an O(log n) lookup; the trade-off is marginally slower inserts/updates.",
    lesson:
      "Query optimization starts with reading the execution plan. A Seq Scan returning a small selective result on an equality predicate indicates a missing index. Adding a B-tree index on the filtered column lets the planner do an index lookup instead of scanning every row. The cost is extra storage and slightly slower writes, since the index must be maintained.",
  },

  // ----------------------------------------------------------------------------
  // OS
  // ----------------------------------------------------------------------------
  {
    id: "q-os-sched-001",
    subject: "OS",
    concept: "CPU Scheduling",
    difficulty: "medium",
    stem:
      "A server has many short interactive tasks and a few long CPU-bound jobs. Users complain that clicks feel delayed even though CPU utilization is high. Which scheduler behavior best improves perceived responsiveness?",
    options: [
      {
        text: "First Come First Served",
        sub: "Runs jobs in arrival order",
        fix:
          "FCFS can trap short interactive tasks behind long CPU-bound jobs. That convoy effect hurts responsiveness.",
      },
      {
        text: "Shortest Job First without preemption",
        sub: "Optimizes average wait only when lengths are known",
        fix:
          "SJF helps average wait in theory, but non-preemptive scheduling still lets long jobs hold the CPU once started.",
      },
      {
        text: "Round Robin with a small enough time quantum",
        sub: "Time-slices CPU so interactive tasks get frequent turns",
        fix: "",
      },
      {
        text: "Priority scheduling with no aging",
        sub: "Can starve lower-priority work",
        fix:
          "Priority scheduling can help if priorities are correct, but without aging it risks starvation and still needs careful tuning.",
      },
    ],
    correctIndex: 2,
    proTip:
      "Round Robin is less about perfect throughput and more about latency fairness. The quantum is the trade-off knob: too large feels like FCFS, too small wastes time on context switches.",
    lesson:
      "CPU scheduling decides which ready process runs next. Interactive systems usually prefer short response time over raw throughput. Round Robin gives each ready process a time slice, preventing long CPU-bound jobs from monopolizing the CPU. The time quantum must balance responsiveness against context-switch overhead.",
  },
  {
    id: "q-os-sched-002",
    subject: "OS",
    concept: "CPU Scheduling",
    difficulty: "hard",
    stem:
      "A low-priority logging process never runs because higher-priority jobs keep arriving on a strict priority scheduler. Which technique lets it eventually run without abandoning priorities?",
    options: [
      {
        text: "Aging: gradually raise the priority of waiting processes",
        sub: "Long waits boost priority over time",
        fix: "",
      },
      {
        text: "Switch to FCFS",
        sub: "Run strictly in arrival order",
        fix:
          "FCFS removes priorities entirely, which the question says we want to keep. Aging fixes starvation while preserving priority.",
      },
      {
        text: "Shorten the time quantum",
        sub: "Smaller slices for everyone",
        fix:
          "A smaller quantum affects round-robin sharing, but under strict priority the low-priority job still never gets scheduled.",
      },
      {
        text: "Increase the process's memory allocation",
        sub: "More RAM for the starved process",
        fix:
          "Memory has nothing to do with scheduling order. Starvation is about CPU selection, not memory.",
      },
    ],
    correctIndex: 0,
    proTip:
      "Aging is the standard antidote to starvation: the longer a process waits, the higher its effective priority climbs, guaranteeing it eventually runs.",
    lesson:
      "Strict priority scheduling can starve low-priority processes indefinitely if higher-priority work keeps arriving. Aging solves this by incrementally increasing a waiting process's priority over time, so it is eventually selected. This preserves the benefits of priorities while guaranteeing progress.",
  },
  {
    id: "q-os-deadlock-001",
    subject: "OS",
    concept: "Deadlock",
    difficulty: "easy",
    stem:
      "Two services each acquire one lock and then wait forever for the lock held by the other service. Which Coffman condition is most directly visible in this wait cycle?",
    options: [
      {
        text: "Mutual exclusion",
        sub: "Only one actor can hold a resource at a time",
        fix:
          "Mutual exclusion is present, but the visible loop is the circular chain of waiting.",
      },
      {
        text: "Hold and wait",
        sub: "A process holds one resource while requesting another",
        fix:
          "Hold and wait is present too, but the question asks what the wait cycle itself shows most directly.",
      },
      {
        text: "Circular wait",
        sub: "Each process waits for a resource held by the next one",
        fix: "",
      },
      {
        text: "No preemption",
        sub: "Resources cannot be forcibly taken away",
        fix:
          "No preemption may allow the deadlock to persist, but the described cycle is circular wait.",
      },
    ],
    correctIndex: 2,
    proTip:
      "Deadlock prevention often targets circular wait by forcing a global lock ordering. If every worker grabs locks in the same order, cycles cannot form.",
    lesson:
      "Deadlock requires four conditions: mutual exclusion, hold and wait, no preemption, and circular wait. Circular wait is the easiest to visualize: A waits for B, B waits for C, and C waits for A. Breaking any one condition prevents deadlock.",
  },
  {
    id: "q-os-vmem-001",
    subject: "OS",
    concept: "Virtual Memory",
    difficulty: "medium",
    stem:
      "A process accesses an address whose page is not currently in physical RAM. The CPU traps to the OS, which loads the page from disk and resumes the instruction. What is this event called?",
    options: [
      {
        text: "Page fault",
        sub: "Accessed page isn't resident; OS loads it",
        fix: "",
      },
      {
        text: "Segmentation fault",
        sub: "Access to an invalid/forbidden address",
        fix:
          "A segmentation fault is an illegal access that usually kills the process. Here the access is valid; the page just wasn't resident yet.",
      },
      {
        text: "Cache miss",
        sub: "Data not in CPU cache, fetched from RAM",
        fix:
          "A cache miss is handled in hardware by fetching from RAM. This trap goes to the OS to fetch a page from disk, which is a page fault.",
      },
      {
        text: "TLB hit",
        sub: "Address translation found in the TLB",
        fix:
          "A TLB hit means translation succeeded quickly. This scenario is the opposite: the page isn't in memory at all.",
      },
    ],
    correctIndex: 0,
    proTip:
      "A page fault isn't necessarily an error. Demand paging relies on faults to load pages lazily; only an access to an invalid mapping becomes a fatal fault.",
    lesson:
      "Virtual memory lets processes use an address space larger than physical RAM by keeping some pages on disk. When a process touches a page that isn't resident, the hardware raises a page fault; the OS finds the page (possibly evicting another), loads it, updates the page table, and restarts the instruction. An access to an invalid mapping is a different, fatal fault.",
  },
  {
    id: "q-os-thrash-001",
    subject: "OS",
    concept: "Thrashing",
    difficulty: "hard",
    stem:
      "After launching too many memory-hungry processes, a server's CPU utilization collapses while the disk runs constantly. Every process keeps page-faulting on pages just evicted from others. What is happening?",
    options: [
      {
        text: "Thrashing from over-committed memory",
        sub: "Excessive paging starves real work",
        fix: "",
      },
      {
        text: "A deadlock among the processes",
        sub: "Circular resource wait",
        fix:
          "No process is waiting on a lock held by another; they're all making 'progress' but spending it on paging. That's thrashing, not deadlock.",
      },
      {
        text: "A CPU-bound workload saturating cores",
        sub: "Compute, not I/O, is the limit",
        fix:
          "CPU utilization is collapsing, not saturating, and the disk is the busy resource. The bottleneck is paging I/O, not compute.",
      },
      {
        text: "Priority inversion",
        sub: "Low-priority task blocks a high-priority one",
        fix:
          "Priority inversion is about a lock held by a lower-priority task. The described symptom is constant paging, i.e., thrashing.",
      },
    ],
    correctIndex: 0,
    proTip:
      "Thrashing happens when the sum of working sets exceeds physical memory. Fixes include reducing the multiprogramming degree (swap out / suspend some processes) or adding RAM.",
    lesson:
      "Thrashing occurs when processes collectively need more memory than is physically available, so the system spends most of its time paging in and out rather than executing. CPU utilization drops while disk activity spikes. The remedy is to lower the degree of multiprogramming — suspend or swap out processes — or increase physical memory so working sets fit.",
  },
  {
    id: "q-os-sync-001",
    subject: "OS",
    concept: "Synchronization",
    difficulty: "medium",
    stem:
      "Two threads run counter = counter + 1 a million times each on a shared variable with no synchronization. The final value is often less than two million. What is the root cause?",
    options: [
      {
        text: "A race condition on a non-atomic read-modify-write",
        sub: "Interleaved updates lose increments",
        fix: "",
      },
      {
        text: "A deadlock between the two threads",
        sub: "Each waits on the other",
        fix:
          "Nothing is blocked or waiting; both threads finish. The lost increments come from unsynchronized interleaving, not a deadlock.",
      },
      {
        text: "Insufficient stack size",
        sub: "Threads overflow their stacks",
        fix:
          "Stack size doesn't cause lost increments. The shared counter is corrupted by concurrent read-modify-write, a race.",
      },
      {
        text: "Compiler optimizing away the loop",
        sub: "Dead-code elimination",
        fix:
          "If the loop were eliminated the count would be near zero or unchanged consistently, not 'often less than two million.' The signature is a race.",
      },
    ],
    correctIndex: 0,
    proTip:
      "counter = counter + 1 is three steps: read, add, write. Without a mutex or atomic operation, two threads can read the same value and both write back the same result, dropping an update.",
    lesson:
      "A race condition occurs when multiple threads access shared mutable state concurrently and the outcome depends on timing. Incrementing a counter is a read-modify-write that is not atomic, so interleavings can lose updates. Protect the critical section with a mutex, or use an atomic increment, to serialize the operation.",
  },
  {
    id: "q-os-semaphore-001",
    subject: "OS",
    concept: "Semaphores",
    difficulty: "medium",
    stem:
      "You must limit access to a pool of exactly 5 database connections so no more than 5 threads use one at a time, while others wait. Which primitive directly models this?",
    options: [
      {
        text: "A binary semaphore / mutex",
        sub: "Allows one holder at a time",
        fix:
          "A mutex permits only a single holder, which would serialize access to one connection, not five. You need a count of 5.",
      },
      {
        text: "A counting semaphore initialized to 5",
        sub: "Permits up to N concurrent holders",
        fix: "",
      },
      {
        text: "A condition variable alone",
        sub: "Signals state changes, no built-in count",
        fix:
          "A condition variable by itself doesn't track a permit count; you'd have to build the counting logic and a lock around it manually.",
      },
      {
        text: "A spinlock",
        sub: "Busy-waits for a single lock",
        fix:
          "A spinlock guards one resource with busy-waiting and admits a single holder, not a pool of five.",
      },
    ],
    correctIndex: 1,
    proTip:
      "A counting semaphore is essentially a managed permit pool: initialize it to N, wait() (acquire) decrements, signal() (release) increments. It naturally caps concurrency at N.",
    lesson:
      "A counting semaphore maintains an integer count of available permits. Threads call wait/acquire (blocking when the count hits zero) and signal/release to return a permit. Initializing it to 5 lets at most five threads proceed concurrently while the rest wait — the standard way to bound access to a fixed-size resource pool. A binary semaphore/mutex is the special case N=1.",
  },
  {
    id: "q-os-procthread-001",
    subject: "OS",
    concept: "Process vs Thread",
    difficulty: "easy",
    stem:
      "A program spawns several workers that must share the same in-memory cache cheaply, without IPC overhead. Should they be separate processes or threads, and why?",
    options: [
      {
        text: "Threads, because they share the same address space",
        sub: "Shared memory by default",
        fix: "",
      },
      {
        text: "Processes, because they share the same address space",
        sub: "Processes share memory by default",
        fix:
          "Processes have separate address spaces by default; sharing memory between them needs explicit IPC or shared-memory segments. That's the overhead we want to avoid.",
      },
      {
        text: "Processes, because threads cannot run in parallel",
        sub: "Threads are always serialized",
        fix:
          "Threads can run in parallel on multiple cores (subject to language runtime details). The deciding factor here is cheap shared memory.",
      },
      {
        text: "Threads, because each gets an isolated address space",
        sub: "Isolation prevents shared cache",
        fix:
          "Threads do not get isolated address spaces; they share the process's memory. Isolation would defeat the goal of a shared cache.",
      },
    ],
    correctIndex: 0,
    proTip:
      "Threads of one process share the heap and global memory, so a shared cache is just a normal data structure. The trade-off is that a bug in one thread can corrupt shared state for all.",
    lesson:
      "Threads within a process share the same address space (heap, globals, file descriptors) but have separate stacks, making in-memory sharing essentially free. Processes have isolated address spaces, so sharing requires IPC or explicit shared memory. Choose threads for cheap data sharing; choose processes for fault isolation and security boundaries.",
  },
  {
    id: "q-os-pagereplace-001",
    subject: "OS",
    concept: "Page Replacement",
    difficulty: "hard",
    stem:
      "An OS using FIFO page replacement sees page faults increase when it is given more physical frames, which seems backwards. What is this counterintuitive phenomenon called?",
    options: [
      {
        text: "Belady's anomaly",
        sub: "More frames can cause more faults under FIFO",
        fix: "",
      },
      {
        text: "Thrashing",
        sub: "Excessive paging from over-commit",
        fix:
          "Thrashing is about too little memory for the working set. Here adding memory increases faults under a specific algorithm, which is Belady's anomaly.",
      },
      {
        text: "Working set drift",
        sub: "The active page set changes over time",
        fix:
          "Working set changes are normal program behavior; they don't explain faults rising specifically because frames were added under FIFO.",
      },
      {
        text: "TLB shootdown",
        sub: "Invalidating TLB entries across cores",
        fix:
          "A TLB shootdown is about translation cache coherence across CPUs, unrelated to frame count affecting fault rate.",
      },
    ],
    correctIndex: 0,
    proTip:
      "Belady's anomaly is specific to FIFO and some non-stack algorithms. Stack-based algorithms like LRU and OPT are provably immune: more frames never increase faults.",
    lesson:
      "Belady's anomaly is the surprising result that, under FIFO page replacement, increasing the number of physical frames can increase the number of page faults for certain reference strings. It does not occur with 'stack' algorithms such as LRU or the optimal (OPT) policy, which guarantee fault counts are monotonic in frame count.",
  },
  {
    id: "q-os-fork-001",
    subject: "OS",
    concept: "Processes & fork",
    difficulty: "medium",
    stem:
      "A parent process calls fork() and then exits immediately, but the child keeps running for minutes. The child's parent becomes PID 1. What term describes the child's new situation?",
    options: [
      {
        text: "It became a zombie process",
        sub: "Terminated but unreaped",
        fix:
          "A zombie is a process that has terminated but whose exit status hasn't been collected. This child is still running, not terminated.",
      },
      {
        text: "It became an orphan, re-parented to init (PID 1)",
        sub: "Parent died while child runs",
        fix: "",
      },
      {
        text: "It became a daemon by definition",
        sub: "Any re-parented process is a daemon",
        fix:
          "Daemons are deliberately created background services (often via double-fork and detaching). Merely outliving its parent makes the child an orphan, not automatically a daemon.",
      },
      {
        text: "It was killed by SIGCHLD",
        sub: "Parent's exit signals the child to die",
        fix:
          "A parent exiting does not kill its children, and SIGCHLD is sent to the parent about the child, not the other way around.",
      },
    ],
    correctIndex: 1,
    proTip:
      "Orphans are adopted by init/PID 1, which reaps them when they finish. Contrast with zombies, which are finished-but-unreaped and consume a process table entry until the parent calls wait().",
    lesson:
      "When a parent terminates before its child, the child becomes an orphan and is re-parented to init (PID 1), which will wait() on it when it eventually exits. A zombie is the opposite timing: the child has terminated but the parent hasn't reaped its exit status, leaving a defunct entry in the process table.",
  },
  {
    id: "q-os-mutex-001",
    subject: "OS",
    concept: "Locks & Mutexes",
    difficulty: "medium",
    stem:
      "A high-priority thread is blocked waiting on a mutex held by a low-priority thread, but a medium-priority thread keeps preempting the low-priority holder so it never releases the lock. What is this, and a standard fix?",
    options: [
      {
        text: "Priority inversion; fix with priority inheritance",
        sub: "Holder temporarily inherits the waiter's priority",
        fix: "",
      },
      {
        text: "Deadlock; fix with lock ordering",
        sub: "Break a circular wait",
        fix:
          "There's no circular wait here — only one lock is involved. The high-priority thread is delayed, not deadlocked.",
      },
      {
        text: "Livelock; fix with backoff",
        sub: "Threads keep retrying without progress",
        fix:
          "Livelock involves threads actively changing state without progress. Here the high-priority thread is simply blocked, a priority inversion.",
      },
      {
        text: "Starvation of the medium thread; fix with aging",
        sub: "Medium thread never runs",
        fix:
          "The medium thread is running fine — it's the high-priority thread that's stuck. The problem is inversion, not starvation of the medium thread.",
      },
    ],
    correctIndex: 0,
    proTip:
      "Priority inheritance temporarily boosts the lock holder to the highest waiter's priority so it can finish and release quickly. The Mars Pathfinder bug was a famous real-world case.",
    lesson:
      "Priority inversion happens when a high-priority task waits on a resource held by a low-priority task, while medium-priority tasks preempt the holder and prevent it from releasing. Priority inheritance solves it by temporarily raising the holder's priority to that of the highest-priority waiter, so the critical section completes promptly.",
  },
  {
    id: "q-os-ipc-001",
    subject: "OS",
    concept: "IPC",
    difficulty: "easy",
    stem:
      "Two unrelated processes on the same machine need to exchange a stream of bytes. One writes, the other reads, and the OS buffers data between them through a file-like endpoint. Which IPC mechanism is being described?",
    options: [
      {
        text: "A pipe (or named pipe/FIFO)",
        sub: "Unidirectional byte stream buffered by the OS",
        fix: "",
      },
      {
        text: "A mutex",
        sub: "A lock for mutual exclusion",
        fix:
          "A mutex coordinates access to shared data; it does not transport a stream of bytes between processes.",
      },
      {
        text: "A page table",
        sub: "Maps virtual to physical addresses",
        fix:
          "A page table is part of address translation, not an inter-process communication channel.",
      },
      {
        text: "A system call table",
        sub: "Dispatch table for syscalls",
        fix:
          "The syscall table routes kernel entry points; it isn't a data channel between two processes.",
      },
    ],
    correctIndex: 0,
    proTip:
      "Pipes give a simple byte-stream channel. Anonymous pipes connect related processes (parent/child); named pipes (FIFOs) have a filesystem path so unrelated processes can connect.",
    lesson:
      "Inter-process communication lets separate processes exchange data. A pipe is a unidirectional, OS-buffered byte stream: one process writes, another reads. Named pipes (FIFOs) expose a filesystem path so unrelated processes can connect. Other IPC forms include shared memory (fastest, needs its own synchronization), message queues, and sockets.",
  },
  {
    id: "q-os-contextswitch-001",
    subject: "OS",
    concept: "Context Switching",
    difficulty: "medium",
    stem:
      "Profiling shows a system spending a large share of CPU time saving and restoring registers, program counters, and memory maps as it rapidly alternates between hundreds of runnable threads. What overhead is this, and what reduces it?",
    options: [
      {
        text: "Context-switch overhead; reduce by fewer/larger time slices or fewer threads",
        sub: "Switching cost grows with switch frequency",
        fix: "",
      },
      {
        text: "Page-fault overhead; reduce by adding RAM",
        sub: "Disk paging dominates",
        fix:
          "Saving/restoring registers and memory maps on each switch describes context switching, not page faults. The fix is fewer switches, not more RAM.",
      },
      {
        text: "Cache coherence traffic; reduce by fewer cores",
        sub: "Cross-core invalidations",
        fix:
          "Coherence traffic is about shared cache lines across cores, not the register/PC save-restore of switching between threads.",
      },
      {
        text: "System-call overhead; reduce by batching syscalls",
        sub: "Kernel entry cost",
        fix:
          "Syscall cost is per kernel entry. The described cost is specifically the state save/restore between threads, i.e., context switching.",
      },
    ],
    correctIndex: 0,
    proTip:
      "Each switch saves one thread's CPU state and loads another's, and can pollute caches/TLB. Too small a time quantum or too many runnable threads makes switching dominate useful work.",
    lesson:
      "A context switch saves the state of the running thread (registers, program counter, and possibly memory mappings) and restores another's so the CPU can multiplex many threads. It's pure overhead — no application work happens during the switch — and it grows with switch frequency. Reduce it by using larger time slices, limiting the number of runnable threads, or using async I/O instead of thread-per-task.",
  },

  // ----------------------------------------------------------------------------
  // CN
  // ----------------------------------------------------------------------------
  {
    id: "q-cn-tls-001",
    subject: "CN",
    concept: "TLS Handshake",
    difficulty: "medium",
    stem:
      "A browser connects to https://example.com for the first time. Before sending the HTTP request body, it verifies a certificate chain and negotiates encryption keys. Which layer of the request path is responsible for that?",
    options: [
      {
        text: "DNS",
        sub: "Resolves names to IP addresses",
        fix:
          "DNS only finds the server address. Certificate validation and key negotiation happen after the TCP connection starts.",
      },
      {
        text: "TCP 3-way handshake",
        sub: "Establishes a reliable byte stream",
        fix:
          "TCP creates the connection, but it does not verify certificates or negotiate application encryption.",
      },
      {
        text: "TLS handshake",
        sub: "Authenticates the server and establishes encrypted session keys",
        fix: "",
      },
      {
        text: "HTTP cache validation",
        sub: "Checks whether cached content is fresh",
        fix:
          "Cache validation is an HTTP concern and happens after the secure channel exists.",
      },
    ],
    correctIndex: 2,
    proTip:
      "HTTPS is HTTP over TLS over TCP. DNS gets the IP, TCP gives a stream, TLS secures it, then HTTP messages flow inside that secure channel.",
    lesson:
      "TLS provides confidentiality, integrity, and server authentication for HTTPS. The handshake validates the server certificate, agrees on cryptographic parameters, and derives session keys. Only after this secure channel is established does the browser send the HTTP request.",
  },
  {
    id: "q-cn-cache-001",
    subject: "CN",
    concept: "Caching",
    difficulty: "easy",
    stem:
      "A CDN serves the same product image to thousands of users near Mumbai without hitting the origin server each time. Which network idea is doing the most work here?",
    options: [
      {
        text: "Caching at an edge location",
        sub: "Stores repeated content close to users",
        fix: "",
      },
      {
        text: "TCP congestion control",
        sub: "Adjusts send rate based on network signals",
        fix:
          "Congestion control helps delivery, but it does not explain why the origin server is skipped.",
      },
      {
        text: "DNS recursion",
        sub: "Finds authoritative answers for names",
        fix:
          "DNS may route users to a nearby CDN node, but the repeated image delivery is the cache behavior.",
      },
      {
        text: "WebSockets",
        sub: "Keeps a bidirectional connection open",
        fix:
          "WebSockets are for live bidirectional communication, not static asset reuse.",
      },
    ],
    correctIndex: 0,
    proTip:
      "CDNs combine routing and caching: DNS or anycast gets users near an edge, then cache headers decide whether the edge can reuse stored content.",
    lesson:
      "Caching reduces latency and origin load by reusing prior responses. In web systems, browsers, proxies, and CDNs can cache assets based on headers like Cache-Control and ETag. CDNs are especially useful for static or widely repeated content because they serve it from locations closer to users.",
  },
  {
    id: "q-cn-tcpudp-001",
    subject: "CN",
    concept: "TCP vs UDP",
    difficulty: "medium",
    stem:
      "A live multiplayer game sends 60 position updates per second. The team would rather drop an occasional stale update than stall the stream waiting for a retransmission. Which transport protocol fits and why?",
    options: [
      {
        text: "TCP, because it guarantees in-order reliable delivery",
        sub: "Retransmits lost segments",
        fix:
          "TCP's reliability is exactly the problem here: head-of-line blocking stalls fresh updates while it retransmits a stale one. The game prefers to drop it.",
      },
      {
        text: "UDP, because it avoids retransmission and head-of-line blocking",
        sub: "Send-and-forget datagrams, lowest latency",
        fix: "",
      },
      {
        text: "TCP, because UDP cannot traverse the internet",
        sub: "UDP is LAN-only",
        fix:
          "UDP works fine across the internet (DNS, QUIC, and most real-time media use it). The latency trade-off, not reachability, is the deciding factor.",
      },
      {
        text: "UDP, because it guarantees ordering without overhead",
        sub: "Ordered delivery for free",
        fix:
          "UDP does not guarantee ordering or delivery at all. Its advantage here is precisely that it won't block to enforce them.",
      },
    ],
    correctIndex: 1,
    proTip:
      "For real-time data where freshness beats completeness (games, voice, video), UDP wins because a late retransmit is worse than a dropped packet. Reliability, if needed, is added selectively at the app layer.",
    lesson:
      "TCP provides reliable, ordered, connection-oriented delivery with retransmissions and congestion control, at the cost of latency and head-of-line blocking. UDP is connectionless and unreliable but minimal-latency. Real-time applications that value fresh data over guaranteed delivery choose UDP, often layering their own lightweight reliability where needed.",
  },
  {
    id: "q-cn-dns-001",
    subject: "CN",
    concept: "DNS",
    difficulty: "easy",
    stem:
      "Typing example.com in a browser triggers a lookup that returns 93.184.216.34 before any connection is made. Which system performed this name-to-address translation?",
    options: [
      {
        text: "DNS",
        sub: "Resolves domain names to IP addresses",
        fix: "",
      },
      {
        text: "ARP",
        sub: "Maps IP to MAC on the local link",
        fix:
          "ARP resolves an IP address to a hardware MAC address within a local network, not a domain name to an IP.",
      },
      {
        text: "DHCP",
        sub: "Assigns IP addresses to hosts",
        fix:
          "DHCP hands out IP configuration to your own device; it doesn't translate a website's name to its IP.",
      },
      {
        text: "NAT",
        sub: "Rewrites addresses at a gateway",
        fix:
          "NAT translates between private and public IP addresses at a router; it has nothing to do with resolving names.",
      },
    ],
    correctIndex: 0,
    proTip:
      "DNS is the internet's phone book. Resolution often walks from a recursive resolver to root, TLD, and authoritative servers, with heavy caching at each layer (and TTLs controlling freshness).",
    lesson:
      "The Domain Name System translates human-readable names like example.com into IP addresses. A recursive resolver queries the root, the top-level domain server, and the authoritative server as needed, caching results by TTL. ARP, DHCP, and NAT operate at different layers and solve unrelated addressing problems.",
  },
  {
    id: "q-cn-http-001",
    subject: "CN",
    concept: "HTTP Status Codes",
    difficulty: "easy",
    stem:
      "A client requests a resource that requires login, but it sends no credentials. The server should signal 'you are not authenticated' so the client knows to log in. Which status code is correct?",
    options: [
      {
        text: "401 Unauthorized",
        sub: "Authentication required or failed",
        fix: "",
      },
      {
        text: "403 Forbidden",
        sub: "Authenticated but not allowed",
        fix:
          "403 means the server understood who you are and still refuses; it's for authorization failures, not missing authentication. Use 401 when credentials are absent.",
      },
      {
        text: "404 Not Found",
        sub: "Resource doesn't exist",
        fix:
          "404 says the resource isn't there. The resource exists but requires authentication, so 401 is the precise signal.",
      },
      {
        text: "500 Internal Server Error",
        sub: "Server-side failure",
        fix:
          "500 indicates the server itself failed. A missing-credentials case is a client condition, signaled by 401.",
      },
    ],
    correctIndex: 0,
    proTip:
      "Remember the pairing: 401 = 'who are you?' (authentication), 403 = 'I know who you are, and no' (authorization). The names are historically swapped, which trips people up.",
    lesson:
      "HTTP status codes are grouped: 2xx success, 3xx redirection, 4xx client errors, 5xx server errors. 401 Unauthorized signals that authentication is required or has failed (credentials missing/invalid), typically accompanied by a WWW-Authenticate header. 403 Forbidden means the client is authenticated but lacks permission. 404 means the resource doesn't exist.",
  },
  {
    id: "q-cn-congestion-001",
    subject: "CN",
    concept: "Congestion Control",
    difficulty: "hard",
    stem:
      "A new TCP connection starts sending slowly, then doubles its sending rate roughly each round trip until it detects loss, after which it cuts back sharply. What mechanism is this early exponential ramp called?",
    options: [
      {
        text: "Slow start",
        sub: "Exponential growth of the congestion window until loss",
        fix: "",
      },
      {
        text: "Flow control via the receive window",
        sub: "Receiver limits how much sender can send",
        fix:
          "Flow control protects the receiver's buffer and is set by the advertised window. The described ramp is the sender probing network capacity — congestion control's slow start.",
      },
      {
        text: "Nagle's algorithm",
        sub: "Coalesces small packets",
        fix:
          "Nagle's algorithm batches tiny writes to reduce overhead; it doesn't govern the exponential window ramp.",
      },
      {
        text: "Selective acknowledgment (SACK)",
        sub: "Acks non-contiguous received ranges",
        fix:
          "SACK improves which losses are reported for retransmission; it isn't the rate-ramping mechanism described.",
      },
    ],
    correctIndex: 0,
    proTip:
      "Slow start grows the congestion window exponentially until it hits a threshold or detects loss, then transitions to the linear additive-increase of congestion avoidance. 'Slow' refers to the small starting window, not the growth rate.",
    lesson:
      "TCP congestion control probes available network capacity. Slow start begins with a small congestion window and doubles it roughly every round-trip time (exponential growth) until reaching a threshold or detecting loss. On loss it reduces the window (multiplicative decrease) and switches to congestion avoidance's slower linear increase. This is distinct from flow control, which protects the receiver, not the network.",
  },
  {
    id: "q-cn-lb-001",
    subject: "CN",
    concept: "Load Balancing",
    difficulty: "medium",
    stem:
      "Traffic to a web app has grown past what one server handles. A device in front distributes incoming requests across several identical backend servers and stops sending to any that fail health checks. What is this component?",
    options: [
      {
        text: "A load balancer",
        sub: "Spreads requests across backends, removes unhealthy ones",
        fix: "",
      },
      {
        text: "A firewall",
        sub: "Filters traffic by security rules",
        fix:
          "A firewall permits or blocks traffic by policy; it doesn't distribute requests across a backend pool or run health checks for routing.",
      },
      {
        text: "A DNS resolver",
        sub: "Translates names to IPs",
        fix:
          "While DNS can do coarse round-robin, the described per-request distribution with health checks and failover is a load balancer's job.",
      },
      {
        text: "A reverse proxy cache only",
        sub: "Caches responses",
        fix:
          "Caching is a related proxy feature, but the defining behavior here — spreading load across servers and dropping unhealthy ones — is load balancing.",
      },
    ],
    correctIndex: 0,
    proTip:
      "Load balancers improve both scalability and availability. Common algorithms include round robin, least connections, and IP hash; health checks let them route around failed instances automatically.",
    lesson:
      "A load balancer sits in front of a pool of backend servers and distributes incoming requests among them using algorithms like round robin or least connections. By running health checks and removing failing instances, it provides horizontal scalability and high availability. Layer 4 balancers route by IP/port; Layer 7 balancers can route by HTTP attributes like path or host.",
  },
  {
    id: "q-cn-idempotent-001",
    subject: "CN",
    concept: "REST & Idempotency",
    difficulty: "medium",
    stem:
      "A mobile client's network flaps and it retries the same request several times. The API designers want repeated retries to not create duplicate resources or double-charge. Which HTTP method choice and property supports safe retries for an update-by-id?",
    options: [
      {
        text: "Use PUT, which is idempotent — repeating it yields the same end state",
        sub: "Same request, same result",
        fix: "",
      },
      {
        text: "Use POST, which is idempotent by definition",
        sub: "Repeats are always safe",
        fix:
          "POST is not idempotent; repeating it typically creates a new resource each time, which is exactly the duplication risk described.",
      },
      {
        text: "Use GET to perform the update",
        sub: "GET can modify state safely",
        fix:
          "GET must be safe and read-only; using it to mutate state violates HTTP semantics and won't make updates idempotent.",
      },
      {
        text: "Use DELETE because it creates resources idempotently",
        sub: "Delete adds the resource",
        fix:
          "DELETE removes resources, not creates them. The task is an update-by-id, for which PUT is the idempotent choice.",
      },
    ],
    correctIndex: 0,
    proTip:
      "PUT, DELETE, and GET are idempotent; POST generally is not. For non-idempotent creates, add an idempotency key so the server can dedupe retried requests.",
    lesson:
      "An idempotent operation produces the same result no matter how many times it is applied. In HTTP, GET, PUT, and DELETE are defined as idempotent, while POST is not. Designing updates as PUT (replace by id) makes client retries safe. When you must use POST for creates, an idempotency key lets the server recognize and ignore duplicate retries.",
  },
  {
    id: "q-cn-subnet-001",
    subject: "CN",
    concept: "IP Addressing & Subnets",
    difficulty: "hard",
    stem:
      "A network is configured as 192.168.10.0/24. An admin needs to know how many usable host addresses it provides. What is the count and the reasoning?",
    options: [
      {
        text: "254 usable hosts (256 minus network and broadcast)",
        sub: "/24 leaves 8 host bits",
        fix: "",
      },
      {
        text: "256 usable hosts",
        sub: "All addresses are assignable",
        fix:
          "Two addresses are reserved — the network address (.0) and the broadcast address (.255) — so 256 total minus 2 leaves 254 usable.",
      },
      {
        text: "512 usable hosts",
        sub: "A /24 holds 9 host bits",
        fix:
          "A /24 has 32 − 24 = 8 host bits, giving 2^8 = 256 addresses, not 512. Nine host bits would be a /23.",
      },
      {
        text: "24 usable hosts",
        sub: "The /24 means 24 hosts",
        fix:
          "The /24 is the prefix length (network bits), not a host count. It leaves 8 host bits, i.e., 256 addresses and 254 usable.",
      },
    ],
    correctIndex: 0,
    proTip:
      "Usable hosts = 2^(32 − prefix) − 2 for IPv4. The minus two accounts for the network and broadcast addresses, which can't be assigned to hosts.",
    lesson:
      "In IPv4 CIDR notation, the prefix length (e.g., /24) is the number of network bits. Host bits = 32 − prefix. The number of addresses is 2^(host bits), and usable host addresses are that minus two (network and broadcast). So a /24 has 8 host bits → 256 addresses → 254 usable.",
  },
  {
    id: "q-cn-cors-001",
    subject: "CN",
    concept: "CORS",
    difficulty: "medium",
    stem:
      "JavaScript on https://app.example.com calls an API at https://api.other.com. The browser blocks reading the response and logs a cross-origin error, even though the server returned 200. What mechanism is enforcing this?",
    options: [
      {
        text: "The same-origin policy, relaxed only by CORS headers",
        sub: "Browser blocks cross-origin reads without permission",
        fix: "",
      },
      {
        text: "A server-side firewall rejecting the request",
        sub: "Network policy blocked it",
        fix:
          "The server returned 200, so it wasn't blocked at the network. The browser blocked the JavaScript from reading the response due to origin rules.",
      },
      {
        text: "TLS certificate validation failure",
        sub: "Bad certificate",
        fix:
          "A certificate failure would prevent the connection entirely, not return 200 with a cross-origin error. This is the same-origin policy/CORS.",
      },
      {
        text: "DNS resolution failure for api.other.com",
        sub: "Name didn't resolve",
        fix:
          "If DNS failed there'd be no 200 response at all. The request succeeded; the browser is enforcing cross-origin restrictions.",
      },
    ],
    correctIndex: 0,
    proTip:
      "CORS isn't server security — it's the browser protecting users. The server opts in by sending Access-Control-Allow-Origin (and friends); for some requests the browser first sends a preflight OPTIONS.",
    lesson:
      "Browsers enforce the same-origin policy: scripts can't read responses from a different origin (scheme+host+port) unless the server explicitly opts in via Cross-Origin Resource Sharing headers like Access-Control-Allow-Origin. The request may still reach the server and return 200, but the browser withholds the response from JavaScript. Non-simple requests trigger a preflight OPTIONS check first.",
  },
  {
    id: "q-cn-http2-001",
    subject: "CN",
    concept: "HTTP/1.1 vs HTTP/2",
    difficulty: "hard",
    stem:
      "A page loads 50 small assets from one host. Over HTTP/1.1 the browser is limited to a few connections and requests queue up. Switching to HTTP/2 removes much of this stall. Which HTTP/2 feature is most responsible?",
    options: [
      {
        text: "Multiplexing many streams over a single connection",
        sub: "Concurrent requests share one TCP connection",
        fix: "",
      },
      {
        text: "Switching the transport from TCP to UDP",
        sub: "HTTP/2 runs on UDP",
        fix:
          "HTTP/2 still runs over TCP (it's HTTP/3 that uses QUIC/UDP). The win here comes from multiplexing streams, not changing transport.",
      },
      {
        text: "Removing encryption to reduce overhead",
        sub: "Plaintext is faster",
        fix:
          "HTTP/2 in browsers is effectively always encrypted; it doesn't drop TLS. The improvement is request multiplexing.",
      },
      {
        text: "Caching responses on the server",
        sub: "Server-side cache",
        fix:
          "Server caching is orthogonal and exists in HTTP/1.1 too. The specific HTTP/2 advantage for many parallel assets is multiplexing.",
      },
    ],
    correctIndex: 0,
    proTip:
      "HTTP/2 multiplexes many request/response streams over one connection plus header compression (HPACK), removing the HTTP/1.1 need for many connections and reducing head-of-line blocking at the HTTP layer (TCP-level HOL remains, which HTTP/3 addresses).",
    lesson:
      "HTTP/1.1 handles one request per connection at a time, so browsers open a limited number of parallel connections and requests queue. HTTP/2 multiplexes many independent streams over a single TCP connection and compresses headers, dramatically improving load of many small assets. It still uses TCP; HTTP/3 moves to QUIC over UDP to also eliminate TCP-level head-of-line blocking.",
  },
  {
    id: "q-cn-cookies-001",
    subject: "CN",
    concept: "Sessions & Cookies",
    difficulty: "easy",
    stem:
      "HTTP is stateless, yet a website keeps you logged in across many requests. After login, the server sends a value the browser automatically attaches to every later request to identify you. What is this value carried in?",
    options: [
      {
        text: "A cookie (often a session id), sent via Set-Cookie/Cookie headers",
        sub: "Browser auto-attaches it per request",
        fix: "",
      },
      {
        text: "The TCP sequence number",
        sub: "Identifies the user across requests",
        fix:
          "TCP sequence numbers order bytes within one connection; they don't persist identity across separate HTTP requests.",
      },
      {
        text: "The source MAC address",
        sub: "Hardware address identifies the session",
        fix:
          "MAC addresses are link-local and not visible to the web server across the internet; they don't carry session identity.",
      },
      {
        text: "The DNS TTL",
        sub: "Caches your login",
        fix:
          "DNS TTL controls how long a name resolution is cached; it has nothing to do with user sessions.",
      },
    ],
    correctIndex: 0,
    proTip:
      "Cookies let stateless HTTP carry state. The server issues a session id via Set-Cookie; the browser returns it in the Cookie header. Flags like HttpOnly, Secure, and SameSite harden it against theft and CSRF.",
    lesson:
      "HTTP is stateless, so applications maintain sessions using cookies. On login the server sends Set-Cookie with a session identifier; the browser stores it and automatically includes it in the Cookie header on subsequent requests, letting the server recognize the user. Security flags (HttpOnly, Secure, SameSite) protect the cookie from script access, plaintext transmission, and cross-site misuse.",
  },
  {
    id: "q-cn-nat-001",
    subject: "CN",
    concept: "NAT",
    difficulty: "medium",
    stem:
      "Twenty devices on a home network all share a single public IP address when reaching the internet, yet replies still find the right device. Which router function makes this possible?",
    options: [
      {
        text: "NAT (network address translation), tracking ports per connection",
        sub: "Maps internal addresses/ports to one public IP",
        fix: "",
      },
      {
        text: "DNS, by giving each device a name",
        sub: "Names route the replies",
        fix:
          "DNS resolves names to addresses; it doesn't multiplex many private hosts behind one public IP or track return traffic.",
      },
      {
        text: "ARP, by broadcasting to find devices",
        sub: "ARP routes internet replies",
        fix:
          "ARP maps IP to MAC on the local link only. It can't translate between private and public internet addresses.",
      },
      {
        text: "TLS, by encrypting each device's traffic",
        sub: "Encryption separates the flows",
        fix:
          "TLS secures content but does nothing to share one public IP among many hosts or to demultiplex replies.",
      },
    ],
    correctIndex: 0,
    proTip:
      "PAT (NAT overload) is what home routers use: the router rewrites source IP/port and keeps a translation table so it can map each returning packet back to the right internal host and port.",
    lesson:
      "Network Address Translation lets many devices with private IP addresses share one public IP. The router rewrites the source address (and, in port address translation, the source port) on outbound packets and records the mapping, so when replies arrive it can translate them back to the correct internal host. This conserves scarce IPv4 addresses and adds a basic boundary between the private network and the internet.",
  },

  // ----------------------------------------------------------------------------
  // OOP
  // ----------------------------------------------------------------------------
  {
    id: "q-oop-solid-001",
    subject: "OOP",
    concept: "SOLID",
    difficulty: "medium",
    stem:
      "A PaymentProcessor class directly constructs RazorpayClient, StripeClient, and PayPalClient, then switches on provider names. Which design move most directly improves extensibility?",
    options: [
      {
        text: "Add more if-else branches",
        sub: "Keeps all provider logic in one class",
        fix:
          "More branches make every new provider modify the same class. That violates the open-closed direction.",
      },
      {
        text: "Depend on a PaymentGateway interface and inject implementations",
        sub: "Lets new providers plug in behind a stable contract",
        fix: "",
      },
      {
        text: "Make every provider method static",
        sub: "Removes instances but not coupling",
        fix:
          "Static methods do not solve the core problem. The processor still knows about every provider.",
      },
      {
        text: "Move all code into a base class",
        sub: "Centralizes behavior through inheritance",
        fix:
          "A base class can increase coupling. The better move is to depend on an abstraction and compose concrete gateways.",
      },
    ],
    correctIndex: 1,
    proTip:
      "This is open-closed plus dependency inversion working together: the processor stays closed to modification because it depends on an interface, not concrete payment SDKs.",
    lesson:
      "SOLID principles help keep object-oriented code flexible. Dependency inversion says high-level policy should depend on abstractions, not low-level details. Open-closed says behavior should be extendable without editing stable code. A PaymentGateway interface with injected implementations satisfies both.",
  },
  {
    id: "q-oop-srp-001",
    subject: "OOP",
    concept: "Single Responsibility",
    difficulty: "medium",
    stem:
      "An InvoiceManager class computes totals, renders a PDF, and emails the customer. A change to the email template forces re-testing tax math, and a tax-rule change risks breaking PDF layout. Which principle is violated?",
    options: [
      {
        text: "Single Responsibility Principle",
        sub: "A class should have one reason to change",
        fix: "",
      },
      {
        text: "Liskov Substitution Principle",
        sub: "Subtypes must be substitutable for base types",
        fix:
          "LSP is about inheritance and substitutability. There's no subtype misbehavior here — just one class doing three unrelated jobs.",
      },
      {
        text: "Interface Segregation Principle",
        sub: "Clients shouldn't depend on unused methods",
        fix:
          "ISP is about fat interfaces forcing clients to implement irrelevant methods. The issue here is one class with multiple responsibilities.",
      },
      {
        text: "Dependency Inversion Principle",
        sub: "Depend on abstractions, not concretions",
        fix:
          "DIP concerns the direction of dependencies. The described coupling is from mixing unrelated responsibilities, which is SRP.",
      },
    ],
    correctIndex: 0,
    proTip:
      "SRP is best read as 'one reason to change.' When edits to formatting, calculation, and delivery all land in one class, split it into calculation, rendering, and notification collaborators.",
    lesson:
      "The Single Responsibility Principle states a class should have only one reason to change. When tax calculation, PDF rendering, and emailing live in one class, unrelated changes interfere with each other and tests become entangled. Separating them into focused classes (e.g., InvoiceCalculator, InvoiceRenderer, InvoiceNotifier) isolates change and improves testability.",
  },
  {
    id: "q-oop-lsp-001",
    subject: "OOP",
    concept: "Liskov Substitution",
    difficulty: "hard",
    stem:
      "A Rectangle class has setWidth and setHeight. A Square subclass overrides them to keep width and height equal. Existing code that sets width to 5 and height to 4 on a Rectangle now gets area 16 when handed a Square, breaking its assumptions. Which principle does this violate?",
    options: [
      {
        text: "Liskov Substitution Principle",
        sub: "A subtype must honor the base type's contract",
        fix: "",
      },
      {
        text: "Open-Closed Principle",
        sub: "Open for extension, closed for modification",
        fix:
          "OCP is about extending behavior without editing stable code. Here the problem is a subtype breaking the base type's expected behavior, which is LSP.",
      },
      {
        text: "Single Responsibility Principle",
        sub: "One reason to change",
        fix:
          "The class isn't doing multiple jobs; a subtype is violating the base contract. That's LSP, not SRP.",
      },
      {
        text: "Interface Segregation Principle",
        sub: "Avoid fat interfaces",
        fix:
          "ISP concerns splitting bloated interfaces. The Square/Rectangle issue is about substitutability of a subtype, i.e., LSP.",
      },
    ],
    correctIndex: 0,
    proTip:
      "The Square-Rectangle problem is the classic LSP cautionary tale: an 'is-a' relationship that holds in geometry breaks behaviorally. Prefer modeling shapes as immutable or via composition rather than forcing the inheritance.",
    lesson:
      "The Liskov Substitution Principle says objects of a subtype must be usable anywhere the base type is expected, without breaking the program's correctness. Square inherits from Rectangle but violates the implicit contract that width and height vary independently, so code relying on that contract misbehaves. The fix is to avoid the inheritance — make shapes immutable or compose behavior instead.",
  },
  {
    id: "q-oop-compose-001",
    subject: "OOP",
    concept: "Composition vs Inheritance",
    difficulty: "hard",
    stem:
      "A Notification base class has subclasses for EmailNotification, SmsNotification, PromotionalEmail, TransactionalSms, and more combinations keep appearing. What design problem is showing up?",
    options: [
      {
        text: "Inheritance hierarchy explosion",
        sub: "Subclasses multiply as independent behaviors combine",
        fix: "",
      },
      {
        text: "Encapsulation failure",
        sub: "Internal state leaks across object boundaries",
        fix:
          "Encapsulation may still be fine. The visible issue is that subclass count grows with every combination of channel and message type.",
      },
      {
        text: "Runtime polymorphism is impossible",
        sub: "Objects cannot choose behavior dynamically",
        fix:
          "Runtime polymorphism is possible here; the issue is using inheritance for combinations that would compose better.",
      },
      {
        text: "A singleton is missing",
        sub: "Only one instance should exist",
        fix:
          "Singleton controls instance count. It does not solve combinatorial subclass growth.",
      },
    ],
    correctIndex: 0,
    proTip:
      "Composition lets you combine MessageType and DeliveryChannel as separate strategies. That turns class multiplication into small interchangeable parts.",
    lesson:
      "Inheritance is useful for stable is-a relationships. Composition is often better when behavior varies along multiple independent axes. If subclasses multiply for every combination, split those dimensions into separate objects and compose them.",
  },
  {
    id: "q-oop-encap-001",
    subject: "OOP",
    concept: "Encapsulation",
    difficulty: "easy",
    stem:
      "A BankAccount exposes its balance as a public, freely writable field. Other code sets balance to a negative number, bypassing the rule that withdrawals can't overdraw. Which OOP principle would have prevented this?",
    options: [
      {
        text: "Encapsulation: hide the field, expose controlled methods",
        sub: "Guard invariants behind deposit/withdraw",
        fix: "",
      },
      {
        text: "Polymorphism: let subclasses override balance",
        sub: "Overriding protects the value",
        fix:
          "Polymorphism is about substitutable behavior across types; it doesn't prevent external code from writing an invalid balance.",
      },
      {
        text: "Inheritance: put balance in a base class",
        sub: "A parent class secures the field",
        fix:
          "Merely moving the field to a base class doesn't restrict access. Without hiding it, callers can still set invalid values.",
      },
      {
        text: "Abstraction: describe the account in an interface",
        sub: "An interface blocks bad writes",
        fix:
          "Abstraction defines what operations exist, but the concrete safeguard against direct invalid writes is encapsulation hiding the state.",
      },
    ],
    correctIndex: 0,
    proTip:
      "Encapsulation isn't just 'make fields private' — it's keeping invariants enforceable. Expose intent-revealing methods (deposit, withdraw) that validate, and the object can never reach an illegal state from outside.",
    lesson:
      "Encapsulation bundles data with the methods that operate on it and restricts direct external access to internal state. By making balance private and exposing validated operations like deposit and withdraw, the class enforces its invariants (e.g., no overdraft) regardless of how callers use it. Public mutable fields break this guarantee by letting outside code put the object in an invalid state.",
  },
  {
    id: "q-oop-poly-001",
    subject: "OOP",
    concept: "Polymorphism",
    difficulty: "medium",
    stem:
      "A renderer loops over a list of Shape references and calls shape.area() on each. Circles, Squares, and Triangles each compute area differently, yet the loop has no type checks or switch. Which OOP feature makes the correct method run for each object?",
    options: [
      {
        text: "Runtime (dynamic) polymorphism via method overriding",
        sub: "The actual object's method is dispatched at runtime",
        fix: "",
      },
      {
        text: "Method overloading resolved at compile time",
        sub: "Same name, different parameter lists",
        fix:
          "Overloading picks among same-named methods by argument types at compile time. Here one call dispatches to different implementations based on the runtime object — that's overriding/dynamic dispatch.",
      },
      {
        text: "Encapsulation hiding the area field",
        sub: "Private data drives the call",
        fix:
          "Encapsulation hides state; it doesn't choose which subclass's method executes. Dynamic dispatch does that.",
      },
      {
        text: "Static binding to the Shape base method",
        sub: "Always calls the base implementation",
        fix:
          "Static binding to the base would call one fixed implementation, not each subclass's version. The scenario relies on runtime dispatch to the overrides.",
      },
    ],
    correctIndex: 0,
    proTip:
      "Dynamic dispatch lets you write code against the abstraction (Shape) while each concrete type supplies its own behavior. Adding a new shape requires no change to the rendering loop — that's the open-closed payoff.",
    lesson:
      "Runtime polymorphism lets a single call site invoke different implementations depending on the actual object's type. Each subclass overrides area(), and the runtime dispatches to the correct override (dynamic binding). This eliminates type switches and supports the open-closed principle: new Shape subclasses work with existing code unchanged. Overloading, by contrast, is resolved statically by parameter types.",
  },
  {
    id: "q-oop-factory-001",
    subject: "OOP",
    concept: "Factory Pattern",
    difficulty: "medium",
    stem:
      "Client code is littered with `new MySqlConnection()`, `new PostgresConnection()`, etc., chosen by config. You want callers to request a connection by name without knowing concrete classes or constructors. Which pattern fits?",
    options: [
      {
        text: "Factory (method) pattern",
        sub: "Centralize object creation behind a creator",
        fix: "",
      },
      {
        text: "Observer pattern",
        sub: "Notify subscribers of state changes",
        fix:
          "Observer is for event notification between objects, not for deciding which concrete class to instantiate.",
      },
      {
        text: "Decorator pattern",
        sub: "Wrap an object to add behavior",
        fix:
          "Decorator adds responsibilities to an existing object dynamically; it doesn't solve choosing and constructing the right concrete type.",
      },
      {
        text: "Singleton pattern",
        sub: "Ensure a single shared instance",
        fix:
          "Singleton controls how many instances exist, not how the right concrete class is selected and created for the caller.",
      },
    ],
    correctIndex: 0,
    proTip:
      "A factory concentrates the 'which class to new up' decision in one place, so client code depends only on the product interface. Swapping or adding implementations becomes a change in the factory, not across every call site.",
    lesson:
      "The Factory pattern encapsulates object creation: instead of scattering constructor calls, clients ask a factory for a product by some criterion and receive an instance typed to an interface. This decouples callers from concrete classes, centralizes construction logic, and makes it easy to add or swap implementations. Observer, Decorator, and Singleton solve unrelated problems (notification, dynamic wrapping, single instance).",
  },
  {
    id: "q-oop-strategy-001",
    subject: "OOP",
    concept: "Strategy Pattern",
    difficulty: "medium",
    stem:
      "A checkout class hardcodes a giant if-else choosing among flat-rate, weight-based, and free shipping calculations, and a new rule means editing that method again. You want to select the algorithm at runtime and add new ones without touching checkout. Which pattern applies?",
    options: [
      {
        text: "Strategy pattern: encapsulate each algorithm behind a common interface",
        sub: "Inject the chosen algorithm at runtime",
        fix: "",
      },
      {
        text: "Singleton pattern",
        sub: "One shared instance",
        fix:
          "Singleton governs instance count; it doesn't let you swap interchangeable algorithms or add new ones without editing checkout.",
      },
      {
        text: "Adapter pattern",
        sub: "Convert one interface to another",
        fix:
          "Adapter reconciles incompatible interfaces. Here the algorithms already share intent; you need interchangeable strategies, not interface conversion.",
      },
      {
        text: "Facade pattern",
        sub: "Simplify a complex subsystem",
        fix:
          "Facade provides a simplified entry point to a subsystem; it doesn't address selecting among interchangeable algorithms at runtime.",
      },
    ],
    correctIndex: 0,
    proTip:
      "Strategy turns a branching method into a family of pluggable objects implementing a shared interface. checkout depends on the ShippingStrategy abstraction; new rules are new classes, satisfying open-closed.",
    lesson:
      "The Strategy pattern defines a family of interchangeable algorithms, encapsulates each behind a common interface, and lets the client choose one at runtime. Replacing a sprawling conditional with injected strategy objects removes branching, isolates each algorithm for testing, and lets you add new behaviors without modifying the context class — a direct application of the open-closed principle.",
  },
  {
    id: "q-oop-coupling-001",
    subject: "OOP",
    concept: "Coupling & Cohesion",
    difficulty: "hard",
    stem:
      "Module A reaches deep into Module B's internals — `b.getConfig().getDb().getPool().setSize(10)` — so any change to B's internal structure breaks A. Which quality is poor here, and what reduces it?",
    options: [
      {
        text: "High coupling; reduce it by exposing a focused method on B (tell, don't ask)",
        sub: "Hide internals behind intent-revealing operations",
        fix: "",
      },
      {
        text: "Low cohesion; fix by merging A and B",
        sub: "Combine modules into one",
        fix:
          "Merging modules usually worsens design and doesn't address the chained internal access. The problem is tight coupling to B's structure, not cohesion.",
      },
      {
        text: "Too much encapsulation; fix by exposing more getters",
        sub: "Add public accessors",
        fix:
          "Adding more getters deepens the exposure of internals and increases coupling — the opposite of the fix. B should expose a purposeful operation instead.",
      },
      {
        text: "Excessive polymorphism; fix by removing interfaces",
        sub: "Fewer abstractions",
        fix:
          "There's no polymorphism issue here. The chained calls reveal structural coupling, addressed by a cohesive method on B, not by removing abstractions.",
      },
    ],
    correctIndex: 0,
    proTip:
      "Long call chains into another object's guts (a 'train wreck') signal high coupling and violate the Law of Demeter. Give B a method like configurePool(size) so callers state intent and B owns its internals.",
    lesson:
      "Coupling measures how dependent modules are on each other's details; cohesion measures how focused a module's responsibilities are. Reaching through several layers of another object's internals creates high (structural) coupling, so internal changes ripple outward. The Law of Demeter — 'only talk to your immediate collaborators' — suggests exposing an intent-revealing method that hides the internal chain, lowering coupling.",
  },
  {
    id: "q-oop-abstraction-001",
    subject: "OOP",
    concept: "Abstraction",
    difficulty: "easy",
    stem:
      "A logging API offers a single log(message) method. Behind it, messages may go to a file, the console, or a remote service, but callers never see those details and don't change when the backend changes. Which OOP concept does this illustrate?",
    options: [
      {
        text: "Abstraction: expose essential behavior, hide implementation",
        sub: "Callers depend on what, not how",
        fix: "",
      },
      {
        text: "Inheritance: log() is shared via a base class",
        sub: "Subclasses reuse the parent",
        fix:
          "Inheritance is a reuse mechanism; it isn't the point here. The key idea is that callers see a simple interface and not the backend details — abstraction.",
      },
      {
        text: "Encapsulation of the caller's variables",
        sub: "Hiding the caller's local state",
        fix:
          "Encapsulation hides an object's own internal state. Here the emphasis is presenting a simplified interface that conceals how logging works — abstraction.",
      },
      {
        text: "Polymorphism choosing log() by argument type",
        sub: "Overload resolution",
        fix:
          "Polymorphism may help implement multiple backends, but the concept the scenario highlights is hiding complexity behind a simple interface — abstraction.",
      },
    ],
    correctIndex: 0,
    proTip:
      "Abstraction is about the interface you present: callers reason about 'log a message,' not file handles or network retries. It pairs with encapsulation, which hides the concrete state that makes that interface work.",
    lesson:
      "Abstraction exposes only the essential operations of a component while hiding how they're implemented. A log(message) method lets callers ignore whether logging writes to a file, console, or network, so the backend can change without affecting them. It's closely related to encapsulation (hiding internal state) but focuses on simplifying the interface that clients depend on.",
  },
  {
    id: "q-oop-observer-001",
    subject: "OOP",
    concept: "Observer Pattern",
    difficulty: "medium",
    stem:
      "When an order's status changes, several unrelated systems must react: email, analytics, and inventory. You want the order object to notify all interested parties without knowing who they are, and to allow adding new listeners later. Which pattern fits?",
    options: [
      {
        text: "Observer pattern: subject notifies registered observers",
        sub: "Decoupled publish/subscribe of state changes",
        fix: "",
      },
      {
        text: "Factory pattern",
        sub: "Encapsulate object creation",
        fix:
          "Factory is about creating objects, not broadcasting state changes to a dynamic set of listeners.",
      },
      {
        text: "Strategy pattern",
        sub: "Swap interchangeable algorithms",
        fix:
          "Strategy selects one algorithm to use; it doesn't model one subject notifying many independent subscribers of an event.",
      },
      {
        text: "Decorator pattern",
        sub: "Wrap to add behavior",
        fix:
          "Decorator adds responsibilities to a single object by wrapping it; it doesn't provide one-to-many event notification.",
      },
    ],
    correctIndex: 0,
    proTip:
      "Observer (publish/subscribe) decouples the source of an event from its handlers. The subject keeps a list of observers and calls a common notify method; new reactions are new observers, with no change to the order class.",
    lesson:
      "The Observer pattern defines a one-to-many dependency: a subject maintains a list of observers and notifies them automatically when its state changes, via a shared update interface. This decouples the subject from concrete handlers, so you can add or remove reactions (email, analytics, inventory) without modifying the subject — a foundation of event-driven and publish/subscribe designs.",
  },
  {
    id: "q-oop-singleton-001",
    subject: "OOP",
    concept: "Singleton Pattern",
    difficulty: "easy",
    stem:
      "An app needs exactly one shared configuration object that every module reads, and creating multiple copies causes inconsistent settings. You want a single globally accessible instance created once. Which pattern is intended for this, and what's a common caveat?",
    options: [
      {
        text: "Singleton; caveat: global state hurts testability",
        sub: "One instance, global access point",
        fix: "",
      },
      {
        text: "Factory; caveat: it creates many instances",
        sub: "Centralized creation",
        fix:
          "A factory's job is to create instances on demand — potentially many — not to guarantee exactly one shared instance.",
      },
      {
        text: "Observer; caveat: too many notifications",
        sub: "Publish/subscribe",
        fix:
          "Observer is about event notification, not ensuring a single shared instance of an object.",
      },
      {
        text: "Adapter; caveat: interface mismatch",
        sub: "Convert interfaces",
        fix:
          "Adapter reconciles incompatible interfaces; it has nothing to do with constraining an object to a single instance.",
      },
    ],
    correctIndex: 0,
    proTip:
      "Singleton guarantees one instance and a global access point, which is handy for shared config or connection pools — but it introduces global state that complicates testing and hides dependencies. Dependency injection of a single instance is often a cleaner alternative.",
    lesson:
      "The Singleton pattern restricts a class to a single instance and provides a global access point to it, useful for shared resources like configuration or a connection pool. The well-known caveat is that it introduces global mutable state, which can hide dependencies, complicate unit testing, and cause subtle issues with concurrency and initialization order. Many teams prefer injecting one shared instance instead.",
  },
];

export const DSA_PROMPTS = [
  {
    id: "dsa-window-001",
    concept: "Sliding Window",
    difficulty: "medium",
    prompt:
      "You are given an array of positive integers and a target sum. Explain how you would find the minimum length contiguous subarray whose sum is at least the target. Do not write code; describe the logic and edge cases.",
    hints: [
      "Positive integers let the left pointer move forward without missing a better answer.",
      "Track a running window sum and shrink while the sum is high enough.",
      "If no valid window appears, return 0.",
    ],
    modelAnswer:
      "Use two pointers. Expand the right pointer and add each value to a running sum. Whenever the sum is at least the target, update the best length, then move the left pointer forward while subtracting from the sum. Because all numbers are positive, shrinking the left side can only decrease the sum, so every candidate window is considered once. If best was never updated, return 0.",
    rubric: [
      "Uses two pointers instead of checking every subarray.",
      "Shrinks the window while the condition remains true.",
      "Explains why positivity makes the approach valid.",
      "Mentions the no-solution case.",
    ],
  },
  {
    id: "dsa-graph-001",
    concept: "Graph BFS",
    difficulty: "easy",
    prompt:
      "A grid contains empty cells, walls, and one source cell. Explain how you would compute the shortest distance from the source to every reachable empty cell.",
    hints: [
      "Unweighted shortest path points to BFS.",
      "Push the source first with distance 0.",
      "Visit each valid neighbor once.",
    ],
    modelAnswer:
      "Run BFS from the source. Put the source in a queue with distance 0 and mark it visited. Pop a cell, inspect its four neighbors, skip walls/out-of-bounds/visited cells, assign distance current + 1, mark visited, and push it. BFS processes cells by increasing distance, so the first distance assigned to each cell is the shortest.",
    rubric: [
      "Identifies BFS as the right algorithm.",
      "Uses a queue and visited set/grid.",
      "Handles walls and boundaries.",
      "Explains why the first visit is shortest.",
    ],
  },
  {
    id: "dsa-dp-001",
    concept: "Dynamic Programming",
    difficulty: "hard",
    prompt:
      "You can climb 1 or 2 stairs at a time. Explain how to count the number of distinct ways to reach step n, and why the recurrence works.",
    hints: [
      "Every path to step n comes from step n-1 or n-2.",
      "Base cases define the recurrence.",
      "Only the last two states are needed for an optimized version.",
    ],
    modelAnswer:
      "Let dp[i] be the number of ways to reach step i. The last move into i is either from i - 1 using one step or from i - 2 using two steps, so dp[i] = dp[i - 1] + dp[i - 2]. Base cases can be dp[0] = 1 and dp[1] = 1. Fill up to n. Since each state only needs the previous two, the memory can be reduced to two variables.",
    rubric: [
      "Defines a clear state.",
      "Gives correct base cases.",
      "Derives the recurrence from the last move.",
      "Mentions time or space complexity.",
    ],
  },
  {
    id: "dsa-twopointer-001",
    concept: "Two Pointers",
    difficulty: "easy",
    prompt:
      "Given a sorted array, explain how to find whether any two distinct elements sum to a given target, in linear time and constant extra space.",
    hints: [
      "The array is already sorted — exploit that ordering.",
      "Start one pointer at each end.",
      "Move based on whether the current sum is too big or too small.",
    ],
    modelAnswer:
      "Place a left pointer at the start and a right pointer at the end. Compute their sum: if it equals the target, you found a pair; if it's less than the target, move left rightward to increase the sum; if it's more, move right leftward to decrease it. Each step discards exactly the elements that cannot form the target, so the pointers converge in O(n) time with O(1) space. If they cross without a match, no pair exists.",
    rubric: [
      "Uses two pointers from both ends of the sorted array.",
      "Correctly decides which pointer to move from the comparison.",
      "Argues O(n) time and O(1) space.",
      "Handles the no-pair termination when pointers cross.",
    ],
  },
  {
    id: "dsa-binsearch-001",
    concept: "Binary Search",
    difficulty: "medium",
    prompt:
      "Explain how to find the index of a target in a sorted array in O(log n), and describe the most common off-by-one pitfalls in the loop.",
    hints: [
      "Halve the search space each step.",
      "Be precise about whether bounds are inclusive.",
      "Compute the midpoint without overflow.",
    ],
    modelAnswer:
      "Maintain low and high bounds over the array. Each iteration compute mid = low + (high - low) / 2 (avoiding overflow), compare arr[mid] to the target, and discard half: if arr[mid] < target search the right half (low = mid + 1), else if greater search the left half (high = mid - 1), else return mid. Decide an invariant up front — typically [low, high] inclusive with the loop running while low <= high. The common bugs are an inclusive/exclusive mismatch in the loop condition, forgetting the +1/-1 when narrowing, and integer overflow from (low + high) / 2.",
    rubric: [
      "Halves the search range each iteration for O(log n).",
      "States a clear loop invariant (inclusive vs exclusive bounds).",
      "Updates bounds with the correct +1/-1.",
      "Mentions overflow-safe midpoint or other pitfalls.",
    ],
  },
  {
    id: "dsa-hashing-001",
    concept: "Hashing",
    difficulty: "easy",
    prompt:
      "Given an unsorted array, explain how to find whether two elements sum to a target in O(n) time, and what the trade-off is versus the sorted two-pointer approach.",
    hints: [
      "Trade space for time with a hash set/map.",
      "For each value, what complement do you need?",
      "One pass can both check and insert.",
    ],
    modelAnswer:
      "Iterate once, keeping a hash set of values seen so far. For each element x, check whether target - x is already in the set; if so, you've found a pair. Otherwise insert x and continue. This runs in O(n) time and O(n) space and works on unsorted input. The trade-off versus the two-pointer method is memory: two pointers needs O(1) space but requires the array to be sorted first (O(n log n) if it isn't), while hashing avoids sorting at the cost of extra space.",
    rubric: [
      "Uses a hash set/map of seen elements.",
      "Checks for the complement (target - x) before inserting.",
      "States O(n) time and O(n) space.",
      "Compares the space/sorting trade-off with two pointers.",
    ],
  },
  {
    id: "dsa-stack-001",
    concept: "Stack",
    difficulty: "easy",
    prompt:
      "Explain how to check whether a string of brackets like ()[]{} is balanced, and identify the cases that should return false.",
    hints: [
      "A stack naturally matches most-recent open brackets.",
      "Push opens, pop on closes.",
      "Think about leftover or unmatched brackets.",
    ],
    modelAnswer:
      "Scan left to right using a stack. On an opening bracket, push it. On a closing bracket, the top of the stack must be the matching opener — if the stack is empty or the top doesn't match, the string is unbalanced, return false. After the scan, the string is balanced only if the stack is empty (no unclosed openers). The two failure modes are a closing bracket with no/incorrect matching open on top, and leftover openers at the end.",
    rubric: [
      "Pushes openers and matches closers against the stack top.",
      "Returns false on mismatch or empty stack at a closer.",
      "Requires the stack to be empty at the end.",
      "Identifies both unmatched-close and leftover-open failures.",
    ],
  },
  {
    id: "dsa-linkedlist-001",
    concept: "Linked List",
    difficulty: "medium",
    prompt:
      "Explain how to detect whether a singly linked list contains a cycle, using O(1) extra space, and why the method works.",
    hints: [
      "Two pointers at different speeds.",
      "Think about what happens inside a loop.",
      "Compare against a hash-set approach on space.",
    ],
    modelAnswer:
      "Use Floyd's tortoise and hare: a slow pointer advances one node per step and a fast pointer two. If the list ends (fast or fast.next is null), there's no cycle. If there is a cycle, the fast pointer eventually laps the slow pointer and they meet inside the loop, because each step the gap between them shrinks by one within the cycle. This uses O(1) extra space, versus an O(n)-space hash set of visited nodes.",
    rubric: [
      "Uses slow/fast pointers (one and two steps).",
      "Detects no-cycle via reaching the end (null).",
      "Explains why the pointers must meet inside a cycle.",
      "Notes the O(1) space advantage over hashing.",
    ],
  },
  {
    id: "dsa-tree-001",
    concept: "Tree Traversal",
    difficulty: "medium",
    prompt:
      "Explain how to verify that a binary tree is a valid binary search tree, and why simply comparing each node to its immediate children is insufficient.",
    hints: [
      "BST validity is a range constraint, not just a local one.",
      "Carry allowed (min, max) bounds down the recursion.",
      "An in-order traversal has a useful property too.",
    ],
    modelAnswer:
      "Recurse with an allowed open interval (min, max) for each node, starting unbounded. A node's value must lie strictly within its bounds; then recurse left with the upper bound tightened to the node's value, and right with the lower bound tightened to it. Comparing only to immediate children fails because a deep descendant can violate an ancestor's constraint while still satisfying its parent. Equivalently, an in-order traversal of a valid BST yields strictly increasing values, so you can check that the sequence is sorted.",
    rubric: [
      "Passes down (min, max) bounds, not just parent-child checks.",
      "Tightens the correct bound when recursing left vs right.",
      "Explains the deep-descendant counterexample.",
      "Mentions the in-order-sorted alternative or complexity.",
    ],
  },
  {
    id: "dsa-heap-001",
    concept: "Heap / Top-K",
    difficulty: "medium",
    prompt:
      "Given a large stream of numbers, explain how to efficiently keep track of the K largest seen so far, and the time complexity per element.",
    hints: [
      "A heap of fixed size K.",
      "Which kind of heap lets you drop the smallest cheaply?",
      "Compare to fully sorting everything.",
    ],
    modelAnswer:
      "Maintain a min-heap of size K. For each incoming number, if the heap has fewer than K elements, push it. Otherwise compare it to the heap's minimum (the root): if the new number is larger, pop the smallest and push the new one; if not, discard it. The heap always holds the current K largest, and its root is the K-th largest. Each element costs O(log K), so processing n elements is O(n log K) time with O(K) space — far better than sorting all n at O(n log n), especially when K is small.",
    rubric: [
      "Uses a min-heap of size K (root = smallest kept).",
      "Replaces the root only when the new value is larger.",
      "States O(log K) per element, O(K) space.",
      "Compares favorably to fully sorting the stream.",
    ],
  },
  {
    id: "dsa-greedy-001",
    concept: "Greedy",
    difficulty: "hard",
    prompt:
      "Given a set of intervals with start and end times, explain how to find the maximum number of mutually non-overlapping intervals you can select, and justify why the greedy choice is optimal.",
    hints: [
      "Sort by a particular endpoint.",
      "Greedily commit to intervals that free you up soonest.",
      "Use an exchange argument for optimality.",
    ],
    modelAnswer:
      "Sort the intervals by earliest end time. Walk through them, always selecting an interval if its start is at or after the end of the last selected one, and updating the last end. Choosing the interval that finishes earliest leaves the most room for future selections. This is optimal by an exchange argument: any optimal solution can be transformed, without reducing its size, to also pick the earliest-finishing compatible interval, so the greedy choice is never worse. Sorting dominates at O(n log n).",
    rubric: [
      "Sorts by earliest finishing time (not start time).",
      "Selects when start >= last selected end.",
      "Justifies optimality (exchange/greedy-stays-ahead argument).",
      "States O(n log n) from the sort.",
    ],
  },
  {
    id: "dsa-backtrack-001",
    concept: "Backtracking",
    difficulty: "hard",
    prompt:
      "Explain the general backtracking approach to generate all valid combinations (for example, all subsets or all permutations), and how pruning improves it.",
    hints: [
      "Build a partial solution and extend it choice by choice.",
      "Undo the last choice before trying the next.",
      "Cut branches that can't lead to a valid result.",
    ],
    modelAnswer:
      "Backtracking does a depth-first exploration of the decision tree. At each step you make a choice to extend the current partial solution, recurse, then undo the choice (backtrack) to try alternatives. When the partial solution is complete (e.g., correct length), record it. Pruning skips branches that provably can't yield a valid or better solution — for instance, enforcing that subset elements are chosen in increasing index order to avoid duplicates, or abandoning a path once a constraint is already violated. Pruning can dramatically cut the explored space even though the worst case stays exponential.",
    rubric: [
      "Describes choose / recurse / un-choose (backtrack) structure.",
      "Identifies the base case for a complete solution.",
      "Explains pruning to cut invalid/duplicate branches.",
      "Acknowledges exponential worst-case but practical gains.",
    ],
  },
  {
    id: "dsa-unionfind-001",
    concept: "Union-Find",
    difficulty: "hard",
    prompt:
      "You need to repeatedly merge groups and ask whether two elements are in the same group (for example, detecting connected components as edges are added). Explain the data structure and the two optimizations that make it nearly O(1) per operation.",
    hints: [
      "Each element points to a representative.",
      "Flatten chains during lookups.",
      "Attach the smaller tree under the larger.",
    ],
    modelAnswer:
      "Use a disjoint-set (union-find) structure where each element has a parent pointer; the root of a tree is the group's representative. find(x) follows parents to the root, and union(a, b) links one root under the other. Two optimizations make it near-constant amortized: path compression, where find re-points nodes directly to the root as it returns, flattening the tree; and union by rank/size, where the smaller tree is attached under the larger to keep trees shallow. Together they give an inverse-Ackermann (effectively constant) amortized cost per operation.",
    rubric: [
      "Represents groups as parent-pointer trees with a root representative.",
      "Describes find (to root) and union (link roots).",
      "Includes path compression.",
      "Includes union by rank/size and notes near-constant amortized cost.",
    ],
  },
];
