#!/usr/bin/env node

import fs from 'fs';
import meow from 'meow';
import path from 'path';
import standalone from './standalone';

const cli = meow(`
    Usage
        $ webfont <path|glob> ... [options]
    Options
        General:
            -f, --font-name [value]      The font family name you want, default: "webfont".
            -h, --help                   Output usage information.
            -v, --version                Output the version number.
            --dest                       Destination for generated fonts.
            --formats                    Only this formats generate.
            --css                        Generate css template (get build-in template).
            --css-template               Path to custom template.
            --css-template-options       Accept "className", "fontPath", "fontName".
            --css-template-dest          Destination for generated css template.
            --verbose                    Tell me everything!.

        For "svgicons2svgfont":
            -i, --font-id [value]        The font id you want, default as "--font-name".
            -t, --style [value]          The font style you want.
            -g, --weight [value]         The font weight you want.
            -w, --fixed-width            Creates a monospace font of the width of the largest input icon.
            -c, --center-horizontally    Calculate the bounds of a glyph and center it horizontally.
            -n, --normalize              Normalize icons by scaling them to the height of the highest icon.
            -e, --height [value]         The outputted font height [MAX(icons.height)].
            -r, --round [value]          Setup the SVG path rounding [10e12].
            -d, --descent [value]        The font descent [0].
            -a, --ascent [value]         The font ascent [height - descent].
            -s, --start-unicode [value]  The start unicode codepoint for unprefixed files [0xEA01].
            -p, --prepend-unicode        Prefix files with their automatically allocated unicode codepoint.
            -m, --metadata               Content of the metadata tag.
`, {
    string: [
        'font-name',
        'dest',
        'css-template',
        'css-template-dest',
        'font-id',
        'style',
        'weight',
        'height',
        'round',
        'descent',
        'ascent',
        'start-unicode'
    ],
    boolean: [
        'css',
        'help',
        'version',
        'verbose',
        'fixed-width',
        'center-horizontally',
        'normalize',
        'prepend-unicode'
    ],
    /* eslint-disable id-length */
    alias: {
        h: 'help',
        v: 'version',
        f: 'font-name',
        i: 'font-id',
        t: 'style',
        g: 'weight',
        w: 'fixed-width',
        c: 'center-horizontally',
        n: 'normalize',
        e: 'height',
        r: 'round',
        d: 'descent',
        a: 'ascent',
        s: 'start-unicode',
        p: 'prepend-unicode',
        m: 'metadata'
    }
    /* eslint-enable id-length */
});

Promise.resolve().then(() => {
    if (cli.input.length) {
        return Object.assign({}, cli.flags, {
            files: cli.input
        });
    }

    // For stdin
    return Promise.resolve({});
})
    .then((options) => {
        if (!options.files) {
            cli.showHelp();
        }

        if (!options.dest) {
            return Promise.reject('Require `--dest` options');
        }

        if (options.css && !options.cssTemplateDest) {
            return Promise.reject('Require `--css-template-dest` when `css` passed');
        }

        return standalone(options)
            .then((result) => Promise.resolve(result))
            .then((result) => {
                result.options = Object.assign({}, result.options, options);

                return Promise.resolve(result);
            });
    })
    .then((result) => {
        const dest = result.options.dest;

        return Promise.all(Object.keys(result).map((type) => {
            if (type === 'options') {
                return Promise.resolve();
            }

            const content = result[type];

            return new Promise((resolve, reject) => {
                const destFilename = path.join(dest, `${result.options.fontName}.${type}`);

                fs.writeFile(destFilename, content, (error) => {
                    if (error) {
                        return reject(new Error(error));
                    }

                    return resolve();
                });
            });
        }))
            .then(() => Promise.resolve(result));
    })
    .catch((error) => {
        console.log(error.stack); // eslint-disable-line no-console
        process.exit(error.code || 1); // eslint-disable-line no-process-exit
    });
