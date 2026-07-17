export const NEW_OOP = [
  {
    id: "q-oop-isp-001",
    subject: "OOP",
    concept: "Interface Segregation Principle",
    difficulty: "medium",
    stem: `You are review-checking a class design where some implementations throw exceptions for unsupported operations:

\`\`\`typescript
interface Worker {
  work(): void;
  eat(): void;
  sleep(): void;
}

class RobotWorker implements Worker {
  work() { /* logic */ }
  eat() { throw new UnsupportedError("Robots don't eat"); }
  sleep() { throw new UnsupportedError("Robots don't sleep"); }
}
\`\`\`

Reviewers keep flagging these stub implementations. Which structural refactoring resolves the core design flaw without leaving empty or error-throwing stubs?`,
    options: [
      {
        text: "Apply the Liskov Substitution Principle by converting the interface into an abstract class with base fallback implementations.",
        sub: "Inherit default behaviors instead of throwing exceptions",
        fix: "Providing dummy default methods in a base class only hides the bloat; it does not solve the problem of subclasses inheriting methods they cannot conceptually perform.",
      },
      {
        text: "Apply the Single Responsibility Principle by dividing the RobotWorker class into separate subclasses for each behavior.",
        sub: "Refactor the concrete implementation to reduce class scope",
        fix: "RobotWorker already has a single responsibility. The issue is that it is forced to implement a bloated interface contract with behaviors it does not support.",
      },
      {
        text: "Decompose the broad contract into smaller role-oriented interfaces so that clients only implement methods they actually require.",
        sub: "Segregate interface boundaries based on client usage",
        fix: "",
      },
      {
        text: "Use the Adapter pattern to encapsulate the RobotWorker behind a wrapper that intercepts and swallows the unsupported method calls.",
        sub: "Hide unsupported operations at the client call site",
        fix: "Using an adapter to swallow errors only masks the design smell at runtime and does not address the fundamental issue of a bloated interface contract.",
      },
    ],
    correctIndex: 2,
    proTip: "If implementers keep throwing UnsupportedOperationException or leaving empty method bodies, that's not lazy engineers — it's the interface broadcasting that it bundled unrelated capabilities together.",
    lesson: "The Interface Segregation Principle says clients shouldn't be forced to depend on methods they don't use. A fat Worker interface that bundles work, eat, and sleep forces every implementer to deal with all three, even when one — like a robot — only has one of them. Splitting it into focused interfaces (Workable, Eatable, Sleepable) lets RobotWorker implement only Workable, with no throwing stubs and no awkward no-ops.",
    remember: "ISP: many small, role-specific interfaces beat one fat interface — empty or throwing method stubs are the smell.",
    interviewAnswer: "The throwing stubs in eat() and sleep() are a symptom, not the disease — the actual problem is that Worker is a fat interface bundling three unrelated capabilities, and RobotWorker is being forced to implement methods that don't apply to it. That's exactly what the Interface Segregation Principle warns against: clients shouldn't depend on methods they don't use. I'd split Worker into smaller interfaces like Workable, Eatable, and Sleepable, so RobotWorker only implements Workable and HumanWorker can implement all three. That removes the empty stubs entirely instead of just hiding them better.",
  },
  {
    id: "q-oop-di-001",
    subject: "OOP",
    concept: "Dependency Injection",
    difficulty: "medium",
    stem: `You are writing unit tests for a transaction processing class, but tests are failing in CI because they attempt to open real socket connections to an external server:

\`\`\`javascript
class OrderService {
  constructor() {
    this.emailer = new SmtpEmailer(SMTP_CONFIG);
  }
  
  processOrder(order) {
    // business logic
    this.emailer.send("order processed");
  }
}
\`\`\`

How should this coupling be refactored to make OrderService unit-testable in isolation?`,
    options: [
      {
        text: "Convert the SmtpEmailer class into a thread-safe Singleton to ensure that only a single database/socket connection is established.",
        sub: "Share a single connection instance globally",
        fix: "Making SmtpEmailer a singleton does not resolve the hard-coded coupling; the OrderService constructor still instantiates and binds to the real network service.",
      },
      {
        text: "Wrap the instantiation of the SmtpEmailer in a conditional branch that checks a global environment variable like process.env.TEST_MODE.",
        sub: "Vary behavior inside the constructor based on configuration",
        fix: "Injecting test environment flags into production code couples it to test environments and complicates runtime configuration.",
      },
      {
        text: "Accept an abstract notifier instance as a parameter in the constructor, shifting the responsibility of instantiation to the caller.",
        sub: "Delegate collaborator creation outward to decouple implementation details",
        fix: "",
      },
      {
        text: "Subclass OrderService with a MockOrderService that overrides the emailer property to use a dummy mock object in the test suite.",
        sub: "Override concrete properties in a test-specific subclass",
        fix: "Subclassing the system under test to override private collaborators is brittle and fails if the base constructor changes or runs network logic.",
      },
    ],
    correctIndex: 2,
    proTip: "If you can't unit test a class without hitting a real network/database/filesystem, look for a `new ConcreteThing()` buried in its constructor — that's the dependency injection smell.",
    lesson: "Dependency Injection means a class receives its collaborators from the outside (constructor, setter, or container) rather than constructing them itself. When OrderService builds its own SmtpEmailer, it's hard-wired to a concrete, network-dependent implementation, making isolated testing impossible. Injecting an emailer — typically typed against an interface — lets production code pass the real SmtpEmailer and tests pass an in-memory fake.",
    remember: "DI: classes should receive their dependencies, not construct them — 'new' inside a constructor is a testability red flag.",
    interviewAnswer: "The root cause is that OrderService is constructing its own SmtpEmailer internally, so there's no seam for tests to substitute anything — every test that touches OrderService ends up making a real SMTP call. The fix is dependency injection: change the constructor to accept an emailer as a parameter, ideally typed against an Emailer interface, and have callers wire up the real SmtpEmailer in production. In tests, you just pass in a fake or mock emailer that records calls instead of sending real email, and OrderService's order logic doesn't change at all.",
  },
  {
    id: "q-oop-builder-001",
    subject: "OOP",
    concept: "Builder Pattern",
    difficulty: "medium",
    stem: `You are refactoring a class constructor that has become error-prone due to multiple sequential boolean flags and optional parameters:

\`\`\`javascript
const pizza = new Pizza("large", "thin", true, "tomato", false, false, true, false, null);
\`\`\`

Call sites are difficult to read and prone to positional errors. What pattern solves this by enabling named, step-by-step configuration?`,
    options: [
      {
        text: "Introduce a separate creator class that exposes chainable methods for configuring each property, returning the built instance at the end.",
        sub: "Construct complex objects step-by-step with named method calls",
        fix: "",
      },
      {
        text: "Create specialized subclasses for each permutation of the configuration parameters to isolate the logic for different scenarios.",
        sub: "Leverage class inheritance to represent combinations of settings",
        fix: "This leads to combinatorial subclass explosion and does not simplify the client's instantiating call site.",
      },
      {
        text: "Expose all class properties as public fields so that clients can set them directly on an empty instance after creation.",
        sub: "Allow direct property modification on mutable fields",
        fix: "Exposing public fields destroys encapsulation and leaves the object in a partially-constructed, invalid state during instantiation.",
      },
      {
        text: "Apply the Template Method pattern to define a fixed skeleton of object assembly steps that subclasses override.",
        sub: "Coordinate construction steps using subclass methods",
        fix: "Template Method controls an algorithm's execution order; it does not resolve readability issues of long, positional parameter lists.",
      },
    ],
    correctIndex: 0,
    proTip: "When a constructor's parameter list reads like a phone number, that's the builder pattern's calling card — convert positional booleans into named, chainable methods.",
    lesson: "The Builder pattern separates the construction of a complex object from its representation, letting you assemble it step by step through named, chainable methods that only set what's relevant. It's the standard answer to telescoping constructors — long parameter lists, especially with multiple optional booleans of the same type, where call sites become unreadable and error-prone. A PizzaBuilder makes `withSize(\"large\").addTopping(\"mushroom\").build()` self-documenting in a way positional arguments never are.",
    remember: "Long constructors full of same-typed optional params (telescoping constructor) = reach for the Builder pattern, not more overloads.",
    interviewAnswer: "This is the classic telescoping constructor problem — nine positional parameters, several of them booleans, means every call site is unreadable and it's easy to accidentally swap two flags without the compiler catching it. The standard fix is the Builder pattern: introduce a PizzaBuilder with chained methods like withSize(), withCrust(), addTopping(), and a final build() call, so each call site only sets what it actually needs and reads like a sentence instead of a tuple of booleans. It also gives you a natural place to validate the combination before construction, which a raw constructor can't easily do mid-call.",
  },
  {
    id: "q-oop-decorator-001",
    subject: "OOP",
    concept: "Decorator Pattern",
    difficulty: "hard",
    stem: `You are designing a pricing calculation system for a coffee shop. Customers can order a base coffee and combine any number of optional add-ons (e.g., milk, caramel, extra shot). Since options are combinable at runtime, creating static subclasses for every permutation would cause subclass explosion. Which pattern allows wrapping the base coffee in optional layers to dynamically compute the total cost?`,
    options: [
      {
        text: "Use a centralized Factory class that parses the user's selected configuration options and instantiates the matching subclass.",
        sub: "Consolidate the instantiation logic of all permutations",
        fix: "A factory only moves the construction decision to another class; it does not solve the combinatorial explosion of subclasses.",
      },
      {
        text: "Apply the Strategy pattern, where the base subscription accepts a collection of strategy objects to evaluate at runtime.",
        sub: "Delegate the cost calculations to interchangeable helper classes",
        fix: "Strategy is designed to switch a single algorithm at runtime; wrapping objects recursively to stack behavioral layers is better suited for other patterns.",
      },
      {
        text: "Apply a structural pattern that wraps the core object in wrapper instances sharing the same interface, each adding its own cost layer.",
        sub: "Attach additional responsibilities dynamically using object composition",
        fix: "",
      },
      {
        text: "Define the calculation steps using the Template Method pattern, letting subclasses determine the cost of each individual feature.",
        sub: "Enforce a fixed sequence of calculations in a parent class",
        fix: "Template Method relies on inheritance and does not allow users to combine arbitrary features dynamically at runtime.",
      },
    ],
    correctIndex: 2,
    proTip: "Whenever you catch yourself about to write a subclass for every possible combination of optional features, stop and ask whether each feature could instead be a wrapper that adds its bit of behavior and delegates the rest.",
    lesson: `The Decorator pattern attaches additional responsibilities to an object dynamically by wrapping it in objects that share its interface, each adding behavior before/after delegating to the wrapped object. For combinable, runtime-chosen add-ons, decorators let you compose nested instances like:

\`\`\`javascript
const order = new ExtraShotDecorator(
  new CaramelDecorator(
    new MilkDecorator(new Coffee())
  )
);
\`\`\`

This avoids writing a subclass for every combination, solving the combinatorial inheritance-explosion problem.`,
    remember: "Decorator = wrap, don't subclass, when optional behaviors need to combine freely at runtime.",
    interviewAnswer: "Subclassing every combination of milk, caramel, and extra shot is going to blow up combinatorially — three independent add-ons already means up to eight subclasses, and it gets worse as more add-ons are added. The Decorator pattern is the better fit here: each add-on becomes a decorator that wraps a Coffee, implements the same cost() interface, adds its own price, and delegates to the wrapped object for the rest. At order time you just wrap the base Coffee in whatever decorators the order needs, in any combination, without ever touching the class hierarchy — that's the key benefit over subclassing, the composition happens at runtime, not compile time.",
  },
  {
    id: "q-oop-adapter-001",
    subject: "OOP",
    concept: "Adapter Pattern",
    difficulty: "medium",
    stem: `Your checkout code calls an internal payment contract, but you must integrate a third-party payment SDK that exposes an incompatible method signature:

\`\`\`javascript
// Your expected interface
paymentGateway.charge(amountCents);

// The vendor SDK signature (cannot modify)
legacyMerchantSDK.processPayment(dollars, currencyCode, retryFlag);
\`\`\`

Rewriting all application call sites is too risky. What is the cleanest way to integrate this SDK?`,
    options: [
      {
        text: "Create an intermediate class that implements the target gateway contract and translates calls to the external SDK signature internally.",
        sub: "Wrap the incompatible dependency behind the interface your application expects",
        fix: "",
      },
      {
        text: "Implement a publish-subscribe event system so that checkout and the SDK communicate indirectly through event messages.",
        sub: "Decouple components using asynchronous event notifications",
        fix: "An event system does not reconcile the interface signature mismatch; the application still needs a way to invoke the payment method.",
      },
      {
        text: "Apply the Decorator pattern to dynamically append the required payment validation behavior directly onto the SDK class.",
        sub: "Extend the SDK functionality with runtime wrapper classes",
        fix: "Decorator extends behavior of objects that already share the same interface. It cannot reconcile completely different method signatures.",
      },
      {
        text: "Refactor the vendor SDK source files directly to expose the signature that your application is already configured to consume.",
        sub: "Modify the external dependency to align with local requirements",
        fix: "Directly modifying a third-party SDK is highly discouraged, as it makes updating the dependency later difficult and error-prone.",
      },
    ],
    correctIndex: 0,
    proTip: "Adapter is the pattern for 'I have two interfaces that should be compatible but aren't, and I can't change one of them' — it's a translation layer, not new behavior.",
    lesson: "The Adapter pattern converts the interface of a class into another interface clients expect, letting incompatible interfaces work together without modifying either side. Here, checkout code is written against PaymentGateway.charge(amountCents), and LegacyMerchantSDK exposes an incompatible processPayment(dollars, currencyCode, retryFlag). A LegacyMerchantAdapter implements PaymentGateway and internally converts cents to dollars, supplies a currency code, and sets the retry flag, so checkout code never needs to know the SDK's shape.",
    remember: "Adapter translates one interface into another that callers already expect — use it when you can't change either side of an interface mismatch.",
    interviewAnswer: "Checkout is coded against PaymentGateway.charge(amountCents), but the third-party SDK has a completely different shape — processPayment(dollars, currencyCode, retryFlag) — and we can't touch that SDK's code or rewrite every checkout call site safely. That's exactly what the Adapter pattern is for: I'd write a LegacyMerchantAdapter class that implements PaymentGateway, and inside its charge() method, converts cents to dollars, supplies the currency code, and sets a sensible retry flag before calling processPayment(). Checkout keeps calling charge() exactly as before, completely unaware that underneath it's been routed to the legacy SDK — the adapter is the only thing that knows about both shapes.",
  },
  {
    id: "q-oop-template-001",
    subject: "OOP",
    concept: "Template Method Pattern",
    difficulty: "medium",
    stem: `You are refactoring two report generator classes that share identical steps but have different outputs:

\`\`\`javascript
class CsvReportExporter {
  export() {
    this.fetchData();
    this.sortData();
    this.writeCsv();
  }
}

class PdfReportExporter {
  export() {
    this.fetchData();
    this.sortData();
    this.writePdf();
  }
}
\`\`\`

The fetch and sort steps contain copy-pasted logic. Which pattern eliminates this duplication while enforcing the execution order of the steps?`,
    options: [
      {
        text: "Create a ReportVisitor interface with specific visit methods for CSV and PDF structures to externalize the formatting logic.",
        sub: "Represent formatting operations as visitor classes",
        fix: "Visitor adds new operations to an existing object structure but does not consolidate common step sequences or enforce execution order.",
      },
      {
        text: "Define an abstract base class with a template method that calls shared fetch and sort methods, deferring the write step to subclasses.",
        sub: "Fix the algorithm's skeleton in the parent class, letting subclasses override specific steps",
        fix: "",
      },
      {
        text: "Develop an Adapter to translate the incompatible export interfaces of the exporters into a common unified export interface.",
        sub: "Make existing disparate interfaces compatible through a wrapper class",
        fix: "The exporters already share the same conceptual method signature; there are no incompatible interfaces to adapt.",
      },
      {
        text: "Introduce a coordinator class that delegates the export steps to swappable pricing and writing strategy objects at runtime.",
        sub: "Deconstruct the export process into independent pluggable strategies",
        fix: "Strategy isolates varying algorithms but does not automatically consolidate shared parent logic or enforce step execution ordering.",
      },
    ],
    correctIndex: 1,
    proTip: "Template Method is the go-to when you see the same sequence of steps copy-pasted across classes with only one or two steps actually differing — pull the skeleton up, push only the differences down.",
    lesson: "The Template Method pattern defines the skeleton of an algorithm in a base class method (often marked final so it can't be reordered), deferring specific steps to subclasses via abstract or overridable methods. Here, fetch() and sort() are identical across exporters and should live once in the base class's export() method, while formatAndWrite() becomes the one abstract method each subclass implements differently. This eliminates duplication while guaranteeing every exporter follows the same fixed step order.",
    remember: "Template Method: fix the algorithm's skeleton and step order in the base class, let subclasses override only the steps that actually vary.",
    interviewAnswer: "The fetch and sort steps are identical across CsvReportExporter and PdfReportExporter, and only the final write step differs — that duplication plus the need for a fixed step order is exactly what Template Method solves. I'd pull fetch() and sort() up into a base ReportExporter class with a final export() method that calls fetch(), then sort(), then an abstract formatAndWrite() — each subclass only implements formatAndWrite() for its format. That kills the copy-paste, and because export() itself is fixed in the base class, nobody can accidentally reorder the steps or skip sorting in a new exporter.",
  },
  {
    id: "q-oop-command-001",
    subject: "OOP",
    concept: "Command Pattern",
    difficulty: "hard",
    stem: `You are designing a rich text editor where the UI controls execute operations directly on the document:

\`\`\`javascript
// Button click handlers
boldButton.onClick = () => editor.applyBold(selection);
italicButton.onClick = () => editor.applyItalic(selection);
\`\`\`

You need to implement undo/redo and macro recording. Directly invoking these methods makes it difficult to track or reverse operations. What design pattern solves this?`,
    options: [
      {
        text: "Apply the Observer pattern so that button handlers publish events that the document state subscribes to.",
        sub: "Decouple UI interactions using event-driven communication",
        fix: "Observer broadcasts that an event occurred, but it does not represent the actions as re-invokable, reversible objects needed for undo/redo.",
      },
      {
        text: "Use the Strategy pattern to make individual text formatting algorithms interchangeable at runtime.",
        sub: "Inject formatting behaviors into a single coordinator",
        fix: "Strategy makes algorithms swappable, but it does not encapsulate requests as units of work that can be queued, logged, or undone.",
      },
      {
        text: "Restrict the Document Editor to a Singleton so that the edit history is globally accessible from any module.",
        sub: "Centralize history tracking in a global instance",
        fix: "Singleton only manages instance count; it does not solve how individual operations are stored, reversed, or replayed.",
      },
      {
        text: "Encapsulate each editing action into an object with execute and undo methods, storing a history stack of these actions.",
        sub: "Treat requests as objects that can be queued, tracked, and reversed",
        fix: "",
      },
    ],
    correctIndex: 3,
    proTip: "Undo/redo and macro recording are the textbook signal for Command: you need actions as objects, not just method calls, because objects can be queued, stored, reversed, and replayed — a method call vanishes the instant it returns.",
    lesson: "The Command pattern encapsulates a request as an object containing everything needed to execute it (and, often, reverse it), decoupling the invoker (the UI button) from the receiver (the formatting logic). By turning applyBold(selection) into a BoldCommand object with execute() and undo() methods, the editor can push commands onto a history stack to support undo/redo, and record a sequence of commands to support macro replay — neither of which is possible when the UI just calls formatting methods directly and the call disappears immediately after.",
    remember: "Command pattern: turn 'do this action' into an object with execute()/undo() whenever you need to queue, log, undo, or replay actions.",
    interviewAnswer: "Calling applyBold() directly from a button handler works fine for the immediate edit, but it gives you nothing to undo, queue, or replay later — the call is gone the moment it returns. The Command pattern fixes this by turning each editing action into an object, like a BoldCommand with execute() and undo() methods, so the UI just constructs a command and pushes it onto a history stack instead of calling the formatting method directly. That history stack gives you undo/redo for free by walking backward and calling undo() on each command, and macro recording becomes just storing a list of commands and replaying their execute() calls in order.",
  },
  {
    id: "q-oop-repository-001",
    subject: "OOP",
    concept: "Repository Pattern",
    difficulty: "medium",
    stem: `You are refactoring a service class where data query logic is mixed directly with business logic:

\`\`\`javascript
class OrderService {
  processOrder(orderId) {
    const orders = db.query(
      "SELECT * FROM orders WHERE id = ?",
      [orderId]
    );
    // business rules...
  }
}
\`\`\`

If you migrate to a different database, you have to rewrite the queries across all methods. What design pattern minimizes this migration's blast radius?`,
    options: [
      {
        text: "Make the database connection instance a Singleton to guarantee a single global connection point across all modules.",
        sub: "Centralize database connection instantiation",
        fix: "Singleton only manages the database connection lifecycle; it does not isolate the business logic from data query strings.",
      },
      {
        text: "Introduce an abstraction layer that exposes collections of domain entities, hiding the query syntax and datastore details.",
        sub: "Decouple business logic from database operations using a collection-like interface",
        fix: "",
      },
      {
        text: "Apply the Decorator pattern to wrap the database query methods with generic logging, transaction, and caching layers.",
        sub: "Intercept query execution to add cross-cutting concerns",
        fix: "Decorator wraps existing interfaces but does not decouple the query logic or SQL strings from the business service.",
      },
      {
        text: "Wrap the database connections in a unified Facade class that simplifies interface calls for the rest of the application.",
        sub: "Provide a simplified interface to a complex database subsystem",
        fix: "A Facade simplifies database access but still leaves the service layer responsible for executing datastore-specific queries.",
      },
    ],
    correctIndex: 1,
    proTip: "If a datastore migration means hunting through business-logic files for SQL strings, that's a sign persistence logic was never actually separated from domain logic — Repository is the seam that should have existed.",
    lesson: "The Repository pattern mediates between the domain/business logic and the data mapping layer, exposing a collection-like interface (findById, save, findByCustomerId) that hides the underlying storage technology and query mechanics. With an OrderRepository in place, OrderService calls orderRepository.findByCustomerId(id) and never sees SQL at all, so migrating from PostgreSQL to another datastore means rewriting the repository's internals once, not hunting through every business-logic method that happens to touch orders.",
    remember: "Repository pattern: hide persistence behind a collection-like interface so domain code never sees SQL, and storage migrations touch one place, not everywhere.",
    interviewAnswer: "The pain here is that raw SQL strings are scattered across a dozen OrderService methods, so a datastore migration means touching every single one of them and re-verifying the query logic each time. The fix that should have been in place from the start is a Repository — an OrderRepository class that exposes domain-friendly methods like findByCustomerId() and save(), and is the only place that knows it's talking to PostgreSQL. OrderService would depend on that repository interface, never write SQL itself, and the migration becomes a matter of rewriting the repository's internals in one place instead of chasing query strings through business logic.",
  },
  {
    id: "q-oop-nullobject-001",
    subject: "OOP",
    concept: "Null Object Pattern",
    difficulty: "medium",
    stem: `getAssignedAgent() on a SupportTicket can return null when no agent is assigned yet. Callers currently check for null before invoking methods:

\`\`\`javascript
if (agent != null) {
  agent.notify(ticket);
}
\`\`\`

Several call sites forgot this check and crashed with a NullPointerException in production. What design pattern resolves this at the source without requiring manual null-checks across all callers?`,
    options: [
      {
        text: "Apply the Observer pattern to automatically push event notifications to the agent object instead of fetching it.",
        sub: "Use publish-subscribe messaging rather than querying state",
        fix: "This changes the notification flow but does not resolve the null-checking requirement at other call sites that query the agent.",
      },
      {
        text: "Return a default, do-nothing collaborator implementation that matches the interface contract instead of null.",
        sub: "Provide a safe, functional instance to represent the missing case",
        fix: "",
      },
      {
        text: "Wrap the client invocation sites in generic try-catch blocks to catch and swallow any runtime null pointer errors.",
        sub: "Swallow runtime exceptions at the calling locations",
        fix: "Swallowing exceptions hides the real application errors and does not remove the duplicated safety logic across calling code.",
      },
      {
        text: "Make the support ticket class a Singleton to track and coordinate a single global instance of the ticket state.",
        sub: "Restrict the ticketing system to one shared instance",
        fix: "Singleton manages class instance count; it does not solve how callers handle missing associations or optional fields.",
      },
    ],
    correctIndex: 1,
    proTip: "Null Object trades 'remember to check for null everywhere' for 'make the no-agent case behave safely by default' — it turns a defensive habit into a guarantee baked into the type.",
    lesson: "The Null Object pattern provides a default, do-nothing implementation of an interface to use in place of a null reference, so callers can invoke methods on the result unconditionally without crashing or needing a null check. Here, a NullAgent implementing Agent with a no-op notify() means every call site can simply call `ticket.getAssignedAgent().notify(...)` safely, eliminating both the scattered null-check duplication and the class of NullPointerException bugs caused by forgetting one.",
    remember: "Null Object: return a safe no-op implementation instead of null, so callers never have to remember to null-check.",
    interviewAnswer: "The real problem is that 'no agent assigned' is being represented as null, which pushes a null-check obligation onto every single caller, and predictably, some of them forgot and crashed in prod. The Null Object pattern fixes this at the source: instead of returning null, getAssignedAgent() returns a NullAgent that implements the same Agent interface but with no-op methods, so calling notify() on it just does nothing instead of throwing. Every call site can then treat the return value uniformly without an if-null-check, and the entire class of NullPointerExceptions from forgotten checks goes away.",
  },
  {
    id: "q-oop-anemic-001",
    subject: "OOP",
    concept: "Anemic Domain Model",
    difficulty: "hard",
    stem: "A Subscription class has only getters/setters for status, renewalDate, and planTier — no behavior. All the logic for \"can this subscription be cancelled,\" \"should it auto-renew,\" and \"is it eligible for a downgrade\" lives in a separate SubscriptionRules utility class that reads and writes Subscription's fields directly. New engineers keep adding subscription rules in three different utility classes because no one can find where the logic \"should\" live. What's this design smell called, and what's the fix?",
    options: [
      {
        text: "Premature Abstraction: Define subscription interfaces early to allow for multiple decoupled concrete representations.",
        sub: "Create extension points before actual requirements arise",
        fix: "Premature abstraction is about adding unnecessary interfaces too early; the issue here is the lack of behavior in the domain class.",
      },
      {
        text: "God Object: Split the bloated state properties into smaller, separate classes to improve cohesion and class readability.",
        sub: "Partition a large class with too many responsibilities",
        fix: "A God Object is overloaded with behavior; the subscription class has almost no behavior, so the opposite is true.",
      },
      {
        text: "Anemic Domain Model: Move the business validation logic directly onto the class as methods that enforce the object's own invariants.",
        sub: "Combine data and behavior within the primary domain object",
        fix: "",
      },
      {
        text: "Liskov Substitution Violation: Restructure the utility classes using class inheritance to ensure type-safe method overrides.",
        sub: "Adhere to subtype requirements in polymorphic hierarchies",
        fix: "There is no inheritance or subtype substitution occurring between the utility classes and the subscription class.",
      },
    ],
    correctIndex: 2,
    proTip: "If you can't answer 'where does the logic for X live?' without grepping three utility classes, your domain objects are probably anemic — push behavior back onto the objects that own the data it operates on.",
    lesson: "An Anemic Domain Model is a design where domain objects hold only data (getters/setters) while all business logic lives in separate service or utility classes that manipulate that data from outside — essentially modeling objects as structs instead of objects with behavior. This violates the basic OOP idea of bundling data with the operations that act on it, and in practice causes logic to scatter and duplicate across multiple utility classes, since there's no natural home for new rules. The fix is a rich domain model: move methods like cancel() and isEligibleForDowngrade() onto Subscription itself, where they can enforce invariants directly against the object's own state.",
    remember: "Anemic Domain Model = data-only objects with logic outsourced to utility classes; the fix is a rich model where behavior lives with the data it operates on.",
    interviewAnswer: "Subscription here is a pure data bag — getters and setters only — and all the actual business rules live in an external SubscriptionRules class that pokes at its fields from outside. That's the Anemic Domain Model smell: the object has no behavior of its own, so there's no natural home for new rules, which is exactly why engineers keep scattering subscription logic across three different utility classes. The fix is to make Subscription a rich domain model — move cancel(), isEligibleForDowngrade(), and shouldAutoRenew() onto the class itself, operating on its own fields, so the object enforces its own invariants and there's one obvious place for any new subscription rule to live.",
  },
];
