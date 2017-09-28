var exec = require('child_process').exec;
const os = require('os');
import { logger } from './logger';

export function execToPromise(instruction: string): Promise<string> {
    return new Promise((resolve, reject) => {
        exec(instruction, function (error: any, stdout: any, stderr: any) {
            if (error !== null) {
                logger.info('Failed to run "' + instruction + '": ' + stderr);
                reject(stderr);
            }
            else {
                logger.info('Finished running "' + instruction + '":\n' + stdout);
                resolve(stdout);
            }
        });
    });
}

export interface ProxyOptions {
    HTTPProxyHost?: string;
    HTTPProxyPort?: string;
    HTTPSProxyHost?: string;
    HTTPSProxyPort?: string;
    noProxy?: string;
}

export interface ProxySessionConfig {
    proxyRules?: string;
    proxyBypassRules?: string;
}

export function checkProxies (): Promise<ProxyOptions> {
    logger.info('Detecting proxy settings...');
    if (os.platform() === 'win32') {
        var Key = require('windows-registry').Key;
        var windef = require('windows-registry').windef;

        var settings = new Key(
            windef.HKEY.HKEY_CURRENT_USER, 
            'Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings', 
            windef.KEY_ACCESS.KEY_ALL_ACCESS);
        if (settings) {
            try {
                let proxyServer = settings.getValue('ProxyServer');
                let proxyOverride = settings.getValue('ProxyOverride');
                let proxyEnable = settings.getValue('ProxyEnable');

                if (proxyEnable) {
                    proxyEnable = proxyEnable.readUIntLE(0) === 1;
                }

                if (proxyEnable) {
                    let opts: ProxyOptions = {};
                    let splitHostPort = (proxy: string, setter: (host: string, port: string) => void) => {
                        let split = proxy.split(':');
                        if (split.length > 1) {
                            setter(split[0], split[1]);
                        } else {
                            setter(split[0], '8080');
                        }
                    };

                    let proxyServers = proxyServer.split(';');
                    if (proxyServers.length > 1) {
                        for (let i = 0; i < proxyServers.length; i++) {
                            proxyServer = proxyServers[i].split('=');
                            if (proxyServer.length > 1) {
                                if (proxyServer[0] === 'http') {
                                    splitHostPort(proxyServer[1], (host, port) => {
                                        opts.HTTPProxyHost = host;
                                        opts.HTTPProxyPort = port;
                                    });
                                } else if (proxyServer[0] === 'https') {
                                    splitHostPort(proxyServer[1], (host, port) => {
                                        opts.HTTPSProxyHost = host;
                                        opts.HTTPSProxyPort = port;
                                    });
                                }
                            }
                        }
                    } else {
                        splitHostPort(proxyServer, (host, port) => {
                            opts.HTTPProxyHost = opts.HTTPSProxyHost = host;
                            opts.HTTPProxyPort = opts.HTTPSProxyPort = port;
                        });
                    }

                    logger.info(`The following proxy settings will be used: ${JSON.stringify(opts)}`);
                    (global as any)['system_proxies'] = opts;
                    return Promise.resolve(opts);
                }
            } catch (e) {
                // If value doesn't exist...
            }

            settings.close();
        }

        logger.info('No proxy is configured, none will be used');
        return Promise.resolve({});
    } else {
        return execToPromise('scutil --proxy')
            .then(resp => {
                let lines = resp.split('\n').map(el => el.trim());
                let opts: ProxyOptions = {};

                if (lines.findIndex(el => el.startsWith('HTTPProxy')) >= 0) {
                    let HTTPHost = lines[lines.findIndex(el => el.startsWith('HTTPProxy'))].substr(12).trim(),
                        HTTPPort = lines[lines.findIndex(el => el.startsWith('HTTPPort'))].substr(11).trim();

                    opts.HTTPProxyHost = HTTPHost;
                    opts.HTTPProxyPort = HTTPPort;
                }

                if (lines.findIndex(el => el.startsWith('HTTPSProxy')) >= 0) {
                    let HTTPSHost = lines[lines.findIndex(el => el.startsWith('HTTPSProxy'))].substr(13).trim(),
                        HTTPSPort = lines[lines.findIndex(el => el.startsWith('HTTPSPort'))].substr(12).trim();

                    opts.HTTPSProxyHost = HTTPSHost;
                    opts.HTTPSProxyPort = HTTPSPort;
                }
                
                let index = lines.findIndex(el => el.startsWith('ExceptionsList'))
                if (index >= 0) {
                    let noProxy = [];

                    index++;
                    while (index < lines.length && !lines[index].startsWith('}')) {
                        noProxy.push(lines[index].substr(lines[index].indexOf(':') + 1).trim());
                        index++;
                    }

                    opts.noProxy = noProxy.join(',');
                }

                logger.info(`The following proxy settings will be used: ${JSON.stringify(opts)}`);
                (global as any)['system_proxies'] = opts;

                return opts;
            },
            err => {
                logger.info('No proxy is configured, none will be used');
                return {};
            });
    }
}

