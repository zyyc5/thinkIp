
let php ={};

php.pack = function(format) {
  //  discuss at: http://locutus.io/php/pack/
  // original by: Tim de Koning (http://www.kingsquare.nl)
  //    parts by: Jonas Raoni Soares Silva (http://www.jsfromhell.com)
  // bugfixed by: Tim de Koning (http://www.kingsquare.nl)
  //      note 1: Float encoding by: Jonas Raoni Soares Silva
  //      note 1: Home: http://www.kingsquare.nl/blog/12-12-2009/13507444
  //      note 1: Feedback: phpjs-pack@kingsquare.nl
  //      note 1: "machine dependent byte order and size" aren't
  //      note 1: applicable for JavaScript; pack works as on a 32bit,
  //      note 1: little endian machine.
  //   example 1: pack('nvc*', 0x1234, 0x5678, 65, 66)
  //   returns 1: '\u00124xVAB'
  //   example 2: pack('H4', '2345')
  //   returns 2: '#E'
  //   example 3: pack('H*', 'D5')
  //   returns 3: 'Õ'
  //   example 4: pack('d', -100.876)
  //   returns 4: "\u0000\u0000\u0000\u0000\u00008YÀ"
  //        test: skip-1
  var formatPointer = 0
  var argumentPointer = 1
  var result = ''
  var argument = ''
  var i = 0
  var r = []
  var instruction, quantifier, word, precisionBits, exponentBits, extraNullCount
  // vars used by float encoding
  var bias
  var minExp
  var maxExp
  var minUnnormExp
  var status
  var exp
  var len
  var bin
  var signal
  var n
  var intPart
  var floatPart
  var lastBit
  var rounded
  var j
  var k
  var tmpResult
  while (formatPointer < format.length) {
    instruction = format.charAt(formatPointer)
    quantifier = ''
    formatPointer++
    while ((formatPointer < format.length) && (format.charAt(formatPointer)
        .match(/[\d*]/) !== null)) {
      quantifier += format.charAt(formatPointer)
      formatPointer++
    }
    if (quantifier === '') {
      quantifier = '1'
    }
    // Now pack variables: 'quantifier' times 'instruction'
    switch (instruction) {
      case 'a':
      case 'A':
        // NUL-padded string
        // SPACE-padded string
        if (typeof arguments[argumentPointer] === 'undefined') {
          throw new Error('Warning:  pack() Type ' + instruction + ': not enough arguments')
        } else {
          argument = String(arguments[argumentPointer])
        }
        if (quantifier === '*') {
          quantifier = argument.length
        }
        for (i = 0; i < quantifier; i++) {
          if (typeof argument[i] === 'undefined') {
            if (instruction === 'a') {
              result += String.fromCharCode(0)
            } else {
              result += ' '
            }
          } else {
            result += argument[i]
          }
        }
        argumentPointer++
        break
      case 'h':
      case 'H':
        // Hex string, low nibble first
        // Hex string, high nibble first
        if (typeof arguments[argumentPointer] === 'undefined') {
          throw new Error('Warning: pack() Type ' + instruction + ': not enough arguments')
        } else {
          argument = arguments[argumentPointer]
        }
        if (quantifier === '*') {
          quantifier = argument.length
        }
        if (quantifier > argument.length) {
          var msg = 'Warning: pack() Type ' + instruction + ': not enough characters in string'
          throw new Error(msg)
        }
        for (i = 0; i < quantifier; i += 2) {
          // Always get per 2 bytes...
          word = argument[i]
          if (((i + 1) >= quantifier) || typeof argument[i + 1] === 'undefined') {
            word += '0'
          } else {
            word += argument[i + 1]
          }
          // The fastest way to reverse?
          if (instruction === 'h') {
            word = word[1] + word[0]
          }
          result += String.fromCharCode(parseInt(word, 16))
        }
        argumentPointer++
        break
      case 'c':
      case 'C':
        // signed char
        // unsigned char
        // c and C is the same in pack
        if (quantifier === '*') {
          quantifier = arguments.length - argumentPointer
        }
        if (quantifier > (arguments.length - argumentPointer)) {
          throw new Error('Warning:  pack() Type ' + instruction + ': too few arguments')
        }
        for (i = 0; i < quantifier; i++) {
          result += String.fromCharCode(arguments[argumentPointer])
          argumentPointer++
        }
        break
      case 's':
      case 'S':
      case 'v':
        // signed short (always 16 bit, machine byte order)
        // unsigned short (always 16 bit, machine byte order)
        // s and S is the same in pack
        if (quantifier === '*') {
          quantifier = arguments.length - argumentPointer
        }
        if (quantifier > (arguments.length - argumentPointer)) {
          throw new Error('Warning:  pack() Type ' + instruction + ': too few arguments')
        }
        for (i = 0; i < quantifier; i++) {
          result += String.fromCharCode(arguments[argumentPointer] & 0xFF)
          result += String.fromCharCode(arguments[argumentPointer] >> 8 & 0xFF)
          argumentPointer++
        }
        break
      case 'n':
        // unsigned short (always 16 bit, big endian byte order)
        if (quantifier === '*') {
          quantifier = arguments.length - argumentPointer
        }
        if (quantifier > (arguments.length - argumentPointer)) {
          throw new Error('Warning: pack() Type ' + instruction + ': too few arguments')
        }
        for (i = 0; i < quantifier; i++) {
          result += String.fromCharCode(arguments[argumentPointer] >> 8 & 0xFF)
          result += String.fromCharCode(arguments[argumentPointer] & 0xFF)
          argumentPointer++
        }
        break
      case 'i':
      case 'I':
      case 'l':
      case 'L':
      case 'V':
        // signed integer (machine dependent size and byte order)
        // unsigned integer (machine dependent size and byte order)
        // signed long (always 32 bit, machine byte order)
        // unsigned long (always 32 bit, machine byte order)
        // unsigned long (always 32 bit, little endian byte order)
        if (quantifier === '*') {
          quantifier = arguments.length - argumentPointer
        }
        if (quantifier > (arguments.length - argumentPointer)) {
          throw new Error('Warning:  pack() Type ' + instruction + ': too few arguments')
        }
        for (i = 0; i < quantifier; i++) {
          result += String.fromCharCode(arguments[argumentPointer] & 0xFF)
          result += String.fromCharCode(arguments[argumentPointer] >> 8 & 0xFF)
          result += String.fromCharCode(arguments[argumentPointer] >> 16 & 0xFF)
          result += String.fromCharCode(arguments[argumentPointer] >> 24 & 0xFF)
          argumentPointer++
        }
        break
      case 'N':
        // unsigned long (always 32 bit, big endian byte order)
        if (quantifier === '*') {
          quantifier = arguments.length - argumentPointer
        }
        if (quantifier > (arguments.length - argumentPointer)) {
          throw new Error('Warning:  pack() Type ' + instruction + ': too few arguments')
        }
        for (i = 0; i < quantifier; i++) {
          result += String.fromCharCode(arguments[argumentPointer] >> 24 & 0xFF)
          result += String.fromCharCode(arguments[argumentPointer] >> 16 & 0xFF)
          result += String.fromCharCode(arguments[argumentPointer] >> 8 & 0xFF)
          result += String.fromCharCode(arguments[argumentPointer] & 0xFF)
          argumentPointer++
        }
        break
      case 'f':
      case 'd':
        // float (machine dependent size and representation)
        // double (machine dependent size and representation)
        // version based on IEEE754
        precisionBits = 23
        exponentBits = 8
        if (instruction === 'd') {
          precisionBits = 52
          exponentBits = 11
        }
        if (quantifier === '*') {
          quantifier = arguments.length - argumentPointer
        }
        if (quantifier > (arguments.length - argumentPointer)) {
          throw new Error('Warning:  pack() Type ' + instruction + ': too few arguments')
        }
        for (i = 0; i < quantifier; i++) {
          argument = arguments[argumentPointer]
          bias = Math.pow(2, exponentBits - 1) - 1
          minExp = -bias + 1
          maxExp = bias
          minUnnormExp = minExp - precisionBits
          status = isNaN(n = parseFloat(argument)) || n === -Infinity || n === +Infinity ? n : 0
          exp = 0
          len = 2 * bias + 1 + precisionBits + 3
          bin = new Array(len)
          signal = (n = status !== 0 ? 0 : n) < 0
          n = Math.abs(n)
          intPart = Math.floor(n)
          floatPart = n - intPart
          for (k = len; k;) {
            bin[--k] = 0
          }
          for (k = bias + 2; intPart && k;) {
            bin[--k] = intPart % 2
            intPart = Math.floor(intPart / 2)
          }
          for (k = bias + 1; floatPart > 0 && k; --floatPart) {
            (bin[++k] = ((floatPart *= 2) >= 1) - 0)
          }
          for (k = -1; ++k < len && !bin[k];) {}
          // @todo: Make this more readable:
          var key = (lastBit = precisionBits - 1 +
            (k =
              (exp = bias + 1 - k) >= minExp &&
              exp <= maxExp ? k + 1 : bias + 1 - (exp = minExp - 1))) + 1
          if (bin[key]) {
            if (!(rounded = bin[lastBit])) {
              for (j = lastBit + 2; !rounded && j < len; rounded = bin[j++]) {}
            }
            for (j = lastBit + 1; rounded && --j >= 0;
            (bin[j] = !bin[j] - 0) && (rounded = 0)) {}
          }
          for (k = k - 2 < 0 ? -1 : k - 3; ++k < len && !bin[k];) {}
          if ((exp = bias + 1 - k) >= minExp && exp <= maxExp) {
            ++k
          } else {
            if (exp < minExp) {
              if (exp !== bias + 1 - len && exp < minUnnormExp) {
                // "encodeFloat::float underflow"
              }
              k = bias + 1 - (exp = minExp - 1)
            }
          }
          if (intPart || status !== 0) {
            exp = maxExp + 1
            k = bias + 2
            if (status === -Infinity) {
              signal = 1
            } else if (isNaN(status)) {
              bin[k] = 1
            }
          }
          n = Math.abs(exp + bias)
          tmpResult = ''
          for (j = exponentBits + 1; --j;) {
            tmpResult = (n % 2) + tmpResult
            n = n >>= 1
          }
          n = 0
          j = 0
          k = (tmpResult = (signal ? '1' : '0') + tmpResult + (bin
            .slice(k, k + precisionBits)
            .join(''))
          ).length
          r = []
          for (; k;) {
            n += (1 << j) * tmpResult.charAt(--k)
            if (j === 7) {
              r[r.length] = String.fromCharCode(n)
              n = 0
            }
            j = (j + 1) % 8
          }
          r[r.length] = n ? String.fromCharCode(n) : ''
          result += r.join('')
          argumentPointer++
        }
        break
      case 'x':
        // NUL byte
        if (quantifier === '*') {
          throw new Error('Warning: pack(): Type x: \'*\' ignored')
        }
        for (i = 0; i < quantifier; i++) {
          result += String.fromCharCode(0)
        }
        break
      case 'X':
        // Back up one byte
        if (quantifier === '*') {
          throw new Error('Warning: pack(): Type X: \'*\' ignored')
        }
        for (i = 0; i < quantifier; i++) {
          if (result.length === 0) {
            throw new Error('Warning: pack(): Type X:' + ' outside of string')
          } else {
            result = result.substring(0, result.length - 1)
          }
        }
        break
      case '@':
        // NUL-fill to absolute position
        if (quantifier === '*') {
          throw new Error('Warning: pack(): Type X: \'*\' ignored')
        }
        if (quantifier > result.length) {
          extraNullCount = quantifier - result.length
          for (i = 0; i < extraNullCount; i++) {
            result += String.fromCharCode(0)
          }
        }
        if (quantifier < result.length) {
          result = result.substring(0, quantifier)
        }
        break
      default:
        throw new Error('Warning: pack() Type ' + instruction + ': unknown format code')
    }
  }
  if (argumentPointer < arguments.length) {
    var msg2 = 'Warning: pack(): ' + (arguments.length - argumentPointer) + ' arguments unused'
    throw new Error(msg2)
  }
  return result}

