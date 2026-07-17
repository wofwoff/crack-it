export const NEW_CN = [
  {
    id: "q-cn-websockets-001",
    subject: "CN",
    concept: "WebSockets vs Polling",
    difficulty: "medium",
    stem: "A chat app currently has the browser send a GET request to the server every 2 seconds asking 'any new messages?'. Product complains about laggy delivery and the backend team complains about server load from constant empty-response requests at scale. An engineer proposes switching to WebSockets. What's the core mechanical reason this fixes both problems?",
    options: [
      {
        text: "WebSockets establish a persistent, full-duplex TCP channel by upgrading an HTTP request, allowing the server to asynchronously push data as soon as it's available.",
        sub: "Persistent full-duplex channel for server-driven push",
        fix: "",
      },
      {
        text: "WebSockets utilize UDP for their data transfer layer, bypassing TCP's handshake overhead and connection management for reduced per-message latency.",
        sub: "UDP-based transport for lower overhead",
        fix: "WebSockets run over TCP (starting as an HTTP Upgrade handshake), not UDP. The latency win is from push-based delivery on one persistent connection, not a transport swap.",
      },
      {
        text: "WebSockets feature a built-in multiplexing layer that efficiently batches messages from various users into single network frames, optimizing TCP overhead.",
        sub: "Protocol-level message multiplexing",
        fix: "WebSockets don't perform cross-user batching; the server load reduction comes from eliminating constant repeated polling requests, not packet batching.",
      },
      {
        text: "WebSockets implement advanced payload compression algorithms natively, significantly reducing data transfer sizes and server processing load for message serialization.",
        sub: "Native payload compression for efficiency",
        fix: "Payload compression isn't what WebSockets provide or what fixes polling lag — the issue is the request/response cycle itself, not message size.",
      },
    ],
    correctIndex: 0,
    proTip: "Polling pays a fixed cost (a full request/response, often with headers and connection setup) every interval regardless of whether there's new data. WebSockets pay that cost once at handshake, then it's pure push.",
    lesson: "Short polling repeats a stateless HTTP request/response cycle on a timer, which means both wasted requests when there's nothing new and added latency up to the polling interval when there is. A WebSocket starts as a normal HTTP request that gets upgraded (101 Switching Protocols) to a persistent, bidirectional TCP connection, so the server can write data to the client the moment it's available, with no per-message connection or header overhead.",
    remember: "WebSockets trade many repeated request/response cycles for one persistent connection where the server can push — eliminating both polling latency and empty-poll server load.",
    interviewAnswer: "The fundamental issue with polling every 2 seconds is that you're paying for a full HTTP request/response cycle on a timer regardless of whether there's actually new data, which wastes server resources on empty responses and still leaves up to 2 seconds of lag on real messages. WebSockets fix this because the connection starts as a normal HTTP request but gets upgraded via a 101 status into a persistent, full-duplex TCP connection — after that handshake, the server can just write a message down the socket the instant it exists, no new connection, no repeated headers, no polling interval to wait out. That's why it solves both the latency complaint and the server load complaint at the same time, they're really the same root cause.",
  },
  {
    id: "q-cn-quic-001",
    subject: "CN",
    concept: "HTTP/3 and QUIC",
    difficulty: "hard",
    stem: `A mobile video-streaming app serves users on flaky cellular networks. During a packet capture of a stalled session, you observe:
- A single TCP packet containing bytes for Stream 3 is dropped.
- Stream 5 and Stream 7 have already had their subsequent packets successfully received by the OS buffer.
- The application layer cannot read the data for Stream 5 and Stream 7 until the lost segment for Stream 3 is retransmitted and received.

After migrating to HTTP/3, the same packet loss scenario does not block reading from other active streams. Which architectural change resolves this issue?`,
    options: [
      {
        text: "The protocol shifts stream multiplexing to a transport layer that manages independent sequence numbers per stream, ensuring packet loss on one stream only pauses delivery of that specific stream.",
        sub: "QUIC's Stream-level Independence",
        fix: "",
      },
      {
        text: "The protocol increases the default maximum transmission unit (MTU) size, reducing the total number of IP packets generated and decreasing the probability of packet drops.",
        sub: "Optimized MTU for Efficiency",
        fix: "Increasing MTUs does not prevent transport-level head-of-line blocking; in fact, larger packets are more likely to be fragmented or dropped on flaky links, worsening stalls.",
      },
      {
        text: "The protocol enforces strict in-order processing of all active request streams, ensuring no parallel delivery is attempted until prior stream segments are fully acknowledged.",
        sub: "Strict In-Order Stream Processing",
        fix: "Strict in-order processing across all streams would worsen head-of-line blocking by forcing streams to wait for each other. HTTP/3 resolves this by making stream delivery independent.",
      },
      {
        text: "The protocol delegates stream recovery to an application-layer frame buffer that dynamically caches and re-sequences out-of-order payloads before the transport layer receives them.",
        sub: "Application-Layer Resilience",
        fix: "The transport layer (QUIC) must handle stream assembly and loss recovery natively; the application layer cannot bypass transport-level blocking if the underlying TCP connection stalls.",
      },
    ],
    correctIndex: 0,
    proTip: "TCP head-of-line blocking happens because TCP guarantees one strictly ordered byte stream — a lost packet stalls everything behind it, even unrelated HTTP/2 streams multiplexed on top. QUIC moves multiplexing into the transport itself, so loss on one stream doesn't stall the others.",
    lesson: "HTTP/2 multiplexes multiple logical streams over a single TCP connection, but TCP itself only knows about one ordered byte stream — so a single lost packet forces TCP to hold back all bytes after it for retransmission, stalling every HTTP/2 stream sharing that connection (transport-level head-of-line blocking). QUIC, the transport HTTP/3 runs on, is built on UDP and implements multiple independent streams natively, so packet loss on one stream only pauses that stream while the others continue delivering already-arrived data.",
    remember: "HTTP/2's head-of-line blocking lives in TCP itself, not HTTP — QUIC fixes it by making each stream's loss recovery independent at the transport layer.",
    interviewAnswer: "This is the classic TCP head-of-line blocking problem that HTTP/3 was designed to solve. Under HTTP/2, you've got multiple streams multiplexed over one TCP connection, but TCP only guarantees one ordered byte stream — so if a packet for one video segment gets dropped on a flaky cellular link, TCP has to hold back everything that arrived after it, even bytes belonging to completely unrelated streams, until the retransmit lands. QUIC, which HTTP/3 runs on top of, is UDP-based and implements streams as a first-class transport concept, so each stream has its own independent loss recovery — losing a packet on one stream no longer stalls the others. That's exactly why this kind of stall disappears after the HTTP/3 migration on lossy networks.",
  },
  {
    id: "q-cn-tcp-retransmit-001",
    subject: "CN",
    concept: "TCP Retransmission & Timeouts",
    difficulty: "medium",
    stem: `A backend service communicates with a downstream API. During a brief network blip, you observe the following packet sequence:
\`\`\`text
10:00:00.000 -> [SYN] Seq=0
10:00:00.080 <- [SYN, ACK] Seq=0 Ack=1
10:00:00.080 -> [ACK] Seq=1 Ack=1
... (connection established, normal traffic)
10:00:05.100 -> [Segment 12] (Lost in transit)
10:00:05.180 -> [Segment 13] (Sent, but no ACK returned)
10:00:06.300 -> [Segment 12 Retransmit] (Sent after a long delay)
\`\`\`
Even though the packet loss event lasted only 10ms, the request latency spikes to over 1.2 seconds. What is the transport-layer mechanism causing this latency multiplier?`,
    options: [
      {
        text: "The client application's connection pool detects the dropped packet and executes a series of sequential connection retries using a fixed timeout policy.",
        sub: "Application-level retry timeouts",
        fix: "The latency spike occurs at the transport layer before the application-level client library attempts a retry; it is governed by the underlying TCP socket's retransmission timers.",
      },
      {
        text: "The DNS resolver performs a full lookup for the downstream endpoint, bypassing local cache TTLs due to a perceived network-layer connection failure.",
        sub: "Aggressive DNS re-resolution",
        fix: "DNS resolution is not re-triggered for individual packets lost within an already established TCP connection; lookups happen during connection establishment.",
      },
      {
        text: "The sender falls back to a retransmission timeout (RTO) calculated from smoothed round-trip times, which is padded for network safety and can double exponentially.",
        sub: "Exponential RTO backoff",
        fix: "",
      },
      {
        text: "The transport layer triggers a TLS session renegotiation to re-verify cryptographic session keys after detecting out-of-order segment arrivals.",
        sub: "TLS session re-handshake",
        fix: "TLS session renegotiation is not triggered by TCP-level packet loss; TLS operates on top of the reliable stream provided by TCP and is unaware of underlying retransmissions.",
      },
    ],
    correctIndex: 2,
    proTip: "Fast retransmit (triggered by 3 duplicate ACKs) is quick, but if loss isn't caught that way, TCP falls back to RTO — and RTO is deliberately conservative, often starting around 1 second and backing off exponentially, which is why a millisecond-scale network blip can produce second-scale application latency.",
    lesson: "TCP guarantees ordered, reliable delivery, so when a segment is lost it must be detected and retransmitted before later data can be delivered to the application. Detection happens either fast (three duplicate ACKs trigger immediate fast retransmit) or slow (a retransmission timeout fires, calculated from smoothed RTT and variance, often defaulting to roughly 1 second minimum and doubling on repeated loss). A blip lasting only milliseconds can therefore cause multi-hundred-millisecond to multi-second stalls if the loss happens to require an RTO rather than a fast retransmit.",
    remember: "TCP loss recovery is asymmetric: duplicate-ACK fast retransmit is quick, but falling back to retransmission timeout (RTO) can cost hundreds of milliseconds to seconds — far longer than the packet loss itself.",
    interviewAnswer: "This is TCP's retransmission mechanics at work. When packets get dropped, TCP has two ways to recover: fast retransmit, triggered by three duplicate ACKs, which is quick, or falling back to a retransmission timeout if duplicate ACKs don't arrive — and RTO is calculated conservatively from smoothed round-trip-time estimates, often with an effective floor around a second and exponential backoff on repeated loss. So a network blip that only lasts a few milliseconds can still force a connection into an RTO-based recovery that takes hundreds of milliseconds to over a second, because the timeout duration is sized for safety against false positives, not for the actual length of the outage. That mismatch between blip duration and recovery duration is exactly why you're seeing latency spikes much bigger than the network event itself.",
  },
  {
    id: "q-cn-nagle-001",
    subject: "CN",
    concept: "Nagle's Algorithm & Delayed ACK",
    difficulty: "hard",
    stem: "A low-latency trading client sends small (a few bytes) TCP messages to a server and expects a small ACK-triggered response quickly. Instead, engineers observe consistent ~40ms delays on many of these small writes. Both Nagle's algorithm (sender side) and delayed ACK (receiver side) are enabled by default. What is the root mechanical cause of this delay?",
    options: [
      {
        text: "The server's application-layer processing thread suffers from CPU starvation, causing incoming packets to sit in the OS socket queue for a standard 40ms scheduling quantum.",
        sub: "Server CPU overload and queuing",
        fix: "Server scheduling latency is highly variable and does not consistently align with a specific 40ms window or target small, latency-sensitive TCP write operations selectively.",
      },
      {
        text: "The client's operating system kernel queues outbound packets in a TCP buffer, wait-scheduling them to be sent only at system-wide tick intervals of 40ms.",
        sub: "OS kernel TCP write batching",
        fix: "The OS kernel does not batch TCP sends on a fixed 40ms timer unless Nagle's algorithm is explicitly waiting for an acknowledgment of previous data.",
      },
      {
        text: "The TLS implementation buffers small payload blocks until a cryptographic block cipher boundary of 16KB is reached, introducing a 40ms application-layer delay.",
        sub: "TLS application-layer buffering",
        fix: "TLS record buffering is determined by write sizes and buffer settings, not by a fixed 40ms timer. The stall here is a transport-layer interaction.",
      },
      {
        text: "The sender halts outgoing sub-MSS packets while awaiting an acknowledgment for in-flight data, while the receiver delays its ACK hoping to piggyback it on a response.",
        sub: "Nagle and Delayed ACK interaction",
        fix: "",
      },
    ],
    correctIndex: 3,
    proTip: "The fix for latency-sensitive small-message workloads is almost always to disable Nagle's algorithm with TCP_NODELAY on the socket — that alone removes the sender-side hold, sidestepping the standoff with delayed ACK.",
    lesson: "Nagle's algorithm tries to reduce overhead from many tiny packets by holding a small segment if there's unacknowledged data already in flight, waiting either for an ACK or enough data to fill a full segment. Delayed ACK tries to reduce ACK-only packets by waiting (commonly up to ~40ms) to see if the receiver will send a reply it can piggyback the ACK onto. When both are active, the sender can be waiting for an ACK that the receiver is deliberately delaying, and the receiver is waiting for data that the sender isn't sending yet — producing a recurring stall close to the delayed-ACK timeout. Setting TCP_NODELAY on the sending socket disables Nagle's algorithm and eliminates this interaction.",
    remember: "Small TCP writes stalling for ~40ms is the textbook Nagle's-algorithm-vs-delayed-ACK standoff — fix it with TCP_NODELAY on latency-sensitive sockets.",
    interviewAnswer: "This is the classic Nagle's algorithm and delayed ACK interaction. Nagle's algorithm on the sender holds back small segments when there's already unacknowledged data outstanding, waiting for either an ACK or enough buffered data to send a full segment — it's meant to cut down on tiny-packet overhead. Meanwhile the receiver's delayed ACK is deliberately not sending an immediate ACK, hoping to piggyback it on an actual response, often waiting up to around 40ms before sending a bare ACK. Put those together and you get a standoff: the sender's waiting on an ACK the receiver is sitting on, and the receiver's waiting for more data the sender won't send until it gets that ACK. For a latency-sensitive client like a trading system, the standard fix is setting TCP_NODELAY on the socket to disable Nagle's algorithm entirely, since you'd rather eat the overhead of more small packets than tens of milliseconds of stall.",
  },
  {
    id: "q-cn-tls-expiry-001",
    subject: "CN",
    concept: "TLS Certificate Chain & Expiry",
    difficulty: "medium",
    stem: "At 2am, every client suddenly starts failing to connect to api.example.com with TLS errors like 'certificate has expired' or 'unable to verify the first certificate.' Nothing was deployed in the last 24 hours, and the leaf certificate's expiry date (checked in the cert itself) is still six months away. What's the most likely cause?",
    options: [
      {
        text: "The server's certificate configuration includes an intermediate certificate authority (CA) certificate that has expired, breaking the cryptographic path of trust.",
        sub: "Expired server intermediate CA",
        fix: "",
      },
      {
        text: "The server rotated its private key without updating the corresponding public certificate, leading to validation mismatches during the key exchange phase.",
        sub: "Server key mismatch after rotation",
        fix: "A private key mismatch with the public certificate will cause cryptographic handshake signatures to fail, not certificate chain validation or expiry errors.",
      },
      {
        text: "A global time synchronization drift occurred across client devices, making the current leaf certificate appear to have expired relative to the local system time.",
        sub: "Widespread client clock drift",
        fix: "Widespread client clock synchronization drift is highly unlikely to happen simultaneously across all client devices at a specific minute.",
      },
      {
        text: "The DNS server returned an incorrect IP address for the API gateway, routing traffic to a legacy server that has an expired wildcard certificate installed.",
        sub: "DNS misconfiguration",
        fix: "A DNS routing issue would result in hostname validation errors (such as a name mismatch) rather than specific trust chain or certificate expiry errors.",
      },
    ],
    correctIndex: 0,
    proTip: "Leaf certificate expiry isn't the only expiry that matters — intermediate CA certificates in the chain have their own expiry dates, and many outages are caused by an expired intermediate that nobody was monitoring because alerting was only set up for the leaf cert.",
    lesson: "TLS clients validate an entire certificate chain — leaf, one or more intermediates, up to a trusted root — and the chain is only valid if every certificate in it is currently valid, not just the leaf. Servers typically serve the intermediate(s) alongside the leaf in the TLS handshake; if an intermediate expires (or is revoked, or simply isn't served), validation fails with chain-related errors like 'unable to verify' or in some client implementations a generic 'expired' message, even though the leaf certificate's own dates are fine. Monitoring and renewal need to cover the full chain, not just the leaf.",
    remember: "TLS chain validation fails if ANY certificate in the chain is expired — monitor intermediate CA expiry too, not just the leaf certificate.",
    interviewAnswer: "Since the leaf certificate itself still has six months of validity, the failure has to be coming from somewhere else in the chain — and the most common real-world cause of a sudden, simultaneous, server-wide TLS failure like this is an expired intermediate CA certificate. Clients don't just check the leaf cert's dates, they validate the whole chain up to a trusted root, and if the server is serving an intermediate certificate that just hit its expiry, every client validating that chain starts failing at once, often with exactly these kinds of 'expired' or 'unable to verify' errors even though the leaf looks fine in isolation. The fix is to update the certificate bundle the server presents to include a current, non-expired intermediate, and going forward to monitor expiry on the entire chain, not just the leaf cert.",
  },
  {
    id: "q-cn-keepalive-001",
    subject: "CN",
    concept: "HTTP Keep-Alive & Connection Reuse",
    difficulty: "medium",
    stem: "A service makes frequent HTTP calls to a downstream API. After a code change that switched from a shared HTTP client instance to creating a brand-new HTTP client (and thus a new TCP+TLS connection) for every single request, p50 latency per call jumped from 5ms to 60ms even though the downstream API itself didn't change. What explains the jump?",
    options: [
      {
        text: "The newly instantiated HTTP client defaults to using HTTP/1.0, which enforces server-side connection teardown and prevents persistent communication channels.",
        sub: "Legacy HTTP protocol default",
        fix: "While HTTP/1.0 defaults to non-persistent connections, modern HTTP clients default to HTTP/1.1 or HTTP/2, and the issue is client-side failure to share the connection pool.",
      },
      {
        text: "Each request now incurs the overhead of establishing a new TCP connection and executing a full TLS handshake, instead of reusing an already active session.",
        sub: "Full connection setup overhead",
        fix: "",
      },
      {
        text: "The downstream API gateway detects the high volume of unique client connections and applies rate-limiting rules that artificially delay processing.",
        sub: "Aggressive API rate limiting",
        fix: "Rate limiting from a gateway typically returns a 429 Too Many Requests status code or rejects the request, rather than consistently adding a fixed network delay.",
      },
      {
        text: "The client host performs a fresh recursive DNS lookup for every API request because the new client instance disables local operating system name caches.",
        sub: "Frequent DNS resolution",
        fix: "The operating system's DNS resolver cache is system-wide and is not bypassed or disabled simply by creating a new HTTP client instance in the application code.",
      },
    ],
    correctIndex: 1,
    proTip: "A reused keep-alive connection skips TCP's SYN/SYN-ACK/ACK and (for HTTPS) the TLS handshake entirely — that's often the majority of the latency on a fast downstream call, which is exactly why connection pooling matters so much for high-throughput services.",
    lesson: "HTTP keep-alive lets a client reuse one TCP (and TLS, for HTTPS) connection across multiple requests instead of tearing it down and reconnecting each time. Establishing a fresh connection costs at least one round trip for the TCP handshake plus, for TLS, additional round trips for the TLS handshake (key exchange, certificate validation) before any application data is even sent. Creating a brand-new HTTP client per request typically means a brand-new connection pool with nothing to reuse, so every call pays this setup cost — which is exactly the kind of fixed overhead that explains a jump like 5ms to 60ms with no change to the downstream service itself.",
    remember: "A shared HTTP client with keep-alive reuses TCP/TLS connections across requests; a fresh client per call means a fresh handshake per call — connection setup cost, not the server, explains the latency jump.",
    interviewAnswer: "This smells exactly like losing connection reuse. With a shared, long-lived HTTP client, keep-alive lets the client reuse an already-established TCP connection — and for HTTPS, an already-completed TLS handshake — across many requests, so a typical call is just sending the request and reading the response. Once you create a brand-new client per request, you're effectively starting a new connection pool with nothing in it every time, so each call has to redo the TCP three-way handshake and the full TLS handshake before any actual HTTP traffic happens. Those handshakes are round trips, and round trips are exactly the kind of fixed cost that would show up as a consistent latency jump like 5ms to 60ms without the downstream service itself changing at all. The fix is to go back to a shared, pooled client so connections get reused instead of recreated per call.",
  },
  {
    id: "q-cn-rate-limit-001",
    subject: "CN",
    concept: "Rate Limiting Strategies",
    difficulty: "medium",
    stem: "An API enforces 'max 100 requests per minute' using a fixed window: it counts requests in calendar-aligned 60-second buckets (e.g., 10:00:00-10:00:59) and resets the counter at each boundary. Engineers notice a client can send 100 requests at 10:00:59 and another 100 at 10:01:00, getting 200 requests through in roughly 2 seconds — double the intended rate. What's the issue, and what's a standard fix?",
    options: [
      {
        text: "Fixed windows allow request bursts at boundaries due to abrupt counter resets; sliding window or token bucket algorithms provide continuous rate enforcement.",
        sub: "Fixed window boundary burst",
        fix: "",
      },
      {
        text: "The rate limiter's counter has an off-by-one bug, allowing an unintended single extra request per window at its boundary.",
        sub: "Marginal counter inaccuracy",
        fix: "The problem involves a burst of 100 requests, indicating a fundamental algorithm behavior, not a minor off-by-one counting error.",
      },
      {
        text: "The client is using multiple IP addresses or identity tokens to evade detection, bypassing the intended per-client rate limit.",
        sub: "Identity-spoofing evasion",
        fix: "The problem highlights one client exploiting a single window's reset, not an evasion tactic involving multiple identities or network addresses.",
      },
      {
        text: "The load balancer is routing requests to multiple backend instances, each enforcing its own separate limit, causing inconsistent application.",
        sub: "Distributed limiter desynchronization",
        fix: "The scenario describes a single logical limiter exhibiting boundary reset behavior, not an issue with distributed instance synchronization.",
      },
    ],
    correctIndex: 0,
    proTip: "Fixed-window counters are simple and cheap but allow up to 2x the intended rate right at the boundary. A sliding window log or sliding window counter (weighting the previous window's count) caps this at close to the true configured rate; a token bucket additionally allows controlled bursting by design rather than as an accidental side effect.",
    lesson: "Fixed-window rate limiting resets its counter at fixed calendar boundaries, so it only constrains requests within each independent window — it has no memory of how many requests happened just before the boundary. A client can therefore send the full quota right at the end of one window and the full quota again right at the start of the next, achieving roughly double the intended rate in a short burst around the boundary. Sliding window approaches (a sliding log of timestamps, or a weighted combination of the current and previous window's counts) evaluate the limit over a continuously moving time span instead of a fixed reset point, which removes this boundary-burst loophole; a token bucket takes a different approach, allowing bounded, intentional bursts while still capping the average rate.",
    remember: "Fixed-window rate limiters can let through up to 2x the configured rate in a burst straddling the window boundary — sliding window or token bucket algorithms close that gap.",
    interviewAnswer: "This is the classic fixed-window boundary burst problem. Because the limiter resets its counter at hard calendar boundaries, it has zero memory of what happened in the previous window — so a client can legitimately max out the quota in the last instant of one window and immediately max it out again in the first instant of the next, getting up to double the intended rate through in a very short burst. It's not a bug exactly, it's a structural weakness of fixed windows. The standard fix is to move to a sliding window approach — either keep a log of recent request timestamps and count how many fall within the last 60 seconds continuously, or use a weighted sliding window that blends the current and previous window's counts — or alternatively use a token bucket, which handles bursts by design with a controlled bucket size rather than letting them happen accidentally at a reset boundary.",
  },
  {
    id: "q-cn-etag-001",
    subject: "CN",
    concept: "HTTP Caching Headers (ETag / Cache-Control)",
    difficulty: "medium",
    stem: `A product page's hero image is served with the following response headers:
\`\`\`http
HTTP/1.1 200 OK
Cache-Control: max-age=86400
Content-Type: image/jpeg
\`\`\`
Marketing swaps the image file at the same URL mid-afternoon for a flash sale, but returning users still see the old image for up to 24 hours. Engineers want future swaps to be picked up immediately while keeping aggressive caching for unchanged assets. What is the standard industry pattern to solve this?`,
    options: [
      {
        text: "Instruct users to perform a hard reload to clear the local browser state, or use administrative APIs to force client-side cache clearing.",
        sub: "Manual end-user cache invalidation",
        fix: "Manual user intervention is not a viable or scalable solution for production web applications and cannot be programmatically controlled by the server.",
      },
      {
        text: "Append a content-based cryptographic hash to the image filename, or add a strong validator header for conditional validation requests.",
        sub: "Cache-busting or conditional revalidation",
        fix: "",
      },
      {
        text: "Configure the origin server to return a cache directive of max-age=0, must-revalidate for all media assets, disabling client-side storage.",
        sub: "Forced revalidation for all assets",
        fix: "While this ensures freshness, disabling local caching entirely increases server bandwidth and page load times, violating the goal of caching unchanged assets.",
      },
      {
        text: "Downgrade the asset delivery protocol from HTTPS to unencrypted HTTP to prevent browser security policies from caching static resources.",
        sub: "Protocol change for cache behavior",
        fix: "Protocol downgrades do not bypass or modify HTTP caching rules; caching headers behave identically under HTTP and HTTPS, and this would introduce security risks.",
      },
    ],
    correctIndex: 1,
    proTip: "The most common production pattern is 'immutable, far-future cache + content-hashed filename': name the file something like hero.a1b2c3.jpg, set max-age to a year, and when content changes, the filename changes too — so there's never a stale-cache problem to solve, only a new URL to reference.",
    lesson: "A long max-age tells the browser it can serve the cached copy without even contacting the server until it expires, which is great for performance but means content changes at the same URL go unnoticed until expiry. Two standard fixes exist: add a validator (ETag or Last-Modified) so the browser, even while otherwise treating the asset as fresh, can be configured to revalidate and get a fast 304 Not Modified if unchanged or the new bytes if changed; or, more commonly for static assets, version the URL itself (a content hash or query param) so any content change naturally produces a new URL with its own fresh cache entry, leaving the old cached copy harmlessly orphaned.",
    remember: "Long max-age caching plus same-URL content swaps causes silent staleness — fix it with a validator (ETag) for revalidation, or better, version the asset URL so changed content is a new resource.",
    interviewAnswer: "The root problem is that max-age=86400 tells browsers they don't even need to ask the server again for a full day, so when marketing swapped the image bytes at the same URL, returning users' browsers had no way to know anything changed until that day expired. There are two standard ways to fix this: add a strong validator like an ETag so the browser can send a conditional request and get a fast 304 if nothing changed or fresh bytes if it did, or — what I'd actually recommend for a static asset like this — fingerprint the URL with a content hash, like hero.a1b2c3.jpg, so any time the image content changes, it's a genuinely new URL with its own fresh cache lifetime, and you can keep super aggressive caching, even mark it immutable, without ever worrying about staleness again.",
  },
  {
    id: "q-cn-mtu-001",
    subject: "CN",
    concept: "Packet Fragmentation & MTU",
    difficulty: "hard",
    stem: "After a service migrates to run inside an overlay network (VPN/VXLAN-style encapsulation) with an effective MTU of 1400 bytes instead of the standard 1500, clients report that small API calls work fine, but requests with larger payloads (file uploads, big JSON bodies) intermittently hang or time out, especially through certain corporate firewalls. What's the likely root cause?",
    options: [
      {
        text: "The server's application thread pool is exhausted because parsing larger request bodies requires additional heap allocation, stalling subsequent requests.",
        sub: "Connection Pool Exhaustion",
        fix: "Thread pool exhaustion affects all requests regardless of payload size, and would not be specifically triggered by a change in the overlay network's MTU.",
      },
      {
        text: "Firewalls block ICMP 'packet too big' messages, preventing the sender from discovering the reduced path MTU and causing oversized packets to be silently dropped.",
        sub: "Black-holed PMTUD due to blocked ICMP",
        fix: "",
      },
      {
        text: "The TLS layer fails to complete session resumption because larger payloads trigger a full security handshake that exceeds default connection timeout limits.",
        sub: "TLS Resumption Failure",
        fix: "TLS session resumption is not payload-size dependent; the handshake payloads themselves are small and would not cause timeouts specific to file uploads.",
      },
      {
        text: "The application's JSON parser crashes or deadlocks when reading non-contiguous data fragments generated by network-layer packet division.",
        sub: "Application Parsing Bug",
        fix: "The application's JSON parser operates on the fully reassembled TCP stream at the user space level; it does not interact with network-layer packets or fragments.",
      },
    ],
    correctIndex: 1,
    proTip: "This is the 'PMTUD black hole' problem: it's not enough to set an MTU correctly — you also need ICMP 'fragmentation needed' (or 'packet too big' for IPv6) messages to actually get back to the sender. Many firewalls block ICMP by default for 'security,' which silently breaks Path MTU Discovery for exactly the large packets that need it.",
    lesson: "Every link in a network path has a maximum transmission unit; when a packet exceeds the smallest MTU along the path, it must either be fragmented or, more commonly today with the Don't Fragment (DF) bit set, dropped with an ICMP message telling the sender to use a smaller size — this is Path MTU Discovery. If a firewall along the path blocks ICMP (a common but harmful hardening practice), the sender never receives that signal: oversized packets are dropped silently and retransmitted at the same size, repeating forever until the connection times out. Small requests that fit under the reduced 1400-byte MTU are unaffected, which is exactly why only large payloads hang.",
    remember: "Path MTU Discovery relies on ICMP 'fragmentation needed' messages getting back to the sender — firewalls that block ICMP create a silent black hole for exactly the oversized packets that need PMTUD to work.",
    interviewAnswer: "This has the fingerprints of a Path MTU Discovery black hole. Once the overlay network drops the effective MTU to 1400, any packet that would have fit under 1500 but is now too big needs to either get fragmented or, since most stacks set the Don't Fragment bit by default, get dropped with an ICMP message telling the sender to retry smaller — that's PMTUD. The catch is some corporate firewalls block ICMP outright as a hardening measure, so that 'too big, retry smaller' signal never makes it back to the sender; the oversized packet just vanishes silently, and the connection retries at the same size forever until it times out. Small API calls stay under 1400 bytes so they're never affected, which is exactly why only the large uploads and big JSON bodies hang. The fix is usually to allow the relevant ICMP types through the firewall, or to clamp the TCP MSS at the network edge so endpoints never try to send packets bigger than the path can actually carry in the first place.",
  },
  {
    id: "q-cn-reverse-proxy-001",
    subject: "CN",
    concept: "Proxy vs Reverse Proxy",
    difficulty: "easy",
    stem: "A team puts Nginx in front of their application servers. Nginx terminates TLS, then forwards requests to whichever backend instance is healthy, and the backend servers have no public IP at all — clients only ever talk to Nginx. A junior engineer asks why this is called a 'reverse' proxy instead of just a proxy. What's the correct distinction?",
    options: [
      {
        text: "A reverse proxy handles outbound responses from servers, reordering them to optimize delivery efficiency, thereby sending data back in the reverse sequence of the initial client requests.",
        sub: "Response delivery order and optimization strategy.",
        fix: "The term 'reverse' refers to the proxy's position relative to the server and its role in handling client requests directed *towards* the server, not to any inversion of data or response sequence.",
      },
      {
        text: "A reverse proxy operates exclusively within a private network, acting as an internal gateway for servers, while a forward proxy facilitates external client access to public resources.",
        sub: "Network location and scope of resource access.",
        fix: "The key distinction lies in whose perspective the proxy represents (client vs. server), not whether it's internal or external. Both types can operate in private or public network segments.",
      },
      {
        text: "A forward proxy manages client requests to external resources, effectively acting on the client's behalf; a reverse proxy fronts server resources, acting on the server's behalf for incoming client requests.",
        sub: "Role of the proxy: representing client vs. server identity.",
        fix: "",
      },
      {
        text: "Reverse proxies are exclusively designed for TLS termination and secure external connections, whereas forward proxies primarily handle unencrypted internal network traffic.",
        sub: "Traffic encryption and security protocol handling.",
        fix: "Both proxy types can manage encrypted or unencrypted traffic. TLS termination is a common function for reverse proxies but isn't their defining characteristic, nor are forward proxies limited to plaintext.",
      },
    ],
    correctIndex: 2,
    proTip: "Quick mental test: if the proxy is protecting/representing the client (e.g., a corporate proxy controlling employee internet access), it's a forward proxy. If it's protecting/representing the server (e.g., Nginx, a CDN edge, a load balancer), it's a reverse proxy — clients often don't even know it's there.",
    lesson: "A forward proxy sits between clients and the broader internet, acting on the client's behalf — clients are typically configured to know about and use it (e.g., corporate egress proxies, VPN-style proxies), and the destination server may not know the real client is behind a proxy. A reverse proxy sits in front of one or more backend servers and acts on their behalf, receiving requests as if it were the server; the client usually has no idea which backend instance actually handled the request, or that there even are multiple backend instances. Nginx terminating TLS and routing to healthy backend instances, with those backends having no public exposure, is the textbook reverse proxy setup.",
    remember: "Forward proxy = represents the client to the world; reverse proxy = represents the server(s) to the world — Nginx in front of app servers is reverse because clients only ever see Nginx, never the real backend.",
    interviewAnswer: "The distinction is about whose side of the connection the proxy is representing. A forward proxy sits in front of clients and acts on their behalf out toward the internet — think a corporate proxy that all employee traffic goes through, where the destination server just sees the proxy, not the real client. A reverse proxy is the mirror image: it sits in front of one or more servers and acts on their behalf, so from the client's perspective they're just talking to 'the server,' with no visibility into the fact that Nginx is routing them to one of several backend instances that aren't even publicly reachable. That's exactly the setup described here — clients only ever see Nginx, the actual app servers are hidden behind it — which is why it's a reverse proxy and not a forward one.",
  },
];
