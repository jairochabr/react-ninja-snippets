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
  // React Component
  rfc: "ReactFunctionComponent",
  // rcd: ,
  // rcb: ,
  // rac: ,
};

function getComponentNameFromFile(document: vscode.TextDocument): string {
  const fileName = path.basename(document.fileName);
  const nameWithoutExtension = fileName.replace(/\.(tsx|jsx|ts|js)$/, '');
  
  return nameWithoutExtension
    .split(/[-_.]/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
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

async function insertComponentSnippet(
  editor: vscode.TextEditor,
  triggerStartPosition: vscode.Position
) {
  const componentName = getComponentNameFromFile(editor.document);
  const position = editor.selection.active;
  
  await editor.edit((editBuilder) => {
    editBuilder.delete(new vscode.Range(triggerStartPosition, position));
  });

  const snippet = new vscode.SnippetString(
    `const ${componentName} = () => {\n` +
    `\treturn (\n` +
    '\t\t${0}\n' +
    `\t)\n` +
    `}\n\n` +
    `export default ${componentName}`
  );

  await editor.insertSnippet(snippet);
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

export function activate(context: vscode.ExtensionContext) {
  const abbreviationProvider = vscode.languages.registerCompletionItemProvider(
    ["typescript", "typescriptreact", "javascript", "javascriptreact"],
    {
      provideCompletionItems(document, position) {
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
            item.documentation = new vscode.MarkdownString()
              .appendMarkdown(`**React Ninja Snippets**\n\n`);

            if (snippet === "ReactFunctionComponent") {
              const componentName = getComponentNameFromFile(document);
              item.documentation
                .appendMarkdown(`Creates a React Function Component named '${componentName}'\n\n`)
                .appendMarkdown("```typescript\n")
                .appendMarkdown(`const ${componentName} = () => {\n`)
                .appendMarkdown("  return (\n")
                .appendMarkdown("  )\n")
                .appendMarkdown("}\n\n")
                .appendMarkdown(`export default ${componentName}\n`)
                .appendMarkdown("```");

              item.command = {
                command: "react-ninja-snippets.insertComponent",
                title: "Insert React Component",
                arguments: [triggerPosition],
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
      },
    }
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
    async (triggerPosition: vscode.Position) => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return null;
      }

      await insertComponentSnippet(editor, triggerPosition);
    }
  );

  context.subscriptions.push(
    abbreviationProvider,
    insertHookCommand,
    insertComponentCommand
  );
}

export function deactivate() {}