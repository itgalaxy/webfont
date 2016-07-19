#!/usr/bin/env node

import fs from 'fs';
import meow from 'meow';
import mkdirp from 'mkdirp';
import path from 'path';
import standalone from './standalone';

const cli = meow(`
    Usage
        $ webfont <path|glob> ... [options]
    Options
        General:
            -f, --font-name            The font family name you want, default: "webfont".
            -h, --help                 Output usage information.
            -v, --version              Output the version number.
            --formats                  Only this formats generate.
            --dest                     Destination for generated fonts.
            --src-css-template         Path to custom template.
            --css-template-class-name  Class name in css template.
            --css-template-font-path   Font path in css template.
            --css-template-font-name   Font name in css template.
            --dest-css-template        Destination for generated css template.
            --verbose                  Tell me everything!.

        For "svgicons2svgfont":
            -i, --font-id              The font id you want, default as "--font-name".
            -t, --style                The font style you want.
            -g, --weight               The font weight you want.
            -w, --fixed-width          Creates a monospace font of the width of the largest input icon.
            -c, --center-horizontally  Calculate the bounds of a glyph and center it horizontally.
            -n, --normalize            Normalize icons by scaling them to the height of the highest icon.
            -e, --height               The outputted font height [MAX(icons.height)].
            -r, --round                Setup the SVG path rounding [10e12].
            -d, --descent              The font descent [0].
            -a, --ascent               The font ascent [height - descent].
            -s, --start-unicode        The start unicode codepoint for unprefixed files [0xEA01].
            -p, --prepend-unicode      Prefix files with their automatically allocated unicode codepoint.
            -m, --metadata             Content of the metadata tag.
`, {
    string: [
        'font-name',
        'dest',
        'src-css-template',
        'css-template-class-name',
        'css-template-font-path',
        'css-template-font-name',
        'dest-css-template',
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
        return Object.assign({}, {
            config: cli.flags
        }, {
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

        if (!options.config.dest) {
            return Promise.reject('Require `--dest` options');
        }

        if (options.config.destCssTemplate) {
            options.config.css = true;

            const extname = path.extname(options.config.destCssTemplate);

            options.config.cssFormat = extname ? extname.slice(1, extname.length) : 'css';
        }

        return standalone(options)
            .then((result) => Promise.resolve(result))
            .then((result) => {
                result.config = Object.assign({}, options.config);

                return Promise.resolve(result);
            });
    })
    .then((result) => {
        const fontName = result.config.fontName;

        return new Promise((resolve, reject) => {
            mkdirp(path.resolve(result.config.dest), (error) => {
                if (error) {
                    return reject(error);
                }

                return resolve();
            });
        })
            .then(() => {
                const cssTemplateDirectory = path.resolve(path.dirname(result.config.destCssTemplate));

                return new Promise((resolve, reject) => {
                    mkdirp(cssTemplateDirectory, (error) => {
                        if (error) {
                            return reject(error);
                        }

                        return resolve();
                    });
                });
            })
            .then(() => Promise.all(Object.keys(result).map((type) => {
                if (type === 'config') {
                    return Promise.resolve();
                }

                const content = result[type];
                let destFilename = null;

                if (type !== 'css') {
                    destFilename = path.resolve(path.join(result.config.dest, `${fontName}.${type}`));
                } else {
                    destFilename = path.resolve(result.config.destCssTemplate);
                }

                return new Promise((resolve, reject) => {
                    fs.writeFile(destFilename, content, (error) => {
                        if (error) {
                            return reject(new Error(error));
                        }

                        return resolve();
                    });
                });
            })))
            .then(() => Promise.resolve(result));
    })
    .catch((error) => {
        console.log(error.stack); // eslint-disable-line no-console
        process.exit(error.code || 1); // eslint-disable-line no-process-exit
    });
