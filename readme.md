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
