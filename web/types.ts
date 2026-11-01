export interface Note { id: string; title: string; folder: string; folderName: string; order: number; date: string; updated: string; tags: string[]; pinned: boolean; url: string; description: string; minutes: number; chars: number }
export interface Folder { id: string; name: string; description: string; color: string; count: number; url: string; notes: Note[] }
export interface Catalog { notes: Note[]; folders: Folder[] }
export interface Page { kind: string; noteId: string; folderId: string; title: string }
export interface Heading { id: string; title: string; level: number }
export interface Position { id: string; anchor: string; offset: number; y: number; at: number }
export type ReadingStatus = 'unread' | 'reading' | 'finished';
export interface ReadingRecord extends Position { progress: number; status: ReadingStatus; manual: boolean; visits: number }
export interface Bookmark { key: string; noteId: string; anchor: string; title: string; at: number }
export interface Annotation { id: string; noteId: string; anchor: string; start: number; end: number; comment: string; at: number; locator?: import('./annotation-locator').AnnotationLocator }
export interface Library { version: 1; records: Record<string, ReadingRecord>; bookmarks: Bookmark[]; annotations: Annotation[] }
export interface SearchSection { noteId: string; title: string; folder: string; folderName: string; section: string; anchor: string; url: string; body: string; tags: string[]; score?: number; excerpt?: string }
