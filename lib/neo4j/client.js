"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDriver = getDriver;
exports.getSession = getSession;
exports.closeDriver = closeDriver;
const neo4j_driver_1 = __importDefault(require("neo4j-driver"));
let driver = null;
function getDriver() {
    if (!driver) {
        const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
        const user = process.env.NEO4J_USER || 'neo4j';
        const password = process.env.NEO4J_PASSWORD || 'password';
        driver = neo4j_driver_1.default.driver(uri, neo4j_driver_1.default.auth.basic(user, password));
    }
    return driver;
}
async function getSession() {
    const driver = getDriver();
    return driver.session();
}
async function closeDriver() {
    if (driver) {
        await driver.close();
        driver = null;
    }
}
