import React, { useMemo, useState } from 'react';
import { Bot, Sparkles, Send, X, Loader2, MapPin, Zap, Clock3 } from 'lucide-react';
import api from '../services/api';

const ParkingAI = ({ locations = [], userLocation = null }) => {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const context = useMemo(() => locations.slice(0, 8).map((l) => ({
    name: l.name,
    address: l.address,
    distanceKm: l.distance,
    availableSlots: l.availableSlots,
    evSlotsAvailable: l.availableEvSlots,
    hourlyRate: l.hourlyRate,
    rating: l.rating,
  })), [locations]);

  const ask = async (prompt = question) => {
    const text = String(prompt || '').trim();
    if (!text) return;
    setLoading(true);
    setAnswer('');
    try {
      const res = await api.post('/ai/parking-assistant', {
        question: text,
        userLocation,
        parkingOptions: context,
      });
      setAnswer(res.data.answer || 'I could not generate a recommendation right now.');
    } catch (error) {
      setAnswer(error.response?.data?.message || 'AI assistant is unavailable. You can still use the live parking search.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-[1200] group flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-white shadow-2xl shadow-slate-950/30 hover:-translate-y-0.5 transition-all"
      >
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-500">
          <Bot className="h-5 w-5" />
        </span>
        <span className="text-left">
          <span className="block text-xs font-black">ParkEasy AI</span>
          <span className="block text-[10px] text-slate-300">Smart parking copilot</span>
        </span>
        <Sparkles className="h-4 w-4 text-amber-300" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[1300] flex items-end justify-end bg-slate-950/30 p-4 sm:p-6 backdrop-blur-[2px]">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between bg-slate-950 px-5 py-4 text-white">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-500"><Bot className="h-5 w-5" /></div>
                <div>
                  <p className="font-black">ParkEasy AI</p>
                  <p className="text-[11px] text-slate-300">Powered by Gemini • parking-aware</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-lg p-2 hover:bg-white/10"><X className="h-5 w-5" /></button>
            </div>

            <div className="max-h-[55vh] space-y-4 overflow-y-auto p-5">
              <div className="grid grid-cols-1 gap-2">
                {[
                  ['Best option', 'Which nearby parking is best for me?'],
                  ['EV choice', 'Find the best EV-friendly option with free slots.'],
                  ['Cheapest', 'Which nearby option gives the best value?'],
                ].map(([label, prompt]) => (
                  <button
                    key={label}
                    onClick={() => { setQuestion(prompt); ask(prompt); }}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3 text-left hover:border-brand-300 hover:bg-brand-50 dark:border-slate-700 dark:hover:bg-slate-800"
                  >
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 dark:bg-slate-800">
                      {label === 'EV choice' ? <Zap className="h-4 w-4 text-blue-500" /> : label === 'Cheapest' ? <Clock3 className="h-4 w-4 text-amber-500" /> : <MapPin className="h-4 w-4 text-brand-500" />}
                    </span>
                    <span><span className="block text-xs font-bold text-slate-900 dark:text-white">{label}</span><span className="block text-[11px] text-slate-500 dark:text-slate-400">{prompt}</span></span>
                  </button>
                ))}
              </div>

              {answer && (
                <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700 dark:bg-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                  {answer}
                </div>
              )}
            </div>

            <form onSubmit={(e) => { e.preventDefault(); ask(); }} className="flex gap-2 border-t border-slate-200 p-4 dark:border-slate-700">
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask about parking..."
                className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
              <button disabled={loading} className="grid w-11 place-items-center rounded-xl bg-brand-600 text-white disabled:opacity-50">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ParkingAI;
