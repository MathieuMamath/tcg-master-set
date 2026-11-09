import { describe, expect, test } from 'vitest';
import {
  COINS_PER_RIGHT_ANSWER,
  canFinishQuiz,
  checkAnswers,
  QUIZ_ANSWERS,
  QUIZ_LENGTH,
  quizCoins,
  quizFor,
} from './quiz';

const SEED = 20261108;

describe('a quiz', () => {
  test('asks five different questions, each with its answers shuffled, from the seed', () => {
    const questions = quizFor(SEED);
    expect(questions).toHaveLength(QUIZ_LENGTH);
    expect(new Set(questions.map(({ id }) => id)).size).toBe(QUIZ_LENGTH);
    expect(questions).toEqual(quizFor(SEED));
    for (const { order } of questions) {
      expect([...order].sort()).toEqual([0, 1, 2]);
    }
  });

  test('scores the positions chosen, the right one being where answer 0 was shown', () => {
    const questions = quizFor(SEED);
    const allRight = questions.map(({ order }) => order.indexOf(0));
    expect(checkAnswers(questions, allRight)).toEqual(questions.map(() => true));
    expect(quizCoins(checkAnswers(questions, allRight) ?? [])).toBe(
      QUIZ_LENGTH * COINS_PER_RIGHT_ANSWER,
    );
    const oneWrong = [...allRight];
    oneWrong[0] = (oneWrong[0] + 1) % QUIZ_ANSWERS;
    expect(checkAnswers(questions, oneWrong)?.filter(Boolean)).toHaveLength(QUIZ_LENGTH - 1);
  });

  test('refuses answers that are not a quiz’s', () => {
    const questions = quizFor(SEED);
    expect(checkAnswers(questions, 'nope')).toBeNull();
    expect(checkAnswers(questions, [0, 1])).toBeNull();
    expect(checkAnswers(questions, [0, 1, 2, 3, 0])).toBeNull();
  });

  test('takes a moment to read, and goes stale', () => {
    const startedAt = new Date(0);
    expect(canFinishQuiz(null, new Date(10_000))).toBe(false);
    expect(canFinishQuiz(startedAt, new Date(1000))).toBe(false);
    expect(canFinishQuiz(startedAt, new Date(30_000))).toBe(true);
    expect(canFinishQuiz(startedAt, new Date(3_600_000))).toBe(false);
  });
});
