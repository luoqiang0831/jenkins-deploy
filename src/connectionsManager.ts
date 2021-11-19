import * as vscode from "vscode";
import { JenkinsService } from "./jenkinsService";
import { QuickpickSet } from "./quickpickSet";
import { ext } from "./extensionVariables";
import { ConnectionsTreeItem } from "./connectionsTree";
import { JenkinsConnection } from "./jenkinsConnection";

export class ConnectionsManager implements QuickpickSet {
  private _host: JenkinsService;

  public constructor() {
    ext.context.subscriptions.push(
      vscode.commands.registerCommand(
        "extension.jenkins-jack.connections.select",
        async (item?: ConnectionsTreeItem) => {
          await this.selectConnection(item?.connection);
        }
      )
    );

    ext.context.subscriptions.push(
      vscode.commands.registerCommand(
        "extension.jenkins-jack.connections.add",
        async () => {
          await this.addConnection();
        }
      )
    );

    ext.context.subscriptions.push(
      vscode.commands.registerCommand(
        "extension.jenkins-jack.connections.edit",
        async (item?: ConnectionsTreeItem) => {
          await this.editConnection(item?.connection);
        }
      )
    );

    ext.context.subscriptions.push(
      vscode.commands.registerCommand(
        "extension.jenkins-jack.connections.delete",
        async (item?: ConnectionsTreeItem) => {
          await this.deleteConnection(item?.connection);
        }
      )
    );

    this.updateSettings();
    vscode.workspace.onDidChangeConfiguration(event => {
      if (event.affectsConfiguration("jenkins-jack.jenkins.connections")) {
        this.updateSettings();
      }
    });
  }

  public get commands(): any[] {
    return [
      {
        label: "$(settings)  Connections: Select",
        description: "Select a jenkins host connection to connect to.",
        target: async () =>
          vscode.commands.executeCommand(
            "extension.jenkins-jack.connections.select"
          ),
      },
      {
        label: "$(add)  Connections: Add",
        description: "Add a jenkins host connection via input prompts.",
        target: async () =>
          vscode.commands.executeCommand(
            "extension.jenkins-jack.connections.add"
          ),
      },
      {
        label: "$(edit)  Connections: Edit",
        description: "Edit a jenkins host's connection info.",
        target: async () =>
          vscode.commands.executeCommand(
            "extension.jenkins-jack.connections.edit"
          ),
      },
      {
        label: "$(circle-slash)  Connections: Delete",
        description: "Delete a jenkins host connection from settings.",
        target: async () =>
          vscode.commands.executeCommand(
            "extension.jenkins-jack.connections.delete"
          ),
      },
    ];
  }

  public get host(): JenkinsService {
    return this._host;
  }

  public async display() {
    let result = await vscode.window.showQuickPick(this.commands, {
      placeHolder: "Jenkins Jack",
      ignoreFocusOut: true,
    });
    if (undefined === result) {
      return;
    }
    return result.target();
  }

  private updateSettings() {
    let config = vscode.workspace.getConfiguration("jenkins-jack.jenkins");
    let conn: any;
    for (let c of config.connections) {
      if (c.active) {
        conn = c;
        break;
      }
    }
    if (undefined === conn) {
      throw new Error(
        "You must select a host connection to use the plugin's features"
      );
    }

    if (undefined !== this.host) {
      this.host.dispose();
    }
    this._host = new JenkinsService(JenkinsConnection.fromJSON(conn));
  }

  public get activeConnection(): any {
    let config = vscode.workspace.getConfiguration("jenkins-jack.jenkins");
    for (let c of config.connections) {
      if (c.active) {
        return c;
      }
    }
    return undefined;
  }

