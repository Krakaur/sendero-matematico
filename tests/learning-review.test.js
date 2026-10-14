import test from "node:test";
import assert from "node:assert/strict";
import {
  mathStrategy,
  mathSupportHTML,
  learningReviewHTML,
} from "../web/learning-review.js";
import { arithmeticOptions } from "../web/core.js";
test("New alternatives represent operation-related errors without duplicate or negative choices", () => {
  for (const trail of ["suma", "resta", "multi"])
    for (let a = 1; a <= 50; a++)
      for (let b = 1; b <= a; b++) {
        const answer =
            trail === "suma" ? a + b : trail === "resta" ? a - b : a * b,
          options = arithmeticOptions(trail, a, b, answer, () => 0.3);
        assert.equal(options.length, 4);
        assert.equal(new Set(options).size, 4);
        assert(options.includes(answer));
        assert(options.every((n) => Number.isInteger(n) && n >= 0));
        if (trail === "multi" && a > 2 && b > 2 && !(a === 3 && b === 3))
          assert(
            options
              .filter((n) => n !== answer)
              .every((n) =>
                [
                  a + b,
                  (a - 1) * b,
                  (a + 1) * b,
                  a * (b - 1),
                  a * (b + 1),
                ].includes(n),
              ),
          );
      }
});
test("Representations preserve quantities and decomposition, including zero remainder and large products", () => {
  for (let a = 1; a <= 20; a++)
    for (let b = 1; b <= 20; b++) {
      const q = { a, b, answer: a * b },
        s = mathStrategy("multi", q);
      assert.equal(a * s.split + a * (b - s.split), q.answer);
      const html = mathSupportHTML("multi", q);
      assert.equal(
        [...html.matchAll(/<i /g)].length,
        q.answer <= 100 ? q.answer : 0,
      );
      assert(html.includes(`${q.answer}`));
    }
  assert(
    mathStrategy("resta", { a: 5, b: 5, answer: 0 }).inverse.includes(
      "0 + 5 = 5",
    ),
  );
  assert(
    mathStrategy("suma", { a: 23, b: 18, answer: 41 }).relation.includes(
      "23 + 10 + 8 = 33 + 8 = 41",
    ),
  );
});
test("Post-game review includes corrected and helped items without turning them into mastery", () => {
  const q = { a: 2, b: 3, answer: 6, attempts: [5, 6], done: true },
    s = {
      trail: "multi",
      questions: [q, { a: 1, b: 3, answer: 3, attempts: [3], hint: true }],
    },
    html = learningReviewHTML(s);
  assert(html.includes("2 retos necesitaron"));
  assert(html.includes("corregido"));
  assert(html.includes("con ayuda"));
  assert(html.includes("resolución independiente"));
  const bank = learningReviewHTML({
    trail: "razonar",
    questions: [
      {
        bankId: "x",
        prompt: "<script>",
        explanation: "<img>",
        answer: 1,
        attempts: [2, 1],
      },
    ],
  });
  assert(!bank.includes("<script>"));
  assert(bank.includes("&lt;img&gt;"));
});
