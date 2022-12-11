# Gitiles Vscode Extension

## Features:

This extension adds a "Gitiles: View file" which opens a gitiles url for the file/line the editor is focused on:

<img src="https://raw.githubusercontent.com/pfgray/gitiles-vscode-extension/main/gitiles_context_menu.png" width="250px"/>

## Settings

`gitiles.urlTemplate`: Template url to navigate to, use `${hostname}`, `${projectName}`, `${file}`, `${line}`, `${ref}` as variables.

default value:

```
https://${hostname}/plugins/gitiles/${projectName}/+/${ref}/${file}#${line}
```
