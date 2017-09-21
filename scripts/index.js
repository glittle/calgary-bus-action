// for Azure Functions

let expressMockery = require("node-mocks-http");

const main = require('./main');



module.exports = function (context, req) {
    context.log('HTTP trigger - main');

    const console = function(){
        return {
            log: context.log
        }
    }();

    // See https://github.com/actions-on-google/actions-on-google-nodejs/issues/48

    console.log('context', context)
    console.log('req', req)

    // Prep the request and response.
    let mockRequest = expressMockery.createRequest({
        body: req.body,
        query: req.query,
        method: req.method
    });

    let mockResponse = expressMockery.createResponse({
    });

    console.log('mock req', mockRequest)
    console.log('mock resp', mockResponse)

    // We need this monkey patch because node-mocks-http doesn't have the append.
    mockResponse["append"] = (header, value) => {
        console.log("Google SDK added a header: \"" + header + "\": \"" + value + "\"");
    };

    main.handlePost(mockRequest, mockResponse);

    // context.res = JSON.stringify(assistant.response_._getData());
    context.res = mockResponse._getData(); 

    // if (req.query.name || (req.body && req.body.name)) {
    //     context.res = {
    //         // status: 200, /* Defaults to 200 */
    //         body: "Hello " + (req.query.name || req.body.name)
    //     };
    // }
    // else {
    //     context.res = {
    //         status: 400,
    //         body: "Please pass a name on the query string or in the request body"
    //     };
    // }
    context.done();
};