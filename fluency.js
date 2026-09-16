// Protocol 1 measures visible, uninterrupted time to the FIRST response.
// Corrections, hints, navigation and old records cannot supply this measure.
export function fluency(questions) {
  const eligible = questions.filter(q => !q.bankId && q.timingProtocol === 1 &&
    !q.timingInterrupted && !q.hint && q.attempts?.length &&
    Number.isFinite(q.firstResponseMs) && q.firstResponseMs > 0);
  const ms = eligible.reduce((sum,q) => sum + q.firstResponseMs, 0);
  const correct = eligible.filter(q => q.attempts[0] === q.answer).length;
  return { n: eligible.length, excluded: questions.length - eligible.length,
    correct, ms, rate: ms ? 60000 * correct / ms : null,
    accuracy: eligible.length ? 100 * correct / eligible.length : null };
}
export function interruptTiming(q) {
  if(q && !q.attempts.length && q.timingProtocol === 1) q.timingInterrupted = true;
}
