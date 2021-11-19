"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JenkinsConnection = void 0;
class JenkinsConnection {
    constructor(hostName, hostUri, username, password, crumbIssuer, folderFilter) {
        this._name = hostName;
        this._uri = hostUri;
        this._username = username;
        this._password = password;
        this._crumbIssuer = crumbIssuer;
        this._folderFilter = folderFilter;
    }
    get name() { return this._name; }
    get uri() { return this._uri; }
    get username() { return this._username; }
    get password() { return this._password; }
    get folderFilter() { return this._folderFilter; }
    get crumbIssuer() { return this._crumbIssuer; }
    static fromJSON(json) {
        let thing = new JenkinsConnection(json.name, json.uri, json.username, json.password, (null != json.crumbIssuer) ? json.crumbIssuer : true, json.folderFilter);
        return thing;
    }
}
exports.JenkinsConnection = JenkinsConnection;
//# sourceMappingURL=historyModel.js.map