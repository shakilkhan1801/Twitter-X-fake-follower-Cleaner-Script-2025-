// Twitter Inactive Follower Remover - Fixed Scroll
// Only scrolls down to load new followers, no going back to top

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const checkIfInactive = (followerElement) => {
  try {
    const text = followerElement.textContent.toLowerCase();
    
    const inactiveSignals = {
      noAvatar: false,
      lowActivity: false,
      noDescription: false,
      zeroTweets: false
    };
    
    // Check if 0 posts
    if (text.includes('0 posts') || text.includes('0 tweets')) {
      inactiveSignals.zeroTweets = true;
    }
    
    // Check for low post count (1-10)
    const postMatch = text.match(/(\d+)\s*(posts|tweets)/i);
    if (postMatch && parseInt(postMatch[1]) <= 10) {
      inactiveSignals.lowActivity = true;
    }
    
    // Check for default avatar
    const avatar = followerElement.querySelector('img[src*="profile"]');
    if (avatar && (avatar.src.includes('default_profile') || avatar.src.includes('egg'))) {
      inactiveSignals.noAvatar = true;
    }
    
    // Check if no bio
    const bioContainer = followerElement.querySelector('[data-testid="UserCell"]');
    const hasBio = bioContainer && bioContainer.textContent.length > 100;
    if (!hasBio) {
      inactiveSignals.noDescription = true;
    }
    
    const signalCount = Object.values(inactiveSignals).filter(v => v).length;
    return signalCount >= 2;
    
  } catch (e) {
    return false;
  }
};

const removeInactiveFollowers = async () => {
  console.log('🚀 Inactive Follower Remover (Fixed) Started!');
  console.log('⚠️  Make sure you are on x.com/YourUsername/followers');
  console.log('💤 Will scan and remove inactive followers\n');
  
  let totalRemoved = 0;
  let totalScanned = 0;
  let processedUsernames = new Set(); // Track processed accounts
  let attempts = 0;
  let consecutiveNoNew = 0;
  const maxAttempts = 200;
  const maxNoNew = 20;
  
  while (attempts < maxAttempts && consecutiveNoNew < maxNoNew) {
    attempts++;
    
    try {
      // Get all visible follower cells
      const followerCells = Array.from(document.querySelectorAll('[data-testid="UserCell"]'));
      
      if (followerCells.length === 0) {
        console.log('⚠️ No followers found');
        break;
      }
      
      let foundNew = false;
      let removedThisAttempt = 0;
      
      // Process each visible follower
      for (let cell of followerCells) {
        // Get username
        const usernameEl = cell.querySelector('[dir="ltr"] span');
        const username = usernameEl?.textContent || '';
        
        // Skip if already processed
        if (processedUsernames.has(username) || !username) {
          continue;
        }
        
        processedUsernames.add(username);
        totalScanned++;
        foundNew = true;
        
        // Check if inactive
        if (!checkIfInactive(cell)) {
          continue; // Skip active accounts
        }
        
        try {
          // Get post count
          const postMatch = cell.textContent.match(/(\d+)\s*(posts|tweets)/i);
          const postCount = postMatch ? postMatch[1] : '?';
          
          // Find action button
          const moreButton = cell.querySelector('[data-testid^="userActions"]') || 
                            cell.querySelector('[aria-label="More"]') ||
                            cell.querySelector('button[aria-label*="More"]');
          
          if (!moreButton) continue;
          
          moreButton.click();
          await wait(400);
          
          // Find remove option
          const menuItems = document.querySelectorAll('[role="menuitem"]');
          let removeButton = null;
          
          for (let item of menuItems) {
            const text = item.textContent.toLowerCase();
            if (text.includes('remove') && text.includes('follower')) {
              removeButton = item;
              break;
            }
          }
          
          if (removeButton) {
            removeButton.click();
            await wait(400);
            
            const confirmButton = document.querySelector('[data-testid="confirmationSheetConfirm"]');
            if (confirmButton) {
              confirmButton.click();
              await wait(400);
            }
            
            totalRemoved++;
            removedThisAttempt++;
            console.log(`💤 Removed: @${username} (${postCount} posts) - Total: ${totalRemoved}`);
            
            cell.style.display = 'none';
            
          } else {
            document.body.click();
            await wait(200);
          }
          
        } catch (e) {
          console.error('Error:', e.message);
          try { document.body.click(); } catch {}
          await wait(300);
        }
        
        const delay = 600 + Math.random() * 400;
        await wait(delay);
      }
      
      if (!foundNew) {
        consecutiveNoNew++;
        console.log(`⚠️ No new followers (${consecutiveNoNew}/${maxNoNew})`);
      } else {
        consecutiveNoNew = 0;
      }
      
      if (removedThisAttempt > 0) {
        console.log(`✅ Removed ${removedThisAttempt} this round | Total scanned: ${totalScanned}`);
      }
      
      // Scroll down to load more followers (NO going back to top)
      window.scrollBy({ top: 800, behavior: 'smooth' });
      await wait(2000);
      
      // Progress update
      if (attempts % 5 === 0) {
        console.log(`\n📊 Progress: ${totalScanned} scanned, ${totalRemoved} removed\n`);
      }
      
      // Hide sidebar
      document.querySelectorAll('[data-testid="sidebarColumn"] > div').forEach(div => {
        div.style.display = 'none';
      });
      
    } catch (error) {
      console.error('Error:', error.message);
      await wait(1500);
    }
  }
  
  console.log(`\n\n🎉 CLEANUP COMPLETE!`);
  console.log(`📊 Total followers scanned: ${totalScanned}`);
  console.log(`💤 Inactive accounts removed: ${totalRemoved}`);
  console.log(`✅ Your follower quality improved!`);
};

setTimeout(() => {
  removeInactiveFollowers().catch(e => console.error('Fatal error:', e));
}, 2000);
