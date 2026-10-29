# Hype Doc CLI

`hype` is the command line tool for [Hype Doc](https://myhypedoc.com). Log your wins from the terminal and read them back.

This repository hosts the release binaries. The source lives in the Hype Doc monorepo.

## Install

```sh
brew install myhypedoc/tap/hype
```

Or with the install script:

```sh
curl -fsSL https://docs.myhypedoc.com/install.sh | sh
```

You can also download a binary for macOS or Linux from [Releases](https://github.com/myhypedoc/cli/releases).

## Use

```sh
hype auth login
hype log "Shipped the new dashboard" --space work
```

See the [CLI documentation](https://docs.myhypedoc.com/cli/) for every command.

## Moving from the npm package

Version 2 is a native binary and no longer needs Node.js. Uninstall the old package with `npm uninstall -g @hypedoc/cli`, then install with one of the options above. Your config file carries over.

## Help

Questions or bugs: [open an issue](https://github.com/myhypedoc/cli/issues) or email hello@myhypedoc.com.
