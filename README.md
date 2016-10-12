# hed

hed allows you to use comments and avoid missing/trailing comma mistakes, even with configs like npm's package.json where comments are forbidden.

hed will convert FILE to Hjson (FILE.hed.hjson) for editing. After you are done FILE is updated with your changes but the Hjson version is kept.
When you next edit FILE it merges the comments from the existing Hjson and gives you a new Hjson version for editing.

# Usage

```
hed, an edit tool for JSON configs.

Usage:
  hed FILE
  hed (-h | --help | -?)
  hed (-V | --version)
  hed --config

It allows you to use comments and avoid missing/trailing comma mistakes, even
with configs like npm's package.json where comments are forbidden.
hed will convert FILE to Hjson (FILE.hed.hjson) for editing. After you are done
FILE is updated with your changes but the Hjson version is kept.
When you next edit FILE it merges the comments from the existing Hjson and gives
you a new Hjson version for editing.

Options:
  --config  edit the hed config.
```

# Install from npm

```
npm install hed -g
```

# Set your editor

Run `hed --config`

For example to use sublime:

```
{
  editor: subl -w
}
```
