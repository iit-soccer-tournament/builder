# IIT Soccer Tournament - Builder Workspace

This is the administrative builder workspace for the **IIT Soccer Tournament**. It is a React + Vite application that operates in **Builder Mode** to edit, manage, and compile tournament databases, rules, matches, and images, and exports them as a static tournament database ZIP bundle.

The compiled public website is hosted in a separate repository: **[iit-soccer-tournament.github.io](https://github.com/iit-soccer-tournament/iit-soccer-tournament.github.io)**.

---

## Architecture Overview

```
                        ┌──────────────────────────────┐
                        │    IIT Tournament Builder    │
                        │ (iit-soccer-tournament/builder)│
                        └──────────────┬───────────────┘
                                       │
                                       │ (1) Export ZIP
                                       ▼
                             ┌───────────────────┐
                             │ database_data.zip │
                             └─────────┬─────────┘
                                       │
                                       │ (2) Extract to ./data
                                       ▼
              ┌──────────────────────────────────────────────────┐
              │              Public Static Website               │
              │ (iit-soccer-tournament.github.io)                │
              └──────────────────────────────────────────────────┘
```

1. **Builder Mode (This Repo)**: An administrative web tool configured to edit tournament years, schedules, scorers, and upload custom trophy images. All updates are stored reactively in `localStorage`. Once you are done editing, export your changes as a database ZIP file.
2. **Public Website (Deployed Repo)**: A lightweight, soccer-themed presentation site that fetches the unzipped database `./data/data.json` at runtime.

---

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open `http://localhost:5173` to access the builder workspace.

---

## How to Edit & Publish Updates

### Step 1: Manage and Edit in the Builder
1. Run the builder workspace locally or navigate to your hosted builder URL.
2. Update seasons, scores, rules, pitches, and register teams/trophies.
3. Use the **Live Preview Site** button to check how changes will look on the public website.

### Step 2: Export the Database Bundle
1. In the builder navbar, click **Export ZIP Bundle**.
2. This downloads a file named `iit_soccer_database_YYYY-MM-DD.zip` containing `data.json` and the uploaded trophy/pitch images inside an `images/` directory.

### Step 3: Unzip and Commit to Public Site Repo
1. Extract the downloaded ZIP file.
2. Place the contents (`data.json` and the `images/` folder) into the `data/` directory of your **iit-soccer-tournament.github.io** repository clone.
3. Commit and push the public site repo to deploy the changes to GitHub Pages:
   ```bash
   git add data/
   git commit -m "Update tournament database"
   git push origin main
   ```

---

## Building and Publishing Code Updates

If you make modifications to the React code, styles, or templates in the builder workspace, you will need to push the source code changes to the builder repo and compile the static assets for the public website.

### Publish Source to Builder Repository
```bash
git add .
git commit -m "Describe code changes"
git push origin main
```

### Publish Compiled Assets to Public Site Repository
We have included a helper script `publish_public.sh` to compile the app in **Public Website Mode** (hiding the builder, disabling localStorage caching, and enabling runtime fetching of `./data/data.json`) and copy the assets to your local public repo clone:

```bash
./publish_public.sh <path_to_local_public_site_clone>
# Example:
./publish_public.sh ../iit-soccer-tournament.github.io
```

Go to your local `iit-soccer-tournament.github.io` repository clone directory, inspect the updated files, commit, and push to deploy the new static code changes.
