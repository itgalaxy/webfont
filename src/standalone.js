import defaultMetadataProvider from 'svgicons2svgfont/src/metadata';
import fileSorter from 'svgicons2svgfont/src/filesorter';
import fs from 'fs';
import globby from 'globby';
import nunjucks from 'nunjucks';
import path from 'path';
import svg2ttf from 'svg2ttf';
import svgicons2svgfont from 'svgicons2svgfont';
import ttf2eot from 'ttf2eot';
import ttf2woff from 'ttf2woff';
import ttf2woff2 from 'ttf2woff2';

function svgIcons2svgFontFn(files, options, glyphs = []) {
    const fontStream = svgicons2svgfont(options);
    const metadataProvider = options.metadataProvider || defaultMetadataProvider({
        startUnicode: options.startUnicode,
        prependUnicode: options.prependUnicode
    });

    const sortedFiles = files.sort((fileA, fileB) => fileSorter(fileA, fileB));

    const ret = {
        svg: ''
    };

    return Promise.all(sortedFiles.map((srcPath) => new Promise((resolve, reject) => {
        metadataProvider(srcPath, (error, metadata) => {
            if (error) {
                return reject(new Error(error));
            }

            const glyph = fs.createReadStream(srcPath);

            glyph.metadata = metadata;
            fontStream.write(glyph);

            glyphs.push(metadata);

            return resolve(glyph);
        });
    })))
        .then(() => {
            fontStream.end();

            return new Promise((resolve, reject) => {
                fontStream
                    .on('error', (error) => reject(new Error(error)))
                    .on('data', (data) => {
                        ret.svg += data;
                    })
                    .on('end', () => resolve(ret));
            });
        });
}

function svg2ttfFn(result, options) {
    return new Promise((resolve) => {
        result.ttf = svg2ttf(result.svg, options.ttf);

        return resolve(result);
    });
}

function ttf2eotFn(result) {
    return new Promise((resolve) => {
        result.eot = ttf2eot(result.ttf.buffer);

        return resolve(result);
    });
}

function ttf2woffFn(result, options) {
    return new Promise((resolve) => {
        result.woff = ttf2woff(result.ttf.buffer, options);

        return resolve(result);
    });
}

function ttf2woff2Fn(result, options) {
    return new Promise((resolve) => {
        result.woff2 = ttf2woff2(result.ttf.buffer, options);

        return resolve(result);
    });
}

export default function ({
    files,
    opts
} = {}) {
    if (!files) {
        return Promise.reject(new Error('You must pass stylelint a `files` glob'));
    }

    const options = Object.assign({}, {
        fontName: 'webfont',
        formats: [
            'svg',
            'ttf',
            'eot',
            'woff',
            'woff2'
        ],
        css: false,
        // Add support specify css or scss or less
        cssTemplate: null,
        cssTemplateFormat: 'css',
        cssTemplateOptions: {
            className: null,
            fontPath: './',
            fontName: null
        },
        formatOptions: {
            ttf: {
                copyright: null,
                ts: Math.round(Date.now() / 1000)
            }
        },
        metadataProvider: null,
        fontId: null,
        fontStyle: '',
        fontWeight: '',
        fixedWidth: false,
        centerHorizontally: false,
        normalize: false,
        fontHeight: null,
        round: 10e12,
        descent: 0,
        ascent: undefined, // eslint-disable-line
        startUnicode: 0xEA01,
        prependUnicode: false,
        metadata: null,
        log: console.log, // eslint-disable-line
    }, opts);

    if (!options.verbose) {
        options.log = () => {}; // eslint-disable-line
    }

    if (options.fontId) {
        options.fontId = options.fontName;
    }

    const glyphs = [];

    return globby([].concat(files))
        .then((foundFiles) => {
            const filteredFiles = foundFiles.filter((foundFile) => path.extname(foundFile) === '.svg');

            if (filteredFiles.length === 0) {
                return Promise.reject(new Error('Files glob patterns specified did not match any files'));
            }

            return Promise.resolve(filteredFiles);
        })
        .then((foundFiles) => svgIcons2svgFontFn(foundFiles, options, glyphs))
        .then((result) => svg2ttfFn(result, options))
        // maybe add ttfautohint
        .then((result) => {
            if (options.formats.indexOf('eot') === -1) {
                return Promise.resolve(result);
            }

            return ttf2eotFn(result);
        })
        .then((result) => {
            if (options.formats.indexOf('woff') === -1) {
                return Promise.resolve(result);
            }

            return ttf2woffFn(result, options);
        })
        .then((result) => {
            if (options.formats.indexOf('woff2') === -1) {
                return Promise.resolve(result);
            }

            return ttf2woff2Fn(result, options);
        })
        .then((result) => {
            if (!options.css) {
                return Promise.resolve(result);
            }

            if (!options.cssTemplate) {
                nunjucks.configure(__dirname);

                options.cssTemplate = path.join(__dirname, `templates/template.${options.cssTemplateFormat}.tpl`);
            }

            if (!options.cssTemplateOptions.className) {
                options.cssTemplateOptions.className = options.fontName;
            }

            if (!options.cssTemplateOptions.fontName) {
                options.cssTemplateOptions.fontName = options.fontName;
            }

            const nunjucksOptions = Object.assign(
                {},
                options.cssTemplateOptions,
                {
                    glyphs
                },
                options
            );

            result.css = nunjucks.render(path.resolve(options.cssTemplate), nunjucksOptions);

            return result;
        })
        .then((result) => {
            if (options.formats.indexOf('svg') === -1) {
                delete result.svg;
            }

            if (options.formats.indexOf('ttf') === -1) {
                delete result.ttf;
            }

            return Promise.resolve(result);
        })
        .catch((error) => {
            throw error;
        });
}
