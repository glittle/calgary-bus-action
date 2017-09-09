// https://www.npmjs.com/package/node-rest-client
// https://www.npmjs.com/package/node-rest-client-promise
const cheerio = require('cheerio')

const Client = require('node-rest-client').Client;
const ClientP = require('node-rest-client-promise').Client;

// var GtfsRealtimeBindings = require('gtfs-realtime-bindings');

var requestSettings = {
    method: 'GET',
    url: 'http://transitdata.calgary.ca/ctransit/tripupdates.pb',
    encoding: null
};

function getBusPages(stopNumbers, cb) {
    const caller = new ClientP();
    const promises = [];

    stopNumbers.forEach(function(stop) {
        const url = `http://www.calgarytransit.com/nextride?stop_id=${stop}`;
        promises.push(caller.getPromise(url));
        console.log('promise for', url);
    });

    Promise.all(promises)
        .then(results => {
            var infos = [];
            results.forEach(function(result) {
                const data = result.data;
                const widgetRawHtml = data.toString('utf8');
                const $ = cheerio.load(widgetRawHtml)

                var invalid = $('#nextRideResult').children().length === 1;

                const info = {
                    stop: $('.stop').data('stop_id'),
                    bus: $('.results .route').data('route_short_name'),
                    when: $('.trip-item-first .trip-item-countdown').eq(0).text(),
                    error: $('.results .no-result strong').text() ||
                        (invalid ? $('#nextRideResult p').text() : '')
                };

                console.log(info);
                infos.push(info);
            })

            cb(infos);
        });
}

function calloutToApiAi(event, sessionId) {
    const caller = new Client();
    var url = 'https://api.api.ai/v1/query?v=20150910';
    var args = {
        data: {
            event: {
                name: event
            },
            contexts: [{
                name: 'person',
                lifetime: 100,
                parameters: {
                    age: 10,
                    name: "Glen"
                }
            }],
            sessionId: sessionId,
            lang: 'en'
        },
        headers: {
            "Content-Type": "application/json", //; charset=utf-8
            "Authorization": "Bearer " + process.env.apiaiClientToken
        }
    };

    setTimeout(function() {
        console.log('args', args);

        caller.post(url, args, function(result) {
            var data = result;
            console.log('callout', JSON.stringify(data));
        });

    }, 2000);
}


module.exports = {
    getBusPages,
    calloutToApiAi
};