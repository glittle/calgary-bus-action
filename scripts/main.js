const {
    dialogflow,
    BasicCard,
    BrowseCarousel,
    BrowseCarouselItem,
    Button,
    Carousel,
    Image,
    LinkOutSuggestion,
    List,
    MediaObject,
    Permission,
    Suggestions,
    SimpleResponse,
    Table,
} = require('actions-on-google');

const moment = require('moment-timezone');
const os = require('os');

const externalInfo = require('./externalInfo');
const general = require('./general');
const transit = require('./transitKnowledge');
const dbHelper = require('./db');

console.log(' ');
console.log('======= SERVER RESTARTED ==============================');

const calgaryTimeZone = "America/Edmonton";

var knownUsers = {};
var stopsWithMultipleBuses = {}; // stored temporarily. Don't store in firebase in case CT changes routes

dbHelper.knownUsersRef.once('value', function(snapshot) {
    knownUsers = snapshot.val() || {};
    console.log('initial load from db', Object.keys(knownUsers).length, 'users.');
    // console.log(knownUsers);
});


const appV2 = dialogflow({
    // debug: true,
});

function handlePost(request, response, console) {

    var now = new Date();
    // var body = request.body;

    var conv = null;
    var userInfo = {};
    var userId = '';
    var userRef = {};

    // console.log(request)
    // console.log('address', request.connection.remoteAddress)

    console.log('\r\n\r\n------------------------------------------------------');
    console.log('------ incoming POST ---------------------------------');
    console.log(`------ ${now.toLocaleTimeString()} ---`);
    // const app = new App({
    //     request: request,
    //     response: response
    // });

    // if (app.getArgument('is_health_check') === '1') {
    //     console.log('Health Check. Doing great!')
    //     app.tell(`Thanks for the health check! I'm feeling great!`)
    //     return;
    // }

    // console.log('Intent:', app.getIntent());
    // console.log('Intent name:', body.result.metadata.intentName);
    // // console.log('From:', body.originalRequest.source, " Version:", body.originalRequest.version);
    // console.log('Parameters:', body.result.parameters);
    // console.log('Body', JSON.stringify(body));

    // console.log('users', knownUsers);

    // determine who this is
    // var userId = general.extractUserId(app, request);
    // // console.log('userId', userId)
    // var userInfo = knownUsers[userId];
    // if (!userInfo) {
    //     userInfo = knownUsers[userId] = {
    //         times: 1
    //     };
    // }
    // console.log('userInfo', userId, userInfo);

    // var userRef = dbHelper.knownUsersRef.child(userId);

    // var times = (userInfo.times || 1) + 1;
    // userRef.update({
    //     last_access: now,
    //     times: times
    // })
    // userInfo.last_access = now;
    // userInfo.times = times;

    // console.log(app.getUser())

    // try {
    //   console.log(4)
    //   app.askForPermission('To address you by name', [app.SupportedPermissions.NAME]);
    //   console.log(5);
    // } catch (error) {
    //   console.log(3, error)
    // }

    function welcome() {
        // console.log('default welcome')
        if (userInfo.times === 1) {
            askMainWelcome();
        } else {
            return askWithBestTime();
        }
    }

    function askMainWelcome() {
        askWithoutWhatElse([
            `Hi!
        I can tell you when the next bus or train is coming to the stop you are currently at.
        I'll remember the stop numbers you tell me, and when you ask for them so that next time you come back I can tell you the answer immediately!

        Please note, I'm a Calgarian and can only help out in Calgary, Canada with what Calgary Transit tells me!

        (I'm also still learning, so if you want me to help you more, please let my developer know!)

        What stop number do you want to hear about?`
        ], [
            `Hi!  I can tell you when the next bus or train is coming to the stop you are currently at. I'll remember the stop numbers you tell me, and when you ask for them so that next time you come back I can tell you the answer immediately!

Please note, I'm a Calgarian and can only help out in Calgary, Canada with what Calgary Transit tells me.

(I'm also still learning, so if you want me to help you more, please let my developer know!)

What stop number do you want to hear about?`
        ]);
    }

    function askWithBestTime() {
        const now = moment.tz(calgaryTimeZone);
        if (userInfo.requests) {
            var inRange = [];
            var speech = [];
            var text = [];

            // find within the hour
            const timeRange = 30;
            const diffUnit = 'minutes';
            // console.log('now', now.format(), timeRange, diffUnit);

            userInfo.requests.forEach(function(raw) {
                var r = JSON.parse(raw);
                const time1 = moment.tz(r.time, "HHmm", true, calgaryTimeZone);
                const test1 = time1.diff(now, diffUnit);
                // console.log(time1.format(), test1);

                if (Math.abs(test1) <= timeRange) {
                    inRange.push(r);
                    return;
                }

                const time0 = moment(time1).subtract(24, 'hours');
                const test0 = time0.diff(now, diffUnit);
                // console.log(time0.format(), test0);

                if (Math.abs(test0) <= timeRange) {
                    inRange.push(r);
                    return;
                }

                const time2 = moment(time1).add(24, 'hours');
                const test2 = time2.diff(now, diffUnit);
                // console.log(time2.format(), test2);

                if (Math.abs(test2) <= timeRange) {
                    inRange.push(r);
                    return;
                }

                // console.log('looking at', r.time, '--- not within', timeRange, diffUnit);
            });

            console.log('buses at this time', inRange);

            if (inRange.length) {
                var stops = inRange
                    .map(function(el) {
                        return {
                            bus: el.bus,
                            stop: el.stop
                        }
                    })
                    .filter((el, i, a) => i === a.indexOf(el));
                console.log('asking for', stops)
                return announceStopMultiple(stops);

            } else {
                askWithoutWhatElse([
                    `What stop number do you want to hear about?`
                ], [
                    `What stop number do you want to hear about?`
                ]);
                return;
            }



        } else {
            askMainWelcome();
        }
    }

    function listRemembered() {
        console.log(userInfo.requests);
        var speech = [];
        var text = [];

        var list = userInfo.requests;
        if (!list || list.length === 0) {
            text.push(`I don't know which stops you want to hear about.`);
            speech.push(`I don't know which stops you want to hear about.`);
        } else {
            list.forEach(function(stopInfo) {
                var stopTime = JSON.parse(stopInfo);
                const time1 = moment.tz(stopTime.time, "HHmm", true, calgaryTimeZone).format('h:mm a');

                text.push(`At ${time1}, stop ${stopTime.stop} for bus ${stopTime.bus}.\n`);
                speech.push(`At ${time1}, stop ${spacedOut(stopTime.stop)} for bus ${stopTime.bus}. `);
            });
        }

        ask(speech, text);
    }

    function forgetAll() {
        userInfo.requests = [];
        userRef.update({
            requests: []
        });

        ask([`Done. I've forgotten all the stops you've talked about.`], [`Done. I've forgotten all the stops you've talked about.`])
    }

    function forgetBus() {
        var which = conv.parameters.which.toString();

        var requests = userInfo.requests = userInfo.requests.filter(r => JSON.parse(r).bus.toString() !== which);
        userRef.update({
            requests: requests
        });

        ask([`Done. I've forgotten about route ${which}.`], [`Done. I've forgotten about route ${which}.`])
    }

    function forgetStop() {
        var which = conv.parameters.which.toString();

        var requests = userInfo.requests = userInfo.requests.filter(r => JSON.parse(r).stop.toString() !== which);
        userRef.update({
            requests: requests
        });

        ask([`Done. I've forgotten about stop number ${spacedOut(which)}.`], [`Done. I've forgotten about stop number ${which}.`])
    }

    function addStop() {
        var stop = +conv.parameters.stopNumber;
        if (stop < 1000 || stop > 9999) {
            var msg = 'Stop numbers are 4 digit numbers. Please try again!';
            ask([msg], [msg]);
            return;
        }

        conv.data.stop = stop;

        return announceStopMultiple([{
            stop: stop
        }], true, true);
    }

    function whichBusAtStop() {

        // var bus = app.getContextArgument('actions_intent_option', 'OPTION').value
        // var stop = app.getContextArgument('_actions_on_google_', 'stopNumber').value
        // var bus = body.result.parameters.bus;
        //var stop = body.result.parameters.stopNumber;
        // var bus = conv.parameters.bus;
        var bus = conv.arguments.parsed.input.OPTION;
        var stop = conv.parameters.stopNumber || conv.data.stop;


        console.log('bus/stop', bus, stop);
        // var knownList = stopsWithMultipleBuses[stop];
        console.log('known list', stopsWithMultipleBuses);

        console.log(bus, stop);
        if (!stop) {
            var msg = `Sorry, I didn't get the stop number.`
            ask([msg], [msg]);
            return;
        }

        return announceStopMultiple([{
            stop: stop,
            bus: bus
        }], true);
    }

    async function testCalls() {
        var result = await externalInfo.testCalls();
        console.log('resultOK', result);
        ask(['Done1'], ['Done1']);
    }

    async function announceStopMultiple(stopInfos, saveForFuture, addingNewStop) {
        var speech = [];
        var text = [];

        const now = moment.tz(calgaryTimeZone);

        var stop = stopInfos[0].stop;

        if (addingNewStop) {
            var knownList = stopsWithMultipleBuses[stop];
            if (knownList) {
                console.log('known list!', knownList);
                return askWhichBusAtStop(stop, knownList);
            }
        }

        var infoList = await externalInfo.getBusPages(stopInfos, addingNewStop);

        console.log('AFTER AWAIT', infoList);

        if (infoList.length === 0) {
            text.push(`Sorry, I couldn't find any active buses for stop ${stop}!`);
            speech.push(`Sorry, I couldn't find any active buses for stop ${spacedOut(stop)}!`);
            ask(speech, text);
            return;
        }

        if (addingNewStop && infoList.length === 1 && infoList[0].busList) {
            var busList = infoList[0].busList;

            stopsWithMultipleBuses[stopInfos[0].stop] = busList;

            console.log('returning 1');
            return askWhichBusAtStop(stopInfos[0].stop, busList);
        }

        infoList.forEach(function(info) {
            console.log('result', info);

            if (info.error) {
                // TODO: handle when some are error and others are good
                text.push(info.error);
                speech.push(info.error);
                ask(speech, text);
                return Promise.resolve();
            }

            var when = info.when;

            info.realtime = when.slice(-1) === '*';
            if (info.realtime) {
                when = when.slice(0, -2);
            }

            const next = moment.tz(when, 'MMM DD YYYY - HH:mm:ss', true, calgaryTimeZone);


            // console.log(next.format())

            info.howSoonMin = next.diff(now, 'minutes');
            info.howSoon = now.to(next);
        });


        infoList.sort(function(a, b) {
            return (a.howSoonMin || 999) < (b.howSoonMin || 999) ? -1 : 1;
        });


        infoList.forEach(function(info) {
            if (info.error || info.busList) {
                return;
            }

            const howSoonMin = info.howSoonMin;
            const howSoon = info.howSoon;

            // console.log(howSoon);
            // console.log('how soon', howSoonMin)
            if (howSoonMin > 120) {
                text.push(`${getRouteName(info.bus)} isn't scheduled at ${getStopName(info.stop)} within the next couple of hours.`)
                speech.push(`${getRouteName(info.bus, true)} isn't scheduled at ${getStopName(info.stop, true)} within the next couple of hours.`)
                return;
            }

            text.push(`${getRouteName(info.bus)} ${info.realtime ? 'is leaving' : 'should leave'} ${howSoon} from ${getStopName(info.stop)}.`)
            speech.push(`${getRouteName(info.bus, true)} ${info.realtime ? 'is leaving' : 'should leave'} ${howSoon} from ${getStopName(info.stop, true)}.`)

            if (saveForFuture) {
                storeRequestTime(now, info.stop, info.bus);
            }
        });

        ask(speech, text);

    }

    function getRouteName(routeNum, forSpeech, nameOnly) {
        routeNum = +routeNum;
        // console.log('route num', routeNum)

        var name = transit.routeNames[routeNum];

        switch (routeNum) {
            case 201:
            case 202:
                return nameOnly ? name : `A ${name}`;
        }

        if (name) {
            return nameOnly ? name : `Bus ${readBusNum(routeNum, forSpeech)} (${name})`;
        }

        console.log('** Route name not found for', routeNum);

        return `Bus ${routeNum}`;
    }

    function askWhichBusAtStop(stop, busList) {
        busList.sort(function(a, b) {
            return +a < +b ? -1 : 1
        });


        var busStrList = [];
        var speechList = [`Multiple routes use stop ${spacedOut(stop)}. Which route number are you interested in? `];
        var numInList = busList.length;

        var askListTemp = [];

        busList.forEach(function(bNum, i) {
            var title = '' + bNum;
            busStrList.push(title);
            var bNameShort = getRouteName(bNum, false, true);
            var description = getRouteName(bNum, false, false);
            var synonyms = [title, bNameShort]
                .concat(bNameShort
                    .split(' '));
            console.log(description);
            askListTemp.push({
                optionInfo: {
                    key: title,
                    synonyms,
                },
                title,
                description
            });
            // askList.addItems(
            //     app
            //     .buildOptionItem(bStr, synonyms)
            //     .setTitle(bStr)
            //     .setDescription(bName)
            // );

            if (i === numInList - 1) {
                speechList.push(' or ');
            }
            speechList.push(description);
        });
        // console.log('before', askListTemp);
        removeDuplicates(askListTemp);
        // console.log('after', askListTemp);

        // askListTemp.forEach(function (info) {
        //     // askList.addItems(
        //     //     app
        //     //     .buildOptionItem(info.bStr, info.synonyms)
        //     //     .setTitle(info.bStr)
        //     //     .setDescription(info.bNameLong)
        //     //     // .setImage('data:image/svg+xml;charset=US-ASCII,<%3Fxml%20version%3D"1.0"%20encoding%3D"utf-8"%3F><!DOCTYPE%20svg%20PUBLIC%20"-%2F%2FW3C%2F%2FDTD%20SVG%201.1%2F%2FEN"%20"http%3A%2F%2Fwww.w3.org%2FGraphics%2FSVG%2F1.1%2FDTD%2Fsvg11.dtd"><svg%20version%3D"1.1"%20id%3D"Layer_1"%20xmlns%3D"http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg"%20xmlns%3Axlink%3D"http%3A%2F%2Fwww.w3.org%2F1999%2Fxlink"%20x%3D"0px"%20y%3D"0px"%20%20viewBox%3D"0%200%2030%2030"%20enable-background%3D"new%200%200%2030%2030"%20xml%3Aspace%3D"preserve"%20width%3D"30"%20height%3D"30"><g>%20<path%20fill%3D"%234F5D73"%20d%3D"M8.3%2C28.5c0%2C0.8-0.7%2C1.5-1.5%2C1.5H5.3c-0.8%2C0-1.5-0.7-1.5-1.5v-8.2c0-0.8%2C0.7-1.5%2C1.5-1.5h1.5%20%20c0.8%2C0%2C1.5%2C0.7%2C1.5%2C1.5V28.5z"%2F>%20<path%20fill%3D"%234F5D73"%20d%3D"M26.3%2C28.5c0%2C0.8-0.7%2C1.5-1.5%2C1.5h-1.5c-0.8%2C0-1.5-0.7-1.5-1.5v-8.2c0-0.8%2C0.7-1.5%2C1.5-1.5h1.5%20%20c0.8%2C0%2C1.5%2C0.7%2C1.5%2C1.5V28.5z"%2F>%20<rect%20x%3D"1.5"%20y%3D"17.6"%20fill%3D"%23B83A3F"%20width%3D"26.9"%20height%3D"9.3"%2F>%20<path%20fill%3D"%23B83A3F"%20d%3D"M27.9%2C3.8C25.5%2C0%2C24.4%2C0%2C16%2C0H14C5.6%2C0%2C4.5%2C0%2C2.1%2C3.8c-0.2%2C2.8-0.6%2C11-0.6%2C11V18H14H16h12.4v-3.2%20%20C28.5%2C14.8%2C28.1%2C6.5%2C27.9%2C3.8z"%2F>%20<path%20fill%3D"%23AEDFF4"%20d%3D"M26.2%2C12.8l-0.5-7.5h-9.1v0H4.3l-0.5%2C7.5c-0.3%2C2.6%2C2.8%2C2.3%2C2.8%2C2.3h6.8v0h10C23.4%2C15.1%2C26.5%2C15.4%2C26.2%2C12.8%20%20z"%2F>%20<path%20fill%3D"%23FFFFFF"%20d%3D"M21.5%2C3.4c0%2C0.4-0.3%2C0.7-0.7%2C0.7H9.3c-0.4%2C0-0.7-0.3-0.7-0.7V2.3c0-0.4%2C0.3-0.7%2C0.7-0.7h11.5%20%20c0.4%2C0%2C0.7%2C0.3%2C0.7%2C0.7V3.4z"%2F>%20<circle%20fill%3D"%23E0995E"%20cx%3D"6"%20cy%3D"22.5"%20r%3D"1.5"%2F>%20<circle%20fill%3D"%23E0995E"%20cx%3D"24"%20cy%3D"22.5"%20r%3D"1.5"%2F><%2Fg><%2Fsvg>', 'Math & prime numbers')
        //     // );
        //     askList.items.push({
        //         [info.bStr]: {
        //             synonyms: info.synonyms,
        //             title: info.bStr,
        //             description: info.bNameLong,
        //         }
        //     });
        // });
        // var askList = app.buildList('Buses using stop ' + stop);
        var askList = new List({
            title: 'Buses using stop ' + stop,
            items: askListTemp
        });

        // app.setContext('contextWhichBus', 2);
        conv.data.contextWhichBus = 2;
        // app.askWithList(
        //     app
        //     .buildRichResponse()
        //     .addSimpleResponse({
        //         displayText: 'Multiple routes use that stop. Which route number are you interested in?',
        //         speech: 'Multiple routes use that stop. Which route number are you interested in? ' +
        //             speechList.join(', ')
        //     })
        //     .addSuggestions(busStrList),
        //     askList);
        askWithoutWhatElse(speechList, [`Multiple routes use stop ${stop}. Which route number are you interested in?`]);
        conv.ask(new Suggestions(busStrList));
        conv.ask(askList);
    }

    function removeDuplicates(list) {
        var termCount = {};
        // two passes
        list.forEach(function(info) {
            info.optionInfo.synonyms.forEach(function(s) {
                termCount[s] = (termCount[s] || 0) + 1;
            });
        });
        list.forEach(function(info) {
            info.optionInfo.synonyms = info.optionInfo.synonyms.filter(function(s) {
                return termCount[s] === 1;
            });
        });
    }

    function getStopName(stopNum, forSpeech) {
        var forCtrain = transit.ctrainStops[stopNum];

        if (forCtrain) {
            return `the ${forCtrain.name} station ${forSpeech ? '' : `(stop ${stopNum})`} heading ${getHeading(forCtrain.dir)}`
        }

        return forSpeech ? `stop ${spacedOut(stopNum)}` : `stop ${stopNum}`;
    }

    function getHeading(dir) {
        var result = dir;
        switch (dir) {
            case 'E':
                result = 'east';
                break;
            case 'S':
                result = 'south';
                break;
            case 'N':
                result = 'north';
                break;
            case 'W':
                result = 'west';
                break;
        }
        return result;
    }

    function readBusNum(busNum, forSpeech) {
        // if (busNum <= 100) {
        //     return busNum;
        // }
        return busNum;
        // return forSpeech ? spacedOut(busNum) : busNum;
    }

    function storeRequestTime(now, stop, busNumber) {
        /*
          at: [
            {time:'2311', stop:'6663', bus:'23'}
        ]
        */
        const when = now.format('HHmm');
        const entry = JSON.stringify({
            time: when,
            stop: stop,
            bus: busNumber
        });

        const requests = userInfo.requests || [];
        if (!requests.includes(entry)) {
            requests.push(entry);
            userInfo.requests = requests;
            userRef.update({
                requests: requests
            });
        }
    }


    function askWithoutWhatElse(speech, text) {
        ask(speech, text, true)
    }

    function ask(speech, text, doNotAddWhatElse) {
        if (!doNotAddWhatElse) {
            addWhatElse(speech, text);
        }

        speech = speech.join(' ');
        text = text.join(' ');
        conv.ask(new SimpleResponse({
            speech: '<speak>' + speech + '</speak>',
            text: text
        }));
        console.log('Text:', text)
        console.log('Speech:', speech)
    }

    function addWhatElse(speech, text) {
        const msgs = [
            'What other stop number do you want to know about?',
            'If you are done, just say "Goodbye"!',
            'What else can I tell you?'
        ]
        var max = msgs.length;
        var msg = msgs[Math.floor(Math.random() * (max - 1))];

        speech.push('<break time="1s"/>' + msg);
        text.push('\n\n' + msg);
    }


    function spacedOut(o) {
        return (o || '').toString().split('').join(' ');
    }

    function whoAmI(app) {
        //    <say-as interpret-as="characters">${spacedOut(userId)}</say-as>
        var speech = [userId !== 'sandbox' ?
            `Your user ID is ${spacedOut(userId)}<break time="1s"/> (Wow! That was quite a mouthful!)` :
            `You are using the sandbox, you don't have an ID.`
        ];

        var text = [userId !== 'sandbox' ?
            `Your user ID is ${userId}.` :
            `You are using the sandbox, you don't have an ID.`
        ];

        ask(speech, text)
    }

    function getNearbyStops1() {
        // var speech = [];
        // var text = [];
        // text.push(`Sorry, I can't get nearby stops from Calgary Transit right now.`);
        // speech.push(`Sorry, I can't get nearby stops from Calgary Transit right now.`);
        // askWithoutWhatElse(speech, text);
        // return;

        // app.askForPermission('Okay', app.SupportedPermissions.DEVICE_PRECISE_LOCATION);

        conv.ask(new Permission({
            context: 'Okay, ',
            permissions: 'DEVICE_PRECISE_LOCATION'
        }));

    }

    function getNearbyStops2() {
        const location = conv.device.location;

        if (location) {
            /*
                "coordinates": {
                  "latitude": 51.1004367,
                  "longitude": -113.95960439999999
                }
            */
            var coordRaw = location.coordinates;
            let coord = {
                lat: coordRaw.latitude,
                lng: coordRaw.longitude
            };
            console.log(`${coord.lat},${coord.lng}`);
            return externalInfo.getNearbyStops(coord, function (info) {
                var speech = [];
                var text = [];

                var combined = {};
                info.stops.forEach(function (s) {
                    if (!combined[s.desc]) {
                        combined[s.desc] = {};
                    }
                    combined[s.desc][s.stop] = true;
                });

                var combinedKeys = Object.keys(combined).splice(0, 6);
                var numInList = combinedKeys.length;

                var numDesc;
                switch (numInList) {
                    case 0:
                        numDesc = 'Sorry. There are no stops nearby.';
                        break;
                    case 1:
                        numDesc = 'Here is the stop near you.';
                        break;
                    default:
                        numDesc = `Here are ${numInList} nearby stops.`;
                        break;
                }

                text.push(`Google told me that you are near ${info.assumedAddress}. ${numDesc}`);
                speech.push(`Google told me that you are near ${info.assumedAddress}. ${numDesc}`);

                var stops = [];
                combinedKeys.forEach(function (desc, i) {
                    var stopsRemaining = Object.keys(combined[desc]);
                    stopsRemaining.sort();
                    var first = stopsRemaining.shift();
                    var stopsText = [first];
                    var stopsSpeech = [spacedOut(first)];
                    stops.push(first);

                    var numRemaining = stopsRemaining.length;
                    stopsRemaining.forEach(function (s, stopI) {
                        if (stopI === numRemaining - 1) {
                            stopsText.push(' and ');
                            stopsSpeech.push(' and ');
                        } else {
                            stopsText.push(', ');
                            stopsSpeech.push(', ');
                        }
                        stopsText.push(s);
                        stopsSpeech.push(spacedOut(s));
                        stops.push(s);
                    });

                    text.push(`\n\n${fixAddress(desc, true)} - Stop${stopsText.length===1?'':'s'} ${stopsText.join('')}.`);

                    if (i === numInList - 1) {
                        speech.push(' or, ');
                    }
                    speech.push(`${fixAddress(desc)} - Stop${stopsSpeech.length===1?'':'s'} number ${stopsSpeech.join('')}. `);
                });

                speech.push('Which stop number are you interested in?');
                text.push('\n\nWhich stop number are you interested in?');

                askWithoutWhatElse(speech, text);

                conv.ask(new Suggestions(stops));
            });
            // console.log('main', stopsList);
            // var askList = app.buildList('Stops near ' + info.assumedAddress);

            // var busStrList = [];
            // var speechList = [];
            // var numInList = info.stops.length;

            // var askListTemp = [];

            // info.stops.forEach(function(stopInfo, i) {

            //     var synonyms = [stopInfo.desc]
            //         .concat(stopInfo.desc.split(' '));
            //     askListTemp.push({
            //             bStr: stopInfo.stop,
            //             synonyms,
            //             bNameLong: stopInfo.desc
            //         })

            //     if (i === numInList - 1) {
            //         speechList.push(' or ');
            //     }
            //     speechList.push(spacedOut(stopInfo.stop) + ': ' + fixAddress(stopInfo.desc));
            // });

            //  console.log('before', askListTemp);
            // removeDuplicates(askListTemp);
            //  console.log('after', askListTemp);

            // askListTemp.forEach(function(info) {
            //     askList.addItems(
            //         app
            //         .buildOptionItem(info.bStr, info.synonyms)
            //         .setTitle(info.bStr)
            //         .setDescription(info.bNameLong)
            //         // .setImage('data:image/svg+xml;charset=US-ASCII,<%3Fxml%20version%3D"1.0"%20encoding%3D"utf-8"%3F><!DOCTYPE%20svg%20PUBLIC%20"-%2F%2FW3C%2F%2FDTD%20SVG%201.1%2F%2FEN"%20"http%3A%2F%2Fwww.w3.org%2FGraphics%2FSVG%2F1.1%2FDTD%2Fsvg11.dtd"><svg%20version%3D"1.1"%20id%3D"Layer_1"%20xmlns%3D"http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg"%20xmlns%3Axlink%3D"http%3A%2F%2Fwww.w3.org%2F1999%2Fxlink"%20x%3D"0px"%20y%3D"0px"%20%20viewBox%3D"0%200%2030%2030"%20enable-background%3D"new%200%200%2030%2030"%20xml%3Aspace%3D"preserve"%20width%3D"30"%20height%3D"30"><g>%20<path%20fill%3D"%234F5D73"%20d%3D"M8.3%2C28.5c0%2C0.8-0.7%2C1.5-1.5%2C1.5H5.3c-0.8%2C0-1.5-0.7-1.5-1.5v-8.2c0-0.8%2C0.7-1.5%2C1.5-1.5h1.5%20%20c0.8%2C0%2C1.5%2C0.7%2C1.5%2C1.5V28.5z"%2F>%20<path%20fill%3D"%234F5D73"%20d%3D"M26.3%2C28.5c0%2C0.8-0.7%2C1.5-1.5%2C1.5h-1.5c-0.8%2C0-1.5-0.7-1.5-1.5v-8.2c0-0.8%2C0.7-1.5%2C1.5-1.5h1.5%20%20c0.8%2C0%2C1.5%2C0.7%2C1.5%2C1.5V28.5z"%2F>%20<rect%20x%3D"1.5"%20y%3D"17.6"%20fill%3D"%23B83A3F"%20width%3D"26.9"%20height%3D"9.3"%2F>%20<path%20fill%3D"%23B83A3F"%20d%3D"M27.9%2C3.8C25.5%2C0%2C24.4%2C0%2C16%2C0H14C5.6%2C0%2C4.5%2C0%2C2.1%2C3.8c-0.2%2C2.8-0.6%2C11-0.6%2C11V18H14H16h12.4v-3.2%20%20C28.5%2C14.8%2C28.1%2C6.5%2C27.9%2C3.8z"%2F>%20<path%20fill%3D"%23AEDFF4"%20d%3D"M26.2%2C12.8l-0.5-7.5h-9.1v0H4.3l-0.5%2C7.5c-0.3%2C2.6%2C2.8%2C2.3%2C2.8%2C2.3h6.8v0h10C23.4%2C15.1%2C26.5%2C15.4%2C26.2%2C12.8%20%20z"%2F>%20<path%20fill%3D"%23FFFFFF"%20d%3D"M21.5%2C3.4c0%2C0.4-0.3%2C0.7-0.7%2C0.7H9.3c-0.4%2C0-0.7-0.3-0.7-0.7V2.3c0-0.4%2C0.3-0.7%2C0.7-0.7h11.5%20%20c0.4%2C0%2C0.7%2C0.3%2C0.7%2C0.7V3.4z"%2F>%20<circle%20fill%3D"%23E0995E"%20cx%3D"6"%20cy%3D"22.5"%20r%3D"1.5"%2F>%20<circle%20fill%3D"%23E0995E"%20cx%3D"24"%20cy%3D"22.5"%20r%3D"1.5"%2F><%2Fg><%2Fsvg>', 'Math & prime numbers')
            //     );
            // });

            // app.askWithList(
            //     app
            //     .buildRichResponse()
            //     .addSimpleResponse({
            //         displayText: `Google told me that you are near ${info.assumedAddress}. Here are stops near there. Which would you like to know more about?`,
            //         speech: `Google told me that you are near ${info.assumedAddress}. Here are stops near there. Which would you like to know more about? ` +
            //             speechList.join(', ')
            //                             })
            //     .addSuggestions(busStrList),
            //     askList);

        } else {
            var msg = [`Sorry, I didn't catch that.`]
            ask(msg, msg);
        }
    }

    function fixAddress(s, onlyFirst) {
        s = s
            .replace(/NE/g, '') //North east') -- these are just extra noise when dealing with a small local area
            .replace(/NW/g, '') //'North west')
            .replace(/SW/g, '') //'South west')
            .replace(/SE/g, '') //'South east')
        if (onlyFirst) {
            return s.trim();
        }
        s = s.replace(/DR/g, 'Drive')
            .replace(/EB/g, 'east bound')
            .replace(/WB/g, 'west bound')
            .replace(/NB/g, 'north bound')
            .replace(/SB/g, 'south bound')
            .replace(/CR/g, 'cresent')
            .replace(/BV/g, 'boulevard')
            .replace(/AV/g, 'avenue')
            .replace(/E\./g, 'east')
            .replace(/W\./g, 'west')
        return s;
    }

    function tellLocation() {
        var speech = [];
        var text = [];
        if (userInfo.location) {
            speech.push(`From what I've learned, you are in ${userInfo.location}.`);
            text.push(`From what I've learned, you are in ${userInfo.location}.`);
        } else {
            speech.push(`Sorry, I don't know where you are!`);
            text.push(`Sorry, I don't know where you are!`);
        }

        if (userInfo.zoneName) {
            speech.push(`You are in the ${userInfo.zoneName.replace(/\//, ': ').replace(/_/g, ' ')} timezone.`);
            text.push(`You are in the ${userInfo.zoneName} timezone.`);

            var now = moment.tz(userInfo.zoneName);
            var time = now.format('h:mm a')

            speech.push(`It is about <say-as interpret-as="time" format="hms12">${time}</say-as> right now.`);
            text.push(`It is about ${time} right now.`);

        } else {
            speech.push(`I don't know what timezone you are in.`);
            text.push(`I don't know what timezone you are in.`);
        }

        ask(speech, text);
    }


    function tellUsers() {
        var speech = [];
        var text = [];

        var locations = {};
        const somewhere = 'an unknown location';

        Object.keys(knownUsers).forEach(function (key) {
            var u = knownUsers[key];
            var loc = u.location || somewhere;
            if (loc) {
                if (locations[loc]) {
                    locations[loc]++;
                } else {
                    locations[loc] = 1;
                }
            }
        });
        var array = [];
        Object.keys(locations).forEach(function (key) {
            var num = locations[key];
            array.push(`${num} from ${key}`)
        });
        array.sort(function (a, b) {
            if (a === somewhere) return 1;
            return a <= b ? -1 : 1
        });
        if (array.length > 1) {
            array[array.length - 1] = 'and ' + array[array.length - 1];
        }

        speech.push(`I've talked to ${Object.keys(knownUsers).length} people so far! ${array.join(', ')}.`);

        text.push(`I've talked to ${Object.keys(knownUsers).length} people so far! \n${array.join('\n')}.`);

        ask(speech, text);
    }

    // function testDev1() {
    //     //testDev2
    //     externalInfo.calloutToApiAi('testDev2', body.sessionId);

    //     ask(['this is test dev 1'], ['this is test dev 1'])
    // }

    function testDevD() {
        var msg = `My host's name is: ${os.hostname()}.`;
        ask([msg], [msg])
    }

    function getUserInfo() {

        userId = conv.data.Id || conv.user.storage.Id || '';

        if (!userId) {
            var verified = conv.user.verification === 'VERIFIED';

            if (verified) {
                userId = general.makeUserId();
                conv.user.storage.Id = userId;
                conv.data.Id = userId;
                console.log('New id: ', conv.user.storage.Id);
            } else {
                userId = '';
            }
        }

        if (!userId) {
            console.log('No id');
            return;
        }

        // user.storage sometimes doesn't work
        conv.data.Id = userId;

        console.log('Using id: ', userId);

        // determine who this is
        // userId = general.extractUserId(request);
        // console.log('userId', userId)
        userInfo = knownUsers[userId];
        if (!userInfo) {
            userInfo = knownUsers[userId] = {
                times: 1
            };
        }
        console.log('userInfo', userInfo);

        userRef = dbHelper.knownUsersRef.child(userId);

        var times = (userInfo.times || 1) + 1;
        userInfo.last_access = now;
        userInfo.times = times;

        userRef.update({
            times: times,
            last_access: now
        });
    }


    let actionMap = new Map();

    appV2.fallback((incomingConv) => {

        // assign to global
        conv = incomingConv;
        // console.log('Conv', conv);
        console.log('User Storage', conv.user.storage);
        console.log('Data', conv.data);

        conv.isDeepLink = conv.type === 'NEW';

        getUserInfo();

        // console.log('User', conv.user);
        console.log('Parameters', conv.parameters);
        console.log('Arguments', conv.arguments);
        // console.log('Type', conv.type);
        // console.log('Device', conv.device);

        const fn = actionMap.get(conv.action);

        if (fn) {
            console.log(`Intent: ${conv.action} (${conv.intent}) --> ${fn.name}`);
            return fn();
        }

        conv.ask(`I couldn't understand. Can you say that again and again?`);
    });


    actionMap.set('input.welcome', welcome);
    actionMap.set('reset.bus.times', forgetAll);
    actionMap.set('my.bus.stops', listRemembered);

    actionMap.set('forget.bus', forgetBus);
    actionMap.set('forget.stop', forgetStop);

    actionMap.set('add.stop', addStop);
    // action has hardcoded actions_intent_option event in it
    // actionMap.set('add.stop.whichbus', whichBusAtStop);
    actionMap.set('add.stop.fallback', whichBusAtStop);

    actionMap.set('get.nearby', getNearbyStops1);
    actionMap.set('get.nearby.fallback', getNearbyStops2);

    actionMap.set('who.am.i', whoAmI);
    actionMap.set('user.list', tellUsers);

    // actionMap.set('test.dev.1', testDev1);
    actionMap.set('test.dev.d', testDevD);
    actionMap.set('test.call', testCalls);

    appV2(request, response);
}


module.exports = {
    handlePost
}
