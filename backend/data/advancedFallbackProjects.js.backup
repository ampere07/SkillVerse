// Advanced and Expert level fallback projects
export const advancedProjects = {
  java: [
    {
      title: 'Task Scheduler with Priority Queue',
      description: 'Implement a task scheduling system using priority queues, custom comparators, and efficient data structures for managing tasks by priority and deadlines.',
      language: 'Java',
      requirements: '- Implement PriorityQueue<Task> with custom Comparator for priority sorting\n- Create Task class with priority, deadline, and dependencies\n- Implement addTask(), getNextTask(), and removeDependencies() methods\n- Use TreeSet for efficient range queries by deadline\n- Handle circular dependencies using graph cycle detection\n- Display tasks sorted by multiple criteria (priority, deadline, dependencies)',
      sampleOutput: '=== Task Scheduler ===\nAdding task: Deploy App (Priority: 1, Deadline: 2025-12-15)\nNext task to execute: Fix Critical Bug (Priority: 1, Deadline: 2025-12-10)\nTasks by deadline:\n1. Fix Bug - Dec 10\n2. Deploy App - Dec 15\n3. Write Docs - Dec 20',
      rubrics: '- Priority Queue (25 points): Correct implementation with custom comparator\n- Task Class Design (20 points): Proper encapsulation of task properties\n- Comparator Logic (20 points): Multi-criteria comparison\n- Dependency Management (20 points): Graph-based dependency handling\n- Efficient Queries (10 points): TreeSet usage for range queries\n- Code Quality (5 points): Clean architecture'
    },
    {
      title: 'Binary Search Tree Operations',
      description: 'Implement a Binary Search Tree with insertion, deletion, traversal methods, and advanced operations like finding successor and balancing checks.',
      language: 'Java',
      requirements: '- Create Node class with data, left, and right pointers\n- Implement insert(), delete(), search() operations\n- Implement all traversals: inorder, preorder, postorder\n- Add findMin(), findMax(), findSuccessor() methods\n- Implement height calculation and balance checking\n- Display tree structure visually in console',
      sampleOutput: '=== Binary Search Tree ===\nInserted: 50, 30, 70, 20, 40, 60, 80\nInorder: 20 30 40 50 60 70 80\nTree height: 3\nIs balanced: true\nFind successor of 50: 60',
      rubrics: '- BST Operations (30 points): Correct insert, delete, search\n- Traversals (20 points): All three traversal methods working\n- Advanced Methods (20 points): FindMin, findMax, findSuccessor\n- Height/Balance (15 points): Accurate calculations\n- Visual Display (10 points): Tree structure representation\n- Code Quality (5 points): Clean recursive implementations'
    },
    {
      title: 'Graph Path Finding',
      description: 'Implement graph data structure with Dijkstra shortest path algorithm, DFS, BFS, and cycle detection for solving pathfinding problems.',
      language: 'Java',
      requirements: '- Implement Graph class using adjacency list (HashMap<Integer, List<Edge>>)\n- Create Edge class with destination and weight\n- Implement Dijkstra algorithm using PriorityQueue\n- Add DFS and BFS traversal methods\n- Implement cycle detection using DFS\n- Display shortest path and total distance',
      sampleOutput: '=== Graph Pathfinding ===\nAdded edge: A -> B (weight: 4)\nDijkstra from A to E:\nShortest path: A -> B -> D -> E\nTotal distance: 12\nCycle detected: false',
      rubrics: '- Graph Implementation (25 points): Proper adjacency list structure\n- Dijkstra Algorithm (30 points): Correct shortest path calculation\n- DFS/BFS (20 points): Working traversal implementations\n- Cycle Detection (15 points): Accurate cycle finding\n- Path Reconstruction (5 points): Display complete path\n- Code Quality (5 points): Clean algorithm implementation'
    },
    {
      title: 'Expression Evaluator',
      description: 'Build an expression evaluator using stacks to parse and evaluate mathematical expressions with operator precedence and parentheses.',
      language: 'Java',
      requirements: '- Implement Shunting Yard algorithm for infix to postfix conversion\n- Use Stack<Character> for operators and Stack<Double> for operands\n- Handle operator precedence (+, -, *, /, ^)\n- Support parentheses for expression grouping\n- Evaluate postfix expression and return result\n- Handle invalid expressions with proper error messages',
      sampleOutput: '=== Expression Evaluator ===\nInfix: (3 + 5) * 2 - 8 / 4\nPostfix: 3 5 + 2 * 8 4 / -\nResult: 14.0\n\nInfix: 2 ^ 3 + 5\nPostfix: 2 3 ^ 5 +\nResult: 13.0',
      rubrics: '- Shunting Yard (30 points): Correct infix to postfix conversion\n- Stack Usage (25 points): Proper use of operator and operand stacks\n- Precedence Handling (20 points): Correct operator precedence\n- Parentheses (15 points): Proper handling of grouped expressions\n- Error Handling (5 points): Invalid expression detection\n- Code Quality (5 points): Clean stack-based implementation'
    },
    {
      title: 'LRU Cache Implementation',
      description: 'Implement Least Recently Used (LRU) cache using HashMap and LinkedList to achieve O(1) get and put operations.',
      language: 'Java',
      requirements: '- Use HashMap<Integer, Node> for O(1) lookup\n- Implement doubly linked list for O(1) removal and insertion\n- Create Node class with key, value, prev, and next\n- Implement get(key) to retrieve and move to front\n- Implement put(key, value) to add and evict if capacity exceeded\n- Display cache state and track hits/misses',
      sampleOutput: '=== LRU Cache (Capacity: 3) ===\nPut: (1, A)\nPut: (2, B)\nPut: (3, C)\nGet: 1 -> A (Hit)\nPut: (4, D) -> Evicted: 2\nCache: [4:D, 1:A, 3:C]\nHit rate: 50%',
      rubrics: '- HashMap Usage (25 points): Efficient key-value storage\n- Doubly Linked List (25 points): Proper node management\n- Get Operation (20 points): O(1) retrieval with update\n- Put Operation (20 points): O(1) insertion with eviction\n- Statistics (5 points): Hit/miss tracking\n- Code Quality (5 points): Clean O(1) operations'
    },
    {
      title: 'Sorting Algorithm Comparator',
      description: 'Implement and compare multiple sorting algorithms (Quick Sort, Merge Sort, Heap Sort) with performance analysis.',
      language: 'Java',
      requirements: '- Implement Quick Sort with random pivot selection\n- Implement Merge Sort with divide and conquer\n- Implement Heap Sort using max heap\n- Track comparisons and swaps for each algorithm\n- Measure execution time in milliseconds\n- Display performance comparison table',
      sampleOutput: '=== Sorting Comparator (1000 elements) ===\nQuick Sort: 2.5ms, 8,234 comparisons, 3,421 swaps\nMerge Sort: 3.1ms, 9,976 comparisons, 10,000 moves\nHeap Sort: 3.8ms, 18,459 comparisons, 2,000 swaps\nWinner: Quick Sort',
      rubrics: '- Quick Sort (20 points): Correct implementation with pivot\n- Merge Sort (20 points): Proper divide and conquer\n- Heap Sort (20 points): Max heap construction and sorting\n- Performance Tracking (25 points): Accurate comparison/swap counting\n- Time Measurement (10 points): Execution time tracking\n- Analysis (5 points): Comparison table display'
    }
  ],
  python: [
    {
      title: 'Task Scheduler with Priority Queue',
      description: 'Implement a task scheduling system using heapq for priority queues, custom comparison methods, and efficient data structures.',
      language: 'Python',
      requirements: '- Use heapq for priority queue with Task objects\n- Implement Task class with __lt__ for comparison by priority and deadline\n- Create add_task(), get_next_task(), and remove_dependencies() methods\n- Use bisect for maintaining sorted deadline list\n- Handle circular dependencies using DFS cycle detection\n- Display tasks sorted by multiple criteria',
      sampleOutput: '=== Task Scheduler ===\nAdding task: Deploy App (Priority: 1, Deadline: 2025-12-15)\nNext task: Fix Critical Bug (Priority: 1, Deadline: 2025-12-10)\nTasks by deadline:\n1. Fix Bug - Dec 10\n2. Deploy App - Dec 15\n3. Write Docs - Dec 20',
      rubrics: '- Heapq Usage (25 points): Correct priority queue with __lt__\n- Task Class (20 points): Proper dataclass or class with comparison\n- Custom Comparison (20 points): Multi-criteria __lt__ implementation\n- Dependency Management (20 points): Graph-based dependency handling\n- Bisect Usage (10 points): Efficient sorted insertions\n- Code Quality (5 points): Pythonic implementation'
    },
    {
      title: 'Binary Search Tree Operations',
      description: 'Implement a Binary Search Tree with insertion, deletion, traversal methods, and advanced operations using recursive Python patterns.',
      language: 'Python',
      requirements: '- Create Node class with data, left, and right\n- Implement insert(), delete(), search() as recursive methods\n- Implement generators for inorder, preorder, postorder traversals\n- Add find_min(), find_max(), find_successor() methods\n- Implement height calculation and is_balanced() check\n- Use __str__ for visual tree representation',
      sampleOutput: '=== Binary Search Tree ===\nInserted: 50, 30, 70, 20, 40, 60, 80\nInorder: [20, 30, 40, 50, 60, 70, 80]\nTree height: 3\nIs balanced: True\nSuccessor of 50: 60',
      rubrics: '- BST Operations (30 points): Correct insert, delete, search\n- Generator Traversals (20 points): yield-based traversals\n- Advanced Methods (20 points): find_min, find_max, find_successor\n- Height/Balance (15 points): Accurate recursive calculations\n- String Representation (10 points): __str__ tree visualization\n- Code Quality (5 points): Pythonic recursive style'
    },
    {
      title: 'Graph Path Finding',
      description: 'Implement graph data structure with Dijkstra algorithm using heapq, DFS, BFS, and cycle detection for pathfinding problems.',
      language: 'Python',
      requirements: '- Implement Graph class using defaultdict(list) for adjacency\n- Create Edge class or use tuples for (destination, weight)\n- Implement Dijkstra algorithm using heapq\n- Add DFS and BFS using generators\n- Implement cycle detection using DFS with recursion stack\n- Display shortest path and total distance',
      sampleOutput: '=== Graph Pathfinding ===\nAdded edge: A -> B (weight: 4)\nDijkstra from A to E:\nShortest path: A -> B -> D -> E\nTotal distance: 12\nCycle detected: False',
      rubrics: '- Graph Implementation (25 points): defaultdict adjacency list\n- Dijkstra Algorithm (30 points): heapq-based shortest path\n- DFS/BFS Generators (20 points): yield-based traversals\n- Cycle Detection (15 points): Recursion stack tracking\n- Path Reconstruction (5 points): Path backtracking\n- Code Quality (5 points): Pythonic patterns'
    },
    {
      title: 'Expression Evaluator',
      description: 'Build an expression evaluator using stacks (lists) to parse and evaluate mathematical expressions with operator precedence.',
      language: 'Python',
      requirements: '- Implement Shunting Yard algorithm for infix to postfix\n- Use list as stack for operators and operands\n- Handle operator precedence using dictionary\n- Support parentheses for expression grouping\n- Evaluate postfix expression with stack\n- Use try-except for error handling',
      sampleOutput: '=== Expression Evaluator ===\nInfix: (3 + 5) * 2 - 8 / 4\nPostfix: 3 5 + 2 * 8 4 / -\nResult: 14.0\n\nInfix: 2 ** 3 + 5\nPostfix: 2 3 ** 5 +\nResult: 13.0',
      rubrics: '- Shunting Yard (30 points): Correct infix to postfix\n- Stack Operations (25 points): List-based stack usage\n- Precedence Dictionary (20 points): Operator precedence mapping\n- Parentheses (15 points): Proper grouping handling\n- Error Handling (5 points): try-except for invalid input\n- Code Quality (5 points): Clean functional style'
    },
    {
      title: 'LRU Cache Implementation',
      description: 'Implement Least Recently Used cache using OrderedDict to achieve O(1) get and put operations with move_to_end().',
      language: 'Python',
      requirements: '- Use OrderedDict for cache storage\n- Implement get(key) with move_to_end(last=True)\n- Implement put(key, value) with capacity checking\n- Use popitem(last=False) for LRU eviction\n- Track cache hits and misses with property decorator\n- Display cache state as list',
      sampleOutput: '=== LRU Cache (Capacity: 3) ===\nPut: (1, A)\nPut: (2, B)\nPut: (3, C)\nGet: 1 -> A (Hit)\nPut: (4, D) -> Evicted: 2\nCache: [(4, D), (1, A), (3, C)]\nHit rate: 50.0%',
      rubrics: '- OrderedDict Usage (25 points): Proper ordered storage\n- Get Operation (25 points): O(1) with move_to_end\n- Put Operation (25 points): O(1) insertion with eviction\n- Property Decorator (15 points): hit_rate as @property\n- Statistics (5 points): Hit/miss tracking\n- Code Quality (5 points): Pythonic O(1) operations'
    },
    {
      title: 'Sorting Algorithm Comparator',
      description: 'Implement and compare sorting algorithms (Quick Sort, Merge Sort, Heap Sort) with performance analysis using decorators.',
      language: 'Python',
      requirements: '- Implement quick_sort() with random pivot\n- Implement merge_sort() with list slicing\n- Implement heap_sort() using heapq\n- Create @track_performance decorator for counting operations\n- Use time.perf_counter() for timing\n- Display comparison using f-strings',
      sampleOutput: '=== Sorting Comparator (1000 elements) ===\nQuick Sort: 2.5ms, 8,234 comparisons\nMerge Sort: 3.1ms, 9,976 comparisons\nHeap Sort: 1.8ms (heapq optimized)\nWinner: Heap Sort',
      rubrics: '- Quick Sort (20 points): Correct implementation with pivot\n- Merge Sort (20 points): Proper list slicing approach\n- Heap Sort (20 points): heapq.heapify and heappop usage\n- Performance Decorator (25 points): @track_performance implementation\n- Time Measurement (10 points): perf_counter usage\n- Analysis Display (5 points): f-string formatting'
    }
  ]
};

