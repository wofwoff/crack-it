// Content bank for CrackIt.
// Each MCQ: { id, subject, concept, difficulty, stem, options[{text, sub, fix}], correctIndex, proTip, lesson }
// The correct option keeps fix: "". Every distractor explains why it is wrong in `fix`.
// Subjects: DBMS, OS, CN, OOP, CPP, PYTHON, OA. DSA prompts are self-graded logic drills.

import { NEW_CN } from "../new-questions-cn.js";
import { NEW_CPP } from "../new-questions-cpp.js";
import { NEW_DBMS } from "../new-questions-dbms.js";
import { NEW_OA } from "../new-questions-oa.js";
import { NEW_OOP } from "../new-questions-oop.js";
import { NEW_OS } from "../new-questions-os.js";
import { NEW_PYTHON } from "../new-questions-python.js";

export const QUESTIONS = [
{
    id: "q-dbms-iso-001",
    subject: "DBMS",
    concept: "Isolation Levels",
    difficulty: "medium",
    stem: "A banking application reads a user's account balance as $1,000 within an open transaction. A concurrent transaction withdraws $200 and commits. When the same transaction reads the balance again, it sees $800. Which isolation anomaly does this describe?",
    options: [
      {
        text: "Lost Update",
        sub: "Two concurrent writes; one silently overwrites the other",
        fix: "Lost update is a write-write race. This case is a read consistency problem caused by a committed update between two reads.",
      },
      {
        text: "Dirty Read",
        sub: "Reads uncommitted data from a concurrent transaction",
        fix: "Dirty reads happen before the other transaction commits. Here the withdrawal committed before the second read, so the issue is that the same row changed inside one transaction.",
      },
      {
        text: "Non-repeatable Read",
        sub: "Same query returns different values within one transaction",
        fix: "",
      },
      {
        text: "Phantom Read",
        sub: "New rows appear in repeated range queries",
        fix: "Phantom reads involve a repeated range query where new rows appear. This scenario reads the same account row twice and gets two values.",
      },
    ],
    correctIndex: 2,
    proTip: "Non-repeatable reads sit in the middle of SQL's isolation hierarchy. Raising from Read Committed to Repeatable Read usually gives each transaction a stable view of rows it has already read.",
    lesson: "A non-repeatable read happens when the same transaction reads the same row twice and gets different values because another committed transaction changed it in between. Dirty reads are about uncommitted data, phantom reads are about new rows in a repeated range query, and lost updates are about competing writes.",
    remember: "Non-repeatable read = same row, two different values across reads in one transaction; phantom read = new rows appear in a repeated range query.",
    interviewAnswer: "This is a non-repeatable read — the transaction reads the same account row twice, and a committed change in between gives it two different values. It's different from a dirty read because the other transaction had already committed before the second read, and it's different from a phantom because no new rows appeared, just a changed value on an existing row. Bumping isolation from Read Committed to Repeatable Read locks in the row's value for the duration of the transaction so this can't happen.",
  },
{
    id: "q-dbms-iso-002",
    subject: "DBMS",
    concept: "Isolation Levels",
    difficulty: "hard",
    stem: "A report runs SELECT COUNT(*) FROM orders WHERE status='PENDING' twice inside one transaction. Between the two reads, another transaction inserts three new pending orders and commits, so the counts differ. Which anomaly and which isolation level prevents it?",
    options: [
      {
        text: "Dirty read; fixed by Repeatable Read",
        sub: "Reading uncommitted inserts",
        fix: "The inserts were committed before the second read, so nothing dirty was read. Repeatable Read also does not reliably block phantoms in the SQL standard.",
      },
      {
        text: "Non-repeatable read; fixed by Read Committed",
        sub: "Existing row changed value",
        fix: "No existing row changed value here; entirely new rows appeared in the range. That is a phantom, not a non-repeatable read, and Read Committed does not stop it.",
      },
      {
        text: "Phantom read; fixed by Serializable",
        sub: "New rows match a repeated range predicate",
        fix: "",
      },
      {
        text: "Lost update; fixed by row locks",
        sub: "Competing writes overwrote each other",
        fix: "There is no competing write on the same row here. The reporting transaction only reads, so this is a phantom, not a lost update.",
      },
    ],
    correctIndex: 2,
    proTip: "Phantoms are about set membership, not row values. Serializable (often via predicate/range locks or serialization checks) is the standard level that eliminates them.",
    lesson: "A phantom read occurs when a transaction re-runs a range or predicate query and sees rows that were inserted (or deleted) by another committed transaction. The SQL standard only guarantees phantoms are prevented at Serializable isolation. Many engines use range locks or serializable snapshot isolation to enforce it.",
    remember: "Phantoms are about rows appearing or disappearing from a range query, not values changing — and only Serializable reliably blocks them.",
    interviewAnswer: "This is a phantom read because the second COUNT(*) picks up brand-new rows that didn't exist during the first read, rather than an existing row changing value. Repeatable Read locks the rows you've already touched, but it doesn't stop new rows from satisfying your predicate, so you need Serializable, which uses range or predicate locks to prevent inserts that would match a query you've already run. That's the key distinction interviewers look for: phantoms are about set membership, non-repeatable reads are about row values.",
  },
{
    id: "q-dbms-index-001",
    subject: "DBMS",
    concept: "Indexing",
    difficulty: "hard",
    stem: "A query filters on user_id and status, then sorts by created_at descending. The table has millions of rows and a single-column index on user_id. The plan still performs a large sort. Which index is most likely to help?",
    options: [
      {
        text: "An index on status only",
        sub: "Improves one predicate but ignores sort order",
        fix: "Status alone is usually low-cardinality and does not help the final ordering. The query needs an index that matches the filter prefix and the order.",
      },
      {
        text: "A composite index on user_id, status, created_at DESC",
        sub: "Matches filters first, then the order by",
        fix: "",
      },
      {
        text: "A hash index on created_at",
        sub: "Fast equality lookup, weak for range/order scans",
        fix: "Hash indexes are not useful for ordered scans. The query needs a B-tree style composite index whose key order matches the access pattern.",
      },
      {
        text: "A covering index on every table column",
        sub: "Avoids lookup but bloats writes and cache",
        fix: "Covering can help, but blindly indexing every column is expensive. Start with the predicate and ordering columns that drive the plan.",
      },
    ],
    correctIndex: 1,
    proTip: "Composite index order matters: equality filters first, then range or sort columns. That lets the engine narrow the scan and reuse index order instead of sorting a large result.",
    lesson: "Indexes trade write cost and storage for faster reads. For compound queries, the most useful index usually starts with the columns used in equality filters, then adds the column used for range scans or ordering. A covering index can also include projected columns, but it should be deliberate because every index slows writes.",
    remember: "Composite index column order = equality filters first, then the range/sort column — match the access pattern, don't just index \"the most important\" column.",
    interviewAnswer: "The fix is a composite index on (user_id, status, created_at DESC), because a composite B-tree index is only useful if its leading columns match your equality filters, and putting created_at last lets the database walk the index in already-sorted order instead of materializing and sorting the result set. An index on status alone barely helps since status is usually low-cardinality, and a hash index can't support range or order operations at all. The general rule is: equality columns first, then the column you sort or range-scan on.",
  },
{
    id: "q-dbms-index-002",
    subject: "DBMS",
    concept: "Indexing",
    difficulty: "medium",
    stem: "A table has a B-tree index on (last_name, first_name). A query filters only on first_name = 'Priya'. The optimizer chooses a full table scan instead of the index. Why?",
    options: [
      {
        text: "first_name has too many distinct values to index",
        sub: "High cardinality blocks index use",
        fix: "High cardinality usually makes an index more useful, not less. The real blocker is that first_name is not the leading column.",
      },
      {
        text: "B-tree indexes only work for equality on the whole key",
        sub: "Partial keys are never usable",
        fix: "B-trees do support partial-key lookups, but only as a left-to-right prefix. The issue is which prefix the query uses.",
      },
      {
        text: "The query skips the index's leading column, so the prefix is unusable",
        sub: "Filtering only on a non-leading column breaks the prefix",
        fix: "",
      },
      {
        text: "Composite indexes can only be used in ORDER BY",
        sub: "They never help WHERE clauses",
        fix: "Composite indexes absolutely help WHERE clauses when the leading columns are used. The problem here is the missing leading column.",
      },
    ],
    correctIndex: 2,
    proTip: "Think of a composite index like a phone book sorted by last name then first name. You can't efficiently find everyone named 'Priya' without the last name, because the data isn't ordered by first name.",
    lesson: "A composite B-tree index is ordered left to right. It can satisfy queries that use a left-prefix of the key (last_name, or last_name+first_name), but not a query that filters only on a trailing column. To serve a first_name-only filter, you need an index with first_name as its leading column.",
    remember: "A composite index is only usable through a left-to-right prefix of its columns — skip the leading column and the index is useless for that query.",
    interviewAnswer: "A composite index on (last_name, first_name) is ordered first by last_name and only then by first_name, so it's like a phone book — you can jump straight to a last name, but you can't efficiently find everyone named \"Priya\" without scanning the whole structure, since first names aren't grouped together independent of last name. Because the query filters only on first_name, it skips the leading column, so the optimizer correctly decides the index can't help and falls back to a full scan. To support that query efficiently you'd need a separate index with first_name as the leading column.",
  },
{
    id: "q-dbms-norm-001",
    subject: "DBMS",
    concept: "Normalization",
    difficulty: "medium",
    stem: "An Orders table stores customer_id, customer_email, and customer_address on every row. When a customer changes their email, dozens of order rows must be updated, and some get missed. Which normalization issue is this?",
    options: [
      {
        text: "Update anomaly from unnormalized redundancy",
        sub: "Duplicated customer data must be changed in many places",
        fix: "",
      },
      {
        text: "Over-normalization causing too many joins",
        sub: "Data split into excessive tables",
        fix: "This is the opposite: the data is under-normalized. Splitting customer attributes into their own table would fix it.",
      },
      {
        text: "Violation of first normal form",
        sub: "A column holds multiple values",
        fix: "1NF is about atomic, single-valued columns. Here each column is atomic; the problem is repeated customer data across rows.",
      },
      {
        text: "Loss of referential integrity",
        sub: "A foreign key points to a missing row",
        fix: "No dangling reference is described. The issue is duplicated non-key data, not a broken foreign key.",
      },
    ],
    correctIndex: 0,
    proTip: "Update, insertion, and deletion anomalies are the classic symptoms that a table needs to be decomposed. Moving customer attributes into a Customers table keyed by customer_id removes the redundancy.",
    lesson: "Normalization removes redundancy by decomposing tables so each fact is stored once. When non-key attributes (like customer_email) depend on something other than the table's key and are duplicated across rows, you get update anomalies. Moving those attributes to a table keyed by what they actually depend on resolves it, typically reaching 2NF/3NF.",
    remember: "Same non-key fact duplicated across many rows = update anomaly; the fix is always to move it into its own table keyed by what it depends on.",
    interviewAnswer: "This is a classic update anomaly caused by storing redundant customer data directly on the Orders table — since customer_email is duplicated across every order row, updating it means touching every single row, and missing any of them leaves the data inconsistent. It's not a 1NF violation since each column is still atomic, and there's no broken foreign key involved. The fix is to normalize by pulling customer attributes into a Customers table keyed by customer_id, so each fact is stored exactly once.",
  },
{
    id: "q-dbms-norm-002",
    subject: "DBMS",
    concept: "Normalization",
    difficulty: "hard",
    stem: "A table Students(student_id, zip_code, city) always has city fully determined by zip_code, while student_id is the primary key. Which normal form is violated, and what fixes it?",
    options: [
      {
        text: "2NF; remove partial dependency on part of the key",
        sub: "Non-key depends on part of a composite key",
        fix: "2NF concerns partial dependencies on a composite key. Here the key is a single column (student_id), so 2NF is not the issue.",
      },
      {
        text: "1NF; make city atomic",
        sub: "Column holds multiple values",
        fix: "city is already atomic. 1NF is satisfied; the problem is a dependency between two non-key columns.",
      },
      {
        text: "BCNF; the key is not a superkey",
        sub: "A determinant is not a candidate key",
        fix: "BCNF is the stricter generalization, but the textbook violation here is the transitive dependency, which 3NF targets directly.",
      },
      {
        text: "3NF; remove the transitive dependency zip_code -> city",
        sub: "A non-key attribute depends on another non-key attribute",
        fix: "",
      },
    ],
    correctIndex: 3,
    proTip: "3NF says non-key columns must depend on the key, the whole key, and nothing but the key. zip_code -> city is a non-key-to-non-key (transitive) dependency, so split it into a ZipCodes(zip_code, city) table.",
    lesson: "Third normal form forbids transitive dependencies: a non-key attribute determining another non-key attribute. Since city depends on zip_code (a non-key attribute) rather than directly on student_id, the table is in 2NF but not 3NF. Extracting zip_code -> city into its own table removes the redundancy.",
    remember: "3NF kills transitive dependencies (non-key to non-key); 2NF kills partial dependencies on part of a composite key — single-column keys can never violate 2NF.",
    interviewAnswer: "This table violates third normal form because zip_code determines city, and zip_code itself is a non-key attribute — that's a transitive dependency, where a non-key column determines another non-key column instead of everything depending directly on the primary key. It can't be a 2NF violation since the primary key here is a single column, student_id, and 2NF only applies to composite keys. The fix is to extract zip_code and city into their own table, so city is derived through a join instead of being duplicated and risking inconsistency.",
  },
{
    id: "q-dbms-acid-001",
    subject: "DBMS",
    concept: "ACID",
    difficulty: "easy",
    stem: "During a money transfer, the system debits account A, then crashes before crediting account B. After restart, the debit has been rolled back so no money disappeared. Which ACID property guaranteed this all-or-nothing behavior?",
    options: [
      {
        text: "Atomicity",
        sub: "A transaction either fully completes or fully rolls back",
        fix: "",
      },
      {
        text: "Isolation",
        sub: "Concurrent transactions don't interfere",
        fix: "Isolation is about concurrency between transactions. The scenario is a single transaction recovering from a crash.",
      },
      {
        text: "Durability",
        sub: "Committed data survives crashes",
        fix: "Durability guarantees committed work persists. Here the transaction never committed, so what mattered was rolling back the partial change.",
      },
      {
        text: "Consistency",
        sub: "Transactions move the DB between valid states",
        fix: "Consistency is the end goal, but the specific mechanism that undid the partial debit is atomicity's all-or-nothing rollback.",
      },
    ],
    correctIndex: 0,
    proTip: "Atomicity is enforced by the write-ahead log and rollback: uncommitted changes are undone on recovery so the transaction leaves no partial footprint.",
    lesson: "ACID stands for Atomicity, Consistency, Isolation, Durability. Atomicity guarantees a transaction is indivisible — either all its operations take effect or none do. If a crash occurs mid-transaction, recovery rolls back the incomplete work, which is exactly what prevented the orphaned debit.",
    remember: "Atomicity = all-or-nothing per transaction (crash recovery rolls back partial work); Durability = once committed, it survives a crash.",
    interviewAnswer: "This is atomicity — it guarantees a transaction is treated as a single indivisible unit, so if the system crashes before the credit to account B happens, the earlier debit from account A gets rolled back on recovery rather than leaving the system in a half-finished state. The database achieves this using its write-ahead log: uncommitted changes are undone during crash recovery, which is exactly the mechanism that erased the orphaned debit here. It's easy to confuse with consistency, but consistency is the outcome — atomicity is the actual all-or-nothing mechanism that produces it.",
  },
{
    id: "q-dbms-acid-002",
    subject: "DBMS",
    concept: "ACID",
    difficulty: "medium",
    stem: "A user clicks 'Place order', the database returns success, and a millisecond later the server loses power. After reboot, the order is still present. Which ACID property guarantees the committed order survived the crash?",
    options: [
      {
        text: "Atomicity",
        sub: "All-or-nothing execution",
        fix: "Atomicity covers partial-failure rollback during a transaction. Here the transaction already committed; the question is whether committed data persists.",
      },
      {
        text: "Durability",
        sub: "Once committed, data survives power loss and crashes",
        fix: "",
      },
      {
        text: "Isolation",
        sub: "Concurrent transactions stay independent",
        fix: "Isolation concerns concurrency, not crash survival of committed data.",
      },
      {
        text: "Consistency",
        sub: "Constraints and invariants hold",
        fix: "Consistency keeps the database valid, but the specific guarantee that a committed write outlives a power cut is durability.",
      },
    ],
    correctIndex: 1,
    proTip: "Durability is typically implemented by flushing the write-ahead/redo log to stable storage before acknowledging commit, so recovery can replay it.",
    lesson: "Durability means that once a transaction is committed, its effects persist even through power loss or crashes. Databases achieve this by writing changes to a durable log before confirming the commit, then replaying the log on restart to ensure no acknowledged write is lost.",
    remember: "Durability = once the commit is acknowledged, it survives a crash; the line that matters is \"before vs after commit,\" not \"single vs multiple operations.\"",
    interviewAnswer: "This is durability — once the database tells the client the order was successfully placed, that commit must survive any subsequent crash or power loss. Under the hood, this typically works by flushing the write-ahead log to durable storage before acknowledging the commit, so on reboot the database can replay the log and recover that exact write. It's distinct from atomicity, which is about all-or-nothing execution during the transaction itself — here the transaction already finished and committed, so the only question is whether committed data persists.",
  },
{
    id: "q-dbms-join-001",
    subject: "DBMS",
    concept: "Joins",
    difficulty: "medium",
    stem: "You need every customer listed, along with their orders if any exist, and customers with zero orders should still appear with NULL order fields. Which join produces this?",
    options: [
      {
        text: "INNER JOIN customers and orders",
        sub: "Only rows with matches on both sides",
        fix: "An inner join drops customers who have no orders, so customers with zero orders would vanish from the result.",
      },
      {
        text: "CROSS JOIN customers and orders",
        sub: "Cartesian product of both tables",
        fix: "A cross join pairs every customer with every order, producing a combinatorial blowup, not a per-customer order list.",
      },
      {
        text: "RIGHT (OUTER) JOIN customers to orders",
        sub: "All right rows, NULLs on the left",
        fix: "A right join keeps all order rows and could drop customers without orders, the opposite of what's required. (Written in this direction, customers without orders are lost.)",
      },
      {
        text: "LEFT (OUTER) JOIN customers to orders",
        sub: "All left rows, matched right rows or NULLs",
        fix: "",
      },
    ],
    correctIndex: 3,
    proTip: "A LEFT JOIN preserves every row from the left table. Unmatched right-side columns come back as NULL, which is exactly how you surface 'customers with no orders'.",
    lesson: "A LEFT OUTER JOIN returns all rows from the left table and the matching rows from the right table; where there is no match, right-side columns are NULL. An INNER JOIN returns only rows that match on both sides. Choose LEFT JOIN when you must keep every record from one table regardless of matches.",
    remember: "LEFT JOIN keeps every row from the left table no matter what — unmatched columns from the right just come back NULL.",
    interviewAnswer: "You'd use a LEFT OUTER JOIN from customers to orders, because a left join guarantees every row from the left table appears in the result, and any customer with no matching orders just gets NULLs in the order columns instead of being dropped. An inner join would silently exclude exactly the customers we care about — the ones with zero orders — since it only keeps rows that match on both sides. A right join would flip the problem, preserving every order but potentially losing customers, so the join direction and type both matter here.",
  },
{
    id: "q-dbms-mvcc-001",
    subject: "DBMS",
    concept: "Concurrency Control",
    difficulty: "hard",
    stem: "In Postgres, a long analytics SELECT runs for 30 seconds. Concurrent writers keep updating the same rows the whole time, yet the SELECT never blocks them and sees a stable snapshot. Which mechanism explains this?",
    options: [
      {
        text: "Multiversion concurrency control (MVCC)",
        sub: "Readers see a consistent snapshot of old row versions",
        fix: "",
      },
      {
        text: "Dirty reads at Read Uncommitted",
        sub: "Reading in-flight uncommitted changes",
        fix: "Reading uncommitted data would make the snapshot unstable and inconsistent, the opposite of the stable view described.",
      },
      {
        text: "Table-level exclusive locks",
        sub: "Whole table locked during the read",
        fix: "An exclusive table lock would stop writers entirely, contradicting the scenario where writers continue freely.",
      },
      {
        text: "Two-phase locking taking shared read locks",
        sub: "Readers lock rows, blocking writers",
        fix: "Under strict 2PL, readers would take shared locks and block writers. The scenario explicitly says writers are never blocked, so locking isn't the mechanism.",
      },
    ],
    correctIndex: 0,
    proTip: "MVCC keeps multiple versions of a row. Readers get the version valid at their snapshot, so 'readers don't block writers and writers don't block readers' becomes possible.",
    lesson: "Multiversion concurrency control gives each transaction a consistent snapshot by retaining older row versions instead of overwriting in place. Readers see the version that was committed as of their snapshot, so they don't need read locks and don't block writers. This is how databases like Postgres provide snapshot isolation with high read concurrency.",
    remember: "MVCC = readers see old row versions from their snapshot, so readers never block writers and writers never block readers.",
    interviewAnswer: "This is multiversion concurrency control — instead of locking rows for reads, Postgres keeps multiple versions of each row, and a long-running SELECT just keeps reading the versions that were valid at the moment its snapshot started. That's why concurrent writers can keep updating those same rows freely; they're creating new versions rather than fighting over locks with the reader. It's a key contrast with strict two-phase locking, where a long read would take shared locks and actually block those writers for the whole duration.",
  },
{
    id: "q-dbms-cap-001",
    subject: "DBMS",
    concept: "CAP Theorem",
    difficulty: "medium",
    stem: "A distributed datastore is split by a network partition. The team decides every node must keep answering reads and writes, even if some nodes return slightly stale data. Which CAP trade-off did they choose?",
    options: [
      {
        text: "They abandoned partition tolerance",
        sub: "Assume the network never splits",
        fix: "You cannot abandon partition tolerance in a real distributed system; partitions happen. The choice is between C and A when they occur.",
      },
      {
        text: "They chose consistency over availability (CP)",
        sub: "Reject requests to avoid stale reads",
        fix: "A CP system would refuse or block requests on the minority side to avoid stale data. Here they keep serving, so they did not prioritize consistency.",
      },
      {
        text: "They chose availability over consistency (AP)",
        sub: "Keep serving, tolerate temporary staleness",
        fix: "",
      },
      {
        text: "They achieved all three (CAP) simultaneously",
        sub: "Consistency, availability, and partition tolerance together",
        fix: "CAP says during a partition you cannot have both full consistency and full availability. You must trade one off.",
      },
    ],
    correctIndex: 2,
    proTip: "CAP is only a dilemma during a partition. Choosing to keep serving despite staleness is the classic AP stance; many systems offer tunable consistency to move along this spectrum.",
    lesson: "The CAP theorem states that during a network partition a distributed system can guarantee at most two of Consistency, Availability, and Partition tolerance. Since partitions are unavoidable, the real choice is between staying available (AP, risking stale reads) or staying consistent (CP, rejecting some requests).",
    remember: "CAP only kicks in during a partition: CP refuses/blocks to stay consistent, AP keeps serving and accepts staleness — you can't pick all three at once.",
    interviewAnswer: "By choosing to keep every node answering reads and writes during the partition, even with stale data, they're picking availability over consistency — that's the AP side of CAP. A CP system would instead reject or stall requests on the minority side of the partition to guarantee no one reads stale data. Since network partitions are unavoidable in a real distributed system, the actual decision you're always making is this consistency-versus-availability trade-off the moment a partition happens, not whether to support partition tolerance at all.",
  },
{
    id: "q-dbms-shard-001",
    subject: "DBMS",
    concept: "Sharding",
    difficulty: "medium",
    stem: "A single Postgres instance can't keep up with write volume on a 2-billion-row events table. The team wants writes spread across multiple machines. Which scaling approach fits?",
    options: [
      {
        text: "Add read replicas",
        sub: "Copy data to extra nodes for reads",
        fix: "Read replicas scale reads, not writes; all writes still funnel to the primary. The bottleneck here is write throughput.",
      },
      {
        text: "Add a larger cache in front of the database",
        sub: "Serve hot rows from memory",
        fix: "Caching offloads reads of hot data; it does not distribute write load across machines.",
      },
      {
        text: "Horizontally shard (partition) the table by a shard key",
        sub: "Split rows across nodes so each handles part of the writes",
        fix: "",
      },
      {
        text: "Increase the isolation level",
        sub: "Stronger transactional guarantees",
        fix: "Raising isolation adds overhead and never increases write capacity; it typically reduces concurrency.",
      },
    ],
    correctIndex: 2,
    proTip: "Sharding distributes both data and write load by a shard key (e.g., user_id hash). Pick a key with even distribution to avoid hot shards, and remember cross-shard queries get harder.",
    lesson: "Sharding (horizontal partitioning) splits a large table's rows across multiple database nodes based on a shard key, so each node owns a subset of data and absorbs a fraction of the write load. It scales writes beyond one machine, at the cost of more complex cross-shard queries and transactions. Replication, by contrast, scales reads and improves availability.",
    remember: "Replicas scale reads; sharding scales writes — sharding splits data across nodes by a shard key so each node absorbs only part of the write load.",
    interviewAnswer: "The right move is horizontal sharding — partitioning the events table across multiple Postgres instances by a shard key like a hashed user_id, so each node only has to handle a fraction of the total write traffic. Read replicas wouldn't help here because all writes still funnel through a single primary; replicas only offload read queries. The trade-off with sharding is that cross-shard queries and transactions become much harder, so picking a shard key with even distribution and minimal cross-shard access patterns really matters.",
  },
{
    id: "q-dbms-deadlock-001",
    subject: "DBMS",
    concept: "Deadlock",
    difficulty: "hard",
    stem: "Transaction T1 updates row A then tries to update row B; concurrently T2 updates row B then tries to update row A. Both hang and the database aborts one with a deadlock error. What's the most reliable way to prevent this recurring?",
    options: [
      {
        text: "Disable the deadlock detector",
        sub: "Let transactions wait it out",
        fix: "Disabling detection turns a quick abort into an indefinite hang. It hides the problem rather than preventing the cycle.",
      },
      {
        text: "Add more indexes on A and B",
        sub: "Faster lookups avoid contention",
        fix: "Indexes speed access but do not change the order in which transactions take conflicting locks, so the cycle can still form.",
      },
      {
        text: "Raise isolation to Serializable",
        sub: "Stronger guarantees stop deadlocks",
        fix: "Higher isolation does not prevent deadlocks; it often increases locking and can make them more likely. The cycle comes from lock ordering.",
      },
      {
        text: "Acquire locks on rows in a consistent global order",
        sub: "Always lock A before B everywhere",
        fix: "",
      },
    ],
    correctIndex: 3,
    proTip: "A consistent lock-acquisition order breaks the circular-wait condition. If every transaction grabs A before B, T1 and T2 can no longer hold one and wait on the other in a cycle.",
    lesson: "Database deadlocks arise when transactions acquire locks in opposite orders, creating a circular wait. Engines detect the cycle and abort a victim. The durable fix is to impose a consistent global lock ordering so cycles cannot form; shorter transactions and lower lock scope also reduce the window.",
    remember: "Deadlocks come from circular wait due to inconsistent lock ordering — the durable fix is a global, consistent lock-acquisition order, not stronger isolation.",
    interviewAnswer: "The real cause here is that T1 locks A then waits on B while T2 locks B then waits on A, forming a circular wait — that's a textbook deadlock, and the database's detector just picks a victim to abort. Raising isolation to Serializable doesn't fix this; it can actually make locking contention worse, since the problem is purely about the order locks are acquired, not how strict the isolation guarantees are. The reliable fix is enforcing a consistent global ordering, like always locking the lower-numbered row first, so a cycle like this can never form again.",
  },
{
    id: "q-dbms-denorm-001",
    subject: "DBMS",
    concept: "Denormalization",
    difficulty: "medium",
    stem: "A product page must join 6 normalized tables on every load, and the join has become the top latency cost under heavy read traffic. The team copies a few frequently-read fields onto the product row to skip joins. What is this technique and its main risk?",
    options: [
      {
        text: "Normalization; risk of more joins",
        sub: "Splitting data into more tables",
        fix: "This is the opposite of normalization. They are intentionally duplicating data to reduce joins, which is denormalization.",
      },
      {
        text: "Indexing; risk of slower writes",
        sub: "Adding a lookup structure",
        fix: "Indexing adds a separate structure for lookups; it does not copy fields onto rows. This scenario copies data to avoid joins.",
      },
      {
        text: "Denormalization; risk of data getting out of sync",
        sub: "Duplicating fields for read speed",
        fix: "",
      },
      {
        text: "Sharding; risk of cross-shard queries",
        sub: "Splitting rows across nodes",
        fix: "Sharding distributes rows across machines. Here data stays on one node but is duplicated across columns/tables for speed.",
      },
    ],
    correctIndex: 2,
    proTip: "Denormalization trades write complexity and storage for read speed. Once data is duplicated, you must keep copies in sync — often via triggers, application logic, or async jobs.",
    lesson: "Denormalization deliberately introduces redundancy (duplicated columns or precomputed aggregates) to avoid expensive joins and speed up reads. The trade-off is that every duplicate must be updated together, risking inconsistency. It's a common, valid optimization for read-heavy workloads when applied carefully.",
    remember: "Denormalization trades write complexity/storage for read speed by duplicating data — the cost is always keeping the copies in sync.",
    interviewAnswer: "This is denormalization — they're deliberately duplicating a few frequently-read fields onto the product row so reads don't have to join six tables every time, which is the opposite of normalization's goal of storing each fact once. The upside is a big win in read latency under heavy traffic, but the real risk is that now there are multiple copies of the same data that all have to be kept in sync, usually through triggers, application-level updates, or async jobs. It's a legitimate, common optimization for read-heavy systems, but it has to be applied deliberately because every duplicate is a place data can drift out of sync.",
  },
{
    id: "q-dbms-keys-001",
    subject: "DBMS",
    concept: "Keys & Constraints",
    difficulty: "easy",
    stem: "An Orders table has customer_id that must always reference an existing row in Customers. A bug let an order be inserted with a customer_id that no Customer row has. Which constraint, if enforced, would have blocked it?",
    options: [
      {
        text: "A NOT NULL constraint on customer_id",
        sub: "Value cannot be empty",
        fix: "NOT NULL only forbids missing values; a non-null but non-existent customer_id would still slip through.",
      },
      {
        text: "A FOREIGN KEY referencing Customers(customer_id)",
        sub: "Value must exist in the referenced table",
        fix: "",
      },
      {
        text: "A UNIQUE constraint on customer_id",
        sub: "No two rows share the value",
        fix: "UNIQUE only stops duplicate values; it does nothing to ensure the value exists in another table.",
      },
      {
        text: "A CHECK constraint that customer_id > 0",
        sub: "Value passes a boolean test",
        fix: "A CHECK validates a row-local condition. It cannot verify that the id exists in another table.",
      },
    ],
    correctIndex: 1,
    proTip: "Foreign keys enforce referential integrity: the database rejects child rows pointing at non-existent parents and can cascade updates or deletes.",
    lesson: "A foreign key constraint ties a column to a key in another table and guarantees referential integrity — you cannot insert a child row whose foreign key has no matching parent, and you cannot orphan children by deleting a referenced parent (unless cascading is configured). UNIQUE, NOT NULL, and CHECK enforce different, row-local rules.",
    remember: "FOREIGN KEY enforces referential integrity (value must exist elsewhere); UNIQUE stops duplicates; NOT NULL stops empties; CHECK validates row-local conditions — none of the other three can verify cross-table existence.",
    interviewAnswer: "The constraint that actually prevents this is a foreign key on customer_id referencing Customers, because a foreign key is the only constraint that checks whether a value exists in another table — it rejects any insert where the referenced row doesn't exist. UNIQUE just prevents duplicate values within the same column, NOT NULL just blocks empty values, and CHECK only validates conditions using the row's own data, so none of those three would catch a non-null, valid-looking customer_id that simply doesn't correspond to a real customer. Referential integrity specifically is the foreign key's job.",
  },
{
    id: "q-dbms-query-001",
    subject: "DBMS",
    concept: "Query Optimization",
    difficulty: "hard",
    stem: "An EXPLAIN plan shows a Seq Scan reading 5 million rows to return 12, filtering on WHERE email = ?. There is no index on email. What is the most direct fix and its cost?",
    options: [
      {
        text: "Increase work_mem so the sort is faster",
        sub: "More memory for sorting",
        fix: "There is no sort here; the cost is scanning 5M rows to find 12. More sort memory doesn't address the missing index.",
      },
      {
        text: "Rewrite the query with SELECT * to read fewer rows",
        sub: "Changing projection speeds the scan",
        fix: "SELECT * reads more columns, not fewer rows. Projection doesn't change how many rows the filter must scan without an index.",
      },
      {
        text: "Add a B-tree index on email; cost is slightly slower writes",
        sub: "Turns the scan into a fast lookup",
        fix: "",
      },
      {
        text: "Raise the isolation level to reduce locking",
        sub: "Less locking means faster reads",
        fix: "Isolation level doesn't reduce how many rows a filter scans. The bottleneck is the full scan, fixed by an index.",
      },
    ],
    correctIndex: 2,
    proTip: "A sequential scan that returns a tiny fraction of rows is a classic 'missing index' signal. A B-tree index on the equality column turns O(n) scanning into an O(log n) lookup; the trade-off is marginally slower inserts/updates.",
    lesson: "Query optimization starts with reading the execution plan. A Seq Scan returning a small selective result on an equality predicate indicates a missing index. Adding a B-tree index on the filtered column lets the planner do an index lookup instead of scanning every row. The cost is extra storage and slightly slower writes, since the index must be maintained.",
    remember: "Seq Scan reading millions of rows to return a handful on an equality filter is the textbook \"missing index\" smell — add a B-tree index, pay a small write cost.",
    interviewAnswer: "The plan is showing a sequential scan reading 5 million rows to find just 12 matches on an equality predicate, which is the classic signature of a missing index — there's no faster way to locate scattered matching rows without one. Adding a B-tree index on email turns that into a fast O(log n) lookup instead of an O(n) scan, at the cost of slightly slower writes since the index has to be maintained on every insert or update. Changing the projection with SELECT * or tuning work_mem wouldn't help at all here, because the bottleneck is how many rows get scanned to satisfy the filter, not how much data is returned or sorted.",
  },
{
    id: "q-os-sched-001",
    subject: "OS",
    concept: "CPU Scheduling",
    difficulty: "medium",
    stem: "A server has many short interactive tasks and a few long CPU-bound jobs. Users complain that clicks feel delayed even though CPU utilization is high. Which scheduler behavior best improves perceived responsiveness?",
    options: [
      {
        text: "Implementing a First-Come First-Served algorithm that schedules tasks strictly in the order they arrive in the execution queue.",
        sub: "Runs jobs in arrival order",
        fix: "FCFS can trap short interactive tasks behind long CPU-bound jobs. That convoy effect hurts responsiveness.",
      },
      {
        text: "Using a Round-Robin scheduler with a time slice small enough to ensure interactive tasks get scheduled frequently without starvation.",
        sub: "Time-slices CPU so interactive tasks get frequent turns",
        fix: "",
      },
      {
        text: "Employing a non-preemptive Shortest Job First scheduler that runs tasks to completion based on estimated CPU execution time.",
        sub: "Optimizes average wait only when lengths are known",
        fix: "SJF helps average wait in theory, but non-preemptive scheduling still lets long jobs hold the CPU once started.",
      },
      {
        text: "Assigning static priorities to interactive processes without an aging mechanism to boost lower-priority tasks over time.",
        sub: "Can starve lower-priority work",
        fix: "Priority scheduling can help if priorities are correct, but without aging it risks starvation and still needs careful tuning.",
      },
    ],
    correctIndex: 1,
    proTip: "Round Robin is less about perfect throughput and more about latency fairness. The quantum is the trade-off knob: too large feels like FCFS, too small wastes time on context switches.",
    lesson: "CPU scheduling decides which ready process runs next. Interactive systems usually prefer short response time over raw throughput. Round Robin gives each ready process a time slice, preventing long CPU-bound jobs from monopolizing the CPU. The time quantum must balance responsiveness against context-switch overhead.",
    remember: "Convoy effect = FCFS lets short jobs queue behind long ones; Round Robin fixes it by time-slicing, but quantum too big feels like FCFS, too small wastes cycles on switching.",
    interviewAnswer: "The convoy effect is what happens when First Come First Served lets a long CPU-bound job hog the processor while short interactive tasks pile up behind it, which kills perceived responsiveness even though utilization looks fine. Round Robin fixes this by giving every ready process a fixed time slice, so no single job can monopolize the CPU. The real engineering decision is the quantum size: too large and it behaves like FCFS, too small and you burn time on context switches instead of real work.",
  },
{
    id: "q-os-sched-002",
    subject: "OS",
    concept: "CPU Scheduling",
    difficulty: "hard",
    stem: `A database server utilizes a strict priority scheduler for its background tasks. You analyze the scheduler's behavior under heavy client load:

\`\`\`text
Ready Queue (Strict Priority):
[PID 501] Priority: 9 (High)   - Running
[PID 502] Priority: 8 (High)   - Ready (just arrived)
[PID 503] Priority: 8 (High)   - Ready (just arrived)
...
[PID 999] Priority: 1 (Lowest) - Ready (Waiting for 3 hours)
\`\`\`

A low-priority metric collection task (PID 999) has not received any CPU cycles for hours because higher-priority worker tasks are constantly queued. What mechanism can be implemented to ensure PID 999 eventually executes without modifying its base priority permanently or disabling prioritization?`,
    options: [
      {
        text: "Configure the scheduler to periodically cycle through ready processes in arrival order using a round-robin time slice.",
        sub: "Smaller slices for everyone",
        fix: "A smaller quantum affects round-robin sharing, but under strict priority the low-priority job still never gets scheduled.",
      },
      {
        text: "Temporarily allocate additional memory swap blocks to the starved process to trigger an automatic priority boost.",
        sub: "Run strictly in arrival order",
        fix: "FCFS removes priorities entirely, which the question says we want to keep. Aging fixes starvation while preserving priority.",
      },
      {
        text: "Dynamically increment the effective execution priority of a process proportional to the duration it spends in the ready queue.",
        sub: "Long waits boost priority over time",
        fix: "",
      },
      {
        text: "Set a hard ceiling on the maximum continuous CPU time slices any high-priority thread can consume before eviction.",
        sub: "More RAM for the starved process",
        fix: "Memory has nothing to do with scheduling order. Starvation is about CPU selection, not memory.",
      },
    ],
    correctIndex: 2,
    proTip: "Aging is the standard antidote to starvation: the longer a process waits, the higher its effective priority climbs, guaranteeing it eventually runs.",
    lesson: "Strict priority scheduling can starve low-priority processes indefinitely if higher-priority work keeps arriving. Aging solves this by incrementally increasing a waiting process's priority over time, so it is eventually selected. This preserves the benefits of priorities while guaranteeing progress.",
    remember: "Starvation under strict priority is fixed by aging — let wait time itself raise priority, so nothing waits forever.",
    interviewAnswer: "Strict priority scheduling can starve low-priority work indefinitely if higher-priority jobs keep arriving, because the scheduler never has a reason to pick the low-priority process. Aging solves this by gradually increasing a waiting process's effective priority the longer it sits in the ready queue, so eventually it outranks everything else and gets scheduled. It's a nice example of keeping the benefits of prioritization while still guaranteeing forward progress for everyone.",
  },
{
    id: "q-os-deadlock-001",
    subject: "OS",
    concept: "Deadlock",
    difficulty: "easy",
    stem: `You are debugging a deadlock between two database transaction processes. The execution traces show the following sequence:

\`\`\`text
Transaction 1:
- Acquired exclusive lock on Row A
- Waiting to acquire lock on Row B

Transaction 2:
- Acquired exclusive lock on Row B
- Waiting to acquire lock on Row A
\`\`\`

Both transactions are blocked indefinitely. Which of the Coffman conditions is represented by the specific dependency loop shown in this scenario?`,
    options: [
      {
        text: "Resources cannot be forcibly reclaimed from the processes holding them until those processes complete their tasks.",
        sub: "Resources cannot be forcibly taken away",
        fix: "No preemption may allow the deadlock to persist, but the described cycle is circular wait.",
      },
      {
        text: "Processes currently holding allocated resources are permitted to request and wait for additional resources.",
        sub: "A process holds one resource while requesting another",
        fix: "Hold and wait is present too, but the question asks what the wait cycle itself shows most directly.",
      },
      {
        text: "Only one process can hold a particular resource at any given time, preventing concurrent shareable access.",
        sub: "Only one actor can hold a resource at a time",
        fix: "Mutual exclusion is present, but the visible loop is the circular chain of waiting.",
      },
      {
        text: "A closed chain of processes exists such that each process holds at least one resource needed by the next process in the sequence.",
        sub: "Each process waits for a resource held by the next one",
        fix: "",
      },
    ],
    correctIndex: 3,
    proTip: "Deadlock prevention often targets circular wait by forcing a global lock ordering. If every worker grabs locks in the same order, cycles cannot form.",
    lesson: "Deadlock requires four conditions: mutual exclusion, hold and wait, no preemption, and circular wait. Circular wait is the easiest to visualize: A waits for B, B waits for C, and C waits for A. Breaking any one condition prevents deadlock.",
    remember: "Four Coffman conditions, but the visible \"loop\" in a deadlock is always circular wait — A waits on B, B waits on C, C waits on A.",
    interviewAnswer: "Deadlock needs four conditions to hold simultaneously — mutual exclusion, hold-and-wait, no preemption, and circular wait — but when you actually look at a stuck system, what you see is the circular wait: each process is blocked waiting on a resource the next process in the chain is holding. Mutual exclusion and hold-and-wait are technically present too, but they're background conditions, not the visible symptom. That's why deadlock prevention strategies often specifically target circular wait, for example by forcing all processes to acquire locks in a fixed global order so a cycle can never form again.",
  },
{
    id: "q-os-vmem-001",
    subject: "OS",
    concept: "Virtual Memory",
    difficulty: "medium",
    stem: `During the execution of a user-space process, the CPU attempts to translate a virtual memory address and encounters the following state:

\`\`\`text
Virtual Address: 0x7f8a12bc4008
  └─ Page Directory Offset Lookup
     └─ Page Table Entry (PTE) Present Bit: 0
        └─ Hardware Exception: Interrupt Vector 14 (Page Fault)
\`\`\`

The kernel intercepts this exception, retrieves the page from backing storage, updates the PTE present bit to 1, and restarts the instruction. How is this specific event classified when the page must be read from disk?`,
    options: [
      {
        text: "A minor page fault, indicating the page was already resident in physical memory but needed page table entry registration.",
        sub: "Data not in CPU cache, fetched from RAM",
        fix: "A cache miss is handled in hardware by fetching from RAM. This trap goes to the OS to fetch a page from disk, which is a page fault.",
      },
      {
        text: "A segmentation fault, indicating the virtual address pointed to an restricted kernel memory segment that was illegal to read.",
        sub: "Access to an invalid/forbidden address",
        fix: "A segmentation fault is an illegal access that usually kills the process. Here the access is valid; the page just wasn't resident yet.",
      },
      {
        text: "A Translation Lookaside Buffer (TLB) miss, indicating the cache translation failed and hardware performed a page table walk.",
        sub: "Address translation found in the TLB",
        fix: "A TLB hit means translation succeeded quickly. This scenario is the opposite: the page isn't in memory at all.",
      },
      {
        text: "A major page fault, indicating the requested page mapping was valid but the data had to be loaded from disk into physical memory.",
        sub: "Accessed page isn't resident; OS loads it",
        fix: "",
      },
    ],
    correctIndex: 3,
    proTip: "A page fault isn't necessarily an error. Demand paging relies on faults to load pages lazily; only an access to an invalid mapping becomes a fatal fault.",
    lesson: "Virtual memory lets processes use an address space larger than physical RAM by keeping some pages on disk. When a process touches a page that isn't resident, the hardware raises a page fault; the OS finds the page (possibly evicting another), loads it, updates the page table, and restarts the instruction. An access to an invalid mapping is a different, fatal fault.",
    remember: "Page fault = valid page just not resident, OS fetches it from disk; segfault = invalid access, process dies. Same trap mechanism, opposite outcomes.",
    interviewAnswer: "A page fault happens when a process touches a page that's part of its valid address space but isn't currently loaded into physical RAM, so the CPU traps into the OS, which fetches the page from disk, updates the page table, and resumes the instruction. It's not inherently an error — demand paging relies on faults to lazily load memory. That's different from a segmentation fault, where the address itself is invalid or forbidden, which is fatal rather than something the OS quietly resolves.",
  },
{
    id: "q-os-thrash-001",
    subject: "OS",
    concept: "Thrashing",
    difficulty: "hard",
    stem: `You are diagnosing a server that has become completely unresponsive. Running \`vmstat 1\` displays:

\`\`\`text
procs -----------memory---------- ---swap-- -----io---- -system-- ------cpu-----
 r  b   swpd   free   buff  cache   si   so    bi    bo   in   cs us sy id wa st
 0  8 284120  12480   4100  14500 8500 9800  38000 41000 1200 1500  1  9  0 90  0
\`\`\`

The CPU utilization for user tasks (\`us\`) has plummeted to 1%, while the I/O wait time (\`wa\`) is at 90%, and swap activity (\`si\`/\`so\`) is extremely high. What system state does this indicate, and how is it resolved?`,
    options: [
      {
        text: "A circular dependency loop has formed across lock requests in database transactions; resolve by running a deadlock detection sweep.",
        sub: "Circular resource wait",
        fix: "No process is waiting on a lock held by another; they're all making 'progress' but spending it on paging. That's thrashing, not deadlock.",
      },
      {
        text: "The virtual memory working sets exceed physical RAM, causing continuous page faults; resolve by reducing the active process count.",
        sub: "Excessive paging starves real work",
        fix: "",
      },
      {
        text: "High-priority tasks are waiting on a resource held by a low-priority process; resolve by enforcing a priority inheritance protocol.",
        sub: "Low-priority task blocks a high-priority one",
        fix: "Priority inversion is about a lock held by a lower-priority task. The described symptom is constant paging, i.e., thrashing.",
      },
      {
        text: "The filesystem inode index tables have been completely depleted on the disk; resolve by rebuilding the drive directory trees.",
        sub: "Compute, not I/O, is the limit",
        fix: "CPU utilization is collapsing, not saturating, and the disk is the busy resource. The bottleneck is paging I/O, not compute.",
      },
    ],
    correctIndex: 1,
    proTip: "Thrashing happens when the sum of working sets exceeds physical memory. Fixes include reducing the multiprogramming degree (swap out / suspend some processes) or adding RAM.",
    lesson: "Thrashing occurs when processes collectively need more memory than is physically available, so the system spends most of its time paging in and out rather than executing. CPU utilization drops while disk activity spikes. The remedy is to lower the degree of multiprogramming — suspend or swap out processes — or increase physical memory so working sets fit.",
    remember: "Thrashing = sum of working sets > physical RAM, so CPU utilization crashes while disk paging spikes. Fix is fewer processes or more RAM, not more CPU.",
    interviewAnswer: "Thrashing happens when you've packed in so many memory-hungry processes that their combined working sets exceed physical memory, so the system spends almost all its time paging pages in and out instead of doing real computation. You see the telltale signature of CPU utilization dropping while the disk is constantly busy, because every process is evicting pages that another process needs next. The fix is to reduce the degree of multiprogramming — suspend or swap out some processes — or simply add more RAM so working sets actually fit.",
  },
{
    id: "q-os-sync-001",
    subject: "OS",
    concept: "Synchronization",
    difficulty: "medium",
    stem: `Two threads execute the following loop concurrently without any synchronization:

\`\`\`cpp
// Shared global variable
volatile int counter = 0;

// Thread A and Thread B run this function:
void increment() {
    for (int i = 0; i < 1000000; ++i) {
        counter++;
    }
}
\`\`\`

The final value of \`counter\` is consistently and unpredictably less than 2,000,000. What is the root cause?`,
    options: [
      {
        text: "A race condition on a non-atomic read-modify-write instruction sequence.",
        sub: "Interleaved updates lose increments",
        fix: "",
      },
      {
        text: "A thread deadlock preventing execution loops from completing all iterations.",
        sub: "Each waits on the other",
        fix: "Nothing is blocked or waiting; both threads finish. The lost increments come from unsynchronized interleaving, not a deadlock.",
      },
      {
        text: "An stack overflow condition caused by excessive call frame allocation sizes.",
        sub: "Threads overflow their stacks",
        fix: "Stack size doesn't cause lost increments. The shared counter is corrupted by concurrent read-modify-write, a race.",
      },
      {
        text: "Compiler optimizations that completely eliminate the loop during translation.",
        sub: "Dead-code elimination",
        fix: "If the loop were eliminated the count would be near zero or unchanged consistently, not 'often less than two million.' The signature is a race.",
      },
    ],
    correctIndex: 0,
    proTip: "counter = counter + 1 is three steps: read, add, write. Without a mutex or atomic operation, two threads can read the same value and both write back the same result, dropping an update.",
    lesson: "A race condition occurs when multiple threads access shared mutable state concurrently and the outcome depends on timing. Incrementing a counter is a read-modify-write that is not atomic, so interleavings can lose updates. Protect the critical section with a mutex, or use an atomic increment, to serialize the operation.",
    remember: "counter++ is read-modify-write, not atomic — two threads can read the same value and stomp each other's write, silently losing increments. That's a race condition, not a deadlock.",
    interviewAnswer: "Incrementing a shared counter looks like one operation but it's actually three steps under the hood — read, add, write — and without synchronization two threads can both read the same value, increment it locally, and then write back the same result, silently dropping one of the increments. That's a classic race condition, not a deadlock, because both threads finish just fine; they just stepped on each other's update. The fix is to make the read-modify-write atomic, either with a mutex around the critical section or a hardware-level atomic increment.",
  },
{
    id: "q-os-semaphore-001",
    subject: "OS",
    concept: "Semaphores",
    difficulty: "medium",
    stem: `You are implementing a database connection pool manager in a multi-threaded application:

\`\`\`cpp
class ConnectionPool {
private:
    std::vector<Connection> pool;
    // Which concurrency primitive best coordinates access here?
    ??? accessLock; 
public:
    Connection acquire() {
        accessLock.wait();
        return getAvailableConnection();
    }
    void release(Connection conn) {
        returnConnectionToPool(conn);
        accessLock.signal();
    }
};
\`\`\`

If there are exactly 5 connections in the pool and you want at most 5 threads to access them concurrently, blocking any additional threads until a connection is returned, which primitive is the most direct fit?`,
    options: [
      {
        text: "A mutual exclusion lock that serializes execution of the acquire and release code blocks across all threads.",
        sub: "Busy-waits for a single lock",
        fix: "A spinlock guards one resource with busy-waiting and admits a single holder, not a pool of five.",
      },
      {
        text: "An integer-based signaling variable initialized to 5 that decrements on acquire and increments on release.",
        sub: "Permits up to N concurrent holders",
        fix: "",
      },
      {
        text: "A spin-waiting lock wrapper that continuously polls the availability status of the resource pool in a loop.",
        sub: "Allows one holder at a time",
        fix: "A mutex permits only a single holder, which would serialize access to one connection, not five. You need a count of 5.",
      },
      {
        text: "A stateless condition variable that broadcast-notifies all waiting threads whenever any resource status changes.",
        sub: "Signals state changes, no built-in count",
        fix: "A condition variable by itself doesn't track a permit count; you'd have to build the counting logic and a lock around it manually.",
      },
    ],
    correctIndex: 1,
    proTip: "A counting semaphore is essentially a managed permit pool: initialize it to N, wait() (acquire) decrements, signal() (release) increments. It naturally caps concurrency at N.",
    lesson: "A counting semaphore maintains an integer count of available permits. Threads call wait/acquire (blocking when the count hits zero) and signal/release to return a permit. Initializing it to 5 lets at most five threads proceed concurrently while the rest wait — the standard way to bound access to a fixed-size resource pool. A binary semaphore/mutex is the special case N=1.",
    remember: "Mutex caps concurrency at 1; counting semaphore caps it at N. A mutex is just a counting semaphore with N=1.",
    interviewAnswer: "When you need to cap concurrent access at some number greater than one — like five database connections — a counting semaphore is the right primitive because it's initialized with a permit count, and every wait or acquire call decrements that count while signal or release increments it back. Threads block once the count hits zero, which naturally limits concurrency to exactly five without you writing any custom bookkeeping. A binary semaphore or mutex is really just the special case of this where the count is fixed at one.",
  },
{
    id: "q-os-procthread-001",
    subject: "OS",
    concept: "Process vs Thread",
    difficulty: "easy",
    stem: `You are designing a high-throughput application that cache-stores user sessions in memory:

\`\`\`cpp
// Shared global cache structure
std::unordered_map<std::string, Session> sessionCache;
std::mutex cacheMutex;
\`\`\`

Multiple worker instances must access and write to this cache frequently with the lowest possible execution latency and no inter-process communication (IPC) overhead. What concurrency model should you choose?`,
    options: [
      {
        text: "Separate operating system processes, because they share a single unified address space by default on modern Unix kernels.",
        sub: "Threads are always serialized",
        fix: "Threads can run in parallel on multiple cores (subject to language runtime details). The deciding factor here is cheap shared memory.",
      },
      {
        text: "Multiple threads within a single process, since they share the same memory space and can access global variables directly.",
        sub: "Shared memory by default",
        fix: "",
      },
      {
        text: "Multiple threads within a single process, because the kernel allocates a dedicated virtual address space for each thread.",
        sub: "Isolation prevents shared cache",
        fix: "Threads do not get isolated address spaces; they share the process's memory. Isolation would defeat the goal of a shared cache.",
      },
      {
        text: "Separate operating system processes, because processes avoid memory access collisions by communicating via local loopback sockets.",
        sub: "Processes share memory by default",
        fix: "Processes have separate address spaces by default; sharing memory between them needs explicit IPC or shared-memory segments. That's the overhead we want to avoid.",
      },
    ],
    correctIndex: 1,
    proTip: "Threads of one process share the heap and global memory, so a shared cache is just a normal data structure. The trade-off is that a bug in one thread can corrupt shared state for all.",
    lesson: "Threads within a process share the same address space (heap, globals, file descriptors) but have separate stacks, making in-memory sharing essentially free. Processes have isolated address spaces, so sharing requires IPC or explicit shared memory. Choose threads for cheap data sharing; choose processes for fault isolation and security boundaries.",
    remember: "Threads share the process's address space by default (cheap sharing, no isolation); processes are isolated and need explicit IPC to share anything.",
    interviewAnswer: "Threads belonging to the same process share the heap, global variables, and file descriptors, with each thread only getting its own stack — so sharing an in-memory cache across threads is basically free, just a normal data structure with some locking around it. Processes, on the other hand, get separate address spaces by default, so sharing memory between them requires explicit mechanisms like shared memory segments or other IPC, which adds overhead. Given that the goal here is cheap, frequent sharing with no IPC cost, threads are the right call, accepting that a bug in one can corrupt shared state for all of them.",
  },
{
    id: "q-os-pagereplace-001",
    subject: "OS",
    concept: "Page Replacement",
    difficulty: "hard",
    stem: `You are testing a page replacement algorithm in an operating system simulator using the following reference sequence:

\`\`\`text
Page reference string: 1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5
\`\`\`

You run the simulation under two frame allocation sizes:
- With 3 physical memory frames: 9 page faults occur.
- With 4 physical memory frames: 10 page faults occur.

Which page replacement algorithm was used, and what is the term for this behavior where adding physical frames increases faults?`,
    options: [
      {
        text: "FIFO (First-In, First-Out) replacement algorithm; this counterintuitive behavior is known as Belady's anomaly.",
        sub: "More frames can cause more faults under FIFO",
        fix: "",
      },
      {
        text: "LRU (Least Recently Used) replacement algorithm; this cache degradation behavior is known as thrashing.",
        sub: "The active page set changes over time",
        fix: "Working set changes are normal program behavior; they don't explain faults rising specifically because frames were added under FIFO.",
      },
      {
        text: "OPT (Optimal) replacement algorithm; this resource allocation mismatch is known as working set drift.",
        sub: "Invalidating TLB entries across cores",
        fix: "A TLB shootdown is about translation cache coherence across CPUs, unrelated to frame count affecting fault rate.",
      },
      {
        text: "LFU (Least Frequently Used) replacement algorithm; this translation failure is known as a TLB shootdown.",
        sub: "Excessive paging from over-commit",
        fix: "Thrashing is about too little memory for the working set. Here adding memory increases faults under a specific algorithm, which is Belady's anomaly.",
      },
    ],
    correctIndex: 0,
    proTip: "Belady's anomaly is specific to FIFO and some non-stack algorithms. Stack-based algorithms like LRU and OPT are provably immune: more frames never increase faults.",
    lesson: "Belady's anomaly is the surprising result that, under FIFO page replacement, increasing the number of physical frames can increase the number of page faults for certain reference strings. It does not occur with 'stack' algorithms such as LRU or the optimal (OPT) policy, which guarantee fault counts are monotonic in frame count.",
    remember: "Belady's anomaly: under FIFO, adding more frames can increase page faults. LRU and OPT are stack algorithms and are immune — more frames never hurts them.",
    interviewAnswer: "Belady's anomaly is the counterintuitive case where giving a system more physical frames actually increases the number of page faults, and it specifically shows up with FIFO page replacement on certain reference strings. It's not thrashing, because thrashing is about having too little memory overall for the combined working sets — here we're adding memory and faults still go up, which is purely an artifact of how FIFO chooses victims. Stack-based algorithms like LRU and the optimal policy don't have this problem; for those, it's mathematically guaranteed that more frames never increase the fault count.",
  },
{
    id: "q-os-fork-001",
    subject: "OS",
    concept: "Processes & fork",
    difficulty: "medium",
    stem: `You run the following code snippet on a Linux system:

\`\`\`cpp
#include <unistd.h>
#include <stdlib.h>

int main() {
    pid_t pid = fork();
    if (pid > 0) {
        exit(0); // Parent exits immediately
    } else if (pid == 0) {
        sleep(300); // Child continues running
    }
    return 0;
}
\`\`\`

Immediately after the parent process exits, what happens to the child process's relationship with the operating system?`,
    options: [
      {
        text: "The child is immediately terminated by the kernel since it no longer possesses a valid parent control block in the process table.",
        sub: "Any re-parented process is a daemon",
        fix: "Daemons are deliberately created background services (often via double-fork and detaching). Merely outliving its parent makes the child an orphan, not automatically a daemon.",
      },
      {
        text: "The child is adopted by the init process (PID 1), which assumes the responsibility of reaping its exit status when it terminates.",
        sub: "Parent died while child runs",
        fix: "",
      },
      {
        text: "The child's state changes to a zombie, preserving its allocated heap and file descriptors until the parent is restarted.",
        sub: "Parent's exit signals the child to die",
        fix: "A parent exiting does not kill its children, and SIGCHLD is sent to the parent about the child, not the other way around.",
      },
      {
        text: "The child is detached from the process table, becoming a system daemon that is immune to terminal signals and interrupts.",
        sub: "Terminated but unreaped",
        fix: "A zombie is a process that has terminated but whose exit status hasn't been collected. This child is still running, not terminated.",
      },
    ],
    correctIndex: 1,
    proTip: "Orphans are adopted by init/PID 1, which reaps them when they finish. Contrast with zombies, which are finished-but-unreaped and consume a process table entry until the parent calls wait().",
    lesson: "When a parent terminates before its child, the child becomes an orphan and is re-parented to init (PID 1), which will wait() on it when it eventually exits. A zombie is the opposite timing: the child has terminated but the parent hasn't reaped its exit status, leaving a defunct entry in the process table.",
    remember: "Orphan vs zombie: orphan is a live child whose parent died (re-parented to init); zombie is a dead child whose parent hasn't reaped it yet. Opposite timing, often confused.",
    interviewAnswer: "When a parent process exits before its child finishes, the child doesn't die — it gets re-parented to init, PID 1, and is now called an orphan, continuing to run normally until init eventually reaps it. That's the opposite situation from a zombie, which is a process that has already terminated but whose exit status hasn't been collected yet by a wait call, so it still occupies a slot in the process table. People often mix these up, but the key distinction is timing: orphan means the parent died first while the child lives on, zombie means the child died first and is just waiting to be cleaned up.",
  },
{
    id: "q-os-mutex-001",
    subject: "OS",
    concept: "Locks & Mutexes",
    difficulty: "medium",
    stem: `You are analyzing a task scheduling failure on a real-time OS. Your telemetry captures the following thread state:

\`\`\`text
Thread Status:
- Thread H (Priority: High)   - Blocked (Waiting on Mutex A)
- Thread M (Priority: Medium) - Running (Compute-bound execution)
- Thread L (Priority: Low)    - Ready (Holds Mutex A, Preempted by M)
\`\`\`

Thread H cannot execute because it is waiting for Mutex A. Thread L cannot release Mutex A because Thread M is saturating the CPU. What scheduling phenomenon is occurring, and how can the OS scheduler resolve it?`,
    options: [
      {
        text: "Task starvation; resolve by periodically raising the priority of Thread M to ensure its compute loops finish faster.",
        sub: "Medium thread never runs",
        fix: "The medium thread is running fine — it's the high-priority thread that's stuck. The problem is inversion, not starvation of the medium thread.",
      },
      {
        text: "Priority inversion; resolve by temporarily boosting the priority of Thread L to match Thread H until the mutex is released.",
        sub: "Holder temporarily inherits the waiter's priority",
        fix: "",
      },
      {
        text: "Resource deadlock; resolve by forcing Thread H to release all held mutexes and retry the allocation after a random backoff.",
        sub: "Break a circular wait",
        fix: "There's no circular wait here — only one lock is involved. The high-priority thread is delayed, not deadlocked.",
      },
      {
        text: "Thread livelock; resolve by running a lock detection thread that terminates Thread M when CPU utilization exceeds 90%.",
        sub: "Threads keep retrying without progress",
        fix: "Livelock involves threads actively changing state without progress. Here the high-priority thread is simply blocked, a priority inversion.",
      },
    ],
    correctIndex: 1,
    proTip: "Priority inheritance temporarily boosts the lock holder to the highest waiter's priority so it can finish and release quickly. The Mars Pathfinder bug was a famous real-world case.",
    lesson: "Priority inversion happens when a high-priority task waits on a resource held by a low-priority task, while medium-priority tasks preempt the holder and prevent it from releasing. Priority inheritance solves it by temporarily raising the holder's priority to that of the highest-priority waiter, so the critical section completes promptly.",
    remember: "Priority inversion: a high-priority thread stalls because a low-priority lock holder keeps getting preempted by mediums. Fix is priority inheritance — temporarily promote the holder.",
    interviewAnswer: "Priority inversion happens when a high-priority thread is blocked waiting on a lock held by a low-priority thread, but that low-priority holder keeps getting preempted by medium-priority threads that have nothing to do with the lock, so the high-priority thread ends up waiting far longer than its priority would suggest. The standard fix is priority inheritance: the lock holder temporarily borrows the priority of the highest-priority thread waiting on it, so it can't be preempted by those mediums and can finish and release the lock quickly. This isn't just theoretical — it's famously what caused the Mars Pathfinder watchdog resets.",
  },
{
    id: "q-os-ipc-001",
    subject: "OS",
    concept: "IPC",
    difficulty: "easy",
    stem: `You establish inter-process communication between two unrelated processes running on the same host using the following shell sequence:

\`\`\`bash
$ mkfifo /tmp/app_channel
$ producer_process > /tmp/app_channel
# In another terminal window:
$ consumer_process < /tmp/app_channel
\`\`\`

Which underlying operating system mechanism is facilitating this buffered, unidirectional byte stream?`,
    options: [
      {
        text: "A memory-mapped file mapping that allocates shared physical RAM pages directly into the virtual address spaces of both processes.",
        sub: "Maps virtual to physical addresses",
        fix: "A page table is part of address translation, not an inter-process communication channel.",
      },
      {
        text: "A named pipe (FIFO) that exposes a virtual file interface and leverages kernel buffers to transfer data directly between the processes.",
        sub: "Unidirectional byte stream buffered by the OS",
        fix: "",
      },
      {
        text: "A Unix domain socket that establishes a full-duplex connection utilizing TCP packet structures routed through the loopback interface.",
        sub: "A lock for mutual exclusion",
        fix: "A mutex coordinates access to shared data; it does not transport a stream of bytes between processes.",
      },
      {
        text: "A shared system message queue that serializes structured message blocks into a kernel-managed priority storage cache.",
        sub: "Dispatch table for syscalls",
        fix: "The syscall table routes kernel entry points; it isn't a data channel between two processes.",
      },
    ],
    correctIndex: 1,
    proTip: "Pipes give a simple byte-stream channel. Anonymous pipes connect related processes (parent/child); named pipes (FIFOs) have a filesystem path so unrelated processes can connect.",
    lesson: "Inter-process communication lets separate processes exchange data. A pipe is a unidirectional, OS-buffered byte stream: one process writes, another reads. Named pipes (FIFOs) expose a filesystem path so unrelated processes can connect. Other IPC forms include shared memory (fastest, needs its own synchronization), message queues, and sockets.",
    remember: "A pipe is just an OS-buffered, unidirectional byte stream between processes; named pipes (FIFOs) extend that to unrelated processes via a filesystem path.",
    interviewAnswer: "When two processes just need to push a stream of bytes between each other, a pipe is the simplest mechanism — one process writes, the other reads, and the kernel handles the buffering in between, so it feels like writing to and reading from a file. Anonymous pipes only work between related processes like a parent and its child, but named pipes, or FIFOs, expose a filesystem path so any two unrelated processes can connect to the same channel. It's worth contrasting that with shared memory, which is faster but requires you to handle synchronization yourself, since the OS isn't buffering anything for you there.",
  },
{
    id: "q-os-contextswitch-001",
    subject: "OS",
    concept: "Context Switching",
    difficulty: "medium",
    stem: `You are troubleshooting a performance issue on a web server running a thread-per-request model under heavy load. You run \`vmstat 1\` and see:

\`\`\`text
procs -----------memory---------- ---swap-- -----io---- -system-- ------cpu-----
 r  b   swpd   free   buff  cache   si   so    bi    bo   in   cs us sy id wa st
18  0      0 204850  45100 820100    0    0     0     8  800 195000  8 88  4  0  0
\`\`\`

The server CPU is highly saturated, but user-space application CPU (\`us\`) is under 10%, while system CPU (\`sy\`) is near 90%. The thread count is in the thousands. What operational overhead is dominating the CPU cycles, and how can it be mitigated?`,
    options: [
      {
        text: "CPU cycles are consumed saving and restoring register states and reloading MMU page tables; mitigate by moving to an asynchronous event-driven I/O model.",
        sub: "Switching cost grows with switch frequency",
        fix: "",
      },
      {
        text: "CPU cycles are lost waiting for mechanical storage drives to fetch missing pages into memory; mitigate by expanding physical RAM or swap partitions.",
        sub: "Disk paging dominates",
        fix: "Saving/restoring registers and memory maps on each switch describes context switching, not page faults. The fix is fewer switches, not more RAM.",
      },
      {
        text: "CPU cycles are spent parsing security boundaries during transitions between user space and kernel space; mitigate by caching kernel data in application heaps.",
        sub: "Kernel entry cost",
        fix: "Syscall cost is per kernel entry. The described cost is specifically the state save/restore between threads, i.e., context switching.",
      },
      {
        text: "CPU cycles are wasted by cross-core cache invalidations due to shared memory contention; mitigate by binding all thread processes to a single execution core.",
        sub: "Cross-core invalidations",
        fix: "Coherence traffic is about shared cache lines across cores, not the register/PC save-restore of switching between threads.",
      },
    ],
    correctIndex: 0,
    proTip: "Each switch saves one thread's CPU state and loads another's, and can pollute caches/TLB. Too small a time quantum or too many runnable threads makes switching dominate useful work.",
    lesson: "A context switch saves the state of the running thread (registers, program counter, and possibly memory mappings) and restores another's so the CPU can multiplex many threads. It's pure overhead — no application work happens during the switch — and it grows with switch frequency. Reduce it by using larger time slices, limiting the number of runnable threads, or using async I/O instead of thread-per-task.",
    remember: "Context switching is pure overhead — no app work happens during it — and its cost scales with switch frequency, not thread count alone. Fix: bigger time slices, fewer runnable threads.",
    interviewAnswer: "A context switch is the cost of saving one thread's CPU state — registers, program counter, sometimes memory mappings — and loading another's so the CPU can multiplex across many threads, and importantly none of that time is spent doing actual application work. When you have hundreds of runnable threads switching rapidly, that overhead can dominate, especially since it also tends to pollute caches and the TLB along the way. The fix is to either use a larger time quantum so switches happen less often, reduce the number of runnable threads, or move to an async I/O model instead of spinning up a thread per task.",
  },
{
    id: "q-cn-tls-001",
    subject: "CN",
    concept: "TLS Handshake",
    difficulty: "medium",
    stem: "A browser connects to https://example.com for the first time. Before sending the HTTP request body, it verifies a certificate chain and negotiates encryption keys. Which layer of the request path is responsible for that?",
    options: [
      {
        text: "The security layer protocol handshake (TLS), which establishes cryptographic parameters and session keys.",
        sub: "Authenticates the server and establishes encrypted session keys",
        fix: "",
      },
      {
        text: "The transport-layer three-way handshake (TCP), which initializes sequence numbers and buffers.",
        sub: "Establishes a reliable byte stream",
        fix: "TCP sets up a reliable raw byte connection but does not handle encryption keys, certificates, or session security.",
      },
      {
        text: "The application-layer validation check (HTTP Cache), which determines if resources are fresh.",
        sub: "Checks whether cached content is fresh",
        fix: "HTTP cache validation happens at the application layer after the secure connection has already been fully established.",
      },
      {
        text: "The domain name resolution system (DNS), which translates hostnames into network IP addresses.",
        sub: "Resolves names to IP addresses",
        fix: "DNS resolves a domain name to an IP address before a connection is opened; it does not negotiate keys or validate certificates.",
      },
    ],
    correctIndex: 0,
    proTip: "HTTPS is HTTP over TLS over TCP. DNS gets the IP, TCP gives a stream, TLS secures it, then HTTP messages flow inside that secure channel.",
    lesson: "TLS provides confidentiality, integrity, and server authentication for HTTPS. The handshake validates the server certificate, agrees on cryptographic parameters, and derives session keys. Only after this secure channel is established does the browser send the HTTP request.",
    remember: "HTTPS = HTTP over TLS over TCP — DNS finds the address, TCP opens the pipe, TLS locks it, then HTTP rides inside.",
    interviewAnswer: "When a browser connects over HTTPS, DNS only resolves the hostname to an IP, and the TCP handshake just sets up a reliable connection — neither of those touches security. The actual certificate verification and encryption key negotiation happen in the TLS handshake, which authenticates the server and derives session keys. Only once that secure channel exists does the browser send the actual HTTP request inside it.",
  },
{
    id: "q-cn-cache-001",
    subject: "CN",
    concept: "Caching",
    difficulty: "easy",
    stem: `You inspect the server access logs for your origin application server and see only a single request for a popular product image:
\`\`\`text
192.168.1.50 - - [17/Jul/2026:02:00:00 +0000] "GET /images/hero.jpg HTTP/1.1" 200 45210
\`\`\`
However, regional analytics show that the image was successfully retrieved 10,000 times by clients in the same hour, with the remaining 9,999 requests served from a point-of-presence (PoP) closer to the users.

Which network architecture pattern is primarily responsible for reducing this origin load?`,
    options: [
      {
        text: "Dynamic routing table updates via BGP path selection.",
        sub: "Adjusts send rate based on network signals",
        fix: "BGP path selection optimizes routing paths between autonomous systems but does not store copies of assets or intercept requests to prevent them from reaching the origin.",
      },
      {
        text: "Storing static asset copies at distributed edge nodes.",
        sub: "Stores repeated content close to users",
        fix: "",
      },
      {
        text: "Resolving domain names via recursive DNS server lookups.",
        sub: "Finds authoritative answers for names",
        fix: "Recursive DNS lookups translate the hostname to an IP address (possibly pointing to a nearby CDN node) but do not store or serve the asset content itself.",
      },
      {
        text: "Establishing persistent full-duplex TCP socket connections.",
        sub: "Keeps a bidirectional connection open",
        fix: "Persistent TCP connections keep sockets open to reduce handshake overhead, but they still require requests to travel to the origin server to fetch the asset.",
      },
    ],
    correctIndex: 1,
    proTip: "CDNs combine routing and caching: DNS or anycast gets users near an edge, then cache headers decide whether the edge can reuse stored content.",
    lesson: "Caching reduces latency and origin load by reusing prior responses. In web systems, browsers, proxies, and CDNs can cache assets based on headers like Cache-Control and ETag. CDNs are especially useful for static or widely repeated content because they serve it from locations closer to users.",
    remember: "CDN edge caching skips the origin entirely — DNS/anycast just gets you near a node, the cache headers decide if it can serve you straight from there.",
    interviewAnswer: "The reason the origin server isn't hit for every user is caching at the edge — the CDN stores a copy of the image at locations close to users and serves repeated requests directly from there based on headers like Cache-Control and ETag. DNS or anycast routing might get you to the nearest edge node, but that's just direction-finding; the actual savings come from not re-fetching content that's already cached locally. That's why CDNs are so effective for static, widely-shared assets like product images.",
  },
{
    id: "q-cn-tcpudp-001",
    subject: "CN",
    concept: "TCP vs UDP",
    difficulty: "medium",
    stem: "A live multiplayer game sends 60 position updates per second. The team would rather drop an occasional stale update than stall the stream waiting for a retransmission. Which transport protocol fits and why?",
    options: [
      {
        text: "TCP, because UDP cannot traverse the internet",
        sub: "UDP is LAN-only",
        fix: "UDP works fine across the internet (DNS, QUIC, and most real-time media use it). The latency trade-off, not reachability, is the deciding factor.",
      },
      {
        text: "TCP, because it guarantees in-order reliable delivery",
        sub: "Retransmits lost segments",
        fix: "TCP's reliability is exactly the problem here: head-of-line blocking stalls fresh updates while it retransmits a stale one. The game prefers to drop it.",
      },
      {
        text: "UDP, because it guarantees ordering without overhead",
        sub: "Ordered delivery for free",
        fix: "UDP does not guarantee ordering or delivery at all. Its advantage here is precisely that it won't block to enforce them.",
      },
      {
        text: "UDP, because it avoids retransmission and head-of-line blocking",
        sub: "Send-and-forget datagrams, lowest latency",
        fix: "",
      },
    ],
    correctIndex: 3,
    proTip: "For real-time data where freshness beats completeness (games, voice, video), UDP wins because a late retransmit is worse than a dropped packet. Reliability, if needed, is added selectively at the app layer.",
    lesson: "TCP provides reliable, ordered, connection-oriented delivery with retransmissions and congestion control, at the cost of latency and head-of-line blocking. UDP is connectionless and unreliable but minimal-latency. Real-time applications that value fresh data over guaranteed delivery choose UDP, often layering their own lightweight reliability where needed.",
    remember: "TCP's reliability becomes a liability for real-time data — head-of-line blocking stalls fresh packets behind a retransmit, so UDP wins when \"late\" is worse than \"lost.\"",
    interviewAnswer: "For something like a multiplayer game sending 60 updates a second, UDP is the right choice because it sends datagrams without waiting for acknowledgments or retransmissions. TCP's reliability actually hurts here — if a packet is lost, TCP will block all the newer data behind it until the lost segment is retransmitted, which is the classic head-of-line blocking problem. Since a stale position update is useless anyway, the game would rather drop it and move on, which is exactly the trade-off UDP is built for.",
  },
{
    id: "q-cn-dns-001",
    subject: "CN",
    concept: "DNS",
    difficulty: "easy",
    stem: `During a network troubleshooting session, you execute the following diagnostic command:
\`\`\`bash
$ dig api.example.com +short
93.184.216.34
\`\`\`
Which network protocol or system is responsible for performing this hostname-to-IP address mapping?`,
    options: [
      { text: "Domain Name System (DNS)", sub: "Resolves domain names to IP addresses", fix: "" },
      {
        text: "Network Address Translation (NAT)",
        sub: "Rewrites addresses at a gateway",
        fix: "NAT rewrites IP addresses and ports at a gateway to share a public IP, but does not perform hostname resolutions.",
      },
      {
        text: "Dynamic Host Configuration Protocol (DHCP)",
        sub: "Assigns IP addresses to hosts",
        fix: "DHCP assigns dynamic IP addresses and network configuration parameters to client devices when they join a network.",
      },
      {
        text: "Address Resolution Protocol (ARP)",
        sub: "Maps IP to MAC on the local link",
        fix: "ARP maps IP addresses to physical MAC addresses on the local network link, not hostnames to IP addresses.",
      },
    ],
    correctIndex: 0,
    proTip: "DNS is the internet's phone book. Resolution often walks from a recursive resolver to root, TLD, and authoritative servers, with heavy caching at each layer (and TTLs controlling freshness).",
    lesson: "The Domain Name System translates human-readable names like example.com into IP addresses. A recursive resolver queries the root, the top-level domain server, and the authoritative server as needed, caching results by TTL. ARP, DHCP, and NAT operate at different layers and solve unrelated addressing problems.",
    remember: "DNS is the internet's phone book: name in, IP out, before any connection even starts — don't confuse it with ARP (IP-to-MAC), DHCP (IP assignment), or NAT (address rewriting).",
    interviewAnswer: "That name-to-address translation is done by DNS, which is essentially the internet's phone book. The browser's resolver walks through root servers, top-level-domain servers, and finally the authoritative server for the domain, caching results along the way based on their TTL. It's easy to confuse with ARP, DHCP, or NAT, but those solve completely different problems — ARP maps IP to MAC locally, DHCP hands your device its own IP, and NAT rewrites addresses at a gateway — none of which resolve a domain name into an IP.",
  },
{
    id: "q-cn-http-001",
    subject: "CN",
    concept: "HTTP Status Codes",
    difficulty: "easy",
    stem: "A client requests a resource that requires login, but it sends no credentials. The server should signal 'you are not authenticated' so the client knows to log in. Which status code is correct?",
    options: [
      {
        text: "404 Not Found",
        sub: "Resource doesn't exist",
        fix: "404 says the resource isn't there. The resource exists but requires authentication, so 401 is the precise signal.",
      },
      {
        text: "403 Forbidden",
        sub: "Authenticated but not allowed",
        fix: "403 means the server understood who you are and still refuses; it's for authorization failures, not missing authentication. Use 401 when credentials are absent.",
      },
      { text: "401 Unauthorized", sub: "Authentication required or failed", fix: "" },
      {
        text: "500 Internal Server Error",
        sub: "Server-side failure",
        fix: "500 indicates the server itself failed. A missing-credentials case is a client condition, signaled by 401.",
      },
    ],
    correctIndex: 2,
    proTip: "Remember the pairing: 401 = 'who are you?' (authentication), 403 = 'I know who you are, and no' (authorization). The names are historically swapped, which trips people up.",
    lesson: "HTTP status codes are grouped: 2xx success, 3xx redirection, 4xx client errors, 5xx server errors. 401 Unauthorized signals that authentication is required or has failed (credentials missing/invalid), typically accompanied by a WWW-Authenticate header. 403 Forbidden means the client is authenticated but lacks permission. 404 means the resource doesn't exist.",
    remember: "401 = \"who are you?\" (no/bad credentials), 403 = \"I know who you are, and no\" (authenticated but not allowed) — the names are famously backwards from what you'd guess.",
    interviewAnswer: "When a request has no credentials at all, the right response is 401 Unauthorized, which really means \"authentication is required or failed,\" usually paired with a WWW-Authenticate header telling the client how to log in. That's different from 403 Forbidden, which means the server knows exactly who you are but still won't let you access the resource — that's an authorization failure, not an authentication one. So the rule of thumb is: missing or bad credentials gets a 401, valid credentials with insufficient permission gets a 403.",
  },
{
    id: "q-cn-congestion-001",
    subject: "CN",
    concept: "Congestion Control",
    difficulty: "hard",
    stem: "A new TCP connection starts sending slowly, then doubles its sending rate roughly each round trip until it detects loss, after which it cuts back sharply. What mechanism is this early exponential ramp called?",
    options: [
      {
        text: "Flow control via the receive window",
        sub: "Receiver limits how much sender can send",
        fix: "Flow control protects the receiver's buffer and is set by the advertised window. The described ramp is the sender probing network capacity — congestion control's slow start.",
      },
      {
        text: "Slow start",
        sub: "Exponential growth of the congestion window until loss",
        fix: "",
      },
      {
        text: "Nagle's algorithm",
        sub: "Coalesces small packets",
        fix: "Nagle's algorithm batches tiny writes to reduce overhead; it doesn't govern the exponential window ramp.",
      },
      {
        text: "Selective acknowledgment (SACK)",
        sub: "Acks non-contiguous received ranges",
        fix: "SACK improves which losses are reported for retransmission; it isn't the rate-ramping mechanism described.",
      },
    ],
    correctIndex: 1,
    proTip: "Slow start grows the congestion window exponentially until it hits a threshold or detects loss, then transitions to the linear additive-increase of congestion avoidance. 'Slow' refers to the small starting window, not the growth rate.",
    lesson: "TCP congestion control probes available network capacity. Slow start begins with a small congestion window and doubles it roughly every round-trip time (exponential growth) until reaching a threshold or detecting loss. On loss it reduces the window (multiplicative decrease) and switches to congestion avoidance's slower linear increase. This is distinct from flow control, which protects the receiver, not the network.",
    remember: "Slow start = exponential window growth until loss, then a hard cut and a switch to congestion avoidance's slow linear climb — \"slow\" describes the starting window, not the growth curve.",
    interviewAnswer: "That exponential ramp-up is TCP's slow start, where the congestion window roughly doubles every round trip as the sender probes how much capacity the network can handle. Once it hits a threshold or detects a loss, it backs off sharply — multiplicative decrease — and switches into congestion avoidance, which grows the window much more conservatively and linearly. It's worth distinguishing this from flow control, which is about protecting the receiver's buffer using the advertised window, not about probing the network itself.",
  },
{
    id: "q-cn-lb-001",
    subject: "CN",
    concept: "Load Balancing",
    difficulty: "medium",
    stem: "Traffic to a web app has grown past what one server handles. A device in front distributes incoming requests across several identical backend servers and stops sending to any that fail health checks. What is this component?",
    options: [
      {
        text: "A reverse proxy configured to distribute traffic across a pool and route around unhealthy nodes.",
        sub: "Spreads requests across backends, removes unhealthy ones",
        fix: "",
      },
      {
        text: "A DNS resolver configured with a round-robin record set to translate domain names to host IP addresses.",
        sub: "Caches responses",
        fix: "While round-robin DNS can distribute traffic, it lacks dynamic health-check awareness and will continue routing clients to dead IPs until DNS caches expire.",
      },
      {
        text: "A local edge server configured to store static asset copies and serve them directly to regional users.",
        sub: "Translates names to IPs",
        fix: "Edge servers cache static content to reduce origin load, but they do not dynamically distribute active application requests or manage backend server pools.",
      },
      {
        text: "A stateful network firewall configured with packet filtering policies to block unauthorized traffic.",
        sub: "Filters traffic by security rules",
        fix: "Firewalls block or allow packets based on security policies, ports, and protocols; they do not perform request distribution, pooling, or backend health checks.",
      },
    ],
    correctIndex: 0,
    proTip: "Load balancers improve both scalability and availability. Common algorithms include round robin, least connections, and IP hash; health checks let them route around failed instances automatically.",
    lesson: "A load balancer sits in front of a pool of backend servers and distributes incoming requests among them using algorithms like round robin or least connections. By running health checks and removing failing instances, it provides horizontal scalability and high availability. Layer 4 balancers route by IP/port; Layer 7 balancers can route by HTTP attributes like path or host.",
    remember: "Load balancer = the thing that spreads requests across a backend pool and routes around anything failing its health checks — not a firewall (filters by policy) or a cache (stores responses).",
    interviewAnswer: "What's described here is a load balancer sitting in front of the backend pool, distributing incoming requests using an algorithm like round robin or least connections. The key extra behavior is the health checks — it continuously monitors each backend and stops routing to any instance that's failing, which gives you both horizontal scalability and higher availability. It's distinct from a firewall, which just filters traffic by security policy, and from a plain reverse-proxy cache, which serves stored responses rather than distributing live traffic across servers.",
  },
{
    id: "q-cn-idempotent-001",
    subject: "CN",
    concept: "REST & Idempotency",
    difficulty: "medium",
    stem: "A mobile client's network flaps and it retries the same request several times. The API designers want repeated retries to not create duplicate resources or double-charge. Which HTTP method choice and property supports safe retries for an update-by-id?",
    options: [
      {
        text: "Use POST, which is defined as non-idempotent to ensure the server processes every incoming retry independently.",
        sub: "Repeats are always safe",
        fix: "POST is non-idempotent, meaning repeated retries will create duplicate resources or transactions, which is exactly the risk described.",
      },
      {
        text: "Use DELETE, which automatically creates and initializes the target resource if it does not already exist.",
        sub: "Delete adds the resource",
        fix: "DELETE is intended for resource removal, not creation or modification; it does not initialize resources on the server.",
      },
      {
        text: "Use GET, which allows safe execution of state-mutating updates on resources by bypassing typical write locks.",
        sub: "GET can modify state safely",
        fix: "GET is defined as safe and read-only; using it to modify server state violates the HTTP specification and causes unpredictable side effects.",
      },
      {
        text: "Use PUT, which is defined as idempotent, ensuring that duplicate requests result in the same final system state.",
        sub: "Same request, same result",
        fix: "",
      },
    ],
    correctIndex: 3,
    proTip: "PUT, DELETE, and GET are idempotent; POST generally is not. For non-idempotent creates, add an idempotency key so the server can dedupe retried requests.",
    lesson: "An idempotent operation produces the same result no matter how many times it is applied. In HTTP, GET, PUT, and DELETE are defined as idempotent, while POST is not. Designing updates as PUT (replace by id) makes client retries safe. When you must use POST for creates, an idempotency key lets the server recognize and ignore duplicate retries.",
    remember: "PUT, GET, and DELETE are idempotent by spec; POST is not — for safe create-retries without an idempotent verb, you need a client-supplied idempotency key.",
    interviewAnswer: "For an update-by-id that needs to survive client retries safely, you want PUT, because it's defined as idempotent — sending the exact same request multiple times leaves the resource in the same end state. POST doesn't have that guarantee; retrying a POST typically creates a brand-new resource each time, which is exactly the duplicate-charge or duplicate-record risk we're trying to avoid. If you genuinely need POST for a create operation, the usual fix is to have the client attach an idempotency key so the server can recognize and discard duplicate retries.",
  },
{
    id: "q-cn-subnet-001",
    subject: "CN",
    concept: "IP Addressing & Subnets",
    difficulty: "hard",
    stem: "A network is configured as 192.168.10.0/24. An admin needs to know how many usable host addresses it provides. What is the count and the reasoning?",
    options: [
      {
        text: "512 usable hosts, because a prefix of /24 leaves 9 bits available for addressing host interfaces.",
        sub: "A /24 holds 9 host bits",
        fix: "A /24 prefix leaves 8 bits for host addresses (32 - 24 = 8), yielding 2^8 = 256 total addresses, not 512.",
      },
      {
        text: "256 usable hosts, because all addresses within the subnet range can be assigned to active interfaces.",
        sub: "All addresses are assignable",
        fix: "The first address (.0) and the last address (.255) are reserved and cannot be assigned to individual hosts.",
      },
      {
        text: "254 usable hosts, because the first address is the network identifier and the last is the broadcast address.",
        sub: "/24 leaves 8 host bits",
        fix: "",
      },
      {
        text: "24 usable hosts, because the CIDR suffix indicates the exact maximum number of active network hosts.",
        sub: "The /24 means 24 hosts",
        fix: "The /24 prefix indicates that the first 24 bits are the network address, not that the host count is limited to 24.",
      },
    ],
    correctIndex: 2,
    proTip: "Usable hosts = 2^(32 − prefix) − 2 for IPv4. The minus two accounts for the network and broadcast addresses, which can't be assigned to hosts.",
    lesson: "In IPv4 CIDR notation, the prefix length (e.g., /24) is the number of network bits. Host bits = 32 − prefix. The number of addresses is 2^(host bits), and usable host addresses are that minus two (network and broadcast). So a /24 has 8 host bits → 256 addresses → 254 usable.",
    remember: "Usable IPv4 hosts = 2^(32 − prefix) − 2; the minus-2 is always the network address and the broadcast address.",
    interviewAnswer: "A /24 network has 32 minus 24, or 8 host bits, which gives 2 to the 8th, 256 total addresses. But two of those are reserved — the all-zeros network address and the all-ones broadcast address — so you subtract 2, leaving 254 usable host addresses. That formula, 2 to the power of host bits minus 2, is the general rule for any IPv4 CIDR block.",
  },
{
    id: "q-cn-cors-001",
    subject: "CN",
    concept: "CORS",
    difficulty: "medium",
    stem: `A frontend application hosted at \`https://app.example.com\` makes a request to \`https://api.other.com/data\`. The browser console displays:
\`\`\`text
Access to fetch at 'https://api.other.com/data' from origin 'https://app.example.com' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present 
on the requested resource.
\`\`\`
The server logs confirm the request completed with HTTP status code 200. Which mechanism is responsible for blocking the frontend code from reading this response?`,
    options: [
      {
        text: "A transport-layer handshake validation failure on the secure connection.",
        sub: "Bad certificate",
        fix: "A TLS or transport handshake failure would terminate the connection before any HTTP request is sent, preventing the server from returning an HTTP 200 status.",
      },
      {
        text: "The client-side same-origin policy, which requires explicit server permission headers.",
        sub: "Browser blocks cross-origin reads without permission",
        fix: "",
      },
      {
        text: "A DNS resolution failure preventing the browser from verifying the hostname.",
        sub: "Name didn't resolve",
        fix: "If DNS resolution failed, the browser would be unable to find the server's IP address and could not send a request to receive an HTTP 200 response.",
      },
      {
        text: "A network-layer gateway firewall rejecting the incoming request payload.",
        sub: "Network policy blocked it",
        fix: "If a firewall rejected the request, the server would never receive it to generate a 200 response; the block is executed on the client side by the browser.",
      },
    ],
    correctIndex: 1,
    proTip: "CORS isn't server security — it's the browser protecting users. The server opts in by sending Access-Control-Allow-Origin (and friends); for some requests the browser first sends a preflight OPTIONS.",
    lesson: "Browsers enforce the same-origin policy: scripts can't read responses from a different origin (scheme+host+port) unless the server explicitly opts in via Cross-Origin Resource Sharing headers like Access-Control-Allow-Origin. The request may still reach the server and return 200, but the browser withholds the response from JavaScript. Non-simple requests trigger a preflight OPTIONS check first.",
    remember: "CORS isn't a server firewall — it's the browser refusing to hand the script a response it already received, unless the server's Access-Control-Allow-Origin says it's okay.",
    interviewAnswer: "This is the browser's same-origin policy in action — the request actually succeeded and got a 200 back, but the browser won't let the JavaScript on app.example.com read a response from a different origin like api.other.com unless the server explicitly allows it via CORS headers like Access-Control-Allow-Origin. It's important to realize CORS is a client-side protection for users, not a server security mechanism; the server has to opt in, and for certain request types the browser will even send a preflight OPTIONS request first to check permissions before the real one goes out. So you can have a perfectly successful server response that JavaScript is still blocked from reading.",
  },
{
    id: "q-cn-http2-001",
    subject: "CN",
    concept: "HTTP/1.1 vs HTTP/2",
    difficulty: "hard",
    stem: "A page loads 50 small assets from one host. Over HTTP/1.1 the browser is limited to a few connections and requests queue up. Switching to HTTP/2 removes much of this stall. Which HTTP/2 feature is most responsible?",
    options: [
      {
        text: "Caching responses on the server",
        sub: "Server-side cache",
        fix: "Server caching is orthogonal and exists in HTTP/1.1 too. The specific HTTP/2 advantage for many parallel assets is multiplexing.",
      },
      {
        text: "Removing encryption to reduce overhead",
        sub: "Plaintext is faster",
        fix: "HTTP/2 in browsers is effectively always encrypted; it doesn't drop TLS. The improvement is request multiplexing.",
      },
      {
        text: "Switching the transport from TCP to UDP",
        sub: "HTTP/2 runs on UDP",
        fix: "HTTP/2 still runs over TCP (it's HTTP/3 that uses QUIC/UDP). The win here comes from multiplexing streams, not changing transport.",
      },
      {
        text: "Multiplexing many streams over a single connection",
        sub: "Concurrent requests share one TCP connection",
        fix: "",
      },
    ],
    correctIndex: 3,
    proTip: "HTTP/2 multiplexes many request/response streams over one connection plus header compression (HPACK), removing the HTTP/1.1 need for many connections and reducing head-of-line blocking at the HTTP layer (TCP-level HOL remains, which HTTP/3 addresses).",
    lesson: "HTTP/1.1 handles one request per connection at a time, so browsers open a limited number of parallel connections and requests queue. HTTP/2 multiplexes many independent streams over a single TCP connection and compresses headers, dramatically improving load of many small assets. It still uses TCP; HTTP/3 moves to QUIC over UDP to also eliminate TCP-level head-of-line blocking.",
    remember: "HTTP/2 fixes the \"few-connections\" stall with multiplexing — many streams, one TCP connection — not by switching transports (that's HTTP/3 with QUIC/UDP).",
    interviewAnswer: "The big win going from HTTP/1.1 to HTTP/2 for a page with many small assets is multiplexing — HTTP/2 can send many concurrent request and response streams over a single TCP connection instead of needing several separate connections that queue requests behind each other. It also adds header compression with HPACK, which helps with all those repeated small requests. It's still running over TCP, though — people sometimes assume HTTP/2 switched to UDP, but that's actually HTTP/3 with QUIC, which is what finally removes the remaining TCP-level head-of-line blocking.",
  },
{
    id: "q-cn-cookies-001",
    subject: "CN",
    concept: "Sessions & Cookies",
    difficulty: "easy",
    stem: `An application uses stateless HTTP requests but needs to maintain a logged-in session. Upon successful authentication, the server includes this header in the response:
\`\`\`http
Set-Cookie: session_id=xyz123; Secure; HttpOnly; SameSite=Strict
\`\`\`
How does the browser handle this value on subsequent requests to keep the user logged in?`,
    options: [
      {
        text: "It encodes the session identifier in the TCP sequence number of each segment.",
        sub: "Identifies the user across requests",
        fix: "TCP sequence numbers are used for ordering and reassembling bytes at the transport layer, not for carrying application-layer session data.",
      },
      {
        text: "It caches the session identifier inside the local DNS resolver's TTL records.",
        sub: "Caches your login",
        fix: "DNS TTL records control how long domain name resolutions are cached and cannot store user session identifiers or application data.",
      },
      {
        text: "It automatically appends the session identifier to a header on subsequent requests.",
        sub: "Browser auto-attaches it per request",
        fix: "",
      },
      {
        text: "It broadcasts the session identifier via the link-local source hardware MAC address.",
        sub: "Hardware address identifies the session",
        fix: "MAC addresses are physical layer addresses used within a local network segment and are not transmitted in HTTP headers across the internet.",
      },
    ],
    correctIndex: 2,
    proTip: "Cookies let stateless HTTP carry state. The server issues a session id via Set-Cookie; the browser returns it in the Cookie header. Flags like HttpOnly, Secure, and SameSite harden it against theft and CSRF.",
    lesson: "HTTP is stateless, so applications maintain sessions using cookies. On login the server sends Set-Cookie with a session identifier; the browser stores it and automatically includes it in the Cookie header on subsequent requests, letting the server recognize the user. Security flags (HttpOnly, Secure, SameSite) protect the cookie from script access, plaintext transmission, and cross-site misuse.",
    remember: "HTTP is stateless — cookies are what fake statefulness, with Set-Cookie issuing a session id and the browser auto-replaying it via the Cookie header on every request.",
    interviewAnswer: "Since HTTP itself has no memory between requests, sites use cookies to maintain login state — after you authenticate, the server sends a Set-Cookie header with a session identifier, and the browser automatically attaches that value in the Cookie header on every subsequent request to that site. That's what lets the server recognize you without re-authenticating each time. Flags like HttpOnly, Secure, and SameSite are then layered on to stop that cookie from being stolen via script injection, sent over plaintext, or replayed in cross-site requests.",
  },
{
    id: "q-cn-nat-001",
    subject: "CN",
    concept: "NAT",
    difficulty: "medium",
    stem: "Twenty devices on a home network all share a single public IP address when reaching the internet, yet replies still find the right device. Which router function makes this possible?",
    options: [
      {
        text: "Address Resolution Protocol (ARP), which broadcasts reply packets to all local network MAC addresses.",
        sub: "ARP routes internet replies",
        fix: "ARP maps IP addresses to physical MAC addresses on the local network link and does not translate or route public internet traffic.",
      },
      {
        text: "Transport Layer Security (TLS), which encrypts each stream to ensure private data separation at the gateway.",
        sub: "Encryption separates the flows",
        fix: "TLS provides encryption and data integrity for applications but does not manage IP sharing or map returning packets to internal hosts.",
      },
      {
        text: "Domain Name System (DNS), which maps specific internal hostnames to incoming response payloads.",
        sub: "Names route the replies",
        fix: "DNS resolves human-readable domain names to IP addresses; it has no role in routing packets or mapping active connections to devices.",
      },
      {
        text: "Network Address Translation (NAT), which rewrites and tracks source ports for outbound connections.",
        sub: "Maps internal addresses/ports to one public IP",
        fix: "",
      },
    ],
    correctIndex: 3,
    proTip: "PAT (NAT overload) is what home routers use: the router rewrites source IP/port and keeps a translation table so it can map each returning packet back to the right internal host and port.",
    lesson: "Network Address Translation lets many devices with private IP addresses share one public IP. The router rewrites the source address (and, in port address translation, the source port) on outbound packets and records the mapping, so when replies arrive it can translate them back to the correct internal host. This conserves scarce IPv4 addresses and adds a basic boundary between the private network and the internet.",
    remember: "NAT/PAT lets many private IPs share one public IP by rewriting source IP and port per connection and keeping a translation table to route replies back correctly.",
    interviewAnswer: "This works because of NAT, or more specifically port address translation, which the router uses to let many internal devices share a single public IP address. When a device sends a packet out, the router rewrites the source IP and port and records that mapping in a translation table, so when the reply comes back, it knows exactly which internal device and port to forward it to. This is also how home networks conserve scarce public IPv4 addresses while still giving every device internet access.",
  },
{
    id: "q-oop-solid-001",
    subject: "OOP",
    concept: "SOLID",
    difficulty: "medium",
    stem: `You are refactoring a payment processing module where concrete client SDKs are instantiated directly within a conditional statement:

\`\`\`javascript
class PaymentProcessor {
  process(provider, amount) {
    if (provider === "stripe") {
      const client = new StripeClient();
      client.charge(amount);
    } else if (provider === "paypal") {
      const client = new PayPalClient();
      client.pay(amount);
    }
  }
}
\`\`\`

Which design move most directly decouples the processor and simplifies adding new payment vendors?`,
    options: [
      {
        text: "Make the provider client methods static so that the processor does not need to instantiate them.",
        sub: "Remove instance creation overhead",
        fix: "Using static methods does not remove the processor's coupling to concrete provider classes; it still must import and branch on them.",
      },
      {
        text: "Introduce a gateway interface and inject concrete provider classes that implement it into the processor.",
        sub: "Depend on abstractions to allow new integrations without code modifications",
        fix: "",
      },
      {
        text: "Consolidate the concrete client methods into a shared parent base class to reuse common connection logic.",
        sub: "Inherit common SDK behavior from a base class",
        fix: "A shared base class still couples the hierarchy to specific client libraries and does not address the conditional routing issue.",
      },
      {
        text: "Encapsulate the conditional branches into helper methods inside the class to isolate the instantiation logic.",
        sub: "Improve internal readability using local helper methods",
        fix: "Isolating the branches internally makes the code cleaner but does not remove the need to modify the file when a provider is added.",
      },
    ],
    correctIndex: 1,
    proTip: "This is open-closed plus dependency inversion working together: the processor stays closed to modification because it depends on an interface, not concrete payment SDKs.",
    lesson: "SOLID principles help keep object-oriented code flexible. Dependency inversion says high-level policy should depend on abstractions, not low-level details. Open-closed says behavior should be extendable without editing stable code. A PaymentGateway interface with injected implementations satisfies both.",
    remember: "Hardcoded if-else over vendor SDKs = both OCP and DIP violated; fix is \"depend on an interface, inject the implementation.\"",
    interviewAnswer: "When a class directly constructs every concrete payment SDK and branches on provider name, it's tightly coupled to low-level details and has to change every time a new provider shows up. The fix is to introduce a PaymentGateway interface that the processor depends on, then inject concrete gateways into it. That way the processor stays closed to modification — adding Razorpay or Stripe support is just a new class behind the same contract, which is dependency inversion and open-closed working together.",
  },
{
    id: "q-oop-srp-001",
    subject: "OOP",
    concept: "Single Responsibility",
    difficulty: "medium",
    stem: `You are reviewing a class that contains code for multiple domains of concern:

\`\`\`javascript
class InvoiceManager {
  calculateTaxes(invoice) { /* tax rules */ }
  generatePdf(invoice) { /* canvas rendering */ }
  sendEmail(invoice) { /* SMTP logic */ }
}
\`\`\`

A change to the email layout forces re-testing tax math, and a tax rule change risks breaking PDF formatting. Which principle is violated?`,
    options: [
      {
        text: "Interface Segregation: Because the class exposes multiple public methods that are not used by the same clients.",
        sub: "Split interfaces to avoid forcing unused dependencies on clients",
        fix: "The problem is that the class contains too many distinct responsibilities, not that it implements an overly broad interface.",
      },
      {
        text: "Dependency Inversion: Because the high-level business policies do not depend on low-level database details.",
        sub: "Depend on abstractions rather than concrete modules",
        fix: "Dependency Inversion concerns the direction of dependencies between modules; here, the issue is mixing unrelated domains of logic.",
      },
      {
        text: "Liskov Substitution: Because subclasses fail to preserve the behavioral invariants of the parent invoice classes.",
        sub: "Ensure subtype correctness in polymorphic hierarchies",
        fix: "There are no subclasses or inheritance hierarchies involved in the scenario, so substitutability is not violated.",
      },
      {
        text: "Single Responsibility: Because the module mixes tax computation, layout rendering, and notification delivery.",
        sub: "Divide modules so that each has only a single reason to change",
        fix: "",
      },
    ],
    correctIndex: 3,
    proTip: "SRP is best read as 'one reason to change.' When edits to formatting, calculation, and delivery all land in one class, split it into calculation, rendering, and notification collaborators.",
    lesson: "The Single Responsibility Principle states a class should have only one reason to change. When tax calculation, PDF rendering, and emailing live in one class, unrelated changes interfere with each other and tests become entangled. Separating them into focused classes (e.g., InvoiceCalculator, InvoiceRenderer, InvoiceNotifier) isolates change and improves testability.",
    remember: "\"One reason to change\" is the SRP litmus test — if three unrelated edits all land in the same class, split it.",
    interviewAnswer: "This InvoiceManager is doing tax math, PDF rendering, and emailing all in one class, so a change to the email template forces you to re-test totally unrelated logic like tax calculation. That's a textbook Single Responsibility violation — the class has more than one reason to change. I'd split it into something like an InvoiceCalculator, InvoiceRenderer, and InvoiceNotifier so each piece can change and be tested independently.",
  },
{
    id: "q-oop-lsp-001",
    subject: "OOP",
    concept: "Liskov Substitution",
    difficulty: "hard",
    stem: `You are reviewing a geometric shape library with the following implementation:

\`\`\`javascript
class Rectangle {
  setWidth(w) { this.width = w; }
  setHeight(h) { this.height = h; }
}

class Square extends Rectangle {
  setWidth(w) { this.width = w; this.height = w; }
  setHeight(h) { this.width = h; this.height = h; }
}
\`\`\`

Existing client code sets width to 5 and height to 4, expecting an area of 20, but fails when passed a Square. Which principle is violated?`,
    options: [
      {
        text: "Open-Closed: The classes cannot be extended with new shapes without modifying existing base methods.",
        sub: "Allow behavioral extension without source code changes",
        fix: "The scenario focuses on subclass behavior breaking expectations of existing client code, not extension limitations.",
      },
      {
        text: "Interface Segregation: The interface forces clients to depend on properties they do not utilize.",
        sub: "Decompose fat interfaces to avoid unused method dependencies",
        fix: "The interface does not contain unused methods; the issue is that subclass behavior violates base class contract assumptions.",
      },
      {
        text: "Single Responsibility: The shape classes are performing multiple unrelated domain responsibilities.",
        sub: "Isolate distinct axes of change into separate classes",
        fix: "The classes only model geometric dimensions, which is a single concern; the issue is subtype substitution behavior.",
      },
      {
        text: "Liskov Substitution: The subclass overrides base methods in a way that breaks client contract assumptions.",
        sub: "Ensure subtypes remain fully substitutable for their parent classes",
        fix: "",
      },
    ],
    correctIndex: 3,
    proTip: "The Square-Rectangle problem is the classic LSP cautionary tale: an 'is-a' relationship that holds in geometry breaks behaviorally. Prefer modeling shapes as immutable or via composition rather than forcing the inheritance.",
    lesson: "The Liskov Substitution Principle says objects of a subtype must be usable anywhere the base type is expected, without breaking the program's correctness. Square inherits from Rectangle but violates the implicit contract that width and height vary independently, so code relying on that contract misbehaves. The fix is to avoid the inheritance — make shapes immutable or compose behavior instead.",
    remember: "Square-extends-Rectangle is the canonical LSP trap — an \"is-a\" that's geometrically true can still break behaviorally.",
    interviewAnswer: "Even though a square is mathematically a rectangle, making Square inherit from Rectangle breaks the implicit contract that width and height can be set independently. So code that sets width to 5 and height to 4 expecting area 20 silently gets 16 when it's actually handed a Square — that's a Liskov Substitution violation because the subtype doesn't honor the base type's behavior. The usual fix is to stop forcing that inheritance and instead model shapes as immutable or use composition.",
  },
{
    id: "q-oop-compose-001",
    subject: "OOP",
    concept: "Composition vs Inheritance",
    difficulty: "hard",
    stem: `You are modeling notification messages using class inheritance. Over time, the class structure has grown to include the following:

\`\`\`
Notification
├── EmailNotification
│   ├── PromotionalEmail
│   └── TransactionalEmail
└── SmsNotification
    ├── PromotionalSms
    └── TransactionalSms
\`\`\`

As more channels (Push, Slack) and message types (Alerts) are added, the number of subclasses grows combinatorially. What is this design smell called?`,
    options: [
      {
        text: "Inheritance Explosion: Subclasses multiply rapidly as independent axes of behavior are combined through subclassing.",
        sub: "Combines orthogonal dimensions using inheritance instead of composition",
        fix: "",
      },
      {
        text: "Missing Singleton: The system fails to centralize instance creation, creating duplicate configurations at runtime.",
        sub: "Fail to restrict class instantiation to a single global object",
        fix: "Singleton only restricts the number of active instances; it does not solve the combinatorial growth of classes in a hierarchy.",
      },
      {
        text: "Dynamic Binding Failure: The compiler is unable to determine the target implementation at runtime.",
        sub: "Unresolved polymorphic method calls during execution",
        fix: "Polymorphism functions fine here; the issue is the static class structure itself, which requires compile-time code duplication.",
      },
      {
        text: "Encapsulation Leaks: Internal state variables are exposed across classes, breaking data boundaries.",
        sub: "Exposing private members to external calling scopes",
        fix: "The data encapsulation may still be correct; the issue is subclass multiplication across two independent dimensions of change.",
      },
    ],
    correctIndex: 0,
    proTip: "Composition lets you combine MessageType and DeliveryChannel as separate strategies. That turns class multiplication into small interchangeable parts.",
    lesson: "Inheritance is useful for stable is-a relationships. Composition is often better when behavior varies along multiple independent axes. If subclasses multiply for every combination, split those dimensions into separate objects and compose them.",
    remember: "Subclasses multiplying with every new combination of independent behaviors = inheritance explosion; compose the axes instead.",
    interviewAnswer: "When you see EmailNotification, SmsNotification, PromotionalEmail, TransactionalSms and the subclass count keeps growing every time a new channel or message type appears, that's inheritance being used to model two independent dimensions at once. Inheritance hierarchies blow up combinatorially in that situation. The better design is to pull MessageType and DeliveryChannel apart into separate strategy objects and compose them, so adding a new channel or type is one new small class, not a cross product of subclasses.",
  },
{
    id: "q-oop-encap-001",
    subject: "OOP",
    concept: "Encapsulation",
    difficulty: "easy",
    stem: `You are inspecting a financial module where account balances can be manipulated directly by external modules:

\`\`\`javascript
class BankAccount {
  constructor() {
    this.balance = 0;
  }
}

// External caller
const account = new BankAccount();
account.balance = -1000; // Bypasses overdraft checks
\`\`\`

Which OOP concept should be applied to prevent direct external manipulation and enforce validation rules?`,
    options: [
      {
        text: "Inheritance: Define the balance property in a base class to automatically secure it from external modifications.",
        sub: "Use parent class definitions to protect state variables",
        fix: "Moving a property to a base class does not restrict its visibility; if it remains public, external code can still write to it.",
      },
      {
        text: "Abstraction: Define a BankAccount interface that hides the details of the balance property representation.",
        sub: "Conceal concrete implementations behind a interface contract",
        fix: "Abstraction defines which operations are publicly available; it does not directly prevent raw properties from being writable.",
      },
      {
        text: "Encapsulation: Make the balance property private and expose checked methods like deposit and withdraw to modify it.",
        sub: "Restrict direct state access and expose controlled mutation interfaces",
        fix: "",
      },
      {
        text: "Polymorphism: Allow subclasses to override the balance property to implement custom overdraft constraints.",
        sub: "Use dynamic method dispatch to vary properties dynamically",
        fix: "Polymorphism handles type-specific method execution; it does not protect properties from direct external modifications.",
      },
    ],
    correctIndex: 2,
    proTip: "Encapsulation isn't just 'make fields private' — it's keeping invariants enforceable. Expose intent-revealing methods (deposit, withdraw) that validate, and the object can never reach an illegal state from outside.",
    lesson: "Encapsulation bundles data with the methods that operate on it and restricts direct external access to internal state. By making balance private and exposing validated operations like deposit and withdraw, the class enforces its invariants (e.g., no overdraft) regardless of how callers use it. Public mutable fields break this guarantee by letting outside code put the object in an invalid state.",
    remember: "Public mutable fields kill invariants — encapsulation means hiding state behind validated methods, not just marking it private.",
    interviewAnswer: "The problem here isn't that balance is a number, it's that it's publicly writable, so any code can shove it to a negative value and bypass the overdraft rule entirely. Encapsulation fixes this by hiding the field and only exposing intent-revealing operations like deposit and withdraw that enforce the invariant internally. So the object itself guarantees it can never end up in an invalid state, no matter who's calling it.",
  },
{
    id: "q-oop-poly-001",
    subject: "OOP",
    concept: "Polymorphism",
    difficulty: "medium",
    stem: `You are reviewing a rendering function that computes areas for a heterogeneous collection of shape objects:

\`\`\`javascript
function renderAreas(shapes) {
  for (const shape of shapes) {
    console.log(shape.area());
  }
}
\`\`\`

Circles, Squares, and Triangles each compute area differently, yet the loop has no type checks. Which OOP feature ensures the correct method runs for each object?`,
    options: [
      {
        text: "Encapsulation: The shape object hides its internal dimensions and provides a public interface.",
        sub: "Bundle data and code within a single object wrapper",
        fix: "Encapsulation restricts direct data access; it does not coordinate which subclass method executes in a collection loop.",
      },
      {
        text: "Method Overloading: The compiler resolves the target area method based on the parameter list at compile time.",
        sub: "Distinguish methods with the same name by arguments",
        fix: "Overloading is resolved statically at compile time based on parameter types; here, dispatch occurs at runtime based on the object instance.",
      },
      {
        text: "Runtime Polymorphism: The runtime dynamically dispatches the call to the subclass that overrides the base method.",
        sub: "Resolve method execution dynamically based on the concrete instance type",
        fix: "",
      },
      {
        text: "Static Binding: The compiler resolves the method call directly to the base Shape class area implementation.",
        sub: "Bind calls to declared reference types during compilation",
        fix: "Static binding executes the declared base method, which would ignore the subclass implementations entirely.",
      },
    ],
    correctIndex: 2,
    proTip: "Dynamic dispatch lets you write code against the abstraction (Shape) while each concrete type supplies its own behavior. Adding a new shape requires no change to the rendering loop — that's the open-closed payoff.",
    lesson: "Runtime polymorphism lets a single call site invoke different implementations depending on the actual object's type. Each subclass overrides area(), and the runtime dispatches to the correct override (dynamic binding). This eliminates type switches and supports the open-closed principle: new Shape subclasses work with existing code unchanged. Overloading, by contrast, is resolved statically by parameter types.",
    remember: "Overriding vs overloading: overriding dispatches at runtime based on the actual object; overloading resolves at compile time based on argument types.",
    interviewAnswer: "The renderer calls shape.area() on a list of Shape references and gets different behavior for Circle, Square, and Triangle without any type checks — that's runtime polymorphism through method overriding. Each subclass provides its own area() implementation, and the language dispatches to the correct one based on the object's actual type at runtime, not its declared type. This is what lets you add a new Shape subclass later without touching the rendering loop at all, which is the open-closed principle in action.",
  },
{
    id: "q-oop-factory-001",
    subject: "OOP",
    concept: "Factory Pattern",
    difficulty: "medium",
    stem: `You are refactoring a database client library where concrete connections are instantiated directly based on config files:

\`\`\`javascript
function connect(config) {
  if (config.db === "mysql") return new MySqlConnection();
  if (config.db === "postgres") return new PostgresConnection();
}
\`\`\`

You want client code to obtain connection instances without coupling to concrete classes or their constructor parameters. Which pattern applies?`,
    options: [
      {
        text: "Factory: Encapsulate instantiation logic behind a creator method, returning an object matching a common interface.",
        sub: "Decouple client code from concrete constructors",
        fix: "",
      },
      {
        text: "Observer: Set up a subscription network where connection status changes are broadcast to registered handlers.",
        sub: "Publish state updates to a list of dependents",
        fix: "Observer handles runtime state change notifications; it is not concerned with selecting or instantiating concrete classes.",
      },
      {
        text: "Singleton: Restrict database connection subclasses to a single instance throughout the application lifecycle.",
        sub: "Ensure a class has only one global instance",
        fix: "Singleton restricts instance count but does not address decoupling clients from concrete constructors or class selection.",
      },
      {
        text: "Decorator: Wrap connection instances dynamically to append logging or authentication filters at runtime.",
        sub: "Extend object responsibilities without subclassing",
        fix: "Decorator extends the functionality of existing instances; it does not handle class selection or instantiation logic.",
      },
    ],
    correctIndex: 0,
    proTip: "A factory concentrates the 'which class to new up' decision in one place, so client code depends only on the product interface. Swapping or adding implementations becomes a change in the factory, not across every call site.",
    lesson: "The Factory pattern encapsulates object creation: instead of scattering constructor calls, clients ask a factory for a product by some criterion and receive an instance typed to an interface. This decouples callers from concrete classes, centralizes construction logic, and makes it easy to add or swap implementations. Observer, Decorator, and Singleton solve unrelated problems (notification, dynamic wrapping, single instance).",
    remember: "Lots of scattered `new ConcreteClass()` calls chosen by config is the smell that screams Factory pattern.",
    interviewAnswer: "When client code is full of `new MySqlConnection()` or `new PostgresConnection()` picked by some config value, every caller is coupled to concrete classes and their constructors. A factory centralizes that \"which class do I instantiate\" decision in one place, so callers just ask for a connection by name and get back something typed to a common interface. That means swapping or adding a new database type only changes the factory, not every call site that needed a connection.",
  },
{
    id: "q-oop-strategy-001",
    subject: "OOP",
    concept: "Strategy Pattern",
    difficulty: "medium",
    stem: `You are refactoring a shipping calculator that has a growing conditional branch for different shipping algorithms:

\`\`\`javascript
class ShippingCalculator {
  calculate(order) {
    if (order.type === "flat") return order.price * 0.1;
    if (order.type === "weight") return order.weight * 2;
    if (order.type === "express") return order.price * 0.25;
  }
}
\`\`\`

Adding new shipping methods requires modifying this class. Which pattern extracts these branches into swappable runtime objects?`,
    options: [
      {
        text: "Adapter: Convert the interface of each individual shipping algorithm to match what the client expects.",
        sub: "Reconcile incompatible interface signatures",
        fix: "Adapter translates interfaces between incompatible classes; here, the shipping algorithms already share the same conceptual input/output.",
      },
      {
        text: "Strategy: Encapsulate each shipping calculation algorithm into its own class behind a common pricing interface.",
        sub: "Inject interchangeable algorithms at runtime",
        fix: "",
      },
      {
        text: "Facade: Provide a simplified, high-level entry interface to hide the complexity of the shipping subsystem.",
        sub: "Expose a unified interface to a set of interfaces",
        fix: "Facade provides a simpler API to access a complex subsystem; it does not handle selecting or swapping algorithms at runtime.",
      },
      {
        text: "Singleton: Restrict each of the individual shipping calculation classes to a single global instance.",
        sub: "Ensure only one instance of an algorithm exists",
        fix: "Singleton only manages the instance count of classes; it does not help checkout swap algorithms or satisfy open-closed requirements.",
      },
    ],
    correctIndex: 1,
    proTip: "Strategy turns a branching method into a family of pluggable objects implementing a shared interface. checkout depends on the ShippingStrategy abstraction; new rules are new classes, satisfying open-closed.",
    lesson: "The Strategy pattern defines a family of interchangeable algorithms, encapsulates each behind a common interface, and lets the client choose one at runtime. Replacing a sprawling conditional with injected strategy objects removes branching, isolates each algorithm for testing, and lets you add new behaviors without modifying the context class — a direct application of the open-closed principle.",
    remember: "A giant if-else picking among interchangeable algorithms is the Strategy pattern's calling card — extract each branch into its own class behind a shared interface.",
    interviewAnswer: "A checkout class with a growing if-else for flat-rate, weight-based, and free shipping is going to need editing every time a new shipping rule shows up, which violates open-closed. Strategy fixes this by pulling each algorithm out into its own class implementing a common ShippingStrategy interface, and the checkout class just holds a reference to whichever one was injected. Adding a new shipping rule then means writing a new strategy class, with zero changes to checkout itself.",
  },
{
    id: "q-oop-coupling-001",
    subject: "OOP",
    concept: "Coupling & Cohesion",
    difficulty: "hard",
    stem: `You are reviewing a class interaction where Module A configures database properties by digging through Module B's collaborators:

\`\`\`javascript
b.getConfig().getDb().getPool().setSize(10);
\`\`\`

Any change to the internal structure of B's configuration breaks Module A. Which architectural issue is present, and how should it be solved?`,
    options: [
      {
        text: "Low Cohesion: Solve it by merging Module A and Module B into a single class to unify their responsibilities.",
        sub: "Combine classes that reference each other's configuration",
        fix: "Merging classes does not resolve the structural coupling and typically worsens cohesion by mixing unrelated responsibilities.",
      },
      {
        text: "Encapsulation Deficit: Solve it by exposing public properties on B's config chain so that B does not need getters.",
        sub: "Make fields public to simplify access chains",
        fix: "Exposing public properties increases coupling and violates encapsulation by exposing internal structure details.",
      },
      {
        text: "Excessive Polymorphism: Solve it by removing intermediate interfaces to bind callers directly to implementation classes.",
        sub: "Reduce abstract layers to simplify reference lookups",
        fix: "Removing abstractions does not address the Law of Demeter violation and increases coupling to concrete types.",
      },
      {
        text: "High Coupling: Solve it by exposing a dedicated configuration method on B that encapsulates the pool details.",
        sub: "Adhere to the Law of Demeter and tell, don't ask",
        fix: "",
      },
    ],
    correctIndex: 3,
    proTip: "Long call chains into another object's guts (a 'train wreck') signal high coupling and violate the Law of Demeter. Give B a method like configurePool(size) so callers state intent and B owns its internals.",
    lesson: "Coupling measures how dependent modules are on each other's details; cohesion measures how focused a module's responsibilities are. Reaching through several layers of another object's internals creates high (structural) coupling, so internal changes ripple outward. The Law of Demeter — 'only talk to your immediate collaborators' — suggests exposing an intent-revealing method that hides the internal chain, lowering coupling.",
    remember: "Train-wreck chains like `b.getConfig().getDb().getPool()` violate the Law of Demeter — give B a real method instead of more getters.",
    interviewAnswer: "Module A reaching through Module B's internals with a chain like getConfig().getDb().getPool().setSize() is a classic sign of high coupling — any change to B's internal structure breaks A even though nothing conceptually changed from A's point of view. The Law of Demeter says you should only talk to your immediate collaborators, so the fix is giving B a focused method like configurePool(size) that hides the internal chain. That's \"tell, don't ask\" — A states its intent and B decides how to satisfy it internally.",
  },
{
    id: "q-oop-abstraction-001",
    subject: "OOP",
    concept: "Abstraction",
    difficulty: "easy",
    stem: `You are reviewing a logging system interface:

\`\`\`javascript
interface Logger {
  log(message: string): void;
}
\`\`\`

Behind this interface, messages can be written to a local database, standard output, or a remote ingestion pipeline. Callers are unaffected by changes to these backends. Which OOP concept is illustrated?`,
    options: [
      {
        text: "Inheritance: Because the logger subclasses reuse the log method implementation defined in the base Logger interface.",
        sub: "Inherit common method definitions from a parent type",
        fix: "Interfaces do not provide implementation details to inherit, and reuse is not the primary concept highlighted by hiding complexity.",
      },
      {
        text: "Encapsulation: Because the interface restricts external callers from inspecting the local variable state of the caller.",
        sub: "Prevent external scope from accessing class properties",
        fix: "Encapsulation hides internal object state; the scenario emphasizes presenting a simplified interface to hide behavior complexity.",
      },
      {
        text: "Abstraction: Because the interface exposes essential behavior while hiding implementation details from the caller.",
        sub: "Present a simplified contract and conceal the underlying mechanics",
        fix: "",
      },
      {
        text: "Polymorphism: Because the logger dispatches the log method call to different signature overloads at compile time.",
        sub: "Resolve overloading variations during compilation",
        fix: "Polymorphism can vary behavior at runtime, but the specific act of hiding details behind a simple interface is called abstraction.",
      },
    ],
    correctIndex: 2,
    proTip: "Abstraction is about the interface you present: callers reason about 'log a message,' not file handles or network retries. It pairs with encapsulation, which hides the concrete state that makes that interface work.",
    lesson: "Abstraction exposes only the essential operations of a component while hiding how they're implemented. A log(message) method lets callers ignore whether logging writes to a file, console, or network, so the backend can change without affecting them. It's closely related to encapsulation (hiding internal state) but focuses on simplifying the interface that clients depend on.",
    remember: "Abstraction is about the interface callers see (\"what\"); encapsulation is about hiding the state that makes it work (\"how\").",
    interviewAnswer: "A log(message) method that callers use without knowing whether it writes to a file, the console, or a remote service is a clean example of abstraction — it exposes the essential operation and hides everything about how that operation is fulfilled. Because callers only depend on that simple interface, the backend can be swapped or changed without touching any calling code. It's related to encapsulation, but the focus here is specifically on simplifying what the client sees, not on hiding an object's own internal data.",
  },
{
    id: "q-oop-observer-001",
    subject: "OOP",
    concept: "Observer Pattern",
    difficulty: "medium",
    stem: `You are designing an order fulfillment system where multiple modules must react when an order is updated:

\`\`\`javascript
class Order {
  setStatus(status) {
    this.status = status;
    // Email, Analytics, and Inventory modules must react here
  }
}
\`\`\`

You want to allow modules to subscribe dynamically without coupling the Order class to them. Which pattern fits?`,
    options: [
      {
        text: "Strategy: Wrap each individual reaction system in a pricing or routing algorithm interface inside the Order class.",
        sub: "Inject a single interchangeable algorithm",
        fix: "Strategy selects one algorithm at a time; it is not suited for broadcasting events to an arbitrary number of systems.",
      },
      {
        text: "Factory: Set up a central instantiation registry to construct the correct handler subclass based on the status name.",
        sub: "Encapsulate concrete class object creation",
        fix: "Factory centralizes object creation but does not manage runtime event notifications or dependencies between active instances.",
      },
      {
        text: "Decorator: Wrap the Order instance in nested wrappers that intercept the setStatus method to call handler modules.",
        sub: "Extend object behavior dynamically through wrappers",
        fix: "Decorator extends the behavior of a single object; using it to broadcast events to unrelated systems leads to highly complex nesting.",
      },
      {
        text: "Observer: Maintain a list of subscriber interfaces on the Order class, invoking their update method upon state changes.",
        sub: "Decouple event publishers from subscribers using interface callbacks",
        fix: "",
      },
    ],
    correctIndex: 3,
    proTip: "Observer (publish/subscribe) decouples the source of an event from its handlers. The subject keeps a list of observers and calls a common notify method; new reactions are new observers, with no change to the order class.",
    lesson: "The Observer pattern defines a one-to-many dependency: a subject maintains a list of observers and notifies them automatically when its state changes, via a shared update interface. This decouples the subject from concrete handlers, so you can add or remove reactions (email, analytics, inventory) without modifying the subject — a foundation of event-driven and publish/subscribe designs.",
    remember: "One subject, many independent reactions that can grow over time = Observer/pub-sub, not Strategy or Factory.",
    interviewAnswer: "When an order's status changes and email, analytics, and inventory all need to react without the order object knowing who they are, that's a one-to-many notification problem, which is exactly what the Observer pattern solves. The subject — the order — just keeps a list of registered observers and calls a shared notify method on all of them whenever its state changes. That decouples the order from any specific handler, so you can add a new reaction later just by registering a new observer, with no changes to the order class itself.",
  },
{
    id: "q-oop-singleton-001",
    subject: "OOP",
    concept: "Singleton Pattern",
    difficulty: "easy",
    stem: `You are designing a configuration manager that must be shared across all modules in your application:

\`\`\`javascript
class AppConfig {
  constructor() {
    this.settings = loadSettings();
  }
}
\`\`\`

Instantiating multiple config objects causes inconsistent settings at runtime. Which pattern restricts this class to one instance, and what is its main caveat?`,
    options: [
      {
        text: "Factory: Restricts connection access through a creator registry; caveat: it adds overhead by recreating instances.",
        sub: "Centralize object creation through a method interface",
        fix: "A factory is designed to create new instances on demand and does not inherently restrict a class to a single instance.",
      },
      {
        text: "Singleton: Restricts the class to a single instance and provides a global access point; caveat: it makes testing harder.",
        sub: "Ensure only one shared instance is accessible globally",
        fix: "",
      },
      {
        text: "Observer: Restricts updates through a broadcast system; caveat: it causes performance lag with many event listeners.",
        sub: "Publish state changes to registered dependents",
        fix: "Observer handles event distribution and does not regulate or restrict the instantiation count of a class.",
      },
      {
        text: "Adapter: Restricts connection parameters via interface translation; caveat: it introduces translation overhead.",
        sub: "Reconcile incompatible method signatures",
        fix: "Adapter translates interfaces between incompatible classes; it does not constrain how many class instances can be created.",
      },
    ],
    correctIndex: 1,
    proTip: "Singleton guarantees one instance and a global access point, which is handy for shared config or connection pools — but it introduces global state that complicates testing and hides dependencies. Dependency injection of a single instance is often a cleaner alternative.",
    lesson: "The Singleton pattern restricts a class to a single instance and provides a global access point to it, useful for shared resources like configuration or a connection pool. The well-known caveat is that it introduces global mutable state, which can hide dependencies, complicate unit testing, and cause subtle issues with concurrency and initialization order. Many teams prefer injecting one shared instance instead.",
    remember: "Singleton guarantees exactly one instance and a global access point — but that global state is also its biggest cost to testability.",
    interviewAnswer: "When you need exactly one shared configuration object and creating multiple copies would cause inconsistent settings across the app, Singleton is the pattern designed for that — it restricts instantiation to one instance and gives every module the same global access point. The catch is that global state like this can hide dependencies and make unit testing harder, since tests can leak state into each other through the shared instance. A lot of teams prefer just creating one instance and injecting it explicitly rather than relying on the pattern's global access.",
  },
{
    id: "q-cpp-refptr-001",
    subject: "CPP",
    concept: "References vs Pointers",
    difficulty: "easy",
    stem: "A function signature is `void apply(Config& cfg)`. A teammate asks why it isn't `Config* cfg` instead, since both avoid copying the struct. What's the key behavioral difference that justifies the reference here?",
    options: [
      {
        text: "References allow the function to modify the caller's variable, but pointers don't",
        sub: "Mutability difference",
        fix: "A non-const pointer can mutate the pointee just as well: `(*cfg).field = x;`. Both can express mutation; the const-ness is independent of reference vs pointer.",
      },
      {
        text: "References are faster than pointers because they avoid an extra memory address",
        sub: "Performance difference",
        fix: "Under the hood a reference is typically implemented as a pointer; there's no inherent performance advantage. The real difference is in the guarantees the type system gives you.",
      },
      {
        text: "References are copied by value when passed, so the function gets its own config",
        sub: "Pass-by-value semantics",
        fix: "A reference is an alias for the original object, not a copy — that's exactly why `apply` can see and modify the caller's struct in place.",
      },
      {
        text: "References can't be null and can't be reseated, so callers can't pass a missing config or accidentally rebind it",
        sub: "Reference is bound once, for life, to a valid object",
        fix: "",
      },
    ],
    correctIndex: 3,
    proTip: "Reach for a reference parameter when the argument is guaranteed to exist and won't be reseated. Reach for a pointer (or `std::optional<T&>`-style pattern) when 'no value' is a real, expected case you must handle.",
    lesson: "A reference must be bound to a valid object at the point it's declared and can never be null or rebound to a different object afterward. A pointer can be null, can be reassigned to point elsewhere, and requires explicit dereferencing. Neither is inherently faster — both are typically pointer-sized under the hood — so the choice is about expressing 'this always refers to something valid' (reference) versus 'this may or may not refer to something, and that may change' (pointer).",
    remember: "Reference vs pointer: a reference is a permanent, non-null alias bound at creation; a pointer can be null or reseated — pick reference when \"must exist, never changes\" is the contract.",
    interviewAnswer: "I'd use a reference here because it guarantees the caller passed a valid config — references can't be null and can't be rebound to point at something else later, so the function's contract is airtight. A pointer would technically work too, but it opens the door to null checks and reassignment that just aren't needed when the value is always expected to exist. Performance is identical either way since a reference is just a pointer under the hood with stricter compiler-enforced guarantees.",
  },
{
    id: "q-cpp-const-001",
    subject: "CPP",
    concept: "Const Correctness",
    difficulty: "medium",
    stem: "A method is declared `int size() const;` on a class wrapping a `std::vector`. Calling `obj.size()` on a `const Widget&` compiles fine, but calling a non-const method `obj.resize(10)` on that same const reference fails to compile. Why does the `const` qualifier on the method matter here?",
    options: [
      {
        text: "A `const` object implicitly requires all arguments passed to its non-`const` methods to be `const`-qualified, which the literal `10` is not.",
        sub: "Argument const-qualification requirement",
        fix: "The failure is due to the method itself not being `const`, not the type or const-ness of its argument. The literal `10` would be perfectly fine if `resize` were `const`.",
      },
      {
        text: "`const` methods enable compiler optimizations that bypass runtime state checks, making them perform faster but strictly disallowing object modification.",
        sub: "Performance optimization via `const` qualifier",
        fix: "`const` is a compile-time contract about state immutability, not a runtime performance hint. It does not affect or bypass runtime checks like bounds validation.",
      },
      {
        text: "A `const` method promises no state modification, allowing its use on `const` objects. Non-const methods lack this guarantee, preventing their call on such objects.",
        sub: "Method `const` as a non-modification contract",
        fix: "",
      },
      {
        text: "When `obj` is accessed as `const Widget&`, its `std::vector` member becomes implicitly `const`, which `resize()` then attempts to violate.",
        sub: "Implicit const-qualification of member data",
        fix: "The `const` reference implies the member `std::vector` is logically `const`, but the actual compilation error is because `resize()` is not marked `const` itself, making it unsuitable for a `const` object.",
      },
    ],
    correctIndex: 2,
    proTip: "Marking every method that doesn't mutate the object as `const` lets you accept `const&` parameters everywhere, which documents intent and lets the compiler catch accidental mutations.",
    lesson: "A `const` member function promises the compiler it won't modify the object's logical state (modulo `mutable` members), which lets it be called on `const` objects or through `const` references. A non-const method makes no such promise, so the compiler refuses to call it on a const object — that's the whole mechanism, independent of the argument passed or any runtime behavior.",
    remember: "A method's `const` is part of its signature: const objects can only call const methods, because const is the compiler's \"I won't mutate you\" contract, not a runtime optimization.",
    interviewAnswer: "The `const` on `size()` is a compile-time promise that the method won't change the object's observable state, so the compiler allows it to be invoked on a `const Widget&`. `resize()` makes no such promise, so calling it through a const reference is rejected outright — it has nothing to do with performance or how the vector member itself is declared. This is exactly why marking every non-mutating method const is good practice: it lets you safely accept const references throughout your codebase.",
  },
{
    id: "q-cpp-raii-001",
    subject: "CPP",
    concept: "RAII",
    difficulty: "medium",
    stem: "A function opens a file handle with `FILE* f = fopen(path, \"r\");`, then does some processing, then calls `fclose(f);` at the end. Midway through processing, an exception is thrown and propagates out of the function. What's the consequence, and what's the idiomatic C++ fix?",
    options: [
      {
        text: "Nothing leaks — C++ automatically closes any open file handles when an exception is thrown",
        sub: "Automatic cleanup claim",
        fix: "C++ guarantees destructors run during stack unwinding, but a raw `FILE*` has no destructor to call — there's no automatic cleanup for resources that aren't owned by an object with a destructor.",
      },
      {
        text: "The program will fail to compile because you can't throw exceptions in a function that opens a file",
        sub: "Compile-time restriction",
        fix: "There's no such restriction; this compiles and runs fine. The problem is a runtime resource leak, not a compile error.",
      },
      {
        text: "`fclose(f)` is skipped because the throw exits before reaching it, leaking the handle; wrap the handle in an RAII type whose destructor calls `fclose`",
        sub: "Stack unwinding skips remaining statements, not destructors",
        fix: "",
      },
      {
        text: "The exception will be caught automatically and `fclose(f)` will still run because it's the last line of the function",
        sub: "Implicit catch behavior",
        fix: "An uncaught exception unwinds the stack immediately, skipping all remaining statements in the function body, including that final `fclose(f)` line — it never executes.",
      },
    ],
    correctIndex: 2,
    proTip: "RAII (Resource Acquisition Is Initialization) is C++'s core idiom for exception safety: tie a resource's lifetime to an object's constructor/destructor so cleanup happens automatically on every exit path, including exceptions.",
    lesson: "When an exception propagates, C++ unwinds the stack and runs the destructors of stack-allocated objects in scope, but it does not run arbitrary 'cleanup' statements that simply weren't reached — those are skipped. A raw `FILE*` has no destructor, so an exception thrown before `fclose` leaks the handle. Wrapping it in an RAII type (or using `std::unique_ptr` with a custom deleter, or `std::fstream`) guarantees the destructor — and therefore the cleanup — runs on every exit path.",
    remember: "Exception thrown mid-function means every un-reached cleanup statement is skipped — only destructors of in-scope stack objects run, so raw resources without a destructor leak.",
    interviewAnswer: "When an exception is thrown, the stack unwinds and runs destructors for objects already in scope, but it doesn't execute the remaining lines of code — so that `fclose(f)` at the bottom of the function simply never runs. The fix is RAII: wrap the file handle in an object whose destructor calls `fclose`, so cleanup is guaranteed on every exit path, exception or not. That's really the whole point of RAII — tying resource lifetime to object lifetime instead of relying on reaching a specific line of code.",
  },
{
    id: "q-cpp-slicing-001",
    subject: "CPP",
    concept: "Object Slicing",
    difficulty: "hard",
    stem: "`std::vector<Shape> shapes;` holds objects passed in as `Shape` by value, where `Circle` derives from `Shape`. A `Circle` object is pushed in via `shapes.push_back(myCircle);`, then later code calls `shapes[0].draw()` expecting `Circle::draw()` to run. Instead `Shape::draw()` runs. Why?",
    options: [
      {
        text: "`draw()` is not declared `virtual` within the `Circle` class, preventing it from correctly overriding the base `Shape` method.",
        sub: "Missing `virtual` or `override` specifier",
        fix: "The `virtual` keyword is only required in the base class declaration for polymorphism. `override` is good practice but not necessary for the polymorphic call. The issue is object slicing, not virtual declaration.",
      },
      {
        text: "The `vector` reallocates its memory during `push_back`, moving the `Shape` object and inadvertently corrupting its `Circle` specific data.",
        sub: "Container reallocation side-effects",
        fix: "Vector reallocation correctly moves or copies elements without altering their type or content. The problem is the initial copy of `myCircle` into `Shape` storage by value, which happens before any potential reallocation.",
      },
      {
        text: "Copying `myCircle` into `vector<Shape>` by value truncates it to a `Shape` object, losing its `Circle` specific data and dynamic type.",
        sub: "Value semantics truncate derived objects",
        fix: "",
      },
      {
        text: "`shapes[0]` returns a temporary `Shape` object copy each time, which discards the original `Circle` type information.",
        sub: "Temporary object from array access",
        fix: "`operator[]` on a `vector<Shape>` returns a reference to the stored element, not a fresh temporary copy. The loss of `Circle` type occurs during `push_back`, not `operator[]`.",
      },
    ],
    correctIndex: 2,
    proTip: "Whenever you need runtime polymorphism with a container, store pointers or smart pointers (`std::vector<std::unique_ptr<Shape>>`), never plain base-class values — value containers always slice derived data away.",
    lesson: "Object slicing occurs when a derived-class object is copied or assigned into a variable, parameter, or container element typed as the base class by value: only the base-class portion is copied, the derived data is discarded, and the dynamic type becomes exactly the base class — virtual dispatch can no longer reach the derived override because the object literally isn't a `Circle` anymore. The fix is to store pointers/references (or smart pointers) to the base type so polymorphism is preserved.",
    remember: "Object slicing: storing a derived object by value in a base-typed container or variable strips the derived part away — polymorphism needs pointers or references, never plain base-class values.",
    interviewAnswer: "The vector is declared as `vector<Shape>`, so when the Circle gets pushed in, only the Shape-sized portion gets copied — the derived data and the dynamic type are sliced off, and what's actually stored is a plain Shape. Since there's no Circle left in memory at that point, calling draw() can only resolve to Shape's version, virtual or not. The fix is to store pointers or smart pointers instead, like `vector<unique_ptr<Shape>>`, so the full derived object stays intact and dispatch works as expected.",
  },
{
    id: "q-cpp-virtualdtor-001",
    subject: "CPP",
    concept: "Virtual Destructors",
    difficulty: "hard",
    stem: "`class Base { public: virtual void run(); ~Base() {} };` and `class Derived : public Base { std::vector<int> buffer; ~Derived() {} };`. Code does `Base* p = new Derived(); delete p;`. `Derived`'s vector buffer never gets cleaned up properly. What's wrong?",
    options: [
      {
        text: "`std::vector` members are never destroyed automatically; you must call `buffer.clear()` manually in the destructor",
        sub: "Manual container cleanup claim",
        fix: "`std::vector`'s own destructor runs automatically as part of any destructor that completes for the object containing it — the bug here is that `~Derived()` never gets called at all, not that vector cleanup needs to be manual.",
      },
      {
        text: "`run()` being virtual makes the whole class non-destructible through a base pointer",
        sub: "Virtual method blocking destruction",
        fix: "A virtual method elsewhere in the class has no bearing on destructor dispatch; only the destructor's own virtual-ness controls which destructor runs through a base pointer.",
      },
      {
        text: "`~Base()` isn't `virtual`, so `delete p` calls only `Base`'s destructor based on the static (pointer) type, never reaching `~Derived()` or destroying its members",
        sub: "Non-virtual destructor through a base pointer",
        fix: "",
      },
      {
        text: "`new Derived()` allocated a `Base`-sized block, so there's no room for the vector member to be destroyed",
        sub: "Allocation size issue",
        fix: "`new Derived()` always allocates enough memory for the full `Derived` object, vector member included. The allocation is correct; it's the destructor call that gets short-circuited.",
      },
    ],
    correctIndex: 2,
    proTip: "Any class intended to be a polymorphic base — i.e., ever deleted through a base pointer — needs a `virtual` destructor. Without it, `delete` on a base pointer is undefined behavior whenever the actual object is a derived type with extra resources.",
    lesson: "When a destructor is not virtual, `delete` on a base-class pointer resolves the destructor call statically, based on the pointer's declared type, not the object's actual runtime type. So `delete p` where `p` is `Base*` calls only `~Base()`, skipping `~Derived()` entirely — any derived-only members (like the vector) are never properly destroyed, and in general this is undefined behavior. Declaring `~Base()` virtual fixes it by making destructor dispatch go through the vtable like any other virtual call.",
    remember: "Non-virtual destructor through a base pointer: `delete` calls based on static type, so `~Derived()` never runs — any base class meant to be deleted polymorphically needs a virtual destructor.",
    interviewAnswer: "Since `~Base()` isn't marked virtual, `delete p` resolves the destructor call statically based on `p`'s declared type, which is `Base*` — so only `~Base()` runs, and `~Derived()` is never called at all. That means the vector member inside Derived never gets its destructor invoked, which is undefined behavior, not just a missed cleanup. The rule of thumb is: any class designed to be used polymorphically and deleted through a base pointer must declare its destructor virtual.",
  },
{
    id: "q-cpp-move-001",
    subject: "CPP",
    concept: "Move Semantics",
    difficulty: "medium",
    stem: "A function builds a large `std::string result` locally and returns it: `return result;`. A teammate suggests changing it to `return std::move(result);` to 'avoid the copy.' Is this necessary, and why?",
    options: [
      {
        text: "Not necessary. C++ compilers automatically apply move construction or copy elision for returned local variables, making explicit `std::move` redundant.",
        sub: "Automatic move/elision for locals",
        fix: "",
      },
      {
        text: "Yes, necessary. Without `std::move`, the compiler would always perform a deep copy of `result` into the calling context.",
        sub: "Mandatory deep-copy assertion",
        fix: "Since C++11, returning a local object by value is treated as an rvalue. The compiler then applies move construction or copy elision, avoiding a deep copy automatically.",
      },
      {
        text: "Yes, necessary. `std::string` natively only supports copy semantics; `std::move` is the only mechanism to avoid a full copy here.",
        sub: "Limited `std::string` capabilities",
        fix: "`std::string` has fully supported move semantics (move constructor and assignment operator) since C++11, specifically to enable efficient transfers like this without explicit `std::move`.",
      },
      {
        text: "Not necessary, but only for `std::string`; for other container types like `std::vector`, explicit `std::move` would be crucial.",
        sub: "Type-specific move requirement",
        fix: "The automatic move/elision rule applies to any movable type, including `std::vector`. It is a general language rule for returning named local objects, not specific to `std::string`.",
      },
    ],
    correctIndex: 0,
    proTip: "`std::move` is most useful when you're handing off ownership of a named object across an assignment, into a container, or as an argument — not on a plain `return localVar;`, where the language already does the efficient thing. Wrapping it can actually disable NRVO (named return value optimization) in some compilers.",
    lesson: "Move semantics let resources (heap buffers, file handles, etc.) be transferred out of an object instead of deep-copied, by binding to an rvalue reference (`T&&`) and leaving the source in a valid-but-unspecified, cheap-to-destroy state. For `return localVar;` of a named local, the compiler treats the return as an rvalue and will use move construction or elide the copy/move entirely (NRVO) — both outcomes a manual `std::move` doesn't improve on, and which it can sometimes interfere with.",
    remember: "Return-by-value of a named local: the compiler already moves or elides it since C++11 — wrapping it in `std::move` is redundant and can actually block NRVO.",
    interviewAnswer: "Since C++11, returning a named local object by value is automatically treated as a move, or the compiler can apply return value optimization and elide the copy/move entirely — so wrapping it in `std::move` doesn't make it any faster. In some cases it can actually be counterproductive because it disables the compiler's ability to apply NRVO. `std::move` earns its keep when you're explicitly transferring ownership across an assignment or into a container, not on a plain return statement like this one.",
  },
{
    id: "q-cpp-copy-001",
    subject: "CPP",
    concept: "Copy Constructor",
    difficulty: "hard",
    stem: "`class Buffer { char* data; public: Buffer(int n) { data = new char[n]; } ~Buffer() { delete[] data; } };` has no explicit copy constructor. Code does `Buffer a(10); Buffer b = a;` then lets both go out of scope, and the program crashes with a heap corruption error. Why?",
    options: [
      {
        text: "The integer `n` in `Buffer(int n)` is not properly initialized, leading to undefined array sizes and subsequent heap corruption during allocation.",
        sub: "Uninitialized constructor parameter",
        fix: "The constructor `Buffer(int n)` is called with an explicit argument (`Buffer a(10)` passes `10`), so `n` is always initialized. The issue is not related to uninitialized parameters.",
      },
      {
        text: "The syntax `Buffer b = a;` is invalid for user-defined types, implicitly corrupting memory rather than yielding a compilation error for object copying.",
        sub: "Incorrect copy initialization syntax",
        fix: "`Buffer b = a;` is standard C++ copy-initialization syntax; it correctly invokes a copy constructor (in this case, the compiler-generated one), which is central to the problem, not the syntax itself.",
      },
      {
        text: "The default copy constructor performs a shallow copy of the `data` pointer, causing both `Buffer` objects to manage the same memory. This results in a double-free when their destructors are called.",
        sub: "Shallow copy leading to double-free",
        fix: "",
      },
      {
        text: "The `new char[n]` expression fails to properly allocate heap memory for fundamental types like `char`, which causes the memory access to be invalid.",
        sub: "Fundamental type allocation failure",
        fix: "`new char[n]` correctly allocates `n` bytes on the heap for `char` arrays. There are no special restrictions on `new` for fundamental types; the allocation itself is not the issue.",
      },
    ],
    correctIndex: 2,
    proTip: "Any class managing a raw resource (pointer, handle, fd) needs the Rule of Three/Five: define copy constructor, copy assignment, and destructor together (and move constructor/assignment in modern C++) — or better, hold the resource in a `std::unique_ptr`/`std::vector` and get correct behavior for free.",
    lesson: "Without a user-defined copy constructor, C++ generates one that performs a memberwise shallow copy — for a raw pointer member, that copies the address, not the pointee. Two objects then alias the same heap buffer. When both go out of scope, each runs the destructor, which calls `delete[] data` — the same memory twice (double free), a classic heap-corruption bug. The fix is a proper deep-copy copy constructor, or RAII via a smart pointer/container that already implements correct copy semantics.",
    remember: "Default copy constructor does a shallow copy: raw pointer members get their address copied, not their data — two objects end up sharing one buffer, setting up a double free when both destructors run.",
    interviewAnswer: "Because Buffer doesn't define its own copy constructor, the compiler generates one that just copies the data pointer's value — the address — rather than allocating a new buffer and copying the bytes. So after `Buffer b = a;`, both a and b point at the exact same heap allocation. When they go out of scope, the destructor runs twice on the same pointer — once for each object — causing the heap corruption. This is the classic case for why a class managing a raw resource needs the Rule of Three or Five, or should just use a smart pointer instead.",
  },
{
    id: "q-cpp-iterator-001",
    subject: "CPP",
    concept: "Iterator Invalidation",
    difficulty: "hard",
    stem: "Code iterates a `std::vector<int> nums` with a range-based for loop, and inside the loop calls `nums.push_back(x)` whenever a condition holds. It crashes or behaves erratically partway through. What's the most likely cause?",
    options: [
      {
        text: "Range-based for loops always copy the entire container at the start, so `push_back` inside the loop has no effect on iteration at all and is perfectly safe",
        sub: "Implicit-copy claim",
        fix: "Range-based for loops iterate over the original container by reference by default, not a copy — that's exactly why mutating the container's storage during iteration is dangerous.",
      },
      {
        text: "The condition inside the loop is being re-evaluated incorrectly because `x` is uninitialized",
        sub: "Uninitialized variable claim",
        fix: "The question doesn't indicate `x` is uninitialized, and that wouldn't explain a crash specifically tied to calling `push_back` mid-iteration — the structural issue is iterator invalidation from reallocation.",
      },
      {
        text: "`push_back` may trigger reallocation to a new, larger buffer, invalidating the iterator the range-based for loop is using internally, so continuing the loop accesses freed memory",
        sub: "Reallocation invalidates active iterators",
        fix: "",
      },
      {
        text: "`std::vector` doesn't support modification while iterating under any circumstances, and the standard requires this to throw a compile error",
        sub: "Blanket modification ban claim",
        fix: "It's legal C++ to modify a vector during iteration in some controlled ways (e.g., erasing via the iterator returned by `erase`), and it never produces a compile error — the bug here is a runtime invalidation issue, undetected at compile time.",
      },
    ],
    correctIndex: 2,
    proTip: "Never grow or shrink a `vector` while holding iterators (including a range-based for loop's hidden ones) into it. If you need to add elements based on a scan, collect them in a separate container and append after the loop, or index by position carefully and re-check bounds.",
    lesson: "`std::vector` stores elements in one contiguous, dynamically-resized buffer. When `push_back` exceeds current capacity, it allocates a new, larger buffer, copies/moves elements over, and frees the old buffer — any iterators (including the ones a range-based for loop uses internally) that pointed into the old buffer are now dangling. This is iterator invalidation, and using an invalidated iterator is undefined behavior, which is why the crash is intermittent and condition-dependent rather than guaranteed.",
    remember: "push_back during a range-based for loop: reallocation can invalidate the loop's hidden iterator mid-iteration — never grow a vector while you're iterating over it.",
    interviewAnswer: "A range-based for loop is iterating using the vector's underlying iterators, and calling push_back inside that loop can trigger a reallocation once capacity is exceeded — the vector moves all its elements to a new, larger buffer and frees the old one. That leaves the loop's iterator pointing into freed memory, which is undefined behavior, so the crash shows up intermittently depending on when reallocation happens to trigger. The safe pattern is to collect the new elements in a separate container and append them after the loop finishes, rather than mutating the vector you're actively iterating.",
  },
{
    id: "q-cpp-smartptr-001",
    subject: "CPP",
    concept: "Smart Pointers",
    difficulty: "hard",
    stem: "Two classes hold `std::shared_ptr` to each other: `Parent` has a `shared_ptr<Child> child;` and `Child` has a `shared_ptr<Parent> parent;`. Even after all outside references go out of scope, neither object's destructor ever runs, and a memory profiler shows a leak. Why?",
    options: [
      {
        text: "`shared_ptr` has a hard limit on how many shared owners it can track, and once exceeded it silently stops decrementing",
        sub: "Refcount limit claim",
        fix: "There's no such hard limit; `shared_ptr` reference counts are ordinary integers with effectively unlimited range for practical purposes. The issue here is a cycle, not a count ceiling.",
      },
      {
        text: "The destructors never run because `Parent` and `Child` don't define explicit destructors of their own",
        sub: "Missing explicit destructor claim",
        fix: "Compiler-generated destructors are sufficient and would run fine — the actual blocker is that the shared_ptr reference counts never reach zero, not the absence of user-defined destructors.",
      },
      {
        text: "The two objects hold reference-counted pointers to each other, so each keeps the other's count above zero forever — a reference cycle that `shared_ptr`'s refcounting can't detect or break on its own",
        sub: "Reference cycle between shared_ptrs",
        fix: "",
      },
      {
        text: "`shared_ptr` only works correctly for one direction of ownership; using it for both `Parent → Child` and `Child → Parent` is undefined behavior",
        sub: "Bidirectional-ownership UB claim",
        fix: "Each `shared_ptr` works correctly and predictably on its own — the problem isn't undefined behavior, it's the perfectly well-defined but undesirable outcome of a reference cycle keeping both counts non-zero.",
      },
    ],
    correctIndex: 2,
    proTip: "Break ownership cycles by making one direction of the relationship a `std::weak_ptr` instead of `shared_ptr` — typically the 'back-pointer' (e.g., `Child::parent` as `weak_ptr<Parent>`) so it observes without contributing to the reference count.",
    lesson: "`std::shared_ptr` manages an object via reference counting: the object is destroyed when its count reaches zero. If two (or more) objects hold `shared_ptr`s to each other, they form a cycle where each one's count is kept alive by the other, so neither ever reaches zero — even though nothing outside the cycle references them. This is a classic shared_ptr memory leak. `std::weak_ptr` exists precisely to model non-owning references that don't participate in the count, breaking such cycles.",
    remember: "shared_ptr reference cycle: two objects holding shared_ptrs to each other keep each other's count above zero forever — break it with weak_ptr on the back-reference.",
    interviewAnswer: "shared_ptr destroys its managed object once its reference count hits zero, but here Parent and Child each hold a shared_ptr to the other, so each one's count is being kept alive by the other — neither can ever reach zero, even after everything outside the cycle lets go. This is the classic shared_ptr cycle leak, and it's well-defined behavior, not undefined — it's just an unwanted outcome of how reference counting works. The standard fix is to make one direction, usually the back-pointer like Child's reference to Parent, a weak_ptr instead, since it observes the object without contributing to its reference count.",
  },
{
    id: "q-cpp-binding-001",
    subject: "CPP",
    concept: "Virtual Dispatch",
    difficulty: "medium",
    stem: "`class Base { public: void greet() { std::cout << \"Base\"; } };` and `class Derived : public Base { public: void greet() { std::cout << \"Derived\"; } };`. Code does `Base* p = new Derived(); p->greet();` and it prints \"Base\", surprising the developer who expected \"Derived\". Why?",
    options: [
      {
        text: "`greet()` isn't declared `virtual` in `Base`, so the call is resolved at compile time using the pointer's static type (`Base*`), not the object's actual runtime type",
        sub: "Non-virtual method resolved statically",
        fix: "",
      },
      {
        text: "`new Derived()` constructs a `Base` object first and only later converts it to `Derived`, so at the time of the call it's still a `Base`",
        sub: "Two-stage construction claim",
        fix: "`new Derived()` constructs a complete `Derived` object in one step (running `Base`'s constructor as part of that), and the object's actual type is `Derived` the entire time — the printed result is about call resolution, not object identity.",
      },
      {
        text: "`std::cout` caches the first class name it sees and reuses it for subsequent calls through the same pointer type",
        sub: "Output caching claim",
        fix: "`std::cout` has no such caching behavior; each call independently prints whatever string literal the executed function contains. The executed function is `Base::greet()`, hence \"Base\".",
      },
      {
        text: "`Derived::greet()` doesn't actually override `Base::greet()` because the parameter lists differ",
        sub: "Signature mismatch claim",
        fix: "Both `greet()` methods have identical signatures (no parameters) — the issue isn't a signature mismatch, it's that neither is marked virtual, so there's no dynamic dispatch to begin with.",
      },
    ],
    correctIndex: 0,
    proTip: "If a base class method might ever need to be overridden with runtime polymorphism, mark it `virtual` (and mark the override `override` for compiler-checked correctness). Without `virtual`, calls through a base pointer/reference always use the base's version, regardless of the real object type.",
    lesson: "C++ uses static (compile-time) binding by default: a non-virtual method call is resolved based on the declared type of the pointer or reference used to call it, not the actual type of the object it points to. Only `virtual` methods get dynamic (runtime) binding via the vtable, where the actual object's overridden version is invoked. Here, since `greet()` isn't virtual, `p->greet()` resolves to `Base::greet()` purely because `p` is typed as `Base*`, regardless of it actually pointing at a `Derived`.",
    remember: "Virtual dispatch vs static binding: non-virtual calls resolve by the pointer's declared type at compile time, not the object's real type — mark it virtual to get the actual runtime override.",
    interviewAnswer: "Since greet() isn't declared virtual in Base, the call p->greet() is resolved at compile time using the static type of the pointer, which is Base*, completely ignoring that the actual object is a Derived. That's why it prints \"Base\" — there's no vtable lookup happening because nothing here is virtual. If you wanted \"Derived\" to print, you'd mark greet() virtual in Base, which switches the call to dynamic dispatch based on the object's real type at runtime.",
  },
{
    id: "q-cpp-template-001",
    subject: "CPP",
    concept: "Templates",
    difficulty: "medium",
    stem: "A library exposes `template <typename T> T max_of(T a, T b) { return a > b ? a : b; }` instead of writing separate `int max_of(int, int)` and `double max_of(double, double)` overloads. What's the key tradeoff of the template approach compared to writing separate overloads or using a base-class/virtual-function approach?",
    options: [
      {
        text: "A template function can only operate on a predefined set of types, similar to standard overloaded functions, requiring prior compilation for each specific type usage.",
        sub: "Limited type applicability claim",
        fix: "Templates are designed for type flexibility; they are instantiated for *any* type that satisfies their operational requirements, even types unknown at the template's definition time.",
      },
      {
        text: "Templates enforce that all type arguments for `T` must derive from a common base class, mirroring the inheritance needed for virtual function polymorphism.",
        sub: "Common base class requirement",
        fix: "Templates do not require inheritance; they operate on any type supporting the specified operations. This fundamental difference allows greater type flexibility than base-class polymorphism.",
      },
      {
        text: "Templates instantiate separate code for each type at compile time, leading to increased binary size and longer compilation, but eliminate all runtime dispatch overhead, unlike virtual dispatch's runtime indirection cost.",
        sub: "Monomorphization overhead vs runtime cost",
        fix: "",
      },
      {
        text: "Templates incur a performance penalty at runtime compared to virtual functions, as they necessitate dynamic type checks for `T` during each function invocation.",
        sub: "Dynamic type-checking performance claim",
        fix: "On the contrary, templates resolve types entirely at compile time, eliminating any runtime type checks or dispatch overhead. This direct call mechanism often makes them faster than virtual calls.",
      },
    ],
    correctIndex: 2,
    proTip: "Reach for templates (compile-time, 'static' polymorphism) when you want zero runtime overhead and the set of types is known at compile time; reach for virtual functions (runtime, 'dynamic' polymorphism) when you need to select behavior for types not known until runtime, e.g. through a plugin or container of mixed derived objects.",
    lesson: "Templates achieve generic code via monomorphization: the compiler generates a distinct, fully-typed function (or class) for every concrete type the template is instantiated with, so calls have no runtime dispatch cost — but this can increase binary size and compile time, and every type must be known at compile time. Virtual functions achieve generic code via dynamic dispatch through a vtable at runtime, which supports types decided at runtime (e.g. loaded from user input or a plugin) at the cost of a small indirect-call overhead and shared, non-duplicated code.",
    remember: "Templates vs virtual functions: templates monomorphize at compile time for zero runtime cost but bigger binaries, while virtual dispatch shares one function with a small runtime indirection cost for types unknown until runtime.",
    interviewAnswer: "Templates let the compiler generate a separate, fully-typed version of the function for each type it's instantiated with, so there's zero runtime dispatch overhead — the tradeoff is longer compile times and potential code bloat since every instantiation duplicates the function body. Virtual functions instead use a single shared function selected at runtime through a vtable, which costs a small indirect call but supports types that aren't even known until the program is running, like plugins or polymorphic containers. So the real choice is compile-time genericity with speed versus runtime flexibility with a tiny dispatch cost.",
  },
{
    id: "q-cpp-exception-001",
    subject: "CPP",
    concept: "Exception Safety",
    difficulty: "hard",
    stem: "A function does `Resource* r = new Resource(); doWork(r); delete r;` where `doWork` can throw. When it throws, `delete r` never executes and the resource leaks. A teammate proposes wrapping it in `try { doWork(r); } catch (...) { delete r; throw; }`. Is this a good fix?",
    options: [
      {
        text: "It works, but is brittle boilerplate. The robust, idiomatic solution is to use `std::unique_ptr` for `r`, leveraging RAII to automatically manage cleanup on all exit paths, including exceptions.",
        sub: "Manual try/catch vs. RAII idiom",
        fix: "",
      },
      {
        text: "It's unnecessary as modern C++ compilers, especially with C++17, automatically detect and optimize resource deallocation for `new`/`delete` in exception-prone code.",
        sub: "Compiler-based exception safety claim",
        fix: "C++ compilers do not make raw `new`/`delete` exception-safe. RAII (smart pointers) or manual `try-catch` are always required for guaranteed resource cleanup on exceptional paths.",
      },
      {
        text: "It's broken because `throw;` within a `catch` block re-throws a *new* exception, losing the original context and type information.",
        sub: "Rethrow semantic misunderstanding",
        fix: "A bare `throw;` inside a `catch` block correctly re-throws the *original* exception object, preserving its type, data, and stack context.",
      },
      {
        text: "It's broken because `catch (...)` cannot reliably intercept all C++ exceptions, especially those thrown by third-party libraries or standard containers.",
        sub: "Catch-all handler limitations",
        fix: "`catch (...)` is designed to catch *any* C++ exception, regardless of type, making it a universal handler for exceptions thrown by `doWork` or any other C++ code.",
      },
    ],
    correctIndex: 0,
    proTip: "Prefer RAII over manual try/catch-and-cleanup wherever possible: `std::unique_ptr<Resource> r(new Resource());` guarantees `delete` runs via the destructor on every exit path — normal return, early return, or exception — without writing a single catch block.",
    lesson: "Manual `try { ... } catch (...) { cleanup(); throw; }` is functionally correct but doesn't scale: every function that acquires a raw resource needs its own copy of this boilerplate, and it's easy to forget. RAII solves exception safety structurally: tie the resource to an object whose destructor performs cleanup, and the language guarantees that destructor runs during stack unwinding on any exit path — no explicit catch block required, and no detail to forget at each call site.",
    remember: "Manual try/catch-rethrow-cleanup works but doesn't scale — RAII via smart pointers guarantees cleanup on every exit path automatically, without repeating boilerplate at every call site.",
    interviewAnswer: "The try/catch wrapper does technically fix the leak — catch(...) catches anything doWork throws, and the bare throw correctly rethrows the original exception — but it's boilerplate you'd have to repeat at every single place a raw resource gets acquired, which doesn't scale and is easy to forget. The cleaner, idiomatic fix is to wrap the resource in a unique_ptr, so its destructor handles cleanup automatically whether the function returns normally, returns early, or an exception propagates through. That's the core idea behind RAII — tie resource lifetime to object lifetime and let the language guarantee cleanup, instead of hand-writing catch blocks everywhere.",
  },
{
    id: "q-py-mutdefault-001",
    subject: "PYTHON",
    concept: "Mutable Default Arguments",
    difficulty: "medium",
    stem: "`def add_item(item, bucket=[]): bucket.append(item); return bucket`. Calling `add_item(1)` returns `[1]`. Calling `add_item(2)` with no second argument, right after, returns `[1, 2]` instead of the expected `[2]`. Why?",
    options: [
      {
        text: "`append` returns a new list each time, but the function forgets to capture the return value, so it appends to a stale copy",
        sub: "append return-value claim",
        fix: "`list.append` mutates in place and returns `None`; its return value is irrelevant here. The function correctly mutates and returns `bucket` itself — the issue is which object `bucket` refers to across calls.",
      },
      {
        text: "Lists in Python are always passed by reference, so any list anywhere in the program shares the same underlying memory",
        sub: "Global list-sharing claim",
        fix: "Python lists aren't globally shared by virtue of being lists — two separate `[]` literals normally produce two independent objects. The bug here is specifically that the *default argument's* single list object is reused across calls, not a property of all lists.",
      },
      {
        text: "Python re-evaluates `bucket=[]` on every call but caches the previous call's result due to function memoization being on by default",
        sub: "Implicit memoization claim",
        fix: "Python functions aren't memoized by default — there's no caching layer here. The actual mechanism is simpler: the default value object is created exactly once, at function-definition time, period.",
      },
      {
        text: "The default value `[]` is created once, when the function is defined, and reused across all calls that don't pass `bucket` explicitly — so it silently accumulates state between calls",
        sub: "Default arguments are evaluated once at def time, not per call",
        fix: "",
      },
    ],
    correctIndex: 3,
    proTip: "Never use a mutable object (list, dict, set) as a default argument unless you specifically want shared state across calls. The standard idiom is `def add_item(item, bucket=None): if bucket is None: bucket = []`.",
    lesson: "In Python, default argument values are evaluated exactly once, at the time the `def` statement runs — not freshly on every call. For immutable defaults (numbers, strings, `None`) this is harmless since they can't be mutated in place. For mutable defaults like `[]` or `{}`, every call that omits the argument shares and mutates the *same* object, so changes persist across calls in a way that surprises most people coming from languages where default expressions re-evaluate per call.",
    remember: "Default args are evaluated once at def time, not per call — mutable defaults silently persist state across calls; use `bucket=None` and create the list inside.",
    interviewAnswer: "Default argument values in Python are evaluated exactly once, when the function is defined, not every time it's called. So if you use a mutable default like an empty list, every call that omits that argument shares the exact same list object, and mutations stick around between calls. The fix is the `None` sentinel pattern — default to `None` and create a fresh list inside the function body if it wasn't passed.",
  },
{
    id: "q-py-gil-001",
    subject: "PYTHON",
    concept: "GIL",
    difficulty: "hard",
    stem: "A developer parallelizes a CPU-heavy number-crunching function across 4 `threading.Thread` workers expecting a roughly 4x speedup on a multi-core machine, but measures almost no speedup at all. Switching the same workers to `multiprocessing.Process` gives the expected speedup. What explains the threading result?",
    options: [
      {
        text: "CPython's Global Interpreter Lock ensures that only one thread can execute Python bytecode at a time, causing CPU-bound threads to contend for this single lock and effectively preventing true parallel execution within one process. `multiprocessing` sidesteps this by running separate interpreter processes, each possessing its own GIL.",
        sub: "GIL serializes bytecode execution within a single process",
        fix: "",
      },
      {
        text: "Achieving linear speedup (e.g., 4x on 4 cores) is rarely observed in parallel computing due to intrinsic overheads of thread management, context switching, cache invalidation, and memory synchronization, which become dominant in CPU-bound scenarios.",
        sub: "Inherent Parallelism Overheads",
        fix: "Even on confirmed multi-core machines, CPU-bound Python threads within a single process are severely limited by the CPython GIL. This implementation detail restricts Python bytecode execution to effectively one core at a time, making factors like thread management overhead secondary to the GIL's impact on CPU-bound performance.",
      },
      {
        text: "Both `threading.Thread` and `multiprocessing.Process` rely on standard operating system concurrency primitives; speedup variations are primarily due to I/O contention, memory access patterns, or architectural cache misses, rather than fundamental CPython interpreter design differences.",
        sub: "Shared OS Concurrency Primitives",
        fix: "They are fundamentally distinct in CPython: `Process` instances launch independent OS processes, each with its own GIL and memory space, allowing true parallel CPU execution. `Thread` instances share a single process and its sole GIL, thus serializing Python bytecode execution for CPU-bound tasks.",
      },
      {
        text: "Python's `threading.Thread` implementation uses user-space scheduling or green threads rather than direct OS-level threads, thereby failing to leverage multi-core processors for any CPU-intensive operations due to the absence of true hardware concurrency.",
        sub: "User-Space Threading Model Limitation",
        fix: "CPython's `threading.Thread` *does* create real OS-level threads. While the GIL serializes Python bytecode execution for CPU-bound tasks, these threads effectively release the GIL during I/O operations, making them highly beneficial for I/O-bound parallelism. The limitation is specific to CPU-bound Python code within a single process.",
      },
    ],
    correctIndex: 0,
    proTip: "Use `threading` for I/O-bound concurrency (network calls, file I/O, waiting) where the GIL is released during the wait; use `multiprocessing` (or a C-extension that releases the GIL, like NumPy's vectorized ops) for CPU-bound parallelism that needs to use multiple cores.",
    lesson: "CPython's Global Interpreter Lock (GIL) ensures only one thread executes Python bytecode at any instant within a process, mainly to keep reference counting and the interpreter's internals thread-safe without per-object locks. This makes `threading` great for I/O-bound tasks (the GIL is released while waiting on I/O, letting other threads run) but ineffective for CPU-bound parallel speedup, since CPU-bound threads spend all their time wanting the GIL, not waiting. `multiprocessing` works around this by using multiple OS processes, each with its own interpreter and GIL, enabling genuine multi-core CPU parallelism at the cost of process-level overhead and no shared memory by default.",
    remember: "Threads vs processes for CPU-bound work: GIL serializes one process's bytecode execution, so threading helps I/O-bound waits but multiprocessing is what actually buys you multi-core CPU speedup.",
    interviewAnswer: "CPython has a Global Interpreter Lock that only lets one thread execute Python bytecode at a time within a process, so spinning up multiple threads for CPU-heavy work doesn't get you real parallelism — they're all fighting over the same lock. Threading still shines for I/O-bound work because the GIL gets released while a thread waits on a socket or disk. To actually use multiple cores for CPU-bound work, you need multiprocessing, since each process gets its own interpreter and its own GIL.",
  },
{
    id: "q-py-identity-001",
    subject: "PYTHON",
    concept: "is vs ==",
    difficulty: "medium",
    stem: "`a = [1, 2, 3]; b = [1, 2, 3]; print(a == b)` prints `True`, but `print(a is b)` prints `False`. A beginner expected both to be the same. What's the distinction being shown?",
    options: [
      {
        text: "Python's `==` operator for lists silently defers to an object identity check (`is`) when performing equality comparisons, leading to the observed difference.",
        sub: "Implicit Identity Delegation",
        fix: "Lists fully support `==` via `list.__eq__`, which performs element-wise value comparison. There is no implicit delegation or fallback to `is` because value comparison is well-defined and distinct from identity.",
      },
      {
        text: "This behavior indicates a peculiar interpreter optimization for list literals; for identical contents, `is` often returns `True` due to internal caching mechanisms.",
        sub: "Interpreter Optimization Claim",
        fix: "This is standard, intentional Python behavior for mutable types. Separate list literals always create distinct objects in memory, regardless of content, so `is` correctly indicates different identities. Caching for `is` typically applies to certain immutable types, not lists.",
      },
      {
        text: "`==` compares objects based on their content/value using `__eq__`, while `is` checks for object identity (if they are the exact same object in memory). Here, `a` and `b` are two distinct objects.",
        sub: "Value vs. Object Identity",
        fix: "",
      },
      {
        text: "`is` functions as a stricter form of `==`, evaluating not just content but also object type, memory layout, and mutability status to ensure absolute equivalence.",
        sub: "Absolute Equivalence Check",
        fix: "The `is` operator does not compare values or object attributes like type, memory layout, or mutability. It solely checks if two variables refer to the exact same object in memory (identity), which is fundamentally distinct from any form of value comparison.",
      },
    ],
    correctIndex: 2,
    proTip: "Use `==` to ask 'do these have the same value?' and `is` to ask 'are these literally the same object?' A common correct use of `is` is comparing against singletons like `None`: `if x is None:` rather than `if x == None:`.",
    lesson: "`==` invokes the `__eq__` method, which by default (and for built-ins like `list`) compares values/contents for equality. `is` checks object identity — whether two references point to the exact same object in memory, equivalent to comparing `id(a) == id(b)`. Two separately constructed objects with equal contents (like `[1,2,3]` and `[1,2,3]`) are `==` but not `is`, since each list literal creates a new, distinct object.",
    remember: "`==` asks \"same value?\" (calls `__eq__`), `is` asks \"same object?\" (compares memory identity) — use `is` only for singletons like `None`.",
    interviewAnswer: "`==` and `is` are answering completely different questions — `==` calls `__eq__` and compares the contents or value of two objects, while `is` compares identity, basically asking if two names point to the exact same object in memory. Two separate list literals with identical contents will be equal but not identical, since each literal creates its own object. That's why the convention is to use `is` specifically for things like `None` checks, where you genuinely care about object identity, not value equality.",
  },
{
    id: "q-py-generator-001",
    subject: "PYTHON",
    concept: "Generators",
    difficulty: "medium",
    stem: "Processing a 50GB log file, one version reads it with `lines = [line for line in f]` and another with `lines = (line for line in f)`, then both iterate over `lines` once to count error entries. The list version crashes with a memory error; the generator version runs fine. Why?",
    options: [
      {
        text: "Generators leverage optimized low-level I/O routines that bypass Python's standard file buffering, resulting in significantly faster throughput for sequential file access compared to list-based methods.",
        sub: "Optimized low-level I/O throughput",
        fix: "Both generator expressions and list comprehensions typically rely on the same underlying standard file iteration mechanisms (e.g., `f.__iter__()`). The performance difference observed is due to memory management, not distinct underlying I/O efficiencies.",
      },
      {
        text: "The list comprehension fully materializes all file lines into memory immediately, whereas the generator expression processes lines lazily, yielding each one only when requested, thus maintaining a minimal memory footprint.",
        sub: "Eager materialization vs. lazy evaluation",
        fix: "",
      },
      {
        text: "The generator expression employs a selective parsing mechanism that intelligently filters and discards non-error lines during initial file traversal, thereby processing only a subset of the data.",
        sub: "Selective data parsing and filtering",
        fix: "Generators process all data from the source, line by line, until the iteration is complete. They do not selectively skip or discard data; instead, they defer the processing and memory allocation for each item until it is explicitly requested.",
      },
      {
        text: "Python's list implementations inherently impose a hard upper bound on the number of elements they can store, irrespective of the system's available RAM, triggering an out-of-memory exception.",
        sub: "Intrinsic list element capacity limit",
        fix: "Python lists do not have an inherent, fixed upper limit on elements; memory exhaustion occurs when the total data size exceeds available RAM, not due to an arbitrary element count cap imposed by the language.",
      },
    ],
    correctIndex: 1,
    proTip: "Default to generator expressions (or generator functions with `yield`) over list comprehensions whenever you're going to iterate over the result just once and don't need random access or to know its length in advance — especially for large or unbounded data sources.",
    lesson: "A list comprehension builds and holds the entire resulting collection in memory before you can do anything with it. A generator expression (or a `yield`-based generator function) instead produces values lazily: each value is computed only when requested by the iteration, and previous values can be garbage-collected immediately afterward since nothing holds the whole sequence at once. This makes generators ideal for large or streaming data where the full collection would never fit in memory, at the cost of being single-pass (you can't re-iterate a generator without rebuilding it) and not supporting indexing or `len()`.",
    remember: "List comprehension materializes everything upfront; generator expression yields lazily one item at a time — for huge or streaming data, generators keep memory flat regardless of input size.",
    interviewAnswer: "A list comprehension has to build the entire result in memory before you can use any of it, so processing something like a 50GB file that way means trying to hold all of it at once, which blows up. A generator expression instead produces one value at a time, on demand, so only a small amount of data is in memory at any given moment as you iterate. The tradeoff is that a generator is single-pass and doesn't support indexing or `len()`, but for a one-time streaming pass over huge data, that tradeoff is exactly what you want.",
  },
{
    id: "q-py-copy-001",
    subject: "PYTHON",
    concept: "Shallow vs Deep Copy",
    difficulty: "hard",
    stem: "` original = [[1, 2], [3, 4]]; shallow = copy.copy(original); shallow[0].append(99)`. After this, `original` is now `[[1, 2, 99], [3, 4]]` too, even though only `shallow` was modified. What's happening?",
    options: [
      {
        text: "While `copy.copy` generates a new list object, it reuses the memory addresses of all contained objects, making it an effective alias that prevents true isolation between `original` and `shallow`.",
        sub: "Semantic alias via shared memory addresses",
        fix: "Though a shallow copy creates a distinct top-level list object (evident by `original is not shallow`), it copies references to nested objects, not their values. Thus, it's not a mere alias, but an independent structure with shared elements, which is the key distinction.",
      },
      {
        text: "List `append` operations propagate mutations across all lists that contain objects with identical current values, as Python's internal optimization links equivalent mutable instances.",
        sub: "Value-based propagation of list mutations",
        fix: "Python's `append` method modifies only the specific list object it is invoked upon. Changes do not propagate based on value equality across different list objects; they only affect other variables referencing the *same* object in memory.",
      },
      {
        text: "`copy.copy` creates a new top-level list, but populates it with references to the *original* nested mutable objects. Thus, changes to these shared inner objects are reflected in both lists.",
        sub: "Shallow copy shares references to nested mutable objects",
        fix: "",
      },
      {
        text: "This behavior indicates a design flaw in `copy.copy`, as standard container duplication routines are expected to provide full recursive independence for all contained mutable structures.",
        sub: "Expectation of recursive independence in duplication",
        fix: "The `copy` module is designed with `copy.copy` for shallow duplication and `copy.deepcopy` for recursive duplication. This distinction is intentional and foundational, not a bug; it allows developers to choose the desired level of isolation.",
      },
    ],
    correctIndex: 2,
    proTip: "Use `copy.deepcopy` (or rebuild nested structures explicitly) whenever your data contains nested mutable objects and you need full independence between the original and the copy. For flat structures of immutables, a shallow copy is sufficient and cheaper.",
    lesson: "`copy.copy` (a shallow copy) creates a new container object but populates it with references to the *same* elements as the original — for a list of immutables (ints, strings) this looks indistinguishable from a deep copy because immutables can't be mutated in place anyway. But for a list of lists (or any nested mutable structure), the inner lists are shared objects: mutating an inner list via the copy is visible via the original too, since both outer lists point at identical inner list objects. `copy.deepcopy` instead recursively copies every nested level, producing a fully independent structure.",
    remember: "Shallow copy duplicates only the outer container — nested mutables stay shared; deep copy recursively clones everything down to the leaves.",
    interviewAnswer: "`copy.copy` gives you a new outer list, but it doesn't recurse into nested structures — it just copies references to the same inner objects. So if you have a list of lists and shallow-copy it, mutating an inner list through the copy is visible through the original too, because both outer lists are pointing at the identical inner list object. If you need full independence at every level, you reach for `copy.deepcopy`, which recursively copies nested mutable structures instead of just the top layer.",
  },
{
    id: "q-py-decorator-001",
    subject: "PYTHON",
    concept: "Decorators",
    difficulty: "medium",
    stem: "A logging decorator is written as:\n```\ndef log_calls(func):\n    def wrapper(*args, **kwargs):\n        print(f\"calling {func.__name__}\")\n        return func(*args, **kwargs)\n    return wrapper\n```\nAfter applying `@log_calls` to a function `greet`, code that inspects `greet.__name__` and `greet.__doc__` for documentation tooling gets `'wrapper'` and `None` instead of `greet`'s real name and docstring. What's the cause and fix?",
    options: [
      {
        text: "The `print` statement, being a side effect operation, introduces an asynchronous metadata update conflict, preventing the `__name__` and `__doc__` attributes from resolving correctly at runtime.",
        sub: "Side-effect-induced metadata conflict",
        fix: "The `print` statement simply executes code at call time; it does not affect the function object's `__name__` or `__doc__` attributes, which are determined during the function's definition.",
      },
      {
        text: "Python's decorator mechanism inherently ensures `__name__` and `__doc__` attributes are always transparently propagated from the original function, making this issue anomalous or impossible.",
        sub: "Inherent metadata propagation claim",
        fix: "Decorators do not automatically preserve introspection attributes. A custom decorator returning a new function object replaces the original's `__name__`/`__doc__` with the wrapper's own unless explicitly handled.",
      },
      {
        text: "The use of `*args, **kwargs` within the wrapper function's signature dynamically alters the function's internal metadata representation, thereby nullifying the original `__name__` and `__doc__` attributes.",
        sub: "Dynamic metadata alteration by variadic arguments",
        fix: "The `*args, **kwargs` syntax handles arbitrary argument passing, but it has no direct influence on a function's `__name__` or `__doc__` attributes, which are static at definition.",
      },
      {
        text: "The decorator replaces the original function with its `wrapper` closure, inheriting the `wrapper`'s metadata. Use `functools.wraps(func)` on `wrapper` to correctly propagate the original function's `__name__` and `__doc__`.",
        sub: "Wrapper function overwrites original metadata",
        fix: "",
      },
    ],
    correctIndex: 3,
    proTip: "Always decorate your wrapper function with `@functools.wraps(func)` inside a custom decorator — it's a one-line fix that preserves `__name__`, `__doc__`, `__module__`, and other metadata, which matters for debugging, documentation generators, and anything that introspects functions.",
    lesson: "`@log_calls` applied to `greet` is sugar for `greet = log_calls(greet)`, which rebinds the name `greet` to the `wrapper` function object returned by the decorator — a genuinely different function object with its own `__name__` ('wrapper') and `__doc__` (`None`, since `wrapper` has no docstring). `functools.wraps(func)`, applied as a decorator on `wrapper` itself, copies over `func`'s `__name__`, `__doc__`, `__module__`, and other metadata so introspection tools see the original function's identity rather than the wrapper's.",
    remember: "A decorator that returns `wrapper` replaces the original function's identity entirely — slap `@functools.wraps(func)` on the wrapper to restore `__name__`/`__doc__`.",
    interviewAnswer: "When you apply a decorator, you're really just rebinding the name to whatever function the decorator returns, which in a hand-written decorator is usually the inner `wrapper` function — so introspection attributes like `__name__` and `__doc__` now reflect `wrapper`, not the original function. That breaks anything relying on those attributes, like documentation tools or debuggers. The standard fix is to decorate the wrapper itself with `functools.wraps(func)`, which copies over the original function's metadata so it looks like the original from the outside.",
  },
{
    id: "q-py-scope-001",
    subject: "PYTHON",
    concept: "Closures and Late Binding",
    difficulty: "hard",
    stem: "```\nfuncs = []\nfor i in range(3):\n    funcs.append(lambda: i)\nprint([f() for f in funcs])\n```\nA developer expects `[0, 1, 2]` but gets `[2, 2, 2]`. Why?",
    options: [
      {
        text: "The `range` object is an iterator that gets fully consumed during the loop's execution, so when the lambdas are called, it only yields its last element (2) to update `i` each time.",
        sub: "Iterator exhaustion behavior",
        fix: "The lambdas do not re-evaluate or consume the `range` object directly. They only refer to the variable `i`, which is updated by the loop, not by the `range` iterator at call time.",
      },
      {
        text: "Each lambda function captures the variable `i` by reference, rather than its value at the time of definition. When the lambdas are later invoked, the loop has completed, and `i` uniformly holds its final value, 2.",
        sub: "Late binding of loop variable",
        fix: "",
      },
      {
        text: "List comprehensions have an optimization that binds loop variables to their final state when creating nested functions, specific to their construction mechanism.",
        sub: "Comprehension binding optimization",
        fix: "The behavior is consistent whether functions are created in a list comprehension or a standard loop. The issue stems from Python's closure mechanism, not from a specific optimization or quirk of list comprehensions.",
      },
      {
        text: "Python's Global Interpreter Lock (GIL) serializes lambda function creation, leading to a race condition where `i` is finalized to 2 before the first lambda can capture its initial value.",
        sub: "GIL-induced race condition",
        fix: "The Global Interpreter Lock (GIL) manages thread execution but does not introduce race conditions or affect variable binding in this synchronous loop context. Lambda creation and variable capture are sequential and deterministic.",
      },
    ],
    correctIndex: 1,
    proTip: "To capture the loop variable's *current* value per iteration, give each lambda/function its own parameter with that value as a default: `lambda i=i: i` — default argument values *are* evaluated immediately at definition time, which is exactly the difference that fixes this.",
    lesson: "Python closures capture variables, not values — a closure remembers a reference to the enclosing scope's variable, and looks it up fresh every time the closure is called, not at the moment it was created. In a loop, `i` is one single variable that gets reassigned each iteration; all three lambdas close over that same variable, so when they're eventually called (after the loop has finished and `i` is 2), they all see the loop's final value. This is sometimes called 'late binding' in closures, and it's a frequent surprise for anyone expecting value-capture-at-creation semantics like some other languages.",
    remember: "Closures capture variables by reference, not by value at creation time — late binding means all lambdas in a loop see the loop variable's final value, not its value at the time each lambda was made.",
    interviewAnswer: "Closures in Python capture the variable itself, not a snapshot of its value at the moment the function was created — so when a lambda inside a loop body references the loop variable, it's actually holding a reference to that one shared variable, and it looks up its current value only when called. By the time you call all three lambdas after the loop ends, that variable has already settled at its final value, so they all return the same thing. The standard fix is to force early binding by giving each lambda a default argument, like `lambda i=i: i`, since default values are evaluated immediately when the function is defined.",
  },
{
    id: "q-py-args-001",
    subject: "PYTHON",
    concept: "*args and **kwargs",
    difficulty: "easy",
    stem: "A function is defined as `def configure(name, *flags, **options): ...` and called as `configure(\"server\", \"verbose\", \"debug\", timeout=30, retries=3)`. Inside the function, what do `flags` and `options` contain?",
    options: [
      {
        text: "`flags` is the tuple `(\"verbose\", \"debug\")` — the extra positional arguments — and `options` is the dict `{\"timeout\": 30, \"retries\": 3}` — the keyword arguments",
        sub: "*args collects extra positionals into a tuple; **kwargs collects keyword args into a dict",
        fix: "",
      },
      {
        text: "`flags` and `options` both contain every argument passed, including `\"server\"`, since `*` and `**` mean 'capture everything'",
        sub: "Capture-everything claim",
        fix: "`name` is bound to `\"server\"` as the regular positional parameter it matches first; `*flags` and `**options` only soak up what's left over after the explicitly named parameters are satisfied, not the explicitly matched ones too.",
      },
      {
        text: "`flags` is `[\"verbose\", \"debug\"]` as a list, and `options` is also a list of tuples `[(\"timeout\", 30), (\"retries\", 3)]`",
        sub: "Wrong container-type claim",
        fix: "`*args` always collects into a `tuple`, not a `list`, and `**kwargs` always collects into a `dict`, not a list of tuples — the contents described are right in spirit but the container types are wrong.",
      },
      {
        text: "This call raises a `TypeError` because you can't mix extra positional arguments with keyword arguments in the same call",
        sub: "Mixing-not-allowed claim",
        fix: "Mixing extra positional arguments (captured by `*args`) and keyword arguments (captured by `**kwargs`) in a single call is exactly what this parameter pattern is designed to support, and it's valid, common Python.",
      },
    ],
    correctIndex: 0,
    proTip: "`*args`/`**kwargs` are most useful for wrapper/decorator functions and APIs that need to forward arbitrary arguments to another function (`return inner(*args, **kwargs)`), without needing to know or restate that function's exact parameter list.",
    lesson: "In a function signature, a parameter prefixed with `*` (conventionally named `args`) collects any extra positional arguments beyond the explicitly named ones into a tuple. A parameter prefixed with `**` (conventionally `kwargs`) collects any keyword arguments that don't match a named parameter into a dict. Explicitly named parameters (like `name` here) are matched first and don't end up duplicated inside `*args`/`**kwargs`.",
    remember: "`*args` collects extra positionals into a tuple; `**kwargs` collects extra keywords into a dict — named parameters get matched first and never duplicate into either.",
    interviewAnswer: "When you define a function with `*args` and `**kwargs` after some named parameters, Python first matches the named parameters against whatever was passed, and only the leftovers get swept up — extra positional arguments go into the `args` tuple, and extra keyword arguments go into the `kwargs` dict. So a named parameter like `name` never shows up duplicated inside either of those. This pattern is especially useful for decorators or wrapper functions that need to transparently forward whatever arguments they receive to another function.",
  },
{
    id: "q-py-context-001",
    subject: "PYTHON",
    concept: "Context Managers",
    difficulty: "medium",
    stem: "Code does `f = open(\"data.txt\"); data = f.read(); process(data); f.close()`. If `process(data)` raises an exception, `f.close()` never runs and the file handle leaks until the process exits. A teammate suggests `with open(\"data.txt\") as f: data = f.read(); process(data)` instead. Why does this fix the leak?",
    options: [
      {
        text: "The `with` statement ensures the `__exit__` method of the context manager (e.g., file closing) is invoked upon block completion, irrespective of whether the block exited normally or due to an exception propagating, much like a `finally` block.",
        sub: "Guaranteed Cleanup via `__exit__`",
        fix: "",
      },
      {
        text: "The `with` statement implements an implicit `try-except` mechanism, automatically handling and suppressing exceptions raised within its scope. This prevents process termination and ensures resources are always cleanly disengaged before any error propagation.",
        sub: "Implicit Exception Handling",
        fix: "By default, a `with` block does not swallow exceptions — they still propagate to the caller after `__exit__` runs (unless `__exit__` explicitly returns a truthy value to suppress them, which file objects don't do). The fix is about guaranteeing cleanup, not hiding the error.",
      },
      {
        text: "When a file is opened with `with`, it's wrapped in a specialized 'managed resource' object that intrinsically tracks its lifecycle. This object maintains a persistent reference to the file handle, ensuring its closure through finalization routines at process or scope termination.",
        sub: "Managed Resource Object",
        fix: "`with open(...)` and `open(...)` use the exact same file object and read mechanics; `with` changes only how reliably the file gets closed, not how it's read.",
      },
      {
        text: "Should an exception occur, the `with` block initiates an automatic rollback procedure, effectively restarting the protected operation in a controlled environment. This ensures all allocated resources are re-evaluated and properly released during the recovery phase.",
        sub: "Transactional Rollback Mechanism",
        fix: "A `with` block doesn't retry or re-execute anything on exception — it runs `__exit__` exactly once as the block is exited (by any means) and then lets the exception continue propagating, with no looping behavior.",
      },
    ],
    correctIndex: 0,
    proTip: "Use `with` for any resource that needs guaranteed cleanup — files, locks, network connections, database transactions — anywhere you'd otherwise need a manual `try/finally`. It's Python's structural answer to the same problem C++'s RAII solves.",
    lesson: "A context manager defines `__enter__` (run when entering the `with` block) and `__exit__` (run when leaving it, for *any* reason — normal completion, `return`, `break`, or an exception unwinding through it). File objects implement this protocol so `with open(...) as f:` guarantees `f.close()` runs on every exit path, eliminating the class of bug where an exception causes manual cleanup code to be skipped. It's conceptually the same guarantee that C++ RAII destructors provide, just expressed through an explicit protocol instead of object lifetime.",
    remember: "`with` guarantees `__exit__` runs on any exit path — normal, return, break, or exception — same safety net as `try/finally`, without writing it by hand.",
    interviewAnswer: "A `with` block relies on the context manager protocol — `__enter__` runs when you enter the block, and critically `__exit__` is guaranteed to run when you leave it, no matter how you leave, whether that's falling off the end normally or an exception blowing through. That's exactly what closes the file reliably, even if `process(data)` raises partway through, which a plain `open()`/`close()` pair can't guarantee. It's basically Python's structured answer to the same problem `try/finally` solves manually, or what RAII solves in C++ through object lifetime.",
  },
{
    id: "q-py-mro-001",
    subject: "PYTHON",
    concept: "Method Resolution Order",
    difficulty: "hard",
    stem: "`class A: def greet(self): return \"A\"`, `class B(A): def greet(self): return \"B\"`, `class C(A): def greet(self): return \"C\"`, `class D(B, C): pass`. Calling `D().greet()` returns `\"B\"`, not `\"A\"` and not some ambiguous error, even though `D` inherits from both `B` and `C`, which both inherit from `A`. What determines this?",
    options: [
      {
        text: "Python computes a deterministic Method Resolution Order (MRO) for `D` using a standard algorithm. It resolves `greet` by traversing this MRO, finding the first implementation in `B`.",
        sub: "Deterministic MRO guides method resolution",
        fix: "",
      },
      {
        text: "This scenario leads to a `TypeError` during class definition, as Python prohibits diamond-shaped multiple inheritance patterns.",
        sub: "Diamond inheritance type error",
        fix: "Python fully supports diamond-shaped multiple inheritance and resolves method calls deterministically using its MRO algorithm. It's a key feature, not a source of `TypeError`.",
      },
      {
        text: "Python prioritizes the parent class that was defined earlier in the script, irrespective of its explicit order in `class D(B, C)`.",
        sub: "Class definition order priority",
        fix: "Method resolution strictly follows the order of base classes declared in the class definition (e.g., `D(B, C)` implies `B` before `C`), not the order of their class definitions in the source file.",
      },
      {
        text: "The method resolution is non-deterministic; Python randomly selects between `B` and `C` each call, and `\"B\"` was just a coincidence.",
        sub: "Non-deterministic method selection",
        fix: "The Method Resolution Order is computed deterministically once a class is defined, ensuring consistent method lookup. The result `\"B\"` is stable, not a random outcome.",
      },
    ],
    correctIndex: 0,
    proTip: "You can always check a class's exact resolution order yourself with `D.__mro__` or `D.mro()` rather than reasoning about it from the class hierarchy diagram — it removes any ambiguity about which parent 'wins' for diamond inheritance.",
    lesson: "When a class has multiple base classes, Python doesn't search them in some ad hoc or depth-first way that could revisit a shared ancestor multiple times or hit ambiguity — it computes one linear Method Resolution Order via the C3 linearization algorithm, respecting both each base's own MRO and the order bases were listed in the subclass. For `class D(B, C)` with both deriving from `A`, the MRO is `[D, B, C, A, object]`: attribute/method lookup walks this list and returns the first match, so `B`'s `greet` wins over `C`'s and `A`'s simply because `B` appears first in `D`'s declared base list.",
    remember: "Diamond inheritance resolves via C3 linearization into one deterministic MRO list — lookup just walks it in order; declaration order of bases in the subclass decides who wins.",
    interviewAnswer: "When a class inherits from multiple parents that share a common ancestor, Python doesn't pick a winner arbitrarily — it computes a single, deterministic Method Resolution Order using the C3 linearization algorithm, and method lookup just walks that list and stops at the first match. For `class D(B, C)` where both B and C inherit from A, the MRO ends up `[D, B, C, A, object]`, so `B`'s implementation wins simply because `B` was listed before `C` in the subclass definition. You can always check this directly with `D.__mro__` instead of reasoning it out by hand.",
  },
{
    id: "q-py-classmethod-001",
    subject: "PYTHON",
    concept: "classmethod vs staticmethod",
    difficulty: "medium",
    stem: "A `User` class needs a `from_csv_row(row)` constructor-style helper that builds a `User` from a CSV row, and must also work correctly for any subclass like `AdminUser` (i.e., `AdminUser.from_csv_row(row)` should return an `AdminUser`, not a `User`). Should this be a `@staticmethod` or a `@classmethod`?",
    options: [
      {
        text: "Either works for this scenario, as both decorators permit direct class-level method invocation, making their functional behavior identical when called like `User.from_csv_row(row)`.",
        sub: "Argues functional equivalence for class-level calls.",
        fix: "While syntactically similar, a `@staticmethod` would lack access to the calling class (`cls`). It would be forced to hardcode `User(...)`, thereby failing the requirement to return an `AdminUser` when called via `AdminUser.from_csv_row(...)`.",
      },
      {
        text: "`@classmethod`, because it receives the class object (`cls`) as its first argument, allowing it to dynamically instantiate the correct subclass (e.g., `AdminUser`) using `return cls(...)`.",
        sub: "Classmethod passes `cls` for dynamic subclass instantiation.",
        fix: "",
      },
      {
        text: "Neither; in Python, the `__init__` method is the designated constructor, and alternative object creation patterns should primarily leverage its explicit override mechanism.",
        sub: "Claims `__init__` is the sole constructor for object creation.",
        fix: "Alternative constructors (the 'factory method' pattern), often implemented as classmethods, are idiomatic Python and a standard approach for flexible object creation without modifying `__init__` directly.",
      },
      {
        text: "`@staticmethod`, as it operates independently of instance-specific data or class state, serving as a plain function within the class namespace that doesn't require `self` or `cls`.",
        sub: "Highlights `staticmethod`'s independence from class/instance state.",
        fix: "`@staticmethod` provides neither `self` nor `cls`, functioning solely as a namespaced utility function. Without `cls`, it cannot determine the calling subclass to instantiate, making it unsuitable for polymorphic constructor-style helpers.",
      },
    ],
    correctIndex: 1,
    proTip: "A good rule of thumb: use `@staticmethod` for a utility function that's logically grouped with the class but doesn't need `self` or `cls` at all; use `@classmethod` when the method needs to know or construct *the class itself*, especially for alternate constructors that should respect subclassing.",
    lesson: "`@staticmethod` defines a plain function attached to a class's namespace — it receives no implicit first argument, not `self` (instance) nor `cls` (class). `@classmethod` receives `cls`, the class it was actually called through, as its first argument; when called via a subclass, `cls` is that subclass, not the class where the method was defined. This makes `@classmethod` the right tool for factory/alternate-constructor methods, since `cls(...)` inside the method constructs whichever class was used to call it, correctly supporting subclasses without any extra logic.",
    remember: "`@staticmethod` gets neither `self` nor `cls`; `@classmethod` gets `cls` — use classmethod for alternate constructors so `cls(...)` builds whichever subclass it was actually called on.",
    interviewAnswer: "A `staticmethod` is just a plain function namespaced under the class — it doesn't receive `self` or `cls`, so it has no way of knowing what class it was even called through. A `classmethod`, on the other hand, receives `cls` as its first argument, and when called via a subclass, `cls` is that subclass, not the original defining class. That makes classmethod the right choice for factory-style constructors, since calling `cls(...)` inside the method naturally builds whatever subclass it was invoked on, like `AdminUser.from_csv_row(...)` correctly returning an `AdminUser`.",
  },
{
    id: "q-py-gc-001",
    subject: "PYTHON",
    concept: "Garbage Collection",
    difficulty: "hard",
    stem: "Two objects, `a` and `b`, reference each other (`a.partner = b; b.partner = a`), and then all other references to them go out of scope. A developer worried about C++-style manual memory management asks whether this leaks memory in Python. What actually happens?",
    options: [
      {
        text: "This always leaks in Python, just like the equivalent `shared_ptr` cycle in C++, because Python's memory management is fundamentally the same reference-counting-only scheme",
        sub: "Same-as-C++-shared_ptr claim",
        fix: "Unlike a raw `shared_ptr` cycle, CPython doesn't rely on reference counting alone — it has a dedicated cyclic garbage collector (the `gc` module) precisely to find and reclaim groups of objects whose reference counts never reach zero solely because they reference each other.",
      },
      {
        text: "The cycle is only cleaned up if the developer explicitly calls `del a; del b`, since Python never reclaims memory automatically",
        sub: "Manual-del-required claim",
        fix: "Python's reference counting reclaims most garbage fully automatically the instant a count hits zero, no `del` required. For cycles specifically, the generational `gc` collector runs automatically (periodically, based on allocation thresholds) — manual `del` isn't required either, though `gc.collect()` can force an immediate pass.",
      },
      {
        text: "Python avoids the problem entirely because objects are not allowed to reference each other circularly — this code would raise an error",
        sub: "Disallowed-cycle claim",
        fix: "Circular references between Python objects are completely legal and common (e.g., parent/child object graphs, doubly linked lists) — they don't raise any error at creation or assignment time.",
      },
      {
        text: "CPython's reference counting alone wouldn't collect them (each keeps the other's count above zero), but CPython also runs a separate generational cyclic garbage collector that specifically detects and frees reference cycles like this one",
        sub: "Reference counting handles non-cyclic garbage; a separate cycle detector handles cycles",
        fix: "",
      },
    ],
    correctIndex: 3,
    proTip: "Reference cycles in Python are usually not a leak risk thanks to the cyclic GC, but if you're managing non-memory resources (file handles, sockets) inside cyclically-referenced objects, don't rely on `__del__` timing — use explicit `close()`/context managers, since cyclic collection timing is less predictable than refcounting-based collection.",
    lesson: "CPython primarily reclaims memory via reference counting: every object tracks how many references point to it, and is freed the instant that count hits zero. This alone can't collect reference cycles, since each object in the cycle keeps another's count above zero indefinitely. CPython solves this with a separate, generational cycle-detecting garbage collector (exposed via the `gc` module) that periodically scans for groups of objects unreachable from outside the group except through each other, and frees them as a batch — meaning ordinary reference cycles, unlike raw-pointer or `shared_ptr` cycles in lower-level languages, generally don't leak in long-running Python programs.",
    remember: "Refcounting alone can't collect cycles (each object's count stays above zero) — CPython's generational cyclic GC is the separate mechanism that finds and frees those cycles automatically.",
    interviewAnswer: "CPython's primary memory management is reference counting, which frees an object the instant its count drops to zero, but two objects referencing each other will keep each other's count above zero forever, even when nothing else points to them. To handle that, CPython has a separate generational garbage collector that periodically scans for these unreachable cycles and frees them as a batch, so this kind of cycle doesn't actually leak the way it would with raw pointers or something like a `shared_ptr` cycle in C++. The one caveat is that if those cyclic objects hold non-memory resources like open file handles, you shouldn't rely on `__del__` timing — better to use explicit `close()` or a context manager.",
  },
{
    id: "q-oa-series-001",
    subject: "OA",
    concept: "Number Series",
    difficulty: "easy",
    stem: "Find the missing number in the series: 3, 7, 15, 31, 63, ?",
    options: [
      {
        text: "95",
        sub: "Adds 32 after 63",
        fix: "The differences are 4, 8, 16, 32, so the next difference should be 64, not another nearby jump like 32.",
      },
      {
        text: "128",
        sub: "Powers of two pattern",
        fix: "The terms are one less than powers of two after the first step, so 127 fits; 128 would be the power itself.",
      },
      { text: "127", sub: "Double the previous number and add 1", fix: "" },
      {
        text: "126",
        sub: "Double the previous number",
        fix: "Every step is double plus one: 3 to 7, 7 to 15, and so on. Plain doubling misses the added 1.",
      },
    ],
    correctIndex: 2,
    proTip: "For OA series, check differences and multiplication patterns before doing heavy arithmetic. Here both point to x2 + 1.",
    lesson: "The pattern is 3 x 2 + 1 = 7, 7 x 2 + 1 = 15, 15 x 2 + 1 = 31, and 31 x 2 + 1 = 63. Applying the same rule gives 63 x 2 + 1 = 127. Series questions often hide a simple repeated operation behind fast-growing numbers.",
    remember: "When a number series grows fast, test \"double plus a constant\" before chasing differences — check if each term equals 2x the previous term plus a fixed offset.",
    interviewAnswer: "I looked at consecutive terms and noticed each one was almost double the one before, so I tested the rule term times two plus one — 3 to 7, 7 to 15, 15 to 31, 63 — and it held every time. Applying that same rule to 63 gives 63 times 2 plus 1, which is 127, so that's the missing number.",
  },
{
    id: "q-oa-series-002",
    subject: "OA",
    concept: "Letter Series",
    difficulty: "medium",
    stem: "Which letters complete the series: AZ, BY, CX, DW, ?",
    options: [
      {
        text: "EU",
        sub: "Second letter skips one extra step",
        fix: "The second letters go Z, Y, X, W, so the next is V. There is no extra skip.",
      },
      {
        text: "EV",
        sub: "First letter moves forward, second moves backward",
        fix: "",
      },
      {
        text: "FV",
        sub: "First letter skips E",
        fix: "The first letters move one step at a time: A, B, C, D, then E.",
      },
      {
        text: "EW",
        sub: "Second letter stays fixed",
        fix: "W was already used in the fourth term. The second position is descending one letter each time.",
      },
    ],
    correctIndex: 1,
    proTip: "Split letter pairs into independent tracks. One side can move forward while the other moves backward.",
    lesson: "Treat each position separately. The first letters are A, B, C, D, so the next first letter is E. The second letters are Z, Y, X, W, so the next second letter is V. Combining them gives EV.",
    remember: "For letter-pair series, split each pair into two independent alphabet tracks and find the step for each position separately, since one side can move forward while the other moves backward.",
    interviewAnswer: "I separated the pairs into a first-letter track and a second-letter track instead of treating each pair as one unit. The first letters go A, B, C, D so the next is E, and the second letters go Z, Y, X, W so the next is V, which gives EV as the answer.",
  },
{
    id: "q-oa-arrange-001",
    subject: "OA",
    concept: "Seating Arrangement",
    difficulty: "medium",
    stem: "Five people A, B, C, D, and E sit in a row facing north. B is immediately to the right of A. C is at the right end. D is at the left end. E sits between B and C. Who sits in the middle?",
    options: [
      { text: "B", sub: "A-B pair placed after the left end", fix: "" },
      {
        text: "E",
        sub: "E between B and C",
        fix: "E is between B and C, but between does not mean exactly middle of the whole row. In D A B E C, E is fourth.",
      },
      {
        text: "C",
        sub: "C is fixed at the right end",
        fix: "C is fixed at the right end, so it cannot be the middle person.",
      },
      {
        text: "A",
        sub: "A sits before B",
        fix: "A must be immediately left of B, but D already takes the left end. That makes A second and B third.",
      },
    ],
    correctIndex: 0,
    proTip: "Anchor fixed positions first, then place immediate pairs. Do not let a clue like 'between' override the row positions you already fixed.",
    lesson: "D is fixed at the left end and C is fixed at the right end. Since B is immediately to the right of A, the A-B pair must occupy positions 2 and 3. E must sit between B and C, so E goes in position 4. The row is D A B E C, making B the middle person.",
    remember: "In seating puzzles, place the fixed-end clues first, then immediate-neighbor pairs, and only apply vaguer clues like \"between\" last so they don't override positions you already locked in.",
    interviewAnswer: "I started with the two anchors — D at the left end and C at the right end — since those are fixed no matter what. The \"B immediately right of A\" clue forced the A-B pair into positions two and three, which left position four for E since E had to sit between B and C, giving the order D A B E C, so B is in the middle.",
  },
{
    id: "q-oa-syllogism-001",
    subject: "OA",
    concept: "Syllogisms",
    difficulty: "medium",
    stem: "Statements: All coders are learners. Some learners are artists. Conclusions: I. Some coders are artists. II. Some learners are coders. Which conclusion follows?",
    options: [
      {
        text: "Only I follows",
        sub: "Assumes overlap between coders and artists",
        fix: "Some learners are artists does not guarantee that those learners are coders. The artist group may be separate from the coder group.",
      },
      {
        text: "Only II follows",
        sub: "All coders being learners implies some learners are coders",
        fix: "",
      },
      {
        text: "Neither follows",
        sub: "Rejects the reverse relation completely",
        fix: "If all coders are learners, then at least the coders are learners. In standard syllogism assumptions where the class exists, some learners are coders follows.",
      },
      {
        text: "Both I and II follow",
        sub: "Treats all groups as overlapping",
        fix: "Conclusion I is not forced. The statements allow coders and artists to be separate subgroups inside learners.",
      },
    ],
    correctIndex: 1,
    proTip: "In syllogisms, only accept what must be true in every valid diagram. Possible overlap is not the same as guaranteed overlap.",
    lesson: "All coders are inside learners. Some learners are artists, but that artist subset may or may not overlap with coders, so conclusion I does not necessarily follow. Since coders are learners, some learners are coders follows under the usual non-empty class assumption.",
    remember: "In syllogisms, only accept a conclusion if it's true in every possible diagram of the statements — \"some X are Y\" never forces \"some X are Z\" through an unrelated overlapping group.",
    interviewAnswer: "Conclusion I assumes the artists who are learners must overlap with the coders, but the statements never guarantee that, so it doesn't follow. Conclusion II does follow because every coder is already a learner, so under the standard assumption that the coder group isn't empty, that automatically means some learners are coders.",
  },
{
    id: "q-oa-coding-001",
    subject: "OA",
    concept: "Coding-Decoding",
    difficulty: "easy",
    stem: "In a code language, CAT is written as DBU. How will DOG be written using the same rule?",
    options: [
      {
        text: "EOG",
        sub: "Only the first letter changes",
        fix: "All letters changed in CAT to DBU. D, O, and G must each move forward.",
      },
      {
        text: "C N F",
        sub: "Each letter moves one step backward",
        fix: "CAT to DBU moves C to D, A to B, and T to U, so the rule is forward, not backward.",
      },
      {
        text: "FQI",
        sub: "Each letter moves two steps forward",
        fix: "CAT to DBU is a one-step shift, not a two-step shift.",
      },
      { text: "EPH", sub: "Each letter moves one step forward", fix: "" },
    ],
    correctIndex: 3,
    proTip: "For coding-decoding, write the alphabet shifts beside each letter. Confirm the same shift applies to every position.",
    lesson: "CAT becomes DBU by shifting every letter one position forward: C to D, A to B, T to U. Applying the same rule to DOG gives D to E, O to P, and G to H, so the answer is EPH.",
    remember: "For coding-decoding, write the letter shift for each position in the example word and confirm the same shift size and direction repeats before applying it to the new word.",
    interviewAnswer: "I compared CAT to DBU letter by letter and saw every letter moved exactly one step forward in the alphabet — C to D, A to B, T to U. Applying that same forward shift to D, O, and G gives E, P, and H, so DOG becomes EPH.",
  },
{
    id: "q-oa-blood-001",
    subject: "OA",
    concept: "Blood Relations",
    difficulty: "medium",
    stem: "Pointing to a photo, Ravi says, 'She is the daughter of my mother's only son.' If Ravi is male, how is the girl in the photo related to Ravi?",
    options: [
      { text: "Daughter", sub: "Daughter of Ravi himself", fix: "" },
      {
        text: "Niece",
        sub: "Daughter of Ravi's brother",
        fix: "There is no brother here. The clue says the mother's only son, and Ravi is male, so it points to Ravi.",
      },
      {
        text: "Sister",
        sub: "Daughter of Ravi's mother",
        fix: "The phrase is daughter of my mother's only son. Since Ravi is male and the only son, that person is Ravi himself, not Ravi's mother.",
      },
      {
        text: "Cousin",
        sub: "Child of a relative in the same generation",
        fix: "No aunt or uncle is introduced. The relation collapses directly to Ravi's own daughter.",
      },
    ],
    correctIndex: 0,
    proTip: "Reduce blood relation clues from the inside out. 'My mother's only son' is the key phrase.",
    lesson: "Start with 'my mother's only son.' Since Ravi is male and is the only son of his mother, that phrase refers to Ravi. The girl is the daughter of Ravi, so she is Ravi's daughter.",
    remember: "Collapse blood-relation chains from the innermost phrase outward — \"my mother's only son,\" when the speaker is male, almost always resolves to the speaker himself.",
    interviewAnswer: "I worked from the inside out, starting with \"my mother's only son.\" Since Ravi is male and is his mother's only son, that phrase just means Ravi himself, so the girl described as that person's daughter is simply Ravi's own daughter.",
  },
{
    id: "q-oa-directions-001",
    subject: "OA",
    concept: "Directions",
    difficulty: "easy",
    stem: "A person walks 5 km east, then turns left and walks 3 km, then turns left again and walks 5 km. How far and in which direction is the person from the starting point?",
    options: [
      {
        text: "3 km south",
        sub: "Left from east treated as south",
        fix: "Facing east, a left turn points north, not south.",
      },
      { text: "3 km north", sub: "East-west movement cancels out", fix: "" },
      {
        text: "5 km west",
        sub: "Only the last segment counted",
        fix: "The first 5 km east and final 5 km west cancel each other. The remaining displacement is the 3 km north segment.",
      },
      {
        text: "8 km north-east",
        sub: "Adds all distances",
        fix: "Direction problems ask displacement, not total walking distance. Opposite horizontal segments cancel.",
      },
    ],
    correctIndex: 1,
    proTip: "Track net displacement on east-west and north-south axes. Total distance walked is usually a trap.",
    lesson: "After walking 5 km east, the person turns left, which means north, and walks 3 km. A second left turn from north points west, and walking 5 km west cancels the original 5 km east. The only net movement is 3 km north.",
    remember: "In direction problems, track only net east-west and north-south displacement on two axes — total distance walked is a distractor, and opposite horizontal or vertical legs cancel out.",
    interviewAnswer: "I tracked the turns relative to facing east: a left turn from east points north, and a second left turn from north points west. The first 5 km east and the final 5 km west cancel each other exactly, leaving only the 3 km north leg as the net displacement.",
  },
{
    id: "q-oa-conclusion-001",
    subject: "OA",
    concept: "Statement Conclusions",
    difficulty: "medium",
    stem: "Statement: 'The company will shortlist candidates who solve at least 70% of the OA correctly.' Conclusion I: Solving 70% guarantees shortlisting. Conclusion II: Solving below 70% means the candidate will not be shortlisted. Which follows?",
    options: [
      {
        text: "Only I follows",
        sub: "Reads the threshold as a sufficient condition",
        fix: "",
      },
      {
        text: "Both I and II follow",
        sub: "Treats the threshold as also a necessary condition",
        fix: "The statement only says solving at least 70% is enough to be shortlisted — it never says it's the only way to be shortlisted. Concluding that scoring below 70% rules someone out assumes the rule also works in reverse, which the statement doesn't state. That's the converse error.",
      },
      {
        text: "Only II follows",
        sub: "Reads only the rejection side",
        fix: "The statement directly says the at-least-70 group will be shortlisted, so I follows, not II.",
      },
      {
        text: "Neither follows",
        sub: "Treats shortlist as unrelated to score",
        fix: "The statement explicitly links shortlist status to solving at least 70% correctly, so I does follow.",
      },
    ],
    correctIndex: 0,
    proTip: "For statement-conclusion questions, stay inside the sentence. A statement of the form 'X who do A will get B' only gives you a sufficient condition (A implies B) — never assume it's also necessary (not-A implies not-B) unless the statement explicitly says so.",
    lesson: "The statement defines a rule: candidates who solve at least 70% are shortlisted. That supports conclusion I — it's a direct restatement of the sufficient condition given. Conclusion II claims the converse: that failing to meet the threshold rules a candidate out. The statement never says 70% is the only path to being shortlisted, so II is an unsupported assumption, not a valid conclusion.",
    remember: "A sufficient-condition statement ('A leads to B') only supports conclusions that restate A implies B — never assume the converse (not-A implies not-B) unless the statement says so explicitly.",
    interviewAnswer: "The statement directly says candidates scoring at least 70% will be shortlisted, so conclusion I follows immediately — it's just a restatement of the rule. Conclusion II doesn't follow: the statement gives a sufficient condition for being shortlisted, not an exclusive one, so we can't conclude that missing the threshold guarantees rejection — the company could have other criteria the statement doesn't mention. That's the classic converse error in statement-conclusion questions.",
  },
{
    id: "q-oa-odd-001",
    subject: "OA",
    concept: "Odd One Out",
    difficulty: "easy",
    stem: "Choose the odd one out: 121, 144, 169, 196, 225, 256, 289, 315",
    options: [
      { text: "315", sub: "Not a perfect square", fix: "" },
      {
        text: "169",
        sub: "Middle square",
        fix: "169 is 13 squared, so it belongs with the perfect squares.",
      },
      {
        text: "289",
        sub: "Prime-looking ending",
        fix: "289 is 17 squared. It is a perfect square like the others except 315.",
      },
      {
        text: "225",
        sub: "Largest odd square here",
        fix: "225 is 15 squared, so it follows the same perfect-square pattern.",
      },
    ],
    correctIndex: 0,
    proTip: "Odd-one-out questions often use a clean category with one noisy item. Check squares, cubes, primes, parity, and divisibility quickly.",
    lesson: "121, 144, 169, 196, 225, 256, and 289 are perfect squares from 11 squared through 17 squared. 315 is not a perfect square, so it is the odd one out.",
    remember: "For odd-one-out number sets, quickly test whether the group is perfect squares, cubes, or another clean category, then check which single value breaks that pattern.",
    interviewAnswer: "I checked each number against being a perfect square and found 121, 144, 169, 196, 225, 256, and 289 are exactly 11 squared through 17 squared. 315 doesn't fit that square pattern at all, so it's the odd one out.",
  },
{
    id: "q-oa-venn-001",
    subject: "OA",
    concept: "Venn Reasoning",
    difficulty: "medium",
    stem: "In a group of 40 students, 24 like Java, 18 like Python, and 10 like both. How many like exactly one of the two languages?",
    options: [
      {
        text: "30",
        sub: "Subtracts both once from total likes",
        fix: "The total likes count 42 includes the both group twice. Exactly one is 42 - 2 x 10 = 22.",
      },
      {
        text: "14",
        sub: "Counts only the Java-only group",
        fix: "Exactly one means Java-only plus Python-only. Java-only is 14 and Python-only is 8.",
      },
      {
        text: "32",
        sub: "Counts anyone who likes at least one",
        fix: "24 + 18 - 10 = 32 counts students who like at least one language. It includes the 10 who like both, so it is not exactly one.",
      },
      { text: "22", sub: "Java-only 14 plus Python-only 8", fix: "" },
    ],
    correctIndex: 3,
    proTip: "For exactly-one questions, subtract the overlap from each set before adding. At-least-one and exactly-one are different.",
    lesson: "Java-only students are 24 - 10 = 14. Python-only students are 18 - 10 = 8. Students who like exactly one language are 14 + 8 = 22.",
    remember: "For \"exactly one\" Venn questions, subtract the overlap from each individual set first, then add those two exclusive counts — don't just add totals or subtract overlap once from the sum.",
    interviewAnswer: "I found the Java-only group by subtracting the overlap from total Java likers, 24 minus 10 equals 14, and did the same for Python, 18 minus 10 equals 8. Adding those two exclusive groups, 14 plus 8, gives 22 students who like exactly one language.",
  },
{
    id: "q-oa-ranking-001",
    subject: "OA",
    concept: "Ranking",
    difficulty: "easy",
    stem: "Asha is 12th from the top and 19th from the bottom in a class ranking. How many students are in the class?",
    options: [
      { text: "30", sub: "Top rank + bottom rank - 1", fix: "" },
      {
        text: "29",
        sub: "Subtracts 2 instead of 1",
        fix: "Only Asha is double-counted once. The formula is top + bottom - 1.",
      },
      {
        text: "32",
        sub: "Adds an extra student on each side",
        fix: "Rank positions already include Asha. There is no extra boundary student to add.",
      },
      {
        text: "31",
        sub: "Adds both ranks directly",
        fix: "Asha is counted in both the top-side and bottom-side counts, so subtract 1.",
      },
    ],
    correctIndex: 0,
    proTip: "Ranking from both ends uses total = top position + bottom position - 1, because the target person is counted twice.",
    lesson: "There are 11 students above Asha and 18 below her. Including Asha gives 11 + 1 + 18 = 30. Equivalently, 12 + 19 - 1 = 30.",
    remember: "When given rank-from-top and rank-from-bottom, use total students equals top rank plus bottom rank minus one, since the target person is counted in both counts.",
    interviewAnswer: "Asha's position is counted once from the top and once from the bottom, so simply adding the two ranks double-counts her. Subtracting one for that overlap, 12 plus 19 minus 1, gives 30 total students in the class.",
  },
{
    id: "q-oa-data-001",
    subject: "OA",
    concept: "Data Sufficiency",
    difficulty: "medium",
    stem: "Question: Is x greater than y? Statement I: x - y = 5. Statement II: y is negative. Which statements are sufficient?",
    options: [
      {
        text: "Statement II alone is sufficient",
        sub: "Negative y makes x larger",
        fix: "Knowing y is negative says nothing definite about x. x could be more negative than y.",
      },
      {
        text: "Statement I alone is sufficient",
        sub: "Difference directly proves x is larger",
        fix: "",
      },
      {
        text: "Both together are needed",
        sub: "Combines difference and sign",
        fix: "Statement I already proves x is 5 more than y, so x must be greater than y. Statement II is unnecessary.",
      },
      {
        text: "Even both together are insufficient",
        sub: "Needs actual values",
        fix: "Actual values are not needed. A positive difference x - y = 5 proves the comparison.",
      },
    ],
    correctIndex: 1,
    proTip: "In data sufficiency, answer the exact question, not the value. A comparison can be settled without knowing either number.",
    lesson: "Statement I says x - y = 5, which means x is 5 greater than y, so it is sufficient. Statement II only says y is negative and gives no fixed relation between x and y, so it is not sufficient.",
    remember: "In data sufficiency comparison questions, check whether a statement settles the exact question asked — a relation like a difference can answer \"is x greater than y\" without ever revealing the actual values.",
    interviewAnswer: "Statement I tells me x minus y equals 5, which directly proves x is greater than y regardless of what the actual numbers are, so it's sufficient on its own. Statement II only says y is negative, which tells me nothing about how x compares to y since x could be even more negative, so it adds nothing and isn't needed.",
  },
{
    id: "q-oa-clock-001",
    subject: "OA",
    concept: "Clock Logic",
    difficulty: "hard",
    stem: "At what angle are the hour and minute hands of a clock at 3:30?",
    options: [
      {
        text: "60 degrees",
        sub: "Subtracts too much hour-hand movement",
        fix: "The hour hand moves 0.5 degrees per minute, so in 30 minutes it moves 15 degrees, not 30.",
      },
      { text: "75 degrees", sub: "Hour hand has moved halfway from 3 to 4", fix: "" },
      {
        text: "105 degrees",
        sub: "Adds the hour-hand movement",
        fix: "The minute hand is at 6 and the hour hand is between 3 and 4. The smaller angle is 180 - 105 = 75 degrees.",
      },
      {
        text: "90 degrees",
        sub: "Treats hour hand as fixed at 3",
        fix: "At 3:30, the hour hand is not still on 3. It has moved halfway toward 4, reducing the angle.",
      },
    ],
    correctIndex: 1,
    proTip: "Clock questions punish fixed-hand assumptions. The hour hand moves 0.5 degrees every minute.",
    lesson: "At 3:30, the minute hand is at 180 degrees from 12. The hour hand is at 3.5 hour marks: 3 x 30 + 30 x 0.5 = 105 degrees from 12. The difference is 180 - 105 = 75 degrees.",
    remember: "For clock-angle problems, remember the hour hand keeps moving between numbers at 0.5 degrees per minute — never treat it as parked on the hour.",
    interviewAnswer: "At 3:30 the minute hand sits exactly at the 6, which is 180 degrees from 12, but the hour hand isn't still at 3 — it has crept halfway toward 4. Calculating its position as 3 times 30 plus 30 times 0.5 gives 105 degrees, and the gap between 180 and 105 is 75 degrees.",
  },
{
    id: "q-oa-arithmetic-001",
    subject: "OA",
    concept: "Arithmetic Logic",
    difficulty: "medium",
    stem: "A price is increased by 20% and then decreased by 20%. What is the net effect on the original price?",
    options: [
      {
        text: "No change",
        sub: "Same percentages cancel",
        fix: "The second 20% is taken on the increased price, not the original price. Equal percent up and down do not cancel.",
      },
      { text: "4% decrease", sub: "1.2 x 0.8 = 0.96 of original", fix: "" },
      {
        text: "20% decrease",
        sub: "Only the final change counted",
        fix: "Both changes matter. The final decrease is applied after the increase.",
      },
      {
        text: "4% increase",
        sub: "Adds percentage effects",
        fix: "The multiplier is 1.2 x 0.8 = 0.96, which is below 1. That means a decrease.",
      },
    ],
    correctIndex: 1,
    proTip: "Use multipliers for percentage chains. Increase by 20% is x1.2; decrease by 20% is x0.8.",
    lesson: "Let the original price be 100. After a 20% increase it becomes 120. A 20% decrease on 120 is 24, so the final price is 96. That is 4 less than the original 100, giving a 4% decrease.",
    remember: "For successive percentage changes, multiply the corresponding factors instead of adding percentages — increase by 20% is times 1.2 and decrease by 20% afterward is times 0.8 of the new value, not the original.",
    interviewAnswer: "I converted both percentage changes into multipliers and chained them: 1.2 for the 20% increase, then 0.8 for the 20% decrease applied to the already-increased price. Multiplying 1.2 by 0.8 gives 0.96, which means the final price is 96% of the original, a net 4% decrease, not zero.",
  },
{
    id: "q-oa-puzzle-001",
    subject: "OA",
    concept: "Constraint Puzzle",
    difficulty: "hard",
    stem: "Three boxes are labeled Red, Blue, and Green, but every label is wrong. You open the box labeled Red and find a blue ball. What color ball is in the box labeled Green?",
    options: [
      { text: "Red", sub: "Remaining labels must swap consistently", fix: "" },
      {
        text: "Cannot be determined",
        sub: "Assumes multiple valid arrangements",
        fix: "Once the Red-labeled box is known to be blue, the remaining labels force a single swap: Green-labeled must be red and Blue-labeled must be green.",
      },
      {
        text: "Green",
        sub: "Matches the Green label",
        fix: "Every label is wrong, so the box labeled Green cannot contain green.",
      },
      {
        text: "Blue",
        sub: "Copies the opened box color",
        fix: "The opened box labeled Red already contains blue. There is only one blue box in this setup.",
      },
    ],
    correctIndex: 0,
    proTip: "When all labels are wrong, eliminate the label's own color first. One revealed mismatch often forces the rest.",
    lesson: "The box labeled Red contains blue, so blue is used. The remaining colors are red and green for the boxes labeled Blue and Green. Since the Green-labeled box cannot contain green, it must contain red.",
    remember: "When every label on a set of boxes is guaranteed wrong, opening just one box and seeing its true contents usually forces every other label-to-content swap through elimination.",
    interviewAnswer: "The box labeled Red actually contains blue, so blue is already assigned. Since every label is wrong, the Green-labeled box can't contain green, and the only remaining color left for it is red, which also forces the Blue-labeled box to contain green.",
  },
{
    id: "q-oa-input-001",
    subject: "OA",
    concept: "Input-Output Pattern",
    difficulty: "medium",
    stem: "A machine rearranges words alphabetically from left to right, placing one word correctly at each step. Input: 'sun apple moon book'. What is Step II?",
    options: [
      {
        text: "book apple moon sun",
        sub: "Starts with second-smallest word",
        fix: "Alphabetical ordering begins with apple, not book.",
      },
      {
        text: "apple book moon sun",
        sub: "Fully sorted output",
        fix: "That is the final arrangement, not Step II. The machine places one word per step.",
      },
      {
        text: "apple sun moon book",
        sub: "Only Step I",
        fix: "Step I places apple first. Step II also places the next alphabetically smallest remaining word, book, second.",
      },
      {
        text: "apple book sun moon",
        sub: "Two alphabetically smallest words placed first",
        fix: "",
      },
    ],
    correctIndex: 3,
    proTip: "For input-output questions, infer how much changes per step. Do not jump to the final sorted form unless the step number demands it.",
    lesson: "Alphabetically, the words are apple, book, moon, sun. If the machine places one word correctly at each step, Step I puts apple first: apple sun moon book. Step II puts book second while leaving the rest in prior order: apple book sun moon.",
    remember: "For machine input-output step questions, figure out exactly how many words get placed per step and trace only that many moves — don't jump straight to the fully sorted output.",
    interviewAnswer: "I first sorted the words alphabetically in my head — apple, book, moon, sun — and noted the machine places exactly one word correctly per step. Step I places apple first, giving apple sun moon book, and Step II places the next smallest word, book, into its position, giving apple book sun moon.",
  },
{
    id: "q-oa-analogy-001",
    subject: "OA",
    concept: "Analogy",
    difficulty: "easy",
    stem: "Choose the pair that completes the analogy: Pen : Write :: Knife : ?",
    options: [
      {
        text: "Steel",
        sub: "Object matched to material",
        fix: "The first pair is not object to material. A pen may write regardless of material.",
      },
      {
        text: "Kitchen",
        sub: "Object matched to place",
        fix: "The relation is what the object does, not where it may be used.",
      },
      {
        text: "Sharp",
        sub: "Object matched to a property",
        fix: "Pen to write is object to function. Sharp is a property of a knife, not the matching function relation.",
      },
      { text: "Cut", sub: "Object matched to its primary function", fix: "" },
    ],
    correctIndex: 3,
    proTip: "Name the relation in the first pair before looking at options. Object-to-function is a common OA analogy pattern.",
    lesson: "A pen is used to write. Following the same object-to-function relation, a knife is used to cut. The other options describe a property, material, or place rather than the primary action.",
    remember: "For object-pair analogies, name the relationship in the first pair in words first — object-to-function, object-to-property, or object-to-material — then match the same relationship type in the answer.",
    interviewAnswer: "I named the relationship in pen to write as object matched to its main function, not a property or material. Applying that same function relationship to knife, the action it's primarily used for is to cut, which is why cut is the answer rather than sharp or steel.",
  },
{
    id: "q-oa-calendar-001",
    subject: "OA",
    concept: "Calendar Logic",
    difficulty: "medium",
    stem: "If today is Wednesday, what day will it be 45 days from today?",
    options: [
      {
        text: "Monday",
        sub: "Uses 46 days instead of 45",
        fix: "Only 45 days are added. Full weeks do not change the weekday, leaving a 3-day shift.",
      },
      {
        text: "Saturday",
        sub: "Move forward by the remainder after full weeks",
        fix: "",
      },
      {
        text: "Sunday",
        sub: "Counts the starting day as day one",
        fix: "For '45 days from today', move forward 45 day changes. Do not count today as the first future day.",
      },
      {
        text: "Friday",
        sub: "45 leaves remainder 3 when divided by 7",
        fix: "45 mod 7 is 3, and three days after Wednesday is Saturday, not Friday.",
      },
    ],
    correctIndex: 1,
    proTip: "Reduce calendar jumps modulo 7. Then move only the remainder from the given weekday.",
    lesson: "There are 7 days in a week. 45 divided by 7 leaves a remainder of 3, so 45 days later is the same as 3 days later for weekday purposes. Wednesday plus 3 days is Saturday.",
    remember: "For \"N days from today\" calendar questions, reduce N modulo 7 to find the effective shift, since full weeks never change the day of the week.",
    interviewAnswer: "I divided 45 by 7 and found it leaves a remainder of 3, meaning only 3 days actually shift the weekday after all the full weeks cancel out. Counting 3 days forward from Wednesday lands on Saturday.",
  },
  ...NEW_DBMS,
  ...NEW_OS,
  ...NEW_CN,
  ...NEW_OOP,
  ...NEW_CPP,
  ...NEW_PYTHON,
  ...NEW_OA,
];

