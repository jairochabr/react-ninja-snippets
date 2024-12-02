import * as vscode from "vscode";

// Definição das abreviações e seus hooks correspondentes
const HOOK_ABBREVIATIONS = {
  ust: "useState", // ou ust
  uef: "useEffect",
  ucb: "useCallback",
  urf: "useRef",
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
    if (newHooks.length === 0) return;

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
  // Remove o texto trigger
  const position = editor.selection.active;
  await editor.edit((editBuilder) => {
    editBuilder.delete(new vscode.Range(triggerStartPosition, position));
  });

  // Adiciona o import apropriado
  await checkAndAddImport(editor, [hookType]);

  // Insere o snippet apropriado
  let snippet: vscode.SnippetString;
  switch (hookType) {
    case "useState":
      snippet = new vscode.SnippetString(
        "const [${1:}, set${1/(.*)/${1:/capitalize}/}] = useState(${0})"
      );
      break;
    case "useEffect":
      snippet = new vscode.SnippetString(
        "useEffect(() => {\n\t${1:// efeito}\n\treturn () => {\n\t\t${2:// cleanup}\n\t}\n}, [${0}])"
      );
      break;
    case "useCallback":
      snippet = new vscode.SnippetString(
        "const ${1:memoizedCallback} = useCallback(\n\t(${2:params}) => {\n\t\t${3:// função}\n\t},\n\t[${0}]\n)"
      );
      break;
    case "useRef":
      snippet = new vscode.SnippetString("const ${1:ref} = useRef(${0})");
      break;
    default:
      return;
  }

  await editor.insertSnippet(snippet);
}

export function activate(context: vscode.ExtensionContext) {
  // Provider para nomes completos e abreviações
  const fullNameAndAbbreviationProvider =
    vscode.languages.registerCompletionItemProvider(
      ["typescript", "typescriptreact", "javascript", "javascriptreact"],
      {
        provideCompletionItems(document, position) {
          const wordRange = document.getWordRangeAtPosition(position);
          const word = wordRange ? document.getText(wordRange) : "";
          const triggerPosition = wordRange ? wordRange.start : position;

          const completionItems: vscode.CompletionItem[] = [];

          // Adiciona completions para nomes completos
          if ("useState".startsWith(word)) {
            completionItems.push(
              createCompletionItem(
                "useState",
                "React useState hook",
                triggerPosition
              )
            );
          }
          if ("useEffect".startsWith(word)) {
            completionItems.push(
              createCompletionItem(
                "useEffect",
                "React useEffect hook",
                triggerPosition
              )
            );
          }
          if ("useCallback".startsWith(word)) {
            completionItems.push(
              createCompletionItem(
                "useCallback",
                "React useCallback hook",
                triggerPosition
              )
            );
          }

          // Adiciona completions para abreviações
          Object.entries(HOOK_ABBREVIATIONS).forEach(([abbr, hook]) => {
            if (abbr.startsWith(word)) {
              const item = createCompletionItem(
                hook,
                `React ${hook} hook (${abbr})`,
                triggerPosition
              );
              item.filterText = abbr;
              completionItems.push(item);
            }
          });

          return completionItems;
        },
      }
    );

  function createCompletionItem(
    hook: string,
    detail: string,
    triggerPosition: vscode.Position
  ): vscode.CompletionItem {
    const item = new vscode.CompletionItem(
      hook,
      vscode.CompletionItemKind.Snippet
    );
    item.detail = detail;
    item.command = {
      command: "react-ninja-snippets.insertHook",
      title: `Insert ${hook}`,
      arguments: [hook, triggerPosition],
    };
    return item;
  }

  // Comando para inserir o hook
  const insertHookCommand = vscode.commands.registerCommand(
    "react-ninja-snippets.insertHook",
    async (hook: string, triggerPosition: vscode.Position) => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      await insertHookSnippet(editor, hook, triggerPosition);
    }
  );

  context.subscriptions.push(
    fullNameAndAbbreviationProvider,
    insertHookCommand
  );

  vscode.window.showInformationMessage(
    "React Ninja Snippets ativado com sucesso!"
  );
}

export function deactivate() {
  vscode.window.showInformationMessage("React Ninja Snippets desativado.");
}
