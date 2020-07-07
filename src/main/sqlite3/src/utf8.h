#ifndef WIZ_UTF8_H
#define WIZ_UTF8_H

#include <sys/types.h>

#ifdef WIN32
#include <winsock.h>
#endif


u_long readNextUtf8Char(const char* &p);
bool readNumberOrIpAddress(const char* &p);

inline bool isCJK(u_long ch) {
  return (ch >= 0x3040 && ch <= 0x318f)
    || (ch >= 0x3300 && ch <= 0x337f)
    || (ch >= 0x3400 && ch <= 0x3d2d)
    || (ch >= 0x4e00 && ch <= 0x9fff)
    || (ch >= 0xf900 && ch <= 0xfaff)
    || (ch >= 0xac00 && ch <= 0xd7af);
}

inline bool isSpace(u_long ch) {
  return (ch >= 0x0009 && ch <= 0x000d)
    || (ch >= 0x0020 && ch <= 0x00a0)
    || ch == 0x1680
    || (ch >= 0x2000 && ch <= 0x200A)
    || ch == 0x2028
    || ch == 0x2029
    || ch == 0x202F
    || ch == 0x205F
    || ch == 0x3000;
}

inline bool isNumber(u_long ch) {
  return ch >= '0' && ch <= '9';
}

bool isSymbol(u_long ch);
bool isPunctuation(u_long ch);
bool isLetter(u_long ch);

#endif //WIZ_UTF8_H
