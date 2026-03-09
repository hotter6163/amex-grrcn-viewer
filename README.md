# AMEX GRRCN Viewer

American Express GRRCN (Global Raw Data Reconciliation) ファイルをブラウザ上で可視化するツールです。

ローカルの GRRCN ファイルを選択するだけで、全レコードを階層的に表示します。

## セットアップ

```bash
npm install
```

## 起動

```bash
npm run dev
```

ブラウザで http://localhost:5173/ を開きます。

## 使い方

1. ブラウザでアプリを開く
2. GRRCN ファイル（`.decrypted` 等）をドラッグ&ドロップ、または「ファイルを選択」ボタンでアップロード
3. パース結果が階層的に表示される
   - **Header** - ファイルメタ情報（作成日時、バージョン等）
   - **Summary** - 支払いサマリー（Net/Gross/Discount/ServiceFee/Tax/Adjustment の金額内訳）
   - **Submission** - SOC バッチ単位の集計（折りたたみ可能）
   - **Transaction** - 個別取引の一覧テーブル（行クリックで Pricing 詳細を展開）
   - **Transaction Pricing** - 取引ごとの手数料明細（Fee Code, Discount Rate 等）
   - **Chargeback** - チャージバック
   - **Adjustment** - 調整レコード
   - **Fees & Revenues** - 手数料・収益（US/Canada のみ）
   - **Trailer** - ファイル末尾のレコードカウント

## 対応フォーマット

- GRRCN v4.01 CSV Delimited 形式
- v2.01 / v3.01 のファイルも基本的に読み込み可能（v4.01 固有フィールドは空欄として扱われます）

### パース仕様

[GRRCN File Specification (April 2024)](https://www.americanexpress.com/merchantspecs) に準拠しています。

| フォーマット | 説明 |
|---|---|
| 16バイト金額 `CNNNNNNNNNNNNNNN` | C=符号（スペース=正、`-`=負）、N=15桁数値。小数桁は通貨依存（JPY=0、他=2） |
| 22バイト金額 `ANNNNNNNNNNNNNNNNNNNNN` | A=符号、15桁整数部 + 6桁小数部（Transaction Pricing の Fee/Discount 用） |
| 7バイトレート `SWDDDDD` | S=符号、W=整数1桁、D=小数5桁（パーセントを小数値に変換済み） |
| 為替レート（15桁） | 整数7桁 + 小数8桁 |

## 技術スタック

- React 19
- React Router 7
- TypeScript
- Vite

## ライセンス

MIT
