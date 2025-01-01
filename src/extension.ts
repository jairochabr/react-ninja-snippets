import * as vscode from "vscode";
import * as path from "path";

const SNIPPETS = {
  // React Hooks
  ust: "useState",
  uef: "useEffect",
  ucb: "useCallback",
  urf: "useRef",
  urd: "useReducer",
  uct: "useContext",
  umo: "useMemo",
  uid: "useId",
  uts: "useTransition",
  // React Components
  rfca: "ReactFunctionArrow",
  rfc: "ReactFunctionExport",
  rfcd: "ReactFunctionExportDefault",
  rfce: "ReactExportArrow",
};

type ComponentType =
  | "arrow"
  | "function"
  | "functionExportDefault"
  | "exportArrow";

function getComponentNameFromFile(document: vscode.TextDocument): string {
  const fileName = path.basename(document.fileName);
  const nameWithoutExtension = fileName.replace(/\.(tsx|jsx|ts|js)$/, "");

  return nameWithoutExtension
    .split(/[-_.]/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

async function insertComponentSnippet(
  editor: vscode.TextEditor,
  triggerStartPosition: vscode.Position,
  type: ComponentType
) {
  const componentName = getComponentNameFromFile(editor.document);
  const position = editor.selection.active;

  await editor.edit((editBuilder) => {
    editBuilder.delete(new vscode.Range(triggerStartPosition, position));
  });

  let snippet: vscode.SnippetString;

  switch (type) {
    case "arrow":
      snippet = new vscode.SnippetString(
        `const ${componentName} = () => {\n` +
          `\treturn (\n` +
          "\t\t${0}\n" +
          `\t)\n` +
          `}\n\n` +
          `export default ${componentName}`
      );
      break;

    case "function":
      snippet = new vscode.SnippetString(
        `export function ${componentName}() {\n` +
          `\treturn (\n` +
          "\t\t${0}\n" +
          `\t)\n` +
          `}`
      );
      break;

    case "functionExportDefault":
      snippet = new vscode.SnippetString(
        `export default function ${componentName}() {\n` +
          `\treturn (\n` +
          "\t\t${0}\n" +
          `\t)\n` +
          `}`
      );
      break;

    case "exportArrow":
      snippet = new vscode.SnippetString(
        `export const ${componentName} = () => {\n` +
          `\treturn (\n` +
          "\t\t${0}\n" +
          `\t)\n` +
          `}`
      );
      break;
  }

  await editor.insertSnippet(snippet);
}

async function checkAndAddImport(editor: vscode.TextEditor, hooks: string[]) {
  const document = editor.document;
  const fullText = document.getText();
  let existingImports: string[] = [];

  const importMatch = fullText.match(
    /import\s*{([^}]+)}\s*from\s*['"]react['"]/
  );
  if (importMatch) {
    existingImports = importMatch[1].split(",").map((hook) => hook.trim());

    const newHooks = hooks.filter((hook) => !existingImports.includes(hook));
    if (newHooks.length === 0) {
      return null;
    }

    await editor.edit((editBuilder) => {
      const oldImport = importMatch[0];
      const allHooks = [...existingImports, ...newHooks].join(", ");
      const newImport = `import { ${allHooks} } from 'react'`;
      const startPos = fullText.indexOf(oldImport);
      const endPos = startPos + oldImport.length;

      editBuilder.replace(
        new vscode.Range(
          document.positionAt(startPos),
          document.positionAt(endPos)
        ),
        newImport
      );
    });
  } else {
    await editor.edit((editBuilder) => {
      const importText = `import { ${hooks.join(", ")} } from 'react';\n\n`;
      editBuilder.insert(new vscode.Position(0, 0), importText);
    });
  }
}

async function insertHookSnippet(
  editor: vscode.TextEditor,
  hookType: string,
  triggerStartPosition: vscode.Position
) {
  const position = editor.selection.active;
  await editor.edit((editBuilder) => {
    editBuilder.delete(new vscode.Range(triggerStartPosition, position));
  });

  await checkAndAddImport(editor, [hookType]);

  let snippet: vscode.SnippetString;
  switch (hookType) {
    case "useState":
      snippet = new vscode.SnippetString(
        "const [${1:}, set${1/(.*)/${1:/capitalize}/}] = useState(${0})"
      );
      break;
    case "useEffect":
      snippet = new vscode.SnippetString(
        "useEffect(() => {\n\t${1:}\n}, [${0}])"
      );
      break;
    case "useCallback":
      snippet = new vscode.SnippetString(
        "useCallback((${1:params}) => {\n\t${2:}\n}, [${0}])"
      );
      break;
    case "useRef":
      snippet = new vscode.SnippetString("const ${1:ref} = useRef(${0})");
      break;
    case "useReducer":
      snippet = new vscode.SnippetString(
        "const [${1:state}, ${2:dispatch}] = useReducer(${0})"
      );
      break;
    case "useContext":
      snippet = new vscode.SnippetString("const ${1:value} = useContext(${0})");
      break;
    case "useMemo":
      snippet = new vscode.SnippetString(
        "useMemo(() => {\n\t${1:}\n}, [${0}])"
      );
      break;
    case "useId":
      snippet = new vscode.SnippetString("const ${1:id} = useId(${0})");
      break;
    case "useTransition":
      snippet = new vscode.SnippetString(
        "const [${1:isPending}, ${2:startTransition}] = useTransition(${0})"
      );
      break;
    default:
      return;
  }

  await editor.insertSnippet(snippet);
}

function getSnippetPreview(snippet: string, componentName: string): string {
  switch (snippet) {
    case "ReactFunctionArrow":
      return [
        `const ${componentName} = () => {`,
        "  return (",
        "  )",
        "}",
        "",
        `export default ${componentName}`,
      ].join("\n");

    case "ReactFunctionExport":
      return [
        `export function ${componentName}() {`,
        "  return (",
        "  )",
        "}",
      ].join("\n");

    case "ReactFunctionExportDefault":
      return [
        `export default function ${componentName}() {`,
        "  return (",
        "  )",
        "}",
      ].join("\n");

    case "ReactFunctionOnly":
      return [
        `function ${componentName}() {`,
        "  return (",
        "  )",
        "}",
        "",
        `export default ${componentName}`,
      ].join("\n");

    case "ReactExportArrow":
      return [
        `export const ${componentName} = () => {`,
        "  return (",
        "  )",
        "}",
      ].join("\n");

    default:
      return "";
  }
}

function getComponentType(snippet: string): ComponentType {
  switch (snippet) {
    case "ReactFunctionArrow":
      return "arrow";
    case "ReactFunctionExport":
      return "function";
    case "ReactFunctionExportDefault":
      return "functionExportDefault";
    case "ReactExportArrow":
      return "exportArrow";
    default:
      return "arrow";
  }
}

function provideCompletionItems(
  document: vscode.TextDocument,
  position: vscode.Position
) {
  const wordRange = document.getWordRangeAtPosition(position);
  const word = wordRange ? document.getText(wordRange) : "";
  const triggerPosition = wordRange ? wordRange.start : position;

  const completionItems: vscode.CompletionItem[] = [];

  Object.entries(SNIPPETS).forEach(([abbr, snippet]) => {
    if (abbr.startsWith(word)) {
      const item = new vscode.CompletionItem(
        abbr,
        vscode.CompletionItemKind.Snippet
      );

      item.detail = `→ ${snippet} (React Ninja Snippets)`;
      item.documentation = new vscode.MarkdownString().appendMarkdown(
        `**React Ninja Snippets**\n\n`
      );

      if (snippet.startsWith("React")) {
        const componentName = getComponentNameFromFile(document);
        const preview = getSnippetPreview(snippet, componentName);

        item.documentation
          .appendMarkdown(
            `Creates a React Component named '${componentName}'\n\n`
          )
          .appendMarkdown("```typescript\n")
          .appendMarkdown(preview)
          .appendMarkdown("\n```");

        item.command = {
          command: "react-ninja-snippets.insertComponent",
          title: "Insert React Component",
          arguments: [triggerPosition, getComponentType(snippet)],
        };
      } else {
        item.documentation
          .appendMarkdown(`Fast import for \`${snippet}\` from 'react'\n\n`)
          .appendMarkdown(
            `\`\`\`typescript\nimport { ${snippet} } from 'react';\n\`\`\``
          );

        item.command = {
          command: "react-ninja-snippets.insertHook",
          title: `Insert ${snippet}`,
          arguments: [snippet, triggerPosition],
        };
      }

      item.insertText = snippet;
      item.filterText = abbr;
      item.sortText = `0_${abbr}`;

      completionItems.push(item);
    }
  });

  return completionItems;
}

export function activate(context: vscode.ExtensionContext) {
  const abbreviationProvider = vscode.languages.registerCompletionItemProvider(
    ["typescript", "typescriptreact", "javascript", "javascriptreact"],
    { provideCompletionItems }
  );

  const insertHookCommand = vscode.commands.registerCommand(
    "react-ninja-snippets.insertHook",
    async (hook: string, triggerPosition: vscode.Position) => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return null;
      }
      await insertHookSnippet(editor, hook, triggerPosition);
    }
  );

  const insertComponentCommand = vscode.commands.registerCommand(
    "react-ninja-snippets.insertComponent",
    async (triggerPosition: vscode.Position, type: ComponentType) => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return null;
      }
      await insertComponentSnippet(editor, triggerPosition, type);
    }
  );

  context.subscriptions.push(
    abbreviationProvider,
    insertHookCommand,
    insertComponentCommand
  );
}

export function deactivate() {}
