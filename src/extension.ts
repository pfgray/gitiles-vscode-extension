// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import { pipe } from "fp-ts/function";
import { exec } from "child_process";
import * as path from "path";

const execTE = TE.taskify<string, { cwd: string }, string, string>(exec as any);

const getWorkspaceFolderFromFileUri = (fileUri: vscode.Uri) =>
  TE.fromNullableK({
    message: `Unable to get workspace path from uri: ${fileUri.toString()}`,
  })(() => {
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(fileUri);
    return workspaceFolder?.uri;
  })();

const getActiveLineNumber = TE.fromIO(() =>
  O.fromNullable(vscode.window.activeTextEditor?.selection?.active?.line)
);

const valueIsUri = (u: unknown) =>
  pipe(
    u,
    TE.of,
    TE.filterOrElse(isUri, () => ({
      message: "First callback of command was not a Uri",
    }))
  );

const isUri = (u: unknown): u is vscode.Uri => {
  return u instanceof vscode.Uri;
};

const parseURL = TE.fromEitherK(
  E.tryCatchK(
    (url: string) => new URL(url),
    () => ({ message: "Error parsing scm url" })
  )
);

const getHeadCommit = (cwd: string) =>
  pipe(
    execTE("git rev-parse HEAD", { cwd }),
    TE.mapLeft((cause) => ({ message: "Error getting head commit", cause })),
    TE.map((a) => a.trim())
  );

const getBranch = (cwd: string) =>
  pipe(
    execTE("git rev-parse --abbrev-ref HEAD", { cwd }),
    TE.mapLeft((cause) => ({ message: "Error getting current branch", cause })),
    TE.map((branch) => (branch === "HEAD" ? O.none : O.some(branch))),
    TE.map(O.map((b) => `refs/heads/${b}`.trim()))
  );

const parseUri = TE.fromEitherK(
  E.tryCatchK(
    (url: string) => vscode.Uri.parse(url),
    () => ({ message: "Error parsing url" })
  )
);

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    "gitiles.openWeb",
    (fileUri: unknown) => {
      pipe(
        fileUri,
        TE.of,
        TE.filterOrElse(isUri, () => ({
          message: "First callback of command was not a Uri",
        })),
        TE.bindTo("fileUri"),
        TE.bindW("folder", ({ fileUri }) =>
          getWorkspaceFolderFromFileUri(fileUri)
        ),
        TE.bindW("scmUrl", ({ folder }) =>
          pipe(
            execTE("git remote get-url origin", { cwd: folder.fsPath }),
            TE.mapLeft((cause) => ({
              message: `Error executing git remote get-url origin`,
              cause,
            })),
            TE.chainW(parseURL)
          )
        ),
        TE.bindW("line", () => getActiveLineNumber),
        TE.bindW("ref", ({ folder }) =>
          pipe(
            getBranch(folder.fsPath),
            TE.chainW(
              O.foldW(
                () => getHeadCommit(folder.fsPath),
                (branch) => TE.of(branch)
              )
            )
          )
        ),
        TE.bindW("uri", ({ scmUrl, line, fileUri, ref, folder }) => {
          const urlTemplate: string =
            vscode.workspace.getConfiguration("gitiles").get("urlTemplate") ||
            "";
          const url = urlTemplate
            .replace("${hostname}", scmUrl.hostname)
            .replace("${projectName}", vscode.workspace.name || "")
            .replace("${file}", path.relative(folder.fsPath, fileUri.fsPath))
            .replace("${ref}", ref)
            .replace(
              "${line}",
              pipe(
                line,
                O.map((a) => a.toString()),
                O.getOrElse(() => "")
              )
            );

          return parseUri(url);
        }),
        TE.chainIOK(({ uri }) => () => {
          vscode.env.openExternal(uri);
        })
      )().then(
        E.fold(
          (err) => {
            vscode.window.showErrorMessage(err.message);
          },
          (success) => {}
        )
      );
    }
  );

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
