import isEot from 'is-eot';
import isSvg from 'is-svg';
import isTtf from 'is-ttf';
import isWoff from 'is-woff';
import isWoff2 from 'is-woff2';
import path from 'path';
import standalone from '../standalone';
import test from 'ava';

const fixturesPath = path.join(__dirname, 'fixtures');

test('should throw error if `files` not passed', (t) => {
    t.throws(standalone(), 'You must pass webfont a `files` glob');
});

test('should throw error `files glob patterns specified did not match any files` if not found files', (t) => {
    t.throws(standalone({
        files: `${fixturesPath}/not-found-svg-icons/**/*`
    }), 'Files glob patterns specified did not match any files');
});

test('should generate all fonts', (t) => {
    t.plan(5);

    return standalone({
        files: `${fixturesPath}/svg-icons/**/*`
    }).then((result) => {
        t.true(isSvg(result.svg));
        t.true(isTtf(result.ttf));
        t.true(isEot(result.eot));
        t.true(isWoff(result.woff));
        t.true(isWoff2(result.woff2));

        return result;
    });
});

test('should generate only `svg`, `ttf` and `eot` fonts', (t) => {
    t.plan(5);

    return standalone({
        files: `${fixturesPath}/svg-icons/**/*`,
        formats: ['svg', 'ttf', 'eot']
    }).then((result) => {
        t.true(isSvg(result.svg));
        t.true(isTtf(result.ttf));
        t.true(isEot(result.eot));
        t.true(typeof result.woff === 'undefined');
        t.true(typeof result.woff2 === 'undefined');

        return result;
    });
});

test('should generate only `woff2` font', (t) => {
    t.plan(5);

    return standalone({
        files: `${fixturesPath}/svg-icons/**/*`,
        formats: ['woff2']
    }).then((result) => {
        t.true(typeof result.svg === 'undefined');
        t.true(typeof result.ttf === 'undefined');
        t.true(typeof result.eot === 'undefined');
        t.true(typeof result.woff === 'undefined');
        t.true(isWoff2(result.woff2));

        return result;
    });
});

test('should generate all fonts with build-in template', (t) => {
    t.plan(8);

    return standalone({
        files: `${fixturesPath}/svg-icons/**/*`,
        template: 'css'
    }).then((result) => {
        t.true(isSvg(result.svg));
        t.true(isTtf(result.ttf));
        t.true(isEot(result.eot));
        t.true(isWoff(result.woff));
        t.true(isWoff2(result.woff2));
        t.regex(result.styles, /\.webfont-avatar/);
        t.regex(result.styles, /\.webfont-envelope/);
        t.regex(result.styles, /\.webfont-phone-call/);

        return result;
    });
});

test('should generate only `woff and `woff2` fonts with build-in template', (t) => {
    t.plan(8);

    return standalone({
        files: `${fixturesPath}/svg-icons/**/*`,
        formats: ['woff', 'woff2'],
        template: 'css'
    }).then((result) => {
        t.true(typeof result.svg === 'undefined');
        t.true(typeof result.ttf === 'undefined');
        t.true(typeof result.eot === 'undefined');
        t.true(isWoff(result.woff));
        t.true(isWoff2(result.woff2));
        t.regex(result.styles, /\.webfont-avatar/);
        t.regex(result.styles, /\.webfont-envelope/);
        t.regex(result.styles, /\.webfont-phone-call/);

        return result;
    });
});

test('should generate all fonts with custom `template` with absolute path', (t) => {
    t.plan(9);

    return standalone({
        files: `${fixturesPath}/svg-icons/**/*`,
        template: `${fixturesPath}/templates/template.css`
    }).then((result) => {
        t.true(isSvg(result.svg));
        t.true(isTtf(result.ttf));
        t.true(isEot(result.eot));
        t.true(isWoff(result.woff));
        t.true(isWoff2(result.woff2));
        t.regex(result.styles, /\/\*\scustom template\s\*\//);
        t.regex(result.styles, /\.webfont-avatar/);
        t.regex(result.styles, /\.webfont-envelope/);
        t.regex(result.styles, /\.webfont-phone-call/);

        return result;
    });
});

test('should generate all fonts with custom `template` with relative path', (t) => {
    t.plan(9);

    return standalone({
        files: `${fixturesPath}/svg-icons/**/*`,
        template: `src/__tests__/fixtures/templates/template.css`
    }).then((result) => {
        t.true(isSvg(result.svg));
        t.true(isTtf(result.ttf));
        t.true(isEot(result.eot));
        t.true(isWoff(result.woff));
        t.true(isWoff2(result.woff2));
        t.regex(result.styles, /\/\*\scustom template\s\*\//);
        t.regex(result.styles, /\.webfont-avatar/);
        t.regex(result.styles, /\.webfont-envelope/);
        t.regex(result.styles, /\.webfont-phone-call/);

        return result;
    });
});

test('should load config', (t) => {
    t.plan(5);

    return standalone({
        configFile: `${fixturesPath}/configs/.webfontrc`,
        files: `${fixturesPath}/svg-icons/**/*`
    }).then((result) => {
        t.true(isSvg(result.svg));
        t.true(isTtf(result.ttf));
        t.true(isEot(result.eot));
        t.true(isWoff(result.woff));
        t.true(isWoff2(result.woff2));

        return result;
    });
});

test('should throw error on bad svg images - `Unclosed root tag`', (t) => {
    t.plan(1);

    return standalone({
        configFile: `${fixturesPath}/configs/.webfontrc`,
        files: `${fixturesPath}/bad-svg-icons/avatar.svg`
    }).catch((error) => {
        t.regex(error.message, /Unclosed root tag/);
    });
});

test('should throw error on bad svg images - `Unterminated command at index`', (t) => {
    t.plan(1);

    return standalone({
        configFile: `${fixturesPath}/configs/.webfontrc`,
        files: `${fixturesPath}/bad-svg-icons/avatar-1.svg`
    }).catch((error) => {
        t.regex(error.message, /Unterminated command at index/);
    });
});

test('should throw error on bad svg images - `Unexpected character "N"`', (t) => {
    t.plan(1);

    return standalone({
        configFile: `${fixturesPath}/configs/.webfontrc`,
        files: `${fixturesPath}/bad-svg-icons/avatar-2.svg`
    }).catch((error) => {
        t.regex(error.message, /Unexpected character "N"/);
    });
});

test('should throw error on bad svg images - empty file', (t) => {
    t.plan(1);

    return standalone({
        configFile: `${fixturesPath}/configs/.webfontrc`,
        files: `${fixturesPath}/bad-svg-icons/avatar-3.svg`
    }).catch((error) => {
        t.regex(error, /Empty file/);
    });
});

test('should throw error of config file not found', (t) => {
    t.plan(1);

    return standalone({
        configFile: `${fixturesPath}/configs/.not-exist-webfontrc`,
        files: `${fixturesPath}/svg-icons/**/*`
    }).catch((error) => {
        t.true(error.code === 'ENOENT');
    });
});

test('should create css selectors with transform titles through function', (t) => {
    t.plan(3);

    return standalone({
        files: `${fixturesPath}/svg-icons/**/*`,
        formats: ['eot'],
        glyphTransformFn: (obj) => {
            obj.name += '_transform';
        },
        template: 'css'
    }).then((result) => {
        t.regex(result.styles, /\.webfont-avatar_transform/);
        t.regex(result.styles, /\.webfont-envelope_transform/);
        t.regex(result.styles, /\.webfont-phone-call_transform/);

        return result;
    });
});
