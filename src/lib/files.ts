/**
 * Data access layer for files stored in D1.
 * All pages import from here instead of materials.json.
 */
import { drizzle } from 'drizzle-orm/d1';
import { filesTable } from '../db/schema';
import { eq } from 'drizzle-orm';

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

// In-memory cache for Worker isolates to massively reduce D1 reads and lag
let cachedNodes: FileNode[] | null = null;
let lastCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function invalidateCache() {
  cachedNodes = null;
}

/** Get all files/folders from the database (Cached) */
export async function getAllNodes(DB: any): Promise<FileNode[]> {
  if (cachedNodes && Date.now() - lastCacheTime < CACHE_TTL) {
    return cachedNodes;
  }
  const db = drizzle(DB);
  cachedNodes = await db.select().from(filesTable).all() as FileNode[];
  lastCacheTime = Date.now();
  return cachedNodes;
}

/** Get root-level semester folders */
export async function getRootFolders(DB: any): Promise<FileNode[]> {
  const db = drizzle(DB);
  const results = await db.select().from(filesTable)
    .where(eq(filesTable.parent, 'root'))
    .all();
  return (results as FileNode[]).sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
  );
}

/** Get a single node by ID */
export async function getNodeById(DB: any, id: string): Promise<FileNode | undefined> {
  const db = drizzle(DB);
  const results = await db.select().from(filesTable)
    .where(eq(filesTable.id, id))
    .all();
  return results[0] as FileNode | undefined;
}

/** Get direct children of a folder */
export async function getChildren(DB: any, parentId: string): Promise<FileNode[]> {
  const db = drizzle(DB);
  const results = await db.select().from(filesTable)
    .where(eq(filesTable.parent, parentId))
    .all();
  return (results as FileNode[]).sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
  );
}

/** Build breadcrumb trail for a folder (Optimized) */
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
  // Use cached nodes to prevent massive D1 reads for recursive search
  const allNodes = await getAllNodes(DB);
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

// End of file
