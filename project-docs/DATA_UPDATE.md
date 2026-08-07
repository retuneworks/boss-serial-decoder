# 型式データ更新

Excelはローカルでのみ使用し、GitHubへ公開しません。
```powershell
npm run import-data -- "C:\path\to\BOSS_database.xlsx"
npm test
```
公開用JSONには、型式と販売期間の判定に必要な最小項目だけを書き出します。

製造可能期間と資料差の判定データは `docs/data/production-periods.json` で管理します。販売期間は参考表示用であり、製造年月との整合性判定には製造可能期間データを優先します。年単位の終了資料は `productionEndPrecision: "year"` とし、その年の12月までを包含する判定境界として保持します。
