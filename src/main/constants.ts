var argv = require('minimist')(process.argv, { boolean: ['debug'] });

export const IS_DEV_MODE = process.execPath.match(/[\\/]electron/);
export const DEBUG = argv.debug !== undefined ? argv.debug : IS_DEV_MODE;
export const LANGUAGE = 'en';