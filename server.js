// server.js
import { serveDir } from "jsr:@std/http/file-server";

//直前の単語
let previousWord = "しりとり";
let wordHistries = ["しりとり"];

// localhostにDenoのHTTPサーバーを展開
Deno.serve(async (_req) => {
  const pathname = new URL(_req.url).pathname;
  console.log(`pathname: ${pathname}`);

  if (_req.method === "POST" && pathname === "/reset") {
    previousWord = "しりとり";
    wordHistries.splice(0);
    wordHistries.push("しりとり");
    return new Response(
      JSON.stringify({
        "nextWord": previousWord,
        "wordHistry": wordHistries,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      },
    );
  }

  if (_req.method === "GET" && pathname === "/shiritori") {
    return new Response(
      JSON.stringify({
        "nextWord": previousWord,
        "wordHistry": wordHistries,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      },
    );
  }

  // POST /shiritori: 次の単語を受け取って保存する
  if (_req.method === "POST" && pathname === "/shiritori") {
    // リクエストのペイロードを取得
    const requestJson = await _req.json();
    // JSONの中からnextWordを取得
    const nextWord = requestJson["nextWord"];

    const regex = /^[\p{scx=Hiragana}]+$/u;
    if (!regex.test(nextWord)) {
      return new Response(
        JSON.stringify({
          "errorMessage": "すべてひらがなで入力してください",
          "errorCode": "10004",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json; charset=utf-8" },
        },
      );
    }

    // previousWordの末尾とnextWordの先頭が同一か確認
    if (previousWord.slice(-1) === nextWord.slice(0, 1)) {
      if (nextWord.slice(-1) == "ん") {
        return new Response(
          JSON.stringify({
            "errorMessage": "んで終わっています",
            "errorCode": "10002",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json; charset=utf-8" },
          },
        );
      }

      for (let i = 0; i < wordHistries.length; i++) {
        if (wordHistries[i] === nextWord) {
          return new Response(
            JSON.stringify({
              "errorMessage": "すでに出た単語です",
              "errorCode": "10003",
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json; charset=utf-8" },
            },
          );
        }
      }

      // 同一であれば、previousWordを更新
      wordHistries.push(nextWord);
      previousWord = nextWord;
    } // 同一でない単語の入力時に、エラーを返す
    else {
      return new Response(
        JSON.stringify({
          "errorMessage": "前の単語に続いていません",
          "errorCode": "10001",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json; charset=utf-8" },
        },
      );
    }

    // 現在の単語を返す
    //return new Response(previousWord);
    return new Response(
      JSON.stringify({
        "nextWord": previousWord,
        "wordHistry": wordHistries,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      },
    );
  }

  // ./public以下のファイルを公開
  return serveDir(
    _req,
    {
      /*
            - fsRoot: 公開するフォルダを指定
            - urlRoot: フォルダを展開するURLを指定。今回はlocalhost:8000/に直に展開する
            - enableCors: CORSの設定を付加するか
            */
      fsRoot: "./public/",
      urlRoot: "",
      enableCors: true,
    },
  );
});
