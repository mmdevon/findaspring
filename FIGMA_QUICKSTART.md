# Figma Quickstart

This project now includes a Figma structure and the Codex-side MCP configuration has been created at `~/.codex/config.toml`.

## 1) Add your Figma OAuth token
In the shell where you launch Codex:

```bash
export FIGMA_OAUTH_TOKEN="<your_token_here>"
```

To persist it for future sessions:

```bash
echo 'export FIGMA_OAUTH_TOKEN="<your_token_here>"' >> ~/.zshrc
```

Then restart your terminal/Codex app.

## 2) Verify MCP is active
Ask Codex to list MCP resources/tools. If configured correctly, Figma MCP tools should be available.

## 3) Create your Figma files
Create two files in Figma:
- `Find A Spring - Product`
- `Find A Spring - Design System`

Then apply page structure from:
- `FIGMA_STRUCTURE.md`

## 4) Start with MVP frames
Create required MVP frames listed in:
- `UI_REQUIREMENTS.md`

Style and system rules are in:
- `DESIGN_SPEC.md`

## 5) Share a Figma link
Once your first frame exists, share the frame URL. Codex can then fetch design context/screenshots through MCP and help implement with parity.
