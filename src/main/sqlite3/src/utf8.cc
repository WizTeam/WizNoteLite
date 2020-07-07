#include "utf8.h"
#include <vector>
#include <algorithm>


#define IS_IN_RANGE(c, f, l)    (((c) >= (f)) && ((c) <= (l)))

u_long readNextUtf8Char(const char* &p) 
{
  // TODO: since UTF-8 is a variable-length
  // encoding, you should pass in the input
  // buffer's actual byte length so that you
  // can determine if a malformed UTF-8
  // sequence would exceed the end of the buffer...

  u_char c1, c2, *ptr = (u_char*) p;
  u_long uc = 0;
  int seqlen;
  // int datalen = ... available length of p ...;    

  /*
  if( datalen < 1 )
  {
  // malformed data, do something !!!
  return (u_long) -1;
  }
  */

  c1 = ptr[0];

  if( (c1 & 0x80) == 0 )
  {
    uc = (u_long) (c1 & 0x7F);
    seqlen = 1;
  }
  else if( (c1 & 0xE0) == 0xC0 )
  {
    uc = (u_long) (c1 & 0x1F);
    seqlen = 2;
  }
  else if( (c1 & 0xF0) == 0xE0 )
  {
    uc = (u_long) (c1 & 0x0F);
    seqlen = 3;
  }
  else if( (c1 & 0xF8) == 0xF0 )
  {
    uc = (u_long) (c1 & 0x07);
    seqlen = 4;
  }
  else
  {
    // malformed data, do something !!!
    return (u_long) -1;
  }

  /*
  if( seqlen > datalen )
  {
  // malformed data, do something !!!
  return (u_long) -1;
  }
  */

  for(int i = 1; i < seqlen; ++i)
  {
    c1 = ptr[i];

    if( (c1 & 0xC0) != 0x80 )
    {
      // malformed data, do something !!!
      return (u_long) -1;
    }
  }

  switch( seqlen )
  {
  case 2:
    {
      c1 = ptr[0];

      if( !IS_IN_RANGE(c1, 0xC2, 0xDF) )
      {
      // malformed data, do something !!!
      return (u_long) -1;
      }

      break;
    }
  case 3:
    {
      c1 = ptr[0];
      c2 = ptr[1];

      switch (c1)
      {
      case 0xE0:
        if (!IS_IN_RANGE(c2, 0xA0, 0xBF))
        {
            // malformed data, do something !!!
            return (u_long) -1;
        }
        break;

      case 0xED:
        if (!IS_IN_RANGE(c2, 0x80, 0x9F))
        {
            // malformed data, do something !!!
            return (u_long) -1;
        }
        break;

      default:
        if (!IS_IN_RANGE(c1, 0xE1, 0xEC) && !IS_IN_RANGE(c1, 0xEE, 0xEF))
        {
            // malformed data, do something !!!
            return (u_long) -1;
        }
        break;
      }

      break;
    }

  case 4:
    {
      c1 = ptr[0];
      c2 = ptr[1];

      switch (c1)
      {
      case 0xF0:
        if (!IS_IN_RANGE(c2, 0x90, 0xBF))
        {
            // malformed data, do something !!!
            return (u_long) -1;
        }
        break;

      case 0xF4:
        if (!IS_IN_RANGE(c2, 0x80, 0x8F))
        {
            // malformed data, do something !!!
            return (u_long) -1;
        }
        break;

      default:
        if (!IS_IN_RANGE(c1, 0xF1, 0xF3))
        {
            // malformed data, do something !!!
            return (u_long) -1;
        }
        break;                
      }
      break;
    }
  }

  for(int i = 1; i < seqlen; ++i)
  {
    uc = ((uc << 6) | (u_long)(ptr[i] & 0x3F));
  }

  p += seqlen;

  return uc; 
}

bool readNumberOrIpAddress(const char* &p) {
  //
  int dotCount = 0;
  while (*p) {
    const char ch = *p;
    if (isNumber(ch)) {
      //
    } else if (ch == '.') {
      dotCount++;
    } else {
      break;
    }
    //
    p++;
  }
  //
  if (dotCount == 1) {
    //is a number, 1.0
  } else if (dotCount == 3) {
    //ip address, 192.168.1.1
  } else {
    //1.2.3.4.5.6 ...
  }
  //
  return true;
}


struct CODERANGE {
  u_long start;
  u_long end;
};

