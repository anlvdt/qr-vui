import assert from "node:assert/strict";
import test from "node:test";
import { contrastOnWhite, darkArtInk } from "../app/qr-contrast.ts";

test("automatic ink stays dark on pastel and neutral illustrations", () => {
  for (const color of [[205, 183, 247], [245, 191, 215], [176, 224, 212], [255, 255, 255], [128, 128, 128], [255, 210, 45]]) {
    assert.ok(contrastOnWhite(darkArtInk(color)) >= 12, `Weak ink for ${color}`);
  }
});

test("darkening lavender retains its hue rather than turning gray", () => {
  const ink = darkArtInk([205, 183, 247]);
  const channels = [1, 3, 5].map((index) => parseInt(ink.slice(index, index + 2), 16));
  assert.ok(channels[2] > channels[0] && channels[0] > channels[1]);
  assert.ok(Math.abs(channels[0] / channels[2] - 205 / 247) < 0.03);
});

test("already dark ink is preserved", () => {
  assert.equal(darkArtInk([23, 23, 23]), "#171717");
  assert.equal(darkArtInk([0, 0, 0]), "#000000");
  assert.equal(contrastOnWhite("#ffffff"), 1);
  assert.equal(contrastOnWhite("#000000"), 21);
});
