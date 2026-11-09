// The calm chores: Léa's dusting, Pépin's watering, Mamie Noisette's quiz and Pinceau's puzzle.

import type { Wallet } from '@/game/cards/shop-dialogue';
import {
  canFinishPuzzle,
  checkMoves,
  mixedBoard,
  PUZZLE_QUEST,
  puzzleCoins,
  puzzleSeed,
} from '@/game/quests/painter-puzzle';
import { canFinishWatering, WATERING_QUEST, WATERING_REWARD } from '@/game/quests/park-watering';
import { canFinishQuest, canStartQuest, GRANDMA_QUEST, QUEST_REWARD } from '@/game/quests/quests';
import {
  canFinishQuiz,
  checkAnswers,
  QUIZ_QUEST,
  type QuizQuestion,
  quizCoins,
  quizFor,
  quizSeed,
} from '@/game/quests/quiz';
import {
  finishScoredChore,
  finishTimedQuest,
  startQuestAttempt,
  startSeededChore,
} from './attempts';

export function startGrandmaQuest(userId: string): Promise<{ hasStarted: boolean }> {
  return startQuestAttempt(userId, GRANDMA_QUEST);
}

export function finishGrandmaQuest(
  userId: string,
): Promise<{ isRewarded: boolean; wallet: Wallet }> {
  return finishTimedQuest(userId, GRANDMA_QUEST, QUEST_REWARD, canFinishQuest);
}

export function startWateringQuest(userId: string): Promise<{ hasStarted: boolean }> {
  return startQuestAttempt(userId, WATERING_QUEST);
}

// Mamie Noisette's quiz begins: its questions come from the moment it began, sent to the browser
// without which answer is right.
export function startQuiz(
  userId: string,
): Promise<{ hasStarted: false } | { hasStarted: true; questions: QuizQuestion[] }> {
  return startSeededChore(userId, QUIZ_QUEST, (startedAt) => ({
    questions: quizFor(quizSeed(startedAt)),
  }));
}

export type QuizResult = {
  // Which answers were right, in the order of the questions.
  checked: boolean[];
  coins: number;
  wallet: Wallet;
};

// The quiz is scored from the answers chosen, and paid once a day, by its right answers. Null when
// no quiz is under way, or when the answers can't be its.
export function finishQuiz(userId: string, answers: unknown): Promise<QuizResult | null> {
  return finishScoredChore(userId, QUIZ_QUEST, (startedAt, now) => {
    const checked = canFinishQuiz(startedAt, now)
      ? checkAnswers(quizFor(quizSeed(startedAt)), answers)
      : null;
    return checked
      ? { checked, coins: quizCoins(checked), points: checked.filter(Boolean).length }
      : null;
  });
}

// Pinceau's puzzle begins: his painting, mixed up from the moment it began.
export function startPuzzle(
  userId: string,
): Promise<{ hasStarted: false } | { hasStarted: true; board: number[] }> {
  return startSeededChore(userId, PUZZLE_QUEST, (startedAt) => ({
    board: mixedBoard(puzzleSeed(startedAt)),
  }));
}

export type PuzzleResult = {
  // How many moves finished it.
  checked: number;
  coins: number;
  wallet: Wallet;
};

// The puzzle is played again from its moves, and paid once a day if they finish the painting,
// more when they are few. Null when no puzzle is under way, or when the moves can't finish it.
export function finishPuzzle(userId: string, moves: unknown): Promise<PuzzleResult | null> {
  return finishScoredChore(userId, PUZZLE_QUEST, (startedAt, now) => {
    const count = checkMoves(mixedBoard(puzzleSeed(startedAt)), moves);
    return count !== null && canFinishPuzzle(startedAt, now, count)
      ? { checked: count, coins: puzzleCoins(count), points: count }
      : null;
  });
}

// Pépin's flower beds, watered in the browser: paid once a day if the time adds up.
export function finishWateringQuest(
  userId: string,
): Promise<{ isRewarded: boolean; wallet: Wallet }> {
  return finishTimedQuest(
    userId,
    WATERING_QUEST,
    WATERING_REWARD,
    (attempt, now) => canStartQuest(attempt, now) && canFinishWatering(attempt.startedAt, now),
  );
}
