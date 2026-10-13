import assert from "node:assert/strict";
import test from "node:test";
import { artSearchScore, matchesArtSearch, normalizeArtSearch } from "../app/art-search.ts";

test("Vietnamese search ignores accents, case, and extra whitespace", () => {
  assert.equal(normalizeArtSearch("  ĐỒNG QUÊ  "), "dong que");
  assert.ok(matchesArtSearch(["Mèo điềm tĩnh"], "  MEO  diem "));
  assert.ok(matchesArtSearch(["Cà phê"], "ca phe"));
  assert.ok(matchesArtSearch(["Cà phê"], "Ca\u0300 phe\u0302"));
});

test("all query words must match, across names, categories, and keywords", () => {
  const fields = ["Chó Husky phi hành gia", "Thú cưng vui nhộn", "3D · Vũ trụ"];
  assert.ok(matchesArtSearch(fields, "thu cung husky 3d"));
  assert.ok(matchesArtSearch(fields, "vu tru cho"));
  assert.equal(matchesArtSearch(fields, "husky picnic"), false);
});

test("blank search matches everything and unknown words return no match", () => {
  assert.ok(matchesArtSearch(["Thỏ làm vườn"], "   "));
  assert.equal(matchesArtSearch(["Thỏ làm vườn"], "khong-ton-tai"), false);
});

test("dog keywords rank ahead of market and gaming substring matches", () => {
  const dog = artSearchScore(["Chó Husky phi hành gia", "Thú cưng"], "cho", ["chó", "cún", "dog"]);
  assert.ok(dog > artSearchScore(["Sạp chợ tươi vui"], "cho"));
  assert.ok(dog > artSearchScore(["Thùng game", "Trò chơi"], "cho"));
  assert.ok(artSearchScore(["Bảo vệ nghỉ giữa ca"], "cun", ["chó", "cún"]) > 0);
});

test("ranking retains accent-insensitive multiword filtering", () => {
  assert.ok(artSearchScore(["Chó Husky", "3D · Vũ trụ"], "husky vu tru") > 0);
  assert.equal(artSearchScore(["Chó Husky", "3D · Vũ trụ"], "husky picnic"), 0);
  assert.ok(artSearchScore(["Chó Husky"], "hus") > 0);
});
