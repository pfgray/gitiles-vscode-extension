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

  vscode-extension = vscode-utils.buildVscodeExtension rec {

    name = "gititles";
    src = "${build.out}/libexec/gitiles/deps/gitiles"; # todo: src should be the output directory I think?
    # Same as "Unique Identifier" on the extension's web page.
    # For the moment, only serve as unique extension dir.
    vscodeExtPublisher = "pfgray";
    vscodeExtName = "gitiles";
    vscodeExtUniqueId = "${vscodeExtPublisher}.${vscodeExtName}";
    version = "0.0.1";

    nativeBuildInputs = [yarn];

  };
}