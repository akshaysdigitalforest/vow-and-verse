import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import cors from "cors";
import express from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import QRCode from "qrcode";
import { Firestore, FieldValue } from "@google-cloud/firestore";
import { Storage } from "@google-cloud/storage";

const PORT = Number(process.env.PORT || 8080);
const BUCKET_NAME = process.env.STORAGE_BUCKET;
const COLLECTION = process.env.FIRESTORE_COLLECTION || "invitations";
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_DATA_BYTES = 30_000;
const ALLOWED_FIELDS = new Set([
  "templateId", "partnerOne", "partnerTwo", "date", "time", "venue", "address", "hotel", "hotelMapUrl",
  "message", "photo", "video", "phone", "dress", "eventOne", "eventOneTime", "eventTwo", "events",
  "eventTwoTime", "gallery",
]);

if (!BUCKET_NAME) throw new Error("STORAGE_BUCKET must be configured.");

const db = new Firestore();
const storage = new Storage();
const bucket = storage.bucket(BUCKET_NAME);
const app = express();
const origins = (process.env.ALLOWED_ORIGINS || "https://beta.akshaysdigitalforest.in")
  .split(",").map((origin) => origin.trim()).filter(Boolean);
const PUBLIC_APP_URL = process.env.PUBLIC_APP_URL || origins[0];

app.disable("x-powered-by");
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({
  origin(origin, callback) {
    if (!origin || origins.includes(origin)) return callback(null, true);
    return callback(new Error("This website is not allowed to use the invitation API."));
  },
  methods: ["GET", "POST", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "X-Invite-Edit-Token"],
  maxAge: 3600,
}));
app.use(express.json({ limit: "64kb" }));
app.use("/api", rateLimit({ windowMs: 60_000, limit: 90, standardHeaders: "draft-7", legacyHeaders: false }));

const inviteRef = (slug) => db.collection(COLLECTION).doc(slug);
const hashToken = (token) => createHash("sha256").update(token).digest("hex");
const storageUrlPrefix = `https://storage.googleapis.com/${BUCKET_NAME}/`;

function bucketObjectName(url) {
  if (typeof url !== "string" || !url.startsWith(storageUrlPrefix)) return null;
  try { return decodeURIComponent(url.slice(storageUrlPrefix.length)); }
  catch { return null; }
}

async function createAssetUrls(data) {
  const makeViewUrl = async (url) => {
    const objectName = bucketObjectName(url);
    if (!objectName) return /^https?:\/\//i.test(url || "") ? url : "";
    const [signedUrl] = await bucket.file(objectName).getSignedUrl({
      version: "v4",
      action: "read",
      expires: Date.now() + 24 * 60 * 60 * 1000,
    });
    return signedUrl;
  };
  const gallery = (data.gallery || "").split(/\r?\n/).map((url) => url.trim()).filter(Boolean).slice(0, 3);
  return {
    photo: await makeViewUrl(data.photo || ""),
    video: await makeViewUrl(data.video || ""),
    gallery: await Promise.all(gallery.map(makeViewUrl)),
  };
}

function cleanData(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw Object.assign(new Error("Invitation details are required."), { status: 400 });
  const result = {};
  for (const [key, value] of Object.entries(input)) {
    if (key === "events" && Array.isArray(value)) {
      result.events = value.slice(0, 12).map((event) => ({
        title: typeof event?.title === "string" ? event.title.trim().slice(0, 70) : "",
        tagline: typeof event?.tagline === "string" ? event.tagline.trim().slice(0, 140) : "",
        time: typeof event?.time === "string" ? event.time.trim().slice(0, 40) : "",
      }));
      continue;
    }
    if (key === "templateId" && ["number", "string"].includes(typeof value)) {
      const templateId = Number(value);
      if (Number.isInteger(templateId) && templateId >= 1 && templateId <= 20) result.templateId = String(templateId);
      continue;
    }
    if (!ALLOWED_FIELDS.has(key) || typeof value !== "string") continue;
    result[key] = value.slice(0, key === "gallery" ? 4_000 : key === "message" ? 1_000 : 500);
  }
  if (Buffer.byteLength(JSON.stringify(result), "utf8") > MAX_DATA_BYTES) throw Object.assign(new Error("Invitation details are too large."), { status: 413 });
  return result;
}

