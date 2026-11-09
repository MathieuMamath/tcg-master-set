// Mamie Noisette's quiz at the bookshop: a calm chore, once a day. Five questions about the village
// and its folk, three answers each, and no clock. Each right answer pays a few coins.
//
// The questions and the order of their answers come from a seed, the moment the quiz began, so
// that the server can find them again. The browser only sends which answer was chosen for each,
// and the server scores them and pays, once a day.

import { seededRandom } from '../seeded-random';

export const QUIZ_QUEST = 'bookshop-quiz';
export const QUIZ_LENGTH = 5;
export const QUIZ_ANSWERS = 3;
export const COINS_PER_RIGHT_ANSWER = 30;

// Room for the request to reach the server, a floor below which no one can have read the
// questions, and a ceiling past which the attempt is stale.
const MIN_SECONDS = 3;
const MAX_SECONDS = 900;

// The questions, by the key of their text. Their first answer is the right one: the order they
// are shown in is drawn.
export const QUIZ_QUESTIONS = [
  'gaspard',
  'yuzu',
  'pepin',
  'kaito',
  'berenice',
  'lucas',
  'lea',
  'mamie',
  'triplets',
  'hulotte',
  'brutus',
  'bus',
  'dalgona',
  'papy',
  'clock',
  'gustave',
] as const;
export type QuizQuestionId = (typeof QUIZ_QUESTIONS)[number];

export type QuizQuestion = {
  id: QuizQuestionId;
  // The answers in the order shown, by their index in the text: 0 is the right one.
  order: number[];
};

// The day's questions for a quiz begun with this seed: five different ones, each with its answers
// shuffled.
export function quizFor(seed: number): QuizQuestion[] {
  const random = seededRandom(seed ^ 0x9012);
  const pool = [...QUIZ_QUESTIONS];
  return Array.from({ length: QUIZ_LENGTH }, () => {
    const [id] = pool.splice(Math.floor(random() * pool.length), 1);
    const order = Array.from({ length: QUIZ_ANSWERS }, (_, index) => index);
    for (let index = order.length - 1; index > 0; index--) {
      const other = Math.floor(random() * (index + 1));
      [order[index], order[other]] = [order[other], order[index]];
    }
    return { id, order };
  });
}

export function quizSeed(startedAt: Date): number {
  return Math.floor(startedAt.getTime()) >>> 0;
}

// Which answers were right, from the positions chosen, or null if they can't be a quiz's answers.
// The request comes from the browser, so it can be anything.
export function checkAnswers(
  questions: readonly QuizQuestion[],
  answers: unknown,
): boolean[] | null {
  if (!Array.isArray(answers) || answers.length !== questions.length) {
    return null;
  }
  const checked: boolean[] = [];
  for (const [index, answer] of answers.entries()) {
    if (!Number.isInteger(answer) || answer < 0 || answer >= QUIZ_ANSWERS) {
      return null;
    }
    checked.push(questions[index].order[answer] === 0);
  }
  return checked;
}

export function quizCoins(checked: readonly boolean[]): number {
  return checked.filter(Boolean).length * COINS_PER_RIGHT_ANSWER;
}

// The quiz took long enough to have been read, and not so long that the attempt is stale.
export function canFinishQuiz(startedAt: Date | null, now: Date): boolean {
  if (!startedAt) {
    return false;
  }
  const seconds = (now.getTime() - startedAt.getTime()) / 1000;
  return seconds >= MIN_SECONDS && seconds <= MAX_SECONDS;
}
