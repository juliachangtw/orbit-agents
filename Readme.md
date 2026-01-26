您可以在專案的 dist/ 資料夾中找到以下檔案：
   * Orbit-1.0.0-arm64.dmg (100MB)：這是主要的安裝檔，您可以將這個檔案傳送給其他 Mac 使用者安裝。
   * Orbit-1.0.0-arm64-mac.zip (97MB)：這是應用程式的壓縮檔。

  注意事項：
  由於您的電腦上目前沒有設定 Apple Developer 憑證，所以這個 App 是 未簽名 (Unsigned) 的。
  當您把檔案傳給朋友或安裝在其他電腦時，macOS 會跳出「無法打開，因為它來自未識別的開發者」的安全性警告。

  解決方法：
  請告訴使用者在開啟 App 時：
   1. 按住 Control 鍵 (或是右鍵) 點擊 App 圖示。
   2. 選擇 「打開」 (Open)。
   3. 在跳出的警告視窗中再次點擊 「打開」。
  (這樣做只需在第一次執行時操作，之後就可以直接點開了)

  如果您需要 build 給 Windows 或 Linux 使用者，可以分別執行：
   * Windows: npm run build:win
   * Linux: npm run build:linux