class CodeRange {
private:
  std::vector<CODERANGE> m_range;
public:
  CodeRange(const wchar_t* codeMap) {
    
    while (*codeMap) {
      const wchar_t curr = *codeMap;
      const wchar_t next = *(codeMap + 1);
      if (next == '-') {
        const wchar_t next2 = *(codeMap + 2);
        CODERANGE range;
        range.start = curr;
        range.end = next2;
        m_range.push_back(range);
        codeMap += 2;
      } else {
        CODERANGE range;
        range.start = curr;
        range.end = 0;
        m_range.push_back(range);
        codeMap++;
      }
      //
      std::sort(m_range.begin(), m_range.end(), [=](const CODERANGE& range1, const CODERANGE& range2) {
        return range1.start < range2.start;
      });
    }
  }
  bool isInRange(u_long ch) {
    //
    size_t size = m_range.size();
    if (size == 0) {
      return false;
    }
    //
    int start = 0;
    int end = size - 1;
    //
    while (start <= end) {
      //
      int index = (start + end) / 2;
      const CODERANGE& curr = m_range[index];
      if (curr.start && curr.end) {
        if (ch >= curr.start && ch <= curr.end) {
          return true;
        }
        //
        if (ch < curr.start) {
          end = index - 1;
        } else if (ch > curr.end) {
          start = index + 1;
        }
        //
      } else {
        //
        if (curr.start == ch) {
            return true;
        }
        //
        if (ch < curr.start) {
          end = index - 1;
        } else if (ch > curr.start) {
          start = index + 1;
        }
      }
    }
    return false;
  }
};

