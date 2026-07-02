# Troubleshooting

Common CLI issues and how to fix them. Each entry follows the same structure: the error you see, why it happens, and steps to resolve it.

---

## Destination directory does not exist

### What error appeared

The CLI exits with code **1** and prints a message similar to:

```text
Error: Destination directory "path/to/your/fonts" does not exist. Use --dest-create (-m) to create it.
```

You may also see progress output before the error when `--verbose` is enabled, for example:

```text
Generating SVG font...
Error: Destination directory "path/to/your/fonts" does not exist. Use --dest-create (-m) to create it.
```

On older versions, the same situation could surface as a raw filesystem error instead:

```text
Error: ENOENT: no such file or directory, open 'path/to/your/fonts/webfont.woff2'
```

In those cases the process could still exit with code **0** even though no font files were written.

### Why it usually happens

- **`--dest` / `-d` points to a folder that was never created.** Webfont does not create the output directory unless you ask it to.
- **The path is relative to your current working directory.** A path that looks correct in your editor may not exist from the shell directory where you run the command.
- **A build script or CI job runs before `mkdir`.** Scripts often assume `dist/fonts` or `public/icons` already exist.
- **A typo in the path** (extra segment, wrong casing on case-sensitive filesystems, or a missing parent directory).

Font generation can finish before files are written. If the destination folder is missing, the write step fails even though earlier steps (and verbose logs) may have already run.

### Steps to try to resolve

1. **Confirm the path exists from the same directory where you run webfont.**

   ```shell
   ls -la path/to/your/fonts
   ```

   If the directory is missing, either create it yourself or use step 2.

2. **Ask webfont to create the destination directory.**

   ```shell
   webfont "src/icons/*.svg" -d path/to/your/fonts --dest-create
   ```

   Short form:

   ```shell
   webfont "src/icons/*.svg" -d path/to/your/fonts -m
   ```

3. **Create the directory manually** (useful in CI or when you want explicit control):

   ```shell
   mkdir -p path/to/your/fonts
   webfont "src/icons/*.svg" -d path/to/your/fonts
   ```

4. **Use an absolute path for `--dest`** if your script changes working directories:

   ```shell
   webfont "src/icons/*.svg" -d "$(pwd)/dist/fonts"
   ```

5. **Check write permissions** on the parent directory if creation still fails:

   ```shell
   mkdir -p path/to/your/fonts
   touch path/to/your/fonts/.write-test && rm path/to/your/fonts/.write-test
   ```

6. **When using the programmatic API**, set `destCreate: true` if the folder may not exist yet:

   ```js
   import webfont from "webfont";

   await webfont({
     files: "src/icons/*.svg",
     dest: "dist/fonts",
     destCreate: true,
   });
   ```

7. **Upgrade webfont** if you see exit code **0** with no output files and only an `ENOENT` message. Current releases fail with exit code **1** and the clearer destination error above.

If the problem persists, open an issue with the full command, your working directory, and the complete terminal output.

---

## `npm warn Unknown env config "devdir"`

### What error appeared

Every `npm` command prints a warning similar to:

```text
npm warn Unknown env config "devdir". This will stop working in the next major version of npm. See `npm help npmrc` for supported config options.
```

The command still succeeds; only the warning is noisy.

### Why it usually happens

- **Cursor (or some IDE sandboxes) inject `npm_config_devdir`** into the shell environment so node-gyp uses a sandbox cache directory.
- **npm 11.2+ warns** because `devdir` is not an official npm config key — it is a legacy node-gyp convention.
- **This repository does not set `devdir`.** The project `.npmrc` only contains `save-exact=true`.

Confirm the source in your terminal:

```shell
echo "$npm_config_devdir"
```

If the path contains `cursor-sandbox-cache` (or similar), the IDE injected it — not webfont.

### Steps to try to resolve

1. **Clear the variable for one command:**

   ```shell
   npm_config_devdir= npm test
   ```

2. **Clear it for the current shell session:**

   ```shell
   unset npm_config_devdir
   ```

3. **Cursor / VS Code integrated terminal** — this repo ships `.vscode/settings.json` with `npm_config_devdir` cleared. Open a **new** terminal or reload the window (*Developer: Reload Window*) so the setting applies. Existing terminals keep the old environment.

4. **CI and plain shells** outside Cursor are unaffected; no change is required there.

This warning does not indicate a broken install or a webfont bug.

---

## Config `files` ignored when using `--config`

### What error appeared

You pass `--config webfont.config.json` with a `files` array in the config, but webfont only processes SVG paths from the command line — or shows help when you omit positional arguments.

Example config:

```json
{
  "files": ["src/icons/a.svg", "src/icons/b.svg"],
  "dest": "dist/icons",
  "fontName": "my-icons"
}
```

**Older releases (before the fix in [#696](https://github.com/itgalaxy/webfont/pull/696)):**

```shell
webfont --config webfont.config.json -d dist/icons
# Shows help or does not pick up both files from config
```

If you also pass SVG paths on the CLI while `files` is set in the config, older releases may silently prefer CLI input only.

**After the fix ships** (upgrade required), combining both causes a clear error:

```text
Error: Cannot specify input files on the command line when `files` is set in the config file
```

### Why it usually happens

- **The CLI treated positional arguments as the only input source.** Config `files` was merged inside `webfont()`, but the CLI required at least one path on the command line before running.
- **`files` in config and CLI input are mutually exclusive by design** — use one or the other to avoid ambiguity about which globs win.

### Steps to try to resolve

1. **Upgrade webfont** to a version that includes the fix for [#2](https://github.com/itgalaxy/webfont/issues/2) (see release notes / [#696](https://github.com/itgalaxy/webfont/pull/696)). Then run **without** positional SVG arguments:

   ```shell
   webfont --config webfont.config.json -d dist/icons
   ```

2. **Until you upgrade**, pass all globs on the command line and use the config only for other options (`fontName`, `dest`, `formats`, etc.):

   ```shell
   webfont "src/icons/a.svg" "src/icons/b.svg" --config webfont.config.json -d dist/icons
   ```

   Ensure the config file does **not** contain a `files` key in this mode.

3. **Programmatic API** — pass `files` directly (config discovery still merges other keys):

   ```js
   import { webfont } from "webfont";

   await webfont({
     files: ["src/icons/a.svg", "src/icons/b.svg"],
     configFile: "webfont.config.json",
   });
   ```

4. **Do not mix** CLI positional paths with `files` in the config after upgrading — pick one source of truth.

If the problem persists after upgrading, open an issue with your config file, full command, and webfont version (`webfont --version` or `npm ls webfont`).
