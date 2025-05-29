export default async function handler(req, res) {
  const username = req.query.username || "octocat";
  const token = process.env.GITHUB_TOKEN || "";

  if (!token) {
    res.status(500).send("GitHub token not configured");
    return;
  }

  const query = `
    query {
      user(login: "${username}") {
        repositories(first: 100, ownerAffiliations: OWNER, isFork: false) {
          nodes {
            stargazerCount
            defaultBranchRef {
              target {
                ... on Commit {
                  history {
                    totalCount
                  }
                }
              }
            }
          }
        }
        pullRequests {
          totalCount
        }
        issues {
          totalCount
        }
        contributionsCollection {
          contributionCalendar {
            weeks {
              contributionDays {
                date
                contributionCount
              }
            }
          }
          totalRepositoryContributions
        }
      }
    }
  `;

  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query }),
  });

  const json = await response.json();

  const user = json?.data?.user;
  if (!user) {
    res.status(404).send("GitHub user not found or error fetching data");
    return;
  }

  const stars = user.repositories.nodes.reduce((acc, repo) => acc + repo.stargazerCount, 0);
  const commits = user.repositories.nodes.reduce((acc, repo) => acc + (repo.defaultBranchRef?.target?.history?.totalCount || 0), 0);
  const prs = user.pullRequests.totalCount;
  const issues = user.issues.totalCount;
  const reposContributedTo = user.contributionsCollection.totalRepositoryContributions;

  const weeks = user.contributionsCollection.contributionCalendar.weeks || [];
  const days = weeks.flatMap(week => week.contributionDays);

  const sortedDays = days.sort((a, b) => new Date(a.date) - new Date(b.date));
  const totalContributions = sortedDays.reduce((acc, day) => acc + day.contributionCount, 0);
  const startDate = sortedDays[0]?.date || "N/A";
  const endDate = sortedDays[sortedDays.length - 1]?.date || "N/A";

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  for (const day of sortedDays) {
    if (day.contributionCount > 0) {
      tempStreak++;
      if (tempStreak > longestStreak) longestStreak = tempStreak;
    } else {
      tempStreak = 0;
    }
  }

  const reversedDays = [...sortedDays].reverse();
  for (const day of reversedDays) {
    if (day.contributionCount > 0) {
      currentStreak++;
    } else {
      break;
    }
  }

  const svg = `
    <svg width="750" height="350" xmlns="http://www.w3.org/2000/svg">
      <style>
        .title { fill: #B197FC; font-size: 24px; font-family: sans-serif; font-weight: bold; }
        .stat-label { fill: #AAAAAA; font-size: 16px; font-family: sans-serif; }
        .stat-value { fill: white; font-size: 20px; font-family: sans-serif; font-weight: bold; }
        .centered { text-anchor: middle; }
        .ring { stroke:rgb(105, 0, 0); stroke-width: 8; fill: none; }
      </style>
      <rect width="100%" height="100%" fill="#0d1117"/>

      <text x="50%" y="40" class="title centered">${username}'s GitHub Stats</text>

      <text x="40" y="90" class="stat-label">Total Stars Earned:</text>
      <text x="260" y="90" class="stat-value">${stars}</text>

      <text x="40" y="120" class="stat-label">Total Commits:</text>
      <text x="260" y="120" class="stat-value">${commits}</text>

      <text x="40" y="150" class="stat-label">Total PRs:</text>
      <text x="260" y="150" class="stat-value">${prs}</text>

      <text x="40" y="180" class="stat-label">Total Issues:</text>
      <text x="260" y="180" class="stat-value">${issues}</text>

      <text x="40" y="210" class="stat-label">Contributed to (last year):</text>
      <text x="260" y="210" class="stat-value">${reposContributedTo}</text>

      <text x="40" y="240" class="stat-label">Total Contributions:</text>
      <text x="260" y="240" class="stat-value">${totalContributions}</text>
      <text x="40" y="270" class="stat-label">${startDate} - ${endDate}</text>

      <circle cx="500" cy="130" r="34" class="ring"/>
      <text x="500" y="135" class="stat-value centered">${currentStreak}</text>
      <text x="500" y="188" class="stat-label centered">Current Streak</text>

      <circle cx="650" cy="130" r="34" class="ring"/>
      <text x="650" y="135" class="stat-value centered">${longestStreak}</text>
      <text x="650" y="188" class="stat-label centered">Longest Streak</text>
    </svg>
  `;

  res.setHeader("Content-Type", "image/svg+xml");
  res.status(200).send(svg);
}