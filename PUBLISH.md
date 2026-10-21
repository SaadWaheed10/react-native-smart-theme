# Publishing checklist

1. Update version in root `package.json` (semver).
2. Update `CHANGELOG.md`.
3. Run locally:

```bash
npm test
npm run build
npx tsc --noEmit
```

4. Dry-run the tarball:

```bash
npm pack --dry-run
```

5. Publish:

```bash
npm login
npm publish --access public
```

6. Tag the release:

```bash
git tag v0.1.0
git push origin v0.1.0
```

## Notes

- `prepare` runs `bob build` on install from git.
- `prepublishOnly` runs build + tests before npm publish.
- Keep optional peers optional — do not add them as hard dependencies.
