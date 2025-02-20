/**
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

import Critters from '../src/index';

const trim = (s) =>
  s[0]
    .trim()
    .replace(new RegExp('^' + s[0].match(/^( {2}|\t)+/m)[0], 'gm'), '');

describe('Critters', () => {
  test('Basic Usage', async () => {
    const critters = new Critters({
      reduceInlineStyles: false,
      path: '/'
    });
    const assets = {
      '/style.css': trim`
        h1 { color: blue; }
        h2.unused { color: red; }
        p { color: purple; }
        p.unused { color: orange; }
      `
    };
    critters.readFile = (filename) => assets[filename];
    const result = await critters.process(trim`
      <html>
        <head>
          <link rel="stylesheet" href="/style.css">
        </head>
        <body>
          <h1>Hello World!</h1>
          <p>This is a paragraph</p>
        </body>
      </html>
    `);
    expect(result).toMatch('<style>h1{color:blue}p{color:purple}</style>');
    expect(result).toMatch('<link rel="stylesheet" href="/style.css">');
    expect(result).toMatchSnapshot();
  });

  test('`.foo + *` selector should not raise warnings', async () => {
    const warnOrError = jest.fn();
    const noop = () => null;

    const critters = new Critters({
      logger: {
        trace: noop,
        debug: noop,
        info: noop,
        warn: warnOrError,
        error: warnOrError
      }
    });

    const result = await critters.process(trim`
      <!DOCTYPE html>
      <style>
        .foo + * {
        color: red;
      }
      </style>
    `);

    expect(result).toMatchSnapshot();
    expect(warnOrError.mock.calls).toEqual([
        ['Merging inline stylesheets into a single <style> tag skipped, no inline stylesheets to merge']
      ]
    );
  });
});
