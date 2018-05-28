import * as path from 'path'
import { test } from '../utils'

import { RuleTester } from 'eslint'

const ruleTester = new RuleTester()
    , rule = require('rules/no-duplicates')

ruleTester.run('no-duplicates', rule, {
  valid: [
    test({ code: 'import "./malformed.js"' }),

    test({ code: "import { x } from './foo'; import { y } from './bar'" }),

    // #86: every unresolved module should not show up as 'null' and duplicate
    test({ code: 'import foo from "234artaf";' +
                 'import { shoop } from "234q25ad"' }),

    // #225: ignore duplicate if is a flow type import
    test({
      code: "import { x } from './foo'; import type { y } from './foo'",
      parser: 'babel-eslint',
    }),

    // #1107: Using different query strings that trigger different webpack loaders.
    test({
      code: "import x from './bar?optionX'; import y from './bar?optionY';",
      options: [{'considerQueryString': true}],
      settings: { 'import/resolver': 'webpack' },
     }),
  ],
  invalid: [
    test({
      code: "import { x } from './foo'; import { y } from './foo'",
      errors: ['\'./foo\' imported multiple times.', '\'./foo\' imported multiple times.'],
    }),

    test({
      code: "import { x } from './foo'; import { y } from './foo'; import { z } from './foo'",
      errors: ['\'./foo\' imported multiple times.', '\'./foo\' imported multiple times.', '\'./foo\' imported multiple times.'],
    }),

    // ensure resolved path results in warnings
    test({
      code: "import { x } from './bar'; import { y } from 'bar';",
      settings: { 'import/resolve': {
        paths: [path.join( process.cwd()
                         , 'tests', 'files'
                         )] }},
      errors: 2, // path ends up hardcoded
     }),

    // #1107: Using different query strings that trigger different webpack loaders.
    test({
      code: "import x from './bar.js?optionX'; import y from './bar?optionX';",
      settings: { 'import/resolver': 'webpack' },
      errors: 2, // path ends up hardcoded
     }),
    test({
      code: "import x from './bar?optionX'; import y from './bar?optionY';",
      settings: { 'import/resolver': 'webpack' },
      errors: 2, // path ends up hardcoded
     }),

    // #1107: Using same query strings that trigger the same loader.
    test({
      code: "import x from './bar?optionX'; import y from './bar.js?optionX';",
      options: [{'considerQueryString': true}],
      settings: { 'import/resolver': 'webpack' },
      errors: 2, // path ends up hardcoded
     }),

    // #86: duplicate unresolved modules should be flagged
    test({
      code: "import foo from 'non-existent'; import bar from 'non-existent';",
      errors: [
        "'non-existent' imported multiple times.",
        "'non-existent' imported multiple times.",
      ],
    }),

    test({
      code: "import type { x } from './foo'; import type { y } from './foo'",
      parser: 'babel-eslint',
      errors: ['\'./foo\' imported multiple times.', '\'./foo\' imported multiple times.'],
    }),
  ],
})
