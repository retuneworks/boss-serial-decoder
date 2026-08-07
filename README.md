# BOSSコンパクトエフェクター 製造年月検索

型式とシリアルナンバーから製造年月を推定し、型式の販売期間との整合性も確認する、無料・静的・非公式の日本語Webアプリです。

- 入力は型式とシリアルの2項目だけ
- 正常時は推定製造年月と販売期間との整合性を表示
- 販売期間外なら、型式とシリアルの矛盾を警告
- 未登録型式、形式不正、成立しない年月コード、未来コードは入力エラーとして区別
- 特定のシリアルが実在・発行されたことや、製品の真贋は断定しない
- 信頼度、詳細な判定根拠、部品入力、外部販売サイト検索は表示しない
- RETUNE WORKSの表記とX・Reverb・Instagramはフッターに控えめに配置

## 実行
```powershell
npm test
npm run dev
```
ブラウザで `http://localhost:4173` を開きます。

## 公開
GitHub Pagesで `main` ブランチの `/docs` を公開元にします。詳しくは `project-docs/PUBLISH_GITHUB_PAGES.md` を参照してください。
This repository uses automated validation before deployment.
