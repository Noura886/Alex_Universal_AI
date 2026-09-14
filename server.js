require('dotenv').config();
const express = require('express');
const Database = require('better-sqlite3');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'openrouter/free';

app.use(express.json({limit:'20mb'}));
app.use(express.static('public'));

const db = new Database(process.env.DB_FILE || 'alex.db');
db.pragma('journal_mode = WAL');
db.exec(`CREATE TABLE IF NOT EXISTS conversations(id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS messages(id INTEGER PRIMARY KEY AUTOINCREMENT, conversation_id INTEGER NOT NULL, role TEXT NOT NULL, content TEXT NOT NULL, provider TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(conversation_id) REFERENCES conversations(id) ON DELETE CASCADE);`);

function cleanCodeText(s){return String(s||'').replace(/\u0000/g,'')}

function buildMessages(message, history){
  return [
    {
      role:'system',
      content:'You are Alex, a universal AI assistant. Answer naturally in the user\'s language. Help with general questions, writing, reasoning, math, planning, research-style explanations and software development. When giving code, use fenced Markdown code blocks with the language name. Be accurate and transparent. Never claim you used a tool, searched the web, or accessed live data unless you actually did.'
    },
    ...history.map(m=>({role:m.role==='assistant'?'assistant':'user',content:m.content})),
    {role:'user',content:message}
  ];
}

async function callOpenRouter(message, history){
  if(!OPENROUTER_KEY) throw new Error('OPENROUTER_API_KEY is missing. Add your OpenRouter API key to .env and restart Alex.');

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method:'POST',
    headers:{
      'Authorization':`Bearer ${OPENROUTER_KEY}`,
      'Content-Type':'application/json',
      'HTTP-Referer': process.env.APP_URL || `http://localhost:${PORT}`,
      'X-Title':'Alex Universal AI'
    },
    body:JSON.stringify({
      model:OPENROUTER_MODEL,
      messages:buildMessages(message,history),
      max_tokens:Number(process.env.MAX_TOKENS || 4000)
    })
  });

  const data = await response.json().catch(()=>({}));
  if(!response.ok){
    const detail = data?.error?.message || `OpenRouter request failed with HTTP ${response.status}`;
    throw new Error(detail);
  }

  const text = data?.choices?.[0]?.message?.content;
  if(!text) throw new Error('OpenRouter returned an empty response. Please try again.');

  return {
    text,
    provider:'OpenRouter Free',
    model:data?.model || OPENROUTER_MODEL
  };
}

app.get('/api/health',(req,res)=>res.json({
  ok:true,
  providers:{openrouter:!!OPENROUTER_KEY},
  model:OPENROUTER_MODEL
}));

app.get('/api/conversations',(req,res)=>res.json(db.prepare('SELECT id,title,created_at,updated_at FROM conversations ORDER BY updated_at DESC').all()));
app.post('/api/conversations',(req,res)=>{
  const title=(req.body.title||'New chat').slice(0,120);
  const r=db.prepare('INSERT INTO conversations(title) VALUES(?)').run(title);
  res.json({id:r.lastInsertRowid,title});
});
app.get('/api/conversations/:id/messages',(req,res)=>res.json(db.prepare('SELECT id,role,content,provider,created_at FROM messages WHERE conversation_id=? ORDER BY id').all(req.params.id)));
app.delete('/api/conversations/:id',(req,res)=>{
  db.prepare('DELETE FROM messages WHERE conversation_id=?').run(req.params.id);
  db.prepare('DELETE FROM conversations WHERE id=?').run(req.params.id);
  res.json({ok:true});
});

app.post('/api/agent',async(req,res)=>{
  try{
    const message=cleanCodeText(req.body.message||'').trim();
    if(!message)return res.status(400).json({error:'Message is empty'});

    let conversationId=req.body.conversationId;
    if(!conversationId){
      const r=db.prepare('INSERT INTO conversations(title) VALUES(?)').run(message.slice(0,60));
      conversationId=r.lastInsertRowid;
    }

    const history=db.prepare('SELECT role,content FROM messages WHERE conversation_id=? ORDER BY id DESC LIMIT 12').all(conversationId).reverse();
    db.prepare('INSERT INTO messages(conversation_id,role,content) VALUES(?,?,?)').run(conversationId,'user',message);

    const out=await callOpenRouter(message,history);

    db.prepare('INSERT INTO messages(conversation_id,role,content,provider) VALUES(?,?,?,?)').run(conversationId,'assistant',out.text||'',out.provider);
    db.prepare("UPDATE conversations SET updated_at=CURRENT_TIMESTAMP WHERE id=?").run(conversationId);
    res.json({...out,conversationId});
  }catch(e){
    console.error(e);
    res.status(500).json({error:e.message||'Agent error'});
  }
});

app.use((req,res)=>res.sendFile(require('path').join(__dirname,'public','index.html')));
app.listen(PORT,()=>console.log(`Alex running at http://localhost:${PORT}`));
