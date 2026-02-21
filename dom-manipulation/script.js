// Initial array of quote objects
let quotes = [
    { text: "The only limit to our realization of tomorrow is our doubts of today.", category: "Inspiration" },
    { text: "Do what you can, with what you have, where you are.", category: "Motivation" },
    { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", category: "Success" },
    { text: "Believe you can and you're halfway there.", category: "Motivation" },
    { text: "Act as if what you do makes a difference. It does.", category: "Inspiration" }
];

/**
 * Saves quotes to local storage.
 */
function saveQuotes() {
    localStorage.setItem('quotes', JSON.stringify(quotes));
}

/**
 * Fetches quotes from a mock server.
 */
async function fetchQuotesFromServer() {
    try {
        const response = await fetch('https://jsonplaceholder.typicode.com/posts?_limit=5');
        const posts = await response.json();
        // Map mock posts to quote objects
        return posts.map(post => ({
            text: post.title,
            category: "Server"
        }));
    } catch (error) {
        console.error("Error fetching from server:", error);
        return [];
    }
}

/**
 * Synchronizes local quotes with server data.
 */
async function syncQuotes() {
    const serverQuotes = await fetchQuotesFromServer();

    if (serverQuotes.length === 0) {
        showSyncNotification("Sync failed: Could not connect to server.", "error");
        return;
    }

    // Merge logic: Add server quotes if they don't already exist (based on text)
    let newQuotesCount = 0;
    serverQuotes.forEach(serverQuote => {
        const exists = quotes.some(localQuote => localQuote.text === serverQuote.text);
        if (!exists) {
            quotes.push(serverQuote);
            newQuotesCount++;
        }
    });

    if (newQuotesCount > 0) {
        saveQuotes();
        populateCategories();
        showSyncNotification(`Quotes synced with server! Added ${newQuotesCount} new quotes.`, "success");
    } else {
        showSyncNotification("Quotes synced with server. No new updates.", "success");
    }
}

/**
 * Displays a sync notification to the user.
 */
function showSyncNotification(message, type) {
    const statusEl = document.getElementById('syncStatus');
    statusEl.textContent = message;
    statusEl.className = `sync-notification show ${type}`;

    setTimeout(() => {
        statusEl.classList.remove('show');
    }, 4000);
}


/**
 * Displays a random quote from the quotes array.
 */
function showRandomQuote() {
    const quoteDisplay = document.getElementById('quoteDisplay');
    const categoryFilter = document.getElementById('categoryFilter').value;

    // Filter quotes based on selected category
    const filteredQuotes = categoryFilter === 'all'
        ? quotes
        : quotes.filter(q => q.category === categoryFilter);

    if (filteredQuotes.length === 0) {
        quoteDisplay.innerHTML = '<p class="quote-text">No quotes found for this category.</p>';
        return;
    }

    // Select a random index from filtered quotes
    const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
    const selectedQuote = filteredQuotes[randomIndex];

    // Store last viewed quote in session storage
    sessionStorage.setItem('lastQuote', JSON.stringify(selectedQuote));

    // Update the DOM with fade-out/fade-in effect
    quoteDisplay.style.opacity = 0;

    setTimeout(() => {
        quoteDisplay.innerHTML = `
            <p class="quote-text">"${selectedQuote.text}"</p>
            <p class="quote-category">${selectedQuote.category}</p>
        `;
        quoteDisplay.style.opacity = 1;
        quoteDisplay.style.transition = 'opacity 0.5s ease';
    }, 300);
}


/**
 * Adds a new quote to the array and updates the DOM.
 */
function addQuote() {
    const newQuoteText = document.getElementById('newQuoteText').value.trim();
    const newQuoteCategory = document.getElementById('newQuoteCategory').value.trim();

    if (newQuoteText === "" || newQuoteCategory === "") {
        alert("Please enter both a quote and a category.");
        return;
    }

    // Add to the array
    const newQuote = { text: newQuoteText, category: newQuoteCategory };
    quotes.push(newQuote);

    // Save to localStorage
    saveQuotes();

    // Update categories dropdown
    populateCategories();

    // Clear inputs

    document.getElementById('newQuoteText').value = "";
    document.getElementById('newQuoteCategory').value = "";

    // Show the newly added quote
    const quoteDisplay = document.getElementById('quoteDisplay');
    quoteDisplay.innerHTML = `
        <p class="quote-text">"${newQuote.text}"</p>
        <p class="quote-category">${newQuote.category} (Added!)</p>
    `;

    // Optional: Log feedback
    console.log("New quote added:", newQuote);
}

/**
 * Exports quotes to a JSON file.
 */
function exportToJsonFile() {
    const dataStr = JSON.stringify(quotes, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = "quotes.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Imports quotes from a JSON file.
 */
function importFromJsonFile(event) {
    const fileReader = new FileReader();
    fileReader.onload = function (event) {
        try {
            const importedQuotes = JSON.parse(event.target.result);
            if (Array.isArray(importedQuotes)) {
                quotes.push(...importedQuotes);
                saveQuotes();
                populateCategories(); // Update categories
                alert('Quotes imported successfully!');
                showRandomQuote(); // Refresh display
            } else {

                alert('Invalid JSON format. Expected an array of quotes.');
            }
        } catch (e) {
            alert('Error parsing JSON file.');
        }
    };
    if (event.target.files[0]) {
        fileReader.readAsText(event.target.files[0]);
    }
}


/**
 * Populates the category dropdown menu.
 */
function populateCategories() {
    const categoryFilter = document.getElementById('categoryFilter');
    const currentFilter = categoryFilter.value;

    // Extract unique categories
    const categories = Array.from(new Set(quotes.map(q => q.category)));

    // Reset dropdown but keep "All Categories"
    categoryFilter.innerHTML = '<option value="all">All Categories</option>';

    // Add categories to dropdown
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });

    // Restore previous filter if it still exists
    if (categories.includes(currentFilter)) {
        categoryFilter.value = currentFilter;
    }
}

/**
 * Filters quotes based on the selected category.
 */
function filterQuotes() {
    const categoryFilter = document.getElementById('categoryFilter').value;
    localStorage.setItem('lastCategoryFilter', categoryFilter);
    showRandomQuote();
}

// Event listener for the "Show New Quote" button

document.getElementById('newQuote').addEventListener('click', showRandomQuote);

/**
 * Initialization function.
 */
function init() {
    // Load quotes from local storage if they exist
    const storedQuotes = localStorage.getItem('quotes');
    if (storedQuotes) {
        quotes = JSON.parse(storedQuotes);
    }

    // Populate categories dropdown
    populateCategories();

    // Restore last selected category filter
    const lastFilter = localStorage.getItem('lastCategoryFilter');
    if (lastFilter) {
        document.getElementById('categoryFilter').value = lastFilter;
    }

    // Display last viewed quote from session storage or a random one
    const lastQuote = sessionStorage.getItem('lastQuote');

    if (lastQuote) {
        const selectedQuote = JSON.parse(lastQuote);
        const quoteDisplay = document.getElementById('quoteDisplay');
        quoteDisplay.innerHTML = `
            <p class="quote-text">"${selectedQuote.text}"</p>
            <p class="quote-category">${selectedQuote.category} (Last viewed)</p>
        `;
    } else {
        showRandomQuote();
    }

    // Start periodic syncing (every 30 seconds)
    setInterval(syncQuotes, 30000);

    // Initial sync
    syncQuotes();
}

// Initial call on load

window.onload = init;

