#include <string.h>

#include "sqlite3.h"
#include "utf8.h"
#include "stop_words.h"

#include <iostream>
#include <string>

// inline std::wstring utf8_to_wstring (const std::string& str) {
//   std::wstring_convert<std::codecvt_utf8<wchar_t>> conv;
//   return conv.from_bytes(str);
// }

// inline std::string wstring_to_utf8 (const std::wstring& str) {
//   std::wstring_convert<std::codecvt_utf8<wchar_t>> conv;
//   return conv.to_bytes(str);
// }

std::wstring utf8_to_wstring(const std::string& str) {
  if (str.empty()) {
    return L"";
  }
  unsigned len = str.size() + 1;
  setlocale(LC_CTYPE, "en_US.UTF-8");
  wchar_t *p = new wchar_t[len];
  mbstowcs(p, str.c_str(), len);
  std::wstring w_str(p);
  delete[] p;
  return w_str;
}
 
std::string wstring_to_utf8(const std::wstring& w_str) {
  if (w_str.empty()) {
    return "";
  }
  unsigned len = w_str.size() * 4 + 1;
  setlocale(LC_CTYPE, "en_US.UTF-8");
  char *p = new char[len];
  wcstombs(p, w_str.c_str(), len);
  std::string str(p);
  delete[] p;
  return str;
}

