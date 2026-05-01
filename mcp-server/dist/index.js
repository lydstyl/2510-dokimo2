"use strict";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
import Database from "better-sqlite3";
import { randomUUID } from "crypto";
import { z } from "zod";
const DB_PATH = process.env.DATABASE_PATH ?? "/app/data/dev.db";
const PORT = parseInt(process.env.PORT ?? "3000");
function openDb() {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  return db;
}
function buildServer(db) {
  const server = new McpServer({ name: "dokimo-mcp", version: "1.0.0" });
  server.tool(
    "list_landlords",
    "Liste tous les propri\xE9taires avec leurs informations de contact",
    {},
    async () => {
      const rows = db.prepare(`
        SELECT id, name, type, email, phone, address, siret, managerName, managerEmail
        FROM Landlord
        ORDER BY name
      `).all();
      return { content: [{ type: "text", text: JSON.stringify(rows, null, 2) }] };
    }
  );
  server.tool(
    "get_tenants_by_landlord",
    "Retourne tous les locataires (email, t\xE9l\xE9phone) li\xE9s \xE0 un propri\xE9taire via ses biens et baux",
    { landlord: z.string().describe("Nom ou ID du propri\xE9taire") },
    async ({ landlord }) => {
      const rows = db.prepare(`
        SELECT DISTINCT
          t.id              AS tenant_id,
          t.civility,
          t.firstName,
          t.lastName,
          t.type            AS tenant_type,
          t.email,
          t.phone,
          t.siret           AS tenant_siret,
          t.managerName,
          t.managerEmail,
          l.id              AS landlord_id,
          l.name            AS landlord_name,
          p.id              AS property_id,
          p.name            AS property_name,
          p.address         AS property_address,
          p.city            AS property_city,
          ls.id             AS lease_id,
          ls.startDate      AS lease_start,
          ls.endDate        AS lease_end,
          ls.rentAmount,
          ls.chargesAmount
        FROM Tenant t
        JOIN LeaseTenant lt ON lt.tenantId  = t.id
        JOIN Lease ls        ON ls.id        = lt.leaseId
        JOIN Property p      ON p.id         = ls.propertyId
        JOIN Landlord l      ON l.id         = p.landlordId
        WHERE l.id = ? OR LOWER(l.name) LIKE LOWER(?)
        ORDER BY t.lastName, t.firstName
      `).all(landlord, `%${landlord}%`);
      return { content: [{ type: "text", text: JSON.stringify(rows, null, 2) }] };
    }
  );
  server.tool(
    "get_properties_by_landlord",
    "Retourne tous les biens immobiliers d'un propri\xE9taire avec le nombre de baux actifs",
    { landlord: z.string().describe("Nom ou ID du propri\xE9taire") },
    async ({ landlord }) => {
      const rows = db.prepare(`
        SELECT
          p.id, p.name, p.type, p.address, p.postalCode, p.city,
          l.name  AS landlord_name,
          b.name  AS building_name,
          COUNT(DISTINCT ls.id) AS total_leases,
          COUNT(DISTINCT CASE
            WHEN ls.endDate IS NULL OR ls.endDate > datetime('now') THEN ls.id
          END) AS active_leases
        FROM Property p
        JOIN Landlord l       ON l.id = p.landlordId
        LEFT JOIN Building b  ON b.id = p.buildingId
        LEFT JOIN Lease ls    ON ls.propertyId = p.id
        WHERE l.id = ? OR LOWER(l.name) LIKE LOWER(?)
        GROUP BY p.id
        ORDER BY p.city, p.address
      `).all(landlord, `%${landlord}%`);
      return { content: [{ type: "text", text: JSON.stringify(rows, null, 2) }] };
    }
  );
  server.tool(
    "get_active_leases",
    "Retourne les baux actuellement actifs avec locataires et emails, filtr\xE9s optionnellement par propri\xE9taire",
    { landlord: z.string().optional().describe("Nom ou ID du propri\xE9taire (optionnel)") },
    async ({ landlord }) => {
      let sql = `
        SELECT
          ls.id             AS lease_id,
          ls.startDate,
          ls.endDate,
          ls.rentAmount,
          ls.chargesAmount,
          ls.rentAmount + ls.chargesAmount AS total_monthly,
          ls.paymentDueDay,
          p.name            AS property_name,
          p.address,
          p.city,
          l.name            AS landlord_name,
          GROUP_CONCAT(
            COALESCE(t.civility || ' ', '') || t.firstName || ' ' || t.lastName, ' / '
          )                 AS tenants,
          GROUP_CONCAT(COALESCE(t.email, ''), ' / ') AS tenant_emails
        FROM Lease ls
        JOIN Property p        ON p.id      = ls.propertyId
        JOIN Landlord l        ON l.id      = p.landlordId
        LEFT JOIN LeaseTenant lt ON lt.leaseId = ls.id
        LEFT JOIN Tenant t       ON t.id     = lt.tenantId
        WHERE (ls.endDate IS NULL OR ls.endDate > datetime('now'))
      `;
      const params = [];
      if (landlord) {
        sql += ` AND (l.id = ? OR LOWER(l.name) LIKE LOWER(?))`;
        params.push(landlord, `%${landlord}%`);
      }
      sql += ` GROUP BY ls.id ORDER BY l.name, p.name`;
      const rows = db.prepare(sql).all(...params);
      return { content: [{ type: "text", text: JSON.stringify(rows, null, 2) }] };
    }
  );
  server.tool(
    "search_tenants",
    "Recherche des locataires par nom, pr\xE9nom ou email",
    { query: z.string().describe("Terme de recherche (nom, pr\xE9nom ou email)") },
    async ({ query }) => {
      const term = `%${query}%`;
      const rows = db.prepare(`
        SELECT
          t.id, t.civility, t.firstName, t.lastName, t.type,
          t.email, t.phone,
          l.name  AS landlord_name,
          p.name  AS property_name,
          p.address, p.city,
          ls.id   AS lease_id,
          ls.rentAmount,
          ls.chargesAmount,
          ls.endDate
        FROM Tenant t
        LEFT JOIN LeaseTenant lt ON lt.tenantId  = t.id
        LEFT JOIN Lease ls       ON ls.id         = lt.leaseId
        LEFT JOIN Property p     ON p.id          = ls.propertyId
        LEFT JOIN Landlord l     ON l.id          = p.landlordId
        WHERE LOWER(t.firstName) LIKE LOWER(?)
           OR LOWER(t.lastName)  LIKE LOWER(?)
           OR LOWER(t.email)     LIKE LOWER(?)
        ORDER BY t.lastName, t.firstName
      `).all(term, term, term);
      return { content: [{ type: "text", text: JSON.stringify(rows, null, 2) }] };
    }
  );
  server.tool(
    "get_payment_summary_by_landlord",
    "R\xE9sum\xE9 des paiements sur les N derniers mois pour les baux actifs d'un propri\xE9taire",
    {
      landlord: z.string().describe("Nom ou ID du propri\xE9taire"),
      months: z.number().optional().describe("Nombre de mois \xE0 analyser (d\xE9faut : 3)")
    },
    async ({ landlord, months = 3 }) => {
      const rows = db.prepare(`
        SELECT
          l.name  AS landlord_name,
          p.name  AS property_name,
          p.address, p.city,
          ls.id   AS lease_id,
          ls.rentAmount,
          ls.chargesAmount,
          ls.rentAmount + ls.chargesAmount  AS total_due_monthly,
          COUNT(py.id)                      AS payment_count,
          COALESCE(SUM(py.amount), 0)       AS total_paid,
          GROUP_CONCAT(t.firstName || ' ' || t.lastName, ' / ') AS tenants
        FROM Lease ls
        JOIN Property p          ON p.id        = ls.propertyId
        JOIN Landlord l          ON l.id        = p.landlordId
        LEFT JOIN LeaseTenant lt ON lt.leaseId  = ls.id
        LEFT JOIN Tenant t       ON t.id        = lt.tenantId
        LEFT JOIN Payment py     ON py.leaseId  = ls.id
          AND py.paymentDate >= date('now', '-' || ? || ' months')
        WHERE (l.id = ? OR LOWER(l.name) LIKE LOWER(?))
          AND (ls.endDate IS NULL OR ls.endDate > datetime('now'))
        GROUP BY ls.id
        ORDER BY p.city, p.name
      `).all(months, landlord, `%${landlord}%`);
      return { content: [{ type: "text", text: JSON.stringify(rows, null, 2) }] };
    }
  );
  server.tool(
    "find_leases_by_tenant",
    "Recherche les baux actifs par nom ou pr\xE9nom de locataire. Retourne le lease_id n\xE9cessaire pour add_payment.",
    { tenant: z.string().describe("Nom ou pr\xE9nom du locataire (recherche partielle)") },
    async ({ tenant }) => {
      const term = `%${tenant}%`;
      const rows = db.prepare(`
        SELECT
          ls.id             AS lease_id,
          ls.startDate,
          ls.endDate,
          ls.rentAmount,
          ls.chargesAmount,
          ls.rentAmount + ls.chargesAmount AS total_monthly,
          ls.paymentDueDay,
          p.name            AS property_name,
          p.address,
          p.city,
          l.name            AS landlord_name,
          GROUP_CONCAT(
            COALESCE(t.civility || ' ', '') || t.firstName || ' ' || t.lastName, ' / '
          )                 AS tenants,
          GROUP_CONCAT(COALESCE(t.email, ''), ' / ') AS tenant_emails,
          (
            SELECT COALESCE(SUM(py.amount), 0)
            FROM Payment py
            WHERE py.leaseId = ls.id
              AND py.paymentDate >= date('now', 'start of month')
          )                 AS paid_this_month,
          (
            SELECT COUNT(py.id)
            FROM Payment py
            WHERE py.leaseId = ls.id
          )                 AS total_payment_count
        FROM Lease ls
        JOIN Property p        ON p.id      = ls.propertyId
        JOIN Landlord l        ON l.id      = p.landlordId
        JOIN LeaseTenant lt    ON lt.leaseId = ls.id
        JOIN Tenant t          ON t.id      = lt.tenantId
        WHERE (ls.endDate IS NULL OR ls.endDate > datetime('now'))
          AND (
            LOWER(t.firstName) LIKE LOWER(?)
            OR LOWER(t.lastName)  LIKE LOWER(?)
            OR LOWER(t.firstName || ' ' || t.lastName) LIKE LOWER(?)
            OR LOWER(t.lastName  || ' ' || t.firstName) LIKE LOWER(?)
          )
        GROUP BY ls.id
        ORDER BY l.name, p.name
      `).all(term, term, term, term);
      return { content: [{ type: "text", text: JSON.stringify(rows, null, 2) }] };
    }
  );
  server.tool(
    "add_payment",
    "Enregistre un paiement pour un bail. Utiliser find_leases_by_tenant pour obtenir le lease_id au pr\xE9alable.",
    {
      lease_id: z.string().describe("ID du bail (obtenu via find_leases_by_tenant)"),
      amount: z.number().positive().describe("Montant du paiement en euros"),
      payment_date: z.string().describe("Date du paiement au format YYYY-MM-DD"),
      notes: z.string().optional().describe("Notes optionnelles")
    },
    async ({ lease_id, amount, payment_date, notes }) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(payment_date)) {
        return {
          content: [{ type: "text", text: "Erreur : date invalide, format attendu YYYY-MM-DD (ex: 2026-05-01)." }],
          isError: true
        };
      }
      const lease = db.prepare(`
        SELECT
          ls.id,
          ls.rentAmount,
          ls.chargesAmount,
          p.name  AS property_name,
          p.city,
          l.name  AS landlord_name,
          GROUP_CONCAT(
            COALESCE(t.civility || ' ', '') || t.firstName || ' ' || t.lastName, ' / '
          ) AS tenants
        FROM Lease ls
        JOIN Property p          ON p.id       = ls.propertyId
        JOIN Landlord l          ON l.id       = p.landlordId
        LEFT JOIN LeaseTenant lt ON lt.leaseId = ls.id
        LEFT JOIN Tenant t       ON t.id       = lt.tenantId
        WHERE ls.id = ?
        GROUP BY ls.id
      `).get(lease_id);
      if (!lease) {
        return {
          content: [{ type: "text", text: `Erreur : bail "${lease_id}" introuvable.` }],
          isError: true
        };
      }
      const id = randomUUID();
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const paymentDateISO = `${payment_date}T00:00:00.000Z`;
      db.prepare(`
        INSERT INTO Payment (id, leaseId, amount, paymentDate, notes, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, lease_id, amount, paymentDateISO, notes ?? null, now, now);
      const result = {
        success: true,
        message: `Paiement de ${amount} \u20AC enregistr\xE9 pour ${lease.tenants} \u2014 ${lease.property_name}, ${lease.city}.`,
        payment: { id, lease_id, amount, payment_date, notes: notes ?? null },
        lease: {
          property: `${lease.property_name} (${lease.city})`,
          landlord: lease.landlord_name,
          tenants: lease.tenants,
          rent: lease.rentAmount,
          charges: lease.chargesAmount,
          total_monthly: lease.rentAmount + lease.chargesAmount
        }
      };
      console.log(`[add_payment] ${amount}\u20AC \u2192 bail ${lease_id} (${lease.tenants})`);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );
  return server;
}
const app = express();
app.use(express.json());
app.use("/mcp", (req, res, next) => {
  const authDb = openDb();
  try {
    const hasAnyKey = authDb.prepare(
      `SELECT 1 FROM ApiKey WHERE revokedAt IS NULL LIMIT 1`
    ).get();
    if (!hasAnyKey) {
      return next();
    }
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const incomingKey = auth.slice(7);
    const valid = authDb.prepare(
      `SELECT id FROM ApiKey WHERE key = ? AND revokedAt IS NULL LIMIT 1`
    ).get(incomingKey);
    if (!valid) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    next();
  } finally {
    authDb.close();
  }
});
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "dokimo-mcp", db: DB_PATH });
});
app.post("/mcp", async (req, res) => {
  const db = openDb();
  try {
    const server = buildServer(db);
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: void 0 });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
    res.on("close", () => {
      db.close();
      server.close();
    });
  } catch (err) {
    db.close();
    console.error("MCP error:", err);
    if (!res.headersSent) res.status(500).json({ error: "Internal server error" });
  }
});
app.listen(PORT, () => {
  console.log(`Dokimo MCP Server listening on port ${PORT}`);
  console.log(`Database: ${DB_PATH}`);
  console.log(`Auth: DB-backed API keys (open if no keys configured)`);
});
