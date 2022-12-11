{ vscode-utils, yarn, mkYarnPackage }: rec {

  build = mkYarnPackage {
    name = "gitiles";
    src = ./.;
    packageJSON = ./package.json;
    yarnLock = ./yarn.lock;
    buildPhase = ''
      yarn package
    '';
  };

  vscode-extension = vscode-utils.buildVscodeExtension {

    name = "gititles";
    src = "${build.out}/libexec/gitiles/deps/gitiles"; # todo: src should be the output directory I think?
    # Same as "Unique Identifier" on the extension's web page.
    # For the moment, only serve as unique extension dir.
    vscodeExtUniqueId = "pfgray.gitiles";

    nativeBuildInputs = [yarn];

  };
}