#include "sqlite3.h"

#ifndef WIZ_STOP_WORDS_H
#define WIZ_STOP_WORDS_H

bool isStopWord(const char* word);
bool isStopWord(const char* word, int len);

#endif //WIZ_STOP_WORDS_H

