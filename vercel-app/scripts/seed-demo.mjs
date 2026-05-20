import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "wms_config_explorer";

if (!uri) {
  throw new Error("Missing MONGODB_URI");
}

const now = new Date().toISOString();

const demoFlows = [
  {
    configName: "STD_ECOM",
    spName: "spAllocateStandard",
    client: "DemoClient_A",
    logicType: "Allocation",
    status: "published",
    overview: "Standard e-commerce allocation flow that prioritizes the primary warehouse and falls back to secondary inventory when needed.",
    description: "Standard e-commerce allocation flow that prioritizes the primary warehouse and falls back to secondary inventory when needed.",
    mermaid: `flowchart TD
  A([Order received]) --> B{Primary warehouse<br/>has full stock?}
  B -->|Yes| C[Allocate primary]
  B -->|Partial only| D{Split allowed?}
  B -->|No| E{Secondary warehouse<br/>has stock?}
  D -->|Yes| F[Split allocation]
  D -->|No| E
  E -->|Yes| G[Allocate secondary]
  E -->|No| H([Backorder])
  C --> I([Generate pick slip])
  F --> I
  G --> I`,
    examples: [
      {
        title: "Primary warehouse has enough stock",
        scenario: "Order quantity is 10 and the primary warehouse has 20 available units.",
        expectedResult: "The full quantity is allocated from the primary warehouse and a pick slip is generated."
      },
      {
        title: "Primary warehouse only has partial stock",
        scenario: "Order quantity is 10, primary warehouse has 4 units, secondary warehouse has 10 units, and split allocation is allowed.",
        expectedResult: "The order is split between primary and secondary inventory before pick slip generation."
      },
      {
        title: "No warehouse can fulfill the order",
        scenario: "Order quantity is 10, primary has 0 units, and secondary has 0 units.",
        expectedResult: "The order is backordered instead of being released for picking."
      }
    ],
    hashtags: ["allocation", "standard", "ecommerce", "warehouse"]
  },
  {
    configName: "STD_ECOM",
    spName: "spAllocateStandard_Peak",
    client: "DemoClient_A",
    logicType: "Allocation",
    status: "published",
    overview: "Peak season allocation variant that checks warehouse capacity before deciding whether to route orders to primary or secondary inventory.",
    description: "Peak season allocation variant that checks warehouse capacity before deciding whether to route orders to primary or secondary inventory.",
    mermaid: `flowchart TD
  A([Order received]) --> B{Peak season flag<br/>active?}
  B -->|No| C[Use standard allocation]
  B -->|Yes| D{Primary capacity<br/>below threshold?}
  D -->|Yes| E[Reroute to secondary]
  D -->|No| F[Allocate primary]
  C --> G([Generate pick slip])
  E --> G
  F --> G`,
    examples: [
      {
        title: "Peak flag is inactive",
        scenario: "The order is imported on a normal business day and the peak flag is off.",
        expectedResult: "The system uses the standard e-commerce allocation flow."
      },
      {
        title: "Primary warehouse is overloaded",
        scenario: "Peak flag is active and the primary warehouse has already reached its daily capacity threshold.",
        expectedResult: "The order is routed to secondary inventory to reduce pressure on the primary operation."
      },
      {
        title: "Primary warehouse still has capacity",
        scenario: "Peak flag is active but primary warehouse capacity remains below the threshold.",
        expectedResult: "The order is still allocated from primary inventory."
      }
    ],
    hashtags: ["allocation", "peak", "ecommerce", "capacity"]
  },
  {
    configName: "XBORDER_RTL",
    spName: "spAllocateCrossBorder",
    client: "DemoClient_B",
    logicType: "Allocation",
    status: "published",
    overview: "Cross-border retail allocation flow that checks destination restrictions, customs documentation, and hub routing before releasing work.",
    description: "Cross-border retail allocation flow that checks destination restrictions, customs documentation, and hub routing before releasing work.",
    mermaid: `flowchart TD
  A([Order received]) --> B{Destination country<br/>restricted?}
  B -->|Yes| C([Reject order])
  B -->|No| D{Customs documents<br/>available?}
  D -->|No| E[Hold for documents]
  D -->|Yes| F{Route through<br/>regional hub?}
  F -->|Yes| G[Allocate hub inventory]
  F -->|No| H[Allocate local inventory]
  G --> I([Generate pick slip])
  H --> I
  E --> J([Notify CS team])`,
    examples: [
      {
        title: "Restricted destination",
        scenario: "The destination country is blocked by the current shipping policy.",
        expectedResult: "The order is rejected before inventory is reserved."
      },
      {
        title: "Missing customs paperwork",
        scenario: "The destination is allowed, but required customs documents are not available yet.",
        expectedResult: "The order is held and the customer service team is notified."
      },
      {
        title: "Hub routing required",
        scenario: "The destination is allowed, documents are ready, and the order must pass through the regional hub.",
        expectedResult: "The system allocates hub inventory and generates the pick slip."
      }
    ],
    hashtags: ["allocation", "crossborder", "retail", "customs"]
  },
  {
    configName: "B2B_BULK",
    spName: "spAllocateBulkB2B",
    client: "DemoClient_C",
    logicType: "Allocation",
    status: "published",
    overview: "B2B bulk allocation flow for pallet-level reservation, minimum order quantity validation, and mixed pallet handling.",
    description: "B2B bulk allocation flow for pallet-level reservation, minimum order quantity validation, and mixed pallet handling.",
    mermaid: `flowchart TD
  A([PO received]) --> B{Order meets MOQ?}
  B -->|No| C([Reject or request adjustment])
  B -->|Yes| D{Full pallet<br/>available?}
  D -->|Yes| E[Reserve full pallets]
  D -->|No| F{Mixed pallet<br/>allowed?}
  F -->|Yes| G[Build mixed pallet]
  F -->|No| H([Partial backorder])
  E --> I([Generate pick slip])
  G --> I`,
    examples: [
      {
        title: "Below minimum order quantity",
        scenario: "The purchase order quantity is below the configured MOQ.",
        expectedResult: "The order is rejected or sent back for quantity adjustment."
      },
      {
        title: "Full pallets are available",
        scenario: "The purchase order meets MOQ and full pallets are available in inventory.",
        expectedResult: "The system reserves full pallets and generates the pick slip."
      },
      {
        title: "Mixed pallet is allowed",
        scenario: "No full pallet is available, but the storer allows mixed pallet picking.",
        expectedResult: "The system builds a mixed pallet allocation and releases the work."
      }
    ],
    hashtags: ["allocation", "b2b", "bulk", "pallet"]
  }
];

const client = new MongoClient(uri);

try {
  await client.connect();
  const db = client.db(dbName);
  const flows = db.collection("flows");

  for (const flow of demoFlows) {
    await flows.updateOne(
      { configName: flow.configName, spName: flow.spName },
      {
        $set: {
          ...flow,
          relatedConfigs: flow.hashtags,
          seed: "demo",
          updatedBy: "Demo Seed",
          updatedByUserId: "seed:demo",
          updatedAt: now
        },
        $setOnInsert: {
          createdAt: now
        }
      },
      { upsert: true }
    );
  }

  console.log(`Seeded ${demoFlows.length} demo flowcharts into ${dbName}.`);
} finally {
  await client.close();
}
