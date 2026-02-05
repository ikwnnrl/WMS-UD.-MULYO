async function checkApi() {
    try {
        console.log("Fetching from http://localhost:3000/api/transactions...");
        const res = await fetch('http://localhost:3000/api/transactions?limit=1', {
            headers: { 'Cache-Control': 'no-cache' }
        });
        const data = await res.json();

        if (data.length > 0) {
            const tx = data[0];
            console.log("Latest Transaction from API:");
            console.log("ID:", tx.id);
            console.log("Quantity:", tx.quantity);
            console.log("InitialStock:", tx.initialStock);
            console.log("FinalStock:", tx.finalStock);

            if (tx.initialStock === undefined) {
                console.log("FAIL: initialStock is UNDEFINED in API response.");
            } else {
                console.log("SUCCESS: initialStock is present.");
            }
        } else {
            console.log("No transactions found.");
        }
    } catch (e) {
        console.error("Error fetching API:", e.message);
    }
}

checkApi();