export const DSA_PROMPTS = [
  {
    id: "dsa-window-001",
    concept: "Sliding Window",
    difficulty: "medium",
    prompt: "You are given an array of positive integers and a target sum. Explain how you would find the minimum length contiguous subarray whose sum is at least the target. Do not write code; describe the logic and edge cases.",
    hints: [
      "Positive integers let the left pointer move forward without missing a better answer.",
      "Track a running window sum and shrink while the sum is high enough.",
      "If no valid window appears, return 0.",
    ],
    modelAnswer: "Use two pointers. Expand the right pointer and add each value to a running sum. Whenever the sum is at least the target, update the best length, then move the left pointer forward while subtracting from the sum. Because all numbers are positive, shrinking the left side can only decrease the sum, so every candidate window is considered once. If best was never updated, return 0.",
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
    prompt: "A grid contains empty cells, walls, and one source cell. Explain how you would compute the shortest distance from the source to every reachable empty cell.",
    hints: [
      "Unweighted shortest path points to BFS.",
      "Push the source first with distance 0.",
      "Visit each valid neighbor once.",
    ],
    modelAnswer: "Run BFS from the source. Put the source in a queue with distance 0 and mark it visited. Pop a cell, inspect its four neighbors, skip walls/out-of-bounds/visited cells, assign distance current + 1, mark visited, and push it. BFS processes cells by increasing distance, so the first distance assigned to each cell is the shortest.",
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
    prompt: "You can climb 1 or 2 stairs at a time. Explain how to count the number of distinct ways to reach step n, and why the recurrence works.",
    hints: [
      "Every path to step n comes from step n-1 or n-2.",
      "Base cases define the recurrence.",
      "Only the last two states are needed for an optimized version.",
    ],
    modelAnswer: "Let dp[i] be the number of ways to reach step i. The last move into i is either from i - 1 using one step or from i - 2 using two steps, so dp[i] = dp[i - 1] + dp[i - 2]. Base cases can be dp[0] = 1 and dp[1] = 1. Fill up to n. Since each state only needs the previous two, the memory can be reduced to two variables.",
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
    prompt: "Given a sorted array, explain how to find whether any two distinct elements sum to a given target, in linear time and constant extra space.",
    hints: [
      "The array is already sorted — exploit that ordering.",
      "Start one pointer at each end.",
      "Move based on whether the current sum is too big or too small.",
    ],
    modelAnswer: "Place a left pointer at the start and a right pointer at the end. Compute their sum: if it equals the target, you found a pair; if it's less than the target, move left rightward to increase the sum; if it's more, move right leftward to decrease it. Each step discards exactly the elements that cannot form the target, so the pointers converge in O(n) time with O(1) space. If they cross without a match, no pair exists.",
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
    prompt: "Explain how to find the index of a target in a sorted array in O(log n), and describe the most common off-by-one pitfalls in the loop.",
    hints: [
      "Halve the search space each step.",
      "Be precise about whether bounds are inclusive.",
      "Compute the midpoint without overflow.",
    ],
    modelAnswer: "Maintain low and high bounds over the array. Each iteration compute mid = low + (high - low) / 2 (avoiding overflow), compare arr[mid] to the target, and discard half: if arr[mid] < target search the right half (low = mid + 1), else if greater search the left half (high = mid - 1), else return mid. Decide an invariant up front — typically [low, high] inclusive with the loop running while low <= high. The common bugs are an inclusive/exclusive mismatch in the loop condition, forgetting the +1/-1 when narrowing, and integer overflow from (low + high) / 2.",
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
    prompt: "Given an unsorted array, explain how to find whether two elements sum to a target in O(n) time, and what the trade-off is versus the sorted two-pointer approach.",
    hints: [
      "Trade space for time with a hash set/map.",
      "For each value, what complement do you need?",
      "One pass can both check and insert.",
    ],
    modelAnswer: "Iterate once, keeping a hash set of values seen so far. For each element x, check whether target - x is already in the set; if so, you've found a pair. Otherwise insert x and continue. This runs in O(n) time and O(n) space and works on unsorted input. The trade-off versus the two-pointer method is memory: two pointers needs O(1) space but requires the array to be sorted first (O(n log n) if it isn't), while hashing avoids sorting at the cost of extra space.",
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
    prompt: "Explain how to check whether a string of brackets like ()[]{} is balanced, and identify the cases that should return false.",
    hints: [
      "A stack naturally matches most-recent open brackets.",
      "Push opens, pop on closes.",
      "Think about leftover or unmatched brackets.",
    ],
    modelAnswer: "Scan left to right using a stack. On an opening bracket, push it. On a closing bracket, the top of the stack must be the matching opener — if the stack is empty or the top doesn't match, the string is unbalanced, return false. After the scan, the string is balanced only if the stack is empty (no unclosed openers). The two failure modes are a closing bracket with no/incorrect matching open on top, and leftover openers at the end.",
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
    prompt: "Explain how to detect whether a singly linked list contains a cycle, using O(1) extra space, and why the method works.",
    hints: [
      "Two pointers at different speeds.",
      "Think about what happens inside a loop.",
      "Compare against a hash-set approach on space.",
    ],
    modelAnswer: "Use Floyd's tortoise and hare: a slow pointer advances one node per step and a fast pointer two. If the list ends (fast or fast.next is null), there's no cycle. If there is a cycle, the fast pointer eventually laps the slow pointer and they meet inside the loop, because each step the gap between them shrinks by one within the cycle. This uses O(1) extra space, versus an O(n)-space hash set of visited nodes.",
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
    prompt: "Explain how to verify that a binary tree is a valid binary search tree, and why simply comparing each node to its immediate children is insufficient.",
    hints: [
      "BST validity is a range constraint, not just a local one.",
      "Carry allowed (min, max) bounds down the recursion.",
      "An in-order traversal has a useful property too.",
    ],
    modelAnswer: "Recurse with an allowed open interval (min, max) for each node, starting unbounded. A node's value must lie strictly within its bounds; then recurse left with the upper bound tightened to the node's value, and right with the lower bound tightened to it. Comparing only to immediate children fails because a deep descendant can violate an ancestor's constraint while still satisfying its parent. Equivalently, an in-order traversal of a valid BST yields strictly increasing values, so you can check that the sequence is sorted.",
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
    prompt: "Given a large stream of numbers, explain how to efficiently keep track of the K largest seen so far, and the time complexity per element.",
    hints: [
      "A heap of fixed size K.",
      "Which kind of heap lets you drop the smallest cheaply?",
      "Compare to fully sorting everything.",
    ],
    modelAnswer: "Maintain a min-heap of size K. For each incoming number, if the heap has fewer than K elements, push it. Otherwise compare it to the heap's minimum (the root): if the new number is larger, pop the smallest and push the new one; if not, discard it. The heap always holds the current K largest, and its root is the K-th largest. Each element costs O(log K), so processing n elements is O(n log K) time with O(K) space — far better than sorting all n at O(n log n), especially when K is small.",
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
    prompt: "Given a set of intervals with start and end times, explain how to find the maximum number of mutually non-overlapping intervals you can select, and justify why the greedy choice is optimal.",
    hints: [
      "Sort by a particular endpoint.",
      "Greedily commit to intervals that free you up soonest.",
      "Use an exchange argument for optimality.",
    ],
    modelAnswer: "Sort the intervals by earliest end time. Walk through them, always selecting an interval if its start is at or after the end of the last selected one, and updating the last end. Choosing the interval that finishes earliest leaves the most room for future selections. This is optimal by an exchange argument: any optimal solution can be transformed, without reducing its size, to also pick the earliest-finishing compatible interval, so the greedy choice is never worse. Sorting dominates at O(n log n).",
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
    prompt: "Explain the general backtracking approach to generate all valid combinations (for example, all subsets or all permutations), and how pruning improves it.",
    hints: [
      "Build a partial solution and extend it choice by choice.",
      "Undo the last choice before trying the next.",
      "Cut branches that can't lead to a valid result.",
    ],
    modelAnswer: "Backtracking does a depth-first exploration of the decision tree. At each step you make a choice to extend the current partial solution, recurse, then undo the choice (backtrack) to try alternatives. When the partial solution is complete (e.g., correct length), record it. Pruning skips branches that provably can't yield a valid or better solution — for instance, enforcing that subset elements are chosen in increasing index order to avoid duplicates, or abandoning a path once a constraint is already violated. Pruning can dramatically cut the explored space even though the worst case stays exponential.",
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
    prompt: "You need to repeatedly merge groups and ask whether two elements are in the same group (for example, detecting connected components as edges are added). Explain the data structure and the two optimizations that make it nearly O(1) per operation.",
    hints: [
      "Each element points to a representative.",
      "Flatten chains during lookups.",
      "Attach the smaller tree under the larger.",
    ],
    modelAnswer: "Use a disjoint-set (union-find) structure where each element has a parent pointer; the root of a tree is the group's representative. find(x) follows parents to the root, and union(a, b) links one root under the other. Two optimizations make it near-constant amortized: path compression, where find re-points nodes directly to the root as it returns, flattening the tree; and union by rank/size, where the smaller tree is attached under the larger to keep trees shallow. Together they give an inverse-Ackermann (effectively constant) amortized cost per operation.",
    rubric: [
      "Represents groups as parent-pointer trees with a root representative.",
      "Describes find (to root) and union (link roots).",
      "Includes path compression.",
      "Includes union by rank/size and notes near-constant amortized cost.",
    ],
  },
];

