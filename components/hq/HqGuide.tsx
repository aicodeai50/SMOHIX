'use client';
import Link from 'next/link';
import { MessageCircle, Paperclip, Plus, Send, X } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { answerHqQuestion, type GuideDocument, type GuideAnswer } from '@/lib/hq/guide-search';
type Exchange = { question: string; answer: GuideAnswer };
const EMPTY_EXCHANGES: Exchange[] = [];
type Thread = { id: number; exchanges: Exchange[] };
const PROMPTS = ['Which products are live?', 'What is Smohix PRI?', 'How do I manage API keys?', 'What are the prices?'];
export function HqGuide({ documents }: { documents: GuideDocument[] }) {
  const [open,setOpen] = useState(false);
  const launcher=useRef<HTMLButtonElement>(null);
  const [input,setInput] = useState('');
  const [threads,setThreads] = useState<Thread[]>([{id:0,exchanges:[]}]);
  const [active,setActive] = useState(0);
  const [notice,setNotice] = useState<string | null>(null);
  const counter=useRef(1);
  const field=useRef<HTMLInputElement>(null);
  const fileField=useRef<HTMLInputElement>(null);
  const conversation=useRef<HTMLDivElement>(null);
  const exchanges=threads.find(thread=>thread.id===active)?.exchanges ?? EMPTY_EXCHANGES;
  useEffect(()=>{const panel=conversation.current;if(panel) panel.scrollTop=panel.scrollHeight;},[exchanges]);
  useEffect(()=>{
    function followAnchor(){if(window.location.hash==='#hq-guide')setOpen(true);}
    followAnchor();window.addEventListener('hashchange',followAnchor);
    return ()=>window.removeEventListener('hashchange',followAnchor);
  },[]);
  useEffect(()=>{if(open)field.current?.focus({preventScroll:true});},[open]);
  function closeChat(){setOpen(false);launcher.current?.focus({preventScroll:true});}
  function newChat(){const id=counter.current++;setThreads(all=>[{id,exchanges:[]},...all].slice(0,5));setActive(id);setInput('');setNotice(null);field.current?.focus();}
  function ask(question:string){
    const clean=question.trim().slice(0,800);if(!clean)return;
    const answer=answerHqQuestion(clean,documents,exchanges.at(-1)?.answer.sources[0]?.id);
    const safeQuestion=/\b(sk-[a-z0-9_-]{12,}|smohix_sk_[a-z0-9_-]{8,})\b/i.test(clean)?'API key question (key omitted)':clean;
    setThreads(all=>all.map(thread=>thread.id===active?{...thread,exchanges:[...thread.exchanges,{question:safeQuestion,answer}].slice(-6)}:thread));
    setInput('');setNotice(null);field.current?.focus();
  }
  function submit(event:FormEvent){event.preventDefault();ask(input);}
  async function attach(file?:File){
    if(!file)return;
    if(!file.name.toLowerCase().endsWith('.txt')||file.size>16000){setNotice('Choose a .txt file smaller than 16 KB. It fills your question locally.');return;}
    try{setInput((await file.text()).trim().slice(0,800));setNotice('Text loaded into your question locally. Review it before sending.');field.current?.focus();}
    catch{setNotice('Could not read that text file. Try another file.');}
    finally{if(fileField.current)fileField.current.value='';}
  }
  return <div className="hq-widget">
    <button ref={launcher} type="button" className="hq-widget__launcher" aria-expanded={open} aria-controls="hq-guide" onClick={()=>open?closeChat():setOpen(true)}>
      <span className="hq-widget__icon"><MessageCircle size={22} aria-hidden/></span>
      <span>Smohix Assistant</span><span className="hq-widget__status" aria-hidden/>
    </button>
    <section id="hq-guide" className="hq-widget__window" hidden={!open} role="dialog" aria-modal="false" aria-labelledby="hq-guide-heading" onKeyDown={event=>{if(event.key==='Escape'){event.stopPropagation();closeChat();}}}>
      <header className="hq-widget__header"><div><h2 id="hq-guide-heading" className="text-base font-semibold">Smohix Assistant</h2><p className="mt-1 text-xs text-muted">Your guide to Smohix HQ</p></div><button type="button" onClick={closeChat} aria-label="Close Smohix Assistant" className="rounded-lg p-2 text-muted hover:text-foreground"><X size={20} aria-hidden/></button></header>
      <div className="hq-guide__panel hq-chat-layout">
        <aside className="hq-chat-sidebar" aria-label="Recent chats">
          <button type="button" onClick={newChat} className="flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-border text-sm font-semibold"><Plus size={16} aria-hidden/>New chat</button>
          <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-muted">Recent chats</p>
          <div className="hq-chat-history">{threads.map(thread=><button type="button" key={thread.id} aria-pressed={active===thread.id} onClick={()=>{setActive(thread.id);setInput('');setNotice(null);}}>{thread.exchanges[0]?.question ?? 'New conversation'}</button>)}</div>
          <p className="mt-5 text-xs leading-relaxed text-muted">Kept in this page session only. No paid model calls.</p>
          <Link href="https://ai.smohix.run" className="mt-5 inline-block text-sm font-semibold text-accent">Open Smohix AI ↗</Link>
        </aside>
        <div className="hq-chat-main">
          <div className="flex items-center justify-between gap-3 border-b border-border pb-4"><span className="text-sm font-semibold">Smohix HQ guide <span className="ml-2 text-xs font-normal text-accent">Source-backed</span></span>
            {exchanges.length>0&&<button type="button" onClick={()=>{setThreads(all=>all.map(thread=>thread.id===active?{...thread,exchanges:[]}:thread));field.current?.focus();}} className="text-xs text-muted">Clear chat</button>}
          </div>
          <div ref={conversation} className="hq-guide__conversation" role="log" aria-label="HQ conversation" aria-live="polite" aria-relevant="additions">
            {exchanges.length===0?<div className="hq-chat-response"><p className="text-xs font-semibold text-accent">SMOHIX HQ</p><p className="mt-3 text-sm leading-relaxed">Hello. Where would you like to begin? Ask about a product or choose a suggested question below.</p></div>:exchanges.map((exchange,index)=><div key={index} className="py-4">
              <p className="hq-guide__question"><span className="sr-only">You: </span>{exchange.question}</p>
              <div className="hq-chat-response"><p className="text-xs font-semibold text-accent">SMOHIX HQ</p><p className="mt-3 whitespace-pre-line text-sm leading-relaxed">{exchange.answer.text}</p><div className="mt-3 flex flex-wrap gap-3">{exchange.answer.sources.map(source=><Link key={source.id} href={source.href} className="text-xs font-semibold text-accent">{source.title} →</Link>)}</div></div>
            </div>)}
          </div>
          <div className="my-4 flex flex-wrap gap-2" aria-label="Suggested questions">{PROMPTS.map(prompt=><button key={prompt} type="button" onClick={()=>ask(prompt)} className="hq-guide__prompt">{prompt}</button>)}</div>
          <form onSubmit={submit} className="flex items-center gap-2 rounded-xl border border-border bg-background p-2">
            <input ref={fileField} type="file" accept=".txt,text/plain" className="hidden" aria-label="Text file for your question" onChange={event=>void attach(event.target.files?.[0])}/>
            <button type="button" onClick={()=>fileField.current?.click()} aria-label="Attach text to question" title="Load a small text file locally" className="rounded-lg p-2 text-muted hover:text-foreground"><Paperclip size={18} aria-hidden/></button>
            <label htmlFor="hq-question" className="sr-only">Your question about Smohix</label>
            <input ref={field} id="hq-question" value={input} maxLength={800} onChange={event=>setInput(event.target.value)} placeholder="Ask about Smohix…" className="min-w-0 flex-1 bg-transparent py-2 text-sm"/>
            <button type="submit" disabled={!input.trim()} className="flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-background disabled:opacity-50"><Send size={16} aria-hidden/><span>Send</span></button>
          </form>
          {notice&&<p role="status" className="mt-3 text-xs text-muted">{notice}</p>}
          <p className="mt-3 text-xs leading-relaxed text-muted">Published-source guidance. No credential storage or file uploads. Check service status for runtime availability.</p>
        </div>
      </div>
    </section>
  </div>;
}
