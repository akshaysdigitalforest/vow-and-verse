// Store checkout links here after creating digital products in your chosen checkout service.
// GitHub Pages cannot keep a secret or verify a purchase; use a server/API for secure access control.
const storeSettings = {
  betaMode: true,
  checkoutLinks: { single: "", custom: "" },
  currency: "INR",
  prices: { single: 299, custom: 999 },
};
const apiBaseUrl = String(window.VOW_CONFIG?.apiBaseUrl || "").replace(/\/+$/, "");

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
  partnerOne: "King",
  partnerTwo: "Queen",
  date: "2026-12-12",
  time: "17:00",
  venue: "The Garden Courtyard",
  address: "Jaipur, Rajasthan",
  hotel: "",
  hotelMapUrl: "",
  message: "With joy in our hearts, we invite you to celebrate the beginning of our forever.",
  photo: "",
  phone: "",
  dress: "",
  eventOne: "Wedding Ceremony",
  eventOneTime: "5:00 PM",
  eventTwo: "Dinner & Celebration",
  eventTwoTime: "7:00 PM",
  gallery: "",
};

const storageKey = "vow-verse-draft-v1";
let draft = { ...defaultDraft, ...readSavedDraft() };
let activeFilter = "all";
let toastTimer;
let cloudInvite = readCloudInvite();
let cloudSaveTimer;
let assetUrls = { photo: "", gallery: [] };
const form = document.getElementById("editor-form");
const templateGrid = document.getElementById("template-grid");
const preview = document.getElementById("invite-preview-frame");
const activeTemplate = () => templates.find((item) => item.id === Number(draft.templateId)) || templates[0];

function readCloudInvite() {
  try { return JSON.parse(localStorage.getItem("vow-verse-cloud-invite-v1") || "null"); }
  catch { return null; }
}

function readSavedDraft() {
  try { return JSON.parse(localStorage.getItem(storageKey) || "{}"); }
  catch { return {}; }
}

function safeText(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

function safeGoogleMapsUrl(value) {
  try {
    const url = new URL(String(value || "").trim());
    const trustedHosts = new Set(["google.com", "www.google.com", "maps.google.com", "maps.app.goo.gl", "goo.gl"]);
    return url.protocol === "https:" && trustedHosts.has(url.hostname.toLowerCase()) ? url.href : "";
  } catch { return ""; }
}

function setFieldValues() {
  Object.entries(draft).forEach(([key, value]) => {
    const field = form.elements.namedItem(key);
    if (field && typeof value === "string") field.value = value;
  });
  syncMediaFields();
}

function syncMediaFields() {
  form.elements.namedItem("photo").value = assetUrls.photo || draft.photo || "";
  const savedGallery = (draft.gallery || "").split(/\r?\n/).map((value) => value.trim()).filter(Boolean);
  form.elements.namedItem("gallery").value = savedGallery.map((url, index) => assetUrls.gallery[index] || url).join("\n");
}

function applyCloudInvitation(result) {
  draft = { ...defaultDraft, ...result.data };
  assetUrls = {
    photo: result.assets?.photo || draft.photo || "",
    gallery: Array.isArray(result.assets?.gallery) ? result.assets.gallery : [],
  };
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
  document.getElementById("active-template-label").textContent = `${String(theme.id).padStart(2, "0")} · ${theme.name.toUpperCase()}`;
  preview.srcdoc = makeInviteDocument("", assetUrls);
  renderTemplates();
}

function saveDraft() {
  try { localStorage.setItem(storageKey, JSON.stringify(draft)); document.getElementById("save-status").innerHTML = "<span></span> Saved in this browser"; }
  catch { document.getElementById("save-status").innerHTML = "<span></span> Saved for this visit"; }
  if (cloudInvite && apiBaseUrl) {
    clearTimeout(cloudSaveTimer);
    cloudSaveTimer = setTimeout(() => saveCloudDraft().catch(() => {
      document.getElementById("save-status").innerHTML = "<span></span> Cloud save paused · retry by copying the guest link";
    }), 900);
  }
}

async function apiRequest(path, options = {}) {
  if (!apiBaseUrl) throw new Error("Google Cloud storage is not connected yet.");
  const response = await fetch(`${apiBaseUrl}${path}`, options);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "The invitation service could not complete that request.");
  return body;
}

