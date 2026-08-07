# GitHub Pagesで無料公開する手順

1. GitHubでPublicリポジトリ `boss-serial-decoder` を空の状態で作成します。
2. `site.config.json` の `baseUrl` を `https://ユーザー名.github.io/boss-serial-decoder/` に変更します。
3. PowerShellで実行します。
```powershell
npm run generate-pages
npm test
git init
git add .
git commit -m "Initial BOSS pedal date finder"
git branch -M main
git remote add origin https://github.com/ユーザー名/boss-serial-decoder.git
git push -u origin main
```
4. GitHubのリポジトリで `Settings → Pages → Deploy from a branch → main → /docs → Save` を選びます。
5. 公開URL `https://ユーザー名.github.io/boss-serial-decoder/` を開きます。

更新時は `npm test` の後、`git add .`、`git commit`、`git push` を実行します。
