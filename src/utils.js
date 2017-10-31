import _ from 'underscore';

export const log = (message, level) => console.log(`${level}:  ${message}`);
export const logInfo = message => log(message, 'INFO');
export const logDebug = message => log(message, 'DEBUG');
export const logError = (message, error) => log(`${message} ${error}`, 'ERROR');

export const isNullOrUndefined = val => _.isNull(val) || _.isUndefined(val);

/**
 * Parses an URL and returns an object with its components.
 * Code inspired by http://blog.stevenlevithan.com/archives/parseuri
 */
export const parseUrl = (str) => {
    if (typeof (str) !== 'string') { return {}; }
    let o = {
            strictMode: false,
            key: ['source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'fragment'],
            q: {
                name: 'queryKey',
                parser: /(?:^|&)([^&=]*)=?([^&]*)/g,
            },
            parser: {
                strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
                loose: /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/,
            },
        },
        m = o.parser[o.strictMode ? 'strict' : 'loose'].exec(str),
        uri = {},
        i = o.key.length;

    while (i--) uri[o.key[i]] = m[i] || '';

    uri[o.q.name] = {};
    uri[o.key[12]].replace(o.q.parser, ($0, $1, $2) => {
        if ($1) uri[o.q.name][$1] = $2;
    });

    // our extension - parse fragment using a query string format (i.e. "#key1=val1&key2=val2")
    // this format is used by many websites
    uri.fragmentKey = {};
    if (uri.fragment) {
        uri.fragment.replace(o.q.parser, ($0, $1, $2) => {
            if ($1) uri.fragmentKey[$1] = $2;
        });
    }

    return uri;
};


/**
 * This function checks that a URL is a valid HTTP/HTTPS link, adds "http://" prefix if URL has no protocol specified
 * and trims the whitespaces around the URL.
 * @param url
 * @returns {*} Returns a fixed valid URL or null if the URL is not valid.
 */
export const fixUrl = (url) => {
    if (typeof (url) !== 'string') { return null; }

    url = url.trim();

    const parsedUrl = exports.parseUrl(url);
    if (!parsedUrl.host) { return null; }

    if (!parsedUrl.protocol) { url = `http://${url}`; } else if (!parsedUrl.protocol.match(/^(http|https)$/i)) { return null; }

    return url;
};

/**
 * Normalizes given URL to URL hash. Single URL hash should represent
 * single content, even thought it's hosted on multiple different urls.
 * WARNING: use only for URL deduplication - resolved URLs may not work
 * with original host.
 *
 * Operations:
 *  - converts hostname and protocol to lower-case
 *  - removes trailing slash
 *  - removes common tracking parameters, such as utm_source, ...
 *  - sorts query parameters alphabetically
 *  - trims whitespaces around all components of the URL
 *
 *  @param  {String}  url   The original url
 *  @param  {String}  keepFragment   If true, the URL fragment is kept in the normalized URL, otherwise it's removed.
 *  @return {String} The normalized URL useful for deduplication, or null if the URL was invalid.
 */
export const normalizeUrl = (url, keepFragment) => {
    if (typeof url !== 'string' || !url.length) {
        return null;
    }

    const urlObj = exports.parseUrl(url.trim());
    if (!urlObj.protocol || !urlObj.host) {
        return null;
    }

    const path = urlObj.path.replace(/\/$/, '');
    const params = (urlObj.query
            ? urlObj.query
                    .split('&')
                    .filter((param) => {
                        return !/^utm_/.test(param);
                    })
                    .sort()
            : []
        );

    return `${urlObj.protocol.trim().toLowerCase()
         }://${
         urlObj.host.trim().toLowerCase()
         }${path.trim()
         }${params.length ? `?${params.join('&').trim()}` : ''
         }${keepFragment && urlObj.fragment ? `#${urlObj.fragment.trim()}` : ''}`;
};
