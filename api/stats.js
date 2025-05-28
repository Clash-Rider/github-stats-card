import fetch from "node-fetch";

export default async function handler(req, res) {
  const { username } = req.query;
  if (!username) {
    res.status(400).send("Missing username");
    return;
  }

  const githubRes = await fetch(`https://api.github.com/users/${username}`);
  const data = await githubRes.json();

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
  res.status(200).send(svg);
}