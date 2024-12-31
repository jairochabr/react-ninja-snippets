import * as vscode from "vscode";

const HOOK_ABBREVIATIONS = {
  ust: "useState",
  uef: "useEffect",
  ucb: "useCallback",
  urf: "useRef",
  urd: "useReducer",
  uct: "useContext",
  umo: "useMemo",
  uid: "useId",
  uts: "useTransition",
};

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

export function activate(context: vscode.ExtensionContext) {
  const abbreviationProvider = vscode.languages.registerCompletionItemProvider(
    ["typescript", "typescriptreact", "javascript", "javascriptreact"],
    {
      provideCompletionItems(document, position) {
        const wordRange = document.getWordRangeAtPosition(position);
        const word = wordRange ? document.getText(wordRange) : "";
        const triggerPosition = wordRange ? wordRange.start : position;

        const completionItems: vscode.CompletionItem[] = [];

        Object.entries(HOOK_ABBREVIATIONS).forEach(([abbr, hook]) => {
          if (abbr.startsWith(word)) {
            const item = new vscode.CompletionItem(
              abbr,
              vscode.CompletionItemKind.Snippet
            );

            // Add the full hook name to the detail field instead
            item.detail = `→ ${hook} (React Ninja Snippets)`;

            // Add detailed documentation
            item.documentation = new vscode.MarkdownString()
              .appendMarkdown(`**React Ninja Snippets**\n\n`)
              .appendMarkdown(`Fast import for \`${hook}\` from 'react'\n\n`)
              .appendMarkdown(
                `\`\`\`typescript\nimport { ${hook} } from 'react';\n\`\`\``
              );

            item.insertText = hook;
            item.filterText = abbr;
            item.sortText = `0_${abbr}`; // Ensures our snippets appear at the top

            item.command = {
              command: "react-hook-abbreviations.insertHook",
              title: `Insert ${hook}`,
              arguments: [hook, triggerPosition],
            };

            completionItems.push(item);
          }
        });

        return completionItems;
      },
    }
  );

  const insertHookCommand = vscode.commands.registerCommand(
    "react-hook-abbreviations.insertHook",
    async (hook: string, triggerPosition: vscode.Position) => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return null;
      }

      await insertHookSnippet(editor, hook, triggerPosition);
    }
  );

  context.subscriptions.push(abbreviationProvider, insertHookCommand);
}

export function deactivate() {}