extern "C" {

typedef int xToken(
  void *pCtx,         /* Copy of 2nd argument to xTokenize() */
  int tflags,         /* Mask of FTS5_TOKEN_* flags */
  const char *pToken, /* Pointer to buffer containing token */
  int nToken,         /* Size of token in bytes */
  int iStart,         /* Byte offset of token within input text */
  int iEnd            /* Byte offset of end of token within input text */
);

struct Fts5Tokenizer {
  virtual ~Fts5Tokenizer() {}
  virtual int tokenize(void *pCtx, int flags, const char *pText, int nText, xToken* callback) = 0;
};

class CJKTokenizer : public Fts5Tokenizer {
public:
  virtual ~CJKTokenizer() {

  }
  int tokenize(void *pCtx, int flags, const char *pText, int nText, xToken* callback) {
    //
    const char* pOrigin = pText;
    bool lastIsLetter = false;
    //
    const char* pLetterStart = NULL;
    const char* pCharBegin = pText;
    //
    bool shouldEnd = false;
    //
    bool lastIsCjk = false;
    const char* pLastCjk = NULL;
    int cjkLength = 0;
    int letterLength = 0;
    u_long lastChar = 0;
    const char* pNumberStart = NULL;
    //
    do {
      //
      u_long ch = readNextUtf8Char(pText);
      if (!ch || ch == (u_long)(-1) || pText > pOrigin + nText) {
        shouldEnd = true;
      }
      //
      if (isNumber(ch)) {
        if (!pNumberStart) {
          pNumberStart = pText - 1; //记住数字开始位置
        }
      } else {
        if (ch != '.') {
          pNumberStart = NULL;
        }
      }
      //
      //特殊情况：ip或者小树
      bool processed = false;
      //
      if (ch == '.' && pNumberStart) {
        //dot
        const char* pNow = pText;
        u_long chNext = readNextUtf8Char(pText);
        pText = pNow; //restore
        if (isNumber(chNext)) {
          //可能是一个ip地址，也可能是一个数字
          const char* pNumberOrIp = pNumberStart;
          bool ret = readNumberOrIpAddress(pNumberOrIp);
          if (ret) {
            //number or ip
            pText = pNumberOrIp; //已经处理完整个数字或者ip，可以到下一个
            //
            const char* pEnd = pText; //指向下一个字符
            const char* pStart = pNumberStart;
            int textLen = pEnd - pStart;
            int ret = processWord(pCtx, flags, pOrigin, callback, pStart, pEnd, textLen, false);
            if (0 != ret) {
              return ret;
            }
            processed = true;
          }
          //
        }
      }
      //
      //
      //标准处理方式
      bool currentIsLetter = isLetter(ch);
      if (!processed) {

        if (currentIsLetter == lastIsLetter) {
          //
          //和前一个同类型，继续
          //
          if (lastIsLetter) {
            //当前是一个单词，中文等等
            //
            bool isCjk = isCJK(ch);
            //
            if (isCjk) {
              //
              if (lastIsCjk) {
                //两个连续CJK，则当成一个word处理
                const char* pEnd = pText; //指向下一个字符
                const char* pStart = pLastCjk;
                int ret = processWord(pCtx, flags, pOrigin, callback, pStart, pEnd, 2, true);
                if (0 != ret) {
                  return ret;
                }
              }
              //标记当前Cjk
              pLastCjk = pCharBegin;
            }
            //
            //
            if (lastIsCjk != isCjk) {
              //
              if (isCjk) {
                //当前是CJK，则之前不是CJK，将之前的字符输出: abc测试
                const char* pEnd = pCharBegin; //指向当前字符
                int ret = processWord(pCtx, flags, pOrigin, callback, pLetterStart, pEnd, letterLength, false);
                if (0 != ret) {
                  return ret;
                }
                //
              } else {
                //
                //当前不是Cjk，则之前是CJK： 测试abcz，注意中间没有空格
                //是否需要处理单个Cjk情况？如果需要，则需要在这里进行处理
                //
                if (cjkLength == 1) {
                  const char* pEnd = pCharBegin; //指向当前字符
                  int ret = processWord(pCtx, flags, pOrigin, callback, pLetterStart, pEnd, cjkLength, true);
                  if (0 != ret) {
                    return ret;
                  }
                } else {
                  if ((FTS5_TOKENIZE_QUERY & flags) == 0) {
                    //处理一串汉字里面的最后一个，这样可以搜索一串汉字里面的最后一个汉字。
                    //否则的话搜索不到
                    const char* pStart = pLastCjk;
                    const char* pEnd = pCharBegin;
                    int ret = processWord(pCtx, flags, pOrigin, callback, pStart, pEnd, 1, true);
                    if (0 != ret) {
                      return ret;
                    }
                  }
                }
                //
              }
              //
              pLetterStart = pCharBegin; //新的CJK或者英文字母开始
              //
            }
            //
            lastIsCjk = isCjk;
            //记住当前cjk的位置
            if (lastIsCjk) {
              pLastCjk = pCharBegin;
            } else {
              pLastCjk = NULL;
            }
            //
          }
          //
        } else {
          //
          if (currentIsLetter) {
            //字符开始
            pLetterStart = pCharBegin;
            lastIsCjk = isCJK(ch);
            if (lastIsCjk) {
              pLastCjk = pCharBegin;
            }
            //
          } else {
            //字符结束
            //
            const char* pLetterEnd = pCharBegin; //指向当前字符
            //
            if (cjkLength >= 2 && lastIsCjk) {
              if ((FTS5_TOKENIZE_QUERY & flags) == 0) {
                //处理一串汉字里面的最后一个，这样可以搜索一串汉字里面的最后一个汉字。
                //否则的话搜索不到
                const char* pStart = pLastCjk;
                const char* pEnd = pCharBegin;
                int ret = processWord(pCtx, flags, pOrigin, callback, pStart, pEnd, 1, true);
                if (0 != ret) {
                  return ret;
                }
              }
            } else {
              int textLength = lastIsCjk ? cjkLength : letterLength;
              int ret = processWord(pCtx, flags, pOrigin, callback, pLetterStart, pLetterEnd, textLength, lastIsCjk);
              if (0 != ret) {
                return ret;
              }
            }
          }
          //
        }
      } 
      //
      //
      lastIsLetter = currentIsLetter;
      pCharBegin = pText;
      //
      if (lastIsCjk) {
        cjkLength++;
        letterLength = 0;
      } else {
        cjkLength = 0;
        //
        if (currentIsLetter) {
          letterLength++;
        } else {
          letterLength = 0;
        }
      }
      //
      lastChar = ch;
      //
    } while (!shouldEnd);
    //
    return 0;
  }
  //
private:
  int processWord(void *pCtx, int flags, const char *pText, xToken* callback, const char* pWordStart, const char* pWordEnd, int letterLength, bool isCjk) {
    const int textLen = pWordEnd - pWordStart;
    //
    if (isCjk) {

    } else {
      if ((FTS5_TOKENIZE_QUERY & flags) == 0) {
        if (letterLength < 2) {
          return 0;
        }
      }
    }
    //
    if (letterLength >= 64) {
      //超长单词，忽略
      return 0;
    }
    //
#ifdef _DEBUG
     char* word = new char[textLen + 1];
     strncpy(word, pWordStart, textLen);
     word[textLen] = 0;
     std::cout << word << ' ' << letterLength << std::endl;
     delete [] word;
#endif
    //
    if (isStopWord(pWordStart, textLen)) {
      return 0;
    }
    if (textLen <= 1 && !isCjk) {
      return 0;
    }
    //
    if (isCjk) {
      int ret = callback(pCtx, 0, pWordStart, textLen, pWordStart - pText, pWordEnd - pText);
      return ret;
    } else {
      //
      std::wstring wstr = utf8_to_wstring(std::string(pWordStart, textLen));
#ifdef _DEBUG
      std::wstring org = wstr;
#endif
      for (auto it = wstr.begin(); it != wstr.end(); it++) {
        *it = ::towlower(*it);
      }
      //std::transform(wstr.begin(), wstr.end(), wstr.begin(), ::towlower);
#ifdef _DEBUG
      std::wcout << org << L" -> " << wstr << std::endl;
#endif
      std::string utf8Str = wstring_to_utf8(wstr);
      int ret = callback(pCtx, 0, utf8Str.c_str(), utf8Str.length(), pWordStart - pText, pWordEnd - pText);
      return ret;    
    }
  }
};

static int createCjkTokenizer(void*, const char **azArg, int nArg, Fts5Tokenizer **ppOut) {
  //
  Fts5Tokenizer* tokenizer = new CJKTokenizer();
  *ppOut =tokenizer;
  //
  return 0;
}
static void deleteCjkTokenizer(Fts5Tokenizer* tokenizer) {  
  delete tokenizer;
}

static int cjkTokenize(Fts5Tokenizer* tokenizer, 
    void *pCtx,
    int flags,            /* Mask of FTS5_TOKENIZE_* flags */
    const char *pText, int nText, 
    int (*xToken)(
      void *pCtx,         /* Copy of 2nd argument to xTokenize() */
      int tflags,         /* Mask of FTS5_TOKEN_* flags */
      const char *pToken, /* Pointer to buffer containing token */
      int nToken,         /* Size of token in bytes */
      int iStart,         /* Byte offset of token within input text */
      int iEnd            /* Byte offset of end of token within input text */
    )
) {
  //
  return tokenizer->tokenize(pCtx, flags, pText, nText, xToken);
  //
}

static fts5_tokenizer cjkTokenizer = {
  createCjkTokenizer,
  deleteCjkTokenizer,
  cjkTokenize,
};

} //extern "C"

