const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

const LINKEDIN_TOKEN = process.env.LINKEDIN_ACCESS_TOKEN;

app.get('/mcp', (req, res) => {
  res.json({
    name: "linkedin-vps-mcp",
    version: "1.0.0",
    tools: [
      {
        name: "linkedin_post",
        description: "Post content to LinkedIn",
        inputSchema: {
          type: "object",
          properties: {
            text: { type: "string", description: "Post content" }
          },
          required: ["text"]
        }
      },
      {
        name: "linkedin_get_profile",
        description: "Get your LinkedIn profile info",
        inputSchema: {
          type: "object",
          properties: {}
        }
      }
    ]
  });
});

app.post('/mcp', async (req, res) => {
  const { tool, input } = req.body;

  if (tool === 'linkedin_get_profile') {
    const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${LINKEDIN_TOKEN}` }
    });
    const profile = await profileRes.json();
    res.json(profile);
  }

  if (tool === 'linkedin_post') {
    try {
      const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: { Authorization: `Bearer ${LINKEDIN_TOKEN}` }
      });
      const profile = await profileRes.json();
      const urn = `urn:li:person:${profile.sub}`;

      const postRes = await fetch('https://api.linkedin.com/v2/ugcPosts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LINKEDIN_TOKEN}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        },
        body: JSON.stringify({
          author: urn,
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: { text: input.text },
              shareMediaCategory: 'NONE'
            }
          },
          visibility: {
            'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
          }
        })
      });

      const result = await postRes.json();
      res.json({ success: true, result });
    } catch (err) {
      res.json({ success: false, error: err.message });
    }
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`LinkedIn MCP running on port ${PORT}`));