php.unpack = function(prefix, moreEntropy) {
  //  discuss at: http://locutus.io/php/uniqid/
  // original by: Kevin van Zonneveld (http://kvz.io)
  //  revised by: Kankrelune (http://www.webfaktory.info/)
  //      note 1: Uses an internal counter (in locutus global) to avoid collision
  //   example 1: var $id = uniqid()
  //   example 1: var $result = $id.length === 13
  //   returns 1: true
  //   example 2: var $id = uniqid('foo')
  //   example 2: var $result = $id.length === (13 + 'foo'.length)
  //   returns 2: true
  //   example 3: var $id = uniqid('bar', true)
  //   example 3: var $result = $id.length === (23 + 'bar'.length)
  //   returns 3: true
  if (typeof prefix === 'undefined') {
    prefix = ''
  }
  var retId
  var _formatSeed = function (seed, reqWidth) {
    seed = parseInt(seed, 10).toString(16) // to hex str
    if (reqWidth < seed.length) {
      // so long we split
      return seed.slice(seed.length - reqWidth)
    }
    if (reqWidth > seed.length) {
      // so short we pad
      return Array(1 + (reqWidth - seed.length)).join('0') + seed
    }
    return seed
  }
  var $global = (typeof window !== 'undefined' ? window : global)
  $global.$locutus = $global.$locutus || {}
  var $locutus = $global.$locutus
  $locutus.php = $locutus.php || {}
  if (!$locutus.php.uniqidSeed) {
    // init seed with big random int
    $locutus.php.uniqidSeed = Math.floor(Math.random() * 0x75bcd15)
  }
  $locutus.php.uniqidSeed++
  // start with prefix, add current milliseconds hex string
  retId = prefix
  retId += _formatSeed(parseInt(new Date().getTime() / 1000, 10), 8)
  // add seed hex string
  retId += _formatSeed($locutus.php.uniqidSeed, 5)
  if (moreEntropy) {
    // for more entropy we add a float lower to 10
    retId += (Math.random() * 10).toFixed(8).toString()
  }
  return retId }