async function ensureCloudInvite() {
  if (cloudInvite?.slug && cloudInvite?.editToken) return cloudInvite;
  const created = await apiRequest("/api/invitations", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data: draft }),
  });
  cloudInvite = { slug: created.slug, editToken: created.editToken };
  localStorage.setItem("vow-verse-cloud-invite-v1", JSON.stringify(cloudInvite));
  return cloudInvite;
}

async function saveCloudDraft() {
  if (!apiBaseUrl || !cloudInvite?.slug) return;
  clearTimeout(cloudSaveTimer);
  await apiRequest(`/api/invitations/${encodeURIComponent(cloudInvite.slug)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "X-Invite-Edit-Token": cloudInvite.editToken },
    body: JSON.stringify({ data: draft }),
  });
  document.getElementById("save-status").innerHTML = "<span></span> Saved to your invitation";
}

async function prepareUpload(file, slot) {
  const status = document.getElementById("upload-status");
  if (!apiBaseUrl) {
    status.textContent = "Image uploads need the Google Cloud project connection. Image links still work while setup is pending.";
    showToast("Connect the Google Cloud backend before uploading files.");
    return;
  }
  if (!file || !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 8 * 1024 * 1024) {
    status.textContent = "Choose a JPG, PNG, or WebP image smaller than 8 MB.";
    return;
  }
  if (slot === "gallery" && (draft.gallery || "").split(/\r?\n/).filter(Boolean).length >= 3) {
    status.textContent = "This invitation already has three gallery images.";
    return;
  }
  status.textContent = `Preparing ${file.name}…`;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 2200 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close();
    const optimized = await new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Could not process that image.")), "image/webp", .84));
    const record = await ensureCloudInvite();
    const upload = await apiRequest(`/api/invitations/${encodeURIComponent(record.slug)}/uploads`, {
      method: "POST", headers: { "Content-Type": "application/json", "X-Invite-Edit-Token": record.editToken },
      body: JSON.stringify({ contentType: "image/webp", slot }),
    });
    const formData = new FormData();
    Object.entries(upload.fields).forEach(([key, value]) => formData.append(key, value));
    formData.append("file", optimized, "invitation-photo.webp");
    const sent = await fetch(upload.uploadUrl, { method: "POST", body: formData });
    if (!sent.ok) throw new Error("Cloud Storage rejected the upload. Check the bucket's CORS and API permissions.");
    if (slot === "cover") {
      draft.photo = upload.imageUrl;
      assetUrls.photo = upload.signedReadUrl;
    } else {
      const images = (draft.gallery || "").split(/\r?\n/).map((value) => value.trim()).filter(Boolean);
      images.push(upload.imageUrl); draft.gallery = images.slice(0, 3).join("\n");
      assetUrls.gallery.push(upload.signedReadUrl);
    }
    syncMediaFields();
    saveDraft(); renderPreview(); await saveCloudDraft();
    status.textContent = `${file.name} uploaded and added to this invitation.`;
  } catch (error) {
    status.textContent = error.message;
  }
}

async function loadRsvps() {
  const resultNode = document.getElementById("rsvp-results");
  if (!apiBaseUrl) { resultNode.textContent = "Connect the hosted invitation service to collect guest responses."; return; }
  if (!cloudInvite?.slug) { resultNode.textContent = "Create or copy your guest link to start collecting responses."; return; }
  resultNode.textContent = "Loading guest replies…";
  try {
    const result = await apiRequest(`/api/invitations/${encodeURIComponent(cloudInvite.slug)}/rsvps`, { headers: { "X-Invite-Edit-Token": cloudInvite.editToken } });
    resultNode.replaceChildren();
    if (!result.rsvps.length) { resultNode.textContent = "No guest replies yet. Share your guest link to invite responses."; return; }
    result.rsvps.forEach((reply) => {
      const row = document.createElement("p");
      row.textContent = `${reply.guestName} · ${reply.attendance === "yes" ? "Joyfully accepts" : "Sadly declines"} · ${reply.guests} guest(s)${reply.note ? ` · ${reply.note}` : ""}`;
      resultNode.append(row);
    });
  } catch (error) { resultNode.textContent = error.message; }
}

function showToast(message) {
  const toast = document.getElementById("toast"); toast.textContent = message; toast.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
}

function makeInviteDocument(invitationId = "", media = assetUrls) {
  const theme = activeTemplate();
  const [bg, accent, ink] = theme.colors;
  const one = safeText(draft.partnerOne || "Your Name");
  const two = safeText(draft.partnerTwo || "Your Love");
  const names = `${one} <i>&amp;</i> ${two}`;
  const photoCandidate = media?.photo || draft.photo;
  const imageUrl = /^https?:\/\//i.test(photoCandidate || "") ? photoCandidate : "";
  const image = imageUrl ? `url(${JSON.stringify(imageUrl)})` : "none";
  const phone = (draft.phone || "").replace(/\D/g, "");
  const apiEndpoint = JSON.stringify(apiBaseUrl);
  const guestInvitationId = JSON.stringify(invitationId);
  const dateMs = draft.date ? new Date(`${draft.date}T${draft.time || "17:00"}:00`).getTime() : 0;
  const venueMapSearch = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${draft.venue || ""} ${draft.address || ""}`.trim())}`;
  const venueMapHref = safeText(venueMapSearch);
  const hotelMapSearch = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(draft.hotel || "")}`;
  const hotelMapHref = safeText(safeGoogleMapsUrl(draft.hotelMapUrl) || hotelMapSearch);
  const photos = (draft.gallery || "").split(/\r?\n/).map((url, index) => (media?.gallery?.[index] || url).trim()).filter((url) => /^https?:\/\//i.test(url)).slice(0, 3);
  const galleryNav = photos.length ? '<a href="#moments">Gallery</a>' : "";
  const gallerySection = photos.length ? `<section class="section reveal" id="moments"><div class="inner"><p class="label">LITTLE MOMENTS, BIG LOVE</p><h2>A few favorite memories.</h2><div class="gallery-grid">${photos.map((url, index) => `<figure><img src="${safeText(url)}" alt="Celebration memory ${index + 1}" loading="lazy"></figure>`).join("")}</div></div></section>` : "";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="${bg}"><meta name="description" content="Wedding celebration of ${one} and ${two}"><title>${one} &amp; ${two} — Wedding Celebration</title><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Great+Vibes&display=swap" rel="stylesheet"><style>
*{box-sizing:border-box}html{scroll-behavior:smooth;scroll-padding-top:70px}body{margin:0;background:#fbf8f1;color:${ink};font-family:'DM Sans',Arial,sans-serif}a{color:inherit;text-decoration:none}.nav{position:fixed;z-index:5;inset:0 0 auto;display:flex;justify-content:center;gap:clamp(18px,5vw,64px);padding:18px 12px;color:white;font-size:9px;letter-spacing:.16em;text-transform:uppercase;background:linear-gradient(#0006,transparent)}.nav a{padding:8px 0;border-bottom:1px solid transparent}.nav a:hover{border-color:white}.cover{min-height:100svh;display:grid;place-items:center;position:relative;text-align:center;color:#fff;background:${bg};background-image:linear-gradient(180deg,#18140b66,#18140b22 45%,#18140b88),${image};background-size:cover;background-position:center;padding:100px 24px 60px}.cover:after{content:'';position:absolute;inset:18px;border:1px solid ${accent}aa;pointer-events:none}.cover-inner{position:relative;z-index:1;max-width:850px}.eyebrow{font-size:9px;letter-spacing:.27em;text-transform:uppercase}.ornament{font:38px 'Great Vibes',cursive;color:${accent};margin:16px}.cover h1{font:400 clamp(50px,10vw,108px)/1 'Playfair Display',Georgia,serif;letter-spacing:-.06em;margin:18px 0}.cover h1 i{display:block;font:italic 22px 'Playfair Display',serif;color:${accent};margin:12px}.date{font-size:11px;letter-spacing:.23em;text-transform:uppercase;margin:28px 0 8px}.place{font-size:9px;letter-spacing:.18em;text-transform:uppercase}.countdown{display:flex;justify-content:center;gap:clamp(16px,4vw,38px);margin:34px auto}.countdown div{min-width:46px}.countdown strong{display:block;font:400 28px 'Playfair Display',serif}.countdown span{font-size:8px;letter-spacing:.14em;text-transform:uppercase}.button{display:inline-block;border:1px solid currentColor;padding:13px 20px;font-size:9px;letter-spacing:.15em;text-transform:uppercase;margin:10px}.section{padding:96px 22px;text-align:center}.inner{max-width:940px;margin:auto}.label{font-size:9px;letter-spacing:.23em;color:${accent};text-transform:uppercase}.section h2{font:400 clamp(38px,6vw,62px)/1.1 'Playfair Display',serif;margin:14px 0 22px}.story{max-width:620px;margin:auto;color:#6d695f;font:17px/1.9 'Playfair Display',serif}.signature{font:36px 'Great Vibes',cursive;color:${accent};margin:24px}.gallery-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin:36px auto;max-width:980px}.gallery-grid figure{margin:0;min-height:220px;background:#eee;overflow:hidden}.gallery-grid img{width:100%;height:100%;min-height:220px;object-fit:cover;transition:transform .45s}.gallery-grid figure:hover img{transform:scale(1.04)}.events{background:${bg}16}.cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;max-width:760px;margin:38px auto}.card{padding:34px 20px;background:#fffdf8;border:1px solid ${accent}55}.card small{font:italic 14px 'Playfair Display',serif;color:${accent}}.card h3{font:400 27px 'Playfair Display',serif;margin:15px 0}.card p{font-size:12px;line-height:1.7;color:#706c63;margin:6px}.dress{font:italic 14px 'Playfair Display',serif;color:#706c63}.travel{background:#f2ede2}.map-links{display:flex;flex-direction:column;align-items:center;gap:8px;margin-top:20px}.map{border-bottom:1px solid ${accent};padding:9px;font-size:10px;letter-spacing:.12em;text-transform:uppercase}.hotel-note{font:italic 14px 'Playfair Display',serif;color:#706c63;margin:10px 0 0}.rsvp{background:${bg};color:white}.rsvp .label{color:${accent}}.rsvp .story{color:#eee9de}.form{display:grid;gap:12px;max-width:440px;margin:28px auto}.form input,.form select,.form textarea{width:100%;padding:14px;border:1px solid #ffffff60;background:#ffffff12;color:white;font:13px 'DM Sans',sans-serif}.form select option{color:#222}.form button{border:0;background:${accent};color:${ink};padding:16px;font:700 10px 'DM Sans',sans-serif;letter-spacing:.15em;text-transform:uppercase;cursor:pointer}.note{font-size:10px;color:#ffffffaa}.footer{padding:32px 20px;text-align:center;background:#171914;color:#ddd;font-size:10px;letter-spacing:.1em}.reveal{opacity:0;transform:translateY(16px);transition:.7s}.reveal.visible{opacity:1;transform:none}@media(max-width:600px){.nav{gap:13px;font-size:8px}.cover:after{inset:10px}.cover h1{font-size:56px}.section{padding:72px 18px}.cards{grid-template-columns:1fr}.gallery-grid{grid-template-columns:1fr}.gallery-grid figure,.gallery-grid img{min-height:260px}}
</style></head><body><nav class="nav" aria-label="Invitation sections"><a href="#story">Our story</a><a href="#events">The day</a>${galleryNav}<a href="#travel">Location</a><a href="#rsvp">RSVP</a></nav>
<header class="cover"><div class="cover-inner"><p class="eyebrow">TOGETHER WITH OUR FAMILIES</p><div class="ornament">✧</div><h1>${names}</h1><p class="eyebrow">INVITE YOU TO CELEBRATE</p><p class="date">${safeText(formatDate(draft.date))}</p><p class="place">${safeText(draft.venue || "Our wedding")}${draft.address ? ` · ${safeText(draft.address)}` : ""}</p><div class="countdown" id="countdown" data-date="${Number.isFinite(dateMs) ? dateMs : 0}"><div><strong data-unit="days">00</strong><span>Days</span></div><div><strong data-unit="hours">00</strong><span>Hours</span></div><div><strong data-unit="minutes">00</strong><span>Minutes</span></div><div><strong data-unit="seconds">00</strong><span>Seconds</span></div></div><a class="button" href="#story">Explore our invitation ↓</a></div></header>
<main><section class="section reveal" id="story"><div class="inner"><p class="label">A NOTE FROM US</p><h2>Our next chapter<br><i>starts with you.</i></h2><p class="story">${safeText(draft.message || "We would love to celebrate this day with you.")}</p><p class="signature">${one} &amp; ${two}</p></div></section>
<section class="section events reveal" id="events"><div class="inner"><p class="label">SAVE THE DATE</p><h2>A day to remember.</h2><p class="story">${safeText(formatDate(draft.date))}</p><div class="cards"><article class="card"><small>01 · Ceremony</small><h3>${safeText(draft.eventOne || "Wedding Ceremony")}</h3><p>${safeText(draft.eventOneTime || formatTime(draft.time))}</p><p>${safeText(draft.venue || "Venue details soon")}</p></article><article class="card"><small>02 · Celebration</small><h3>${safeText(draft.eventTwo || "Dinner & Celebration")}</h3><p>${safeText(draft.eventTwoTime || "")}</p><p>${safeText(draft.venue || "Venue details soon")}</p></article></div>${draft.dress ? `<p class="dress">Attire · ${safeText(draft.dress)}</p>` : ""}</div></section>
${gallerySection}<section class="section travel reveal" id="travel"><div class="inner"><p class="label">COME CELEBRATE WITH US</p><h2>Meet us in<br><i>${safeText(draft.address || "our favourite place")}</i></h2><p class="story">${safeText(draft.venue || "Wedding venue")}${draft.address ? `<br>${safeText(draft.address)}` : ""}</p><div class="map-links"><a class="map" href="${venueMapHref}" target="_blank" rel="noopener noreferrer">Search venue in Google Maps ↗</a>${draft.hotel ? `<p class="hotel-note">${safeText(draft.hotel)}</p><a class="map" href="${hotelMapHref}" target="_blank" rel="noopener noreferrer">${safeGoogleMapsUrl(draft.hotelMapUrl) ? "Open hotel in Google Maps ↗" : "Search hotel in Google Maps ↗"}</a>` : ""}</div></div></section>
<section class="section rsvp reveal" id="rsvp"><div class="inner"><p class="label">KINDLY REPLY</p><h2>Will you join us?</h2><p class="story">It would mean the world to celebrate together.</p><form class="form" id="rsvp-form"><input name="guest" required maxlength="60" placeholder="Your name" aria-label="Your name"><select name="attendance" aria-label="Will you attend?"><option value="yes">Joyfully accepts</option><option value="no">Sadly declines</option></select><select name="guests" aria-label="Number of guests"><option value="1">1 guest</option><option value="2">2 guests</option><option value="3">3 guests</option><option value="4">4 guests</option></select><textarea name="note" rows="2" maxlength="160" placeholder="A note for the couple (optional)" aria-label="A note for the couple"></textarea><button type="submit">${guestInvitationId ? "Send RSVP" : "Send RSVP on WhatsApp"}</button></form><p class="note">${guestInvitationId ? "Your RSVP goes directly to the couple." : phone ? "RSVP opens WhatsApp with your response ready to send." : "RSVP details will be shared soon."}${draft.dress ? ` · Attire: ${safeText(draft.dress)}` : ""}</p></div></section></main><footer class="footer">MADE WITH LOVE · ${one} &amp; ${two}</footer>
<script>(function(){const apiBase=${apiEndpoint},invitationId=${guestInvitationId};const c=document.getElementById('countdown'),t=Number(c.dataset.date);function tick(){let s=Math.max(0,Math.floor((t-Date.now())/1000)),v={days:Math.floor(s/86400),hours:Math.floor(s%86400/3600),minutes:Math.floor(s%3600/60),seconds:s%60};Object.keys(v).forEach(k=>c.querySelector('[data-unit="'+k+'"]').textContent=String(v[k]).padStart(2,'0'))}tick();setInterval(tick,1000);const items=[...document.querySelectorAll('.reveal')];if('IntersectionObserver'in window){const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target)}}),{threshold:.12});items.forEach(x=>io.observe(x))}else items.forEach(x=>x.classList.add('visible'));document.getElementById('rsvp-form').addEventListener('submit',e=>{e.preventDefault();const phone='${phone}';if(!phone&&!(apiBase&&invitationId)){alert('The couple has not enabled WhatsApp RSVPs yet. Please contact them directly.');return}const f=new FormData(e.currentTarget),data={guestName:String(f.get('guest')||'').trim(),attendance:f.get('attendance'),guests:f.get('guests'),note:f.get('note')||''};if(apiBase&&invitationId){fetch(apiBase+'/api/invitations/'+encodeURIComponent(invitationId)+'/rsvps',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}).then(r=>{if(!r.ok)throw Error();e.currentTarget.querySelector('button').textContent='Thank you — your RSVP is sent';e.currentTarget.reset()}).catch(()=>alert('Your RSVP could not be saved right now. Please contact the couple directly.'));return}const message='RSVP for ${one} & ${two}: '+data.guestName+' — '+data.attendance+', '+data.guests+(data.note?' · '+data.note:'');location.href='https://wa.me/'+phone+'?text='+encodeURIComponent(message)})})();</script></body></html>`;
}
async function downloadInvitation() {
  const selected = activeTemplate();
  if (selected.group === "premium" && !storeSettings.betaMode) {
    showToast("Signature downloads need a checkout link. Free designs are ready to download.");
    return;
  }
  let media = assetUrls;
  if (apiBaseUrl && cloudInvite?.slug) {
    try { media = (await apiRequest(`/api/invitations/${encodeURIComponent(cloudInvite.slug)}`)).assets || assetUrls; }
    catch { showToast("Could not refresh your photo links. Try again in a moment."); return; }
  }
  const file = new Blob([makeInviteDocument("", media)], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(file);
  const link = document.createElement("a"); link.href = url; link.download = `${(draft.partnerOne || "wedding").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-invitation.html`;
  document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast(storeSettings.betaMode ? "Beta invitation downloaded. All 20 designs are free to try." : "Your invitation file is ready to share.");
}

function loadSharedDraft() {
  const invite = new URLSearchParams(location.search).get("invite");
  if (!invite) return false;
  try {
    const shared = JSON.parse(invite);
    draft = { ...defaultDraft, ...shared };
    return true;
  } catch { return false; }
}

form.addEventListener("input", (event) => {
  if (!event.target.name) return;
  if (event.target.name === "photo") {
    draft.photo = event.target.value === assetUrls.photo ? draft.photo : event.target.value;
    if (event.target.value !== assetUrls.photo) assetUrls.photo = event.target.value;
  } else if (event.target.name === "gallery") {
    const visible = event.target.value.split(/\r?\n/).map((value) => value.trim()).filter(Boolean);
    const saved = (draft.gallery || "").split(/\r?\n/).map((value) => value.trim()).filter(Boolean);
    const savedAssets = assetUrls.gallery || [];
    const updated = visible.map((value) => {
      const match = savedAssets.indexOf(value);
      return match >= 0 ? saved[match] : value;
    });
    draft.gallery = updated.join("\n");
    assetUrls.gallery = visible;
  } else {
    draft[event.target.name] = event.target.value;
  }
  renderPreview(); saveDraft();
});
document.querySelectorAll(".filter-chip").forEach((chip) => chip.addEventListener("click", () => {
  activeFilter = chip.dataset.filter;
  document.querySelectorAll(".filter-chip").forEach((item) => item.classList.toggle("selected", item === chip));
  renderTemplates();
}));
document.getElementById("template-search").addEventListener("input", renderTemplates);
document.getElementById("download-button").addEventListener("click", downloadInvitation);
document.getElementById("cover-upload").addEventListener("change", (event) => prepareUpload(event.target.files[0], "cover"));
document.getElementById("gallery-upload").addEventListener("change", async (event) => {
  for (const file of [...event.target.files].slice(0, 3)) await prepareUpload(file, "gallery");
  event.target.value = "";
});
document.getElementById("refresh-rsvps").addEventListener("click", loadRsvps);
document.getElementById("reset-button").addEventListener("click", () => {
  draft = { ...defaultDraft }; form.reset(); setFieldValues(); renderPreview(); saveDraft(); showToast("Sample invitation restored.");
});
async function openGuestInvitation() {
  const guestWindow = window.open("about:blank", "_blank");
  if (!guestWindow) { showToast("Allow pop-ups to open the guest website."); return; }
  guestWindow.opener = null;
  try {
    let url;
    if (apiBaseUrl) {
      const record = await ensureCloudInvite();
      await saveCloudDraft();
      url = `${location.origin}${location.pathname}?invitation=${encodeURIComponent(record.slug)}`;
    } else {
      url = `${location.origin}${location.pathname}?invite=${encodeURIComponent(JSON.stringify({ ...draft }))}`;
    }
    guestWindow.location.replace(url);
  } catch (error) {
    guestWindow.close();
    showToast(error.message);
  }
}
window.openGuestInvitation = openGuestInvitation;
document.getElementById("open-invite-button").addEventListener("click", openGuestInvitation);
document.getElementById("share-button").addEventListener("click", async () => {
  let url;
  try {
    if (apiBaseUrl) {
      const record = await ensureCloudInvite();
      await saveCloudDraft();
      url = `${location.origin}${location.pathname}?invitation=${encodeURIComponent(record.slug)}`;
    } else {
      url = `${location.origin}${location.pathname}?invite=${encodeURIComponent(JSON.stringify({ ...draft }))}`;
    }
    await navigator.clipboard.writeText(url);
    await loadRsvps();
    showToast(apiBaseUrl ? "Your guest website link is ready. RSVPs will appear in Guest responses." : "Guest link copied. Connect Google Cloud to save invitations and collect RSVPs.");
  } catch (error) {
    if (url) window.prompt("Copy this guest invitation link:", url);
    else showToast(error.message);
  }
});
document.getElementById("qr-button").addEventListener("click", async (event) => {
  const button = event.currentTarget;
  button.disabled = true;
  try {
    const record = await ensureCloudInvite();
    await saveCloudDraft();
    const response = await fetch(`${apiBaseUrl}/api/invitations/${encodeURIComponent(record.slug)}/qr.png`);
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || "The QR code could not be created.");
    }
    const objectUrl = URL.createObjectURL(await response.blob());
    const download = document.createElement("a");
    download.href = objectUrl;
    download.download = `${(draft.partnerOne || "wedding").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-invitation-qr.png`;
    document.body.append(download); download.click(); download.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    await loadRsvps();
    showToast("Your guest invitation QR code is ready to download.");
  } catch (error) { showToast(error.message); }
  finally { button.disabled = false; }
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

async function boot() {
  const params = new URLSearchParams(location.search);
  const invitationId = params.get("invitation");
  if (invitationId) {
    try {
      const result = await apiRequest(`/api/invitations/${encodeURIComponent(invitationId)}`);
      applyCloudInvitation(result);
      document.open(); document.write(makeInviteDocument(invitationId, assetUrls)); document.close();
    } catch {
      document.body.innerHTML = '<main style="min-height:100vh;display:grid;place-items:center;background:#f7f4ed;color:#282723;font:16px Georgia,serif;text-align:center;padding:24px"><section><p style="letter-spacing:.2em;font:10px Arial,sans-serif">VOW &amp; VERSE</p><h1>This invitation is resting.</h1><p>Its guest link could not be found. Please ask the couple to share it again.</p></section></main>';
    }
    return;
  }
  if (loadSharedDraft()) {
    document.open(); document.write(makeInviteDocument()); document.close();
    return;
  }
  if (apiBaseUrl && cloudInvite?.slug && cloudInvite?.editToken) {
    try {
      const result = await apiRequest(`/api/invitations/${encodeURIComponent(cloudInvite.slug)}`);
      applyCloudInvitation(result);
      localStorage.setItem(storageKey, JSON.stringify(draft));
    } catch { /* Keep the locally saved draft available if the API is briefly offline. */ }
  }
  setFieldValues();
  renderPreview();
  saveDraft();
  if (apiBaseUrl && cloudInvite?.slug && cloudInvite?.editToken) await loadRsvps();
  document.querySelectorAll(".section-wrap,.steps-inner").forEach((node) => node.classList.add("editorial-reveal"));
  if (!apiBaseUrl) document.getElementById("upload-status").textContent = "Cloud photo uploads and saved guest pages will turn on when the Google Cloud project is connected. You can still use image URLs for now.";
}
boot();
