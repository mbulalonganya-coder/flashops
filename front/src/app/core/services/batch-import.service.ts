import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { RuntimeConfigService } from './runtime-config.service';
import { ImportBatchCreatedRequest } from '../models/api.models';

export type BatchImportStreamResult = 'success' | 'error' | 'aborted';

@Injectable({ providedIn: 'root' })
export class BatchImportService {
  private readonly auth = inject(AuthService);
  private readonly runtime = inject(RuntimeConfigService);

  async streamCreatedImport(
    body: ImportBatchCreatedRequest,
    onLine: (line: string) => void,
    signal?: AbortSignal
  ): Promise<BatchImportStreamResult> {
    const token = this.auth.accessToken;
    if (!token) {
      throw new Error('Session expirée');
    }

    const url = `${this.runtime.apiUrl}/imports/batch/created`;
    let resp: Response;
    try {
      resp = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'text/plain',
      },
      body: JSON.stringify(body),
      signal,
    });
    } catch (e) {
      if (signal?.aborted || (e instanceof DOMException && e.name === 'AbortError')) {
        return 'aborted';
      }
      throw e;
    }

    if (resp.status === 409) {
      const err = await resp.json().catch(() => ({}));
      throw new Error((err as { error?: string }).error || 'Import déjà en cours');
    }
    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(text || `HTTP ${resp.status}`);
    }
    if (!resp.body) {
      throw new Error('Réponse vide');
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let lastLine = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n');
      buffer = parts.pop() ?? '';
      for (const part of parts) {
        lastLine = part;
        if (part.length) onLine(part);
      }
    }
    if (buffer.length) {
      lastLine = buffer;
      onLine(buffer);
    }

    if (lastLine.includes('ÉCHEC') || lastLine.startsWith('ERREUR:')) {
      return 'error';
    }
    if (lastLine.includes('TERMINÉ AVEC SUCCÈS')) {
      return 'success';
    }
    return lastLine.includes('ERREUR:') ? 'error' : 'success';
  }

  async fetchSyncStatus(): Promise<{ available: boolean; app_env: string }> {
    const token = this.auth.accessToken;
    if (!token) {
      return { available: false, app_env: 'prod' };
    }
    const resp = await fetch(`${this.runtime.apiUrl}/imports/batch/sync-status`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });
    if (!resp.ok) {
      return { available: false, app_env: 'prod' };
    }
    const json = (await resp.json()) as { data?: { available?: boolean; app_env?: string } };
    return {
      available: !!json.data?.available,
      app_env: json.data?.app_env ?? 'prod',
    };
  }

  async streamProdSync(
    body: {
      from: string;
      to: string;
      by_id_only?: boolean;
      analytics_from?: string;
      analytics_to?: string;
    },
    onLine: (line: string) => void,
    signal?: AbortSignal
  ): Promise<BatchImportStreamResult> {
    const token = this.auth.accessToken;
    if (!token) {
      throw new Error('Session expirée');
    }
    const url = `${this.runtime.apiUrl}/imports/batch/sync-from-prod`;
    let resp: Response;
    try {
      resp = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'text/plain',
        },
        body: JSON.stringify(body),
        signal,
      });
    } catch (e) {
      if (signal?.aborted || (e instanceof DOMException && e.name === 'AbortError')) {
        return 'aborted';
      }
      throw e;
    }
    if (resp.status === 403) {
      throw new Error('Synchronisation prod non disponible sur cet environnement');
    }
    if (resp.status === 409) {
      throw new Error('Un job batch est déjà en cours');
    }
    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(text || `HTTP ${resp.status}`);
    }
    if (!resp.body) {
      throw new Error('Réponse vide');
    }
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let lastLine = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n');
      buffer = parts.pop() ?? '';
      for (const part of parts) {
        lastLine = part;
        if (part.length) onLine(part);
      }
    }
    if (buffer.length) {
      lastLine = buffer;
      onLine(buffer);
    }
    if (lastLine.includes('ÉCHEC') || lastLine.startsWith('ERREUR:')) {
      return 'error';
    }
    if (lastLine.includes('TERMINÉ AVEC SUCCÈS')) {
      return 'success';
    }
    return lastLine.includes('ERREUR:') ? 'error' : 'success';
  }
}
