# Gitiles Vscode Extension

## Features:

This extension adds a "Gitiles: View file" which opens a gitiles url for the file/line the editor is focused on:

<img src="https://raw.githubusercontent.com/pfgray/gitiles-vscode-extension/main/gitiles_context_menu.png" width="250px"/>

## Settings

`gitiles.urlTemplate`: Template url to navigate to, use `${domain}`, `${projectName}`, `${file}`, `${line}`, `${branch}`, `${commit}` as variables.

default value:

```
https://${domain}/plugins/gitiles/${projectName}/+/${ref}/${file}#${line}
```

## Manual installation

Compile the project:

```sh
yarn install
yarn package
```

Copy the project into your vscode extension directory (typically `~/.vscode/extensions`):

```sh
cp -R ./* ~/.vscode/extensions/gitiles/
```

## Installation via [home-manager](https://github.com/nix-community/home-manager) ([nix](https://github.com/NixOS/nix)):

```nix
{
  inputs = {
    gitiles.url = "github:pfgray/gitiles";
  };

  outputs = { gitiles, ... }: {
    homeConfigurations.base = home-manager.lib.homeManagerConfiguration {
      modules = [

        {
          config.programs.vscode = {
            extensions = [
              gitiles.packages.${system}.vscode-extension
            ];
          };
        }

      ];
    };
  };
}
```
