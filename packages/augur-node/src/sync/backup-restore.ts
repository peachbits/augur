import { compressAndHashFile, fileCompatible, removeOldSyncFiles, restoreWarpSyncFile } from "./file-operations";
import { format } from "util";

export class BackupRestore {
  static async export(fileTemplate: string, networkId: string, dbVersion: number, syncfileTemplate: string, directoryDir: string) {
    const dbFileName = format(fileTemplate, networkId, dbVersion);

    removeOldSyncFiles(networkId, dbVersion, directoryDir);
    await compressAndHashFile(dbFileName, networkId, dbVersion, syncfileTemplate, directoryDir);
  }

  static async import(fileTemplate: string, networkId: string, dbVersion: number, syncFilename: string, directoryDir: string) {
    const dbFileName = format(fileTemplate, networkId, dbVersion);
    if (fileCompatible(syncFilename, networkId, dbVersion)) {
      await restoreWarpSyncFile(directoryDir, dbFileName, syncFilename);
    }
  }
}
