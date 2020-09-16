# jupyter-jacdac

[![Github Actions Status](https://github.com/microsoft/jupyter-jacdac/workflows/Build/badge.svg)](https://github.com/microsoft/jupyter-jacdac/actions?query=workflow%3A%22Build+package%22)

This project contains a [JACDAC](https://microsoft.github.io/jacdac-ts) extension for [Jupyter Lab](https://jupyter.org/).
The extension allows to collect data from embedded devices and push AI model back into them.

## Requirements

* JupyterLab >= 2.0

## Install

The extensions package is hosted on [NPMJS](https://www.npmjs.com/package/jupyter-jacdac).

```bash
jupyter labextension install jupyter-jacdac
```

### Uninstall

```bash
jupyter labextension uninstall jupyter-jacdac
```

## Contributing

The extension essentially loads https://microsoft.github.io/jacdac-ts and interacts with this web site via IFrame messages. The UI integration into JupyterLab is kept to an absolute minimum.

### Install

The `jlpm` command is JupyterLab's pinned version of
[yarn](https://yarnpkg.com/) that is installed with JupyterLab. You may use
`yarn` or `npm` in lieu of `jlpm` below.

```bash
# Clone the repo to your local environment
# Move to jacdac directory
# Install dependencies
jlpm
# Build Typescript source
jlpm build
# Link your development version of the extension with JupyterLab
jupyter labextension link .
# Rebuild Typescript source after making changes
jlpm build
# Rebuild JupyterLab after making any changes
jupyter lab build
```

You can watch the source directory and run JupyterLab in watch mode to watch for changes in the extension's source and automatically rebuild the extension and application.

```bash
# Watch the source directory in another terminal tab
jlpm watch
# Run jupyterlab in watch mode in one terminal tab
jupyter lab --watch
```

# Contributing

This project welcomes contributions and suggestions.  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.opensource.microsoft.com.

When you submit a pull request, a CLA bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., status check, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
