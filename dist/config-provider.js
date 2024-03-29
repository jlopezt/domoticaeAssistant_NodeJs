"use strict";
/* Copyright 2017, Google, Inc.
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * This provides a number of parameters that may be used throughout this sample.
 */
// Port used for Express server
exports.expressPort = 8888;
// Client id that Google will use to make authorized requests
// In a production environment you should change this value
exports.googleClientId = 'ABC123';
// Client secret that Google will use to make authorized requests
// In a production environment you should change this value
exports.googleClientSecret = 'DEF456';
let ngrok = false;
process.argv.forEach((value) => {
    if (value.includes('isLocal')) {
        ngrok = true;
    }
});
// Running server locally using ngrok
exports.useNgrok = ngrok;
//export const googleCloudProjectId = 'abracadabra-2c873'
exports.UNA_HORA = 3600; //60*60;
exports.UN_DIA = 86400; //24*60*60;
exports.USER_ID = 'user@login.com';
exports.USER_PASSWORD = '1234';
exports.CLIENT_SECRET = 'DEF456';
exports.HTTP_STATUS_OK = 200;
exports.HTTP_STATUS_NOT_FOUND = 404;
exports.HTTP_STATUS_NOT_ALLOWED = 401;
//# sourceMappingURL=config-provider.js.map