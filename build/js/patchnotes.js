// =====================================================
//  Aurora Skylines — Dynamic Patch Notes
// =====================================================
'use strict';

const GITHUB_API_URL = 'https://api.github.com/repos/AuroraSkylines/AuroraSkylines/commits?per_page=10';
const LOCAL_STORAGE_KEY = 'aurora_last_viewed_patch';

document.addEventListener('DOMContentLoaded', () => {
  fetchLatestPatchNotes();
});

async function fetchLatestPatchNotes() {
  const versionText = document.getElementById('version-text');
  const versionDisplay = document.getElementById('version-display');
  const patchList = document.getElementById('patchnotes-list');
  
  if (!versionText || !patchList) return;

  try {
    const response = await fetch(GITHUB_API_URL);
    if (!response.ok) throw new Error('Failed to fetch commits');
    
    const commits = await response.json();
    if (!commits || commits.length === 0) {
      versionText.textContent = 'ALPHA (Offline)';
      return;
    }

    const latestCommit = commits[0];
    const latestSha = latestCommit.sha.substring(0, 7);
    
    // Update version display
    versionText.textContent = `ALPHA Build ${latestSha}`;

    // Check if it's a new patch we haven't seen
    const lastViewed = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (lastViewed !== latestSha) {
      versionDisplay.classList.add('patch-blink');
    }

    // Populate the patch notes list
    patchList.innerHTML = ''; // Clear loading text
    
    commits.forEach(commitObj => {
      const sha = commitObj.sha.substring(0, 7);
      const message = commitObj.commit.message.split('\n')[0]; // Get first line of commit message
      const dateStr = commitObj.commit.author.date;
      
      // Format date nicely
      const date = new Date(dateStr);
      const formattedDate = date.toLocaleDateString(undefined, { 
        year: 'numeric', month: 'short', day: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
      });

      const item = document.createElement('div');
      item.className = 'patch-item';
      
      item.innerHTML = `
        <div class="patch-header">
          <span class="patch-sha">${sha}</span>
          <span class="patch-date">${formattedDate}</span>
        </div>
        <div class="patch-msg">${escapeHtml(message)}</div>
      `;
      
      patchList.appendChild(item);
    });

  } catch (error) {
    console.error('Error fetching patch notes:', error);
    versionText.textContent = 'ALPHA (Local)';
    patchList.innerHTML = `<div style="text-align:center;color:rgba(255,100,100,0.8);padding:20px;">Could not load patch notes.</div>`;
  }
}

function openPatchnotes() {
  const overlay = document.getElementById('patchnotes-overlay');
  const versionDisplay = document.getElementById('version-display');
  
  if (overlay) {
    overlay.classList.remove('hidden');
    overlay.classList.add('is-visible');
  }
  
  // Remove blink and save viewed status
  if (versionDisplay && versionDisplay.classList.contains('patch-blink')) {
    versionDisplay.classList.remove('patch-blink');
    
    // Get current text to extract the hash and save it
    const text = document.getElementById('version-text').textContent;
    if (text.includes('Build ')) {
      const hash = text.split('Build ')[1];
      localStorage.setItem(LOCAL_STORAGE_KEY, hash);
    }
  }
}

function closePatchnotes() {
  const overlay = document.getElementById('patchnotes-overlay');
  if (overlay) {
    overlay.classList.remove('is-visible');
    // slight delay for transition
    setTimeout(() => {
      overlay.classList.add('hidden');
    }, 250);
  }
}

function escapeHtml(unsafe) {
  return unsafe
       .replace(/&/g, "&amp;")
       .replace(/</g, "&lt;")
       .replace(/>/g, "&gt;")
       .replace(/"/g, "&quot;")
       .replace(/'/g, "&#039;");
}
