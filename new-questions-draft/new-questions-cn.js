export const NEW_CN = [
  {
    id: "q-cn-websockets-001",
    subject: "CN",
    concept: "WebSockets vs Polling",
    difficulty: "medium",
    stem:
      "A chat app currently has the browser send a GET request to the server every 2 seconds asking 'any new messages?'. Product complains about laggy delivery and the backend team complains about server load from constant empty-response requests at scale. An engineer proposes switching to WebSockets. What's the core mechanical reason this fixes both problems?",
    options: [
      {
        text: "WebSockets upgrade the HTTP connection to a persistent, full-duplex TCP connection, so the server can push messages the instant they exist instead of waiting to be asked",
        sub: "Single long-lived connection, server-initiated push",
        fix: "",
      },
      {
        text: "WebSockets compress the JSON payload so each poll is smaller and faster",
        sub: "Smaller request/response bodies",
        fix:
          "Payload compression isn't what WebSockets provide or what fixes polling lag — the issue is the request/response cycle itself, not message size.",
      },
      {
        text: "WebSockets automatically batch multiple users' messages into one TCP packet to reduce server load",
        sub: "Packet-level batching",
        fix:
          "WebSockets don't perform cross-user batching; the server load reduction comes from eliminating constant repeated polling requests, not packet batching.",
      },
      {
        text: "WebSockets use UDP instead of TCP, which has lower latency per message",
        sub: "Faster transport protocol",
        fix:
          "WebSockets run over TCP (starting as an HTTP Upgrade handshake), not UDP. The latency win is from push-based delivery on one persistent connection, not a transport swap.",
      },
    ],
    correctIndex: 0,
    proTip:
      "Polling pays a fixed cost (a full request/response, often with headers and connection setup) every interval regardless of whether there's new data. WebSockets pay that cost once at handshake, then it's pure push.",
    lesson:
      "Short polling repeats a stateless HTTP request/response cycle on a timer, which means both wasted requests when there's nothing new and added latency up to the polling interval when there is. A WebSocket starts as a normal HTTP request that gets upgraded (101 Switching Protocols) to a persistent, bidirectional TCP connection, so the server can write data to the client the moment it's available, with no per-message connection or header overhead.",
    remember: "WebSockets trade many repeated request/response cycles for one persistent connection where the server can push — eliminating both polling latency and empty-poll server load.",
    interviewAnswer: "The fundamental issue with polling every 2 seconds is that you're paying for a full HTTP request/response cycle on a timer regardless of whether there's actually new data, which wastes server resources on empty responses and still leaves up to 2 seconds of lag on real messages. WebSockets fix this because the connection starts as a normal HTTP request but gets upgraded via a 101 status into a persistent, full-duplex TCP connection — after that handshake, the server can just write a message down the socket the instant it exists, no new connection, no repeated headers, no polling interval to wait out. That's why it solves both the latency complaint and the server load complaint at the same time, they're really the same root cause.",
  },
  {
    id: "q-cn-quic-001",
    subject: "CN",
    concept: "HTTP/3 and QUIC",
    difficulty: "hard",
    stem:
      "A mobile video-streaming app serves users on flaky cellular networks. Engineers notice that under HTTP/2, a single dropped packet for one video segment request stalls delivery of other in-flight segments on the same connection, even though those segments' data already arrived. After migrating to HTTP/3, this no longer happens. What changed?",
    options: [
      {
        text: "HTTP/3 runs over QUIC (UDP-based), where each stream has independent loss recovery, so one stream's packet loss no longer blocks delivery of data already received on other streams",
        sub: "Per-stream loss recovery at the transport layer",
        fix: "",
      },
      {
        text: "HTTP/3 removes the use of multiple streams entirely, sending one request at a time",
        sub: "Single-stream model",
        fix:
          "HTTP/3 still multiplexes many streams over one connection, like HTTP/2 — it doesn't drop multiplexing. The fix is that QUIC's loss recovery is per-stream instead of connection-wide.",
      },
      {
        text: "HTTP/3 retries failed requests automatically at the application layer before the client notices",
        sub: "App-layer auto-retry",
        fix:
          "QUIC doesn't add an application-layer retry mechanism for this; the improvement is structural — TCP's single byte-stream ordering is replaced by QUIC streams that don't block each other on loss.",
      },
      {
        text: "HTTP/3 uses larger packet sizes so fewer packets are needed, reducing the chance of loss",
        sub: "Bigger packets, fewer drops",
        fix:
          "QUIC doesn't rely on larger packets to solve this, and larger packets would actually increase fragmentation risk on constrained links. The fix is independent per-stream delivery, not packet sizing.",
      },
    ],
    correctIndex: 0,
    proTip:
      "TCP head-of-line blocking happens because TCP guarantees one strictly ordered byte stream — a lost packet stalls everything behind it, even unrelated HTTP/2 streams multiplexed on top. QUIC moves multiplexing into the transport itself, so loss on one stream doesn't stall the others.",
    lesson:
      "HTTP/2 multiplexes multiple logical streams over a single TCP connection, but TCP itself only knows about one ordered byte stream — so a single lost packet forces TCP to hold back all bytes after it for retransmission, stalling every HTTP/2 stream sharing that connection (transport-level head-of-line blocking). QUIC, the transport HTTP/3 runs on, is built on UDP and implements multiple independent streams natively, so packet loss on one stream only pauses that stream while the others continue delivering already-arrived data.",
    remember: "HTTP/2's head-of-line blocking lives in TCP itself, not HTTP — QUIC fixes it by making each stream's loss recovery independent at the transport layer.",
    interviewAnswer: "This is the classic TCP head-of-line blocking problem that HTTP/3 was designed to solve. Under HTTP/2, you've got multiple streams multiplexed over one TCP connection, but TCP only guarantees one ordered byte stream — so if a packet for one video segment gets dropped on a flaky cellular link, TCP has to hold back everything that arrived after it, even bytes belonging to completely unrelated streams, until the retransmit lands. QUIC, which HTTP/3 runs on top of, is UDP-based and implements streams as a first-class transport concept, so each stream has its own independent loss recovery — losing a packet on one stream no longer stalls the others. That's exactly why this kind of stall disappears after the HTTP/3 migration on lossy networks.",
  },
  {
    id: "q-cn-tcp-retransmit-001",
    subject: "CN",
    concept: "TCP Retransmission & Timeouts",
    difficulty: "medium",
    stem:
      "A backend service calls a downstream API over TCP. Under normal conditions, p99 latency is 80ms. During a network blip where a handful of packets are dropped, some requests that should fail fast instead hang for 200ms-1s+ before completing or erroring, way longer than the blip itself lasted. Why does TCP latency spike so much more than the actual packet loss duration?",
    options: [
      {
        text: "TCP detects loss via retransmission timeout (RTO) or duplicate ACKs and must wait/retransmit before the connection can proceed, and RTO calculations (based on RTT estimates) can be much longer than the blip itself",
        sub: "Retransmission timeout dwarfs the actual outage",
        fix: "",
      },
      {
        text: "The application code has a hardcoded 1-second retry loop unrelated to TCP behavior",
        sub: "App-level retry logic",
        fix:
          "The stem describes this as a TCP/network-level latency spike correlated with packet loss, not an application retry policy — the mechanism in question is TCP's own loss recovery timing.",
      },
      {
        text: "DNS re-resolves the downstream hostname on every dropped packet, adding lookup latency",
        sub: "DNS lookup overhead",
        fix:
          "DNS resolution happens once per connection setup (or per TTL expiry), not per dropped packet within an established TCP connection — it doesn't explain mid-connection stalls from packet loss.",
      },
      {
        text: "The TLS session is renegotiated after any packet loss, adding a full handshake's worth of latency",
        sub: "TLS renegotiation on loss",
        fix:
          "TCP packet loss doesn't trigger TLS renegotiation; TLS operates above TCP and is unaffected by lower-layer retransmissions as long as the underlying bytes eventually arrive in order.",
      },
    ],
    correctIndex: 0,
    proTip:
      "Fast retransmit (triggered by 3 duplicate ACKs) is quick, but if loss isn't caught that way, TCP falls back to RTO — and RTO is deliberately conservative, often starting around 1 second and backing off exponentially, which is why a millisecond-scale network blip can produce second-scale application latency.",
    lesson:
      "TCP guarantees ordered, reliable delivery, so when a segment is lost it must be detected and retransmitted before later data can be delivered to the application. Detection happens either fast (three duplicate ACKs trigger immediate fast retransmit) or slow (a retransmission timeout fires, calculated from smoothed RTT and variance, often defaulting to roughly 1 second minimum and doubling on repeated loss). A blip lasting only milliseconds can therefore cause multi-hundred-millisecond to multi-second stalls if the loss happens to require an RTO rather than a fast retransmit.",
    remember: "TCP loss recovery is asymmetric: duplicate-ACK fast retransmit is quick, but falling back to retransmission timeout (RTO) can cost hundreds of milliseconds to seconds — far longer than the packet loss itself.",
    interviewAnswer: "This is TCP's retransmission mechanics at work. When packets get dropped, TCP has two ways to recover: fast retransmit, triggered by three duplicate ACKs, which is quick, or falling back to a retransmission timeout if duplicate ACKs don't arrive — and RTO is calculated conservatively from smoothed round-trip-time estimates, often with an effective floor around a second and exponential backoff on repeated loss. So a network blip that only lasts a few milliseconds can still force a connection into an RTO-based recovery that takes hundreds of milliseconds to over a second, because the timeout duration is sized for safety against false positives, not for the actual length of the outage. That mismatch between blip duration and recovery duration is exactly why you're seeing latency spikes much bigger than the network event itself.",
  },
  {
    id: "q-cn-nagle-001",
    subject: "CN",
    concept: "Nagle's Algorithm & Delayed ACK",
    difficulty: "hard",
    stem:
      "A low-latency trading client sends small (a few bytes) TCP messages to a server and expects a small ACK-triggered response quickly. Instead, engineers observe consistent ~40ms delays on many of these small writes, suspiciously close to a common delayed-ACK timer value. Both Nagle's algorithm (sender side) and delayed ACK (receiver side) are enabled by default. What's actually happening?",
    options: [
      {
        text: "Nagle's algorithm holds the small outgoing segment waiting for an ACK of previous unacked data, while the receiver's delayed ACK is waiting to piggyback its ACK on a reply instead of sending it immediately — each side is waiting on the other, producing the characteristic ~40ms stall",
        sub: "Nagle + delayed ACK deadlock-like interaction",
        fix: "",
      },
      {
        text: "The server's CPU is overloaded and queues incoming packets for 40ms before processing",
        sub: "Server-side CPU contention",
        fix:
          "A CPU-queueing explanation wouldn't produce a delay this consistent and specific to small writes, nor would it correlate with a known delayed-ACK timer value — this is the textbook Nagle/delayed-ACK interaction.",
      },
      {
        text: "The OS is batching small TCP writes into the next scheduler tick at a fixed 40ms interval",
        sub: "Kernel write batching",
        fix:
          "There's no general-purpose OS write-batching mechanism on this timescale tied to TCP sends; the specific, well-known cause of ~40ms stalls on small TCP writes is the Nagle/delayed-ACK interaction.",
      },
      {
        text: "TLS record buffering is holding small messages until a full record's worth of data accumulates",
        sub: "TLS record-layer buffering",
        fix:
          "TLS record buffering isn't tied to a ~40ms timer and is a separate concern from this classic transport-layer interaction; the delay matches the known Nagle's algorithm + delayed ACK pattern.",
      },
    ],
    correctIndex: 0,
    proTip:
      "The fix for latency-sensitive small-message workloads is almost always to disable Nagle's algorithm with TCP_NODELAY on the socket — that alone removes the sender-side hold, sidestepping the standoff with delayed ACK.",
    lesson:
      "Nagle's algorithm tries to reduce overhead from many tiny packets by holding a small segment if there's unacknowledged data already in flight, waiting either for an ACK or enough data to fill a full segment. Delayed ACK tries to reduce ACK-only packets by waiting (commonly up to ~40ms) to see if the receiver will send a reply it can piggyback the ACK onto. When both are active, the sender can be waiting for an ACK that the receiver is deliberately delaying, and the receiver is waiting for data that the sender isn't sending yet — producing a recurring stall close to the delayed-ACK timeout. Setting TCP_NODELAY on the sending socket disables Nagle's algorithm and eliminates this interaction.",
    remember: "Small TCP writes stalling for ~40ms is the textbook Nagle's-algorithm-vs-delayed-ACK standoff — fix it with TCP_NODELAY on latency-sensitive sockets.",
    interviewAnswer: "This is the classic Nagle's algorithm and delayed ACK interaction. Nagle's algorithm on the sender holds back small segments when there's already unacknowledged data outstanding, waiting for either an ACK or enough buffered data to send a full segment — it's meant to cut down on tiny-packet overhead. Meanwhile the receiver's delayed ACK is deliberately not sending an immediate ACK, hoping to piggyback it on an actual response, often waiting up to around 40ms before sending a bare ACK. Put those together and you get a standoff: the sender's waiting on an ACK the receiver is sitting on, and the receiver's waiting for more data the sender won't send until it gets that ACK. For a latency-sensitive client like a trading system, the standard fix is setting TCP_NODELAY on the socket to disable Nagle's algorithm entirely, since you'd rather eat the overhead of more small packets than tens of milliseconds of stall.",
  },
  {
    id: "q-cn-tls-expiry-001",
    subject: "CN",
    concept: "TLS Certificate Chain & Expiry",
    difficulty: "medium",
    stem:
      "At 2am, every client suddenly starts failing to connect to api.example.com with TLS errors like 'certificate has expired' or 'unable to verify the first certificate.' Nothing was deployed in the last 24 hours, and the leaf certificate's expiry date (checked in the cert itself) is still six months away. What's the most likely cause?",
    options: [
      {
        text: "An intermediate CA certificate in the chain served by the server expired, breaking chain validation even though the leaf certificate itself is still valid",
        sub: "Intermediate cert in the chain expired",
        fix: "",
      },
      {
        text: "The server's private key was rotated without updating clients",
        sub: "Key rotation mismatch",
        fix:
          "A private key rotation alone (with a matching valid cert still served) wouldn't produce 'certificate has expired' or chain-verification errors — those errors specifically point to an expired or broken certificate chain.",
      },
      {
        text: "DNS started resolving api.example.com to the wrong IP address",
        sub: "DNS misdirection",
        fix:
          "Wrong DNS resolution would typically cause connection failures or hostname mismatch errors, not 'certificate has expired' — and the leaf cert's own expiry was confirmed to be six months out, pointing to the chain instead.",
      },
      {
        text: "The client devices' clocks drifted forward by several months",
        sub: "Client-side clock skew",
        fix:
          "This would require every client device worldwide to have drifted in sync at the same moment, which is implausible — a server-side expired intermediate certificate explains a simultaneous, universal failure far better.",
      },
    ],
    correctIndex: 0,
    proTip:
      "Leaf certificate expiry isn't the only expiry that matters — intermediate CA certificates in the chain have their own expiry dates, and many outages are caused by an expired intermediate that nobody was monitoring because alerting was only set up for the leaf cert.",
    lesson:
      "TLS clients validate an entire certificate chain — leaf, one or more intermediates, up to a trusted root — and the chain is only valid if every certificate in it is currently valid, not just the leaf. Servers typically serve the intermediate(s) alongside the leaf in the TLS handshake; if an intermediate expires (or is revoked, or simply isn't served), validation fails with chain-related errors like 'unable to verify' or in some client implementations a generic 'expired' message, even though the leaf certificate's own dates are fine. Monitoring and renewal need to cover the full chain, not just the leaf.",
    remember: "TLS chain validation fails if ANY certificate in the chain is expired — monitor intermediate CA expiry too, not just the leaf certificate.",
    interviewAnswer: "Since the leaf certificate itself still has six months of validity, the failure has to be coming from somewhere else in the chain — and the most common real-world cause of a sudden, simultaneous, server-wide TLS failure like this is an expired intermediate CA certificate. Clients don't just check the leaf cert's dates, they validate the whole chain up to a trusted root, and if the server is serving an intermediate certificate that just hit its expiry, every client validating that chain starts failing at once, often with exactly these kinds of 'expired' or 'unable to verify' errors even though the leaf looks fine in isolation. The fix is to update the certificate bundle the server presents to include a current, non-expired intermediate, and going forward to monitor expiry on the entire chain, not just the leaf cert.",
  },
  {
    id: "q-cn-keepalive-001",
    subject: "CN",
    concept: "HTTP Keep-Alive & Connection Reuse",
    difficulty: "medium",
    stem:
      "A service makes frequent HTTP calls to a downstream API. After a code change that switched from a shared HTTP client instance to creating a brand-new HTTP client (and thus a new TCP+TLS connection) for every single request, p50 latency per call jumped from 5ms to 60ms even though the downstream API itself didn't change. What explains the jump?",
    options: [
      {
        text: "Each request now pays the full cost of TCP handshake plus TLS handshake from scratch instead of reusing an already-established keep-alive connection",
        sub: "Lost connection reuse, repeated handshake cost",
        fix: "",
      },
      {
        text: "The downstream API started rate-limiting the service due to higher request volume",
        sub: "Server-side rate limiting",
        fix:
          "Request volume per se didn't change — the same number of logical calls are being made — only how connections are established changed, and rate limiting wouldn't produce a uniform ~55ms per-call increase.",
      },
      {
        text: "DNS caching was disabled, so every request does a fresh DNS lookup",
        sub: "Per-request DNS lookups",
        fix:
          "The change described is about the HTTP client object and TCP connection, not DNS configuration — and DNS lookups alone (typically cached locally) don't usually account for a jump this large by themselves in this scenario.",
      },
      {
        text: "The new HTTP client uses HTTP/1.0 instead of HTTP/1.1 by default",
        sub: "Protocol version downgrade",
        fix:
          "Nothing in the scenario indicates a protocol version change, and an HTTP/1.0 vs 1.1 difference alone wouldn't explain a consistent ~12x latency increase the way losing connection reuse would.",
      },
    ],
    correctIndex: 0,
    proTip:
      "A reused keep-alive connection skips TCP's SYN/SYN-ACK/ACK and (for HTTPS) the TLS handshake entirely — that's often the majority of the latency on a fast downstream call, which is exactly why connection pooling matters so much for high-throughput services.",
    lesson:
      "HTTP keep-alive lets a client reuse one TCP (and TLS, for HTTPS) connection across multiple requests instead of tearing it down and reconnecting each time. Establishing a fresh connection costs at least one round trip for the TCP handshake plus, for TLS, additional round trips for the TLS handshake (key exchange, certificate validation) before any application data is even sent. Creating a brand-new HTTP client per request typically means a brand-new connection pool with nothing to reuse, so every call pays this setup cost — which is exactly the kind of fixed overhead that explains a jump like 5ms to 60ms with no change to the downstream service itself.",
    remember: "A shared HTTP client with keep-alive reuses TCP/TLS connections across requests; a fresh client per call means a fresh handshake per call — connection setup cost, not the server, explains the latency jump.",
    interviewAnswer: "This smells exactly like losing connection reuse. With a shared, long-lived HTTP client, keep-alive lets the client reuse an already-established TCP connection — and for HTTPS, an already-completed TLS handshake — across many requests, so a typical call is just sending the request and reading the response. Once you create a brand-new client per request, you're effectively starting a new connection pool with nothing in it every time, so each call has to redo the TCP three-way handshake and the full TLS handshake before any actual HTTP traffic happens. Those handshakes are round trips, and round trips are exactly the kind of fixed cost that would show up as a consistent latency jump like 5ms to 60ms without the downstream service itself changing at all. The fix is to go back to a shared, pooled client so connections get reused instead of recreated per call.",
  },
  {
    id: "q-cn-rate-limit-001",
    subject: "CN",
    concept: "Rate Limiting Strategies",
    difficulty: "medium",
    stem:
      "An API enforces 'max 100 requests per minute' using a fixed window: it counts requests in calendar-aligned 60-second buckets (e.g., 10:00:00-10:00:59) and resets the counter at each boundary. Engineers notice a client can send 100 requests at 10:00:59 and another 100 at 10:01:00, getting 200 requests through in roughly 2 seconds — double the intended rate. What's the issue, and what's a standard fix?",
    options: [
      {
        text: "Fixed windows allow bursts at window boundaries because the count resets sharply rather than tracking usage continuously; a sliding window (or sliding log/token bucket) algorithm fixes this by smoothing the limit across overlapping or continuously-evaluated time spans",
        sub: "Boundary burst is inherent to fixed windows",
        fix: "",
      },
      {
        text: "The rate limiter's counter has an off-by-one bug that allows exactly one extra request per window",
        sub: "Simple counting bug",
        fix:
          "The scenario describes a full 100 extra requests clustered at the boundary, not a one-off discrepancy — this is the well-known structural burst behavior of fixed windows, not a counting bug.",
      },
      {
        text: "The client is using multiple IP addresses to evade the rate limit",
        sub: "IP-based evasion",
        fix:
          "The scenario doesn't involve multiple IPs or identities — it's the same client exploiting the reset boundary of a single fixed window, a structural property of the algorithm rather than evasion.",
      },
      {
        text: "The load balancer is routing requests to multiple backend instances, each enforcing its own separate limit",
        sub: "Per-instance limiter inconsistency",
        fix:
          "While distributed rate limiting without shared state is a real separate problem, the scenario describes a single logical limiter and window reset behavior, which is the fixed-window boundary burst issue, not multi-instance inconsistency.",
      },
    ],
    correctIndex: 0,
    proTip:
      "Fixed-window counters are simple and cheap but allow up to 2x the intended rate right at the boundary. A sliding window log or sliding window counter (weighting the previous window's count) caps this at close to the true configured rate; a token bucket additionally allows controlled bursting by design rather than as an accidental side effect.",
    lesson:
      "Fixed-window rate limiting resets its counter at fixed calendar boundaries, so it only constrains requests within each independent window — it has no memory of how many requests happened just before the boundary. A client can therefore send the full quota right at the end of one window and the full quota again right at the start of the next, achieving roughly double the intended rate in a short burst around the boundary. Sliding window approaches (a sliding log of timestamps, or a weighted combination of the current and previous window's counts) evaluate the limit over a continuously moving time span instead of a fixed reset point, which removes this boundary-burst loophole; a token bucket takes a different approach, allowing bounded, intentional bursts while still capping the average rate.",
    remember: "Fixed-window rate limiters can let through up to 2x the configured rate in a burst straddling the window boundary — sliding window or token bucket algorithms close that gap.",
    interviewAnswer: "This is the classic fixed-window boundary burst problem. Because the limiter resets its counter at hard calendar boundaries, it has zero memory of what happened in the previous window — so a client can legitimately max out the quota in the last instant of one window and immediately max it out again in the first instant of the next, getting up to double the intended rate through in a very short burst. It's not a bug exactly, it's a structural weakness of fixed windows. The standard fix is to move to a sliding window approach — either keep a log of recent request timestamps and count how many fall within the last 60 seconds continuously, or use a weighted sliding window that blends the current and previous window's counts — or alternatively use a token bucket, which handles bursts by design with a controlled bucket size rather than letting them happen accidentally at a reset boundary.",
  },
  {
    id: "q-cn-etag-001",
    subject: "CN",
    concept: "HTTP Caching Headers (ETag / Cache-Control)",
    difficulty: "medium",
    stem:
      "A product page's hero image is served with `Cache-Control: max-age=86400`. Marketing swaps the image file at the same URL mid-afternoon for a flash sale, but many returning users still see the old image for up to 24 hours, even after a hard-ish refresh. Engineers want future swaps to be picked up immediately while still keeping aggressive caching for unchanged assets. What's the standard fix?",
    options: [
      {
        text: "Serve the asset with a strong validator like an ETag (or Last-Modified) so the browser can revalidate with a conditional request, or better, version the asset's URL/filename on each change so it's treated as a new resource entirely",
        sub: "Validator-based revalidation or cache-busting via URL versioning",
        fix: "",
      },
      {
        text: "Lower max-age to 0 for all assets on the page so nothing is ever cached",
        sub: "Disable caching site-wide",
        fix:
          "This solves staleness by sacrificing the performance benefit of caching entirely for every asset, not just ones that change — it's not the standard, targeted fix used in production.",
      },
      {
        text: "Tell users to clear their browser cache manually after each content update",
        sub: "Manual user action",
        fix:
          "This isn't a scalable or standard engineering fix — production systems handle this with cache-busting or validators, not by relying on end users to take manual action.",
      },
      {
        text: "Switch the image from being served over HTTPS to HTTP so caching behaves differently",
        sub: "Protocol downgrade",
        fix:
          "HTTP caching behavior (max-age, ETag, etc.) works the same way regardless of whether the connection is HTTP or HTTPS — the scheme isn't the relevant factor here, and downgrading would be a security regression.",
      },
    ],
    correctIndex: 0,
    proTip:
      "The most common production pattern is 'immutable, far-future cache + content-hashed filename': name the file something like hero.a1b2c3.jpg, set max-age to a year, and when content changes, the filename changes too — so there's never a stale-cache problem to solve, only a new URL to reference.",
    lesson:
      "A long max-age tells the browser it can serve the cached copy without even contacting the server until it expires, which is great for performance but means content changes at the same URL go unnoticed until expiry. Two standard fixes exist: add a validator (ETag or Last-Modified) so the browser, even while otherwise treating the asset as fresh, can be configured to revalidate and get a fast 304 Not Modified if unchanged or the new bytes if changed; or, more commonly for static assets, version the URL itself (a content hash or query param) so any content change naturally produces a new URL with its own fresh cache entry, leaving the old cached copy harmlessly orphaned.",
    remember: "Long max-age caching plus same-URL content swaps causes silent staleness — fix it with a validator (ETag) for revalidation, or better, version the asset URL so changed content is a new resource.",
    interviewAnswer: "The root problem is that max-age=86400 tells browsers they don't even need to ask the server again for a full day, so when marketing swapped the image bytes at the same URL, returning users' browsers had no way to know anything changed until that day expired. There are two standard ways to fix this: add a strong validator like an ETag so the browser can send a conditional request and get a fast 304 if nothing changed or fresh bytes if it did, or — what I'd actually recommend for a static asset like this — fingerprint the URL with a content hash, like hero.a1b2c3.jpg, so any time the image content changes, it's a genuinely new URL with its own fresh cache lifetime, and you can keep super aggressive caching, even mark it immutable, without ever worrying about staleness again.",
  },
  {
    id: "q-cn-mtu-001",
    subject: "CN",
    concept: "Packet Fragmentation & MTU",
    difficulty: "hard",
    stem:
      "After a service migrates to run inside an overlay network (VPN/VXLAN-style encapsulation) with an effective MTU of 1400 bytes instead of the standard 1500, clients report that small API calls work fine, but requests with larger payloads (file uploads, big JSON bodies) intermittently hang or time out, especially through certain corporate firewalls. What's the likely root cause?",
    options: [
      {
        text: "Packets exceeding the path MTU need fragmentation or a Path MTU Discovery response (ICMP 'fragmentation needed'), and some firewalls block the ICMP messages PMTUD relies on, causing oversized packets to silently vanish — a classic 'black hole' that only affects large payloads",
        sub: "Black-holed PMTUD due to blocked ICMP",
        fix: "",
      },
      {
        text: "The application's JSON parser has a buffer overflow on large payloads",
        sub: "Application-level parsing bug",
        fix:
          "The symptom is specifically tied to the MTU change introduced by the overlay network and interacts with firewall behavior, which points to a network-layer fragmentation/PMTUD issue, not an application parsing bug.",
      },
      {
        text: "TLS session resumption fails for larger requests, forcing a full handshake that times out",
        sub: "TLS resumption failure",
        fix:
          "TLS session resumption behavior isn't tied to request payload size in this way, and doesn't explain why the problem appeared specifically after the MTU change in the overlay network.",
      },
      {
        text: "The server's connection pool is exhausted under larger request sizes",
        sub: "Connection pool exhaustion",
        fix:
          "Connection pool exhaustion would typically show up as a general capacity/concurrency issue across request sizes, not one that correlates specifically with payload size crossing a newly-lowered MTU threshold.",
      },
    ],
    correctIndex: 0,
    proTip:
      "This is the 'PMTUD black hole' problem: it's not enough to set an MTU correctly — you also need ICMP 'fragmentation needed' (or 'packet too big' for IPv6) messages to actually get back to the sender. Many firewalls block ICMP by default for 'security,' which silently breaks Path MTU Discovery for exactly the large packets that need it.",
    lesson:
      "Every link in a network path has a maximum transmission unit; when a packet exceeds the smallest MTU along the path, it must either be fragmented or, more commonly today with the Don't Fragment (DF) bit set, dropped with an ICMP message telling the sender to use a smaller size — this is Path MTU Discovery. If a firewall along the path blocks ICMP (a common but harmful hardening practice), the sender never receives that signal: oversized packets are dropped silently and retransmitted at the same size, repeating forever until the connection times out. Small requests that fit under the reduced 1400-byte MTU are unaffected, which is exactly why only large payloads hang.",
    remember: "Path MTU Discovery relies on ICMP 'fragmentation needed' messages getting back to the sender — firewalls that block ICMP create a silent black hole for exactly the oversized packets that need PMTUD to work.",
    interviewAnswer: "This has the fingerprints of a Path MTU Discovery black hole. Once the overlay network drops the effective MTU to 1400, any packet that would have fit under 1500 but is now too big needs to either get fragmented or, since most stacks set the Don't Fragment bit by default, get dropped with an ICMP message telling the sender to retry smaller — that's PMTUD. The catch is some corporate firewalls block ICMP outright as a hardening measure, so that 'too big, retry smaller' signal never makes it back to the sender; the oversized packet just vanishes silently, and the connection retries at the same size forever until it times out. Small API calls stay under 1400 bytes so they're never affected, which is exactly why only the large uploads and big JSON bodies hang. The fix is usually to allow the relevant ICMP types through the firewall, or to clamp the TCP MSS at the network edge so endpoints never try to send packets bigger than the path can actually carry in the first place.",
  },
  {
    id: "q-cn-reverse-proxy-001",
    subject: "CN",
    concept: "Proxy vs Reverse Proxy",
    difficulty: "easy",
    stem:
      "A team puts Nginx in front of their application servers. Nginx terminates TLS, then forwards requests to whichever backend instance is healthy, and the backend servers have no public IP at all — clients only ever talk to Nginx. A junior engineer asks why this is called a 'reverse' proxy instead of just a proxy. What's the correct distinction?",
    options: [
      {
        text: "A forward proxy acts on behalf of clients (hiding/managing which client is making requests to the outside world); a reverse proxy acts on behalf of servers (hiding/managing which server actually handles a request), which matches Nginx sitting in front of the backend here",
        sub: "Whose identity the proxy is shielding — client side vs server side",
        fix: "",
      },
      {
        text: "A reverse proxy only handles encrypted traffic, while a forward proxy only handles plaintext traffic",
        sub: "Encryption-based distinction",
        fix:
          "Both forward and reverse proxies can handle encrypted or plaintext traffic; TLS termination is a feature a reverse proxy commonly performs, not the defining characteristic that makes it 'reverse.'",
      },
      {
        text: "A reverse proxy sends responses in reverse order from how requests arrived",
        sub: "Response ordering",
        fix:
          "Response ordering has nothing to do with the forward/reverse proxy distinction — the term refers to which side of the connection (client or server) the proxy represents.",
      },
      {
        text: "A reverse proxy is just a forward proxy running on the same machine as the server",
        sub: "Co-location-based distinction",
        fix:
          "Physical or network co-location isn't the defining factor — reverse proxies are commonly deployed on separate machines (e.g., a dedicated load balancer tier) from the application servers they front.",
      },
    ],
    correctIndex: 0,
    proTip:
      "Quick mental test: if the proxy is protecting/representing the client (e.g., a corporate proxy controlling employee internet access), it's a forward proxy. If it's protecting/representing the server (e.g., Nginx, a CDN edge, a load balancer), it's a reverse proxy — clients often don't even know it's there.",
    lesson:
      "A forward proxy sits between clients and the broader internet, acting on the client's behalf — clients are typically configured to know about and use it (e.g., corporate egress proxies, VPN-style proxies), and the destination server may not know the real client is behind a proxy. A reverse proxy sits in front of one or more backend servers and acts on their behalf, receiving requests as if it were the server; the client usually has no idea which backend instance actually handled the request, or that there even are multiple backend instances. Nginx terminating TLS and routing to healthy backend instances, with those backends having no public exposure, is the textbook reverse proxy setup.",
    remember: "Forward proxy = represents the client to the world; reverse proxy = represents the server(s) to the world — Nginx in front of app servers is reverse because clients only ever see Nginx, never the real backend.",
    interviewAnswer: "The distinction is about whose side of the connection the proxy is representing. A forward proxy sits in front of clients and acts on their behalf out toward the internet — think a corporate proxy that all employee traffic goes through, where the destination server just sees the proxy, not the real client. A reverse proxy is the mirror image: it sits in front of one or more servers and acts on their behalf, so from the client's perspective they're just talking to 'the server,' with no visibility into the fact that Nginx is routing them to one of several backend instances that aren't even publicly reachable. That's exactly the setup described here — clients only ever see Nginx, the actual app servers are hidden behind it — which is why it's a reverse proxy and not a forward one.",
  },
];