  /**
   * Provides an input flow for adding in a host to the user's settings.
   */
  public async addConnection() {
    let config = vscode.workspace.getConfiguration("jenkins-jack.jenkins");

    let conn = await this.getConnectionInput();
    if (undefined === conn) {
      return;
    }

    this._host = new JenkinsService(JenkinsConnection.fromJSON(conn));

    // Add the connection to the list and make it the active one
    config.connections.forEach((c: any) => (c.active = false));
    config.connections.push({
      name: conn.name,
      uri: conn.uri,
      username: conn.username,
      password: conn.password,
      folderFilter: conn.folderFilter,
      active: true,
    });
    vscode.workspace
      .getConfiguration()
      .update(
        "jenkins-jack.jenkins.connections",
        config.connections,
        vscode.ConfigurationTarget.Global
      );
    vscode.window.showInformationMessage(
      `Jenkins Jack: Host updated to ${conn.name}: ${conn.uri}`
    );

    // Refresh the connection tree and it's dependent tree views
    vscode.commands.executeCommand(
      "extension.jenkins-jack.tree.connections.refresh"
    );
  }

  /**
   * Provides an input flow for a user to edit a host's connection info.
   * @param conn Optional connection object edit.
   */
  public async editConnection(conn?: any) {
    let config = vscode.workspace.getConfiguration("jenkins-jack.jenkins");

    if (!conn) {
      let hosts = [];
      for (let c of config.connections) {
        hosts.push({
          label: c.name,
          description: `${c.uri} (${c.username})`,
          target: c,
        });
      }

      // Select a connection to edit
      let result = await vscode.window.showQuickPick(hosts, {
        ignoreFocusOut: true,
      });
      if (undefined === result) {
        return;
      }
      conn = result.target;
    }

    // Prompt user to edit the connection fields
    let editedConnection = await this.getConnectionInput(conn);
    if (undefined === editedConnection) {
      return;
    }

    // If the name of a connection was changed, ensure we update
    // references of pipeline tree items to use the new name
    if (editedConnection.name !== conn.name) {
      let pipelineConfig = await vscode.workspace.getConfiguration(
        "jenkins-jack.pipeline.tree"
      );
      let pipelineTreeItems = [];
      for (let c of pipelineConfig.items) {
        if (conn.name === c.hostId) {
          c.hostId = editedConnection.name;
        }
        pipelineTreeItems.push(c);
      }
      await vscode.workspace
        .getConfiguration()
        .update(
          "jenkins-jack.pipeline.tree.items",
          pipelineTreeItems,
          vscode.ConfigurationTarget.Global
        );
    }

    // Update connection and the global config.
    config.connections.forEach((c: any) => {
      if (c.name === conn.name && undefined !== editedConnection) {
        // TODO: there has to be a better way as ref assignment doesn't work
        c.name = editedConnection.name;
        c.uri = editedConnection.uri;
        c.username = editedConnection.username;
        c.password = editedConnection.password;
        c.folderFilter = editedConnection.folderFilter;
      }
    });
    await vscode.workspace
      .getConfiguration()
      .update(
        "jenkins-jack.jenkins.connections",
        config.connections,
        vscode.ConfigurationTarget.Global
      );
    vscode.commands.executeCommand(
      "extension.jenkins-jack.tree.connections.refresh"
    );
  }

  /**
   * User flow for deleting a Jenkins host connection.
   * @param conn Optional connection object to delete.
   */
  public async deleteConnection(conn?: any) {
    let config = vscode.workspace.getConfiguration("jenkins-jack.jenkins");
    if (!conn) {
      let hosts = [];
      for (let c of config.connections) {
        hosts.push({
          label: c.name,
          description: `${c.uri} (${c.username})`,
          target: c,
        });
      }

      let result = await vscode.window.showQuickPick(hosts, {
        ignoreFocusOut: true,
      });
      if (undefined === result) {
        return undefined;
      }
      conn = result.target;
    }

    // Remove connection and update global config.
    let modifiedConnections = config.connections.filter((c: any) => {
      return c.name !== conn.name;
    });
    await vscode.workspace
      .getConfiguration()
      .update(
        "jenkins-jack.jenkins.connections",
        modifiedConnections,
        vscode.ConfigurationTarget.Global
      );
    vscode.window.showInformationMessage(
      `Host "${conn.name} ${conn.uri}" removed`
    );

    // If this host was active, make the first host in the list active.
    if (conn.active) {
      return await this.selectConnection(modifiedConnections[0]);
    }

    // Refresh the connection tree and it's dependent tree views
    vscode.commands.executeCommand(
      "extension.jenkins-jack.tree.connections.refresh"
    );
  }

