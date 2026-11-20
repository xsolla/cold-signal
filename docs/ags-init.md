# Delve Together — AGS initialization status

Status: AGS initialization deferred by the creator. Current development and
playtesting use local Docker containers with no AGS dependency. The historical
login attempt timed out; completing it is not required to play locally.

## User-confirmed target

- Base URL: https://gamingservices.xsolla.com
- Namespace: 368789-321899
- Client ID: 166d5726fa7a457a903b33f7e277d8de

The three settings were applied with the installed `ags config set` commands.
No client secret or access token has been stored in this project. The supplied
client's kind, permissions, and namespace membership remain unverified.

## Checklist

- [x] Project check: repository contains reusable skills and game planning
  documents. No Unreal, Unity, Godot, Roblox, or Web package marker exists in
  the repository or Delve Together project directory. Browser is the selected
  target from the interviews; the executable project is not scaffolded yet.
- [ ] Install game SDK/plugins: not installed. Select the appropriate browser
  integration while preserving the recorded GamePix SDK compatibility question.
- [ ] Set up tools: Node.js 20.11.0 and AGS CLI 0.5.4 are installed. Authentication
  is missing; the browser flow timed out.
- [ ] Connect portal: CLI target settings saved. Live verification and project
  runtime configuration are not complete.
- [ ] Configure AGS API MCP: decision/configuration pending; no IDE config edit
  has been made.
- [ ] Final summary: pending completion; do not claim initialization succeeded.

## Future resume when AGS access is available

Run `ags auth login` and complete browser sign-in. Recheck `ags auth status`
before live discovery. If browser sign-in completes but the callback still does
not arrive, the CLI's diagnostic says the IAM client must be Public and allow
`http://127.0.0.1:8080` as a redirect URI; inspect the actual client rather than
assuming that diagnosis is confirmed.

Use the user-confirmed target above instead of the prior CLI namespace. Verify
client kind and permissions before implementing API calls. Continue init from
the first unverified item, without repeating successful config writes.
