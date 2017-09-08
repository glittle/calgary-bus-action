const App = require('actions-on-google').ApiAiApp;

const externalInfo = require('./externalInfo');
const general = require('./general');
const transit = require('./transitKnowledge');
const moment = require('moment-timezone');
const dbHelper = require('./db');

console.log(' ');
console.log('======= SERVER RESTARTED ==============================');

const calgaryTimeZone = "America/Edmonton";

var knownUsers = null;

dbHelper.knownUsersRef.once('value', function(snapshot) {
    knownUsers = snapshot.val() || {};
    console.log('initial load from db', Object.keys(knownUsers).length, 'users.');
    // console.log(knownUsers);
});


function handlePost(request, response) {

    var now = new Date();
    var body = request.body;

    // console.log(request)
    // console.log('address', request.connection.remoteAddress)

    console.log('\r\n\r\n---------------------------');
    console.log('------ incoming POST ------');
    console.log(`---${now.toLocaleTimeString()}---`);
    const app = new App({
        request: request,
        response: response
    });
    console.log('Intent:', app.getIntent());
    console.log('Intent name:', body.result.metadata.intentName);
    console.log('From:', body.originalRequest.source, " Version:", body.originalRequest.version);
    console.log('Parameters:', body.result.parameters);
    // console.log('Body', JSON.stringify(body));

    // console.log('users', knownUsers);

    // determine who this is
    var userId = general.extractUserId(app, request);
    // console.log('userId', userId)
    var userInfo = knownUsers[userId];
    if (!userInfo) {
        userInfo = knownUsers[userId] = { times: 1 };
    }
    console.log('userInfo', userInfo);

    var userRef = dbHelper.knownUsersRef.child(userId);

    var times = (userInfo.times || 1) + 1;
    userRef.update({ last_access: now, times: times })
    userInfo.last_access = now;
    userInfo.times = times;

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
            askWithBestTime();
        }
    }

    function askMainWelcome() {
        askWithoutWhatElse([
            `Hi!  
        I can tell you when the next bus is coming to the stop you are currently at. 
        I'll remember the stop numbers you tell me, and when you ask for them so that next time you come back I can tell you the answer immediately!
        
        Please note, I'm a Calgarian and can only help out in Calgary, Canada with what Calgary Transit tells me!
        
        What stop number do you want to hear about?`
        ], [
            `Hi!  I can tell you when the next bus is coming to the stop you are currently at. I'll remember the stop numbers you tell me, and when you ask for them so that next time you come back I can tell you the answer immediately!
        
Please note, I'm a Calgarian and can only help out in Calgary, Canada with what Calgary Transit tells me.
        
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
            const timeRange = 45;
            const diffUnit = 'minutes';
            console.log('now', now.format(), timeRange, diffUnit);

            userInfo.requests.forEach(function(raw) {
                var r = JSON.parse(raw);
                const time1 = moment.tz(r.time, "HHmm", true, calgaryTimeZone);
                const test1 = time1.diff(now, diffUnit);
                console.log(time1.format(), test1);

                if (Math.abs(test1) <= timeRange) {
                    inRange.push(r);
                    return;
                }

                const time0 = moment(time1).subtract(24, 'hours');
                const test0 = time0.diff(now, diffUnit);
                console.log(time0.format(), test0);

                if (Math.abs(test0) <= timeRange) {
                    inRange.push(r);
                    return;
                }

                const time2 = moment(time1).add(24, 'hours');
                const test2 = time2.diff(now, diffUnit);
                console.log(time2.format(), test2);

                if (Math.abs(test2) <= timeRange) {
                    inRange.push(r);
                    return;
                }

                console.log('looking at', r.time, '--- not within', timeRange, diffUnit);
            });

            console.log(inRange);

            if (inRange.length) {
                var stops = inRange
                    .map(e => e.stop.toString())
                    .filter((el, i, a) => i === a.indexOf(el));
                console.log('asking for', stops)
                announceStopMultiple(stops);

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

    function forgetAll() {
        userInfo.requests = [];
        userRef.update({ requests: [] });

        ask([`Done. I've forgotten all the stops you've talked about.`], [`Done. I've forgotten all the stops you've talked about.`])
    }

    function forgetBus() {
        var which = body.result.parameters.which.toString();

        var requests = userInfo.requests = userInfo.requests.filter(r => JSON.parse(r).bus.toString() !== which);
        userRef.update({ requests: requests });

        ask([`Done. I've forgotten about route ${which}.`], [`Done. I've forgotten about route ${which}.`])
    }

    function forgetStop() {
        var which = body.result.parameters.which.toString();

        var requests = userInfo.requests = userInfo.requests.filter(r => JSON.parse(r).stop.toString() !== which);
        userRef.update({ requests: requests });

        ask([`Done. I've forgotten about stop number ${spacedOut(which)}.`], [`Done. I've forgotten about stop number ${which}.`])
    }

    // function announceStop1(stop) {
    //     stop = stop || body.result.parameters.stopNumber;

    //     var speech = [];
    //     var text = [];

    //     // speech.push(`You asked for ${spacedOut('' + stop)}.`);
    //     // text.push(`You asked for #${stop}.`)

    //     externalInfo.getBusPage(stop, function(info) {
    //         //Aug 30 2017 - 21:46:00 *
    //         console.log('call result', info);

    //         if (info.error) {
    //             text.push(info.error);
    //             speech.push(info.error);
    //             ask(speech, text);
    //             return;
    //         }

    //         var when = info.when;

    //         var realtime = when.slice(-1) === '*';
    //         if (realtime) {
    //             when = when.slice(0, -2);
    //         }

    //         const next = moment.tz(when, 'MMM DD YYYY - HH:mm:ss', true, calgaryTimeZone)

    //         const now = moment.tz(calgaryTimeZone);

    //         console.log(now.format())
    //         console.log(next.format())

    //         const howSoonMin = next.diff(now, 'minutes');
    //         // console.log('how soon', howSoonMin)
    //         if (howSoonMin > 120) {
    //             text.push(`${getRouteName(info.bus)} isn't scheduled at that stop within the next couple of hours.`)
    //             speech.push(`${getRouteName(info.bus)} isn't scheduled at that stop within the next couple of hours.`)

    //             ask(speech, text);
    //             return;
    //         }

    //         const howSoon = now.to(next);
    //         // console.log(howSoon);

    //         text.push(`${getRouteName(info.bus)} is ${realtime ? 'leaving' : 'scheduled to leave'} ${getStopName(stop)} ${howSoon}.`)
    //         speech.push(`${getRouteName(info.bus)} is ${realtime ? 'leaving' : 'scheduled to leave'} ${getStopName(stop, true)} ${howSoon}.`)

    //         storeRequestTime(now, stop, info.bus);

    //         ask(speech, text);
    //     });
    // }

    function announceStopMultiple(stops) {
        var speech = [];
        var text = [];

        const now = moment.tz(calgaryTimeZone);
        console.log(now.format())

        externalInfo.getBusPages(stops, function(infoList) {
            //Aug 30 2017 - 21:46:00 *

            infoList.forEach(function(info) {
                console.log('result', info);

                if (info.error) {
                    // TODO: handle when some are error and others are good
                    text.push(info.error);
                    speech.push(info.error);
                    return;
                }

                var when = info.when;

                info.realtime = when.slice(-1) === '*';
                if (info.realtime) {
                    when = when.slice(0, -2);
                }

                const next = moment.tz(when, 'MMM DD YYYY - HH:mm:ss', true, calgaryTimeZone)


                // console.log(next.format())

                info.howSoonMin = next.diff(now, 'minutes');
                info.howSoon = now.to(next);
            });


            infoList.sort(function(a, b) {
                return (a.howSoonMin || 999) < (b.howSoonMin || 999) ? -1 : 1;
            });


            infoList.forEach(function(info) {
                const howSoonMin = info.howSoonMin;
                const howSoon = info.howSoon;

                // console.log(howSoon);
                // console.log('how soon', howSoonMin)
                if (howSoonMin > 120) {
                    text.push(`${getRouteName(info.bus)} isn't scheduled at that stop within the next couple of hours.`)
                    speech.push(`${getRouteName(info.bus, true)} isn't scheduled at that stop within the next couple of hours.`)
                    return;
                }

                text.push(`${getRouteName(info.bus)} is ${info.realtime ? 'leaving' : 'scheduled to leave'} ${getStopName(info.stop)} ${howSoon}.`)
                speech.push(`${getRouteName(info.bus, true)} is ${info.realtime ? 'leaving' : 'scheduled to leave'} ${getStopName(info.stop, true)} ${howSoon}.`)

                storeRequestTime(now, info.stop, info.bus);
            });

            ask(speech, text);
        });
    }

    function getRouteName(routeNum, forSpeech) {
        routeNum = +routeNum;
        console.log('route num', routeNum)

        var name = transit.routeNames[routeNum];

        switch (routeNum) {
            case 201:
            case 202:
                return `The ${name}`;
        }

        if (name) {
            return `Bus ${readBusNum(routeNum, forSpeech)} (${name})`;
        }

        return `Bus ${routeNum}`;
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
        if (busNum <= 100) {
            return busNum;
        }
        return forSpeech ? spacedOut(busNum) : busNum;
    }

    function storeRequestTime(now, stop, busNumber) {
        /*
          at: [
            {time:'2311', stop:'6663', bus:'23'}
        ]
        */
        const when = now.format('HHmm');
        const entry = JSON.stringify({ time: when, stop: stop, bus: busNumber });

        const requests = userInfo.requests || [];
        if (!requests.includes(entry)) {
            requests.push(entry);
            userInfo.requests = requests;
            userRef.update({ requests: requests });
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
        app.ask({
            speech: '<speak>' + speech + '</speak>',
            displayText: text
        });
        console.log('Text', text)
        console.log('Speech', speech)
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
        return o.toString().split('').join(' ');
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

    function resetLocation() {
        var userInfo = knownUsers[userId];
        delete userInfo.coord;
        delete userInfo.location;
        delete userInfo.zoneName;
        userRef.set(userInfo);

        app.askForPermission('Sure. ', app.SupportedPermissions.DEVICE_PRECISE_LOCATION);
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

        Object.keys(knownUsers).forEach(function(key) {
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
        Object.keys(locations).forEach(function(key) {
            var num = locations[key];
            array.push(`${num} from ${key}`)
        });
        array.sort(function(a, b) {
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

    let actionMap = new Map();
    actionMap.set('input.welcome', welcome);
    actionMap.set('reset.bus.times', forgetAll);

    actionMap.set('forget.bus', forgetBus);
    actionMap.set('forget.stop', forgetStop);

    actionMap.set('add.stop', function() {
        announceStopMultiple([body.result.parameters.stopNumber]);
    });

    actionMap.set('who.am.i', whoAmI);
    actionMap.set('user.list', tellUsers);

    app.handleRequest(actionMap);
}


module.exports = {
    handlePost
}