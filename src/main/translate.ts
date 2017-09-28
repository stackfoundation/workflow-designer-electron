import {LANGUAGE} from './constants';

var translations = require('../../i18n/' + LANGUAGE + '.json');

class Translator {
    public translate (key: string): string {
        return translations[key];
    }
}

export var translator = new Translator();