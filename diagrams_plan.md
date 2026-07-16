# CrackIt Cheatsheet Diagrams — Plan of Action

## Overview

This document outlines how to incrementally add SVG/HTML-based visual diagrams to the CrackIt cheatsheets, starting with C&N (Computer Networks) where diagrammatic representation provides the highest learning benefit. The plan is zero-dependency: all diagrams are plain React components rendering native SVG or structured HTML/CSS, keeping the app lightweight and offline-capable.

---

## Why Diagrams?

Many networking and OS concepts are deeply spatial and flow-based. Text descriptions alone leave learners building incomplete mental models. A well-placed diagram showing how TCP packets traverse layers or how a DNS lookup cascades through resolvers instantly replaces three paragraphs of prose.

---

## Architecture: How Diagrams Will Be Integrated

### Data Model Extension

The `CHEATSHEETS` data structure in `src/cheatsheets.js` will be extended to support an optional `diagram` field per topic:

```js
{
  topic: "OSI Model",
  brief: "...",
  subtopics: [...],
  diagram: {
    type: "LayerStack",         // identifies which diagram component to render
    props: { /* diagram data */ }
  }
}
```

### Diagram Registry

A new file `src/diagrams.jsx` will export a **DiagramRegistry** — a map from `type` string to a React component:

```js
export const DiagramRegistry = {
  LayerStack: LayerStackDiagram,
  PacketFlow: PacketFlowDiagram,
  ThreeWayHandshake: ThreeWayHandshakeDiagram,
  // ... more
};
```

### Rendering

In `CheatsheetView`, when a topic has a `diagram` field, the matching component is looked up and rendered inline beneath the subtopics section. Diagrams degrade gracefully — if no registry entry exists for a type, nothing is shown.

---

## Diagram Types to Build

### Priority 1: C&N (Computer Networks)

| Topic | Diagram Type | What to Show |
|---|---|---|
| OSI Model | `LayerStack` | 7-layer vertical stack (Physical → Application), color-coded by layer group (physical, data, network, transport, session/presentation/application) |
| DNS Lookup | `PacketFlow` | Arrow-stepped flow: Client → Recursive Resolver → Root NS → TLD NS → Authoritative NS → Response |
| TCP Handshake | `ThreeWayHandshake` | Client/Server columns with SYN → SYN-ACK → ACK arrows and sequence number labels |
| Load Balancing | `TopologyDiagram` | Client → Load Balancer → multiple Server nodes fan-out |
| TLS/SSL | `PacketFlow` | Simplified TLS 1.3 handshake: ClientHello, ServerHello, Certificate, Finished |
| HTTP/1.1 vs HTTP/2 | `ComparisonFlow` | Side-by-side lanes showing serialized requests (HTTP/1.1) vs multiplexed streams (HTTP/2) |
| CDN | `TopologyDiagram` | Origin Server → CDN Edge nodes globally distributed, client hits nearest edge |
| Subnetting | `IPDiagram` | IP address broken into network/host bits with subnet mask overlay |
| NAT | `TopologyDiagram` | Private LAN (192.168.x.x) → NAT Router → Public IP (e.g. 203.0.113.1) → Internet |

### Priority 2: OS (Operating Systems)

| Topic | Diagram Type | What to Show |
|---|---|---|
| Virtual Memory | `MemoryMap` | Virtual address space split into text/heap/stack, mapped via page table to physical frames |
| CPU Scheduling | `GanttChart` | Process timeline showing FCFS vs Round Robin slots |
| Deadlock | `ResourceGraph` | Circular dependency graph: Process A → Resource 1 → Process B → Resource 2 → Process A |

### Priority 3: DBMS

| Topic | Diagram Type | What to Show |
|---|---|---|
| Indexing | `TreeDiagram` | B-Tree structure showing root/branch/leaf nodes and sorted key ranges |
| Joins | `VennDiagram` | Classic Venn showing INNER/LEFT/RIGHT/FULL OUTER JOIN overlaps |
| Sharding | `TopologyDiagram` | Single DB → Shard A (user_id 0–999) + Shard B (user_id 1000–1999) |

### Priority 4: CPP / OOP / PYTHON

These are lower priority since code snippets already communicate the concepts clearly. Exceptions:

| Topic | Diagram Type | What to Show |
|---|---|---|
| Smart Pointers | `MemoryMap` | Stack frame pointing to heap, unique_ptr vs shared_ptr with reference count |
| OOP Inheritance | `ClassDiagram` | Simple UML-style boxes showing Base → Derived arrows, method overrides |
| Method Resolution Order | `DAG` | Python class hierarchy DAG with MRO order labeled |

---

## Implementation Phases

### Phase 1 — Foundation (Do First)

1. Create `src/diagrams.jsx` with the `DiagramRegistry` export and the first 2–3 CN diagrams as plain SVG React components:
   - `LayerStackDiagram` (OSI Model)
   - `ThreeWayHandshakeDiagram` (TCP Handshake)
   - `PacketFlowDiagram` (DNS Lookup)

2. Add `diagram` fields to those 3 topics in `CHEATSHEETS["CN"]` in `src/cheatsheets.js`.

3. Update `CheatsheetView` in `src/App.jsx` to render diagrams when the `diagram` field is present.

4. Add CSS for diagram containers in `src/styles.css` (`.diagram-container`, `.diagram-svg`, responsive sizing, dark-mode aware colors).

### Phase 2 — CN Full Coverage

Add remaining CN diagrams (Load Balancing, TLS, HTTP/2, CDN, Subnetting, NAT).

### Phase 3 — OS Diagrams

Add Virtual Memory, CPU Scheduling (Gantt), Deadlock (Resource Graph).

### Phase 4 — DBMS & Others

Add B-Tree indexing, Join Venn, Sharding topology, and OOP class diagrams.

---

## Design Standards for Diagrams

- **Color**: Use CSS variables (`--accent`, `--line`, `--ink`, `--surface`) so diagrams respect dark/light mode
- **Size**: SVG viewBox should be `0 0 500 300` (landscape) for flow diagrams, `0 0 200 400` for stacks; always set `width="100%"` and `preserveAspectRatio="xMidYMid meet"` for responsiveness
- **Typography**: Use `font-family: inherit` for SVG text; keep labels short (<25 chars)
- **Interactivity**: Phase 1 diagrams are static. Phase 3+ can add hover tooltips via CSS or React state
- **Accessibility**: Each SVG should have a `<title>` and `<desc>` element; use `role="img"`

---

## File Changes Summary

| File | Change |
|---|---|
| `src/diagrams.jsx` | **NEW** — DiagramRegistry + all diagram components |
| `src/cheatsheets.js` | Add `diagram: { type, props }` fields to topics that have diagrams |
| `src/App.jsx` | Update `CheatsheetView` to look up and render `DiagramRegistry[topic.diagram.type]` |
| `src/styles.css` | Add `.diagram-container` and responsive diagram styles |

---

## Notes

- Diagrams are additive — the app continues to function without them; cheatsheets without diagrams render exactly as before
- Start with C&N because it offers the most visual payoff per diagram built
- Use `npm run build` after each phase to confirm no regressions
