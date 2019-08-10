// https://www.npmjs.com/package/node-rest-client
// https://www.npmjs.com/package/node-rest-client-promise
const Client = require('node-rest-client').Client;
const ClientP = require('node-rest-client-promise').Client;

const cheerio = require('cheerio')

// var GtfsRealtimeBindings = require('gtfs-realtime-bindings');
// var requestSettings = {
//     method: 'GET',
//     url: 'http://transitdata.calgary.ca/ctransit/tripupdates.pb',
//     encoding: null
// };

function getBusPages(stopInfos, addingNewStop, cb) {
    const caller = new ClientP();
    const promises = [];

    var stops = stopInfos
        .map(el => el.stop)
        .filter((el, i, a) => i === a.indexOf(el));;
    console.log('need to get', stopInfos, stops);

    stops.forEach(function(stop) {
        const url = `http://www.calgarytransit.com/nextride?stop_id=${stop}`;
        promises.push(caller.getPromise(url));
        console.log('getting', url);
    });

    Promise.all(promises)
        .then(results => {
            var infos = [];
            console.log('get', results.length, 'responses')
            results.forEach(function(result) {
                const data = result.data;
                const widgetRawHtml = data.toString('utf8');
                const $ = cheerio.load(widgetRawHtml)
                var invalid = $('#nextRideResult').children().length === 1;

                if (invalid) {
                    console.log('invalid!');
                    info = {
                        error: $('#nextRideResult p').text()
                    }
                    infos.push(info);
                    return;
                }
                var resultList = $('.results .row');

                var info;
                if (addingNewStop && resultList.length > 1) {
                    console.log('getting busList')
                    info = {
                        busList: resultList.map(function(i, el) {
                            return $(el).find('.route').data('route_short_name');
                        }).get()
                    };
                    infos.push(info);
                } else {
                    var stop = $('.stop').data('stop_id');
                    // also has lat/long too!
                    console.log(stop, 'has', resultList.length, 'entries')
                    if (resultList.length === 0) {
                        var noResult = ($('.results').text() || 'No info found').trim();
                        infos.push({
                            error: noResult
                        });
                        return;
                    }
                    resultList.each(function(i, el) {
                        var result = $(el);
                        var bus = result.find('.route').data('route_short_name');

                        // match this back to the requests
                        var matched = resultList.length == 1 || stopInfos.find(function(el) {
                            // use == to match string/number
                            return el.stop == stop && el.bus == bus;
                        });
                        console.log(stop, bus, matched ? 'found' : 'not requested');
                        if (matched) {
                            var when = result.find('.trip-item-first .trip-item-countdown').text();
                            console.log('adding at', when);
                            info = {
                                stop: stop,
                                bus: bus,
                                when: when
                            };
                            infos.push(info);
                        }
                    });
                }
                console.log(infos);
            })

            cb(infos);
        });
}


function getNearbyStops(coord, cb) {
    const caller = new ClientP();
    var promises = [];

    var url = 'http://hastinfoweb.calgarytransit.com/hastinfoweb2/api/NextPassingTimesAPI/GetStopsNearLocation' +
        `?callback=a&latitude=${coord.lat}&longitude=${coord.lng}`;
    promises.push(caller.getPromise(url));

    url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coord.lat},${coord.lng}&key=${process.env.googleMapApi}`;
    promises.push(caller.getPromise(url));

    Promise.all(promises)
        .then(results => {
            var forCb = {};
            var resultNum = 1;
            results.forEach(function(result) {

                const data = result.data;
                const string = data.toString('utf8');

                console.log('result', resultNum++, JSON.stringify(string));

                if (string.slice(0, 3) === 'a([') {
                    // bus info
                    console.log('stops info')
                    var data2 = string.slice(2, -2);
                    //console.log(info);
                    var info = JSON.parse(data2);

                    forCb.stops = info.map(function(i) {
                        return {
                            stop: i.Stop.Identifier,
                            desc: i.Stop.Description
                        }
                    }).splice(0, 15);

                    // console.log(data.stops, info)

                } else {
                    // location
                    console.log('location');
                    // console.log('location', JSON.stringify(data));
                    // just use the first one, assuming it is the most detailed
                    if (data && data.results && data.results[0] && data.results[0].formatted_address) {
                        forCb.assumedAddress = data.results[0].formatted_address.split(',')[0];
                    } else {
                        console.log('Error getting location results', string);
                    }
                    // console.log(data.assumedAddress);
                }

            });
            // console.log(1, data)
            cb(forCb);
        });


    caller.get(url, function(result) {
        var data = result;
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
    calloutToApiAi,
    getNearbyStops
};
