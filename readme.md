# logseq-to-obsidian

A script to migrate notes from logseq to obsidian format.

## Run it

Very barebones:

```sh
curl https://raw.githubusercontent.com/manzanit0/logseq-to-obsidian/refs/heads/master/main.ts \
| deno run --allow-read --allow-write - --in your/logseq/graph --out your/obsidian/vault
```

### Options

- `--force`: deletes the output directory before writing, if it exists.

## What it does

- Change logseq tags to be obsidian links.
- Change logseq TODO format to obsidian TODO format
- Change the obsidian vault config to so that obsidian integrates with logseq
  directory structure
- Convert logseq numbered lists to standard markdown numbered lists
- Format [logseq page properties](https://docs.logseq.com/#/page/properties) as
  frontmatter.
- Nests nested logseq pages in actual directories and updates all relative path references.
- Removs logseq `collapsed:: true` properties.
- Removes `:LOGBOOK:` blocks.

## Caveats

- Logseq tasks are richer than core obsidian tasks. For instance, obsidian has
  no concept of deadlines. This metadata is lost.
- In logseq tags and links work the same way, in obsidian they don't. All
  logseq tags are transformed to obsidian links. This may or may not be up your
  alley.

> [!NOTE]
> I open sourced this for the sake of sharing something that worked for me and
> maybe save somebody some time. However, this handles the usecases that were
> relevant for my notes. Make sure to double check if it does for yours.

## TODO

Some of these points are backwards-incompatible changes, but ultimately strive
to make the markdown consumable by any text editor, not just logseq.

- make tag conversion context-aware to avoid changing hashes in code blocks or
  logseq queries.
- Add deadline information to tasks according to the [tasks
  plugin](https://publish.obsidian.md/tasks/Introduction)
- Transform document annotation reference ids to the annotated text. 
- Move [logseq block properties](https://docs.logseq.com/#/page/properties) to
  markdown frontmatter. This builds on the asumption that properties aren't
  being widely used by myself, but just ocasionally and could very well be page
  properties, not block properties.

