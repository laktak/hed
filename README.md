# hed

hed allows you to use comments and avoid missing/trailing comma mistakes, even with configs like npm's package.json where comments are forbidden.

How does it work?

- `hed FILE.json` will convert JSON to Hjson and open it in your editor for editing
- when you are done FILE.json is updated with your changes (as pure JSON)
- any comments you added will be kept in FILE.meta
- FILE.hjson is removed to avoid conflicting edits
- the next time you run `hed FILE.json` your comments will be merged back

# Usage

```
hed, an edit tool for JSON configs. Comments are preserved outside of JSON.

Usage:
  hed [OPTIONS] FILE
  hed (-h | --help | -?)
  hed (-V | --version)
  hed --config [EDITOR]

hed allows you to use comments and avoid missing/trailing comma mistakes, even with configs like npm's package.json where comments are forbidden.
For details see https://github.com/laktak/hed

Options:
  -e        edit JSON with comments (default).
  -s        show JSON with comments.
  --config  edit the hed config.
```

For example:

```
hed package.json
```

To view the file with comments:

```
hed package.json -s
```

# Install from npm

```
npm install hed -g
```

# Set your editor

Run `hed --config` or `hed --config EDITOR`.

```
{
  # For example to use sublime:
  editor: subl -w
}
```
