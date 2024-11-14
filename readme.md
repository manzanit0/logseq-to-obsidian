# logseq-to-obsidian

A script to migrate notes from logseq to obsidian format.

## Assumptions

1. You're don't care about the directory structure of your notes too much. You
   just want things "to work".
2. You would like to be able to use both apps on the same notes from time to
   time.

## What it does

- Change logseq tags to be obsidian links.
- Change logseq TODO format to obsidian TODO format
- Change the obsidian vault config to so that obsidian integrates with logseq
  directory structure
- Convert logseq numbered lists to standard markdown numbered lists

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

## Run it

Very barebones --

```sh
# set your logseq graph as your working directory
cd you/logseq/graph

# Copy the script there
wget https://raw.githubusercontent.com/manzanit0/logseq-to-obsidian/refs/heads/master/main.ts -o main.ts

# run it
deno -A main.ts
```

## TODO

Some of these points are backwards-incompatible changes, but ultimately strive
to make the markdown consumable by any text editor, not just logseq.

- make tag conversion context-aware to avoid changing hashes in code blocks or
  logseq queries.
- Add deadline information to tasks according to the [tasks
  plugin](https://publish.obsidian.md/tasks/Introduction)
- Transform document annotation reference ids to the annotated text. 
- Format [logseq page properties](https://docs.logseq.com/#/page/properties) as
  frontmatter.
- Move [logseq block properties](https://docs.logseq.com/#/page/properties) to
  markdown frontmatter. This builds on the asumption that properties aren't
  being widely used by myself, but just ocasionally and could very well be page
  properties, not block properties.


