import isEot from 'is-eot';
import isSvg from 'is-svg';
import isTtf from 'is-ttf';
import isWoff from 'is-woff';
import isWoff2 from 'is-woff2';
import path from 'path';
import standalone from '../standalone';
import test from 'ava';

const fixturesPath = path.join(__dirname, 'fixtures');

function logError(error) {
    console.log(error.stack); // eslint-disable-line no-console
}

test('should throw error if `files` not passed', (t) => {
    t.throws(standalone(), 'You must pass webfont a `files` glob');
});

test('should throw error `files glob patterns specified did not match any files` if not found files', (t) => {
    t.throws(standalone({
        files: `${fixturesPath}/not-found-svg-icons/**/*`
    }), 'Files glob patterns specified did not match any files');
});

test('should generated all fonts', (t) => {
    t.plan(5);

    return standalone({
        files: `${fixturesPath}/svg-icons/**/*`,
        quite: true
    }).then((result) => {
        t.true(isSvg(result.svg));
        t.true(isTtf(result.ttf));
        t.true(isEot(result.eot));
        t.true(isWoff(result.woff));
        t.true(isWoff2(result.woff2));

        return result;
    }).catch(logError);
});

test('should generated only `svg`, `ttf` and `eot` fonts', (t) => {
    t.plan(5);

    return standalone({
        files: `${fixturesPath}/svg-icons/**/*`,
        formats: ['svg', 'ttf', 'eot'],
        quite: true
    }).then((result) => {
        t.true(isSvg(result.svg));
        t.true(isTtf(result.ttf));
        t.true(isEot(result.eot));
        t.true(typeof result.woff === 'undefined');
        t.true(typeof result.woff2 === 'undefined');

        return result;
    }).catch(logError);
});

test('should generated only `woff2` font', (t) => {
    t.plan(5);

    return standalone({
        files: `${fixturesPath}/svg-icons/**/*`,
        formats: ['woff2'],
        quite: true
    }).then((result) => {
        t.true(typeof result.svg === 'undefined');
        t.true(typeof result.ttf === 'undefined');
        t.true(typeof result.eot === 'undefined');
        t.true(typeof result.woff === 'undefined');
        t.true(isWoff2(result.woff2));

        return result;
    }).catch(logError);
});

test('should generated all fonts and css', (t) => {
    t.plan(6);

    return standalone({
        files: `${fixturesPath}/svg-icons/**/*`,
        css: true,
        quite: true
    }).then((result) => {
        /* eslint-disable ava/max-asserts */
        t.true(isSvg(result.svg));
        t.true(isTtf(result.ttf));
        t.true(isEot(result.eot));
        t.true(isWoff(result.woff));
        t.true(isWoff2(result.woff2));
        t.true(result.css.length > 0); // eslint-disable-line ava/max-asserts

        return result;
    }).catch(logError);
});

test('should generated all fonts with `css` by passed template', (t) => {
    t.plan(6);

    return standalone({
        files: `${fixturesPath}/svg-icons/**/*`,
        css: true,
        srcCssTemplate: `${fixturesPath}/templates/template.css`,
        quite: true
    }).then((result) => {
        t.true(isSvg(result.svg));
        t.true(isTtf(result.ttf));
        t.true(isEot(result.eot));
        t.true(isWoff(result.woff));
        t.true(isWoff2(result.woff2));
        t.is(result.css.slice(0, 21), '/* custom template */');

        return result;
    }).catch(logError);
});

test('should load config', (t) => {
    t.plan(5);

    return standalone({
        files: `${fixturesPath}/svg-icons/**/*`,
        configFile: `${fixturesPath}/configs/.webfontrc`,
        quite: true
    }).then((result) => {
        t.true(isSvg(result.svg));
        t.true(isTtf(result.ttf));
        t.true(isEot(result.eot));
        t.true(isWoff(result.woff));
        t.true(isWoff2(result.woff2));

        return result;
    }).catch(logError);
});