export function checkContainerEnvProxies (env: string[], proxies: any): boolean {
    let envOptions: ProxyOptions = {},
        keyIndex: number;
    envOptions.HTTPProxyHost = getEnvKey(env, 'HTTP_PROXY_HOST');
    envOptions.HTTPProxyPort = getEnvKey(env, 'HTTP_PROXY_PORT');
    envOptions.HTTPSProxyHost = getEnvKey(env, 'HTTPS_PROXY_HOST');
    envOptions.HTTPSProxyPort = getEnvKey(env, 'HTTPS_PROXY_PORT');

    let noProxyString = getEnvKey(env, 'HTTP_NON_PROXY_HOSTS');
    if (noProxyString && noProxyString.length) {
        envOptions.noProxy = noProxyString.split('|').join(',');
    }

    logger.info('Checking if platform container proxy configuration matches system proxy settings...');
    logger.info(`Container proxy settings are: ${JSON.stringify(envOptions)}`);

    if (!proxies) {
        proxies = {};
    }

    logger.info(`System proxy settings are: ${JSON.stringify(proxies)}`);

    if ((proxies.HTTPProxyHost || null) !== (envOptions.HTTPProxyHost || null) ||
        (proxies.HTTPProxyPort || null) !== (envOptions.HTTPProxyPort || null) ||
        (proxies.HTTPSProxyHost || null) !== (envOptions.HTTPSProxyHost || null) ||
        (proxies.HTTPSProxyPort || null) !== (envOptions.HTTPSProxyPort || null)) {
        logger.info('Container proxy settings do not match environment, containers will have to be re-created');
        return false;
    }

    // Compare NO_PROXY only if a proxy is set
    if ((proxies.HTTPProxyHost || proxies.HTTPSProxyHost) && (proxies.noProxy || null) !== (envOptions.noProxy || null)) {
        logger.info('Container proxy settings do not match environment, containers will have to be re-created');
        return false;
    }

    logger.info('Container proxy settings match system proxy settings - no changes required');
    return true;
}

export function getSessionProxyRulesConfig (proxies: ProxyOptions): ProxySessionConfig {
    let sessionConfig: ProxySessionConfig = {},
        rules: string = '';

    if (!proxies) {
        proxies = {};
    }

    if (proxies.HTTPProxyHost) {
        rules = `http=${proxies.HTTPProxyHost}:${proxies.HTTPProxyPort}`;
    }
    if (proxies.HTTPSProxyHost) {
        if (rules.length) {
            rules += ';';
        }
        rules += `https=${proxies.HTTPSProxyHost}:${proxies.HTTPSProxyPort}`;
    }

    sessionConfig.proxyRules = rules;
    sessionConfig.proxyBypassRules = proxies.noProxy;

    return sessionConfig;
}

function getEnvKey (env: string[], key: string): string {
    let keyIndex: number;
    if ((keyIndex = env.findIndex(el => el.startsWith(key + '='))) > -1) {
        return env[keyIndex].substr(key.length + 1);
    }
}