  /**
   * Displays the quicpick host/connection selection list for the user.
   * Active connection is updated in the global config upon selection.
   * If connection already provided, config is just updated and associated
   * treeViews are refreshed.
   */
  public async selectConnection(conn?: any) {
    let config = vscode.workspace.getConfiguration("jenkins-jack.jenkins");
    if (!conn) {
      let hosts = [];
      for (let c of config.connections) {
        let activeIcon = c.active ? "$(primitive-dot)" : "$(dash)";
        hosts.push({
          label: `${activeIcon} ${c.name}`,
          description: `${c.uri} (${c.username})`,
          target: c,
        });
      }

      let result = await vscode.window.showQuickPick(hosts, {
        ignoreFocusOut: true,
      });
      if (undefined === result) {
        return;
      }
      conn = result.target;
    }

    this._host.dispose();
    this._host = new JenkinsService(JenkinsConnection.fromJSON(conn));

    // Update settings with active host.
    for (let c of config.connections) {
      c.active =
        conn.name === c.name &&
        conn.uri === c.uri &&
        conn.username === c.username &&
        conn.password === c.password;
    }

    vscode.workspace
      .getConfiguration()
      .update(
        "jenkins-jack.jenkins.connections",
        config.connections,
        vscode.ConfigurationTarget.Global
      );
    vscode.window.showInformationMessage(
      `Jenkins Jack: Host updated to ${conn.name}: ${conn.uri}`
    );

    // Refresh the connection tree and it's dependent tree views
    vscode.commands.executeCommand(
      "extension.jenkins-jack.tree.connections.refresh"
    );
  }

  private async getConnectionInput(
    jenkinsConnection?: JenkinsConnection
  ): Promise<JenkinsConnection | undefined> {
    let config = vscode.workspace.getConfiguration("jenkins-jack.jenkins");

    // Have user enter a unique name for the host. If host name already exists, try again.
    let hostName: string | undefined = undefined;
    while (true) {
      hostName = await vscode.window.showInputBox({
        ignoreFocusOut: true,
        prompt: "为你的jenkins连接输入一个唯一的名称(例如:东福)",
        value: jenkinsConnection?.name,
      });
      if (undefined === hostName) {
        return undefined;
      }

      if (
        !config.connections.some((c: any) => c.name === hostName) ||
        jenkinsConnection?.name === hostName
      ) {
        break;
      }
      vscode.window.showWarningMessage(
        `${hostName} 连接已经存在。请重新输入。`
      );
    }

    let hostUri = await vscode.window.showInputBox({
      ignoreFocusOut: true,
      prompt: "请输入Jenkins 的链接地址 (例如http://127.0.0.1:8080)",
      value: jenkinsConnection
        ? jenkinsConnection.uri
        : "http://127.0.0.1:8080",
    });
    if (undefined === hostUri) {
      return undefined;
    }

    let username = await vscode.window.showInputBox({
      ignoreFocusOut: true,
      prompt: "请输入 Jenkins 的用户名",
      value: jenkinsConnection?.username,
    });
    if (undefined === username) {
      return undefined;
    }

    let password = await vscode.window.showInputBox({
      ignoreFocusOut: true,
      password: true,
      prompt: `请输入${username} 的 Jenkins 登录密码`,
      value: jenkinsConnection?.password,
    });
    if (undefined === password) {
      return undefined;
    }

    let folderFilter = await vscode.window.showInputBox({
      ignoreFocusOut: true,
      prompt:
        "(可选)只过滤指定文件夹路径下的构建项目(例如:“myfolder”、“myfolder/mysubfolder”)",
      value: jenkinsConnection?.folderFilter,
    });
    if (undefined === folderFilter) {
      return undefined;
    }

    folderFilter = "" !== folderFilter?.trim() ? folderFilter : undefined;

    return new JenkinsConnection(
      hostName,
      hostUri,
      username,
      password,
      true,
      folderFilter
    );
  }
}
