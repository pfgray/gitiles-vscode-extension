import * as s from "parser-ts/string";
import * as c from "parser-ts/char";
import * as P from "parser-ts/Parser";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";

import * as S from "parser-ts/Stream";
import { pipe } from "fp-ts/lib/function";

const protocol = pipe(
  s.oneOf(A.array)(["https", "http", "ssh", "git", "file"]),
  P.chainFirst(() => s.string("://"))
);

const domain = pipe(
  c.alphanum,
  P.alt(() => c.oneOf("ßàÁâãóôþüúðæåïçèõöÿýòäœêëìíøùîûñé")),
  P.alt(() => c.char(".")),
  P.many,
  P.map((a) => a.join(""))
);

const port = s.int;

const remoteUrl = pipe(
  P.optional(protocol),
  P.bindTo("protocol"),
  P.bind("user", () =>
    pipe(
      P.takeUntil((s: string) => s === "@"),
      P.map((a) => a.join("")),
      P.chainFirst(() => c.char("@")),
      P.optional
    )
  ),
  P.bind("domain", ({ user }) => {
    return domain;
  }),
  P.bind("port", () => {
    return pipe(
      c.char(":"),
      P.chain(() => port),
      P.optional
    );
  }),
  P.bind("path", ({ port }) => {
    port;
    return pipe(
      // scp-like urls have a colon before the path
      // like git@github.com:pfgray/gitiles-vscode-extension.git
      P.optional(c.char(":")),
      P.chain(() => s.notSpaces)
    );
  })
);

export const parseRemoteUrl = (url: string) =>
  pipe(
    url.split(""),
    S.stream,
    remoteUrl,
    O.fromEither,
    O.map((url) => url.value)
  );

console.log(
  pipe(
    parseRemoteUrl("ssh://paul.gray@gerrit.instructure.com:29418/canvas-lms"),
    O.map((p) => {
      console.log(p.port);
      return p;
    })
  )
);

// git@github.com:pfgray/gitiles-vscode-extension.git
