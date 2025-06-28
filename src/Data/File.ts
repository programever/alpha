import fs from 'fs/promises';
import Path from 'path';
import minifyXML, { defaultOptions } from 'minify-xml';

/** baseName("/path/to/file.txt") => "file.txt" */
export function baseName(filePath: string): string {
  const absolutePath = Path.resolve(filePath);
  return Path.extname(absolutePath);
}

export function fileName(filePath: string): string {
  const absolutePath = Path.resolve(filePath);
  return Path.basename(absolutePath, Path.extname(absolutePath));
}

export async function dirExists(dirPath: string): Promise<boolean> {
  return fs
    .stat(dirPath)
    .then((s) => s.isDirectory())
    .catch(() => false);
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(Path.resolve(filePath));
    return stat.isFile();
  } catch {
    return false;
  }
}

export async function ensureFileExists(filePath: string): Promise<void> {
  const absolutePath = Path.resolve(filePath);
  const exists = await fileExists(absolutePath);
  if (!exists) {
    const dir = Path.dirname(absolutePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(absolutePath, '', { encoding: 'utf-8' });
  }
}

export async function readFile(filePath: string): Promise<string> {
  try {
    const absolutePath = Path.resolve(filePath);
    const content = await fs.readFile(absolutePath, 'utf-8');
    return content;
  } catch (err) {
    console.error(`Error reading file at ${filePath}:`, err);
    throw err;
  }
}

export async function loadMinifiedXMLFile(filePath: string): Promise<string> {
  return minifyXML(await readFile(filePath), {
    ...defaultOptions,
    removeSchemaLocationAttributes: true
  }).replace('<?xml version="1.0"?>', '\n');
}

export async function readDir(rootDir: string, ignoreDir: string[]): Promise<string[]> {
  const subDirs = await fs.readdir(rootDir, { withFileTypes: true });
  const files = await Promise.all(
    subDirs
      .filter((d) => ignoreDir.includes(d.name) === false)
      .map((d) => {
        const res = Path.resolve(rootDir, d.name);
        return d.isDirectory() ? readDir(res, ignoreDir) : res;
      })
  );
  return files.flat();
}

export async function readDirNames(rootDir: string): Promise<string[]> {
  const entries = await fs.readdir(rootDir, { withFileTypes: true });
  return entries.filter((d) => d.isDirectory()).map((d) => d.name);
}

export async function writeFile(filePath: string, content: string): Promise<void> {
  try {
    const absolutePath = Path.resolve(filePath);
    const dir = Path.dirname(absolutePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(absolutePath, content, { encoding: 'utf-8' });
  } catch (err) {
    console.error(`Error writing file at ${filePath}:`, err);
    throw err;
  }
}

export async function deleteFile(filePath: string): Promise<void> {
  try {
    await fs.access(filePath);
    await fs.unlink(filePath);
  } catch {
    return;
  }
}
