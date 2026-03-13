const REFRESH_INTERVAL = 10000;
const TIMEOUT_MS = 3000;

const nodes = [
  { name: "音乐播放器", url: "https://music.zxlwq.dpdns.org", region: "中国香港", provider: "Cloudflare" },
  { name: "科技刘 - 导航站", url: "https://site.zxlwq.dpdns.org", region: "中国香港", provider: "Cloudflare" },
  { name: "科技刘 - 博客", url: "https://blog.zxlwq.dpdns.org", region: "中国香港", provider: "Cloudflare" },
  { name: "科技刘 - 论坛", url: "https://zxlwq.discourse.group", region: "中国香港", provider: "Cloudflare" },
  { name: "科技刘 - 主页", url: "https://home.zxlwq.dpdns.org", region: "中国香港", provider: "Cloudflare" },
  { name: "科技刘 - 图床", url: "https://pixpro.zxlwq.dpdns.org", region: "中国香港", provider: "Cloudflare" },
  { name: "科技刘 - 最新热点", url: "https://news.zxlwq.dpdns.org", region: "中国香港", provider: "Cloudflare" },
  { name: "科技刘 - 订阅转换", url: "https://suba.zxlwq.dpdns.org", region: "中国香港", provider: "Cloudflare" },
  { name: "科技刘 - 网易云音乐", url: "https://splayer.zxlwq.dpdns.org", region: "中国香港", provider: "Cloudflare" },
  { name: "科技刘 - 在线影视", url: "https://ltv.zxlwq.dpdns.org", region: "中国香港", provider: "Cloudflare" },
];

const nodeContainer = document.getElementById("node-container");
const onlineCountEl = document.getElementById("online-count");
const avgLatencyEl = document.getElementById("avg-latency");
const onlineRateEl = document.getElementById("online-rate");
const systemStatusText = document.getElementById("system-status");
const statusIcon = document.getElementById("status-icon");
const statusIconBg = document.getElementById("status-icon-bg");
const refreshBtn = document.getElementById("refresh-btn");
const autoBtn = document.getElementById("auto-btn");
const fastBtn = document.getElementById("fast-btn");
const timerBar = document.getElementById("timer-bar");

let autoRefresh = true;
let refreshTimer = null;
let timerTick = null;

function buildNodeCard(node) {
  const card = document.createElement("a");
  card.className = "node-card";
  card.href = node.url;
  card.target = "_blank";
  card.rel = "noopener";
  card.setAttribute("data-latency", "9999");

  card.innerHTML = `
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm text-slate-400">${node.region}</p>
        <p class="text-lg font-semibold">${node.name}</p>
      </div>
      <span class="text-xs px-2 py-1 rounded-full bg-white/10">${node.provider}</span>
    </div>
    <div class="node-meta">
      <div class="flex items-center gap-2 text-sm text-slate-300">
        <span class="ping-dot text-slate-400"></span>
        <span class="latency-text font-mono">检测中</span>
      </div>
      <span class="text-xs text-slate-400">点击访问</span>
    </div>
  `;

  return card;
}

function renderNodes() {
  nodeContainer.innerHTML = "";
  nodes.forEach((node) => {
    const card = buildNodeCard(node);
    nodeContainer.appendChild(card);
    node.card = card;
  });
}

function measureLatency(url) {
  const start = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  return fetch(url, {
    mode: "no-cors",
    cache: "no-store",
    signal: controller.signal
  })
    .then(() => Math.round(performance.now() - start))
    .finally(() => clearTimeout(timer));
}

function updateCardStatus(node, latency, isOffline) {
  const card = node.card;
  const latencyText = card.querySelector(".latency-text");
  const dot = card.querySelector(".ping-dot");

  card.classList.remove("fastest", "offline");

  if (isOffline) {
    latencyText.textContent = "超时";
    latencyText.className = "latency-text font-mono text-sm text-slate-400";
    dot.className = "ping-dot text-rose-400";
    card.classList.add("offline");
    card.setAttribute("data-latency", "9999");
    return;
  }

  card.setAttribute("data-latency", `${latency}`);
  latencyText.textContent = `${latency}ms`;

  if (latency < 120) {
    latencyText.className = "latency-text font-mono text-sm text-emerald-400";
    dot.className = "ping-dot text-emerald-400";
    card.classList.add("fastest");
  } else if (latency < 300) {
    latencyText.className = "latency-text font-mono text-sm text-sky-400";
    dot.className = "ping-dot text-sky-400";
  } else if (latency < 600) {
    latencyText.className = "latency-text font-mono text-sm text-amber-400";
    dot.className = "ping-dot text-amber-400";
  } else {
    latencyText.className = "latency-text font-mono text-sm text-rose-400";
    dot.className = "ping-dot text-rose-400";
  }
}

