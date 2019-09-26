const uuidv4 = require('uuid/v4');
const externalInfo = require('./externalInfo');
//const timezonedb = require('timezonedb-node')(process.env.timeZoneKey);

function encodeAsFirebaseKey(string) {
    return string.replace(/\%/g, '%25')
        .replace(/\./g, '%2E')
        .replace(/\#/g, '%23')
        .replace(/\$/g, '%24')
        .replace(/\//g, '%2F')
        .replace(/\[/g, '%5B')
        .replace(/\]/g, '%5D');
};

function getOrdinal(num) {
    return ['', 'st', 'nd', 'rd'][num] || 'th';
}

function makeUserId() {
    return 'id' + uuidv4().replace(/-/g, '');
}

function addToBoth(s, speech, text) {
    speech.push(s);
    text.push(s);
}

function getLocationInfo(userRef, userInfo) {

    externalInfo.getTimezoneInfo(userRef, userInfo);
    externalInfo.getLocationName(userRef, userInfo);

    // timezonedb.getTimeZoneData(userInfo.coord,
    //     function (error, tzInfo) {
    //         if (!error) {
    //             console.log(tzInfo);

    //             var userOffset = tzInfo.gmtOffset / 3600;
    //             var serverTz = new Date().getTimezoneOffset() / 60;
    //             var hourDifference = serverTz + userOffset;

    //             tzInfo.serverDiff = hourDifference;

    //             userInfo.tzInfo = tzInfo;
    //             userRef.update({ tzInfo: tzInfo });

    //         } else {
    //             console.error(error);
    //         }
    //     });

}


function extractUserId(app, request) {
    var id = '';
    if (app.isInSandbox()) {
        id = 'sandbox';
    } else {
        id = ((app.getUser() || {}).userId || request.body.sessionId);
        if (id.substr(0, 3) === '150') {
            id = 'sandbox'
        }
    }
    return encodeAsFirebaseKey(id);
}

function cleanVerseForSpeech(text) {
    return text
        .replace(/\. \. \. /g, ' ')
        .replace(/\.\.\./g, ' ');
}

var _nextFilledWithEach_UsesExactMatchOnly = false;
String.prototype.filledWith = function() {
    /// <summary>Similar to C# String.Format...  in two modes:
    /// 1) Replaces {0},{1},{2}... in the string with values from the list of arguments.
    /// 2) If the first and only parameter is an object, replaces {xyz}... (only names allowed) in the string with the properties of that object.
    /// Notes: the { } symbols cannot be escaped and should only be used for replacement target tokens;  only a single pass is done.
    /// </summary>

    var values = typeof arguments[0] === 'object' && arguments.length === 1 ? arguments[0] : arguments;

    //  var testForFunc = /^#/; // simple test for "#"
    var testForElementAttribute = /^\*/; // simple test for "#"
    var testDoNotEscapeHtml = /^\^/; // simple test for "^"
    var testDoNotEscpaeHtmlButToken = /^-/; // simple test for "-"
    var testDoNotEscpaeHtmlButSinglQuote = /^\>/; // simple test for ">"

    var extractTokens = /{([^{]+?)}/g;

    var replaceTokens = function(input) {
        return input.replace(extractTokens, function() {
            var token = arguments[1];
            var value;
            //try {
            if (token[0] === ' ') {
                // if first character is a space, do not process
                value = '{' + token + '}';
            } else if (values === null) {
                value = '';
            }
            //else if (testForFunc.test(token)) {
            //  try {
            //    log('eval... ' + token);
            //    value = eval(token.substring(1));
            //  }
            //  catch (e) {
            //    // if the token cannot be executed, then pass it through intact
            //    value = '{' + token + '}';
            //  }
            //}
            else if (testForElementAttribute.test(token)) {
                value = quoteattr(values[token.substring(1)]);
            } else if (testDoNotEscpaeHtmlButToken.test(token)) {
                value = values[token.substring(1)].replace(/{/g, '&#123;');
            } else if (testDoNotEscpaeHtmlButSinglQuote.test(token)) {
                value = values[token.substring(1)].replace(/'/g, "%27");
            } else if (testDoNotEscapeHtml.test(token)) {
                value = values[token.substring(1)];
            } else {
                if (values.hasOwnProperty(token)) {
                    var toEscape = values[token];
                    //value = typeof toEscape == 'undefined' || toEscape === null ? '' : ('' + toEscape).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&#39;').replace(/"/g, '&quot;').replace(/{/g, '&#123;');
                    //Never escape HTML in this Chrome Extension
                    value = toEscape === 0 ? 0 : (toEscape || '');
                } else {
                    if (_nextFilledWithEach_UsesExactMatchOnly) {
                        value = '{' + token + '}';
                    } else {
                        console.log('missing property for filledWith: ' + token);
                        value = '';
                    }
                }
            }


            //REMOVE try... catch to optimize in this project... not dealing with unknown and untested input

            //          } catch (err) {
            //            log('filledWithError:\n' +
            //                err +
            //                '\ntoken:' +
            //                token +
            //                '\nvalue:' +
            //                value +
            //                '\ntemplate:' +
            //                input +
            //                '\nall values:\n');
            //            log(values);
            //            throw 'Error in Filled With';
            //          }
            return (typeof value == 'undefined' || value == null ? '' : ('' + value));
        });
    };

    var result = replaceTokens(this);

    var lastResult = '';
    while (lastResult !== result) {
        lastResult = result;
        result = replaceTokens(result);
    }

    return result;
};

function quoteattr(s, preserveCr) {
    preserveCr = preserveCr ? '&#13;' : '\n';
    return ('' + s) /* Forces the conversion to string. */
        .replace(/&/g, '&amp;') /* This MUST be the 1st replacement. */
        .replace(/'/g, '&apos;') /* The 4 other predefined entities, required. */
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        /*
        You may add other replacements here for HTML only
        (but it's not necessary).
        Or for XML, only if the named entities are defined in its DTD.
        */
        .replace(/\r\n/g, preserveCr) /* Must be before the next replacement. */
        .replace(/[\r\n]/g, preserveCr);
}


String.prototype.filledWithEach = function(arr) {
    /// <summary>Silimar to 'filledWith', but repeats the fill for each item in the array. Returns a single string with the results.
    /// </summary>
    if (arr === undefined || arr === null) {
        return '';
    }
    var result = [];
    for (var i = 0, max = arr.length; i < max; i++) {
        result[result.length] = this.filledWith(arr[i]);
    }
    _nextFilledWithEach_UsesExactMatchOnly = false;
    return result.join('');
};


module.exports = {
    getLocationInfo,
    extractUserId,
    makeUserId,
    getOrdinal,
    cleanVerseForSpeech,
    addToBoth
};
