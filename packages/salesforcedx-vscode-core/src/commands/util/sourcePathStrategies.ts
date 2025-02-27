/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { join } from 'path';

class DefaultPathStrategy implements SourcePathStrategy {
  public getPathToSource(
    dirPath: string,
    fileName: string,
    fileExt: string
  ): string {
    return join(dirPath, `${fileName}${fileExt}`);
  }
}
class BundlePathStrategy implements SourcePathStrategy {
  public getPathToSource(
    dirPath: string,
    fileName: string,
    fileExt: string
  ): string {
    const bundleName = fileName;
    return join(dirPath, bundleName, `${fileName}${fileExt}`);
  }
}

class WaveTemplateBundlePathStrategy implements SourcePathStrategy {
  public getPathToSource(
    dirPath: string,
    fileName: string,
    fileExt: string
  ): string {
    const bundleName = fileName;
    // template-info is the main static file name for all WaveTemplateBundles
    return join(dirPath, bundleName, `template-info${fileExt}`);
  }
}

class FunctionTemplatePathStrategy implements SourcePathStrategy {
  public getPathToSource(
    dirPath: string,
    fileName: string,
    fileExt: string
  ): string {
    return join(dirPath, 'functions', fileName, `index${fileExt}`);
  }
}

class LwcTestPathStrategy implements SourcePathStrategy {
  public getPathToSource(
    dirPath: string,
    fileName: string,
    fileExt: string
  ): string {
    return join(dirPath, '__tests__', `${fileName}.test${fileExt}`);
  }
}

//Just creating it in tests dir for now
class LwcPageObjectPathStrategy implements SourcePathStrategy {
  public getPathToSource(
    dirPath: string,
    fileName: string,
    fileExt: string
  ): string {
    return join(dirPath, '__tests__', `${fileName}.test${fileExt}`);
  }
}

export interface SourcePathStrategy {
  getPathToSource(dirPath: string, fileName: string, fileExt: string): string;
}

export class PathStrategyFactory {
  public static createDefaultStrategy(): DefaultPathStrategy {
    return new DefaultPathStrategy();
  }

  public static createLwcTestStrategy(): LwcTestPathStrategy {
    return new LwcTestPathStrategy();
  }

  public static createBundleStrategy(): BundlePathStrategy {
    return new BundlePathStrategy();
  }

  public static createWaveTemplateBundleStrategy(): WaveTemplateBundlePathStrategy {
    return new WaveTemplateBundlePathStrategy();
  }

  public static createFunctionTemplateStrategy(): FunctionTemplatePathStrategy {
    return new FunctionTemplatePathStrategy();
  }
}
