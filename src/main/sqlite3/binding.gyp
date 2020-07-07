{
  "targets": [
    {
      "target_name": "wizsqlite3",
      "include_dirs": ["<!(node -e \"require('nan')\")"],
      "sources": [ 
        "src/sqlite3.c",
        "src/backup.cc",
        "src/database.cc",
        "src/node_sqlite3.cc",
        "src/statement.cc",
        "src/utf8.cc",
        "src/stop_words.cc",
        "src/cjk_tokenizer.cc"
      ],
      "defines": [ "SQLITE_ENABLE_FTS5" ]
    }
  ]
}