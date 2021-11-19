"use strict";
/**
 * Provide link in "error dialog: you must select a jenkins connection to use this plugin"
 * When there are no hosts to select in the command, open settings for user to add a host.
 */
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
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const pipelineJack_1 = require("./pipelineJack");
const snippets_1 = require("./snippets");
const scriptConsoleJack_1 = require("./scriptConsoleJack");
const buildJack_1 = require("./buildJack");
const connectionsManager_1 = require("./connectionsManager");
const nodeJack_1 = require("./nodeJack");
const jobJack_1 = require("./jobJack");
const outputProvider_1 = require("./outputProvider");
// import { PipelineTree } from "./pipelineTree";
const jobTree_1 = require("./jobTree");
const historyTree_1 = require("./historyTree");
const historyBuildTree_1 = require("./historyBuildTree");
const nodeTree_1 = require("./nodeTree");
const extensionVariables_1 = require("./extensionVariables");
const utils_1 = require("./utils");
const connectionsTree_1 = require("./connectionsTree");
const historyJack_1 = require("./historyJack");
const historyBuild_1 = require("./historyBuild");
const statusBarBuild_1 = require("./statusBarBuild");
function activate(context) {
    return __awaiter(this, void 0, void 0, function* () {
        yield utils_1.applyDefaultHost();
        extensionVariables_1.ext.context = context;
        // We initialize the Jenkins service first in order to avoid
        // a race condition during onDidChangeConfiguration
        let commandSets = [];
        extensionVariables_1.ext.connectionsManager = new connectionsManager_1.ConnectionsManager();
        extensionVariables_1.ext.pipelineSnippets = new snippets_1.PipelineSnippets();
        // Initialize the output panel provider for jack command output
        extensionVariables_1.ext.outputPanelProvider = new outputProvider_1.OutputPanelProvider();
        // Initialize top level jacks and gather their subcommands for the Jack command
        // quickpick display
        extensionVariables_1.ext.pipelineJack = new pipelineJack_1.PipelineJack();
        commandSets.push(extensionVariables_1.ext.pipelineJack);
        extensionVariables_1.ext.scriptConsoleJack = new scriptConsoleJack_1.ScriptConsoleJack();
        commandSets.push(extensionVariables_1.ext.scriptConsoleJack);
        extensionVariables_1.ext.jobJack = new jobJack_1.JobJack();
        commandSets.push(extensionVariables_1.ext.jobJack);
        extensionVariables_1.ext.historyJack = new historyJack_1.HistoryJack();
        commandSets.push(extensionVariables_1.ext.historyJack);
        extensionVariables_1.ext.historyBuild = new historyBuild_1.HistoryBuild();
        commandSets.push(extensionVariables_1.ext.historyBuild);
        extensionVariables_1.ext.buildJack = new buildJack_1.BuildJack();
        commandSets.push(extensionVariables_1.ext.buildJack);
        extensionVariables_1.ext.nodeJack = new nodeJack_1.NodeJack();
        commandSets.push(extensionVariables_1.ext.nodeJack);
        commandSets.push(extensionVariables_1.ext.connectionsManager);
        // Status bar
        extensionVariables_1.ext.barBuild = new statusBarBuild_1.StatusBarBuild();
        commandSets.push(extensionVariables_1.ext.barBuild);
        extensionVariables_1.ext.context.subscriptions.push(vscode.commands.registerCommand("extension.jenkins-jack.jacks", () => __awaiter(this, void 0, void 0, function* () {
            // Build up quick pick list
            let selections = [];
            for (let c of commandSets) {
                let cmds = c.commands;
                if (0 === cmds.length) {
                    continue;
                }
                selections = selections.concat(cmds);
                // visual label to divide up the jack sub commands
                selections.push({ label: "$(kebab-horizontal)", description: "" });
            }
            // Remove last divider
            selections.pop();
            // Display full list of all commands and execute selected target.
            let result = yield vscode.window.showQuickPick(selections);
            if (undefined === result || undefined === result.target) {
                return;
            }
            yield result.target();
        })));
        // Initialize tree views
        extensionVariables_1.ext.connectionsTree = new connectionsTree_1.ConnectionsTree();
        // ext.pipelineTree = new PipelineTree();
        extensionVariables_1.ext.historyBuildTree = new historyBuildTree_1.HistoryBuildTree();
        extensionVariables_1.ext.jobTree = new jobTree_1.JobTree();
        extensionVariables_1.ext.nodeTree = new nodeTree_1.NodeTree();
        extensionVariables_1.ext.historyTree = new historyTree_1.HistoryTree();
        console.log("Jenkins Deploy插件已激活!");
    });
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map