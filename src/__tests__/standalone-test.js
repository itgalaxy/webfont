import path from 'path';
import standalone from '../standalone';
import test from 'ava';

const fixturesPath = path.join(__dirname, 'fixtures');

function logError(error) {
    console.log(error.stack); // eslint-disable-line no-console
}

test('generate fonts without files', (t) => {
    t.throws(standalone(), 'You must pass stylelint a `files` glob');
});

test('generate fonts if `files`glob patterns specified did not match any files', (t) => {
    t.throws(standalone({
        files: `${fixturesPath}/not-found-svg-icons/**/*`
    }), 'Files glob patterns specified did not match any files');
});

test('generate fonts', (t) => {
    t.plan(6);

    return standalone({
        files: `${fixturesPath}/svg-icons/**/*`
    }).then((result) => {
        /* eslint-disable ava/max-asserts */
        t.deepEqual(['svg', 'ttf', 'eot', 'woff', 'woff2'], Object.keys(result));
        t.true(result.svg.length > 0);
        t.true(result.ttf.length > 0);
        t.true(result.eot.length > 0);
        t.true(result.woff.length > 0);
        t.true(result.woff2.length > 0);
        /* eslint-enable ava/max-asserts */

        return result;
    }).catch(logError);
});

test('generate fonts with options formats `[\'svg\', \'ttf\', \'eot\']`', (t) => {
    t.plan(6);

    return standalone({
        files: `${fixturesPath}/svg-icons/**/*`,
        opts: {
            formats: ['svg', 'ttf', 'eot']
        }
    }).then((result) => {
        /* eslint-disable ava/max-asserts */
        t.deepEqual(['svg', 'ttf', 'eot'], Object.keys(result));
        t.true(result.svg.length > 0);
        t.true(result.ttf.length > 0);
        t.true(result.eot.length > 0);
        t.true(typeof result.woff === 'undefined');
        t.true(typeof result.woff2 === 'undefined');
        /* eslint-enable ava/max-asserts */

        return result;
    }).catch(logError);
});

test('generate fonts with options formats `[\'woff2\']`', (t) => {
    t.plan(6);

    return standalone({
        files: `${fixturesPath}/svg-icons/**/*`,
        opts: {
            formats: ['woff2']
        }
    }).then((result) => {
        /* eslint-disable ava/max-asserts */
        t.deepEqual(['woff2'], Object.keys(result));
        t.true(typeof result.svg === 'undefined');
        t.true(typeof result.ttf === 'undefined');
        t.true(typeof result.eot === 'undefined');
        t.true(typeof result.woff === 'undefined');
        t.true(result.woff2.length > 0);
        /* eslint-enable ava/max-asserts */

        return result;
    }).catch(logError);
});

test('generate fonts with options css', (t) => {
    t.plan(1);

    return standalone({
        files: `${fixturesPath}/svg-icons/**/*`,
        opts: {
            css: true
        }
    }).then((result) => {
        t.true(typeof result.css !== 'undefined');

        return result;
    }).catch(logError);
});

test('generate fonts with options `css` and `css-template`', (t) => {
    t.plan(1);

    return standalone({
        files: `${fixturesPath}/svg-icons/**/*`,
        opts: {
            css: true,
            cssTemplate: '../templates/template.css.tpl'
        }
    }).then((result) => {
        t.true(typeof result.css !== 'undefined');

        return result;
    }).catch(logError);
});

