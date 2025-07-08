import { html, css } from "lit";
import { customElement, state, query } from "lit/decorators.js";
import { SketchTailwindElement } from "./sketch-tailwind-element";

// Adapted TextScramble effect from the user's provided example
class TextScramble {
  el: HTMLElement;
  chars: string;
  private queue: Array<{
    from: string;
    to: string;
    start: number;
    end: number;
    char?: string;
  }>;
  private frame: number;
  private frameRequest: number;
  private resolve: (value: void | PromiseLike<void>) => void;

  constructor(el: HTMLElement) {
    this.el = el;
    this.chars = "!<>-_\\/[]{}—=+*^?#";
    this.queue = [];
    this.frame = 0;
    this.frameRequest = 0;
    this.resolve = () => {};
    this.update = this.update.bind(this);
  }

  setText(newText: string) {
    const oldText = this.el.innerText;
    const length = Math.max(oldText.length, newText.length);
    const promise = new Promise<void>((resolve) => (this.resolve = resolve));
    this.queue = [];
    for (let i = 0; i < length; i++) {
      const from = oldText[i] || "";
      const to = newText[i] || "";
      const start = Math.floor(Math.random() * 40);
      const end = start + Math.floor(Math.random() * 40);
      this.queue.push({ from, to, start, end });
    }
    cancelAnimationFrame(this.frameRequest);
    this.frame = 0;
    this.update();
    return promise;
  }

  private update() {
    let output = "";
    let complete = 0;
    for (let i = 0, n = this.queue.length; i < n; i++) {
      let { from, to, start, end, char } = this.queue[i];
      if (this.frame >= end) {
        complete++;
        output += to;
      } else if (this.frame >= start) {
        if (!char || Math.random() < 0.28) {
          char = this.chars[Math.floor(Math.random() * this.chars.length)];
          this.queue[i].char = char;
        }
        output += `<span class=\"text-green-400 opacity-70\">${char}</span>`;
      } else {
        output += from;
      }
    }
    this.el.innerHTML = output;
    if (complete === this.queue.length) {
      this.resolve();
    } else {
      this.frameRequest = requestAnimationFrame(this.update);
      this.frame++;
    }
  }
}

@customElement("sketch-landing-page")
export class SketchLandingPage extends SketchTailwindElement {
  @query("#scramble-text")
  private _scrambleElement!: HTMLElement;

  private _scrambler!: TextScramble;

  firstUpdated() {
    this._scrambler = new TextScramble(this._scrambleElement);
    const phrases = [
      "SKETCH",
      "SECURE CODE ANALYSIS",
      "VULNERABILITY DETECTION",
      "AUTOMATED AUDITS",
    ];
    let counter = 0;
    const next = () => {
      this._scrambler.setText(phrases[counter]).then(() => {
        setTimeout(next, 3000);
      });
      counter = (counter + 1) % phrases.length;
    };
    next();
  }

  static styles = css`
    .scan-line {
      background: linear-gradient(
        rgba(0, 0, 0, 0) 50%,
        rgba(0, 255, 0, 0.05) 50%
      );
      background-size: 100% 4px;
      animation: scan 7s linear infinite;
      pointer-events: none;
    }
    @keyframes scan {
      0% {
        background-position: 0 0;
      }
      100% {
        background-position: 0 -100vh;
      }
    }
  `;

  render() {
    return html`
      <div
        class="flex flex-col items-center justify-center h-full bg-black text-green-400 font-mono p-8 relative overflow-hidden"
      >
        <div class="absolute inset-0 scan-line z-0"></div>
        <div class="z-10 text-center flex flex-col items-center">
          <h1 id="scramble-text" class="text-4xl md:text-6xl font-bold mb-8 h-20"></h1>

          <div class="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto text-left mb-12">
            <div class="bg-gray-900 bg-opacity-75 p-6 border border-green-700 rounded-lg backdrop-blur-sm">
              <h2 class="text-2xl font-bold mb-2 text-green-300">Automated Audits</h2>
              <p class="text-green-500">Instantly scan your codebase for known vulnerabilities and common misconfigurations.</p>
            </div>
            <div class="bg-gray-900 bg-opacity-75 p-6 border border-green-700 rounded-lg backdrop-blur-sm">
              <h2 class="text-2xl font-bold mb-2 text-green-300">Intelligent Analysis</h2>
              <p class="text-green-500">AI-powered detection of complex security flaws and logical errors that other tools miss.</p>
            </div>
            <div class="bg-gray-900 bg-opacity-75 p-6 border border-green-700 rounded-lg backdrop-blur-sm">
              <h2 class="text-2xl font-bold mb-2 text-green-300">Secure by Design</h2>
              <p class="text-green-500">Runs in a fully isolated container, ensuring your code and system remain protected.</p>
            </div>
          </div>

          <div class="mt-8">
            <p class="text-xl animate-pulse"><span class="text-green-500">></span> Send a message to begin analysis</p>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "sketch-landing-page": SketchLandingPage;
  }
}
