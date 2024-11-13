import { describe, it } from "jsr:@std/testing/bdd";
import { expect } from "jsr:@std/expect";
import { replaceTagsForLinks, replaceTODOs } from "./main.ts";

describe("replaceTODOs", () => {
  it("replaces a single TODO for standard markdown syntax", () => {
    const result = replaceTODOs(`- TODO foo bar`);
    expect(result).toBe(`- [ ] foo bar`);
  });

  it("replaces a single DOING for standard markdown syntax", () => {
    const result = replaceTODOs(`- DOING foo bar`);
    expect(result).toBe(`- [ ] foo bar`);
  });

  it("replaces a single DONE for standard markdown syntax", () => {
    const result = replaceTODOs(`- DONE foo bar`);
    expect(result).toBe(`- [x] foo bar`);
  });

  it("replaces multiple DONE for standard markdown syntax", () => {
    const result = replaceTODOs(`
      - DONE foo
      - DONE bar
      - DONE baz
    `);

    const want = `
      - [x] foo
      - [x] bar
      - [x] baz
    `;

    expect(result).toBe(want);
  });

  it("replaces multiple mixed statuses for standard markdown syntax", () => {
    const result = replaceTODOs(`
      - DONE foo
      - TODO bar
      - DONE baz
      - DOING rop
    `);

    const want = `
      - [x] foo
      - [ ] bar
      - [x] baz
      - [ ] rop
    `;

    expect(result).toBe(want);
  });

  it("replaces nested mixed statuses for standard markdown syntax", () => {
    const result = replaceTODOs(`
      - DONE foo
        - TODO bar
          - DONE baz
        - DOING rop
    `);

    const want = `
      - [x] foo
        - [ ] bar
          - [x] baz
        - [ ] rop
    `;

    expect(result).toBe(want);
  });
});

describe("replaceTagsForLinks", () => {
  it("tags without a line ending break", () => {
    const result = replaceTagsForLinks(`#foo`);
    expect(result).toBe(`[[foo`);
  });

  it("replaces a logseq tag for an obsidian link", () => {
    const result = replaceTagsForLinks(`#foo `);
    expect(result).toBe(`[[foo]] `);
  });

  it("replaces a complex logseq tag for an obsidian link", () => {
    const result = replaceTagsForLinks(`#[[foo]] `);
    expect(result).toBe(`[[foo]] `);
  });

  it("leaves the hash untouched if it's led by non-white characters", () => {
    const result = replaceTagsForLinks(`foobar#foo `);
    expect(result).toBe(`foobar#foo `);
  });

  it("leaves the hash untouched if it's led by non-white characters", () => {
    const result = replaceTagsForLinks(`foobar#foo `);
    expect(result).toBe(`foobar#foo `);
  });

  it("leaves the hash untouched if the next charactar is a whitespace", () => {
    const result = replaceTagsForLinks(`# foo `);
    expect(result).toBe(`# foo `);
  });

  it("leaves the hash untouched if the next charactar is another hash", () => {
    const result = replaceTagsForLinks(`## foo `);
    expect(result).toBe(`## foo `);

    const result2 = replaceTagsForLinks(`##foo `);
    expect(result2).toBe(`##foo `);
  });

  it("understand nested tags", () => {
    const result = replaceTagsForLinks(`#foo/bar `);
    expect(result).toBe(`[[foo/bar]] `);
  });

  it("understand tags with dots", () => {
    const result = replaceTagsForLinks(`#google.com `);
    expect(result).toBe(`[[google.com]] `);
  });

  [",", ";", ":", "?", "!", "\\"].forEach((x) => {
    it(`understand tags separated by ${x}`, () => {
      const result = replaceTagsForLinks(`#foo${x} #bar `);
      expect(result).toBe(`[[foo]]${x} [[bar]] `);
    });

    it(`doesn't understand tags separated by ${x} without the proper whitespace`, () => {
      const result = replaceTagsForLinks(`#foo${x}#bar `);
      expect(result).toBe(`[[foo]]${x}#bar `);
    });
  });
});
