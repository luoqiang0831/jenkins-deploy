import { ExtensionContext } from "vscode";
import { ConnectionsManager } from "./connectionsManager";
import { PipelineSnippets } from "./snippets";
import { PipelineJack } from "./pipelineJack";
import { ScriptConsoleJack } from "./scriptConsoleJack";
import { NodeJack } from "./nodeJack";
import { BuildJack } from "./buildJack";
import { JobJack } from "./jobJack";
import { JobTree } from "./jobTree";
import { PipelineTree } from "./pipelineTree";
import { NodeTree } from "./nodeTree";
import { OutputPanelProvider } from "./outputProvider";
import { ConnectionsTree } from "./connectionsTree";
import { HistoryTree } from "./historyTree";
import { HistoryBuildTree } from "./historyBuildTree";
import { HistoryJack } from "./historyJack";
import { HistoryBuild } from "./historyBuild";
import { StatusBarBuild } from "./statusBarBuild";

/**
 * Namespace for common variables used throughout the extension. They must be initialized in the activate() method of extension.ts
 */
export namespace ext {
  export let context: ExtensionContext;
  export let pipelineSnippets: PipelineSnippets;

  export let outputPanelProvider: OutputPanelProvider;

  export let pipelineJack: PipelineJack;
  export let scriptConsoleJack: ScriptConsoleJack;
  export let nodeJack: NodeJack;
  export let buildJack: BuildJack;
  export let jobJack: JobJack;
  export let historyJack: HistoryJack;
  export let historyBuild: HistoryBuild;
  export let barBuild: StatusBarBuild;

  export let connectionsTree: ConnectionsTree;
  export let jobTree: JobTree;
  export let pipelineTree: PipelineTree;
  export let nodeTree: NodeTree;
  export let historyTree: HistoryTree;
  export let historyBuildTree: HistoryBuildTree;
  export let connectionsManager: ConnectionsManager;
}
