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

/**
 * This auth is going to use the Authorization Code flow, described in the docs:
 * https://developers.google.com/actions/identity/oauth2-code-flow
 */

import * as express from 'express'
import * as util from 'util'
import { Headers } from 'actions-on-google'

import * as Config from './config-provider'

//import * as randomToken from 'random-token'
var randomToken = require('random-token').create('abcdefghijklmnopqrstuvwxzyABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!"·$%&/()=-_.:,;><');

let accessToken : string
let refreshToken : string
let codigoLogin : string
let codigoAuth : string

/**
 * A function that gets the user id from an access token.
 * Replace this functionality with your own OAuth provider.
 *
 * @param headers HTTP request headers
 * @return The user id
 */
export async function getUser(headers: Headers): Promise<string> {
  /*
  const authorization = headers.authorization
  const accessToken = (authorization as string).substr(7)
  return await Firestore.getUserId(accessToken)
  */
  return Config.CLIENT_ID
}
export async function getUserSecret(headers: Headers): Promise<string> {
  /*
  const authorization = headers.authorization
  const accessToken = (authorization as string).substr(7)
  return await Firestore.getUserId(accessToken)
  */
  return Config.CLIENT_SECRET
}
/**
 * A function that adds /login, /trueauth, /truetoken endpoints to an
 * Express server. Replace this with your own OAuth endpoints.
 *
 * @param expressApp Express app
 */
export async function registerAuthEndpoints(expressApp: express.Express) {

  expressApp.get('/login', (request, response) => {
    console.log('Login GET -------------------------\nRequest.query:')
    console.log(request.query)

    if(request.query.code==codigoAuth || true) {
      codigoLogin = "Codigo_login";//crypto.randomBytes(32);
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
              <input type="hidden" name="key" value="${codigoLogin}" />
              <label for="login">login:</label><br>
              <input type="text" id="login" name="login"><br>
              <label for="pass">password:</label><br>
              <input type="password" id="pass" name="pass"><br>
              <br>
              <button type="submit" style="font-size:14pt">Enlaza este servicio a Google</button>
          </form>
        </body>
      </html>`
      );
    }
/*
    //Si el codigo Auth no es valido...
    console.log('codigoAuth (' + request.query.code + ') no valido');
    return response.status(401).send(`
      <!DOCTYPE html>
      <html>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <body>
          <h1>No permitido</h1>
        </body>
      </html>`
    ); */
  })

  expressApp.post('/login', async (request, response) => {
    // Here, you should validate the user account.
    // In this sample, we do not do that.    
    console.log('Login POST -------------------------\nbody = ')
    //console.log(request)
    console.log(request.body)

    if(request.body.key!=codigoLogin || request.body.login!=Config.USER_ID || request.body.pass!=Config.USER_PASSWORD) {
      //Si el usuario y password no son validos...
      console.log('codigoLogin (' + request.body.key + '!= ' + codigoLogin + ') USER_ID (' + request.body.login + ') o USER_PASSWORD (' + request.body.pass + ') no valido');
      const body= `
      <!DOCTYPE html>
      <html>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <body>
        <h1>Mentiroso, no eres tu...</h1>
        </body>
      </html>`;

      return response.status(401).send(body);
    }
    
    const responseurl = decodeURIComponent(<string>request.body.responseurl);
    response.redirect(responseurl);
    console.log(`(POST) Redirect to:\n${responseurl}\n-------------------------------------`);
    //return response.redirect(responseurl);
    return
  })

  expressApp.get('/fakeauth', async (req, res) => {
    const responseurl = util.format('%s?code=%s&state=%s',
      decodeURIComponent(<string>req.query.redirect_uri), 'xxxxxx',
      req.query.state)
    console.log(`Set redirect as ${responseurl}`)
    return res.redirect(`/login?responseurl=${encodeURIComponent(responseurl)}`)
  })

  expressApp.get('/trueauth', async (request, response) => {
    console.log('trueAuth -------------------------\nSolicitado trueauth')
    console.log(request.query)   
  
    if(request.query.client_id!=Config.CLIENT_ID) {
      codigoAuth = "Codigo_de_Auth";//crypto.randomBytes(32);

      const uri_redireccion: string = decodeURIComponent(<string>request.query.redirect_uri)
      const responseurl = util.format('%s?code=%s&state=%s',
          uri_redireccion, 'xxxxxx',//codigoAuth,//'xxxxxx',
          request.query.state);

      console.log(`Set redirect as ${responseurl}-------------------------------------------`);
      return response.redirect(responseurl);
      /*return response.redirect(
          `/login?responseurl=${encodeURIComponent(responseurl)}`);
          */
    }

    //Si el CLIENTE_ID no es correcto
    console.log('CLIENT_ID (' + request.query.cliente_id + ') no valido');
    return response.status(401).send(`
      <html>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <body>
        <h1>Este mensaje no es para mi...</h1>
        </body>
      </html>`
    );          
  })

  expressApp.all('/faketoken', async (req, res) => {
    const grantType = req.query.grant_type
      ? req.query.grant_type : req.body.grant_type
    const secondsInDay = 86400 // 60 * 60 * 24
    const HTTP_STATUS_OK = 200
    console.log(`Grant type ${grantType}`)

    let obj
    if (grantType === 'authorization_code') {
      obj = {
        token_type: 'bearer',
        access_token: '123access',
        refresh_token: '123refresh',
        expires_in: secondsInDay,
      }
    } else if (grantType === 'refresh_token') {
      obj = {
        token_type: 'bearer',
        access_token: '123access',
        expires_in: secondsInDay,
      }
    }
    res.status(HTTP_STATUS_OK).json(obj)
  })

  expressApp.all('/truetoken', async (request, response) => {
    console.log('trueToken -------------------------\nSolicitado token');
    console.log('query:');
    console.log(request.query);
    console.log('body:');
    console.log(request.body);
  
    //Verificar que el USER_ID y el CLIENT_SECRET son correctos
    const grantType = request.query.grant_type ?
      request.query.grant_type : request.body.grant_type;
  
    console.log(`Grant type ${grantType}`);

    //accessToken = "Token de acceso";//crypto.randomBytes(256);
    accessToken = randomToken(16)
    console.log('accessToken: ' + accessToken);
    //refreshToken = "Token de refresco";//crypto.randomBytes(256);
    refreshToken = randomToken(16)
    console.log('refreshToken: ' + refreshToken);

    let obj;  
    if (grantType === 'authorization_code') {
      obj = {
        token_type: 'bearer',
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: Config.UNA_HORA,
      };
    } else if (grantType === 'refresh_token') {
      obj = {
        token_type: 'bearer',
        access_token: accessToken,
        expires_in: Config.UNA_HORA,
      };
    }
    console.log('respuesta: ');
    console.log(obj);
  
    response.status(Config.HTTP_STATUS_OK)
        .json(obj);
  })
}