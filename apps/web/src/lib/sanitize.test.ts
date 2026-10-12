import { test } from "node:test";
import assert from "node:assert/strict";
import { safeUrl, sanitizeHtml } from "./sanitize.ts";

test("keeps allowed formatting and Arabic text", () => {
  const html = "<h2>عنوان</h2><p>نص <strong>عريض</strong> و<em>مائل</em></p><ul><li>أ</li></ul>";
  assert.equal(sanitizeHtml(html), html);
});

test("removes scripts, styles, iframes and event handlers", () => {
  assert.equal(sanitizeHtml('<p onclick="x()">hi<script>alert(1)</script></p><style>p{}</style><iframe src="//evil"></iframe>'), "<p>hi</p>");
  assert.equal(sanitizeHtml('<img src=x onerror="alert(1)"><p style="color:red">t</p>'), "<p>t</p>");
  assert.equal(sanitizeHtml("<svg><script>alert(1)</script></svg>ok"), "ok");
});

test("neutralises javascript: and data: links, including obfuscated ones", () => {
  assert.equal(sanitizeHtml('<a href="javascript:alert(1)">x</a>'), "<a>x</a>");
  assert.equal(sanitizeHtml('<a href="java&#x09;script:alert(1)">x</a>'), "<a>x</a>");
  assert.equal(sanitizeHtml('<a href=" JaVaScRiPt:alert(1)">x</a>'), "<a>x</a>");
  assert.equal(sanitizeHtml('<a href="data:text/html,<b>">x</a>'), "<a>x</a>");
  assert.equal(safeUrl("//evil.example"), null);
});

test("external links get rel + target; internal links don't", () => {
  assert.equal(sanitizeHtml('<a href="https://example.com">e</a>'), '<a href="https://example.com" target="_blank" rel="noopener noreferrer nofollow">e</a>');
  assert.equal(sanitizeHtml('<a href="/ar/contact">c</a>'), '<a href="/ar/contact">c</a>');
});

test("escapes stray markup and closes unbalanced tags", () => {
  assert.equal(sanitizeHtml("<p>1 < 2 & 3 > 2"), "<p>1 &lt; 2 &amp; 3 &gt; 2</p>");
  assert.equal(sanitizeHtml("<p><strong>x</p>"), "<p><strong>x</strong></p>");
  assert.equal(sanitizeHtml('"><script>alert(1)</script>'), '"&gt;');
  assert.equal(sanitizeHtml("<!-- c --><p>a</p>"), "<p>a</p>");
});
