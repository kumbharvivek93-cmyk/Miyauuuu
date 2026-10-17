import { useEffect, useState } from "react";
import {
  Activity, ArrowRight, Bot, CalendarDays, ChevronDown, ChevronLeft,
  ChevronRight, CircleDot, Code2, ExternalLink, FileCode2, Folder, FolderOpen,
  GitBranch, GitCommitHorizontal, GitFork, Github, Layers3, Search,
  ShieldAlert, Sparkles, Star, Users, Eye,
} from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";
import { Link, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { api, repositoryUrl } from "./services/api";

const COLORS = ["#8277ff", "#22d3a6", "#48b8ff", "#ffb454", "#ff718e", "#c18cff", "#d1daeb"];
const formatNumber = (value) => new Intl.NumberFormat("en", { notation: value > 9999 ? "compact" : "standard" }).format(value || 0);
const formatDate = (value) => value ? new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";

function Brand() {
  return <Link to="/" className="brand"><span className="brand-mark"><GitBranch size={19} /></span><span>gitstory<span className="brand-period">.</span></span></Link>;
}

function Layout({ children, repo }) {
  const base = repo ? `/repo/${repo.owner.login}/${repo.name}` : "";
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Brand />
        <div className="side-label">WORKSPACE</div>
        <Link to="/" className="nav-link"><Search size={17} /> Explore repositories</Link>
        {repo && <>
          <div className="side-label repo-side-label">REPOSITORY</div>
          <div className="side-repo"><img src={repo.owner.avatar_url} alt="" /><span><b>{repo.owner.login}</b><small>{repo.name}</small></span></div>
          <Link to={base} className="nav-link"><Layers3 size={17} /> Overview</Link>
          <Link to={`${base}/commits`} className="nav-link"><GitCommitHorizontal size={17} /> Commits</Link>
          <Link to={`${base}/insights`} className="nav-link"><Sparkles size={17} /> AI insights <span className="beta-tag">BETA</span></Link>
        </>}
        <div className="sidebar-bottom"><div className="live-dot" /> Public GitHub data<br /><small>Updated from GitHub API</small></div>
      </aside>
      <main className="main-area">
        <header className="topbar"><div className="breadcrumb"><span>GitStory</span>{repo && <><span className="crumb-slash">/</span><b>{repo.full_name}</b></>}</div>
          <a className="top-github" href="https://github.com" target="_blank" rel="noreferrer"><Github size={16} /> GitHub</a></header>
        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}

function Notice({ children, type = "error" }) {
  return <div className={`notice ${type}`}><ShieldAlert size={17} /> <span>{children}</span></div>;
}

function Home() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => { api("/searches").then((data) => setRecent(data.items || [])).catch(() => {}); }, []);

  async function search(value = query) {
    const cleaned = value.trim().replace(/^https?:\/\/github\.com\//, "").replace(/\/$/, "");
    const parts = cleaned.split("/");
    if (parts.length !== 2 || parts.some((part) => !/^[A-Za-z0-9_.-]+$/.test(part))) {
      setError("Enter a repository in owner/repo format, such as psf/requests.");
      return;
    }
    setLoading(true); setError("");
    try {
      await api(repositoryUrl(parts[0], parts[1]));
      navigate(repositoryUrl(parts[0], parts[1]));
    } catch (exception) { setError(exception.message); }
    finally { setLoading(false); }
  }

  return <Layout><section className="hero">
    <div className="eyebrow"><span className="eyebrow-dot" /> YOUR REPOSITORY, TOLD AS A STORY</div>
    <h1>Understand the <span>story</span><br />behind any repository.</h1>
    <p className="hero-copy">Explore the people, patterns, and technologies shaping open-source projects — all in one visual workspace.</p>
    <form className="search-box" onSubmit={(event) => { event.preventDefault(); search(); }}>
      <Github size={19} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Enter a GitHub repository, e.g. vercel/next.js" aria-label="GitHub repository" />
      <button disabled={loading}>{loading ? "Loading…" : "Explore"} <ArrowRight size={16} /></button>
    </form>
    {error && <Notice>{error}</Notice>}
    <div className="search-hint"><span>Try an example</span>{["psf/requests", "vercel/next.js", "fastapi/fastapi"].map((name) => <button key={name} onClick={() => { setQuery(name); search(name); }}>{name}</button>)}</div>
  </section>
  <section className="home-lower">
    <div><div className="section-kicker">START EXPLORING</div><h2>Built for curious minds.</h2><p className="muted">A clear view of what’s happening inside the projects you care about.</p>
      <div className="feature-row"><div className="feature-icon purple"><Activity size={19} /></div><div><b>See momentum</b><span>Follow commits and activity over time.</span></div></div>
      <div className="feature-row"><div className="feature-icon mint"><Users size={19} /></div><div><b>Meet the contributors</b><span>Discover the people building together.</span></div></div>
      <div className="feature-row"><div className="feature-icon blue"><Code2 size={19} /></div><div><b>Explore the codebase</b><span>Understand languages and hot files.</span></div></div>
    </div>
    <div className="recent-card"><div className="card-heading"><div><span className="section-kicker">YOUR ACTIVITY</span><h3>Recent searches</h3></div><CalendarDays size={18} /></div>
      {recent.length ? recent.map((name) => <button className="recent-item" key={name} onClick={() => search(name)}><span className="recent-repo-icon"><Github size={16} /></span><span>{name}</span><ArrowRight size={15} /></button>) : <p className="empty-state">Your repositories will appear here after you explore them.</p>}
    </div>
  </section>
  </Layout>;
}

