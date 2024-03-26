"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reachedFinality = exports.getNodesState = void 0;
const config_1 = require("../../src/config");
function getNodeState(nodeId) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = yield fetch(`http://localhost:${config_1.BASE_NODE_PORT + nodeId}/getState`)
            .then((res) => res.json())
            .then((json) => json);
        return state;
    });
}
function getNodesState(N) {
    return __awaiter(this, void 0, void 0, function* () {
        const states = yield Promise.all(new Array(N).fill(0).map((_, index) => __awaiter(this, void 0, void 0, function* () { return getNodeState(index); })));
        return states;
    });
}
exports.getNodesState = getNodesState;
function reachedFinality(states) {
    return states.find((el) => el.decided === false) === undefined;
}
exports.reachedFinality = reachedFinality;
