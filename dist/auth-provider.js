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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const util = require("util");
const Config = require("./config-provider");
/**
 * A function that gets the user id from an access token.
 * Replace this functionality with your own OAuth provider.
 *
 * @param headers HTTP request headers
 * @return The user id
 */
function getUser(headers) {
    return __awaiter(this, void 0, void 0, function* () {
        /*
        const authorization = headers.authorization
        const accessToken = (authorization as string).substr(7)
        return await Firestore.getUserId(accessToken)
        */
        return Config.CLIENT_ID;
    });
}
exports.getUser = getUser;
/**
 * A function that adds /login, /fakeauth, /faketoken endpoints to an
 * Express server. Replace this with your own OAuth endpoints.
 *
 * @param expressApp Express app
 */
function registerAuthEndpoints(expressApp) {
    return __awaiter(this, void 0, void 0, function* () {
        expressApp.get('/login', (request, response) => {
            if (request.query.code === exports.codigoAuth) {
                exports.codigoLogin = "Codigo login"; //crypto.randomBytes(32);
                console.log('(GET) Requesting login page');
                return response.send(`
      <!DOCTYPE html>
      <html>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <body>
          <h2>Permisos a Google</h2>
          <p>¿Quiere conceder <strong>permisos a Google</strong> para que actue en su nombre sobre su DreamHome?</p>
          <form action="/login" method="post">
              <input type="hidden" name="responseurl" value="${request.query.responseurl}" />
              <input type="hidden" name="key" value="${exports.codigoLogin}" />
              <label for="login">login:</label><br>
              <input type="text" id="login" name="login"><br>
              <label for="pass">password:</label><br>
              <input type="password" id="pass" name="pass"><br>
              <br>
              <button type="submit" style="font-size:14pt">Enlaza este servicio a Google</button>
          </form>
        </body>
      </html>`);
            }
            //Si el codigo Auth no es valido...
            console.log('codigoAuth (' + request.query.code + ') no valido');
            return response.status(401).send(`
      <!DOCTYPE html>
      <html>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <body>
          <h1>Not Allowed</h1>
        </body>
      </html>`);
        });
        expressApp.post('/login', (request, response) => __awaiter(this, void 0, void 0, function* () {
            // Here, you should validate the user account.
            // In this sample, we do not do that.
            if (request.body.key == exports.codigoLogin && request.body.login === Config.USER_ID && request.body.pass === Config.USER_PASSWORD) {
                const responseurl = decodeURIComponent(request.body.responseurl);
                console.log(`(POST) Redirect to ${responseurl}`);
                return response.redirect(responseurl);
            }
            //Si el usuario y password no son validos...
            console.log('codigoLogin (' + request.body.key + '!= ' + exports.codigoLogin + ') USER_ID (' + request.body.login + ') o USER_PASSWORD (' + request.body.pass + ') no valido');
            const body = `
    <!DOCTYPE html>
    <html>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <body>
      <h1>Mentiroso, no eres tu...</h1>
      </body>
    </html>`;
            return response.status(401).send(body);
        }));
        expressApp.get('/trueauth', (request, response) => __awaiter(this, void 0, void 0, function* () {
            console.log('Solicitado fakeauth');
            console.log(request);
            if (request.query.cliente_id != Config.CLIENT_ID) {
                exports.codigoAuth = "Codigo de Auth"; //crypto.randomBytes(32);
                const uri_redireccion = request.query.redirect_uri;
                const responseurl = util.format('%s?code=%s&state=%s', decodeURIComponent(uri_redireccion), exports.codigoAuth, //'xxxxxx',
                request.query.state);
                /*      const responseurl = util.format('%s?code=%s&state=%s',
                          decodeURIComponent(request.query.redirect_uri), codigoAuth,//'xxxxxx',
                          request.query.state);
                          */
                console.log(`Set redirect as ${responseurl}`);
                return response.redirect(`/login?responseurl=${encodeURIComponent(responseurl)}`);
            }
            //Si el CLIENTE_ID no es correcto
            console.log('CLIENT_ID (' + request.query.cliente_id + ') no valido');
            return response.status(401).send(`
      <html>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <body>
        <h1>Este mensaje no es para mi...</h1>
        </body>
      </html>`);
        }));
        expressApp.all('/truetoken', (request, response) => __awaiter(this, void 0, void 0, function* () {
            console.log('Solicitado faketoken');
            console.log(request);
            const grantType = request.query.grant_type ?
                request.query.grant_type : request.body.grant_type;
            console.log(`Grant type ${grantType}`);
            let obj;
            if (grantType === 'authorization_code') {
                exports.accessToken = "Token de acceso"; //crypto.randomBytes(256);
                console.log('accessToken: ' + exports.accessToken);
                exports.refreshToken = "Token de refresco"; //crypto.randomBytes(256);
                console.log('refreshToken: ' + exports.refreshToken);
                obj = {
                    token_type: 'bearer',
                    access_token: exports.accessToken,
                    refresh_token: exports.refreshToken,
                    expires_in: Config.UNA_HORA,
                };
            }
            else if (grantType === 'refresh_token') {
                obj = {
                    token_type: 'bearer',
                    access_token: exports.accessToken,
                    expires_in: Config.UNA_HORA,
                };
            }
            console.log('respuesta: ');
            console.log(obj);
            response.status(Config.HTTP_STATUS_OK)
                .json(obj);
        }));
    });
}
exports.registerAuthEndpoints = registerAuthEndpoints;
//# sourceMappingURL=auth-provider.js.map