async function requireOwner(req, res, next) {
  try {
    const token = req.get("X-Invite-Edit-Token") || "";
    const snapshot = await inviteRef(req.params.slug).get();
    if (!snapshot.exists) return res.status(404).json({ error: "Invitation not found." });
    const expected = Buffer.from(snapshot.get("editTokenHash") || "", "hex");
    const actual = Buffer.from(hashToken(token), "hex");
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return res.status(403).json({ error: "Edit access is not valid." });
    req.invitation = snapshot;
    next();
  } catch (error) { next(error); }
}

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.post("/api/invitations", async (req, res, next) => {
  try {
    const slug = randomBytes(9).toString("base64url");
    const editToken = randomBytes(32).toString("base64url");
    const data = cleanData(req.body?.data || {});
    await inviteRef(slug).create({ data, editTokenHash: hashToken(editToken), createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
    res.status(201).json({ slug, editToken });
  } catch (error) { next(error); }
});

app.get("/api/invitations/:slug", async (req, res, next) => {
  try {
    const snapshot = await inviteRef(req.params.slug).get();
    if (!snapshot.exists) return res.status(404).json({ error: "Invitation not found." });
    const data = snapshot.get("data") || {};
    const assets = await createAssetUrls(data);
    res.set("Cache-Control", "no-store").json({ slug: snapshot.id, data, assets });
  } catch (error) { next(error); }
});

app.get("/api/invitations/:slug/qr.png", async (req, res, next) => {
  try {
    const snapshot = await inviteRef(req.params.slug).get();
    if (!snapshot.exists) return res.status(404).json({ error: "Invitation not found." });
    const guestUrl = new URL("/", PUBLIC_APP_URL);
    guestUrl.searchParams.set("invitation", snapshot.id);
    const dataUrl = await QRCode.toDataURL(guestUrl.href, { errorCorrectionLevel: "H", margin: 2, width: 800 });
    const image = Buffer.from(dataUrl.slice("data:image/png;base64,".length), "base64");
    res.set({
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="vow-and-verse-${snapshot.id}-qr.png"`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    }).send(image);
  } catch (error) { next(error); }
});

app.patch("/api/invitations/:slug", requireOwner, async (req, res, next) => {
  try {
    const data = cleanData(req.body?.data);
    await inviteRef(req.params.slug).update({ data, updatedAt: FieldValue.serverTimestamp() });
    res.json({ ok: true });
  } catch (error) { next(error); }
});

app.post("/api/invitations/:slug/uploads", requireOwner, async (req, res, next) => {
  try {
    const { contentType, slot } = req.body || {};
    if (!ALLOWED_MIME.has(contentType)) return res.status(415).json({ error: "Choose a JPG, PNG, or WebP image." });
    if (!["cover", "gallery"].includes(slot)) return res.status(400).json({ error: "Choose a cover or gallery slot." });
    const objectName = `invites/${req.params.slug}/${randomBytes(16).toString("hex")}`;
    const file = bucket.file(objectName);
    const [policy] = await file.generateSignedPostPolicyV4({
      expires: Date.now() + 10 * 60 * 1000,
      fields: { "Content-Type": contentType, "Cache-Control": "private,max-age=3600" },
      conditions: [["content-length-range", 1, MAX_IMAGE_BYTES]],
    });
    const objectPath = objectName.split("/").map(encodeURIComponent).join("/");
    const [signedReadUrl] = await file.getSignedUrl({ version: "v4", action: "read", expires: Date.now() + 24 * 60 * 60 * 1000 });
    res.json({ uploadUrl: policy.url, fields: policy.fields, objectKey: objectName, signedReadUrl, imageUrl: `https://storage.googleapis.com/${BUCKET_NAME}/${objectPath}` });
  } catch (error) { next(error); }
});

app.post("/api/invitations/:slug/rsvps", async (req, res, next) => {
  try {
    if (!(await inviteRef(req.params.slug).get()).exists) return res.status(404).json({ error: "Invitation not found." });
    const guestName = typeof req.body?.guestName === "string" ? req.body.guestName.trim().slice(0, 80) : "";
    const attendance = req.body?.attendance === "no" ? "no" : "yes";
    const guests = Math.min(10, Math.max(1, Number.parseInt(req.body?.guests, 10) || 1));
    const note = typeof req.body?.note === "string" ? req.body.note.trim().slice(0, 300) : "";
    if (!guestName) return res.status(400).json({ error: "Please enter your name." });
    await inviteRef(req.params.slug).collection("rsvps").add({ guestName, attendance, guests, note, createdAt: FieldValue.serverTimestamp() });
    res.status(201).json({ ok: true });
  } catch (error) { next(error); }
});

app.get("/api/invitations/:slug/rsvps", requireOwner, async (req, res, next) => {
  try {
    const snapshot = await inviteRef(req.params.slug).collection("rsvps").orderBy("createdAt", "desc").limit(500).get();
    res.json({ rsvps: snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) });
  } catch (error) { next(error); }
});

app.use((error, _req, res, _next) => {
  const status = Number(error.status) || 500;
  if (status >= 500) console.error(error);
  res.status(status).json({ error: status >= 500 ? "The invitation service is temporarily unavailable." : error.message });
});

app.listen(PORT, "0.0.0.0", () => console.log(`Vow & Verse API listening on ${PORT}`));
