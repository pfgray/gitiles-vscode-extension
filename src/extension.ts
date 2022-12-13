// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import { pipe } from "fp-ts/function";
import { exec } from "child_process";
import * as path from "path";
import { parseRemoteUrl } from "./parseRemote";

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

const parseURL = (url: string) =>
  pipe(
    parseRemoteUrl(url),
    TE.fromOption(() => ({ message: `Error parsing scm url: ${url}` }))
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
    TE.map((b) => b.trim()),
    TE.mapLeft((cause) => ({ message: "Error getting current branch", cause }))
  );

const parseUri = (url: string) =>
  TE.fromEither(
    E.tryCatch(
      () => vscode.Uri.parse(url, true),
      () => ({ message: `Error formatting url: ${url}` })
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
            vscode.workspace.getConfiguration("gitiles").get("remote") ||
              "origin",
            (remote) =>
              pipe(
                execTE(`git remote get-url ${remote}`, { cwd: folder.fsPath }),
                TE.mapLeft((cause) => ({
                  message: `Error executing git remote get-url ${remote}`,
                  cause,
                }))
              ),
            TE.chainW(parseURL)
          )
        ),
        TE.bindW("line", () => getActiveLineNumber),
        TE.bindW("branch", ({ folder }) => getBranch(folder.fsPath)),
        TE.bindW("commit", ({ folder }) => getHeadCommit(folder.fsPath)),
        TE.bindW("uri", ({ scmUrl, line, fileUri, branch, commit, folder }) => {
          const urlTemplate: string =
            vscode.workspace.getConfiguration("gitiles").get("urlTemplate") ||
            "";
          const url = urlTemplate
            .replace("${domain}", scmUrl.domain)
            .replace("${projectName}", vscode.workspace.name || "")
            .replace("${file}", path.relative(folder.fsPath, fileUri.fsPath))
            .replace("${branch}", branch)
            .replace("${commit}", commit)
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
