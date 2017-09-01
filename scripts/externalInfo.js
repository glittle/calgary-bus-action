// https://www.npmjs.com/package/node-rest-client
// https://www.npmjs.com/package/node-rest-client-promise
const cheerio = require('cheerio')

const Client = require('node-rest-client').Client;
const ClientP = require('node-rest-client-promise').Client;

var GtfsRealtimeBindings = require('gtfs-realtime-bindings');
// var request = require('request');
// console.log(GtfsRealtimeBindings)

var requestSettings = {
    method: 'GET',
    url: 'http://transitdata.calgary.ca/ctransit/tripupdates.pb',
    encoding: null
};

// request(requestSettings, function(error, response, body) {
//     if (!error && response.statusCode == 200) {}
// });

// function getBusPage(stopNumber) {
//     // http://hastinfoweb.calgarytransit.com/hastinfoweb2/api/NextPassingTimesAPI/GetStopViewModel?stopIdentifier=6663
//     var caller = new Client();
//     var url = `http://transitdata.calgary.ca/ctransit/tripupdates.pb`
//     caller.get(url, function(data, response) {
//         console.log(data)
//             // console.log(GtfsRealtimeBindings.transit_realtime)
//         var feed = GtfsRealtimeBindings.FeedMessage.decode(data);
//         console.log(feed);
//         feed.entity.forEach(function(entity) {
//             if (entity.trip_update) {
//                 console.log(entity.trip_update);
//             }
//         });

//     })
// }

function getBusPage(stopNumber, cb) {
    const caller = new ClientP();
    const url = `http://www.calgarytransit.com/nextride?stop_id=${stopNumber}`
    caller.getPromise(url)
        .catch(function() {})
        .then(function(result) {
            const data = result.data;
            const widgetRawHtml = data.toString('utf8');
            const $ = cheerio.load(widgetRawHtml)

            var invalid = $('#nextRideResult').children().length === 1;

            const info = {
                bus: $('.results .route').data('route_short_name'),
                when: $('.trip-item-first .trip-item-countdown').eq(0).text(),
                error: $('.results .no-result strong').text() ||
                    (invalid ? $('#nextRideResult p').text() : '')
            };

            console.log(info);
            cb(info);
        })

}

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

// function getBusPage(stopNumber, cb) {
//     const caller = new Client();
//     const url = `http://www.calgarytransit.com/nextride?stop_id=${stopNumber}`
//     caller.get(url, function(data, response) {
//         const widgetRawHtml = data.toString('utf8');
//         const $ = cheerio.load(widgetRawHtml)

//         var invalid = $('#nextRideResult').children().length === 1;

//         const info = {
//             bus: $('.results .route').data('route_short_name'),
//             when: $('.trip-item-first .trip-item-countdown').eq(0).text(),
//             error: $('.results .no-result strong').text() ||
//                 (invalid ? $('#nextRideResult p').text() : '')
//         };

//         console.log(info);
//         cb(info);
//     })
// }

module.exports = {
    getBusPage,
    getBusPages
};