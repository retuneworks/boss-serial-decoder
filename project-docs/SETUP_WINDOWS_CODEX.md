# Windows＋Codexでの実行手順

1. ZIPを展開して `Documents\boss-serial-decoder` などへ置きます。
2. PowerShellで `node --version` と `npm --version` を確認します。表示されなければNode.js LTS版をインストールします。
3. CodexでREADME.mdがある最上位フォルダを開きます。
4. CODEX_PROMPTS.mdの最初のプロンプトを貼ります。
5. PowerShellでプロジェクトフォルダへ移動し、次を実行します。
```powershell
npm test
npm run dev
```
6. ブラウザで `http://localhost:4173` を開きます。終了は `Ctrl + C` です。
7. 次を確認します。
   - `BF-2 / 141100` → `1982年1月`、販売期間との整合性あり
   - `OD-1 / JG83100` → `1994年11月`、販売期間との整合性なし
   - 未登録型式 → 型式入力エラー
   - `12345` → シリアル入力エラー
   - `A0O0000` → O欠番によるシリアル入力エラー
