// Store checkout links here after creating digital products in your chosen checkout service.
// GitHub Pages cannot keep a secret or verify a purchase; use a server/API for secure access control.
const storeSettings = {
  betaMode: true,
  checkoutLinks: { single: "", custom: "" },
  currency: "INR",
  prices: { single: 299, custom: 999 },
};

const templates = [
  { id: 1, name: "The Garden", mood: "Romantic · botanical", theme: "garden", layout: "floral", group: "free", colors: ["#6b7b68", "#d9c596", "#f5eddf"] },
  { id: 2, name: "Ivory Letter", mood: "Quiet · classic", theme: "ivory", layout: "minimal", group: "free", colors: ["#eee9dc", "#8e6747", "#43362f"] },
  { id: 3, name: "Terracotta Sun", mood: "Warm · modern", theme: "terracotta", layout: "bold", group: "free", colors: ["#a4543f", "#e4bd82", "#fff1dc"] },
  { id: 4, name: "Midnight Vow", mood: "Dramatic · formal", theme: "midnight", layout: "royal", group: "free", colors: ["#202c40", "#c9a96b", "#f4ecd8"] },
  { id: 5, name: "Rosewater", mood: "Soft · romantic", theme: "blush", layout: "floral", group: "premium", colors: ["#e4c7c1", "#9a5e55", "#513632"] },
  { id: 6, name: "Saffron Sky", mood: "Bright · joyful", theme: "saffron", layout: "bold", group: "premium", colors: ["#d59a43", "#fff0bb", "#382314"] },
  { id: 7, name: "Wild Botanica", mood: "Earthy · garden", theme: "botanical", layout: "floral", group: "premium", colors: ["#526652", "#c6cc9a", "#eff0df"] },
  { id: 8, name: "Sunday Modern", mood: "Minimal · editorial", theme: "modern", layout: "modern", group: "premium", colors: ["#ece7de", "#9b5f4b", "#282b2a"] },
  { id: 9, name: "Lilac Arch", mood: "Dreamy · delicate", theme: "lilac", layout: "arch", group: "premium", colors: ["#95869f", "#e4c6ba", "#fff3ec"] },
  { id: 10, name: "Rajwada Gold", mood: "Royal · Indian", theme: "royal", layout: "royal", group: "premium", colors: ["#412b40", "#d2ae66", "#f4e9d5"] },
  { id: 11, name: "Blue Horizon", mood: "Airy · coastal", theme: "sky", layout: "minimal", group: "premium", colors: ["#afc4cb", "#6d7f75", "#33474b"] },
  { id: 12, name: "Velvet Rose", mood: "Intimate · elegant", theme: "rose", layout: "floral", group: "premium", colors: ["#884f5d", "#edc4a1", "#fce9dc"] },
  { id: 13, name: "Citrus Garden", mood: "Playful · sunny", theme: "citrus", layout: "terrace", group: "premium", colors: ["#ded18a", "#8c7544", "#3b3c2b"] },
  { id: 14, name: "Heirloom", mood: "Heritage · timeless", theme: "heritage", layout: "royal", group: "premium", colors: ["#3b2921", "#cba667", "#f2e4cb"] },
  { id: 15, name: "Coastal Vows", mood: "Natural · relaxed", theme: "coastal", layout: "modern", group: "premium", colors: ["#dce7e0", "#738e85", "#324944"] },
  { id: 16, name: "Ruby Celebration", mood: "Festive · bold", theme: "jewel", layout: "bold", group: "premium", colors: ["#71393c", "#dfbd79", "#fbe9d3"] },
  { id: 17, name: "Orchid Haze", mood: "Artful · soft", theme: "orchid", layout: "arch", group: "premium", colors: ["#503b55", "#d9b3c3", "#f4e9ee"] },
  { id: 18, name: "Golden Hour", mood: "Sunset · joyful", theme: "sunset", layout: "terrace", group: "premium", colors: ["#d17e68", "#ffe0a8", "#3c2628"] },
  { id: 19, name: "Monochrome Muse", mood: "Modern · refined", theme: "monochrome", layout: "minimal", group: "premium", colors: ["#e9e7e2", "#70706c", "#2b2b2a"] },
  { id: 20, name: "Utsav", mood: "Indian · festive", theme: "festive", layout: "royal", group: "premium", colors: ["#a33d35", "#e4c576", "#fff1d5"] },
];

