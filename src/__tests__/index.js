import path from 'path';
import standalone from '../index';
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

test('should generated only `svg`, `ttf` and `eot` fonts', (t) => {
    t.plan(6);

    return standalone({
        files: `${fixturesPath}/svg-icons/**/*`,
        config: {
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

test('should generated only `woff2` font', (t) => {
    t.plan(6);

    return standalone({
        files: `${fixturesPath}/svg-icons/**/*`,
        config: {
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

test('should generated all fonts and css', (t) => {
    t.plan(1);

    return standalone({
        files: `${fixturesPath}/svg-icons/**/*`,
        config: {
            css: true
        }
    }).then((result) => {
        t.true(typeof result.css !== 'undefined');

        return result;
    }).catch(logError);
});

test('should generated all fonts with `css` by passed template', (t) => {
    t.plan(1);

    return standalone({
        files: `${fixturesPath}/svg-icons/**/*`,
        config: {
            css: true,
            srcCssTemplate: path.join(__dirname, '../../templates/template.css')
        }
    }).then((result) => {
        t.true(typeof result.css !== 'undefined');

        return result;
    }).catch(logError);
});

