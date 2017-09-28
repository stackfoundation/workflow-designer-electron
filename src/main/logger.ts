import { DEBUG } from './constants';
import {app} from 'electron';
var winston = require('winston');
var path = require('path');

var _logger = new winston.Logger();

if (DEBUG) {
    _logger.add(winston.transports.Console, {
        handleExceptions: true,
        humanReadableUnhandledException: true
    });
    _logger.add(winston.transports.File, {
        filename: path.join(app.getPath('userData'), 'logger.log'),
        handleExceptions: true,
        humanReadableUnhandledException: true
    });
}

export const logger = _logger;