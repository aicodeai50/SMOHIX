"use client";
import Link from 'next/link';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { answerHqQuestion, type GuideDocument, type GuideAnswer } from '@/lib/hq/guide-search';
type Exchange = { question: string; answer: GuideAnswer };
const PROMPTS = ['Which products are live?', 'What is Smohix PRI?', 'How do I manage API keys?', 'What are the prices?'];
export function HqGuide({ documents }: { documents: GuideDocument[] }) {
  const [input, setInput] = useState('');
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const field = useRef<HTMLInputElement>(null);
  const conversation = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const panel = conversation.current;
    if (panel) panel.scrollTop = panel.scrollHeight;
  }, [exchanges]);
  function ask(question: string) {
    const clean = question.trim().slice(0, 800);
    if (!clean) return;
    const previous = exchanges.at(-1)?.answer.sources[0]?.id;
    const answer = answerHqQuestion(clean, documents, previous);
    const safeQuestion = /\b(sk-[a-z0-9_-]{12,}|smohix_sk_[a-z0-9_-]{8,})\b/i.test(clean) ? 'API key question (key omitted)' : clean;
    setExchanges((history) => [...history, { question: safeQuestion, answer }].slice(-6));
    setInput('');
    field.current?.focus();
  }
  function submit(event: FormEvent) { event.preventDefault(); ask(input); }
  return <section id="hq-guide" className="hq-guide" aria-labelledby="hq-guide-heading">
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="hq-guide__layout">
        <div>
          <p className="smohix-signal-meta">Your way into Smohix</p>
          <h2 id="hq-guide-heading" className="mt-3 font-semibold tracking-tight">Ask Smohix HQ.</h2>
          <p className="mt-4 max-w-sm leading-relaxed text-muted">Find the right product, understand what’s available, and get a clear next step from our published product and help sources.</p>
          <Link href="https://ai.smohix.run" className="mt-6 inline-block font-semibold text-accent">Open Smohix AI for broader help ↗</Link>
        </div>
        <div className="hq-guide__panel">
          <div className="flex items-center justify-between gap-3 border-b border-border pb-4">
            <span className="text-sm font-semibold">Smohix HQ guide</span>
            {exchanges.length > 0 && <button type="button" onClick={() => { setExchanges([]); field.current?.focus(); }} className="text-sm text-muted">Clear chat</button>}
          </div>
          <div ref={conversation} className="hq-guide__conversation" role="log" aria-label="HQ conversation" aria-live="polite" aria-relevant="additions">
            {exchanges.length === 0 ? <p className="py-4 text-sm leading-relaxed text-muted">Hello. What would you like to know about Smohix?</p> : exchanges.map((exchange, index) => <div key={index} className="py-4">
              <p className="hq-guide__question">{exchange.question}</p>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">{exchange.answer.text}</p>
              <div className="mt-3 flex flex-wrap gap-3">{exchange.answer.sources.map((source) => <Link key={source.id} href={source.href} className="text-xs font-semibold text-accent">{source.title} →</Link>)}</div>
            </div>)}
          </div>
          <div className="my-4 flex flex-wrap gap-2" aria-label="Suggested questions">{PROMPTS.map((prompt) => <button key={prompt} type="button" onClick={() => ask(prompt)} className="hq-guide__prompt">{prompt}</button>)}</div>
          <form onSubmit={submit} className="flex flex-wrap gap-2">
            <label className="sr-only" htmlFor="hq-question">Your question about Smohix</label>
            <input ref={field} id="hq-question" value={input} maxLength={800} onChange={(event) => setInput(event.target.value)} placeholder="Ask about products, APIs, pricing…" className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-3 text-sm" />
            <button type="submit" disabled={!input.trim()} className="rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-background disabled:opacity-50">Ask</button>
          </form>
          <p className="mt-3 text-xs text-muted">Answers from Smohix product and help sources. Availability can change; check Service status.</p>
        </div>
      </div>
    </div>
  </section>;
}