export const INTERACTIVE_QUESTIONS = [
  {
    id: "iq-order-tcp",
    type: "ordering",
    subject: "CN",
    concept: "TCP Handshake",
    difficulty: "medium",
    title: "TCP 3-Way Handshake Sequencing",
    instructions: "Arrange the steps of the TCP 3-way handshake in the correct order, starting from the client initiating the connection to the final established state.",
    steps: [
      "Client generates a random sequence number x and sends a SYN packet to the server.",
      "Server receives SYN, allocates resources, generates its own sequence number y, and replies with a SYN-ACK packet (acknowledging x + 1).",
      "Client receives SYN-ACK, allocates resources, and sends an ACK packet (acknowledging y + 1).",
      "Server receives ACK, and both sockets transition to the ESTABLISHED state.",
    ],
    proTip: "TCP uses sequence numbers to synchronize bytes and verify receipt. The handshake guarantees both sides agree on initial sequences and can send/receive data.",
    lesson: "The TCP 3-way handshake follows the pattern: SYN (Client -> Server), SYN-ACK (Server -> Client), and ACK (Client -> Server). This process synchronizes sequence numbers, checks that both paths are functional, and allocates TCP buffers on both ends before actual application data flows.",
    remember: "TCP handshake: Client sends SYN -> Server responds SYN-ACK -> Client sends ACK. Only then is it ESTABLISHED.",
  },
  {
    id: "iq-order-btree",
    type: "ordering",
    subject: "DBMS",
    concept: "Indexing",
    difficulty: "hard",
    title: "B-Tree Insertion and Node Split",
    instructions: "Order the logical steps of inserting a new key into a B-Tree index, including how splits propagate up the tree.",
    steps: [
      "Traverse from the root down to the appropriate leaf node using key comparisons.",
      "Insert the new key into the leaf node in sorted order.",
      "Detect that the leaf node size exceeds the maximum allowed keys, causing an overflow.",
      "Split the overflowed leaf node into two sibling nodes, keeping the median key temporarily.",
      "Push the median key up into the parent node, creating parent pointers to the split children.",
      "Propagate splits recursively up to the root if the parent nodes also overflow, creating a new root if necessary.",
    ],
    proTip: "A B-Tree grows upwards. When a root node splits, the tree increases in height by 1, which keeps the tree completely balanced with all leaves at the same depth.",
    lesson: "When inserting into a B-Tree, we search for the target leaf, insert, and split if there is an overflow. The split divides keys, pushes the median to the parent, and can trigger recursive splits up to the root, which is how B-Trees maintain their balanced height log(N) lookup guarantees.",
    remember: "B-Trees grow from the bottom up. Split leaf -> push median to parent -> recurse up. If root splits, height increases.",
  },
  {
    id: "iq-order-normalization",
    type: "ordering",
    subject: "DBMS",
    concept: "Normalization",
    difficulty: "medium",
    title: "Normal Forms Ordering",
    instructions: "Sequence the transformations required to normalize a database table step-by-step from unnormalized form up to BCNF.",
    steps: [
      "Ensure all column values are atomic (no multi-valued attributes or repeating groups), establishing First Normal Form (1NF).",
      "Remove partial dependencies (where non-key attributes depend on only part of a composite primary key), establishing Second Normal Form (2NF).",
      "Remove transitive dependencies (where a non-key attribute depends on another non-key attribute), establishing Third Normal Form (3NF).",
      "Ensure every determinant is a superkey, resolving remaining functional dependency anomalies to reach Boyce-Codd Normal Form (BCNF).",
    ],
    proTip: "Each normal form is a strict subset of the previous one. A table cannot be in 3NF unless it is already in 2NF, and it cannot be in 2NF unless it is in 1NF.",
    lesson: "Normalization removes redundancy progressively: 1NF requires atomic values; 2NF removes partial key dependencies (relevant for composite keys); 3NF removes transitive dependencies (non-key fields depending on other non-key fields); and BCNF resolves cases where a non-trivial functional dependency exists on a non-superkey.",
    remember: "1NF = atomic values; 2NF = no partial key dependencies; 3NF = no transitive dependencies; BCNF = determinants must be superkeys.",
  },
  {
    id: "iq-bucket-os",
    type: "categorize",
    subject: "OS",
    concept: "Processes & Threads",
    difficulty: "medium",
    title: "Process vs. Thread Characteristics",
    instructions: "Drag each attribute into the correct bucket depending on whether it describes an Operating System Process or a Thread.",
    buckets: [ "Process", "Thread" ],
    items: [
      { text: "Has its own isolated virtual memory space.", bucket: "Process" },
      { text: "Created via fork() in Unix-like environments.", bucket: "Process" },
      {
        text: "Heavier context switching overhead due to MMU page table remapping.",
        bucket: "Process",
      },
      {
        text: "If it crashes, it typically does not crash neighbor siblings directly.",
        bucket: "Process",
      },
      {
        text: "Shares code segment, heap, and open files with siblings.",
        bucket: "Thread",
      },
      {
        text: "Has its own stack pointer, registers, and program counter, but no private heap.",
        bucket: "Thread",
      },
      {
        text: "Extremely fast context switching within the same parent.",
        bucket: "Thread",
      },
      {
        text: "A segment violation here will crash the entire parent and all sibling routines.",
        bucket: "Thread",
      },
    ],
    proTip: "Threads share global resources but have private execution states. Processes share almost nothing by default and require IPC (Inter-Process Communication) to talk.",
    lesson: "Processes are isolated containers with their own memory space (page tables, descriptors) making context switches slower. Threads are execution contexts within a process, sharing memory and files, making communication fast but code errors fatal to siblings.",
    remember: "Process = separate address space, high isolation; Thread = shared address space, fast context switch, shared heap, separate stack.",
  },
  {
    id: "iq-bucket-memory",
    type: "categorize",
    subject: "CPP",
    concept: "Memory Management",
    difficulty: "medium",
    title: "Stack vs. Heap Memory Allocation",
    instructions: "Categorize the traits of computer memory allocation into Stack and Heap memory areas.",
    buckets: [ "Stack", "Heap" ],
    items: [
      {
        text: "Automatically managed scope with LIFO (Last-In, First-Out) release.",
        bucket: "Stack",
      },
      {
        text: "Allocation is extremely fast, requiring only a CPU stack pointer increment.",
        bucket: "Stack",
      },
      {
        text: "Used for local variables and active function call frames.",
        bucket: "Stack",
      },
      {
        text: "Limited in capacity, leading to a stack overflow if exceeded.",
        bucket: "Stack",
      },
      {
        text: "Manually allocated (new/malloc) and released (delete/free) by programmer.",
        bucket: "Heap",
      },
      {
        text: "Allocation is slower due to allocator searches and memory fragmentation.",
        bucket: "Heap",
      },
      {
        text: "Shared globally across threads and function call stacks.",
        bucket: "Heap",
      },
      {
        text: "Much larger memory capacity, limited only by physical RAM and swap space.",
        bucket: "Heap",
      },
    ],
    proTip: "Heap memory must be carefully managed in C++ to avoid memory leaks. Modern C++ uses smart pointers (std::unique_ptr, std::shared_ptr) to automate heap resource cleanup.",
    lesson: "The Stack handles fast, scoped local allocations automatically via the call stack. The Heap provides dynamic, large, long-lived memory allocations but requires manual management (malloc/free, new/delete) or smart pointer wrappers to avoid memory leaks.",
    remember: "Stack = fast, small, LIFO, auto-managed; Heap = slow, large, dynamic, manually managed (or smart pointers).",
  },
  {
    id: "iq-bucket-acid",
    type: "categorize",
    subject: "DBMS",
    concept: "Transactions",
    difficulty: "easy",
    title: "ACID vs. BASE Database Guarantees",
    instructions: "Sort the transactional characteristics into ACID (relational databases) or BASE (distributed NoSQL databases) categories.",
    buckets: [ "ACID", "BASE" ],
    items: [
      {
        text: "Atomicity: All operations in a transaction succeed or all fail.",
        bucket: "ACID",
      },
      {
        text: "Consistency: Database state transitions always respect schema constraints.",
        bucket: "ACID",
      },
      {
        text: "Isolation: Concurrent executions leave the database in a state as if run sequentially.",
        bucket: "ACID",
      },
      {
        text: "Durability: Committed data is guaranteed to survive system crashes.",
        bucket: "ACID",
      },
      {
        text: "Basically Available: The system guarantees availability over absolute data freshness.",
        bucket: "BASE",
      },
      {
        text: "Soft State: The state of the system can drift over time without active updates.",
        bucket: "BASE",
      },
      {
        text: "Eventual Consistency: The system eventually becomes consistent when inputs cease.",
        bucket: "BASE",
      },
    ],
    proTip: "ACID guarantees strong consistency, useful for finance. BASE guarantees high availability in large distributed systems, relaxing consistency to scale globally.",
    lesson: "ACID transactions provide strict, deterministic guarantees for relational DBs (OLTP). BASE properties (Basically Available, Soft state, Eventual consistency) are designed for large-scale distributed databases that trade consistency for partition tolerance (CAP Theorem).",
    remember: "ACID = strong consistency, strict schemas, financial data; BASE = eventual consistency, high availability, horizontal scaling.",
  },
  {
    id: "iq-cloze-sql",
    type: "cloze",
    subject: "DBMS",
    concept: "SQL Queries",
    difficulty: "medium",
    title: "SQL Group By and Having Filter",
    instructions: "Complete the SQL statement to aggregate records and filter the group results. Fill in the missing clauses.",
    code: "SELECT department_id, AVG(salary)\nFROM employees\n[BLANK1] department_id\n[BLANK2] AVG(salary) > 50000;",
    blanks: [
      { id: "BLANK1", correct: "GROUP BY", placeholder: "aggregation clause" },
      { id: "BLANK2", correct: "HAVING", placeholder: "group filter clause" },
    ],
    proTip: "WHERE filters rows before aggregation. HAVING filters grouped rows after aggregation.",
    lesson: "In SQL, we use GROUP BY to group rows sharing values in specific columns, and HAVING to apply filter conditions to those groups (like checking aggregated values). WHERE cannot be used for aggregate functions like AVG().",
    remember: "Use GROUP BY to aggregate, and HAVING (never WHERE) to filter aggregate results.",
  },
  {
    id: "iq-cloze-raii",
    type: "cloze",
    subject: "OOP",
    concept: "Design Patterns",
    difficulty: "hard",
    title: "C++ RAII Lock Guard Pattern",
    instructions: "Complete this C++ class representing the RAII pattern for a thread-safe mutex guard. Fill in the class name for the constructor and the destructor syntax.",
    code: `class LockGuard {
private:
    Mutex& mtx;
public:
    [BLANK1](Mutex& m) : mtx(m) {
        mtx.lock();
    }
    [BLANK2]LockGuard() {
        mtx.unlock();
    }
};`,
    blanks: [
      { id: "BLANK1", correct: "LockGuard", placeholder: "constructor name" },
      { id: "BLANK2", correct: "~", placeholder: "destructor symbol" },
    ],
    proTip: "RAII stands for Resource Acquisition Is Initialization. It links resource lifetime (like locks or file handles) to object lifetime, ensuring cleanup when the object goes out of scope.",
    lesson: "In this LockGuard class, the constructor LockGuard(Mutex& m) locks the mutex on instantiation, and the destructor ~LockGuard() unlocks it when the LockGuard object goes out of scope. This prevents deadlocks even if exceptions occur.",
    remember: "RAII: Constructor locks/allocates, Destructor (prefix ~) unlocks/releases.",
  },
  {
    id: "iq-cloze-python",
    type: "cloze",
    subject: "PYTHON",
    concept: "Syntax & Scoping",
    difficulty: "easy",
    title: "Python Generator Statement",
    instructions: "Fill in the keyword that allows a Python function to yield values one by one as a generator, preserving its execution state.",
    code: "def fibonacci(n):\n    a, b = 0, 1\n    for _ in range(n):\n        [BLANK1] a\n        a, b = b, a + b",
    blanks: [ { id: "BLANK1", correct: "yield", placeholder: "keyword" } ],
    proTip: "Generators are memory-efficient because they produce items lazily (on demand) rather than returning a fully populated list in memory.",
    lesson: "The yield keyword suspends a function's execution and sends a value back to the caller, but retains enough state to enable the function to resume where it left off on subsequent calls.",
    remember: "Use the yield keyword to make a generator in Python, generating items lazily.",
  },
];
