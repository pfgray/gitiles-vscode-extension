import * as assert from "assert";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
import { parseRemoteUrl } from "../../parseRemote";
import * as O from "fp-ts/Option";
import { pipe } from "fp-ts/function";
// import * as myExtension from '../../extension';

type OptionValue<T> = T extends O.Some<infer U> ? U : never;

suite("Extension Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");

  console.log(
    parseRemoteUrl("ssh://paul.gray@gerrit.instructure.com:29418/canvas-lms")
  );

  const testParseRemote =
    (remote: string) =>
    (attrs: Partial<OptionValue<ReturnType<typeof parseRemoteUrl>>>) => {
      pipe(
        parseRemoteUrl(remote),
        O.fold(
          () => assert.fail(`remote url: ${remote} not parsed`),
          (parsed) => {
            (Object.keys(attrs) as Array<keyof typeof attrs>).forEach((key) => {
              assert.deepEqual(parsed[key], attrs[key]);
            });
          }
        )
      );
    };

  test("parseRemote", () => {
    testParseRemote("ssh://paul.gray@foo.github.com:1234/canvas-lms")({
      protocol: O.some("ssh"),
      user: O.some("paul.gray"),
      domain: "foo.github.com",
      path: "/canvas-lms",
      port: O.some(1234),
    });

    testParseRemote("git@github.com:pfgray/gitiles-vscode-extension.git")({
      protocol: O.none,
      user: O.some("git"),
      domain: "github.com",
      path: "pfgray/gitiles-vscode-extension.git",
      port: O.none,
    });

    testParseRemote("https://github.com/pfgray/gitiles-vscode-extension.git")({
      protocol: O.some("https"),
      user: O.none,
      domain: "github.com",
      path: "/pfgray/gitiles-vscode-extension.git",
      port: O.none,
    });
  });
});
