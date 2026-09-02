/**
 * Data access layer for files — with automatic JSON fallback.
 * Tries D1 first. If D1 is unavailable (rate-limited, down, etc.),
 * silently falls back to the static materials.json file.
 */
import { drizzle } from 'drizzle-orm/d1';
import { filesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import materialsJson from '../data/materials.json';

export type FileNode = {
  id: string;
  type: 'file' | 'folder';
  name: string;
  parent: string;
  url: string | null;
  size: string | null;
  mimeType: string | null;
  addedAt: number;
};

// Track whether we're in fallback mode (set per-request by middleware)
let _fallbackMode = false;
export function setFallbackMode(val: boolean) { _fallbackMode = val; }
export function isFallbackMode() { return _fallbackMode; }

// Build a flat array from materials.json (done once at startup, zero cost)
const flatJsonNodes: FileNode[] = Object.values(materialsJson)
  .flat()
  .map((n: any) => ({
    id: n.id,
    type: n.type,
    name: n.name,
    parent: n.parent,
    url: n.url || null,
    size: n.size || null,
    mimeType: n.mimeType || null,
    addedAt: 0
  }));

export function invalidateCache() {
  // No-op now, kept for API compatibility
}

/** Get all files/folders */
export async function getAllNodes(DB: any): Promise<FileNode[]> {
  if (_fallbackMode) return flatJsonNodes;

  try {
    const db = drizzle(DB);
    return await db.select().from(filesTable).all() as FileNode[];
  } catch {
    _fallbackMode = true;
    return flatJsonNodes;
  }
}

/** Get root-level semester folders */
export async function getRootFolders(DB: any): Promise<FileNode[]> {
  if (_fallbackMode) {
    return flatJsonNodes
      .filter(n => n.parent === 'root')
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
  }

  try {
    const db = drizzle(DB);
    const results = await db.select().from(filesTable)
      .where(eq(filesTable.parent, 'root'))
      .all();
    return (results as FileNode[]).sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
    );
  } catch {
    _fallbackMode = true;
    return flatJsonNodes
      .filter(n => n.parent === 'root')
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
  }
}

/** Get a single node by ID */
export async function getNodeById(DB: any, id: string): Promise<FileNode | undefined> {
  if (_fallbackMode) return flatJsonNodes.find(n => n.id === id);

  try {
    const db = drizzle(DB);
    const results = await db.select().from(filesTable)
      .where(eq(filesTable.id, id))
      .all();
    return results[0] as FileNode | undefined;
  } catch {
    _fallbackMode = true;
    return flatJsonNodes.find(n => n.id === id);
  }
}

/** Get direct children of a folder */
export async function getChildren(DB: any, parentId: string): Promise<FileNode[]> {
  if (_fallbackMode) {
    return flatJsonNodes
      .filter(n => n.parent === parentId)
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
  }

  try {
    const db = drizzle(DB);
    const results = await db.select().from(filesTable)
      .where(eq(filesTable.parent, parentId))
      .all();
    return (results as FileNode[]).sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
    );
  } catch {
    _fallbackMode = true;
    return flatJsonNodes
      .filter(n => n.parent === parentId)
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
  }
}

/** Build breadcrumb trail for a folder */
export async function buildBreadcrumbs(DB: any, folderId: string): Promise<FileNode[]> {
  const breadcrumbs: FileNode[] = [];
  let currentId = folderId;
  
  while (currentId && currentId !== 'root') {
    const node = await getNodeById(DB, currentId);
    if (!node) break;
    breadcrumbs.unshift(node);
    currentId = node.parent;
  }
  
  return breadcrumbs;
}

/** Recursively get all child files of a folder (for ZIP downloads) */
export async function getAllChildFiles(DB: any, folderId: string): Promise<{ id: string; name: string }[]> {
  // In fallback mode this uses the JSON, otherwise tries D1
  const allNodes = _fallbackMode ? flatJsonNodes : await getAllNodes(DB);
  const result: { id: string; name: string }[] = [];
  
  function collect(parentId: string) {
    const children = allNodes.filter(n => n.parent === parentId);
    for (const child of children) {
      if (child.type === 'file') {
        result.push({ id: child.id, name: child.name });
      } else {
        collect(child.id);
      }
    }
  }
  
  collect(folderId);
  return result;
}
