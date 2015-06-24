var npmInfo = require('./package.json');

module.exports = function(){
  console.log("Node Env Variable: " + process.env.NODE_ENV);

  // istanbul ignore next: don't look at the env variables
  switch(process.env.NODE_ENV){
    case null:
    case undefined:
    case "local":
      return {
        env: 'local', //should be env/prod
        dbURI : "mongodb://localhost/" + npmInfo.name,
        apiURI : "http://localhost",
        apiDomain : "localhost", //TODO use path from apiURI
        expressPort: 3000,
        loggerLevel: 'info',
        appName: 'lightTribe', // we use this for cloudinary name
        github: {
          name: 'lightTribe', // repo name in github
          pagesURL: 'http://codehatcher.github.io/lightTribe'
        },
        google: {
          places: {
            apiKey: 'AIzaSyAnojt8rFHBUdU6yvlYL8ZSTjxnjsScdSw'
          }
        },
        cloudinary: {
          cloud_name: 'codehatcher',
          api_key: '351392996945264',
          api_secret: '9K-IqFmehCD_zwSo8w_FhruOgjw'
        },
        facebook: {
          clientID: '761889610566980',
          clientSecret: 'a9ef59fe683dbb0e3e60254f45d9a2f9'
        },
        swagger: {
          // make sure responses to client are validated automatically against schema
          validateResponse: false
        },
        cert: { // apple certificate password
          passphrase: '123',
          filename: 'dev.p12',
          production: false
        }
      };
    case "dev":
    case "development":
      return {
        env: 'dev', //should be env/prod
        dbURI : process.env.MONGODB_URI,
        expressPort: process.env.PORT,
        apiURI: process.env.apiURI,
        apiDomain : process.env.apiDomain,
        loggerLevel: 'info',
        appName: 'lightTribe',
        github: {
          name: 'lightTribe', // repo name in github
          pagesURL: 'http://codehatcher.github.io/lightTribe'
        },
        google: {
          places: {
            apiKey: 'AIzaSyAnojt8rFHBUdU6yvlYL8ZSTjxnjsScdSw'
          }
        },
        cloudinary: {
          cloud_name: 'codehatcher',
          api_key: '351392996945264',
          api_secret: process.env.cloudinarySecret
        },
        facebook: {
          clientID: '761889610566980',
          clientSecret: process.env.facebookSecret
        },
        swagger: {
          validateResponse: false
        },
        cert: { // apple certificate password
          passphrase: '123',
          filename: 'dev.p12',
          production: false
        }
      };
    case "test":
    case "testing":
      return {
        env: 'test', //should be env/prod, can be changed to prod when we are comfy with prod environ
        dbURI : process.env.MONGODB_URI,
        expressPort: process.env.PORT,
        apiURI: process.env.apiURI,
        apiDomain : process.env.apiDomain,
        loggerLevel: 'debug',
        appName: 'lightTribe',
        github: {
          name: 'lightTribe', // repo name in github
          pagesURL: 'http://codehatcher.github.io/lightTribe'
        },
        google: {
          places: {
            apiKey: 'AIzaSyAnojt8rFHBUdU6yvlYL8ZSTjxnjsScdSw'
          }
        },
        cloudinary: {
          cloud_name: 'codehatcher',
          api_key: '351392996945264',
          api_secret: process.env.cloudinarySecret
        },
        facebook: {
          clientID: '761889610566980',
          clientSecret: process.env.facebookSecret
        },
        swagger: {
          validateResponse: false
        },
        cert: { // apple certificate password
          passphrase: '123',
          filename: 'dev.p12',
          production: false
        }
      };
    case "prod":
    case "production":
      return {
        env: 'prod', //should be env/prod, can be changed to prod when we are comfy with prod environ
        dbURI : process.env.MONGODB_URI,
        expressPort: process.env.PORT,
        apiURI: process.env.apiURI,
        apiDomain : process.env.apiDomain,
        loggerLevel: 'debug',
        appName: 'lightTribe',
        github: {
          name: 'lightTribe', // repo name in github
          pagesURL: 'http://codehatcher.github.io/lightTribe'
        },
        google: {
          places: {
            apiKey: 'AIzaSyAnojt8rFHBUdU6yvlYL8ZSTjxnjsScdSw'
          }
        },
        cloudinary: {
          cloud_name: 'codehatcher',
          api_key: '351392996945264',
          api_secret: process.env.cloudinarySecret
        },
        facebook: {
          clientID: '761889610566980',
          clientSecret: process.env.facebookSecret
        },
        swagger: {
          validateResponse: false
        },
        cert: { // apple certificate password
          passphrase: process.env.certPassphrase,
          filename: 'prod.p12',
          production: true
        }
      };
    default:
      throw new Error("Environment Not Recognized");

  }
}();