php.long2ip = function(ip) {
        // Valid range: 0.0.0.0 -> 255.255.255.255
       if (!isFinite(ip)) {
	    return false
	  }
	  return [ip >>> 24, ip >>> 16 & 0xFF, ip >>> 8 & 0xFF, ip & 0xFF].join('.')
    }


php.ip2long = function(argIP) {
  //  discuss at: http://locutus.io/php/ip2long/
  // original by: Waldo Malqui Silva (http://waldo.malqui.info)
  // improved by: Victor
  //  revised by: fearphage (http://http/my.opera.com/fearphage/)
  //  revised by: Theriault (https://github.com/Theriault)
  //    estarget: es2015
  //   example 1: ip2long('192.0.34.166')
  //   returns 1: 3221234342
  //   example 2: ip2long('0.0xABCDEF')
  //   returns 2: 11259375
  //   example 3: ip2long('255.255.255.256')
  //   returns 3: false
  let i = 0
  // PHP allows decimal, octal, and hexadecimal IP components.
  // PHP allows between 1 (e.g. 127) to 4 (e.g 127.0.0.1) components.
  const pattern = new RegExp([
    '^([1-9]\\d*|0[0-7]*|0x[\\da-f]+)',
    '(?:\\.([1-9]\\d*|0[0-7]*|0x[\\da-f]+))?',
    '(?:\\.([1-9]\\d*|0[0-7]*|0x[\\da-f]+))?',
    '(?:\\.([1-9]\\d*|0[0-7]*|0x[\\da-f]+))?$'
  ].join(''), 'i')
  argIP = argIP.match(pattern) // Verify argIP format.
  if (!argIP) {
    // Invalid format.
    return false
  }
  // Reuse argIP variable for component counter.
  argIP[0] = 0
  for (i = 1; i < 5; i += 1) {
    argIP[0] += !!((argIP[i] || '').length)
    argIP[i] = parseInt(argIP[i]) || 0
  }
  // Continue to use argIP for overflow values.
  // PHP does not allow any component to overflow.
  argIP.push(256, 256, 256, 256)
  // Recalculate overflow of last component supplied to make up for missing components.
  argIP[4 + argIP[0]] *= Math.pow(256, 4 - argIP[0])
  if (argIP[1] >= argIP[5] ||
    argIP[2] >= argIP[6] ||
    argIP[3] >= argIP[7] ||
    argIP[4] >= argIP[8]) {
    return false
  }
  return argIP[1] * (argIP[0] === 1 || 16777216) +
    argIP[2] * (argIP[0] <= 2 || 65536) +
    argIP[3] * (argIP[0] <= 3 || 256) +
    argIP[4] * 1
}

module.exports =php;