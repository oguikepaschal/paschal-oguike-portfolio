// Build-time snapshot of my commit activity for the About section weave
// (components/AboutWeave*.tsx). Run locally with `npm run weave:data`.
//
// GITHUB_TOKEN is read from .env.local and used only here, at snapshot time.
// It is never read by the app, so it can't reach Vercel or the browser.
//
// The output file holds only { r, t, size } per commit: a neutral repo label,
// a timestamp and a change size. No repo names, SHAs or messages.

import { existsSync, mkdirSync, writeFileSync } from "node:fs";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const token = process.env.GITHUB_TOKEN;
if (!token) {
  console.error("GITHUB_TOKEN is not set (expected in .env.local).");
  process.exit(1);
}

const OUT = "src/data/weave-commits.json";
const since = new Date();
since.setMonth(since.getMonth() - 6);

async function gql(query, variables) {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { Authorization: `bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (!res.ok || json.errors) throw new Error(JSON.stringify(json.errors ?? json));
  return json.data;
}

const REPOS_QUERY = `
  query ($cursor: String) {
    viewer {
      id
      repositories(first: 100, after: $cursor, ownerAffiliations: OWNER, isFork: false) {
        pageInfo { hasNextPage endCursor }
        nodes { name owner { login } isArchived isPrivate defaultBranchRef { name } }
      }
    }
  }`;

// Only committedDate, additions and deletions — never oid or message.
const HISTORY_QUERY = `
  query ($owner: String!, $name: String!, $author: ID!, $since: GitTimestamp!, $cursor: String) {
    repository(owner: $owner, name: $name) {
      defaultBranchRef {
        target {
          ... on Commit {
            history(first: 100, after: $cursor, since: $since, author: { id: $author }) {
              pageInfo { hasNextPage endCursor }
              nodes { committedDate additions deletions }
            }
          }
        }
      }
    }
  }`;

let viewerId;
const repos = [];
for (let cursor = null; ; ) {
  const { viewer } = await gql(REPOS_QUERY, { cursor });
  viewerId = viewer.id;
  repos.push(...viewer.repositories.nodes.filter((r) => !r.isArchived && r.defaultBranchRef));
  if (!viewer.repositories.pageInfo.hasNextPage) break;
  cursor = viewer.repositories.pageInfo.endCursor;
}

const perRepo = [];
for (const repo of repos) {
  const commits = [];
  for (let cursor = null; ; ) {
    const data = await gql(HISTORY_QUERY, {
      owner: repo.owner.login,
      name: repo.name,
      author: viewerId,
      since: since.toISOString(),
      cursor,
    });
    const history = data.repository.defaultBranchRef?.target?.history;
    if (!history) break;
    for (const c of history.nodes) {
      commits.push({ t: Date.parse(c.committedDate), size: Math.max(1, c.additions + c.deletions) });
    }
    if (!history.pageInfo.hasNextPage) break;
    cursor = history.pageInfo.endCursor;
  }
  if (commits.length) perRepo.push({ repo, commits });
}

// Neutral labels ranked by commit count: r1 is the busiest repo.
perRepo.sort((a, b) => b.commits.length - a.commits.length);
const out = [];
perRepo.forEach(({ commits }, i) => {
  for (const c of commits) out.push({ r: `r${i + 1}`, t: c.t, size: c.size });
});
out.sort((a, b) => a.t - b.t);

mkdirSync("src/data", { recursive: true });
writeFileSync(OUT, JSON.stringify(out) + "\n");

// Local report only (stdout, never written to the snapshot).
console.log(`Wrote ${out.length} commits since ${since.toISOString().slice(0, 10)} to ${OUT}`);
perRepo.forEach(({ repo, commits }, i) => {
  console.log(`  r${i + 1}  ${String(commits.length).padStart(5)}  ${repo.name}${repo.isPrivate ? " (private)" : ""}`);
});
const skipped = repos.length - perRepo.length;
if (skipped) console.log(`  (${skipped} owned repos had no commits by you in the window)`);