const wchar_t* SYMBOL_RANGE = L"\x24\x2B\x3C-\x3E\x5E\x60\x7C\x7E\xA2-\xA6\xA8\xA9\xAC\xAE-\xB1\xB4\xB8\xD7\xF7\x02C2-\x02C5\x02D2-\x02DF\x02E5-\x02EB\x02ED\x02EF-\x02FF\x0375\x0384\x0385\x03F6\x0482\x058D-\x058F\x0606-\x0608\x060B\x060E\x060F\x06DE\x06E9\x06FD\x06FE\x07F6\x09F2\x09F3\x09FA\x09FB\x0AF1\x0B70\x0BF3-\x0BFA\x0C7F\x0D4F\x0D79\x0E3F\x0F01-\x0F03\x0F13\x0F15-\x0F17\x0F1A-\x0F1F\x0F34\x0F36\x0F38\x0FBE-\x0FC5\x0FC7-\x0FCC\x0FCE\x0FCF\x0FD5-\x0FD8\x109E\x109F\x1390-\x1399\x17DB\x1940\x19DE-\x19FF\x1B61-\x1B6A\x1B74-\x1B7C\x1FBD\x1FBF-\x1FC1\x1FCD-\x1FCF\x1FDD-\x1FDF\x1FED-\x1FEF\x1FFD\x1FFE\x2044\x2052\x207A-\x207C\x208A-\x208C\x20A0-\x20BE\x2100\x2101\x2103-\x2106\x2108\x2109\x2114\x2116-\x2118\x211E-\x2123\x2125\x2127\x2129\x212E\x213A\x213B\x2140-\x2144\x214A-\x214D\x214F\x218A\x218B\x2190-\x2307\x230C-\x2328\x232B-\x23FE\x2400-\x2426\x2440-\x244A\x249C-\x24E9\x2500-\x2767\x2794-\x27C4\x27C7-\x27E5\x27F0-\x2982\x2999-\x29D7\x29DC-\x29FB\x29FE-\x2B73\x2B76-\x2B95\x2B98-\x2BB9\x2BBD-\x2BC8\x2BCA-\x2BD1\x2BEC-\x2BEF\x2CE5-\x2CEA\x2E80-\x2E99\x2E9B-\x2EF3\x2F00-\x2FD5\x2FF0-\x2FFB\x3004\x3012\x3013\x3020\x3036\x3037\x303E\x303F\x309B\x309C\x3190\x3191\x3196-\x319F\x31C0-\x31E3\x3200-\x321E\x322A-\x3247\x3250\x3260-\x327F\x328A-\x32B0\x32C0-\x32FE\x3300-\x33FF\x4DC0-\x4DFF\xA490-\xA4C6\xA700-\xA716\xA720\xA721\xA789\xA78A\xA828-\xA82B\xA836-\xA839\xAA77-\xAA79\xAB5B\xFB29\xFBB2-\xFBC1\xFDFC\xFDFD\xFE62\xFE64-\xFE66\xFE69\xFF04\xFF0B\xFF1C-\xFF1E\xFF3E\xFF40\xFF5C\xFF5E\xFFE0-\xFFE6\xFFE8-\xFFEE\xFFFC\xFFFD";
const wchar_t* PUNCTUATION_RANGE = L"\x21-\x23\x25-\x2A\x2C-\x2F\x3A\x3B\x3F\x40\x5B-\x5D\x5F\x7B\x7D\xA1\xA7\xAB\xB6\xB7\xBB\xBF\x037E\x0387\x055A-\x055F\x0589\x058A\x05BE\x05C0\x05C3\x05C6\x05F3\x05F4\x0609\x060A\x060C\x060D\x061B\x061E\x061F\x066A-\x066D\x06D4\x0700-\x070D\x07F7-\x07F9\x0830-\x083E\x085E\x0964\x0965\x0970\x0AF0\x0DF4\x0E4F\x0E5A\x0E5B\x0F04-\x0F12\x0F14\x0F3A-\x0F3D\x0F85\x0FD0-\x0FD4\x0FD9\x0FDA\x104A-\x104F\x10FB\x1360-\x1368\x1400\x166D\x166E\x169B\x169C\x16EB-\x16ED\x1735\x1736\x17D4-\x17D6\x17D8-\x17DA\x1800-\x180A\x1944\x1945\x1A1E\x1A1F\x1AA0-\x1AA6\x1AA8-\x1AAD\x1B5A-\x1B60\x1BFC-\x1BFF\x1C3B-\x1C3F\x1C7E\x1C7F\x1CC0-\x1CC7\x1CD3\x2010-\x2027\x2030-\x2043\x2045-\x2051\x2053-\x205E\x207D\x207E\x208D\x208E\x2308-\x230B\x2329\x232A\x2768-\x2775\x27C5\x27C6\x27E6-\x27EF\x2983-\x2998\x29D8-\x29DB\x29FC\x29FD\x2CF9-\x2CFC\x2CFE\x2CFF\x2D70\x2E00-\x2E2E\x2E30-\x2E44\x3001-\x3003\x3008-\x3011\x3014-\x301F\x3030\x303D\x30A0\x30FB\xA4FE\xA4FF\xA60D-\xA60F\xA673\xA67E\xA6F2-\xA6F7\xA874-\xA877\xA8CE\xA8CF\xA8F8-\xA8FA\xA8FC\xA92E\xA92F\xA95F\xA9C1-\xA9CD\xA9DE\xA9DF\xAA5C-\xAA5F\xAADE\xAADF\xAAF0\xAAF1\xABEB\xFD3E\xFD3F\xFE10-\xFE19\xFE30-\xFE52\xFE54-\xFE61\xFE63\xFE68\xFE6A\xFE6B\xFF01-\xFF03\xFF05-\xFF0A\xFF0C-\xFF0F\xFF1A\xFF1B\xFF1F\xFF20\xFF3B-\xFF3D\xFF3F\xFF5B\xFF5D\xFF5F-\xFF65";
const wchar_t* LETTER_RANGE = L"0-9A-Za-z\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\x02C1\x02C6-\x02D1\x02E0-\x02E4\x02EC\x02EE\x0370-\x0374\x0376\x0377\x037A-\x037D\x037F\x0386\x0388-\x038A\x038C\x038E-\x03A1\x03A3-\x03F5\x03F7-\x0481\x048A-\x052F\x0531-\x0556\x0559\x0561-\x0587\x05D0-\x05EA\x05F0-\x05F2\x0620-\x064A\x066E\x066F\x0671-\x06D3\x06D5\x06E5\x06E6\x06EE\x06EF\x06FA-\x06FC\x06FF\x0710\x0712-\x072F\x074D-\x07A5\x07B1\x07CA-\x07EA\x07F4\x07F5\x07FA\x0800-\x0815\x081A\x0824\x0828\x0840-\x0858\x08A0-\x08B4\x08B6-\x08BD\x0904-\x0939\x093D\x0950\x0958-\x0961\x0971-\x0980\x0985-\x098C\x098F\x0990\x0993-\x09A8\x09AA-\x09B0\x09B2\x09B6-\x09B9\x09BD\x09CE\x09DC\x09DD\x09DF-\x09E1\x09F0\x09F1\x0A05-\x0A0A\x0A0F\x0A10\x0A13-\x0A28\x0A2A-\x0A30\x0A32\x0A33\x0A35\x0A36\x0A38\x0A39\x0A59-\x0A5C\x0A5E\x0A72-\x0A74\x0A85-\x0A8D\x0A8F-\x0A91\x0A93-\x0AA8\x0AAA-\x0AB0\x0AB2\x0AB3\x0AB5-\x0AB9\x0ABD\x0AD0\x0AE0\x0AE1\x0AF9\x0B05-\x0B0C\x0B0F\x0B10\x0B13-\x0B28\x0B2A-\x0B30\x0B32\x0B33\x0B35-\x0B39\x0B3D\x0B5C\x0B5D\x0B5F-\x0B61\x0B71\x0B83\x0B85-\x0B8A\x0B8E-\x0B90\x0B92-\x0B95\x0B99\x0B9A\x0B9C\x0B9E\x0B9F\x0BA3\x0BA4\x0BA8-\x0BAA\x0BAE-\x0BB9\x0BD0\x0C05-\x0C0C\x0C0E-\x0C10\x0C12-\x0C28\x0C2A-\x0C39\x0C3D\x0C58-\x0C5A\x0C60\x0C61\x0C80\x0C85-\x0C8C\x0C8E-\x0C90\x0C92-\x0CA8\x0CAA-\x0CB3\x0CB5-\x0CB9\x0CBD\x0CDE\x0CE0\x0CE1\x0CF1\x0CF2\x0D05-\x0D0C\x0D0E-\x0D10\x0D12-\x0D3A\x0D3D\x0D4E\x0D54-\x0D56\x0D5F-\x0D61\x0D7A-\x0D7F\x0D85-\x0D96\x0D9A-\x0DB1\x0DB3-\x0DBB\x0DBD\x0DC0-\x0DC6\x0E01-\x0E30\x0E32\x0E33\x0E40-\x0E46\x0E81\x0E82\x0E84\x0E87\x0E88\x0E8A\x0E8D\x0E94-\x0E97\x0E99-\x0E9F\x0EA1-\x0EA3\x0EA5\x0EA7\x0EAA\x0EAB\x0EAD-\x0EB0\x0EB2\x0EB3\x0EBD\x0EC0-\x0EC4\x0EC6\x0EDC-\x0EDF\x0F00\x0F40-\x0F47\x0F49-\x0F6C\x0F88-\x0F8C\x1000-\x102A\x103F\x1050-\x1055\x105A-\x105D\x1061\x1065\x1066\x106E-\x1070\x1075-\x1081\x108E\x10A0-\x10C5\x10C7\x10CD\x10D0-\x10FA\x10FC-\x1248\x124A-\x124D\x1250-\x1256\x1258\x125A-\x125D\x1260-\x1288\x128A-\x128D\x1290-\x12B0\x12B2-\x12B5\x12B8-\x12BE\x12C0\x12C2-\x12C5\x12C8-\x12D6\x12D8-\x1310\x1312-\x1315\x1318-\x135A\x1380-\x138F\x13A0-\x13F5\x13F8-\x13FD\x1401-\x166C\x166F-\x167F\x1681-\x169A\x16A0-\x16EA\x16F1-\x16F8\x1700-\x170C\x170E-\x1711\x1720-\x1731\x1740-\x1751\x1760-\x176C\x176E-\x1770\x1780-\x17B3\x17D7\x17DC\x1820-\x1877\x1880-\x1884\x1887-\x18A8\x18AA\x18B0-\x18F5\x1900-\x191E\x1950-\x196D\x1970-\x1974\x1980-\x19AB\x19B0-\x19C9\x1A00-\x1A16\x1A20-\x1A54\x1AA7\x1B05-\x1B33\x1B45-\x1B4B\x1B83-\x1BA0\x1BAE\x1BAF\x1BBA-\x1BE5\x1C00-\x1C23\x1C4D-\x1C4F\x1C5A-\x1C7D\x1C80-\x1C88\x1CE9-\x1CEC\x1CEE-\x1CF1\x1CF5\x1CF6\x1D00-\x1DBF\x1E00-\x1F15\x1F18-\x1F1D\x1F20-\x1F45\x1F48-\x1F4D\x1F50-\x1F57\x1F59\x1F5B\x1F5D\x1F5F-\x1F7D\x1F80-\x1FB4\x1FB6-\x1FBC\x1FBE\x1FC2-\x1FC4\x1FC6-\x1FCC\x1FD0-\x1FD3\x1FD6-\x1FDB\x1FE0-\x1FEC\x1FF2-\x1FF4\x1FF6-\x1FFC\x2071\x207F\x2090-\x209C\x2102\x2107\x210A-\x2113\x2115\x2119-\x211D\x2124\x2126\x2128\x212A-\x212D\x212F-\x2139\x213C-\x213F\x2145-\x2149\x214E\x2183\x2184\x2C00-\x2C2E\x2C30-\x2C5E\x2C60-\x2CE4\x2CEB-\x2CEE\x2CF2\x2CF3\x2D00-\x2D25\x2D27\x2D2D\x2D30-\x2D67\x2D6F\x2D80-\x2D96\x2DA0-\x2DA6\x2DA8-\x2DAE\x2DB0-\x2DB6\x2DB8-\x2DBE\x2DC0-\x2DC6\x2DC8-\x2DCE\x2DD0-\x2DD6\x2DD8-\x2DDE\x2E2F\x3005\x3006\x3031-\x3035\x303B\x303C\x3041-\x3096\x309D-\x309F\x30A1-\x30FA\x30FC-\x30FF\x3105-\x312D\x3131-\x318E\x31A0-\x31BA\x31F0-\x31FF\x3400-\x4DB5\x4E00-\x9FD5\xA000-\xA48C\xA4D0-\xA4FD\xA500-\xA60C\xA610-\xA61F\xA62A\xA62B\xA640-\xA66E\xA67F-\xA69D\xA6A0-\xA6E5\xA717-\xA71F\xA722-\xA788\xA78B-\xA7AE\xA7B0-\xA7B7\xA7F7-\xA801\xA803-\xA805\xA807-\xA80A\xA80C-\xA822\xA840-\xA873\xA882-\xA8B3\xA8F2-\xA8F7\xA8FB\xA8FD\xA90A-\xA925\xA930-\xA946\xA960-\xA97C\xA984-\xA9B2\xA9CF\xA9E0-\xA9E4\xA9E6-\xA9EF\xA9FA-\xA9FE\xAA00-\xAA28\xAA40-\xAA42\xAA44-\xAA4B\xAA60-\xAA76\xAA7A\xAA7E-\xAAAF\xAAB1\xAAB5\xAAB6\xAAB9-\xAABD\xAAC0\xAAC2\xAADB-\xAADD\xAAE0-\xAAEA\xAAF2-\xAAF4\xAB01-\xAB06\xAB09-\xAB0E\xAB11-\xAB16\xAB20-\xAB26\xAB28-\xAB2E\xAB30-\xAB5A\xAB5C-\xAB65\xAB70-\xABE2\xAC00-\xD7A3\xD7B0-\xD7C6\xD7CB-\xD7FB\xF900-\xFA6D\xFA70-\xFAD9\xFB00-\xFB06\xFB13-\xFB17\xFB1D\xFB1F-\xFB28\xFB2A-\xFB36\xFB38-\xFB3C\xFB3E\xFB40\xFB41\xFB43\xFB44\xFB46-\xFBB1\xFBD3-\xFD3D\xFD50-\xFD8F\xFD92-\xFDC7\xFDF0-\xFDFB\xFE70-\xFE74\xFE76-\xFEFC\xFF21-\xFF3A\xFF41-\xFF5A\xFF66-\xFFBE\xFFC2-\xFFC7\xFFCA-\xFFCF\xFFD2-\xFFD7\xFFDA-\xFFDC";

bool isSymbol(u_long ch) {
  static CodeRange symbolRange(SYMBOL_RANGE);
  return symbolRange.isInRange(ch);
}


bool isPunctuation(u_long ch) {
  static CodeRange punctuationRange(PUNCTUATION_RANGE);
  return punctuationRange.isInRange(ch);
}

bool isLetter(u_long ch) {
  // for speed
  if (ch >= 'a' && ch <= 'z') {
    return true;
  }
  if (ch >= 'Z' && ch <= 'Z') {
    return true;
  }
  if (ch >= '0' && ch <= '9') {
    return true;
  }
  if (isCJK(ch)) {
    return true;
  }
  if (ch =='\'') {
    return false;
  }
  //
  static CodeRange letterRange(LETTER_RANGE);
  return letterRange.isInRange(ch);

}
