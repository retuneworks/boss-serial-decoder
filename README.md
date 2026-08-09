# BOSS compact pedal serial number / date decoder

型番とシリアルナンバーからBOSSコンパクトエフェクターの製造年月を推定し、資料から整理した製造可能期間との整合性も確認する、無料・静的・非公式のWebアプリです。日本語と英語の独立したページを提供します。

公開サイト: [BOSSエフェクター シリアル年代判別・製造年検索](https://retuneworks.github.io/boss-serial-decoder/)

- 入力は型番とシリアルの2項目だけ
- 日本語・英語対応（静的URLと相互言語リンク）
- 正常時は推定製造年月と製造可能期間との整合性を3段階で表示
- 資料差がある型式では、判定と独立した資料差注記を表示
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

本プロジェクトおよび公開サイトはBOSS / Rolandの公式サービスではなく、各社との提携・承認関係もありません。
