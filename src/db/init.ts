import { createClient } from "@libsql/client";
import { AGENTS, AGENT_IDS } from "../agents/definitions";

export async function initDatabase() {
  const url = process.env.DATABASE_URL || "file:./world.db";
  const authToken = process.env.DATABASE_AUTH_TOKEN;

  console.log(`[DB Init] Initializing database schema on ${url.startsWith("file:") ? "local SQLite" : "remote LibSQL/Turso"}...`);

  const client = createClient({ url, authToken });

  try {
    // 1. Create all 13 tables if they do not exist
    await client.executeMultiple(`
      CREATE TABLE IF NOT EXISTS agents (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        drive TEXT NOT NULL,
        color TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT ''
      );

      CREATE TABLE IF NOT EXISTS memories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agent_id TEXT NOT NULL REFERENCES agents(id),
        epoch INTEGER NOT NULL,
        content TEXT NOT NULL,
        token_count INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        epoch INTEGER NOT NULL,
        agent_id TEXT NOT NULL REFERENCES agents(id),
        content TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'thought',
        reply_to INTEGER,
        created_at TEXT NOT NULL DEFAULT ''
      );

      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        epoch INTEGER NOT NULL,
        from_agent TEXT NOT NULL REFERENCES agents(id),
        to_agent TEXT NOT NULL REFERENCES agents(id),
        content TEXT NOT NULL,
        read INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT ''
      );

      CREATE TABLE IF NOT EXISTS proposals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        epoch INTEGER NOT NULL,
        proposed_by TEXT NOT NULL REFERENCES agents(id),
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        action_type TEXT NOT NULL,
        action_payload TEXT NOT NULL DEFAULT '{}',
        expires_epoch INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT ''
      );

      CREATE TABLE IF NOT EXISTS votes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        proposal_id INTEGER NOT NULL REFERENCES proposals(id),
        agent_id TEXT NOT NULL REFERENCES agents(id),
        vote TEXT NOT NULL,
        reason TEXT NOT NULL DEFAULT ''
      );

      CREATE TABLE IF NOT EXISTS pages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        created_by TEXT NOT NULL REFERENCES agents(id),
        created_epoch INTEGER NOT NULL,
        last_modified_by TEXT REFERENCES agents(id),
        last_modified_epoch INTEGER
      );

      CREATE TABLE IF NOT EXISTS void_state (
        id INTEGER PRIMARY KEY DEFAULT 1,
        content TEXT NOT NULL DEFAULT '',
        last_modified_by TEXT REFERENCES agents(id),
        last_modified_epoch INTEGER
      );

      CREATE TABLE IF NOT EXISTS relationships (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agent_a TEXT NOT NULL REFERENCES agents(id),
        agent_b TEXT NOT NULL REFERENCES agents(id),
        sentiment REAL NOT NULL DEFAULT 0,
        interaction_count INTEGER NOT NULL DEFAULT 0,
        last_epoch INTEGER,
        notes TEXT NOT NULL DEFAULT ''
      );

      CREATE TABLE IF NOT EXISTS epochs (
        number INTEGER PRIMARY KEY,
        started_at TEXT NOT NULL,
        completed_at TEXT,
        summary TEXT NOT NULL DEFAULT '',
        agent_order TEXT NOT NULL DEFAULT '[]'
      );

      CREATE TABLE IF NOT EXISTS site_config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        modified_by TEXT REFERENCES agents(id),
        modified_epoch INTEGER
      );

      CREATE TABLE IF NOT EXISTS suggestions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        read INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT ''
      );

      CREATE TABLE IF NOT EXISTS skills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agent_id TEXT NOT NULL REFERENCES agents(id),
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        level INTEGER NOT NULL DEFAULT 1,
        epoch INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT ''
      );
    `);

    // 2. Check if database has initial seeds
    const now = new Date().toISOString();
    const epochCheck = await client.execute("SELECT COUNT(*) as c FROM epochs");
    const epochCount = Number(epochCheck.rows[0]?.c ?? 0);

    if (epochCount === 0) {
      console.log("[DB Init] Database is fresh; seeding initial entities...");

      // Seed agents
      for (const id of AGENT_IDS) {
        const a = AGENTS[id];
        if (a) {
          await client.execute({
            sql: "INSERT OR IGNORE INTO agents (id, name, role, drive, color, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            args: [a.id, a.name, a.role, a.drive, a.color, now],
          });
        }
      }

      // Seed void state
      await client.execute("INSERT OR IGNORE INTO void_state (id, content) VALUES (1, '')");

      // Seed site config
      await client.execute({
        sql: "INSERT OR IGNORE INTO site_config (key, value) VALUES (?, ?)",
        args: ["site_name", "Agent Cosmos"],
      });
      await client.execute({
        sql: "INSERT OR IGNORE INTO site_config (key, value) VALUES (?, ?)",
        args: ["site_tagline", "Autonomous Living Ecosystem"],
      });

      // Seed Epoch 0
      await client.execute({
        sql: "INSERT OR IGNORE INTO epochs (number, started_at, completed_at, summary, agent_order) VALUES (?, ?, ?, ?, ?)",
        args: [0, now, now, "The cosmos awakens.", JSON.stringify(AGENT_IDS)],
      });
    }

    console.log("[DB Init] Database schema verified and ready.");
  } catch (err) {
    console.error("[DB Init] Error verifying database schema:", err);
    // Do not crash the build if database is remote and unreachable; pages have fallbacks
  } finally {
    client.close();
  }
}

// Auto-run if executed directly via CLI
if (require.main === module) {
  initDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[DB Init] Fatal:", err);
      process.exit(0); // Exit 0 so next build can attempt build with safe fallbacks
    });
}