/*
** Return a pointer to the fts5_api pointer for database connection db.
** If an error occurs, return NULL and leave an error in the database 
** handle (accessible using sqlite3_errcode()/errmsg()).
*/
fts5_api *fts5_api_from_db(sqlite3 *db){
  fts5_api *pRet = 0;
  sqlite3_stmt *pStmt = 0;

  if( SQLITE_OK == sqlite3_prepare(db, "SELECT fts5(?1)", -1, &pStmt, 0) ) {
    sqlite3_bind_pointer(pStmt, 1, (void*)&pRet, "fts5_api_ptr", NULL);
    sqlite3_step(pStmt);
  }
  sqlite3_finalize(pStmt);
  return pRet;
}

int registerTokenizer(sqlite3 *db, fts5_tokenizer* tokenizer) {
  //
  fts5_api* api = fts5_api_from_db(db);
  if (!api) {
    return -1;
  }
  //
  return api->xCreateTokenizer(api, "cjk", NULL, tokenizer, NULL);  
}

int registerCjkTokenizer(sqlite3 *db) {
  //
  return registerTokenizer(db, &cjkTokenizer);
  //
}


void test() {
  // std::cout << "space isLetter: " << isLetter(' ') << std::endl;
  // std::cout << "? isPunctuation: " << isPunctuation('?') << std::endl;
  // std::cout << ". isPunctuation: " << isPunctuation(L'.') << std::endl;
  // std::cout << "+ isSymbol: " << isSymbol('+') << std::endl;
  // std::cout << "/ isSymbol: " << isSymbol('/') << std::endl;
  // std::cout << "/ isPunctuation: " << isPunctuation('/') << std::endl;
  // std::cout << "f isLetter: " << isLetter('f') << std::endl;
  // std::cout << "中 isLetter: " << isLetter(L'中') << std::endl;
  // std::cout << "？ isLetter: " << isLetter(L'？') << std::endl;
  // std::cout << "語 isLetter: " << isLetter(L'語') << std::endl;
  // std::cout << "ل isLetter: " << isLetter(L'ل') << std::endl;
  // std::cout << "。 isLetter: " << isLetter(L'。') << std::endl;
  // std::cout << "。 isPunctuation: " << isPunctuation(L'。') << std::endl;
  //  
}