function updateHeaderStats(stats) {
  const { active, totalLatency } = stats;
  const total = nodes.length;
  const avg = active > 0 ? Math.round(totalLatency / active) : 0;
  const rate = total > 0 ? Math.round((active / total) * 100) : 0;

  onlineCountEl.textContent = `${active}`;
  avgLatencyEl.textContent = active > 0 ? `${avg}ms` : "N/A";
  onlineRateEl.textContent = `${rate}%`;

  if (active >= 6) {
    systemStatusText.textContent = "系统运行正常";
    statusIcon.className = "fa-solid fa-heart-pulse text-emerald-400 text-lg animate-pulse";
    statusIconBg.style.background = "rgba(16, 185, 129, 0.12)";
  } else if (active >= 3) {
    systemStatusText.textContent = "部分线路拥塞";
    statusIcon.className = "fa-solid fa-triangle-exclamation text-amber-400 text-lg";
    statusIconBg.style.background = "rgba(245, 158, 11, 0.12)";
  } else {
    systemStatusText.textContent = "系统维护中";
    statusIcon.className = "fa-solid fa-skull text-rose-400 text-lg";
    statusIconBg.style.background = "rgba(248, 113, 113, 0.12)";
  }
}

function sortCardsByLatency() {
  const cards = Array.from(nodeContainer.children);
  cards.sort((a, b) => {
    const aLat = Number(a.getAttribute("data-latency")) || 9999;
    const bLat = Number(b.getAttribute("data-latency")) || 9999;
    return aLat - bLat;
  });
  cards.forEach((card) => nodeContainer.appendChild(card));
}

function checkAllNodes() {
  if (!nodeContainer.children.length) return;

  const stats = { active: 0, totalLatency: 0 };
  let completed = 0;

  nodes.forEach((node) => {
    measureLatency(node.url)
      .then((latency) => {
        stats.active += 1;
        stats.totalLatency += latency;
        updateCardStatus(node, latency, false);
      })
      .catch(() => {
        updateCardStatus(node, 9999, true);
      })
      .finally(() => {
        completed += 1;
        if (completed === nodes.length) {
          updateHeaderStats(stats);
          sortCardsByLatency();
          if (autoRefresh) startAutoTimer();
        }
      });
  });
}

function showToast(message) {
  const toast = document.getElementById("toast");
  const msgEl = document.getElementById("toast-msg");
  msgEl.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2800);
}

function startAutoTimer() {
  clearTimeout(refreshTimer);
  clearInterval(timerTick);

  let remaining = REFRESH_INTERVAL;
  timerBar.style.width = "100%";

  timerTick = setInterval(() => {
    remaining -= 1000;
    const percent = Math.max(0, (remaining / REFRESH_INTERVAL) * 100);
    timerBar.style.width = `${percent}%`;
  }, 1000);

  refreshTimer = setTimeout(() => {
    clearInterval(timerTick);
    checkAllNodes();
  }, REFRESH_INTERVAL);
}

function toggleAutoRefresh() {
  autoRefresh = !autoRefresh;
  const icon = autoBtn.querySelector("i");
  if (autoRefresh) {
    icon.className = "fa-solid fa-pause";
    showToast("已开启自动刷新");
    checkAllNodes();
  } else {
    icon.className = "fa-solid fa-play";
    clearTimeout(refreshTimer);
    clearInterval(timerTick);
    timerBar.style.width = "100%";
    showToast("已暂停自动刷新");
  }
}

function visitFastestNode() {
  const cards = Array.from(nodeContainer.children);
  let best = null;
  let minLatency = 9999;

  cards.forEach((card) => {
    const lat = Number(card.getAttribute("data-latency")) || 9999;
    if (lat < minLatency) {
      minLatency = lat;
      best = card;
    }
  });

  if (best && minLatency < 2000) {
    showToast(`正在前往最快节点 (${minLatency}ms)`);
    setTimeout(() => window.open(best.href, "_blank"), 800);
  } else {
    showToast("暂无可用高速节点，请稍候");
  }
}

function bindEvents() {
  refreshBtn.addEventListener("click", () => {
    showToast("开始刷新节点状态");
    checkAllNodes();
  });

  autoBtn.addEventListener("click", toggleAutoRefresh);
  fastBtn.addEventListener("click", visitFastestNode);

  document.querySelectorAll(".domain-card").forEach((card) => {
    card.addEventListener("click", () => {
      const text = card.getAttribute("data-copy");
      if (!text) return;
      navigator.clipboard
        .writeText(text)
        .then(() => showToast(`已复制 ${text}`))
        .catch(() => showToast("复制失败，请手动复制"));
    });
  });
}

function init() {
  renderNodes();
  bindEvents();
  checkAllNodes();
}

window.addEventListener("load", init);
