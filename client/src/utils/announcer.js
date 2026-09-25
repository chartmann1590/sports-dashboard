// Announcer: speaks play-by-play scripts with two providers:
//   1. "server" — the optional Kokoro TTS sidecar, proxied via /api/tts (most human-like)
//   2. "browser" — the built-in Web Speech API (free, zero setup, default)
// Never throws to callers: all failures degrade silently with a console.warn.

import { SPEECH_PITCH_BY_EXCITEMENT, SPEECH_RATE_BY_EXCITEMENT } from './commentary.js';

const HEALTH_TIMEOUT_MS = 2500;
const CLAMP_EXCITEMENT = e => Math.min(3, Math.max(0, Number(e) || 0));

/**
 * @param {object} opts
 * @param {'live'|'replay'} [opts.mode='live'] — live mode drops new speech while
 *   audio is already playing; replay mode keeps a tiny queue (max 2).
 * @param {(state: 'idle'|'speaking') => void} [opts.onState]
 */
export class Announcer {
  constructor({ mode = 'live', onState } = {}) {
    this.mode = mode;
    this.onState = typeof onState === 'function' ? onState : null;
    this.enabled = false;
    this.provider = 'none';
    this.state = 'idle';
    this._serverAvailable = false;
    this._healthChecked = false;
    this._audio = null;
    this._queue = [];
    this._voicesWarmed = false;
    this._onVoicesChanged = () => { this._voicesWarmed = true; };
  }

  _setState(next) {
    this.state = next;
    try { this.onState?.(next); } catch { /* ignore listener errors */ }
  }

  /** GET /api/tts/health (~2.5s timeout). Result is cached per instance. */
  async probeServer() {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);
      const res = await fetch('/api/tts/health', { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) return false;
      const data = await res.json().catch(() => null);
      return data?.available === true;
    } catch {
      return false;
    }
  }

  /** Enable the announcer, picking the best available provider. Returns the provider. */
  async enable() {
    try {
      this.enabled = true;
      this._warmVoices();
      if (!this._healthChecked) {
        this._healthChecked = true;
        this._serverAvailable = await this.probeServer();
      }
      if (this._serverAvailable) this.provider = 'server';
      else if (typeof window !== 'undefined' && window.speechSynthesis) this.provider = 'browser';
      else this.provider = 'none';
      return this.provider;
    } catch (err) {
      console.warn('announcer enable failed:', err);
      this.provider = 'none';
      return 'none';
    }
  }

  /** Stop everything and release resources. */
  disable() {
    this.enabled = false;
    try {
      if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
    } catch { /* ignore */ }
    try { this._audio?.pause(); } catch { /* ignore */ }
    this._audio = null;
    this._queue = [];
    this._setState('idle');
  }

  /** 'server' | 'browser' | 'none' */
  getProvider() {
    return this.provider;
  }

  /** Speak a commentary script. Never throws. */
  async speak({ text, excitement = 0 } = {}) {
    if (!this.enabled || !text) return;
    try {
      if (this.provider === 'server') await this._speakServer(String(text), excitement);
      else if (this.provider === 'browser') this._speakBrowser(String(text), excitement);
    } catch (err) {
      console.warn('announcer speak failed:', err);
    }
  }

  // ---- server (Kokoro sidecar) provider ----

  async _speakServer(text, excitement) {
    const e = CLAMP_EXCITEMENT(excitement);
    const speed = SPEECH_RATE_BY_EXCITEMENT[e] ?? 1.0;
    if (this._audio && !this._audio.paused) {
      if (this.mode === 'live') return; // drop stale live chatter
      if (this._queue.length >= 2) this._queue.shift();
      this._queue.push({ text, speed });
      return;
    }
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, speed }),
    });
    if (!res.ok) throw new Error(`tts proxy ${res.status}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    let audio;
    try {
      audio = new Audio(url);
    } catch (err) {
      URL.revokeObjectURL(url);
      throw err;
    }
    this._audio = audio;
    this._setState('speaking');
    audio.onended = audio.onerror = () => {
      URL.revokeObjectURL(url);
      this._playNextQueued();
    };
    await audio.play().catch(err => { throw err; });
  }

  _playNextQueued() {
    this._audio = null;
    const next = this._queue.shift();
    if (next && this.enabled) {
      this._speakServer(next.text, 0).catch(err => {
        console.warn('announcer queued speak failed:', err);
        this._playNextQueued();
      });
    } else {
      this._setState('idle');
    }
  }

  // ---- browser (Web Speech API) provider ----

  _warmVoices() {
    try {
      const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
      if (!synth || this._voicesWarmed) return;
      synth.getVoices();
      synth.addEventListener?.('voiceschanged', this._onVoicesChanged);
      this._voicesWarmed = true;
    } catch { /* ignore */ }
  }

  _pickVoice() {
    try {
      const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
      if (!synth) return null;
      const voices = synth.getVoices() || [];
      const english = voices.filter(v => /^en([-_]|$)/i.test(String(v.lang || '')));
      const pool = english.length ? english : voices;
      const match = re => pool.find(v => re.test(String(v.name || '')));
      return match(/google us english/i) || match(/natural|neural/i) || match(/en[-_]us/i) || pool[0] || null;
    } catch {
      return null;
    }
  }

  _speakBrowser(text, excitement) {
    try {
      const synth = window.speechSynthesis;
      const e = CLAMP_EXCITEMENT(excitement);
      if (this.mode === 'live' && synth.speaking) return; // drop stale live chatter
      if (synth.speaking) synth.cancel(); // replay mode: interrupt with the latest
      const utter = new SpeechSynthesisUtterance(text);
      const voice = this._pickVoice();
      if (voice) utter.voice = voice;
      utter.rate = SPEECH_RATE_BY_EXCITEMENT[e] ?? 1.0;
      utter.pitch = SPEECH_PITCH_BY_EXCITEMENT[e] ?? 1.0;
      utter.onend = utter.onerror = () => this._setState('idle');
      this._setState('speaking');
      synth.speak(utter);
    } catch (err) {
      console.warn('announcer browser speak failed:', err);
      this._setState('idle');
    }
  }
}
