/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { LibraryCommandletExecutor } from '@salesforce/salesforcedx-utils-vscode/out/src';
import {
  Command,
  SfdxCommandBuilder
} from '@salesforce/salesforcedx-utils-vscode/out/src/cli';
import {
  ContinueResponse,
  ParametersGatherer
} from '@salesforce/salesforcedx-utils-vscode/out/src/types';
import { ComponentSet } from '@salesforce/source-deploy-retrieve';
import { RequestStatus } from '@salesforce/source-deploy-retrieve/lib/src/client/types';
import * as vscode from 'vscode';
import { channelService, OUTPUT_CHANNEL } from '../channels';
import { workspaceContext } from '../context';
import { handleDeployRetrieveLibraryDiagnostics } from '../diagnostics';
import { nls } from '../messages';
import { notificationService } from '../notifications';
import { DeployQueue } from '../settings';
import { SfdxPackageDirectories, SfdxProjectConfig } from '../sfdxProject';
import { telemetryService } from '../telemetry';
import { BaseDeployExecutor, DeployType } from './baseDeployCommand';
import { SourcePathChecker } from './forceSourceRetrieveSourcePath';
import { FilePathGatherer, SfdxCommandlet, SfdxWorkspaceChecker } from './util';
import { createComponentCount, useBetaDeployRetrieve } from './util';
import { createDeployOutput2 } from './util/sourceResultOutput';

export class ForceSourceDeploySourcePathExecutor extends BaseDeployExecutor {
  public build(sourcePath: string): Command {
    const commandBuilder = new SfdxCommandBuilder()
      .withDescription(nls.localize('force_source_deploy_text'))
      .withArg('force:source:deploy')
      .withLogName('force_source_deploy_with_sourcepath')
      .withFlag('--sourcepath', sourcePath)
      .withJson();
    return commandBuilder.build();
  }

  protected getDeployType() {
    return DeployType.Deploy;
  }
}

export class MultipleSourcePathsGatherer implements ParametersGatherer<string> {
  private uris: vscode.Uri[];
  public constructor(uris: vscode.Uri[]) {
    this.uris = uris;
  }
  public async gather(): Promise<ContinueResponse<string>> {
    const sourcePaths = this.uris.map(uri => uri.fsPath).join(',');
    return {
      type: 'CONTINUE',
      data: sourcePaths
    };
  }
}

export class LibraryPathsGatherer implements ParametersGatherer<string[]> {
  private uris: vscode.Uri[];
  public constructor(uris: vscode.Uri[]) {
    this.uris = uris;
  }
  public async gather(): Promise<ContinueResponse<string[]>> {
    const sourcePaths = this.uris.map(uri => uri.fsPath);
    return {
      type: 'CONTINUE',
      data: sourcePaths
    };
  }
}

export async function forceSourceDeploySourcePath(sourceUri: vscode.Uri) {
  if (!sourceUri) {
    const editor = vscode.window.activeTextEditor;
    if (editor && editor.document.languageId !== 'forcesourcemanifest') {
      sourceUri = editor.document.uri;
    } else {
      const errorMessage = nls.localize(
        'force_source_deploy_select_file_or_directory'
      );
      telemetryService.sendException(
        'force_source_deploy_with_sourcepath',
        errorMessage
      );
      notificationService.showErrorMessage(errorMessage);
      channelService.appendLine(errorMessage);
      channelService.showChannelOutput();
      return;
    }
  }
  const commandlet = new SfdxCommandlet(
    new SfdxWorkspaceChecker(),
    new FilePathGatherer(sourceUri),
    useBetaDeployRetrieve([sourceUri])
      ? new LibraryDeploySourcePathExecutor()
      : new ForceSourceDeploySourcePathExecutor(),
    new SourcePathChecker()
  );
  await commandlet.run();
}

export async function forceSourceDeployMultipleSourcePaths(uris: vscode.Uri[]) {
  const useBeta = useBetaDeployRetrieve(uris);
  const commandlet = new SfdxCommandlet(
    new SfdxWorkspaceChecker(),
    useBeta
      ? new LibraryPathsGatherer(uris)
      : new MultipleSourcePathsGatherer(uris),
    useBeta
      ? new LibraryDeploySourcePathExecutor()
      : new ForceSourceDeploySourcePathExecutor()
  );
  await commandlet.run();
}

export class LibraryDeploySourcePathExecutor extends LibraryCommandletExecutor<
  string | string[]
> {
  constructor() {
    super(
      'Deploy (Beta)',
      'force_source_deploy_with_sourcepath_beta',
      OUTPUT_CHANNEL
    );
  }

  public async run(
    response: ContinueResponse<string | string[]>
  ): Promise<boolean> {
    try {
      const components = this.getComponents(response.data);

      const operation = components
        .deploy({
          usernameOrConnection: await workspaceContext.getConnection()
        })
        .start();

      const metadataCount = JSON.stringify(createComponentCount(components));
      this.telemetry.addProperty('metadataCount', metadataCount);

      const result = await operation;

      BaseDeployExecutor.errorCollection.clear();

      if (result) {
        channelService.appendLine(
          createDeployOutput2(
            result,
            await SfdxPackageDirectories.getPackageDirectoryPaths()
          )
        );

        const success = result.response.status === RequestStatus.Succeeded;

        if (!success) {
          // handleDeployRetrieveLibraryDiagnostics(
          //   result,
          //   BaseDeployExecutor.errorCollection
          // );
        }

        return success;
      }

      return false;
    } finally {
      await DeployQueue.get().unlock();
    }
  }

  private getComponents(paths: string | string[]): ComponentSet {
    const components = new ComponentSet();
    if (typeof paths === 'string') {
      components.resolveSourceComponents(paths);
    } else {
      for (const filepath of paths) {
        components.resolveSourceComponents(filepath);
      }
    }
    return components;
  }
}