export const expertProjects = {
  java: [
    {
      title: 'Concurrent Task Queue Simulator',
      description: 'Simulate concurrent task processing with thread-safe queues, synchronization, and thread pool executor patterns.',
      language: 'Java',
      requirements: '- Implement BlockingQueue<Runnable> for thread-safe task queue\n- Create custom ThreadPoolExecutor simulation with worker threads\n- Use CountDownLatch for waiting on task completion\n- Implement ReentrantLock for critical sections\n- Add AtomicInteger for thread-safe counters\n- Display thread execution timeline and statistics',
      sampleOutput: '=== Concurrent Task Queue ===\n[Thread-1] Processing Task-1\n[Thread-2] Processing Task-2\n[Thread-1] Completed Task-1 (250ms)\nTotal tasks: 10, Completed: 10\nAverage time: 180ms\nThroughput: 55 tasks/sec',
      rubrics: '- BlockingQueue (25 points): Thread-safe queue operations\n- Thread Simulation (25 points): Worker thread management\n- Synchronization (20 points): Proper use of locks and latches\n- Atomic Operations (15 points): Thread-safe counters\n- Statistics (10 points): Performance metrics tracking\n- Code Quality (5 points): Concurrent programming patterns'
    },
    {
      title: 'Memory-Efficient Cache with TTL',
      description: 'Implement advanced caching system with Time-To-Live, memory limits, and multiple eviction strategies.',
      language: 'Java',
      requirements: '- Implement LRU cache using LinkedHashMap with access order\n- Add TTL (Time To Live) for cache entries with scheduled cleanup\n- Implement memory size tracking and limit enforcement\n- Support multiple eviction strategies (LRU, LFU, FIFO) using Strategy pattern\n- Use WeakReference for automatic garbage collection\n- Display cache statistics (hit rate, evictions, memory usage)',
      sampleOutput: '=== Advanced Cache (Max: 100MB, TTL: 60s) ===\nStrategy: LRU\nPut: key1 (size: 1.5MB, TTL: 60s)\nCache stats:\n- Hit rate: 75.5%\n- Evictions: 12\n- Memory: 85.3MB / 100MB\n- Expired entries: 5',
      rubrics: '- LinkedHashMap LRU (20 points): Access order implementation\n- TTL Management (25 points): Scheduled expiration\n- Memory Tracking (20 points): Size calculation and limits\n- Strategy Pattern (20 points): Multiple eviction policies\n- Statistics (10 points): Comprehensive metrics\n- Code Quality (5 points): Clean architecture'
    },
    {
      title: 'Event-Driven System Simulator',
      description: 'Build event processing system with Observer pattern, event queue, and complex event correlation.',
      language: 'Java',
      requirements: '- Implement PriorityQueue for time-ordered event processing\n- Create Observer pattern with multiple event listeners\n- Add event correlation engine to detect patterns (e.g., A followed by B within 5 seconds)\n- Use HashMap<String, List<Event>> for event history\n- Implement event filtering with Predicate<Event>\n- Display event timeline and detected patterns',
      sampleOutput: '=== Event-Driven System ===\nEvent: UserLogin (timestamp: 10:30:00)\nEvent: PurchaseAttempt (timestamp: 10:30:03)\nPattern detected: Login -> Purchase (3 seconds)\nListeners notified: 3\nEvent history: 127 events',
      rubrics: '- Priority Queue (20 points): Time-ordered processing\n- Observer Pattern (25 points): Publisher-subscriber implementation\n- Event Correlation (25 points): Pattern detection algorithm\n- Event Filtering (15 points): Predicate-based filtering\n- History Management (10 points): HashMap event storage\n- Code Quality (5 points): Event-driven patterns'
    },
    {
      title: 'B-Tree Index Structure',
      description: 'Implement B-Tree data structure for efficient database-style indexing with insertion, deletion, and range queries.',
      language: 'Java',
      requirements: '- Create BTreeNode class with keys array and children array\n- Implement insert() with node splitting when full\n- Implement search() with O(log n) complexity\n- Add range query: findRange(min, max) returning all keys in range\n- Implement delete() with node merging and rebalancing\n- Display tree structure level by level',
      sampleOutput: '=== B-Tree (Order: 5) ===\nInserted: 10, 20, 30, 40, 50, 60\nTree structure:\nLevel 0: [30]\nLevel 1: [10, 20] [40, 50, 60]\nSearch 40: Found\nRange [15, 45]: [20, 30, 40]\nHeight: 2',
      rubrics: '- Node Structure (20 points): Proper BTreeNode implementation\n- Insertion (25 points): Correct splitting algorithm\n- Search (20 points): Efficient O(log n) search\n- Range Query (20 points): In-order range traversal\n- Deletion (10 points): Node merging logic\n- Code Quality (5 points): Clean tree operations'
    },
    {
      title: 'Distributed Hash Table Simulator',
      description: 'Simulate distributed hash table with consistent hashing, node addition/removal, and data replication.',
      language: 'Java',
      requirements: '- Implement consistent hashing ring using TreeMap<Integer, Node>\n- Calculate hash values for nodes and keys using MD5\n- Support virtual nodes for load balancing (3 per physical node)\n- Implement data replication (store on N successor nodes)\n- Handle node addition/removal with data redistribution\n- Display ring structure and key distribution',
      sampleOutput: '=== Distributed Hash Table ===\nNodes: A, B, C (3 virtual each)\nPut: key1 -> hash: 12345 -> Node B\nReplication: B, C, A\nAdded Node D -> redistributing...\nKey distribution:\n- Node A: 245 keys\n- Node B: 238 keys\n- Node C: 251 keys\n- Node D: 242 keys',
      rubrics: '- Consistent Hashing (25 points): TreeMap ring implementation\n- Hash Function (15 points): MD5 or similar hashing\n- Virtual Nodes (20 points): Load balancing with multiple positions\n- Replication (20 points): N-way data replication\n- Redistribution (15 points): Handling node changes\n- Code Quality (5 points): Distributed system patterns'
    },
    {
      title: 'Stream Processing Pipeline',
      description: 'Build data processing pipeline with windowing, aggregations, and functional programming patterns.',
      language: 'Java',
      requirements: '- Use Stream API with map(), filter(), reduce() operations\n- Implement sliding window using Deque for last N elements\n- Create custom Collector for complex aggregations\n- Add parallel stream processing with parallelStream()\n- Implement groupingBy with multiple levels\n- Display pipeline stages and processing time',
      sampleOutput: '=== Stream Pipeline ===\nInput: 1000 events\nStage 1 (filter): 650 events\nStage 2 (map): 650 transformed\nStage 3 (window avg): [5.2, 6.1, 7.3]\nGrouped by category:\n- A: 250 (avg: 5.5)\n- B: 400 (avg: 7.2)\nProcessing: 45ms (parallel)',
      rubrics: '- Stream Operations (25 points): Proper map/filter/reduce\n- Sliding Window (20 points): Deque-based windowing\n- Custom Collector (20 points): Complex aggregation logic\n- Parallel Processing (20 points): parallelStream usage\n- Multi-level Grouping (10 points): Nested groupingBy\n- Code Quality (5 points): Functional programming style'
    }
  ],
  python: [
    {
      title: 'Concurrent Task Queue with Asyncio',
      description: 'Implement async task processing with asyncio queues, coroutines, and concurrent task execution.',
      language: 'Python',
      requirements: '- Use asyncio.Queue for async task queue\n- Implement async worker coroutines with async/await\n- Use asyncio.gather() for concurrent task execution\n- Add asyncio.Semaphore for rate limiting\n- Implement async context manager for resource management\n- Display task execution timeline and statistics',
      sampleOutput: '=== Async Task Queue ===\n[Worker-1] Processing Task-1\n[Worker-2] Processing Task-2\n[Worker-1] Completed Task-1 (0.25s)\nTotal: 10, Completed: 10\nAverage: 0.18s\nThroughput: 55 tasks/sec',
      rubrics: '- Asyncio Queue (25 points): async queue operations\n- Coroutines (25 points): async/await worker implementation\n- Gather Usage (20 points): Concurrent execution with gather\n- Semaphore (15 points): Rate limiting implementation\n- Context Manager (10 points): async __aenter__/__aexit__\n- Code Quality (5 points): Async patterns'
    },
    {
      title: 'Memory-Efficient Cache with TTL',
      description: 'Implement advanced caching with TTL, memory limits, and weakref for automatic cleanup.',
      language: 'Python',
      requirements: '- Use OrderedDict with move_to_end() for LRU\n- Add TTL with time.time() and background cleanup\n- Implement __sizeof__ for memory tracking\n- Support cache decorators with functools.wraps\n- Use WeakValueDictionary for automatic garbage collection\n- Display statistics using @property decorators',
      sampleOutput: '=== Advanced Cache (Max: 100MB, TTL: 60s) ===\nStrategy: LRU\nCached: key1 (size: 1.5MB, TTL: 60s)\nStats:\n- Hit rate: 75.5%\n- Evictions: 12\n- Memory: 85.3MB / 100MB\n- Expired: 5',
      rubrics: '- OrderedDict LRU (20 points): move_to_end implementation\n- TTL Management (25 points): time-based expiration\n- Memory Tracking (20 points): __sizeof__ implementation\n- Cache Decorator (20 points): functools.wraps decorator\n- Property Statistics (10 points): @property for metrics\n- Code Quality (5 points): Pythonic patterns'
    },
    {
      title: 'Event-Driven System with Observers',
      description: 'Build event processing with observer pattern, event correlation, and pattern matching.',
      language: 'Python',
      requirements: '- Use heapq for time-ordered event processing\n- Implement observer pattern with weakref callbacks\n- Add event correlation with pattern matching (dataclasses)\n- Use defaultdict(list) for event history\n- Implement filtering with lambda functions\n- Display timeline and detected patterns',
      sampleOutput: '=== Event-Driven System ===\nEvent: UserLogin (ts: 10:30:00)\nEvent: Purchase (ts: 10:30:03)\nPattern: Login -> Purchase (3s)\nListeners: 3 notified\nHistory: 127 events',
      rubrics: '- Heapq Events (20 points): Time-ordered processing\n- Observer Pattern (25 points): weakref callback implementation\n- Event Correlation (25 points): Pattern matching with dataclasses\n- Event History (15 points): defaultdict storage\n- Lambda Filtering (10 points): Functional filtering\n- Code Quality (5 points): Event-driven patterns'
    },
    {
      title: 'Trie-Based Autocomplete',
      description: 'Implement Trie data structure for efficient prefix-based search and autocomplete functionality.',
      language: 'Python',
      requirements: '- Create TrieNode class with children dict and is_end flag\n- Implement insert(word) for adding words\n- Add search(prefix) returning all words with prefix\n- Implement __contains__ for word existence check\n- Add word frequency tracking with Counter\n- Display suggestions sorted by frequency',
      sampleOutput: '=== Trie Autocomplete ===\nInserted: apple, application, apply, apartment\nSearch "app": [apple(5), application(3), apply(2)]\nContains "apple": True\nTotal words: 1,234\nPrefix searches: O(k) where k=prefix length',
      rubrics: '- Trie Structure (25 points): TrieNode with children dict\n- Insertion (20 points): Correct word insertion\n- Prefix Search (25 points): Efficient prefix matching\n- Contains Check (15 points): __contains__ implementation\n- Frequency Sorting (10 points): Counter-based ranking\n- Code Quality (5 points): Clean trie operations'
    },
    {
      title: 'Consistent Hashing Simulator',
      description: 'Simulate consistent hashing with virtual nodes, hash ring, and dynamic node management.',
      language: 'Python',
      requirements: '- Use bisect for maintaining sorted hash ring\n- Implement hash function using hashlib.md5\n- Support virtual nodes (replicas per node)\n- Add get_node(key) for key assignment\n- Handle add_node/remove_node with rebalancing\n- Display ring and key distribution',
      sampleOutput: '=== Consistent Hashing ===\nNodes: A, B, C (3 virtual each)\nKey "user123" -> Node B\nAdded Node D -> rebalancing...\nDistribution:\n- A: 245 keys (24.5%)\n- B: 238 keys (23.8%)\n- C: 251 keys (25.1%)\n- D: 242 keys (24.2%)',
      rubrics: '- Bisect Ring (25 points): Sorted ring with bisect\n- Hash Function (15 points): hashlib.md5 implementation\n- Virtual Nodes (20 points): Multiple positions per node\n- Key Assignment (20 points): get_node algorithm\n- Rebalancing (15 points): Dynamic node changes\n- Code Quality (5 points): Distributed patterns'
    },
    {
      title: 'Data Processing Pipeline',
      description: 'Build processing pipeline with generators, itertools, and functional programming patterns.',
      language: 'Python',
      requirements: '- Use generator functions with yield for lazy evaluation\n- Implement sliding window with itertools recipes\n- Create custom aggregations with functools.reduce\n- Add parallel processing with multiprocessing.Pool\n- Use itertools.groupby for grouping operations\n- Display pipeline stages and memory efficiency',
      sampleOutput: '=== Processing Pipeline ===\nInput: 10,000 events (streaming)\nStage 1 (filter): 6,500 events\nStage 2 (map): transformed\nStage 3 (window): [5.2, 6.1, 7.3]\nGrouped:\n- A: 2,500 (avg: 5.5)\n- B: 4,000 (avg: 7.2)\nMemory: O(window_size) not O(n)',
      rubrics: '- Generators (25 points): yield-based lazy evaluation\n- Itertools Recipes (20 points): windowing implementation\n- Reduce Aggregations (20 points): functools.reduce usage\n- Parallel Processing (20 points): multiprocessing.Pool\n- Groupby Operations (10 points): itertools.groupby\n- Code Quality (5 points): Functional style'
    }
  ]
};