function StatCard({ icon: Icon, label, value, note }) {
  return <div className="stat-card"><div className="stat-top"><span>{label}</span><Icon size={17} /></div><b>{value}</b><small>{note}</small></div>;
}

function Panel({ title, subtitle, action, children, className = "" }) {
  return <section className={`panel ${className}`}><div className="panel-head"><div><h3>{title}</h3>{subtitle && <p>{subtitle}</p>}</div>{action}</div>{children}</section>;
}

function Loading({ label = "Loading repository data…" }) {
  return <div className="loading"><span className="spinner" />{label}</div>;
}

function RepositoryTreeNode({ node, depth = 0 }) {
  const [expanded, setExpanded] = useState(depth === 0 || node.type === "commit-group");
  const hasChildren = node.children?.length > 0;
  const NodeIcon = node.type === "root" ? GitBranch
    : node.type === "directory" || node.type === "commit-group" ? (expanded ? FolderOpen : Folder)
      : node.type === "commit" ? GitCommitHorizontal : FileCode2;
  const label = node.type === "commit"
    ? `${node.name} · ${node.author || "Unknown author"} · ${formatDate(node.date)}`
    : node.name;

  return <div className="tree-node">
    <div className={`tree-row tree-${node.type}`}>
      {hasChildren ? <button className="tree-toggle" onClick={() => setExpanded((value) => !value)} aria-label={`${expanded ? "Collapse" : "Expand"} ${node.name}`}>
        {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
      </button> : <span className="tree-spacer" />}
      <NodeIcon size={16} className="tree-icon" />
      {node.html_url ? <a href={node.html_url} target="_blank" rel="noreferrer" className="tree-label" title={node.path || node.name}>{label}</a>
        : <span className="tree-label" title={node.path || node.name}>{label}</span>}
      {node.type === "file" && Number.isFinite(node.size) && <small className="tree-size">{formatNumber(node.size)} B</small>}
      {node.type === "commit" && node.sha && <a className="tree-sha" href={node.html_url} target="_blank" rel="noreferrer">{node.sha.slice(0, 7)}</a>}
    </div>
    {hasChildren && expanded && <div className="tree-children">{node.children.map((child) =>
      <RepositoryTreeNode key={`${child.type}:${child.path}`} node={child} depth={depth + 1} />
    )}</div>}
  </div>;
}

function RepositoryTreeDiagram({ tree, repository }) {
  const entries = tree.root.children.filter((node) => node.type !== "commit-group");
  const recentCommits = tree.root.children.find((node) => node.type === "commit-group");

  return <div className="tree-illustration">
    <div className="tree-canopy" aria-hidden="true" />
    <div className="tree-sign">
      <div className="tree-sign-name"><Github size={21} /><b>{repository.full_name}</b></div>
      <span><GitBranch size={13} /> {repository.default_branch}</span>
    </div>
    <div className="tree-legend" aria-label="Tree diagram key">
      <span><GitBranch size={14} /> Branch</span>
      <span><Folder size={14} /> Folder</span>
      <span><FileCode2 size={14} /> File</span>
      <span><GitCommitHorizontal size={14} /> Commit</span>
    </div>

    <div className="tree-stage">
      <div className="tree-branches">
        <div className="tree-trunk" aria-hidden="true" />
        {entries.map((node, index) => (
          <div
            className={`tree-branch-card ${index % 2 === 0 ? "branch-left" : "branch-right"}`}
            key={`${node.type}:${node.path}`}
            style={{ gridColumn: index % 2 === 0 ? "1" : "3", gridRow: Math.floor(index / 2) + 1 }}
          >
            <RepositoryTreeNode node={node} />
          </div>
        ))}
      </div>
      <div className="tree-roots" aria-hidden="true" />
    </div>

    {recentCommits && <section className="tree-recent-commits">
      <div className="tree-commits-heading">
        <div><GitCommitHorizontal size={16} /><b>Recent commits</b></div>
        <span>{repository.default_branch}</span>
      </div>
      <div className="tree-commit-list">
        {recentCommits.children.map((node) => (
          <RepositoryTreeNode key={`commit:${node.sha}`} node={node} />
        ))}
      </div>
    </section>}
  </div>;
}

function RepositoryDashboard() {
  const { owner, repo } = useParams();
  const [repository, setRepository] = useState(null);
  const [activity, setActivity] = useState(null);
  const [contributors, setContributors] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [hotFiles, setHotFiles] = useState(null);
  const [tree, setTree] = useState(null);
  const [treeError, setTreeError] = useState("");
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hotError, setHotError] = useState("");
  const base = `/repo/${owner}/${repo}`;

  useEffect(() => {
    let active = true;
    setLoading(true); setError("");
    Promise.all([
      api(repositoryUrl(owner, repo)), api(`${repositoryUrl(owner, repo)}/activity?range=${days}`),
      api(`${repositoryUrl(owner, repo)}/contributors`), api(`${repositoryUrl(owner, repo)}/languages`),
    ]).then(([repoData, activityData, contributorData, languageData]) => {
      if (!active) return;
      setRepository(repoData); setActivity(activityData);
      setContributors(contributorData.items || []); setLanguages(languageData.items || []);
    }).catch((exception) => { if (active) setError(exception.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [owner, repo, days]);

  useEffect(() => {
    let active = true;
    setHotFiles(null); setHotError("");
    api(`${repositoryUrl(owner, repo)}/hot-files`)
      .then((data) => { if (active) setHotFiles(data); })
      .catch((exception) => { if (active) setHotError(exception.message); });
    return () => { active = false; };
  }, [owner, repo]);

  useEffect(() => {
    let active = true;
    setTree(null); setTreeError("");
    api(`${repositoryUrl(owner, repo)}/tree`)
      .then((data) => { if (active) setTree(data); })
      .catch((exception) => { if (active) setTreeError(exception.message); });
    return () => { active = false; };
  }, [owner, repo]);

  if (loading && !repository) return <Layout><Loading /></Layout>;
  if (error && !repository) return <Layout><Notice>{error}</Notice><Link className="back-link" to="/">← Back to search</Link></Layout>;
  if (!repository) return null;

  return <Layout repo={repository}><div className="repo-heading">
    <div className="repo-title-row"><img className="owner-avatar" src={repository.owner.avatar_url} alt={`${repository.owner.login} avatar`} />
      <div className="repo-title"><div className="eyebrow">REPOSITORY OVERVIEW</div><h1>{repository.full_name}</h1></div>
      <a className="outline-button github-button" href={repository.html_url} target="_blank" rel="noreferrer">View on GitHub <ExternalLink size={15} /></a>
    </div>
    <p className="repo-description">{repository.description || "No description provided for this repository."}</p>
    <div className="repo-meta"><span><GitBranch size={14} /> {repository.default_branch}</span><span><Code2 size={14} /> {repository.language || "No language detected"}</span><span><CalendarDays size={14} /> Created {formatDate(repository.created_at)}</span><span>Updated {formatDate(repository.updated_at)}</span></div>
  </div>
  {error && <Notice>{error}</Notice>}
  {activity?.truncated && <Notice type="info">Activity is showing the first 5,000 matching commits due to GitHub API pagination limits.</Notice>}
  <Panel title="Repository tree" subtitle="Browse the default branch: folders open into files; recent commits are shown as leaves." className="tree-panel"
    action={tree && <div className="tree-counts"><span>{formatNumber(tree.directories)} folders</span><span>{formatNumber(tree.files)} files</span><span>{tree.commits} commits</span></div>}>
    {treeError ? <Notice>{treeError}</Notice> : tree ? <>
      <RepositoryTreeDiagram tree={tree} repository={repository} />
      {tree.truncated && <Notice type="info">GitHub truncated this large repository tree. Showing the first 5,000 entries.</Notice>}
    </> : <Loading label="Loading repository tree…" />}
  </Panel>
  <div className="stats-grid">
    <StatCard icon={Star} label="Stars" value={formatNumber(repository.stars)} note="People who starred this repo" />
    <StatCard icon={GitFork} label="Forks" value={formatNumber(repository.forks)} note="Community copies" />
    <StatCard icon={Eye} label="Watchers" value={formatNumber(repository.watchers)} note="Subscribers to updates" />
    <StatCard icon={CircleDot} label="Open issues" value={formatNumber(repository.open_issues)} note="Issues and pull requests" />
  </div>
  <div className="dashboard-grid">
    <Panel title="Commit activity" subtitle={`${activity?.total_commits ?? "—"} commits in the selected period`} className="activity-panel"
      action={<select className="select" value={days} onChange={(event) => setDays(Number(event.target.value))}><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option><option value={365}>Last year</option></select>}>
      <div className="chart-wrap activity-chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={activity?.daily || []} margin={{ top: 14, right: 12, left: -18, bottom: 0 }}>
        <CartesianGrid stroke="#e9edf4" vertical={false} /><XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" })} minTickGap={35} tick={{ fill: "#718097", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fill: "#718097", fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #e2e7ef", borderRadius: 10 }} labelStyle={{ color: "#263650" }} />
        <Line type="monotone" dataKey="commits" stroke="#897bff" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: "#a89fff" }} /></LineChart></ResponsiveContainer></div>
    </Panel>
    <Panel title="Language breakdown" subtitle="Code composition by bytes" className="language-panel">
      {languages.length ? <div className="language-content"><div className="donut-wrap"><ResponsiveContainer width="100%" height={190}><PieChart><Pie data={languages} dataKey="bytes" nameKey="name" innerRadius={54} outerRadius={79} paddingAngle={3} stroke="none">{languages.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip formatter={(value, name) => [`${Number(value).toLocaleString()} bytes`, name]} contentStyle={{ background: "#ffffff", border: "1px solid #e2e7ef", borderRadius: 10 }} itemStyle={{ color: "#42516a" }} /></PieChart></ResponsiveContainer><div className="donut-center"><b>{languages.length}</b><small>languages</small></div></div>
      <div className="language-legend">{languages.slice(0, 6).map((language, index) => <div className="legend-row" key={language.name}><i style={{ background: COLORS[index % COLORS.length] }} /><span>{language.name}</span><b>{language.percentage}%</b></div>)}</div></div> : <div className="empty-state">No language data available.</div>}
    </Panel>
    <Panel title="Top contributors" subtitle="Share of commits from repository contributors" action={<Link className="text-link" to={`${base}/commits`}>View commits <ArrowRight size={14} /></Link>} className="contributors-panel">
      {contributors.length ? <><div className="contributor-chart"><ResponsiveContainer width="100%" height={190}><BarChart data={contributors.slice(0, 10)} layout="vertical" margin={{ top: 3, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#e9edf4" horizontal={false} /><XAxis type="number" allowDecimals={false} tick={{ fill: "#718097", fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="username" width={82} tick={{ fill: "#53627a", fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #e2e7ef", borderRadius: 10 }} itemStyle={{ color: "#42516a" }} /><Bar dataKey="contributions" name="Commits" fill="#6857db" radius={[0, 4, 4, 0]} barSize={11} /></BarChart></ResponsiveContainer></div>
        <div className="contributor-list">{contributors.slice(0, 6).map((person, index) => <a className="contributor-row" key={person.username} href={person.profile_url} target="_blank" rel="noreferrer">
        <span className="rank">{String(index + 1).padStart(2, "0")}</span><img src={person.avatar_url} alt="" /><span className="contributor-name">{person.username}</span><span className="contribution-count">{formatNumber(person.contributions)} commits</span><b>{person.percentage}%</b></a>)}</div></> : <div className="empty-state">No contributor data available.</div>}
    </Panel>
    <Panel title="Frequently changed files" subtitle={`Based on ${hotFiles?.commits_analyzed ?? "—"} recent commits`} className="files-panel" action={<span className="subtle-tag">TOP FILES</span>}>
      {hotError ? <Notice>{hotError}</Notice> : !hotFiles ? <Loading label="Analyzing recent file changes…" /> : hotFiles.files?.length ? <div className="file-table-wrap"><table className="file-table"><thead><tr><th>FILE PATH</th><th>CHANGES</th><th>ACTIVITY</th></tr></thead><tbody>{hotFiles.files.map((file) => <tr key={file.path}><td><code><span className="file-icon">⌘</span>{file.path}</code></td><td>{file.changes}</td><td><div className="mini-bar"><i style={{ width: `${Math.max(8, file.changes / hotFiles.files[0].changes * 100)}%` }} /></div></td></tr>)}</tbody></table>
        {hotFiles.folders?.length > 0 && <div className="folder-pills"><span>Active folders</span>{hotFiles.folders.slice(0, 5).map((folder) => <span className="folder-pill" key={folder.path}><Layers3 size={12} /> {folder.path} <b>{folder.changes}</b></span>)}</div>}</div> : <div className="empty-state">No changed files found in recent commits.</div>}
    </Panel>
  </div>
  <div className="dashboard-footer"><span>Data provided by GitHub REST API</span><span>Cached for 30 minutes</span></div>
  </Layout>;
}

function CommitsPage() {
  const { owner, repo } = useParams();
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [repository, setRepository] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => { api(repositoryUrl(owner, repo)).then(setRepository).catch(() => {}); }, [owner, repo]);
  useEffect(() => {
    let active = true; setLoading(true); setError("");
    api(`${repositoryUrl(owner, repo)}/commits?page=${page}&per_page=20`).then((value) => { if (active) setData(value); })
      .catch((exception) => { if (active) setError(exception.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [owner, repo, page]);
  const rows = data?.items || [];
  return <Layout repo={repository}><div className="page-title"><div className="eyebrow">REPOSITORY ACTIVITY</div><h1>Recent commits</h1><p>Follow every update made to {owner}/{repo}.</p></div>
    {error && <Notice>{error}</Notice>}
    <Panel title="Commit history" subtitle="Newest commits first" className="commit-panel">
      {loading ? <Loading /> : rows.length ? <div className="commit-list">{rows.map((item) => {
        const commit = item.commit || {}; const gitAuthor = commit.author || {}; const author = item.author || {};
        return <article className="commit-row" key={item.sha}><div className="commit-avatar">{author.avatar_url ? <img src={author.avatar_url} alt="" /> : <GitCommitHorizontal size={18} />}</div>
          <div className="commit-body"><a className="commit-message" href={item.html_url} target="_blank" rel="noreferrer">{(commit.message || "No commit message").split("\n")[0]}</a>
            <div className="commit-byline"><span>{author.login || gitAuthor.name || "Unknown author"}</span><span>committed {formatDate(gitAuthor.date)}</span></div></div>
          <a className="sha-chip" href={item.html_url} target="_blank" rel="noreferrer">{item.sha?.slice(0, 7)} <ExternalLink size={12} /></a>
        </article>;
      })}</div> : <div className="empty-state">No commits found on this page.</div>}
      <div className="pagination"><span>Page {page}</span><div><button disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)} aria-label="Previous page"><ChevronLeft size={17} /></button><button disabled={rows.length < 20 || loading} onClick={() => setPage((value) => value + 1)} aria-label="Next page"><ChevronRight size={17} /></button></div></div>
    </Panel>
  </Layout>;
}

function InsightsPage() {
  const { owner, repo } = useParams();
  const [repository, setRepository] = useState(null);
  const [summary, setSummary] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => { api(repositoryUrl(owner, repo)).then(setRepository).catch(() => {}); }, [owner, repo]);
  async function generate() {
    setLoading(true); setError(""); setSummary("");
    try { const result = await api(`${repositoryUrl(owner, repo)}/ai-summary`, { method: "POST" }); setSummary(result.summary); }
    catch (exception) { setError(exception.message); }
    finally { setLoading(false); }
  }
  return <Layout repo={repository}><div className="page-title"><div className="eyebrow">AI-POWERED EXPLORATION</div><h1>AI insights</h1><p>A grounded, concise read of the repository’s development story.</p></div>
    <div className="insights-intro"><div className="insight-spark"><Sparkles size={25} /></div><div><h2>Read between the commits.</h2><p>GitStory combines repository metadata, contributor activity, languages, and frequently changed files to create an overview of this project.</p></div></div>
    <Panel title="Repository analysis" subtitle={repository?.full_name || `${owner}/${repo}`} className="insight-panel">
      <div className="insight-prompt"><Bot size={20} /><div><b>Generate an AI summary</b><p>Includes project purpose, activity level, technologies, active areas, and contributor patterns.</p></div><button className="primary-button" disabled={loading} onClick={generate}>{loading ? <><span className="button-spinner" /> Analyzing…</> : <><Sparkles size={15} /> Generate insights</>}</button></div>
      {error && <Notice>{error}</Notice>}
      {summary && <div className="ai-result"><div className="ai-label"><Sparkles size={14} /> AI-GENERATED INSIGHT</div><p>{summary}</p><small>Generated from public GitHub repository data. AI output may be inaccurate.</small></div>}
    </Panel>
  </Layout>;
}

function NotFound() {
  return <Layout><div className="not-found"><div className="feature-icon purple"><Search size={20} /></div><h1>Page not found</h1><p>This GitStory page doesn’t exist.</p><Link className="primary-button" to="/">Go home <ArrowRight size={15} /></Link></div></Layout>;
}

export default function App() {
  return <Routes><Route path="/" element={<Home />} /><Route path="/repo/:owner/:repo" element={<RepositoryDashboard />} /><Route path="/repo/:owner/:repo/commits" element={<CommitsPage />} /><Route path="/repo/:owner/:repo/insights" element={<InsightsPage />} /><Route path="*" element={<NotFound />} /></Routes>;
}
