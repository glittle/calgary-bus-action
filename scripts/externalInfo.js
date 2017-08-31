// https://www.npmjs.com/package/node-rest-client

const Client = require('node-rest-client').Client;
const cheerio = require('cheerio')

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
    // http://hastinfoweb.calgarytransit.com/hastinfoweb2/api/NextPassingTimesAPI/GetStopViewModel?stopIdentifier=6663
    const caller = new Client();
    const url = `http://www.calgarytransit.com/nextride?stop_id=${stopNumber}`
    caller.get(url, function(data, response) {
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

function getTimezoneInfo(userRef, userInfo) {
    var coord = userInfo.coord;

    // refernce https://timezonedb.com/references/get-time-zone

    var caller = new Client();
    var params = {
        key: process.env.timeZoneKey,
        format: 'json',
        fields: 'zoneName,formatted',
        by: 'position',
        lat: coord.lat,
        lng: coord.lng,
    };
    var host = 'http://api.timezonedb.com/v2/get-time-zone?';
    var query = toQueryString(params);

    console.log('timezonedb query', query);

    caller.get(host + query, function(data, response) {
        // parsed response body as js object 
        console.log('timezonedb', data);

        userInfo.zoneName = data.zoneName;
        userRef.update({ zoneName: data.zoneName });
    });
}

function getLocationName(userRef, userInfo) {
    var coord = userInfo.coord;

    var caller = new Client();
    var url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coord.lat},${coord.lng}`;

    console.log('Determining name')

    caller.get(url, function(data, response) {
        // console.log('maps', data)

        var results = data.results;
        var location = '';

        // get longest locality
        for (var r = 0; r < results.length; r++) {
            var components = results[r].address_components;
            for (var i = 0; i < components.length; i++) {
                var component = components[i];
                if (component.types.includes('locality')) { //$.inArray('political', component.types)!=-1 &&
                    if (component.short_name.length > location.length) {
                        location = component.short_name;
                    }
                }
            }
        }

        if (!location) {
            location = '(unknown)'
        }

        console.log('==> ', location);

        userInfo.location = location;
        userRef.update({ location: location });
    });

}

function toQueryString(obj) {
    return Object.keys(obj).map(k => {
            return encodeURIComponent(k) + "=" + encodeURIComponent(obj[k])
        })
        .join("&");
}



module.exports = {
    getTimezoneInfo,
    getLocationName,
    getBusPage
};