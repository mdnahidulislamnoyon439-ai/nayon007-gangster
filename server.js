const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const Database = require("better-sqlite3");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || "change-this-session-secret";

const db = new Database("nayon007.db");
db.pragma("journal_mode = WAL");
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  bio TEXT DEFAULT '',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
);
`);

const ADMIN_EMAIL = "admin@nayon007.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Nayon007@2026!";
const adminHash = bcrypt.hashSync(ADMIN_PASSWORD, 10);
const existing = db.prepare("SELECT id FROM users WHERE email=?").get(ADMIN_EMAIL);
if (!existing) {
  db.prepare("INSERT INTO users (name,email,password_hash,bio) VALUES (?,?,?,?)")
    .run("Nayon 007", ADMIN_EMAIL, adminHash, "Website Administrator");
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: "lax", secure: false, maxAge: 1000*60*60*24*7 }
}));
app.use(express.static(path.join(__dirname, "public")));

function auth(req,res,next){
  if (!req.session.user) return res.status(401).json({error:"Login required"});
  next();
}
function safeUser(u){
  return {id:u.id,name:u.name,email:u.email,bio:u.bio,created_at:u.created_at};
}

app.post("/api/register", (req,res)=>{
  const {name,email,password} = req.body;
  if (!name || !email || !password || password.length < 6)
    return res.status(400).json({error:"Name, email and a password of at least 6 characters are required."});
  try {
    const hash = bcrypt.hashSync(password,10);
    const info = db.prepare("INSERT INTO users(name,email,password_hash) VALUES(?,?,?)").run(name.trim(),email.trim().toLowerCase(),hash);
    req.session.user = {id:Number(info.lastInsertRowid), name:name.trim(), email:email.trim().toLowerCase()};
    res.json({ok:true});
  } catch(e) {
    res.status(400).json({error:"This email is already registered."});
  }
});

app.post("/api/login", (req,res)=>{
  const {email,password} = req.body;
  const u = db.prepare("SELECT * FROM users WHERE email=?").get((email||"").trim().toLowerCase());
  if (!u || !bcrypt.compareSync(password||"",u.password_hash))
    return res.status(401).json({error:"Invalid email or password."});
  req.session.user = {id:u.id,name:u.name,email:u.email};
  res.json({ok:true});
});

app.post("/api/logout",(req,res)=>req.session.destroy(()=>res.json({ok:true})));

app.get("/api/me",(req,res)=>{
  if(!req.session.user) return res.json({user:null});
  const u = db.prepare("SELECT id,name,email,bio,created_at FROM users WHERE id=?").get(req.session.user.id);
  res.json({user:u ? safeUser(u) : null});
});

app.get("/api/posts",(req,res)=>{
  const posts = db.prepare(`
    SELECT posts.id, posts.body, posts.created_at, users.name, users.id AS user_id
    FROM posts JOIN users ON users.id=posts.user_id
    ORDER BY posts.id DESC LIMIT 50
  `).all();
  res.json({posts});
});

app.post("/api/posts",auth,(req,res)=>{
  const body = (req.body.body||"").trim();
  if(!body || body.length>1000) return res.status(400).json({error:"Post must be 1–1000 characters."});
  db.prepare("INSERT INTO posts(user_id,body) VALUES(?,?)").run(req.session.user.id,body);
  res.json({ok:true});
});

app.get("/api/admin/users",auth,(req,res)=>{
  if(req.session.user.email !== ADMIN_EMAIL) return res.status(403).json({error:"Admin only"});
  const users = db.prepare("SELECT id,name,email,bio,created_at FROM users ORDER BY id DESC").all();
  res.json({users});
});

app.listen(PORT,()=>console.log(`Nayon 007 Gangster running on http://localhost:${PORT}`));