const defaultDraft = {
  templateId: 1,
  partnerOne: "Aarav",
  partnerTwo: "Meera",
  date: "2026-12-12",
  time: "17:00",
  venue: "The Garden Courtyard",
  address: "Jaipur, Rajasthan",
  message: "With joy in our hearts, we invite you to celebrate the beginning of our forever.",
  photo: "",
  phone: "",
  dress: "",
};

const storageKey = "vow-verse-draft-v1";
let draft = { ...defaultDraft, ...readSavedDraft() };
let activeFilter = "all";
let toastTimer;
const form = document.getElementById("editor-form");
const templateGrid = document.getElementById("template-grid");
const preview = document.getElementById("invite-preview");
const activeTemplate = () => templates.find((item) => item.id === Number(draft.templateId)) || templates[0];

function readSavedDraft() {
  try { return JSON.parse(localStorage.getItem(storageKey) || "{}"); }
  catch { return {}; }
}

function safeText(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

function setFieldValues() {
  Object.entries(draft).forEach(([key, value]) => {
    const field = form.elements.namedItem(key);
    if (field && typeof value === "string") field.value = value;
  });
}

function renderTemplates() {
  const query = document.getElementById("template-search").value.trim().toLowerCase();
  const filtered = templates.filter((item) => {
    const groupMatches = activeFilter === "all" || (activeFilter === "free" ? item.group === "free" : item.group === "premium");
    return groupMatches && `${item.name} ${item.mood}`.toLowerCase().includes(query);
  });
  templateGrid.innerHTML = filtered.map((item) => {
    const selected = Number(draft.templateId) === item.id;
    const [bg, accent, ink] = item.colors;
    return `<button class="template-card${selected ? " active" : ""}" type="button" data-template="${item.id}" aria-pressed="${selected}" aria-label="Choose ${safeText(item.name)} invitation">
      <div class="mini-art ${item.layout}" style="--card-paper:${bg};--card-accent:${accent};--card-ink:${ink}"><div class="mini-inner"><div class="mini-label">YOU'RE INVITED</div><div class="mini-names"><span>${safeText(draft.partnerOne || "Your Name")}</span><i>&amp;</i><span>${safeText(draft.partnerTwo || "Your Love")}</span></div><div class="mini-date">${formatDate(draft.date, true)}</div></div><span class="mini-deco deco-a">❧</span><span class="mini-deco deco-b">✿</span></div>
      <div class="template-info"><div><h3>${String(item.id).padStart(2, "0")} · ${safeText(item.name)}</h3><p>${safeText(item.mood)}</p><p class="template-action">${selected ? "SELECTED · EDIT BELOW" : "TAP TO CUSTOMIZE ↗"}</p></div><span class="template-badge ${item.group === "premium" ? "signature" : ""}">${storeSettings.betaMode ? "BETA FREE" : item.group === "free" ? "FREE" : "SIGNATURE"}</span></div>
    </button>`;
  }).join("");
  if (!filtered.length) templateGrid.innerHTML = '<p class="empty-state">No designs match that search. Try another style.</p>';
  templateGrid.querySelectorAll("[data-template]").forEach((card) => card.addEventListener("click", () => {
    draft.templateId = Number(card.dataset.template);
    renderTemplates(); renderPreview(); saveDraft();
    document.getElementById("active-template-label").textContent = `${String(draft.templateId).padStart(2, "0")} · ${activeTemplate().name.toUpperCase()}`;
    document.getElementById("studio").scrollIntoView({ behavior: "smooth", block: "start" });
    showToast(`${activeTemplate().name} selected. Edit the details below.`);
  }));
}

function formatDate(value, compact = false) {
  if (!value) return "YOUR DATE HERE";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "YOUR DATE HERE";
  return new Intl.DateTimeFormat("en-GB", compact ? { day: "2-digit", month: "2-digit", year: "numeric" } : { day: "numeric", month: "long", year: "numeric" }).format(date).replaceAll("/", " · ");
}

function formatTime(value) {
  if (!value) return "";
  const [hours, minutes] = value.split(":").map(Number);
  const time = new Date(); time.setHours(hours, minutes, 0, 0);
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(time);
}

function renderPreview() {
  const theme = activeTemplate();
  preview.className = `invite-preview theme-${theme.theme} layout-${theme.layout}${draft.photo ? " with-photo" : ""}`;
  document.getElementById("active-template-label").textContent = `${String(theme.id).padStart(2, "0")} · ${theme.name.toUpperCase()}`;
  const values = {
    partnerOne: draft.partnerOne || "Your Name",
    partnerTwo: draft.partnerTwo || "Your Love",
    message: draft.message || "We would love to celebrate this day with you.",
    date: formatDate(draft.date),
    time: formatTime(draft.time),
    venue: draft.venue || "Your venue",
    address: draft.address || "Your city",
    dress: draft.dress ? `Dress note · ${draft.dress}` : "",
  };
  Object.entries(values).forEach(([key, value]) => document.querySelectorAll(`[data-preview="${key}"]`).forEach((node) => node.textContent = value));
  document.getElementById("preview-photo").style.backgroundImage = draft.photo ? `url("${draft.photo.replace(/["\\]/g, "")}")` : "none";
  const digits = (draft.phone || "").replace(/\D/g, "");
  const reply = document.querySelector("[data-preview-rsvp]");
  reply.href = digits ? `https://wa.me/${digits}?text=${encodeURIComponent(`We are happy to RSVP for ${draft.partnerOne} & ${draft.partnerTwo}'s wedding!`)}` : "#";
  reply.setAttribute("aria-label", digits ? "Reply to RSVP on WhatsApp" : "Add a phone number to enable WhatsApp RSVP");
  renderTemplates();
}

function saveDraft() {
  try { localStorage.setItem(storageKey, JSON.stringify(draft)); document.getElementById("save-status").innerHTML = "<span></span> Saved in this browser"; }
  catch { document.getElementById("save-status").innerHTML = "<span></span> Saved for this visit"; }
}

function showToast(message) {
  const toast = document.getElementById("toast"); toast.textContent = message; toast.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
}

function makeInviteDocument() {
  const theme = activeTemplate();
  const [bg, accent, ink] = theme.colors;
  const names = `${safeText(draft.partnerOne || "Your Name")} &amp; ${safeText(draft.partnerTwo || "Your Love")}`;
  const image = draft.photo ? `<div class="photo" style="background-image:url('${safeText(draft.photo)}')"></div>` : "";
  const phone = (draft.phone || "").replace(/\D/g, "");
  const rsvp = phone ? `<a href="https://wa.me/${phone}?text=${encodeURIComponent(`We are happy to RSVP for ${draft.partnerOne} & ${draft.partnerTwo}'s wedding!`)}">KINDLY REPLY</a>` : "";
  const dress = draft.dress ? `<p class="dress">Dress note · ${safeText(draft.dress)}</p>` : "";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="${bg}"><title>${safeText(draft.partnerOne)} &amp; ${safeText(draft.partnerTwo)} — Wedding Invitation</title><link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=DM+Sans:wght@400;600;700&display=swap" rel="stylesheet"><style>*{box-sizing:border-box}body{margin:0;min-height:100vh;background:${bg};color:${ink};font-family:'Playfair Display',Georgia,serif;display:grid;place-items:center;text-align:center;padding:24px;position:relative}.photo{position:fixed;inset:0;background-size:cover;background-position:center;opacity:.18}main{position:relative;width:min(560px,100%);min-height:620px;padding:28px;display:grid;place-items:center}article{width:100%;min-height:560px;border:1px solid ${accent};outline:1px solid ${accent}55;outline-offset:8px;padding:48px 26px;display:flex;align-items:center;flex-direction:column;justify-content:center;background:${bg}99}.ornament{font-size:28px;color:${accent};margin-bottom:20px}.eyebrow{font:700 9px 'DM Sans',Arial,sans-serif;letter-spacing:.2em}.names{font-size:clamp(45px,10vw,72px);font-weight:400;line-height:1;margin:25px 0;letter-spacing:-.05em}.divider{color:${accent};margin:10px}.message{font-size:17px;line-height:1.7;max-width:390px}.date{font-size:23px;letter-spacing:.07em;margin:16px 0 5px}.time,.venue,.address{font:12px 'DM Sans',Arial,sans-serif}.venue{font-weight:700;letter-spacing:.13em;text-transform:uppercase;margin-top:25px}.address{opacity:.8}.dress{font-style:italic}a{margin-top:24px;color:${ink};font:700 9px 'DM Sans',Arial,sans-serif;letter-spacing:.17em;text-decoration:none;border-bottom:1px solid ${accent};padding-bottom:5px}@media(max-width:480px){main{min-height:570px}article{min-height:520px;padding:35px 18px}}</style></head><body>${image}<main><article><div class="ornament">✿</div><p class="eyebrow">TOGETHER WITH THEIR FAMILIES</p><h1 class="names">${names}</h1><div class="divider">✧</div><p class="message">${safeText(draft.message)}</p><p class="date">${safeText(formatDate(draft.date))}</p><p class="time">${safeText(formatTime(draft.time))}</p><p class="venue">${safeText(draft.venue)}</p><p class="address">${safeText(draft.address)}</p>${dress}${rsvp}</article></main></body></html>`;
}

function downloadInvitation() {
  const selected = activeTemplate();
  if (selected.group === "premium" && !storeSettings.betaMode) {
    showToast("Signature downloads need a checkout link. Free designs are ready to download.");
    return;
  }
  const file = new Blob([makeInviteDocument()], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(file);
  const link = document.createElement("a"); link.href = url; link.download = `${(draft.partnerOne || "wedding").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-invitation.html`;
  document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast(storeSettings.betaMode ? "Beta invitation downloaded. All 20 designs are free to try." : "Your invitation file is ready to share.");
}

function loadSharedDraft() {
  if (!location.hash.startsWith("#invite=")) return;
  try {
    const shared = JSON.parse(decodeURIComponent(location.hash.slice(8)));
    draft = { ...defaultDraft, ...shared };
    setFieldValues();
    history.replaceState(null, "", `${location.pathname}${location.search}`);
  } catch { /* Ignore an invalid shared preview and keep the saved draft. */ }
}

form.addEventListener("input", (event) => {
  if (!event.target.name) return;
  draft[event.target.name] = event.target.value;
  renderPreview(); saveDraft();
});
document.querySelectorAll(".filter-chip").forEach((chip) => chip.addEventListener("click", () => {
  activeFilter = chip.dataset.filter;
  document.querySelectorAll(".filter-chip").forEach((item) => item.classList.toggle("selected", item === chip));
  renderTemplates();
}));
document.getElementById("template-search").addEventListener("input", renderTemplates);
document.getElementById("download-button").addEventListener("click", downloadInvitation);
document.getElementById("reset-button").addEventListener("click", () => {
  draft = { ...defaultDraft }; form.reset(); setFieldValues(); renderPreview(); saveDraft(); showToast("Sample invitation restored.");
});
document.getElementById("share-button").addEventListener("click", async () => {
  const sharedData = { ...draft, phone: "", photo: "" };
  const url = `${location.origin}${location.pathname}#invite=${encodeURIComponent(JSON.stringify(sharedData))}`;
  try { await navigator.clipboard.writeText(url); showToast("Preview link copied. Anyone with it can view these invitation details."); }
  catch { showToast("Clipboard access is unavailable. Copy the page URL from your browser."); }
});
document.querySelectorAll("[data-checkout]").forEach((button) => {
  const checkoutUrl = storeSettings.checkoutLinks[button.dataset.checkout];
  if (checkoutUrl) {
    button.href = checkoutUrl;
    button.target = "_blank";
    button.rel = "noreferrer";
  }
  button.addEventListener("click", (event) => {
    if (storeSettings.checkoutLinks[button.dataset.checkout]) return;
    event.preventDefault(); showToast("Checkout is not connected yet. Add your payment link in script.js before launch.");
  });
});

loadSharedDraft();
setFieldValues();
renderPreview();
saveDraft();
