export const NEW_DBMS = [
  {
    id: "q-dbms-connpool-001",
    subject: "DBMS",
    concept: "Connection Pooling",
    difficulty: "medium",
    stem: "A Node.js API spins up a new Postgres client connection on every incoming request and closes it after the response. Under moderate load (200 req/s), p99 latency balloons and Postgres logs start showing 'too many clients already.' The app server's CPU and memory are both fine. What is the most likely fix?",
    options: [
      {
        text: "Create database indexes for frequently accessed columns.",
        sub: "Optimizes query performance and retrieval speed.",
        fix: "Indexing improves query execution times, but the 'too many clients' error and latency indicate connection management issues and exhaustion, not slow data retrieval or inefficient query plans.",
      },
      {
        text: "Utilize a connection pool to manage reusable client connections.",
        sub: "Manages a pool of reusable open connections.",
        fix: "",
      },
      {
        text: "Increase the Postgres `max_connections` configuration.",
        sub: "Expands the maximum concurrent client limit.",
        fix: "Increasing `max_connections` escalates resource consumption per connection; it doesn't fix the rapid connection opening and closing, only defers the 'too many clients' error and adds server-side memory pressure.",
      },
      {
        text: "Implement a read replica to offload query processing.",
        sub: "Distributes read operations horizontally.",
        fix: "A read replica increases read capacity but doesn't resolve the connection churn; each request still incurs opening and closing overhead, leading to similar issues on the replica itself.",
      },
    ],
    correctIndex: 1,
    proTip: "Opening a Postgres connection is expensive (process fork + auth + TLS handshake), and each one holds real server-side memory whether or not it's doing work. A pool amortizes that cost and caps concurrent connections to something the database can actually hold.",
    lesson: "Postgres handles each connection as a separate backend process, which makes connection setup/teardown relatively costly and makes max_connections a hard, memory-bound ceiling. Opening a new connection per request multiplies that cost under load and can exhaust the connection limit even when query work itself is cheap. A connection pooler (pgBouncer, or a pool built into the driver/ORM) keeps a bounded set of warm connections and hands them out to requests, which removes the per-request connection overhead and keeps usage under the database's limit.",
    remember: "Postgres connections are full OS processes — pool and reuse them; don't open one per request and don't just raise max_connections to paper over churn.",
    interviewAnswer: "The 'too many clients already' error combined with fine CPU/memory tells me this isn't a compute problem, it's connection churn — every request is paying the cost of a fresh Postgres connection (which is a full backend process with auth and memory overhead) and then throwing it away. The fix is a connection pool, either pgBouncer in front of Postgres or a pool in the app's driver, so requests borrow from a small set of already-established connections instead of creating new ones. Bumping max_connections just raises the ceiling and burns more server memory per idle connection — it doesn't address why connections are being opened so wastefully in the first place.",
  },
  {
    id: "q-dbms-replag-001",
    subject: "DBMS",
    concept: "Read Replica Lag",
    difficulty: "hard",
    stem: "An e-commerce app writes a new order to the primary MySQL database, then immediately redirects the user to an order confirmation page that reads from a read replica. Users intermittently see 'order not found' for a second or two right after checkout, then it appears. The replica's replication thread shows no errors. What's going on?",
    options: [
      {
        text: "The write transaction violated a foreign key constraint on the replica",
        sub: "Replica rejects the row",
        fix: "If the replica rejected the row, replication would show an error or the replica would stop applying changes; the scenario says there are no replication errors, and the order does eventually appear.",
      },
      {
        text: "The order row was deleted by a cascading foreign key on the primary",
        sub: "Row removed via ON DELETE CASCADE",
        fix: "Nothing in the scenario describes a delete; the order eventually shows up correctly, which is consistent with a delayed copy arriving, not a row being removed.",
      },
      {
        text: "The replica is using a different isolation level than the primary",
        sub: "Isolation level mismatch",
        fix: "Isolation level governs visibility within a single node's concurrent transactions, not whether a replica has received and applied a change that was committed on a different node.",
      },
      {
        text: "Asynchronous replication delay means the replica hasn't yet applied the primary's write",
        sub: "Replica write application delay",
        fix: "",
      },
    ],
    correctIndex: 3,
    proTip: "'Read-your-writes' breaks the moment you write to a primary and read from an async replica. If a flow needs to see its own write immediately, route that specific read to the primary (or a replica you know is caught up) instead of redesigning your whole replication topology.",
    lesson: "Most MySQL and Postgres replica setups use asynchronous (or semi-synchronous) replication: the primary commits and acknowledges the write to the client before all replicas have necessarily applied it. There's a small window — usually milliseconds, but it can spike under load — where the replica is behind. A read immediately after a write can land in that window and miss the row entirely, even though replication is healthy and will catch up moments later.",
    remember: "Async replication means commit-on-primary and apply-on-replica are not simultaneous — reading your own write from a replica right after writing it can race the lag.",
    interviewAnswer: "This is classic replication lag, not an error condition — the replica's replication thread is healthy, it's just asynchronous, so there's a small window after the primary commits where the replica hasn't applied that specific write yet. The user's request to read the confirmation page lands inside that window, gets a miss, and then a moment later the replica catches up and the order shows correctly, which matches the 'appears a second later' behavior described. The standard fix is to route read-your-write flows like this — immediately reading something you just wrote — to the primary, or to a replica you can confirm is caught up, rather than always defaulting reads to replicas.",
  },
  {
    id: "q-dbms-wal-001",
    subject: "DBMS",
    concept: "Write-Ahead Logging",
    difficulty: "hard",
    stem: "A Postgres instance running on a cloud VM loses power mid-write — the data files on disk are only partially updated. After the VM reboots and Postgres restarts, the database comes back up with all committed transactions intact and no corruption. The actual table/index files were never fsynced before the crash. How is this possible?",
    options: [
      {
        text: "Changes are appended to a sequential log flushed to persistent storage before modified data pages are written to the tables.",
        sub: "Write-ahead log flushing constraint",
        fix: "",
      },
      {
        text: "The database runs a background auto-repair process that detects mismatched page checksums and corrects them using parity blocks.",
        sub: "Checksum-based page recovery",
        fix: "Automatic repair processes (like Postgres autovacuum or InnoDB purge) handle space reclamation and table statistics, not physical crash recovery or reconstructing partially written pages after sudden power failure.",
      },
      {
        text: "The operating system guarantees that modified table pages in the kernel cache survive power outages via transactional file systems.",
        sub: "OS page cache persistence",
        fix: "Volatile operating system page caches do not survive power loss; transactional file systems protect metadata, but database engines must manage their own transactional guarantees to avoid data loss.",
      },
      {
        text: "The transaction manager delays committing operations until table-level locks are released and data pages are fully written.",
        sub: "Lock-release synchronization",
        fix: "Delaying commits until data pages are fully written (force policy) is extremely slow and doesn't prevent corruption if a power loss occurs mid-write; database engines instead use a no-force policy backed by logging.",
      },
    ],
    correctIndex: 0,
    proTip: "The WAL rule is simple but powerful: never let a data page hit disk before the log record describing the change that produced it. That ordering is what turns 'we crashed mid-write' into 'replay the log and we're fine' instead of 'the database is corrupt.'",
    lesson: "Write-ahead logging requires that any change to a data page is first described in a log record, and that log record is flushed to durable storage before the transaction is considered committed — well before the actual data page necessarily makes it to disk. On crash recovery, Postgres replays the WAL from the last checkpoint forward, reapplying committed changes and discarding uncommitted ones, which reconstructs a consistent state even though the data files themselves were never safely flushed.",
    remember: "WAL = log the change durably before the data page hits disk; recovery replays the log so a crash never loses a committed write or corrupts the table files.",
    interviewAnswer: "This is write-ahead logging doing exactly what it's designed for — Postgres never marks a transaction committed until the WAL record for that change has been flushed to durable storage, completely independent of whether the actual heap or index pages have been written out yet. So when the VM loses power mid-write, the data files can absolutely be left in a half-updated, inconsistent state, but that's fine because on restart Postgres replays the WAL from the last checkpoint and reapplies every committed change in order, which reconstructs a consistent database. It's the same reason you'll see Postgres do a brief 'recovery' pass on startup after an unclean shutdown — that pause is the WAL replay happening before it accepts new connections.",
  },
  {
    id: "q-dbms-n1-001",
    subject: "DBMS",
    concept: "N+1 Query Problem",
    difficulty: "medium",
    stem: "A Rails-style ORM endpoint lists 50 blog posts along with each post's author name. The endpoint works fine in dev with 5 seed posts but takes 4+ seconds in production with 50 posts. The query log shows 1 query to fetch the posts, followed by 50 separate queries, each fetching one author by id. What's the fix?",
    options: [
      {
        text: "Configure the data mapper to eager-load the relation using a join or a batched primary key lookup query.",
        sub: "Replaces 50 lookups with one JOIN or one IN(...) batch query",
        fix: "",
      },
      {
        text: "Distribute the sequential database queries across multiple read replicas to execute them in parallel.",
        sub: "Distributes the 50 queries across replicas",
        fix: "Spreading the same 50 round-trips across more database nodes still pays per-query network and planning overhead 50 times over; it reduces load on any single replica but doesn't fix the underlying access pattern.",
      },
      {
        text: "Serialize the resulting payload and cache it in a key-value store with a short time-to-live expiration.",
        sub: "Avoids hitting the database on repeat requests",
        fix: "Caching can mask the symptom for repeat requests, but the first request (and every cache miss) still triggers the same 51-query pattern, and it doesn't fix the inefficient access pattern itself.",
      },
      {
        text: "Create a database index on the foreign key column to optimize the individual secondary lookup queries.",
        sub: "Speeds up each lookup query",
        fix: "An index would make each of the 50 author lookups faster individually, but you'd still be paying 50 separate network round-trips; the real problem is query count, not per-query speed.",
      },
    ],
    correctIndex: 0,
    proTip: "If your query log shows '1 query, then N queries that each fetch one related row,' that's the N+1 problem — almost always fixable with an eager-load directive (`.includes`, `JOIN`, `select_related`, `WITH (...)`) that turns N round-trips into one.",
    lesson: "The N+1 problem happens when an ORM lazily loads a related object for each row in a result set, turning what should be one query (with a JOIN) or two queries (with a batched IN(...) lookup) into N+1 separate round-trips. It's invisible with small dev datasets because N is tiny, then becomes a major latency and database-load issue once N scales to production volumes. Most ORMs provide an explicit eager-loading mechanism (Rails' `.includes`, Django's `select_related`/`prefetch_related`, SQLAlchemy's `joinedload`) specifically to collapse this pattern.",
    remember: "N+1 = 1 query for the list plus N queries for each row's related data; fix it by eager-loading (JOIN or batched IN) instead of lazy-loading per row.",
    interviewAnswer: "The query log pattern — one query for the posts, then exactly 50 more, one per post — is the textbook signature of the N+1 problem: the ORM is lazily fetching each post's author individually as it iterates the result set, instead of fetching them all together. It's invisible in dev with 5 posts because 6 queries is nothing, but at 50 posts in production you're paying 51 network round-trips serially, which easily adds up to multiple seconds. The fix is to eager-load the association — a JOIN if you want it in one query, or a batched `WHERE id IN (...)` if you want it in two — so the author count goes from N queries down to one, regardless of how many posts are on the page.",
  },
  {
    id: "q-dbms-migration-001",
    subject: "DBMS",
    concept: "Schema Migration Safety",
    difficulty: "hard",
    stem: `A team runs the following migration statement against a Postgres 10 production table with 80 million rows during business hours:

\`\`\`sql
ALTER TABLE users ADD COLUMN plan_tier TEXT NOT NULL DEFAULT 'free';
\`\`\`

The database acquires an exclusive lock, and the table becomes completely unavailable for reads and writes for several minutes, causing a production outage. What is the safest way to have made this change?`,
    options: [
      {
        text: "Create a duplicate table with the new schema and dual-write to both tables until they are fully synchronized.",
        sub: "Manual dual-write shadow table",
        fix: "This pattern (used for genuinely incompatible schema changes) is significantly more operationally complex and risky than necessary here — a NOT NULL column with a default is a well-understood case with a much simpler safe path.",
      },
      {
        text: "Wrap the migration query in a database transaction block so it can be rolled back immediately if execution stalls.",
        sub: "Transactional DDL as a safety net",
        fix: "A transaction makes the change atomic and rollback-able if it fails, but it doesn't reduce lock duration or table unavailability while the statement is running — Postgres still has to rewrite the table under an exclusive lock either way.",
      },
      {
        text: "Add the column as nullable with no default, backfill values in batches, then apply the NOT NULL constraint.",
        sub: "Splits the change into a cheap DDL step plus incremental backfill",
        fix: "",
      },
      {
        text: "Execute the same migration statement during a low-traffic window when concurrent query activity is at its lowest.",
        sub: "Same lock, less concurrent traffic",
        fix: "This reduces the blast radius but not the root cause: on Postgres versions before 11, adding a column with a non-null default still requires rewriting every existing row while holding an exclusive lock, so the table is still unavailable for the duration, just to fewer users.",
      },
    ],
    correctIndex: 2,
    proTip: "On Postgres 11+, adding a column with a constant DEFAULT is metadata-only and instant — but a NOT NULL constraint still requires a full table validation scan. When in doubt (or on older Postgres), do it in stages: nullable column → backfill → constraint.",
    lesson: "Before Postgres 11, adding a column with a non-null DEFAULT required rewriting every row to populate the new value, all under an ACCESS EXCLUSIVE lock that blocks reads and writes on the table for the entire rewrite. The safe pattern decomposes this into low-risk steps: add the column as nullable with no default (fast metadata-only change), backfill existing rows in small batches in separate transactions to avoid long locks, then add the NOT NULL constraint (or a validated CHECK constraint, which in modern Postgres can skip re-scanning already-validated rows). This trades one long blocking operation for several short, low-impact ones.",
    remember: "Big tables + NOT NULL + DEFAULT in one ALTER TABLE = table rewrite under an exclusive lock; split it into add-nullable, backfill in batches, then constrain.",
    interviewAnswer: "The outage happened because adding a NOT NULL column with a default forces Postgres to rewrite all 80 million rows under an ACCESS EXCLUSIVE lock, and on Postgres 10 that's not optimized away — the whole table is unavailable until the rewrite finishes. The safe version of this migration splits it into stages: first add the column as nullable with no default, which is a near-instant metadata-only change; then backfill the value for existing rows in small batches inside their own short transactions so you're never holding a long lock; then add the NOT NULL constraint at the end. Each individual step is fast and low-impact, even though the end result is the same schema — the lesson generalizes to basically every 'looks like one DDL statement but touches every row' migration.",
  },
  {
    id: "q-dbms-optlock-001",
    subject: "DBMS",
    concept: "Optimistic Locking",
    difficulty: "medium",
    stem: `Two warehouse employees open the same inventory record (quantity: 10) in a web app at the same time. Employee A ships 3 units and saves; the app sets quantity to 7. Employee B, still looking at the stale quantity: 10, ships 4 units and saves, setting quantity to 6 — silently erasing A's update.

To resolve this, the team adds a \`version\` integer column and changes the write operation to use:

\`\`\`sql
UPDATE inventory SET quantity = ?, version = version + 1
WHERE id = ? AND version = ?;
\`\`\`

The query is rejected if zero rows match. What problem does this solve, and what must the app now do?`,
    options: [
      {
        text: "It forces the database engine to upgrade the transaction isolation level to serializable automatically.",
        sub: "Isolation level change",
        fix: "Adding a version column and conditioning the UPDATE on it is an application-level (optimistic) concurrency check; it doesn't change the database's transaction isolation level at all.",
      },
      {
        text: "It enforces referential integrity constraints between the inventory table and the orders tracking table.",
        sub: "Foreign key style protection",
        fix: "No foreign key relationship is involved here; the version column protects against concurrent updates to the same row, not relationships between tables.",
      },
      {
        text: "It prevents transaction deadlocks by avoiding locks, requiring no extra error handling logic in the app.",
        sub: "Lock-free by design, no app changes needed",
        fix: "Deadlocks weren't the problem described — this scenario never had two transactions waiting on each other's locks. And the app does need to change: it must detect the zero-rows-affected case and handle it (retry or surface a conflict), otherwise B's write would just silently disappear instead of overwriting A's.",
      },
      {
        text: "It detects lost updates by validating the version, requiring the app to check row counts and handle retries.",
        sub: "Version mismatch signals a conflicting concurrent write",
        fix: "",
      },
    ],
    correctIndex: 3,
    proTip: "Optimistic locking trades 'block everyone else while I hold this row' for 'let everyone proceed, but reject anyone whose read is now stale.' It's cheap and lock-free, but only works if the app actually checks the affected-row count and handles the conflict — silently ignoring a 0-row UPDATE is just a different way to lose data.",
    lesson: "This is the classic lost update anomaly: B overwrites A's change because B never knew the row had moved since it was read. Optimistic locking fixes it without taking any database locks — each row carries a version (or updated_at timestamp), reads capture the current version, and writes are conditioned on that version still matching. If another transaction updated the row in between, the WHERE clause matches zero rows and the UPDATE silently affects nothing, so the application must explicitly check the row count and respond (typically by retrying with fresh data or showing the user a conflict).",
    remember: "Optimistic locking = condition the UPDATE on the version you read; zero rows affected means someone else changed it first, and the app must detect and handle that, not just trust the write succeeded.",
    interviewAnswer: "What was happening before is a lost update — B read the inventory row before A's write landed, so B's save silently clobbers A's change with no error and no warning. The version column fixes this by making every UPDATE conditional on the row still being at the version you originally read; if A already moved it from version 1 to version 2, B's UPDATE WHERE version = 1 matches zero rows and does nothing. The crucial part is that the application has to actually check that affected-row count — if it ignores it and assumes success, you've just turned a silent data-loss bug into a silent no-op bug. The right behavior is to detect the zero-row case and either retry with the fresh row or surface a 'someone else already updated this' conflict to the user.",
  },
  {
    id: "q-dbms-fts-001",
    subject: "DBMS",
    concept: "Full-Text Search vs LIKE",
    difficulty: "medium",
    stem: `A support ticket search box runs the following query against a table with 2 million rows:

\`\`\`sql
SELECT * FROM tickets WHERE body LIKE '%refund%';
\`\`\`

There is a B-tree index on \`body\`, but the query execution plan shows a full table scan and takes over 3 seconds. The application must support fast keyword search that also matches related word forms (e.g., "refunding", "refunded"). How should this be resolved?`,
    options: [
      {
        text: "Increase the session's work_mem allocation to allow the database to cache the table scans in RAM.",
        sub: "Increase memory buffer limits",
        fix: "work_mem affects sort and hash operations in RAM, not sequential scan throughput; it does not prevent a table scan or resolve the inability to match word forms like 'refunding'.",
      },
      {
        text: "Convert the target field to normalized lexemes and index them using a Generalized Inverted Index.",
        sub: "Lexeme tokenization and GIN index lookup",
        fix: "",
      },
      {
        text: "Create a composite B-tree index combining the text field with the primary key to enable index-only scans.",
        sub: "Composite index covering",
        fix: "A composite B-tree index is useless here because a double-wildcard LIKE pattern ('%refund%') lacks a starting prefix, meaning the optimizer cannot perform index range scans and must read all rows.",
      },
      {
        text: "Rebuild the existing B-tree index with a reduced fillfactor to improve internal node block density.",
        sub: "Adjust index storage fillfactor",
        fix: "Changing the fillfactor adjusts how much space is left on index pages for updates to reduce page splits; it cannot enable a B-tree index to support double-wildcard substring scans or handle word stemming.",
      },
    ],
    correctIndex: 1,
    proTip: "A B-tree index can only be used by LIKE when the pattern has no leading wildcard (`'refund%'` can use it, `'%refund%'` can't). For real keyword search — including matching different word forms — you want a search-purpose index (GIN over tsvector, or a dedicated search engine), not a bigger or differently-tuned B-tree.",
    lesson: "A standard B-tree index stores values in sorted order and can only be searched efficiently via a prefix, so a `LIKE '%refund%'` pattern (wildcard on both ends) can't use it at all — Postgres falls back to scanning every row. Full-text search solves a fundamentally different problem: it tokenizes text into words, normalizes them (stemming 'refunding'/'refunded' down to 'refund'), and builds an inverted index (GIN over a `tsvector`) mapping tokens to rows, which makes keyword lookups fast and also handles word-form variation that LIKE can never match.",
    remember: "LIKE '%word%' can't use a B-tree index (no usable prefix) and can't match word forms; full-text search (tsvector/GIN or a search engine) solves both problems via tokenization and an inverted index.",
    interviewAnswer: "The B-tree index is useless here because `LIKE '%refund%'` has a wildcard on both sides — there's no fixed prefix for the index to seek on, so Postgres has no choice but to scan all 2 million rows and check each one. Even if it could use the index, B-tree equality/prefix matching would never catch 'refunding' or 'refunded' as matches for 'refund' anyway. The right tool is full-text search: convert the body column into a tsvector, stem and tokenize it so 'refund', 'refunding', and 'refunded' all normalize to the same lexeme, and back it with a GIN index, which turns this into a fast inverted-index lookup instead of a row-by-row string scan. For something heavier-duty than Postgres's built-in full-text search, you'd reach for Elasticsearch, but the core idea — tokenize and index, don't substring-scan — is the same.",
  },
  {
    id: "q-dbms-fk-001",
    subject: "DBMS",
    concept: "Foreign Key Cascade Behavior",
    difficulty: "hard",
    stem: "An admin deletes a single user from the `users` table in production. Within seconds, that user's orders, order line items, and payment records all silently disappear too — far more data loss than the admin intended, and there's no audit trail of what happened. The orders table has `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`. What's the safest fix?",
    options: [
      {
        text: "Modify the current foreign key definition to `ON DELETE SET NULL`, instructing the database to nullify the foreign key values in dependent records, thus retaining the rows but dissociating them from the parent user.",
        sub: "Retains dependent records by dissociating foreign keys.",
        fix: "While preventing deletion, setting foreign keys to NULL often breaks historical traceability and data relationships, making it challenging for reporting, analytics, or regulatory compliance, which is frequently worse than explicit deletion.",
      },
      {
        text: "Completely revoke the referential integrity constraint (`FOREIGN KEY`) from the `orders` table to prevent any automatic, database-managed cascading delete operations from occurring.",
        sub: "Abolishes database-enforced referential integrity.",
        fix: "Removing the foreign key constraint is a severe measure that eliminates data integrity guarantees, leading to potential data inconsistencies, orphaned records, and complex issues that must then be managed manually at the application layer.",
      },
      {
        text: "Configure the foreign key to `ON DELETE RESTRICT` (or `NO ACTION`), and implement user data disposal through an explicit, auditable application process, such as soft-deletion.",
        sub: "Enforce explicit and auditable data lifecycle management.",
        fix: "",
      },
      {
        text: "Proactively create a highly-selective B-tree index on the `orders.user_id` foreign key column to significantly accelerate the existing `ON DELETE CASCADE` referential action, enhancing deletion speed.",
        sub: "Accelerates referential integrity operations.",
        fix: "An index primarily enhances query and join performance, and while it might speed up the cascade, it fundamentally fails to address the root problem of unintended data loss and lack of audit trail from automatic cascading deletes.",
      },
    ],
    correctIndex: 2,
    proTip: "ON DELETE CASCADE is great for true ownership chains where child rows are meaningless without the parent (e.g., deleting a blog post should delete its comments). It's dangerous for anything with financial, legal, or audit implications — orders and payments should almost never auto-delete just because a user row did.",
    lesson: "ON DELETE CASCADE is a database-enforced, automatic, and silent side effect: deleting one row triggers deletion of every dependent row across the whole reference chain, with no application-level logging or confirmation. For data with real business or compliance weight (orders, payments, financial records), the safer default is RESTRICT/NO ACTION, which blocks the delete until dependents are handled explicitly, paired with an application-level deletion or anonymization workflow that can log who did what and why (or a soft-delete flag instead of a hard delete at all).",
    remember: "ON DELETE CASCADE silently deletes the whole dependent chain with no audit trail — reserve it for true parent-owns-child data, and use RESTRICT plus an explicit, logged deletion workflow for anything financial or compliance-sensitive.",
    interviewAnswer: "The root cause is that ON DELETE CASCADE turned one admin action — deleting a user — into an automatic, silent deletion of orders, line items, and payments, with the database doing it as a side effect and nothing logging that it happened. The fix is to change the constraint to ON DELETE RESTRICT so the database refuses the delete if dependent rows exist, and move the actual 'remove this user's data' decision into application code that can be explicit and audited — log who initiated it, maybe require confirmation, and decide deliberately whether to hard-delete, anonymize, or soft-delete the related orders and payments. I'd avoid ON DELETE SET NULL too, since for financial records you usually want to keep the order-to-user link intact for reporting and compliance, not silently sever it.",
  },
  {
    id: "q-dbms-covidx-001",
    subject: "DBMS",
    concept: "Covering Indexes & EXPLAIN ANALYZE",
    difficulty: "hard",
    stem: `A query runs against a table with an index on \`customer_id\`:

\`\`\`sql
SELECT order_id, status FROM orders WHERE customer_id = 42;
\`\`\`

EXPLAIN ANALYZE shows an 'Index Scan using idx_customer_id' followed by a 'Heap Fetches: 8000' line, and the query is slower than expected. Which index configuration would eliminate the heap fetches?`,
    options: [
      {
        text: "Modify the index on customer_id to include the status column, or create a composite index on both columns.",
        sub: "Index contains all needed query columns to avoid heap lookups.",
        fix: "",
      },
      {
        text: "Rebuild the current B-tree index as a hash index on customer_id to perform faster direct key match lookups.",
        sub: "Utilize a hash structure for faster direct matches.",
        fix: "Hash indexes do not support index-only scans and cannot store additional columns like `status`, preventing the elimination of heap fetches.",
      },
      {
        text: "Re-phrase the search query to include status filters in the WHERE clause to restrict the returned row count.",
        sub: "Narrow down rows with an additional filter condition.",
        fix: "Filtering on `status` reduces row count, but doesn't change how `status` is retrieved if not in the index, thus not eliminating heap fetches.",
      },
      {
        text: "Run a full database vacuum command on the orders table to update index statistics and reclaim fragmented pages.",
        sub: "Perform table-level maintenance and compaction.",
        fix: "VACUUM FULL compacts the table and improves statistics but does not add columns to an index required for index-only scans.",
      },
    ],
    correctIndex: 0,
    proTip: "'Heap Fetches' in EXPLAIN ANALYZE output is your signal that Postgres found the row via the index but still had to go to the table to get column data the index doesn't store. Add those columns to the index (via INCLUDE or as extra key columns) and the heap fetches can drop toward zero.",
    lesson: "An index-only scan satisfies a query entirely from the index, without visiting the heap (table), but only if every column the query needs is present in the index and the relevant pages are marked all-visible in the visibility map. Here the index only covers customer_id, so even though it locates matching rows efficiently, Postgres still has to fetch each row from the heap to read order_id and status — that's the 'Heap Fetches' work. Making the index a covering index, by adding status as an INCLUDE column (or as a regular composite column), lets the index itself answer the whole SELECT, eliminating the heap visits.",
    remember: "Heap Fetches in EXPLAIN ANALYZE means the index found the row but didn't have the requested columns — add those columns to the index (INCLUDE or composite) to get a true index-only scan.",
    interviewAnswer: "The 'Heap Fetches: 8000' line is the tell — Postgres is using the index to find matching rows fast, but the index on customer_id alone doesn't store order_id or status, so for every matching row it still has to jump over to the heap to read those columns, which is exactly the random I/O an index-only scan is supposed to avoid. The fix is to make the index cover the whole query: either add status as an INCLUDE column on the customer_id index, or make it a composite (customer_id, status) index, so order_id (the indexed/included key) and status are both readable straight from the index pages. Once every selected column lives in the index, and assuming the table's visibility map is reasonably up to date, EXPLAIN should switch to a true 'Index Only Scan' with heap fetches near zero.",
  },
  {
    id: "q-dbms-idem-001",
    subject: "DBMS",
    concept: "Idempotency Keys",
    difficulty: "hard",
    stem: "A mobile app calls POST /charge to bill a customer's card. On a flaky connection, the client times out waiting for a response and automatically retries the same request. The server actually processed the first request successfully — the customer is charged twice for one order. The team wants to fix this without making the client wait longer or removing retries (retries are needed for real transient failures). What should they add?",
    options: [
      {
        text: "Adjust the client's request timeout limits to be indefinitely long so connections are never terminated.",
        sub: "Avoid triggering the retry at all",
        fix: "A longer timeout reduces how often this happens but doesn't eliminate the race — the server can still complete a charge just after the client gives up and retries (or the response can be lost in transit even if processing finished), so duplicate charges remain possible.",
      },
      {
        text: "Wrap the transaction in serializable isolation so concurrent charges on the same card are serialised.",
        sub: "Strongest isolation level",
        fix: "Serializable isolation prevents anomalies between concurrent transactions reading/writing the same data, but the two retried requests are two separate, sequential transactions, each fully valid on its own — isolation level has no way to know they represent 'the same logical charge attempt.'",
      },
      {
        text: "Modify the card charging endpoint to use GET instead of POST so that the retries are natively idempotent.",
        sub: "Use a 'safe' HTTP method",
        fix: "Changing the HTTP verb doesn't change what the operation does server-side — charging a card is inherently a side-effecting write, and GET semantics don't make a non-idempotent operation idempotent; this also misuses GET for a mutating action.",
      },
      {
        text: "Require the client to submit a unique request identifier with the payload to allow deduplication on the server.",
        sub: "Client key for server deduplication.",
        fix: "",
      },
    ],
    correctIndex: 3,
    proTip: "Idempotency keys move the 'did this already happen?' question from 'hope the network behaves' to 'ask the database,' via a unique constraint on (idempotency_key) that the second insert attempt will violate, letting the server just return the original result instead of repeating the side effect.",
    lesson: "Network timeouts are ambiguous: the client doesn't know if the request was lost, the server crashed before processing, or the server succeeded and only the response was lost. Blind retries on a non-idempotent operation like 'charge a card' can therefore duplicate the side effect. Idempotency keys solve this at the application layer: the client generates one key per logical attempt (often a UUID) and sends it with every retry of that same attempt; the server records processed keys (typically via a unique index) and, on seeing a repeat key, returns the stored result of the original attempt instead of executing the charge again.",
    remember: "Network timeouts are ambiguous about whether the write actually happened — idempotency keys let the server recognize a retried request as 'the same attempt' and return the original result instead of repeating a side effect like a charge.",
    interviewAnswer: "The core problem is that a timeout is genuinely ambiguous — the client has no way to know whether the original charge succeeded, failed, or is still in flight, so a 'safe' retry of a non-idempotent POST can easily double-charge the customer, and you can't fix that just by waiting longer or removing retries, since you need retries for real transient failures. The standard fix is an idempotency key: the client generates one key per logical charge attempt and sends it on the original request and every retry of that same attempt, and the server enforces a unique constraint on that key — typically storing it alongside the charge result — so when the retry arrives, the insert collides with the original, and the server just returns the first attempt's result instead of charging the card again. It pushes the 'have I seen this exact attempt before?' question onto the database, where a unique constraint can answer it reliably even under concurrent retries.",
  },
];
