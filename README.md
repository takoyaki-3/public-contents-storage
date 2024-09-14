# Public Contents Storage

## 概要

このプロジェクトは、AWS CDKを用いて構築された、誰でもコンテンツをアップロードできるシンプルなストレージシステムです。 
S3バケットにコンテンツを保存し、API Gatewayを通じてアクセスすることができます。
アップロードは、クライアントサイドJavaScriptからS3への直接アップロードを行うため、サーバーサイドの処理を必要としません。
認証には、Google Authenticationを用いたJWT認証を採用しています。

## 特徴

* 簡単なファイルアップロード
* S3への直接アップロードによるサーバーレスな構成
* JWT認証によるセキュアなアクセス制御
* AWS CDKによるインフラストラクチャのコード化

## プロジェクト構成

```
.
├── bin
│   └── public-contents-storage.ts
├── cdk.json
├── jest.config.js
├── lambda
│   ├── index.mjs
│   └── package.json
├── lib
│   └── public-contents-storage-stack.ts
├── package.json
├── public
│   ├── app.js
│   └── index.html
├── test
│   └── public-contents-storage.test.ts
└── tsconfig.json
```

### 各ファイル・ディレクトリの役割

* **bin/public-contents-storage.ts**: CDKアプリケーションのエントリポイント。スタックを定義しデプロイします。
* **cdk.json**: CDKの設定ファイル。アプリケーションのエントリポイントやコンテキスト情報などを定義します。
* **jest.config.js**: Jestの設定ファイル。テストの実行環境などを定義します。
* **lambda/index.mjs**: API Gatewayから呼び出されるLambda関数のコード。S3へのアップロードURLを生成します。
* **lambda/package.json**: Lambda関数の依存関係を定義します。
* **lib/public-contents-storage-stack.ts**: AWSリソース(S3, Lambda, API Gateway)を定義するCDKスタック。
* **package.json**: プロジェクト全体の依存関係とスクリプトを定義します。
* **public/app.js**: ファイルアップロードのクライアントサイドJavaScriptコード。
* **public/index.html**: ファイルアップロードを行うためのHTMLファイル。
* **test/public-contents-storage.test.ts**: CDKスタックのテストコード。
* **tsconfig.json**: TypeScriptの設定ファイル。

## インストール方法

1. AWS CLIとCDKをインストールします。
2. このリポジトリをクローンします。
3. プロジェクトルートディレクトリで `npm install` を実行し、依存関係をインストールします。

## 環境変数の設定

以下の環境変数を設定する必要があります。

* **USER_NAME**: Google Authenticationで認証するユーザー名(メールアドレス)
* **BRANCH_NAME**: 
    * `prod` : 本番環境としてデプロイ
    * それ以外: ステージング環境としてデプロイ (デフォルトは`stg`)

### 環境変数の設定例 (Linux/macOS)

```bash
export USER_NAME="your_google_account@gmail.com"
export BRANCH_NAME="stg" 
```

## デプロイ方法

1. AWSの認証情報を設定します。
2. プロジェクトルートディレクトリで `npm run build` を実行し、TypeScriptコードをコンパイルします。
3. `cdk deploy` を実行して、AWSリソースをデプロイします。

## 使い方

1. デプロイが完了すると、API Gatewayのエンドポイントが出力されます。
2. `public/index.html` をブラウザで開き、ファイルをドラッグ&ドロップまたはファイル選択ダイアログでアップロードします。
3. アップロードが完了すると、ファイル名が一覧表示されます。ファイル名をクリックすると、ファイル名がクリップボードにコピーされます。


## APIエンドポイント

* **GET /content?filename={filename}**: S3へのアップロードURLを生成します。
    * **リクエストパラメータ**:
        * `filename`: アップロードするファイル名
    * **レスポンス**:
        * `uploadUrl`: S3へのアップロードURL


## 認証

このアプリケーションは、Google Authenticationを用いたJWT認証を採用しています。
`public/index.html` には、Google AuthenticationのJavaScriptライブラリが組み込まれており、ユーザーがログインするとIDトークンが発行されます。
APIリクエストを行う際には、このIDトークンをAuthorizationヘッダーに`Bearer {IDトークン}`の形式で付与する必要があります。

## ライセンス

このプロジェクトはMITライセンスで公開されています。 

## 注意点

* このプロジェクトはサンプル実装であり、本番環境での利用にはセキュリティやパフォーマンスなどの観点から更なる検討が必要です。
* S3バケットはパブリックアクセスが許可されているため、機密性の高いデータの保存には適していません。
* 本番環境にデプロイする場合は、`BRANCH_NAME` 環境変数を `prod` に設定してください。
* Google Authenticationの設定については、別途ドキュメントを参照してください。