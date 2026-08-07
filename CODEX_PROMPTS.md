# Codexで最初に使うプロンプト

```text
このプロジェクトを確認してください。最初にAGENTS.md、README.md、project-docs/DECODER_SPEC.mdを読んでください。

絶対条件は次のとおりです。
・入力欄は型式とシリアルナンバーの2つだけ
・正常な結果には推定製造年月と、販売期間との整合性を表示する
・推定年月が販売期間外なら「販売期間とシリアルが矛盾しています」と明示する
・未登録型式、シリアル形式不正、成立しない年月コード、英字Oの欠番、未来年月コードは「整合性なし」ではなく入力エラーとして区別する
・特定シリアルの実在、ラベル交換、偽物などを断定しない
・信頼度、詳細な判定根拠、候補年月、部品情報、外部販売サイト検索は表示しない
・非公式の推定であることを固定表示する
・RETUNE WORKSとX・Reverb・Instagramはフッターに控えめに置く

まずファイルを変更せず npm test を実行し、成功後に npm run dev で表示確認してください。問題がある場合だけ修正し、変更内容を報告してください。
```

## リンク差し替え
```text
私が添付するX、Reverb、InstagramのURLやボタン素材に差し替えてください。RETUNE WORKSの宣伝感を強くせず、フッター内に控えめに配置してください。変更後にnpm testを実行してください。
```

## 通常更新（変更 → テスト → PR作成まで）
```text
このBOSS年代判別サイトを更新してください。最初にAGENTS.md、README.md、CODEX_PROMPTS.md、project-docs/DECODER_SPEC.md、package.json、tests/、scripts/を確認し、既存仕様とテストを理解してください。

更新内容：
［ここに変更したい内容を日本語で入力］

mainへ直接コミットまたはPushせず、agent/から始まる作業ブランチを使用してください。変更後はnpm testとnpm run generate-pagesを実行し、生成されたdocs/に変更がある場合は必要な生成物もコミットしてください。すべて成功したらGitHubへPushし、mainをベースとするPull Requestを作成してください。テスト失敗時はマージやDeployを行わず、原因を報告してください。今回はPull Request作成までで止め、mainへのマージとDeployは行わないでください。
```

## Deployまで（変更 → テスト → PR作成 → マージ → 公開確認）
```text
このBOSS年代判別サイトを更新し、問題がなければDeployまで進めてください。最初にAGENTS.md、README.md、CODEX_PROMPTS.md、project-docs/DECODER_SPEC.md、package.json、tests/、scripts/を確認し、既存仕様とテストを理解してください。

更新内容：
［ここに変更したい内容を日本語で入力］

mainへ直接コミットまたはPushせず、agent/から始まる作業ブランチを使用してください。変更後はnpm testとnpm run generate-pagesを実行し、生成されたdocs/に変更がある場合は必要な生成物もコミットしてください。すべて成功したらGitHubへPushし、mainをベースとするPull Requestを作成してください。GitHub Actionsが成功したことを確認し、問題がなければmainへマージしてください。マージ後はGitHub Pagesの公開完了と公開結果を確認してください。テスト、GitHub Actions、または公開確認で問題が発生した場合は、無理にマージやDeployを進めず原因を報告してください。
```
