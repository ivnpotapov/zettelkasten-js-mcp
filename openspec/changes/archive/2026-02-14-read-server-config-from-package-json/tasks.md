# Tasks: Read Server Config from package.json

## 1. Type Definition

- [x] 1.1 Add `PackageJson` interface to `src/config/config-class.ts` with `name: string` and `version: string` fields

## 2. Package.json Import

- [x] 2.1 Add import statement for `package.json` with JSON assertion
- [x] 2.2 Apply `PackageJson` type assertion to imported value

## 3. Config Constructor Update

- [x] 3.1 Replace `serverName` assignment to use imported `pkg.name`
- [x] 3.2 Replace `serverVersion` assignment to use imported `pkg.version`
- [x] 3.3 Remove lines referencing `ZETTELKASTEN_SERVER_NAME` env var
- [x] 3.4 Remove lines referencing `ZETTELKASTEN_SERVER_VERSION` env var

## 4. Documentation Update

- [x] 4.1 Remove `ZETTELKASTEN_SERVER_NAME` from `.env.example` (not present)
- [x] 4.2 Remove `ZETTELKASTEN_SERVER_VERSION` from `.env.example` (not present)

## 5. Verification

- [x] 5.1 Build project: `npm run build`
- [x] 5.2 Run server and verify correct name/version in logs
- [x] 5.3 Run type checker: `npm run typecheck`
