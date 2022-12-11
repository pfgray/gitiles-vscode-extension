{
  description = "Interop team scripts";

  inputs = {
    flake-utils.url = "github:numtide/flake-utils";
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-22.05";
  };

  outputs = { self, nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (
      system:
        let
          pkgs = nixpkgs.legacyPackages."${system}";
          gitiles = pkgs.callPackage ./default.nix {};
        in {
          packages = {
            vscode-extension = gitiles.vscode-extension;
            build = gitiles.build;
          };
        }
    );
}
