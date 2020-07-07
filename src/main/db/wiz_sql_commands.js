const SqlCommands = [
  {
    version: '1.0',
    sql: [
      `CREATE TABLE wiz_db_version (
        version varchar(50) PRIMARY KEY,
        executed int
      );`,
      `CREATE TABLE wiz_note (
         guid                  char(36)                       not null,
         title                 varchar(768)                   not null,
         category              varchar(768)                   not null,
         name                  varchar(300),
         seo                   varchar(300),
         url                   varchar(2048),
         tags                  varchar(300),
         owner                 varchar(150),
         type                  varchar(20),
         file_type             varchar(20),
         created               int,
         modified              int,
         encrypted             int,
         attachment_count      int,
         data_md5              char(32),
         version               int,
         local_status          int,
         last_synced           int,
         starred               int,
         archived              int,
         on_top                int,
         trash                 int,
         deleted               int,
         text                  text,
         abstract              varchar(300),
         PRIMARY KEY (guid)
      );`,
      `CREATE TABLE wiz_meta (
         key                   varchar(36)                    not null,
         value                 varchar(768)                   not null,
         updated               int,
         PRIMARY KEY (key)
      );`,
      //
      // 全文索引
      `CREATE VIRTUAL TABLE fts_note USING fts5(
        guid UNINDEXED, 
        title, 
        text, 
        content='wiz_note', 
        content_rowid='rowid',
        tokenize='cjk'
      );`,
      // 触发器
      `CREATE TRIGGER wiz_note_ai AFTER INSERT ON wiz_note BEGIN
        INSERT INTO fts_note(rowid, guid, title, text) 
          VALUES (new.rowid, new.guid, new.title, new.text);
      END;`,

      `CREATE TRIGGER wiz_note_ad AFTER DELETE ON wiz_note BEGIN
        INSERT INTO fts_note(fts_note, rowid, guid, title, text) 
          VALUES('delete', old.rowid, old.guid, old.title, old.text);
      END;`,

      `CREATE TRIGGER wiz_note_au AFTER UPDATE ON wiz_note BEGIN
        INSERT INTO fts_note(fts_note, rowid, guid, title, text) 
          VALUES('delete', old.rowid, old.guid, old.title, old.text);
        INSERT INTO fts_note(rowid, guid, title, text) 
          VALUES (new.rowid, new.guid, new.title, new.text);
      END;`,

      `CREATE TABLE wiz_note_links (
        note_guid char(36),
        note_title varchar(255),
        PRIMARY KEY (note_guid, note_title)
      );`,
    ],
  },
];

module.exports = SqlCommands;
