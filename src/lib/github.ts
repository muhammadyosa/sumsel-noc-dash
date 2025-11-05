// GitHub API integration for data persistence
const GITHUB_API = 'https://api.github.com';
const REPO = import.meta.env.VITE_GITHUB_REPO || '';
const BRANCH = 'main';
const DATA_PATH = 'data';

export interface GitHubConfig {
  token?: string;
  repo: string;
}

// Get GitHub token from localStorage (user provides it)
export function getGitHubToken(): string | null {
  return localStorage.getItem('github_token');
}

export function setGitHubToken(token: string) {
  localStorage.setItem('github_token', token);
}

// Fetch file from GitHub
export async function fetchGitHubFile(filename: string): Promise<any> {
  const url = `${GITHUB_API}/repos/${REPO}/contents/${DATA_PATH}/${filename}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`GitHub API error: ${response.status}`);
    }
    
    const data = await response.json();
    const content = atob(data.content);
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error fetching ${filename}:`, error);
    return null;
  }
}

// Save file to GitHub (requires token)
export async function saveGitHubFile(filename: string, content: any): Promise<boolean> {
  const token = getGitHubToken();
  if (!token) {
    console.warn('No GitHub token available');
    return false;
  }

  const url = `${GITHUB_API}/repos/${REPO}/contents/${DATA_PATH}/${filename}`;
  
  try {
    // Get current file SHA (required for update)
    let sha: string | undefined;
    const existingResponse = await fetch(url);
    if (existingResponse.ok) {
      const existing = await existingResponse.json();
      sha = existing.sha;
    }

    const contentBase64 = btoa(JSON.stringify(content, null, 2));
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Update ${filename}`,
        content: contentBase64,
        branch: BRANCH,
        ...(sha && { sha })
      })
    });

    return response.ok;
  } catch (error) {
    console.error(`Error saving ${filename}:`, error);
    return false;
  }
}

// Check if online
export function isOnline(): boolean {
  return navigator.onLine;
}

// Setup online/offline listeners
export function setupOnlineListeners(
  onOnline: () => void,
  onOffline: () => void
) {
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);
  
  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
}
