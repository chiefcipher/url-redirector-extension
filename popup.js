function useProtocolUtil() {
  // Function to ensure the URL has a protocol (http or https)
  function ensureProtocol(url) {
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return `http://${url}`;
    }
    return url;
  }
  return {
    ensureProtocol,
  };
}

function useDomainUtils() {
  // Function to update the saved domains list in the popup
  function updateSavedDomainsList() {
    chrome.storage.local.get({ savedDomains: [] }, (result) => {
      const savedDomainsListContainer = document.getElementById("savedDomains");
      savedDomainsListContainer.innerHTML = "";

      result?.savedDomains?.forEach((domain) => {
        const domainItem = document.createElement("div");
        domainItem.className = "domain-item";

        const domainText = document.createElement("span");
        domainText.textContent = domain;

        const useBtn = document.createElement("button");
        useBtn.textContent = "Use";
        // Add event listener to set the target domain input when the use button is clicked
        useBtn.addEventListener("click", () => {
          document.getElementById("targetDomain").value = domain;
        });

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";

        // Add event listener to delete the domain from saved domains
        deleteBtn.addEventListener("click", () => {
          chrome.storage.local.get({ savedDomains: [] }, (result) => {
            const updatedDomains = result?.savedDomains?.filter(
              (d) => d !== domain
            );
            chrome.storage.local.set({ savedDomains: updatedDomains }, () => {
              updateSavedDomainsList();
            });
          });
        });

        domainItem.appendChild(domainText);
        domainItem.appendChild(useBtn);
        domainItem.appendChild(deleteBtn);
        savedDomainsListContainer.appendChild(domainItem);
      });
    });
  }

  return {
    updateSavedDomainsList,
  };
}
const { ensureProtocol } = useProtocolUtil();

const { updateSavedDomainsList } = useDomainUtils();

// Add event listener to the redirect button to redirect the current tab to the target domain
document.getElementById("redirectCurrent").addEventListener("click", () => {
  const targetDomain = document.getElementById("targetDomain").value.trim();
  if (targetDomain) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTab = tabs[0];
      if (currentTab) {
        const currentUrl = new URL(currentTab.url);
        const newUrl = `${targetDomain}${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`;

        chrome.storage.local.set({ lastUsedDomain: targetDomain });

        // Open in new tab (instead of redirecting current tab)
        chrome.tabs.create({
          url: ensureProtocol(newUrl),
          active: true, // Focus the new tab
          index: currentTab.index + 1 
        });
      }
    });
  }
});

// save the target domain when the user clicks the save button
document.getElementById("saveDomain").addEventListener("click", () => {
  const targetDomain = document.getElementById("targetDomain").value.trim();
  if (targetDomain) {
    chrome.storage.local.get({ savedDomains: [] }, (result) => {
      const savedDomains = result.savedDomains;
      if (!savedDomains.includes(targetDomain)) {
        savedDomains.push(targetDomain);
        chrome.storage.local.set({ savedDomains }, () => {
          updateSavedDomainsList();
        });
      }
    });
  }
});

// Load last used domain and saved domains on popup open
chrome.storage.local.get(["lastUsedDomain", "savedDomains"], (result) => {
  if (result.lastUsedDomain) {
    document.getElementById("targetDomain").value = result.lastUsedDomain;
  }
  if (result.savedDomains) {
    updateSavedDomainsList();
  }
});
