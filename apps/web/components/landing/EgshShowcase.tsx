'use client';

import { useState } from 'react';
import type { PublicSampleQuestion } from '@studyteach/contracts';

/**
 * Interactive ЕЭШ sample question. Click an option → reveal whether it
 * was right + the strand label. Encourages "try the product" feel from
 * the landing page without requiring a login.
 *
 * Anonymous + read-only: the question comes from /public/stats which is
 * already PII-scrubbed and cached.
 */
export function EgshShowcase({ question }: { question: PublicSampleQuestion }) {
  const [picked, setPicked] = useState<number | null>(null);
  const revealed = picked !== null;
  const correct = picked === question.answer_index;

  return (
    <section
      id="egsh"
      className="py-16 sm:py-20"
      style={{ background: 'var(--st-paper)' }}
      data-testid="landing-egsh-showcase"
    >
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <p
          className="text-[11px] font-bold uppercase tracking-[0.18em]"
          style={{ color: 'var(--st-brass-dark)' }}
        >
          № 05a · ЕЭШ
        </p>
        <h2
          className="mt-2 font-display font-bold leading-tight tracking-[-0.02em]"
          style={{ color: 'var(--st-soot)', fontSize: 'clamp(26px, 3.4vw, 44px)' }}
        >
          Жинхэнэ ЕЭШ материал. <span style={{ color: 'var(--st-ember)' }}>Одоо туршаад үз</span>.
        </h2>
        <p
          className="mt-3 max-w-[60ch] text-[15px] leading-relaxed"
          style={{ color: 'var(--st-ink-2)' }}
        >
          {question.year} оны {question.label_mn}-ийн нэг асуулт. Хариултаа сонгож зөв буруугаа
          шалгана уу. Платформ дотор иймэрхүү даалгавар олон зууныг туршиж, сэдвээр чинь дүн
          гаргана.
        </p>

        <div
          className="mt-8 rounded-st-md border p-5 sm:p-7"
          style={{
            background: 'var(--st-cream)',
            borderColor: 'rgba(185, 132, 56, 0.4)',
            boxShadow: 'var(--st-shadow-sm)',
          }}
        >
          <div className="flex items-center gap-2">
            <span
              className="rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.12em]"
              style={{ background: 'var(--st-soot)', color: '#D4A24C' }}
            >
              {question.label_mn} · {question.year}
            </span>
            {question.strand && (
              <span
                className="rounded-md px-2 py-0.5 text-[11px] font-semibold"
                style={{ background: 'var(--st-paper-2)', color: 'var(--st-ink-2)' }}
              >
                {question.strand}
              </span>
            )}
          </div>
          <p
            className="mt-3 font-display text-lg font-bold leading-snug sm:text-xl"
            style={{ color: 'var(--st-soot)' }}
          >
            {question.prompt}
          </p>

          <ul className="mt-5 flex flex-col gap-2" role="radiogroup" aria-label="ЕЭШ хариулт">
            {question.options.map((opt, i) => {
              const isPicked = picked === i;
              const isAnswer = i === question.answer_index;
              const showRight = revealed && isAnswer;
              const showWrong = revealed && isPicked && !isAnswer;
              const letter = String.fromCharCode(65 + i);
              return (
                <li key={i}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={isPicked}
                    onClick={() => !revealed && setPicked(i)}
                    disabled={revealed}
                    data-testid={`egsh-option-${i}`}
                    className="flex w-full items-center gap-3 rounded-st-md border px-3 py-2.5 text-left text-sm font-semibold transition-colors"
                    style={
                      showRight
                        ? {
                            background: 'var(--st-success)',
                            color: '#FBF3E2',
                            borderColor: 'var(--st-success)',
                          }
                        : showWrong
                          ? {
                              background: 'var(--st-cinnabar)',
                              color: '#FBF3E2',
                              borderColor: 'var(--st-cinnabar)',
                            }
                          : isPicked
                            ? {
                                background: 'var(--st-soot)',
                                color: '#FBF3E2',
                                borderColor: 'var(--st-soot)',
                              }
                            : {
                                background: 'var(--st-paper)',
                                color: 'var(--st-ink)',
                                borderColor: 'rgba(185, 132, 56, 0.4)',
                              }
                    }
                  >
                    <span
                      className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-[11px] font-bold"
                      style={{
                        background: revealed && isAnswer ? '#FBF3E2' : 'var(--st-paper-2)',
                        color: revealed && isAnswer ? 'var(--st-success)' : 'var(--st-ink-2)',
                        border: '1px solid rgba(185, 132, 56, 0.4)',
                      }}
                    >
                      {letter}
                    </span>
                    {opt}
                  </button>
                </li>
              );
            })}
          </ul>

          {revealed && (
            <p
              className="mt-5 text-sm font-semibold"
              role="status"
              data-testid="egsh-result"
              style={{ color: correct ? 'var(--st-success)' : 'var(--st-cinnabar)' }}
            >
              {correct
                ? '✓ Зөв. Платформ дотор иймэрхүү задаргааг бүх сэдвээр хийдэг.'
                : `✗ Зөв хариулт: ${String.fromCharCode(65 + question.answer_index)}. Алдсан сэдвээ AI Багштай задлаарай.`}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
