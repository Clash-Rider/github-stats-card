import express from "express";
import fetch from "node-fetch";

const app = express();

app.get("/api", async (req, res) => {
  const username = req.query.username || "octocat";
  const githubRes = await fetch(`https://api.github.com/users/${username}`);
  const data = await githubRes.json();
  console.log(data);

  if (!data || data.message === "Not Found") {
    res.status(404).send("GitHub user not found");
    return;
  }

  const svg = `
    <svg width="400" height="100" xmlns="http://www.w3.org/2000/svg">
      <style>
        .title { fill: #B197FC; font-size: 24px; font-family: sans-serif; }
        .text { fill: #CCCCCC; font-size: 16px; font-family: sans-serif; }
      </style>
      <rect width="100%" height="100%" fill="transparent" />
      <text x="10" y="30" class="title">${data.login}</text>
      <text x="10" y="60" class="text">Repos: ${data.public_repos}</text>
      <text x="10" y="80" class="text">Followers: ${data.followers}</text>
    </svg>
  `;

  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader("Cache-Control", "no-cache");
  res.send(svg);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`SVG API running at http://localhost:${PORT}/api?username=Tanmoy-Mondal-07`);
});