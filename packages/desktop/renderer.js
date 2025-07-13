// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process unless
// nodeIntegration is set to true in webPreferences.

document.addEventListener('DOMContentLoaded', function() {
  // Display version information
  document.getElementById('node-version').textContent = process.versions.node;
  document.getElementById('chrome-version').textContent = process.versions.chrome;
  document.getElementById('electron-version').textContent = process.versions.electron;

  // Demo button functionality
  const demoBtn = document.getElementById('demo-btn');
  const demoResult = document.getElementById('demo-result');
  let clickCount = 0;

  demoBtn.addEventListener('click', function() {
    clickCount++;
    demoResult.textContent = `You've clicked ${clickCount} times! 🎉`;
    
    // Fun animation
    demoBtn.style.transform = 'scale(0.95)';
    setTimeout(() => {
      demoBtn.style.transform = 'scale(1)';
    }, 150);
  });

  // Log that renderer is ready
  console.log('Supa Desktop renderer process is ready!');
  console.log('This is where your SvelteKit app will eventually live.');
  
  // Add keyboard shortcut for manual reload (Cmd/Ctrl + R)
  document.addEventListener('keydown', function(e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
      location.reload();
    }
  });
}); 