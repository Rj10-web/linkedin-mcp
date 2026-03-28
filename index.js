import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
import { z } from "zod";

const app = express();
app.use(express.json());

const LINKEDIN_TOKEN = process.env.LINKEDIN_ACCESS_TOKEN;

function createServer() {
  const server = new McpServer({ name: "linkedin-vps-mcp", version: "1.0.0" });

  server.tool("linkedin_get_profile", "Get your LinkedIn profile", {}, async () => {
    const r = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${LINKEDIN_TOKEN}` }
    });
    const data = await r.json();
    return { content: [{ type: "text", text: JSON.stringify(data) }] };
  });

  server.tool("linkedin_post", "Post to LinkedIn", { text: z.string() }, async ({ text }) => {
    const profile = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${LINKEDIN_TOKEN}` }
    }).then(r => r.json());
    const urn = `urn:li:person:${profile.sub}`;
    const r = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LINKEDIN_TOKEN}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0"
      },
      body: JSON.stringify({
        author: urn,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: { text },
            shareMediaCategory: "NONE"
          }
        },
        visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" }
      })
    });
    const result = await r.json();
    return { content: [{ type: "text", text: JSON.stringify(result) }] };
  });

  return server;
}

app.get("/mcp", async (req, res) => {
  const server = createServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

app.post("/mcp", async (req, res) => {
  const server = createServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

app.delete("/mcp", async (req, res) => {
  res.status(200).end();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`LinkedIn MCP running on port ${PORT}`));
