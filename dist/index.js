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
 * This is the main server code that processes requests and sends responses
 * back to users and to the HomeGraph.
 */
'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
// Express imports
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const morgan = require("morgan");
const ngrok = require("ngrok");
// Smart home imports
const actions_on_google_1 = require("actions-on-google");
// Local imports
const Auth = require("./auth-provider");
const Config = require("./config-provider");
const Fs = require("./files");
const expressApp = express();
expressApp.use(cors());
expressApp.use(morgan('dev'));
expressApp.use(bodyParser.json());
expressApp.use(bodyParser.urlencoded({ extended: true }));
expressApp.set('trust proxy', 1);
Auth.registerAuthEndpoints(expressApp);
let jwt;
try {
    jwt = require('../credenciales/smart-home-key.json');
}
catch (e) {
    console.warn('Service account key is not found');
    console.warn('Report state and Request sync will be unavailable');
}
const app = actions_on_google_1.smarthome({
    jwt,
    debug: true,
});
////////////////////////////////////////////////////////////////////FULFILLMENT///////////////////////////////////////////////////////////////
//const https = require('https');
const https = require("https");
var setPoint = 23;
var modo = 'heat';
var enchufe = false;
var puertaAbierta = 0;
var puertaBloqueada = false;
//Modificada para Termostatix
app.onSync((body) => {
    console.log('OnSync activado');
    //VALIDAR QUIEN LO PIDE Y QUE PIDE!!!
    const devices_syn = Fs.getFile('./data/sync.json');
    const salida = {
        requestId: body.requestId,
        payload: {
            agentUserId: Config.USER_ID,
            devices: devices_syn
        }
    };
    console.log(salida);
    return salida;
});
const queryDevice = (deviceId) => __awaiter(this, void 0, void 0, function* () {
    console.log('queryDevice:' + deviceId + '------------------------------------------------');
    if (deviceId === 'Termostato') {
        return {
            status: "SUCCESS",
            online: true,
            activeThermostatMode: modo,
            thermostatMode: modo,
            thermostatTemperatureSetpoint: setPoint,
            thermostatTemperatureAmbient: 25.1,
            thermostatHumidityAmbient: 45.3,
        };
    }
    else if (deviceId === 'Enchufe') {
        return {
            status: "SUCCESS",
            online: true,
            on: enchufe
        };
    }
    else if (deviceId === 'Puerta') {
        return {
            status: "SUCCESS",
            online: true,
            openPercent: puertaAbierta,
            isLocked: puertaBloqueada,
            isJammed: false
        };
    }
    else {
        console.log('device ID no reconocido: ' + deviceId);
        return {};
    }
});
app.onQuery((body) => __awaiter(this, void 0, void 0, function* () {
    console.log('OnQuery activado');
    //console.log(body);
    const { requestId } = body;
    const deviceStates = {};
    const queryPromises = [];
    const intent = body.inputs[0];
    for (const device of intent.payload.devices) {
        //const deviceId :string = device.id;
        queryPromises.push(queryDevice(device.id)
            .then((data) => {
            // Add response to device payload
            deviceStates[device.id] = data;
        }));
    }
    // Wait for all promises to resolve
    yield Promise.all(queryPromises);
    const payload = {
        devices: deviceStates,
    };
    const salida = {
        requestId: requestId,
        payload: payload,
    };
    console.log(JSON.stringify(salida));
    return salida;
}));
const peticionHTTP = (mi_url) => __awaiter(this, void 0, void 0, function* () {
    //const https = require('https');
    https.get(mi_url, (resp) => {
        const { statusCode } = resp;
        console.log('codigo de retorno: ' + statusCode);
        return statusCode;
    });
});
const updateDevice = (execution, deviceId) => __awaiter(this, void 0, void 0, function* () {
    console.log(`deviceId : ${deviceId}`);
    const { params, command } = execution;
    if (typeof params === 'undefined')
        return '';
    console.log(params);
    console.log('command: ' + command);
    let state;
    let url_accion;
    switch (command) {
        case 'action.devices.commands.ThermostatTemperatureSetpoint':
            setPoint = params.thermostatTemperatureSetpoint;
            state = { thermostatTemperatureSetpoint: setPoint };
            break;
        case 'action.devices.commands.ThermostatSetMode':
            modo = params.thermostatMode;
            state = { thermostatMode: modo };
            break;
        case 'action.devices.commands.OnOff':
            enchufe = params.on;
            if (params.on === true) {
                console.log('Pongo la url de encender');
                url_accion = 'https://domoticae.lopeztola.com/bombilla/activaRele?id=0';
            }
            else {
                console.log('Pongo la url de apagar');
                url_accion = 'https://domoticae.lopeztola.com/bombilla/desactivaRele?id=0';
            }
            console.log('se invocara: ' + url_accion);
            peticionHTTP(url_accion).then((salida) => {
                console.log('Codigo de salida: ' + salida);
            });
            state = { on: enchufe };
            break;
        case 'action.devices.commands.OpenClose':
            puertaAbierta = params.openPercent;
            if (puertaAbierta != 0) {
                console.log('Pongo la url de encender');
                url_accion = 'https://domoticae.lopeztola.com/bombilla/activaRele?id=0';
            }
            else {
                console.log('Pongo la url de apagar');
                url_accion = 'https://domoticae.lopeztola.com/bombilla/desactivaRele?id=0';
            }
            console.log('se invocara: ' + url_accion);
            peticionHTTP(url_accion).then((salida) => {
                console.log('Codigo de salida: ' + salida);
            });
            state = { openPercent: (puertaAbierta > 0 ? 100 : 0) };
            break;
        case 'action.devices.commands.LockUnlock':
            puertaBloqueada = params.Lock;
            if (puertaBloqueada === true) {
                console.log('Pongo la url de encender');
                url_accion = 'https://domoticae.lopeztola.com/bombilla/activaRele?id=0';
            }
            else {
                console.log('Pongo la url de apagar');
                url_accion = 'https://domoticae.lopeztola.com/bombilla/desactivaRele?id=0';
            }
            console.log('se invocara: ' + url_accion);
            peticionHTTP(url_accion).then((salida) => {
                console.log('Codigo de salida: ' + salida);
            });
            state = { isLocked: puertaBloqueada };
            break;
        default:
            console.log(`comando no encontrado ${command}`);
    }
    return state;
});
app.onExecute((body) => __awaiter(this, void 0, void 0, function* () {
    console.log('OnExecute activado XXX@@@$$$');
    console.log(body);
    const { requestId } = body;
    // Execution results are grouped by status
    const result = {
        ids: [],
        status: "SUCCESS",
        states: {
            online: true,
        },
    };
    const executePromises = [];
    const intent = body.inputs[0];
    for (const command of intent.payload.commands) {
        for (const device of command.devices) {
            console.log('**deviceId: ' + device.id);
            for (const execution of command.execution) {
                executePromises.push(updateDevice(execution, device.id)
                    .then((data) => {
                    console.log(data);
                    result.ids.push(device.id);
                    Object.assign(result.states, data);
                })
                    .catch(() => console.error('Error executing', device.id)));
            }
        }
    }
    yield Promise.all(executePromises);
    const salida = {
        requestId: requestId,
        payload: {
            commands: [result],
        },
    };
    console.log(salida);
    return salida;
}));
//Modificada para Termostatix
app.onDisconnect((body, headers) => __awaiter(this, void 0, void 0, function* () {
    console.log('Se ha recibido DISCONNECT');
}));
////////////////////////////////////////////////////////////////////FIN - FULFILLMENT///////////////////////////////////////////////////////////////
expressApp.post('/smarthome', app);
////////////////////////////////////////////////////////////////////LLAMADAS SALIENTE///////////////////////////////////////////////////////////////
expressApp.all('/smarthome/resincroniza', (req, res) => __awaiter(this, void 0, void 0, function* () {
    try {
        yield app.requestSync(Config.USER_ID);
        res.status(200).send('Resincronizacion solicitada');
    }
    catch (e) {
        console.error(e);
        res.status(200).send('Error en la resincronizacion');
    }
}));
expressApp.all('/smarthome/reportaCambio', (req, res) => __awaiter(this, void 0, void 0, function* () {
    const userId = Config.USER_ID;
    const deviceId = req.body.deviceId;
    const states = {};
    try {
        yield reportState(userId, deviceId, states);
        res.status(200).send('Cambio enviado');
    }
    catch (e) {
        console.error(e);
        res.status(200).send('Error al enviar cambio');
    }
}));
function reportState(agentUserId, deviceId, states) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`Reporting state payload for ${deviceId}`, states);
        return yield app.reportState({
            agentUserId,
            requestId: Math.random().toString(),
            payload: {
                devices: {
                    states: {
                        [deviceId]: states,
                    },
                },
            },
        });
    });
}
////////////////////////////////////////////////////////////////////FIN - LLAMADAS SALIENTE///////////////////////////////////////////////////////////////
const appPort = process.env.PORT || Config.expressPort;
const expressServer = expressApp.listen(appPort, () => __awaiter(this, void 0, void 0, function* () {
    const server = expressServer.address();
    const { address, port } = server;
    console.log(`Smart home server listening at ${address}:${port}`);
    if (Config.useNgrok) {
        try {
            const url = yield ngrok.connect(Config.expressPort);
            console.log('');
            console.log('COPY & PASTE NGROK URL BELOW');
            console.log(url);
            console.log('');
            console.log('=====');
            console.log('Visit the Actions on Google console at http://console.actions.google.com');
            console.log('Replace the webhook URL in the Actions section with:');
            console.log('    ' + url + '/smarthome');
            console.log('');
            console.log('In the console, set the Authorization URL to:');
            console.log('    ' + url + '/trueauth');
            console.log('');
            console.log('Then set the Token URL to:');
            console.log('    ' + url + '/truetoken');
            console.log('');
            console.log('Finally press the \'TEST DRAFT\' button');
        }
        catch (err) {
            console.error('Ngrok was unable to start');
            console.error(err);
            process.exit();
        }
    }
}));
//# sourceMappingURL=index.js.map