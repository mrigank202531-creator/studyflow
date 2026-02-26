# 📚 StudyFlow

Your personal study notes hub — dashboard, GitHub-powered HTML threads, and quick notes.

**Live URL after deploy:** `https://<your-username>.github.io/<repo-name>`

---

## 🚀 Setup in 5 steps

### 1. Create a GitHub repo
Go to [github.com/new](https://github.com/new), name it `studyflow` (or anything), set it to **Public**.

### 2. Push this project
```bash
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### 3. Enable GitHub Pages
1. Go to your repo → **Settings** → **Pages**
2. Under **Source**, select **GitHub Actions**
3. Save

### 4. Wait for deploy
The GitHub Action will run automatically on every push.  
Check progress under **Actions** tab — takes ~1 minute.

### 5. Open your app
Your app will be live at:  
`https://YOUR_USERNAME.github.io/YOUR_REPO/`

On first open, a setup modal will ask for your GitHub username and repo name.

---

## 📁 Adding HTML notes

1. Put `.html` files in the `notes/` folder of your repo (a sample is included)
2. Push to GitHub (or upload via GitHub.com)
3. In the app → **Threads** → click **Refresh**
4. Your notes appear instantly — no rebuild needed!

```
your-repo/
├── notes/
│   ├── sample-note.html   ← your study notes go here
│   ├── physics-ch1.html
│   ├── math-integrals.html
│   └── ...
├── src/
├── public/
└── ...
```

---

## ✨ Features

| Feature | Details |
|---|---|
| Dashboard | Daily goals, important pins, visual image board, streak counter |
| Threads | HTML notes loaded live from GitHub via API |
| Quick Notes | Tagged notes (study/todo/idea/review) saved in browser |
| Search | Global search across all notes |
| Dark mode | Always on — designed for night study sessions |

---

## 🛠 Local development

```bash
npm install
npm run dev
```
