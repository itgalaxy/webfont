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
