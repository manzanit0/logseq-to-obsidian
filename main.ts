import { copy, existsSync, walk } from "jsr:@std/fs";
import { parseArgs } from "jsr:@std/cli/parse-args";

// logseq supports "TODO/DOING/DONE" syntax for TODOs, however obsidian only
// supports conventional markdown "[ ]".
//
// Uncovered scenarios
// 1. logseq also supports adding deadlines through specific syntax, i.e. "DEADLINE: <2022-11-08 Tue 15:00>"
export function replaceTODOs(text: string) {
  return text.replaceAll("- TODO", "- [ ]")
    .replaceAll("- DOING", "- [ ]")
    .replaceAll("- DONE", "- [x]");
}

// logseq supports "#", "#[[]]" and "[[]]" as links, however obsidian only supports "[[]]".
// ref: https://forum.obsidian.md/t/a-guide-on-links-vs-tags-in-obsidian/28231
//
// Uncovered scenarios:
// 1. "#k8s/#helm" gets mapped to "[[k8s/#helm]]"
// 2. "(#k8s or #helm)" gets mapped to "(#k8s or [[helm]])"
export function replaceTagsForLinks(text: string) {
  let copy = "";
  let migrating = false;

  for (let i = 0; i < text.length; i++) {
    if (text[i] === "#") {
      // if the previous char is non-white, then it's probably a URL.
      // NOTE: this provides false positives, i.e. phrases with parentheses:
      // (#lemon or #lime)
      if (i > 0 && text[i - 1] !== " ") {
        copy += text[i];
        continue;
      }

      // if the next space is another hash or a space, it's probably markdown heading syntax`.
      if (text[i + 1] === "#" || text[i + 1] === " ") {
        copy += text[i];
        continue;
      }

      // if it's a logseq query, keep it.
      if (text[i + 1] === "+") {
        copy += text[i];
        continue;
      }

      // if it's a ref with brackets, just remove the hash.
      if (text[i + 1] === "[" && text[i + 2] === "[") {
        continue;
      }

      // remove hash and wrap word in square brackets
      if (migrating == false) {
        copy += "[[";
        migrating = true;
      }
    } else {
      if (migrating) {
        if (
          // line breaks or spacing characters
          text[i] !== " " && text[i] !== "\n" && text[i] !== "\t" &&
          // punctuation marks
          text[i] !== "," && text[i] !== "." && text[i] !== ";" &&
          text[i] !== ":" &&
          text[i] !== "?" && text[i] !== "!" &&
          text[i] !== "/" && text[i] !== "\\"
        ) {
          copy += text[i];
        } else if (
          (text[i] === "." || text[i] === "/") && text[i + 1] !== " "
        ) {
          // avoid splitting something like #google.com or #something/other
          // NOTE: this provides false positives like #helm/#k8s
          copy += text[i];
        } else {
          copy += "]]";
          copy += text[i];
          migrating = false;
        }
      } else {
        copy += text[i];
      }
    }
  }

  return copy;
}

export function replaceNumberedLists(text: string) {
  const lines = text.split("\n");
  let counter = 0;

  const logseqNumberingAnnotation = "logseq.order-list-type:: number";

  // First filter out the metadata lines and keep track of which lines should be numbered
  const processedLines = lines
    .filter((line) => !line.includes(logseqNumberingAnnotation))
    .map((line) => {
      const nextLine = lines[lines.indexOf(line) + 1];

      const isListItem = line.trim().startsWith("-");
      const isNumbered = nextLine?.includes(logseqNumberingAnnotation);

      if (isListItem && isNumbered) {
        counter++;
        return line.replace(/^(\s*)-/, `$1${counter}.`);
      } else {
        counter = 0;
      }

      return line;
    });

  return processedLines.join("\n");
}

export function replacePageProperties(text: string) {
  const lines = text.split("\n");
  const properties: string[] = [];
  const content: string[] = [];
  let processingProperties = true;

  for (const line of lines) {
    if (processingProperties) {
      // Skip empty lines at the start
      if (line.trim() === "") {
        continue;
      }

      // If we hit a non-property line, we're done with properties
      if (!line.includes("::")) {
        processingProperties = false;
        content.push(line);
        continue;
      }

      // Convert property to YAML format
      const [key, value] = line.split("::");
      properties.push(`${key.trim()}: ${value.trim()}`);
    } else {
      content.push(line);
    }
  }

  // Only add frontmatter if we found properties
  if (properties.length > 0) {
    return `---\n${properties.join("\n")}\n---\n\n${content.join("\n")}`;
  }

  return text;
}

async function updateConfigForLogseqStructure(filepath: string) {
  const text = await Deno.readTextFile(filepath);
  const config = JSON.parse(text);

  const updatedConfig = {
    ...config,
    // Instead of changing the directory strucuture, simply modify obsidian config
    // to use logseq-native directory strucuture.
    // One added benefit of this is that we can circle back to logseq ocasionally
    // and it'll read our notes.
    newFileLocation: "folder",
    newFileFolderPath: "pages",
    attachmentFolderPath: "asset",
    // We don't want to show logseq backups and .edn configs in obsidian search.
    userIgnoreFilters: ["logseq/"],
  };

  const updatedText = JSON.stringify(updatedConfig, null, 2);
  if (text !== updatedText) {
    await Deno.writeTextFile(filepath, updatedText);
    console.log("updated", filepath);
  }
}

async function run() {
  const flags = parseArgs(Deno.args, {
    string: ["in", "out"],
    default: { in: "." },
  });

  const input = flags.in;
  const output = flags.out;
  if (!output) {
    throw "provide --out for now";
  }

  // validate that input EXISTS
  if (!existsSync(input)) {
    console.log(`${input} doesn't exist. Provide a valid input path.`);
    Deno.exit(1);
  }

  if (existsSync(output)) {
    console.log(
      `${output} already exists. Provide a different path to copy the logseq graph.`,
    );
    Deno.exit(1);
  }

  await copy(input, output, { preserveTimestamps: true });
  console.log(`copied logseq graph to ${output}`);

  for await (const walkEntry of walk(output)) {
    const type = walkEntry.isSymlink
      ? "symlink"
      : walkEntry.isFile
      ? "file"
      : "directory";

    // We only care about the markdown bits right now.
    if (type !== "file" || !walkEntry.path.includes(".md")) {
      continue;
    }

    const original = await Deno.readTextFile(walkEntry.path);

    const withTODOs = replaceTODOs(original);
    if (withTODOs !== original) {
      console.log("updated TODOs for", walkEntry.path);
    }

    const withLinks = replaceTagsForLinks(withTODOs);
    if (withLinks !== withTODOs) {
      console.log("updated links for", walkEntry.path);
    }

    const withNumberedLists = replaceNumberedLists(withLinks);
    if (withLinks !== withNumberedLists) {
      console.log("updated numbered lists for", walkEntry.path);
    }

    const withPageProperties = replacePageProperties(withNumberedLists);
    if (withPageProperties !== withNumberedLists) {
      console.log("updated page properties for", walkEntry.path);
    }

    await Deno.writeTextFile(walkEntry.path, withLinks);
  }

  if (existsSync(".obsidian/app.json")) {
    await updateConfigForLogseqStructure(".obsidian/app.json");
  }
}

if (import.meta.main) {
  run();
}
