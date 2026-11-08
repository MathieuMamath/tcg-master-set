'use client';

import { useTranslations } from 'next-intl';
import { type KeyboardEvent, useEffect, useRef, useState } from 'react';
import { COINS_PER_RIGHT_ANSWER, QUIZ_ANSWERS, type QuizQuestion } from '@/game/quiz';
import type { Wallet } from '@/game/shop-dialogue';
import type { QuizResult } from '@/player/progress';
import { focusFirstChoice, moveThroughChoices, openDialog } from './menu-focus';
import { usePlayerName } from './player-name';
import { SellerPortrait } from './seller-portrait';
import { CHOICE_CLASS, TornPaper } from './shop-dialog';

type Step =
  | { kind: 'starting' }
  | { kind: 'asking'; questions: QuizQuestion[]; answers: number[] }
  | { kind: 'checking'; questions: QuizQuestion[]; answers: number[] }
  | { kind: 'done'; questions: QuizQuestion[]; answers: number[]; result: QuizResult }
  | { kind: 'alreadyDone' }
  | { kind: 'error' };

type Props = {
  // The coins after the quiz, for the counters and the save notice.
  onFinished: (wallet: Wallet) => void;
  onClose: () => void;
};

// Mamie Noisette's quiz: five questions about the village, three answers each, by a click or the
// keys 1 to 3, with no clock. Once all are answered, the server scores them and pays, once a day,
// and the quiz shows which were right.
export function QuizDialog({ onFinished, onClose }: Props) {
  const t = useTranslations('Quiz');
  const playerName = usePlayerName();
  const dialog = useRef<HTMLDialogElement>(null);
  const [step, setStep] = useState<Step>({ kind: 'starting' });
  const asked = step.kind === 'asking' ? step.answers.length : 0;

  useEffect(() => {
    openDialog(dialog.current);
    fetch('/api/quests/quiz/start', { method: 'POST' })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((answer: { hasStarted: boolean; questions?: QuizQuestion[] }) =>
        setStep(
          answer.hasStarted && answer.questions
            ? { kind: 'asking', questions: answer.questions, answers: [] }
            : { kind: 'alreadyDone' },
        ),
      )
      .catch(() => setStep({ kind: 'error' }));
  }, []);

  // Each question, and each step, puts the focus on its first choice once it is drawn.
  // biome-ignore lint/correctness/useExhaustiveDependencies: a new question or step moves the focus.
  useEffect(() => {
    const frame = requestAnimationFrame(() => dialog.current && focusFirstChoice(dialog.current));
    return () => cancelAnimationFrame(frame);
  }, [step.kind, asked]);

  const answer = (position: number) => {
    if (step.kind !== 'asking') {
      return;
    }
    const answers = [...step.answers, position];
    if (answers.length < step.questions.length) {
      setStep({ ...step, answers });
      return;
    }
    const questions = step.questions;
    setStep({ kind: 'checking', questions, answers });
    fetch('/api/quests/quiz/finish', { method: 'POST', body: JSON.stringify({ answers }) })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((result: QuizResult) => {
        onFinished(result.wallet);
        setStep({ kind: 'done', questions, answers, result });
      })
      .catch(() => setStep({ kind: 'error' }));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const digit = /^(?:Digit|Numpad)([1-9])$/.exec(event.code)?.[1];
    if (step.kind === 'asking' && digit && Number(digit) <= QUIZ_ANSWERS) {
      event.preventDefault();
      if (!event.repeat) {
        answer(Number(digit) - 1);
      }
      return;
    }
    moveThroughChoices(event);
  };

  const question = step.kind === 'asking' ? step.questions[step.answers.length] : null;
  const answerText = (id: string, index: number) =>
    t(`questions.${id}.answers.${index}` as 'questions.gaspard.answers.0');

  return (
    <dialog
      ref={dialog}
      aria-labelledby="quiz-title"
      onClose={onClose}
      onKeyDown={onKeyDown}
      className="ui-pop-in m-auto w-[min(34rem,calc(100%-1rem))] max-w-none overflow-visible bg-transparent font-game text-ui-ink backdrop:bg-ui-ink/50"
    >
      <TornPaper className="px-3 pt-4 pb-4 sm:px-5">
        <div className="flex items-center gap-3">
          <span className="block size-14 shrink-0 overflow-hidden rounded-full border-2 border-[#fbf6ea] bg-[#e7d9bc] shadow-[1px_2px_0_var(--ui-shadow)]">
            <SellerPortrait stock="binderSeller" />
          </span>
          <div>
            <h2 id="quiz-title" className="font-display text-xl">
              {t('title')}
            </h2>
            {step.kind === 'asking' && (
              <p className="text-ui-ink/70">
                {t('question', { number: step.answers.length + 1, total: step.questions.length })}
              </p>
            )}
          </div>
        </div>

        {step.kind === 'starting' && (
          <p className="mt-3">{t('howTo', { coins: COINS_PER_RIGHT_ANSWER })}</p>
        )}

        {question && (
          <div key={step.kind === 'asking' ? step.answers.length : 0} className="ui-pop-in mt-3">
            {asked === 0 && (
              <p className="mb-2 text-ui-ink/70">{t('howTo', { coins: COINS_PER_RIGHT_ANSWER })}</p>
            )}
            {/* The question on a library card. */}
            <p className="rounded-sm border-l-4 border-[#c8453a] bg-[#fbf6ea] px-3 py-2 text-xl leading-snug shadow-[2px_3px_0_var(--ui-shadow)]">
              {t(`questions.${question.id}.text` as 'questions.gaspard.text')}
            </p>
            <div className="mt-3 grid gap-2">
              {question.order.map((index, position) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => answer(position)}
                  className={`${CHOICE_CLASS} justify-start text-left`}
                >
                  <kbd className="mr-2 font-digits text-sm opacity-60 pointer-coarse:hidden">
                    {position + 1}
                  </kbd>
                  {answerText(question.id, index)}
                </button>
              ))}
            </div>
          </div>
        )}

        {step.kind === 'checking' && <p className="mt-4 text-center text-lg">…</p>}

        {step.kind === 'done' && (
          <div className="mt-3">
            <p className="text-center font-display text-2xl">
              {t('result', {
                right: step.result.checked.filter(Boolean).length,
                total: step.questions.length,
              })}
            </p>
            <ul className="mt-3 grid gap-1.5">
              {step.questions.map((asked, index) => {
                const isRight = step.result.checked[index];
                return (
                  <li
                    key={asked.id}
                    className={`rounded-sm px-3 py-1.5 ${isRight ? 'bg-[#e3f0d8]' : 'bg-[#f6dcd6]'}`}
                  >
                    <span className="font-semibold">
                      {isRight ? '✓ ' : '✗ '}
                      {t(`questions.${asked.id}.text` as 'questions.gaspard.text')}
                    </span>
                    <span className="block text-sm text-ui-ink/75">
                      {isRight ? t('right') : t('wrong', { answer: answerText(asked.id, 0) })}
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 text-lg">
              {step.result.coins > 0
                ? t('thanks', { name: playerName, coins: step.result.coins })
                : t('noCoins')}
            </p>
          </div>
        )}

        {step.kind === 'alreadyDone' && (
          <p className="mt-3 text-lg">{t('alreadyDone', { name: playerName })}</p>
        )}
        {step.kind === 'error' && <p className="mt-3 text-lg">{t('error')}</p>}

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            className={`${CHOICE_CLASS} ${step.kind === 'done' ? 'bg-ui-accent!' : ''}`}
          >
            {step.kind === 'asking' || step.kind === 'starting' ? t('stop') : t('close')}
          </button>
        </div>
      </TornPaper>
    </dialog>
  );
}
