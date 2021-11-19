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
exports.JackBase = void 0;
const vscode = require("vscode");
const extensionVariables_1 = require("./extensionVariables");
class JackBase {
    constructor(name, command) {
        this.barrierLine = "-".repeat(80);
        this.name = name;
        let disposable = vscode.commands.registerCommand(command, () => __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.display();
            }
            catch (err) {
                vscode.window.showWarningMessage(`Could not display ${command} commands.`);
            }
        }));
        extensionVariables_1.ext.context.subscriptions.push(disposable);
        let config = vscode.workspace.getConfiguration("jenkins-jack.outputView");
        this.outputViewType = config.type;
        this.updateOutputChannel(this.outputViewType);
        vscode.workspace.onDidChangeConfiguration((event) => {
            if (event.affectsConfiguration("jenkins-jack.outputView")) {
                let config = vscode.workspace.getConfiguration("jenkins-jack.outputView");
                if (config.type !== this.outputViewType) {
                    this.outputViewType = config.type;
                    this.updateOutputChannel(this.outputViewType);
                }
            }
        });
    }
    updateOutputChannel(type) {
        if ("channel" === type) {
            this.outputChannel = vscode.window.createOutputChannel(this.name);
        }
        else if ("panel" === type) {
            this.outputChannel = extensionVariables_1.ext.outputPanelProvider.get(`${this.name} Output`);
        }
        else {
            throw new Error("Invalid 'view' type for output.");
        }
    }
    display() {
        return __awaiter(this, void 0, void 0, function* () {
            let commands = this.commands;
            if (0 === commands.length) {
                return;
            }
            let result = yield vscode.window.showQuickPick(commands, {
                placeHolder: "Jenkins Jack",
            });
            if (undefined === result) {
                return;
            }
            return result.target();
        });
    }
    showInformationMessage(message, ...items) {
        return __awaiter(this, void 0, void 0, function* () {
            return vscode.window.showInformationMessage(`${this.name}: ${message}`, ...items);
        });
    }
    showInformationModal(message, ...items) {
        return __awaiter(this, void 0, void 0, function* () {
            return vscode.window.showInformationMessage(`${this.name}: ${message}`, { modal: true }, ...items);
        });
    }
    showWarningMessage(message, ...items) {
        return __awaiter(this, void 0, void 0, function* () {
            return vscode.window.showWarningMessage(`${this.name}: ${message}`, ...items);
        });
    }
}
exports.JackBase = JackBase;
//# sourceMappingURL=jack.js.map