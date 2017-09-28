import { checkProxies } from './proxy';
import { logger } from './logger';

// import * as PromiseRequest from 'request-promise-native';

let httpProxy: any = undefined;
let httpsProxy: any = undefined;

export function request(opts: any) {
    if (opts.baseUrl && opts.baseUrl.startsWith('http://') && httpProxy) {
        // return PromiseRequest.defaults({proxy: httpProxy})(opts);
    }
    else if (opts.baseUrl && opts.baseUrl.startsWith('https://') && httpsProxy) {
        // return PromiseRequest.defaults({proxy: httpsProxy})(opts);
    }
    else {
        // return PromiseRequest(opts);
    }
}

// export var requestNoProxy = PromiseRequest;

export var updateOSProxies = function () {
    return checkProxies().then((opts) => {
        httpProxy = opts.HTTPProxyHost ? 
            ((opts.HTTPProxyHost.startsWith('http://') || opts.HTTPProxyHost.startsWith('https://')) ? opts.HTTPProxyHost : 'http://' + opts.HTTPProxyHost) + ':' + opts.HTTPProxyPort : 
            undefined;
        httpsProxy = opts.HTTPSProxyHost ? 
            ((opts.HTTPSProxyHost.startsWith('http://') || opts.HTTPSProxyHost.startsWith('https://')) ? opts.HTTPSProxyHost : 'http://' + opts.HTTPSProxyHost) + ':' + opts.HTTPSProxyPort : 
            undefined;
            
        if (httpProxy || httpsProxy) {
            logger.info('Using proxy settings: ' + (httpProxy ? httpProxy + ', ' : '') + (httpsProxy ? httpsProxy : ''));
        }
    });
};
