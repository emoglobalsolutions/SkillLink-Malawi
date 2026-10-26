SKILLLINK MALAWI PATCH

Files:
- index.html: includes all 28 Malawi districts in the public location filter and cache-busts app.js.
- app.js: safeguards the Join popup from being blocked by a missing/invalid Supabase setup and includes all 28 districts in provider registration.

IMPORTANT BEFORE UPLOADING app.js:
The app.js file you shared had the Supabase URL and publishable key masked. Open the new app.js and replace:
PASTE_YOUR_EXISTING_SUPABASE_PROJECT_URL_HERE
PASTE_YOUR_EXISTING_SUPABASE_PUBLISHABLE_KEY_HERE
with the REAL values from your existing GitHub app.js. Do not use a service_role/secret key. Use the public publishable/anon key only.

Upload both index.html and app.js to the ROOT of your GitHub repository, replacing the existing files. Keep style.css unchanged. Commit the changes, wait for GitHub Pages to redeploy, then reload the website.

The 28 districts included are:
Northern: Chitipa, Karonga, Likoma, Mzimba, Nkhata Bay, Rumphi.
Central: Dedza, Dowa, Kasungu, Lilongwe, Mchinji, Nkhotakota, Ntcheu, Ntchisi, Salima.
Southern: Balaka, Blantyre, Chikwawa, Chiradzulu, Machinga, Mangochi, Mulanje, Mwanza, Neno, Nsanje, Phalombe, Thyolo, Zomba.