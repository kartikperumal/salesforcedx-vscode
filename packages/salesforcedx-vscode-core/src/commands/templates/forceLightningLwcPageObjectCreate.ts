/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {
  Command,
  SfdxCommandBuilder
} from '@salesforce/salesforcedx-utils-vscode/out/src/cli';
import { DirFileNameSelection } from '@salesforce/salesforcedx-utils-vscode/out/src/types';
import { LocalComponent } from '@salesforce/salesforcedx-utils-vscode/src/types';
import * as path from 'path';
import { nls } from '../../messages';
import { getRootWorkspacePath } from '../../util';
import {
  CompositeParametersGatherer,
  PathStrategyFactory,
  SfdxCommandlet,
  SfdxWorkspaceChecker,
  SourcePathStrategy
} from '../util';
import { MetadataTypeGatherer } from '../util';
import { SelectLwcComponentDir } from '../util/parameterGatherers';
import { OverwriteComponentPrompt } from '../util/postconditionCheckers';
import { BaseTemplateCommand } from './baseTemplateCommand';
import { LWC_TYPE } from './metadataTypeConstants';

export class ForceLightningLwcPageObjectCreateExecutor extends BaseTemplateCommand {
  constructor() {
    super(LWC_TYPE);
  }

  public build(data: DirFileNameSelection): Command {
    const builder = new SfdxCommandBuilder()
      .withDescription("Create a page object for lightning component")
      .withArg('force:lightning:lwc:pageobject:create')
      .withFlag(
        '--filepath',
        path.join(getRootWorkspacePath(), data.outputdir, data.fileName + '.json')
      )
      .withLogName('force_lightning_web_component_po_create');
    return builder.build();
  }

  public getSourcePathStrategy(): SourcePathStrategy {
    return PathStrategyFactory.createLwcTestStrategy();
  }
}

const filePathGatherer = new SelectLwcComponentDir();
const metadataTypeGatherer = new MetadataTypeGatherer(LWC_TYPE);
export async function forceLightningLwcTestCreate() {
  const commandlet = new SfdxCommandlet(
    new SfdxWorkspaceChecker(),
    new CompositeParametersGatherer<LocalComponent>(
      metadataTypeGatherer,
      filePathGatherer
    ),
    new ForceLightningLwcPageObjectCreateExecutor(),
    new OverwriteComponentPrompt()
  );
  await commandlet.run();
}
