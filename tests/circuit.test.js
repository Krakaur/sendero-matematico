import test from "node:test";
import assert from "node:assert/strict";
import { CIRCUITS, courseGeometry, coursePoint } from "../web/circuit.js";
test("All circuits have actual curvature, finite tangents and monotone arc-length parameterization in four lanes", () => {
  for (const id of Object.keys(CIRCUITS))
    for (let lane = 0; lane < 4; lane++) {
      const g = courseGeometry(id).lanes[lane],
        length = g.at(-1).distance;
      let previous = coursePoint(id, 0, lane),
        angles = [];
      for (let i = 1; i <= 1000; i++) {
        const p = coursePoint(id, i / 1000, lane);
        assert(Number.isFinite(p.x + p.y + p.angle));
        assert(p.distance > previous.distance);
        assert(Math.abs(p.distance - previous.distance - length / 1000) < 1e-8);
        assert(Math.abs(p.angle - previous.angle) < 0.04);
        previous = p;
        angles.push(p.angle);
      }
      assert(
        Math.max(...angles) - Math.min(...angles) > 0.5,
        "Course must change orientation, not just scroll",
      );
      assert.equal(coursePoint(id, 1, lane).distance, length);
      assert.deepEqual(coursePoint(id, -1, lane), coursePoint(id, 0, lane));
    }
});
test("Distinct courses and preserved lane spacing prevent overlap or lane reversal", () => {
  assert.equal(
    new Set(
      Object.keys(CIRCUITS).map((id) =>
        JSON.stringify(courseGeometry(id).points),
      ),
    ).size,
    3,
  );
  for (const id of Object.keys(CIRCUITS)) {
    const g = courseGeometry(id);
    for (let i = 0; i <= 640; i++)
      for (const [a, b] of [
        [0, 3],
        [3, 2],
        [2, 1],
      ])
        assert(
          Math.abs(
            Math.hypot(
              g.lanes[a][i].x - g.lanes[b][i].x,
              g.lanes[a][i].y - g.lanes[b][i].y,
            ) - 88,
          ) < 1e-9,
        );
  }
});
